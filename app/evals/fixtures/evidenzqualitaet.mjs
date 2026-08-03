export const EVIDENZQUALITAET_GOLD = Object.freeze([
  {
    id: 'narrow-rct',
    input: {
      claimId: 'claim-rct',
      sourceId: 'source-rct',
      relevance: { finding: 'Untersucht dieselbe konkrete Schreibaufgabe.', strength: 'direct' },
      method: { finding: 'Randomisierter Vergleich; die Abbruchquote ist nicht berichtet.', strength: 'mixed' },
      recency: { finding: '2025 veröffentlicht und auf die aktuelle Produktgeneration bezogen.', strength: 'current' },
      independence: { finding: 'Unabhängiges Forschungsteam ohne Herstellerbeteiligung.', strength: 'independent' },
      transparency: { finding: 'Materialien offen; Auswertungsskript fehlt.', strength: 'mixed' },
      sample: { finding: '84 Studierende einer Universität begrenzen die Übertragbarkeit.', strength: 'limited' },
      conflicts: { finding: 'In der Offenlegung ist keine Herstellerfinanzierung angegeben.', strength: 'none-declared' },
      convergence: { finding: 'Eine unabhängige Beobachtungsstudie berichtet denselben Trend.', strength: 'convergent' },
      conclusion: 'Für den engen Claim direkt brauchbar; Generalisierung und starke Kausalität bleiben begrenzt.',
    },
    expectedDimensions: ['relevance', 'method', 'recency', 'independence', 'transparency', 'sample', 'conflicts', 'convergence'],
    expectedConclusionTerms: ['engen Claim', 'Generalisierung', 'Kausalität'],
  },
  {
    id: 'vendor-whitepaper',
    input: {
      claimId: 'claim-vendor',
      sourceId: 'source-vendor',
      relevance: { finding: 'Bezieht sich direkt auf das Herstellerprodukt.', strength: 'direct' },
      method: { finding: 'Die Methode ist ein Vorher-Nachher-Vergleich ohne Kontrollgruppe.', strength: 'weak' },
      recency: { finding: 'Aktuelle Produktversion aus 2026.', strength: 'current' },
      independence: { finding: 'Das Whitepaper wurde vom Hersteller selbst erstellt.', strength: 'dependent' },
      transparency: { finding: 'Messinstrument und Rohdaten fehlen.', strength: 'opaque' },
      sample: { finding: 'Die Stichprobengröße wird im Bericht nicht genannt.', strength: 'unknown' },
      conflicts: { finding: 'Direktes kommerzielles Interesse am positiven Ergebnis.', strength: 'declared' },
      convergence: { finding: 'Keine unabhängige Bestätigung gefunden.', strength: 'isolated' },
      conclusion: 'Als Produktbeschreibung relevant, als unabhängiger Wirkungsbeleg wegen Methode und Interessenkonflikt nicht ausreichend.',
    },
    expectedDimensions: ['relevance', 'method', 'recency', 'independence', 'transparency', 'sample', 'conflicts', 'convergence'],
    expectedConclusionTerms: ['Produktbeschreibung', 'unabhängiger Wirkungsbeleg', 'nicht ausreichend'],
  },
  {
    id: 'older-primary-record',
    input: {
      claimId: 'claim-history',
      sourceId: 'source-archive',
      relevance: { finding: 'Primärquelle für die historische Begriffsprägung.', strength: 'direct' },
      method: { finding: 'Konzeptioneller Originalaufsatz, keine Wirksamkeitsstudie.', strength: 'conceptual' },
      recency: { finding: 'Für die historische Aussage maßgeblich; für heutige Wirkung nicht aktuell.', strength: 'claim-dependent' },
      independence: { finding: 'Autoren dokumentieren ihre eigene Begriffsprägung.', strength: 'primary' },
      transparency: { finding: 'Archivierte Originalfassung mit stabiler Fundstelle.', strength: 'transparent' },
      sample: { finding: 'Keine Stichprobe, weil keine empirische Wirkungsstudie.', strength: 'not-applicable' },
      conflicts: { finding: 'Keine relevante kommerzielle Finanzierung dokumentiert.', strength: 'none-declared' },
      convergence: { finding: 'Spätere Sekundärquellen bestätigen die historische Zuordnung.', strength: 'convergent' },
      conclusion: 'Stark für die historische Zuschreibung, nicht geeignet als Beleg einer heutigen Produktwirkung.',
    },
    expectedDimensions: ['relevance', 'method', 'recency', 'independence', 'transparency', 'sample', 'conflicts', 'convergence'],
    expectedConclusionTerms: ['historische Zuschreibung', 'nicht geeignet', 'Produktwirkung'],
  },
])

export function scoreEvidenzqualitaet(outputs) {
  const cases = EVIDENZQUALITAET_GOLD.map((gold, index) => {
    const output = outputs[index]
    const present = new Set(Object.keys(output?.dimensions || {}))
    const dimensionsComplete = gold.expectedDimensions.every(dimension => present.has(dimension))
    const findingsSubstantive = gold.expectedDimensions.every(dimension => (
      String(output?.dimensions?.[dimension]?.finding || '').split(/\s+/).length >= 4
    ))
    const conclusionComplete = gold.expectedConclusionTerms.every(term => (
      String(output?.conclusion || '').toLocaleLowerCase('de').includes(term.toLocaleLowerCase('de'))
    ))
    const claimSpecific = output?.claimId === gold.input.claimId && output?.sourceId === gold.input.sourceId
    const serialized = JSON.stringify(output || {})
    const noGlobalTruthScore = !/"(?:truth|wahrheit|global|overall)?_?score"\s*:/i.test(serialized)
    return {
      id: gold.id,
      dimensionsComplete,
      findingsSubstantive,
      conclusionComplete,
      claimSpecific,
      noGlobalTruthScore,
    }
  })
  const rubric = {
    claimSpecificity: cases.every(item => item.claimSpecific) ? 5 : 1,
    relevantDimensions: cases.every(item => item.dimensionsComplete) ? 5 : 2,
    explicitReasoning: cases.every(item => item.findingsSubstantive) ? 5 : 2,
    strengthsAndLimits: cases.every(item => item.conclusionComplete) ? 5 : 2,
    noGlobalTruthScore: cases.every(item => item.noGlobalTruthScore) ? 5 : 0,
  }
  const score = Object.values(rubric).reduce((sum, value) => sum + value, 0) / Object.keys(rubric).length
  return { evalId: 'EVID-04', cases, rubric, score, passed: score >= 4.5 && Object.values(rubric).every(value => value >= 4) }
}
