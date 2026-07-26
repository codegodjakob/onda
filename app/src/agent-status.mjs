// Reiner Status-Speicher fuer den Agenten-Anschluss — kein DOM, node-testbar.
// Bereich W setzt den Zustand rund um Gateway-Laeufe (setzeAgentStatus),
// die Oberflaeche (Agenten-Panel-Statuszeile, Aura-Orb) liest ihn hier ab.

let status = { zustand: 'unbekannt' }
const listeners = new Set()

export function aktuellerAgentStatus() {
  return status
}

export function setzeAgentStatus(next) {
  status = next && typeof next === 'object' ? { ...next } : { zustand: 'unbekannt' }
  listeners.forEach(listener => {
    try { listener(status) } catch {}
  })
}

export function beiAgentStatus(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Leitet aus dem Zustand die ruhige Statuszeile des Agenten-Panels ab.
// null = keine Zeile (Ruhe ist der Normalzustand). Nie Modals, nie Alarm.
export function statuszeileFuer(s) {
  const zustand = s?.zustand
  if (zustand === 'offline') {
    return { text: 'Agent ist offline — dein Text ist davon unberührt.', knopf: 'einstellungen', aura: false }
  }
  if (zustand === 'laeuft') {
    return { text: s.text || 'Agent liest …', knopf: null, aura: true }
  }
  if (zustand === 'fehler') {
    if (s.fehlerTyp === 'kein-schluessel' || s.fehlerTyp === 'offline') {
      return { text: 'Agent ist offline — dein Text ist davon unberührt.', knopf: 'einstellungen', aura: false }
    }
    if (s.fehlerTyp === 'ratenlimit') {
      return { text: 'Gerade viele Anfragen — der Agent versucht es automatisch noch einmal.', knopf: null, aura: false }
    }
    if (s.fehlerTyp === 'ueberlastet') {
      return { text: 'Der Dienst ist gerade überlastet — der Agent versucht es automatisch noch einmal.', knopf: null, aura: false }
    }
    if (s.fehlerTyp === 'schema' || s.fehlerTyp === 'abgelehnt' || s.fehlerTyp === 'abgebrochen') {
      return null // leise: das Lauf-Protokoll haelt es fest, der naechste Ausloeser versucht es neu
    }
    return { text: 'Der Agent ist gerade nicht erreichbar — dein Text ist davon unberührt.', knopf: null, aura: false }
  }
  return null
}
