// Das Urteil je Bindung: Eine Prüfdatei, die mehrere Zusagen misst, darf mehrere
// Urteile abgeben.
//
// Der Anlass: `evals/pruefungen/gestalt.mjs` misst fünf Gestalt-Zusagen und druckt
// seit jeher fünf eigene Zeilen — „ok DESIGN-02", „not ok DESIGN-01". Der
// Fertigzustand-Läufer las davon nichts. Er kannte nur den Ausgang des ganzen
// Skripts und schrieb deshalb alle fünf Evals auf „nicht bestanden", obwohl drei
// bestanden. Zwei Schäden auf einmal: drei bestandene Zusagen verschwanden in der
// Statistik, und am Ergebnisstand war nicht abzulesen, WELCHE Zusage gebrochen war.
//
// Die Gegenrichtung ist die gefährlichere und bestimmt darum den Entwurf: Ein Lauf
// darf niemals grün melden, weil er nichts gemessen hat. Drei Regeln halten das:
//
//   1. ANKÜNDIGUNG STATT VERMUTUNG. Eine Prüfung, die je Eval urteilt, sagt das in
//      einer eigenen Zeile: `# je-eval: DESIGN-01 DESIGN-02 …`. Ohne diese Zeile
//      bleibt alles wie bisher — das Urteil der Datei gilt für alle ihre Evals.
//      Das ist keine Förmlichkeit: Ein Dutzend node:test-Dateien benennt seine
//      Tests längst nach Eval-Kennungen („ok 1 - INV-02 hält die Herkunft fest").
//      Würde man solche Zeilen ungefragt als Urteil lesen, verlören sieben Dateien
//      still genau die Evals, über die sie zufällig nichts sagen. Geraten wird hier
//      nichts — dieselbe Lehre wie bei den Klassennamen in gestalt.mjs.
//
//   2. ANGEKÜNDIGT UND NICHT GEMELDET HEISST DURCHGEFALLEN. Stirbt der Browser nach
//      der zweiten von fünf Messungen, gilt nur das Gemessene. Der Rest fällt durch,
//      und der Hinweis sagt, dass nichts gemeldet wurde — nicht, dass etwas kaputt sei.
//
//   3. DER AUSGANG MUSS ZU DEN ZEILEN PASSEN. Meldet jede angekündigte Kennung grün
//      und das Skript endet trotzdem mit Fehler, dann liegt der Fehler außerhalb des
//      Gemessenen. Dann zählt keine der Messungen, und alle Evals der Datei fallen
//      durch. Ohne diese Regel könnte ein Skript alles grün melden und danach im
//      Aufräumen scheitern — und käme damit durch.

// Kennungen wie DESIGN-01, ONDA-UI-22, ERWEITERUNG-07.
const KENNUNG = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*-\d+$/
const ANKUENDIGUNG = /^#[ \t]*je-eval:[ \t]*(.+)$/m
const ERGEBNISZEILE = /^(not ok|ok)[ \t]+(\S+)/
const BEFUNDZEILE = /^[ \t]+#[ \t]?(.*)$/

// Welche Kennungen verantwortet diese Prüfung einzeln? null heißt: keine — dann
// urteilt die Datei als Ganzes, so wie es immer war.
export function leseAnkuendigung(ausgabe) {
  const treffer = String(ausgabe ?? '').match(ANKUENDIGUNG)
  if (!treffer) return null
  const ids = treffer[1].split(/[\s,]+/).filter(teil => KENNUNG.test(teil))
  return ids.length ? ids : null
}

// Liest die Ergebniszeilen zu den angekündigten Kennungen samt ihrem Befund. Der
// Befund steht in den eingerückten Kommentarzeilen darunter (TAP-Diagnose) — er ist
// der eigentliche Gewinn: Am Ergebnisstand soll stehen, WAS gebrochen ist.
function leseErgebnisse(ausgabe, ids) {
  const erlaubt = new Set(ids)
  const zeilen = String(ausgabe ?? '').split('\n')
  const gemeldet = new Map()
  for (let i = 0; i < zeilen.length; i += 1) {
    const treffer = zeilen[i].match(ERGEBNISZEILE)
    if (!treffer || !erlaubt.has(treffer[2])) continue
    const id = treffer[2]
    const ok = treffer[1] === 'ok'
    const befund = []
    for (let j = i + 1; j < zeilen.length; j += 1) {
      const diagnose = zeilen[j].match(BEFUNDZEILE)
      if (!diagnose) break
      if (diagnose[1].trim()) befund.push(diagnose[1].trim())
    }
    const vorher = gemeldet.get(id)
    // Ein Widerspruch zwischen zwei Zeilen wird nie zugunsten des Grüns aufgelöst.
    gemeldet.set(id, {
      ok: vorher ? vorher.ok && ok : ok,
      befund: befund.join(' ') || vorher?.befund || '',
    })
  }
  return gemeldet
}

// Das Urteil für jedes Eval, das an diese Prüfdatei gebunden ist.
//
//   gebundeneIds — die Kennungen aus bindungen.json, die auf diese Datei zeigen
//   ausgabe      — was die Datei gedruckt hat (stdout samt stderr, auch bei Abbruch)
//   dateiOk      — ob der Lauf der Datei als Ganzes erfolgreich war
//
// Zurück kommt der Modus („datei" oder „je-eval", damit der Läufer es benennen kann)
// und je Kennung { ok, hinweis }.
export function urteileJeEval({ gebundeneIds, ausgabe, dateiOk }) {
  const ids = [...(gebundeneIds ?? [])]
  const angekuendigt = leseAnkuendigung(ausgabe)
  const alsGanzes = hinweis => ({
    modus: 'datei',
    angekuendigt,
    urteile: Object.fromEntries(ids.map(id => [id, { ok: Boolean(dateiOk), ...(hinweis ? { hinweis } : {}) }])),
  })

  if (!angekuendigt) return alsGanzes(null)

  const gemeldet = leseErgebnisse(ausgabe, angekuendigt)
  const einBefund = angekuendigt.some(id => gemeldet.get(id)?.ok === false)
  const eineFehlt = angekuendigt.some(id => !gemeldet.has(id))

  // Regel 3: Der Fehler ist durch nichts Gemeldetes erklärt.
  if (!dateiOk && !einBefund && !eineFehlt) {
    return alsGanzes(
      'Die Prüfung scheiterte außerhalb ihrer gemeldeten Abschnitte: jede angekündigte '
      + 'Kennung meldet grün, der Lauf endete trotzdem mit Fehler. Dann trägt keine der '
      + 'Messungen mehr.',
    )
  }

  const urteile = {}
  for (const id of ids) {
    if (!angekuendigt.includes(id)) {
      // Regel 1, Kehrseite: Die Datei urteilt je Eval, sagt über dieses aber nichts.
      // Stumm am Urteil der Datei mitfahren darf es nicht.
      urteile[id] = {
        ok: false,
        hinweis: `Die Prüfung urteilt je Eval (${angekuendigt.join(', ')}), sagt zu dieser Kennung `
          + 'aber nichts. Entweder die Prüfung zieht nach oder die Bindung ist falsch.',
      }
      continue
    }
    const stand = gemeldet.get(id)
    if (!stand) {
      // Regel 2: angekündigt, nie gemeldet.
      urteile[id] = {
        ok: false,
        hinweis: 'Die Prüfung hat zu dieser Kennung nichts gemeldet — der Lauf brach ab, '
          + 'bevor sie gemessen wurde. Ungemessen ist nicht bestanden.',
      }
      continue
    }
    urteile[id] = stand.ok
      ? { ok: true, ...(stand.befund ? { hinweis: stand.befund } : {}) }
      : { ok: false, hinweis: stand.befund || 'Die Prüfung meldet diese Zusage als gebrochen.' }
  }
  return { modus: 'je-eval', angekuendigt, urteile }
}
