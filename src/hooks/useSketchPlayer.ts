import { useEffect, useRef, useState } from 'react'
import type { Sketch } from '../content/types'

function midiOffset(freq: number, semitones: number) {
  return freq * Math.pow(2, semitones / 12)
}

export function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function useSketchPlayer(sketches: Sketch[]) {
  const ctxRef = useRef<AudioContext | null>(null)
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([])
  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intensityTimerRef = useRef<number | null>(null)
  const progressTimerRef = useRef<number | null>(null)
  const sketchesRef = useRef(sketches)
  const activeIdRef = useRef<string | null>(null)
  const isPlayingRef = useRef(false)
  const modeRef = useRef<'file' | 'generative' | null>(null)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [intensity, setIntensity] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [mode, setMode] = useState<'file' | 'generative' | null>(null)

  sketchesRef.current = sketches
  activeIdRef.current = activeId
  isPlayingRef.current = isPlaying
  modeRef.current = mode

  const setPlaying = (value: boolean) => {
    isPlayingRef.current = value
    setIsPlaying(value)
  }

  const setPlayMode = (value: 'file' | 'generative' | null) => {
    modeRef.current = value
    setMode(value)
  }

  const ensureCtx = async () => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
    }
    if (ctxRef.current.state === 'suspended') {
      await ctxRef.current.resume()
    }
    return ctxRef.current
  }

  const clearProgressTimer = () => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }

  const clearIntensityTimer = () => {
    if (intensityTimerRef.current) {
      window.clearInterval(intensityTimerRef.current)
      intensityTimerRef.current = null
    }
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
    clearIntensityTimer()
    clearProgressTimer()
    if (audioRef.current) {
      audioRef.current.onended = null
      audioRef.current.onloadedmetadata = null
      audioRef.current.ontimeupdate = null
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
  }

  const stop = () => {
    stopGenerative()
    stopAudioFile()
    setActiveId(null)
    setPlaying(false)
    setIntensity(0)
    setCurrentTime(0)
    setDuration(0)
    setPlayMode(null)
  }

  const playGenerative = async (sketch: Sketch) => {
    const ctx = await ensureCtx()
    const pattern = sketch.pattern?.length ? sketch.pattern : [0, 4, 7]
    const baseFreq = sketch.baseFreq ?? 110
    let step = 0
    const beatMs = (60_000 / Math.max(sketch.bpm ?? 100, 1)) * 0.5

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
    setPlayMode('generative')
    setDuration(0)
    setCurrentTime(0)
    setPlaying(true)
  }

  const attachFileProgress = (audio: HTMLAudioElement) => {
    const sync = () => {
      setCurrentTime(audio.currentTime)
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }
    audio.onloadedmetadata = sync
    audio.ontimeupdate = sync
    clearProgressTimer()
    progressTimerRef.current = window.setInterval(sync, 250)
  }

  const playAudioFile = async (src: string) => {
    await ensureCtx()
    const audio = new Audio(src)
    audioRef.current = audio
    audio.loop = false
    attachFileProgress(audio)
    audio.onended = () => {
      setPlaying(false)
      setCurrentTime(0)
      setIntensity(0.2)
      clearIntensityTimer()
    }
    await audio.play()
    setPlayMode('file')
    setPlaying(true)
    setIntensity(0.55)
    clearIntensityTimer()
    intensityTimerRef.current = window.setInterval(() => {
      setIntensity(0.35 + Math.random() * 0.45)
    }, 200)
  }

  const startSketch = async (sketch: Sketch) => {
    stopGenerative()
    stopAudioFile()
    setCurrentTime(0)
    setDuration(0)
    setActiveId(sketch.id)
    setPlaying(false)
    setPlayMode(null)

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

  const pause = () => {
    if (audioRef.current && modeRef.current === 'file') {
      audioRef.current.pause()
      clearIntensityTimer()
      setPlaying(false)
      setIntensity(0.2)
      return
    }
    if (modeRef.current === 'generative') {
      stopGenerative()
      setPlaying(false)
      setIntensity(0.2)
    }
  }

  const resume = async () => {
    const id = activeIdRef.current
    if (!id) return
    const sketch = sketchesRef.current.find((s) => s.id === id)
    if (!sketch) return

    if (modeRef.current === 'file' && audioRef.current) {
      await ensureCtx()
      await audioRef.current.play()
      setPlaying(true)
      setIntensity(0.55)
      clearIntensityTimer()
      intensityTimerRef.current = window.setInterval(() => {
        setIntensity(0.35 + Math.random() * 0.45)
      }, 200)
      return
    }

    if (modeRef.current === 'generative') {
      await playGenerative(sketch)
    }
  }

  const play = async (sketch: Sketch) => {
    if (activeIdRef.current === sketch.id && isPlayingRef.current) {
      pause()
      return
    }
    if (activeIdRef.current === sketch.id && !isPlayingRef.current && modeRef.current) {
      await resume()
      return
    }
    await startSketch(sketch)
  }

  const togglePause = async () => {
    if (!activeIdRef.current) {
      const first = sketchesRef.current[0]
      if (first) await startSketch(first)
      return
    }
    if (isPlayingRef.current) pause()
    else await resume()
  }

  const seek = (time: number) => {
    if (modeRef.current !== 'file' || !audioRef.current) return
    const max = audioRef.current.duration || duration || 0
    const next = Math.max(0, Math.min(time, max))
    audioRef.current.currentTime = next
    setCurrentTime(next)
  }

  const playByOffset = async (delta: number) => {
    const list = sketchesRef.current
    if (!list.length) return
    const current = activeIdRef.current
    const index = current ? list.findIndex((s) => s.id === current) : -1
    const nextIndex = index < 0 ? 0 : (index + delta + list.length) % list.length
    await startSketch(list[nextIndex])
  }

  useEffect(() => () => stop(), [])

  const activeSketch = sketches.find((s) => s.id === activeId) ?? null
  const canSeek = mode === 'file' && duration > 0

  return {
    activeId,
    activeSketch,
    intensity,
    isPlaying,
    currentTime,
    duration,
    canSeek,
    mode,
    play,
    pause,
    resume,
    togglePause,
    stop,
    seek,
    playNext: () => void playByOffset(1),
    playPrev: () => void playByOffset(-1),
  }
}
