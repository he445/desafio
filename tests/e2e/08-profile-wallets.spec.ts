import type { Locator, Page } from '@playwright/test'
import { expect, gotoReady, loginAs, PASSWORD, test, USERS } from '../support/fixtures'

const RAFAEL_PRIMARY = '0x1111111111111111111111111111111111111111'
const NEW_PASSWORD = 'Outra@5678'

async function openAs(page: Page, path: '/profile' | '/wallets') {
  await gotoReady(page, `/login?redirect=${encodeURIComponent(path)}`)
  await loginAs(page, 'rafael')
  await expect(page).toHaveURL(path)
}

// A real image drawn by the browser, so the upload goes through decoding and resizing.
async function pngOf(page: Page, width: number, height: number): Promise<Buffer> {
  const dataUrl = await page.evaluate(
    ([w, h]) => {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const context = canvas.getContext('2d')
      if (context) {
        context.fillStyle = '#c6f432'
        context.fillRect(0, 0, w, h)
      }
      return canvas.toDataURL('image/png')
    },
    [width, height],
  )
  return Buffer.from(dataUrl.split(',')[1] ?? '', 'base64')
}

async function choose(form: Locator, label: string, option: string) {
  await form.getByRole('combobox', { name: label, exact: true }).click()
  await form.page().getByRole('option', { name: option, exact: true }).click()
}

test('profile errors land on their fields and the saved profile survives a refresh', async ({
  page,
}) => {
  await openAs(page, '/profile')
  const displayName = page.getByRole('textbox', { name: 'Nome de exibição', exact: true })
  const username = page.getByRole('textbox', { name: 'Nome de usuário', exact: true })
  await expect(displayName).toHaveValue('Rafael Mendes')

  await displayName.fill('')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(displayName).toHaveAttribute('aria-invalid', 'true')
  await expect(displayName).toBeFocused()

  // 409 from the server: the username belongs to another collector.
  await displayName.fill('Rafa Colecionador')
  await username.fill('marina')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Nome de usuário já em uso')).toBeVisible()
  await expect(username).toHaveAttribute('aria-invalid', 'true')
  await expect(username).toBeFocused()

  await username.fill('rafa.coleciona')
  await page.getByRole('textbox', { name: 'Nome ENS', exact: true }).fill('rafa')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Perfil salvo')).toBeVisible()

  await page.reload()
  await expect(displayName).toHaveValue('Rafa Colecionador')
  await expect(username).toHaveValue('rafa.coleciona')
  await expect(page.getByRole('textbox', { name: 'Nome ENS', exact: true })).toHaveValue('rafa')
})

test('the new password is the one that works at the next sign-in', async ({ page }) => {
  await openAs(page, '/profile')
  const current = page.getByLabel('Senha atual', { exact: true })
  const next = page.getByLabel('Nova senha', { exact: true })
  const confirm = page.getByLabel('Confirmar nova senha', { exact: true })

  await next.fill(NEW_PASSWORD)
  await confirm.fill('Diferente@1')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Campo obrigatório')).toBeVisible()
  await expect(page.getByText('As senhas não conferem')).toBeVisible()

  // 422 from the server: the current password is checked there, not in the browser.
  await current.fill('Errada@0000')
  await confirm.fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Senha atual incorreta')).toBeVisible()
  await expect(current).toHaveAttribute('aria-invalid', 'true')

  await current.fill(PASSWORD)
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Senha alterada')).toBeVisible()
  await expect(current).toHaveValue('')

  await page.getByRole('button', { name: 'Sair' }).click()
  await expect(page).toHaveURL('/')
  await gotoReady(page, '/login')
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(USERS.rafael)
  await page.getByLabel('Senha', { exact: true }).fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByText('E-mail ou senha incorretos')).toBeVisible()

  await page.getByLabel('Senha', { exact: true }).fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).not.toHaveURL(/\/login/)
})

test('the avatar is resized to a 256 px WebP and can be removed', async ({ page }) => {
  await openAs(page, '/profile')
  const file = page.locator('input[type="file"]')
  const avatar = page.getByRole('img', { name: 'Seu avatar' })

  await file.setInputFiles({
    name: 'anim.gif',
    mimeType: 'image/gif',
    buffer: Buffer.from('GIF89a'),
  })
  await expect(page.getByText('Formato não suportado. Use PNG, JPEG ou WebP.')).toBeVisible()

  await file.setInputFiles({
    name: 'photo.png',
    mimeType: 'image/png',
    buffer: await pngOf(page, 900, 600),
  })
  await expect(page.getByText('Avatar atualizado')).toBeVisible()
  await expect(avatar).toHaveAttribute('src', /^data:image\/webp/)

  await page.reload()
  await expect(avatar).toHaveAttribute('src', /^data:image\/webp/)
  expect(await avatar.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(256)

  await page.getByRole('button', { name: 'Remover' }).click()
  await expect(page.getByText('Avatar removido')).toBeVisible()
  await expect(avatar).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Alterar' })).toBeVisible()
  await expect(avatar).toHaveCount(0)
})

test('wallets start empty, report conflicts on the address and persist', async ({ page }) => {
  await openAs(page, '/wallets')
  const primary = page.getByRole('form', { name: 'Formulário da carteira principal' })
  await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()

  await page.getByRole('button', { name: 'Adicionar' }).first().click()
  await expect(
    primary.getByRole('textbox', { name: 'Nome de exibição', exact: true }),
  ).toBeFocused()
  await expect(primary.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(
    USERS.rafael,
  )

  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(primary.getByRole('combobox', { name: 'Rede', exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  )

  await primary.getByRole('textbox', { name: 'Apelido da carteira', exact: true }).fill('Cofre')
  await choose(primary, 'Rede', 'Solana')
  await primary
    .getByRole('textbox', { name: 'Endereço da carteira', exact: true })
    .fill(RAFAEL_PRIMARY)
  await choose(primary, 'Tipo de carteira', 'MetaMask')
  await primary.getByRole('textbox', { name: 'Nome ENS', exact: true }).fill('rafael')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(primary.getByText('Endereço inválido para a rede escolhida')).toBeVisible()

  await choose(primary, 'Rede', 'Ethereum')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira salva')).toBeVisible()

  await page.getByRole('button', { name: 'Adicionar' }).click()
  const secondary = page.getByRole('form', { name: 'Formulário da carteira secundária' })
  await expect(
    secondary.getByRole('textbox', { name: 'Nome de exibição', exact: true }),
  ).toBeFocused()
  await page.getByLabel('Igual à carteira principal').check()
  await expect(secondary.getByRole('textbox', { name: 'Nome ENS', exact: true })).toHaveValue(
    'rafael',
  )

  // 409 WALLET_CONFLICT from the server, shown on the address field.
  await secondary.getByRole('textbox', { name: 'Apelido da carteira', exact: true }).fill('Reserva')
  await choose(secondary, 'Rede', 'Polygon')
  await secondary
    .getByRole('textbox', { name: 'Endereço da carteira', exact: true })
    .fill(RAFAEL_PRIMARY)
  await choose(secondary, 'Tipo de carteira', 'Coinbase Wallet')
  await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
  const address = secondary.getByRole('textbox', { name: 'Endereço da carteira', exact: true })
  await expect(secondary.getByText('Este endereço de carteira já está cadastrado.')).toBeVisible()
  await expect(address).toHaveAttribute('aria-invalid', 'true')
  await expect(address).toBeFocused()

  await address.fill('0x2222222222222222222222222222222222222222')
  await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira salva')).toHaveCount(2)

  await page.reload()
  await expect(
    primary.getByRole('textbox', { name: 'Apelido da carteira', exact: true }),
  ).toHaveValue('Cofre')
  await expect(
    primary.getByRole('textbox', { name: 'Endereço da carteira', exact: true }),
  ).toHaveValue(RAFAEL_PRIMARY)
  await expect(secondary.getByRole('combobox', { name: 'Rede', exact: true })).toHaveText('Polygon')
  await expect(page.getByRole('button', { name: 'Adicionar' })).toHaveCount(0)

  await primary
    .getByRole('textbox', { name: 'Apelido da carteira', exact: true })
    .fill('Cofre frio')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira salva')).toBeVisible()
  await page.reload()
  await expect(
    primary.getByRole('textbox', { name: 'Apelido da carteira', exact: true }),
  ).toHaveValue('Cofre frio')
})
