import { z } from 'zod'
import { copy } from '@/content/copy'

export const PasswordSchema = z
  .string()
  .min(8, copy.validation.passwordMin)
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, copy.validation.passwordMin)

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
  expiresAt: z.string(),
})
export type Session = z.infer<typeof SessionSchema>

export const AuthResponseSchema = z.object({
  user: UserSummarySchema,
  session: SessionSchema,
})
export type AuthResponse = z.infer<typeof AuthResponseSchema>

export const LoginInputSchema = z.object({
  email: z.email(copy.validation.invalidEmail),
  password: z.string().min(1, copy.validation.required),
})
export type LoginInput = z.infer<typeof LoginInputSchema>

export const RegisterInputSchema = z.object({
  username: z.string().trim().min(2, copy.validation.required),
  email: z.email(copy.validation.invalidEmail),
  password: PasswordSchema,
})
export type RegisterInput = z.infer<typeof RegisterInputSchema>
