/** Spotify content types the official embed player supports. */
export type SpotifyEmbedKind = 'playlist' | 'album' | 'artist' | 'track'

export type SpotifyEmbed = {
  kind: SpotifyEmbedKind
  id: string
  /** Dark-themed embed URL ready for an iframe `src`. */
  src: string
}

const KINDS: SpotifyEmbedKind[] = ['playlist', 'album', 'artist', 'track']

/**
 * Turn a public Spotify link or URI into an embeddable player URL.
 * Supports playlists, albums, artists, and tracks (no API key required).
 */
export function parseSpotifyEmbed(input: string): SpotifyEmbed | null {
  const raw = input.trim()
  if (!raw) return null

  const uri = raw.match(/^spotify:(playlist|album|artist|track):([A-Za-z0-9]+)$/i)
  if (uri) return embed(uri[1].toLowerCase() as SpotifyEmbedKind, uri[2])

  try {
    const url = new URL(raw)
    if (!/(^|\.)spotify\.com$/i.test(url.hostname)) return null
    const match = url.pathname.match(
      /\/(?:embed\/)?(playlist|album|artist|track)\/([A-Za-z0-9]+)/i,
    )
    if (match) return embed(match[1].toLowerCase() as SpotifyEmbedKind, match[2])
  } catch {
    return null
  }

  return null
}

/** Convenience: embed `src` only, or null when the input is not embeddable. */
export function spotifyEmbedSrc(input: string): string | null {
  return parseSpotifyEmbed(input)?.src ?? null
}

function embed(kind: SpotifyEmbedKind, id: string): SpotifyEmbed | null {
  if (!KINDS.includes(kind) || !id) return null
  // theme=0 keeps the player dark so it sits with the score desk.
  return {
    kind,
    id,
    src: `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`,
  }
}

/** Default iframe height — taller for catalog views, compact for a single track. */
export function spotifyEmbedHeight(kind: SpotifyEmbedKind): number {
  return kind === 'track' ? 152 : 352
}
