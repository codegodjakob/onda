// W5 — der Erzeugt-Waechter.
//
// Er prueft eine einzige Sache: Keine Datei, die eine Maschine schreibt, liegt in der
// Versionsverwaltung.
//
// Warum das noetig ist: Erzeugte Dateien sind der EINZIGE nachgewiesene Konfliktgrund
// dieses Projekts. Im Zusammenfuehren 8343d9f lagen sieben von sieben Konflikten in
// Maschinenausgabe -- in Bildern, Protokollen, Ergebnisdateien. Die beiden Dateien, die
// Menschen am haeufigsten anfassen (workspace.js und style.css), fuegten sich konfliktfrei
// zusammen. Ein Konflikt in einem Bild oder in einem zusammengepressten Buendel von 6.789
// Zeilen ist von Hand ohnehin nicht aufloesbar: man muss neu erzeugen. Genau das gibt
// „nicht versionieren" umsonst.
//
// Warum es diesen Waechter ZUSAETZLICH zur .gitignore gibt: In diesem Projekt ist bewiesen,
// dass eine Zeile in der .gitignore allein nicht traegt. Eine Regel kann durch eine spaeter
// stehende Ausnahme wieder aufgehoben werden, ohne dass es jemand merkt (genau das ist mit
// der .scratch/-Regel passiert). Und eine Datei, die einmal verfolgt wird, bleibt verfolgt
// -- die .gitignore schaut ihr gar nicht mehr zu. Darum zaehlt hier nicht, was in der
// .gitignore steht, sondern was git tatsaechlich verfolgt.
//
// Zwei Fragen, in dieser Reihenfolge:
//   1. Passt eine VERFOLGTE Datei auf ein Erzeugt-Muster?   (der eigentliche Schutz)
//   2. Wuerde eine neue Datei an derselben Stelle ueberhaupt ignoriert?  (die Vorsorge --
//      ohne sie waere die naechste erzeugte Datei beim naechsten „git add ." wieder drin)
//
// Was hier ausdruecklich NICHT hineingehoert:
//   app/evals/results/archiv/  und  app/evals/results/verlauf/
// Die sehen aus wie Maschinenausgabe, sind es aber nicht mehr: sie werden einmal
// geschrieben und nie wieder ueberschrieben. Damit koennen sie gar nicht in Konflikt
// geraten -- sie sind das Gedaechtnis des Projekts und bleiben versioniert.

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const WURZEL = fileURLToPath(new URL('../../', import.meta.url))

// ---------------------------------------------------------------------------------------
// Die Erzeugt-Muster. Jedes mit dem Grund, warum es Maschinenausgabe ist -- ein Muster
// ohne Grund waere eine Behauptung.
//
// „beispiel" ist ein Pfad, den es nicht zu geben braucht. Er dient nur der zweiten Frage:
// wuerde git eine neue Datei an dieser Stelle ignorieren?
// ---------------------------------------------------------------------------------------
const MUSTER = [
  {
    muster: /^app\/evals\/results\/screenshots\//,
    beispiel: 'app/evals/results/screenshots/beliebig.png',
    grund: 'Bildschirmfotos, bei jedem Browser-Messlauf neu geschossen (22 Bilder, 8,5 MB).',
  },
  {
    muster: /^app\/evals\/results\/onda-ui-runs\//,
    beispiel: 'app/evals/results/onda-ui-runs/beliebig.log',
    grund: 'Laufprotokolle der Oberflaechen-Messung, bei jedem Lauf ueberschrieben.',
  },
  {
    muster: /^app\/evals\/results\/laeufe\//,
    beispiel: 'app/evals/results/laeufe/beliebig.json',
    grund: 'Laufprotokolle des Fertigzustand-Laufs, bei jedem Messlauf neu erzeugt.',
  },
  {
    muster: /^app\/evals\/results\/[^/]*-latest\.json$/,
    beispiel: 'app/evals/results/beliebig-latest.json',
    grund: 'Das jeweils juengste Messprotokoll. Der Massstab steht seit B0 getrennt davon in app/evals/massstab.lock.json.',
  },
  {
    muster: /^app\/evals\/results\/stand\.html$/,
    beispiel: 'app/evals/results/stand.html',
    grund: 'Das Standbild, von app/evals/zeichne-stand.mjs aus den Messwerten gezeichnet.',
  },
  {
    muster: /^tools\/figma-onda-one-page\/dist\//,
    beispiel: 'tools/figma-onda-one-page/dist/code.js',
    grund: 'Zusammengepresstes Buendel, 6.789 erzeugte Zeilen. Lag in 20 von 60 Commits -- derselbe Konflikttyp wie die Messergebnisse.',
  },
]

// ---------------------------------------------------------------------------------------
// Frage 1: Passt eine verfolgte Datei auf ein Erzeugt-Muster?
// ---------------------------------------------------------------------------------------

function verfolgteDateien() {
  const lauf = spawnSync('git', ['ls-files', '-z'], { cwd: WURZEL, encoding: 'utf8' })
  if (lauf.status !== 0) {
    console.log('ROT: „git ls-files" liess sich nicht ausfuehren. Ohne git ist hier nichts zu pruefen.')
    if (lauf.stderr) console.log(lauf.stderr.trim())
    process.exit(1)
  }
  return lauf.stdout.split('\0').filter(Boolean)
}

// ---------------------------------------------------------------------------------------
// Die zitierten Belege — die eine Ausnahme, und warum sie ABGELEITET statt aufgezaehlt ist.
//
// app/evals/onda-ui-rubric.json fuehrt unter „evidence" die Bildschirmfotos auf, auf die
// sich die bestandene Qualitaetsbewertung stuetzt, und app/test/onda-quality-rubric.test.mjs
// prueft nach, dass es jedes davon wirklich gibt. Diese Bilder sind derselbe Fall wie
// archiv/ und verlauf/: einmal geschossen, danach zitiert, nicht bei jedem Lauf neu. Ein
// Beleg, den man wegwirft, belegt nichts mehr.
//
// Am 9.8.2026 waren sie mitentfernt worden. Ergebnis: 1015 von 1016 Pruefungen statt 1016.
//
// Warum abgeleitet und nicht hier aufgezaehlt: Zwei Listen desselben Inhalts laufen
// auseinander, sobald jemand nur eine davon pflegt -- das ist in diesem Projekt mehrfach
// passiert. Es gibt genau EINE Liste, die der Belege, und sie steht in der Rubrik. Wer
// dort ein Bild streicht, verliert hier automatisch die Ausnahme dafuer.
// ---------------------------------------------------------------------------------------
function zitierteBelege() {
  try {
    const rubrik = JSON.parse(readFileSync(new URL('../../app/evals/onda-ui-rubric.json', import.meta.url), 'utf8'))
    return new Set((rubrik.current?.evidence ?? []).map(pfad => `app/${pfad}`))
  } catch (fehler) {
    // Lieber streng als still: Ist die Rubrik unlesbar, gibt es keine Ausnahmen. Dann wird
    // dieser Waechter rot und nennt den Grund -- das ist besser, als ein Loch aufzumachen.
    console.log(`  Hinweis: app/evals/onda-ui-rubric.json war nicht lesbar (${fehler.message}).`)
    console.log('  Es gilt darum KEINE Beleg-Ausnahme. Erst die Rubrik reparieren.\n')
    return new Set()
  }
}

const belege = zitierteBelege()
const verfolgt = verfolgteDateien()
const treffer = []

for (const pfad of verfolgt) {
  if (belege.has(pfad)) continue
  for (const eintrag of MUSTER) {
    if (eintrag.muster.test(pfad)) treffer.push({ pfad, grund: eintrag.grund })
  }
}

// ---------------------------------------------------------------------------------------
// Frage 2: Wuerde eine NEUE Datei an derselben Stelle ignoriert?
// ---------------------------------------------------------------------------------------

const ungedeckt = []

for (const eintrag of MUSTER) {
  const lauf = spawnSync('git', ['check-ignore', '-q', '--no-index', eintrag.beispiel], {
    cwd: WURZEL,
    encoding: 'utf8',
  })
  // 0 = wird ignoriert (gut), 1 = wird NICHT ignoriert (Loch), alles andere = git-Fehler
  if (lauf.status !== 0) ungedeckt.push(eintrag)
}

// ---------------------------------------------------------------------------------------
// Der Bericht
// ---------------------------------------------------------------------------------------

console.log('Erzeugt-Waechter (W5) — liegt Maschinenausgabe in der Versionsverwaltung?\n')
console.log(`  ${MUSTER.length} Erzeugt-Muster gegen ${verfolgt.length} verfolgte Dateien geprueft.`)
console.log('  Nicht geprueft, mit Absicht: app/evals/results/archiv/ und app/evals/results/verlauf/')
console.log('  — schreib-einmal, nie ueberschrieben, darum konfliktfrei und weiter versioniert.')
console.log(`  Ebenfalls ausgenommen: ${belege.size} zitierte Bildschirmfotos aus app/evals/onda-ui-rubric.json`)
console.log('  — sie sind die Belege der Qualitaetsbewertung, die Liste steht dort und nur dort.\n')

if (treffer.length === 0 && ungedeckt.length === 0) {
  console.log('GRUEN: Keine erzeugte Datei wird verfolgt, und jedes Muster ist von der .gitignore gedeckt.')
  process.exit(0)
}

if (treffer.length > 0) {
  console.log(`ROT: ${treffer.length} verfolgte Datei${treffer.length === 1 ? '' : 'en'} ist Maschinenausgabe:\n`)
  for (const t of treffer) {
    console.log(`  ${t.pfad}`)
    console.log(`      ${t.grund}`)
  }
  console.log('\nSo geht sie wieder heraus (die Datei bleibt dabei auf der Platte liegen):')
  console.log(`  git rm --cached ${treffer[0].pfad}`)
  console.log('')
}

if (ungedeckt.length > 0) {
  console.log(`ROT: ${ungedeckt.length} Erzeugt-Muster ist von der .gitignore nicht gedeckt:\n`)
  for (const u of ungedeckt) {
    console.log(`  ${u.beispiel}`)
    console.log('      wuerde beim naechsten „git add ." wieder mit hineinwandern.')
  }
  console.log('\nDie fehlende Zeile gehoert in die .gitignore, in den Abschnitt „Erzeugtes".')
}

process.exit(1)
