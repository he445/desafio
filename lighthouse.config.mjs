const mobileNote =
  'Causa: o MSW e o registro do Service Worker ficam no caminho crítico de todo primeiro acesso, e a imagem do LCP só é pedida depois do worker ativo, das respostas da API (com a latência de 40 a 120 ms do `default`) e do render com os dados, que sob 4x de CPU passa de 250 ms. Tentado e mantido: `tldts` trocado por shim (chunk do mock de 177,6 para 65,1 KB gzip), boot em dois chunks (app e mock) em vez de 25, arquivos estáticos saindo no primeiro handler do MSW, `dir` explícito no Toaster, app baixado em paralelo ao `worker.start()`, prioridade na primeira linha da grade do celular, favicon próprio. Tentado e descartado por não mudar a nota: baixar o código da rota durante o boot do worker e zod sem JIT. Não feito: adiar o worker, abrir sem o mock, trocar imagens ou tirar seções (proibido pela regra da auditoria). Detalhes em ARCHITECTURE §15.'

export default {
  // Local `vite preview` of `dist/`, built with the `default` scenario from `.env`.
  baseUrl: 'http://localhost:4173',
  pages: [
    { id: 'home', path: '/' },
    { id: 'nft', path: '/nft/emerald-ape-042' },
  ],
  profiles: ['mobile', 'desktop'],
  runs: 3,
  targets: {
    performance: 90,
    accessibility: 95,
    'best-practices': 95,
    seo: 90,
  },
  outputDir: 'reports/lighthouse',
  // Written after reading the reports; printed under "Abaixo da meta" when the group misses a target.
  notes: {
    'home-mobile': mobileNote,
    'nft-mobile': mobileNote,
  },
}
