export const ETAPPE_A_TEXT = [
  'Dieser vorhandene Text beschreibt eine ruhige Schreibumgebung.',
  'Die lokale Kostenbremse erlaubt automatische Läufe nur innerhalb einer bewusst gesetzten Grenze.',
  'Projektverständnis und Hinweise sollen nacheinander entstehen, damit der Agent erst versteht und dann urteilt.',
].join(' ')

export const ETAPPE_A_VERSTAENDNIS = Object.freeze({
  task: 'Eine belastbare Produktbeschreibung ausarbeiten',
  audience: 'interessierte Fachleser',
  desiredEffect: 'ruhig und nachvollziehbar überzeugen',
  evidenceStandard: 'Primärquellen für überprüfbare Tatsachenbehauptungen',
  protectedIntentions: ['Keine automatische Textänderung'],
  openQuestions: ['Welche reale Nutzungssituation soll das Beispiel tragen?'],
  antwortText: 'Ich verstehe den Text als ruhige Produktbeschreibung. Offen bleibt nur, welche reale Nutzungssituation das Beispiel tragen soll.',
})

export const ETAPPE_A_HINWEISE = Object.freeze({
  hinweise: [
    {
      kategorie: 'logik',
      anker: 'erst versteht und dann urteilt',
      beobachtung: 'Die Reihenfolge ist als Produktprinzip formuliert.',
      relevanz: 'Sie entscheidet darüber, ob spätere Hinweise den Projektzweck berücksichtigen.',
      folge: 'Ohne diese Reihenfolge könnten formal richtige, aber unpassende Hinweise entstehen.',
      muster: 'Ein Urteil braucht einen Zweck, an dem es gemessen wird — sonst misst es sich an sich selbst.',
      vorschlag: null,
      istGrundursache: true,
      integritaet: true,
    },
    {
      kategorie: 'quelle',
      anker: 'DIESE FUNDSTELLE EXISTIERT NICHT IM TEXT',
      beobachtung: 'Diese Modellbehauptung besitzt keinen gültigen Anker.',
      relevanz: 'Ein erfundener Anker darf nie als belastbarer Hinweis erscheinen.',
      folge: 'Die Oberfläche würde sonst eine falsche Textstelle suggerieren.',
      muster: 'Ein Beleg, der sich nicht am Original prüfen lässt, ist keiner.',
      vorschlag: null,
      istGrundursache: false,
      integritaet: true,
    },
  ],
})

export const ETAPPE_A_USAGE = Object.freeze({
  input_tokens: 120,
  output_tokens: 40,
  cache_read_input_tokens: 20,
  cache_creation_input_tokens: 10,
})
