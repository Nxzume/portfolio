/** Display widths we bake under /images/optimized via scripts/optimize-images.mjs */
const WIDTHS = [960, 1600] as const

function stemFromSrc(src: string): string | null {
  if (!src.startsWith('/images/')) return null
  const file = src.slice('/images/'.length)
  if (!file || file.includes('/') || file.includes('..')) return null
  const dot = file.lastIndexOf('.')
  if (dot <= 0) return null
  return file.slice(0, dot)
}

/** True when optimized WebP siblings exist for this content path. */
export function hasOptimizedVariants(src: string): boolean {
  return stemFromSrc(src) != null
}

/**
 * Build a responsive srcset that prefers baked WebP widths.
 * Falls back to the original path when the stem is unknown.
 */
export function responsiveImage(src: string): {
  src: string
  srcSet?: string
  sizes: string
} {
  const stem = stemFromSrc(src)
  if (!stem) {
    return { src, sizes: '100vw' }
  }

  const srcSet = WIDTHS.map((w) => `/images/optimized/${stem}-${w}.webp ${w}w`).join(', ')
  return {
    // Prefer the smallest WebP; ResponsiveImg falls back to `src` (original) on 404.
    src: `/images/optimized/${stem}-${WIDTHS[0]}.webp`,
    srcSet,
    sizes: '100vw',
  }
}

/** Project-card media: ~full width on mobile, ~38% column on desktop. */
export function projectMediaSizes(): string {
  return '(max-width: 860px) 100vw, 38vw'
}

/** Contact / about decorative media. */
export function panelMediaSizes(): string {
  return '(max-width: 860px) 100vw, 720px'
}
