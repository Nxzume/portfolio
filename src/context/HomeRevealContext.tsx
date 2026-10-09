import { createContext, useContext, type ReactNode } from 'react'

export type HomeRevealPhase = 'intro' | 'revealing' | 'live'

const HomeRevealContext = createContext<HomeRevealPhase>('live')

export function HomeRevealProvider({
  phase,
  children,
}: {
  phase: HomeRevealPhase
  children: ReactNode
}) {
  return <HomeRevealContext.Provider value={phase}>{children}</HomeRevealContext.Provider>
}

export function useHomeReveal() {
  return useContext(HomeRevealContext)
}
