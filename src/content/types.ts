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
  mood: string
  bpm: number
  /** Path under public/, e.g. "/audio/overture.mp3". Empty = generative placeholder. */
  audio?: string
  baseFreq?: number
  pattern?: number[]
}

export type SiteContent = {
  name: string
  tagline: string
  email: string
  links: Record<string, string>
}

export type AboutContent = {
  portrait: string
  portraitAlt: string
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
  brand: string
  headline: string
  lede: string
  image: string
  primaryCta: { label: string; href: string }
  secondaryCta: { label: string; href: string }
}

export type ContactContent = {
  eyebrow: string
  title: string
  lede: string
  actions: { label: string; href: string; style?: 'primary' | 'ghost' }[]
}
