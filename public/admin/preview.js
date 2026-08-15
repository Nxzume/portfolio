/**
 * View-only live previews for Decap CMS.
 * Edit with the form on the left — the preview only shows how it will look.
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
    return Array.isArray(value) ? value : []
  }

  function textOf(item) {
    if (item == null) return ''
    if (typeof item === 'string') return item
    if (typeof item === 'object') {
      return item.paragraph || item.item || item.label || item.text || ''
    }
    return String(item)
  }

  function hint(section) {
    return h(
      'div',
      { className: 'pv-hint-box' },
      h('p', { className: 'pv-hint' }, 'Preview · ' + section),
      h(
        'p',
        { className: 'pv-hint-sub' },
        'Edit on the left. This panel only shows how it will look on the site.',
      ),
    )
  }

  function PlayIcon() {
    return h(
      'svg',
      { className: 'pv-icon', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' },
      h('path', {
        fill: 'currentColor',
        d: 'M8.2 5.1a1 1 0 0 1 1.52-.86l10.1 6.4a1 1 0 0 1 0 1.72l-10.1 6.4A1 1 0 0 1 8.2 18V5.1Z',
      }),
    )
  }

  function HeroPreview({ entry, getAsset }) {
    const d = dataOf(entry)
    const img = asset(getAsset, d.image)
    const primary = d.primaryCta || {}
    const secondary = d.secondaryCta || {}
    return h(
      'div',
      { className: 'pv' },
      hint('Homepage top'),
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
          h('p', { className: 'pv-brand-static' }, 'Your name (from Name & links)'),
          h('h1', { className: 'pv-edit--headline' }, d.headline || 'Headline'),
          h('p', { className: 'pv-lede-static' }, 'Tagline (from Name & links)'),
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
    const paragraphs = asList(d.body).map(textOf).filter(Boolean)
    return h(
      'div',
      { className: 'pv pv-section' },
      hint('About me'),
      img ? h('div', { className: 'pv-edit--portrait' }, h('img', { src: img, alt: '' })) : null,
      h('h2', { className: 'pv-edit--title' }, d.lead || 'About headline'),
      h(
        'div',
        { className: 'pv-copy' },
        paragraphs.length
          ? paragraphs.map(function (p, i) {
              return h('p', { key: i }, p)
            })
          : h('p', { className: 'pv-empty' }, 'Add bio text on the left…'),
      ),
      d.note ? h('p', { className: 'pv-edit--note' }, d.note) : null,
    )
  }

  function ContactPreview({ entry }) {
    const d = dataOf(entry)
    return h(
      'div',
      { className: 'pv pv-section' },
      hint('Contact'),
      h('p', { className: 'pv-edit--eyebrow' }, d.eyebrow || ''),
      h('h2', { className: 'pv-edit--title' }, d.title || 'Contact'),
      h('p', { className: 'pv-edit--lede' }, d.lede || ''),
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
      hint('Name, email & links'),
      h('p', { className: 'pv-edit--brand' }, d.name || 'Your name'),
      h('p', { className: 'pv-edit--lede' }, d.tagline || ''),
      h('p', { className: 'pv-edit--meta' }, d.email || ''),
      h(
        'div',
        { className: 'pv-link-stack' },
        links.github || links.githubLevel || links.githubArena
          ? h(
              'div',
              { className: 'pv-link-row' },
              h('span', { className: 'pv-link-label' }, 'GitHub'),
              h('p', null, links.github || links.githubLevel || links.githubArena),
            )
          : null,
        links.linkedin
          ? h('div', { className: 'pv-link-row' }, h('span', { className: 'pv-link-label' }, 'LinkedIn'), h('p', null, links.linkedin))
          : h('p', { className: 'pv-empty' }, 'LinkedIn URL not set yet'),
      ),
    )
  }

  function SectionHeadingPreview(label) {
    return function Preview({ entry }) {
      const d = dataOf(entry)
      return h(
        'div',
        { className: 'pv pv-section' },
        hint(label),
        h('p', { className: 'pv-edit--eyebrow' }, d.eyebrow || ''),
        h('h2', { className: 'pv-edit--title' }, d.title || 'Title'),
        h('p', { className: 'pv-edit--lede' }, d.lede || ''),
      )
    }
  }

  function FocusesPreview({ entry }) {
    const d = dataOf(entry)
    const tabs = asList(d.tabs)
    return h(
      'div',
      { className: 'pv pv-section' },
      hint('Focus tabs'),
      tabs.length
        ? tabs.map(function (tab, i) {
            return h(
              'div',
              { key: i, className: 'pv-focus-block' },
              h('div', { className: 'pv-tabs' }, h('span', { className: 'pv-tab is-on' }, tab.label || 'Tab')),
              h('h2', { className: 'pv-edit--title' }, tab.headline || ''),
              h('p', { className: 'pv-edit--lede' }, tab.body || ''),
            )
          })
        : h('p', { className: 'pv-empty' }, 'Add a tab on the left…'),
    )
  }

  function SketchesPreview({ entry }) {
    const d = dataOf(entry)
    const tracks = asList(d.tracks)
    return h(
      'div',
      { className: 'pv' },
      hint('Music tracks'),
      tracks.length
        ? tracks.map(function (track, i) {
            const hasAudio = Boolean(track.audio && String(track.audio).trim())
            return h(
              'div',
              { key: i, className: 'pv-track' },
              h('div', { className: 'pv-track__play' }, PlayIcon()),
              h(
                'div',
                { className: 'pv-track__meta' },
                h('p', { className: 'pv-edit--track-title' }, track.title || 'Track'),
                track.mood ? h('p', { className: 'pv-edit--track-mood' }, track.mood) : null,
                hasAudio
                  ? h(
                      'div',
                      { className: 'pv-track__seek' },
                      h('span', { className: 'pv-track__time' }, '0:00'),
                      h('div', { className: 'pv-track__bar' }),
                      h('span', { className: 'pv-track__time' }, '—:—'),
                    )
                  : h('p', { className: 'pv-empty' }, 'No audio file — site will play a placeholder tone'),
              ),
              hasAudio ? null : h('div', { className: 'pv-track__bpm' }, (track.bpm || 100) + ' BPM'),
            )
          })
        : h('p', { className: 'pv-empty' }, 'Add a track on the left…'),
    )
  }

  function ProjectPreview({ entry, getAsset }) {
    const d = dataOf(entry)
    const cover = asset(getAsset, d.image)
    const highlights = asList(d.highlights).map(textOf).filter(Boolean)
    const intro = asList(d.intro).map(textOf).filter(Boolean)
    const links = asList(d.links).filter(Boolean)
    const sections = asList(d.sections).filter(function (s) {
      return s && typeof s === 'object'
    })
    const gallery = asList(d.gallery)

    return h(
      'div',
      { className: 'pv' },
      hint('Project page · /projects/' + (d.slug || '…')),
      h(
        'div',
        { className: 'pv-project-hero' },
        h(
          'div',
          { className: 'pv-project-hero__media' },
          cover ? h('img', { src: cover, alt: '' }) : null,
          h('div', { className: 'pv-project-hero__veil' }),
        ),
        h(
          'div',
          { className: 'pv-project-hero__content' },
          h('p', { className: 'pv-edit--eyebrow' }, d.subtitle || ''),
          h('h1', { className: 'pv-edit--title' }, d.title || 'Project title'),
          h('p', { className: 'pv-edit--lede' }, d.summary || ''),
          h(
            'div',
            { className: 'pv-cta-row' },
            links.map(function (link, i) {
              return h('span', { key: i, className: 'pv-btn pv-btn--ghost' }, (link && link.label) || 'Button')
            }),
          ),
        ),
      ),
      h(
        'div',
        { className: 'pv-project-body' },
        intro.length
          ? h(
              'div',
              { className: 'pv-copy' },
              intro.map(function (p, i) {
                return h('p', { key: i }, p)
              }),
            )
          : null,
        highlights.length
          ? h(
              'ul',
              { className: 'pv-bullets' },
              highlights.map(function (item, i) {
                return h('li', { key: i }, item)
              }),
            )
          : null,
        sections.map(function (section, i) {
          const paras = asList(section.paragraphs).map(textOf).filter(Boolean)
          const img = section.image ? asset(getAsset, section.image) : ''
          return h(
            'div',
            { key: i, className: 'pv-chapter' },
            h('h3', { className: 'pv-edit--title' }, section.title || 'Chapter'),
            section.quote ? h('p', { className: 'pv-edit--note' }, '“' + section.quote + '”') : null,
            paras.map(function (p, j) {
              return h('p', { key: j, className: 'pv-edit--lede' }, p)
            }),
            img ? h('img', { src: img, alt: section.imageAlt || '' }) : null,
          )
        }),
        gallery.length
          ? h(
              'div',
              { className: 'pv-gallery' },
              h('p', { className: 'pv-eyebrow' }, 'Gallery'),
              h(
                'div',
                { className: 'pv-gallery__grid' },
                gallery.map(function (g, i) {
                  const path = typeof g === 'string' ? g : g && g.image
                  const src = path ? asset(getAsset, path) : ''
                  return src
                    ? h('div', { key: i, className: 'pv-gallery__item' }, h('img', { src: src, alt: '' }))
                    : null
                }),
              ),
            )
          : null,
      ),
    )
  }

  CMS.registerPreviewStyle('/admin/preview.css')
  CMS.registerPreviewTemplate('hero', HeroPreview)
  CMS.registerPreviewTemplate('about', AboutPreview)
  CMS.registerPreviewTemplate('contact', ContactPreview)
  CMS.registerPreviewTemplate('site', SitePreview)
  CMS.registerPreviewTemplate('score', SectionHeadingPreview('Music section title'))
  CMS.registerPreviewTemplate('projects_section', SectionHeadingPreview('Projects section title'))
  CMS.registerPreviewTemplate('focuses', FocusesPreview)
  CMS.registerPreviewTemplate('sketches', SketchesPreview)
  CMS.registerPreviewTemplate('game_projects', ProjectPreview)
})()
