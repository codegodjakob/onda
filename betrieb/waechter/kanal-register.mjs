// W8a — der Kanal-Register-Waechter.
//
// Er prueft eine einzige Sache: Es gibt GENAU EINE Liste der Kanaele, ueber die Onda mit dem
// Modell spricht, und alles andere im Projekt liest aus ihr.
//
// Warum das noetig ist: Dieselbe Liste stand viermal im Baum, jedes Mal von Hand abgeschrieben.
// Am 8.8.2026 kam der Quellen-Kanal dazu — drei Abschriften wurden nachgezogen, die vierte
// nicht. Sie blieb gruen: eine Pruefung, die vier von fuenf Kanaelen kennt, beschwert sich
// nicht ueber den fuenften, sie sieht ihn schlicht nie. Das ist die stille Sorte Fehler, die
// erst beim Nutzer ankommt.
//
// Vier Fragen stellt dieser Waechter:
//   1. Traegt jeder Kanal im Register beide Namen — den am Lauf-Tor und den gegenueber dem
//      Modell? Das Projekt fuehrt zwei Vokabulare (interview/verstaendnis, hinweis/hinweise,
//      erweiterung/erweiterungen, quellen/quellenthemen); nur beim Gespraech stimmen sie
//      ueberein. Wer den falschen Namensraum erwischt, merkte es bisher erst zur Laufzeit.
//   2. Gibt es zu jedem Kanal wirklich das Modul, das seinen Anfragekontext baut — und liegen
//      unter app/src/ genau so viele Kontext-Module, wie das Register Kanaele nennt? Ein Modul
//      ohne Registerzeile ist ein Kanal, den die halbe Pruefung nicht kennt; eine Registerzeile
//      ohne Modul ist ein Kanal, den es gar nicht gibt.
//   3. Bleibt das Register importfrei? Holte es sich die Ausfuehrung eines Kanals selbst,
//      entstuende der Ring Register -> Kanal -> Ausfuehrung -> Lauf-Tor -> Register. Das
//      Projekt hat heute keinen einzigen solchen Ring, und das soll so bleiben.
//   4. Ist irgendwo eine neue Handkopie der Liste nachgewachsen?
//
// DIE ERLAUBTEN HANDKOPIEN, namentlich und mit Begruendung:
//
//   app/test/lauf-tor.test.mjs
//
// Dort steht die Kanalliste absichtlich ausgeschrieben, und sie DARF nicht ans Register
// angeschlossen werden. Der Kommentar in dieser Datei sagt woertlich, warum: die Liste ist
// „festgenagelt, damit ein sechster Kanal nicht stillschweigend dazukommt". Sie ist kein
// vergessener Rest, sondern ein funktionierender Waechter — wer einen Kanal baut, muss diesen
// Test bewusst mit aendern und dabei einmal darueber nachdenken, ob der Kanal wirklich durchs
// Lauf-Tor gehoert. Zoege man sie ans Register, pruefte sie nur noch, dass eine Liste sich
// selbst gleicht.
//
//   app/test/agent-tasks.test.mjs
//
// Dieselbe Bauart, andere Liste: dort steht ausgeschrieben, welche AUFGABEN die
// Verteilertabelle kennt — und die enthaelt zwei, die gar keine Kanaele sind (Titelvorschlag
// und Zusammenfassung laufen nicht durchs Lauf-Tor, haben keine Sperre und kein Journal). Der
// Test vergleicht diese Liste mit der tatsaechlichen Tabelle; auch er wird rot, sobald eine
// Aufgabe dazukommt oder verschwindet, und auch er waere wertlos, wenn er seine Erwartung aus
// derselben Quelle laese, die er prueft.
//
// BEIDE Ausnahmen duerfen nur schrumpfen, nie wachsen. Eine dritte hiesse, dass wieder jemand
// eine Liste abgeschrieben hat, statt sie zu lesen.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative, sep } from 'node:path'

const WURZEL = fileURLToPath(new URL('../../', import.meta.url))
const APP = join(WURZEL, 'app')
const SRC = join(APP, 'src')
const REGISTER_PFAD = join(SRC, 'kanaele.mjs')

// Die erlaubten Handkopien, als Pfade vom Projektwurzelverzeichnis aus.
const HANDKOPIE_AUSNAHMEN = Object.freeze([
  {
    pfad: 'app/test/lauf-tor.test.mjs',
    grund: 'festgenagelt, damit ein sechster Kanal nicht stillschweigend dazukommt — '
      + 'ein bewusster Rueckwachs-Waechter, kein vergessener Rest.',
  },
  {
    pfad: 'app/test/agent-tasks.test.mjs',
    grund: 'haelt die Aufgabenliste der Verteilertabelle fest, die zwei Nicht-Kanaele mitfuehrt '
      + '(Titelvorschlag, Zusammenfassung) — eine Erwartung aus derselben Quelle, die sie prueft, '
      + 'wuerde nichts mehr pruefen.',
  },
])

// Untergrenze. Ohne sie waere dieser Waechter still gruen, wenn das Register leer waere:
// null Kanaele, null Kontext-Module, die Zahlen stimmen ueberein. Der Wert liegt bewusst auf
// dem heutigen Stand vom 8.8.2026 — fuenf Kanaele. Ein sechster darf dazu, keiner darf weg.
const UNTERGRENZE_KANAELE = 5

const fehler = []

// --- Frage 1: beide Namen, keine Luecke, keine Dopplung ---------------------------------
if (!existsSync(REGISTER_PFAD)) {
  console.log('ROT: app/src/kanaele.mjs fehlt — es gibt kein Kanal-Register.')
  process.exit(1)
}

const { KANAELE } = await import(REGISTER_PFAD)

if (!Array.isArray(KANAELE)) {
  console.log('ROT: app/src/kanaele.mjs gibt kein KANAELE-Feld zurueck.')
  process.exit(1)
}

if (KANAELE.length < UNTERGRENZE_KANAELE) {
  fehler.push(
    `Das Register nennt nur ${KANAELE.length} Kanaele, erwartet sind mindestens `
    + `${UNTERGRENZE_KANAELE}. Entweder ist einer verschwunden, oder die Liste wird nicht mehr gelesen.`,
  )
}

const PFLICHTFELDER = ['torName', 'aufgabe', 'modul', 'modell', 'maxTokens']
const gesehenTorName = new Set()
const gesehenAufgabe = new Set()

for (const [nummer, kanal] of KANAELE.entries()) {
  for (const feld of PFLICHTFELDER) {
    if (!kanal || !kanal[feld]) {
      fehler.push(`Kanal Nr. ${nummer + 1} (${kanal?.torName || kanal?.aufgabe || 'ohne Namen'}): das Feld ${feld} fehlt.`)
    }
  }
  if (!kanal || typeof kanal.stream !== 'boolean') {
    fehler.push(`Kanal ${kanal?.torName || `Nr. ${nummer + 1}`}: das Feld stream fehlt oder ist kein Ja/Nein.`)
  }
  if (kanal?.torName) {
    if (gesehenTorName.has(kanal.torName)) fehler.push(`Der Tor-Name ${kanal.torName} steht zweimal im Register.`)
    gesehenTorName.add(kanal.torName)
  }
  if (kanal?.aufgabe) {
    if (gesehenAufgabe.has(kanal.aufgabe)) fehler.push(`Der Aufgaben-Name ${kanal.aufgabe} steht zweimal im Register.`)
    gesehenAufgabe.add(kanal.aufgabe)
  }
}

// --- Frage 2: zu jedem Kanal ein Modul, und kein Modul ohne Kanal ------------------------
// Rekursiv gelesen ({ recursive: true }, Node 22): ein kuenftiger Unterordner unter app/src/
// wuerde ein flaches Lesen stillschweigend verschlucken, und der Waechter waere blind, ohne
// es zu melden.
const kontextModule = readdirSync(SRC, { recursive: true })
  .map((name) => String(name).split(sep).join('/'))
  .filter((name) => name.endsWith('-kontext.mjs'))
  .filter((name) => !name.endsWith('onda-kontext.mjs'))
  .filter((name) => statSync(join(SRC, name)).isFile())
  .sort()

for (const kanal of KANAELE) {
  if (!kanal?.modul) continue
  if (!kontextModule.some((name) => name === kanal.modul || name.endsWith('/' + kanal.modul))) {
    fehler.push(
      `Kanal ${kanal.torName}: das Register nennt ${kanal.modul}, aber unter app/src/ liegt diese Datei nicht. `
      + 'Ein Kanal ohne Kontext-Modul kann keine Anfrage bauen.',
    )
  }
}

if (kontextModule.length !== KANAELE.length) {
  fehler.push(
    `Unter app/src/ liegen ${kontextModule.length} Kontext-Module, das Register nennt aber ${KANAELE.length} Kanaele. `
    + 'Genau diese Luecke war der Befund vom 8.8.2026: ein Kanal, den nur die halbe Pruefung kennt, ist halb geprueft.',
  )
}

// --- Frage 3: das Register bleibt importfrei ---------------------------------------------
const registerQuelle = readFileSync(REGISTER_PFAD, 'utf8')
const importZeilen = registerQuelle
  .split('\n')
  .filter((zeile) => /^\s*import\s/.test(zeile) || /\bimport\s*\(/.test(zeile))
if (importZeilen.length > 0) {
  fehler.push(
    `app/src/kanaele.mjs importiert ${importZeilen.length} Mal aus anderen Dateien. `
    + 'Das Register muss importfrei bleiben, sonst entsteht der Ring '
    + 'Register -> Kanal -> Ausfuehrung -> Lauf-Tor -> Register. Was ein Kanal zum Laufen braucht, '
    + 'wird ihm hereingereicht (als Fabrik), es wird nicht vom Register geholt.',
  )
}

// --- Frage 4: keine neue Handkopie --------------------------------------------------------
// Gesucht wird eine Aufzaehlung, in der drei oder mehr Kanalnamen als Zeichenketten
// nebeneinander stehen — die Form, die alle vier alten Abschriften hatten. Kommentare zaehlen
// nicht mit: Prosa ueber die Kanaele ist erlaubt und oft noetig, eine zweite Liste ist es nicht.
const ALLE_NAMEN = new Set([...gesehenTorName, ...gesehenAufgabe])
const AUSNAHME_PFADE = new Set(HANDKOPIE_AUSNAHMEN.map((a) => a.pfad))
const ORDNER = ['src', 'test', 'evals'].map((name) => join(APP, name))

function alleDateien(ordner) {
  if (!existsSync(ordner)) return []
  return readdirSync(ordner, { recursive: true })
    .map((name) => join(ordner, String(name)))
    .filter((pfad) => pfad.endsWith('.mjs') || pfad.endsWith('.js'))
    .filter((pfad) => statSync(pfad).isFile())
}

function ohneKommentare(quelle) {
  return quelle
    .split('\n')
    .filter((zeile) => !zeile.trim().startsWith('//'))
    .join('\n')
}

const handkopien = []
for (const ordner of ORDNER) {
  for (const pfad of alleDateien(ordner)) {
    const relativ = relative(WURZEL, pfad).split(sep).join('/')
    if (relativ === 'app/src/kanaele.mjs') continue
    const quelle = ohneKommentare(readFileSync(pfad, 'utf8'))
    for (const treffer of quelle.match(/\[[^[\]]*\]/g) || []) {
      const namen = [...new Set((treffer.match(/'([^']*)'|"([^"]*)"/g) || [])
        .map((teil) => teil.slice(1, -1))
        .filter((teil) => ALLE_NAMEN.has(teil)))]
      if (namen.length >= 3) handkopien.push({ pfad: relativ, namen })
    }
  }
}

const unerlaubteKopien = handkopien.filter((kopie) => !AUSNAHME_PFADE.has(kopie.pfad))
for (const kopie of unerlaubteKopien) {
  fehler.push(
    `${kopie.pfad} zaehlt die Kanaele noch einmal von Hand auf (${kopie.namen.join(', ')}). `
    + 'Lies sie aus app/src/kanaele.mjs — eine Liste, die man an zwei Stellen nachziehen muss, '
    + 'zieht man irgendwann nur an einer nach.',
  )
}

// Und andersherum: verschwindet die eine erlaubte Handkopie, verliert das Projekt seinen
// Rueckwachs-Waechter, ohne dass irgendetwas rot wuerde. Also wird auch ihr Fehlen gemeldet.
for (const ausnahme of HANDKOPIE_AUSNAHMEN) {
  if (!handkopien.some((kopie) => kopie.pfad === ausnahme.pfad)) {
    fehler.push(
      `Die begruendete Ausnahme ${ausnahme.pfad} zaehlt die Kanaele nicht mehr von Hand auf. `
      + 'Sie soll das aber: ' + ausnahme.grund + ' Wer sie ans Register angeschlossen hat, '
      + 'hat einen funktionierenden Waechter abgebaut.',
    )
  }
}

// --- Bericht -------------------------------------------------------------------------------
console.log(`Kanal-Register: ${KANAELE.length} Kanaele, ${kontextModule.length} Kontext-Module unter app/src/.`)
for (const kanal of KANAELE) {
  console.log(`  ${kanal.torName} (am Tor) = ${kanal.aufgabe} (fuer das Modell) -> ${kanal.modul}`)
}
for (const ausnahme of HANDKOPIE_AUSNAHMEN) {
  console.log(`  Erlaubte Handkopie: ${ausnahme.pfad} — ${ausnahme.grund}`)
}

if (fehler.length === 0) {
  console.log('\nGRUEN: Eine Liste, beide Namen, jedes Modul da, keine zweite Abschrift.')
  process.exit(0)
}

console.log(`\nROT: ${fehler.length} Befund${fehler.length === 1 ? '' : 'e'}:\n`)
for (const zeile of fehler) console.log(`  ${zeile}`)
process.exit(1)
