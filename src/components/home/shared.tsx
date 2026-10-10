import { useContent } from '../../content/context'
import { spotifyEmbedHeight } from '../../lib/spotify'
import { spotifyEmbeds, spotifyPageUrl } from './data'
import './shared.css'

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