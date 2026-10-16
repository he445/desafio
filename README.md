# Kurio — Marketplace de NFTs

Implementação do marketplace de NFTs **Kurio** em React 19 e TypeScript 6, com roteamento tipado via TanStack Router, gerenciamento de estado assíncrono via TanStack Query, cliente HTTP Axios, atualizações em tempo real via Socket.IO e backend simulado no navegador com MSW 2.

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

A seleção de cenário pode ser feita de três formas:

1. **Pela URL:** adicionando `?scenario=<id>` (ex.: `/?scenario=slow`). O boot aplica o cenário, persiste em `localStorage` e limpa o parâmetro da URL com `history.replaceState`.
2. **Reset pela URL:** adicionando `?reset=1` (ou `?reset=1&scenario=default`), que restaura o seed original de 48 NFTs, limpa sessões/carrinhos locais e recarrega a aplicação.
3. **Pelo painel flutuante "Cenários"** (ou via `window.__mock` nos testes E2E): permite alternar o cenário ativo, resetar o banco e disparar eventos em tempo real (`changeEdition`, `resolveOrder`, `dropSockets`, `expireSession`).

| ID do cenário           | Comportamento simulado                                                                       | O que exercita                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `default`               | Latência de 40–120 ms; pedido confirma 1,5 s após `pending`                                  | Fluxo padrão e auditoria Lighthouse                                    |
| `empty-catalog`         | Banco inicializado sem NFTs                                                                  | Estado vazio do catálogo                                               |
| `slow`                  | Latência de 1,5–3 s em todas as rotas                                                        | Skeletons com efeito shimmer                                           |
| `race`                  | Listagem `GET /nfts` com latência inversa ao tamanho de `q`                                  | Cancelamento e descarte de respostas fora de ordem                     |
| `flaky`                 | Primeira chamada de cada `GET` falha com HTTP 503                                            | Retry automático do TanStack Query                                     |
| `server-error`          | `GET /nfts` retorna sempre HTTP 500                                                          | Estado de erro de rota com botão "Tentar novamente"                    |
| `offline`               | Todo REST falha na conexão e o WebSocket recusa handshake                                    | Tratamento de indisponibilidade de rede                                |
| `session-expired`       | Sessão expira 60 s após o login                                                              | Expiração durante navegação/checkout com retomada                      |
| `price-change-checkout` | Primeiro `POST /orders` retorna `409 QUOTE_OUTDATED` e emite `nft.updated`                   | Revalidação de cotação no checkout                                     |
| `sold-out-checkout`     | Edição esgota entre a cotação e o envio do pedido (`409 AVAILABILITY_CONFLICT`)              | Tratamento de conflito de estoque no checkout                          |
| `order-timeout`         | `POST /orders` cria o pedido e segura a resposta por 10 s (acima do timeout de 8 s do Axios) | Recuperação do mesmo pedido por `Idempotency-Key` sem compra duplicada |
| `payment-declined`      | Pedido transita de `pending` para `rejected` (`insufficient_funds`)                          | Recusa de pagamento com preservação dos itens no carrinho              |
| `wallet-rejected`       | `POST /wallet-connections` retorna `409 WALLET_REJECTED`                                     | Recusa de assinatura/conexão na carteira                               |
| `wallet-disconnect`     | Conexão da carteira cai antes do envio de `POST /orders` (`409 WALLET_DISCONNECTED`)         | Reconexão de carteira antes de confirmar                               |
| `socket-drop`           | WebSocket cai com pedido pendente e a confirmação ocorre durante a queda                     | Reconciliação via REST ao reconectar/recarregar                        |
| `duplicate-events`      | Todo evento Socket.IO é emitido duas vezes, seguido de um evento com versão anterior         | Deduplicação por `eventId` e proteção contra regressão de `version`    |

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

## Arquitetura e decisões técnicas

Consulte o documento [ARCHITECTURE.md](./ARCHITECTURE.md) para detalhes sobre camadas, contratos REST, eventos Socket.IO, política de sessão, estratégia de cache, idempotência e desvios documentados em relação ao Figma.
