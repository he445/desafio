import {
  isValidWalletAddressForNetwork,
  VALIDATION_MESSAGES,
  type ChangePasswordInput,
  type CreateWalletInput,
  type Profile,
  type UpdateProfileInput,
  type UpdateWalletInput,
  type Wallet,
} from '@/contracts'
import type { MockDb } from '@/mocks/db/schema'
import { hashPassword, verifyPassword } from './crypto'
import { MockHttpError } from './errors'

const RESERVED_USERNAMES = new Set(['admin', 'root', 'support', 'kurio'])

export function getProfileForUser(db: MockDb, userId: string): Profile {
  const user = db.users.find((u) => u.id === userId)
  if (!user) {
    throw new MockHttpError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Perfil não encontrado.',
    })
  }
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensName: user.ensName,
    walletNickname: user.walletNickname,
    avatarUrl: user.avatarUrl,
    referralCode: user.referralCode,
  }
}

export function updateProfileForUser(
  db: MockDb,
  userId: string,
  input: UpdateProfileInput,
): Profile {
  const user = db.users.find((u) => u.id === userId)
  if (!user) {
    throw new MockHttpError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Perfil não encontrado.',
    })
  }

  const normalizedUsername = input.username.trim()
  const normalizedEmail = input.email.trim().toLowerCase()

  if (
    RESERVED_USERNAMES.has(normalizedUsername.toLowerCase()) ||
    db.users.some(
      (u) => u.id !== userId && u.username.toLowerCase() === normalizedUsername.toLowerCase(),
    )
  ) {
    throw new MockHttpError({
      status: 409,
      code: 'USERNAME_TAKEN',
      message: VALIDATION_MESSAGES.usernameTaken,
      fieldErrors: { username: [VALIDATION_MESSAGES.usernameTaken] },
    })
  }

  if (db.users.some((u) => u.id !== userId && u.email.toLowerCase() === normalizedEmail)) {
    throw new MockHttpError({
      status: 409,
      code: 'EMAIL_TAKEN',
      message: VALIDATION_MESSAGES.emailTaken,
      fieldErrors: { email: [VALIDATION_MESSAGES.emailTaken] },
    })
  }

  user.displayName = input.displayName.trim()
  user.username = normalizedUsername
  user.email = normalizedEmail
  user.ensName = input.ensName?.trim() ? input.ensName.trim().replace(/\.eth$/i, '') : null
  user.walletNickname = input.walletNickname.trim()

  return getProfileForUser(db, userId)
}

export function updateAvatarForUser(
  db: MockDb,
  userId: string,
  avatarUrl: string | null,
): { avatarUrl: string | null } {
  const user = db.users.find((u) => u.id === userId)
  if (!user) {
    throw new MockHttpError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Perfil não encontrado.',
    })
  }
  user.avatarUrl = avatarUrl
  return { avatarUrl: user.avatarUrl }
}

export async function changePasswordForUser(
  db: MockDb,
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const user = db.users.find((u) => u.id === userId)
  if (!user) {
    throw new MockHttpError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Perfil não encontrado.',
    })
  }

  const valid = await verifyPassword(input.currentPassword, user.passwordSalt, user.passwordHash)
  if (!valid) {
    throw new MockHttpError({
      status: 422,
      code: 'WRONG_PASSWORD',
      message: VALIDATION_MESSAGES.wrongPassword,
      fieldErrors: { currentPassword: [VALIDATION_MESSAGES.wrongPassword] },
    })
  }

  if (input.currentPassword === input.newPassword) {
    throw new MockHttpError({
      status: 422,
      code: 'VALIDATION_FAILED',
      message: 'A nova senha deve ser diferente da senha atual.',
      fieldErrors: { newPassword: ['A nova senha deve ser diferente da senha atual.'] },
    })
  }

  const newSalt = `kurio-salt-${crypto.randomUUID()}`
  user.passwordSalt = newSalt
  user.passwordHash = await hashPassword(input.newPassword, newSalt)
}

export function getWalletsForUser(db: MockDb, userId: string): Wallet[] {
  return db.walletsByUser[userId] ?? []
}

export function createWalletForUser(db: MockDb, userId: string, input: CreateWalletInput): Wallet {
  const wallets = db.walletsByUser[userId] ?? []
  const normalizedAddress = input.address.trim()

  if (!isValidWalletAddressForNetwork(normalizedAddress, input.network)) {
    throw new MockHttpError({
      status: 422,
      code: 'VALIDATION_FAILED',
      message: VALIDATION_MESSAGES.invalidAddress,
      fieldErrors: { address: [VALIDATION_MESSAGES.invalidAddress] },
    })
  }

  if (wallets.some((w) => w.address.toLowerCase() === normalizedAddress.toLowerCase())) {
    throw new MockHttpError({
      status: 409,
      code: 'WALLET_CONFLICT',
      message: 'Este endereço de carteira já está cadastrado.',
      fieldErrors: { address: ['Este endereço de carteira já está cadastrado.'] },
    })
  }

  if (wallets.some((w) => w.role === input.role)) {
    throw new MockHttpError({
      status: 409,
      code: 'WALLET_CONFLICT',
      message: `Você já possui uma carteira ${input.role === 'primary' ? 'principal' : 'secundária'}.`,
      fieldErrors: {
        role: [
          `Você já possui uma carteira ${input.role === 'primary' ? 'principal' : 'secundária'}.`,
        ],
      },
    })
  }

  const wallet: Wallet = {
    id: `wallet-${crypto.randomUUID().slice(0, 8)}`,
    label: input.label.trim(),
    address: normalizedAddress,
    ens: input.ens?.trim() ? input.ens.trim() : null,
    provider: input.provider,
    holder: {
      displayName: input.holder.displayName.trim(),
      profileName: input.holder.profileName.trim(),
      email: input.holder.email.trim().toLowerCase(),
      ensName: input.holder.ensName.trim().replace(/\.eth$/i, ''),
      referralCode: input.holder.referralCode.trim(),
    },
    network: input.network,
    role: input.role,
    version: 1,
  }

  wallets.push(wallet)
  db.walletsByUser[userId] = wallets
  return wallet
}

export function updateWalletForUser(
  db: MockDb,
  userId: string,
  walletId: string,
  input: UpdateWalletInput,
): Wallet {
  for (const [ownerId, list] of Object.entries(db.walletsByUser)) {
    const found = list.find((w) => w.id === walletId)
    if (found && ownerId !== userId) {
      throw new MockHttpError({
        status: 403,
        code: 'FORBIDDEN',
        message: 'Você não tem permissão para editar esta carteira.',
      })
    }
  }

  const wallets = db.walletsByUser[userId] ?? []
  const wallet = wallets.find((w) => w.id === walletId)
  if (!wallet) {
    throw new MockHttpError({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Carteira não encontrada.',
    })
  }

  const nextNetwork = input.network ?? wallet.network
  const nextAddress = input.address?.trim() ?? wallet.address
  const nextRole = input.role ?? wallet.role

  if (!isValidWalletAddressForNetwork(nextAddress, nextNetwork)) {
    throw new MockHttpError({
      status: 422,
      code: 'VALIDATION_FAILED',
      message: VALIDATION_MESSAGES.invalidAddress,
      fieldErrors: { address: [VALIDATION_MESSAGES.invalidAddress] },
    })
  }

  if (
    wallets.some((w) => w.id !== walletId && w.address.toLowerCase() === nextAddress.toLowerCase())
  ) {
    throw new MockHttpError({
      status: 409,
      code: 'WALLET_CONFLICT',
      message: 'Este endereço de carteira já está cadastrado.',
      fieldErrors: { address: ['Este endereço de carteira já está cadastrado.'] },
    })
  }

  if (wallets.some((w) => w.id !== walletId && w.role === nextRole)) {
    throw new MockHttpError({
      status: 409,
      code: 'WALLET_CONFLICT',
      message: `Você já possui uma carteira ${nextRole === 'primary' ? 'principal' : 'secundária'}.`,
      fieldErrors: {
        role: [
          `Você já possui uma carteira ${nextRole === 'primary' ? 'principal' : 'secundária'}.`,
        ],
      },
    })
  }

  if (input.label !== undefined) wallet.label = input.label.trim()
  wallet.address = nextAddress
  if (input.ens !== undefined) wallet.ens = input.ens?.trim() ? input.ens.trim() : null
  wallet.network = nextNetwork
  if (input.provider !== undefined) wallet.provider = input.provider
  wallet.role = nextRole
  if (input.holder !== undefined) {
    wallet.holder = {
      displayName: input.holder.displayName.trim(),
      profileName: input.holder.profileName.trim(),
      email: input.holder.email.trim().toLowerCase(),
      ensName: input.holder.ensName.trim().replace(/\.eth$/i, ''),
      referralCode: input.holder.referralCode.trim(),
    }
  }
  wallet.version += 1

  return wallet
}
