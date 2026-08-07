# Tier2 Agent/Source Composites

**Goal:** Append the final eight flat Tier2 agent/source component sets after the existing nineteen sets and expose exactly twenty-seven ordered component commands without adding core screens.

**Approved design:** Extend the immutable `COMPONENT_DEFINITIONS` data and `ui.html` command list. Reuse the existing generic component renderer, exact semantic/dimension binding collector, strict evidence validator, recovery/staging assembly, and guarded TOCTOU command flow. Dedicated per-set builders would duplicate established safety logic; a new external schema would add indirection without serving this closed contract.

**Public seams:** `COMPONENT_DEFINITIONS`, `PHASE_DEFINITIONS`, `ui.html`, component/foundation evidence, mutation/recovery/staging/TOCTOU functions, and dynamic-page async identity APIs.

## Acceptance Criteria

### AC-1: Exact final contract

**Given** the nineteen existing component sets

**When** the component contract is loaded

**Then** Aura, Agent Message, Decision Card, Evidence Card, Source Card, Import Panel, Reader Panel, and Research Card appear last in that order as tier 2 with the exact requested variants, roles, label roles, direction, minimum height, radius, and generated axes.

### AC-2: Honest state communication

**Given** every agent, research, source, import, reader, evidence, and decision state

**When** its documentation copy and visual attributes are inspected

**Then** each state has distinct meaningful German copy, explicit retry/error/offline recovery where applicable, and state-specific surface, stroke, opacity, or symbol cues without claiming unsupported automatic behavior.

### AC-3: True-circle roles and exact bindings

**Given** Aura Orb and Agent Message Avatar roles

**When** strict component evidence is validated

**Then** both remain 16×16 `ELLIPSE` nodes with exact single `radius/circle` bindings on `maxWidth` and `maxHeight`; every component surface, text, border, spacing, padding, and radius field has exactly one expected semantic/dimension binding.

### AC-4: Flat effects and documentation cardinality

**Given** any of the eight new sets

**When** it is rendered or verified

**Then** all variants have no effect style and no effects, each set has exactly one documentation instance linked to its first variant, and Label is the only TEXT component property using the declared label role.

### AC-5: Recovery and guarded mutation

**Given** exact, safe partial, staged, reparented, duplicated, raced, or replaced inventories

**When** a new component command executes

**Then** exact and safe partial inventories converge idempotently while ownership, ancestry, geometry, property/link drift, duplicate insertion, and known-ID replacement abort before component writes using the existing dynamic-page-safe identity gates.

### AC-6: Workflow, verification, and scope

**Given** the plugin UI and phase contract

**When** commands and repository changes are inspected

**Then** exactly twenty-seven component commands precede core views, no core screen is added, focused RED/GREEN and full build/tests/diff gates pass, and only `tools/figma-onda-one-page/**` files enter the separate commit.

## Evaluation

Threshold: **95/100**, maximum **3** iterations.

- Exact contract/copy/state visuals/UI: 25
- Strict evidence/properties/bindings/true circles: 25
- Flat-effect and documentation safety: 15
- Recovery/staging/ancestry/race/TOCTOU/dynamic-page gates: 25
- Full verification and scope: 10

Hard gates: 27 exact sets/commands; 32 new variants across 8 exact sets; both ELLIPSE roles remain exact circles; all new variants flat; one documentation instance per set; focused executable RED/GREEN; full suite/build/diff clean; plugin-only commit.

## Execution

1. Write six focused executable tests and capture the missing-contract RED baseline.
2. Append eight immutable definitions with exact copy, geometry, label roles, and state visuals.
3. Append eight UI commands; let `PHASE_DEFINITIONS` derive the exact 27-command sequence.
4. Migrate only legacy exact-19 assertions to a stable prefix while preserving their strict global evidence checks.
5. Evaluate, refine only on rubric failures, run fresh full verification, scope-check, and commit separately.

## Evaluation Log

- RED baseline: `node --test test/component-tier2-agent-source.test.mjs` — **0/6 passed, 6/6 failed** with expected assertion failures for the missing eight-set/27-command contract.
- GREEN focused: the same command — **6/6 passed** after changing only definitions and UI production sources.
- Iteration 1: **90/100**, hard gate failed. Focused tests and the 32-test adjacent component suite passed, but the first full run was **109/111** because a legacy milestone still asserted the global 19-set length and the verification fixture hard-coded `instanceCount: 20`.
- Critique/refinement: migrated the old milestone to an exact 19-set prefix plus strict global evidence and changed only the fixture instance count to `COMPONENT_DEFINITIONS.length + 8`. No validator, ownership, collision, ancestry, binding, effect, race, or TOCTOU gate was weakened.
- Iteration 2: **100/100** (contract/copy/state visuals/UI 25/25; evidence/properties/bindings/circles 25/25; flat-effect/documentation safety 15/15; recovery/staging/ancestry/race/TOCTOU/dynamic-page 25/25; verification/scope 10/10). All hard gates pass; stop before iteration 3.
- Fresh completion evidence: `npm run verify` built `dist/code.js` at **234.3 kB** and passed **111/111** tests. Scope and diff evidence are recorded immediately before the separate commit; unrelated `.scratch/rueckmeldung/**` files remain untouched and uncommitted.
