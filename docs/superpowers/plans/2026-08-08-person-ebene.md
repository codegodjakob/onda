# Die Person-Ebene an die Kanäle anschließen — Umsetzungsplan (Issue #14)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die vier verbliebenen Lücken der Person-Ebene schließen: das `muster` reist im Rück-Prompt mit, der Personen-Speicher (Erkanntes) bekommt seinen Abfluss (Deckel + Verdrängung), das freigegebene Entscheidungsbild erreicht auch den Erweiterungs-Kanal, und die A→B-Reise eines gemerkten Musters ist als Test festgenagelt.

**Architecture:** KEIN neues Modul, kein Doppelbau. Die Person-Ebene existiert seit dem 05.08. in drei Stücken: `erkanntes-model.mjs` (personal/allProjects-Prinzipien, Zufluss NUR über den Merken-/Annehmen-Klick via `merkeErkanntes`), `onda-kontext.mjs` (gedaechtnisBlock + erkanntesBlock in allen sechs Kanälen) und `rueckkopplung-model.mjs` (freigabe-gebundenes Entscheidungsbild, bisher nur Hinweis-Kanal). Dieses Paket vervollständigt diese drei Stücke an vier präzisen Stellen.

**Tech Stack:** Vanilla ES-Module, `node --test`, esbuild, Playwright-Smokes gegen eigenen Server.

## Entschiedene Gestaltungsfragen (bindend, mit Begründung)

- **D1 — Kein `person-kontext.mjs`:** Der „kompakte Personen-Block" aus dem Issue existiert faktisch als erkanntesBlock + gedaechtnisBlock (onda-kontext, alle sechs Kanäle) + Rückkopplungs-Block (hinweis-kontext). Ein neues Modul wäre eine zweite Wahrheit neben onda-kontext.
- **D2 — Merken IST die Freigabe für gemerkte Muster:** `schreibeErkanntes` läuft ausschließlich über den ausdrücklichen Merken-/Annehmen-Klick auf genau diesen Inhalt (workspace.js `merkeErkanntes` — „der einzige Weg in den Personen-Speicher"). Das erfüllt Leitplanke 4 (Zufluss nur aus expliziten Handlungen) und die Etappe-C-Regel dem Sinn nach; der förmliche Transfer-Weg (`createTransferRequest`/`decideMemoryTransfer`, mit Vorschau-Schutz für Sensibles) bleibt unverändert für Projekt-Wissen bestehen. Die Abnahme (a) testet die BESTEHENDE Semantik: gemerkt in A → sichtbar im Erweiterungs-Kontext von B; nicht Gemerktes reist nie.
- **D3 — Kein Ablegen der aggregierten Bilanz als Memory-Eintrag:** Die freigegebene Kalibrierung (`state.rueckkopplung`, actor-'user'-Gate, versioniert) IST die abgelegte, korrigierbare Form des Entscheidungsbilds. Ein zusätzlicher personal-Eintrag wäre eine zweite, alternde Kopie einer jederzeit frisch berechenbaren Zahl. (Abweichung vom Issue-Wortlaut „ablegen" — im Abschlusskommentar ausweisen.)
- **D4 — Wortlaut-Disziplin bleibt:** `formuliereRueckkopplung` sagt nie „gib diese Art nicht mehr", sondern „prüfe hier besonders streng". Genau dieser Block reist zusätzlich in den Erweiterungs-Kanal — KEIN „mehr davon", keine neue Formulierung.
- **D5 — Reichweite des Entscheidungsbilds:** hinweis (existiert) + erweiterung (neu) — die zwei bezahlten Rückmelde-Kanäle, deren Auswahlverhalten die Bilanz beschreibt. Chat/Verständnis/Quellen/Bausteine bleiben außen vor (dort beschreibt die Bilanz nichts, was der Kanal tut).

## Global Constraints

- Etappe-C-Freigaberegeln STRIKT erhalten: `decideMemoryTransfer` wirft bei actor ≠ 'user' (memory-retrieval.mjs:85); sensible Inhalte ohne Vorschau vor Zustimmung; `entscheideRueckkopplung` ebenso actor-'user'-gebunden. Kein Umbau dieser Tore.
- Die Person-Schicht wird NIE automatisch befüllt, nie aus dem Text gedeutet (Leitplanke 4). Kein neuer Zufluss-Weg in diesem Paket.
- Export/Löschung der Ebene muss unverändert funktionieren (memory-portability, „Alle Daten exportieren", deletionRules) — Abnahme (c).
- Deutsche Kommentare/Bezeichner; TDD verpflichtend (RED→GREEN-Beleg im Report).
- Ausgangsbasis (frisch, Merge-Stand 9d748f0): 1144 Unit-Tests grün, alle Smokes grün (Exit 0), Fertigzustand-Referenz: letzter main-Lauf 147/147.
- Browser-Prüfungen/Eval-Runner IMMER eigener Server aus DIESEM Worktree + `AIWT_URL` (Besitz per lsof-cwd nachweisen; NIE Port 4173). `npm test` baut nicht — erst `npm run build`.
- Commits im Repo-Stil `person: …` + Trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## Dateistruktur

| Datei | Verantwortung |
|---|---|
| Modify `app/src/erweiterung-model.mjs` | `fasseErweiterungenZusammen` gibt `muster` mit (Schema-Bruch heilen) |
| Modify `app/src/erkanntes-model.mjs` | Speicher-Deckel + Verdrängung (Abfluss); Korrigierbarkeit unberührt |
| Modify `app/src/erweiterung-kontext.mjs` | optionaler `rueckkopplung`-Param nach hinweis-kontext-Vorbild |
| Modify `app/src/workspace.js` | `fuehreErweiterungslaufAus` reicht die synchronisierte Kalibrierung durch |
| Modify `app/src/erweiterungslauf-model.mjs` | `versucheErweiterungslauf` nimmt `rueckkopplung` entgegen und reicht an den Kontext-Bauer (nur Durchreichung, Muster hinweislauf-model) |
| Tests | `erweiterung-model.test.mjs`, `erkanntes-model.test.mjs`, `erweiterung-kontext.test.mjs`, `erweiterungslauf-model.test.mjs`, neuer A→B-Test in `onda-kontext.test.mjs` |

Fakten (verifiziert 2026-08-08 auf 9d748f0, Erkundungsbericht):
- `fasseErweiterungenZusammen(doc)` (erweiterung-model.mjs:142-150) liefert `{art, stellen, gedanke, zustand}` — `muster` fehlt; das Schema erzwingt `muster` als Pflichtfeld (erweiterungslauf-model.mjs:168-169: `if (!gedanke || !muster) return null`).
- Erkanntes: `schreibeErkanntes` (erkanntes-model.mjs:55), `erkanntesListe` (:106, gruppiert nach Wortlaut, `treffer`), `ueberholeErkanntes` (:152, setzt alle Begegnungen 'superseded'), `erkanntesFuerPrompt` (:168, PROMPT_GRENZE=25, sortiert nach treffer). Der STORE wächst ungedeckelt — kein Speicher-Deckel.
- Rückkopplung: `synchronisiereRueckkopplungsvorschlag()` (workspace.js:5183-5194, global über alle Projekte), durchgereicht in `fuehreHinweislaufAus` (:5245, :5292); `hinweis-kontext.mjs:42,50-52` konsumiert via `aktiveRueckkopplung`+`formuliereRueckkopplung`. `erweiterung-kontext.mjs` hat KEINEN rueckkopplung-Param.
- onda-kontext: `baueOndaBloecke({project,doc,docs,memoryStore})` → u. a. erkanntesBlock (`erkanntesFuerPrompt`, alle sechs Kanäle); Cross-Projekt-Isolation für project-Level getestet (onda-kontext.test.mjs:361-365).
- A→B-Reise personal: getestet für den Transfer-Weg (memory-retrieval.test.mjs:44-68), NICHT für gemerkte Muster via erkanntesBlock im Erweiterungs-Kontext.

---

### Task 1: Das Muster reist im Rück-Prompt mit

**Files:** Modify `app/src/erweiterung-model.mjs` (:142-150); Test `app/test/erweiterung-model.test.mjs`.

**Interfaces:** `fasseErweiterungenZusammen(doc)` — Rückgabe-Einträge erhalten zusätzlich `muster: String(eintrag.muster || '')`. Konsumenten prüfen (grep: erweiterung-kontext `bereitsAngeboten`, evtl. Tests mit deepEqual — anpassen wo die alte Form exakt assertiert wird, jede Anpassung begründen).

- [ ] Step 1: Fehlschlagender Test — ein Eintrag mit muster → Rückgabe trägt es; leeres/fehlendes muster → leerer String (fail-safe, kein Wurf). RED bestätigen.
- [ ] Step 2: Implementieren (eine Zeile + Kommentar: das Schema verlangt das Muster als abgelieferten Arbeitsschritt — es im Rück-Prompt zu verschweigen hieß, das Modell dieselben Prinzipien neu erfinden zu lassen). GREEN + volle Unit-Suite.
- [ ] Step 3: Commit `person: das Muster reist im Rueck-Prompt mit — der Schema-Bruch ist geheilt`.

### Task 2: Der Abfluss — Deckel und Verdrängung für Erkanntes

**Files:** Modify `app/src/erkanntes-model.mjs`; Test `app/test/erkanntes-model.test.mjs`.

**Interfaces (Produces):**
```js
export const REGAL_DECKEL = 60  // aktive Saetze im Personen-Speicher; Begruendung im Kopf:
// genug fuer Jahre echten Schreibens (25 gehen in den Prompt), wenig genug, dass die
// Liste im Projektverstaendnis-Fenster lesbar bleibt und kein append-only-Berg entsteht.
// Verdraengung, nicht Loeschung: ueberzaehlige werden 'superseded' (Korrigierbarkeit und
// Ereignis-Historie bleiben), Rangfolge beim Verdraengen: wenigste treffer zuerst,
// bei Gleichstand aeltester zuerst. Ein wiederkehrendes Muster (treffer>=2) verdraengt
// nie ein anderes wiederkehrendes — dann bleibt der Neuzugang einmalig und das Regal voll.
```
`schreibeErkanntes` wendet den Deckel nach dem Einfügen an (interner Helfer `wendeRegalDeckelAn(store)`); `ueberholeErkanntes`/`erkanntesFuerPrompt`/`erkanntesListe` unverändert in Signatur und Verhalten (Liste zeigt nur active — prüfen, ob superseded heute schon gefiltert wird; falls die UI-Liste superseded zeigt, NICHT ändern — nur der Deckel ist neu).

- [ ] Step 1: Fehlschlagende Tests — (a) REGAL_DECKEL+5 verschiedene Sätze → genau REGAL_DECKEL aktiv, die trefferärmsten/ältesten superseded (mit supersededAt); (b) ein Satz mit treffer=3 wird nie von einem Einmal-Satz verdrängt; (c) ueberholeErkanntes + Export/Löschung (memory-portability-Verhalten) unberührt — bestehende Tests bleiben grün; (d) erneutes Merken eines superseded Satzes belebt ihn wieder (oder zählt neu — LESEN, was schreibeErkanntes bei existierendem Schlüssel heute tut, und das Verhalten erhalten; nur dokumentieren).
- [ ] Step 2: RED → implementieren → GREEN + volle Unit-Suite (memory-Tests besonders).
- [ ] Step 3: Commit `person: das Regal bekommt seinen Abfluss — Deckel mit Verdraengung statt Halde`.

### Task 3: Das Entscheidungsbild erreicht den Erweiterungs-Kanal

**Files:** Modify `app/src/erweiterung-kontext.mjs` (rueckkopplung-Param nach hinweis-kontext.mjs:42,50-52-Vorbild — Block direkt HINTER der Anweisung, VOR den Listen, volatil, fail-closed ohne Freigabe); Modify `app/src/erweiterungslauf-model.mjs` (Durchreichung als Parameter, Muster: wie `versucheHinweislauf` es macht — prüfen wo hinweislauf-model rueckkopplung entgegennimmt bzw. ob es in fuehreHinweislaufAus direkt an den Kontext-Bauer geht; dieselbe Stelle spiegeln); Modify `app/src/workspace.js` `fuehreErweiterungslaufAus` (`synchronisiereRueckkopplungsvorschlag()` durchreichen wie :5245/:5292). Tests: `erweiterung-kontext.test.mjs` + `erweiterungslauf-model.test.mjs`.

- [ ] Step 1: Fehlschlagende Tests — (a) approved Kalibrierung → Block im Kontext (Wortlaut aus formuliereRueckkopplung, „besonders streng"-Disziplin, KEIN „mehr davon"); (b) pending/abgelehnt/null → KEIN Block (fail-closed); (c) Block ist volatil (kein cache_control) und steht vor den Listen; (d) Durchreichungs-Kette workspace→lauf-model→kontext per bestehendem Test-Muster.
- [ ] Step 2: RED → implementieren → GREEN + volle Unit-Suite + Build.
- [ ] Step 3: Commit `person: das freigegebene Entscheidungsbild erreicht auch den Erweiterungs-Kanal`.

### Task 4: Die A→B-Reise als Abnahmetest

**Files:** Test `app/test/onda-kontext.test.mjs` (additiv).

- [ ] Step 1: Test (darf sofort grün sein — er nagelt BESTEHENDE Semantik fest; wäre er rot, ist das ein Befund → BLOCKED melden, nicht die Semantik ändern): Projekt A, Merken-Fluss simuliert (`schreibeErkanntes` mit Herkunft A) → `baueOndaBloecke({project: B, …})` enthält den Satz im Erkanntes-Block; Gegenprobe: ein NICHT gemerktes Muster (nur in doc.erweiterungen, status 'neu') erscheint nirgends; zweite Gegenprobe: superseded (Task 2 Verdrängung/„Stimmt nicht mehr") reist nicht. Kommentar: Merken ist die ausdrückliche Freigabe (D2), der förmliche Transfer-Weg bleibt für Projekt-Wissen.
- [ ] Step 2: Volle Suite + Commit `person: die Reise eines gemerkten Musters von Projekt A nach B ist festgenagelt`.

### Task 5: Abnahme + Issue-Kommentar

- [ ] Voller Lauf: `npm run build`, volle Unit-Suite, alle Smokes (eigener Server, AIWT_URL), frischer Fertigzustand (nicht schlechter als die main-Referenz; bekannte flüchtige d2-Wackler: sauberer Zweitlauf zählt).
- [ ] Abnahme-Punkte einzeln: (a) A→B-Test grün; (b) Entscheidungsbild-Block im Hinweis- UND Erweiterungs-Prompt (Testnamen); (c) Export/Löschung unverändert (memory-portability-Tests grün); (d) Zahlen.
- [ ] Issue #14 kommentieren: Ergebnis, die fünf Gestaltungsentscheide D1–D5 (besonders D2 „Merken ist die Freigabe" und D3 „keine zweite Wahrheit" als begründete Abweichungen vom Issue-Wortlaut), Vorhersage der Analyse zum Nachhalten notieren, frische Zahlen.

## Self-Review (durchgeführt)

- Auftrag 1 → D2/D3 (muster: erledigt durch Bestand + Task 1; Präferenzen: D3-Entscheid statt Ablage); Auftrag 2 → Bestand (erkanntesBlock) + Task 3; Auftrag 3 → Global Constraints (Tore unangetastet); Auftrag 4 → Task 2 (Deckel+Verdrängung; Korrigierbarkeit existiert via ueberholeErkanntes/„Stimmt nicht mehr"). Abnahme (a) → Task 4; (b) → Task 3; (c) → Task 2 Step 1c; (d) → Task 5.
- Platzhalter: keine — jede Teststskizze nennt Aufbau und Erwartung.
- Typ-Konsistenz: rueckkopplung-Param-Kette Task 3 einheitlich; REGAL_DECKEL nur in erkanntes-model.
