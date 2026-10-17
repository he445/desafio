import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { FavoritesResponse, Nft } from '@/contracts'
import { copy } from '@/content/copy'
import { qk } from '@/lib/query-keys'
import { useSessionQuery } from '@/features/auth/queries'
import { addFavoriteApi, fetchFavoritesApi, removeFavoriteApi } from './api'
import { toggleFavorite } from './toggle'

function favoritesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: qk.user(userId).favorites(),
    queryFn: ({ signal }) => fetchFavoritesApi({ signal }),
    staleTime: 30_000,
  })
}

export function useFavoritesQuery() {
  const { data: session } = useSessionQuery()
  const userId = session?.user.id
  return useQuery({ ...favoritesQueryOptions(userId ?? ''), enabled: Boolean(userId) })
}

export function useFavorite(nft: Nft) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: session } = useSessionQuery()
  const userId = session?.user.id
  const { data: favorites } = useFavoritesQuery()
  const favKey = qk.user(userId ?? '').favorites()

  const mutation = useMutation({
    mutationKey: ['favorite', nft.id],
    // Rapid clicks on the same NFT reach the server in order, so the last one wins.
    scope: { id: `favorite:${nft.id}` },
    mutationFn: (next: boolean) => (next ? addFavoriteApi(nft.id) : removeFavoriteApi(nft.id)),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: favKey })
      const previous = queryClient.getQueryData<FavoritesResponse>(favKey)
      queryClient.setQueryData<FavoritesResponse | undefined>(favKey, (old) =>
        toggleFavorite(old, nft, next),
      )
      return { previous }
    },
    onError: (_error, _next, context) => {
      queryClient.setQueryData(favKey, context?.previous)
      toast.error(copy.favorites.failed)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: favKey }),
  })

  const isFavorite = favorites?.nftIds.includes(nft.id) ?? false

  const toggle = () => {
    if (!userId) {
      void navigate({ to: '/login', search: { redirect: location.href } })
      return
    }
    mutation.mutate(!isFavorite)
  }

  return { isFavorite, toggle }
}
