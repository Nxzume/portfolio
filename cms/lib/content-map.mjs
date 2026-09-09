/**
 * Maps content/*.json shapes ↔ Directus structured collections.
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractFileId } from './media.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const CONTENT_DIR = path.resolve(__dirname, '../../content')

/** Prefer UUID from expanded file objects; keep path strings as-is for seed/local. */
function mediaValue(value) {
  if (value == null || value === '') return ''
  const id = extractFileId(value)
  if (id) return id
  if (typeof value === 'string') return value
  return ''
}

export async function readContentJson(relativePath) {
  return JSON.parse(await readFile(path.join(CONTENT_DIR, relativePath), 'utf8'))
}

export function siteToDirectus(site) {
  return {
    name: site.name ?? '',
    tagline: site.tagline ?? '',
    email: site.email ?? '',
    url: site.url ?? '',
    github: site.links?.github ?? '',
    linkedin: site.links?.linkedin ?? '',
  }
}

export function siteFromDirectus(row) {
  return {
    name: row.name ?? '',
    tagline: row.tagline ?? '',
    email: row.email ?? '',
    url: row.url ?? '',
    links: {
      github: row.github ?? '',
      linkedin: row.linkedin ?? '',
    },
  }
}

export function heroToDirectus(hero) {
  return {
    headline: hero.headline ?? '',
    image: hero.image ?? '',
    primary_cta_label: hero.primaryCta?.label ?? '',
    primary_cta_href: hero.primaryCta?.href ?? '',
    secondary_cta_label: hero.secondaryCta?.label ?? '',
    secondary_cta_href: hero.secondaryCta?.href ?? '',
  }
}

export function heroFromDirectus(row) {
  return {
    headline: row.headline ?? '',
    image: mediaValue(row.image),
    primaryCta: {
      label: row.primary_cta_label ?? '',
      href: row.primary_cta_href ?? '',
    },
    secondaryCta: {
      label: row.secondary_cta_label ?? '',
      href: row.secondary_cta_href ?? '',
    },
  }
}

export function aboutToDirectus(about) {
  return {
    portrait: about.portrait ?? '',
    portrait_alt: about.portraitAlt ?? '',
    lead: about.lead ?? '',
    body: Array.isArray(about.body) ? about.body : [],
    note: about.note ?? '',
  }
}

export function aboutFromDirectus(row) {
  return {
    portrait: mediaValue(row.portrait),
    ...(row.portrait_alt ? { portraitAlt: row.portrait_alt } : {}),
    lead: row.lead ?? '',
    body: row.body ?? [],
    note: row.note ?? '',
  }
}

export function sectionCopyToDirectus(copy) {
  return {
    eyebrow: copy.eyebrow ?? '',
    title: copy.title ?? '',
    lede: copy.lede ?? '',
  }
}

export function sectionCopyFromDirectus(row) {
  return {
    eyebrow: row.eyebrow ?? '',
    title: row.title ?? '',
    lede: row.lede ?? '',
  }
}

export function contactToDirectus(contact) {
  return {
    ...sectionCopyToDirectus(contact),
    email_button_text: contact.emailButtonText ?? '',
  }
}

export function contactFromDirectus(row) {
  return {
    ...sectionCopyFromDirectus(row),
    ...(row.email_button_text ? { emailButtonText: row.email_button_text } : {}),
  }
}

export function focusTabToDirectus(tab, sort) {
  return {
    tab_id: tab.id ?? '',
    label: tab.label ?? '',
    headline: tab.headline ?? '',
    body: tab.body ?? '',
    sort,
  }
}

export function focusesFromDirectus(items) {
  return {
    tabs: items.map((row) => ({
      id: row.tab_id ?? '',
      label: row.label ?? '',
      headline: row.headline ?? '',
      body: row.body ?? '',
    })),
  }
}

export function sketchTrackToDirectus(track, sort) {
  return {
    track_id: track.id ?? '',
    title: track.title ?? '',
    mood: track.mood ?? '',
    audio: track.audio ?? '',
    bpm: track.bpm ?? null,
    base_freq: track.baseFreq ?? null,
    sort,
  }
}

export function sketchesFromDirectus(items) {
  return {
    tracks: items.map((row) => {
      const audio = mediaValue(row.audio)
      return {
        id: row.track_id ?? '',
        title: row.title ?? '',
        ...(row.mood ? { mood: row.mood } : {}),
        ...(audio ? { audio } : {}),
        ...(row.bpm != null ? { bpm: row.bpm } : {}),
        ...(row.base_freq != null ? { baseFreq: row.base_freq } : {}),
      }
    }),
  }
}

export function projectToDirectus(project, sort) {
  return {
    slug: project.slug ?? '',
    sort,
    title: project.title ?? '',
    subtitle: project.subtitle ?? '',
    summary: project.summary ?? '',
    image: project.image ?? '',
    highlights: project.highlights ?? [],
    links: project.links ?? [],
    intro: project.intro ?? [],
  }
}

/** Normalize gallery from JSON list or Files M2M junction rows. */
export function galleryFromDirectus(gallery) {
  return (gallery ?? []).map((item) => {
    if (typeof item === 'string') return { image: mediaValue(item) }
    // Files M2M junction: { directus_files_id: uuid | { id } }
    if (item?.directus_files_id != null) {
      return { image: mediaValue(item.directus_files_id) }
    }
    return { image: mediaValue(item?.image) }
  }).filter((g) => g.image)
}

/** Normalize sections from JSON list or project_sections O2M rows. */
export function sectionsFromDirectus(sections) {
  return (sections ?? []).map((section) => {
    const image = mediaValue(section.image)
    return {
      id: section.section_id ?? section.id ?? '',
      title: section.title ?? '',
      ...(image ? { image } : {}),
      ...(section.image_alt ? { imageAlt: section.image_alt } : {}),
      ...(section.quote ? { quote: section.quote } : {}),
      paragraphs: section.paragraphs ?? [],
    }
  })
}

export function projectFromDirectus(row) {
  const slug = row.slug ?? ''
  return {
    id: row.slug ?? slug,
    slug,
    order: row.sort ?? undefined,
    title: row.title ?? '',
    subtitle: row.subtitle ?? '',
    summary: row.summary ?? '',
    image: mediaValue(row.image),
    gallery: galleryFromDirectus(row.gallery),
    highlights: row.highlights ?? [],
    links: row.links ?? [],
    intro: row.intro ?? [],
    sections: sectionsFromDirectus(row.sections),
  }
}

/** Load all content/*.json for seeding. */
export async function loadContentFiles() {
  const site = await readContentJson('site.json')
  const hero = await readContentJson('hero.json')
  const about = await readContentJson('about.json')
  const contact = await readContentJson('contact.json')
  const focuses = await readContentJson('focuses.json')
  const sketches = await readContentJson('sketches.json')
  const score = await readContentJson('score.json')
  const projectsSection = await readContentJson('projects-section.json')

  const projectsDir = path.join(CONTENT_DIR, 'projects')
  const files = (await readdir(projectsDir)).filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  const projects = []
  for (const file of files) {
    projects.push(await readContentJson(path.join('projects', file)))
  }
  projects.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))

  return { site, hero, about, contact, focuses, sketches, score, projectsSection, projects }
}

/** Convert legacy portfolio_globals JSON blob → structured patches. */
export function legacyGlobalsToStructured(globals) {
  if (!globals) return null
  return {
    site_settings: globals.site ? siteToDirectus(globals.site) : null,
    hero: globals.hero ? heroToDirectus(globals.hero) : null,
    about: globals.about ? aboutToDirectus(globals.about) : null,
    contact: globals.contact ? contactToDirectus(globals.contact) : null,
    score_section: globals.score ? sectionCopyToDirectus(globals.score) : null,
    projects_section: globals.projects_section ? sectionCopyToDirectus(globals.projects_section) : null,
    focus_tabs: globals.focuses?.tabs?.map((tab, i) => focusTabToDirectus(tab, i + 1)) ?? [],
    sketch_tracks: globals.sketches?.tracks?.map((track, i) => sketchTrackToDirectus(track, i + 1)) ?? [],
  }
}

export function legacyProjectsToStructured(items) {
  return items.map((item, i) => {
    const payload = item.payload ?? item
    return projectToDirectus(payload, item.sort ?? i + 1)
  })
}
