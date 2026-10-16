import { z } from 'zod'

export const VALIDATION_MESSAGES = {
  required: 'Campo obrigatório',
  invalidEmail: 'E-mail inválido',
  passwordMin: 'A senha precisa de pelo menos 8 caracteres',
  passwordMismatch: 'As senhas não conferem',
  invalidAddress: 'Endereço inválido para a rede escolhida',
  usernameTaken: 'Nome de usuário já em uso',
  emailTaken: 'E-mail já cadastrado',
  invalidCredentials: 'E-mail ou senha incorretos',
  wrongPassword: 'Senha atual incorreta',
  couponInvalid: 'Código promocional inválido',
  couponExpired: 'Código promocional expirado',
  sessionExpiredBanner: 'Sua sessão expirou. Entre novamente para continuar.',
  emptyCart: 'Seu carrinho está vazio',
} as const

export const EthAmountSchema = z.string().regex(/^(0|[1-9]\d*)(\.\d{1,18})?$/, 'Valor ETH inválido')
export type EthAmount = z.infer<typeof EthAmountSchema>

export const NetworkIdSchema = z.enum(['ethereum', 'polygon', 'solana'])
export type NetworkId = z.infer<typeof NetworkIdSchema>

export const WalletProviderSchema = z.enum(['walletconnect', 'metamask', 'coinbase'])
export type WalletProvider = z.infer<typeof WalletProviderSchema>

export const HolderSchema = z.object({
  displayName: z.string().trim().min(1, VALIDATION_MESSAGES.required),
  profileName: z.string().trim().min(1, VALIDATION_MESSAGES.required),
  email: z.email(VALIDATION_MESSAGES.invalidEmail),
  ensName: z.string().trim().min(1, VALIDATION_MESSAGES.required),
  referralCode: z.string().trim().min(1, VALIDATION_MESSAGES.required),
})
export type Holder = z.infer<typeof HolderSchema>

export const ApiErrorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  retryable: z.boolean(),
  requestId: z.string(),
})

export const ApiErrorEnvelopeSchema = z.object({
  error: ApiErrorDetailSchema,
})
export type ApiErrorEnvelope = z.infer<typeof ApiErrorEnvelopeSchema>

export function isValidWalletAddressForNetwork(address: string, network: NetworkId): boolean {
  const trimmed = address.trim()
  if (network === 'ethereum' || network === 'polygon') {
    return /^0x[a-fA-F0-9]{40}$/.test(trimmed)
  }
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)
}
