import {
  VALIDATION_MESSAGES,
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
  type UserSummary,
} from '@/contracts'
import type { MockDb, MockSessionRecord, MockUserRecord } from '@/mocks/db/schema'
import { assertEmailAvailable, assertUsernameAvailable } from './account'
import { hashPassword, verifyPassword } from './crypto'
import { MockHttpError } from './errors'

const DEFAULT_SESSION_TTL_MS = 24 * 3600_000

interface SessionOptions {
  now?: number
  ttlMs?: number
}

export function toUserSummary(user: MockUserRecord): UserSummary {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
  }
}

function createSessionRecord(
  db: MockDb,
  userId: string,
  { now = Date.now(), ttlMs = DEFAULT_SESSION_TTL_MS }: SessionOptions,
): MockSessionRecord {
  const session: MockSessionRecord = {
    token: `kurio-tok-${crypto.randomUUID()}`,
    userId,
    expiresAt: new Date(now + ttlMs).toISOString(),
  }
  db.sessions.push(session)
  return session
}

function createReferralCode(db: MockDb): string {
  let code: string
  do {
    code = `KURIO-${crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase()}`
  } while (db.users.some((user) => user.referralCode === code))
  return code
}

export async function registerUser(
  db: MockDb,
  input: RegisterInput,
  options: SessionOptions = {},
): Promise<AuthResponse> {
  const email = input.email.trim().toLowerCase()
  const username = input.username.trim()
  assertEmailAvailable(db, email)
  assertUsernameAvailable(db, username)

  const salt = `kurio-salt-${crypto.randomUUID()}`
  const user: MockUserRecord = {
    id: `user-${crypto.randomUUID().slice(0, 8)}`,
    username,
    displayName: username,
    email,
    ensName: null,
    walletNickname: `Carteira ${username}`,
    avatarUrl: null,
    referralCode: createReferralCode(db),
    passwordSalt: salt,
    passwordHash: await hashPassword(input.password, salt),
  }

  db.users.push(user)
  db.favoritesByUser[user.id] = []
  db.walletsByUser[user.id] = []

  return { user: toUserSummary(user), session: createSessionRecord(db, user.id, options) }
}

export async function loginUser(
  db: MockDb,
  input: LoginInput,
  options: SessionOptions = {},
): Promise<AuthResponse> {
  const email = input.email.trim().toLowerCase()
  const user = db.users.find((candidate) => candidate.email.toLowerCase() === email)
  const valid = user
    ? await verifyPassword(input.password, user.passwordSalt, user.passwordHash)
    : false
  if (!user || !valid) {
    throw new MockHttpError({
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: VALIDATION_MESSAGES.invalidCredentials,
    })
  }

  return { user: toUserSummary(user), session: createSessionRecord(db, user.id, options) }
}

function readBearerToken(authHeader: string | null | undefined): string | null {
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() || null : null
}

export function getAuthenticatedUser(
  db: MockDb,
  authHeader: string | null | undefined,
  now = Date.now(),
): { user: MockUserRecord; session: MockSessionRecord } {
  const token = readBearerToken(authHeader)
  const session = token ? db.sessions.find((candidate) => candidate.token === token) : undefined
  const user = session ? db.users.find((candidate) => candidate.id === session.userId) : undefined
  if (!session || !user) {
    throw new MockHttpError({
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Autenticação necessária.',
    })
  }

  if (new Date(session.expiresAt).getTime() <= now) {
    throw new MockHttpError({
      status: 401,
      code: 'SESSION_EXPIRED',
      message: 'Sessão expirada. Entre novamente.',
    })
  }

  return { user, session }
}

export function findSessionUserId(db: MockDb, token: string | undefined, now = Date.now()) {
  const session = db.sessions.find((candidate) => candidate.token === token)
  return session && new Date(session.expiresAt).getTime() > now ? session.userId : null
}

export function logoutSession(db: MockDb, authHeader: string | null | undefined): void {
  const token = readBearerToken(authHeader)
  if (!token) return
  db.sessions = db.sessions.filter((session) => session.token !== token)
}

export function expireActiveSessions(db: MockDb, now = Date.now()): void {
  const past = new Date(now - 60_000).toISOString()
  for (const session of db.sessions) {
    session.expiresAt = past
  }
}
