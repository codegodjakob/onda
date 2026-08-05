import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Der Rueckwachs-Waechter (Issue #12, Task 10): macht die Bau-Regel aus lauf-tor.mjs zum Test.
// "Rueckwachs", weil genau das die Gefahr ist, die dieser Test verhindert -- ein neuer Kanal
// (oder ein alter, der refaktoriert wird) waechst am Tor VORBEI zurueck zu einem direkten
// runTask-Aufruf, so wie es vor Issue #12 ueberall der Fall war. Vorbild fuer den Quelltext-Scan:
// verstaendnis-interview.test.mjs:26-40 (liest workspace.js als Quelle, prueft Muster drin).

const SRC_URL = new URL('../src/', import.meta.url)
const SRC_DIR = fileURLToPath(SRC_URL)

// { recursive: true } (Node 22), damit ein kuenftiger Unterordner (z.B. app/src/kanaele/
// neuer-kanal.mjs) den Waechter nicht blind macht -- ein flaches readdirSync wuerde
// Unterverzeichnisse und alles darin stillschweigend uebergehen. Liefert relative Pfade mit
// '/'-Trennzeichen, die new URL(name, SRC_URL) korrekt gegen SRC_URL aufloest.
function leseQuelldateien() {
  return readdirSync(SRC_DIR, { recursive: true })
    .filter((name) => name.endsWith('.js') || name.endsWith('.mjs'))
    .map((name) => ({ name, quelle: readFileSync(new URL(name, SRC_URL), 'utf8') }))
}

// Entfernt reine Kommentarzeilen (Zeilen, deren getrimmter Inhalt mit // beginnt) VOR jeder
// Musterpruefung. Grund: die Umbauten aus Task 4-8 hinterlassen bewusst erklärende Kommentare
// wie "(frueher hier als hinweislaufAktiv)" -- das ist Prosa ueber die Vergangenheit, keine
// lebende Deklaration, und darf den Waechter nicht ausloesen. Block-Kommentare (/* */) kommen
// in app/src nicht vor (gegengeprueft), darum reicht die einfache zeilenweise Variante -- kein
// Grund, einen echten Parser fuer einen Fall zu bauen, den es im Baum nicht gibt.
function ohneKommentarzeilen(quelle) {
  return quelle
    .split('\n')
    .filter((zeile) => !zeile.trim().startsWith('//'))
    .join('\n')
}

const GATEWAY_PFAD = /['"]\.\/agent-gateway(?:\.mjs)?['"]/.source
const TRANSPORT_PFAD = /['"]\.\/agent-transport(?:\.mjs)?['"]/.source

// Regel 1: welche Dateien duerfen runTask NEBEN lauf-tor.mjs aus agent-gateway importieren.
// Nach Task 4 (editor.js hat runTask abgegeben) ist diese Ausnahmenliste LEER -- und SIE IST
// LEER. Sie darf nur noch schrumpfen (was bei einem leeren Array nicht mehr geht) und nie
// wachsen: jeder neue Eintrag waere ein neuer, stillschweigend genehmigter Weg am Tor vorbei.
const RUNTASK_AUSNAHMEN = []
const ERLAUBTE_RUNTASK_IMPORTEURE = new Set(['lauf-tor.mjs', ...RUNTASK_AUSNAHMEN])

// Findet jeden Ausdruck, der die Bindung runTask aus agent-gateway ins Modul holt -- ausser
// dem Sammel-Re-Export (export * from ...), der unten separat und OHNE Ausnahme gefuehrt
// wird (siehe findeSternReExportGateway). Diese Funktion hier wird nur fuer Dateien
// ausgewertet, die NICHT in ERLAUBTE_RUNTASK_IMPORTEURE stehen (siehe pruefeQuelle) -- das
// ist korrekt fuer alle vier Zweige unten, denn lauf-tor.mjs braucht keinen von ihnen: es holt
// runTask ausschliesslich per benanntem Import mit Alias (import { runTask as gatewayRunTask }).
// - statischer Import:      import { runTask } from './agent-gateway.mjs'  (auch mit Alias:
//                            "runTask as x" -- der ORIGINALNAME zaehlt, nicht der lokale)
// - Re-Export:               export { runTask } from './agent-gateway.mjs' (selbe Regex, weil
//                            "import|export ... from" beide Formen abdeckt)
// - Namespace-Import:        import * as gateway from './agent-gateway.mjs' -- macht JEDE
//                            Bindung erreichbar (gateway.runTask(...)), ohne dass das Wort
//                            "runTask" irgendwo im importierenden Modul auftaucht -- die
//                            namensbasierte Pruefung der anderen Zweige greift hier nicht.
//                            Ausserhalb von lauf-tor.mjs gibt es dafuer keinen legitimen
//                            Grund: die erlaubten Namen (hatSchluessel, initGateway,
//                            setzeSchluessel, loescheSchluessel, setzeTransportFuerTests) werden
//                            im Baum durchweg benannt importiert -- ein Namespace-Import selbst
//                            ist darum schon der Verstoss, unabhaengig davon, ob runTask sichtbar
//                            aufgerufen wird.
// - Default-Import:          import gateway from './agent-gateway.mjs' -- agent-gateway.mjs hat
//                            keinen Default-Export, ein solcher Import waere ohnehin ein Bug,
//                            aber billig mitzupruefen, damit er nicht als unentdeckter vierter
//                            Weg am Tor vorbei durchgeht.
// - dynamischer Import:      const { runTask } = await import('./agent-gateway.mjs') -- hier
//                            reicht der billige Check "Zeile erwaehnt sowohl den Import-Aufruf
//                            als auch das Wort runTask", denn im Baum gibt es aktuell keinen
//                            einzigen dynamischen Import (gegengeprueft) -- dieser Zweig ist
//                            Vorsorge, kein beobachtetes Muster.
// [^}]* darf ueber Zeilenumbrueche laufen (kein "." im Zeichensatz-Ausschluss), weil manche
// Imports im Baum mehrzeilig sind (siehe lauf-tor.mjs selbst, Import aus lauf-journal.mjs).
function findeRunTaskImporte(quelle) {
  const treffer = []
  const staticRe = new RegExp(`\\b(?:import|export)\\s*\\{([^}]*)\\}\\s*from\\s*${GATEWAY_PFAD}`, 'g')
  let m
  while ((m = staticRe.exec(quelle))) {
    if (/\brunTask\b/.test(m[1])) treffer.push(m[0].trim())
  }
  const namespaceRe = new RegExp(`\\bimport\\s*\\*\\s*as\\s*\\w+\\s*from\\s*${GATEWAY_PFAD}`, 'g')
  while ((m = namespaceRe.exec(quelle))) treffer.push(m[0].trim())
  const defaultRe = new RegExp(`\\bimport\\s+[A-Za-z_$][\\w$]*\\s*from\\s*${GATEWAY_PFAD}`, 'g')
  while ((m = defaultRe.exec(quelle))) treffer.push(m[0].trim())
  const dynamicRe = new RegExp(`[^\\n]*\\bimport\\s*\\(\\s*${GATEWAY_PFAD}\\s*\\)[^\\n]*`, 'g')
  while ((m = dynamicRe.exec(quelle))) {
    if (/\brunTask\b/.test(m[0])) treffer.push(m[0].trim())
  }
  return treffer
}

// Sammel-Re-Export (export * from './agent-gateway.mjs', auch mit "as x"-Namensraum) wuerde
// runTask stillschweigend an jeden weiterreichen, der die re-exportierende Datei importiert --
// IMMER ein Verstoss, OHNE Ausnahme fuer lauf-tor.mjs: das Tor exportiert sein eigenes
// bewachtes torRunTask (ueber fuehreLaufAus), nicht das rohe Gateway-runTask, braucht also
// diesen Weg so wenig wie jede andere Datei.
function findeSternReExportGateway(quelle) {
  const re = new RegExp(`\\bexport\\s*\\*\\s*(?:as\\s*\\w+\\s*)?from\\s*${GATEWAY_PFAD}`, 'g')
  return quelle.match(re) || []
}

// Regel 2: agent-transport.mjs ist nur vom Gateway aus erreichbar. Anders als bei Regel 1
// zaehlt hier JEDER Import/Re-Export/dynamische Import des Moduls als Verstoss, unabhaengig
// vom importierten Namen -- der Transport hat keine oeffentliche Oberflaeche, die irgendwer
// ausser dem Gateway kennen darf.
function findeTransportImporte(quelle) {
  const re = new RegExp(`\\bfrom\\s*${TRANSPORT_PFAD}|\\bimport\\s*\\(\\s*${TRANSPORT_PFAD}\\s*\\)`, 'g')
  return quelle.match(re) || []
}

// Regel 3: die vier Sperr-Variablen aus der Vor-Tor-Zeit duerfen in workspace.js nicht mehr
// als lebender Code auftauchen. Erkannt werden Deklarationen (let/const/var NAME) und
// Zuweisungen (NAME = ..., mit [^=] danach, damit NAME == oder NAME === nicht mitzaehlt) --
// nicht die blosse Namensnennung, denn die kommt (nach dem Kommentar-Filter oben) ohnehin nur
// noch in Funktionsnamen wie clearHinweislaufTimer vor, die etwas anderes sind als die
// Variable selbst.
const SPERR_VARIABLEN = ['hinweislaufAktiv', 'erweiterungslaufAktiv', 'interviewLaufAktiv', 'laufenderChatLauf']

function findeSperrVariablen(quelle) {
  const treffer = []
  for (const name of SPERR_VARIABLEN) {
    const re = new RegExp(`\\b(?:let|const|var)\\s+${name}\\b|\\b${name}\\s*=[^=]`, 'g')
    const funde = quelle.match(re)
    if (funde) treffer.push(...funde.map((f) => `${name}: ${f.trim()}`))
  }
  return treffer
}

// Die zentrale Pruefung: eine Datei (Name + Quelltext) gegen alle drei Regeln. Lokal im Testfile
// (nicht in src/ exportiert), damit die Negativ-Probe (Abnahme #3) exakt dieselbe Logik trifft,
// die auch die echten Dateien prueft -- keine zweite, driftende Kopie der Regeln.
function pruefeQuelle(dateiname, quelle) {
  const verstoesse = []
  const bereinigt = ohneKommentarzeilen(quelle)

  if (!ERLAUBTE_RUNTASK_IMPORTEURE.has(dateiname)) {
    for (const treffer of findeRunTaskImporte(bereinigt)) {
      verstoesse.push(`Regel 1 (runTask nur ueber das Tor) verletzt in ${dateiname}: ${treffer}`)
    }
  }

  // Ohne Ausnahme fuer lauf-tor.mjs (siehe Begruendung an findeSternReExportGateway).
  for (const treffer of findeSternReExportGateway(bereinigt)) {
    verstoesse.push(`Regel 1 (kein Sammel-Re-Export von agent-gateway) verletzt in ${dateiname}: ${treffer}`)
  }

  if (dateiname !== 'agent-gateway.mjs') {
    for (const treffer of findeTransportImporte(bereinigt)) {
      verstoesse.push(`Regel 2 (Transport nur vom Gateway) verletzt in ${dateiname}: ${treffer}`)
    }
  }

  if (dateiname === 'workspace.js') {
    for (const treffer of findeSperrVariablen(bereinigt)) {
      verstoesse.push(`Regel 3 (keine eigenen Sperr-Variablen) verletzt in workspace.js: ${treffer}`)
    }
  }

  return verstoesse
}

test('kein Kanal erreicht runTask am Tor vorbei (Abnahme #1)', () => {
  const verstoesse = leseQuelldateien().flatMap(({ name, quelle }) => pruefeQuelle(name, quelle))
  assert.deepEqual(verstoesse, [], 'jeder Verstoss oben zeigt einen Umbau, der noch nicht fertig ist')
})

test('ein vergessener neuer Kanal ohne Tor ist nicht schreibbar (Abnahme #3)', () => {
  const vergessenerKanal =
    "import { runTask } from './agent-gateway.mjs'\n" +
    "export async function fuehreNeuenKanalAus() { return runTask('chat', {}) }"
  const verstoesse = pruefeQuelle('neuer-kanal.mjs', vergessenerKanal)
  assert.ok(
    verstoesse.length > 0,
    'ein Kanal, der runTask direkt importiert, muss vom Waechter erkannt werden',
  )
})

test('ein dynamischer Import von runTask wird ebenfalls erkannt', () => {
  const vergessenerKanal =
    "export async function fuehreNeuenKanalAus() {\n" +
    "  const { runTask } = await import('./agent-gateway.mjs')\n" +
    "  return runTask('chat', {})\n" +
    '}'
  const verstoesse = pruefeQuelle('anderer-kanal.mjs', vergessenerKanal)
  assert.ok(verstoesse.length > 0, 'auch ein dynamischer Import von runTask ist ein Verstoss gegen Regel 1')
})

test('ein Re-Export von runTask wird ebenfalls erkannt', () => {
  const weitergereicht = "export { runTask } from './agent-gateway.mjs'"
  const verstoesse = pruefeQuelle('weiterreicher.mjs', weitergereicht)
  assert.ok(verstoesse.length > 0, 'ein Re-Export von runTask oeffnet denselben Weg am Tor vorbei')
})

// Review-Fund (Gap 1): der klammer-verankerte Regex fuer benannte Imports sieht einen
// Namespace-Import nicht -- "gateway.runTask(...)" enthaelt das Wort runTask nirgends im
// Quelltext des importierenden Moduls, nur im ZUGRIFF auf das Namespace-Objekt. Ohne diesen
// Test wuerde die Luecke unbemerkt bleiben, denn der bestehende Baum nutzt keine
// Namespace-Importe (siehe Report) -- der Test beweist, dass der Waechter die Umgehung trotzdem
// faengt, sollte sie je auftauchen.
test('ein Namespace-Import von agent-gateway wird als Verstoss erkannt (auch ohne das Wort runTask im Text)', () => {
  const vergessenerKanal =
    "import * as gateway from './agent-gateway.mjs'\n" +
    "export async function fuehreNeuenKanalAus() { return gateway.runTask('chat', {}) }"
  const verstoesse = pruefeQuelle('namespace-kanal.mjs', vergessenerKanal)
  assert.ok(
    verstoesse.length > 0,
    'ein Namespace-Import von agent-gateway macht runTask erreichbar, ohne dass "runTask" im Quelltext steht -- muss trotzdem erkannt werden',
  )
})

// Review-Fund (Gap 1): ein Sammel-Re-Export wuerde runTask an jeden Importeur der
// re-exportierenden Datei weiterreichen -- keine Ausnahme, auch nicht fuer lauf-tor.mjs
// (Begruendung an findeSternReExportGateway).
test('ein Stern-Re-Export von agent-gateway wird als Verstoss erkannt, ausnahmslos', () => {
  const sammelReExport = "export * from './agent-gateway.mjs'"
  assert.ok(pruefeQuelle('barrel.mjs', sammelReExport).length > 0, 'ein Sammel-Re-Export oeffnet runTask fuer jeden Importeur')
  assert.ok(
    pruefeQuelle('lauf-tor.mjs', sammelReExport).length > 0,
    'auch lauf-tor.mjs selbst darf agent-gateway nicht per Sammel-Re-Export weiterreichen',
  )
})

test('die Ausnahmenliste zu Regel 1 ist leer und darf es bleiben (Minor-Fund)', () => {
  assert.equal(
    RUNTASK_AUSNAHMEN.length,
    0,
    'RUNTASK_AUSNAHMEN darf nur schrumpfen und muss leer enden -- ein neuer Eintrag waere ein neuer, stillschweigend genehmigter Weg am Tor vorbei',
  )
})

test('workspace.js besitzt keine eigenen Sperr-Variablen mehr (Regel 3)', () => {
  const quelle = readFileSync(new URL('workspace.js', SRC_URL), 'utf8')
  const verstoesse = pruefeQuelle('workspace.js', quelle).filter((v) => v.startsWith('Regel 3'))
  assert.deepEqual(verstoesse, [], 'die vier Sperr-Variablen leben jetzt ausschliesslich im Lauf-Tor')
})

test('der Transport ist nur vom Gateway erreichbar (Regel 2)', () => {
  const verstoesse = leseQuelldateien()
    .flatMap(({ name, quelle }) => pruefeQuelle(name, quelle))
    .filter((v) => v.startsWith('Regel 2'))
  assert.deepEqual(verstoesse, [], 'agent-transport.mjs darf ausser agent-gateway.mjs niemand importieren')
})
