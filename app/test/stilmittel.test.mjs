import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ERKENNUNG,
  FEHLERBILDER,
  KLASSE_NAME,
  MECHANISMEN,
  MECHANISMUS_ERKLAERUNG,
  STILMITTEL,
  STILMITTEL_KLASSEN,
  STILMITTEL_TEXTARTEN,
  TEXTART_NAME,
  aufgesetzteStilmittel,
  darfVorgeschlagenWerden,
  stilmittel,
  stilmittelFuerTextart,
  stilmittelTabelle,
  stilmittelUrteil,
  textartName,
  textartTabelleStilmittel,
  tragendeStilmittel,
  vorsichtsListe,
} from '../src/stilmittel.mjs'
import { LANGUAGE_GENRES } from '../src/language-profile.mjs'

test('Die Textarten sind die des Sprachprofils, keine zweite Liste daneben', () => {
  assert.equal(STILMITTEL_TEXTARTEN, LANGUAGE_GENRES)
  for (const textart of LANGUAGE_GENRES) {
    assert.ok(TEXTART_NAME[textart], `Textart ${textart} hat keinen Namen`)
  }
})

test('Jedes Stilmittel ist vollstaendig beschrieben und begruendet', () => {
  assert.ok(STILMITTEL.length >= 20, 'die Arbeitsmenge ist zu klein, um ein Werkzeugbrett zu sein')
  const ids = new Set()
  for (const mittel of STILMITTEL) {
    assert.equal(ids.has(mittel.id), false, `doppelte Kennung ${mittel.id}`)
    ids.add(mittel.id)
    assert.ok(mittel.name, `${mittel.id} ohne Namen`)
    assert.ok(STILMITTEL_KLASSEN.includes(mittel.klasse), `${mittel.id}: Klasse ${mittel.klasse} gibt es nicht`)
    assert.ok(KLASSE_NAME[mittel.klasse], `${mittel.id}: Klasse ohne Namen`)
    assert.ok(MECHANISMEN.includes(mittel.mechanismus), `${mittel.id}: Mechanismus ${mittel.mechanismus} gibt es nicht`)
    assert.ok(ERKENNUNG.includes(mittel.erkennung), `${mittel.id}: Erkennung ${mittel.erkennung} gibt es nicht`)
    for (const feld of ['was', 'leistung', 'kippt', 'pruefFrage']) {
      assert.ok(typeof mittel[feld] === 'string' && mittel[feld].length > 30,
        `${mittel.id}: ${feld} ist keine echte Begruendung`)
    }
    assert.ok(mittel.pruefFrage.endsWith('?'), `${mittel.id}: die Prueffrage ist keine Frage`)
  }
})

// Der Kern des Moduls: Kein Mittel ist an sich gut oder schlecht. Ein Mittel, das ueberall
// traegt und nirgends aufgesetzt wirkt, muesste dafuer einen Grund haben — und ein Mittel,
// das nirgends etwas leistet, gehoert nicht in die Liste.
test('Jedes Mittel nennt nur Textarten, die es im Sprachprofil gibt', () => {
  for (const mittel of STILMITTEL) {
    for (const textart of [...mittel.traegt, ...mittel.aufgesetzt]) {
      assert.ok(LANGUAGE_GENRES.includes(textart),
        `${mittel.id}: ${textart} ist keine Textart des Sprachprofils`)
    }
    const doppelt = mittel.traegt.filter(textart => mittel.aufgesetzt.includes(textart))
    assert.deepEqual(doppelt, [],
      `${mittel.id}: ${doppelt.join(', ')} steht in beiden Listen`)
    assert.ok(mittel.traegt.length > 0, `${mittel.id} traegt bei keiner einzigen Textart`)
  }
})

// 'other' ist die Textart ohne Festlegung. Sie darf in keiner Zeile stehen, sonst waere die
// Fail-closed-Regel eine Behauptung im Text und keine Eigenschaft der Tabelle.
test('Die unbestimmte Textart other steht in keiner Zeile', () => {
  for (const mittel of STILMITTEL) {
    assert.equal(mittel.traegt.includes('other'), false, `${mittel.id}`)
    assert.equal(mittel.aufgesetzt.includes('other'), false, `${mittel.id}`)
  }
  assert.deepEqual(tragendeStilmittel('other'), [])
  assert.deepEqual(aufgesetzteStilmittel('other'), [])
})

test('Die drei Mechanismen sind erklaert und werden alle gebraucht', () => {
  for (const mechanismus of MECHANISMEN) {
    assert.ok(MECHANISMUS_ERKLAERUNG[mechanismus]?.length > 60, `${mechanismus} ohne Erklaerung`)
    assert.ok(STILMITTEL.some(mittel => mittel.mechanismus === mechanismus),
      `Mechanismus ${mechanismus} kommt in keiner Zeile vor`)
  }
})

test('Alle fuenf Klassen sind besetzt — sonst fehlt ein halbes Werkzeugbrett', () => {
  for (const klasse of STILMITTEL_KLASSEN) {
    assert.ok(STILMITTEL.some(mittel => mittel.klasse === klasse), `Klasse ${klasse} ist leer`)
  }
})

// Klang-, Wort- und Satzfiguren stehen an der Oberflaeche; Gedankenfiguren und Tropen
// brauchen Bedeutung. Der Unterschied entscheidet, wie sicher eine Zuordnung sein darf.
test('Die Erkennbarkeit folgt der Klasse und behauptet keine falsche Sicherheit', () => {
  for (const mittel of STILMITTEL) {
    const erwartet = ['klang', 'wort', 'satz'].includes(mittel.klasse) ? 'form' : 'sinn'
    assert.equal(mittel.erkennung, erwartet,
      `${mittel.id}: Klasse ${mittel.klasse} und Erkennung ${mittel.erkennung} passen nicht zusammen`)
  }
})

test('Das Urteil kennt drei Werte, und offen ist einer davon', () => {
  assert.equal(stilmittelUrteil('parallelismus', 'scientific'), 'traegt')
  assert.equal(stilmittelUrteil('alliteration', 'scientific'), 'aufgesetzt')
  assert.equal(stilmittelUrteil('alliteration', 'essay'), 'offen')
  assert.equal(stilmittelUrteil('trikolon', 'campaign'), 'traegt')
  assert.equal(stilmittelUrteil('trikolon', 'scientific'), 'aufgesetzt')
})

// Der eigentliche Befund, um dessentwillen es die Tabelle gibt: Dieselbe Alliteration ist
// im Slogan Handwerk und im Methodenteil ein Registerbruch.
test('Dieselbe Figur faellt bei zwei Textarten verschieden aus', () => {
  assert.equal(darfVorgeschlagenWerden('alliteration', 'campaign'), true)
  assert.equal(darfVorgeschlagenWerden('alliteration', 'scientific'), false)
  assert.equal(darfVorgeschlagenWerden('ironie', 'prosa'), true)
  assert.equal(darfVorgeschlagenWerden('ironie', 'web'), false)
  assert.equal(darfVorgeschlagenWerden('litotes', 'scientific'), true)
  assert.equal(darfVorgeschlagenWerden('litotes', 'campaign'), false)
})

// Fail-closed: ohne Textart schlaegt Onda kein Stilmittel vor. Ein Ratschlag ins Blaue ist
// genau der, der einem Text die eigene Stimme nimmt.
test('Fehlende oder unbekannte Textart ergibt offen, nie einen Vorschlag', () => {
  for (const leer of [undefined, null, '', '   ', 0, false, NaN, 'Gedicht', 'SCIENTIFIC', 42, {}, []]) {
    assert.equal(stilmittelUrteil('metapher', leer), 'offen', `Textart ${String(leer)}`)
    assert.equal(darfVorgeschlagenWerden('parallelismus', leer), false, `Textart ${String(leer)}`)
  }
  assert.deepEqual(tragendeStilmittel(''), [])
  assert.deepEqual(aufgesetzteStilmittel(undefined), [])
})

test('Unbekanntes Stilmittel ergibt offen, nie einen Vorschlag', () => {
  for (const nichts of [undefined, null, '', '  ', 'zeugma', 'Metapher', 'ANAPHER', 7]) {
    assert.equal(stilmittel(nichts), null, `Mittel ${String(nichts)}`)
    assert.equal(stilmittelUrteil(nichts, 'essay'), 'offen', `Mittel ${String(nichts)}`)
    assert.equal(darfVorgeschlagenWerden(nichts, 'essay'), false, `Mittel ${String(nichts)}`)
  }
})

// Ein Nachschlagen ohne hasOwnProperty liefert bei diesen Namen die geerbte Funktion vom
// Object-Prototyp — aus der Fail-closed-Regel wuerde ein Absturz.
test('Geerbte Namen stuerzen nicht ab', () => {
  for (const gemein of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
    assert.equal(stilmittel(gemein), null, `Mittel ${gemein}`)
    assert.equal(stilmittelUrteil('metapher', gemein), 'offen', `Textart ${gemein}`)
    assert.equal(textartName(gemein), gemein, `Textart ${gemein}`)
  }
})

test('Randstaende werden verziehen: Leerzeichen um Mittel und Textart', () => {
  assert.equal(stilmittelUrteil('  alliteration  ', ' campaign '), 'traegt')
  assert.equal(darfVorgeschlagenWerden(' litotes ', ' scientific '), true)
})

test('Die Vorsichtsliste nennt genau die Mittel mit hinterlegtem Grund', () => {
  const liste = vorsichtsListe()
  assert.ok(liste.length >= 3, 'die bekannten KI-Signaturen fehlen')
  for (const mittel of liste) {
    assert.ok(mittel.vorsicht.length > 40, `${mittel.id}: Vorsicht ohne Begruendung`)
  }
  assert.deepEqual(
    liste.map(mittel => mittel.id).sort(),
    STILMITTEL.filter(mittel => mittel.vorsicht).map(mittel => mittel.id).sort(),
  )
  for (const id of ['trikolon', 'antithese', 'hyperbel', 'metapher']) {
    assert.ok(liste.some(mittel => mittel.id === id), `${id} fehlt in der Vorsichtsliste`)
  }
})

test('Die vier Fehlerbilder tragen jeweils Diagnose und Prueffrage', () => {
  assert.equal(FEHLERBILDER.length, 4)
  for (const bild of FEHLERBILDER) {
    assert.ok(bild.name, `${bild.id} ohne Namen`)
    assert.ok(bild.diagnose.length > 40, `${bild.id} ohne echte Diagnose`)
    assert.ok(bild.pruefFrage.endsWith('?'), `${bild.id}: keine Prueffrage`)
  }
})

test('stilmittelFuerTextart liefert die Zeile fuer genau eine Textart', () => {
  const zeile = stilmittelFuerTextart('scientific')
  assert.equal(zeile.textart, 'scientific')
  assert.equal(zeile.name, TEXTART_NAME.scientific)
  assert.ok(zeile.traegt.includes('Parallelismus'))
  assert.ok(zeile.aufgesetzt.includes('Alliteration'))
  const leer = stilmittelFuerTextart('kochrezept')
  assert.deepEqual(leer, { textart: '', name: '', traegt: [], aufgesetzt: [] })
})

test('textartTabelleStilmittel laeuft ueber die Textarten des Sprachprofils', () => {
  const tabelle = textartTabelleStilmittel()
  assert.equal(tabelle.length, LANGUAGE_GENRES.length)
  assert.deepEqual(tabelle.map(zeile => zeile.textart), [...LANGUAGE_GENRES])
})

test('stilmittelTabelle liefert jede Zeile vollstaendig und als Kopie', () => {
  const tabelle = stilmittelTabelle()
  assert.equal(tabelle.length, STILMITTEL.length)
  tabelle[0].traegt.push('kaputt')
  assert.equal(STILMITTEL[0].traegt.includes('kaputt'), false, 'die Tabelle gibt ihre Innereien heraus')
})

test('Die Tabellen sind eingefroren — die Regel laesst sich nicht zur Laufzeit umschreiben', () => {
  assert.ok(Object.isFrozen(STILMITTEL))
  assert.ok(Object.isFrozen(FEHLERBILDER))
  assert.ok(Object.isFrozen(MECHANISMUS_ERKLAERUNG))
  assert.ok(Object.isFrozen(TEXTART_NAME))
  for (const mittel of STILMITTEL) {
    assert.ok(Object.isFrozen(mittel), `${mittel.id} ist nicht eingefroren`)
    assert.ok(Object.isFrozen(mittel.traegt), `${mittel.id}: traegt ist nicht eingefroren`)
    assert.ok(Object.isFrozen(mittel.aufgesetzt), `${mittel.id}: aufgesetzt ist nicht eingefroren`)
  }
})
