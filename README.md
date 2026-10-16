# Kurio — Marketplace de NFTs

Marketplace de NFTs da Kurio em React 19 e TypeScript 6, com TanStack Router, TanStack Query e Axios. Não há backend: o MSW 2 simula a API REST no Service Worker e um servidor Socket.IO no WebSocket da própria aba, com banco em `localStorage`, regras de estoque, cotação e pedido, e cenários de falha que se trocam pela URL ou por um painel.

Até aqui estão prontos o servidor simulado (31 rotas REST, eventos e 16 cenários), a casca da aplicação e o Início: hero, catálogo com busca, filtros, abas, ordenação e paginação na URL, promoções e blog, em desktop e mobile; o detalhe do NFT (galeria, edição, quantidade com limite, compra e favorito otimista), a lista de interesse, login, cadastro, logout e expiração da sessão com retomada. As telas de carrinho, pagamento, pedido, perfil e carteiras ainda mostram só o título e a navegação, e o cliente Socket.IO ainda não está ligado.

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

No login, um e-mail ou senha errados mostram "E-mail ou senha incorretos"; no cadastro, `marina@nftmarket.test` testa o "E-mail já cadastrado". A senha nova precisa de pelo menos 8 caracteres, com letras e números. Para testar a expiração, use o cenário `session-expired` (sessão de 60 s) ou `window.__mock.expireSession()`.

O banco simulado guarda as senhas como hash PBKDF2-SHA256 (100.000 iterações, via Web Crypto) com sal por usuário. Os nomes de usuário `admin`, `root`, `support` e `kurio` são reservados e respondem `409 USERNAME_TAKEN` no cadastro.

| Código       | Tipo       | Regra                                                        |
| ------------ | ---------- | ------------------------------------------------------------ |
| `BEMVINDO10` | Percentual | 10% de desconto (`1000` bps) sobre o subtotal                |
| `ETH005`     | Valor fixo | `0.05 ETH` de desconto para subtotais a partir de `0.50 ETH` |
| `VERAO25`    | Expirado   | Responde `422 COUPON_EXPIRED`                                |

Qualquer outro código responde `422 COUPON_INVALID`.

Para ver os avisos do carrinho, ponha a edição 1/50 de Emerald Ape #042 no carrinho e use, no painel de cenários, "Emerald Ape #042 a 1.35 ETH" (aviso de preço) ou, no console, `window.__mock.changeEdition({ nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-50', available: 1 })` com 2 unidades no carrinho (estoque insuficiente, que bloqueia "Conectar e finalizar" até o ajuste).

## Cenários do servidor simulado (MSW)

- `?scenario=<id>` na URL aplica o cenário no boot, grava em `localStorage` e tira o parâmetro da URL com `history.replaceState`. Id desconhecido é ignorado.
- `?reset=1` restaura o seed (48 NFTs) no boot e apaga a sessão, o carrinho de visitante e as tentativas de checkout guardadas no navegador. Com `&scenario=<id>`, já aplica o cenário.
- O painel flutuante "Cenários", carregado sob demanda e só com os mocks ligados, troca o cenário e reseta o banco (as duas ações recarregam a página). Também muda o preço do Emerald Ape #042 para 1.35 ETH, derruba o WebSocket por 2,5 s e expira a sessão. Os testes o escondem com `window.__hideScenarioPanel = true` num `addInitScript`.
- Nos testes, tudo isso passa por `window.__mock` (`setScenario`, `reset`, `setRules`, `hold`, `release`, `changeEdition`, `resolveOrder`, `emitRaw`, `dropSockets`, `listSockets`, `expireSession`, `countOrders`).

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

### Reproduzir os fluxos de falha do pagamento

Entre como Marina (`marina@nftmarket.test`), coloque um item no carrinho, abra `/checkout` e conecte a MetaMask em "Carteira e rede". Escolha o cenário pelo painel "Cenários" ou abrindo `/?reset=1&scenario=<id>` antes de montar o carrinho.

| Fluxo            | Cenário                 | O que acontece ao clicar em "Confirmar compra"                                                                                                                                                                                             |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Recusa           | `payment-declined`      | O pedido nasce `pending` e passa a `rejected`; a página do pedido mostra "Pagamento recusado" com o motivo, "Voltar ao carrinho" (itens preservados) e "Tentar de novo"                                                                    |
| Timeout          | `order-timeout`         | Depois de 8 s aparece "Verificando seu pedido…"; o reenvio com a mesma `Idempotency-Key` devolve o pedido já criado, e `window.__mock.countOrders('user-marina')` continua em 1. Recarregar a página durante a espera leva ao mesmo pedido |
| Preço alterado   | `price-change-checkout` | `409 QUOTE_OUTDATED`: o botão fica bloqueado e aparece o total antes e agora; "Revisar nova cotação" libera uma nova confirmação, com chave nova                                                                                           |
| Edição esgotada  | `sold-out-checkout`     | `409 AVAILABILITY_CONFLICT`: aviso de estoque, "Remova os itens esgotados para continuar." e o link "Voltar ao carrinho"                                                                                                                   |
| Carteira caiu    | `wallet-disconnect`     | `409 WALLET_DISCONNECTED`: a opção mostra "Desconectada · Reconectar"; reconectar e confirmar cria o pedido                                                                                                                                |
| Carteira recusou | `wallet-rejected`       | A conexão falha e a opção mostra "Recusada · Tentar de novo"                                                                                                                                                                               |
| Queda do socket  | `socket-drop`           | A confirmação acontece com o socket fora; o polling de reserva e a reconciliação na volta mostram o recibo                                                                                                                                 |

Sem cenário, com o Emerald Ape #042 (1/50) no carrinho, o botão "Emerald Ape #042 a 1.35 ETH" do painel "Cenários" muda o preço pelo socket: o pagamento bloqueia "Confirmar compra" até "Revisar nova cotação".

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

- Unitários (`src/**/*.test.ts`, Vitest): aritmética de ETH, formatação, contratos, cliente HTTP, ledger de eventos, regras do banco simulado o estado do catálogo (busca na URL, faixa de preço, paginação e srcsets), a escolha de edição e o limite de quantidade do detalhe, a troca otimista da lista de favoritos e, no carrinho, o total da linha, os avisos por linha e os motivos que bloqueiam o pagamento; no pagamento, os reenvios com a mesma chave e a busca nos pendentes depois do último, a carteira padrão por rede, o comprador preenchido do perfil e da carteira e quando uma cotação fica atrás do ledger; no tempo real, as portas de schema, dono, duplicata e versão, o patch de detalhe, destaques e favoritos e quais mudanças viram anúncio. Na conta, a validação de tipo e tamanho do avatar e a escolha das mensagens de erro da API que vão para os campos do formulário. A suíte roda no fuso `America/Sao_Paulo` (`vitest.config.ts`), para as datas não dependerem da máquina.
- E2E (`tests/e2e`, Playwright): o `webServer` faz o build e sobe o `vite preview` na porta 4173. Os projetos são `desktop` (1440 × 900) e `mobile` (Pixel 7, 390 × 844); o `tablet` (768 × 1024) roda só os testes marcados com `@responsive`.
  - `00-smoke`: o mock sobe antes do app e o refresh em `/cart` funciona.
  - `00-mock-api`: chama as 31 rotas REST por `fetch` dentro da página e valida status e corpo com os schemas de `src/contracts`. Roda só no `desktop`, porque o contrato não depende da tela.
  - `00-routes`: acesso direto a cada rota pública, 404 de rota e de NFT, rota privada que manda ao login e volta depois de entrar, e `redirect` para outro site ignorado.
  - `01-catalog`, em `desktop` e `mobile`: busca, filtros combinados, faixa de preço, ordenação, paginação, voltar e avançar, página além da última, resposta atrasada que não substitui a vista nova (com `mock.hold`), estado vazio, anúncio da contagem de resultados, imagem do LCP e dots do carrossel. Em cada teste, os parâmetros da requisição são conferidos contra os da URL.
  - `02-nft-detail`, em `desktop` e `mobile`: acesso direto e refresh, NFT inexistente, `?edition=` esgotada ou inventada, troca de edição pela URL, stepper travado no limite (contando o que já está no carrinho), compra que leva a `/cart`, galeria pelas setas do teclado e o botão de carrinho da barra mobile.
  - `03-auth-session`, em `desktop` e `mobile`: `EMAIL_TAKEN` no campo com foco, cadastro que entra logado e segue o `redirect`, regras de senha e confirmação, credencial errada com resumo focado, `/checkout` sem sessão → login → volta, expiração (`mock.expireSession`) que volta ao mesmo lugar para o mesmo usuário e vai para `/` para outro, e logout seguido de outro login sem nenhum dado do anterior na tela.
  - `04-favorites`, em `desktop` e `mobile`: o coração muda com a requisição ainda presa (`mock.hold`) e continua depois do refresh; com `PUT /me/favorites/:id` falhando, volta ao estado anterior e avisa, e a nova tentativa persiste; lista vazia; visitante que favorita vai ao login e volta ao detalhe.
  - `05-cart`, em `desktop` e `mobile`: compra do detalhe que chega ao carrinho e sobrevive ao refresh; subtotal, taxa e total iguais aos da resposta de `POST /quotes`; `PATCH` da quantidade e `409` de estoque tratado (o estoque cai com `mock.changeEdition` sem a tela saber); aviso de preço que só informa e estoque insuficiente que bloqueia até "Ajustar para 2"; remoção com o foco na linha seguinte e o carrinho vazio; cupom inválido e expirado no campo, `BEMVINDO10` em chip com o desconto da cotação e a remoção; visitante que vai ao login por "Conectar e finalizar" e encontra os itens depois de entrar; contador do header (só `desktop`).
  - `06-checkout-success`: do detalhe ao recibo, que só aparece depois do `confirmed` (pendente primeiro, um pedido só, "Explorador (simulado)" sem sair do app, recibo que não reabre sozinho no refresh); um item adicionado em outra aba durante o pagamento continua no carrinho depois da compra; no `desktop`, o perfil do colecionador vem preenchido da carteira principal, a conexão MetaMask libera "Confirmar compra", Solana aparece como "(sem carteira)" e trocar para Polygon troca endereço e ENS e pede nova conexão; no `mobile`, as carteiras salvas aparecem como opções e a escolhida é conectada.
  - `07-checkout-failures`, em `desktop` e `mobile`: duplo clique cria um pedido só; pedido de outro usuário mostra "Você não tem acesso a este pedido"; recusa (`payment-declined`) com o carrinho preservado; timeout (`order-timeout`) que recupera o mesmo pedido pelo reenvio; `QUOTE_OUTDATED` revisado e confirmado com o preço novo; `AVAILABILITY_CONFLICT` que aponta para o carrinho; `WALLET_DISCONNECTED` que reconecta e segue; `wallet-rejected` com a compra bloqueada.
  - `08-profile-wallets`, em `desktop` e `mobile`, com `rafael`: campo obrigatório vazio e `USERNAME_TAKEN` (409) no campo, com foco; perfil salvo que volta igual depois do refresh; troca de senha com regras no cliente, `WRONG_PASSWORD` (422) em "Senha atual" e a senha nova aceita no login seguinte, enquanto a antiga é recusada; avatar GIF recusado, PNG de 900 × 600 que vira WebP de 256 px e sobrevive ao refresh, e "Remover"; carteiras vazias, "Adicionar" que leva o foco ao formulário, endereço inválido para a rede, "Igual à carteira principal", `WALLET_CONFLICT` (409) no campo do endereço e as duas carteiras salvas depois do refresh.
  - `09-realtime-checkout`, em `desktop` e `mobile`: com o carrinho aberto, `mock.changeEdition` muda o preço e o aviso da linha, o subtotal e um único anúncio chegam pelo socket, sem recarregar a página; a queda de estoque bloqueia "Conectar e finalizar" até "Ajustar para 2"; o detalhe mostra o preço novo; no pagamento, a mudança de preço desabilita "Confirmar compra", mostra o valor antes e agora e libera de novo depois de "Revisar nova cotação".
  - `10-realtime-resilience`, em `desktop` e `mobile`: no cenário `duplicate-events`, o evento repetido e o de versão anterior (mais um `mock.emitRaw` com preço velho) não regridem o preço e geram um anúncio só; sair do detalhe e voltar não duplica ouvinte; com o socket derrubado por 3,5 s (`mock.dropSockets`), aparece "Reconectando…" e o preço mudado durante a queda chega pela reconciliação REST; o socket se autentica no login e volta a anônimo no logout (só `desktop`); no `socket-drop`, a confirmação ocorrida durante a queda aparece depois da reconexão; refresh com o `POST /orders` ainda em voo (`order-timeout`) cai no mesmo pedido, sem segunda compra.
  - `12-loading-recovery`: skeleton do catálogo, do detalhe e do carrinho (linhas e resumo) no cenário `slow`, erro com "Tentar novamente" no `server-error` e no `offline` (carrinho), recuperação sozinha no `flaky`, catálogo vazio, recuperação depois de uma falha de rede, erro do detalhe e falha da cotação no resumo do carrinho que se recuperam, simulados com `mock.setRules`. Também o skeleton do perfil no `slow` e o erro de `GET /me/wallets` que se recupera com "Tentar novamente".
- `tests/support/fixtures.ts` esconde o painel de cenários em todo teste, oferece `loginAs(page, 'marina')` (login pelo formulário, sem injetar token), aceita o cenário como opção (`test.use({ scenario: 'slow' })`, aplicado antes da primeira carga) e entrega o `mock`, um driver tipado sobre `window.__mock`. `gotoReady` navega e espera `data-mocks="ready"`. `tests/support/catalog.ts` descreve o catálogo pelo que a pessoa faz (buscar, filtrar, ordenar, paginar), seja na barra lateral do desktop ou no Sheet do mobile. `tests/support/nft-detail.ts` faz o mesmo com o detalhe (coluna do desktop ou barra de compra do mobile). `tests/support/cart.ts` monta o carrinho de visitante pela API (`seedGuestCart`) e descreve a tela do carrinho; `tests/support/checkout.ts` monta o carrinho, entra como Marina por `/login?redirect=/checkout` e descreve as opções de carteira e o botão de confirmar; o `mock.changeEdition` muda preço e estoque no servidor simulado. `mock.waitForSocket(userId)` espera a conexão do usuário certo antes de o teste disparar um evento, e `tests/support/announcements.ts` grava cada texto da live region para contar anúncios.
- O relatório HTML fica em `playwright-report/` (`npx playwright show-report`); trace, vídeo e screenshot de cada falha ficam em `test-results/`. No CI, as duas pastas sobem como artefato quando o job falha.
- Fora do CI, o Playwright reaproveita um `vite preview` que já esteja na porta 4173. Depois de mudar o código, pare esse servidor para os testes rodarem sobre o build novo.

## Rotas

| Rota                                 | Tela                                                                                                                                                   | Acesso                                                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                                  | Início e catálogo                                                                                                                                      | Público                                                                                                                                                            |
| `/nft/$nftId`                        | Detalhe do NFT: galeria, edição, quantidade, compra e favorito (`?edition=<id>` opcional; esgotada ou inexistente vira aviso e a primeira com estoque) | Público; favoritar sem sessão leva ao login e volta                                                                                                                |
| `/cart`                              | Carrinho: linhas com quantidade e remoção, avisos de preço e estoque, cupom, resumo da cotação e "Conectar e finalizar"                                | Público, de visitante ou do usuário logado                                                                                                                         |
| `/login`, `/register`                | Login e cadastro                                                                                                                                       | Visitante; com sessão, segue para `redirect` ou `/`. No desktop, Dialog sobre o Início; no mobile, tela cheia. `?reason=expired` mostra o aviso de sessão expirada |
| `/checkout`                          | Pagamento: perfil do colecionador, carteira e rede, conexão simulada da carteira e revisão da cotação na rede escolhida                                | Privado: sem sessão, vai para `/login?redirect=%2Fcheckout`                                                                                                        |
| `/orders/$orderId`                   | Pedido: `pending` com polling de reserva, `confirmed` com recibo (abre sozinho uma vez) e "Explorador (simulado)", `rejected` com o motivo             | Privado; a API só entrega o pedido ao dono                                                                                                                         |
| `/profile`, `/wallets`, `/favorites` | Perfil, carteiras e lista de interesse (`/favorites` lista os NFTs favoritados)                                                                        | Privado                                                                                                                                                            |

## Deploy

A Vercel roda `npm run build` e serve `dist/` (`vercel.json`), em Node 24. Todo caminho que não é arquivo cai no `index.html`, então acesso direto e refresh funcionam em qualquer rota. `/assets/*` tem cache imutável de um ano e o `mockServiceWorker.js` vai com `no-cache`, para o navegador não ficar preso a um worker antigo. O painel da Vercel não tem variável de ambiente: o `.env` versionado já liga os mocks.

As decisões de arquitetura, os contratos e as limitações estão em [ARCHITECTURE.md](./ARCHITECTURE.md).
