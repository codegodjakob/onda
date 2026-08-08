// Reine Logik fuer den Bausteinlauf — PUR, node-testbar, kein DOM, kein ctx.
// workspace.js (fuehreBausteinlaufAus) orchestriert nur: Dokument/Editor lesen, diese
// Funktionen aufrufen, runTask + Persistenz ausloesen. Vorbild: hinweislauf-model.mjs.
import { FUNKTIONEN, UMSCHREIB_GRENZE, benennbar } from './bausteinarten-vertrag.mjs'
import { baueBausteinKontext } from './bausteinarten-kontext.mjs'

// Bestand und Reihenfolge der Absaetze — bewusst OHNE Wortlaut. Wer in einem Absatz
// weiterschreibt, aendert die Signatur nicht; wer einen anlegt, entfernt oder verschiebt,
// aendert sie. Genau das ist der Unterschied, an dem der Lauf haengen soll.
export function strukturSignatur(blocks) {
  return (Array.isArray(blocks) ? blocks : [])
    .filter(block => block?.id)
    .map(block => block.id)
    .join('|')
}

// Wurde nur umsortiert? Gleiche Absaetze, andere Reihenfolge. Das ist der eine Fall, in
// dem ALLE Absaetze neu zu benennen sind, obwohl sich kein einziger Wortlaut geaendert
// hat: Was ein Absatz tut, haengt an seiner Stelle im Text. Derselbe Satz ist am Anfang
// eine These und am Schluss eine Zusammenfassung.
//
// Ein hinzugekommener oder entfernter Absatz aendert die Reihenfolge ebenfalls, ist aber
// NICHT dieser Fall -- sonst loeste jede Eingabetaste eine vollstaendige Neubenennung des
// ganzen Textes aus. Dort reicht, was ohnehin offen ist.
function nurUmsortiert(idsJetzt, idsVorher) {
  if (idsJetzt.length !== idsVorher.length) return false
  const gleich = new Set(idsVorher)
  if (idsJetzt.some(id => !gleich.has(id))) return false
  return idsJetzt.some((id, index) => idsVorher[index] !== id)
}

export function pruefeBausteinBedarf({ blocks, bestand, grenze = UMSCHREIB_GRENZE } = {}) {
  const liste = (Array.isArray(blocks) ? blocks : []).filter(benennbar)
  if (!bestand || !Array.isArray(bestand.arten) || !bestand.arten.length) {
    return { noetig: liste.length > 0, grund: 'kein-bestand', offene: liste.map(block => block.id) }
  }

  const idsJetzt = strukturSignatur(blocks).split('|').filter(Boolean)
  const idsVorher = String(bestand.laufSignatur || '').split('|').filter(Boolean)
  if (nurUmsortiert(idsJetzt, idsVorher)) {
    return { noetig: liste.length > 0, grund: 'umsortiert', offene: liste.map(block => block.id) }
  }

  const zuordnung = bestand.zuordnung && typeof bestand.zuordnung === 'object' ? bestand.zuordnung : {}
  const ohneNamen = []
  const umgeschrieben = []
  liste.forEach(block => {
    const eintrag = zuordnung[block.id]
    if (!eintrag || !eintrag.artId) { ohneNamen.push(block.id); return }
    const alt = Number(eintrag.zeichen) || 0
    const neu = String(block.text || '').trim().length
    if (Math.abs(neu - alt) / Math.max(1, alt) > grenze) umgeschrieben.push(block.id)
  })

  // Ein entfernter Absatz allein loest nichts aus: Er aendert die Reihenfolge, aber kein
  // uebriger Absatz braucht deshalb einen neuen Namen.
  const offene = [...new Set([...ohneNamen, ...umgeschrieben])]
  if (!offene.length) return { noetig: false, grund: 'aktuell', offene: [] }

  return { noetig: true, grund: ohneNamen.length ? 'ohne-namen' : 'umgeschrieben', offene }
}

const ALTE_ROLLEN = Object.freeze({
  claim: 'Kernbehauptung',
  evidence: 'Beleg',
  counterpoint: 'Gegenposition',
  transition: 'Übergang',
  question: 'Offene Frage',
})

function text(wert) {
  return typeof wert === 'string' ? wert.trim() : ''
}

// Aus einer gespeicherten Datei kommt Verdachtsmaterial: aeltere Fassung, von Hand
// bearbeitet, halb geschrieben. Entweder wird daraus eine vollstaendig gueltige Ablage
// oder null — nie eine halbe, an der spaeter etwas stillschweigend fehlt.
export function normalisiereBausteinarten(wert) {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  if (!Array.isArray(wert.arten)) return null

  const arten = []
  const nachName = new Map()
  const umleitung = new Map()
  wert.arten.forEach((roh, index) => {
    if (!roh || typeof roh !== 'object') return
    const name = text(roh.name)
    if (!name) return
    const id = text(roh.id) || `art-${index + 1}`

    // Bei doppelten Ids gewinnt der erste Eintrag — die zweite Art faellt weg.
    // umleitung ist die vollstaendige Liste aller verbrauchten Ids, ob direkt oder via Namensumleitung.
    if (umleitung.has(id)) {
      return
    }

    const schluessel = name.toLocaleLowerCase('de')
    const bekannt = nachName.get(schluessel)
    if (bekannt) { umleitung.set(id, bekannt); return }
    const art = {
      id,
      name,
      beschreibung: text(roh.beschreibung),
      funktion: FUNKTIONEN.includes(roh.funktion) ? roh.funktion : null,
    }
    arten.push(art)
    nachName.set(schluessel, id)
    umleitung.set(id, id)
  })
  if (!arten.length) return null

  const zuordnung = {}
  const roheZuordnung = wert.zuordnung && typeof wert.zuordnung === 'object' ? wert.zuordnung : {}
  Object.entries(roheZuordnung).forEach(([blockId, eintrag]) => {
    if (!text(blockId) || !eintrag || typeof eintrag !== 'object') return
    const artId = umleitung.get(text(eintrag.artId))
    if (!artId) return
    zuordnung[blockId] = { artId, zeichen: Math.max(0, Number(eintrag.zeichen) || 0) }
  })

  return {
    textsorte: text(wert.textsorte) || null,
    arten,
    zuordnung,
    laufSignatur: typeof wert.laufSignatur === 'string' ? wert.laufSignatur : '',
    standAt: Number(wert.standAt) || 0,
  }
}

function knotenText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  return (Array.isArray(node.content) ? node.content : []).map(knotenText).join('')
}

// Ein Dokument aus der Sechser-Zeit verliert seine Rollen nicht: Sie werden mit ihren
// alten deutschen Woertern zum Anfangsbestand. Der naechste Lauf ersetzt ihn.
// 'paragraph' war die Voreinstellung, keine Entscheidung — daraus entsteht nichts.
//
// WICHTIG: Diese Funktion nimmt das ROHE Tiptap-JSON, nicht die Bloecke aus
// collectBlockSnapshots. Seit dem 7. August 2026 liest collectBlockSnapshots das alte
// Merkmal semanticRole nicht mehr (die Bausteinart liegt neben dem Text). Ueber Bloecke
// gefuettert fände diese Funktion also NIE eine alte Rolle und waere ein stiller No-Op.
// Sie ist die einzige Stelle im Programm, die das Alt-Merkmal noch kennt -- genau das
// ist ihre Aufgabe.
export function bestandAusAltenRollen(docJson, jetzt = Date.now()) {
  const knoten = docJson && Array.isArray(docJson.content) ? docJson.content : []
  const arten = []
  const nachRolle = new Map()
  const zuordnung = {}
  const kennungen = []

  knoten.forEach(node => {
    const id = node?.attrs?.blockId
    if (!id) return
    kennungen.push(id)
    if (node.type === 'heading') return
    const rolle = node?.attrs?.semanticRole
    if (!Object.hasOwn(ALTE_ROLLEN, rolle)) return
    const name = ALTE_ROLLEN[rolle]
    const inhalt = knotenText(node).trim()
    if (!inhalt) return
    if (!nachRolle.has(rolle)) {
      const art = { id: `art-alt-${rolle}`, name, beschreibung: '', funktion: rolle }
      arten.push(art)
      nachRolle.set(rolle, art.id)
    }
    zuordnung[id] = { artId: nachRolle.get(rolle), zeichen: inhalt.length }
  })

  if (!arten.length) return null
  return {
    textsorte: null,
    arten,
    zuordnung,
    laufSignatur: kennungen.join('|'),
    standAt: Number(jetzt) || 0,
  }
}

// Zwei getrennte Karten, weil zwei getrennte Zwecke: Die Funktion speist block.role und
// damit die Rechenlogik; der Name steht in der Struktur-Spalte. Eine Art ohne Funktion
// hat trotzdem einen Namen — sie taucht nur in der Rechenlogik nicht auf.
function bausteinKarte(bestand, feld) {
  const karte = new Map()
  const gueltig = normalisiereBausteinarten(bestand)
  if (!gueltig) return karte
  const werte = new Map(gueltig.arten.map(art => [art.id, art[feld]]))
  Object.entries(gueltig.zuordnung).forEach(([blockId, eintrag]) => {
    const wert = werte.get(eintrag.artId)
    if (wert) karte.set(blockId, wert)
  })
  return karte
}

export function bausteinRollen(bestand) { return bausteinKarte(bestand, 'funktion') }

export function bausteinNamen(bestand) { return bausteinKarte(bestand, 'name') }

// Die Antwort ist ein Vorschlag, kein Befehl. Was auf keinen vorhandenen, benennbaren
// Absatz oder auf keine im selben Zug genannte Art zeigt, wird verworfen und gezaehlt --
// nie geraten (dieselbe Regel wie bei den Ankern, hinweislauf-model.mjs:61).
//
// Absaetze, die die Antwort NICHT erwaehnt, behalten ihren bisherigen Namen. Genau das
// haelt die Struktur-Spalte ruhig, wenn ein Lauf wegen eines einzigen neuen Absatzes
// startet: die uebrigen Karten stehen still.
export function verarbeiteBausteinantwort({ antwort, blocks, bestand = null, jetzt = Date.now() } = {}) {
  const liste = (Array.isArray(blocks) ? blocks : []).filter(benennbar)
  const vorhanden = new Set(liste.map(block => block.id))
  const laengen = new Map(liste.map(block => [block.id, String(block.text || '').trim().length]))
  const bisher = normalisiereBausteinarten(bestand)

  const neueArten = normalisiereBausteinarten({
    textsorte: antwort?.textsorte,
    arten: Array.isArray(antwort?.arten) ? antwort.arten : [],
    zuordnung: {},
  })
  if (!neueArten) {
    if (!bisher) return { bestand: null, verworfen: 0 }
    // Nichts Verwertbares geliefert: der bisherige Stand bleibt unangetastet.
    return { bestand, verworfen: 0 }
  }

  const nachName = new Map(neueArten.arten.map(art => [art.name.toLocaleLowerCase('de'), art.id]))
  const zuordnung = {}
  let verworfen = 0

  // Zuerst der Bestand: uebernommen wird, was noch existiert UND dessen Art die Antwort
  // erneut nennt. Ein Name, dessen Art es nicht mehr gibt, waere sonst ein Waisenkind.
  if (bisher) {
    const alteNamen = new Map(bisher.arten.map(art => [art.id, art.name.toLocaleLowerCase('de')]))
    Object.entries(bisher.zuordnung).forEach(([blockId, eintrag]) => {
      if (!vorhanden.has(blockId)) return
      const artId = nachName.get(alteNamen.get(eintrag.artId))
      if (!artId) return
      zuordnung[blockId] = { artId, zeichen: eintrag.zeichen }
    })
  }

  ;(Array.isArray(antwort?.zuordnung) ? antwort.zuordnung : []).forEach(eintrag => {
    const blockId = text(eintrag?.blockId)
    const artId = nachName.get(text(eintrag?.art).toLocaleLowerCase('de'))
    if (!blockId || !artId || !vorhanden.has(blockId)) { verworfen += 1; return }
    zuordnung[blockId] = { artId, zeichen: laengen.get(blockId) || 0 }
  })

  return {
    bestand: {
      textsorte: neueArten.textsorte,
      arten: neueArten.arten,
      zuordnung,
      laufSignatur: strukturSignatur(blocks),
      standAt: Number(jetzt) || 0,
    },
    verworfen,
  }
}

// Ein vollstaendiger Versuch. sperreSetzen(true) laeuft SYNCHRON, sofort nach der reinen
// Bedarfspruefung und VOR dem ersten await -- sonst lesen zwei kurz aufeinanderfolgende
// Ausloeser beide `false`, haengen beide im selben await und starten beide einen teuren
// runTask-Aufruf (dieselbe Lehre wie in versucheHinweislauf, hinweislauf-model.mjs:146).
//
// istNochDasselbeDokument() prueft NACH dem await: Wer waehrend des Schluessel-Checks das
// Dokument wechselt, bekaeme sonst die Bausteinarten des einen Textes in die Ablage des
// anderen geschrieben.
export async function versucheBausteinlauf({
  hatDokument,
  istBeispielprojekt,
  laeuftBereits,
  blocks,
  bestand = null,
  docText = '',
  verstaendnis = null,
  // Das Projektwissen (Textsorte, Aussagen-Speicher, Nachbartexte, Gedaechtnis). Es reist
  // unveraendert bis in den Kontext durch; ohne es waere dies ein blinder Kanal.
  onda = null,
  grenze = UMSCHREIB_GRENZE,
  sperreSetzen,
  hatSchluessel,
  istNochDasselbeDokument,
  beansprucheKostenfreigabe,
  runTask,
  setzeAgentStatus,
  jetzt = Date.now,
}) {
  if (!hatDokument) return { gestartet: false, grund: 'kein-dokument' }
  if (istBeispielprojekt) return { gestartet: false, grund: 'beispielprojekt' }
  if (laeuftBereits) return { gestartet: false, grund: 'lauf-aktiv' }
  const bedarf = pruefeBausteinBedarf({ blocks, bestand, grenze })
  if (!bedarf.noetig) return { gestartet: false, grund: bedarf.grund }

  sperreSetzen(true)
  try {
    if (!(await hatSchluessel())) return { gestartet: false, grund: 'kein-schluessel' }
    if (!istNochDasselbeDokument()) return { gestartet: false, grund: 'dokument-gewechselt' }
    const kostenfreigabe = typeof beansprucheKostenfreigabe === 'function'
      ? beansprucheKostenfreigabe()
      : { erlaubt: true }
    if (!kostenfreigabe?.erlaubt) {
      return { gestartet: false, grund: kostenfreigabe?.grund || 'kostenfreigabe-fehlt' }
    }

    // bedarf.offene bestimmt, welche Absätze das Modell überhaupt benennen soll.
    const kontext = baueBausteinKontext({ verstaendnis, docText, blocks, bestand, offene: bedarf.offene, onda })
    setzeAgentStatus({ zustand: 'laeuft' })
    const { daten } = await runTask('bausteinarten', kontext)
    setzeAgentStatus({ zustand: 'bereit' })
    const zeit = jetzt()
    const ergebnis = verarbeiteBausteinantwort({ antwort: daten, blocks, bestand, jetzt: zeit })
    return { gestartet: true, erfolg: true, bestand: ergebnis.bestand, verworfen: ergebnis.verworfen, zeit }
  } catch (fehler) {
    // Sichtbarer, unaufgeregter Fehlerhinweis statt eines stillen Leerzustands (Spec §7).
    setzeAgentStatus({ zustand: 'fehler', fehlerTyp: fehler?.typ })
    return { gestartet: true, erfolg: false, fehler: fehler?.typ || 'unbekannt' }
  } finally {
    sperreSetzen(false)
  }
}
