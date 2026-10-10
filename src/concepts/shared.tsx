import { Link, useSearchParams } from 'react-router-dom'
import { PageHead } from '../components/PageHead'
import { useContent } from '../content/context'
import { homeMeta } from '../lib/meta'
import { spotifyEmbedHeight } from '../lib/spotify'
import { concepts, spotifyEmbeds, spotifyPageUrl, type ConceptId } from './data'
import './concepts.css'

/** Every concept page is a draft: keep it out of search results and sitemaps. */
export function ConceptHead({ id }: { id: ConceptId }) {
  const content = useContent()
  const concept = concepts.find((item) => item.id === id)!
  const base = homeMeta(content)
  return (
    <PageHead
      meta={{
        title: `Concept ${id.toUpperCase()} · ${concept.name} — ${content.site.name}`,
        description: concept.summary,
        path: `/concepts/${id}`,
        image: base.image,
        noindex: true,
      }}
    />
  )
}

/**
 * Floating reviewer pill for hopping between drafts and the live site.
 * `?bare=1` hides it so screenshots show the design alone.
 */
export function ConceptSwitcher({ current }: { current: ConceptId }) {
  const [params] = useSearchParams()
  if (params.get('bare')) return null
  return (
    <nav className="concept-switcher" aria-label="Design concepts">
      <Link to="/concepts" className="concept-switcher__all">
        Concepts
      </Link>
      {concepts.map((concept) => (
        <Link
          key={concept.id}
          to={`/concepts/${concept.id}`}
          aria-current={concept.id === current ? 'page' : undefined}
          title={`${concept.name} — ${concept.kicker}`}
        >
          {concept.id.toUpperCase()}
        </Link>
      ))}
      <a href="/">Live site</a>
    </nav>
  )
}

/** Spotify iframes from content/score.json, with a plain link as the fallback. */
export function SpotifyPlayer({
  height,
  className = '',
  linkLabel = 'Open on Spotify',
}: {
  height?: number
  className?: string
  linkLabel?: string
}) {
  const content = useContent()
  const embeds = spotifyEmbeds(content)
  const page = spotifyPageUrl(content)
  if (!embeds.length) return null
  return (
    <div className={`spotify ${className}`}>
      {embeds.map((embed) => (
        <iframe
          key={`${embed.kind}-${embed.id}`}
          className="spotify__frame"
          title={`Spotify ${embed.kind}`}
          src={embed.src}
          width="100%"
          height={height ?? spotifyEmbedHeight(embed.kind)}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ))}
      {page ? (
        <a className="spotify__link" href={page} target="_blank" rel="noreferrer">
          {linkLabel} ↗
        </a>
      ) : null}
    </div>
  )
}

export function ProjectImage({
  src,
  alt = '',
  className,
  eager = false,
}: {
  src: string
  alt?: string
  className?: string
  eager?: boolean
}) {
  if (!src) return <div className={`${className ?? ''} img-empty`} aria-hidden />
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  )
}