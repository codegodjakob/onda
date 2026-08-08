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

// DIE BREITE DES HALSES. Schmaler als der Sitz, und das ist am laufenden Programm
// entschieden, nicht ausgedacht: ein Hals in Sitzbreite (44px) ist bei 40px Laenge
// noch schoen — bei den 148px, die eine mittig sitzende Blase braucht, ist er ein
// 44px breiter Streifen ueber die halbe Fensterhoehe, und das liest sich wie ein
// falsch gezeichnetes Fenster, nicht wie eine Verbindung. 28px ist die Breite, bei
// der die Strecke wieder ein Hals ist und der Sitz trotzdem sichtbar darauf steht.
export const HALS_B = 28
// Die Kehle am KOPF des Halses. Derselbe Radius wie am Fuss: der Hals setzt oben an
// wie unten. Bei einem Hals in Sitzbreite faellt sie von selbst auf null zusammen —
// dann ist die Halskante die Tangente des Sitzes, und es gab hier nie einen Bogen.
export const KOPF_R = KEHL_R

// Wie weit unter der Sitzmitte die Kopfkehle die Halskante erreicht. Gerechnet, nicht
// gemessen: Kehle und Sitz beruehren sich von aussen, ihre Mittelpunkte haben also den
// Abstand SITZ_R + KOPF_R, und der Kehlmittelpunkt liegt KOPF_R neben der Halskante.
// Der Satz des Pythagoras auf dieses Dreieck, mehr ist es nicht.
export const KOPF_VERSATZ = kopfVersatz(SITZ_R, KOPF_R, HALS_B)

// Die Schulter: vom oberen Kastenrand bis zur Oberkante des Koerpers, wenn der gerade
// Teil des Halses null lang ist. Sitz, Kopfkehle und Fusskehle brauchen diese Strecke
// ohnehin. Steht auch in style.css als --blase-schulter — onda-design-contract.test.mjs
// haelt beide Zahlen zusammen, damit die Mitte nicht auf zwei Rechnungen beruht.
export const SCHULTER = SITZ_R + KOPF_VERSATZ + KEHL_R

// Kleinste Groesse, bei der der Pfad noch aufgeht: darunter wuerden sich Eckbogen und
// Kehle ueberschneiden und der Pfad schluege Haken. Beides gilt fuer den KOERPER der
// Blase — der gerade Teil des Halses kommt oben drauf und hat keine Untergrenze.
// In der Breite setzt seit dem schlanken Hals ER die Grenze und nicht mehr der Sitz:
// die Oberkante muss von der Ecke bis zur Fusskehle reichen, und beide haengen am
// Hals. Der Sitz darf breiter sein als der Koerper — er sitzt ja darueber.
export const MINDEST_BREITE = HALS_B + KEHL_R + ECK_R
export const MINDEST_HOEHE = SCHULTER + 2 * ECK_R

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
// `halsL` ist die Laenge des Halses: die Strecke, um die der KOERPER unter den Sitz
// rutscht. Der Sitz bleibt, wo er ist — er IST der Orb, und der Orb sitzt in der
// Topbar. Bei halsL = 0 kommt exakt die Silhouette von vorher heraus, weil dann
// halsLinks und sitzLinks derselbe Punkt sind.
export function blasenGeometrie({
  links, rechts, oben = 0, unten, halsL = 0,
  sitzR = SITZ_R, eckR = ECK_R, kehlR = KEHL_R, halsB = HALS_B, kopfR = KOPF_R,
}) {
  // Die RECHTE Halskante ist die rechte Panelkante — dieselbe Senkrechte, die auch den
  // Sitz an seinem rechtesten Punkt beruehrt. Sie laeuft in einem Zug vom Sitz bis in
  // die untere rechte Ecke, und deshalb kann die Verbindung zum Orb waehrend des
  // Wachsens gar nicht abreissen. Nur die LINKE Halskante ist neu, und nur sie braucht
  // an beiden Enden eine Kehle.
  const mitteX = rechts - sitzR
  const kanteX = rechts - halsB
  const versatz = kopfVersatz(sitzR, kopfR, halsB)
  // Wo der gerade Teil des Halses anfaengt und aufhoert.
  const halsKopf = oben + sitzR + versatz
  const halsFuss = halsKopf + halsL
  // Oberkante des Panelkoerpers. Der Sitz ragt darueber hinaus — er ist der Orb.
  const kante = halsFuss + kehlR
  // Der Beruehrpunkt von Kopfkehle und Sitz liegt auf der Verbindung der beiden
  // Mittelpunkte, im Abstand sitzR vom Sitzmittelpunkt. Das ist die Stelle, an der
  // beide Bogen dieselbe Tangente haben — also keine Ecke entsteht.
  const spanne = sitzR + kopfR
  return {
    links, rechts, oben, unten, kante, halsL, halsKopf, halsFuss,
    sitzR, eckR, kehlR, halsB, kopfR,
    sitz: { x: mitteX, y: oben + sitzR, r: sitzR },
    kehle: { x: kanteX - kehlR, y: halsFuss, r: kehlR },
    kopfkehle: { x: kanteX - kopfR, y: halsKopf, r: kopfR },
    // Wo der Sitz die rechte Panelkante beruehrt: dort steht seine Tangente
    // senkrecht, genau wie die Kante selbst.
    sitzRechts: { x: rechts, y: oben + sitzR },
    sitzOben: { x: mitteX, y: oben },
    // Wo Kopfkehle und Sitz sich treffen. Bei einem Hals in Sitzbreite faellt der
    // Punkt auf den linken Scheitel des Sitzes, und die Kopfkehle wird null lang.
    kopfSitz: {
      x: mitteX - sitzR * (halsB - sitzR + kopfR) / spanne,
      y: oben + sitzR + sitzR * versatz / spanne,
    },
    // Wo die Kopfkehle die Halskante erreicht — von hier laeuft der Hals gerade.
    kopfHals: { x: kanteX, y: halsKopf },
    // Wo der Hals in die Fusskehle laeuft.
    halsLinks: { x: kanteX, y: halsFuss },
    // Wo die Kehle in die Panel-Oberkante laeuft: dort waagerecht, wie die Kante.
    kehleUnten: { x: kanteX - kehlR, y: kante },
  }
}

// Aus der aeusseren Beruehrung zweier Kreise. Steht als KOPF_VERSATZ auch fuer die
// Hausmasse bereit; als Funktion, damit die Geometrie auch mit anderen Massen aufgeht.
function kopfVersatz(sitzR, kopfR, halsB) {
  const kathete = halsB - sitzR + kopfR
  return Math.sqrt(Math.max(0, (sitzR + kopfR) ** 2 - kathete ** 2))
}

// Eine durchgehende Silhouette, im Uhrzeigersinn: rechte Kante hinunter, um den
// unteren Rand, die linke Kante hinauf, die Oberkante entlang nach rechts, dann die
// konkave Fusskehle in den Hals, den Hals hinauf, die Kopfkehle in den Sitzkreis und
// ueber ihn zurueck zum Anfang.
export function blasenPfad(masse) {
  const g = blasenGeometrie(masse)
  const { links, rechts, oben, unten, kante, sitzR, eckR, kehlR, kopfR } = g
  return [
    `M ${rund(rechts)} ${rund(oben + sitzR)}`,
    `V ${rund(unten - eckR)}`,
    `A ${eckR} ${eckR} 0 0 1 ${rund(rechts - eckR)} ${rund(unten)}`,
    `H ${rund(links + eckR)}`,
    `A ${eckR} ${eckR} 0 0 1 ${rund(links)} ${rund(unten - eckR)}`,
    `V ${rund(kante + eckR)}`,
    `A ${eckR} ${eckR} 0 0 1 ${rund(links + eckR)} ${rund(kante)}`,
    `H ${rund(g.kehleUnten.x)}`,
    `A ${kehlR} ${kehlR} 0 0 0 ${rund(g.halsLinks.x)} ${rund(g.halsLinks.y)}`,
    // Die linke Halskante. Bei einem geraden Hals von null Laenge ist sie null Pixel
    // lang, und die beiden Kehlen sitzen unmittelbar aufeinander.
    `V ${rund(g.kopfHals.y)}`,
    `A ${kopfR} ${kopfR} 0 0 0 ${rund(g.kopfSitz.x)} ${rund(g.kopfSitz.y)}`,
    `A ${sitzR} ${sitzR} 0 0 1 ${rund(g.sitzOben.x)} ${rund(g.sitzOben.y)}`,
    `A ${sitzR} ${sitzR} 0 0 1 ${rund(g.sitzRechts.x)} ${rund(g.sitzRechts.y)}`,
    'Z',
  ].join(' ')
}

// Unterhalb der Mindestmasse gibt es keine Silhouette, die aufgeht. Der Hals zaehlt
// nicht mit: er ist Strecke, kein Koerper. Was uebrig bleibt, muss der Koerper sein.
export function blaseIstMoeglich(breite, hoehe, einzug = 0.5, hals = 0) {
  return breite - 2 * einzug >= MINDEST_BREITE && hoehe - 2 * einzug - hals >= MINDEST_HOEHE
}

// Die Masse eines Zwischenzustands. `einzug` ist kein Zufall: stroke-width:1 zeichnet
// 0,5px innen und 0,5px aussen. Ohne den Einzug schneidet der SVG-Rand die aeussere
// Haelfte weg, und die Haarlinie saehe an den Raendern duenner aus als in der Kehle.
export function blasenMasse({ breite, hoehe, pBreite, pHoehe, hals = 0, einzug = 0.5 }) {
  // Erst einziehen, dann wachsen lassen. Andersherum waere die kleinste gezeichnete
  // Form um 2 x einzug kleiner als die Mindestgroesse — und genau dort schlaegt der
  // Pfad Haken, weil Eckbogen und Kehle sich ueberschneiden.
  const rechts = breite - einzug
  const oben = einzug
  const b = MINDEST_BREITE + Math.max(0, breite - 2 * einzug - MINDEST_BREITE) * pBreite
  // Der Hals gehoert zur Hoehe des Kastens, nicht zum Koerper. Erst abziehen, sonst
  // wuechse der Koerper in den Hals hinein und die Blase waere am Ende zu lang.
  const koerper = Math.max(0, hoehe - 2 * einzug - hals)
  const h = MINDEST_HOEHE + Math.max(0, koerper - MINDEST_HOEHE) * pHoehe
  // Der Hals waechst MIT. Stuende er von Bild 1 an in voller Laenge da, saehe man
  // zuerst einen langen Stiel mit einem Knopf daran und erst danach die Blase — das
  // waere kein Herauswachsen mehr, sondern ein Ausfahren. Er haengt an der Hoehe,
  // weil er Hoehe ist: die Blase blueht erst zur Seite auf und greift dann nach unten.
  const halsL = hals * pHoehe
  return { links: rechts - b, rechts, oben, unten: oben + halsL + h, halsL }
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

// Dieselbe Haltung wie bei tokenDauer: die Halslaenge steht in style.css und wird von
// dort gelesen, nicht hier abgeschrieben. Damit gilt automatisch, was der Umschalter
// gerade eingestellt hat, und die Fensterhoehe rechnet CSS aus, nicht JS.
export function tokenLaenge(name, element) {
  if (!element) return 0
  const zahl = parseFloat(getComputedStyle(element).getPropertyValue(name))
  return Number.isFinite(zahl) ? Math.max(0, zahl) : 0
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
  let hals = 0
  return {
    svg,
    setzeMasse(neueBreite, neueHoehe, neuerHals = 0) {
      breite = neueBreite
      hoehe = neueHoehe
      hals = neuerHals
      svg.style.width = `${neueBreite}px`
      svg.style.height = `${neueHoehe}px`
      svg.setAttribute('viewBox', `0 0 ${neueBreite} ${neueHoehe}`)
    },
    get breite() { return breite },
    get hoehe() { return hoehe },
    get hals() { return hals },
    zeichne(pBreite, pHoehe) {
      const d = blasenPfad(blasenMasse({ breite, hoehe, pBreite, pHoehe, hals }))
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
