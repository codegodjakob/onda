#!/usr/bin/env node
// PERSON-01, PERSON-02, PERSON-05 — der Ort, der einem Menschen gehört.
//
// Bisher hing in Onda alles an einem Ding: Hinweise am Dokument, Profile am Projekt. Es gab
// im ganzen Datenmodell keine Stelle, die „Jakob" heißt. Ohne die lässt sich der Anspruch
// „erweitert über die Zeit seinen persönlichen Erkenntnishorizont" nicht einlösen — das ist
// kein fehlender Knopf, das war ein fehlendes Substantiv.
//
// Drei Aussagen:
//   01 — was gespeichert wird, liegt auf der persönlichen Ebene und gilt über alle Projekte
//   02 — nur Angenommenes kommt hinein, und nur über EINEN Weg
//   05 — in der Anfrage verlangt der Speicher Kürze, nicht Schweigen
//
// Warum 05 zählt: Hieße der Block „verschweige, was hier steht", würde Onda schlechter, je
// mehr es weiß. Wer denselben Fehler zum fünften Mal macht, bekäme genau dann keinen Hinweis
// mehr, wenn er ihn am nötigsten braucht.

import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import {
  erkanntesFuerPrompt,
  erkanntesListe,
  schreibeErkanntes,
  ueberholeErkanntes,
} from '../../src/erkanntes-model.mjs'
import { baueOndaBloecke } from '../../src/onda-kontext.mjs'
import { ensureMemoryStore } from '../../src/memory-model.mjs'

const fehler = []
const srcOrdner = new URL('../../src/', import.meta.url)
const SATZ = 'MARKANTES-PRINZIP-2f6d trägt beim nächsten Text von allein wieder.'

// --- 01: die Ebene gehört der Person, nicht dem Ding -------------------------
const speicher = ensureMemoryStore(null)
let eintrag = null
try {
  schreibeErkanntes(speicher, { satz: SATZ, herkunft: 'hinweis', dokumentId: 'doc-1', projektId: 'projekt-1', at: 1000 })
  eintrag = speicher.entries.at(-1)
} catch (ursache) {
  fehler.push(`PERSON-01: das Speichern eines Prinzips schlägt fehl (${ursache.message}).`)
}

if (!eintrag) {
  fehler.push('PERSON-01: es wird gar nichts gespeichert — ab hier prüft diese Datei nichts mehr.')
} else {
  if (eintrag.level !== 'personal') {
    fehler.push(`PERSON-01: der Eintrag liegt auf der Ebene „${eintrag.level}" statt bei der Person.`)
  }
  if (eintrag.scope?.allProjects !== true) {
    fehler.push(
      'PERSON-01: der Eintrag gilt nicht über alle Projekte. Dann stürbe jede Einsicht mit dem Projekt, '
      + 'in dem sie aufkam — und genau das war der Zustand vorher.',
    )
  }
  if (eintrag.deletionRule === 'with-text' || eintrag.deletionRule === 'with-project') {
    fehler.push(`PERSON-01: der Eintrag stirbt mit dem Text oder dem Projekt (${eintrag.deletionRule}).`)
  }
  // Die Herkunft muss dranbleiben: ein Prinzip ohne Anlass lässt sich später nicht mehr
  // nachprüfen, und die Rücknahme wäre dann eine Entscheidung ohne Grundlage.
  if (!Array.isArray(eintrag.provenance?.originEventIds) || !eintrag.provenance.originEventIds.length) {
    fehler.push('PERSON-01: der Eintrag trägt keine Herkunft — woher der Satz kam, ist später nicht mehr feststellbar.')
  }
}

// Und die Rücknahme muss es geben: ohne sie wiederholte sich ein falscher Satz in JEDEM
// künftigen Text, und der Speicher vergiftete sich selbst.
schreibeErkanntes(speicher, { satz: SATZ, herkunft: 'erweiterung', at: 2000 })
if (erkanntesListe(speicher).length !== 1) {
  fehler.push('PERSON-01: derselbe Satz zweimal ergibt zwei Zeilen statt einer mit zwei Begegnungen.')
}
ueberholeErkanntes(speicher, SATZ, 3000)
if (erkanntesListe(speicher).length !== 0) {
  fehler.push('PERSON-01: die Rücknahme erwischt nicht alle Begegnungen desselben Satzes.')
}
if (erkanntesFuerPrompt(speicher).length !== 0) {
  fehler.push('PERSON-01: ein zurückgenommener Satz steht weiter in der Anfrage — die Rücknahme wirkt nur in der Anzeige.')
}

// --- 02: nur Angenommenes, und nur über einen Weg ---------------------------
const quelltexte = []
for (const name of (await readdir(fileURLToPath(srcOrdner))).sort()) {
  if (!name.endsWith('.js') && !name.endsWith('.mjs')) continue
  if (name === 'erkanntes-model.mjs') continue
  const roh = await readFile(fileURLToPath(new URL(name, srcOrdner)), 'utf8')
  // Kommentare abziehen: der Code sagt an mehreren Stellen ausdrücklich im Kommentar, was
  // er NICHT tut. Ohne das Abziehen fände diese Prüfung genau diese Sätze.
  quelltexte.push([name, roh.split('\n').map(zeile => zeile.replace(/\/\/.*$/, '')).join('\n')])
}

const schreiber = quelltexte.filter(([, text]) => /\bschreibeErkanntes\s*\(/.test(text))
if (schreiber.length !== 1) {
  fehler.push(
    `PERSON-02: ${schreiber.length} Module schreiben in den Personen-Speicher (${schreiber.map(([n]) => n).join(', ') || 'keines'}). `
    + 'Ein Speicher, der sich an mehreren Stellen selbst füllt, lässt sich später nicht mehr überblicken.',
  )
}

for (const [name, text] of schreiber) {
  // Den einen Weg finden, ohne seinen Namen zu kennen: die Funktion, in deren Körper
  // geschrieben wird.
  const wrapper = /function\s+(\w+)\s*\([^)]*\)\s*\{[\s\S]{0,600}?schreibeErkanntes\s*\(/.exec(text)?.[1]
  if (!wrapper) {
    fehler.push(`PERSON-02, ${name}: der eine Schreibweg ist nicht auffindbar — die Prüfung misst nicht mehr, was sie soll.`)
    continue
  }
  const aufrufe = text
    .split('\n')
    .filter(zeile => new RegExp(`\\b${wrapper}\\s*\\(`).test(zeile))
    .filter(zeile => !new RegExp(`function\\s+${wrapper}\\b`).test(zeile))

  if (!aufrufe.length) {
    fehler.push(`PERSON-02, ${name}: der Schreibweg ${wrapper} wird nirgends benutzt — dann füllt sich der Speicher nie.`)
  }
  for (const zeile of aufrufe) {
    // Eine Rückmeldung, über die entschieden wird, darf nur beim Annehmen hineinwandern.
    // Ein Prinzip aus etwas, das die schreibende Person gerade zurückgewiesen hat, wäre ihr
    // in den Mund gelegt.
    const ueberEntscheidung = /\bfinding\b|\bhinweis\b/i.test(zeile)
    if (ueberEntscheidung && !/accept/i.test(zeile)) {
      fehler.push(
        `PERSON-02, ${name}: ein Hinweis wandert in den Personen-Speicher, ohne dass er angenommen wurde `
        + `(${zeile.trim().slice(0, 100)}).`,
      )
    }
    if (/reject|verwerfen|dismiss/i.test(zeile)) {
      fehler.push(`PERSON-02, ${name}: Verworfenes wandert in den Personen-Speicher (${zeile.trim().slice(0, 100)}).`)
    }
  }
}

// --- 05: Kürze verlangen, nicht Schweigen -----------------------------------
const mitPrinzip = ensureMemoryStore(null)
schreibeErkanntes(mitPrinzip, { satz: SATZ, at: 1000 })
const bloecke = baueOndaBloecke({ project: { id: 'projekt-1' }, doc: { id: 'doc-1' }, memoryStore: mitPrinzip })
// Alle Blöcke, in denen das Prinzip auftaucht. Die Aussage lautet: Wo immer es mitreist,
// steht daneben die Bitte um Kürze — und nirgends die Bitte um Schweigen.
const tragende = bloecke.filter(text => text.includes(SATZ))

// Gegenprobe zuerst: ein leerer Speicher darf gar keinen Block erzeugen. Sonst bezahlte
// jede Anfrage dafür, dass niemand etwas erkannt hat.
const leer = baueOndaBloecke({ project: { id: 'projekt-1' }, doc: { id: 'doc-1' }, memoryStore: ensureMemoryStore(null) })
if (leer.length) {
  fehler.push(`PERSON-05, Gegenprobe: ein leerer Personen-Speicher erzeugt ${leer.length} Block/Blöcke.`)
}

if (!tragende.length) {
  fehler.push('PERSON-05: das Erkannte erreicht die Anfrage überhaupt nicht — der Speicher spricht nie mit dem Modell.')
} else {
  if (!tragende.some(text => /knapp|kürzer|kuerzer/i.test(text))) {
    fehler.push('PERSON-05: kein Block verlangt Kürze — dann spart der Speicher nichts und kostet nur.')
  }
  if (!tragende.some(text => /trotzdem|dennoch/i.test(text))) {
    fehler.push(
      'PERSON-05: kein Block sagt, dass dieselbe Sache trotzdem gesagt werden soll. '
      + 'Ohne das würde Onda schlechter, je mehr es weiß.',
    )
  }
  for (const text of bloecke) {
    if (/verschweig|erw[äa]e?hne?\b[^.]{0,30}\bnicht\b|\bnicht\b[^.]{0,30}erw[äa]e?hn/i.test(text)) {
      fehler.push('PERSON-05: ein Block verlangt Schweigen. Wer denselben Fehler zum fünften Mal macht, braucht den Hinweis am nötigsten.')
    }
  }
}

// --- Bericht -----------------------------------------------------------------
if (fehler.length) {
  process.stderr.write(`PERSONEN-Speicher FEHLGESCHLAGEN:\n  ${fehler.join('\n  ')}\n`)
  process.exit(1)
}
process.stdout.write('PERSON: der Speicher gehört der Person, füllt sich nur aus Angenommenem und verlangt Kürze statt Schweigen.\n')
process.stdout.write(`  Ein Schreibweg: ${schreiber.map(([name]) => name).join(', ')}\n`)
