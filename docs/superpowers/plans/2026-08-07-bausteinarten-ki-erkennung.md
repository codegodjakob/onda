# Bausteinarten: KI-Erkennung — Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Bausteinart eines Absatzes wird von der KI erkannt statt von Hand vergeben — pro Text ein eigener Satz Arten, abgeleitet aus der Textsorte, abgelegt neben dem Text.

**Architecture:** Ein neuer, eigener KI-Lauf (`bausteinarten`) mit eigenem reinen Modell (`bausteinlauf-model.mjs`), nach dem Muster von `hinweislauf-model.mjs`. Er schreibt in `doc.workspace.bausteinarten`. Aus dieser Ablage werden zwei Dinge gespeist: der Anzeigename in der Struktur-Spalte und `block.role` für die vorhandene Rechenlogik (Aussagen-Register, Argument-Projektion, Wirkungsanalyse, Sprachmuster). Das Menü „Art des Textbausteins" und die feste Sechser-Liste fallen ersatzlos weg.

**Tech Stack:** Vanilla JS (ESM), Tiptap 2.x, `node:test` für reine Modelle, Playwright für Browser-Prüfungen, Anthropic Messages API mit `output_config.format.json_schema`.

**Spezifikation:** `docs/superpowers/specs/2026-08-07-bausteinarten-ki-erkennung-design.md`

## Global Constraints

- **Arbeitsverzeichnis:** `app/` für alle npm-Befehle.
- **Der Arbeitsbaum braucht `node_modules`.** In diesem Worktree fehlt es. Ohne den Symlink schlagen drei ESM-Tests fehl und der Build läuft nicht. Vor Task 1:
  ```bash
  ln -s "/Users/jakobschlenker/Documents/AI Writing Tool/app/node_modules" "/Users/jakobschlenker/Documents/AI Writing Tool/.claude/worktrees/relaxed-turing-127ead/app/node_modules"
  ```
- **Reine Modelle sind rein.** Kein DOM, kein `ctx`, kein Netz, keine Uhr außer über einen `jetzt`-Parameter mit Vorgabewert. Alle IO-Abhängigkeiten sind Parameter (Muster: `versucheHinweislauf`, `app/src/hinweislauf-model.mjs:160`).
- **Deutsche Bezeichner** für neue Fachbegriffe (`bestand`, `zuordnung`, `laufSignatur`), wie im übrigen Projekt. Die Funktionsschlüssel bleiben englisch (`claim`, `evidence`, `counterpoint`, `transition`, `question`), weil die vorhandene Rechenlogik genau diese Zeichenketten vergleicht (`app/src/claim-ledger.mjs:7`).
- **Keine `temperature`, kein `thinking`, kein Assistant-Prefill** in Anfragen (`app/src/agent-tasks.mjs:203`).
- **Das Cache-Präfix bleibt stabil:** `verstaendnis` und `docText` sind gecacht, alles Wechselnde gehört in `volatiles` (`app/src/hinweis-kontext.mjs:20`).
- **Kein stilles Streichen von Prüfungen.** Wo eine Prüfung entfällt, steht an ihrer Stelle eine `ENTFERNT:`-Notiz mit Grund — das vorhandene Muster in `app/test/v2-smoke.mjs:268`.
- **Prüfbefehle:**
  ```bash
  cd app && npm run test:unit
  ```
  ```bash
  cd app && node test/v2-smoke.mjs
  ```
  Browser-Prüfungen brauchen einen eigenen Server; Port 4173 kann einer fremden Sitzung gehören. Eigenen Port starten und `AIWT_URL` setzen.

---

## Dateien im Überblick

| Datei | Verantwortung | Task |
|---|---|---|
| `app/src/bausteinlauf-model.mjs` | **Neu.** Alles Reine: Signatur, Bedarfsprüfung, Antwortverarbeitung, Normalisierung, Altübernahme, Nachschlagekarten, `versucheBausteinlauf` | 1–3, 6 |
| `app/test/bausteinlauf-model.test.mjs` | **Neu.** Prüfung dieses Modells | 1–3, 6 |
| `app/src/bausteinarten-kontext.mjs` | **Neu.** Übersetzt Rohdaten auf den `baueAnfrage`-Vertrag | 5 |
| `app/test/bausteinarten-kontext.test.mjs` | **Neu.** Prüfung des Kontextbaus | 5 |
| `app/src/agent-prompts.mjs` | Auftragstext `BAUSTEINARTEN_ANWEISUNG` | 4 |
| `app/src/agent-tasks.mjs` | `BAUSTEINARTEN_SCHEMA`, `TASK_TABLE.bausteinarten` | 4 |
| `app/src/workspace-model.mjs` | `collectBlockSnapshots` nimmt Rollen entgegen; `ensureWorkspaceState` normalisiert die Ablage | 2, 7 |
| `app/src/block-identity.js` | `getEditorBlocks` reicht Rollen durch | 7 |
| `app/src/workspace.js` | Auslöser, Ausführung, eine Blockquelle, Anzeige, Löschung des Menüs | 6–8, 10 |
| `app/src/example.js`, `app/src/editor.js` | Mitgelieferter Bestand fürs Beispielprojekt | 9 |
| `app/src/style.css` | Löschung `.semantic-insert-*` | 10 |
| `app/test/schreibansicht-ruhe.test.mjs` | Zusage umdrehen | 10 |
| `app/test/v2-smoke.mjs` | Menü-Abschnitte ersetzen, verwaiste Zusagen retten | 11 |

---

### Task 1: Struktur-Signatur und Bedarfsprüfung

Der Auslöser. Er entscheidet, **ob** ein Lauf nötig ist und **welche Absätze** einen Namen brauchen. Ohne ihn liefe die Erkennung bei jeder Schreibpause und wäre teuer und unruhig.

**Files:**
- Create: `app/src/bausteinlauf-model.mjs`
- Test: `app/test/bausteinlauf-model.test.mjs`

**Interfaces:**
- Consumes: nichts.
- Produces:
  - `FUNKTIONEN: readonly string[]` — `['claim','evidence','counterpoint','transition','question']`
  - `UMSCHREIB_GRENZE: number` — `0.5`
  - `strukturSignatur(blocks): string`
  - `pruefeBausteinBedarf({ blocks, bestand, grenze }): { noetig: boolean, grund: string, offene: string[] }`

- [ ] **Step 1: Write the failing test**

`app/test/bausteinlauf-model.test.mjs` (neue Datei):

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FUNKTIONEN,
  UMSCHREIB_GRENZE,
  pruefeBausteinBedarf,
  strukturSignatur,
} from '../src/bausteinlauf-model.mjs'

function absatz(id, text, type = 'paragraph') {
  return { id, type, role: type === 'heading' ? 'heading' : 'paragraph', text, excerpt: text.slice(0, 160) }
}

test('die Struktur-Signatur haengt an Bestand und Reihenfolge, nicht am Wortlaut', () => {
  const a = [absatz('b1', 'Erster Absatz.'), absatz('b2', 'Zweiter Absatz.')]
  const b = [absatz('b1', 'Erster Absatz, umformuliert.'), absatz('b2', 'Zweiter Absatz.')]
  const c = [absatz('b2', 'Zweiter Absatz.'), absatz('b1', 'Erster Absatz.')]
  const d = [absatz('b1', 'Erster Absatz.'), absatz('b2', 'Zweiter Absatz.'), absatz('b3', 'Neu.')]

  assert.equal(strukturSignatur(a), strukturSignatur(b))
  assert.notEqual(strukturSignatur(a), strukturSignatur(c))
  assert.notEqual(strukturSignatur(a), strukturSignatur(d))
})

test('Absaetze ohne Kennung zaehlen nicht zur Signatur', () => {
  const mit = [absatz('b1', 'Text.'), absatz(null, 'Noch ohne Kennung.')]
  const ohne = [absatz('b1', 'Text.')]
  assert.equal(strukturSignatur(mit), strukturSignatur(ohne))
})

test('ohne Bestand ist ein Lauf noetig und alle Absaetze sind offen', () => {
  const blocks = [absatz('b1', 'Ein Befund.'), absatz('b2', 'Eine Einordnung.')]
  const ergebnis = pruefeBausteinBedarf({ blocks, bestand: null })
  assert.equal(ergebnis.noetig, true)
  assert.equal(ergebnis.grund, 'kein-bestand')
  assert.deepEqual(ergebnis.offene, ['b1', 'b2'])
})

test('ein vollstaendig benannter, unveraenderter Text braucht keinen Lauf', () => {
  const blocks = [absatz('b1', 'Ein Befund.')]
  const bestand = {
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Befund', beschreibung: '', funktion: 'evidence' }],
    zuordnung: { b1: { artId: 'art-1', zeichen: 'Ein Befund.'.length } },
    laufSignatur: strukturSignatur(blocks),
    standAt: 1,
  }
  const ergebnis = pruefeBausteinBedarf({ blocks, bestand })
  assert.equal(ergebnis.noetig, false)
  assert.equal(ergebnis.grund, 'aktuell')
  assert.deepEqual(ergebnis.offene, [])
})

test('ein neuer Absatz macht einen Lauf noetig und ist allein offen', () => {
  const alt = [absatz('b1', 'Ein Befund.')]
  const bestand = {
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Befund', beschreibung: '', funktion: 'evidence' }],
    zuordnung: { b1: { artId: 'art-1', zeichen: 'Ein Befund.'.length } },
    laufSignatur: strukturSignatur(alt),
    standAt: 1,
  }
  const blocks = [...alt, absatz('b2', 'Ein zweiter Gedanke.')]
  const ergebnis = pruefeBausteinBedarf({ blocks, bestand })
  assert.equal(ergebnis.noetig, true)
  assert.equal(ergebnis.grund, 'struktur')
  assert.deepEqual(ergebnis.offene, ['b2'])
})

test('Weiterschreiben in einem benannten Absatz loest nichts aus', () => {
  const text = 'Ein Befund, der schon etwas laenger dasteht und Bestand hat.'
  const bestand = {
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Befund', beschreibung: '', funktion: 'evidence' }],
    zuordnung: { b1: { artId: 'art-1', zeichen: text.length } },
    laufSignatur: strukturSignatur([absatz('b1', text)]),
    standAt: 1,
  }
  const blocks = [absatz('b1', `${text} Und noch ein Halbsatz.`)]
  assert.equal(pruefeBausteinBedarf({ blocks, bestand }).noetig, false)
})

test('mehr als die Haelfte umgeschrieben macht den Absatz wieder offen', () => {
  const text = 'Kurz.'
  const bestand = {
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Befund', beschreibung: '', funktion: 'evidence' }],
    zuordnung: { b1: { artId: 'art-1', zeichen: text.length } },
    laufSignatur: strukturSignatur([absatz('b1', text)]),
    standAt: 1,
  }
  const blocks = [absatz('b1', 'Deutlich laenger geworden, weit mehr als das Doppelte an Zeichen.')]
  const ergebnis = pruefeBausteinBedarf({ blocks, bestand })
  assert.equal(ergebnis.noetig, true)
  assert.equal(ergebnis.grund, 'umgeschrieben')
  assert.deepEqual(ergebnis.offene, ['b1'])
})

test('die Grenze ist von aussen setzbar und wirkt an beiden Raendern', () => {
  const bestand = {
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Befund', beschreibung: '', funktion: 'evidence' }],
    zuordnung: { b1: { artId: 'art-1', zeichen: 100 } },
    laufSignatur: strukturSignatur([absatz('b1', 'x')]),
    standAt: 1,
  }
  const blocks = [absatz('b1', 'y'.repeat(160))]           // +60 %
  assert.equal(pruefeBausteinBedarf({ blocks, bestand, grenze: 0.8 }).noetig, false)
  assert.equal(pruefeBausteinBedarf({ blocks, bestand, grenze: 0.5 }).noetig, true)
  assert.equal(UMSCHREIB_GRENZE, 0.5)
})

test('Ueberschriften und leere Absaetze brauchen nie einen Namen', () => {
  const blocks = [
    absatz('h1', 'Warum es wichtig ist', 'heading'),
    absatz('b1', '   '),
    absatz('b2', 'Ein echter Absatz.'),
  ]
  const ergebnis = pruefeBausteinBedarf({ blocks, bestand: null })
  assert.deepEqual(ergebnis.offene, ['b2'])
})

test('die Funktionsschluessel bleiben genau die, die die Rechenlogik vergleicht', () => {
  assert.deepEqual([...FUNKTIONEN], ['claim', 'evidence', 'counterpoint', 'transition', 'question'])
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && node --test test/bausteinlauf-model.test.mjs
```

Erwartet: FAIL mit `Cannot find module '../src/bausteinlauf-model.mjs'`.

- [ ] **Step 3: Write minimal implementation**

`app/src/bausteinlauf-model.mjs` (neue Datei):

```js
// Reine Logik fuer den Bausteinlauf — PUR, node-testbar, kein DOM, kein ctx.
// workspace.js (fuehreBausteinlaufAus) orchestriert nur: Dokument/Editor lesen, diese
// Funktionen aufrufen, runTask + Persistenz ausloesen. Vorbild: hinweislauf-model.mjs.

// Die unsichtbare Funktion einer Bausteinart. Bewusst die englischen Schluessel, die die
// vorhandene Rechenlogik zeichengenau vergleicht (claim-ledger.mjs:7, effect-analysis.mjs:46,
// language-patterns.mjs:51). Der SICHTBARE Name ist davon unabhaengig und frei.
export const FUNKTIONEN = Object.freeze(['claim', 'evidence', 'counterpoint', 'transition', 'question'])

// Ab wann gilt ein Absatz als umgeschrieben statt fortgeschrieben? Gemessen an der
// Zeichenzahl seit seiner Benennung. Gesetzt, nicht hergeleitet — deshalb von aussen
// verstellbar und an beiden Raendern geprueft.
export const UMSCHREIB_GRENZE = 0.5

function benennbar(block) {
  if (!block?.id) return false
  if (block.type === 'heading' || block.role === 'heading') return false
  return Boolean(String(block.text || '').trim())
}

// Bestand und Reihenfolge der Absaetze — bewusst OHNE Wortlaut. Wer in einem Absatz
// weiterschreibt, aendert die Signatur nicht; wer einen anlegt, entfernt oder verschiebt,
// aendert sie. Genau das ist der Unterschied, an dem der Lauf haengen soll.
export function strukturSignatur(blocks) {
  return (Array.isArray(blocks) ? blocks : [])
    .filter(block => block?.id)
    .map(block => block.id)
    .join('|')
}

export function pruefeBausteinBedarf({ blocks, bestand, grenze = UMSCHREIB_GRENZE } = {}) {
  const liste = (Array.isArray(blocks) ? blocks : []).filter(benennbar)
  if (!bestand || !Array.isArray(bestand.arten) || !bestand.arten.length) {
    return { noetig: liste.length > 0, grund: 'kein-bestand', offene: liste.map(block => block.id) }
  }

  const zuordnung = bestand.zuordnung && typeof bestand.zuordnung === 'object' ? bestand.zuordnung : {}
  const ohneNamen = []
  const umgeschrieben = []
  liste.forEach(block => {
    const eintrag = zuordnung[block.id]
    if (!eintrag || !eintrag.artId) { ohneNamen.push(block.id); return }
    const alt = Number(eintrag.zeichen) || 0
    const neu = String(block.text || '').trim().length
    if (Math.abs(neu - alt) / Math.max(1, alt) > grenze) umgeschrieben.push(block.id)
  })

  const strukturGeaendert = strukturSignatur(blocks) !== bestand.laufSignatur
  const offene = [...new Set([...ohneNamen, ...umgeschrieben])]
  // Eine geaenderte Struktur ALLEIN loest nichts aus: Wer einen Absatz loescht, aendert
  // die Signatur, aber kein uebriger Absatz braucht deshalb einen neuen Namen. Ausgeloest
  // wird nur, wenn tatsaechlich jemand ohne Namen dasteht.
  if (!offene.length) return { noetig: false, grund: 'aktuell', offene: [] }

  const grund = strukturGeaendert && ohneNamen.length
    ? 'struktur'
    : ohneNamen.length ? 'ohne-namen' : 'umgeschrieben'
  return { noetig: true, grund, offene }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && node --test test/bausteinlauf-model.test.mjs
```

Erwartet: PASS, 9 Tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/bausteinlauf-model.mjs app/test/bausteinlauf-model.test.mjs && git commit -m "feat(bausteine): der Auslöser weiß, wann ein Absatz einen Namen braucht"
```

---

### Task 2: Ablage normalisieren und alte Rollen übernehmen

Alles, was aus einer gespeicherten Datei kommt, ist Verdachtsmaterial: Es kann aus einer älteren Fassung stammen, von Hand bearbeitet oder halb geschrieben sein. Diese Aufgabe macht daraus entweder eine gültige Ablage oder `null`.

**Files:**
- Modify: `app/src/bausteinlauf-model.mjs`
- Modify: `app/src/workspace-model.mjs` (in `ensureWorkspaceState`, ab Zeile 107)
- Test: `app/test/bausteinlauf-model.test.mjs`

**Interfaces:**
- Consumes: `FUNKTIONEN` (Task 1)
- Produces:
  - `normalisiereBausteinarten(wert): Bestand | null`
  - `bestandAusAltenRollen(docJson, jetzt): Bestand | null` — nimmt das **rohe Tiptap-JSON**, nicht die Blöcke aus `collectBlockSnapshots`. Grund: Ab Task 7 liest `collectBlockSnapshots` das alte Merkmal `semanticRole` nicht mehr. Über Blöcke gefüttert fände diese Funktion niemals eine alte Rolle und wäre ein stiller No-Op. Sie ist die **einzige** Stelle, die das Alt-Merkmal noch kennt — genau deshalb, weil sie die Brücke ist.
  - `bausteinRollen(bestand): Map<string, string>` — blockId → funktion
  - `bausteinNamen(bestand): Map<string, string>` — blockId → sichtbarer Name

Die Form eines `Bestand`:

```js
{
  textsorte: string | null,
  arten: [{ id: string, name: string, beschreibung: string, funktion: string | null }],
  zuordnung: { [blockId]: { artId: string, zeichen: number } },
  laufSignatur: string,
  standAt: number,
}
```

- [ ] **Step 1: Write the failing test**

An `app/test/bausteinlauf-model.test.mjs` anhängen:

```js
import {
  bausteinNamen,
  bausteinRollen,
  bestandAusAltenRollen,
  normalisiereBausteinarten,
} from '../src/bausteinlauf-model.mjs'
import { ensureWorkspaceState } from '../src/workspace-model.mjs'

test('Unfug wird zu null, nicht zu einer halben Ablage', () => {
  assert.equal(normalisiereBausteinarten(null), null)
  assert.equal(normalisiereBausteinarten('Befund'), null)
  assert.equal(normalisiereBausteinarten({ arten: [] }), null)
  assert.equal(normalisiereBausteinarten({ arten: [{ name: '   ' }] }), null)
})

test('eine gueltige Ablage bleibt erhalten und bekommt fehlende Felder', () => {
  const bestand = normalisiereBausteinarten({
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Wendung', funktion: 'transition' }],
    zuordnung: { b1: { artId: 'art-1', zeichen: 42 } },
  })
  assert.equal(bestand.textsorte, 'Essay')
  assert.deepEqual(bestand.arten, [{ id: 'art-1', name: 'Wendung', beschreibung: '', funktion: 'transition' }])
  assert.deepEqual(bestand.zuordnung, { b1: { artId: 'art-1', zeichen: 42 } })
  assert.equal(bestand.laufSignatur, '')
  assert.equal(bestand.standAt, 0)
})

test('eine unbekannte Funktion wird zu null, die Art selbst bleibt', () => {
  const bestand = normalisiereBausteinarten({
    arten: [{ id: 'art-1', name: 'Pointe', funktion: 'zuspitzung' }],
  })
  assert.equal(bestand.arten[0].funktion, null)
  assert.equal(bestand.arten[0].name, 'Pointe')
})

test('eine Zuordnung auf eine unbekannte Art faellt weg', () => {
  const bestand = normalisiereBausteinarten({
    arten: [{ id: 'art-1', name: 'Befund', funktion: null }],
    zuordnung: { b1: { artId: 'art-1', zeichen: 5 }, b2: { artId: 'art-99', zeichen: 5 } },
  })
  assert.deepEqual(Object.keys(bestand.zuordnung), ['b1'])
})

test('doppelte Namen werden zusammengefasst, der erste gewinnt', () => {
  const bestand = normalisiereBausteinarten({
    arten: [
      { id: 'art-1', name: 'Befund', funktion: 'evidence' },
      { id: 'art-2', name: 'befund', funktion: 'claim' },
    ],
    zuordnung: { b1: { artId: 'art-2', zeichen: 5 } },
  })
  assert.equal(bestand.arten.length, 1)
  assert.equal(bestand.arten[0].id, 'art-1')
  assert.equal(bestand.zuordnung.b1.artId, 'art-1')
})

const ALT_JSON = {
  content: [
    { type: 'paragraph', attrs: { blockId: 'b1', semanticRole: 'claim' }, content: [{ type: 'text', text: 'Die tragende Aussage.' }] },
    { type: 'paragraph', attrs: { blockId: 'b2', semanticRole: 'counterpoint' }, content: [{ type: 'text', text: 'Der Einwand.' }] },
    { type: 'paragraph', attrs: { blockId: 'b3', semanticRole: 'paragraph' }, content: [{ type: 'text', text: 'Ein gewoehnlicher Absatz.' }] },
    { type: 'heading', attrs: { blockId: 'h1', level: 2, semanticRole: 'heading' }, content: [{ type: 'text', text: 'Zwischentitel' }] },
  ],
}

test('alte Sechser-Rollen ergeben einen Anfangsbestand mit den alten Woertern', () => {
  const bestand = bestandAusAltenRollen(ALT_JSON, 1234)
  assert.equal(bestand.textsorte, null)
  assert.deepEqual(bestand.arten.map(art => art.name), ['Kernbehauptung', 'Gegenposition'])
  assert.deepEqual(bestand.arten.map(art => art.funktion), ['claim', 'counterpoint'])
  assert.deepEqual(Object.keys(bestand.zuordnung), ['b1', 'b2'])
  assert.equal(bestand.zuordnung.b1.zeichen, 'Die tragende Aussage.'.length)
  assert.equal(bestand.standAt, 1234)
  assert.equal(bestand.laufSignatur, 'b1|b2|b3|h1')
})

test('die Uebernahme liest das ROHE Dokument, nicht die Bloecke', () => {
  // Ab Task 7 traegt ein Block aus collectBlockSnapshots die alte Rolle nicht mehr.
  // Wer diese Funktion mit Bloecken fuettert, bekaeme still null -- und alte Dokumente
  // verloeren ihre Rollen unbemerkt. Diese Pruefung nagelt die Quelle fest.
  const bloeckeStattJson = [{ id: 'b1', type: 'paragraph', role: 'claim', text: 'Die tragende Aussage.' }]
  assert.equal(bestandAusAltenRollen(bloeckeStattJson, 1), null)
  assert.ok(bestandAusAltenRollen(ALT_JSON, 1))
})

test('ohne alte Rollen entsteht kein Anfangsbestand', () => {
  const ohne = { content: [{ type: 'paragraph', attrs: { blockId: 'b1' }, content: [{ type: 'text', text: 'Nur Text.' }] }] }
  assert.equal(bestandAusAltenRollen(ohne, 1), null)
})

test('Nachschlagekarten trennen unsichtbare Funktion von sichtbarem Namen', () => {
  const bestand = normalisiereBausteinarten({
    arten: [
      { id: 'art-1', name: 'Befund', funktion: 'evidence' },
      { id: 'art-2', name: 'Einordnung', funktion: null },
    ],
    zuordnung: { b1: { artId: 'art-1', zeichen: 5 }, b2: { artId: 'art-2', zeichen: 5 } },
  })
  assert.deepEqual([...bausteinRollen(bestand)], [['b1', 'evidence']])
  assert.deepEqual([...bausteinNamen(bestand)], [['b1', 'Befund'], ['b2', 'Einordnung']])
})

test('ensureWorkspaceState raeumt eine kaputte Ablage weg und laesst eine gute stehen', () => {
  const kaputt = { workspace: { bausteinarten: { arten: 'nein' } } }
  ensureWorkspaceState(kaputt)
  assert.equal(kaputt.workspace.bausteinarten, null)

  const gut = {
    workspace: {
      bausteinarten: { arten: [{ id: 'art-1', name: 'Befund', funktion: 'evidence' }], zuordnung: {} },
    },
  }
  ensureWorkspaceState(gut)
  assert.equal(gut.workspace.bausteinarten.arten[0].name, 'Befund')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && node --test test/bausteinlauf-model.test.mjs
```

Erwartet: FAIL — `normalisiereBausteinarten is not a function`.

- [ ] **Step 3: Write minimal implementation**

An `app/src/bausteinlauf-model.mjs` anhängen:

```js
const ALTE_ROLLEN = Object.freeze({
  claim: 'Kernbehauptung',
  evidence: 'Beleg',
  counterpoint: 'Gegenposition',
  transition: 'Übergang',
  question: 'Offene Frage',
})

function text(wert) {
  return typeof wert === 'string' ? wert.trim() : ''
}

// Aus einer gespeicherten Datei kommt Verdachtsmaterial: aeltere Fassung, von Hand
// bearbeitet, halb geschrieben. Entweder wird daraus eine vollstaendig gueltige Ablage
// oder null — nie eine halbe, an der spaeter etwas stillschweigend fehlt.
export function normalisiereBausteinarten(wert) {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  if (!Array.isArray(wert.arten)) return null

  const arten = []
  const nachName = new Map()
  const umleitung = new Map()
  wert.arten.forEach((roh, index) => {
    if (!roh || typeof roh !== 'object') return
    const name = text(roh.name)
    if (!name) return
    const id = text(roh.id) || `art-${index + 1}`
    const schluessel = name.toLocaleLowerCase('de')
    const bekannt = nachName.get(schluessel)
    if (bekannt) { umleitung.set(id, bekannt); return }
    const art = {
      id,
      name,
      beschreibung: text(roh.beschreibung),
      funktion: FUNKTIONEN.includes(roh.funktion) ? roh.funktion : null,
    }
    arten.push(art)
    nachName.set(schluessel, id)
    umleitung.set(id, id)
  })
  if (!arten.length) return null

  const zuordnung = {}
  const roheZuordnung = wert.zuordnung && typeof wert.zuordnung === 'object' ? wert.zuordnung : {}
  Object.entries(roheZuordnung).forEach(([blockId, eintrag]) => {
    if (!text(blockId) || !eintrag || typeof eintrag !== 'object') return
    const artId = umleitung.get(text(eintrag.artId))
    if (!artId) return
    zuordnung[blockId] = { artId, zeichen: Math.max(0, Number(eintrag.zeichen) || 0) }
  })

  return {
    textsorte: text(wert.textsorte) || null,
    arten,
    zuordnung,
    laufSignatur: typeof wert.laufSignatur === 'string' ? wert.laufSignatur : '',
    standAt: Number(wert.standAt) || 0,
  }
}

function knotenText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  return (Array.isArray(node.content) ? node.content : []).map(knotenText).join('')
}

// Ein Dokument aus der Sechser-Zeit verliert seine Rollen nicht: Sie werden mit ihren
// alten deutschen Woertern zum Anfangsbestand. Der naechste Lauf ersetzt ihn.
// 'paragraph' war die Voreinstellung, keine Entscheidung — daraus entsteht nichts.
//
// WICHTIG: Diese Funktion nimmt das ROHE Tiptap-JSON, nicht die Bloecke aus
// collectBlockSnapshots. Seit dem 7. August 2026 liest collectBlockSnapshots das alte
// Merkmal semanticRole nicht mehr (die Bausteinart liegt neben dem Text). Ueber Bloecke
// gefuettert fände diese Funktion also NIE eine alte Rolle und waere ein stiller No-Op.
// Sie ist die einzige Stelle im Programm, die das Alt-Merkmal noch kennt -- genau das
// ist ihre Aufgabe.
export function bestandAusAltenRollen(docJson, jetzt = Date.now()) {
  const knoten = docJson && Array.isArray(docJson.content) ? docJson.content : []
  const arten = []
  const nachRolle = new Map()
  const zuordnung = {}
  const kennungen = []

  knoten.forEach(node => {
    const id = node?.attrs?.blockId
    if (!id) return
    kennungen.push(id)
    if (node.type === 'heading') return
    const rolle = node?.attrs?.semanticRole
    const name = ALTE_ROLLEN[rolle]
    if (!name) return
    const inhalt = knotenText(node).trim()
    if (!inhalt) return
    if (!nachRolle.has(rolle)) {
      const art = { id: `art-alt-${rolle}`, name, beschreibung: '', funktion: rolle }
      arten.push(art)
      nachRolle.set(rolle, art.id)
    }
    zuordnung[id] = { artId: nachRolle.get(rolle), zeichen: inhalt.length }
  })

  if (!arten.length) return null
  return {
    textsorte: null,
    arten,
    zuordnung,
    laufSignatur: kennungen.join('|'),
    standAt: Number(jetzt) || 0,
  }
}

// Zwei getrennte Karten, weil zwei getrennte Zwecke: Die Funktion speist block.role und
// damit die Rechenlogik; der Name steht in der Struktur-Spalte. Eine Art ohne Funktion
// hat trotzdem einen Namen — sie taucht nur in der Rechenlogik nicht auf.
export function bausteinRollen(bestand) {
  const karte = new Map()
  const gueltig = normalisiereBausteinarten(bestand)
  if (!gueltig) return karte
  const funktionen = new Map(gueltig.arten.map(art => [art.id, art.funktion]))
  Object.entries(gueltig.zuordnung).forEach(([blockId, eintrag]) => {
    const funktion = funktionen.get(eintrag.artId)
    if (funktion) karte.set(blockId, funktion)
  })
  return karte
}

export function bausteinNamen(bestand) {
  const karte = new Map()
  const gueltig = normalisiereBausteinarten(bestand)
  if (!gueltig) return karte
  const namen = new Map(gueltig.arten.map(art => [art.id, art.name]))
  Object.entries(gueltig.zuordnung).forEach(([blockId, eintrag]) => {
    const name = namen.get(eintrag.artId)
    if (name) karte.set(blockId, name)
  })
  return karte
}
```

In `app/src/workspace-model.mjs` den Import ergänzen (zu den vorhandenen Importen oben, Zeile 1–3):

```js
import { normalisiereBausteinarten } from './bausteinlauf-model.mjs'
```

Und in `ensureWorkspaceState` direkt vor `doc.workspace = current` (Zeile 140) einfügen:

```js
  // Die erkannten Bausteinarten liegen NEBEN dem Text (Spec: "Wo es liegt"). Was hier
  // ankommt, kann aus einer aelteren Fassung stammen -- entweder es ist vollstaendig
  // gueltig, oder es ist null. Eine halbe Ablage waere schlimmer als keine.
  current.bausteinarten = normalisiereBausteinarten(current.bausteinarten)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && node --test test/bausteinlauf-model.test.mjs test/workspace-model.test.mjs
```

Erwartet: PASS, keine Regression in `workspace-model.test.mjs`.

- [ ] **Step 5: Commit**

```bash
git add app/src/bausteinlauf-model.mjs app/src/workspace-model.mjs app/test/bausteinlauf-model.test.mjs && git commit -m "feat(bausteine): die Ablage neben dem Text — normalisiert und mit Übernahme der alten Rollen"
```

---

### Task 3: Die Modellantwort verarbeiten

Was das Modell liefert, ist ein Vorschlag, kein Befehl. Diese Aufgabe entscheidet, was davon in die Ablage darf.

**Files:**
- Modify: `app/src/bausteinlauf-model.mjs`
- Test: `app/test/bausteinlauf-model.test.mjs`

**Interfaces:**
- Consumes: `normalisiereBausteinarten`, `strukturSignatur`, `benennbar` (Task 1–2)
- Produces: `verarbeiteBausteinantwort({ antwort, blocks, bestand, jetzt }): { bestand: Bestand | null, verworfen: number }`

Die erwartete Antwortform (Schema in Task 4):

```js
{
  textsorte: 'Wissenschaftliche Arbeit',
  arten: [{ name: 'Befund', beschreibung: 'Ein Ergebnis der eigenen Untersuchung.', funktion: 'evidence' }],
  zuordnung: [{ blockId: 'b1', art: 'Befund' }],
}
```

Die Zuordnung nennt die Art bei ihrem **Namen**, nicht bei einer Kennung: Das Modell soll keine IDs erfinden. Die IDs vergibt dieses Modul.

- [ ] **Step 1: Write the failing test**

An `app/test/bausteinlauf-model.test.mjs` anhängen:

```js
import { verarbeiteBausteinantwort } from '../src/bausteinlauf-model.mjs'

const DREI = [
  { id: 'b1', type: 'paragraph', role: 'paragraph', text: 'Die tragende Aussage dieses Textes.' },
  { id: 'b2', type: 'paragraph', role: 'paragraph', text: 'Eine Zahl aus der Erhebung.' },
  { id: 'b3', type: 'paragraph', role: 'paragraph', text: 'Was daraus folgt.' },
]

const ANTWORT = {
  textsorte: 'Wissenschaftliche Arbeit',
  arten: [
    { name: 'Kernaussage', beschreibung: 'Die These des Textes.', funktion: 'claim' },
    { name: 'Befund', beschreibung: 'Ein Ergebnis der Erhebung.', funktion: 'evidence' },
    { name: 'Einordnung', beschreibung: 'Ordnet ein Ergebnis ein.', funktion: null },
  ],
  zuordnung: [
    { blockId: 'b1', art: 'Kernaussage' },
    { blockId: 'b2', art: 'Befund' },
    { blockId: 'b3', art: 'Einordnung' },
  ],
}

test('eine saubere Antwort wird vollstaendig uebernommen', () => {
  const { bestand, verworfen } = verarbeiteBausteinantwort({ antwort: ANTWORT, blocks: DREI, jetzt: 7 })
  assert.equal(verworfen, 0)
  assert.equal(bestand.textsorte, 'Wissenschaftliche Arbeit')
  assert.deepEqual(bestand.arten.map(art => art.name), ['Kernaussage', 'Befund', 'Einordnung'])
  assert.equal(bestand.standAt, 7)
  assert.equal(bestand.laufSignatur, 'b1|b2|b3')
  assert.equal(bestand.zuordnung.b2.zeichen, 'Eine Zahl aus der Erhebung.'.length)
  assert.deepEqual([...bausteinRollen(bestand)], [['b1', 'claim'], ['b2', 'evidence']])
  assert.equal(bausteinNamen(bestand).get('b3'), 'Einordnung')
})

test('eine Zuordnung auf einen unbekannten Absatz wird verworfen, nicht geraten', () => {
  const antwort = { ...ANTWORT, zuordnung: [...ANTWORT.zuordnung, { blockId: 'b-gibt-es-nicht', art: 'Befund' }] }
  const { bestand, verworfen } = verarbeiteBausteinantwort({ antwort, blocks: DREI, jetzt: 1 })
  assert.equal(verworfen, 1)
  assert.equal(bestand.zuordnung['b-gibt-es-nicht'], undefined)
})

test('eine Zuordnung auf eine nicht genannte Art wird verworfen', () => {
  const antwort = { ...ANTWORT, zuordnung: [{ blockId: 'b1', art: 'Pointe' }] }
  const { bestand, verworfen } = verarbeiteBausteinantwort({ antwort, blocks: DREI, jetzt: 1 })
  assert.equal(verworfen, 1)
  assert.equal(Object.keys(bestand.zuordnung).length, 0)
})

test('eine Ueberschrift bekommt nie einen Namen, auch wenn das Modell es versucht', () => {
  const blocks = [...DREI, { id: 'h1', type: 'heading', role: 'heading', text: 'Ein Titel' }]
  const antwort = { ...ANTWORT, zuordnung: [...ANTWORT.zuordnung, { blockId: 'h1', art: 'Befund' }] }
  const { bestand, verworfen } = verarbeiteBausteinantwort({ antwort, blocks, jetzt: 1 })
  assert.equal(verworfen, 1)
  assert.equal(bestand.zuordnung.h1, undefined)
})

test('unerwaehnte Absaetze behalten ihren bisherigen Namen', () => {
  const erst = verarbeiteBausteinantwort({ antwort: ANTWORT, blocks: DREI, jetzt: 1 }).bestand
  const nurB3 = {
    textsorte: 'Wissenschaftliche Arbeit',
    arten: ANTWORT.arten,
    zuordnung: [{ blockId: 'b3', art: 'Kernaussage' }],
  }
  const { bestand } = verarbeiteBausteinantwort({ antwort: nurB3, blocks: DREI, bestand: erst, jetzt: 2 })
  assert.equal(bausteinNamen(bestand).get('b1'), 'Kernaussage')
  assert.equal(bausteinNamen(bestand).get('b2'), 'Befund')
  assert.equal(bausteinNamen(bestand).get('b3'), 'Kernaussage')
})

test('ein Absatz, den es nicht mehr gibt, faellt aus dem uebernommenen Bestand', () => {
  const erst = verarbeiteBausteinantwort({ antwort: ANTWORT, blocks: DREI, jetzt: 1 }).bestand
  const ohneB2 = DREI.filter(block => block.id !== 'b2')
  const { bestand } = verarbeiteBausteinantwort({
    antwort: { ...ANTWORT, zuordnung: [] }, blocks: ohneB2, bestand: erst, jetzt: 2,
  })
  assert.equal(bestand.zuordnung.b2, undefined)
  assert.equal(bausteinNamen(bestand).get('b1'), 'Kernaussage')
})

test('eine Antwort ohne verwertbare Arten aendert nichts', () => {
  const erst = verarbeiteBausteinantwort({ antwort: ANTWORT, blocks: DREI, jetzt: 1 }).bestand
  const { bestand, verworfen } = verarbeiteBausteinantwort({
    antwort: { textsorte: '', arten: [], zuordnung: [] }, blocks: DREI, bestand: erst, jetzt: 2,
  })
  assert.equal(bestand, erst)
  assert.equal(verworfen, 0)
})

test('ohne bisherigen Bestand ergibt eine leere Antwort null', () => {
  const { bestand } = verarbeiteBausteinantwort({ antwort: null, blocks: DREI, jetzt: 1 })
  assert.equal(bestand, null)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && node --test test/bausteinlauf-model.test.mjs
```

Erwartet: FAIL — `verarbeiteBausteinantwort is not a function`.

- [ ] **Step 3: Write minimal implementation**

An `app/src/bausteinlauf-model.mjs` anhängen:

```js
// Die Antwort ist ein Vorschlag, kein Befehl. Was auf keinen vorhandenen, benennbaren
// Absatz oder auf keine im selben Zug genannte Art zeigt, wird verworfen und gezaehlt --
// nie geraten (dieselbe Regel wie bei den Ankern, hinweislauf-model.mjs:61).
//
// Absaetze, die die Antwort NICHT erwaehnt, behalten ihren bisherigen Namen. Genau das
// haelt die Struktur-Spalte ruhig, wenn ein Lauf wegen eines einzigen neuen Absatzes
// startet: die uebrigen Karten stehen still.
export function verarbeiteBausteinantwort({ antwort, blocks, bestand = null, jetzt = Date.now() } = {}) {
  const liste = (Array.isArray(blocks) ? blocks : []).filter(benennbar)
  const vorhanden = new Set(liste.map(block => block.id))
  const laengen = new Map(liste.map(block => [block.id, String(block.text || '').trim().length]))
  const bisher = normalisiereBausteinarten(bestand)

  const neueArten = normalisiereBausteinarten({
    textsorte: antwort?.textsorte,
    arten: Array.isArray(antwort?.arten) ? antwort.arten : [],
    zuordnung: {},
  })
  if (!neueArten) {
    if (!bisher) return { bestand: null, verworfen: 0 }
    // Nichts Verwertbares geliefert: der bisherige Stand bleibt unangetastet.
    return { bestand, verworfen: 0 }
  }

  const nachName = new Map(neueArten.arten.map(art => [art.name.toLocaleLowerCase('de'), art.id]))
  const zuordnung = {}
  let verworfen = 0

  // Zuerst der Bestand: uebernommen wird, was noch existiert UND dessen Art die Antwort
  // erneut nennt. Ein Name, dessen Art es nicht mehr gibt, waere sonst ein Waisenkind.
  if (bisher) {
    const alteNamen = new Map(bisher.arten.map(art => [art.id, art.name.toLocaleLowerCase('de')]))
    Object.entries(bisher.zuordnung).forEach(([blockId, eintrag]) => {
      if (!vorhanden.has(blockId)) return
      const artId = nachName.get(alteNamen.get(eintrag.artId))
      if (!artId) return
      zuordnung[blockId] = { artId, zeichen: eintrag.zeichen }
    })
  }

  ;(Array.isArray(antwort?.zuordnung) ? antwort.zuordnung : []).forEach(eintrag => {
    const blockId = text(eintrag?.blockId)
    const artId = nachName.get(text(eintrag?.art).toLocaleLowerCase('de'))
    if (!blockId || !artId || !vorhanden.has(blockId)) { verworfen += 1; return }
    zuordnung[blockId] = { artId, zeichen: laengen.get(blockId) || 0 }
  })

  return {
    bestand: {
      textsorte: neueArten.textsorte,
      arten: neueArten.arten,
      zuordnung,
      laufSignatur: strukturSignatur(blocks),
      standAt: Number(jetzt) || 0,
    },
    verworfen,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && node --test test/bausteinlauf-model.test.mjs
```

Erwartet: PASS, 26 Tests insgesamt.

- [ ] **Step 5: Commit**

```bash
git add app/src/bausteinlauf-model.mjs app/test/bausteinlauf-model.test.mjs && git commit -m "feat(bausteine): die Modellantwort wird geprüft, nicht geglaubt"
```

---

### Task 4: Schema, Auftragstext und Task-Tabelle

Der Vertrag mit dem Modell. Ohne ihn kann die Antwort jede Form haben.

**Files:**
- Modify: `app/src/agent-prompts.mjs`
- Modify: `app/src/agent-tasks.mjs:183-194` (TASK_TABLE)
- Test: `app/test/agent-tasks.test.mjs` (vorhanden — anhängen)

**Interfaces:**
- Consumes: `FUNKTIONEN` aus `bausteinlauf-model.mjs` (Task 1)
- Produces:
  - `BAUSTEINARTEN_ANWEISUNG: string` (aus `agent-prompts.mjs`)
  - `BAUSTEINARTEN_SCHEMA: object` (aus `agent-tasks.mjs`)
  - `TASK_TABLE.bausteinarten` — `{ modell: 'stark', maxTokens: 8000, stream: false, schema: BAUSTEINARTEN_SCHEMA }`

- [ ] **Step 1: Write the failing test**

An `app/test/agent-tasks.test.mjs` anhängen:

```js
import { BAUSTEINARTEN_SCHEMA, TASK_TABLE, baueAnfrage } from '../src/agent-tasks.mjs'
import { FUNKTIONEN } from '../src/bausteinlauf-model.mjs'

test('der Task bausteinarten laeuft auf dem starken Modell, ohne Strom', () => {
  const eintrag = TASK_TABLE.bausteinarten
  assert.equal(eintrag.modell, 'stark')
  assert.equal(eintrag.stream, false)
  assert.equal(eintrag.schema, BAUSTEINARTEN_SCHEMA)
})

test('das Schema laesst genau die Funktionen zu, die die Rechenlogik kennt — und null', () => {
  const funktion = BAUSTEINARTEN_SCHEMA.properties.arten.items.properties.funktion
  const erlaubt = funktion.anyOf.find(zweig => Array.isArray(zweig.enum))
  assert.deepEqual(erlaubt.enum, [...FUNKTIONEN])
  assert.ok(funktion.anyOf.some(zweig => zweig.type === 'null'))
})

test('das Schema ist geschlossen: keine erfundenen Felder, alle Felder Pflicht', () => {
  assert.equal(BAUSTEINARTEN_SCHEMA.additionalProperties, false)
  assert.deepEqual(BAUSTEINARTEN_SCHEMA.required, ['textsorte', 'arten', 'zuordnung'])
  const art = BAUSTEINARTEN_SCHEMA.properties.arten.items
  assert.equal(art.additionalProperties, false)
  assert.deepEqual(art.required, ['name', 'beschreibung', 'funktion'])
  const zu = BAUSTEINARTEN_SCHEMA.properties.zuordnung.items
  assert.equal(zu.additionalProperties, false)
  assert.deepEqual(zu.required, ['blockId', 'art'])
})

test('die Anfrage traegt das Schema und den gecachten Praefix', () => {
  const anfrage = baueAnfrage('bausteinarten', {
    verstaendnis: { thema: 'Calm Technology' },
    docText: 'Ein Absatz.',
    volatiles: ['Auftrag'],
  })
  assert.equal(anfrage.body.output_config.format.schema, BAUSTEINARTEN_SCHEMA)
  assert.equal(anfrage.body.model, 'claude-opus-5')
  assert.equal(anfrage.body.stream, undefined)
  const gecacht = anfrage.body.messages[0].content.filter(block => block.cache_control)
  assert.equal(gecacht.length, 2)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && node --test test/agent-tasks.test.mjs
```

Erwartet: FAIL — `BAUSTEINARTEN_SCHEMA` ist `undefined`.

- [ ] **Step 3: Write minimal implementation**

In `app/src/agent-prompts.mjs` anhängen:

```js
// Der Auftrag für den Bausteinlauf. Zwei Dinge in einem Zug: erst erkennen, was für ein
// Text das ist, DANN daraus die Arten ableiten. Die Reihenfolge steht ausdrücklich im
// Auftrag, weil sie den ganzen Unterschied macht: Wer zuerst Absätze sortiert, greift zu
// allgemeinen Schubladen; wer zuerst die Textsorte benennt, findet die Wörter dieses Textes.
export const BAUSTEINARTEN_ANWEISUNG = [
  'AUFGABE: Benenne, was die einzelnen Absätze in DIESEM Text tun.',
  '',
  'Schritt 1 — Textsorte: Bestimme zuerst knapp, was für ein Text das ist',
  '(z. B. "Wissenschaftliche Arbeit", "Essay", "Produkttext", "Blogbeitrag").',
  '',
  'Schritt 2 — Arten: Leite daraus die Bausteinarten ab, die GENAU DIESER Text hat.',
  'Nicht aus einer allgemeinen Liste, sondern aus dieser Textsorte. Eine',
  'wissenschaftliche Arbeit hat andere Arten (Methode, Befund, Einschränkung) als ein',
  'Essay (Anekdote, Wendung, Einwand, Pointe). Benenne sie so, wie eine erfahrene',
  'Lektorin sie im Gespräch nennen würde: ein bis zwei Wörter, im Deutschen, ohne',
  'Fachjargon. Höchstens acht Arten — mehr heißt, dass zu fein unterschieden wurde.',
  'Jede Art bekommt einen Satz, wozu sie dient.',
  '',
  'Schritt 3 — Funktion: Gib zu jeder Art an, ob sie einer dieser Rollen im Argument',
  'entspricht: claim (die tragende Behauptung), evidence (stützt eine Behauptung),',
  'counterpoint (spricht dagegen), transition (führt von einem Gedanken zum nächsten),',
  'question (lässt offen). Passt keine, dann null. Rate nicht: null ist die richtige',
  'Antwort, wenn die Art nichts davon ist. Höchstens EINE Art trägt claim.',
  '',
  'Schritt 4 — Zuordnung: Ordne jeden genannten Absatz genau einer der Arten zu, über',
  'seine blockId. Nenne die Art bei ihrem Namen aus Schritt 2. Überschriften bekommen',
  'keine Art. Bist du dir bei einem Absatz nicht sicher, lass ihn weg — ein fehlender',
  'Name ist besser als ein falscher.',
].join('\n')
```

In `app/src/agent-tasks.mjs` — Import ergänzen (oben zu den vorhandenen):

```js
import { FUNKTIONEN } from './bausteinlauf-model.mjs'
```

Vor `TASK_TABLE` einfügen:

```js
// Der dritte Kanal (Bausteinarten). Die Zuordnung nennt die Art bei ihrem NAMEN, nicht
// bei einer Kennung: Das Modell soll keine IDs erfinden, die dann irgendwo aufgelöst
// werden müssten. Die IDs vergibt bausteinlauf-model.mjs beim Verarbeiten.
export const BAUSTEINARTEN_SCHEMA = Object.freeze({
  type: 'object',
  properties: {
    textsorte: {
      type: 'string',
      description: 'Knapp, was für ein Text das ist. Bestimmt, welche Arten überhaupt in Frage kommen.',
    },
    arten: {
      type: 'array',
      maxItems: 8,
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Ein bis zwei Wörter im Deutschen, so wie eine Lektorin die Art im Gespräch nennt.',
          },
          beschreibung: { type: 'string', description: 'Ein Satz, wozu diese Art in diesem Text dient.' },
          funktion: {
            anyOf: [
              { type: 'string', enum: [...FUNKTIONEN] },
              { type: 'null' },
            ],
            description: 'Die Rolle im Argument, oder null. null ist richtig, wenn keine passt — nicht raten.',
          },
        },
        required: ['name', 'beschreibung', 'funktion'],
        additionalProperties: false,
      },
    },
    zuordnung: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          blockId: { type: 'string', description: 'Die Kennung des Absatzes aus dem gelieferten Absatzverzeichnis.' },
          art: { type: 'string', description: 'Der Name einer Art aus arten, zeichengenau.' },
        },
        required: ['blockId', 'art'],
        additionalProperties: false,
      },
    },
  },
  required: ['textsorte', 'arten', 'zuordnung'],
  additionalProperties: false,
})
```

In `TASK_TABLE` (nach `erweiterungen`) ergänzen:

```js
  // Bausteinarten laufen auf dem starken Modell: Die Aufgabe ist nicht, Absätze in
  // bekannte Schubladen zu sortieren, sondern für DIESEN Text erst die passenden
  // Schubladen zu finden. Genau das kann ein Routine-Modell nicht -- es liefert
  // zuverlässig die allgemeine Liste, also die, die wir gerade abgeschafft haben.
  // 8000 Tokens reichen: acht Arten plus eine Zuordnungszeile je Absatz.
  bausteinarten: Object.freeze({ modell: 'stark', maxTokens: 8000, stream: false, schema: BAUSTEINARTEN_SCHEMA }),
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && node --test test/agent-tasks.test.mjs
```

Erwartet: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/agent-prompts.mjs app/src/agent-tasks.mjs app/test/agent-tasks.test.mjs && git commit -m "feat(bausteine): der Vertrag mit dem Modell — Schema, Auftrag, Tabelleneintrag"
```

---

### Task 5: Der Kontextbau

`baueAnfrage` liest ausschließlich `{verstaendnis, docText, volatiles, verlauf, anfrage}`. Eigene Feldnamen würden stillschweigend ignoriert — genau der Fehler, den `hinweis-kontext.mjs:3` dokumentiert. Dieses Modul übersetzt.

**Files:**
- Create: `app/src/bausteinarten-kontext.mjs`
- Test: `app/test/bausteinarten-kontext.test.mjs`

**Interfaces:**
- Consumes: `BAUSTEINARTEN_ANWEISUNG` (Task 4)
- Produces: `baueBausteinKontext({ verstaendnis, docText, blocks, bestand }): { verstaendnis, docText, volatiles }`

- [ ] **Step 1: Write the failing test**

`app/test/bausteinarten-kontext.test.mjs` (neue Datei):

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { baueBausteinKontext } from '../src/bausteinarten-kontext.mjs'
import { BAUSTEINARTEN_ANWEISUNG } from '../src/agent-prompts.mjs'
import { baueAnfrage } from '../src/agent-tasks.mjs'

const BLOCKS = [
  { id: 'b1', type: 'paragraph', role: 'paragraph', text: 'Die tragende Aussage.' },
  { id: 'h1', type: 'heading', role: 'heading', text: 'Ein Titel' },
  { id: 'b2', type: 'paragraph', role: 'paragraph', text: '   ' },
]

test('der Auftrag steht an erster Stelle der volatilen Bloecke', () => {
  const kontext = baueBausteinKontext({ docText: 'Text', blocks: BLOCKS })
  assert.equal(kontext.volatiles[0], BAUSTEINARTEN_ANWEISUNG)
})

test('das Absatzverzeichnis nennt nur benennbare Absaetze, mit Kennung und Anriss', () => {
  const kontext = baueBausteinKontext({ docText: 'Text', blocks: BLOCKS })
  const verzeichnis = kontext.volatiles.find(block => block.startsWith('Absätze:'))
  assert.ok(verzeichnis, 'kein Absatzverzeichnis im Kontext')
  assert.match(verzeichnis, /b1/)
  assert.doesNotMatch(verzeichnis, /h1/)
  assert.doesNotMatch(verzeichnis, /b2/)
})

test('ein vorhandener Bestand reist als bisheriger Stand mit', () => {
  const bestand = {
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Wendung', beschreibung: 'Dreht den Gedanken.', funktion: 'transition' }],
    zuordnung: { b1: { artId: 'art-1', zeichen: 5 } },
    laufSignatur: 'b1',
    standAt: 1,
  }
  const kontext = baueBausteinKontext({ docText: 'Text', blocks: BLOCKS, bestand })
  const stand = kontext.volatiles.find(block => block.startsWith('Bisher erkannt:'))
  assert.ok(stand)
  assert.match(stand, /Wendung/)
  assert.match(stand, /Essay/)
})

test('ohne Bestand entsteht kein Stand-Block', () => {
  const kontext = baueBausteinKontext({ docText: 'Text', blocks: BLOCKS })
  assert.equal(kontext.volatiles.some(block => block.startsWith('Bisher erkannt:')), false)
})

test('baueAnfrage nimmt diesen Kontext ohne Verlust an', () => {
  const kontext = baueBausteinKontext({ verstaendnis: { thema: 'x' }, docText: 'Text', blocks: BLOCKS })
  const anfrage = baueAnfrage('bausteinarten', kontext)
  const texte = anfrage.body.messages[0].content.map(block => block.text)
  assert.ok(texte.some(text => text.includes(BAUSTEINARTEN_ANWEISUNG)))
  assert.ok(texte.some(text => text.includes('<dokument>Text</dokument>')))
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && node --test test/bausteinarten-kontext.test.mjs
```

Erwartet: FAIL — Modul nicht gefunden.

- [ ] **Step 3: Write minimal implementation**

`app/src/bausteinarten-kontext.mjs` (neue Datei):

```js
// Reiner Kontext-Bauer für den Task 'bausteinarten' — PUR, node-testbar, kein DOM.
// Übersetzt die Rohdaten auf den tatsächlichen baueAnfrage-Vertrag
// ({verstaendnis, docText, volatiles}). Vorbild: hinweis-kontext.mjs.
import { BAUSTEINARTEN_ANWEISUNG } from './agent-prompts.mjs'

const ANRISS_ZEICHEN = 120

function benennbar(block) {
  if (!block?.id) return false
  if (block.type === 'heading' || block.role === 'heading') return false
  return Boolean(String(block.text || '').trim())
}

// Das Absatzverzeichnis ist volatil, nicht gecacht: Es ändert sich mit jedem neuen
// Absatz, während der Dokumenttext im Cache-Präfix liegt und dort stabil bleiben muss
// (Cache-Präfix-Stabilität, agent-tasks.mjs:196).
//
// Der Anriss statt des vollen Absatzes: Der ganze Wortlaut steht bereits im <dokument>.
// Das Verzeichnis hat nur die Aufgabe, Kennung und Absatz zusammenzubringen -- dafür
// reichen die ersten Zeichen, und der Auftrag bleibt kurz genug, um im Blick zu bleiben.
function absatzVerzeichnis(blocks) {
  const eintraege = (Array.isArray(blocks) ? blocks : []).filter(benennbar).map(block => ({
    blockId: block.id,
    anriss: String(block.text || '').trim().slice(0, ANRISS_ZEICHEN),
  }))
  return eintraege.length ? `Absätze: ${JSON.stringify(eintraege)}` : null
}

// Der bisherige Stand reist mit, damit die Namen zwischen zwei Läufen nicht wandern:
// Was schon "Befund" hieß, soll nicht beim nächsten Lauf "Ergebnis" heißen, nur weil
// beides passt. Ohne bisherigen Stand entsteht kein Block.
function bisherigerStand(bestand) {
  if (!bestand || !Array.isArray(bestand.arten) || !bestand.arten.length) return null
  const arten = bestand.arten.map(art => ({ name: art.name, funktion: art.funktion }))
  return 'Bisher erkannt: '
    + `Textsorte ${JSON.stringify(bestand.textsorte || 'unbekannt')}, Arten ${JSON.stringify(arten)}. `
    + 'Behalte diese Namen bei, wo sie weiter passen — benenne nur um, wenn der alte Name falsch geworden ist.'
}

export function baueBausteinKontext({
  verstaendnis = null,
  docText = '',
  blocks = [],
  bestand = null,
} = {}) {
  const volatiles = [BAUSTEINARTEN_ANWEISUNG]
  const stand = bisherigerStand(bestand)
  if (stand) volatiles.push(stand)
  const verzeichnis = absatzVerzeichnis(blocks)
  if (verzeichnis) volatiles.push(verzeichnis)
  return { verstaendnis, docText, volatiles }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && node --test test/bausteinarten-kontext.test.mjs
```

Erwartet: PASS, 5 Tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/bausteinarten-kontext.mjs app/test/bausteinarten-kontext.test.mjs && git commit -m "feat(bausteine): der Kontext trifft den baueAnfrage-Vertrag"
```

---

### Task 6: Der Lauf selbst

Ein vollständiger Versuch: Gate → Sperre **synchron** vor jedem `await` → Schlüssel → Konsistenzprüfung → Kontext → `runTask` → Antwort verarbeiten. Die Reihenfolge ist nicht Geschmack: Zwei kurz aufeinanderfolgende Auslöser würden sonst beide einen teuren Aufruf starten (`hinweislauf-model.mjs:146`).

**Files:**
- Modify: `app/src/bausteinlauf-model.mjs`
- Test: `app/test/bausteinlauf-model.test.mjs`

**Interfaces:**
- Consumes: `pruefeBausteinBedarf`, `verarbeiteBausteinantwort` (Task 1, 3), `baueBausteinKontext` (Task 5)
- Produces: `versucheBausteinlauf(optionen): Promise<Ergebnis>` mit
  - `{ gestartet: false, grund: string }` oder
  - `{ gestartet: true, erfolg: true, bestand, verworfen, zeit }` oder
  - `{ gestartet: true, erfolg: false, fehler: string }`

- [ ] **Step 1: Write the failing test**

An `app/test/bausteinlauf-model.test.mjs` anhängen:

```js
import { versucheBausteinlauf } from '../src/bausteinlauf-model.mjs'

function laufAufbau(ueberschreibung = {}) {
  let gesperrt = false
  const aufrufe = []
  return {
    aufrufe,
    liestSperre: () => gesperrt,
    optionen: {
      hatDokument: true,
      istBeispielprojekt: false,
      laeuftBereits: false,
      blocks: DREI,
      bestand: null,
      docText: 'Ein Text.',
      verstaendnis: null,
      sperreSetzen: wert => { gesperrt = wert },
      hatSchluessel: async () => true,
      istNochDasselbeDokument: () => true,
      beansprucheKostenfreigabe: () => ({ erlaubt: true }),
      runTask: async (task, kontext) => { aufrufe.push({ task, kontext }); return { daten: ANTWORT } },
      setzeAgentStatus: () => {},
      jetzt: () => 9,
      ...ueberschreibung,
    },
  }
}

test('ein sauberer Lauf liefert einen Bestand und ruft genau einmal an', async () => {
  const aufbau = laufAufbau()
  const ergebnis = await versucheBausteinlauf(aufbau.optionen)
  assert.equal(ergebnis.gestartet, true)
  assert.equal(ergebnis.erfolg, true)
  assert.equal(aufbau.aufrufe.length, 1)
  assert.equal(aufbau.aufrufe[0].task, 'bausteinarten')
  assert.equal(bausteinNamen(ergebnis.bestand).get('b1'), 'Kernaussage')
  assert.equal(aufbau.liestSperre(), false, 'die Sperre wurde nicht wieder gelöst')
})

test('ohne Bedarf laeuft nichts', async () => {
  const erst = verarbeiteBausteinantwort({ antwort: ANTWORT, blocks: DREI, jetzt: 1 }).bestand
  const aufbau = laufAufbau({ bestand: erst })
  const ergebnis = await versucheBausteinlauf(aufbau.optionen)
  assert.deepEqual(ergebnis, { gestartet: false, grund: 'aktuell' })
  assert.equal(aufbau.aufrufe.length, 0)
})

test('das Beispielprojekt loest nie einen Aufruf aus', async () => {
  const aufbau = laufAufbau({ istBeispielprojekt: true })
  const ergebnis = await versucheBausteinlauf(aufbau.optionen)
  assert.equal(ergebnis.grund, 'beispielprojekt')
  assert.equal(aufbau.aufrufe.length, 0)
})

test('die Sperre steht VOR dem ersten await — zwei Ausloeser ergeben einen Aufruf', async () => {
  let gesperrt = false
  const aufrufe = []
  let loeseSchluessel
  const optionen = {
    ...laufAufbau().optionen,
    sperreSetzen: wert => { gesperrt = wert },
    hatSchluessel: () => new Promise(resolve => { loeseSchluessel = () => resolve(true) }),
    runTask: async () => { aufrufe.push(1); return { daten: ANTWORT } },
  }
  const erster = versucheBausteinlauf({ ...optionen, laeuftBereits: false })
  const zweiter = versucheBausteinlauf({ ...optionen, get laeuftBereits() { return gesperrt } })
  loeseSchluessel()
  const [a, b] = await Promise.all([erster, zweiter])
  assert.equal(aufrufe.length, 1)
  assert.equal(a.gestartet !== b.gestartet, true, 'genau einer der beiden darf starten')
})

test('ein Dokumentwechsel waehrend des Schluessel-Checks bricht ab, bevor etwas kostet', async () => {
  const aufbau = laufAufbau({ istNochDasselbeDokument: () => false })
  const ergebnis = await versucheBausteinlauf(aufbau.optionen)
  assert.equal(ergebnis.grund, 'dokument-gewechselt')
  assert.equal(aufbau.aufrufe.length, 0)
})

test('eine verweigerte Kostenfreigabe haelt den Lauf an', async () => {
  const aufbau = laufAufbau({ beansprucheKostenfreigabe: () => ({ erlaubt: false, grund: 'monatsbudget-erreicht' }) })
  const ergebnis = await versucheBausteinlauf(aufbau.optionen)
  assert.equal(ergebnis.grund, 'monatsbudget-erreicht')
  assert.equal(aufbau.aufrufe.length, 0)
})

test('ein Fehler wird gemeldet, nicht verschluckt — und die Sperre faellt', async () => {
  const status = []
  const aufbau = laufAufbau({
    runTask: async () => { const fehler = new Error('kaputt'); fehler.typ = 'schema'; throw fehler },
    setzeAgentStatus: zustand => status.push(zustand),
  })
  const ergebnis = await versucheBausteinlauf(aufbau.optionen)
  assert.equal(ergebnis.erfolg, false)
  assert.equal(ergebnis.fehler, 'schema')
  assert.equal(aufbau.liestSperre(), false)
  assert.equal(status.at(-1).zustand, 'fehler')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && node --test test/bausteinlauf-model.test.mjs
```

Erwartet: FAIL — `versucheBausteinlauf is not a function`.

- [ ] **Step 3: Write minimal implementation**

Import oben in `app/src/bausteinlauf-model.mjs` ergänzen:

```js
import { baueBausteinKontext } from './bausteinarten-kontext.mjs'
```

Ans Dateiende anhängen:

```js
// Ein vollstaendiger Versuch. sperreSetzen(true) laeuft SYNCHRON, sofort nach der reinen
// Bedarfspruefung und VOR dem ersten await -- sonst lesen zwei kurz aufeinanderfolgende
// Ausloeser beide `false`, haengen beide im selben await und starten beide einen teuren
// runTask-Aufruf (dieselbe Lehre wie in versucheHinweislauf, hinweislauf-model.mjs:146).
//
// istNochDasselbeDokument() prueft NACH dem await: Wer waehrend des Schluessel-Checks das
// Dokument wechselt, bekaeme sonst die Bausteinarten des einen Textes in die Ablage des
// anderen geschrieben.
export async function versucheBausteinlauf({
  hatDokument,
  istBeispielprojekt,
  laeuftBereits,
  blocks,
  bestand = null,
  docText = '',
  verstaendnis = null,
  grenze = UMSCHREIB_GRENZE,
  sperreSetzen,
  hatSchluessel,
  istNochDasselbeDokument,
  beansprucheKostenfreigabe,
  runTask,
  setzeAgentStatus,
  jetzt = Date.now,
}) {
  if (!hatDokument) return { gestartet: false, grund: 'kein-dokument' }
  if (istBeispielprojekt) return { gestartet: false, grund: 'beispielprojekt' }
  if (laeuftBereits) return { gestartet: false, grund: 'lauf-aktiv' }
  const bedarf = pruefeBausteinBedarf({ blocks, bestand, grenze })
  if (!bedarf.noetig) return { gestartet: false, grund: bedarf.grund }

  sperreSetzen(true)
  try {
    if (!(await hatSchluessel())) return { gestartet: false, grund: 'kein-schluessel' }
    if (!istNochDasselbeDokument()) return { gestartet: false, grund: 'dokument-gewechselt' }
    const kostenfreigabe = typeof beansprucheKostenfreigabe === 'function'
      ? beansprucheKostenfreigabe()
      : { erlaubt: true }
    if (!kostenfreigabe?.erlaubt) {
      return { gestartet: false, grund: kostenfreigabe?.grund || 'kostenfreigabe-fehlt' }
    }

    const kontext = baueBausteinKontext({ verstaendnis, docText, blocks, bestand })
    setzeAgentStatus({ zustand: 'laeuft' })
    const { daten } = await runTask('bausteinarten', kontext)
    setzeAgentStatus({ zustand: 'bereit' })
    const zeit = jetzt()
    const ergebnis = verarbeiteBausteinantwort({ antwort: daten, blocks, bestand, jetzt: zeit })
    return { gestartet: true, erfolg: true, bestand: ergebnis.bestand, verworfen: ergebnis.verworfen, zeit }
  } catch (fehler) {
    // Sichtbarer, unaufgeregter Fehlerhinweis statt eines stillen Leerzustands (Spec §7).
    setzeAgentStatus({ zustand: 'fehler', fehlerTyp: fehler?.typ })
    return { gestartet: true, erfolg: false, fehler: fehler?.typ || 'unbekannt' }
  } finally {
    sperreSetzen(false)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && node --test test/bausteinlauf-model.test.mjs
```

Erwartet: PASS, 33 Tests.

- [ ] **Step 5: Commit**

```bash
git add app/src/bausteinlauf-model.mjs app/test/bausteinlauf-model.test.mjs && git commit -m "feat(bausteine): der Lauf — Sperre vor dem ersten await, Abbruch vor jeder Ausgabe"
```

---

### Task 7: Eine Blockquelle, aus der die Rollen kommen

Heute stammt `block.role` aus dem Tiptap-Merkmal. Künftig aus der Ablage. Damit keine Aufrufstelle das vergessen kann, bekommt `workspace.js` **eine** Stelle, die Blöcke liefert.

**Files:**
- Modify: `app/src/workspace-model.mjs:144-157` (`collectBlockSnapshots`)
- Modify: `app/src/block-identity.js:83-85` (`getEditorBlocks`)
- Modify: `app/src/workspace.js` — 19 Aufrufstellen von `getEditorBlocks(ctx.editor)`
- Test: `app/test/workspace-model.test.mjs`

**Interfaces:**
- Consumes: `bausteinRollen` (Task 2)
- Produces:
  - `collectBlockSnapshots(docJson, rollen = null)` — `rollen` ist eine `Map<blockId, funktion>`
  - `getEditorBlocks(editor, rollen = null)`
  - `aktuelleBloecke()` in `workspace.js` — liefert immer Blöcke MIT Rollen

- [ ] **Step 1: Write the failing test**

An `app/test/workspace-model.test.mjs` anhängen:

```js
test('ohne Rollenkarte ist jeder Absatz ein gewoehnlicher Absatz', () => {
  const blocks = collectBlockSnapshots({
    content: [
      { type: 'heading', attrs: { level: 2, blockId: 'h1' }, content: [{ type: 'text', text: 'Titel' }] },
      { type: 'paragraph', attrs: { blockId: 'b1' }, content: [{ type: 'text', text: 'Ein Absatz.' }] },
    ],
  })
  assert.deepEqual(blocks.map(block => block.role), ['heading', 'paragraph'])
})

test('die Rollenkarte speist block.role, das alte Merkmal nicht mehr', () => {
  const docJson = {
    content: [
      { type: 'heading', attrs: { level: 2, blockId: 'h1' }, content: [{ type: 'text', text: 'Titel' }] },
      { type: 'paragraph', attrs: { blockId: 'b1', semanticRole: 'claim' }, content: [{ type: 'text', text: 'Alt.' }] },
      { type: 'paragraph', attrs: { blockId: 'b2' }, content: [{ type: 'text', text: 'Neu.' }] },
    ],
  }
  const blocks = collectBlockSnapshots(docJson, new Map([['b2', 'counterpoint']]))
  assert.deepEqual(blocks.map(block => block.role), ['heading', 'paragraph', 'counterpoint'])
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && node --test test/workspace-model.test.mjs
```

Erwartet: FAIL im zweiten Test — `b1` liefert `'claim'` statt `'paragraph'`.

- [ ] **Step 3: Write minimal implementation**

`app/src/workspace-model.mjs:144-157` ersetzen:

```js
// rollen: Map<blockId, funktion> aus doc.workspace.bausteinarten (bausteinlauf-model.mjs).
// Das alte Merkmal node.attrs.semanticRole wird bewusst NICHT mehr gelesen: Seit dem
// 7. August 2026 liegen die Bausteinarten neben dem Text, und zwei Quellen für dieselbe
// Angabe sind eine Quelle zu viel. Bestehende Dokumente verlieren nichts —
// bestandAusAltenRollen hebt alte Merkmale beim ersten Laden in die Ablage.
export function collectBlockSnapshots(docJson, rollen = null) {
  return (docJson && Array.isArray(docJson.content) ? docJson.content : []).map((node, index) => {
    const text = textOf(node).trim()
    const id = (node.attrs && node.attrs.blockId) || null
    const role = node.type === 'heading'
      ? 'heading'
      : (id && rollen && rollen.get(id)) || 'paragraph'
    return { id, index, type: node.type, role, text, excerpt: text.slice(0, 160) }
  })
}
```

`app/src/block-identity.js:83-85`:

```js
export function getEditorBlocks(editor, rollen = null) {
  if (!editor) return []
  const snapshots = collectBlockSnapshots(editor.getJSON(), rollen)
```

In `app/src/workspace.js` neben den anderen Hilfsfunktionen einfügen (etwa bei Zeile 440, vor der ersten Aufrufstelle):

```js
// EINE Stelle, an der Bloecke entstehen. Vorher rief workspace.js an 19 Stellen direkt
// getEditorBlocks(ctx.editor) -- eine davon zu vergessen hiesse, dort still ohne Rollen
// zu arbeiten, ohne dass ein Test anschlaegt. Genau so ist die Luecke entstanden, die
// dieser Umbau schliesst.
function bausteinBestand(workspace = activeWorkspace()) {
  return workspace?.bausteinarten || null
}

function aktuelleBloecke(editor = ctx?.editor) {
  return getEditorBlocks(editor, bausteinRollen(bausteinBestand()))
}
```

Import in `app/src/workspace.js` ergänzen:

```js
import {
  bausteinNamen,
  bausteinRollen,
  bestandAusAltenRollen,
  pruefeBausteinBedarf,
  versucheBausteinlauf,
} from './bausteinlauf-model.mjs'
```

Dann alle 19 Vorkommen von `getEditorBlocks(ctx.editor)` bzw. `getEditorBlocks(ctx?.editor)` in `workspace.js` durch `aktuelleBloecke()` ersetzen. Zu finden mit:

```bash
grep -n "getEditorBlocks(ctx" app/src/workspace.js
```

Nach dem Ersetzen darf `grep -c "getEditorBlocks(ctx" app/src/workspace.js` **0** liefern; der Import von `getEditorBlocks` bleibt, weil `aktuelleBloecke` ihn nutzt.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && npm run test:unit
```

Erwartet: PASS. Danach zur Kontrolle:

```bash
cd app && grep -c "getEditorBlocks(ctx" src/workspace.js
```

Erwartet: `0`.

- [ ] **Step 5: Commit**

```bash
git add app/src/workspace-model.mjs app/src/block-identity.js app/src/workspace.js app/test/workspace-model.test.mjs && git commit -m "refactor(bausteine): eine Blockquelle — die Rolle kommt aus der Ablage, nicht mehr aus dem Text"
```

---

### Task 8: Auslöser und Ausführung in der Oberfläche

**Files:**
- Modify: `app/src/workspace.js` — neben `planeHinweislauf` (Zeile 4241) und `fuehreHinweislaufAus` (Zeile 3965)
- Modify: `app/src/workspace.js:4272-4276` (`scheduleAgentInitiative`)

**Interfaces:**
- Consumes: `versucheBausteinlauf`, `bestandAusAltenRollen` (Task 2, 6), `aktuelleBloecke`, `bausteinBestand` (Task 7)
- Produces: `fuehreBausteinlaufAus(): Promise<Ergebnis>`, `planeBausteinlauf(): void`

- [ ] **Step 1: Write the failing test**

An `app/test/schreibansicht-ruhe.test.mjs` anhängen (die Datei prüft Quelltext-Zusagen und braucht keinen Browser):

```js
test('der Bausteinlauf hat eine eigene Sperre und einen eigenen Zeitgeber', () => {
  const workspace = readFileSync(new URL('../src/workspace.js', import.meta.url), 'utf8')
  assert.match(workspace, /let bausteinlaufAktiv = false/, 'keine eigene Sperre für den Bausteinlauf')
  assert.match(workspace, /let bausteinlaufTimer = null/, 'kein eigener Zeitgeber für den Bausteinlauf')
  assert.match(workspace, /function fuehreBausteinlaufAus\(/, 'der Lauf wird nirgends ausgeführt')
  assert.match(workspace, /function planeBausteinlauf\(/, 'der Lauf wird nirgends geplant')
  assert.match(workspace, /planeBausteinlauf\(\)/, 'planeBausteinlauf hat keinen Aufrufer')
})
```

(Ist `readFileSync` in dieser Datei noch nicht importiert, oben ergänzen: `import { readFileSync } from 'node:fs'`.)

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && node --test test/schreibansicht-ruhe.test.mjs
```

Erwartet: FAIL — „keine eigene Sperre für den Bausteinlauf".

- [ ] **Step 3: Write minimal implementation**

In `app/src/workspace.js` bei den übrigen Lauf-Sperren (Zeile 156–159) ergänzen:

```js
// Dritter Kanal (Bausteinarten): eigene Sperre und eigener Zeitgeber. Er laeuft in einem
// anderen Takt als der Hinweislauf -- Hinweise gehoeren zu jeder Schreibpause, die Art
// eines Absatzes aendert sich viel seltener (Spec: "Eigener Lauf, nicht im Hinweislauf").
let bausteinlaufAktiv = false
let bausteinlaufTimer = null
```

Nach `fuehreHinweislaufAus` einfügen:

```js
async function fuehreBausteinlaufAus() {
  const doc = ctx?.activeDoc()
  const workspace = activeWorkspace()
  if (!doc || !workspace) return { gestartet: false, grund: 'kein-dokument' }

  // Ein Dokument aus der Sechser-Zeit verliert seine Rollen nicht: Sie werden einmalig
  // zum Anfangsbestand, bevor der erste Lauf sie ersetzt. Danach ist die Ablage die
  // einzige Quelle -- collectBlockSnapshots liest das alte Merkmal nicht mehr.
  if (!workspace.bausteinarten) {
    // Das ROHE Dokument, nicht aktuelleBloecke(): Die Bloecke tragen das alte Merkmal
    // seit Task 7 nicht mehr (siehe bestandAusAltenRollen).
    const altbestand = bestandAusAltenRollen(ctx.editor.getJSON(), Date.now())
    if (altbestand) {
      workspace.bausteinarten = altbestand
      ctx.scheduleSave()
    }
  }

  const blocks = aktuelleBloecke()
  const docText = baueDocText(blocks)
  const docId = doc.id
  const project = dokumentProjekt(doc)

  const ergebnis = await versucheBausteinlauf({
    hatDokument: true,
    istBeispielprojekt: istBeispielDokument(doc),
    laeuftBereits: bausteinlaufAktiv,
    blocks,
    bestand: bausteinBestand(workspace),
    docText,
    verstaendnis: project ? ensureProjectUnderstanding(project) : null,
    sperreSetzen: wert => { bausteinlaufAktiv = wert },
    hatSchluessel,
    istNochDasselbeDokument: () => ctx.activeDoc()?.id === docId,
    beansprucheKostenfreigabe: () => beansprucheAutomatikKosten('bausteine', { docId }),
    runTask,
    setzeAgentStatus,
  })

  if (!ergebnis.gestartet || !ergebnis.erfolg) return ergebnis

  workspace.bausteinarten = ergebnis.bestand
  ctx.scheduleSave()
  refreshWorkspace()
  return ergebnis
}

// Derselbe Pausen-Ausloeser wie beim Hinweislauf (AGENT_IDLE_MS), aber mit eigenem
// Zeitgeber und eigener Bedarfspruefung: Die meisten Pausen fuehren hier zu nichts,
// weil sich am Absatzbestand nichts geaendert hat.
function planeBausteinlauf() {
  clearTimeout(bausteinlaufTimer)
  bausteinlaufTimer = null
  const doc = ctx?.activeDoc()
  const workspace = activeWorkspace()
  if (!doc || !workspace || bausteinlaufAktiv) return
  if (istBeispielDokument(doc)) return
  const inputState = initiativeInputState(doc.id)
  if (!inputState || !Number.isFinite(inputState.lastInputAt)) return
  if (!editorViewIsVisibleFor(doc.id) || isComposing) return
  if (!pruefeBausteinBedarf({ blocks: aktuelleBloecke(), bestand: bausteinBestand(workspace) }).noetig) return

  const scheduledGeneration = inputState.generation
  bausteinlaufTimer = setTimeout(() => {
    bausteinlaufTimer = null
    const currentInputState = initiativeInputState(doc.id)
    if (!currentInputState || currentInputState.generation !== scheduledGeneration) return
    if (!editorViewIsVisibleFor(doc.id) || isComposing) return
    fuehreBausteinlaufAus()
  }, Math.max(24, AGENT_IDLE_MS - (Date.now() - inputState.lastInputAt)))
}
```

In `scheduleAgentInitiative` (Zeile 4275) direkt nach `planeHinweislauf()` ergänzen:

```js
  planeBausteinlauf()
```

Keine neuen Importe nötig: `bestandAusAltenRollen`, `pruefeBausteinBedarf` und
`versucheBausteinlauf` kamen bereits mit Task 7 in die Importliste.

**Zusammenspiel von Übernahme und Bedarf — bitte nicht wegoptimieren.** Beim ersten Mal
sieht `planeBausteinlauf` noch keine Ablage, hält einen Lauf für nötig und plant ihn.
`fuehreBausteinlaufAus` hebt dann zuerst die alten Rollen in die Ablage und prüft den
Bedarf **danach** erneut (in `versucheBausteinlauf`). Trug das Dokument durchgängig alte
Rollen, ist der Bedarf damit gedeckt und es entsteht **keine** Anfrage — die Übernahme
kostet nichts. Nur Absätze, die auch früher keine Rolle hatten, führen zu einem echten
Lauf.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && npm run test:unit && npm run build
```

Erwartet: PASS und ein erfolgreicher Build (der Build fängt Tippfehler in Importen).

- [ ] **Step 5: Commit**

```bash
git add app/src/workspace.js app/test/schreibansicht-ruhe.test.mjs && git commit -m "feat(bausteine): der dritte Kanal läuft — eigener Takt, eigene Sperre"
```

---

### Task 9: Der Anzeigename in der Struktur-Spalte

**Files:**
- Modify: `app/src/workspace.js:665-693` (`updateNavBlockNode`), `:709-730` (`renderStructureNav`), `:121-124` (`ROLE_LABELS`)

**Interfaces:**
- Consumes: `bausteinNamen` (Task 2), `bausteinBestand` (Task 7)
- Produces: keine neuen Ausfuhren.

- [ ] **Step 1: Write the failing test**

An `app/test/schreibansicht-ruhe.test.mjs` anhängen:

```js
test('die Struktur-Karte traegt den erkannten Namen, nicht mehr "Freier Absatz"', () => {
  const workspace = readFileSync(new URL('../src/workspace.js', import.meta.url), 'utf8')
  assert.doesNotMatch(workspace, /\|\| 'Freier Absatz'/, 'die Karte fällt noch auf "Freier Absatz" zurück')
  assert.match(workspace, /bausteinNamen\(/, 'die Karte liest die erkannten Namen nicht')
  assert.match(workspace, /'Überschrift'/, 'die Überschrift hat ihr Wort verloren')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && node --test test/schreibansicht-ruhe.test.mjs
```

Erwartet: FAIL — „die Karte fällt noch auf 'Freier Absatz' zurück".

- [ ] **Step 3: Write minimal implementation**

`ROLE_LABELS` (Zeile 121–124) ersetzen durch:

```js
// Die Ueberschrift behaelt ihr Wort. Es ist keine Vermutung der KI, sondern folgt aus dem
// Knotentyp (workspace-model.mjs:147) -- deshalb steht es hier und nicht in der Ablage.
const UEBERSCHRIFT_LABEL = 'Überschrift'
```

In `renderStructureNav` (Zeile 725) neben `hints`:

```js
  const namen = bausteinNamen(bausteinBestand(workspace))
```

und die Schleife darunter:

```js
  blocks.forEach(block => {
    const nodes = structureNavState.blockNodes.get(block.id)
    if (nodes) {
      updateNavBlockNode(nodes, block, workspace.activeBlockId, hints.get(block.id) || null, namen.get(block.id) || null)
    }
  })
```

In `updateNavBlockNode` die Signatur und die ersten Zeilen ersetzen:

```js
function updateNavBlockNode(nodes, block, activeBlockId, hintKind, bausteinName) {
  // Ein Absatz, den die KI noch nicht gelesen hat, traegt KEINEN Namen -- keine Platte,
  // keine Sanduhr, kein "Freier Absatz". Ein Etikett, das nichts aussagt, ist schlechter
  // als keines: Es sieht aus wie eine Angabe und ist keine.
  const roleLabel = block.role === 'heading' ? UEBERSCHRIFT_LABEL : (bausteinName || '')
```

und weiter unten, wo `nodes.role.textContent` gesetzt wird:

```js
  nodes.role.textContent = roleLabel
  nodes.role.hidden = !roleLabel
```

sowie das `aria-label` so, dass ohne Namen kein leerer Doppelpunkt entsteht:

```js
  nodes.preview.setAttribute('aria-label', roleLabel ? `${roleLabel}: ${excerpt}${hintLabel}` : `${excerpt}${hintLabel}`)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && npm run test:unit && npm run build
```

Erwartet: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/workspace.js app/test/schreibansicht-ruhe.test.mjs && git commit -m "feat(bausteine): die Struktur-Spalte sagt, was ein Absatz tut — oder schweigt"
```

---

### Task 10: Das Beispielprojekt bekommt seinen Bestand

Der Pausen-Auslöser schließt das Beispielprojekt aus — eine Vorführung soll nichts kosten. Ohne mitgelieferten Bestand bliebe die Struktur-Spalte dort für immer namenlos.

**Files:**
- Modify: `app/src/example.js` (neue Ausfuhr `buildExampleBausteinarten`)
- Modify: `app/src/editor.js:259`

**Interfaces:**
- Produces: `buildExampleBausteinarten(): Bestand`

Die Absatz-Kennungen stammen aus `buildExampleBody()` (`app/src/example.js:439`).

- [ ] **Step 1: Write the failing test**

`app/test/beispiel-bausteinarten.test.mjs` (neue Datei):

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildExampleBausteinarten, buildExampleBody } from '../src/example.js'
import { bausteinNamen, bausteinRollen, normalisiereBausteinarten } from '../src/bausteinlauf-model.mjs'

test('der mitgelieferte Bestand ist eine gueltige Ablage', () => {
  const bestand = normalisiereBausteinarten(buildExampleBausteinarten())
  assert.ok(bestand, 'der Beispielbestand überlebt die Normalisierung nicht')
  assert.equal(bestand.textsorte, 'Essay')
})

test('jede Zuordnung zeigt auf einen Absatz, den es im Beispieltext gibt', () => {
  const body = buildExampleBody()
  const bestand = normalisiereBausteinarten(buildExampleBausteinarten())
  Object.keys(bestand.zuordnung).forEach(blockId => {
    assert.ok(body.includes(`data-block-id="${blockId}"`), `unbekannter Absatz im Beispielbestand: ${blockId}`)
  })
})

test('keine Ueberschrift bekommt eine Art', () => {
  const bestand = normalisiereBausteinarten(buildExampleBausteinarten())
  Object.keys(bestand.zuordnung).forEach(blockId => {
    assert.doesNotMatch(blockId, /-h$/, `eine Überschrift hat eine Art bekommen: ${blockId}`)
  })
})

test('genau eine Art traegt claim — sonst bleibt die Argument-Karte leer', () => {
  const bestand = normalisiereBausteinarten(buildExampleBausteinarten())
  assert.equal(bestand.arten.filter(art => art.funktion === 'claim').length, 1)
  assert.equal([...bausteinRollen(bestand).values()].filter(rolle => rolle === 'claim').length >= 1, true)
})

test('der Beispieltext hat sichtbare Namen', () => {
  const namen = [...new Set(bausteinNamen(buildExampleBausteinarten()).values())]
  assert.ok(namen.length >= 4, `zu wenige verschiedene Namen: ${JSON.stringify(namen)}`)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && node --test test/beispiel-bausteinarten.test.mjs
```

Erwartet: FAIL — `buildExampleBausteinarten is not a function`.

- [ ] **Step 3: Write minimal implementation**

An `app/src/example.js` anhängen:

```js
// Das Beispielprojekt bleibt vom Pausen-Ausloeser ausgeschlossen (hinweislauf-model.mjs:128):
// Eine Vorfuehrung soll nichts kosten und ohne Schluessel funktionieren. Damit die
// Struktur-Spalte dort trotzdem etwas zeigt, kommt der Bestand mitgeliefert -- so wie die
// vorgefertigten Anmerkungen auch. Die Kennungen stammen aus buildExampleBody().
export function buildExampleBausteinarten() {
  return {
    textsorte: 'Essay',
    arten: [
      { id: 'art-bsp-these', name: 'These', beschreibung: 'Die tragende Behauptung des Textes.', funktion: 'claim' },
      { id: 'art-bsp-begruendung', name: 'Begründung', beschreibung: 'Trägt einen Grund für die These nach.', funktion: 'evidence' },
      { id: 'art-bsp-herkunft', name: 'Herkunft', beschreibung: 'Woher der Gedanke stammt und von wem.', funktion: 'evidence' },
      { id: 'art-bsp-bild', name: 'Bild', beschreibung: 'Macht den Gedanken an einem konkreten Fall greifbar.', funktion: null },
      { id: 'art-bsp-massstab', name: 'Maßstab', beschreibung: 'Benennt, woran sich die Behauptung messen lässt.', funktion: null },
      { id: 'art-bsp-einwand', name: 'Einwand', beschreibung: 'Spricht gegen die eigene These.', funktion: 'counterpoint' },
      { id: 'art-bsp-schluss', name: 'Schluss', beschreibung: 'Führt die Fäden zusammen.', funktion: 'transition' },
      { id: 'art-bsp-notiz', name: 'Notiz', beschreibung: 'Material für den nächsten Durchgang, noch nicht Text.', funktion: null },
    ],
    zuordnung: {
      'b-calm-auftakt': { artId: 'art-bsp-these', zeichen: 236 },
      'b-calm-warum-1': { artId: 'art-bsp-begruendung', zeichen: 296 },
      'b-calm-warum-2': { artId: 'art-bsp-begruendung', zeichen: 297 },
      'b-calm-warum-3': { artId: 'art-bsp-begruendung', zeichen: 303 },
      'b-calm-geschichte-1': { artId: 'art-bsp-herkunft', zeichen: 209 },
      'b-calm-geschichte-2': { artId: 'art-bsp-herkunft', zeichen: 175 },
      'b-calm-beispiele': { artId: 'art-bsp-bild', zeichen: 178 },
      'b-calm-massstab': { artId: 'art-bsp-massstab', zeichen: 197 },
      'b-calm-schreiben-1': { artId: 'art-bsp-begruendung', zeichen: 314 },
      'b-calm-schreiben-2': { artId: 'art-bsp-bild', zeichen: 174 },
      'b-calm-schreiben-3': { artId: 'art-bsp-begruendung', zeichen: 201 },
      'b-calm-haltung': { artId: 'art-bsp-these', zeichen: 253 },
      'b-calm-einwand': { artId: 'art-bsp-einwand', zeichen: 157 },
      'b-calm-schluss': { artId: 'art-bsp-schluss', zeichen: 118 },
      'b-calm-notiz-1': { artId: 'art-bsp-notiz', zeichen: 76 },
      'b-calm-notiz-2': { artId: 'art-bsp-notiz', zeichen: 62 },
      'b-calm-notiz-3': { artId: 'art-bsp-notiz', zeichen: 84 },
      'b-calm-notiz-4': { artId: 'art-bsp-notiz', zeichen: 72 },
      'b-calm-notiz-5': { artId: 'art-bsp-notiz', zeichen: 97 },
      'b-calm-notiz-6': { artId: 'art-bsp-notiz', zeichen: 62 },
    },
    laufSignatur: '',
    standAt: 0,
  }
}
```

> Die `zeichen`-Werte sind Näherungen. Sie dürfen ungenau sein: Im Beispielprojekt läuft
> ohnehin nie ein Lauf, und die Zahl entscheidet nur, ob ein Absatz als umgeschrieben
> gilt. Wer sie genau haben will, misst sie einmal:
>
> ```bash
> cd app && node -e "import('./src/example.js').then(({ buildExampleBody }) => { for (const [, id, text] of buildExampleBody().matchAll(/data-block-id=\"([^\"]+)\">([^<]*)</g)) console.log(id, text.trim().length) })"
> ```

In `app/src/editor.js:259`:

```js
    workspace: { agent: { messages: buildExampleAgentMessages() }, bausteinarten: buildExampleBausteinarten() },
```

und den Import in `app/src/editor.js:18` um `buildExampleBausteinarten` ergänzen.

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && node --test test/beispiel-bausteinarten.test.mjs && npm run build
```

Erwartet: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/example.js app/src/editor.js app/test/beispiel-bausteinarten.test.mjs && git commit -m "feat(bausteine): das Beispielprojekt zeigt seine Bausteinarten ohne Schlüssel"
```

---

### Task 11: Das Menü fällt weg

Erst jetzt — vorher wäre die Oberfläche zwischenzeitlich ohne jede Bausteinart gewesen.

**Files:**
- Modify: `app/src/workspace.js` — `BLOCK_TYPES` (112), `insertBlock` (530), `openInsertMenu` (542), `placeInsertMenu`, `closeInsertMenu`, `insertMenu`, Testzugang `oeffneEinfuegeMenue` (4719), Kommentarblock (1995–2007)
- Modify: `app/src/style.css` — `:852`, `:1829`, `:1842`, `:1854-1855`, `:2295`, `:2339`, Kommentar `:2474`
- Modify: `app/test/schreibansicht-ruhe.test.mjs:78-79`

- [ ] **Step 1: Write the failing test**

`app/test/schreibansicht-ruhe.test.mjs:78-79` ersetzen:

```js
  // UMGEDREHT (07.08.2026): Diese Prüfung verlangte, dass openInsertMenu und insertBlock
  // im Quelltext STEHEN BLEIBEN -- sie sollten ihren Platz in der Struktur-Ansicht
  // bekommen. Diesen Platz gibt es nicht mehr: Die Bausteinart erkennt seit heute die KI
  // (docs/superpowers/specs/2026-08-07-bausteinarten-ki-erkennung-design.md). Ein Menü,
  // aus dem man eine Rolle wählt, widerspricht dem. Es ist fort, und das bleibt geprüft.
  assert.doesNotMatch(workspace, /function openInsertMenu\(/, 'das Einfüge-Menü lebt wieder')
  assert.doesNotMatch(workspace, /function insertBlock\(/, 'das Einfügen von Hand lebt wieder')
  assert.doesNotMatch(workspace, /const BLOCK_TYPES/, 'die feste Sechser-Liste lebt wieder')
  assert.doesNotMatch(workspace, /semantic-insert/, 'das Menü hat noch Reste in der Schreibansicht')
```

Und in derselben Datei ergänzen:

```js
test('die Formatvorlage kennt das Einfüge-Menü nicht mehr', () => {
  const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')
  assert.doesNotMatch(css, /\.semantic-insert-menu/, 'die Menü-Gestaltung steht noch in der Formatvorlage')
  assert.doesNotMatch(css, /\.semantic-insert-choice/, 'die Eintrags-Gestaltung steht noch in der Formatvorlage')
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && node --test test/schreibansicht-ruhe.test.mjs
```

Erwartet: FAIL — „das Einfüge-Menü lebt wieder" und „die Menü-Gestaltung steht noch in der Formatvorlage".

- [ ] **Step 3: Write minimal implementation**

Aus `app/src/workspace.js` entfernen: `BLOCK_TYPES`, `let insertMenu = null`, `placeInsertMenu`, `closeInsertMenu`, `insertBlock`, `openInsertMenu`, den Testzugang `oeffneEinfuegeMenue` (4719–4724) und jeden verbliebenen Aufruf von `closeInsertMenu(...)`. Zu finden mit:

```bash
grep -n "insertMenu\|closeInsertMenu\|insertBlock\|BLOCK_TYPES\|semantic-insert" app/src/workspace.js
```

Den Kommentarblock 1995–2007 ersetzen durch:

```js
// Hier schwebte ein Plus am linken Rand des Absatzes, in dem gerade geschrieben wurde.
// Es oeffnete das Menue "Art des Textbausteins". Jakob am 7. August 2026: "das plus
// ergibt zudem ueberhaupt keinen sinn fuer mich."
//
// Das Menue dahinter sollte seinen Platz in der Struktur-Ansicht bekommen. Diesen Platz
// gibt es nicht mehr, und zwar aus einem besseren Grund als Vergesslichkeit: Die
// Bausteinart erkennt seit dem 7. August 2026 die KI, und sie waehlt dafuer pro Text
// eigene Namen statt sechs fester Kategorien. Ein Menue, aus dem man eine Rolle von Hand
// waehlt, widerspricht dem. Was ein Absatz tut, ist keine Bedienfrage.
// Siehe docs/superpowers/specs/2026-08-07-bausteinarten-ki-erkennung-design.md.
```

Aus `app/src/style.css` die Regelblöcke zu `.semantic-insert-menu` und `.semantic-insert-choice` entfernen (Zeilen 852, 1829, 1842, 1854–1855, 2295, 2339) sowie den Verweis im Kommentar bei 2474 auf den neuen Stand bringen. Zu finden mit:

```bash
grep -n "semantic-insert" app/src/style.css
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && npm run test:unit && npm run build
```

Erwartet: PASS und erfolgreicher Build.

- [ ] **Step 5: Commit**

```bash
git add app/src/workspace.js app/src/style.css app/test/schreibansicht-ruhe.test.mjs && git commit -m "refactor(bausteine): das Menü fällt weg — die Rolle wählt niemand mehr von Hand"
```

---

### Task 12: Die Browser-Prüfungen umbauen

`app/test/v2-smoke.mjs` prüft das Menü an sechs Stellen über den Testzugang, den Task 11 entfernt hat. Der Lauf ist jetzt rot. Diese Aufgabe macht ihn grün — **ohne** Zusagen stillschweigend fallenzulassen.

**Files:**
- Modify: `app/test/v2-smoke.mjs` — Hilfsfunktion `oeffneEinfuegeMenue` (103–117), `runDesktop`-Abschnitte (268–331, 782–793, 826–885), Tastgerät (1561–1579)

- [ ] **Step 1: Run the smoke test to see exactly what breaks**

Eigenen Server starten (Port 4173 kann einer fremden Sitzung gehören):

```bash
cd app && python3 -m http.server 4319 >/dev/null 2>&1 & sleep 1 && AIWT_URL=http://localhost:4319 node test/v2-smoke.mjs
```

Erwartet: FAIL. Die Fehlermeldung nennt die erste Stelle, an der `window.AIWT.__workspaceTestBridge.oeffneEinfuegeMenue` nicht mehr existiert. Alle betroffenen Stellen notieren.

- [ ] **Step 2: Die verwaisten Zusagen retten**

Drei Zusagen hingen am Menü, gehören ihm aber nicht. Für jede prüfen, ob sie anderswo noch geprüft wird:

```bash
cd app && grep -n "agentWidget').isHidden\|evidenceWindow').isHidden\|dispatchEvent(new Event('resize'))\|local-suggestion').count" test/v2-smoke.mjs
```

- **Nur eine große Fläche steht offen** (826–857): Auf eine andere schwebende Fläche umziehen — das Belegfenster gegen den Agenten. Ersatz im selben Abschnitt:

```js
  // GERETTET aus den Menü-Abschnitten: Nur EINE große Fläche steht offen. Vorher wurde
  // das am Einfügemenü gegen Agent und Belegfenster geprüft; das Menü gibt es nicht mehr
  // (Bausteinarten erkennt die KI). Dieselbe Zusage, an den beiden Flächen geprüft, die
  // es noch gibt.
  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.workspace.evidenceFindingId = 'task-4-evidence'
    window.AIWT.state.editor.commands.insertContent(' ')
  })
  await expectVisible(page.locator('#evidenceWindow'))
  await page.locator('#ondaAura').click()
  assert.equal(await page.locator('#evidenceWindow').isHidden(), true)
  assert.equal(await page.locator('#agentWidget').isVisible(), true)
  await page.locator('#ondaAura').click()
```

- **Scrollen und Größenänderung schließen eine schwebende Fläche** (874–885): Am Belegfenster prüfen, sonst als entfernt vermerken. Erst nachsehen, ob eine andere Datei das schon abdeckt:

```bash
cd app && grep -rn "new Event('resize')" test/ | grep -v v2-smoke
```

- **Eine geöffnete Fläche räumt den Vorschlag beiseite** (1576–1579, Tastgerät): Am Agenten prüfen statt am Menü:

```js
  // GERETTET: Eine geöffnete große Fläche räumt den Vorschlag beiseite. Vorher am
  // Einfügemenü geprüft, das es nicht mehr gibt -- die Zusage hing nie am Menü.
  await page.locator('#ondaAura').tap()
  assert.equal(await page.locator('.local-suggestion').count(), 0)
  await page.keyboard.press('Escape')
```

Was ersatzlos entfällt, bekommt an Ort und Stelle eine `ENTFERNT:`-Notiz mit Grund — nach dem Muster von Zeile 268.

- [ ] **Step 3: Den Einfüge-Abschnitt durch den Erkennungs-Nachweis ersetzen**

Die Hilfsfunktion `oeffneEinfuegeMenue` (103–117) löschen. Den Abschnitt 268–331 in `runDesktop` ersetzen durch:

```js
  // WIE BAUSTEINARTEN JETZT ENTSTEHEN (07.08.2026): Niemand wählt sie mehr aus einem
  // Menü. Die KI erkennt sie und legt sie neben dem Text ab; die Struktur-Spalte zeigt
  // die erkannten Namen. Das Beispielprojekt bringt seinen Bestand mit, damit die Spalte
  // ohne Schlüssel und ohne Anfrage etwas zu zeigen hat (example.js).
  // Spec: docs/superpowers/specs/2026-08-07-bausteinarten-ki-erkennung-design.md
  const rollenZeilen = await page.locator('#structureNav .block-preview-role')
    .evaluateAll(nodes => nodes.map(node => node.textContent.trim()).filter(Boolean))
  assert.ok(rollenZeilen.length >= 4, `zu wenige benannte Bausteine: ${JSON.stringify(rollenZeilen)}`)
  assert.ok(
    new Set(rollenZeilen).size >= 4,
    `die Namen wiederholen nur eine Art: ${JSON.stringify(rollenZeilen)}`,
  )
  assert.equal(
    rollenZeilen.includes('Freier Absatz'),
    false,
    'die alte Sechser-Beschriftung steht noch in der Spalte',
  )
  assert.ok(rollenZeilen.includes('Überschrift'), 'die Überschrift hat ihr Wort verloren')

  // Die Namen überstehen ein Neuladen: Sie liegen neben dem Text, nicht im Text.
  await page.evaluate(() => window.AIWT.flushSave())
  await page.reload({ waitUntil: 'networkidle' })
  await openExample(page, false)
  await expectVisible(page.locator('#structureNav'))
  const nachNeuladen = await page.locator('#structureNav .block-preview-role')
    .evaluateAll(nodes => nodes.map(node => node.textContent.trim()).filter(Boolean))
  assert.deepEqual(nachNeuladen, rollenZeilen)

  // Und sie stehen NICHT im Dokument: Ein Export trägt keine Vermutung der KI.
  const imText = await page.locator('#editor .ProseMirror [data-semantic-role]').count()
  assert.equal(imText, 0, 'die erkannte Art hängt am Absatz statt neben dem Text')
```

Den Abschnitt 782–793 (Einfügen hinter dem aktiven Baustein) ersatzlos entfernen und durch eine `ENTFERNT:`-Notiz ersetzen:

```js
  // ENTFERNT (07.08.2026): dass das Menü hinter dem AKTIVEN Baustein einfügt. Das Menü
  // gibt es nicht mehr -- die Bausteinart erkennt die KI, niemand fügt mehr über eine
  // Rollenwahl ein. Was bleibt, prüft der Abschnitt "WIE BAUSTEINARTEN JETZT ENTSTEHEN".
```

- [ ] **Step 4: Run the smoke test to verify it passes**

```bash
cd app && AIWT_URL=http://localhost:4319 node test/v2-smoke.mjs
```

Erwartet: PASS. Danach der volle Lauf:

```bash
cd app && npm test
```

- [ ] **Step 5: Commit**

```bash
git add app/test/v2-smoke.mjs && git commit -m "test(bausteine): der Einfüge-Weg ist raus, die Erkennung ist drin — verwaiste Zusagen gerettet"
```

---

## Abschluss

- [ ] **Frischer Gesamtlauf**

```bash
cd app && npm test && npm run build
```

- [ ] **Fertigzustand neu messen** (die Anzahl zeigt der Lauf selbst, nicht dieser Plan)

```bash
node evals/run-fertigzustand.mjs
```

- [ ] **Den Stand gegen die Spezifikation prüfen.** Jeden Abschnitt der Spezifikation durchgehen und die Stelle im Code benennen, die ihn einlöst. Was offen bleibt, wird gesagt — nicht stillschweigend gelassen.

- [ ] **Die verwaisten Zusagen berichten.** Ausdrücklich auflisten, welche der drei Zusagen aus Task 12 umgezogen sind und welche ersatzlos entfielen. Das ist die Angabe, die Jakob ausdrücklich verlangt hat.
