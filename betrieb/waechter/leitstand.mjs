// W10 — der Leitstand-Waechter.
//
// Er prueft eine einzige Sache: Zu dem Zweig, an dem gerade gearbeitet wird, gibt es eine
// Datei betrieb/leitstand/<zweigname>.md.
//
// EHRLICH ZU SEINER GRENZE, damit niemand mehr erwartet als da ist: Dieser Waechter prueft
// ANWESENHEIT, NICHT WAHRHEIT. Eine Datei mit dem Satz „mache Sachen" besteht ihn ohne
// weiteres. Ob darin steht, woran der Zweig arbeitet, ob das noch stimmt, ob es jemandem
// hilft -- das kann er nicht wissen und behauptet es auch nicht. Was er verhindert, ist
// genau ein Fall, und der ist haeufig genug: der Zweig, der ueberhaupt nichts ueber sich
// sagt. Ob der Eintrag taugt, entscheidet ein Mensch beim Lesen des Pull Requests.
//
// Warum das ueberhaupt jemanden kuemmert: Es ist einmal teuer schiefgegangen. Zwei
// Arbeiten liefen drei Tage lang parallel an derselben Stelle -- die eine schaffte eine
// abgeschriebene Bauweise ab, die andere schrieb sie waehrenddessen ein weiteres Mal ab.
// Beide hatten recht, keiner konnte den anderen sehen. Die Geschichte steht ausfuehrlich
// in betrieb/LEITSTAND.md; dort steht auch die Regel, die dieser Waechter durchsetzt.
//
// DER DATEINAME. Aus dem Zweignamen wird der Dateiname, indem jeder Schraegstrich zu einem
// Bindestrich wird: aus dem Zweig claude/d-28fv4p wird claude-d-28fv4p.md. Sonst wird
// nichts umgeschrieben -- was im Zweignamen steht, steht auch im Dateinamen. (Umlaute
// gehoeren in keinen Zweignamen und darum auch in keinen Dateinamen.)
//
// WOHER DER ZWEIGNAME KOMMT, in dieser Reihenfolge:
//   1. ONDA_ZWEIG            -- von Hand gesetzt. Damit laesst sich die Gegenprobe machen
//                              („was sagt er zu einem Zweig ohne Eintrag"), ohne den
//                              echten Zweig zu wechseln.
//   2. GITHUB_HEAD_REF       -- in der GitHub-Pruefung eines Pull Requests. Dort liegt
//                              KEIN Zweig ausgecheckt, sondern ein loser Zusammenfuehr-
//                              Stand; git wuesste also nichts zu sagen, die Umgebung schon.
//   3. git                   -- der ganz normale Fall auf dem eigenen Rechner.
//
// WANN ER SCHWEIGT, und warum das kein Loch ist:
//   - Auf dem Hauptzweig (main/master) gibt es keinen Pull Request und darum nichts zu
//     verlangen. Ein Leitstand-Eintrag beschreibt eine LAUFENDE Arbeit; der Hauptzweig ist
//     das Ergebnis, nicht die Arbeit.
//   - Wenn sich gar kein Zweigname ermitteln laesst (kein git, loser Stand ohne Umgebungs-
//     angabe), sagt er das laut und endet gruen. Ein Waechter, der aus Nichtwissen rot
//     faerbt, wird abgeschaltet, und ein abgeschalteter Waechter prueft gar nichts mehr.
//
// Was er ausserdem NICHT tut: Er verlangt nicht, dass der Eintrag zu diesem Pull Request
// aktuell ist, und er liest die anderen Eintraege nicht. Eine Textpruefung darauf haette
// immer zugleich recht und unrecht -- fuer jeden ehrlichen Sonderfall braeuchte sie eine
// Ausnahme, und Ausnahmelisten wachsen.

import { existsSync, readFileSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const WURZEL = fileURLToPath(new URL('../../', import.meta.url))
const LEITSTAND_ORDNER = 'betrieb/leitstand'

// Zweige, auf denen nicht gearbeitet, sondern zusammengefuehrt wird.
const HAUPTZWEIGE = ['main', 'master']

// Unterhalb dieser Zeichenzahl ist ein Eintrag zwar vorhanden, sagt aber kaum etwas. Das
// ist ein HINWEIS und kein Fehler: Wo genau „kaum etwas" anfaengt, kann ein Programm nicht
// entscheiden, und eine Mindestlaenge liesse sich mit Fuellwoertern erfuellen.
const KNAPP_UNTER = 200

// ---------------------------------------------------------------------------------------
// Den Zweignamen ermitteln
// ---------------------------------------------------------------------------------------

function zweigAusGit() {
  const lauf = spawnSync('git', ['branch', '--show-current'], {
    cwd: WURZEL,
    encoding: 'utf8',
  })
  if (lauf.status !== 0 || typeof lauf.stdout !== 'string') return ''
  return lauf.stdout.trim()
}

function ermittleZweig() {
  const vonHand = (process.env.ONDA_ZWEIG || '').trim()
  if (vonHand) return { zweig: vonHand, woher: 'der Umgebungsangabe ONDA_ZWEIG' }

  const vomPullRequest = (process.env.GITHUB_HEAD_REF || '').trim()
  if (vomPullRequest) return { zweig: vomPullRequest, woher: 'der GitHub-Angabe GITHUB_HEAD_REF' }

  const vonGit = zweigAusGit()
  if (vonGit) return { zweig: vonGit, woher: 'git branch --show-current' }

  return { zweig: '', woher: '' }
}

// ---------------------------------------------------------------------------------------
// Aus dem Zweignamen den Dateinamen machen
// ---------------------------------------------------------------------------------------

function dateinameFuer(zweig) {
  return `${zweig.split('/').join('-')}.md`
}

// ---------------------------------------------------------------------------------------
// Der Lauf
// ---------------------------------------------------------------------------------------

console.log('Leitstand-Waechter (W10) — sagt dieser Zweig irgendwo, woran er arbeitet?\n')

const { zweig, woher } = ermittleZweig()

if (!zweig) {
  console.log('  Kein Zweigname zu ermitteln — weder ONDA_ZWEIG noch GITHUB_HEAD_REF noch git.')
  console.log('  Das kommt bei einem losen Stand ohne Zweig vor.\n')
  console.log('GRUEN: Ohne Zweig gibt es keinen Eintrag zu verlangen. Hier ist nichts zu pruefen.')
  process.exit(0)
}

console.log(`  Zweig: ${zweig}  (aus ${woher})`)

if (HAUPTZWEIGE.includes(zweig)) {
  console.log('  Das ist der Hauptzweig — dort wird zusammengefuehrt, nicht gearbeitet.\n')
  console.log('GRUEN: Ein Leitstand-Eintrag beschreibt eine laufende Arbeit. Hier laeuft keine.')
  process.exit(0)
}

const relativerPfad = `${LEITSTAND_ORDNER}/${dateinameFuer(zweig)}`
const vollerPfad = join(WURZEL, relativerPfad)
const vorhanden = existsSync(vollerPfad) && statSync(vollerPfad).isFile()

console.log(`  Erwarteter Eintrag: ${relativerPfad}\n`)

if (vorhanden) {
  const zeichen = readFileSync(vollerPfad, 'utf8').trim().length
  if (zeichen < KNAPP_UNTER) {
    console.log(`  Hinweis (kein Fehler): Der Eintrag hat nur ${zeichen} Zeichen. Vorhanden ist er,`)
    console.log('  aber ob er jemandem hilft, entscheidet ein Mensch — nicht dieser Waechter.\n')
  }
  console.log('GRUEN: Der Eintrag ist da.')
  console.log('       Geprueft ist damit seine ANWESENHEIT, nicht sein Inhalt.')
  process.exit(0)
}

console.log(`ROT: Zum Zweig ${zweig} gibt es keinen Leitstand-Eintrag.\n`)
console.log('Der Weg heraus ist ein einziger Handgriff — die Datei anlegen:\n')
console.log(`    ${relativerPfad}\n`)
console.log('Hinein gehoert, in eigenen Worten und ohne Fachjargon:')
console.log('  - Woran dieser Zweig arbeitet, in einem Satz.')
console.log('  - Was fertig ist — und ein Befehl, mit dem man das nachsehen kann.')
console.log('  - Was noch offen ist.')
console.log('  - Was jemand anders wissen muss, der denselben Bereich anfasst.')
console.log('')
console.log('Die Regel dahinter steht in betrieb/LEITSTAND.md, das Revier dazu in betrieb/REVIERE.md.')
process.exit(1)
