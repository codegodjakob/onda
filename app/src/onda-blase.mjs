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
// Punkt, an dem eine Transformation ansetzt, sondern der SITZKREIS, der in jedem
// Zwischenzustand an derselben Stelle im Pfad steht. Er IST der Orb — und deshalb kann
// die Verbindung waehrend des Wachsens gar nicht abreissen.
//
// DER HALS HAENGT MITTIG UNTER DEM ORB und heisst „Amphore". Jakob am 8. August 2026:
// "sie soll organisch aus dem orb rausfliessen und in die sprechblase mit weichen
// uebergaengen und der hals soll zentriert mittig in relation zum orb sein", dann
// "tendenziell eher wie säule aber so elegant wie taille", und schliesslich "amphore
// nehmen wir".
//
// Die Form ist an fuenf Fassungen entschieden worden, die auf einer Achse von breit
// (Taille 34) bis schlank (Taille 10) lagen. Amphore ist der dritte Punkt darauf. Die
// vier anderen sind fort, samt der aelteren Bauweise aus Geraden und Kehlen — was
// entschieden ist, muss nicht als Angebot herumliegen.
//
// JE EINE KURVE PRO HALSKANTE, vom Orb bis an den Koerper. Sie setzt an beiden Enden
// mit genau der Tangente an, die dort schon herrscht: am Orb die Kreistangente, am
// Koerper die Kante. Deshalb ist sie so knickfrei wie ein Fillet, aber frei in der
// Mitte — und nur dadurch gibt es ueberhaupt eine Taille.
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

// DIE FORM DES HALSES, in vier Zahlen. Sie sind an fuenf Fassungen entschieden, die auf
// einer Achse lagen; das hier ist die dritte davon.
//
//   WINKEL   wo der Hals den Orb verlaesst, gemessen vom rechtesten Punkt aus nach
//            unten. Gross heisst weit unten am Orb, also schmaler Ansatz.
//   TAILLE   wie schmal der Hals hoechstens wird, als halbe Breite. 11 heisst: an der
//            engsten Stelle ist er 22px breit.
//   GRIFF_*  wie lange die Kurve die Richtung ihres jeweiligen Endes beibehaelt, als
//            Anteil der Halslaenge. Am Orb laenger als am Koerper — deshalb sitzt die
//            engste Stelle im unteren Drittel und nicht in der Mitte.
//   FUSS_WEITE  wie weit links vom Orb die linke Kurve auf der Oberkante landet.
export const WINKEL = 10
export const TAILLE = 11
export const GRIFF_ORB = 0.55
export const GRIFF_KOERPER = 0.45
export const FUSS_WEITE = 44

// Die Schulter: vom oberen Kastenrand bis zur Oberkante des Koerpers, wenn der Hals
// null lang ist. Der Orb belegt davon 44px (2 x SITZ_R), der Rest ist der kuerzeste
// Weg, auf dem die Kurve den Kreis noch verlassen und sich zur Kante drehen kann. Steht
// auch in style.css als --blase-schulter — onda-design-contract.test.mjs haelt beide
// Zahlen zusammen, damit die Lage der Blase nicht auf zwei Rechnungen beruht.
export const SCHULTER = 62

// Kleinste Groesse, bei der der Pfad noch aufgeht: darunter wuerden sich Eckbogen und
// Kurve ueberschneiden und der Pfad schluege Haken. Beides gilt fuer den KOERPER der
// Blase — der Hals kommt oben drauf und hat keine Untergrenze. In der Breite muss die
// Oberkante von der linken Ecke bis zum Fusspunkt der Kurve reichen.
export const MINDEST_BREITE = SITZ_R + FUSS_WEITE + ECK_R
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

// Die wenigen Punkte, an denen die Silhouette haengt, in Bildschirmkoordinaten des
// Blasenkastens (Ursprung oben links). Der Sitz haengt an `rechts` und `oben` — das
// sind die Kanten des Orbs, und sie ruehren sich nie. `links` und `unten` wachsen.
export function blasenGeometrie({
  links, rechts, oben = 0, unten, halsL = 0, sitzR = SITZ_R, eckR = ECK_R,
}) {
  return {
    links, rechts, oben, unten, halsL, sitzR, eckR,
    // Die Mitte des Orbs — und damit die Achse des Halses, der symmetrisch daran haengt.
    sitz: { x: rechts - sitzR, y: oben + sitzR, r: sitzR },
    // Der oberste Punkt des Sitzes: dort faengt der Pfad an und dort hoert er auf.
    sitzOben: { x: rechts - sitzR, y: oben },
    // Die Oberkante des Koerpers. Der Hals verschiebt nur sie — der Sitz bleibt.
    kante: oben + SCHULTER + halsL,
  }
}

// DIE ANFASSER EINER HALSKANTE. `seite` ist +1 rechts und -1 links.
//
// DIE TAILLE IST EINE HARTE GRENZE, und sie muss es sein. Eine kubische Kurve liegt
// immer innerhalb der Huelle ihrer vier Punkte — halte ich alle vier auf ihrer Seite
// der Taille, kann die Kurve die andere Seite gar nicht erreichen. Ohne diese Schranke
// kreuzen sich die beiden Halskanten bei langen Haelsen, und die Blase bekommt eine
// Schlaufe. Gekuerzt wird der Anfasser, nicht seine RICHTUNG gedreht: die Richtung ist
// die Kreistangente, und nur weil sie stimmt, sitzt am Orb keine Ecke.
export function halsKurve(g, seite) {
  const bogen = (seite > 0 ? WINKEL : 180 - WINKEL) * Math.PI / 180
  const punkt = {
    x: g.sitz.x + g.sitzR * Math.cos(bogen),
    y: g.sitz.y + g.sitzR * Math.sin(bogen),
  }
  // Die Tangente des Sitzkreises an dieser Stelle, in Laufrichtung des Pfades (im
  // Uhrzeigersinn). Genau sie muss die Kurve uebernehmen, sonst entsteht eine Ecke.
  const tangente = { x: -Math.sin(bogen), y: Math.cos(bogen) }
  const strecke = Math.max(1, g.kante - punkt.y)
  const grenze = g.sitz.x + seite * TAILLE
  // Rechts laeuft der Anfasser mit -sin(bogen) nach links, links laeuft er (weil die
  // Kurve dort rueckwaerts gebaut wird) mit +sin(bogen) nach rechts. Beide Male also
  // auf die Achse zu, und beide Male ist sin(bogen) das Tempo.
  const tempo = Math.abs(Math.sin(bogen))
  const platz = Math.max(0, (punkt.x - grenze) * seite)
  const amOrb = tempo > 1e-6
    ? Math.min(strecke * GRIFF_ORB, platz / tempo)
    : strecke * GRIFF_ORB
  return { punkt, tangente, amOrb, amKoerper: strecke * GRIFF_KOERPER }
}

// Eine durchgehende Silhouette, im Uhrzeigersinn und in einem Zug. Sie faengt oben am
// Orb an, laeuft um seine rechte Haelfte herum, ueber die rechte Halskante hinunter in
// die rechte Panelkante, um den Koerper herum, ueber die linke Halskante wieder hinauf
// und ueber die linke Haelfte des Orbs zurueck zum Anfang.
export function blasenPfad(masse) {
  const g = blasenGeometrie(masse)
  const { links, rechts, unten, kante, sitzR, eckR } = g
  const re = halsKurve(g, +1)
  const li = halsKurve(g, -1)
  const fussLinks = g.sitz.x - FUSS_WEITE
  // Auch der waagerechte Anfasser am Fuss darf die Taille nicht ueberlaufen.
  const fussGriff = Math.min(li.amKoerper, Math.max(0, g.sitz.x - TAILLE - fussLinks))
  const p = q => `${rund(q.x)} ${rund(q.y)}`
  return [
    `M ${p(g.sitzOben)}`,
    `A ${sitzR} ${sitzR} 0 0 1 ${p(re.punkt)}`,
    // Die rechte Halskante. Sie endet senkrecht auf der Panelkante, deshalb liegt der
    // zweite Anfasser genau ueber dem Landepunkt.
    `C ${p({ x: re.punkt.x + re.tangente.x * re.amOrb, y: re.punkt.y + re.tangente.y * re.amOrb })}`
      + ` ${p({ x: rechts, y: kante - re.amKoerper })} ${p({ x: rechts, y: kante })}`,
    `V ${rund(unten - eckR)}`,
    `A ${eckR} ${eckR} 0 0 1 ${rund(rechts - eckR)} ${rund(unten)}`,
    `H ${rund(links + eckR)}`,
    `A ${eckR} ${eckR} 0 0 1 ${rund(links)} ${rund(unten - eckR)}`,
    `V ${rund(kante + eckR)}`,
    `A ${eckR} ${eckR} 0 0 1 ${rund(links + eckR)} ${rund(kante)}`,
    `H ${rund(fussLinks)}`,
    // Die linke Halskante, andersherum: sie faengt waagerecht auf der Oberkante an und
    // endet auf der Kreistangente des Orbs.
    `C ${p({ x: fussLinks + fussGriff, y: kante })}`
      + ` ${p({ x: li.punkt.x - li.tangente.x * li.amOrb, y: li.punkt.y - li.tangente.y * li.amOrb })}`
      + ` ${p(li.punkt)}`,
    `A ${sitzR} ${sitzR} 0 0 1 ${p(g.sitzOben)}`,
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
