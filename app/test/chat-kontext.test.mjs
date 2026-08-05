import test from 'node:test'
import assert from 'node:assert/strict'
import {
  baueChatKontext,
  baueFindingZusatzAnweisung,
  chatFehlerText,
  entscheidungsEintraege,
  erkenneHinweisBitte,
  formatiereRelativeZeit,
  fuehreChatVorgangAus,
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

// Fix-Runde 2, Finding 2a (Important): das Muster traf vorher ohne Wortgrenzen auch mitten in
// ganz anderen Woertern -- "veranschaulichen" (schau), "überprüfbar" (prüf), "Checkliste"
// (check) loesten faelschlich einen teuren Hinweislauf aus. Gaengige Beugungen ("schaust",
// "prüfst") muessen weiterhin treffen.
test('erkenneHinweisBitte erkennt gaengige Beugungen von schau/prüf/lies/check', () => {
  assert.equal(erkenneHinweisBitte('schau mal'), true)
  assert.equal(erkenneHinweisBitte('schaust du mal drüber?'), true)
  assert.equal(erkenneHinweisBitte('prüf das bitte'), true)
  assert.equal(erkenneHinweisBitte('prüfst du das nochmal?'), true)
  assert.equal(erkenneHinweisBitte('lies'), true)
  assert.equal(erkenneHinweisBitte('check das mal'), true)
})

test('erkenneHinweisBitte ignoriert Alltagswörter, die die Auslösewörter nur als Teilstring enthalten', () => {
  assert.equal(erkenneHinweisBitte('Kannst du das an einem Beispiel veranschaulichen?'), false)
  assert.equal(erkenneHinweisBitte('Das ist schließlich nur ein Entwurf.'), false)
  assert.equal(erkenneHinweisBitte('Diese Aussage ist gut überprüfbar.'), false)
  assert.equal(erkenneHinweisBitte('Ich brauche noch eine Checkliste für morgen.'), false)
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
  assert.equal(eintraege[0].resultierenderWortlaut, 'Neu B')
  assert.equal(eintraege[1].art, 'risiko')
  assert.equal(eintraege[1].label, 'Risiko bewusst angenommen')
  assert.equal(eintraege[1].begruendung, 'Quelle folgt nächste Woche')
  assert.equal(eintraege[1].resultierenderWortlaut, '')
  assert.equal(eintraege[1].datumText, 'gestern')
})

test('entscheidungsEintraege erkennt eigene Fassung, Verwerfen und fehlende Findings', () => {
  const now = 1_000_000
  const doc = {
    findings: [{ id: 'f-1', short: 'Hinweis', action: 'KI-Vorschlag', target: 'Ursprünglicher Wortlaut' }],
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
  assert.equal(eintraege[1].resultierenderWortlaut, 'Ursprünglicher Wortlaut')
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

// Task C-3: der lokale Dialog an der Randkarte muss sich auf GENAU dieses Finding beziehen
// (Kategorie, Beobachtung, wörtlicher Anker, Relevanz) statt auf das Dokument allgemein.
// Pure, node-testbar -- Vorbild kurzformHinweise/kurzformEntscheidungen in dieser Datei.
test('baueFindingZusatzAnweisung nennt Kategorie, Beobachtung, Anker und Relevanz', () => {
  const text = baueFindingZusatzAnweisung({
    category: 'logic',
    short: 'Sprung in der Argumentation',
    target: 'daraus folgt zwingend',
    why: 'Der Schluss ist nicht durch die vorherigen Sätze gedeckt',
  })
  assert.ok(text.includes('logic'), 'Kategorie fehlt')
  assert.ok(text.includes('Sprung in der Argumentation'), 'Beobachtung (Kurztext) fehlt')
  assert.ok(text.includes('daraus folgt zwingend'), 'Anker fehlt')
  assert.ok(text.includes('Der Schluss ist nicht durch die vorherigen Sätze gedeckt'), 'Relevanz fehlt')
  assert.ok(text.includes('Bleib bei dieser Stelle'), 'Weisung, beim Finding zu bleiben, fehlt')
})

test('baueFindingZusatzAnweisung kommt ohne Kategorie/Anker/Relevanz aus, ohne leere Zeilen', () => {
  const text = baueFindingZusatzAnweisung({ short: 'Nur eine Beobachtung' })
  assert.ok(text.includes('Nur eine Beobachtung'))
  assert.ok(text.includes('hinweis'), 'Kategorie fällt auf den generischen Begriff zurück')
  assert.ok(!text.includes('Anker'), 'ohne target darf keine Anker-Zeile erscheinen')
  assert.ok(!text.includes('Relevanz'), 'ohne why darf keine Relevanz-Zeile erscheinen')
  assert.ok(!/\n[ \t]*\n/.test(text), 'keine leeren Zeilen durch gefilterte Felder')
})

test('baueFindingZusatzAnweisung liefert leeren Text ohne Finding', () => {
  assert.equal(baueFindingZusatzAnweisung(null), '')
  assert.equal(baueFindingZusatzAnweisung(undefined), '')
})

test('baueFindingZusatzAnweisung bleibt im Onda-Ton: keine Ausrufezeichen, keine Emoji', () => {
  const text = baueFindingZusatzAnweisung({ category: 'fakt', short: 'x', target: 'y', why: 'z' })
  assert.ok(!text.includes('!'))
  assert.ok(!/\p{Emoji_Presentation}/u.test(text))
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

// Marker-Test für Task C-3 (lokaler Dialog an der Randkarte): derselbe Beleg-Anspruch wie
// oben, aber für den Finding-Bezug. baueFindingZusatzAnweisung(finding) geht unverändert als
// zusatzAnweisung in baueChatKontext -- Anker und Kurztext des Findings UND die aktuelle Frage
// müssen beide im echten Request-Body ankommen, sonst redet der lokale Dialog am Finding vorbei.
test('baueFindingZusatzAnweisung + baueChatKontext -> baueAnfrage("chat"): Finding-Anker, Finding-Kurztext und aktuelle Frage erreichen den echten Request-Body', () => {
  const finding = {
    id: 'f-lokal',
    category: 'logic',
    short: 'MARKANTE-BEOBACHTUNG-4b2a',
    target: 'MARKANTER-ANKER-7c3d',
    why: 'MARKANTE-RELEVANZ-9e1f',
    thread: [
      turn('m-1', 'agent', 'Ich würde diese Stelle gern genauer verstehen: MARKANTE-BEOBACHTUNG-4b2a', 1),
      turn('m-2', 'user', 'MARKANTE-AKTUELLE-FRAGE-6f5e', 2),
    ],
  }
  const doc = { findings: [], decisions: [] }
  const kontext = baueChatKontext({
    verstaendnis: { task: 'Essay' },
    docText: 'MARKANTER-DOKTEXT-2a1b',
    findings: doc.findings,
    doc,
    thread: finding.thread.slice(0, -1), // der aktuelle Nutzer-Turn geht separat als `anfrage` mit -- exakt wie in workspace.js
    anfrage: 'MARKANTE-AKTUELLE-FRAGE-6f5e',
    zusatzAnweisung: baueFindingZusatzAnweisung(finding),
    now: 1_000,
  })
  const anfrage = baueAnfrage('chat', kontext)
  const bodyJson = JSON.stringify(anfrage.body)

  assert.ok(bodyJson.includes('MARKANTER-ANKER-7c3d'), 'Finding-Anker fehlt im Request-Body')
  assert.ok(bodyJson.includes('MARKANTE-BEOBACHTUNG-4b2a'), 'Finding-Kurztext (Beobachtung) fehlt im Request-Body')
  assert.ok(bodyJson.includes('MARKANTE-AKTUELLE-FRAGE-6f5e'), 'aktuelle Frage fehlt im Request-Body')
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

// Fix-Runde 1, Finding 1 (Critical) + Finding 2 (Important): dieselbe Kollision, die
// versucheHinweislauf (hinweislauf-model.mjs, Fix-Runde 1) bereits fuer den Hinweislauf loest,
// trat hier fuer den Chat auf -- die Sperre wurde erst tief in fuehreChatLauf gesetzt, NACH
// dem await der Verdichtung. Zwei kurz aufeinanderfolgende Submits konnten dadurch zwei
// parallele, bezahlte runTask('chat', …)-Laeufe ausloesen. fuehreChatVorgangAus setzt die
// Sperre jetzt SYNCHRON vor jedem await -- Vorbild und Testmuster: exakt wie bei
// versucheHinweislauf.

function chatVorgangEingabe(extra = {}) {
  return {
    laeuftBereits: () => false,
    sperreSetzen: () => {},
    setzeStatus: () => {},
    verdichte: async () => {},
    chatte: async () => {},
    ...extra,
  }
}

test('fuehreChatVorgangAus: Sperre wird synchron VOR dem ersten await gesetzt', async () => {
  const reihenfolge = []
  let sperreGesetztVorAwait = false
  const versprechen = fuehreChatVorgangAus(chatVorgangEingabe({
    sperreSetzen: wert => { reihenfolge.push(['sperre', wert]); sperreGesetztVorAwait = wert === true },
    verdichte: async () => { reihenfolge.push(['verdichte']) },
    chatte: async () => { reihenfolge.push(['chatte']) },
  }))
  // Direkt nach dem Aufruf (noch VOR dem ersten await-Tick) muss die Sperre bereits stehen --
  // das ist exakt die Eigenschaft, die einen doppelten teuren Chat-Lauf verhindert.
  assert.equal(sperreGesetztVorAwait, true, 'sperreSetzen(true) muss synchron laufen, bevor irgendein await beginnt')
  await versprechen
  assert.deepEqual(reihenfolge[0], ['sperre', true], 'Sperre muss vor verdichte()/chatte() gesetzt sein')
})

test('fuehreChatVorgangAus: zwei kollidierende Submits -> chatte (der teure Chat-Lauf) laeuft nur einmal', async () => {
  let sperre = false
  let chatteAufrufe = 0
  let verdichteFreigeben
  const verdichteWartet = new Promise(resolve => { verdichteFreigeben = resolve })

  const eingabe = () => chatVorgangEingabe({
    laeuftBereits: () => sperre, // wird bei jedem Aufruf FRISCH gelesen -- wie laufenderChatLauf in workspace.js
    sperreSetzen: wert => { sperre = wert },
    verdichte: () => verdichteWartet, // haengt wie ein echter runTask('zusammenfassung')-Aufruf
    chatte: async () => { chatteAufrufe += 1 },
  })

  // Zwei Submits kurz hintereinander: der erste laeuft synchron bis zu seinem eigenen await
  // (die Verdichtung) und setzt dabei die Sperre bereits.
  const ersterVersuch = fuehreChatVorgangAus(eingabe())
  const zweiterVersuch = fuehreChatVorgangAus(eingabe())
  verdichteFreigeben()
  const [ergebnis1, ergebnis2] = await Promise.all([ersterVersuch, zweiterVersuch])

  assert.equal(chatteAufrufe, 1, 'chatte (runTask(\'chat\', …)) darf bei Kollision nur einmal laufen -- sonst doppelte Kosten')
  const gestartete = [ergebnis1, ergebnis2].filter(e => e.gestartet)
  const geblockte = [ergebnis1, ergebnis2].filter(e => !e.gestartet)
  assert.equal(gestartete.length, 1, 'genau ein Submit darf durchlaufen')
  assert.equal(geblockte.length, 1, 'der andere muss sofort mit gestartet:false zurueckkommen')
  assert.deepEqual(geblockte[0], { gestartet: false })
})

test('fuehreChatVorgangAus: Sperre wird in JEDEM Pfad zurueckgesetzt (Erfolg, Fehler in chatte, Fehler in verdichte)', async () => {
  const sperrenVerlauf = []
  const sperreSetzen = wert => sperrenVerlauf.push(wert)

  await fuehreChatVorgangAus(chatVorgangEingabe({ sperreSetzen }))
  await fuehreChatVorgangAus(chatVorgangEingabe({ sperreSetzen, chatte: async () => { throw { typ: 'ueberlastet' } } }))
  await fuehreChatVorgangAus(chatVorgangEingabe({ sperreSetzen, verdichte: async () => { throw new Error('kaputt') } }))

  assert.deepEqual(sperrenVerlauf, [true, false, true, false, true, false], 'jeder Vorgang muss die Sperre setzen und wieder loesen')
})

// Task 6 (Chat-Kanal durchs Tor): fuehreChatVorgangAus reichte den Rueckgabewert von
// chatte() bisher NICHT durch (der try-Block endete immer mit dem festen { gestartet: true }).
// Das Lauf-Tor (lauf-tor.mjs) liest genau dieses laufFn-Ergebnis, um im Journal zwischen
// 'geliefert' und 'fehler' zu unterscheiden (bewerteLaufErgebnis prueft ergebnis.erfolg ===
// false) -- chatte() (in workspace.js: fuehreChatLauf) faengt Chat-Fehler intern ab und
// kehrt normal (nicht werfend) mit { erfolg: false, fehler } zurueck. Ohne Durchreichen saehe
// das Tor JEDEN Chat-Lauf als 'geliefert', auch einen, der an einem Gateway-Fehler scheiterte.
test('fuehreChatVorgangAus reicht ein Fehlschlag-Ergebnis von chatte() durch', async () => {
  const ergebnis = await fuehreChatVorgangAus(chatVorgangEingabe({
    chatte: async () => ({ erfolg: false, fehler: 'schema' }),
  }))
  assert.deepEqual(ergebnis, { gestartet: true, erfolg: false, fehler: 'schema' })
})

test('fuehreChatVorgangAus bleibt bei { gestartet: true }, wenn chatte() nichts zurueckgibt', async () => {
  const ergebnis = await fuehreChatVorgangAus(chatVorgangEingabe({
    chatte: async () => {},
  }))
  assert.deepEqual(ergebnis, { gestartet: true })
})

test('fuehreChatVorgangAus: bereits laufender Vorgang blockiert sofort, ohne Sperre/Status/Callbacks anzufassen', async () => {
  let sperreAufrufe = 0
  let statusAufrufe = 0
  let verdichteAufrufe = 0
  let chatteAufrufe = 0
  const ergebnis = await fuehreChatVorgangAus({
    laeuftBereits: () => true,
    sperreSetzen: () => { sperreAufrufe += 1 },
    setzeStatus: () => { statusAufrufe += 1 },
    verdichte: async () => { verdichteAufrufe += 1 },
    chatte: async () => { chatteAufrufe += 1 },
  })
  assert.deepEqual(ergebnis, { gestartet: false })
  assert.equal(sperreAufrufe, 0, 'ein bereits blockierter Vorgang darf die Sperre nicht anfassen')
  assert.equal(statusAufrufe, 0)
  assert.equal(verdichteAufrufe, 0)
  assert.equal(chatteAufrufe, 0)
})

test('fuehreChatVorgangAus: setzt "laeuft" vor dem Vorgang, ueberlaesst "bereit" bewusst chatte selbst', async () => {
  const statusVerlauf = []
  await fuehreChatVorgangAus(chatVorgangEingabe({
    setzeStatus: s => statusVerlauf.push(s.zustand),
  }))
  // KEIN 'bereit' hier: chatte() (in workspace.js: fuehreChatLauf) setzt es nach dem echten
  // runTask('chat', …)-Ergebnis selbst. Wuerde fuehreChatVorgangAus zusaetzlich 'bereit'
  // setzen, wuerde es einen von chatte bereits korrekt gesetzten 'fehler'-Zustand
  // ueberschreiben (chatte faengt Chat-Fehler intern ab und kehrt normal zurueck).
  assert.deepEqual(statusVerlauf, ['laeuft'])
})

test('fuehreChatVorgangAus: setzt Status fehler, wenn chatte/verdichte selbst wirft (Sicherheitsnetz)', async () => {
  const statusVerlauf = []
  const ergebnis = await fuehreChatVorgangAus(chatVorgangEingabe({
    setzeStatus: s => statusVerlauf.push([s.zustand, s.fehlerTyp]),
    chatte: async () => { throw { typ: 'ueberlastet' } },
  }))
  assert.deepEqual(statusVerlauf, [['laeuft', undefined], ['fehler', 'ueberlastet']])
  // Branch-Review-Nacharbeit (Finding 4): das Sicherheitsnetz trug den Fehlertyp bisher nicht
  // im Rueckgabewert -- ein geworfener Fehler aus chatte()/verdichte() waere im Lauf-Tor-Journal
  // (bewerteLaufErgebnis liest ergebnis.fehler) als 'unbekannt' gelandet statt als 'ueberlastet'.
  assert.deepEqual(ergebnis, { gestartet: true, erfolg: false, fehler: 'ueberlastet' })
})

// Branch-Review-Nacharbeit (Finding 4): eigener Test je Fehlertyp reicht nicht aus, um zu
// beweisen, dass IRGENDEIN geworfener typ durchgereicht wird und nicht nur zufaellig
// 'ueberlastet' -- 'offline' als zweiter, unabhaengiger Beleg.
test('fuehreChatVorgangAus: ein geworfenes { typ: "offline" } aus chatte() traegt fehler: "offline" im Ergebnis', async () => {
  const ergebnis = await fuehreChatVorgangAus(chatVorgangEingabe({
    chatte: async () => { throw { typ: 'offline' } },
  }))
  assert.deepEqual(ergebnis, { gestartet: true, erfolg: false, fehler: 'offline' })
})

// Fix-Runde 2, Finding 6 (hochgestuft): sperreSetzen(true) stand vorher AUSSERHALB von
// try/finally. sperreSetzen loest refreshWorkspace() aus (DOM-Arbeit) -- wirft die dabei (oder
// die anschliessende "laeuft"-Statusmeldung, die denselben Render-Pfad anstoesst), blieb die
// Sperre fuer immer gesetzt: der Senden-Knopf war bis zum Neustart tot. Diese beiden Tests
// nageln fest, dass sperreSetzen(false) in JEDEM Fall versucht wird -- auch wenn sperreSetzen
// selbst oder das Rendern (hier: setzeStatus) beim Start wirft.

test('fuehreChatVorgangAus: wirft sperreSetzen(true) selbst -> die Sperre bleibt nicht haengen', async () => {
  const aufrufe = []
  await assert.rejects(fuehreChatVorgangAus(chatVorgangEingabe({
    sperreSetzen: wert => { aufrufe.push(wert); throw new Error('refreshWorkspace kaputt') },
  })))
  assert.deepEqual(aufrufe, [true, false], 'finally muss sperreSetzen(false) versuchen, auch wenn sperreSetzen(true) bereits geworfen hat')
})

test('fuehreChatVorgangAus: wirft das Rendern (setzeStatus) beim Start -> die Sperre bleibt nicht haengen', async () => {
  const sperrenVerlauf = []
  await assert.rejects(fuehreChatVorgangAus(chatVorgangEingabe({
    sperreSetzen: wert => sperrenVerlauf.push(wert),
    setzeStatus: () => { throw new Error('refreshWorkspace kaputt') },
  })))
  assert.deepEqual(sperrenVerlauf, [true, false], 'Sperre muss trotz durchgehend werfendem setzeStatus wieder geloest werden')
})

test('fuehreChatVorgangAus: ein einmaliger Wurf beim Setzen der Sperre (true) wird als Sicherheitsnetz abgefangen, die Sperre bleibt danach frei', async () => {
  let sperre = false
  const sperreSetzen = wert => { sperre = wert; if (wert === true) throw new Error('refreshWorkspace kaputt') }
  const ergebnis = await fuehreChatVorgangAus(chatVorgangEingabe({
    laeuftBereits: () => sperre,
    sperreSetzen,
  }))
  // fehler: undefined explizit erwartet (Finding 4): der geworfene Fehler ist hier ein blankes
  // Error-Objekt ohne .typ, also ist fehler?.typ undefined -- die Eigenschaft EXISTIERT trotzdem
  // im Rueckgabeobjekt (fehler: fehler?.typ), und deepEqual (node:assert/strict, also
  // deepStrictEqual) unterscheidet "Schluessel fehlt" von "Schluessel mit Wert undefined".
  assert.deepEqual(
    ergebnis,
    { gestartet: true, erfolg: false, fehler: undefined },
    'catch faengt den Wurf aus sperreSetzen(true) als Sicherheitsnetz ab',
  )
  assert.equal(sperre, false, 'die Sperre muss danach wieder frei sein -- ein Folge-Vorgang darf nicht faelschlich blockiert bleiben')
})
