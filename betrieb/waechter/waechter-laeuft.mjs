// W3 — der Waechter-Waechter.
//
// Er prueft eine einzige Sache: Jede Pruefdatei, die es gibt, wird auch von irgendetwas
// gestartet.
//
// Warum das noetig ist: Eine Pruefung, die niemand startet, ist schlimmer als keine. Sie
// sieht im Baum aus wie ein Schutz, kostet niemanden etwas und meldet nie einen Fehler --
// weil sie nie laeuft. Genau das war der schwerste Einzelbefund der Bestandsaufnahme:
// app/evals/pruefungen/schluessel-leck.mjs, die Pruefung gegen ein Durchsickern des
// API-Schluessels in einen Export, kam in keiner Bindung vor, in keinem npm-Skript und in
// keinem Import. Sie lag Monate im Baum und lief kein einziges Mal.
//
// Zwei Ordner werden ueberwacht:
//   app/evals/pruefungen/   -- die eigenstaendigen Pruefungen
//   betrieb/waechter/       -- die Waechter selbst (auch diese Datei hier)
//
// Vier Belege zaehlen als "wird gestartet":
//   1. app/evals/bindungen.json  -- der Fertigzustand-Lauf startet jede gebundene Datei
//   2. app/package.json          -- ein npm-Skript startet sie
//   3. ein Aufruf oder Import aus einer anderen Pruef-, Test- oder Skriptdatei
//   4. betrieb/waechter/alle.mjs -- der Sammler startet jede .mjs-Datei in seinem Ordner
//
// Wer keinen einzigen dieser Belege hat, macht diesen Waechter rot.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, resolve, sep } from 'node:path'

const WURZEL = fileURLToPath(new URL('../../', import.meta.url))
const APP = join(WURZEL, 'app')
const WAECHTER_ORDNER = join(WURZEL, 'betrieb', 'waechter')
const PRUEF_ORDNER = join(APP, 'evals', 'pruefungen')
const SAMMLER = join(WAECHTER_ORDNER, 'alle.mjs')

// Ordner, in denen nach Aufrufen und Importen gesucht wird. Fremder oder erzeugter Code
// bleibt aussen vor: ein Buendel unter dist/ oder ein Paket unter node_modules/ startet
// nichts, was uns hier interessiert.
const SUCH_ORDNER = [
  join(APP, 'test'),
  join(APP, 'evals'),
  join(APP, 'scripts'),
  join(APP, 'src'),
  join(WURZEL, 'tools'),
  join(WURZEL, 'betrieb'),
]
const UEBERSPRUNGENE_ORDNER = new Set(['node_modules', 'dist', 'build', '.git', 'results'])

// ---------------------------------------------------------------------------------------
// Ausnahmen. Jede einzeln begruendet -- eine Ausnahme ohne Grund ist ein Loch im Netz.
// ---------------------------------------------------------------------------------------
const AUSNAHMEN = new Map([
  [
    'betrieb/waechter/alle.mjs',
    'Der Sammler selbst. Er ist die Eingangstuer, die von Hand oder von der '
      + 'GitHub-Pruefung aufgestossen wird -- er kann sich nicht selbst starten.',
  ],
])

// ---------------------------------------------------------------------------------------
// Kandidaten sammeln
// ---------------------------------------------------------------------------------------

function sammleMjs(ordner) {
  let eintraege
  try {
    eintraege = readdirSync(ordner, { withFileTypes: true })
  } catch {
    return []
  }
  const gefunden = []
  for (const eintrag of eintraege) {
    const pfad = join(ordner, eintrag.name)
    if (eintrag.isDirectory()) {
      if (UEBERSPRUNGENE_ORDNER.has(eintrag.name) || eintrag.name.startsWith('.')) continue
      gefunden.push(...sammleMjs(pfad))
    } else if (/\.(?:mjs|cjs|js)$/.test(eintrag.name)) {
      gefunden.push(pfad)
    }
  }
  return gefunden
}

function alsProjektpfad(pfad) {
  return relative(WURZEL, pfad).split(sep).join('/')
}

function alsAppPfad(pfad) {
  return relative(APP, pfad).split(sep).join('/')
}

const kandidaten = [...sammleMjs(PRUEF_ORDNER), ...sammleMjs(WAECHTER_ORDNER)].sort()

// ---------------------------------------------------------------------------------------
// Beleg 1 und 2: die beiden JSON-Dateien nennen die Datei beim Namen
// ---------------------------------------------------------------------------------------

function liesText(pfad) {
  try {
    return readFileSync(pfad, 'utf8')
  } catch {
    return ''
  }
}

const bindungsText = liesText(join(APP, 'evals', 'bindungen.json'))
const paketText = liesText(join(APP, 'package.json'))

// ---------------------------------------------------------------------------------------
// Beleg 3: eine andere Datei startet sie wirklich
//
// Hier liegt der ganze Wert dieses Waechters, und darum wird hier eng gesucht. Eine Datei
// zu NENNEN ist kein Starten. app/test/massstab-waechter.test.mjs nennt
// "evals/pruefungen/schluessel-leck.mjs" als Beispielwert in einer Behauptung, und
// app/test/typografie.test.mjs liest "evals/pruefungen/gestalt.mjs" als Text ein, um darin
// nach Woertern zu suchen -- beides startet nichts. Ein Waechter, der solche Erwaehnungen
// als Beleg durchgehen laesst, gibt genau das Gruen, gegen das er gebaut wurde.
//
// Als Start zaehlen deshalb nur zwei Formen:
//   a) die Datei steht als Modul hinter from / import / require
//   b) die Datei steht in einer Zeile, die einen Prozess startet
//      (spawn, exec, execFile, fork, ausfuehren)
//
// Reine Kommentarzeilen werden gar nicht erst gelesen.
// ---------------------------------------------------------------------------------------

const MODULMUSTER = /(?:\bfrom|\bimport|\brequire)\s*\(?\s*['"`]([^'"`\n]+\.(?:mjs|cjs|js))['"`]/g
const ZEICHENKETTE = /['"`]([^'"`\n]+\.(?:mjs|cjs|js))['"`]/g
const PROZESSSTART = /\b(?:spawnSync|spawn|execFileSync|execFile|execSync|exec|fork|ausfuehren)\s*\(/

function sammleAufrufe() {
  const aufrufe = new Map() // absoluter Pfad -> Set von Fundstellen
  const gesehen = new Set()
  for (const ordner of SUCH_ORDNER) {
    for (const datei of sammleMjs(ordner)) {
      if (gesehen.has(datei)) continue
      gesehen.add(datei)
      const zeilen = liesText(datei).split('\n')
      zeilen.forEach((zeile, nummer) => {
        if (zeile.trim().startsWith('//')) return
        const genannte = new Set()
        for (const treffer of zeile.matchAll(MODULMUSTER)) genannte.add(treffer[1])
        if (PROZESSSTART.test(zeile)) {
          for (const treffer of zeile.matchAll(ZEICHENKETTE)) genannte.add(treffer[1])
        }
        for (const genannt of genannte) {
          for (const wurzel of [dirname(datei), APP, WURZEL]) {
            const ziel = resolve(wurzel, genannt)
            if (ziel === datei) continue // niemand startet sich selbst
            let istDatei = false
            try {
              istDatei = statSync(ziel).isFile()
            } catch {
              istDatei = false
            }
            if (!istDatei) continue
            if (!aufrufe.has(ziel)) aufrufe.set(ziel, new Set())
            aufrufe.get(ziel).add(`${alsProjektpfad(datei)}:${nummer + 1}`)
            break
          }
        }
      })
    }
  }
  return aufrufe
}

const aufrufe = sammleAufrufe()

// ---------------------------------------------------------------------------------------
// Beleg 4: der Sammler betrieb/waechter/alle.mjs startet jede .mjs-Datei seines Ordners
//
// Das wird nicht geglaubt, sondern nachgesehen: der Sammler muss seinen Ordner wirklich
// rekursiv auslesen und auf .mjs filtern. Baut jemand ihn zu einer Liste um, in die man
// sich eintragen muss, faellt dieser Beleg weg -- und alle Waechter stehen ploetzlich ohne
// Starter da. Genau dann soll es hier laut werden.
// ---------------------------------------------------------------------------------------

const sammlerText = liesText(SAMMLER)
const sammlerLiestOrdner = /readdirSync/.test(sammlerText)
  && /recursive:\s*true/.test(sammlerText)
  && /\.mjs/.test(sammlerText)

// ---------------------------------------------------------------------------------------
// Der Lauf
// ---------------------------------------------------------------------------------------

const ohneStarter = []
const mitStarter = []
const ausgenommen = []

for (const kandidat of kandidaten) {
  const projektpfad = alsProjektpfad(kandidat)
  if (AUSNAHMEN.has(projektpfad)) {
    ausgenommen.push({ projektpfad, grund: AUSNAHMEN.get(projektpfad) })
    continue
  }

  const apppfad = alsAppPfad(kandidat)
  const belege = []

  if (bindungsText.includes(apppfad) || bindungsText.includes(projektpfad)) {
    belege.push('app/evals/bindungen.json')
  }
  if (paketText.includes(apppfad) || paketText.includes(projektpfad)) {
    belege.push('app/package.json')
  }
  const stellen = aufrufe.get(kandidat)
  if (stellen && stellen.size > 0) {
    belege.push(`Aufruf in ${[...stellen].sort().slice(0, 3).join(', ')}`)
  }
  if (sammlerLiestOrdner && kandidat.startsWith(WAECHTER_ORDNER + sep)) {
    belege.push('betrieb/waechter/alle.mjs (startet jede .mjs-Datei im Ordner)')
  }

  if (belege.length === 0) ohneStarter.push({ projektpfad, apppfad })
  else mitStarter.push({ projektpfad, belege })
}

console.log('Waechter-Waechter (W3) — wird jede Pruefdatei auch von etwas gestartet?\n')
console.log(`  ${kandidaten.length} Dateien gefunden in app/evals/pruefungen/ und betrieb/waechter/`)
if (!sammlerLiestOrdner) {
  console.log('  ACHTUNG: betrieb/waechter/alle.mjs liest seinen Ordner nicht mehr rekursiv —')
  console.log('           damit gilt kein Waechter mehr als von ihm gestartet.')
}
console.log('')

for (const eintrag of mitStarter) {
  console.log(`  gestartet  ${eintrag.projektpfad}`)
  console.log(`             durch ${eintrag.belege.join(' · ')}`)
}
for (const eintrag of ausgenommen) {
  console.log(`  ausgenommen  ${eintrag.projektpfad}`)
  console.log(`               ${eintrag.grund}`)
}
console.log('')

if (ohneStarter.length === 0) {
  console.log(`GRUEN: ${mitStarter.length} Pruefdateien haben einen Starter, ${ausgenommen.length} begruendet ausgenommen.`)
  process.exit(0)
}

console.log(`ROT: ${ohneStarter.length} Pruefdatei${ohneStarter.length === 1 ? '' : 'en'} laeuft nirgends:\n`)
for (const eintrag of ohneStarter) {
  console.log(`  ${eintrag.projektpfad}`)
  console.log('      kommt in keiner Bindung, keinem npm-Skript und keinem Aufruf vor.')
}
console.log('\nEntweder die Datei bekommt einen Starter — eine Bindung in')
console.log('app/evals/bindungen.json, ein npm-Skript oder einen Aufruf —')
console.log('oder sie wird geloescht. Eine Pruefung, die nie laeuft, luegt.')
process.exit(1)
