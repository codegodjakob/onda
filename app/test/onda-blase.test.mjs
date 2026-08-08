import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BEWEGUNG,
  ECK_R,
  HALS_B,
  KEHL_R,
  KOPF_R,
  KOPF_VERSATZ,
  MINDEST_BREITE,
  MINDEST_HOEHE,
  SCHULTER,
  SITZ_R,
  blaseIstMoeglich,
  blasenFortschritt,
  blasenGeometrie,
  blasenMasse,
  blasenPfad,
  kurveOut,
  kurveStandard,
  machKurve,
} from '../src/onda-blase.mjs'

const abstand = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const NAH = 1e-9

test('Der Sitz IST der Orb — der Radius ist abgeleitet, nicht gewaehlt', () => {
  // Die Tastflaeche des Orbs ist 44px (style.css: #ondaAura width/height). Der Sitz ist
  // exakt der Kreis, der ihr einbeschrieben ist. Waere er groesser oder kleiner, saehe
  // die Blase aus, als klebte sie am Orb, statt aus ihm zu kommen.
  assert.equal(SITZ_R * 2, 44)
  assert.equal(ECK_R, 16, 'ECK_R ist --radius-overlay')
  assert.equal(KEHL_R, 10, 'KEHL_R ist --radius-panel')

  const g = blasenGeometrie({ links: 0, rechts: 380, oben: 0, unten: 560 })
  assert.deepEqual(g.sitz, { x: 380 - 22, y: 22, r: 22 })
  // Die beiden Punkte, an denen der Sitz die Kanten der Orb-Tastflaeche beruehrt.
  assert.deepEqual(g.sitzRechts, { x: 380, y: 22 })
  assert.deepEqual(g.sitzOben, { x: 380 - 22, y: 0 })
})

test('Beide Kehlen gehen exakt tangential in Hals und Sitz ueber', () => {
  const g = blasenGeometrie({ links: 10, rechts: 380, oben: 4, unten: 560, halsL: 100 })

  // Die Fusskehle beruehrt beide Enden mit ihrem Radius — sie ist ein echter Fillet
  // und keine hingebogene Kurve.
  assert.ok(Math.abs(abstand(g.kehle, g.kehleUnten) - KEHL_R) < NAH)
  assert.ok(Math.abs(abstand(g.kehle, g.halsLinks) - KEHL_R) < NAH)

  // Am Uebergang in die Panel-Oberkante steht der Radiusvektor der Kehle senkrecht,
  // ihre Tangente also waagerecht — wie die Kante selbst.
  assert.equal(g.kehleUnten.x, g.kehle.x)
  assert.equal(g.kehleUnten.y, g.kante)

  // Am Uebergang in den Hals steht er waagerecht, die Tangente also senkrecht — wie
  // die Halskante. Oben tut die Kopfkehle dasselbe, nur andersherum.
  assert.equal(g.halsLinks.y, g.kehle.y)
  assert.equal(g.halsLinks.x, g.kopfHals.x)
  assert.ok(Math.abs(abstand(g.kopfkehle, g.kopfHals) - KOPF_R) < NAH)
  assert.equal(g.kopfHals.y, g.kopfkehle.y)

  // Und die Kopfkehle beruehrt den Sitz von aussen: der Abstand der Mittelpunkte ist
  // die Summe der Radien, und der Beruehrpunkt liegt auf ihrer Verbindung. Genau dort
  // haben beide Bogen dieselbe Tangente — sonst saesse an dieser Stelle eine Ecke.
  assert.ok(Math.abs(abstand(g.sitz, g.kopfkehle) - (SITZ_R + KOPF_R)) < NAH)
  assert.ok(Math.abs(abstand(g.sitz, g.kopfSitz) - SITZ_R) < NAH)
  assert.ok(Math.abs(abstand(g.kopfkehle, g.kopfSitz) - KOPF_R) < NAH)

  // Und rechts endet der Sitz mit senkrechter Tangente auf der rechten Panelkante —
  // dort brauchen die beiden keine Kehle, weil sie ohnehin zusammenfallen. Diese Kante
  // ist zugleich die rechte Halskante: EINE Linie vom Orb bis in die untere Ecke.
  assert.ok(Math.abs(abstand(g.sitz, g.sitzRechts) - SITZ_R) < NAH)
  assert.equal(g.sitzRechts.x, g.rechts)
})

test('Ein Hals in Sitzbreite laesst die Kopfkehle auf null zusammenfallen', () => {
  // Die Probe darauf, dass die neue Geometrie die alte enthaelt: bei halsB = 2 x SITZ_R
  // ist die Halskante die Tangente des Sitzes, die Kopfkehle also ueberfluessig.
  const g = blasenGeometrie({ links: 0, rechts: 380, oben: 0, unten: 560, halsB: 2 * SITZ_R })
  assert.ok(Math.abs(g.kopfHals.y - g.sitz.y) < NAH, 'Die Kopfkehle sitzt nicht auf Sitzhoehe')
  assert.ok(Math.abs(g.kopfSitz.x - (g.sitz.x - SITZ_R)) < NAH)
  assert.ok(Math.abs(g.kopfSitz.y - g.sitz.y) < NAH)
})

test('Bei den Mindestmassen laeuft kein Segment rueckwaerts', () => {
  assert.equal(MINDEST_BREITE, HALS_B + KEHL_R + ECK_R)
  assert.equal(MINDEST_HOEHE, SCHULTER + 2 * ECK_R)
  // Die Schulter ist gerechnet, nicht gesetzt: Sitz, Kopfkehle, Fusskehle.
  assert.equal(SCHULTER, SITZ_R + KOPF_VERSATZ + KEHL_R)
  assert.ok(Math.abs(KOPF_VERSATZ - Math.sqrt((SITZ_R + KOPF_R) ** 2 - (HALS_B - SITZ_R + KOPF_R) ** 2)) < NAH)

  const g = blasenGeometrie({ links: 0, rechts: MINDEST_BREITE, oben: 0, unten: MINDEST_HOEHE })
  // Die Oberkante laeuft von links+ECK_R bis zum Kehlenanfang — genau bis dorthin und
  // keinen Pixel zurueck. Ein Pixel weniger, und der Pfad schluege einen Haken.
  assert.ok(g.kehleUnten.x >= g.links + ECK_R, 'Die Oberkante laeuft rueckwaerts')
  // Die linke Kante laeuft von unten-ECK_R bis kante+ECK_R.
  assert.ok(g.unten - ECK_R >= g.kante + ECK_R, 'Die linke Kante laeuft rueckwaerts')
  // Und genau an der Mindestgroesse sind beide Strecken null: das IST die Untergrenze.
  assert.equal(g.kehleUnten.x, g.links + ECK_R)
  assert.equal(g.unten - ECK_R, g.kante + ECK_R)

  assert.equal(blaseIstMoeglich(MINDEST_BREITE, MINDEST_HOEHE, 0), true)
  assert.equal(blaseIstMoeglich(MINDEST_BREITE - 1, MINDEST_HOEHE, 0), false)
  assert.equal(blaseIstMoeglich(MINDEST_BREITE, MINDEST_HOEHE - 1, 0), false)
  // Der halbe Strich zaehlt mit: ohne ihn zeichnete die kleinste Blase 0,5px ueber den
  // Rand des SVG hinaus, und die Haarlinie waere dort halbiert.
  assert.equal(blaseIstMoeglich(MINDEST_BREITE, MINDEST_HOEHE), false)
  assert.equal(blaseIstMoeglich(MINDEST_BREITE + 1, MINDEST_HOEHE + 1), true)
})

test('Der Pfad ist eine einzige geschlossene Silhouette', () => {
  const d = blasenPfad({ links: 0, rechts: 380, oben: 0, unten: 560 })
  assert.match(d, /^M 380 22 /, 'Der Pfad beginnt am rechten Punkt des Sitzes')
  assert.match(d, /Z$/, 'Der Pfad ist nicht geschlossen')
  // Drei Ecken (R16), zwei Kehlen (R10), zwei Haelften des Sitzes (R22) — sieben
  // Boegen, ein Teilzug. Zwei Teilzuege waeren zwei Formen, und genau das soll es
  // nicht sein.
  assert.equal((d.match(/A /g) || []).length, 7)
  assert.equal((d.match(/M /g) || []).length, 1)
  assert.equal((d.match(/Z/g) || []).length, 1)
  // Beide Kehlen laufen gegen den Uhrzeigersinn (Sweep 0) — sie sind konkav. Alle
  // anderen Boegen laufen mit (Sweep 1). Ein konvexer Fillet waere eine Beule.
  assert.equal((d.match(/A 10 10 0 0 0 /g) || []).length, 2)
  assert.equal((d.match(/A 22 22 0 0 1 /g) || []).length, 2)
})

test('Der Hals verschiebt nur den Koerper — der Sitz bleibt, wo der Orb ist', () => {
  const ohne = blasenGeometrie({ links: 0, rechts: 380, oben: 0, unten: 560 })
  const mit = blasenGeometrie({ links: 0, rechts: 380, oben: 0, unten: 660, halsL: 100 })
  assert.deepEqual(mit.sitz, ohne.sitz, 'Der Sitz wandert mit dem Hals')
  assert.deepEqual(mit.sitzRechts, ohne.sitzRechts)
  assert.deepEqual(mit.sitzOben, ohne.sitzOben)
  assert.deepEqual(mit.kopfSitz, ohne.kopfSitz, 'Die Kopfkehle setzt woanders am Sitz an')
  // Die Oberkante des Koerpers rutscht um genau die Halslaenge nach unten.
  assert.ok(Math.abs((mit.kante - ohne.kante) - 100) < NAH)
  // Und der gerade Teil des Halses ist genau so lang wie bestellt.
  assert.ok(Math.abs((mit.halsFuss - mit.halsKopf) - 100) < NAH)
  assert.ok(Math.abs(ohne.halsFuss - ohne.halsKopf) < NAH)
})

test('Der Hals waechst mit — bei Bild eins ist er null', () => {
  // Sonst stuende zuerst ein langer Stiel da und die Blase kaeme hinterher. Das waere
  // ein Ausfahren, kein Herauswachsen — und genau das Herauswachsen gefaellt Jakob.
  const masse = p => blasenMasse({ breite: 380, hoehe: 708, hals: 120, pBreite: p, pHoehe: p })
  assert.equal(masse(0).halsL, 0)
  assert.equal(masse(1).halsL, 120)
  assert.ok(masse(0.5).halsL > 0 && masse(0.5).halsL < 120)
  // Am Ende steht der Kasten genau im SVG — der Hals hat ihn nicht laenger gemacht.
  assert.ok(Math.abs(masse(1).unten - (708 - 0.5)) < NAH)
  // Und am Anfang ist der Koerper genau die Mindesthoehe, ohne Hals darueber.
  assert.ok(Math.abs((masse(0).unten - masse(0).oben) - MINDEST_HOEHE) < NAH)

  // Der Hals zaehlt nicht zum Koerper: was er belegt, muss zusaetzlich da sein.
  assert.equal(blaseIstMoeglich(380, MINDEST_HOEHE + 120 + 1, 0.5, 120), true)
  assert.equal(blaseIstMoeglich(380, MINDEST_HOEHE + 120, 0.5, 120), false)
})

test('Beim Wachsen ruehren sich die rechte und die obere Kante nicht', () => {
  // Das ist der ganze Kern: der Ursprung ist kein Punkt, an dem eine Transformation
  // ansetzt, sondern die zwei Kanten, die konstant bleiben. Sie SIND der Orb — und
  // deshalb kann die Verbindung waehrend des Wachsens gar nicht abreissen.
  const masse = p => blasenMasse({ breite: 380, hoehe: 560, pBreite: p, pHoehe: p })
  const rechteKanten = [0, 0.25, 0.5, 0.75, 1].map(p => masse(p).rechts)
  const obereKanten = [0, 0.25, 0.5, 0.75, 1].map(p => masse(p).oben)
  assert.deepEqual(new Set(rechteKanten).size, 1, `Die rechte Kante wandert: ${rechteKanten}`)
  assert.deepEqual(new Set(obereKanten).size, 1, `Die obere Kante wandert: ${obereKanten}`)

  // Und in JEDEM Zwischenzustand sitzt der Sitzkreis am selben Fleck.
  for (const p of [0, 0.4, 1]) {
    const g = blasenGeometrie(masse(p))
    assert.ok(Math.abs(g.sitz.x - (380 - 0.5 - SITZ_R)) < NAH)
    assert.ok(Math.abs(g.sitz.y - (0.5 + SITZ_R)) < NAH)
  }

  // Klein heisst Mindestgroesse, gross heisst der ganze Kasten — jeweils um den halben
  // Strich eingezogen, damit die Haarlinie nicht am SVG-Rand halbiert wird.
  const klein = masse(0)
  assert.ok(Math.abs((klein.rechts - klein.links) - MINDEST_BREITE) < NAH)
  assert.ok(Math.abs((klein.unten - klein.oben) - MINDEST_HOEHE) < NAH)
  const gross = masse(1)
  assert.deepEqual(gross, { links: 0.5, rechts: 379.5, oben: 0.5, unten: 559.5, halsL: 0 })
})

test('Aufgehen fuehrt die Breite, Zugehen fuehrt die Hoehe', () => {
  const auf = { dauerBreite: 240, dauerHoehe: 360 }
  const zu = { dauerBreite: 240, dauerHoehe: 180 }

  // Die Reihenfolge kehrt sich um. Beim Wachsen ist die Breite die kuerzere Strecke,
  // also blueht die Blase zur Seite auf und dann nach unten. Beim Zuruecknehmen zieht
  // sich die lange Achse zuerst ein — das liest sich als Zusammenfalten und nicht als
  // dasselbe Video rueckwaerts.
  assert.ok(auf.dauerBreite < auf.dauerHoehe, 'Beim Aufgehen muss die Breite frueher fertig sein')
  assert.ok(zu.dauerHoehe < zu.dauerBreite, 'Beim Zugehen muss die Hoehe frueher fertig sein')
  assert.equal(BEWEGUNG.auf.hoehe, '--dur-slow')
  assert.equal(BEWEGUNG.zu.hoehe, '--dur-quick')
  assert.equal(BEWEGUNG.auf.breite, '--dur-normal')
  assert.equal(BEWEGUNG.zu.breite, '--dur-normal')

  const start = blasenFortschritt({ t: 0, auf: true, ...auf })
  assert.deepEqual(start, { breite: 0, hoehe: 0 })
  const ende = blasenFortschritt({ t: 360, auf: true, ...auf })
  assert.deepEqual(ende, { breite: 1, hoehe: 1 })

  const mitte = blasenFortschritt({ t: 120, auf: true, ...auf })
  assert.ok(mitte.breite > mitte.hoehe, 'Die Breite muss beim Aufgehen vorauslaufen')

  const zuStart = blasenFortschritt({ t: 0, auf: false, ...zu })
  assert.deepEqual(zuStart, { breite: 1, hoehe: 1 })
  const zuEnde = blasenFortschritt({ t: 240, auf: false, ...zu })
  assert.deepEqual(zuEnde, { breite: 0, hoehe: 0 })
  const zuMitte = blasenFortschritt({ t: 90, auf: false, ...zu })
  assert.ok(zuMitte.hoehe < zuMitte.breite, 'Die Hoehe muss beim Zugehen vorauslaufen')
})

test('Die Kurven rechnen, was motion.css verspricht', () => {
  for (const [name, kurve] of [['standard', kurveStandard], ['out', kurveOut]]) {
    assert.equal(kurve(0), 0, `${name} startet nicht bei 0`)
    assert.equal(kurve(1), 1, `${name} endet nicht bei 1`)
    let vorher = 0
    for (let i = 1; i <= 100; i += 1) {
      const wert = kurve(i / 100)
      assert.ok(wert >= vorher - 1e-9, `${name} laeuft bei ${i}% zurueck`)
      vorher = wert
    }
  }

  // Der gerechnete Unterschied, wegen dem --ease-standard gewaehlt wurde: --ease-out
  // legt bei einem Fuenftel der Zeit schon fast drei Viertel der Strecke zurueck. Bei
  // einem 6px-Hinweis ist das richtig, bei einer 380x560-Flaeche ist es ein Knall.
  assert.ok(kurveOut(0.2) > 0.7, `--ease-out bei 20%: ${kurveOut(0.2)}`)
  assert.ok(kurveStandard(0.2) > 0.4 && kurveStandard(0.2) < 0.6, `--ease-standard bei 20%: ${kurveStandard(0.2)}`)

  // Und das Fangnetz haelt auch eine Kurve mit flacher Stelle aus.
  const flach = machKurve(1, 0, 0, 1)
  assert.ok(Math.abs(flach(0.5) - 0.5) < 0.02, `Die symmetrische Kurve verfehlt die Mitte: ${flach(0.5)}`)
})
