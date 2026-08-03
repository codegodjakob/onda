# Plan: Measure the finished state, then close it

**Created 2026-08-03. Status: in progress.**

## What already exists (do not rebuild)

`app/evals/v2-fertigzustand.json` — catalog version `2026-07-30.1`, target
*"AI Writing Tool V2 — vollständiger Fertigzustand A–D"*:

| | |
|---|---|
| Suites | 10 (INV, WORK, EVID, RESEARCH, MEMORY, ARG, LANG, EFFECT, AUDIT, SYSTEM) |
| Evals | 77 — 69 hard gates, 8 scored |
| Measurable without an API key | 71 |
| Need a live AI connection | 6 (INV-06, RESEARCH-02, RESEARCH-03, EFFECT-06, SYSTEM-03, SYSTEM-09) |
| Rubric | truth .25 · authorship .20 · usefulness .15 · calm .15 · reliability .15 · access_privacy .10 |
| Thresholds | all applicable hard gates pass · weighted ≥ 4.5 · every dimension ≥ 4.0 |
| Iteration policy | max 5 per stage · stop after 2 non-improving rounds |

Each eval is Given/When/Then with a declared `automation` kind and required
`evidence`. This is a well-formed catalog. It is not the problem.

## The two real gaps

**Gap 1 — nobody has ever measured the whole thing.**
`node evals/run-v2-evals.mjs` reports `result: null`. Per-stage quality runs
exist for B1, B2, C1, C2, D1, D2 — six of ten suites, each measured in
isolation on the day it was built. There is no single number for "where does
Onda stand against its own definition of done", and no way to see whether
closing one thing broke another.

**Gap 2 — the catalog describes function, not form.**
Only 8 of 77 evals mention anything design-adjacent, and all 8 are about
accessibility or data control (keyboard focus, WCAG 2.1 AA, export/delete).
Not one covers what Jakob actually objected to on 2026-07-31:

- feedback rendered *below* the passage instead of beside it
- a Struktur column that duplicates the document paragraph by paragraph
- ten simultaneous ALL-CAPS labels in a 264 px column
- library and home screens that never received the Onda layout language

The catalog predates that feedback. A system can pass all 77 evals and still
be the thing he does not want to use.

## Phases

### Phase 1 — Baseline (no decisions required)

Build a runner that evaluates every measurable eval against the current build
and writes one result file the catalog validator accepts. Produce a chart of
suite-level standing. This is the missing number.

Deliverables: `app/evals/run-fertigzustand.mjs`, `results/fertigzustand-latest.json`,
a rendered chart. Exit criterion: `run-v2-evals.mjs --result …` validates and
reports per-suite pass/fail for all 71 non-live evals.

### Phase 2 — Close functional gaps

Iterate on whatever Phase 1 reports as failing, honouring the catalog's own
policy: max 5 iterations per suite, stop after 2 rounds without improvement,
every hard gate must pass. Re-measure after each round and keep the chart
current so regressions are visible immediately.

### Phase 3 — The design suite

Add a `DESIGN` suite built from Jakob's own stated requirements, not from
invented preferences. An eval states *what must be true*, never *how* — so his
four complaints can be written as gates today, while the redesign decisions
they will be satisfied by stay open.

This suite is expected to FAIL at first. That is its purpose: it makes the
design gap a measured quantity instead of an opinion.

### Phase 4 — Live gates (blocked)

Six evals need a real AI connection. Jakob has not entered a key yet
(`security find-generic-password -s Onda` finds nothing). Nothing here can
proceed until he does; the other 71 do not depend on it.

## Honest limits

- **Scored evals need judgement, not assertions.** Eight evals (EVID-04,
  RESEARCH-05, ARG-04, ARG-07, EFFECT-01/02/03/06) ask whether reasoning is
  *good*, not whether a value equals another value. They are scored 1–5 against
  the rubric, and a score is an argued position with evidence attached — not a
  green tick. Where a score is claimed, the evidence must be in the result file.
- **RESEARCH-02 and RESEARCH-03 cannot pass at all right now**, live key or
  not: no research provider is connected, so the machinery has nothing to call.
- **EFFECT-06 is a user study.** It cannot be automated by anyone. It stays
  open until real readers are asked.
- A passing catalog is evidence, not proof. It says the system does what it
  was specified to do — not that the specification was right.
