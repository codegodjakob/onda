# Tier1a Post-Context Inventory Race Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: execute this plan inline with strict RED→GREEN TDD.

**Goal:** Prevent any component mutation when the recursive document inventory changes between initial preflight and the first component write.

**Architecture:** `executeGuardedComponentCommand` keeps the validated preflight inventory, obtains mutation context, requests a second fresh recursive inventory, validates it, compares a canonical structural snapshot, and passes only that revalidated current inventory into mutation. The runtime supplies the existing full recursive collector; the guard remains pure and executable in tests.

**Tech Stack:** JavaScript ES modules, Node test runner, Figma Plugin API, esbuild.

## Global Constraints

- The second collection occurs after `requireMutationContext` and immediately before mutation.
- Snapshot coverage includes target page, containers, sets, variants, roles, properties, samples, staging markers, ancestry, owners, and main-component links.
- Arrays are canonicalized deterministically; no plugin-data hash or self-asserted digest is trusted.
- An unchanged fresh empty inventory remains accepted.
- Any insertion, removal, replacement, reparenting, ownership, property, link, or staging change aborts before mutation.
- Existing async known-ID revalidation remains in `runComponent`.
- Only plugin files are changed; `.scratch/rueckmeldung/**` remains untouched.

## Acceptance Criteria

### AC-1: Unchanged inventory proceeds

**Given** initial and post-context recursive inventories have identical canonical structure, including the fresh empty case

**When** the guarded component command reaches the second pre-write gate

**Then** mutation receives the freshly collected inventory exactly once.

### AC-2: Inserted candidates abort

**Given** context acquisition inserts a duplicate set, duplicate documentation sample, staging component, or nested lookalike components container with a descendant

**When** the second recursive collection is validated and compared

**Then** the command rejects after context but before the mutation callback and the component-write log remains empty.

### AC-3: Recoverable structural drift still aborts

**Given** the current inventory is independently valid as a recoverable partial but differs by removed variant, Label property, or sample main-component link

**When** the canonical snapshots are compared

**Then** the command rejects before mutation instead of treating the race as recovery input.

### AC-4: Known-ID replacement remains blocked

**Given** both inventory snapshots match but an owned node is replaced before the existing async ID lookup

**When** mutation begins its ID revalidation

**Then** the command rejects before the first component write.

### AC-5: Non-functional safety

**Given** any guarded component command

**When** the post-context check runs

**Then** it uses complete collected fields, not a plugin-data/self-hash shortcut, and all existing ancestry, staging, phase, and idempotence tests remain green.

## Evaluation Rubric

- Structural snapshot completeness: 35 points.
- Executable race rejection with zero writes: 35 points.
- Ordering/current-inventory handoff: 20 points.
- Regression and scope hygiene: 10 points.
- Threshold: 95/100; all ACs are hard gates; maximum 3 iterations.

## Task 1: Prove the race window with RED tests

**Files:**
- Create: `test/component-inventory-race.test.mjs`

**Interfaces:**
- Consume `executeGuardedComponentCommand`, `validateComponentMutationInventory`, and real component fixtures.
- Exercise `collectCurrentInventory(context, componentId)` after `requireContext` and before `mutate`.

- [ ] Add unchanged, four insertion, recoverable-drift, and known-ID replacement scenarios.
- [ ] Run `node --test test/component-inventory-race.test.mjs`; expected result is feature failures because the second collector is not invoked.

## Task 2: Implement the minimum post-context gate

**Files:**
- Modify: `src/plan.mjs`
- Modify: `src/runtime.mjs`
- Modify: existing component guard tests only to provide an unchanged second inventory where execution legitimately reaches mutation.

**Interfaces:**
- Produce `canonicalComponentMutationSnapshot(inventory)` and a guard that validates and compares current structure.
- Runtime passes `collectCurrentInventory: () => collectComponentMutationInventory(componentId)`.

- [ ] Canonicalize every required field with deterministic array ordering.
- [ ] Validate current inventory, compare snapshots, reject mismatches, and pass current inventory to mutation.
- [ ] Keep the fresh empty and unchanged rerun paths equal.

## Task 3: Evaluate, verify, and commit

**Files:**
- Rebuild: `dist/code.js`
- Review: plugin-only diff.

**Interfaces:**
- Produce one isolated P1 commit with RED/GREEN and full verification evidence.

- [ ] Evaluate against the rubric for at most three iterations and log failures/refinements here.
- [ ] Run the focused suite, `npm run verify`, `git diff --check`, and plugin-only scope inspection.
- [ ] Commit only `tools/figma-onda-one-page/**`; leave `.scratch/rueckmeldung/**` untouched.

## Evaluation Log

- RED baseline: 0/8. The guard ignored the second collector, passed the preflight object to mutation, and allowed all insertion and Same-ID drift scenarios to reach the mutation callback.
- Iteration 1: race suite 8/8 and full suite 93/93. Rubric score 97/100; critique found that the canonical role record did not yet include the TEXT role's component-property reference, so a Same-ID role-property-link change was not observable even though role identity/ancestry was.
- Iteration 2 RED refinement: 7/8 after adding the missing role-property-link assertion; the snapshot remained equal when only `characterPropertyKey` changed.
- Iteration 2 GREEN: focused Race + Tier0 Iteration4 + Tier1a suites 19/19 after collecting and canonicalizing `characterPropertyKey`; full build and suite 93/93 with a 201.4 kB bundle. Final score 100/100: structural completeness 35/35, race rejection 35/35, ordering/current-inventory handoff 20/20, regression/scope hygiene 10/10. AC-1 through AC-5 all pass.
