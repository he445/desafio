import type { z } from 'zod'
import type { CartOwner } from '@/contracts'
import type { MockDb, MockUserRecord } from '@/mocks/db/schema'
import { MockHttpError } from '@/mocks/domain/errors'
import { getAuthenticatedUser } from '@/mocks/domain/session'

export async function readJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.output<T>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new MockHttpError({
      status: 400,
      code: 'BAD_REQUEST',
      message: 'O corpo da requisição não é um JSON válido.',
    })
  }

  const result = schema.safeParse(body)
  if (result.success) return result.data

  const fieldErrors: Record<string, string[]> = {}
  for (const issue of result.error.issues) {
    const field = issue.path.map(String).join('.') || 'form'
    fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message]
  }
  throw new MockHttpError({
    status: 422,
    code: 'VALIDATION_FAILED',
    message: 'Revise os campos destacados.',
    fieldErrors,
  })
}

export function requireUser(db: MockDb, request: Request): MockUserRecord {
  return getAuthenticatedUser(db, request.headers.get('Authorization')).user
}

// A token that is present but invalid or expired gets a 401 instead of silently falling back
// to the guest cart, so the client can run the session-expired flow.
export function resolveCartOwner(
  db: MockDb,
  request: Request,
): { owner: CartOwner; guestCartId?: string } {
  if (request.headers.has('Authorization')) {
    return { owner: { kind: 'user', userId: requireUser(db, request).id } }
  }
  return {
    owner: { kind: 'guest' },
    guestCartId: request.headers.get('X-Guest-Cart-Id') || undefined,
  }
}
