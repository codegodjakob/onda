# Was unter docs/ liegt — und was davon noch gilt

Jede Zeile unten trägt einen von genau zwei Stempeln, einen dritten gibt es nicht: entweder es gilt, oder es ist archiviert.

- **gilt** — gepflegt, am Code nachgeprüft, verbindlich. Wer sich darauf stützt, stützt sich richtig.
- **archiviert** — als Zeitdokument aufgehoben, mit Absicht nicht mehr gepflegt. Wer sich darauf stützt, tut es auf eigene Rechnung.

Warum es diese Seite gibt: Ein Papier, das nicht mehr stimmt, tut nicht weh — es wird nur still falsch, und der nächste Leser merkt es nicht. Der Stempel macht sichtbar, was gilt.

Ein Umzug in einen Ordner namens „alt" leistet nichts, was der Stempel nicht auch leistet — und er bräche jeden Verweis, der heute auf ein archiviertes Papier zeigt.

## Was gilt

- `PHILOSOPHIE.md` — **gilt.** Die Gestaltungsgrundsätze: entschieden, nicht gesammelt. Das meistzitierte Papier des Projekts — 35 Kopfkommentare im Programm verweisen darauf.
- `ONDA-SYSTEM.md` — **gilt.** Das ganze System in 16 Kapiteln, Stand 05.08.2026. Die kurze Betriebs- und Architekturkarte des Gebauten.
- `VISION-GEGEN-GEBAUTES.md` — **gilt.** Der Abstract gegen den Code geprüft, Stand 05.08.2026. Maßgeblich bleibt der frische Messlauf, nicht dieses Papier.
- `DIE-DREI-MOMENTE.md` — **gilt.** Die Herleitung, wann eine Rückmeldung sichtbar werden darf. Die Tabelle selbst lebt im Programm, hier steht der Grund dafür.
- `DIE-GESTALT-EINER-ERWEITERUNG.md` — **gilt.** Gestalt und Belege der drei Erweiterungsarten. Die Regeln selbst leben im Programm, hier steht die Begründung.
- `FREMDE-FEHLERMODELLE.md` — **gilt.** Drei Prüfungen, deren Fehlerbilder von außen kommen; keins davon ist in Onda je passiert. Alle drei laufen im normalen Testlauf mit.
- `REDESIGN-IDEEN.md` — **gilt** als offene Sammlung. Ausdrücklich ist nichts darin entschieden und nichts davon gebaut; jeder Eintrag trägt `open`, `agreed` oder `rejected`.
- `docs/adr/` — **gilt.** Eine Datei je Entscheidung: was entschieden wurde, warum, und woran man es im Code nachliest. Angehängt, nie umgeschrieben — auch ein abgelöster Eintrag bleibt stehen und gilt als Beleg dafür, wie es dazu kam.
- `agents/` — **gilt.** Die drei Betriebsanleitungen für Agenten: Issue-Tracker, Triage-Etiketten, Domain-Dokumente. `CLAUDE.md` verweist auf alle drei.
- `rueckmeldung/` — **gilt.** Jakobs Rückmeldungs-Karten, die Quelle des Eval-Katalogs. Regel: Was der Eval-Katalog zitiert, ist versioniert und wird nicht angefasst.
- `README.md` — **gilt.** Diese Seite. Ein neues Papier unter `docs/` bekommt hier eine Zeile mit Stempel, sonst gilt es nicht.

## Was archiviert ist

- `evals/` — **gemischt: zwei Protokolle gelten, zwei Berichte sind archiviert.** Die Mess- und Prüfprotokolle der Abnahmen; der aktuelle Stand kommt nie aus diesem Ordner, sondern aus einem frischen Messlauf.
  - `evals/SYSTEM-11-wcag-protokoll.md` — **gilt.** Das Protokoll, nach dem die Barrierefreiheit von Hand geprüft wird. Eine Anleitung, keine Momentaufnahme.
  - `evals/EFFECT-06-studienprotokoll.md` — **gilt.** Das Protokoll für die Wirkungsstudie. Ebenfalls Anleitung, ebenfalls keine Momentaufnahme.
  - `evals/2026-08-05-fertigzustand.md` — **archiviert.** Der Fertigzustandsbericht vom 05.08.2026, eine Momentaufnahme. Frisch messen statt hier nachschlagen.
  - `evals/2026-08-05-onda-ui-neubau.md` — **archiviert.** Der Messbericht zum Oberflächen-Neubau vom 05.08.2026, ebenfalls eine Momentaufnahme.
- `research/` — **archiviert.** 34 datierte Recherchestände von Juni bis August 2026: Quellenmaterial, nicht gepflegte Wahrheit. Zwei davon werden namentlich zitiert (aus `app/evals/v2-fertigzustand.json` und aus einem Kopfkommentar) und dürfen darum nicht umbenannt werden, obwohl sie archiviert sind.
- `superpowers/` — **archiviert.** Spezifikationen, Pläne und Arbeitsprotokolle der abgeschlossenen Etappen (Juli 2026). Der Ordner sagt das in seiner eigenen `README.md` selbst.
- `archiv/` — **archiviert.** Der Standortbericht vom 26.07.2026 und die Systemanalysen vom August 2026. Der Name sagt es, der Stempel bestätigt es.
- `ABNAHME-ETAPPE-A.md` — **archiviert.** Die Abnahme der zehn Kriterien für den KI-Anschluss, geprüft gegen Commit `00b485d` vom 30.07.2026. Die Etappe ist abgeschlossen; ein Kopfkommentar im Programm zitiert das Papier noch.
- `TRANSFER-komplettkonzept.md` — **archiviert.** Der selbst-enthaltene Übergabetext vom 30.06.2026. Er beschreibt das Konzept von damals und ist vom heutigen Stand an mehreren Stellen überholt.
