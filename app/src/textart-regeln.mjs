// Welche Hinweisart ist eine Integritätsfrage? — PUR, node-testbar, kein DOM, kein Netz.
//
// Die Frage, die dieses Modul beantwortet: WELCHE der acht Hinweisarten sind bei DIESER
// Textart Integritätsfragen? Nicht: welche Hinweise es gibt. Das sind zwei verschiedene
// Dinge, und sie wurden bisher verwechselt.
//
// Eine Integritätsfrage ist eine, die durch bloßes Verwerfen nicht verschwindet: Wer sie
// wegklickt, nimmt ein Risiko bewusst an (reasoning-model.mjs decideFinding -> 'risk-accepted',
// workspace.js beschriftet den Knopf dann auch so), und das Finding trägt die zu belegende
// Aussage als claim mit (agent-findings.mjs hinweisZuFinding).
//
// Vorher waren es vier feste Arten — fakt, quelle, methode, logik — für jeden Text, egal
// welchen. Bei einer wissenschaftlichen Hausarbeit stimmt das. Bei einem Plakattext aus sechs
// Wörtern ist eine fehlende Quellenangabe keine Nachlässigkeit, sondern die Form: Ein Plakat
// hat für eine Fußnote keinen Platz. Trotzdem wurde das Verwerfen dort zum "bewusst
// angenommenen Risiko" — eine Mahnung für ein Versprechen, das niemand gegeben hat.
//
// Die Regel dahinter: Eine Integritätsfrage ist die Frage danach, was ein Text seinem
// Publikum SCHULDET. Was er schuldet, hängt an der Textart.
//
import { LANGUAGE_GENRES } from './language-profile.mjs'

// Die Textarten sind KEINE eigene Liste: es sind die des Sprachprofils, unverändert
// weitergereicht. Zwei Listen wären zwei Wahrheiten, und eine davon wäre immer veraltet.
export const TEXTARTEN = LANGUAGE_GENRES

// Der vorsichtige Fall — und zugleich der Stand von vorher. Er gilt überall dort, wo die
// Textart unbekannt oder gar nicht angegeben ist: fail-closed. Niemand verliert eine
// Sicherung, weil ein Feld leer geblieben ist.
export const STANDARD_INTEGRITAET = Object.freeze(['fakt', 'quelle', 'methode', 'logik'])

// Die vollständige Tabelle: neun Textarten, je eine Auswahl aus den acht Hinweisarten.
// Die acht Arten stammen aus dem Schema (agent-tasks.mjs HINWEISE_SCHEMA, kategorie.enum);
// die neun Textarten aus dem Sprachprofil (language-profile.mjs LANGUAGE_GENRES).
export const TEXTART_INTEGRITAET = Object.freeze({
  scientific: Object.freeze(['fakt', 'quelle', 'methode', 'logik']),
  essay: Object.freeze(['fakt', 'quelle', 'logik']),
  project: Object.freeze(['fakt', 'quelle', 'methode', 'logik']),
  web: Object.freeze(['fakt', 'quelle']),
  marketing: Object.freeze(['fakt']),
  campaign: Object.freeze(['fakt']),
  // Prosa erfindet, und das ist ihr Zweck. Eine erfundene Tatsache ist dort keine
  // Unwahrheit, sondern das Handwerk. Was bleibt, ist die innere Stimmigkeit: ein
  // Bruch im Gedankengang zerstoert auch eine erfundene Welt.
  prosa: Object.freeze(['logik']),
  // Lyrik darf auch das noch: ein Widerspruch kann dort die Form sein. Es bleibt
  // KEINE Integritaetsfrage uebrig -- jeder Hinweis ist hier ein Angebot, keines
  // ist eine Forderung.
  lyrik: Object.freeze([]),
  other: Object.freeze(['fakt', 'quelle', 'methode', 'logik']),
})

export const TEXTART_BEGRUENDUNG = Object.freeze({
  scientific: 'Eine wissenschaftliche Arbeit lebt von ihrer Nachprüfbarkeit. Tatsache, Beleg, '
    + 'Methode und Schluss binden hier alle vier — was sich nicht prüfen lässt, trägt nicht.',
  essay: 'Ein Essay darf zuspitzen und muss nichts beweisen. Falsch behaupten oder falsch '
    + 'zitieren darf er trotzdem nicht, und sein Gedankengang muss halten. Die Methodenfrage '
    + 'läuft leer, wo keine Daten ausgewertet werden.',
  prosa: 'Prosa erfindet, und genau das ist ihr Zweck — eine erfundene Tatsache ist dort '
    + 'kein Verstoß, sondern das Handwerk. Was bindet, ist die innere Stimmigkeit: ein Bruch '
    + 'im Gedankengang zerstört auch eine erfundene Welt.',
  lyrik: 'In einem Gedicht kann ein Widerspruch die Form sein. Hier bindet nichts — jeder '
    + 'Hinweis ist ein Angebot, keiner eine Forderung. Das ist die einzige Textart, in der '
    + 'Onda gar keine Integritätsfrage kennt.',
  project: 'Ein Projekttext trägt Entscheidungen. Wer auf falschen Zahlen, ungeprüfter Herkunft '
    + 'oder einem zu weiten Schluss entscheidet, entscheidet falsch — alle vier bleiben.',
  web: 'Ein Webtext behauptet öffentlich und bleibt stehen. Falsche Tatsachen und erfundene '
    + 'Belege wiegen deshalb schwer; eine Herleitung aus Daten erwartet dort niemand.',
  marketing: 'Ein Marketingtext darf werben, zuspitzen und weglassen. Eine falsche '
    + 'Tatsachenbehauptung bleibt trotzdem falsch — das ist die eine Grenze, die auch Werbung '
    + 'nicht verschieben darf.',
  campaign: 'Ein Plakat- oder Kampagnentext hat für eine Fußnote keinen Platz und für eine '
    + 'Herleitung erst recht nicht. Was bleibt, ist die eine Grenze: Was dort steht, muss wahr sein.',
  other: 'Solange die Textart nicht feststeht, gilt der vorsichtige Fall — alle vier bleiben. '
    + 'Eine Sicherung fällt nicht weg, nur weil eine Angabe fehlt.',
})

// Die Findings sprechen Englisch (reasoning-model.mjs: fact/source/citation/method/logic),
// die Hinweisarten Deutsch. citation und quelle sind dieselbe Frage ("Quelle und Zitation"),
// darum fallen beide auf quelle. 'content' fehlt bewusst: es steht für zwei Arten (wirkung
// UND erklaerung) und ist nie eine Integritätsfrage — die Doppeldeutigkeit kostet hier nichts.
export const CATEGORY_ZU_ART = Object.freeze({
  fact: 'fakt',
  source: 'quelle',
  citation: 'quelle',
  method: 'methode',
  logic: 'logik',
  structure: 'struktur',
  wording: 'sprache',
})

// Nachschlagen über hasOwnProperty statt direkt: sonst liefert der Zugriff auf 'constructor'
// oder 'toString' eine geerbte Funktion statt undefined, und aus der Fail-closed-Regel würde
// ein Absturz.
function eigenerWert(tabelle, schluessel) {
  const name = String(schluessel ?? '').trim()
  if (!name) return null
  return Object.prototype.hasOwnProperty.call(tabelle, name) ? tabelle[name] : null
}

// Welche Arten sind bei dieser Textart Integritätsfragen? Unbekannte oder fehlende Textart
// ergibt immer die vier — fail-closed.
export function integritaetsArten(textart) {
  return eigenerWert(TEXTART_INTEGRITAET, textart) || STANDARD_INTEGRITAET
}

export function istIntegritaetsfrage(textart, art) {
  const gesucht = String(art ?? '').trim()
  if (!gesucht) return false
  return integritaetsArten(textart).includes(gesucht)
}

// Hat die Textart diese Art aktiv abgeräumt? Nur wahr, wenn sie ohne Textart eine
// Integritätsfrage WÄRE und die Textart sie ausschließt. Der Unterschied zu "ist keine
// Integritätsfrage" zählt an genau einer Stelle: Das Modell darf eine Art zusätzlich als
// Integritätsfrage melden, aber keine zurückholen, die die Textart gerade ausgeschlossen hat
// (agent-findings.mjs). Sonst hätte ein Plakattext weiterhin Quellenfragen, nur weil der
// Prompt dem Modell integritaet:true für quelle nahelegt.
export function istVonDerTextartAusgeschlossen(textart, art) {
  const gesucht = String(art ?? '').trim()
  if (!gesucht) return false
  return STANDARD_INTEGRITAET.includes(gesucht) && !istIntegritaetsfrage(textart, gesucht)
}

// Dieselbe Frage in der Sprache der Findings (category statt kategorie).
export function istIntegritaetsfrageFuerCategory(textart, category) {
  const art = eigenerWert(CATEGORY_ZU_ART, category)
  return art ? istIntegritaetsfrage(textart, art) : false
}

// Die Tabelle als Daten, für Oberfläche und Dokumentation — damit die Begründung an genau
// einer Stelle steht und nicht im Text daneben noch einmal. Läuft über TEXTARTEN, nicht über
// die eigenen Schlüssel: Eine im Sprachprofil neu hinzugekommene Textart taucht dadurch sofort
// auf, mit den strengen vier, statt still zu fehlen.
export function textartTabelle() {
  return TEXTARTEN.map(textart => ({
    textart,
    arten: integritaetsArten(textart),
    begruendung: eigenerWert(TEXTART_BEGRUENDUNG, textart) || TEXTART_BEGRUENDUNG.other,
  }))
}
