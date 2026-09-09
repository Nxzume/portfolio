/** Directus field helpers for structured (non-JSON-blob) editing. */

export const stringField = (field, note, opts = {}) => ({
  field,
  type: 'string',
  meta: {
    interface: opts.multiline ? 'input-multiline' : 'input',
    width: opts.width ?? 'full',
    ...(note ? { note } : {}),
  },
})

export const textField = (field, note) => ({
  field,
  type: 'text',
  meta: { interface: 'input-multiline', width: 'full', ...(note ? { note } : {}) },
})

/** Top-level image stored in Directus Files (upload in admin). */
export const imageFileField = (field, note = 'Upload an image in Directus') => ({
  field,
  type: 'uuid',
  meta: {
    interface: 'file-image',
    special: ['file'],
    width: 'half',
    ...(note ? { note } : {}),
    options: {
      folder: null,
      enableCreate: true,
      enableSelect: true,
    },
  },
  schema: {
    is_nullable: true,
    foreign_key_table: 'directus_files',
    foreign_key_column: 'id',
  },
})

/** Top-level file (audio, etc.) stored in Directus Files. */
export const fileField = (field, note = 'Upload a file in Directus') => ({
  field,
  type: 'uuid',
  meta: {
    interface: 'file',
    special: ['file'],
    width: 'full',
    ...(note ? { note } : {}),
    options: {
      folder: null,
      enableCreate: true,
      enableSelect: true,
    },
  },
  schema: {
    is_nullable: true,
    foreign_key_table: 'directus_files',
    foreign_key_column: 'id',
  },
})

/**
 * @deprecated Nested file-image inside JSON list cannot upload in Directus.
 * Gallery/sections use real Files M2M / O2M relations instead.
 */
export const imageFileSubfield = (field = 'image', note = 'Upload an image') => ({
  field,
  name: 'Image',
  type: 'uuid',
  meta: {
    interface: 'file-image',
    width: 'full',
    ...(note ? { note } : {}),
  },
})

export const listField = (field, note, subfields, template) => ({
  field,
  type: 'json',
  meta: {
    interface: 'list',
    width: 'full',
    ...(note ? { note } : {}),
    options: {
      ...(template ? { template } : {}),
      fields: subfields,
    },
  },
})

const paragraphSubfield = {
  field: 'paragraph',
  name: 'Paragraph',
  type: 'text',
  meta: { interface: 'input-multiline', width: 'full' },
}

export const COLLECTIONS = {
  site_settings: {
    collection: 'site_settings',
    meta: { singleton: true, icon: 'person', note: 'Site name, contact, and social links' },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input' }, schema: { is_primary_key: true, has_auto_increment: true } },
      stringField('name', 'Full name shown in nav and meta'),
      textField('tagline', 'Short description under the name'),
      stringField('email', 'Contact email'),
      stringField('url', 'Live site URL (no trailing slash)'),
      stringField('github', 'GitHub profile URL'),
      stringField('linkedin', 'LinkedIn profile URL'),
    ],
  },

  hero: {
    collection: 'hero',
    meta: { singleton: true, icon: 'star', note: 'Homepage hero' },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input' }, schema: { is_primary_key: true, has_auto_increment: true } },
      textField('headline', 'Main headline'),
      imageFileField('image'),
      stringField('primary_cta_label', 'Primary button label'),
      stringField('primary_cta_href', 'Primary button link, e.g. #compose'),
      stringField('secondary_cta_label', 'Secondary button label'),
      stringField('secondary_cta_href', 'Secondary button link, e.g. #projects'),
    ],
  },

  about: {
    collection: 'about',
    meta: { singleton: true, icon: 'info', note: 'About section' },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input' }, schema: { is_primary_key: true, has_auto_increment: true } },
      imageFileField('portrait', 'Portrait photo'),
      stringField('portrait_alt', 'Portrait alt text (optional)'),
      textField('lead', 'Opening line'),
      listField('body', 'Body paragraphs', [paragraphSubfield], '{{paragraph}}'),
      textField('note', 'Optional footnote'),
    ],
  },

  contact: {
    collection: 'contact',
    meta: { singleton: true, icon: 'mail', note: 'Contact section' },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input' }, schema: { is_primary_key: true, has_auto_increment: true } },
      stringField('eyebrow', 'Small label above title'),
      stringField('title', 'Section title'),
      textField('lede', 'Intro text'),
      stringField('email_button_text', 'Mail button label, e.g. Email Alexandre'),
    ],
  },

  score_section: {
    collection: 'score_section',
    meta: { singleton: true, icon: 'music_note', note: 'Music / score desk section header' },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input' }, schema: { is_primary_key: true, has_auto_increment: true } },
      stringField('eyebrow'),
      stringField('title'),
      textField('lede'),
    ],
  },

  projects_section: {
    collection: 'projects_section',
    meta: { singleton: true, icon: 'work', note: 'Projects section header' },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input' }, schema: { is_primary_key: true, has_auto_increment: true } },
      stringField('eyebrow'),
      stringField('title'),
      textField('lede'),
    ],
  },

  focus_tabs: {
    collection: 'focus_tabs',
    meta: { icon: 'tab', sort_field: 'sort', note: 'Focus switcher tabs (Compose, Levels, Azure)' },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input' }, schema: { is_primary_key: true, has_auto_increment: true } },
      { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true } },
      stringField('tab_id', 'ID used in URLs/anchors, e.g. compose'),
      stringField('label', 'Tab label'),
      stringField('headline', 'Headline when tab is active'),
      textField('body', 'Tab body copy'),
    ],
  },

  sketch_tracks: {
    collection: 'sketch_tracks',
    meta: { icon: 'audio_file', sort_field: 'sort', note: 'Music tracks on the score desk' },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input' }, schema: { is_primary_key: true, has_auto_increment: true } },
      { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true } },
      stringField('track_id', 'Unique ID, e.g. 10years'),
      stringField('title', 'Track title'),
      stringField('mood', 'Optional mood line'),
      fileField('audio', 'Track audio file (mp3, flac, …)'),
      { field: 'bpm', type: 'integer', meta: { interface: 'input', note: 'Optional — for generative placeholder' } },
      { field: 'base_freq', type: 'integer', meta: { interface: 'input', note: 'Optional — for generative placeholder' } },
    ],
  },

  projects: {
    collection: 'projects',
    meta: { icon: 'folder', sort_field: 'sort', note: 'Portfolio projects' },
    schema: {},
    fields: [
      { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input' }, schema: { is_primary_key: true, has_auto_increment: true } },
      { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true } },
      stringField('slug', 'URL slug — /projects/{slug}'),
      stringField('title', 'Project title'),
      stringField('subtitle', 'Subtitle under title'),
      textField('summary', 'Short summary for cards'),
      imageFileField('image', 'Cover image'),
      // gallery + sections are created as real Files M2M / O2M relations in migrate
      // (JSON list + file-image cannot show Upload in Directus).
      listField(
        'highlights',
        'Highlight bullets',
        [{ field: 'item', name: 'Highlight', type: 'string', meta: { interface: 'input', width: 'full' } }],
        '{{item}}',
      ),
      listField(
        'links',
        'External links',
        [
          { field: 'label', name: 'Label', type: 'string', meta: { interface: 'input', width: 'half' } },
          { field: 'href', name: 'URL', type: 'string', meta: { interface: 'input', width: 'half' } },
        ],
        '{{label}}',
      ),
      listField('intro', 'Intro paragraphs', [paragraphSubfield], '{{paragraph}}'),
    ],
  },
}

/** Top-level fields that must be uuid + file relation (not nested JSON). */
export const FILE_RELATION_FIELDS = [
  { collection: 'hero', field: 'image', kind: 'image' },
  { collection: 'about', field: 'portrait', kind: 'image' },
  { collection: 'projects', field: 'image', kind: 'image' },
  { collection: 'sketch_tracks', field: 'audio', kind: 'file' },
]

export const PUBLIC_COLLECTIONS = [
  'site_settings',
  'hero',
  'about',
  'contact',
  'score_section',
  'projects_section',
  'focus_tabs',
  'sketch_tracks',
  'projects',
  'project_sections',
  'projects_gallery',
]

/** Legacy JSON-blob singleton — removed after migration. */
export const LEGACY_COLLECTIONS = ['portfolio_globals']
