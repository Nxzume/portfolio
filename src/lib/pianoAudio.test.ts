import { afterEach, describe, expect, it, vi } from 'vitest'
import { noteToFreq, primeAudio, introArpeggio, transposeNote } from './pianoAudio'

describe('noteToFreq', () => {
  it('maps A4 to 440', () => {
    expect(noteToFreq('A4')).toBeCloseTo(440, 5)
  })

  it('maps C4 near middle C', () => {
    expect(noteToFreq('C4')).toBeCloseTo(261.6256, 3)
  })

  it('handles sharps', () => {
    expect(noteToFreq('Cs4')).toBeCloseTo(277.1826, 3)
  })

  it('rejects junk', () => {
    expect(noteToFreq('H4')).toBeNull()
    expect(noteToFreq('')).toBeNull()
  })
})

describe('primeAudio', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('resumes a suspended AudioContext and plays a silent tick', () => {
    const resume = vi.fn(async () => {})
    const start = vi.fn()
    const connect = vi.fn()
    const source = { buffer: null as AudioBuffer | null, connect, start }
    const ctx = {
      state: 'suspended' as AudioContextState,
      sampleRate: 44100,
      resume,
      createBuffer: vi.fn(() => ({} as AudioBuffer)),
      createBufferSource: vi.fn(() => source),
      destination: {} as AudioDestinationNode,
    }
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function AudioContextMock() {
        return ctx
      }),
    )

    primeAudio()
    expect(resume).toHaveBeenCalled()
    expect(start).toHaveBeenCalledWith(0)
  })
})

describe('intro phrase', () => {
  it('runs up a major arpeggio from the tapped key', () => {
    expect(introArpeggio('C4')).toEqual(['C4', 'E4', 'G4', 'C5'])
    expect(introArpeggio('D4')).toEqual(['D4', 'Fs4', 'A4', 'D5'])
  })

  it('falls back to C for unknown notes', () => {
    expect(introArpeggio('nope')).toEqual(['C4', 'E4', 'G4', 'C5'])
    expect(transposeNote('B3', 1)).toBe('C4')
  })
})
