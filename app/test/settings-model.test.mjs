import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ACCENTS,
  DEFAULT_KI_MONATSBUDGET_CENTS,
  DEFAULT_SETTINGS,
  aktuellerMonat,
  beansprucheAutomatiklauf,
  budgetStand,
  gibNaechstenAutomatiklaufFrei,
  leereUsage,
  normalizeSettings,
  verbucheUsage,
} from '../src/settings-model.mjs'
import { HISTORIE_DECKEL } from '../src/lauf-bilanz.mjs'

test('defaults: accent sky, sidebar not collapsed, existing fields intact', () => {
  const s = normalizeSettings(undefined)
  assert.equal(s.accent, 'sky')
  assert.equal(s.sidebarCollapsed, false)
  assert.equal(s.theme, DEFAULT_SETTINGS.theme)
  assert.equal(s.spellcheck, false)
})

test('known accents pass through; unknown/garbage fall back to sky', () => {
  for (const a of ACCENTS) assert.equal(normalizeSettings({ accent: a }).accent, a)
  assert.equal(normalizeSettings({ accent: 'neon' }).accent, 'sky')
  assert.equal(normalizeSettings({ accent: 42 }).accent, 'sky')
})

test('sidebarCollapsed is coerced to a boolean', () => {
  assert.equal(normalizeSettings({ sidebarCollapsed: true }).sidebarCollapsed, true)
  assert.equal(normalizeSettings({ sidebarCollapsed: 1 }).sidebarCollapsed, true)
  assert.equal(normalizeSettings({ sidebarCollapsed: 0 }).sidebarCollapsed, false)
  assert.equal(normalizeSettings({}).sidebarCollapsed, false)
})

test('tolerant load keeps other fields and clamps structWidth like before', () => {
  const s = normalizeSettings({ theme: 'dark', spellcheck: true, structWidth: 5000, keepMe: 7 })
  assert.equal(s.theme, 'dark')
  assert.equal(s.spellcheck, true)
  assert.equal(s.structWidth, 940)
  assert.equal(s.keepMe, 7)
  assert.equal(normalizeSettings({ structWidth: 10 }).structWidth, 360)
  assert.equal(normalizeSettings({ structWidth: 'x' }).structWidth, 560)
})

test('non-object input never throws and yields safe defaults', () => {
  assert.equal(normalizeSettings(null).accent, 'sky')
  assert.equal(normalizeSettings('nope').accent, 'sky')
  assert.equal(normalizeSettings(123).sidebarCollapsed, false)
})

test('usage: fehlt oder kaputt -> leerer Monatszaehler, bestehende Felder unberuehrt', () => {
  const s = normalizeSettings({}, '2026-07')
  assert.deepEqual(s.usage, {
    monat: '2026-07', inputTokens: 0, outputTokens: 0,
    cacheReadTokens: 0, cacheWriteTokens: 0, kostenCents: 0,
  })
  assert.equal(s.accent, 'sky')
  const kaputt = normalizeSettings({ usage: { monat: 42, inputTokens: 'x' } }, '2026-07')
  assert.equal(kaputt.usage.inputTokens, 0)
  assert.equal(kaputt.usage.monat, '2026-07')
})

test('usage: gespeicherte Werte desselben Monats bleiben erhalten', () => {
  const s = normalizeSettings({
    usage: { monat: '2026-07', inputTokens: 12, outputTokens: 3, cacheReadTokens: 4, cacheWriteTokens: 5, kostenCents: 6.5 },
  }, '2026-07')
  assert.equal(s.usage.inputTokens, 12)
  assert.equal(s.usage.cacheWriteTokens, 5)
  assert.equal(s.usage.kostenCents, 6.5)
})

test('usage: Monatswechsel setzt den Zaehler zurueck', () => {
  const s = normalizeSettings({ usage: { monat: '2026-06', inputTokens: 999, kostenCents: 50 } }, '2026-07')
  assert.deepEqual(s.usage, leereUsage('2026-07'))
})

test('verbucheUsage addiert API-Zahlen und Kosten und resettet bei Monatswechsel', () => {
  const s = normalizeSettings({}, '2026-07')
  verbucheUsage(s, {
    input_tokens: 100, output_tokens: 20,
    cache_read_input_tokens: 50, cache_creation_input_tokens: 10,
  }, 1.25, '2026-07')
  verbucheUsage(s, { input_tokens: 1 }, 0.05, '2026-07')
  assert.equal(s.usage.inputTokens, 101)
  assert.equal(s.usage.outputTokens, 20)
  assert.equal(s.usage.cacheReadTokens, 50)
  assert.equal(s.usage.cacheWriteTokens, 10)
  assert.ok(Math.abs(s.usage.kostenCents - 1.3) < 1e-9)
  verbucheUsage(s, { input_tokens: 7 }, 0.01, '2026-08')
  assert.equal(s.usage.monat, '2026-08')
  assert.equal(s.usage.inputTokens, 7)
  assert.ok(Math.abs(s.usage.kostenCents - 0.01) < 1e-9)
})

test('aktuellerMonat liefert JJJJ-MM und verbucheUsage wirft nie bei Muell', () => {
  assert.match(aktuellerMonat(), /^\d{4}-\d{2}$/)
  assert.equal(aktuellerMonat(new Date(2026, 6, 26)), '2026-07')
  const s = normalizeSettings({}, '2026-07')
  verbucheUsage(s, undefined, 'quatsch', '2026-07')
  assert.equal(s.usage.inputTokens, 0)
  assert.equal(s.usage.kostenCents, 0)
})

test('Monatsbudget: positive Cent-Betraege bleiben erhalten', () => {
  assert.equal(normalizeSettings({ kiMonatsbudgetCents: 1250 }, '2026-07').kiMonatsbudgetCents, 1250)
  assert.equal(normalizeSettings({ kiMonatsbudgetCents: '2500' }, '2026-07').kiMonatsbudgetCents, 2500)
})

test('Monatsbudget: nie gesetzt bekommt die Voreinstellung, bewusst abgeschaltet bleibt abgeschaltet', () => {
  // Der Unterschied traegt: 'undefined' heisst nie gesetzt, 'null' heisst
  // absichtlich entfernt. Wer die Bremse geloest hat, bekommt sie nicht
  // beim naechsten Start wieder untergeschoben.
  assert.equal(
    normalizeSettings({}, '2026-07').kiMonatsbudgetCents,
    DEFAULT_KI_MONATSBUDGET_CENTS,
    'ohne Eintrag greift die Voreinstellung',
  )
  assert.equal(
    normalizeSettings({ kiMonatsbudgetCents: null }, '2026-07').kiMonatsbudgetCents,
    null,
    'ausdruecklich abgeschaltet bleibt abgeschaltet',
  )
})

test('Monatsbudget: kaputte Werte fallen auf die Voreinstellung, nicht ins Bodenlose', () => {
  // Ein negativer Betrag oder Muell ist Beschaedigung, keine Absicht. Daraus
  // stillschweigend 'keine Grenze' zu machen, waere die gefaehrlichste Auslegung.
  for (const wert of [0, -1, 'quatsch', Number.POSITIVE_INFINITY, Number.NaN]) {
    assert.equal(
      normalizeSettings({ kiMonatsbudgetCents: wert }, '2026-07').kiMonatsbudgetCents,
      DEFAULT_KI_MONATSBUDGET_CENTS,
      `kaputter Wert ${String(wert)} faellt auf die Voreinstellung`,
    )
  }
})

test('Monatsbudget: eine bewusst geloeste Bremse bleibt geloest, auch bei hohem Verbrauch', () => {
  // Diese Zusicherung stand frueher unter 'ohne konfigurierte Grenze bleibt Automatik
  // unveraendert erlaubt'. Mit der Voreinstellung hat sie ihren Fall gewechselt: nicht
  // mehr 'kein Eintrag', sondern 'ausdruecklich auf null gesetzt'. Der Test wurde beim
  // Einbau der Voreinstellung geloescht statt umgeschrieben — die Zusicherung war
  // seither ungeschuetzt. Sie zaehlt: Wer die Bremse loest, tut das absichtlich und
  // darf sie nicht durch die Hintertuer zurueckbekommen.
  const settings = normalizeSettings({
    kiMonatsbudgetCents: null,
    usage: { monat: '2026-07', kostenCents: 999999 },
  }, '2026-07')
  assert.equal(settings.kiMonatsbudgetCents, null, 'null ueberlebt die Normalisierung')
  assert.deepEqual(beansprucheAutomatiklauf(settings, '2026-07'), {
    erlaubt: true,
    grund: 'kein-budget',
    freigabeVerbraucht: false,
  })
})

test('Monatsbudget: unter der Grenze darf Automatik laufen, an und ueber der Grenze nicht', () => {
  const settings = normalizeSettings({
    kiMonatsbudgetCents: 500,
    usage: { monat: '2026-07', kostenCents: 499 },
  }, '2026-07')
  assert.deepEqual(beansprucheAutomatiklauf(settings, '2026-07'), {
    erlaubt: true,
    grund: 'unter-budget',
    freigabeVerbraucht: false,
  })
  settings.usage.kostenCents = 500
  assert.deepEqual(beansprucheAutomatiklauf(settings, '2026-07'), {
    erlaubt: false,
    grund: 'monatsbudget-erreicht',
    freigabeVerbraucht: false,
  })
  settings.usage.kostenCents = 900
  assert.equal(budgetStand(settings, '2026-07').erreicht, true)
})

test('Monatsbudget: bewusste Freigabe erlaubt genau einen automatischen Lauf', () => {
  const settings = normalizeSettings({
    kiMonatsbudgetCents: 500,
    usage: { monat: '2026-07', kostenCents: 600 },
  }, '2026-07')
  gibNaechstenAutomatiklaufFrei(settings, '2026-07')
  assert.equal(budgetStand(settings, '2026-07').freigaben, 1)
  assert.deepEqual(beansprucheAutomatiklauf(settings, '2026-07'), {
    erlaubt: true,
    grund: 'einmal-freigegeben',
    freigabeVerbraucht: true,
  })
  assert.equal(budgetStand(settings, '2026-07').freigaben, 0)
  assert.equal(beansprucheAutomatiklauf(settings, '2026-07').erlaubt, false)
})

test('Monatsbudget: Freigaben gelten nie ueber einen Monatswechsel hinaus', () => {
  const settings = normalizeSettings({
    kiMonatsbudgetCents: 500,
    automatikFreigabe: { monat: '2026-06', verbleibend: 1 },
    usage: { monat: '2026-07', kostenCents: 600 },
  }, '2026-07')
  assert.deepEqual(settings.automatikFreigabe, { monat: '2026-07', verbleibend: 0 })
  assert.equal(beansprucheAutomatiklauf(settings, '2026-07').erlaubt, false)
})

test('Monatsbudget: wer die Grenze abgeschaltet hat, laesst Automatik unbegrenzt laufen', () => {
  // Ausdruecklich abgeschaltet (null) — nicht: nie gesetzt. Seit es eine
  // Voreinstellung gibt, ist das der einzige Weg zu 'kein-budget'.
  const settings = normalizeSettings({
    kiMonatsbudgetCents: null,
    usage: { monat: '2026-07', kostenCents: 999999 },
  }, '2026-07')
  assert.deepEqual(beansprucheAutomatiklauf(settings, '2026-07'), {
    erlaubt: true,
    grund: 'kein-budget',
    freigabeVerbraucht: false,
  })
})

test('Monatsbudget: frische Einstellungen bremsen Automatik, sobald die Voreinstellung erreicht ist', () => {
  // Der eigentliche Zweck der Aenderung: wer nie etwas gesetzt hat, faehrt
  // nicht mehr ungebremst. Gemessen wurden 3,90-22,87 $ je Schreibstunde.
  const settings = normalizeSettings({
    usage: { monat: '2026-07', kostenCents: DEFAULT_KI_MONATSBUDGET_CENTS },
  }, '2026-07')
  const ergebnis = beansprucheAutomatiklauf(settings, '2026-07')
  assert.equal(ergebnis.erlaubt, false, 'an der Voreinstellung ist Schluss')
  assert.notEqual(ergebnis.grund, 'kein-budget', 'es gibt jetzt ein Budget')
})

// Monatsgrenze bei 2026-07 aus Sicht der monatVor()-Faelle unten: monatVor(1) == '2026-06',
// monatVor(2) == '2026-05' usw. Hilfsfunktion, weil Monatsstrings nicht einfach hochzaehlen
// (nach '2026-01' kommt '2025-12', kein '2026-00').
function monatVor(n) {
  const datum = new Date(2026, 6 - n, 1)
  return `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}`
}

test('usageHistorie (a): verbucheUsage archiviert den alten nicht-leeren Monat und beginnt frisch', () => {
  const s = normalizeSettings({}, '2026-07')
  verbucheUsage(s, { input_tokens: 100 }, 1.25, '2026-07')
  assert.deepEqual(s.usageHistorie, [], 'noch kein Wechsel, noch keine Historie')
  verbucheUsage(s, { input_tokens: 7 }, 0.01, '2026-08')
  assert.equal(s.usage.monat, '2026-08')
  assert.equal(s.usage.inputTokens, 7, 'der neue Monat beginnt frisch bei null')
  assert.equal(s.usageHistorie.length, 1)
  assert.equal(s.usageHistorie[0].monat, '2026-07')
  assert.equal(s.usageHistorie[0].inputTokens, 100)
  assert.ok(Math.abs(s.usageHistorie[0].kostenCents - 1.25) < 1e-9)
})

test('usageHistorie (b): normalizeSettings archiviert einen Vormonats-Stand aus dem Rohzustand', () => {
  const s = normalizeSettings({
    usage: { monat: '2026-06', inputTokens: 50, outputTokens: 8, kostenCents: 3 },
  }, '2026-07')
  assert.deepEqual(s.usage, leereUsage('2026-07'), 'der Zaehler beginnt frisch')
  assert.equal(s.usageHistorie.length, 1)
  assert.equal(s.usageHistorie[0].monat, '2026-06')
  assert.equal(s.usageHistorie[0].inputTokens, 50)
  assert.equal(s.usageHistorie[0].outputTokens, 8)
  assert.equal(s.usageHistorie[0].kostenCents, 3)
})

test('usageHistorie (c): derselbe Monat landet nie zweimal, egal ob beim Buchen oder beim Laden bemerkt', () => {
  // Buchen bemerkt den Wechsel zuerst und archiviert Juni.
  const gebucht = normalizeSettings({}, '2026-06')
  verbucheUsage(gebucht, { input_tokens: 40 }, 2, '2026-06')
  verbucheUsage(gebucht, { input_tokens: 1 }, 0.01, '2026-07')
  assert.equal(gebucht.usageHistorie.length, 1)
  assert.equal(gebucht.usageHistorie[0].monat, '2026-06')

  // Ein veralteter Speicherstand zeigt usage noch auf Juni, obwohl usageHistorie Juni
  // (aus dem Buchen-Pfad oben) schon enthaelt. normalizeSettings (der Lade-Pfad) darf
  // Juni deshalb kein zweites Mal anhaengen.
  const raw = {
    usage: { monat: '2026-06', inputTokens: 40, kostenCents: 2 },
    usageHistorie: gebucht.usageHistorie,
  }
  const geladen = normalizeSettings(raw, '2026-07')
  assert.equal(geladen.usageHistorie.length, 1, 'Juni darf nicht doppelt in der Historie stehen')
  assert.equal(geladen.usageHistorie[0].monat, '2026-06')
})

test('usageHistorie (d): ein leerer Monat wird nicht archiviert', () => {
  // Buchen-Pfad: der Julimonat bleibt bei lauter Nullen, der Wechsel nach August
  // darf trotzdem keinen leeren Eintrag anhaengen.
  const s = normalizeSettings({}, '2026-07')
  verbucheUsage(s, {}, 0, '2026-08')
  assert.deepEqual(s.usageHistorie, [])
  assert.equal(s.usage.monat, '2026-08')

  // Lade-Pfad: ein leerer Vormonat im Rohzustand wandert ebenfalls nicht in die Historie.
  const s2 = normalizeSettings({ usage: leereUsage('2026-06') }, '2026-07')
  assert.deepEqual(s2.usageHistorie, [])
})

test('usageHistorie (e): der Deckel haelt bei HISTORIE_DECKEL, der aelteste Eintrag fliegt', () => {
  // HISTORIE_DECKEL bereits volle, nicht-leere Vormonate, aeltester zuerst.
  const volleHistorie = []
  for (let i = HISTORIE_DECKEL; i >= 1; i--) {
    volleHistorie.push({ ...leereUsage(monatVor(i + 1)), inputTokens: i })
  }
  const raw = {
    usageHistorie: volleHistorie,
    usage: { monat: monatVor(1), inputTokens: 5, kostenCents: 1 },
  }
  const s = normalizeSettings(raw, '2026-07')
  assert.equal(s.usageHistorie.length, HISTORIE_DECKEL, '25 Monate werden auf den Deckel gekappt')
  assert.equal(
    s.usageHistorie.some(e => e.monat === monatVor(HISTORIE_DECKEL + 1)),
    false,
    'der urspruenglich aelteste Monat ist rausgeflogen',
  )
  assert.equal(
    s.usageHistorie[s.usageHistorie.length - 1].monat,
    monatVor(1),
    'der frisch archivierte Monat steht als juengster ganz hinten',
  )
})

test('usageHistorie (f): kaputte Rohdaten werden bereinigt, nie geworfen', () => {
  assert.doesNotThrow(() => normalizeSettings({ usageHistorie: 'nicht-array' }, '2026-07'))
  assert.deepEqual(normalizeSettings({ usageHistorie: 'nicht-array' }, '2026-07').usageHistorie, [])
  assert.deepEqual(normalizeSettings({ usageHistorie: null }, '2026-07').usageHistorie, [])
  assert.doesNotThrow(() =>
    normalizeSettings({ usageHistorie: [null, 42, 'x', {}, { monat: 99 }] }, '2026-07'),
  )
  const s = normalizeSettings({
    usageHistorie: [
      null,
      42,
      'x',
      {},
      { monat: 99 },
      { monat: '2026-07', inputTokens: 5 }, // aktueller Monat: gehoert NICHT in die Historie
      { monat: '2026-06', inputTokens: 5, kostenCents: 1 },
    ],
  }, '2026-07')
  assert.equal(s.usageHistorie.length, 1, 'nur der gueltige Vormonats-Eintrag ueberlebt')
  assert.equal(s.usageHistorie[0].monat, '2026-06')
  assert.equal(s.usageHistorie[0].inputTokens, 5)
  assert.equal(s.usageHistorie[0].kostenCents, 1)
})
