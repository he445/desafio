const ETH_REGEX = /^(0|[1-9]\d*)(\.\d{1,18})?$/
const WEI_DECIMALS = 18
const WEI_BASE = 10n ** 18n

export type EthAmount = string

export function parseEth(value: string): bigint {
  if (!ETH_REGEX.test(value)) {
    throw new Error(`Invalid ETH amount: "${value}"`)
  }
  const [wholePart = '0', fracPart = ''] = value.split('.')
  const paddedFrac = fracPart.padEnd(WEI_DECIMALS, '0')
  return BigInt(wholePart) * WEI_BASE + BigInt(paddedFrac)
}

export function formatEth(wei: bigint): EthAmount {
  if (wei < 0n) {
    throw new Error('ETH amount cannot be negative')
  }
  if (wei === 0n) {
    return '0'
  }
  const whole = wei / WEI_BASE
  const fraction = wei % WEI_BASE
  if (fraction === 0n) {
    return whole.toString()
  }
  const fracStr = fraction.toString().padStart(WEI_DECIMALS, '0').replace(/0+$/, '')
  return `${whole.toString()}.${fracStr}`
}

export function addEth(a: EthAmount, b: EthAmount): EthAmount {
  return formatEth(parseEth(a) + parseEth(b))
}

export function subtractEth(a: EthAmount, b: EthAmount): EthAmount {
  const diff = parseEth(a) - parseEth(b)
  return formatEth(diff > 0n ? diff : 0n)
}

export function multiplyEth(price: EthAmount, quantity: number): EthAmount {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error(`Invalid quantity: ${quantity}`)
  }
  return formatEth(parseEth(price) * BigInt(quantity))
}

export function calculatePercentDiscount(subtotal: EthAmount, bps: number): EthAmount {
  const subWei = parseEth(subtotal)
  const rawDiscount = (subWei * BigInt(bps)) / 10_000n
  const capped = rawDiscount > subWei ? subWei : rawDiscount
  return formatEth(capped)
}

export function calculateFixedDiscount(
  subtotal: EthAmount,
  amount: EthAmount,
  minSubtotal: EthAmount,
): EthAmount {
  const subWei = parseEth(subtotal)
  const minWei = parseEth(minSubtotal)
  if (subWei < minWei) {
    return '0'
  }
  const amtWei = parseEth(amount)
  return formatEth(amtWei > subWei ? subWei : amtWei)
}

export function calculateQuoteTotals(params: {
  lineTotals: EthAmount[]
  discount: EthAmount
  networkFee: EthAmount
}): {
  subtotal: EthAmount
  discount: EthAmount
  networkFee: EthAmount
  total: EthAmount
} {
  const subtotalWei = params.lineTotals.reduce((acc, item) => acc + parseEth(item), 0n)
  const rawDiscountWei = parseEth(params.discount)
  const discountWei = rawDiscountWei > subtotalWei ? subtotalWei : rawDiscountWei
  const feeWei = parseEth(params.networkFee)
  const totalWei = subtotalWei - discountWei + feeWei

  return {
    subtotal: formatEth(subtotalWei),
    discount: formatEth(discountWei),
    networkFee: formatEth(feeWei),
    total: formatEth(totalWei),
  }
}

export function compareEth(a: EthAmount, b: EthAmount): number {
  const weiA = parseEth(a)
  const weiB = parseEth(b)
  if (weiA < weiB) return -1
  if (weiA > weiB) return 1
  return 0
}
