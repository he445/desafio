import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AVATAR_TYPES } from '@/contracts'
import { copy } from '@/content/copy'
import { Image2Icon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { isApiError } from '@/lib/api-error'
import { avatarFileIssue, resizeAvatar } from '../avatar'
import { useAvatarMutation } from '../queries'

export function AvatarField({ userId, avatarUrl }: { userId: string; avatarUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const labelId = useId()
  const errorId = useId()
  const [error, setError] = useState<string | null>(null)
  const avatar = useAvatarMutation(userId)
  const busy = avatar.isPending

  const save = async (file: Blob | null) => {
    setError(null)
    try {
      await avatar.mutateAsync(file)
      toast.success(file ? copy.account.avatarSaved : copy.account.avatarRemoved)
    } catch (cause) {
      setError(isApiError(cause) ? cause.message : copy.errors.unexpected)
    }
  }

  const onFile = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = ''
    if (!file) return
    const issue = avatarFileIssue(file)
    if (issue) {
      setError(issue)
      return
    }
    let resized: Blob
    try {
      resized = await resizeAvatar(file)
    } catch {
      setError(copy.account.avatarReadError)
      return
    }
    await save(resized)
  }

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={error ? errorId : undefined}>
      <p id={labelId} className="flex h-[29px] items-center text-[15px]/[15px] text-foreground">
        {copy.account.avatar}
      </p>
      <div className="mt-2.5 flex items-center">
        <span className="flex size-[50px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-raised">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={copy.account.avatarAlt}
              width={50}
              height={50}
              className="size-full object-cover"
            />
          ) : (
            <Image2Icon size={24} aria-hidden="true" />
          )}
        </span>
        <Button
          type="button"
          variant="form"
          className="ml-6 h-10 w-[98px] text-sm"
          aria-disabled={busy || undefined}
          onClick={() => {
            if (!busy) inputRef.current?.click()
          }}
        >
          {busy ? copy.checkout.processing : copy.account.changeAvatar}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="ml-5 h-10 px-1 text-sm"
          disabled={!avatarUrl}
          aria-disabled={busy || undefined}
          onClick={() => {
            if (!busy) void save(null)
          }}
        >
          {copy.account.removeAvatar}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-coral">
          {error}
        </p>
      )}
    </div>
  )
}
