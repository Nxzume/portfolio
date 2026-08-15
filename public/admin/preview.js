/**
 * Live preview templates for Decap CMS.
 * Uses widgetFor / widgetsFor so you can click the preview to edit fields.
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

  function hint(text) {
    return h('p', { className: 'pv-hint' }, text)
  }

  function edit(className, node) {
    if (node == null) return null
    return h('div', { className: 'pv-edit' + (className ? ' ' + className : '') }, node)
  }

  function listWidgets(widgetsFor, name) {
    try {
      const items = widgetsFor(name)
      if (!items || typeof items.map !== 'function') return []
      return items
    } catch {
      return []
    }
  }

  function objectWidgets(widgetsFor, name) {
    try {
      return widgetsFor(name) || null
    } catch {
      return null
    }
  }

  function PlayIcon() {
    return h(
      'svg',
      {
        className: 'pv-icon',
        viewBox: '0 0 24 24',
        'aria-hidden': 'true',
        focusable: 'false',
      },
      h('path', {
        fill: 'currentColor',
        d: 'M8.2 5.1a1 1 0 0 1 1.52-.86l10.1 6.4a1 1 0 0 1 0 1.72l-10.1 6.4A1 1 0 0 1 8.2 18V5.1Z',
      }),
    )
  }

  function HeroPreview({ widgetFor, widgetsFor }) {
    const primary = objectWidgets(widgetsFor, 'primaryCta')
    const secondary = objectWidgets(widgetsFor, 'secondaryCta')
    return h(
      'div',
      { className: 'pv' },
      hint('Click text or the photo in the preview to edit — layout matches the homepage top'),
      h(
        'div',
        { className: 'pv-hero' },
        h(
          'div',
          { className: 'pv-hero__media' },
          edit('pv-edit--bleed', widgetFor('image')),
          h('div', { className: 'pv-hero__veil' }),
        ),
        h(
          'div',
          { className: 'pv-hero__content' },
          h('p', { className: 'pv-brand-static' }, 'Your name (from Name and links)'),
          edit('pv-edit--headline', widgetFor('headline')),
          h('p', { className: 'pv-lede-static' }, 'Tagline comes from Name and links'),
          h(
            'div',
            { className: 'pv-cta-row' },
            primary
              ? h(
                  'span',
                  { className: 'pv-btn pv-btn--primary' },
                  edit(null, primary.getIn(['widgets', 'label'])),
                )
              : null,
            secondary
              ? h(
                  'span',
                  { className: 'pv-btn pv-btn--ghost' },
                  edit(null, secondary.getIn(['widgets', 'label'])),
                )
              : null,
          ),
        ),
      ),
    )
  }

  function AboutPreview({ widgetFor, widgetsFor }) {
    const paragraphs = listWidgets(widgetsFor, 'body')
    return h(
      'div',
      { className: 'pv pv-section' },
      hint('Click the photo or text to edit this About block'),
      edit('pv-edit--portrait', widgetFor('portrait')),
      edit('pv-edit--title', widgetFor('lead')),
      h(
        'div',
        { className: 'pv-copy' },
        paragraphs.size
          ? paragraphs.map((item, i) =>
              h('div', { key: i, className: 'pv-edit' }, item.getIn(['widgets', 'paragraph'])),
            )
          : h('p', { className: 'pv-empty' }, 'Add bio paragraphs in the form or keep typing here once added'),
      ),
      edit('pv-edit--note', widgetFor('note')),
    )
  }

  function ContactPreview({ widgetFor }) {
    return h(
      'div',
      { className: 'pv pv-section' },
      hint('Click labels to edit — email / itch / GitHub buttons use Name and links'),
      edit('pv-edit--eyebrow', widgetFor('eyebrow')),
      edit('pv-edit--title', widgetFor('title')),
      edit('pv-edit--lede', widgetFor('lede')),
      h(
        'div',
        { className: 'pv-cta-row' },
        h(
          'span',
          { className: 'pv-btn pv-btn--primary' },
          edit(null, widgetFor('emailButtonText')),
        ),
        h('span', { className: 'pv-btn pv-btn--ghost' }, 'itch.io'),
        h('span', { className: 'pv-btn pv-btn--ghost' }, 'GitHub'),
      ),
    )
  }

  function SitePreview({ widgetFor, widgetsFor }) {
    const links = objectWidgets(widgetsFor, 'links')
    return h(
      'div',
      { className: 'pv pv-section' },
      hint('Click to edit — these values appear in the nav, hero, footer, and contact buttons'),
      edit('pv-edit--brand', widgetFor('name')),
      edit('pv-edit--lede', widgetFor('tagline')),
      edit('pv-edit--meta', widgetFor('email')),
      h(
        'div',
        { className: 'pv-link-stack' },
        links
          ? [
              h(
                'div',
                { key: 'itch', className: 'pv-link-row' },
                h('span', { className: 'pv-link-label' }, 'itch.io'),
                edit(null, links.getIn(['widgets', 'itch'])),
              ),
              h(
                'div',
                { key: 'arena', className: 'pv-link-row' },
                h('span', { className: 'pv-link-label' }, 'Arena GitHub'),
                edit(null, links.getIn(['widgets', 'githubArena'])),
              ),
              h(
                'div',
                { key: 'level', className: 'pv-link-row' },
                h('span', { className: 'pv-link-label' }, 'Level GitHub'),
                edit(null, links.getIn(['widgets', 'githubLevel'])),
              ),
            ]
          : null,
      ),
    )
  }

  function SectionHeadingPreview(label) {
    return function Preview({ widgetFor }) {
      return h(
        'div',
        { className: 'pv pv-section' },
        hint('Click to edit the ' + label + ' as it appears on the homepage'),
        edit('pv-edit--eyebrow', widgetFor('eyebrow')),
        edit('pv-edit--title', widgetFor('title')),
        edit('pv-edit--lede', widgetFor('lede')),
      )
    }
  }

  function FocusesPreview({ widgetsFor }) {
    const tabs = listWidgets(widgetsFor, 'tabs')
    return h(
      'div',
      { className: 'pv pv-section' },
      hint('Click a tab label or its headline/body to edit — every tab shows below'),
      tabs.size
        ? tabs.map(function (tab, i) {
            return h(
              'div',
              { key: i, className: 'pv-focus-block' },
              h(
                'div',
                { className: 'pv-tabs' },
                h(
                  'span',
                  { className: 'pv-tab is-on' },
                  edit(null, tab.getIn(['widgets', 'label'])),
                ),
              ),
              edit('pv-edit--title', tab.getIn(['widgets', 'headline'])),
              edit('pv-edit--lede', tab.getIn(['widgets', 'body'])),
            )
          })
        : h('p', { className: 'pv-empty' }, 'Add a focus tab to preview it here'),
    )
  }

  function SketchesPreview({ widgetsFor }) {
    const tracks = listWidgets(widgetsFor, 'tracks')
    return h(
      'div',
      { className: 'pv' },
      hint('Click a track title or description to edit — matches the music list on the site'),
      tracks.size
        ? tracks.map(function (track, i) {
            const hasAudio = Boolean(track.getIn(['data', 'audio']))
            return h(
              'div',
              { key: i, className: 'pv-track' },
              h('div', { className: 'pv-track__play' }, PlayIcon()),
              h(
                'div',
                { className: 'pv-track__meta' },
                edit('pv-edit--track-title', track.getIn(['widgets', 'title'])),
                edit('pv-edit--track-mood', track.getIn(['widgets', 'mood'])),
                hasAudio
                  ? h(
                      'div',
                      { className: 'pv-track__seek' },
                      h('span', { className: 'pv-track__time' }, '0:00'),
                      h('div', { className: 'pv-track__bar' }),
                      h('span', { className: 'pv-track__time' }, '—:—'),
                    )
                  : null,
              ),
              hasAudio
                ? null
                : h(
                    'div',
                    { className: 'pv-track__bpm' },
                    edit(null, track.getIn(['widgets', 'bpm'])),
                    ' BPM',
                  ),
            )
          })
        : h('p', { className: 'pv-empty' }, 'Add a track to preview it here'),
    )
  }

  function ProjectPreview({ entry, widgetFor, widgetsFor }) {
    const d = dataOf(entry)
    const highlights = listWidgets(widgetsFor, 'highlights')
    const intro = listWidgets(widgetsFor, 'intro')
    const links = listWidgets(widgetsFor, 'links')
    const sections = listWidgets(widgetsFor, 'sections')
    const gallery = listWidgets(widgetsFor, 'gallery')

    return h(
      'div',
      { className: 'pv' },
      hint('Click any part of the page preview to edit — this is /projects/' + (d.slug || '…')),
      h(
        'div',
        { className: 'pv-project-hero' },
        h(
          'div',
          { className: 'pv-project-hero__media' },
          edit('pv-edit--bleed', widgetFor('image')),
          h('div', { className: 'pv-project-hero__veil' }),
        ),
        h(
          'div',
          { className: 'pv-project-hero__content' },
          edit('pv-edit--eyebrow', widgetFor('subtitle')),
          edit('pv-edit--title', widgetFor('title')),
          edit('pv-edit--lede', widgetFor('summary')),
          h(
            'div',
            { className: 'pv-cta-row' },
            links.size
              ? links.map(function (link, i) {
                  return h(
                    'span',
                    { key: i, className: 'pv-btn pv-btn--ghost' },
                    edit(null, link.getIn(['widgets', 'label'])),
                  )
                })
              : null,
          ),
        ),
      ),
      h(
        'div',
        { className: 'pv-project-body' },
        h(
          'div',
          { className: 'pv-copy' },
          intro.size
            ? intro.map(function (item, i) {
                return h(
                  'div',
                  { key: i, className: 'pv-edit' },
                  item.getIn(['widgets', 'paragraph']),
                )
              })
            : null,
          highlights.size
            ? h(
                'ul',
                { className: 'pv-bullets' },
                highlights.map(function (item, i) {
                  return h(
                    'li',
                    { key: i },
                    edit(null, item.getIn(['widgets', 'item'])),
                  )
                }),
              )
            : null,
        ),
        sections.size
          ? sections.map(function (section, i) {
              const paraWidget = section.getIn(['widgets', 'paragraphs'])

              return h(
                'div',
                { key: i, className: 'pv-chapter' },
                edit('pv-edit--title', section.getIn(['widgets', 'title'])),
                edit('pv-edit--note', section.getIn(['widgets', 'quote'])),
                paraWidget ? h('div', { className: 'pv-copy' }, paraWidget) : null,
                edit('pv-edit--media', section.getIn(['widgets', 'image'])),
                edit('pv-edit--meta', section.getIn(['widgets', 'imageAlt'])),
              )
            })
          : null,
        gallery.size
          ? h(
              'div',
              { className: 'pv-gallery' },
              h('p', { className: 'pv-eyebrow' }, 'Gallery'),
              h(
                'div',
                { className: 'pv-gallery__grid' },
                gallery.map(function (item, i) {
                  return h(
                    'div',
                    { key: i, className: 'pv-gallery__item' },
                    edit('pv-edit--bleed', item.getIn(['widgets', 'image'])),
                  )
                }),
              ),
            )
          : null,
      ),
      h(
        'p',
        { className: 'pv-meta' },
        'Page link name (slug): ',
        edit('pv-edit--inline', widgetFor('slug')),
        ' · short id: ',
        edit('pv-edit--inline', widgetFor('id')),
      ),
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
