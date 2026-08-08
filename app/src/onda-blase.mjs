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
// DER HALS HAENGT MITTIG UNTER DEM ORB. Jakob am 8. August 2026: "sie soll organisch
// aus dem orb rausfliessen und in die sprechblase mit weichen uebergaengen und der
// hals soll zentriert mittig in relation zum orb sein." Vorher lief die rechte
// Halskante mit der rechten Panelkante zusammen; der Hals sass damit unter der rechten
// Haelfte des Orbs und nicht unter seiner Mitte.
//
// Alle vier Uebergaenge sind echte Fillets — an jeder Nahtstelle haben beide Boegen
// dieselbe Tangente, nirgends sitzt eine Ecke:
//   oben  zwei Kehlen, symmetrisch, die den Hals aus dem Orb herausfuehren
//   links eine Kehle in die Oberkante des Koerpers
//   rechts ein S aus zwei Boegen in die rechte Panelkante — dort stehen zwei
//          PARALLELE Senkrechte gegeneinander, und die kann ein einzelner Bogen nicht
//          verbinden. Beide Radien sind gleich gross, also ist das S symmetrisch.
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

// DIE HALBE HALSBREITE. Der Hals ist 16px breit — etwa halb so breit wie der sichtbare
// Farbkreis des Orbs (30px). Am laufenden Programm entschieden: ein Hals in Sitzbreite
// (44px) ist bei 40px Laenge noch schoen, wird aber bei den 120px, die eine mittig
// sitzende Blase braucht, zu einem Streifen ueber die halbe Fensterhoehe. Alles unter
// 12px wiederum reisst optisch ab, sobald die Blase weit unten sitzt.
export const HALS_HALB = 8

// Die zwei Kehlen am Orb. --radius-panel, derselbe Radius wie ueberall im Haus.
export const KOPF_R = KEHL_R

// DIE RECHTE SCHULTER ist ein S aus zwei gleich grossen Boegen. Sie muss von der
// rechten Halskante bis zur rechten Panelkante reichen — die Strecke ist gerechnet und
// nicht gewaehlt: der Orb steht mit seiner Mitte SITZ_R von der Panelkante entfernt,
// der Hals belegt davon HALS_HALB, der Rest gehoert dem S. Zwei gleiche Viertelboegen
// legen zusammen genau ihren doppelten Radius zur Seite und ebenso weit nach unten.
export const SCHWUNG_R = (SITZ_R - HALS_HALB) / 2

// DIE LINKE KEHLE fuehrt den Hals in die Oberkante des Koerpers. Ihr Radius ist so
// gewaehlt, dass sie genauso tief faellt wie das S auf der anderen Seite — sonst saesse
// die Blase auf zwei verschieden hohen Schultern.
export const FUSS_R = SITZ_R - HALS_HALB

// Wie weit unter der Sitzmitte die Kopfkehle die Halskante erreicht. Gerechnet, nicht
// gemessen: Kehle und Sitz beruehren sich von aussen, ihre Mittelpunkte haben also den
// Abstand SITZ_R + KOPF_R, und der Kehlmittelpunkt liegt KOPF_R neben der Halskante.
// Der Satz des Pythagoras auf dieses Dreieck, mehr ist es nicht.
export const KOPF_VERSATZ = kopfVersatz(SITZ_R, KOPF_R, HALS_HALB)

// Die Schulter: vom oberen Kastenrand bis zur Oberkante des Koerpers, wenn der gerade
// Teil des Halses null lang ist. Sitz, Kopfkehle und Fusskehle brauchen diese Strecke
// ohnehin. Steht auch in style.css als --blase-schulter — onda-design-contract.test.mjs
// haelt beide Zahlen zusammen, damit die Mitte nicht auf zwei Rechnungen beruht.
export const SCHULTER = SITZ_R + KOPF_VERSATZ + FUSS_R

// Kleinste Groesse, bei der der Pfad noch aufgeht: darunter wuerden sich Eckbogen und
// Kehle ueberschneiden und der Pfad schluege Haken. Beides gilt fuer den KOERPER der
// Blase — der gerade Teil des Halses kommt oben drauf und hat keine Untergrenze.
// In der Breite muss die Oberkante von der linken Ecke bis zur Fusskehle reichen.
export const MINDEST_BREITE = SITZ_R + HALS_HALB + FUSS_R + ECK_R
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
// Blasenkastens (Ursprung oben links). Der Sitz haengt an `rechts` und `oben` — das
// sind die Kanten des Orbs, und sie ruehren sich nie. `links` und `unten` wachsen.
//
// `halsL` ist die Laenge des GERADEN Stuecks im Hals. Die vier Kehlen kommen oben und
// unten dazu; bei halsL = 0 sitzen sie unmittelbar aufeinander, und die Silhouette ist
// die kleinste, die noch aufgeht.
export function blasenGeometrie({
  links, rechts, oben = 0, unten, halsL = 0,
  sitzR = SITZ_R, eckR = ECK_R, halsHalb = HALS_HALB, kopfR = KOPF_R,
  schwungR = (sitzR - halsHalb) / 2, fussR = sitzR - halsHalb,
}) {
  // Die Mitte des Orbs — und damit die Achse des Halses. Er haengt symmetrisch daran.
  const mitteX = rechts - sitzR
  const linkeKante = mitteX - halsHalb
  const rechteKante = mitteX + halsHalb
  const versatz = kopfVersatz(sitzR, kopfR, halsHalb)
  // Wo der gerade Teil des Halses anfaengt und aufhoert.
  const halsKopf = oben + sitzR + versatz
  const halsFuss = halsKopf + halsL
  // Oberkante des Koerpers. Beide Schultern fallen gleich tief — links eine Kehle mit
  // Radius fussR, rechts zwei Boegen mit je schwungR, und 2 x schwungR = fussR.
  const kante = halsFuss + fussR
  // Der Beruehrpunkt von Kopfkehle und Sitz liegt auf der Verbindung der beiden
  // Mittelpunkte, im Abstand sitzR vom Sitzmittelpunkt. Genau dort haben beide Boegen
  // dieselbe Tangente — also entsteht keine Ecke.
  const spanne = sitzR + kopfR
  const kopfAus = sitzR * (halsHalb + kopfR) / spanne
  const kopfAb = oben + sitzR + sitzR * versatz / spanne
  return {
    links, rechts, oben, unten, kante, halsL, halsKopf, halsFuss,
    sitzR, eckR, kopfR, halsHalb, schwungR, fussR,
    sitz: { x: mitteX, y: oben + sitzR, r: sitzR },
    sitzOben: { x: mitteX, y: oben },
    // Die zwei Kehlen, die den Hals aus dem Orb herausfuehren. Spiegelbildlich.
    kopfkehleLinks: { x: linkeKante - kopfR, y: halsKopf, r: kopfR },
    kopfkehleRechts: { x: rechteKante + kopfR, y: halsKopf, r: kopfR },
    kopfSitzLinks: { x: mitteX - kopfAus, y: kopfAb },
    kopfSitzRechts: { x: mitteX + kopfAus, y: kopfAb },
    // Wo die Kopfkehlen die Halskanten erreichen — von hier laeuft der Hals gerade.
    kopfHalsLinks: { x: linkeKante, y: halsKopf },
    kopfHalsRechts: { x: rechteKante, y: halsKopf },
    // Wo der gerade Hals in die Schultern laeuft.
    halsFussLinks: { x: linkeKante, y: halsFuss },
    halsFussRechts: { x: rechteKante, y: halsFuss },
    // Links: eine Kehle in die Oberkante. Dort waagerecht, wie die Kante selbst.
    fusskehle: { x: linkeKante - fussR, y: halsFuss, r: fussR },
    fussUnten: { x: linkeKante - fussR, y: kante },
    // Rechts: das S. Erst konkav vom Hals weg, dann konvex in die Panelkante hinein.
    // In der Mitte, wo beide Boegen sich treffen, steht die Tangente waagerecht.
    schwungOben: { x: rechteKante + schwungR, y: halsFuss, r: schwungR },
    schwungMitte: { x: rechteKante + schwungR, y: halsFuss + schwungR },
    schwungUnten: { x: rechteKante + schwungR, y: halsFuss + 2 * schwungR, r: schwungR },
    kanteRechts: { x: rechts, y: kante },
  }
}

// Aus der aeusseren Beruehrung zweier Kreise. Steht als KOPF_VERSATZ auch fuer die
// Hausmasse bereit; als Funktion, damit die Geometrie auch mit anderen Massen aufgeht.
function kopfVersatz(sitzR, kopfR, halsHalb) {
  const kathete = halsHalb + kopfR
  return Math.sqrt(Math.max(0, (sitzR + kopfR) ** 2 - kathete ** 2))
}

// Eine durchgehende Silhouette, im Uhrzeigersinn und in einem Zug. Sie faengt oben am
// Orb an, laeuft um seine rechte Haelfte herum, ueber die rechte Kopfkehle in den Hals,
// den Hals hinunter, ueber das S in die rechte Panelkante, um den Koerper herum, ueber
// die Fusskehle zurueck in den Hals, hinauf, und ueber die linke Kopfkehle wieder auf
// den Orb.
export function blasenPfad(masse) {
  const form = FORMEN[masse?.form]
  if (form && form.art === 'kurve') return blasenPfadGeschwungen(masse, form)
  const g = blasenGeometrie(masse)
  const { links, rechts, oben, unten, kante, sitzR, eckR, kopfR, schwungR, fussR } = g
  return [
    `M ${rund(g.sitzOben.x)} ${rund(g.sitzOben.y)}`,
    // Die rechte Haelfte des Orbs hinunter bis dorthin, wo die Kehle ansetzt.
    `A ${sitzR} ${sitzR} 0 0 1 ${rund(g.kopfSitzRechts.x)} ${rund(g.kopfSitzRechts.y)}`,
    `A ${kopfR} ${kopfR} 0 0 0 ${rund(g.kopfHalsRechts.x)} ${rund(g.kopfHalsRechts.y)}`,
    // Die rechte Halskante. Bei einem geraden Hals von null Laenge ist sie null Pixel
    // lang, und die Kehle geht unmittelbar in das S ueber.
    `V ${rund(g.halsFussRechts.y)}`,
    // Das S: konkav vom Hals weg, dann konvex in die Panelkante. Zwei parallele
    // Senkrechte lassen sich nicht mit einem einzigen Bogen verbinden.
    `A ${schwungR} ${schwungR} 0 0 0 ${rund(g.schwungMitte.x)} ${rund(g.schwungMitte.y)}`,
    `A ${schwungR} ${schwungR} 0 0 1 ${rund(g.kanteRechts.x)} ${rund(g.kanteRechts.y)}`,
    `V ${rund(unten - eckR)}`,
    `A ${eckR} ${eckR} 0 0 1 ${rund(rechts - eckR)} ${rund(unten)}`,
    `H ${rund(links + eckR)}`,
    `A ${eckR} ${eckR} 0 0 1 ${rund(links)} ${rund(unten - eckR)}`,
    `V ${rund(kante + eckR)}`,
    `A ${eckR} ${eckR} 0 0 1 ${rund(links + eckR)} ${rund(kante)}`,
    `H ${rund(g.fussUnten.x)}`,
    `A ${fussR} ${fussR} 0 0 0 ${rund(g.halsFussLinks.x)} ${rund(g.halsFussLinks.y)}`,
    `V ${rund(g.kopfHalsLinks.y)}`,
    `A ${kopfR} ${kopfR} 0 0 0 ${rund(g.kopfSitzLinks.x)} ${rund(g.kopfSitzLinks.y)}`,
    `A ${sitzR} ${sitzR} 0 0 1 ${rund(g.sitzOben.x)} ${rund(g.sitzOben.y)}`,
    'Z',
  ].join(' ')
}

// VIER HALSFORMEN ZUR WAHL. Jakob am 8. August 2026: "mir gefaellt das halsdesign
// nicht kannst du bitte mir mehrere unterschiedliche varianten zeigen." Also nicht
// eine geraten, sondern vier gebaut, die sich wirklich unterscheiden — umschaltbar am
// laufenden Programm, und nach der Entscheidung fliegen drei davon raus.
//
// „stiel" ist die Fassung mit geraden Kanten und Kehlen (Boegen, oben in dieser
// Datei). Die drei anderen sind DURCHGEHEND GESCHWUNGEN: statt Gerade-plus-Kehle
// laeuft je eine kubische Kurve vom Orb bis an den Koerper. Sie setzt an beiden Enden
// mit genau der Tangente an, die dort schon herrscht — am Orb die Kreistangente, am
// Koerper die Kante — und ist deshalb genauso knickfrei wie ein Fillet, nur freier in
// der Mitte. Ein Bogen kann nur eine Taille, eine Kurve kann jede.
//
//   winkel        wo der Hals den Orb verlaesst, gemessen vom rechtesten Punkt.
//                 Gross heisst weit unten am Orb, also schmaler Ansatz.
//   taille        wie schmal der Hals hoechstens werden darf, als halbe Breite.
//   griffOrb      wie lange die Kurve die Richtung des Orbs beibehaelt. Gross heisst
//                 gerade am Orb und dafuer eine schaerfere Biegung weiter unten.
//   griffKoerper  dasselbe am anderen Ende, an der Kante des Koerpers.
//   fussWeite     wie weit links vom Orb die Kurve auf der Oberkante landet.
// EINE REIHE VON BREIT NACH SCHLANK. Jakob am 8. August 2026: "tendenziell eher wie
// säule aber so elegant wie taille." Also keine vier verstreuten Einfaelle mehr,
// sondern eine Achse mit fuenf Punkten darauf. Die beiden Enden sind die Formen, die
// er genannt hat; die drei dazwischen sind die Gefaesse, die genau das koennen — ein
// voller Koerper an einem Hals, der sich zusammennimmt.
//
// Was von links nach rechts passiert: die Taille wird enger (17 → 5), der Ansatz am
// Orb rutscht ein wenig weiter herum (8° → 16°), und der Fuss wird schmaler. Alles
// andere bleibt.
export const FORMEN = {
  // Kraeftig, fast in Orbbreite, mit weiten Kehlen statt einer Taille.
  saeule: { art: 'kurve', winkel: 8, taille: 17, griffOrb: 0.50, griffKoerper: 0.50, fussWeite: 42 },
  kelch: { art: 'kurve', winkel: 8, taille: 14, griffOrb: 0.52, griffKoerper: 0.50, fussWeite: 44 },
  amphore: { art: 'kurve', winkel: 10, taille: 11, griffOrb: 0.55, griffKoerper: 0.45, fussWeite: 44 },
  karaffe: { art: 'kurve', winkel: 12, taille: 8, griffOrb: 0.58, griffKoerper: 0.38, fussWeite: 40 },
  // Durchgehend geschwungen, in der Mitte am schmalsten: ein Tropfen, der sich zieht.
  tropfen: { art: 'kurve', winkel: 16, taille: 5, griffOrb: 0.55, griffKoerper: 0.32, fussWeite: 30 },
  // Gerade Kanten und Kehlen statt Kurven. Bleibt als Vergleichsmass stehen, bis
  // entschieden ist — es ist die Bauweise, von der die Reihe wegfuehrt.
  stiel: { art: 'bogen' },
}

export const FORM_NAMEN = Object.keys(FORMEN)

// Die Anfasser einer geschwungenen Halskante. `seite` ist +1 rechts und -1 links.
//
// DIE TAILLE IST EINE HARTE GRENZE, und sie muss es sein. Ein kubischer Bogen liegt
// immer innerhalb der Huelle seiner vier Punkte — halte ich alle vier auf ihrer Seite
// der Taille, kann die Kurve die andere Seite gar nicht erreichen. Ohne diese Schranke
// kreuzen sich die beiden Halskanten bei langen Haelsen, und die Blase bekommt eine
// Schlaufe. Gekuerzt wird der Anfasser, nicht seine RICHTUNG gedreht: die Richtung ist
// die Kreistangente, und nur weil sie stimmt, sitzt am Orb keine Ecke.
function halsKurve(g, form, seite) {
  const bogen = (seite > 0 ? form.winkel : 180 - form.winkel) * Math.PI / 180
  const punkt = {
    x: g.sitz.x + g.sitzR * Math.cos(bogen),
    y: g.sitz.y + g.sitzR * Math.sin(bogen),
  }
  // Die Tangente des Sitzkreises an dieser Stelle, in Laufrichtung des Pfades (im
  // Uhrzeigersinn). Genau sie muss die Kurve uebernehmen, sonst entsteht eine Ecke.
  const tangente = { x: -Math.sin(bogen), y: Math.cos(bogen) }
  const strecke = Math.max(1, g.kante - punkt.y)
  const grenze = g.sitz.x + seite * form.taille
  // Rechts laeuft der Anfasser mit -sin(bogen) nach links, links laeuft er (weil die
  // Kurve dort rueckwaerts gebaut wird) mit +sin(bogen) nach rechts. Beide Male also
  // auf die Achse zu, und beide Male ist sin(bogen) das Tempo.
  const tempo = Math.abs(Math.sin(bogen))
  const platz = Math.max(0, (punkt.x - grenze) * seite)
  const amOrb = tempo > 1e-6
    ? Math.min(strecke * form.griffOrb, platz / tempo)
    : strecke * form.griffOrb
  return { punkt, tangente, amOrb, amKoerper: strecke * form.griffKoerper }
}

// Dieselbe Silhouette wie oben, nur ist der Hals hier nicht aus Geraden und Kehlen
// zusammengesetzt, sondern aus zwei Kurven. Alles ausserhalb des Halses ist gleich.
function blasenPfadGeschwungen(masse, form) {
  const g = blasenGeometrie(masse)
  const { links, rechts, unten, kante, sitzR, eckR } = g
  const rechteSeite = halsKurve(g, form, +1)
  const linkeSeite = halsKurve(g, form, -1)
  const fussLinks = g.sitz.x - form.fussWeite
  // Auch der waagerechte Anfasser am Fuss darf die Taille nicht ueberlaufen.
  const fussGriff = Math.min(linkeSeite.amKoerper, Math.max(0, g.sitz.x - form.taille - fussLinks))
  const punkt = p => `${rund(p.x)} ${rund(p.y)}`
  return [
    `M ${punkt(g.sitzOben)}`,
    // Um die rechte Haelfte des Orbs bis dorthin, wo der Hals ansetzt. Ueber 180 Grad
    // waere der grosse Bogen noetig — bei jedem sinnvollen Winkel bleibt er darunter.
    `A ${sitzR} ${sitzR} 0 0 1 ${punkt(rechteSeite.punkt)}`,
    // Die rechte Halskante. Sie endet senkrecht auf der Panelkante, deshalb liegt der
    // zweite Anfasser genau ueber dem Landepunkt.
    `C ${punkt({
      x: rechteSeite.punkt.x + rechteSeite.tangente.x * rechteSeite.amOrb,
      y: rechteSeite.punkt.y + rechteSeite.tangente.y * rechteSeite.amOrb,
    })} ${punkt({ x: rechts, y: kante - rechteSeite.amKoerper })} ${punkt({ x: rechts, y: kante })}`,
    `V ${rund(unten - eckR)}`,
    `A ${eckR} ${eckR} 0 0 1 ${rund(rechts - eckR)} ${rund(unten)}`,
    `H ${rund(links + eckR)}`,
    `A ${eckR} ${eckR} 0 0 1 ${rund(links)} ${rund(unten - eckR)}`,
    `V ${rund(kante + eckR)}`,
    `A ${eckR} ${eckR} 0 0 1 ${rund(links + eckR)} ${rund(kante)}`,
    `H ${rund(fussLinks)}`,
    // Die linke Halskante, andersherum: sie faengt waagerecht auf der Oberkante an und
    // endet auf der Kreistangente des Orbs.
    `C ${punkt({ x: fussLinks + fussGriff, y: kante })} ${punkt({
      x: linkeSeite.punkt.x - linkeSeite.tangente.x * linkeSeite.amOrb,
      y: linkeSeite.punkt.y - linkeSeite.tangente.y * linkeSeite.amOrb,
    })} ${punkt(linkeSeite.punkt)}`,
    `A ${sitzR} ${sitzR} 0 0 1 ${punkt(g.sitzOben)}`,
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
  let form = 'stiel'
  return {
    svg,
    setzeForm(neueForm) {
      form = FORMEN[neueForm] ? neueForm : 'amphore'
    },
    get form() { return form },
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
      const d = blasenPfad({ ...blasenMasse({ breite, hoehe, pBreite, pHoehe, hals }), form })
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
