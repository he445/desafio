import { delay, HttpResponse, type PathParams } from 'msw'
import { MockHttpError } from '@/mocks/domain/errors'
import { getActiveScenarioId } from './registry'

export interface NetworkRule {
  match: {
    method?: string
    path: string
    query?: Record<string, string>
  }
  latencyMs?: number | [min: number, max: number]
  fail?:
    | {
        kind: 'network'
      }
    | {
        kind: 'http'
        status: number
        code: string
        message?: string
      }
  times?: number
  gate?: string
}

function createMulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let prng = createMulberry32(0x4b555249)
let customRules: Array<NetworkRule & { remaining?: number }> = []
let flakySeenPaths = new Set<string>()
const gates = new Map<string, { promise: Promise<void>; resolve: () => void }>()

export function resetNetworkState(): void {
  prng = createMulberry32(0x4b555249)
  customRules = []
  flakySeenPaths = new Set<string>()
  for (const g of gates.values()) {
    g.resolve()
  }
  gates.clear()
}

export function setCustomNetworkRules(rules: NetworkRule[]): void {
  customRules = rules.map((r) => ({
    ...r,
    remaining: r.times,
  }))
}

export function clearCustomNetworkRules(): void {
  customRules = []
}

export function holdMatchingRequest(match: NetworkRule['match']): string {
  const gateId = `gate-${crypto.randomUUID().slice(0, 8)}`
  let resolveFn!: () => void
  const promise = new Promise<void>((resolve) => {
    resolveFn = resolve
  })
  gates.set(gateId, { promise, resolve: resolveFn })
  customRules.push({
    match,
    gate: gateId,
    times: 1,
    remaining: 1,
  })
  return gateId
}

export function releaseRequestGate(gateId: string): void {
  const gate = gates.get(gateId)
  if (gate) {
    gate.resolve()
    gates.delete(gateId)
  }
}

function sampleLatency(latency: number | [number, number]): number {
  if (typeof latency === 'number') return latency
  const [min, max] = latency
  return Math.round(min + prng() * (max - min))
}

function ruleMatchesRequest(rule: NetworkRule, request: Request): boolean {
  const url = new URL(request.url)
  if (rule.match.method && rule.match.method.toUpperCase() !== request.method.toUpperCase()) {
    return false
  }
  if (!url.pathname.endsWith(rule.match.path) && url.pathname !== rule.match.path) {
    return false
  }
  if (rule.match.query) {
    for (const [k, v] of Object.entries(rule.match.query)) {
      if (url.searchParams.get(k) !== v) {
        return false
      }
    }
  }
  return true
}

export function buildErrorResponse(params: {
  status: number
  code: string
  message: string
  fieldErrors?: Record<string, string[]>
  details?: Record<string, unknown>
  retryable?: boolean
  requestId: string
}): Response {
  const retryable =
    params.retryable ?? (params.status === 429 || params.status === 500 || params.status === 503)

  return HttpResponse.json(
    {
      error: {
        code: params.code,
        message: params.message,
        fieldErrors: params.fieldErrors,
        details: params.details ?? {},
        retryable,
        requestId: params.requestId,
      },
    },
    {
      status: params.status,
      headers: {
        'X-Request-Id': params.requestId,
      },
    },
  )
}

export function withNetwork<
  Params extends Record<string, string | readonly string[] | undefined> = PathParams,
>(
  routeId: string,
  resolver: (ctx: {
    request: Request
    params: Params
    requestId: string
  }) => Promise<Response> | Response,
) {
  return async ({
    request,
    params,
  }: {
    request: Request
    params: PathParams
  }): Promise<Response> => {
    const requestId = request.headers.get('X-Request-Id') || crypto.randomUUID()
    const scenarioId = getActiveScenarioId()
    const url = new URL(request.url)

    for (const rule of customRules) {
      if (rule.remaining !== undefined && rule.remaining <= 0) continue
      if (!ruleMatchesRequest(rule, request)) continue

      if (rule.remaining !== undefined) {
        rule.remaining -= 1
      }

      if (rule.latencyMs !== undefined) {
        await delay(sampleLatency(rule.latencyMs))
      }

      if (rule.gate) {
        const g = gates.get(rule.gate)
        if (g) {
          await g.promise
        }
      }

      if (rule.fail) {
        if (rule.fail.kind === 'network') {
          return HttpResponse.error()
        }
        return buildErrorResponse({
          status: rule.fail.status,
          code: rule.fail.code,
          message: rule.fail.message ?? 'Falha simulada na requisição.',
          requestId,
        })
      }
    }

    if (scenarioId === 'offline') {
      await delay(30)
      return HttpResponse.error()
    }

    if (scenarioId === 'server-error' && routeId === 'GET /nfts') {
      await delay(60)
      return buildErrorResponse({
        status: 500,
        code: 'INTERNAL',
        message: 'Não foi possível carregar o catálogo. Tente novamente.',
        retryable: true,
        requestId,
      })
    }

    if (scenarioId === 'flaky' && request.method.toUpperCase() === 'GET') {
      const flakyKey = `${routeId}:${url.search}`
      if (!flakySeenPaths.has(flakyKey)) {
        flakySeenPaths.add(flakyKey)
        await delay(50)
        return buildErrorResponse({
          status: 503,
          code: 'UNAVAILABLE',
          message: 'Serviço temporariamente indisponível.',
          retryable: true,
          requestId,
        })
      }
    }

    if (scenarioId === 'slow') {
      await delay(sampleLatency([1500, 3000]))
    } else if (scenarioId === 'race' && routeId === 'GET /nfts') {
      const q = url.searchParams.get('q') ?? ''
      const raceDelay = Math.max(60, 900 - q.length * 180)
      await delay(raceDelay)
    } else {
      await delay(sampleLatency([40, 120]))
    }

    try {
      const response = await resolver({ request, params: params as Params, requestId })
      const headers = new Headers(response.headers)
      headers.set('X-Request-Id', requestId)
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    } catch (err) {
      if (err instanceof MockHttpError) {
        return buildErrorResponse({
          status: err.status,
          code: err.code,
          message: err.message,
          fieldErrors: err.fieldErrors,
          details: err.details,
          retryable: err.retryable,
          requestId,
        })
      }

      if (import.meta.env.DEV) console.error(`Mock handler ${routeId} failed`, err)
      return buildErrorResponse({
        status: 500,
        code: 'INTERNAL',
        message: 'Erro interno no servidor simulado.',
        retryable: true,
        requestId,
      })
    }
  }
}
