import { AVATAR_MAX_BYTES, AVATAR_TYPES } from '@/contracts'
import { copy } from '@/content/copy'

export const AVATAR_SIZE = 256

export function avatarFileIssue(file: Pick<File, 'type' | 'size'>): string | null {
  if (!AVATAR_TYPES.includes(file.type)) return copy.account.avatarTypeError
  if (file.size > AVATAR_MAX_BYTES) return copy.account.avatarSizeError
  return null
}

// The simulated server keeps the avatar as a data URL in localStorage, so an uncropped photo
// would eat the storage quota; a 256 px WebP stays around 10 to 30 KB.
export async function resizeAvatar(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is not available')
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  )
  bitmap.close()
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      'image/webp',
      0.85,
    )
  })
}
