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
}
