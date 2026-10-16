import {
  VALIDATION_MESSAGES,
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
  type UserSummary,
} from '@/contracts'
import type { MockDb, MockSessionRecord, MockUserRecord } from '@/mocks/db/schema'
import { hashPassword, verifyPassword } from './crypto'
import { MockHttpError } from './errors'

const RESERVED_USERNAMES = new Set(['admin', 'root', 'support', 'kurio'])

export function toUserSummary(user: MockUserRecord): UserSummary {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
  }
}

function createSessionRecord(db: MockDb, userId: string, now = Date.now()): MockSessionRecord {
  const ttlMs = db.scenarioId === 'session-expired' ? 60_000 : 24 * 3600_000
  const session: MockSessionRecord = {
    token: `kurio-tok-${crypto.randomUUID()}`,
    userId,
    expiresAt: new Date(now + ttlMs).toISOString(),
  }
  db.sessions.push(session)
  return session
}

export async function registerUser(
  db: MockDb,
  input: RegisterInput,
  now = Date.now(),
): Promise<AuthResponse> {
  const normalizedEmail = input.email.trim().toLowerCase()
  const normalizedUsername = input.username.trim()

  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new MockHttpError({
      status: 409,
      code: 'EMAIL_TAKEN',
      message: VALIDATION_MESSAGES.emailTaken,
      fieldErrors: { email: [VALIDATION_MESSAGES.emailTaken] },
    })
  }

  if (
    RESERVED_USERNAMES.has(normalizedUsername.toLowerCase()) ||
    db.users.some((u) => u.username.toLowerCase() === normalizedUsername.toLowerCase())
  ) {
    throw new MockHttpError({
      status: 409,
      code: 'USERNAME_TAKEN',
      message: VALIDATION_MESSAGES.usernameTaken,
      fieldErrors: { username: [VALIDATION_MESSAGES.usernameTaken] },
    })
  }

  const salt = `kurio-salt-${crypto.randomUUID()}`
  const passwordHash = await hashPassword(input.password, salt)
  const suffix = Math.floor(1000 + (db.users.length + 1) * 1111)
    .toString()
    .slice(0, 4)

  const newUser: MockUserRecord = {
    id: `user-${crypto.randomUUID().slice(0, 8)}`,
    username: normalizedUsername,
    displayName: normalizedUsername,
    email: normalizedEmail,
    ensName: null,
    walletNickname: `Carteira ${normalizedUsername}`,
    avatarUrl: null,
    referralCode: `KURIO-${suffix}`,
    passwordSalt: salt,
    passwordHash,
  }

  db.users.push(newUser)
  db.favoritesByUser[newUser.id] = []
  db.walletsByUser[newUser.id] = []

  const session = createSessionRecord(db, newUser.id, now)
  return {
    user: toUserSummary(newUser),
    session,
  }
}

export async function loginUser(
  db: MockDb,
  input: LoginInput,
  now = Date.now(),
): Promise<AuthResponse> {
  const normalizedEmail = input.email.trim().toLowerCase()
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail)
  if (!user) {
    throw new MockHttpError({
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: VALIDATION_MESSAGES.invalidCredentials,
    })
  }

  const valid = await verifyPassword(input.password, user.passwordSalt, user.passwordHash)
  if (!valid) {
    throw new MockHttpError({
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: VALIDATION_MESSAGES.invalidCredentials,
    })
  }

  const session = createSessionRecord(db, user.id, now)
  return {
    user: toUserSummary(user),
    session,
  }
}

export function getAuthenticatedUser(
  db: MockDb,
  authHeader: string | null | undefined,
  now = Date.now(),
): { user: MockUserRecord; session: MockSessionRecord } {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  if (!token) {
    throw new MockHttpError({
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Autenticação necessária.',
    })
  }

  const session = db.sessions.find((s) => s.token === token)
  if (!session) {
    throw new MockHttpError({
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Sessão inválida.',
    })
  }

  if (new Date(session.expiresAt).getTime() <= now) {
    throw new MockHttpError({
      status: 401,
      code: 'SESSION_EXPIRED',
      message: 'Sessão expirada. Entre novamente.',
    })
  }

  const user = db.users.find((u) => u.id === session.userId)
  if (!user) {
    throw new MockHttpError({
      status: 401,
      code: 'UNAUTHENTICATED',
      message: 'Usuário não encontrado.',
    })
  }

  return { user, session }
}

export function logoutSession(db: MockDb, authHeader: string | null | undefined): void {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
  if (!token) return
  db.sessions = db.sessions.filter((s) => s.token !== token)
}

export function expireActiveSessions(db: MockDb): void {
  const past = new Date(Date.now() - 60_000).toISOString()
  for (const session of db.sessions) {
    session.expiresAt = past
  }
}
