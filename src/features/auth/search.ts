import { z } from 'zod'
import { toSafeRedirect } from '@/lib/redirect'

const RedirectSchema = z.string().optional().transform(toSafeRedirect).catch(undefined)

export const LoginSearchSchema = z.object({
  redirect: RedirectSchema,
  reason: z.enum(['expired']).optional().catch(undefined),
})

export const RegisterSearchSchema = z.object({
  redirect: RedirectSchema,
})

// Account pages opened from the checkout carry the way back.
export const ReturnSearchSchema = z.object({
  redirect: RedirectSchema,
})
