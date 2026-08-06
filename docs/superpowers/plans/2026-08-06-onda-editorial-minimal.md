# Onda Editorial Minimal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die produktive Onda-App erhält die bestätigte flache, redaktionelle Grundfläche aus Richtung A und die warmen 16-Pixel-Overlays aus Richtung C.

**Architecture:** Die Änderung bleibt in der bestehenden CSS-Architektur: `onda-tokens.css` definiert die verbindlichen Rollen, `onda-shell.css` gestaltet Bibliothek und App-Rahmen, `onda-annotations.css` die semantischen Anmerkungsformen und `style.css` die bestehenden Nebenflächen. Vertragstests sichern Rollen und Ressourcen; Browser- und native Evals beweisen das tatsächliche Ergebnis.

**Tech Stack:** Vanilla CSS, HTML, Node `node:test`, Playwright, esbuild, Swift/AppKit/WKWebView, `codesign`

## Global Constraints

- Statische Controls verwenden 8 px Radius; statische Karten und Panels 10 px; echte Overlays 16 px. Grundflächen und haarliniengetrennte Listenzeilen bleiben eckig.
- Vollständig runde Formen bleiben Umschaltern, kompakten Zuständen, reinen Icon-Kreisen und der Aura vorbehalten.
- Schatten markieren ausschließlich echte Ebenen; statische Flächen verwenden Abstand, niedrige Kontraste oder eine feine Linie.
- Die Aura erscheint ausschließlich für KI-Präsenz oder laufende KI-Arbeit.
- Es bleiben exakt vier Schriftgrößen, drei Schriftgewichte, eine Schriftfamilie und Sky als einziger Akzent.
- Anmerkungsarten unterscheiden sich durch Verankerung, Aufbau und Wortwahl, nicht durch zusätzliche Statusfarben.
- Alle sichtbaren Aktionen behalten mindestens 44 × 44 CSS-Pixel Zielgröße, WCAG-2.1-AA-Fokus und reduzierte Bewegung.
- Fehlender API-Schlüssel darf weder App-Start noch Layout destabilisieren und keinen ungefragten Schlüsselbunddialog auslösen.
- Persönliche Dateien unter `.scratch/` werden nicht verändert oder committed.

---

### Task 1: Radius- und Ebenenvertrag festschreiben

**Files:**
- Modify: `app/test/onda-tokens.test.mjs`
- Modify: `app/test/onda-design-contract.test.mjs`
- Modify: `app/src/onda-tokens.css`

**Interfaces:**
- Consumes: CSS-Custom-Properties auf `:root`
- Produces: `--radius-control:8px`, `--radius-card:10px`, `--radius-panel:10px`, `--radius-overlay:16px`, unverändertes `--radius-pill`

- [x] **Step 1: Vertragstests auf die bestätigten Rollen umstellen**

```js
const ECKEN = Object.freeze({
  'radius-control': '8px',
  'radius-card': '10px',
  'radius-panel': '10px',
  'radius-overlay': '16px',
})

test('statische Flächen bleiben knapp und Overlays sind bewusst weicher', () => {
  assert.equal(marke('radius-control'), '8px')
  assert.equal(marke('radius-card'), '10px')
  assert.equal(marke('radius-panel'), '10px')
  assert.equal(marke('radius-overlay'), '16px')
})
```

- [x] **Step 2: RED nachweisen**

Run: `cd app && node --test test/onda-tokens.test.mjs test/onda-design-contract.test.mjs`

Expected: FAIL, weil die vorhandenen Tokenwerte beziehungsweise der alte Pillen-/24-Pixel-Vertrag nicht der bestätigten Richtung entsprechen.

- [x] **Step 3: Tokenquelle minimal korrigieren**

```css
--radius-control:8px;
--radius-card:10px;
--radius-panel:10px;
--radius-overlay:16px;
--radius-pill:var(--radius-full);
```

Der Kommentar in `onda-tokens.css` nennt Jakobs Auswahl „A mit Overlays aus C“ als Entscheidung und erklärt, dass statische Flächen und echte Overlays absichtlich verschiedene Rollen besitzen.

- [x] **Step 4: GREEN nachweisen**

Run: `cd app && node --test test/onda-tokens.test.mjs test/onda-design-contract.test.mjs`

Expected: alle Subtests PASS.

### Task 2: Native Web-Ressourcen vollständig absichern

**Files:**
- Modify: `app/test/mac-build-script.test.mjs`
- Modify: `mac/build.sh`

**Interfaces:**
- Consumes: alle `app/src/*.css`-Dateien, die `app/index.html` referenziert
- Produces: vollständige CSS-Ressourcen unter `Onda.app/Contents/Resources/src/`

- [x] **Step 1: Vorhandenen Regressionstest erneut rot/grün belegen**

```js
assert.match(buildScript, /cp \.\.\/app\/src\/\*\.css "\$APP\/Contents\/Resources\/src\/"/,
  'der App-Build muss jedes lokale Stylesheet in das native Bundle kopieren')
```

Run: `cd app && node --test test/mac-build-script.test.mjs`

Expected: PASS mit dem bereits testgetrieben entwickelten Fix; die frühere RED-Ausgabe ist im Taskverlauf dokumentiert.

- [x] **Step 2: Build-Syntax prüfen**

Run: `bash -n mac/build.sh`

Expected: Exit 0.

### Task 3: Bibliothek und App-Rahmen verflachen

**Files:**
- Modify: `app/test/onda-design-contract.test.mjs`
- Modify: `app/src/onda-shell.css`
- Modify: `app/src/style.css`

**Interfaces:**
- Consumes: Radiusrollen aus Task 1 und vorhandene Shell-Klassen
- Produces: flache Bibliothek, kompakte Navigation, textdominante Editorgrundfläche, dekorationsfreie Aura-Nutzung

- [x] **Step 1: Failing Contracts für Grundfläche und Aura ergänzen**

```js
test('Grundflächen sind flach und die Bibliotheks-Aura ist nicht dekorativ', async () => {
  const shell = await readFile(new URL('../src/onda-shell.css', import.meta.url), 'utf8')
  assert.match(shell, /\.onda-library-sidebar\s*\{[^}]*border-right:\s*1px solid var\(--border-subtle\)/s)
  assert.match(shell, /#home\s*\{[^}]*border-radius:\s*var\(--radius-none\)/s)
  assert.equal((html.match(/class="onda-aura(?:\s|\")/g) || []).length, 1)
})
```

- [x] **Step 2: RED nachweisen**

Run: `cd app && node --test test/onda-design-contract.test.mjs`

Expected: FAIL auf mindestens einem neuen Grundflächenvertrag.

- [x] **Step 3: Shell und statische Flächen implementieren**

```css
.onda-library-sidebar,
#editorView .onda-sidebar {
  border-right: 1px solid var(--border-subtle);
}

#home,
#editorView .onda-editor-col {
  border-radius: var(--radius-none);
  box-shadow: none;
}
```

Aktive Navigation, Suchfeld und „Neu“ verwenden `--radius-control`; Projekt-, Dokument- und Strukturzeilen bleiben eckig und werden durch Haarlinien statt Schatten getrennt.

- [x] **Step 4: GREEN und Smoke nachweisen**

Run: `cd app && node --test test/onda-design-contract.test.mjs && npm run build && node test/onda-ui-smoke.mjs`

Expected: Vertrag PASS, Build Exit 0, `ONDA UI all: PASS`.

### Task 4: Anmerkungen und echte Overlays trennen

**Files:**
- Modify: `app/test/annotation-contract.test.mjs`
- Modify: `app/test/onda-design-contract.test.mjs`
- Modify: `app/src/onda-annotations.css`
- Modify: `app/src/style.css`

**Interfaces:**
- Consumes: vorhandene Annotation-DOM-Klassen und `--radius-overlay`
- Produces: fallgerechte Inline-Verankerungen, flache Review-Leiste, warme Popovers/Dialoge ohne dekorativen Glow

- [x] **Step 1: Overlay-Verträge ergänzen**

```js
test('schwebende Anmerkungen verwenden Overlayradius ohne Aura-Glow', async () => {
  const css = await readFile(new URL('../src/onda-annotations.css', import.meta.url), 'utf8')
  assert.match(css, /\.onda-annotation\s*\{[^}]*border-radius:\s*var\(--radius-overlay\)/s)
  assert.match(css, /\.onda-annotation\s*\{[^}]*box-shadow:\s*var\(--shadow-md\)/s)
  assert.doesNotMatch(css, /\.onda-annotation\s*\{[^}]*shadow-glow/s)
})
```

Der Designvertrag prüft zusätzlich, dass `.local-finding`, Dialoge, Popovers, Menüs und Agentenflächen den Overlayradius verwenden, während Review-Leiste, Diff-Flächen und statische Seitenkarten `--radius-panel` oder `--radius-card` verwenden.

- [x] **Step 2: RED nachweisen**

Run: `cd app && node --test test/annotation-contract.test.mjs test/onda-design-contract.test.mjs`

Expected: FAIL, weil `.aura-note` und mehrere schwebende Altflächen noch Panelradius oder Glow verwenden.

- [x] **Step 3: Semantische CSS-Rollen implementieren**

```css
.onda-review-bar { border-radius:var(--radius-panel); box-shadow:none; }
.onda-annotation { border-radius:var(--radius-overlay); box-shadow:var(--shadow-md); }
.aura-note__rule,
.aura-correction__comparison,
.aura-rewrite__text,
.aura-slot__text,
.aura-region__proposal { border-radius:var(--radius-card); }
.local-finding,
.agent-widget,
.evidence-window,
.onda-dialog { border-radius:var(--radius-overlay); }
```

Aura-Glow wird ausschließlich an `#ondaAura` beziehungsweise expliziten laufenden KI-Zuständen belassen.

- [x] **Step 4: GREEN, Annotation Lab und Browser-Smoke nachweisen**

Run: `cd app && node --test test/annotation-contract.test.mjs test/onda-design-contract.test.mjs && npm run build && node test/onda-ui-smoke.mjs`

Expected: alle Tests PASS und alle 29 Anmerkungsreferenzen rendern ohne Browserfehler.

### Task 5: Visuelle Eval-Schleife durchführen

**Files:**
- Modify: `app/evals/onda-ui-rubric.json`
- Update: `app/evals/results/screenshots/*.png`
- Update: `app/evals/results/onda-ui-automated-latest.json`
- Update: `app/evals/results/onda-ui-runs/*.log`

**Interfaces:**
- Consumes: Produktions-CSS aus Tasks 1–4
- Produces: nachvollziehbare Iterationen mit Scores und Bildbelegen

- [x] **Step 1: Automatisierte Runde 1 ausführen**

Run: `cd app && npm run eval:onda-ui -- --iteration=1`

Expected: 21/22 Kriterien bestanden, ONDA-UI-18 bewusst nicht ausgeführt, alle automatisierbaren Hard Gates PASS.

- [x] **Step 2: Bildmatrix prüfen und rubric-basiert bewerten**

Prüfe Bibliothek und Editor bei 1440/1280, 1024/720 und 320 px in Hell/Dunkel sowie die Annotation-Lab-Zustände. Bewerte redaktionelle Klarheit, Ruhe, Ebenenlogik, Fallpassung und Konsistenz jeweils 1–5. Schwelle: 4,5 pro Dimension.

- [x] **Step 3: Höchstens zwei gezielte Verfeinerungen ausführen**

Nur reproduzierbare Befunde ändern. Nach jeder Änderung: betroffenen Vertragstest, `npm run build`, `node test/onda-ui-smoke.mjs`, neue Screenshotmatrix und neuer Rubrikeintrag ausführen. Stoppe früh, wenn alle Hard Gates bestehen und keine Dimension unter 4,5 liegt; stoppe ebenfalls, wenn sich der Gesamtscore nicht verbessert.

### Task 6: Gesamtverifikation, Commit und native Veröffentlichung

**Files:**
- Modify: `app/evals/results/fertigzustand-latest.json`
- Modify: `app/evals/results/onda-ui-automated-latest.json`
- Modify: `app/evals/results/onda-ui-runs/*.log`
- Modify: `Onda.app` and `releases/Onda-*.zip` as ignored build artifacts

**Interfaces:**
- Consumes: vollständig evaluierter Quellstand
- Produces: sauberer Git-Commit, signiertes `Onda.app`, laufende finale App

- [x] **Step 1: Vollständige Verifikation ausführen**

Run: `cd app && npm test && npm run build && npm run eval:onda-ui && node evals/run-fertigzustand.mjs`

Expected: keine Testfehler; Build Exit 0; alle automatisierbaren Onda-UI-Hard-Gates PASS; Fertigzustandsbericht ohne unbelegte Erfolge.

- [x] **Step 2: Arbeitsbaum prüfen und Produktdateien committen**

Run: `git diff --check && git status --short && git diff --stat`

Stage nur Produktcode, Tests, Plan und aktuelle Eval-Nachweise; `.scratch/**` bleibt ungestaged.

```bash
git add app/src app/test app/evals mac/build.sh docs/superpowers/plans/2026-08-06-onda-editorial-minimal.md
git commit -m "feat(ui): Onda editorial und minimal vollenden"
```

- [ ] **Step 3: Finalen signierten Build aus sauberem Commit bauen**

Run: `./mac/build.sh`

Expected: 842 oder mehr Tests PASS, alle Browser-Smokes PASS, `SELFTEST OK`, Signatur `Onda Dev`, `BUILD OK` ohne `+` in der Versionskennung.

- [ ] **Step 4: Exakt eine finale Instanz starten**

Beende nur Prozesse mit dem exakten Pfad dieses Bundles, starte `open -n "$PWD/Onda.app"` und prüfe Prozesspfad, Bundle-Version, Codesignatur sowie fehlende Schlüsselbunddienste.

- [ ] **Step 5: Sichtbare Endabnahme**

Prüfe mit Computer Use Bibliothek, Editor und eine schwebende Anmerkung. Erwartet: flache A-Grundfläche, 16-Pixel-C-Overlay, vollständig geladenes CSS, ruhiger Schlüssel-fehlt-Zustand und keine zweite App-Instanz.
