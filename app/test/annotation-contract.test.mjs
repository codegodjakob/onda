import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ALL_ANNOTATION_KINDS,
  NOTE_ANNOTATION_KINDS,
  TEXT_ANNOTATION_KINDS,
  isAnnotationKindAllowed,
  kindInfo,
  normalizeAnnotationFinding,
  resolveAnnotationPresentation,
} from '../src/annotation-contract.mjs'

test('Onda kennt exakt 24 Text- und fünf Notizarten', () => {
  assert.equal(TEXT_ANNOTATION_KINDS.length, 24)
  assert.equal(NOTE_ANNOTATION_KINDS.length, 5)
  assert.equal(ALL_ANNOTATION_KINDS.length, 29)
  assert.equal(new Set(ALL_ANNOTATION_KINDS).size, 29)
  assert.equal(Object.isFrozen(TEXT_ANNOTATION_KINDS), true)
  assert.equal(Object.isFrozen(NOTE_ANNOTATION_KINDS), true)
})

test('jede Anmerkungsart besitzt einen vollständigen unveränderlichen Darstellungsvertrag', () => {
  for (const kind of ALL_ANNOTATION_KINDS) {
    const info = kindInfo(kind)
    assert.equal(info.kind, kind)
    assert.ok(info.label)
    assert.ok(['korrektur', 'stil', 'struktur', 'inhalt', 'notiz'].includes(info.category))
    assert.ok(['fehler', 'empfehlung', 'geschmack'].includes(info.priority))
    // 'card' ist am 07.08.2026 dazugekommen: die gewoehnliche Karte der Vorlage
    // (<Annotation> in components/annotation/Annotation.jsx) fuer Arten, die
    // KEINE Textoperation haben. "Roter Faden" stand vorher auf 'rewrite' —
    // einer Form, die einen Ersatztext verspricht, den es dort nicht gibt.
    assert.ok(['correction', 'rewrite', 'insertion', 'slot', 'region', 'source', 'compare', 'dialogue', 'title', 'card'].includes(info.form))
    assert.ok(info.scope)
    assert.equal(Object.isFrozen(info), true)
  }
})

test('die Natur des Hinweises bestimmt zehn unterschiedliche Darstellungsformen', () => {
  // Eine Form ohne Textoperation darf keine Form sein, die eine verspricht.
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'faden' }).form, 'card')
  assert.equal(kindInfo('faden').operation, null)
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'rechtschreibung' }).form, 'correction')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'satzstil' }).form, 'rewrite')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'uebergang' }).form, 'insertion')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'verschieben' }).form, 'slot')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'ton' }).form, 'region')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'beleg' }).form, 'source')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'widerspruch' }).form, 'compare')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'luecke' }).form, 'dialogue')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'ueberschrift' }).form, 'title')
})

test('Prioritäten entsprechen Fehler, Empfehlung und Geschmack aus der Referenz', () => {
  assert.equal(kindInfo('grammatik').priority, 'fehler')
  assert.equal(kindInfo('beleg').priority, 'fehler')
  assert.equal(kindInfo('satzstil').priority, 'empfehlung')
  assert.equal(kindInfo('faden').priority, 'empfehlung')
  assert.equal(kindInfo('wortwahl').priority, 'geschmack')
  assert.equal(kindInfo('ton').priority, 'geschmack')
})

test('Text- und Notizmodus lassen nur ihre eigenen Arten zu', () => {
  assert.equal(isAnnotationKindAllowed('text', 'rechtschreibung'), true)
  assert.equal(isAnnotationKindAllowed('text', 'nachfrage'), false)
  assert.equal(isAnnotationKindAllowed('notiz', 'nachfrage'), true)
  assert.equal(isAnnotationKindAllowed('notiz', 'rechtschreibung'), false)
  assert.equal(isAnnotationKindAllowed('kaputt', 'rechtschreibung'), true)
})

test('Legacy-Findings werden sicher normalisiert ohne das Original zu verändern', () => {
  const legacy = { id: 'alt', kiKategorie: 'sprache', target: 'sehr gut', action: 'überzeugend' }
  const normalized = normalizeAnnotationFinding(legacy)
  assert.equal(normalized.anmerkungsart, 'wortwahl')
  assert.equal(resolveAnnotationPresentation(normalized).priority, 'geschmack')
  assert.equal(legacy.anmerkungsart, undefined)
})

test('vorhandene genaue Art gewinnt und Stilmittel-Metadaten schlagen die grobe Kategorie', () => {
  assert.equal(normalizeAnnotationFinding({ anmerkungsart: 'beleg', kiKategorie: 'sprache' }).anmerkungsart, 'beleg')
  assert.equal(normalizeAnnotationFinding({ kiKategorie: 'sprache', stilmittelId: 'metapher' }).anmerkungsart, 'stilmittel')
})

test('unbekannte oder kaputte Findings fallen auf eine subjektive Anmerkung zurück', () => {
  const normalized = normalizeAnnotationFinding({ anmerkungsart: 'alarm', kategorie: 'unbekannt' })
  assert.equal(normalized.anmerkungsart, 'anmerkung')
  const presentation = resolveAnnotationPresentation(normalized)
  assert.equal(presentation.form, 'dialogue')
  assert.equal(presentation.priority, 'geschmack')
})
