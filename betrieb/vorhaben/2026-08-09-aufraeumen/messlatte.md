# Messlatte vor dem Aufräumen

Der Stand, an dem später gemessen wird, ob das Aufräumen etwas kaputt gemacht hat.
Zu **jeder** Zahl steht der Befehl daneben, mit dem sie geholt wurde. Das ist der Punkt
dieser Datei: In der Bestandsaufnahme haben drei Agents für dieselbe Frage drei
verschiedene Zahlen geliefert, weil keiner dazuschrieb, wie er gezählt hat.

**Gemessen am:** 8. August 2026
**Zweig:** `claude/d-28fv4p`
**Stand (Commit):** `8343d9f26703e087ff73b8701d42f727c1382afb`
**Node:** `v22.22.2`
**Voraussetzung für die Rauchtests:** ein lokaler Server auf Port 4173
(`cd app && python3 -m http.server 4173`) — lief bei dieser Messung.

---

## Der benannte Stand zum Zurückzeigen

| Was | Wert | Befehl |
|---|---|---|
| Tag lokal vorhanden | ja, zeigt auf `8343d9f` | `git rev-parse vor-aufraeumen-2026-08-08^{commit}` |
| Tag auf dem Server | **nein — 0** | `git ls-remote --tags origin \| grep -c vor-aufraeumen-2026-08-08` |

**Blockiert — das kann nur ein Mensch mit Schreibrecht erledigen, nicht diese
Arbeitsumgebung.** Es ist keine offene Arbeit mehr, an der ein Agent noch etwas
versuchen könnte; es fehlt schlicht die Berechtigung. Der Versuch, den Tag
hochzuschieben, wird abgewiesen:

```
$ git push origin refs/tags/vor-aufraeumen-2026-08-08
error: RPC failed; HTTP 403 curl 22 The requested URL returned error: 403
send-pack: unexpected disconnect while reading sideband packet
fatal: the remote end hung up unexpectedly
```

Das `403` kommt von GitHub selbst (nachgewiesen mit `GIT_CURL_VERBOSE=1`, die Antwort
trägt eine `X-Github-Request-Id`), nicht vom Zwischenrechner der Arbeitsumgebung —
dessen Fehlerprotokoll ist leer (`curl -sS "$HTTPS_PROXY/__agentproxy/status"` →
`recentRelayFailures: []`). **Lesen** vom Server geht (`git ls-remote --heads origin`
listet die Zweige), **Schreiben** nicht. Dieser Arbeitsumgebung fehlt schlicht das
Schreibrecht; die Regel der Umgebung lautet, ein solches `403` zu melden statt es zu
umgehen.

Gegengeprüft über die GitHub-Schnittstelle: Das Verzeichnis der Tags von
`codegodjakob/onda` ist **leer** (`[]`) — auf dem Server liegt nicht nur dieser Tag
nicht, sondern überhaupt keiner.

**Was zu tun ist — für einen Menschen mit Schreibrecht auf `codegodjakob/onda`:** ein
einziger Befehl, ohne Nebenwirkung, er verändert keinen Zweig:

```
git push origin refs/tags/vor-aufraeumen-2026-08-08
```

Der Tag zeigt lokal auf `8343d9f26703e087ff73b8701d42f727c1382afb`. Ob es geklappt
hat, zeigt danach:

```
git ls-remote --tags origin | grep -c vor-aufraeumen-2026-08-08     # soll 1 sein
```

Bis dahin gibt es den benannten Stand nur auf diesem Rechner.

---

## Die vier Zahlen

| # | Was gezählt wird | Zahl | Befehl |
|---|---|---|---|
| 1 | Bestandene Unit-Tests | **984** bestanden, **0** rot | `cd app && npm run test:unit` |
| 2 | Prüfdateien, die dieser Lauf abdeckt | **94** | `ls app/test/*.test.mjs \| wc -l` |
| 3 | Rauchtest-Dateien | **13** | `ls app/test/*smoke*.mjs \| wc -l` |
| 4 | Versionierte Dateien unter `app/evals/results/` | **46** | `git ls-files app/evals/results/ \| wc -l` (aus dem Wurzelverzeichnis, nicht aus `app/` — von dort liefert derselbe Befehl `0`) |

### Zu Zahl 1 — die echte Schlusszeile des Laufs

```
1..984
# tests 984
# suites 0
# pass 984
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 13831.406304
```

### Zu Zahl 2 — flach und tief zählen heute gleich

`test:unit` steht heute auf dem unzitierten Muster `node --test test/*.test.mjs`, das
nur eine Ebene tief greift. Das fällt derzeit nicht auf, weil es keine Prüfdateien in
Unterordnern gibt:

```
ls app/test/*.test.mjs | wc -l          →  94   (flach)
find app/test -name '*.test.mjs' | wc -l →  94   (rekursiv)
```

Beide Zahlen sind gleich. **Wer später Prüfdateien in Unterordner legt, muss beide
Zahlen erneut vergleichen** — dann trennen sie sich, und die 984 wäre stillschweigend
zu niedrig.

---

## Die 13 Rauchtests, jeder einzeln gestartet

Jeder Test wurde **für sich** gestartet (`cd app && node test/<datei>`) und sein
Endestand abgelesen. Ausdrücklich **nicht** über `npm run test:smoke` — dort steht eine
Schleife mit `|| exit 1`, die beim ersten Roten abbricht und alles Dahinterliegende
verdeckt.

Der Befehl, der diese Tabelle erzeugt hat:

```
cd app && for f in test/*smoke*.mjs; do node "$f" >/dev/null 2>&1; echo "$f -> exit=$?"; done
```

| # | Rauchtest | Endestand | Ergebnis |
|---|---|---|---|
| 1 | `test/decision-log-smoke.mjs` | `exit=0` | grün |
| 2 | `test/etappe-a-smoke.mjs` | `exit=0` | grün |
| 3 | `test/etappe-b1-smoke.mjs` | `exit=0` | grün |
| 4 | `test/etappe-b2-smoke.mjs` | `exit=0` | grün *(siehe Hinweis)* |
| 5 | `test/etappe-c1-smoke.mjs` | `exit=0` | grün |
| 6 | `test/etappe-c2-smoke.mjs` | `exit=0` | grün |
| 7 | `test/etappe-d1-smoke.mjs` | `exit=0` | grün |
| 8 | `test/etappe-d2-smoke.mjs` | `exit=1` | **teils unmessbar** *(siehe Hinweis)* |
| 9 | `test/onda-ui-smoke.mjs` | `exit=0` | grün |
| 10 | `test/performance-smoke.mjs` | `exit=0` | grün |
| 11 | `test/quellen-smoke.mjs` | `exit=0` | grün |
| 12 | `test/typografie-smoke.mjs` | `exit=0` | grün |
| 13 | `test/v2-smoke.mjs` | `exit=0` | grün |

**Summe: 12 grün, 1 teils unmessbar, 0 echt rot.**

### Hinweis zu `etappe-d2-smoke` — das eine `exit=1`

Der Test prüft zwei Browser nacheinander. Der erste läuft durch, der zweite ist auf
diesem Rechner gar nicht vorhanden. Wörtliche Ausgabe:

```
Etappe D2 smoke (chromium): PASS
browserType.launch: Executable doesn't exist at /opt/pw-browsers/firefox-1538/firefox/firefox
```

Also: **Chromium-Teil grün, Firefox-Teil unmessbar, weil Firefox in dieser
Arbeitsumgebung fehlt.** Das ist kein Schaden am Programm und **nicht** vom Aufräumen
verursacht — es war vorher schon so. Wer diese Messlatte später vergleicht, darf hier
weiterhin `exit=1` erwarten; erst wenn schon der Chromium-Teil nicht mehr `PASS`
meldet, ist etwas kaputt.

### Hinweis zu `etappe-b2-smoke` — wacklig

Dieser Test ist als schwankend vorgefunden: Er ist bei dieser Messung **grün**, kann
aber ohne Zutun einmal rot melden. Regel für später: **bei Rot ein zweites Mal starten.**
Bleibt er beim zweiten Lauf rot, ist es ein echter Schaden.

---

## Kurz, was später gelten muss

Nach dem Aufräumen darf keine dieser Zahlen schlechter sein:

- `cd app && npm run test:unit` → mindestens **984** bestanden, **0** rot
- Die 13 Rauchtests → mindestens **12 grün**, nur `etappe-d2` darf am fehlenden
  Firefox scheitern
- `git ls-files app/evals/results/ | wc -l` → soll nach dem Aufräumen **sinken**
  (die erzeugten Ergebnisdateien sollen raus); von **46** ist die Rede von **10**
- Der Tag `vor-aufraeumen-2026-08-08` muss auf dem Server liegen — heute tut er es
  nicht, siehe oben. **Das ist der eine Punkt, der von hier aus nicht zu erledigen ist
  und auf einen Menschen wartet.**
