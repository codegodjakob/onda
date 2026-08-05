// Beobachtbare Entwicklung einer Autorin oder eines Autors — PUR, ohne DOM und ohne
// semantische Ratekunst. Muster werden nur wortgleich gruppiert; Verbindungen und
// Stimmenmerkmale bleiben Vorschlaege, bis die Person sie ausdruecklich bestaetigt.

import { createMemoryEntry, ensureMemoryStore } from './memory-model.mjs'
import { erkanntesListe, ERKANNTES_TYP } from './erkanntes-model.mjs'

function text(wert, label = '') {
  const ergebnis = typeof wert === 'string' ? wert.trim() : ''
  if (!ergebnis && label) throw new TypeError(`${label} is required`)
  return ergebnis
}

function hash(wert) {
  let zahl = 2166136261
  for (const zeichen of String(wert)) {
    zahl ^= zeichen.codePointAt(0)
    zahl = Math.imul(zahl, 16777619)
  }
  return (zahl >>> 0).toString(36)
}

function clone(wert) {
  if (wert === undefined) return undefined
  return JSON.parse(JSON.stringify(wert))
}

function prinzipEintraege(store) {
  return ensureMemoryStore(store).entries.filter(eintrag => (
    eintrag?.type === ERKANNTES_TYP
    && eintrag.level === 'personal'
    && eintrag.status === 'active'
    && eintrag.scope?.allProjects === true
  ))
}

export function projiziereAutorentwicklung(store) {
  const eintraege = prinzipEintraege(store)
  const jeId = new Map(eintraege.map(eintrag => [eintrag.id, eintrag]))
  const patterns = erkanntesListe(store).map(gruppe => ({
    key: gruppe.schluessel,
    statement: gruppe.satz,
    dimensionen: [...gruppe.dimensionen],
    occurrences: gruppe.ids.map(id => {
      const eintrag = jeId.get(id)
      return {
        entryId: id,
        at: eintrag?.createdAt || 0,
        documentId: eintrag?.person?.occurrence?.documentId || null,
        projectId: eintrag?.person?.occurrence?.projectId || null,
        anchor: eintrag?.person?.occurrence?.anchor || '',
        provenance: clone(eintrag?.provenance || null),
      }
    }),
  }))

  const masterySignals = patterns
    .filter(pattern => pattern.occurrences.length >= 2)
    .map(pattern => ({
      id: `mastery:recurrence:${hash(pattern.key)}`,
      kind: 'recurrence',
      patternKey: pattern.key,
      evidenceCount: pattern.occurrences.length,
      evidenceIds: pattern.occurrences.map(item => item.entryId),
    }))

  const eventArten = new Map([
    ['author-self-correction', 'self-correction'],
    ['author-own-version', 'own-version'],
    ['author-confirmed-success', 'confirmed-success'],
  ])
  ;(Array.isArray(store?.events) ? store.events : []).forEach(event => {
    const art = eventArten.get(event?.kind)
    if (!art || event?.provenance?.actor !== 'user') return
    masterySignals.push({
      id: `mastery:${art}:${event.id}`,
      kind: art,
      eventId: event.id,
      entityId: event.entityId || null,
      at: event.at,
    })
  })
  return { patterns, masterySignals }
}

export function schlageMusterverbindungVor({ patternKeys, label, reason, at = Date.now() } = {}) {
  const keys = [...new Set((Array.isArray(patternKeys) ? patternKeys : []).map(wert => text(String(wert))).filter(Boolean))]
  if (keys.length < 2) throw new TypeError('Eine Musterverbindung braucht mindestens zwei Muster')
  if (!Number.isFinite(at)) throw new TypeError('Musterverbindung time is required')
  const name = text(label, 'Musterverbindung label')
  const begruendung = text(reason, 'Musterverbindung reason')
  return {
    id: `musterverbindung:${hash(`${keys.slice().sort().join('|')}|${name}|${begruendung}`)}`,
    patternKeys: keys,
    label: name,
    reason: begruendung,
    status: 'pending',
    proposedAt: at,
    provenance: { actor: 'agent', action: 'pattern-link-proposal' },
  }
}

function entscheideVorschlag(vorschlag, { approved, actor, at }, art) {
  if (vorschlag?.status !== 'pending') throw new TypeError(`${art} ist nicht offen`)
  if (actor !== 'user') throw new TypeError(`${art} requires explicit user consent`)
  if (!Number.isFinite(at)) throw new TypeError(`${art} time is required`)
  return {
    ...clone(vorschlag),
    status: approved === true ? 'approved' : 'rejected',
    decidedAt: at,
    decision: { actor: 'user', approved: approved === true },
  }
}

export function entscheideMusterverbindung(vorschlag, entscheidung) {
  return entscheideVorschlag(vorschlag, entscheidung, 'Musterverbindung')
}

export function gruppiereVerbundeneMuster(patterns, verbindungen = []) {
  const muster = Array.isArray(patterns) ? patterns : []
  const index = new Map(muster.map((eintrag, nummer) => [eintrag.key, nummer]))
  const eltern = muster.map((_, nummer) => nummer)
  const finde = nummer => {
    let aktuell = nummer
    while (eltern[aktuell] !== aktuell) aktuell = eltern[aktuell]
    return aktuell
  }
  const vereinige = (a, b) => {
    const links = finde(a)
    const rechts = finde(b)
    if (links !== rechts) eltern[rechts] = links
  }
  const labelJeWurzel = new Map()
  ;(Array.isArray(verbindungen) ? verbindungen : [])
    .filter(verbindung => verbindung?.status === 'approved')
    .forEach(verbindung => {
      const nummern = verbindung.patternKeys.map(key => index.get(key)).filter(Number.isInteger)
      nummern.slice(1).forEach(nummer => vereinige(nummern[0], nummer))
      if (nummern.length) labelJeWurzel.set(finde(nummern[0]), verbindung.label)
    })
  const gruppen = new Map()
  muster.forEach((eintrag, nummer) => {
    const wurzel = finde(nummer)
    if (!gruppen.has(wurzel)) gruppen.set(wurzel, [])
    gruppen.get(wurzel).push(eintrag)
  })
  return [...gruppen.entries()].map(([wurzel, eintraege]) => ({
    label: labelJeWurzel.get(finde(wurzel)) || eintraege[0].statement,
    patterns: eintraege,
  }))
}

function saubereAnker(anchors) {
  const ergebnis = (Array.isArray(anchors) ? anchors : []).map(anchor => ({
    projectId: text(anchor?.projectId),
    textId: text(anchor?.textId),
    exact: text(anchor?.exact),
    actor: text(anchor?.actor),
  }))
  if (ergebnis.some(anchor => anchor.actor !== 'user')) {
    throw new TypeError('Stimmenmerkmal braucht ausschliesslich Nutzertext als Beleg')
  }
  const eindeutig = new Map(ergebnis
    .filter(anchor => anchor.projectId && anchor.textId && anchor.exact)
    .map(anchor => [`${anchor.projectId}:${anchor.textId}:${anchor.exact}`, anchor]))
  if (eindeutig.size < 2) throw new TypeError('Stimmenmerkmal braucht mindestens zwei verschiedene Nutzeranker')
  return [...eindeutig.values()]
}

export function schlageStimmenmerkmalVor({ trait, anchors, at = Date.now() } = {}) {
  const merkmal = text(trait, 'Stimmenmerkmal')
  if (!Number.isFinite(at)) throw new TypeError('Stimmenmerkmal time is required')
  const belege = saubereAnker(anchors)
  return {
    id: `stimmenmerkmal:${hash(`${merkmal}|${JSON.stringify(belege)}`)}`,
    trait: merkmal,
    anchors: belege,
    status: 'pending',
    proposedAt: at,
    provenance: { actor: 'agent', action: 'voice-trait-proposal' },
  }
}

export function entscheideStimmenmerkmal(vorschlag, entscheidung) {
  return entscheideVorschlag(vorschlag, entscheidung, 'Stimmenmerkmal')
}

export function speichereStimmenmerkmal(store, vorschlag) {
  if (vorschlag?.status !== 'approved' || vorschlag?.decision?.actor !== 'user') {
    throw new TypeError('Stimmenmerkmal ist nicht von der Person freigegeben')
  }
  const next = ensureMemoryStore(clone(store))
  const basisId = `voice:${vorschlag.id}`
  if (next.entries.some(eintrag => (
    eintrag?.status === 'active'
    && eintrag.type === 'voice'
    && eintrag.content === vorschlag.trait
    && eintrag.provenance?.action === 'voice-trait-approve'
  ))) return next
  // Eine Rücknahme bleibt als überholter Eintrag erhalten. Wird dasselbe Merkmal später
  // erneut bewusst freigegeben, entsteht deshalb eine neue Version statt die alte Herkunft
  // rückwirkend umzuschreiben.
  const id = next.entries.some(eintrag => eintrag?.id === basisId)
    ? `${basisId}:${vorschlag.decidedAt}`
    : basisId
  if (next.entries.some(eintrag => eintrag?.id === id)) return next
  next.entries.push(createMemoryEntry({
    id,
    level: 'personal',
    type: 'voice',
    content: vorschlag.trait,
    scope: { ownerId: 'local-author', allProjects: true },
    provenance: {
      actor: 'user',
      action: 'voice-trait-approve',
      originEventIds: vorschlag.anchors.map(anchor => `${anchor.projectId}:${anchor.textId}:${hash(anchor.exact)}`),
    },
    sensitivity: 'personal',
    deletionRule: 'manual',
    createdAt: vorschlag.decidedAt,
  }))
  return next
}

export function ueberholeStimmenmerkmal(store, entryId, at = Date.now()) {
  if (!Number.isFinite(at)) throw new TypeError('Stimmenmerkmal time is required')
  const next = ensureMemoryStore(clone(store))
  const eintrag = next.entries.find(kandidat => kandidat?.id === entryId)
  if (
    !eintrag
    || eintrag.type !== 'voice'
    || eintrag.level !== 'personal'
    || eintrag.provenance?.action !== 'voice-trait-approve'
  ) throw new TypeError('Stimmenmerkmal ist unbekannt')
  eintrag.status = 'superseded'
  eintrag.supersededAt = at
  return next
}
