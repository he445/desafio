import { z } from 'zod'
import {
  EthAmountSchema,
  HolderSchema,
  isValidWalletAddressForNetwork,
  NetworkIdSchema,
  VALIDATION_MESSAGES,
  WalletProviderSchema,
} from './common'
import { PasswordSchema } from './auth'

export const OrderStatusSchema = z.enum(['pending', 'confirmed', 'rejected'])
export type OrderStatus = z.infer<typeof OrderStatusSchema>

export const OrderRejectionReasonSchema = z
  .enum(['insufficient_funds', 'wallet_rejected'])
  .nullable()
export type OrderRejectionReason = z.infer<typeof OrderRejectionReasonSchema>

export const OrderReceiptLineSchema = z.object({
  nftId: z.string(),
  editionId: z.string(),
  title: z.string(),
  tokenId: z.string(),
  editionName: z.string(),
  image: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: EthAmountSchema,
  lineTotal: EthAmountSchema,
})
export type OrderReceiptLine = z.infer<typeof OrderReceiptLineSchema>

export const OrderReceiptSchema = z.object({
  lines: z.array(OrderReceiptLineSchema),
  subtotal: EthAmountSchema,
  discount: EthAmountSchema,
  networkFee: EthAmountSchema,
  total: EthAmountSchema,
  couponCode: z.string().nullable(),
})
export type OrderReceipt = z.infer<typeof OrderReceiptSchema>

export const OrderTransactionSchema = z.object({
  hash: z.string(),
  explorerUrl: z.string(),
})
export type OrderTransaction = z.infer<typeof OrderTransactionSchema>

export const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: OrderStatusSchema,
  rejectionReason: OrderRejectionReasonSchema,
  quoteId: z.string(),
  walletId: z.string(),
  network: NetworkIdSchema,
  provider: WalletProviderSchema,
  receipt: OrderReceiptSchema,
  transaction: OrderTransactionSchema.nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  version: z.number().int().positive(),
})
export type Order = z.infer<typeof OrderSchema>

export const BuyerSchema = HolderSchema.extend({
  username: z.string().trim().min(1, VALIDATION_MESSAGES.required),
  note: z.string().nullable(),
})
export type Buyer = z.infer<typeof BuyerSchema>

export const CreateOrderInputSchema = z.object({
  quoteId: z.string().min(1, VALIDATION_MESSAGES.required),
  connectionId: z.string().min(1, VALIDATION_MESSAGES.required),
  buyer: BuyerSchema,
})
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>

export const PendingOrdersResponseSchema = z.object({
  items: z.array(OrderSchema),
})
export type PendingOrdersResponse = z.infer<typeof PendingOrdersResponseSchema>

export const WalletConnectionInputSchema = z.object({
  walletId: z.string().min(1, VALIDATION_MESSAGES.required),
  network: NetworkIdSchema,
  provider: WalletProviderSchema,
})
export type WalletConnectionInput = z.infer<typeof WalletConnectionInputSchema>

export const WalletConnectionResponseSchema = z.object({
  connectionId: z.string(),
  walletId: z.string(),
  network: NetworkIdSchema,
  provider: WalletProviderSchema,
  status: z.literal('connected'),
})
export type WalletConnectionResponse = z.infer<typeof WalletConnectionResponseSchema>

export const ProfileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  email: z.email(),
  ensName: z.string().nullable(),
  walletNickname: z.string(),
  avatarUrl: z.string().nullable(),
  referralCode: z.string(),
})
export type Profile = z.infer<typeof ProfileSchema>

export const UpdateProfileInputSchema = z.object({
  displayName: z.string().trim().min(1, VALIDATION_MESSAGES.required),
  username: z.string().trim().min(1, VALIDATION_MESSAGES.required),
  email: z.email(VALIDATION_MESSAGES.invalidEmail),
  ensName: z.string().trim().nullable(),
  walletNickname: z.string().trim().min(1, VALIDATION_MESSAGES.required),
})
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>

export const AVATAR_TYPES: readonly string[] = ['image/png', 'image/jpeg', 'image/webp']
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

export const AvatarResponseSchema = z.object({
  avatarUrl: z.string().nullable(),
})
export type AvatarResponse = z.infer<typeof AvatarResponseSchema>

export const ChangePasswordInputSchema = z.object({
  currentPassword: z.string().min(1, VALIDATION_MESSAGES.required),
  newPassword: PasswordSchema,
})
export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>

export const WalletRoleSchema = z.enum(['primary', 'secondary'])
export type WalletRole = z.infer<typeof WalletRoleSchema>

export const WalletSchema = z.object({
  id: z.string(),
  label: z.string(),
  address: z.string(),
  ens: z.string().nullable(),
  provider: WalletProviderSchema,
  holder: HolderSchema,
  network: NetworkIdSchema,
  role: WalletRoleSchema,
  version: z.number().int().positive(),
})
export type Wallet = z.infer<typeof WalletSchema>

export const WalletsResponseSchema = z.object({
  items: z.array(WalletSchema),
})
export type WalletsResponse = z.infer<typeof WalletsResponseSchema>

export const CreateWalletInputSchema = z
  .object({
    label: z.string().trim().min(1, VALIDATION_MESSAGES.required),
    address: z.string().trim().min(1, VALIDATION_MESSAGES.required),
    ens: z.string().trim().nullable(),
    network: NetworkIdSchema,
    provider: WalletProviderSchema,
    role: WalletRoleSchema,
    holder: HolderSchema,
  })
  .refine((data) => isValidWalletAddressForNetwork(data.address, data.network), {
    message: VALIDATION_MESSAGES.invalidAddress,
    path: ['address'],
  })
export type CreateWalletInput = z.infer<typeof CreateWalletInputSchema>

export const UpdateWalletInputSchema = z.object({
  label: z.string().trim().min(1, VALIDATION_MESSAGES.required).optional(),
  address: z.string().trim().min(1, VALIDATION_MESSAGES.required).optional(),
  ens: z.string().trim().nullable().optional(),
  network: NetworkIdSchema.optional(),
  provider: WalletProviderSchema.optional(),
  role: WalletRoleSchema.optional(),
  holder: HolderSchema.optional(),
})
export type UpdateWalletInput = z.infer<typeof UpdateWalletInputSchema>
