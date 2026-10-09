import { describe, expect, it } from 'vitest'
import { noteToFreq } from './pianoAudio'

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
