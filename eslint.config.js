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

const appCode = [
  'src/app/**/*.{ts,tsx}',
  'src/routes/**/*.{ts,tsx}',
  'src/features/**/*.{ts,tsx}',
  'src/components/**/*.{ts,tsx}',
  'src/lib/**/*.{ts,tsx}',
  'src/contracts/**/*.{ts,tsx}',
  'src/content/**/*.{ts,tsx}',
]

const uiCode = [
  'src/routes/**/*.{ts,tsx}',
  'src/components/**/*.{ts,tsx}',
  'src/features/*/components/**/*.{ts,tsx}',
  'src/features/*/hooks/**/*.{ts,tsx}',
]

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
    files: appCode,
    rules: {
      'no-restricted-imports': ['error', { paths: [noAxios], patterns: [noMocks] }],
    },
  },
  {
    files: uiCode,
    rules: {
      'no-restricted-imports': ['error', { paths: [noAxios], patterns: [noMocks, noHttp] }],
    },
  },
  {
    files: ['src/lib/http.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [noMocks] }],
    },
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
