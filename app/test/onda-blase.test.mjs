import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BEWEGUNG,
  ECK_R,
  FORMEN,
  FORM_NAMEN,
  FUSS_R,
  HALS_HALB,
  KEHL_R,
  KOPF_R,
  KOPF_VERSATZ,
  MINDEST_BREITE,
  MINDEST_HOEHE,
  SCHULTER,
  SCHWUNG_R,
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
  // Der oberste Punkt des Sitzes ist zugleich Anfang und Ende des Pfades.
  assert.deepEqual(g.sitzOben, { x: 380 - 22, y: 0 })
})

test('Der Hals haengt mittig unter dem Orb', () => {
  // Jakobs Wunsch vom 8. August 2026, und er ist messbar: die Achse des Halses ist die
  // Achse des Orbs. Vorher lief die rechte Halskante mit der rechten Panelkante
  // zusammen — der Hals sass also unter der rechten Haelfte des Orbs.
  const g = blasenGeometrie({ links: 0, rechts: 380, oben: 0, unten: 660, halsL: 100 })
  const achse = (g.kopfHalsLinks.x + g.kopfHalsRechts.x) / 2
  assert.equal(achse, g.sitz.x, 'Der Hals haengt nicht unter der Mitte des Orbs')
  assert.equal(g.kopfHalsRechts.x - g.kopfHalsLinks.x, 2 * HALS_HALB)
  // Und er haengt SENKRECHT: beide Kanten fangen auf derselben Hoehe an und hoeren
  // auf derselben Hoehe auf.
  assert.equal(g.kopfHalsLinks.y, g.kopfHalsRechts.y)
  assert.equal(g.halsFussLinks.y, g.halsFussRechts.y)
})

test('Alle vier Uebergaenge sind echte Fillets — nirgends eine Ecke', () => {
  const g = blasenGeometrie({ links: 10, rechts: 380, oben: 4, unten: 660, halsL: 100 })

  // OBEN, beide Seiten: die Kehle beruehrt den Sitz von AUSSEN. Der Abstand der
  // Mittelpunkte ist die Summe der Radien, und der Beruehrpunkt liegt auf ihrer
  // Verbindung — genau dort haben beide Boegen dieselbe Tangente.
  for (const [kehle, sitzpunkt, halspunkt] of [
    [g.kopfkehleLinks, g.kopfSitzLinks, g.kopfHalsLinks],
    [g.kopfkehleRechts, g.kopfSitzRechts, g.kopfHalsRechts],
  ]) {
    assert.ok(Math.abs(abstand(g.sitz, kehle) - (SITZ_R + KOPF_R)) < NAH)
    assert.ok(Math.abs(abstand(g.sitz, sitzpunkt) - SITZ_R) < NAH)
    assert.ok(Math.abs(abstand(kehle, sitzpunkt) - KOPF_R) < NAH)
    // An der Halskante steht der Radiusvektor waagerecht, die Tangente also senkrecht.
    assert.ok(Math.abs(abstand(kehle, halspunkt) - KOPF_R) < NAH)
    assert.equal(halspunkt.y, kehle.y)
  }
  // Und die beiden Kehlen sitzen spiegelbildlich zur Orbmitte.
  assert.ok(Math.abs((g.kopfSitzLinks.x + g.kopfSitzRechts.x) / 2 - g.sitz.x) < NAH)
  assert.equal(g.kopfSitzLinks.y, g.kopfSitzRechts.y)

  // LINKS UNTEN: eine Kehle vom Hals in die Oberkante. Am Hals senkrechte Tangente,
  // an der Oberkante waagerechte.
  assert.ok(Math.abs(abstand(g.fusskehle, g.halsFussLinks) - FUSS_R) < NAH)
  assert.ok(Math.abs(abstand(g.fusskehle, g.fussUnten) - FUSS_R) < NAH)
  assert.equal(g.halsFussLinks.y, g.fusskehle.y)
  assert.equal(g.fussUnten.x, g.fusskehle.x)
  assert.equal(g.fussUnten.y, g.kante)

  // RECHTS UNTEN: das S. Zwei parallele Senkrechte — Halskante und Panelkante — lassen
  // sich nicht mit einem einzigen Bogen verbinden. Beide Boegen sind gleich gross, und
  // in der Mitte, wo sie sich treffen, steht die Tangente waagerecht.
  assert.ok(Math.abs(abstand(g.schwungOben, g.halsFussRechts) - SCHWUNG_R) < NAH)
  assert.ok(Math.abs(abstand(g.schwungOben, g.schwungMitte) - SCHWUNG_R) < NAH)
  assert.ok(Math.abs(abstand(g.schwungUnten, g.schwungMitte) - SCHWUNG_R) < NAH)
  assert.ok(Math.abs(abstand(g.schwungUnten, g.kanteRechts) - SCHWUNG_R) < NAH)
  assert.equal(g.schwungOben.x, g.schwungMitte.x, 'In der Mitte des S steht die Tangente schief')
  assert.equal(g.schwungUnten.x, g.schwungMitte.x)
  assert.equal(g.kanteRechts.x, g.rechts, 'Das S landet nicht auf der Panelkante')

  // BEIDE SCHULTERN FALLEN GLEICH TIEF. Sonst saesse die Blase schief unter ihrem Hals.
  assert.equal(g.kanteRechts.y, g.kante)
  assert.equal(2 * SCHWUNG_R, FUSS_R)
})

test('Bei den Mindestmassen laeuft kein Segment rueckwaerts', () => {
  assert.equal(MINDEST_BREITE, SITZ_R + HALS_HALB + FUSS_R + ECK_R)
  assert.equal(MINDEST_HOEHE, SCHULTER + 2 * ECK_R)
  // Die Schulter ist gerechnet, nicht gesetzt: Sitz, Kopfkehle, Fusskehle.
  assert.equal(SCHULTER, SITZ_R + KOPF_VERSATZ + FUSS_R)
  assert.ok(Math.abs(KOPF_VERSATZ - Math.sqrt((SITZ_R + KOPF_R) ** 2 - (HALS_HALB + KOPF_R) ** 2)) < NAH)
  assert.equal(KEHL_R, 10, 'KOPF_R haengt an --radius-panel')

  const g = blasenGeometrie({ links: 0, rechts: MINDEST_BREITE, oben: 0, unten: MINDEST_HOEHE })
  // Die Oberkante laeuft von links+ECK_R bis zum Kehlenanfang — genau bis dorthin und
  // keinen Pixel zurueck. Ein Pixel weniger, und der Pfad schluege einen Haken.
  assert.ok(g.fussUnten.x >= g.links + ECK_R, 'Die Oberkante laeuft rueckwaerts')
  // Die linke Kante laeuft von unten-ECK_R bis kante+ECK_R.
  assert.ok(g.unten - ECK_R >= g.kante + ECK_R, 'Die linke Kante laeuft rueckwaerts')
  // Und genau an der Mindestgroesse sind beide Strecken null: das IST die Untergrenze.
  assert.equal(g.fussUnten.x, g.links + ECK_R)
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
  assert.match(d, /^M 358 0 /, 'Der Pfad beginnt am obersten Punkt des Sitzes')
  assert.match(d, /Z$/, 'Der Pfad ist nicht geschlossen')
  // Drei Ecken (R16), zwei Kopfkehlen (R10), eine Fusskehle (R14), zwei Boegen im S
  // (R7), zwei Haelften des Sitzes (R22) — zehn Boegen, EIN Teilzug. Zwei Teilzuege
  // waeren zwei Formen, und genau das soll es nicht sein.
  assert.equal((d.match(/A /g) || []).length, 10)
  assert.equal((d.match(/M /g) || []).length, 1)
  assert.equal((d.match(/Z/g) || []).length, 1)
  // Alle Kehlen laufen gegen den Uhrzeigersinn (Sweep 0) — sie sind konkav. Ecken und
  // Sitz laufen mit (Sweep 1). Im S kommt beides genau einmal vor: erst konkav vom
  // Hals weg, dann konvex in die Kante hinein.
  assert.equal((d.match(/A 10 10 0 0 0 /g) || []).length, 2, 'Die Kopfkehlen sind nicht konkav')
  assert.equal((d.match(/A 14 14 0 0 0 /g) || []).length, 1, 'Die Fusskehle ist nicht konkav')
  assert.equal((d.match(/A 7 7 0 0 0 /g) || []).length, 1, 'Das S faengt nicht konkav an')
  assert.equal((d.match(/A 7 7 0 0 1 /g) || []).length, 1, 'Das S endet nicht konvex')
  assert.equal((d.match(/A 22 22 0 0 1 /g) || []).length, 2)
  assert.equal((d.match(/A 16 16 0 0 1 /g) || []).length, 3)
})

test('Die geschwungenen Halsformen kreuzen sich nie', () => {
  // Der Fehler, der beim ersten Versuch sofort passierte: die beiden Halskanten liefen
  // aneinander vorbei, und die Blase bekam eine Schlaufe. Ein kubischer Bogen liegt
  // immer INNERHALB der Huelle seiner vier Punkte — liegen alle vier auf ihrer Seite
  // der Taille, kann die Kurve die andere Seite gar nicht erreichen. Genau das wird
  // hier geprueft, und zwar ueber die ganze Spanne moeglicher Halslaengen.
  for (const name of FORM_NAMEN.filter(n => FORMEN[n].art === 'kurve')) {
    const taille = FORMEN[name].taille
    for (const halsL of [0, 40, 107, 200, 320]) {
      const d = blasenPfad({ links: 0, rechts: 380, oben: 0.5, unten: 700, halsL, form: name })
      const achse = 380 - SITZ_R
      const kurven = [...d.matchAll(/C ([\d.-]+) [\d.-]+ ([\d.-]+) [\d.-]+ ([\d.-]+) [\d.-]+/g)]
      assert.equal(kurven.length, 2, `${name}: ${kurven.length} Halskanten statt zwei`)
      const [rechts, links] = kurven.map(t => t.slice(1).map(Number))
      for (const x of rechts) {
        assert.ok(x - achse >= taille - 1e-6, `${name} bei Hals ${halsL}: die rechte Kante greift ueber die Taille`)
      }
      for (const x of links) {
        assert.ok(achse - x >= taille - 1e-6, `${name} bei Hals ${halsL}: die linke Kante greift ueber die Taille`)
      }
    }
  }
})

test('Die geschwungenen Halsformen setzen ohne Ecke am Orb an', () => {
  // Der Anfasser der Kurve muss auf der KREISTANGENTE liegen — nur dann laufen Kreis
  // und Kurve an der Nahtstelle in dieselbe Richtung. Gekuerzt werden darf er (das
  // haelt die Taille), gedreht nicht. Geprueft wird der Winkel zwischen dem Anfasser
  // und dem Radius: er muss 90 Grad sein.
  for (const name of FORM_NAMEN.filter(n => FORMEN[n].art === 'kurve')) {
    const d = blasenPfad({ links: 0, rechts: 380, oben: 0, unten: 700, halsL: 120, form: name })
    const sitz = { x: 380 - SITZ_R, y: SITZ_R }
    const kurven = [...d.matchAll(/C ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+) ([\d.-]+)/g)]
    // Rechts: der Pfad kommt vom Sitz und geht in die Kurve — Ansatzpunkt ist das Ende
    // des vorangehenden Sitzbogens, Anfasser ist der erste Kontrollpunkt.
    const sitzBoegen = [...d.matchAll(/A 22 22 0 0 1 ([\d.-]+) ([\d.-]+)/g)]
    const ansatzRechts = { x: Number(sitzBoegen[0][1]), y: Number(sitzBoegen[0][2]) }
    const griffRechts = { x: Number(kurven[0][1]), y: Number(kurven[0][2]) }
    // Links: die Kurve endet auf dem Sitz, der Anfasser ist der ZWEITE Kontrollpunkt.
    const ansatzLinks = { x: Number(kurven[1][5]), y: Number(kurven[1][6]) }
    const griffLinks = { x: Number(kurven[1][3]), y: Number(kurven[1][4]) }

    for (const [ansatz, griff, seite] of [[ansatzRechts, griffRechts, 'rechts'], [ansatzLinks, griffLinks, 'links']]) {
      assert.ok(Math.abs(abstand(sitz, ansatz) - SITZ_R) < 0.02,
        `${name} ${seite}: der Hals setzt nicht auf dem Sitzkreis an`)
      const radius = { x: ansatz.x - sitz.x, y: ansatz.y - sitz.y }
      const anfasser = { x: griff.x - ansatz.x, y: griff.y - ansatz.y }
      const laenge = Math.hypot(anfasser.x, anfasser.y)
      if (laenge < 0.01) continue
      // Gemessen wird am AUSGEGEBENEN Pfad, und der ist auf hundertstel Pixel gerundet.
      // Die Schranke muss diese Rundung uebersteigen, sonst prueft sie die Rundung und
      // nicht die Geometrie: 2 Tausendstel entsprechen einem Zehntel Grad — eine Ecke
      // dieser Groesse gibt es auf einem Bildschirm nicht.
      const skalar = (radius.x * anfasser.x + radius.y * anfasser.y) / (SITZ_R * laenge)
      assert.ok(Math.abs(skalar) < 2e-3,
        `${name} ${seite}: der Anfasser steht nicht senkrecht auf dem Radius (${skalar})`)
    }
  }
})

test('Der Hals verschiebt nur den Koerper — der Sitz bleibt, wo der Orb ist', () => {
  const ohne = blasenGeometrie({ links: 0, rechts: 380, oben: 0, unten: 560 })
  const mit = blasenGeometrie({ links: 0, rechts: 380, oben: 0, unten: 660, halsL: 100 })
  assert.deepEqual(mit.sitz, ohne.sitz, 'Der Sitz wandert mit dem Hals')
  assert.deepEqual(mit.sitzOben, ohne.sitzOben)
  assert.deepEqual(mit.kopfSitzLinks, ohne.kopfSitzLinks, 'Die Kehle setzt woanders am Sitz an')
  assert.deepEqual(mit.kopfSitzRechts, ohne.kopfSitzRechts)
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

  // Der Hals zaehlt nicht zum Koerper: was er belegt, muss zusaetzlich da sein. Nicht
  // auf den Pixel genau geprueft — MINDEST_HOEHE enthaelt eine Wurzel, und auf der
  // Grenze entscheidet dann die letzte Bitstelle statt der Geometrie.
  assert.equal(blaseIstMoeglich(380, MINDEST_HOEHE + 122, 0.5, 120), true)
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
