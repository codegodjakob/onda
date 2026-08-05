// Gate, Verankerung und Ablauf des Erweiterungslaufs — PUR, node-testbar, kein DOM.
// Vorbild und Vertrag: hinweislauf-model.mjs. workspace.js liefert nur die ctx-gebundenen
// Werte und uebernimmt das Ergebnis.
import { findeAnker } from './anchor-verify.mjs'
import { baueErweiterungKontext } from './erweiterung-kontext.mjs'
import { baueNachbartexte } from './onda-kontext.mjs'
import { blockFuerAnkerIndex } from './agent-findings.mjs'
import { ANKER_ANZAHL, ERWEITERUNGS_ARTEN, fasseErweiterungenZusammen } from './erweiterung-model.mjs'

// Wie beim Hinweislauf: der Schluessel-Check bleibt ausserhalb dieser reinen Funktion,
// er ist async und lohnt erst, wenn alles andere passt.
//
// Ein Unterschied zum Hinweislauf, mit Absicht: es gibt hier KEINE Signatur-Sperre auf
// "unveraenderter Text". Ein Hinweis zu unveraendertem Text waere derselbe Hinweis --
// eine Erweiterung zu unveraendertem Text kann eine andere sein, weil der Kanal nicht
// nach Maengeln sucht, sondern nach Anschluessen. Stattdessen bremst die Mindestlaenge
// (ein halber Absatz hat noch nichts, woran etwas anschliessen koennte) und die
// Kostenfreigabe. Wer noch einmal fragen will, fragt von Hand.
export const MINDESTZEICHEN = 400

export function pruefeErweiterungslaufGate({
  hatDokument,
  istBeispielprojekt,
  verstaendnisOffen,
  laeuftBereits,
  docText,
  vonHand = false,
}) {
  if (!hatDokument) return { erlaubt: false, grund: 'kein-dokument' }
  if (istBeispielprojekt) return { erlaubt: false, grund: 'beispielprojekt' }
  if (verstaendnisOffen) return { erlaubt: false, grund: 'verstaendnis-offen' }
  if (laeuftBereits) return { erlaubt: false, grund: 'lauf-aktiv' }
  const text = String(docText || '').trim()
  if (!text) return { erlaubt: false, grund: 'leer' }
  // Von Hand angefordert zaehlt die Mindestlaenge nicht: wer ausdruecklich fragt,
  // darf auch zu drei Saetzen fragen.
  if (!vonHand && text.length < MINDESTZEICHEN) return { erlaubt: false, grund: 'zu-kurz' }
  return { erlaubt: true }
}

// Die Regel gegen doppelte Bezahlung desselben Textstands — als reine Funktion, damit
// sie pruefbar ist. Sie gilt NUR fuer den zeitgesteuerten Lauf: wer von Hand fragt, hat
// ausdruecklich gefragt und darf denselben Text erneut vorlegen.
//
// Ohne Signatur (leerer Text, kein Dokument) laeuft nichts automatisch an. Fail-closed:
// im Zweifel nicht bezahlen.
export function darfAutomatischLaufen(signatur, letzteSignatur) {
  if (!signatur) return false
  return signatur !== letzteSignatur
}

function einfacherHash(value) {
  let hash = 2166136261
  const text = String(value || '')
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

// Der Dedupe-Schluessel traegt seit den Querverbindungen auch die Herkunft jeder Stelle:
// derselbe Satz kann in zwei Texten desselben Projekts stehen (Zitat, Wiederaufnahme,
// Kopie eines Kapitels), und dann waeren zwei verschiedene Verbindungen fuer den Dedupe
// dieselbe. Stellen im offenen Text tragen keine Herkunft — deren Schluessel bleibt damit
// Zeichen fuer Zeichen derselbe wie vorher, und schon gespeicherte Erweiterungen kommen
// nicht ploetzlich ein zweites Mal durch.
function dedupeSchluessel(art, stellen, gedanke) {
  const teile = [...(stellen || [])]
    .map(stelle => {
      const text = String(stelle?.text || '').trim().toLowerCase()
      const herkunft = String(stelle?.docId || '')
      return herkunft ? `${herkunft}␟${text}` : text
    })
    .sort()
    .join('|')
  // feld hat keine Stelle — dort traegt der Gedanke selbst den Schluessel, sonst waeren
  // alle feld-Erweiterungen eines Textes fuer den Dedupe dasselbe.
  const gedankenTeil = teile ? '' : String(gedanke || '').trim().toLowerCase().slice(0, 120)
  return `${art}::${teile}::${gedankenTeil}`
}

// Ein Anker in einem FREMDEN Text muss laenger sein als einer im offenen. Grund: der offene
// Text steht vor der Autorin oder dem Autor, eine kurze Wendung darin ist nachpruefbar. Eine
// Stelle in einem Text, den niemand offen hat, ist es nicht — und »die Stadt« kommt in jedem
// zweiten Absatz eines Projekts vor. Vierundzwanzig Zeichen sind grob drei bis vier Woerter:
// kurz genug fuer eine echte Wendung, lang genug, dass ein Zufallstreffer praktisch ausfaellt.
export const MIN_FREMD_ANKER_ZEICHEN = 24

function gueltigeSpanne(index, laenge) {
  return Number.isInteger(index) && index >= 0 && Number.isInteger(laenge) && laenge > 0
}

// Die Stelle im OFFENEN Text — unveraendert die Regel von vorher.
function eigeneStelle(anker, docText, blocks) {
  const treffer = findeAnker(docText, anker)
  if (!treffer.gefunden) return null
  const { index, laenge } = treffer
  if (!gueltigeSpanne(index, laenge)) return null
  // Der ECHTE Wortlaut aus dem Dokument, nicht die Schreibweise des Modells --
  // sonst findet die Markierung die Stelle spaeter nicht wieder (Lehre aus H-1).
  const text = String(docText || '').slice(index, index + laenge)
  if (!text) return null
  return { text, index, laenge, blockId: blockFuerAnkerIndex(blocks, index), docId: null, docTitel: '' }
}

// Die Stelle in einem der anderen Texte desselben Projekts. Der Suchraum wird groesser, die
// Nachsicht nicht: gefunden heisst weiterhin woertlich gefunden, und zwar in genau EINEM
// Text. Drei Gruende zu verwerfen, alle fail-closed:
//   - der Anker steht nirgends: dasselbe Verwerfen wie bisher, nur mit mehr Orten geprueft,
//   - er steht in mehreren Texten: dann ist unklar, welcher gemeint war — raten waere hier
//     schlimmer als schweigen, denn die Karte behauptete eine Stelle, die niemand meinte,
//   - er ist zu kurz (siehe MIN_FREMD_ANKER_ZEICHEN).
//
// blockId bleibt bewusst null. Die Seitenspalte macht aus einer Stelle mit blockId einen
// Knopf, der im GERADE OFFENEN Editor zu diesem Baustein springt (workspace.js). Die
// Bausteinkennung eines fremden Textes gaebe es dort nicht — der Knopf saehe aus wie ein Weg
// und fuehrte nirgendwohin. Ohne blockId bleibt er still, und das ist die Wahrheit: die
// Stelle liegt in einem anderen Text.
function fremdeStelle(anker, nachbartexte) {
  if (String(anker || '').trim().length < MIN_FREMD_ANKER_ZEICHEN) return null

  let gefunden = null
  for (const nachbar of (Array.isArray(nachbartexte) ? nachbartexte : [])) {
    const volltext = String(nachbar?.volltext || '')
    const docId = String(nachbar?.docId || '')
    if (!volltext || !docId) continue
    const sichtbar = Array.isArray(nachbar?.sichtbareTeile) ? nachbar.sichtbareTeile : []
    // Rueckwaertskompatibel fuer handgebaute alte Fixtures, aber bei echten Nachbartexten
    // fail-closed: Nur Wortlaut, der im Prompt sichtbar war, darf als Anker gelten.
    if (sichtbar.length && !sichtbar.some(teil => findeAnker(String(teil || ''), anker).gefunden)) continue
    const treffer = findeAnker(volltext, anker)
    if (!treffer.gefunden) continue
    if (gefunden) return null // mehrdeutig
    gefunden = { volltext, docId, titel: String(nachbar.titel || ''), ...treffer }
  }
  if (!gefunden) return null

  const { index, laenge } = gefunden
  if (!gueltigeSpanne(index, laenge)) return null
  const text = gefunden.volltext.slice(index, index + laenge)
  if (!text) return null
  // Gespeichert wird die Stelle ueber ihren woertlichen Text plus die Dokumentkennung. Der
  // Index ist nur ein Hinweis: er zeigt in die Textfassung, aus der er stammt, und der Text
  // dahinter wird weitergeschrieben. Wiedergefunden wird eine Stelle deshalb wie eine
  // Fundstelle ueberall sonst im Programm — ueber ihren Wortlaut (resolveFindingPlacement).
  return { text, index, laenge, blockId: null, docId: gefunden.docId, docTitel: gefunden.titel }
}

// Wandelt EINE Modellantwort in eine speicherbare Erweiterung um. Fail-closed wie
// hinweisZuFinding: falsche Ankerzahl, nicht auffindbarer Anker oder leerer Gedanke
// heisst verwerfen, nie raten. Zwei gleiche Anker bei einer verbindung sind ebenfalls
// keine Verbindung, sondern ein Modellfehler.
//
// nachbartexte sind die anderen Texte desselben Projekts (baueNachbartexte, onda-kontext.mjs)
// — genau die, die dem Modell im Prompt gezeigt wurden. Ein Anker darf jetzt auch dort liegen.
// Was dabei NICHT nachgibt:
//   - ein Anker, den es weder im offenen noch in einem der Nachbartexte gibt, verwirft die
//     ganze Erweiterung. Der Suchraum ist groesser geworden, die Nachsicht nicht,
//   - ohne nachbartexte verhaelt sich die Funktion Zeichen fuer Zeichen wie vorher,
//   - wer ueberhaupt Stellen nennt, muss mindestens eine im offenen Text nennen (siehe unten).
export function erweiterungAusAntwort(rohe, docText, blocks, jetzt = Date.now(), nachbartexte = []) {
  if (!rohe || typeof rohe !== 'object') return null
  const art = String(rohe.art || '')
  if (!ERWEITERUNGS_ARTEN.includes(art)) return null

  const gedanke = String(rohe.gedanke || '').trim()
  const muster = String(rohe.muster || '').trim()
  if (!gedanke || !muster) return null

  const roheAnker = (Array.isArray(rohe.anker) ? rohe.anker : [])
    .map(anker => String(anker || ''))
    .filter(anker => anker.trim())
  if (roheAnker.length !== ANKER_ANZAHL[art]) return null

  const stellen = []
  for (const anker of roheAnker) {
    const eigene = eigeneStelle(anker, docText, blocks)
    const fremde = fremdeStelle(anker, nachbartexte)
    // Das Schema liefert noch keine Dokumentkennung je Anker. Steht derselbe Wortlaut im
    // offenen und in einem sichtbaren Nachbartext, waere jede Wahl eine erfundene Herkunft.
    // Deshalb gilt auch hier: Mehrdeutigkeit verwerfen, nie den ersten Treffer nehmen.
    if (eigene && fremde) return null
    const stelle = eigene || fremde
    if (!stelle) return null
    // Dieselbe Stelle heisst jetzt: derselbe Text UND derselbe Index. Ohne den Textvergleich
    // gaelte eine echte Verbindung zwischen Zeichen 40 hier und Zeichen 40 dort als Doppelung.
    if (stellen.some(vorher => vorher.docId === stelle.docId && vorher.index === stelle.index)) return null
    stellen.push(stelle)
  }

  // Wer Stellen nennt, muss mindestens eine im offenen Text nennen. Lauter fremde Stellen
  // waeren eine Beobachtung ueber Texte, die gerade niemand vor sich hat — sie haette in der
  // Seitenspalte DIESES Textes nichts zu suchen, und jeder ihrer Knoepfe waere still. Der
  // Kanal weitet den Horizont des offenen Textes; er kommentiert nicht das Projekt von aussen.
  // feld hat gar keine Stelle und ist davon nicht betroffen (ANKER_ANZAHL.feld === 0).
  if (stellen.length && !stellen.some(stelle => !stelle.docId)) return null

  return {
    id: `erw-${jetzt.toString(36)}-${einfacherHash(dedupeSchluessel(art, stellen, gedanke))}`,
    art,
    status: 'neu',
    gedanke,
    muster,
    stellen,
    createdAt: jetzt,
    provenance: { actor: 'agent', action: 'erweiterungen', createdAt: jetzt },
  }
}

export function verarbeiteErweiterungsantwort({
  geliefert,
  docText,
  blocks,
  bestehende = [],
  jetzt = Date.now(),
  nachbartexte = [],
}) {
  const liste = Array.isArray(geliefert) ? geliefert : []
  const bekannt = new Set(
    (bestehende || [])
      .filter(Boolean)
      .map(eintrag => dedupeSchluessel(eintrag.art, eintrag.stellen || [], eintrag.gedanke)),
  )

  const uebernommen = []
  let verworfen = 0
  for (const rohe of liste) {
    const erweiterung = erweiterungAusAntwort(rohe, docText, blocks, jetzt, nachbartexte)
    if (!erweiterung) { verworfen += 1; continue }
    const schluessel = dedupeSchluessel(erweiterung.art, erweiterung.stellen, erweiterung.gedanke)
    if (bekannt.has(schluessel)) { verworfen += 1; continue }
    bekannt.add(schluessel)
    uebernommen.push(erweiterung)
  }

  return { uebernommen, verworfen, gestartet: liste.length }
}

// Ein vollstaendiger Versuch. Dieselbe Reihenfolge und dieselben Sicherungen wie
// versucheHinweislauf: Gate -> Sperre SYNCHRON vor dem ersten await -> Schluessel ->
// Konsistenzpruefung nach dem await -> Kostenfreigabe -> Kontext -> runTask.
export async function versucheErweiterungslauf({
  hatDokument,
  istBeispielprojekt,
  verstaendnisOffen,
  laeuftBereits,
  docText,
  vonHand = false,
  sperreSetzen,
  hatSchluessel,
  istNochDasselbeDokument,
  beansprucheKostenfreigabe,
  verstaendnis,
  blocks,
  doc,
  onda = null,
  runTask,
  setzeAgentStatus,
}) {
  const gate = pruefeErweiterungslaufGate({
    hatDokument, istBeispielprojekt, verstaendnisOffen, laeuftBereits, docText, vonHand,
  })
  if (!gate.erlaubt) return { gestartet: false, grund: gate.grund }

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

    const bestehende = doc?.erweiterungen || []
    // Dieselbe Liste, die dem Modell im Prompt gezeigt wird, dient hier als Suchraum fuer die
    // Anker. Sie MUSS aus derselben Quelle stammen: baueNachbartexte ist pur, und der Aufrufer
    // reicht dasselbe onda-Buendel in beide Richtungen — einmal ueber ergaenzeOndaKontext in
    // den Prompt, einmal hierher. Zeigte der Prompt eine andere Liste als die Pruefung sucht,
    // wuerde jede Querverbindung stillschweigend verworfen.
    //
    // ACHTUNG: onda gehoert NICHT in baueErweiterungKontext. Der Aufrufer haengt die
    // Wissensbloecke bereits an der Uebergabestelle zum Gateway an (ergaenzeOndaKontext in
    // workspace.js); ein zweites Anhaengen hier wuerde jeden Block doppelt bezahlen.
    const nachbartexte = baueNachbartexte(onda)
    const kontext = baueErweiterungKontext({
      verstaendnis,
      docText,
      bereitsAngeboten: fasseErweiterungenZusammen(doc),
    })
    setzeAgentStatus({ zustand: 'laeuft' })
    const { daten } = await runTask('erweiterungen', kontext)
    setzeAgentStatus({ zustand: 'bereit' })
    const jetzt = Date.now()
    const { uebernommen, verworfen, gestartet } = verarbeiteErweiterungsantwort({
      geliefert: daten?.erweiterungen, docText, blocks, bestehende, jetzt, nachbartexte,
    })
    return { gestartet: true, erfolg: true, uebernommen, verworfen, geliefertAnzahl: gestartet, zeit: jetzt }
  } catch (fehler) {
    setzeAgentStatus({ zustand: 'fehler', fehlerTyp: fehler?.typ })
    return { gestartet: true, erfolg: false, fehler: fehler?.typ || 'unbekannt' }
  } finally {
    sperreSetzen(false)
  }
}
