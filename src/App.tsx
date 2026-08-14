import { useState } from 'react'
import { About } from './components/About'
import { Contact, Footer } from './components/Contact'
import { FocusSwitcher } from './components/FocusSwitcher'
import { Hero } from './components/Hero'
import { Nav } from './components/Nav'
import { Projects } from './components/Projects'
import { ScoreDesk } from './components/ScoreDesk'
import { sketches, type FocusId } from './data/content'
import { useSketchPlayer } from './hooks/useSketchPlayer'
import './App.css'

function App() {
  const [focus, setFocus] = useState<FocusId>('compose')
  const { activeId, intensity, play } = useSketchPlayer()

  return (
    <div className="app">
      <Nav />
      <main>
        <Hero intensity={intensity} />
        <FocusSwitcher active={focus} onChange={setFocus} />
        <ScoreDesk
          activeId={activeId}
          intensity={intensity}
          onPlay={(id) => {
            const sketch = sketches.find((s) => s.id === id)
            if (sketch) void play(sketch)
          }}
        />
        <Projects />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default App
