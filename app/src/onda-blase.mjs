// Die Sprechblase waechst aus dem Orb.
//
// WARUM KEIN transform: scale(). Der naheliegende Weg waere ein Zoom mit
// transform-origin am Orb, und er waere falsch. Ein Zoom skaliert alles mit: die
// Schrift (400px breiter Text, auf 12% gestaucht und wieder aufgezogen — das
// flimmert), die Eckradien (aus 16px werden zwischendurch 2px, die Ecke atmet) und
// die Haarlinie (aus 1px werden 0,12px, sie verschwindet und kommt wieder). Das ist
// ein Zoom, kein Wachsen.
//
// Stattdessen waechst die GEOMETRIE. Der Kasten hat von der ersten Sekunde an seine
// Endgroesse, nur der gezeichnete Pfad waechst darin. Der Ursprung ist deshalb kein
// Punkt, an dem eine Transformation ansetzt, sondern die zwei Kanten, die im Pfad
// konstant bleiben: die rechte und die obere. Sie SIND der Orb. Und weil der
// Sitzkreis in JEDEM Zwischenzustand im Pfad steht, kann die Verbindung zum Orb
// waehrend des Wachsens gar nicht abreissen.
//
// WARUM SVG UND NICHT border-radius ODER clip-path. Die Kehle zwischen Sitzkreis und
// Panelkante ist konkav — einen negativen Radius gibt es in CSS nicht. Und ein Clip
// schneidet, er zeichnet nicht: mit clip-path verlaere man die Haarlinie (stroke) und
// den Schatten. Ein SVG-Pfad kann beides, und sein drop-shadow folgt der Silhouette
// statt dem Rechteck.

// Der Sitz IST der Orb: 44px Tastflaeche, also R22. Kein gewaehlter Wert, ein
// abgeleiteter. Der sichtbare Farbkreis des Orbs ist R15 — bleibt ein Kragen von 7px
// ringsum, dieselbe Anmutung wie im Design System (6px bei 36/48).
export const SITZ_R = 22
// --radius-overlay: dieselbe Ecke wie jedes andere schwebende Fenster.
export const ECK_R = 16
// --radius-panel: die konkave Kehle, die den Sitz in die Panelkante fuehrt.
export const KEHL_R = 10

// Kleinste Groesse, bei der der Pfad noch aufgeht: darunter wuerden sich Eckbogen und
// Kehle ueberschneiden und der Pfad schluege Haken.
export const MINDEST_BREITE = 2 * SITZ_R + KEHL_R + ECK_R
export const MINDEST_HOEHE = SITZ_R + KEHL_R + 2 * ECK_R

// Die Bewegung. Beide Richtungen benutzen --ease-standard, in motion.css woertlich
// "movement across the canvas" — und eine Blase, die aus einem 44px-Orb eine
// 380x560-Flaeche wird, IST Bewegung ueber die Flaeche. --ease-out (der Standard fuer
// kleine Hinweise) legt bei 240ms 78% der Strecke in den ersten 53ms zurueck; auf
// dieser Groesse ist das ein Knall mit Nachlauf. --ease-spring ist gesperrt: ein
// Ueberschwingen hiesse hier, dass die Flaeche ueber ihre Endgroesse hinauslaeuft und
// zurueckschnappt — auf einer 1px-Haarlinie ein sichtbares Zittern.
//
// Beim Wachsen fuehrt die BREITE (kuerzere Strecke, gleicher Start — daraus wird von
// selbst ein Aufbluehen zur Seite und dann nach unten, ohne erfundenen Versatz).
// Beim Zuruecknehmen fuehrt die HOEHE: die lange Achse zieht sich zuerst ein, dann
// schliesst sich die Breite in die Scheibe. Das liest sich als Zusammenfalten und
// nicht als dasselbe Video rueckwaerts. Zugehen (240ms) ist kuerzer als Aufgehen
// (360ms) — Weggehen darf nicht so lange dauern wie Ankommen.
export const BEWEGUNG = {
  auf: { breite: '--dur-normal', hoehe: '--dur-slow' },
  zu: { breite: '--dur-normal', hoehe: '--dur-quick' },
}

function rund(wert) {
  return Math.round(wert * 100) / 100
}

// Alle Eckpunkte und Kreismittelpunkte der Silhouette, in Bildschirmkoordinaten des
// Blasenkastens (Ursprung oben links). `rechts` und `oben` sind die Kanten, die der
// Orb festhaelt; `links` und `unten` sind die, die wachsen.
export function blasenGeometrie({
  links, rechts, oben = 0, unten,
  sitzR = SITZ_R, eckR = ECK_R, kehlR = KEHL_R,
}) {
  // Oberkante des Panelkoerpers. Der Sitz ragt darueber hinaus — er ist der Orb.
  const kante = oben + sitzR + kehlR
  return {
    links, rechts, oben, unten, kante, sitzR, eckR, kehlR,
    sitz: { x: rechts - sitzR, y: oben + sitzR, r: sitzR },
    kehle: { x: rechts - 2 * sitzR - kehlR, y: oben + sitzR, r: kehlR },
    // Wo der Sitz die rechte Panelkante beruehrt: dort steht seine Tangente
    // senkrecht, genau wie die Kante selbst.
    sitzRechts: { x: rechts, y: oben + sitzR },
    sitzOben: { x: rechts - sitzR, y: oben },
    // Wo Sitz und Kehle sich treffen: beide haben dort eine senkrechte Tangente.
    sitzLinks: { x: rechts - 2 * sitzR, y: oben + sitzR },
    // Wo die Kehle in die Panel-Oberkante laeuft: dort waagerecht, wie die Kante.
    kehleUnten: { x: rechts - 2 * sitzR - kehlR, y: kante },
  }
}

// Eine durchgehende Silhouette, im Uhrzeigersinn: rechte Kante hinunter, um den
// unteren Rand, die linke Kante hinauf, die Oberkante entlang nach rechts, dann die
// konkave Kehle hinauf in den Sitzkreis und ueber ihn zurueck zum Anfang.
export function blasenPfad(masse) {
  const g = blasenGeometrie(masse)
  const { links, rechts, oben, unten, kante, sitzR, eckR, kehlR } = g
  return [
    `M ${rund(rechts)} ${rund(oben + sitzR)}`,
    `V ${rund(unten - eckR)}`,
    `A ${eckR} ${eckR} 0 0 1 ${rund(rechts - eckR)} ${rund(unten)}`,
    `H ${rund(links + eckR)}`,
    `A ${eckR} ${eckR} 0 0 1 ${rund(links)} ${rund(unten - eckR)}`,
    `V ${rund(kante + eckR)}`,
    `A ${eckR} ${eckR} 0 0 1 ${rund(links + eckR)} ${rund(kante)}`,
    `H ${rund(g.kehleUnten.x)}`,
    `A ${kehlR} ${kehlR} 0 0 0 ${rund(g.sitzLinks.x)} ${rund(g.sitzLinks.y)}`,
    `A ${sitzR} ${sitzR} 0 0 1 ${rund(g.sitzOben.x)} ${rund(g.sitzOben.y)}`,
    `A ${sitzR} ${sitzR} 0 0 1 ${rund(g.sitzRechts.x)} ${rund(g.sitzRechts.y)}`,
    'Z',
  ].join(' ')
}

// Unterhalb der Mindestmasse gibt es keine Silhouette, die aufgeht.
export function blaseIstMoeglich(breite, hoehe, einzug = 0.5) {
  return breite - 2 * einzug >= MINDEST_BREITE && hoehe - 2 * einzug >= MINDEST_HOEHE
}

// Die Masse eines Zwischenzustands. `einzug` ist kein Zufall: stroke-width:1 zeichnet
// 0,5px innen und 0,5px aussen. Ohne den Einzug schneidet der SVG-Rand die aeussere
// Haelfte weg, und die Haarlinie saehe an den Raendern duenner aus als in der Kehle.
export function blasenMasse({ breite, hoehe, pBreite, pHoehe, einzug = 0.5 }) {
  // Erst einziehen, dann wachsen lassen. Andersherum waere die kleinste gezeichnete
  // Form um 2 x einzug kleiner als die Mindestgroesse — und genau dort schlaegt der
  // Pfad Haken, weil Eckbogen und Kehle sich ueberschneiden.
  const rechts = breite - einzug
  const oben = einzug
  const b = MINDEST_BREITE + Math.max(0, breite - 2 * einzug - MINDEST_BREITE) * pBreite
  const h = MINDEST_HOEHE + Math.max(0, hoehe - 2 * einzug - MINDEST_HOEHE) * pHoehe
  return { links: rechts - b, rechts, oben, unten: oben + h }
}

// Ein cubic-bezier(x1,y1,x2,y2) als Funktion: Fortschritt der Zeit rein, Fortschritt
// der Strecke raus. Newton mit Halbierung als Fangnetz — Newton allein kann bei einer
// flachen Stelle danebengreifen, und ein falscher Wert waere hier ein sichtbarer Ruck.
export function machKurve(x1, y1, x2, y2) {
  const beiT = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t * t * b + t ** 3
  const steigung = t => 3 * (1 - t) ** 2 * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2)
  return x => {
    if (!(x > 0)) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 6; i += 1) {
      const fehler = beiT(t, x1, x2) - x
      if (Math.abs(fehler) < 1e-7) return beiT(t, y1, y2)
      const m = steigung(t)
      if (!(Math.abs(m) > 1e-6)) break
      t = Math.min(1, Math.max(0, t - fehler / m))
    }
    let unten = 0
    let oben = 1
    for (let i = 0; i < 30; i += 1) {
      t = (unten + oben) / 2
      if (beiT(t, x1, x2) < x) unten = t
      else oben = t
    }
    return beiT(t, y1, y2)
  }
}

export const kurveStandard = machKurve(0.2, 0, 0, 1)
export const kurveOut = machKurve(0.16, 1, 0.3, 1)

// Der Fortschritt beider Achsen zu einem Zeitpunkt. Beim Zugehen laeuft er rueckwaerts
// durch dieselbe Kurve — nicht die Kurve rueckwaerts gelesen: --ease-out rueckwaerts
// waere ease-in, die Blase stuende nach dem Klick 150ms fast still und ginge dann weg.
// Ein Schliessen muss innerhalb eines Bildes bestaetigt sein.
export function blasenFortschritt({ t, auf, dauerBreite, dauerHoehe, kurve = kurveStandard }) {
  const anteil = (zeit, dauer) => (dauer > 0 ? Math.min(1, Math.max(0, zeit / dauer)) : 1)
  const pb = kurve(anteil(t, dauerBreite))
  const ph = kurve(anteil(t, dauerHoehe))
  return auf ? { breite: pb, hoehe: ph } : { breite: 1 - pb, hoehe: 1 - ph }
}

// Die Dauer aus dem Token lesen statt sie abzuschreiben. Damit gilt automatisch, was
// in motion.css steht — auch die Verkuerzung auf 1ms bei prefers-reduced-motion.
export function tokenDauer(name, wurzel = document.documentElement) {
  const roh = getComputedStyle(wurzel).getPropertyValue(name)
  const zahl = parseFloat(roh)
  if (!Number.isFinite(zahl)) return 0
  return /ms/.test(roh) || !/s/.test(roh) ? zahl : zahl * 1000
}

// Die Kontur als Zeichengeraet: sie kennt ihre zwei Pfade und ihre Endmasse und kann
// jeden Zwischenzustand zeichnen. Pro Bild eine Zeichenkette und zwei setAttribute —
// kein Layout, kein Reflow, der Text im Panel wird nicht ein einziges Mal neu
// umbrochen.
export function erzeugeKontur(svg) {
  const pfad = svg?.querySelector('.onda-blase__pfad')
  const schnitt = svg?.querySelector('.onda-blase__schnitt')
  if (!pfad || !schnitt) return null
  let breite = 0
  let hoehe = 0
  return {
    svg,
    setzeMasse(neueBreite, neueHoehe) {
      breite = neueBreite
      hoehe = neueHoehe
      svg.style.width = `${neueBreite}px`
      svg.style.height = `${neueHoehe}px`
      svg.setAttribute('viewBox', `0 0 ${neueBreite} ${neueHoehe}`)
    },
    get breite() { return breite },
    get hoehe() { return hoehe },
    zeichne(pBreite, pHoehe) {
      const d = blasenPfad(blasenMasse({ breite, hoehe, pBreite, pHoehe }))
      pfad.setAttribute('d', d)
      // Derselbe Pfad schneidet den Inhalt zu: was noch nicht gewachsen ist, ist auch
      // nicht zu sehen. Sonst haenge der Text unten aus der kleinen Blase heraus.
      schnitt.setAttribute('d', d)
      return d
    },
  }
}

// Der Antrieb. Eine rAF-Schleife statt einer CSS-Transition, weil sich pro Bild eine
// Pfadbeschreibung aendert und keine animierbare Eigenschaft.
export function laesseBlaseWachsen(kontur, {
  auf,
  kurve = kurveStandard,
  ruhig = false,
  dauerBreite,
  dauerHoehe,
  fertig,
} = {}) {
  const endBreite = auf ? 1 : 0
  const laengste = Math.max(dauerBreite || 0, dauerHoehe || 0)
  // Wer keine Bewegung will, bekommt keine: der Endzustand, sofort. Diese Abfrage ist
  // die einzige Schicht, die bei einer JS-Animation wirklich zaehlt — CSS greift hier
  // nicht. Die Token-Pruefung faengt es zusaetzlich ab, falls jemand matchMedia umgeht.
  if (ruhig || laengste < 20) {
    kontur.zeichne(endBreite, endBreite)
    fertig?.()
    return () => {}
  }
  const start = performance.now()
  let bild = 0
  const schritt = jetzt => {
    const t = jetzt - start
    const p = blasenFortschritt({ t, auf, dauerBreite, dauerHoehe, kurve })
    kontur.zeichne(p.breite, p.hoehe)
    if (t < laengste) {
      bild = requestAnimationFrame(schritt)
      return
    }
    kontur.zeichne(endBreite, endBreite)
    bild = 0
    fertig?.()
  }
  bild = requestAnimationFrame(schritt)
  return () => {
    if (bild) cancelAnimationFrame(bild)
    bild = 0
  }
}
