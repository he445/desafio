import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const ARTS = ['emerald', 'nomad', 'baron', 'golden']
const SIZES = [320, 640, 960]

async function copyFont() {
  const fontSrc = path.join(
    rootDir,
    'node_modules',
    '@fontsource-variable',
    'roboto-mono',
    'files',
    'roboto-mono-latin-wght-normal.woff2',
  )
  const fontDestDir = path.join(rootDir, 'public', 'fonts')
  await fs.mkdir(fontDestDir, { recursive: true })
  await fs.copyFile(fontSrc, path.join(fontDestDir, 'roboto-mono-latin-wght-normal.woff2'))
}

async function createViewBuffers(inputPath) {
  const baseImage = sharp(inputPath)
  const meta = await baseImage.metadata()
  const w = meta.width ?? 1024
  const h = meta.height ?? 1024
  const side = Math.min(w, h)

  // View 1: full square
  const view1 = await sharp(inputPath).resize(side, side, { fit: 'cover' }).png().toBuffer()

  // View 2: face (top-center 60% square crop)
  const faceSide = Math.round(side * 0.6)
  const faceLeft = Math.round((w - faceSide) / 2)
  const faceTop = Math.round(h * 0.06)
  const view2 = await sharp(inputPath)
    .extract({
      left: Math.max(0, faceLeft),
      top: Math.max(0, Math.min(h - faceSide, faceTop)),
      width: faceSide,
      height: faceSide,
    })
    .png()
    .toBuffer()

  // View 3: detail (bottom-center 50% square crop)
  const detailSide = Math.round(side * 0.5)
  const detailLeft = Math.round((w - detailSide) / 2)
  const detailTop = h - detailSide
  const view3 = await sharp(inputPath)
    .extract({
      left: Math.max(0, detailLeft),
      top: Math.max(0, detailTop),
      width: detailSide,
      height: detailSide,
    })
    .png()
    .toBuffer()

  // View 4: framed on #241612 with 8% margin
  const margin = Math.round(side * 0.08)
  const innerSide = side - margin * 2
  const innerBuffer = await sharp(view1).resize(innerSide, innerSide).png().toBuffer()
  const view4 = await sharp({
    create: {
      width: side,
      height: side,
      channels: 4,
      background: '#241612',
    },
  })
    .composite([{ input: innerBuffer, top: margin, left: margin }])
    .png()
    .toBuffer()

  return [view1, view2, view3, view4]
}

async function buildNftImages() {
  const outDir = path.join(rootDir, 'public', 'images', 'nfts')
  await fs.mkdir(outDir, { recursive: true })

  const manifest = {}

  for (const art of ARTS) {
    const srcPath = path.join(rootDir, 'assets', 'figma', `${art}.png`)
    const views = await createViewBuffers(srcPath)
    manifest[art] = []

    for (let i = 0; i < views.length; i++) {
      const viewIndex = i + 1
      const viewBuffer = views[i]
      const variants = { webp: {}, avif: {} }

      for (const size of SIZES) {
        const webpName = `${art}-${viewIndex}-${size}.webp`
        const avifName = `${art}-${viewIndex}-${size}.avif`

        await sharp(viewBuffer)
          .resize(size, size)
          .webp({ quality: 82 })
          .toFile(path.join(outDir, webpName))

        await sharp(viewBuffer)
          .resize(size, size)
          .avif({ quality: 68 })
          .toFile(path.join(outDir, avifName))

        variants.webp[size] = `/images/nfts/${webpName}`
        variants.avif[size] = `/images/nfts/${avifName}`
      }

      const defaultWebpName = `${art}-${viewIndex}.webp`
      await fs.copyFile(
        path.join(outDir, `${art}-${viewIndex}-640.webp`),
        path.join(outDir, defaultWebpName),
      )

      manifest[art].push({
        view: viewIndex,
        src: `/images/nfts/${defaultWebpName}`,
        width: 640,
        height: 640,
        variants,
      })
    }
  }

  await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
}

async function main() {
  await copyFont()
  await buildNftImages()
  console.log('Assets built in public/fonts and public/images/nfts')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
