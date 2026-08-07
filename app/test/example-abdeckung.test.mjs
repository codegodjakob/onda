// Der Beispieltext soll JEDEN Anwendungsfall zeigen — das war Jakobs dritter
// Auftrag: "mach einen beispieltext in dem jeder anwendungsfall vorkommt sodass
// ich testen kann".
//
// "Jeder Anwendungsfall" ist keine Meinung, sondern zaehlbar: 29
// Anmerkungsarten, zehn Darstellungsformen, drei Rangstufen, die
// Notizen-Betriebsart, die acht Hinweisarten und die drei Erweiterungsarten.
// Diese Pruefung zaehlt nach. Faellt eine Art aus dem Beispiel — weil jemand
// eine Anmerkung loescht oder eine neue Art hinzufuegt, ohne sie zu zeigen —
// wird sie rot und nennt genau die fehlende.
//
// Und sie prueft das, woran ein Beispiel sonst still zerfaellt: dass jeder
// Anker WOERTLICH im Text steht. Ein Anker, der nicht mehr passt, erzeugt keine
// Fehlermeldung im Programm — die Anmerkung erscheint einfach nicht mehr.

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ALL_ANNOTATION_KINDS,
  NOTE_ANNOTATION_KINDS,
  TEXT_ANNOTATION_KINDS,
  kindInfo,
} from '../src/annotation-contract.mjs'
import { ANKER_ANZAHL, ERWEITERUNGS_ARTEN, ensureErweiterungen } from '../src/erweiterung-model.mjs'
import {
  buildExampleBody,
  buildExampleCoach,
  buildExampleErweiterungen,
  buildExampleHinweisarten,
  buildExampleLane,
  buildExampleNotizen,
} from '../src/example.js'

const lane = buildExampleLane()
const arten = new Set(lane.map(eintrag => eintrag.anmerkungsart).filter(Boolean))

// Der reine Text beider Fassungen, so wie ihn der Editor sieht: Marken raus,
// Absaetze zu Leerzeichen. Der Anker steht im Fliesstext, nicht im HTML.
function nurText(html) {
  return String(html)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

const TEXT = nurText(buildExampleBody())
const NOTIZEN = nurText(buildExampleNotizen())

test('jede der 29 Anmerkungsarten kommt im Beispiel vor', () => {
  const fehlend = ALL_ANNOTATION_KINDS.filter(art => !arten.has(art))
  assert.deepEqual(fehlend, [],
    `Diese Arten fehlen im Beispieltext: ${fehlend.join(', ')}. `
    + 'Jakob soll jeden Anwendungsfall durchklicken koennen — eine Art ohne Beispiel '
    + 'kann er nicht pruefen.')
  assert.equal(ALL_ANNOTATION_KINDS.length, 29)
})

test('keine Art kommt doppelt vor — sonst verdeckt die eine die andere', () => {
  const gezaehlt = new Map()
  lane.forEach(eintrag => gezaehlt.set(eintrag.anmerkungsart, (gezaehlt.get(eintrag.anmerkungsart) || 0) + 1))
  const doppelt = [...gezaehlt].filter(([, anzahl]) => anzahl > 1).map(([art]) => art)
  assert.deepEqual(doppelt, [], `doppelt im Beispiel: ${doppelt.join(', ')}`)
})

test('jede der zehn Darstellungsformen ist vertreten', () => {
  const formen = new Set([...arten].map(art => kindInfo(art).form))
  const erwartet = ['correction', 'rewrite', 'insertion', 'slot', 'region', 'source', 'compare', 'dialogue', 'title', 'card']
  const fehlend = erwartet.filter(form => !formen.has(form))
  assert.deepEqual(fehlend, [], `Diese Formen zeigt das Beispiel nicht: ${fehlend.join(', ')}`)
})

test('alle drei Rangstufen kommen vor — Fehler, Empfehlung, Geschmack', () => {
  const stufen = new Set([...arten].map(art => kindInfo(art).priority))
  assert.deepEqual([...stufen].sort(), ['empfehlung', 'fehler', 'geschmack'])
})

test('alle fuenf Kategorien kommen vor', () => {
  const kategorien = new Set([...arten].map(art => kindInfo(art).category))
  assert.deepEqual([...kategorien].sort(), ['inhalt', 'korrektur', 'notiz', 'stil', 'struktur'])
})

// ---- Die Anker muessen woertlich im Text stehen -----------------------------
//
// Das ist die Pruefung, die sonst niemand macht: ein Anker, der nicht mehr
// passt, erzeugt keinen Fehler — die Anmerkung erscheint einfach nicht mehr,
// und das Beispiel wird still luecken haft.

test('jeder Anker der Text-Anmerkungen steht woertlich im Beispieltext', () => {
  const fehlend = lane
    .filter(eintrag => TEXT_ANNOTATION_KINDS.includes(eintrag.anmerkungsart))
    .filter(eintrag => eintrag.target && !TEXT.includes(eintrag.target))
    .map(eintrag => `${eintrag.anmerkungsart}: "${eintrag.target}"`)
  assert.deepEqual(fehlend, [],
    `Diese Anker stehen nicht im Text:\n  ${fehlend.join('\n  ')}\n`
    + 'Eine Anmerkung mit unauffindbarem Anker erscheint gar nicht — ohne Fehlermeldung.')
})

test('jeder Anker der Notiz-Anmerkungen steht woertlich im Notiz-Text', () => {
  const fehlend = lane
    .filter(eintrag => NOTE_ANNOTATION_KINDS.includes(eintrag.anmerkungsart))
    .filter(eintrag => eintrag.target && !NOTIZEN.includes(eintrag.target))
    .map(eintrag => `${eintrag.anmerkungsart}: "${eintrag.target}"`)
  assert.deepEqual(fehlend, [], `Diese Notiz-Anker stehen nicht im Notiz-Text:\n  ${fehlend.join('\n  ')}`)
})

test('auch die Mehrfach-Anker der Sammelkarten stehen im Text', () => {
  const fehlend = []
  lane.filter(eintrag => Array.isArray(eintrag.targets)).forEach(eintrag => {
    eintrag.targets.forEach(ziel => {
      if (ziel?.text && !TEXT.includes(ziel.text)) fehlend.push(`${eintrag.anmerkungsart}: "${ziel.text}"`)
    })
  })
  assert.deepEqual(fehlend, [], `Diese Sammel-Anker fehlen im Text:\n  ${fehlend.join('\n  ')}`)
})

// Die Absaetze einzeln — Marken werden pro Block gesetzt, nicht ueber den
// ganzen Text. Eine Sammelkarte, die "3×" sagt, meint drei Stellen in IHREM
// Absatz; im uebrigen Text darf dasselbe Wort beliebig oft stehen.
const ABSAETZE = buildExampleBody()
  .split(/<\/(?:p|h2)>/)
  .map(nurText)
  .filter(Boolean)

test('die angegebene Anzahl stimmt mit den Vorkommen im Zielabsatz ueberein', () => {
  // "3×" auf der Karte und zwei Marken im Absatz waeren eine Luege in der
  // Oberflaeche — und genau die Art Fehler, die niemandem auffaellt.
  const abweichungen = []
  lane.filter(eintrag => eintrag.count != null).forEach(eintrag => {
    const ziele = (Array.isArray(eintrag.targets) && eintrag.targets.length
      ? eintrag.targets.map(ziel => ziel.text)
      : [eintrag.target]).filter(Boolean)
    // Der Zielabsatz ist der mit den MEISTEN Treffern — dort sitzt die Haeufung,
    // um die es der Sammelkarte geht. Den erstbesten zu nehmen waere falsch:
    // ein Wort wie "Aufmerksamkeit" steht auch anderswo einmal.
    const treffer = absatz => ziele.reduce((summe, ziel) => summe + absatz.split(ziel).length - 1, 0)
    const absatz = ABSAETZE.reduce(
      (bester, kandidat) => (treffer(kandidat) > treffer(bester) ? kandidat : bester),
      ABSAETZE[0],
    )
    assert.ok(treffer(absatz) > 0, `${eintrag.anmerkungsart}: der Anker "${ziele[0]}" steht in keinem Absatz`)
    const echt = ziele.reduce((summe, ziel) => summe + absatz.split(ziel).length - 1, 0)
    if (echt !== eintrag.count) {
      abweichungen.push(`${eintrag.anmerkungsart}: Karte sagt ${eintrag.count}×, im Absatz sind es ${echt}×`)
    }
  })
  assert.deepEqual(abweichungen, [], abweichungen.join('\n'))
})

// ---- Was die Form braucht, muss die Anmerkung liefern -----------------------

test('jede Anmerkung liefert die Felder, die ihre Form braucht', () => {
  // Eine Korrektur ohne Ersatztext ist eine Zeile, in der nichts steht.
  const noetig = {
    correction: ['action'],
    rewrite: ['action'],
    insertion: ['action'],
    slot: ['move'],
    region: ['suggestion'],
    source: ['sources'],
    compare: ['compare'],
    dialogue: ['short'],
    title: ['action'],
    card: ['short'],
  }
  const luecken = []
  lane.forEach(eintrag => {
    const form = kindInfo(eintrag.anmerkungsart).form
    ;(noetig[form] || []).forEach(feld => {
      if (!eintrag[feld]) luecken.push(`${eintrag.anmerkungsart} (Form ${form}) fehlt "${feld}"`)
    })
  })
  assert.deepEqual(luecken, [], luecken.join('\n'))
})

test('jede Anmerkung sagt, warum — das ist der Teil, der beim naechsten Text hilft', () => {
  const ohne = lane.filter(eintrag => !eintrag.why).map(eintrag => eintrag.anmerkungsart)
  assert.deepEqual(ohne, [], `ohne Begruendung: ${ohne.join(', ')}`)
})

// ---- Die uebrigen Kanaele ---------------------------------------------------

test('alle acht Hinweisarten kommen im Beispiel vor', () => {
  // Die acht Arten sind die Kategorien, ueber die der Agent seine Hinweise
  // einordnet. Vier davon zaehlen zur Integritaet (agent-prompts.mjs:
  // "Setze integritaet genau bei den Arten fakt, quelle, methode und logik").
  const ACHT = ['fakt', 'quelle', 'methode', 'logik', 'struktur', 'wirkung', 'erklaerung', 'sprache']
  const vorhanden = new Set([...buildExampleCoach(), ...buildExampleHinweisarten()]
    .map(hinweis => hinweis.kiKategorie || hinweis.kategorie)
    .filter(Boolean))
  const fehlend = ACHT.filter(art => !vorhanden.has(art))
  assert.deepEqual(fehlend, [], `Diese Hinweisarten fehlen: ${fehlend.join(', ')}`)
})

test('die vier Integritaetsarten sind als solche gekennzeichnet', () => {
  const INTEGRITAET = new Set(['fakt', 'quelle', 'methode', 'logik'])
  const falsch = buildExampleHinweisarten()
    .filter(hinweis => hinweis.integritaet !== INTEGRITAET.has(hinweis.kiKategorie))
    .map(hinweis => `${hinweis.kiKategorie}: integritaet=${hinweis.integritaet}`)
  assert.deepEqual(falsch, [], falsch.join('\n'))
})

test('jede Hinweisart nennt ein uebertragbares Muster', () => {
  // Das Muster ist der Teil, der beim naechsten Text von allein wieder
  // anwendbar ist — nicht die Beobachtung noch einmal. Ohne ihn ist der Hinweis
  // eine Einzelfallkorrektur und macht niemanden unabhaengiger.
  const ohne = buildExampleHinweisarten()
    .filter(hinweis => !hinweis.muster || hinweis.muster.length < 40)
    .map(hinweis => hinweis.kiKategorie)
  assert.deepEqual(ohne, [], `ohne brauchbares Muster: ${ohne.join(', ')}`)
})

test('die Anker der Hinweisarten stehen woertlich im Text', () => {
  const fehlend = buildExampleHinweisarten()
    .filter(hinweis => hinweis.target && !TEXT.includes(hinweis.target))
    .map(hinweis => `${hinweis.kiKategorie}: "${hinweis.target}"`)
  assert.deepEqual(fehlend, [], `Diese Anker fehlen im Text:\n  ${fehlend.join('\n  ')}`)
})

test('alle drei Erweiterungsarten kommen im Beispiel vor', () => {
  const vorhanden = new Set(buildExampleErweiterungen().map(eintrag => eintrag.art))
  const fehlend = ERWEITERUNGS_ARTEN.filter(art => !vorhanden.has(art))
  assert.deepEqual(fehlend, [], `Diese Erweiterungsarten fehlen: ${fehlend.join(', ')}`)
})

test('die Erweiterungen haben die Stellenzahl, die ihre Art verlangt', () => {
  // weiterfuehrung genau eine, verbindung genau zwei, feld keine. Eine
  // Erweiterung mit falscher Stellenzahl faellt in ensureErweiterungen STILL
  // heraus — im Beispiel merkt das sonst niemand.
  const falsch = buildExampleErweiterungen()
    .filter(eintrag => (eintrag.stellen?.length ?? 0) !== ANKER_ANZAHL[eintrag.art])
    .map(eintrag => `${eintrag.art}: ${eintrag.stellen?.length ?? 0} Stellen statt ${ANKER_ANZAHL[eintrag.art]}`)
  assert.deepEqual(falsch, [], falsch.join('\n'))
})

test('die Erweiterungen ueberleben ensureErweiterungen', () => {
  // Die schaerfste Pruefung: das Modell selbst entscheidet, ob ein Eintrag
  // gueltig ist. Was hier herausfaellt, sieht Jakob nie.
  const doc = { erweiterungen: buildExampleErweiterungen() }
  ensureErweiterungen(doc)
  assert.equal(doc.erweiterungen.length, 3,
    'eine Beispiel-Erweiterung wurde vom Modell verworfen und erscheint gar nicht')
  assert.deepEqual(doc.erweiterungen.map(eintrag => eintrag.art).sort(), [...ERWEITERUNGS_ARTEN].sort())
})

test('die Stellen der Erweiterungen stehen woertlich im Text', () => {
  const fehlend = buildExampleErweiterungen()
    .flatMap(eintrag => eintrag.stellen || [])
    .map(stelle => stelle.text)
    .filter(text => !TEXT.includes(text))
  assert.deepEqual(fehlend, [], `Diese Erweiterungs-Stellen fehlen im Text:\n  ${fehlend.join('\n  ')}`)
})

test('der Beispieltext ist lesbar, kein Blindtext', () => {
  // Jakob testet an ihm, wie sich Rueckmeldung beim echten Lesen anfuehlt.
  // Ein Text aus Platzhaltern beantwortet diese Frage nicht.
  assert.ok(TEXT.length > 1500, `der Text ist mit ${TEXT.length} Zeichen zu kurz zum Lesen`)
  assert.doesNotMatch(TEXT, /Lorem ipsum|Blindtext|Platzhalter|TODO|XXX/i)
  assert.ok(NOTIZEN.length > 200, 'die Notizen sind zu kurz, um die Betriebsart zu zeigen')
})
