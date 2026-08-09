// NICHT GEMESSEN IST NICHT DASSELBE WIE NICHT BESTANDEN.
//
// Am 9.8.2026 meldete `node evals/run-fertigzustand.mjs` 25 nicht bestandene Evals —
// darunter alle sieben DESIGN-Zusagen. Keine einzige davon war ein Mangel an der App.
// 23 kamen daher, dass der lokale Server auf Port 4173 nicht lief, 2 daher, dass
// Firefox in dieser Umgebung nicht installiert ist. Der Lauf hat also 25 Mängel
// behauptet, die es nicht gab.
//
// Das ist die gefährlichere Richtung als ein übersehener Fehler: Wer die Liste liest,
// fängt an, Dinge zu reparieren, die heil sind — und lernt nebenbei, dem Prüflauf
// nicht zu glauben. Ein Maßstab, dem man nicht glaubt, misst nichts mehr.
//
// Darum hier: Eine Prüfung, die gar nicht laufen KONNTE, bekommt einen eigenen Stand.
// Sie gilt weiterhin NICHT als bestanden — sonst wäre das Schweigen grün, und genau
// das ist die Falle, die dieses Projekt an anderer Stelle schon zugeschlagen hat. Sie
// heißt nur nicht mehr „fehlgeschlagen", denn das wäre eine Aussage über die App.

// Die Erkennungszeichen stehen an einer Stelle und sind mit Absicht eng: Sie sollen
// eine tote Umgebung erkennen, nicht einen echten Fehler wegerklären. Jede Zeile hier
// entfernt eine Aussage aus dem Prüfbericht — im Zweifel lieber nicht aufnehmen.
const UMGEBUNGS_SPUREN = [
  {
    muster: /ERR_CONNECTION_REFUSED|ECONNREFUSED/,
    grund: 'Der lokale Server auf Port 4173 lief nicht.',
    abhilfe: 'cd app && python3 -m http.server 4173  (oder: node scripts/dev-server.mjs --port=4173)',
  },
  {
    muster: /Executable doesn't exist at|playwright install/,
    grund: 'Ein Browser, den diese Prüfung starten will, ist in dieser Umgebung nicht installiert.',
    abhilfe: 'npx playwright install  — oder die Prüfung auf die vorhandenen Browser beschränken.',
  },
  {
    muster: /ENOSPC|no space left on device/i,
    grund: 'Kein Platz mehr auf der Platte.',
    abhilfe: 'Baureste und Zwischenspeicher löschen, dann neu messen.',
  },
]

// Eine Prüfung darf auch SELBST sagen, dass sie nichts messen konnte — das ist die
// verlässlichste Auskunft, weil sie nicht aus einer Fehlermeldung geraten ist. Wer eine
// Prüfung schreibt, die von einer Vorbedingung abhängt, schreibt diese Zeile:
//
//   process.stdout.write('NICHT MESSBAR: die Gestalt-Prüfung hat nichts gemeldet\n')
//
// und beendet mit Code 1. Sie zählt dann nicht als bestanden, aber auch nicht als
// Befund an der App.
const SELBSTAUSKUNFT = /^NICHT MESSBAR:\s*(.+)$/m

// Ein Fund heißt: Diese Ausgabe stammt von einer Prüfung, die die App nie erreicht hat.
export function umgebungsFehler(ausgabe) {
  if (!ausgabe) return null
  const selbst = ausgabe.match(SELBSTAUSKUNFT)
  if (selbst) {
    return { grund: selbst[1].trim(), abhilfe: 'Die Prüfung meldet das selbst — der Grund steht in ihrem Protokoll.' }
  }
  for (const spur of UMGEBUNGS_SPUREN) {
    if (spur.muster.test(ausgabe)) return { grund: spur.grund, abhilfe: spur.abhilfe }
  }
  return null
}

// Nur wer NICHT ok ist, kann unmessbar sein. Eine grüne Prüfung hat die App erreicht,
// auch wenn irgendwo im Protokoll ein solches Wort steht — etwa in einem Kommentar
// oder in der Ausgabe eines absichtlichen Fehlversuchs.
export function standDerPruefung({ ok, ausgabe }) {
  if (ok) return { stand: 'gelaufen' }
  const fehler = umgebungsFehler(ausgabe)
  return fehler ? { stand: 'nicht-messbar', ...fehler } : { stand: 'fehlgeschlagen' }
}

// Wartet, bis der lokale Server antwortet. Gibt true zurück, wenn er steht.
export async function serverAntwortet(url, versuche = 1, wartenMs = 400) {
  for (let i = 0; i < versuche; i += 1) {
    try {
      const antwort = await fetch(url, { signal: AbortSignal.timeout(2000) })
      if (antwort.ok) return true
    } catch { /* noch nicht da */ }
    if (i < versuche - 1) await new Promise(fertig => setTimeout(fertig, wartenMs))
  }
  return false
}
