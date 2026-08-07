# Tier1b Foundation Components Implementation Plan

> **For agentic workers:** Execute inline with the TDD, agentic-eval, and verification-before-completion skills. Subagents are intentionally not used for this task.

**Goal:** Extend the existing contract-driven Figma component library from nine to exactly fourteen sets by adding the five Tier1b foundation sets, while preserving every existing mutation and verification safety gate.

**Architecture:** Add immutable data-only definitions to `COMPONENT_DEFINITIONS`; the existing generic renderer, recursive inventory, recovery actions, staging assembly, TOCTOU guards, and strict evidence validator consume those definitions. Extend runtime variable lookup only for dimension tokens used by the new contracts, and extend the static UI sequence in the same dependency order.

**Tech Stack:** JavaScript ESM, Node test runner, Figma Plugin API, esbuild.

## Global Constraints

- Add only `nav-item`, `list-row`, `mode-toggle`, `review-bar`, and `empty-state`, after every Tier1a definition; all use `tier: 1`.
- Keep component creation one-command-at-a-time and expose exactly fourteen component commands before `core-views`.
- Use only grayscale semantic variables, exact dimension-variable bindings, no effects, one documentation instance, one `Label` TEXT property bound to the declared label role, and only generated VARIANT axes.
- Preserve recursive inventory, ownership/ancestry checks, staging recovery, dynamic-page async APIs, current-inventory TOCTOU comparison, known-ID revalidation, and idempotent reruns.
- Do not add composite annotation, agent, dialog, or screen components.
- Modify and commit only `tools/figma-onda-one-page/**`; leave `.scratch/rueckmeldung/**` untouched.

---

## Acceptance Criteria

### Happy Path

#### AC-1: Exact five-set contract

**Given** the frozen component contract contains the existing nine sets

**When** Tier1b is loaded

**Then** the final five definitions are exactly `Onda/Nav Item`, `Onda/List Row`, `Onda/Mode Toggle`, `Onda/Review Bar`, and `Onda/Empty State`, with the required names, roles, label roles, variants, copy, direction, radius/token, target heights, gap/padding contracts, and meaningful grayscale state attributes.

#### AC-2: Exact workflow order

**Given** the plugin UI and phase definitions

**When** component commands are enumerated

**Then** exactly fourteen commands appear in contract order and all five Tier1b commands precede `core-views`.

#### AC-3: Strict evidence for fourteen sets

**Given** an executable fixture with all fourteen exact sets

**When** strict evidence validation runs

**Then** it passes with one documentation instance per set, exactly one `Label` TEXT property sourced from the declared label role, only exact generated variant axes, exact semantic/dimension binding cardinality, contract-driven layout, exact state copy/visual attributes, and no effects.

#### AC-4: Generic mutation and recovery

**Given** exact or safe partial inventories for each Tier1b set

**When** mutation validation and recovery planning run

**Then** they accept the inventory and converge missing variants, roles, properties, documentation samples, and default links without duplicate writes.

### Edge Cases

#### AC-5: Staging and idempotence

**Given** an injected combine failure while assembling a Tier1b set

**When** the command is retried and then rerun

**Then** exact owned staging variants are reused, markers are cleared after combine, and no extra variant, set, property, or documentation instance is created.

#### AC-6: Recursive ancestry and race safety

**Given** a nested lookalike, duplicate Tier1b set/sample, staging node, reparenting, property/link drift, or inserted/replaced known ID after preflight

**When** the guarded component command runs

**Then** validation aborts before the first component write; context logging may occur only where preflight already passed.

### Error States

#### AC-7: Independent corruption rejection

**Given** one exact Tier1b set is independently corrupted in copy, role cardinality/type, geometry, height, direction, paint/binding cardinality, effect list, property axes, sample identity, ownership, or ancestry

**When** strict evidence or mutation validation runs

**Then** the candidate is rejected with no false pass and can be repaired only from a safe owned partial state.

### Non-Functional Criteria

#### AC-8: Dynamic-page compatibility and scope

**Given** Figma dynamic-page access and a dirty repository containing unrelated scratch files

**When** Tier1b is built, tested, and committed

**Then** component identity uses async APIs, the classic bundle imports, the full suite is green, diffs are whitespace-clean, and the commit contains only plugin files.

## Exact Tier1b Contract

- `nav-item`: roles `Icon/Label/Count/Status`; label role `Label`; horizontal; radius `0` / `radius/none`; height `44`; states Default, Active, Hover, Collapsed; every label remains `Dokumente`, with explicit collapsed status.
- `list-row`: roles `Leading/Title/Meta/Status/Action`; label role `Title`; horizontal; radius `0` / `radius/none`; height `52`; states Default, Selected, Hover, Trash, Error; project/document row copy and explicit destructive/retry states.
- `mode-toggle`: roles `Text Label/Note Label/Indicator`; label role `Text Label`; horizontal; radius `4` / `radius/control`; height `44`; exact variants `Mode=Text, State=Active`, `Mode=Notiz, State=Active`, `Mode=Text, State=Disabled`.
- `review-bar`: roles `Symbol/Message/Primary Action/Secondary Action`; label role `Message`; horizontal; radius `0` / `radius/none`; height `64`; statuses Open, Saving, Saved, Error, Quiet; German review/save/retry copy.
- `empty-state`: roles `Symbol/Title/Description/Action`; label role `Title`; vertical; radius `6` / `radius/static`; minimum height `160`; contexts Library, No Active Annotation, Recoverable Error.

## Public Test Seams

- `COMPONENT_DEFINITIONS` and `PHASE_DEFINITIONS` immutable public contract.
- `ui.html` command surface and dependency sequence.
- `validateComponentEvidence`, `validateComponentMutationInventory`, `buildComponentRecoveryActions`, `executeStagingAssembly`, `executeGuardedComponentCommand`, and `revalidateComponentNodeRecords` behavior.
- `createValidComponentEvidence` executable contract fixture and the bundled classic JavaScript output.

## Evaluation Rubric

Threshold: **95/100**, maximum **3** generate/evaluate/critique/refine iterations; stop early only when every hard gate passes or the score no longer improves.

- Contract and exact copy/state coverage: 25
- Strict evidence, semantic/dimension bindings, cardinality: 20
- Recovery, staging, rerun idempotence: 15
- Race, ancestry, ownership, TOCTOU, known-ID safety: 20
- UI/phase order and scope exclusion: 10
- Full build/test/diff/scope verification: 10

Hard gates: fourteen exact sets/commands; all five Tier1b definitions and corruptions covered; zero-write race evidence; 93 pre-existing tests plus new tests all green; no non-plugin staged file.

## Task 1: Add Tier1b executable contract tests

**Files:**
- Create: `test/component-tier1b.test.mjs`
- Modify: `test/component-tier1a.test.mjs`

**Interfaces:**
- Consumes: public definitions, fixture, validators, guard and recovery functions.
- Produces: RED evidence for exact contract, workflow, strict evidence, corruption, recovery, staging, ancestry, race, dynamic-page compatibility, and idempotence.

- [ ] Write literal expected Tier1b contracts and focused executable tests.
- [ ] Run `node --test test/component-tier1b.test.mjs test/component-tier1a.test.mjs` and record the failing count/reasons.

## Task 2: Extend the contract, UI, and runtime token map

**Files:**
- Modify: `src/definitions.mjs`
- Modify: `src/runtime.mjs`
- Modify: `ui.html`

**Interfaces:**
- Consumes: existing `componentDefinition`/`componentVariant` schema and generic runtime renderer.
- Produces: five immutable Tier1b definitions, fourteen commands, and runtime bindings for `radius/static` plus any newly selected spacing token.

- [ ] Add one definition at a time in dependency order and run the focused tests after each vertical slice.
- [ ] Add exactly the matching UI buttons and ordered commands.
- [ ] Add only required dimension variables to `componentVariables`.
- [ ] Run focused tests to GREEN.

## Task 3: Evaluate, refine, verify, and commit

**Files:**
- Modify: `dist/code.js` through `npm run build`.
- Update: this plan's evaluation log.

**Interfaces:**
- Consumes: the complete Tier1b implementation and rubric.
- Produces: fresh full-suite/build/diff/scope evidence and one isolated commit.

- [ ] Evaluate against the rubric, record concrete failures, and refine for at most three iterations.
- [ ] Run `npm run verify`, `git diff --check`, and plugin-only scope checks.
- [ ] Stage exact plugin paths, run `git diff --cached --check`, and commit separately.
- [ ] Verify post-commit status and commit diff.

## Evaluation Log

- Initial RED: `node --test test/component-tier1b.test.mjs` — 0/6 passed, 6/6 expected feature failures (nine definitions/evidence sets only; new mutation IDs, staging, workflow, race, and TOCTOU paths unavailable).
- Initial GREEN: `node --test test/component-tier1b.test.mjs` — 6/6 passed after adding only the five contracts, required runtime dimension tokens, and five UI/workflow entries.
- Evaluation iteration 1: adjacent focused suite 26/29 and full suite 94/99; rubric 91/100. Critique: Tier1a tests still treated their nine-set milestone as the global final inventory; two Tier0 fixtures hard-coded old dimension defaults and omitted existing `spacing/32` / `radius/static` variables.
- Evaluation iteration 2: migrated legacy assertions to explicit Tier0/Tier1a subsets and made fixtures contract-driven. Adjacent focused suite 29/29 and full suite 99/99; rubric 98/100 with all code/test hard gates passing. Final bundle, diff, and staged-scope gates remain the completion verification step.
