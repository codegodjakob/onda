import test from 'node:test'
import assert from 'node:assert/strict'
import { initGateway, setzeTransportFuerTests } from '../src/agent-gateway.mjs'
import { leeresJournal, pruefeJournalInvariante } from '../src/lauf-journal.mjs'
import {
  KANAELE, initLaufTor, kanalGesperrt, fuehreLaufAus, merkeKarteGezeigt, torJournal,
} from '../src/lauf-tor.mjs'

const USAGE = Object.freeze({ input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 5, cache_creation_input_tokens: 2 })

// Alle Tests laufen am ECHTEN Gateway-Pfad: initGateway (Buchung + Persist) und
// initLaufTor (Sperre + Journal + eigener Persist) werden je Test frisch verdrahtet,
// setzeTransportFuerTests ersetzt danach nur noch den Netztransport.
function baueWelt(settings = {}) {
  const journal = leeresJournal()
  let gatewayPersists = 0
  let torPersists = 0
  initGateway({ getSettings: () => settings, persist: () => { gatewayPersists += 1 }, retryWartezeitMs: 1 })
  initLaufTor({ getJournal: () => journal, persist: () => { torPersists += 1 } })
  return {
    journal,
    settings,
    gatewayPersistCount: () => gatewayPersists,
    torPersistCount: () => torPersists,
  }
}

// Fester Fake-Transport: eine Liste von Schritt-Funktionen, je Aufruf die naechste (die
// letzte wiederholt sich fuer weitere Aufrufe) -- Vorbild mockTransport aus
// agent-gateway.test.mjs, hier lokal, weil lauf-tor eigene Zeit-/Race-Bedingungen testet.
function fakeTransport(schritte) {
  const aufrufe = []
  return {
    aufrufe,
    async hatSchluessel() { return true },
    async setzeSchluessel() {},
    async loescheSchluessel() {},
    sende(anfrage, handlers) {
      aufrufe.push(anfrage)
      const schritt = schritte[Math.min(aufrufe.length - 1, schritte.length - 1)]
      schritt(anfrage, handlers)
    },
  }
}

// Steuerbarer Fake-Transport fuer die Invariante-Testserie: der Modus wechselt zwischen
// den einzelnen fuehreLaufAus-Aufrufen (ok / ok-verzoegert fuer Rennen / fehler fuer Retry).
function steuerbarerTransport() {
  const aufrufe = []
  let modus = 'ok'
  return {
    aufrufe,
    async hatSchluessel() { return true },
    setModus(m) { modus = m },
    sende(anfrage, handlers) {
      aufrufe.push(anfrage)
      if (modus === 'ok') {
        handlers.onFertig({ text: 'ok', usage: { ...USAGE }, stopReason: 'end_turn' })
      } else if (modus === 'ok-verzoegert') {
        setTimeout(() => handlers.onFertig({ text: 'ok', usage: { ...USAGE }, stopReason: 'end_turn' }), 15)
      } else if (modus === 'fehler') {
        handlers.onFehler({ typ: 'schema', nachricht: 'kaputt' })
      }
    },
  }
}

// Schlichte laufFn: genau ein bezahlter Aufruf, liefert erfolgreich.
const erfolgLaufFn = async ({ runTask }) => {
  await runTask('zusammenfassung', { docText: 'T' })
  return { gestartet: true, erfolg: true }
}

test('KANAELE listet genau die vier Kanaele aus Issue #12', () => {
  assert.deepEqual(KANAELE, ['interview', 'chat', 'hinweis', 'erweiterung'])
  assert.throws(() => KANAELE.push('neu'))
})

test('zwei gleichzeitige Ausloeser desselben Kanals bezahlen genau einen Lauf', async () => {
  const t = fakeTransport([(a, h) => {
    setTimeout(() => h.onFertig({ text: 'ok', usage: { ...USAGE }, stopReason: 'end_turn' }), 20)
  }])
  baueWelt()
  setzeTransportFuerTests(t)

  const [a, b] = await Promise.all([
    fuehreLaufAus({ kanal: 'hinweis', ausloeser: 'a' }, erfolgLaufFn),
    fuehreLaufAus({ kanal: 'hinweis', ausloeser: 'b' }, erfolgLaufFn),
  ])
  assert.equal(t.aufrufe.length, 1, 'nur der erste Ausloeser erreicht das Gateway')
  assert.equal(a.gestartet, true)
  assert.deepEqual(b, { gestartet: false, grund: 'lauf-aktiv' })
  setzeTransportFuerTests(null)
})

test('zwei verschiedene Kanaele laufen nebeneinander', async () => {
  const t = fakeTransport([
    (a, h) => setTimeout(() => h.onFertig({ text: 'ok', usage: { ...USAGE }, stopReason: 'end_turn' }), 10),
  ])
  baueWelt()
  setzeTransportFuerTests(t)

  const [hinweis, erweiterung] = await Promise.all([
    fuehreLaufAus({ kanal: 'hinweis' }, erfolgLaufFn),
    fuehreLaufAus({ kanal: 'erweiterung' }, erfolgLaufFn),
  ])
  assert.equal(t.aufrufe.length, 2)
  assert.equal(hinweis.gestartet, true)
  assert.equal(erweiterung.gestartet, true)
  setzeTransportFuerTests(null)
})

test('einmalJeSignatur blockt denselben Stand, laesst neuen Stand und Hand-Laeufe durch', async () => {
  const t = fakeTransport([(a, h) => h.onFertig({ text: 'ok', usage: { ...USAGE }, stopReason: 'end_turn' })])
  baueWelt()
  setzeTransportFuerTests(t)

  const r1 = await fuehreLaufAus({ kanal: 'hinweis', signatur: 'A', einmalJeSignatur: true }, erfolgLaufFn)
  assert.equal(r1.gestartet, true, 'erster Lauf mit Signatur A geht durch')

  const r2 = await fuehreLaufAus({ kanal: 'hinweis', signatur: 'A', einmalJeSignatur: true }, erfolgLaufFn)
  assert.deepEqual(r2, { gestartet: false, grund: 'unveraendert' }, 'zweiter Lauf, gleicher Stand, blockiert')

  const r3 = await fuehreLaufAus({ kanal: 'hinweis', signatur: 'B', einmalJeSignatur: true }, erfolgLaufFn)
  assert.equal(r3.gestartet, true, 'neuer Stand B geht durch')

  const r4 = await fuehreLaufAus({ kanal: 'hinweis', signatur: 'A', einmalJeSignatur: false }, erfolgLaufFn)
  assert.equal(r4.gestartet, true, 'Hand-Lauf (einmalJeSignatur:false) ignoriert die Wiederholung')

  assert.equal(t.aufrufe.length, 3, 'der geblockte Lauf (r2) erreicht das Gateway nie')
  setzeTransportFuerTests(null)
})

test('nach einem Fehllauf darf derselbe Stand erneut versucht werden', async () => {
  const t = fakeTransport([
    (a, h) => h.onFehler({ typ: 'schema', nachricht: 'kaputt' }),
    (a, h) => h.onFertig({ text: 'ok', usage: { ...USAGE }, stopReason: 'end_turn' }),
  ])
  baueWelt()
  setzeTransportFuerTests(t)

  const r1 = await fuehreLaufAus({ kanal: 'hinweis', signatur: 'A', einmalJeSignatur: true }, erfolgLaufFn)
  assert.equal(r1.gestartet, true)
  assert.equal(r1.erfolg, false)
  assert.equal(r1.fehler, 'schema')

  const r2 = await fuehreLaufAus({ kanal: 'hinweis', signatur: 'A', einmalJeSignatur: true }, erfolgLaufFn)
  assert.equal(r2.gestartet, true, 'derselbe Stand darf nach einem Fehlversuch erneut laufen')
  assert.equal(r2.erfolg, true)
  setzeTransportFuerTests(null)
})

test('das Journal traegt je bezahltem Lauf Zeitpunkt, Kanal, Ausloeser, Signatur, stand, Tokens, Kosten, Ergebnis', async () => {
  const t = fakeTransport([(a, h) => h.onFertig({ text: 'ok', usage: { ...USAGE }, stopReason: 'end_turn' })])
  const w = baueWelt()
  setzeTransportFuerTests(t)

  await fuehreLaufAus({ kanal: 'erweiterung', ausloeser: 'pause', signatur: 'sig-1', einmalJeSignatur: true }, erfolgLaufFn)
  assert.equal(w.journal.eintraege.length, 1)
  const [e] = w.journal.eintraege
  assert.ok(Number.isFinite(e.begonnenAt))
  assert.ok(Number.isFinite(e.beendetAt))
  assert.equal(e.kanal, 'erweiterung')
  assert.equal(e.ausloeser, 'pause')
  assert.equal(e.signatur, 'sig-1')
  assert.equal(e.stand.modell, 'claude-haiku-4-5', 'zusammenfassung laeuft auf dem Routine-Modell')
  assert.equal(e.tokens.input, USAGE.input_tokens)
  assert.equal(e.tokens.output, USAGE.output_tokens)
  assert.equal(e.tokens.cacheRead, USAGE.cache_read_input_tokens)
  assert.equal(e.tokens.cacheWrite, USAGE.cache_creation_input_tokens)
  assert.ok(e.kostenCents > 0)
  assert.equal(e.ergebnis, 'geliefert')
  setzeTransportFuerTests(null)
})

// Seam Task 2 -> Task 3: die vier Gateway-internen throws (refusal/max_tokens/JSON-Fehler/
// Pflichtfeld-Fehler, agent-gateway.mjs) haengen ihre usage ans geworfene Fehlerobjekt --
// im Unterschied zu einem reinen Transportfehler ohne Antwort. Dieser Test provoziert genau
// das ueber onFertig (nicht onFehler!) mit stopReason:'refusal': das Gateway wirft SELBST,
// mit usage. torRunTask muss diesen fehler.usage-Zweig treffen (lauf-tor.mjs, catch in
// torRunTask) -- ein abgelehnter Lauf hat trotzdem echte Tokens gekostet.
test('ein abgelehnter Lauf (refusal) verbucht seine usage ueber den fehler.usage-Zweig und steht mit Kosten im Journal', async () => {
  const t = fakeTransport([(a, h) => h.onFertig({ text: 'x', stopReason: 'refusal', usage: { input_tokens: 7, output_tokens: 3 } })])
  const w = baueWelt()
  setzeTransportFuerTests(t)

  const laufFn = async ({ runTask }) => {
    await runTask('chat', { docText: 'T' })
    return { gestartet: true, erfolg: true }
  }
  const r = await fuehreLaufAus({ kanal: 'chat' }, laufFn)
  assert.equal(r.gestartet, true)
  assert.equal(r.erfolg, false)
  assert.equal(r.fehler, 'abgelehnt')

  assert.equal(w.journal.eintraege.length, 1, 'auch ein abgelehnter Lauf ist bezahlt (ein runTask-Aufruf) und landet im Journal')
  const [e] = w.journal.eintraege
  assert.equal(e.ergebnis, 'fehler')
  assert.equal(e.fehlerTyp, 'abgelehnt')
  assert.deepEqual(e.tasks, ['chat'], 'verbucheImEintrag lief -- der Aufruf ist erfasst')
  assert.ok(e.stand, 'stand wird beim ersten bezahlten Aufruf gesetzt, auch wenn er scheitert')
  assert.equal(e.stand.modell, 'claude-opus-5')
  assert.equal(e.tokens.input, 7)
  assert.equal(e.tokens.output, 3)
  assert.ok(e.kostenCents > 0, 'ein abgelehnter Lauf hat trotzdem echte Tokens gekostet')
  setzeTransportFuerTests(null)
})

test('ein Lauf, der das Gateway nie erreicht, landet nicht im Journal', async () => {
  const w = baueWelt()
  const ohneRunTask = async () => ({ gestartet: false, grund: 'kein-schluessel' })
  const r = await fuehreLaufAus({ kanal: 'interview' }, ohneRunTask)
  assert.deepEqual(r, { gestartet: false, grund: 'kein-schluessel' })
  assert.equal(w.journal.eintraege.length, 0)
  assert.equal(w.torPersistCount(), 0, 'unbezahlte Laeufe loesen keinen Persist aus')
})

test('runTask einer beendeten Lauf-Referenz wirft, statt still zu bezahlen', async () => {
  const t = fakeTransport([(a, h) => h.onFertig({ text: 'ok', usage: { ...USAGE }, stopReason: 'end_turn' })])
  baueWelt()
  setzeTransportFuerTests(t)

  let entkommenesRunTask
  const laufFn = async ({ runTask }) => {
    entkommenesRunTask = runTask
    await runTask('zusammenfassung', { docText: 'T' })
    return { gestartet: true, erfolg: true }
  }
  await fuehreLaufAus({ kanal: 'chat' }, laufFn)
  await assert.rejects(entkommenesRunTask('zusammenfassung', { docText: 'T' }), /Laufende/)
  assert.equal(t.aufrufe.length, 1, 'der verwaiste Aufruf erreicht das Gateway gar nicht erst')
  setzeTransportFuerTests(null)
})

test('die Verbrauchsbuchung laeuft weiter genau einmal im Gateway', async () => {
  const t = fakeTransport([(a, h) => h.onFertig({ text: 'ok', usage: { ...USAGE }, stopReason: 'end_turn' })])
  const w = baueWelt()
  setzeTransportFuerTests(t)

  await fuehreLaufAus({ kanal: 'chat' }, erfolgLaufFn)
  assert.equal(w.settings.usage.inputTokens, USAGE.input_tokens)
  assert.equal(w.settings.usage.outputTokens, USAGE.output_tokens)
  assert.equal(w.settings.usage.cacheReadTokens, USAGE.cache_read_input_tokens)
  assert.equal(w.settings.usage.cacheWriteTokens, USAGE.cache_creation_input_tokens)
  assert.equal(w.gatewayPersistCount(), 1, 'genau ein Gateway-Aufruf, genau ein Gateway-Persist')
  setzeTransportFuerTests(null)
})

test('JOURNAL-INVARIANTE: auch unter Kollisionen und Wiederholungen entstehen nie zwei bezahlte Laeufe gleicher Signatur und gleichen Kanals', async () => {
  const t = steuerbarerTransport()
  const w = baueWelt()
  setzeTransportFuerTests(t)

  // 1) Rennen: zwei gleichzeitige Laeufe, derselbe Kanal, dieselbe Signatur.
  t.setModus('ok-verzoegert')
  const [r1a, r1b] = await Promise.all([
    fuehreLaufAus({ kanal: 'hinweis', signatur: 'S1', einmalJeSignatur: true }, erfolgLaufFn),
    fuehreLaufAus({ kanal: 'hinweis', signatur: 'S1', einmalJeSignatur: true }, erfolgLaufFn),
  ])
  assert.equal([r1a, r1b].filter(r => r.gestartet === false && r.grund === 'lauf-aktiv').length, 1)

  // 2) Wiederholung: derselbe Stand direkt danach -- muss blockieren, nicht laufen.
  t.setModus('ok')
  const r2 = await fuehreLaufAus({ kanal: 'hinweis', signatur: 'S1', einmalJeSignatur: true }, erfolgLaufFn)
  assert.deepEqual(r2, { gestartet: false, grund: 'unveraendert' })

  // 3) Fehler + Retry: neuer Stand, erster Versuch schlaegt fehl, zweiter gelingt.
  t.setModus('fehler')
  const r3 = await fuehreLaufAus({ kanal: 'hinweis', signatur: 'S2', einmalJeSignatur: true }, erfolgLaufFn)
  assert.equal(r3.erfolg, false)
  t.setModus('ok')
  const r4 = await fuehreLaufAus({ kanal: 'hinweis', signatur: 'S2', einmalJeSignatur: true }, erfolgLaufFn)
  assert.equal(r4.gestartet, true)

  // 4) Hand-Lauf: derselbe frisch gelieferte Stand, aber ausdruecklich ohne Sperre-Logik.
  const r5 = await fuehreLaufAus({ kanal: 'hinweis', signatur: 'S2', einmalJeSignatur: false }, erfolgLaufFn)
  assert.equal(r5.gestartet, true)

  // 5) Zweite Rennserie, anderer Kanal, andere Signatur.
  t.setModus('ok-verzoegert')
  const [r6a, r6b] = await Promise.all([
    fuehreLaufAus({ kanal: 'erweiterung', signatur: 'E1', einmalJeSignatur: true }, erfolgLaufFn),
    fuehreLaufAus({ kanal: 'erweiterung', signatur: 'E1', einmalJeSignatur: true }, erfolgLaufFn),
  ])
  assert.equal([r6a, r6b].filter(r => r.gestartet === false && r.grund === 'lauf-aktiv').length, 1)

  assert.deepEqual(pruefeJournalInvariante(w.journal), [])

  // Gezielt: die Verstoss-Faelle kommen im Journal schlicht nicht vor -- je genau EIN
  // bezahlter, nicht-fehlgeschlagener Eintrag fuer hinweis/S1 und erweiterung/E1, obwohl
  // beide zweimal gleichzeitig angestossen wurden.
  const hinweisS1 = w.journal.eintraege.filter(e => e.kanal === 'hinweis' && e.signatur === 'S1' && e.ergebnis !== 'fehler')
  assert.equal(hinweisS1.length, 1)
  const erweiterungE1 = w.journal.eintraege.filter(e => e.kanal === 'erweiterung' && e.signatur === 'E1' && e.ergebnis !== 'fehler')
  assert.equal(erweiterungE1.length, 1)
  setzeTransportFuerTests(null)
})

test('fuehreChatLauf-Fehler im laufFn wird als fehler journalisiert, fuehreLaufAus wirft nie', async () => {
  const t = fakeTransport([(a, h) => h.onFertig({ text: 'ok', usage: { ...USAGE }, stopReason: 'end_turn' })])
  const w = baueWelt()
  setzeTransportFuerTests(t)

  const laufFn = async ({ runTask }) => {
    await runTask('zusammenfassung', { docText: 'T' })
    throw { typ: 'unerwartet', nachricht: 'kaputt nach dem Aufruf' }
  }
  const r = await fuehreLaufAus({ kanal: 'chat' }, laufFn)
  assert.deepEqual(r, { gestartet: true, erfolg: false, fehler: 'unerwartet' })
  assert.equal(w.journal.eintraege.length, 1)
  assert.equal(w.journal.eintraege[0].ergebnis, 'fehler')
  assert.equal(w.journal.eintraege[0].fehlerTyp, 'unerwartet')
  setzeTransportFuerTests(null)
})

test('fuehreLaufAus wirft nie, selbst wenn laufFn einen Nicht-Objekt-Fehler wirft', async () => {
  const t = fakeTransport([(a, h) => h.onFertig({ text: 'ok', usage: { ...USAGE }, stopReason: 'end_turn' })])
  baueWelt()
  setzeTransportFuerTests(t)

  const laufFn = async ({ runTask }) => {
    await runTask('zusammenfassung', { docText: 'T' })
    throw 'einfacher String-Fehler'
  }
  const r = await fuehreLaufAus({ kanal: 'chat' }, laufFn)
  assert.equal(r.gestartet, true)
  assert.equal(r.erfolg, false)
  assert.equal(r.fehler, 'unbekannt')
  setzeTransportFuerTests(null)
})

test('leeres uebernommen ergibt Ergebnis verworfen mit den Wertzahlen aus laufFn', async () => {
  const t = fakeTransport([(a, h) => h.onFertig({ text: 'ok', usage: { ...USAGE }, stopReason: 'end_turn' })])
  const w = baueWelt()
  setzeTransportFuerTests(t)

  const laufFn = async ({ runTask }) => {
    await runTask('zusammenfassung', { docText: 'T' })
    return { gestartet: true, erfolg: true, uebernommen: [], verworfen: 3, geliefertAnzahl: 3 }
  }
  await fuehreLaufAus({ kanal: 'hinweis' }, laufFn)
  const [e] = w.journal.eintraege
  assert.equal(e.ergebnis, 'verworfen')
  assert.equal(e.geliefert, 3)
  assert.equal(e.uebernommen, 0)
  assert.equal(e.verworfen, 3)
  setzeTransportFuerTests(null)
})

test('nicht-leeres uebernommen ergibt Ergebnis geliefert mit den Wertzahlen aus laufFn', async () => {
  const t = fakeTransport([(a, h) => h.onFertig({ text: 'ok', usage: { ...USAGE }, stopReason: 'end_turn' })])
  const w = baueWelt()
  setzeTransportFuerTests(t)

  const laufFn = async ({ runTask }) => {
    await runTask('zusammenfassung', { docText: 'T' })
    return { gestartet: true, erfolg: true, uebernommen: [{ id: 'x' }, { id: 'y' }], verworfen: 1, geliefertAnzahl: 3 }
  }
  await fuehreLaufAus({ kanal: 'erweiterung' }, laufFn)
  const [e] = w.journal.eintraege
  assert.equal(e.ergebnis, 'geliefert')
  assert.equal(e.geliefert, 3)
  assert.equal(e.uebernommen, 2)
  assert.equal(e.verworfen, 1)
  setzeTransportFuerTests(null)
})

test('kanalGesperrt spiegelt das Sperren-Register waehrend eines laufenden Laufs', async () => {
  const t = fakeTransport([(a, h) => setTimeout(() => h.onFertig({ text: 'ok', usage: { ...USAGE }, stopReason: 'end_turn' }), 15)])
  baueWelt()
  setzeTransportFuerTests(t)

  assert.equal(kanalGesperrt('interview'), false)
  const lauf = fuehreLaufAus({ kanal: 'interview' }, erfolgLaufFn)
  assert.equal(kanalGesperrt('interview'), true, 'die Sperre steht schon synchron nach dem Aufruf')
  assert.equal(kanalGesperrt('chat'), false, 'andere Kanaele bleiben unberuehrt')
  await lauf
  assert.equal(kanalGesperrt('interview'), false, 'finally gibt die Sperre wieder frei')
  setzeTransportFuerTests(null)
})

test('unbekannter Kanal wirft (Programmierfehler)', async () => {
  await assert.rejects(fuehreLaufAus({ kanal: 'quatsch' }, erfolgLaufFn), /unbekannter Kanal/)
})

test('fehlendes laufFn wirft (Programmierfehler)', async () => {
  await assert.rejects(fuehreLaufAus({ kanal: 'chat' }, null), /laufFn fehlt/)
})

test('merkeKarteGezeigt haengt ein gezeigt-Ereignis an, dedupliziert per findingId und ruft scheduleSave', () => {
  const journal = leeresJournal()
  let scheduleSaveAufrufe = 0
  initLaufTor({ getJournal: () => journal, persist: () => {}, scheduleSave: () => { scheduleSaveAufrufe += 1 } })

  const neu = merkeKarteGezeigt({ findingId: 'f1', art: 'hinweis', moment: 'pause' })
  assert.equal(neu, true)
  assert.equal(journal.gezeigt.length, 1)
  assert.equal(journal.gezeigt[0].findingId, 'f1')
  assert.equal(scheduleSaveAufrufe, 1)

  const nochmal = merkeKarteGezeigt({ findingId: 'f1', art: 'hinweis', moment: 'pause' })
  assert.equal(nochmal, false, 'zweites Erscheinen derselben Karte ist kein neues Ereignis')
  assert.equal(scheduleSaveAufrufe, 1, 'kein scheduleSave-Aufruf ohne echte Aenderung')
})

test('torJournal liefert das per Hook verdrahtete Journal, ohne Hook ein internes Fallback', () => {
  const journal = leeresJournal()
  initLaufTor({ getJournal: () => journal, persist: () => {} })
  assert.equal(torJournal(), journal)

  initLaufTor({})
  assert.notEqual(torJournal(), journal)
  assert.deepEqual(torJournal(), leeresJournal())
})
