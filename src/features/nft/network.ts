import type { NetworkId } from '@/contracts'
import { copy } from '@/content/copy'

export function networkLabel(network: NetworkId): string {
  return copy.home.networks.find((option) => option.id === network)?.label ?? network
}
