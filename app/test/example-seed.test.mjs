import test from 'node:test'
import assert from 'node:assert/strict'
import {
  EXAMPLE_SEED_KEY,
  LEGACY_SEED_SIGNATURES,
  migrateExampleSeed,
  seedBodySignature,
} from '../src/example-seed.mjs'
import { buildExampleBody } from '../src/example.js'

const oldBody = '<p>Alte eindeutige Fixture.</p>'
const newBody = '<p>Neue Fixture.</p>'

// Der Beispieltext, den die App bis Beispielversion 9 ausgeliefert hat — wörtlich, so
// wie er in gespeicherten Daten steht. Absichtlich als Literal und nicht aus
// buildExampleBody() abgeleitet: Diese Prüfung soll gerade dann anschlagen, wenn der
// ausgelieferte Text sich ändert und seine Signatur nicht nachgetragen wurde.
const BODY_VERSION_9 = '<p>Calm Technology beschreibt Technik, die in der Peripherie bleibt und Aufmerksamkeit nur beansprucht, wenn sie wirklich gebraucht wird.</p>'
  + '<h2>Warum es wichtig ist</h2>'
  + '<p>Ständige Benachrichtigungen fragmentieren die Aufmerksamkeit und zerreißen den Denkfluss. Der eigentliche Schaden ist nicht die einzelne Meldung, sondern die Summe der kleinen Unterbrechungen über den Tag.</p>'
  + '<p>Weiser und Brown beschrieben schon 1996, wie Technik zwischen Zentrum und Peripherie der Aufmerksamkeit wechseln kann. Eine gute Statusanzeige informiert, ohne sich in den Vordergrund zu drängen.</p>'
  + '<h2>Was das fürs Schreiben heißt</h2>'
  + '<p>Für Schreibsoftware bedeutet das: Werkzeuge erscheinen im Kontext, Hinweise sammeln sich leise, nichts drängt sich in den Fluss.</p>'
  + '<p>Am Ende ist ruhige Technik keine Frage des Verzichts, sondern der Haltung: volle Kraft, leise Präsentation.</p>'

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

test('jede früher ausgelieferte Fassung bleibt als Beispiel erkennbar', () => {
  // Die Signaturliste ist die einzige Stelle, an der ein Beispieltext ohne Marker
  // wiedererkannt wird. Wer buildExampleBody() ändert, ohne die bisherige Signatur
  // nachzutragen, verliert genau die Fassung, die die meisten Nutzer gespeichert
  // haben — und bekommt beim nächsten Versionssprung zwei Beispiele statt einem.
  for (const [name, body] of [
    ['Fassung bis Beispielversion 9', BODY_VERSION_9],
    ['dieselbe Fassung mit <h1>-Titel', `<h1>Calm Technology</h1>${BODY_VERSION_9}`],
  ]) {
    assert.equal(
      LEGACY_SEED_SIGNATURES.has(seedBodySignature(body)),
      true,
      `${name} fehlt in LEGACY_SEED_SIGNATURES (Signatur ${seedBodySignature(body)})`,
    )
  }
  assert.equal(
    LEGACY_SEED_SIGNATURES.has(seedBodySignature(buildExampleBody())),
    false,
    'Die aktuelle Fassung gehört nicht in die Liste — sie kommt als legacyBody herein',
  )
})

test('pristine legacy seed with an older, drifted body is replaced, not duplicated', () => {
  // Real-world regression (reproduced on live user data): a "Calm Technology"
  // doc created before the exampleSeed marker fields existed, whose body is an
  // OLDER shipped example version — here the pre-Onda one that still rendered
  // the title as an <h1>. It carries no exampleSeed* markers and the stored
  // exampleVersion is behind the target. It must be recognised as a pristine,
  // replaceable seed, so migration ends with exactly ONE example doc.
  const currentBody = buildExampleBody()
  const olderShippedBody = `<h1>Calm Technology</h1>${BODY_VERSION_9}`
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
