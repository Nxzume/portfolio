import { useEffect, useRef, useState } from 'react'

type Sketch = {
  id: string
  bpm: number
  baseFreq: number
  pattern: number[]
}

function midiOffset(freq: number, semitones: number) {
  return freq * Math.pow(2, semitones / 12)
}

export function useSketchPlayer() {
  const ctxRef = useRef<AudioContext | null>(null)
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([])
  const timerRef = useRef<number | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [intensity, setIntensity] = useState(0)

  const ensureCtx = async () => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    if (ctxRef.current.state === 'suspended') {
      await ctxRef.current.resume()
    }
    return ctxRef.current
  }

  const stop = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    nodesRef.current.forEach(({ osc, gain }) => {
      try {
        gain.gain.exponentialRampToValueAtTime(0.0001, (ctxRef.current?.currentTime ?? 0) + 0.08)
        osc.stop((ctxRef.current?.currentTime ?? 0) + 0.1)
      } catch {
        /* already stopped */
      }
    })
    nodesRef.current = []
    setActiveId(null)
    setIntensity(0)
  }

  const play = async (sketch: Sketch) => {
    if (activeId === sketch.id) {
      stop()
      return
    }
    stop()
    const ctx = await ensureCtx()
    setActiveId(sketch.id)

    let step = 0
    const beatMs = (60_000 / sketch.bpm) * 0.5

    const strike = () => {
      const now = ctx.currentTime
      const freq = midiOffset(sketch.baseFreq, sketch.pattern[step % sketch.pattern.length])
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 1800
      osc.type = step % 3 === 0 ? 'triangle' : 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.5)
      nodesRef.current.push({ osc, gain })
      setIntensity(0.4 + (step % 4) * 0.15)
      step += 1
    }

    strike()
    timerRef.current = window.setInterval(strike, beatMs)
  }

  useEffect(() => () => stop(), [])

  return { activeId, intensity, play, stop }
}
