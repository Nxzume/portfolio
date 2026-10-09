import type { ImgHTMLAttributes } from 'react'
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

/** Serves baked WebP srcset when available; otherwise the original path. */
export function ResponsiveImg({ src, layout = 'full', alt = '', ...rest }: Props) {
  const img = responsiveImage(src)
  return (
    <img
      {...rest}
      src={img.src}
      srcSet={img.srcSet}
      sizes={SIZES[layout]}
      alt={alt}
    />
  )
}
