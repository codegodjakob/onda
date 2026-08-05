const EXPORT_KIND = 'ai-writing-tool-complete-export'
const REQUIRED_COLLECTIONS = Object.freeze(['docs', 'projects'])
const REQUIRED_OBJECTS = Object.freeze(['settings', 'memoryStore'])
const SECRET_KEY = /(?:api[-_]?key|password|passwd|secret|token|cookie|authorization|credential|session)/iu
const PERSISTED_KEYS = Object.freeze([
  'schemaVersion',
  'docs',
  'active',
  'projects',
  'activeProject',
  'settings',
  'memoryStore',
  // laufJournal (Issue #12): muss ins Voll-Exportpaket, sonst verliert „Alle Daten
  // exportieren" die Lauf-Chronik still. emptyLocalState() bleibt bewusst OHNE dieses
  // Feld -- ein Alles-loeschen soll das Journal wegwerfen; normalisiereLaufJournal
  // defaultet beim naechsten Laden ohnehin auf ein leeres Journal.
  'laufJournal',
])

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map(key => (
      `${JSON.stringify(key)}:${stableJson(value[key])}`
    )).join(',')}}`
  }
  return JSON.stringify(value)
}

function stableHash(value) {
  let hash = 2166136261
  for (const character of String(value)) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function redactAndSort(value, ancestors = new WeakSet()) {
  if (!value || typeof value !== 'object') return value
  if (ancestors.has(value)) throw new TypeError('Local data contains a cyclic reference')
  ancestors.add(value)
  let output
  if (Array.isArray(value)) {
    output = value.map(item => redactAndSort(item, ancestors))
  } else {
    output = {}
    Object.keys(value).sort().forEach(key => {
      if (SECRET_KEY.test(key)) return
      const item = value[key]
      if (typeof item === 'function' || typeof item === 'symbol' || item === undefined) return
      output[key] = redactAndSort(item, ancestors)
    })
  }
  ancestors.delete(value)
  return output
}

function selectPersistedState(state) {
  if (!isObject(state)) throw new TypeError('Local state is required')
  const selected = {}
  PERSISTED_KEYS.forEach(key => {
    if (state[key] !== undefined) selected[key] = state[key]
  })
  return selected
}

function countProvenance(value) {
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + countProvenance(item), 0)
  if (!isObject(value)) return 0
  return Number(isObject(value.provenance))
    + Object.values(value).reduce((sum, item) => sum + countProvenance(item), 0)
}

function decisionCount(state) {
  const documentDecisions = state.docs.reduce((sum, doc) => (
    sum + (Array.isArray(doc?.decisions) ? doc.decisions.length : 0)
  ), 0)
  return documentDecisions + state.projects.reduce((sum, project) => (
    sum
    + (Array.isArray(project?.argumentModel?.events) ? project.argumentModel.events.length : 0)
    + (Array.isArray(project?.argumentModel?.deliberationRounds) ? project.argumentModel.deliberationRounds.length : 0)
    + (Array.isArray(project?.languageProfile?.events) ? project.languageProfile.events.length : 0)
    + (Array.isArray(project?.languageReports?.decisions) ? project.languageReports.decisions.length : 0)
    + (Array.isArray(project?.finalAudits?.history) ? project.finalAudits.history.length : 0)
  ), 0)
}

function buildManifest(state) {
  return {
    schemaVersion: 1,
    requiredCollections: [...REQUIRED_COLLECTIONS],
    requiredObjects: [...REQUIRED_OBJECTS],
    counts: {
      projects: state.projects.length,
      texts: state.docs.length,
      sources: state.projects.reduce((sum, project) => (
        sum + (Array.isArray(project?.sources) ? project.sources.length : 0)
      ), 0),
      decisions: decisionCount(state),
      provenanceRecords: countProvenance(state),
    },
    domains: {
      texts: true,
      projects: true,
      sources: true,
      evidenceBundles: true,
      researchRuns: true,
      decisions: true,
      languageReports: true,
      finalAudits: true,
      provenance: true,
      memory: true,
      settings: true,
    },
  }
}

function structuralPayload(payload) {
  return {
    schemaVersion: payload.schemaVersion,
    kind: payload.kind,
    appStateSchemaVersion: payload.appStateSchemaVersion,
    manifest: payload.manifest,
    state: payload.state,
  }
}

function invalid(category, ...errors) {
  return { valid: false, category, errors }
}

function validateCollections(state) {
  if (!isObject(state)) return invalid('collection', 'Die State-Sammlung fehlt.')
  for (const key of REQUIRED_COLLECTIONS) {
    if (!Array.isArray(state[key])) return invalid('collection', `Die Pflichtsammlung ${key} fehlt.`)
  }
  for (const key of REQUIRED_OBJECTS) {
    if (!isObject(state[key])) return invalid('collection', `Das Pflichtobjekt ${key} fehlt.`)
  }
  return null
}

function findSecretKey(value, path = 'state') {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findSecretKey(value[index], `${path}[${index}]`)
      if (found) return found
    }
    return null
  }
  if (!isObject(value)) return null
  for (const [key, item] of Object.entries(value)) {
    if (SECRET_KEY.test(key)) return `${path}.${key}`
    const found = findSecretKey(item, `${path}.${key}`)
    if (found) return found
  }
  return null
}

function validateReferences(state) {
  const projectIds = new Set()
  for (const project of state.projects) {
    if (!isObject(project) || typeof project.id !== 'string' || !project.id) {
      return invalid('reference', 'Ein Projekt besitzt keine stabile ID.')
    }
    if (projectIds.has(project.id)) return invalid('reference', `Die Projekt-ID ${project.id} ist doppelt.`)
    projectIds.add(project.id)
  }
  const docIds = new Set()
  for (const doc of state.docs) {
    if (!isObject(doc) || typeof doc.id !== 'string' || !doc.id) {
      return invalid('reference', 'Ein Text besitzt keine stabile ID.')
    }
    if (docIds.has(doc.id)) return invalid('reference', `Die Text-ID ${doc.id} ist doppelt.`)
    docIds.add(doc.id)
    if (!projectIds.has(doc.projectId)) {
      return invalid('reference', `Der Text ${doc.id} verweist auf ein fehlendes Projekt.`)
    }
  }
  if (state.activeProject !== null && state.activeProject !== undefined && !projectIds.has(state.activeProject)) {
    return invalid('reference', 'Das aktive Projekt fehlt im Datenpaket.')
  }
  if (state.active !== null && state.active !== undefined && !docIds.has(state.active)) {
    return invalid('reference', 'Der aktive Text fehlt im Datenpaket.')
  }
  for (const project of state.projects) {
    for (const collection of ['sources', 'evidenceBundles', 'researchRuns']) {
      for (const entity of Array.isArray(project[collection]) ? project[collection] : []) {
        if (entity?.projectId && entity.projectId !== project.id) {
          return invalid('reference', `${collection} enthält einen projektfremden Eintrag.`)
        }
      }
    }
  }
  return null
}

export function exportAllLocalData({ state, at = Date.now() } = {}) {
  if (!Number.isFinite(at)) throw new TypeError('Local data export time is required')
  const safeState = redactAndSort(selectPersistedState(state))
  const collectionError = validateCollections(safeState)
  if (collectionError) throw new TypeError(collectionError.errors[0])
  const referenceError = validateReferences(safeState)
  if (referenceError) throw new TypeError(referenceError.errors[0])
  const manifest = buildManifest(safeState)
  const structural = {
    schemaVersion: 1,
    kind: EXPORT_KIND,
    appStateSchemaVersion: Number(safeState.schemaVersion) || 12,
    manifest,
    state: safeState,
  }
  return {
    ...structural,
    fingerprint: stableHash(stableJson(structural)),
    exportedAt: at,
  }
}

export function validateAllLocalDataExport(value) {
  if (!isObject(value) || value.kind !== EXPORT_KIND || value.schemaVersion !== 1) {
    return invalid('format', 'Das Datenpaket besitzt ein unbekanntes Format.')
  }
  const collectionError = validateCollections(value.state)
  if (collectionError) return collectionError
  const secretPath = findSecretKey(value.state)
  if (secretPath) return invalid('secret', `Das Datenpaket enthält ein nicht erlaubtes Geheimnisfeld: ${secretPath}.`)
  const referenceError = validateReferences(value.state)
  if (referenceError) return referenceError
  const expectedManifest = buildManifest(value.state)
  if (stableJson(value.manifest) !== stableJson(expectedManifest)) {
    return invalid('manifest', 'Das Manifest stimmt nicht mit dem Datenbestand überein.')
  }
  const expectedFingerprint = stableHash(stableJson(structuralPayload(value)))
  if (value.fingerprint !== expectedFingerprint) {
    return invalid('fingerprint', 'Der strukturelle Fingerprint stimmt nicht.')
  }
  if (!Number.isFinite(value.exportedAt)) {
    return invalid('format', 'Der Exportzeitpunkt fehlt.')
  }
  return { valid: true, category: null, errors: [] }
}

export function importAllLocalData(value) {
  const result = validateAllLocalDataExport(value)
  if (!result.valid) {
    throw new TypeError(`Local data import rejected (${result.category}): ${result.errors.join(' ')}`)
  }
  return clone(value.state)
}

export function emptyLocalState() {
  return {
    schemaVersion: 12,
    docs: [],
    active: null,
    projects: [],
    activeProject: null,
    settings: {},
    memoryStore: { schemaVersion: 1, records: [], events: [] },
  }
}
