import { useState, type ImgHTMLAttributes } from 'react'
import { panelMediaSizes, projectMediaSizes, responsiveImage } from '../lib/images'

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> & {
  src: string
  /** Layout hint for sizes attribute. */
  layout?: 'full' | 'project' | 'panel'
}

const SIZES = {
  full: '100vw',
  project: projectMediaSizes(),
  panel: panelMediaSizes(),
} as const

/**
 * Prefers baked WebP srcset when present; falls back to the original path if
 * the optimized asset 404s (e.g. wiped by an admin publish before regenerate).
 */
export function ResponsiveImg({ src, layout = 'full', alt = '', onError, ...rest }: Props) {
  const [failed, setFailed] = useState(false)
  const img = responsiveImage(src)

  return (
    <img
      {...rest}
      src={failed ? src : img.src}
      srcSet={failed ? undefined : img.srcSet}
      sizes={failed ? undefined : SIZES[layout]}
      alt={alt}
      onError={(event) => {
        if (!failed) setFailed(true)
        onError?.(event)
      }}
    />
  )
}
