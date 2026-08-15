import { useState } from 'react'
import { About } from '../components/About'
import { Contact, Footer } from '../components/Contact'
import { FocusSwitcher } from '../components/FocusSwitcher'
import { Hero } from '../components/Hero'
import { Nav } from '../components/Nav'
import { Projects } from '../components/Projects'
import { ScoreDesk } from '../components/ScoreDesk'
import { focuses, sketches, type FocusId } from '../content'
import { useSketchPlayer } from '../hooks/useSketchPlayer'

export function HomePage() {
  const [focus, setFocus] = useState<FocusId>(focuses[0]?.id ?? 'compose')
  const player = useSketchPlayer(sketches)

  return (
    <div className="app">
      <Nav variant="home" />
      <main>
        <Hero intensity={player.intensity} />
        <FocusSwitcher active={focus} onChange={setFocus} />
        <ScoreDesk
          activeId={player.activeId}
          activeSketch={player.activeSketch}
          intensity={player.intensity}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          canSeek={player.canSeek}
          onPlayTrack={(id) => {
            const sketch = sketches.find((s) => s.id === id)
            if (sketch) void player.play(sketch)
          }}
          onTogglePause={() => void player.togglePause()}
          onStop={player.stop}
          onSeek={player.seek}
          onPrev={player.playPrev}
          onNext={player.playNext}
        />
        <Projects />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
