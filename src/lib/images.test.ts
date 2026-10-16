import { describe, expect, it } from 'vitest'
import { imageSets } from './images'

describe('imageSets', () => {
  it('builds the AVIF and WebP srcsets the asset script writes', () => {
    expect(imageSets('/images/nfts/emerald-1.webp')).toEqual({
      avif: '/images/nfts/emerald-1-320.avif 320w, /images/nfts/emerald-1-640.avif 640w, /images/nfts/emerald-1-960.avif 960w',
      webp: '/images/nfts/emerald-1-320.webp 320w, /images/nfts/emerald-1-640.webp 640w, /images/nfts/emerald-1-960.webp 960w',
    })
  })

  it('leaves alone anything the pipeline did not produce', () => {
    expect(imageSets('https://cdn.example/emerald-1.webp')).toBeNull()
    expect(imageSets('/images/nfts/emerald-1-640.webp')).toBeNull()
    expect(imageSets('data:image/png;base64,AAAA')).toBeNull()
  })
})
