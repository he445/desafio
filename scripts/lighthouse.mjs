import { execFileSync, spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { launch } from 'chrome-launcher'
import lighthouse, { desktopConfig } from 'lighthouse'
import config from '../lighthouse.config.mjs'

const { values: args } = parseArgs({ options: { url: { type: 'string' } } })
const baseUrl = (args.url ?? config.baseUrl).replace(/\/$/, '')
const outputDir = path.resolve(config.outputDir)
const categories = Object.keys(config.targets)
const metrics = {
  LCP: 'largest-contentful-paint',
  CLS: 'cumulative-layout-shift',
  TBT: 'total-blocking-time',
}

async function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const { chromium } = await import('@playwright/test')
  return chromium.executablePath()
}

async function waitForServer(url, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }
  throw new Error(`${url} did not answer within ${timeoutMs} ms`)
}

async function startPreview() {
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    stdio: 'ignore',
  })
  await waitForServer(baseUrl)
  return preview
}

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function gitCommit() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

function diagnostics(lhr) {
  const audit = (id) => lhr.audits[id]?.details?.items ?? []
  const shortUrl = (url) => (URL.canParse(url) ? new URL(url).pathname : url)
  const lcpNode = audit('lcp-breakdown-insight').find((item) => item.type === 'node')
  const lcpPhases =
    audit('lcp-breakdown-insight').find((item) => item.type === 'table')?.items ?? []
  return {
    lcpElement: lcpNode?.selector ?? 'n/d',
    lcpPhases: lcpPhases.map((item) => `${item.subpart} ${Math.round(item.duration)} ms`),
    bootup: audit('bootup-time')
      .slice(0, 3)
      .map((item) => `${shortUrl(item.url)} ${Math.round(item.total)} ms`),
    unusedJs: audit('unused-javascript')
      .slice(0, 3)
      .map((item) => `${shortUrl(item.url)} ${Math.round(item.wastedBytes / 1024)} KB`),
    renderBlocking: audit('render-blocking-resources').map((item) => shortUrl(item.url)),
  }
}

async function main() {
  const preview = args.url ? undefined : await startPreview()
  // Disables Chrome's own background requests (sync, field trials) so they do not reach the report.
  const chrome = await launch({
    chromePath: await chromePath(),
    chromeFlags: [
      '--headless=new',
      '--disable-background-networking',
      ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []),
    ],
  })
  await fs.rm(outputDir, { recursive: true, force: true })
  await fs.mkdir(outputDir, { recursive: true })

  const results = []
  try {
    for (const page of config.pages) {
      for (const profile of config.profiles) {
        for (let run = 1; run <= config.runs; run++) {
          const runner = await lighthouse(
            `${baseUrl}${page.path}`,
            { port: chrome.port, output: ['html', 'json'], logLevel: 'error' },
            profile === 'desktop' ? desktopConfig : undefined,
          )
          const name = `${page.id}-${profile}-${run}`
          const [html, json] = runner.report
          await fs.writeFile(path.join(outputDir, `${name}.report.html`), html)
          await fs.writeFile(path.join(outputDir, `${name}.report.json`), json)
          const { lhr } = runner
          const scores = Object.fromEntries(
            categories.map((id) => [id, Math.round((lhr.categories[id]?.score ?? 0) * 100)]),
          )
          console.log(`${name} ${categories.map((id) => `${id}=${scores[id]}`).join(' ')}`)
          results.push({ page: page.id, profile, run, lhr, scores })
        }
      }
    }
  } finally {
    await chrome.kill()
    preview?.kill()
  }

  const first = results[0].lhr
  const environment = {
    date: new Date().toISOString(),
    commit: gitCommit(),
    url: baseUrl,
    lighthouse: first.lighthouseVersion,
    userAgent: first.environment.hostUserAgent,
    node: process.version,
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: `${os.cpus()[0]?.model ?? 'n/d'} x${os.cpus().length}`,
    benchmarkIndex: Math.round(median(results.map((r) => r.lhr.environment.benchmarkIndex))),
  }

  const groups = []
  for (const page of config.pages) {
    for (const profile of config.profiles) {
      const runs = results.filter((r) => r.page === page.id && r.profile === profile)
      const scores = Object.fromEntries(
        categories.map((id) => [id, median(runs.map((r) => r.scores[id]))]),
      )
      const values = Object.fromEntries(
        Object.entries(metrics).map(([label, id]) => [
          label,
          median(runs.map((r) => r.lhr.audits[id].numericValue)),
        ]),
      )
      const settings = runs[0].lhr.configSettings
      const medianRun = runs.find((r) => r.scores.performance === scores.performance) ?? runs[0]
      groups.push({
        page: page.id,
        path: page.path,
        profile,
        scores,
        values,
        throttling: `${settings.throttlingMethod}, RTT ${settings.throttling.rttMs} ms, ${Math.round(settings.throttling.throughputKbps)} Kbps, CPU ${settings.throttling.cpuSlowdownMultiplier}x`,
        screen: `${settings.screenEmulation.width}x${settings.screenEmulation.height} @${settings.screenEmulation.deviceScaleFactor}${settings.screenEmulation.mobile ? ' mobile' : ''}`,
        below: categories.filter((id) => scores[id] < config.targets[id]),
        diagnostics: diagnostics(medianRun.lhr),
        medianRun: `${page.id}-${profile}-${medianRun.run}`,
      })
    }
  }

  await fs.writeFile(
    path.join(outputDir, 'summary.json'),
    `${JSON.stringify({ environment, targets: config.targets, runs: config.runs, groups }, null, 2)}\n`,
  )
  await fs.writeFile(path.join(outputDir, 'summary.md'), renderSummary(environment, groups))
  console.log(`summary: ${path.relative(process.cwd(), path.join(outputDir, 'summary.md'))}`)
}

function renderSummary(environment, groups) {
  const lines = [
    '# Lighthouse: medianas',
    '',
    `${config.runs} execuções por página e perfil (${groups.length * config.runs} no total), mediana por categoria. Reset de storage padrão ligado: cada execução é um primeiro acesso, com registro do Service Worker do MSW.`,
    '',
    `| Página | Perfil | ${categories.join(' | ')} | LCP | CLS | TBT |`,
    `| --- | --- | ${categories.map(() => '---').join(' | ')} | --- | --- | --- |`,
    ...groups.map(
      (g) =>
        `| \`${g.path}\` | ${g.profile} | ${categories.map((id) => g.scores[id]).join(' | ')} | ${(g.values.LCP / 1000).toFixed(2)} s | ${g.values.CLS.toFixed(3)} | ${Math.round(g.values.TBT)} ms |`,
    ),
    '',
    `Metas: ${categories.map((id) => `${id} ≥ ${config.targets[id]}`).join(', ')}.`,
    '',
    '## Ambiente',
    '',
    `- Data: ${environment.date}`,
    `- Commit: ${environment.commit}`,
    `- URL: ${environment.url}`,
    `- Lighthouse ${environment.lighthouse}, Node ${environment.node}`,
    `- Chrome: ${environment.userAgent}`,
    `- Sistema: ${environment.os}; CPU: ${environment.cpu}; benchmarkIndex mediano ${environment.benchmarkIndex}`,
    ...[...new Set(groups.map((g) => g.profile))].map((profile) => {
      const g = groups.find((item) => item.profile === profile)
      return `- ${profile}: ${g.throttling}; tela ${g.screen}`
    }),
  ]

  const below = groups.filter((g) => g.below.length > 0)
  if (below.length > 0) {
    lines.push('', '## Abaixo da meta', '')
    for (const g of below) {
      const d = g.diagnostics
      lines.push(
        `### \`${g.path}\` ${g.profile}: ${g.below.map((id) => `${id} ${g.scores[id]}`).join(', ')}`,
        '',
        `Diagnósticos da execução mediana (\`${g.medianRun}\`):`,
        '',
        `- Elemento do LCP: \`${d.lcpElement}\` (${d.lcpPhases.join('; ')})`,
        `- bootup-time: ${d.bootup.join('; ') || 'nada relevante'}`,
        `- unused-javascript: ${d.unusedJs.join('; ') || 'nada relevante'}`,
        `- render-blocking-resources: ${d.renderBlocking.join('; ') || 'nenhum'}`,
        '',
      )
      const note = config.notes?.[`${g.page}-${g.profile}`]
      if (note) lines.push(note, '')
    }
  }
  return `${lines.join('\n').trimEnd()}\n`
}

await main()
