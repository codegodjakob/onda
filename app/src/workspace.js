import {
  applyAnchoredReplacements,
  getActiveBlockId,
  getEditorBlocks,
  insertAnchoredText,
  insertSemanticBlock,
  insertSemanticHeading,
  moveTopLevelBlock,
  replaceAnchoredTexts,
  replaceFindingTarget,
} from './block-identity.js'
import { decideFinding, ensureProjectUnderstanding, ensureReasoningModel, getFindingQueue, isIntegrityCategory, istInterviewOffen, istRisikoAnnahme, loeseSchutz, markiereEntwurfVersucht, markiereGeschuetzt, mergeVerstaendnis } from './reasoning-model.mjs'
import {
  appendThreadMessage,
  completeEditingFinding,
  createEditingFindingState,
  dismissAgentMessage,
  ensureWorkspaceState,
  hasUnseenInitiative,
  reconcileEditingFinding,
  resolveEvidenceSources,
  resolveFindingBlock,
  resolveFindingPlacement,
  shouldOpenAgentWidget,
  structureHintMap,
} from './workspace-model.mjs'
import { bausteinNamen, bausteinRollen } from './bausteinlauf-model.mjs'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { applySettings } from './ui.js'
import { hatSchluessel, setzeSchluessel, loescheSchluessel } from './agent-gateway.mjs'
// Das Lauf-Tor (Issue #12): Sperre, Signatur, Buchung und Journal fuer jeden bezahlten
// Lauf. Alle vier Kanaele (Interview, Chat, Hinweis, Erweiterung, Task 8 schliesst die
// Reihe) laufen jetzt ausschliesslich hierueber — kein Kanal importiert runTask mehr
// direkt aus agent-gateway.mjs, jeder bekommt es als Parameter von fuehreLaufAus'
// laufFn (siehe starteVerstaendnisEntwurf/sendeInterviewAntwort, sendeAgentenChat/
// sendeLocalChat, fuehreHinweislaufAus, fuehreErweiterungslaufAus).
import { fuehreLaufAus, kanalGesperrt, merkeKarteGezeigt, torJournal } from './lauf-tor.mjs'
import { letzteBezahlteSignatur } from './lauf-journal.mjs'
import { aktuellerAgentStatus, beiAgentStatus, setzeAgentStatus, statuszeileFuer } from './agent-status.mjs'
import { EXAMPLE_PROJECT_ID, seedBodySignature } from './example-seed.mjs'
import { MODELLE, TASK_TABLE } from './agent-tasks.mjs'
import { baueVerstaendnisKontext } from './verstaendnis-kontext.mjs'
import { ergaenzeOndaKontext } from './onda-kontext.mjs'
import { erkanntesListe, schreibeErkanntes, ueberholeErkanntes } from './erkanntes-model.mjs'
import {
  entscheideStimmenmerkmal,
  projiziereAutorentwicklung,
  schlageStimmenmerkmalVor,
  speichereStimmenmerkmal,
  ueberholeStimmenmerkmal,
} from './autorentwicklung-model.mjs'
import {
  interviewNachrichtId,
  istBeispielProjekt,
  planeInterviewNachricht,
  projektZumDokument,
} from './verstaendnis-interview.mjs'
import { baueDocText } from './agent-findings.mjs'
import { pruefePausenAusloeser, versucheHinweislauf } from './hinweislauf-model.mjs'
import {
  bilanziereRueckmeldung,
  entscheideRueckkopplung,
  erstelleRueckkopplungsvorschlag,
  rueckkopplungTabelle,
} from './rueckkopplung-model.mjs'
import { darfAutomatischLaufen, versucheErweiterungslauf } from './erweiterungslauf-model.mjs'
import {
  ART_ERKLAERUNG,
  ART_LABEL,
  ensureErweiterungen,
  legeErweiterungWeg,
  merkeErweiterung,
  sichtbareErweiterungen,
} from './erweiterung-model.mjs'
import {
  AUFSCHAUEN_MS,
  INNEHALTEN_AN_GRENZE_MS,
  INNEHALTEN_MS,
  aktuellerMoment,
  artVon,
  darfErscheinen,
  istSatzende,
} from './momente-model.mjs'
import {
  baueChatKontext,
  baueFindingZusatzAnweisung,
  chatFehlerText,
  entscheidungsEintraege,
  erkenneHinweisBitte,
  fuehreChatVorgangAus,
  planVerlaufVerdichtung,
} from './chat-kontext.mjs'
import {
  beansprucheAutomatiklauf,
  budgetStand,
  gibNaechstenAutomatiklaufFrei,
} from './settings-model.mjs'
import { createSourceLibraryUi } from './source-library-ui.mjs'
import {
  OHNE_THEMA,
  OHNE_THEMA_NAME,
  benenneThemaUm,
  beschreibeThema,
  ensureQuellenThemen,
  legeThemaAn,
  loescheThema,
  themenBaum,
  uebernimmThemenvorschlag,
  verschiebeQuelle,
} from './quellen-thema-model.mjs'
// quellenTitel liegt im Kontext-Bauer, weil dort schon entschieden ist, wie eine Quelle
// heisst (metadata.title.value, source-model.mjs). Zwei Fassungen waeren zwei Namen fuer
// dieselbe Quelle — im Prompt der eine, auf dem Schirm der andere.
import { quellenTitel } from './quellen-kontext.mjs'
import { darfAutomatischOrdnen, quellenSignatur, versucheQuellenlauf } from './quellenlauf-model.mjs'
import { createMemoryUi } from './memory-ui.mjs'
import { createArgumentUi } from './argument-ui.mjs'
import { createLanguageUi } from './language-ui.mjs'
import { analyzeArgumentImpact } from './argument-graph.mjs'
import { createAuditUi } from './audit-ui.mjs'
import {
  annotationSummary,
  createAnnotationController,
} from './annotation-controller.mjs'
import { renderAnnotation } from './annotation-components.mjs'
import { gestaltFuerFinding, resolveAnnotationPresentation } from './annotation-contract.mjs'
import {
  invertAnnotationOperation,
  planAnnotationOperation,
  validateAnnotationOperation,
} from './annotation-operations.mjs'
import { ondaIcon } from './onda-icons.mjs'
import { bilanzVorlesetext } from './anmerkung-wortlaut.mjs'
import {
  BEWEGUNG,
  blaseIstMoeglich,
  erzeugeKontur,
  kurveOut,
  kurveStandard,
  laesseBlaseWachsen,
  tokenDauer,
} from './onda-blase.mjs'

const BLOCK_TYPES = [
  ['paragraph', 'Freier Absatz'],
  ['claim', 'Kernbehauptung'],
  ['evidence', 'Beleg'],
  ['counterpoint', 'Gegenposition'],
  ['transition', 'Übergang'],
  ['question', 'Offene Frage'],
]

// Die Beschriftung einer Karte — bewusst OHNE den gewoehnlichen Absatz. "Freier Absatz" war
// ein Etikett ohne Aussage: Es sah aus wie eine Angabe und war keine. Wer nichts weiss, sagt
// hier nichts.
//
// Im MENUE behaelt das Wort seinen Sinn (BLOCK_TYPES, unveraendert): Dort heisst es "lege
// einen gewoehnlichen Absatz an" -- das ist eine Aussage. Beschriften und Auswaehlen sind
// zwei verschiedene Zwecke, darum ab hier zwei verschiedene Tabellen.
const ROLE_LABELS = new Map([
  ...BLOCK_TYPES.filter(([rolle]) => rolle !== 'paragraph'),
  ['heading', 'Überschrift'],
])

let ctx = null
let controller = null
let annotationController = null
let lastContext = null
let renderedDocId = null
let decoratedDocId = null
let decoratedBlockId = null
let insertMenu = null
let isComposing = false
let structureNavState = null
let localDecoratedDocId = null
let localDecoratedFindingId = null
let localDecoratedBlockId = null
let localDecoratedSpacing = 0
let localDecoratedAbsatzweit = false
let localDecoratedGestalt = 'keine'
let localDecoratedZiel = ''
let localDecoratedOrtswechsel = ''
let localFeedbackError = null
let localPositionFrame = null
let localSummaryFocusRequest = null
// Wem gehoert Befehl+Z gerade? Seit die Anmerkungsleiste fort ist
// (docs/PHILOSOPHIE.md §1), gibt es keinen Rueckgaengig-Knopf mehr — die Taste muss
// beides koennen. Sie nimmt eine uebernommene Anmerkung zurueck, solange die Anmerkung
// das Letzte war, was geschah. Sobald wieder getippt wird, gehoert sie dem Text.
// Ohne diese Unterscheidung wuerde Befehl+Z nach zwanzig geschriebenen Woertern eine
// Anmerkung von vorhin zurueckholen — und genau das erwartet niemand.
let letzteAenderungWarAnmerkung = false
let agentInitiativeTimer = null
// Echter Hinweislauf (Etappe A, Spec §5): genau ein Lauf gleichzeitig. Die Lauf-Sperre selbst
// (frueher hier als hinweislaufAktiv) lebt jetzt im Lauf-Tor (lauf-tor.mjs, Task 7) —
// kanalGesperrt('hinweis') fragt sie ab, fuehreLaufAus setzt/loest sie synchron. Hier bleibt nur
// noch hinweislaufTimer, der Zeitgeber-Griff fuer den Pausen-Ausloeser (planeHinweislauf/
// clearHinweislaufTimer, H-3).
let hinweislaufTimer = null
// Zweiter Kanal (Erweiterungen): eigene Sperre, damit ein Erweiterungslauf und ein
// Hinweislauf einander nicht ausschliessen -- es sind zwei verschiedene Fragen an
// denselben Text, und der Cache-Praefix ist derselbe, also kostet der zweite wenig.
// Die Sperre selbst (frueher hier als erweiterungslaufAktiv) lebt jetzt im Lauf-Tor
// (lauf-tor.mjs, Task 8) — kanalGesperrt('erweiterung') fragt sie ab, fuehreLaufAus
// setzt/loest sie synchron. Hier bleibt nur noch erweiterungslaufTimer, der
// Zeitgeber-Griff fuer den Aufschauen-Ausloeser (planeErweiterungslauf/
// clearErweiterungslaufTimer).
let erweiterungslaufTimer = null
// Dritter Lauf (Quellenthemen): wieder eine eigene Sperre. Er fragt etwas ganz anderes
// als die beiden ueber ihm -- nicht nach dem Text, sondern nach dem Material des
// Projekts -- und darf deshalb auch neben ihnen laufen.
let letzteQuellenSignatur = null
// Zeitgeber fuer den Momentwechsel: wenn genug Ruhe vergangen ist, darf mehr sichtbar
// werden. Ohne diesen Zeitgeber erschiene das Zurueckgehaltene erst beim naechsten
// Tastendruck -- also genau dann nicht, wenn man aufschaut.
let momentTimer = null
// Aufgeschaut, ohne 45 Sekunden Pause. Gilt bis zum naechsten Tastendruck.
// Es gibt dafuer KEINEN Griff in der Oberflaeche und soll auch keinen geben — Anmerkungen
// werden nicht abgeholt (docs/PHILOSOPHIE.md §1). Gesetzt wird der Merker allein daran,
// dass jemand gerade ueber einen Hinweis ENTSCHIEDEN hat (decideAndAdvance): wer
// Rueckmeldung durcharbeitet, schreibt nicht, und der naechste Hinweis darf sofort
// folgen. Bis zum 7.8.2026 stand hier ein Versprechen auf eine Zeile in der
// Seitenleiste ("N Hinweise warten aufs Aufschauen — jetzt zeigen"); die zaehlte
// Anmerkungen und ist mit der Flaeche gefallen.
let momentVonHand = false
// Wann zuletzt ueber einen Hinweis entschieden wurde. Steuert, ab wann die Ruhe fuer
// den naechsten Moment zaehlt (momente-model.mjs, aktuellerMoment).
let letzteEntscheidungAt = null
// Was einmal auf dem Schirm stand, bleibt stehen. Der Moment entscheidet ueber das
// ERSTE Erscheinen, nicht ueber das Bleiben — sonst verschwindet eine Karte, die man
// gerade liest, sobald man wieder tippt. Wird mit dem Dokument zurueckgesetzt.
let gezeigteHinweise = { docId: null, ids: new Set() }

function merkeGezeigt(docId, findingId, { art, moment } = {}) {
  if (gezeigteHinweise.docId !== docId) gezeigteHinweise = { docId, ids: new Set() }
  if (!findingId) return
  const istErstesMal = !gezeigteHinweise.ids.has(findingId)
  gezeigteHinweise.ids.add(findingId)
  // Erstes Erscheinen je Karte wandert zusaetzlich ins Journal (Messpunkt fuer die
  // spaetere Momente-Kalibrierung, Issue #12-Kommentar) -- das fluechtige Set hier
  // bleibt unveraendert die Anzeige-Wahrheit, der Journal-Eintrag ist rein additiv.
  if (istErstesMal) merkeKarteGezeigt({ findingId, art, moment })
}

// Was WIRKLICH auf dem Schirm stand — getrennt von gezeigteHinweise darueber.
//
// Der Unterschied ist der Grund fuer diese zweite Menge. gezeigteHinweise sammelt jeden
// Hinweis, der gerade erscheinen DUERFTE, und speist damit das Journal (welche Karten
// waren dran). Auf dem Schirm steht aber immer nur einer (currentPassageFinding). Wer
// beides in einen Topf wirft, erklaert alle uebrigen fuer gezeigt, ohne dass sie je
// jemand gesehen haette — und weil „was einmal stand, bleibt stehen" die Moment-Regel
// aushebelt, wurde daraus „was einmal durfte, darf immer". Genau daran lief die Kette
// weiter, die nach jedem Wegklicken sofort den naechsten Hinweis brachte.
//
// Das Journal bleibt unangetastet: es misst weiter, was dran war. Die Anzeige-Wahrheit
// steht hier.
let sichtbareHinweise = { docId: null, ids: new Set() }

function merkeSichtbar(docId, findingId) {
  if (sichtbareHinweise.docId !== docId) sichtbareHinweise = { docId, ids: new Set() }
  if (findingId) sichtbareHinweise.ids.add(findingId)
}

function schonGezeigt(docId, findingId) {
  return sichtbareHinweise.docId === docId && sichtbareHinweise.ids.has(findingId)
}
let agentLiveFrame = null
let agentPresenceFocusRequest = false
// Die Sprechblase: was sie gerade zeigt (offen/zu), ihr Zeichengeraet, der laufende
// Antrieb und der Beobachter, der ihre Masse nachfuehrt.
let blaseSteht = null // null = noch nie gezeichnet; sonst true/false
let blaseKontur = null
let blaseAntriebStoppen = null
let blaseBeobachter = null
// Nur Fassung B des Abgangs: haelt renderAgentWidget davon ab, den Inhalt abzuraeumen,
// waehrend sich die Blase noch zusammenfaltet.
let blaseFaeltZurueck = false
let pendingParagraphBoundaryDocId = null
let evidenceFocusRequest = false
let evidenceReturnFindingId = null
let riskConfirmationFocusRequest = false
let ondaDialog = null
// Verständnis-Interview: einmal je Projekt+Dokument prüfen. Die Lauf-Sperre selbst
// (frueher hier als interviewLaufAktiv) lebt jetzt im Lauf-Tor (lauf-tor.mjs) —
// kanalGesperrt('interview') fragt sie ab, fuehreLaufAus setzt/loest sie synchron.
let interviewPruefKey = null
let interviewStatus = null // null | 'laeuft' | ruhiger Fehlertext für die Statuszeile
let pausierterAutomatiklauf = null
// Echter Chat (Etappe A, Bereich C; Tor-Anschluss Task 6): die SPERRE wohnt jetzt im Tor
// (lauf-tor.mjs, kanalGesperrt('chat')/fuehreLaufAus) — hier lebt nur noch der
// Stream-Zustand, app-weit EIN Feld (Panel und Randkarten-Gespraeche teilen es sich
// weiterhin ueber fuehreChatLauf).
//
// Das Akzent-Menue, das der Zweig hier noch mitbrachte, kommt NICHT zurueck: main hat
// es abgeschafft, Sky ist der einzige Akzent (onda-design-contract.test.mjs).
let chatStream = null

const AGENT_IDLE_MS = 3000
const AGENT_BOUNDARY_IDLE_MS = 300
const CHAT_UI_DROSSEL_MS = 50
const MAX_LOCAL_FEEDBACK_SPACING = 440
const MAX_LOCAL_SUGGESTION_SPACING = 640

const activeBlockKey = new PluginKey('workspaceActiveBlock')
const localFindingKey = new PluginKey('workspaceLocalFinding')

function activeBlockPlugin() {
  return new Plugin({
    key: activeBlockKey,
    state: {
      init() { return DecorationSet.empty },
      apply(transaction, decorations) {
        const blockId = transaction.getMeta(activeBlockKey)
        if (blockId === undefined) return decorations.map(transaction.mapping, transaction.doc)
        if (!blockId) return DecorationSet.empty

        const active = []
        transaction.doc.forEach((node, offset) => {
          if (node.attrs.blockId === blockId) {
            active.push(Decoration.node(offset, offset + node.nodeSize, { class: 'is-active-block' }))
          }
        })
        return DecorationSet.create(transaction.doc, active)
      },
    },
    props: {
      decorations(state) { return activeBlockKey.getState(state) },
    },
  })
}

function localFindingPlugin() {
  return new Plugin({
    key: localFindingKey,
    state: {
      init() { return DecorationSet.empty },
      apply(transaction, decorations) {
        const findingState = transaction.getMeta(localFindingKey)
        if (findingState === undefined) return decorations.map(transaction.mapping, transaction.doc)
        if (!findingState?.blockId) return DecorationSet.empty

        const local = []
        transaction.doc.forEach((node, offset) => {
          // Das ZWEITE Ende eines Ortswechsels. Ein „das gehoert woanders hin" ohne
          // sichtbares Wohin ist eine halbe Aussage: man liest den Vorschlag und
          // sucht dann selbst die Stelle. Die Marke oeffnet sich genau dort, wo der
          // Absatz landen wuerde — davor oder danach, wie der Plan es vorsieht.
          const ortswechsel = findingState.ortswechsel
          if (ortswechsel && node.attrs.blockId === ortswechsel.blockId) {
            const davor = ortswechsel.lage === 'before'
            local.push(Decoration.widget(davor ? offset : offset + node.nodeSize, () => {
              const marke = document.createElement('div')
              marke.className = 'onda-zielmarke'
              marke.contentEditable = 'false'
              const wort = document.createElement('span')
              wort.className = 'onda-zielmarke__wort'
              wort.textContent = 'hierher'
              const linie = document.createElement('span')
              linie.className = 'onda-zielmarke__linie'
              marke.append(wort, linie)
              if (ortswechsel.aufschrift) marke.title = ortswechsel.aufschrift
              return marke
            }, {
              key: `onda-zielmarke:${ortswechsel.blockId}:${ortswechsel.lage}`,
              side: davor ? -1 : 1,
              ignoreSelection: true,
            }))
          }
          if (node.attrs.blockId === findingState.blockId) {
            // Gilt die Anmerkung dem ganzen Absatz oder einer Stelle in ihm? Nur im
            // ersten Fall wird der Absatz selbst angedeutet — sonst zeigt der Punkt am
            // Rand auf ihn, obwohl nur ein Wort gemeint ist.
            const klassen = ['has-local-finding']
            if (findingState.absatzweit) klassen.push('hat-absatzweite-anmerkung')
            // Der Ortswechsel bekommt eine ruhige Flaeche statt der Klammer: die
            // Klammer sagt „dieser Absatz ist gemeint", die Flaeche sagt zusaetzlich
            // „dieser Absatz ist beweglich" — und sie hat ein Gegenstueck an der
            // Zielmarke. Zwei Enden, zweimal dieselbe Sprache.
            if (findingState.gestalt === 'block') klassen.push('hat-ortswechsel')
            local.push(Decoration.node(offset, offset + node.nodeSize, { class: klassen.join(' ') }))

            // Die Geste an den WOERTERN. Bis zum 8.8.2026 gab es sie nicht: der Absatz
            // trug einen Punkt im Rand, die Stelle selbst blieb unberuehrt — man musste
            // die Anmerkung lesen, um zu wissen, worauf sie zeigt.
            //
            // Fail-closed: Findet sich der Wortlaut nicht mehr (der Text wurde seit dem
            // Lauf geaendert), entsteht KEINE Markierung. Lieber kein Strich als einer
            // unter den falschen Woertern — der Punkt im Rand sagt weiterhin, dass hier
            // etwas offen ist, und die Anmerkung selbst nennt den Wortlaut.
            if (findingState.gestalt === 'wort' || findingState.gestalt === 'satz') {
              const stelle = stelleImBaustein(node, offset, findingState.ziel)
              if (stelle) {
                local.push(Decoration.inline(stelle.von, stelle.bis, {
                  class: `onda-stelle onda-stelle--${findingState.gestalt}`,
                }))
              }
            }
            if (findingState.spacing > 0) {
              local.push(Decoration.widget(offset + node.nodeSize, () => {
                const spacer = document.createElement('div')
                spacer.className = 'local-feedback-spacer'
                spacer.dataset.localFeedbackBlockId = findingState.blockId
                spacer.style.height = `${findingState.spacing}px`
                spacer.setAttribute('aria-hidden', 'true')
                return spacer
              }, {
                key: `local-feedback-spacer:${findingState.blockId}:${findingState.spacing}`,
                side: -1,
                ignoreSelection: true,
              }))
            }
          }
        })
        return DecorationSet.create(transaction.doc, local)
      },
    },
    props: {
      decorations(state) { return localFindingKey.getState(state) },
    },
  })
}

// Welche Gestalt traegt die Markierung im Text? Die Antwort steht seit jeher im
// Vertrag (annotation-contract.mjs, markierungsGestalt): jede Art hat einen scope,
// und aus ihm folgt die Geste — Kontur ums Wort, Strich unter den Satz, Klammer am
// Absatz, Flaeche mit Zielmarke beim Ortswechsel. 'keine' heisst: es gibt keine
// einzelne Stelle (der ganze Text, der Titel, eine Notiz), dann bleibt es beim
// Punkt im Rand.
//
// Die Gestalt und die Stelle gehoeren zur gerade gezeigten Anmerkung, nicht zum
// Aufruf. Sie hier zu merken statt sie durch vier Aufrufstellen zu reichen, haelt die
// Aufrufe schlank — und keine von ihnen kennt die Anmerkung ueberhaupt.
let aktuelleAnmerkungIstAbsatzweit = false
let aktuelleAnmerkungGestalt = 'keine'
let aktuelleAnmerkungZiel = ''
let aktuellesZiel = null

// Das zweite Ende eines Ortswechsels, aufgeloest gegen die Bausteine, die JETZT im
// Dokument stehen. move.toBlockId entstand beim Hinweislauf (agent-findings.mjs,
// loeseVerschiebungAuf); seither kann der Absatz geloescht oder selbst verschoben
// worden sein. Ein Ziel, das es nicht mehr gibt, ergibt keine Marke — und ein Ziel,
// das der Quellbaustein selbst ist, auch nicht: die Marke saesse dann am eigenen
// Absatz und behauptete eine Bewegung, die keine ist.
function ortswechselZiel(finding, blocks, quellBlockId) {
  const move = finding?.move
  const zielId = String(move?.toBlockId || '')
  if (!zielId || zielId === quellBlockId) return null
  if (!(blocks || []).some(block => block?.id === zielId)) return null
  return {
    blockId: zielId,
    lage: move?.position === 'before' ? 'before' : 'after',
    aufschrift: String(move?.to || ''),
  }
}

// Wo genau im Baustein steht die Stelle? Gesucht wird im ZUSAMMENGESETZTEN Text und
// dann zurueckgerechnet — nicht mit textContent.indexOf auf dem Absatz.
//
// Der Unterschied ist kein Feinschliff: textContent klebt den Text ueber
// Knotengrenzen hinweg zusammen, waehrend jede dieser Grenzen im Dokument eine
// Position kostet. Bei einem Zitat oder einer Liste liegt die Stelle deshalb um
// jede durchquerte Grenze zu weit links — die Markierung saesse auf den falschen
// Zeichen, und zwar nur dort, wo der Text verschachtelt ist.
function stelleImBaustein(node, bausteinStart, ziel) {
  const gesucht = String(ziel || '')
  if (!gesucht) return null

  const stuecke = []
  let volltext = ''
  node.descendants((kind, pos) => {
    if (!kind.isText) return true
    // pos ist relativ zum Inhalt des Bausteins; +1 ueberspringt seine oeffnende Marke.
    stuecke.push({ ab: volltext.length, position: bausteinStart + 1 + pos, laenge: kind.text.length })
    volltext += kind.text
    return false
  })

  const treffer = volltext.indexOf(gesucht)
  if (treffer < 0) return null

  const position = zeichen => {
    for (const stueck of stuecke) {
      if (zeichen >= stueck.ab && zeichen <= stueck.ab + stueck.laenge) {
        return stueck.position + (zeichen - stueck.ab)
      }
    }
    return null
  }
  const von = position(treffer)
  const bis = position(treffer + gesucht.length)
  return von != null && bis != null && bis > von ? { von, bis } : null
}

function setLocalFindingDecoration(blockId, spacing = 0, force = false) {
  const absatzweit = Boolean(blockId) && aktuelleAnmerkungIstAbsatzweit
  const gestalt = blockId ? aktuelleAnmerkungGestalt : 'keine'
  const ziel = blockId ? aktuelleAnmerkungZiel : ''
  const ortswechsel = blockId && gestalt === 'block' ? aktuellesZiel : null
  const ortswechselSchluessel = ortswechsel
    ? `${ortswechsel.blockId}|${ortswechsel.lage}|${ortswechsel.aufschrift}`
    : ''
  const nextSpacing = blockId ? Math.max(0, Math.ceil(spacing)) : 0
  if (!force
    && localDecoratedBlockId === blockId
    && localDecoratedSpacing === nextSpacing
    && localDecoratedAbsatzweit === absatzweit
    && localDecoratedGestalt === gestalt
    && localDecoratedZiel === ziel
    && localDecoratedOrtswechsel === ortswechselSchluessel) return false
  localDecoratedBlockId = blockId
  localDecoratedSpacing = nextSpacing
  localDecoratedAbsatzweit = absatzweit
  localDecoratedGestalt = gestalt
  localDecoratedZiel = ziel
  localDecoratedOrtswechsel = ortswechselSchluessel
  ctx.editor.view.dispatch(ctx.editor.state.tr.setMeta(localFindingKey, {
    blockId,
    spacing: nextSpacing,
    absatzweit,
    gestalt,
    ziel,
    ortswechsel,
  }))
  return true
}

function elements() {
  return {
    view: document.getElementById('editorView'),
    sidebar: document.getElementById('ondaSidebar'),
    back: document.getElementById('sidebarBack'),
    // EIN Knopf fuer beide Richtungen. Zwei koennten nie an derselben Stelle stehen.
    toggle: document.getElementById('sidebarToggle'),
    structureNav: document.getElementById('structureNav'),
    structureNavList: document.getElementById('structureNavList'),
    structureTree: document.getElementById('structureTree'),
    materialTree: document.getElementById('materialTree'),
    materialTreeToggle: document.getElementById('materialTreeToggle'),
    scroll: document.getElementById('scroll'),
    localLayer: document.getElementById('localAgentLayer'),
    agentPresence: document.getElementById('ondaAura'),
    agentWidget: document.getElementById('agentWidget'),
    blase: document.getElementById('ondaBlase'),
    evidenceWindow: document.getElementById('evidenceWindow'),
  }
}

function announceAgentStatus(text) {
  const status = document.getElementById('agentLiveStatus')
  if (!status) return
  if (agentLiveFrame) cancelAnimationFrame(agentLiveFrame)
  status.textContent = ''
  agentLiveFrame = requestAnimationFrame(() => {
    agentLiveFrame = null
    status.textContent = String(text || '')
  })
}

function captureInputState(container, selector) {
  const input = container?.querySelector(selector)
  if (!input) return null
  return {
    focused: document.activeElement === input,
    value: input.value,
    selectionStart: input.selectionStart,
    selectionEnd: input.selectionEnd,
  }
}

function restoreInputState(input, state, forceFocus = false) {
  if (!input || !state) return
  input.value = state.value
  if (!state.focused && !forceFocus) return
  input.focus({ preventScroll: true })
  if (Number.isInteger(state.selectionStart) && Number.isInteger(state.selectionEnd)) {
    input.setSelectionRange(state.selectionStart, state.selectionEnd)
  }
}

function scrollThreadToLatest(messages) {
  if (!messages) return
  messages.scrollTop = messages.scrollHeight
}

function activeWorkspace() {
  const doc = ctx?.activeDoc()
  return doc ? ensureWorkspaceState(doc) : null
}

// EINE Stelle, an der Bloecke entstehen. Vorher holte dieses Modul die Bloecke an gut zwanzig
// Stellen einzeln aus dem Editor -- eine davon zu vergessen hiesse, dort still ohne Rollen zu
// arbeiten, ohne dass ein Test anschlaegt. Genau so ist die Luecke entstanden, die dieser
// Umbau schliesst. Ein Waechter in schreibansicht-ruhe.test.mjs haelt sie zu.
function bausteinBestand(workspace = activeWorkspace()) {
  return workspace?.bausteinarten || null
}

function aktuelleBloecke(editor = ctx?.editor) {
  return getEditorBlocks(editor, bausteinRollen(bausteinBestand()))
}

// Wie ein Baustein beschriftet wird — an EINER Stelle, weil es drei Anzeigen gibt
// (Struktur-Spalte, Blaetter-Liste, Blaetter-Tiefe) und drei Fassungen derselben Regel
// unweigerlich auseinanderlaufen.
//
// Rangfolge, und sie ist die Entscheidung (Issue #36):
//   1. Der erkannte Name — was dieser Absatz in DIESEM Text tut ("Befund", "Einwand").
//   2. Das beim Erzeugen von Hand gewaehlte Wort ("Kernbehauptung", "Beleg").
//   3. Nichts. Ein Etikett, das nichts aussagt, ist schlechter als keines.
function bausteinName(block, namen) {
  return namen?.get(block.id) || ROLE_LABELS.get(block.role) || ''
}

// Das offene Dokument bestimmt sein Projekt — nicht ctx.activeProjectObj().
//
// ctx.activeProjectObj() folgt state.activeProject, und das ist der BROWSE-Zeiger der
// Projektuebersicht: welches Projekt blaettert der Nutzer gerade durch. Das GELADENE
// Dokument (state.active) ist ein zweiter, unabhaengiger Zeiger. Beide duerfen
// auseinanderlaufen — die App startet immer in der Projektuebersicht, und ein
// Projektwechsel dort laesst das geladene Dokument stehen. Schon nach einem frischen
// Start zeigt der eine auf 'Meine Texte' und das andere auf das Beispiel-Dokument.
//
// Dieses Modul ist durchweg EDITOR-gebunden (alles haengt an refreshWorkspace bzw. an
// Bedienelementen der Schreibansicht). Es meint also immer das Projekt des offenen
// Dokuments und loest deshalb ueber doc.projectId auf — wie openDoc und wie
// fuehreHinweislaufAus es bereits tun. Sonst landet der Zustand von Projekt A am
// Dokument von Projekt B.
function dokumentProjekt(doc = ctx?.activeDoc()) {
  return projektZumDokument(ctx?.state.projects, doc)
}

function persistWorkspace() {
  ctx?.scheduleSave()
}

function setLayerVisibility(node, visible) {
  if (!node) return
  node.hidden = !visible
}

// ---------- Die Sprechblase waechst aus dem Orb ----------
//
// Das Belegfenster bekommt davon NICHTS ab, und zwar mit Absicht: es wird geoeffnet,
// indem man eine Anmerkung im Text vertieft, nicht ueber den Orb. Eine Blase, die aus
// dem Orb waechst, obwohl sie zu einer Randkarte gehoert, behauptete eine falsche
// Herkunft. Ein Nebeneinander kann ohnehin nicht auftreten — enforceExclusiveLayers
// schliesst das eine, sobald das andere aufgeht.

// Ob die Kontur ueberhaupt zeichnen darf. Der Umschaltpunkt steht im Stil (--blase-an
// wird im Mobilblock auf 0 gesetzt), nicht hier — sonst gaebe es zwei Wahrheiten
// darueber, ab wann das Fenster noch am Orb sitzt.
function blaseIstAngeschaltet(blase) {
  if (!blase) return false
  return getComputedStyle(blase).getPropertyValue('--blase-an').trim() !== '0'
}

// ACHTUNG: `element.hidden = …` gibt es nur an HTMLElement. #ondaBlase ist ein
// SVG-Element — dort legt dieselbe Zeile bloss eine Eigenschaft an, die niemand liest,
// und das Attribut bleibt stehen. Die Kontur waere dann nie zu sehen gewesen.
function blaseZeigen(blase, sichtbar) {
  if (!blase) return
  if (sichtbar) blase.removeAttribute('hidden')
  else blase.setAttribute('hidden', '')
}

function blaseKurve() {
  // Zwei Fassungen zum Umschalten, damit die Wahl am laufenden Programm faellt:
  // a = --ease-standard (Bewegung ueber die Flaeche), b = --ease-out (der Standard
  // fuer kleine Hinweise). Voreingestellt ist a.
  return document.documentElement.dataset.blaseKurve === 'b' ? kurveOut : kurveStandard
}

function blaseAntriebAbbrechen() {
  blaseAntriebStoppen?.()
  blaseAntriebStoppen = null
  blaseFaeltZurueck = false
}

function blaseMisstUndZeichnet(fenster, blase) {
  const kasten = fenster.getBoundingClientRect()
  if (!blaseIstMoeglich(kasten.width, kasten.height)) return null
  if (!blaseKontur || blaseKontur.svg !== blase) blaseKontur = erzeugeKontur(blase)
  blaseKontur?.setzeMasse(kasten.width, kasten.height)
  return blaseKontur
}

function blaseAusschalten(fenster, blase) {
  blaseAntriebAbbrechen()
  blaseZeigen(blase, false)
  fenster?.classList.remove('hat-kontur', 'waechst', 'faellt-zurueck')
  // Fassung B haelt das Fenster waehrend der Faltung sichtbar. Bricht sie ab, muss es
  // dorthin zurueck, wo setLayerVisibility es haben will — sonst bliebe eine leere
  // Huelle stehen.
  if (fenster) fenster.hidden = !blaseSteht
}

function blaseFolgt(offen) {
  // Gleichstand zuerst: refreshWorkspace laeuft bei jedem Tastendruck. Ohne diese
  // Sperre — noch VOR jedem getComputedStyle — finge die Blase bei jedem Zeichen von
  // vorne an zu wachsen an, und jeder Tastendruck kostete eine Stilberechnung.
  if (blaseSteht === offen) return
  const ui = elements()
  const blase = ui.blase
  const fenster = ui.agentWidget
  if (!blase || !fenster) return

  if (!blaseIstAngeschaltet(blase)) {
    blaseSteht = offen
    blaseAusschalten(fenster, blase)
    return
  }

  const ersterLauf = blaseSteht === null
  blaseSteht = offen
  blaseAntriebAbbrechen()
  fenster.hidden = !offen

  if (!offen) {
    if (!blaseKontur || ersterLauf) {
      blaseZeigen(blase, false)
      fenster.classList.remove('hat-kontur', 'waechst', 'faellt-zurueck')
      return
    }
    fenster.classList.remove('waechst')
    // Fassung B des Abgangs: der Inhalt verblasst mit, statt in einem Bild zu
    // verschwinden. Dafuer muss das Fenster die Faltung ueberleben — refreshWorkspace
    // hat es zu diesem Zeitpunkt schon versteckt — UND sein Inhalt muss stehen bleiben.
    // renderAgentWidget raeumt gleich hinterher ab; ohne die Sperre faltete sich eine
    // leere Huelle, und die Fassung waere von Fassung A nicht zu unterscheiden.
    const weich = document.documentElement.dataset.blaseAbgang === 'b'
    if (weich) {
      blaseFaeltZurueck = true
      fenster.hidden = false
      fenster.classList.add('faellt-zurueck')
    }
    const dauerBreite = tokenDauer(BEWEGUNG.zu.breite)
    const dauerHoehe = tokenDauer(BEWEGUNG.zu.hoehe)
    blaseAntriebStoppen = laesseBlaseWachsen(blaseKontur, {
      auf: false,
      kurve: blaseKurve(),
      ruhig: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false,
      dauerBreite,
      dauerHoehe,
      fertig: () => {
        blaseAntriebStoppen = null
        blaseZeigen(blase, false)
        fenster.classList.remove('hat-kontur', 'faellt-zurueck')
        if (!weich) return
        blaseFaeltZurueck = false
        fenster.hidden = true
        renderAgentWidget()
      },
    })
    return
  }

  // Erst die Klasse, dann messen: hat-kontur aendert nur Farben und das obere Polster,
  // nicht die Masse des Kastens — aber gemessen wird trotzdem der Zustand, der auch
  // gezeigt wird.
  fenster.classList.add('hat-kontur')
  const kontur = blaseMisstUndZeichnet(fenster, blase)
  if (!kontur) {
    // Zu klein fuer eine Silhouette, die aufgeht. Dann bleibt das Fenster es selbst.
    fenster.classList.remove('hat-kontur', 'waechst', 'faellt-zurueck')
    blaseZeigen(blase, false)
    return
  }
  fenster.classList.remove('faellt-zurueck')
  fenster.classList.add('waechst')
  kontur.zeichne(0, 0)
  blaseZeigen(blase, true)

  const dauerBreite = tokenDauer(BEWEGUNG.auf.breite)
  const dauerHoehe = tokenDauer(BEWEGUNG.auf.hoehe)
  blaseAntriebStoppen = laesseBlaseWachsen(kontur, {
    auf: true,
    kurve: blaseKurve(),
    ruhig: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false,
    dauerBreite,
    dauerHoehe,
    fertig: () => {
      blaseAntriebStoppen = null
      // Der Zuschnitt faellt weg, sobald er nichts mehr freizulegen hat — sonst kappte
      // er spaeter Fokusringe an den Raendern.
      fenster.classList.remove('waechst')
    },
  })
}

// Die Masse aendern sich auch ohne Zustandswechsel: 100dvh reagiert auf die
// Fensterhoehe und auf die Adressleiste mobiler Browser, und unter 761px faellt die
// Kontur ganz weg. Ohne diesen Beobachter entkoppelte sie sich dann stillschweigend
// vom Fenster.
function blaseBeobachten() {
  const ui = elements()
  if (!ui.agentWidget || !ui.blase || typeof ResizeObserver !== 'function') return () => {}
  const beobachter = new ResizeObserver(() => {
    if (!blaseSteht || blaseAntriebStoppen) return
    if (!blaseIstAngeschaltet(ui.blase)) {
      blaseAusschalten(ui.agentWidget, ui.blase)
      return
    }
    ui.agentWidget.classList.add('hat-kontur')
    const kontur = blaseMisstUndZeichnet(ui.agentWidget, ui.blase)
    if (!kontur) {
      blaseAusschalten(ui.agentWidget, ui.blase)
      return
    }
    kontur.zeichne(1, 1)
    blaseZeigen(ui.blase, true)
  })
  beobachter.observe(ui.agentWidget)
  blaseBeobachter = beobachter
  return () => {
    beobachter.disconnect()
    if (blaseBeobachter === beobachter) blaseBeobachter = null
  }
}

function hasLocalDepth(workspace) {
  return Boolean(
    workspace.expandedFindingId
    || workspace.suggestionFindingId
    || workspace.localThreadFindingId,
  )
}

function closeLocalDepth(workspace) {
  workspace.expandedFindingId = null
  workspace.suggestionFindingId = null
  workspace.localThreadFindingId = null
}

function enforceExclusiveLayers(workspace) {
  if (workspace.evidenceFindingId) {
    closeInsertMenu({ restoreFocus: false })
    workspace.agent.open = false
    closeLocalDepth(workspace)
  } else if (workspace.agent.open) {
    closeInsertMenu({ restoreFocus: false })
    workspace.evidenceFindingId = null
    closeLocalDepth(workspace)
  } else if (hasLocalDepth(workspace)) {
    closeInsertMenu({ restoreFocus: false })
    workspace.agent.open = false
    workspace.evidenceFindingId = null
  }
}

function syncActiveBlock(workspace) {
  const blocks = aktuelleBloecke()
  const currentId = getActiveBlockId(ctx.editor)

  if (renderedDocId !== ctx.activeDoc()?.id) {
    renderedDocId = ctx.activeDoc()?.id || null
    const restored = blocks.find(block => block.id === workspace.activeBlockId)
    if (restored && restored.id !== currentId) {
      selectBlock(restored)
      return restored.id
    }
  }

  if (!workspace.activeBlockId || !blocks.some(block => block.id === workspace.activeBlockId)) {
    workspace.activeBlockId = currentId || blocks[0]?.id || null
  }
  return workspace.activeBlockId
}

function createNode(tagName, className, text) {
  const node = document.createElement(tagName)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function blockElement(blockId) {
  return [...ctx.editor.view.dom.children].find(node => node.dataset.blockId === blockId) || null
}

function escapedSelectorValue(value) {
  const string = String(value || '')
  if (globalThis.CSS && typeof globalThis.CSS.escape === 'function') return globalThis.CSS.escape(string)
  return string.replace(/["\\]/g, '\\$&')
}

function selectBlock(block) {
  if (block.isTextblock) {
    ctx.editor.commands.setTextSelection(block.pos + 1)
  } else {
    ctx.editor.commands.setNodeSelection(block.pos)
  }
}

function focusBlock(blockId) {
  const block = aktuelleBloecke().find(candidate => candidate.id === blockId)
  if (!block) return
  selectBlock(block)
  const workspace = activeWorkspace()
  if (workspace) workspace.activeBlockId = blockId
  requestAnimationFrame(() => {
    blockElement(blockId)?.scrollIntoView({
      block: 'center',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  })
  refreshWorkspace()
  ctx.editor.view.focus()
  persistWorkspace()
}

function closeInsertMenu({ restoreFocus = true } = {}) {
  if (!insertMenu) return false
  const { node, opener, outsideHandler } = insertMenu
  document.removeEventListener('pointerdown', outsideHandler, true)
  node.remove()
  insertMenu = null
  if (restoreFocus && opener?.isConnected) opener.focus()
  return true
}

function placeInsertMenu(menu, anchor) {
  const anchorRect = anchor.getBoundingClientRect()
  const menuRect = menu.getBoundingClientRect()
  const gutter = 10
  const left = Math.min(
    Math.max(gutter, anchorRect.left),
    window.innerWidth - menuRect.width - gutter,
  )
  const fitsBelow = anchorRect.bottom + 6 + menuRect.height <= window.innerHeight - gutter
  const top = fitsBelow
    ? anchorRect.bottom + 6
    : Math.max(gutter, anchorRect.top - menuRect.height - 6)
  menu.style.left = `${left}px`
  menu.style.top = `${top}px`
}

function insertBlock(afterBlockId, role) {
  const insertedId = insertSemanticBlock(ctx.editor, afterBlockId, role)
  if (!insertedId) return
  const workspace = activeWorkspace()
  if (workspace) workspace.activeBlockId = insertedId
  closeInsertMenu({ restoreFocus: false })
  const block = aktuelleBloecke().find(candidate => candidate.id === insertedId)
  if (block) ctx.editor.commands.setTextSelection(block.pos + 1)
  refreshWorkspace()
  // Der Oeffner des Menues steht in der Struktur-Ansicht. Ohne diese Zeile bliebe das
  // offene Fenster stehen, als waere nichts geschehen — der neue Baustein taeuchte
  // erst nach dem Schliessen auf.
  ondaDialog?.onDocChange?.()
  persistWorkspace()
}

function openInsertMenu(afterBlockId, opener) {
  closeInsertMenu({ restoreFocus: false })
  const workspace = activeWorkspace()
  if (workspace) {
    const changed = workspace.agent.open
      || Boolean(workspace.evidenceFindingId)
      || hasLocalDepth(workspace)
    workspace.agent.open = false
    workspace.evidenceFindingId = null
    closeLocalDepth(workspace)
    if (changed) {
      refreshWorkspace()
      persistWorkspace()
    }
  }
  const menu = createNode('div', 'semantic-insert-menu')
  menu.setAttribute('role', 'menu')
  menu.setAttribute('aria-label', 'Art des Textbausteins')

  BLOCK_TYPES.forEach(([role, label]) => {
    const choice = createNode('button', 'semantic-insert-choice', label)
    choice.type = 'button'
    choice.setAttribute('role', 'menuitem')
    choice.dataset.semanticRole = role
    choice.addEventListener('click', () => insertBlock(afterBlockId, role))
    menu.append(choice)
  })

  const outsideHandler = event => {
    if (menu.contains(event.target) || opener.contains(event.target)) return
    closeInsertMenu({ restoreFocus: false })
  }
  menu.addEventListener('keydown', event => {
    const choices = [...menu.querySelectorAll('button')]
    const current = choices.indexOf(document.activeElement)
    let next = null
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeInsertMenu()
      return
    }
    if (event.key === 'ArrowDown') next = (current + 1) % choices.length
    if (event.key === 'ArrowUp') next = (current - 1 + choices.length) % choices.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = choices.length - 1
    if (next !== null) {
      event.preventDefault()
      choices[next].focus()
    }
  })

  document.getElementById('editorView').append(menu)
  insertMenu = { node: menu, opener, outsideHandler }
  placeInsertMenu(menu, opener)
  document.addEventListener('pointerdown', outsideHandler, true)
  menu.querySelector('button')?.focus()
}

// Auf- und Zugeklapptes der Struktur-Spalte. Bewusst NICHT im Dokument gespeichert:
// ob eine Karte gerade offen steht, ist eine Frage des Hinschauens, keine Eigenschaft
// des Textes -- sie gehoert nicht in eine Datei, die man exportiert oder teilt.
// Drei Zustaende je Baustein: nichts gesetzt (Voreinstellung nach Rolle), ausdruecklich
// offen, ausdruecklich zu. Die ausdrueckliche Wahl schlaegt die Voreinstellung.
let strukturKlappen = { docId: null, offen: new Set(), zu: new Set() }

// Aus demselben Grund nicht im Dokument: ob ein Baum in der Seitenleiste gerade offen
// steht, ist eine Frage des Hinschauens. Die Struktur steht offen, weil sie der Weg
// durch den Text ist; die Quellen liegen zu, weil sie Material sind und nicht Weg.
const seitenBaeume = { struktur: true, quellen: false }

function setzeSeitenBaum(name, offen) {
  seitenBaeume[name] = offen
  const ui = elements()
  const [knopf, flaeche, wort, abschnittId] = name === 'struktur'
    ? [ui.structureTree, ui.structureNavList, 'Struktur', 'structureNav']
    : [ui.materialTreeToggle, ui.materialTree, 'Quellen', 'materialNav']
  if (flaeche) flaeche.hidden = !offen
  // Der Abschnitt muss selbst wissen, dass sein Baum offen steht — nur dann darf er in
  // der Spalte wachsen (onda-shell.css). Ohne das klappte der Baum zwar auf, bekam aber
  // null Hoehe, weil die Struktur mit ihren 25 Zeilen schon alles genommen hatte.
  document.getElementById(abschnittId)?.classList.toggle('hat-offenen-baum', offen)
  if (!knopf) return
  knopf.setAttribute('aria-expanded', String(offen))
  knopf.setAttribute('aria-label', offen ? `${wort} zuklappen` : `${wort} aufklappen`)
  knopf.title = offen ? `${wort} zuklappen` : `${wort} aufklappen`
  knopf.replaceChildren(ondaIcon('chevron-right', { size: 16 }))
}

function setzeStrukturDokument(docId) {
  if (strukturKlappen.docId === docId) return
  strukturKlappen = { docId, offen: new Set(), zu: new Set() }
}

// Voreinstellung: Ueberschriften stehen offen — ihr Wortlaut IST die Struktur.
// Alles andere bleibt eine Zeile, bis jemand es anklickt.
//
// Der gerade bearbeitete Absatz klappt sich AUSDRUECKLICH NICHT von allein auf. Zwei
// Gruende: erstens ist genau dieser Auszug der ueberfluessigste von allen — man sieht
// den Absatz zwei Handbreit weiter rechts im Original. Zweitens wuerde die Spalte sich
// dann bei jedem Cursor-Sprung selbst umbauen, waehrend man hinschaut. Wo man steht,
// sagt die Markierung (aria-current, Akzentrand); dafuer braucht es keinen zweiten Text.
function istKarteOffen(block) {
  if (strukturKlappen.zu.has(block.id)) return false
  if (strukturKlappen.offen.has(block.id)) return true
  return NAV_ROLLEN_MIT_EIGENEM_TEXT.has(block.role)
}

function klappeKarte(block) {
  const offen = istKarteOffen(block)
  strukturKlappen.offen.delete(block.id)
  strukturKlappen.zu.delete(block.id)
  if (offen) strukturKlappen.zu.add(block.id)
  else strukturKlappen.offen.add(block.id)
}

function createNavBlockNode(block) {
  const preview = createNode('button', 'block-preview')
  preview.type = 'button'
  preview.dataset.blockId = block.id
  const excerpt = createNode('span', 'block-preview-excerpt')
  const role = createNode('span', 'block-preview-role')
  const hint = createNode('span', 'block-preview-hint')
  hint.setAttribute('aria-hidden', 'true')
  preview.append(excerpt, role, hint)
  // Ein Klick tut beides: er springt an die Stelle UND klappt die Karte um. Beides
  // ist dieselbe Absicht ("ich will zu diesem Baustein"), also braucht es keine
  // zweite Geste. Umklappen zuerst, damit focusBlock den Baustein aktiv setzen darf,
  // ohne die gerade getroffene Wahl zu ueberschreiben.
  preview.addEventListener('click', () => {
    klappeKarte(block)
    focusBlock(block.id)
    renderStructureNav()
  })
  return { preview, excerpt, role, hint }
}

// Ueberschriften SIND die Struktur — ihr Text gehoert in die Spalte.
// Ein Absatz-Auszug dagegen ist eine Doppelung: er wiederholt woertlich, was
// zwei Handbreit weiter rechts schon steht. Sieben Karten mit sieben
// Absatzanfaengen heissen, den Text zweimal zu lesen.
// Die einzige Rolle, deren Wortlaut selbst Struktur ist. Die uebrigen Rollen
// (paragraph, claim, evidence, counterpoint, transition, question) beschreiben
// die Funktion eines Absatzes — ihr Text wiederholt nur den Fliesstext.
const NAV_ROLLEN_MIT_EIGENEM_TEXT = new Set(['heading'])

// bausteinName ist der von der KI fuer DIESEN Text erkannte Name ("Befund", "Einwand").
// Er gewinnt ueber die allgemeine Beschriftung: Er sagt, was der Absatz HIER tut, nicht,
// welcher Schublade er allgemein angehoert. Fehlt beides, bleibt die Karte still.
function updateNavBlockNode(nodes, block, activeBlockId, hintKind, namen = null) {
  const roleLabel = bausteinName(block, namen)
  const excerpt = block.excerpt || 'Noch leer'
  const hintLabel = hintKind === 'evidence'
    ? ' — Beleg offen'
    : hintKind === 'style' ? ' — Formulierung offen' : ''
  const istAktiv = block.id === activeBlockId

  // Der Auszug erscheint nur, wo er etwas beitraegt: bei Ueberschriften und im
  // Absatz, in dem gerade geschrieben wird, von allein -- ueberall sonst auf Klick.
  // Ohne das wiederholt die Spalte den Fliesstext ein zweites Mal.
  const zeigeAuszug = istKarteOffen(block)

  // Vorlesegeraete bekommen weiterhin den vollen Wortlaut — die Kuerzung ist
  // eine Frage der Augen, nicht der Zugaenglichkeit. Ohne Namen entsteht auch kein
  // leerer Doppelpunkt davor.
  nodes.preview.setAttribute('aria-label', roleLabel ? `${roleLabel}: ${excerpt}${hintLabel}` : `${excerpt}${hintLabel}`)
  nodes.preview.setAttribute('aria-expanded', zeigeAuszug ? 'true' : 'false')
  if (istAktiv) nodes.preview.setAttribute('aria-current', 'true')
  else nodes.preview.removeAttribute('aria-current')

  nodes.excerpt.textContent = zeigeAuszug ? excerpt : ''
  nodes.excerpt.hidden = !zeigeAuszug
  nodes.excerpt.classList.toggle('is-empty', zeigeAuszug && !block.excerpt)
  nodes.preview.classList.toggle('is-offen', zeigeAuszug)

  nodes.role.textContent = roleLabel
  nodes.role.hidden = !roleLabel
  nodes.preview.classList.toggle('has-hint', Boolean(hintKind))
  nodes.hint.dataset.hint = hintKind || ''
}

function rebuildStructureNav(list, doc, blocks) {
  setzeStrukturDokument(doc.id)
  const blockNodes = new Map()
  const children = []
  if (!blocks.length) children.push(createNode('p', 'structure-nav-empty', 'Noch keine Textabschnitte.'))
  blocks.forEach(block => {
    const nodes = createNavBlockNode(block)
    blockNodes.set(block.id, nodes)
    children.push(nodes.preview)
  })
  list.replaceChildren(...children)
  structureNavState = { docId: doc.id, ids: blocks.map(block => block.id), blockNodes }
}

function renderStructureNav() {
  const nav = document.getElementById('structureNav')
  const workspace = activeWorkspace()
  if (!nav || !workspace) return
  const doc = ctx.activeDoc()
  if (!doc) return
  let list = nav.querySelector('.structure-nav-list')
  if (!list) { list = createNode('div', 'structure-nav-list'); list.id = 'structureNavList'; nav.append(list) }

  const blocks = aktuelleBloecke().filter(block => block.id)
  const ids = blocks.map(block => block.id)
  const orderChanged = structureNavState?.docId !== doc.id
    || structureNavState.ids.length !== ids.length
    || ids.some((id, index) => structureNavState.ids[index] !== id)
  if (orderChanged) rebuildStructureNav(list, doc, blocks)

  const hints = structureHintMap(doc, blocks)
  // Der Anzeigename geht bewusst NICHT ueber block.role: Dort steht die Funktion im Argument
  // (claim, evidence, ...), hier der Name, den die KI fuer diesen Text gefunden hat. Zwei
  // Zwecke, zwei Wege — so bleibt block.role genau das, was es ist, und die Anzeige haengt
  // nicht an der Rechenlogik.
  const namen = bausteinNamen(bausteinBestand(workspace))
  blocks.forEach(block => {
    const nodes = structureNavState.blockNodes.get(block.id)
    if (nodes) {
      updateNavBlockNode(nodes, block, workspace.activeBlockId, hints.get(block.id) || null, namen)
    }
  })
}

// ---------- Die Struktur-Ansicht ----------
// Das Einfuegemenue hatte bis zum 7. August 2026 ein Plus am Absatz als Oeffner. Das
// Plus ist fort (Jakob verstand es schlicht nicht), das Menue lebt — und sein Platz
// ist hier: wer die Struktur ansieht, ist in der Verfassung, einen Baustein
// hinzuzufuegen. Beim Schreiben ist man das nicht.
let strukturBlaetter = null

// Ein Anriss endet an einem Satzende, nie mitten im Wort. Hier stand ein Schnitt nach
// 60 Zeichen mit drei Punkten dahinter — „ich will, dass nirgendwo einfach der Text
// aufhört und dann Punkt, Punkt, Punkt kommt" (Jakob, 8.8.2026). Der Unterschied ist
// nicht die Laenge, sondern die Ehrlichkeit: ein ganzer erster Satz liest sich als
// Anfang, ein gekappter als Fehler. Findet sich kein Satzende, kommt der ganze Text
// zurueck und bricht im Layout um; lieber eine Zeile mehr als ein abgehackter Rest.
function ersterSatz(text) {
  const roh = String(text || '').trim()
  return roh.split(/(?<=[.!?…])\s/)[0] || roh
}

function blockAnriss(text) {
  const roh = String(text || '').trim()
  if (!roh) return 'Noch leer'
  return ersterSatz(roh)
}

// Schreibt den Text eines Bausteins zurueck in den Editor. Nur echte Textbloecke:
// bei einem Zitat oder einer Liste steckt der Text eine Ebene tiefer, und ihn dort
// flach zu ueberschreiben, machte aus dem Zitat einen Absatz.
function schreibeBlockText(blockId, text) {
  const block = aktuelleBloecke().find(kandidat => kandidat.id === blockId)
  if (!block || !block.isTextblock) return false
  const node = ctx.editor.state.doc.nodeAt(block.pos)
  if (!node) return false
  const von = block.pos + 1
  const bis = block.pos + node.nodeSize - 1
  const tr = ctx.editor.state.tr
  if (text) tr.insertText(text, von, bis)
  else if (bis > von) tr.delete(von, bis)
  else return true
  ctx.editor.view.dispatch(tr)
  return true
}

function openStrukturModal(opener) {
  const doc = ctx?.activeDoc()
  if (!doc) return
  strukturBlaetter = openOndaBlaetter({
    id: 'strukturModal',
    title: 'Struktur',
    opener,
    eintraege: (liste, { gewaehlt, waehle, eintrag }) => {
      const blocks = aktuelleBloecke().filter(block => block.id)
      if (!blocks.length) {
        liste.append(createNode('p', 'onda-blaetter__tiefe-hinweis', 'Noch keine Textabschnitte.'))
        return
      }
      const offen = blocks.some(block => block.id === gewaehlt) ? gewaehlt : blocks[0].id
      const namen = bausteinNamen(bausteinBestand())
      blocks.forEach(block => {
        liste.append(eintrag(block.id, bausteinName(block, namen), {
          anriss: blockAnriss(block.excerpt || block.text),
          gewaehlt: offen === block.id,
          onWaehle: () => waehle(block.id),
        }))
      })
    },
    fuss: (flaeche, { gewaehlt }) => {
      const blocks = aktuelleBloecke().filter(block => block.id)
      const nach = blocks.some(block => block.id === gewaehlt) ? gewaehlt : blocks[blocks.length - 1]?.id
      const knopf = createNode('button', 'onda-blaetter__eintrag', 'Baustein hinzufügen')
      knopf.id = 'strukturBausteinNeu'
      knopf.type = 'button'
      knopf.setAttribute('aria-haspopup', 'menu')
      knopf.disabled = !nach
      knopf.addEventListener('click', event => openInsertMenu(nach, event.currentTarget))
      flaeche.append(knopf)
    },
    tiefe: (tief, gewaehlt) => {
      const blocks = aktuelleBloecke().filter(block => block.id)
      const block = blocks.find(kandidat => kandidat.id === gewaehlt) || blocks[0]
      if (!block) {
        tief.append(createNode('p', 'onda-blaetter__tiefe-hinweis', 'Noch keine Textabschnitte.'))
        return
      }
      const tiefeName = bausteinName(block, bausteinNamen(bausteinBestand()))
      if (tiefeName) tief.append(createNode('h3', 'onda-blaetter__tiefe-titel', tiefeName))
      if (block.isTextblock) {
        bearbeitbaresFeld(tief, 'Text dieses Bausteins', block.text || '', wert => {
          schreibeBlockText(block.id, wert)
          const anriss = strukturBlaetter?.panel
            ?.querySelector(`[data-blatt-id="${escapedSelectorValue(block.id)}"] .onda-blaetter__eintrag-anriss`)
          if (anriss) anriss.textContent = blockAnriss(wert)
        }, { line: true })
      } else {
        tief.append(createNode(
          'p',
          'onda-blaetter__tiefe-hinweis',
          'Dieser Baustein trägt eine eigene Form — Zitat, Liste oder Bild. Er lässt sich '
          + 'im Text selbst ändern, damit die Form dabei erhalten bleibt.',
        ))
        tief.append(createNode('p', 'onda-blaetter__tiefe-hinweis', block.text || ''))
      }
      const springen = createNode('button', 'onda-blaetter__eintrag', 'Im Text anzeigen')
      springen.type = 'button'
      springen.addEventListener('click', () => { closeOndaDialog({ restoreFocus: false }); focusBlock(block.id) })
      tief.append(springen)
    },
  })
}

// --- Erweiterungen: der zweite Kanal -----------------------------------------
// Bis zum 7. August 2026 hatte dieser Kanal eine eigene Flaeche in der Seitenleiste.
// Jakob hat sie gestrichen, und zwar mit Begruendung: "erkanntes und
// erweiterungsanmerkungen sind sachen die der agent im chat oder als anmerkung
// kommuniziert, das sind ja sachen die proaktiv umgesetzt werden koennen/sollen."
// Eine Erweiterung ist also kein Inventar, das man durchsieht, sondern etwas, das
// jemand sagt. Sie geht deshalb den Weg, den es dafuer schon gibt: den Chat.
//
// Das Datenmodell dahinter (erweiterung-model.mjs, erweiterungslauf-model.mjs) ist
// vollstaendig geblieben — nur die Flaeche ist fort.
// Der erste Satz, und zwar ganz. Der Schnitt bei 96 Zeichen ist am 8.8.2026 gefallen:
// er kappte genau die Saetze, die etwas zu sagen hatten (siehe ersterSatz).
function erweiterungAnriss(text) {
  return String(text || '').trim() ? ersterSatz(text) : ''
}

// Der einzige Weg, auf dem etwas in den Personen-Speicher gelangt. Bewusst EINE
// Stelle: ein Speicher, der sich an mehreren Stellen selbst fuellt, laesst sich
// spaeter nicht mehr ueberblicken.
function merkeErkanntes(satz, herkunft, beleg = '', dimension = 'allgemein') {
  const text = String(satz || '').trim()
  if (!text || !ctx?.state) return null
  const doc = ctx.activeDoc()
  const ergebnis = schreibeErkanntes(ctx.state.memoryStore, {
    satz: text,
    herkunft,
    dokumentId: doc?.id || null,
    projektId: doc?.projectId || null,
    beleg,
    dimension,
  })
  ctx.state.memoryStore = ergebnis.store
  return ergebnis.eintrag
}

// Die leiseste Flaeche, die es gibt. Kein Angebot, keine Aufgabe — ein Rueckblick.
// Jede Zeile ist mit einer Geste zurueckzunehmen; ohne das wiederholte sich ein
// falscher Satz in jedem kuenftigen Text, und der Speicher vergiftete sich selbst.
//
// Seit dem 7. August 2026 steht der Rueckblick nicht mehr in der Seitenleiste. Er ist
// kein proaktives Angebot, das der Agent im Chat sagen koennte, sondern ein Blick
// zurueck auf den Personenspeicher — sein Platz ist deshalb das
// Projektverstaendnis-Fenster, in dem auch das Projektgedaechtnis liegt. Die Flaeche
// merkt sich hier, damit die Gesten (bestaetigen, zuruecknehmen) sich selbst neu
// zeichnen koennen, ohne das ganze Fenster neu aufzubauen.
let erkanntesFlaeche = null

function renderErkanntes(ziel = erkanntesFlaeche) {
  const bereich = ziel
  if (!bereich || !bereich.isConnected || !ctx?.state) return
  erkanntesFlaeche = bereich
  const liste = erkanntesListe(ctx.state.memoryStore)
  const entwicklung = projiziereAutorentwicklung(ctx.state.memoryStore)
  if (!Array.isArray(ctx.state.memoryStore.voiceProposals)) ctx.state.memoryStore.voiceProposals = []
  const kinder = []

  const dimensionLabel = {
    fakt: 'Fakt', beleg: 'Beleg', methode: 'Methode', logik: 'Logik', struktur: 'Struktur',
    wirkung: 'Wirkung', erklaerung: 'Erklärung', sprache: 'Sprache', idee: 'Idee', allgemein: 'Allgemein',
  }

  if (!liste.length) {
    kinder.push(createNode(
      'p',
      'onda-erk-leer',
      'Hier sammelt sich, was du beim Schreiben erkannt hast — je ein Satz, der beim '
      + 'naechsten Text wieder traegt. Er kommt dazu, wenn du eine Erweiterung merkst '
      + 'oder einen Hinweis annimmst.',
    ))
  }

  liste.forEach(gruppe => {
    const zeile = createNode('div', 'onda-erk-zeile')
    zeile.append(createNode('span', 'onda-erk-satz', gruppe.satz))
    const dimensionen = (gruppe.dimensionen || []).filter(wert => wert !== 'allgemein')
    if (dimensionen.length) {
      zeile.append(createNode(
        'span',
        'onda-erk-dimension',
        dimensionen.map(wert => dimensionLabel[wert] || wert).join(' · '),
      ))
    }
    // Die Zahl bedeutet hier etwas Gutes: was wiederkam, ist im Begriff, in Fleisch
    // und Blut ueberzugehen. Deshalb Tinte statt Warnfarbe und kein Abzeichen.
    if (gruppe.treffer > 1) {
      zeile.append(createNode('span', 'onda-erk-treffer', `${gruppe.treffer}×`))
    }
    const stimmenEintrag = ctx.state.memoryStore.entries.find(eintrag => (
      eintrag?.status === 'active'
      && eintrag.type === 'voice'
      && eintrag.level === 'personal'
      && eintrag.content === gruppe.satz
      && eintrag.provenance?.action === 'voice-trait-approve'
    ))
    const stimmenVorschlag = ctx.state.memoryStore.voiceProposals.find(vorschlag => (
      vorschlag?.trait === gruppe.satz && vorschlag.status === 'pending'
    ))
    const anker = [...new Map((gruppe.occurrences || [])
      .filter(begegnung => begegnung.projectId && begegnung.documentId && begegnung.anchor)
      .map(begegnung => [
        `${begegnung.projectId}:${begegnung.documentId}:${begegnung.anchor}`,
        { projectId: begegnung.projectId, textId: begegnung.documentId, exact: begegnung.anchor, actor: 'user' },
      ])).values()]
    if (stimmenEintrag) {
      const stimmeWeg = createNode('button', 'onda-erk-stimme is-active', 'Teil deiner Stimme')
      stimmeWeg.type = 'button'
      stimmeWeg.title = 'Klicken, um dieses Stimmenmerkmal zurückzunehmen'
      stimmeWeg.addEventListener('click', () => {
        ctx.state.memoryStore = ueberholeStimmenmerkmal(ctx.state.memoryStore, stimmenEintrag.id, Date.now())
        ctx.scheduleSave()
        renderErkanntes()
      })
      zeile.append(stimmeWeg)
    } else if (stimmenVorschlag) {
      const bestaetigen = createNode('button', 'onda-erk-stimme', 'Als Stimme bestätigen')
      bestaetigen.type = 'button'
      bestaetigen.addEventListener('click', () => {
        const freigegeben = entscheideStimmenmerkmal(stimmenVorschlag, {
          approved: true, actor: 'user', at: Date.now(),
        })
        const index = ctx.state.memoryStore.voiceProposals.findIndex(vorschlag => vorschlag.id === stimmenVorschlag.id)
        ctx.state.memoryStore.voiceProposals[index] = freigegeben
        ctx.state.memoryStore = speichereStimmenmerkmal(ctx.state.memoryStore, freigegeben)
        ctx.scheduleSave()
        renderErkanntes()
      })
      const nichtStimme = createNode('button', 'onda-erk-stimme is-still', 'Nicht als Stimme')
      nichtStimme.type = 'button'
      nichtStimme.addEventListener('click', () => {
        const abgelehnt = entscheideStimmenmerkmal(stimmenVorschlag, {
          approved: false, actor: 'user', at: Date.now(),
        })
        const index = ctx.state.memoryStore.voiceProposals.findIndex(vorschlag => vorschlag.id === stimmenVorschlag.id)
        ctx.state.memoryStore.voiceProposals[index] = abgelehnt
        ctx.scheduleSave()
        renderErkanntes()
      })
      zeile.append(bestaetigen, nichtStimme)
    } else if (anker.length >= 2) {
      const pruefen = createNode('button', 'onda-erk-stimme is-still', 'Als Stimme prüfen')
      pruefen.type = 'button'
      pruefen.title = 'Aus mindestens zwei eigenen Textstellen als mögliches Stimmenmerkmal vormerken'
      pruefen.addEventListener('click', () => {
        ctx.state.memoryStore.voiceProposals.push(schlageStimmenmerkmalVor({
          trait: gruppe.satz,
          anchors: anker,
          at: Date.now(),
        }))
        ctx.scheduleSave()
        renderErkanntes()
      })
      zeile.append(pruefen)
    }
    const weg = createNode('button', 'onda-erk-weg', 'Stimmt nicht mehr')
    weg.type = 'button'
    weg.setAttribute('aria-label', `Zuruecknehmen: ${gruppe.satz}`)
    weg.addEventListener('click', () => {
      ctx.state.memoryStore = ueberholeErkanntes(ctx.state.memoryStore, gruppe.schluessel).store
      ctx.scheduleSave()
      renderErkanntes()
    })
    zeile.append(weg)
    kinder.push(zeile)
  })

  if (entwicklung.masterySignals.length) {
    const wiederkehr = entwicklung.masterySignals.filter(signal => signal.kind === 'recurrence').length
    const selbst = entwicklung.masterySignals.filter(signal => signal.kind === 'self-correction').length
    const eigene = entwicklung.masterySignals.filter(signal => signal.kind === 'own-version').length
    const teile = [
      wiederkehr ? `${wiederkehr} wiederholt erkannt` : '',
      selbst ? `${selbst} selbst korrigiert` : '',
      eigene ? `${eigene} eigene Fassung` : '',
    ].filter(Boolean)
    if (teile.length) kinder.push(createNode('p', 'onda-erk-entwicklung', `Beobachtbare Entwicklung: ${teile.join(' · ')}.`))
  }

  const kalibrierung = synchronisiereRueckkopplungsvorschlag()
  if (kalibrierung) {
    const details = createNode('details', 'onda-rueckkopplung')
    const summary = document.createElement('summary')
    summary.textContent = kalibrierung.status === 'approved'
      ? 'Wie Onda seine Hinweise anpasst'
      : 'Onda hat ein Muster in seiner Rückmeldung bemerkt'
    details.append(summary)
    details.append(createNode(
      'p',
      'onda-rueckkopplung-hinweis',
      'Diese Bilanz misst, welche Hinweise zu Änderungen führten — nicht, welche wahr '
        + 'waren. Sie verändert ohne deine Zustimmung nichts und darf weder Integritätsfragen '
        + 'noch Hinweisarten abschalten.',
    ))

    const auffaellige = rueckkopplungTabelle(kalibrierung.bilanz)
      .filter(zeile => zeile.lage === 'traegt' || zeile.lage === 'traegt-selten')
    if (auffaellige.length) {
      const listeNode = createNode('ul', 'onda-rueckkopplung-liste')
      auffaellige.forEach(zeile => {
        listeNode.append(createNode(
          'li',
          '',
          `${zeile.art}: ${zeile.lageLabel} (${zeile.angenommen} angenommen, ${zeile.verworfen} verworfen)`,
        ))
      })
      details.append(listeNode)
    }

    const gesten = createNode('div', 'onda-rueckkopplung-gesten')
    const zustimmen = createNode(
      'button',
      'onda-erk-geste',
      kalibrierung.status === 'approved' ? 'Wird berücksichtigt' : 'Bei der Darreichung berücksichtigen',
    )
    zustimmen.type = 'button'
    zustimmen.disabled = kalibrierung.status === 'approved'
    zustimmen.addEventListener('click', () => {
      ctx.state.rueckkopplung = entscheideRueckkopplung(kalibrierung, {
        approved: true,
        actor: 'user',
        at: Date.now(),
      })
      ctx.scheduleSave()
      renderErkanntes()
    })
    const ablehnen = createNode(
      'button',
      'onda-erk-geste is-still',
      kalibrierung.status === 'approved' ? 'Nicht mehr berücksichtigen' : 'Nicht verwenden',
    )
    ablehnen.type = 'button'
    ablehnen.disabled = kalibrierung.status === 'rejected'
    ablehnen.addEventListener('click', () => {
      ctx.state.rueckkopplung = entscheideRueckkopplung(kalibrierung, {
        approved: false,
        actor: 'user',
        at: Date.now(),
      })
      ctx.scheduleSave()
      renderErkanntes()
    })
    gesten.append(zustimmen, ablehnen)
    details.append(gesten)
    kinder.push(details)
  }

  bereich.replaceChildren(...kinder)
}

// Der Kanal spricht jetzt im Chat statt in einer eigenen Spalte. Eine Erweiterung ist
// etwas, das jemand SAGT — "mir faellt da noch was ein" —, kein Posten in einem Regal.
//
// Die Nachricht traegt die Kennung der Erweiterung. Ohne das stuende sie bei jedem
// Zeichnen ein zweites Mal im Verlauf; so findet sie sich wieder und bleibt eine.
// Gezaehlt wird nichts.
function renderErweiterungen() {
  const doc = ctx?.activeDoc()
  const workspace = activeWorkspace()
  if (!doc || !workspace) return
  ensureErweiterungen(doc)

  sichtbareErweiterungen(doc).forEach(erweiterung => {
    const id = `erweiterung-${erweiterung.id}`
    if (workspace.agent.messages.some(vorhanden => vorhanden.id === id)) return
    const anriss = erweiterungAnriss(erweiterung.gedanke) || erweiterung.gedanke
    workspace.agent.messages.push({
      id,
      status: 'new',
      // 0 heisst: KEINE zusaetzliche Wartezeit ueber die drei Momente hinaus
      // (scheduleAgentInitiative rechnet `earliestAt - now` gegen die Schreibpause).
      // Die Nachricht kommt also, wenn man ohnehin aufschaut — nicht sofort, aber auch
      // nicht erst auf Aufforderung. Der Kommentar behauptete hier einmal, sie halte
      // sich ganz zurueck; das stimmte nicht, und ein Kanal, den niemand sieht, waere
      // auch nicht das, was Jakob gemeint hat („der Agent kommuniziert es im Chat").
      earliestAt: 0,
      text: `${ART_LABEL[erweiterung.art]}: ${anriss}\n\n${ART_ERKLAERUNG[erweiterung.art]}\n\nMuster: ${erweiterung.muster}`,
      thread: [],
    })
  })
}

function closeOndaDialog({ restoreFocus = true } = {}) {
  if (!ondaDialog) return false
  const { scrim, opener, keyHandler } = ondaDialog
  document.removeEventListener('keydown', keyHandler, true)
  scrim.remove()
  ondaDialog = null
  if (restoreFocus && opener?.isConnected) opener.focus()
  return true
}

function dialogFocusables(panel) {
  return [...panel.querySelectorAll('button, summary, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')]
    .filter(node => !node.disabled && node.offsetParent !== null)
}

// breit: die Blaetter-Vorlage. Grosses Fenster ueber dem Text, der Text bleibt am
// Rand sichtbar und abgedunkelt — man weiss, dass man nur nachschaut.
// onDocChange: das offene Fenster zeichnet sich nach, wenn sich das Dokument unter ihm
// aendert (Baustein hinzugefuegt). Ohne das stuende die Liste veraltet da.
function openOndaDialog({ id, title, opener, build, breit = false, onDocChange = null }) {
  closeOndaDialog({ restoreFocus: false })
  const scrim = createNode('div', 'onda-dialog-scrim')
  const panel = createNode('section', 'onda-dialog')
  if (breit) {
    scrim.classList.add('onda-dialog-scrim--breit')
    panel.classList.add('onda-dialog--breit')
  }
  panel.id = id
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  const titleId = `${id}-title`
  panel.setAttribute('aria-labelledby', titleId)

  const header = createNode('header', 'onda-dialog-header')
  const heading = createNode('h2', 'onda-dialog-title', title)
  heading.id = titleId
  const close = createNode('button', 'onda-icon-btn onda-dialog-close')
  close.append(ondaIcon('x', { size: 18 }))
  close.type = 'button'
  close.setAttribute('aria-label', 'Schließen')
  close.addEventListener('click', () => closeOndaDialog())
  header.append(heading, close)

  const body = createNode('div', 'onda-dialog-body')
  build(body)
  panel.append(header, body)
  scrim.append(panel)
  scrim.addEventListener('pointerdown', event => { if (event.target === scrim) closeOndaDialog() })

  const keyHandler = event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeOndaDialog(); return }
    if (event.key !== 'Tab') return
    // Das Einfuegemenue haengt an #editorView, nicht im Fenster. Ohne diese Ausnahme
    // risse die Fokusfalle den Tastaturweg aus dem gerade geoeffneten Menue zurueck
    // ins Fenster, und das Menue waere mit der Tastatur nicht zu bedienen.
    if (insertMenu?.node.contains(document.activeElement)) return
    const items = dialogFocusables(panel)
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  document.addEventListener('keydown', keyHandler, true)
  document.getElementById('editorView').append(scrim)
  ondaDialog = { scrim, panel, opener: opener || document.activeElement, keyHandler, onDocChange }
  requestAnimationFrame(() => { (dialogFocusables(panel)[0] || close).focus({ preventScroll: true }) })
  return panel
}

// Die Blaetter-Vorlage: EIN Fenster fuer alle drei Abschnitte. Links die Eintraege,
// rechts der vertiefende Text zum gewaehlten — und rechts darf ueberall
// hineingeschrieben werden.
//
// Der gewaehlte Eintrag lebt hier und nicht im Dokument: welche Zeile gerade offen
// steht, ist eine Frage des Hinschauens und keine Eigenschaft des Textes.
function openOndaBlaetter({ id, title, opener, eintraege, tiefe, fuss = null, onDocChange = null }) {
  let gewaehlt = null
  let spalte = null
  let liste = null
  let fussFlaeche = null
  let tief = null

  const zeichneTiefe = () => {
    if (!tief) return
    // Tippt jemand gerade rechts, nicht neu aufbauen: sonst springt der Cursor.
    if (tief.contains(document.activeElement)) return
    tief.replaceChildren()
    tiefe(tief, gewaehlt)
  }

  const waehle = schluessel => {
    gewaehlt = schluessel
    zeichneListe()
    zeichneTiefe()
  }

  function zeichneListe() {
    if (!liste) return
    // Der Fokus muss den Neuaufbau ueberleben, und zwar in BEIDEN Stuecken der linken
    // Spalte: „Baustein hinzufuegen" steht seit dem Umbau im festen Fuss und nicht mehr
    // in der Liste — ohne die Kennung faellt der Fokus nach dem Einfuegen ins Nichts.
    const merker = merkeFokus()
    liste.replaceChildren()
    eintraege(liste, { gewaehlt, waehle, eintrag: blattEintrag })
    if (fuss && fussFlaeche) {
      fussFlaeche.replaceChildren()
      fuss(fussFlaeche, { gewaehlt })
    }
    holeFokus(merker)
  }

  function merkeFokus() {
    const aktiv = document.activeElement
    if (!spalte?.contains(aktiv)) return null
    return { blatt: aktiv?.dataset?.blattId || null, kennung: aktiv?.id || null }
  }

  function holeFokus(merker) {
    if (!merker) return
    const ziel = (merker.blatt
      && liste.querySelector(`[data-blatt-id="${escapedSelectorValue(merker.blatt)}"]`))
      || (merker.kennung && document.getElementById(merker.kennung))
    ziel?.focus({ preventScroll: true })
  }

  const panel = openOndaDialog({
    id,
    title,
    opener,
    breit: true,
    onDocChange: () => { zeichneListe(); zeichneTiefe(); onDocChange?.() },
    build: body => {
      body.classList.add('onda-blaetter')
      spalte = createNode('div', 'onda-blaetter__spalte')
      liste = blaetterListe(id)
      fussFlaeche = createNode('div', 'onda-blaetter__fuss')
      spalte.append(liste, fussFlaeche)
      tief = blaetterTiefe(id)
      body.append(spalte, tief)
      zeichneListe()
      zeichneTiefe()
    },
  })
  return { panel, waehle, zeichne: () => { zeichneListe(); zeichneTiefe() } }
}

// Die beiden Spalten. Bewusst KEINE Registerkarten-Rollen (tablist/tab/tabpanel):
// in der linken Spalte stehen neben den Eintraegen auch Rubriken und Knoepfe, die
// eigene Fenster oeffnen — role="tablist" verlangt aber ausschliesslich Registerkarten
// als Kinder, und axe meldet das zu Recht als kritischen Fehler. Die Auswahl sagt
// aria-current, und das gilt an jedem Element.
function blaetterListe(id) {
  const liste = createNode('div', 'onda-blaetter__liste')
  liste.id = `${id}-liste`
  liste.setAttribute('aria-label', 'Einträge')
  return liste
}

function blaetterTiefe(id) {
  const tief = createNode('div', 'onda-blaetter__tiefe')
  tief.id = `${id}-tiefe`
  tief.setAttribute('role', 'region')
  tief.setAttribute('aria-label', 'Der gewählte Eintrag')
  return tief
}

// Ein Eintrag der linken Spalte. Name plus, wo es hilft, ein Anriss des Inhalts.
function blattEintrag(schluessel, name, { anriss = '', gewaehlt = false, onWaehle = null } = {}) {
  const knopf = createNode('button', 'onda-blaetter__eintrag')
  knopf.type = 'button'
  knopf.dataset.blattId = schluessel
  if (gewaehlt) knopf.setAttribute('aria-current', 'true')
  // Auch der Name ist bedingt, nicht nur der Anriss: Ein Baustein ohne erkannten und ohne
  // von Hand gewaehlten Namen traegt keinen — dann soll dort auch keine leere Zeile stehen.
  if (name) knopf.append(createNode('span', 'onda-blaetter__eintrag-name', name))
  if (anriss) knopf.append(createNode('span', 'onda-blaetter__eintrag-anriss', anriss))
  if (onWaehle) knopf.addEventListener('click', onWaehle)
  return knopf
}

// Die Zahl am Namen zaehlt BESTAND, keine Anmerkungen. docs/PHILOSOPHIE.md §1 verbietet
// das Zaehlen von Anmerkungen — wie viele Quellen im Projekt liegen, ist eine Auskunft.
function renderMaterialEntry() {
  const button = document.getElementById('materialSources')
  if (!button) return
  const project = dokumentProjekt()
  const count = Array.isArray(project?.sources) ? project.sources.length : 0
  button.setAttribute('aria-haspopup', 'dialog')
  const zaehler = createNode('span', 'onda-badge onda-material-count', String(count))
  zaehler.id = 'materialSourcesCount'
  button.replaceChildren(createNode('span', 'onda-material-label', 'Quellen'), zaehler)
}

// Welche Themen im Baum offen stehen. Wie strukturKlappen bewusst NICHT im Dokument:
// ob eine Gruppe gerade aufgeklappt ist, ist eine Frage des Hinschauens und keine
// Eigenschaft des Projekts — sie gehoert nicht in eine Datei, die man exportiert.
// Beim Projektwechsel faellt der Merker, weil die Kennungen dann andere meinen.
let quellenKlappen = { projectId: null, offen: new Set() }

function quellenKlappenFuer(projectId) {
  if (quellenKlappen.projectId !== projectId) quellenKlappen = { projectId, offen: new Set() }
  return quellenKlappen.offen
}

// Der Baum unter „Quellen": nach Thema, so wie der Agent sie gebildet und benannt hat.
// Dieselben zwei Gesten wie eine Abschnittszeile darueber, eine Ebene tiefer: der PFEIL
// klappt die Gruppe auf und zu, der NAME oeffnet das Quellen-Fenster bei dieser Gruppe.
// Ein einziger Knopf koennte keins von beidem ankuendigen — aria-expanded und
// aria-haspopup widersprechen sich am selben Element.
//
// Bewusst KEINE Zahl an der Gruppenzeile, obwohl der Abschnittsname darueber eine
// traegt: die Gesamtzahl ist eine Auskunft, sechs Zahlen untereinander sind eine
// Punktetafel. Wie viele in einer Gruppe liegen, sagt der aufgeklappte Baum selbst —
// und Vorlesegeraete bekommen es IMMER gesagt, im Namen des Knopfes (harte Regel 3).
function renderMaterialTree() {
  const baum = elements().materialTree
  if (!baum) return
  const project = dokumentProjekt()
  if (!project) { baum.replaceChildren(); return }
  const offen = quellenKlappenFuer(project.id)
  const gruppen = themenBaum(project)
  const kinder = []
  if (!gruppen.length) {
    kinder.push(createNode('p', 'onda-baum-leer', 'Noch keine Quellen im Projekt.'))
  }
  gruppen.forEach(gruppe => {
    const flaeche = createNode('div', 'onda-baum-thema')
    const kopf = createNode('div', 'onda-baum-kopf')
    const kinderId = `quellenBaum-${gruppe.id}`
    const istOffen = offen.has(gruppe.id)
    const anzahl = gruppe.quellen.length
    const quellenWort = anzahl === 1 ? '1 Quelle' : `${anzahl} Quellen`

    const pfeil = createNode('button', 'onda-baum-pfeil')
    pfeil.type = 'button'
    pfeil.dataset.themaId = gruppe.id
    pfeil.setAttribute('aria-expanded', String(istOffen))
    pfeil.setAttribute('aria-controls', kinderId)
    pfeil.setAttribute('aria-label', `${gruppe.name} ${istOffen ? 'zuklappen' : 'aufklappen'}`)
    pfeil.title = istOffen ? 'Zuklappen' : 'Aufklappen'
    pfeil.append(ondaIcon('chevron-right', { size: 14 }))
    pfeil.addEventListener('click', () => {
      if (offen.has(gruppe.id)) offen.delete(gruppe.id)
      else offen.add(gruppe.id)
      renderMaterialTree()
      // Der Fokus bleibt am Pfeil, den man gerade gedrueckt hat — sonst faellt er beim
      // Neuaufbau auf den Seitenanfang, und Tastaturbedienung waere unbrauchbar.
      elements().materialTree
        ?.querySelector(`.onda-baum-pfeil[data-thema-id="${escapedSelectorValue(gruppe.id)}"]`)
        ?.focus({ preventScroll: true })
    })

    const name = createNode('button', 'onda-baum-name')
    name.type = 'button'
    name.dataset.themaId = gruppe.id
    name.setAttribute('aria-haspopup', 'dialog')
    name.setAttribute('aria-controls', 'materialModal')
    name.setAttribute('aria-label', `${gruppe.name} öffnen, ${quellenWort}`)
    name.append(createNode('span', 'onda-baum-name-text', gruppe.name))
    name.addEventListener('click', event => openProjectSourcesModal(event.currentTarget, gruppe.id))

    kopf.append(pfeil, name)
    flaeche.append(kopf)

    const kinderFlaeche = createNode('div', 'onda-baum-kinder')
    kinderFlaeche.id = kinderId
    kinderFlaeche.setAttribute('role', 'group')
    kinderFlaeche.setAttribute('aria-label', gruppe.name)
    kinderFlaeche.hidden = !istOffen
    gruppe.quellen.forEach(quelle => {
      const knopf = createNode('button', 'onda-baum-quelle')
      knopf.append(createNode('span', 'onda-baum-quelle-text', quellenTitel(quelle)))
      knopf.type = 'button'
      knopf.dataset.quelleId = quelle.id
      knopf.setAttribute('aria-haspopup', 'dialog')
      knopf.setAttribute('aria-controls', 'materialModal')
      knopf.addEventListener('click', event => {
        openProjectSourcesModal(event.currentTarget, quelle.id)
      })
      kinderFlaeche.append(knopf)
    })
    if (!gruppe.quellen.length) {
      kinderFlaeche.append(createNode('p', 'onda-baum-leer', 'Noch nichts hier.'))
    }
    flaeche.append(kinderFlaeche)
    kinder.push(flaeche)
  })
  baum.replaceChildren(...kinder)
}

// Das Quellen-Fenster in derselben Blaetter-Gestalt wie die anderen beiden: links die
// Eintraege, rechts die Vertiefung. Es baut die Vertiefung ABSICHTLICH selbst und
// nicht ueber openOndaBlaetter — die Quellenbibliothek zeichnet sich beim Aufnehmen,
// Lesen und Zurueckgehen selbst in denselben Knoten. Wuerde die Vorlage ihn bei jedem
// Listen-Neuaufbau leeren, riss sie der Bibliothek den Boden unter den Fuessen weg.
function openProjectSourcesModal(opener, gewuenschterEintrag = null) {
  const project = dokumentProjekt()
  const sourceLibrary = createSourceLibraryUi({
    context: ctx,
    createNode,
    onCountChange: () => { renderMaterialEntry(); renderMaterialTree() },
    safeHttpsUrl,
    openSecureExternal,
  })
  // 'bibliothek' ist die Voreinstellung: wer die Quellen oeffnet, will meistens die
  // ganze Bibliothek und nicht eine einzelne Zeile. gewuenschterEintrag ist entweder
  // eine Quellen- oder eine Themenkennung — beide fuehren in dieselbe rechte Tafel.
  let gewaehlt = gewuenschterEintrag || 'bibliothek'
  let liste = null
  let fussFlaeche = null
  let tief = null

  // Eine Meldezeile, die den Neuaufbau ueberlebt: ein Vorlesegeraet kuendigt nur an,
  // was sich in einem Knoten aendert, den es schon kennt. Wuerde sie bei jedem
  // Zeichnen neu entstehen, saehe niemand je, dass Onda gerade ordnet.
  const meldung = createNode('p', 'onda-blaetter__meldung')
  meldung.id = 'quellenMeldung'
  meldung.setAttribute('role', 'status')
  meldung.setAttribute('aria-live', 'polite')
  meldung.hidden = true
  const melde = text => {
    meldung.textContent = text || ''
    meldung.hidden = !text
  }

  const istThema = schluessel => (
    schluessel === OHNE_THEMA || ensureQuellenThemen(project).some(thema => thema.id === schluessel)
  )

  // Die rechte Tafel einer GRUPPE: ihr Name, der Satz darunter, ihre Quellen — und der
  // Weg, sie wieder loszuwerden. Beides darf der Mensch aendern; wo er es tut, gehoert
  // die Gruppe ihm, und der naechste Lauf des Agenten laesst sie in Ruhe.
  const zeichneThema = themaId => {
    const gruppe = themenBaum(project).find(kandidat => kandidat.id === themaId)
    if (!gruppe) { gewaehlt = 'bibliothek'; zeichneTiefe(); return }
    const istOhneThema = gruppe.id === OHNE_THEMA

    tief.append(createNode('h3', 'onda-blaetter__tiefe-titel', gruppe.name))
    if (istOhneThema) {
      tief.append(createNode(
        'p',
        'onda-blaetter__tiefe-hinweis',
        'Diese Quellen hat noch niemand einem Thema zugeordnet. Das ist kein Mangel — '
        + 'wähle eine aus und gib ihr ein Thema, oder lass Onda die Quellen ordnen.',
      ))
    } else {
      bearbeitbaresFeld(tief, 'Name der Gruppe', gruppe.name, wert => {
        benenneThemaUm(project, gruppe.id, wert)
        ctx?.scheduleSave()
        renderMaterialTree()
        const zeile = liste?.querySelector(`[data-thema-id="${escapedSelectorValue(gruppe.id)}"] .onda-blaetter__eintrag-name`)
        if (zeile) zeile.textContent = String(wert || '').trim() || gruppe.name
      }, { kurz: true })
      bearbeitbaresFeld(tief, 'Was diese Quellen gemeinsam tragen', gruppe.warum || '', wert => {
        beschreibeThema(project, gruppe.id, wert)
        ctx?.scheduleSave()
      })
    }

    const quellenFlaeche = createNode('div', 'onda-quellen-gruppe')
    quellenFlaeche.append(createNode('span', 'onda-pv-label', 'Quellen in dieser Gruppe'))
    if (!gruppe.quellen.length) {
      quellenFlaeche.append(createNode('p', 'onda-material-empty', 'Noch keine Quelle hier.'))
    }
    gruppe.quellen.forEach(quelle => {
      const knopf = createNode('button', 'onda-blaetter__eintrag', quellenTitel(quelle))
      knopf.type = 'button'
      knopf.addEventListener('click', () => { gewaehlt = quelle.id; zeichneListe(); zeichneTiefe() })
      quellenFlaeche.append(knopf)
    })
    tief.append(quellenFlaeche)

    if (!istOhneThema) {
      const weg = createNode('button', 'onda-blaetter__eintrag onda-blaetter__eintrag--still', 'Gruppe auflösen')
      weg.type = 'button'
      weg.dataset.themaId = gruppe.id
      // „Aufloesen", nicht „loeschen": die Quellen bleiben, nur die Kiste geht. Der
      // Wortlaut sagt genau das, damit niemand fuerchtet, sein Material zu verlieren.
      weg.setAttribute('aria-label', `Gruppe ${gruppe.name} auflösen — die Quellen bleiben und stehen dann ohne Thema`)
      weg.addEventListener('click', () => {
        const ergebnis = loescheThema(project, gruppe.id)
        ctx?.scheduleSave()
        gewaehlt = 'bibliothek'
        // Der Fokus steht auf einem Knopf, den es gleich nicht mehr gibt — und er steht
        // in der rechten Tafel. Ohne ihn vorher wegzunehmen, greift die Tipp-Sperre in
        // zeichneTiefe, und dort stuende weiter eine Gruppe, die schon aufgeloest ist.
        weg.blur()
        renderMaterialTree()
        zeichneListe()
        zeichneTiefe()
        // Und danach an eine Stelle, die es noch gibt: ein Fenster ohne Fokus faengt
        // den Tastaturweg nicht mehr, und die Eingabetaste liefe ins Leere.
        liste?.querySelector('[data-blatt-id="bibliothek"]')?.focus({ preventScroll: true })
        if (ergebnis) {
          const anzahl = ergebnis.freigewordene.length
          melde(anzahl
            ? `„${ergebnis.name}" ist aufgelöst. ${anzahl === 1 ? 'Die Quelle steht' : `Die ${anzahl} Quellen stehen`} jetzt ohne Thema.`
            : `„${ergebnis.name}" ist aufgelöst.`)
        }
      })
      tief.append(weg)
    }
  }

  // Die rechte Tafel einer QUELLE: was sie ist, und in welchem Thema sie liegt.
  const zeichneQuelle = quelle => {
    tief.append(createNode('h3', 'onda-blaetter__tiefe-titel', quellenTitel(quelle)))
    if (quelle.claim) tief.append(createNode('p', 'onda-blaetter__tiefe-hinweis', quelle.claim))

    const gruppen = themenBaum(project)
    const aktuelles = gruppen.find(gruppe => gruppe.quellen.some(kandidat => kandidat.id === quelle.id))

    // Verschieben ohne Ziehen: Ziehen ist auf dem Trackpad zaeh und fuer Vorlesegeraete
    // tot. Eine Auswahlliste kann beides und sagt zugleich, welche Gruppen es gibt.
    const feld = createNode('div', 'onda-pv-field')
    const labelRow = createNode('div', 'onda-pv-label-row')
    labelRow.append(createNode('span', 'onda-pv-label', 'Thema'))
    feld.append(labelRow)
    const wahl = createNode('select', 'onda-quellen-thema-wahl')
    wahl.setAttribute('aria-label', `Thema von ${quellenTitel(quelle)}`)
    ensureQuellenThemen(project).forEach(thema => {
      const option = createNode('option', '', thema.name)
      option.value = thema.id
      wahl.append(option)
    })
    const ohne = createNode('option', '', OHNE_THEMA_NAME)
    ohne.value = OHNE_THEMA
    wahl.append(ohne)
    wahl.value = aktuelles && aktuelles.id !== OHNE_THEMA ? aktuelles.id : OHNE_THEMA
    wahl.addEventListener('change', () => {
      verschiebeQuelle(project, quelle.id, wahl.value)
      ctx?.scheduleSave()
      renderMaterialTree()
      zeichneListe()
      zeichneTiefe()
      const ziel = wahl.value === OHNE_THEMA
        ? OHNE_THEMA_NAME
        : (ensureQuellenThemen(project).find(thema => thema.id === wahl.value)?.name || OHNE_THEMA_NAME)
      melde(`„${quellenTitel(quelle)}" steht jetzt unter „${ziel}".`)
    })
    feld.append(wahl)
    tief.append(feld)

    const zurueck = createNode('button', 'onda-blaetter__eintrag', 'Zur ganzen Quellenbibliothek')
    zurueck.type = 'button'
    zurueck.addEventListener('click', () => { gewaehlt = 'bibliothek'; zeichneListe(); zeichneTiefe() })
    tief.append(zurueck)
  }

  const zeichneTiefe = () => {
    if (!tief) return
    // Tippt jemand gerade rechts in ein Feld, nicht neu aufbauen: sonst springt der
    // Cursor mitten im Wort weg. Dieselbe Regel wie in der Blaetter-Vorlage.
    if (tief.contains(document.activeElement)) return
    tief.replaceChildren()
    if (gewaehlt === 'bibliothek') {
      sourceLibrary.renderProjectSourceLibrary(tief, project)
      return
    }
    if (istThema(gewaehlt)) { zeichneThema(gewaehlt); return }
    const quelle = (project?.sources || []).find(kandidat => kandidat.id === gewaehlt)
    if (!quelle) { sourceLibrary.renderProjectSourceLibrary(tief, project); return }
    zeichneQuelle(quelle)
  }

  function zeichneListe() {
    if (!liste) return
    liste.replaceChildren()
    liste.append(blattEintrag('bibliothek', 'Quellenbibliothek', {
      gewaehlt: gewaehlt === 'bibliothek',
      onWaehle: () => { gewaehlt = 'bibliothek'; zeichneListe(); zeichneTiefe() },
    }))
    themenBaum(project).forEach(gruppe => {
      // Die Gruppe ist selbst ein Eintrag und keine tote Rubrik mehr: nur so kommt man
      // an ihren Namen, ihren Satz und den Weg, sie aufzuloesen.
      const gruppenKnopf = blattEintrag(gruppe.id, gruppe.name, {
        anriss: gruppe.warum || '',
        gewaehlt: gewaehlt === gruppe.id,
        onWaehle: () => { gewaehlt = gruppe.id; zeichneListe(); zeichneTiefe() },
      })
      gruppenKnopf.classList.add('onda-blaetter__eintrag--gruppe')
      gruppenKnopf.dataset.themaId = gruppe.id
      liste.append(gruppenKnopf)
      gruppe.quellen.forEach(quelle => {
        const eintrag = blattEintrag(quelle.id, quellenTitel(quelle), {
          gewaehlt: gewaehlt === quelle.id,
          onWaehle: () => { gewaehlt = quelle.id; zeichneListe(); zeichneTiefe() },
        })
        eintrag.classList.add('onda-blaetter__eintrag--kind')
        liste.append(eintrag)
      })
    })
    zeichneFuss()
  }

  // Der feste Streifen unter der Liste — dieselbe Stelle wie im Struktur-Fenster.
  function zeichneFuss() {
    if (!fussFlaeche) return
    fussFlaeche.replaceChildren()
    const ordnen = createNode('button', 'onda-blaetter__eintrag', 'Nach Thema ordnen')
    ordnen.id = 'quellenOrdnen'
    ordnen.type = 'button'
    ordnen.disabled = kanalGesperrt('quellen')
    ordnen.addEventListener('click', async () => {
      melde('Onda ordnet die Quellen …')
      ordnen.disabled = true
      const ergebnis = await fuehreQuellenlaufAus({ vonHand: true })
      renderMaterialTree()
      zeichneListe()
      zeichneTiefe()
      melde(quellenlaufMeldung(ergebnis))
    })
    const neu = createNode('button', 'onda-blaetter__eintrag', 'Gruppe anlegen')
    neu.id = 'quellenGruppeNeu'
    neu.type = 'button'
    neu.addEventListener('click', () => {
      const thema = legeThemaAn(project, 'Neue Gruppe')
      ctx?.scheduleSave()
      gewaehlt = thema.id
      renderMaterialTree()
      zeichneListe()
      zeichneTiefe()
      // Direkt ins Namensfeld: eine Gruppe, die „Neue Gruppe" heisst, ist noch keine.
      requestAnimationFrame(() => tief?.querySelector('.onda-pv-input')?.focus({ preventScroll: true }))
    })
    fussFlaeche.append(ordnen, neu, meldung)
  }

  openOndaDialog({
    id: 'materialModal',
    title: 'Quellen im Projekt',
    opener,
    breit: true,
    build: body => {
      body.classList.add('onda-blaetter')
      const spalte = createNode('div', 'onda-blaetter__spalte')
      liste = blaetterListe('materialModal')
      fussFlaeche = createNode('div', 'onda-blaetter__fuss')
      spalte.append(liste, fussFlaeche)
      tief = blaetterTiefe('materialModal')
      body.append(spalte, tief)
      zeichneListe()
      zeichneTiefe()
    },
  })

  // Der Agent ordnet von allein, sobald sich die Quellenmenge seit dem letzten Mal
  // geaendert hat — niemand soll einen Knopf druecken muessen, damit Ordnung entsteht
  // (docs/PHILOSOPHIE.md §1). Kein Schluessel, zu wenige Quellen oder dieselbe Menge
  // wie beim letzten Lauf heisst: es passiert nichts, still und ohne Kosten.
  ordneQuellenBeiBedarf().then(ergebnis => {
    if (!ergebnis?.gestartet || !ondaDialog || ondaDialog.panel?.id !== 'materialModal') return
    renderMaterialTree()
    zeichneListe()
    zeichneTiefe()
    melde(quellenlaufMeldung(ergebnis))
  })
}

function quellenlaufMeldung(ergebnis) {
  if (!ergebnis?.gestartet) {
    if (ergebnis?.grund === 'kein-schluessel') return 'Ohne KI-Anschluss ordnet Onda nicht — die Quellen stehen so, wie du sie gelegt hast.'
    if (ergebnis?.grund === 'zu-wenige') return 'Bei so wenigen Quellen ist die Liste selbst schon die Ordnung.'
    if (ergebnis?.grund === 'keine-quellen') return 'Es liegt noch keine Quelle im Projekt.'
    if (ergebnis?.grund === 'beispielprojekt') return 'Im Beispielprojekt ordnet Onda nicht.'
    if (ergebnis?.grund === 'monatsbudget-erreicht') return 'Die lokale Monatsgrenze ist erreicht.'
    return ''
  }
  if (!ergebnis.erfolg) return 'Onda konnte gerade nicht ordnen. Deine Gruppen sind unberührt.'
  const anzahl = ergebnis.gruppen?.length || 0
  if (!anzahl) return 'Onda hat keine tragende Gemeinsamkeit gefunden. Die Quellen stehen unverändert.'
  return anzahl === 1 ? 'Onda hat ein Thema gebildet.' : `Onda hat ${anzahl} Themen gebildet.`
}

// ---------- Einstellungen: KI-Anschluss (Bereich U) ----------
// Der Schluessel wird IMMER vom Nutzer selbst eingetragen. Setzen/Loeschen laeuft
// ausschliesslich ueber die echten, getesteten Gateway-Funktionen (agent-gateway.mjs
// -> agent-transport.mjs) — kein lokaler Nachbau des Bruecken-Protokolls hier.
// Mac: Keychain via Handler 'llm'/'llmkey' (der Schluessel kommt nie an JS zurueck).
// Browser: Dev-Weg in localStorage 'aiwt.apikey' (separat von aiwt.v2, taucht in
// keinem Export auf) — das schreibt bereits direktTransport.setzeSchluessel selbst.

const KI_KONSOLE_URL = 'https://console.anthropic.com'

// Bewusst dasselbe Kriterium wie waehleTransport() (agent-transport.mjs) — EINE
// Quelle der Wahrheit, welcher Transport (und damit welcher Schluessel-Speicher) greift.
function schluesselOrtIstKeychain() {
  return Boolean(window.webkit?.messageHandlers?.llm)
}

async function speichereApiSchluessel(wert) {
  const schluessel = String(wert || '').trim()
  if (!schluessel) return false
  await setzeSchluessel(schluessel)
  return true
}

async function loescheApiSchluessel() {
  await loescheSchluessel()
}

function openKiSettingsDialog(opener) {
  openOndaDialog({ id: 'kiModal', title: 'KI-Anschluss', opener, build: body => buildKiSettingsBody(body) })
}

function buildKiSettingsBody(body) {
  body.replaceChildren()
  const keychain = schluesselOrtIstKeychain()

  // Schluessel-Status + Ablageort
  const statusRow = createNode('div', 'ki-status-row')
  const statusBadge = createNode('span', 'onda-badge', 'Prüfe …')
  statusRow.append(createNode('span', 'onda-eyebrow', 'Schlüssel'), statusBadge)
  body.append(statusRow)
  body.append(createNode('p', 'ki-ort', keychain
    ? 'Ablageort: macOS-Schlüsselbund — der Schlüssel verlässt die Mac-App nicht.'
    : 'Ablageort: dieser Browser (Entwicklungsweg).'))

  // Eintragen
  const form = createNode('form', 'ki-key-form')
  const input = createNode('input', 'ki-key-input')
  input.type = 'password'
  input.placeholder = 'sk-ant-…'
  input.autocomplete = 'off'
  input.spellcheck = false
  input.setAttribute('aria-label', 'Anthropic-API-Schlüssel eintragen')
  const speichern = createNode('button', 'onda-btn onda-btn--sm', 'Speichern')
  speichern.type = 'submit'
  form.append(input, speichern)
  body.append(form)

  if (!keychain) {
    body.append(createNode('p', 'ki-hinweis',
      'Sicherheitshinweis: Im Browser liegt der Schlüssel unverschlüsselt im lokalen Speicher '
      + '(nur für Entwicklung und Notfall gedacht). Empfohlen ist die Mac-App — dort wandert er '
      + 'in den macOS-Schlüsselbund. In Exporten taucht der Schlüssel nie auf.'))
  }

  const loeschen = createNode('button', 'onda-btn onda-btn--ghost onda-btn--sm', 'Schlüssel löschen')
  loeschen.type = 'button'
  loeschen.hidden = true
  body.append(loeschen)

  const zeigeStatus = vorhanden => {
    statusBadge.textContent = vorhanden ? 'Hinterlegt' : 'Fehlt'
    statusBadge.classList.toggle('onda-badge--success', vorhanden)
    statusBadge.classList.toggle('onda-badge--warning', !vorhanden)
    loeschen.hidden = !vorhanden
  }
  hatSchluessel().then(zeigeStatus).catch(() => zeigeStatus(false))

  form.addEventListener('submit', async event => {
    event.preventDefault()
    if (!(await speichereApiSchluessel(input.value))) return
    input.value = ''
    announceAgentStatus('Schlüssel gespeichert.')
    pruefeAgentVerbindung()
    hatSchluessel().then(zeigeStatus).catch(() => zeigeStatus(false))
  })
  loeschen.addEventListener('click', async () => {
    await loescheApiSchluessel()
    announceAgentStatus('Schlüssel gelöscht.')
    pruefeAgentVerbindung()
    hatSchluessel().then(zeigeStatus).catch(() => zeigeStatus(false))
  })

  // Anleitung (aufklappbar)
  const anleitung = createNode('details', 'ki-anleitung')
  anleitung.append(createNode('summary', null, 'So richtest du den KI-Anschluss ein'))
  const schritte = createNode('ol', 'ki-anleitung-schritte')
  const schritt1 = createNode('li', null, 'Ein Konto anlegen auf ')
  const link = createNode('button', 'ki-link', 'console.anthropic.com')
  link.type = 'button'
  link.addEventListener('click', () => openSecureExternal(KI_KONSOLE_URL))
  schritt1.append(link, document.createTextNode('.'))
  const schritt3 = createNode('li', null, 'Im Anbieter-Konto ein Ausgabenlimit setzen ')
  schritt3.append(createNode('strong', 'ki-pflicht', '(Pflichtschritt — schützt vor unerwarteten Kosten).'))
  schritte.append(
    schritt1,
    createNode('li', null, 'Dort einen API-Schlüssel erzeugen (Bereich „API Keys“).'),
    schritt3,
    createNode('li', null, 'Den Schlüssel oben eintragen und speichern.'),
  )
  anleitung.append(schritte)
  body.append(anleitung)

  // Welches Modell wofür (Abnahme Etappe A, Kriterium 1)
  const modelle = createNode('section', 'ki-modelle')
  body.append(modelle)
  renderKiModelle(modelle)

  // Verbrauch (settings.usage — vom Verteiler nach jedem Lauf verbucht)
  const verbrauch = createNode('section', 'ki-verbrauch')
  body.append(verbrauch)
  renderKiVerbrauch(verbrauch)
  const budget = createNode('section', 'ki-budget')
  body.append(budget)
  renderKiBudget(budget)
  const abmelden = beiAgentStatus(() => {
    if (!verbrauch.isConnected) { abmelden(); return }
    renderKiVerbrauch(verbrauch)
    renderKiBudget(budget)
  })
}

function formatTokenZahl(wert) {
  return (Number.isFinite(+wert) ? +wert : 0).toLocaleString('de-DE')
}

// Klarnamen fuer die Aufgaben aus TASK_TABLE. Nur Beschriftung — welches Modell
// eine Aufgabe bekommt, steht ausschliesslich in agent-tasks.mjs.
const TASK_KLARNAMEN = Object.freeze({
  verstaendnis: 'Projekt verstehen',
  hinweise: 'Hinweise zum Text',
  chat: 'Gespräch',
  titel: 'Titelvorschlag',
  zusammenfassung: 'Zusammenfassung',
})

// Zeigt, welches Modell welche Aufgabe uebernimmt — abgeleitet aus TASK_TABLE,
// damit die Anzeige nicht veralten kann, wenn die Verteilung sich aendert.
function renderKiModelle(container) {
  container.replaceChildren()
  container.append(createNode('span', 'onda-eyebrow', 'Modelle'))

  const proModell = new Map()
  for (const [task, eintrag] of Object.entries(TASK_TABLE)) {
    const modellId = MODELLE[eintrag.modell]
    if (!modellId) continue
    if (!proModell.has(modellId)) proModell.set(modellId, [])
    proModell.get(modellId).push(TASK_KLARNAMEN[task] || task)
  }

  const liste = createNode('dl', 'ki-modell-liste')
  for (const [modellId, aufgaben] of proModell) {
    liste.append(
      createNode('dt', 'ki-modell-name', modellId),
      createNode('dd', 'ki-modell-aufgaben', aufgaben.join(' · ')),
    )
  }
  container.append(liste)
  container.append(createNode('p', 'ki-modell-fuss',
    'Onda wählt das Modell je Aufgabe selbst: das starke für Denkarbeit, '
    + 'das schnelle für Routine. Das hält die Kosten niedrig.'))
}

function renderKiVerbrauch(container) {
  container.replaceChildren()
  container.append(createNode('span', 'onda-eyebrow', 'Verbrauch'))
  const usage = ctx?.state?.settings?.usage
  if (!usage || (!usage.inputTokens && !usage.outputTokens)) {
    container.append(createNode('p', 'ki-verbrauch-leer', 'Diesen Monat noch keine Läufe.'))
    return
  }
  let monatsName = usage.monat
  try {
    monatsName = new Date(usage.monat + '-01T00:00:00').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  } catch {}
  container.append(
    createNode('p', null, `${monatsName}: ${formatTokenZahl(usage.inputTokens)} Tokens hinein · ${formatTokenZahl(usage.outputTokens)} Tokens heraus`),
    createNode('p', null, `Aus dem Zwischenspeicher gelesen: ${formatTokenZahl(usage.cacheReadTokens)} · hineingeschrieben: ${formatTokenZahl(usage.cacheWriteTokens)}`),
    createNode('p', 'ki-verbrauch-kosten',
      `Geschätzte Kosten: ${((usage.kostenCents || 0) / 100).toLocaleString('de-DE', { style: 'currency', currency: 'USD' })}`
      + ' — Schätzung nach Preisstand 07/2026; verbindlich ist die Abrechnung im Anthropic-Konto.'),
  )
}

function starteBewusstFreigegebenenAutomatiklauf() {
  const pausiert = pausierterAutomatiklauf
  if (pausiert?.typ === 'verstaendnis') {
    // Die Budgetpause hat bereits eine sichtbare Interview-Nachricht angelegt.
    // Der normale Pruefpfad wuerde deshalb bei "Nachricht existiert" abbrechen;
    // die ausdrueckliche Einzelfreigabe nimmt genau den pausierten Lauf direkt
    // wieder auf. starteVerstaendnisEntwurf prueft Dokument und Projekt nach
    // dem asynchronen Schluesselzugriff erneut.
    starteVerstaendnisEntwurf(pausiert.projectId, pausiert.docId)
    return
  }
  if (!pausiert && istInterviewAktiv()) {
    interviewPruefKey = null
    pruefeVerstaendnisInterview()
    return
  }
  fuehreHinweislaufAus({ grund: 'freigabe' })
}

function renderKiBudget(container) {
  container.replaceChildren()
  const settings = ctx?.state?.settings
  if (!settings) return
  const stand = budgetStand(settings)
  container.append(
    createNode('span', 'onda-eyebrow', 'Lokale Monatsgrenze'),
    createNode('p', 'ki-hinweis',
      'Zusätzliche Kostenbremse für selbstständig gestartete KI-Läufe. '
      + 'Das Ausgabenlimit im Anbieter-Konto bleibt der verbindliche Schutz.'),
  )

  const form = createNode('form', 'ki-budget-form')
  const label = createNode('label', 'ki-budget-label', 'Grenze in US-Dollar')
  label.htmlFor = 'kiBudgetInput'
  const input = createNode('input', 'ki-budget-input')
  input.id = 'kiBudgetInput'
  input.name = 'kiBudgetUsd'
  input.type = 'number'
  input.min = '0.01'
  input.step = '0.01'
  input.inputMode = 'decimal'
  input.placeholder = 'z. B. 10,00'
  input.value = stand.konfiguriert ? String(stand.budgetCents / 100) : ''
  const speichern = createNode('button', 'onda-btn onda-btn--sm', 'Grenze speichern')
  speichern.type = 'submit'
  form.append(label, input, speichern)
  container.append(form)

  form.addEventListener('submit', event => {
    event.preventDefault()
    const betrag = Number.parseFloat(String(input.value || '').replace(',', '.'))
    if (!Number.isFinite(betrag) || betrag <= 0) {
      input.setCustomValidity('Bitte gib einen Betrag größer als null ein.')
      input.reportValidity()
      return
    }
    input.setCustomValidity('')
    settings.kiMonatsbudgetCents = Math.round(betrag * 100)
    settings.automatikFreigabe = { monat: settings.usage?.monat, verbleibend: 0 }
    ctx.persist()
    renderKiBudget(container)
    announceAgentStatus('Lokale Monatsgrenze gespeichert.')
  })

  if (stand.konfiguriert) {
    const entfernen = createNode('button', 'onda-btn onda-btn--ghost onda-btn--sm', 'Lokale Grenze entfernen')
    entfernen.type = 'button'
    entfernen.addEventListener('click', () => {
      settings.kiMonatsbudgetCents = null
      settings.automatikFreigabe = { monat: settings.usage?.monat, verbleibend: 0 }
      pausierterAutomatiklauf = null
      ctx.persist()
      renderKiBudget(container)
      announceAgentStatus('Lokale Monatsgrenze entfernt.')
    })
    container.append(entfernen)
  }

  if (!stand.erreicht) {
    const text = stand.konfiguriert
      ? `${(stand.kostenCents / 100).toFixed(2)} von ${(stand.budgetCents / 100).toFixed(2)} US-Dollar geschätzt verbraucht.`
      : 'Keine zusätzliche lokale Grenze gesetzt.'
    container.append(createNode('p', 'ki-budget-status', text))
    return
  }

  container.append(createNode('p', 'ki-budget-status ki-budget-status--paused',
    `Grenze erreicht: ${(stand.kostenCents / 100).toFixed(2)} von ${(stand.budgetCents / 100).toFixed(2)} US-Dollar. `
    + 'Automatische Läufe sind pausiert; selbst gesendete Nachrichten bleiben möglich.'))
  const freigeben = createNode(
    'button',
    'onda-btn onda-btn--sm ki-budget-approve',
    stand.freigaben ? 'Ein automatischer Lauf ist freigegeben' : 'Genau einen automatischen Lauf freigeben',
  )
  freigeben.type = 'button'
  freigeben.disabled = stand.freigaben > 0
  freigeben.addEventListener('click', () => {
    gibNaechstenAutomatiklaufFrei(settings)
    ctx.persist()
    renderKiBudget(container)
    announceAgentStatus('Genau ein automatischer KI-Lauf wurde freigegeben.')
    starteBewusstFreigegebenenAutomatiklauf()
  })
  container.append(freigeben)
}

function syncThemeToggle() {
  const button = document.getElementById('themeToggle')
  if (!button) return
  const dark = document.documentElement.dataset.theme === 'dark'
  button.replaceChildren(ondaIcon(dark ? 'sun' : 'moon', { size: 18 }))
  button.setAttribute('aria-pressed', String(dark))
  const label = dark ? 'Zu hellem Erscheinungsbild wechseln' : 'Zu dunklem Erscheinungsbild wechseln'
  button.setAttribute('aria-label', label)
  button.title = label
}

function toggleTheme() {
  const settings = ctx.state.settings
  settings.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
  applySettings()
  ctx.persist()
  syncThemeToggle()
}

// Der Abschnittsname heisst wie der Abschnitt, immer. Was das Projekt gerade sein
// will, steht als stiller Satz darunter — kein zweiter Knopf, sondern eine Auskunft.
function renderProjectUnderstandingCard() {
  const card = document.getElementById('pvCard')
  const claim = document.getElementById('pvClaim')
  if (!card) return
  const project = dokumentProjekt()
  const understanding = project ? ensureProjectUnderstanding(project) : null
  const task = understanding?.task?.trim() || ''
  card.setAttribute('aria-haspopup', 'dialog')
  card.classList.toggle('is-empty', !task)
  card.textContent = 'Projektverständnis'
  // Der Leerzustand steht am Satz selbst und nicht mehr am Knopf darueber. Die Regel
  // hiess `#pvCard.is-empty + .onda-side-claim` und konnte nie greifen: #pvCard steckt
  // in .onda-side-kopf und hat gar kein naechstes Geschwisterelement — „Noch nicht
  // festgelegt" stand deshalb genauso kraeftig da wie ein wirklich gesetzter Satz.
  if (claim) {
    claim.classList.toggle('is-empty', !task)
    claim.textContent = task || 'Noch nicht festgelegt'
  }
}

function splitList(value, byLine) {
  return String(value || '').split(byLine ? /\r?\n/ : ',').map(part => part.trim()).filter(Boolean)
}

function currentAuditUi() {
  return createAuditUi({
    context: ctx,
    createNode,
    openDialog: openOndaDialog,
    getEditorJson: () => ctx.editor.getJSON(),
    download: ctx.downloadFile,
    importLocalState: ctx.importLocalState,
    deleteAllLocalData: ctx.deleteAllLocalData,
  })
}

export function openFinalAudit(opener = null) {
  const project = dokumentProjekt()
  if (!project || !ctx?.activeDoc()) return null
  return currentAuditUi().open(project, opener || document.getElementById('pvCard'))
}

// geschuetzt: dezenter Hinweis, dass dieses Feld eine bindende Nutzer-Korrektur trägt
// (siehe openProjectUnderstandingModal) — ruhiger Onda-Ton, keine Warnfarbe, kein
// Ausrufezeichen; nur ein zusätzliches, kleines Tag neben dem Feldlabel.
//
// Das Tag ist zugleich der Rueckweg: ein Klick gibt das Feld wieder fuer den Agenten
// frei. Ohne ihn waere jede Handkorrektur endgueltig -- der Mensch koennte weiter
// editieren, der Agent aber nie wieder dazulernen.
//
// Die Anzeige wird beim Tippen sofort nachgezogen, aber NUR am Tag, nie am Textfeld:
// ein Neuaufbau des Textfeldes wuerde den Cursor wegspringen lassen.
//
// kurz: ein einzeiliges Feld statt eines Textkastens. Ein Gruppenname ist eine Zeile;
// ein fuenfzeiliger Kasten dafuer laedt zu etwas ein, was gar nicht hineingehoert, und
// die Eingabetaste macht darin einen Absatz statt fertig zu sein.
function bearbeitbaresFeld(body, label, value, onCommit, { line = false, kurz = false, geschuetzt = false, onLoesen = null } = {}) {
  const row = createNode('div', 'onda-pv-field')
  const labelRow = createNode('div', 'onda-pv-label-row')
  labelRow.append(createNode('span', 'onda-pv-label', label))

  const field = createNode(kurz ? 'input' : 'textarea', 'onda-pv-input')
  if (kurz) field.type = 'text'
  const tag = createNode('button', 'onda-tag onda-tag--loesbar', 'bindend')
  tag.type = 'button'
  tag.title = 'Wieder für den Agenten freigeben'
  tag.setAttribute('aria-label', `${label}: bindend — freigeben, damit der Agent wieder anpassen darf`)

  const zeigeSchutz = an => {
    tag.hidden = !an
    field.setAttribute('aria-label', an ? `${label}, bindend` : label)
  }
  tag.addEventListener('click', () => {
    if (!onLoesen) return
    onLoesen()
    zeigeSchutz(false)
  })
  // Ohne Rueckweg gibt es kein Tag: sonst stuende ein Knopf da, der nichts tut.
  tag.hidden = true
  if (onLoesen) labelRow.append(tag)
  row.append(labelRow)

  if (!kurz) field.rows = line ? 8 : 5
  field.value = value
  if (onLoesen) zeigeSchutz(geschuetzt)
  else field.setAttribute('aria-label', label)
  field.addEventListener('input', () => { onCommit(field.value); if (onLoesen) zeigeSchutz(true) })
  row.append(field)
  body.append(row)
  return field
}

// Das Projektverstaendnis-Fenster in der Blaetter-Vorlage: links die Eintraege, rechts
// der vertiefende Text, in den hineingeschrieben werden darf.
//
// Das Erkannte ist hier einer der Eintraege. Es hatte bis zum 7. August 2026 eine
// eigene Flaeche in der Seitenleiste; die faellt mit ihr. Es ist aber kein proaktives
// Angebot, das der Agent im Chat sagen koennte, sondern ein Rueckblick auf den
// Personenspeicher — und Rueckblicke gehoeren dorthin, wo auch das Projektgedaechtnis
// liegt. Ohne diesen Umzug waeren Stimmenmerkmale, Autorentwicklung und der
// Rueckkopplungs-Block unerreichbar geworden.
let pvBlaetter = null

// label = wie der Eintrag heisst (links in der Liste, oben als Ueberschrift).
// feld  = was in das Textfeld darunter gehoert.
// Beides muss verschieden sein: bis zum 7.8.2026 stand hier zweimal derselbe Wortlaut
// untereinander — Ueberschrift "Aufgabe", sechs Pixel darunter noch einmal "Aufgabe".
// Die Struktur-Ansicht macht es vor ("Einwand" / "Text dieses Bausteins"): die Ueberschrift
// sagt, WO man ist, der Feldname sagt, WAS man schreibt. Dort steht seit dem 8.8.2026 der
// erkannte Name — und wo keiner erkannt ist, gar nichts.
const PV_FELDER = [
  { schluessel: 'task', label: 'Aufgabe', feld: 'Was dieser Text leisten soll', lese: u => u.task, schreibe: (u, wert) => { u.task = wert } },
  { schluessel: 'audience', label: 'Zielgruppe', feld: 'Für wen er geschrieben ist', lese: u => u.audience.join(', '), schreibe: (u, wert) => { u.audience = splitList(wert, false) } },
  { schluessel: 'desiredEffect', label: 'Beabsichtigte Wirkung', feld: 'Was er beim Lesen bewirken soll', lese: u => u.desiredEffect, schreibe: (u, wert) => { u.desiredEffect = wert } },
  { schluessel: 'evidenceStandard', label: 'Belegstandard', feld: 'Wie streng belegt werden muss', lese: u => u.evidenceStandard, schreibe: (u, wert) => { u.evidenceStandard = wert } },
  { schluessel: 'protectedIntentions', label: 'Geschützte Absicht', feld: 'Was unangetastet bleiben soll — eine je Zeile', zeilen: true, lese: u => u.protectedIntentions.join('\n'), schreibe: (u, wert) => { u.protectedIntentions = splitList(wert, true) } },
  { schluessel: 'openQuestions', label: 'Offene Frage', feld: 'Was noch offen ist — eine je Zeile', zeilen: true, lese: u => u.openQuestions.join('\n'), schreibe: (u, wert) => { u.openQuestions = splitList(wert, true) } },
]

function openProjectUnderstandingModal(opener) {
  const project = dokumentProjekt()
  if (!project) return
  const u = ensureProjectUnderstanding(project)
  // Jede Nutzer-Korrektur im Fenster ist bindend: der geschuetzt-Merker sorgt dafür,
  // dass die KI dieses Feld in Folge-Läufen nie mehr überschreibt (mergeVerstaendnis
  // liest ihn; verstaendnisEingabe gibt ihn über baueVerstaendnisKontext mit).
  const commit = feld => {
    markiereGeschuetzt(u, feld)
    ctx.scheduleSave()
    renderProjectUnderstandingCard()
  }
  // Gegenstueck zu commit: gibt das Feld wieder fuer den Agenten frei. Der Text bleibt
  // stehen -- nur der Schreibschutz faellt, damit der Agent dort wieder dazulernen darf.
  const loesen = feld => {
    loeseSchutz(u, feld)
    ctx.scheduleSave()
    renderProjectUnderstandingCard()
  }
  const istGeschuetzt = feld => u.geschuetzt.includes(feld)
  const memoryUi = createMemoryUi({ context: ctx, createNode, openDialog: openOndaDialog })
  const argumentUi = createArgumentUi({
    context: ctx,
    createNode,
    openDialog: openOndaDialog,
    getBlocks: () => aktuelleBloecke(),
  })
  const languageUi = createLanguageUi({
    context: ctx,
    createNode,
    openDialog: openOndaDialog,
    getBlocks: () => aktuelleBloecke(),
    applyCorrections: corrections => replaceAnchoredTexts(ctx.editor, corrections),
  })

  const werkzeuge = [
    ['memoryOpen', 'Projektgedächtnis öffnen', () => memoryUi.open(project, document.getElementById('pvCard'))],
    ['argumentOpen', 'Argumentation prüfen', () => argumentUi.open(project, document.getElementById('pvCard'))],
    ['languageOpen', 'Sprache und Wirkung prüfen', () => languageUi.open(project, document.getElementById('pvCard'))],
    ['auditOpen', 'Schlussaudit und Export öffnen', () => openFinalAudit(document.getElementById('pvCard'))],
  ]

  pvBlaetter = openOndaBlaetter({
    id: 'pvModal',
    title: 'Projektverständnis',
    opener,
    eintraege: (liste, { gewaehlt, waehle, eintrag }) => {
      const offen = gewaehlt || PV_FELDER[0].schluessel
      PV_FELDER.forEach(feld => {
        liste.append(eintrag(feld.schluessel, feld.label, {
          anriss: erweiterungAnriss(feld.lese(u)),
          gewaehlt: offen === feld.schluessel,
          onWaehle: () => waehle(feld.schluessel),
        }))
      })
      liste.append(eintrag('erkanntes', 'Erkanntes', {
        anriss: '',
        gewaehlt: offen === 'erkanntes',
        onWaehle: () => waehle('erkanntes'),
      }))
      liste.append(createNode('p', 'onda-blaetter__gruppe', 'Werkzeuge'))
      werkzeuge.forEach(([id, label, oeffne]) => {
        const knopf = createNode('button', 'onda-blaetter__eintrag', label)
        knopf.id = id
        knopf.type = 'button'
        knopf.setAttribute('aria-haspopup', 'dialog')
        knopf.addEventListener('click', oeffne)
        liste.append(knopf)
      })
    },
    tiefe: (tief, gewaehlt) => {
      const schluessel = gewaehlt || PV_FELDER[0].schluessel
      if (schluessel === 'erkanntes') {
        tief.append(createNode('h3', 'onda-blaetter__tiefe-titel', 'Erkanntes'))
        tief.append(createNode(
          'p',
          'onda-blaetter__tiefe-hinweis',
          'Was du beim Schreiben erkannt hast — je ein Satz, der beim nächsten Text wieder trägt.',
        ))
        const flaeche = createNode('div', 'onda-erk-flaeche')
        tief.append(flaeche)
        renderErkanntes(flaeche)
        return
      }
      const feld = PV_FELDER.find(kandidat => kandidat.schluessel === schluessel) || PV_FELDER[0]
      tief.append(createNode('h3', 'onda-blaetter__tiefe-titel', feld.label))
      bearbeitbaresFeld(tief, feld.feld, feld.lese(u), wert => {
        feld.schreibe(u, wert)
        commit(feld.schluessel)
        // Der Anriss links zieht mit, ohne dass rechts neu gezeichnet wird —
        // sonst spränge der Cursor bei jedem Tastendruck.
        const anriss = pvBlaetter?.panel?.querySelector(`[data-blatt-id="${feld.schluessel}"] .onda-blaetter__eintrag-anriss`)
        if (anriss) anriss.textContent = erweiterungAnriss(feld.lese(u))
      }, {
        line: Boolean(feld.zeilen),
        geschuetzt: istGeschuetzt(feld.schluessel),
        onLoesen: () => loesen(feld.schluessel),
      })
    },
  })
}

// ---------- Verständnis-Interview (Etappe A, Fähigkeit 1) ----------
// Neues Projekt: der Agent eröffnet mit genau EINER gebündelten offenen Frage
// (fester Text, kein API-Aufruf). Existiert schon Text (> 200 Zeichen), leitet
// er stattdessen per runTask('verstaendnis') einen Entwurf aus dem Text ab.
// Das Beispielprojekt bleibt Demo: dort startet nie ein Interview.
const INTERVIEW_EROEFFNUNG = 'Bevor ich beim Schreiben helfen kann, würde ich das Projekt gern verstehen: Worum soll es in diesem Text gehen — und für wen schreibst du ihn?'
const INTERVIEW_OFFLINE_TEXT = 'Agent ist offline — dein Text ist davon unberührt.'
const BUDGET_PAUSE_TEXT = 'Die lokale Monatsgrenze ist erreicht. Selbst gesendete Nachrichten bleiben möglich; unter „KI-Anschluss“ kannst du genau einen automatischen Lauf bewusst freigeben.'

function interviewMessageId(project) {
  return interviewNachrichtId(project.id)
}

function beansprucheAutomatikKosten(typ, referenz = {}) {
  const ergebnis = beansprucheAutomatiklauf(ctx?.state?.settings)
  if (!ergebnis.erlaubt) {
    pausierterAutomatiklauf = { typ, ...referenz }
    // Die normalisierte Null-Freigabe gehoert zum gespeicherten Sicherheitszustand.
    ctx?.persist()
    return ergebnis
  }
  if (ergebnis.freigabeVerbraucht) {
    pausierterAutomatiklauf = null
    ctx?.persist()
  }
  return ergebnis
}

function zeigeBudgetPause(workspace) {
  if (!workspace) return
  const monat = ctx?.state?.settings?.usage?.monat || 'aktuell'
  const id = `budget-pause-${monat}`
  let message = workspace.agent.messages.find(candidate => candidate.id === id)
  if (!message) {
    message = { id, status: 'new', earliestAt: 0, text: BUDGET_PAUSE_TEXT, thread: [] }
    workspace.agent.messages.push(message)
  } else {
    message.status = 'new'
    message.text = BUDGET_PAUSE_TEXT
  }
  announceAgentStatus(BUDGET_PAUSE_TEXT)
}

function docPlainText() {
  return aktuelleBloecke()
    .map(block => String(block.text || '').trim())
    .filter(Boolean)
    .join('\n\n')
}

export function istInterviewAktiv() {
  const project = dokumentProjekt()
  if (!project || istBeispielProjekt(project)) return false
  return istInterviewOffen(ensureProjectUnderstanding(project))
}

function ensureInterviewMessage(workspace, project) {
  const id = interviewMessageId(project)
  let message = workspace.agent.messages.find(candidate => candidate.id === id)
  if (!message) {
    message = { id, status: 'new', earliestAt: 0, text: '', thread: [] }
    workspace.agent.messages.push(message)
  }
  return message
}

// Sammelt die Quellen, aus denen onda-kontext.mjs seine Wissensbloecke baut: Textsorte und
// Stilprofil (project.languageProfile), den dokumentuebergreifenden Aussagen-Speicher
// (project.argumentModel), die anderen Texte desselben Projekts (state.docs) und das
// Gedaechtnis (state.memoryStore). Rein lesend und synchron — die Bloecke selbst entstehen
// erst im Kontext-Bauer, ohne DOM und ohne Uhr.
//
// docs traegt die VOLLSTAENDIGEN Dokumente, nicht nur Kennung und Titel. Das ist kein
// Versehen und darf nicht "aufgeraeumt" werden: onda-kontext.mjs baut daraus die
// Geschwistertexte (baueNachbartexte) und liest dafuer doc.body, doc.updated und
// doc.trashed. Ohne den Koerper saehe jede Anfrage weiterhin genau ein Dokument, und eine
// Querverbindung zwischen zwei Texten waere nicht bloss ungebaut, sondern unmoeglich.
// Gekostet wird davon nichts: welcher Teil eines Nachbartextes in den Prompt geraet und wie
// viel, entscheidet allein die Obergrenze in onda-kontext.mjs.
//
// Gefiltert wird dort, nicht hier: state.docs enthaelt die Texte ALLER Projekte samt
// Papierkorb, und die Auswahl gehoert in die pure, node-getestete Funktion.
function ondaQuellen(doc = ctx?.activeDoc(), project = dokumentProjekt(doc)) {
  if (!project) return null
  return {
    project,
    doc: doc || null,
    docs: ctx?.state?.docs || [],
    memoryStore: ctx?.state?.memoryStore || null,
  }
}

function verstaendnisEingabe(modus, nutzerText = '') {
  const project = dokumentProjekt()
  const u = ensureProjectUnderstanding(project)
  const workspace = activeWorkspace()
  const message = workspace?.agent.messages.find(candidate => candidate.id === interviewMessageId(project)) || null
  const thread = message?.thread || []
  const text = String(nutzerText || '').trim()
  // sendeInterviewAntwort haengt die aktuelle Antwort VOR diesem Aufruf bereits an
  // message.thread an (siehe dort) — hier abschneiden, sonst stuende sie doppelt im
  // Kontext: einmal als letzter Verlauf-Eintrag, einmal als eigenstaendige `anfrage`
  // (baueVerstaendnisKontext erwartet interviewVerlauf als reine Vorgeschichte).
  const bisherigerVerlauf = text && thread.length && thread[thread.length - 1]?.role === 'user'
    ? thread.slice(0, -1)
    : thread
  return baueVerstaendnisKontext({
    modus,
    verstaendnis: {
      task: u.task,
      audience: u.audience,
      desiredEffect: u.desiredEffect,
      evidenceStandard: u.evidenceStandard,
      protectedIntentions: u.protectedIntentions,
      openQuestions: u.openQuestions,
    },
    geschuetzt: [...(u.geschuetzt || [])],
    docText: docPlainText(),
    nutzerText,
    interviewVerlauf: bisherigerVerlauf.map(entry => ({ role: entry.role, text: entry.text })),
    onda: ondaQuellen(ctx?.activeDoc(), project),
  })
}

function interviewFehlerText(fehler) {
  const typ = fehler?.typ
  if (typ === 'kein-schluessel' || typ === 'offline') return INTERVIEW_OFFLINE_TEXT
  if (typ === 'ratenlimit' || typ === 'ueberlastet') return 'Der Agent ist gerade überlastet — er meldet sich, sobald es wieder geht.'
  if (typ === 'abgelehnt') return 'Der Agent hat auf diese Anfrage keine Antwort gegeben.'
  return 'Die Antwort des Agenten ist verloren gegangen. Deine Angaben sind gespeichert — versuch es gleich noch einmal.'
}

// Merged eine KI-Antwort in das Understanding, OHNE die Objekt-Identität zu
// brechen (offene Modal-Closures schreiben weiter in dasselbe Objekt).
function uebernimmVerstaendnis(project, daten) {
  const u = ensureProjectUnderstanding(project)
  Object.assign(u, mergeVerstaendnis(u, daten, u.geschuetzt))
  return u
}

function refreshProjectUnderstandingModal() {
  if (!ondaDialog || ondaDialog.panel?.id !== 'pvModal') return
  // Tippt der Nutzer gerade im Fenster, nicht neu aufbauen — seine Eingabe ist bindend.
  if (ondaDialog.panel.contains(document.activeElement)) return
  // Nachzeichnen statt neu oeffnen: sonst spraenge die Wahl links auf den ersten
  // Eintrag zurueck, waehrend jemand gerade beim sechsten steht.
  pvBlaetter?.zeichne()
}

// Duenner Aufrufer: die gesamte Entscheidung (Beispielprojekt-Sperre, offenes
// Interview, schon vorhandene Nachricht, Kostenbremse) steckt in
// planeInterviewNachricht (verstaendnis-interview.mjs, node-getestet — u.a. gegen
// genau den Fall, dass die Projektuebersicht auf ein anderes Projekt zeigt als das
// geladene Dokument). Hier wird nur noch ctx-Gebundenes eingesammelt und die
// zurueckgegebene Absicht ausgefuehrt.
function pruefeVerstaendnisInterview() {
  const doc = ctx?.activeDoc()
  const workspace = activeWorkspace()
  if (!doc || !workspace) return
  const pruefKey = `${doc.projectId}:${doc.id}`
  if (interviewPruefKey === pruefKey) return
  interviewPruefKey = pruefKey

  const plan = planeInterviewNachricht({
    doc,
    projects: ctx.state.projects,
    vorhandeneNachrichtIds: workspace.agent.messages.map(message => message.id),
    docTextLaenge: docPlainText().length,
  })
  if (plan.art === 'nichts') return
  if (plan.art === 'entwurf') {
    starteVerstaendnisEntwurf(plan.projectId, plan.docId)
    return
  }
  const message = ensureInterviewMessage(workspace, dokumentProjekt(doc))
  message.text = INTERVIEW_EROEFFNUNG
  persistWorkspace()
}

// Kleiner FNV-1a-Hash fuer Signaturen aus freiem Nutzertext — Muster wie einfacherHash
// in erweiterungslauf-model.mjs, hier lokal, weil auch der Chat-Kanal (Task 6) ihn
// braucht. Dient nur der Journal-Kennzeichnung, nicht einer Doppelbezahl-Sperre
// (der Interview-Kanal laeuft ohne einmalJeSignatur — siehe unten).
function fnvSignatur(text) {
  let hash = 2166136261
  const value = String(text || '')
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

async function starteVerstaendnisEntwurf(projectId, docId) {
  // Sperre, Buchung und Journal laufen jetzt durchs Lauf-Tor (lauf-tor.mjs) — hier
  // bleibt nur noch der fachliche Rumpf. kanalGesperrt/fuehreLaufAus ersetzen das
  // frühere interviewLaufAktiv; die Signatur wird SYNCHRON hier gebildet (vor jedem
  // await), weil docPlainText() den gerade aktiven Doc liest und das an dieser Stelle
  // im Aufruf noch derselbe Doc ist, fuer den der Lauf gedacht ist.
  if (kanalGesperrt('interview')) return
  interviewStatus = 'laeuft'
  const signatur = `${docId}:${seedBodySignature(docPlainText())}`
  await fuehreLaufAus({ kanal: 'interview', ausloeser: 'entwurf', signatur }, async ({ runTask }) => {
    // Ausserhalb des try deklariert, damit der catch-Zweig bei einem fehlgeschlagenen
    // Lauf noch weiss, fuer welches Projekt/welche Nachricht der Fehlertext sichtbar
    // gemacht werden muss (Fix-Runde 1, Finding 1).
    let project = null
    try {
      const schluesselDa = await hatSchluessel()
      if (!ctx || ctx.activeDoc()?.id !== docId) { interviewStatus = null; return }
      project = ctx.state.projects.find(candidate => candidate.id === projectId)
      const workspace = activeWorkspace()
      if (!project || !workspace) { interviewStatus = null; return }
      if (!schluesselDa) {
        // Offline-Würde: kein Entwurf möglich — die feste Eröffnungsfrage steht
        // trotzdem bereit; die Antwort darauf scheitert später ruhig per Statuszeile.
        interviewStatus = null
        const message = ensureInterviewMessage(workspace, project)
        if (!message.text) message.text = INTERVIEW_EROEFFNUNG
        persistWorkspace()
        return
      }
      const kostenfreigabe = beansprucheAutomatikKosten('verstaendnis', { projectId, docId })
      if (!kostenfreigabe.erlaubt) {
        interviewStatus = BUDGET_PAUSE_TEXT
        const message = ensureInterviewMessage(workspace, project)
        message.text = BUDGET_PAUSE_TEXT
        persistWorkspace()
        return
      }
      // Projektweite Kostenbremse (Fix-Runde 1, Finding 2): VOR dem bezahlten Aufruf
      // setzen und sofort persistieren, damit sie auch bei einem Fehlschlag gilt —
      // kein zweiter bezahlter Versuch über weitere Dokumente desselben Projekts.
      markiereEntwurfVersucht(ensureProjectUnderstanding(project))
      persistWorkspace()
      // Bereich W (Aura/Statuszeile) atmet ausschliesslich am echten Gateway-Zustand
      // (applyAuraState liest aktuellerAgentStatus().zustand === 'laeuft') — dieser
      // Aufruf ist der erste echte runTask-Aufruf im Panel, darum wird er hier gesetzt.
      setzeAgentStatus({ zustand: 'laeuft' })
      const { daten } = await runTask('verstaendnis', verstaendnisEingabe('entwurf'))
      setzeAgentStatus({ zustand: 'bereit' })
      if (!ctx) return { erfolg: true }
      uebernimmVerstaendnis(project, daten)
      interviewStatus = null
      const antwort = String(daten.antwortText || '').trim()
      if (antwort && ctx.activeDoc()?.id === docId) {
        const message = ensureInterviewMessage(activeWorkspace(), project)
        message.text = antwort
        appendThreadMessage(message.thread, 'agent', antwort, Date.now())
        announceAgentStatus(antwort)
      }
      ctx.persist()
      refreshProjectUnderstandingModal()
      return { erfolg: true }
    } catch (fehler) {
      interviewStatus = interviewFehlerText(fehler)
      setzeAgentStatus({ zustand: 'fehler', fehlerTyp: fehler?.typ })
      // Sichtbarkeit erzwingen (Fix-Runde 1, Finding 1): ohne eine existierende
      // Nachricht kehrt renderAgentWidget vor dem interviewStatus-Absatz zurück, und
      // der Fehlertext bliebe unsichtbar — bei bereits gesetztem Prüf-Gate ohne jede
      // Wiederholmöglichkeit. Der Nutzer bekommt so den ruhigen Fehlertext UND das
      // Eingabefeld; kein automatischer Retry, kein Kosten-Risiko.
      if (ctx && project && ctx.activeDoc()?.id === docId) {
        const workspace = activeWorkspace()
        if (workspace) {
          ensureInterviewMessage(workspace, project)
          persistWorkspace()
        }
      }
      return { erfolg: false, fehler: fehler?.typ }
    } finally {
      if (ctx) refreshWorkspace()
    }
  })
}

// Composer-Routing: solange istInterviewAktiv() wahr ist, gehört jede Eingabe im
// Agenten-Panel dem Interview (siehe Submit-Handler in renderAgentWidget). Anders als
// starteVerstaendnisEntwurf ist das hier KEIN automatischer, kostenpflichtiger Lauf,
// den entwurfVersuchtAm bremsen dürfte — der Nutzer hat aktiv geantwortet, das zählt
// nicht als der bezahlte Automatik-Entwurf und bleibt vom Merker unberührt.
async function sendeInterviewAntwort(message, text) {
  // Projekt VOR jedem await ueber das Dokument aufloesen: die Antwort gehoert dem
  // Projekt, fuer das sie gestellt wurde — auch wenn danach umgeblaettert wird.
  const project = dokumentProjekt()
  if (!project || kanalGesperrt('interview')) return
  appendThreadMessage(message.thread, 'user', text, Date.now())
  // Kein await zwischen dem Anhaengen und fuehreLaufAus: die Sperre selbst setzt
  // das Tor synchron beim Aufruf (lauf-tor.mjs) — hier bleibt nur noch die
  // sichtbare "laeuft"-Statuszeile, wie zuvor ohne Luecke.
  interviewStatus = 'laeuft'
  announceAgentStatus('Agent denkt nach …')
  persistWorkspace()
  refreshWorkspace()
  await fuehreLaufAus(
    { kanal: 'interview', ausloeser: 'antwort', signatur: fnvSignatur(text) },
    async ({ runTask }) => {
      try {
        // Bereich W (Aura/Statuszeile) atmet ausschliesslich am echten Gateway-Zustand
        // (applyAuraState liest aktuellerAgentStatus().zustand === 'laeuft') — wie in
        // starteVerstaendnisEntwurf muss jeder echte runTask-Aufruf ihn setzen (U-5-Aura).
        setzeAgentStatus({ zustand: 'laeuft' })
        const { daten } = await runTask('verstaendnis', verstaendnisEingabe('antwort', text))
        setzeAgentStatus({ zustand: 'bereit' })
        if (!ctx) return { erfolg: true }
        uebernimmVerstaendnis(project, daten)
        interviewStatus = null
        const antwort = String(daten.antwortText || '').trim()
        if (antwort) {
          appendThreadMessage(message.thread, 'agent', antwort, Date.now())
          message.text = antwort
          announceAgentStatus(antwort)
        }
        // Sind task + audience + desiredEffect jetzt gefüllt, ist das Interview
        // abgeschlossen — der nächste Composer-Beitrag geht in den normalen Chat.
        ctx.persist()
        refreshProjectUnderstandingModal()
        return { erfolg: true }
      } catch (fehler) {
        interviewStatus = interviewFehlerText(fehler)
        setzeAgentStatus({ zustand: 'fehler', fehlerTyp: fehler?.typ })
        announceAgentStatus(interviewStatus)
        return { erfolg: false, fehler: fehler?.typ }
      } finally {
        if (ctx) refreshWorkspace()
      }
    },
  )
}

// Hier schwebte ein Plus am linken Rand des Absatzes, in dem gerade geschrieben wurde.
// Es oeffnete das Menue "Art des Textbausteins". Jakob am 7. August 2026: "das plus
// ergibt zudem ueberhaupt keinen sinn fuer mich. ich verstehe nicht was es
// symbolisieren soll und was der nutzen ist."
//
// Er hat recht: ein Plus verspricht "hier kommt etwas dazu", sagt aber nicht was, und
// es schwebte auch dann, wenn niemand etwas einfuegen wollte. Fuer die haeufigen Faelle
// gibt es ohnehin den kuerzeren Weg — Tiptaps StarterKit macht aus "## " eine
// Ueberschrift und aus "> " ein Zitat, ohne dass man ein Menue oeffnet.
//
// Das Menue selbst (openInsertMenu/insertBlock) BLEIBT. Es bekommt seinen Platz dort,
// wo Bausteine hingehoeren: in der Struktur-Ansicht, wo Jakob "auch neue Bausteine
// hinzufuegen" koennen will. Nur der schwebende Knopf ist fort.
//
// Mit dem Knopf faellt auch der Tipp-Zustand fort (markTyping, isTyping, typingTimer).
// Er hatte genau eine Aufgabe: dem Plus beim Tippen die Klasse is-typing zu geben, mit
// der es verblasste. Wann zuletzt getippt wurde, fuehrt ohnehin initiativeInputState —
// eine Wahrheit darueber genuegt.

function initiativeInputState(docId = ctx?.activeDoc()?.id) {
  if (!controller || !docId) return null
  if (!controller.inputByDocument.has(docId)) {
    controller.inputByDocument.set(docId, {
      generation: 0,
      lastInputAt: Number.NaN,
      boundaryAt: Number.NaN,
      boundaryGeneration: null,
      satzendeAt: Number.NaN,
      satzendeGeneration: null,
      pendingUpdateGeneration: null,
      pendingBoundary: false,
      pendingSatzende: false,
    })
  }
  return controller.inputByDocument.get(docId)
}

function clearAgentInitiativeTimer() {
  if (agentInitiativeTimer) clearTimeout(agentInitiativeTimer)
  agentInitiativeTimer = null
}

function invalidateAgentInitiative({ requireNewInput = false } = {}) {
  clearAgentInitiativeTimer()
  clearHinweislaufTimer()
  clearErweiterungslaufTimer()
  clearMomentTimer()
  pendingParagraphBoundaryDocId = null
  const state = initiativeInputState()
  if (!state) return
  state.generation += 1
  state.boundaryAt = Number.NaN
  state.boundaryGeneration = null
  state.satzendeAt = Number.NaN
  state.satzendeGeneration = null
  state.pendingBoundary = false
  state.pendingSatzende = false
  state.pendingUpdateGeneration = null
  if (requireNewInput) state.lastInputAt = Number.NaN
}

function recordRealEditorInput({ paragraphBoundary = false, satzende = false } = {}) {
  const docId = ctx?.activeDoc()?.id
  const state = initiativeInputState(docId)
  if (!state || controller.activeDocumentId !== docId) return
  // Wer wieder schreibt, schaut nicht mehr auf.
  momentVonHand = false
  clearAgentInitiativeTimer()
  state.generation += 1
  state.lastInputAt = Date.now()
  state.boundaryAt = Number.NaN
  state.boundaryGeneration = null
  state.pendingUpdateGeneration = state.generation
  state.pendingBoundary = paragraphBoundary && !isComposing
  // Das Satzende zaehlt NUR fuer den Moment, nie fuer den Hinweislauf. Wuerde es
  // pendingBoundary mitsetzen, liefe nach jedem Punkt 300 ms spaeter ein bezahlter
  // Lauf an -- aus einer Frage des Hinschauens waere eine Frage der Rechnung geworden.
  state.pendingSatzende = satzende && !isComposing
}

function completeRealEditorUpdate() {
  const state = initiativeInputState()
  if (!state || state.pendingUpdateGeneration !== state.generation) return false
  const at = Date.now()
  state.lastInputAt = at
  if (state.pendingBoundary && !isComposing) {
    state.boundaryAt = at
    state.boundaryGeneration = state.generation
  }
  if ((state.pendingSatzende || state.pendingBoundary) && !isComposing) {
    state.satzendeAt = at
    state.satzendeGeneration = state.generation
  }
  state.pendingUpdateGeneration = null
  state.pendingBoundary = false
  state.pendingSatzende = false
  scheduleAgentInitiative()
  return true
}

// Befehl+Z nimmt eine gerade uebernommene Anmerkung zurueck. Nur dann — steht das
// eigene Schreiben zuletzt, gehoert die Taste dem Text und wir fassen sie nicht an.
//
// Der Griff muss vollstaendig sein: undoLast() setzt die Aenderung im Text SELBST
// zurueck. Liesse man das Ereignis weiterlaufen, machte Tiptaps eigene Historie
// denselben Schritt ein zweites Mal — ein Tastendruck, zwei Ruecknahmen.
function handleAnmerkungRueckgaengig(event) {
  if (!letzteAenderungWarAnmerkung) return false
  if (event.isComposing || isComposing) return false
  if (event.shiftKey || event.altKey) return false
  if (!event.metaKey && !event.ctrlKey) return false
  if (String(event.key).toLowerCase() !== 'z') return false

  const workspace = activeWorkspace()
  const verworfen = Boolean(workspace?.lastAnnotationRejection)
  if (!verworfen && !workspace?.undoStack?.length) return false

  event.preventDefault()
  event.stopPropagation()
  letzteAenderungWarAnmerkung = false

  // Eine verworfene Anmerkung wurde zuletzt entschieden, eine uebernommene zuletzt
  // eingebaut. undoLatestRejection() macht ihre eigene Meldung und ihren eigenen
  // Neuaufbau — deshalb hier nur zurueck.
  if (verworfen) {
    undoLatestRejection()
    return true
  }

  const result = annotationController?.undoLast()
  announceAgentStatus(result?.ok
    ? 'Die Anmerkung wurde zurückgenommen.'
    : result?.reason === 'stale-target'
      ? 'Seit der Änderung wurde weitergeschrieben. Zurücknehmen hat deshalb nichts verändert.'
      : 'Es gibt nichts zurückzunehmen.')
  refreshWorkspace()
  return true
}

function handleEditorKeyDown(event) {
  if (handleAnmerkungRueckgaengig(event)) return
  if (
    event.key !== 'Enter'
    || event.isComposing
    || isComposing
    || event.shiftKey
    || event.metaKey
    || event.ctrlKey
    || event.altKey
  ) return
  pendingParagraphBoundaryDocId = ctx?.activeDoc()?.id || null
  recordRealEditorInput({ paragraphBoundary: true })
}

function handleBeforeInput(event) {
  // Wer wieder schreibt, meint mit Befehl+Z sein eigenes Schreiben. Ab hier gehoert die
  // Taste wieder dem Text (siehe handleAnmerkungRueckgaengig).
  //
  // Bewusst GANZ oben und nicht in recordRealEditorInput(): das hat Schranken, hinter
  // denen es aussteigt (kein Zustand, anderes Dokument). Hinter einer davon bliebe die
  // Taste bei der Anmerkung haengen, obwohl laengst weitergeschrieben wurde.
  letzteAenderungWarAnmerkung = false

  const docId = ctx?.activeDoc()?.id || null
  const paragraphBoundary = !isComposing && (
    event?.inputType === 'insertParagraph'
    || pendingParagraphBoundaryDocId === docId
  )
  // Ein EREIGNIS, kein Zustand: geprueft wird das gerade eingegebene Zeichen, nicht,
  // ob der Text zufaellig auf einen Punkt endet. Sonst zaehlte jeder weitere
  // Tastendruck hinter dem Punkt erneut als Satzende (Lehre aus dem Prototyp #4).
  const satzende = !isComposing
    && event?.inputType === 'insertText'
    && istSatzende(event.data)
  pendingParagraphBoundaryDocId = null
  recordRealEditorInput({ paragraphBoundary, satzende })
}

function startComposition() {
  isComposing = true
  pendingParagraphBoundaryDocId = null
  recordRealEditorInput()
}

function endComposition() {
  isComposing = false
  recordRealEditorInput()
  completeRealEditorUpdate()
}

// Welcher Moment ist gerade erreicht (momente-model.mjs)? Liest nur die ohnehin
// gefuehrten Eingabezeiten -- kein eigener Zustand, damit es keine zweite Wahrheit
// darueber gibt, wann zuletzt getippt wurde.
function momentJetzt(docId = ctx?.activeDoc()?.id) {
  const inputState = initiativeInputState(docId)
  // Eine Grenze ist beides: das Absatzende (Enter) und das Satzende (Punkt, Frage-,
  // Ausrufezeichen). Beide sind der Augenblick, in dem ein Gedanke fertig ist.
  const anGrenze = Boolean(
    inputState
    && inputState.satzendeGeneration === inputState.generation
    && Number.isFinite(inputState.satzendeAt),
  )
  return aktuellerMoment({
    jetzt: Date.now(),
    lastInputAt: inputState?.lastInputAt,
    anGrenze,
    editorSichtbar: editorViewIsVisibleFor(docId),
    vonHand: momentVonHand,
    letzteEntscheidungAt,
  })
}

function clearMomentTimer() {
  if (momentTimer) { clearTimeout(momentTimer); momentTimer = null }
}

// Plant die naechste Neuzeichnung auf den naechsten Schwellenwert. Ohne das bliebe
// ein zurueckgehaltener Hinweis liegen, bis zufaellig etwas anderes neu zeichnet.
function planeMomentwechsel() {
  clearMomentTimer()
  const docId = ctx?.activeDoc()?.id || null
  const inputState = initiativeInputState(docId)
  if (!docId || !inputState || !Number.isFinite(inputState.lastInputAt)) return
  if (!editorViewIsVisibleFor(docId)) return

  // Ab derselben Regung rechnen wie aktuellerMoment, sonst plant der Zeitgeber die
  // Neuzeichnung auf einen Moment, der noch gar nicht erreicht ist — und der naechste
  // Hinweis bliebe liegen, bis zufaellig etwas anderes neu zeichnet.
  const entschieden = Number.isFinite(letzteEntscheidungAt) && letzteEntscheidungAt > inputState.lastInputAt
  const ruhe = Date.now() - (entschieden ? letzteEntscheidungAt : inputState.lastInputAt)
  const anGrenze = !entschieden
    && inputState.boundaryGeneration === inputState.generation
    && Number.isFinite(inputState.boundaryAt)
  const schwellen = [anGrenze ? INNEHALTEN_AN_GRENZE_MS : INNEHALTEN_MS, AUFSCHAUEN_MS]
  const naechste = schwellen.find(schwelle => schwelle > ruhe)
  if (naechste === undefined) return

  const generation = inputState.generation
  momentTimer = setTimeout(() => {
    momentTimer = null
    const aktuell = initiativeInputState(docId)
    if (!aktuell || aktuell.generation !== generation) return
    if (!editorViewIsVisibleFor(docId)) return
    renderLocalFinding()
    renderErweiterungen()
    planeErweiterungslauf()
    planeMomentwechsel()
  }, Math.max(24, naechste - ruhe))
}

function visiblePassageFindingRecords(doc, blocks) {
  ensureReasoningModel(doc)
  const moment = momentJetzt(doc?.id)
  const workspace = activeWorkspace()

  // Der Stift ist abgelegt: nichts wird gezeigt — weder die Anmerkung noch der Punkt
  // im Rand. Das ist die EINE Sache, die das eine verbliebene Bedienelement tut
  // (docs/PHILOSOPHIE.md §1).
  //
  // Hier und nicht in der Steuerung, weil der Aufrufer sonst daran vorbeigreift:
  // currentPassageFinding() faellt auf records[0] zurueck, wenn die Steuerung nichts
  // liefert. "Ruhig" hat deshalb nie wirklich ausgeblendet, sondern nur die Steuerung
  // stummgeschaltet, waehrend die Anmerkung weiter danebenstand.
  //
  // Ohne die frueh gesetzte Grenze wuerde ausserdem merkeGezeigt() unten mitlaufen und
  // Anmerkungen als "schon gezeigt" vermerken, die niemand gesehen hat.
  if (workspace?.quietAnnotations) return []

  const records = []
  for (const finding of doc.findings.filter(candidate => candidate?.status === 'open')) {
    // Hier stand ein Filter nach Arbeitsmodus: im Modus "Text" blieben die fuenf
    // Notiz-Arten unsichtbar (ausformulieren, buendeln, nachfrage, ordnen, aufgreifen)
    // und umgekehrt. Umgeschaltet wurde in der Anmerkungsleiste — die es nicht mehr
    // gibt (docs/PHILOSOPHIE.md §1). Der Filter musste mit: ohne Umschalter waere er
    // eine Falltuer, die die Haelfte aller Arten fuer immer verschluckt.
    //
    // Es passt auch zum Grundsatz. Wer neben dir schreibt, fuehrt keine zwei getrennten
    // Listen; ihm faellt auf, was ihm auffaellt. Ob es eine Rechtschreibung ist oder
    // eine Nachfrage, entscheidet nicht, OB du es siehst.
    // Hier stand ein zweiter Filter: ein Unterdrueckungsspeicher hielt Hinweise
    // zurueck, die man einmal "in diesem Text nicht mehr" oder "als persoenliche
    // Praeferenz" verworfen hatte. Beides ist fort (Issue #38) — eine Anmerkung gilt
    // einmal und wird nie zur Regel. Damit hatte der Speicher keinen Erzeuger mehr und
    // filterte fuer immer gegen eine leere Liste.
    //
    // Der Rhythmus folgt der Art, nicht dem Kanal (momente-model.mjs): eine
    // Formulierung darf sofort erscheinen, eine Strukturfrage erst beim Aufschauen.
    // Zurueckgehalten heisst nur zurueckgehalten -- der Hinweis bleibt bestehen und
    // erscheint, sobald sein Moment da ist. Was einmal stand, bleibt stehen.
    if (!darfErscheinen(artVon(finding), moment, schonGezeigt(doc?.id, finding?.id))) continue
    if (finding?.placement !== 'passage' || !finding.target) continue
    const hadBlockId = Boolean(finding.blockId)
    const placement = resolveFindingPlacement(finding, blocks)
    if (placement.kind !== 'anchored' && placement.kind !== 'stale') continue
    const migrated = !hadBlockId && Boolean(finding.blockId)
    // Das Etikett {art, moment} stammt aus dem Lauf-Tor-Zweig (#12): das erste Erscheinen
    // einer Karte wandert ins Journal, damit die Momente spaeter kalibriert werden koennen.
    // HEADs Sammelform bleibt — main zeigt mehrere Anmerkungen, nicht mehr genau eine.
    merkeGezeigt(doc?.id, finding.id, { art: artVon(finding), moment })
    records.push({ finding, block: placement.block, placementKind: placement.kind, migrated })
  }
  return records
}

function currentPassageFinding(doc, blocks) {
  const records = visiblePassageFindingRecords(doc, blocks)
  const chosen = annotationController?.current(momentJetzt(doc?.id)) || records[0]?.finding || null
  const record = records.find(candidate => candidate.finding.id === chosen?.id)
  // Erst hier steht fest, welcher Hinweis wirklich auf den Schirm kommt — und nur der
  // darf als gezeigt gelten. Der Vermerk sorgt dafuer, dass eine Karte, die man gerade
  // liest, nicht verschwindet, sobald man wieder tippt (siehe darfErscheinen).
  if (record?.finding?.id) merkeSichtbar(doc?.id, record.finding.id)
  return record || { finding: null, block: null, placementKind: null, migrated: records.some(item => item.migrated) }
}

function unplacedPassageFindings(doc, blocks) {
  const queue = getFindingQueue(doc)
  const moment = momentJetzt(doc?.id)
  return [queue.current, ...queue.upcoming]
    .filter(finding => darfErscheinen(artVon(finding), moment, schonGezeigt(doc?.id, finding?.id)))
    .filter(finding => finding?.placement === 'passage' && finding.target)
    .map(finding => ({ finding, placement: resolveFindingPlacement(finding, blocks) }))
    .filter(item => item.placement.kind === 'ambiguous' || item.placement.kind === 'unplaced')
}

function localSurfaceIds(findingId) {
  const token = String(findingId || 'finding').replace(/[^a-zA-Z0-9_-]/g, '-')
  return {
    summary: `local-finding-summary-${token}`,
    detail: `local-finding-detail-${token}`,
    suggestion: `local-finding-suggestion-${token}`,
    dialogue: `local-finding-dialogue-${token}`,
  }
}

function requestLocalSummaryFocus(findingId) {
  localSummaryFocusRequest = findingId || null
}

function findingConsequence(finding) {
  if (finding.consequence) return finding.consequence
  if (finding.folge) return finding.folge
  if (finding.action) return 'Eine Änderung kann die Aussage präzisieren; deine jetzige Fassung bleibt bis zu einer bewussten Entscheidung erhalten.'
  return 'Du kannst den Gedanken prüfen, ohne den Schreibfluss oder die aktuelle Fassung zu verlieren.'
}

function appendDetailRow(detail, label, text) {
  const row = createNode('div', 'local-finding-detail-row')
  row.append(
    createNode('span', 'local-finding-detail-label', label),
    createNode('p', 'local-finding-detail-text', text),
  )
  detail.append(row)
}

function appendThreadMessageNode(parent, message) {
  const item = createNode('div', `agent-message is-${message.role === 'user' ? 'user' : 'agent'}`)
  item.dataset.messageId = message.id
  item.append(
    createNode('span', 'agent-message-role', message.role === 'user' ? 'Du' : 'Agent'),
    createNode('p', 'agent-message-text', message.text),
  )
  parent.append(item)
}

function ensureLocalThread(finding) {
  if (!Array.isArray(finding.thread)) finding.thread = []
  if (!finding.thread.length) {
    appendThreadMessage(
      finding.thread,
      'agent',
      `Ich würde diese Stelle gern genauer verstehen: ${finding.short}`,
      Date.now(),
    )
  }
  return finding.thread
}

function renderLocalDialogue(finding) {
  const workspace = activeWorkspace()
  if (!finding || workspace?.localThreadFindingId !== finding.id) return null

  const dialogue = createNode('section', 'local-dialogue')
  dialogue.id = localSurfaceIds(finding.id).dialogue
  dialogue.setAttribute('aria-label', 'Gespräch zu dieser Textstelle')
  dialogue.append(createNode('p', 'local-dialogue-title', 'Gespräch zu dieser Stelle'))

  const messages = createNode('div', 'local-dialogue-messages')
  ensureLocalThread(finding).forEach(message => appendThreadMessageNode(messages, message))

  const form = createNode('form', 'agent-chat-form')
  const input = createNode('input', 'agent-chat-input')
  input.type = 'text'
  input.placeholder = 'Antworten …'
  input.setAttribute('aria-label', 'Dem Agenten zu dieser Stelle antworten')
  const send = createNode('button', 'agent-chat-send')
  send.append(ondaIcon('arrow-right', { size: 18 }))
  send.type = 'submit'
  send.title = 'Senden'
  send.setAttribute('aria-label', 'Nachricht senden')
  send.disabled = kanalGesperrt('chat') // Sperre wohnt im Tor (Task 6), nicht mehr in einem lokalen Feld
  form.append(input, send)
  form.addEventListener('submit', event => {
    event.preventDefault()
    const text = input.value.trim()
    if (!text || kanalGesperrt('chat')) return
    // Echter, gestreamter Chat mit Finding-Kontext (Bereich C, Task C-3) — die Kulisse ist weg.
    input.value = ''
    appendThreadMessage(finding.thread, 'user', text, Date.now())
    ctx.persist()
    refreshWorkspace()
    sendeLocalChat(finding, text)
  })

  dialogue.append(messages, form)
  scrollThreadToLatest(messages)
  return dialogue
}

function changedWordParts(before, after) {
  const tokenize = value => String(value || '').match(/\s+|[\p{L}\p{N}]+|[^\s\p{L}\p{N}]+/gu) || []
  const oldTokens = tokenize(before)
  const newTokens = tokenize(after)
  let prefix = 0
  while (prefix < oldTokens.length && prefix < newTokens.length && oldTokens[prefix] === newTokens[prefix]) prefix += 1

  let suffix = 0
  while (
    suffix < oldTokens.length - prefix
    && suffix < newTokens.length - prefix
    && oldTokens[oldTokens.length - 1 - suffix] === newTokens[newTokens.length - 1 - suffix]
  ) suffix += 1

  return {
    prefix: oldTokens.slice(0, prefix).join(''),
    oldChanged: oldTokens.slice(prefix, oldTokens.length - suffix).join(''),
    newChanged: newTokens.slice(prefix, newTokens.length - suffix).join(''),
    suffix: suffix ? oldTokens.slice(oldTokens.length - suffix).join('') : '',
  }
}

function appendSuggestionVersion(parent, label, prefix, changed, suffix, changeClass) {
  const row = createNode('div', 'suggestion-version')
  row.append(createNode('span', 'suggestion-version-label', label))
  const text = createNode('p', 'suggestion-version-text')
  if (prefix) text.append(createNode('span', 'suggestion-unchanged', prefix))
  if (changed) text.append(createNode('span', changeClass, changed))
  if (suffix) text.append(createNode('span', 'suggestion-unchanged', suffix))
  row.append(text)
  parent.append(row)
}

function findingActionButton(label, iconName, handler) {
  const button = createNode('button', 'suggestion-action')
  button.append(ondaIcon(iconName, { size: 18 }))
  button.type = 'button'
  button.title = label
  button.setAttribute('aria-label', label)
  button.addEventListener('click', event => {
    event.stopPropagation()
    handler()
  })
  return button
}

function clearFindingWorkspaceState(workspace, findingId) {
  if (workspace.expandedFindingId === findingId) workspace.expandedFindingId = null
  if (workspace.suggestionFindingId === findingId) workspace.suggestionFindingId = null
  if (workspace.localThreadFindingId === findingId) workspace.localThreadFindingId = null
  if (workspace.evidenceFindingId === findingId) workspace.evidenceFindingId = null
  if (workspace.editingFinding?.findingId === findingId) workspace.editingFinding = null
  if (workspace.riskConfirmationFindingId === findingId) {
    workspace.riskConfirmationFindingId = null
    workspace.riskReason = ''
  }
}

function reconcilePersistedEditingFinding() {
  const doc = ctx?.activeDoc()
  const workspace = activeWorkspace()
  const editing = workspace?.editingFinding
  if (!doc || !editing) return { kind: 'none' }

  const finding = doc.findings.find(candidate => candidate.id === editing.findingId)
  if (!finding || finding.status !== 'open') {
    const stale = { ...editing, status: 'stale', staleReason: 'finding-unavailable' }
    const changed = editing.status !== stale.status || editing.staleReason !== stale.staleReason
    workspace.editingFinding = stale
    if (changed) ctx.persist()
    return { kind: 'stale', editingFinding: stale }
  }

  const result = reconcileEditingFinding(editing, aktuelleBloecke())
  const nextEditing = result.editingFinding
  const changed = editing.status !== nextEditing.status || editing.staleReason !== nextEditing.staleReason
  workspace.editingFinding = nextEditing
  if (changed) ctx.persist()
  return result
}

function showLocalFeedbackError(findingId) {
  localFeedbackError = {
    findingId,
    message: 'Diese Stelle ist nicht eindeutig. Ich habe nichts geändert.',
  }
  const suggestion = elements().localLayer?.querySelector('.local-suggestion')
  if (!suggestion) return
  suggestion.querySelector('.local-finding-error')?.remove()
  const error = createNode('p', 'local-finding-error', localFeedbackError.message)
  error.setAttribute('role', 'status')
  suggestion.append(error)
  scheduleLocalPosition(suggestion.dataset.blockId)
}

function textRanges(textblock, blockPos, target) {
  let text = ''
  const positions = []
  textblock.descendants((node, relativePos) => {
    if (node.isText) {
      text += node.text
      for (let index = 0; index < node.text.length; index += 1) {
        positions.push(blockPos + 1 + relativePos + index)
      }
      return
    }
    if (node.isInline && node.isLeaf) {
      text += '\uFFFC'
      positions.push(blockPos + 1 + relativePos)
    }
  })

  const ranges = []
  let index = text.indexOf(target)
  while (index >= 0) {
    const from = positions[index]
    const last = positions[index + target.length - 1]
    if (Number.isInteger(from) && Number.isInteger(last)) ranges.push({ from, to: last + 1 })
    index = text.indexOf(target, index + 1)
  }
  return ranges
}

function targetDocumentRange(blockId, target) {
  if (!blockId || !target) return null
  const ranges = []
  ctx.editor.state.doc.forEach((topNode, topPos) => {
    if (topNode.attrs.blockId !== blockId) return
    if (topNode.isTextblock) {
      ranges.push(...textRanges(topNode, topPos, target))
      return
    }
    topNode.descendants((node, relativePos) => {
      if (!node.isTextblock) return
      ranges.push(...textRanges(node, topPos + 1 + relativePos, target))
      return false
    })
  })
  return ranges.length === 1 ? ranges[0] : null
}

function decideAndAdvance(finding, decision, { refresh = true, restoreFocus = true } = {}) {
  const doc = ctx.activeDoc()
  const workspace = activeWorkspace()
  // Ueber einen Hinweis zu entscheiden ist eine Regung wie ein Tastendruck — und
  // beginnt die Wartezeit von vorn. Bis zum 8.8.2026 stand hier `momentVonHand =
  // true`, was den Moment sofort auf 'aufschauen' hob: jedes Wegklicken gab damit
  // den naechsten Hinweis frei, und es entstand eine Kette, die lief, solange offene
  // Hinweise da waren. Ein Zuruecksetzen ist nicht noetig — sobald wieder getippt
  // wird, ist lastInputAt juenger und der Zeitpunkt hier ohne Wirkung.
  letzteEntscheidungAt = Date.now()
  // Angenommen heisst: das hat gestimmt. Dann traegt auch das Prinzip dahinter.
  // Verworfenes wandert NICHT in den Speicher -- ein zurueckgewiesener Hinweis ist
  // keine Erkenntnis, und ihn trotzdem zu behalten waere das Gegenteil von
  // "Autorentscheidungen sind bindend".
  if (decision?.kind === 'accept') {
    const dimension = finding.kiKategorie === 'quelle' ? 'beleg' : (finding.kiKategorie || 'allgemein')
    merkeErkanntes(finding.muster, 'hinweis', finding.target || '', dimension)
  }
  decideFinding(doc, finding.id, decision)
  const project = dokumentProjekt(doc)
  const recorded = doc.decisions.at(-1)
  if (project?.argumentModel && recorded) {
    project.argumentModel = analyzeArgumentImpact({
      model: project.argumentModel,
      projectId: project.id,
      change: {
        kind: 'decision',
        entityId: recorded.id,
        textId: doc.id,
        blockId: finding.blockId || finding.anchor?.blockId || null,
        fingerprint: `${recorded.id}:${recorded.kind}:${recorded.outcome}:${recorded.at}`,
        reason: 'Eine Nutzerentscheidung zu einem Texthinweis hat die argumentative Grundlage verändert.',
      },
      at: recorded.at,
    }).model
  }
  clearFindingWorkspaceState(workspace, finding.id)
  localFeedbackError = null
  ctx.scheduleSave()
  if (refresh) refreshWorkspace()
  if (restoreFocus) {
    requestAnimationFrame(() => {
      const nextSurface = elements().localLayer?.querySelector('.onda-annotation')
      const nextAction = nextSurface?.querySelector('button, input')
      if (nextAction && !elements().localLayer?.classList.contains('is-paused')) {
        nextAction.focus({ preventScroll: true })
      } else {
        ctx.editor.view.focus()
      }
    })
  }
  return recorded
}

// Eine Anmerkung gilt fuer eine Stelle in einem Text, EINMAL (Jakob, 8.8.2026;
// Issue #38). Hier stand bis dahin die Frage "Was soll Onda daraus lernen?" mit drei
// Knoepfen, von denen zwei aus einer einzelnen Anmerkung eine Dauerregel machten
// ("in diesem Text nicht mehr", "als persoenliche Praeferenz"). Das war ein
// Kategorienfehler — und gefaehrlich obendrein: wer einmal stumm schaltete, bekam
// spaeter einen echten Belegmangel nicht mehr zu sehen.
//
// Was sich je nach Anmerkung unterscheidet, ist nicht die REICHWEITE, sondern die
// BEDEUTUNG des Verwerfens. Einen fehlenden Beleg zu verwerfen heisst, ein
// wissenschaftliches Risiko anzunehmen — das wird benannt (Risiko-Tafel). Einen
// Stilvorschlag zu verwerfen heisst: nein danke — das geschieht wortlos.
function handleSuggestionReject(finding) {
  const workspace = activeWorkspace()
  if (!workspace) return
  if (istRisikoAnnahme(finding)) {
    workspace.riskConfirmationFindingId = finding.id
    workspace.riskReason = ''
    riskConfirmationFocusRequest = true
    ctx.scheduleSave()
    refreshWorkspace()
    return
  }
  commitAnnotationRejection(finding)
}

// Der eine Weg, auf dem eine Verwerfung festgeschrieben wird — aus der Anmerkung
// heraus (wortlos) wie von der Risiko-Tafel (mit Begruendung).
function commitAnnotationRejection(finding, reason = '') {
  const doc = ctx.activeDoc()
  const workspace = activeWorkspace()
  if (!doc || !workspace || finding.status !== 'open') return
  const decision = decideAndAdvance(
    finding,
    { kind: 'reject', reason },
    { refresh: false, restoreFocus: false },
  )
  workspace.lastAnnotationRejection = {
    findingId: finding.id,
    decisionId: decision?.id || null,
  }
  // Auch das Verwerfen ist eine Entscheidung ueber eine Anmerkung. Befehl+Z nimmt sie
  // zurueck, solange nichts anderes dazwischenkam — frueher lag dafuer ein Link
  // "Entscheidung zuruecknehmen" in der Anmerkungsleiste.
  letzteAenderungWarAnmerkung = true
  refreshWorkspace()
  // Die Ansage folgt der Bedeutung, nicht der Reichweite: ein angenommenes Risiko
  // wird als solches benannt, alles andere bleibt eine schlichte Ablage.
  announceAgentStatus(decision?.outcome === 'risk-accepted'
    ? 'Das wissenschaftliche Risiko ist bewusst angenommen und mit deiner Begründung vermerkt.'
    : 'Diese Anmerkung wurde verworfen. Ein ähnlicher Hinweis darf später wieder erscheinen.')
}

function undoLatestRejection() {
  const doc = ctx?.activeDoc()
  const workspace = activeWorkspace()
  const latest = workspace?.lastAnnotationRejection
  if (!doc || !workspace || !latest) return false
  const finding = doc.findings.find(candidate => candidate.id === latest.findingId)
  if (finding) {
    finding.status = 'open'
    delete finding.decidedAt
  }
  if (latest.decisionId) doc.decisions = doc.decisions.filter(decision => decision.id !== latest.decisionId)
  workspace.activeAnnotationId = latest.findingId
  workspace.lastAnnotationRejection = null
  ctx.scheduleSave()
  refreshWorkspace()
  announceAgentStatus('Die Verwerfung wurde zurückgenommen. Der Hinweis ist wieder offen.')
  return true
}

function authorizedFindingBlock(finding) {
  if (!finding?.blockId) return null
  return resolveFindingBlock(finding, aktuelleBloecke())
}

function handleSuggestionOwnVersion(finding) {
  const block = authorizedFindingBlock(finding)
  const range = block ? targetDocumentRange(finding.blockId, finding.target) : null
  const editingFinding = block ? createEditingFindingState(finding, block) : null
  if (!range || !editingFinding) {
    showLocalFeedbackError(finding.id)
    return
  }
  const workspace = activeWorkspace()
  workspace.activeBlockId = finding.blockId
  workspace.suggestionFindingId = null
  workspace.editingFinding = editingFinding
  localFeedbackError = null
  ctx.scheduleSave()
  refreshWorkspace()
  requestAnimationFrame(() => {
    ctx.editor.commands.setTextSelection(range)
    ctx.editor.view.focus()
  })
}

function handleSuggestionAccept(finding) {
  const block = authorizedFindingBlock(finding)
  const applied = block
    ? replaceFindingTarget(ctx.editor, finding.target, finding.action, finding.blockId)
    : false
  if (!applied) {
    showLocalFeedbackError(finding.id)
    return
  }
  decideAndAdvance(finding, { kind: 'accept', appliedText: finding.action })
}

function completeOwnVersion(expectedFindingId) {
  const doc = ctx.activeDoc()
  const workspace = activeWorkspace()
  const editing = workspace?.editingFinding
  if (!doc || !editing || editing.findingId !== expectedFindingId) return

  const finding = doc.findings.find(candidate => candidate.id === editing.findingId)
  if (!finding || finding.status !== 'open') return
  const completion = completeEditingFinding(editing, aktuelleBloecke())
  if (completion.kind !== 'accept') return

  workspace.editingFinding = null
  decideAndAdvance(finding, { kind: 'accept', appliedText: completion.appliedText })
}

function cancelOwnVersion(expectedFindingId) {
  const workspace = activeWorkspace()
  const editing = workspace?.editingFinding
  if (!editing || editing.findingId !== expectedFindingId) return
  workspace.editingFinding = null
  localFeedbackError = null
  ctx.scheduleSave()
  refreshWorkspace()
  ctx.editor.view.focus()
}

function renderOwnVersionStatus(finding, blocks) {
  const workspace = activeWorkspace()
  const editing = workspace?.editingFinding
  if (!editing || editing.findingId !== finding.id) return null

  const completion = completeEditingFinding(editing, blocks)
  const status = createNode('section', 'own-version-status')
  status.setAttribute('aria-label', 'Eigene Fassung in Arbeit')
  status.append(createNode('strong', 'own-version-title', 'Eigene Fassung in Arbeit'))
  const message = completion.kind === 'accept'
    ? 'Deine Änderung bleibt offen, bis du sie bewusst abschließt.'
    : completion.kind === 'unchanged'
      ? 'Noch keine Änderung. Der Abschluss wird erst danach verfügbar.'
      : 'Die Textstelle hat sich weiter verändert. Bitte prüfe sie vor dem Abschluss.'
  status.append(createNode('p', 'own-version-message', message))

  const actions = createNode('div', 'own-version-actions')
  const cancel = findingActionButton(
    'Eigene Fassung abbrechen',
    'x',
    () => cancelOwnVersion(finding.id),
  )
  const complete = findingActionButton(
    'Eigene Fassung abschliessen',
    'check',
    () => completeOwnVersion(finding.id),
  )
  complete.disabled = completion.kind !== 'accept'
  actions.append(cancel, complete)
  status.append(actions)
  return status
}

function renderIntegrityRiskConfirmation(finding) {
  const workspace = activeWorkspace()
  if (workspace?.riskConfirmationFindingId !== finding.id) return null

  const confirmation = createNode('section', 'integrity-risk-confirmation')
  confirmation.setAttribute('aria-label', 'Wissenschaftliches Risiko bewusst annehmen')
  confirmation.append(
    createNode('strong', 'integrity-risk-title', 'Wissenschaftliches Risiko bewusst annehmen'),
    createNode('p', 'integrity-risk-consequence', findingConsequence(finding)),
  )
  // Die Begruendung ist PFLICHT (Jakob, 8.8.2026; Issue #38). Ein Pflichtfeld ist sonst
  // ein schlechtes Mittel — es erzeugt "xxx". Hier traegt es, weil es einen freien
  // Ausweg gibt: Abbrechen bleibt immer bedienbar und kostet nichts. Die Wahl lautet
  // damit nicht "tippe irgendwas oder komm nicht weiter", sondern "benenne den Grund —
  // oder nimm das Risiko eben nicht an". Ein wissenschaftliches Risiko anzunehmen, ohne
  // sagen zu koennen warum, SOLL unbequem sein.
  const label = createNode('label', 'integrity-risk-reason-label', 'Begründung')
  const reason = createNode('textarea', 'integrity-risk-reason')
  reason.rows = 2
  reason.value = workspace.riskReason || ''
  reason.required = true
  reason.setAttribute('aria-label', 'Begründung für die bewusste Risikoannahme')
  label.append(reason)

  const actions = createNode('div', 'integrity-risk-actions')
  const cancel = createNode('button', 'integrity-risk-cancel', 'Abbrechen')
  cancel.type = 'button'
  cancel.addEventListener('click', () => {
    workspace.riskConfirmationFindingId = null
    workspace.riskReason = ''
    requestLocalSummaryFocus(finding.id)
    refreshWorkspace()
    persistWorkspace()
  })
  const confirm = createNode('button', 'integrity-risk-confirm', 'Wissenschaftliches Risiko bewusst annehmen')
  confirm.type = 'button'
  confirm.addEventListener('click', () => {
    // Doppelt gesichert: der Knopf ist ohnehin gesperrt, aber ein Klick per Tastatur
    // oder aus einem Vorlesegeraet darf keine leere Begruendung durchlassen.
    const begruendung = String(workspace.riskReason || '').trim()
    if (!begruendung) return
    workspace.riskConfirmationFindingId = null
    workspace.riskReason = ''
    commitAnnotationRejection(finding, begruendung)
  })

  // Leerzeichen sind keine Begruendung — sonst waere die Pflicht mit der Leertaste
  // umgangen. Der Zustand wird bei jedem Tastendruck neu gesetzt, ohne Neuzeichnen:
  // ein Rerender waere hier ein Fokusraub mitten im Satz.
  const pflegeSperre = () => {
    confirm.disabled = !String(workspace.riskReason || '').trim()
  }
  reason.addEventListener('input', () => {
    workspace.riskReason = reason.value
    pflegeSperre()
    persistWorkspace()
  })
  pflegeSperre()

  actions.append(cancel, confirm)
  // Der Ausweg muss zu SEHEN sein, nicht bloss vorhanden. Wer nicht begruenden kann,
  // soll erkennen, dass Abbrechen der vorgesehene Weg ist — sonst fuehlt sich das
  // Pflichtfeld wie eine Sackgasse an, und genau daraus entsteht das "xxx".
  confirmation.append(
    label,
    createNode(
      'p',
      'integrity-risk-hint',
      'Ohne Begründung lässt sich das Risiko nicht annehmen. Brich ab, dann bleibt die Anmerkung offen.',
    ),
    actions,
  )

  if (riskConfirmationFocusRequest) {
    riskConfirmationFocusRequest = false
    requestAnimationFrame(() => reason.focus({ preventScroll: true }))
  }
  return confirmation
}

function renderSuggestion(finding, blockId) {
  const workspace = activeWorkspace()
  if (!finding?.action || workspace?.suggestionFindingId !== finding.id) return null

  const suggestion = createNode('section', 'local-suggestion')
  suggestion.id = localSurfaceIds(finding.id).suggestion
  suggestion.dataset.blockId = blockId
  suggestion.setAttribute('aria-label', 'Alternative Fassung')

  const parts = changedWordParts(finding.target, finding.action)
  const versions = createNode('div', 'suggestion-versions')
  appendSuggestionVersion(versions, 'Bisher', parts.prefix, parts.oldChanged, parts.suffix, 'suggestion-old-change')
  appendSuggestionVersion(versions, 'Neue Fassung', parts.prefix, parts.newChanged, parts.suffix, 'suggestion-new-change')

  const actions = createNode('div', 'suggestion-actions')
  actions.append(
    findingActionButton('Verwerfen', 'x', () => handleSuggestionReject(finding)),
    findingActionButton('Eigene Fassung schreiben', 'edit', () => handleSuggestionOwnVersion(finding)),
    findingActionButton('Übernehmen', 'check', () => handleSuggestionAccept(finding)),
  )
  suggestion.append(versions, actions)
  const riskConfirmation = renderIntegrityRiskConfirmation(finding)
  if (riskConfirmation) suggestion.append(riskConfirmation)

  if (localFeedbackError?.findingId === finding.id) {
    const error = createNode('p', 'local-finding-error', localFeedbackError.message)
    error.setAttribute('role', 'status')
    suggestion.append(error)
  }
  return suggestion
}

function annotationDocumentSnapshot(doc = ctx?.activeDoc()) {
  const title = document.getElementById('title')?.value ?? doc?.title ?? ''
  const blocks = aktuelleBloecke().map(block => ({
    id: block.id,
    type: block.type,
    role: block.role,
    text: block.text,
  }))
  const sources = Array.isArray(doc?.annotationSources) ? doc.annotationSources : []
  return { title, blocks, sources }
}

function cloneData(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value))
}

function applyAnnotationPlan(finding, plan, doc) {
  switch (plan.kind) {
    case 'replace-range':
      return replaceFindingTarget(ctx.editor, finding.target, finding.action, finding.blockId || null)
    case 'insert-at':
      return finding.insertionText
        ? insertAnchoredText(ctx.editor, {
          blockId: finding.blockId || null,
          target: finding.target,
          text: finding.insertionText,
          position: finding.insertionPosition || 'after',
        })
        : replaceFindingTarget(ctx.editor, finding.target, finding.action, finding.blockId || null)
    case 'replace-many':
      return applyAnchoredReplacements(ctx.editor, finding.targets.map(target => ({
        blockId: target.blockId,
        target: target.text,
        replacement: typeof target.replacement === 'string' ? target.replacement : finding.action,
      })))
    case 'move-block':
      return moveTopLevelBlock(ctx.editor, {
        fromBlockId: finding.move?.fromBlockId || finding.blockId,
        toBlockId: finding.move?.toBlockId,
        position: finding.move?.position || 'after',
      })
    case 'insert-heading':
      return Boolean(insertSemanticHeading(ctx.editor, {
        afterBlockId: finding.heading?.afterBlockId || finding.blockId,
        blockId: finding.heading?.id,
        text: finding.heading?.text || finding.action,
        level: finding.heading?.level || 2,
      }))
    case 'replace-title': {
      const title = document.getElementById('title')
      if (!title) return false
      title.value = finding.action
      doc.title = finding.action
      ctx.autoGrowTitle()
      return true
    }
    case 'attach-source': {
      const source = Array.isArray(finding.sources) ? finding.sources[0] : null
      if (!source) return false
      if (!Array.isArray(doc.annotationSources)) doc.annotationSources = []
      doc.annotationSources.push(cloneData(source))
      return true
    }
    default:
      return false
  }
}

function applySemanticFinding(finding, { refresh = false, restoreFocus = false } = {}) {
  const doc = ctx?.activeDoc()
  if (!doc || finding?.status !== 'open') return { ok: false, reason: 'finding-unavailable' }
  const before = annotationDocumentSnapshot(doc)
  const plan = planAnnotationOperation(finding, before)
  if (!plan.ok) return plan
  const validation = validateAnnotationOperation(plan, annotationDocumentSnapshot(doc))
  if (!validation.ok) return validation

  const editorBefore = cloneData(ctx.editor.getJSON())
  const sourcesBefore = cloneData(doc.annotationSources || [])
  const titleBefore = document.getElementById('title')?.value || ''
  if (!applyAnnotationPlan(finding, plan, doc)) return { ok: false, reason: 'apply-failed' }

  const editorAfter = cloneData(ctx.editor.getJSON())
  const sourcesAfter = cloneData(doc.annotationSources || [])
  const titleAfter = document.getElementById('title')?.value || ''
  const decision = decideAndAdvance(
    finding,
    { kind: 'accept', appliedText: finding.action || finding.insertionText || '' },
    { refresh, restoreFocus },
  )
  return {
    ...plan,
    ok: true,
    docId: doc.id,
    editorBefore,
    editorAfter,
    sourcesBefore,
    sourcesAfter,
    titleBefore,
    titleAfter,
    decisionId: decision?.id || null,
  }
}

function undoSemanticOperation(operation) {
  const doc = ctx?.activeDoc()
  if (!doc || operation?.docId !== doc.id) return { ok: false, reason: 'wrong-document' }
  if (JSON.stringify(ctx.editor.getJSON()) !== JSON.stringify(operation.editorAfter)) {
    return { ok: false, reason: 'stale-target' }
  }
  if ((document.getElementById('title')?.value || '') !== operation.titleAfter) {
    return { ok: false, reason: 'stale-title' }
  }
  if (JSON.stringify(doc.annotationSources || []) !== JSON.stringify(operation.sourcesAfter || [])) {
    return { ok: false, reason: 'stale-sources' }
  }

  ctx.editor.commands.setContent(cloneData(operation.editorBefore), false)
  const title = document.getElementById('title')
  if (title) title.value = operation.titleBefore
  doc.title = operation.titleBefore
  doc.annotationSources = cloneData(operation.sourcesBefore || [])
  const finding = doc.findings.find(candidate => candidate.id === operation.findingId)
  if (finding) {
    finding.status = 'open'
    delete finding.decidedAt
  }
  if (operation.decisionId) {
    doc.decisions = doc.decisions.filter(decision => decision.id !== operation.decisionId)
  }
  activeWorkspace().activeAnnotationId = operation.findingId || null
  ctx.autoGrowTitle()
  ctx.scheduleSave()
  return { ok: true, inverse: invertAnnotationOperation(operation) }
}

function acceptSemanticFinding(finding) {
  const operation = applySemanticFinding(finding)
  if (!operation.ok) {
    showLocalFeedbackError(finding.id)
    refreshWorkspace()
    return operation
  }
  annotationController?.pushUndo(operation)
  letzteAenderungWarAnmerkung = true
  refreshWorkspace()
  // Zurueck an den Text. Frueher lag hier der Rueckgaengig-Knopf der Anmerkungsleiste
  // dazwischen; die Leiste ist fort (docs/PHILOSOPHIE.md §1), und der Text ist ohnehin
  // der bessere Ort — von dort aus nimmt Befehl+Z die Aenderung zurueck.
  requestAnimationFrame(() => (
    elements().localLayer?.querySelector('.onda-annotation button, .onda-annotation input')
      || ctx.editor.view.dom
  ).focus({ preventScroll: true }))
  announceAgentStatus('Änderung übernommen. Befehl+Z nimmt sie zurück.')
  return operation
}

function replyToAnnotation(finding, text) {
  if (!text || kanalGesperrt('chat')) return
  ensureLocalThread(finding)
  appendThreadMessage(finding.thread, 'user', text, Date.now())
  ctx.persist()
  refreshWorkspace()
  sendeLocalChat(finding, text)
}

// Der andere Stift (docs/PHILOSOPHIE.md §1). Das EINZIGE Bedienelement fuer
// Anmerkungen, das uebrig ist. Es kann genau zwei Dinge: sagen, dass Anmerkungen da
// sind, und sie aus- und einblenden.
//
// Was es ausdruecklich NICHT tut: zaehlen. "0 Fehler · 1 Empfehlung · 0 Geschmack" war
// eine Punktetafel, und eine Punktetafel hat ein Ziel — sie auf null bringen. Wer neben
// dir schreibt, sagt nicht, wie viele Anmerkungen er noch hat.
//
// Fuer die Augen also nur ein Stift. Fuer Vorlesegeraete der volle Wortlaut: wer nicht
// sieht, dass jemand mitschreibt, muss es gesagt bekommen. Die Zurueckhaltung ist eine
// Frage der Augen, nicht der Zugaenglichkeit.
function renderAnnotationPresence() {
  const doc = ctx?.activeDoc()
  const workspace = activeWorkspace()
  const zeichen = document.getElementById('annotationPresence')
  if (!zeichen || !doc || !workspace) return

  const offen = (Array.isArray(doc.findings) ? doc.findings : []).filter(finding => finding?.status === 'open')
  const summary = annotationSummary(offen)

  // Kein Anlass, kein Zeichen. Ein Stift, der nichts anzustreichen hat, liegt nicht
  // sichtbar herum.
  zeichen.hidden = summary.total === 0
  if (zeichen.hidden) return

  if (!zeichen.firstChild) zeichen.append(ondaIcon('edit', { size: 18 }))

  const sichtbar = !workspace.quietAnnotations
  zeichen.setAttribute('aria-pressed', String(sichtbar))
  const wortlaut = bilanzVorlesetext(summary)
  zeichen.setAttribute('aria-label', sichtbar
    ? `${wortlaut}. Anmerkungen ausblenden.`
    : `${wortlaut}. Anmerkungen einblenden.`)
  zeichen.title = sichtbar ? 'Anmerkungen ausblenden' : 'Anmerkungen einblenden'
}

function scheduleLocalPosition(blockId) {
  if (localPositionFrame) cancelAnimationFrame(localPositionFrame)
  queueMicrotask(() => {
    if (localDecoratedBlockId === blockId) positionLocalSurface(blockId)
  })
  localPositionFrame = requestAnimationFrame(() => {
    positionLocalSurface(blockId)
    localPositionFrame = requestAnimationFrame(() => {
      localPositionFrame = null
      positionLocalSurface(blockId)
    })
  })
}

function positionLocalSurface(blockId) {
  if (!ctx || !controller) return
  const ui = elements()
  const block = blockElement(blockId)
  const selectorId = escapedSelectorValue(blockId)
  const local = ui.localLayer?.querySelector(`.onda-annotation[data-block-id="${selectorId}"]`)
  if (!ui.localLayer || !block || !local) {
    setLocalFindingDecoration(blockId, 0)
    return
  }

  const layerRect = ui.localLayer.getBoundingClientRect()
  const blockRect = block.getBoundingClientRect()
  const scrollRect = ui.scroll?.getBoundingClientRect()
  if (layerRect.width <= 0 || blockRect.width <= 0) return
  const gutter = 16
  // Wunschbreite und Mindestbreite sind zwei verschiedene Dinge. Bis zum 8.8.2026 stand
  // hier nur die Wunschbreite, und danebenstehen hiess: 340px oder gar nicht. Bei 1280px
  // Fensterbreite bleiben rechts vom Absatz 312px — zu wenig fuer die Schwelle, also fiel
  // die Anmerkung unter den Text und spannte ueber dessen volle Breite (DESIGN-01,
  // Issue #31: gemessen x=288 Breite=680, identisch mit der Textspalte).
  //
  // Der Text schrumpft nie (docs/PHILOSOPHIE.md): die Schreibspalte behaelt ihre Breite,
  // die Nebenflaeche passt sich an. Also wird die Anmerkung schmaler, wenn der Rand
  // schmaler ist — und faellt erst darunter, wenn nicht einmal die Mindestbreite passt.
  // Unter 1040px bleibt es beim Darunter: dort ist kein Rand mehr, den man teilen koennte.
  const sideWidth = 340
  const minSideWidth = 260
  const availableRight = layerRect.right - blockRect.right
  const below = window.matchMedia('(max-width: 1040px)').matches || availableRight < minSideWidth + 42
  const localWidth = below
    ? Math.max(0, Math.min(blockRect.width, layerRect.width - gutter * 2))
    : Math.min(sideWidth, availableRight - 42)

  local.classList.toggle('is-below', below)
  // Korrektur und Einfuegung sind in der Vorlage KEINE Karten: die eine ist eine
  // Zeile, die andere waechst mit ihrem Vorschlag. Presst man sie auf
  // Kartenbreite, bricht "alt → neu" auf drei Zeilen um und sieht wieder aus wie
  // das, was sie nicht sein soll. Sie bekommen deshalb nur eine Obergrenze.
  const kompakt = local.classList.contains('aura-corr__pop') || local.classList.contains('aura-ins__pop')
  if (kompakt) {
    local.style.width = ''
    local.style.maxWidth = `${Math.max(localWidth, below ? localWidth : sideWidth + 120)}px`
  } else {
    local.style.maxWidth = ''
    local.style.width = `${localWidth}px`
  }
  local.style.left = `${below ? Math.max(gutter, blockRect.left - layerRect.left) : blockRect.right - layerRect.left + 34}px`
  local.style.top = `${below ? blockRect.bottom - layerRect.top + 14 : blockRect.top - layerRect.top}px`
  local.hidden = Boolean(scrollRect && (blockRect.bottom < scrollRect.top || blockRect.top > scrollRect.bottom))

  // Danebenstehen heisst am Absatz ausgerichtet -- aber nie ueber den Bildrand hinaus.
  // Eine hohe Anmerkung reichte sonst unten heraus, und weil die Flaeche nicht rollt, war
  // ihr letzter Knopf unerreichbar. Bei der Risiko-Tafel (#38) ist das der Abbrechen-Knopf
  // — also genau der Ausweg, der ihr Pflichtfeld ueberhaupt vertretbar macht. Gemessen am
  // 08.08.2026 auf 640px Fensterhoehe: Abbrechen lag bei 644–676, die Tafel selbst ist nur
  // 550px hoch. Sie haette also gepasst; sie wurde nur zu tief angesetzt.
  //
  // Nur schieben, nicht schrumpfen: Passt die Flaeche ins Sichtfeld, rutscht sie so weit
  // hoch wie noetig. Passt sie nicht, bleibt sie am Absatz — dann ist Hochschieben keine
  // Rettung, sondern nur eine andere Art, oben abzuschneiden.
  if (!below) {
    const sichtOben = scrollRect ? Math.max(0, scrollRect.top) : 0
    const sichtUnten = scrollRect ? Math.min(window.innerHeight, scrollRect.bottom) : window.innerHeight
    const hoehe = local.getBoundingClientRect().height
    const rand = 12
    if (hoehe > 0 && hoehe + rand * 2 <= sichtUnten - sichtOben) {
      const gewuenscht = Math.min(Math.max(blockRect.top, sichtOben + rand), sichtUnten - rand - hoehe)
      if (Math.abs(gewuenscht - blockRect.top) > 0.5) {
        local.style.top = `${gewuenscht - layerRect.top}px`
      }
    }
  }

  const localRect = local.getBoundingClientRect()
  const feedbackBottom = below ? localRect.bottom : blockRect.bottom

  // Luft unter der Anmerkung, damit sie den naechsten Absatz nicht beruehrt. Frueher
  // war das die Hoehe des Plus-Knopfes plus Abstand; ohne ihn ein fester Wert in
  // derselben Groessenordnung (44px Trefferflaeche + 2px).
  const touchTriggerClearance = 46
  const spacing = feedbackBottom > blockRect.bottom
    ? feedbackBottom - blockRect.bottom + (below ? touchTriggerClearance : 14)
    : 0
  setLocalFindingDecoration(blockId, Math.min(MAX_LOCAL_SUGGESTION_SPACING, spacing))
}

function renderLocalFinding() {
  const ui = elements()
  const doc = ctx.activeDoc()
  const workspace = activeWorkspace()
  if (!ui.localLayer || !doc || !workspace) return
  const previous = ui.localLayer.querySelector('.onda-annotation')
  const previousFindingId = previous?.dataset.findingId || previous?.dataset.annotationKind || null
  const inputState = captureInputState(ui.localLayer, '.aura-dialogue__input')

  const blocks = aktuelleBloecke()
  const resolution = currentPassageFinding(doc, blocks)
  const finding = resolution.finding
  const blockId = resolution.block?.id || null
  const isStale = resolution.placementKind === 'stale'
  if (resolution.migrated) ctx.scheduleSave()

  if (localFeedbackError && localFeedbackError.findingId !== finding?.id) localFeedbackError = null

  // Vor jeder Entscheidung ueber die Verzierung: gilt die Anmerkung dem ganzen Absatz?
  aktuelleAnmerkungGestalt = finding ? gestaltFuerFinding(finding) : 'keine'
  aktuelleAnmerkungIstAbsatzweit = aktuelleAnmerkungGestalt === 'absatz'
  aktuelleAnmerkungZiel = String(finding?.target || '')
  // Fail-closed wie ueberall: nur ein Ziel, das WIRKLICH ein anderer Baustein im
  // aktuellen Dokument ist, wird zur Marke. Fehlt es oder zeigt es auf einen
  // Baustein, den es nicht mehr gibt, entsteht keine — die Anmerkung bleibt lesbar,
  // sie behauptet nur kein Wohin, das der Text nicht hergibt.
  aktuellesZiel = ortswechselZiel(finding, blocks, blockId)

  if (
    localDecoratedDocId !== doc.id
    || localDecoratedFindingId !== finding?.id
    || localDecoratedBlockId !== blockId
  ) {
    localDecoratedDocId = doc.id
    localDecoratedFindingId = finding?.id || null
    setLocalFindingDecoration(blockId, 0, true, finding || null)
  }

  ui.localLayer.replaceChildren()
  if (!finding || !blockId) return
  const presentation = resolveAnnotationPresentation(finding)
  const callbacks = {
    onAccept: presentation.operation && !isStale ? acceptSemanticFinding : null,
    onDismiss: handleSuggestionReject,
    onSecondary: finding.action && !isStale ? handleSuggestionOwnVersion : null,
    secondaryLabel: 'Eigene Fassung',
    onReply: replyToAnnotation,
  }
  if (presentation.form === 'dialogue') ensureLocalThread(finding)
  const surface = renderAnnotation(
    isStale ? { ...finding, fixtureState: 'stale', short: 'Textstelle verändert' } : finding,
    callbacks,
  )
  surface.dataset.findingId = finding.id
  surface.dataset.blockId = blockId
  const ownVersion = renderOwnVersionStatus(finding, blocks)
  if (ownVersion) surface.append(ownVersion)
  const riskConfirmation = renderIntegrityRiskConfirmation(finding)
  if (riskConfirmation) surface.append(riskConfirmation)
  if (localFeedbackError?.findingId === finding.id) {
    const error = createNode('p', 'local-finding-error', localFeedbackError.message)
    error.setAttribute('role', 'status')
    surface.append(error)
  }
  ui.localLayer.append(surface)
  if (ui.localLayer.classList.contains('is-paused')) {
    setLocalFindingDecoration(blockId, 0)
    return
  }
  positionLocalSurface(blockId)
  scheduleLocalPosition(blockId)
  if (localSummaryFocusRequest === finding.id) {
    localSummaryFocusRequest = null
    surface.querySelector('button, input')?.focus()
  } else if (previousFindingId === finding.id && inputState) {
    restoreInputState(surface.querySelector('.aura-dialogue__input'), inputState)
  }
}

function applyAuraState() {
  const orb = elements().agentPresence
  if (!orb) return
  const workspace = activeWorkspace()
  // Quelle echt: Die Aura atmet nur, wenn wirklich ein Gateway-Task laeuft —
  // nicht mehr bloss, weil das Panel offen ist (die Attrappen-Quelle ist weg).
  const laeuft = aktuellerAgentStatus().zustand === 'laeuft'
  const unseen = hasUnseenInitiative(workspace)
  orb.classList.toggle('is-thinking', laeuft)
  orb.classList.toggle('is-quiet', !laeuft)
  orb.classList.toggle('has-unseen', unseen)
  orb.setAttribute(
    'aria-label',
    unseen ? 'Agentengespräch öffnen (neue Anmerkung)' : 'Agentengespräch öffnen',
  )
}

// Prueft die Schluessel-Lage und setzt den ruhigen Grundzustand des Agenten.
// Laufende Tasks werden nie ueberschrieben (Bereich W setzt 'laeuft'/'fehler').
async function pruefeAgentVerbindung() {
  let vorhanden = false
  try {
    vorhanden = await hatSchluessel()
  } catch {
    vorhanden = false
  }
  if (aktuellerAgentStatus().zustand === 'laeuft') return
  setzeAgentStatus(vorhanden ? { zustand: 'bereit' } : { zustand: 'offline' })
}

// Ruhige Statuszeile im Agenten-Panel: offline / Lauf aktiv / Fehler.
// Ersetzt nur die Kinder des Containers — nie Modals, nie Fokusraub.
function renderAgentStatuszeile() {
  const host = document.getElementById('agentStatusline')
  if (!host) return
  const zeile = statuszeileFuer(aktuellerAgentStatus())
  host.replaceChildren()
  host.hidden = !zeile
  if (!zeile) return
  if (zeile.aura) {
    const orb = createNode('span', 'onda-aura onda-aura--xs is-thinking')
    orb.setAttribute('aria-hidden', 'true')
    host.append(orb)
  }
  host.append(createNode('span', 'agent-statusline-text', zeile.text))
  if (zeile.knopf === 'einstellungen') {
    const oeffnen = createNode('button', 'onda-btn onda-btn--ghost onda-btn--sm', 'Einstellungen öffnen')
    oeffnen.type = 'button'
    oeffnen.addEventListener('click', event => openKiSettingsDialog(event.currentTarget))
    host.append(oeffnen)
  }
}

function activeAgentMessage(workspace) {
  const messages = workspace.agent.messages
  const selected = messages.find(message => message.id === workspace.agent.activeMessageId)
  const message = selected
    || messages.find(candidate => candidate.status === 'new' && !workspace.agent.dismissedIds.includes(candidate.id))
    || messages[messages.length - 1]
    || null
  if (message) workspace.agent.activeMessageId = message.id
  return message
}

function closeAgentWidget({ dismiss = true, restoreFocus = true } = {}) {
  const workspace = activeWorkspace()
  if (!workspace?.agent.open) return false
  const message = activeAgentMessage(workspace)
  if (dismiss && message) dismissAgentMessage(workspace, message.id)
  else workspace.agent.open = false
  if (restoreFocus) agentPresenceFocusRequest = true
  refreshWorkspace()
  persistWorkspace()
  return true
}

function renderUnplacedFindingList() {
  const doc = ctx?.activeDoc()
  if (!doc) return null
  const items = unplacedPassageFindings(doc, aktuelleBloecke())
  if (!items.length) return null

  const section = createNode('section', 'unplaced-findings')
  section.append(createNode('strong', 'unplaced-findings-title', 'Hinweise ohne sichere Textstelle'))
  items.forEach(({ finding, placement }) => {
    const item = createNode('article', 'unplaced-finding')
    item.dataset.findingId = finding.id
    item.append(
      createNode('span', 'unplaced-finding-kind', placement.kind === 'ambiguous' ? 'Mehrere mögliche Stellen' : 'Textstelle nicht auffindbar'),
      createNode('p', 'unplaced-finding-text', finding.short),
    )
    section.append(item)
  })
  return section
}

// Gleicher Text wie fuer das Verstaendnis-Interview (docPlainText, siehe dort) — nur unter
// dem Namen, den der Chat-Kontext und (modulintern, Task C-3) die Randkarten-Gespraeche
// erwarten. Bewusst KEIN zweiter Weg, den Dokumenttext zu lesen.
function dokumentText() {
  return docPlainText()
}

function chatNachrichtenTextKnoten(messageId) {
  const selectorId = escapedSelectorValue(messageId)
  return document.querySelector(`.agent-message[data-message-id="${selectorId}"] .agent-message-text`)
}

// Streamt EINE Agenten-Antwort in den übergebenen Thread: die Nachricht entsteht beim
// ersten Delta (per refreshWorkspace, damit der DOM-Knoten überhaupt existiert), wächst
// danach gedrosselt (~50 ms) per direktem Text-Update — nie per Voll-Rerender, damit der
// Fokus im Eingabefeld unangetastet bleibt und der Editor bedienbar bleibt. Modulintern
// auch für Task C-3 (Randkarten-Gespräch) gedacht — deshalb der doppelte Container-Selektor
// in scrollThreadToLatest weiter unten.
// Fix-Runde 1, Finding 2 (Important): jeder echte runTask-Aufruf muss setzeAgentStatus
// setzen (Bereich W/Aura atmet ausschliesslich am echten Gateway-Zustand) — Vorbild:
// starteVerstaendnisEntwurf/sendeInterviewAntwort (dieselbe Datei), versucheHinweislauf
// (hinweislauf-model.mjs). fuehreChatLauf setzt 'laeuft'/'bereit'/'fehler' hier vollstaendig
// SELBST, weil es auch direkt (ohne sendeAgentenChat/fuehreChatVorgangAus) aufgerufen wird —
// modulintern fuer Task C-3 (Randkarten-Gespräch, keine Verdichtung dort).
//
// Fix-Runde 1, Finding 1 (Critical): erzeugt KEIN eigenes Sperr-Objekt mehr, sondern
// uebernimmt ein von sendeAgentenChat bereits gesetztes (chatStream ist zu diesem
// Zeitpunkt schon non-null, siehe dort) — bei einem direkten Aufruf (C-3) erzeugt es weiterhin
// selbst eins. Zwei verschiedene Sperr-Objekte fuer denselben Lauf waren die Ueberschreib-
// Luecke, durch die ein dritter Submit moeglich wurde.
//
// Tor-Anschluss (Task 6): runTask kommt jetzt als DRITTER Parameter vom Lauf-Tor
// (fuehreLaufAus' laufFn, siehe sendeAgentenChat/sendeLocalChat) statt aus dem modulweiten
// Import — die Sperre selbst wohnt im Tor (kanalGesperrt('chat')), hier bleibt chatStream nur
// noch fuer den Streaming-Zustand. Der Rueckgabewert ({erfolg:true} bzw. {erfolg:false,
// fehler}) reicht bis zu fuehreChatVorgangAus (chat-kontext.mjs) und von dort als
// laufFn-Ergebnis ins Tor, das daraus den Journal-Eintrag 'geliefert'/'fehler' bildet
// (bewerteLaufErgebnis, lauf-tor.mjs).
async function fuehreChatLauf(thread, kontext, runTask) {
  const lauf = chatStream || { agentMessage: null, puffer: '', flushTimer: null }
  chatStream = lauf
  const flush = () => {
    lauf.flushTimer = null
    if (!lauf.agentMessage) return
    lauf.agentMessage.text = lauf.puffer
    const node = chatNachrichtenTextKnoten(lauf.agentMessage.id)
    if (!node) return
    node.textContent = lauf.puffer
    scrollThreadToLatest(node.closest('.agent-widget-messages, .local-dialogue-messages'))
  }
  try {
    setzeAgentStatus({ zustand: 'laeuft' })
    const { daten } = await runTask('chat', kontext, {
      // Netzabriss-Prüfung (Issue #17): wiederholt der Verteiler einen mitten im
      // Stream abgerissenen Lauf, beginnt die Antwort von vorn — der Puffer muss
      // leer sein, sonst klebt der Text des abgerissenen Versuchs davor.
      // Die halbe Nachricht wird dabei ENTFERNT, nicht nur geleert: eine leere
      // Nachricht im Thread wuerde die naechste Thread-Normalisierung
      // (normalizeThreadInPlace laeuft bei jedem Rerender) still herausfiltern —
      // lauf.agentMessage waere dann ein verwaister Verweis, und die fertige
      // Antwort des zweiten Versuchs kaeme nie im gespeicherten Thread an.
      // Nach dem Entfernen baut der onDelta-Zweig unten die Nachricht beim
      // ersten Delta des zweiten Versuchs sauber neu auf.
      onNeustart: () => {
        lauf.puffer = ''
        if (lauf.flushTimer) { clearTimeout(lauf.flushTimer); lauf.flushTimer = null }
        if (lauf.agentMessage) {
          const index = thread.indexOf(lauf.agentMessage)
          if (index >= 0) thread.splice(index, 1)
          lauf.agentMessage = null
          refreshWorkspace()
        }
      },
      onDelta: text => {
        lauf.puffer += String(text || '')
        if (!lauf.agentMessage) {
          // Fix-Runde 2, Finding 4: appendThreadMessage wirft bei leerem/reinem
          // Whitespace-Text (workspace-model.mjs, gewollt fuer den allgemeinen Fall). Der
          // allererste Delta-Chunk kann aber leer oder Whitespace-only sein, bevor sichtbarer
          // Text ankommt -- ohne diese Absicherung wuerde genau dieser Wurf im Transport
          // (agent-transport.mjs) als Netzfehler ('offline') fehlklassifiziert und einen
          // bereits bezahlten Lauf erneut auslösen. Einfach auf mehr Text warten, statt zu werfen.
          if (!lauf.puffer.trim()) return
          lauf.agentMessage = appendThreadMessage(thread, 'agent', lauf.puffer)
          refreshWorkspace()
          return
        }
        if (!lauf.flushTimer) lauf.flushTimer = setTimeout(flush, CHAT_UI_DROSSEL_MS)
      },
    })
    setzeAgentStatus({ zustand: 'bereit' })
    if (lauf.flushTimer) clearTimeout(lauf.flushTimer)
    const antwort = typeof daten === 'string' && daten.trim() ? daten : lauf.puffer
    if (!antwort.trim()) return { erfolg: true }
    if (lauf.agentMessage) lauf.agentMessage.text = antwort
    else appendThreadMessage(thread, 'agent', antwort)
    announceAgentStatus(antwort)
    return { erfolg: true }
  } catch (fehler) {
    if (lauf.flushTimer) clearTimeout(lauf.flushTimer)
    setzeAgentStatus({ zustand: 'fehler', fehlerTyp: fehler?.typ })
    if (fehler?.typ === 'abgebrochen') return { erfolg: false, fehler: 'abgebrochen' }
    const meldung = chatFehlerText(fehler)
    if (lauf.agentMessage) lauf.agentMessage.text = meldung
    else appendThreadMessage(thread, 'agent', meldung)
    announceAgentStatus(meldung)
    return { erfolg: false, fehler: fehler?.typ }
  } finally {
    chatStream = null
    ctx?.persist()
    refreshWorkspace()
  }
}

// Baut den Chat-Kontext aus dem Live-Zustand und startet fuehreChatLauf — orchestriert ueber
// fuehreChatVorgangAus (chat-kontext.mjs, Fix-Runde 1) UND, aussenherum, ueber das Lauf-Tor
// (lauf-tor.mjs, Task 6): fuehreLaufAus prueft/setzt kanalGesperrt('chat') SYNCHRON vor jedem
// await und reicht dem laufFn das einzig legale runTask — fuehreChatVorgangAus'
// laeuftBereits gibt darum nur noch konstant false zurueck (das Tor hat den Kanal bereits
// geprueft und gesperrt), sperreSetzen pflegt nur noch chatStream (Streaming-Zustand) +
// refreshWorkspace. doc/project werden VOR dem Tor-Aufruf gelesen (reiner, synchroner Zugriff
// ohne Risiko) und in den Callbacks weiterverwendet, damit chatte() IMMER fuehreChatLauf
// erreicht — kein frueher Return mehr, der die Sperre/den Status haengen lassen koennte.
// Kein einmalJeSignatur: jede Chat-Frage ist gewollt, auch eine wortgleiche Wiederholung.
//
// Der Chat selbst ist ueberall echt, auch im Beispielprojekt (Spec) — istBeispielProjekt
// sperrt hier NUR den automatischen Hinweislauf, den eine Chat-Bitte sonst ausloesen wuerde
// (der Seed bleibt unveraenderte Demo); starteHinweislauf/versucheHinweislauf sperren das
// Beispielprojekt ohnehin zusaetzlich autoritativ (istBeispielprojekt-Gate dort), diese
// Pruefung hier vermeidet nur den unnoetigen Zusatzsatz in der Antwort.
async function sendeAgentenChat(message, anfrage) {
  const doc = ctx.activeDoc()
  const project = dokumentProjekt(doc)
  if (!doc || !project) return

  await fuehreLaufAus(
    { kanal: 'chat', ausloeser: 'gespraech', signatur: fnvSignatur(anfrage) },
    ({ runTask }) => fuehreChatVorgangAus({
      laeuftBereits: () => false, // die Kanal-Sperre prueft und haelt das Tor (fuehreLaufAus)
      sperreSetzen: wert => {
        chatStream = wert ? (chatStream || { agentMessage: null, puffer: '', flushTimer: null }) : null
        refreshWorkspace() // Senden-Knopf sofort sichtbar deaktivieren (schliesst die Luecke aus Finding 1)
      },
      setzeStatus: setzeAgentStatus,
      verdichte: async () => {
        const plan = planVerlaufVerdichtung(message.thread, message.verlaufsNotiz || null)
        if (!plan) return
        try {
          const { daten } = await runTask('zusammenfassung', { anfrage: plan.verdichtungsEingabe })
          if (typeof daten === 'string' && daten.trim()) {
            message.verlaufsNotiz = { text: daten.trim(), bisMessageId: plan.bisMessageId, erstelltAt: Date.now() }
            ctx?.persist()
          }
        } catch {
          // Die Verdichtung ist Komfort: scheitert sie, läuft der Chat mit vollem Verlauf weiter.
        }
      },
      chatte: async () => {
        const hinweisBitte = !istBeispielProjekt(project) && erkenneHinweisBitte(anfrage)
        if (hinweisBitte) starteHinweislauf({ grund: 'chat' })

        const kontext = baueChatKontext({
          verstaendnis: ensureProjectUnderstanding(project),
          docText: dokumentText(),
          findings: doc.findings,
          doc,
          thread: message.thread.slice(0, -1), // der aktuelle Nutzer-Turn geht separat als `anfrage` mit
          verlaufsNotiz: message.verlaufsNotiz || null,
          anfrage,
          zusatzAnweisung: hinweisBitte
            ? 'Der Nutzer hat um eine Durchsicht gebeten. Ein Hinweislauf über den Text wurde soeben gestartet — erwähne kurz, dass du den Text jetzt durchgehst und dass Hinweise am Rand erscheinen, sobald etwas Belastbares dabei ist.'
            : null,
          // Aus main: das Projektwissen (Textsorte, Aussagen-Speicher, Nachbartexte,
          // Gedaechtnis). Der Zweig kannte es noch nicht — es darf beim Tor-Anschluss
          // nicht verlorengehen, sonst waere der Chat wieder ein blinder Kanal.
          onda: ondaQuellen(doc, project),
        })
        return await fuehreChatLauf(message.thread, kontext, runTask)
      },
    }),
  )
  // Das Tor loest kanalGesperrt('chat') in SEINEM EIGENEN finally (lauf-tor.mjs) — das laeuft
  // NACH sperreSetzen(false) oben, das noch waehrend der Sperre rendert. Ohne diesen
  // Nachrender bliebe der Senden-Knopf (send.disabled = kanalGesperrt('chat')) optisch UND
  // funktional deaktiviert: ein Formular mit nur einem deaktivierten Submit-Button feuert kein
  // implizites Submit mehr auf Enter — die Eingabe wirkt eingefroren, bis irgendein anderes
  // Ereignis zufaellig neu rendert.
  if (ctx) refreshWorkspace()
}

// Startet den echten Chat-Lauf FÜR EIN FINDING an der Randkarte (Task C-3) — dieselbe
// Sperr-/Status-Disziplin wie sendeAgentenChat: das Lauf-Tor (Task 6) prueft/setzt
// kanalGesperrt('chat') SYNCHRON vor jedem await (kein zweiter, ungesicherter Pfad, kein
// doppelter bezahlter Lauf — siehe Fix-Runde 1 zu C-2, chat-kontext.mjs). chatStream ist
// app-weit EIN Feld (siehe Deklaration oben) — ein laufendes Panel-Gespräch blockiert ein
// Randkarten-Gespräch und umgekehrt (derselbe Kanal 'chat' im Tor). Anders als
// sendeAgentenChat: keine Verlaufs-Verdichtung (Randkarten-Gespräche bleiben kurz, Findings
// kennen kein verlaufsNotiz-Feld) und keine Hinweisbitte-Erkennung — das Gespräch soll bei
// GENAU dieser Stelle bleiben (baueFindingZusatzAnweisung weist das Modell entsprechend an).
async function sendeLocalChat(finding, anfrage) {
  const doc = ctx.activeDoc()
  const project = dokumentProjekt(doc)
  if (!doc || !project) return

  await fuehreLaufAus(
    { kanal: 'chat', ausloeser: 'randkarte', signatur: fnvSignatur(anfrage) },
    ({ runTask }) => fuehreChatVorgangAus({
      laeuftBereits: () => false, // die Kanal-Sperre prueft und haelt das Tor (fuehreLaufAus)
      sperreSetzen: wert => {
        chatStream = wert ? (chatStream || { agentMessage: null, puffer: '', flushTimer: null }) : null
        refreshWorkspace() // Senden-Knopf an der Randkarte sofort sichtbar deaktivieren
      },
      setzeStatus: setzeAgentStatus,
      verdichte: async () => {},
      chatte: async () => {
        const kontext = baueChatKontext({
          verstaendnis: ensureProjectUnderstanding(project),
          docText: dokumentText(),
          findings: doc.findings,
          doc,
          thread: finding.thread.slice(0, -1), // der aktuelle Nutzer-Turn geht separat als `anfrage` mit
          anfrage,
          zusatzAnweisung: baueFindingZusatzAnweisung(finding),
          // Aus main, siehe sendeAgentenChat: ohne das Projektwissen waere auch das
          // Randkarten-Gespraech ein blinder Kanal.
          onda: ondaQuellen(doc, project),
        })
        return await fuehreChatLauf(finding.thread, kontext, runTask)
      },
    }),
  )
  // Siehe sendeAgentenChat: das Tor loest kanalGesperrt('chat') NACH dem letzten Rendern
  // innerhalb von fuehreChatVorgangAus/fuehreChatLauf — ohne diesen Nachrender bliebe der
  // Senden-Knopf an der Randkarte deaktiviert stehen und Enter faende kein aktives Submit
  // mehr (implizite Formularabsendung verlangt einen aktivierten Submit-Button).
  if (ctx) refreshWorkspace()
}

// Echte Initiative-Quelle, additiv zum bestehenden Aura-/Pausen-Mechanismus: eine Nachricht
// in dieser Form haelt hasUnseenInitiative (Aura-Punkt) und scheduleAgentInitiative
// (Pausen-/Dismiss-Regeln, kein Fokus-Raub) unveraendert; nur die Quelle ist echt.
// Hinweis: Bereich H hat fuer denselben Zweck (echter Hinweislauf findet Grundursache oder
// Integritaetsthema) bereits eine eigene, gleichwertige interne Loesung (ergaenzeEchteInitiative
// in fuehreHinweislaufAus) — die war noetig, bevor dieser Hook hier existierte, und bleibt hier
// unangetastet (ausserhalb des Datei-Scopes von Task C-2). Dieser Export ist additiv fuer
// zukuenftige Aufrufer außerhalb dieses Moduls bzw. eine spaetere Konsolidierung.
export function meldeAgentInitiative(text, { earliestAt = Date.now() } = {}) {
  const workspace = activeWorkspace()
  if (!workspace || typeof text !== 'string' || !text.trim()) return null
  const message = {
    id: `initiative-${Date.now()}-${workspace.agent.messages.length}`,
    text: text.trim(),
    status: 'new',
    earliestAt,
    thread: [],
  }
  workspace.agent.messages.push(message)
  persistWorkspace()
  refreshWorkspace()
  return message
}

function renderEntscheidungsverlauf(workspace) {
  const doc = ctx?.activeDoc()
  if (!doc) return null
  const eintraege = entscheidungsEintraege(doc)
  if (!eintraege.length) return null

  const section = createNode('section', 'agent-decisions')
  section.setAttribute('aria-label', 'Entscheidungsverlauf')
  const offen = Boolean(workspace.agent.decisionsOpen)
  const toggle = createNode('button', 'agent-decisions-toggle')
  toggle.type = 'button'
  toggle.id = 'agentDecisionsToggle'
  toggle.setAttribute('aria-expanded', String(offen))
  toggle.setAttribute('aria-controls', 'agentDecisionsList')
  toggle.append(
    createNode('span', 'agent-decisions-title', 'Entscheidungsverlauf'),
    createNode('span', 'onda-badge agent-decisions-count', String(eintraege.length)),
    (() => {
      const disclosure = createNode('span', 'agent-decisions-disclosure')
      disclosure.append(ondaIcon(offen ? 'chevron-down' : 'chevron-right', { size: 16 }))
      return disclosure
    })(),
  )
  toggle.addEventListener('click', () => {
    workspace.agent.decisionsOpen = !workspace.agent.decisionsOpen
    persistWorkspace()
    refreshWorkspace()
  })
  section.append(toggle)

  if (offen) {
    const list = createNode('div', 'agent-decisions-list')
    list.id = 'agentDecisionsList'
    eintraege.forEach(eintrag => {
      const item = createNode('article', 'agent-decision')
      item.dataset.decisionId = eintrag.id
      const meta = createNode('div', 'agent-decision-meta')
      meta.append(
        createNode('span', `agent-decision-label is-${eintrag.art}`, eintrag.label),
        createNode('span', 'agent-decision-date', eintrag.datumText),
      )
      item.append(meta, createNode('p', 'agent-decision-short', eintrag.kurztext))
      if (eintrag.resultierenderWortlaut) {
        item.append(createNode('p', 'agent-decision-result', `Resultierender Wortlaut: ${eintrag.resultierenderWortlaut}`))
      }
      if (eintrag.begruendung) {
        item.append(createNode('p', 'agent-decision-reason', `Begründung: ${eintrag.begruendung}`))
      }
      list.append(item)
    })
    section.append(list)
  }
  return section
}

// Zwei Gesten, mehr nicht: merken und weglegen. Sie hingen bis zum 7. August 2026 an
// der Karte in der Seitenleiste; mit der Karte waeren sie verschwunden, und mit ihnen
// der einzige Weg, auf dem ein Muster in den Personenspeicher gelangt. Sie haengen
// jetzt an der Nachricht im Gespraech, an der sie ohnehin hingehoeren.
//
// Keine Leiter aus „nur diesmal / nicht mehr hier / nie": das gibt es beim Verwerfen
// eines Hinweises, weil ein Hinweis eine Forderung war, die man abwehren koennen muss.
// Ein Angebot muss man nicht abwehren.
function erweiterungsGesten(message) {
  const kennung = String(message?.id || '')
  if (!kennung.startsWith('erweiterung-')) return null
  const doc = ctx?.activeDoc()
  if (!doc) return null
  const id = kennung.slice('erweiterung-'.length)
  const eintrag = (doc.erweiterungen || []).find(kandidat => kandidat?.id === id)
  if (!eintrag) return null

  const flaeche = createNode('div', 'onda-rueckkopplung-gesten')
  // Die Stelle, um die es geht. Eine Erweiterung ohne Weg dorthin waere eine
  // Behauptung ueber einen Text, den man erst suchen muss.
  ;(eintrag.stellen || []).forEach(stelle => {
    if (!stelle?.blockId && !stelle?.docId) return
    const sprung = createNode('button', 'onda-erk-geste is-still', stelle.docId ? `Zur Stelle in „${stelle.docTitel || 'einem anderen Text'}“` : 'Zur Stelle')
    sprung.type = 'button'
    sprung.addEventListener('click', () => {
      if (stelle.blockId) { focusBlock(stelle.blockId); return }
      if (typeof ctx?.ops?.openDoc !== 'function') return
      ctx.ops.openDoc(stelle.docId)
      requestAnimationFrame(() => {
        const treffer = aktuelleBloecke()
          .filter(block => String(block.text || '').includes(String(stelle.text || '')))
        if (treffer.length === 1 && treffer[0].id) focusBlock(treffer[0].id)
      })
    })
    flaeche.append(sprung)
  })
  const merken = createNode('button', 'onda-erk-geste', eintrag.status === 'gemerkt' ? 'Gemerkt' : 'Merken')
  merken.type = 'button'
  merken.disabled = eintrag.status === 'gemerkt'
  merken.addEventListener('click', () => {
    merkeErweiterung(doc, id)
    // Das Muster ist der eigentliche Ertrag: der Einzelfall hilft einmal, das Prinzip
    // beim naechsten Text von allein. Es gehoert der Person, nicht dem Dokument.
    merkeErkanntes(eintrag.muster, 'erweiterung', eintrag.stellen?.[0]?.text || '', 'idee')
    ctx?.scheduleSave()
    refreshWorkspace()
  })
  const weglegen = createNode('button', 'onda-erk-geste is-still', 'Weglegen')
  weglegen.type = 'button'
  weglegen.addEventListener('click', () => {
    legeErweiterungWeg(doc, id)
    const workspace = activeWorkspace()
    if (workspace) dismissAgentMessage(workspace, message.id)
    ctx?.scheduleSave()
    refreshWorkspace()
  })
  flaeche.append(merken, weglegen)
  return flaeche
}

function renderAgentWidget() {
  const ui = elements()
  const workspace = activeWorkspace()
  if (!ui.agentWidget || !workspace) return
  // Waehrend Fassung B des Abgangs bleibt der Inhalt stehen und verblasst mit der
  // Flaeche. Abgeraeumt wird erst, wenn die Faltung durch ist.
  if (blaseFaeltZurueck && !workspace.agent.open) return
  const inputState = captureInputState(ui.agentWidget, '.agent-chat-input')
  ui.agentWidget.replaceChildren()
  if (!workspace.agent.open) {
    if (agentPresenceFocusRequest) {
      agentPresenceFocusRequest = false
      ui.agentPresence?.focus({ preventScroll: true })
    }
    return
  }
  const message = activeAgentMessage(workspace)
  const header = createNode('header', 'agent-widget-header')
  header.append(
    createNode('strong', 'agent-widget-title', 'Agent'),
  )
  const close = createNode('button', 'surface-close')
  close.append(ondaIcon('x', { size: 18 }))
  close.type = 'button'
  close.dataset.closeAgent = ''
  close.title = 'Gespräch schließen'
  close.setAttribute('aria-label', 'Agentengespräch schließen')
  close.addEventListener('click', () => closeAgentWidget())
  header.append(close)
  ui.agentWidget.append(header)

  const statusline = createNode('div', 'agent-statusline')
  statusline.id = 'agentStatusline'
  statusline.hidden = true
  ui.agentWidget.append(statusline)
  renderAgentStatuszeile()

  const unplaced = renderUnplacedFindingList()
  if (unplaced) ui.agentWidget.append(unplaced)

  const decisions = renderEntscheidungsverlauf(workspace)
  if (decisions) ui.agentWidget.append(decisions)

  if (!message) {
    ui.agentWidget.append(createNode('p', 'agent-widget-empty', 'Noch kein allgemeines Gespräch.'))
    return
  }

  if (!Array.isArray(message.thread)) message.thread = []
  if (!message.thread.length && message.text) {
    appendThreadMessage(message.thread, 'agent', message.text, message.earliestAt || 0)
  }
  const messages = createNode('div', 'agent-widget-messages')
  message.thread.forEach(entry => appendThreadMessageNode(messages, entry))
  const gesten = erweiterungsGesten(message)
  if (gesten) messages.append(gesten)

  // Composer nach dem Design System: EIN Rahmen um Feld und Knopf, nicht zwei
  // Formen nebeneinander (components/conversation/Composer.jsx).
  const form = createNode('form', 'agent-chat-form agent-widget-form')
  const composer = createNode('div', 'onda-composer')
  const input = createNode('input', 'agent-chat-input')
  input.type = 'text'
  input.placeholder = 'Schreib eine Anweisung …'
  input.setAttribute('aria-label', 'Dem Agenten antworten')
  const send = createNode('button', 'agent-chat-send')
  send.append(ondaIcon('arrow-right', { size: 15 }))
  send.type = 'submit'
  send.title = 'Senden'
  send.setAttribute('aria-label', 'Nachricht senden')
  send.disabled = kanalGesperrt('chat') // Sperre wohnt im Tor (Task 6), nicht mehr in einem lokalen Feld
  form.append(input, send)
  form.addEventListener('submit', event => {
    event.preventDefault()
    const text = input.value.trim()
    if (!text || kanalGesperrt('chat')) return
    if (istInterviewAktiv()) {
      if (kanalGesperrt('interview')) return // ein Lauf zur Zeit; die Eingabe bleibt stehen
      input.value = ''
      sendeInterviewAntwort(message, text)
      return
    }
    // Echter, gestreamter Chat (Bereich C) — die Kulisse ist weg.
    input.value = ''
    appendThreadMessage(message.thread, 'user', text, Date.now())
    ctx.persist()
    refreshWorkspace()
    sendeAgentenChat(message, text)
  })
  ui.agentWidget.append(messages)
  if (interviewStatus) {
    ui.agentWidget.append(createNode(
      'p',
      'agent-widget-status',
      interviewStatus === 'laeuft' ? 'Agent denkt nach …' : interviewStatus,
    ))
  }
  ui.agentWidget.append(form)
  restoreInputState(input, inputState)
  scrollThreadToLatest(messages)
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ''))
    return url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function openSecureExternal(url) {
  const safeUrl = safeHttpsUrl(url)
  if (!safeUrl) return
  if (ctx.state.native && window.webkit?.messageHandlers?.openurl) {
    window.webkit.messageHandlers.openurl.postMessage(safeUrl)
  } else {
    window.open(safeUrl, '_blank', 'noopener,noreferrer')
  }
}

async function copyCitation(citation, verificationStatus) {
  if (!citation) return
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(citation)
    } else {
      const field = document.createElement('textarea')
      field.value = citation
      field.setAttribute('readonly', '')
      field.className = 'visually-hidden'
      document.body.append(field)
      field.select()
      document.execCommand('copy')
      field.remove()
    }
    if (verificationStatus === 'verified') {
      announceAgentStatus('Verifizierte Angabe kopiert.')
    } else if (verificationStatus === 'demo') {
      announceAgentStatus('Demo-Angabe kopiert. Vor Verwendung prüfen.')
    } else {
      announceAgentStatus('Ungeprüfte Angabe kopiert. Vor Verwendung prüfen.')
    }
  } catch {
    announceAgentStatus('Die Angabe konnte nicht kopiert werden.')
  }
}

function verificationLabel(status) {
  if (status === 'verified') return 'Verifiziert'
  if (status === 'demo') return 'Demoquelle - nicht live verifiziert'
  return 'Nicht verifiziert'
}

function closeEvidenceWindow({ restoreFocus = true } = {}) {
  const workspace = activeWorkspace()
  if (!workspace?.evidenceFindingId) return false
  workspace.evidenceFindingId = null
  if (restoreFocus && evidenceReturnFindingId) requestLocalSummaryFocus(evidenceReturnFindingId)
  evidenceReturnFindingId = null
  evidenceFocusRequest = false
  refreshWorkspace()
  persistWorkspace()
  return true
}

function appendEvidenceNote(parent, label, value) {
  const values = Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean)
  if (!values.length) return
  const section = createNode('div', 'evidence-source-note')
  section.append(
    createNode('span', 'evidence-source-note-label', label),
    createNode('p', 'evidence-source-note-text', values.join(' ')),
  )
  parent.append(section)
}

function renderEvidenceWindow() {
  const ui = elements()
  const workspace = activeWorkspace()
  const doc = ctx?.activeDoc()
  if (!ui.evidenceWindow || !workspace || !doc) return
  ui.evidenceWindow.replaceChildren()
  if (!workspace.evidenceFindingId) return

  const finding = doc.findings.find(candidate => candidate.id === workspace.evidenceFindingId)
  const header = createNode('header', 'evidence-header')
  header.append(createNode('strong', 'evidence-title', 'Quellen im Kontext'))
  const close = createNode('button', 'surface-close')
  close.append(ondaIcon('x', { size: 18 }))
  close.type = 'button'
  close.dataset.closeEvidence = ''
  close.title = 'Quellen schließen'
  close.setAttribute('aria-label', 'Quellen schließen')
  close.addEventListener('click', () => closeEvidenceWindow())
  header.append(close)
  ui.evidenceWindow.append(header)

  if (!finding) {
    ui.evidenceWindow.append(createNode('p', 'evidence-empty', 'Die zugehörige Fundstelle ist nicht mehr verfügbar.'))
    return
  }

  const exactClaim = typeof finding.claim === 'string' ? finding.claim.trim() : ''
  const claimSection = createNode('section', 'evidence-context')
  claimSection.append(
    createNode('span', 'evidence-kicker', exactClaim ? 'Zu belegende Aussage' : 'Unvollständiger Belegkontext'),
    createNode(
      'p',
      exactClaim ? 'evidence-claim' : 'evidence-claim evidence-claim-missing',
      exactClaim || 'Zu belegende Aussage noch nicht erfasst',
    ),
  )
  ui.evidenceWindow.append(claimSection)

  const sources = createNode('div', 'evidence-sources')
  // Etappe-A-Guard (H-4): In echten Projekten zeigt das Belegfenster nur den
  // Hinweis-Kontext -- Demo-Quellen bleiben exklusiv im Beispielprojekt. Welche
  // Quellen sichtbar sind, entscheidet die reine, node-getestete Funktion
  // resolveEvidenceSources (workspace-model.mjs, siehe workspace-model.test.mjs).
  const istBeispielprojekt = istBeispielDokument(doc)
  const sichtbareQuellen = resolveEvidenceSources(finding.sources, istBeispielprojekt)
  sichtbareQuellen.forEach(source => {
    const sourceUrl = safeHttpsUrl(source.url)
    const verificationStatus = ['demo', 'unverified', 'verified'].includes(source.verificationStatus)
      ? source.verificationStatus
      : 'unverified'
    const item = createNode('article', 'evidence-source')
    const meta = createNode('div', 'evidence-source-meta')
    meta.append(
      createNode('strong', 'evidence-source-label', source.label || 'Quelle'),
      createNode('span', 'evidence-source-type', source.type || 'Quelle'),
      createNode('span', `evidence-source-verification is-${verificationStatus}`, verificationLabel(verificationStatus)),
    )
    item.append(meta)
    const sourceContent = typeof source.content === 'string' && source.content.trim()
      ? source.content
      : (typeof source.preview === 'string' ? source.preview : '')
    const contentType = ['original-excerpt', 'excerpt', 'summary'].includes(source.contentType)
      ? source.contentType
      : 'summary'
    if (sourceContent) {
      item.append(
        createNode('span', 'evidence-excerpt-label', contentType === 'summary' ? 'Zusammenfassung' : 'Auszug'),
        createNode('p', 'evidence-source-preview', sourceContent),
      )
    }
    appendEvidenceNote(item, 'Einordnung', source.context || source.interpretation)
    appendEvidenceNote(item, 'Grenzen / Gegenbelege', source.limits || source.counterEvidence)
    appendEvidenceNote(item, 'Fundstelle', source.locator)
    if (typeof source.citation === 'string' && source.citation.trim()) {
      const citation = createNode('div', 'evidence-citation')
      citation.append(createNode('p', 'evidence-source-citation', source.citation))
      const copyLabel = verificationStatus === 'demo'
        ? 'Demo-Angabe kopieren'
        : verificationStatus === 'verified'
          ? 'Angabe kopieren'
          : 'Angabe erst nach Prüfung kopierbar'
      const copy = createNode('button', 'evidence-copy', copyLabel)
      copy.type = 'button'
      copy.dataset.copyCitation = ''
      copy.disabled = !exactClaim || verificationStatus === 'unverified'
      if (exactClaim && verificationStatus !== 'unverified') {
        copy.addEventListener('click', () => copyCitation(source.citation, verificationStatus))
      } else {
        copy.title = !exactClaim
          ? 'Erst verfügbar, wenn die zu belegende Aussage erfasst ist'
          : 'Erst nach Prüfung am Original verfügbar'
      }
      citation.append(copy)
      item.append(citation)
    }
    if (sourceUrl) {
      const link = createNode('a', 'evidence-source-link', 'Original öffnen ↗')
      link.href = sourceUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      if (ctx.state.native) {
        link.addEventListener('click', event => {
          event.preventDefault()
          openSecureExternal(sourceUrl)
        })
      }
      item.append(link)
    }
    sources.append(item)
  })
  if (!sources.children.length) {
    sources.append(createNode('p', 'evidence-empty', istBeispielprojekt
      ? 'Für diese Aussage ist noch keine sichere direkte Quelle hinterlegt.'
      : 'Dieser Hinweis stützt sich allein auf deinen Text — Quellen sucht der Agent dafür noch nicht.'))
  }
  ui.evidenceWindow.append(sources)
  if (evidenceFocusRequest) {
    evidenceFocusRequest = false
    requestAnimationFrame(() => close.focus({ preventScroll: true }))
  }
}

// ---- Echte Hinweis-Läufe (Etappe A, Spec §5) -------------------------------
// Gate, Sperre, Kontextbau, runTask-Aufruf und Modellantwort-Verarbeitung stecken
// vollstaendig in versucheHinweislauf (hinweislauf-model.mjs, node-getestet, inkl.
// Kollisions- und Kontext-Drift-Schutz — Fix-Runde 1). Diese Funktionen hier sind die
// duenne ctx/DOM-Klammer: Dokument/Editor lesen, versucheHinweislauf aufrufen, Ergebnis
// in doc.findings + workspace.hinweislauf uebernehmen, Panel aktualisieren.

function istBeispielDokument(doc) {
  return doc?.projectId === EXAMPLE_PROJECT_ID
}

// Das Laufprotokoll traegt zweierlei: die Werte des LETZTEN Laufs (gestartet/verworfen/
// uebernommen -- die ueberschreibt jeder neue Lauf, so war es immer) und daneben die
// Summen ueber ALLE Laeufe dieses Dokuments. Die Summen sind neu und der Grund, warum es
// dieses Protokoll ueberhaupt gibt: Bisher schrieb Onda seine eigene Trefferquote mit und
// las davon nur die Signatur zur Entprellung. bilanziereRueckmeldung
// (rueckkopplung-model.mjs) wertet sie jetzt aus -- siehe rueckkopplungsDaten unten.
function hinweislaufProtokoll(workspace) {
  if (!workspace.hinweislauf || typeof workspace.hinweislauf !== 'object') {
    workspace.hinweislauf = {
      signatur: null,
      beendetAt: null,
      gestartet: 0,
      verworfen: 0,
      uebernommen: 0,
      fehler: null,
      laeufe: 0,
      summeGeliefert: 0,
      summeVerworfen: 0,
      summeUebernommen: 0,
    }
  }
  return workspace.hinweislauf
}

// Was Onda ueber die eigene Trefferquote weiss -- ueber ALLE eigenen Dokumente hinweg.
//
// Das Beispielprojekt bleibt bewusst draussen: Seine Hinweise sind vorgefertigt und seine
// Entscheidungen sind Probeklicks in einer Vorfuehrung. Sie als Vorlieben dieser Person zu
// lesen, waere schlicht falsch -- dieselbe Grenze, die schon istBeispielDokument im Gate
// zieht. Dokumente ohne Arbeitsflaeche (workspace) liefern nur ihre Findings; ein fehlendes
// Protokoll ist kein Fehler, sondern ein Dokument, in dem noch kein Lauf stattfand.
function rueckkopplungsDaten() {
  return (ctx?.state?.docs || [])
    .filter(doc => doc && !doc.trashed && doc.projectId !== EXAMPLE_PROJECT_ID)
    .map(doc => ({
      id: doc.id,
      trashed: doc.trashed === true,
      findings: doc.findings,
      decisions: doc.decisions,
      hinweislauf: doc.workspace?.hinweislauf || null,
    }))
}

function synchronisiereRueckkopplungsvorschlag() {
  if (!ctx?.state) return null
  const bilanz = bilanziereRueckmeldung({ dokumente: rueckkopplungsDaten() })
  const neu = erstelleRueckkopplungsvorschlag(bilanz)
  if (!neu) return null
  const bisher = ctx.state.rueckkopplung
  if (bisher?.id === neu.id) return bisher
  // Neue Daten bedeuten eine neue Entscheidung. Eine alte Zustimmung wird nie still auf
  // eine veraenderte Statistik uebertragen.
  ctx.state.rueckkopplung = neu
  return neu
}

// Echte Initiative-Quelle: nach einem Lauf mit Grundursache oder Integritätsthema
// entsteht eine Agenten-Nachricht. Anzeige-Gates (shouldOpenAgentWidget,
// hasUnseenInitiative, Dismiss-Regeln) bleiben unverändert die bestehenden — nur
// die Quelle wird echt (Spec §6: "die Quelle wird echt").
function ergaenzeEchteInitiative(workspace, finding, jetzt) {
  const offenVorhanden = workspace.agent.messages.some(message => (
    message.status === 'new' && !workspace.agent.dismissedIds.includes(message.id)
  ))
  if (offenVorhanden) return
  const text = finding.istGrundursache
    ? `Beim Lesen ist mir etwas Grundsätzliches aufgefallen: ${finding.short}`
    : `Ein Hinweis betrifft die Verlässlichkeit deines Textes: ${finding.short}`
  workspace.agent.messages.push({
    id: `initiative-${jetzt.toString(36)}`,
    status: 'new',
    earliestAt: jetzt,
    text,
    thread: [],
  })
}

// fuehreHinweislaufAus ist modulintern. Die drei Ausloeser aus Spec §5 rufen sie auf:
// Schreibpause ueber planeHinweislauf, Dokument-oeffnen ueber onViewChange/initWorkspace
// (H-3), und die Chat-Bitte ueber den bereits exportierten Hook starteHinweislauf.
//
// Die gesamte Ablauflogik (Gate, Sperre-vor-jedem-await, Kontext, runTask, Antwort-
// Verarbeitung) steckt in versucheHinweislauf (hinweislauf-model.mjs, node-getestet, u.a.
// gegen Kollision zweier Ausloeser und Dokument-/Projekt-Drift ueber den Schluessel-Check
// hinweg — Fix-Runde 1, Finding 1+2). Diese Funktion hier sammelt nur noch ctx-gebundene
// Werte SYNCHRON VOR dem Aufruf ein (Dokument-ID, Projekt ueber doc.projectId statt ueber
// den jederzeit verschiebbaren ctx.activeProjectObj()-Zeiger) und uebernimmt danach das
// Ergebnis in doc.findings + workspace.hinweislauf + Panel.
async function fuehreHinweislaufAus({ grund = 'pause' } = {}) {
  const doc = ctx?.activeDoc()
  const workspace = activeWorkspace()
  const blocks = doc ? aktuelleBloecke() : []
  const docText = doc ? baueDocText(blocks) : ''
  const protokoll = workspace ? hinweislaufProtokoll(workspace) : null
  const signatur = seedBodySignature(docText)
  if (doc) ensureReasoningModel(doc) // Selbstheilung wie decideFinding: doc.findings/decisions sicher als Arrays
  const docId = doc?.id ?? null
  // Ueber doc.projectId aufloesen (VOR jedem await erfasst), nicht ueber den
  // Startseiten-Zeiger -- siehe dokumentProjekt (Fix-Runde 1, Finding 2).
  const project = dokumentProjekt(doc)
  const verstaendnis = project ? ensureProjectUnderstanding(project) : null
  // Wie alle anderen Werte hier SYNCHRON vor dem Aufruf eingesammelt (Fix-Runde 1, Finding 2).
  const ondaWissen = ondaQuellen(doc, project)
  // Die Rueckkopplung: was bei dieser Person bisher getragen hat. Dokumentuebergreifend --
  // deshalb hier und nicht in versucheHinweislauf, das nur das aktuelle Dokument sieht.
  const rueckkopplung = synchronisiereRueckkopplungsvorschlag()

  // Kanal-Sperre und Signatur wandern ins Lauf-Tor (lauf-tor.mjs, Task 7): laeuftBereits/
  // sperreSetzen an versucheHinweislauf werden darum reine No-ops -- die Kanal-Sperre prueft
  // und haelt das Tor (fuehreLaufAus); das Modell behaelt seine Parameter fuer die Modell-Tests
  // (hinweislauf-model.test.mjs). Das Signatur-Doppel bleibt ABSICHTLICH zweistufig: die
  // Tor-Signatur unten ist docId-praefixiert und vergleicht gegen den letzten BEZAHLTEN Lauf
  // dieses Kanals im Journal (struktureller Backstop, kanalweit, einmalJeSignatur); die
  // unpraefixierte `signatur`/`letzteSignatur` unten bleibt versucheHinweislaufs eigene,
  // unveraenderte Pruefung gegen protokoll.signatur (je Workspace, wie vor Task 7).
  //
  // Aus main mitgenommen und NICHT verloren: annotationMode, textart, rueckkopplung und das
  // Projektwissen. Der Zweig kannte diese vier noch nicht — sie sind nach seiner Abzweigung
  // dazugekommen.
  const ergebnis = await fuehreLaufAus(
    { kanal: 'hinweis', ausloeser: grund, signatur: `${docId}:${signatur}`, einmalJeSignatur: true },
    ({ runTask: torRunTask }) => versucheHinweislauf({
      hatDokument: Boolean(doc && workspace),
      istBeispielprojekt: istBeispielDokument(doc),
      verstaendnisOffen: verstaendnis ? istInterviewOffen(verstaendnis) : false,
      laeuftBereits: false, // die Kanal-Sperre prueft und haelt das Tor (fuehreLaufAus)
      sperreSetzen: () => {}, // das Modell behaelt seine Parameter fuer die Modell-Tests
      docText,
      signatur,
      letzteSignatur: protokoll?.signatur ?? null,
      hatSchluessel,
      istNochDasselbeDokument: () => ctx.activeDoc()?.id === docId,
      // Fix-Runde 2, Finding 2b (Important): der Chat-Auslöser umging bisher die Monatsbremse
      // komplett (beansprucheKostenfreigabe:null -> versucheHinweislauf nimmt dann {erlaubt:true}
      // an, siehe hinweislauf-model.mjs). Die Oberfläche behauptet aber "Automatische Läufe sind
      // pausiert" OHNE Ausnahme für den Chat-Hinweislauf -- das war schlicht nicht wahr. Der
      // reine Chat (die Antwort des Agenten, sendeAgentenChat/fuehreChatLauf) ist davon NICHT
      // betroffen: das hier ist ausschliesslich der zusätzliche Hintergrund-Hinweislauf, den eine
      // Chat-Bitte ("schau mal drüber") zusätzlich anstößt (siehe starteHinweislauf-Aufruf in
      // sendeAgentenChat) -- genau der soll wie jeder andere automatische Lauf der Bremse
      // unterliegen; die Chat-Antwort selbst läuft unabhängig davon immer weiter.
      beansprucheKostenfreigabe: () => beansprucheAutomatikKosten('hinweis', { docId, grund }),
      verstaendnis,
      blocks,
      findings: doc?.findings,
      decisions: doc?.decisions,
      annotationMode: workspace?.annotationMode || 'text',
      // Die Textart entscheidet, welche Hinweisarten Integritaetsfragen sind
      // (textart-regeln.mjs). Bei einem Plakattext ist eine fehlende Quellenangabe keine
      // Frage der Wahrhaftigkeit, und ihr Verwerfen kein "bewusst angenommenes Risiko".
      // Fehlt das Profil, bleibt es beim vorsichtigen Fall: alle vier binden.
      textart: project?.languageProfile?.genre || '',
      rueckkopplung,
      // Textsorte, Aussagen-Speicher und Gedaechtnis (onda-kontext.mjs) kommen hier eine Ebene
      // spaeter dazu als bei Interview und Chat: den Kontext dieses Kanals baut
      // versucheHinweislauf selbst (hinweislauf-model.mjs), und diese Datei kann ihm nichts
      // durchreichen. ergaenzeOndaKontext haengt die Bloecke HINTEN an kontext.volatiles — also
      // hinter Anweisung und Entscheidungsliste und weit hinter den gecachten Praefix, dessen
      // Stabilitaet damit unberuehrt bleibt. Die Klammer sitzt jetzt um das RunTask DES TORS,
      // damit Buchung und Journal denselben Weg nehmen wie bei jedem anderen Kanal.
      runTask: (task, kontext, optionen) => torRunTask(task, ergaenzeOndaKontext(kontext, ondaWissen), optionen),
      setzeAgentStatus,
    }),
  )

  if (!ergebnis.gestartet) {
    if (ergebnis.grund === 'monatsbudget-erreicht') {
      zeigeBudgetPause(workspace)
      persistWorkspace()
      refreshWorkspace()
    }
    return ergebnis // Gate/Dokumentwechsel/Budget hat blockiert -- nichts zu protokollieren
  }

  if (!ergebnis.erfolg) {
    // Spec §7: Schema-Muell/Abbruch -> Lauf verwerfen, still protokollieren, beim naechsten
    // Ausloeser neu. signatur bleibt unveraendert -> derselbe Text darf erneut versucht werden.
    Object.assign(protokoll, { beendetAt: Date.now(), fehler: ergebnis.fehler })
    ctx?.scheduleSave()
    return { gestartet: true, fehler: ergebnis.fehler }
  }

  ergebnis.uebernommen.forEach(finding => doc.findings.push(finding))
  Object.assign(protokoll, {
    signatur,
    beendetAt: ergebnis.zeit,
    gestartet: ergebnis.geliefertAnzahl,
    verworfen: ergebnis.verworfen,
    uebernommen: ergebnis.uebernommen.length,
    fehler: null,
    // Die Summen daneben, damit die Trefferquote nicht bei jedem Lauf vergessen wird.
    // Vorher standen hier nur die drei Werte des letzten Laufs, und jeder neue Lauf
    // ueberschrieb sie: Das Protokoll war eine Momentaufnahme, aus der sich nichts
    // ableiten liess. `|| 0` faengt alte, gespeicherte Arbeitsflaechen ohne diese Felder ab.
    laeufe: (Number(protokoll.laeufe) || 0) + 1,
    summeGeliefert: (Number(protokoll.summeGeliefert) || 0) + ergebnis.geliefertAnzahl,
    summeVerworfen: (Number(protokoll.summeVerworfen) || 0) + ergebnis.verworfen,
    summeUebernommen: (Number(protokoll.summeUebernommen) || 0) + ergebnis.uebernommen.length,
  })
  const initiativeAnlass = ergebnis.grundursache
    || ergebnis.uebernommen.find(finding => isIntegrityCategory(finding.category))
  if (initiativeAnlass) ergaenzeEchteInitiative(workspace, initiativeAnlass, ergebnis.zeit)
  ctx.scheduleSave()
  refreshWorkspace()
  return { gestartet: true, uebernommen: ergebnis.uebernommen.length, verworfen: ergebnis.verworfen }
}

// Chat-Bitte-Hook („schau nochmal drüber") — Bereich C ruft diese Funktion.
export function starteHinweislauf(optionen = {}) {
  return fuehreHinweislaufAus({ grund: optionen.grund || 'chat' })
}

// --- Zweiter Kanal: Erweiterungen -------------------------------------------
// Dieselbe duenne ctx/DOM-Klammer wie fuehreHinweislaufAus: alle Werte SYNCHRON vor
// dem Aufruf einsammeln, die Ablauflogik steckt in versucheErweiterungslauf
// (erweiterungslauf-model.mjs, node-getestet).
async function fuehreErweiterungslaufAus({ vonHand = false } = {}) {
  const doc = ctx?.activeDoc()
  const workspace = activeWorkspace()
  if (doc) ensureErweiterungen(doc)
  const blocks = doc ? aktuelleBloecke() : []
  const docText = doc ? baueDocText(blocks) : ''
  const docId = doc?.id ?? null
  const project = dokumentProjekt(doc)
  const verstaendnis = project ? ensureProjectUnderstanding(project) : null
  const ondaWissen = ondaQuellen(doc, project)

  // Kanal-Sperre und Signatur wandern ins Lauf-Tor (lauf-tor.mjs, Task 8): laeuftBereits/
  // sperreSetzen an versucheErweiterungslauf werden darum reine No-ops -- die Kanal-Sperre
  // prueft und haelt das Tor (fuehreLaufAus); das Modell behaelt seine Parameter fuer die
  // Modell-Tests (erweiterungslauf-model.test.mjs). BEWUSSTE VERHALTENSSCHAERFUNG (der Kern
  // von Issue #12, KEIN Momente-Verhalten): bisher lebte die Merkliste "wofuer wurde schon
  // bezahlt" nur in der Modul-Variable letzteErweiterungsSignatur und vergass sie beim
  // Neustart -- die App bezahlte denselben Text danach ein zweites Mal. Jetzt liegt die
  // Merkliste im Journal (data.json) und ueberlebt den Neustart -- genau die Fehlerklasse
  // aus fuenf Fixes in neun Tagen.
  //
  // Aus main mitgenommen: das onda-Buendel. Es steht zweimal da, mit Absicht und in beide
  // Richtungen — einmal als Parameter, damit versucheErweiterungslauf die Geschwistertexte
  // ableitet und einen Anker darin wiederfindet statt ihn zu verwerfen, und einmal im
  // runTask-Umschlag, damit dieselben Texte auch im Prompt stehen. Beides MUSS aus derselben
  // Quelle kommen: sonst zeigte der Prompt andere Texte, als die Pruefung durchsucht, und jede
  // Querverbindung fiele stillschweigend heraus.
  const ergebnis = await fuehreLaufAus(
    {
      kanal: 'erweiterung',
      ausloeser: vonHand ? 'hand' : 'aufschauen',
      signatur: erweiterungsSignatur(docId, docText),
      einmalJeSignatur: !vonHand,
    },
    ({ runTask: torRunTask }) => versucheErweiterungslauf({
      hatDokument: Boolean(doc && workspace),
      istBeispielprojekt: istBeispielDokument(doc),
      verstaendnisOffen: verstaendnis ? istInterviewOffen(verstaendnis) : false,
      laeuftBereits: false, // die Kanal-Sperre prueft und haelt das Tor (fuehreLaufAus)
      docText,
      vonHand,
      sperreSetzen: () => {}, // das Modell behaelt seine Parameter fuer die Modell-Tests
      hatSchluessel,
      istNochDasselbeDokument: () => ctx.activeDoc()?.id === docId,
      beansprucheKostenfreigabe: () => beansprucheAutomatikKosten('erweiterung', { docId, grund: vonHand ? 'hand' : 'aufschauen' }),
      verstaendnis,
      blocks,
      doc,
      onda: ondaWissen,
      runTask: (task, kontext, optionen) => torRunTask(task, ergaenzeOndaKontext(kontext, ondaWissen), optionen),
      setzeAgentStatus,
    }),
  )

  // Das Tor loest kanalGesperrt('erweiterung') in SEINEM EIGENEN finally (lauf-tor.mjs) --
  // das laeuft NACH dem letzten Rendern innerhalb dieser Funktion. Ohne diesen Nachrender
  // bliebe ein Bedienelement, das an kanalGesperrt('erweiterung') haengt, optisch UND
  // funktional deaktiviert, auf allen Pfaden -- gestartet:false, Fehler UND Erfolg
  // (siehe sendeAgentenChat fuer dasselbe Muster).
  if (ctx) refreshWorkspace()

  if (!ergebnis.gestartet) {
    if (ergebnis.grund === 'monatsbudget-erreicht') {
      zeigeBudgetPause(workspace)
      persistWorkspace()
      refreshWorkspace()
    }
    return ergebnis
  }
  if (!ergebnis.erfolg) return ergebnis

  // Die Fortschreibung der alten Modul-Variable entfaellt: der Journal-Eintrag IST die
  // Merkliste jetzt (das Tor schreibt ihn in schliesseLauf, BEVOR fuehreLaufAus zurueckkehrt --
  // siehe planeErweiterungslauf, dessen darfAutomatischLaufen-Check direkt danach bereits den
  // frischen Eintrag sieht, keine Luecke).
  ergebnis.uebernommen.forEach(erweiterung => doc.erweiterungen.push(erweiterung))
  // Bewusst KEIN ergaenzeEchteInitiative und keine Zahl irgendwo: eine Erweiterung
  // klopft nicht an. Sie liegt in der Seitenspalte, bis jemand hinschaut.
  ctx.scheduleSave()
  refreshWorkspace()
  return { gestartet: true, uebernommen: ergebnis.uebernommen.length, verworfen: ergebnis.verworfen }
}

function clearErweiterungslaufTimer() {
  if (erweiterungslaufTimer) { clearTimeout(erweiterungslaufTimer); erweiterungslaufTimer = null }
}

// Der Erweiterungslauf gehoert zum Moment des Aufschauens (momente-model.mjs).
// Er wird deshalb genau dann geplant, wenn die lange Ruhe erreicht ist -- nicht bei
// jeder Schreibpause. Ein Lauf je Textstand: die Signatur merkt sich, wozu schon
// gefragt wurde, damit dieselbe Ruhe nicht zweimal bezahlt wird. Die Merkliste selbst
// (frueher hier als letzteErweiterungsSignatur) lebt jetzt im Journal (lauf-tor.mjs/
// lauf-journal.mjs, Task 8) und ueberlebt damit den Neustart -- siehe die
// Verhaltensschaerfung oben in fuehreErweiterungslaufAus.
function erweiterungsSignatur(docId, docText) {
  return `${docId}:${seedBodySignature(docText)}`
}

function planeErweiterungslauf() {
  clearErweiterungslaufTimer()
  const docId = ctx?.activeDoc()?.id || null
  const inputState = initiativeInputState(docId)
  if (!docId || !inputState || !Number.isFinite(inputState.lastInputAt)) return
  if (kanalGesperrt('erweiterung') || isComposing || !editorViewIsVisibleFor(docId)) return

  const restzeit = AUFSCHAUEN_MS - (Date.now() - inputState.lastInputAt)
  const generation = inputState.generation
  erweiterungslaufTimer = setTimeout(() => {
    erweiterungslaufTimer = null
    const aktuell = initiativeInputState(docId)
    if (!aktuell || aktuell.generation !== generation) return
    if (!editorViewIsVisibleFor(docId) || isComposing) return
    const signatur = erweiterungsSignatur(docId, baueDocText(aktuelleBloecke()))
    // Gegen letzteBezahlteSignatur aus dem JOURNAL, nicht mehr gegen eine fluechtige
    // Modul-Variable: das Tor schreibt den Journal-Eintrag in schliesseLauf VOR dem
    // Rueckkehren aus fuehreLaufAus (lauf-tor.mjs), darum sieht dieser Check nach einem
    // Lauf immer schon den frischen Stand -- keine Luecke zwischen Bezahlen und Merken.
    if (!darfAutomatischLaufen(signatur, letzteBezahlteSignatur(torJournal(), 'erweiterung'))) return
    fuehreErweiterungslaufAus({ vonHand: false })
  }, Math.max(24, restzeit))
}

// --- Dritter Lauf: die Quellen nach Thema ordnen -----------------------------
// „Quellen nach Thema, von der KI gebildet und benannt; der Mensch kann umbenennen,
// verschieben, Gruppen anlegen — wie bei der Struktur." (Jakob, 7. August 2026)
//
// Dieselbe duenne ctx/DOM-Klammer wie fuehreErweiterungslaufAus: alle Werte SYNCHRON
// vor dem Aufruf einsammeln, die Ablauflogik steckt in versucheQuellenlauf
// (quellenlauf-model.mjs, node-getestet).
//
// Der Lauf haengt am PROJEKT, nicht am Dokument. Deshalb prueft er auch nicht auf ein
// offenes Dokument: die Quellen liegen im Projekt, und ihre Ordnung ist dieselbe,
// gleich welchen Text man gerade vor sich hat.
async function fuehreQuellenlaufAus({ vonHand = false } = {}) {
  const doc = ctx?.activeDoc()
  const project = dokumentProjekt(doc)
  const projectId = project?.id ?? null
  const quellen = Array.isArray(project?.sources) ? [...project.sources] : []
  const verstaendnis = project ? ensureProjectUnderstanding(project) : null
  const bestehendeThemen = project ? ensureQuellenThemen(project).map(thema => ({ ...thema })) : []
  const signatur = quellenSignatur(projectId, quellen)
  // Das Projektwissen gehoert auch in diesen Kanal. Er ging ohne es an den Start und war
  // damit blind; gemeldet hat es die Eigenschafts-Pruefung ueber alle Kanaele
  // (evals/pruefungen/kontext-alle-kanaele.mjs). Fuer die Themenbildung zaehlt vor allem
  // die Textsorte — dieselben zwanzig Quellen ordnen sich fuer eine Seminararbeit anders
  // als fuer einen Werbetext.
  //
  // Direkt durchgereicht statt durch die ergaenzeOndaKontext-Klammer wie bei Hinweis- und
  // Erweiterungslauf: baueQuellenKontext kennt den onda-Parameter, also braucht es die
  // Klammer hier gar nicht erst.
  const ondaWissen = ondaQuellen(doc, project)

  // DER FUENFTE KANAL LAEUFT DURCHS TOR. Genau darum ging es bei Issue #12: die
  // Kopiervorlage "eigene Sperr-Variable + eigene Signatur-Merkliste" war zum fuenften Mal
  // abgeschrieben worden, und system/LEITSTAND.md hat es benannt — dieser Kanal entstand am
  // 8.8., drei Tage NACHDEM der Zweig fertig war, der die vier anderen ablöste.
  //
  // Wie bei den anderen: laeuftBereits/sperreSetzen werden No-ops, die Kanal-Sperre prueft
  // und haelt das Tor. einmalJeSignatur nur bei automatischen Laeufen — von Hand darf man
  // dieselben Quellen erneut ordnen lassen, etwa nachdem man Gruppennamen geaendert hat.
  const ergebnis = await fuehreLaufAus(
    {
      kanal: 'quellen',
      ausloeser: vonHand ? 'hand' : 'oeffnen',
      signatur: `${projectId}:${signatur}`,
      einmalJeSignatur: !vonHand,
    },
    ({ runTask: torRunTask }) => versucheQuellenlauf({
      hatProjekt: Boolean(project),
      istBeispielprojekt: istBeispielDokument(doc) || (project ? istBeispielProjekt(project) : false),
      laeuftBereits: false, // die Kanal-Sperre prueft und haelt das Tor (fuehreLaufAus)
      quellen,
      bestehendeThemen,
      verstaendnis,
      onda: ondaWissen,
      vonHand,
      sperreSetzen: () => {}, // das Modell behaelt seine Parameter fuer die Modell-Tests
      hatSchluessel,
      istNochDasselbeProjekt: () => dokumentProjekt()?.id === projectId,
      beansprucheKostenfreigabe: () => beansprucheAutomatikKosten('quellenthemen', { projectId, grund: vonHand ? 'hand' : 'oeffnen' }),
      runTask: torRunTask,
      setzeAgentStatus,
    }),
  )

  // Wie bei Chat und Erweiterung: das Tor loest kanalGesperrt('quellen') in seinem eigenen
  // finally, also NACH dem letzten Rendern hier. Ohne diesen Nachrender bliebe der
  // Ordnen-Knopf deaktiviert stehen.
  if (ctx) refreshWorkspace()

  if (!ergebnis.gestartet) {
    if (ergebnis.grund === 'monatsbudget-erreicht') {
      zeigeBudgetPause(activeWorkspace())
      persistWorkspace()
      refreshWorkspace()
    }
    return ergebnis
  }
  if (!ergebnis.erfolg) return ergebnis

  // Nach JEDEM erfolgreichen Lauf fortschreiben, gleich welcher Ausloeser ihn startete
  // — sonst sieht das Oeffnen des Fensters gleich darauf dieselbe Quellenmenge als
  // unbekannt an und bezahlt sie ein zweites Mal (Lehre aus dem Erweiterungslauf).
  letzteQuellenSignatur = signatur
  // Das Projekt frisch holen: waehrend des Laufs kann jemand eine Quelle aufgenommen
  // haben. uebernimmThemenvorschlag verwirft Kennungen, die es nicht gibt, von selbst.
  const aktuelles = dokumentProjekt()
  if (aktuelles?.id === projectId) {
    uebernimmThemenvorschlag(aktuelles, ergebnis.gruppen)
    ctx?.persist()
    renderMaterialTree()
  }
  return ergebnis
}

// Der stille Weg: beim Oeffnen des Quellen-Fensters, aber nur, wenn sich die
// Quellenmenge seit dem letzten Lauf ueberhaupt geaendert hat. Ohne diese Sperre
// zahlte jedes Nachschauen einen vollen Durchgang fuer dasselbe Ergebnis.
function ordneQuellenBeiBedarf() {
  const project = dokumentProjekt()
  const signatur = quellenSignatur(project?.id ?? null, project?.sources || [])
  if (!darfAutomatischOrdnen(signatur, letzteQuellenSignatur)) {
    return Promise.resolve({ gestartet: false, grund: 'schon-geordnet' })
  }
  return fuehreQuellenlaufAus({ vonHand: false })
}

// Hier stand `starteErweiterungslauf()` — „Was faellt dir noch ein?", der Weg von Hand.
// Der Knopf dazu sass in der Erweiterungs-Karte der Seitenleiste; die Karte ist am
// 7.8.2026 mit der Flaeche gefallen (Jakob: Erweiterungen kommen ueber Chat oder
// Anmerkung, nicht als Inventar). Der Export blieb stehen und rief niemand mehr auf,
// waehrend der Kommentar darueber weiter einen Griff versprach, den es nicht gab.
// Erweiterungen kommen jetzt ausschliesslich von selbst, beim Aufschauen.

function nextAgentInitiative(workspace) {
  return workspace.agent.messages.find(message => (
    message.status === 'new'
    && !workspace.agent.dismissedIds.includes(message.id)
  )) || null
}

function agentInitiativeBlocked(workspace) {
  return Boolean(
    isComposing
    || workspace.evidenceFindingId
    || hasLocalDepth(workspace)
    || insertMenu,
  )
}

function editorViewIsVisibleFor(documentId) {
  return Boolean(
    documentId
    && ctx?.activeDoc()?.id === documentId
    && document.body.classList.contains('view-editor')
    && document.visibilityState === 'visible',
  )
}

function activateInitiativeDocument(documentId) {
  if (!controller || controller.activeDocumentId === documentId) return
  clearAgentInitiativeTimer()
  pendingParagraphBoundaryDocId = null
  controller.activeDocumentId = documentId || null
  if (documentId) {
    controller.inputByDocument.set(documentId, {
      generation: 0,
      lastInputAt: Number.NaN,
      boundaryAt: Number.NaN,
      boundaryGeneration: null,
      pendingUpdateGeneration: null,
      pendingBoundary: false,
    })
  }
}

function clearHinweislaufTimer() {
  if (hinweislaufTimer) clearTimeout(hinweislaufTimer)
  hinweislaufTimer = null
}

// Auslöser (a): dieselbe Pausen-Erkennung, die bisher nur die Attrappen-Anzeige fuetterte,
// stoesst jetzt den echten Lauf an. Die Entscheidung (ob + nach wie viel ms) liegt PUR und
// node-getestet in pruefePausenAusloeser (hinweislauf-model.mjs); hier werden nur die
// ctx/DOM-gebundenen Werte eingesammelt (Muster wie fuehreHinweislaufAus). Die autoritative
// Gate-Pruefung (inkl. Signatur, Beispielprojekt, Schluessel) bleibt zusaetzlich beim
// tatsaechlichen Start in fuehreHinweislaufAus/versucheHinweislauf -- diese Funktion vermeidet
// nur unnoetige Zeitgeber.
function planeHinweislauf() {
  clearHinweislaufTimer()
  const doc = ctx?.activeDoc()
  const docId = doc?.id || null
  const inputState = initiativeInputState(docId)
  const workspace = activeWorkspace()
  const entscheidung = pruefePausenAusloeser({
    hatDokument: Boolean(doc && workspace),
    istBeispielprojekt: istBeispielDokument(doc),
    laeuftBereits: kanalGesperrt('hinweis'), // Sperre wohnt im Tor (Task 7), nicht mehr in einem lokalen Feld
    hatEingabeStatus: Boolean(inputState),
    lastInputAt: inputState?.lastInputAt,
    editorSichtbar: editorViewIsVisibleFor(docId),
    isComposing,
    leseSignatur: () => seedBodySignature(baueDocText(aktuelleBloecke())),
    letzteSignatur: workspace ? hinweislaufProtokoll(workspace).signatur : null,
    idleMs: AGENT_IDLE_MS,
  })
  if (!entscheidung.planen) return

  const scheduledGeneration = inputState.generation
  hinweislaufTimer = setTimeout(() => {
    hinweislaufTimer = null
    const currentInputState = initiativeInputState(docId)
    if (!currentInputState || currentInputState.generation !== scheduledGeneration) return
    if (!editorViewIsVisibleFor(docId) || isComposing) return
    fuehreHinweislaufAus({ grund: 'pause' })
  }, entscheidung.verzoegerungMs)
}

function scheduleAgentInitiative() {
  clearAgentInitiativeTimer()
  const docId = ctx?.activeDoc()?.id || null
  activateInitiativeDocument(docId)
  planeHinweislauf()
  const workspace = activeWorkspace()
  const message = workspace ? nextAgentInitiative(workspace) : null
  const inputState = initiativeInputState(docId)
  if (
    !workspace
    || !message
    || workspace.agent.open
    || !controller
    || !inputState
    || !Number.isFinite(inputState.lastInputAt)
    || !editorViewIsVisibleFor(docId)
    || isComposing
  ) return

  const now = Date.now()
  const idleRemaining = AGENT_IDLE_MS - (now - inputState.lastInputAt)
  const boundaryRemaining = inputState.boundaryGeneration === inputState.generation
    && Number.isFinite(inputState.boundaryAt)
    ? AGENT_BOUNDARY_IDLE_MS - (now - inputState.boundaryAt)
    : Number.POSITIVE_INFINITY
  const earliestRemaining = (message.earliestAt || 0) - now
  const delay = Math.max(24, Math.min(idleRemaining, boundaryRemaining), earliestRemaining)
  const scheduledGeneration = inputState.generation
  const scheduledMessageId = message.id
  agentInitiativeTimer = setTimeout(() => {
    agentInitiativeTimer = null
    if (!controller || controller.activeDocumentId !== docId || !editorViewIsVisibleFor(docId)) return
    const currentInputState = initiativeInputState(docId)
    if (!currentInputState || currentInputState.generation !== scheduledGeneration) return
    const currentWorkspace = activeWorkspace()
    const currentMessage = currentWorkspace ? nextAgentInitiative(currentWorkspace) : null
    if (!currentWorkspace || !currentMessage || currentMessage.id !== scheduledMessageId) return
    if (agentInitiativeBlocked(currentWorkspace)) {
      agentInitiativeTimer = setTimeout(() => {
        agentInitiativeTimer = null
        scheduleAgentInitiative()
      }, 400)
      return
    }
    if (!shouldOpenAgentWidget({
      now: Date.now(),
      lastInputAt: currentInputState.lastInputAt,
      boundaryAt: currentInputState.boundaryAt,
      boundaryGeneration: currentInputState.boundaryGeneration,
      inputGeneration: currentInputState.generation,
      message: currentMessage,
      dismissedIds: currentWorkspace.agent.dismissedIds,
      documentId: docId,
      activeDocumentId: ctx.activeDoc()?.id,
      isEditorView: document.body.classList.contains('view-editor'),
      visibilityState: document.visibilityState,
      isComposing,
    })) {
      scheduleAgentInitiative()
      return
    }
    currentWorkspace.agent.activeMessageId = currentMessage.id
    currentWorkspace.agent.open = true
    announceAgentStatus(currentMessage.text)
    refreshWorkspace()
    persistWorkspace()
  }, delay)
}

export function refreshWorkspace({ reconcileEditing = false } = {}) {
  if (!ctx) return
  const doc = ctx.activeDoc()
  const workspace = activeWorkspace()
  if (!doc || !workspace) return
  if (reconcileEditing) reconcilePersistedEditingFinding()
  enforceExclusiveLayers(workspace)

  const ui = elements()
  const project = dokumentProjekt(doc)
  const backLabel = ui.back?.querySelector('.onda-side-back-label')
  if (backLabel) backLabel.textContent = project?.name || 'Projekt'

  ui.view?.classList.toggle('is-agent-open', workspace.agent.open)
  ui.view?.classList.toggle('is-evidence-open', Boolean(workspace.evidenceFindingId))
  // Die ruhige Lage: der Stift ist abgelegt, es kommt keine Anmerkung mehr. Dann traegt
  // der Rand rechts nichts und schiebt den Text bloss aus der Mitte — er faellt weg,
  // der Text bleibt gleich breit und rueckt in die Mitte. Es haengt bewusst allein am
  // Stift und nicht daran, ob GERADE eine Anmerkung ansteht: sonst wanderte der Text
  // bei jeder kommenden und gehenden Anmerkung hin und her.
  ui.view?.classList.toggle('is-still', Boolean(workspace.quietAnnotations))

  setLayerVisibility(ui.agentWidget, workspace.agent.open)
  // Direkt danach, im selben Bild: die Kontur misst das eben sichtbar gewordene
  // Fenster. Vorher waere es noch versteckt und nicht messbar.
  blaseFolgt(workspace.agent.open)
  ui.agentPresence?.setAttribute('aria-expanded', String(workspace.agent.open))
  applyAuraState()
  setLayerVisibility(ui.evidenceWindow, Boolean(workspace.evidenceFindingId))
  const localPaused = Boolean(workspace.agent.open || workspace.evidenceFindingId)
  ui.localLayer?.classList.toggle('is-paused', localPaused)
  ui.localLayer?.setAttribute('aria-hidden', String(localPaused))

  const activeBlockId = syncActiveBlock(workspace)
  if (decoratedDocId !== doc.id || decoratedBlockId !== activeBlockId) {
    decoratedDocId = doc.id
    decoratedBlockId = activeBlockId
    ctx.editor.view.dispatch(ctx.editor.state.tr.setMeta(activeBlockKey, activeBlockId))
  }

  pruefeVerstaendnisInterview()
  renderStructureNav()
  renderErweiterungen()
  renderErkanntes()
  planeMomentwechsel()
  planeErweiterungslauf()
  renderProjectUnderstandingCard()
  renderMaterialEntry()
  renderMaterialTree()
  syncThemeToggle()
  renderAnnotationPresence()
  renderLocalFinding()
  renderAgentWidget()
  renderEvidenceWindow()
  scheduleAgentInitiative()
}

export function initWorkspace(context) {
  controller?.destroy()
  lastContext = context
  ctx = context
  annotationController = createAnnotationController({
    getFindings: () => {
      const doc = ctx?.activeDoc()
      return doc ? visiblePassageFindingRecords(doc, aktuelleBloecke()).map(record => record.finding) : []
    },
    getWorkspace: () => activeWorkspace(),
    persist: () => persistWorkspace(),
    accept: finding => applySemanticFinding(finding, { refresh: false, restoreFocus: false }),
    undo: operation => undoSemanticOperation(operation),
  })
  ctx.editor.registerPlugin(activeBlockPlugin())
  ctx.editor.registerPlugin(localFindingPlugin())
  const ui = elements()
  const cleanups = []

  const listen = (target, type, handler, options) => {
    if (!target) return
    target.addEventListener(type, handler, options)
    cleanups.push(() => target.removeEventListener(type, handler, options))
  }

  const listenEditor = (type, handler) => {
    ctx.editor.on(type, handler)
    cleanups.push(() => ctx?.editor?.off(type, handler))
  }

  const closeTopLayer = () => {
    const workspace = activeWorkspace()
    if (!workspace) return false
    if (workspace.suggestionFindingId) {
      const findingId = workspace.suggestionFindingId
      workspace.suggestionFindingId = null
      requestLocalSummaryFocus(findingId)
    } else if (workspace.expandedFindingId) {
      const findingId = workspace.expandedFindingId
      workspace.expandedFindingId = null
      workspace.suggestionFindingId = null
      workspace.localThreadFindingId = null
      requestLocalSummaryFocus(findingId)
    } else if (closeInsertMenu()) {
      return true
    } else if (workspace.evidenceFindingId) {
      return closeEvidenceWindow()
    } else if (workspace.agent.open) {
      const message = activeAgentMessage(workspace)
      if (message) dismissAgentMessage(workspace, message.id)
      else workspace.agent.open = false
      agentPresenceFocusRequest = true
    } else {
      return false
    }
    refreshWorkspace()
    persistWorkspace()
    return true
  }

  const instance = {
    activeDocumentId: null,
    inputByDocument: new Map(),
    destroyed: false,
    closeTopLayer,
    invalidateInitiative(options) {
      invalidateAgentInitiative(options)
    },
    snapshot() {
      const state = initiativeInputState(instance.activeDocumentId)
      return {
        activeDocumentId: instance.activeDocumentId,
        inputGeneration: state?.generation || 0,
        lastInputAt: state?.lastInputAt ?? Number.NaN,
        boundaryAt: state?.boundaryAt ?? Number.NaN,
        boundaryGeneration: state?.boundaryGeneration ?? null,
      }
    },
  }
  controller = instance
  activateInitiativeDocument(ctx.activeDoc()?.id || null)

  const onBack = () => {
    invalidateAgentInitiative({ requireNewInput: true })
    ctx.flushSave()
    ctx.showHomeView()
  }
  const onAgentPresence = () => {
    const workspace = activeWorkspace()
    if (!workspace) return
    const opening = !workspace.agent.open
    if (!opening) {
      closeAgentWidget()
      return
    }
    workspace.agent.open = true
    activeAgentMessage(workspace)
    workspace.evidenceFindingId = null
    closeLocalDepth(workspace)
    closeInsertMenu({ restoreFocus: false })
    refreshWorkspace()
    persistWorkspace()
  }

  // EIN Knopf fuer beide Richtungen, fest am Fenster. Zwei Knoepfe konnten nie an
  // derselben Stelle stehen: sie hingen in zwei verschiedenen Kaesten, auf zwei
  // verschiedenen Hoehenbaendern, und der eine Kasten wandert beim Einklappen um die
  // volle Breite der Leiste.
  const applySidebarCollapsed = collapsed => {
    ui.view?.classList.toggle('is-sidebar-collapsed', collapsed)
    const wort = collapsed ? 'Seitenleiste einblenden' : 'Seitenleiste einklappen'
    ui.toggle?.setAttribute('aria-expanded', String(!collapsed))
    ui.toggle?.setAttribute('aria-label', wort)
    if (ui.toggle) ui.toggle.title = wort
    ui.toggle?.replaceChildren(ondaIcon(collapsed ? 'chevron-right' : 'chevron-left', { size: 18 }))
    // Eingeklappt heisst auch: nicht mehr ertastbar. Ohne das wanderte der Fokus durch
    // die unsichtbaren Bedienelemente der weggeschobenen Leiste, und wer mit der
    // Tastatur arbeitet, verlore ihn scheinbar ins Nichts.
    if (ui.sidebar) ui.sidebar.inert = collapsed
  }
  const setSidebarCollapsed = collapsed => {
    if (Boolean(ctx.state.settings.sidebarCollapsed) !== collapsed) {
      ctx.state.settings.sidebarCollapsed = collapsed
      ctx.persist()
    }
    applySidebarCollapsed(collapsed)
  }
  // Die Richtung kommt aus dem, was zu SEHEN ist, nicht aus der Einstellung. Auf
  // schmalen Ansichten klappt die Shell die Leiste selbst ein (onda-shell.mjs), ohne
  // die Einstellung anzufassen — beides lief auseinander, und ein Druck auf die Klinke
  // tat dann scheinbar nichts.
  const onSidebarToggle = () => setSidebarCollapsed(!ui.view?.classList.contains('is-sidebar-collapsed'))
  applySidebarCollapsed(Boolean(ctx.state.settings.sidebarCollapsed))
  setzeSeitenBaum('struktur', seitenBaeume.struktur)
  setzeSeitenBaum('quellen', seitenBaeume.quellen)

  // Das eine, was vom Bedienteil blieb: aus- und einblenden. Es haengt am Stift-Zeichen
  // in der Topbar (docs/PHILOSOPHIE.md §1).
  //
  // Mit der Leiste gingen vier Handlungen: vor und zurueck zwischen Anmerkungen, die
  // Sammeluebernahme sicherer Korrekturen und der Wechsel des Arbeitsmodus. Sie
  // wandern NICHT woandershin — sie sind fort. Wer neben dir schreibt, gibt dir keine
  // Vor-Zurueck-Tasten fuer seine Anmerkungen.
  //
  // Rueckgaengig ist die Ausnahme: es blieb, aber als Taste statt als Knopf, siehe
  // handleAnmerkungRueckgaengig().
  const toggleQuietAnnotations = () => {
    const workspace = activeWorkspace()
    annotationController?.setQuiet(!workspace?.quietAnnotations)
    refreshWorkspace()
  }
  document.querySelector('.onda-side-back-chevron')?.replaceChildren(ondaIcon('arrow-left', { size: 16 }))
  document.getElementById('kiSettings')?.replaceChildren(ondaIcon('settings', { size: 18 }))

  // Die beiden Zeigerhorcher am Absatz gab es nur, damit das Plus beim Ueberfahren
  // auftauchte. Ohne Plus horcht hier niemand mehr mit.
  const onEditorScroll = () => {
    closeInsertMenu({ restoreFocus: false })
    if (localDecoratedBlockId) scheduleLocalPosition(localDecoratedBlockId)
  }
  const onShelfScroll = () => {
    closeInsertMenu({ restoreFocus: false })
  }
  const onResize = () => {
    closeInsertMenu({ restoreFocus: false })
    if (localDecoratedBlockId) scheduleLocalPosition(localDecoratedBlockId)
  }
  const onViewChange = event => {
    if (event.detail?.view !== 'editor') {
      invalidateAgentInitiative({ requireNewInput: true })
      return
    }
    activateInitiativeDocument(ctx.activeDoc()?.id || null)
    scheduleAgentInitiative()
    fuehreHinweislaufAus({ grund: 'oeffnen' })
  }
  const onVisibilityChange = () => {
    if (document.visibilityState !== 'visible') {
      invalidateAgentInitiative({ requireNewInput: true })
      return
    }
    scheduleAgentInitiative()
  }

  const onSelectionUpdate = () => {
    const workspace = activeWorkspace()
    const activeBlockId = getActiveBlockId(ctx.editor)
    if (!workspace || !activeBlockId || workspace.activeBlockId === activeBlockId) {
      refreshWorkspace()
      return
    }
    workspace.activeBlockId = activeBlockId
    refreshWorkspace()
    persistWorkspace()
  }
  const onEditorUpdate = () => {
    completeRealEditorUpdate()
    reconcilePersistedEditingFinding()
    refreshWorkspace()
  }

  listen(ui.back, 'click', onBack)
  // Zwei Wege zur Übersicht, weil beide erwartbar sind: der Pfeil unten links und der
  // Name oben links. Derselbe Weg, nicht zwei verschiedene.
  listen(document.getElementById('ondaHome'), 'click', onBack)
  listen(ui.agentPresence, 'click', onAgentPresence)
  listen(ui.toggle, 'click', onSidebarToggle)
  // Zwei Gesten, klar getrennt: der Name oeffnet das Fenster, der Pfeil klappt den
  // Baum. Ein Knopf, der beides taete, koennte keins von beidem ankuendigen.
  listen(ui.structureTree, 'click', () => setzeSeitenBaum('struktur', !seitenBaeume.struktur))
  listen(ui.materialTreeToggle, 'click', () => setzeSeitenBaum('quellen', !seitenBaeume.quellen))
  listen(document.getElementById('structureOpen'), 'click', event => openStrukturModal(event.currentTarget))
  listen(ctx.editor.view.dom, 'keydown', handleEditorKeyDown, true)
  listen(ctx.editor.view.dom, 'beforeinput', handleBeforeInput)
  listen(ctx.editor.view.dom, 'compositionstart', startComposition)
  listen(ctx.editor.view.dom, 'compositionend', endComposition)
  listen(ui.scroll, 'scroll', onEditorScroll, { passive: true })
  listen(ui.sidebar, 'scroll', onShelfScroll, { passive: true })
  listen(window, 'resize', onResize)
  listen(document, 'aiwt:viewchange', onViewChange)
  listen(document, 'visibilitychange', onVisibilityChange)
  listen(document.getElementById('title'), 'input', refreshWorkspace)
  listen(document.getElementById('pvCard'), 'click', event => openProjectUnderstandingModal(event.currentTarget))
  listen(document.getElementById('materialSources'), 'click', event => openProjectSourcesModal(event.currentTarget))
  listen(document.getElementById('themeToggle'), 'click', toggleTheme)
  listen(document.getElementById('kiSettings'), 'click', event => openKiSettingsDialog(event.currentTarget))
  // Ein einziger Zuhoerer fuer Anmerkungen. Frueher waren es acht — vor, zurueck,
  // ruhig, Sammeluebernahme, rueckgaengig, Entscheidung zuruecknehmen und zwei fuer
  // den Arbeitsmodus. Sie hingen alle an der Leiste ueber dem Text, und die Leiste ist
  // fort (docs/PHILOSOPHIE.md §1 "Der andere Stift").
  listen(document.getElementById('annotationPresence'), 'click', toggleQuietAnnotations)
  listenEditor('selectionUpdate', onSelectionUpdate)
  listenEditor('update', onEditorUpdate)

  cleanups.push(blaseBeobachten())

  // Status-Abo: Statuszeile und Aura folgen dem echten Agenten-Zustand.
  cleanups.push(beiAgentStatus(() => {
    renderAgentStatuszeile()
    applyAuraState()
  }))
  pruefeAgentVerbindung()

  instance.destroy = () => {
    if (instance.destroyed) return
    instance.destroyed = true
    clearAgentInitiativeTimer()
    clearHinweislaufTimer()
    clearErweiterungslaufTimer()
    clearMomentTimer()
    closeInsertMenu({ restoreFocus: false })
    closeOndaDialog({ restoreFocus: false })
    cleanups.splice(0).reverse().forEach(cleanup => cleanup())

    if (chatStream?.flushTimer) clearTimeout(chatStream.flushTimer)
    chatStream = null
    if (localPositionFrame) cancelAnimationFrame(localPositionFrame)
    if (agentLiveFrame) cancelAnimationFrame(agentLiveFrame)

    context.editor.unregisterPlugin(activeBlockKey)
    context.editor.unregisterPlugin(localFindingKey)
    elements().localLayer?.replaceChildren()
    elements().agentWidget?.replaceChildren()
    elements().agentWidget?.classList.remove('hat-kontur', 'waechst', 'faellt-zurueck')
    elements().evidenceWindow?.replaceChildren()
    blaseAntriebAbbrechen()
    blaseBeobachter?.disconnect()
    blaseBeobachter = null
    blaseKontur = null
    blaseSteht = null
    blaseFaeltZurueck = false
    blaseZeigen(elements().blase, false)

    if (window.__workspaceCloseTopLayer === closeTopLayer) delete window.__workspaceCloseTopLayer
    if (controller === instance) controller = null
    annotationController = null
    if (ctx === context) ctx = null

    renderedDocId = null
    decoratedDocId = null
    decoratedBlockId = null
    isComposing = false
    structureNavState = null
    localDecoratedDocId = null
    localDecoratedFindingId = null
    localDecoratedBlockId = null
    localDecoratedSpacing = 0
    localDecoratedAbsatzweit = false
    localDecoratedGestalt = 'keine'
    localDecoratedZiel = ''
    localDecoratedOrtswechsel = ''
    localFeedbackError = null
    localPositionFrame = null
    localSummaryFocusRequest = null
    evidenceFocusRequest = false
    evidenceReturnFindingId = null
    riskConfirmationFocusRequest = false
    pendingParagraphBoundaryDocId = null
    agentLiveFrame = null
    agentPresenceFocusRequest = false
    interviewPruefKey = null
    // Keine interviewLaufAktiv-Rueckstellung mehr: die Sperre lebt im Lauf-Tor
    // (lauf-tor.mjs), dessen eigenes finally sie freigibt, sobald der laufende
    // Aufruf zurueckkehrt — auch wenn dieser Workspace vorher zerstoert wurde.
    interviewStatus = null
    pausierterAutomatiklauf = null
  }

  window.__workspaceCloseTopLayer = closeTopLayer
  refreshWorkspace({ reconcileEditing: true })
  // Auslöser (b) beim Workspace-Aufbau selbst (z.B. Neuladen der App mitten im Dokument):
  // onViewChange greift nur bei einem ECHTEN 'aiwt:viewchange'-Ereignis (openDoc & Co.), nicht
  // beim initialen Aufbau der bereits aktiven Ansicht.
  if (editorViewIsVisibleFor(ctx.activeDoc()?.id)) fuehreHinweislaufAus({ grund: 'oeffnen' })
  return instance
}

export const __workspaceTestBridge = {
  destroy() {
    controller?.destroy()
  },
  reinitialize() {
    if (!lastContext) return null
    return initWorkspace(lastContext)
  },
  invalidateInitiative() {
    controller?.invalidateInitiative({ requireNewInput: true })
  },
  injectFinding(finding) {
    const doc = ctx?.activeDoc()
    if (!doc || !finding || typeof finding !== 'object') return null
    ensureReasoningModel(doc)
    doc.findings.push(finding)
    activeWorkspace().activeAnnotationId = finding.id || null
    momentVonHand = true
    refreshWorkspace()
    return finding
  },
  snapshot() {
    return controller?.snapshot() || {
      activeDocumentId: null,
      inputGeneration: 0,
      lastInputAt: Number.NaN,
      boundaryAt: Number.NaN,
      boundaryGeneration: null,
    }
  },
  // Wem gehoert Befehl+Z gerade? Sonst nicht von aussen zu sehen, und genau daran haengt,
  // ob eine Ruecknahme die Anmerkung trifft oder das eigene Schreiben.
  gehoertRueckgaengigDerAnmerkung() {
    return letzteAenderungWarAnmerkung
  },
  // Das Einfuege-Menue hat seit dem 7. August 2026 keinen sichtbaren Oeffner mehr — das
  // Plus am Absatz ist fort (docs/PHILOSOPHIE.md §1, und Jakob verstand es schlicht
  // nicht). Sein Platz wird die Struktur-Ansicht sein, in der Bausteine hinzukommen
  // duerfen.
  //
  // Bis dahin haenge das Menue nicht ungetestet in der Luft: sein Verhalten —
  // Tastaturweg, Fokusrueckgabe, Einfuegen an der richtigen Stelle — ist lebender Code
  // und wird weiter geprueft. Dieser Zugang ist die Klinke dafuer, sonst nichts.
  oeffneEinfuegeMenue(afterBlockId, opener = null) {
    const blockId = afterBlockId || activeWorkspace()?.activeBlockId
    if (!blockId) return null
    openInsertMenu(blockId, opener || document.activeElement || ctx?.editor?.view?.dom || null)
    return document.querySelector('.semantic-insert-menu')
  },
}
