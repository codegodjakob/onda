# Leitstand — Überblick

Stand: **8. August 2026, 12:15**, gemessen auf Commit `94c0c81`.
Zweck: Das Dokument, das der Leitstand beim Wiedereinstieg zuerst liest. Alle Zahlen hier sind
**selbst gemessen**, mit Commit und Uhrzeit — nie aus einem anderen Dokument übernommen (das war
Befund 6 der Systemanalyse). Wer es fortschreibt, misst neu oder streicht die Zahl.

Erhebung: fünf parallele Leser über Historie, Subsysteme, Oberfläche, Doku-Wahrheit und
Issue-Realität, dazu drei eigene Messläufe.

---

## 1. Die Lage in fünf Sätzen

Seit der Systemanalyse vom 4. August sind **117 Commits** gelaufen — davon **null** mit Bezug auf
den Fahrplan, den diese Analyse hervorgebracht hat. Die Arbeit ging stattdessen in drei andere
Stränge: einen tiefen Oberflächen-Umbau, ein Figma-Werkzeug und den ersten automatischen Prüflauf.
Das Ergebnis ist beachtlich — 926 Unit-Tests grün, 152 Evals im Katalog, sechs neue Subsysteme, und
zum ersten Mal ein schriftlich **bindender Gestaltungsgrundsatz**. Gleichzeitig liegt das
wichtigste Paket des Fahrplans (#12, das Pflicht-Tor) **fertig gebaut auf einem Zweig, der nie
zusammengeführt wurde** — main ist seither 103 Commits weitergelaufen. Und die Selbstauskunft ist
wieder auseinandergedriftet: die eingecheckte Messzahl behauptet 100 %, gemessen sind 95 %.

---

## 2. Frische Zahlen (8.8., Commit 94c0c81)

| Was | Wert | Wie gemessen |
|---|---|---|
| Unit-Tests | **926 grün, 0 rot** | `npm run test:unit` |
| Rauchtests | **13 grün** (v2-smoke seit `94c0c81` repariert) | Sammellauf |
| Build | grün, 870 kB Bundle | `npm run build` |
| Eval-Katalog | **152 Evals, 19 Suiten** (04.08.: 95 / 13) | ausgezählt |
| Fertigzustand frisch | **139 bestanden · 8 rot · 5 Live-Gates · 95 % Abdeckung · Note 4,88** | `run-fertigzustand.mjs`, 10:12 |
| Fertigzustand eingecheckt | 147/147, 100 % — **8 Evals zu optimistisch**, erzeugt 07.08. auf `2a7f4a9` | `git show HEAD:…latest.json` |
| Code app/src | 32.860 Zeilen, 92 Dateien (04.08.: 25.605 / 67) | `wc -l` |
| Tests app/test | 23.646 Zeilen, 104 Dateien (04.08.: 15.485 / 67) | `wc -l` |
| Issues #11–#28 | 4 geschlossen, 14 offen | `gh issue list` |
| CI auf main | **3 Läufe, 2 rot — main war noch nie grün** | `gh run list` |

---

## 3. Was gebaut wurde (die drei Stränge)

**a) Der Oberflächen-Umbau (ca. 30 Commits, 5.–8.8.) — der wichtigste Strang.**
Die Schreibansicht wurde entkernt: Anmerkungsleiste, Plus am Absatz, Platte unter der Schreibmarke,
Name unten links — alle weg. Geblieben ist ein Stift-Zeichen, das nur zwei Dinge kann. Dahinter
steht `docs/PHILOSOPHIE.md` §1 „Der andere Stift" — **die erste Design-Entscheidung des Projekts,
die schriftlich als bindend gilt** (von Jakob am 7.8. entschieden). Nachgemessen hält die
Kernzusage: 680 px Textbreite bei jeder Fensterbreite. Dazu 29 Anmerkungsarten mit Vertrag,
umkehrbaren Operationen und eigener Eval-Suite (ONDA-UI, 22 Evals).

**b) Sechs neue Subsysteme (5.8.), 27 neue Dateien.**
KONTEXT · MUSTER · TEXTART · PERSON · LERNEN · ONDA-UI. Inhaltlich decken vier davon Fahrplan-#24
weitgehend ab: Die Textsorte reist jetzt wirklich in alle Prompts (`onda-kontext.mjs`), das
`muster`-Feld wird beim Annehmen eines Hinweises auf die Personen-Ebene geschrieben (der Kern von
#14), und `handwerk-model.mjs` hält Prüffragen je Textart als Tabelle. **Achtung Verwechslung:**
Das sind *nicht* die in #28 bestellten Suiten (GROW, SELF, DIVERGE, GENRE) — die existieren nullmal.

**c) Ein Figma-Werkzeug (31 Commits in zehn Nachtstunden, 6./7.8.).**
`tools/figma-onda-one-page`, 23.779 Zeilen. Eigene Tests: **252 grün, 10 rot** — und sie laufen in
keinem automatischen Prüflauf mit.

---

## 4. Die drei Befunde, die zählen

### I. #12 ist fertig — und liegt seit drei Tagen brach (Hebel: Struktur)

Der Zweig `claude/festive-leavitt-827df9` trägt 15 Commits, das Lauf-Tor, den Rückwachs-Wächter,
das Journal mit Moment-Etikett und eine eigene Abnahme („alle 590 Tests und 10 Smokes grün").
Er wurde nie zusammengeführt. **main ist 103 Commits weitergelaufen**; ein Probemerge meldet
2 Konfliktdateien mit 9 Konfliktstellen in `workspace.js`.

Die Folge ist messbar: Auf main gibt es heute **fünf** handgebaute Kanalsperren statt vier — der
am 8.8. neu gebaute Quellen-Kanal hat die Kopiervorlage ein fünftes Mal kopiert und schreibt es
selbst hin („dieselbe Reihenfolge und dieselben Sicherungen wie versucheErweiterungslauf").
Genau das sollte #12 beenden. Und `docs/ONDA-SYSTEM.md:50` zeichnet bereits ein „Lauf-Tor" ins
Ablaufdiagramm, das im Code nicht existiert.

Weil #13 auf #12 wartet und #14/#27/#28 auf #13, hängt die halbe Spur B an diesem einen Merge.
**Je länger er wartet, desto teurer wird er.**

### II. Die KONTEXT-Suite hat ihren ersten echten Fang gemacht (Hebel: Rückkopplung)

Von den 8 roten Evals sind 3 ein echter, frischer Befund: Der am 8.8. gebaute fünfte Kanal
(`quellen-kontext.mjs`) baut einen Anfragekontext **ohne Projektwissen** — ein blinder Kanal.
Seine eigenen Unit-Tests sind alle grün; gemeldet hat es nur die Eigenschafts-Prüfung, die über
*alle* Kanäle läuft. Das ist genau die Sorte Prüfung, die die Systemanalyse als fehlend benannt
hatte, und sie hat innerhalb von Stunden funktioniert. Die Reparatur ist ein Einzeiler-Muster.

Die anderen 5 roten sind DESIGN-01…05 aus dem Umbau; davon sind **zwei echte Befunde**:
die Anmerkung spannt über die volle Textbreite statt danebenzustehen (x=288, Breite=680 — identisch
mit der Textspalte), und ein angeklickter Baustein klappt nicht auf (44→44→44 px). Beides betrifft
Punkte, die Jakob im Redesign ausdrücklich abgeschafft haben wollte.

### III. Die Drift ist zurück — an den Stellen ohne Wächter (Hebel: Information)

Der Zahlen-Wächter aus #18 läuft und wirkt: CLAUDE.md nennt keine Testzahl mehr, panels.js und die
Codex-Kurs-Dateien sind wirklich weg, die Rückmeldungs-Karten sind versioniert. Aber:

- Die eingecheckte `fertigzustand-latest.json` behauptet **100 %**, gemessen sind **95 %** — sie ist
  von vorgestern und wurde seither nicht neu erzeugt. Genau diese Datei nennen drei Dokumente als
  verlässliche Quelle.
- Drei verschiedene Angaben (vier/fünf/sechs) für die Zahl der externen Live-Gates; korrekt: **fünf**.
- CLAUDE.md behauptet 16 Kapitel in ONDA-SYSTEM.md; es sind **13**.
- `docs/adr/` ist weiter **leer**, obwohl CLAUDE.md es als einen von zwei Domänen-Orten nennt.
- Neues Sediment: **`design-system-2/`** (176 Dateien, 20.985 Zeilen) — von keiner Zeile im Repo
  referenziert, direkt neben dem gleichnamigen alten Ordner. Dazu `app/.mess/` (eingecheckt,
  ohne Verweis) und das Figma-Werkzeug außerhalb jeder Prüfung.
- **40 von 112 Prüfdateien hängen an keinem Eval** — darunter `zwei-fenster.test.mjs`,
  `stilmittel.test.mjs`, `onda-tokens.test.mjs`. Sie können still rot werden, ohne dass es auffällt.

### Was die Forschung angeht: sie ist noch nicht angekommen

Von 34 Dateien in `docs/research/` wird im gesamten `app/src` genau **eine** zitiert. KOMPASS und
DESTILLAT referenziert keine Codezeile. Die Querschnittsregeln (Ironie-Vorfahrt, Verlustprobe,
Relevanzschwelle …) kommen in `agent-prompts.mjs` **nullmal** vor. `handwerk-model.mjs` enthält
plausible Prüffragen, aber ohne Herkunftsangabe — ob sie aus dem DESTILLAT stammen, ist am Code
nicht belegbar. Das ist #26, und es ist zu einem Drittel gebaut.

---

## 5. Der ehrliche Rest-Backlog

**Zuerst, weil alles andere daran hängt:** #12 zusammenführen (oder bewusst verwerfen und neu
bauen — aber entscheiden). Dann #13 → #14/#27/#28.

**Neu entstanden, gehört noch keiner Issue-Nummer:**
1. Der blinde Quellen-Kanal (3 rote KONTEXT-Evals) — kleine Reparatur, hoher Wert.
2. Die zwei echten DESIGN-Befunde aus dem Umbau (Anmerkung über volle Breite, kein Aufklappen).
3. 10 rote Tests im Figma-Werkzeug, außerhalb jeder CI.
4. CI auf main war nie grün.
5. `design-system-2/` — Doppelgänger ohne einen einzigen Verweis: gehört geklärt oder gelöscht.
6. Die eingecheckte Messdatei muss nach jedem Lauf neu geschrieben werden, sonst lügt sie weiter.

**Unverändert offen:** #20 (Textdatei-Spiegel), #21 (Stand-Karte), #22 (Anti-Naheliegend),
#25 (Zwei-Fenster), #26 (Kanal-Prompts, ⅓ gebaut). #24 ist inhaltlich weitgehend erledigt, das
Issue steht aber offen — mit **zwei bewussten Gegenentscheidungen**, die nirgends dagegen
geschrieben sind (Textsorte in `volatiles` statt gecachtem Block — mit ausgeschriebener
Kostenbegründung; drei Integritätslisten hintereinandergeschaltet statt vereinigt).

**Bei Jakob:** #16 (Momente-Setzungen am echten Text), #23 (Gestaltungsfragen, u. a.
Direktivitäts-Default und die vierte Erweiterungsart).

---

## 6. Was ich nicht beurteilen kann

- Ob die 10 roten Figma-Tests einen echten Defekt anzeigen oder veraltete Erwartungen — das
  entscheidet sich in Figma, nicht am Code.
- Ob die Prüffragen in `handwerk-model.mjs` aus der Recherche stammen (keine Herkunftsangabe).
- Ob der #12-Zweig nach dem Merge noch trägt — 103 Commits Abstand, 9 Konfliktstellen.
- Ob `design-system-2` bewusst als Nachfolger gedacht ist oder versehentlich liegen blieb.

---

## 7. Die Lehre für den Leitstand selbst

Zwischen dem 5. und 8. August hat der Leitstand nichts von alldem gesehen. Die Arbeit lief in
Sessions, deren Ergebnisse in Issues kommentiert *oder eben nicht* kommentiert wurden — #12 ist
das teuerste Beispiel: fertig, abgenommen, dokumentiert, und trotzdem unsichtbar, weil niemand
den Merge ausgelöst hat.

**Regel daraus:** Ein Paket gilt erst als fertig, wenn es auf `main` ist und dort frisch gemessen
wurde. „Gebaut auf einem Zweig" ist ein Zwischenstand, kein Ergebnis. Der Leitstand prüft das
beim Wiedereinstieg als Erstes — `git branch --list 'claude/*'` gegen die geschlossenen Issues.
