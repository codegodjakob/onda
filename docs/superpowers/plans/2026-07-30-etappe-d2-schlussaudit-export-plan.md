# Etappe D2 Schlussaudit und Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die letzten neun automatisierbaren V2-Evals durch einen deterministischen Schlussaudit, beobachtbare Autorschaft, strukturtreue Publikationsformate, vollständige lokale Datenkontrolle und eine abschließende WCAG-2.1-AA-Abnahme schließen.

**Architecture:** Reine, kleine Domänenmodule bauen Audit, Provenienzbericht, Publikationsdokument und Gesamtdatenpaket aus dem vorhandenen lokalen Zustand. Ein dünner, zugänglicher Dialog orchestriert Statusanzeige, bewusste Risikoexporte, Downloads und zweistufige Löschung. Audit- und Datenfingerprints ignorieren Zeit und UI, Publikationsadapter erhalten nur freigegebenen Inhalt.

**Tech Stack:** Vanilla JavaScript ES modules, Tiptap 2/ProseMirror JSON, Node-Testläufer, Playwright, `@axe-core/playwright`, CSS, bestehende Browser-/Mac-Persistenz.

## Global Constraints

- Die Evals `AUDIT-01` bis `AUDIT-07`, `SYSTEM-10` und `SYSTEM-11` sind harte Gates.
- Die sechs externen Live-Gates bleiben unverändert extern.
- Der Agent erteilt keine Freigabe und erzeugt keine Autorschafts-, Aufmerksamkeits-, Verständnis- oder Herkunftswahrscheinlichkeit.
- Kritische offene Fakten-, Quellen-, Zitations-, Methoden- und Logikbefunde blockieren wissenschaftliche Freigabereife; Stil gleicht sie nie aus.
- Export trotz Risiko verlangt eine explizite Nutzerbestätigung und verändert den Auditstatus nicht.
- Markdown, HTML und JATS bewahren Struktur und Referenzen und enthalten keine Agenten-UI.
- Gesamtexport enthält alle lokalen Domänendaten, aber keine Schlüssel, Tokens, Cookies, Autorisierungs-, Passwort- oder Sitzungswerte.
- Löschung ist zweistufig und erst nach einem erfolgreich erzeugten und validierten Gesamtexport möglich.
- Zielwert: mindestens 4,5/5 insgesamt, mindestens 4,0 je Dimension, höchstens fünf Iterationen.

---

## File Map

- `app/src/final-audit.mjs`: Normalisierung aller Auditstatus, harte Blocker, reproduzierbarer Snapshot und persistierbarer Auditstore.
- `app/src/authorship-proof.mjs`: private, beobachtbare Beitragsereignisse und optionale KI-Nutzungserklärung.
- `app/src/publication-export.mjs`: UI-freies Publikationsdokument sowie Markdown-, HTML- und JATS-Adapter.
- `app/src/data-control.mjs`: vollständiger, redigierter Gesamtzustand, Manifest, Fingerprint, Validierung, Wiederimport und leerer Löschzustand.
- `app/src/audit-ui.mjs`: Schlussaudit-, Export-, Risiko-, Provenienz- und Datenkontrollfluss.
- `app/src/editor.js`: Schema 12, Auditstore, Dialogadapter, Gesamtlöschung und Export-Routing.
- `app/src/workspace.js`: Einstieg `Schlussaudit & Export` hinter dem Projektverständnis.
- `app/src/style.css`: ruhige Auditdarstellung, Fokus, Zielgrößen und Reflow.
- `app/evals/fixtures/d2-abschlussqualitaet.mjs`: feste Mehrzustands-, Publikations- und Provenienzfälle.
- `app/evals/run-d2-quality.mjs`: strukturierte 1–5-Rubrik und abgeleiteter Kontrast.
- `app/test/final-audit.test.mjs`, `authorship-proof.test.mjs`, `publication-export.test.mjs`, `data-control.test.mjs`: reine Verträge.
- `app/test/etappe-d2-smoke.mjs`: Drei-Browser-, Tastatur-, Risiko-, Download-, Datenkontroll- und Reflowfluss.
- `app/test/d2-accessibility.test.mjs`: Axe-Regeln und Protokollvertrag.
- `docs/evals/SYSTEM-11-wcag-protokoll.md`: versionierte manuelle Prüfschritte und Ergebnisse.
- `app/evals/results/etappe-d2-latest.json`: finaler 77-Eval-Status.

---

### Task 1: Deterministischer Schlussaudit

**Files:**
- Create: `app/src/final-audit.mjs`
- Create: `app/test/final-audit.test.mjs`
- Modify: `app/src/editor.js`

**Interfaces:**
- Consumes: `project`, alle zugehörigen `docs`, `project.argumentModel`, `project.sources`, `project.evidenceBundles`, `project.citations`, `project.bibliography`, `project.languageReports`.
- Produces: `ensureFinalAuditStore(project)`, `runFinalAudit({ project, docs, textId, at })`, `recordFinalAudit({ project, audit })`.

- [ ] **Step 1: Write the failing status-matrix test**

```js
test('AUDIT-01: alle Zustände bleiben erreichbar und Integrität steht vor Stil', () => {
  const audit = runFinalAudit({ project: fixtureProject(), docs: fixtureDocs(), textId: 'd-a', at: 100 })
  assert.deepEqual(audit.groups.map(group => group.kind), [
    'integrity', 'evidence', 'citation', 'accepted-risk', 'other', 'style',
  ])
  assert.deepEqual(audit.statusCounts, {
    open: 2, parked: 1, resolved: 1, dismissed: 1, 'risk-accepted': 1, superseded: 1,
  })
})
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test test/final-audit.test.mjs`

Expected: FAIL because `final-audit.mjs` does not exist.

- [ ] **Step 3: Implement normalized entries and deterministic fingerprint**

```js
export const FINAL_AUDIT_RULE_VERSION = '2026-07-30.1'
export const FINAL_AUDIT_MODEL_VERSION = 1

export function runFinalAudit({ project, docs = [], textId, at = Date.now() }) {
  const entries = collectEntries({ project, docs, textId })
  const blockers = entries.filter(entry => entry.hardBlocker)
  const acceptedRisks = entries.filter(entry => entry.status === 'risk-accepted')
  const status = blockers.length
    ? 'blocked'
    : acceptedRisks.length || entries.some(entry => entry.status === 'open')
      ? 'review-required'
      : 'clear-of-hard-blockers'
  const structural = {
    schemaVersion: 1,
    projectId: project.id,
    textId,
    ruleVersion: FINAL_AUDIT_RULE_VERSION,
    modelVersion: FINAL_AUDIT_MODEL_VERSION,
    dataVersion: project.audit?.dataVersion || 1,
    status,
    groups: groupEntries(entries),
    blockers,
    statusCounts: countStatuses(entries),
  }
  return { ...structural, fingerprint: stableHash(stableJson(structural)), auditedAt: at }
}
```

- [ ] **Step 4: Add blocker, citation, claim-evidence, project/text-isolation and idempotent-store tests**

Run: `node --test test/final-audit.test.mjs`

Expected: PASS, including `AUDIT-01`, `AUDIT-02` and `AUDIT-07`.

- [ ] **Step 5: Migrate projects additively to schema 12**

`ensureProjectShape()` must call `ensureFinalAuditStore(p)`. Invalid persisted audit snapshots are quarantined or dropped without preventing application start. Re-running identical input must not append a duplicate history event.

- [ ] **Step 6: Commit**

```bash
git add app/src/final-audit.mjs app/test/final-audit.test.mjs app/src/editor.js
git commit -m "feat(audit): add deterministic final audit"
```

---

### Task 2: Beobachtbare Autorschaft und optionale KI-Erklärung

**Files:**
- Create: `app/src/authorship-proof.mjs`
- Create: `app/test/authorship-proof.test.mjs`

**Interfaces:**
- Consumes: `buildProjectProvenanceSnapshot()`, `doc.decisions`, Findings und `project.languageReports.decisions`.
- Produces: `buildAuthorshipProof({ project, docs })`, `buildAiUsageDeclaration({ proof, enabled })`.

- [ ] **Step 1: Write failing mixed-contribution tests**

```js
test('AUDIT-04: Autorschaftsnachweis beschreibt nur beobachtbare Beitragsarten', () => {
  const proof = buildAuthorshipProof({ project: mixedProject(), docs: mixedDocs() })
  assert.deepEqual(new Set(proof.contributions.map(item => item.kind)), new Set([
    'user-original',
    'agent-proposal-adopted',
    'agent-proposal-edited',
    'agent-proposal-not-adopted',
    'user-review-decision',
  ]))
  assert.equal(/aufmerksamkeit|verständnis|kognitiv|wahrscheinlichkeit|\d+\s*%/iu.test(JSON.stringify(proof)), false)
})
```

- [ ] **Step 2: Run and confirm RED**

Run: `node --test test/authorship-proof.test.mjs`

Expected: module-not-found failure.

- [ ] **Step 3: Implement event-only contribution mapping**

```js
export function buildAiUsageDeclaration({ proof, enabled }) {
  if (enabled !== true) return null
  const activities = [...new Set(proof.contributions
    .filter(item => item.actor === 'agent' || item.kind.startsWith('agent-'))
    .map(item => item.activity))]
  return {
    schemaVersion: 1,
    kind: 'ai-usage-declaration',
    projectId: proof.projectId,
    status: activities.length ? 'documented' : 'no-observed-agent-contribution',
    activities,
    statement: declarationText(activities),
    sourceEventIds: proof.contributions.flatMap(item => item.originEventIds),
  }
}
```

- [ ] **Step 4: Add off-state, no-agent, edited-adoption, rejection and foreign-project tests**

Run: `node --test test/authorship-proof.test.mjs`

Expected: PASS for `AUDIT-04` and `AUDIT-06`.

- [ ] **Step 5: Commit**

```bash
git add app/src/authorship-proof.mjs app/test/authorship-proof.test.mjs
git commit -m "feat(audit): add observable authorship proof"
```

---

### Task 3: Strukturtreue Publikationsformate

**Files:**
- Create: `app/src/publication-export.mjs`
- Create: `app/test/publication-export.test.mjs`

**Interfaces:**
- Consumes: Tiptap JSON, Titel, explizite Fußnoten, Zitationen und Bibliografie.
- Produces: `buildPublicationDocument(input)`, `renderMarkdown(document)`, `renderHtml(document)`, `renderJats(document)`, `publicationFilename(title, format)`.

- [ ] **Step 1: Write the failing golden-structure test**

```js
test('AUDIT-05: Markdown, HTML und JATS bewahren Struktur und Referenzen ohne UI', () => {
  const publication = buildPublicationDocument(publicationFixture())
  const outputs = {
    markdown: renderMarkdown(publication),
    html: renderHtml(publication),
    jats: renderJats(publication),
  }
  for (const output of Object.values(outputs)) {
    for (const canary of ['Überschrift', 'Listenpunkt', 'Originalzitat', 'Fußnote A', 'Meyer 2024']) {
      assert.match(output, new RegExp(canary))
    }
    assert.doesNotMatch(output, /language-card|agentWidget|finding|audit-dialog|ProseMirror/)
  }
})
```

- [ ] **Step 2: Run and confirm RED**

Run: `node --test test/publication-export.test.mjs`

Expected: module-not-found failure.

- [ ] **Step 3: Implement one canonical publication tree and three escaping serializers**

```js
export function buildPublicationDocument({ projectId, textId, title, editorJson, footnotes = [], citations = [], bibliography = [] }) {
  return {
    schemaVersion: 1,
    projectId: requiredText(projectId),
    textId: requiredText(textId),
    title: requiredText(title),
    blocks: normalizeNodes(editorJson?.content || []),
    footnotes: normalizeFootnotes(footnotes),
    citations: normalizeCitations(citations),
    bibliography: normalizeBibliography(bibliography),
  }
}
```

Every serializer must escape its target format, preserve unknown-node text, and never pass raw attributes or HTML from the editor through.

- [ ] **Step 4: Add parser-roundtrip, link, nested-list, citation, empty-bibliography and hostile-HTML tests**

Run: `node --test test/publication-export.test.mjs`

Expected: PASS with byte-stable output on repeated calls.

- [ ] **Step 5: Commit**

```bash
git add app/src/publication-export.mjs app/test/publication-export.test.mjs
git commit -m "feat(export): add publication format adapters"
```

---

### Task 4: Vollständiger lokaler Datenexport, Wiederimport und Löschzustand

**Files:**
- Create: `app/src/data-control.mjs`
- Create: `app/test/data-control.test.mjs`

**Interfaces:**
- Consumes: `{ schemaVersion, docs, projects, settings, memoryStore, active, activeProject }`.
- Produces: `exportAllLocalData({ state, at })`, `validateAllLocalDataExport(value)`, `importAllLocalData(value)`, `emptyLocalState()`.

- [ ] **Step 1: Write failing completeness and secret-canary tests**

```js
test('SYSTEM-10: Gesamtexport bewahrt alle Domänen und entfernt Secrets', () => {
  const payload = exportAllLocalData({ state: fullStateWithSecretCanaries(), at: 100 })
  assert.deepEqual(payload.manifest.counts, {
    projects: 2, texts: 3, sources: 2, decisions: 4, provenanceRecords: 5,
  })
  assert.equal(validateAllLocalDataExport(payload).valid, true)
  assert.equal(JSON.stringify(payload).includes('CANARY-SECRET'), false)
  assert.deepEqual(importAllLocalData(payload), payload.state)
})
```

- [ ] **Step 2: Run and confirm RED**

Run: `node --test test/data-control.test.mjs`

Expected: module-not-found failure.

- [ ] **Step 3: Implement sorted redaction, manifest and fingerprint**

```js
const SECRET_KEY = /(api[-_]?key|password|passwd|secret|token|cookie|authorization|credential|session)/iu

export function exportAllLocalData({ state, at = Date.now() }) {
  const safeState = redactAndSort(selectPersistedState(state))
  const manifest = buildManifest(safeState)
  const structural = {
    schemaVersion: 1,
    kind: 'ai-writing-tool-complete-export',
    appStateSchemaVersion: Number(state.schemaVersion) || 12,
    manifest,
    state: safeState,
  }
  return { ...structural, fingerprint: stableHash(stableJson(structural)), exportedAt: at }
}
```

- [ ] **Step 4: Add corrupted fingerprint, missing collection, dangling project, atomic rejection and empty-state tests**

Run: `node --test test/data-control.test.mjs`

Expected: PASS; invalid imports throw before returning any partial state.

- [ ] **Step 5: Commit**

```bash
git add app/src/data-control.mjs app/test/data-control.test.mjs
git commit -m "feat(data): add complete local data control"
```

---

### Task 5: Schlussaudit- und Exportdialog

**Files:**
- Create: `app/src/audit-ui.mjs`
- Modify: `app/src/workspace.js`
- Modify: `app/src/editor.js`
- Modify: `app/src/ui.js`
- Modify: `app/src/style.css`
- Create: `app/test/etappe-d2-smoke.mjs`
- Modify: `app/test/etappe-b1-smoke.mjs`
- Modify: `app/test/etappe-b2-smoke.mjs`
- Modify: `app/test/etappe-c1-smoke.mjs`
- Modify: `app/test/etappe-c2-smoke.mjs`

**Interfaces:**
- Consumes: Tasks 1–4, `context.openDialog`, `context.persist`, aktiver Editorbaum und Downloadadapter.
- Produces: `createAuditUi({ context, createNode, openDialog, getEditorJson, download, deleteAllLocalData })`.

- [ ] **Step 1: Write the failing browser flow**

The test must seed every auditstatus, a critical scientific citation blocker, one accepted risk, mixed provenance and a structured text. It must assert:

```js
assert.deepEqual(await statusHeadings.allTextContents(), [
  'Integrität', 'Belege', 'Zitation', 'Angenommene Risiken', 'Weitere Hinweise', 'Stil',
])
assert.match(await dialog.textContent(), /nicht freigabereif/i)
assert.equal(await page.getByRole('button', { name: 'Trotz Risiko exportieren' }).isDisabled(), true)
```

- [ ] **Step 2: Run Chromium smoke and confirm RED**

Run: `AIWT_BROWSER=chromium node test/etappe-d2-smoke.mjs`

Expected: FAIL because the entry point and dialog do not exist.

- [ ] **Step 3: Build the read-only audit view and persist one deduplicated snapshot**

Add `Schlussaudit & Export` to the project-understanding dialog after Sprache und Wirkung. Every group remains in the DOM and keyboard reachable. Status copy must use `nicht freigabereif`, `Prüfung erforderlich` or `Keine harten Auditblocker gefunden`.

- [ ] **Step 4: Add publication download and explicit risk confirmation**

The first click with blockers opens an inline confirmation containing consequence text and a checkbox. Only the checked confirmation enables `Trotz Risiko exportieren`. The exported file and audit history preserve `blocked`; no code path writes `ready` after confirmation.

- [ ] **Step 5: Add private authorship proof and optional declaration downloads**

The switch defaults off. Turning it on shows the declaration preview. Both proof and declaration use the Task-2 functions and never scan rendered UI or invent missing events.

- [ ] **Step 6: Add full data export and guarded deletion**

`Gesamtdaten exportieren` must store the current fingerprint in ephemeral UI state only after `validateAllLocalDataExport()` passes. `Lokalen Bestand löschen` then opens a second confirmation. Final deletion calls the key-deletion adapter, removes persisted state and reloads to a fresh local workspace.

- [ ] **Step 7: Route existing Markdown export through the audit**

`⌘E`, the file menu and the native export callback open the audit instead of bypassing it. A direct low-level serializer remains test-only/internal.

- [ ] **Step 8: Close UI, isolation, undo-neutrality, reload and three-browser assertions**

Run:

```bash
AIWT_BROWSER=chromium node test/etappe-d2-smoke.mjs
AIWT_BROWSER=firefox node test/etappe-d2-smoke.mjs
AIWT_BROWSER=webkit node test/etappe-d2-smoke.mjs
```

Expected: PASS; schema fixtures expect 12.

- [ ] **Step 9: Commit**

```bash
git add app/src/audit-ui.mjs app/src/workspace.js app/src/editor.js app/src/ui.js app/src/style.css app/test/etappe-d2-smoke.mjs app/test/etappe-b1-smoke.mjs app/test/etappe-b2-smoke.mjs app/test/etappe-c1-smoke.mjs app/test/etappe-c2-smoke.mjs
git commit -m "feat(audit): add final review and export flow"
```

---

### Task 6: WCAG-2.1-AA-Abnahme

**Files:**
- Modify: `app/package.json`
- Modify: `app/package-lock.json`
- Create: `app/test/d2-accessibility.test.mjs`
- Create: `docs/evals/SYSTEM-11-wcag-protokoll.md`

**Interfaces:**
- Consumes: laufende App bei `AIWT_URL`, `@axe-core/playwright`.
- Produces: Axe-Nachweis für Kernzustände und ein versioniertes manuelles Protokoll.

- [ ] **Step 1: Add the accessibility dependency**

Run: `npm install --save-dev @axe-core/playwright`

Expected: package and lockfile contain the same resolved version.

- [ ] **Step 2: Write Axe tests for all reachable core surfaces**

```js
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze()
assert.deepEqual(results.violations.map(item => ({
  id: item.id,
  impact: item.impact,
  targets: item.nodes.map(node => node.target),
})), [])
```

Cover library, editor, project understanding, source reader, language dossier and final audit.

- [ ] **Step 3: Run and fix only evidenced violations**

Run: `node test/d2-accessibility.test.mjs`

Expected: PASS with zero violations. Each fix receives a focused regression assertion.

- [ ] **Step 4: Write the manual protocol**

The protocol records exact app commit, browsers, viewport, 200-percent zoom, keyboard-only order, visible focus, Escape return, target size, error recovery and result per state. It distinguishes executed checks from future real assistive-technology studies.

- [ ] **Step 5: Re-run D2 in three engines and full performance smoke**

Run:

```bash
AIWT_BROWSER=chromium node test/etappe-d2-smoke.mjs
AIWT_BROWSER=firefox node test/etappe-d2-smoke.mjs
AIWT_BROWSER=webkit node test/etappe-d2-smoke.mjs
node test/performance-smoke.mjs
```

Expected: all pass, p95 stays responsive, max long task remains below 50 ms.

- [ ] **Step 6: Commit**

```bash
git add app/package.json app/package-lock.json app/test/d2-accessibility.test.mjs docs/evals/SYSTEM-11-wcag-protokoll.md app/src/style.css
git commit -m "test(a11y): close WCAG 2.1 AA audit"
```

---

### Task 7: D2-Qualitätseval, unabhängiges Review und finaler Katalog

**Files:**
- Create: `app/evals/fixtures/d2-abschlussqualitaet.mjs`
- Create: `app/evals/run-d2-quality.mjs`
- Create: `app/test/d2-quality.test.mjs`
- Modify: `app/package.json`
- Create: `app/evals/results/etappe-d2-latest.json`
- Modify: `CONTEXT.md`

**Interfaces:**
- Consumes: Tasks 1–6 und den unveränderten 77-Eval-Katalog.
- Produces: `npm run eval:d2-quality`, finalen 71/0/6-Status und vollständige Abschlussbelege.

- [ ] **Step 1: Write RED quality and contrast tests**

The fixed corpus must cover scientific blockers, accepted risk, clean essay, mixed authorship, hostile export content and secret canaries. The contrast compares:

- context-sensitive audit with hard integrity ordering and user-controlled export;
- naive aggregate score that allows style to compensate and calls the text ready.

Run: `node --test test/d2-quality.test.mjs`

Expected: FAIL before the runner exists.

- [ ] **Step 2: Implement derived dimensions and threshold**

Dimensions:

- integrity gate correctness;
- reproducibility and versioning;
- authorship/provenance honesty;
- publication fidelity;
- user control, accessibility and privacy.

Every score and contrast signal must be derived from complete outputs. Pass only at overall `>= 4.5`, every dimension `>= 4`, all nine D2 IDs present, context-aware contrast `>= 4.5` and naive contrast `<= 1`.

- [ ] **Step 3: Run iteration loop, maximum five**

For every loop record generated output, failed gates, critique, refinement and fresh evidence. Stop early only when all hard gates pass or when two consecutive scores do not improve.

- [ ] **Step 4: Request independent code review and close all critical/important findings**

Review scope: status completeness, blocker logic, citation/evidence coverage, deterministic fingerprint, export escaping, authorship claims, secret redaction, import atomicity, delete guard, browser isolation, keyboard, focus, zoom and Axe coverage.

- [ ] **Step 5: Run the complete fresh verification matrix**

```bash
npm test
npm run build
npm run eval:d2-quality
node test/v2-smoke.mjs
node test/decision-log-smoke.mjs
node test/etappe-a-smoke.mjs
node test/etappe-b1-smoke.mjs
node test/etappe-b2-smoke.mjs
node test/etappe-c1-smoke.mjs
node test/etappe-c2-smoke.mjs
AIWT_BROWSER=chromium node test/etappe-d1-smoke.mjs
AIWT_BROWSER=firefox node test/etappe-d1-smoke.mjs
AIWT_BROWSER=webkit node test/etappe-d1-smoke.mjs
AIWT_BROWSER=chromium node test/etappe-d2-smoke.mjs
AIWT_BROWSER=firefox node test/etappe-d2-smoke.mjs
AIWT_BROWSER=webkit node test/etappe-d2-smoke.mjs
node test/d2-accessibility.test.mjs
node test/performance-smoke.mjs
```

From repository root:

```bash
native_verify_dir=$(mktemp -d /tmp/aiwt-d2-native.XXXXXX)
swiftc -warnings-as-errors -O -swift-version 5 -o "$native_verify_dir/sw-test" mac/main.swift
"$native_verify_dir/sw-test" --selftest
mac/build.sh
native_probe_dir=$(mktemp -d /tmp/aiwt-d2-probe.XXXXXX)
AIWT_DATA_DIR="$native_probe_dir/data" Schreibwerkzeug.app/Contents/MacOS/Schreibwerkzeug --probe "$native_probe_dir/probe.json"
git diff --check
```

Expected: all automated hard gates pass, 17 native selftests pass, probe fields are true, and no whitespace errors remain.

- [ ] **Step 6: Write and validate the final 77-Eval result**

`etappe-d2-latest.json` must contain exactly:

- `passed: 71`;
- `external-open: 6`;
- `future-stage: 0`;
- `not-applicable: 0`.

Run: `node evals/run-v2-evals.mjs --result evals/results/etappe-d2-latest.json`

Expected: `"valid": true` and an empty error list.

- [ ] **Step 7: Update context and commit final evidence**

```bash
git add app/evals/fixtures/d2-abschlussqualitaet.mjs app/evals/run-d2-quality.mjs app/test/d2-quality.test.mjs app/package.json app/evals/results/etappe-d2-latest.json CONTEXT.md
git commit -m "docs(evals): complete V2 audit gates"
```

---

## Plan Self-Review

- **Spec coverage:** Tasks 1–7 cover every acceptance criterion and each of `AUDIT-01` through `AUDIT-07`, `SYSTEM-10` and `SYSTEM-11`.
- **Boundaries:** Audit, provenance, publication, data control and UI remain separate modules with explicit interfaces.
- **Failure coverage:** Critical blockers, missing bibliography, unsafe risk export, corrupt import, secret canary, delete guard, foreign project, hostile markup, keyboard and reflow have explicit tests.
- **Type consistency:** `projectId`, `textId`, `fingerprint`, `ruleVersion`, `modelVersion`, `dataVersion`, `status`, `groups`, `blockers`, `contributions`, `manifest` and `state` keep the same names across tasks.
- **No placeholders:** Temporary filesystem paths are intentionally runtime-generated verification locations, not implementation placeholders. All product behavior and interfaces are fixed.
- **YAGNI:** Exactly three publication formats, no PDF engine, no cloud sync, no public authorship certificate and no telemetry were added.

## Execution Choice

The user released autonomous inline execution for the full eval roadmap. Use `executing-plans` in this session, preserve unrelated files, and commit each cohesive task after its focused RED–GREEN cycle.
