// Onda — die Sprechblase, die aus dem Orb hervorkommt.
//
// Eine durchgehende Silhouette: der Sitzkreis des Orbs laeuft tangential in die
// Panelkante, ein exakt tangentialer konkaver Fillet schliesst die Gegenseite an.
// Uebernommen aus dem Design System 2 (components/conversation/Bubble.jsx,
// Funktion gooPath) — dort ist es die abgebildete Form, hier ist es Rechnung.
//
// Kein DOM, vollstaendig node-testbar. Wer die Form aendern will, aendert die
// Masse hier; onda-blase.test.mjs haelt sie gegen die Vorlage fest.

// Die vier Masse der Vorlage. Alles andere ist aus ihnen gerechnet, damit eine
// Aenderung nicht an drei Stellen halb ankommt.
export const BLASEN_MASSE = Object.freeze({
  sitz: 24,     // Radius des Kreises, in dem der Orb sitzt
  ecke: 12,     // Radius der drei gewoehnlichen Panelecken (--radius-panel-Familie)
  fillet: 10,   // Radius des konkaven Uebergangs Sitz → Panelkante
  orb: 36,      // Durchmesser des Orbs; 36 in 48 laesst 6px Luft ringsum
})

// Wo der Sitzmittelpunkt liegt, von der Ecke aus gemessen, an der der Orb sitzt.
// Bei seat='top' ist das die rechte obere Ecke: 24 von rechts, 24 von oben.
export function sitzMitte() {
  return BLASEN_MASSE.sitz
}

// Wie weit die Nase des Sitzes ueber die Kante des Panelkoerpers hinausragt.
// Der Panelkoerper beginnt erst darunter — deshalb braucht die Blase oben
// Innenabstand, sonst laege der Text in der Nase.
export function nasenTiefe() {
  return BLASEN_MASSE.sitz + BLASEN_MASSE.fillet
}

// Die Silhouette fuer den Sitz links oben; die Blase waechst nach rechts.
// Der Sitz ist ein halber Kreis, der aus der Panelkante herauswaechst.
export function blasenPfad(breite, hoehe) {
  const { sitz, ecke, fillet } = BLASEN_MASSE
  const w = Math.round(breite)
  const h = Math.round(hoehe)
  const kante = sitz + fillet          // 34 — linke Kante des Panelkoerpers
  const unten = kante + ecke           // 46 — wo die untere Kante zur Ecke wird
  const sitzEnde = sitz * 2            // 48 — wo der Sitzkreis die Kante beruehrt
  const filletEnde = sitzEnde + fillet // 58 — von hier laeuft der Fillet in den Sitz
  return `M ${sitz} 0 H ${w - ecke} A ${ecke} ${ecke} 0 0 1 ${w} ${ecke}`
    + ` V ${h - ecke} A ${ecke} ${ecke} 0 0 1 ${w - ecke} ${h}`
    + ` H ${unten} A ${ecke} ${ecke} 0 0 1 ${kante} ${h - ecke}`
    + ` V ${filletEnde} A ${fillet} ${fillet} 0 0 0 ${sitz} ${sitz * 2}`
    + ` A ${sitz} ${sitz} 0 0 1 0 ${sitz} A ${sitz} ${sitz} 0 0 1 ${sitz} 0 Z`
}

// Dieselbe Geometrie, um 90 Grad gedreht: der Sitz landet oben rechts, die Blase
// waechst nach unten. Eine Kontur, zwei Sitze — genau wie in der Vorlage.
export function blasenTransform(breite) {
  return `translate(${Math.round(breite)},0) rotate(90)`
}

// Bei seat='top' ist die Pfad-Breite die Blasen-HOEHE und umgekehrt: der Pfad
// wird ja gedreht gezeichnet. Diese Funktion nimmt einem das Vertauschen ab.
export function blasenPfadOben(breite, hoehe) {
  return blasenPfad(hoehe, breite)
}

// Die eigene Flaeche der Blase verschwindet nur, wenn die Kontur sie ersetzt.
// Zu kleine Blasen behalten Hintergrund, Haarlinie und Schatten — sonst waere
// der Sitz groesser als die Blase und die Silhouette faltete sich in sich selbst.
export function blaseTraegtKontur(breite, hoehe) {
  return Math.round(breite) >= 100 && Math.round(hoehe) >= 118
}
