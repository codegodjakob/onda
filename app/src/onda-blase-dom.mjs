// Onda — die Sprechblase im Browser: Kontur zeichnen und am Orb ausrichten.
//
// Die Rechnung steht in onda-blase.mjs und ist dort ohne Browser pruefbar.
// Hier steht nur, was ohne DOM nicht geht: messen, zeichnen, positionieren.

import {
  BLASEN_MASSE,
  blasenPfadOben,
  blasenTransform,
  blaseTraegtKontur,
  sitzMitte,
} from './onda-blase.mjs'

const NS = 'http://www.w3.org/2000/svg'

function konturErzeugen() {
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('class', 'onda-blase__kontur')
  svg.setAttribute('aria-hidden', 'true')
  const gruppe = document.createElementNS(NS, 'g')
  gruppe.append(document.createElementNS(NS, 'path'))
  svg.append(gruppe)
  return svg
}

// Zeichnet die Silhouette in der aktuellen Groesse neu. Traegt die Blase die
// Kontur nicht (zu klein), faellt sie auf ihre eigene Flaeche zurueck — die
// Klasse steuert das, nicht das SVG.
function konturZeichnen(blase, svg) {
  const kasten = blase.getBoundingClientRect()
  const breite = Math.round(kasten.width)
  const hoehe = Math.round(kasten.height)
  if (!breite || !hoehe) return
  const traegt = blaseTraegtKontur(breite, hoehe)
  blase.classList.toggle('is-kontur', traegt)
  if (!traegt) {
    svg.setAttribute('width', '0')
    svg.setAttribute('height', '0')
    return
  }
  svg.setAttribute('width', String(breite))
  svg.setAttribute('height', String(hoehe))
  svg.setAttribute('viewBox', `0 0 ${breite} ${hoehe}`)
  svg.firstChild.setAttribute('transform', blasenTransform(breite))
  svg.firstChild.firstChild.setAttribute('d', blasenPfadOben(breite, hoehe))
}

// Haengt die Kontur an eine Blase und haelt sie in Groesse. Gibt eine Funktion
// zurueck, die alles wieder abraeumt.
export function blaseAnhaengen(blase) {
  if (!blase) return () => {}
  blase.classList.add('onda-blase')
  const vorhanden = blase.querySelector(':scope > .onda-blase__kontur')
  const svg = vorhanden || konturErzeugen()
  if (!vorhanden) blase.prepend(svg)
  const zeichnen = () => konturZeichnen(blase, svg)
  zeichnen()
  const beobachter = new ResizeObserver(zeichnen)
  beobachter.observe(blase)
  // Der Text setzt die Hoehe; ohne die geladene Schrift misst man die falsche.
  document.fonts?.ready?.then(zeichnen).catch(() => {})
  return () => {
    beobachter.disconnect()
    svg.remove()
    blase.classList.remove('onda-blase', 'is-kontur')
  }
}

// Legt den Sitz der Blase genau auf den Orb. Der Orb bleibt, wo er ist —
// oben rechts in der Ecke; die Blase kommt zu ihm, nicht er zu ihr.
//
// Gerechnet, nicht geraten: der Sitzmittelpunkt liegt 24 von der rechten und
// 24 von der oberen Kante der Blase. Damit er auf dem Orbmittelpunkt landet,
// muss die Blase genau um diese 24 nach rechts und nach oben ueber ihn hinaus.
export function blaseAmOrbAusrichten(blase, orb) {
  if (!blase || !orb) return
  const o = orb.getBoundingClientRect()
  if (!o.width || !o.height) return
  const mitte = sitzMitte()
  const rechts = Math.max(0, window.innerWidth - o.right + o.width / 2 - mitte)
  const oben = Math.max(0, o.top + o.height / 2 - mitte)
  blase.style.setProperty('--onda-blase-rechts', `${Math.round(rechts)}px`)
  blase.style.setProperty('--onda-blase-oben', `${Math.round(oben)}px`)
}

// Der Orb hat die Groesse, die in seinen Sitz passt. Eine Quelle fuer beide.
export function orbGroesse() {
  return BLASEN_MASSE.orb
}
