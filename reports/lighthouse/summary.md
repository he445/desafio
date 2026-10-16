# Lighthouse: medianas

3 execuções por página e perfil (12 no total), mediana por categoria. Reset de storage padrão ligado: cada execução é um primeiro acesso, com registro do Service Worker do MSW.

| Página | Perfil | performance | accessibility | best-practices | seo | LCP | CLS | TBT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | mobile | 76 | 96 | 100 | 100 | 4.03 s | 0.000 | 392 ms |
| `/` | desktop | 98 | 100 | 100 | 100 | 1.01 s | 0.000 | 51 ms |
| `/nft/emerald-ape-042` | mobile | 80 | 100 | 100 | 100 | 4.08 s | 0.000 | 226 ms |
| `/nft/emerald-ape-042` | desktop | 98 | 100 | 100 | 100 | 1.03 s | 0.000 | 5 ms |

Metas: performance ≥ 90, accessibility ≥ 95, best-practices ≥ 95, seo ≥ 90.

## Ambiente

- Data: 2026-10-16T22:40:11.587Z
- Commit: a9c14ff
- URL: http://localhost:4173
- Lighthouse 13.5.0, Node v22.22.0
- Chrome: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36
- Sistema: Linux 6.18.44-fc-v139 x64; CPU: Intel(R) Xeon(R) Processor @ 2.80GHz x4; benchmarkIndex mediano 1551
- mobile: simulate, RTT 150 ms, 1638 Kbps, CPU 4x; tela 412x823 @1.75 mobile
- desktop: simulate, RTT 40 ms, 10240 Kbps, CPU 1x; tela 1350x940 @1

## Abaixo da meta

### `/` mobile: performance 76

Diagnósticos da execução mediana (`home-mobile-2`):

- Elemento do LCP: `a.block > div.relative > picture.contents > img.aspect-square` (timeToFirstByte 6 ms; resourceLoadDelay 552 ms; resourceLoadDuration 58 ms; elementRenderDelay 70 ms)
- bootup-time: /assets/browser-CP_a22N_.js 565 ms; Unattributable 543 ms; /assets/render-DHdU603R.js 522 ms
- unused-javascript: /assets/render-DHdU603R.js 41 KB; /assets/browser-CP_a22N_.js 39 KB
- render-blocking-resources: nenhum

Causa: o MSW e o registro do Service Worker ficam no caminho crítico de todo primeiro acesso; sob 4x de CPU a avaliação dos chunks do app e do mock passa de 1 s e a imagem do LCP só é pedida depois do worker ativo e das respostas da API. Tentado e mantido: `tldts` trocado por shim (chunk do mock de 177,6 para 65,1 KB gzip), app baixado em paralelo ao `worker.start()`, prioridade na primeira linha da grade do celular, favicon próprio. Não feito: adiar o worker, abrir sem o mock, trocar imagens ou tirar seções (proibido pela regra da auditoria). Detalhes em ARCHITECTURE §15.

### `/nft/emerald-ape-042` mobile: performance 80

Diagnósticos da execução mediana (`nft-mobile-1`):

- Elemento do LCP: `div.flex > div.min-w-0 > picture.contents > img.h-[356px]` (timeToFirstByte 7 ms; resourceLoadDelay 970 ms; resourceLoadDuration 25 ms; elementRenderDelay 24 ms)
- bootup-time: Unattributable 540 ms; /assets/browser-CP_a22N_.js 520 ms; /assets/render-DHdU603R.js 334 ms
- unused-javascript: /assets/render-DHdU603R.js 43 KB; /assets/browser-CP_a22N_.js 40 KB
- render-blocking-resources: nenhum

Causa: o MSW e o registro do Service Worker ficam no caminho crítico de todo primeiro acesso; sob 4x de CPU a avaliação dos chunks do app e do mock passa de 1 s e a imagem do LCP só é pedida depois do worker ativo e das respostas da API. Tentado e mantido: `tldts` trocado por shim (chunk do mock de 177,6 para 65,1 KB gzip), app baixado em paralelo ao `worker.start()`, prioridade na primeira linha da grade do celular, favicon próprio. Não feito: adiar o worker, abrir sem o mock, trocar imagens ou tirar seções (proibido pela regra da auditoria). Detalhes em ARCHITECTURE §15.
