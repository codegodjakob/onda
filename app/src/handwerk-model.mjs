// Eine Quelle fuer das Handwerk pro Textart — PUR, node-testbar, ohne DOM.
//
// Bisher lagen drei Wahrheiten nebeneinander: Integritaet in textart-regeln.mjs,
// Stilmittel in stilmittel.mjs und eine blosse Bezeichnung in onda-kontext.mjs. Dieses
// Modul ersetzt keine dieser fachlich tieferen Tabellen. Es projiziert sie zusammen mit
// Ziel, Prioritaeten und Prueffragen zu genau dem kompakten Arbeitsauftrag, den ein Lauf
// fuer die aktuell gewaehlte Textart braucht.

import { LANGUAGE_GENRES } from './language-profile.mjs'
import { integritaetsArten } from './textart-regeln.mjs'
import { textartName, tragendeStilmittel } from './stilmittel.mjs'

const EINTRAEGE = {
  scientific: {
    ziel: 'Eine nachprüfbare Erkenntnis so darstellen, dass Behauptung, Methode und Beleg voneinander unterscheidbar bleiben.',
    prioritaeten: ['begriffliche Präzision', 'nachvollziehbare Belegkette', 'begrenzte Schlussfolgerungen'],
    prueffragen: ['Ist jede tragende Aussage belegt oder als Annahme markiert?', 'Trägt die beschriebene Methode genau diesen Schluss?', 'Sind Gegenbefunde und Grenzen sichtbar?'],
    fehlformen: ['Autoritätssprache ersetzt einen Beleg', 'die Schlussfolgerung reicht weiter als die Methode'],
    direktivitaet: 'streng',
  },
  essay: {
    ziel: 'Einen eigenständigen Gedanken entfalten, dessen Bewegung, Spannung und Gegenposition für Leserinnen und Leser nachvollziehbar bleibt.',
    prioritaeten: ['gedankliche Bewegung', 'erkennbare eigene Position', 'produktive Gegenposition'],
    prueffragen: ['Entwickelt sich der Gedanke oder wird nur dieselbe These variiert?', 'Wird eine ernsthafte Gegenposition aufgenommen?', 'Trägt die sprachliche Spannung den Gedanken?'],
    fehlformen: ['Bildungsgeste ohne gedankliche Folge', 'Zuspitzung verdeckt eine logische Lücke'],
    direktivitaet: 'beratend',
  },
  project: {
    ziel: 'Eine Entscheidung oder ein gemeinsames Vorgehen so vorbereiten, dass Ausgangslage, Optionen und Folgen handlungsfähig machen.',
    prioritaeten: ['klare Entscheidungslage', 'prüfbare Annahmen', 'Verantwortung und nächster Schritt'],
    prueffragen: ['Welche Entscheidung soll nach diesem Abschnitt möglich sein?', 'Sind Annahmen, Optionen und Folgen getrennt?', 'Ist erkennbar, wer als Nächstes was tut?'],
    fehlformen: ['Aktivität wird mit Ergebnis verwechselt', 'ein nächster Schritt hat keinen Verantwortlichen'],
    direktivitaet: 'streng',
  },
  web: {
    ziel: 'Menschen am Bildschirm schnell orientieren und ihnen eine klare, glaubwürdige nächste Handlung ermöglichen.',
    prioritaeten: ['sofortige Orientierung', 'scanbare Informationsfolge', 'klare nächste Handlung'],
    prueffragen: ['Versteht man Zweck und Nutzen im ersten sichtbaren Abschnitt?', 'Tragen Überschriften die Informationsstruktur?', 'Ist die nächste Handlung eindeutig und erwartbar?'],
    fehlformen: ['Vorspann ohne Informationswert', 'mehrere gleich laute Handlungsaufforderungen'],
    direktivitaet: 'beratend',
  },
  marketing: {
    ziel: 'Einen relevanten Nutzen glaubwürdig und unterscheidbar machen, ohne Behauptung und Wunschbild zu verwechseln.',
    prioritaeten: ['konkreter Kundennutzen', 'glaubwürdige Differenzierung', 'passendes Register'],
    prueffragen: ['Ist der Nutzen konkret oder nur positiv etikettiert?', 'Wodurch unterscheidet sich das Angebot tatsächlich?', 'Bleibt jede Tatsachenbehauptung überprüfbar?'],
    fehlformen: ['Superlativ ohne unterscheidbaren Grund', 'Pathos leiht einem dünnen Nutzen Wirkung'],
    direktivitaet: 'beratend',
  },
  campaign: {
    ziel: 'Eine einzige Botschaft in knapper Form verständlich, wahr und erinnerbar machen.',
    prioritaeten: ['eine Botschaft', 'Einprägsamkeit', 'unmittelbare Verständlichkeit'],
    prueffragen: ['Bleibt nach einem Blick genau eine Botschaft?', 'Trägt die Form die Aussage statt sie nur zu schmücken?', 'Kann die Zuspitzung als falsche Angabe gelesen werden?'],
    fehlformen: ['mehrere Botschaften konkurrieren', 'Klang verdeckt eine unklare Aussage'],
    direktivitaet: 'beratend',
  },
  prosa: {
    ziel: 'Eine erzählte Welt durch Szene, Figur, Perspektive und Rhythmus als stimmige Erfahrung entstehen lassen.',
    prioritaeten: ['konkrete Szene', 'stimmige Perspektive', 'Figurenhandlung mit Folge'],
    prueffragen: ['Erlebt die Figur etwas oder erklärt der Text es nur?', 'Bleibt die Erzählperspektive absichtsvoll geführt?', 'Verändert die Szene Figur, Beziehung oder Erwartung?'],
    fehlformen: ['Erklärung ersetzt eine mögliche Szene', 'Figuren handeln nur für die Botschaft des Textes'],
    direktivitaet: 'offen',
  },
  lyrik: {
    ziel: 'Verdichtete Sprache als eigenständige Form arbeiten lassen, in der Klang, Bild, Rhythmus und Leerstelle Bedeutung erzeugen.',
    prioritaeten: ['sprachliche Verdichtung', 'tragende Form', 'produktive Mehrdeutigkeit'],
    prueffragen: ['Erzeugt die Form eine Bedeutung, die der Prosasatz nicht hätte?', 'Ist die Mehrdeutigkeit produktiv oder nur unbestimmt?', 'Trägt jede Wiederholung oder Leerstelle hörbar etwas bei?'],
    fehlformen: ['Zeilenbruch simuliert Verdichtung', 'ein vertrautes Bild ersetzt eine eigene Wahrnehmung'],
    direktivitaet: 'offen',
  },
  other: {
    ziel: 'Den Text an seiner ausdrücklich genannten Absicht prüfen, ohne eine unbestimmte Textart durch eigene Annahmen zu ersetzen.',
    prioritaeten: ['Absicht der Autorin oder des Autors', 'innere Stimmigkeit', 'ehrliche Grenzen des Urteils'],
    prueffragen: ['Was soll dieser Text für sein Publikum leisten?', 'Welche Regel folgt aus der tatsächlichen Absicht statt aus einer geratenen Textart?'],
    fehlformen: ['eine Textart wird still unterstellt', 'allgemeiner Geschmack wird als Regel ausgegeben'],
    direktivitaet: 'offen',
  },
}

export const HANDWERK_PRO_TEXTART = Object.freeze(Object.fromEntries(
  LANGUAGE_GENRES.map(genre => [genre, Object.freeze({
    ...EINTRAEGE[genre],
    prioritaeten: Object.freeze([...EINTRAEGE[genre].prioritaeten]),
    prueffragen: Object.freeze([...EINTRAEGE[genre].prueffragen]),
    fehlformen: Object.freeze([...EINTRAEGE[genre].fehlformen]),
  })]),
))

function sauber(wert) {
  return typeof wert === 'string' ? wert.trim() : ''
}

function aktiveStilfassung(activeStyle) {
  if (!activeStyle || typeof activeStyle !== 'object') return null
  const name = sauber(activeStyle.name)
  const purpose = sauber(activeStyle.purpose)
  const rules = Array.isArray(activeStyle.rules)
    ? [...new Set(activeStyle.rules.map(regel => sauber(regel)).filter(Boolean))].slice(0, 6)
    : []
  return name || purpose || rules.length ? { name, purpose, rules } : null
}

export function projiziereHandwerk({ genre = '', passageFunction = '', activeStyle = null } = {}) {
  const bekannt = LANGUAGE_GENRES.includes(sauber(genre)) && genre !== 'other'
  const schluessel = bekannt ? genre : 'other'
  const basis = HANDWERK_PRO_TEXTART[schluessel]
  return {
    genre: schluessel,
    name: bekannt ? textartName(schluessel) : '',
    ziel: basis.ziel,
    prioritaeten: [...basis.prioritaeten],
    prueffragen: [...basis.prueffragen],
    fehlformen: [...basis.fehlformen],
    direktivitaet: basis.direktivitaet,
    integritaetsArten: [...integritaetsArten(schluessel)],
    tragendeStilmittel: bekannt
      ? tragendeStilmittel(schluessel).map(mittel => ({ id: mittel.id, name: mittel.name }))
      : [],
    passageFunction: sauber(passageFunction),
    activeStyle: aktiveStilfassung(activeStyle),
    failClosed: !bekannt,
  }
}

export function formatiereHandwerk(handwerk) {
  if (!handwerk || typeof handwerk !== 'object') return ''
  const kopf = handwerk.name
    ? `Handwerk für ${handwerk.name}`
    : 'Handwerk bei noch unbestimmter Textart'
  const zeilen = [
    `${kopf} — Ziel: ${handwerk.ziel}`,
    `Prioritäten: ${(handwerk.prioritaeten || []).join(' · ')}`,
    `Prüffragen: ${(handwerk.prueffragen || []).join(' · ')}`,
    `Typische Fehlformen: ${(handwerk.fehlformen || []).join(' · ')}`,
  ]
  if (handwerk.passageFunction) zeilen.splice(1, 0, `Funktion dieses Textteils: ${handwerk.passageFunction}`)
  if (handwerk.activeStyle) {
    const stil = handwerk.activeStyle
    const beschreibung = [stil.name, stil.purpose].filter(Boolean).join(' — ')
    if (beschreibung) zeilen.push(`Aktiver Schreibstil: ${beschreibung}`)
    if (stil.rules.length) zeilen.push(`Verbindliche Stilregeln: ${stil.rules.join(' · ')}`)
  }
  if (handwerk.failClosed) {
    zeilen.push('Grenze: Keine Textart raten und kein Stilmittel von dir aus vorschlagen.')
  } else if (handwerk.tragendeStilmittel?.length) {
    zeilen.push(`Tragende Stilmittel, nur bei örtlichem Grund: ${handwerk.tragendeStilmittel.map(mittel => `${mittel.name} [${mittel.id}]`).join(', ')}`)
  }
  return zeilen.join('\n')
}
