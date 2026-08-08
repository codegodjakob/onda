// Das Netz unter Jakobs Texten.
//
// Onda biegt beim Laden jeden gespeicherten Stand auf die heutige Form zurecht. Geht
// dabei ein Feld verloren, ist ein Stück Arbeit weg — und zwar unwiederbringlich, denn
// der naechste Speichervorgang schreibt die zurechtgebogene Fassung zurueck.
//
// Diese Pruefung schiebt drei echte alte Staende (app/test/gespeicherte-staende/,
// dort steht in LIESMICH.md, woher jeder stammt) durch die vier Zurechtbiege-Funktionen,
// die als Modul importierbar sind, und weist FELD FUER FELD nach, dass nichts fehlt:
//
//   normalizeSettings        aus src/settings-model.mjs
//   ensureMemoryStore        aus src/memory-model.mjs
//   normalisiereLaufJournal  aus src/lauf-journal.mjs
//   migrateExampleSeed       aus src/example-seed.mjs
//
// Die zwei uebrigen Schritte des Ladewegs, ensureDocShape und ensureProjectShape, liegen
// heute noch lokal in src/editor.js und sind von hier aus nicht erreichbar. Der Rauchtest
// gespeicherter-stand-smoke.mjs deckt sie im echten Browser mit ab.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { normalizeSettings } from '../src/settings-model.mjs'
import { ensureMemoryStore } from '../src/memory-model.mjs'
import { normalisiereLaufJournal } from '../src/lauf-journal.mjs'
import { EXAMPLE_PROJECT_ID, migrateExampleSeed, seedBodySignature } from '../src/example-seed.mjs'

const STAENDE = ['stand-schema-08.json', 'stand-schema-10.json', 'stand-schema-12.json']

function ladeStand(datei) {
  const pfad = fileURLToPath(new URL(`./gespeicherte-staende/${datei}`, import.meta.url))
  return JSON.parse(readFileSync(pfad, 'utf8'))
}

// Laeuft das Original Blatt fuer Blatt ab und prueft, dass jeder Pfad im Ergebnis
// wieder auftaucht — mit demselben Wert, ausser wo eine Reparatur ausdruecklich
// erlaubt ist. Genau so faellt ein stillschweigend fallengelassenes Feld auf.
function jedesFeldUeberlebt(original, ergebnis, { erlaubteReparaturen = [], pfad = '' } = {}) {
  if (original === null || typeof original !== 'object') {
    if (erlaubteReparaturen.includes(pfad)) return
    assert.deepEqual(ergebnis, original, `Feld ${pfad || '(Wurzel)'} hat den Ladeweg nicht ueberlebt`)
    return
  }
  if (Array.isArray(original)) {
    assert.ok(Array.isArray(ergebnis), `Liste ${pfad} ist keine Liste mehr`)
    assert.equal(ergebnis.length, original.length, `Liste ${pfad} hat Eintraege verloren`)
    original.forEach((wert, index) => {
      jedesFeldUeberlebt(wert, ergebnis[index], { erlaubteReparaturen, pfad: `${pfad}[${index}]` })
    })
    return
  }
  assert.ok(ergebnis && typeof ergebnis === 'object', `Objekt ${pfad} ist verschwunden`)
  for (const schluessel of Object.keys(original)) {
    const unterpfad = pfad ? `${pfad}.${schluessel}` : schluessel
    assert.ok(schluessel in ergebnis, `Feld ${unterpfad} fehlt nach dem Ladeweg`)
    jedesFeldUeberlebt(original[schluessel], ergebnis[schluessel], { erlaubteReparaturen, pfad: unterpfad })
  }
}

// ---------- Die Staende sind ueberhaupt da ----------

test('drei gespeicherte Staende liegen als Pruefstuecke bereit: Schema 8, 10 und 12', () => {
  const nummern = STAENDE.map(datei => ladeStand(datei).schemaVersion)
  assert.deepEqual(nummern, [8, 10, 12])
})

// ---------- normalizeSettings ----------

test('stand-schema-08.json: die Einstellungen ueberleben, Kaputtes wird repariert', () => {
  const stand = ladeStand('stand-schema-08.json')
  const settings = normalizeSettings(stand.settings, '2026-08')

  // structWidth und accent sind in diesem Stand absichtlich unmoeglich — sie duerfen,
  // und nur sie, unterwegs einen anderen Wert bekommen.
  jedesFeldUeberlebt(stand.settings, settings, { erlaubteReparaturen: ['structWidth', 'accent'] })

  assert.equal(settings.theme, 'dark')
  assert.equal(settings.spellcheck, true)
  assert.equal(settings.showWords, false)
  assert.equal(settings.structWidth, 940, 'die unmoegliche Spaltenbreite wird auf das Maximum gezogen')
  assert.equal(settings.accent, 'sky', 'der unbekannte Farbton faellt auf den Standard zurueck')
  // Die Kostenbremse gab es zu Schema 8 noch nicht: wer nie etwas gesetzt hat,
  // bekommt eine — nicht die geloeste Bremse.
  assert.equal(settings.kiMonatsbudgetCents, 1000)
  assert.equal(settings.usage.monat, '2026-08')
  assert.equal(settings.usage.kostenCents, 0)
})

test('stand-schema-10.json: die Einstellungen ueberleben unveraendert', () => {
  const stand = ladeStand('stand-schema-10.json')
  const settings = normalizeSettings(stand.settings, '2026-08')

  jedesFeldUeberlebt(stand.settings, settings)

  assert.equal(settings.theme, 'light')
  assert.equal(settings.accent, 'clay')
  assert.equal(settings.structWidth, 620)
  assert.equal(settings.sidebarCollapsed, true)
  assert.equal(settings.exampleVersion, 9, 'die Beispielversion ist der Ausloeser der naechsten Migration und darf nicht verschwinden')
})

test('stand-schema-12.json: die gesetzten Einstellungen ueberleben unveraendert', () => {
  const stand = ladeStand('stand-schema-12.json')
  const settings = normalizeSettings(stand.settings, stand.settings.usage.monat)

  jedesFeldUeberlebt(stand.settings, settings)

  assert.equal(settings.accent, 'sage')
  assert.equal(settings.structWidth, 700)
  assert.equal(settings.kiMonatsbudgetCents, stand.settings.kiMonatsbudgetCents)
})

test('eine ausdruecklich geloeste Kostenbremse bleibt ueber alle drei Staende hinweg geloest', () => {
  for (const datei of STAENDE) {
    const stand = ladeStand(datei)
    const settings = normalizeSettings({ ...stand.settings, kiMonatsbudgetCents: null }, '2026-08')
    assert.equal(settings.kiMonatsbudgetCents, null, `${datei}: die abgeschaltete Bremse kam beim Laden zurueck`)
  }
})

// ---------- ensureMemoryStore ----------

test('stand-schema-08.json: der fehlende Gedaechtnisspeicher entsteht leer, nicht kaputt', () => {
  const stand = ladeStand('stand-schema-08.json')
  assert.equal(stand.memoryStore, undefined, 'Schema 8 hatte noch keinen Gedaechtnisspeicher')

  const store = ensureMemoryStore(stand.memoryStore)
  assert.equal(store.schemaVersion, 1)
  for (const liste of ['events', 'entries', 'transfers', 'consents', 'voiceProposals']) {
    assert.deepEqual(store[liste], [], `${liste} fehlt oder ist nicht leer`)
  }
})

test('stand-schema-10.json: jedes Gedaechtnis-Ereignis und jeder Eintrag ueberlebt', () => {
  const stand = ladeStand('stand-schema-10.json')
  const store = ensureMemoryStore(structuredClone(stand.memoryStore))

  jedesFeldUeberlebt(stand.memoryStore, store)

  assert.deepEqual(store.events.map(e => e.id), ['ev-zehn-1'])
  assert.deepEqual(store.entries.map(e => e.id), ['me-zehn-1'])
  assert.deepEqual(store.consents.map(c => c.id), ['cons-zehn-1'])
  assert.equal(store.entries[0].content, 'Kurze Saetze bevorzugt.')
  // Die spaeter dazugekommenen Listen entstehen leer und ueberschreiben nichts.
  assert.deepEqual(store.transfers, [])
  assert.deepEqual(store.voiceProposals, [])
})

test('stand-schema-12.json: der vollstaendige Gedaechtnisspeicher ueberlebt Feld fuer Feld', () => {
  const stand = ladeStand('stand-schema-12.json')
  const store = ensureMemoryStore(structuredClone(stand.memoryStore))
  jedesFeldUeberlebt(stand.memoryStore, store)
})

// ---------- normalisiereLaufJournal ----------

test('stand-schema-08.json und stand-schema-10.json: das fehlende Lauf-Journal entsteht leer', () => {
  for (const datei of ['stand-schema-08.json', 'stand-schema-10.json']) {
    const stand = ladeStand(datei)
    assert.equal(stand.laufJournal, undefined, `${datei} hatte noch kein Lauf-Journal`)
    const journal = normalisiereLaufJournal(stand.laufJournal)
    assert.deepEqual(journal, { eintraege: [], monate: [], gezeigt: [] })
  }
})

test('stand-schema-12.json: das Lauf-Journal ueberlebt mit allen 29 gezeigten Anmerkungen', () => {
  const stand = ladeStand('stand-schema-12.json')
  const journal = normalisiereLaufJournal(structuredClone(stand.laufJournal))

  jedesFeldUeberlebt(stand.laufJournal, journal)

  assert.equal(journal.gezeigt.length, stand.laufJournal.gezeigt.length)
  assert.ok(journal.gezeigt.length >= 29, 'der Stand soll gerade den vollen Satz gezeigter Anmerkungen tragen')
  assert.deepEqual(
    journal.gezeigt.map(g => g.findingId),
    stand.laufJournal.gezeigt.map(g => g.findingId),
  )
})

// ---------- migrateExampleSeed ----------

test('stand-schema-08.json: ohne Beispielprojekt entsteht eines — und kein eigener Text geht dabei verloren', () => {
  const stand = ladeStand('stand-schema-08.json')
  const docs = structuredClone(stand.docs)
  const projects = structuredClone(stand.projects)
  const settings = normalizeSettings(stand.settings, '2026-08')

  migrateExampleSeed({
    docs,
    projects,
    settings,
    targetVersion: 10,
    legacyBody: '<p>irgendein aktueller Beispieltext</p>',
    createProject: () => ({ id: EXAMPLE_PROJECT_ID, name: 'Beispiel: Calm Technology', example: true }),
    createSeed: () => ({ id: 'neue-saat', title: 'Calm Technology', body: '<p>irgendein aktueller Beispieltext</p>' }),
  })

  for (const original of stand.docs) {
    const danach = docs.find(d => d.id === original.id)
    assert.ok(danach, `der eigene Text ${original.id} ist beim Beispiel-Schritt verschwunden`)
    assert.equal(danach.body, original.body, `der Wortlaut von ${original.id} wurde veraendert`)
    assert.equal(danach.title, original.title)
  }
  assert.ok(projects.some(p => p.id === 'p-uni'), 'das eigene Projekt ist verschwunden')
  assert.ok(projects.some(p => p.id === EXAMPLE_PROJECT_ID), 'das Beispielprojekt wurde nicht angelegt')
})

test('stand-schema-10.json: der alte Beispieltext wird wiedererkannt und ersetzt, statt sich zu verdoppeln', () => {
  const stand = ladeStand('stand-schema-10.json')
  const docs = structuredClone(stand.docs)
  const projects = structuredClone(stand.projects)
  const settings = normalizeSettings(stand.settings, '2026-08')
  const neuerText = '<p>Beispieltext in Version 10.</p>'

  migrateExampleSeed({
    docs,
    projects,
    settings,
    targetVersion: 10,
    legacyBody: neuerText,
    createProject: () => ({ id: EXAMPLE_PROJECT_ID, name: 'Beispiel: Calm Technology', example: true }),
    createSeed: () => ({ id: 'saat-v10', title: 'Calm Technology', body: neuerText }),
  })

  const beispiele = docs.filter(d => d.title === 'Calm Technology')
  assert.equal(beispiele.length, 1, 'der alte Beispieltext wurde nicht wiedererkannt — es liegen jetzt zwei da')
  assert.equal(beispiele[0].body, neuerText)
  assert.equal(beispiele[0].exampleSeedSignature, seedBodySignature(neuerText))

  // Der eigene Essay bleibt unangetastet — auch seine Anmerkung ohne kind-Feld.
  const essay = docs.find(d => d.id === 'd-zehn-essay')
  const essayVorher = stand.docs.find(d => d.id === 'd-zehn-essay')
  assert.ok(essay, 'der eigene Essay ist verschwunden')
  jedesFeldUeberlebt(essayVorher, essay)
  assert.equal(settings.exampleVersion, 10, 'die Beispielversion wurde nicht nachgezogen')
})

test('stand-schema-12.json: ein angefasster Beispieltext wird nicht ueberschrieben', () => {
  const stand = ladeStand('stand-schema-12.json')
  const docs = structuredClone(stand.docs)
  const projects = structuredClone(stand.projects)
  const settings = normalizeSettings(stand.settings, stand.settings.usage.monat)

  // Jakob schreibt im Beispieltext weiter — die Signatur passt danach nicht mehr.
  const beispiel = docs.find(d => d.exampleSeed === true)
  assert.ok(beispiel, 'der Stand traegt keinen markierten Beispieltext')
  const eigenerSatz = beispiel.body + '<p>Mein eigener Zusatz, der bleiben muss.</p>'
  beispiel.body = eigenerSatz

  migrateExampleSeed({
    docs,
    projects,
    settings,
    targetVersion: 11,
    legacyBody: '<p>Beispieltext in Version 11.</p>',
    createProject: () => ({ id: EXAMPLE_PROJECT_ID, name: 'Beispiel: Calm Technology', example: true }),
    createSeed: () => ({ id: 'saat-v11', title: 'Calm Technology', body: '<p>Beispieltext in Version 11.</p>' }),
  })

  const danach = docs.find(d => d.id === beispiel.id)
  assert.ok(danach, 'der angefasste Beispieltext wurde weggeworfen')
  assert.equal(danach.body, eigenerSatz, 'der eigene Zusatz wurde ueberschrieben')
  assert.notEqual(danach.exampleSeed, true, 'der angefasste Text traegt weiterhin die Saat-Markierung und waere beim naechsten Sprung faellig')
})

test('alle drei Staende: jeder Text und jedes Projekt ist nach allen vier Schritten noch da', () => {
  for (const datei of STAENDE) {
    const stand = ladeStand(datei)
    const docs = structuredClone(stand.docs)
    const projects = structuredClone(stand.projects)
    const settings = normalizeSettings(stand.settings, '2026-08')
    ensureMemoryStore(structuredClone(stand.memoryStore ?? null))
    normalisiereLaufJournal(structuredClone(stand.laufJournal ?? null))
    migrateExampleSeed({
      docs,
      projects,
      settings,
      targetVersion: settings.exampleVersion || 10,
      legacyBody: '<p>aktueller Beispieltext</p>',
      createProject: () => ({ id: EXAMPLE_PROJECT_ID, name: 'Beispiel: Calm Technology', example: true }),
      createSeed: () => ({ id: `saat-${datei}`, title: 'Calm Technology', body: '<p>aktueller Beispieltext</p>' }),
    })

    // Beispieltexte duerfen ersetzt werden — alles andere nicht.
    const eigene = stand.docs.filter(d => d.title !== 'Calm Technology')
    for (const original of eigene) {
      const danach = docs.find(d => d.id === original.id)
      assert.ok(danach, `${datei}: der Text ${original.id} ist verschwunden`)
      assert.equal(danach.body, original.body, `${datei}: der Wortlaut von ${original.id} hat sich geaendert`)
    }
    for (const original of stand.projects) {
      assert.ok(projects.some(p => p.id === original.id), `${datei}: das Projekt ${original.id} ist verschwunden`)
    }
  }
})
