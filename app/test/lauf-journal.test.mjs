import test from 'node:test'
import assert from 'node:assert/strict'
import {
  baueStand, beginneLauf, GEZEIGT_DECKEL, JOURNAL_DECKEL, leeresJournal, letzteBezahlteSignatur,
  merkeGezeigt, normalisiereLaufJournal, pruefeJournalInvariante, schliesseLauf, verbucheImEintrag,
} from '../src/lauf-journal.mjs'

test('ein geschlossener Lauf traegt alle Journal-Felder aus Issue #12', () => {
  const journal = leeresJournal()
  const eintrag = beginneLauf({ kanal: 'hinweis', ausloeser: 'pause', signatur: 'd1:fnv1a-abc', einmalJeSignatur: true, jetzt: 1000 })
  verbucheImEintrag(eintrag, 'hinweise', { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 2, cache_creation_input_tokens: 1 })
  schliesseLauf(journal, eintrag, { ergebnis: 'geliefert', geliefert: 3, uebernommen: 2, verworfen: 1 }, 2000)
  assert.equal(journal.eintraege.length, 1)
  const [e] = journal.eintraege
  assert.match(e.id, /^lauf-/)
  assert.equal(e.kanal, 'hinweis')
  assert.equal(e.ausloeser, 'pause')
  assert.equal(e.signatur, 'd1:fnv1a-abc')
  assert.equal(e.einmalJeSignatur, true)
  assert.equal(e.begonnenAt, 1000)
  assert.equal(e.beendetAt, 2000)
  assert.deepEqual(e.tasks, ['hinweise'])
  assert.equal(e.tokens.input, 10)
  assert.equal(e.tokens.output, 5)
  assert.equal(e.tokens.cacheRead, 2)
  assert.equal(e.tokens.cacheWrite, 1)
  assert.ok(e.kostenCents >= 0)
  assert.equal(e.ergebnis, 'geliefert')
  assert.equal(e.fehlerTyp, null)
  assert.equal(e.geliefert, 3)
  assert.equal(e.uebernommen, 2)
  assert.equal(e.verworfen, 1)
  assert.equal(e.stand.modell, 'claude-opus-5')
  assert.match(e.stand.promptHash, /^[0-9a-z]+$/)
  assert.match(e.stand.momenteHash, /^[0-9a-z]+$/)
})

test('beginneLauf liefert den Eintrag noch nicht angehaengt, mit gezeigten Nullwerten', () => {
  const journal = leeresJournal()
  const eintrag = beginneLauf({ kanal: 'chat', ausloeser: 'gespraech', signatur: 'sig', einmalJeSignatur: false, jetzt: 500 })
  assert.equal(journal.eintraege.length, 0, 'beginneLauf haengt selbst nichts an')
  assert.deepEqual(eintrag.tasks, [])
  assert.equal(eintrag.stand, null)
  assert.deepEqual(eintrag.tokens, { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 })
  assert.equal(eintrag.kostenCents, 0)
  assert.equal(eintrag.beendetAt, null)
  assert.equal(eintrag.ergebnis, null)
})

test('baueStand liefert Modell, promptHash und momenteHash je Task; unbekannter Task wirft nie', () => {
  const stand = baueStand('chat')
  assert.equal(stand.modell, 'claude-opus-5')
  assert.match(stand.promptHash, /^[0-9a-z]+$/)
  assert.match(stand.momenteHash, /^[0-9a-z]+$/)
  const routine = baueStand('titel')
  assert.equal(routine.modell, 'claude-haiku-4-5')
  // promptHash/momenteHash sind stabile Konstanten, unabhaengig vom Task.
  assert.equal(routine.promptHash, stand.promptHash)
  assert.equal(routine.momenteHash, stand.momenteHash)
  assert.doesNotThrow(() => baueStand('quatsch-task'))
  assert.equal(baueStand('quatsch-task').modell, null)
})

test('letzteBezahlteSignatur ueberspringt Fehllaeufe und fremde Kanaele', () => {
  const journal = leeresJournal()
  let e = beginneLauf({ kanal: 'hinweis', ausloeser: 'pause', signatur: 'A', einmalJeSignatur: true, jetzt: 100 })
  schliesseLauf(journal, e, { ergebnis: 'geliefert' }, 200)
  e = beginneLauf({ kanal: 'hinweis', ausloeser: 'pause', signatur: 'B', einmalJeSignatur: true, jetzt: 300 })
  schliesseLauf(journal, e, { ergebnis: 'fehler', fehlerTyp: 'offline' }, 400)
  e = beginneLauf({ kanal: 'erweiterung', ausloeser: 'aufschauen', signatur: 'C', einmalJeSignatur: true, jetzt: 500 })
  schliesseLauf(journal, e, { ergebnis: 'verworfen' }, 600)
  assert.equal(letzteBezahlteSignatur(journal, 'hinweis'), 'A')
  assert.equal(letzteBezahlteSignatur(journal, 'erweiterung'), 'C')
  assert.equal(letzteBezahlteSignatur(journal, 'chat'), null, 'kein Eintrag fuer diesen Kanal -> null')
})

test('Deckel: mehr als JOURNAL_DECKEL Eintraege verdichten die aeltesten zu Monatssummen', () => {
  const journal = leeresJournal()
  const jetztFuerLauf = index => Date.UTC(2026, 6, 1) + index * 1000 // alle im Juli 2026 (lokale Zeit vorausgesetzt UTC~lokal im Test-Runner)
  const gesamt = JOURNAL_DECKEL + 5
  for (let i = 0; i < gesamt; i += 1) {
    const begonnen = jetztFuerLauf(i)
    const eintrag = beginneLauf({ kanal: 'hinweis', ausloeser: 'pause', signatur: `sig-${i}`, einmalJeSignatur: false, jetzt: begonnen })
    verbucheImEintrag(eintrag, 'hinweise', { input_tokens: 100, output_tokens: 10, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 })
    schliesseLauf(journal, eintrag, { ergebnis: 'geliefert' }, begonnen + 500)
  }
  assert.equal(journal.eintraege.length, JOURNAL_DECKEL, 'ueberzaehlige Eintraege wandern in monate')
  assert.equal(journal.monate.length, 1, 'alle verdichteten Laeufe liegen im selben Monat')
  const monat = journal.monate[0]
  assert.equal(monat.laeufe, 5)
  assert.ok(monat.kostenCents > 0)
  assert.equal(monat.tokens.input, 5 * 100)
  assert.equal(monat.tokens.output, 5 * 10)
  assert.ok(monat.jeKanal.hinweis)
  assert.equal(monat.jeKanal.hinweis.laeufe, 5)
  assert.ok(monat.jeKanal.hinweis.kostenCents > 0)
  // die verbleibenden Eintraege sind die JUENGSTEN (aelteste zuerst verdichtet)
  assert.equal(journal.eintraege[0].signatur, 'sig-5')
  assert.equal(journal.eintraege.at(-1).signatur, `sig-${gesamt - 1}`)
})

test('Invariante: zwei bezahlte Laeufe gleicher Signatur+Kanal sind ein Verstoss — ausser von Hand oder nach Fehler', () => {
  // Fall 1: zwei bezahlte Laeufe, gleiche Signatur, einmalJeSignatur true -> ein Verstoss.
  {
    const journal = leeresJournal()
    let e1 = beginneLauf({ kanal: 'hinweis', ausloeser: 'pause', signatur: 'A', einmalJeSignatur: true, jetzt: 100 })
    schliesseLauf(journal, e1, { ergebnis: 'geliefert' }, 200)
    let e2 = beginneLauf({ kanal: 'hinweis', ausloeser: 'pause', signatur: 'A', einmalJeSignatur: true, jetzt: 300 })
    schliesseLauf(journal, e2, { ergebnis: 'geliefert' }, 400)
    const verstoesse = pruefeJournalInvariante(journal)
    assert.equal(verstoesse.length, 1)
    assert.equal(verstoesse[0], journal.eintraege[1].id)
  }
  // Fall 2: Fehllauf gefolgt vom selben Stand -> kein Verstoss (Fehlläufe zählen nicht).
  {
    const journal = leeresJournal()
    let e1 = beginneLauf({ kanal: 'hinweis', ausloeser: 'pause', signatur: 'A', einmalJeSignatur: true, jetzt: 100 })
    schliesseLauf(journal, e1, { ergebnis: 'fehler', fehlerTyp: 'offline' }, 200)
    let e2 = beginneLauf({ kanal: 'hinweis', ausloeser: 'pause', signatur: 'A', einmalJeSignatur: true, jetzt: 300 })
    schliesseLauf(journal, e2, { ergebnis: 'geliefert' }, 400)
    assert.deepEqual(pruefeJournalInvariante(journal), [])
  }
  // Fall 3: von Hand (einmalJeSignatur false) darf denselben Stand zweimal vorlegen.
  {
    const journal = leeresJournal()
    let e1 = beginneLauf({ kanal: 'hinweis', ausloeser: 'hand', signatur: 'A', einmalJeSignatur: false, jetzt: 100 })
    schliesseLauf(journal, e1, { ergebnis: 'geliefert' }, 200)
    let e2 = beginneLauf({ kanal: 'hinweis', ausloeser: 'hand', signatur: 'A', einmalJeSignatur: false, jetzt: 300 })
    schliesseLauf(journal, e2, { ergebnis: 'geliefert' }, 400)
    assert.deepEqual(pruefeJournalInvariante(journal), [])
  }
})

test('merkeGezeigt dedupliziert je findingId und haelt den Deckel', () => {
  const journal = leeresJournal()
  assert.equal(merkeGezeigt(journal, { findingId: 'f1', art: 'fakt', moment: 'innehalten', jetzt: 100 }), true)
  assert.equal(merkeGezeigt(journal, { findingId: 'f1', art: 'fakt', moment: 'innehalten', jetzt: 200 }), false, 'dieselbe findingId noch einmal -> kein neues Ereignis')
  assert.equal(journal.gezeigt.length, 1)
  assert.equal(merkeGezeigt(journal, { findingId: '', art: 'fakt', moment: 'innehalten', jetzt: 300 }), false, 'leere findingId -> no-op')
  assert.equal(merkeGezeigt(journal, {}), false, 'fehlende findingId -> no-op')
  assert.equal(journal.gezeigt.length, 1)

  const gesamt = GEZEIGT_DECKEL + 10
  for (let i = 0; i < gesamt; i += 1) {
    merkeGezeigt(journal, { findingId: `f-${i}`, art: 'sprache', moment: 'sofort', jetzt: Date.UTC(2026, 6, 1) + i })
  }
  assert.equal(journal.gezeigt.length, GEZEIGT_DECKEL, 'Deckel haelt auch nach vielen Ereignissen')
  assert.ok(journal.monate.length >= 1, 'verdichtete Ereignisse landen in monate')
  // Verdichtet wird nach MOMENT (gezeigt[moment]), nicht nach Art -- siehe Brief.
  const monatMitGezeigt = journal.monate.find(m => m.gezeigt && m.gezeigt.sofort)
  assert.ok(monatMitGezeigt, 'Monatssumme traegt die verdichtete Moment-Zaehlung')
  assert.ok(monatMitGezeigt.gezeigt.sofort > 0)
})

test('normalisiereLaufJournal macht aus Muell ein leeres Journal und laesst Gutes unangetastet', () => {
  for (const muell of [null, undefined, 'quatsch', 42, { eintraege: 'x' }, []]) {
    const journal = normalisiereLaufJournal(muell)
    assert.deepEqual(journal, leeresJournal(), `Muell ${JSON.stringify(muell)} wird zu einem leeren Journal`)
  }

  const echtesJournal = leeresJournal()
  const eintrag = beginneLauf({ kanal: 'hinweis', ausloeser: 'pause', signatur: 'A', einmalJeSignatur: true, jetzt: 100 })
  verbucheImEintrag(eintrag, 'hinweise', { input_tokens: 5 })
  schliesseLauf(echtesJournal, eintrag, { ergebnis: 'geliefert' }, 200)
  merkeGezeigt(echtesJournal, { findingId: 'f1', art: 'fakt', moment: 'innehalten', jetzt: 150 })

  const normalisiert = normalisiereLaufJournal(echtesJournal)
  assert.deepEqual(normalisiert, echtesJournal)
  assert.equal(normalisiert.eintraege.length, 1)
  assert.equal(normalisiert.gezeigt.length, 1)
})

test('verbucheImEintrag summiert ueber mehrere Aufrufe und ist tolerant gegen Muell-usage', () => {
  const eintrag = beginneLauf({ kanal: 'chat', ausloeser: 'gespraech', signatur: 'sig', einmalJeSignatur: false, jetzt: 10 })
  verbucheImEintrag(eintrag, 'zusammenfassung', { input_tokens: 3, output_tokens: 1 })
  verbucheImEintrag(eintrag, 'chat', { input_tokens: 4, output_tokens: 2, cache_read_input_tokens: 1, cache_creation_input_tokens: 1 })
  assert.deepEqual(eintrag.tasks, ['zusammenfassung', 'chat'])
  assert.equal(eintrag.tokens.input, 7)
  assert.equal(eintrag.tokens.output, 3)
  assert.equal(eintrag.tokens.cacheRead, 1)
  assert.equal(eintrag.tokens.cacheWrite, 1)
  assert.ok(eintrag.kostenCents > 0)
  // stand wird beim ersten bezahlten Task gesetzt und danach nicht mehr ueberschrieben.
  assert.equal(eintrag.stand.modell, 'claude-haiku-4-5')

  const kaputterEintrag = beginneLauf({ kanal: 'hinweis', ausloeser: 'pause', signatur: 's', einmalJeSignatur: true, jetzt: 1 })
  assert.doesNotThrow(() => verbucheImEintrag(kaputterEintrag, 'unbekannter-task', 'quatsch'))
  assert.deepEqual(kaputterEintrag.tasks, ['unbekannter-task'])
  assert.equal(kaputterEintrag.tokens.input, 0)
  assert.equal(kaputterEintrag.kostenCents, 0)
  assert.doesNotThrow(() => verbucheImEintrag(kaputterEintrag, 'hinweise', null))
  assert.doesNotThrow(() => verbucheImEintrag(kaputterEintrag, 'hinweise', undefined))
})
