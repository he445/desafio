import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'
import globals from 'globals'

const noMocks = {
  group: ['@/mocks', '@/mocks/**', '**/mocks', '**/mocks/**'],
  message: 'App code cannot import from mocks/. Only main.tsx may load it, through import().',
}

const noAxios = {
  name: 'axios',
  message: 'Use the single instance from src/lib/http.ts.',
}

const noHttp = {
  group: ['@/lib/http'],
  message: 'Components and routes get data from the hooks in features/*/queries.ts.',
}

// Imports flow routes/ -> features/ -> lib/, contracts/, components/; each layer lists what it
// may not reach back into.
function notFrom(layers, message) {
  return { group: layers.flatMap((layer) => [`@/${layer}`, `@/${layer}/**`]), message }
}

function restrictImports(patterns, { allowAxios = false } = {}) {
  return {
    'no-restricted-imports': ['error', { paths: allowAxios ? [] : [noAxios], patterns }],
  }
}

const featureLayers = notFrom(['app', 'routes'], 'features/ cannot depend on routes/ or app/.')
const componentLayers = notFrom(
  ['app', 'routes', 'features'],
  'Components receive data through props; routes and features wire them up.',
)
const libLayers = notFrom(
  ['app', 'routes', 'features', 'components'],
  'lib/ holds framework-free helpers and cannot depend on app layers.',
)

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.tanstack/**',
      'public/mockServiceWorker.js',
      'src/routeTree.gen.ts',
      'playwright-report/**',
      'test-results/**',
      'reports/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginQuery.configs['flat/recommended'],
  ...pluginRouter.configs['flat/recommended'],
  jsxA11y.flatConfigs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: restrictImports([noMocks]),
  },
  {
    files: ['src/routes/**/*.{ts,tsx}'],
    rules: restrictImports([noMocks, noHttp, notFrom(['app'], 'Routes do not import app/.')]),
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: restrictImports([noMocks, featureLayers]),
  },
  {
    files: ['src/features/*/components/**/*.{ts,tsx}', 'src/features/*/hooks/**/*.{ts,tsx}'],
    rules: restrictImports([noMocks, noHttp, featureLayers]),
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: restrictImports([noMocks, noHttp, componentLayers]),
  },
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: restrictImports([noMocks, libLayers]),
  },
  {
    files: ['src/lib/http.ts'],
    rules: restrictImports([noMocks, libLayers], { allowAxios: true }),
  },
  {
    files: ['src/content/**/*.{ts,tsx}'],
    rules: restrictImports([
      noMocks,
      notFrom(
        ['app', 'routes', 'features', 'components', 'lib'],
        'content/ holds static text and only reuses contract messages.',
      ),
    ]),
  },
  {
    files: ['src/contracts/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [noAxios],
          patterns: [
            noMocks,
            {
              group: [
                '@/app/**',
                '@/routes/**',
                '@/features/**',
                '@/components/**',
                '@/content/**',
                '@/lib/*',
                '!@/lib/eth',
              ],
              message:
                'contracts/ is shared with mocks/, so it only depends on zod and lib/eth.ts.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/mocks/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [noAxios],
          patterns: [
            {
              group: [
                '@/app/**',
                '@/routes/**',
                '@/features/**',
                '@/components/**',
                '@/content/**',
                '@/lib/*',
                '!@/lib/eth',
              ],
              message: 'mocks/ only shares src/contracts/ and src/lib/eth.ts with the app.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/routes/**/*.{ts,tsx}', 'src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
)
