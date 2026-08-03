# The abstract measured against what exists

**2026-08-03.** Jakob's abstract, checked line by line against the code — not against
the specs, and not against what the eval catalog claims.

The short version: **the built system is a corrector. The abstract describes a
thinking partner.** Those are not the same product, and the difference is not a
matter of polish.

---

## 1. Every hint type is corrective. None is generative.

`SYSTEM_COACH` opens with: *"Du hilfst der Autorin oder dem Autor, den eigenen Text
besser zu machen."* Improve the text. All eight hint types follow from that:

| # | Type | What it says |
|---|---|---|
| 1 | fakt | a claim might be wrong |
| 2 | quelle | a claim needs a source |
| 3 | methode | you conclude more than the data carries |
| 4 | logik | there is a break or an unanswered objection |
| 5 | struktur | the arrangement does not carry the thought |
| 6 | wirkung | it will not land with the audience |
| 7 | erklaerung | a term is not introduced well enough |
| 8 | sprache | wording does not fit intent and audience |

Eight ways of saying *something here is not right yet*. Not one of them can say:

- here is a thought you are missing
- here is a connection between two of your paragraphs you have not drawn
- here is the neighbouring field this argument sits in
- here is *why* this pattern works, so you can use it again on your own

The abstract asks for exactly those. It asks the system to expand the writer's
*Erkenntnishorizont* — to reveal the mechanism behind each piece of feedback so the
writer keeps it, to open content areas they missed, to provoke cross-pollination.

**A ninth, tenth, eleventh hint type is not the answer either.** Generative remarks
are not defects, and forcing them into a defect pipeline (anchor, observation,
relevance, consequence, root-cause flag) would make them feel like accusations. This
is a second channel, not a longer list.

## 2. The system does not know what kind of text it is looking at

`genre` appears in exactly one place: `effect-fairness.mjs`, where it decides whether
the fairness check for persuasive texts applies. That is the entire genre awareness.

The abstract names the full range — essays, academic papers, copywriting and
marketing, poster and website copy, prose. These have almost nothing in common in
craft terms. A hint that improves an academic paragraph ("this needs a source") is
noise on a headline. A hint that improves a headline ("cut it in half, lead with the
verb") is wrong in a dissertation.

Worse: four of the eight types (fakt, quelle, methode, logik) are hard-wired as
**integrity** questions that cannot be dismissed. That is right for a paper. On a
piece of prose it makes the tool unusable — a novelist cannot source a metaphor.

## 3. Nothing tracks the writer, and nothing improves itself

Searched for: strengths, weaknesses, learning curve, self-improvement, over-time.
**Zero hits.** There is a project memory (`memory-*.mjs`), but it remembers the
*project* — task, audience, decisions. Nothing remembers the *person*: what they keep
getting wrong, what they have mastered, which advice landed and which was ignored.

The abstract asks for both: remember strengths and weaknesses over a long period, and
have the system check and improve *itself*, its feedback, and its whole manner of
interaction. Nothing in the code does the second thing at all.

## 4. Nothing guards against the most likely answer

The abstract is explicit: the system knows it is an AI and takes care not to only make
the remarks and spark the ideas that are *most probable*. Searched the prompts — the
only near-hit is "ein naheliegendes Gegenargument", which is about the text's
argument, not about the agent's own output.

This is the hardest requirement in the abstract and the one with no foothold today. It
is also, arguably, the one that decides whether Onda is worth using: an assistant that
returns the median thought makes the writer more average, not less.

## 5. What the abstract confirms

Not everything is a gap. These are already true and should be protected:

- **Never rewrites the text.** Inviolable rule, enforced, measured (INV-01).
- **Never invents a source.** Enforced, measured (INV-03).
- **Author decisions bind.** Enforced (WORK-03), and the protection can now be released.
- **Never takes the wheel.** The decision always sits with the author.
- **Calm Technology.** Named in the abstract, present as an intent — though the current
  interface does not deliver it (see `docs/REDESIGN-IDEEN.md`).

## 6. What this does to the eval catalog

The catalog measures 83 evals. Against this abstract it is **missing a whole
dimension**: everything about growth. There is no eval that asks whether the writer
knows more than before, whether a connection was opened, whether the advice taught a
transferable pattern, whether the system avoided the obvious.

Suites that would need to exist:

- **GROW** — does the writer end the session understanding more than the text required?
- **GENRE** — is the guidance right for *this* kind of text, and are integrity rules
  applied only where they belong?
- **SELF** — does the system track the person, and does its own behaviour improve?
- **DIVERGE** — does it offer the non-obvious, and can that be told from the obvious?

These are hard to measure and easy to fake. That is exactly why they need evals rather
than good intentions.

## 7. One sentence I could not read

> *"Dies gilt nicht acuh für das Inhaltliche."*

From the sentences around it I take this to mean *this applies to content as well*
(everything before it is about language and style; everything after is about content).
But as written it says the opposite. It is load-bearing — it decides whether the
learning loop covers content or only craft — so I would rather ask than assume.

---

## Where this leaves the work

Three things were blocking. This abstract unblocks the largest of them and sharpens
the other two:

1. **The design questions** in `docs/REDESIGN-IDEEN.md` now have a criterion:
   *Wuwei, flow, effortless — but proactively supported, not by staying out of the
   way.* That resolves the tension in §5 of that document: Onda is a room, not a tool,
   and the agent is present in it.
2. **The redesign decisions** are still Jakob's to make.
3. **The gap above is a bigger piece of work than the redesign** and should not be
   smuggled in alongside it.
