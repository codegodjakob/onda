import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createLocator, resolveLocator } from '../src/locator-model.mjs'

const sha256 = async value => createHash('sha256').update(value).digest('hex')

const sources = {
  pdf: {
    id: 'src-pdf', projectId: 'p-a', type: 'pdf', status: 'active',
    original: { pages: [{ page: 7, text: 'Vor dem Befund. Die Stichprobe umfasst 84 Personen. Nach dem Befund.' }] },
  },
  web: {
    id: 'src-web', projectId: 'p-a', type: 'web', status: 'active',
    original: { sections: [{ id: 'results', heading: 'Ergebnisse', text: 'Die Fehlerrate sank um zwölf Prozent.' }] },
  },
  text: {
    id: 'src-text', projectId: 'p-a', type: 'text', status: 'active',
    original: { text: 'Calm Technology bewegt Information zwischen Zentrum und Peripherie.' },
  },
  audio: {
    id: 'src-audio', projectId: 'p-a', type: 'audio', status: 'active',
    original: { segments: [{ startMs: 12000, endMs: 17000, text: 'Aufmerksamkeit ist eine gestaltete Bedingung.' }] },
  },
}

test('EVID-02: Seiten-, Abschnitts-, Text- und Zeitfundstellen lösen den exakten Originalausschnitt auf', async () => {
  const fixtures = [
    ['pdf', 'page', { page: 7 }, 'Die Stichprobe umfasst 84 Personen.'],
    ['web', 'section', { sectionId: 'results' }, 'Die Fehlerrate sank um zwölf Prozent.'],
    ['text', 'text', { start: 0, end: 69 }, 'Calm Technology bewegt Information zwischen Zentrum und Peripherie.'],
    ['audio', 'time', { startMs: 12000, endMs: 17000 }, 'Aufmerksamkeit ist eine gestaltete Bedingung.'],
  ]

  for (const [sourceKey, kind, address, excerpt] of fixtures) {
    const source = sources[sourceKey]
    const locator = await createLocator({
      id: `loc-${kind}`,
      projectId: 'p-a',
      sourceId: source.id,
      kind,
      address,
      excerpt,
      claimId: 'claim-1',
    }, { sha256 })
    const resolved = await resolveLocator({ projectId: 'p-a', source, locator, sha256 })
    assert.equal(resolved.status, 'verified')
    assert.equal(resolved.excerpt, excerpt)
    assert.equal(resolved.claimId, 'claim-1')
    assert.deepEqual(resolved.address, address)
  }
})

test('EVID-02: falscher Ausschnitt, falsche Quelle, Projektgrenze und Rücknahme sind fail-closed', async () => {
  const locator = await createLocator({
    id: 'loc-1',
    projectId: 'p-a',
    sourceId: 'src-pdf',
    kind: 'page',
    address: { page: 7 },
    excerpt: 'Diese erfundene Stelle existiert nicht.',
    claimId: 'claim-1',
  }, { sha256 })

  assert.equal((await resolveLocator({ projectId: 'p-a', source: sources.pdf, locator, sha256 })).status, 'unverified')
  assert.equal((await resolveLocator({ projectId: 'p-b', source: sources.pdf, locator, sha256 })).reason, 'project-mismatch')
  assert.equal((await resolveLocator({ projectId: 'p-a', source: sources.web, locator, sha256 })).reason, 'source-mismatch')
  assert.equal((await resolveLocator({
    projectId: 'p-a',
    source: { ...sources.pdf, status: 'retracted' },
    locator,
    sha256,
  })).reason, 'source-not-active')
})

test('Locator-Schema verwirft ungültige Adressen und fehlende Claim-Beziehung', async () => {
  const base = { id: 'loc', projectId: 'p-a', sourceId: 'src', excerpt: 'Original', claimId: 'claim-1' }
  await assert.rejects(createLocator({ ...base, kind: 'page', address: { page: 0 } }, { sha256 }), /page/i)
  await assert.rejects(createLocator({ ...base, kind: 'time', address: { startMs: 10, endMs: 5 } }, { sha256 }), /time/i)
  await assert.rejects(createLocator({ ...base, kind: 'section', address: {} }, { sha256 }), /section/i)
  await assert.rejects(createLocator({ ...base, kind: 'text', address: { start: 3, end: 2 } }, { sha256 }), /text/i)
  await assert.rejects(createLocator({ ...base, kind: 'page', address: { page: 1 }, claimId: '' }, { sha256 }), /claim/i)
})
