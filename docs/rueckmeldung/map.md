# Wie Onda Rückmeldung gibt

Type: wayfinder:map

## Destination

A specification of **how Onda gives feedback**: the new generative channel
(*Erweiterungen* — weiterführung · feld · verbindung) together with a re-timed
rhythm for **all** feedback kinds, and a working guard against the obvious.

Reaching the end means: someone can build it without asking another design question.

## Notes

**Domain.** German-language writing tool, local-first, Vanilla JS + Tiptap, Mac shell
in Swift. The user is non-technical — every ticket is discussed in plain German, and
jargon has to earn its place.

**Skills to consult.** `superpowers:brainstorming` before creative work,
`grilling` + `domain-modeling` for decision tickets, `prototype` for prototype tickets,
`research` for research tickets, `agentic-eval` where a criterion has to be measurable.

**Standing preferences for this effort.**
- Never resolve a ticket by inventing the user's taste. A ticket that needs his
  judgement stays open until he gives it.
- Prototypes are made to be reacted to, not to be right. Rough beats polished.
- Every claim about the current system gets checked against the code, not the specs —
  the specs have been wrong before (see `docs/VISION-GEGEN-GEBAUTES.md`).

**Material that already exists and must not be re-invented.**
- `docs/VISION-GEGEN-GEBAUTES.md` — the abstract measured against the code
- `~/Downloads/Onda Design System` — 176 files: components, tokens, Diatype fonts,
  a clickable UI kit, and a complete annotation taxonomy (Correction · Rewrite ·
  Insertion · Slot · Region · compare · Struktur-Karte). The user calls it *a
  beginning, not mature* — treat it as material, not law.
- `app/evals/v2-fertigzustand.json` — 83 evals; the DESIGN suite is at 0/6.

## Decisions so far

<!-- one line per closed ticket, linking to the ticket that holds the detail -->

*(none yet — the map was just charted)*

Decisions taken while charting, which the tickets build on:

- **Three kinds of Erweiterung** — `weiterführung` (the thought carries further than
  you took it) · `feld` (a part of the topic or a neighbouring field you have not
  entered) · `verbindung` (two places belong together, or your thought meets a
  foreign one)
- **"Name the pattern, not just the instance" is a rule for every piece of feedback**,
  not a kind of its own — it is what makes feedback transferable
- **Anchoring follows the kind** — one place, two places, or none. Never invent an
  anchor to satisfy a uniform shape
- **Erweiterungen are not counted** — no entry in the balance line, because a number
  next to "Fehler" turns a gift into homework
- **The rhythm follows the kind of feedback, not the channel**
- **Three moments**: sofort · beim Innehalten · beim Aufschauen
- **Every moment can also be pulled by hand** — proactive must not mean having to wait

## Not yet specified

- **Where Erweiterungen sit in the redesigned surface.** Hangs on the redesign, which
  the user has not decided. Sharpens once `docs/REDESIGN-IDEEN.md` has agreed points.
- **Whether the design system's annotation components can be adopted directly**, or
  whether the built app needs to meet them halfway. Depends on how far the built
  markup has drifted — unknown until someone reads both.
- **How Erweiterungen relate to the existing annotation forms** (Correction, Rewrite,
  Insertion, Slot, Region, compare, Struktur-Karte). The design system's taxonomy is
  built around *the text needing something*; an Erweiterung is about *the writer
  gaining something*. Whether that is the same shelf is not yet answerable.
- **What happens when the writer disagrees with an Erweiterung.** Corrections have
  Verwerfen mit Konsequenz (nur diesmal · nicht mehr in diesem Text · nie). Whether
  that vocabulary fits something that was never a demand is unclear.

## Out of scope

Ruled beyond this destination. Returns only as its own effort.

- **Textarten-Kenntnis** — genre-aware craft guidance, and applying integrity rules
  only where they belong (four hint types are hard-wired as non-dismissible, which is
  right for a paper and unusable for prose). Large, and independent of this map.
- **Gedächtnis für die Person** — remembering the writer's strengths and weaknesses
  over time.
- **Dass Onda den Maßstab selbst nachschärft** — a system that watches itself and
  adjusts. This map decides *the* criterion and records which traces must be kept so a
  later effort can learn from them; it does not build the learning.
