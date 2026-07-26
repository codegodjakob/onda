export const EXAMPLE_PROJECT_ID = 'p-example'
export const EXAMPLE_SEED_KEY = 'calm-technology'

export function seedBodySignature(body) {
  const value = String(body || '')
    .replace(/\sdata-block-id=("[^"]*"|'[^']*')/g, '')
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}-${value.length}`
}

// Signatures of every "Calm Technology" example body the app shipped BEFORE the
// exampleSeed marker fields existed. Such a doc carries no exampleSeed* markers,
// so once the hardcoded example drifts, matching only against the CURRENT body
// no longer recognises it — and it gets duplicated instead of replaced on a
// version bump. Matching these historical signatures too lets an old, pristine,
// content-drifted seed be replaced in place. This is a closed set: every doc
// created since the marker system carries markers, so no new unmarked example
// bodies can ever appear. (Signatures computed from git history of
// buildExampleBody; earlier versions rendered the title as a leading <h1>.)
export const LEGACY_SEED_SIGNATURES = new Set([
  'fnv1a-a75d3829-894', // pre-Onda baseline: <h1> title + full body
  'fnv1a-1501da66-422', // earlier: <h1> title + shorter body
  'fnv1a-b4667bd3-290', // earliest stored example
])

function isLegacySeed(doc, legacyBody) {
  if (doc?.projectId !== EXAMPLE_PROJECT_ID || doc?.title !== 'Calm Technology') return false
  const signature = seedBodySignature(doc?.body)
  if (typeof legacyBody === 'string' && signature === seedBodySignature(legacyBody)) return true
  return LEGACY_SEED_SIGNATURES.has(signature)
}

function isMarkedSeed(doc) {
  return doc?.exampleSeed === true && doc?.exampleSeedKey === EXAMPLE_SEED_KEY
}

function clearSeedMarker(doc) {
  delete doc.exampleSeed
  delete doc.exampleSeedKey
  delete doc.exampleSeedVersion
  delete doc.exampleSeedSignature
}

function markLegacySeed(doc, version) {
  doc.exampleSeed = true
  doc.exampleSeedKey = EXAMPLE_SEED_KEY
  doc.exampleSeedVersion = Number.isFinite(version) ? version : 0
  doc.exampleSeedSignature = seedBodySignature(doc.body)
}

function isUntouchedSeed(doc) {
  return typeof doc.exampleSeedSignature === 'string'
    && doc.exampleSeedSignature === seedBodySignature(doc.body)
}

export function migrateExampleSeed({
  docs,
  projects,
  settings,
  targetVersion,
  legacyBody,
  createProject,
  createSeed,
}) {
  if (!Array.isArray(docs) || !Array.isArray(projects) || !settings) {
    throw new TypeError('Example seed migration requires docs, projects, and settings')
  }
  if (!Number.isFinite(targetVersion) || typeof createProject !== 'function' || typeof createSeed !== 'function') {
    throw new TypeError('Example seed migration requires a target version and factories')
  }

  let changed = false
  let project = projects.find(candidate => candidate?.id === EXAMPLE_PROJECT_ID)
  if (!project) {
    project = createProject()
    projects.push(project)
    changed = true
  }

  docs.forEach(doc => {
    if (!isMarkedSeed(doc) && isLegacySeed(doc, legacyBody)) {
      markLegacySeed(doc, settings.exampleVersion)
      changed = true
    }
  })

  const needsVersionUpdate = (settings.exampleVersion || 0) < targetVersion
  const markedSeeds = docs.filter(isMarkedSeed)
  let replacementIndex = docs.length

  if (needsVersionUpdate) {
    markedSeeds.forEach(seed => {
      const index = docs.indexOf(seed)
      if (isUntouchedSeed(seed)) {
        replacementIndex = Math.min(replacementIndex, index)
        docs.splice(index, 1)
      } else {
        clearSeedMarker(seed)
      }
      changed = true
    })
  }

  if (needsVersionUpdate || !docs.some(isMarkedSeed)) {
    const seed = createSeed()
    seed.projectId = EXAMPLE_PROJECT_ID
    seed.exampleSeed = true
    seed.exampleSeedKey = EXAMPLE_SEED_KEY
    seed.exampleSeedVersion = targetVersion
    seed.exampleSeedSignature = seedBodySignature(seed.body)
    docs.splice(Math.min(replacementIndex, docs.length), 0, seed)
    changed = true
  }

  if (settings.exampleVersion !== targetVersion || settings.exampleSeeded !== true) changed = true
  settings.exampleVersion = targetVersion
  settings.exampleSeeded = true
  return { changed, project }
}
