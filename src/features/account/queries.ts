import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AuthResponse,
  CreateWalletInput,
  Profile,
  UpdateProfileInput,
  Wallet,
} from '@/contracts'
import { qk } from '@/lib/query-keys'
import {
  changePasswordApi,
  createWalletApi,
  fetchProfileApi,
  fetchWalletsApi,
  removeAvatarApi,
  updateProfileApi,
  updateWalletApi,
  uploadAvatarApi,
} from './api'

export function profileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: qk.user(userId).profile(),
    queryFn: ({ signal }) => fetchProfileApi({ signal }),
  })
}

export function walletsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: qk.user(userId).wallets(),
    queryFn: ({ signal }) => fetchWalletsApi({ signal }),
  })
}

export function useProfileQuery(userId: string) {
  return useQuery(profileQueryOptions(userId))
}

export function useWalletsQuery(userId: string) {
  return useQuery(walletsQueryOptions(userId))
}

// The header reads name and avatar from the session, so a saved profile updates it too.
function useApplyProfile(userId: string) {
  const queryClient = useQueryClient()
  return (profile: Profile) => {
    queryClient.setQueryData(qk.user(userId).profile(), profile)
    queryClient.setQueryData<AuthResponse | null>(qk.session(), (auth) =>
      auth && auth.user.id === userId
        ? {
            ...auth,
            user: {
              ...auth.user,
              displayName: profile.displayName,
              username: profile.username,
              email: profile.email,
              avatarUrl: profile.avatarUrl,
            },
          }
        : auth,
    )
  }
}

export function useUpdateProfileMutation(userId: string) {
  const applyProfile = useApplyProfile(userId)
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfileApi(input),
    onSuccess: applyProfile,
  })
}

export function useAvatarMutation(userId: string) {
  const queryClient = useQueryClient()
  const applyProfile = useApplyProfile(userId)
  return useMutation({
    mutationFn: (file: Blob | null) => (file ? uploadAvatarApi(file) : removeAvatarApi()),
    onSuccess: ({ avatarUrl }) => {
      const profile = queryClient.getQueryData<Profile>(qk.user(userId).profile())
      if (profile) applyProfile({ ...profile, avatarUrl })
    },
  })
}

export function useChangePasswordMutation() {
  return useMutation({ mutationFn: changePasswordApi })
}

export function useSaveWalletMutation(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: CreateWalletInput }) =>
      id ? updateWalletApi(id, input) : createWalletApi(input),
    onSuccess: (wallet) => {
      queryClient.setQueryData<Wallet[]>(qk.user(userId).wallets(), (wallets = []) =>
        wallets.some((item) => item.id === wallet.id)
          ? wallets.map((item) => (item.id === wallet.id ? wallet : item))
          : [...wallets, wallet],
      )
    },
  })
}
