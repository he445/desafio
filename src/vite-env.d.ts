/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MOCKING?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_SOCKET_URL?: string
  readonly VITE_MOCK_DEFAULT_SCENARIO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  __mock?: import('./mocks/control').MockControl
}
