# Task 5 Report: Der Kontextbau

## Departure from Brief

None. Implementation follows the brief exactly.

## What I Implemented

Created `app/src/bausteinarten-kontext.mjs` — a pure context-builder module that translates raw bausteinarten data into the contract that `baueAnfrage` actually consumes: `{ verstaendnis, docText, volatiles }`.

The module exports `baueBausteinKontext({ verstaendnis, docText, blocks, bestand, offene })` and:

1. **Always includes the instruction first**: `BAUSTEINARTEN_ANWEISUNG` as the first volatile block.
2. **Optionally includes bisheriger Stand**: If `bestand` has non-empty `arten`, formats it as a "Bisher erkannt" block listing the textsorte and existing names to prevent drift between runs. Fail-closed: no block if bestand is empty or missing.
3. **Builds paragraph directory**: `absatzVerzeichnis()` filters blocks to only those that are nameable (have an id, are not headings, have non-whitespace text), slices their text to 120 characters for the snippet, and packages as JSON. Only includes paragraphs in the `offene` set if `offene` is a non-empty array; if `offene` is null or not provided, includes all nameable paragraphs (first-run case). Fail-closed: no block if no paragraphs qualify.

## What I Tested

**TDD sequence:**

1. **RED**: Ran `node --test test/bausteinarten-kontext.test.mjs` with only the test file (module not yet written). Failed with `ERR_MODULE_NOT_FOUND` as expected.

2. **GREEN**: Implemented the module exactly as specified in the brief. Ran the same command and got 7 passing tests:
   - Instruction at position 0
   - Paragraph directory includes only nameable paragraphs (filtered headings, empty text)
   - Bestand block formatted correctly when present
   - No bestand block when bestand is missing
   - Directory respects `offene` filter when provided
   - Directory includes all nameable paragraphs when `offene` is null
   - `baueAnfrage` accepts the context and preserves both instruction and document text

3. **Full suite**: `npm run test:unit` → **919 tests pass** (baseline 912 + 7 new = 919, zero failures).

## TDD Evidence

**RED command and output:**
```bash
cd app && node --test test/bausteinarten-kontext.test.mjs
```
Expected failure: `ERR_MODULE_NOT_FOUND` for `bausteinarten-kontext.mjs`. ✓

**GREEN command and output:**
```bash
cd app && node --test test/bausteinarten-kontext.test.mjs
```
```
TAP version 13
...
1..7
# tests 7
# suites 0
# pass 7
# fail 0
```
All 7 tests pass. ✓

**Full suite verification:**
```bash
cd app && npm run test:unit
```
Result: 919 tests pass, 0 fail. No regressions. ✓

## Files Changed

- **Created**: `app/src/bausteinarten-kontext.mjs` (57 lines)
- **Created**: `app/test/bausteinarten-kontext.test.mjs` (82 lines)

## Self-Review Findings

1. **YAGNI**: ✓ Implemented exactly what the brief specified, nothing more.
2. **Last test proves the module's reason for existing**: ✓ Test 7 verifies `baueAnfrage` accepts the context without silently dropping the instruction or document.
3. **Test output pristine**: ✓ No warnings or stray output.
4. **German comments and identifiers**: ✓ All German comments present and match the brief. Identifiers: `baueBausteinKontext`, `absatzVerzeichnis`, `bisherigerStand`, `benennbar`, `ANRISS_ZEICHEN` — all match brief exactly.
5. **No unused variables**: ✓ All function parameters and local variables are used.

## Concerns

None. The module is pattern-correct (matches hinweis-kontext.mjs structure), handles both the first-run case (offene=null, all paragraphs listed) and the incremental case (offene=array, only those paragraphs), and the integration test proves baueAnfrage consumes it correctly.

## Commit

```
ae5b56d feat(bausteine): der Kontext trifft den baueAnfrage-Vertrag
```

---

## Code Review Fixes

### Finding 1 (Important): Duplicate `benennbar` function

**Issue:** `benennbar` existed identically in both `bausteinarten-kontext.mjs` (lines 8–12) and `bausteinlauf-model.mjs` (lines 15–19). A second copy invites drift: if `pruefeBausteinBedarf` and `absatzVerzeichnis` disagree on what counts as "nameable", paragraphs shown to the model diverge from those the answer processor accepts, leading to silent data loss or stuck-open assignments.

**Fix:** 
- Exported `benennbar` from `app/src/bausteinlauf-model.mjs` with an explanatory comment (4 lines added to source).
- Imported `benennbar` in `app/src/bausteinarten-kontext.mjs` and deleted the local definition (3 imports, local function removed).
- All call sites now reference the single source of truth.

### Finding 2 (Minor): Stale line citation

**Issue:** Comment at line 16 cited `agent-tasks.mjs:196`, but Task 4 inserted `BAUSTEINARTEN_SCHEMA` above `baueAnfrage`, shifting all line numbers. The brief's Vorbild (`hinweis-kontext.mjs:22`) cites this concept WITHOUT a line number for exactly this reason.

**Fix:** Changed citation from `(Cache-Präfix-Stabilität, agent-tasks.mjs:196)` to `(Cache-Präfix-Stabilität; siehe agent-tasks.mjs)`, eliminating the moving target.

### Finding 3 (Minor): No test for snippet truncation

**Issue:** `ANRISS_ZEICHEN = 120` limits snippets to prevent the full document text from appearing in the paragraph index twice. All test paragraphs were under 120 characters, so a regression that removed `.slice(0, ANRISS_ZEICHEN)` would pass all tests undetected.

**Fix:**
- Exported `ANRISS_ZEICHEN` from `bausteinarten-kontext.mjs` so the test can import it.
- Added test: "ein langer Absatz wird auf ANRISS_ZEICHEN Zeichen gekuerzt" — creates a 200-character paragraph, verifies the anriss is exactly 120 characters, no longer.

### Verification Commands

**Both test files, all passing:**
```bash
cd app && node --test test/bausteinarten-kontext.test.mjs test/bausteinlauf-model.test.mjs
```

**Result:**
```
TAP version 13
...
1..42
# tests 42
# suites 0
# pass 42
# fail 0
```

All 8 new/updated tests from bausteinarten-kontext + all 34 existing tests from bausteinlauf-model pass without alteration.

**Full unit suite:**
```bash
cd app && npm run test:unit
```

**Result:**
```
1..920
# tests 920
# suites 0
# pass 920
# fail 0
# duration_ms 5168.833083
```

920 tests pass (919 prior + 1 new snippet-limit test = 920). Zero regressions.

### Commits

- `43257af` fix(bausteinarten-kontext): benennbar nicht duplizieren, Snippet-Limit testen

### Summary

All three findings addressed:
1. Single source of truth for `benennbar` across three call sites.
2. Citation no longer points to a moving line number.
3. Snippet truncation now covered by an explicit test that would catch any removal of the `.slice()` call.
