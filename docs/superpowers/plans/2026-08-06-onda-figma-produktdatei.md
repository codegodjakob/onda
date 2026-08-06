# Onda Figma One-Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the complete monochrome Onda design documentation inside the existing Figma file `Claude Code`, exclusively on its existing `Page 1`, including all 29 annotation types, multi-state dialogs, responsive references, and clickable workflows.

**Architecture:** Preserve every existing node on `Page 1`, measure the occupied canvas, and reserve a demonstrably free area for Onda. Every former main-page category and every annotation type is represented there by a uniquely named direct child `SECTION` of `Page 1`; a same-named direct-child wrapper frame is permitted only if `SECTION` is unavailable in the active editor/plugin context. Shared components, variables, Auto Layout, and instances remain local to the existing `Claude Code` file.

**Superseded architecture:** The earlier new-file and 39-Figma-page plan is **superseded** by the user's explicit one-page override. The previously created file `Onda · Produktdesign` is not the target and must not receive further mutations.

**Tech Stack:** Figma Design in the existing desktop file, a locally reviewed Figma generator if MCP remains unavailable, Figma Plugin API, local variables/components/variants, Auto Layout, prototype reactions, ABC Diatype when available, and the productive Onda sources already inventoried in the evidence ledger.

## Global Constraints

- Target file name: exactly `Claude Code`.
- Target page: exactly the existing `Page 1`.
- Do not create, rename, reorder, or delete any Figma page.
- Do not delete, move, resize, rename, restyle, or reparent any pre-existing node on `Page 1`.
- Before mutation, record the existing top-level node IDs and occupied bounds. Place the Onda content area beyond those bounds with at least 2,000 px clearance.
- Every required Onda content section is a direct child of `Page 1` and uses the shared prefix `Onda /`; do not nest required sections inside a root frame or root section.
- All visible paints are neutral grayscale values; solid RGB colors satisfy `r === g && g === b` within `0.002`.
- Base surfaces and lists use 0 px radius; controls use 4 px; larger static surfaces use at most 6 px; overlays use 8 px; 999/full radius is limited to true circles.
- ABC Diatype is the intended font at 12, 15, 21, and 40 px using weights 400, 500, and 700. If unavailable, record the exact fallback before creating text.
- Important hit targets are at least 44 × 44 px.
- Shadows are limited to real overlays; base surfaces, lists, and static cards remain flat.
- Repeated UI is built as local components and placed as instances; related containers use Auto Layout.
- Multiple dialog versions remain required.
- No productive application code, data model, Design System files, or pre-existing Figma content is modified.

## Required Section Inventory on `Page 1`

### Shared product sections

- `Onda / 00 · Übersicht`
- `Onda / 01 · Foundations`
- `Onda / 02 · Komponenten`
- `Onda / 03 · Bibliothek`
- `Onda / 04 · Editor`
- `Onda / 07 · Agent & Quellen`
- `Onda / 08 · Dialoge`
- `Onda / 09 · Menüs & Nebenansichten`
- `Onda / 10 · Responsive & Dark`
- `Onda / 11 · Prototyp`

### Text annotation sections

- `Onda / 05.01 · Rechtschreibung`
- `Onda / 05.02 · Grammatik`
- `Onda / 05.03 · Zeichensetzung`
- `Onda / 05.04 · Wortwahl`
- `Onda / 05.05 · Satzstil`
- `Onda / 05.06 · Absatzstil`
- `Onda / 05.07 · Straffen`
- `Onda / 05.08 · Wiederholung`
- `Onda / 05.09 · Ton & Register`
- `Onda / 05.10 · Stilmittel`
- `Onda / 05.11 · Anglizismus`
- `Onda / 05.12 · Terminologie`
- `Onda / 05.13 · Verschieben`
- `Onda / 05.14 · Übergang`
- `Onda / 05.15 · Gliederung`
- `Onda / 05.16 · Textfluss`
- `Onda / 05.17 · Roter Faden`
- `Onda / 05.18 · Überschrift`
- `Onda / 05.19 · Anmerkung`
- `Onda / 05.20 · Beleg fehlt`
- `Onda / 05.21 · Faktencheck`
- `Onda / 05.22 · Widerspruch`
- `Onda / 05.23 · Gegenargument fehlt`
- `Onda / 05.24 · Verständlichkeit`

### Note annotation sections

- `Onda / 06.01 · Ausformulieren`
- `Onda / 06.02 · Gehört zusammen`
- `Onda / 06.03 · Nachfrage`
- `Onda / 06.04 · Reihenfolge`
- `Onda / 06.05 · Offener Faden`

## Stable Acceptance Criteria and Evidence

| Criterion | Observable pass condition | Fresh evidence |
|---|---|---|
| AC-1 · One-page target | File name is `Claude Code`; every required Onda section is a direct child of `Page 1`; no Onda page was added | before/after page-name inventory and section-name/parent inventory |
| AC-2 · Existing content preserved | Every pre-existing top-level node ID remains with unchanged parent, position, size, name, and type | serialized before/after snapshot diff |
| AC-3 · Free-area placement | Onda bounds do not intersect any pre-existing top-level bounds and clearance is at least 2,000 px on the chosen placement axis | measured bounding-box report |
| AC-4 · Complete coverage | All ten shared sections and all 29 annotation sections exist once; seven dialog rows contain every approved version | exact unique-name counts and frame inventory |
| AC-5 · Monochrome | No solid visible paint has unequal RGB channels beyond tolerance; meaning is not color-only | paint traversal and screenshot review |
| AC-6 · Radius system | Non-circular nodes use only 0, 4, 6, or 8 px; 999/full radius occurs only on measured circles | radius/geometry traversal |
| AC-7 · Components and layout | Repeated controls are instances; related containers use Auto Layout; static surfaces have no shadow | component/instance/layout/effect metadata |
| AC-8 · Annotation states | Each annotation section contains its productive anchor, detail, decision, recovery, error, 320 px, and representative Dark states, omitting unsupported actions explicitly | per-section state inventory and detail screenshots |
| AC-9 · Dialog versions | Seven dialog rows cover approved empty, filled, working, error, confirmation, and recovery variants | named dialog-frame inventory and screenshots |
| AC-10 · Responsive and Dark | Required 1440/1024/720/320 references remain in bounds; representative Dark views remain monochrome and readable | bounds checks and paired screenshots |
| AC-11 · Interaction and accessibility | Primary and support prototype paths have no dead intermediate state; key targets are at least 44 × 44 px and focus/recovery actions are visible | reaction graph, target-size traversal, walkthrough |
| AC-12 · Visual quality | Completeness, hierarchy, consistency, readability, and state clarity each score at least 4.5/5 within at most three iterations | evaluation ledger with scores and corrections |

---

### Task 1: Lock the target and capture the preservation baseline

**Files:**

- Modify: `docs/superpowers/evidence/2026-08-06-onda-figma/coverage.md`

- [ ] Confirm the active desktop file name is `Claude Code` and selected page name is `Page 1`.
- [ ] Record a page inventory before mutation. Expected: no new Onda-specific page is created.
- [ ] Serialize every existing top-level node on `Page 1`: `id`, `name`, `type`, `parent.id`, `x`, `y`, `width`, and `height`.
- [ ] Compute the union of existing bounds and choose a placement origin at least 2,000 px beyond the occupied area.
- [ ] Record target evidence and the placement calculation in the ledger.

### Task 2: Build and test the local generator

**Files:**

- Create or modify only the dedicated generator source, manifest, and tests under the implementation path selected by the parent task.
- Modify: `docs/superpowers/evidence/2026-08-06-onda-figma/coverage.md`

- [ ] Establish failing contract tests for exact target page, preservation, required section names, grayscale paints, allowed radii, dialog rows, responsive widths, annotation states, and idempotent reruns.
- [ ] Implement a generator that aborts unless the active page is exactly `Page 1`.
- [ ] On rerun, update only nodes carrying the generator's explicit Onda marker; never select nodes by position or broad name matching.
- [ ] Load ABC Diatype when available; otherwise record and display the named fallback deviation.
- [ ] Make the generator report created/updated node IDs, final Onda bounds, existing-content snapshot, and validation failures.
- [ ] Run tests and record commands/results in the ledger before importing the plugin.

### Task 3: Create foundations and the component library in the free area

- [ ] Create `00 · Übersicht`, `01 · Foundations`, and `02 · Komponenten` as direct-child sections of `Page 1` at the calculated origin.
- [ ] Build grayscale Light/Dark variables, spacing/radius variables, five text styles, and one overlay shadow.
- [ ] Build local action, input, navigation, shell, list, overlay, annotation, Agent/Aura, source, and research components.
- [ ] Ensure controls have 44 px targets, lists remain flat/radius 0, overlays use radius 8, and Aura/full radius is reserved for circles.
- [ ] Validate paint, radius, effect, component, instance, and Auto Layout metadata before continuing.

### Task 4: Create shared product sections

- [ ] Build `03 · Bibliothek` with projects, documents, paper bin, search, sorting, empty, and recoverable error states.
- [ ] Build `04 · Editor` with text/note modes, quiet annotations, collapsed sidebar, focus, saving/saved/error, and no-active-annotation states.
- [ ] Build `07 · Agent & Quellen` with Aura/conversation, status, decision history, evidence, source, import, reader, and research states.
- [ ] Build `09 · Menüs & Nebenansichten` with settings, link, slash, block insertion, reader, and research variants.
- [ ] Validate 1440 px reference bounds, production hierarchy, monochrome rendering, and instance usage.

### Task 5: Create all 29 annotation sections

- [ ] Create each exact `05.01`–`05.24` and `06.01`–`06.05` required section once on `Page 1`.
- [ ] For each type, add productive anchor, open detail, accept/result, rejection scope, own version where supported, undo, recoverable error, 320 px, and representative Dark frames.
- [ ] Explicitly label unsupported actions instead of inventing product behavior.
- [ ] Validate exact section count and unique names, required state coverage, grayscale paints, allowed radii, 320 px containment, and reusable annotation instances.

### Task 6: Create multi-state dialogs

- [ ] Build `08 · Dialoge` with rows for Projektverständnis, Quellen im Projekt, KI-Anschluss, Projektgedächtnis, Argumentationsdossier, Sprache und Wirkung, and Schlussaudit & Export.
- [ ] Preserve every approved empty, filled, working, error, confirmation, budget, import, research, recovery, and deletion version from the specification.
- [ ] Keep close and primary actions reachable in long variants; destructive meaning uses explicit text and symbol rather than color.
- [ ] Validate seven row names, state inventory, radius 8, overlay shadow, focus order, and component instance usage.

### Task 7: Create responsive, Dark, overview, and prototype sections

- [ ] Build `10 · Responsive & Dark` with 1440, 1024, 720, and 320 px library/editor references plus representative annotation, agent, evidence, and long-dialog Dark references.
- [ ] Build `00 · Übersicht` matrices linking exact section/frame names for shared views, 29 annotations, seven dialogs, responsive mapping, and legend.
- [ ] Build `11 · Prototyp` for the primary flow and the Projektwissen, Quellen/Recherche, and Agent/Beleg support flows.
- [ ] Ensure error paths reach retry, setup, correction, or cancel rather than dead ends.

### Task 8: Run evaluation and final verification

**Files:**

- Create or modify: `docs/superpowers/evidence/2026-08-06-onda-figma/eval.md`
- Modify: `docs/superpowers/evidence/2026-08-06-onda-figma/coverage.md`

- [ ] Re-read the file/page inventory. Hard gate: target remains `Claude Code` / `Page 1`; no Onda-specific page was added.
- [ ] Diff the fresh top-level snapshot against the baseline. Hard gate: every pre-existing node is unchanged.
- [ ] Measure intersections and clearance. Hard gate: Onda does not overlap existing content and meets the 2,000 px clearance.
- [ ] Traverse section names, states, paints, radii, effects, fonts, bounds, target sizes, components/instances, Auto Layout, and prototype reactions.
- [ ] Capture overview and representative detail screenshots. Score completeness, hierarchy, consistency, readability, and state clarity from 1–5.
- [ ] Correct targeted failures and repeat for at most three total iterations; stop early when all hard gates pass and every score is at least 4.5/5.
- [ ] Mark every stable AC `PASS` or `FAIL` with measured evidence. Do not infer a pass from another criterion.
- [ ] Report any unavailable font or tool capability plainly; never convert a documented deviation into a pass.
