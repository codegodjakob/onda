// Das Netz unter Jakobs Texten.
//
// Onda biegt beim Laden jeden gespeicherten Stand auf die heutige Form zurecht. Geht
// dabei ein Feld verloren, ist ein Stück Arbeit weg — und zwar unwiederbringlich, denn
// der naechste Speichervorgang schreibt die zurechtgebogene Fassung zurueck.
//
// Diese Pruefung schiebt drei echte alte Staende (app/test/gespeicherte-staende/,
// dort steht in LIESMICH.md, woher jeder stammt) durch ALLE SECHS Zurechtbiege-Funktionen
// des Ladewegs und weist FELD FUER FELD nach, dass nichts fehlt:
//
//   normalizeSettings        aus src/settings-model.mjs
//   ensureMemoryStore        aus src/memory-model.mjs
//   normalisiereLaufJournal  aus src/lauf-journal.mjs
//   ensureProjectShape       aus src/editor.js
//   ensureDocShape           aus src/editor.js
//   migrateExampleSeed       aus src/example-seed.mjs
//
// Das ist auch die Reihenfolge, in der src/editor.js sie beim Laden abarbeitet.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { normalizeSettings } from '../src/settings-model.mjs'
import { ensureMemoryStore } from '../src/memory-model.mjs'
import { normalisiereLaufJournal } from '../src/lauf-journal.mjs'
import { EXAMPLE_PROJECT_ID, migrateExampleSeed, seedBodySignature } from '../src/example-seed.mjs'

// ensureDocShape und ensureProjectShape liegen in src/editor.js — der Datei, die auch
// den Tiptap-Editor aufbaut. Damit sie sich hier ueberhaupt laden laesst, braucht Node
// eine handbreite Attrappe von `window` und `document`. Die Attrappe tut nichts; sie
// existiert nur, damit die Bibliotheken beim Import nicht ins Leere greifen. Deshalb
// steht der Import als `await import(...)` HINTER der Attrappe und nicht oben bei den
// anderen — die stehenden `import`-Zeilen laufen sonst zuerst.
function attrappenElement() {
  return {
    style: {}, dataset: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false } },
    appendChild() {}, setAttribute() {}, addEventListener() {},
    querySelector() { return null }, querySelectorAll() { return [] },
  }
}
globalThis.document = {
  documentElement: attrappenElement(), body: attrappenElement(), head: attrappenElement(),
  addEventListener() {}, removeEventListener() {},
  querySelector() { return null }, querySelectorAll() { return [] },
  getElementById() { return null },
  createElement() { return attrappenElement() }, createTextNode() { return {} },
}
globalThis.window = {
  webkit: undefined, addEventListener() {}, removeEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
  document: globalThis.document,
  navigator: { userAgent: 'node', platform: 'node' },
  getSelection() { return null },
}
globalThis.localStorage = { getItem() { return null }, setItem() {} }

const { ensureDocShape, ensureProjectShape } = await import('../src/editor.js')

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

// ---------- ensureProjectShape ----------

test('stand-schema-08.json: ein Projekt aus der Zeit vor den Quellen bekommt die fehlenden Faecher — und behaelt sein Material', () => {
  const stand = ladeStand('stand-schema-08.json')
  const projekt = ensureProjectShape(structuredClone(stand.projects[0]))

  jedesFeldUeberlebt(stand.projects[0], projekt)

  assert.equal(projekt.id, 'p-uni')
  assert.ok(Array.isArray(projekt.material) && projekt.material.length === stand.projects[0].material.length,
    'das Material des Projekts hat den Ladeweg nicht ueberlebt')
  // Die Faecher, die es zu Schema 8 noch nicht gab, entstehen leer statt zu fehlen.
  for (const fach of ['sources', 'quellenThemen', 'researchRuns', 'languageReports', 'finalAudits']) {
    assert.ok(fach in projekt, `das Fach ${fach} fehlt nach ensureProjectShape`)
  }
})

test('stand-schema-10.json und stand-schema-12.json: jedes Projekt ueberlebt ensureProjectShape Feld fuer Feld', () => {
  for (const datei of ['stand-schema-10.json', 'stand-schema-12.json']) {
    const stand = ladeStand(datei)
    stand.projects.forEach(original => {
      const projekt = ensureProjectShape(structuredClone(original))
      jedesFeldUeberlebt(original, projekt, { pfad: `${datei}:${original.id}` })
    })
  }
})

test('ensureProjectShape laeuft zweimal hintereinander zum selben Ergebnis — es ist Selbstheilung, keine Einbahn-Umstellung', () => {
  const stand = ladeStand('stand-schema-08.json')
  const einmal = ensureProjectShape(structuredClone(stand.projects[0]))
  const zweimal = ensureProjectShape(structuredClone(einmal))
  assert.deepEqual(zweimal, einmal, 'ein zweiter Durchlauf hat das Projekt veraendert')
})

// ---------- ensureDocShape ----------

test('stand-schema-08.json: ein Text ohne Anmerkungsfaecher bekommt sie leer — und behaelt seinen Wortlaut', () => {
  const stand = ladeStand('stand-schema-08.json')
  const ohneFaecher = stand.docs.find(d => d.id === 'd-alt-notizen')
  assert.equal(ohneFaecher.coach, undefined, 'der Stand soll gerade einen Text ohne Coach-Karten tragen')

  const text = ensureDocShape(structuredClone(ohneFaecher))

  jedesFeldUeberlebt(ohneFaecher, text)
  assert.equal(text.body, ohneFaecher.body, 'der Wortlaut wurde veraendert')
  assert.deepEqual(text.coach, [])
  assert.deepEqual(text.lane, [])
  assert.equal(text.provenance.actor, 'user', 'die fehlende Herkunft entsteht als Nutzer-Herkunft')
  assert.equal(text.provenance.createdAt, ohneFaecher.updated, 'die erfundene Herkunftszeit nimmt den letzten Stand des Textes')
})

test('stand-schema-10.json: eine Anmerkung ohne Art wird zur Formulierung, und keine Anmerkung geht verloren', () => {
  const stand = ladeStand('stand-schema-10.json')
  const original = stand.docs.find(d => d.id === 'd-zehn-essay')
  const ohneArt = original.lane.filter(c => !c.kind)
  assert.ok(ohneArt.length >= 1, 'der Stand soll gerade eine Anmerkung ohne Art tragen')

  const text = ensureDocShape(structuredClone(original))

  jedesFeldUeberlebt(original, text)
  assert.equal(text.lane.length, original.lane.length, 'es sind Anmerkungen verschwunden')
  text.lane.forEach(c => assert.ok(c.kind, 'eine Anmerkung ist ohne Art geblieben'))
  ohneArt.forEach(alt => {
    const jetzt = text.lane.find(c => c.id === alt.id)
    assert.equal(jetzt.kind, 'form', 'die Anmerkung ohne Art wurde nicht zur Formulierung')
  })
})

test('stand-schema-12.json: jeder Text ueberlebt ensureDocShape Feld fuer Feld', () => {
  const stand = ladeStand('stand-schema-12.json')
  stand.docs.forEach(original => {
    const text = ensureDocShape(structuredClone(original))
    jedesFeldUeberlebt(original, text, { pfad: `d-12:${original.id}` })
  })
})

test('ensureDocShape laeuft zweimal hintereinander zum selben Ergebnis', () => {
  const stand = ladeStand('stand-schema-08.json')
  const einmal = ensureDocShape(structuredClone(stand.docs[0]))
  const zweimal = ensureDocShape(structuredClone(einmal))
  assert.deepEqual(zweimal, einmal, 'ein zweiter Durchlauf hat den Text veraendert')
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

// ---------- alle sechs Schritte hintereinander, in der Reihenfolge des Ladewegs ----------

test('alle drei Staende: jeder Text und jedes Projekt ist nach allen SECHS Schritten noch da', () => {
  for (const datei of STAENDE) {
    const stand = ladeStand(datei)
    const docs = structuredClone(stand.docs)
    const projects = structuredClone(stand.projects)
    // 1. normalizeSettings, 2. ensureMemoryStore, 3. normalisiereLaufJournal
    const settings = normalizeSettings(stand.settings, '2026-08')
    ensureMemoryStore(structuredClone(stand.memoryStore ?? null))
    normalisiereLaufJournal(structuredClone(stand.laufJournal ?? null))
    // 4. ensureProjectShape, 5. ensureDocShape — in genau dieser Reihenfolge, weil
    // Texte an Projekten haengen.
    projects.forEach(ensureProjectShape)
    docs.forEach(ensureDocShape)
    // 6. migrateExampleSeed
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
