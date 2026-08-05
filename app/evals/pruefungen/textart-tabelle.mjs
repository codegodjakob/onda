#!/usr/bin/env node
// TEXTART-01, TEXTART-04, TEXTART-05 — was ein Text seinem Publikum schuldet.
//
// Eine Integritätsfrage ist eine, die durch bloßes Verwerfen nicht verschwindet: Wer sie
// wegklickt, nimmt ein Risiko bewusst an. Vorher galten dafür vier feste Arten — Tatsache,
// Quelle, Methode, Logik — für jeden Text, egal welchen. Bei einer wissenschaftlichen
// Hausarbeit stimmt das. Bei einem Plakattext aus sechs Wörtern ist eine fehlende
// Quellenangabe keine Nachlässigkeit, sondern die Form: Ein Plakat hat für eine Fußnote
// keinen Platz. Trotzdem wurde das Verwerfen dort zum bewusst angenommenen Risiko — eine
// Mahnung für ein Versprechen, das niemand gegeben hat.
//
// Was hier geprüft wird: die vollständige Tabelle, Zeile für Zeile, mit derselben
// Ausschreibung wie bei den Momenten. Die Node-Tests belegen einzelne Zeilen; hier stehen
// alle, damit keine still verrutschen kann. Dazu die drei Eigenschaften, die keine einzelne
// Zeile hat:
//   — die Regel kann nur ENGER machen, nie weiter
//   — eine fehlende Angabe nimmt keine Sicherung weg
//   — die Regel erreicht die ENTSCHEIDUNG, nicht nur die Tabelle

import {
  STANDARD_INTEGRITAET,
  TEXTARTEN,
  integritaetsArten,
  istIntegritaetsfrage,
  istIntegritaetsfrageFuerCategory,
  istVonDerTextartAusgeschlossen,
  textartTabelle,
} from '../../src/textart-regeln.mjs'
import { HINWEISE_SCHEMA } from '../../src/agent-tasks.mjs'
import { hinweisZuFinding } from '../../src/agent-findings.mjs'
import { decideFinding, ensureReasoningModel } from '../../src/reasoning-model.mjs'

const fehler = []

// Die entschiedene Tabelle, hier ausgeschrieben. Verrutscht eine Zeile im Modell, schlägt
// diese Prüfung an — und zwar mit dem Namen der Zeile.
const ERWARTET = Object.freeze({
  scientific: ['fakt', 'quelle', 'methode', 'logik'],
  essay: ['fakt', 'quelle', 'logik'],
  project: ['fakt', 'quelle', 'methode', 'logik'],
  web: ['fakt', 'quelle'],
  marketing: ['fakt'],
  campaign: ['fakt'],
  prosa: ['logik'],
  lyrik: [],
  other: ['fakt', 'quelle', 'methode', 'logik'],
})

const hinweisArten = HINWEISE_SCHEMA.properties?.hinweise?.items?.properties?.kategorie?.enum || []

// --- Gegenprobe: gibt es die Tabelle überhaupt? ------------------------------
if (!hinweisArten.length) {
  fehler.push('Gegenprobe: die Hinweisarten sind nicht auffindbar — ab hier prüft nichts mehr.')
}
if (TEXTARTEN.length !== Object.keys(ERWARTET).length) {
  fehler.push(
    `Es gibt ${TEXTARTEN.length} Textarten, aber ${Object.keys(ERWARTET).length} erwartete Zeilen. `
    + 'Eine neue Textart braucht eine entschiedene Zuordnung, keinen stillen Rückfall.',
  )
}
for (const textart of TEXTARTEN) {
  if (!Object.prototype.hasOwnProperty.call(ERWARTET, textart)) {
    fehler.push(`Textart ohne entschiedene Zeile: ${textart}.`)
  }
}
if (textartTabelle().length !== TEXTARTEN.length) {
  fehler.push(`Die Tabelle im Modell hat ${textartTabelle().length} Zeilen, die Textarten sind ${TEXTARTEN.length}.`)
}

// --- Zeile für Zeile ---------------------------------------------------------
for (const [textart, erwartet] of Object.entries(ERWARTET)) {
  const ist = integritaetsArten(textart)
  if (JSON.stringify([...ist].sort()) !== JSON.stringify([...erwartet].sort())) {
    fehler.push(`${textart}: bindet ${JSON.stringify(ist)}, entschieden war ${JSON.stringify(erwartet)}.`)
    continue
  }
  // Nur Arten, die es wirklich gibt. Ein Tippfehler in der Tabelle wäre sonst eine
  // Sicherung, die niemals greift.
  for (const art of ist) {
    if (!hinweisArten.includes(art)) {
      fehler.push(`${textart}: nennt die Art „${art}", die es im Antwortschema gar nicht gibt.`)
    }
  }
  // Nur enger, nie weiter: Was ohne Textart keine Integritätsfrage war, wird durch
  // keine Textart zu einer.
  for (const art of ist) {
    if (!STANDARD_INTEGRITAET.includes(art)) {
      fehler.push(
        `${textart}: macht „${art}" zu einer Integritätsfrage, obwohl es ohne Textart keine wäre. `
        + 'Die Regel darf nur enger machen, nie weiter.',
      )
    }
  }
  // Handwerksfragen binden bei keiner Textart.
  for (const art of hinweisArten) {
    if (STANDARD_INTEGRITAET.includes(art)) continue
    if (istIntegritaetsfrage(textart, art)) {
      fehler.push(`${textart}: die Handwerksfrage „${art}" bindet — eine Formulierung ist nie eine Frage der Wahrhaftigkeit.`)
    }
  }
}

// --- Jede Zeile trägt eine Begründung ---------------------------------------
for (const zeile of textartTabelle()) {
  if (!zeile.begruendung || zeile.begruendung.trim().length <= 60) {
    fehler.push(`${zeile.textart}: keine tragfähige Begründung dafür, was diese Textart schuldet.`)
  }
}

// --- Erfundenes schuldet nichts über die Welt (TEXTART-05) ------------------
if (istIntegritaetsfrage('prosa', 'fakt')) {
  fehler.push('Prosa: die Tatsachenfrage bindet — eine erfundene Tatsache ist dort das Handwerk, kein Verstoß.')
}
if (!istIntegritaetsfrage('prosa', 'logik')) {
  fehler.push('Prosa: der Bruch im Gedankengang bindet nicht — er zerstört auch eine erfundene Welt.')
}
if (integritaetsArten('lyrik').length) {
  fehler.push('Lyrik: es bindet etwas. In einem Gedicht kann ein Widerspruch die Form sein; hier ist jeder Hinweis ein Angebot.')
}

// --- Eine fehlende Angabe nimmt keine Sicherung weg -------------------------
// Auch geerbte Namen: Ohne eigene Prüfung liefert der Zugriff auf 'constructor' eine
// Funktion statt undefined, und aus fail-closed würde ein Absturz.
for (const unbekannt of [undefined, null, '', '   ', 'reportage', 'constructor', 'toString', '__proto__']) {
  let arten = null
  try {
    arten = integritaetsArten(unbekannt)
  } catch (ursache) {
    fehler.push(`Textart ${JSON.stringify(unbekannt)}: die Regel stürzt ab (${ursache.message}) statt zurückzufallen.`)
    continue
  }
  if (JSON.stringify([...arten].sort()) !== JSON.stringify([...STANDARD_INTEGRITAET].sort())) {
    fehler.push(
      `Textart ${JSON.stringify(unbekannt)}: bindet ${JSON.stringify(arten)} statt der vorsichtigen vier. `
      + 'Eine Sicherung fällt nicht weg, weil ein Feld leer geblieben ist.',
    )
  }
}

// --- Die englische Brille trifft dieselbe Entscheidung ----------------------
const BRILLE = Object.freeze({ fact: 'fakt', source: 'quelle', citation: 'quelle', method: 'methode', logic: 'logik' })
for (const textart of TEXTARTEN) {
  for (const [category, art] of Object.entries(BRILLE)) {
    if (istIntegritaetsfrageFuerCategory(textart, category) !== istIntegritaetsfrage(textart, art)) {
      fehler.push(`${textart}: „${category}" und „${art}" sind dieselbe Frage, werden aber verschieden entschieden.`)
    }
  }
}

// --- TEXTART-01: die Regel erreicht die Entscheidung ------------------------
// Der schärfste Satz der ganzen Tabelle: Derselbe verworfene Quellenhinweis ist in der
// Hausarbeit ein bewusst angenommenes Risiko und auf dem Plakat nicht. Eine Regel, die
// nur in der Tabelle steht und beim Entscheiden nicht ankommt, ist gebaut und wirkungslos.
const ANKER = 'Die Zahl trägt das Argument.'
const ankerErgebnis = { gefunden: true, index: 0, normalisiert: false, laenge: ANKER.length }
const quellenHinweis = {
  kategorie: 'quelle',
  anker: ANKER,
  beobachtung: 'Zu dieser Zahl fehlt die Herkunft.',
  relevanz: 'Sie trägt den Absatz.',
  folge: 'Ohne Herkunft ist der Absatz nicht prüfbar.',
  muster: 'Eine Zahl, die das Argument trägt, braucht ihre Herkunft im Satz daneben.',
  vorschlag: null,
  istGrundursache: false,
  integritaet: true,
}

for (const [textart, erwarteterAusgang] of [['scientific', 'risk-accepted'], ['campaign', 'dismissed']]) {
  const finding = hinweisZuFinding(quellenHinweis, ankerErgebnis, 'b-eins', ANKER, 1000, textart)
  if (!finding) {
    fehler.push(`TEXTART-01, ${textart}: aus dem Hinweis entsteht gar kein Eintrag — die Prüfung läuft leer.`)
    continue
  }
  if (finding.textart !== textart) {
    fehler.push(
      `TEXTART-01, ${textart}: die Textart reist nicht am Hinweis mit (steht: ${JSON.stringify(finding.textart)}). `
      + 'Dann kennt die spätere Entscheidung sie nicht mehr.',
    )
  }
  const doc = { id: 'doc-pruefung', findings: [finding], decisions: [] }
  ensureReasoningModel(doc)
  decideFinding(doc, finding.id, { kind: 'reject', reason: 'passt hier nicht' }, 2000)
  if (finding.status !== erwarteterAusgang) {
    fehler.push(
      `TEXTART-01, ${textart}: ein verworfener Quellenhinweis endet als „${finding.status}", `
      + `entschieden war „${erwarteterAusgang}".`,
    )
  }
}

// Das Modell-Flag darf ergänzen, aber nichts zurückholen. Der Auftragstext legt dem Modell
// integritaet:true für quelle nahe, ohne die Textart zu kennen.
const aufDemPlakat = hinweisZuFinding(quellenHinweis, ankerErgebnis, 'b-eins', ANKER, 1000, 'campaign')
if (aufDemPlakat?.claim !== undefined) {
  fehler.push('TEXTART-01: das Modell-Flag holt auf dem Plakat die Quellenfrage zurück, die die Textart abgeräumt hat.')
}
if (!istVonDerTextartAusgeschlossen('campaign', 'quelle')) {
  fehler.push('TEXTART-01: die Textart Plakat räumt die Quellenfrage gar nicht ab.')
}
if (istVonDerTextartAusgeschlossen('campaign', 'struktur')) {
  fehler.push('TEXTART-01: „struktur" gilt als abgeräumt, obwohl es nie eine Integritätsfrage war.')
}

// --- Bericht -----------------------------------------------------------------
if (fehler.length) {
  process.stderr.write(`TEXTART-Tabelle FEHLGESCHLAGEN:\n  ${fehler.join('\n  ')}\n`)
  process.exit(1)
}
process.stdout.write(`TEXTART-Tabelle: alle ${TEXTARTEN.length} Textarten haben eine entschiedene Zeile.\n`)
for (const [textart, arten] of Object.entries(ERWARTET)) {
  process.stdout.write(`  ${textart}: ${arten.length ? arten.join(', ') : 'nichts bindet'}\n`)
}
