// Reine Gate- und Verarbeitungslogik für den echten Hinweislauf (Etappe A, Spec §5) —
// PUR, node-testbar, kein DOM, kein ctx. workspace.js (fuehreHinweislaufAus) orchestriert nur
// noch: Dokument/Editor lesen, diese Funktionen aufrufen, runTask + Persistenz auslösen.
import { dedupeHinweise, findeAnker } from './anchor-verify.mjs'
import { blockFuerAnkerIndex, fasseEntscheidungenZusammen, fasseOffeneHinweiseZusammen, hinweisZuFinding } from './agent-findings.mjs'
import { baueHinweisKontext } from './hinweis-kontext.mjs'

// Reihenfolge bewusst: kein Dokument -> Beispielprojekt -> Lauf schon aktiv -> leerer Text ->
// unveränderter Text seit dem letzten Lauf. Der Schlüssel-Check (hatSchluessel) bleibt bewusst
// außerhalb dieser reinen Funktion — er ist async (Keychain/Netz) und lohnt erst, wenn alles
// andere bereits passt (Spec §5: "Läufe werden entprellt").
export function pruefeHinweislaufGate({
  hatDokument,
  istBeispielprojekt,
  verstaendnisOffen,
  laeuftBereits,
  docText,
  signatur,
  letzteSignatur,
}) {
  if (!hatDokument) return { erlaubt: false, grund: 'kein-dokument' }
  if (istBeispielprojekt) return { erlaubt: false, grund: 'beispielprojekt' }
  if (verstaendnisOffen) return { erlaubt: false, grund: 'verstaendnis-offen' }
  if (laeuftBereits) return { erlaubt: false, grund: 'lauf-aktiv' }
  if (!String(docText || '').trim()) return { erlaubt: false, grund: 'leer' }
  if (signatur === letzteSignatur) return { erlaubt: false, grund: 'unveraendert' }
  return { erlaubt: true }
}

// Wandelt eine Modellantwort (rohe Hinweise) in übernommene Findings um: Dedupe gegen
// Bekanntes zuerst (günstig, arbeitet auf dem Anker-Text direkt, fängt auch Wiederholungen
// innerhalb desselben Laufs ab), dann je frischem Hinweis Anker-Verifikation -> Finding.
// Nicht gefunden heißt immer verwerfen (Zähler), nie raten (Spec §5).
export function verarbeiteHinweisantwort({
  geliefert,
  docText,
  blocks,
  findings = [],
  decisions = [],
  jetzt = Date.now(),
}) {
  const geliefertListe = Array.isArray(geliefert) ? geliefert : []
  const frisch = dedupeHinweise(geliefertListe, findings, decisions)
  let verworfen = geliefertListe.length - frisch.length
  const uebernommen = []

  frisch.forEach(hinweis => {
    const ankerErgebnis = findeAnker(docText, hinweis?.anker)
    if (!ankerErgebnis.gefunden) { verworfen += 1; return }
    const blockId = blockFuerAnkerIndex(blocks, ankerErgebnis.index)
    const finding = hinweisZuFinding(hinweis, ankerErgebnis, blockId, docText, jetzt)
    if (!finding) { verworfen += 1; return }
    uebernommen.push(finding)
  })

  // Ruhe-Regel (Spec §5): eine Grundursache prominent, der Rest dieses Laufs geparkt —
  // dieselbe rootCauseId/Queue-Priorisierung, die getFindingQueue (reasoning-model.mjs)
  // bereits für bestehende Findings auswertet.
  const grundursache = uebernommen.find(finding => finding.istGrundursache) || null
  if (grundursache) {
    uebernommen.forEach(finding => {
      if (finding !== grundursache) finding.rootCauseId = grundursache.id
    })
  }

  return { uebernommen, verworfen, gestartet: geliefertListe.length, grundursache }
}

// Reine Ausloeser-Entscheidung fuer Auslöser (a) Schreibpause (H-3, Spec §5): entscheidet nur,
// OB und nach wie viel ms ein Hinweislauf-Versuch geplant werden soll. Die autoritative
// Gate-Pruefung (Beispielprojekt/Schluessel/aktiv/Signatur) bleibt zusaetzlich bei
// pruefeHinweislaufGate/versucheHinweislauf zum Zeitpunkt des tatsaechlichen Starts -- diese
// Funktion vermeidet nur unnoetige Zeitgeber, wenn schon vorher feststeht, dass nichts zu tun
// ist. leseSignatur() ist bewusst ein Callback (wie hatSchluessel/runTask in versucheHinweislauf):
// er liest den aktuellen Dokumenttext erst, wenn alle guenstigen Vorbedingungen bereits
// erfuellt sind, damit waehrend einer IME-Komposition oder eines laufenden Hinweislaufs nicht
// bei jedem Tastendruck unnoetig der komplette Editor-Inhalt gehasht wird.
export function pruefePausenAusloeser({
  hatDokument,
  istBeispielprojekt,
  laeuftBereits,
  hatEingabeStatus,
  lastInputAt,
  editorSichtbar,
  isComposing,
  leseSignatur,
  letzteSignatur,
  idleMs,
  jetzt = Date.now(),
}) {
  if (!hatDokument) return { planen: false, grund: 'kein-dokument' }
  if (istBeispielprojekt) return { planen: false, grund: 'beispielprojekt' }
  if (laeuftBereits) return { planen: false, grund: 'lauf-aktiv' }
  if (!hatEingabeStatus || !Number.isFinite(lastInputAt)) return { planen: false, grund: 'keine-eingabe' }
  if (!editorSichtbar) return { planen: false, grund: 'editor-nicht-sichtbar' }
  if (isComposing) return { planen: false, grund: 'komposition' }
  if (leseSignatur() === letzteSignatur) return { planen: false, grund: 'unveraendert' }

  const restzeit = idleMs - (jetzt - lastInputAt)
  return { planen: true, verzoegerungMs: Math.max(24, restzeit) }
}

// Fuehrt EINEN vollstaendigen Versuch aus (Fix-Runde 1): Gate -> Sperre SYNCHRON setzen,
// bevor irgendein await beginnt -> hatSchluessel() -> Konsistenzpruefung NACH dem await ->
// Kontext -> runTask -> Antwort verarbeiten. Alle IO-Abhaengigkeiten sind Parameter, damit
// Kollisionen zweier kurz aufeinanderfolgender Ausloeser und Kontext-Drift ueber den
// Schluessel-Check hinweg mit gefaketen, verzoegerbaren Collaborators testbar sind, ohne
// DOM/ctx zu brauchen.
//
// Finding 1 (Critical): hinweislaufAktiv wurde bislang erst NACH `await hatSchluessel()`
// gesetzt. Zwei kurz aufeinanderfolgende Ausloeser (Schreibpause + Chat-Bitte) lesen dann
// BEIDE noch `false`, haengen beide im selben await und starten beide einen teuren
// runTask-Aufruf. Fix: sperreSetzen(true) laeuft synchron, sofort nach der reinen
// Gate-Pruefung, VOR dem ersten await -- exakt das Muster aus starteVerstaendnisEntwurf
// (workspace.js), das interviewLaufAktiv ebenso vor jedem await setzt.
//
// Finding 2 (Important): Projekt/Dokument koennen sich waehrend `await hatSchluessel()`
// aendern. `verstaendnis` muss deshalb VOM AUFRUFER bereits ueber die stabile, vor dem
// await erfasste Dokument-Zugehoerigkeit (doc.projectId) aufgeloest sein -- nie ueber einen
// "aktuell aktiven Zeiger", der sich waehrenddessen verschieben kann. Zusaetzlich prueft
// `istNochDasselbeDokument()` NACH dem await, ob das Dokument noch dasselbe ist; bei
// Drift wird still abgebrochen, BEVOR ueberhaupt ein Kontext gebaut oder runTask gerufen wird
// -- so koennen Dokumenttext und Verstaendnis niemals aus zwei verschiedenen Projekten stammen.
export async function versucheHinweislauf({
  hatDokument,
  istBeispielprojekt,
  verstaendnisOffen,
  laeuftBereits,
  docText,
  signatur,
  letzteSignatur,
  sperreSetzen,
  hatSchluessel,
  istNochDasselbeDokument,
  beansprucheKostenfreigabe,
  verstaendnis,
  blocks,
  findings,
  decisions,
  runTask,
  setzeAgentStatus,
}) {
  const gate = pruefeHinweislaufGate({
    hatDokument,
    istBeispielprojekt,
    verstaendnisOffen,
    laeuftBereits,
    docText,
    signatur,
    letzteSignatur,
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

    const kontext = baueHinweisKontext({
      verstaendnis,
      docText,
      entscheidungen: fasseEntscheidungenZusammen(findings, decisions),
      offeneHinweise: fasseOffeneHinweiseZusammen(findings),
    })
    // Bereich W (Aura/Statuszeile) atmet ausschliesslich am echten Gateway-Zustand -- wie in
    // starteVerstaendnisEntwurf/sendeInterviewAntwort muss jeder echte runTask-Aufruf ihn setzen.
    setzeAgentStatus({ zustand: 'laeuft' })
    const { daten } = await runTask('hinweise', kontext)
    setzeAgentStatus({ zustand: 'bereit' })
    const jetzt = Date.now()
    const { uebernommen, verworfen, gestartet, grundursache } = verarbeiteHinweisantwort({
      geliefert: daten?.hinweise, docText, blocks, findings, decisions, jetzt,
    })
    return { gestartet: true, erfolg: true, uebernommen, verworfen, geliefertAnzahl: gestartet, grundursache, zeit: jetzt }
  } catch (fehler) {
    // Spec §7: sichtbarer, unaufgeregter Fehlerhinweis im Panel (V-2-Lehre: kein stiller,
    // unerklaerter Leerzustand) statt eines Alarms.
    setzeAgentStatus({ zustand: 'fehler', fehlerTyp: fehler?.typ })
    return { gestartet: true, erfolg: false, fehler: fehler?.typ || 'unbekannt' }
  } finally {
    sperreSetzen(false)
  }
}
