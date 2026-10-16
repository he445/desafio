import { parseEth } from './eth'

const MONTHS_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const

const SCALE_4_DIVISOR = 10n ** 14n
const HALF_SCALE_4 = 5n * 10n ** 13n

export function formatEthNumberDisplay(amount: string): string {
  const wei = parseEth(amount)
  const scaled4 = (wei + HALF_SCALE_4) / SCALE_4_DIVISOR
  const whole = scaled4 / 10_000n
  const frac4 = (scaled4 % 10_000n).toString().padStart(4, '0')

  let trimmedFrac = frac4.replace(/0+$/, '')
  if (trimmedFrac.length < 2) {
    trimmedFrac = trimmedFrac.padEnd(2, '0')
  }

  return `${whole.toString()}.${trimmedFrac}`
}

export function displayEth(amount: string): string {
  return `${formatEthNumberDisplay(amount)} ETH`
}

export function displayDiscount(amount: string): string {
  return `(-) ${formatEthNumberDisplay(amount)} ETH`
}

export function displayQuantity(quantity: number): string {
  return `(x ${quantity})`
}

export function displayTokenId(tokenId: string): string {
  const clean = tokenId.replace(/^#/, '')
  return `#${clean.padStart(4, '0')}`
}

export function shortenAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

// The receipt shows the buyer's calendar day, so the date is read in local time.
export function formatReceiptDate(isoDate: string): string {
  const date = new Date(isoDate)
  const day = date.getDate().toString().padStart(2, '0')
  const month = MONTHS_PT[date.getMonth()] ?? ''
  return `${day} ${month}, ${date.getFullYear()}`
}

export function formatFacetCount(count: number): string {
  return `(${count})`
}
