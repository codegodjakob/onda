// Der Anschluss der zweiten Haelfte: alles, was Onda ueber ein Projekt weiss, dem Modell
// aber bisher nie gesagt hat. PUR, node-testbar — kein DOM, keine Uhr, kein Zufall, keine
// Mutation der Eingaben.
//
// BEFUND, den dieses Modul behebt: baueAnfrage (agent-tasks.mjs) liest genau drei Felder —
// verstaendnis, docText, volatiles. Textsorte und Stilprofil (language-profile.mjs), der
// dokumentuebergreifende Aussagen-Speicher (claim-ledger.mjs -> project.argumentModel) und
// das Gedaechtnis (memory-retrieval.mjs) erreichten das Modell deshalb kein einziges Mal.
// Hier werden sie zu Textbloecken, die genau in kontext.volatiles passen.
//
// WOHIN die Bloecke gehoeren: AUSSCHLIESSLICH nach volatiles, also HINTER verstaendnis und
// docText. Nur diese beiden tragen cache_control (siehe Kommentar ueber baueAnfrage); sie
// bilden zusammen mit dem Systemtext den grossen, teuren Zwischenspeicher-Praefix. Ein
// Wissensblock im Praefix wuerde den Zwischenspeicher entwerten, sobald sich irgendeine
// Projektangabe aendert — und dann waere jede Anfrage danach voll zu bezahlen statt zu
// einem Zehntel. Die Bloecke hier sind klein und aendern sich oft: sie gehoeren nach hinten.
//
// SPARSAMKEIT ist hier kein Stil, sondern Geld: jeder Block wird bei JEDEM Lauf neu bezahlt
// (Hinweislauf, Erweiterungslauf, jede Chat-Antwort, jede Interview-Runde). Darum drei
// Regeln, die im ganzen Modul gelten:
//   1. zusammenfassen statt mitschicken — die Textsorte ist ein Satz, kein JSON-Abzug,
//   2. harte Obergrenzen mit Begruendung (siehe MAX_AUSSAGEN, MAX_GEDAECHTNIS),
//   3. ein leerer oder unbekannter Wert erzeugt GAR KEINEN Block — nicht einen leeren und
//      nicht das Wort "unbekannt". Das Modell soll nicht raten, was es nicht weiss.
import { buildLanguageContext } from './language-profile.mjs'
import { buildStyleMemoryContext, retrieveMemoryContext } from './memory-retrieval.mjs'
import { ERKANNTES_TYP, erkanntesFuerPrompt } from './erkanntes-model.mjs'
import { formatiereHandwerk, projiziereHandwerk } from './handwerk-model.mjs'
import { baueArbeitskontext, formatiereArbeitskontext } from './arbeitskontext-model.mjs'

// 'other'/'Sonstig' ist eine bewusste Wahl der Autorin oder des Autors, sagt dem Modell aber
// nichts ueber den Text — leerer Label heisst: dieses Feld erzeugt keinen Eintrag.
// Diese Liste MUSS LANGUAGE_GENRES vollstaendig abdecken. Fehlt eine Textart, faellt die
// Zeile "Textsorte: ..." still aus dem Prompt -- und mit ihr alles, was daran haengt: die
// Stilmittel-Zuordnung (stilmittel.mjs) und die Integritaetsregeln (textart-regeln.mjs)
// laufen dann fail-closed leer. Genau das war fuer prosa und lyrik der Fall, nachdem sie
// zur Genre-Liste dazukamen. Der Test darunter haelt die beiden Listen zusammen.
const MEDIEN = Object.freeze({
  screen: 'Bildschirm',
  print: 'Druck',
  'academic-submission': 'akademische Abgabe',
  presentation: 'Präsentation',
  other: '',
})
const REGIONEN = Object.freeze({ DE: 'Deutschland', AT: 'Österreich', CH: 'Schweiz' })

const PUBLIKUM_LABELS = Object.freeze({
  priorKnowledge: 'Vorwissen',
  assumptions: 'Annahmen',
  resistances: 'Widerstände',
  commonGround: 'geteilte Grundlage',
})

// Wie das Modell den Belegstand einer Aussage lesen soll. 'unverified' und 'insufficient'
// bekommen bewusst KEIN Wort: 'unverified' heisst nur "es gibt kein Beleg-Bündel dazu", und
// das ist der Vorgabewert fuer JEDE Aussage in einem Projekt ohne Quellenarbeit. Daraus
// "unbelegt" zu machen waere eine Behauptung ueber den Text, die niemand aufgestellt hat.
const BELEGSTAND = Object.freeze({
  supported: 'belegt',
  mixed: 'Belege widersprechen sich',
  'review-required': 'Beleg muss geprüft werden',
})
const GELTUNG = Object.freeze({ contested: 'strittig', qualified: 'eingeschränkt' })

// Obergrenze fuer den Aussagen-Speicher. Begruendung: eine Zeile kostet grob 25 bis 45
// Tokens, zehn Zeilen also rund 400 — ein knappes Prozent eines ueblichen Laufs (Systemtext,
// Projektverstaendnis und der ganze Dokumenttext liegen zusammen bei mehreren Tausend). Zehn
// Aussagen reichen, um das Rueckgrat eines Projekts zu zeigen: das Modell liest sie nicht,
// um sie zu lernen, sondern um einen Widerspruch oder eine Doppelung zu bemerken — dafuer
// zaehlen die zentralen und die strittigen, nicht die Vollstaendigkeit. Ein hoeheres Limit
// waere bei jedem einzelnen Lauf zu bezahlen, ohne dass die Antwort besser wuerde.
export const MAX_AUSSAGEN = 10
// Obergrenze fuers Gedaechtnis. Niedriger als beim Aussagen-Speicher, weil jeder Eintrag hier
// eine ausdrueckliche Festlegung der Autorin oder des Autors ist: acht davon kann ein Modell
// beim Antworten wirklich einhalten, zwanzig verwaessern einander zu Hintergrundrauschen.
export const MAX_GEDAECHTNIS = 8

// Obergrenzen fuer die Nachbartexte (die anderen Texte desselben Projekts).
//
// BEGRUENDUNG, warum genau diese zwei Zahlen und nicht groesser:
// Ein Nachbartext kostet hier rund MAX_NACHBAR_ZEICHEN + Gliederung + Titel, also grob 500
// Zeichen, das sind knapp 170 Tokens im Deutschen. Sechs Texte kosten damit etwa 1000 Tokens
// — bei JEDEM Lauf, in JEDEM Kanal. Das ist der teuerste Block dieses Moduls, und er ist es
// wert: er ist der einzige, der dem Modell ueberhaupt zeigt, DASS es andere Texte gibt.
// Groesser wird er nicht, weil der Zweck nicht ist, die anderen Texte zu lesen, sondern zu
// wissen, worum sie gehen — dafuer reichen Ueberschriften und Anfang. Wer den ganzen Text
// braucht, oeffnet ihn.
//
// Breite vor Tiefe: lieber sechs Texte mit je 320 Zeichen als zwei mit je 1000. Eine
// Querverbindung entsteht daraus, dass zwei entfernte Themen einander beruehren — dafuer
// zaehlt, wie viele Themen ueberhaupt vorkommen, nicht wie ausfuehrlich eines davon steht.
export const MAX_NACHBARTEXTE = 6
export const MAX_NACHBAR_ZEICHEN = 320
// Ueberschriften sind die billigste Zusammenfassung, die es gibt: von der Autorin oder dem
// Autor selbst geschrieben, woertlich, und sie decken den GANZEN Text ab statt nur seinen
// Anfang. Sechs davon zeigen den Aufbau; die siebte zeigt nichts Neues mehr.
const MAX_NACHBAR_GLIEDERUNG = 6
const MAX_UEBERSCHRIFT_ZEICHEN = 90
// Unter dieser Laenge ist ein Text ein leeres Blatt mit Titel. Ihn mitzuschicken kostet und
// sagt nichts.
const MIN_NACHBAR_ZEICHEN = 120

const MAX_AUSSAGE_ZEICHEN = 180
const MAX_GEDAECHTNIS_ZEICHEN = 220
const MAX_HAUSSTIL_REGELN = 6
const MAX_PUBLIKUM_JE_FELD = 4

function istObjekt(wert) {
  return Boolean(wert) && typeof wert === 'object' && !Array.isArray(wert)
}

function sauber(wert) {
  return typeof wert === 'string' ? wert.trim() : ''
}

function kuerze(wert, maxZeichen) {
  const text = sauber(wert).replace(/\s+/g, ' ')
  if (text.length <= maxZeichen) return text
  return `${text.slice(0, maxZeichen - 1).trimEnd()}…`
}

// Genau ein Schlusszeichen. Die Werte kommen aus Eingabefeldern und tragen ihren Punkt mal
// mit, mal nicht — ohne diese Pruefung stuende im Prompt "…schreiben.«." oder "…Wirkung..".
function satzEnde(text) {
  return /[.!?…«»]$/.test(text) ? text : `${text}.`
}

function liste(wert, max) {
  const eintraege = (Array.isArray(wert) ? wert : [wert])
    .map(eintrag => sauber(eintrag))
    .filter(Boolean)
  return typeof max === 'number' ? eintraege.slice(0, max) : eintraege
}

// --- 1. Textsorte und Stilprofil --------------------------------------------------------
// Quelle: buildLanguageContext (language-profile.mjs). Das Buendel wurde bisher an genau
// EINER Stelle verbraucht — einer Anzeige in language-ui.mjs.
//
// buildLanguageContext liefert zu jedem bekannten Feld auch seine Herkunft (sources). Felder
// mit der Herkunft 'project-understanding' stehen bereits im gecachten Projektverstaendnis
// und werden hier weggelassen: sie ein zweites Mal zu schicken kostet bei jedem Lauf und
// bringt dem Modell nichts.
function textsorteBlock(project) {
  if (!istObjekt(project) || !sauber(project.id)) return null

  let kontext = null
  try {
    kontext = buildLanguageContext({ project })
  } catch {
    // Ein beschaedigtes Sprachprofil (etwa eines aus einem fremden Projekt) darf niemals
    // einen bezahlten Agentenlauf verhindern. Dann gibt es diesen Block eben nicht.
    return null
  }

  const bekannt = kontext.known || {}
  const herkunft = kontext.sources || {}
  const teile = []

  const funktion = sauber(bekannt.passageFunction)

  const fach = sauber(bekannt.domain)
  if (fach) teile.push(`Fach oder Markt: ${kuerze(fach, 120)}`)

  const medium = MEDIEN[bekannt.medium] || ''
  if (medium) teile.push(`Medium: ${medium}`)

  const region = REGIONEN[bekannt.region] || ''
  if (region) teile.push(`Sprachregion: ${region}`)

  if (herkunft.audience === 'language-profile') {
    const publikum = liste(bekannt.audience, 4)
    if (publikum.length) teile.push(`Zielgruppe: ${publikum.join(', ')}`)
  }
  if (herkunft.goal === 'language-profile') {
    const ziel = sauber(bekannt.goal)
    if (ziel) teile.push(`Zielzustand beim Publikum: ${kuerze(ziel, 160)}`)
  }

  const publikumsWissen = Object.entries(PUBLIKUM_LABELS)
    .map(([feld, label]) => {
      const werte = liste(bekannt.audienceState?.[feld], MAX_PUBLIKUM_JE_FELD)
      return werte.length ? `${label}: ${werte.join(' · ')}` : ''
    })
    .filter(Boolean)

  const hausstil = liste(bekannt.houseStyle, MAX_HAUSSTIL_REGELN)
    .map(regel => kuerze(regel, 140))

  const handwerk = bekannt.genre
    ? projiziereHandwerk({
      genre: bekannt.genre,
      passageFunction: funktion,
      activeStyle: {
        name: bekannt.styleName,
        purpose: bekannt.stylePurpose,
      },
    })
    : null
  const handwerkText = handwerk ? formatiereHandwerk(handwerk) : ''
  if (handwerk?.name) teile.unshift(`Textsorte: ${handwerk.name}`)

  if (!teile.length && !publikumsWissen.length && !hausstil.length && !handwerkText) return null

  const zeilen = []
  if (teile.length) {
    zeilen.push(
      'Textsorte und Stilprofil dieses Projekts — von der Autorin oder dem Autor selbst '
      + 'gesetzt, nicht geraten. Richte Register, Belegdichte und Ton daran aus: '
      + satzEnde(teile.join('; ')),
    )
  }
  if (publikumsWissen.length) {
    zeilen.push(`Über das Publikum ist festgehalten — ${satzEnde(publikumsWissen.join('; '))}`)
  }
  if (handwerkText) zeilen.push(handwerkText)
  if (hausstil.length) {
    zeilen.push(`Hausstil dieses Projekts, verbindlich:\n${hausstil.map(regel => `- ${regel}`).join('\n')}`)
  }
  return zeilen.join('\n')
}

// --- 2. Der Aussagen-Speicher -----------------------------------------------------------
// Quelle: project.argumentModel.claims, gefuellt von synchronizeClaimLedger (claim-ledger.mjs)
// ueber ALLE Texte eines Projekts hinweg. Das ist der einzige echte dokumentuebergreifende
// Speicher im Programm — und er erreichte das Modell nie.
//
// Was mitgeschickt wird und was nicht:
// - Aussagen aus ANDEREN Texten desselben Projekts: immer erwaegen. Sie sind der eigentliche
//   Gewinn — das Modell sieht sonst nur den offenen Text und kann einem Kapitel widersprechen,
//   das es nie gelesen hat.
// - Aussagen aus dem OFFENEN Text: nur, wenn sie einen echten Belegstand oder eine
//   eingeschraenkte Geltung tragen. Ihr Wortlaut steht ohnehin schon im gecachten
//   Dokumentblock; ein zweites Mal kostet und bringt nichts. Der Belegstand dagegen ist
//   abgeleitetes Wissen, das im Dokumenttext nirgends steht.
// - 'withdrawn' und veraltete ('stale') Aussagen: gar nicht. Sie gelten nicht mehr.
function aussagenBlock(project, doc, docs) {
  const claims = istObjekt(project) && istObjekt(project.argumentModel)
    ? project.argumentModel.claims
    : null
  if (!Array.isArray(claims) || !claims.length) return null

  const projektId = sauber(project.id)
  const offenerTextId = sauber(doc?.id)
  const titelJeText = new Map(
    (Array.isArray(docs) ? docs : [])
      .filter(kandidat => istObjekt(kandidat) && sauber(kandidat.id))
      .map(kandidat => [sauber(kandidat.id), sauber(kandidat.title)]),
  )

  const kandidaten = claims
    .map((claim, reihenfolge) => ({ claim, reihenfolge }))
    .filter(({ claim }) => (
      istObjekt(claim)
      && sauber(claim.text)
      && claim.status !== 'stale'
      && claim.validity !== 'withdrawn'
      && (!projektId || !sauber(claim.projectId) || claim.projectId === projektId)
    ))
    .map(({ claim, reihenfolge }) => {
      // Ohne offenes Dokument ist KEINE Aussage die des offenen Textes — dann sind alle
      // fremd. Sonst stuende spaeter "im offenen Text" an einem Satz, den niemand offen hat.
      const fremd = !offenerTextId || sauber(claim.textId) !== offenerTextId
      const belegstand = BELEGSTAND[claim.evidenceStatus] || ''
      const geltung = GELTUNG[claim.validity] || ''
      const zentral = claim.centrality === 'central'
      // Rangfolge, nicht Vollstaendigkeit: was das Modell am ehesten in einen Widerspruch
      // laufen liesse, steht oben. Bei Gleichstand entscheidet die Reihenfolge im Speicher —
      // damit bleibt die Funktion pur (zweimal derselbe Eingang, zweimal derselbe Ausgang).
      const rang = (fremd ? 4 : 0) + (zentral ? 3 : 0) + (belegstand ? 2 : 0) + (geltung ? 1 : 0)
      return { claim, reihenfolge, fremd, belegstand, geltung, zentral, rang }
    })
    // Aussagen des offenen Textes ohne Belegstand und ohne Einschraenkung stehen bereits
    // woertlich im Dokumentblock — sie hier zu wiederholen waere bezahlte Doppelung.
    .filter(eintrag => eintrag.fremd || eintrag.belegstand || eintrag.geltung)

  if (!kandidaten.length) return null

  const sortiert = kandidaten
    .slice()
    .sort((a, b) => b.rang - a.rang || a.reihenfolge - b.reihenfolge)
  const gezeigt = sortiert.slice(0, MAX_AUSSAGEN)

  const zeilen = gezeigt.map(eintrag => {
    const merkmale = []
    if (eintrag.fremd) {
      const titel = titelJeText.get(sauber(eintrag.claim.textId))
      if (titel) merkmale.push(`aus »${kuerze(titel, 60)}«`)
      else merkmale.push(offenerTextId ? 'aus einem anderen Text des Projekts' : 'aus diesem Projekt')
    } else {
      merkmale.push('im offenen Text')
    }
    if (eintrag.zentral) merkmale.push('zentral')
    if (eintrag.geltung) merkmale.push(eintrag.geltung)
    if (eintrag.belegstand) merkmale.push(eintrag.belegstand)
    return `- »${kuerze(eintrag.claim.text, MAX_AUSSAGE_ZEICHEN)}« (${merkmale.join(', ')})`
  })

  const kopf = 'Aussagen-Speicher des Projekts — was in diesem Projekt bereits behauptet wird, '
    + 'auch in Texten, die du hier nicht siehst. Widersprich dem nicht unbemerkt und verkaufe '
    + 'es nicht als neue Erkenntnis:'
  const fuss = sortiert.length > gezeigt.length
    ? `\nErfasst sind ${sortiert.length} solcher Aussagen; hier stehen die ${gezeigt.length} wichtigsten.`
    : ''
  return `${kopf}\n${zeilen.join('\n')}${fuss}`
}

// Ein bezahlter Block statt mehrerer konkurrierender Wissensanhaenge. Der bestehende
// Aussagen-Speicher bleibt darin das argumentierende Rueckgrat; Quellen, Belegbuendel,
// Relationen und die aktuelle Sprach-/Wirkungsanalyse kommen aus der budgetierten,
// projektisolierten Arbeitskontext-Projektion. So erhalten alle vier Kanaele dieselbe Sicht.
function arbeitsdossierBlock(project, doc, docs) {
  const aussagen = aussagenBlock(project, doc, docs)
  const zusaetze = formatiereArbeitskontext(baueArbeitskontext({ project, doc }))
  return [aussagen, zusaetze].filter(Boolean).join('\n') || null
}

// --- 3. Die anderen Texte desselben Projekts ---------------------------------------------
// Der Befund, den dieser Abschnitt behebt: jede Anfrage sah genau EIN Dokument. Ein Gedanke,
// der zwei Texte verbindet, war nicht bloss ungebaut — er wurde von der Eingangspruefung
// weggeworfen, weil sein Anker nicht im offenen Text stand.
//
// WARUM DIESE QUELLE und nicht eine andere. Drei kamen in Frage:
//   - doc.summary: gibt es nicht. Kein Dokument im Programm traegt ein solches Feld (der Task
//     'zusammenfassung' verdichtet Gespraechsverlaeufe, keine Texte). Eine Zusammenfassung
//     erst erzeugen zu lassen hiesse, vor jedem Lauf je Nachbartext einen weiteren bezahlten
//     Lauf zu starten.
//   - project.argumentModel.claims: liegt vor und wird schon genutzt (aussagenBlock). Aber
//     der Speicher fuellt sich nur fuer den GERADE OFFENEN Text und nur, wenn jemand die
//     Argument- oder Sprachseite geoeffnet hat (synchronizeClaimLedger in argument-ui.mjs und
//     language-ui.mjs). In einem Projekt, in dem das nie passiert ist, waere der Horizont
//     dauerhaft leer — und niemand saehe, warum.
//   - Titel, Ueberschriften und Anfang aus doc.body: existiert IMMER, ist billig, ist
//     deterministisch aus Gespeichertem ableitbar — und, der entscheidende Punkt, es ist
//     WOERTLICH.
//
// Woertlich ist keine Nebensache, sondern der ganze Trick. Ein Anker muss auffindbar sein.
// Zeigt man dem Modell eine Umschreibung, kann es nur die Umschreibung zitieren, und die
// steht in keinem Text — sie waere also entweder zu verwerfen (dann gibt es weiterhin keine
// Querverbindung) oder auf Treu und Glauben zu uebernehmen (dann faellt die Sicherung).
// Woertliche Ausschnitte sind beides zugleich: bezahlbar und zitierbar.
//
// GESUCHT wird spaeter im GANZEN Text des Nachbarn, nicht nur im gezeigten Ausschnitt (siehe
// volltext unten). Das ist keine Nachsicht: das Modell kann nur zitieren, was es gesehen hat.
// Der volle Text sorgt dafuer, dass der gespeicherte Index eine ECHTE Stelle in jenem
// Dokument bezeichnet und nicht eine Position in einem Ausschnitt, den es nirgends gibt.

// Zeichen, die in gespeichertem Text als Entitaet stehen. Bewusst kurz gehalten: der Body
// kommt aus dem eigenen Editor, nicht aus dem Netz, und der serialisiert genau diese.
const ENTITAETEN = Object.freeze({
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
})

function entschluessele(text) {
  return String(text).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (ganzes, code) => {
    if (code[0] === '#') {
      const zahl = code[1] === 'x' || code[1] === 'X'
        ? Number.parseInt(code.slice(2), 16)
        : Number.parseInt(code.slice(1), 10)
      return Number.isFinite(zahl) && zahl > 0 && zahl <= 0x10ffff ? String.fromCodePoint(zahl) : ganzes
    }
    const zeichen = ENTITAETEN[code.toLowerCase()]
    return zeichen === undefined ? ganzes : zeichen
  })
}

// Wo ein Block endet, endet auch ein Gedanke: dort kommt ein Absatz hin, sonst klebte
// "…Ende.Anfang…" zusammen und das Modell laese einen Satz, den niemand geschrieben hat.
const BLOCK_ENDE = /<\/(?:p|h[1-6]|li|blockquote|pre|figcaption|div|tr)>|<br\s*\/?>/gi
const UEBERSCHRIFT = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi

// Der gespeicherte Text eines Dokuments als reiner Text — PUR, ohne DOM. Dieselbe Ableitung
// wird fuer das GEZEIGTE und fuer das GESUCHTE benutzt; das ist Bedingung, nicht Bequemlichkeit.
// Weichen beide voneinander ab, zitiert das Modell aus der einen Fassung und die Pruefung
// sucht in der anderen — dann wird jede Querverbindung verworfen, und niemand fande heraus,
// warum.
export function textAusKoerper(body, { ohneUeberschriften = false } = {}) {
  if (typeof body !== 'string' || !body) return ''
  const roh = ohneUeberschriften ? body.replace(UEBERSCHRIFT, ' ') : body
  return entschluessele(
    roh
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(BLOCK_ENDE, '\n\n')
      .replace(/<[^>]*>/g, ''),
  )
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(zeile => zeile.replace(/[^\S\n]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function ueberschriften(body) {
  const gefunden = []
  for (const treffer of String(body || '').matchAll(UEBERSCHRIFT)) {
    const zeile = kuerze(entschluessele(treffer[1].replace(/<[^>]*>/g, '')), MAX_UEBERSCHRIFT_ZEICHEN)
    if (zeile) gefunden.push(zeile)
  }
  return gefunden
}

// Die Nachbartexte als Daten, nicht als Prompt-Text. Zwei Verbraucher, ein Ergebnis:
// nachbartexteBlock zeigt daraus titel/gliederung/anfang, und die Verankerung des
// Erweiterungslaufs (erweiterungslauf-model.mjs) sucht darin volltext. Beide MUESSEN
// dieselbe Liste sehen — darum eine Funktion und keine zwei.
export function baueNachbartexte(quellen = {}) {
  const { project = null, doc = null, docs = [] } = istObjekt(quellen) ? quellen : {}
  const projektId = sauber(project?.id)
  if (!projektId) return []
  const offenerTextId = sauber(doc?.id)

  // Erst die billigen Pruefungen, dann die Rangfolge, und ERST DANN der Text. Ein Projekt
  // mit fuenfzig Texten wuerde sonst bei jedem Lauf fuenfzig Koerper auseinandernehmen, um
  // sechs davon zu benutzen. So endet die Arbeit, sobald die Obergrenze voll ist.
  //
  // Fremdes Projekt, Papierkorb, der offene Text selbst: alles drei ist kein Nachbar.
  // ctx.state.docs traegt die Texte ALLER Projekte — ohne diese Pruefung liefe der Horizont
  // eines Projekts in ein anderes hinein.
  const kandidaten = (Array.isArray(docs) ? docs : [])
    .map((kandidat, reihenfolge) => ({ kandidat, reihenfolge }))
    .filter(({ kandidat }) => (
      istObjekt(kandidat)
      && sauber(kandidat.id)
      && sauber(kandidat.id) !== offenerTextId
      && sauber(kandidat.projectId) === projektId
      && !kandidat.trashed
    ))
    // Rangfolge: zuletzt bearbeitet zuerst. Woran gerade gearbeitet wird, steht dem offenen
    // Text am naechsten. Bei Gleichstand die Reihenfolge im Speicher — damit bleibt die
    // Funktion pur (zweimal derselbe Eingang, zweimal derselbe Ausgang).
    .sort((a, b) => (
      (Number.isFinite(b.kandidat.updated) ? b.kandidat.updated : 0)
      - (Number.isFinite(a.kandidat.updated) ? a.kandidat.updated : 0)
      || a.reihenfolge - b.reihenfolge
    ))

  const gefunden = []
  for (const { kandidat } of kandidaten) {
    if (gefunden.length >= MAX_NACHBARTEXTE) break
    const volltext = textAusKoerper(kandidat.body)
    if (volltext.length < MIN_NACHBAR_ZEICHEN) continue
    const gliederung = ueberschriften(kandidat.body).slice(0, MAX_NACHBAR_GLIEDERUNG)
    const anfang = kuerze(textAusKoerper(kandidat.body, { ohneUeberschriften: true }), MAX_NACHBAR_ZEICHEN)
    gefunden.push({
      docId: sauber(kandidat.id),
      titel: sauber(kandidat.title),
      volltext,
      gliederung,
      anfang,
      // Nur diese wortgetreuen Teile sieht das Modell. Die Verankerung darf spaeter im
      // Volltext den echten Index suchen, aber zuerst muss der Anker in genau einem dieser
      // sichtbaren Ausschnitte vorkommen. Sonst wuerde ein geratenes Zitat aus einem
      // verborgenen spaeten Absatz nachtraeglich als echt bestaetigt.
      sichtbareTeile: [...gliederung, anfang].filter(Boolean),
    })
  }
  return gefunden
}

function nachbartexteBlock(project, doc, docs) {
  const nachbarn = baueNachbartexte({ project, doc, docs })
  if (!nachbarn.length) return null

  const zeilen = nachbarn.map(nachbar => {
    const kopf = nachbar.titel ? `»${kuerze(nachbar.titel, 60)}«` : 'ein Text ohne Titel'
    const teile = [`- ${kopf}`]
    if (nachbar.gliederung.length) teile.push(`  Gliederung: ${nachbar.gliederung.join(' · ')}`)
    if (nachbar.anfang) teile.push(`  Anfang: „${nachbar.anfang}“`)
    return teile.join('\n')
  })

  return 'Die anderen Texte dieses Projekts. Sie stehen hier nicht vollständig, sondern nur '
    + 'mit Überschriften und Anfang — sie sind der Horizont, in dem der offene Text steht. '
    + 'Lies ihn nicht für sich allein: was hier nebenan liegt, kann ihn tragen, ihm '
    + 'widersprechen oder ihn in ein Feld führen, das er noch nicht betreten hat.\n'
    + 'Willst du eine Stelle in einem dieser Texte benennen, zitiere sie WÖRTLICH aus dem, '
    + 'was hier steht; ein solches Zitat gilt als Anker wie ein Zitat aus dem offenen Text. '
    + 'Was hier nicht steht, kennst du nicht — erfundene oder umformulierte Zitate werden '
    + 'verworfen.\n'
    + zeilen.join('\n')
}

// --- 4. Das Gedaechtnis ------------------------------------------------------------------
// Quelle: retrieveMemoryContext und buildStyleMemoryContext (memory-retrieval.mjs).
//
// Was heute wirklich darin steht: memoryStore.entries wird ausschliesslich vom
// Freigabe-Fluss im Gedaechtnis-Dialog gefuellt (memory-ui.mjs ensureProjectEntry und
// decideMemoryTransfer in memory-retrieval.mjs). In einer frischen Installation ist die
// Liste leer — dann erzeugt dieser Block nach Regel 3 gar nichts. Sobald die Autorin oder
// der Autor aber eine Erinnerung ausdruecklich fuer ein Projekt freigegeben hat, ist das
// eine Festlegung, die das Modell kennen muss.
//
// Die Bindung kommt aus buildStyleMemoryContext und wird hier nicht neu erfunden:
// Projekt-Stimme ist eine Projektentscheidung (bindend), eine persoenliche Vorliebe ist
// ausdruecklich nicht bindend. Genau diesen Unterschied verwischt ein Modell sonst.
function gedaechtnisBlock(project, doc, memoryStore) {
  if (!istObjekt(memoryStore)) return null
  const projektId = sauber(project?.id)
  if (!projektId) return null

  const textId = sauber(doc?.id) || null
  let records = []
  let stil = { projectVoice: [], personalPreferences: [] }
  try {
    records = retrieveMemoryContext({ store: memoryStore, projectId: projektId, textId }).records || []
    stil = buildStyleMemoryContext({ store: memoryStore, projectId: projektId, textId })
  } catch {
    // Ein beschaedigter Speicher darf keinen bezahlten Lauf kosten.
    return null
  }
  if (!records.length) return null

  const stimme = liste(stil.projectVoice).map(inhalt => kuerze(inhalt, MAX_GEDAECHTNIS_ZEICHEN))
  const vorlieben = liste(stil.personalPreferences).map(inhalt => kuerze(inhalt, MAX_GEDAECHTNIS_ZEICHEN))
  const wissen = records
    // Erkanntes besitzt einen eigenen Personen-Block direkt dahinter. Es hier noch einmal
    // als "fuer dieses Projekt freigegeben" zu zeigen waere doppelt bezahlt und sachlich
    // falsch: ein persoenliches Prinzip gilt projektuebergreifend, ohne Projektfreigabe.
    .filter(record => !['voice', ERKANNTES_TYP].includes(record?.entry?.type))
    .map(record => kuerze(record.entry?.content, MAX_GEDAECHTNIS_ZEICHEN))
    .filter(Boolean)

  // Ein gemeinsames Budget in fester Rangfolge: bindende Festlegungen zuerst, unverbindliche
  // Vorlieben zuletzt. So faellt beim Kuerzen nie eine Zusage weg, um eine Vorliebe zu retten.
  let rest = MAX_GEDAECHTNIS
  const nimm = (eintraege) => {
    const genommen = eintraege.slice(0, Math.max(0, rest))
    rest -= genommen.length
    return genommen
  }
  const gezeigteStimme = nimm(stimme)
  const gezeigtesWissen = nimm(wissen)
  const gezeigteVorlieben = nimm(vorlieben)

  const inAnfuehrung = (eintraege) => satzEnde(eintraege.map(inhalt => `»${inhalt}«`).join('; '))
  const zeilen = []
  if (gezeigteStimme.length) {
    zeilen.push(`Für dieses Projekt festgelegt und damit bindend: ${inAnfuehrung(gezeigteStimme)}`)
  }
  if (gezeigtesWissen.length) {
    zeilen.push(`Ausdrücklich für dieses Projekt freigegebenes Wissen: ${inAnfuehrung(gezeigtesWissen)}`)
  }
  if (gezeigteVorlieben.length) {
    zeilen.push('Persönliche Vorlieben — nicht bindend, nur berücksichtigen, wenn nichts '
      + `dagegen spricht: ${inAnfuehrung(gezeigteVorlieben)}`)
  }
  if (!zeilen.length) return null
  return `Gedächtnis, was früher schon entschieden wurde:\n${zeilen.join('\n')}`
}

// Baut aus Projekt, Dokument, Geschwistertexten und Gedaechtnisspeicher die Liste von
// Textbloecken, die baueAnfrage in kontext.volatiles erwartet — hoechstens fuenf, jeder nur,
// wenn er wirklich etwas zu sagen hat. Kein Wurf: keine Quelle darf einen bezahlten
// Agentenlauf verhindern.
// Was diese Person schon erkannt hat (erkanntes-model.mjs) — der einzige Block, der
// einem MENSCHEN gehoert und nicht einem Artefakt. Er sagt dem Modell nicht "sei
// stiller", sondern "wiederhole dich nicht": ein Prinzip, das hier steht, muss beim
// naechsten Mal nicht noch einmal erklaert werden, sondern darf als bekannt gelten.
//
// Das ist ein wichtiger Unterschied. Wuerde der Block "verschweige, was hier steht"
// bedeuten, wuerde das System schlechter, je mehr es weiss — und wer denselben Fehler
// zum fuenften Mal macht, bekaeme genau dann keinen Hinweis mehr, wenn er ihn am
// noetigsten braucht.
function erkanntesBlock(memoryStore) {
  const saetze = erkanntesFuerPrompt(memoryStore)
  if (!saetze.length) return null
  return 'Was diese Person beim Schreiben schon erkannt hat — die Prinzipien dahinter sind ihr '
    + 'bereits gelaeufig. Erklaere sie nicht noch einmal von Grund auf; nimm sie als bekannt an '
    + 'und sei entsprechend knapp. Das heisst NICHT, zu schweigen: taucht dieselbe Sache wieder '
    + 'auf, sag es trotzdem — nur kuerzer, als Erinnerung statt als Lehre. Eine Zahl in Klammern '
    + 'ist die Zahl der bisherigen Begegnungen.\n'
    + saetze.map(satz => `- ${satz}`).join('\n')
}

export function baueOndaBloecke(quellen = {}) {
  const {
    project = null,
    doc = null,
    docs = [],
    memoryStore = null,
  } = istObjekt(quellen) ? quellen : {}
  return [
    textsorteBlock(project),
    arbeitsdossierBlock(project, doc, docs),
    // Die beiden Bloecke ueber die anderen Texte ergaenzen einander und doppeln sich nicht:
    // der Aussagen-Speicher sagt, WAS anderswo behauptet wird (abgeleitet, gekuerzt, damit
    // nicht zitierfaehig), die Nachbartexte sagen, WORUM es dort geht (woertlich, damit
    // zitierfaehig). Nur der zweite kann einen Anker tragen.
    nachbartexteBlock(project, doc, docs),
    gedaechtnisBlock(project, doc, memoryStore),
    erkanntesBlock(memoryStore),
  ].filter(Boolean)
}

// Haengt die Onda-Bloecke HINTEN an die volatiles eines fertigen Kontexts an, ohne die
// Eingabe zu veraendern. Fuer die Kanaele, deren Kontext-Bau in einer Ablaufsteuerung
// zwischen workspace.js und dem Kontext-Bauer liegt (Hinweislauf, Erweiterungslauf) — dort
// gibt es fuer den Aufrufer keinen anderen Weg, dem Bauer etwas mitzugeben.
// Ohne Bloecke bleibt der Kontext unveraendert (kein leerer Eintrag, Regel 3).
export function ergaenzeOndaKontext(kontext, quellen) {
  const bloecke = baueOndaBloecke(quellen)
  if (!bloecke.length) return kontext
  return {
    ...kontext,
    volatiles: [...(Array.isArray(kontext?.volatiles) ? kontext.volatiles : []), ...bloecke],
  }
}
