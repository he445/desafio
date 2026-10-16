import { z } from 'zod'
import { VALIDATION_MESSAGES } from './common'

export const PasswordSchema = z
  .string()
  .min(8, VALIDATION_MESSAGES.passwordMin)
  .regex(/[A-Za-z]/, VALIDATION_MESSAGES.passwordLetterAndDigit)
  .regex(/\d/, VALIDATION_MESSAGES.passwordLetterAndDigit)

export const UserSummarySchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  email: z.email(),
  avatarUrl: z.string().nullable(),
})
export type UserSummary = z.infer<typeof UserSummarySchema>

export const SessionSchema = z.object({
  token: z.string(),
  userId: z.string(),
  expiresAt: z.iso.datetime(),
})
export type Session = z.infer<typeof SessionSchema>

export const AuthResponseSchema = z.object({
  user: UserSummarySchema,
  session: SessionSchema,
})
export type AuthResponse = z.infer<typeof AuthResponseSchema>

export const LoginInputSchema = z.object({
  email: z.email(VALIDATION_MESSAGES.invalidEmail),
  password: z.string().min(1, VALIDATION_MESSAGES.required),
})
export type LoginInput = z.infer<typeof LoginInputSchema>

export const RegisterInputSchema = z.object({
  username: z.string().trim().min(1, VALIDATION_MESSAGES.required),
  email: z.email(VALIDATION_MESSAGES.invalidEmail),
  password: PasswordSchema,
})
export type RegisterInput = z.infer<typeof RegisterInputSchema>
