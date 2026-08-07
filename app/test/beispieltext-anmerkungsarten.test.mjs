// Der Beispieltext „Calm Technology" ist das einzige Stück Text, das jede und jeder
// beim ersten Start vor sich hat. Er muss deshalb ALLE Anmerkungsarten zeigen — sonst
// bleiben 24 der 29 Gestalten unsichtbar, bis irgendwann zufällig ein KI-Lauf eine
// davon liefert. Diese Prüfung nagelt drei Dinge fest:
//   1. Jede Art aus dem Vertrag kommt im Beispiel wirklich vor.
//   2. Jede Anmerkung hängt an einer echten, eindeutigen Stelle des Textes.
//   3. Jede Anmerkung trägt die Felder, die ihre Gestalt braucht — geprüft daran, dass
//      sich ihre Textoperation ohne Nachhelfen planen lässt.

import test from 'node:test'
import assert from 'node:assert/strict'

import { buildExampleBody, buildExampleCoach, buildExampleLane } from '../src/example.js'
import {
  ALL_ANNOTATION_KINDS,
  ANNOTATION_DEFINITIONS,
  kindInfo,
} from '../src/annotation-contract.mjs'
import { ensureReasoningModel } from '../src/reasoning-model.mjs'
import { resolveFindingPlacement } from '../src/workspace-model.mjs'
import { planAnnotationOperation } from '../src/annotation-operations.mjs'

const EXAMPLE_TITLE = 'Calm Technology'

// Die Bausteine des Beispieltextes, so wie sie nach dem Laden im Editor stehen: ein
// Absatz oder eine Überschrift je Baustein, jeder mit seiner Kennung. Der Beispieltext
// ist flaches HTML ohne Verschachtelung — ein Zerleger genügt, kein Browser nötig.
function exampleBlocks() {
  const body = buildExampleBody()
  const blocks = [...body.matchAll(/<(p|h[1-3]) data-block-id="([^"]+)">([\s\S]*?)<\/\1>/g)]
    .map(([, tag, id, text], index) => ({
      id,
      index,
      type: tag === 'p' ? 'paragraph' : 'heading',
      role: tag === 'p' ? 'paragraph' : 'heading',
      text,
    }))
  const ohneKennung = body.replace(/<(p|h[1-3]) data-block-id="[^"]+">[\s\S]*?<\/\1>/g, '')
  assert.equal(ohneKennung, '', `Bausteine ohne data-block-id im Beispieltext: ${ohneKennung}`)
  return blocks
}

function exampleDoc() {
  const doc = {
    id: 'doc-beispiel',
    title: EXAMPLE_TITLE,
    body: buildExampleBody(),
    coach: buildExampleCoach(),
    lane: buildExampleLane(),
  }
  return ensureReasoningModel(doc)
}

function klartext(blocks) {
  return blocks.map(block => block.text).join('\n')
}

function haeufigkeit(heuhaufen, nadel) {
  return heuhaufen.split(nadel).length - 1
}

test('der Beispieltext zeigt jede der 29 Anmerkungsarten', () => {
  const arten = new Set(exampleDoc().findings.map(finding => finding.anmerkungsart))
  const fehlend = ALL_ANNOTATION_KINDS.filter(art => !arten.has(art))
  assert.deepEqual(fehlend, [], `Im Beispiel fehlen diese Anmerkungsarten: ${fehlend.join(', ')}`)
  assert.equal(arten.size, ALL_ANNOTATION_KINDS.length)
})

test('jede Anmerkung nennt ihre Art ausdrücklich — nichts wird geraten', () => {
  for (const finding of [...buildExampleLane(), ...buildExampleCoach()]) {
    assert.ok(
      ANNOTATION_DEFINITIONS[finding.anmerkungsart],
      `${finding.id}: anmerkungsart fehlt oder ist unbekannt (${finding.anmerkungsart})`,
    )
  }
})

test('jedes target steht wörtlich und nur einmal im Beispieltext', () => {
  const blocks = exampleBlocks()
  const text = klartext(blocks)

  for (const finding of buildExampleLane()) {
    const treffer = haeufigkeit(text, finding.target)
    assert.equal(
      treffer,
      1,
      `${finding.id}: „${finding.target.slice(0, 60)}" steht ${treffer}-mal im Text, gebraucht wird genau einmal`,
    )
    const placement = resolveFindingPlacement({ ...finding }, blocks)
    assert.equal(
      placement.kind,
      'anchored',
      `${finding.id}: findet seinen Absatz nicht (${placement.kind})`,
    )
    assert.equal(placement.block.id, finding.blockId)
  }
})

test('Mehrfach- und Vergleichsstellen zeigen auf echte Stellen im Text', () => {
  const blocks = exampleBlocks()
  const blockById = new Map(blocks.map(block => [block.id, block]))
  const text = klartext(blocks)

  for (const finding of buildExampleLane()) {
    for (const stelle of finding.targets || []) {
      const block = blockById.get(stelle.blockId)
      assert.ok(block, `${finding.id}: unbekannter Baustein ${stelle.blockId}`)
      assert.equal(
        haeufigkeit(block.text, stelle.text),
        1,
        `${finding.id}: „${stelle.text}" ist in ${stelle.blockId} nicht eindeutig`,
      )
      assert.notEqual(stelle.replacement, stelle.text, `${finding.id}: Ersatz gleicht dem Original`)
    }
    for (const zeile of finding.compare || []) {
      assert.ok(
        text.includes(zeile.text),
        `${finding.id}: Vergleichsstelle „${zeile.text}" steht nicht im Text`,
      )
    }
  }
})

test('jede Anmerkung trägt die Felder, die ihre Gestalt braucht', () => {
  for (const finding of buildExampleLane()) {
    const { form, label } = kindInfo(finding.anmerkungsart)
    const wo = `${finding.id} (${label}, ${form})`

    assert.ok(finding.short, `${wo}: short fehlt — die Karte bliebe leer`)
    assert.ok(finding.why, `${wo}: why fehlt — „Warum?" bliebe leer`)

    if (['correction', 'rewrite', 'insertion', 'title'].includes(form)) {
      assert.ok(finding.action, `${wo}: action fehlt — die Karte zeigt keinen Vorschlag`)
      assert.notEqual(finding.action, finding.target, `${wo}: der Vorschlag ändert nichts`)
    }
    if (form === 'region') {
      assert.ok(finding.targets?.length, `${wo}: targets fehlen`)
      assert.ok(finding.action, `${wo}: action fehlt`)
    }
    if (form === 'compare') assert.ok(finding.compare?.length >= 2, `${wo}: compare braucht zwei Stellen`)
    if (form === 'source') {
      const quelle = finding.sources?.[0]
      assert.ok(quelle?.label && quelle?.content && quelle?.citation, `${wo}: die Quelle ist unvollständig`)
    }
    if (form === 'slot') {
      assert.ok(finding.move || finding.heading, `${wo}: weder Ziel noch Überschrift`)
      if (finding.move) assert.ok(finding.move.to, `${wo}: move.to fehlt — die Karte zeigt kein Ziel`)
    }
    if (form === 'dialogue') {
      assert.ok(finding.thread?.length, `${wo}: das Gespräch beginnt ohne erste Nachricht`)
      for (const nachricht of finding.thread) {
        assert.ok(['agent', 'user'].includes(nachricht.role), `${wo}: unbekannte Rolle ${nachricht.role}`)
        assert.ok(nachricht.text?.trim(), `${wo}: leere Nachricht`)
        assert.equal(Number.isFinite(nachricht.at), true, `${wo}: Nachricht ohne Zeitstempel`)
      }
    }
  }
})

test('jede Textoperation des Beispiels lässt sich planen', () => {
  // Der schärfste Nachweis: Wer eine Anmerkung übernimmt, löst planAnnotationOperation
  // aus. Der Planer ist fail-closed — eine Korrektur ohne action, ein Verschieben ins
  // Nichts oder ein mehrdeutiges Ziel scheitern hier, nicht erst unter Jakobs Händen.
  const snapshot = { title: EXAMPLE_TITLE, blocks: exampleBlocks(), sources: [] }

  for (const finding of buildExampleLane()) {
    const { operation, label } = kindInfo(finding.anmerkungsart)
    const plan = planAnnotationOperation(finding, snapshot)
    if (!operation) {
      assert.equal(plan.ok, false, `${finding.id} (${label}): hat gar keine Operation im Vertrag`)
      continue
    }
    assert.equal(plan.ok, true, `${finding.id} (${label}): Plan scheitert an „${plan.reason}"`)
    assert.equal(plan.kind, operation)
    assert.notDeepEqual(plan.after, plan.before, `${finding.id} (${label}): der Plan ändert nichts`)
  }
})
