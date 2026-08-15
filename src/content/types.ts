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
  /** Path under public/, e.g. "/audio/overture.mp3". Empty = generative placeholder. */
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
}

export type AboutContent = {
  portrait: string
  /** Optional; defaults to site.name */
  portraitAlt?: string
  lead: string
  body: string[]
  note?: string
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
