# Abnahme des Aufräumens

Gegenstück zu `messlatte.md`. Dort steht der Stand **vorher**, hier der Stand **danach**
— gemessen, nicht behauptet. Zu jeder Zahl steht wieder der Befehl daneben, mit dem sie
geholt wurde.

**Gemessen am:** 9. August 2026
**Zweig:** `claude/d-28fv4p`
**Stand (Commit):** `f93b4b2`
**Node:** `v22.22.2`
**Voraussetzung für die Rauchtests:** ein lokaler Server auf Port 4173
(`cd app && python3 -m http.server 4173`) — lief bei dieser Messung.

---

## Die kurze Antwort

Das Aufräumen hat nichts kaputt gemacht. Alle Zahlen der Messlatte sind gehalten oder
besser. Zwei Schäden, die beim Aufräumen selbst entstanden waren, sind gefunden und
behoben; sie sind unten einzeln aufgeführt.

Ein Punkt wartet weiterhin auf einen Menschen, und einer auf eine andere Maschine.
Beide stehen unter „Was offen ist".

---

## Die Zahlen, vorher gegen nachher

| Was gezählt wird | Vorher | Jetzt | Befehl |
|---|---|---|---|
| Bestandene Prüfungen | **984**, 0 rot | **1016**, 0 rot | `cd app && npm run test:unit` |
| Rauchtests gesamt | 13 | **14** | `find app/test -name '*smoke*.mjs' \| wc -l` |
| davon grün | 12 | **13** | `cd app && npm run test:smoke` |
| davon echt rot | 0 | **0** | dieselbe Ausgabe |
| Wächter | *gab es nicht* | **10**, alle grün | `node betrieb/waechter/alle.mjs` |
| Versionierte Dateien unter `app/evals/results/` | 46 | **28** | `git ls-files app/evals/results/ \| wc -l` |
| Fertigzustand bestanden | — | **146** | `cd app && node evals/run-fertigzustand.mjs` |
| Qualitätsbewertung | — | **4,88 / 5** | dieselbe Ausgabe |
| Abdeckung | — | **99 %** | dieselbe Ausgabe |

**32 Prüfungen mehr als vorher**, keine einzige verloren. Der Zuwachs kommt aus dem
Netz unter Jakobs Texten (alte Speicherstände werden jetzt wirklich geöffnet) und aus
den Prüfungen, die vorher gar keinen Starter hatten.

### Zur Zahl 28 — sie weicht bewusst von der Erwartung ab

Die Messlatte erwartete hier **10**. Es sind 28 geworden, und das ist Absicht:
18 Bildschirmfotos sind wieder dazugekommen. Der Grund steht unten unter „Schaden 1".

---

## Was das Aufräumen gebracht hat, an drei Stellen belegt

**Die Prüfung, die Jakobs Schlüssel schützt, läuft jetzt.**
`app/evals/pruefungen/schluessel-leck.mjs` verhindert, dass der API-Schlüssel in einen
Export durchsickert. Die Bestandsaufnahme fand: Sie hatte **null** Treffer, wurde also
von keinem Starter aufgerufen. Heute läuft sie im Fertigzustand als Nummer 79 von 79 mit.

**Ein roter Rauchtest verdeckt die dahinterliegenden nicht mehr.**
Vorher stand in `package.json` eine Schleife mit `|| exit 1`, die beim ersten Roten
abbrach. Heute läuft jeder Test zu Ende, und am Schluss steht eine Übersicht über alle 14.

**Das Sternchen findet jede Prüfung.**
`test:unit` stand auf einem unzitierten Muster, das nur eine Ebene tief griff. Es fiel
nicht auf, weil es keine Prüfdateien in Unterordnern gab — wer welche angelegt hätte,
hätte sie stillschweigend nicht mitgeprüft. Jetzt ist das Muster zitiert und greift tief.

---

## Zwei Schäden, beim Aufräumen entstanden und behoben

### Schaden 1 — die Belege der Qualitätsbewertung waren weggeräumt

Erzeugte Dateien wurden aus der Versionsverwaltung genommen. Das war richtig: Sie waren
der einzige nachgewiesene Konfliktgrund des Projekts. Mitgegangen sind aber 18
Bildschirmfotos, die **zitiert** werden: `app/evals/onda-ui-rubric.json` führt sie als
die Belege auf, auf die sich die bestandene Qualitätsbewertung stützt, und
`app/test/onda-quality-rubric.test.mjs` prüft jeden einzeln nach.

Folge: Diese Prüfung wurde rot — 1015 von 1016 statt 1016 von 1016.

Behoben: Es gilt jetzt dieselbe Unterscheidung, die im Projekt schon für `archiv/` und
`verlauf/` gilt — **Gedächtnis bleibt, Ausgabe geht.** Die 18 zitierten Bilder bleiben
versioniert, die übrigen 28 nicht. Ein Beleg, den man wegwirft, belegt nichts mehr.

Damit die beiden Stellen nicht auseinanderlaufen, **liest** der Wächter
`betrieb/waechter/erzeugt.mjs` die Liste aus der Rubrik, statt sie zu wiederholen. Es
gibt genau eine Liste. Wer dort ein Bild streicht, verliert automatisch die Ausnahme dafür.

Gegenprobe: ein nicht zitiertes Bild hineingelegt → Wächter rot; wieder heraus → grün.

### Schaden 2 — ein Wächter schlug Alarm, wo nichts war

Der Verweis-Wächter meldete `evals/results/fertigzustand-latest.json` als toten Verweis.
Der Verweis steht aber in einem Kommentar, der erzählt, dass das Tor diese Datei **bis
zum 6.8.2026** las und dass genau das schiefging. Die Datei *soll* es nicht mehr geben.

Behoben: Der Fall steht jetzt als begründete Ausnahme im Wächter, wie fünf andere auch.

Der Grund, warum das kein Schönheitsfehler ist: Ein Wächter, der bei richtigem Zustand
rot leuchtet, erzieht dazu, ihn zu übergehen. Dann übersieht man den Tag, an dem er zu
Recht rot ist.

---

## Eine Verbesserung, die aus der Abnahme entstand

Der Rauchlauf kannte nur grün und rot. `test/etappe-d2-smoke.mjs` prüft in zwei
Browsern: In Chromium läuft er durch und meldet `PASS`, dann bricht er ab, weil Firefox
auf dieser Maschine nicht installiert ist. Das zählte als ROT — der Rauchlauf stand also
dauerhaft auf Rot, ohne dass etwas kaputt war.

Es gibt jetzt drei Zustände: grün, rot, **nicht messbar**. Die Erkennung ist bewusst eng
gehalten (nur die Meldung „Executable doesn't exist" für einen benannten Browser); alles
andere bleibt rot, denn ein weiter gefasster Filter würde echte Fehler verschlucken.

Verschwiegen wird dabei nichts. Die Übersicht nennt die Zahl, den fehlenden Browser, den
Befehl, der die Lücke schließt, und den Satz: *Solange sie offen ist, ist dieser Teil der
Oberfläche ungeprüft — nicht in Ordnung.*

Gegenprobe mit zwei Wegwerf-Dateien: die absichtlich kaputte zählt als ROT und setzt den
Ausgang auf 1, die mit vorgetäuschtem Browser-Fehler zählt als nicht messbar.

---

## Was offen ist

### Wartet auf einen Menschen: der Tag auf dem Server

Der Sicherungspunkt `vor-aufraeumen-2026-08-08` liegt nur auf dem Arbeitsrechner. Der
Versuch, ihn hochzuschieben, wird von GitHub mit `403` abgewiesen — dieser
Arbeitsumgebung fehlt das Schreibrecht für Tags. Am 9.8.2026 erneut geprüft, unverändert.
Auf dem Server liegt überhaupt kein Tag.

Ein Mensch mit Schreibrecht auf `codegodjakob/onda` braucht einen Befehl, ohne
Nebenwirkung, er verändert keinen Zweig:

```
git push origin refs/tags/vor-aufraeumen-2026-08-08
git ls-remote --tags origin | grep -c vor-aufraeumen-2026-08-08     # soll 1 sein
```

### Wartet auf eine andere Maschine: Firefox und der Mac-Bau

**Firefox** fehlt in dieser Arbeitsumgebung. Dadurch ist `test/etappe-d2-smoke.mjs` nur
zur Hälfte geprüft (Chromium grün, Firefox ungeprüft), und im Fertigzustand bleiben
`AUDIT-01` und `AUDIT-03` unbelegt — beide hängen an genau diesem Test. **Ohne diese
Lücke wären es 148 bestanden und kein einziger offener Punkt.** Auf einem Rechner mit
Firefox schließt sich das von selbst; hier hilft `npx playwright install firefox`.

**Der Mac-Bau** (`cd mac && ./build.sh`) ist hier nicht prüfbar — der Container läuft
unter Linux, Swift und Xcode gibt es nicht. Er muss auf Jakobs Mac geprüft werden.

### Bewusst offen, unabhängig vom Aufräumen

Vier Punkte des Fertigzustands sind als „extern" gekennzeichnet und lassen sich von
keiner Maschine automatisch belegen:

- **INV-06** — Offline-Würde: braucht die gebaute Mac-App bei wirklich getrenntem Netz.
- **SYSTEM-03** — die abschließende Schlüsselbund-Inspektion an der signierten Mac-App.
- **SYSTEM-09** — der letzte Gleichheitsbeleg zwischen Browser- und Mac-Weg mit echtem Zugang.
- **EFFECT-06** — Nutzerstudie mit echten Leserinnen und Lesern.

### Ein wackliger Test, schon vorher bekannt

`test/etappe-b2-smoke.mjs` schwankt: Er kann ohne Zutun einmal rot melden. Bei dieser
Messung war er grün. Regel bleibt: **bei Rot ein zweites Mal starten.** Bleibt er auch
dann rot, ist es ein echter Schaden.

---

## Wie man das alles selbst nachprüft

```
cd app && npm run test:unit          # soll 1016 bestanden, 0 rot melden
cd app && npm run build              # soll durchlaufen
node betrieb/waechter/alle.mjs       # soll 10 von 10 grün melden

# für die Rauchtests zuerst in einem zweiten Fenster:
cd app && python3 -m http.server 4173
cd app && npm run test:smoke         # 13 grün, 0 rot, 1 nicht messbar

cd app && node evals/run-fertigzustand.mjs   # 146 bestanden, 4,88/5
```
