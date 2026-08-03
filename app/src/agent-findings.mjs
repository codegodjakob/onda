// Reine Umwandlung: KI-Hinweise (deutsches 8-Kategorien-Schema aus HINWEISE_SCHEMA)
// -> Findings in exakt der bestehenden Form (Vorbild: example.js buildExampleLane,
// Normalisierung: reasoning-model.mjs normalizeFinding). Kein DOM, node-testbar.

// Mapping abgeleitet aus dem bestehenden Code (reasoning-model.mjs):
// INTEGRITY_CATEGORIES = fact/source/citation/method/logic; Passage-Findings mit
// kind 'form' tragen 'wording', inhaltliche 'content'; Struktur bleibt 'structure'.
export const KATEGORIE_ZU_CATEGORY = Object.freeze({
  fakt: 'fact',
  quelle: 'source',
  methode: 'method',
  logik: 'logic',
  struktur: 'structure',
  wirkung: 'content',
  erklaerung: 'content',
  sprache: 'wording',
})

const INTEGRITAETS_KATEGORIEN = new Set(['fakt', 'quelle', 'methode', 'logik'])
const TRENNER = '\n\n'

function einfacherHash(value) {
  let hash = 2166136261
  const text = String(value || '')
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

// Dieselbe Textbasis für die Anfrage an das Modell UND für findeAnker —
// nur so zeigen Anker-Indizes auf dieselben Stellen.
export function baueDocText(blocks) {
  return (blocks || []).map(block => String(block.text || '')).join(TRENNER)
}

// Bildet einen Fundstellen-Index aus baueDocText auf den Baustein ab.
// Indizes im Trennerbereich fallen dem folgenden Baustein zu.
export function blockFuerAnkerIndex(blocks, index) {
  if (!Number.isInteger(index) || index < 0) return null
  let offset = 0
  for (const block of blocks || []) {
    const text = String(block.text || '')
    if (index < offset + text.length) return block.id || null
    offset += text.length + TRENNER.length
  }
  return null
}

// Fix-Runde 2, Finding 3 (Important): target (und claim) sind jetzt der ECHTE Wortlaut aus dem
// Dokument (docText.slice(index, index+laenge)), nicht mehr die Modell-Schreibweise (anker).
// Bei einem normalisierten Treffer koennen sich beide unterscheiden (typografische vs. gerade
// Anfuehrungszeichen, kollabiertes Whitespace) -- mit der Modell-Schreibweise als target
// scheiterten spaeter "annehmen"/"eigene Fassung" und die Markierung rendert nicht, weil target
// nicht wortwoertlich im Dokument vorkommt. Fail-closed: ist die Laenge nicht ermittelbar (oder
// der Index ungueltig), wird der Hinweis verworfen statt geraten -- passt zum bestehenden
// Vertrag dieser Funktion (gibt bei nicht verwertbaren Eingaben bereits null zurueck).
// bisher/neu/action bleiben bewusst auf anker bezogen: der Vorschlag des Modells zitiert sich
// selbst (bisher ist per Vertrag ein Teilstring von anker), ein Wechsel auf target koennte den
// Abgleich allein durch die Anfuehrungszeichen-Normalisierung unnoetig scheitern lassen.
export function hinweisZuFinding(hinweis, ankerErgebnis, blockId, docText, jetzt = Date.now()) {
  if (!hinweis || ankerErgebnis?.gefunden !== true) return null
  const anker = String(hinweis.anker || '')
  if (!anker) return null

  const { index, laenge } = ankerErgebnis
  if (!Number.isInteger(index) || index < 0 || !Number.isInteger(laenge) || laenge <= 0) return null
  const target = String(docText || '').slice(index, index + laenge)
  if (!target) return null

  const category = KATEGORIE_ZU_CATEGORY[hinweis.kategorie] || 'content'
  const vorschlag = hinweis.vorschlag && typeof hinweis.vorschlag === 'object' ? hinweis.vorschlag : null
  const bisher = vorschlag ? String(vorschlag.bisher || '') : ''
  const neu = vorschlag ? String(vorschlag.neu || '') : ''
  const vorschlagAnwendbar = Boolean(bisher && neu && anker.includes(bisher))
  const action = vorschlagAnwendbar ? anker.replace(bisher, neu) : ''

  const finding = {
    id: `ki-${jetzt.toString(36)}-${einfacherHash(`${hinweis.kategorie}|${anker}`)}`,
    kind: hinweis.kategorie === 'sprache' ? 'form' : 'inhalt',
    form: vorschlagAnwendbar ? 'mark' : 'note',
    status: 'open',
    placement: 'passage',
    target,
    short: String(hinweis.beobachtung || ''),
    why: String(hinweis.relevanz || ''),
    folge: String(hinweis.folge || ''),
    action,
    variants: vorschlagAnwendbar ? [action] : [],
    category,
    kategorie: String(hinweis.kategorie || ''),
    kiKategorie: String(hinweis.kategorie || ''),
    istGrundursache: hinweis.istGrundursache === true,
    priority: hinweis.istGrundursache === true ? 'high' : 'normal',
    createdAt: jetzt,
    provenance: { actor: 'agent', action: 'hinweise', createdAt: jetzt },
    blockId: blockId || null,
    sources: [],
    thread: [],
  }
  if (hinweis.integritaet === true || INTEGRITAETS_KATEGORIEN.has(hinweis.kategorie)) {
    finding.claim = target
  }
  return finding
}

// Volatiler Prompt-Teil: was bereits entschieden wurde, darf nie wieder
// vorgeschlagen werden (Spec §5). Kompakt, ohne Zeitstempel im Cache-Präfix.
export function fasseEntscheidungenZusammen(findings, decisions) {
  const proFinding = new Map()
  ;(decisions || []).forEach(decision => {
    if (decision?.findingId) proFinding.set(decision.findingId, decision)
  })
  return (findings || [])
    .filter(finding => finding && finding.status && finding.status !== 'open')
    .map(finding => ({
      anker: String(finding.target || ''),
      kategorie: String(finding.kiKategorie || finding.category || ''),
      kurz: String(finding.short || finding.text || ''),
      entscheidung: String(finding.status || ''),
      begruendung: String(proFinding.get(finding.id)?.reason || ''),
    }))
}

export function fasseOffeneHinweiseZusammen(findings) {
  return (findings || [])
    .filter(finding => finding && finding.status === 'open')
    .map(finding => ({
      anker: String(finding.target || ''),
      kategorie: String(finding.kiKategorie || finding.category || ''),
      kurz: String(finding.short || finding.text || ''),
    }))
}
