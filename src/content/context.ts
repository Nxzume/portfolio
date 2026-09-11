import { createContext, createElement, useContext, type ReactNode } from 'react'
import type { Content } from './load'

/**
 * Content is provided, not imported, so the same components render the baked
 * browser bundle (provider in main.tsx) and fresh-from-disk content when the
 * server re-prerenders after an admin save (provider in entry-server.tsx).
 */
const ContentContext = createContext<Content | null>(null)

export function ContentProvider({ value, children }: { value: Content; children: ReactNode }) {
  return createElement(ContentContext.Provider, { value }, children)
}

export function useContent(): Content {
  const content = useContext(ContentContext)
  if (!content) throw new Error('useContent must be used inside <ContentProvider>')
  return content
}
