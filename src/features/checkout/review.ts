import type { Buyer, NetworkId, Profile, Quote, Wallet } from '@/contracts'
import { getKnownResourceVersion } from '@/features/realtime/event-ledger'

export function walletsOn(wallets: Wallet[], network: NetworkId): Wallet[] {
  return wallets.filter((wallet) => wallet.network === network)
}

// The primary wallet first, so a network switch lands on the wallet the person uses most.
export function defaultWallet(wallets: Wallet[], network?: NetworkId): Wallet | undefined {
  const candidates = network ? walletsOn(wallets, network) : wallets
  return candidates.find((wallet) => wallet.role === 'primary') ?? candidates[0]
}

export function buyerDefaults(profile: Profile, wallet: Wallet | undefined): Buyer {
  const holder = wallet?.holder
  return {
    displayName: holder?.displayName ?? profile.displayName,
    username: profile.username,
    profileName: holder?.profileName ?? profile.username,
    email: holder?.email ?? profile.email,
    ensName: holder?.ensName ?? profile.ensName ?? '',
    referralCode: holder?.referralCode ?? profile.referralCode,
    note: '',
  }
}

// A quote is behind once any of its NFTs has a newer version than the one it priced, which
// the ledger learns from realtime events before the next quote arrives.
export function isQuoteBehind(quote: Quote): boolean {
  return quote.lines.some((line) => line.nftVersion < getKnownResourceVersion('nft', line.nftId))
}

// Same lines, prices and totals: a newer quote id with nothing the buyer would see change.
export function sameQuoteValues(a: Quote, b: Quote): boolean {
  if (a.network !== b.network || a.total !== b.total || a.lines.length !== b.lines.length) {
    return false
  }
  return a.lines.every((line) => {
    const other = b.lines.find((candidate) => candidate.editionId === line.editionId)
    return (
      other !== undefined &&
      other.quantity === line.quantity &&
      other.unitPrice === line.unitPrice &&
      other.lineTotal === line.lineTotal
    )
  })
}
