# Onda — Redesign Ideas (Collection)

**Status: collecting only. Nothing here is decided, nothing is being built.**

This file gathers redesign ideas so we can argue about them before any code changes.
Jakob adds his points, I add mine, and we mark each one `open` / `agreed` / `rejected`.

Measurements below were taken from the running app (window 1280 px wide, example
document "Calm Technology") on 2026-07-31. Where I claim something is a problem,
the number that proves it is next to it.

---

## 1. Feedback must sit *beside* the text, not underneath it

**Jakob:** "das feedback am text soll neben dran sein und nicht unter der stelle so wie jetzt"

### What it does today

The hint renders as an `<aside>` spanning **1016 px** — the full content width —
directly below the paragraph it belongs to. It pushes the following text down and
breaks the reading column in half. The paragraph above it also gets a heavy filled
background, so the two together form a large block that dominates the page.

### What already exists but is switched off

The stylesheet still contains a complete **side-lane** design from an earlier
version: `#lane`, `.lane-inner`, `.anno-bubble` (absolutely positioned), and
`.lane-conn` — SVG connector lines drawn from the text to the bubble, with a
highlighted state. `#lane` is **not present in the DOM at all** anymore. So the
"beside" idea was built once, then dropped. Worth knowing: we are not inventing
this from zero, we are reviving and improving it.

### The obstacle nobody has solved yet

Current horizontal budget at a 1280 px window:

| Region | Width |
|---|---|
| Sidebar | 264 px |
| Gap | 168 px |
| Text column | 680 px |
| **Right margin — the only free space** | **168 px** |

168 px is too narrow for a readable note. Something has to give before "beside"
can work at all. Options:

**1a — Asymmetric text column.** Move the text column left, leaving ~320–360 px on
the right for notes. Text stays 680 px. Cost: the text is no longer optically
centred; the page gets a clear "left = text, right = margin" reading axis, like a
printed book with marginalia. Probably the most honest solution.

**1b — Narrower text column.** Keep centring, shrink the text to ~560 px, put notes
in the freed space on the right. Cost: 560 px is on the short side for German prose
(long compounds); more hyphenation trouble.

**1c — Overlay on hover/focus only.** The note appears floating to the right of the
line, over the empty area, only when the marked passage is hovered or focused.
Nothing is permanently visible. Cost: hidden feedback is easy to miss; bad for
keyboard and for "show me everything at once".

**1d — Collapsed marker + expand on the side.** A small dot or coloured underline in
the text is the *only* permanent sign. Clicking it opens the note in a fixed panel
on the right that always occupies the same place. Cost: one click before you see
anything; but the page never reflows, which is very calm.

**My leaning:** 1a as the base layout, plus 1d's behaviour for long notes — short
hints show inline in the margin, long ones open in the fixed right panel. Open for
discussion.

### Sub-questions to settle

- Should the connector line (text ↔ note) come back? It makes the link obvious but
  adds visual noise; the old CSS had it.
- What happens when two hints land on adjacent lines — stack them, or offset?
- Narrow window (< 1100 px): notes below again, or a slide-over panel?

---

## 2. The Struktur column is overwhelming

**Jakob:** "die struktur spalte ist noch zu overwhelming … dropdown bzw. bausteine anklicken und öffnen und dann mehr darüber erfahren"

### The real reason it feels heavy

I counted: the document has **8 top-level blocks** and the Struktur column renders
**7 cards** — essentially one card per paragraph. Each card repeats the first line
of that paragraph as an excerpt.

**So you read the whole document twice, once in the column and once in the editor.**
That is the actual problem. It is not merely dense — it is redundant. No amount of
tightening the spacing fixes a duplicate.

Card heights: 86 px each, plus a 39 px excerpt row. Seven of those do not fit on
screen, so the column also scrolls independently of the text.

### Options

**2a — Collapsed by default, one line per block.** Each block is a single row (~28 px):
a small type dot, the block's own heading or first 4–5 words, and a hint marker if
one exists. Click expands *that* row to show excerpt, type, hints, and actions.
Only one row open at a time. This is closest to what Jakob described.

**2b — Show sections, not paragraphs.** The column lists only headings ("Warum es
wichtig ist", "Was das fürs Schreiben heißt"); paragraphs appear nested only after
you open a section. A 3000-word essay then shows 6 rows instead of 60. Scales far
better than 2a on long texts.

**2c — Do not repeat the text at all.** The column shows *structure*, not content:
type, length, role in the argument, whether it carries a hint. No excerpt. The
excerpt is what makes it feel like a second copy of the document.

**2d — Make it a map, not a list.** A narrow vertical bar where each block is a
segment sized by its length, coloured by whether it has hints. Hovering shows a
tooltip; clicking jumps. Almost zero text. Radical, but genuinely calm.

**My leaning:** 2b + 2c together — headings as the top level, paragraphs nested,
and no excerpt text anywhere. 2a alone still leaves one row per paragraph, which on
a real essay is still 60 rows.

### Open question for Jakob

What do you actually *use* the column for — jumping around, or seeing where the
hints are, or checking the argument holds together? The right answer differs a lot
depending on that, and I do not want to guess.

---

## 3. Capital letters create typographic unrest

**Jakob:** "sachen wie die großbuchstaben erzeugen typographische unruhe und sind zu viel"

Confirmed and worse than it looks. **10 uppercase labels are visible at once** in a
264 px column:

- 3 × `.onda-eyebrow` — section headers: PROJEKTVERSTÄNDNIS, STRUKTUR, MATERIAL
- 7 × `.block-preview-role` — one per card: FREIER ABSATZ, ÜBERSCHRIFT, FREIER ABSATZ …

In the whole stylesheet there are **8 separate rules** applying
`text-transform: uppercase`, all with wide letter-spacing:
`.onda-eyebrow`, `.block-preview-role`, `.onda-pv-label`, `.source-form-label`,
`.source-reader-kicker`, `.memory-kicker`, `.argument-kicker`, `.language-kicker`,
plus `.bento-th`.

Two distinct problems, worth separating:

**3a — Too many caps.** Even done well, this many is unrest. Fix: pick *one* place
where caps earn their keep (probably nothing) and drop the rest.

**3b — "FREIER ABSATZ" says nothing.** Most blocks in any document are ordinary
paragraphs. Labelling each one "FREIER ABSATZ" is noise repeated seven times.
Fix: label only what is *not* the default — a heading, a quote, a list. A plain
paragraph gets no label.

### Replacement options for the section headers

- Same words, sentence case, normal letter-spacing, slightly dimmer colour
- Same words, sentence case, but smaller and set on the same line as the content
- Drop the words entirely; a hairline rule separates the sections
- Keep them but only show them when the section has content

**My leaning:** sentence case + hairline separators, and delete `block-preview-role`
for ordinary paragraphs entirely (3b). That alone removes 7 of the 10.

---

## 4. Things I noticed that Jakob has not named yet

Listed so he can veto or confirm. All are observations, not proposals.

**4a — Large empty gap after a hint.** Between the hint bar and the next heading
there is a conspicuous vertical hole. It looks like a rendering accident rather
than deliberate breathing room.

**4b — The marked paragraph is very heavy.** The active passage gets a filled
rounded background across the full column width. Combined with the hint bar
underneath, the "something is wrong here" signal is much louder than the hint
deserves. A thin left rule or a soft underline would say the same thing quietly.

**4c — The Aura floats unattached.** The circle sits in the top-right corner with
nothing around it, at the far edge of a large empty area. It reads as decoration
rather than as the agent's presence.

**4d — The library and home screens are not Onda.** They inherited the Onda colours
but not the layout language — different spacing scale, different card treatment,
different type rhythm from the writing view. Opening a document currently feels
like moving between two different apps.

**4f — Two new controls landed while this list was open; their visual form is not settled.**
Both were functional gaps in Etappe A, fixed on 31.07.2026, and both were styled to match
what already exists rather than to be right:

- A **"Modelle"** block in the KI settings dialog. Uses `.onda-eyebrow`, so it adds one more
  ALL-CAPS label to the pile in section 3 — deliberately consistent, deliberately temporary.
- The **"bindend"** tag in the understanding dialog is now a button that releases the lock.
  It looks identical to the silent tag; only the cursor and a faint hover reveal it is
  clickable. That is probably too quiet — a control nobody can see is a control nobody uses.
  Worth deciding: does an affordance belong here, and what does "you can undo this" look
  like in Onda's vocabulary?

**4e — The sidebar mixes three unrelated jobs.** Project understanding, document
structure, and material are stacked in one 264 px column with no visual hierarchy
between them, only the caps labels (which we are removing). Once the labels go,
they need something else to separate them.

---

## 5. The "general feeling" — questions I cannot answer for you

Jakob: *"generell gefällt mir vieles anders auch noch nicht, design technisch bis
zum generellen feeling der gesamten app."*

I would rather ask than guess. Each of these changes the design fundamentally:

1. **Should Onda feel like a tool or like a room?** A tool is dense, fast, everything
   reachable. A room is quiet, spacious, one thing at a time. Right now it is
   attempting both and landing in between.

2. **How present should the agent be?** Always visible and commenting, or silent
   until asked? This decides whether hints appear on their own or only on request.

3. **Dark as the only mode, or is light the real home?** Currently dark-only. Long
   writing sessions in daylight are usually more comfortable in light.

4. **Is there an app whose feel you want?** Not to copy — to name the target. iA
   Writer, Ulysses, Craft, Linear, Things all feel very different, and "calm" means
   something different in each.

5. **What annoys you *while writing*, as opposed to when looking at it?** Those are
   different complaints and the second is easier to fix than the first.

---

## Log

| # | Topic | From | Status |
|---|---|---|---|
| 1 | Feedback beside the text | Jakob | open |
| 2 | Struktur column overwhelming | Jakob | open |
| 3 | Capital letters | Jakob | open |
| 4a–4e | My observations | Claude | awaiting veto |
| 5 | General feeling | Jakob | questions open |

*Next: Jakob reads `docs/ONDA-SYSTEM.md` and adds his points. Nothing gets built
until this list is agreed.*
