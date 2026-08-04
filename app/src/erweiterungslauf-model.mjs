// Gate, Verankerung und Ablauf des Erweiterungslaufs — PUR, node-testbar, kein DOM.
// Vorbild und Vertrag: hinweislauf-model.mjs. workspace.js liefert nur die ctx-gebundenen
// Werte und uebernimmt das Ergebnis.
import { findeAnker } from './anchor-verify.mjs'
import { baueErweiterungKontext } from './erweiterung-kontext.mjs'
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

function einfacherHash(value) {
  let hash = 2166136261
  const text = String(value || '')
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function dedupeSchluessel(art, stellenTexte, gedanke) {
  const stellen = [...stellenTexte].map(text => text.trim().toLowerCase()).sort().join('|')
  // feld hat keine Stelle — dort traegt der Gedanke selbst den Schluessel, sonst waeren
  // alle feld-Erweiterungen eines Textes fuer den Dedupe dasselbe.
  const gedankenTeil = stellen ? '' : String(gedanke || '').trim().toLowerCase().slice(0, 120)
  return `${art}::${stellen}::${gedankenTeil}`
}

// Wandelt EINE Modellantwort in eine speicherbare Erweiterung um. Fail-closed wie
// hinweisZuFinding: falsche Ankerzahl, nicht auffindbarer Anker oder leerer Gedanke
// heisst verwerfen, nie raten. Zwei gleiche Anker bei einer verbindung sind ebenfalls
// keine Verbindung, sondern ein Modellfehler.
export function erweiterungAusAntwort(rohe, docText, blocks, jetzt = Date.now()) {
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
    const treffer = findeAnker(docText, anker)
    if (!treffer.gefunden) return null
    const { index, laenge } = treffer
    if (!Number.isInteger(index) || index < 0 || !Number.isInteger(laenge) || laenge <= 0) return null
    // Der ECHTE Wortlaut aus dem Dokument, nicht die Schreibweise des Modells --
    // sonst findet die Markierung die Stelle spaeter nicht wieder (Lehre aus H-1).
    const text = String(docText || '').slice(index, index + laenge)
    if (!text) return null
    if (stellen.some(vorher => vorher.index === index)) return null
    stellen.push({ text, index, laenge, blockId: blockFuerAnkerIndex(blocks, index) })
  }

  return {
    id: `erw-${jetzt.toString(36)}-${einfacherHash(dedupeSchluessel(art, stellen.map(s => s.text), gedanke))}`,
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
}) {
  const liste = Array.isArray(geliefert) ? geliefert : []
  const bekannt = new Set(
    (bestehende || [])
      .filter(Boolean)
      .map(eintrag => dedupeSchluessel(
        eintrag.art,
        (eintrag.stellen || []).map(stelle => String(stelle.text || '')),
        eintrag.gedanke,
      )),
  )

  const uebernommen = []
  let verworfen = 0
  for (const rohe of liste) {
    const erweiterung = erweiterungAusAntwort(rohe, docText, blocks, jetzt)
    if (!erweiterung) { verworfen += 1; continue }
    const schluessel = dedupeSchluessel(
      erweiterung.art,
      erweiterung.stellen.map(stelle => stelle.text),
      erweiterung.gedanke,
    )
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
      geliefert: daten?.erweiterungen, docText, blocks, bestehende, jetzt,
    })
    return { gestartet: true, erfolg: true, uebernommen, verworfen, geliefertAnzahl: gestartet, zeit: jetzt }
  } catch (fehler) {
    setzeAgentStatus({ zustand: 'fehler', fehlerTyp: fehler?.typ })
    return { gestartet: true, erfolg: false, fehler: fehler?.typ || 'unbekannt' }
  } finally {
    sperreSetzen(false)
  }
}
