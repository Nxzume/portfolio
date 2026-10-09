/** Shared easing curves for intro + site motion. */
export const easeOutExpo = [0.16, 1, 0.3, 1] as const
export const easeStudio = [0.22, 1, 0.36, 1] as const

export const revealTransition = {
  duration: 1.65,
  ease: easeOutExpo,
} as const
