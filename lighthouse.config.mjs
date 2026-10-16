const mobileNote =
  'Causa: o MSW e o registro do Service Worker ficam no caminho crítico de todo primeiro acesso; sob 4x de CPU a avaliação dos chunks do app e do mock passa de 1 s e a imagem do LCP só é pedida depois do worker ativo e das respostas da API. Tentado e mantido: `tldts` trocado por shim (chunk do mock de 177,6 para 65,1 KB gzip), app baixado em paralelo ao `worker.start()`, prioridade na primeira linha da grade do celular, favicon próprio. Não feito: adiar o worker, abrir sem o mock, trocar imagens ou tirar seções (proibido pela regra da auditoria). Detalhes em ARCHITECTURE §15.'

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
