import { useEffect, useRef } from 'react'

type Props = {
  intensity?: number
  className?: string
  /** Fill the parent box (Score desk). Hero wave keeps its own CSS height. */
  fill?: boolean
}

export function WaveformCanvas({ intensity = 0.25, className, fill = false }: Props) {
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

    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const parent = canvas.parentElement
      const parentBounds = parent?.getBoundingClientRect()

      let cssWidth: number
      let cssHeight: number

      if (fill && parentBounds) {
        cssWidth = Math.max(1, Math.floor(parentBounds.width))
        cssHeight = Math.max(1, Math.floor(parentBounds.height))
      } else {
        // Temporarily clear inline size so stylesheet height (e.g. 18%) can apply.
        canvas.style.width = ''
        canvas.style.height = ''
        const self = canvas.getBoundingClientRect()
        cssWidth = Math.max(1, Math.floor(self.width || parentBounds?.width || 1))
        cssHeight = Math.max(1, Math.floor(self.height || 140))
      }

      // Lock layout size in CSS so bitmap width/height attrs cannot inflate the page.
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`
      canvas.width = Math.floor(cssWidth * dpr)
      canvas.height = Math.floor(cssHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const ro = new ResizeObserver(() => resize())
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    window.addEventListener('resize', resize)

    const draw = (t: number) => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      ctx.clearRect(0, 0, width, height)

      const amp = Math.min(height * 0.12, 16 + intensityRef.current * 36)
      const bands = fill ? 5 : 3
      for (let l = 0; l < bands; l++) {
        ctx.beginPath()
        const alpha = 0.32 - l * 0.045
        ctx.strokeStyle =
          l % 2 === 0 ? `rgba(212, 168, 75, ${alpha})` : `rgba(61, 155, 143, ${alpha * 0.95})`
        ctx.lineWidth = l === 0 ? 2 : 1.2
        const mid = height * (0.22 + (l / Math.max(bands - 1, 1)) * 0.56)
        for (let x = 0; x <= width; x += 4) {
          const n =
            Math.sin(x * 0.012 + t * 0.0018 + l) * amp +
            Math.sin(x * 0.035 - t * 0.0025 + l * 1.7) * (amp * 0.35)
          const y = mid + n * (1 - l * 0.08)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      ro.disconnect()
    }
  }, [fill])

  return <canvas ref={ref} className={className} aria-hidden />
}
