export type FocusId = 'compose' | 'levels' | 'azure'

export const site = {
  name: 'Alexandre Guichet',
  tagline: 'Composer for games — with level design craft and Azure DevOps depth.',
  email: 'alexandre.g007@gmail.com',
  links: {
    itch: 'https://alexandreguichet.itch.io/level',
    githubArena: 'https://github.com/keeganland/the-arena-agda',
    githubLevel: 'https://github.com/alexandreguichet/Level-Unity-CSharp',
  },
}

export const focuses: {
  id: FocusId
  label: string
  headline: string
  body: string
}[] = [
  {
    id: 'compose',
    label: 'Compose',
    headline: 'Scores that carry a world',
    body: 'Alexandre produces music in his free time and wants to be hired as a composer for video games — writing themes, stingers, and atmospheres that make levels feel alive.',
  },
  {
    id: 'levels',
    label: 'Levels',
    headline: 'Spaces players learn by playing',
    body: 'Through Unity projects like Level and The Arena, he designs puzzles and encounters that teach mechanics through space, pacing, and curiosity — not walls of text.',
  },
  {
    id: 'azure',
    label: 'Azure',
    headline: 'DevOps on Microsoft Azure',
    body: 'Alongside creative work, Alexandre works with Microsoft Azure DevOps — bringing reliable delivery, automation, and cloud craft to teams that ship.',
  },
]

export const sketches = [
  {
    id: 'overture',
    title: 'Overture — Title Screen',
    mood: 'Warm brass · slow pulse',
    bpm: 72,
    baseFreq: 110,
    pattern: [0, 4, 7, 11, 7, 4] as number[],
  },
  {
    id: 'arena-floor',
    title: 'Arena Floor I',
    mood: 'Tense · dual-character motif',
    bpm: 96,
    baseFreq: 146.83,
    pattern: [0, 3, 7, 10, 7, 3, 0, 7] as number[],
  },
  {
    id: 'tilt',
    title: 'Tilt & Token',
    mood: 'Curious · puzzle sparkle',
    bpm: 108,
    baseFreq: 196,
    pattern: [0, 2, 5, 7, 9, 7, 5, 2] as number[],
  },
  {
    id: 'bosch-night',
    title: 'Night Shift Sketch',
    mood: 'Ambient · late-lab calm',
    bpm: 60,
    baseFreq: 82.41,
    pattern: [0, 5, 7, 12, 7, 5] as number[],
  },
]

export const about = {
  lead: 'Alexandre Guichet builds worlds in sound, space, and systems.',
  body: [
    'This portfolio started as a Level Design journey — Unity experiments, puzzle teaching, and personal games. It is being reshaped around three paths: composing for video games, crafting level experiences, and shipping with Azure DevOps.',
    'Much of the project writing below is from the original site and will be refreshed as new scores, levels, and cloud work land. For now it is an honest snapshot of craft in progress.',
  ],
}

export const projects = [
  {
    id: 'level',
    title: 'Level',
    subtitle: 'Puzzle · Unity',
    image: '/images/level-hero.jpg',
    gallery: ['/images/level-gameplay.png', '/images/level-detail-1.png', '/images/level-detail-2.png'],
    summary:
      'A puzzle game where the player moves a ball by tilting the environment. Each stage introduces a mechanic through a unique space — collect tokens, learn jump and attack, and reach the exit.',
    highlights: [
      'Teach-by-space design: no heavy tutorial walls',
      'Core loop: tilt, jump, attack, collect, exit',
      'Three playable levels focused on progressive mastery',
    ],
    links: [
      { label: 'Play on itch.io', href: site.links.itch },
      { label: 'GitHub', href: site.links.githubLevel },
    ],
  },
  {
    id: 'arena',
    title: 'The Arena',
    subtitle: '2D top-down RPG · in development',
    image: '/images/arena-hero.jpg',
    gallery: ['/images/arena-gameplay.png'],
    summary:
      'A succession of floors with their own mechanics. The player controls two characters with different abilities and must combine their skills to solve puzzles and defeat enemies.',
    highlights: [
      'Dual-character puzzle combat',
      'Floor-based mechanical variety',
      'First floor nearly complete in the original build',
    ],
    links: [{ label: 'GitHub', href: site.links.githubArena }],
  },
]
