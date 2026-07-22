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
})

// Unbekannte/kaputte Werte fallen auf sichere Standards zurueck; zusaetzlich
// gespeicherte Felder bleiben erhalten (vorwaertskompatibel).
export function normalizeSettings(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const s = Object.assign({}, DEFAULT_SETTINGS, src)
  s.structWidth = Math.max(360, Math.min(940, +s.structWidth || 560))
  s.accent = ACCENTS.includes(s.accent) ? s.accent : 'sky'
  s.sidebarCollapsed = !!s.sidebarCollapsed
  return s
}
