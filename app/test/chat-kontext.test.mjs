import test from 'node:test'
import assert from 'node:assert/strict'
import {
  baueChatKontext,
  chatFehlerText,
  entscheidungsEintraege,
  erkenneHinweisBitte,
  formatiereRelativeZeit,
  kurzformEntscheidungen,
  kurzformHinweise,
  planVerlaufVerdichtung,
  verlaufFuerPrompt,
} from '../src/chat-kontext.mjs'
import { baueAnfrage } from '../src/agent-tasks.mjs'

// PFLICHT (Lehre aus V-3/H-2, siehe verstaendnis-kontext.test.mjs / hinweis-kontext.test.mjs):
// baueAnfrage (agent-tasks.mjs) konsumiert AUSSCHLIESSLICH {verstaendnis, docText, volatiles,
// verlauf, anfrage}. Ein Kontext-Objekt mit eigenen Feldnamen wie {offeneHinweise,
// entscheidungen, zusatzAnweisung} wuerde von baueAnfrage stillschweigend ignoriert — das
// Modell bekaeme offene Hinweise, Entscheidungen und Zusatzanweisung nie zu sehen, waehrend
// Tests, die nur den Zwischenwert pruefen, trotzdem gruen blieben. Die baueChatKontext-Tests
// fahren deshalb den echten Weg (baueChatKontext -> baueAnfrage) und pruefen den
// TATSAECHLICHEN Request-Body. Ein gestubbter fetch waere hier KEIN Beleg.

function turn(id, role, text, at) {
  return { id, role, text, at }
}

function langerThread(anzahl) {
  return Array.from({ length: anzahl }, (unused, index) => turn(
    `m-${index + 1}`,
    index % 2 === 0 ? 'user' : 'agent',
    `Turn ${index + 1}`,
    index + 1,
  ))
}

test('erkenneHinweisBitte erkennt Durchsicht-Bitten', () => {
  assert.equal(erkenneHinweisBitte('Schau bitte nochmal über den Text.'), true)
  assert.equal(erkenneHinweisBitte('Kannst du das prüfen?'), true)
  assert.equal(erkenneHinweisBitte('Lies den zweiten Absatz.'), true)
  assert.equal(erkenneHinweisBitte('Mach mal einen Check.'), true)
})

test('erkenneHinweisBitte ignoriert normale Fragen', () => {
  assert.equal(erkenneHinweisBitte('Wie wirkt der Einstieg auf dich?'), false)
  assert.equal(erkenneHinweisBitte(''), false)
  assert.equal(erkenneHinweisBitte(null), false)
})

test('formatiereRelativeZeit deckt Minuten, Stunden, gestern, Tage und Datum ab', () => {
  const now = new Date('2026-07-26T12:00:00').getTime()
  assert.equal(formatiereRelativeZeit(now - 20_000, now), 'gerade eben')
  assert.equal(formatiereRelativeZeit(now - 60_000, now), 'vor 1 Minute')
  assert.equal(formatiereRelativeZeit(now - 5 * 60_000, now), 'vor 5 Minuten')
  assert.equal(formatiereRelativeZeit(now - 3 * 3_600_000, now), 'vor 3 Stunden')
  assert.equal(formatiereRelativeZeit(now - 30 * 3_600_000, now), 'gestern')
  assert.equal(formatiereRelativeZeit(now - 3 * 86_400_000, now), 'vor 3 Tagen')
  assert.equal(
    formatiereRelativeZeit(new Date('2026-07-01T12:00:00').getTime(), now),
    '01.07.2026',
  )
  assert.equal(formatiereRelativeZeit(Number.NaN, now), '')
})

test('entscheidungsEintraege ordnet neueste zuerst und benennt die Entscheidungsarten', () => {
  const now = new Date('2026-07-26T12:00:00').getTime()
  const doc = {
    findings: [
      { id: 'f-1', short: 'Aussage ohne Beleg', action: 'Neu A', category: 'source' },
      { id: 'f-2', short: 'Unscharfe Formulierung', action: 'Neu B', category: 'wording' },
    ],
    decisions: [
      { id: 'd-1', findingId: 'f-1', kind: 'reject', outcome: 'risk-accepted', reason: 'Quelle folgt nächste Woche', appliedText: '', at: now - 86_400_000 - 3_600_000 },
      { id: 'd-2', findingId: 'f-2', kind: 'accept', outcome: 'resolved', reason: '', appliedText: 'Neu B', at: now - 60_000 },
    ],
  }
  const eintraege = entscheidungsEintraege(doc, now)
  assert.equal(eintraege.length, 2)
  assert.equal(eintraege[0].id, 'd-2')
  assert.equal(eintraege[0].art, 'angenommen')
  assert.equal(eintraege[0].label, 'Angenommen')
  assert.equal(eintraege[0].kurztext, 'Unscharfe Formulierung')
  assert.equal(eintraege[0].datumText, 'vor 1 Minute')
  assert.equal(eintraege[0].begruendung, '')
  assert.equal(eintraege[1].art, 'risiko')
  assert.equal(eintraege[1].label, 'Risiko bewusst angenommen')
  assert.equal(eintraege[1].begruendung, 'Quelle folgt nächste Woche')
  assert.equal(eintraege[1].datumText, 'gestern')
})

test('entscheidungsEintraege erkennt eigene Fassung, Verwerfen und fehlende Findings', () => {
  const now = 1_000_000
  const doc = {
    findings: [{ id: 'f-1', short: 'Hinweis', action: 'KI-Vorschlag' }],
    decisions: [
      { id: 'd-1', findingId: 'f-1', kind: 'accept', outcome: 'resolved', appliedText: 'Eigene Formulierung', at: now - 1 },
      { id: 'd-2', findingId: 'f-1', kind: 'reject', outcome: 'dismissed', appliedText: '', at: now - 2 },
      { id: 'd-3', findingId: 'weg', kind: 'accept', outcome: 'resolved', appliedText: '', at: now - 3 },
    ],
  }
  const eintraege = entscheidungsEintraege(doc, now)
  assert.equal(eintraege[0].art, 'eigene')
  assert.equal(eintraege[0].label, 'Eigene Fassung übernommen')
  assert.equal(eintraege[1].art, 'verworfen')
  assert.equal(eintraege[2].kurztext, 'Hinweis nicht mehr vorhanden')
  assert.equal(kurzformEntscheidungen(doc, now)[0], 'Eigene Fassung übernommen: Hinweis')
})

test('kurzformHinweise liefert nur offene Hinweise mit Kategorie und Anker', () => {
  const findings = [
    { id: 'f-1', status: 'open', category: 'logik', short: 'Sprung in der Argumentation', target: 'daraus folgt zwingend' },
    { id: 'f-2', status: 'resolved', category: 'sprache', short: 'Erledigt', target: 'x' },
    { id: 'f-3', status: 'open', short: 'Ohne Kategorie und Anker' },
  ]
  const kurz = kurzformHinweise(findings)
  assert.deepEqual(kurz, [
    '[logik] Sprung in der Argumentation — Anker: »daraus folgt zwingend«',
    '[hinweis] Ohne Kategorie und Anker',
  ])
})

test('verlaufFuerPrompt spiegelt ohne Notiz den bereinigten Thread', () => {
  const thread = [
    turn('m-1', 'user', 'Frage', 1),
    { id: 'kaputt', role: 'tool', text: 'weg', at: 2 },
    turn('m-3', 'agent', 'Antwort', 3),
  ]
  assert.deepEqual(verlaufFuerPrompt(thread), [
    { role: 'user', text: 'Frage' },
    { role: 'agent', text: 'Antwort' },
  ])
})

test('verlaufFuerPrompt ersetzt mit Notiz die älteren Turns durch die Zusammenfassung', () => {
  const thread = langerThread(4)
  const verlauf = verlaufFuerPrompt(thread, { text: 'Bisher ging es um den Einstieg.', bisMessageId: 'm-2' })
  assert.deepEqual(verlauf, [
    { role: 'agent', text: 'Zusammenfassung des bisherigen Gesprächs: Bisher ging es um den Einstieg.' },
    { role: 'user', text: 'Turn 3' },
    { role: 'agent', text: 'Turn 4' },
  ])
})

test('planVerlaufVerdichtung lässt kurze Verläufe unangetastet', () => {
  assert.equal(planVerlaufVerdichtung(langerThread(20)), null)
  assert.equal(planVerlaufVerdichtung([]), null)
})

test('planVerlaufVerdichtung verdichtet ältere Turns und behält die letzten acht', () => {
  const plan = planVerlaufVerdichtung(langerThread(25))
  assert.ok(plan)
  assert.equal(plan.bisMessageId, 'm-17')
  assert.ok(plan.verdichtungsEingabe.startsWith('Nutzer: Turn 1\n'))
  assert.ok(plan.verdichtungsEingabe.includes('Agent: Turn 16'))
  assert.ok(!plan.verdichtungsEingabe.includes('Turn 18'))
})

test('planVerlaufVerdichtung baut auf einer bestehenden Notiz auf', () => {
  const thread = langerThread(40)
  const notiz = { text: 'Alte Zusammenfassung.', bisMessageId: 'm-10' }
  const plan = planVerlaufVerdichtung(thread, notiz)
  assert.ok(plan)
  assert.ok(plan.verdichtungsEingabe.startsWith('Bisherige Zusammenfassung:\nAlte Zusammenfassung.'))
  assert.ok(plan.verdichtungsEingabe.includes('Nutzer: Turn 11'))
  assert.equal(plan.bisMessageId, 'm-32')
})

test('chatFehlerText liefert ruhige deutsche Meldungen je Fehlertyp', () => {
  assert.ok(chatFehlerText({ typ: 'kein-schluessel' }).includes('kein Schlüssel'))
  assert.ok(chatFehlerText({ typ: 'offline' }).includes('Netz'))
  assert.ok(chatFehlerText({ typ: 'ratenlimit' }).includes('Anfragen'))
  assert.ok(chatFehlerText({ typ: 'ueberlastet' }).includes('ausgelastet'))
  assert.ok(chatFehlerText({ typ: 'abgelehnt' }).includes('nicht eingehen'))
  assert.ok(chatFehlerText(null).includes('nicht geklappt'))
  for (const typ of ['kein-schluessel', 'offline', 'ratenlimit', 'ueberlastet', null]) {
    assert.ok(chatFehlerText({ typ }).length < 160)
  }
})

// Bindende Regel nennt sieben Fehlertypen (kein-schluessel|offline|ratenlimit|ueberlastet|
// schema|abgelehnt|abgebrochen) — schema und abgebrochen brauchen eigene ruhige Saetze,
// keinen stillen Rueckfall auf die generische Meldung.
test('chatFehlerText deckt auch schema und abgebrochen mit eigenem, ruhigem Text ab', () => {
  const schema = chatFehlerText({ typ: 'schema' })
  const abgebrochen = chatFehlerText({ typ: 'abgebrochen' })
  const sonst = chatFehlerText({ typ: 'irgendwas-unbekanntes' })
  assert.notEqual(schema, sonst, 'schema braucht einen eigenen Text statt der generischen Meldung')
  assert.notEqual(abgebrochen, sonst, 'abgebrochen braucht einen eigenen Text statt der generischen Meldung')
  assert.ok(schema.length > 0 && schema.length < 160)
  assert.ok(abgebrochen.length > 0 && abgebrochen.length < 160)
})

test('chatFehlerText bleibt im Onda-Ton: keine Ausrufezeichen, keine Emoji, kein interner Code als Label', () => {
  const alleTypen = ['kein-schluessel', 'offline', 'ratenlimit', 'ueberlastet', 'schema', 'abgelehnt', 'abgebrochen', 'unbekannt', null]
  for (const typ of alleTypen) {
    const text = chatFehlerText({ typ })
    assert.ok(!text.includes('!'), `Text fuer '${typ}' enthaelt ein Ausrufezeichen`)
    assert.ok(!/\p{Emoji_Presentation}/u.test(text), `Text fuer '${typ}' enthaelt ein Emoji`)
    assert.ok(!text.toLowerCase().includes('etappe'), `Text fuer '${typ}' nennt eine interne Etappe`)
    assert.ok(!text.includes('kein-schluessel'), `Text fuer '${typ}' zeigt den internen Code als Label`)
  }
})

test('baueChatKontext liefert exakt den baueAnfrage-Vertrag: verstaendnis, docText, volatiles, verlauf, anfrage', () => {
  const doc = {
    findings: [{ id: 'f-1', status: 'open', category: 'fakt', short: 'Zahl unbelegt', target: '90 Prozent' }],
    decisions: [{ id: 'd-1', findingId: 'f-1', kind: 'reject', outcome: 'dismissed', at: 500 }],
  }
  const kontext = baueChatKontext({
    verstaendnis: { task: 'Essay' },
    docText: 'Absatz eins.',
    findings: doc.findings,
    doc,
    thread: [turn('m-1', 'user', 'Hallo', 1)],
    anfrage: 'Wie wirkt der Einstieg?',
    zusatzAnweisung: null,
    now: 1_000,
  })
  assert.deepEqual(Object.keys(kontext).sort(), ['anfrage', 'docText', 'verlauf', 'verstaendnis', 'volatiles'])
  assert.equal(kontext.docText, 'Absatz eins.')
  assert.equal(kontext.volatiles.length, 2, 'ein Block fuer offene Hinweise, einer fuer Entscheidungen')
  assert.deepEqual(kontext.verlauf, [{ role: 'user', content: 'Hallo' }])
  assert.equal(kontext.anfrage, 'Wie wirkt der Einstieg?')
})

// DAS ist der Beleg, den V-3/H-2 verlangen: nicht der Zwischenwert, sondern der tatsaechliche
// Request-Body nach baueAnfrage('chat', ...). Aktuelle Frage, aelterer Verlauf,
// Entscheidungs-Kurzform und offene Hinweise muessen alle vier ankommen.
test('baueChatKontext -> baueAnfrage("chat"): aktuelle Frage, älterer Verlauf, Entscheidungs-Kurzform und offene Hinweise erreichen den echten Request-Body', () => {
  const doc = {
    findings: [
      { id: 'f-offen', status: 'open', category: 'fakt', short: 'MARKANTER-OFFENER-HINWEIS-9c1b', target: '90 Prozent' },
      { id: 'f-entschieden', short: 'MARKANTER-ENTSCHIEDENER-HINWEIS-2e7a', action: 'Neuer Vorschlag' },
    ],
    decisions: [
      { id: 'd-1', findingId: 'f-entschieden', kind: 'reject', outcome: 'dismissed', reason: '', at: 500 },
    ],
  }
  const kontext = baueChatKontext({
    verstaendnis: { task: 'Essay' },
    docText: 'MARKANTER-DOKTEXT-1a2b',
    findings: doc.findings,
    doc,
    thread: [turn('m-1', 'agent', 'MARKANTER-AELTERER-TURN-3f4e', 1)],
    anfrage: 'MARKANTE-AKTUELLE-FRAGE-7d8c',
    now: 1_000,
  })
  const anfrage = baueAnfrage('chat', kontext)
  const bodyJson = JSON.stringify(anfrage.body)

  assert.ok(bodyJson.includes('MARKANTE-AKTUELLE-FRAGE-7d8c'), 'aktuelle Frage fehlt im Request-Body')
  assert.ok(bodyJson.includes('MARKANTER-AELTERER-TURN-3f4e'), 'älterer Verlauf fehlt im Request-Body')
  assert.ok(bodyJson.includes('Verworfen') && bodyJson.includes('MARKANTER-ENTSCHIEDENER-HINWEIS-2e7a'), 'Entscheidungs-Kurzform fehlt im Request-Body')
  assert.ok(bodyJson.includes('MARKANTER-OFFENER-HINWEIS-9c1b'), 'offene Hinweise fehlen im Request-Body')
  assert.ok(bodyJson.includes('MARKANTER-DOKTEXT-1a2b'), 'Dokumenttext fehlt im Request-Body')

  const messages = anfrage.body.messages
  assert.equal(messages.length, 3, 'Block-Nachricht, älterer Verlauf, aktuelle Frage')
  assert.deepEqual(messages.slice(1).map(m => [m.role, m.content]), [
    ['assistant', 'MARKANTER-AELTERER-TURN-3f4e'],
    ['user', 'MARKANTE-AKTUELLE-FRAGE-7d8c'],
  ])
  const letzte = messages[messages.length - 1]
  assert.equal(letzte.role, 'user', 'letzte Message muss user sein (kein Prefill)')
})

test('Cache-Präfix bleibt stabil: verstaendnis+dokument zuerst mit cache_control, Volatiles danach ohne', () => {
  const doc = {
    findings: [{ id: 'f-1', status: 'open', category: 'fakt', short: 'x' }],
    decisions: [{ id: 'd-1', findingId: 'f-1', kind: 'reject', outcome: 'dismissed', at: 1 }],
  }
  const kontext = baueChatKontext({
    verstaendnis: { task: 'Essay' },
    docText: 'Doktext',
    findings: doc.findings,
    doc,
    thread: [],
    anfrage: 'Frage',
    now: 1_000,
  })
  const anfrage = baueAnfrage('chat', kontext)
  const content = anfrage.body.messages[0].content
  assert.ok(content[0].text.startsWith('<projektverstaendnis>'))
  assert.deepEqual(content[0].cache_control, { type: 'ephemeral' })
  assert.ok(content[1].text.startsWith('<dokument>'))
  assert.deepEqual(content[1].cache_control, { type: 'ephemeral' })
  for (const block of content.slice(2)) assert.ok(!('cache_control' in block), 'Volatiles duerfen kein cache_control tragen')
})

test('ohne aktuelle Frage kein verlauf/anfrage im Kontext — baueAnfrage("chat", ...) wirft nicht', () => {
  const kontext = baueChatKontext({
    verstaendnis: { task: 'Essay' },
    docText: 'Doktext',
    findings: [],
    doc: null,
    thread: [turn('m-1', 'user', 'Hallo', 1)],
    anfrage: '',
    now: 1_000,
  })
  assert.equal('verlauf' in kontext, false, 'ohne aktuelle Frage darf kein verlauf mitgegeben werden — baueAnfrage wirft sonst')
  assert.equal('anfrage' in kontext, false)
  assert.doesNotThrow(() => baueAnfrage('chat', kontext))
})

test('zusatzAnweisung erscheint als eigener volatiler Block im echten Request-Body, wenn gesetzt', () => {
  const kontext = baueChatKontext({
    verstaendnis: null,
    docText: '',
    findings: [],
    doc: null,
    thread: [],
    anfrage: 'Frage',
    zusatzAnweisung: 'MARKANTE-ZUSATZANWEISUNG-5f1d',
    now: 1_000,
  })
  const anfrage = baueAnfrage('chat', kontext)
  assert.ok(JSON.stringify(anfrage.body).includes('MARKANTE-ZUSATZANWEISUNG-5f1d'))
})

test('ohne offene Hinweise/Entscheidungen/Zusatzanweisung kein leerer Block', () => {
  const kontext = baueChatKontext({
    verstaendnis: null,
    docText: '',
    findings: [],
    doc: null,
    thread: [],
    anfrage: 'Frage',
    now: 1_000,
  })
  assert.deepEqual(kontext.volatiles, [])
})

test('baueChatKontext ist pur: gleicher Input ergibt byte-gleiches JSON', () => {
  const eingabe = {
    verstaendnis: { task: 'Essay' },
    docText: 'Text',
    findings: [{ id: 'f-1', status: 'open', category: 'fakt', short: 'x' }],
    doc: {
      findings: [{ id: 'f-1', short: 'x', action: 'y' }],
      decisions: [{ id: 'd-1', findingId: 'f-1', kind: 'accept', outcome: 'resolved', appliedText: 'y', at: 1 }],
    },
    thread: [turn('m-1', 'agent', 'Frage', 1)],
    anfrage: 'Antwort',
    zusatzAnweisung: 'Zusatz',
    now: 1_000,
  }
  const a = JSON.stringify(baueChatKontext(eingabe))
  const b = JSON.stringify(baueChatKontext(eingabe))
  assert.equal(a, b)
})
