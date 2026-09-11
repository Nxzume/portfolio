import { createContext, createElement, useContext, type ReactNode } from 'react'

/**
 * Set when a page is rendered inside the admin's live preview instead of the
 * real document — PageHead uses it to avoid rewriting the admin's <head>.
 */
const PreviewModeContext = createContext(false)

export function PreviewModeProvider({ children }: { children: ReactNode }) {
  return createElement(PreviewModeContext.Provider, { value: true }, children)
}

export function usePreviewMode() {
  return useContext(PreviewModeContext)
}
