// Eine Prüfdatei, die mehrere Zusagen misst, muss mehrere Urteile abgeben dürfen.
//
// Der Befund, aus dem diese Tests entstanden sind: evals/pruefungen/gestalt.mjs misst
// fünf Gestalt-Zusagen und druckt seit jeher fünf eigene Zeilen ("ok DESIGN-02",
// "not ok DESIGN-01"). Der Fertigzustand-Läufer las davon nichts, sondern nur den
// Ausgang des ganzen Skripts — und schrieb deshalb alle fünf auf "nicht bestanden".
// Drei bestandene Zusagen verschwanden in der Statistik, und am Ergebnisstand war
// nicht zu sehen, WELCHE Zusage gebrochen war.
//
// Die Gegenrichtung ist die gefährlichere: Ein Lauf darf nie grün melden, weil er
// nichts gemessen hat. Deshalb muss eine Prüfung ANKÜNDIGEN, dass sie je Eval
// urteilt. Ohne Ankündigung bleibt alles wie bisher — was wichtig ist, weil ein
// Dutzend node:test-Dateien ihre Tests längst nach Eval-Kennungen benennt. Würde
// man diese Zeilen ungefragt als Urteil lesen, verlören sieben Dateien still die
// Evals, über die sie zufällig nichts sagen.

import { strict as assert } from 'node:assert'
import test from 'node:test'
import { leseAnkuendigung, urteileJeEval } from '../src/bindungs-urteil.mjs'

const GESTALT_AUSGABE = [
  '# je-eval: DESIGN-01 DESIGN-02 DESIGN-03 DESIGN-04 DESIGN-05',
  'not ok DESIGN-01 — Feedback neben der Stelle',
  '  # Er steht nicht neben der Stelle, sondern in derselben Spalte.',
  'ok DESIGN-02 — Struktur wiederholt den Text nicht',
  'not ok DESIGN-03 — Bausteine oeffnen sich einzeln',
  '  # Der geklickte Baustein waechst nicht.',
  'ok DESIGN-04 — Keine Grossbuchstaben-Beschriftungen',
  'ok DESIGN-05 — Bibliothek folgt derselben Gestaltungssprache',
  '',
  '3 von 5 Gestalt-Evals bestanden.',
].join('\n')

const DESIGN_IDS = ['DESIGN-01', 'DESIGN-02', 'DESIGN-03', 'DESIGN-04', 'DESIGN-05']

test('ohne Ankündigung erbt jedes gebundene Eval das Urteil der ganzen Datei', () => {
  const gruen = urteileJeEval({
    gebundeneIds: ['MOMENT-01', 'MOMENT-02'],
    ausgabe: 'MOMENT-Tabelle: alle 9 Arten stehen auf dem entschiedenen Moment.\n',
    dateiOk: true,
  })
  assert.equal(gruen.modus, 'datei')
  assert.equal(gruen.urteile['MOMENT-01'].ok, true)
  assert.equal(gruen.urteile['MOMENT-02'].ok, true)

  const rot = urteileJeEval({
    gebundeneIds: ['MOMENT-01', 'MOMENT-02'],
    ausgabe: 'MOMENT-Tabelle FEHLGESCHLAGEN:\n',
    dateiOk: false,
  })
  assert.equal(rot.modus, 'datei')
  assert.equal(rot.urteile['MOMENT-01'].ok, false)
  assert.equal(rot.urteile['MOMENT-02'].ok, false)
})

test('node:test-Zeilen mit Eval-Kennungen schalten ohne Ankündigung nicht um', () => {
  // test/provenance-model.test.mjs benennt seine Tests "INV-02 …", ist aber auch an
  // EVID-08 gebunden. Läse der Läufer diese Zeilen ungefragt als Urteil, fiele
  // EVID-08 mit "nichts gemeldet" durch, obwohl sich nichts verschlechtert hat.
  const stand = urteileJeEval({
    gebundeneIds: ['INV-02', 'EVID-08'],
    ausgabe: 'TAP version 13\nok 1 - INV-02 hält die Herkunft fest\nok 2 - INV-02 verweigert Erfundenes\n1..2\n',
    dateiOk: true,
  })
  assert.equal(stand.modus, 'datei')
  assert.equal(stand.urteile['INV-02'].ok, true)
  assert.equal(stand.urteile['EVID-08'].ok, true)
})

test('mit Ankündigung entscheidet jede Ergebniszeile ihr eigenes Eval', () => {
  const stand = urteileJeEval({ gebundeneIds: DESIGN_IDS, ausgabe: GESTALT_AUSGABE, dateiOk: false })
  assert.equal(stand.modus, 'je-eval')
  assert.deepEqual(
    Object.fromEntries(DESIGN_IDS.map(id => [id, stand.urteile[id].ok])),
    { 'DESIGN-01': false, 'DESIGN-02': true, 'DESIGN-03': false, 'DESIGN-04': true, 'DESIGN-05': true },
  )
})

test('der Befund der Prüfung steht im Urteil, nicht nur „Skript fehlgeschlagen"', () => {
  const stand = urteileJeEval({ gebundeneIds: DESIGN_IDS, ausgabe: GESTALT_AUSGABE, dateiOk: false })
  assert.match(stand.urteile['DESIGN-01'].hinweis, /derselben Spalte/)
  assert.match(stand.urteile['DESIGN-03'].hinweis, /waechst nicht/)
})

test('eine angekündigte Kennung ohne Ergebniszeile fällt durch', () => {
  // Der Abbruch mitten im Lauf: DESIGN-01 und DESIGN-02 sind gemessen, dann stirbt
  // der Browser. Was nie gemessen wurde, darf nicht als bestanden gelten.
  const abgebrochen = [
    '# je-eval: DESIGN-01 DESIGN-02 DESIGN-03 DESIGN-04 DESIGN-05',
    'ok DESIGN-01 — Feedback neben der Stelle',
    'not ok DESIGN-02 — Struktur wiederholt den Text nicht',
  ].join('\n')
  const stand = urteileJeEval({ gebundeneIds: DESIGN_IDS, ausgabe: abgebrochen, dateiOk: false })
  assert.equal(stand.modus, 'je-eval')
  assert.equal(stand.urteile['DESIGN-01'].ok, true)
  assert.equal(stand.urteile['DESIGN-03'].ok, false)
  assert.match(stand.urteile['DESIGN-03'].hinweis, /nichts gemeldet/)
})

test('scheitert die Datei außerhalb ihrer gemeldeten Abschnitte, fällt alles durch', () => {
  // Jede angekündigte Kennung meldet grün, und trotzdem endet das Skript mit Fehler:
  // dann liegt der Fehler woanders, und keine der Messungen ist noch etwas wert.
  const alleGruenTrotzdemRot = [
    '# je-eval: DESIGN-01 DESIGN-02',
    'ok DESIGN-01 — Feedback neben der Stelle',
    'ok DESIGN-02 — Struktur wiederholt den Text nicht',
    'Error: Aufräumen fehlgeschlagen',
  ].join('\n')
  const stand = urteileJeEval({
    gebundeneIds: ['DESIGN-01', 'DESIGN-02'],
    ausgabe: alleGruenTrotzdemRot,
    dateiOk: false,
  })
  assert.equal(stand.modus, 'datei')
  assert.equal(stand.urteile['DESIGN-01'].ok, false)
  assert.match(stand.urteile['DESIGN-01'].hinweis, /außerhalb/)
})

test('eine gebundene Kennung, die die Ankündigung nicht nennt, fällt laut durch', () => {
  // Kommt ein Eval dazu und niemand zieht die Prüfung nach, darf es nicht stumm
  // am Urteil einer Datei mitfahren, die über es nichts sagt.
  const stand = urteileJeEval({
    gebundeneIds: [...DESIGN_IDS, 'DESIGN-08'],
    ausgabe: GESTALT_AUSGABE,
    dateiOk: false,
  })
  assert.equal(stand.urteile['DESIGN-08'].ok, false)
  assert.match(stand.urteile['DESIGN-08'].hinweis, /urteilt je Eval/)
  assert.match(stand.urteile['DESIGN-08'].hinweis, /zu dieser Kennung/)
})

test('ein „not ok" wiegt schwerer als ein Ausgang ohne Fehler', () => {
  const stand = urteileJeEval({
    gebundeneIds: ['DESIGN-01', 'DESIGN-02'],
    ausgabe: '# je-eval: DESIGN-01 DESIGN-02\nnot ok DESIGN-01 — kaputt\nok DESIGN-02 — heil\n',
    dateiOk: true,
  })
  assert.equal(stand.modus, 'je-eval')
  assert.equal(stand.urteile['DESIGN-01'].ok, false)
  assert.equal(stand.urteile['DESIGN-02'].ok, true)
})

test('leseAnkuendigung liest die Kennungen, die eine Prüfung einzeln verantwortet', () => {
  assert.deepEqual(leseAnkuendigung(GESTALT_AUSGABE), DESIGN_IDS)
  assert.equal(leseAnkuendigung('TAP version 13\nok 1 - INV-02 hält die Herkunft fest\n'), null)
})
