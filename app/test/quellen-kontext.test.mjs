// Was der Agent zu sehen bekommt, wenn er die Quellen ordnen soll — und was
// ausdruecklich NICHT.

import test from 'node:test'
import assert from 'node:assert/strict'

import { QUELLEN_ANFANG_ZEICHEN, anfangsText, baueQuellenKontext, quellenTitel } from '../src/quellen-kontext.mjs'
import { QUELLENTHEMEN_ANWEISUNG } from '../src/agent-prompts.mjs'
import { updateLanguageProfile } from '../src/language-profile.mjs'

const quelle = (id, titel, rest = {}) => ({
  id,
  type: 'web',
  metadata: { title: { value: titel, status: 'user-provided' } },
  ...rest,
})

test('Der Titel kommt aus metadata.title.value — nicht aus dem Feld darueber', () => {
  // Genau hier lag ein Fehler: metadata.title ist IMMER ein Objekt {value,status}
  // (source-model.mjs normalizeMetadata). Wer es direkt in einen String zwingt,
  // bekommt „[object Object]" — im Prompt wie auf dem Schirm.
  assert.equal(quellenTitel(quelle('q1', 'Calm Technology')), 'Calm Technology')
  assert.equal(quellenTitel({ id: 'q2', metadata: { title: 'Flach gespeichert' } }), 'Flach gespeichert')
  assert.equal(quellenTitel({ id: 'q3' }), 'Quelle ohne Titel')
  assert.equal(quellenTitel({ id: 'q4', metadata: { title: { value: '  ' } } }), 'Quelle ohne Titel')
})

test('Der Anfangstext findet den Originalausschnitt, gleich wo er liegt', () => {
  assert.equal(anfangsText({ pages: [{ text: 'Seite eins' }, { text: 'Seite zwei' }] }), 'Seite eins Seite zwei')
  assert.equal(anfangsText({ sections: [{ text: 'Abschnitt' }] }), 'Abschnitt')
  assert.equal(anfangsText({ text: 'Nur Text' }), 'Nur Text')
  assert.equal(anfangsText({ transcript: 'Gesprochen' }), 'Gesprochen')
  assert.equal(anfangsText(null), '')
  assert.equal(anfangsText({ text: 'x'.repeat(2000) }).length, QUELLEN_ANFANG_ZEICHEN)
})

test('Der Kontext traegt die Anweisung und jede Quelle mit Kennung, Titel und Typ', () => {
  const kontext = baueQuellenKontext({
    verstaendnis: { task: 'Seminararbeit' },
    quellen: [quelle('q1', 'Calm Technology', {
      origin: { originalUrl: 'https://www.beispiel.de/a/b?c=1' },
      original: { sections: [{ text: 'Technik darf in die Peripherie treten.' }] },
      locators: [{ claimText: 'Aufmerksamkeit ist begrenzt' }],
    })],
  })
  assert.equal(kontext.volatiles[0], QUELLENTHEMEN_ANWEISUNG)
  const liste = JSON.parse(kontext.volatiles[1].replace('Quellen im Projekt: ', ''))
  assert.deepEqual(liste, [{
    id: 'q1',
    titel: 'Calm Technology',
    typ: 'web',
    herkunft: 'beispiel.de',
    anfang: 'Technik darf in die Peripherie treten.',
    aussagen: ['Aufmerksamkeit ist begrenzt'],
  }])
})

// Nach welchen Themen die Quellen eines Projekts stehen, ist eine Frage des Projekts.
// Der gerade offene Text darf sie nicht beeinflussen: sonst haengt die Ordnung daran,
// welches Dokument zufaellig oben liegt — und jede Aufnahme kostet den ganzen Text.
test('Der offene Text steht ausdruecklich NICHT im Kontext', () => {
  const kontext = baueQuellenKontext({ quellen: [quelle('q1', 'Eins')] })
  assert.equal(kontext.docText, undefined)
  assert.equal(JSON.stringify(kontext).includes('docText'), false)
})

test('Vom Menschen gesetzte Namen stehen woertlich da, mit dem Verbot sie umzubenennen', () => {
  const kontext = baueQuellenKontext({
    quellen: [quelle('q1', 'Eins')],
    bestehendeThemen: [
      { id: 'thema-1', name: 'Meine Fundstücke', warum: 'Selbst gelegt.', vonKi: false },
      { id: 'thema-2', name: 'Wahrnehmung', warum: 'Vom Agenten.', vonKi: true },
    ],
  })
  const gesetzt = kontext.volatiles.find(block => block.startsWith('Vom Menschen gesetzte'))
  assert.ok(gesetzt, 'der bindende Block fehlt')
  assert.match(gesetzt, /übernimm sie wörtlich/)
  assert.ok(gesetzt.includes('Meine Fundstücke'))
  assert.equal(gesetzt.includes('Wahrnehmung'), false, 'die Gruppe des Agenten gehoert in den anderen Block')

  const eigene = kontext.volatiles.find(block => block.startsWith('Deine Gruppen'))
  assert.ok(eigene.includes('Wahrnehmung'))
})

test('Ohne bestehende Themen bleiben die beiden Bloecke weg', () => {
  const kontext = baueQuellenKontext({ quellen: [quelle('q1', 'Eins')] })
  assert.equal(kontext.volatiles.length, 2)
})

test('Quellen ohne Kennung fallen heraus, statt eine namenlose Zeile zu erzeugen', () => {
  const kontext = baueQuellenKontext({ quellen: [quelle('', 'Ohne'), quelle('q1', 'Mit')] })
  const liste = JSON.parse(kontext.volatiles[1].replace('Quellen im Projekt: ', ''))
  assert.deepEqual(liste.map(eintrag => eintrag.id), ['q1'])
})

test('Die Anweisung verbietet Formatrubriken und Sammelgruppen', () => {
  assert.equal(QUELLENTHEMEN_ANWEISUNG.includes('!'), false, 'Ausrufezeichen gefunden')
  assert.match(QUELLENTHEMEN_ANWEISUNG, /Dateityp/)
  assert.match(QUELLENTHEMEN_ANWEISUNG, /Sonstiges/)
  assert.match(QUELLENTHEMEN_ANWEISUNG, /leere Liste/)
})

// Der Anschluss an die zweite Haelfte. Bis zum 8.8.2026 war dieser Kanal der einzige, der
// das Projektwissen nicht sah — die Bauweisen-Pruefung (evals/pruefungen/kontext-alle-
// kanaele.mjs) nannte ihn einen blinden Kanal. Sie prueft, DASS baueOndaBloecke vorkommt;
// hier steht, dass das Wissen auch wirklich ankommt und wo.
test('Das Projektwissen erreicht den Kontext — und steht hinten', () => {
  const languageProfile = updateLanguageProfile({
    profile: null,
    projectId: 'p1',
    changes: { genre: 'scientific', domain: 'MARKANTES-FACH-3c7e' },
    at: 1000,
  })
  const onda = { project: { id: 'p1', name: 'Pr\u00fcfprojekt', languageProfile }, doc: null, docs: [] }

  const ohne = baueQuellenKontext({ quellen: [quelle('q1', 'Eins')] })
  const mit = baueQuellenKontext({ quellen: [quelle('q1', 'Eins')], onda })

  assert.ok(
    mit.volatiles.join('\n').includes('MARKANTES-FACH-3c7e'),
    'die Textsorte erreicht den Kontext nicht',
  )
  // Gegenprobe: ohne das Buendel darf die Marke nicht dastehen, sonst kaeme sie von
  // woanders her und die Suche oben bewiese nichts.
  assert.equal(ohne.volatiles.join('\n').includes('MARKANTES-FACH-3c7e'), false)

  // Hinten, nicht vorn: verstaendnis und docText tragen cache_control (agent-tasks.mjs).
  // Ein Wissensblock weiter vorn entwertete den Zwischenspeicher bei jeder Projektaenderung.
  assert.deepEqual(mit.volatiles.slice(0, ohne.volatiles.length), ohne.volatiles)
  assert.ok(mit.volatiles.length > ohne.volatiles.length)
})
