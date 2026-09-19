export type FocusId = string

export type ProjectSection = {
  id: string
  title: string
  paragraphs: string[]
  image?: string
  imageAlt?: string
  quote?: string
}

export type Project = {
  id: string
  slug: string
  order?: number
  title: string
  subtitle: string
  image: string
  gallery: string[]
  summary: string
  highlights: string[]
  links: { label: string; href: string }[]
  intro: string[]
  sections: ProjectSection[]
}

export type Sketch = {
  id: string
  title: string
  /** Optional line under the title. */
  mood?: string
  /** Only used for generative placeholders when audio is empty. */
  bpm?: number
  /** Path under public/, e.g. "/media/track.mp3", or empty for generative placeholder. */
  audio?: string
  baseFreq?: number
  pattern?: number[]
}

export type SiteContent = {
  name: string
  tagline: string
  email: string
  /** Public address of the live site, without a trailing slash. Used for canonical and share links. */
  url: string
  links: Record<string, string>
  /**
   * Overrides for the homepage link-preview card (Open Graph / Twitter) when
   * someone shares the site URL. Empty fields fall back to name, tagline, and
   * the hero background image.
   */
  shareTitle?: string
  shareDescription?: string
  shareImage?: string
}

export type TimelineEntry = {
  period: string
  role: string
  org: string
}

export type AboutContent = {
  portrait: string
  /** Optional; defaults to site.name */
  portraitAlt?: string
  lead: string
  body: string[]
  note?: string
  /** Optional career timeline shown under the bio. */
  timeline?: TimelineEntry[]
}

export type Focus = {
  id: FocusId
  label: string
  headline: string
  body: string
}

export type SectionCopy = {
  eyebrow: string
  title: string
  lede: string
}

/** Score / Music section — optional Spotify embeds for previews. */
export type ScoreContent = SectionCopy & {
  /**
   * Public Spotify album / playlist / track / artist URLs (or `spotify:…` URIs).
   * Each entry becomes its own embed. Prefer albums (and playlists) over an
   * artist link — artist embeds only show a short “Popular” list.
   * When any URL is set, uploaded local tracks are hidden on the site.
   */
  spotifyUrls?: string[]
}

export type HeroContent = {
  headline: string
  image: string
  primaryCta: { label: string; href: string }
  secondaryCta: { label: string; href: string }
}

export type ContactContent = {
  eyebrow: string
  title: string
  lede: string
  /** Button label for mailto; defaults to “Email {first name}” */
  emailButtonText?: string
}
