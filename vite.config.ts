import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

const fromRoot = (file: string) => fileURLToPath(new URL(file, import.meta.url))

interface ModuleGraph {
  getModuleInfo(
    id: string,
  ): { importedIds: readonly string[]; dynamicallyImportedIds: readonly string[] } | null
}

const isVirtualOrCss = (id: string) => id.startsWith('\0') || /\.css($|\?)/.test(id)

function staticImports(graph: ModuleGraph, root: string): Set<string> {
  const seen = new Set<string>()
  const pending = [root]
  for (let id = pending.pop(); id !== undefined; id = pending.pop()) {
    if (seen.has(id)) continue
    seen.add(id)
    // radix-ui re-exports every primitive; walking it would pull the lazy routes' ones into app.
    if (id.includes('/node_modules/radix-ui/')) continue
    pending.push(...(graph.getModuleInfo(id)?.importedIds ?? []))
  }
  return seen
}

// main.tsx loads the app and the mock with import(), and the first render needs everything the two
// import statically. The default splitting cuts that code into about 25 chunks, most under 2 KB,
// and each one is a request before anything shows. Here it becomes two: the app, with what it
// shares with the mock (zod and the contracts), and the mock. The code behind the other import()
// calls (routes, socket, scenario panel) is split by the same rule: what one of them alone uses
// stays in its chunk and what several share goes to `shared`, so a route asks for two files and
// not ten.
function assignChunks(graph: ModuleGraph): Map<string, string> {
  const entry = staticImports(graph, fromRoot('./src/main.tsx'))
  const app = staticImports(graph, fromRoot('./src/app/render.tsx'))
  const mock = staticImports(graph, fromRoot('./src/mocks/browser.ts'))
  const chunkOf = new Map<string, string>()
  for (const id of new Set([...app, ...mock])) {
    if (!entry.has(id) && !isVirtualOrCss(id)) chunkOf.set(id, app.has(id) ? 'app' : 'mock')
  }

  const usersOf = new Map<string, Set<string>>()
  const visited = new Set<string>()
  const pending = [...app, ...mock].flatMap(
    (id) => graph.getModuleInfo(id)?.dynamicallyImportedIds ?? [],
  )
  for (let lazy = pending.pop(); lazy !== undefined; lazy = pending.pop()) {
    if (visited.has(lazy) || chunkOf.has(lazy) || entry.has(lazy)) continue
    visited.add(lazy)
    for (const id of staticImports(graph, lazy)) {
      if (chunkOf.has(id) || entry.has(id) || isVirtualOrCss(id)) continue
      usersOf.set(id, (usersOf.get(id) ?? new Set()).add(lazy))
      pending.push(...(graph.getModuleInfo(id)?.dynamicallyImportedIds ?? []))
    }
  }
  for (const [id, users] of usersOf) {
    if (users.size > 1) chunkOf.set(id, 'shared')
  }
  return chunkOf
}

function chunkName() {
  let chunkOf: Map<string, string> | undefined
  return (id: string, graph: ModuleGraph): string | null => {
    chunkOf ??= assignChunks(graph)
    return chunkOf.get(id) ?? null
  }
}

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // The entry calls the preload helper too, so in `app` it would make the entry wait
            // for the whole app chunk before importing the mock.
            { name: 'preload', test: /vite\/preload-helper/, priority: 1 },
            { name: chunkName() },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'tough-cookie': fileURLToPath(new URL('./src/mocks/tough-cookie-shim.ts', import.meta.url)),
    },
  },
})
