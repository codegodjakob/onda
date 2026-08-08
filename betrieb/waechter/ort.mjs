// W6 — der Ort-Waechter.
//
// Er beantwortet eine einzige Frage: Traegt jede Datei in app/src/ und app/test/ einen
// Namen, den man ihr ansieht?
//
// REINE NAMENSREGEL, KEINE TEXTSUCHE. Das ist der Kern dieses Waechters. Ein Waechter,
// der in den Inhalt hineinschaut („steht hier document?", „wird hier fetch gerufen?"),
// hat immer Recht und immer Unrecht zugleich: fuer jeden ehrlichen Sonderfall muss man
// ihm eine Ausnahme beibringen, und Ausnahmelisten wachsen. Am Namen dagegen laesst sich
// nicht handeln. Er steht schon da, bevor die erste Zeile geschrieben ist.
//
// Die Regel:
//   app/src/   -- eine der bekannten Endungen: -model.mjs (Zustand und Rechnen),
//                 -ui.mjs (Oberflaeche), -kontext.mjs (ein Kanal zum Modell), .css
//                 (Gestalt) sowie die fuenf namentlich bekannten .js-Dateien aus der
//                 Zeit vor den Modulen. („lauf-model.mjs" aus der Aufgabenbeschreibung
//                 braucht keine eigene Regel: hinweislauf-model.mjs und
//                 quellenlauf-model.mjs enden bereits auf -model.mjs.)
//   app/test/  -- .test.mjs (ein Test, den `npm run test:unit` einsammelt) oder „smoke"
//                 im Namen (ein Rauchtest, der von Hand oder einzeln laeuft).
//
// Beide Ordner werden REKURSIV gelesen. Ein Waechter, der nur die oberste Ebene sieht,
// ist an dem Tag blind, an dem jemand einen Unterordner anlegt -- und das ist genau der
// Tag, an dem man ihn braucht. Vorbild fuer das rekursive Lesen: betrieb/waechter/alle.mjs.
//
// DIE AUSNAHMEN. Was heute in app/src/ liegt und keiner Endung folgt, steht unten
// namentlich mit einem Satz dazu, WAS die Datei ist. Die Liste ist eine Bestandsaufnahme
// vom 8.8.2026, kein Freibrief: Diese Dateien gab es vor der Regel, ihre Namen stehen in
// vielen Einbindungen, und sie umzubenennen ist eine eigene Arbeit mit eigenem Risiko.
// Neu hinzukommen darf hier nichts -- eine neue Datei muss die Regel erfuellen. Wer
// dennoch eine Ausnahme eintraegt, muss den Satz dahinter schreiben koennen; das ist die
// Huerde, und sie ist mit Absicht klein, aber sichtbar.
//
// Was dieser Waechter NICHT tut: Er sagt nichts darueber, ob der Inhalt zum Namen passt.
// Eine Datei namens foo-model.mjs, die in Wahrheit das DOM anfasst, faellt ihm nicht auf.
// Das ist kein Versehen, sondern die Grenze, die ihn wartungsfrei haelt.

import { readdirSync, statSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, posix, sep } from 'node:path'

const WURZEL = fileURLToPath(new URL('../../', import.meta.url))

// ---------------------------------------------------------------------------------------
// app/src/ — die Regel
// ---------------------------------------------------------------------------------------

const SRC_ENDUNGEN = ['-model.mjs', '-ui.mjs', '-kontext.mjs', '.css']

// Die fuenf .js-Dateien aus der Zeit vor den Modulen. Sie sind namentlich bekannt und
// werden nicht mehr, weil jede neue Datei eine .mjs ist.
const SRC_JS = ['block-identity.js', 'editor.js', 'example.js', 'ui.js', 'workspace.js']

// ---------------------------------------------------------------------------------------
// app/src/ — die Ausnahmen, jede mit Namen und einem Satz dazu, was sie ist.
// Ermittelt durch einen echten Lauf ueber app/src/ am 8.8.2026, nicht geraten.
// ---------------------------------------------------------------------------------------

const SRC_AUSNAHMEN = {
  'agent-findings.mjs': 'Wandelt die Hinweise des Modells in die bestehende Findings-Form um.',
  'agent-gateway.mjs': 'Der Verteiler, durch den jeder einzelne KI-Aufruf laeuft.',
  'agent-prompts.mjs': 'Die deutschen Prompt-Texte als einzige Quelle.',
  'agent-status.mjs': 'Der Statusspeicher rund um die Gateway-Laeufe.',
  'agent-tasks.mjs': 'Die Tabelle Aufgabe-zu-Modell und der Bau der Anfrage im Anthropic-Format.',
  'agent-transport.mjs': 'Die zwei Transportwege zum Anthropic-Endpunkt: Browser-fetch und Mac-Bruecke.',
  'anchor-verify.mjs': 'Prueft die Anker des Modells deterministisch im Text nach, statt zu raten.',
  'anmerkung-wortlaut.mjs': 'Der Wortlaut, den ein Vorlesegeraet ueber die offenen Anmerkungen hoert.',
  'annotation-components.mjs': 'Die DOM-Bausteine einer Anmerkung: Karte am Rand, Marke im Text, Vorschlag.',
  'annotation-contract.mjs': 'Der Anmerkungsvertrag: Art, Kategorie, Prioritaet, Gestalt, moegliche Textoperation.',
  'annotation-controller.mjs': 'Der Zustand der Anmerkungen ohne jedes Aussehen, samt Rueckgaengig-Stapel.',
  'annotation-lab.mjs': 'Der zweite Einstiegspunkt: das Modul hinter annotation-lab.html.',
  'annotation-operations.mjs': 'Plant Textoperationen fail-closed mit erwartetem Vorher- und Nachher-Zustand.',
  'argument-deliberation.mjs': 'Das Abwaegen im Argumentteil: staerkstes Gegenargument, Wege, Stimmigkeit.',
  'argument-graph.mjs': 'Macht aus dem Argumentmodell einen Graphen und untersucht ihn auf Luecken.',
  'argument-projection.mjs': 'Leitet aus markierten Textbausteinen ab, was sich ohne Raten ableiten laesst.',
  'authorship-proof.mjs': 'Der Autorschaftsnachweis: was aus der Herkunftsspur vom Menschen stammt.',
  'citation-audit.mjs': 'Die Zitatpruefung, deterministisch und ohne Modell.',
  'claim-ledger.mjs': 'Das Aussagenregister: zerlegt Absaetze in einzeln pruefbare Aussagen.',
  'data-control.mjs': 'Die Datenhoheit: alles herausgeben, alles zurueckspielen, alles loeschen.',
  'effect-analysis.mjs': 'Die Wirkungsanalyse, die ihre Antworten ausdruecklich als Hypothesen ausweist.',
  'effect-fairness.mjs': 'Die Fairnesspruefung, die nur bei ueberzeugenden Textsorten greift.',
  'evidence-bundle.mjs': 'Das Belegbuendel je Aussage, in acht getrennten Guetefragen bewertet.',
  'example-seed.mjs': 'Der mitgelieferte Beispieltext und sein Umzug auf eine neue Fassung.',
  'final-audit.mjs': 'Die Schlusspruefung vor der Abgabe, in fester Reihenfolge: Fakten vor Stil.',
  'kanaele.mjs': 'Das Kanal-Register: die eine Liste der Kanaele, ueber die Onda mit dem Modell spricht.',
  'language-diagnostics.mjs': 'Der gemeinsame Vertrag fuer Sprachbefunde.',
  'language-modality.mjs': 'Prueft, ob ein Satz mehr behauptet, als er belegt.',
  'language-patterns.mjs': 'Findet wiederkehrende Sprachmuster ueber mehrere Absaetze hinweg.',
  'language-profile.mjs': 'Die gemeinsame Quelle fuer Sprachprofil, Handwerk und Integritaetsregeln.',
  'language-report.mjs': 'Das Gedaechtnis der Sprachpruefung je Text.',
  'language-variant.mjs': 'Prueft, ob eine Umformulierung noch dasselbe sagt wie das Original.',
  'lauf-journal.mjs': 'Die Buchfuehrung ueber jeden bezahlten KI-Lauf.',
  'lauf-tor.mjs': 'Das eine Tor, durch das jeder bezahlte Lauf muss: Sperre, Signatur, Buchung.',
  'live-native-probe.mjs': 'Der bewusst schmale, einmalige Live-Pruefpfad der signierten Mac-App.',
  'memory-dossier.mjs': 'Das Projekt-Dossier: was Onda ueber ein Projekt weiss, in lesbarer Ordnung.',
  'memory-portability.mjs': 'Das Gedaechtnis mitnehmen und wieder loeschen.',
  'memory-retrieval.mjs': 'Waehlt aus, was aus dem Gedaechtnis ueberhaupt bis zum Modell vordringt.',
  'onda-blase.mjs': 'Die Sprechblase, die aus dem Orb waechst — Oberflaeche, aber kein Panel.',
  'onda-icons.mjs': 'Die Symbole der Oberflaeche als Zeichenpfade im Programm statt als Bilddateien.',
  'onda-shell.mjs': 'Die Huelle um alles: der Wechsel zwischen Bibliothek und Schreibraum.',
  'orthography-rules.mjs': 'Die Rechtschreibregeln selbst, als kurze aufgezaehlte Liste.',
  'orthography.mjs': 'Plant Rechtschreibkorrekturen und wendet sie an.',
  'publication-export.mjs': 'Der Weg aus Onda heraus: Markdown, HTML, JATS.',
  'research-adapter.mjs': 'Der Anschluss an ein einzelnes Recherchewerkzeug.',
  'research-orchestrator.mjs': 'Arbeitet die geplanten Recherchewege der Reihe nach ab.',
  'research-run.mjs': 'Der Recherchelauf als Zustand: Plan, Wege, Fortschritt.',
  'research-synthesis.mjs': 'Macht aus einem Fund eine belegte Quelle.',
  'stilmittel.mjs': 'Welches sprachliche Mittel bei dieser Textsorte ueberhaupt traegt.',
  'textart-regeln.mjs': 'Welche der acht Hinweisarten bei welcher Textsorte eine Integritaetsfrage ist.',
  'verstaendnis-interview.mjs': 'Wem das Verstaendnis-Interview gehoert — die zwei Zeiger, die auseinanderlaufen.',
}

// ---------------------------------------------------------------------------------------
// app/test/ — die Regel und die Ausnahmen
// ---------------------------------------------------------------------------------------

const TEST_ENDUNG = '.test.mjs'
const TEST_MERKMAL = 'smoke'

// Zwei Ordner in app/test/ enthalten keine Tests, sondern das, WOMIT geprueft wird. Sie
// stehen als Ordner in der Liste und nicht Datei fuer Datei, denn ein weiteres Pruefstueck
// im selben Ordner ist kein neuer Fall -- und eine Liste, die bei jedem Pruefstueck
// waechst, ist genau die Sorte Liste, die dieser Waechter vermeiden soll.
const TEST_ORDNER_AUSNAHMEN = [
  {
    ordner: ['helpers', 'helfer'],
    // Heute: helpers/onda-navigation.mjs. Die Zielstruktur sieht den Ordnernamen
    // „helfer" vor; beide Schreibweisen gelten hier, damit die Umbenennung den Waechter
    // nicht rot faerbt.
    grund: 'Hilfsmodule, die sich mehrere Rauchtests teilen — selbst kein Test, darum kein .test.mjs.',
  },
  {
    ordner: ['gespeicherte-staende'],
    // Heute: LIESMICH.md, stand-schema-08.json, stand-schema-10.json, stand-schema-12.json.
    grund: 'Echte alte Speicherstaende als Pruefstuecke, mit ihrer LIESMICH.md — Daten, keine Tests.',
  },
]

// ---------------------------------------------------------------------------------------
// Die Ordner lesen — rekursiv
// ---------------------------------------------------------------------------------------

function dateienUnter(ordner) {
  const wurzel = join(WURZEL, ordner)
  if (!existsSync(wurzel)) return null
  return readdirSync(wurzel, { recursive: true })
    .map((name) => String(name).split(sep).join('/'))
    .filter((rel) => statSync(join(wurzel, rel)).isFile())
    .sort()
}

// ---------------------------------------------------------------------------------------
// Pruefen
// ---------------------------------------------------------------------------------------

function pruefeSrc(rel) {
  const name = posix.basename(rel)
  if (SRC_ENDUNGEN.some((endung) => name.endsWith(endung))) return null
  if (SRC_JS.includes(name)) return null
  if (Object.prototype.hasOwnProperty.call(SRC_AUSNAHMEN, rel)) return null
  return [
    'Erlaubt in app/src/ sind Namen auf -model.mjs, -ui.mjs, -kontext.mjs oder .css',
    `sowie die fuenf bekannten .js (${SRC_JS.join(', ')}).`,
  ].join(' ')
}

function pruefeTest(rel) {
  const name = posix.basename(rel)
  if (name.endsWith(TEST_ENDUNG)) return null
  if (name.includes(TEST_MERKMAL)) return null
  const erstesStueck = rel.includes('/') ? rel.slice(0, rel.indexOf('/')) : ''
  const inAusnahmeOrdner = TEST_ORDNER_AUSNAHMEN.some((a) => a.ordner.includes(erstesStueck))
  if (inAusnahmeOrdner) return null
  return 'Erlaubt in app/test/ sind Namen auf .test.mjs oder Namen, die „smoke" enthalten.'
}

const bereiche = [
  { ordner: 'app/src', pruefe: pruefeSrc },
  { ordner: 'app/test', pruefe: pruefeTest },
]

const befunde = []
let gezaehlt = 0
let fehlenderOrdner = null

for (const bereich of bereiche) {
  const dateien = dateienUnter(bereich.ordner)
  if (dateien === null) {
    fehlenderOrdner = bereich.ordner
    break
  }
  gezaehlt += dateien.length
  for (const rel of dateien) {
    const beanstandung = bereich.pruefe(rel)
    if (beanstandung) befunde.push({ pfad: `${bereich.ordner}/${rel}`, hinweis: beanstandung })
  }
}

// ---------------------------------------------------------------------------------------
// Nebenbei: Ausnahmen, die auf nichts mehr zeigen. Das ist KEIN Fehler -- eine
// verschwundene Datei bricht nichts. Es ist nur eine Einladung, die Liste kuerzer zu
// machen, und die Liste kuerzer zu machen ist immer richtig.
// ---------------------------------------------------------------------------------------

const srcDateien = dateienUnter('app/src') ?? []
const veraltet = Object.keys(SRC_AUSNAHMEN).filter((rel) => !srcDateien.includes(rel))

// ---------------------------------------------------------------------------------------
// Der Bericht
// ---------------------------------------------------------------------------------------

console.log('Ort-Waechter (W6) — traegt jede Datei einen Namen, den man ihr ansieht?\n')

if (fehlenderOrdner) {
  console.log(`ROT: Den Ordner ${fehlenderOrdner}/ gibt es nicht. Ohne ihn ist hier nichts zu pruefen.`)
  process.exit(1)
}

console.log(`  ${gezaehlt} Dateien in app/src/ und app/test/ gelesen — beide Ordner rekursiv.`)
console.log(`  ${Object.keys(SRC_AUSNAHMEN).length} namentliche Ausnahmen in app/src/,`)
console.log(`  ${TEST_ORDNER_AUSNAHMEN.length} Ordner-Ausnahmen in app/test/.\n`)

if (veraltet.length > 0) {
  console.log(`  Hinweis (kein Fehler): ${veraltet.length} Ausnahme${veraltet.length === 1 ? '' : 'n'} zeigt`)
  console.log('  auf eine Datei, die es nicht mehr gibt. Sie darf aus der Liste heraus:')
  for (const rel of veraltet) console.log(`      app/src/${rel}`)
  console.log('')
}

if (befunde.length === 0) {
  console.log('GRUEN: Jede Datei folgt der Namensregel oder steht begruendet in der Ausnahmeliste.')
  process.exit(0)
}

console.log(`ROT: ${befunde.length} Datei${befunde.length === 1 ? '' : 'en'} traegt einen Namen, den die Regel nicht kennt:\n`)
for (const b of befunde) {
  console.log(`  ${b.pfad}`)
  console.log(`      ${b.hinweis}`)
}
console.log('')
console.log('Zwei Wege heraus, in dieser Reihenfolge:')
console.log('  1. Die Datei umbenennen, sodass man ihr ansieht, was sie ist. Das ist der Regelfall.')
console.log('  2. Nur wenn das wirklich nicht geht: sie in betrieb/waechter/ort.mjs in die')
console.log('     Ausnahmeliste eintragen — mit einem Satz dazu, was sie ist. Ohne den Satz nicht.')

process.exit(1)
