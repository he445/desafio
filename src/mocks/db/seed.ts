import type { Edition, NetworkId, Nft, Order, Wallet } from '@/contracts'
import { compareEth } from '@/lib/eth'
import type { CouponRecord, MockDb, MockUserRecord } from './schema'

export const SEED_REFERENCE_DATE = '2026-10-15T12:00:00.000Z'
export const MOCK_DB_SCHEMA_VERSION = 1

export const MARINA_PASSWORD_SALT = 'kurio-salt-marina-v1'
export const MARINA_PASSWORD_HASH =
  'cacda3cad1b7a3815d14307f9b8916e1cac74025a788ec110c60cda140e9f938'

export const RAFAEL_PASSWORD_SALT = 'kurio-salt-rafael-v1'
export const RAFAEL_PASSWORD_HASH =
  '40fddb1faa827a9aff9e6cebc53c5e0d9542265bb64263e61f54fbbc9a0edea7'

const CONTRACT_ADDRESS = '0x7A42c1F0d3B98e6A5C4d2E1f0B9a8C7d6E5f19E8'

const COLLECTIONS = [
  { id: 'kurio-apes', name: 'Kurio Apes' },
  { id: 'nomad-protocol', name: 'Nomad Protocol' },
  { id: 'baron-atelier', name: 'Baron Atelier' },
  { id: 'golden-frequency', name: 'Golden Frequency' },
  { id: 'prism-studios', name: 'Prism Studios' },
  { id: 'ether-forms', name: 'Ether Forms' },
] as const

const CATEGORIES = [
  'arte-digital',
  'fotografia',
  'musica',
  'arte-3d',
  'colecionaveis',
  'generativa',
  'jogos',
  'assinaturas',
  'utilidade',
] as const

const NETWORKS: readonly NetworkId[] = ['ethereum', 'polygon', 'solana']
const ARTS = ['emerald', 'nomad', 'baron', 'golden'] as const

function buildImages(art: (typeof ARTS)[number], title: string, collectionName: string) {
  return [1, 2, 3, 4].map((view) => ({
    src: `/images/nfts/${art}-${view}.webp`,
    alt: `${title} — ${collectionName} (vista ${view})`,
    width: 640,
    height: 640,
  }))
}

export function computePriceFrom(editions: Edition[], fallbackPrice: string): string {
  const available = editions.filter((ed) => ed.available > 0)
  const source = available.length > 0 ? available : editions
  if (source.length === 0) return fallbackPrice
  let min = source[0]!.price
  for (const ed of source) {
    if (compareEth(ed.price, min) < 0) {
      min = ed.price
    }
  }
  return min
}

function makeStandardReviews() {
  return [
    {
      author: 'Lia M.',
      rating: 5,
      text: 'Arte impecável e a procedência fica clara no contrato.',
      date: '2026-09-10',
    },
    {
      author: 'Theo R.',
      rating: 5,
      text: 'Comprei a 1/50 e ela chegou na carteira na hora.',
      date: '2026-09-12',
    },
    {
      author: 'Caio V.',
      rating: 4,
      text: 'Os detalhes dos óculos ficam ainda melhores em alta resolução.',
      date: '2026-09-14',
    },
  ]
}

function buildSeedNfts(): Nft[] {
  const figmaSeeds: Array<{
    id: string
    title: string
    price: string
    compareAtPrice: string | null
    art: (typeof ARTS)[number]
    network: NetworkId
    category: string
    tokenId: string
    featured: boolean
    trending: boolean
    rare: boolean
    attributes: string[]
  }> = [
    {
      id: 'emerald-ape-042',
      title: 'Emerald Ape #042',
      price: '1.19',
      compareAtPrice: null,
      art: 'emerald',
      network: 'ethereum',
      category: 'arte-digital',
      tokenId: '0042',
      featured: true,
      trending: false,
      rare: false,
      attributes: ['Óculos', 'Esmeralda', 'Raro'],
    },
    {
      id: 'sage-nomad-009',
      title: 'Sage Nomad #009',
      price: '1.69',
      compareAtPrice: null,
      art: 'nomad',
      network: 'polygon',
      category: 'colecionaveis',
      tokenId: '0009',
      featured: true,
      trending: false,
      rare: false,
      attributes: ['Chapéu', 'Nômade', 'Sálvia'],
    },
    {
      id: 'neon-vessel-552',
      title: 'Neon Vessel #552',
      price: '1.99',
      compareAtPrice: '2.29',
      art: 'baron',
      network: 'ethereum',
      category: 'arte-3d',
      tokenId: '0552',
      featured: false,
      trending: false,
      rare: true,
      attributes: ['Blazer', 'Neon', 'Raro'],
    },
    {
      id: 'cosmic-bloom-118',
      title: 'Cosmic Bloom #118',
      price: '1.29',
      compareAtPrice: null,
      art: 'nomad',
      network: 'solana',
      category: 'generativa',
      tokenId: '0118',
      featured: false,
      trending: false,
      rare: false,
      attributes: ['Cósmico', 'Generativo', 'Violeta'],
    },
    {
      id: 'violet-nomad-314',
      title: 'Violet Nomad #314',
      price: '1.39',
      compareAtPrice: null,
      art: 'nomad',
      network: 'polygon',
      category: 'arte-digital',
      tokenId: '0314',
      featured: false,
      trending: true,
      rare: false,
      attributes: ['Violeta', 'Moletom', 'Urbano'],
    },
    {
      id: 'ivory-baron-088',
      title: 'Ivory Baron #088',
      price: '1.79',
      compareAtPrice: null,
      art: 'baron',
      network: 'ethereum',
      category: 'fotografia',
      tokenId: '0088',
      featured: true,
      trending: false,
      rare: false,
      attributes: ['Marfim', 'Gola alta', 'Estúdio'],
    },
    {
      id: 'golden-beat-207',
      title: 'Golden Beat #207',
      price: '0.99',
      compareAtPrice: null,
      art: 'golden',
      network: 'solana',
      category: 'musica',
      tokenId: '0207',
      featured: true,
      trending: true,
      rare: false,
      attributes: ['Fones', 'Dourado', 'Acústico'],
    },
    {
      id: 'golden-pulse-188',
      title: 'Golden Pulse #188',
      price: '0.79',
      compareAtPrice: null,
      art: 'golden',
      network: 'polygon',
      category: 'musica',
      tokenId: '0188',
      featured: false,
      trending: false,
      rare: false,
      attributes: ['Pulso', 'Sintetizador', 'Dourado'],
    },
    {
      id: 'golden-signal-160',
      title: 'Golden Signal #160',
      price: '0.39',
      compareAtPrice: null,
      art: 'golden',
      network: 'ethereum',
      category: 'jogos',
      tokenId: '0160',
      featured: false,
      trending: true,
      rare: false,
      attributes: ['Sinal', 'Arcade', 'Verde'],
    },
  ]

  const nfts: Nft[] = []
  const baseTimeMs = new Date(SEED_REFERENCE_DATE).getTime()

  for (let i = 0; i < figmaSeeds.length; i++) {
    const item = figmaSeeds[i]!
    const createdAt = new Date(baseTimeMs - i * 3600_000 * 12).toISOString()

    const editions: Edition[] =
      item.id === 'emerald-ape-042'
        ? [
            {
              id: `${item.id}-1-50`,
              name: '1/50',
              price: '1.19',
              supply: 50,
              available: 12,
              maxPerOrder: 5,
            },
            {
              id: `${item.id}-1-10`,
              name: '1/10',
              price: '1.49',
              supply: 10,
              available: 2,
              maxPerOrder: 2,
            },
            {
              id: `${item.id}-1-1`,
              name: '1/1',
              price: '3.5',
              supply: 1,
              available: 0,
              maxPerOrder: 1,
            },
            {
              id: `${item.id}-open`,
              name: 'ABERTA',
              price: '1.19',
              supply: null,
              available: 40,
              maxPerOrder: 5,
            },
          ]
        : [
            {
              id: `${item.id}-1-50`,
              name: '1/50',
              price: item.price,
              supply: 50,
              available: 12,
              maxPerOrder: 5,
            },
            {
              id: `${item.id}-1-10`,
              name: '1/10',
              price: item.price,
              supply: 10,
              available: 3,
              maxPerOrder: 2,
            },
            {
              id: `${item.id}-open`,
              name: 'ABERTA',
              price: item.price,
              supply: null,
              available: 25,
              maxPerOrder: 5,
            },
          ]

    const networkDisplay =
      item.network === 'ethereum' ? 'Ethereum' : item.network === 'polygon' ? 'Polygon' : 'Solana'

    nfts.push({
      id: item.id,
      title: item.title,
      description:
        item.id === 'emerald-ape-042'
          ? 'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.'
          : `Um colecionável digital finalizado à mão da coleção Kurio Apes, verificado na ${networkDisplay}, com arte desbloqueável e acesso para colecionadores.`,
      shortDescriptionMobile:
        item.id === 'emerald-ape-042'
          ? 'Um colecionável digital 1/50 finalizado à mão da coleção Kurio Editions, verificado na Ethereum.'
          : `Um colecionável digital 1/50 finalizado à mão da coleção Kurio Apes, verificado na ${networkDisplay}.`,
      longDescription: [
        `${item.title} é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na ${networkDisplay}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
        'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
      ],
      collection: { id: 'kurio-apes', name: 'Kurio Apes' },
      creator: {
        id: 'creator-nova-sato',
        name: 'Nova Sato',
        avatarUrl: '/images/nfts/emerald-2-320.webp',
      },
      category: item.category,
      network: item.network,
      tokenId: item.tokenId,
      attributes: item.attributes,
      featured: item.featured,
      trending: item.trending,
      rare: item.rare,
      createdAt,
      rating: { average: 4.8, count: 19 },
      reviews: makeStandardReviews(),
      contract: {
        address: CONTRACT_ADDRESS,
        standard: 'ERC-721',
      },
      royaltyBps: 500,
      compareAtPrice: item.compareAtPrice,
      images: buildImages(item.art, item.title, 'Kurio Apes'),
      editions,
      priceFrom: computePriceFrom(editions, item.price),
      version: 1,
    })
  }

  const extraPrices = [
    '0.02',
    '0.05',
    '0.08',
    '0.12',
    '0.18',
    '0.24',
    '0.31',
    '0.42',
    '0.48',
    '0.55',
    '0.64',
    '0.72',
    '0.85',
    '0.92',
    '1.05',
    '1.12',
    '1.24',
    '1.35',
    '1.48',
    '1.56',
    '1.62',
    '1.75',
    '1.88',
    '2.05',
    '2.2',
    '2.45',
    '2.8',
    '3.15',
    '3.6',
    '4.1',
    '4.75',
    '5.4',
    '6.2',
    '7.1',
    '8.05',
    '9.15',
    '10.4',
    '11.25',
    '12.3',
  ]

  const extraNames = [
    'Crimson Ape',
    'Obsidian Nomad',
    'Velvet Baron',
    'Solar Pulse',
    'jade Drift',
    'Amber Totem',
    'Cobalt Echo',
    'Lunar Relic',
    'Quartz Sentinel',
    'Onyx Chorus',
    'Prism Walker',
    'Aether Monk',
    'Copper Mirage',
    'Saffron Glide',
    'Beryl Vector',
    'Dusk Voyager',
    'Cinder Crown',
    'Moss Circuit',
    'Opal Resonance',
    'Veridian Key',
    'garnet Flux',
    'Ivory Beacon',
    'Topaz Guard',
    'Indigo Drifter',
    'Bronze Matrix',
    'Scarlet Node',
    'celadon Wave',
    'Umber Glyph',
    'Gold Horizon',
    'Slate Archive',
    'Ruby Fragment',
    'Cyan Artifact',
    'ochre Ritual',
    ' basalt Idol',
    'Silver Bloom',
    'Plume Sovereign',
    'Coral Zenith',
    'Nebula Sigil',
    'Apex Relic',
  ]

  for (let idx = 0; idx < 39; idx++) {
    const orderNum = idx + 10
    const art = ARTS[(orderNum - 10) % ARTS.length]!
    const collection = COLLECTIONS[orderNum % COLLECTIONS.length]!
    const category = CATEGORIES[orderNum % CATEGORIES.length]!
    const network = NETWORKS[orderNum % NETWORKS.length]!
    const price = extraPrices[idx]!
    const tokenNum = (200 + orderNum * 7).toString().padStart(4, '0')
    const rawTitle = extraNames[idx]!.trim()
    const formattedTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1) + ` #${tokenNum}`
    const id = `kurio-nft-${orderNum}`

    const daysAgo = idx < 8 ? idx + 2 : idx + 15
    const createdAt = new Date(baseTimeMs - daysAgo * 86_400_000).toISOString()

    const featured = idx === 0 || idx === 1
    const trending = idx < 9
    const rare = idx < 7

    const isLowStock = idx % 7 === 0
    const isSoldOut = idx === 38

    const editions: Edition[] = [
      {
        id: `${id}-1-50`,
        name: '1/50',
        price,
        supply: 50,
        available: isSoldOut ? 0 : isLowStock ? 1 : 12,
        maxPerOrder: 5,
      },
      {
        id: `${id}-1-10`,
        name: '1/10',
        price,
        supply: 10,
        available: isSoldOut ? 0 : 2,
        maxPerOrder: 2,
      },
    ]

    const networkDisplay =
      network === 'ethereum' ? 'Ethereum' : network === 'polygon' ? 'Polygon' : 'Solana'

    nfts.push({
      id,
      title: formattedTitle,
      description: `Um colecionável digital finalizado à mão da coleção ${collection.name}, verificado na ${networkDisplay}, com arte desbloqueável e acesso para colecionadores.`,
      shortDescriptionMobile: `Um colecionável digital 1/50 finalizado à mão da coleção ${collection.name}, verificado na ${networkDisplay}.`,
      longDescription: [
        `${formattedTitle} é uma obra digital 1/50 finalizada à mão da coleção ${collection.name}. Cada atributo fica armazenado nos metadados do token e verificado na ${networkDisplay}.`,
        'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede.',
      ],
      collection,
      creator: {
        id: 'creator-nova-sato',
        name: 'Nova Sato',
        avatarUrl: '/images/nfts/emerald-2-320.webp',
      },
      category,
      network,
      tokenId: tokenNum,
      attributes: ['Colecionável', networkDisplay, collection.name],
      featured,
      trending,
      rare,
      createdAt,
      rating: { average: 4.7, count: 14 },
      reviews: makeStandardReviews(),
      contract: {
        address: CONTRACT_ADDRESS,
        standard: 'ERC-721',
      },
      royaltyBps: 500,
      compareAtPrice: idx % 5 === 0 ? '2.5' : null,
      images: buildImages(art, formattedTitle, collection.name),
      editions,
      priceFrom: computePriceFrom(editions, price),
      version: 1,
    })
  }

  return nfts
}

export function createSeedDb(scenarioId = 'default'): MockDb {
  const nfts = scenarioId === 'empty-catalog' ? [] : buildSeedNfts()

  const users: MockUserRecord[] = [
    {
      id: 'user-marina',
      username: 'marina',
      displayName: 'Marina Costa',
      email: 'marina@nftmarket.test',
      ensName: 'nova.kurio',
      walletNickname: 'Principal',
      avatarUrl: null,
      referralCode: 'KURIO-2048',
      passwordSalt: MARINA_PASSWORD_SALT,
      passwordHash: MARINA_PASSWORD_HASH,
    },
    {
      id: 'user-rafael',
      username: 'rafael',
      displayName: 'Rafael Mendes',
      email: 'rafael@nftmarket.test',
      ensName: null,
      walletNickname: 'Carteira Rafael',
      avatarUrl: null,
      referralCode: 'KURIO-7712',
      passwordSalt: RAFAEL_PASSWORD_SALT,
      passwordHash: RAFAEL_PASSWORD_HASH,
    },
  ]

  const marinaWallets: Wallet[] = [
    {
      id: 'wallet-marina-primary',
      label: 'Principal',
      address: '0xA91F3b7C2d9E0f4A6b8C1d3E5f7A9b0C2d4EE82C',
      ens: null,
      provider: 'metamask',
      holder: {
        displayName: 'Marina Costa',
        profileName: 'marina',
        email: 'marina@nftmarket.test',
        ensName: 'nova.kurio',
        referralCode: 'KURIO-2048',
      },
      network: 'ethereum',
      role: 'primary',
      version: 1,
    },
    {
      id: 'wallet-marina-secondary',
      label: 'Reserva',
      address: '0x5D3e9a1B7c2F4d6E8a0B1c3D5e7F9a2B4c6D8e0F',
      ens: 'nova.kurio.eth',
      provider: 'coinbase',
      holder: {
        displayName: 'Marina Costa',
        profileName: 'marina',
        email: 'marina@nftmarket.test',
        ensName: 'nova.kurio',
        referralCode: 'KURIO-2048',
      },
      network: 'polygon',
      role: 'secondary',
      version: 1,
    },
  ]

  const seedOrderMarina: Order = {
    id: 'order-seed-marina-1',
    userId: 'user-marina',
    status: 'confirmed',
    rejectionReason: null,
    quoteId: 'quote-seed-1',
    walletId: 'wallet-marina-primary',
    network: 'ethereum',
    provider: 'metamask',
    receipt: {
      lines: [
        {
          nftId: 'emerald-ape-042',
          editionId: 'emerald-ape-042-1-50',
          title: 'Emerald Ape #042',
          tokenId: '0042',
          editionName: '1/50',
          image: '/images/nfts/emerald-1.webp',
          quantity: 1,
          unitPrice: '1.19',
          lineTotal: '1.19',
        },
      ],
      subtotal: '1.19',
      discount: '0',
      networkFee: '0.016',
      total: '1.206',
      couponCode: null,
    },
    transaction: {
      hash: '0x88f4c1a9d0b27e6f4a1c3d5e7f9a0b2c4d6e8f0a1b2c3d4e5f6a7b8c9d0e1f2a',
      explorerUrl:
        'https://etherscan.io/tx/0x88f4c1a9d0b27e6f4a1c3d5e7f9a0b2c4d6e8f0a1b2c3d4e5f6a7b8c9d0e1f2a',
    },
    createdAt: '2026-07-29T15:30:00.000Z',
    updatedAt: '2026-07-29T15:30:02.000Z',
    version: 2,
  }

  const coupons: Record<string, CouponRecord> = {
    BEMVINDO10: {
      code: 'BEMVINDO10',
      kind: 'percent',
      bps: 1000,
      expiresAt: null,
    },
    ETH005: {
      code: 'ETH005',
      kind: 'fixed',
      amount: '0.05',
      minSubtotal: '0.5',
      expiresAt: null,
    },
    VERAO25: {
      code: 'VERAO25',
      kind: 'percent',
      bps: 2500,
      expiresAt: '2025-03-01T00:00:00.000Z',
    },
  }

  return {
    schemaVersion: MOCK_DB_SCHEMA_VERSION,
    scenarioId,
    nfts,
    users,
    sessions: [],
    favoritesByUser: {
      'user-marina': ['emerald-ape-042', 'neon-vessel-552', 'golden-beat-207'],
      'user-rafael': [],
    },
    carts: {},
    quotes: {},
    orders: {
      [seedOrderMarina.id]: seedOrderMarina,
    },
    walletsByUser: {
      'user-marina': marinaWallets,
      'user-rafael': [],
    },
    walletConnections: {},
    idempotencyKeys: {},
    coupons,
    priceChangeTriggeredByCart: {},
    soldOutTriggeredByCart: {},
  }
}
