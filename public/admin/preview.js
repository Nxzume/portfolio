/**
 * Live preview templates for Decap CMS.
 * Uses Decap's global `h` (Preact createElement) — updates as you type.
 */
;(function registerPortfolioPreviews() {
  if (!window.CMS || typeof window.h !== 'function') return
  if (window.__PORTFOLIO_PREVIEWS_REGISTERED__) return
  window.__PORTFOLIO_PREVIEWS_REGISTERED__ = true

  const h = window.h
  const CMS = window.CMS

  function dataOf(entry) {
    try {
      return entry.getIn(['data']).toJS() || {}
    } catch {
      return {}
    }
  }

  function asset(getAsset, path) {
    if (!path) return ''
    try {
      const a = getAsset(path)
      return a ? String(a) : String(path)
    } catch {
      return String(path)
    }
  }

  function asList(value) {
    if (!value) return []
    if (Array.isArray(value)) return value
    return []
  }

  function paragraphText(item) {
    if (item == null) return ''
    if (typeof item === 'string') return item
    if (typeof item === 'object') {
      return item.paragraph || item.item || item.label || ''
    }
    return String(item)
  }

  function hint(text) {
    return h('p', { className: 'pv-hint' }, text)
  }

  function HeroPreview({ entry, getAsset }) {
    const d = dataOf(entry)
    const img = asset(getAsset, d.image)
    const primary = d.primaryCta || {}
    const secondary = d.secondaryCta || {}
    return h(
      'div',
      { className: 'pv' },
      hint('Live preview · Top of homepage (name & tagline come from Name and links)'),
      h(
        'div',
        { className: 'pv-hero' },
        h(
          'div',
          { className: 'pv-hero__media' },
          img ? h('img', { src: img, alt: '' }) : null,
          h('div', { className: 'pv-hero__veil' }),
        ),
        h(
          'div',
          { className: 'pv-hero__content' },
          h('p', { className: 'pv-brand' }, 'Your name (sitewide)'),
          h('h1', { className: 'pv-headline' }, d.headline || 'Main headline'),
          h('p', { className: 'pv-lede' }, 'One-line description from Name and links'),
          h(
            'div',
            { className: 'pv-cta-row' },
            primary.label
              ? h('span', { className: 'pv-btn pv-btn--primary' }, primary.label)
              : null,
            secondary.label
              ? h('span', { className: 'pv-btn pv-btn--ghost' }, secondary.label)
              : null,
          ),
        ),
      ),
    )
  }

  function AboutPreview({ entry, getAsset }) {
    const d = dataOf(entry)
    const img = asset(getAsset, d.portrait)
    const paragraphs = asList(d.body).map(paragraphText).filter(Boolean)
    return h(
      'div',
      { className: 'pv pv-section' },
      hint('Live preview · About me'),
      img
        ? h('div', { className: 'pv-portrait' }, h('img', { src: img, alt: d.portraitAlt || '' }))
        : null,
      h('h2', { className: 'pv-title' }, d.lead || 'About headline'),
      h(
        'div',
        { className: 'pv-copy' },
        paragraphs.length
          ? paragraphs.map((p, i) => h('p', { key: i }, p))
          : h('p', { className: 'pv-empty' }, 'Add bio paragraphs…'),
      ),
      d.note ? h('p', { className: 'pv-note' }, d.note) : null,
    )
  }

  function ContactPreview({ entry }) {
    const d = dataOf(entry)
    return h(
      'div',
      { className: 'pv pv-section' },
      hint('Live preview · Contact (buttons use email & links from Name and links)'),
      h('p', { className: 'pv-eyebrow' }, d.eyebrow || ''),
      h('h2', { className: 'pv-title' }, d.title || 'Contact title'),
      h('p', { className: 'pv-lede' }, d.lede || ''),
      h(
        'div',
        { className: 'pv-cta-row' },
        h('span', { className: 'pv-btn pv-btn--primary' }, d.emailButtonText || 'Email…'),
        h('span', { className: 'pv-btn pv-btn--ghost' }, 'itch.io'),
        h('span', { className: 'pv-btn pv-btn--ghost' }, 'GitHub'),
      ),
    )
  }

  function SitePreview({ entry }) {
    const d = dataOf(entry)
    const links = d.links || {}
    return h(
      'div',
      { className: 'pv pv-section' },
      hint('Live preview · Name and links — updates nav, hero, footer, contact buttons'),
      h('p', { className: 'pv-brand' }, d.name || 'Your name'),
      h('p', { className: 'pv-lede' }, d.tagline || ''),
      h('p', { className: 'pv-meta' }, d.email || ''),
      h(
        'div',
        { className: 'pv-copy' },
        links.itch ? h('p', null, 'itch.io: ', links.itch) : null,
        links.githubArena ? h('p', null, 'Arena: ', links.githubArena) : null,
        links.githubLevel ? h('p', null, 'Level: ', links.githubLevel) : null,
      ),
    )
  }

  function SectionHeadingPreview(label) {
    return function Preview({ entry }) {
      const d = dataOf(entry)
      return h(
        'div',
        { className: 'pv pv-section' },
        hint('Live preview · ' + label),
        h('p', { className: 'pv-eyebrow' }, d.eyebrow || ''),
        h('h2', { className: 'pv-title' }, d.title || 'Section title'),
        h('p', { className: 'pv-lede' }, d.lede || ''),
      )
    }
  }

  function FocusesPreview({ entry }) {
    const d = dataOf(entry)
    const tabs = asList(d.tabs)
    const active = tabs[0] || {}
    return h(
      'div',
      { className: 'pv pv-section' },
      hint('Live preview · Focus tabs'),
      h(
        'div',
        { className: 'pv-tabs' },
        tabs.map((t, i) =>
          h('span', { key: i, className: 'pv-tab' + (i === 0 ? ' is-on' : '') }, t.label || t.id || 'Tab'),
        ),
      ),
      h('h2', { className: 'pv-title' }, active.headline || 'Headline'),
      h('p', { className: 'pv-lede' }, active.body || ''),
      tabs.length > 1
        ? h('p', { className: 'pv-meta' }, 'Showing first tab; all ' + tabs.length + ' tabs update live.')
        : null,
    )
  }

  function SketchesPreview({ entry }) {
    const d = dataOf(entry)
    const tracks = asList(d.tracks)
    return h(
      'div',
      { className: 'pv' },
      hint('Live preview · Music tracks'),
      tracks.length
        ? tracks.map((t, i) =>
            h(
              'div',
              { key: i, className: 'pv-track' },
              h('div', { className: 'pv-track__play' }, '▶'),
              h(
                'div',
                null,
                h('p', { className: 'pv-track__title' }, t.title || 'Track title'),
                h('p', { className: 'pv-track__mood' }, t.mood || ''),
                t.audio
                  ? h('p', { className: 'pv-meta' }, 'File: ', t.audio)
                  : h('p', { className: 'pv-meta' }, 'Placeholder tone'),
              ),
              h('div', { className: 'pv-track__bpm' }, (t.bpm || '—') + ' BPM'),
            ),
          )
        : h('p', { className: 'pv-empty' }, 'Add a track to preview it here.'),
    )
  }

  function ProjectPreview({ entry, getAsset }) {
    const d = dataOf(entry)
    const cover = asset(getAsset, d.image)
    const highlights = asList(d.highlights).map(paragraphText).filter(Boolean)
    const intro = asList(d.intro).map(paragraphText).filter(Boolean)
    const links = asList(d.links)
    const sections = asList(d.sections)
    const gallery = asList(d.gallery)

    return h(
      'div',
      { className: 'pv' },
      hint('Live preview · Project page'),
      h(
        'div',
        { className: 'pv-card' },
        cover ? h('img', { src: cover, alt: '' }) : null,
        h(
          'div',
          { className: 'pv-card__body' },
          h('h2', { className: 'pv-title' }, d.title || 'Project title'),
          h('p', { className: 'pv-card__sub' }, d.subtitle || ''),
          h('p', { className: 'pv-lede' }, d.summary || ''),
          h('p', { className: 'pv-meta' }, 'Page: /projects/' + (d.slug || '…')),
          highlights.length
            ? h(
                'ul',
                { className: 'pv-bullets' },
                highlights.map((item, i) => h('li', { key: i }, item)),
              )
            : null,
          h(
            'div',
            { className: 'pv-cta-row', style: { marginTop: '0.85rem' } },
            links.map((l, i) => h('span', { key: i, className: 'pv-btn pv-btn--ghost' }, l.label || 'Link')),
          ),
        ),
      ),
      intro.length
        ? h(
            'div',
            { className: 'pv-copy pv-section' },
            intro.map((p, i) => h('p', { key: i }, p)),
          )
        : null,
      gallery.length
        ? h(
            'div',
            { className: 'pv-section' },
            h('p', { className: 'pv-eyebrow' }, 'Extra photos'),
            gallery.map((g, i) => {
              const src = asset(getAsset, typeof g === 'string' ? g : g.image || g)
              return src ? h('img', { key: i, src: src, alt: '', style: { marginBottom: '0.5rem', border: '1px solid var(--line)' } }) : null
            }),
          )
        : null,
      sections.map((s, i) => {
        const paras = asList(s.paragraphs).map(paragraphText).filter(Boolean)
        const img = asset(getAsset, s.image)
        return h(
          'div',
          { key: i, className: 'pv-chapter' },
          h('h3', { className: 'pv-title' }, s.title || 'Chapter'),
          s.quote ? h('p', { className: 'pv-note' }, '“' + s.quote + '”') : null,
          paras.map((p, j) => h('p', { key: j, className: 'pv-lede' }, p)),
          img ? h('img', { src: img, alt: s.imageAlt || '' }) : null,
        )
      }),
    )
  }

  CMS.registerPreviewStyle('/admin/preview.css')

  CMS.registerPreviewTemplate('hero', HeroPreview)
  CMS.registerPreviewTemplate('about', AboutPreview)
  CMS.registerPreviewTemplate('contact', ContactPreview)
  CMS.registerPreviewTemplate('site', SitePreview)
  CMS.registerPreviewTemplate('score', SectionHeadingPreview('Music section heading'))
  CMS.registerPreviewTemplate('projects_section', SectionHeadingPreview('Projects section heading'))
  CMS.registerPreviewTemplate('focuses', FocusesPreview)
  CMS.registerPreviewTemplate('sketches', SketchesPreview)
  CMS.registerPreviewTemplate('game_projects', ProjectPreview)
})()
