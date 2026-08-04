// Prüfung 3 aus Issue #17 (fremdes Fehlermodell, Befund 4 der Systemanalyse):
// ein FREMDER, unordentlicher Text — anderes Genre (Interview-Transkript statt
// Essay), gemischte Sprache, Copy-Paste-Artefakte — durch die Anker-Maschine
// (anchor-verify.mjs) und die Momente-Maschine (momente-model.mjs). Bis hierher
// hing jede Messung am einen, sauberen Seed „Calm Technology".
//
// Was die Prüfung beim ersten Lauf gefunden hat (und was seither gilt):
// Weicher Trennstrich (U+00AD) und Nullbreite-Leerzeichen (U+200B) — beides
// landet beim Kopieren aus dem Netz regelmäßig unsichtbar im Text — ließen
// jeden Anker über der betroffenen Stelle scheitern: der Hinweis wurde
// verworfen, ohne dass irgendwer je sähe, warum. Die Normalisierung übergeht
// diese unsichtbaren Zeichen jetzt (wie sie Anführungszeichen schon
// vereinheitlicht); der Verwurf bleibt für alles, was WIRKLICH nicht im Text
// steht.
//
// Alle unsichtbaren Zeichen stehen hier als \u-Escape, nie als Literal.

import test from 'node:test'
import assert from 'node:assert/strict'
import { dedupeHinweise, findeAnker } from '../src/anchor-verify.mjs'
import {
  aktuellerMoment,
  artVon,
  darfErscheinen,
  filtereNachMoment,
  istSatzende,
} from '../src/momente-model.mjs'
import { ZWEITER_SEED_GENRE, ZWEITER_SEED_TEXT } from '../evals/fixtures/zweiter-seed.mjs'

test('Der zweite Seed ist wirklich fremd: anderes Genre, gemischte Sprache, unsichtbare Zeichen an Bord', () => {
  assert.equal(ZWEITER_SEED_GENRE, 'Interview-Transkript')
  assert.match(ZWEITER_SEED_TEXT, /the dough tells you/, 'die englischen Einsprengsel gehören zum Fehlermodell')
  assert.match(ZWEITER_SEED_TEXT, /\u00A0/, 'geschütztes Leerzeichen (U+00A0) muss enthalten sein')
  assert.match(ZWEITER_SEED_TEXT, /\u00AD/, 'weicher Trennstrich (U+00AD) muss enthalten sein')
  assert.match(ZWEITER_SEED_TEXT, /\u200B/, 'Nullbreite-Leerzeichen (U+200B) muss enthalten sein')
})

// ---------- Anker-Maschine: findet sie Zitate im unordentlichen Text? ----------

test('Gerade Anführungszeichen des Modells finden das typografisch gesetzte Zitat', () => {
  // Im Text steht: „Der Teig hat keine Uhr." — das Modell zitiert mit geraden Zeichen.
  const treffer = findeAnker(ZWEITER_SEED_TEXT, '"Der Teig hat keine Uhr."')
  assert.equal(treffer.gefunden, true)
  assert.equal(treffer.normalisiert, true)
  const original = ZWEITER_SEED_TEXT.slice(treffer.index, treffer.index + treffer.laenge)
  assert.equal(original, '„Der Teig hat keine Uhr."', 'laenge muss den ECHTEN Wortlaut aus dem Dokument ausschneiden')
})

test('Ein Anker über das geschützte Leerzeichen hinweg: das Modell schreibt ein normales', () => {
  // Im Text: „450\u00A0g Weizenmehl" — U+00A0 gilt als Whitespace und kollabiert.
  const treffer = findeAnker(ZWEITER_SEED_TEXT, '450 g Weizenmehl')
  assert.equal(treffer.gefunden, true)
})

test('Ein Anker über den weichen Trennstrich hinweg: unsichtbar für das Auge, unsichtbar für den Abgleich', () => {
  // Im Text: „Roggen\u00ADmehl" — das Modell (und jeder Mensch) schreibt „Roggenmehl".
  const treffer = findeAnker(ZWEITER_SEED_TEXT, '250 g Roggenmehl')
  assert.equal(treffer.gefunden, true,
    'der weiche Trennstrich ist ein Darstellungszeichen, kein Inhalt — er darf einen wörtlichen Treffer nicht verhindern')
  const original = ZWEITER_SEED_TEXT.slice(treffer.index, treffer.index + treffer.laenge)
  assert.match(original, /Roggen\u00ADmehl$/, 'der Ausschnitt zeigt auf die Original-Stelle mitsamt Trennstrich')
})

test('Ein Anker über das Nullbreite-Leerzeichen hinweg — das klassische Copy-Paste-Artefakt', () => {
  // Im Text: „Sauerteig\u200Bkultur".
  const treffer = findeAnker(ZWEITER_SEED_TEXT, 'in der Sauerteigkultur')
  assert.equal(treffer.gefunden, true,
    'ein unsichtbares U+200B im Dokument darf einen Hinweis nicht lautlos verwerfen lassen')
})

test('Auch andersherum: klebt das Artefakt im ANKER (Modell hat es mitkopiert), stört es nicht', () => {
  const treffer = findeAnker('die sitzt in der Sauerteigkultur.', 'der Sauerteig\u200Bkultur')
  assert.equal(treffer.gefunden, true)
})

test('Ein Anker, der nur aus Unsichtbarem besteht, findet NIE etwas', () => {
  assert.equal(findeAnker(ZWEITER_SEED_TEXT, '\u200B').gefunden, false)
  assert.equal(findeAnker(ZWEITER_SEED_TEXT, '\u00AD\u200B').gefunden, false)
})

test('Erfundenes bleibt verworfen: die Normalisierung rät nicht', () => {
  assert.equal(findeAnker(ZWEITER_SEED_TEXT, 'die Maschine backt besser als der Mensch').gefunden, false)
  // Setzung, hier festgeschrieben: ein Gedankenstrich ist KEIN Bindestrich. Wer
  // „Erziehung - man wartet" zitiert, wo „Erziehung – man wartet" steht, wird
  // verworfen — lieber ein verlorener Hinweis als eine geratene Textstelle.
  assert.equal(findeAnker(ZWEITER_SEED_TEXT, 'Erziehung - man wartet').gefunden, false)
})

test('Dasselbe Zitat in zwei Schreibweisen ist EIN Hinweis: Dedupe über Anführungszeichen-Varianten', () => {
  const hinweise = [
    { anker: '"Der Teig hat keine Uhr."', kategorie: 'logik', beobachtung: 'a' },
    { anker: '„Der Teig hat keine Uhr."', kategorie: 'logik', beobachtung: 'b' },
  ]
  const uebrig = dedupeHinweise(hinweise, [], [])
  assert.equal(uebrig.length, 1)
})

// ---------- Momente-Maschine: hält der Rhythmus auch bei fremdem Material? ----------

test('Der Momente-Filter kennt keine Genres: auch Transkript-Hinweise erscheinen nach Art, nicht nach Herkunft', () => {
  const eintraege = [
    { kiKategorie: 'sprache', anker: 'genau falsch herum' },
    { kiKategorie: 'fakt', anker: '450 g Weizenmehl' },
    { kiKategorie: 'struktur', anker: '[00:03:20]' },
    { art: 'verbindung', text: 'Der Schlusssatz und das Schild gehören zusammen.' },
  ]
  const beimInnehalten = filtereNachMoment(eintraege, 'innehalten')
  assert.deepEqual(beimInnehalten.map(artVon), ['sprache', 'fakt'],
    'struktur und verbindung warten aufs Aufschauen — auch in einem Transkript')
  assert.equal(filtereNachMoment(eintraege, 'aufschauen').length, 4)
})

test('Transkript-Zeichen sind keine Satzenden: Zeitmarke, Einwurf, Doppelpunkt lösen kein Innehalten aus', () => {
  assert.equal(istSatzende(']'), false, '[Lachen] beendet keinen Satz')
  assert.equal(istSatzende(':'), false, 'MODERATORIN: beendet keinen Satz')
  assert.equal(istSatzende('…'), true, 'der abgebrochene Gedanke schon')
  assert.equal(istSatzende('!'), true)
})

test('Fremdes Fehlermodell Uhrzeit: springt die Systemuhr zurück (lastInput in der Zukunft), bleibt der Moment sofort — kein Absturz, kein Dauer-Aufschauen', () => {
  const jetzt = 1_000_000
  assert.equal(aktuellerMoment({ jetzt, lastInputAt: jetzt + 60_000 }), 'sofort',
    'negative Ruhezeit darf nie als lange Pause gelten')
  assert.equal(aktuellerMoment({ jetzt, lastInputAt: null }), 'aufschauen',
    'ohne bekannte Eingabe gilt Aufschauen — wie beim frischen Öffnen')
})

test('Was man gerade liest, verschwindet nicht unter den Händen — auch bei Erweiterungen aus fremdem Material', () => {
  assert.equal(darfErscheinen('verbindung', 'sofort', true), true)
  assert.equal(darfErscheinen('verbindung', 'sofort', false), false)
})
