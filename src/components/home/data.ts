import type { Content } from '../../content/load'
import type { Focus, Project, TimelineEntry } from '../../content/types'
import { parseSpotifyEmbed, type SpotifyEmbed } from '../../lib/spotify'
import { isExternalHref, safeHref } from '../../lib/urls'

/**
 * Derived views over the real site content. The concept prototypes read
 * everything through these helpers so they stay in sync with what the admin
 * portal publishes — no copy is duplicated into the concepts.
 */

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
