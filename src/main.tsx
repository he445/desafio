import { bootCopy } from './content/boot-copy'

function showBootFailure(root: HTMLElement) {
  const box = document.createElement('div')
  box.setAttribute('role', 'alert')
  box.style.cssText =
    'max-width:32rem;margin:20vh auto 0;padding:0 1rem;font-family:monospace;text-align:center'
  const title = document.createElement('h1')
  title.textContent = bootCopy.failedTitle
  const text = document.createElement('p')
  text.textContent = bootCopy.failedText
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = bootCopy.reload
  button.style.cssText = 'margin-top:1rem;padding:.75rem 1.5rem;font:inherit;cursor:pointer'
  button.addEventListener('click', () => window.location.reload())
  box.append(title, text, button)
  root.replaceChildren(box)
}

async function boot(root: HTMLElement) {
  // The app chunk downloads while the worker starts. Evaluating it early is safe because
  // socket.io-client, which captures globalThis.WebSocket, is only imported once the first screen
  // has settled, long after the worker started.
  const app = import('./app/render')
  if (import.meta.env.VITE_API_MOCKING === 'enabled') {
    const { startMocks } = await import('./mocks/browser')
    await startMocks()
  }
  const { renderApp } = await app
  renderApp(root)
}

const root = document.getElementById('root')!
boot(root).catch(() => showBootFailure(root))
