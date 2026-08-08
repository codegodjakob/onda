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
| `docs/PHILOSOPHIE.md` | Die Gestaltungsgrundsätze. Entschieden, nicht gesammelt — eine Oberfläche, die einem widerspricht, ist falsch |
| `docs/ONDA-SYSTEM.md` | Das ganze System in 16 Kapiteln |
| `docs/VISION-GEGEN-GEBAUTES.md` | Der Abstract gegen den Code geprüft |
| `docs/REDESIGN-IDEEN.md` | Gesammelte Umgestaltungsideen, noch nichts entschieden |
| `docs/ABNAHME-ETAPPE-A.md` | Abnahme der zehn Kriterien für den KI-Anschluss |
| `docs/rueckmeldung/` | Jakobs Rückmeldungs-Karten (Quelle des Eval-Katalogs). Regel: Was der Eval-Katalog zitiert, ist versioniert |
| `app/evals/v2-fertigzustand.json` | Der Eval-Katalog, der den Fertigzustand definiert — Anzahl und Stand frisch messen: `node evals/run-fertigzustand.mjs` |

## Prüfen

```
cd app && npm test          # alle Tests; die Anzahl zeigt der Lauf selbst
cd app && npm run build     # Bundle bauen
cd mac && ./build.sh        # Mac-App bauen
node evals/run-fertigzustand.mjs   # Fertigzustand frisch messen
node evals/zeichne-stand.mjs       # Diagramm dazu
```

Browser-Prüfungen bringen ihren Server selbst mit, auf einem Port, den das
Betriebssystem vergibt. Man muss also vorher nichts starten. Wer ausdrücklich gegen
einen laufenden Server prüfen will, setzt `AIWT_URL`.

Der feste Port 4173 ist am 8. August 2026 abgeschafft worden: er gehört dem, der ihn
zuerst belegt, und bei zwei gleichzeitigen Arbeitskopien prüfte der Test dann die
falsche. `mac/build.sh` lief davon zufällig rot. Siehe `app/test/helpers/onda-server.mjs`.
