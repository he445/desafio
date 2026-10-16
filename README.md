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

Para regerar os assets otimizados (fonte e variantes AVIF/WebP a partir dos PNGs exportados do Figma em `assets/figma/`):

```bash
npm run assets
```

Os PNGs de `assets/figma/` são exportações 4x dos nós do Figma (1000×1000). O script recusa arquivo com menos de 960 px de lado, para nenhuma variante sair ampliada.

## Variáveis de ambiente

O arquivo `.env` está **intencionalmente versionado** no repositório porque contém apenas constantes públicas da camada de simulação (nenhum segredo ou chave de API). Isso garante que um checkout limpo (`npm ci && npm run ci`) e o deploy na Vercel funcionem imediatamente com os mocks e o WebSocket simulados ativos, sem exigir cópia manual de arquivos ou configuração de painel. Sobrescritas locais devem usar `.env.local` (ignorado no `.gitignore`).

| Variável                     | Padrão                           | Função                                                                               |
| ---------------------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| `VITE_API_MOCKING`           | `enabled`                        | Ativa a interceptação REST (Service Worker) e WebSocket pelo MSW antes do boot da UI |
| `VITE_API_BASE_URL`          | `/api/v1`                        | Prefixo base da instância Axios                                                      |
| `VITE_SOCKET_URL`            | `wss://realtime.nft-market.test` | Endpoint WebSocket interceptado pelo MSW (domínio `.test` reservado pela RFC 2606)   |
| `VITE_MOCK_DEFAULT_SCENARIO` | `default`                        | Cenário inicial carregado pelo banco simulado                                        |

## Comandos disponíveis

| Script                       | Comando                                                                                       | Descrição                                                                                                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`                | `vite`                                                                                        | Servidor de desenvolvimento com mocks ativos                                                                                               |
| `npm run build`              | `tsc -b && vite build`                                                                        | Verificação de tipos e build de produção com mocks ativos                                                                                  |
| `npm run preview`            | `vite preview --port 4173 --strictPort`                                                       | Serve o build otimizado na porta 4173                                                                                                      |
| `npm run typecheck`          | `tsc -b`                                                                                      | Checagem estrita de tipos (`strict: true`, `noUncheckedIndexedAccess: true`)                                                               |
| `npm run lint`               | `eslint . --max-warnings=0`                                                                   | Lint de código, hooks, acessibilidade (`jsx-a11y`), Router, Query e fronteiras de camadas                                                  |
| `npm run format`             | `prettier --write .`                                                                          | Formatação com ordenação de classes Tailwind                                                                                               |
| `npm run format:check`       | `prettier --check .`                                                                          | Verificação de formatação sem alterar arquivos                                                                                             |
| `npm run test:unit`          | `vitest run`                                                                                  | Testes unitários de regras de domínio e utilitários                                                                                        |
| `npm run test:e2e`           | `playwright test`                                                                             | Testes E2E em Chromium (desktop e mobile; o projeto tablet roda só os testes com `@responsive`) contra o build servido pelo `vite preview` |
| `npm run test:e2e:ui`        | `playwright test --ui`                                                                        | Interface interativa do Playwright para depuração local                                                                                    |
| `npm run test:visual`        | `playwright test --grep @visual`                                                              | Regressão visual das telas principais                                                                                                      |
| `npm run test:visual:update` | `playwright test --grep @visual --update-snapshots`                                           | Atualização das baselines de regressão visual                                                                                              |
| `npm run lighthouse`         | `node scripts/lighthouse.mjs`                                                                 | Auditoria Lighthouse (3 execuções por página e perfil)                                                                                     |
| `npm run assets`             | `node scripts/build-assets.mjs`                                                               | Copia a fonte variável e gera as vistas AVIF/WebP dos NFTs                                                                                 |
| `npm run ci`                 | `npm run typecheck && npm run lint && npm run test:unit && npm run build && npm run test:e2e` | Pipeline completo executado no GitHub Actions                                                                                              |

`test:visual`, `test:visual:update` e `lighthouse` já estão declarados, mas ainda não têm o que executar: não existe teste com a tag `@visual` (o Playwright encerra com "No tests found") e `scripts/lighthouse.mjs` ainda não foi criado.

## Arquitetura e decisões técnicas

Consulte o documento [ARCHITECTURE.md](./ARCHITECTURE.md) para detalhes sobre camadas, contratos REST, eventos Socket.IO, política de sessão, estratégia de cache, idempotência e desvios documentados em relação ao Figma.
