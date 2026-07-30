import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ACCENTS,
  DEFAULT_SETTINGS,
  aktuellerMonat,
  beansprucheAutomatiklauf,
  budgetStand,
  gibNaechstenAutomatiklaufFrei,
  leereUsage,
  normalizeSettings,
  verbucheUsage,
} from '../src/settings-model.mjs'

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

test('Monatsbudget: positive Cent-Betraege bleiben erhalten, Muell bedeutet keine lokale Grenze', () => {
  assert.equal(normalizeSettings({ kiMonatsbudgetCents: 1250 }, '2026-07').kiMonatsbudgetCents, 1250)
  assert.equal(normalizeSettings({ kiMonatsbudgetCents: '2500' }, '2026-07').kiMonatsbudgetCents, 2500)
  for (const wert of [0, -1, 'quatsch', Number.POSITIVE_INFINITY, null]) {
    assert.equal(normalizeSettings({ kiMonatsbudgetCents: wert }, '2026-07').kiMonatsbudgetCents, null)
  }
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

test('Monatsbudget: ohne konfigurierte Grenze bleibt Automatik unveraendert erlaubt', () => {
  const settings = normalizeSettings({
    usage: { monat: '2026-07', kostenCents: 999999 },
  }, '2026-07')
  assert.deepEqual(beansprucheAutomatiklauf(settings, '2026-07'), {
    erlaubt: true,
    grund: 'kein-budget',
    freigabeVerbraucht: false,
  })
})
