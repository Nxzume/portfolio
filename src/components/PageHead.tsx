import { useEffect } from 'react'
import { usePortfolioContent } from '../content'
import { applyMeta, type PageMeta } from '../lib/meta'

export function PageHead({ meta }: { meta: PageMeta }) {
  const { site } = usePortfolioContent()
  const { title, description, path, image, noindex } = meta

  useEffect(() => {
    applyMeta(site, { title, description, path, image, noindex })
  }, [site, title, description, path, image, noindex])

  return null
}
