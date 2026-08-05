const SECRET_PATTERNS = Object.freeze([
  [/(authorization\s*[:=]\s*)(?:bearer\s+)?[^\s,;"']+/giu, '$1[REDACTED]'],
  [/(x-api-key|api-key)\s*[:=]\s*[^\s,;"']+/giu, '$1=[REDACTED]'],
  [/\bsk-ant-[a-z0-9_-]+\b/giu, '[REDACTED]'],
  [/\bsk-[a-z0-9_-]+\b/giu, '[REDACTED]'],
])

export function redactSecrets(value) {
  let text = typeof value === 'string' ? value : JSON.stringify(value)
  for (const [pattern, replacement] of SECRET_PATTERNS) text = text.replace(pattern, replacement)
  return text
}

export function containsSecretMarker(value) {
  const text = String(value || '')
  return /authorization\s*[:=]|x-api-key\s*[:=]|api-key\s*[:=]|\bsk-ant-|\bsk-/iu.test(text)
}
