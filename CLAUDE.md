# Onda

Ein lokales Schreib- und Denkwerkzeug. Deutschsprachig, läuft vollständig auf dem
eigenen Rechner. Web-Oberfläche (Vanilla JS + Tiptap) in einer Mac-Hülle (Swift +
WKWebView). Der Agent spricht direkt mit der Anthropic-API; der Schlüssel liegt im
macOS-Schlüsselbund und verlässt die App nie.

**Der Nutzer ist nicht technisch.** Erkläre in klarem Deutsch, ohne Fachbegriffe, die
nicht sofort miterklärt werden. Belege Behauptungen über das System am Code, nicht an
den Spezifikationen — die lagen schon falsch (siehe `docs/VISION-GEGEN-GEBAUTES.md`).

## Diese Datei wiederholt nichts

Sie sagt nur, wo etwas steht. Was hier ein zweites Mal stünde, würde an einer der beiden
Stellen altern — und niemand wüsste, an welcher.

| Frage | Die Antwort steht in |
|---|---|
| Was ist Onda, wie startet man es, wie prüft man es? | `README.md` |
| Welche Regeln gelten, und welcher Wächter erzwingt sie? | `KONVENTIONEN.md` |
| Welche Ordner gibt es, und wie heißen die Dinge? | `CONTEXT.md` |
| Welche Entscheidung wurde wann und warum getroffen? | `docs/adr/` |
| Welches Papier unter `docs/` gilt noch, welches ist archiviert? | `docs/README.md` |
| Wer arbeitet gerade woran? | `betrieb/LEITSTAND.md` und `betrieb/REVIERE.md` |

## Was ein Agent hier zusätzlich wissen muss

### Issue tracker

Issues leben in GitHub Issues unter `codegodjakob/onda` (privat), bedient über die
`gh`-Befehlszeile. Siehe `docs/agents/issue-tracker.md`.

### Triage labels

Die fünf kanonischen Rollen, jedes Etikett heißt wie seine Rolle: `needs-triage`,
`needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Siehe
`docs/agents/triage-labels.md`.

### Domain docs

Einzelner Kontext — `CONTEXT.md` und `docs/adr/` im Projektwurzelverzeichnis. Siehe
`docs/agents/domain.md`.

## Prüfen — die Kurzfassung

```
cd app && npm run test:unit      # die Tests; die Anzahl zeigt der Lauf selbst
cd app && npm run test:smoke     # die Rauchtests im Browser
cd app && npm run build          # das Bündel bauen
node betrieb/waechter/alle.mjs   # alle Wächter auf einmal
```

**Der Prüfserver ist nicht irgendein Dateiserver.** Browser-Prüfungen laufen gegen
`http://127.0.0.1:4173/`, und dorthin gehört genau dieser eine Server:

```
cd app && npm run dev            # startet app/scripts/dev-server.mjs auf Port 4173
```

Er baut das Bündel beim Start und nach jeder Änderung neu (`app/scripts/dev-server.mjs`
lädt dafür esbuild). Ein bloßer Dateiserver tut das nicht: `app/dist/` steht in
`.gitignore`, ist also im frischen Baum leer. Wer die Prüfung gegen einen solchen Server
laufen lässt, misst ein altes oder gar kein Bündel — und damit etwas anderes als den
Code, den er gerade geschrieben hat.

Die lange Fassung mit allen Läufen steht in `README.md`, die Regeln dahinter in
`KONVENTIONEN.md`.
