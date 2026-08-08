// Die Wertzahlen, die neben den Kostenzahlen fehlten (Issue #13) — PUR, node-testbar,
// kein DOM, keine Uhr, kein Zufall, keine Mutation der Eingaben.
//
// BEFUND: Onda schrieb den Ertrag jedes Laufs mit (workspace.js: gestartet/verworfen/
// uebernommen) und jede Autorentscheidung samt Begruendung (doc.decisions) — gelesen wurde
// davon nichts. Hier wird aus dem Mitschrieb eine Bilanz.
//
// EINE AGGREGATIONS-WAHRHEIT: Die Annahmequote je Hinweisart und die Anker-Zustellzahlen
// (wie viele Hinweise ueberhaupt ankamen) kommen NICHT von hier, sondern aus
// `bilanziereRueckmeldung` (rueckkopplung-model.mjs). Dieses Modul baut ausdruecklich nur,
// was dort NICHT existiert: die Erweiterungs-Weglegequote, die Monatszaehlung, die Kosten
// je uebernommener Rueckmeldung und die Verdichtung der Entscheidungsliste. Zwei Module,
// die beide "die Annahmequote" berechnen, wuerden irgendwann auseinanderdriften — genau das
// soll hier nicht passieren.
//
// BEWUSST NICHT GEBAUT: Jakobs Setzung (Issue-Kommentar 05.08.) erlaubt es, die
// Weglegen-Quote spaeter zu einer Drossel fuer den zeitgesteuerten Erweiterungslauf zu
// machen. Diese Drossel entsteht hier NICHT — die Schwelle dafuer legt Jakob erst fest,
// nachdem er die erste echte Messung gesehen hat. Dieses Modul liefert nur die Messung.
//
// DIE DREI KONSTANTEN — Zahl und Begruendung an einer Stelle (Vorbild momente-model.mjs):
//
// MINDESTZAHL_ERTRAG = 10: Unterhalb von zehn bewerteten Faellen ist jede Prozentzahl
// Rauschen. Eine Quote aus drei oder vier Faellen suggeriert eine Genauigkeit, die die
// Daten nicht hergeben — ehrlicher ist "noch zu wenig" statt einer Zahl, die beim naechsten
// Einzelfall um zehn Punkte springt. Dieselbe Groessenordnung wie MINDESTZAHL_VERGLEICH in
// rueckkopplung-model.mjs, hier aber eine EIGENE Konstante: die beiden Module bilanzieren
// unterschiedliche Dinge und duerfen sich nicht heimlich denselben Namen teilen.
//
// WOERTLICH_BEHALTEN = 12: So viele juengste Entscheidungen bleiben im Prompt einzeln
// lesbar — genug Kontext, damit das Modell nachvollziehen kann, WAS zuletzt entschieden
// wurde und warum. Mehr als das waechst wieder linear mit der Geschichte; genau das soll
// die Verdichtung verhindern.
//
// HISTORIE_DECKEL = 24: Zwei Jahre Monatsgeschichte reichen fuer jede Frage, die das
// Maschinenzimmer beantworten soll ("wie war das im letzten Quartal", "seit wann schreibe
// ich hier"). Genutzt von Task 3 (settings-model.mjs Verbrauchs-Historie) — hier nur
// definiert, weil die Zahl zu diesem Modul gehoert und nicht zweimal begruendet werden soll.
export const MINDESTZAHL_ERTRAG = 10
export const WOERTLICH_BEHALTEN = 12
export const HISTORIE_DECKEL = 24

// Journal-Kanaele, die in die Ertragsrechnung einfliessen. 'chat' und andere Kanaele haben
// keinen "Uebernommen"-Begriff im selben Sinn (ein Chat wird gelesen, nicht angenommen) und
// bleiben deshalb aussen vor.
const ERTRAGS_KANAELE = new Set(['hinweis', 'erweiterung'])

// Ausgaenge einer Entscheidung, die als "angenommen" zaehlen. 'resolved' ist die normale
// Annahme; 'risk-accepted' ist ein bewusst angenommenes Risiko -- die ernsteste Form der
// Auseinandersetzung, die es gibt (siehe rueckkopplung-model.mjs), und zaehlt hier wie dort
// zur Annahme, nicht zum Verwerfen. Nur 'dismissed' ist ein echtes Verwerfen.
const ANGENOMMEN_AUSGAENGE = new Set(['resolved', 'risk-accepted'])
const VERWORFEN_AUSGAENGE = new Set(['dismissed'])

// Tolerante Zahl wie in settings-model.mjs/lauf-journal.mjs: Muell zaehlt als 0, negative
// Werte ebenso (eine negative Kostensumme oder ein negativer Zaehlstand waere Beschaedigung,
// keine Absicht).
function sichereZahl(wert) {
  const zahl = +wert
  return Number.isFinite(zahl) && zahl >= 0 ? zahl : 0
}

// Monatsschluessel 'YYYY-MM', lokale Zeit -- exakt dieselbe Logik wie `aktuellerMonat`
// (settings-model.mjs:27) und `monatVon` (lauf-journal.mjs:52). Eine dritte Kopie derselben
// vier Zeilen ist der Preis dafuer, dass dieses Modul keine der beiden Dateien importieren
// muss (keine neue Kopplung fuer eine reine Formatierungsfrage).
function monatVon(zeitstempel) {
  const datum = new Date(zeitstempel)
  return `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}`
}

// Die drei Lagen, die eine Quote/ein Durchschnitt haben kann. Fail-closed wie in
// rueckkopplung-model.mjs: 'noch-zu-wenig' heisst nicht "ungefaehr", sondern "keine
// verlaessliche Aussage moeglich". 'keine' ist der Sonderfall "es gibt noch nicht einmal
// einen Ansatz" (nichts wurde je entschieden/uebernommen) -- das ist etwas anderes als
// "es gibt schon ein paar Faelle, aber zu wenige".
function bewerteBasis(bewertbareAnzahl) {
  if (bewertbareAnzahl <= 0) return 'keine'
  if (bewertbareAnzahl < MINDESTZAHL_ERTRAG) return 'noch-zu-wenig'
  return 'quote'
}

function istNichtWeggeworfen(dokument) {
  return dokument && typeof dokument === 'object' && dokument.trashed !== true
}

// Erweiterungen: gemerkt/weg/neu ueber alle nicht-trashed Dokumente. 'neu' ist noch nicht
// entschieden und zaehlt deshalb nicht zu `bewertbar` -- nur wer sich entschieden hat
// (gemerkt oder weggelegt), traegt zur Weglegen-Quote bei.
export function weglegenQuote(dokumente) {
  let gemerkt = 0
  let weg = 0
  let neu = 0

  ;(Array.isArray(dokumente) ? dokumente : [])
    .filter(istNichtWeggeworfen)
    .forEach(dokument => {
      const erweiterungen = Array.isArray(dokument.erweiterungen) ? dokument.erweiterungen : []
      erweiterungen.forEach(eintrag => {
        if (!eintrag || typeof eintrag !== 'object') return
        if (eintrag.status === 'gemerkt') gemerkt += 1
        else if (eintrag.status === 'weg') weg += 1
        else if (eintrag.status === 'neu') neu += 1
      })
    })

  const bewertbar = gemerkt + weg
  const aussage = bewerteBasis(bewertbar)
  const quote = aussage === 'quote' ? weg / bewertbar : null
  return { gemerkt, weg, neu, bewertbar, quote, aussage }
}

// Monatszaehlung: kind==='accept'-Entscheidungen (decision.at im Monat) und gemerkte
// Erweiterungen (entschiedenAt im Monat, status 'gemerkt'). `kind` statt `outcome`, weil
// jede kind:'accept'-Entscheidung ohnehin outcome:'resolved' traegt (decideFinding schreibt
// beides in einem Zug, reasoning-model.mjs:292-304) -- ein bewusstes Risiko wird per
// `kind:'reject'` entschieden und zaehlt hier nicht als "angenommener Hinweis diesen Monat",
// obwohl es in der Gesamtbilanz (rueckkopplung-model.mjs) als angenommenes Risiko auftaucht.
// Beide Module fragen etwas anderes: dort "wurde die Substanz akzeptiert", hier "gab es
// diesen Monat eine ausdrueckliche Annahme-Geste".
export function monatsZaehlung(dokumente, monat) {
  const monatSchluessel = typeof monat === 'string' ? monat : ''
  let angenommeneHinweise = 0
  let gemerkteErweiterungen = 0

  ;(Array.isArray(dokumente) ? dokumente : [])
    .filter(istNichtWeggeworfen)
    .forEach(dokument => {
      const decisions = Array.isArray(dokument.decisions) ? dokument.decisions : []
      decisions.forEach(decision => {
        if (!decision || typeof decision !== 'object') return
        if (decision.kind !== 'accept') return
        if (!Number.isFinite(decision.at)) return
        if (monatVon(decision.at) !== monatSchluessel) return
        angenommeneHinweise += 1
      })

      const erweiterungen = Array.isArray(dokument.erweiterungen) ? dokument.erweiterungen : []
      erweiterungen.forEach(eintrag => {
        if (!eintrag || typeof eintrag !== 'object') return
        if (eintrag.status !== 'gemerkt') return
        if (!Number.isFinite(eintrag.entschiedenAt)) return
        if (monatVon(eintrag.entschiedenAt) !== monatSchluessel) return
        gemerkteErweiterungen += 1
      })
    })

  return { angenommeneHinweise, gemerkteErweiterungen }
}

// Kosten je uebernommener Rueckmeldung aus dem #12-Journal: Summe kostenCents aller
// Eintraege mit ergebnis !== 'fehler' der Kanaele 'hinweis'/'erweiterung', geteilt durch
// Summe uebernommen. Dieselbe Basisregel wie weglegenQuote: unter MINDESTZAHL_ERTRAG
// Uebernahmen ist ein Centsbetrag genauso ein Zufallsprodukt wie eine Quote aus zu wenigen
// Faellen -- centsJeUebernahme bleibt dann null, aussage sagt ehrlich 'noch-zu-wenig'.
export function kostenJeUebernahme(journal) {
  const eintraege = journal && Array.isArray(journal.eintraege) ? journal.eintraege : []
  let kostenCents = 0
  let uebernommen = 0

  eintraege.forEach(eintrag => {
    if (!eintrag || typeof eintrag !== 'object') return
    if (eintrag.ergebnis === 'fehler') return
    if (!ERTRAGS_KANAELE.has(eintrag.kanal)) return
    kostenCents += sichereZahl(eintrag.kostenCents)
    uebernommen += sichereZahl(eintrag.uebernommen)
  })

  const aussage = bewerteBasis(uebernommen)
  const centsJeUebernahme = aussage === 'quote' ? kostenCents / uebernommen : null
  return { kostenCents, uebernommen, centsJeUebernahme, aussage }
}

// Verdichtung der Entscheidungsliste: die juengsten `woertlichBehalten` Eintraege bleiben
// unveraendert (nur ohne `at` -- kein Zeitstempel im Prompt), alles Aeltere faellt je
// Kategorie in eine Summenzeile. Damit waechst die Ausgabe nicht mehr linear mit der
// Entscheidungsgeschichte, sondern hoechstens mit der (kleinen, festen) Zahl der Kategorien.
//
// Mapping Ausgang -> Summe: `entscheidung` traegt den Finding-Status als String
// ('resolved'|'dismissed'|'risk-accepted', siehe fasseEntscheidungenZusammen,
// agent-findings.mjs:151). 'resolved' UND 'risk-accepted' zaehlen als angenommen (ein
// bewusst angenommenes Risiko ist immer noch eine Annahme -- dieselbe Lesart wie
// rueckkopplung-model.mjs), 'dismissed' als verworfen. Jeder andere/unbekannte Wert zaehlt
// in keiner der beiden Summen (lieber eine Zahl kleiner als eine Zahl falsch).
export function verdichteEntscheidungen(eintraege, woertlichBehalten = WOERTLICH_BEHALTEN) {
  const grenze = Number.isFinite(woertlichBehalten) ? Math.max(0, Math.trunc(woertlichBehalten)) : WOERTLICH_BEHALTEN
  const gueltig = (Array.isArray(eintraege) ? eintraege : []).filter(e => e && typeof e === 'object')

  // Juengste zuerst. Eintraege ohne `at` (Task 2 ergaenzt es erst) sortieren als aelteste --
  // sie sollen nicht faelschlich fuer "aktuell" gehalten werden.
  const sortiert = [...gueltig].sort((a, b) => {
    const atA = Number.isFinite(a.at) ? a.at : 0
    const atB = Number.isFinite(b.at) ? b.at : 0
    return atB - atA
  })

  const woertlichRoh = sortiert.slice(0, grenze)
  const aeltere = sortiert.slice(grenze)

  // `at` strippen -- es hat im Prompt nichts zu suchen (Datumsrauschen bei jedem Turn).
  const woertlich = woertlichRoh.map(eintrag => {
    const { at, ...ohneZeit } = eintrag
    return ohneZeit
  })

  const summenNachKategorie = new Map()
  aeltere.forEach(eintrag => {
    const kategorie = String(eintrag.kategorie || '')
    if (!summenNachKategorie.has(kategorie)) {
      summenNachKategorie.set(kategorie, { kategorie, angenommen: 0, verworfen: 0 })
    }
    const zeile = summenNachKategorie.get(kategorie)
    const ausgang = String(eintrag.entscheidung || '')
    if (ANGENOMMEN_AUSGAENGE.has(ausgang)) zeile.angenommen += 1
    else if (VERWORFEN_AUSGAENGE.has(ausgang)) zeile.verworfen += 1
  })

  const summen = [...summenNachKategorie.values()].sort((a, b) => a.kategorie.localeCompare(b.kategorie, 'de'))

  return { woertlich, summen }
}
