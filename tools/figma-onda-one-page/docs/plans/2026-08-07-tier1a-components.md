# Tier1a Component Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use the repository TDD workflow and execute this plan inline, one RED→GREEN slice at a time.

**Goal:** Extend the Onda Figma plugin from four Tier0 component sets to exactly nine sets by adding Field, Search, Select, Composer, and Menu Item without weakening the existing safety gates.

**Architecture:** Keep `COMPONENT_DEFINITIONS` as the frozen single source of truth. Generalize the existing definition-driven renderer, recursive mutation inventory, recovery, and strict evidence validator so every new set follows the same ancestry, staging, TOCTOU, sample, property, and variable-binding rules as Tier0.

**Tech Stack:** JavaScript ES modules, Node test runner, Figma Plugin API, esbuild.

## Global Constraints

- Tier1a contains only `Onda/Field`, `Onda/Search`, `Onda/Select`, `Onda/Composer`, and `Onda/Menu Item`, directly after Tier0.
- All variants are monochrome Auto Layout components with no effects, at least 44 px high; Composer is at least 88 px high.
- Radius is 4/`radius/control` except Menu Item, which is 0/`radius/none`.
- Fills, strokes, text, gap, padding, and all four radii have exact one-variable binding cardinality.
- There is exactly one documentation instance and one TEXT property named `Label` per set; generated expected VARIANT properties are permitted and every other property is rejected.
- Recursive ancestry, staging recovery, async main-component links, validated-inventory handoff, ID-based TOCTOU revalidation, zero-write failure behavior, and rerun idempotence remain mandatory for all nine sets.
- No Tier1b or composite components are introduced.

## Acceptance Criteria

### AC-1: Exact frozen Tier1a contract

**Given** the plugin contract is loaded

**When** the five Tier1a definitions are inspected

**Then** their order, tier, role names and types, exact variant counts/names, German copy, radius, target height, direction, gap/padding tokens, stroke weight, opacity, surface token, and text token match the approved contract and every nested record is frozen.

### AC-2: Exact render evidence

**Given** executable component evidence derived from all nine definitions and the real foundation variables

**When** strict component verification runs

**Then** all nine sets pass with exact Auto Layout direction, geometry, copy, role inventory, visual attributes, variable bindings, properties, ancestry, and one default-linked documentation instance per set.

### AC-3: Corruption rejection

**Given** valid evidence for each Tier1a set

**When** its copy, visual state, role inventory, component property, sample link, or gap/padding/radius binding is corrupted independently

**Then** strict verification fails for that set.

### AC-4: Safe recovery and failure behavior

**Given** an owned partial Tier1a set, partial staging assembly, or sample linked to a non-default owned variant

**When** the matching component command runs

**Then** only missing roles/variants/properties/samples are repaired, staging survives a failed combine and is reused, the sample is relinked to Default, and retries converge without duplicates.

### AC-5: Collision and TOCTOU safety

**Given** a nested lookalike container, unowned or malformed Tier1a node, invalid property, wrong ancestry, or an ID-replaced node after preflight

**When** a Tier1a mutation is attempted

**Then** it aborts before the first component write and preserves the document.

### AC-6: Exact workflow and verification

**Given** the plugin UI and phase plan

**When** commands are enumerated and the full verification command runs

**Then** exactly nine component commands appear in dependency order, the strict report expects nine sets and nine documentation instances, the bundle builds, all tests pass, and no non-plugin file is changed.

## Evaluation Rubric

- Hard gates: AC-1 through AC-6 all pass; any failure scores the iteration below threshold.
- Weighted score: contract fidelity 30%, executable safety/recovery 25%, strict evidence 25%, renderer/UI integration 15%, scope hygiene 5%.
- Passing threshold: 95/100 with every hard gate passing.
- Iteration cap: 4; stop early when all hard gates pass or when two consecutive scores do not improve.

## Task 1: Write and prove the Tier1a RED suite

**Files:**
- Create: `test/component-tier1a.test.mjs`
- Modify: none

**Interfaces:**
- Consumes: `COMPONENT_DEFINITIONS`, `validateComponentMutationInventory`, `validateComponentEvidence`, `buildComponentRecoveryActions`, and shared component/foundation fixtures.
- Produces: executable assertions for AC-1 through AC-6.

- [ ] Write tests asserting the exact five definitions, all nine command IDs, valid nine-set evidence, per-set corruption rejection, partial recovery, staging retry, sample relink, and zero-write TOCTOU behavior.
- [ ] Run `node --test test/component-tier1a.test.mjs` and record failures caused by the absent Tier1a contract and behavior.

## Task 2: Generalize the frozen contract and renderer

**Files:**
- Modify: `src/definitions.mjs`
- Modify: `src/runtime.mjs`
- Modify: `ui.html`

**Interfaces:**
- Consumes: frozen component role/variant helpers and foundation variable lookup.
- Produces: definition fields `tier`, `radius`, `radiusToken`, `targetHeight`, `gap`, `gapToken`, `padding`, `paddingTokens`, and `direction`; variant fields `strokeWeight`, `opacity`, `surfaceToken`, and `textToken`.

- [ ] Add only the five approved Tier1a definitions after Tier0 and expose their nine total commands in exact order.
- [ ] Make the renderer use every definition/variant layout and visual field, including `radius/none` and `color/text-muted`, without special-casing Tier1a IDs.
- [ ] Run the focused suite and implement only what is required to move contract/renderer failures to green.

## Task 3: Generalize strict evidence and fixtures

**Files:**
- Modify: `src/plan.mjs`
- Modify: `test/component-fixture.mjs`
- Modify: Tier0 compatibility tests only where they intentionally assert the Tier0 subset.

**Interfaces:**
- Consumes: the generalized definitions and real foundation variable IDs.
- Produces: exact nine-set evidence checking and definition-driven fixtures.

- [ ] Validate exact layout direction, variant visual fields, dimensions, bindings, copy, roles, Label property, sample, and ancestry for every definition.
- [ ] Keep recursive preflight, staging, recovery, async link, and TOCTOU paths definition-driven across all nine IDs.
- [ ] Run focused Tier0 plus Tier1a tests; refactor only after all are green.

## Task 4: Evaluate, verify, and commit

**Files:**
- Rebuild: `dist/code.js`
- Review: every changed plugin file

**Interfaces:**
- Consumes: all implementation and test changes.
- Produces: one isolated Tier1a commit.

- [ ] Score the implementation against the rubric; critique and refine for at most four iterations until all hard gates and 95/100 pass.
- [ ] Run `npm run verify`, `git diff --check`, and a plugin-only status/scope inspection with fresh output.
- [ ] Commit only `tools/figma-onda-one-page/**` with a separate Tier1a commit; leave `.scratch/rueckmeldung/**` untouched.

## Evaluation Log

- RED baseline: focused Tier1a suite 0/6; all six failures were caused by the absent definitions, commands, fixtures, and phase, with no syntax or setup error.
- Iteration 1: focused suite 6/6; full suite 80/85. Score 86/100 because five Tier0 tests still treated the global component list as exactly four or hard-coded Composer's minimum height as 44. Critique: migrate those assertions to the explicit `tier === 0` subset and keep the global nine-set gate in Tier1a.
- Iteration 2: focused Tier0/Tier1a suites 23/23; full build and suite 85/85. Score 100/100: contract fidelity 30/30, executable safety/recovery 25/25, strict evidence 25/25, renderer/UI integration 15/15, scope hygiene 5/5. AC-1 through AC-6 all pass; stop early because every hard gate and the 95-point threshold pass.
