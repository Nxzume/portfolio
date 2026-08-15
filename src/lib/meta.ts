import { hero, projects, site } from '../content'
import type { Project } from '../content/types'

export type PageMeta = {
  title: string
  description: string
  /** Site-relative path, always starting with "/". */
  path: string
  /** Site-relative image path used for link previews. */
  image?: string
  noindex?: boolean
}

/** Link preview cards truncate around 200 characters; keep whole words. */
function trim(text: string, max = 180) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

export function absoluteUrl(path: string) {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return site.url ? `${site.url}${suffix}` : suffix
}

export function homeMeta(): PageMeta {
  return {
    title: `${site.name} — Composer & Level Designer`,
    description: trim(site.tagline),
    path: '/',
    image: hero.image || undefined,
  }
}

export function projectMeta(project: Project): PageMeta {
  const description = project.summary || project.intro[0] || site.tagline
  return {
    title: `${project.title} — ${site.name}`,
    description: trim(description),
    path: `/projects/${project.slug}`,
    image: project.image || hero.image || undefined,
  }
}

export function notFoundMeta(): PageMeta {
  return {
    title: `Page not found — ${site.name}`,
    description: trim(`That page does not exist on ${site.name}’s portfolio.`),
    path: '/404',
    noindex: true,
  }
}

/** Resolves the same metadata the router would render, for build-time prerendering. */
export function metaForPath(pathname: string): PageMeta {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return homeMeta()
  const slug = path.startsWith('/projects/') ? path.slice('/projects/'.length) : ''
  const project = slug ? projects.find((p) => p.slug === slug) : undefined
  return project ? projectMeta(project) : notFoundMeta()
}

type TagSpec = { selector: string; attrs: Record<string, string> }

/** Single source of truth for the tags, so the DOM updater and the HTML emitter agree. */
export function metaTagSpecs(meta: PageMeta): TagSpec[] {
  const canonical = absoluteUrl(meta.path)
  const image = meta.image ? absoluteUrl(meta.image) : ''

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

/** Keeps the head correct after client-side navigation. */
export function applyMeta(meta: PageMeta) {
  if (typeof document === 'undefined') return
  document.title = meta.title

  document.querySelector('meta[name="robots"]')?.remove()

  for (const { selector, attrs } of metaTagSpecs(meta)) {
    let el = document.head.querySelector(selector)
    if (!el) {
      el = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
      document.head.appendChild(el)
    }
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value)
  }
}

function escapeAttr(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeText(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Renders the head fragment written into each prerendered HTML file. */
export function renderMetaHtml(meta: PageMeta) {
  const tags = metaTagSpecs(meta).map(({ selector, attrs }) => {
    const tag = selector.startsWith('link') ? 'link' : 'meta'
    const attrString = Object.entries(attrs)
      .map(([key, value]) => `${key}="${escapeAttr(value)}"`)
      .join(' ')
    return `    <${tag} ${attrString} />`
  })
  return [`    <title>${escapeText(meta.title)}</title>`, ...tags].join('\n')
}
