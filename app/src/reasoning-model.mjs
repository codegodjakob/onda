import { istIntegritaetsfrageFuerCategory } from './textart-regeln.mjs'
import { anmerkungsartVon, normalizeAnnotationFinding, tragweite, verbindlichkeit } from './annotation-contract.mjs'

const UNDERSTANDING_DEFAULTS = Object.freeze({
  task: '',
  audience: [],
  desiredEffect: '',
  evidenceStandard: '',
  protectedIntentions: [],
  openQuestions: [],
  updatedAt: null,
  // Kein Verständnisfeld, kein Merge-Ziel — reine Kostenbremse (Fix-Runde 1,
  // Finding 2): sobald gesetzt, startet kein weiterer bezahlter Entwurf-Lauf
  // fürs selbe Projekt. Additiv: alte Projekte ohne dieses Feld gelten als
  // „noch nicht versucht" (null).
  entwurfVersuchtAm: null,
})

const PRIORITY_RANK = Object.freeze({ critical: 0, high: 1, normal: 2, low: 3 })
// Was der Text gewinnt (agent-tasks.mjs, HINWEISE_SCHEMA). Fehlt der Wert oder ist er
// unbekannt, gilt die Mitte — weder Strafe fuer aeltere Eintraege noch Einladung, das
// Feld wegzulassen.
const GEWINN_RANG = Object.freeze({ traegt: 0, schaerft: 1, glaettet: 2 })
const INTEGRITY_CATEGORIES = new Set(['fact', 'source', 'citation', 'method', 'logic'])
const INTEGRITY_ANNOTATION_CATEGORIES = Object.freeze({ beleg: 'source', faktencheck: 'fact', widerspruch: 'logic' })
const COMPLETED_STATUSES = new Set(['resolved', 'dismissed', 'superseded'])

function cleanList(value) {
  if (!Array.isArray(value)) return []
  return value.map(item => String(item).trim()).filter(Boolean)
}

export function ensureProjectUnderstanding(project) {
  const current = project && typeof project.understanding === 'object' && project.understanding
    ? project.understanding
    : {}
  Object.entries(UNDERSTANDING_DEFAULTS).forEach(([key, value]) => {
    if (current[key] === undefined) current[key] = Array.isArray(value) ? [] : value
  })
  current.audience = cleanList(current.audience)
  current.protectedIntentions = cleanList(current.protectedIntentions)
  current.openQuestions = cleanList(current.openQuestions)
  current.geschuetzt = cleanList(current.geschuetzt)
  project.understanding = current
  return current
}

const GESCHUETZT_FELDER = Object.freeze([
  'task', 'audience', 'desiredEffect', 'evidenceStandard', 'protectedIntentions', 'openQuestions',
])

function textOderLeer(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function istInterviewOffen(understanding) {
  if (!understanding || typeof understanding !== 'object') return true
  const task = textOderLeer(understanding.task)
  const effect = textOderLeer(understanding.desiredEffect)
  const audience = cleanList(understanding.audience)
  return !(task && effect && audience.length)
}

export function markiereGeschuetzt(understanding, feld) {
  if (!understanding || typeof understanding !== 'object') return understanding
  if (!GESCHUETZT_FELDER.includes(feld)) return understanding
  if (!Array.isArray(understanding.geschuetzt)) understanding.geschuetzt = []
  if (!understanding.geschuetzt.includes(feld)) understanding.geschuetzt.push(feld)
  return understanding
}

// Gegenstueck zu markiereGeschuetzt: gibt ein Feld wieder fuer den Agenten frei.
// Ohne diesen Weg waere jede Handkorrektur eine Tuer, die nur in eine Richtung geht --
// der Mensch koennte das Feld zwar weiter selbst editieren, aber der Agent nie wieder
// dazulernen. Das Loesen ist bewusst feldweise und ohne Seiteneffekt auf den Wert:
// der zuletzt eingetragene Text bleibt stehen, nur der Schreibschutz faellt.
export function loeseSchutz(understanding, feld) {
  if (!understanding || typeof understanding !== 'object') return understanding
  if (!Array.isArray(understanding.geschuetzt)) return understanding
  understanding.geschuetzt = understanding.geschuetzt.filter(eintrag => eintrag !== feld)
  return understanding
}

// Projektweite Kostenbremse für den bezahlten Entwurf-Lauf (nicht für die kostenlose
// feste Eröffnungsfrage — die darf weiterhin pro Dokument erscheinen). Kein
// Verständnisfeld: beeinflusst istInterviewOffen nicht und ist kein Merge-Ziel in
// mergeVerstaendnis (siehe dort — es lebt außerhalb der sechs Kernfelder und wird per
// Objekt-Spread einfach durchgereicht).
export function istEntwurfVersucht(understanding) {
  return Boolean(understanding && understanding.entwurfVersuchtAm)
}

export function markiereEntwurfVersucht(understanding, jetzt = Date.now()) {
  if (!understanding || typeof understanding !== 'object') return understanding
  understanding.entwurfVersuchtAm = jetzt
  return understanding
}

// Pur: mischt eine KI-Antwort (VERSTAENDNIS_SCHEMA) in ein bestehendes Understanding.
// Nur nicht-leere Felder überschreiben; geschützte Felder (Nutzer-Korrekturen) nie.
// Ausnahme openQuestions: die Lückenliste der KI ersetzt die alte auch durch leer,
// damit beantwortete Lücken verschwinden. protectedIntentions werden vereinigt.
export function mergeVerstaendnis(alt, neu, geschuetzt = [], jetzt = Date.now()) {
  const basis = alt && typeof alt === 'object' ? alt : {}
  const eingehend = neu && typeof neu === 'object' ? neu : {}

  // Defensive Behandlung von geschuetzt: Array, Set erlaubt; kaputte Werte führen zu fail-closed.
  let gesperrt
  if (geschuetzt === null || geschuetzt === undefined) {
    gesperrt = new Set() // nichts geschützt — legitimer Normalfall
  } else if (Array.isArray(geschuetzt)) {
    gesperrt = new Set(cleanList(geschuetzt))
  } else if (geschuetzt instanceof Set) {
    // Set ist gültig — Werte übernehmen, aber tolerant normalisieren
    gesperrt = new Set(Array.from(geschuetzt).map(v => String(v).trim()).filter(Boolean))
  } else {
    // Kaputter Wert (String, Objekt, Zahl, etc.): fail-closed.
    // Im Zweifel schützt das System die Nutzer-Korrekturen, statt sie zu verlieren.
    gesperrt = new Set(GESCHUETZT_FELDER)
  }

  const ergebnis = {
    ...basis,
    task: textOderLeer(basis.task),
    audience: cleanList(basis.audience),
    desiredEffect: textOderLeer(basis.desiredEffect),
    evidenceStandard: textOderLeer(basis.evidenceStandard),
    protectedIntentions: cleanList(basis.protectedIntentions),
    openQuestions: cleanList(basis.openQuestions),
    geschuetzt: cleanList(basis.geschuetzt),
    updatedAt: Number.isFinite(basis.updatedAt) ? basis.updatedAt : null,
  }
  delete ergebnis.antwortText
  let geaendert = false

  const uebernimmText = feld => {
    if (gesperrt.has(feld)) return
    const wert = textOderLeer(eingehend[feld])
    if (wert && wert !== ergebnis[feld]) { ergebnis[feld] = wert; geaendert = true }
  }
  uebernimmText('task')
  uebernimmText('desiredEffect')
  uebernimmText('evidenceStandard')

  if (!gesperrt.has('audience')) {
    const roh = eingehend.audience
    const liste = Array.isArray(roh) ? cleanList(roh) : cleanList(String(roh || '').split(','))
    if (liste.length && JSON.stringify(liste) !== JSON.stringify(ergebnis.audience)) {
      ergebnis.audience = liste
      geaendert = true
    }
  }

  if (!gesperrt.has('protectedIntentions')) {
    const zugaenge = cleanList(eingehend.protectedIntentions)
      .filter(eintrag => !ergebnis.protectedIntentions.includes(eintrag))
    if (zugaenge.length) {
      ergebnis.protectedIntentions = [...ergebnis.protectedIntentions, ...zugaenge]
      geaendert = true
    }
  }

  if (!gesperrt.has('openQuestions') && Array.isArray(eingehend.openQuestions)) {
    const liste = cleanList(eingehend.openQuestions)
    if (JSON.stringify(liste) !== JSON.stringify(ergebnis.openQuestions)) {
      ergebnis.openQuestions = liste
      geaendert = true
    }
  }

  if (geaendert) ergebnis.updatedAt = jetzt
  return ergebnis
}

function legacyStatus(status) {
  if (status === 'done') return 'resolved'
  if (status === 'rejected') return 'dismissed'
  return status || 'open'
}

function coachCategory(entry) {
  const type = String(entry.type || '').toLowerCase()
  if (type.includes('quelle')) return 'source'
  if (type.includes('zitat')) return 'citation'
  if (type.includes('methode')) return 'method'
  if (type.includes('logik')) return 'logic'
  if (type.includes('struktur')) return 'structure'
  return 'content'
}

function normalizeFinding(finding, placement, index) {
  const normalized = finding
  normalized.id = normalized.id || `legacy-${placement}-${index}`
  normalized.placement = normalized.placement || placement
  normalized.status = legacyStatus(normalized.status)
  normalized.category = normalized.category || (
    placement === 'passage'
      ? (normalized.kind === 'form' ? 'wording' : 'content')
      : coachCategory(normalized)
  )
  normalized.priority = normalized.priority || (normalized.tone === 'warn' ? 'high' : 'normal')
  normalized.createdAt = Number.isFinite(normalized.createdAt) ? normalized.createdAt : index
  if (!normalized.provenance || typeof normalized.provenance !== 'object' || Array.isArray(normalized.provenance)) {
    normalized.provenance = {
      actor: String(normalized.id).startsWith('ki-') ? 'agent' : 'unknown',
      action: String(normalized.id).startsWith('ki-') ? 'hinweise' : 'legacy-assessment',
      createdAt: normalized.createdAt,
    }
  }
  normalized.short = normalized.short || normalized.text || 'Hinweis'
  normalized.anmerkungsart = normalizeAnnotationFinding(normalized).anmerkungsart
  if (typeof normalized.claim === 'string' && normalized.claim.trim()) {
    normalized.claim = normalized.claim.trim()
  } else {
    delete normalized.claim
  }
  return normalized
}

export function ensureReasoningModel(doc) {
  if (!Array.isArray(doc.findings)) doc.findings = []
  if (!Array.isArray(doc.decisions)) doc.decisions = []

  const ids = new Set(doc.findings.map(item => item && item.id).filter(Boolean))
  const addLegacy = (items, placement) => {
    if (!Array.isArray(items)) return
    items.forEach((item, index) => {
      const normalized = normalizeFinding(item, placement, index)
      if (!ids.has(normalized.id)) {
        doc.findings.push(normalized)
        ids.add(normalized.id)
      }
    })
  }

  addLegacy(doc.coach, 'document')
  addLegacy(doc.lane, 'passage')
  doc.findings.forEach((finding, index) => normalizeFinding(
    finding,
    finding.placement || (finding.target ? 'passage' : 'document'),
    index,
  ))
  return doc
}

// Die Textart ist zusaetzlich und optional: Wer sie nicht kennt (alle bisherigen Aufrufer),
// bekommt exakt das Verhalten von vorher -- die fuenf Kategorien gelten dann unveraendert.
// Wer sie kennt, kann die Liste nur ENGER machen, nie weiter: Was hier nie eine
// Integritaetsfrage war, wird durch keine Textart zu einer (textart-regeln.mjs).
export function isIntegrityCategory(category, textart) {
  if (!INTEGRITY_CATEGORIES.has(category)) return false
  return istIntegritaetsfrageFuerCategory(textart, category)
}

// Die Rangfolge, in der Hinweise an die Reihe kommen. Fuenf Stufen, jede mit einem
// Grund — und das Alter ist ausdruecklich die letzte.
//
// Bis zum 8.8.2026 waren es drei: Grundursache, Integritaet, Alter. Damit standen ein
// Kommafehler und eine zerfallende Gliederung gleichauf, sobald beides gleich alt war.
// Jakob dazu: „was ist die Aufgabe, die die am meisten Impact hat, die man als
// Naechstes umsetzen sollte?" — genau die Frage beantwortete die Sortierung nicht.
//
// 1. GRUNDURSACHE vor Symptom. Wer die Wurzel loest, loest die Folgen mit. Das Modell
//    benennt sie selbst (istGrundursache → priority 'high').
// 2. INTEGRITAET vor allem Uebrigen. Ein fehlender Beleg oder ein Widerspruch ist keine
//    Frage des Geschmacks; was davon in dieser Textsorte bindet, sagt textart-regeln.
// 4. TRAGWEITE: was weiter in den Text reicht, kommt zuerst. Das ist die Ordnung, die
//    die Schreibzentrums-Didaktik seit vierzig Jahren vorgibt — Aufbau vor Grammatik —,
//    und sie spart Arbeit: an Saetzen zu feilen, die eine Umstellung ohnehin loescht,
//    ist verschwendet (docs/research/2026-08-05-feld-feedback-didaktik.md, Abschnitt 3).
// 5. VERBINDLICHKEIT bei gleicher Tragweite: Fehler vor Empfehlung vor Geschmack.
//    Erst hier — sonst kaeme der Kommafehler wieder vor der Gliederung.
// 6. ALTER, und dann die Kennung, damit die Reihenfolge ueberhaupt eindeutig ist.
export function vergleicheHinweise(a, b) {
  const priority = (PRIORITY_RANK[a.priority] ?? PRIORITY_RANK.normal)
    - (PRIORITY_RANK[b.priority] ?? PRIORITY_RANK.normal)
  if (priority) return priority
  const integrity = Number(isIntegrityCategory(b.category, b.textart))
    - Number(isIntegrityCategory(a.category, a.textart))
  if (integrity) return integrity

  // 3. GEWINN: was der Text konkret gewinnt. Das Modell sagt es je Fall — und das ist
  //    der Unterschied zur Tragweite darunter: die ordnet ARTEN („eine Gliederungsfrage
  //    reicht weiter als eine Wortwahl"), der Gewinn ordnet FAELLE. Hier darf ausgerechnet
  //    dieses eine Wort vor die Gliederung, wenn es den Text traegt. Hoechstens ein
  //    Hinweis je Durchgang darf das beanspruchen (hinweislauf-model.mjs).
  const gewinnRang = GEWINN_RANG[a.gewinn] ?? GEWINN_RANG.schaerft
  const gewinnRangB = GEWINN_RANG[b.gewinn] ?? GEWINN_RANG.schaerft
  if (gewinnRang !== gewinnRangB) return gewinnRang - gewinnRangB

  const artA = anmerkungsartVon(a)
  const artB = anmerkungsartVon(b)
  const reichweite = tragweite(artA) - tragweite(artB)
  if (reichweite) return reichweite
  const bindung = verbindlichkeit(artA) - verbindlichkeit(artB)
  if (bindung) return bindung

  const created = (a.createdAt || 0) - (b.createdAt || 0)
  if (created) return created
  return String(a.id).localeCompare(String(b.id), 'de')
}

export function getFindingQueue(doc) {
  ensureReasoningModel(doc)
  const open = doc.findings.filter(finding => finding.status === 'open')
  const openIds = new Set(open.map(finding => finding.id))
  const parked = open
    .filter(finding => finding.rootCauseId && openIds.has(finding.rootCauseId))
    .sort(vergleicheHinweise)
  const parkedIds = new Set(parked.map(finding => finding.id))
  const ready = open.filter(finding => !parkedIds.has(finding.id)).sort(vergleicheHinweise)

  return {
    current: ready[0] || null,
    upcoming: ready.slice(1),
    parked,
    acceptedRisks: doc.findings.filter(finding => finding.status === 'risk-accepted').sort(vergleicheHinweise),
    completed: doc.findings.filter(finding => COMPLETED_STATUSES.has(finding.status)).sort(vergleicheHinweise),
    pendingCount: open.length,
  }
}

export function decideFinding(doc, findingId, decision, at = Date.now()) {
  ensureReasoningModel(doc)
  const finding = doc.findings.find(item => item.id === findingId)
  if (!finding) throw new Error(`Hinweis ${findingId} nicht gefunden`)
  if (finding.status !== 'open') throw new Error(`Hinweis ${findingId} wurde bereits entschieden`)
  if (!decision || (decision.kind !== 'accept' && decision.kind !== 'reject')) {
    throw new Error('Entscheidung muss accept oder reject sein')
  }

  let outcome = 'resolved'
  if (decision.kind === 'reject') {
    // Die Textart reist am Finding mit (agent-findings.mjs hinweisZuFinding). Ohne sie
    // entscheidet dieselbe Vier-Arten-Regel wie bisher.
    const exactIntegrityCategory = INTEGRITY_ANNOTATION_CATEGORIES[finding.anmerkungsart]
    const exactIntegrity = exactIntegrityCategory
      ? isIntegrityCategory(exactIntegrityCategory, finding.textart)
      : false
    outcome = isIntegrityCategory(finding.category, finding.textart) || exactIntegrity
      ? 'risk-accepted'
      : 'dismissed'
  }
  finding.status = outcome
  finding.decidedAt = at
  const appliedText = String(decision.appliedText || '')
  const resultingText = appliedText || (decision.kind === 'reject' ? String(finding.target || '') : '')

  doc.decisions.push({
    id: `decision-${finding.id}-${at}`,
    findingId: finding.id,
    kind: decision.kind,
    outcome,
    reason: decision.reason || '',
    rejectionScope: decision.kind === 'reject' && typeof decision.rejectionScope === 'string'
      ? decision.rejectionScope
      : '',
    appliedText,
    // Betroffene Passage zum Entscheidungszeitpunkt. Dadurch bleibt im Verlauf
    // sichtbar, welcher Wortlaut aus Übernahme, eigener Fassung oder Verwerfen
    // tatsächlich resultierte, auch wenn sich der Text später weiterentwickelt.
    resultingText,
    at,
  })
  return finding
}
