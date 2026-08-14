export type FocusId = 'compose' | 'levels' | 'azure'

export type ProjectSection = {
  id: string
  title: string
  paragraphs: string[]
  image?: string
  imageAlt?: string
  quote?: string
}

export type Project = {
  id: string
  slug: string
  title: string
  subtitle: string
  image: string
  gallery: string[]
  summary: string
  highlights: string[]
  links: { label: string; href: string }[]
  intro: string[]
  sections: ProjectSection[]
}

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

export const projects: Project[] = [
  {
    id: 'level',
    slug: 'level',
    title: 'Level',
    subtitle: 'Puzzle · Unity',
    image: '/images/level-hero.jpg',
    gallery: [
      '/images/level-gameplay.png',
      '/images/level-overview.png',
      '/images/level-detail-1.png',
      '/images/level-detail-2.png',
      '/images/level-proto-1.png',
      '/images/level-token.png',
    ],
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
    intro: [
      'Level is a puzzle game. The player acts on the environment to move a ball, collect tokens, and advance through three different levels.',
      'The player can use three skills: move, jump, and attack. Victory means collecting tokens and/or defeating enemies, then reaching the exit. Failure is losing all HP or falling off the ground.',
      'The first level teaches movement. The second teaches jump. The third introduces health and attack with a small mini-boss. Mechanics stay simple so level design can carry the experience.',
    ],
    sections: [
      {
        id: 'history',
        title: 'History',
        quote:
          'The utilisation of computers is not intuitive to humans. We must learn how to use it. — Sjoerd “Hourence” de Jong',
        paragraphs: [
          'The project began after studying level design through games and books. A line from “The How’s and Why’s of Level Design” stuck: tools are not intuitive — people must learn them.',
          'That raised a question: could a game be intuitive enough that someone plays it naturally without frustration — the way Mario Bros. often feels?',
          'That question became the beginning of Level.',
        ],
      },
      {
        id: 'goals',
        title: 'Design goals',
        paragraphs: [
          'Two precepts guided the work: stay simple enough that players can learn without being taught every mechanic, and force players to use every mechanic that is introduced.',
          'The core mechanic: move the ball by tilting the ground so it travels through the world.',
        ],
      },
      {
        id: 'prototypes',
        title: 'Early stage — prototypes',
        image: '/images/level-proto-1.png',
        imageAlt: 'Early Level prototype — ball in free fall',
        paragraphs: [
          'Unity physics was unfamiliar territory after mostly 2D tutorial work. The goal was a ball that feels recoverable after mistakes — small initial acceleration, later terminal velocity.',
          'The first prototype was a free-falling ball used to feel velocity and collisions. Targets like “magnitude 4 from rest on a 10° plane within 5 seconds” became reference feel, then adjusted by play.',
          'Wall collisions needed custom bounce logic (reverse pre-impact velocity with AddForce, then correct angles with vector math) before the ground and walls felt natural enough to build levels.',
        ],
      },
      {
        id: 'challenge',
        title: 'Hardest challenge — tilting planes',
        image: '/images/level-overview.png',
        imageAlt: 'Level overview showing segmented planes',
        paragraphs: [
          'Because Update runs every frame, vertical displacement from Quaternion.Slerp depends on plane size. If per-frame motion stays smaller than the ball collider, the ball follows. If the plane is too large, displacement exceeds the collider and the ball falls through.',
          'Fast left/right tilting near edges makes it worse. Jumping near an edge can reset the plane to identity while the player still holds tilt.',
          'The fix: limit plane length and max rotation, and raise physics refresh rate — which is why long paths in Level 0-2 are successions of small planes instead of one long slab.',
        ],
      },
      {
        id: 'mid-stage',
        title: 'Mid stage — teaching in the world',
        image: '/images/level-token.png',
        imageAlt: 'Token collection feedback in Level',
        paragraphs: [
          'With mechanics in place, the next goal was forcing players to use them without a separate tutorial. World panels say “exit” or “jump.” Controls stay familiar: WASD/arrows and space.',
          'Rotating tokens with sound invite curiosity; UI confirms collection. Exit animation and ground color cue which platforms can move.',
          'Level 1 teaches tokens, exit, and changing planes. Level 2 teaches jump and falling. Level 3 introduces health and attack.',
        ],
      },
      {
        id: 'retrospection',
        title: 'Retrospection',
        paragraphs: [
          'Playtests with gamers and non-gamers showed the design was not as intuitive as hoped — almost nobody finished without help. Gamers usually learned faster.',
          'Common stuck points: not realizing velocity carries when leaving a tilted plane (~70% of testers), and jumping without building speed first. Non-gamers often repeated the same failing action; gamers tried new options.',
          'The takeaway: exploration habits from games help, but tools still need to be taught before players can invent solutions.',
        ],
      },
      {
        id: 'conclusion',
        title: 'Conclusion',
        paragraphs: [
          'Level was meant to keep game design simple so level design could own difficulty, surprise, and fun — introducing mechanics only after earlier ones felt earned.',
          'The foundation is complete enough to grow: new puzzles, enemies, and maybe a story. Thank you for playing.',
        ],
      },
    ],
  },
  {
    id: 'arena',
    slug: 'arena',
    title: 'The Arena',
    subtitle: '2D top-down RPG · in development',
    image: '/images/arena-gameplay.png',
    gallery: ['/images/arena-gameplay.png', '/images/arena-detail-1.png'],
    summary:
      'A succession of floors with their own mechanics. The player controls two characters with different abilities and must combine their skills to solve puzzles and defeat enemies.',
    highlights: [
      'Dual-character puzzle combat',
      'Floor-based mechanical variety',
      'First floor nearly complete in the original build',
    ],
    links: [{ label: 'GitHub', href: site.links.githubArena }],
    intro: [
      'The Arena is a 2D top-down RPG still in development. The aim is a succession of floors, each with its own mechanics. The first floor is nearly done.',
      'The player controls two characters with different abilities and must combine both skill sets to solve puzzles and defeat enemies.',
    ],
    sections: [
      {
        id: 'level-design',
        title: 'Level design',
        image: '/images/arena-gameplay.png',
        imageAlt: 'The Arena gameplay — dual characters in combat',
        paragraphs: [
          'Floors are designed as distinct mechanical chapters rather than copies of the same combat loop.',
          'Spaces ask players to read the arena, switch characters, and sequence abilities — puzzles and fights share the same dual-character grammar.',
        ],
      },
      {
        id: 'game-design',
        title: 'Game design',
        image: '/images/arena-detail-1.png',
        imageAlt: 'The Arena scene detail',
        paragraphs: [
          'Two characters means two toolkits. Progress comes from combination, not from a single overpowered kit.',
          'This write-up is carried forward from the original portfolio and will expand as the project continues.',
        ],
      },
    ],
  },
]

export function getProject(slug: string) {
  return projects.find((p) => p.slug === slug)
}
