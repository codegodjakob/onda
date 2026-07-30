// Reine, node-testbare Einstellungs-Normalisierung — kein DOM, keine Tiptap-Abhaengigkeit.
// Aus editor.js load() und den Tests importiert. Bumpt KEIN Schema (additiv, tolerant).

export const ACCENTS = Object.freeze(['sky', 'sage', 'blue', 'clay', 'lavender', 'sand'])

export const DEFAULT_SETTINGS = Object.freeze({
  theme: 'auto',
  spellcheck: false,
  showWords: true,
  structWidth: 620,
  accent: 'sky',
  sidebarCollapsed: false,
  // Null bedeutet: keine zusaetzliche lokale Grenze. Das verbindliche
  // Ausgabenlimit wird weiterhin im Anbieter-Konto gesetzt.
  kiMonatsbudgetCents: null,
})

// Verbrauchszähler für echte KI-Läufe (Etappe A) — additiv, KEIN Schema-Bump.
// usage steht bewusst NICHT in DEFAULT_SETTINGS: Object.assign kopiert flach,
// ein geteiltes (eingefrorenes) Default-Objekt wäre nicht beschreibbar.
// Bei Monatswechsel wird der Zähler zurückgesetzt (Spec §3.4).

export function aktuellerMonat(datum = new Date()) {
  return `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}`
}

export function leereUsage(monat) {
  return {
    monat,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    kostenCents: 0,
  }
}

function sichereZahl(wert) {
  const zahl = +wert
  return Number.isFinite(zahl) && zahl >= 0 ? zahl : 0
}

function normalizeKiBudget(wert) {
  const zahl = +wert
  return Number.isFinite(zahl) && zahl > 0 ? zahl : null
}

function normalizeAutomatikFreigabe(raw, monat) {
  const src = raw && typeof raw === 'object' ? raw : {}
  if (src.monat !== monat) return { monat, verbleibend: 0 }
  const verbleibend = Math.floor(sichereZahl(src.verbleibend))
  // Mehr als genau eine offene Ausnahme waere keine bewusste Einzelfreigabe mehr.
  return { monat, verbleibend: Math.min(1, verbleibend) }
}

function normalizeUsage(raw, monat) {
  const src = raw && typeof raw === 'object' ? raw : {}
  if (src.monat !== monat) return leereUsage(monat)
  return {
    monat,
    inputTokens: sichereZahl(src.inputTokens),
    outputTokens: sichereZahl(src.outputTokens),
    cacheReadTokens: sichereZahl(src.cacheReadTokens),
    cacheWriteTokens: sichereZahl(src.cacheWriteTokens),
    kostenCents: sichereZahl(src.kostenCents),
  }
}

// Verbucht die usage-Zahlen einer API-Antwort (Feldnamen der Anthropic-API)
// plus geschätzte Kosten in Cent. Wirft nie; Müll zählt als 0.
export function verbucheUsage(settings, apiUsage, kostenCents, monat = aktuellerMonat()) {
  if (!settings.usage || settings.usage.monat !== monat) settings.usage = leereUsage(monat)
  const usage = settings.usage
  usage.inputTokens += sichereZahl(apiUsage && apiUsage.input_tokens)
  usage.outputTokens += sichereZahl(apiUsage && apiUsage.output_tokens)
  usage.cacheReadTokens += sichereZahl(apiUsage && apiUsage.cache_read_input_tokens)
  usage.cacheWriteTokens += sichereZahl(apiUsage && apiUsage.cache_creation_input_tokens)
  usage.kostenCents += sichereZahl(kostenCents)
  return usage
}

export function budgetStand(settings, monat = aktuellerMonat()) {
  const src = settings && typeof settings === 'object' ? settings : {}
  const budgetCents = normalizeKiBudget(src.kiMonatsbudgetCents)
  const usage = src.usage?.monat === monat ? src.usage : leereUsage(monat)
  const freigabe = normalizeAutomatikFreigabe(src.automatikFreigabe, monat)
  const kostenCents = sichereZahl(usage.kostenCents)
  return {
    konfiguriert: budgetCents !== null,
    erreicht: budgetCents !== null && kostenCents >= budgetCents,
    budgetCents,
    kostenCents,
    freigaben: freigabe.verbleibend,
  }
}

// Eine Einzelfreigabe wird synchron beansprucht. So koennen zwei nahezu
// gleichzeitige Automatik-Ausloeser niemals dieselbe Zustimmung verwenden.
export function beansprucheAutomatiklauf(settings, monat = aktuellerMonat()) {
  const stand = budgetStand(settings, monat)
  if (!stand.konfiguriert) {
    return { erlaubt: true, grund: 'kein-budget', freigabeVerbraucht: false }
  }
  if (!stand.erreicht) {
    return { erlaubt: true, grund: 'unter-budget', freigabeVerbraucht: false }
  }
  const freigabe = normalizeAutomatikFreigabe(settings?.automatikFreigabe, monat)
  if (freigabe.verbleibend > 0) {
    freigabe.verbleibend -= 1
    settings.automatikFreigabe = freigabe
    return { erlaubt: true, grund: 'einmal-freigegeben', freigabeVerbraucht: true }
  }
  if (settings && typeof settings === 'object') settings.automatikFreigabe = freigabe
  return { erlaubt: false, grund: 'monatsbudget-erreicht', freigabeVerbraucht: false }
}

export function gibNaechstenAutomatiklaufFrei(settings, monat = aktuellerMonat()) {
  if (!settings || typeof settings !== 'object') return null
  settings.automatikFreigabe = { monat, verbleibend: 1 }
  return settings.automatikFreigabe
}

// Unbekannte/kaputte Werte fallen auf sichere Standards zurueck; zusaetzlich
// gespeicherte Felder bleiben erhalten (vorwaertskompatibel).
export function normalizeSettings(raw, monat = aktuellerMonat()) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const s = Object.assign({}, DEFAULT_SETTINGS, src)
  s.structWidth = Math.max(360, Math.min(940, +s.structWidth || 560))
  s.accent = ACCENTS.includes(s.accent) ? s.accent : 'sky'
  s.sidebarCollapsed = !!s.sidebarCollapsed
  s.kiMonatsbudgetCents = normalizeKiBudget(src.kiMonatsbudgetCents)
  s.usage = normalizeUsage(src.usage, monat)
  s.automatikFreigabe = normalizeAutomatikFreigabe(src.automatikFreigabe, monat)
  return s
}
