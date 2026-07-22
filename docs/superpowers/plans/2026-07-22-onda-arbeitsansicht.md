# Onda Arbeitsansicht — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing V2 writing view (`#editorView`) to the Onda design language — a persistent, collapsible left sidebar, the Aura orb, gutter hint-cards, re-skinned agent/evidence panels, and full light/dark + accent theming — without rewriting the working interaction logic.

**Architecture:** Approach A (re-skin in place + rebuild the shell frame). The app is vanilla JS + Tiptap (no framework), built imperatively in `ui.js` (home/chrome) and `workspace.js` (the whole workspace), bundled by esbuild (`src/editor.js` → `dist/editor.bundle.js`). The Onda tokens become the single styling source in `style.css`; the frame DOM is rebuilt in `index.html` + `workspace.js`; a few recurring pieces (Aura orb, button, icon-button, badge, tag) are added as reusable CSS primitives. All findings/hints, agent chat, evidence, insert menu, and persistence keep their existing ids/classes and logic.

**Tech Stack:** HTML/CSS/vanilla ES modules, Tiptap 2.x (ProseMirror), esbuild, `node --test` unit suites, a Playwright browser smoke harness (`test/v2-smoke.mjs`, run manually), self-hosted Hanken Grotesk + JetBrains Mono (woff2).

## Global Constraints

*Every task's requirements implicitly include this section. Values are exact.*

- **Scope:** writing view only (`#editorView`). The library/home (`#home`) is out of scope and only inherits the new tokens. Do not touch dead V1 code (`panels.js`, `structure.js`); the smoke's `assertReachableSurfaceIsV2Only` forbidden-regex must keep passing.
- **Fonts:** self-hosted woff2 in `app/fonts/` — Hanken Grotesk (400,500,600,700,800) + JetBrains Mono (400,500). No external/CDN font requests. Document body text = `var(--font-sans)` at `16.5px`/`1.7`. Keep the existing Diatype/Literata `@font-face` (still used by the un-migrated home).
- **Theme:** `[data-theme="dark"]` (existing light/dark keeps working). Accent default `sky` = **no** `data-accent` attribute; variants `sage|blue|clay|lavender|sand` via `data-accent` on the root. `applySettings()` sets both and must STOP overriding `--doc-font`/`--doc-size` to Literata/18px.
- **Settings:** additive, tolerant load, **no SCHEMA bump** — `settings.accent` (string, default `'sky'`), `settings.sidebarCollapsed` (boolean, default `false`). Added to `DEFAULTS` in `editor.js`.
- **Sidebar:** open by default; collapse state persisted in `settings.sidebarCollapsed`.
- **Keep these ids/classes** (interaction logic depends on them): `#agentWidget`, `#evidenceWindow`, `#localAgentLayer`, `#blockInsertLayer`, `#blockInsertTrigger`, `#editor`, `#title`, `#page`, `#scroll`, `#agentLiveStatus`, `.block-preview`(+`-excerpt`/`-role`), `.local-finding*`, `.agent-widget*`, `.evidence-*`, `.semantic-insert-*`, `.is-active-block`, `.has-local-finding`.
- **Reusable primitive classes** (defined in Phase D): `.onda-aura` (`--xs`/`--sm`/`--lg`, `.is-quiet`/`.is-thinking`/`.has-unseen`), `.onda-btn` (`--ghost`/`--danger`/`--sm`), `.onda-icon-btn`, `.onda-badge` (`--success`/`--warning`), `.onda-tag`.
- **Onda voice (UI copy):** German, sentence case, no emoji. Eyebrow labels ALL-CAPS 11px `--tracking-wider`. Technical values (counts, shortcuts, citation labels) in `--font-mono`.
- **Motion:** `--ease-out` is the default; `--ease-spring` is used ONLY on `.onda-aura`; durations use `--dur-*`. `prefers-reduced-motion` zeroes non-essential motion.
- **Testing:** `npm test` runs the three unit suites only (`example-seed.test.mjs`, `reasoning-model.test.mjs`, `workspace-model.test.mjs`) — keep them green throughout. The Playwright browser smoke (`test/v2-smoke.mjs`) is rewritten once in **Task F-4** (after the full frame + sidebar content exist) and run manually: `npm run build` → serve app root at `http://127.0.0.1:4173` → `node test/v2-smoke.mjs` → expect final line `V2 smoke passed`. If Playwright is unavailable, the per-task browser-preview checks are the acceptance evidence.
- **Commits:** one commit per task (messages in the drafts are German — fine).

## Execution Order & Dependency Map

Execute phases top-to-bottom in this order (task IDs keep their area letter as a stable cross-reference; the order below is the build order, which is **not** alphabetical):

1. **Phase A — Foundation** (`A-1..A-4`): Onda tokens, self-hosted fonts, `--v2-*` remap, settings model + `applySettings`. No dependencies.
2. **Phase B — Frame skeleton** (`B-1..B-3`): `index.html` `#editorView` rebuild, `workspace.js` element-ref/handler rewire + sidebar collapse, frame layout CSS. Consumes A (tokens, `settings.sidebarCollapsed`). Produces the sidebar/topbar anchor ids for D/C. *(The old `B-4` smoke task is merged into `F-4`; Phase B is verified via browser preview in `B-3`.)*
3. **Phase D — Aura & primitives** (`D-1..D-3`): `.onda-aura` visuals, control primitives CSS, orb state wiring. Consumes A (tokens) + B (`#ondaAura`). Produces primitives for C/E. D reuses `onAgentPresence` as the click body verbatim (B already wired the click); D only adds visual state + the unseen-initiative dot.
4. **Phase C — Sidebar content** (`C-1..C-5`): Struktur nav (supersedes the old shelf), Projektverständnis card + modal, Material entry + footer controls, sidebar CSS. Consumes B (anchor ids), A (`applySettings`), D (primitives). C wires `#themeToggle`/`#accentToggle` (via `applySettings` from A) and migrates the remaining `ui.shelf` reads to `ui.structureNav`.
5. **Phase E — Reskin existing surfaces** (`E-1..E-5`): reading column/title/blocks, local hint gutter cards + inline highlights, agent widget, evidence window, insert overlay. Consumes A (tokens) + D (primitives).
6. **Phase F — Motion, a11y, responsive, tests** (`F-1..F-5`): entrance motion + reduced-motion, focus states + focus-trap/steal guards, responsive off-canvas drawer + print, the single Playwright smoke rewrite (`F-4`, includes the desktop collapse-persistence assertion originally drafted as `B-4 Step 3`), and final verification against the acceptance criteria.

---

## Phase A — Foundation (tokens, fonts, settings)

### Task A-1: Embed the full Onda token set (base `:root` + dark + 5 accent-variant blocks)

**Files:**
- Modify `app/src/style.css` lines 12–38 (current `:root` block) and lines 51–69 (current `[data-theme="dark"]` block) — replace both wholesale; append 5 `[data-accent]` variant blocks after the dark block.
- Modify `app/src/style.css` line 485 (`#editor .ProseMirror` line-height).

**Interfaces:**
- Consumes: font-family names `"Hanken Grotesk"` / `"JetBrains Mono"` (faces provided by A-2; falls back to `system-ui` until then).
- Produces (every other area relies on these verbatim): `--paper --surface --surface-2 --surface-inset`, ink ramp, `--line-soft/--line/--line-strong`, `--accent --accent-hover --accent-active --accent-tint --accent-tint-hover --on-accent --focus-ring`, `--gradient-aura --shadow-glow`, status `--success(-tint)/--warning(-tint)/--danger(-tint)/--info(-tint)`, aliases `--bg-app --bg-surface --bg-hover --bg-active --text-primary --text-secondary --text-tertiary --text-link --border-subtle --border-default --border-strong`, type `--font-sans --font-mono --fw-* --tracking-* --text-*`, space `--space-* --sidebar-width --topbar-height --container-reading`, radius `--radius-control/card/overlay/panel/pill/full`, elevation `--shadow-xs/sm/md/lg/xl/focus`, motion `--ease-out --ease-spring --dur-fast/quick/normal/slow`, and the `[data-accent="sage|blue|clay|lavender|sand"]` accent switch. Also repoints legacy `--doc-font/--doc-size/--sans/--dur/--ease/--r/--shadow/--accent/--accentbg/--ok/--warn` (bridge for the 300+ existing rules).

- [ ] Step 1: Replace the current `:root { … }` (lines 12–38) with the complete Onda base layer below. It defines Onda names AND repoints every legacy scalar name onto Onda in the same block, so nothing breaks and deliverable (3)'s `:root`-local remaps (`--accentbg→--accent-tint`, `--ok→--success`, `--warn→--warning`, old `--accent #3a6ea5` → Sky) are satisfied here:

```css
:root {
  color-scheme: light;

  /* Onda — Papier → Tinte */
  --paper: #f7f6f3; --surface: #ffffff; --surface-2: #f2f0eb; --surface-inset: #efece6;
  --ink-950: #1c1a17; --ink-900: #2a2823; --ink-800: #3a372f; --ink-700: #4a463d;
  --ink-600: #57524b; --ink-500: #6b655c; --ink-400: #847d72; --ink-300: #948d82;
  --ink-200: #b8b1a6; --ink-100: #d8d2c8; --ink-50: #efece6;
  --line-soft: rgba(28,26,23,0.07); --line: rgba(28,26,23,0.12); --line-strong: rgba(28,26,23,0.2);

  /* Akzent — Sky (Standard) */
  --accent: #79b4dc; --accent-hover: #64a4d0; --accent-active: #5093c2;
  --accent-tint: #e3f1fa; --accent-tint-hover: #cfe7f6; --on-accent: #0f1a22;
  --focus-ring: rgba(121,180,220,0.4);

  /* Aura */
  --gradient-aura: linear-gradient(115deg,#e6f3fb 0%,#aed7f0 34%,#7fb8de 62%,#9cc9c4 100%);
  --shadow-glow: 0 0 0 1px rgba(142,195,230,0.35),0 4px 24px rgba(127,184,222,0.35);

  /* Status */
  --success: #4f8a5b; --success-tint: #dcebdd; --warning: #c2872e; --warning-tint: #f2e6cd;
  --danger: #bf443a; --danger-tint: #f3d9d5; --info: #3f6f9e; --info-tint: #d8e3ee;

  /* Alias-Ebene */
  --bg-app: var(--paper); --bg-surface: var(--surface);
  --bg-hover: rgba(28,26,23,0.04); --bg-active: rgba(28,26,23,0.07);
  --text-primary: #1c1a17; --text-secondary: #57524b; --text-tertiary: #948d82; --text-link: #3f7ba8;
  --border-subtle: var(--line-soft); --border-default: var(--line); --border-strong: var(--line-strong);

  /* Typografie */
  --font-sans: "Hanken Grotesk", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --fw-regular: 400; --fw-medium: 500; --fw-semibold: 600; --fw-bold: 700; --fw-heavy: 800;
  --tracking-tight: -0.015em; --tracking-wide: 0.02em; --tracking-wider: 0.08em;
  --text-xs: 12px; --text-sm: 13px; --text-base: 15px; --text-md: 16px;

  /* Raum */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 20px;
  --space-6: 24px; --space-7: 28px; --space-8: 32px; --space-9: 40px; --space-10: 48px;
  --space-11: 64px; --space-12: 96px;
  --sidebar-width: 264px; --topbar-height: 56px; --container-reading: 680px;

  /* Radius */
  --radius-control: 6px; --radius-card: 8px; --radius-overlay: 10px;
  --radius-panel: 18px; --radius-pill: 999px; --radius-full: 999px;

  /* Elevation */
  --shadow-xs: 0 1px 2px rgba(28,26,23,0.05);
  --shadow-sm: 0 1px 2px rgba(28,26,23,0.05),0 2px 6px rgba(28,26,23,0.06);
  --shadow-md: 0 2px 4px rgba(28,26,23,0.06),0 8px 20px rgba(28,26,23,0.08);
  --shadow-lg: 0 4px 8px rgba(28,26,23,0.07),0 16px 36px rgba(28,26,23,0.12);
  --shadow-xl: 0 8px 16px rgba(28,26,23,0.08),0 28px 56px rgba(28,26,23,0.14);
  --shadow-focus: 0 0 0 3px var(--focus-ring);

  /* Motion */
  --ease-out: cubic-bezier(0.16,1,0.3,1); --ease-spring: cubic-bezier(0.34,1.4,0.64,1);
  --dur-fast: 120ms; --dur-quick: 180ms; --dur-normal: 240ms; --dur-slow: 360ms;

  /* Legacy-Bruecke — bestehende Regeln erben Onda sofort */
  --bg: var(--surface); --bg2: var(--paper); --bg3: var(--surface-2);
  --txt: var(--text-primary); --txt2: var(--text-secondary); --txt3: var(--text-tertiary);
  --line2: var(--border-strong);
  --accentbg: var(--accent-tint); --cue: var(--warning-tint);
  --ok: var(--success); --warn: var(--warning);
  --th1: var(--accent); --th2: var(--warning); --th3: var(--success); --th4: #9a86c4; --th5: var(--danger);
  --r: var(--radius-card); --r2: var(--radius-overlay);
  --dur: var(--dur-quick); --ease: var(--ease-out); --shadow: var(--shadow-lg);
  --doc-size: 16.5px; --doc-width: 700px; --doc-font: var(--font-sans); --sans: var(--font-sans);
}
```

Note: `--line`, `--danger` are now the Onda raw tokens themselves (same semantic role as the old names), so they are defined once, not re-aliased.

- [ ] Step 2: Replace the current `[data-theme="dark"] { … }` (lines 51–69) with the Onda dark overrides below. Legacy aliases from Step 1 flip automatically because they point at these Onda tokens — no legacy names are re-declared here:

```css
[data-theme="dark"] {
  color-scheme: dark;
  --paper: #141310; --surface: #1d1b17; --surface-2: #26231d; --surface-inset: #2b2721;
  --ink-950: #f4f1ea; --ink-900: #e4dfd5; --ink-800: #c4bdb1; --ink-700: #a8a094;
  --ink-600: #8f887c; --ink-500: #79736a; --ink-400: #625d55; --ink-300: #4a463f;
  --ink-200: #37342e; --ink-100: #2b2721; --ink-50: #26231d;
  --line-soft: rgba(244,241,234,0.08); --line: rgba(244,241,234,0.14); --line-strong: rgba(244,241,234,0.22);
  --accent: #8ec3e6; --accent-hover: #aed7f0; --accent-active: #79b4dc;
  --accent-tint: rgba(142,195,230,0.16); --accent-tint-hover: rgba(142,195,230,0.24);
  --on-accent: #0c1620; --focus-ring: rgba(142,195,230,0.45);
  --gradient-aura: linear-gradient(115deg,#213240 0%,#2f5068 34%,#3f7196 62%,#3f7d78 100%);
  --shadow-glow: 0 0 0 1px rgba(142,195,230,0.3),0 4px 24px rgba(63,113,150,0.5);
  --success: #7fb98a; --success-tint: rgba(79,138,91,0.22); --warning: #d8ab5f; --warning-tint: rgba(194,135,46,0.22);
  --danger: #d97a6f; --danger-tint: rgba(191,68,58,0.24); --info: #79a6cf; --info-tint: rgba(63,111,158,0.24);
  --bg-hover: rgba(244,241,234,0.05); --bg-active: rgba(244,241,234,0.09); --text-link: #8fbfe0;
  --text-primary: #f4f1ea; --text-secondary: #c4bdb1; --text-tertiary: #8f887c;
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.3);
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3),0 2px 6px rgba(0,0,0,0.35);
  --shadow-md: 0 2px 4px rgba(0,0,0,0.35),0 8px 20px rgba(0,0,0,0.45);
  --shadow-lg: 0 4px 8px rgba(0,0,0,0.4),0 16px 36px rgba(0,0,0,0.55);
  --shadow-xl: 0 8px 16px rgba(0,0,0,0.45),0 28px 56px rgba(0,0,0,0.6);
}
```

- [ ] Step 3: Insert the 5 accent-variant blocks immediately after the dark block. Each overrides ONLY the accent group + `--gradient-aura`; `'sky'` needs no block (default). NOTE for the executor: these are the canonical Onda variant sets — if the Onda design `colors.css` is reachable, reconcile these hex values verbatim against it. Other areas depend only on the token NAMES, never these literals.

```css
/* Akzentvarianten — data-accent auf dem Wurzelelement */
[data-accent="sage"]{--accent:#7a9d6f;--accent-hover:#6b9060;--accent-active:#5d8253;--accent-tint:#e4efe0;--accent-tint-hover:#d5e6cf;--on-accent:#14200f;--focus-ring:rgba(122,157,111,0.4);--gradient-aura:linear-gradient(115deg,#eef4ea 0%,#cfe1c4 34%,#a9c79b 62%,#94b8ac 100%);}
[data-accent="blue"]{--accent:#5b8fce;--accent-hover:#4b80c4;--accent-active:#3f71b5;--accent-tint:#e0ebf8;--accent-tint-hover:#cddff2;--on-accent:#0d1826;--focus-ring:rgba(91,143,206,0.4);--gradient-aura:linear-gradient(115deg,#e7f0fb 0%,#b8d3f0 34%,#7fa8de 62%,#8fb4c9 100%);}
[data-accent="clay"]{--accent:#c07a5c;--accent-hover:#b46a4c;--accent-active:#a55c3f;--accent-tint:#f6e6dd;--accent-tint-hover:#efd6c8;--on-accent:#241109;--focus-ring:rgba(192,122,92,0.4);--gradient-aura:linear-gradient(115deg,#fbeee7 0%,#f0cbb6 34%,#dfa585 62%,#cf9f8a 100%);}
[data-accent="lavender"]{--accent:#9a86c4;--accent-hover:#8b76ba;--accent-active:#7c67ae;--accent-tint:#ece6f5;--accent-tint-hover:#ddd3ee;--on-accent:#1a1327;--focus-ring:rgba(154,134,196,0.4);--gradient-aura:linear-gradient(115deg,#f0ecf9 0%,#d6c9ec 34%,#b3a0d9 62%,#a8a6d3 100%);}
[data-accent="sand"]{--accent:#c2a15e;--accent-hover:#b6934e;--accent-active:#a78542;--accent-tint:#f4ebd6;--accent-tint-hover:#ecdec1;--on-accent:#241d0c;--focus-ring:rgba(194,161,94,0.4);--gradient-aura:linear-gradient(115deg,#faf1dd 0%,#ecd6a9 34%,#d9b978 62%,#cabf8a 100%);}
[data-theme="dark"][data-accent="sage"]{--accent:#a3c295;--accent-hover:#b8d1ac;--accent-active:#8fb180;--accent-tint:rgba(163,194,149,0.16);--accent-tint-hover:rgba(163,194,149,0.24);--on-accent:#12200d;--focus-ring:rgba(163,194,149,0.45);--gradient-aura:linear-gradient(115deg,#20321d 0%,#33502c 34%,#4d7142 62%,#3f7d78 100%);}
[data-theme="dark"][data-accent="blue"]{--accent:#7fabdd;--accent-hover:#9cc2e8;--accent-active:#6a99cf;--accent-tint:rgba(127,171,221,0.16);--accent-tint-hover:rgba(127,171,221,0.24);--on-accent:#0b1626;--focus-ring:rgba(127,171,221,0.45);--gradient-aura:linear-gradient(115deg,#1c2c40 0%,#2c4868 34%,#3c6896 62%,#3a6f8c 100%);}
[data-theme="dark"][data-accent="clay"]{--accent:#d99e80;--accent-hover:#e6b39a;--accent-active:#c9896c;--accent-tint:rgba(217,158,128,0.16);--accent-tint-hover:rgba(217,158,128,0.24);--on-accent:#241109;--focus-ring:rgba(217,158,128,0.45);--gradient-aura:linear-gradient(115deg,#3a231a 0%,#5c3826 34%,#8a5940 62%,#7d5748 100%);}
[data-theme="dark"][data-accent="lavender"]{--accent:#b6a4dc;--accent-hover:#ccbde8;--accent-active:#a48fd0;--accent-tint:rgba(182,164,220,0.16);--accent-tint-hover:rgba(182,164,220,0.24);--on-accent:#191227;--focus-ring:rgba(182,164,220,0.45);--gradient-aura:linear-gradient(115deg,#2a2340 0%,#453868 34%,#665196 62%,#5f5e8c 100%);}
[data-theme="dark"][data-accent="sand"]{--accent:#d8ba7f;--accent-hover:#e6cc9a;--accent-active:#c9a86a;--accent-tint:rgba(216,186,127,0.16);--accent-tint-hover:rgba(216,186,127,0.24);--on-accent:#241d0c;--focus-ring:rgba(216,186,127,0.45);--gradient-aura:linear-gradient(115deg,#3a331d 0%,#5c502c 34%,#8a7842 62%,#7d7748 100%);}
```

- [ ] Step 4: Change the writing-body line-height on line 485 from `line-height: 1.78;` to `line-height: 1.7;` inside the `#editor .ProseMirror` rule (font-family/size already resolve to Hanken 16.5px via the repointed `--doc-font`/`--doc-size`; `#title` and `#page` inherit through `--doc-font`).

- [ ] Step 5: Verify. Run `cd app && npm run build` — expect esbuild to finish with no error (CSS is imported? No — style.css is linked from index.html; still confirm the bundle builds). Then run `npm test` — expect the existing 3 test files still green (no token dependency). Grep guard: `grep -nE "#3a6ea5|#eef4fa" src/style.css` should return nothing in `:root`/dark (old Sky/accentbg literals gone). Browser-preview check (load `app/index.html`): the writing view background is warm paper `#f7f6f3`, links/caret are Sky `#79b4dc`, body text renders sans. Toggle the root `data-theme="dark"` in devtools → warm charcoal `#141310`. Set `document.documentElement.setAttribute('data-accent','clay')` → accent shifts to terracotta everywhere `--accent` is used.

- [ ] Step 6: Commit: `git add app/src/style.css && git commit -m "feat(onda): Onda-Token-Ebene (Neutralen, Akzent Sky, Status, Aura, Typo, Raum, Radius, Elevation) mit Dunkelmodus und 5 Akzentvarianten"`.

---

### Task A-2: Self-host Hanken Grotesk + JetBrains Mono (woff2) and add `@font-face`

**Files:**
- Create `app/fonts/hanken-grotesk-{regular,500,600,700,800}.woff2` and `app/fonts/jetbrains-mono-{regular,500}.woff2` (7 files).
- Modify `app/src/style.css` — insert `@font-face` rules after line 10 (after the existing Literata italic face; keep the Diatype/Literata faces, still used by the un-migrated home view).

**Interfaces:**
- Consumes: `--font-sans` / `--font-mono` family names declared in A-1.
- Produces: the actual `"Hanken Grotesk"` (400/500/600/700/800) and `"JetBrains Mono"` (400/500) faces that A-1's `--font-sans`/`--font-mono` resolve to.

- [ ] Step 1: Fetch the woff2 files from google-webfonts-helper. This is a file download — get the user's go-ahead before running, and report the two sources. Exact commands (run from repo root):
```
cd "app/fonts"
curl -L -o hk.zip "https://gwfh.mranftl.com/api/fonts/hanken-grotesk?download=zip&subsets=latin&variants=regular,500,600,700,800&formats=woff2"
curl -L -o jb.zip "https://gwfh.mranftl.com/api/fonts/jetbrains-mono?download=zip&subsets=latin&variants=regular,500&formats=woff2"
unzip -o hk.zip -d hk && unzip -o jb.zip -d jb
```
Each woff2 is roughly 20–40 KB; the two zips total well under 1 MB.

- [ ] Step 2: Rename the extracted files (their names carry a version stamp like `hanken-grotesk-v10-latin-regular.woff2`) to stable names, then clean up:
```
mv hk/hanken-grotesk-*-regular.woff2 hanken-grotesk-regular.woff2
mv hk/hanken-grotesk-*-500.woff2 hanken-grotesk-500.woff2
mv hk/hanken-grotesk-*-600.woff2 hanken-grotesk-600.woff2
mv hk/hanken-grotesk-*-700.woff2 hanken-grotesk-700.woff2
mv hk/hanken-grotesk-*-800.woff2 hanken-grotesk-800.woff2
mv jb/jetbrains-mono-*-regular.woff2 jetbrains-mono-regular.woff2
mv jb/jetbrains-mono-*-500.woff2 jetbrains-mono-500.woff2
rm -rf hk jb hk.zip jb.zip
```

- [ ] Step 3: Insert these `@font-face` rules into `app/src/style.css` directly after line 10:
```css
@font-face { font-family: "Hanken Grotesk"; src: url("../fonts/hanken-grotesk-regular.woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "Hanken Grotesk"; src: url("../fonts/hanken-grotesk-500.woff2") format("woff2"); font-weight: 500; font-style: normal; font-display: swap; }
@font-face { font-family: "Hanken Grotesk"; src: url("../fonts/hanken-grotesk-600.woff2") format("woff2"); font-weight: 600; font-style: normal; font-display: swap; }
@font-face { font-family: "Hanken Grotesk"; src: url("../fonts/hanken-grotesk-700.woff2") format("woff2"); font-weight: 700; font-style: normal; font-display: swap; }
@font-face { font-family: "Hanken Grotesk"; src: url("../fonts/hanken-grotesk-800.woff2") format("woff2"); font-weight: 800; font-style: normal; font-display: swap; }
@font-face { font-family: "JetBrains Mono"; src: url("../fonts/jetbrains-mono-regular.woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }
@font-face { font-family: "JetBrains Mono"; src: url("../fonts/jetbrains-mono-500.woff2") format("woff2"); font-weight: 500; font-style: normal; font-display: swap; }
```

- [ ] Step 4: Verify. `ls app/fonts/hanken-grotesk-*.woff2 app/fonts/jetbrains-mono-*.woff2 | wc -l` → expect `7`. Browser-preview `app/index.html`: writing body now renders in Hanken Grotesk (distinct geometric grotesk, not the system fallback); in devtools `document.fonts.check('16px "Hanken Grotesk"')` returns `true` after load.

- [ ] Step 5: Commit: `git add app/fonts app/src/style.css && git commit -m "feat(onda): Hanken Grotesk und JetBrains Mono selbst hosten (@font-face, woff2)"`.

---

### Task A-3: Remap the `--v2-*` namespace onto Onda aliases

**Files:**
- Modify `app/src/style.css`: add `--v2-*` aliases inside `:root` (append to the block written in A-1); delete the 10 `--v2-*` custom-property lines from `#editorView` (lines 1208–1217) and delete the entire `[data-theme="dark"] #editorView { … }` block (lines 1227–1238).

**Interfaces:**
- Consumes: Onda alias tokens from A-1 (`--bg-app`, `--bg-surface`, `--surface-2`, `--surface-inset`, `--text-primary`, `--text-secondary`, `--border-default`, `--border-strong`, `--success-tint`, `--warning-tint`).
- Produces: `--v2-canvas/-surface/-surface-soft/-surface-active/-text/-text-soft/-line/-line-strong/-mint/-peach` as global aliases (the ~90 kept child rules — agent widget, evidence window, composer, block-preview, findings — keep resolving them). Frees Area B to rebuild the `#editorView` rule without re-declaring any `--v2-*`.

- [ ] Step 1: Because the `--v2-*` names are consumed by kept components that survive Area B's `#editorView` rebuild, promote them to `:root` so they no longer depend on the `#editorView` rule. Append this group to the `:root` block from A-1 (they inherit dark automatically through the Onda tokens — no dark variant needed):
```css
  /* V2-Namespace-Bruecke auf Onda */
  --v2-canvas: var(--bg-app); --v2-surface: var(--bg-surface);
  --v2-surface-soft: var(--surface-2); --v2-surface-active: var(--surface-inset);
  --v2-text: var(--text-primary); --v2-text-soft: var(--text-secondary);
  --v2-line: var(--border-default); --v2-line-strong: var(--border-strong);
  --v2-mint: var(--success-tint); --v2-peach: var(--warning-tint);
```

- [ ] Step 2: Delete the 10 literal `--v2-*` lines (1208–1217) from the `#editorView` rule, leaving its layout/`background`/`color` lines untouched (Area B rewrites those). The `background: var(--v2-canvas)` / `color: var(--v2-text)` now resolve through the `:root` aliases.

- [ ] Step 3: Delete the whole `[data-theme="dark"] #editorView { --v2-*… }` block (lines 1227–1238) — the aliases already flip via the Onda dark overrides, so this override is redundant.

- [ ] Step 4: Verify. `grep -nE "\-\-v2-[a-z-]+:\s*#" src/style.css` → expect no literal-hex `--v2-*` definitions remain (only the `var(--…)` aliases in `:root`). `grep -c "var(--v2-" src/style.css` unchanged (~72 usages still resolve). Browser-preview: the kept components (agent widget, evidence window, composer, block-preview cards) show warm-paper surfaces and Onda ink text in both light and dark, identical structure, new palette.

- [ ] Step 5: Commit: `git add app/src/style.css && git commit -m "refactor(onda): V2-Namespace als globale Aliase auf Onda, lokale --v2-Literale entfernt"`.

---

### Task A-4: Settings model (`accent` + `sidebarCollapsed`, tolerant load) + `applySettings` (`data-accent`, drop Literata override)

**Files:**
- Create `app/src/settings-model.mjs`.
- Create `app/test/settings-model.test.mjs`.
- Modify `app/src/editor.js`: line 17 import area (add import), line 53 (`DEFAULTS`), lines 170–172 (settings load).
- Modify `app/src/ui.js`: line 143 (`SERIF` const) and lines 145–164 (`applySettings`).

**Interfaces:**
- Consumes: `editor.js` `load()` / `DEFAULTS`; `ui.js` `applySettings`; Onda `[data-accent]` variant blocks from A-1.
- Produces: `state.settings.accent` (`'sky'|'sage'|'blue'|'clay'|'lavender'|'sand'`, default `'sky'`), `state.settings.sidebarCollapsed` (boolean, default `false`), exported `normalizeSettings` / `DEFAULT_SETTINGS` / `ACCENTS`, and `applySettings()` setting/removing `data-accent` on the root. NO schema bump. (Area B reads `settings.sidebarCollapsed` to toggle `is-sidebar-collapsed`; Area B/footer writes `settings.accent` via the accent picker.)

- [ ] Step 1 (TDD, RED): Create `app/test/settings-model.test.mjs` — this pure module matches the existing `reasoning-model.mjs`/`workspace-model.mjs` node-testable pattern (`editor.js`/`ui.js` can't be imported in node — they touch `window` at load):
```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_SETTINGS, ACCENTS, normalizeSettings } from '../src/settings-model.mjs'

test('defaults: accent sky, sidebar not collapsed, existing fields intact', () => {
  const s = normalizeSettings(undefined)
  assert.equal(s.accent, 'sky')
  assert.equal(s.sidebarCollapsed, false)
  assert.equal(s.theme, DEFAULT_SETTINGS.theme)
  assert.equal(s.spellcheck, false)
})

test('known accents pass through; unknown/garbage fall back to sky', () => {
  for (const a of ACCENTS) assert.equal(normalizeSettings({ accent: a }).accent, a)
  assert.equal(normalizeSettings({ accent: 'neon' }).accent, 'sky')
  assert.equal(normalizeSettings({ accent: 42 }).accent, 'sky')
})

test('sidebarCollapsed is coerced to a boolean', () => {
  assert.equal(normalizeSettings({ sidebarCollapsed: true }).sidebarCollapsed, true)
  assert.equal(normalizeSettings({ sidebarCollapsed: 1 }).sidebarCollapsed, true)
  assert.equal(normalizeSettings({ sidebarCollapsed: 0 }).sidebarCollapsed, false)
  assert.equal(normalizeSettings({}).sidebarCollapsed, false)
})

test('tolerant load keeps other fields and clamps structWidth like before', () => {
  const s = normalizeSettings({ theme: 'dark', spellcheck: true, structWidth: 5000, keepMe: 7 })
  assert.equal(s.theme, 'dark')
  assert.equal(s.spellcheck, true)
  assert.equal(s.structWidth, 940)
  assert.equal(s.keepMe, 7)
  assert.equal(normalizeSettings({ structWidth: 10 }).structWidth, 360)
  assert.equal(normalizeSettings({ structWidth: 'x' }).structWidth, 560)
})

test('non-object input never throws and yields safe defaults', () => {
  assert.equal(normalizeSettings(null).accent, 'sky')
  assert.equal(normalizeSettings('nope').accent, 'sky')
  assert.equal(normalizeSettings(123).sidebarCollapsed, false)
})
```
Run `cd app && npm test` → the new file fails (module missing). Confirms RED.

- [ ] Step 2 (GREEN): Create `app/src/settings-model.mjs`:
```js
// Reine, node-testbare Einstellungs-Normalisierung — kein DOM, keine Tiptap-Abhaengigkeit.
// Aus editor.js load() und den Tests importiert. Bumpt KEIN Schema (additiv, tolerant).

export const ACCENTS = Object.freeze(['sky', 'sage', 'blue', 'clay', 'lavender', 'sand'])

export const DEFAULT_SETTINGS = Object.freeze({
  theme: 'auto',
  spellcheck: false,
  showWords: true,
  structWidth: 620,
  accent: 'sky',
  sidebarCollapsed: false,
})

// Unbekannte/kaputte Werte fallen auf sichere Standards zurueck; zusaetzlich
// gespeicherte Felder bleiben erhalten (vorwaertskompatibel).
export function normalizeSettings(raw) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const s = Object.assign({}, DEFAULT_SETTINGS, src)
  s.structWidth = Math.max(360, Math.min(940, +s.structWidth || 560))
  s.accent = ACCENTS.includes(s.accent) ? s.accent : 'sky'
  s.sidebarCollapsed = !!s.sidebarCollapsed
  return s
}
```
Run `npm test` → all `settings-model` tests pass; existing 3 files stay green.

- [ ] Step 3: Wire `editor.js` to the model. Add to the import group (after line 17):
```js
import { DEFAULT_SETTINGS, normalizeSettings } from './settings-model.mjs'
```
Replace line 53 `const DEFAULTS = { theme: 'auto', spellcheck: false, showWords: true, structWidth: 620 }` with:
```js
const DEFAULTS = DEFAULT_SETTINGS
```
(keeps line 58 `settings: { ...DEFAULTS }` working). Replace the two load lines (170–172):
```js
  state.settings = Object.assign({}, DEFAULTS, (d && d.settings) || {})
  // Panel-Breite gegen kaputte/fremde Werte absichern.
  state.settings.structWidth = Math.max(360, Math.min(940, +state.settings.structWidth || 560))
```
with:
```js
  state.settings = normalizeSettings(d && d.settings)
```

- [ ] Step 4: Update `ui.js` `applySettings`. Delete the now-unused `SERIF` const (line 143). Replace lines 145–164 with (removes the `--doc-size:18px`/`--doc-width:700px`/`--doc-font:SERIF` overrides so the CSS Hanken 16.5/1.7 wins; adds `data-accent`):
```js
export function applySettings() {
  const s = ctx.state.settings
  const root = document.documentElement
  const dark = s.theme === 'dark' || (s.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.dataset.theme = dark ? 'dark' : 'light'
  // Akzentvariante: 'sky' ist Standard (kein Attribut), sonst data-accent setzen.
  if (s.accent && s.accent !== 'sky') root.setAttribute('data-accent', s.accent)
  else root.removeAttribute('data-accent')
  // Schreibkoerper kommt jetzt komplett aus dem CSS (Hanken Grotesk 16.5px/1.7) —
  // kein Literata-/18px-Override mehr.
  const pm = document.querySelector('#editor .ProseMirror')
  if (pm) pm.setAttribute('spellcheck', s.spellcheck ? 'true' : 'false')
  const t = document.getElementById('title')
  if (t) t.setAttribute('spellcheck', s.spellcheck ? 'true' : 'false')
  if (!mediaBound) {
    mediaBound = true
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (ctx.state.settings.theme === 'auto') applySettings()
    })
  }
  if (ctx.autoGrowTitle) requestAnimationFrame(ctx.autoGrowTitle)
}
```

- [ ] Step 5: Verify. `cd app && npm test` → all 4 test files green. `npm run build` → esbuild bundles `settings-model.mjs` with no error. `grep -n "SERIF" src/ui.js` → no matches. `grep -n "setProperty('--doc" src/ui.js` → no matches (Literata override gone). Browser-preview `app/index.html`: writing body is Hanken 16.5px/1.7 (not Literata serif 18px). In devtools set `window.AIWT.state.settings.accent='sage'; window.AIWT` then call the app's `applySettings` (or reload after persisting) → root gains `data-accent="sage"` and accent turns sage; set back to `'sky'` → attribute removed, Sky returns. Optional regression: `node test/v2-smoke.mjs` still passes (asserts only `settings.exampleVersion`, unaffected).

- [ ] Step 6: Commit: `git add app/src/settings-model.mjs app/test/settings-model.test.mjs app/src/editor.js app/src/ui.js && git commit -m "feat(onda): Einstellungen accent + sidebarCollapsed (tolerant, ohne Schema-Bump), applySettings setzt data-accent und laesst den Schreibkoerper aus dem CSS kommen"`.

---

## Phase B — Frame skeleton (index.html, workspace.js rewire, layout CSS)

### Task B-1: Rewrite `index.html` `#editorView` to the Onda frame skeleton
**Files:** Modify `app/index.html` (replace lines 33–55, the entire `<section id="editorView">…</section>`).
**Interfaces:**
- Produces (anchors other areas fill/style): `#ondaSidebar`, `.onda-brand`, `#sidebarCollapse`, `#sidebarBack` + `.onda-side-back-label`, `#pvCard` (Area A fills/opens `#pvModal`), `nav#structureNav` (Area C renders `.block-preview` cards into it), `#materialSources` + `#materialSourcesCount` (Material/evidence area fills count), `#themeToggle`/`#accentToggle` (Area A wires to `applySettings`/settings), `.onda-editor-col`, `.onda-topbar`, `#sidebarReopen`, `#ondaAura` (Area D gives it the aura visual), reading column `main#scroll`→`#page`.
- Keeps verbatim (interaction logic depends): `#scroll`, `#page`, `#title`, `#editor`, `#blockInsertLayer`, `#localAgentLayer`, `#agentWidget`, `#evidenceWindow`, `#agentLiveStatus`.

- [ ] Step 1: Replace `app/index.html` lines 33–55 with this exact block:
```html
    <!-- Schreibansicht: Der Text bleibt dominant; Rahmen (Seitenleiste, Aura) sind ruhig. -->
    <section id="editorView">
      <aside id="ondaSidebar" class="onda-sidebar">
        <div class="onda-brand">
          <span class="onda-aura onda-aura--sm" aria-hidden="true"></span>
          <span class="onda-wordmark">Onda</span>
          <button id="sidebarCollapse" class="onda-icon-btn" title="Seitenleiste einklappen" aria-label="Seitenleiste einklappen" aria-controls="ondaSidebar" aria-expanded="true">‹</button>
        </div>

        <button id="sidebarBack" class="onda-side-back" title="Zur Projektübersicht" aria-label="Zur Projektübersicht">
          <span class="onda-side-back-chevron" aria-hidden="true">‹</span>
          <span class="onda-side-back-label">Projekt</span>
        </button>

        <section class="onda-side-section">
          <span class="onda-eyebrow">Projektverständnis</span>
          <button id="pvCard" class="onda-pv-card" aria-haspopup="dialog" aria-controls="pvModal">
            <span class="onda-pv-title">Projektverständnis</span>
            <span class="onda-pv-claim">Noch nicht festgelegt</span>
          </button>
        </section>

        <nav id="structureNav" class="onda-side-section" aria-label="Struktur">
          <span class="onda-eyebrow">Struktur</span>
          <!-- Struktur-Karten (.block-preview) werden von workspace.js gerendert (Area C) -->
        </nav>

        <section class="onda-side-section onda-side-material">
          <span class="onda-eyebrow">Material</span>
          <button id="materialSources" class="onda-material-btn">
            <span class="onda-material-label">Quellen im Projekt</span>
            <span id="materialSourcesCount" class="onda-badge">0</span>
          </button>
        </section>

        <div class="onda-side-footer">
          <span class="onda-avatar" aria-hidden="true">J</span>
          <span class="onda-side-user">Jakob</span>
          <button id="themeToggle" class="onda-icon-btn" title="Erscheinung wechseln" aria-label="Erscheinung wechseln">☾</button>
          <button id="accentToggle" class="onda-icon-btn" title="Akzentfarbe wechseln" aria-label="Akzentfarbe wechseln"><span class="onda-accent-dot" aria-hidden="true"></span></button>
        </div>
      </aside>

      <div class="onda-editor-col">
        <header class="onda-topbar">
          <button id="sidebarReopen" class="onda-icon-btn" title="Seitenleiste einblenden" aria-label="Seitenleiste einblenden" aria-controls="ondaSidebar" aria-expanded="false" hidden>›</button>
          <button id="ondaAura" class="onda-aura" title="Agentengespräch öffnen" aria-label="Agentengespräch öffnen" aria-controls="agentWidget" aria-expanded="false"></button>
        </header>
        <main id="scroll">
          <div id="page">
            <textarea id="title" rows="1" placeholder="Titel" spellcheck="false"></textarea>
            <div id="editor"></div>
          </div>
        </main>
        <div id="blockInsertLayer"></div>
        <aside id="localAgentLayer"></aside>
      </div>

      <aside id="agentWidget" hidden aria-label="Agentengespräch"></aside>
      <aside id="evidenceWindow" hidden aria-label="Quellen und Fundstellen"></aside>
      <div id="agentLiveStatus" class="visually-hidden" role="status" aria-live="polite" aria-atomic="true"></div>
    </section>
```
This removes `#workspaceHeader`, `#workspaceBack`, `#workspacePath`, `#agentPresence` (◌), `#workspaceBody`, `#structureShelf`, and `#main`; and moves `#blockInsertLayer`/`#localAgentLayer` to be siblings of `main#scroll` inside `.onda-editor-col`.

- [ ] Step 2: Verify markup is well-formed and no stale ids remain. Run:
`cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && grep -nE "workspaceHeader|workspaceBack|workspacePath|agentPresence|workspaceBody|structureShelf|id=\"main\"" index.html` → expect **no matches**. Then `grep -nE "ondaSidebar|onda-editor-col|onda-topbar|ondaAura|structureNav|sidebarBack|sidebarCollapse|sidebarReopen" index.html` → expect the new ids present.

- [ ] Step 3: Commit. `git add app/index.html && git commit -m "feat(frame): Onda-Skelett für die Schreibansicht (Seitenleiste + schlanke Topbar + Aura)"`

---

### Task B-2: Rewire `workspace.js` — element refs, shelf/header removals, agent-toggle rewire, sidebar collapse
**Files:** Modify `app/src/workspace.js` — `elements()` (145–158), `refreshWorkspace` toggle block (1721–1738), `enforceExclusiveLayers` (leave as-is), `initWorkspace`: remove `openShelf` (1775–1790) & `closeShelf` (1792–1800), edit `closeTopLayer` (1802–1835), instance object (1841–1842), remove `onPath` (1866–1868), add collapse handlers, edit listeners (1948–1962).
**Interfaces:**
- Consumes: `ctx.state.settings.sidebarCollapsed` (Area A adds it to `DEFAULTS` in `editor.js:53`), `ctx.persist`, `ctx.activeProjectObj`. Aura visual states on `#ondaAura` = Area D. `renderStructureShelf()` body (still called here) is rewritten by Area C to render into `#structureNav`.
- Produces: `elements()` now returns `view`, `sidebar`, `back`(→`#sidebarBack`), `collapse`, `reopen`, `structureNav`, and `agentPresence`(now→`#ondaAura`); it **no longer returns** `path`, `body`, `main`, `shelf`. **Area C must migrate its remaining `ui.shelf` reads (workspace.js ~348 `fromShelf`, ~438/453/454 `rebuildStructureShelf`, ~466 `renderStructureShelf`) to `ui.structureNav`.**

- [ ] Step 1: Replace `elements()` (145–158) with:
```js
function elements() {
  return {
    view: document.getElementById('editorView'),
    sidebar: document.getElementById('ondaSidebar'),
    back: document.getElementById('sidebarBack'),
    collapse: document.getElementById('sidebarCollapse'),
    reopen: document.getElementById('sidebarReopen'),
    structureNav: document.getElementById('structureNav'),
    scroll: document.getElementById('scroll'),
    insertLayer: document.getElementById('blockInsertLayer'),
    localLayer: document.getElementById('localAgentLayer'),
    agentPresence: document.getElementById('ondaAura'),
    agentWidget: document.getElementById('agentWidget'),
    evidenceWindow: document.getElementById('evidenceWindow'),
  }
}
```
(Keeping the property name `agentPresence` pointing at `#ondaAura` is the agent-toggle rewire — all existing focus/aria/listener code at lines 1354, 1734, 1950, 2013 now targets the aura unchanged.)

- [ ] Step 2: In `refreshWorkspace`, replace the block currently at lines 1721–1738 (from `const project = ctx.activeProjectObj()` through the `ui.localLayer?.setAttribute('aria-hidden', …)` line) with:
```js
  const ui = elements()
  const project = ctx.activeProjectObj()
  const backLabel = ui.back?.querySelector('.onda-side-back-label')
  if (backLabel) backLabel.textContent = project?.name || 'Projekt'

  ui.view?.classList.toggle('is-agent-open', workspace.agent.open)
  ui.view?.classList.toggle('is-evidence-open', Boolean(workspace.evidenceFindingId))

  setLayerVisibility(ui.agentWidget, workspace.agent.open)
  ui.agentPresence?.setAttribute('aria-expanded', String(workspace.agent.open))
  setLayerVisibility(ui.evidenceWindow, Boolean(workspace.evidenceFindingId))
  const localPaused = Boolean(workspace.agent.open || workspace.evidenceFindingId)
  ui.localLayer?.classList.toggle('is-paused', localPaused)
  ui.localLayer?.setAttribute('aria-hidden', String(localPaused))
```
(Drops the `#workspacePath` text, the `#structureShelf` visibility toggle, the `is-shelf-open` class and its aria; retargets `is-agent-open`/`is-evidence-open` from the removed `#workspaceBody` onto `#editorView`; removes `shelfOpen` from `localPaused` — structure now lives permanently in the sidebar, not as a pausing overlay. The `renderStructureShelf()` call at line 1747 stays; Area C rewrites its body.)

- [ ] Step 3: Delete `openShelf` (1775–1790) and `closeShelf` (1792–1800) entirely, and remove the two lines `    openShelf,` and `    closeShelf,` from the `instance` object (1841–1842).

- [ ] Step 4: Replace `closeTopLayer` (1802–1835) with the shelf branch and `restoreShelfFocus` removed:
```js
  const closeTopLayer = () => {
    const workspace = activeWorkspace()
    if (!workspace) return false
    if (workspace.suggestionFindingId) {
      const findingId = workspace.suggestionFindingId
      workspace.suggestionFindingId = null
      requestLocalSummaryFocus(findingId)
    } else if (workspace.expandedFindingId) {
      const findingId = workspace.expandedFindingId
      workspace.expandedFindingId = null
      workspace.suggestionFindingId = null
      workspace.localThreadFindingId = null
      requestLocalSummaryFocus(findingId)
    } else if (closeInsertMenu()) {
      return true
    } else if (workspace.evidenceFindingId) {
      return closeEvidenceWindow()
    } else if (workspace.agent.open) {
      const message = activeAgentMessage(workspace)
      if (message) dismissAgentMessage(workspace, message.id)
      else workspace.agent.open = false
      agentPresenceFocusRequest = true
    } else {
      return false
    }
    refreshWorkspace()
    persistWorkspace()
    return true
  }
```

- [ ] Step 5: Remove `onPath` (1866–1868). Then insert the sidebar-collapse handlers immediately after the `onAgentPresence` block (after its closing `}` at line 1885):
```js
  const applySidebarCollapsed = collapsed => {
    ui.view?.classList.toggle('is-sidebar-collapsed', collapsed)
    ui.collapse?.setAttribute('aria-expanded', String(!collapsed))
    ui.reopen?.setAttribute('aria-expanded', String(!collapsed))
    if (ui.reopen) ui.reopen.hidden = !collapsed
  }
  const setSidebarCollapsed = collapsed => {
    if (Boolean(ctx.state.settings.sidebarCollapsed) !== collapsed) {
      ctx.state.settings.sidebarCollapsed = collapsed
      ctx.persist()
    }
    applySidebarCollapsed(collapsed)
  }
  const onSidebarCollapse = () => setSidebarCollapsed(true)
  const onSidebarReopen = () => setSidebarCollapsed(false)
  applySidebarCollapsed(Boolean(ctx.state.settings.sidebarCollapsed))
```
(`ui` is the snapshot from `const ui = elements()` at line 1761, valid here. The trailing call applies the persisted state on init without re-persisting.)

- [ ] Step 6: Update the listener block (1948–1962). Remove the line `listen(ui.path, 'click', onPath)`. Change `listen(ui.shelf, 'scroll', onShelfScroll, { passive: true })` to `listen(ui.sidebar, 'scroll', onShelfScroll, { passive: true })`. Add, right after `listen(ui.agentPresence, 'click', onAgentPresence)`:
```js
  listen(ui.collapse, 'click', onSidebarCollapse)
  listen(ui.reopen, 'click', onSidebarReopen)
```

- [ ] Step 7: Rebuild the bundle and run the model tests (should be untouched/green). `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm run build && npm test` → expect esbuild success and all `test/*.test.mjs` passing.

- [ ] Step 8: Sanity-grep for dangling refs. `grep -nE "ui\.path|ui\.body|ui\.main|openShelf|closeShelf|onPath|workspace\.shelfOpen" app/src/workspace.js` → expect only the harmless `enforceExclusiveLayers` `workspace.shelfOpen = false` lines (226–243, intentionally left; `shelfOpen` still lives in the persisted model and its `workspace-model.test.mjs`) and no `ui.path/ui.body/ui.main/openShelf/closeShelf/onPath`.

- [ ] Step 9: Commit. `git add app/src/workspace.js app/dist/editor.bundle.js && git commit -m "feat(frame): Sidebar-Refs + Einklappen, Agenten-Toggle auf Aura, Regal-Logik entfernt"`

---

### Task B-3: Frame layout CSS in `style.css` (flex row, sidebar+collapse, editor column, slim topbar, aura position, reading column)
**Files:** Modify `app/src/style.css` — `#editorView` (1207 block), remove/replace `#workspaceHeader` (1240–1252), `#workspaceBody`+`.is-shelf-open` (1313–1326), `#structureShelf` container (1328–1337), `#structureShelf[hidden]` group member (1448–1452), `#editorView #main` (1454–1463), overlay inset (1532–1538), reading column `#editorView #page`/`#title`/`.ProseMirror` (1476–1503), and the mobile/print blocks that name removed ids (2256–2296, 2347–2350, 2415–2431).
**Interfaces:**
- Consumes Onda tokens embedded by Area A: `--bg-app`, `--bg-surface`, `--text-primary`, `--text-tertiary`, `--border-default`, `--border-subtle`, `--sidebar-width`, `--font-sans`, `--container-reading`, `--space-1..4`, `--fw-medium/--fw-bold`, `--text-sm/--text-md`, `--tracking-tight`, `--ease-out`, `--dur-slow`, `--shadow-xl`. Aura orb visual (`.onda-aura`, `--aura-size`, `.onda-aura--sm`) = Area D. Sidebar section internals (`.onda-eyebrow`, `.onda-pv-card`, `.onda-material-btn`, `.onda-avatar`, `.block-preview` cards in `#structureNav`) = Areas A/C/D.
- Produces: `#editorView.is-sidebar-collapsed` behavior, `--onda-topbar-h` on `.onda-editor-col`, `#ondaAura` top-right placement.

- [ ] Step 1: In the `#editorView { … }` rule (1207 block), change only these four declarations (keep the `--v2-*` custom-property lines; Area A remaps them):
`flex-direction: column;` → `flex-direction: row;`
`background: var(--v2-canvas);` → `background: var(--bg-app);`
`color: var(--v2-text);` → `color: var(--text-primary);`
(leave `position/height/min-width/overflow` intact).

- [ ] Step 2: Delete the entire `#workspaceHeader { … }` rule (1240–1252). Delete `#workspaceBody { … }` (1313–1322) and `#workspaceBody.is-shelf-open { … }` (1324–1326). Delete `#structureShelf { … }` (1328–1337). In the grouped selector `#structureShelf[hidden],\n#agentWidget[hidden],\n#evidenceWindow[hidden] { display: none; }` (1448–1452) remove only the `#structureShelf[hidden],` line. Delete `#editorView #main { … }` (1454–1463).

- [ ] Step 3: Insert the new frame CSS (place where `#editorView #main` was, ~1454):
```css
/* --- Onda Rahmen: Seitenleiste + Editor-Spalte --- */
.onda-sidebar {
  flex: none;
  width: var(--sidebar-width);
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-4) var(--space-3);
  background: var(--bg-surface);
  border-right: 1px solid var(--border-default);
  overflow-y: auto;
  overflow-x: hidden;
  margin-left: 0;
  transition: margin-left var(--dur-slow) var(--ease-out);
}

#editorView.is-sidebar-collapsed .onda-sidebar {
  margin-left: calc(-1 * var(--sidebar-width));
}

.onda-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 32px;
}
.onda-brand .onda-wordmark {
  flex: 1;
  min-width: 0;
  font: var(--fw-bold) var(--text-md)/1.2 var(--font-sans);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
}
.onda-brand #sidebarCollapse { flex: none; }

.onda-side-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.onda-side-material { margin-top: var(--space-1); }

.onda-side-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--border-subtle);
}
.onda-side-footer .onda-side-user {
  flex: 1;
  min-width: 0;
  font: var(--fw-medium) var(--text-sm)/1.2 var(--font-sans);
  color: var(--text-primary);
}

.onda-editor-col {
  --onda-topbar-h: 52px;
  grid-column: auto;
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.onda-topbar {
  flex: none;
  height: var(--onda-topbar-h);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-4);
}

#ondaAura {
  margin-left: auto;
  --aura-size: 30px;
}

#sidebarReopen { flex: none; }
#sidebarReopen[hidden] { display: none; }
```
(`.onda-editor-col` is `position: relative`, so the absolutely-positioned overlays anchor to it; the topbar reserves `--onda-topbar-h` at top and `#scroll` fills the rest. `#editorView #scroll` at 1465–1474 is unchanged and still fills the column.)

- [ ] Step 4: In the overlay rule `#blockInsertLayer, #localAgentLayer { position: absolute; inset: 0; … }` (1532–1538), change `inset: 0;` to:
```css
  top: var(--onda-topbar-h, 52px);
  right: 0;
  bottom: 0;
  left: 0;
```
(so the overlay box lines up exactly with `#scroll` below the topbar — the `getBoundingClientRect`-based trigger/finding positioning at workspace.js 525/1152 stays correct).

- [ ] Step 5: Reading column to Onda. Replace `#editorView #page { … }` (1476–1482) with:
```css
#editorView #page {
  width: min(calc(100% - 48px), calc(var(--container-reading) + 48px));
  max-width: calc(var(--container-reading) + 48px);
  min-height: 100%;
  margin: 0 auto;
  padding: 68px 24px 38vh;
}
```
Update `#editorView #title { … }` (1484–1488) to:
```css
#editorView #title {
  color: var(--text-primary);
  font-family: var(--font-sans);
  margin-bottom: 24px;
  letter-spacing: var(--tracking-tight);
}
```
In `#editorView #title::placeholder, #editorView #editor .ProseMirror p.is-editor-empty:first-child::before { color: var(--v2-text-soft); }` (1490–1493) change the color to `var(--text-tertiary);`. Replace `#editorView #editor .ProseMirror { … }` (1495–1503) with:
```css
#editorView #editor .ProseMirror {
  width: 100%;
  font-family: var(--font-sans);
  font-size: 16.5px;
  line-height: 1.7;
  letter-spacing: 0;
  color: var(--text-primary);
  caret-color: var(--accent);
}
```

- [ ] Step 6: Fix the media/print rules that reference removed ids.
  - In `@media (min-width: 761px)` (2256–2263): replace the selector `#workspaceBody.is-agent-open,\n  #workspaceBody.is-evidence-open` with `#editorView.is-agent-open .onda-editor-col,\n  #editorView.is-evidence-open .onda-editor-col` (keeps the “make room for the floating agent panel” shift).
  - In `@media (max-width: 760px)` (2264…): delete `#workspaceHeader { padding-inline: 10px }`, `#workspaceBody { … }`, `#workspaceBody.is-shelf-open { … }`, the mobile `#structureShelf { … }` (2279–2291), and `#editorView #main { … }` (2293–2296). Add at the top of this query:
```css
  .onda-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 60;
    box-shadow: var(--shadow-xl);
  }
```
(keep the existing mobile `#editorView #page`, `#editorView #title`, `#agentWidget`/`#evidenceWindow` rules).
  - In `@media (max-width: 760px)` at 2347: delete the `#workspaceHeader { grid-template-columns: … }` rule (2348–2350) (topbar is flex now); keep the 44px touch-target rules.
  - In `@media print` (2405): in the hide-list (2415–2424) replace `#workspaceHeader,\n  #structureShelf,` with `.onda-sidebar,\n  .onda-topbar,`; in the block-display group (2426–2440) replace `#workspaceBody,\n  #editorView #main,` with `.onda-editor-col,`.

- [ ] Step 7: Build and visually verify in the browser preview. Start a static server and open the app: `preview_start` with a server that serves `app/` (e.g. launch.json running `python3 -m http.server 8081` in `app/`, port 8081), then navigate to `http://localhost:8081/index.html`, open any document into the writing view. Confirm: (a) sidebar sits on the LEFT at ~264px with a right border; (b) the slim ~52px topbar spans the editor column with the aura orb pinned top-right; (c) the reading column is centered at ~680px in Hanken Grotesk; (d) clicking `#sidebarCollapse` slides the sidebar out (expo ease) and reveals `#sidebarReopen` top-left; clicking `#sidebarReopen` restores it; (e) clicking the aura opens `#agentWidget`; Escape closes it and returns focus to the aura; (f) the block-insert “+” trigger still appears at the correct vertical position on the active block. Check `read_console_messages` for errors → expect none.

- [ ] Step 8: Confirm no stale frame selectors remain in CSS: `grep -nE "#workspaceHeader|#workspaceBody|#structureShelf \{|#editorView #main" app/src/style.css` → expect no matches (the `.structure-shelf-*`, `.block-preview*`, `.block-insert*` class rules remain for Area C).

- [ ] Step 9: Commit. `git add app/src/style.css && git commit -m "feat(frame): Onda-Rahmen-CSS — Flex-Zeile, Seitenleiste + Einklappen, schlanke Topbar, Leseraster 680"`

---

---

## Phase D — Aura & reusable primitives

### Task D-1: Aura orb primitive CSS (`.onda-aura`)

**Files:** Modify `app/src/style.css` (append a new "Onda primitives" section at EOF, currently 2454 lines). This consumes tokens embedded by AREA A (`--gradient-aura`, `--shadow-glow`, `--shadow-focus`, `--ease-out`, `--ease-spring`, `--dur-*`, `--radius-pill`, `--accent-active`, `--bg-surface`).
**Interfaces:** Consumes `--gradient-aura`/`--shadow-glow`/`--shadow-focus`/`--ease-out`/`--ease-spring`/`--dur-quick`/`--dur-normal`/`--radius-pill`/`--accent-active`/`--bg-surface` (AREA A tokens). Produces `.onda-aura` (+ `--xs`/`--sm`/`--lg`, `.is-quiet`/`.is-thinking`/`.has-unseen`) for AREA B (topbar orb `#ondaAura`, sidebar wordmark mark) and AREA C/E (hint-header marks).

- [ ] Step 1: Read the current tail of `app/src/style.css` (last ~30 lines) so the new block appends cleanly after the final rule.
- [ ] Step 2: Append this COMPLETE block at end of `app/src/style.css`. Base `.onda-aura` is a purely visual mark (no cursor/hover); interactivity is scoped to `button.onda-aura` so the decorative small marks stay static. `--ease-spring` is used ONLY here, per contract.

```css
/* ============================================================
   Onda primitives — Aura orb (signature element)
   ============================================================ */
.onda-aura {
  --aura-size: 46px;
  position: relative;
  width: var(--aura-size);
  height: var(--aura-size);
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--gradient-aura);
  box-shadow: var(--shadow-glow);
}
/* size modifiers: --sm 20px (wordmark), --xs 14px (hint headers), --lg 64px */
.onda-aura--lg { --aura-size: 64px; }
.onda-aura--sm {
  --aura-size: 20px;
  box-shadow: 0 0 0 1px rgba(142, 195, 230, 0.35), 0 2px 8px rgba(127, 184, 222, 0.3);
}
.onda-aura--xs {
  --aura-size: 14px;
  box-shadow: 0 0 0 1px rgba(142, 195, 230, 0.35);
}

/* interactive orb (the #ondaAura agent toggle is a <button>) */
button.onda-aura {
  cursor: pointer;
  transition:
    transform var(--dur-quick) var(--ease-out),
    box-shadow var(--dur-normal) var(--ease-out);
}
button.onda-aura:hover { transform: scale(1.04); }
button.onda-aura:active { transform: scale(0.97); }
button.onda-aura:focus-visible {
  outline: none;
  box-shadow: var(--shadow-glow), var(--shadow-focus);
}

/* states: quiet (still) vs. thinking (calm breathe on --ease-spring, no bounce) */
.onda-aura.is-quiet { animation: none; }
.onda-aura.is-thinking {
  animation: onda-aura-breathe 3.2s var(--ease-spring) infinite;
}
@keyframes onda-aura-breathe {
  0%, 100% { transform: scale(1); box-shadow: var(--shadow-glow); }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 0 1px rgba(142, 195, 230, 0.45), 0 6px 30px rgba(127, 184, 222, 0.45);
  }
}

/* unseen-initiative dot */
.onda-aura.has-unseen::after {
  content: "";
  position: absolute;
  top: -1px;
  right: -1px;
  width: 9px;
  height: 9px;
  border-radius: var(--radius-pill);
  background: var(--accent-active);
  box-shadow: 0 0 0 2px var(--bg-surface);
}

@media (prefers-reduced-motion: reduce) {
  .onda-aura,
  .onda-aura.is-thinking { animation: none; transition: none; }
  button.onda-aura:hover,
  button.onda-aura:active { transform: none; }
}
```

- [ ] Step 3: Remove the now-dead `.agent-presence` reskin (the old ◌ glyph, `app/src/style.css:1280-1288` — both `.agent-presence` and `.agent-presence[aria-expanded="true"]` rules). The orb replaces it entirely. Leave `.icon-button` (1254-1278) untouched — AREA B/C decide its migration.
- [ ] Step 4: Verify: `cd app && npm run build` (expect no esbuild errors — CSS is not bundled but this confirms the tree still builds). Then open the app via browser-preview and check the topbar `#ondaAura` renders as a round warm-blue gradient orb with a soft glow ring; add `is-thinking` in devtools and confirm a slow calm breathe (no jarring bounce); add `has-unseen` and confirm a small accent dot at top-right.
- [ ] Step 5: Commit: `git add app/src/style.css && git commit -m "feat(onda): Aura orb primitive CSS (.onda-aura) mit Zuständen und Unseen-Punkt"`.

---

### Task D-2: Reusable control primitives CSS (`.onda-btn` / `.onda-icon-btn` / `.onda-badge` / `.onda-tag`)

**Files:** Modify `app/src/style.css` (append after the Task D-1 block).
**Interfaces:** Consumes AREA A tokens (`--accent`/`--accent-hover`/`--accent-active`/`--on-accent`/`--danger`/`--bg-hover`/`--bg-active`/`--surface-2`/`--surface-inset`/`--success`+`--success-tint`/`--warning`+`--warning-tint`/`--radius-control`/`--radius-pill`/`--shadow-focus`/`--space-*`/`--text-*`/`--fw-*`/`--tracking-*`/`--border-subtle`/`--text-secondary`/`--text-tertiary`/`--font-sans`/`--font-mono`). Produces `.onda-btn` (+`--ghost`/`--danger`/`--sm`), `.onda-icon-btn`, `.onda-badge` (+`--success`/`--warning`, `.onda-badge__dot`), `.onda-tag` for AREA C (local hints), AREA E (agent widget / evidence / insert menu), AREA B (sidebar `#sidebarCollapse`, `#themeToggle`, `#accentToggle` use `.onda-icon-btn`; `#pvCard` actions use `.onda-btn`).

- [ ] Step 1: Append this COMPLETE block at end of `app/src/style.css` (after Task D-1). Press feedback is `scale(0.98)` + the active token, per contract.

```css
/* ============================================================
   Onda primitives — buttons, icon buttons, badges, tags
   ============================================================ */
.onda-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: 34px;
  padding: 0 var(--space-4);
  border: 0;
  border-radius: var(--radius-control);
  background: var(--accent);
  color: var(--on-accent);
  font: var(--fw-semibold) var(--text-sm)/1 var(--font-sans);
  letter-spacing: var(--tracking-tight);
  white-space: nowrap;
  cursor: pointer;
  transition:
    background var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}
.onda-btn:hover { background: var(--accent-hover); }
.onda-btn:active { background: var(--accent-active); transform: scale(0.98); }
.onda-btn:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.onda-btn:disabled { opacity: 0.5; cursor: default; transform: none; }

.onda-btn--ghost { background: transparent; color: var(--text-secondary); }
.onda-btn--ghost:hover { background: var(--bg-hover); color: var(--text-primary); }
.onda-btn--ghost:active { background: var(--bg-active); }

.onda-btn--danger { background: var(--danger); color: #fff; }
.onda-btn--danger:hover { background: var(--danger); filter: brightness(1.06); }
.onda-btn--danger:active { background: var(--danger); filter: brightness(0.94); transform: scale(0.98); }

.onda-btn--sm { height: 28px; padding: 0 var(--space-3); font-size: var(--text-xs); }

.onda-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: none;
  padding: 0;
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition:
    background var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out);
}
.onda-icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.onda-icon-btn:active { background: var(--bg-active); }
.onda-icon-btn:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.onda-icon-btn svg { width: 18px; height: 18px; }

.onda-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 20px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--surface-2);
  color: var(--text-secondary);
  font: var(--fw-semibold) var(--text-xs)/1 var(--font-sans);
  letter-spacing: var(--tracking-wide);
}
.onda-badge__dot {
  width: 5px;
  height: 5px;
  flex: none;
  border-radius: var(--radius-pill);
  background: currentColor;
}
.onda-badge--success { background: var(--success-tint); color: var(--success); }
.onda-badge--warning { background: var(--warning-tint); color: var(--warning); }

.onda-tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 var(--space-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-control);
  background: var(--surface-inset);
  color: var(--text-tertiary);
  font: var(--fw-medium) var(--text-xs)/1 var(--font-mono);
  letter-spacing: var(--tracking-tight);
}
```

- [ ] Step 2: Add ADOPTION NOTES as a CSS comment directly above the block (for AREA C/E to wire up — these are consumers, not this task's edits): agent chat send button `.agent-chat-send` (workspace.js:751) and `.surface-close` (workspace.js:1364) → `.onda-icon-btn`; primary agent/evidence actions and `.evidence-copy` (style.css:2203) → `.onda-btn`/`.onda-btn--sm`; `.semantic-insert-choice` (style.css:2007) rows keep their layout but adopt `.onda-btn--ghost` hover tokens; local-hint action buttons in AREA C use `.onda-btn--ghost`/`.onda-btn--sm`; finding-kind labels → `.onda-badge` (+`--warning` for risk); source-type chips → `.onda-tag`.
- [ ] Step 3: Verify: `cd app && npm run build` (expect clean build). Browser-preview: temporarily add `<button class="onda-btn">Test</button><button class="onda-btn onda-btn--ghost">Ghost</button><span class="onda-badge onda-badge--warning"><span class="onda-badge__dot"></span>Risiko</span><span class="onda-tag">Quelle</span>` into `#page` in devtools; confirm the accent button uses `--on-accent` text on Sky accent, hover darkens to `--accent-hover`, press scales to 0.98; badge shows a 5px dot; tag reads as a subtle mono chip. Toggle `[data-theme="dark"]` on the root and confirm all four remain legible.
- [ ] Step 4: Commit: `git add app/src/style.css && git commit -m "feat(onda): wiederverwendbare Primitive (.onda-btn/.onda-icon-btn/.onda-badge/.onda-tag)"`.

---

### Task D-3: Orb state wiring (unseen-initiative model + `applyAuraState`) — TDD

**Files:** Modify `app/src/workspace-model.mjs` (add pure `hasUnseenInitiative` after `dismissAgentMessage`, ends line 285). Modify `app/test/workspace-model.test.mjs` (add test, imports at 3-17). Modify `app/src/workspace.js` (import at line 7 block; `elements()` at 155; new helper near `activeAgentMessage` ~1302; call in `refreshWorkspace` after line 1734).
**Interfaces:** Consumes `#ondaAura` (AREA B topbar orb button), `onAgentPresence` toggle body (workspace.js:1869-1885 — reused unchanged), `.onda-aura`/`.is-quiet`/`.is-thinking`/`.has-unseen` (Task D-1). Produces `hasUnseenInitiative(workspace)` + orb state reflection that other areas rely on for the agent-activity signal.

- [ ] Step 1 (RED — model): Read `app/test/workspace-model.test.mjs:1-17` for the import list, then add `hasUnseenInitiative` to the import and append this test. It mirrors `shouldOpenAgentWidget`'s status/dismissed rules: a `status:'new'` message not dismissed, with the widget closed, is "unseen".

```js
test('hasUnseenInitiative flags a new, undismissed message while the widget is closed', () => {
  const workspace = {
    agent: {
      open: false,
      dismissedIds: [],
      messages: [{ id: 'm1', status: 'new', text: 'Hinweis', thread: [] }],
    },
  }
  assert.equal(hasUnseenInitiative(workspace), true)

  workspace.agent.open = true
  assert.equal(hasUnseenInitiative(workspace), false, 'open widget is already seen')

  workspace.agent.open = false
  workspace.agent.dismissedIds = ['m1']
  assert.equal(hasUnseenInitiative(workspace), false, 'dismissed message is not unseen')

  workspace.agent.dismissedIds = []
  workspace.agent.messages[0].status = 'seen'
  assert.equal(hasUnseenInitiative(workspace), false, 'non-new message is not unseen')

  assert.equal(hasUnseenInitiative(null), false)
})
```

Run `cd app && npm test` — expect failure (`hasUnseenInitiative is not exported`).

- [ ] Step 2 (GREEN — model): In `app/src/workspace-model.mjs`, after `dismissAgentMessage` (ends line 285), add:

```js
export function hasUnseenInitiative(workspace) {
  const agent = workspace?.agent
  if (!agent || agent.open) return false
  const dismissed = agent.dismissedIds || []
  return (agent.messages || []).some(
    message => message.status === 'new' && !dismissed.includes(message.id),
  )
}
```

Run `cd app && npm test` — expect the new test to pass (all green).

- [ ] Step 3 (workspace.js — imports): Read `app/src/workspace.js:1-15` to confirm the import block from `./workspace-model.mjs` (it already imports `dismissAgentMessage` at line 7). Add `hasUnseenInitiative,` to that same import list (alphabetical, near `dismissAgentMessage`).
- [ ] Step 4 (workspace.js — remap orb element): In `elements()` change the presence lookup so every existing `ui.agentPresence` reference (aria-expanded at 1734, focus at 1354, click wiring at 1950) now points at the new orb button. Replace line 155:

```js
    agentPresence: document.getElementById('ondaAura'),
```

This reuses `onAgentPresence` (1869-1885) as the toggle body verbatim, satisfying "orb button toggles `#agentWidget`" with zero churn to the handler.

- [ ] Step 5 (workspace.js — state helper): Add this helper immediately above `activeAgentMessage` (line 1302):

```js
function applyAuraState() {
  const orb = elements().agentPresence
  if (!orb) return
  const workspace = activeWorkspace()
  const active = Boolean(workspace?.agent.open)
  const unseen = hasUnseenInitiative(workspace)
  orb.classList.toggle('is-thinking', active)
  orb.classList.toggle('is-quiet', !active)
  orb.classList.toggle('has-unseen', unseen)
  orb.setAttribute(
    'aria-label',
    unseen ? 'Agentengespräch öffnen (neue Anmerkung)' : 'Agentengespräch öffnen',
  )
}
```

- [ ] Step 6 (workspace.js — call in refresh): In `refreshWorkspace`, right after the existing `ui.agentPresence?.setAttribute('aria-expanded', String(workspace.agent.open))` (line 1734), add:

```js
  applyAuraState()
```

- [ ] Step 7: Verify logic: `cd app && npm test` (expect all green, including the D-3 test). Then `npm run build` and open via browser-preview: with the widget closed and an initiative message pending, the orb shows `has-unseen` (accent dot); click `#ondaAura` → `#agentWidget` opens and the orb gains `is-thinking` (calm breathe), dot clears; click again → widget closes, orb returns to `is-quiet`. Enable "reduce motion" in the emulated device and confirm the orb is static.
- [ ] Step 8: Commit: `git add app/src/workspace-model.mjs app/test/workspace-model.test.mjs app/src/workspace.js && git commit -m "feat(onda): Aura-Orb-Zustände (quiet/thinking + Unseen) an Agentaktivität gekoppelt"`.

---

## Phase C — Sidebar content (Struktur, Projektverständnis, Material, footer)

### Task C-1: Add testable `structureHintMap` helper (open-hint dots) — TDD

**Files:**
- Modify `app/src/workspace-model.mjs` (add import at top; add exported function after `resolveFindingPlacement`, ~line 159)
- Modify `app/test/workspace-model.test.mjs` (add import + test)

**Interfaces:**
- Consumes: `isIntegrityCategory` (reasoning-model.mjs), `resolveFindingPlacement` (same file).
- Produces: `structureHintMap(doc, blocks) -> Map<blockId, 'style'|'evidence'>` (consumed by Task C-2). `'evidence'` = finding has sources OR integrity category; `'style'` = formulation/transition hint; evidence wins per block.

- [ ] Step 1: Add an import to the top of `app/src/workspace-model.mjs` (the file currently has NO imports — add as line 1):
```js
import { isIntegrityCategory } from './reasoning-model.mjs'
```
(Safe: reasoning-model.mjs imports nothing, so no cycle.)

- [ ] Step 2: Add the exported helper immediately after `resolveFindingPlacement` (after current line 159):
```js
// Pro Baustein: hat er einen offenen Passage-Hinweis? 'evidence' (Beleg/Integrität)
// schlägt 'style' (Formulierung/Übergang). Rein — für die Struktur-Punkte in der Seitenleiste.
export function structureHintMap(doc, blocks) {
  const map = new Map()
  const findings = doc && Array.isArray(doc.findings) ? doc.findings : []
  for (const finding of findings) {
    if (finding.status !== 'open' || finding.placement !== 'passage' || !finding.target) continue
    const placement = resolveFindingPlacement(finding, blocks)
    if (placement.kind !== 'anchored') continue
    const kind = (Array.isArray(finding.sources) && finding.sources.length) || isIntegrityCategory(finding.category)
      ? 'evidence'
      : 'style'
    if (map.get(placement.block.id) !== 'evidence') map.set(placement.block.id, kind)
  }
  return map
}
```

- [ ] Step 3: Add the import of `structureHintMap` to the existing import block in `app/test/workspace-model.test.mjs` (add the name to the `from '../src/workspace-model.mjs'` list), then append this test:
```js
test('structureHintMap: evidence dot beats style dot per block', () => {
  const blocks = [
    { id: 'b-1', text: 'Weiser und Brown prägten den Begriff 1996.' },
    { id: 'b-2', text: 'Der Satz schwächt gleich zweifach ab.' },
    { id: 'b-3', text: 'Kein Hinweis hier.' },
  ]
  const doc = { findings: [
    { id: 'f1', status: 'open', placement: 'passage', target: '1996', blockId: 'b-1', category: 'source', sources: [{ label: 'x' }] },
    { id: 'f2', status: 'open', placement: 'passage', target: 'zweifach ab', blockId: 'b-2', category: 'wording' },
    { id: 'f3', status: 'open', placement: 'passage', target: 'prägten', blockId: 'b-1', category: 'wording' }, // style on same block as evidence
    { id: 'f4', status: 'resolved', placement: 'passage', target: 'Kein Hinweis', blockId: 'b-3', category: 'source', sources: [{ label: 'y' }] }, // not open -> ignored
  ] }
  const map = structureHintMap(doc, blocks)
  assert.equal(map.get('b-1'), 'evidence') // evidence wins over the later style finding
  assert.equal(map.get('b-2'), 'style')
  assert.equal(map.has('b-3'), false)
})
```

- [ ] Step 4: Verify: run `cd app && npm test`. Expect all tests pass including the new `structureHintMap` case.

- [ ] Step 5: Commit: `git add app/src/workspace-model.mjs app/test/workspace-model.test.mjs && git commit` — message: `feat(onda): structureHintMap für Struktur-Punkte in der Seitenleiste`.

---

### Task C-2: Render the Struktur nav into `#structureNav` (supersedes the old shelf)

**Files:** Modify `app/src/workspace.js` — imports (lines 1–15); module var (`shelfRenderState`, line 45); REMOVE old shelf fns (`createShelfBlockNodes`/`updateShelfBlockNodes`/`rebuildStructureShelf`/`renderStructureShelf`, lines 405–480); refreshWorkspace call site (line 1747); destroy reset (line 2000).

**Interfaces:**
- Consumes from Area B: `nav#structureNav.onda-side-section` exists and contains the `STRUKTUR` eyebrow as a direct child (I inject a `.structure-nav-list` sibling and never touch the eyebrow). Consumes existing `focusBlock`, `getEditorBlocks`, `ROLE_LABELS`, `createNode`.
- Consumes from Task C-1: `structureHintMap`.
- Produces: `renderStructureNav()` (called by refreshWorkspace); reuses `.block-preview` + `.block-preview-excerpt` + `.block-preview-role` markup so `focusBlock` keeps working; adds `.block-preview-hint` dot node.

- [ ] Step 1: Extend the workspace-model import (current line 3–13) to also import `structureHintMap`:
```js
import {
  appendThreadMessage,
  completeEditingFinding,
  createEditingFindingState,
  dismissAgentMessage,
  ensureWorkspaceState,
  reconcileEditingFinding,
  resolveFindingBlock,
  resolveFindingPlacement,
  shouldOpenAgentWidget,
  structureHintMap,
} from './workspace-model.mjs'
```

- [ ] Step 2: Rename the module var at line 45 from `let shelfRenderState = null` to:
```js
let structureNavState = null
```
And in `instance.destroy` (line 2000) change `shelfRenderState = null` to `structureNavState = null`.

- [ ] Step 3: DELETE the four old shelf functions in one block (current lines 405–480): `createShelfBlockNodes`, `updateShelfBlockNodes`, `rebuildStructureShelf`, `renderStructureShelf`. Replace them with the new nav renderer:
```js
function createNavBlockNode(block) {
  const preview = createNode('button', 'block-preview')
  preview.type = 'button'
  preview.dataset.blockId = block.id
  const excerpt = createNode('span', 'block-preview-excerpt')
  const role = createNode('span', 'block-preview-role')
  const hint = createNode('span', 'block-preview-hint')
  hint.setAttribute('aria-hidden', 'true')
  preview.append(excerpt, role, hint)
  preview.addEventListener('click', () => focusBlock(block.id))
  return { preview, excerpt, role, hint }
}

function updateNavBlockNode(nodes, block, activeBlockId, hintKind) {
  const roleLabel = ROLE_LABELS.get(block.role) || 'Freier Absatz'
  const excerpt = block.excerpt || 'Noch leer'
  const hintLabel = hintKind === 'evidence'
    ? ' — Beleg offen'
    : hintKind === 'style' ? ' — Formulierung offen' : ''
  nodes.preview.setAttribute('aria-label', `${roleLabel}: ${excerpt}${hintLabel}`)
  if (block.id === activeBlockId) nodes.preview.setAttribute('aria-current', 'true')
  else nodes.preview.removeAttribute('aria-current')
  nodes.excerpt.textContent = excerpt
  nodes.excerpt.classList.toggle('is-empty', !block.excerpt)
  nodes.role.textContent = roleLabel
  nodes.preview.classList.toggle('has-hint', Boolean(hintKind))
  nodes.hint.dataset.hint = hintKind || ''
}

function rebuildStructureNav(list, doc, blocks) {
  const blockNodes = new Map()
  const children = []
  if (!blocks.length) children.push(createNode('p', 'structure-nav-empty', 'Noch keine Textabschnitte.'))
  blocks.forEach(block => {
    const nodes = createNavBlockNode(block)
    blockNodes.set(block.id, nodes)
    children.push(nodes.preview)
  })
  list.replaceChildren(...children)
  structureNavState = { docId: doc.id, ids: blocks.map(block => block.id), blockNodes }
}

function renderStructureNav() {
  const nav = document.getElementById('structureNav')
  const workspace = activeWorkspace()
  if (!nav || !workspace) return
  const doc = ctx.activeDoc()
  if (!doc) return
  let list = nav.querySelector('.structure-nav-list')
  if (!list) { list = createNode('div', 'structure-nav-list'); nav.append(list) }

  const blocks = getEditorBlocks(ctx.editor).filter(block => block.id)
  const ids = blocks.map(block => block.id)
  const orderChanged = structureNavState?.docId !== doc.id
    || structureNavState.ids.length !== ids.length
    || ids.some((id, index) => structureNavState.ids[index] !== id)
  if (orderChanged) rebuildStructureNav(list, doc, blocks)

  const hints = structureHintMap(doc, blocks)
  blocks.forEach(block => {
    const nodes = structureNavState.blockNodes.get(block.id)
    if (nodes) updateNavBlockNode(nodes, block, workspace.activeBlockId, hints.get(block.id) || null)
  })
}
```

- [ ] Step 4: In `refreshWorkspace`, replace the `renderStructureShelf()` call (line 1747) with `renderStructureNav()`. Leave the surrounding `renderLocalFinding()/renderAgentWidget()/…` calls unchanged. (The obsolete `setLayerVisibility(ui.shelf,…)`/`is-shelf-open` lines are Area B's frame cleanup; they no-op safely if `ui.shelf` is null, so this task does not depend on their removal.)

- [ ] Step 5: Verify (build): `cd app && npm run build` — expect no bundler errors. Then `npm test` — expect green (no logic regressions).

- [ ] Step 6: Verify (browser-preview): serve `app/` and open the writing view of "Beispiel: Calm Technology". Expect: `#structureNav` shows one `.block-preview` per editor block (excerpt + uppercase role); clicking a card scrolls to and selects that block in the editor (focusBlock); the paragraph anchoring the "Doppelt abgeschwächt" formulation finding shows a `.block-preview-hint` accent dot, and a block anchoring a source/integrity finding shows an amber dot. Confirm the `STRUKTUR` eyebrow above the list is untouched after edits.

- [ ] Step 7: Update the structure-nav smoke assertions in `app/test/v2-smoke.mjs` (this harness runs separately from `npm test`): swap the locators `#structureShelf .block-preview` → `#structureNav .block-preview` and drop the shelf open/close (`#workspacePath` click / `#structureShelf` hidden) pre-steps for the structure-list checks, since structure is now always visible. Coordinate with Area B (which owns removing the remaining shelf-toggle/`#agentPresence` assertions). Run note: `node test/v2-smoke.mjs` against a running preview server.

- [ ] Step 8: Commit: `git add app/src/workspace.js app/test/v2-smoke.mjs && git commit` — message: `feat(onda): Struktur-Nav in Seitenleiste mit Hinweis-Punkten (ersetzt Ablage)`.

---

### Task C-3: Projektverständnis card `#pvCard` + JS-built modal `#pvModal`

**Files:** Modify `app/src/workspace.js` — imports (line 1–2 area); add module vars near line 45–59; add render + dialog + modal functions (near the other render fns); add render call in refreshWorkspace; wire click in initWorkspace listen block (~1948–1964); add cleanup in destroy.

**Interfaces:**
- Consumes from Area B: `button#pvCard` shell (empty) and the `PROJEKTVERSTÄNDNIS` eyebrow exist inside a `.onda-side-section`.
- Consumes: `ensureProjectUnderstanding` (reasoning-model.mjs), `ctx.activeProjectObj`, `ctx.scheduleSave`.
- Produces: `renderProjectUnderstandingCard()`; reusable `openOndaDialog()`/`closeOndaDialog()` (also used by Task C-4); `openProjectUnderstandingModal()`. Field mapping (from `UNDERSTANDING_DEFAULTS`): Aufgabe→`task` (string), Zielgruppe→`audience` (array, comma-edit), Beabsichtigte Wirkung→`desiredEffect` (string), Belegstandard→`evidenceStandard` (string), Geschützte Absicht→`protectedIntentions` (array, line-edit), Offene Frage→`openQuestions` (array, line-edit).

- [ ] Step 1: Add `ensureProjectUnderstanding` to the reasoning-model import (current line 2):
```js
import { decideFinding, ensureProjectUnderstanding, getFindingQueue, isIntegrityCategory } from './reasoning-model.mjs'
```

- [ ] Step 2: Add module-level state near the other UI vars (after line 45):
```js
let ondaDialog = null
```

- [ ] Step 3: Add the reusable Onda dialog helper (focus-trap + Esc + scrim) and the card renderer + modal. Place near the other render functions:
```js
function closeOndaDialog({ restoreFocus = true } = {}) {
  if (!ondaDialog) return false
  const { scrim, opener, keyHandler } = ondaDialog
  document.removeEventListener('keydown', keyHandler, true)
  scrim.remove()
  ondaDialog = null
  if (restoreFocus && opener?.isConnected) opener.focus()
  return true
}

function dialogFocusables(panel) {
  return [...panel.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')]
    .filter(node => !node.disabled && node.offsetParent !== null)
}

function openOndaDialog({ id, title, opener, build }) {
  closeOndaDialog({ restoreFocus: false })
  const scrim = createNode('div', 'onda-dialog-scrim')
  const panel = createNode('section', 'onda-dialog')
  panel.id = id
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  const titleId = `${id}-title`
  panel.setAttribute('aria-labelledby', titleId)

  const header = createNode('header', 'onda-dialog-header')
  const heading = createNode('h2', 'onda-dialog-title', title)
  heading.id = titleId
  const close = createNode('button', 'onda-icon-btn onda-dialog-close', '×')
  close.type = 'button'
  close.setAttribute('aria-label', 'Schließen')
  close.addEventListener('click', () => closeOndaDialog())
  header.append(heading, close)

  const body = createNode('div', 'onda-dialog-body')
  build(body)
  panel.append(header, body)
  scrim.append(panel)
  scrim.addEventListener('pointerdown', event => { if (event.target === scrim) closeOndaDialog() })

  const keyHandler = event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeOndaDialog(); return }
    if (event.key !== 'Tab') return
    const items = dialogFocusables(panel)
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  document.addEventListener('keydown', keyHandler, true)
  document.getElementById('editorView').append(scrim)
  ondaDialog = { scrim, panel, opener: opener || document.activeElement, keyHandler }
  requestAnimationFrame(() => { (dialogFocusables(panel)[0] || close).focus({ preventScroll: true }) })
  return panel
}

function renderProjectUnderstandingCard() {
  const card = document.getElementById('pvCard')
  if (!card) return
  const project = ctx.activeProjectObj()
  const understanding = project ? ensureProjectUnderstanding(project) : null
  const task = understanding?.task?.trim() || ''
  const effect = understanding?.desiredEffect?.trim() || ''
  card.setAttribute('aria-haspopup', 'dialog')
  card.classList.toggle('is-empty', !task)
  card.replaceChildren(
    createNode('span', 'onda-pv-card-title', task || 'Projektverständnis öffnen'),
    createNode('span', 'onda-pv-card-claim', effect || 'Aufgabe, Zielgruppe und beabsichtigte Wirkung festhalten'),
  )
}

function splitList(value, byLine) {
  return String(value || '').split(byLine ? /\r?\n/ : ',').map(part => part.trim()).filter(Boolean)
}

function understandingField(body, label, value, onCommit, { line = false } = {}) {
  const row = createNode('div', 'onda-pv-field')
  row.append(createNode('span', 'onda-pv-label', label))
  const field = createNode('textarea', 'onda-pv-input')
  field.rows = line ? 3 : 2
  field.value = value
  field.setAttribute('aria-label', label)
  field.addEventListener('input', () => onCommit(field.value))
  row.append(field)
  body.append(row)
}

function openProjectUnderstandingModal(opener) {
  const project = ctx.activeProjectObj()
  if (!project) return
  const u = ensureProjectUnderstanding(project)
  const commit = () => { ctx.scheduleSave(); renderProjectUnderstandingCard() }
  openOndaDialog({ id: 'pvModal', title: 'Projektverständnis', opener, build: body => {
    understandingField(body, 'Aufgabe', u.task, value => { u.task = value; commit() })
    understandingField(body, 'Zielgruppe', u.audience.join(', '), value => { u.audience = splitList(value, false); commit() })
    understandingField(body, 'Beabsichtigte Wirkung', u.desiredEffect, value => { u.desiredEffect = value; commit() })
    understandingField(body, 'Belegstandard', u.evidenceStandard, value => { u.evidenceStandard = value; commit() })
    understandingField(body, 'Geschützte Absicht', u.protectedIntentions.join('\n'), value => { u.protectedIntentions = splitList(value, true); commit() }, { line: true })
    understandingField(body, 'Offene Frage', u.openQuestions.join('\n'), value => { u.openQuestions = splitList(value, true); commit() }, { line: true })
  }})
}
```

- [ ] Step 4: In `refreshWorkspace`, add `renderProjectUnderstandingCard()` next to `renderStructureNav()` (right after it).

- [ ] Step 5: In `initWorkspace`, add to the `listen(...)` block (~after line 1950):
```js
listen(document.getElementById('pvCard'), 'click', event => openProjectUnderstandingModal(event.currentTarget))
```
And in `instance.destroy` add before the state resets:
```js
closeOndaDialog({ restoreFocus: false })
```

- [ ] Step 6: Verify (build + preview): `cd app && npm run build`. In the browser, open the example project. Expect `#pvCard` shows the task ("Ein kurzer argumentativer Essay …") as title and the desiredEffect as claim. Click it → `#pvModal` opens as an Onda dialog (blurred scrim, rounded panel, glow shadow) with six labeled fields (Aufgabe, Zielgruppe, Beabsichtigte Wirkung, Belegstandard, Geschützte Absicht, Offene Frage) prefilled from `buildExampleUnderstanding`. Editing a field and reopening keeps the value (persisted); Tab cycles within the dialog; Esc and the × and scrim-click all close and return focus to `#pvCard`.

- [ ] Step 7: Commit: `git add app/src/workspace.js && git commit` — message: `feat(onda): Projektverständnis-Kachel + Modal (sechs Felder, Fokus-Falle, Esc)`.

---

### Task C-4: Material entry `#materialSources` (project sources dialog) + footer theme/accent controls

**Files:** Modify `app/src/workspace.js` — add `applySettings` import; add module var + constants; add render + modal + toggle functions; add render/sync calls in refreshWorkspace; wire clicks in initWorkspace; add cleanup in destroy.

**Interfaces:**
- Consumes from Area A: `applySettings()` (ui.js — now also sets `data-accent` and stops overriding `--doc-font/--doc-size`), `state.settings.accent` (default `'sky'`, tolerant load), `state.settings.theme`.
- Consumes from Area B: `button#materialSources`, `button#themeToggle`, `button#accentToggle` shells (and the primitive classes `.onda-badge`, `.onda-tag`, `.onda-icon-btn` provided by the primitives task).
- Produces: `renderMaterialEntry()`, `openProjectSourcesModal()`, `toggleTheme()`/`syncThemeToggle()`, `openAccentMenu()`/`closeAccentMenu()` cycling `settings.accent` across `['sky','sage','blue','clay','lavender','sand']`.

- [ ] Step 1: Add the ui.js import (workspace.js does not currently import ui.js; ui.js does not import workspace.js, so no cycle). Add after the tiptap imports (~line 15):
```js
import { applySettings } from './ui.js'
```

- [ ] Step 2: Add module state + accent constants near the other module vars (after line 45):
```js
let accentMenu = null
const ONDA_ACCENTS = ['sky', 'sage', 'blue', 'clay', 'lavender', 'sand']
const ONDA_ACCENT_LABELS = { sky: 'Himmel', sage: 'Salbei', blue: 'Blau', clay: 'Ton', lavender: 'Lavendel', sand: 'Sand' }
```

- [ ] Step 3: Add the material entry, project-sources modal (reuses `openOndaDialog` from Task C-3), and footer controls. Place near the other render functions:
```js
function renderMaterialEntry() {
  const button = document.getElementById('materialSources')
  if (!button) return
  const project = ctx.activeProjectObj()
  const count = Array.isArray(project?.material) ? project.material.length : 0
  button.setAttribute('aria-haspopup', 'dialog')
  button.replaceChildren(
    createNode('span', 'onda-material-label', 'Quellen im Projekt'),
    createNode('span', 'onda-badge onda-material-count', String(count)),
  )
}

function openProjectSourcesModal(opener) {
  const project = ctx.activeProjectObj()
  const material = Array.isArray(project?.material) ? project.material : []
  openOndaDialog({ id: 'materialModal', title: 'Quellen im Projekt', opener, build: body => {
    if (!material.length) {
      body.append(createNode('p', 'onda-material-empty', 'Noch kein Material im Projekt.'))
      return
    }
    const list = createNode('div', 'onda-material-list')
    material.forEach(item => {
      const entry = createNode('article', 'onda-material-item')
      entry.append(
        createNode('span', 'onda-tag onda-material-kind', item.kind || 'Material'),
        createNode('p', 'onda-material-text', item.text || ''),
      )
      list.append(entry)
    })
    body.append(list)
  }})
}

function syncThemeToggle() {
  const button = document.getElementById('themeToggle')
  if (!button) return
  const dark = document.documentElement.dataset.theme === 'dark'
  button.textContent = dark ? '☀' : '☾'
  button.setAttribute('aria-pressed', String(dark))
  const label = dark ? 'Zu hellem Erscheinungsbild wechseln' : 'Zu dunklem Erscheinungsbild wechseln'
  button.setAttribute('aria-label', label)
  button.title = label
}

function toggleTheme() {
  const settings = ctx.state.settings
  settings.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
  applySettings()
  ctx.persist()
  syncThemeToggle()
}

function closeAccentMenu({ restoreFocus = true } = {}) {
  if (!accentMenu) return false
  const { node, opener, outsideHandler } = accentMenu
  document.removeEventListener('pointerdown', outsideHandler, true)
  node.remove()
  accentMenu = null
  if (restoreFocus && opener?.isConnected) opener.focus()
  return true
}

function openAccentMenu(opener) {
  closeAccentMenu({ restoreFocus: false })
  const settings = ctx.state.settings
  const current = ONDA_ACCENTS.includes(settings.accent) ? settings.accent : 'sky'
  const menu = createNode('div', 'onda-accent-menu')
  menu.setAttribute('role', 'menu')
  menu.setAttribute('aria-label', 'Akzentfarbe wählen')
  ONDA_ACCENTS.forEach(accent => {
    const swatch = createNode('button', 'onda-accent-swatch')
    swatch.type = 'button'
    swatch.setAttribute('role', 'menuitemradio')
    swatch.setAttribute('aria-checked', String(accent === current))
    swatch.dataset.accent = accent
    swatch.title = ONDA_ACCENT_LABELS[accent]
    swatch.setAttribute('aria-label', ONDA_ACCENT_LABELS[accent])
    swatch.classList.toggle('is-current', accent === current)
    swatch.addEventListener('click', () => {
      settings.accent = accent
      applySettings()
      ctx.persist()
      closeAccentMenu()
    })
    menu.append(swatch)
  })
  const outsideHandler = event => {
    if (menu.contains(event.target) || opener.contains(event.target)) return
    closeAccentMenu({ restoreFocus: false })
  }
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeAccentMenu() }
  })
  document.getElementById('editorView').append(menu)
  const rect = opener.getBoundingClientRect()
  const menuRect = menu.getBoundingClientRect()
  menu.style.left = `${Math.max(8, rect.left)}px`
  menu.style.top = `${Math.max(8, rect.top - menuRect.height - 8)}px`
  accentMenu = { node: menu, opener, outsideHandler }
  document.addEventListener('pointerdown', outsideHandler, true)
  menu.querySelector('button')?.focus()
}
```

- [ ] Step 4: In `refreshWorkspace`, add `renderMaterialEntry()` and `syncThemeToggle()` next to the other new render calls (after `renderProjectUnderstandingCard()`).

- [ ] Step 5: In `initWorkspace`, add to the `listen(...)` block:
```js
listen(document.getElementById('materialSources'), 'click', event => openProjectSourcesModal(event.currentTarget))
listen(document.getElementById('themeToggle'), 'click', toggleTheme)
listen(document.getElementById('accentToggle'), 'click', event => openAccentMenu(event.currentTarget))
```
And in `instance.destroy` add (next to the `closeOndaDialog` cleanup from C-3):
```js
closeAccentMenu({ restoreFocus: false })
```

- [ ] Step 6: Verify (build + preview): `cd app && npm run build`. In the example project: `#materialSources` reads "Quellen im Projekt" with a badge count of 4 (the seeded `buildExampleMaterial` items); clicking opens `#materialModal` listing the four items with kind tags (Notiz/PDF/YouTube/Zitat). Click `#themeToggle` (moon) → root flips to dark and the glyph becomes a sun; reload keeps the theme (persisted). Click `#accentToggle` → the 6-swatch popover opens; picking "Salbei" sets `data-accent="sage"` on the root and repaints the accent across the UI; picking "Himmel" removes `data-accent`. Esc/outside-click closes the popover.

- [ ] Step 7: Commit: `git add app/src/workspace.js && git commit` — message: `feat(onda): Material-Eintrag (Quellen-Dialog) + Theme-/Akzent-Umschalter in der Fußzeile`.

---

### Task C-5: CSS for sidebar sections, eyebrow, back link, pvCard, footer, dialogs + block-preview reskin

**Files:** Modify `app/src/style.css` — reskin `.block-preview`/`.block-preview-excerpt`/`.block-preview-role` (current lines 1363–1418, replace values with Onda tokens) and append a new Area-C block for the sidebar sections, dialogs, and accent menu.

**Interfaces:**
- Consumes from Area A: embedded Onda tokens (`--surface`, `--bg-surface`, `--bg-app`, `--bg-hover`, `--border-subtle`/`--border-default`/`--border-strong`, `--accent`/`--accent-tint`/`--accent-active`, `--warning`, `--text-primary/secondary/tertiary`, `--font-sans`, `--fw-*`, `--tracking-*`, `--text-xs/sm/base`, `--space-*`, `--radius-control/card/overlay/panel/full`, `--shadow-sm/lg/xl/focus/glow`, `--dur-quick/normal`, `--ease-out`).
- Consumes from primitives task: `.onda-badge`, `.onda-tag`, `.onda-icon-btn`.
- Purely visual — verified by browser-preview in light and dark.

- [ ] Step 1: Reskin the three `.block-preview` rules (lines 1363–1418) to Onda tokens (replace the property values; keep the selectors). Target result:
```css
.block-preview {
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  background: var(--bg-surface);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition: background var(--dur-quick) var(--ease-out), border-color var(--dur-quick) var(--ease-out), box-shadow var(--dur-quick) var(--ease-out);
}
.block-preview:hover { border-color: var(--border-strong); box-shadow: var(--shadow-sm); }
.block-preview[aria-current="true"] {
  border-color: var(--accent);
  background: var(--accent-tint);
  box-shadow: 0 0 0 1px var(--accent);
}
.block-preview-excerpt {
  min-height: calc(1.5em * 2);
  display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2;
  color: var(--text-primary);
  font: var(--fw-regular) var(--text-sm)/1.5 var(--font-sans);
  overflow-wrap: anywhere;
}
.block-preview-excerpt.is-empty { color: var(--text-tertiary); font-style: italic; }
.block-preview-role {
  color: var(--text-tertiary);
  font: var(--fw-medium) 11px/1.2 var(--font-sans);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}
```
Also update the shared `:focus-visible` rule at line 1389 so `.block-preview` uses the Onda focus ring (add `.block-preview` handling): keep `.block-insert`/`.block-insert-trigger`/`.semantic-insert-choice` on the outline style, and add
```css
.block-preview:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
```

- [ ] Step 2: Append the Area-C CSS block at the end of `style.css`:
```css
/* ==================== Onda sidebar sections (Area C) ==================== */
.onda-side-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-4) 0;
}
.onda-eyebrow {
  margin: 0;
  color: var(--text-tertiary);
  font: var(--fw-semibold) 11px/1.2 var(--font-sans);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}

.onda-side-back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin: var(--space-3) var(--space-4) 0;
  padding: var(--space-1) var(--space-2);
  width: fit-content;
  max-width: calc(100% - var(--space-8));
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--text-secondary);
  font: var(--fw-medium) var(--text-sm)/1.3 var(--font-sans);
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: color var(--dur-quick) var(--ease-out), background var(--dur-quick) var(--ease-out);
}
.onda-side-back:hover { color: var(--text-primary); background: var(--bg-hover); }
.onda-side-back:focus-visible { outline: none; box-shadow: var(--shadow-focus); }

/* Projektverständnis-Kachel */
#pvCard {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-card);
  background: var(--bg-surface);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--dur-quick) var(--ease-out), box-shadow var(--dur-quick) var(--ease-out);
}
#pvCard:hover { border-color: var(--border-strong); box-shadow: var(--shadow-sm); }
#pvCard:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.onda-pv-card-title {
  color: var(--text-primary);
  font: var(--fw-semibold) var(--text-base)/1.35 var(--font-sans);
  letter-spacing: var(--tracking-tight);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.onda-pv-card-claim {
  color: var(--text-secondary);
  font: var(--fw-regular) var(--text-sm)/1.45 var(--font-sans);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
#pvCard.is-empty .onda-pv-card-title { color: var(--text-tertiary); }

/* Struktur-Liste + Hinweis-Punkt */
.structure-nav-list { display: flex; flex-direction: column; gap: var(--space-2); }
.structure-nav-empty { margin: 0; color: var(--text-tertiary); font: var(--fw-regular) var(--text-sm)/1.5 var(--font-sans); }
.block-preview-hint {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  background: transparent;
}
.block-preview.has-hint .block-preview-hint[data-hint="style"] { background: var(--accent); }
.block-preview.has-hint .block-preview-hint[data-hint="evidence"] { background: var(--warning); }
/* Punkt braucht Platz neben dem Rollen-Label */
.block-preview.has-hint .block-preview-role { padding-right: var(--space-4); }

/* Material-Eintrag */
#materialSources {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  background: var(--bg-surface);
  color: var(--text-primary);
  font: var(--fw-medium) var(--text-sm)/1.3 var(--font-sans);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--dur-quick) var(--ease-out), background var(--dur-quick) var(--ease-out);
}
#materialSources:hover { border-color: var(--border-strong); background: var(--bg-hover); }
#materialSources:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.onda-material-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.onda-material-count { flex: none; }

/* Fußzeile */
.onda-side-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border-subtle);
}

/* Onda-Dialog (Projektverständnis / Quellen) */
.onda-dialog-scrim {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background: rgba(28, 26, 23, 0.4);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  animation: onda-dialog-fade var(--dur-normal) var(--ease-out);
}
:root[data-theme="dark"] .onda-dialog-scrim { background: rgba(0, 0, 0, 0.55); }
.onda-dialog {
  width: min(560px, 100%);
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-panel);
  background: var(--bg-surface);
  color: var(--text-primary);
  box-shadow: var(--shadow-xl), var(--shadow-glow);
  overflow: hidden;
  animation: onda-dialog-rise var(--dur-normal) var(--ease-out);
}
.onda-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-5) var(--space-3);
}
.onda-dialog-title {
  margin: 0;
  font: var(--fw-bold) 18px/1.3 var(--font-sans);
  letter-spacing: var(--tracking-tight);
}
.onda-dialog-body {
  padding: 0 var(--space-5) var(--space-5);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
@keyframes onda-dialog-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes onda-dialog-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .onda-dialog-scrim, .onda-dialog { animation: none; } }

.onda-pv-field { display: flex; flex-direction: column; gap: var(--space-1); }
.onda-pv-label {
  color: var(--text-tertiary);
  font: var(--fw-semibold) 11px/1.2 var(--font-sans);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}
.onda-pv-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-control);
  background: var(--bg-app);
  color: var(--text-primary);
  font: var(--fw-regular) var(--text-base)/1.5 var(--font-sans);
  resize: vertical;
}
.onda-pv-input:focus-visible { outline: none; border-color: var(--accent); box-shadow: var(--shadow-focus); }

.onda-material-list { display: flex; flex-direction: column; gap: var(--space-3); }
.onda-material-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  background: var(--surface-2);
}
.onda-material-kind { align-self: flex-start; }
.onda-material-text { margin: 0; color: var(--text-primary); font: var(--fw-regular) var(--text-sm)/1.5 var(--font-sans); }
.onda-material-empty { margin: 0; color: var(--text-tertiary); font: var(--fw-regular) var(--text-sm)/1.5 var(--font-sans); }

/* Akzent-Auswahl (Popover) */
.onda-accent-menu {
  position: fixed;
  z-index: 70;
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-overlay);
  background: var(--bg-surface);
  box-shadow: var(--shadow-lg);
}
.onda-accent-swatch {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-full);
  border: 2px solid transparent;
  box-shadow: inset 0 0 0 1px var(--line);
  cursor: pointer;
}
.onda-accent-swatch.is-current { border-color: var(--text-primary); }
.onda-accent-swatch:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.onda-accent-swatch[data-accent="sky"] { background: #79b4dc; }
.onda-accent-swatch[data-accent="sage"] { background: var(--onda-accent-sage-base, #8ba888); }
.onda-accent-swatch[data-accent="blue"] { background: var(--onda-accent-blue-base, #6f9bd1); }
.onda-accent-swatch[data-accent="clay"] { background: var(--onda-accent-clay-base, #c08267); }
.onda-accent-swatch[data-accent="lavender"] { background: var(--onda-accent-lavender-base, #a396cc); }
.onda-accent-swatch[data-accent="sand"] { background: var(--onda-accent-sand-base, #cba86a); }
```
NOTE: only `sky` (#79b4dc) is fixed by the shared contract. Before finishing, replace the five fallback swatch hex values with each accent's exact base from the design `colors.css` `[data-accent="…"] { --accent: … }` blocks that Area A embeds (or, if Area A exposes per-accent base custom properties on `:root`, drop the fallbacks and keep the `var(--onda-accent-*-base)` reference).

- [ ] Step 3: Verify (browser-preview, light): open the writing view. Confirm the sidebar sections read as Onda — uppercase 11px tracked eyebrows, sharp-cornered cards (control 6px / card 8px / panel 18px on the dialog / pill badge), warm paper surfaces, single Sky accent on the active block card and the "Formulierung offen" dot, amber on the "Beleg offen" dot. Open `#pvModal` and `#materialModal` and confirm the panel radius, `--shadow-xl` + `--shadow-glow`, fade+6px rise, and blurred scrim.

- [ ] Step 4: Verify (browser-preview, dark + accents): toggle `#themeToggle` and confirm every Area-C surface is legible in dark (darker scrim override applies); open `#accentToggle` and switch through sage/blue/clay/lavender/sand — the active-block card, dots, focus rings, and dialog glow all follow `data-accent`. Confirm the page body never scrolls horizontally and the sidebar footer stays pinned to the bottom (`margin-top:auto`).

- [ ] Step 5: Commit: `git add app/src/style.css && git commit` — message: `style(onda): Seitenleisten-Sektionen, Kacheln, Dialoge & Akzent-Popover (Onda-Tokens)`.

---

## Phase E — Reskin existing surfaces

### Task E-1: Reskin reading column, title (H1) and block body to Onda
**Files:** Modify `app/src/style.css` (rules `#editorView #page` ~1476, `#editorView #title` ~1484, `#editorView #title::placeholder` ~1490, `#editorView #editor .ProseMirror` ~1495, `#editorView #editor .ProseMirror > [data-block-id]` + `.is-active-block` + `.has-local-finding` ~1509–1523).
**Interfaces:** Consumes `--container-reading`, `--font-sans`, `--fw-semibold`, `--tracking-tight`, `--text-primary`, `--text-tertiary`, `--accent`, `--radius-card`, `--bg-active`, `--accent-tint`, `--warning-tint`, `--dur-quick`, `--ease-out` (Area A). Produces nothing consumed elsewhere (leaf visual rules).

- [ ] Step 1: Locate `#editorView #page` and replace its body with the Onda reading width (contract `--container-reading:680px`):
```css
#editorView #page {
  width: min(calc(100% - 48px), calc(var(--container-reading) + 48px));
  max-width: calc(var(--container-reading) + 48px);
  min-height: 100%;
  margin: 0 auto;
  padding: 64px 24px 38vh;
}
```
- [ ] Step 2: Replace `#editorView #title` with the big Onda H1:
```css
#editorView #title {
  font-family: var(--font-sans);
  font-size: 30px;
  font-weight: var(--fw-semibold);
  line-height: 1.2;
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  margin-bottom: 20px;
}
```
- [ ] Step 3: Replace the placeholder rule `#editorView #title::placeholder, #editorView #editor .ProseMirror p.is-editor-empty:first-child::before { color: var(--v2-text-soft); }` → `color: var(--text-tertiary);` (keep both selectors).
- [ ] Step 4: Replace `#editorView #editor .ProseMirror` with the Onda sans body (contract: writing body is Hanken 16.5px/1.7 — this scoped rule overrides the base `--doc-font`/`--doc-size`, which is required because `applySettings()` no longer sets those):
```css
#editorView #editor .ProseMirror {
  width: 100%;
  font-family: var(--font-sans);
  font-size: 16.5px;
  line-height: 1.7;
  letter-spacing: 0;
  color: var(--text-primary);
  caret-color: var(--accent);
}
```
- [ ] Step 5: Reskin the block wrapper + states. Replace the three `> [data-block-id]` rules:
```css
#editorView #editor .ProseMirror > [data-block-id] {
  position: relative;
  border-radius: var(--radius-card);
  transition: background var(--dur-quick) var(--ease-out), box-shadow var(--dur-quick) var(--ease-out);
}
#editorView #editor .ProseMirror > [data-block-id].is-active-block {
  background: var(--bg-active);
  box-shadow: 0 0 0 8px var(--bg-active);
}
#editorView #editor .ProseMirror > [data-block-id].has-local-finding {
  background: var(--accent-tint);
  box-shadow: 0 0 0 7px var(--accent-tint);
}
```
- [ ] Step 6: Immediately after, add a forward-compatible evidence variant (accent-tint = style is the default above; warning-tint = evidence). Harmless if the class is never applied; Area C may add `.is-evidence` to the finding block when a kind is available:
```css
#editorView #editor .ProseMirror > [data-block-id].has-local-finding.is-evidence {
  background: var(--warning-tint);
  box-shadow: 0 0 0 7px var(--warning-tint);
}
```
- [ ] Step 7: Verify — no rebuild (CSS is linked). Serve and eyeball: `cd app && python3 -m http.server 4321`, open `http://localhost:4321` in the browser preview, enter the writing view, confirm title renders as a large sans H1, body is Hanken 16.5px, the focused block shows a soft warm `--bg-active` halo and a block with a finding shows the sky `--accent-tint` halo. Toggle `[data-theme="dark"]` and confirm colors invert (from Area A tokens) with no hardcoded light values. Run `cd app && npm test` — the v2 smoke test must stay green (no class renamed).
- [ ] Step 8: Commit: `git add app/src/style.css && git commit -m "onda: re-skin reading column, title H1 und Blocktext (Area E-1)"`.

---

### Task E-2: Reskin local hints — gutter card, summary, dialogue, suggestion diff, actions
**Files:** Modify `app/src/style.css` (rules ~1552–1947: `.local-finding*`, `.local-dialogue*`, `.agent-message*` (scoped `#editorView`), `.agent-chat-*`, `.surface-close`, `.local-suggestion`, `.suggestion-*`, `.own-version-*`, `.integrity-risk-*`, `.local-finding-error`).
**Interfaces:** Consumes `--surface`, `--surface-inset`, `--bg-hover`, `--border-subtle`, `--border-strong`, `--text-primary/-secondary/-tertiary`, `--accent`, `--danger-tint`, `--success-tint`, `--radius-panel/-card/-control`, `--shadow-xl`, `--shadow-glow`, `--shadow-focus`, `--focus-ring`, `--font-sans`, `--dur-quick`, `--dur-normal`, `--ease-out` (Area A). Mirrors the look of `.onda-icon-btn`/`.onda-btn--sm` (Area D) on the existing button classes (CSS-only, no JS class changes).

- [ ] Step 1: Add the shared hint entrance keyframes once (near the top of the local-hints block, after `#localAgentLayer.is-paused`):
```css
@keyframes ondaHintIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
```
- [ ] Step 2: Bulk token swap across the whole `.local-finding` … `.local-finding-error` range (~1552–1947), replacing every legacy reference in place: `--v2-text`→`--text-primary`; `--v2-text-soft`→`--text-secondary`; `--v2-surface`→`--surface`; `--v2-surface-soft`→`--bg-hover`; `--v2-canvas`→`--surface-inset`; `--v2-line`→`--border-subtle`; `--v2-line-strong`→`--border-strong`; `--v2-peach`→`--danger-tint`; `--v2-mint`→`--success-tint`; `--sans`→`--font-sans`; `--doc-font`→`--font-sans`; `--ease`→`--ease-out`; the `160ms` literals in `.local-finding-summary`/`.suggestion-action` transitions →`var(--dur-quick)`. Then apply the explicit structural rules in the steps below (they override the swapped versions).
- [ ] Step 3: Turn `.local-finding.is-expanded` into the Onda gutter card (bg-surface, border-subtle, radius-panel, shadow-xl+glow, fade+6px entrance; width stays JS-set by `positionLocalSurface`):
```css
.local-finding.is-expanded {
  padding: 7px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-panel);
  background: var(--surface);
  box-shadow: var(--shadow-xl), var(--shadow-glow);
  animation: ondaHintIn var(--dur-normal) var(--ease-out);
}
```
- [ ] Step 4: Make disclosure/connector read Onda: `.local-finding-connector { background: var(--border-strong); }`; `.local-finding-disclosure { color: var(--text-tertiary); font: 16px/1.2 var(--font-sans); text-align: center; }`. Update the shared focus rule `.local-finding-summary:focus-visible, .suggestion-action:focus-visible` to `outline: 2px solid var(--accent); outline-offset: 2px;` (accent token already Onda).
- [ ] Step 5: Reskin the chat input as an Onda control with focus ring, and the send/close as icon buttons:
```css
.agent-chat-input {
  width: 100%;
  min-width: 0;
  height: 34px;
  padding: 6px 9px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-control);
  background: var(--surface-inset);
  color: var(--text-primary);
  font: 13px/1.4 var(--font-sans);
  letter-spacing: 0;
}
.agent-chat-input:focus {
  border-color: var(--accent);
  outline: none;
  box-shadow: var(--shadow-focus);
}
.agent-chat-send,
.surface-close {
  width: 32px; height: 32px;
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0; border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--text-tertiary);
  font: 17px/1 var(--font-sans);
  transition: color var(--dur-quick) var(--ease-out), background var(--dur-quick) var(--ease-out);
}
.agent-chat-send:hover,
.surface-close:hover { color: var(--text-primary); background: var(--bg-hover); }
```
- [ ] Step 6: Reskin the suggestion diff rows — `bisher` = danger-tint with strike, `neu` = success-tint (spec (2)):
```css
.suggestion-old-change {
  background: var(--danger-tint);
  text-decoration: line-through;
  text-decoration-color: var(--danger);
}
.suggestion-new-change { background: var(--success-tint); }
.suggestion-version-text { font-family: var(--font-sans); font-size: 15px; line-height: 1.55; }
```
- [ ] Step 7: Make `.local-suggestion` an Onda block and the round action buttons match `.onda-btn--sm` (Area D) look:
```css
.local-suggestion {
  min-width: 0;
  padding: 13px 0 10px;
  border-top: 1px solid var(--border-default);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--surface-2);
  animation: ondaHintIn var(--dur-normal) var(--ease-out);
}
.suggestion-action {
  width: 30px; height: 30px;
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0; border: 0; border-radius: var(--radius-pill);
  background: transparent; color: var(--text-tertiary);
  font: 16px/1 var(--font-sans);
  transition: color var(--dur-quick) var(--ease-out), background var(--dur-quick) var(--ease-out);
}
.suggestion-action:hover { color: var(--text-primary); background: var(--bg-hover); }
```
(`--border-default`, `--surface-2`, `--radius-pill` are Area A tokens.)
- [ ] Step 8: Confirm the remaining swapped rules read correctly — `.integrity-risk-confirm` should keep its inverted look via `background: var(--text-primary); color: var(--surface);`, and `.local-finding-error` uses `border-left: 2px solid var(--border-strong); background: var(--surface-2);`.
- [ ] Step 9: Verify (no rebuild): reload the served app, open a document with an active finding, expand a hint. Confirm: the card is a warm floating panel (18px corners, soft shadow + sky glow), it fades up 6px on open, the input has a pill-less rounded control with a sky focus ring, the diff shows struck red `bisher` vs green `neu`, and the round action buttons hover to a warm fill. Check light + dark.
- [ ] Step 10: Commit: `git add app/src/style.css && git commit -m "onda: re-skin lokale Hinweise, Vorschlags-Diff und Aktionen (Area E-2)"`.

---

### Task E-3: Reskin the agent widget to an Onda floating panel + pill composer
**Files:** Modify `app/src/style.css` (shared base `#agentWidget, #evidenceWindow` ~2024–2036; `#agentWidget` ~2038; `.agent-widget-header`/`.evidence-header` ~2053; `.agent-widget-title`/`.evidence-title` ~2064; `.agent-widget-messages` ~2071; `.agent-widget-form` ~2079; `.unplaced-findings*` ~2085–2104; `.agent-widget-empty`/`.evidence-empty` ~2106).
**Interfaces:** Consumes `--surface`, `--surface-2`, `--border-subtle`, `--text-primary/-secondary/-tertiary`, `--fw-semibold`, `--accent`, `--on-accent`, `--accent-hover`, `--radius-panel/-pill/-control`, `--shadow-xl`, `--shadow-glow`, `--shadow-focus`, `--font-sans`, `--dur-normal`, `--ease-out` (Area A).

- [ ] Step 1: Reskin the shared floating-surface base — replace the body of `#agentWidget, #evidenceWindow` so it is an Onda panel with the warm shadow + sky glow and a fade entrance (keep the existing position/size/overflow lines; change only surface/border/radius/shadow and add animation):
```css
#agentWidget,
#evidenceWindow {
  position: fixed;
  z-index: 45;
  right: 20px;
  width: min(380px, calc(100vw - 40px));
  max-height: min(620px, calc(100dvh - 104px));
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-xl), var(--shadow-glow);
  animation: ondaHintIn var(--dur-normal) var(--ease-out);
}
```
- [ ] Step 2: Token-swap the header/title/form/unplaced/empty rules: `.agent-widget-header, .evidence-header { border-bottom: 1px solid var(--border-subtle); }`; `.agent-widget-title, .evidence-title { color: var(--text-primary); font-weight: var(--fw-semibold); }`; `.agent-widget-form { border-top: 1px solid var(--border-subtle); }`; `.unplaced-findings { border-bottom: 1px solid var(--border-subtle); background: var(--surface-2); }`; `.unplaced-finding-kind` and `.agent-widget-empty, .evidence-empty` colors → `--text-tertiary` / `--text-secondary` respectively (drop the `color-mix` on unplaced bg).
- [ ] Step 3: Make the agent-widget composer a pill with a round accent send button (spec (3)) — scope to `.agent-widget-form` so the local-dialogue composer keeps its plain control:
```css
.agent-widget-form .agent-chat-input {
  height: 38px;
  border-radius: var(--radius-pill);
  padding: 6px 14px;
}
.agent-widget-form .agent-chat-send {
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: var(--on-accent);
}
.agent-widget-form .agent-chat-send:hover {
  background: var(--accent-hover);
  color: var(--on-accent);
}
```
- [ ] Step 4: Verify (no rebuild): reload, open the agent (via the Aura toggle once Area B wires `#ondaAura`, or by triggering an agent message). Confirm the widget is a warm rounded panel with soft glow that fades in, the header title is semibold, and the composer is a pill with a round sky send button that hovers darker. Check light + dark.
- [ ] Step 5: Commit: `git add app/src/style.css && git commit -m "onda: re-skin Agent-Widget als Panel mit Pill-Composer (Area E-3)"`.

---

### Task E-4: Reskin the evidence window — claim block, source cards, badge/tag, mono citation
**Files:** Modify `app/src/style.css` (`#evidenceWindow` ~2046; `.evidence-context`/`.evidence-claim` ~2114–2127; `.evidence-sources`/`.evidence-source*` ~2129–2195; `.evidence-citation`/`.evidence-copy` ~2197–2223; `.evidence-source-link` ~2225–2233; `.agent-message-role, .evidence-kicker, .evidence-excerpt-label` ~1695).
**Interfaces:** Consumes `--surface`, `--surface-inset`, `--surface-2`, `--bg-app`, `--border-subtle`, `--border-default`, `--text-primary/-secondary/-tertiary`, `--text-link`, `--accent`, `--accent-tint`, `--success`, `--success-tint`, `--warning`, `--warning-tint`, `--radius-card/-control/-pill`, `--font-sans`, `--font-mono`, `--tracking-wide`, `--dur-quick`, `--ease-out` (Area A). Mirrors `.onda-badge`/`.onda-tag` (Area D) on the existing verification/type spans.

- [ ] Step 1: The panel base is inherited from Task E-3. In the `#evidenceWindow` rule keep only the position/width/overflow overrides (`top`, `right`, `width`, `overflow-y`) — remove any leftover `background`/`border`/`box-shadow`/`border-radius` here so it does not fight the shared base.
- [ ] Step 2: Reskin the claim block with an accent left border (spec (4)):
```css
.evidence-context {
  display: grid; gap: 5px;
  padding: 16px;
  border-bottom: 1px solid var(--border-subtle);
  border-left: 3px solid var(--accent);
  background: var(--accent-tint);
}
.evidence-claim { margin: 0; color: var(--text-primary); font: 15px/1.5 var(--font-sans); overflow-wrap: anywhere; }
```
Swap the muted labels: `.agent-message-role, .evidence-kicker, .evidence-excerpt-label { color: var(--text-tertiary); }`.
- [ ] Step 3: Turn each source into an inset Onda card (spec: “source cards, bg-app inset, radius-card”) — remove the per-row bottom border and give cards their own surface + spacing:
```css
.evidence-sources { display: grid; gap: 10px; padding: 12px 16px 16px; }
.evidence-source {
  min-width: 0; display: grid; gap: 7px;
  padding: 14px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
  background: var(--surface-inset);
}
.evidence-source:last-child { border-bottom: 1px solid var(--border-subtle); }
.evidence-source-label { color: var(--text-primary); font: 500 13px/1.45 var(--font-sans); overflow-wrap: anywhere; }
.evidence-source-preview { margin: 0; color: var(--text-primary); font: 13px/1.55 var(--font-sans); overflow-wrap: anywhere; }
```
- [ ] Step 4: Reskin the verification state as an `.onda-badge`-style pill and the source type as an `.onda-tag`-style pill (CSS-only mirror of Area D primitives):
```css
.evidence-source-verification {
  justify-self: start;
  display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 9px;
  border-radius: var(--radius-pill);
  background: var(--success-tint);
  color: var(--success);
  font: 500 11px/1.4 var(--font-sans);
  letter-spacing: var(--tracking-wide);
}
.evidence-source-verification.is-demo,
.evidence-source-verification.is-unverified {
  background: var(--warning-tint);
  color: var(--warning);
}
.evidence-source-type {
  justify-self: start;
  display: inline-flex; align-items: center;
  padding: 2px 9px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-default);
  background: var(--surface-2);
  color: var(--text-secondary);
  font: 11px/1.4 var(--font-sans);
}
```
(Delete the old hardcoded `color: #6d5a2d` on `.is-demo/.is-unverified`.)
- [ ] Step 5: Make the citation monospace and the copy button an Onda ghost `--sm` button (spec: “citation mono + copy”):
```css
.evidence-source-citation {
  margin: 0;
  color: var(--text-primary);
  font: 12px/1.5 var(--font-mono);
  overflow-wrap: anywhere;
}
.evidence-copy {
  width: fit-content;
  padding: 5px 10px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--text-secondary);
  font: 11px/1.35 var(--font-sans);
  transition: color var(--dur-quick) var(--ease-out), border-color var(--dur-quick) var(--ease-out), background var(--dur-quick) var(--ease-out);
}
.evidence-copy:hover,
.evidence-copy:focus-visible { border-color: var(--border-strong); color: var(--text-primary); background: var(--bg-hover); }
```
- [ ] Step 6: Swap remaining refs: `.evidence-source-note-text, .evidence-source-citation` text color already handled; `.evidence-source-link { color: var(--text-link); }`; `.evidence-source-type`/`-verification`/`-note-label` muted colors → `--text-tertiary` where they were `--v2-text-soft`; `.evidence-source` separators use `--border-subtle`.
- [ ] Step 7: Verify (no rebuild): reload, open a finding that has sources (the evidence window opens). Confirm: claim sits in a sky-tinted block with an accent left rule; each source is an inset card; the verification shows a green “Verifiziert” badge or amber “Nicht verifiziert / Demoquelle” badge; the type is an outlined tag pill; the citation is monospace; the copy button is a ghost pill. Check light + dark.
- [ ] Step 8: Commit: `git add app/src/style.css && git commit -m "onda: re-skin Belegfenster mit Quellenkarten, Badge/Tag, Mono-Zitat (Area E-4)"`.

---

### Task E-5: Reskin the semantic insert overlay + block-insert trigger
**Files:** Modify `app/src/style.css` (`.block-insert-trigger` ~1949–1991; `.semantic-insert-menu` ~1993–2005; `.semantic-insert-choice` ~2007–2022).
**Interfaces:** Consumes `--surface`, `--bg-hover`, `--border-subtle`, `--border-default`, `--text-primary/-tertiary`, `--radius-overlay/-control/-pill`, `--shadow-sm`, `--shadow-lg`, `--font-sans`, `--dur-quick`, `--dur-quick`/`--ease-out` (Area A).

- [ ] Step 1: Reskin the “+” trigger to an Onda round control (keep the opacity/pointer-events state logic and media query unchanged — swap only the visual props):
```css
.block-insert-trigger {
  position: absolute;
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--text-tertiary);
  box-shadow: var(--shadow-sm);
  font: 17px/1 var(--font-sans);
  opacity: 0; pointer-events: none;
  transition: opacity var(--dur-quick) var(--ease-out), color var(--dur-quick) var(--ease-out), background var(--dur-quick) var(--ease-out);
}
.block-insert-trigger:hover { color: var(--text-primary); background: var(--bg-hover); }
```
Leave `.block-insert-trigger.is-block-hovered/:focus-visible/.is-typing` and the `@media (hover:none)` rule as-is except swapping `--v2-line-strong`→`--border-default` inside the media query.
- [ ] Step 2: Reskin the menu as an Onda overlay (radius-overlay 10px, shadow-lg) with a fade entrance:
```css
.semantic-insert-menu {
  position: fixed;
  z-index: 55;
  width: 214px;
  padding: 5px;
  display: flex; flex-direction: column; gap: 1px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-overlay);
  background: var(--surface);
  box-shadow: var(--shadow-lg);
  animation: ondaHintIn var(--dur-quick) var(--ease-out);
}
```
- [ ] Step 3: Reskin the choices:
```css
.semantic-insert-choice {
  width: 100%;
  min-height: 34px;
  padding: 7px 10px;
  border-radius: var(--radius-control);
  color: var(--text-primary);
  background: transparent;
  font: 13px/1.35 var(--font-sans);
  letter-spacing: 0;
  text-align: left;
}
.semantic-insert-choice:hover,
.semantic-insert-choice:focus-visible { background: var(--bg-hover); }
```
- [ ] Step 4: Verify (no rebuild): reload, hover a block to reveal the round “+” (warm surface, soft shadow), click it, confirm the menu is a warm overlay with 10px corners and `--shadow-lg` that fades in, and choices highlight on hover with `--bg-hover`. Check light + dark. Re-run `cd app && npm test` to confirm no class-name regressions across E-1…E-5.
- [ ] Step 5: Commit: `git add app/src/style.css && git commit -m "onda: re-skin semantisches Einfügemenü und Block-Trigger (Area E-5)"`.

---

**Cross-area notes for the assembler:**
- These rules now read Area A's Onda `:root` tokens; the legacy `[data-theme="dark"] #editorView { --v2-* }` and light `#editorView { --v2-* }` blocks in `app/index.html` are no longer consumed by the writing surface and should be dropped by Area B's frame rebuild.
- The gutter card **width** (spec 314px) and the card **header row** (small Aura + “Hinweis · <kind>” + close icon-btn) are DOM/JS concerns of Area C (`positionLocalSurface` sets inline width; `renderLocalFinding` builds the summary) — Area E provides only the card's surface/shadow/animation; the `.has-local-finding.is-evidence` warning-tint hook (E-1 Step 6) is ready if Area C emits the kind.
- Verification is visual only (CSS is linked, not bundled — no `npm run build` needed for these changes); `npm test` is used purely as a class-name regression gate.

---

## Phase F — Motion, accessibility, responsive, tests

### Task F-1: Motion — standard entrance, token durations, spring-only-Aura, reduced-motion coverage

**Files:** Modify `app/src/style.css` (add keyframe near existing `@keyframes pulse` at line 461; add entrance rule; edit reduced-motion block at lines 2394–2403). Verify: browser-preview + grep.

**Interfaces:**
- Consumes (Area A tokens): `--dur-fast`, `--dur-quick`, `--dur-normal`, `--dur-slow`, `--ease-out`, `--ease-spring`.
- Consumes (Area C): `#pvModal` contains a dialog element with `role="dialog"`.
- Produces: `@keyframes onda-rise` + a documented entrance convention other areas apply to new surfaces; reduced-motion coverage that includes the body-portaled modal.

- [ ] Step 1: Add the standard entrance keyframe. Insert immediately after `@keyframes pulse { 50% { opacity: .35; } }` (line 461):
```css
@keyframes onda-rise {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
```
- [ ] Step 2: Apply the entrance to the pop-in surfaces (menus, passage feedback, PV modal). Add a new rule directly below the keyframe:
```css
.semantic-insert-menu,
.local-finding,
.local-suggestion,
#pvModal [role="dialog"] {
  animation: onda-rise var(--dur-normal) var(--ease-out) both;
}
```
(Do NOT animate `#structureNav .block-preview` — the structure list re-renders on every keystroke and would flicker. Agent/evidence panels keep their transition-based reveal owned by Area E.)
- [ ] Step 3: Guarantee `--ease-spring` is used ONLY by the Aura orb. Run `grep -n "ease-spring" app/src/style.css` and confirm every hit is either the `:root` token definition (Area A) or an `.onda-aura` selector (Area B). If any other selector references it, change that selector to `var(--ease-out)`. Expected after check: only `:root`/`.onda-aura` lines match.
- [ ] Step 4: Extend the reduced-motion block so it also zeroes the new entrance AND the body-portaled `#pvModal` (which lives outside `#editorView` and is not caught by the current selector). Replace the block at lines 2394–2403:
```css
@media (prefers-reduced-motion: reduce) {
  #editorView *,
  #editorView *::before,
  #editorView *::after,
  #pvModal,
  #pvModal *,
  #pvModal *::before,
  #pvModal *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```
- [ ] Step 5: Verify visually. `npm run build`, then use the browser-preview: open the writing view, trigger an insert menu and a passage suggestion — both should rise+fade in ~240 ms with the expo curve. Toggle OS "Reduce motion" (browser-preview `resize_window` supports `colorScheme`; use the emulated reduced-motion via devtools or macOS setting) and confirm the same surfaces appear instantly with no translate. Expected: motion present normally, absent under reduce.
- [ ] Step 6: Commit: `git add app/src/style.css && git commit -m "feat(onda): standard onda-rise entrance, token-driven motion, reduced-motion covers modal"`.

---

### Task F-2: Focus states — keyboard outline on primitives, focus ring on inputs, trap/steal guards

**Files:** Modify `app/src/style.css` (add focus-visible rules near the existing primitive focus block at lines 1389–1394 / global button rule at 603). Verify: browser-preview keyboard walk + smoke assertions (added in F-4).

**Interfaces:**
- Consumes (Area A): `--accent`, `--shadow-focus` (`0 0 0 3px var(--focus-ring)`), `--focus-ring`.
- Consumes (Area B): primitive classes `.onda-btn`, `.onda-icon-btn`, `.onda-aura`, `.onda-tag`, `.onda-badge`; frame ids `#ondaAura`, `#sidebarBack`, `#sidebarCollapse`, `#sidebarReopen`, `#pvCard`, `#materialSources`.
- Consumes (Area C): `#pvModal` implements focus-trap + Esc-to-close returning focus to `#pvCard`.
- Consumes (Area E): `.agent-chat-input` composer.
- Produces: a single focus-visibility system (2px accent outline for controls, 3px ring for text inputs) other areas inherit.

- [ ] Step 1: Add a keyboard-focus outline for the new interactive primitives and frame controls. Add after the existing block at lines 1389–1394:
```css
.onda-btn:focus-visible,
.onda-icon-btn:focus-visible,
.onda-aura:focus-visible,
.onda-tag:focus-visible,
.onda-badge:focus-visible,
#ondaAura:focus-visible,
#pvCard:focus-visible,
#sidebarBack:focus-visible,
#sidebarCollapse:focus-visible,
#sidebarReopen:focus-visible,
#materialSources:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```
- [ ] Step 2: Add the soft 3px focus ring for text inputs (document title, agent composer, PV modal fields). Use `:focus-visible` for `#title` so mouse-clicking into the title while writing does NOT flash a ring:
```css
#title:focus-visible,
#editorView textarea:focus-visible,
#editorView input:focus-visible,
.agent-chat-input:focus,
#pvModal input:focus,
#pvModal textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: var(--shadow-focus);
}
```
- [ ] Step 3: Retarget the existing agent composer focus rule so it uses the token ring instead of the old `color-mix` outline. Locate the `.agent-chat-input:focus` rule (~line 1730) and replace its `outline`/`outline-offset` declarations with the `box-shadow: var(--shadow-focus)` handled in Step 2 (delete the stale outline from the old rule so there is one source of truth). Coordinate with Area E: the panel reskin must not re-add an outline.
- [ ] Step 4: Confirm the global fallback at line 603 (`button:focus-visible, input:focus-visible { outline: 2px solid var(--accent); ... }`) still resolves `--accent` to the Onda accent (Area A). No change needed; note it as the catch-all so every un-named control keeps a visible focus.
- [ ] Step 5: Verify by keyboard. `npm run build`, browser-preview the writing view, then Tab from the top: focus must be visible on `#sidebarBack`, `#pvCard`, every `#structureNav .block-preview`, `#materialSources`, `#ondaAura`, then into `#title` (ring only via keyboard) and the editor. Open the PV modal via `#pvCard` and confirm (a) Tab cycles inside `#pvModal` only, (b) Esc closes and focus returns to `#pvCard` (both behaviors owned by Area C — this step verifies the contract). Open the agent via `#ondaAura` and confirm focus does NOT jump into `#agentWidget` (stays on the orb/body) — the panel must never steal focus. Expected: visible focus everywhere, trap holds, no focus theft.
- [ ] Step 6: Commit: `git add app/src/style.css && git commit -m "feat(onda): unified focus system — accent outline on controls, soft ring on inputs"`.

---

### Task F-3: Responsive off-canvas drawer + panel adaptation + print rebuild

**Files:** Modify `app/src/style.css` — replace the `@media (min-width: 761px)` block (lines 2257–2262), both `@media (max-width: 760px)` blocks (lines 2264–2392), and the `@media print` block (lines 2405–2454). Verify: browser-preview at 375px + print emulation.

**Interfaces:**
- Consumes (Area A): `--sidebar-width` (264px), `--dur-normal`, `--ease-out`, `--shadow-xl`.
- Consumes (Area B): `#ondaSidebar`, `.onda-editor-col`, `.onda-topbar`, `#sidebarReopen`, `#sidebarCollapse`; the `is-sidebar-collapsed` class toggled on `#editorView` and persisted via `settings.sidebarCollapsed`; the `is-agent-open` / `is-evidence-open` classes now toggled on `#editorView` (moved off the removed `#workspaceBody`).
- Consumes (Area C): `#pvModal` (hidden in print).
- Produces: narrow-viewport drawer behavior and print rules for the new frame.

- [ ] Step 1: Replace the desktop panel-open padding block. The old rule padded the removed `#workspaceBody`; retarget to the editor column. Replace lines 2257–2262:
```css
@media (min-width: 761px) {
  #editorView.is-agent-open .onda-editor-col,
  #editorView.is-evidence-open .onda-editor-col {
    padding-right: 420px;
  }
}
```
(Note to Area B/E: the `is-agent-open` / `is-evidence-open` classes must live on `#editorView`, not on a body container.)
- [ ] Step 2: Replace BOTH `@media (max-width: 760px)` blocks (lines 2264–2392, everything that references `#workspaceBody`, `#structureShelf`, `#workspaceHeader`, `is-shelf-open`) with one drawer-based block. The sidebar becomes fixed off-canvas, slides on the persisted collapse class, editor column goes full width, panels go near-full-width, and touch targets grow:
```css
@media (max-width: 760px) {
  #ondaSidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 60;
    width: var(--sidebar-width);
    max-width: 86vw;
    margin-left: 0;
    transform: translateX(0);
    transition: transform var(--dur-normal) var(--ease-out);
    box-shadow: var(--shadow-xl);
  }

  #editorView.is-sidebar-collapsed #ondaSidebar {
    transform: translateX(-100%);
    box-shadow: none;
  }

  /* visual dim only — never blocks the editor */
  #editorView::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 55;
    background: rgba(28, 26, 23, .28);
    opacity: 1;
    transition: opacity var(--dur-normal) var(--ease-out);
    pointer-events: none;
  }
  #editorView.is-sidebar-collapsed::before { opacity: 0; }

  .onda-editor-col { width: 100%; min-width: 0; }

  #editorView #page { width: 100%; padding: 44px 24px 34vh; }
  #editorView #title { font-size: 28px; }

  #agentWidget,
  #evidenceWindow {
    left: 12px;
    right: 12px;
    width: auto;
    max-height: 70dvh;
  }
  #agentWidget { top: 62px; height: 70dvh; min-height: 0; }
  #evidenceWindow { top: 62px; }

  .semantic-insert-menu { width: min(214px, calc(100vw - 20px)); }
  .local-finding,
  .local-suggestion { max-width: calc(100vw - 32px); }
  .suggestion-version { grid-template-columns: 74px minmax(0, 1fr); gap: 8px; }
}
```
- [ ] Step 3: Preserve the ≥44px touch-target sizing that lived in the second old max-width block. Append inside the same block (drop `#workspaceHeader`, keep the control sizing that still applies):
```css
@media (max-width: 760px) {
  .onda-icon-btn,
  .block-insert,
  .block-insert-trigger,
  .suggestion-action,
  .agent-chat-send,
  .surface-close {
    width: 44px; min-width: 44px; height: 44px; min-height: 44px;
  }
  .agent-chat-form { grid-template-columns: minmax(0, 1fr) 44px; }
  .block-insert-trigger,
  .block-insert-trigger:hover {
    border-color: transparent; background: transparent; box-shadow: none;
    opacity: 1; pointer-events: auto;
  }
  .block-insert-trigger.is-typing:not(:focus-visible) { opacity: 1; pointer-events: auto; }
  .block-insert-trigger::before {
    content: ''; position: absolute; width: 26px; height: 26px;
    border: 1px solid var(--border-strong); border-radius: 50%;
    background: var(--bg-surface); box-shadow: var(--shadow-sm);
  }
}
```
- [ ] Step 4: Rebuild the print block (lines 2405–2454). Swap the removed ids (`#workspaceHeader`, `#structureShelf`, `#workspaceBody`) for the new frame (`.onda-topbar`, `#ondaSidebar`, `.onda-editor-col`) and add `#pvModal` to the hidden set. Replace the two inner rules:
```css
  #ondaSidebar,
  .onda-topbar,
  #agentWidget,
  #evidenceWindow,
  #blockInsertLayer,
  #localAgentLayer,
  .semantic-insert-menu,
  #pvModal,
  #saveAlert {
    display: none !important;
  }

  #app,
  #editorView,
  .onda-editor-col,
  #editorView #main,
  #editorView #scroll,
  #editorView #page {
    display: block !important;
    position: static !important;
    width: auto !important;
    max-width: none !important;
    height: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
  }
```
(Also delete `#editorView::before` scrim in print — covered because `#editorView` becomes `display: block` and the pseudo-element has `pointer-events: none`; if it shows, add `#editorView::before { display: none !important; }` to the hidden set.)
- [ ] Step 5: Verify. `npm run build`; browser-preview `resize_window` to mobile (375×812): the sidebar overlays from the left; tapping `#sidebarCollapse` slides it off and `#editorView` gains `is-sidebar-collapsed`; `#sidebarReopen` (top-left) slides it back. Editor column is full width; agent + evidence panels span near-full-width. Check `document.documentElement.scrollWidth - clientWidth <= 1` (no horizontal overflow) in both drawer states. Then emulate print and confirm only `#page`/title/editor remain. Expected: clean drawer, zero overflow, minimal print.
- [ ] Step 6: Commit: `git add app/src/style.css && git commit -m "feat(onda): off-canvas sidebar drawer <760px, panel adaptation, print rebuilt for new frame"`.

---

### Task F-4: Update the V2 smoke harness to the new frame

**Files:** Modify `app/test/v2-smoke.mjs` (2663 lines). Key anchored sites below; plus a mechanical rename applied file-wide. Verify: run the smoke.

**Interfaces:**
- Consumes: new frame ids from Area B (`#ondaSidebar`, `#structureNav`, `#ondaAura`, `#pvCard`, `#sidebarBack`, `#sidebarReopen`, `#sidebarCollapse`, `.onda-topbar`, `.onda-editor-col`); `is-sidebar-collapsed` toggle; Area C `#pvModal`.
- Produces: updated assertions proving the new frame + intact interactions; keeps the dead-V1 exclusion asserts.

- [ ] Step 1: Extend `assertReachableSurfaceIsV2Only()` (lines 11–36). KEEP the existing dead-V1 forbidden patterns and the `example.js` phrase check. ADD the removed-workspace ids to `forbidden` (so a regression can't reintroduce the old shell), then ADD positive presence checks for the new frame. Insert into the `forbidden` array:
```js
    /\bid=["'](?:workspaceHeader|workspaceBack|workspacePath|agentPresence|structureShelf|workspaceBody)["']/,
```
and append, after the `assert.match(example, ...)` line:
```js
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  for (const id of ['ondaSidebar', 'structureNav', 'ondaAura', 'pvCard', 'sidebarBack']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `Neue Rahmenstruktur fehlt: #${id}`)
  }
```
- [ ] Step 2: Apply the mechanical rename across the whole file (pure toggles that only changed their handle — structure now always visible so their id changed, not their behavior):
  - `#agentPresence` → `#ondaAura` (24 occurrences — the agent toggle moved onto the Aura orb).
  - `#workspaceBack` → `#sidebarBack` (11 occurrences — back-to-library moved into the sidebar).
  - `#structureShelf` → `#structureNav` (29 occurrences), and the bare string `structureShelf` used as an aria-controls value / node id (in `runMobile` line 268, `runTask4` shelf-node caches) → `structureNav` (remaining ~6 occurrences).
  Do NOT blindly rename `#workspacePath` / `#workspaceHeader` / `#workspaceBody` — those change semantics; handle them in Steps 3–6.
- [ ] Step 3: Rewrite the `runDesktop` structure block (lines 152–167). Structure is now ALWAYS present in `#structureNav` (no shelf toggle, no `#workspacePath`, no `aria-controls`). Replace with:
```js
  assert.equal(await page.locator('#railL, #railR, #pCoach, #pStruct').count(), 0)
  assert.equal(await page.locator('.onda-topbar').count(), 1)
  assert.equal(await page.locator('#ondaSidebar').isVisible(), true)
  assert.equal(await page.locator('#structureNav').isVisible(), true)
  assert.equal(await page.locator('#workspaceHeader, #structureShelf, #workspacePath, #agentPresence').count(), 0)
  assert.equal(await page.locator('#ondaAura').count(), 1)
  assert.equal(await page.getByText('Recherche aktuell', { exact: true }).count(), 0)
  assert.equal(await page.getByText('Prüfen', { exact: true }).count(), 0)
  assert.equal(await page.getByTitle('Schriftgröße (Auswahl / Gesamt)').count(), 0)
  assert.equal(await page.getByTitle('Einfügen (Bild)').count(), 0)

  const shelf = page.locator('#structureNav')
  assert.equal(await shelf.locator('.block-preview').count(), blockIds.length)
  assert.equal(await shelf.locator('.block-insert').count(), blockIds.length)
  assert.equal(await shelf.locator('.black-spine, .status-dot').count(), 0)
```
(Delete the old `await page.locator('#workspacePath').click()` and the `aria-controls` assert entirely; keep the `previewText` / focusBlock / insert-menu assertions that follow at 169+ — they operate on the `shelf` locator you just redefined.)
- [ ] Step 3b: Add a desktop sidebar collapse-persistence check (merged from the dropped `B-4`). Place it in `runDesktop` right after the `shelf` structure block above:
```js
  // Seitenleiste einklappen/ausklappen persistiert in settings.sidebarCollapsed
  await page.locator('#sidebarCollapse').click()
  assert.equal(await page.locator('#editorView').evaluate(n => n.classList.contains('is-sidebar-collapsed')), true)
  assert.equal(await page.locator('#sidebarReopen').isVisible(), true)
  assert.equal(await page.evaluate(() => AIWT.state.settings.sidebarCollapsed), true)
  await page.locator('#sidebarReopen').click()
  assert.equal(await page.locator('#editorView').evaluate(n => n.classList.contains('is-sidebar-collapsed')), false)
  assert.equal(await page.locator('#sidebarReopen').isHidden(), true)
  assert.equal(await page.evaluate(() => AIWT.state.settings.sidebarCollapsed), false)
```
(If `AIWT.state` is not exposed as a global, assert only the class/visibility and drop the two `settings` asserts.)
- [ ] Step 4: In `runDesktop`, delete the two now-invalid asserts at lines 236–237 (`#structureShelf` isHidden after Escape) — structure is permanent, so only keep `assert.equal(... 'view-editor')`. Everywhere in the file where the OLD test opened the shelf via `await page.locator('#workspacePath').click()` purely to reveal structure, DELETE that line (structure is already visible via `#structureNav`); where it re-clicked `#workspacePath` to RE-open after another layer closed it, also delete — the previews never disappear now. Where it asserted the shelf became hidden (`#structureNav.isHidden() === true`) after opening agent/evidence/menu, change to assert the previews are still present: `assert.equal(await page.locator('#structureNav .block-preview').count() > 0, true)`. This affects `runDesktop`, `runTask4InteractionRegressions`, `runMobile`, `runTask7*` — search for `workspacePath` (15 hits) and resolve each by this rule.
- [ ] Step 5: Rewrite `runMobile` (lines 263–316) for the drawer model. The old mutually-exclusive shelf/agent/evidence layering is gone; structure lives in an off-canvas drawer toggled by `#sidebarReopen` / `#sidebarCollapse`, agent/evidence are near-full-width panels. Replace the body with:
```js
async function runMobile(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await openExample(page)

  // structure is always in the sidebar drawer
  assert.equal(await page.locator('#structureNav .block-preview').count() > 0, true)

  // collapse -> editor full width, drawer off-canvas, no horizontal overflow
  await page.locator('#sidebarCollapse').click()
  await page.waitForFunction(() => document.getElementById('editorView').classList.contains('is-sidebar-collapsed'))
  const collapsed = await page.evaluate(() => {
    const sidebar = document.getElementById('ondaSidebar').getBoundingClientRect()
    return {
      offCanvas: sidebar.right <= 1,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
  assert.equal(collapsed.offCanvas, true)
  assert.ok(collapsed.overflow <= 1, `Horizontales Overflow (collapsed): ${collapsed.overflow}px`)

  // reopen the drawer
  await page.locator('#sidebarReopen').click()
  await page.waitForFunction(() => !document.getElementById('editorView').classList.contains('is-sidebar-collapsed'))
  assert.equal(await page.locator('#ondaSidebar').isVisible(), true)

  // agent panel is near-full-width and does not steal focus
  await page.locator('#ondaAura').click()
  assert.equal(await page.locator('#agentWidget').isVisible(), true)
  assert.equal(await page.locator('#agentWidget').evaluate(node => node.contains(document.activeElement)), false)
  const agentBox = await page.locator('#agentWidget').boundingBox()
  assert.ok(agentBox.width >= 390 - 40, `Agent-Panel zu schmal: ${agentBox.width}`)
  await page.keyboard.press('Escape')

  // evidence panel opens near-full-width
  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.workspace.evidenceFindingId = 'mobile-evidence-probe'
    window.AIWT.state.editor.commands.insertContent(' ')
  })
  assert.equal(await page.locator('#evidenceWindow').isVisible(), true)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  assert.ok(overflow <= 1, `Horizontales Overflow: ${overflow}px`)
  await page.screenshot({ path: `${screenshotDir}/aiwt-v2-mobile.png`, fullPage: true })
  await page.close()
}
```
- [ ] Step 6: Fix `runPrintLayout` (lines 360–402). The forced-visible loop and the hidden-in-print loop reference `#structureShelf`; replace with the drawer/topbar (`#ondaSidebar`, `.onda-topbar`). In the `printLayout` evaluate, DROP `workspaceDisplay: styles('workspaceBody').display` (the element no longer exists) and instead assert the editor column collapses: add `editorColDisplay: styles(... )` reading `document.querySelector('.onda-editor-col')`. Concretely: the forced-visible loop becomes `for (const id of ['ondaSidebar', 'agentWidget', 'evidenceWindow'])`; the hidden-in-print selector list becomes `['.onda-topbar', '#ondaSidebar', '#agentWidget', '#evidenceWindow', '#blockInsertLayer', '#localAgentLayer', '#saveAlert']`; and the deep-equal target replaces `workspaceDisplay: 'block'` with the editor-column check (query `.onda-editor-col`, expect `display: 'block'`). Keep `mainPosition`, `scrollOverflow`, `pageMaxWidth`, `pagePaddingTop` as-is.
- [ ] Step 7: Fix `runTask7KeyboardAndMotion` (lines 2571–2572). The old code clicked `#workspacePath` then asserted a reduced transition on `#workspaceBody` (both gone). Replace those two lines with a drawer-transition check:
```js
  await page.locator('#sidebarCollapse').click()
  await assertReducedTransition(page, '#ondaSidebar')
  await page.locator('#sidebarReopen').click()
```
Then remove the following `await page.keyboard.press('Escape')` if it only closed the shelf. Rename the remaining `#agentPresence`/`#structureShelf` hits in this function per Step 2. Add one new assertion to this reduced-motion pass proving the PV modal + focus contract: open `#pvCard`, assert `#pvModal` is visible with a `[role="dialog"]`, press `Escape`, assert `#pvModal` is hidden and `document.activeElement === #pvCard`:
```js
  await page.locator('#pvCard').click()
  await expectVisible(page.locator('#pvModal [role="dialog"]'))
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#pvModal').isHidden(), true)
  assert.equal(await page.locator('#pvCard').evaluate(node => document.activeElement === node), true)
```
- [ ] Step 8: Resolve the remaining renamed-selector fallout in `runTask4InteractionRegressions`, `runTask5MobileFeedback`, `runTask6*`, `runTask7Scenarios/Intermediate`, `assertTask7IconControls`, and the runner tail — apply Step 2 renames and Step 4's "delete redundant shelf-open" rule. Search the file for `workspacePath`, `agentPresence`, `structureShelf`, `workspaceBack`, `workspaceHeader`, `workspaceBody`; each must be resolved (0 remaining hits except inside the `assertReachableSurfaceIsV2Only` forbidden regex from Step 1).
- [ ] Step 9: Verify. `npm run build`, serve the app root at `http://127.0.0.1:4173` (e.g. `cd app && npx serve -l 4173 .`), then `node test/v2-smoke.mjs`. Expected final line: `V2 smoke passed`. Iterate on any assertion that still references old geometry until green.
- [ ] Step 10: Commit: `git add app/test/v2-smoke.mjs && git commit -m "test(onda): smoke asserts new sidebar frame — #ondaSidebar/#structureNav/#ondaAura/#pvCard, drawer, focus"`.

---

### Task F-5: Final verification — unit tests + acceptance-criteria browser walkthrough

**Files:** None modified. Runs `npm test`, the smoke, and a browser-preview checklist. Produces the completion evidence.

**Interfaces:** Consumes every prior area's output (frame, tokens, primitives, settings model, modal, panels). Produces the go/no-go verdict against the 9 spec acceptance criteria.

- [ ] Step 1: Unit tests. `cd app && npm test`. Expected: `example-seed.test.mjs`, `reasoning-model.test.mjs`, `workspace-model.test.mjs` all pass (includes the additive `settings.accent` / `settings.sidebarCollapsed` tolerant-load assertions owned by the settings-model area). Expected: 0 failing.
- [ ] Step 2: Smoke. `npm run build` → serve at `:4173` → `node test/v2-smoke.mjs`. Expected: `V2 smoke passed`.
- [ ] Step 3: Browser-preview acceptance walkthrough. `preview_start` the served build, open the writing view (open the "Beispiel: Calm Technology" project text), then verify each criterion and record the observation:
  1. **Light theme** — default `data-theme` absent: paper background `#f7f6f3`, ink text, Sky accent on the Aura orb; sharp corners (panel 18px, card 8px). Expected: warm paper/ink, one accent.
  2. **Dark theme** — click `#themeToggle`: root gets `data-theme="dark"`, background `#141310`, accent shifts to `#8ec3e6`, shadows warm-black. Reload → dark persists. Expected: full dark, persisted.
  3. **Sidebar collapse** — click `#sidebarCollapse`: `#ondaSidebar` slides out (margin-left/translate), `#sidebarReopen` appears top-left, editor widens. Reload → still collapsed (`settings.sidebarCollapsed`). Click `#sidebarReopen` → restored. Expected: collapse toggles and persists.
  4. **Fonts self-hosted** — with `read_network_requests` (urlPattern `font`), confirm the ONLY font requests are `…/fonts/*.woff2` (Hanken Grotesk + JetBrains Mono); ZERO requests to `fonts.googleapis.com` / `fonts.gstatic.com`. Confirm computed `font-family` of `#editor .ProseMirror` resolves to Hanken Grotesk at 16.5px/1.7 (not Literata/18px). Expected: empty external-font network log, sans body.
  5. **Accent variants** — click `#accentToggle` to cycle `sky → sage → blue → clay → lavender → sand`: for `sky` the root has NO `data-accent`; for the others `data-accent="…"` is set and the Aura gradient + accent controls recolor. Reload → chosen accent persists. Expected: 6-way accent, `sky` clears the attribute, persisted.
  6. **Insert menu** — hover a block → `#blockInsertTrigger` appears bottom-right of the active block; Enter opens `.semantic-insert-menu` with the 6 German roles; pick "Gegenposition" → a `data-semantic-role="counterpoint"` block is inserted. Expected: insert works, rises in with onda-rise.
  7. **Hint + suggestion** — a `#localAgentLayer .local-finding` is present and pinned to its block (`.has-local-finding`); expand it (Beobachtung/Relevanz/Folge), open the suggestion, click "Übernehmen" → target text replaced by the action, finding resolved. Expected: findings/suggestions intact.
  8. **Agent + evidence + persistence** — click `#ondaAura` → `#agentWidget` opens (focus stays on the orb, not stolen); trigger an evidence finding → `#evidenceWindow` opens with a source card; reload → active block, inserted block, and accepted decision all restored from `localStorage`. Expected: agent/evidence + reload persistence hold.
  9. **PV modal + keyboard + reduced-motion + narrow** — click `#pvCard` → `#pvModal` dialog rises in with the six German fields (Aufgabe, Zielgruppe, Beabsichtigte Wirkung, Belegstandard, Geschützte Absicht, Offene Frage); Tab stays trapped inside; Esc closes and returns focus to `#pvCard`. Enable OS Reduce-motion → re-open modal/insert menu: they appear instantly. `resize_window` to 375px → sidebar is an off-canvas drawer, editor full width, no horizontal scroll. Expected: modal + keyboard + reduced-motion + drawer all correct.
- [ ] Step 4: Compare fresh evidence to the original success criteria. If any of the 9 fails, report it plainly with the exact observation (do not mark complete). If all 9 pass plus Steps 1–2 green, the Onda writing-view transformation is verified.
- [ ] Step 5: Commit the evidence/screenshots if the plan tracks them (e.g. `git add app/test/__screenshots__ && git commit -m "chore(onda): final verification evidence — 9/9 acceptance criteria pass"`); otherwise record the pass in the plan's verification log. No source change in this task.

**Files (absolute):**
- `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/style.css` (F-1 motion, F-2 focus, F-3 responsive+print)
- `/Users/jakobschlenker/Documents/AI Writing Tool/app/test/v2-smoke.mjs` (F-4)
- `/Users/jakobschlenker/Documents/AI Writing Tool/app/index.html` (read-only reference for F-4 presence asserts)
- `/Users/jakobschlenker/Documents/AI Writing Tool/app/package.json` (`npm run build`, `npm test` — F-5)

---
