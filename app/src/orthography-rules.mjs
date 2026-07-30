function withSourceCase(source, replacement) {
  if (source === source.toLocaleUpperCase('de-DE')) return replacement.toLocaleUpperCase('de-DE')
  if (/^\p{Lu}/u.test(source)) {
    return replacement[0].toLocaleUpperCase('de-DE') + replacement.slice(1)
  }
  return replacement
}

export const ORTHOGRAPHY_RULES = Object.freeze([
  Object.freeze({
    id: 'orthography-warscheinlich',
    pattern: /\bwarscheinlich(?:e|er|es|en|em)?\b/giu,
    replacement: exact => withSourceCase(
      exact,
      exact.toLocaleLowerCase('de-DE').replace(/^warscheinlich/u, 'wahrscheinlich'),
    ),
    message: '„wahrscheinlich“ wird mit „h“ nach „wa“ geschrieben.',
  }),
  Object.freeze({
    id: 'orthography-naehmlich',
    pattern: /\bnähmlich\b/giu,
    replacement: exact => withSourceCase(exact, 'nämlich'),
    message: '„nämlich“ wird ohne „h“ geschrieben.',
  }),
  Object.freeze({
    id: 'orthography-wiederspiegeln',
    pattern: /\bwiederspiegel(?:n|t|te|ten)?\b/giu,
    replacement: exact => withSourceCase(
      exact,
      exact.toLocaleLowerCase('de-DE').replace(/^wieder/u, 'wider'),
    ),
    message: '„widerspiegeln“ wird in dieser Bedeutung ohne „e“ nach „wid“ geschrieben.',
  }),
])

const RULES_BY_ID = new Map(ORTHOGRAPHY_RULES.map(rule => [rule.id, rule]))

export function validateOrthographyRuleApplication({ ruleId, exact, replacement } = {}) {
  const rule = RULES_BY_ID.get(ruleId)
  if (!rule || typeof exact !== 'string' || typeof replacement !== 'string') return false
  const matches = [...exact.matchAll(rule.pattern)]
  return matches.length === 1
    && matches[0].index === 0
    && matches[0][0].length === exact.length
    && rule.replacement(exact) === replacement
}
