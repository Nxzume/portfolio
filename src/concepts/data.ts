import type { Content } from '../content/load'
import type { Focus, Project, TimelineEntry } from '../content/types'
import { parseSpotifyEmbed, type SpotifyEmbed } from '../lib/spotify'
import { isExternalHref, safeHref } from '../lib/urls'

/**
 * Derived views over the real site content. The concept prototypes read
 * everything through these helpers so they stay in sync with what the admin
 * portal publishes — no copy is duplicated into the concepts.
 */

export type ConceptId = 'a' | 'b' | 'c'

export type ConceptMeta = {
  id: ConceptId
  name: string
  kicker: string
  summary: string
  order: string
  swatches: string[]
}

export const concepts: ConceptMeta[] = [
  {
    id: 'a',
    name: 'The Score',
    kicker: 'Music first',
    summary:
      'Composer identity leads. A playable piano keyboard is the navigation, the Spotify score sits right under the opening, and the games are framed as the worlds the music lives in.',
    order: 'Overture → Listen → Worlds scored → Day job → About → Contact',
    swatches: ['#0c0b0a', '#2a1c12', '#d4a84b', '#f3eee4'],
  },
  {
    id: 'b',
    name: 'Level Select',
    kicker: 'Games first',
    summary:
      'Level design leads. A fixed level-select rail frames a case-study grid of the games, followed by a deep read of how Level teaches by space, with music and engineering as supporting tiles.',
    order: 'Case-study grid → Anatomy of Level → Soundtrack → Engineering → About → Contact',
    swatches: ['#0e1114', '#1b2127', '#c6ff3d', '#e9eef2'],
  },
  {
    id: 'c',
    name: 'Three Movements',
    kicker: 'Balanced single scroll',
    summary:
      'A quiet editorial scroll. The first screen is a three-line table of contents (Compose, Levels, Azure); each discipline then gets one equal chapter, with a coda for the person and contact.',
    order: 'Contents → I Compose → II Levels → III Azure → Coda → Contact',
    swatches: ['#f4efe6', '#e5dccb', '#14110e', '#a8561f'],
  },
]

export function focusFor(content: Content, id: string): Focus | undefined {
  return content.focuses.find((focus) => focus.id === id)
}

/** Projects with a hero image read as games / visual work; the rest as tools. */
export function splitProjects(content: Content): { visual: Project[]; other: Project[] } {
  return {
    visual: content.projects.filter((project) => project.image),
    other: content.projects.filter((project) => !project.image),
  }
}

export function spotifyEmbeds(content: Content): SpotifyEmbed[] {
  const seen = new Set<string>()
  const embeds: SpotifyEmbed[] = []
  for (const url of content.score.spotifyUrls ?? []) {
    const embed = parseSpotifyEmbed(url)
    if (!embed) continue
    const key = `${embed.kind}:${embed.id}`
    if (seen.has(key)) continue
    seen.add(key)
    embeds.push(embed)
  }
  return embeds
}

/** Public Spotify page for the "open in Spotify" fallback link. */
export function spotifyPageUrl(content: Content): string | undefined {
  const url = (content.score.spotifyUrls ?? []).find((candidate) => parseSpotifyEmbed(candidate))
  return url ? safeHref(url) : undefined
}

export type SocialLink = { label: string; href: string }

export function socialLinks(content: Content): SocialLink[] {
  return Object.entries(content.site.links)
    .filter(([label, href]) => label.trim() && href.trim())
    .map(([label, href]) => ({ label: label.trim(), href: safeHref(href) }))
}

export function externalProps(href: string) {
  return isExternalHref(href) ? { target: '_blank', rel: 'noreferrer' } : {}
}

/** Splits prose into sentences without the trailing full stop. */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim().replace(/[.]+$/, ''))
    .filter(Boolean)
}

export function recentRoles(content: Content, count: number): TimelineEntry[] {
  return (content.about.timeline ?? []).slice(0, count)
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName
}

export function projectSection(project: Project, id: string) {
  return project.sections.find((section) => section.id === id)
}

/** First project section that has an image, used for case-study visuals. */
export function sectionsWithImages(project: Project) {
  return project.sections.filter((section) => section.image)
}
