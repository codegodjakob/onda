import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_STYLE_ID,
  DEFAULT_STYLE_NAME,
  activeWritingStyle,
  buildLanguageContext,
  defineWritingStyle,
  ensureLanguageProfile,
  selectWritingStyle,
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

// ---------- Schreibstile ----------------------------------------------------------------
// Die Philosophie verlangt, dass jemand ueber Zeit MEHRERE feine Schreibstile entwickelt
// und zwischen ihnen waehlt. Vorher kannte das Profil genau einen, und der hatte nicht
// einmal einen Namen.

test('Ein Profil hat immer mindestens einen Stil, und der alte Hausstil wird einer davon', () => {
  const profile = ensureLanguageProfile({
    id: 'p-a',
    languageProfile: { houseStyle: ['ss statt ß', 'DOI immer als Link'] },
  })
  assert.equal(profile.styles.length, 1)
  assert.equal(profile.styles[0].id, DEFAULT_STYLE_ID)
  assert.equal(profile.styles[0].name, DEFAULT_STYLE_NAME)
  assert.deepEqual(profile.styles[0].rules, ['ss statt ß', 'DOI immer als Link'])
  assert.equal(profile.activeStyleId, DEFAULT_STYLE_ID)
  assert.deepEqual(profile.houseStyle, ['ss statt ß', 'DOI immer als Link'])
  assert.equal(activeWritingStyle(profile), profile.styles[0])
})

test('Ein leeres Profil hat einen leeren Stil, aber nie gar keinen', () => {
  const profile = ensureLanguageProfile({ id: 'p-a' })
  assert.equal(profile.styles.length, 1)
  assert.deepEqual(profile.houseStyle, [])
  assert.equal(activeWritingStyle(profile).name, DEFAULT_STYLE_NAME)
  const context = buildLanguageContext({ project: { id: 'p-a', languageProfile: profile } })
  assert.deepEqual(context.known, {}, 'ein leerer Vorgabestil darf im Kontext nicht auftauchen')
})

test('Ein zweiter Stil steht neben dem ersten und wird sofort der aktive', () => {
  const profile = ensureLanguageProfile({ id: 'p-a', languageProfile: { houseStyle: ['ss statt ß'] } })
  const next = defineWritingStyle({
    profile,
    projectId: 'p-a',
    name: 'Nüchtern für Gutachten',
    purpose: 'Wissenschaftliche Abgaben',
    rules: ['keine rhetorischen Fragen', 'Passiv nur im Methodenteil'],
    at: 100,
  })
  assert.equal(next.styles.length, 2)
  assert.deepEqual(next.styles.map(style => style.name), [DEFAULT_STYLE_NAME, 'Nüchtern für Gutachten'])
  assert.notEqual(next.styles[0].id, next.styles[1].id)
  assert.equal(next.activeStyleId, next.styles[1].id)
  assert.deepEqual(next.houseStyle, ['keine rhetorischen Fragen', 'Passiv nur im Methodenteil'])
  assert.deepEqual(profile.houseStyle, ['ss statt ß'], 'das Ausgangsprofil bleibt unberührt')
  assert.equal(next.events.at(-1).kind, 'writing-style-defined')
  assert.equal(next.events.at(-1).provenance.actor, 'user')
})

test('Derselbe Name meint denselben Stil und schreibt ihn fort', () => {
  let profile = ensureLanguageProfile({ id: 'p-a' })
  profile = defineWritingStyle({ profile, projectId: 'p-a', name: 'Werbestimme', rules: ['kurz'], at: 100 })
  profile = defineWritingStyle({ profile, projectId: 'p-a', name: 'Werbestimme', rules: ['kurz', 'aktiv'], at: 110 })
  assert.equal(profile.styles.filter(style => style.name === 'Werbestimme').length, 1)
  assert.deepEqual(profile.houseStyle, ['kurz', 'aktiv'])
  assert.equal(profile.events.at(-1).kind, 'writing-style-changed')
})

test('Der Wechsel des Stils wechselt die Regeln, die alle anderen lesen', () => {
  let profile = ensureLanguageProfile({ id: 'p-a', languageProfile: { houseStyle: ['ss statt ß'] } })
  profile = defineWritingStyle({ profile, projectId: 'p-a', name: 'Werbestimme', rules: ['kurz'], at: 100 })
  assert.deepEqual(profile.houseStyle, ['kurz'])
  profile = selectWritingStyle({ profile, projectId: 'p-a', styleId: DEFAULT_STYLE_ID, at: 110 })
  assert.equal(profile.activeStyleId, DEFAULT_STYLE_ID)
  assert.deepEqual(profile.houseStyle, ['ss statt ß'])
  assert.equal(profile.events.at(-1).kind, 'writing-style-selected')
  const context = buildLanguageContext({ project: { id: 'p-a', languageProfile: profile } })
  assert.deepEqual(context.known.houseStyle, ['ss statt ß'])
  assert.equal(context.known.styleName, DEFAULT_STYLE_NAME)
  assert.deepEqual(context.known.styleChoices, [DEFAULT_STYLE_NAME, 'Werbestimme'])
  assert.equal(context.sources.styleChoices, 'language-profile')
})

// Ein Text, der unbemerkt nach dem falschen Stil geprueft wird, ist schlimmer als eine
// Fehlermeldung — deshalb wirft der unbekannte Stil, statt still zurueckzufallen.
test('Ein unbekannter oder fremder Stil wirft, statt still zurueckzufallen', () => {
  const profile = ensureLanguageProfile({ id: 'p-a' })
  assert.throws(() => selectWritingStyle({ profile, projectId: 'p-a', styleId: 'stil:gibtsnicht', at: 100 }), /unknown/i)
  assert.throws(() => selectWritingStyle({ profile, projectId: 'p-a', styleId: '', at: 100 }), /required/i)
  assert.throws(() => defineWritingStyle({ profile, projectId: 'p-a', name: '   ', at: 100 }), /name/i)
  assert.throws(() => defineWritingStyle({ profile, projectId: 'p-b', name: 'X', at: 100 }), /project/i)
})

// Ohne Durchgriff staenden nach dem Speichern zwei Regelmengen im Profil, und die naechste
// Normalisierung wuerde die eben eingegebene stillschweigend ueberschreiben.
test('Wer houseStyle setzt, setzt die Regeln des aktiven Stils', () => {
  let profile = ensureLanguageProfile({ id: 'p-a' })
  profile = defineWritingStyle({ profile, projectId: 'p-a', name: 'Werbestimme', rules: ['kurz'], at: 100 })
  profile = updateLanguageProfile({
    profile,
    projectId: 'p-a',
    changes: { houseStyle: ['kurz', 'nie zwei Adjektive'] },
    at: 110,
  })
  assert.deepEqual(activeWritingStyle(profile).rules, ['kurz', 'nie zwei Adjektive'])
  const nochmal = ensureLanguageProfile({ id: 'p-a', languageProfile: profile })
  assert.deepEqual(nochmal.houseStyle, ['kurz', 'nie zwei Adjektive'])
})

test('Stile mit gleichem Namensstamm bekommen verschiedene Kennungen', () => {
  let profile = ensureLanguageProfile({ id: 'p-a' })
  profile = defineWritingStyle({ profile, projectId: 'p-a', name: 'Ton A', rules: ['a'], at: 100 })
  profile = defineWritingStyle({ profile, projectId: 'p-a', name: 'ton-a', rules: ['b'], at: 110 })
  assert.equal(profile.styles.length, 3)
  assert.equal(new Set(profile.styles.map(style => style.id)).size, 3)
})
