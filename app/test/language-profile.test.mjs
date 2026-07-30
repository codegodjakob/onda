import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildLanguageContext,
  ensureLanguageProfile,
  updateLanguageProfile,
} from '../src/language-profile.mjs'

test('LANG-01: ein leeres Profil bleibt sichtbar unvollständig und erfindet keinen Standard', () => {
  const project = {
    id: 'p-a',
    understanding: {
      task: '',
      audience: [],
      desiredEffect: '',
    },
  }
  const profile = ensureLanguageProfile(project)
  const context = buildLanguageContext({ project, profile })
  assert.equal(profile.projectId, 'p-a')
  assert.equal(context.complete, false)
  assert.deepEqual(context.known, {})
  assert.deepEqual(context.missing, [
    'genre',
    'passageFunction',
    'domain',
    'audience',
    'medium',
    'goal',
    'region',
  ])
  assert.equal(JSON.stringify(context).includes('wissenschaftlich'), false)
  assert.equal(JSON.stringify(context).includes('Deutschland'), false)
})

test('LANG-01: Projektverständnis ergänzt nur tatsächlich bekannte Zielgruppe und Wirkung', () => {
  const project = {
    id: 'p-a',
    understanding: {
      task: 'Eine Ergebnisdiskussion schreiben',
      audience: ['Fachpublikum'],
      desiredEffect: 'Grenzen nachvollziehbar machen',
    },
  }
  const profile = ensureLanguageProfile(project)
  const context = buildLanguageContext({ project, profile })
  assert.deepEqual(context.known.audience, ['Fachpublikum'])
  assert.equal(context.sources.audience, 'project-understanding')
  assert.equal(context.known.goal, 'Grenzen nachvollziehbar machen')
  assert.equal(context.sources.goal, 'project-understanding')
  assert.equal(context.known.genre, undefined)
  assert.ok(context.missing.includes('genre'))
})

test('LANG-01/03: Nutzerprofil ist bindend, D-A-CH-fähig, append-only und projektisoliert', () => {
  const project = { id: 'p-a', understanding: { audience: ['Alt'], desiredEffect: 'Alt' } }
  const profile = ensureLanguageProfile(project)
  const next = updateLanguageProfile({
    profile,
    projectId: 'p-a',
    changes: {
      genre: 'scientific',
      passageFunction: 'discuss',
      domain: 'Linguistik',
      audience: ['Gutachtende'],
      medium: 'academic-submission',
      goal: 'Evidenz abwägen',
      region: 'CH',
      houseStyle: ['ss statt ß', 'DOI immer als Link'],
    },
    at: 100,
  })
  assert.equal(profile.genre, '')
  assert.equal(next.genre, 'scientific')
  assert.equal(next.region, 'CH')
  assert.deepEqual(next.houseStyle, ['ss statt ß', 'DOI immer als Link'])
  assert.equal(next.events.length, 1)
  assert.equal(next.events[0].provenance.actor, 'user')
  assert.deepEqual(next.userProvidedFields.sort(), [
    'audience',
    'domain',
    'genre',
    'goal',
    'houseStyle',
    'medium',
    'passageFunction',
    'region',
  ])
  const context = buildLanguageContext({ project, profile: next })
  assert.equal(context.complete, true)
  assert.deepEqual(context.known.audience, ['Gutachtende'])
  assert.equal(context.sources.audience, 'language-profile')
  assert.throws(() => updateLanguageProfile({
    profile: next,
    projectId: 'p-b',
    changes: { genre: 'essay' },
    at: 110,
  }), /project/i)
  assert.throws(() => updateLanguageProfile({
    profile: next,
    projectId: 'p-a',
    changes: { region: 'US' },
    at: 110,
  }), /region/i)
})

test('Profilmigration ergänzt additiv und bewahrt vorhandene Projektfelder', () => {
  const project = {
    id: 'p-a',
    sources: [{ id: 'source-keep' }],
    languageProfile: {
      genre: 'essay',
      region: 'AT',
      events: [{ id: 'event-keep' }],
    },
  }
  const result = ensureLanguageProfile(project)
  assert.equal(result, project.languageProfile)
  assert.equal(result.schemaVersion, 1)
  assert.equal(result.projectId, 'p-a')
  assert.equal(result.genre, 'essay')
  assert.equal(result.region, 'AT')
  assert.equal(result.orthographyAutomation, false)
  assert.equal(result.events[0].id, 'event-keep')
  assert.equal(project.sources[0].id, 'source-keep')
})

test('Profilmigration behandelt unbekannte Enums tolerant und übernimmt den alten defaultFunction-Alias', () => {
  const project = {
    id: 'p-a',
    languageProfile: {
      schemaVersion: 99,
      genre: 'future-genre',
      medium: 'hologram',
      region: 'XX',
      defaultFunction: 'einordnen',
    },
  }
  const profile = ensureLanguageProfile(project)
  assert.equal(profile.genre, '')
  assert.equal(profile.medium, '')
  assert.equal(profile.region, '')
  assert.equal(profile.passageFunction, 'einordnen')
  assert.equal(profile.defaultFunction, 'einordnen')
  assert.deepEqual(profile.invalidValues, {
    genre: 'future-genre',
    medium: 'hologram',
    region: 'XX',
  })
})
