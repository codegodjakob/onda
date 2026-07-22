import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_SETTINGS, ACCENTS, normalizeSettings } from '../src/settings-model.mjs'

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
