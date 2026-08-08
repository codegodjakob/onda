// Was kommt zuerst dran? „Was ist die Aufgabe, die die am meisten Impact hat, die man
// als Nächstes umsetzen sollte?" (Jakob, 8.8.2026)
//
// Bis dahin sortierte die Warteschlange nach Grundursache, Integrität und dann ALTER.
// Ein Kommafehler und eine zerfallende Gliederung standen gleichauf, sobald beides
// gleich alt war. Diese Prüfung hält die fünf Stufen fest, die jetzt gelten — und vor
// allem die Fälle, in denen sie einander widersprechen.

import test from 'node:test'
import assert from 'node:assert/strict'

import { ALL_ANNOTATION_KINDS, tragweite, verbindlichkeit } from '../src/annotation-contract.mjs'
import { ensureReasoningModel, getFindingQueue } from '../src/reasoning-model.mjs'

// Ein Hinweis, wie ihn agent-findings.mjs baut — nur mit den Feldern, die für die
// Reihenfolge zählen. createdAt ist überall gleich, damit das Alter NICHT entscheidet:
// genau das ist der Punkt der Änderung.
//
// ACHTUNG bei den Kennungen: Die letzte Stufe der Sortierung ist ein Vergleich der
// Kennungen. Heissen die Hinweise so, dass diese Notfall-Reihenfolge zufällig schon die
// erwartete ist, besteht die Prüfung auch dann, wenn die ganze Rangfolge fehlt — genau
// das ist mir beim ersten Anlauf passiert, und die Gegenprobe hat nur einen von sechs
// Fällen gefangen. Die Kennungen laufen deshalb ausdrücklich GEGEN die Erwartung: was
// zuerst kommen soll, heisst 'z-…', was zuletzt kommen soll, heisst 'a-…'.
function hinweis(id, art, extra = {}) {
  return {
    id,
    status: 'open',
    placement: 'passage',
    target: `Anker ${id}`,
    anmerkungsart: art,
    priority: 'normal',
    createdAt: 1000,
    ...extra,
  }
}

function reihenfolge(...hinweise) {
  const doc = { findings: [...hinweise] }
  ensureReasoningModel(doc)
  const queue = getFindingQueue(doc)
  return [queue.current, ...queue.upcoming].filter(Boolean).map(f => f.id)
}

test('Was weiter in den Text reicht, kommt zuerst', () => {
  // Der Fall, um den es Jakob ging: Gliederung gegen Kommafehler, gleich alt.
  assert.deepEqual(
    reihenfolge(hinweis('a-komma', 'zeichensetzung'), hinweis('z-gliederung', 'gliederung')),
    ['z-gliederung', 'a-komma'],
    'Der Kommafehler verdrängt die Gliederung — die Rangfolge misst wieder das Alter',
  )

  assert.deepEqual(
    reihenfolge(hinweis('a-wort', 'wortwahl'), hinweis('z-faden', 'faden'), hinweis('m-satz', 'satzstil')),
    ['z-faden', 'm-satz', 'a-wort'],
  )
})

test('Bei gleicher Tragweite entscheidet die Verbindlichkeit', () => {
  // Beide gelten dem Satz. Ein Fehler ist keine Meinung, eine Empfehlung schon eher.
  assert.deepEqual(
    reihenfolge(hinweis('a-stil', 'satzstil'), hinweis('z-grammatik', 'grammatik')),
    ['z-grammatik', 'a-stil'],
  )
  // Beide gelten dem Absatz: Empfehlung vor Geschmack.
  assert.deepEqual(
    reihenfolge(hinweis('a-geschmack', 'absatzstil'), hinweis('z-empfehlung', 'verschieben')),
    ['z-empfehlung', 'a-geschmack'],
  )
})

test('Verbindlichkeit schlägt die Tragweite NICHT', () => {
  // Der wichtigste Grenzfall. Ein Rechtschreibfehler ist ein Fehler, aber er trifft ein
  // Wort; die Frage nach dem Ton trifft einen ganzen Abschnitt. Käme der Fehler zuerst,
  // wäre die ganze Änderung wirkungslos — dann sortierte wieder das Kleinste nach vorn.
  assert.deepEqual(
    reihenfolge(hinweis('a-tippfehler', 'rechtschreibung'), hinweis('z-ton', 'ton')),
    ['z-ton', 'a-tippfehler'],
  )
})

test('Die Grundursache steht vor allem, auch vor der Tragweite', () => {
  // Ein Symptom mit grosser Reichweite darf die benannte Wurzel nicht überholen.
  assert.deepEqual(
    reihenfolge(
      hinweis('a-symptom', 'faden'),
      hinweis('z-wurzel', 'wortwahl', { priority: 'high', istGrundursache: true }),
    ),
    ['z-wurzel', 'a-symptom'],
  )
})

test('Integrität steht vor der Tragweite', () => {
  // Ein fehlender Beleg gilt einem Satz, der rote Faden dem ganzen Text — und trotzdem
  // kommt der Beleg zuerst. Eine unbelegte Behauptung ist keine Geschmacksfrage.
  assert.deepEqual(
    reihenfolge(
      hinweis('a-faden', 'faden'),
      hinweis('z-beleg', 'beleg', { category: 'source', textart: 'scientific' }),
    ),
    ['z-beleg', 'a-faden'],
  )
})

test('Das Alter entscheidet erst, wenn sonst alles gleich ist', () => {
  assert.deepEqual(
    reihenfolge(
      hinweis('a-spaeter', 'wortwahl', { createdAt: 2000 }),
      hinweis('z-frueher', 'wortwahl', { createdAt: 1000 }),
    ),
    ['z-frueher', 'a-spaeter'],
  )
})

test('Ein Symptom bleibt hinter seiner Ursache geparkt', () => {
  // Die Parkregel gab es schon; sie darf durch die neue Sortierung nicht ausgehebelt
  // werden — auch nicht, wenn das Symptom weiter reicht als die Ursache.
  const doc = {
    findings: [
      hinweis('a-folge', 'faden', { rootCauseId: 'z-ursache' }),
      hinweis('z-ursache', 'wortwahl'),
    ],
  }
  ensureReasoningModel(doc)
  const queue = getFindingQueue(doc)
  assert.equal(queue.current.id, 'z-ursache')
  assert.deepEqual(queue.parked.map(f => f.id), ['a-folge'])
  assert.deepEqual(queue.upcoming.map(f => f.id), [])
})

test('Jede Art hat einen Rang, und Unbekanntes landet hinten', () => {
  for (const art of ALL_ANNOTATION_KINDS) {
    assert.ok(tragweite(art) <= 6, `${art} hat keine Tragweite`)
    assert.ok(verbindlichkeit(art) <= 2, `${art} hat keine Verbindlichkeit`)
  }
  // Fail-closed: was niemand kennt, draengt sich nicht an die Spitze.
  assert.equal(tragweite('gibtesnicht'), 9)
  assert.equal(verbindlichkeit('gibtesnicht'), 9)
})
