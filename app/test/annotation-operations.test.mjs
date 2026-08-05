import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyAnnotationOperation,
  invertAnnotationOperation,
  planAnnotationOperation,
  validateAnnotationOperation,
} from '../src/annotation-operations.mjs'

function snapshot() {
  return {
    title: 'Alter Titel',
    blocks: [
      { id: 'a', type: 'paragraph', text: 'Der Fokus ist sehr gut.' },
      { id: 'b', type: 'paragraph', text: 'Der Fokus bleibt wichtig.' },
      { id: 'c', type: 'paragraph', text: 'Ein Schluss.' },
    ],
    sources: [],
  }
}

test('replace-range plant nur einen eindeutigen exakten Treffer', () => {
  const plan = planAnnotationOperation({
    id: 'f1', anmerkungsart: 'wortwahl', blockId: 'a', target: 'sehr gut', action: 'überzeugend',
  }, snapshot())
  assert.equal(plan.ok, true)
  assert.equal(plan.kind, 'replace-range')
  const applied = applyAnnotationOperation(snapshot(), plan)
  assert.equal(applied.blocks[0].text, 'Der Fokus ist überzeugend.')
})

test('replace-range scheitert bei demselben Ziel in mehreren Blöcken geschlossen', () => {
  const plan = planAnnotationOperation({
    id: 'f1', anmerkungsart: 'wortwahl', target: 'Fokus', action: 'Konzentration',
  }, snapshot())
  assert.deepEqual(plan, { ok: false, reason: 'ambiguous-target' })
})

test('insert-at ersetzt die verifizierte Ankerfassung durch die vollständige neue Fassung', () => {
  const plan = planAnnotationOperation({
    id: 'f2', anmerkungsart: 'uebergang', blockId: 'c', target: 'Ein Schluss.', action: 'Was folgt daraus? Ein Schluss.',
  }, snapshot())
  assert.equal(plan.ok, true)
  assert.equal(plan.kind, 'insert-at')
  assert.equal(applyAnnotationOperation(snapshot(), plan).blocks[2].text, 'Was folgt daraus? Ein Schluss.')
})

test('replace-title, move-block und insert-heading liefern umkehrbare Pläne', () => {
  const title = planAnnotationOperation({ id: 't', anmerkungsart: 'ueberschrift', target: 'Alter Titel', action: 'Neuer Titel' }, snapshot())
  assert.equal(applyAnnotationOperation(snapshot(), title).title, 'Neuer Titel')

  const move = planAnnotationOperation({
    id: 'm', anmerkungsart: 'verschieben', move: { fromBlockId: 'a', toBlockId: 'c', position: 'after' },
  }, snapshot())
  assert.deepEqual(applyAnnotationOperation(snapshot(), move).blocks.map(block => block.id), ['b', 'c', 'a'])

  const heading = planAnnotationOperation({
    id: 'h', anmerkungsart: 'gliederung', heading: { afterBlockId: 'a', id: 'h-neu', text: 'Was hilft', level: 2 },
  }, snapshot())
  assert.deepEqual(applyAnnotationOperation(snapshot(), heading).blocks.map(block => block.id), ['a', 'h-neu', 'b', 'c'])

  const restored = applyAnnotationOperation(applyAnnotationOperation(snapshot(), move), invertAnnotationOperation(move))
  assert.deepEqual(restored.blocks, snapshot().blocks)
})

test('replace-many ist atomar und attach-source erhält Herkunftsdaten', () => {
  const many = planAnnotationOperation({
    id: 'r',
    anmerkungsart: 'wiederholung',
    targets: [
      { blockId: 'a', text: 'Fokus', replacement: 'Konzentration' },
      { blockId: 'b', text: 'Fokus', replacement: 'Aufmerksamkeit' },
    ],
  }, snapshot())
  const changed = applyAnnotationOperation(snapshot(), many)
  assert.equal(changed.blocks[0].text, 'Der Konzentration ist sehr gut.')
  assert.equal(changed.blocks[1].text, 'Der Aufmerksamkeit bleibt wichtig.')

  const source = { label: 'Quelle', url: 'https://example.test', verificationStatus: 'fixture' }
  const attach = planAnnotationOperation({ id: 's', anmerkungsart: 'beleg', sources: [source] }, snapshot())
  assert.deepEqual(applyAnnotationOperation(snapshot(), attach).sources, [source])
})

test('Planvalidierung erkennt Drift und verändert weder Plan noch Snapshot', () => {
  const before = snapshot()
  const plan = planAnnotationOperation({
    id: 'f1', anmerkungsart: 'wortwahl', blockId: 'a', target: 'sehr gut', action: 'überzeugend',
  }, before)
  assert.equal(validateAnnotationOperation(plan, before).ok, true)
  const drift = snapshot()
  drift.blocks[0].text = 'Der Fokus ist bereits verändert.'
  assert.deepEqual(validateAnnotationOperation(plan, drift), { ok: false, reason: 'stale-target' })
  assert.equal(snapshot().blocks[0].text, 'Der Fokus ist sehr gut.')
})

test('fehlende Operation, Aktion, Quelle oder Zielstelle scheitern ohne Raten', () => {
  assert.deepEqual(planAnnotationOperation({ anmerkungsart: 'anmerkung' }, snapshot()), { ok: false, reason: 'no-operation' })
  assert.deepEqual(planAnnotationOperation({ anmerkungsart: 'wortwahl', target: 'sehr gut', blockId: 'a' }, snapshot()), { ok: false, reason: 'missing-replacement' })
  assert.deepEqual(planAnnotationOperation({ anmerkungsart: 'beleg', sources: [] }, snapshot()), { ok: false, reason: 'missing-source' })
  assert.deepEqual(planAnnotationOperation({ anmerkungsart: 'verschieben', move: { fromBlockId: 'a', toBlockId: 'x' } }, snapshot()), { ok: false, reason: 'missing-target-block' })
})
