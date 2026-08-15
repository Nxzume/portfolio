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
    if (node == null || node === false) return null
    return h('div', { className: 'pv-edit' + (className ? ' ' + className : '') }, node)
  }

  function safeGetIn(value, path) {
    if (value == null) return null
    try {
      if (typeof value.getIn === 'function') return value.getIn(path)
      // Plain object fallback
      let cur = value
      for (let i = 0; i < path.length; i++) {
        if (cur == null) return null
        cur = cur[path[i]]
      }
      return cur
    } catch {
      return null
    }
  }

  function safeGet(value, key) {
    if (value == null) return null
    try {
      if (typeof value.get === 'function') return value.get(key)
      return value[key]
    } catch {
      return null
    }
  }

  /** Normalize widgetsFor(list) into a plain array of defined items. */
  function listWidgets(widgetsFor, name) {
    try {
      const items = widgetsFor(name)
      if (!items) return []
      const out = []
      if (typeof items.forEach === 'function') {
        items.forEach(function (item) {
          if (item != null) out.push(item)
        })
        return out
      }
      if (typeof items.toArray === 'function') {
        return items.toArray().filter(function (item) {
          return item != null
        })
      }
      if (Array.isArray(items)) {
        return items.filter(function (item) {
          return item != null
        })
      }
      return out
    } catch {
      return []
    }
  }

  function objectWidgets(widgetsFor, name) {
    try {
      const value = widgetsFor(name)
      return value == null ? null : value
    } catch {
      return null
    }
  }

  /**
   * Resolve an editable widget (or plain text fallback) from a list/object item.
   * Handles Decap single-field lists and legacy plain-string JSON.
   */
  function itemField(item, fieldName) {
    if (item == null) return null

    const fromWidgets = safeGetIn(item, ['widgets', fieldName])
    if (fromWidgets != null) return fromWidgets

    // Single-field lists sometimes expose the widget directly on `widgets`
    const widgets = safeGet(item, 'widgets')
    if (widgets != null && typeof widgets.getIn !== 'function' && typeof widgets.get !== 'function') {
      // Likely a React element already
      return widgets
    }

    const fromData = safeGetIn(item, ['data', fieldName])
    if (fromData != null && fromData !== '') return String(fromData)

    const data = safeGet(item, 'data')
    if (typeof data === 'string' && data) return data
    if (typeof item === 'string' && item) return item

    return null
  }

  function itemData(item, fieldName) {
    if (item == null) return null
    const value = safeGetIn(item, ['data', fieldName])
    if (value != null) return value
    const data = safeGet(item, 'data')
    if (typeof data === 'string') return data
    if (typeof item === 'string') return item
    return null
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
                  edit(null, itemField(primary, 'label')),
                )
              : null,
            secondary
              ? h(
                  'span',
                  { className: 'pv-btn pv-btn--ghost' },
                  edit(null, itemField(secondary, 'label')),
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
        paragraphs.length
          ? paragraphs.map(function (item, i) {
              return h('div', { key: i, className: 'pv-edit' }, itemField(item, 'paragraph'))
            })
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
                edit(null, itemField(links, 'itch')),
              ),
              h(
                'div',
                { key: 'arena', className: 'pv-link-row' },
                h('span', { className: 'pv-link-label' }, 'Arena GitHub'),
                edit(null, itemField(links, 'githubArena')),
              ),
              h(
                'div',
                { key: 'level', className: 'pv-link-row' },
                h('span', { className: 'pv-link-label' }, 'Level GitHub'),
                edit(null, itemField(links, 'githubLevel')),
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
      tabs.length
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
                  edit(null, itemField(tab, 'label')),
                ),
              ),
              edit('pv-edit--title', itemField(tab, 'headline')),
              edit('pv-edit--lede', itemField(tab, 'body')),
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
      tracks.length
        ? tracks.map(function (track, i) {
            const audio = itemData(track, 'audio')
            const hasAudio = Boolean(audio && String(audio).trim())
            return h(
              'div',
              { key: i, className: 'pv-track' },
              h('div', { className: 'pv-track__play' }, PlayIcon()),
              h(
                'div',
                { className: 'pv-track__meta' },
                edit('pv-edit--track-title', itemField(track, 'title')),
                edit('pv-edit--track-mood', itemField(track, 'mood')),
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
                    edit(null, itemField(track, 'bpm')),
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
            links.length
              ? links.map(function (link, i) {
                  return h(
                    'span',
                    { key: i, className: 'pv-btn pv-btn--ghost' },
                    edit(null, itemField(link, 'label')),
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
          intro.length
            ? intro.map(function (item, i) {
                return h('div', { key: i, className: 'pv-edit' }, itemField(item, 'paragraph'))
              })
            : null,
          highlights.length
            ? h(
                'ul',
                { className: 'pv-bullets' },
                highlights.map(function (item, i) {
                  return h('li', { key: i }, edit(null, itemField(item, 'item')))
                }),
              )
            : null,
        ),
        sections.length
          ? sections.map(function (section, i) {
              const paraWidget = itemField(section, 'paragraphs')
              return h(
                'div',
                { key: i, className: 'pv-chapter' },
                edit('pv-edit--title', itemField(section, 'title')),
                edit('pv-edit--note', itemField(section, 'quote')),
                paraWidget ? h('div', { className: 'pv-copy' }, paraWidget) : null,
                edit('pv-edit--media', itemField(section, 'image')),
                edit('pv-edit--meta', itemField(section, 'imageAlt')),
              )
            })
          : null,
        gallery.length
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
                    edit('pv-edit--bleed', itemField(item, 'image')),
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

  function safePreview(Component) {
    return function Wrapped(props) {
      try {
        return Component(props)
      } catch (err) {
        return h(
          'div',
          { className: 'pv' },
          h('p', { className: 'pv-hint' }, 'Preview hit a snag — use the form on the left to edit.'),
          h(
            'p',
            { className: 'pv-empty' },
            err && err.message ? err.message : 'Unknown preview error',
          ),
        )
      }
    }
  }

  CMS.registerPreviewStyle('/admin/preview.css')

  CMS.registerPreviewTemplate('hero', safePreview(HeroPreview))
  CMS.registerPreviewTemplate('about', safePreview(AboutPreview))
  CMS.registerPreviewTemplate('contact', safePreview(ContactPreview))
  CMS.registerPreviewTemplate('site', safePreview(SitePreview))
  CMS.registerPreviewTemplate('score', safePreview(SectionHeadingPreview('Music section heading')))
  CMS.registerPreviewTemplate(
    'projects_section',
    safePreview(SectionHeadingPreview('Projects section heading')),
  )
  CMS.registerPreviewTemplate('focuses', safePreview(FocusesPreview))
  CMS.registerPreviewTemplate('sketches', safePreview(SketchesPreview))
  CMS.registerPreviewTemplate('game_projects', safePreview(ProjectPreview))
})()
