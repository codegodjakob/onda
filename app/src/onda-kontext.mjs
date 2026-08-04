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
import { erkanntesFuerPrompt } from './erkanntes-model.mjs'

// 'other'/'Sonstig' ist eine bewusste Wahl der Autorin oder des Autors, sagt dem Modell aber
// nichts ueber den Text — leerer Label heisst: dieses Feld erzeugt keinen Eintrag.
const TEXTSORTEN = Object.freeze({
  scientific: 'wissenschaftlicher Text',
  essay: 'Essay',
  project: 'Projekttext',
  web: 'Webtext',
  marketing: 'Marketingtext',
  campaign: 'Kampagnentext',
  other: '',
})
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

  const textsorte = TEXTSORTEN[bekannt.genre] || ''
  if (textsorte) teile.push(`Textsorte: ${textsorte}`)

  const funktion = sauber(bekannt.passageFunction)
  if (funktion) teile.push(`Funktion dieses Textteils: ${kuerze(funktion, 120)}`)

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

  if (!teile.length && !publikumsWissen.length && !hausstil.length) return null

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

// --- 3. Das Gedaechtnis ------------------------------------------------------------------
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
    .filter(record => record?.entry?.type !== 'voice')
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

// Baut aus Projekt, Dokument und Gedaechtnisspeicher die Liste von Textbloecken, die
// baueAnfrage in kontext.volatiles erwartet — hoechstens drei, jeder nur, wenn er wirklich
// etwas zu sagen hat. Kein Wurf: keine Quelle darf einen bezahlten Agentenlauf verhindern.
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
    aussagenBlock(project, doc, docs),
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
