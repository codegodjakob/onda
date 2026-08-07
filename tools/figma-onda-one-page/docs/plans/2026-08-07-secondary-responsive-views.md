# Secondary and Responsive Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic secondary builders with exactly 40 complete views: 15 Agent & Quellen, 9 Nebenansichten, and 16 Responsive/Dark references.

**Architecture:** Add one deeply frozen contract whose entries reuse the Core nested-Auto-Layout vocabulary and exact owned component variants. Pure inventory, recovery, canonical-snapshot, and evidence functions remain in `src/plan.mjs`; `src/runtime.mjs` only adapts Figma nodes, applies instance-local Role copy and Dark bindings, and renders from the contract.

**Tech Stack:** JavaScript ESM, Node test runner, Figma Plugin API, esbuild, existing Onda component/foundation contracts.

## Global Constraints

- Exact cardinality: `15 + 9 + 16 = 40`; exact order and names below.
- Mutate only sections `07 · Agent & Quellen`, `09 · Menüs & Nebenansichten`, and `10 · Responsive & Dark` on the existing `Page 1`.
- Reuse exact owned Component Sets/Variants; never create, edit, or reparent a Component Set or main Component.
- Reuse Core nested Auto Layout helpers/contracts; all regions are real parents and every Copy/Instance is nested in its contracted region.
- Override every visible `Role/<name>` TEXT descendant locally on the Instance after all required fonts are loaded.
- Derive every instance height from `componentRenderedHeight`; no universal/fake height.
- All output stays grayscale with small allowed radii; only existing permitted overlay-effect consumers may carry the owned overlay effect.
- At width 320: outer width exactly 320, padding 16, vertical composition, every interactive target at least 44 px, no overflow or overlap.
- Dark views use only bindings from `Onda · Semantic · Dark`; visible Dark nodes contain no Light semantic binding.
- Section `08 · Dialoge` is not certified by this slice. Section `11 · Prototyp`, reaction creation, and prototype evidence are explicitly out of scope and remain behaviorally unchanged for a later plan.

---

## Frozen 40-View Matrix

Use the exported shape below; every nested array/object is frozen.

```js
export const SECONDARY_VIEW_DEFINITIONS = Object.freeze({
  agentSources: Object.freeze([]), // exactly 15
  secondary: Object.freeze([]),    // exactly 9
  responsive: Object.freeze([]),   // exactly 16
})
```

Each entry exposes `{ name, sectionName, width, theme, layoutMode, regions, copyContracts, instances }`. Each instance exposes `{ name, setId, variant, region, roleCopy, expectedHeight }`; responsive entries additionally expose `{ subject, breakpoint }`.

### `07 · Agent & Quellen` — exactly 15

Every name is prefixed `Agent & Quellen / `.

| # | Suffix | Exact component variants |
|---:|---|---|
| 1 | Gespräch · Bereit | `aura@State=Idle`; `agent-message@Role=User`; `composer@State=Empty` |
| 2 | Gespräch · Antwort entsteht | `aura@State=Working`; `agent-message@State=Streaming`; `composer@State=Draft` |
| 3 | Gespräch · Antwort bereit | `aura@State=Complete`; `agent-message@Role=Agent`; `evidence-card@Status=Unverified`; `source-card@Status=Ready` |
| 4 | Gespräch · Fehler & Rückkehr | `aura@State=Error`; `agent-message@State=Error`; `composer@State=Draft`; `status-symbol@Status=Error` |
| 5 | Entscheidungsverlauf | `decision-card@Status=Pending`; `decision-card@Status=Accepted`; `decision-card@Status=Rejected`; `decision-card@Status=Overridden` |
| 6 | Evidence · Prüfmatrix | `evidence-card@Status=Unverified`; `evidence-card@Status=Verified`; `evidence-card@Status=Conflict`; `evidence-card@Status=Missing`; `tag@Kind=Source` |
| 7 | Quellen · Bereit und Laden | `source-card@Status=Ready`; `source-card@Status=Loading` |
| 8 | Quellen · Ungültig oder offline | `source-card@Status=Invalid`; `source-card@Status=Offline`; `evidence-card@Status=Missing` |
| 9 | Import · Auswahl und Validierung | `import-panel@State=Empty`; `import-panel@State=Validating` |
| 10 | Import · Bereit | `import-panel@State=Ready`; `source-card@Status=Ready` |
| 11 | Import · Fehler | `import-panel@State=Error`; `status-symbol@Status=Error` |
| 12 | Leser · Fundstelle | `reader-panel@State=Reading`; `reader-panel@State=Highlight`; `evidence-card@Status=Verified` |
| 13 | Leser · Nicht verfügbar | `reader-panel@State=Unavailable`; `source-card@Status=Offline`; `status-symbol@Status=Error` |
| 14 | Recherche · Übersicht | `research-card@Status=Planned`; `research-card@Status=Running`; `research-card@Status=Paused`; `research-card@Status=Ready` |
| 15 | Recherche · Fehler | `research-card@Status=Error`; `aura@State=Error`; `status-symbol@Status=Error` |

### `09 · Menüs & Nebenansichten` — exactly 9

Every name is prefixed `Nebenansicht / `.

| # | Suffix | Exact component variants |
|---:|---|---|
| 1 | Einstellungen · Bereit | `field@State=Filled`; `select@State=Selected`; `mode-toggle@Mode=Text, State=Active`; `button@Kind=Primary, State=Default`; `button@Kind=Secondary, State=Default` |
| 2 | Einstellungen · Validierungsfehler | `field@State=Error`; `select@State=Open`; `mode-toggle@Mode=Text, State=Active`; `button@Kind=Primary, State=Default`; `button@Kind=Secondary, State=Default` |
| 3 | Link-Menü · Geöffnet | `menu-item@State=Default`; `menu-item@State=Hover`; `menu-item@State=Selected`; `menu-item@State=Disabled` |
| 4 | Slash-Menü · Suche leer | `search@State=Empty`; honest recent-command `menu-item@State=Default` rows |
| 5 | Slash-Menü · Treffer | `search@State=Results`; matching `menu-item@State=Default` and `menu-item@State=Selected` rows |
| 6 | Slash-Menü · Keine Treffer | `search@State=No Results`; `empty-state@Context=No Active Annotation`; `button@Kind=Secondary, State=Default` |
| 7 | Blockeinfügung · Position wählen | `select@State=Open`; `menu-item@State=Selected`; `dialog-action@Kind=Primary`; `dialog-action@Kind=Secondary` |
| 8 | Quellenleser · Fundstelle übernehmen | `reader-panel@State=Highlight`; `evidence-card@Status=Verified`; `dialog-action@Kind=Primary`; `dialog-action@Kind=Secondary` |
| 9 | Rechercheablauf · Pausiert und Fehler | `research-card@Status=Paused`; `research-card@Status=Error`; honest recovery `menu-item@State=Default` rows |

### `10 · Responsive & Dark` — exactly 16

| # | Exact name | Breakpoint/theme | Required component mapping |
|---:|---|---|---|
| 1 | Responsive / Bibliothek · 1440 Light | 1440/Light | Core Library base: Nav, Search, Select, List Rows |
| 2 | Responsive / Bibliothek · 1024 Light | 1024/Light | Core Library base: Nav, Search, Select, List Rows |
| 3 | Responsive / Bibliothek · 720 Light | 720/Light | Core Library base; `nav-item@State=Collapsed` |
| 4 | Responsive / Bibliothek · 320 Light | 320/Light | Core Library base; `nav-item@State=Collapsed`; 320 rules |
| 5 | Responsive / Editor · 1440 Light | 1440/Light | Core Editor base: Nav, Mode, Review, Anchor, Annotation Card |
| 6 | Responsive / Editor · 1024 Light | 1024/Light | Core Editor base: Nav, Mode, Review, Anchor, Annotation Card |
| 7 | Responsive / Editor · 720 Light | 720/Light | Core Editor base; `nav-item@State=Collapsed` |
| 8 | Responsive / Editor · 320 Light | 320/Light | Core Editor base; `nav-item@State=Collapsed`; 320 rules |
| 9 | Responsive / Bibliothek · 1440 Dark | 1440/Dark | Library base; Dark bindings only |
| 10 | Responsive / Bibliothek · 320 Dark | 320/Dark | Library base; collapsed Nav; Dark bindings; 320 rules |
| 11 | Responsive / Editor · 1440 Dark | 1440/Dark | Editor base; Dark bindings only |
| 12 | Responsive / Editor · 320 Dark | 320/Dark | Editor base; collapsed Nav; Dark bindings; 320 rules |
| 13 | Responsive / Annotation · Beleg fehlt · Dark | reference/Dark | `annotation-anchor@Kind=Text, State=Active`; `annotation-form@Form=Source`; `annotation-card@State=Open`; Primary/Secondary `dialog-action` |
| 14 | Responsive / Agent · Streaming · Dark | reference/Dark | `aura@State=Working`; `agent-message@State=Streaming`; `composer@State=Draft`; `dialog-action@Kind=Disabled` |
| 15 | Responsive / Evidence · Konflikt · Dark | reference/Dark | `evidence-card@Status=Conflict`; `source-card@Status=Invalid`; `reader-panel@State=Highlight` |
| 16 | Responsive / Dialog · Lang · Dark | reference/Dark | `dialog@Size=Long`; Primary/Secondary `dialog-action` |

All generic labels from main Components are replaced by state-specific German `roleCopy`; no `Projekt Nordstern`, generic `Essay`, generic dialog prose, or mismatched source/evidence labels may remain visible. Related roles must also agree semantically: for example, `Search Input`, `Count`, Empty-State title/description, and recovery CTA must describe the same query/result state.

## Acceptance Criteria

### Happy Path

#### AC-1: Exact frozen matrix

**Given** the exported secondary-view contract

**When** its three groups are inspected

**Then** their ordered names and component mappings match the tables exactly, their counts are 15, 9, and 16, and the total is 40.

#### AC-2: Real nested views and exact components

**Given** any of the 40 rendered views

**When** its hierarchy is inspected

**Then** its outer frame and all regions use non-`NONE` Auto Layout, regions are actual parents, and every contracted control is a repeated owned exact-Variant Instance nested in its region with complete instance-local Role copy and definition-derived height.

#### AC-3: Responsive and Dark fidelity

**Given** a responsive or Dark contract

**When** it is rendered

**Then** its frame has the exact contracted width/theme, 720/320 base views use collapsed Nav, every visible Dark fill/stroke/text binding resolves only to `Onda · Semantic · Dark`, every visible Instance Role descendant stays inside its Instance, and only Annotation Card/Dialog overlay consumers retain the permitted owned effect.

### Edge Cases

#### AC-4: 320 containment

**Given** either 320-pixel Light or Dark view

**When** all Copy, Instances, and nested regions are measured

**Then** padding is exactly 16, composition is vertical, controls are at least 44 px high, and neither a region/Copy/Instance nor any visible Instance Role descendant overflows or overlaps its parent.

#### AC-5: Safe partial recovery and rerun

**Given** a fresh, exact, or owned safe-partial inventory

**When** the secondary command is run and then rerun

**Then** missing views/regions/copy/instances/bindings are created or repaired to the exact contract, owned legacy children are migrated or intentionally reconciled without visible residue, the second run produces no recovery actions, and the implementation of sections 08/11 plus Component Sets remains unchanged.

### Error States

#### AC-6: Collision and race abort

**Given** an unowned, duplicate, wrong-parent, wrong-type, extra-marked, or post-preflight-drifted candidate

**When** the command reaches its write barrier

**Then** it aborts with zero secondary writes and names the invalid candidate; the next run can proceed after the external conflict is removed.

#### AC-7: Strict evidence cannot false-pass

**Given** evidence with one corruption in cardinality, ancestry, Auto Layout, bounds, internal Role bounds, 320 containment, height, Set/Variant link, Role copy/coherence, marker, paints, variable binding, or effect identity

**When** strict secondary evidence and Verify run

**Then** both report failure; exact evidence reports 15/9/16 and passes.

### Non-Functional Criteria

#### AC-8: Scope, safety, and auditability

**Given** the completed B2a2 slice

**When** build, tests, baseline comparison, and diff are inspected

**Then** no Page/Component Set/main Component mutation or new Prototype contract/evidence occurred, no baseline node changed, the bundle is current, all tests pass, and the commit contains only `tools/figma-onda-one-page/**` files required by this slice.

## Files and Interfaces

- Create `tools/figma-onda-one-page/test/secondary-responsive-views.test.mjs`: seven focused contract, evidence, recovery, race, Dark, responsive, and Runtime tests.
- Modify `tools/figma-onda-one-page/src/definitions.mjs`: export `SECONDARY_VIEW_DEFINITIONS` and reuse `componentRenderedHeight` plus the Core region/role-copy builders.
- Modify `tools/figma-onda-one-page/src/plan.mjs`: export `validateSecondaryViewMutationInventory`, `buildSecondaryViewRecoveryActions`, `canonicalSecondaryViewMutationSnapshot`, `executeGuardedSecondaryViewCommand`, and `validateSecondaryViewEvidence`; include target Page, owned target Sections, every nested child, and visible Instance Role descendant records.
- Modify `tools/figma-onda-one-page/src/runtime.mjs`: add recursive collection/render/evidence adapters for sections 07/09/10; use instance-descendant Role overrides and Dark variable bindings; leave `createPrototype` unchanged.
- Modify `tools/figma-onda-one-page/test/plan.test.mjs` and `test/review-contract.test.mjs` only where the strict Verify shape/counts require migration; do not weaken existing corruptions.
- Rebuild `tools/figma-onda-one-page/dist/code.js` from `src/runtime.mjs`.

## TDD Implementation Tasks

### Task 1: Freeze the exact matrix

- [x] Add one focused test that asserts all 40 ordered names, mappings, deep freezes, region parents, complete Role keys, and `expectedHeight === componentRenderedHeight(component)`.
- [x] Run `node --test test/secondary-responsive-views.test.mjs`; expect the focused test to fail because `SECONDARY_VIEW_DEFINITIONS` is absent.
- [x] Add the minimal definitions and shared Core layout/role-copy helpers needed to pass; do not add Runtime writes.
- [x] Rerun the focused test; expect PASS.

### Task 2: Add nested recovery and complete TOCTOU protection

- [x] Add failing tests for fresh/exact/partial/legacy/idempotent inventories and zero-write rejection of duplicate, unowned, wrong-parent, unknown marked, visible-residue, and same-ID drift cases.
- [x] Implement the five pure/guarded `plan.mjs` interfaces listed above. The canonical snapshot must cover target Page and Sections plus view/region/copy/instance/visible-Role identity, ancestry, bounds, layout, paints and variable IDs, effects/effect-style ID, Role copy, component properties, exact links, child order, and plugin markers.
- [x] Collect and compare a fresh complete inventory after context and again immediately before the first secondary write; expect every injected drift to reject with zero writes.
- [x] Run the focused mutation/race tests; expect PASS.

### Task 3: Render exact nested views

- [x] Add failing Runtime-source/evidence tests for real parent insertion, non-`NONE` Auto Layout, exact instance swaps via async main-component identity, local `Role/<name>` changes after font loading, and absence of Component/Set mutation in the secondary path.
- [x] Replace the three generic builders with contract-driven update-or-create adapters. Size instances from `expectedHeight`, nest them in real regions, and keep Sections 08 and 11 outside collection/evidence for this slice.
- [x] For Dark views, bind every visible local frame/copy/instance-descendant paint to the exact Dark semantic variable ID; do not mutate main Components or reuse a Light semantic ID.
- [x] Run the Runtime-focused tests and build; expect PASS and an importable classic `dist/code.js`.

### Task 4: Close responsive and strict-evidence false passes

- [x] Add independent corruptions for missing/extra/duplicate views, wrong width/theme, `layoutMode=NONE`, wrong ancestry, fake height, region/Instance/internal-Role overflow, overlap, target below 44, incomplete/wrong/contradictory Role copy, wrong Variant/Set, colored paint, Light binding in Dark, missing/wrong Dark binding, and unauthorized effect.
- [x] Implement strict evidence with exact 15/9/16 cardinalities, nested and internal Role containment, sibling non-overlap, exact 320 rules, semantic coherence, grayscale, Dark binding provenance, and allowed overlay-effect identity/cardinality.
- [x] Add the strict result to Verify as a hard gate while preserving explicit legacy compatibility only for snapshots that contain no modern secondary evidence.
- [x] Run focused, adjacent, and full tests; expect all corruptions to fail independently and exact evidence to pass.

### Task 5: Evaluate, refine, and hand off

- [x] Run `npm run verify`, `git diff --check`, and a plugin-only scope check; record exact counts and failures.
- [x] Score the rubric below, critique failed dimensions, and refine at most twice more. Stop early only when every hard gate passes and score is at least 95; stop if a new iteration does not improve the score.
- [ ] Inspect rendered 1440, 720, 320, and Dark reference samples in Figma; pending the later user-confirmed live-Figma run. No visual certification is claimed here.
- [x] Commit only after fresh verification; Prototype work remains a separate later slice.

## Evaluation Rubric

Threshold: **95/100**. Maximum: **3 iterations** (`generate → evaluate → critique → refine`). Preserve the RED result and each iteration score.

| Dimension | Points | Passing evidence |
|---|---:|---|
| Exact 15+9+16 contract and honest content | 20 | Ordered matrix/deep-freeze tests; no generic residue |
| Nested Auto Layout and responsive composition | 20 | Real parent IDs; 1440/1024/720/320 geometry; 320 containment and ≥44 targets |
| Exact instances, Role copy, and actual heights | 20 | Async Set/Variant links; all visible TEXT roles; calculated heights |
| Dark bindings and permitted effects | 15 | Dark variable-ID provenance only; grayscale; exact overlay consumers |
| Strict evidence and false-pass resistance | 15 | Independent corruption suite plus Verify hard gate |
| Recovery, idempotence, TOCTOU, and scope safety | 10 | Partial convergence; same-ID race rejection; zero writes; no Page/Set change and no new Prototype contract/evidence |

Hard gates: exact names/counts/mappings; real nested Auto Layout; full local Role copy; definition-derived heights; exact 320 rules; Dark-only semantic bindings; strict evidence; final write barrier; focused and full GREEN; current bundle; plugin-only diff; no Prototype implementation change or certification in this slice.

## Self-Review Checklist

- [ ] Counts recompute to 15/9/16/40 and every supplied name/mapping appears once.
- [ ] Happy path, boundaries, failures, recovery, and non-functional scope have independent Given/When/Then criteria.
- [ ] Every produced interface has one owner and consistent spelling across tasks.
- [ ] No placeholder language appears.
- [ ] Section 11/Prototype is explicitly deferred, not silently certified.
