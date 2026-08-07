import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BLASEN_MASSE,
  blasenPfad,
  blasenPfadOben,
  blasenTransform,
  blaseTraegtKontur,
  nasenTiefe,
  sitzMitte,
} from '../src/onda-blase.mjs'

// ---- Die Kontur ist abgeschrieben, nicht erfunden ---------------------------
//
// Jakob hat gesagt: "wie im designsystem abgebildet". Die Vorlage ist
// components/conversation/Bubble.jsx aus "Onda Design System2", Funktion gooPath.
// Sie lautet dort woertlich:
//
//   M 24 0 H W-12 A 12 12 0 0 1 W 12 V H-12 A 12 12 0 0 1 W-12 H
//   H 46 A 12 12 0 0 1 34 H-12 V 58 A 10 10 0 0 0 24 48
//   A 24 24 0 0 1 0 24 A 24 24 0 0 1 24 0 Z
//
// Diese Pruefung haelt genau diesen String fest. Sie ist stumpf mit Absicht:
// die Radien wurden in diesem Projekt schon zweimal versehentlich
// zurueckgedreht. Wer die Form aendert, aendert hier bewusst mit.

const VORLAGE_600x400 = 'M 24 0 H 588 A 12 12 0 0 1 600 12'
  + ' V 388 A 12 12 0 0 1 588 400'
  + ' H 46 A 12 12 0 0 1 34 388'
  + ' V 58 A 10 10 0 0 0 24 48'
  + ' A 24 24 0 0 1 0 24 A 24 24 0 0 1 24 0 Z'

test('die Kontur ist Zeichen fuer Zeichen die des Design Systems', () => {
  assert.equal(blasenPfad(600, 400), VORLAGE_600x400)
})

test('die vier Masse stehen so, wie die Vorlage sie zeichnet', () => {
  assert.equal(BLASEN_MASSE.sitz, 24)
  assert.equal(BLASEN_MASSE.ecke, 12)
  assert.equal(BLASEN_MASSE.fillet, 10)
  // 36 in einem Sitz von 48 laesst ringsum 6px Luft — im Design System sitzt der
  // Avatar bei left:6px/top:6px mit Aura size=36. Beides muss zusammenpassen,
  // sonst klebt der Orb an der Kante seines eigenen Sitzes.
  assert.equal(BLASEN_MASSE.orb, 36)
  assert.equal(BLASEN_MASSE.orb + 2 * 6, 2 * BLASEN_MASSE.sitz)
})

test('die Ecken sind knapp (12), nicht die alten runden 24', () => {
  // Das aeltere Design System hatte hier ueberall 24 — die runde Fassung.
  // Faellt jemand darauf zurueck, taucht "A 24 24" viermal auf statt zweimal.
  const runde = blasenPfad(600, 400).match(/A 24 24/g) || []
  assert.equal(runde.length, 2, 'nur die beiden Sitzboegen duerfen Radius 24 haben')
  assert.match(blasenPfad(600, 400), /A 12 12/)
})

test('der Sitzmittelpunkt liegt 24 von beiden Kanten', () => {
  assert.equal(sitzMitte(), 24)
})

test('die Nase ragt 34 ueber den Panelkoerper hinaus', () => {
  // 24 Sitz + 10 Fillet. Genau so viel Innenabstand braucht die Blase oben,
  // sonst laege die erste Textzeile in der Nase.
  assert.equal(nasenTiefe(), 34)
  assert.match(blasenPfad(600, 400), / 34 388/)
})

test('der gedrehte Sitz vertauscht Breite und Hoehe', () => {
  // Bei seat='top' wird der Pfad um 90 Grad gedreht gezeichnet. Die Pfadbreite
  // ist dann die Blasenhoehe. Wer das vertauscht, bekommt eine Blase, deren
  // Kontur quer zu ihrem Kasten liegt — und merkt es erst am Bild.
  assert.equal(blasenPfadOben(380, 560), blasenPfad(560, 380))
  assert.equal(blasenTransform(380), 'translate(380,0) rotate(90)')
})

test('zu kleine Blasen tragen die Kontur nicht', () => {
  // Waere der Sitz groesser als die Blase, faltete sich die Silhouette in sich
  // selbst. Darunter behaelt die Blase ihre eigene Flaeche.
  assert.equal(blaseTraegtKontur(380, 560), true)
  assert.equal(blaseTraegtKontur(99, 560), false)
  assert.equal(blaseTraegtKontur(380, 117), false)
  assert.equal(blaseTraegtKontur(100, 118), true)
})

test('Masse werden gerundet — halbe Pixel zerstoeren die Tangente', () => {
  assert.equal(blasenPfad(600.4, 400.2), VORLAGE_600x400)
})
