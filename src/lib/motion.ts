/** Shared easing curves for intro + site motion. */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const
export const easeStudio = [0.22, 1, 0.36, 1] as const

export const revealTransition = {
  // Short enough that the site feels interactive as soon as the intro lifts.
  duration: 0.85,
  ease: easeOutExpo,
} as const

/**
 * Append translateZ(0) so Framer's generated 2D transforms promote a compositor
 * layer (hardware-accelerated) without changing the visual result.
 */
export function gpuTransformTemplate(
  _transform: object,
  generatedTransform: string,
): string {
  if (!generatedTransform || generatedTransform === 'none') return 'translateZ(0)'
  if (
    generatedTransform.includes('translate3d(') ||
    generatedTransform.includes('translateZ(') ||
    generatedTransform.includes('matrix3d(')
  ) {
    return generatedTransform
  }
  return `${generatedTransform} translateZ(0)`
}
