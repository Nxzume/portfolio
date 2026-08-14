import { useEffect, useRef } from 'react'

type Props = {
  intensity?: number
  className?: string
}

export function WaveformCanvas({ intensity = 0.25, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const intensityRef = useRef(intensity)

  useEffect(() => {
    intensityRef.current = intensity
  }, [intensity])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = (t: number) => {
      const { width, height } = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, width, height)

      const amp = 18 + intensityRef.current * 42
      const lines = 3
      for (let l = 0; l < lines; l++) {
        ctx.beginPath()
        const alpha = 0.35 - l * 0.08
        ctx.strokeStyle =
          l === 0 ? `rgba(212, 168, 75, ${alpha})` : `rgba(61, 155, 143, ${alpha * 0.9})`
        ctx.lineWidth = l === 0 ? 2 : 1.25
        for (let x = 0; x <= width; x += 4) {
          const n =
            Math.sin(x * 0.012 + t * 0.0018 + l) * amp +
            Math.sin(x * 0.035 - t * 0.0025 + l * 1.7) * (amp * 0.35)
          const y = height * 0.55 + n * (1 - l * 0.18)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      frame += 1
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      void frame
    }
  }, [])

  return <canvas ref={ref} className={className} aria-hidden />
}
