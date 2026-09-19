import { describe, expect, it } from 'vitest'
import { parseSpotifyEmbed, spotifyEmbedHeight, spotifyEmbedSrc } from './spotify'

describe('parseSpotifyEmbed', () => {
  it('returns null for blank or unsupported input', () => {
    expect(parseSpotifyEmbed('')).toBeNull()
    expect(parseSpotifyEmbed('   ')).toBeNull()
    expect(parseSpotifyEmbed('https://example.com/artist/abc')).toBeNull()
    expect(parseSpotifyEmbed('https://open.spotify.com/user/someone')).toBeNull()
  })

  it('accepts artist, album, playlist, and track open.spotify.com links', () => {
    expect(parseSpotifyEmbed('https://open.spotify.com/artist/55kd5PVj4U0ytkH8lP9PDN')).toEqual({
      kind: 'artist',
      id: '55kd5PVj4U0ytkH8lP9PDN',
      src: 'https://open.spotify.com/embed/artist/55kd5PVj4U0ytkH8lP9PDN?utm_source=generator&theme=0',
    })
    expect(
      spotifyEmbedSrc('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc'),
    ).toBe('https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0')
    expect(spotifyEmbedSrc('https://open.spotify.com/album/AbCdEf1234567890AbCdEf')).toContain(
      '/embed/album/AbCdEf1234567890AbCdEf',
    )
    expect(spotifyEmbedSrc('https://open.spotify.com/track/AbCdEf1234567890AbCdEf')).toContain(
      '/embed/track/AbCdEf1234567890AbCdEf',
    )
  })

  it('accepts intl paths, embed URLs, and spotify: URIs', () => {
    expect(spotifyEmbedSrc('https://open.spotify.com/intl-fr/artist/55kd5PVj4U0ytkH8lP9PDN')).toBe(
      'https://open.spotify.com/embed/artist/55kd5PVj4U0ytkH8lP9PDN?utm_source=generator&theme=0',
    )
    expect(spotifyEmbedSrc('https://open.spotify.com/embed/artist/55kd5PVj4U0ytkH8lP9PDN')).toBe(
      'https://open.spotify.com/embed/artist/55kd5PVj4U0ytkH8lP9PDN?utm_source=generator&theme=0',
    )
    expect(spotifyEmbedSrc('spotify:artist:55kd5PVj4U0ytkH8lP9PDN')).toBe(
      'https://open.spotify.com/embed/artist/55kd5PVj4U0ytkH8lP9PDN?utm_source=generator&theme=0',
    )
  })

  it('picks compact height for tracks and tall height for catalogs', () => {
    expect(spotifyEmbedHeight('track')).toBe(152)
    expect(spotifyEmbedHeight('artist')).toBe(560)
    expect(spotifyEmbedHeight('playlist')).toBe(560)
  })
})
