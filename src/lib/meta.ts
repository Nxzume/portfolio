import type { Project, SiteContent } from '../content/types'
import type { HeroContent } from '../content/types'

export type PageMeta = {
  title: string
  description: string
  path: string
  image?: string
  noindex?: boolean
}

function trim(text: string, max = 180) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

export function absoluteUrl(site: SiteContent, path: string) {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return site.url ? `${site.url}${suffix}` : suffix
}

export function homeMeta(site: SiteContent, hero: HeroContent): PageMeta {
  return {
    title: `${site.name} — Composer & Level Designer`,
    description: trim(site.tagline),
    path: '/',
    image: hero.image || undefined,
  }
}

export function projectMeta(site: SiteContent, hero: HeroContent, project: Project): PageMeta {
  const description = project.summary || project.intro[0] || site.tagline
  return {
    title: `${project.title} — ${site.name}`,
    description: trim(description),
    path: `/projects/${project.slug}`,
    image: project.image || hero.image || undefined,
  }
}

export function notFoundMeta(site: SiteContent): PageMeta {
  return {
    title: `Page not found — ${site.name}`,
    description: trim(`That page does not exist on ${site.name}’s portfolio.`),
    path: '/404',
    noindex: true,
  }
}

type TagSpec = { selector: string; attrs: Record<string, string> }

export function metaTagSpecs(site: SiteContent, meta: PageMeta): TagSpec[] {
  const canonical = absoluteUrl(site, meta.path)
  const image = meta.image ? absoluteUrl(site, meta.image) : ''

  const specs: TagSpec[] = [
    { selector: 'meta[name="description"]', attrs: { name: 'description', content: meta.description } },
    { selector: 'link[rel="canonical"]', attrs: { rel: 'canonical', href: canonical } },
    { selector: 'meta[property="og:type"]', attrs: { property: 'og:type', content: 'website' } },
    { selector: 'meta[property="og:site_name"]', attrs: { property: 'og:site_name', content: site.name } },
    { selector: 'meta[property="og:title"]', attrs: { property: 'og:title', content: meta.title } },
    {
      selector: 'meta[property="og:description"]',
      attrs: { property: 'og:description', content: meta.description },
    },
    { selector: 'meta[property="og:url"]', attrs: { property: 'og:url', content: canonical } },
    {
      selector: 'meta[name="twitter:card"]',
      attrs: { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
    },
    { selector: 'meta[name="twitter:title"]', attrs: { name: 'twitter:title', content: meta.title } },
    {
      selector: 'meta[name="twitter:description"]',
      attrs: { name: 'twitter:description', content: meta.description },
    },
  ]

  if (image) {
    specs.push(
      { selector: 'meta[property="og:image"]', attrs: { property: 'og:image', content: image } },
      { selector: 'meta[name="twitter:image"]', attrs: { name: 'twitter:image', content: image } },
    )
  }

  if (meta.noindex) {
    specs.push({ selector: 'meta[name="robots"]', attrs: { name: 'robots', content: 'noindex' } })
  }

  return specs
}

export function applyMeta(site: SiteContent, meta: PageMeta) {
  if (typeof document === 'undefined') return
  document.title = meta.title

  document.querySelector('meta[name="robots"]')?.remove()

  for (const { selector, attrs } of metaTagSpecs(site, meta)) {
    let el = document.head.querySelector(selector)
    if (!el) {
      el = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
      document.head.appendChild(el)
    }
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value)
  }
}
