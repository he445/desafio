import { isApiError } from './api-error'

// Keeps only the server messages for fields the form shows, in the form's order, so the
// first one can take the focus.
export function pickFieldErrors<F extends string>(
  error: unknown,
  fields: readonly F[],
): [F, string][] {
  const fieldErrors = isApiError(error) ? error.fieldErrors : undefined
  if (!fieldErrors) return []
  return fields.flatMap((field) => {
    const message = fieldErrors[field]?.[0]
    return message ? [[field, message] as [F, string]] : []
  })
}
