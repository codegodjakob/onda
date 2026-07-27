// Reine Gate- und Verarbeitungslogik für den echten Hinweislauf (Etappe A, Spec §5) —
// PUR, node-testbar, kein DOM, kein ctx. workspace.js (fuehreHinweislaufAus) orchestriert nur
// noch: Dokument/Editor lesen, diese Funktionen aufrufen, runTask + Persistenz auslösen.
import { dedupeHinweise, findeAnker } from './anchor-verify.mjs'
import { blockFuerAnkerIndex, hinweisZuFinding } from './agent-findings.mjs'

// Reihenfolge bewusst: kein Dokument -> Beispielprojekt -> Lauf schon aktiv -> leerer Text ->
// unveränderter Text seit dem letzten Lauf. Der Schlüssel-Check (hatSchluessel) bleibt bewusst
// außerhalb dieser reinen Funktion — er ist async (Keychain/Netz) und lohnt erst, wenn alles
// andere bereits passt (Spec §5: "Läufe werden entprellt").
export function pruefeHinweislaufGate({
  hatDokument,
  istBeispielprojekt,
  laeuftBereits,
  docText,
  signatur,
  letzteSignatur,
}) {
  if (!hatDokument) return { erlaubt: false, grund: 'kein-dokument' }
  if (istBeispielprojekt) return { erlaubt: false, grund: 'beispielprojekt' }
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
    const finding = hinweisZuFinding(hinweis, ankerErgebnis, blockId, jetzt)
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
