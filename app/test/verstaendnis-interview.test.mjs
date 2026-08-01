import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  interviewNachrichtId,
  istFremdeInterviewNachricht,
  planeInterviewNachricht,
  projektZumDokument,
} from '../src/verstaendnis-interview.mjs'

// Hintergrund: state.activeProject ist der BROWSE-Zeiger der Projektuebersicht,
// state.active das GELADENE Dokument. Beide duerfen auseinanderlaufen — die App
// startet immer in der Projektuebersicht, und ein Projektwechsel dort laesst das
// geladene Dokument stehen. Wer ein Dokument mit einem Projekt paart, muss deshalb
// ueber doc.projectId aufloesen; sonst landet der Zustand von Projekt A am Dokument
// von Projekt B (beobachtet: 'interview-p-default' im Beispiel-Dokument, frischer
// Start, ohne jede Nutzerinteraktion).
//
// Dieses Modul nimmt den Startseiten-Zeiger DESHALB GAR NICHT ERST ENTGEGEN — die
// Verwechslung ist hier nicht mehr ausdrueckbar.

// Strukturprüfung (Vorbild: assertReachableSurfaceIsV2Only im Smoke). Der Fehler wurde
// ZWEIMAL unabhängig eingebaut — zuletzt vom Randkarten-Chat (sendeLocalChat). workspace.js
// ist durchweg editor-gebunden; dort ist der Startseiten-Zeiger IMMER die falsche Quelle.
// Die Startseite selbst (ui.js) darf ihn weiter benutzen — dort ist er richtig.
test('workspace.js loest Projekte nie ueber den Startseiten-Zeiger auf', () => {
  const quelle = readFileSync(new URL('../src/workspace.js', import.meta.url), 'utf8')
  const treffer = quelle
    .split('\n')
    .map((zeile, i) => ({ nr: i + 1, zeile }))
    .filter(({ zeile }) => /(?<!\/\/.*)\bctx\s*\??\.\s*activeProjectObj\s*\(/.test(zeile))
    .filter(({ zeile }) => !zeile.trimStart().startsWith('//'))

  assert.deepEqual(
    treffer.map(({ nr, zeile }) => `${nr}: ${zeile.trim()}`),
    [],
    'workspace.js muss ueber dokumentProjekt(doc) aufloesen, nicht ueber ctx.activeProjectObj()',
  )
})

const OFFEN = { task: '', audience: [], desiredEffect: '' }
const FERTIG = { task: 'Essay ueber Ruhe', audience: ['Studierende'], desiredEffect: 'Verstehen' }

function projekte(...eintraege) {
  return eintraege
}

test('projektZumDokument loest ueber doc.projectId auf, nicht ueber die Reihenfolge der Liste', () => {
  const liste = projekte({ id: 'p-default', name: 'Meine Texte' }, { id: 'p-zwei', name: 'Zweites' })
  assert.equal(projektZumDokument(liste, { id: 'd1', projectId: 'p-zwei' })?.id, 'p-zwei')
})

test('projektZumDokument liefert null, wenn das Projekt des Dokuments fehlt', () => {
  const liste = projekte({ id: 'p-default', name: 'Meine Texte' })
  assert.equal(projektZumDokument(liste, { id: 'd1', projectId: 'p-geloescht' }), null)
  assert.equal(projektZumDokument(liste, { id: 'd1' }), null)
  assert.equal(projektZumDokument(null, { id: 'd1', projectId: 'p-default' }), null)
})

// Der gemeldete Fehler, als Regressionstest: frischer Start, die Projektuebersicht
// zeigt auf das leere Projekt 'p-default', geladen ist aber noch das Beispiel-Dokument
// aus 'p-example'. Das Beispielprojekt ist vom Interview ausgenommen — also darf hier
// KEINE Nachricht entstehen, schon gar keine mit fremder Projekt-ID.
test('Beispiel-Dokument bekommt kein Interview, auch wenn ein echtes Projekt gewaehlt ist', () => {
  const plan = planeInterviewNachricht({
    doc: { id: 'd-example', projectId: 'p-example' },
    projects: projekte(
      { id: 'p-default', name: 'Meine Texte', understanding: { ...OFFEN } },
      { id: 'p-example', name: 'Beispiel: Calm Technology', understanding: { ...OFFEN } },
    ),
    docTextLaenge: 5000,
  })
  assert.equal(plan.art, 'nichts')
  assert.equal(plan.grund, 'beispielprojekt')
})

test('als Beispiel markiertes Projekt ist ebenso ausgenommen', () => {
  const plan = planeInterviewNachricht({
    doc: { id: 'd1', projectId: 'p-demo' },
    projects: projekte({ id: 'p-demo', example: true, understanding: { ...OFFEN } }),
    docTextLaenge: 5000,
  })
  assert.equal(plan.art, 'nichts')
  assert.equal(plan.grund, 'beispielprojekt')
})

test('kurzer Text im echten Projekt: kostenlose Eroeffnungsfrage, auf das Projekt des Dokuments geschluesselt', () => {
  const plan = planeInterviewNachricht({
    doc: { id: 'd1', projectId: 'p-zwei' },
    projects: projekte(
      { id: 'p-default', understanding: { ...OFFEN } },
      { id: 'p-zwei', understanding: { ...OFFEN } },
    ),
    docTextLaenge: 12,
  })
  assert.equal(plan.art, 'eroeffnung')
  assert.equal(plan.projectId, 'p-zwei')
  assert.equal(plan.docId, 'd1')
  assert.equal(plan.nachrichtId, 'interview-p-zwei')
})

test('langer Text im echten Projekt startet den bezahlten Entwurf-Lauf', () => {
  const plan = planeInterviewNachricht({
    doc: { id: 'd1', projectId: 'p-zwei' },
    projects: projekte({ id: 'p-zwei', understanding: { ...OFFEN } }),
    docTextLaenge: 5000,
  })
  assert.equal(plan.art, 'entwurf')
  assert.equal(plan.projectId, 'p-zwei')
  assert.equal(plan.docId, 'd1')
})

test('bereits versuchter Entwurf-Lauf: kein zweiter bezahlter Versuch, aber die freie Eroeffnung bleibt', () => {
  const plan = planeInterviewNachricht({
    doc: { id: 'd2', projectId: 'p-zwei' },
    projects: projekte({ id: 'p-zwei', understanding: { ...OFFEN, entwurfVersuchtAm: 1720000000000 } }),
    docTextLaenge: 5000,
  })
  assert.equal(plan.art, 'eroeffnung')
  assert.equal(plan.nachrichtId, 'interview-p-zwei')
})

test('abgeschlossenes Verstaendnis: kein Interview mehr', () => {
  const plan = planeInterviewNachricht({
    doc: { id: 'd1', projectId: 'p-zwei' },
    projects: projekte({ id: 'p-zwei', understanding: { ...FERTIG } }),
    docTextLaenge: 5000,
  })
  assert.equal(plan.art, 'nichts')
  assert.equal(plan.grund, 'interview-geschlossen')
})

test('vorhandene Interview-Nachricht wird nicht doppelt angelegt', () => {
  const plan = planeInterviewNachricht({
    doc: { id: 'd1', projectId: 'p-zwei' },
    projects: projekte({ id: 'p-zwei', understanding: { ...OFFEN } }),
    vorhandeneNachrichtIds: ['example-agent-initiative', 'interview-p-zwei'],
    docTextLaenge: 12,
  })
  assert.equal(plan.art, 'nichts')
  assert.equal(plan.grund, 'nachricht-vorhanden')
})

// Die fremde Interview-Nachricht aus dem Fehlerbild darf NICHT als „schon vorhanden"
// durchgehen — sonst wuerde ein kontaminiertes Dokument sein eigenes Interview nie
// bekommen.
test('eine fremde Interview-Nachricht im Dokument blockiert das eigene Interview nicht', () => {
  const plan = planeInterviewNachricht({
    doc: { id: 'd1', projectId: 'p-zwei' },
    projects: projekte({ id: 'p-zwei', understanding: { ...OFFEN } }),
    vorhandeneNachrichtIds: ['interview-p-default'],
    docTextLaenge: 12,
  })
  assert.equal(plan.art, 'eroeffnung')
  assert.equal(plan.nachrichtId, 'interview-p-zwei')
})

test('Dokument ohne auffindbares Projekt fuehrt zu keiner Nachricht', () => {
  const plan = planeInterviewNachricht({
    doc: { id: 'd1', projectId: 'p-geloescht' },
    projects: projekte({ id: 'p-zwei', understanding: { ...OFFEN } }),
    docTextLaenge: 5000,
  })
  assert.equal(plan.art, 'nichts')
  assert.equal(plan.grund, 'kein-projekt')
})

test('ohne Dokument passiert nichts', () => {
  assert.equal(planeInterviewNachricht({ projects: projekte({ id: 'p-zwei' }) }).art, 'nichts')
  assert.equal(planeInterviewNachricht().grund, 'kein-dokument')
})

test('interviewNachrichtId schluesselt auf die Projekt-ID', () => {
  assert.equal(interviewNachrichtId('p-zwei'), 'interview-p-zwei')
})

// Altlast-Erkennung: bestehende Installationen tragen die falsch einsortierte
// Nachricht bereits im gespeicherten Zustand. Der Fix allein verhindert nur neue.
test('istFremdeInterviewNachricht erkennt die Interview-Nachricht eines anderen Projekts', () => {
  assert.equal(istFremdeInterviewNachricht('interview-p-default', 'p-example'), true)
})

test('istFremdeInterviewNachricht laesst die eigene Interview-Nachricht in Ruhe', () => {
  assert.equal(istFremdeInterviewNachricht('interview-p-example', 'p-example'), false)
})

test('istFremdeInterviewNachricht fasst Nachrichten ohne Interview-Schluessel nicht an', () => {
  assert.equal(istFremdeInterviewNachricht('example-agent-initiative', 'p-example'), false)
  assert.equal(istFremdeInterviewNachricht('agent-message-0', 'p-example'), false)
})

// Ohne bekanntes Projekt darf nichts geloescht werden — im Zweifel bleibt der
// Nutzerzustand stehen.
test('istFremdeInterviewNachricht loescht nichts, wenn das Projekt des Dokuments unbekannt ist', () => {
  assert.equal(istFremdeInterviewNachricht('interview-p-default', null), false)
  assert.equal(istFremdeInterviewNachricht('interview-p-default', ''), false)
})

// Selbstheilung wie ensureProjectUnderstanding sie sonst leistet: ein Projekt ohne
// understanding-Feld gilt als offenes Interview, nicht als Absturz.
test('Projekt ohne understanding-Feld gilt als offenes Interview', () => {
  const projekt = { id: 'p-neu' }
  const plan = planeInterviewNachricht({
    doc: { id: 'd1', projectId: 'p-neu' },
    projects: projekte(projekt),
    docTextLaenge: 12,
  })
  assert.equal(plan.art, 'eroeffnung')
  assert.equal(typeof projekt.understanding, 'object')
})
