async function boot() {
  if (import.meta.env.VITE_API_MOCKING === 'enabled') {
    const { startMocks } = await import('./mocks/browser')
    await startMocks()
  }
  const { renderApp } = await import('./app/render')
  renderApp(document.getElementById('root')!)
}

void boot()
