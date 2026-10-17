# Lighthouse: medianas

3 execuções por página e perfil (12 no total), mediana por categoria. Reset de storage padrão ligado: cada execução é um primeiro acesso, com registro do Service Worker do MSW.

| Página | Perfil | performance | accessibility | best-practices | seo | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | mobile | 91 | 96 | 100 | 100 | 3.07 s | 0.000 | 136 ms |
| `/` | desktop | 100 | 100 | 100 | 100 | 0.75 s | 0.000 | 0 ms |
| `/nft/emerald-ape-042` | mobile | 92 | 100 | 100 | 100 | 3.10 s | 0.000 | 83 ms |
| `/nft/emerald-ape-042` | desktop | 100 | 100 | 100 | 100 | 0.70 s | 0.000 | 0 ms |

Metas: performance ≥ 90, accessibility ≥ 95, best-practices ≥ 95, seo ≥ 90.

## Ambiente

- Data: 2026-10-17T03:00:11.100Z
- Commit: d8627a0
- URL: http://localhost:4173
- Lighthouse 13.5.0, Node v22.22.0
- Chrome: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36
- Sistema: Linux 6.18.44-fc-v139 x64; CPU: Intel(R) Xeon(R) Processor @ 2.80GHz x4; benchmarkIndex mediano 2152
- mobile: simulate, RTT 150 ms, 1638 Kbps, CPU 4x; tela 412x823 @1.75 mobile
- desktop: simulate, RTT 40 ms, 10240 Kbps, CPU 1x; tela 1350x940 @1
