// Quellen stehen nach Thema, nicht nach Aufnahmedatum. Die Themen bildet und benennt
// der Agent — wer zwanzig Quellen aufnimmt, hat keine Lust, sie selbst zu sortieren.
//
// Was der Mensch entscheidet, bleibt entschieden. Genau das ist der Zweck der beiden
// Merker `vonKi` (am Thema) und `handverschoben` (an der Zuordnung): ein zweiter Lauf
// des Agenten darf einen umbenannten Namen nicht zurueckdrehen und eine von Hand
// verschobene Quelle nicht wieder wegsortieren. Ohne die Merker waere jede
// Handbewegung nur bis zum naechsten Lauf gueltig, und das Sortieren waere eine
// Arbeit, die man endlos wiederholt.
//
// Eine Quelle liegt in genau EINEM Thema. Mehrfachzuordnung waere kein Baum mehr,
// sondern ein Netz; ein Netz laesst sich in einer 264px breiten Spalte nicht zeigen.

export const OHNE_THEMA = 'ohne-thema'
export const OHNE_THEMA_NAME = 'Noch ohne Thema'

function saubereZeichenkette(wert) {
  return String(wert ?? '').trim()
}

function quellenIds(project) {
  return (Array.isArray(project?.sources) ? project.sources : [])
    .map(quelle => quelle?.id)
    .filter(Boolean)
}

function naechsteKennung(vorhanden) {
  let zaehler = 1
  while (vorhanden.has(`thema-${zaehler}`)) zaehler += 1
  return `thema-${zaehler}`
}

// Bringt project.quellenThemen in eine Form, auf die sich der Rest verlassen darf:
// jedes Thema hat Kennung und Namen, jede Quelle steht hoechstens einmal, und
// Zuordnungen zu geloeschten Quellen fallen weg.
//
// Geheilt wird AN ORT UND STELLE: dieselbe Liste, dieselben Eintraege, nur berichtigt.
// Das ist keine Sparsamkeit, sondern eine Sicherung. Baute die Funktion jedes Mal
// frische Kopien, waere jede Kennung, die ein Aufrufer sich gemerkt hat, nach dem
// naechsten Aufruf ein totes Objekt — man schriebe in eine Gruppe, die niemand mehr
// liest, und der Fehler faellt erst beim Speichern auf. Genau das ist beim Uebernehmen
// eines Vorschlags passiert: legeThemaAn ruft diese Funktion selbst auf.
export function ensureQuellenThemen(project) {
  if (!project || typeof project !== 'object') return []
  const bekannt = new Set(quellenIds(project))
  const kennungen = new Set()
  const vergeben = new Set()
  const roh = Array.isArray(project.quellenThemen) ? project.quellenThemen : []

  const themen = []
  roh.forEach(eintrag => {
    if (!eintrag || typeof eintrag !== 'object') return
    let id = saubereZeichenkette(eintrag.id)
    if (!id || id === OHNE_THEMA || kennungen.has(id)) id = naechsteKennung(kennungen)
    kennungen.add(id)
    // Wichtig: waehrend des Filterns merken, nicht danach. Sonst ueberlebt eine
    // Quelle, die ZWEIMAL in DERSELBEN Gruppe steht, beide Male.
    const zuordnungen = (Array.isArray(eintrag.quellenIds) ? eintrag.quellenIds : [])
      .map(saubereZeichenkette)
      .filter(quelleId => {
        if (!bekannt.has(quelleId) || vergeben.has(quelleId)) return false
        vergeben.add(quelleId)
        return true
      })
    eintrag.id = id
    eintrag.name = saubereZeichenkette(eintrag.name) || 'Ohne Namen'
    // Ein Satz dazu, was diese Quellen im Projekt gemeinsam tragen. Ohne ihn ist eine
    // Gruppe nur eine Behauptung — man sieht die Kiste, aber nicht, warum sie eine ist.
    eintrag.warum = saubereZeichenkette(eintrag.warum)
    eintrag.quellenIds = zuordnungen
    eintrag.vonKi = eintrag.vonKi !== false
    eintrag.handverschoben = (Array.isArray(eintrag.handverschoben) ? eintrag.handverschoben : [])
      .map(saubereZeichenkette)
      .filter(quelleId => zuordnungen.includes(quelleId))
    themen.push(eintrag)
  })

  // splice statt Zuweisung: die Liste selbst bleibt dieselbe (siehe oben).
  if (Array.isArray(project.quellenThemen)) project.quellenThemen.splice(0, project.quellenThemen.length, ...themen)
  else project.quellenThemen = themen
  return project.quellenThemen
}

// Der Baum, wie ihn die Seitenleiste und das Quellen-Fenster zeigen. Quellen ohne
// Thema stehen am Ende in einer eigenen Gruppe — sichtbar, damit niemand sie verliert,
// aber nicht gespeichert: sie ist die Abwesenheit einer Zuordnung, kein Thema.
export function themenBaum(project) {
  const themen = ensureQuellenThemen(project)
  const quellen = new Map((Array.isArray(project?.sources) ? project.sources : [])
    .filter(quelle => quelle?.id)
    .map(quelle => [quelle.id, quelle]))

  const baum = themen.map(thema => ({
    id: thema.id,
    name: thema.name,
    warum: thema.warum,
    vonKi: thema.vonKi,
    quellen: thema.quellenIds.map(id => quellen.get(id)).filter(Boolean),
  }))

  const vergeben = new Set(themen.flatMap(thema => thema.quellenIds))
  const uebrig = [...quellen.values()].filter(quelle => !vergeben.has(quelle.id))
  if (uebrig.length) {
    baum.push({ id: OHNE_THEMA, name: OHNE_THEMA_NAME, warum: '', vonKi: false, quellen: uebrig })
  }
  return baum
}

export function legeThemaAn(project, name, warum = '') {
  const themen = ensureQuellenThemen(project)
  const kennungen = new Set(themen.map(thema => thema.id))
  const thema = {
    id: naechsteKennung(kennungen),
    name: saubereZeichenkette(name) || 'Neue Gruppe',
    warum: saubereZeichenkette(warum),
    quellenIds: [],
    // Von Hand angelegt: der Agent darf diese Gruppe nicht umbenennen.
    vonKi: false,
    handverschoben: [],
  }
  themen.push(thema)
  return thema
}

export function benenneThemaUm(project, themaId, name) {
  const thema = ensureQuellenThemen(project).find(kandidat => kandidat.id === themaId)
  if (!thema) return null
  const neu = saubereZeichenkette(name)
  if (!neu) return thema
  thema.name = neu
  thema.vonKi = false
  return thema
}

// Auch der Satz darunter gehoert dem, der ihn zuletzt geschrieben hat. Wer ihn von Hand
// aendert, uebernimmt die Gruppe — sonst stuende beim naechsten Lauf wieder die
// Begruendung des Agenten unter dem eigenen Namen.
export function beschreibeThema(project, themaId, warum) {
  const thema = ensureQuellenThemen(project).find(kandidat => kandidat.id === themaId)
  if (!thema) return null
  thema.warum = saubereZeichenkette(warum)
  thema.vonKi = false
  return thema
}

// Eine Gruppe loeschen heisst: die Kiste geht, der Inhalt bleibt. Die Quellen fallen
// nach „Noch ohne Thema" zurueck und stehen dort sichtbar. Nie faellt eine Quelle mit
// ihrer Gruppe — sie ist Material, das jemand aufgenommen und geprueft hat, und keine
// Eigenschaft der Ordnung, in der sie zufaellig gerade lag.
export function loescheThema(project, themaId) {
  const themen = ensureQuellenThemen(project)
  const index = themen.findIndex(thema => thema.id === themaId)
  if (index < 0) return null
  const [entfernt] = themen.splice(index, 1)
  return { name: entfernt.name, freigewordene: [...entfernt.quellenIds] }
}

// themaId === OHNE_THEMA nimmt die Quelle aus jeder Gruppe heraus.
export function verschiebeQuelle(project, quelleId, themaId) {
  const themen = ensureQuellenThemen(project)
  const id = saubereZeichenkette(quelleId)
  if (!id || !quellenIds(project).includes(id)) return null
  themen.forEach(thema => {
    thema.quellenIds = thema.quellenIds.filter(kandidat => kandidat !== id)
    thema.handverschoben = thema.handverschoben.filter(kandidat => kandidat !== id)
  })
  if (themaId === OHNE_THEMA) return null
  const ziel = themen.find(thema => thema.id === themaId)
  if (!ziel) return null
  ziel.quellenIds.push(id)
  ziel.handverschoben.push(id)
  return ziel
}

// Der Weg des Agenten. Er darf zwei Dinge NICHT: eine von Hand umbenannte Gruppe
// wieder umtaufen und eine von Hand verschobene Quelle wieder wegsortieren. Beides
// waere ein Widerruf einer menschlichen Entscheidung.
export function uebernimmThemenvorschlag(project, vorschlag) {
  const themen = ensureQuellenThemen(project)
  const handfest = new Set(themen.flatMap(thema => thema.handverschoben))
  const bekannt = new Set(quellenIds(project))
  const liste = Array.isArray(vorschlag) ? vorschlag : []

  liste.forEach(gruppe => {
    const name = saubereZeichenkette(gruppe?.name)
    if (!name) return
    let thema = themen.find(kandidat => kandidat.name.toLowerCase() === name.toLowerCase())
    if (!thema) {
      // legeThemaAn meint die Handanlage und setzt deshalb vonKi:false. Diese Gruppe
      // kommt vom Agenten — sie gehoert ihm, bis jemand sie umbenennt.
      thema = legeThemaAn(project, name)
      thema.vonKi = true
    }
    // Der Satz darunter gehoert dem Agenten nur so lange, wie die Gruppe ihm gehoert.
    // Bei einer vom Menschen uebernommenen Gruppe (vonKi === false) bleibt er stehen —
    // sonst schriebe der naechste Lauf die eigene Begruendung still um.
    if (thema.vonKi) thema.warum = saubereZeichenkette(gruppe?.warum) || thema.warum
    const ids = (Array.isArray(gruppe?.quellenIds) ? gruppe.quellenIds : [])
      .map(saubereZeichenkette)
      .filter(id => bekannt.has(id) && !handfest.has(id))
    ids.forEach(id => {
      themen.forEach(kandidat => {
        if (kandidat === thema) return
        if (kandidat.handverschoben.includes(id)) return
        kandidat.quellenIds = kandidat.quellenIds.filter(vorhanden => vorhanden !== id)
      })
      if (!thema.quellenIds.includes(id)) thema.quellenIds.push(id)
    })
  })

  // Eine leere Gruppe des Agenten ist kein Thema mehr, sondern ein Rest von gestern:
  // sie entstand, weil damals Quellen darin lagen, und die liegen jetzt woanders.
  // Was der Mensch angelegt hat, bleibt auch leer stehen — er hat den Platz gemeint.
  const bleibt = themen.filter(thema => thema.quellenIds.length || !thema.vonKi)
  themen.splice(0, themen.length, ...bleibt)

  return ensureQuellenThemen(project)
}
