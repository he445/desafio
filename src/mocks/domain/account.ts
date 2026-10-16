import {
  isValidWalletAddressForNetwork,
  VALIDATION_MESSAGES,
  type ChangePasswordInput,
  type CreateWalletInput,
  type Holder,
  type NetworkId,
  type Profile,
  type UpdateProfileInput,
  type UpdateWalletInput,
  type Wallet,
  type WalletRole,
} from '@/contracts'
import type { MockDb, MockUserRecord } from '@/mocks/db/schema'
import { hashPassword, verifyPassword } from './crypto'
import { MockHttpError } from './errors'

const RESERVED_USERNAMES = new Set(['admin', 'root', 'support', 'kurio'])

function fieldConflict(code: string, field: string, message: string): MockHttpError {
  return new MockHttpError({ status: 409, code, message, fieldErrors: { [field]: [message] } })
}

export function assertUsernameAvailable(db: MockDb, username: string, exceptUserId?: string) {
  const wanted = username.toLowerCase()
  const taken =
    RESERVED_USERNAMES.has(wanted) ||
    db.users.some((user) => user.id !== exceptUserId && user.username.toLowerCase() === wanted)
  if (taken) throw fieldConflict('USERNAME_TAKEN', 'username', VALIDATION_MESSAGES.usernameTaken)
}

export function assertEmailAvailable(db: MockDb, email: string, exceptUserId?: string) {
  const wanted = email.toLowerCase()
  if (db.users.some((user) => user.id !== exceptUserId && user.email.toLowerCase() === wanted)) {
    throw fieldConflict('EMAIL_TAKEN', 'email', VALIDATION_MESSAGES.emailTaken)
  }
}

function requireUser(db: MockDb, userId: string): MockUserRecord {
  const user = db.users.find((candidate) => candidate.id === userId)
  if (!user) {
    throw new MockHttpError({ status: 404, code: 'NOT_FOUND', message: 'Perfil não encontrado.' })
  }
  return user
}

function stripEnsSuffix(name: string): string {
  return name.trim().replace(/\.eth$/i, '')
}

export function getProfileForUser(db: MockDb, userId: string): Profile {
  const user = requireUser(db, userId)
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
  const user = requireUser(db, userId)
  const username = input.username.trim()
  const email = input.email.trim().toLowerCase()
  assertUsernameAvailable(db, username, userId)
  assertEmailAvailable(db, email, userId)

  user.displayName = input.displayName.trim()
  user.username = username
  user.email = email
  user.ensName = input.ensName?.trim() ? stripEnsSuffix(input.ensName) : null
  user.walletNickname = input.walletNickname.trim()

  return getProfileForUser(db, userId)
}

export function updateAvatarForUser(
  db: MockDb,
  userId: string,
  avatarUrl: string | null,
): { avatarUrl: string | null } {
  const user = requireUser(db, userId)
  user.avatarUrl = avatarUrl
  return { avatarUrl: user.avatarUrl }
}

export async function changePasswordForUser(
  db: MockDb,
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const user = requireUser(db, userId)

  if (!(await verifyPassword(input.currentPassword, user.passwordSalt, user.passwordHash))) {
    throw new MockHttpError({
      status: 422,
      code: 'WRONG_PASSWORD',
      message: VALIDATION_MESSAGES.wrongPassword,
      fieldErrors: { currentPassword: [VALIDATION_MESSAGES.wrongPassword] },
    })
  }

  if (input.currentPassword === input.newPassword) {
    const message = 'A nova senha deve ser diferente da senha atual.'
    throw new MockHttpError({
      status: 422,
      code: 'VALIDATION_FAILED',
      message,
      fieldErrors: { newPassword: [message] },
    })
  }

  user.passwordSalt = `kurio-salt-${crypto.randomUUID()}`
  user.passwordHash = await hashPassword(input.newPassword, user.passwordSalt)
}

export function getWalletsForUser(db: MockDb, userId: string): Wallet[] {
  return db.walletsByUser[userId] ?? []
}

// EVM addresses are hex and case-insensitive; Solana base58 addresses are case-sensitive.
function sameAddress(a: string, b: string): boolean {
  return a.startsWith('0x') && b.startsWith('0x') ? a.toLowerCase() === b.toLowerCase() : a === b
}

function normalizeHolder(holder: Holder): Holder {
  return {
    displayName: holder.displayName.trim(),
    profileName: holder.profileName.trim(),
    email: holder.email.trim().toLowerCase(),
    ensName: stripEnsSuffix(holder.ensName),
    referralCode: holder.referralCode.trim(),
  }
}

function assertWalletSlot(
  wallets: Wallet[],
  next: { id?: string; address: string; network: NetworkId; role: WalletRole },
) {
  if (!isValidWalletAddressForNetwork(next.address, next.network)) {
    throw new MockHttpError({
      status: 422,
      code: 'VALIDATION_FAILED',
      message: VALIDATION_MESSAGES.invalidAddress,
      fieldErrors: { address: [VALIDATION_MESSAGES.invalidAddress] },
    })
  }

  const others = wallets.filter((wallet) => wallet.id !== next.id)
  if (others.some((wallet) => sameAddress(wallet.address, next.address))) {
    throw fieldConflict(
      'WALLET_CONFLICT',
      'address',
      'Este endereço de carteira já está cadastrado.',
    )
  }
  if (others.some((wallet) => wallet.role === next.role)) {
    const slot = next.role === 'primary' ? 'principal' : 'secundária'
    throw fieldConflict('WALLET_CONFLICT', 'role', `Você já possui uma carteira ${slot}.`)
  }
}

export function createWalletForUser(db: MockDb, userId: string, input: CreateWalletInput): Wallet {
  const wallets = db.walletsByUser[userId] ?? []
  const address = input.address.trim()
  assertWalletSlot(wallets, { address, network: input.network, role: input.role })

  const wallet: Wallet = {
    id: `wallet-${crypto.randomUUID().slice(0, 8)}`,
    label: input.label.trim(),
    address,
    ens: input.ens?.trim() ? input.ens.trim() : null,
    provider: input.provider,
    holder: normalizeHolder(input.holder),
    network: input.network,
    role: input.role,
    version: 1,
  }

  db.walletsByUser[userId] = [...wallets, wallet]
  return wallet
}

export function updateWalletForUser(
  db: MockDb,
  userId: string,
  walletId: string,
  input: UpdateWalletInput,
): Wallet {
  const ownerId = Object.entries(db.walletsByUser).find(([, list]) =>
    list.some((wallet) => wallet.id === walletId),
  )?.[0]
  if (ownerId && ownerId !== userId) {
    throw new MockHttpError({
      status: 403,
      code: 'FORBIDDEN',
      message: 'Você não tem permissão para editar esta carteira.',
    })
  }

  const wallets = db.walletsByUser[userId] ?? []
  const wallet = wallets.find((candidate) => candidate.id === walletId)
  if (!wallet) {
    throw new MockHttpError({ status: 404, code: 'NOT_FOUND', message: 'Carteira não encontrada.' })
  }

  const next = {
    id: wallet.id,
    address: input.address?.trim() ?? wallet.address,
    network: input.network ?? wallet.network,
    role: input.role ?? wallet.role,
  }
  assertWalletSlot(wallets, next)

  if (input.label !== undefined) wallet.label = input.label.trim()
  if (input.ens !== undefined) wallet.ens = input.ens?.trim() ? input.ens.trim() : null
  if (input.provider !== undefined) wallet.provider = input.provider
  if (input.holder !== undefined) wallet.holder = normalizeHolder(input.holder)
  wallet.address = next.address
  wallet.network = next.network
  wallet.role = next.role
  wallet.version += 1

  return wallet
}
