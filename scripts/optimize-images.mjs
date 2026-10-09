/**
 * Bake mobile-friendly WebP variants for heavy scroll-path images.
 * Polytrack stays smooth because textures match the display size — do the same.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC_DIR = path.join(ROOT, 'public/images')
const OUT_DIR = path.join(SRC_DIR, 'optimized')
const WIDTHS = [960, 1600]

const FILES = [
  'level-gameplay.png',
  'level-hero.jpg',
  'arena-gameplay.png',
  'arena-detail-1.png',
  'piano-detail.png',
  'piano-hero.png',
  'portrait.png',
]

async function optimizeOne(file) {
  const input = path.join(SRC_DIR, file)
  const base = path.basename(file, path.extname(file))
  try {
    await fs.access(input)
  } catch {
    console.warn(`skip missing ${file}`)
    return
  }

  for (const width of WIDTHS) {
    const out = path.join(OUT_DIR, `${base}-${width}.webp`)
    await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toFile(out)
    const stat = await fs.stat(out)
    console.log(`${path.relative(ROOT, out)} (${Math.round(stat.size / 1024)}KB)`)
  }
}

await fs.mkdir(OUT_DIR, { recursive: true })
for (const file of FILES) {
  await optimizeOne(file)
}
console.log('done')
