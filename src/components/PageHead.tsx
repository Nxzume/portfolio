import { useEffect } from 'react'
import { useContent } from '../content/context'
import { applyMeta, type PageMeta } from '../lib/meta'
import { usePreviewMode } from './PreviewMode'

/**
 * Prerendered HTML already carries these tags; this keeps them correct after
 * client-side navigation, when no new document is fetched.
 */
export function PageHead({ meta }: { meta: PageMeta }) {
  const { site } = useContent()
  const preview = usePreviewMode()
  const { title, description, path, image, noindex } = meta

  useEffect(() => {
    if (preview) return
    applyMeta({ title, description, path, image, noindex }, site)
  }, [title, description, path, image, noindex, site, preview])

  return null
}
