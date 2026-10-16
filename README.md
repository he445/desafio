# Kurio — Marketplace de NFTs

Marketplace de NFTs da Kurio em React 19 e TypeScript 6, com TanStack Router, TanStack Query e Axios. Não há backend: o MSW 2 simula a API REST no Service Worker e um servidor Socket.IO no WebSocket da própria aba, com banco em `localStorage`, regras de estoque, cotação e pedido, e cenários de falha que se trocam pela URL ou por um painel.

Até aqui estão prontos o servidor simulado (31 rotas REST, eventos e 16 cenários) e a casca da aplicação: layout desktop e mobile, todas as rotas, sessão no boot, proteção das rotas privadas e as telas de 404. As telas de catálogo, carrinho, pagamento, pedido e conta ainda mostram só o título e a navegação, o detalhe mostra o nome do NFT vindo da API, e o cliente Socket.IO ainda não está ligado.

- Demonstração: [desafio-rosy-kappa.vercel.app](https://desafio-rosy-kappa.vercel.app)
- Repositório: [github.com/he445/desafio](https://github.com/he445/desafio)
- Arquitetura e decisões: [ARCHITECTURE.md](./ARCHITECTURE.md)

## Requisitos

- Node.js 24 (`.nvmrc` e `engines` do `package.json`)
- npm 10 ou mais novo

## Setup

```bash
npm ci
npx playwright install chromium
npm run dev
```

O `npm run assets` regera a fonte de `public/fonts/` e as imagens de `public/images/nfts/` a partir dos PNGs de `assets/figma/`. Os arquivos gerados já estão no repositório; o comando só é necessário se as artes mudarem.

## Variáveis de ambiente

O `.env` é versionado porque só tem os padrões públicos da simulação, sem segredo. Assim `npm ci && npm run ci` e o deploy funcionam sem configuração. Para sobrescrever algo localmente, use `.env.local`, que o Git ignora.

| Variável                     | Padrão                           | Função                                                                                    |
| ---------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| `VITE_API_MOCKING`           | `enabled`                        | Com `enabled`, o `src/main.tsx` sobe o MSW (REST e WebSocket) antes de renderizar o app   |
| `VITE_API_BASE_URL`          | `/api/v1`                        | Prefixo da instância do Axios e das rotas do mock                                         |
| `VITE_SOCKET_URL`            | `wss://realtime.nft-market.test` | Endereço do WebSocket que o MSW intercepta; o domínio `.test` é reservado e nunca resolve |
| `VITE_MOCK_DEFAULT_SCENARIO` | `default`                        | Cenário usado enquanto o navegador não tiver outro guardado                               |

## Credenciais e cupons de teste

| E-mail                  | Senha        | No seed                                                                                        |
| ----------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| `marina@nftmarket.test` | `Senha@1234` | 3 favoritos, carteira principal na Ethereum, reserva na Polygon e 1 pedido anterior confirmado |
| `rafael@nftmarket.test` | `Senha@1234` | Sem favoritos, carteiras ou pedidos                                                            |

O banco simulado guarda as senhas como hash PBKDF2-SHA256 (100.000 iterações, via Web Crypto) com sal por usuário. Os nomes de usuário `admin`, `root`, `support` e `kurio` são reservados e respondem `409 USERNAME_TAKEN` no cadastro.

| Código       | Tipo       | Regra                                                        |
| ------------ | ---------- | ------------------------------------------------------------ |
| `BEMVINDO10` | Percentual | 10% de desconto (`1000` bps) sobre o subtotal                |
| `ETH005`     | Valor fixo | `0.05 ETH` de desconto para subtotais a partir de `0.50 ETH` |
| `VERAO25`    | Expirado   | Responde `422 COUPON_EXPIRED`                                |

Qualquer outro código responde `422 COUPON_INVALID`.

## Cenários do servidor simulado (MSW)

- `?scenario=<id>` na URL aplica o cenário no boot, grava em `localStorage` e tira o parâmetro da URL com `history.replaceState`. Id desconhecido é ignorado.
- `?reset=1` restaura o seed (48 NFTs) no boot e apaga a sessão, o carrinho de visitante e as tentativas de checkout guardadas no navegador. Com `&scenario=<id>`, já aplica o cenário.
- O painel flutuante "Cenários", carregado sob demanda e só com os mocks ligados, troca o cenário e reseta o banco (as duas ações recarregam a página). Também muda o preço do Emerald Ape #042 para 1.35 ETH, derruba o WebSocket por 2,5 s e expira a sessão. Os testes o escondem com `window.__hideScenarioPanel = true` num `addInitScript`.
- Nos testes, tudo isso passa por `window.__mock` (`setScenario`, `reset`, `setRules`, `hold`, `release`, `changeEdition`, `resolveOrder`, `emitRaw`, `dropSockets`, `expireSession`, `countOrders`).

| Id                      | O que faz                                                                                                                                                    | Exercita                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| `default`               | Latência de 40 a 120 ms; o pedido confirma 1,5 s depois de criado                                                                                            | Fluxo feliz e Lighthouse             |
| `empty-catalog`         | Banco sem NFTs                                                                                                                                               | Catálogo vazio                       |
| `slow`                  | Latência de 1,5 a 3 s em todas as rotas                                                                                                                      | Skeletons                            |
| `race`                  | `GET /nfts` com latência inversa ao tamanho de `q`                                                                                                           | Respostas fora de ordem              |
| `flaky`                 | A primeira chamada de cada `GET` responde `503`                                                                                                              | Retry e recuperação                  |
| `server-error`          | `GET /nfts` responde sempre `500`                                                                                                                            | Erro com "Tentar novamente"          |
| `offline`               | Todo REST falha na conexão e o WebSocket recusa o handshake                                                                                                  | Indisponibilidade                    |
| `session-expired`       | A sessão expira 60 s depois do login                                                                                                                         | Expiração na navegação e no checkout |
| `price-change-checkout` | O primeiro `POST /orders` de cada usuário sobe em 0.15 ETH o preço da primeira linha, emite `nft.updated` e responde `409 QUOTE_OUTDATED` com a cotação nova | Revalidação com nova confirmação     |
| `sold-out-checkout`     | O primeiro `POST /orders` esgota a edição da primeira linha e responde `409 AVAILABILITY_CONFLICT`                                                           | Conflito de estoque no pedido        |
| `order-timeout`         | `POST /orders` cria o pedido e só responde depois de 10 s (o timeout do Axios é 8 s)                                                                         | Recuperação pela `Idempotency-Key`   |
| `payment-declined`      | O pedido vai a `rejected` com `insufficient_funds`                                                                                                           | Recusa com carrinho preservado       |
| `wallet-rejected`       | `POST /wallet-connections` responde `409 WALLET_REJECTED`                                                                                                    | Recusa na carteira                   |
| `wallet-disconnect`     | No primeiro `POST /orders`, a conexão da carteira cai (`409 WALLET_DISCONNECTED`); depois de reconectar, segue                                               | Reconexão da carteira                |
| `socket-drop`           | 250 ms depois do pedido, o socket cai e recusa conexões por 1,5 s; a confirmação acontece nesse intervalo                                                    | Reconciliação via REST               |
| `duplicate-events`      | Todo evento sai duas vezes, seguido de uma cópia com versão anterior                                                                                         | Deduplicação e versão                |

## Comandos

| Script                 | Comando                                                                                       | Função                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run dev`          | `vite`                                                                                        | Desenvolvimento com os mocks ligados                                                  |
| `npm run build`        | `tsc -b && vite build`                                                                        | Checagem de tipos e build, com os mocks ligados                                       |
| `npm run preview`      | `vite preview --port 4173 --strictPort`                                                       | Serve o build na porta 4173 (o Playwright usa este)                                   |
| `npm run typecheck`    | `tsc -b`                                                                                      | Tipos em modo estrito, com `noUncheckedIndexedAccess`                                 |
| `npm run lint`         | `eslint . --max-warnings=0`                                                                   | Código, hooks, acessibilidade (`jsx-a11y`), Router, Query e fronteiras entre camadas  |
| `npm run format`       | `prettier --write .`                                                                          | Formatação, com ordenação das classes do Tailwind                                     |
| `npm run format:check` | `prettier --check .`                                                                          | Confere a formatação sem alterar arquivos                                             |
| `npm run test:unit`    | `vitest run`                                                                                  | Testes unitários (seção Testes)                                                       |
| `npm run test:e2e`     | `playwright test`                                                                             | Testes E2E em Chromium contra o build servido pelo `vite preview`                     |
| `npm run test:e2e:ui`  | `playwright test --ui`                                                                        | Interface do Playwright para depuração local                                          |
| `npm run assets`       | `node scripts/build-assets.mjs`                                                               | Copia a fonte variável e gera as vistas AVIF e WebP dos NFTs                          |
| `npm run ci`           | `npm run typecheck && npm run lint && npm run test:unit && npm run build && npm run test:e2e` | O mesmo pipeline do GitHub Actions, que antes confere a formatação com `format:check` |

## Testes

```bash
npm run test:unit
npm run test:e2e
```

- Unitários (`src/**/*.test.ts`, Vitest): aritmética de ETH, formatação, contratos, cliente HTTP, ledger de eventos e regras do banco simulado. A suíte roda no fuso `America/Sao_Paulo` (`vitest.config.ts`), para as datas não dependerem da máquina.
- E2E (`tests/e2e`, Playwright): o `webServer` faz o build e sobe o `vite preview` na porta 4173. Os projetos são `desktop` (1440 × 900) e `mobile` (Pixel 7, 390 × 844); o `tablet` (768 × 1024) roda só os testes marcados com `@responsive`.
  - `00-smoke`: o mock sobe antes do app e o refresh em `/cart` funciona.
  - `00-mock-api`: chama as 31 rotas REST por `fetch` dentro da página e valida status e corpo com os schemas de `src/contracts`. Roda só no `desktop`, porque o contrato não depende da tela.
  - `00-routes`: acesso direto a cada rota pública, 404 de rota e de NFT, rota privada que manda ao login e volta depois de entrar, e `redirect` para outro site ignorado.
- `tests/support/fixtures.ts` esconde o painel de cenários em todo teste; `gotoReady` navega e espera `data-mocks="ready"`.
- O relatório HTML fica em `playwright-report/` (`npx playwright show-report`); trace, vídeo e screenshot de cada falha ficam em `test-results/`. No CI, as duas pastas sobem como artefato quando o job falha.
- Fora do CI, o Playwright reaproveita um `vite preview` que já esteja na porta 4173. Depois de mudar o código, pare esse servidor para os testes rodarem sobre o build novo.

## Rotas

| Rota                                 | Tela                                                     | Acesso                                                      |
| ------------------------------------ | -------------------------------------------------------- | ----------------------------------------------------------- |
| `/`                                  | Início e catálogo                                        | Público                                                     |
| `/nft/$nftId`                        | Detalhe do NFT (`?edition=<id>` opcional)                | Público                                                     |
| `/cart`                              | Carrinho                                                 | Público, de visitante ou do usuário logado                  |
| `/login`, `/register`                | Login e cadastro                                         | Visitante; com sessão, segue para `redirect` ou `/`         |
| `/checkout`                          | Pagamento                                                | Privado: sem sessão, vai para `/login?redirect=%2Fcheckout` |
| `/orders/$orderId`                   | Pedido (`pending`, `confirmed` com recibo ou `rejected`) | Privado; a API só entrega o pedido ao dono                  |
| `/profile`, `/wallets`, `/favorites` | Perfil, carteiras e lista de interesse                   | Privado                                                     |

## Deploy

A Vercel roda `npm run build` e serve `dist/` (`vercel.json`), em Node 24. Todo caminho que não é arquivo cai no `index.html`, então acesso direto e refresh funcionam em qualquer rota. `/assets/*` tem cache imutável de um ano e o `mockServiceWorker.js` vai com `no-cache`, para o navegador não ficar preso a um worker antigo. O painel da Vercel não tem variável de ambiente: o `.env` versionado já liga os mocks.

As decisões de arquitetura, os contratos e as limitações estão em [ARCHITECTURE.md](./ARCHITECTURE.md).
