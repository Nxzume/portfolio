import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatClock, resetAudioBlobCache, resolvePlayableSrc } from './useSketchPlayer'

describe('formatClock', () => {
  it('formats minutes and zero-padded seconds', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(9)).toBe('0:09')
    expect(formatClock(65)).toBe('1:05')
    expect(formatClock(601)).toBe('10:01')
  })

  it('guards non-finite and negative values', () => {
    expect(formatClock(Number.NaN)).toBe('0:00')
    expect(formatClock(Number.POSITIVE_INFINITY)).toBe('0:00')
    expect(formatClock(-3)).toBe('0:00')
  })
})

describe('resolvePlayableSrc', () => {
  afterEach(() => {
    resetAudioBlobCache()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('fetches once and returns a blob URL that subsequent calls reuse', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'audio/mpeg' })
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => blob,
    })
    vi.stubGlobal('fetch', fetchMock)
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-audio')

    const first = await resolvePlayableSrc('/audio/demo.mp3')
    const second = await resolvePlayableSrc('/audio/demo.mp3')

    expect(first).toBe('blob:mock-audio')
    expect(second).toBe('blob:mock-audio')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/audio/demo.mp3')
    expect(createObjectURL).toHaveBeenCalledTimes(1)
  })

  it('throws when the audio fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        blob: async () => new Blob(),
      }),
    )

    await expect(resolvePlayableSrc('/audio/missing.mp3')).rejects.toThrow(/404/)
  })
})
