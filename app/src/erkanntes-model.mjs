// Was diese Person schon erkannt hat — PUR, node-testbar, kein DOM.
//
// Der erste Ort in Onda, der einem MENSCHEN gehört und nicht einem Ding. Bisher hing
// alles an einem Artefakt: Hinweise am Dokument, Profile am Projekt. Es gab im ganzen
// Datenmodell keine Stelle, die "Jakob" heißt. Ohne die lässt sich der Anspruch
// "erweitert über die Zeit seinen persönlichen Erkenntnishorizont" nicht einlösen —
// das ist kein fehlender Knopf, das war ein fehlendes Substantiv.
//
// Gespeichert wird genau EIN Satz je Eintrag: das übertragbare Prinzip. Nicht der
// Einzelfall. "Wo zwei Größen verglichen werden, trägt der Vergleich das Argument"
// gilt beim nächsten Text wieder; "dieser Satz vergleicht schief" nicht.
//
// KEIN neues Speicherformat. Der Eintrag ist ein gewöhnlicher Gedächtniseintrag
// (memory-model.mjs) auf der Ebene 'personal' mit allProjects — beides gibt es dort
// seit jeher, geschrieben hat es nur nie jemand.

import { createMemoryEntry, ensureMemoryStore } from './memory-model.mjs'

export const ERKANNTES_TYP = 'prinzip'

// Die Obergrenze für den Prompt. Begründung, damit sie später jemand mit Gründen
// ändern kann statt mit Gefühl: ein Prinzip ist ein Satz, rund zwanzig Token. 25 davon
// sind etwa 500 Token je Anfrage — bei den heutigen Preisen ein Bruchteil eines Cents,
// und mehr, als ein Mensch gleichzeitig im Kopf hat. Wächst der Speicher darüber
// hinaus, fallen zuerst die Sätze heraus, die nur ein einziges Mal aufkamen.
export const PROMPT_GRENZE = 25

// Zwei Sätze sind derselbe, wenn sie sich nur in Groß-/Kleinschreibung, Satzzeichen
// oder Leerraum unterscheiden. Bewusst NICHT klüger: eine unscharfe Ähnlichkeit würde
// zwei verschiedene Einsichten zu einer verschmelzen, und der Schaden davon ist
// größer als der Nutzen der Zusammenfassung.
export function schluesselFuer(satz) {
  return String(satz || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function istPrinzip(eintrag) {
  return Boolean(
    eintrag
    && eintrag.type === ERKANNTES_TYP
    && eintrag.level === 'personal'
    && eintrag.scope?.allProjects === true,
  )
}

// Jede Begegnung ist ein eigener Eintrag. Die Häufigkeit ergibt sich aus der Gruppe,
// sie steht nirgends als Zahl — so bleibt zu jeder Begegnung erhalten, woher sie kam
// und wann sie war. Ein Zähler hätte diese Herkunft verschluckt.
export function schreibeErkanntes(store, { satz, herkunft = 'hand', dokumentId = null, projektId = null, beleg = '', at = Date.now() } = {}) {
  const sicher = ensureMemoryStore(store)
  const text = String(satz || '').trim()
  if (!text) return { store: sicher, eintrag: null, grund: 'leer' }

  const eintrag = createMemoryEntry({
    id: `erkanntes-${at.toString(36)}-${schluesselFuer(text).slice(0, 24).replace(/\s/g, '-') || 'satz'}`,
    level: 'personal',
    type: ERKANNTES_TYP,
    content: text,
    scope: { ownerId: 'local-author', allProjects: true },
    provenance: {
      actor: herkunft === 'hand' ? 'user' : 'agent',
      action: `erkanntes-${herkunft}`,
      // Woher der Satz kam, bleibt an jeder einzelnen Begegnung haengen. Das
      // Gedaechtnismodell verlangt mindestens eine Herkunft und hat recht damit:
      // ein Prinzip ohne Anlass laesst sich spaeter nicht mehr nachpruefen.
      originEventIds: [dokumentId, projektId, beleg].filter(Boolean).map(String).length
        ? [dokumentId, projektId, beleg].filter(Boolean).map(String)
        : [`herkunft-${herkunft}`],
    },
    sensitivity: 'personal',
    // 'manual': ein erkanntes Prinzip stirbt nicht mit dem Text, in dem es aufkam.
    // Genau darin liegt sein Wert.
    deletionRule: 'manual',
    createdAt: at,
  })
  sicher.entries.push(eintrag)
  return { store: sicher, eintrag }
}

// Gruppiert nach Satz. treffer ist die Zahl der Begegnungen, zuletzt die jüngste.
export function erkanntesListe(store) {
  const sicher = ensureMemoryStore(store)
  const gruppen = new Map()
  for (const eintrag of sicher.entries) {
    if (!istPrinzip(eintrag) || eintrag.status !== 'active') continue
    const schluessel = schluesselFuer(eintrag.content)
    if (!schluessel) continue
    const vorhanden = gruppen.get(schluessel)
    if (vorhanden) {
      vorhanden.treffer += 1
      vorhanden.ids.push(eintrag.id)
      if (eintrag.createdAt > vorhanden.zuletzt) vorhanden.zuletzt = eintrag.createdAt
    } else {
      gruppen.set(schluessel, {
        schluessel,
        satz: eintrag.content,
        treffer: 1,
        zuletzt: eintrag.createdAt,
        ids: [eintrag.id],
      })
    }
  }
  return [...gruppen.values()].sort((a, b) => b.treffer - a.treffer || b.zuletzt - a.zuletzt)
}

// Rücknahme. Von Anfang an gebaut, nicht zuletzt: ohne sie wiederholt sich ein
// falscher Satz in JEDEM künftigen Text, und der Speicher vergiftet sich selbst.
// Das ist das größte Risiko dieses ganzen Umbaus.
export function ueberholeErkanntes(store, schluessel, at = Date.now()) {
  const sicher = ensureMemoryStore(store)
  const gesucht = schluesselFuer(schluessel)
  let getroffen = 0
  for (const eintrag of sicher.entries) {
    if (!istPrinzip(eintrag) || eintrag.status !== 'active') continue
    if (schluesselFuer(eintrag.content) !== gesucht) continue
    eintrag.status = 'superseded'
    eintrag.supersededAt = at
    getroffen += 1
  }
  return { store: sicher, getroffen }
}

// Was in den Prompt geht. Die Reihenfolge ist die Auswahlregel: was am häufigsten
// wiederkam, steht oben — denn genau das droht ein weiteres Mal gesagt zu werden.
export function erkanntesFuerPrompt(store, grenze = PROMPT_GRENZE) {
  return erkanntesListe(store)
    .slice(0, Math.max(0, grenze))
    .map(gruppe => (gruppe.treffer > 1 ? `${gruppe.satz} (${gruppe.treffer}×)` : gruppe.satz))
}
