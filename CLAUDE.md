# Onda

Ein lokales Schreib- und Denkwerkzeug. Deutschsprachig, läuft vollständig auf dem
eigenen Rechner. Web-Oberfläche (Vanilla JS + Tiptap) in einer Mac-Hülle (Swift +
WKWebView). Der Agent spricht direkt mit der Anthropic-API; der Schlüssel liegt im
macOS-Schlüsselbund und verlässt die App nie.

**Der Nutzer ist nicht technisch.** Erkläre in klarem Deutsch, ohne Fachbegriffe, die
nicht sofort miterklärt werden. Belege Behauptungen über das System am Code, nicht an
den Spezifikationen — die lagen schon falsch (siehe `docs/VISION-GEGEN-GEBAUTES.md`).

## Agent skills

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

## Orientierung

| Datei | Inhalt |
|---|---|
| `docs/ONDA-SYSTEM.md` | Das ganze System in 16 Kapiteln |
| `docs/VISION-GEGEN-GEBAUTES.md` | Der Abstract gegen den Code geprüft |
| `docs/REDESIGN-IDEEN.md` | Gesammelte Umgestaltungsideen, noch nichts entschieden |
| `docs/ABNAHME-ETAPPE-A.md` | Abnahme der zehn Kriterien für den KI-Anschluss |
| `docs/rueckmeldung/` | Jakobs Rückmeldungs-Karten (Quelle des Eval-Katalogs). Regel: Was der Eval-Katalog zitiert, ist versioniert |
| `app/evals/v2-fertigzustand.json` | 83 Evals, die den Fertigzustand definieren |

## Prüfen

```
cd app && npm test          # 470 Tests
cd app && npm run build     # Bundle bauen
cd mac && ./build.sh        # Mac-App bauen
node evals/run-fertigzustand.mjs   # Fertigzustand frisch messen
node evals/zeichne-stand.mjs       # Diagramm dazu
```

Browser-Prüfungen brauchen einen lokalen Server auf Port 4173 (`cd app && python3 -m
http.server 4173`).
