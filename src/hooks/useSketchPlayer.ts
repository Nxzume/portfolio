import { useEffect, useRef, useState } from 'react'
import type { Sketch } from '../content/types'

function midiOffset(freq: number, semitones: number) {
  return freq * Math.pow(2, semitones / 12)
}

export function useSketchPlayer() {
  const ctxRef = useRef<AudioContext | null>(null)
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([])
  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intensityTimerRef = useRef<number | null>(null)
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

  const stopGenerative = () => {
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
  }

  const stopAudioFile = () => {
    if (intensityTimerRef.current) {
      window.clearInterval(intensityTimerRef.current)
      intensityTimerRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
  }

  const stop = () => {
    stopGenerative()
    stopAudioFile()
    setActiveId(null)
    setIntensity(0)
  }

  const playGenerative = async (sketch: Sketch) => {
    const ctx = await ensureCtx()
    const pattern = sketch.pattern?.length ? sketch.pattern : [0, 4, 7]
    const baseFreq = sketch.baseFreq ?? 110
    let step = 0
    const beatMs = (60_000 / Math.max(sketch.bpm, 1)) * 0.5

    const strike = () => {
      const now = ctx.currentTime
      const freq = midiOffset(baseFreq, pattern[step % pattern.length])
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

  const playAudioFile = async (src: string) => {
    await ensureCtx()
    const audio = new Audio(src)
    audioRef.current = audio
    audio.loop = true
    await audio.play()
    setIntensity(0.55)
    intensityTimerRef.current = window.setInterval(() => {
      setIntensity(0.35 + Math.random() * 0.45)
    }, 200)
    audio.onended = () => stop()
  }

  const play = async (sketch: Sketch) => {
    if (activeId === sketch.id) {
      stop()
      return
    }
    stop()
    setActiveId(sketch.id)

    const audioSrc = sketch.audio?.trim()
    if (audioSrc) {
      try {
        await playAudioFile(audioSrc)
        return
      } catch {
        /* fall back to generative if file missing/blocked */
      }
    }
    await playGenerative(sketch)
  }

  useEffect(() => () => stop(), [])

  return { activeId, intensity, play, stop }
}
