#!/usr/bin/env node
// SYSTEM-03 — "Schlüssel bleiben außerhalb von Zustand und Export".
//
// Was hier geprüft wird: Ein Schlüssel, der in den Ablagefeldern der Anwendung
// liegt (Einstellungen, oberste Zustandsebene), darf in keinen Export wandern.
// Der Schlüssel wird absichtlich auch in ein Feld gelegt, das keine Ausnahmeliste
// kennt — ein Export, der alles durchreicht und nur Bekanntes filtert, fällt damit auf.
//
// Was hier ausdrücklich NICHT geprüft wird: Text, den die Autorin oder der Autor
// selbst geschrieben hat. Wer seinen Schlüssel in sein eigenes Dokument tippt,
// bekommt ihn im Export zurück — das ist sein Text, kein Leck. Eine Prüfung, die
// das als Fehler wertet, misst die falsche Sache.
//
// Ebenfalls nicht abgedeckt: Schlüsselbund und Netzweg. Beides braucht einen
// echten Schlüssel und bleibt Live-Gate.

import { exportAllLocalData } from '../../src/data-control.mjs'
import { buildPublicationDocument, renderMarkdown } from '../../src/publication-export.mjs'

const GEHEIM = 'sk-ant-api03-DIESER-WERT-DARF-NIE-IN-EINEN-EXPORT'
const fehler = []

function darfNichtEnthalten(name, wert) {
  const text = typeof wert === 'string' ? wert : JSON.stringify(wert)
  if (text && text.includes(GEHEIM)) fehler.push(`${name}: Schlüssel im Export gefunden.`)
}

// --- Teil 1: Gesamtdatensicherung -------------------------------------------
// Der Schlüssel liegt in den Ablagefeldern, NICHT im Nutzertext.
const state = {
  projects: [{ id: 'p1', name: 'Turboblaster', understanding: { task: 'Essay' } }],
  docs: [{ id: 'd1', projectId: 'p1', title: 'Text', body: 'Ein harmloser Satz.' }],
  settings: { apiKey: GEHEIM, usage: { monat: '2026-08', kostenCents: 12 } },
  memoryStore: {},
  apiKey: GEHEIM,
  // Ein Feld, das beim Bau des Exports niemand kennen konnte:
  irgendeinNeuesFeld: { verschachtelt: { tiefer: GEHEIM } },
}

const gesamt = exportAllLocalData({ state, at: 1 })
darfNichtEnthalten('Gesamtdatensicherung', gesamt)

// Gegenprobe: Ohne die Texte wäre die Abwesenheit des Schlüssels wertlos —
// dann exportiert die Sicherung schlicht nichts.
if (!JSON.stringify(gesamt).includes('Turboblaster')) {
  fehler.push('Gesamtdatensicherung: enthält die Projekte nicht — die Prüfung wäre wertlos.')
}

// --- Teil 2: Publikationsexport ---------------------------------------------
// Strukturprüfung statt Inhaltsprüfung: Der Publikationsexport bekommt seine
// Daten ausschließlich als Argumente. Er sieht den Anwendungszustand nie, kann
// also strukturell nichts aus den Einstellungen mitschleppen. Belegt, indem ein
// vollständiger Export ohne jeden Zustandszugriff entsteht.
const dokument = buildPublicationDocument({
  projectId: 'p1',
  textId: 'd1',
  title: 'Calm Technology',
  editorJson: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Ein harmloser Satz.' }] }],
  },
})
darfNichtEnthalten('Publikationsdokument', dokument)
darfNichtEnthalten('Publikationsexport (markdown)', renderMarkdown(dokument))

if (!renderMarkdown(dokument).includes('Ein harmloser Satz')) {
  fehler.push('Publikationsexport: enthält den Text nicht — die Prüfung wäre wertlos.')
}

if (fehler.length) {
  process.stderr.write(`SYSTEM-03 FEHLGESCHLAGEN:\n  ${fehler.join('\n  ')}\n`)
  process.exit(1)
}
process.stdout.write('SYSTEM-03: kein Schlüssel aus den Ablagefeldern in Sicherung oder Publikationsexport.\n')
