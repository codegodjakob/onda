function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function requiredText(value, label) {
  const result = typeof value === 'string' ? value.trim() : ''
  if (!result) throw new TypeError(`${label} is required`)
  return result
}

function cleanList(value) {
  return Array.isArray(value)
    ? value.map(item => String(item).trim()).filter(Boolean)
    : []
}

function audienceDimension(value) {
  const values = cleanList(value)
  return values.length
    ? { status: 'known', values }
    : { status: 'unknown', values: [] }
}

function buildAudience(context) {
  const known = isObject(context.known) ? context.known : {}
  const state = isObject(known.audienceState) ? known.audienceState : {}
  const goal = typeof known.goal === 'string' ? known.goal.trim() : ''
  return {
    label: cleanList(known.audience),
    priorKnowledge: audienceDimension(state.priorKnowledge),
    assumptions: audienceDimension(state.assumptions),
    resistances: audienceDimension(state.resistances),
    commonGround: audienceDimension(state.commonGround),
    targetChange: goal
      ? { status: 'known', value: goal }
      : { status: 'unknown', value: '' },
  }
}

function passageFunction(block) {
  const text = String(block.text || '').trim()
  const role = block.role || 'paragraph'
  if (role === 'heading' || block.type === 'heading') {
    return {
      function: 'orient',
      discourseRelation: 'opens-section',
      rationale: 'Die Überschrift benennt den folgenden Gegenstand.',
      confidence: 'high',
    }
  }
  if (role === 'evidence') {
    return {
      function: 'substantiate',
      discourseRelation: 'supports-claim',
      rationale: 'Der Baustein ist vom Nutzer als Beleg markiert.',
      confidence: 'high',
    }
  }
  if (role === 'counterpoint') {
    return {
      function: 'contrast',
      discourseRelation: 'counters-claim',
      rationale: 'Der Baustein ist vom Nutzer als Gegenposition markiert.',
      confidence: 'high',
    }
  }
  if (role === 'claim') {
    return {
      function: 'position',
      discourseRelation: 'states-claim',
      rationale: 'Der Baustein ist vom Nutzer als Kernbehauptung markiert.',
      confidence: 'high',
    }
  }
  if (/\b(?:bedeutet|bezeichnet|definiert)\b/iu.test(text)) {
    return {
      function: 'define',
      discourseRelation: 'defines-term',
      rationale: 'Der Wortlaut setzt ausdrücklich eine Begriffsgrenze.',
      confidence: 'high',
    }
  }
  if (/\b(?:weil|denn|deshalb|dadurch|erklärt)\b/iu.test(text)) {
    return {
      function: 'explain',
      discourseRelation: 'explains-cause',
      rationale: 'Der Wortlaut markiert eine Ursache oder Erklärung.',
      confidence: 'medium',
    }
  }
  if (/^\s*(?:Prüfen|Prüfe|Prüft|Vergleichen|Vergleiche|Wählen|Wähle|Beachten|Beachte)\b/iu.test(text)) {
    return {
      function: 'activate',
      discourseRelation: 'requests-action',
      rationale: 'Der Satz richtet eine konkrete Handlung an das Publikum.',
      confidence: 'high',
    }
  }
  const words = text.match(/[\p{L}\p{N}]+/gu) || []
  const hasFiniteVerb = /\b(?:ist|sind|war|waren|wird|werden|hat|haben|kann|können|bleibt|bleiben|zeigt|zeigen|erklärt|erklären)\b/iu.test(text)
  if (words.length <= 6 && !hasFiniteVerb) {
    return {
      function: 'unclear',
      discourseRelation: 'unknown',
      rationale: 'Die kurze Passage enthält keine lokal erkennbare Aussage- oder Handlungsfunktion.',
      confidence: 'low',
      possibleDecorative: true,
    }
  }
  return {
    function: 'inform',
    discourseRelation: 'continues-topic',
    rationale: 'Die Passage trägt eine Aussage, aber keine enger markierte Spezialfunktion.',
    confidence: 'low',
  }
}

export function analyzeCommunicationEffect({
  projectId,
  textId,
  context,
  blocks = [],
  at = Date.now(),
}) {
  const normalizedProjectId = requiredText(projectId, 'Effect analysis project')
  const normalizedTextId = requiredText(textId, 'Effect analysis text')
  if (!Number.isFinite(at)) throw new TypeError('Effect analysis time is required')
  if (!context || context.projectId !== normalizedProjectId) {
    throw new TypeError('Effect analysis context project mismatch')
  }
  const passages = (Array.isArray(blocks) ? blocks : [])
    .filter(block => block?.id && typeof block.text === 'string' && block.text.trim())
    .map(block => ({
      id: `effect:${normalizedTextId}:${block.id}`,
      projectId: normalizedProjectId,
      textId: normalizedTextId,
      blockId: block.id,
      text: block.text,
      status: 'hypothesis',
      ...passageFunction(block),
      provenance: { actor: 'agent', action: 'effect-analysis' },
      createdAt: at,
    }))
  return {
    projectId: normalizedProjectId,
    textId: normalizedTextId,
    status: 'hypothesis',
    statusReason: 'Ohne reale Publikumsreaktion bleiben Wirkungsannahmen begründete Hypothesen.',
    audience: buildAudience(context),
    passages,
    analyzedAt: at,
  }
}

function rhetoricDevice(block) {
  const text = String(block.text || '')
  if (/\bzum Beispiel\b/iu.test(text)) {
    return {
      kind: 'example',
      function: 'Eine abstrakte Aussage an einem konkreten Fall veranschaulichen.',
      expectedGain: 'Der konkrete Fall kann die relevante Beziehung leichter auffindbar machen.',
      possibleMisconception: 'Das Beispiel darf nicht als vollständige Abdeckung aller Fälle gelesen werden.',
      directVersionPreferred: false,
    }
  }
  if (/\b(?:wie|als ob)\b/iu.test(text)) {
    const overextended = /\b(?:genau|vollständig|jeden?|immer)\b/iu.test(text)
    return {
      kind: 'analogy',
      function: 'Eine relationale Struktur über ein vertrauteres Bild erklären.',
      expectedGain: 'Die Analogie kann die Rolle der Reserve anschaulich machen.',
      possibleMisconception: overextended
        ? 'Die Analogie verwischt ihre Grenze und behauptet eine vollständigere Absicherung als belegt.'
        : 'Das Bild kann Unterschiede zwischen Quelle und Zielbereich verdecken.',
      directVersionPreferred: overextended,
    }
  }
  if (/^\s*(?:Als|Damals|Zuerst)\b/iu.test(text)) {
    return {
      kind: 'narration',
      function: 'Eine zeitliche Erfahrung als Orientierung anbieten.',
      expectedGain: 'Die Abfolge kann Ursache und Entscheidung erinnerbarer machen.',
      possibleMisconception: 'Der Einzelfall kann fälschlich als allgemeiner Beleg erscheinen.',
      directVersionPreferred: false,
    }
  }
  if (/\b(?:hingegen|dagegen|während|anders als|im Unterschied dazu)\b/iu.test(text)) {
    return {
      kind: 'contrast',
      function: 'Zwei Optionen oder Befunde entlang eines benannten Unterschieds ordnen.',
      expectedGain: 'Der Kontrast kann die entscheidungsrelevante Differenz sichtbar machen.',
      possibleMisconception: 'Eine binäre Gegenüberstellung kann Zwischenformen oder gemeinsame Ursachen verdecken.',
      directVersionPreferred: false,
    }
  }
  if (/\b(?:ist|wird)\s+(?:ein|eine)\s+(?:Kompass|Brücke|Fundament|Motor|Spiegel|Bühne)\b/iu.test(text)) {
    return {
      kind: 'metaphor',
      function: 'Einen abstrakten Zusammenhang durch ein kompaktes Bild rahmen.',
      expectedGain: 'Das Bild kann eine komplexe Rolle schnell erinnerbar machen.',
      possibleMisconception: 'Eigenschaften des Bildes können unbemerkt auf den Sachverhalt übertragen werden.',
      directVersionPreferred: true,
    }
  }
  if (/\bals\s+(?:Chance|Risiko|Investition|Belastung|Verantwortung)\b/iu.test(text)) {
    return {
      kind: 'frame',
      function: 'Den Gegenstand unter einer bestimmten Bewertungsdimension einordnen.',
      expectedGain: 'Der Frame kann die relevante Entscheidungsperspektive explizit machen.',
      possibleMisconception: 'Andere berechtigte Perspektiven können durch die gewählte Rahmung aus dem Blick geraten.',
      directVersionPreferred: false,
    }
  }
  if (/^\s*(?:Prüfen|Prüfe|Vergleichen|Vergleiche|Wählen|Wähle|Klar ist:)\b/iu.test(text)) {
    return {
      kind: 'directness',
      function: 'Die Aussage oder Handlung ohne bildliche Zwischenebene benennen.',
      expectedGain: 'Direktheit kann Aufgabe und Verantwortlichkeit leicht auffindbar machen.',
      possibleMisconception: 'Zu knappe Direktheit kann Begründung oder Einschränkung unsichtbar lassen.',
      directVersionPreferred: false,
    }
  }
  return null
}

export function analyzeRhetoricalDevices({
  projectId,
  textId,
  blocks = [],
  at = Date.now(),
}) {
  const normalizedProjectId = requiredText(projectId, 'Rhetoric project')
  const normalizedTextId = requiredText(textId, 'Rhetoric text')
  if (!Number.isFinite(at)) throw new TypeError('Rhetoric time is required')
  const devices = (Array.isArray(blocks) ? blocks : []).flatMap(block => {
    if (!block?.id || typeof block.text !== 'string') return []
    const device = rhetoricDevice(block)
    return device ? [{
      id: `rhetoric:${normalizedTextId}:${block.id}:${device.kind}`,
      projectId: normalizedProjectId,
      textId: normalizedTextId,
      blockId: block.id,
      text: block.text,
      ...device,
      effectStatus: 'hypothesis',
      evidenceCertainty: 'context-dependent',
      reason: 'Die erwartete Wirkung ist aus Form und Kontext abgeleitet, nicht durch reale Leserreaktionen belegt.',
      createdAt: at,
    }] : []
  })
  return {
    projectId: normalizedProjectId,
    textId: normalizedTextId,
    status: 'hypothesis',
    coveredStrategies: ['example', 'analogy', 'narration', 'contrast', 'metaphor', 'frame', 'directness'],
    devices: clone(devices),
    analyzedAt: at,
  }
}
