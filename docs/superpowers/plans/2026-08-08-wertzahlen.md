# Wertzahlen neben den Kostenzahlen — Umsetzungsplan (Issue #13)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neben Tokens und Dollar stehen erstmals Wertzahlen — Annahmequote je Hinweisart, Weglegen-Quote der Erweiterungen, Monatszählung, Kosten je übernommener Rückmeldung — sichtbar NUR im Maschinenzimmer (KI-Dialog); dieselbe Aggregation verdichtet die Entscheidungsliste in den Prompts (der innere Kostentreiber fällt), und der Monatswechsel vernichtet die Verbrauchsgeschichte nicht mehr.

**Architecture:** Ein neues reines Modul `lauf-bilanz.mjs` liefert genau die Zahlen, die noch fehlen (Erweiterungs-Quote, Monatszählung, Kosten je Übernahme aus dem #12-Journal, Verdichtung der Entscheidungsliste). Die Annahmequote je Hinweisart und die Anker-Zustellzahlen kommen aus dem BESTEHENDEN `rueckkopplung-model.mjs` (`bilanziereRueckmeldung` — eine Aggregations-Wahrheit, kein Doppelbau). Anzeige als neuer Abschnitt „Ertrag" in `buildKiSettingsBody` neben dem Verbrauch. `settings-model.mjs` bekommt eine Monats-Historie mit Deckel.

**Tech Stack:** Vanilla ES-Module, `node --test`, esbuild, Playwright-Smokes gegen eigenen Server.

## Global Constraints

- **Keine Zahl auf der Schreibfläche** (bewusste Ruhe-Setzung); Anzeige NUR im KI-Dialog (Einstellungen).
- **Keine Prompt-Präferenzsteuerung** („mehr davon" kommt erst mit #14); die einzige erlaubte Prompt-Rückkopplung bleibt der bestehende, freigabe-gebundene Block aus `rueckkopplung-model.mjs`.
- **Keine Drossel in diesem Paket:** Jakobs Setzung (Issue-Kommentar 05.08.): die Weglegen-Quote DARF später den zeitgesteuerten Erweiterungslauf drosseln — Schwelle erst NACH der ersten Messung, von Jakob. Hier entsteht nur die Messung.
- Jede Quote IMMER mit Basis („3 von 4"); unter 10 bewertbaren Fällen ehrlich „noch zu wenig" statt Prozentzahl. Kein Text wird abgeschnitten (kein „…" — Wächter-Test existiert).
- Eine Aggregations-Wahrheit: Annahmequote je Art und Anker-Zustellung kommen aus `bilanziereRueckmeldung` (rueckkopplung-model.mjs). `lauf-bilanz.mjs` baut NUR, was dort nicht existiert.
- Deutsche Kommentare/Bezeichner, Stil wie Nachbarcode; TDD verpflichtend (RED→GREEN-Beleg im Report).
- Ausgangsbasis (frisch gemessen, d0866da): 986 Unit-Tests grün, 13 Smokes grün, Fertigzustand 4,88/5 (mit 5 bekannten offenen DESIGN-Evals der Gestalt-Baustelle — nicht dieses Paket). Abnahme: nicht schlechter.
- Browser-Prüfungen und Eval-Runner IMMER mit eigenem Server aus DIESEM Worktree + `AIWT_URL` (Port 4179 o. ä.; NIE Port 4173 — kann fremder Session gehören).
- Commits im Repo-Stil, z. B. `wertzahlen: …` + Trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## Dateistruktur

| Datei | Verantwortung |
|---|---|
| Create `app/src/lauf-bilanz.mjs` | Pur: Weglegen-Quote der Erweiterungen, Monatszählung (angenommene Hinweise, gemerkte Erweiterungen), Kosten je übernommener Rückmeldung (aus dem #12-Journal), Verdichtung der Entscheidungsliste (jüngste wörtlich, ältere als Kategorien-Summen), Basis-/„noch zu wenig"-Regeln |
| Modify `app/src/agent-findings.mjs` | `fasseEntscheidungenZusammen` nutzt die Verdichtung (Signatur bleibt) |
| Modify `app/src/chat-kontext.mjs` | `kurzformEntscheidungen` verdichtet ebenso (jüngste wörtlich, Rest summiert) |
| Modify `app/src/settings-model.mjs` | `usageHistorie` (Deckel 24 Monate); Monatswechsel schiebt statt überschreibt — an BEIDEN Wechselstellen (Laden + Buchen), je Monat genau einmal |
| Modify `app/src/workspace.js` | Abschnitt „Ertrag" (`ki-ertrag`) in `buildKiSettingsBody` nach dem Verbrauch; Vormonats-Zeile im Verbrauch aus der Historie |
| Test `app/test/lauf-bilanz.test.mjs` | Bilanz pur inkl. 50-Entscheidungen-Wachstumstest |
| Test bestehend erweitern | `settings-model.test.mjs` (Historie), `agent-findings.test.mjs`/`chat-kontext.test.mjs` (Verdichtung), ein bestehender Smoke (Ertrag sichtbar) |

Fakten für alle Tasks (verifiziert am 2026-08-08, d0866da):
- `doc.decisions`-Eintrag: `{ id, findingId, kind: 'accept'|'reject', outcome: 'resolved'|'dismissed'|'risk-accepted', reason, rejectionScope, appliedText, resultingText, at }` (reasoning-model.mjs:309). Kategorie NICHT im Eintrag — Join über `findingId` → `finding.category`/`artVonFinding` (Vorbild rueckkopplung-model.mjs:185ff).
- Erweiterungen: `status: 'neu'|'gemerkt'|'weg'`, `createdAt`, `entschiedenAt` (erweiterung-model.mjs:39,122-135).
- Journal-Eintrag (#12): `{ kanal, ausloeser, begonnenAt, tokens, kostenCents, ergebnis, geliefert, uebernommen, verworfen, … }`; Zugriff über `torJournal()` (lauf-tor.mjs:52).
- `bilanziereRueckmeldung({ dokumente })` liefert `{ proArt: Array<{ art, angeboten, angenommen, verworfen, risikoAngenommen, bewertbar, verworfenAnteil, lage, … }>, gesamt, handwerk }` (rueckkopplung-model.mjs:185ff, Rückgabe :270); Schwellen dort: MINDESTZAHL_JE_ART=5 usw. — für die ERTRAG-Anzeige gilt die eigene 10er-Regel aus dem Issue.
- Prompt-Kostentreiber: `fasseEntscheidungenZusammen` (agent-findings.mjs:140, je entschiedenem Finding `{anker, kategorie, kurz, entscheidung, begruendung}` → JSON in volatiles, hinweis-kontext.mjs:54) und `kurzformEntscheidungen` (chat-kontext.mjs:103, aus `entscheidungsEintraege`).
- KI-Dialog: `buildKiSettingsBody` (workspace.js:2001), Abschnitte ki-modelle → ki-verbrauch (:2088, `renderKiVerbrauch` :2142) → ki-budget.

---

### Task 1: `lauf-bilanz.mjs` — die fehlenden Zahlen, pur

**Files:**
- Create: `app/src/lauf-bilanz.mjs`
- Test: `app/test/lauf-bilanz.test.mjs`

**Interfaces (Produces):**
```js
export const MINDESTZAHL_ERTRAG = 10   // unter dieser Basis sagt eine Quote „noch zu wenig"
export const WOERTLICH_BEHALTEN = 12   // juengste Entscheidungen, die woertlich im Prompt bleiben
export const HISTORIE_DECKEL = 24      // Monate Verbrauchsgeschichte (nutzt Task 3)

// Erweiterungen: gemerkt/weg/neu ueber alle nicht-trashed Dokumente.
// -> { gemerkt, weg, neu, bewertbar, quote: number|null, aussage: 'quote'|'noch-zu-wenig'|'keine' }
export function weglegenQuote(dokumente)

// Monatszaehlung: kind==='accept'-Entscheidungen (decision.at im Monat) und
// gemerkte Erweiterungen (entschiedenAt im Monat, status 'gemerkt').
// monat im Format 'YYYY-MM' (Vorbild aktuellerMonat, settings-model.mjs:27).
// -> { angenommeneHinweise, gemerkteErweiterungen }
export function monatsZaehlung(dokumente, monat)

// Kosten je uebernommener Rueckmeldung aus dem #12-Journal: Summe kostenCents
// aller Eintraege mit ergebnis !== 'fehler' der Kanaele 'hinweis'/'erweiterung',
// geteilt durch Summe uebernommen. Basisregel wie oben.
// -> { kostenCents, uebernommen, centsJeUebernahme: number|null, aussage }
export function kostenJeUebernahme(journal)

// Verdichtung der Entscheidungsliste: die juengsten WOERTLICH_BEHALTEN Eintraege
// unveraendert, alles Aeltere je Kategorie summiert.
// eintraege: Ausgabeform von fasseEntscheidungenZusammen (mit `at` — siehe Task 2).
// -> { woertlich: [...], summen: [{ kategorie, angenommen, verworfen }] }
export function verdichteEntscheidungen(eintraege, woertlichBehalten = WOERTLICH_BEHALTEN)
```

Kopf-Kommentar nach momente-model-Vorbild: Zahlen + Begründung an einer Stelle (warum 10, warum 12, warum 24 — 10: unterhalb davon ist jede Prozentzahl Rauschen, ehrlich bleiben; 12: genug Kontext fürs Modell, ohne linear zu wachsen; 24: zwei Jahre Geschichte reichen für jede Frage, die das Maschinenzimmer beantworten soll). Ausdrücklich notieren: Annahmequote je Hinweisart kommt NICHT von hier, sondern aus `bilanziereRueckmeldung` — eine Wahrheit. Ebenso notieren: Die Drossel aus Jakobs Setzung ist BEWUSST nicht gebaut (Schwelle erst nach erster Messung).

- [ ] **Step 1: Fehlschlagende Tests schreiben** — `app/test/lauf-bilanz.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { kostenJeUebernahme, monatsZaehlung, verdichteEntscheidungen, weglegenQuote, MINDESTZAHL_ERTRAG, WOERTLICH_BEHALTEN } from '../src/lauf-bilanz.mjs'

test('weglegenQuote zaehlt gemerkt/weg und sagt unter der Mindestzahl ehrlich "noch zu wenig"', () => {
  /* 3 gemerkt + 4 weg (bewertbar 7 < 10) -> aussage 'noch-zu-wenig', quote null, Zahlen stimmen;
     7 gemerkt + 5 weg (12) -> quote 5/12, aussage 'quote';
     nur 'neu' -> aussage 'keine'; trashed-Dokumente zaehlen nicht; Muell wirft nie */
})
test('monatsZaehlung zaehlt accept-Entscheidungen und gemerkte Erweiterungen nur im Monat', () => {
  /* decisions mit at im Juli/August gemischt (kind accept/reject), erweiterungen mit
     entschiedenAt beiderseits der Monatsgrenze -> nur der angefragte Monat zaehlt */
})
test('kostenJeUebernahme teilt Journal-Kosten durch Uebernahmen — Fehllaeufe und fremde Kanaele bleiben draussen', () => {
  /* Journal-Fixture: hinweis geliefert (kostenCents 30, uebernommen 2), erweiterung verworfen
     (20, 0), chat geliefert (50) -> kosten 50, uebernommen 2, 25 Cents je Uebernahme (Basis beachten) */
})
test('verdichteEntscheidungen: die juengsten bleiben woertlich, aeltere werden Kategorien-Summen', () => {
  /* 50 Eintraege, 5 Kategorien -> woertlich.length === WOERTLICH_BEHALTEN,
     summen decken die restlichen 38 ab (angenommen+verworfen stimmen je Kategorie),
     Reihenfolge: juengste zuerst woertlich */
})
test('WACHSTUM: die verdichtete Form waechst nicht linear mit der Entscheidungsgeschichte', () => {
  /* JSON-Laenge bei 50 Eintraegen <= JSON-Laenge bei 20 Eintraegen + fester Zuschlag
     (Anzahl Kategorien * konstante Summenzeile) — der eigentliche Abnahme-Kern von #13 */
})
```

- [ ] **Step 2: FAIL bestätigen** — `cd app && node --test test/lauf-bilanz.test.mjs`.
- [ ] **Step 3: Implementieren** — pur, wirft nie bei Müll (Vorbild settings-model/rueckkopplung-model); Monatsschlüssel lokalzeitlich wie `aktuellerMonat`.
- [ ] **Step 4: PASS bestätigen**, danach ganze Suite: `node --test test/*.test.mjs` (986 + neue).
- [ ] **Step 5: Commit** — `wertzahlen: lauf-bilanz — die fehlenden Zahlen als reines Modul`

---

### Task 2: Die Prompts verdichten — der innere Kostentreiber fällt

**Files:**
- Modify: `app/src/agent-findings.mjs:140` (`fasseEntscheidungenZusammen`)
- Modify: `app/src/chat-kontext.mjs:103` (`kurzformEntscheidungen`)
- Test: `app/test/agent-findings.test.mjs`, `app/test/chat-kontext.test.mjs` (bestehende Erwartungen prüfen und additiv erweitern)

**Interfaces:**
- Consumes: `verdichteEntscheidungen` (Task 1).
- Produces: `fasseEntscheidungenZusammen(findings, decisions)` — Signatur unverändert, Rückgabe NEU: `{ woertlich: [{anker, kategorie, kurz, entscheidung, begruendung}], summen: [{kategorie, angenommen, verworfen}] }`-ARTIG? NEIN — Verhaltensrisiko klein halten: die Funktion liefert weiter EIN Array, aber ab dem (WOERTLICH_BEHALTEN+1)-ältesten Eintrag ersetzt durch Summenzeilen der Form `{ kategorie, summe: { angenommen, verworfen } }`. Für die Sortierung nach Alter braucht jeder Eintrag das Entscheidungsdatum: das `at` der zugehörigen decision (`proFinding.get(finding.id)?.at`) — Eintragsfeld `at` ergänzen, das NUR intern sortiert und NICHT in den Prompt-JSON wandert (vor dem JSON.stringify entfernen oder in verdichteEntscheidungen strippen — entscheiden und testen; keine Zeitstempel im gecachten Präfix ist bestehende Invariante, die Blöcke sind volatil, aber Datumsrauschen in JEDEM Turn verteuert trotzdem — strippen).
- `kurzformEntscheidungen(doc, now)`: dieselbe Regel — die jüngsten WOERTLICH_BEHALTEN wie bisher, ältere als eine Sammelzeile je Art (`'aeltere: 12 angenommen, 4 verworfen, 2 eigene Fassung'`-artig, kompakt, deutsch).

Wichtige Verhaltens-Notiz (in den Code-Kommentar): Die harte Garantie gegen wiederholte Hinweise ist der CLIENTSEITIGE Dedupe (`dedupeHinweise` gegen findings/decisions) — er bleibt unangetastet und arbeitet weiter auf der VOLLEN Liste. Die Prompt-Liste ist Heuristik fürs Modell; ihre Verdichtung ändert keine Client-Prüfung.

- [ ] **Step 1: Bestehende Tests lesen** — welche Erwartungen hängen an der vollen Listenform? (`grep -n "fasseEntscheidungenZusammen\|kurzformEntscheidungen" app/test/*.mjs`). Fehlschlagende neue Tests schreiben: (a) 50 entschiedene Findings → Ausgabe enthält genau WOERTLICH_BEHALTEN wörtliche + je Kategorie eine Summenzeile, jüngste wörtlich (Sortierung über decision.at); (b) unter WOERTLICH_BEHALTEN Einträgen ist die Ausgabe UNVERÄNDERT zur alten Form (Regressionsschutz); (c) kein `at`-Feld in der Ausgabe.
- [ ] **Step 2: FAIL bestätigen.**
- [ ] **Step 3: Implementieren** (beide Stellen), bestehende Tests grün halten oder — wo sie die volle Form asserten — auf die neue Form anpassen (jede Anpassung im Report begründen).
- [ ] **Step 4: PASS** — `node --test test/agent-findings.test.mjs test/chat-kontext.test.mjs test/hinweis-kontext.test.mjs test/lauf-bilanz.test.mjs`, dann volle Suite.
- [ ] **Step 5: Commit** — `wertzahlen: die Entscheidungsliste im Prompt waechst nicht mehr linear`

---

### Task 3: Monats-Historie — der Monatswechsel vernichtet nichts mehr

**Files:**
- Modify: `app/src/settings-model.mjs` (normalizeUsage/normalizeSettings :69-80,138-148; verbucheUsage :84-93)
- Test: `app/test/settings-model.test.mjs`

**Interfaces (Produces):**
```js
// settings.usageHistorie: Liste abgeschlossener Monate (leereUsage-Form), juengster zuletzt,
// Deckel HISTORIE_DECKEL (24, aus lauf-bilanz.mjs importieren — eine Konstante, eine Begruendung).
// Vertrag: Kein Monat geht verloren und keiner doppelt — egal ob der Wechsel beim LADEN
// (normalizeSettings) oder beim BUCHEN (verbucheUsage) bemerkt wird, der alte Monat wird
// genau einmal (dedupe ueber monat-Schluessel) angehaengt. Leere Monate (0 Tokens, 0 Kosten)
// werden NICHT archiviert.
```

- [ ] **Step 1: Fehlschlagende Tests** — (a) verbucheUsage im neuen Monat schiebt den alten (nicht-leeren) Stand in usageHistorie und beginnt frisch; (b) normalizeSettings mit Vormonats-usage im Rohzustand archiviert ebenso; (c) derselbe Monat landet nie zweimal (Laden + Buchen nacheinander); (d) leerer Monat wird verworfen; (e) Deckel hält (25 Monate → 24, ältester fliegt); (f) kaputte Historie (kein Array, Müll-Einträge) → normalisiert ohne Wurf.
- [ ] **Step 2: FAIL bestätigen.**
- [ ] **Step 3: Implementieren** — additiv, KEIN Schema-Bump (Muster der Datei); `budgetStand`/`beansprucheAutomatiklauf` bleiben unberührt.
- [ ] **Step 4: PASS** — `node --test test/settings-model.test.mjs`, dann volle Suite.
- [ ] **Step 5: Commit** — `wertzahlen: der Monatswechsel schiebt den Verbrauch in die Historie statt ihn zu loeschen`

---

### Task 4: Der Ertrag-Abschnitt im Maschinenzimmer

**Files:**
- Modify: `app/src/workspace.js` — `buildKiSettingsBody` (:2001ff): neuer Abschnitt `ki-ertrag` ZWISCHEN Verbrauch und Budget; `renderKiVerbrauch` (:2142): eine kompakte Vormonats-Zeile aus `usageHistorie` (nur wenn vorhanden)
- Modify: `app/src/style.css` — minimale Stile im Muster der ki-verbrauch-Klassen (keine neue Gestaltungssprache; Design System 2 ist achromatisch — kein Blau, keine Pillen)
- Test: bestehenden Smoke erweitern, der den KI-Dialog öffnet (suchen: `grep -rn "kiModal\|KI-Anschluss" app/test/*smoke*.mjs`; falls keiner ihn öffnet, die Assertion in den Smoke einbauen, der die Einstellungen bereits berührt — kleinste ehrliche Browser-Prüfung: Abschnitt existiert, zeigt je Art eine Zeile mit Basis ODER den „noch zu wenig"-Satz)

**Interfaces:**
- Consumes: `bilanziereRueckmeldung` (Annahmequote je Art: `zeile.angenommen`/`zeile.bewertbar`; nur Arten mit `angeboten > 0` anzeigen), `weglegenQuote`, `monatsZaehlung`, `kostenJeUebernahme`, `torJournal()`.
- Produces: Abschnitt „Ertrag" mit: (1) je Hinweisart eine Zeile `Angenommen: 3 von 4` bzw. bei Basis < 10 gesamthaft der eine Satz `Noch zu wenig entschieden für eine ehrliche Quote (7 von 10 nötig).`-artig (genaue Formulierung ruhig, deutsch, ohne Prozent-Angeberei); (2) Weglegen-Quote der Erweiterungen mit Basis; (3) `Diesen Monat: 5 Hinweise angenommen · 2 Erweiterungen gemerkt`; (4) Kosten je Übernahme (nur bei ausreichender Basis). Datenquellen: alle nicht-trashed Dokumente (`ctx.state.docs`), Journal über `torJournal()`.

Formulierungs-Regeln (bindend): immer Basis sichtbar; nie abgeschnittener Text; keine Farbe als Träger; der Abschnitt erklärt sich in einem ruhigen Einleitungssatz selbst (Vorbild: die Verbrauchs-Prosa daneben). Die Zahlen sind Auskunft, keine Bewertung — kein „gut/schlecht".

- [ ] **Step 1: Smoke-Assertion zuerst schreiben** (RED): KI-Dialog öffnen → `.ki-ertrag` existiert, enthält „Ertrag"-Eyebrow und mindestens den Monats-Satz; mit einem Fixture-Dokument mit 12 entschiedenen Findings zeigt er eine Quote mit Basis.
- [ ] **Step 2: FAIL bestätigen** (Smoke gegen frischen Build, eigener Server + AIWT_URL).
- [ ] **Step 3: Implementieren** (Abschnitt + Vormonats-Zeile + Stile).
- [ ] **Step 4: PASS** — Smoke grün, danach `npm run build && node --test test/*.test.mjs` und ALLE Smokes (`AIWT_URL=… npm run test:smoke`).
- [ ] **Step 5: Commit** — `wertzahlen: der Ertrag steht neben dem Verbrauch im Maschinenzimmer`

---

### Task 5: Abnahme (verification-before-completion) + Issue-Kommentar

- [ ] **Step 1:** `cd app && npm run build && node --test test/*.test.mjs && AIWT_URL=<eigener Server> npm run test:smoke` → alles grün (Basis 986 + neue, 13 Smokes).
- [ ] **Step 2:** `AIWT_URL=<eigener Server> node evals/run-fertigzustand.mjs` → nicht schlechter als 4,88 (bzw. dieselben 5 bekannten DESIGN-Fails, kein neuer).
- [ ] **Step 3:** Abnahme-Punkte des Issues einzeln mit frischer Evidenz: Quote je Art sichtbar (Smoke), 50-Entscheidungen-Wachstumstest (Task 1/2), Monats-Historie überlebt (Task 3), Tests/Fertigzustand.
- [ ] **Step 4:** Issue #13 kommentieren: Ergebnis, Wiederverwendungs-Entscheid (bilanziereRueckmeldung statt Doppelbau), bewusst NICHT gebaute Drossel (wartet auf Jakobs Schwelle nach erster Messung), frische Zahlen.

## Self-Review (durchgeführt)

- **Spec-Abdeckung:** Auftrag 1 → Task 1 (+ Wiederverwendung bilanziereRueckmeldung); Auftrag 2 → Task 4; Auftrag 3 → Task 2; Auftrag 4 → Task 3. Abnahme (a) → Task 4 Smoke; (b) → Task 1 Wachstumstest + Task 2; (c) → Task 3; (d) → Task 5. Jakobs Setzungen: Maschinenzimmer-Anzeige ✓ (Task 4), Drossel bewusst außen vor ✓ (dokumentiert Task 1 + Kommentar Task 5).
- **Platzhalter:** Testskizzen benennen Aufbau und Erwartung konkret; der Ausführende schreibt sie aus.
- **Typ-Konsistenz:** `verdichteEntscheidungen`/`WOERTLICH_BEHALTEN` in Task 1 definiert, Task 2 konsumiert; `HISTORIE_DECKEL` Task 1 → Task 3; `weglegenQuote`/`monatsZaehlung`/`kostenJeUebernahme` Task 1 → Task 4.
