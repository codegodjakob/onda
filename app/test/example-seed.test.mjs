import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXAMPLE_SEED_KEY,
  migrateExampleSeed,
  seedBodySignature,
} from '../src/example-seed.mjs'

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
