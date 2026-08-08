#!/usr/bin/env node
// KONTEXT-01, KONTEXT-02, KONTEXT-03 — was das Modell zu sehen bekommt.
//
// Der Befund, den diese Prüfung bewacht: Onda bestand aus zwei Hälften, die einander nicht
// berührten. Genau EINE Stelle baut die Anfrage an das Modell, und sie las drei Felder —
// Projektverständnis, Dokumenttext und "das wurde schon gesagt". Textsorte, der
// dokumentübergreifende Aussagen-Speicher, das freigegebene Gedächtnis und das persönlich
// Erkannte erreichten das Modell kein einziges Mal.
//
// Warum diese Prüfung neben den Unit-Tests steht: Die Tests belegen jede Quelle einzeln.
// Hier wird die Eigenschaft geprüft, die keine einzelne Datei besitzt — dass JEDER Kanal,
// der eine Anfrage baut, das Wissen anhängt. Ein Kanal, der es vergisst, ist kein
// fehlerhafter Test, sondern ein blinder Kanal.
//
// Drei Aussagen, jede mit ihrer eigenen Gegenprobe:
//   01 — jedes Wissen erreicht den TATSÄCHLICHEN Anfragekörper aller Kanäle
//   02 — kein Wissensblock steht im gecachten Präfix (ein Block dort entwertet den
//        Zwischenspeicher, sobald sich irgendeine Projektangabe ändert)
//   03 — ohne Wissen entsteht kein Block, auch kein leerer und kein "unbekannt"

import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { baueOndaBloecke, ergaenzeOndaKontext } from '../../src/onda-kontext.mjs'
import { baueHinweisKontext } from '../../src/hinweis-kontext.mjs'
import { baueErweiterungKontext } from '../../src/erweiterung-kontext.mjs'
import { baueChatKontext } from '../../src/chat-kontext.mjs'
import { baueVerstaendnisKontext } from '../../src/verstaendnis-kontext.mjs'
import { baueQuellenKontext } from '../../src/quellen-kontext.mjs'
import { baueBausteinKontext } from '../../src/bausteinarten-kontext.mjs'
import { baueAnfrage } from '../../src/agent-tasks.mjs'
import { updateLanguageProfile } from '../../src/language-profile.mjs'
import { synchronizeClaimLedger } from '../../src/claim-ledger.mjs'
import { createMemoryEntry, ensureMemoryStore } from '../../src/memory-model.mjs'
import { schreibeErkanntes } from '../../src/erkanntes-model.mjs'

const fehler = []
const srcOrdner = new URL('../../src/', import.meta.url)

async function lies(datei) {
  return readFile(fileURLToPath(new URL(datei, srcOrdner)), 'utf8')
}

// --- Der Prüfstand ------------------------------------------------------------
// Die Fixtures entstehen aus den ECHTEN Quellen, nicht aus handgeschriebenen Objekten:
// sonst bliebe diese Prüfung grün, während die echte Datenform daneben weiterläuft.
const PROJEKT_ID = 'projekt-kontextpruefung'
const OFFENER_TEXT = { id: 'doc-offen', title: 'Kapitel 1' }
const ANDERER_TEXT = { id: 'doc-anderer', title: 'MARKANTER-NACHBARTITEL-f81d' }

// Je Wissensquelle genau eine Marke. Sie ist absichtlich unmöglich zu erraten: Findet sie
// sich im Anfragekörper, kann sie nur aus dieser Quelle stammen.
const MARKEN = Object.freeze({
  'Textsorte und Stilprofil': 'MARKANTES-FACH-3c7e',
  'Aussagen-Speicher über alle Texte': 'MARKANTE-FREMDAUSSAGE-9b2a',
  'freigegebenes Gedächtnis': 'MARKANTE-PROJEKTSTIMME-5d4f',
  'persönlich Erkanntes': 'MARKANTES-PRINZIP-7a1c',
})

function vollesWissen() {
  const languageProfile = updateLanguageProfile({
    profile: null,
    projectId: PROJEKT_ID,
    changes: { genre: 'scientific', domain: MARKEN['Textsorte und Stilprofil'] },
    at: 1000,
  })
  const argumentModel = synchronizeClaimLedger({
    projectId: PROJEKT_ID,
    model: null,
    texts: [{
      textId: ANDERER_TEXT.id,
      projectId: PROJEKT_ID,
      blocks: [{
        id: 'b-fremd',
        role: 'claim',
        text: `${MARKEN['Aussagen-Speicher über alle Texte']} zeigt eine klare Wirkung.`,
      }],
    }],
    evidenceBundles: [],
    at: 2000,
  })

  const memoryStore = ensureMemoryStore(null)
  memoryStore.entries.push(createMemoryEntry({
    id: 'memory-projektstimme',
    level: 'project',
    type: 'voice',
    content: MARKEN['freigegebenes Gedächtnis'],
    scope: { projectId: PROJEKT_ID },
    provenance: { actor: 'user', action: 'share-proposal', originEventIds: ['ereignis-1'] },
    sensitivity: 'sensitive',
    deletionRule: 'manual',
    createdAt: 3000,
  }))
  schreibeErkanntes(memoryStore, { satz: MARKEN['persönlich Erkanntes'], at: 4000 })

  return {
    project: { id: PROJEKT_ID, name: 'Prüfprojekt', languageProfile, argumentModel },
    doc: OFFENER_TEXT,
    docs: [OFFENER_TEXT, ANDERER_TEXT],
    memoryStore,
  }
}

// Je Kanal zwei Angaben: wie sein Kontext gebaut wird, und WIE VIELE Blöcke seines
// Anfragekörpers cache_control tragen dürfen. Der Schlüssel ist der Task-Name, mit dem
// baueAnfrage aufgerufen wird — nicht frei gewählt.
//
// Warum `gecacht` nicht überall zwei ist: baueAnfrage legt cache_control auf
// Projektverständnis UND Dokumenttext, aber jeweils nur, wenn es sie gibt. Der
// Quellen-Kanal schickt bewusst KEINEN Dokumenttext mit — wonach die Quellen eines
// Projekts sich ordnen, ist eine Frage des Projekts und nicht des gerade offenen Textes
// (quellen-kontext.mjs). Er hat deshalb genau einen gecachten Block.
//
// Die Zahl steht hier ausgeschrieben und wird nicht gezählt: ein Kanal, der seinen
// Dokumenttext still verliert, soll auffliegen, statt dass die Prüfung sich ihm anpasst.
const KANAELE = Object.freeze({
  hinweise: {
    gecacht: 2,
    baue: onda => baueHinweisKontext({ verstaendnis: { task: 'Aufsatz' }, docText: 'Dokumenttext', onda }),
  },
  erweiterungen: {
    gecacht: 2,
    baue: onda => baueErweiterungKontext({ verstaendnis: { task: 'Aufsatz' }, docText: 'Dokumenttext', onda }),
  },
  chat: {
    gecacht: 2,
    baue: onda => baueChatKontext({
      verstaendnis: { task: 'Aufsatz' },
      docText: 'Dokumenttext',
      anfrage: 'Was meinst du?',
      onda,
    }),
  },
  verstaendnis: {
    gecacht: 2,
    baue: onda => baueVerstaendnisKontext({
      modus: 'entwurf',
      verstaendnis: { task: 'Aufsatz' },
      docText: 'Dokumenttext',
      onda,
    }),
  },
  quellenthemen: {
    gecacht: 1,
    baue: onda => baueQuellenKontext({
      verstaendnis: { task: 'Aufsatz' },
      quellen: [{ id: 'q1', type: 'web', metadata: { title: { value: 'Eine Quelle' } } }],
      onda,
    }),
  },
  // Der Bausteinarten-Kanal kam mit dem Einsammeln der Zweig-Inventur (#33) dazu und war
  // dabei zunaechst blind — genau der Befund von #30, nur eine Runde spaeter. Er fuehrt
  // Projektverstaendnis UND Dokumenttext, also zwei gecachte Bloecke.
  bausteinarten: {
    gecacht: 2,
    baue: onda => baueBausteinKontext({
      verstaendnis: { task: 'Aufsatz' },
      docText: 'Dokumenttext',
      blocks: [{ id: 'b1', type: 'paragraph', role: 'paragraph', text: 'Ein Absatz.' }],
      onda,
    }),
  },
})

// --- Gegenprobe zuerst: trägt der Prüfstand überhaupt Wissen? -----------------
// Ohne diese Probe wäre alles Folgende wertlos. Eine Marke, die schon in der leeren
// Fassung fehlt, beweist nichts, wenn sie in der vollen auftaucht — und eine Fixture,
// die versehentlich kein Wissen enthält, ließe jede Suche unten still durchgehen.
const bloeckeVoll = baueOndaBloecke(vollesWissen())
const bloeckeLeer = baueOndaBloecke({})

if (bloeckeVoll.length < Object.keys(MARKEN).length) {
  fehler.push(
    `Gegenprobe: der Prüfstand erzeugt nur ${bloeckeVoll.length} Wissensblöcke, `
    + `es gibt aber ${Object.keys(MARKEN).length} Quellen. Die Prüfung misst weniger, als sie behauptet.`,
  )
}
for (const [quelle, marke] of Object.entries(MARKEN)) {
  if (!bloeckeVoll.join('\n').includes(marke)) {
    fehler.push(`Gegenprobe: die Quelle „${quelle}" erzeugt keinen Block — ab hier misst die Prüfung nichts.`)
  }
}

// --- 03: ohne Wissen entsteht kein Block -------------------------------------
if (bloeckeLeer.length) {
  fehler.push(
    `KONTEXT-03: ohne jede Angabe entstehen ${bloeckeLeer.length} Blöcke. `
    + 'Jede Anfrage bezahlte dann dafür, dass nichts bekannt ist.',
  )
}
for (const block of bloeckeVoll) {
  if (/\bunbekannt\b/i.test(block)) {
    fehler.push('KONTEXT-03: ein Block sagt „unbekannt" — das Modell soll nicht raten, was es nicht weiß.')
  }
  if (!block.trim()) fehler.push('KONTEXT-03: ein leerer Block wird mitgeschickt und mitbezahlt.')
}

// --- 01 und 02: je Kanal am tatsächlichen Anfragekörper ----------------------
// Nicht am Zwischenwert: baueAnfrage konsumiert ausschliesslich bestimmte Felder, ein
// Block an falscher Stelle wird stillschweigend verschluckt.
for (const [name, kanal] of Object.entries(KANAELE)) {
  let mit = null
  let ohne = null
  try {
    mit = baueAnfrage(name, kanal.baue(vollesWissen()))
    ohne = baueAnfrage(name, kanal.baue(null))
  } catch (ursache) {
    fehler.push(`Kanal ${name}: die Anfrage lässt sich nicht bauen (${ursache.message}).`)
    continue
  }

  const koerperMit = JSON.stringify(mit.body)
  const koerperOhne = JSON.stringify(ohne.body)

  for (const [quelle, marke] of Object.entries(MARKEN)) {
    if (!koerperMit.includes(marke)) {
      fehler.push(`KONTEXT-01, Kanal ${name}: „${quelle}" erreicht den Anfragekörper nicht.`)
    }
    // Gegenprobe je Kanal: ohne Wissen darf die Marke NICHT dastehen. Sonst käme sie
    // von woanders her und die Suche oben bewiese nichts.
    if (koerperOhne.includes(marke)) {
      fehler.push(`Gegenprobe, Kanal ${name}: „${quelle}" steht auch ohne Wissen im Körper — die Marke misst nichts.`)
    }
  }

  const inhalt = mit.body?.messages?.[0]?.content
  if (!Array.isArray(inhalt)) {
    fehler.push(`Kanal ${name}: der Anfragekörper hat keine Blockliste — die Präfix-Prüfung läuft leer.`)
    continue
  }
  const gecacht = inhalt.filter(block => block && typeof block === 'object' && 'cache_control' in block)
  if (gecacht.length !== kanal.gecacht) {
    fehler.push(
      `KONTEXT-02, Kanal ${name}: ${gecacht.length} Blöcke tragen cache_control, erwartet sind genau `
      + `${kanal.gecacht} (Projektverständnis${kanal.gecacht > 1 ? ' und Dokumenttext' : ' allein — dieser Kanal führt keinen Dokumenttext'}).`,
    )
  }
  for (const block of gecacht) {
    for (const [quelle, marke] of Object.entries(MARKEN)) {
      if (String(block.text || '').includes(marke)) {
        fehler.push(
          `KONTEXT-02, Kanal ${name}: „${quelle}" steht im gecachten Präfix. `
          + 'Damit wäre der Zwischenspeicher bei jeder Projektänderung entwertet und jede Anfrage danach voll zu bezahlen.',
        )
      }
    }
  }
}

// --- 01, baulich: kein Kanal ohne Anschluss ----------------------------------
// Am Verhalten oben hängen die vier Kanäle, die es HEUTE gibt. Ein fünfter, der morgen
// dazukommt, wäre dort unsichtbar. Deshalb zusätzlich die Bauweise: jedes Modul, das
// einen Anfragekontext baut, muss die Wissensblöcke anhängen.
const dateien = (await readdir(fileURLToPath(srcOrdner)))
  .filter(name => name.endsWith('-kontext.mjs') && name !== 'onda-kontext.mjs')
  .sort()

if (dateien.length < 4) {
  fehler.push(`Baulich: nur ${dateien.length} Kanal-Module gefunden, erwartet mindestens vier — die Prüfung misst zu wenig.`)
}
// Und jedes gefundene Modul muss oben auch am VERHALTEN geprüft sein. Genau diese Lücke war
// der Befund von Issue #30: der Quellen-Kanal entstand, die bauliche Prüfung sah ihn, die
// Verhaltensprüfung nicht — ein Kanal, den nur die halbe Prüfung kennt, ist halb geprüft.
if (dateien.length !== Object.keys(KANAELE).length) {
  fehler.push(
    `Baulich: ${dateien.length} Kanal-Module liegen in src/, aber ${Object.keys(KANAELE).length} stehen in der `
    + 'Verhaltensprüfung. Trage den neuen Kanal in KANAELE ein, sonst prüft ihn nur die Textsuche.',
  )
}
for (const datei of dateien) {
  const quelltext = (await lies(datei))
    .split('\n')
    .map(zeile => zeile.replace(/\/\/.*$/, ''))
    .join('\n')
  if (!quelltext.includes('baueOndaBloecke')) {
    fehler.push(
      `KONTEXT-01, baulich: src/${datei} baut einen Anfragekontext, hängt aber kein Projektwissen an. `
      + `Ein blinder Kanal ist Wissen, das in einem von ${dateien.length} Fällen fehlt.`,
    )
  }
}

// Die zwei Läufe, deren Kontext-Bau nicht im Kanalmodul liegt, gehen über den Nachtrag.
const workspace = (await lies('workspace.js'))
  .split('\n')
  .map(zeile => zeile.replace(/\/\/.*$/, ''))
  .join('\n')
const nachtraege = (workspace.match(/ergaenzeOndaKontext\(/g) || []).length
if (nachtraege < 2) {
  fehler.push(
    `KONTEXT-01, baulich: ergaenzeOndaKontext wird in src/workspace.js ${nachtraege}× benutzt, erwartet mindestens `
    + 'zweimal — Hinweislauf und Erweiterungslauf reichen ihren Kontext dort durch.',
  )
}

// Und der Nachtrag darf die Eingabe nicht verändern: sonst wanderte Wissen unbemerkt in
// einen Kontext, den ein anderer Aufrufer noch benutzt.
const basis = baueHinweisKontext({ verstaendnis: { task: 'Aufsatz' }, docText: 'Dokumenttext' })
const vorher = JSON.stringify(basis)
const ergaenzt = ergaenzeOndaKontext(basis, vollesWissen())
if (JSON.stringify(basis) !== vorher) {
  fehler.push('KONTEXT-01: ergaenzeOndaKontext verändert die Eingabe — derselbe Kontext bekäme das Wissen zweimal.')
}
if (ergaenzt.volatiles.length <= basis.volatiles.length) {
  fehler.push('KONTEXT-01: ergaenzeOndaKontext hängt gar kein Wissen an.')
}
if (JSON.stringify(ergaenzt.volatiles.slice(0, basis.volatiles.length)) !== JSON.stringify(basis.volatiles)) {
  fehler.push('KONTEXT-01: das Wissen steht nicht hinten — die bisherigen Blöcke haben sich verschoben.')
}

// --- Bericht ------------------------------------------------------------------
if (fehler.length) {
  process.stderr.write(`KONTEXT-Anschluss FEHLGESCHLAGEN:\n  ${fehler.join('\n  ')}\n`)
  process.exit(1)
}
process.stdout.write(
  `KONTEXT: ${Object.keys(MARKEN).length} Wissensquellen erreichen alle ${Object.keys(KANAELE).length} Kanäle, `
  + `keine davon im gecachten Präfix.\n`,
)
Object.keys(MARKEN).forEach(quelle => process.stdout.write(`  ${quelle}\n`))
process.stdout.write(`  ${dateien.length} Kanal-Module geprüft: ${dateien.join(', ')}\n`)
