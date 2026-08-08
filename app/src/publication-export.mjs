// Der Weg aus Onda heraus — PUR, node-testbar, kein DOM.
//
// Macht aus einem Dokument eine Veröffentlichungsfassung in Markdown, HTML oder JATS.
// Nur eine ausdrücklich genannte Liste von Block- und Auszeichnungsarten kommt durch;
// alles andere fällt weg, statt ungeprüft in die Ausgabe zu geraten.
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js), aufgerufen aus audit-ui.mjs.
const FORMAT_EXTENSIONS = Object.freeze({
  markdown: 'md',
  html: 'html',
  jats: 'xml',
})
const SAFE_BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'horizontalRule',
  'codeBlock',
])
const SAFE_MARK_TYPES = new Set([
  'bold',
  'strong',
  'italic',
  'em',
  'strike',
  'code',
  'link',
  'footnoteReference',
  'citation',
])

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

function requiredText(value, label) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) throw new TypeError(`${label} is required`)
  return normalized
}

function optionalText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function safeId(value, fallback) {
  const normalized = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9_.:-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || fallback
}

function safeUrl(value) {
  const normalized = optionalText(value)
  if (!normalized) return ''
  try {
    const url = new URL(normalized)
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

function normalizeMark(mark) {
  if (!isObject(mark) || !SAFE_MARK_TYPES.has(mark.type)) return null
  if (mark.type === 'link') {
    const href = safeUrl(mark.attrs?.href)
    return href ? { type: 'link', href } : null
  }
  if (mark.type === 'footnoteReference') {
    const id = safeId(mark.attrs?.id, '')
    return id ? { type: 'footnoteReference', id } : null
  }
  if (mark.type === 'citation') {
    const key = safeId(mark.attrs?.key, '')
    return key ? { type: 'citation', key } : null
  }
  if (mark.type === 'strong') return { type: 'bold' }
  if (mark.type === 'em') return { type: 'italic' }
  return { type: mark.type }
}

function normalizeInline(nodes) {
  const output = []
  ;(Array.isArray(nodes) ? nodes : []).forEach(node => {
    if (!isObject(node)) return
    if (node.type === 'text') {
      if (typeof node.text !== 'string' || !node.text) return
      output.push({
        type: 'text',
        text: node.text,
        marks: (Array.isArray(node.marks) ? node.marks : []).map(normalizeMark).filter(Boolean),
      })
      return
    }
    if (node.type === 'hardBreak') {
      output.push({ type: 'hardBreak' })
      return
    }
    if (node.type === 'footnoteReference') {
      const id = safeId(node.attrs?.id, '')
      if (id) output.push({ type: 'reference', refType: 'footnote', id, label: optionalText(node.attrs?.label) })
      return
    }
    if (node.type === 'citation') {
      const key = safeId(node.attrs?.key, '')
      if (key) output.push({ type: 'reference', refType: 'citation', key, label: optionalText(node.attrs?.label) })
      return
    }
    output.push(...normalizeInline(node.content))
  })
  return output
}

function normalizeBlock(node) {
  if (!isObject(node)) return null
  if (!SAFE_BLOCK_TYPES.has(node.type)) {
    const content = normalizeInline(node.content)
    return content.length ? { type: 'paragraph', content } : null
  }
  if (node.type === 'heading') {
    const level = Math.min(6, Math.max(1, Number(node.attrs?.level) || 2))
    return { type: 'heading', level, content: normalizeInline(node.content) }
  }
  if (node.type === 'paragraph') {
    return { type: 'paragraph', content: normalizeInline(node.content) }
  }
  if (node.type === 'horizontalRule') return { type: 'horizontalRule' }
  if (node.type === 'codeBlock') {
    return {
      type: 'codeBlock',
      language: optionalText(node.attrs?.language),
      text: normalizeInline(node.content).map(item => item.text || '\n').join(''),
    }
  }
  if (node.type === 'blockquote') {
    return { type: 'blockquote', blocks: normalizeBlocks(node.content) }
  }
  if (node.type === 'listItem') {
    return { type: 'listItem', blocks: normalizeBlocks(node.content) }
  }
  if (node.type === 'bulletList' || node.type === 'orderedList') {
    return {
      type: node.type,
      start: node.type === 'orderedList' ? Math.max(1, Number(node.attrs?.start) || 1) : null,
      items: (Array.isArray(node.content) ? node.content : [])
        .map(item => normalizeBlock(item))
        .filter(item => item?.type === 'listItem'),
    }
  }
  return null
}

function normalizeBlocks(nodes) {
  return (Array.isArray(nodes) ? nodes : []).map(normalizeBlock).filter(Boolean)
}

function normalizeFootnotes(values) {
  return (Array.isArray(values) ? values : []).map((item, index) => {
    if (!isObject(item)) return null
    const id = safeId(item.id, `fn-${index + 1}`)
    const content = optionalText(item.content || item.text)
    if (!content) return null
    return { id, label: optionalText(item.label) || String(index + 1), content }
  }).filter(Boolean)
}

function normalizeCitations(values) {
  return (Array.isArray(values) ? values : []).map((item, index) => {
    if (!isObject(item)) return null
    const key = safeId(item.key, '')
    if (!key) return null
    return {
      id: safeId(item.id, `citation-${index + 1}`),
      key,
      label: optionalText(item.label) || key,
      locator: {
        page: optionalText(item.locator?.page),
        section: optionalText(item.locator?.section),
      },
    }
  }).filter(Boolean)
}

function normalizeBibliography(values) {
  return (Array.isArray(values) ? values : []).map(item => {
    if (!isObject(item)) return null
    const key = safeId(item.key, '')
    if (!key) return null
    return {
      key,
      label: optionalText(item.label) || key,
      title: optionalText(item.title),
      authors: (Array.isArray(item.authors) ? item.authors : [])
        .map(optionalText)
        .filter(Boolean),
      year: optionalText(item.year),
      publisher: optionalText(item.publisher),
      doi: optionalText(item.doi),
      url: safeUrl(item.url),
    }
  }).filter(Boolean).sort((a, b) => a.key.localeCompare(b.key, 'de'))
}

export function buildPublicationDocument({
  projectId,
  textId,
  title,
  editorJson,
  footnotes = [],
  citations = [],
  bibliography = [],
} = {}) {
  const normalizedProjectId = requiredText(projectId, 'Publication project')
  const normalizedTextId = requiredText(textId, 'Publication text')
  const normalizedTitle = requiredText(title, 'Publication title')
  if (!isObject(editorJson) || editorJson.type !== 'doc' || !Array.isArray(editorJson.content)) {
    throw new TypeError('Publication document root is invalid')
  }
  return {
    schemaVersion: 1,
    kind: 'ui-free-publication-document',
    projectId: normalizedProjectId,
    textId: normalizedTextId,
    title: normalizedTitle,
    blocks: normalizeBlocks(editorJson.content),
    footnotes: normalizeFootnotes(footnotes),
    citations: normalizeCitations(citations),
    bibliography: normalizeBibliography(bibliography),
  }
}

function citationFor(document, key) {
  return document.citations.find(item => item.key === key) || null
}

function citationLabel(citation, fallback) {
  if (!citation) return fallback
  if (citation.locator.page) return `${citation.label}, S. ${citation.locator.page}`
  if (citation.locator.section) return `${citation.label}, ${citation.locator.section}`
  return citation.label
}

function markdownText(value) {
  return String(value).replace(/([\\`*_[\]<>])/g, '\\$1')
}

function markdownInline(document, nodes) {
  return nodes.map(node => {
    if (node.type === 'hardBreak') return '  \n'
    if (node.type === 'reference') {
      if (node.refType === 'footnote') return `[^${node.id}]`
      const citation = citationFor(document, node.key)
      return `[@${node.key}${citation?.locator.page ? `, S. ${citation.locator.page}` : ''}]`
    }
    let output = markdownText(node.text)
    node.marks.forEach(mark => {
      if (mark.type === 'bold') output = `**${output}**`
      if (mark.type === 'italic') output = `*${output}*`
      if (mark.type === 'strike') output = `~~${output}~~`
      if (mark.type === 'code') output = `\`${String(node.text).replace(/`/g, '\\`')}\``
      if (mark.type === 'link') output = `[${output}](${mark.href})`
      if (mark.type === 'footnoteReference') output = `${output}[^${mark.id}]`
      if (mark.type === 'citation') {
        const citation = citationFor(document, mark.key)
        output = `${output} [@${mark.key}${citation?.locator.page ? `, S. ${citation.locator.page}` : ''}]`
      }
    })
    return output
  }).join('')
}

function markdownBlocks(document, blocks, depth = 0) {
  return blocks.map(block => {
    if (block.type === 'heading') return `${'#'.repeat(block.level)} ${markdownInline(document, block.content)}`
    if (block.type === 'paragraph') return markdownInline(document, block.content)
    if (block.type === 'horizontalRule') return '---'
    if (block.type === 'codeBlock') return `\`\`\`${block.language}\n${block.text}\n\`\`\``
    if (block.type === 'blockquote') {
      return markdownBlocks(document, block.blocks, depth)
        .split('\n')
        .map(line => `> ${line}`)
        .join('\n')
    }
    if (block.type === 'bulletList' || block.type === 'orderedList') {
      return block.items.map((item, index) => {
        const marker = block.type === 'orderedList' ? `${block.start + index}.` : '-'
        const rendered = markdownBlocks(document, item.blocks, depth + 1)
        const lines = rendered.split('\n')
        return `${'  '.repeat(depth)}${marker} ${lines[0]}${lines.slice(1).map(line => `\n${'  '.repeat(depth + 1)}${line}`).join('')}`
      }).join('\n')
    }
    return ''
  }).filter(Boolean).join('\n\n')
}

function bibliographyText(entry) {
  return [
    entry.authors.join('; '),
    entry.year ? `(${entry.year})` : '',
    entry.title,
    entry.publisher,
    entry.doi ? `https://doi.org/${entry.doi}` : '',
    entry.url,
  ].filter(Boolean).join('. ')
}

export function renderMarkdown(document) {
  const body = markdownBlocks(document, document.blocks)
  const footnotes = document.footnotes.map(item => `[^${item.id}]: ${markdownText(item.content)}`).join('\n')
  const bibliography = document.bibliography.map(entry => (
    `- <a id="ref-${entry.key}"></a>**${markdownText(entry.label)}** — ${markdownText(bibliographyText(entry))}`
  )).join('\n')
  return [
    `# ${markdownText(document.title)}`,
    body,
    footnotes && `## Fußnoten\n\n${footnotes}`,
    bibliography && `## Literatur\n\n${bibliography}`,
  ].filter(Boolean).join('\n\n').trimEnd() + '\n'
}

function xmlText(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function htmlInline(document, nodes) {
  return nodes.map(node => {
    if (node.type === 'hardBreak') return '<br>'
    if (node.type === 'reference') {
      if (node.refType === 'footnote') {
        return `<sup><a href="#${xmlText(node.id)}" role="doc-noteref">${xmlText(node.label || node.id)}</a></sup>`
      }
      const citation = citationFor(document, node.key)
      return `<a href="#ref-${xmlText(node.key)}" data-citation-key="${xmlText(node.key)}">${xmlText(citationLabel(citation, node.label || node.key))}</a>`
    }
    let output = xmlText(node.text)
    node.marks.forEach(mark => {
      if (mark.type === 'bold') output = `<strong>${output}</strong>`
      if (mark.type === 'italic') output = `<em>${output}</em>`
      if (mark.type === 'strike') output = `<s>${output}</s>`
      if (mark.type === 'code') output = `<code>${xmlText(node.text)}</code>`
      if (mark.type === 'link') output = `<a href="${xmlText(mark.href)}">${output}</a>`
      if (mark.type === 'footnoteReference') {
        output = `${output}<sup><a href="#${xmlText(mark.id)}" role="doc-noteref">${xmlText(mark.id)}</a></sup>`
      }
      if (mark.type === 'citation') {
        const citation = citationFor(document, mark.key)
        output = `${output} <a href="#ref-${xmlText(mark.key)}" data-citation-key="${xmlText(mark.key)}">${xmlText(citationLabel(citation, mark.key))}</a>`
      }
    })
    return output
  }).join('')
}

function htmlBlocks(document, blocks) {
  return blocks.map(block => {
    if (block.type === 'heading') return `<h${block.level}>${htmlInline(document, block.content)}</h${block.level}>`
    if (block.type === 'paragraph') return `<p>${htmlInline(document, block.content)}</p>`
    if (block.type === 'horizontalRule') return '<hr>'
    if (block.type === 'codeBlock') return `<pre><code>${xmlText(block.text)}</code></pre>`
    if (block.type === 'blockquote') return `<blockquote>${htmlBlocks(document, block.blocks)}</blockquote>`
    if (block.type === 'bulletList' || block.type === 'orderedList') {
      const tag = block.type === 'bulletList' ? 'ul' : 'ol'
      const start = tag === 'ol' && block.start !== 1 ? ` start="${block.start}"` : ''
      return `<${tag}${start}>${block.items.map(item => `<li>${htmlBlocks(document, item.blocks)}</li>`).join('')}</${tag}>`
    }
    return ''
  }).join('')
}

export function renderHtml(document) {
  const footnotes = document.footnotes.length
    ? `<section aria-labelledby="footnotes-heading" role="doc-endnotes"><h2 id="footnotes-heading">Fußnoten</h2><ol>${document.footnotes.map(item => (
      `<li id="${xmlText(item.id)}">${xmlText(item.content)}</li>`
    )).join('')}</ol></section>`
    : ''
  const bibliography = document.bibliography.length
    ? `<section aria-labelledby="bibliography-heading"><h2 id="bibliography-heading">Literatur</h2><ul>${document.bibliography.map(entry => (
      `<li id="ref-${xmlText(entry.key)}"><strong>${xmlText(entry.label)}</strong> — ${xmlText(bibliographyText(entry))}</li>`
    )).join('')}</ul></section>`
    : ''
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${xmlText(document.title)}</title></head><body><article><h1>${xmlText(document.title)}</h1>${htmlBlocks(document, document.blocks)}${footnotes}${bibliography}</article></body></html>\n`
}

function jatsInline(document, nodes) {
  return nodes.map(node => {
    if (node.type === 'hardBreak') return '\n'
    if (node.type === 'reference') {
      if (node.refType === 'footnote') return `<xref ref-type="fn" rid="${xmlText(node.id)}">${xmlText(node.label || node.id)}</xref>`
      const citation = citationFor(document, node.key)
      return `<xref ref-type="bibr" rid="ref-${xmlText(node.key)}">${xmlText(citationLabel(citation, node.label || node.key))}</xref>`
    }
    let output = xmlText(node.text)
    node.marks.forEach(mark => {
      if (mark.type === 'bold') output = `<bold>${output}</bold>`
      if (mark.type === 'italic') output = `<italic>${output}</italic>`
      if (mark.type === 'strike') output = `<strike>${output}</strike>`
      if (mark.type === 'code') output = `<monospace>${xmlText(node.text)}</monospace>`
      if (mark.type === 'link') output = `<ext-link ext-link-type="uri" xlink:href="${xmlText(mark.href)}">${output}</ext-link>`
      if (mark.type === 'footnoteReference') {
        output = `${output}<xref ref-type="fn" rid="${xmlText(mark.id)}">${xmlText(mark.id)}</xref>`
      }
      if (mark.type === 'citation') {
        const citation = citationFor(document, mark.key)
        output = `${output} <xref ref-type="bibr" rid="ref-${xmlText(mark.key)}">${xmlText(citationLabel(citation, mark.key))}</xref>`
      }
    })
    return output
  }).join('')
}

function jatsBlocks(document, blocks) {
  let sectionOpen = false
  let output = ''
  blocks.forEach(block => {
    if (block.type === 'heading') {
      if (sectionOpen) output += '</sec>'
      output += `<sec><title>${jatsInline(document, block.content)}</title>`
      sectionOpen = true
      return
    }
    if (block.type === 'paragraph') output += `<p>${jatsInline(document, block.content)}</p>`
    if (block.type === 'horizontalRule') output += '<p>—</p>'
    if (block.type === 'codeBlock') output += `<code language="${xmlText(block.language)}">${xmlText(block.text)}</code>`
    if (block.type === 'blockquote') output += `<disp-quote>${jatsBlocks(document, block.blocks)}</disp-quote>`
    if (block.type === 'bulletList' || block.type === 'orderedList') {
      const type = block.type === 'bulletList' ? 'bullet' : 'order'
      output += `<list list-type="${type}">${block.items.map(item => `<list-item>${jatsBlocks(document, item.blocks)}</list-item>`).join('')}</list>`
    }
  })
  if (sectionOpen) output += '</sec>'
  return output
}

export function renderJats(document) {
  const footnotes = document.footnotes.length
    ? `<fn-group>${document.footnotes.map(item => `<fn id="${xmlText(item.id)}"><label>${xmlText(item.label)}</label><p>${xmlText(item.content)}</p></fn>`).join('')}</fn-group>`
    : ''
  const bibliography = document.bibliography.length
    ? `<ref-list><title>Literatur</title>${document.bibliography.map(entry => (
      `<ref id="ref-${xmlText(entry.key)}"><label>${xmlText(entry.label)}</label><mixed-citation>${xmlText(bibliographyText(entry))}</mixed-citation></ref>`
    )).join('')}</ref-list>`
    : ''
  return `<?xml version="1.0" encoding="UTF-8"?>\n<article article-type="research-article" xml:lang="de" xmlns:xlink="http://www.w3.org/1999/xlink"><front><article-meta><title-group><article-title>${xmlText(document.title)}</article-title></title-group></article-meta></front><body>${jatsBlocks(document, document.blocks)}</body><back>${footnotes}${bibliography}</back></article>\n`
}

export function publicationFilename(title, format) {
  const extension = FORMAT_EXTENSIONS[format]
  if (!extension) throw new TypeError('Publication format is invalid')
  const slug = requiredText(title, 'Publication title')
    .toLocaleLowerCase('de')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return `${slug || 'text'}.${extension}`
}
