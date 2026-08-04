import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CATEGORY_ZU_ART,
  STANDARD_INTEGRITAET,
  TEXTARTEN,
  TEXTART_BEGRUENDUNG,
  TEXTART_INTEGRITAET,
  integritaetsArten,
  istIntegritaetsfrage,
  istIntegritaetsfrageFuerCategory,
  istVonDerTextartAusgeschlossen,
  textartTabelle,
} from '../src/textart-regeln.mjs'
import { LANGUAGE_GENRES } from '../src/language-profile.mjs'
import { HINWEISE_SCHEMA } from '../src/agent-tasks.mjs'

const ACHT_ARTEN = HINWEISE_SCHEMA.properties.hinweise.items.properties.kategorie.enum

test('Die Textarten sind die des Sprachprofils, keine zweite Liste daneben', () => {
  assert.equal(TEXTARTEN, LANGUAGE_GENRES)
})

test('Jede Textart hat eine eigene Zeile und eine Begruendung', () => {
  for (const textart of LANGUAGE_GENRES) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(TEXTART_INTEGRITAET, textart),
      `Textart ${textart} fehlt in der Tabelle`,
    )
    const begruendung = TEXTART_BEGRUENDUNG[textart]
    assert.ok(typeof begruendung === 'string' && begruendung.length > 40,
      `Textart ${textart} ohne echte Begruendung`)
  }
  assert.deepEqual(Object.keys(TEXTART_INTEGRITAET).sort(), [...LANGUAGE_GENRES].sort())
})

// Genau EINE Textart darf ohne Integritaetsfrage dastehen: die Lyrik. Dort kann ein
// Widerspruch die Form sein. Der Test haelt die Ausnahme klein — kaeme eine zweite
// leere Zeile dazu, ohne dass jemand sie begruendet, faellt er auf.
const OHNE_INTEGRITAET = new Set(['lyrik'])

test('Die Tabelle nennt nur Arten, die es im Schema wirklich gibt', () => {
  for (const [textart, arten] of Object.entries(TEXTART_INTEGRITAET)) {
    if (!OHNE_INTEGRITAET.has(textart)) {
      assert.ok(arten.length > 0, `Textart ${textart} ohne jede Integritaetsfrage`)
    }
    for (const art of arten) {
      assert.ok(ACHT_ARTEN.includes(art), `Textart ${textart}: ${art} ist keine der acht Hinweisarten`)
    }
  }
  for (const art of STANDARD_INTEGRITAET) {
    assert.ok(ACHT_ARTEN.includes(art), `${art} ist keine der acht Hinweisarten`)
  }
})

// Der Kern von Befund 2: bei einem Plakat- oder Marketingtext waere eine Quellenangabe
// sinnlos, und ein Verwerfen wurde dort trotzdem zum "bewusst angenommenen Risiko".
test('Die Textart entscheidet: Quelle bindet in der Hausarbeit, nicht auf dem Plakat', () => {
  assert.equal(istIntegritaetsfrage('scientific', 'quelle'), true)
  assert.equal(istIntegritaetsfrage('scientific', 'methode'), true)
  assert.equal(istIntegritaetsfrage('campaign', 'quelle'), false)
  assert.equal(istIntegritaetsfrage('campaign', 'methode'), false)
  assert.equal(istIntegritaetsfrage('marketing', 'quelle'), false)
  assert.equal(istIntegritaetsfrage('web', 'methode'), false)
  assert.equal(istIntegritaetsfrage('essay', 'methode'), false)
  assert.equal(istIntegritaetsfrage('essay', 'logik'), true)
})

// Die Erfindung ist die Ausnahme, und sie ist keine Nachlaessigkeit: In einem Roman
// ist eine erfundene Tatsache kein Verstoss, sondern das Handwerk. Ueberall dort, wo
// ein Text etwas ueber die WELT behauptet, bindet die Tatsachenfrage weiterhin.
const ERFINDET = new Set(['prosa', 'lyrik'])

test('Die Tatsachenfrage bindet bei jeder Textart, die etwas ueber die Welt behauptet', () => {
  for (const textart of LANGUAGE_GENRES) {
    if (ERFINDET.has(textart)) continue
    assert.equal(istIntegritaetsfrage(textart, 'fakt'), true,
      `Textart ${textart}: fakt muss eine Integritaetsfrage bleiben`)
  }
})

test('Handwerksfragen sind bei keiner Textart Integritaetsfragen', () => {
  for (const textart of LANGUAGE_GENRES) {
    for (const art of ['struktur', 'wirkung', 'erklaerung', 'sprache']) {
      assert.equal(istIntegritaetsfrage(textart, art), false,
        `Textart ${textart}: ${art} darf keine Integritaetsfrage sein`)
    }
  }
})

// Fail-closed: Wer keine Textart angibt, verliert keine Sicherung.
test('Fehlende Textart faellt auf die heutigen vier zurueck', () => {
  for (const leer of [undefined, null, '', '   ', 0, false, NaN]) {
    assert.deepEqual(integritaetsArten(leer), STANDARD_INTEGRITAET,
      `Leerwert ${String(leer)} muesste die vier ergeben`)
    assert.equal(istIntegritaetsfrage(leer, 'quelle'), true)
    assert.equal(istIntegritaetsfrage(leer, 'methode'), true)
    assert.equal(istIntegritaetsfrage(leer, 'fakt'), true)
    assert.equal(istIntegritaetsfrage(leer, 'logik'), true)
    assert.equal(istIntegritaetsfrage(leer, 'sprache'), false)
  }
})

test('Unbekannte Textart faellt auf die heutigen vier zurueck', () => {
  for (const unbekannt of ['Gedicht', 'SCIENTIFIC', 'kochrezept', 'reportage', 42, {}, []]) {
    assert.deepEqual(integritaetsArten(unbekannt), STANDARD_INTEGRITAET,
      `Unbekannte Textart ${String(unbekannt)} muesste die vier ergeben`)
  }
})

// Ein Nachschlagen ohne hasOwnProperty liefert bei diesen Namen die geerbte Funktion vom
// Object-Prototyp -- aus der Fail-closed-Regel wuerde ein Absturz.
test('Geerbte Namen als Textart stuerzen nicht ab, sondern fallen auf die vier zurueck', () => {
  for (const gemein of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
    assert.deepEqual(integritaetsArten(gemein), STANDARD_INTEGRITAET, `Name ${gemein}`)
    assert.equal(istIntegritaetsfrage(gemein, 'quelle'), true, `Name ${gemein}`)
  }
  assert.equal(istIntegritaetsfrageFuerCategory('scientific', 'constructor'), false)
  assert.equal(istIntegritaetsfrageFuerCategory('scientific', 'toString'), false)
})

test('Leere oder unbekannte Hinweisart ist nie eine Integritaetsfrage', () => {
  for (const nichts of [undefined, null, '', '  ', 'kritik', 'FAKT']) {
    assert.equal(istIntegritaetsfrage('scientific', nichts), false, `Art ${String(nichts)}`)
    assert.equal(istVonDerTextartAusgeschlossen('campaign', nichts), false, `Art ${String(nichts)}`)
  }
})

test('Randstaende werden verziehen: Leerzeichen um die Textart', () => {
  assert.deepEqual(integritaetsArten('  campaign  '), TEXTART_INTEGRITAET.campaign)
  assert.equal(istIntegritaetsfrage(' marketing ', ' quelle '), false)
  assert.equal(istIntegritaetsfrage(' marketing ', ' fakt '), true)
})

// Der Unterschied zwischen "ist keine Integritaetsfrage" und "wurde von der Textart
// abgeraeumt": nur beim zweiten darf das Modell-Flag nicht mehr dagegenhalten.
test('istVonDerTextartAusgeschlossen trifft nur, was die Textart aktiv abgeraeumt hat', () => {
  assert.equal(istVonDerTextartAusgeschlossen('campaign', 'quelle'), true)
  assert.equal(istVonDerTextartAusgeschlossen('campaign', 'methode'), true)
  assert.equal(istVonDerTextartAusgeschlossen('campaign', 'fakt'), false)
  assert.equal(istVonDerTextartAusgeschlossen('scientific', 'quelle'), false)
  // struktur war noch nie eine Integritaetsfrage — die Textart raeumt hier nichts ab.
  assert.equal(istVonDerTextartAusgeschlossen('campaign', 'struktur'), false)
  // Ohne Textart wird nichts abgeraeumt.
  assert.equal(istVonDerTextartAusgeschlossen('', 'quelle'), false)
  assert.equal(istVonDerTextartAusgeschlossen('unbekannt', 'quelle'), false)
})

test('Die englische Brille der Findings trifft dieselbe Entscheidung', () => {
  assert.equal(istIntegritaetsfrageFuerCategory('scientific', 'source'), true)
  assert.equal(istIntegritaetsfrageFuerCategory('scientific', 'citation'), true)
  assert.equal(istIntegritaetsfrageFuerCategory('campaign', 'source'), false)
  // citation und quelle sind dieselbe Frage — sie muessen zusammen fallen.
  assert.equal(istIntegritaetsfrageFuerCategory('campaign', 'citation'), false)
  assert.equal(istIntegritaetsfrageFuerCategory('campaign', 'fact'), true)
  assert.equal(istIntegritaetsfrageFuerCategory('', 'source'), true)
  assert.equal(istIntegritaetsfrageFuerCategory('scientific', 'content'), false)
  assert.equal(istIntegritaetsfrageFuerCategory('scientific', 'wording'), false)
  for (const [category, art] of Object.entries(CATEGORY_ZU_ART)) {
    assert.ok(ACHT_ARTEN.includes(art), `${category} zeigt auf ${art}, das es nicht gibt`)
  }
})

test('textartTabelle liefert jede Zeile mit Arten und Begruendung', () => {
  const tabelle = textartTabelle()
  assert.equal(tabelle.length, LANGUAGE_GENRES.length)
  assert.deepEqual(tabelle.map(zeile => zeile.textart), [...LANGUAGE_GENRES])
  for (const zeile of tabelle) {
    assert.deepEqual(zeile.arten, TEXTART_INTEGRITAET[zeile.textart])
    assert.equal(zeile.begruendung, TEXTART_BEGRUENDUNG[zeile.textart])
  }
})

test('Die Tabellen sind eingefroren — die Regel laesst sich nicht zur Laufzeit umschreiben', () => {
  assert.ok(Object.isFrozen(TEXTART_INTEGRITAET))
  assert.ok(Object.isFrozen(TEXTART_BEGRUENDUNG))
  assert.ok(Object.isFrozen(STANDARD_INTEGRITAET))
  assert.ok(Object.isFrozen(CATEGORY_ZU_ART))
  for (const arten of Object.values(TEXTART_INTEGRITAET)) assert.ok(Object.isFrozen(arten))
})


// Die beiden neuen Textarten, ausdruecklich geprueft: sie sind der Grund, warum die
// Tabelle ueberhaupt existiert. Ein Gedicht mit der Forderung nach einer Quellenangabe
// zu behelligen ist nicht streng, sondern absurd.
test('Prosa: die erfundene Tatsache ist das Handwerk, der Bruch im Gedanken bleibt', () => {
  assert.equal(istIntegritaetsfrage('prosa', 'fakt'), false)
  assert.equal(istIntegritaetsfrage('prosa', 'quelle'), false)
  assert.equal(istIntegritaetsfrage('prosa', 'logik'), true)
})

test('Lyrik: es bindet nichts — jeder Hinweis ist ein Angebot', () => {
  for (const art of ['fakt', 'quelle', 'methode', 'logik', 'struktur', 'wirkung', 'erklaerung', 'sprache']) {
    assert.equal(istIntegritaetsfrage('lyrik', art), false, `lyrik: ${art} duerfte nicht binden`)
  }
})
