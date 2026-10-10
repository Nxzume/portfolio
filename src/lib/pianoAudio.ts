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

type AudioContextCtor = typeof AudioContext

function AudioContextClass(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & { webkitAudioContext?: AudioContextCtor }
  return window.AudioContext || w.webkitAudioContext || null
}

let ctx: AudioContext | null = null
let primed = false

function getCtx(): AudioContext {
  if (!ctx) {
    // iOS Safari mutes Web Audio when the ringer switch is off unless the page
    // asks for a "playback" session (Safari 17+). Harmless elsewhere.
    const nav = navigator as Navigator & { audioSession?: { type: string } }
    if (nav.audioSession) {
      try {
        nav.audioSession.type = 'playback'
      } catch {
        /* older Safari - ignore */
      }
    }
    const Ctor = AudioContextClass()
    if (!Ctor) throw new Error('Web Audio API unavailable')
    ctx = new Ctor()
  }
  return ctx
}

/**
 * Must run synchronously inside a trusted user gesture (touch/click).
 * WebGL/R3F pointer events alone often do not unlock audio on iOS — call this
 * from a DOM touchstart/pointerdown on the entrance shell first.
 */
export function primeAudio(): void {
  try {
    const audio = getCtx()
    if (audio.state !== 'running') void audio.resume()
    // Keep retrying until the context is actually running: iOS ignores
    // touchstart as an unlock gesture, so the first attempt can silently fail.
    if (primed && audio.state === 'running') return
    primed = true
    // iOS Safari: a silent buffer tick inside the gesture reliably unlocks output.
    const buf = audio.createBuffer(1, 1, audio.sampleRate)
    const src = audio.createBufferSource()
    src.buffer = buf
    src.connect(audio.destination)
    src.start(0)
  } catch {
    /* private mode / autoplay blocks — playPianoNote will retry */
  }
}

const NOTE_NAMES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B']

/** Shifts a note like "D4" by some semitones ("D4" + 4 = "Fs4"). */
export function transposeNote(note: string, semitones: number): string | null {
  const match = /^([A-G]s?)(\d)$/.exec(note)
  if (!match) return null
  const index = NOTE_NAMES.indexOf(match[1])
  if (index < 0) return null
  const total = Number(match[2]) * 12 + index + semitones
  return `${NOTE_NAMES[((total % 12) + 12) % 12]}${Math.floor(total / 12)}`
}

/** Rising major arpeggio from the given note: root, third, fifth, octave. */
export function introArpeggio(root: string): string[] {
  const steps = [4, 7, 12].map((n) => transposeNote(root, n))
  return steps.every(Boolean) ? [root, ...(steps as string[])] : ['C4', 'E4', 'G4', 'C5']
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

  primeAudio()
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
