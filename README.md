# Kurio — Marketplace de NFTs

Implementação do marketplace de NFTs **Kurio** em React 19 e TypeScript 6, com roteamento tipado via TanStack Router, gerenciamento de estado assíncrono via TanStack Query, cliente HTTP Axios, atualizações em tempo real via Socket.IO e backend simulado no navegador com MSW 2.

- **Demonstração publicada (Vercel):** [https://desafio-rosy-kappa.vercel.app](https://desafio-rosy-kappa.vercel.app)
- **Repositório:** [https://github.com/he445/desafio](https://github.com/he445/desafio)
- **Documentação de arquitetura:** [ARCHITECTURE.md](./ARCHITECTURE.md)

## Requisitos

- Node.js `24.x` (fixado em `.nvmrc` e `package.json#engines`)
- npm `10+`

## Setup a partir de um checkout limpo

```bash
npm ci
npx playwright install chromium
```

Para regerar os assets otimizados (fontes e variantes AVIF/WebP a partir dos PNGs exportados do Figma em `assets/figma/`):

```bash
npm run assets
```

## Variáveis de ambiente

O arquivo `.env` está **intencionalmente versionado** no repositório porque contém apenas constantes públicas da camada de simulação (nenhum segredo ou chave de API). Isso garante que um checkout limpo (`npm ci && npm run ci`) e o deploy na Vercel funcionem imediatamente com os mocks e o WebSocket simulados ativos, sem exigir cópia manual de arquivos ou configuração de painel. Sobrescritas locais devem usar `.env.local` (ignorado no `.gitignore`).

| Variável                     | Padrão                           | Função                                                                               |
| ---------------------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| `VITE_API_MOCKING`           | `enabled`                        | Ativa a interceptação REST (Service Worker) e WebSocket pelo MSW antes do boot da UI |
| `VITE_API_BASE_URL`          | `/api/v1`                        | Prefixo base da instância Axios                                                      |
| `VITE_SOCKET_URL`            | `wss://realtime.nft-market.test` | Endpoint WebSocket interceptado pelo MSW (domínio `.test` reservado pela RFC 2606)   |
| `VITE_MOCK_DEFAULT_SCENARIO` | `default`                        | Cenário inicial carregado pelo banco simulado                                        |

## Credenciais fictícias e cupons de teste

### Usuários pré-cadastrados

| E-mail                  | Senha        | Perfil no seed                                                                                                   |
| ----------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| `marina@nftmarket.test` | `Senha@1234` | 3 favoritos, 2 carteiras cadastradas (Principal na Ethereum e Reserva na Polygon) e 1 pedido anterior confirmado |
| `rafael@nftmarket.test` | `Senha@1234` | Conta limpa (sem favoritos, sem carteiras e sem pedidos)                                                         |

_Observação:_ as senhas nunca são gravadas em claro no banco simulado; o seed utiliza hash PBKDF2-SHA256 (100.000 iterações via Web Crypto) com sal individual por usuário. O nome de usuário `admin` é reservado para exercitar conflitos `409 USERNAME_TAKEN`.

### Cupons promocionais

| Código       | Tipo       | Regra                                                        |
| ------------ | ---------- | ------------------------------------------------------------ |
| `BEMVINDO10` | Percentual | 10% de desconto (`1000` bps) sobre o subtotal                |
| `ETH005`     | Valor fixo | `0.05 ETH` de desconto para subtotais a partir de `0.50 ETH` |
| `VERAO25`    | Expirado   | Retorna `422 COUPON_EXPIRED`                                 |

Qualquer outro código retorna `422 COUPON_INVALID`.

## Cenários do servidor simulado (MSW)

- `?scenario=<id>` na URL aplica o cenário no boot, grava em `localStorage` e tira o parâmetro da URL com `history.replaceState`. Id desconhecido é ignorado.
- `?reset=1` restaura o seed (48 NFTs) no boot e apaga a sessão, o carrinho de visitante e as tentativas de checkout guardadas no navegador. Com `&scenario=<id>`, já aplica o cenário.
- O painel flutuante "Cenários", visível só com os mocks ligados, troca o cenário e reseta o banco (as duas ações recarregam a página). Também muda o preço do Emerald Ape #042 para 1.35 ETH, derruba o WebSocket por 2,5 s e expira a sessão.
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

## Comandos disponíveis

| Script                       | Comando                                                                                       | Descrição                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run dev`                | `vite`                                                                                        | Servidor de desenvolvimento com mocks ativos                                                 |
| `npm run build`              | `tsc -b && vite build`                                                                        | Verificação de tipos e build de produção com mocks ativos                                    |
| `npm run preview`            | `vite preview --port 4173 --strictPort`                                                       | Serve o build otimizado na porta 4173                                                        |
| `npm run typecheck`          | `tsc -b`                                                                                      | Checagem estrita de tipos (`strict: true`, `noUncheckedIndexedAccess: true`)                 |
| `npm run lint`               | `eslint . --max-warnings=0`                                                                   | Lint de código, hooks, acessibilidade (`jsx-a11y`), Router, Query e fronteiras de camadas    |
| `npm run format`             | `prettier --write .`                                                                          | Formatação com ordenação de classes Tailwind                                                 |
| `npm run format:check`       | `prettier --check .`                                                                          | Verificação de formatação sem alterar arquivos                                               |
| `npm run test:unit`          | `vitest run`                                                                                  | Testes unitários de aritmética ETH, formatação e regras de domínio                           |
| `npm run test:e2e`           | `playwright test`                                                                             | Testes E2E em Chromium (desktop, mobile e tablet) contra o build servido pelo `vite preview` |
| `npm run test:e2e:ui`        | `playwright test --ui`                                                                        | Interface interativa do Playwright para depuração local                                      |
| `npm run test:visual`        | `playwright test --grep @visual`                                                              | Regressão visual das telas principais                                                        |
| `npm run test:visual:update` | `playwright test --grep @visual --update-snapshots`                                           | Atualização das baselines de regressão visual                                                |
| `npm run lighthouse`         | `node scripts/lighthouse.mjs`                                                                 | Auditoria Lighthouse (3 execuções por página e perfil)                                       |
| `npm run assets`             | `node scripts/build-assets.mjs`                                                               | Copia a fonte variável e gera as vistas AVIF/WebP dos NFTs                                   |
| `npm run ci`                 | `npm run typecheck && npm run lint && npm run test:unit && npm run build && npm run test:e2e` | Pipeline completo executado no GitHub Actions                                                |

## Rotas da aplicação

| Rota                                 | Tela                                                                   | Acesso                                                 |
| ------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| `/`                                  | Início (hero, destaques, filtros, catálogo paginado, promoções e blog) | Público                                                |
| `/nft/$nftId`                        | Detalhe do NFT (`?edition=<id>` opcional)                              | Público                                                |
| `/cart`                              | Carrinho de NFTs e resumo da carteira                                  | Público                                                |
| `/login`, `/register`                | Autenticação e criação de conta                                        | Visitante (redireciona usuários já autenticados)       |
| `/checkout`                          | Pagamento com carteira e revisão da cotação                            | Privado (redireciona para `/login?redirect=/checkout`) |
| `/orders/$orderId`                   | Estado do pedido (`pending`, `confirmed` com recibo ou `rejected`)     | Privado (restrito ao dono do pedido)                   |
| `/profile`, `/wallets`, `/favorites` | Dados do perfil, carteiras e lista de interesse                        | Privado                                                |

## Arquitetura e decisões técnicas

Consulte o documento [ARCHITECTURE.md](./ARCHITECTURE.md) para detalhes sobre camadas, contratos REST, eventos Socket.IO, política de sessão, estratégia de cache, idempotência e desvios documentados em relação ao Figma.
