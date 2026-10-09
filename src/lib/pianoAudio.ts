/** Minimal Web Audio piano-ish tones for the entrance keyboard. */

const NOTE_OFFSETS: Record<string, number> = {
  C: -9,
  Cs: -8,
  D: -7,
  Ds: -6,
  E: -5,
  F: -4,
  Fs: -3,
  G: -2,
  Gs: -1,
  A: 0,
  As: 1,
  B: 2,
}

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

export function noteToFreq(note: string): number | null {
  const match = /^([A-G]s?)(\d)$/.exec(note)
  if (!match) return null
  const [, pitch, octaveStr] = match
  const offset = NOTE_OFFSETS[pitch]
  if (offset === undefined) return null
  const octave = Number(octaveStr)
  // A4 = 440; semitone distance from A4
  const semitones = offset + (octave - 4) * 12
  return 440 * 2 ** (semitones / 12)
}

export async function playPianoNote(note: string, duration = 1.1): Promise<void> {
  const freq = noteToFreq(note)
  if (freq == null) return

  const audio = getCtx()
  if (audio.state === 'suspended') await audio.resume()

  const now = audio.currentTime
  const master = audio.createGain()
  master.gain.setValueAtTime(0.0001, now)
  master.gain.exponentialRampToValueAtTime(0.22, now + 0.02)
  master.gain.exponentialRampToValueAtTime(0.08, now + 0.18)
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  master.connect(audio.destination)

  const partials: Array<[number, number]> = [
    [1, 1],
    [2, 0.35],
    [3, 0.12],
    [4.01, 0.06],
  ]

  for (const [mult, amp] of partials) {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = mult === 1 ? 'triangle' : 'sine'
    osc.frequency.setValueAtTime(freq * mult, now)
    gain.gain.value = amp
    osc.connect(gain)
    gain.connect(master)
    osc.start(now)
    osc.stop(now + duration + 0.05)
  }
}
