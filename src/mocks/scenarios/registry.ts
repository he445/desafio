export const SCENARIO_STORAGE_KEY = 'nftmkt:scenario'

export const SCENARIOS = [
  {
    id: 'default',
    label: 'Padrão (40–120 ms)',
    description: 'Fluxo normal com confirmação em 1,5 s',
  },
  { id: 'empty-catalog', label: 'Catálogo vazio', description: 'Banco sem NFTs cadastrados' },
  { id: 'slow', label: 'Rede lenta (1,5–3 s)', description: 'Exercita skeletons com shimmer' },
  { id: 'race', label: 'Fora de ordem', description: 'Latência inversa ao tamanho de q' },
  {
    id: 'flaky',
    label: 'Instável (503 na 1ª)',
    description: 'Primeira chamada de cada GET falha com 503',
  },
  {
    id: 'server-error',
    label: 'Erro 500 no catálogo',
    description: 'GET /nfts responde sempre 500',
  },
  {
    id: 'offline',
    label: 'Sem conexão',
    description: 'Falha de rede no REST e recusa no WebSocket',
  },
  {
    id: 'session-expired',
    label: 'Sessão curta (60 s)',
    description: 'Sessão expira 60 s após autenticar',
  },
  {
    id: 'price-change-checkout',
    label: 'Mudança de preço no pedido',
    description: '1º POST /orders retorna QUOTE_OUTDATED e emite nft.updated',
  },
  {
    id: 'sold-out-checkout',
    label: 'Esgotamento no pedido',
    description: 'Edição esgota antes da confirmação (AVAILABILITY_CONFLICT)',
  },
  {
    id: 'order-timeout',
    label: 'Timeout no pedido (10 s)',
    description: 'Cria o pedido e responde após 10 s; a repetição recupera o mesmo pedido',
  },
  {
    id: 'payment-declined',
    label: 'Pagamento recusado',
    description: 'Pedido vai a rejected (insufficient_funds)',
  },
  {
    id: 'wallet-rejected',
    label: 'Carteira recusada',
    description: 'POST /wallet-connections responde WALLET_REJECTED',
  },
  {
    id: 'wallet-disconnect',
    label: 'Queda da carteira',
    description: 'A conexão cai antes do primeiro pedido (WALLET_DISCONNECTED)',
  },
  {
    id: 'socket-drop',
    label: 'Queda do WebSocket',
    description: 'Socket cai com pedido pendente e a confirmação acontece durante a queda',
  },
  {
    id: 'duplicate-events',
    label: 'Eventos duplicados',
    description: 'Todo evento sai 2 vezes, seguido de um com versão antiga',
  },
] as const

export type ScenarioId = (typeof SCENARIOS)[number]['id']
export type ScenarioDescriptor = (typeof SCENARIOS)[number]

export function isScenarioId(value: unknown): value is ScenarioId {
  return SCENARIOS.some((scenario) => scenario.id === value)
}

function defaultScenarioId(): ScenarioId {
  const fromEnv = import.meta.env.VITE_MOCK_DEFAULT_SCENARIO
  return isScenarioId(fromEnv) ? fromEnv : 'default'
}

export function getActiveScenarioId(): ScenarioId {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(SCENARIO_STORAGE_KEY)
    if (isScenarioId(stored)) return stored
  }
  return defaultScenarioId()
}

export function setActiveScenarioId(id: ScenarioId): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SCENARIO_STORAGE_KEY, id)
  }
}
