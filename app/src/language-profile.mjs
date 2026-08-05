// Eine gemeinsame, exhaustive Quelle für Sprachprofil, Handwerk und Integritätsregeln.
// Prosa und Lyrik sind eigene Gattungen, damit fiktionale oder poetische Verfahren nicht
// unter dem vorsichtigen Sachtext-Rückfall `other` beurteilt werden.
export const LANGUAGE_GENRES = Object.freeze([
  'scientific',
  'essay',
  'project',
  'web',
  'marketing',
  'campaign',
  'prosa',
  'lyrik',
  'other',
])
export const LANGUAGE_REGIONS = Object.freeze(['DE', 'AT', 'CH'])
export const LANGUAGE_MEDIA = Object.freeze([
  'screen',
  'print',
  'academic-submission',
  'presentation',
  'other',
])

const GENRES = new Set(LANGUAGE_GENRES)
const REGIONS = new Set(LANGUAGE_REGIONS)
const MEDIA = new Set(LANGUAGE_MEDIA)
const PROFILE_FIELDS = Object.freeze([
  'genre',
  'passageFunction',
  'defaultFunction',
  'domain',
  'audience',
  'medium',
  'goal',
  'region',
  'houseStyle',
  'audienceState',
])
const REQUIRED_CONTEXT_FIELDS = Object.freeze([
  'genre',
  'passageFunction',
  'domain',
  'audience',
  'medium',
  'goal',
  'region',
])

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  if (value === undefined) return undefined
  return JSON.parse(JSON.stringify(value))
}

function requiredText(value, label) {
  const result = typeof value === 'string' ? value.trim() : ''
  if (!result) throw new TypeError(`${label} is required`)
  return result
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanList(value) {
  return Array.isArray(value)
    ? [...new Set(value.map(item => cleanText(String(item))).filter(Boolean))]
    : []
}

// ---------- Schreibstile ----------------------------------------------------------------
//
// Die Frage, die dieser Teil beantwortet: Was heißt es, dass eine Autorin oder ein Autor
// MEHRERE Schreibstile hat? Vorher kannte das Profil genau einen: houseStyle, eine
// namenlose Liste von Regelzeilen. Damit ließ sich sagen "so schreibe ich" — nicht "so
// schreibe ich HIER, und daneben habe ich noch einen anderen".
//
// Die kleinste ehrliche Fassung ist deshalb ein Name. Ein Stil ist eine benannte Regelmenge
// mit einem Zweck ("wofür nehme ich den"); ein Projekt hat mehrere davon und genau einen
// aktiven. houseStyle bleibt bestehen und ist ab jetzt die SPIEGELUNG des aktiven Stils —
// alles, was houseStyle liest (onda-kontext.mjs schickt es an das Modell,
// language-diagnostics.mjs schützt damit Eigenschreibweisen), liest weiter dasselbe Feld
// und bekommt automatisch die Regeln des gewählten Stils.
//
// Bewusst NICHT gebaut: eine Stilverwaltung über Projektgrenzen hinweg. Das Sprachprofil
// hängt an genau einem Projekt (projectId, ensureLanguageProfile wirft bei einem fremden),
// und ein autorweiter Speicher, den mehrere Projekte teilen, gehört nicht hierher. Solange
// es ihn nicht gibt, ist ein Stil projektlokal — ein sauberer Begriff, keine halbe Verwaltung.
export const DEFAULT_STYLE_NAME = 'Hausstil'
export const DEFAULT_STYLE_ID = 'stil:hausstil'

function styleIdFromName(name) {
  const slug = String(name)
    .toLocaleLowerCase('de-DE')
    .replace(/ä/gu, 'ae')
    .replace(/ö/gu, 'oe')
    .replace(/ü/gu, 'ue')
    .replace(/ß/gu, 'ss')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
  return `stil:${slug || 'ohne-namen'}`
}

function freeStyleId(name, taken) {
  const base = styleIdFromName(name)
  if (!taken.has(base)) return base
  let counter = 2
  while (taken.has(`${base}-${counter}`)) counter += 1
  return `${base}-${counter}`
}

function cleanStyle(value, taken) {
  if (!isObject(value)) return null
  const name = cleanText(value.name)
  if (!name) return null
  const given = cleanText(value.id)
  const id = given && !taken.has(given) ? given : freeStyleId(name, taken)
  return { id, name, purpose: cleanText(value.purpose), rules: cleanList(value.rules) }
}

// Ein Profil hat IMMER mindestens einen Stil und immer einen gültigen aktiven. Ohne diese
// Zusicherung müsste jede Lesestelle den leeren Fall mitdenken, und irgendeine würde ihn
// vergessen.
function cleanStyles(profile) {
  const taken = new Set()
  const styles = []
  ;(Array.isArray(profile.styles) ? profile.styles : []).forEach(entry => {
    const style = cleanStyle(entry, taken)
    if (!style) return
    taken.add(style.id)
    styles.push(style)
  })
  if (!styles.length) {
    styles.push({
      id: DEFAULT_STYLE_ID,
      name: DEFAULT_STYLE_NAME,
      purpose: '',
      rules: cleanList(profile.houseStyle),
    })
  }
  return styles
}

export function activeWritingStyle(profile) {
  const styles = Array.isArray(profile?.styles) ? profile.styles : []
  if (!styles.length) return null
  return styles.find(style => style.id === profile.activeStyleId) || styles[0]
}

function cleanAudienceState(value) {
  const source = isObject(value) ? value : {}
  return {
    priorKnowledge: cleanList(source.priorKnowledge),
    assumptions: cleanList(source.assumptions),
    resistances: cleanList(source.resistances),
    commonGround: cleanList(source.commonGround),
  }
}

function enumValue(value, allowed, label, { allowEmpty = true } = {}) {
  const result = cleanText(value)
  if (!result && allowEmpty) return ''
  if (!allowed.has(result)) throw new TypeError(`Language profile ${label} is invalid: ${result}`)
  return result
}

function migrateEnum(profile, field, allowed) {
  const raw = cleanText(profile[field])
  if (!raw || allowed.has(raw)) {
    if (isObject(profile.invalidValues)) delete profile.invalidValues[field]
    return raw
  }
  if (!isObject(profile.invalidValues)) profile.invalidValues = {}
  profile.invalidValues[field] = raw
  return ''
}

export function ensureLanguageProfile(project) {
  if (!isObject(project)) throw new TypeError('Project is required')
  const projectId = requiredText(project.id, 'Language profile project')
  const profile = isObject(project.languageProfile) ? project.languageProfile : {}
  if (profile.projectId && profile.projectId !== projectId) {
    throw new TypeError('Language profile belongs to a foreign project')
  }
  profile.schemaVersion = 1
  profile.projectId = projectId
  profile.genre = migrateEnum(profile, 'genre', GENRES)
  profile.passageFunction = cleanText(profile.passageFunction || profile.defaultFunction)
  profile.defaultFunction = profile.passageFunction
  profile.domain = cleanText(profile.domain)
  profile.audience = cleanList(profile.audience)
  profile.medium = migrateEnum(profile, 'medium', MEDIA)
  profile.goal = cleanText(profile.goal)
  profile.region = migrateEnum(profile, 'region', REGIONS)
  // Reihenfolge zählt: cleanStyles liest den alten houseStyle, falls es noch keine Stile
  // gibt (Migration eines Profils von vorher). Danach ist der aktive Stil die Quelle, und
  // houseStyle die Spiegelung — nie umgekehrt, sonst gäbe es zwei Wahrheiten.
  profile.styles = cleanStyles(profile)
  profile.activeStyleId = profile.styles.some(style => style.id === cleanText(profile.activeStyleId))
    ? cleanText(profile.activeStyleId)
    : profile.styles[0].id
  profile.houseStyle = [...activeWritingStyle(profile).rules]
  profile.audienceState = cleanAudienceState(profile.audienceState)
  profile.orthographyAutomation = profile.orthographyAutomation === true
  profile.userProvidedFields = cleanList(profile.userProvidedFields)
    .filter(field => PROFILE_FIELDS.includes(field))
  if (!Array.isArray(profile.events)) profile.events = []
  project.languageProfile = profile
  return profile
}

function profileValue(profile, field) {
  const value = profile[field]
  if (Array.isArray(value)) return value.length ? clone(value) : undefined
  return cleanText(value) || undefined
}

export function buildLanguageContext({ project, profile = project?.languageProfile } = {}) {
  if (!isObject(project)) throw new TypeError('Language context project is required')
  const normalized = ensureLanguageProfile({
    ...project,
    languageProfile: clone(profile),
  })
  const known = {}
  const sources = {}
  for (const field of ['genre', 'passageFunction', 'domain', 'medium', 'region']) {
    const value = profileValue(normalized, field)
    if (value !== undefined) {
      known[field] = value
      sources[field] = 'language-profile'
    }
  }

  const understanding = isObject(project.understanding) ? project.understanding : {}
  const profileAudience = profileValue(normalized, 'audience')
  const understandingAudience = cleanList(understanding.audience)
  if (profileAudience !== undefined) {
    known.audience = profileAudience
    sources.audience = 'language-profile'
  } else if (understandingAudience.length) {
    known.audience = understandingAudience
    sources.audience = 'project-understanding'
  }

  const profileGoal = profileValue(normalized, 'goal')
  const understandingGoal = cleanText(understanding.desiredEffect)
  if (profileGoal !== undefined) {
    known.goal = profileGoal
    sources.goal = 'language-profile'
  } else if (understandingGoal) {
    known.goal = understandingGoal
    sources.goal = 'project-understanding'
  }

  // houseStyle sind die Regeln des AKTIVEN Stils. Sein Name kommt nur mit, wenn er
  // überhaupt Regeln trägt — ein leerer Vorgabestil wäre im Kontext nur Rauschen. Die Liste
  // der übrigen Stile kommt mit, sobald es mehr als einen gibt: Erst dann ist "dieser Text
  // folgt Stil A, nicht Stil B" eine Aussage.
  const houseStyle = profileValue(normalized, 'houseStyle')
  const active = activeWritingStyle(normalized)
  if (houseStyle !== undefined) {
    known.houseStyle = houseStyle
    sources.houseStyle = 'language-profile'
  }
  if (active && (
    houseStyle !== undefined
    || active.purpose
    || normalized.styles.length > 1
    || active.name !== DEFAULT_STYLE_NAME
  )) {
    known.styleName = active.name
    sources.styleName = 'language-profile'
    if (active.purpose) {
      known.stylePurpose = active.purpose
      sources.stylePurpose = 'language-profile'
    }
  }
  if (normalized.styles.length > 1) {
    known.styleChoices = normalized.styles.map(style => style.name)
    sources.styleChoices = 'language-profile'
  }
  if (Object.values(normalized.audienceState).some(values => values.length)) {
    known.audienceState = clone(normalized.audienceState)
    sources.audienceState = 'language-profile'
  }
  const missing = REQUIRED_CONTEXT_FIELDS.filter(field => {
    const value = known[field]
    return Array.isArray(value) ? !value.length : !value
  })
  return {
    projectId: normalized.projectId,
    complete: missing.length === 0,
    known,
    missing,
    sources,
  }
}

export function updateLanguageProfile({
  profile,
  projectId,
  changes,
  at = Date.now(),
}) {
  if (!Number.isFinite(at)) throw new TypeError('Language profile update time is required')
  const normalizedProjectId = requiredText(projectId, 'Language profile project')
  const next = ensureLanguageProfile({
    id: normalizedProjectId,
    languageProfile: clone(profile),
  })
  if (next.projectId !== normalizedProjectId) {
    throw new TypeError('Language profile project mismatch')
  }
  if (!isObject(changes)) throw new TypeError('Language profile changes are required')
  const unknown = Object.keys(changes).find(field => !PROFILE_FIELDS.includes(field))
  if (unknown) throw new TypeError(`Language profile field is unknown: ${unknown}`)

  const previous = {}
  const applied = {}
  Object.entries(changes).forEach(([field, value]) => {
    previous[field] = clone(next[field])
    if (field === 'genre') next[field] = enumValue(value, GENRES, 'genre')
    else if (field === 'region') next[field] = enumValue(value, REGIONS, 'region')
    else if (field === 'medium') next[field] = enumValue(value, MEDIA, 'medium')
    else if (field === 'audience') next[field] = cleanList(value)
    // Wer houseStyle setzt, setzt die Regeln des aktiven Stils. Ohne diesen Durchgriff
    // stünden hinterher zwei verschiedene Regelmengen im Profil, und die nächste
    // Normalisierung würde die eben eingegebene stillschweigend überschreiben.
    else if (field === 'houseStyle') {
      next[field] = cleanList(value)
      activeWritingStyle(next).rules = [...next[field]]
    }
    else if (field === 'audienceState') next[field] = cleanAudienceState(value)
    else next[field] = cleanText(value)
    if (field === 'passageFunction' || field === 'defaultFunction') {
      next.passageFunction = cleanText(value)
      next.defaultFunction = next.passageFunction
      applied.passageFunction = next.passageFunction
      applied.defaultFunction = next.defaultFunction
    }
    applied[field] = clone(next[field])
    if (!next.userProvidedFields.includes(field)) next.userProvidedFields.push(field)
  })
  next.events.push({
    id: `language-profile-event:${normalizedProjectId}:${at}`,
    projectId: normalizedProjectId,
    kind: 'profile-corrected',
    previous,
    next: applied,
    provenance: { actor: 'user', action: 'language-profile-update' },
    at,
  })
  return next
}

// Legt einen Stil an oder schreibt einen vorhandenen fort. Der Name ist der Schlüssel:
// Wer denselben Namen zweimal verwendet, meint denselben Stil und ändert ihn. Ein neuer
// Stil wird sofort der aktive — wer ihn anlegt, will mit ihm schreiben.
export function defineWritingStyle({
  profile,
  projectId,
  name,
  rules = [],
  purpose = '',
  at = Date.now(),
}) {
  if (!Number.isFinite(at)) throw new TypeError('Writing style time is required')
  const normalizedProjectId = requiredText(projectId, 'Writing style project')
  const next = ensureLanguageProfile({ id: normalizedProjectId, languageProfile: clone(profile) })
  const normalizedName = requiredText(name, 'Writing style name')
  const normalizedRules = cleanList(rules)
  const normalizedPurpose = cleanText(purpose)
  const existing = next.styles.find(style => style.name === normalizedName)
  const previous = existing ? clone(existing) : null
  const style = existing || {
    id: freeStyleId(normalizedName, new Set(next.styles.map(entry => entry.id))),
    name: normalizedName,
    purpose: '',
    rules: [],
  }
  style.purpose = normalizedPurpose
  style.rules = normalizedRules
  if (!existing) next.styles.push(style)
  next.activeStyleId = style.id
  next.houseStyle = [...style.rules]
  next.events.push({
    id: `language-profile-event:writing-style:${normalizedProjectId}:${style.id}:${at}`,
    projectId: normalizedProjectId,
    kind: previous ? 'writing-style-changed' : 'writing-style-defined',
    styleId: style.id,
    previous,
    next: clone(style),
    provenance: { actor: 'user', action: 'writing-style-define' },
    at,
  })
  return next
}

// Wechselt den aktiven Stil. Ein unbekannter Stil wirft, statt still auf den ersten
// zurückzufallen: Ein Text, der unbemerkt nach dem falschen Stil geprüft wird, ist
// schlimmer als eine Fehlermeldung.
export function selectWritingStyle({
  profile,
  projectId,
  styleId,
  at = Date.now(),
}) {
  if (!Number.isFinite(at)) throw new TypeError('Writing style time is required')
  const normalizedProjectId = requiredText(projectId, 'Writing style project')
  const next = ensureLanguageProfile({ id: normalizedProjectId, languageProfile: clone(profile) })
  const normalizedStyleId = requiredText(styleId, 'Writing style')
  const style = next.styles.find(entry => entry.id === normalizedStyleId)
  if (!style) throw new TypeError(`Writing style is unknown: ${normalizedStyleId}`)
  const previous = next.activeStyleId
  next.activeStyleId = style.id
  next.houseStyle = [...style.rules]
  if (previous !== style.id) {
    next.events.push({
      id: `language-profile-event:writing-style-selected:${normalizedProjectId}:${style.id}:${at}`,
      projectId: normalizedProjectId,
      kind: 'writing-style-selected',
      styleId: style.id,
      previous,
      next: style.id,
      provenance: { actor: 'user', action: 'writing-style-select' },
      at,
    })
  }
  return next
}

// Speichert Profilfelder und den gerade bearbeiteten Stil als EINEN atomaren Vorgang.
// Der entscheidende Sonderfall ist ein neuer Stilname: Seine Regeln duerfen nicht zuerst
// ueber houseStyle in den bisher aktiven Stil geschrieben werden. Genau das passierte im
// Formular, als es updateLanguageProfile und defineWritingStyle nacheinander aufrief.
export function saveLanguageProfileWithStyle({
  profile,
  projectId,
  changes = {},
  style = {},
  at = Date.now(),
}) {
  if (!Number.isFinite(at)) throw new TypeError('Language profile time is required')
  const safeChanges = isObject(changes) ? { ...changes } : {}
  delete safeChanges.houseStyle
  delete safeChanges.styles
  delete safeChanges.activeStyleId

  const next = updateLanguageProfile({ profile, projectId, changes: safeChanges, at })
  const current = activeWritingStyle(next)
  const name = cleanText(style?.name) || current?.name
  if (!name) throw new TypeError('Writing style name is required')
  const purpose = style?.purpose === undefined ? (current?.purpose || '') : style.purpose
  const rules = style?.rules === undefined
    ? cleanList(changes?.houseStyle ?? current?.rules)
    : cleanList(style.rules)
  return defineWritingStyle({ profile: next, projectId, name, purpose, rules, at })
}

export function setOrthographyAutomation({
  profile,
  projectId,
  enabled,
  at = Date.now(),
}) {
  if (!Number.isFinite(at)) throw new TypeError('Orthography setting time is required')
  const normalizedProjectId = requiredText(projectId, 'Language profile project')
  const next = ensureLanguageProfile({ id: normalizedProjectId, languageProfile: clone(profile) })
  const previous = next.orthographyAutomation
  next.orthographyAutomation = enabled === true
  next.events.push({
    id: `language-profile-event:orthography:${normalizedProjectId}:${at}`,
    projectId: normalizedProjectId,
    kind: 'orthography-setting-changed',
    previous,
    next: next.orthographyAutomation,
    provenance: { actor: 'user', action: 'orthography-opt-in' },
    at,
  })
  return next
}
