# Lighthouse: medianas

3 execuções por página e perfil (12 no total), mediana por categoria. Reset de storage padrão ligado: cada execução é um primeiro acesso, com registro do Service Worker do MSW.

| Página | Perfil | performance | accessibility | best-practices | seo | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | mobile | 85 | 96 | 100 | 100 | 3.67 s | 0.000 | 177 ms |
| `/` | desktop | 99 | 100 | 100 | 100 | 0.99 s | 0.000 | 8 ms |
| `/nft/emerald-ape-042` | mobile | 85 | 100 | 100 | 100 | 3.70 s | 0.000 | 152 ms |
| `/nft/emerald-ape-042` | desktop | 99 | 100 | 100 | 100 | 0.95 s | 0.000 | 13 ms |

Metas: performance ≥ 90, accessibility ≥ 95, best-practices ≥ 95, seo ≥ 90.

## Ambiente

- Data: 2026-10-17T01:24:06.753Z
- Commit: d97ad24
- URL: http://localhost:4173
- Lighthouse 13.5.0, Node v22.22.0
- Chrome: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36
- Sistema: Linux 6.18.44-fc-v139 x64; CPU: Intel(R) Xeon(R) Processor @ 2.80GHz x4; benchmarkIndex mediano 2226
- mobile: simulate, RTT 150 ms, 1638 Kbps, CPU 4x; tela 412x823 @1.75 mobile
- desktop: simulate, RTT 40 ms, 10240 Kbps, CPU 1x; tela 1350x940 @1

## Abaixo da meta

### `/` mobile: performance 85

Diagnósticos da execução mediana (`home-mobile-1`):

- Elemento do LCP: `a.block > div.relative > picture.contents > img.aspect-square` (timeToFirstByte 9 ms; resourceLoadDelay 362 ms; resourceLoadDuration 19 ms; elementRenderDelay 38 ms)
- bootup-time: /assets/app-D0rTIB5T.js 508 ms; Unattributable 499 ms; /assets/mock-DE0GGg6C.js 244 ms
- unused-javascript: /assets/app-D0rTIB5T.js 99 KB; /assets/mock-DE0GGg6C.js 38 KB
- render-blocking-resources: nenhum

Causa: o MSW e o registro do Service Worker ficam no caminho crítico de todo primeiro acesso, e a imagem do LCP só é pedida depois do worker ativo, das respostas da API (com a latência de 40 a 120 ms do `default`) e do render com os dados, que sob 4x de CPU passa de 250 ms. Tentado e mantido: `tldts` trocado por shim (chunk do mock de 177,6 para 65,1 KB gzip), boot em dois chunks (app e mock) em vez de 25, arquivos estáticos saindo no primeiro handler do MSW, `dir` explícito no Toaster, app baixado em paralelo ao `worker.start()`, prioridade na primeira linha da grade do celular, favicon próprio. Tentado e descartado por não mudar a nota: baixar o código da rota durante o boot do worker e zod sem JIT. Não feito: adiar o worker, abrir sem o mock, trocar imagens ou tirar seções (proibido pela regra da auditoria). Detalhes em ARCHITECTURE §15.

### `/nft/emerald-ape-042` mobile: performance 85

Diagnósticos da execução mediana (`nft-mobile-1`):

- Elemento do LCP: `div.flex > div.min-w-0 > picture.contents > img.h-[356px]` (timeToFirstByte 4 ms; resourceLoadDelay 387 ms; resourceLoadDuration 24 ms; elementRenderDelay 19 ms)
- bootup-time: Unattributable 397 ms; /assets/app-D0rTIB5T.js 382 ms; /assets/mock-DE0GGg6C.js 218 ms
- unused-javascript: /assets/app-D0rTIB5T.js 104 KB; /assets/mock-DE0GGg6C.js 42 KB
- render-blocking-resources: nenhum

Causa: o MSW e o registro do Service Worker ficam no caminho crítico de todo primeiro acesso, e a imagem do LCP só é pedida depois do worker ativo, das respostas da API (com a latência de 40 a 120 ms do `default`) e do render com os dados, que sob 4x de CPU passa de 250 ms. Tentado e mantido: `tldts` trocado por shim (chunk do mock de 177,6 para 65,1 KB gzip), boot em dois chunks (app e mock) em vez de 25, arquivos estáticos saindo no primeiro handler do MSW, `dir` explícito no Toaster, app baixado em paralelo ao `worker.start()`, prioridade na primeira linha da grade do celular, favicon próprio. Tentado e descartado por não mudar a nota: baixar o código da rota durante o boot do worker e zod sem JIT. Não feito: adiar o worker, abrir sem o mock, trocar imagens ou tirar seções (proibido pela regra da auditoria). Detalhes em ARCHITECTURE §15.
