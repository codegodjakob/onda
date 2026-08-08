import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PROMPT_GRENZE,
  REGAL_DECKEL,
  erkanntesFuerPrompt,
  erkanntesListe,
  schluesselFuer,
  schreibeErkanntes,
  ueberholeErkanntes,
} from '../src/erkanntes-model.mjs'
import { ensureMemoryStore } from '../src/memory-model.mjs'

const SATZ = 'Wo zwei Groessen verglichen werden, traegt der Vergleich das Argument.'

function frisch() {
  return ensureMemoryStore(null)
}

// ---- Der erste Ort, der einem Menschen gehoert -------------------------------

test('ein Prinzip wird auf der persoenlichen Ebene ueber ALLE Projekte gespeichert', () => {
  const { store, eintrag } = schreibeErkanntes(frisch(), { satz: SATZ, at: 1000 })
  assert.equal(eintrag.level, 'personal')
  assert.equal(eintrag.scope.allProjects, true)
  assert.equal(eintrag.type, 'prinzip')
  assert.equal(eintrag.content, SATZ)
  // Es stirbt nicht mit dem Text, in dem es aufkam -- genau darin liegt sein Wert.
  assert.equal(eintrag.deletionRule, 'manual')
  assert.equal(erkanntesListe(store).length, 1)
})

test('ein leerer Satz wird nicht gespeichert', () => {
  const { eintrag, grund } = schreibeErkanntes(frisch(), { satz: '   ', at: 1 })
  assert.equal(eintrag, null)
  assert.equal(grund, 'leer')
})

// ---- Haeufigkeit ohne Zaehler ------------------------------------------------

test('derselbe Satz zweimal ergibt EINEN Eintrag mit zwei Treffern', () => {
  let store = frisch()
  store = schreibeErkanntes(store, { satz: SATZ, at: 1 }).store
  store = schreibeErkanntes(store, { satz: SATZ, at: 2 }).store
  const liste = erkanntesListe(store)
  assert.equal(liste.length, 1)
  assert.equal(liste[0].treffer, 2)
  assert.equal(liste[0].zuletzt, 2)
  // Beide Begegnungen bleiben einzeln erhalten -- ein Zaehler haette die Herkunft
  // der zweiten verschluckt.
  assert.equal(liste[0].ids.length, 2)
})

test('Gross-/Kleinschreibung und Satzzeichen machen keinen neuen Satz', () => {
  let store = frisch()
  store = schreibeErkanntes(store, { satz: 'Kuerze schlaegt Fuelle.', at: 1 }).store
  store = schreibeErkanntes(store, { satz: 'kuerze schlaegt fuelle', at: 2 }).store
  assert.equal(erkanntesListe(store).length, 1)
})

test('zwei verschiedene Saetze bleiben zwei', () => {
  let store = frisch()
  store = schreibeErkanntes(store, { satz: 'Kuerze schlaegt Fuelle.', at: 1 }).store
  store = schreibeErkanntes(store, { satz: 'Ein Beleg gehoert an die Behauptung.', at: 2 }).store
  assert.equal(erkanntesListe(store).length, 2)
})

test('schluesselFuer bleibt bewusst stumpf -- keine unscharfe Aehnlichkeit', () => {
  // Zwei verschiedene Einsichten duerfen NICHT verschmelzen, nur weil sie sich
  // aehneln. Der Schaden einer falschen Verschmelzung ist groesser als der Nutzen.
  assert.notEqual(schluesselFuer('Kuerze schlaegt Fuelle'), schluesselFuer('Kuerze schlaegt Laenge'))
  assert.equal(schluesselFuer('  Kuerze,  schlaegt Fuelle! '), schluesselFuer('kuerze schlaegt fuelle'))
})

// ---- Ruecknahme: das groesste Risiko dieses Umbaus ---------------------------

test('ein ueberholter Satz verschwindet aus Liste UND Prompt', () => {
  let store = frisch()
  store = schreibeErkanntes(store, { satz: SATZ, at: 1 }).store
  const { store: danach, getroffen } = ueberholeErkanntes(store, SATZ, 9)
  assert.equal(getroffen, 1)
  assert.deepEqual(erkanntesListe(danach), [])
  assert.deepEqual(erkanntesFuerPrompt(danach), [])
})

test('Ueberholen erwischt ALLE Begegnungen desselben Satzes, nicht nur eine', () => {
  // Sonst waere ein falscher Satz nach dem Zuruecknehmen immer noch da -- und
  // wiederholte sich in jedem kuenftigen Text.
  let store = frisch()
  store = schreibeErkanntes(store, { satz: SATZ, at: 1 }).store
  store = schreibeErkanntes(store, { satz: SATZ, at: 2 }).store
  store = schreibeErkanntes(store, { satz: SATZ, at: 3 }).store
  const { getroffen, store: danach } = ueberholeErkanntes(store, SATZ, 9)
  assert.equal(getroffen, 3)
  assert.deepEqual(erkanntesListe(danach), [])
})

test('Ueberholtes bleibt gespeichert, nur nicht mehr aktiv', () => {
  let store = frisch()
  store = schreibeErkanntes(store, { satz: SATZ, at: 1 }).store
  const { store: danach } = ueberholeErkanntes(store, SATZ, 9)
  assert.equal(danach.entries.length, 1)
  assert.equal(danach.entries[0].status, 'superseded')
  assert.equal(danach.entries[0].supersededAt, 9)
})

test('Ueberholen eines unbekannten Satzes tut nichts und wirft nicht', () => {
  const { getroffen } = ueberholeErkanntes(frisch(), 'gibt es nicht', 9)
  assert.equal(getroffen, 0)
})

// ---- Die Auswahlregel fuer den Prompt ----------------------------------------

test('was am haeufigsten wiederkam, steht oben -- genau das droht wieder gesagt zu werden', () => {
  let store = frisch()
  store = schreibeErkanntes(store, { satz: 'Einmal gesehen.', at: 1 }).store
  store = schreibeErkanntes(store, { satz: 'Dreimal gesehen.', at: 2 }).store
  store = schreibeErkanntes(store, { satz: 'Dreimal gesehen.', at: 3 }).store
  store = schreibeErkanntes(store, { satz: 'Dreimal gesehen.', at: 4 }).store
  const fuerPrompt = erkanntesFuerPrompt(store)
  assert.match(fuerPrompt[0], /Dreimal gesehen/)
  assert.match(fuerPrompt[0], /3×/)
  assert.equal(fuerPrompt[1], 'Einmal gesehen.')
})

test('die Obergrenze greift, damit keine Anfrage unbegrenzt waechst', () => {
  let store = frisch()
  for (let i = 0; i < PROMPT_GRENZE + 12; i += 1) {
    store = schreibeErkanntes(store, { satz: `Prinzip Nummer ${i}.`, at: i + 1 }).store
  }
  assert.equal(erkanntesListe(store).length, PROMPT_GRENZE + 12)
  assert.equal(erkanntesFuerPrompt(store).length, PROMPT_GRENZE)
})

test('ein leerer Speicher ergibt einen leeren Prompt-Block, keinen leeren Satz', () => {
  assert.deepEqual(erkanntesFuerPrompt(frisch()), [])
})

// ---- Der Abfluss: Deckel und Verdraengung statt einer Halde --------------------

test('der Deckel verdraengt die aeltesten Einzelgaenger, wenn er ueberschritten wird', () => {
  let store = frisch()
  const N = REGAL_DECKEL + 5
  for (let i = 0; i < N; i += 1) {
    store = schreibeErkanntes(store, { satz: `Prinzip Nummer ${i}.`, at: i + 1 }).store
  }
  // Genau REGAL_DECKEL Saetze bleiben aktiv -- keine Halde.
  assert.equal(erkanntesListe(store).length, REGAL_DECKEL)
  // Die fuenf aeltesten (zuerst geschriebenen) sind verdraengt, nicht geloescht.
  for (let i = 0; i < 5; i += 1) {
    const schluessel = schluesselFuer(`Prinzip Nummer ${i}.`)
    const eintrag = store.entries.find(kandidat => schluesselFuer(kandidat.content) === schluessel)
    assert.equal(eintrag.status, 'superseded')
    assert.equal(typeof eintrag.supersededAt, 'number')
  }
  // Die juengsten REGAL_DECKEL sind noch aktiv.
  for (let i = 5; i < N; i += 1) {
    const schluessel = schluesselFuer(`Prinzip Nummer ${i}.`)
    const eintrag = store.entries.find(kandidat => schluesselFuer(kandidat.content) === schluessel)
    assert.equal(eintrag.status, 'active')
  }
})

test('ein wiederkehrender Satz (treffer=3) wird nie von einem Einmal-Satz verdraengt', () => {
  let store = frisch()
  // Das Regal randvoll mit lauter Einzelgaengern.
  for (let i = 0; i < REGAL_DECKEL; i += 1) {
    store = schreibeErkanntes(store, { satz: `Prinzip Nummer ${i}.`, at: i + 1 }).store
  }
  // Satz 0 kommt noch zweimal wieder -- treffer=3.
  store = schreibeErkanntes(store, { satz: 'Prinzip Nummer 0.', at: 1000 }).store
  store = schreibeErkanntes(store, { satz: 'Prinzip Nummer 0.', at: 1001 }).store
  // Ein brandneuer Einmal-Satz quillt das Regal ueber den Deckel.
  store = schreibeErkanntes(store, { satz: 'Ganz neu.', at: 2000 }).store

  const liste = erkanntesListe(store)
  assert.equal(liste.length, REGAL_DECKEL)
  const wiederkehrer = liste.find(gruppe => gruppe.schluessel === schluesselFuer('Prinzip Nummer 0.'))
  assert.ok(wiederkehrer, 'der dreifach getroffene Satz bleibt aktiv')
  assert.equal(wiederkehrer.treffer, 3)
})

test('erneutes Merken eines ueberholten Satzes belebt ihn wieder, mit frischem treffer', () => {
  // Bestehendes Verhalten von schreibeErkanntes, hier nur festgehalten: eine neue
  // Begegnung ist immer ein neuer aktiver Eintrag, auch wenn der Schluessel schon
  // als 'superseded' im Speicher steht. Die alten Begegnungen bleiben liegen und
  // zaehlen nicht mehr mit -- Historie, keine Loeschung.
  let store = frisch()
  store = schreibeErkanntes(store, { satz: SATZ, at: 1 }).store
  store = schreibeErkanntes(store, { satz: SATZ, at: 2 }).store
  store = ueberholeErkanntes(store, SATZ, 9).store
  assert.deepEqual(erkanntesListe(store), [])

  store = schreibeErkanntes(store, { satz: SATZ, at: 10 }).store
  const liste = erkanntesListe(store)
  assert.equal(liste.length, 1)
  assert.equal(liste[0].treffer, 1)
  const alte = store.entries.filter(eintrag => eintrag.status === 'superseded')
  assert.equal(alte.length, 2)
})

test('fremde Gedaechtniseintraege werden nicht mitgezaehlt', () => {
  const store = frisch()
  store.entries.push({
    id: 'fremd', level: 'project', type: 'notiz', content: 'irgendwas',
    scope: { projectIds: ['p1'] }, provenance: { actor: 'user', action: 'x', originEventIds: [] },
    sensitivity: 'standard', deletionRule: 'with-project', createdAt: 1, status: 'active',
  })
  assert.deepEqual(erkanntesListe(store), [])
})
