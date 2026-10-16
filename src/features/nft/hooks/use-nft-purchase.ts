import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { Nft } from '@/contracts'
import { copy } from '@/content/copy'
import { isApiError } from '@/lib/api-error'
import { useAddCartItem, useCartQuery } from '@/features/cart/queries'
import { clampQuantity, quantityInCart, quantityLimit, resolveEdition } from '../editions'

export function useNftPurchase(nft: Nft, requestedEditionId: string | undefined) {
  const navigate = useNavigate()
  const { data: cart } = useCartQuery()
  const addItem = useAddCartItem()
  const { selected, requestedUnavailable } = resolveEdition(nft.editions, requestedEditionId)

  const inCart = selected ? quantityInCart(cart?.items, selected.id) : 0
  const limit = selected ? quantityLimit(selected, inCart) : 0
  // The chosen quantity belongs to one edition: switching editions starts again at 1.
  const [choice, setChoice] = useState({ editionId: selected?.id, quantity: 1 })
  const quantity = clampQuantity(choice.editionId === selected?.id ? choice.quantity : 1, limit)

  const setQuantity = (next: number) => setChoice({ editionId: selected?.id, quantity: next })

  const selectEdition = (editionId: string) => {
    void navigate({
      to: '/nft/$nftId',
      params: { nftId: nft.id },
      search: (prev) => ({ ...prev, edition: editionId }),
      replace: true,
      resetScroll: false,
    })
  }

  const addToCart = async ({ goToCart }: { goToCart: boolean }) => {
    if (!selected || limit === 0 || addItem.isPending) return
    try {
      await addItem.mutateAsync({ nftId: nft.id, editionId: selected.id, quantity })
    } catch (error) {
      toast.error(isApiError(error) ? error.message : copy.detail.addToCartFailed)
      return
    }
    if (goToCart) {
      void navigate({ to: '/cart' })
      return
    }
    toast.success(copy.detail.addedToCart, {
      action: { label: copy.detail.viewCart, onClick: () => void navigate({ to: '/cart' }) },
    })
  }

  return {
    selected,
    requestedUnavailable,
    inCart,
    limit,
    quantity,
    setQuantity,
    selectEdition,
    addToCart,
    canBuy: Boolean(selected) && limit > 0,
    isAdding: addItem.isPending,
  }
}

export type NftPurchase = ReturnType<typeof useNftPurchase>
