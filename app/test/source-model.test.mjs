import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  ensureProjectEvidenceShape,
  importSource,
  recordSourceEvent,
  sourcePayload,
  verifySourceIntegrity,
} from '../src/source-model.mjs'

const sha256 = async value => createHash('sha256').update(value).digest('hex')
const IDS = ['src-pdf', 'src-web', 'src-doi', 'src-text', 'src-audio', 'src-video']

const CASES = [
  {
    type: 'pdf',
    origin: { kind: 'file', immutableRef: 'project://p-a/files/studie.pdf', fileName: 'studie.pdf', size: 812 },
    original: { mediaType: 'application/pdf', pages: [{ page: 1, text: 'Die Stichprobe umfasst 84 Personen.' }] },
  },
  {
    type: 'web',
    origin: { kind: 'url', immutableRef: 'https://example.org/report#archived-2026-07-30', originalUrl: 'https://example.org/report' },
    original: { mediaType: 'text/html', sections: [{ id: 'results', heading: 'Ergebnisse', text: 'Die Fehlerrate sank um zwölf Prozent.' }] },
  },
  {
    type: 'doi',
    origin: { kind: 'doi', immutableRef: 'https://doi.org/10.1000/example', originalUrl: 'https://doi.org/10.1000/example' },
    original: { mediaType: 'application/metadata+json', text: 'Metadatensatz zum unveränderlichen DOI-Verweis.' },
  },
  {
    type: 'text',
    origin: { kind: 'pasted-text', immutableRef: 'text://original/notiz-1' },
    original: { mediaType: 'text/plain', text: 'Dies ist der unveränderte Originaltext.' },
  },
  {
    type: 'audio',
    origin: { kind: 'file', immutableRef: 'project://p-a/media/interview.wav', fileName: 'interview.wav', size: 4096 },
    original: { mediaType: 'audio/wav', transcript: 'Aufmerksamkeit ist eine gestaltete Bedingung.', segments: [{ startMs: 12000, endMs: 17000, text: 'Aufmerksamkeit ist eine gestaltete Bedingung.' }] },
  },
  {
    type: 'video',
    origin: { kind: 'url', immutableRef: 'https://media.example.org/talk-v1', originalUrl: 'https://media.example.org/talk-v1' },
    original: { mediaType: 'video/mp4', transcript: 'Der Vortrag grenzt Alarm von peripherer Information ab.', segments: [{ startMs: 30000, endMs: 38000, text: 'Der Vortrag grenzt Alarm von peripherer Information ab.' }] },
  },
]

test('EVID-01: alle sechs Quellenfamilien bewahren Original, Herkunft, Importzeit und SHA-256', async () => {
  let cursor = 0
  for (const fixture of CASES) {
    const source = await importSource({
      projectId: 'p-a',
      ...fixture,
      metadata: {
        title: { value: `Titel ${fixture.type}`, status: 'user-provided' },
        year: { value: 2026, status: 'confirmed', evidence: 'publisher-record' },
      },
      derived: { summary: 'Abgeleitete Kurzfassung' },
      importedAt: 1234,
      provenance: { actor: 'user', action: 'import' },
    }, { sha256, idFactory: () => IDS[cursor++] })

    assert.equal(source.type, fixture.type)
    assert.equal(source.projectId, 'p-a')
    assert.equal(source.importedAt, 1234)
    assert.equal(source.origin.immutableRef, fixture.origin.immutableRef)
    assert.equal(source.provenance.actor, 'user')
    assert.match(source.checksumSha256, /^[a-f0-9]{64}$/)
    assert.equal(source.checksumSha256, await sha256(sourcePayload(fixture.origin, fixture.original)))
    assert.deepEqual(source.original, fixture.original)
    assert.deepEqual(source.derived, { summary: 'Abgeleitete Kurzfassung' })
    assert.notEqual(source.original, source.derived)
    assert.equal(source.metadata.title.status, 'user-provided')
    assert.equal(source.metadata.year.status, 'confirmed')
  }
})

test('EVID-01: Import scheitert geschlossen bei fehlender Referenz, Prüfsumme, Typ oder Projekt', async () => {
  const valid = {
    projectId: 'p-a',
    type: 'text',
    origin: { kind: 'pasted-text', immutableRef: 'text://original/1' },
    original: { text: 'Original' },
    importedAt: 1,
  }
  await assert.rejects(importSource({ ...valid, projectId: '' }, { sha256 }), /project/i)
  await assert.rejects(importSource({ ...valid, type: 'spreadsheet' }, { sha256 }), /type/i)
  await assert.rejects(importSource({ ...valid, origin: { kind: 'pasted-text' } }, { sha256 }), /immutable/i)
  await assert.rejects(importSource(valid, {}), /sha-?256/i)
  await assert.rejects(importSource({
    ...valid,
    type: 'web',
    origin: { kind: 'url', immutableRef: 'http://example.org/insecure' },
  }, { sha256 }), /https/i)
  await assert.rejects(importSource({
    ...valid,
    type: 'doi',
    origin: { kind: 'pasted-text', immutableRef: 'https://doi.org/10.1000/example' },
  }, { sha256 }), /origin/i)
})

test('Projektmigration ergänzt Evidence-Listen additiv und repariert beschädigte Werte', () => {
  const project = { id: 'p-a', name: 'A', material: [{ id: 'm1' }], sources: 'kaputt', evidenceBundles: null }
  const result = ensureProjectEvidenceShape(project)
  assert.equal(result, project)
  assert.deepEqual(project.sources, [])
  assert.deepEqual(project.evidenceBundles, [])
  assert.deepEqual(project.material, [{ id: 'm1' }])

  const roundtrip = JSON.parse(JSON.stringify(project))
  ensureProjectEvidenceShape(roundtrip)
  assert.deepEqual(roundtrip, project)
})

test('EVID-08: Quellenereignisse erzeugen Historie, Status und neue Version ohne Originalüberschreibung', async () => {
  const source = await importSource({
    projectId: 'p-a',
    type: 'doi',
    origin: { kind: 'doi', immutableRef: 'https://doi.org/10.1000/old' },
    original: { text: 'Originalfassung' },
    importedAt: 10,
  }, { sha256, idFactory: () => 'src-1' })

  const retracted = recordSourceEvent(source, {
    id: 'event-1',
    kind: 'retracted',
    at: 20,
    reason: 'Daten nicht reproduzierbar',
    reference: 'https://doi.org/10.1000/retraction',
  })
  assert.equal(retracted.status, 'retracted')
  assert.equal(retracted.history.length, 1)
  assert.equal(retracted.history[0].reason, 'Daten nicht reproduzierbar')
  assert.deepEqual(retracted.original, source.original)
  assert.equal(source.status, 'active')
  assert.deepEqual(source.history, [])

  const superseded = recordSourceEvent(source, {
    id: 'event-2',
    kind: 'superseded',
    at: 30,
    replacementSourceId: 'src-2',
  })
  assert.equal(superseded.status, 'superseded')
  assert.equal(superseded.replacementSourceId, 'src-2')

  assert.throws(() => recordSourceEvent(source, { kind: 'retracted', at: 40 }), /id/i)
  assert.throws(() => recordSourceEvent(source, { id: 'bad', kind: 'unknown', at: 40 }), /kind/i)
})

test('EVID-01: nachträglich verändertes Original verletzt die gespeicherte Prüfsumme', async () => {
  const source = await importSource({
    projectId: 'p-a',
    type: 'text',
    origin: { kind: 'pasted-text', immutableRef: 'text://original/integrity' },
    original: { text: 'Unverändertes Original' },
    importedAt: 50,
  }, { sha256, idFactory: () => 'src-integrity' })
  assert.deepEqual(await verifySourceIntegrity(source, { sha256 }), { valid: true, reason: null })

  const manipulated = JSON.parse(JSON.stringify(source))
  manipulated.original.text = 'Still verändertes Original'
  assert.deepEqual(await verifySourceIntegrity(manipulated, { sha256 }), {
    valid: false,
    reason: 'source-checksum-mismatch',
  })
})
