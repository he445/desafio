import type { Order } from '@/contracts'
import { copy } from '@/content/copy'

export function networkName(order: Order): string {
  return copy.home.networks.find((network) => network.id === order.network)?.label ?? ''
}

export function providerName(order: Order): string {
  return copy.checkout.providers.find((option) => option.id === order.provider)?.label ?? ''
}
