import test from 'node:test'
import assert from 'node:assert/strict'
import { baueBausteinKontext, ANRISS_ZEICHEN } from '../src/bausteinarten-kontext.mjs'
import { BAUSTEINARTEN_ANWEISUNG } from '../src/agent-prompts.mjs'
import { baueAnfrage } from '../src/agent-tasks.mjs'
import { updateLanguageProfile } from '../src/language-profile.mjs'

const BLOCKS = [
  { id: 'b1', type: 'paragraph', role: 'paragraph', text: 'Die tragende Aussage.' },
  { id: 'h1', type: 'heading', role: 'heading', text: 'Ein Titel' },
  { id: 'b2', type: 'paragraph', role: 'paragraph', text: '   ' },
]

test('der Auftrag steht an erster Stelle der volatilen Bloecke', () => {
  const kontext = baueBausteinKontext({ docText: 'Text', blocks: BLOCKS })
  assert.equal(kontext.volatiles[0], BAUSTEINARTEN_ANWEISUNG)
})

test('das Absatzverzeichnis nennt nur benennbare Absaetze, mit Kennung und Anriss', () => {
  const kontext = baueBausteinKontext({ docText: 'Text', blocks: BLOCKS })
  const verzeichnis = kontext.volatiles.find(block => block.startsWith('Absätze:'))
  assert.ok(verzeichnis, 'kein Absatzverzeichnis im Kontext')
  assert.match(verzeichnis, /b1/)
  assert.doesNotMatch(verzeichnis, /h1/)
  assert.doesNotMatch(verzeichnis, /b2/)
})

test('ein vorhandener Bestand reist als bisheriger Stand mit', () => {
  const bestand = {
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Wendung', beschreibung: 'Dreht den Gedanken.', funktion: 'transition' }],
    zuordnung: { b1: { artId: 'art-1', zeichen: 5 } },
    laufSignatur: 'b1',
    standAt: 1,
  }
  const kontext = baueBausteinKontext({ docText: 'Text', blocks: BLOCKS, bestand })
  const stand = kontext.volatiles.find(block => block.startsWith('Bisher erkannt:'))
  assert.ok(stand)
  assert.match(stand, /Wendung/)
  assert.match(stand, /Essay/)
})

test('ohne Bestand entsteht kein Stand-Block', () => {
  const kontext = baueBausteinKontext({ docText: 'Text', blocks: BLOCKS })
  assert.equal(kontext.volatiles.some(block => block.startsWith('Bisher erkannt:')), false)
})

test('das Verzeichnis nennt NUR die offenen Absaetze', () => {
  const blocks = [
    { id: 'b1', type: 'paragraph', role: 'paragraph', text: 'Schon benannt.' },
    { id: 'b2', type: 'paragraph', role: 'paragraph', text: 'Frisch dazugekommen.' },
  ]
  const kontext = baueBausteinKontext({ docText: 'Text', blocks, offene: ['b2'] })
  const verzeichnis = kontext.volatiles.find(block => block.startsWith('Absätze:'))
  assert.match(verzeichnis, /b2/)
  assert.doesNotMatch(verzeichnis, /b1/, 'ein bereits benannter Absatz beschäftigt das Modell erneut')
})

test('ohne offene-Liste stehen alle benennbaren Absaetze drin', () => {
  const kontext = baueBausteinKontext({ docText: 'Text', blocks: BLOCKS, offene: null })
  const verzeichnis = kontext.volatiles.find(block => block.startsWith('Absätze:'))
  assert.match(verzeichnis, /b1/)
})

test('ein langer Absatz wird auf ANRISS_ZEICHEN Zeichen gekuerzt', () => {
  const langText = 'a'.repeat(200)
  const blocks = [
    { id: 'b1', type: 'paragraph', role: 'paragraph', text: langText },
  ]
  const kontext = baueBausteinKontext({ docText: 'Text', blocks })
  const verzeichnis = kontext.volatiles.find(block => block.startsWith('Absätze:'))
  assert.ok(verzeichnis)
  const verzeichnisObj = JSON.parse(verzeichnis.slice('Absätze: '.length))
  assert.equal(verzeichnisObj[0].anriss.length, ANRISS_ZEICHEN, `erwartet ${ANRISS_ZEICHEN} Zeichen, aber ${verzeichnisObj[0].anriss.length} gefunden`)
})

test('baueAnfrage nimmt diesen Kontext ohne Verlust an', () => {
  const kontext = baueBausteinKontext({ verstaendnis: { thema: 'x' }, docText: 'Text', blocks: BLOCKS })
  const anfrage = baueAnfrage('bausteinarten', kontext)
  const texte = anfrage.body.messages[0].content.map(block => block.text)
  assert.ok(texte.some(text => text.includes(BAUSTEINARTEN_ANWEISUNG)))
  assert.ok(texte.some(text => text.includes('<dokument>Text</dokument>')))
})

// Der Anschluss ans Projektwissen. Dieser Kanal entstand, bevor die Regel galt, und war
// beim Einsammeln (#33) ein BLINDER Kanal: er baute eine Anfrage, ohne Textsorte,
// Aussagen-Speicher, Gedaechtnis oder Erkanntes anzuhaengen. Gemeldet hat es nicht ein
// Unit-Test, sondern die Eigenschafts-Pruefung ueber alle Kanaele (KONTEXT-01, baulich) —
// dieselbe Lehre wie beim Quellen-Kanal. Ab hier haelt es auch ein Test hier fest.
//
// Fixture aus der ECHTEN Quelle (updateLanguageProfile), nicht handgeschrieben: sonst
// bliebe diese Pruefung gruen, waehrend die echte Datenform daneben weiterlaeuft.
test('das Projektwissen erreicht den Kanal — und steht ganz hinten', () => {
  const project = {
    id: 'projekt-baustein',
    languageProfile: updateLanguageProfile({
      profile: null,
      projectId: 'projekt-baustein',
      changes: { genre: 'scientific', domain: 'MARKANTES-FACH-4e8b' },
      at: 1000,
    }),
  }
  const ohne = baueBausteinKontext({ docText: 'Text', blocks: BLOCKS })
  const mit = baueBausteinKontext({ docText: 'Text', blocks: BLOCKS, onda: { project, doc: { id: 'doc-1' } } })

  assert.ok(mit.volatiles.length > ohne.volatiles.length, 'ohne Wissensblock waere dies ein blinder Kanal')
  assert.ok(mit.volatiles.some(block => /MARKANTES-FACH-4e8b/.test(block)), 'die Textsorte erreicht das Modell nicht')
  // Reihenfolge: Auftrag und Absatzverzeichnis bleiben vorn, das Wissen kommt dahinter.
  assert.deepEqual(mit.volatiles.slice(0, ohne.volatiles.length), ohne.volatiles)
})

// Regel 3 aus onda-kontext.mjs gilt auch hier: ohne Wissen entsteht GAR KEIN Block —
// nicht einer, auch kein leerer und kein "unbekannt".
test('ohne Projektwissen entsteht kein leerer Wissensblock', () => {
  const leer = baueBausteinKontext({ docText: 'Text', blocks: BLOCKS, onda: { project: { id: 'projekt-leer' } } })
  const ohne = baueBausteinKontext({ docText: 'Text', blocks: BLOCKS })
  assert.deepEqual(leer.volatiles, ohne.volatiles)
})
