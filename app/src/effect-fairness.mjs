// Die Fairnessprüfung für überzeugende Texte. Sie greift nur bei Textsorten, die überzeugen
// sollen (Marketing, Kampagne), oder bei unbekannter Textsorte; sonst meldet sie ausdrücklich
// "nicht zutreffend", statt einem Sachtext Vorwürfe zu machen. Gesucht wird dreierlei: eine
// Behauptung, die stärker auftritt als ihr Beleg; ein Druckmuster, das mit Angst oder Schuld
// arbeitet; und eine tragende Aussage auf dünnem Beleg. Rein rechnend, kein DOM, node-testbar.
//
// Gehört zur Browser-App (src/editor.js): benutzt von language-ui.mjs.
const PERSUASIVE_GENRES = new Set(['marketing', 'campaign'])
const STRONG_CLAIM = /\b(?:garantiert|zweifellos|immer|jede[rmns]?|ausnahmslos|sicher)\b/iu
const EXPLOITATIVE = /\b(?:nur heute|du willst doch nicht|schuld am|wenn dir .* wichtig ist|sonst wirst du|angst haben)\b/iu
const WEAK_EVIDENCE = new Set(['mixed', 'insufficient', 'review-required', 'unverified'])

function requiredText(value, label) {
  const result = typeof value === 'string' ? value.trim() : ''
  if (!result) throw new TypeError(`${label} is required`)
  return result
}

function stableHash(value) {
  let hash = 2166136261
  for (const character of String(value)) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function finding({
  kind,
  projectId,
  textId,
  block,
  exact,
  start,
  message,
  reason,
  reviewQuestion,
  confidence,
  requiredContext,
  priority,
  order,
  at,
}) {
  const token = stableHash([projectId, textId, kind, block.id, start, exact].join('\u241f'))
  return {
    id: `effect-fairness:${textId}:${kind}:${token}`,
    projectId,
    textId,
    blockId: block.id,
    blockIndex: Number.isInteger(block.index) ? block.index : null,
    sourceTextOffset: Number.isInteger(block.sourceTextOffset) ? block.sourceTextOffset : 0,
    anchor: { exact, start, end: start + exact.length },
    kind,
    family: 'fairness',
    class: 'integrity-warning',
    priority,
    order,
    message,
    reason,
    reviewQuestion,
    confidence,
    requiredContext,
    status: 'open',
    fingerprint: token,
    provenance: { actor: 'agent', action: 'effect-fairness-analysis' },
    createdAt: at,
  }
}

function blockForClaim(blocks, claim) {
  return blocks.find(block => block?.id === claim?.anchor?.blockId) || null
}

export function analyzeEffectFairness({
  projectId,
  textId,
  context,
  blocks = [],
  argumentModel,
  at = Date.now(),
}) {
  const normalizedProjectId = requiredText(projectId, 'Effect fairness project')
  const normalizedTextId = requiredText(textId, 'Effect fairness text')
  if (!Number.isFinite(at)) throw new TypeError('Effect fairness time is required')
  if (!context || context.projectId !== normalizedProjectId) {
    throw new TypeError('Effect fairness context project mismatch')
  }
  const normalizedBlocks = (Array.isArray(blocks) ? blocks : [])
    .map((block, index) => ({
      ...block,
      index: Number.isInteger(block?.index) ? block.index : index,
      sourceTextOffset: Number.isInteger(block?.sourceTextOffset) ? block.sourceTextOffset : 0,
    }))
  const claims = Array.isArray(argumentModel?.claims) ? argumentModel.claims : []
  const relations = Array.isArray(argumentModel?.relations) ? argumentModel.relations : []
  if (
    claims.some(claim => claim?.projectId !== normalizedProjectId)
    || relations.some(relation => relation?.projectId !== normalizedProjectId)
  ) {
    throw new TypeError('Effect fairness contains a foreign project')
  }

  const genre = context.known?.genre || ''
  const persuasive = PERSUASIVE_GENRES.has(genre)
  const genreMissing = !genre
  if (!persuasive && !genreMissing) {
    return {
      projectId: normalizedProjectId,
      textId: normalizedTextId,
      status: 'not-applicable',
      statusReason: `Die Fairnessprüfung für persuasive Texte ist für die Textsorte ${genre} nicht aktiviert.`,
      missingContext: [],
      findings: [],
      styleOrder: 100,
      analyzedAt: at,
    }
  }

  const text = normalizedBlocks.map(block => block?.text || '').join('\n')
  const currentClaims = claims.filter(claim => claim?.status !== 'stale' && claim.textId === normalizedTextId)
  const findings = []
  const overstated = currentClaims.find(claim => (
    WEAK_EVIDENCE.has(claim.evidenceStatus)
    && STRONG_CLAIM.test(claim.text)
    && blockForClaim(normalizedBlocks, claim)
  ))
  if (overstated) {
    const block = blockForClaim(normalizedBlocks, overstated)
    const match = STRONG_CLAIM.exec(overstated.text)
    findings.push(finding({
      kind: 'unsupported-intensification',
      projectId: normalizedProjectId,
      textId: normalizedTextId,
      block,
      exact: match[0],
      start: (overstated.anchor?.start || 0) + match.index,
      message: 'Die persuasive Zuspitzung geht über die dokumentierte Beleglage hinaus.',
      reason: `Der Claim ist ${overstated.evidenceStatus}; eine Garantie oder universelle Reichweite ist nicht belegt.`,
      reviewQuestion: 'Welche engere Aussage decken die vorhandenen Belege tatsächlich?',
      confidence: 'high',
      requiredContext: ['claim-evidence'],
      priority: 'critical',
      order: 1,
      at,
    }))
  }

  if (persuasive) {
    const currentClaimIds = new Set(currentClaims.map(claim => claim.id))
    const omittedCounter = relations.find(relation => {
      if (relation.type !== 'counters' || !currentClaimIds.has(relation.toClaimId)) return false
      const source = claims.find(claim => claim.id === relation.fromClaimId)
      return Boolean(
        source
        && source.status !== 'stale'
        && source.evidenceStatus === 'supported'
        && Array.isArray(source.evidenceRefs)
        && source.evidenceRefs.length
        && !text.includes(source.text)
      )
    })
    if (omittedCounter) {
      const target = claims.find(claim => claim.id === omittedCounter.toClaimId)
      const block = blockForClaim(normalizedBlocks, target)
      if (block) {
        findings.push(finding({
          kind: 'omitted-counterinformation',
          projectId: normalizedProjectId,
          textId: normalizedTextId,
          block,
          exact: target.anchor.exact,
          start: target.anchor.start,
          message: 'Eine zentrale belegte Gegeninformation fehlt im persuasiven Text.',
          reason: 'Der Argumentgraph enthält einen aktiven, direkt belegten Gegenbefund zur aktuellen Kernaussage.',
          reviewQuestion: 'Wie wird der belegte Gegenbefund fair sichtbar gemacht oder begründet eingegrenzt?',
          confidence: 'high',
          requiredContext: ['genre', 'argument-counterevidence'],
          priority: 'high',
          order: 2,
          at,
        }))
      }
    }
  }

  const exploit = normalizedBlocks
    .map(block => ({ block, match: EXPLOITATIVE.exec(String(block?.text || '')) }))
    .find(item => item.match)
  if (exploit) {
    findings.push(finding({
      kind: 'exploitative-personalization',
      projectId: normalizedProjectId,
      textId: normalizedTextId,
      block: exploit.block,
      exact: exploit.match[0],
      start: exploit.match.index,
      message: 'Die Ansprache nutzt Druck, Schuld oder künstliche Dringlichkeit statt überprüfbarer Gründe.',
      reason: 'Das Muster adressiert eine persönliche Verwundbarkeit oder erzeugt Entscheidungsdruck ohne sachliche Grundlage.',
      reviewQuestion: 'Kann die Passage den sachlichen Grund direkt nennen, ohne Druck oder Schuld zu erzeugen?',
      confidence: 'high',
      requiredContext: [],
      priority: 'high',
      order: 3,
      at,
    }))
  }

  return {
    projectId: normalizedProjectId,
    textId: normalizedTextId,
    status: genreMissing ? 'limited' : 'analyzed',
    statusReason: genreMissing
      ? 'Die Textsorte fehlt. Offensichtliche Inhaltsrisiken werden gezeigt; ausgelassene Gegeninformation wird bis zur Profilklärung nicht bewertet.'
      : 'Persuasive Fairness wurde auf Grundlage des angegebenen Profils geprüft.',
    missingContext: genreMissing ? ['genre'] : [],
    findings,
    styleOrder: 100,
    analyzedAt: at,
  }
}
