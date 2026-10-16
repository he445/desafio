// Kept apart from copy.ts so the entry chunk can show the boot failure without loading anything
// else: when the boot fails, the other chunks are the likely reason.
export const bootCopy = {
  failedTitle: 'Não foi possível abrir a Kurio',
  failedText: 'Verifique sua conexão e recarregue a página.',
  reload: 'Recarregar',
} as const
