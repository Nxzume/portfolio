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

    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const parent = canvas.parentElement
      const parentBounds = parent?.getBoundingClientRect()
      const style = getComputedStyle(canvas)
      // Score desk: canvas fills its frame (inset 0). Hero: canvas has its own % height.
      const fillsParent =
        style.position === 'absolute' && style.top === '0px' && style.bottom === '0px'

      let cssWidth: number
      let cssHeight: number

      if (fillsParent && parentBounds) {
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

      const amp = Math.min(height * 0.22, 18 + intensityRef.current * 42)
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
          const y = height * 0.5 + n * (1 - l * 0.18)
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
  }, [])

  return <canvas ref={ref} className={className} aria-hidden />
}
