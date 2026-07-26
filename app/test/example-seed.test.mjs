import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXAMPLE_SEED_KEY,
  migrateExampleSeed,
  seedBodySignature,
} from '../src/example-seed.mjs'
import { buildExampleBody } from '../src/example.js'

const oldBody = '<p>Alte eindeutige Fixture.</p>'
const newBody = '<p>Neue Fixture.</p>'

function seedFactory() {
  return {
    id: 'seed-new',
    title: 'Calm Technology',
    body: newBody,
    projectId: 'p-example',
    exampleSeed: true,
    exampleSeedKey: EXAMPLE_SEED_KEY,
    exampleSeedVersion: 9,
    exampleSeedSignature: seedBodySignature(newBody),
  }
}

test('version bump replaces only an untouched marked seed', () => {
  const projects = [{
    id: 'p-example',
    name: 'Eigener Projektname',
    material: [{ id: 'user-material', text: 'Behalten' }],
  }]
  const docs = [
    {
      id: 'seed-old',
      title: 'Calm Technology',
      body: oldBody,
      projectId: 'p-example',
      exampleSeed: true,
      exampleSeedKey: EXAMPLE_SEED_KEY,
      exampleSeedVersion: 8,
      exampleSeedSignature: seedBodySignature(oldBody),
    },
    { id: 'user-doc', title: 'Mein Text', body: '<p>Nutzertext</p>', projectId: 'p-example' },
  ]

  const result = migrateExampleSeed({
    docs,
    projects,
    settings: { exampleVersion: 8 },
    targetVersion: 9,
    legacyBody: oldBody,
    createProject: () => ({ id: 'p-example', name: 'Beispiel', material: [] }),
    createSeed: seedFactory,
  })

  assert.equal(result.changed, true)
  assert.deepEqual(docs.map(doc => doc.id), ['seed-new', 'user-doc'])
  assert.equal(docs.find(doc => doc.id === 'user-doc').body, '<p>Nutzertext</p>')
  assert.deepEqual(projects[0].material, [{ id: 'user-material', text: 'Behalten' }])
  assert.equal(projects[0].name, 'Eigener Projektname')
})

test('edited marked seed is preserved as user text and a fresh seed is added', () => {
  const projects = [{ id: 'p-example', material: [{ id: 'user-material' }] }]
  const docs = [{
    id: 'seed-edited',
    title: 'Calm Technology',
    body: '<p>Eigene Erweiterung im Seed.</p>',
    projectId: 'p-example',
    exampleSeed: true,
    exampleSeedKey: EXAMPLE_SEED_KEY,
    exampleSeedVersion: 8,
    exampleSeedSignature: seedBodySignature(oldBody),
  }]

  migrateExampleSeed({
    docs,
    projects,
    settings: { exampleVersion: 8 },
    targetVersion: 9,
    legacyBody: oldBody,
    createProject: () => ({ id: 'p-example' }),
    createSeed: seedFactory,
  })

  const edited = docs.find(doc => doc.id === 'seed-edited')
  assert.equal(edited.body, '<p>Eigene Erweiterung im Seed.</p>')
  assert.equal(Object.hasOwn(edited, 'exampleSeed'), false)
  assert.equal(docs.filter(doc => doc.exampleSeed === true).length, 1)
  assert.equal(docs.find(doc => doc.exampleSeed === true).id, 'seed-new')
  assert.deepEqual(projects[0].material, [{ id: 'user-material' }])
})

test('pristine legacy seed with an older, drifted body is replaced, not duplicated', () => {
  // Real-world regression (reproduced on live user data): a "Calm Technology"
  // doc created before the exampleSeed marker fields existed, whose body is an
  // OLDER shipped example version — here the pre-Onda one that still rendered
  // the title as an <h1>. It carries no exampleSeed* markers and the stored
  // exampleVersion is behind the target. It must be recognised as a pristine,
  // replaceable seed, so migration ends with exactly ONE example doc.
  const currentBody = buildExampleBody()
  const olderShippedBody = `<h1>Calm Technology</h1>${currentBody}`
  assert.notEqual(
    seedBodySignature(olderShippedBody),
    seedBodySignature(currentBody),
    'guard: the older body must genuinely differ from the current one',
  )

  const projects = [{ id: 'p-example', name: 'Beispiel', material: [] }]
  const docs = [
    { id: 'legacy-unmarked', title: 'Calm Technology', body: olderShippedBody, projectId: 'p-example' },
    { id: 'user-doc', title: 'Mein Text', body: '<p>Eigener Text</p>', projectId: 'p-other' },
  ]

  migrateExampleSeed({
    docs,
    projects,
    settings: { exampleVersion: 5 },
    targetVersion: 9,
    legacyBody: currentBody,
    createProject: () => ({ id: 'p-example', name: 'Beispiel', material: [] }),
    createSeed: () => ({
      id: 'seed-fresh',
      title: 'Calm Technology',
      body: currentBody,
      projectId: 'p-example',
      exampleSeed: true,
      exampleSeedKey: EXAMPLE_SEED_KEY,
      exampleSeedVersion: 9,
      exampleSeedSignature: seedBodySignature(currentBody),
    }),
  })

  const exampleDocs = docs.filter(doc => doc.projectId === 'p-example' && doc.title === 'Calm Technology')
  assert.equal(exampleDocs.length, 1)
  assert.equal(exampleDocs[0].body, currentBody)
  assert.equal(docs.find(doc => doc.id === 'user-doc').body, '<p>Eigener Text</p>')
})

test('legacy seed is recognized only by the exact fixture signature', () => {
  const projects = [{ id: 'p-example', material: [] }]
  const docs = [
    { id: 'legacy-exact', title: 'Calm Technology', body: oldBody, projectId: 'p-example' },
    { id: 'legacy-edited', title: 'Calm Technology', body: `${oldBody}<p>Eigene Notiz</p>`, projectId: 'p-example' },
  ]

  migrateExampleSeed({
    docs,
    projects,
    settings: { exampleVersion: 8 },
    targetVersion: 9,
    legacyBody: oldBody,
    createProject: () => ({ id: 'p-example' }),
    createSeed: seedFactory,
  })

  assert.equal(docs.some(doc => doc.id === 'legacy-exact'), false)
  assert.equal(docs.find(doc => doc.id === 'legacy-edited').body.endsWith('Eigene Notiz</p>'), true)
  assert.equal(docs.filter(doc => doc.exampleSeed === true).length, 1)
})
