# Evaluation: Lesson 0001 — Professional Task Contract

## Stable success criteria

1. Mission alignment: the lesson teaches project-independent professional Codex use.
2. Single skill: the learner can turn a vague request into a verifiable task contract.
3. Trust: factual guidance is grounded in current official OpenAI Codex sources.
4. Practice: the learner must produce an answer and receives immediate actionable feedback.
5. Reuse: shared styling and interaction live in `assets/`; the lesson links to a compressed reference.
6. Usability: semantic HTML, keyboard focus, mobile layout, print layout, and working local links.
7. Teaching fit: one short lesson, clear win, primary-source recommendation, and invitation for follow-up.

## Rubric and gate

- Mission alignment: 15 points
- Accuracy and source quality: 20 points
- Scope and cognitive load: 15 points
- Practice and feedback quality: 20 points
- Clarity and visual usability: 15 points
- Accessibility and technical integrity: 15 points

Threshold: 90/100. Hard gates: criteria 1–4 and zero broken local asset links. Maximum iterations: 3. Stop early if the score does not improve.

## Iteration log

### Iteration 1 — 91/100

- Mission alignment: 15/15
- Accuracy and source quality: 20/20
- Scope and cognitive load: 14/15
- Practice and feedback quality: 16/20
- Clarity and visual usability: 14/15
- Accessibility and technical integrity: 12/15

Hard gates passed in the initial automated check: all local assets existed, the lesson stayed on one skill, official sources were cited, and interactive practice was present.

Critique: The form checker inferred readiness mostly from length and keywords, so its success message overstated what it could prove. The lesson also needed an explicit retrieval step for storage strength, and the roadmap rendered one Markdown code span literally.

Refinement: Reframed the automated result as a structural check, disclosed its limits next to the exercise, added a 60-second retrieval check, replaced literal Markdown with semantic HTML, and clarified how the roadmap should be used.

### Iteration 2

Final score: 98/100.

- Mission alignment: 15/15
- Accuracy and source quality: 20/20
- Scope and cognitive load: 15/15
- Practice and feedback quality: 19/20
- Clarity and visual usability: 15/15
- Accessibility and technical integrity: 14/15

All hard gates pass. Evidence:

- The refreshed Codex manual identified the current official Best practices, Prompting, Projects, Worktrees, AGENTS.md, Sandbox, Subagents, and Code review sources used in `RESOURCES.md`.
- A Node-based integrity check found zero missing local links or anchors, zero duplicate IDs, and confirmed language, viewport, and main landmarks in all three HTML documents.
- `node --check assets/task-contract.js` exited successfully.
- A real headless Chrome session filled all four exercise fields, activated the checker, and observed the expected structural-pass feedback.
- Headless Chrome rendered desktop (1440 × 1000) and compact (500 × 844) screenshots; visual inspection found readable hierarchy, intact wrapping, usable spacing, and no clipping at the tested widths.

Residual limitation: this was not a complete WCAG or screen-reader audit, and the structural exercise checker intentionally does not judge domain correctness. The lesson tells the learner to submit the result for teacher feedback.
