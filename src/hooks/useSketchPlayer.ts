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

/**
 * Cloudflare (and some proxies) cache MP3s and then answer Range seeks with a
 * full 200 and no Accept-Ranges — which makes HTMLAudioElement.currentTime
 * assignments no-ops. Fetching once into a blob URL keeps seeking entirely
 * local, so scrubbing works regardless of CDN behavior.
 */
const audioBlobUrls = new Map<string, string>()

/** Test helper — clears the in-memory blob URL cache. */
export function resetAudioBlobCache() {
  for (const url of audioBlobUrls.values()) {
    try {
      URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    }
  }
  audioBlobUrls.clear()
}

export async function resolvePlayableSrc(src: string): Promise<string> {
  const cached = audioBlobUrls.get(src)
  if (cached) return cached
  const res = await fetch(src)
  if (!res.ok) throw new Error(`Failed to load audio (${res.status})`)
  const url = URL.createObjectURL(await res.blob())
  audioBlobUrls.set(src, url)
  return url
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
  const durationRef = useRef(0)
  const scrubbingRef = useRef(false)

  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [intensity, setIntensity] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [mode, setMode] = useState<'file' | 'generative' | null>(null)
  const [loadErrorId, setLoadErrorId] = useState<string | null>(null)

  // Guards against overlapping playback when play is clicked again while an
  // audio file is still loading: the stale start cleans up instead of
  // leaving an orphaned <audio> playing under the new one.
  const startTokenRef = useRef(0)

  // Each setter keeps its ref in step, so callbacks can read current values
  // without being recreated. Writing refs during render is not safe under
  // concurrent rendering.
  useEffect(() => {
    sketchesRef.current = sketches
  }, [sketches])

  const setActive = (value: string | null) => {
    activeIdRef.current = value
    setActiveId(value)
  }

  const setPlaying = (value: boolean) => {
    isPlayingRef.current = value
    setIsPlaying(value)
  }

  const setPlayMode = (value: 'file' | 'generative' | null) => {
    modeRef.current = value
    setMode(value)
  }

  const setTrackDuration = (value: number) => {
    durationRef.current = value
    setDuration(value)
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
    scrubbingRef.current = false
    if (audioRef.current) {
      audioRef.current.onended = null
      audioRef.current.onloadedmetadata = null
      audioRef.current.ondurationchange = null
      audioRef.current.ontimeupdate = null
      audioRef.current.pause()
      audioRef.current.removeAttribute('src')
      audioRef.current.load()
      audioRef.current = null
    }
  }

  const stop = () => {
    stopGenerative()
    stopAudioFile()
    setActive(null)
    setPlaying(false)
    setIntensity(0)
    setCurrentTime(0)
    setTrackDuration(0)
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
    setTrackDuration(0)
    setCurrentTime(0)
    setPlaying(true)
  }

  const attachFileProgress = (audio: HTMLAudioElement) => {
    const sync = () => {
      if (!scrubbingRef.current) setCurrentTime(audio.currentTime)
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setTrackDuration(audio.duration)
      }
    }
    // Metadata may already be ready by the time we attach (blob URLs often
    // are) — read it now, and also listen for the late events.
    sync()
    audio.onloadedmetadata = sync
    audio.ondurationchange = sync
    audio.ontimeupdate = sync
    clearProgressTimer()
    progressTimerRef.current = window.setInterval(sync, 250)
  }

  const playAudioFile = async (src: string, token: number) => {
    const playable = await resolvePlayableSrc(src)
    if (token !== startTokenRef.current) return

    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio
    audio.loop = false
    attachFileProgress(audio)
    audio.onended = () => {
      setPlaying(false)
      setCurrentTime(0)
      setIntensity(0.2)
      clearIntensityTimer()
    }

    // Blob URLs are fully buffered, so metadata (and seekability) arrives as
    // soon as src is assigned — wait for it before play so the scrub UI can
    // enable without a race against the first timeupdate.
    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        cleanup()
        resolve()
      }
      const onError = () => {
        cleanup()
        reject(new Error('Audio failed to load'))
      }
      const cleanup = () => {
        audio.removeEventListener('loadedmetadata', onReady)
        audio.removeEventListener('error', onError)
      }
      audio.addEventListener('loadedmetadata', onReady)
      audio.addEventListener('error', onError)
      audio.src = playable
      if (audio.readyState >= 1) onReady()
    })
    if (token !== startTokenRef.current) {
      audio.onended = null
      audio.onloadedmetadata = null
      audio.ondurationchange = null
      audio.ontimeupdate = null
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      if (audioRef.current === audio) audioRef.current = null
      return
    }

    setPlayMode('file')
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      setTrackDuration(audio.duration)
    }

    await audio.play()
    if (token !== startTokenRef.current) {
      // Superseded while starting — silence this element; the newer start owns playback.
      audio.onended = null
      audio.onloadedmetadata = null
      audio.ondurationchange = null
      audio.ontimeupdate = null
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      if (audioRef.current === audio) audioRef.current = null
      return
    }
    setPlaying(true)
    setIntensity(0.55)
    clearIntensityTimer()
    intensityTimerRef.current = window.setInterval(() => {
      setIntensity(0.35 + Math.random() * 0.45)
    }, 200)
  }

  const startSketch = async (sketch: Sketch) => {
    const token = ++startTokenRef.current
    stopGenerative()
    stopAudioFile()
    setCurrentTime(0)
    setTrackDuration(0)
    setActive(sketch.id)
    setPlaying(false)
    setPlayMode(null)

    const audioSrc = sketch.audio?.trim()
    if (audioSrc) {
      try {
        await playAudioFile(audioSrc, token)
        setLoadErrorId(null)
        return
      } catch {
        if (token !== startTokenRef.current) return
        // A track with a real recording should never silently play the
        // synth placeholder — surface the failure instead.
        setLoadErrorId(sketch.id)
        setPlaying(false)
        setPlayMode(null)
        return
      }
    }
    if (token !== startTokenRef.current) return
    setLoadErrorId(null)
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
    const audio = audioRef.current
    const max =
      (Number.isFinite(audio.duration) && audio.duration > 0 && audio.duration) ||
      durationRef.current ||
      0
    if (!(max > 0)) return
    const next = Math.max(0, Math.min(time, max))
    try {
      audio.currentTime = next
    } catch {
      // Some browsers throw if the media isn't seekable yet — ignore and
      // keep the UI time so the scrub still feels responsive.
    }
    setCurrentTime(next)
  }

  const beginScrub = () => {
    scrubbingRef.current = true
  }

  const endScrub = (time: number) => {
    seek(time)
    scrubbingRef.current = false
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
    loadErrorId,
    play,
    pause,
    resume,
    togglePause,
    stop,
    seek,
    beginScrub,
    endScrub,
    playNext: () => void playByOffset(1),
    playPrev: () => void playByOffset(-1),
  }
}
