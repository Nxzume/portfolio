/**
 * In-memory only — a full page reload shows the piano entrance again.
 * SPA navigations (e.g. project page → home) keep the unlock for this JS runtime
 * so the intro does not interrupt mid-browse.
 */
let unlockedThisRuntime = false

export function isPianoUnlocked(): boolean {
  return unlockedThisRuntime
}

export function markPianoUnlocked(): void {
  unlockedThisRuntime = true
}
