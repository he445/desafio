import { afterEach, describe, expect, it } from 'vitest'
import type { Profile, Quote, Wallet } from '@/contracts'
import { clearEventLedger, recordResourceVersion } from '@/features/realtime/event-ledger'
import { buyerDefaults, defaultWallet, isQuoteBehind, sameQuoteValues } from './review'

const holder = {
  displayName: 'Marina Costa',
  profileName: 'marina',
  email: 'marina@nftmarket.test',
  ensName: 'nova.kurio',
  referralCode: 'KURIO-2048',
}

function wallet(id: string, network: Wallet['network'], role: Wallet['role']): Wallet {
  return {
    id,
    label: id,
    address: '0xA91F3b7C2d9E0f4A6b8C1d3E5f7A9b0C2d4EE82C',
    ens: null,
    provider: 'metamask',
    holder,
    network,
    role,
    version: 1,
  }
}

const profile: Profile = {
  id: 'user-marina',
  displayName: 'Marina',
  username: 'marina',
  email: 'outra@nftmarket.test',
  ensName: null,
  walletNickname: 'Principal',
  avatarUrl: null,
  referralCode: 'KURIO-2048',
}

function quote(overrides: Partial<Quote> = {}, unitPrice = '1.19', nftVersion = 3): Quote {
  return {
    id: 'quote-1',
    cartVersion: 2,
    network: 'ethereum',
    couponCode: null,
    lines: [
      {
        nftId: 'emerald-ape-042',
        editionId: 'emerald-ape-042-1-50',
        quantity: 1,
        unitPrice,
        lineTotal: unitPrice,
        nftVersion,
      },
    ],
    subtotal: unitPrice,
    discount: '0',
    networkFee: '0.004',
    total: unitPrice,
    issues: [],
    expiresAt: '2026-10-16T12:10:00.000Z',
    ...overrides,
  }
}

afterEach(() => clearEventLedger())

describe('defaultWallet', () => {
  it('prefers the primary wallet of the network', () => {
    const wallets = [wallet('a', 'polygon', 'secondary'), wallet('b', 'polygon', 'primary')]
    expect(defaultWallet(wallets, 'polygon')?.id).toBe('b')
    expect(defaultWallet(wallets, 'solana')).toBeUndefined()
  })
})

describe('buyerDefaults', () => {
  it('fills the holder fields from the wallet and the username from the profile', () => {
    expect(buyerDefaults(profile, wallet('a', 'ethereum', 'primary'))).toEqual({
      ...holder,
      username: 'marina',
      note: '',
    })
  })
})

describe('isQuoteBehind', () => {
  it('turns true once the ledger knows a newer version of a quoted NFT', () => {
    const reviewed = quote()
    recordResourceVersion('nft', 'emerald-ape-042', 3)
    expect(isQuoteBehind(reviewed)).toBe(false)
    recordResourceVersion('nft', 'emerald-ape-042', 4)
    expect(isQuoteBehind(reviewed)).toBe(true)
  })
})

describe('sameQuoteValues', () => {
  it('ignores the quote id and versions but not prices', () => {
    expect(sameQuoteValues(quote(), quote({ id: 'quote-2' }, '1.19', 4))).toBe(true)
    expect(sameQuoteValues(quote(), quote({ id: 'quote-2' }, '1.35', 4))).toBe(false)
    expect(sameQuoteValues(quote(), quote({ network: 'polygon' }))).toBe(false)
  })
})
