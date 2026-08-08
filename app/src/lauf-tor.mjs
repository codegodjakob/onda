// Das eine Tor: JEDER bezahlte Lauf MUSS hier durch -- Sperre, Signatur, Buchung, Journal.
// Kein Kanal importiert runTask direkt; der Rueckwachs-Waechter (test/lauf-tor-waechter.test.mjs,
// Task 10) erzwingt das per Quelltext-Regel.
//
// Verdrahtungs-Schicht (im Unterschied zu lauf-journal.mjs, das rein bleibt): Date.now() ist
// hier erlaubt, weil die Zeit tatsaechlich vom System kommen muss -- ein Test reicht sie nicht
// als Parameter herein, sondern beobachtet sie ueber Number.isFinite()/Vorher-Nachher-Vergleiche.
//
// Buchungswahrheit bleibt beim Gateway (agent-gateway.mjs verbucht settings.usage weiterhin
// selbst, einmal je runTask-Aufruf) -- das Tor fuehrt daneben, PRO LAUF statt pro Aufruf, sein
// eigenes Journal (lauf-journal.mjs). Zwei getrennte Zahlen mit unterschiedlichem Zweck, keine
// zweite Buchungswahrheit: settings.usage ist der Monats-Budgetzaehler, das Journal ist die
// Chronik einzelner Laeufe (Issue #12) und der Messpunkt fuer Issue #13 (Wertzahlen).
import { runTask as gatewayRunTask } from './agent-gateway.mjs'
import { TOR_NAMEN } from './kanaele.mjs'
import {
  beginneLauf, leeresJournal, letzteBezahlteSignatur, merkeGezeigt, schliesseLauf, verbucheImEintrag,
} from './lauf-journal.mjs'

// Die Kanaele, die durchs Tor laufen. Issue #12 nannte vier — Interview, Chat, Hinweis,
// Erweiterung —, und sie ersetzten die vier verstreuten let-Sperr-Variablen aus
// workspace.js durch einen einzigen, kanalunabhaengigen Ort.
//
// 'quellen' kam beim Merge nach main am 8.8.2026 dazu: der Kanal entstand am 8.8., drei Tage
// nachdem dieser Zweig fertig war, und hatte die Kopiervorlage ein FUENFTES Mal abgeschrieben
// (eigene Sperr-Variable, eigene Signatur). Genau das benennt betrieb/LEITSTAND.md als den
// Preis des liegengebliebenen Merges — und genau das soll das Tor beenden. Wer einen sechsten
// Kanal baut, traegt ihn ins Register ein; der Rueckwachs-Waechter (lauf-tor-waechter.test.mjs)
// laesst ihn ohnehin nicht am Tor vorbei.
//
// Die Namen selbst stehen seit dem Kanal-Register (kanaele.mjs) nicht mehr hier: dieselbe
// Liste war viermal von Hand abgeschrieben, und eine der Abschriften hinkte bereits einen
// Kanal hinterher. Was das Tor braucht, ist nur die Spalte der TOR-NAMEN — die zweite
// Spalte (wie das Modell die Aufgabe nennt) geht ausschliesslich agent-tasks.mjs etwas an.
export const KANAELE = TOR_NAMEN

const STANDARD_HOOKS = { getJournal: null, persist: null, scheduleSave: null }
let hooks = { ...STANDARD_HOOKS }

// Internes Fallback-Journal -- greift, solange initLaufTor nie mit getJournal aufgerufen
// wurde (Tests, oder ein Fail-safe-Start vor vollstaendiger Verdrahtung). So wirft weder
// fuehreLaufAus noch torJournal() jemals wegen fehlender Verdrahtung; ohne Hook geht nur die
// Persistenz verloren, nicht die Sperr-/Signatur-Logik selbst.
let internesJournal = leeresJournal()

export function initLaufTor(konfiguration) {
  hooks = Object.assign({ ...STANDARD_HOOKS }, konfiguration)
  // Frisches Fallback-Journal je Verdrahtung -- verhindert, dass ein Test ohne eigenen
  // getJournal-Hook Zustand aus einem vorherigen Test (oder der vorherigen App-Sitzung) sieht.
  internesJournal = leeresJournal()
}

function aktivesJournal() {
  return hooks.getJournal ? hooks.getJournal() : internesJournal
}

// Fuer Anzeige/Debug/Tests: das gerade aktive Journal, lesend.
export function torJournal() {
  return aktivesJournal()
}

// Sperren-Register: welche Kanaele GERADE einen Lauf ausfuehren. `add`/`delete` sind
// synchron -- das ist die ganze Grundlage der Race-Sicherheit weiter unten.
const sperren = new Set()

export function kanalGesperrt(kanal) {
  return sperren.has(kanal)
}

// Wertet den Rueckgabewert von laufFn zur Journal-Bewertung aus (Vertrag Schritt 4 im Brief).
// uebernommen/verworfen kommen -- wo bereits Kanaele existieren (hinweislauf-model.mjs,
// erweiterungslauf-model.mjs) -- schon heute in genau dieser Form zurueck: uebernommen ein
// Array (die tatsaechlich behaltenen Funde), verworfen und geliefertAnzahl bereits Zahlen.
// Faelle ohne dieses Feld (z.B. der Chat-Kanal) werten schlicht als 'geliefert'.
function bewerteLaufErgebnis(ergebnis) {
  // Follow-up aus der Task-6-Review: ein nicht-werfendes erfolg:false (z.B. der
  // Chat-Kanal bei einer abgelehnten Antwort) trug seinen fehler-Wert bisher nicht
  // ins Journal -- fehlerTyp landete still bei null statt beim tatsaechlichen Grund.
  if (ergebnis && ergebnis.erfolg === false) return { ergebnis: 'fehler', fehlerTyp: ergebnis.fehler || 'unbekannt' }
  if (ergebnis && Array.isArray(ergebnis.uebernommen)) {
    return {
      ergebnis: ergebnis.uebernommen.length === 0 ? 'verworfen' : 'geliefert',
      geliefert: ergebnis.geliefertAnzahl,
      uebernommen: ergebnis.uebernommen.length,
      verworfen: ergebnis.verworfen,
    }
  }
  return { ergebnis: 'geliefert' }
}

// Der Kern des Pakets (Skizze aus dem Task-Brief, hier ausformuliert). Vertrag:
// 1. Ist der Kanal gesperrt, sofort { gestartet:false, grund:'lauf-aktiv' } -- SYNCHRON,
//    vor jedem await in dieser Funktion, sonst koennten zwei gleichzeitige Ausloeser
//    beide die Sperre offen sehen (klassisches TOCTOU-Rennen).
// 2. Signatur-Pruefung (ebenfalls synchron, VOR dem Setzen der Sperre): derselbe Stand mit
//    einmalJeSignatur darf nicht zweimal bezahlen.
// 3. laufFn bekommt ein bewachtes runTask -- der einzige Weg zum Gateway. Jeder Aufruf zaehlt
//    als "bezahlt" (mind. ein Versuch), auch wenn er selbst scheitert.
// 4. Journal nur fuer bezahlte Laeufe; Ergebnis-Bewertung siehe bewerteLaufErgebnis.
// 5. finally gibt die Sperre IMMER frei und persistiert (nur wenn tatsaechlich journalisiert
//    wurde) -- fuehreLaufAus wirft ab hier nie mehr, jeder Fehler wird zu einem Rueckgabewert.
export async function fuehreLaufAus(beschreibung, laufFn) {
  const { kanal, ausloeser = null, signatur = null, einmalJeSignatur = false } = beschreibung || {}
  if (!KANAELE.includes(kanal)) throw new Error('Lauf-Tor: unbekannter Kanal: ' + kanal)
  if (typeof laufFn !== 'function') throw new Error('Lauf-Tor: laufFn fehlt')

  if (sperren.has(kanal)) return { gestartet: false, grund: 'lauf-aktiv' }
  // `signatur` bewusst mitgeprueft (nicht nur einmalJeSignatur): eine leere/null Signatur blockt
  // NIE -- ohne Signatur laesst sich "derselbe Stand wie zuletzt" nicht behaupten, und die vier
  // Kanaele liefern in der Praxis ohnehin immer eine.
  if (einmalJeSignatur && signatur && signatur === letzteBezahlteSignatur(aktivesJournal(), kanal)) {
    return { gestartet: false, grund: 'unveraendert' }
  }
  sperren.add(kanal) // SYNCHRON -- vor diesem Punkt gibt es kein await in dieser Funktion.

  const eintrag = beginneLauf({ kanal, ausloeser, signatur, einmalJeSignatur, jetzt: Date.now() })
  let laufOffen = true
  let bezahlt = false

  // Das einzige runTask, das laufFn zu sehen bekommt. `bezahlt` wird schon beim Aufruf
  // wahr -- ein Versuch zaehlt als "bezahlt" im Sinn von Schritt 4, auch wenn der
  // Gateway-Aufruf selbst (Transportfehler ohne usage, Task 2) nichts Verrechenbares
  // zurueckbringt. verbucheImEintrag traegt tasks[] und stand selbst ein (Task 1) --
  // hier NICHT verdoppeln.
  const torRunTask = async (task, eingabe, optionen) => {
    if (!laufOffen) throw new Error('Lauf-Tor: runTask nach Laufende — Kanal ' + kanal)
    bezahlt = true
    try {
      const ergebnis = await gatewayRunTask(task, eingabe, optionen)
      verbucheImEintrag(eintrag, task, ergebnis.usage)
      return ergebnis
    } catch (fehler) {
      // Ein reiner Transportfehler traegt kein usage-Feld (Task 2 haengt es nur an die vier
      // internen Gateway-throws refusal/max_tokens/JSON-Fehler/Pflichtfeld-Fehler). Dann
      // bleibt hier nichts zu verbuchen -- der Lauf landet trotzdem (bezahlt===true) als
      // 'fehler' im Journal, aber mit tasks:[] und stand:null. Akzeptiert: nichts
      // nachweislich Bezahltes, aber der Fehlversuch selbst ist journalisiert.
      if (fehler && fehler.usage) verbucheImEintrag(eintrag, task, fehler.usage)
      throw fehler
    }
  }

  try {
    const ergebnis = await laufFn({ runTask: torRunTask })
    if (bezahlt) schliesseLauf(aktivesJournal(), eintrag, bewerteLaufErgebnis(ergebnis), Date.now())
    return ergebnis
  } catch (fehler) {
    if (bezahlt) {
      schliesseLauf(aktivesJournal(), eintrag, { ergebnis: 'fehler', fehlerTyp: fehler?.typ || 'unbekannt' }, Date.now())
    }
    // fuehreLaufAus wirft NIE (Vertrag) -- ein Fehler aus laufFn wird zum Rueckgabewert.
    return { gestartet: true, erfolg: false, fehler: fehler?.typ || 'unbekannt' }
  } finally {
    laufOffen = false
    sperren.delete(kanal)
    if (bezahlt && hooks.persist) hooks.persist()
  }
}

// Minimal-Version fuer dieses Paket: merkt ein gezeigt-Ereignis im aktiven Journal und stoesst
// (falls verdrahtet) einen Speicher-Aufschub an. Die eigentliche Verdrahtung in workspace.js
// (wann genau eine Karte als "gezeigt" gilt) ist Task 9 -- hier zaehlt nur, dass der Weg zum
// Journal steht und dedupliziert (merkeGezeigt selbst, Task 1).
export function merkeKarteGezeigt({ findingId, art, moment } = {}) {
  const neu = merkeGezeigt(aktivesJournal(), { findingId, art, moment, jetzt: Date.now() })
  if (neu) hooks.scheduleSave?.()
  return neu
}
