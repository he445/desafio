import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

const fromRoot = (file: string) => fileURLToPath(new URL(file, import.meta.url))

interface ModuleGraph {
  getModuleInfo(id: string): { importedIds: readonly string[] } | null
}

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
// shares with the mock (zod and the contracts), and the mock.
function bootChunkName() {
  let chunkOf: Map<string, string> | undefined
  return (id: string, graph: ModuleGraph): string | null => {
    if (!chunkOf) {
      const entry = staticImports(graph, fromRoot('./src/main.tsx'))
      const app = staticImports(graph, fromRoot('./src/app/render.tsx'))
      const mock = staticImports(graph, fromRoot('./src/mocks/browser.ts'))
      chunkOf = new Map()
      for (const moduleId of new Set([...app, ...mock])) {
        if (entry.has(moduleId) || moduleId.startsWith('\0') || /\.css($|\?)/.test(moduleId))
          continue
        chunkOf.set(moduleId, app.has(moduleId) ? 'app' : 'mock')
      }
    }
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
            { name: bootChunkName() },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      tldts: fileURLToPath(new URL('./src/mocks/tldts-shim.ts', import.meta.url)),
    },
  },
})
