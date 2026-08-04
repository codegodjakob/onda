// prosa und lyrik ergaenzt am 05.08.2026: das Abstract nennt "bis hin zu Prosatexten"
// ausdruecklich als Bandbreite, die Liste kannte sie nicht. Ein Gedicht landete unter
// 'other' und behielt damit alle vier Integritaetsfragen (textart-regeln.mjs) -- bei
// einem Gedicht ist die Forderung nach einer Quellenangabe nicht streng, sondern absurd.
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
  profile.houseStyle = cleanList(profile.houseStyle)
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

  const houseStyle = profileValue(normalized, 'houseStyle')
  if (houseStyle !== undefined) {
    known.houseStyle = houseStyle
    sources.houseStyle = 'language-profile'
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
    else if (field === 'audience' || field === 'houseStyle') next[field] = cleanList(value)
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
