// Das Beispielprojekt ist vom Pausen-Auslöser ausgeschlossen — eine Vorführung soll nichts
// kosten und ohne Schlüssel laufen. Ohne mitgelieferten Bestand bliebe die Struktur-Spalte
// dort für immer namenlos, und das ist genau die Stelle, an der jeder das Werkzeug zuerst
// sieht. Diese Prüfungen halten den Bestand an den Text gebunden.
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildExampleBausteinarten, buildExampleBody } from '../src/example.js'
import { bausteinNamen, bausteinRollen, normalisiereBausteinarten } from '../src/bausteinlauf-model.mjs'

test('der mitgelieferte Bestand überlebt die Normalisierung vollständig', () => {
  const bestand = normalisiereBausteinarten(buildExampleBausteinarten())
  assert.ok(bestand, 'der Beispielbestand überlebt die Normalisierung nicht')
  assert.equal(bestand.textsorte, 'Essay')
  // Kein stiller Verlust: Was hineingeht, muss auch herauskommen.
  assert.equal(bestand.arten.length, buildExampleBausteinarten().arten.length)
  assert.equal(
    Object.keys(bestand.zuordnung).length,
    Object.keys(buildExampleBausteinarten().zuordnung).length,
    'die Normalisierung hat Zuordnungen verworfen — eine Art-Kennung zeigt ins Leere',
  )
})

test('jede Zuordnung zeigt auf einen Absatz, den es im Beispieltext gibt', () => {
  const body = buildExampleBody()
  const bestand = normalisiereBausteinarten(buildExampleBausteinarten())
  Object.keys(bestand.zuordnung).forEach(blockId => {
    assert.ok(body.includes(`data-block-id="${blockId}"`), `unbekannter Absatz im Beispielbestand: ${blockId}`)
  })
})

test('jeder Absatz des Beispiels hat einen Namen — keiner bleibt stumm', () => {
  const body = buildExampleBody()
  const bestand = normalisiereBausteinarten(buildExampleBausteinarten())
  const alleAbsaetze = [...body.matchAll(/data-block-id="([^"]+)"/g)]
    .map(treffer => treffer[1])
    .filter(id => !id.endsWith('-h'))
  const ohneNamen = alleAbsaetze.filter(id => !bestand.zuordnung[id])
  assert.deepEqual(ohneNamen, [], `diese Absätze bekämen keinen Namen: ${ohneNamen.join(', ')}`)
})

test('keine Überschrift bekommt eine Art', () => {
  const bestand = normalisiereBausteinarten(buildExampleBausteinarten())
  Object.keys(bestand.zuordnung).forEach(blockId => {
    assert.doesNotMatch(blockId, /-h$/, `eine Überschrift hat eine Art bekommen: ${blockId}`)
  })
})

// argument-projection.mjs verlangt GENAU EINE zentrale Aussage und kehrt sonst wirkungslos
// zurück. Zwei claim-Arten wären deshalb dasselbe wie keine.
test('genau eine Art trägt claim — sonst bleibt die Argument-Karte leer', () => {
  const bestand = normalisiereBausteinarten(buildExampleBausteinarten())
  assert.equal(bestand.arten.filter(art => art.funktion === 'claim').length, 1)
  const rollen = [...bausteinRollen(bestand).values()]
  assert.equal(rollen.filter(rolle => rolle === 'claim').length, 1, 'genau ein Absatz trägt die zentrale Aussage')
  assert.ok(rollen.includes('evidence'), 'ohne Beleg hat die zentrale Aussage nichts zu tragen')
  assert.ok(rollen.includes('counterpoint'), 'ohne Gegenposition wird nie etwas contested')
})

test('der Beispieltext zeigt mehrere verschiedene Namen', () => {
  const namen = [...new Set(bausteinNamen(buildExampleBausteinarten()).values())]
  assert.ok(namen.length >= 4, `zu wenige verschiedene Namen: ${JSON.stringify(namen)}`)
})
