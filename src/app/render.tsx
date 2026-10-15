import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { AppProviders } from './providers'

export function renderApp(container: HTMLElement) {
  createRoot(container).render(
    <StrictMode>
      <AppProviders />
    </StrictMode>,
  )
}
