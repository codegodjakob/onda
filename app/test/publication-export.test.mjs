import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPublicationDocument,
  publicationFilename,
  renderHtml,
  renderJats,
  renderMarkdown,
} from '../src/publication-export.mjs'

function publicationFixture() {
  return {
    projectId: 'p-a',
    textId: 'd-a',
    title: 'Prüfung & Wirkung',
    editorJson: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2, class: 'agentWidget CANARY-UI' },
          content: [{ type: 'text', text: 'Überschrift' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Ein ' },
            {
              type: 'text',
              text: 'sicherer Link',
              marks: [{
                type: 'link',
                attrs: {
                  href: 'https://example.org/a?x=1&y=2',
                  class: 'language-card',
                  onclick: 'CANARY-SCRIPT',
                },
              }],
            },
            { type: 'text', text: ' und eine ' },
            { type: 'text', text: 'Fußnote A', marks: [{ type: 'footnoteReference', attrs: { id: 'fn-a' } }] },
            { type: 'text', text: ' sowie ' },
            { type: 'text', text: 'Meyer 2024', marks: [{ type: 'citation', attrs: { key: 'meyer2024' } }] },
            { type: 'text', text: '.' },
          ],
        },
        {
          type: 'bulletList',
          content: [{
            type: 'listItem',
            content: [
              { type: 'paragraph', content: [{ type: 'text', text: 'Listenpunkt' }] },
              {
                type: 'orderedList',
                attrs: { start: 3 },
                content: [{
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Unterpunkt' }] }],
                }],
              },
            ],
          }],
        },
        {
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Originalzitat' }] }],
        },
        {
          type: 'unknownWidget',
          attrs: { html: '<script>CANARY-SCRIPT</script>', class: 'audit-dialog' },
          content: [{ type: 'text', text: 'Erhaltener Klartext' }],
        },
      ],
    },
    footnotes: [{ id: 'fn-a', label: 'A', content: 'Fußnote A erklärt den Begriff.' }],
    citations: [{
      id: 'cite-a',
      key: 'meyer2024',
      label: 'Meyer 2024',
      locator: { page: '17' },
    }],
    bibliography: [{
      key: 'meyer2024',
      label: 'Meyer 2024',
      title: 'Quellen & Wirkung',
      authors: ['Meyer, Ada'],
      year: '2024',
      url: 'https://example.org/source',
    }],
  }
}

test('AUDIT-05: Markdown, HTML und JATS bewahren Struktur und Referenzen ohne UI', () => {
  const publication = buildPublicationDocument(publicationFixture())
  const outputs = {
    markdown: renderMarkdown(publication),
    html: renderHtml(publication),
    jats: renderJats(publication),
  }
  for (const output of Object.values(outputs)) {
    for (const canary of ['Überschrift', 'Listenpunkt', 'Unterpunkt', 'Originalzitat', 'Fußnote A', 'Meyer 2024']) {
      assert.match(output, new RegExp(canary))
    }
    assert.doesNotMatch(output, /language-card|agentWidget|finding|audit-dialog|ProseMirror|CANARY-UI/)
  }
  assert.match(outputs.markdown, /^# Prüfung & Wirkung/m)
  assert.match(outputs.html, /<article[^>]*>[\s\S]*<h2>Überschrift<\/h2>/)
  assert.match(outputs.jats, /<article[^>]*article-type="research-article"/)
})

test('AUDIT-05: Links, Zitationsanker und Fußnoten bleiben maschinenlesbar', () => {
  const publication = buildPublicationDocument(publicationFixture())
  const markdown = renderMarkdown(publication)
  const html = renderHtml(publication)
  const jats = renderJats(publication)
  assert.match(markdown, /\[sicherer Link\]\(https:\/\/example\.org\/a\?x=1&y=2\)/)
  assert.match(markdown, /\[\^fn-a\]/)
  assert.match(markdown, /\[@meyer2024, S\. 17\]/)
  assert.match(html, /href="https:\/\/example\.org\/a\?x=1&amp;y=2"/)
  assert.match(html, /role="doc-noteref"/)
  assert.match(html, /data-citation-key="meyer2024"/)
  assert.match(jats, /<xref ref-type="fn" rid="fn-a">/)
  assert.match(jats, /<xref ref-type="bibr" rid="ref-meyer2024">/)
  assert.match(jats, /<ref id="ref-meyer2024">/)
})

test('AUDIT-05: unbekannte Knoten behalten nur Klartext und hostile Inhalte werden escaped', () => {
  const input = publicationFixture()
  input.editorJson.content.push({
    type: 'paragraph',
    content: [{ type: 'text', text: '<img src=x onerror=CANARY-XSS>' }],
  })
  input.bibliography[0].title = '<script>CANARY-XSS</script>'
  const publication = buildPublicationDocument(input)
  const html = renderHtml(publication)
  const jats = renderJats(publication)
  assert.match(html, /Erhaltener Klartext/)
  assert.doesNotMatch(html, /<script>|<img src=x/)
  assert.match(html, /&lt;script&gt;CANARY-XSS&lt;\/script&gt;/)
  assert.doesNotMatch(jats, /<script>|<img src=x/)
  assert.match(jats, /&lt;script&gt;CANARY-XSS&lt;\/script&gt;/)
})

test('Publikationsdokument und alle Adapter sind byte-stabil und verändern Eingaben nicht', () => {
  const input = publicationFixture()
  const original = JSON.parse(JSON.stringify(input))
  const first = buildPublicationDocument(input)
  const second = buildPublicationDocument(input)
  assert.deepEqual(input, original)
  assert.deepEqual(first, second)
  assert.equal(renderMarkdown(first), renderMarkdown(second))
  assert.equal(renderHtml(first), renderHtml(second))
  assert.equal(renderJats(first), renderJats(second))
})

test('Publikationsformate erfinden bei leerer Bibliografie keine Angaben und Dateinamen sind sicher', () => {
  const input = publicationFixture()
  input.bibliography = []
  input.title = '../../ Prüfung: Wirkung? '
  const publication = buildPublicationDocument(input)
  assert.doesNotMatch(renderMarkdown(publication), /Meyer, Ada/)
  assert.doesNotMatch(renderHtml(publication), /Meyer, Ada/)
  assert.doesNotMatch(renderJats(publication), /Meyer, Ada/)
  assert.equal(publicationFilename(input.title, 'markdown'), 'pruefung-wirkung.md')
  assert.equal(publicationFilename(input.title, 'html'), 'pruefung-wirkung.html')
  assert.equal(publicationFilename(input.title, 'jats'), 'pruefung-wirkung.xml')
  assert.throws(() => publicationFilename(input.title, 'pdf'), /format/i)
})

test('Ungültige Projekte, Texte, Links und Dokumentwurzeln werden fail-closed behandelt', () => {
  const input = publicationFixture()
  input.editorJson.type = 'CANARY-WRONG'
  assert.throws(() => buildPublicationDocument(input), /document/i)
  assert.throws(() => buildPublicationDocument({ ...publicationFixture(), projectId: ' ' }), /project/i)
  const unsafe = publicationFixture()
  unsafe.editorJson.content[1].content[1].marks[0].attrs.href = 'javascript:alert(1)'
  const html = renderHtml(buildPublicationDocument(unsafe))
  assert.doesNotMatch(html, /javascript:/i)
  assert.match(html, /Ein sicherer Link und/)
  assert.doesNotMatch(html, /href="[^"]*">\s*sicherer Link/)
})
