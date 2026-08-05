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

// Branch-Review-Nacharbeit (Finding 1, Important): vorher matchte dies NUR './agent-gateway'
// (gleicher Ordner). Ein kuenftiger Unterordner wie app/src/kanaele/neuer-kanal.mjs muesste das
// Modul zwangslaeufig relativ nach OBEN importieren ('../agent-gateway.mjs',
// '../../agent-gateway.mjs' usw.) -- so ein Import entkam allen drei Regeln, obwohl
// leseQuelldateien() selbst schon rekursiv scannt (siehe Kommentar dort). (?:\.\.?\/)+ matcht
// eine oder mehrere Folgen von './' oder '../' vor dem Dateinamen. Transport-Pfad analog.
const GATEWAY_PFAD = /['"](?:\.\.?\/)+agent-gateway(?:\.mjs)?['"]/.source
const TRANSPORT_PFAD = /['"](?:\.\.?\/)+agent-transport(?:\.mjs)?['"]/.source

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
//                            "runTask as x" -- der ORIGINALNAME zaehlt, nicht der lokale). Ein
//                            optionaler Default-Bezeichner VOR der Klammer wird toleriert und
//                            haengt den Named-Import-Scan nicht aus (Branch-Review-Nacharbeit,
//                            Finding 3): "import gateway, { runTask } from './agent-gateway.mjs'"
//                            enthielt runTask vorher in einer Klammer, die die alte Regex (die
//                            direkt nach "import"/"export" eine oeffnende "{" verlangte) gar
//                            nicht erst fand, weil "gateway, " dazwischenstand.
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
// - dynamischer Import:      const { runTask } = await import('./agent-gateway.mjs') -- JEDER
//                            dynamische Import von agent-gateway ausserhalb lauf-tor.mjs ist ein
//                            Verstoss, unabhaengig davon, ob das Wort "runTask" auf derselben
//                            Zeile auftaucht (Branch-Review-Nacharbeit, Finding 2: die alte Regex
//                            verlangte "runTask" auf derselben Zeile wie import(...) und entkam
//                            damit einem zweizeiligen Muster wie "const modul = await
//                            import('./agent-gateway.mjs')" gefolgt von "modul.runTask(...)" auf
//                            der naechsten Zeile). Dieselbe Begruendung wie beim
//                            Namespace-Import: ausserhalb von lauf-tor.mjs gibt es dafuer keinen
//                            legitimen Grund -- niemand ausser dem Tor braucht das Modul als
//                            Ganzes.
// [^}]* darf ueber Zeilenumbrueche laufen (kein "." im Zeichensatz-Ausschluss), weil manche
// Imports im Baum mehrzeilig sind (siehe lauf-tor.mjs selbst, Import aus lauf-journal.mjs).
function findeRunTaskImporte(quelle) {
  const treffer = []
  const staticRe = new RegExp(
    `\\b(?:import|export)\\s*(?:[A-Za-z_$][\\w$]*\\s*,\\s*)?\\{([^}]*)\\}\\s*from\\s*${GATEWAY_PFAD}`,
    'g',
  )
  let m
  while ((m = staticRe.exec(quelle))) {
    if (/\brunTask\b/.test(m[1])) treffer.push(m[0].trim())
  }
  const namespaceRe = new RegExp(`\\bimport\\s*\\*\\s*as\\s*\\w+\\s*from\\s*${GATEWAY_PFAD}`, 'g')
  while ((m = namespaceRe.exec(quelle))) treffer.push(m[0].trim())
  const defaultRe = new RegExp(`\\bimport\\s+[A-Za-z_$][\\w$]*\\s*from\\s*${GATEWAY_PFAD}`, 'g')
  while ((m = defaultRe.exec(quelle))) treffer.push(m[0].trim())
  const dynamicRe = new RegExp(`\\bimport\\s*\\(\\s*${GATEWAY_PFAD}\\s*\\)`, 'g')
  while ((m = dynamicRe.exec(quelle))) treffer.push(m[0].trim())
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

// Branch-Review-Nacharbeit (Finding 1, Important): ein Kanal in einem Unterordner
// (app/src/kanaele/neuer-kanal.mjs) muss agent-gateway zwangslaeufig relativ nach OBEN
// importieren -- die alte Regex ('\.\/agent-gateway', nur gleicher Ordner) haette das nicht
// gesehen, obwohl leseQuelldateien() den Unterordner selbst schon rekursiv scannt. Zwei Stufen
// ('../../agent-gateway.mjs') decken zugleich ab, dass (?:\.\.?\/)+ mehr als eine Ebene traegt.
test('ein unterordner-relativer Import von runTask entkommt dem Waechter nicht', () => {
  const kanalEinStufeHoeher =
    "import { runTask } from '../agent-gateway.mjs'\n" +
    "export async function fuehreNeuenKanalAus() { return runTask('chat', {}) }"
  const kanalZweiStufenHoeher =
    "import { runTask } from '../../agent-gateway.mjs'\n" +
    "export async function fuehreNeuenKanalAus() { return runTask('chat', {}) }"
  assert.ok(
    pruefeQuelle('kanaele/neuer-kanal.mjs', kanalEinStufeHoeher).length > 0,
    "ein Import von '../agent-gateway.mjs' muss als Regel-1-Verstoss erkannt werden",
  )
  assert.ok(
    pruefeQuelle('kanaele/tief/neuer-kanal.mjs', kanalZweiStufenHoeher).length > 0,
    "ein Import von '../../agent-gateway.mjs' muss ebenfalls erkannt werden",
  )
})

// Dieselbe Luecke traf Regel 2 (Transport nur vom Gateway) -- derselbe Pfad-Regex-Baustein,
// darum dieselbe Nachbesserung, hier gegen agent-transport.mjs statt agent-gateway.mjs geprueft.
test('ein unterordner-relativer Import von agent-transport entkommt Regel 2 nicht', () => {
  const kanal = "import { irgendwas } from '../agent-transport.mjs'"
  const verstoesse = pruefeQuelle('kanaele/neuer-kanal.mjs', kanal).filter((v) => v.startsWith('Regel 2'))
  assert.ok(verstoesse.length > 0, "ein Import von '../agent-transport.mjs' muss als Regel-2-Verstoss erkannt werden")
})

// Branch-Review-Nacharbeit (Finding 2, Minor): die alte dynamicRe verlangte "runTask" auf
// DERSELBEN Zeile wie der import(...)-Aufruf -- ein zweizeiliges Muster (Zuweisung des Moduls
// in einer Zeile, Zugriff auf runTask in der naechsten) entkam. Jetzt zaehlt JEDER dynamische
// Import von agent-gateway ausserhalb lauf-tor.mjs als Verstoss, unabhaengig von der Zeile.
test('ein zweizeiliger dynamischer Import von agent-gateway wird ebenfalls erkannt', () => {
  const vergessenerKanal =
    "export async function fuehreNeuenKanalAus() {\n" +
    "  const modul = await import('./agent-gateway.mjs')\n" +
    "  return modul.runTask('chat', {})\n" +
    '}'
  const verstoesse = pruefeQuelle('zweizeiliger-kanal.mjs', vergessenerKanal)
  assert.ok(
    verstoesse.length > 0,
    'ein dynamischer Import von agent-gateway ist immer ein Verstoss, auch wenn runTask erst in einer spaeteren Zeile auftaucht',
  )
})

// Ledger T10: defaultRe (Default-Import, "import gateway from './agent-gateway.mjs'") hatte
// bisher keinen eigenen Test, obwohl agent-gateway.mjs gar keinen Default-Export besitzt und ein
// solcher Import ohnehin ein Bug waere -- billig mitgeprueft, aber bislang unbewiesen.
test('ein Default-Import von agent-gateway wird als Verstoss erkannt', () => {
  const vergessenerKanal = "import gateway from './agent-gateway.mjs'"
  const verstoesse = pruefeQuelle('default-kanal.mjs', vergessenerKanal)
  assert.ok(verstoesse.length > 0, "ein Default-Import von agent-gateway.mjs muss erkannt werden, auch ohne Default-Export dort")
})

// Ledger T10: die Kombiform (Default- + benannter Import in einem Ausdruck) entging der alten
// staticRe -- die verlangte eine oeffnende "{" DIREKT nach "import"/"export", und "gateway, "
// stand dazwischen. Die Regex traegt jetzt einen optionalen Default-Bezeichner vor der Klammer.
test('die Kombiform aus Default- und benanntem Import (runTask) wird erkannt', () => {
  const vergessenerKanal =
    "import gateway, { runTask } from './agent-gateway.mjs'\n" +
    "export async function fuehreNeuenKanalAus() { return runTask('chat', {}) }"
  const verstoesse = pruefeQuelle('kombi-kanal.mjs', vergessenerKanal)
  assert.ok(
    verstoesse.length > 0,
    "die Kombiform 'import gateway, { runTask } from ...' muss als Regel-1-Verstoss erkannt werden",
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
