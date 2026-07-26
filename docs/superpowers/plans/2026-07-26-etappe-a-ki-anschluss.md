# Etappe A — Echter KI-Anschluss: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der Agent wird echt — Anthropic-Anschluss (Opus 5 stark / Haiku 4.5 Routine) über eine Swift-Keychain-Brücke in der Mac-App plus Browser-Direktweg, mit echtem Projektverständnis-Interview, echten verankerten Hinweis-Läufen und echtem Streaming-Chat in den bereits gebauten Onda-Oberflächen.

**Architecture:** Zentrale Verteiler-Schicht aus vier neuen Modulen (`agent-tasks.mjs` Tabelle+Wire-Format, `agent-prompts.mjs` deutsche Prompts, `anchor-verify.mjs` Zitat-Prüfung, `agent-transport.mjs`/`agent-gateway.mjs` Transporte+Orchestrierung). Jede KI-Fähigkeit läuft durch `runTask(taskName, …)` mit fester Task→Modell-Tabelle (Router-fähig ab Tag 1). Die Mac-Hülle (`mac/main.swift`) erhält Handler `llm`/`llmkey` (URLSession-Streaming, Schlüssel in der macOS-Keychain); im Browser läuft derselbe Verteiler über den offiziellen Direktweg. Bestehende Interaktionsmechanik (Findings, Risiko-Fluss, Panels, Persistenz) bleibt unverändert und wird nur mit echten Daten gefüttert.

**Tech Stack:** Vanilla JS + Tiptap (esbuild), Swift/AppKit (WKWebView), Anthropic Messages API (raw Wire-Format — begründete Abweichung vom SDK-Default: Anfragen müssen als plain JSON über die JS→Swift-Brücke wandern, daher EIN transport-agnostischer Request-Builder statt zweier Pfade), `node --test`, Playwright-Smoke (separat).

## Global Constraints

*Gelten implizit für jede Aufgabe. Werte sind exakt.*

- **Modelle (exakte IDs):** stark = `claude-opus-5`, Routine = `claude-haiku-4-5`. Kein `thinking`-Parameter (Opus 5 denkt standardmäßig adaptiv). KEINE `temperature`/`top_p`/`top_k` (400-Fehler auf Opus 5). Kein Assistant-Prefill. `stop_reason` VOR `content` prüfen (`refusal` → Fehlertyp `abgelehnt`, still; `max_tokens` → Lauf verwerfen).
- **Wire-Format:** `POST https://api.anthropic.com/v1/messages`; Headers `content-type: application/json`, `x-api-key`, `anthropic-version: 2023-06-01`; nur Browser-Direktweg zusätzlich `anthropic-dangerous-direct-browser-access: true`. Brücken-Anfragen tragen KEINEN Schlüssel — Swift setzt ihn aus der Keychain ein.
- **Strukturierte Ausgaben** (`verstaendnis`, `hinweise`): `output_config:{format:{type:'json_schema', schema:{…, additionalProperties:false, required:[…]}}}`; Antwort-JSON steht im ersten Text-Block. Streaming (`stream:true`) nur für `chat`.
- **Cache-Präfix-Ordnung (stabil, keine Zeitstempel/IDs davor):** `system=[SYSTEM_COACH mit cache_control]` → user-Block `<projektverstaendnis>` (cache_control) → user-Block `<dokument>` (cache_control) → Volatiles ohne Marker. Max. 3 Breakpoints. Beweis: `usage.cache_read_input_tokens > 0` bei Folge-Läufen.
- **Hinweis-Schema:** `{hinweise:[{kategorie: 'fakt'|'quelle'|'methode'|'logik'|'struktur'|'wirkung'|'erklaerung'|'sprache', anker, beobachtung, relevanz, folge, vorschlag:{bisher,neu}|null, istGrundursache:bool, integritaet:bool}]}`. Integritätsarten = fakt/quelle/methode/logik. Anker = wörtliches Minimal-Zitat; Client-Verifikation exakt → normalisiert → **verwerfen** (nie raten).
- **Verständnis-Schema:** Feldnamen exakt wie `ensureProjectUnderstanding` (`task`, `audience`, `desiredEffect`, `evidenceStandard`, `protectedIntentions[]`, `openQuestions[]`) + `antwortText`.
- **Brücken-Protokoll:** JS→Swift Handler `llm` `{id, url, headers, body, stream}` / `llmkey` `{id, aktion:'setzen'|'status'|'loeschen', schluessel?}`; Swift→JS `window.AIWT.llmRueckruf({id, typ:'delta'|'fertig'|'fehler'|'schluesselstatus', …})`. Keychain: `kSecClassGenericPassword`, Service `Schreibwerkzeug`, Account `anthropic-api-key`; der Schlüssel wird nie an JS zurückgegeben.
- **Fehler-Vokabular (Gateway):** `kein-schluessel` | `offline` | `ratenlimit` | `ueberlastet` | `schema` | `abgelehnt` | `abgebrochen`. EIN stiller Wiederholungsversuch (~2 s) bei `offline`/`ratenlimit`/`ueberlastet`.
- **Settings (additiv, tolerant, KEIN Schema-Bump):** `settings.usage = {monat:'JJJJ-MM', inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, kostenCents}` (Monatswechsel-Reset). Browser-Dev-Schlüssel in `localStorage 'aiwt.apikey'` (getrennt von `aiwt.v2`, taucht in keinem Export auf); Mac: Schlüssel NUR Keychain. Preis-Konstanten (Momentaufnahme 07/2026): Opus 5 $5/$25 pro MTok, Haiku $1/$5, Cache-Read 0,1×, Cache-Write 1,25× — an EINER Stelle mit „regelmäßig prüfen"-Kommentar.
- **Demo-Regel:** Beispielprojekt (`EXAMPLE_PROJECT_ID` `p-example`): KEINE automatischen Hinweis-Läufe, KEIN Interview — der Seed bleibt unverändert Demo. Chat ist überall echt. Echte Projekte bekommen NIE Demo-Quellen; Belegfenster echter Findings zeigt „Quellensuche kommt in Etappe B".
- **Offline-Würde:** Ohne Schlüssel/Netz ruhige Statuszeile („Agent ist offline — dein Text ist davon unberührt"), nie Modals, nie Fokusraub; Schreiben/Speichern/Export uneingeschränkt.
- **UI-Sprache:** Deutsch, Sentence case, Onda-Ton (du-Form, keine Ausrufezeichen, keine Emoji).
- **Tests:** `npm test` (node-Suiten) durchgehend grün; Transporte in Tests auf `sende()`-Ebene gemockt (der Mock ersetzt nur das Netz, nie Produktlogik). Playwright-Smoke wird einmalig im Abschluss-Bereich F erweitert (Playwright dort erst installieren). Keine echten API-Aufrufe in Tests.
- **Commits:** ein Commit pro Aufgabe, deutsche Messages.

## Bau-Reihenfolge & Abhängigkeiten

Phasen von oben nach unten abarbeiten (Task-IDs behalten ihren Bereichsbuchstaben):

1. **Bereich G — Purer Kern** (`G-1…`): Prompts, Task-Tabelle + Wire-Format + Preise, Anker-Prüfung, `settings.usage`. Keine Abhängigkeiten.
2. **Bereich T — Transporte + Gateway** (`T-1…`): SSE-Parser, Direkt-/Brücken-Transport, `runTask`-Orchestrierung, Boot-Verkabelung. Konsumiert G.
3. **Bereich S — Swift-Brücke** (`S-1…`): Keychain + `llmkey`, `llm`-Streaming, Mac-App-Neubau. Konsumiert das T-Protokoll.
4. **Bereich U — Einstellungen + Offline** (`U-1…`): Schlüssel-UI + Anleitung + Ausgabenlimit-Pflichtschritt, Verbrauchsanzeige, Statuszeile, Aura-Zustand. Konsumiert T.
5. **Bereich V — Verständnis-Interview** (`V-1…`): Eröffnung, Composer-Routing, Live-Merge mit bindenden Korrekturen. Konsumiert T/G.
6. **Bereich H — Hinweis-Läufe** (`H-1…`): hinweisZuFinding-Mapping, Lauf-Pipeline mit Anker-Verifikation, Auslöser-Verkabelung, Belegfenster-Guard. Konsumiert G/T.
7. **Bereich C — Chat + Entscheidungsverlauf** (`C-1…`): Streaming-Chat (ersetzt beide Canned-Antworten), Verlaufs-Verdichtung, Entscheidungsverlauf-Anzeige, echte Initiative. Konsumiert T/V/H.
8. **Bereich F — Abschluss** (`F-1…`): Transport-Mock im Smoke, Gesamtlauf, Abnahme-Checkliste (10 Kriterien aus Spec §9; Live-Teil mit echtem Schlüssel gemeinsam mit dem Nutzer), CONTEXT.md-Update.

---

## Bereich G — Purer Kern (Prompts, Tabelle, Anker-Prüfung, Verbrauch)

### Task G-1: Deutsche Prompt-Konstanten (agent-prompts.mjs)

**Files:**
- Create: `app/src/agent-prompts.mjs`
- Test: `app/test/agent-prompts.test.mjs`

**Interfaces:**
- Consumes: — (keine Abhängigkeiten; V2-Spec-Sprache der 8 Hinweisarten aus `docs/superpowers/specs/2026-07-19-agentisches-schreibsystem-v2.md` §7)
- Produces: `SYSTEM_COACH: string`, `INTERVIEW_REGELN: string`, `HINWEIS_ANWEISUNG: string` (exportierte Konstanten; `SYSTEM_COACH` wird von Task G-2 `baueAnfrage` als System-Block konsumiert; `INTERVIEW_REGELN`/`HINWEIS_ANWEISUNG` gibt der Verteiler (agent-gateway, Bereich V) als volatile Blöcke mit)

- [ ] Schreibe die Testdatei `app/test/agent-prompts.test.mjs` mit exakt diesem Inhalt:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { SYSTEM_COACH, INTERVIEW_REGELN, HINWEIS_ANWEISUNG } from '../src/agent-prompts.mjs'

test('SYSTEM_COACH definiert alle acht Hinweisarten mit ihren Schluesseln', () => {
  for (const art of ['fakt', 'quelle', 'methode', 'logik', 'struktur', 'wirkung', 'erklaerung', 'sprache']) {
    assert.ok(SYSTEM_COACH.includes(art), `Hinweisart ${art} fehlt im SYSTEM_COACH`)
  }
})

test('SYSTEM_COACH enthaelt die unverrueckbaren Regeln', () => {
  assert.ok(SYSTEM_COACH.includes('änderst nie selbst den Text'))
  assert.ok(SYSTEM_COACH.includes('erfindest nie Quellen'))
  assert.ok(SYSTEM_COACH.includes('wörtliches'))
  assert.ok(SYSTEM_COACH.includes('Integritätsfragen'))
})

test('Onda-Ton: du-Form, keine Ausrufezeichen in den Prompts', () => {
  for (const text of [SYSTEM_COACH, INTERVIEW_REGELN, HINWEIS_ANWEISUNG]) {
    assert.ok(!text.includes('!'), 'Ausrufezeichen gefunden')
    assert.ok(text.length > 200, 'Prompt ist kein Platzhalter')
  }
  assert.ok(SYSTEM_COACH.includes('Du '))
})

test('INTERVIEW_REGELN: vorschlagen statt ausfragen, eine gebuendelte Nachfrage', () => {
  assert.ok(INTERVIEW_REGELN.includes('Schlage vor'))
  assert.ok(INTERVIEW_REGELN.includes('eine gebündelte Nachfrage'))
  assert.ok(INTERVIEW_REGELN.includes('genau einer offenen Frage'))
  assert.ok(INTERVIEW_REGELN.includes('bindend'))
})

test('HINWEIS_ANWEISUNG: maximal drei, Grundursache zuerst, nichts wiederholen', () => {
  assert.ok(HINWEIS_ANWEISUNG.includes('höchstens drei'))
  assert.ok(HINWEIS_ANWEISUNG.includes('Grundursache zuerst'))
  assert.ok(HINWEIS_ANWEISUNG.includes('Wiederhole nichts'))
  assert.ok(HINWEIS_ANWEISUNG.includes('vorschlag: null'))
})
```

- [ ] Führe `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` aus — erwartetes Ergebnis: die neue Suite schlägt fehl mit `ERR_MODULE_NOT_FOUND` für `../src/agent-prompts.mjs`, die 46 Bestandstests bleiben grün (RED-Beleg).
- [ ] Schreibe `app/src/agent-prompts.mjs` mit exakt diesem Inhalt:

```js
// Deutsche Prompt-Konstanten für den echten Agenten — PUR, node-testbar.
// Ton: Onda — ruhig, du-Form, keine Ausrufezeichen. Einzige Quelle der Prompt-Texte.
// SYSTEM_COACH ist der stabile Cache-Präfix (siehe agent-tasks.mjs baueAnfrage);
// INTERVIEW_REGELN und HINWEIS_ANWEISUNG gibt der Verteiler als volatile Blöcke mit.

export const SYSTEM_COACH = `Du bist der Schreibpartner in einem persönlichen Schreibwerkzeug. Du arbeitest ruhig, aufmerksam und auf Augenhöhe: Du hilfst der Autorin oder dem Autor, den eigenen Text besser zu machen — du schreibst ihn nie selbst um.

Deine Haltung:
- Du sprichst die Autorin oder den Autor mit "du" an, in einem ruhigen, klaren Ton ohne Ausrufezeichen.
- Du respektierst Absicht und Stimme des Textes. Autorentscheidungen sind bindend; einmal Verworfenes schlägst du nicht erneut vor.
- Du bist ehrlich über Grenzen: Wenn dir Wissen oder Belege fehlen, sagst du das, statt etwas zu erfinden.

Deine Hinweise gehören immer zu genau einer von acht Arten:
1. fakt — Fakt und Aktualität: Eine Tatsachenbehauptung könnte falsch, veraltet oder ungenau sein.
2. quelle — Quelle und Zitation: Eine Aussage braucht einen Beleg, eine Quellenangabe fehlt oder ein Zitat ist fragwürdig.
3. methode — Methode und Schlussfolgerung: Aus Daten oder Beobachtungen wird mehr geschlossen, als sie tragen.
4. logik — Logik und Gegenargument: Ein Gedankengang hat einen Bruch, einen Widerspruch, oder ein naheliegendes Gegenargument bleibt unbeantwortet.
5. struktur — Struktur und roter Faden: Aufbau, Reihenfolge oder Übergänge tragen den Gedanken nicht.
6. wirkung — kommunikative Wirkung: Der Text erreicht beim Publikum voraussichtlich nicht die beabsichtigte Wirkung.
7. erklaerung — Erklärung und Leserführung: Ein Begriff oder Gedanke wird für die Zielgruppe nicht ausreichend eingeführt oder geführt.
8. sprache — Sprache, Register und Formulierung: Wortwahl, Register oder Satzbau passen nicht zu Absicht und Publikum.

Unverrückbare Regeln:
- Du änderst nie selbst den Text. Du machst Vorschläge; die Entscheidung liegt immer bei der Autorin oder dem Autor.
- Du erfindest nie Quellen, Zitate, Zahlen oder Belege. Die Arten quelle und fakt dürfen benennen, dass ein Beleg fehlt — niemals einen Beleg herbeidichten.
- Jeder Hinweis braucht einen Anker: ein wörtliches, möglichst kurzes Zitat aus dem Text, exakt so, wie es dort steht. Keine Paraphrase, keine Auslassungspunkte, keine Korrektur von Tippfehlern im Anker.
- Wenn du eine Ersetzung vorschlägst, muss das Feld "bisher" wörtlich im Text vorkommen.
- fakt, quelle, methode und logik sind Integritätsfragen: Sie betreffen die Wahrhaftigkeit des Textes und verschwinden nicht durch bloßes Verwerfen.`

export const INTERVIEW_REGELN = `So führst du das Gespräch über das Projektverständnis:
- Schlage vor, statt auszufragen. Wenn schon Text vorhanden ist, leite zuerst einen Entwurf des Verständnisses aus dem Text ab und lege ihn zur Korrektur vor.
- Stelle höchstens eine gebündelte Nachfrage pro Antwort. Frage nur nach echten Lücken, nie einen Fragenkatalog.
- Beginnt ein Projekt ganz ohne Text, eröffne mit genau einer offenen Frage nach dem Vorhaben.
- Jede Antwort der Autorin oder des Autors aktualisiert dein Verständnis. Ausdrückliche Korrekturen sind bindend und werden nicht erneut zur Diskussion gestellt.
- Formuliere kurz und konkret: zwei bis drei Sätze Vorschlag, dann gegebenenfalls die eine Nachfrage.`

export const HINWEIS_ANWEISUNG = `So erstellst du Hinweise zum vorliegenden Text:
- Gib höchstens drei neue Hinweise pro Durchgang. Weniger ist besser als viele.
- Nenne die Grundursache zuerst: Wenn mehrere Beobachtungen dieselbe Wurzel haben, benenne die Wurzel als einen Hinweis (istGrundursache: true), statt jedes Symptom einzeln aufzuzählen.
- Wiederhole nichts, was in der Entscheidungsliste steht: weder erledigte noch verworfene noch als Risiko akzeptierte Punkte — auch nicht in neuer Verkleidung.
- Jeder Hinweis füllt alle Felder: kategorie, anker (wörtliches Minimal-Zitat), beobachtung (was dir auffällt), relevanz (warum es für Ziel und Publikum zählt), folge (was passiert, wenn es bleibt), istGrundursache, integritaet.
- Ein Vorschlag (bisher/neu) ist freiwillig; mache ihn nur, wenn du eine konkrete bessere Fassung hast, und "bisher" muss wörtlich im Text vorkommen. Sonst setze vorschlag: null.
- Setze integritaet genau bei den Arten fakt, quelle, methode und logik auf true, sonst auf false.
- Findest du nichts Wesentliches, gib eine leere Liste zurück. Erfinde keine Hinweise, um eine Zahl zu füllen.`
```

- [ ] Führe `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` aus — erwartetes Ergebnis: alle Suiten grün, 51 Tests bestanden (46 Bestand + 5 neue), 0 Fehler (GREEN-Beleg).
- [ ] Committe mit `git add app/src/agent-prompts.mjs app/test/agent-prompts.test.mjs && git commit -m "feat(agent): deutsche Prompt-Konstanten für Coach, Interview und Hinweis-Läufe"`.

---

### Task G-2: Task-Tabelle, Wire-Format und Kostenschätzung (agent-tasks.mjs)

**Files:**
- Create: `app/src/agent-tasks.mjs`
- Test: `app/test/agent-tasks.test.mjs`

**Interfaces:**
- Consumes: `SYSTEM_COACH` aus `app/src/agent-prompts.mjs` (Task G-1)
- Produces: `MODELLE`, `TASK_TABLE`, `PREISE`, `HINWEISE_SCHEMA`, `VERSTAENDNIS_SCHEMA`, `API_URL`, `API_VERSION`, `baueAnfrage(task, kontext) -> {url, headers, body, stream}` (kontext = `{verstaendnis?, docText?, volatiles?: string[], verlauf?: {role,content}[]}`), `schaetzeKostenCents(usage, modellId) -> number` — konsumiert von agent-gateway (Bereich V) und agent-transport (Bereich T/S). Die Headers enthalten NIE den API-Schlüssel; den setzt ausschließlich der Transport (direktTransport) bzw. Swift (Brücke).

- [ ] Schreibe die Testdatei `app/test/agent-tasks.test.mjs` mit exakt diesem Inhalt:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MODELLE, TASK_TABLE, PREISE, HINWEISE_SCHEMA, VERSTAENDNIS_SCHEMA,
  API_URL, baueAnfrage, schaetzeKostenCents,
} from '../src/agent-tasks.mjs'
import { SYSTEM_COACH } from '../src/agent-prompts.mjs'

test('TASK_TABLE ist vollstaendig und zeigt auf gueltige Modelle', () => {
  const tasks = ['verstaendnis', 'hinweise', 'chat', 'titel', 'zusammenfassung']
  assert.deepEqual(Object.keys(TASK_TABLE).sort(), tasks.slice().sort())
  for (const name of tasks) {
    const eintrag = TASK_TABLE[name]
    assert.ok(MODELLE[eintrag.modell], `Task ${name}: Modell ${eintrag.modell} unbekannt`)
    assert.ok(Number.isInteger(eintrag.maxTokens) && eintrag.maxTokens > 0)
    assert.equal(typeof eintrag.stream, 'boolean')
  }
  assert.equal(TASK_TABLE.chat.stream, true)
  assert.equal(TASK_TABLE.verstaendnis.schema, VERSTAENDNIS_SCHEMA)
  assert.equal(TASK_TABLE.hinweise.schema, HINWEISE_SCHEMA)
  assert.equal(TASK_TABLE.titel.maxTokens, 256)
  assert.equal(TASK_TABLE.zusammenfassung.maxTokens, 2000)
  assert.equal(MODELLE.stark, 'claude-opus-5')
  assert.equal(MODELLE.routine, 'claude-haiku-4-5')
})

test('Schemata verbieten Zusatzfelder und verlangen Pflichtfelder', () => {
  assert.equal(HINWEISE_SCHEMA.additionalProperties, false)
  assert.deepEqual(HINWEISE_SCHEMA.required, ['hinweise'])
  const hinweis = HINWEISE_SCHEMA.properties.hinweise.items
  assert.equal(hinweis.additionalProperties, false)
  assert.deepEqual(hinweis.properties.kategorie.enum,
    ['fakt', 'quelle', 'methode', 'logik', 'struktur', 'wirkung', 'erklaerung', 'sprache'])
  assert.deepEqual(hinweis.required,
    ['kategorie', 'anker', 'beobachtung', 'relevanz', 'folge', 'vorschlag', 'istGrundursache', 'integritaet'])
  assert.equal(VERSTAENDNIS_SCHEMA.additionalProperties, false)
  assert.deepEqual(VERSTAENDNIS_SCHEMA.required,
    ['task', 'audience', 'desiredEffect', 'evidenceStandard', 'protectedIntentions', 'openQuestions', 'antwortText'])
})

test('baueAnfrage: Wire-Format und Cache-Praefix-Ordnung exakt nach Vertrag', () => {
  const anfrage = baueAnfrage('hinweise', {
    verstaendnis: { task: 'Essay' },
    docText: 'Ein Absatz.',
    volatiles: ['Entscheidungen: keine', 'Bitte prüfe den Text.'],
  })
  assert.equal(anfrage.url, 'https://api.anthropic.com/v1/messages')
  assert.equal(anfrage.headers['content-type'], 'application/json')
  assert.equal(anfrage.headers['anthropic-version'], '2023-06-01')
  assert.ok(!('x-api-key' in anfrage.headers), 'Schluessel setzen nur die Transporte')
  assert.equal(anfrage.stream, false)
  const body = anfrage.body
  assert.equal(body.model, 'claude-opus-5')
  assert.equal(body.max_tokens, 16000)
  assert.ok(!('temperature' in body) && !('top_p' in body) && !('thinking' in body))
  assert.equal(body.system[0].text, SYSTEM_COACH)
  assert.deepEqual(body.system[0].cache_control, { type: 'ephemeral' })
  const content = body.messages[0].content
  assert.ok(content[0].text.startsWith('<projektverstaendnis>'))
  assert.ok(content[0].text.endsWith('</projektverstaendnis>'))
  assert.deepEqual(content[0].cache_control, { type: 'ephemeral' })
  assert.equal(content[1].text, '<dokument>Ein Absatz.</dokument>')
  assert.deepEqual(content[1].cache_control, { type: 'ephemeral' })
  assert.ok(!('cache_control' in content[2]) && !('cache_control' in content[3]))
  assert.deepEqual(body.output_config, { format: { type: 'json_schema', schema: HINWEISE_SCHEMA } })
  assert.ok(!('stream' in body))
})

test('baueAnfrage: chat streamt und haengt den Verlauf hinter das Praefix', () => {
  const anfrage = baueAnfrage('chat', {
    verstaendnis: { task: 'Essay' },
    docText: 'Text',
    volatiles: ['Frage der Autorin'],
    verlauf: [{ role: 'assistant', content: 'Frühere Antwort' }],
  })
  assert.equal(anfrage.stream, true)
  assert.equal(anfrage.body.stream, true)
  assert.equal(anfrage.body.messages.length, 2)
  assert.equal(anfrage.body.messages[1].role, 'assistant')
  assert.ok(!('output_config' in anfrage.body))
})

test('baueAnfrage ist deterministisch: zweimal bauen ergibt byte-gleiches JSON', () => {
  const kontext = { verstaendnis: { task: 'Essay', audience: 'Fachpublikum' }, docText: 'Absatz eins.' }
  const a = JSON.stringify(baueAnfrage('verstaendnis', kontext))
  const b = JSON.stringify(baueAnfrage('verstaendnis', kontext))
  assert.equal(a, b)
})

test('schaetzeKostenCents rechnet mit den Preiskonstanten', () => {
  // 1M In + 1M Out auf Opus 5: 5 $ + 25 $ = 30 $ = 3000 Cent
  assert.equal(schaetzeKostenCents({ input_tokens: 1_000_000, output_tokens: 1_000_000 }, 'claude-opus-5'), 3000)
  // Cache-Read 0,1x und Cache-Write 1,25x des Input-Preises: 0,5 $ + 6,25 $ = 675 Cent
  const nurCache = schaetzeKostenCents({
    input_tokens: 0, output_tokens: 0,
    cache_read_input_tokens: 1_000_000, cache_creation_input_tokens: 1_000_000,
  }, 'claude-opus-5')
  assert.ok(Math.abs(nurCache - 675) < 1e-9)
  // Haiku: 1 $ + 5 $ = 600 Cent
  assert.equal(schaetzeKostenCents({ input_tokens: 1_000_000, output_tokens: 1_000_000 }, 'claude-haiku-4-5'), 600)
  // Unbekanntes Modell und fehlende Felder werfen nie
  assert.equal(schaetzeKostenCents({}, 'unbekannt'), 0)
  assert.equal(schaetzeKostenCents(undefined, 'claude-opus-5'), 0)
})

test('baueAnfrage wirft bei unbekanntem Task und leerem Kontext', () => {
  assert.throws(() => baueAnfrage('quatsch', { docText: 'x' }), /Unbekannter Task/)
  assert.throws(() => baueAnfrage('chat', {}), /ohne Inhalt/)
})
```

- [ ] Führe `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` aus — erwartetes Ergebnis: neue Suite schlägt fehl mit `ERR_MODULE_NOT_FOUND` für `../src/agent-tasks.mjs`, alle übrigen 51 Tests grün (RED-Beleg).
- [ ] Schreibe `app/src/agent-tasks.mjs` mit exakt diesem Inhalt:

```js
// Task→Modell-Verteilertabelle + Anfrage-Bau im Anthropic-Wire-Format — PUR, node-testbar.
// Kein DOM, kein Netz. Die Tabelle ist Daten, kein Code-Pfad: jede spätere Router- oder
// Anbieter-Erweiterung ist ein Tabelleneintrag, kein Umbau (Spec §3.1).
// WICHTIG: Dieses Modul kennt NIE den API-Schlüssel. Den setzt der direktTransport
// (x-api-key + anthropic-dangerous-direct-browser-access) bzw. Swift aus der Keychain.

import { SYSTEM_COACH } from './agent-prompts.mjs'

export const API_URL = 'https://api.anthropic.com/v1/messages'
export const API_VERSION = '2023-06-01'

export const MODELLE = Object.freeze({
  stark: 'claude-opus-5',
  routine: 'claude-haiku-4-5',
})

// Preis-Momentaufnahme 07/2026 (Anthropic-Preisliste) — regelmäßig prüfen.
// Dollar pro Million Tokens; Cache-Read 0,1x und Cache-Write 1,25x des Input-Preises.
export const PREISE = Object.freeze({
  'claude-opus-5': Object.freeze({ inProMTok: 5, outProMTok: 25 }),
  'claude-haiku-4-5': Object.freeze({ inProMTok: 1, outProMTok: 5 }),
  cacheReadFaktor: 0.1,
  cacheWriteFaktor: 1.25,
})

export const HINWEISE_SCHEMA = Object.freeze({
  type: 'object',
  properties: {
    hinweise: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kategorie: {
            type: 'string',
            enum: ['fakt', 'quelle', 'methode', 'logik', 'struktur', 'wirkung', 'erklaerung', 'sprache'],
          },
          anker: { type: 'string', description: 'Wörtliches Minimal-Zitat aus dem Text, keine Paraphrase.' },
          beobachtung: { type: 'string' },
          relevanz: { type: 'string' },
          folge: { type: 'string' },
          vorschlag: {
            anyOf: [
              {
                type: 'object',
                properties: { bisher: { type: 'string' }, neu: { type: 'string' } },
                required: ['bisher', 'neu'],
                additionalProperties: false,
              },
              { type: 'null' },
            ],
          },
          istGrundursache: { type: 'boolean' },
          integritaet: { type: 'boolean' },
        },
        required: ['kategorie', 'anker', 'beobachtung', 'relevanz', 'folge', 'vorschlag', 'istGrundursache', 'integritaet'],
        additionalProperties: false,
      },
    },
  },
  required: ['hinweise'],
  additionalProperties: false,
})

// Feldnamen exakt wie das Understanding-Modell (reasoning-model.mjs ensureProjectUnderstanding).
// Achtung fuer den Konsumenten: im gespeicherten Modell ist audience eine LISTE —
// der Verteiler zerlegt den String beim Uebernehmen (Vertrag: audience:string).
export const VERSTAENDNIS_SCHEMA = Object.freeze({
  type: 'object',
  properties: {
    task: { type: 'string' },
    audience: { type: 'string' },
    desiredEffect: { type: 'string' },
    evidenceStandard: { type: 'string' },
    protectedIntentions: { type: 'array', items: { type: 'string' } },
    openQuestions: { type: 'array', items: { type: 'string' } },
    antwortText: { type: 'string', description: 'Das, was der Agent im Chat sagt — Vorschlag oder Nachfrage.' },
  },
  required: ['task', 'audience', 'desiredEffect', 'evidenceStandard', 'protectedIntentions', 'openQuestions', 'antwortText'],
  additionalProperties: false,
})

export const TASK_TABLE = Object.freeze({
  verstaendnis: Object.freeze({ modell: 'stark', maxTokens: 16000, stream: false, schema: VERSTAENDNIS_SCHEMA }),
  hinweise: Object.freeze({ modell: 'stark', maxTokens: 16000, stream: false, schema: HINWEISE_SCHEMA }),
  chat: Object.freeze({ modell: 'stark', maxTokens: 16000, stream: true }),
  titel: Object.freeze({ modell: 'routine', maxTokens: 256, stream: false }),
  zusammenfassung: Object.freeze({ modell: 'routine', maxTokens: 2000, stream: false }),
})

// Baut die komplette Anfrage in stabiler Cache-Präfix-Ordnung:
// (1) System (SYSTEM_COACH) -> (2) Projektverständnis -> (3) Dokumenttext -> [Breakpoints]
// -> (4) volatile Blöcke (Entscheidungsliste, Anfrage) OHNE cache_control -> (5) Chat-Verlauf.
// Keine Zeitstempel, keine IDs im Präfix; maximal 3 cache_control-Breakpoints.
// KEIN thinking-Parameter (Opus 5 denkt adaptiv von selbst), KEINE temperature/top_p
// (auf Opus 5 ein 400-Fehler), kein Assistant-Prefill.
export function baueAnfrage(task, kontext = {}) {
  const eintrag = TASK_TABLE[task]
  if (!eintrag) throw new Error(`Unbekannter Task: ${task}`)

  const bloecke = []
  if (kontext.verstaendnis !== undefined) {
    bloecke.push({
      type: 'text',
      text: '<projektverstaendnis>' + JSON.stringify(kontext.verstaendnis) + '</projektverstaendnis>',
      cache_control: { type: 'ephemeral' },
    })
  }
  if (typeof kontext.docText === 'string') {
    bloecke.push({
      type: 'text',
      text: '<dokument>' + kontext.docText + '</dokument>',
      cache_control: { type: 'ephemeral' },
    })
  }
  for (const volatil of (kontext.volatiles || [])) {
    bloecke.push({ type: 'text', text: String(volatil) })
  }
  if (!bloecke.length) throw new Error('Anfrage ohne Inhalt: kontext braucht verstaendnis, docText oder volatiles')

  const body = {
    model: MODELLE[eintrag.modell],
    max_tokens: eintrag.maxTokens,
    system: [{ type: 'text', text: SYSTEM_COACH, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: bloecke }, ...(kontext.verlauf || [])],
  }
  if (eintrag.stream) body.stream = true
  if (eintrag.schema) body.output_config = { format: { type: 'json_schema', schema: eintrag.schema } }

  return {
    url: API_URL,
    headers: { 'content-type': 'application/json', 'anthropic-version': API_VERSION },
    body,
    stream: !!eintrag.stream,
  }
}

// Schätzt die Kosten einer Antwort in Cent aus den usage-Zahlen der API.
// Wirft nie: unbekanntes Modell oder fehlende Felder ergeben 0.
export function schaetzeKostenCents(usage, modellId) {
  const preis = PREISE[modellId]
  if (!preis || !usage) return 0
  const inTok = usage.input_tokens || 0
  const outTok = usage.output_tokens || 0
  const cacheRead = usage.cache_read_input_tokens || 0
  const cacheWrite = usage.cache_creation_input_tokens || 0
  const dollar = (
    inTok * preis.inProMTok
    + outTok * preis.outProMTok
    + cacheRead * preis.inProMTok * PREISE.cacheReadFaktor
    + cacheWrite * preis.inProMTok * PREISE.cacheWriteFaktor
  ) / 1_000_000
  return dollar * 100
}
```

- [ ] Führe `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` aus — erwartetes Ergebnis: alle Suiten grün, 58 Tests bestanden (51 + 7 neue), 0 Fehler (GREEN-Beleg).
- [ ] Committe mit `git add app/src/agent-tasks.mjs app/test/agent-tasks.test.mjs && git commit -m "feat(agent): Task-Tabelle, Wire-Format-Anfragebau und Kostenschätzung (agent-tasks)"`.

---

### Task G-3: Anker-Verifikation und Hinweis-Dedupe (anchor-verify.mjs)

**Files:**
- Create: `app/src/anchor-verify.mjs`
- Test: `app/test/anchor-verify.test.mjs`

**Interfaces:**
- Consumes: — (rein; arbeitet auf Strings und den bestehenden Formen aus `reasoning-model.mjs`: Findings tragen `anker`/`kategorie` (neu, KI-erzeugt) oder `target`/`category` (Bestand), `decisions`-Einträge tragen `findingId` — siehe `decideFinding`)
- Produces: `findeAnker(docText, anker) -> {gefunden: bool, index: number|null, normalisiert: bool}`, `dedupeHinweise(neueHinweise, findings, decisions) -> Array` — konsumiert von agent-gateway/workspace (Bereich V/W) vor der Finding-Erzeugung; `index` zeigt in den ORIGINAL-Text (auch bei normalisiertem Treffer).

- [ ] Schreibe die Testdatei `app/test/anchor-verify.test.mjs` mit exakt diesem Inhalt:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { findeAnker, dedupeHinweise } from '../src/anchor-verify.mjs'

test('findeAnker: exakter Treffer liefert Original-Index und normalisiert=false', () => {
  const doc = 'Der Anfang. Die mittlere Passage steht hier. Das Ende.'
  const treffer = findeAnker(doc, 'Passage steht hier')
  assert.deepEqual(treffer, {
    gefunden: true,
    index: doc.indexOf('Passage steht hier'),
    normalisiert: false,
  })
})

test('findeAnker: kollabiertes Whitespace wird normalisiert gefunden, Index zeigt in den Originaltext', () => {
  const doc = 'Ein Satz mit  doppeltem\n Leerraum im Text.'
  const treffer = findeAnker(doc, 'mit doppeltem Leerraum')
  assert.equal(treffer.gefunden, true)
  assert.equal(treffer.normalisiert, true)
  assert.equal(doc.slice(treffer.index, treffer.index + 3), 'mit')
})

test('findeAnker: typografische und gerade Anfuehrungszeichen gelten als gleich', () => {
  const doc = 'Sie nannte es „ein stilles Werkzeug“ und blieb dabei.'
  const gerade = findeAnker(doc, '"ein stilles Werkzeug"')
  assert.equal(gerade.gefunden, true)
  assert.equal(gerade.normalisiert, true)
  const einfach = findeAnker('Er sagte ‚ja‘ und ging.', "'ja'")
  assert.equal(einfach.gefunden, true)
  assert.equal(einfach.normalisiert, true)
})

test('findeAnker: nicht vorhandene, leere oder kaputte Anker werden verworfen', () => {
  assert.deepEqual(findeAnker('Kurzer Text.', 'erfundenes Zitat'),
    { gefunden: false, index: null, normalisiert: false })
  assert.equal(findeAnker('Kurzer Text.', '   ').gefunden, false)
  assert.equal(findeAnker('Kurzer Text.', '').gefunden, false)
  assert.equal(findeAnker(null, 'x').gefunden, false)
})

test('dedupeHinweise: gleicher Anker+Kategorie wie ein vorhandenes Finding fliegt raus', () => {
  const findings = [{ id: 'f-1', anker: 'diese Stelle', kategorie: 'logik', status: 'open' }]
  const neu = [
    { anker: 'diese Stelle', kategorie: 'logik' },
    { anker: 'diese Stelle', kategorie: 'sprache' },
    { anker: 'andere Stelle', kategorie: 'logik' },
  ]
  const ergebnis = dedupeHinweise(neu, findings, [])
  assert.equal(ergebnis.length, 2)
  assert.equal(ergebnis[0].kategorie, 'sprache')
  assert.equal(ergebnis[1].anker, 'andere Stelle')
})

test('dedupeHinweise: Bestands-Findings mit target/category zaehlen ebenfalls', () => {
  const findings = [{ id: 'f-2', target: 'alte Stelle', category: 'wording', status: 'dismissed' }]
  const ergebnis = dedupeHinweise([{ anker: 'alte Stelle', kategorie: 'wording' }], findings, [])
  assert.equal(ergebnis.length, 0)
})

test('dedupeHinweise: fruehere Entscheidung blockt, Duplikate im selben Lauf ebenso', () => {
  const findings = [{ id: 'f-3', anker: 'entschiedene Stelle', kategorie: 'fakt', status: 'risk-accepted' }]
  const decisions = [{ id: 'd-1', findingId: 'f-3', kind: 'reject', outcome: 'risk-accepted' }]
  const neu = [
    { anker: 'entschiedene Stelle', kategorie: 'fakt' },
    { anker: 'frische Stelle', kategorie: 'fakt' },
    { anker: 'frische  Stelle', kategorie: 'fakt' },
  ]
  const ergebnis = dedupeHinweise(neu, findings, decisions)
  assert.equal(ergebnis.length, 1)
  assert.equal(ergebnis[0].anker, 'frische Stelle')
})
```

- [ ] Führe `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` aus — erwartetes Ergebnis: neue Suite schlägt fehl mit `ERR_MODULE_NOT_FOUND` für `../src/anchor-verify.mjs`, alle übrigen 58 Tests grün (RED-Beleg).
- [ ] Schreibe `app/src/anchor-verify.mjs` mit exakt diesem Inhalt:

```js
// Client-Verifikation der KI-Anker — deterministischer Code, kein Modell (Spec §5).
// PUR, node-testbar: kein DOM, keine Tiptap-Abhängigkeit. Stufen: exakt ->
// normalisiert (Whitespace kollabieren + typografische/gerade Anführungszeichen
// gleichsetzen) -> sonst gefunden:false (Hinweis wird verworfen, nie geraten).

const QUOTE_MAP = Object.freeze({
  '\u201E': '"', // „
  '\u201C': '"', // “
  '\u201D': '"', // ”
  '\u201F': '"', // ‟
  '\u00AB': '"', // «
  '\u00BB': '"', // »
  '\u201A': "'", // ‚
  '\u2018': "'", // ‘
  '\u2019': "'", // ’
  '\u201B': "'", // ‛
  '\u2039': "'", // ‹
  '\u203A': "'", // ›
})

// Baut die normalisierte Fassung eines Texts plus eine Karte
// normalisierter Index -> Original-Index. Whitespace-Läufe kollabieren zu
// einem Leerzeichen, das auf das erste Original-Whitespace-Zeichen zeigt.
function normalisiereMitKarte(text) {
  let norm = ''
  const karte = []
  let inWhitespace = false
  for (let i = 0; i < text.length; i += 1) {
    const zeichen = text[i]
    if (/\s/.test(zeichen)) {
      if (!inWhitespace) {
        norm += ' '
        karte.push(i)
        inWhitespace = true
      }
      continue
    }
    inWhitespace = false
    norm += QUOTE_MAP[zeichen] || zeichen
    karte.push(i)
  }
  return { norm, karte }
}

export function findeAnker(docText, anker) {
  if (typeof docText !== 'string' || typeof anker !== 'string' || !anker.trim()) {
    return { gefunden: false, index: null, normalisiert: false }
  }

  const exakt = docText.indexOf(anker)
  if (exakt >= 0) return { gefunden: true, index: exakt, normalisiert: false }

  const doc = normalisiereMitKarte(docText)
  const gesucht = normalisiereMitKarte(anker.trim())
  const treffer = doc.norm.indexOf(gesucht.norm)
  if (treffer < 0) return { gefunden: false, index: null, normalisiert: false }
  return { gefunden: true, index: doc.karte[treffer], normalisiert: true }
}

// Dedupe-Schlüssel: normalisierter Anker + Kategorie (Fuzzy-Varianten desselben
// Zitats gelten als dieselbe Stelle).
function dedupeSchluessel(anker, kategorie) {
  const { norm } = normalisiereMitKarte(String(anker || '').trim())
  return `${norm}\u241F${String(kategorie || '')}`
}

// Filtert Wiederholungen: gleicher anker+kategorie wie ein vorhandenes Finding
// (egal welcher Status — decideFinding lässt entschiedene Findings in doc.findings)
// ODER wie eine frühere Entscheidung (über decision.findingId aufgelöst).
// Zusätzlich fallen Duplikate innerhalb desselben Laufs weg.
export function dedupeHinweise(neueHinweise, findings = [], decisions = []) {
  const bekannt = new Set()
  const schluesselProFinding = new Map()

  for (const finding of findings) {
    if (!finding) continue
    const anker = finding.anker ?? finding.target ?? ''
    const kategorie = finding.kategorie ?? finding.category ?? ''
    if (!String(anker).trim()) continue
    const schluessel = dedupeSchluessel(anker, kategorie)
    bekannt.add(schluessel)
    if (finding.id) schluesselProFinding.set(finding.id, schluessel)
  }

  for (const decision of decisions) {
    const schluessel = decision && schluesselProFinding.get(decision.findingId)
    if (schluessel) bekannt.add(schluessel)
  }

  const ergebnis = []
  const imLauf = new Set()
  for (const hinweis of (neueHinweise || [])) {
    if (!hinweis) continue
    const schluessel = dedupeSchluessel(hinweis.anker, hinweis.kategorie)
    if (bekannt.has(schluessel) || imLauf.has(schluessel)) continue
    imLauf.add(schluessel)
    ergebnis.push(hinweis)
  }
  return ergebnis
}
```

- [ ] Führe `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` aus — erwartetes Ergebnis: alle Suiten grün, 65 Tests bestanden (58 + 7 neue), 0 Fehler (GREEN-Beleg).
- [ ] Committe mit `git add app/src/anchor-verify.mjs app/test/anchor-verify.test.mjs && git commit -m "feat(agent): Anker-Verifikation und Hinweis-Dedupe als pure Module"`.

---

### Task G-4: Monats-Verbrauchszähler settings.usage (settings-model.mjs)

**Files:**
- Modify: `app/src/settings-model.mjs` (ganze Datei ist 25 Zeilen; Ergänzung nach `DEFAULT_SETTINGS` ~Zeile 13 und in `normalizeSettings` ~Zeile 17 — nach Inhalt suchen, Zeilennummern können verschoben sein)
- Test: `app/test/settings-model.test.mjs` (Ergänzung am Dateiende, ~Zeile 41; Import-Zeile 3 erweitern — nach Inhalt suchen)

**Interfaces:**
- Consumes: — (Muster: additives Feld wie `accent`, KEIN Schema-Bump; `normalizeSettings` wird von `editor.js load()` mit einem Argument aufgerufen — der neue zweite Parameter hat einen Default und bleibt abwärtskompatibel)
- Produces: `aktuellerMonat(datum = new Date()) -> 'JJJJ-MM'`, `leereUsage(monat) -> {monat, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, kostenCents}`, `verbucheUsage(settings, apiUsage, kostenCents, monat = aktuellerMonat()) -> usage` (apiUsage = API-Felder `input_tokens`/`output_tokens`/`cache_read_input_tokens`/`cache_creation_input_tokens`; wird von agent-gateway (Bereich V) nach jedem Lauf aufgerufen: `verbucheUsage(state.settings, ergebnis.usage, schaetzeKostenCents(ergebnis.usage, modellId))`); zusätzlich normalisiert `normalizeSettings(raw, monat?)` jetzt `settings.usage` tolerant inkl. Monatswechsel-Reset.

- [ ] Ergänze in `app/test/settings-model.test.mjs` die Import-Zeile (nach Inhalt suchen: `import { DEFAULT_SETTINGS, ACCENTS, normalizeSettings }`) zu exakt:

```js
import { DEFAULT_SETTINGS, ACCENTS, normalizeSettings, aktuellerMonat, leereUsage, verbucheUsage } from '../src/settings-model.mjs'
```

- [ ] Hänge ans Ende von `app/test/settings-model.test.mjs` exakt diese Tests an:

```js
test('usage: fehlt oder kaputt -> leerer Monatszaehler, bestehende Felder unberuehrt', () => {
  const s = normalizeSettings({}, '2026-07')
  assert.deepEqual(s.usage, {
    monat: '2026-07', inputTokens: 0, outputTokens: 0,
    cacheReadTokens: 0, cacheWriteTokens: 0, kostenCents: 0,
  })
  assert.equal(s.accent, 'sky')
  const kaputt = normalizeSettings({ usage: { monat: 42, inputTokens: 'x' } }, '2026-07')
  assert.equal(kaputt.usage.inputTokens, 0)
  assert.equal(kaputt.usage.monat, '2026-07')
})

test('usage: gespeicherte Werte desselben Monats bleiben erhalten', () => {
  const s = normalizeSettings({
    usage: { monat: '2026-07', inputTokens: 12, outputTokens: 3, cacheReadTokens: 4, cacheWriteTokens: 5, kostenCents: 6.5 },
  }, '2026-07')
  assert.equal(s.usage.inputTokens, 12)
  assert.equal(s.usage.cacheWriteTokens, 5)
  assert.equal(s.usage.kostenCents, 6.5)
})

test('usage: Monatswechsel setzt den Zaehler zurueck', () => {
  const s = normalizeSettings({ usage: { monat: '2026-06', inputTokens: 999, kostenCents: 50 } }, '2026-07')
  assert.deepEqual(s.usage, leereUsage('2026-07'))
})

test('verbucheUsage addiert API-Zahlen und Kosten und resettet bei Monatswechsel', () => {
  const s = normalizeSettings({}, '2026-07')
  verbucheUsage(s, {
    input_tokens: 100, output_tokens: 20,
    cache_read_input_tokens: 50, cache_creation_input_tokens: 10,
  }, 1.25, '2026-07')
  verbucheUsage(s, { input_tokens: 1 }, 0.05, '2026-07')
  assert.equal(s.usage.inputTokens, 101)
  assert.equal(s.usage.outputTokens, 20)
  assert.equal(s.usage.cacheReadTokens, 50)
  assert.equal(s.usage.cacheWriteTokens, 10)
  assert.ok(Math.abs(s.usage.kostenCents - 1.3) < 1e-9)
  verbucheUsage(s, { input_tokens: 7 }, 0.01, '2026-08')
  assert.equal(s.usage.monat, '2026-08')
  assert.equal(s.usage.inputTokens, 7)
  assert.ok(Math.abs(s.usage.kostenCents - 0.01) < 1e-9)
})

test('aktuellerMonat liefert JJJJ-MM und verbucheUsage wirft nie bei Muell', () => {
  assert.match(aktuellerMonat(), /^\d{4}-\d{2}$/)
  assert.equal(aktuellerMonat(new Date(2026, 6, 26)), '2026-07')
  const s = normalizeSettings({}, '2026-07')
  verbucheUsage(s, undefined, 'quatsch', '2026-07')
  assert.equal(s.usage.inputTokens, 0)
  assert.equal(s.usage.kostenCents, 0)
})
```

- [ ] Führe `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` aus — erwartetes Ergebnis: die Suite settings-model schlägt fehl (SyntaxError: fehlende Exporte `aktuellerMonat`/`leereUsage`/`verbucheUsage`), übrige Suiten grün (RED-Beleg).
- [ ] Ergänze in `app/src/settings-model.mjs` direkt nach dem `DEFAULT_SETTINGS`-Block (nach Inhalt suchen: `sidebarCollapsed: false,` und die schließende `})`) exakt diesen Code:

```js
// Verbrauchszähler für echte KI-Läufe (Etappe A) — additiv, KEIN Schema-Bump.
// usage steht bewusst NICHT in DEFAULT_SETTINGS: Object.assign kopiert flach,
// ein geteiltes (eingefrorenes) Default-Objekt wäre nicht beschreibbar.
// Bei Monatswechsel wird der Zähler zurückgesetzt (Spec §3.4).

export function aktuellerMonat(datum = new Date()) {
  return `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}`
}

export function leereUsage(monat) {
  return {
    monat,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    kostenCents: 0,
  }
}

function sichereZahl(wert) {
  const zahl = +wert
  return Number.isFinite(zahl) && zahl >= 0 ? zahl : 0
}

function normalizeUsage(raw, monat) {
  const src = raw && typeof raw === 'object' ? raw : {}
  if (src.monat !== monat) return leereUsage(monat)
  return {
    monat,
    inputTokens: sichereZahl(src.inputTokens),
    outputTokens: sichereZahl(src.outputTokens),
    cacheReadTokens: sichereZahl(src.cacheReadTokens),
    cacheWriteTokens: sichereZahl(src.cacheWriteTokens),
    kostenCents: sichereZahl(src.kostenCents),
  }
}

// Verbucht die usage-Zahlen einer API-Antwort (Feldnamen der Anthropic-API)
// plus geschätzte Kosten in Cent. Wirft nie; Müll zählt als 0.
export function verbucheUsage(settings, apiUsage, kostenCents, monat = aktuellerMonat()) {
  if (!settings.usage || settings.usage.monat !== monat) settings.usage = leereUsage(monat)
  const usage = settings.usage
  usage.inputTokens += sichereZahl(apiUsage && apiUsage.input_tokens)
  usage.outputTokens += sichereZahl(apiUsage && apiUsage.output_tokens)
  usage.cacheReadTokens += sichereZahl(apiUsage && apiUsage.cache_read_input_tokens)
  usage.cacheWriteTokens += sichereZahl(apiUsage && apiUsage.cache_creation_input_tokens)
  usage.kostenCents += sichereZahl(kostenCents)
  return usage
}
```

- [ ] Ändere in `app/src/settings-model.mjs` die Funktion `normalizeSettings` (nach Inhalt suchen: `export function normalizeSettings(raw) {`) zu exakt:

```js
export function normalizeSettings(raw, monat = aktuellerMonat()) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const s = Object.assign({}, DEFAULT_SETTINGS, src)
  s.structWidth = Math.max(360, Math.min(940, +s.structWidth || 560))
  s.accent = ACCENTS.includes(s.accent) ? s.accent : 'sky'
  s.sidebarCollapsed = !!s.sidebarCollapsed
  s.usage = normalizeUsage(src.usage, monat)
  return s
}
```

- [ ] Führe `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` aus — erwartetes Ergebnis: alle Suiten grün, 70 Tests bestanden (65 + 5 neue), 0 Fehler; insbesondere bleiben die 5 Bestandstests der settings-Suite unverändert grün (GREEN-Beleg, kein Schema-Bruch).
- [ ] Führe `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm run build` aus — erwartetes Ergebnis: esbuild-Bundle baut ohne Fehler (`dist/editor.bundle.js` geschrieben), da `editor.js` `normalizeSettings` weiter mit einem Argument aufruft.
- [ ] Committe mit `git add app/src/settings-model.mjs app/test/settings-model.test.mjs && git commit -m "feat(settings): Monats-Verbrauchszähler usage additiv in den Einstellungen"`.

---

## Bereich T — Transporte + Gateway

### Task T-1: parseSseZeilen — purer SSE-Zeilenpuffer-Parser (TDD)

**Files:**
- Create: `app/src/agent-transport.mjs` (nur der pure Parser-Teil; Transporte folgen in T-2)
- Test: `app/test/agent-transport.test.mjs`

**Interfaces:**
- Consumes: — (keine Abhängigkeiten, pures Modul)
- Produces: `parseSseZeilen(pufferObjekt, chunkText) -> Array<{typ:'delta',text}|{typ:'usage',usage}|{typ:'stop',stopReason}>` (Vertrag: pufferObjekt = `{rest:''}`, hält die letzte unvollständige Zeile über Chunk-Grenzen); Konstante `API_KEY_STORAGE = 'aiwt.apikey'`.

- [ ] Testdatei `app/test/agent-transport.test.mjs` anlegen mit genau diesem Inhalt (RED — das Modul existiert noch nicht):

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseSseZeilen } from '../src/agent-transport.mjs'

function sse(payload) { return 'data: ' + JSON.stringify(payload) + '\n\n' }

test('text_delta-Events kommen in Reihenfolge als delta heraus', () => {
  const puffer = { rest: '' }
  const chunk =
    'event: content_block_delta\n' + sse({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hal' } }) +
    'event: content_block_delta\n' + sse({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'lo' } })
  const events = parseSseZeilen(puffer, chunk)
  assert.deepEqual(events, [{ typ: 'delta', text: 'Hal' }, { typ: 'delta', text: 'lo' }])
  assert.equal(puffer.rest, '')
})

test('zerrissenes Event über Chunk-Grenzen wird erst nach dem zweiten Chunk geliefert', () => {
  const puffer = { rest: '' }
  const ganz = 'data: ' + JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Grüße' } }) + '\n'
  const schnitt = Math.floor(ganz.length / 2)
  assert.deepEqual(parseSseZeilen(puffer, ganz.slice(0, schnitt)), [])
  assert.equal(puffer.rest, ganz.slice(0, schnitt))
  assert.deepEqual(parseSseZeilen(puffer, ganz.slice(schnitt)), [{ typ: 'delta', text: 'Grüße' }])
  assert.equal(puffer.rest, '')
})

test('Kommentar-, Leer- und event:-Zeilen sowie ping werden verworfen', () => {
  const puffer = { rest: '' }
  const events = parseSseZeilen(puffer, ': keep-alive\n\nevent: ping\ndata: {"type":"ping"}\n\n')
  assert.deepEqual(events, [])
})

test('message_start liefert usage, message_delta liefert usage und stop', () => {
  const puffer = { rest: '' }
  const start = sse({ type: 'message_start', message: { usage: { input_tokens: 120, output_tokens: 1, cache_read_input_tokens: 100, cache_creation_input_tokens: 0 } } })
  const delta = sse({ type: 'message_delta', usage: { output_tokens: 42 }, delta: { stop_reason: 'end_turn' } })
  const events = parseSseZeilen(puffer, start + delta)
  assert.equal(events.length, 3)
  assert.deepEqual(events[0], { typ: 'usage', usage: { input_tokens: 120, output_tokens: 1, cache_read_input_tokens: 100, cache_creation_input_tokens: 0 } })
  assert.deepEqual(events[1], { typ: 'usage', usage: { output_tokens: 42 } })
  assert.deepEqual(events[2], { typ: 'stop', stopReason: 'end_turn' })
})

test('CRLF-Zeilenenden und kaputtes JSON stören den Strom nicht', () => {
  const puffer = { rest: '' }
  const events = parseSseZeilen(puffer, 'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"ok"}}\r\ndata: {kaputt\n')
  assert.deepEqual(events, [{ typ: 'delta', text: 'ok' }])
})
```

- [ ] RED belegen: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && node --test test/agent-transport.test.mjs` — erwartetes Ergebnis: Fehlschlag (`Cannot find module '../src/agent-transport.mjs'`).
- [ ] `app/src/agent-transport.mjs` anlegen mit genau diesem Inhalt:

```js
// Transporte zum Anthropic-Endpunkt: Browser-Direktweg (fetch) und Mac-Brücke
// (WKWebView-Handler 'llm'/'llmkey'). Beide liefern dieselbe Schnittstelle:
//   sende(anfrage, handlers) mit handlers = { onDelta?(text), onFertig(ergebnis), onFehler(fehler) }
//   ergebnis = { text, usage:{input_tokens,output_tokens,cache_read_input_tokens,cache_creation_input_tokens}, stopReason }
//   fehler   = { typ:'kein-schluessel'|'offline'|'ratenlimit'|'ueberlastet'|'schema'|'abgelehnt'|'abgebrochen', nachricht }
// parseSseZeilen ist PUR (node-testbar): ein Zeilenpuffer-Parser für SSE-Chunks —
// Events können über Chunk-Grenzen zerrissen ankommen, der Puffer hält den Rest.

export const API_KEY_STORAGE = 'aiwt.apikey'

// pufferObjekt: { rest: '' } — die letzte, evtl. unvollständige Zeile überlebt den Aufruf.
// 'event:'-Zeilen werden ignoriert: der Ereignistyp steht bei Anthropic im JSON ('type').
export function parseSseZeilen(pufferObjekt, chunkText) {
  const events = []
  const gesamt = (pufferObjekt.rest || '') + (chunkText || '')
  const zeilen = gesamt.split('\n')
  pufferObjekt.rest = zeilen.pop()
  for (let zeile of zeilen) {
    if (zeile.endsWith('\r')) zeile = zeile.slice(0, -1)
    if (!zeile || zeile.startsWith(':')) continue // leer / SSE-Kommentar
    if (!zeile.startsWith('data:')) continue
    const roh = zeile.slice(5).trim()
    if (!roh) continue
    let data
    try { data = JSON.parse(roh) } catch (e) { continue } // kaputte Zeile: still überspringen
    if (data.type === 'content_block_delta' && data.delta && data.delta.type === 'text_delta') {
      events.push({ typ: 'delta', text: data.delta.text })
    } else if (data.type === 'message_start' && data.message && data.message.usage) {
      events.push({ typ: 'usage', usage: data.message.usage })
    } else if (data.type === 'message_delta') {
      if (data.usage) events.push({ typ: 'usage', usage: data.usage })
      if (data.delta && data.delta.stop_reason) events.push({ typ: 'stop', stopReason: data.delta.stop_reason })
    }
  }
  return events
}
```

- [ ] GREEN belegen: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && node --test test/agent-transport.test.mjs` — erwartetes Ergebnis: 5 Tests bestanden.
- [ ] Gesamtlauf: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` — erwartetes Ergebnis: alle Suiten grün (46 bestehende + 5 neue Tests).
- [ ] Commit: `git add app/src/agent-transport.mjs app/test/agent-transport.test.mjs && git commit -m "test+feat(agent): parseSseZeilen — purer SSE-Zeilenpuffer-Parser über Chunk-Grenzen"`

---

### Task T-2: direktTransport, brueckenTransport, waehleTransport

**Files:**
- Modify: `app/src/agent-transport.mjs` (Ende der Datei; nach `parseSseZeilen` aus T-1 — nach Inhalt suchen, Zeilennummern können verschoben sein)
- Test: `app/test/agent-transport.test.mjs` (erweitern)

**Interfaces:**
- Consumes: `parseSseZeilen`, `API_KEY_STORAGE` (T-1). Browser-Globale (`fetch`, `localStorage`, `window.webkit.messageHandlers.llm`/`llmkey`) — in Tests per Node-Global-Stub simuliert (ersetzt nur das Netz, nie Produktlogik).
- Produces:
  - `direktTransport` / `brueckenTransport`, beide mit `sende(anfrage, handlers)`, `hatSchluessel():Promise<bool>`, `setzeSchluessel(schluessel):Promise<void>`, `loescheSchluessel():Promise<void>`
  - `waehleTransport() -> brueckenTransport | direktTransport`
  - pure Helfer: `mapHttpStatus(status)`, `mischeUsage(bisher, neu)` (Feld-weise „letzter Wert gewinnt" — Anthropic-Streaming liefert kumulative Zähler), `ergebnisAusAntwortJson(json)`
  - **Vertrag für Bereich S (Swift, verbindlich dokumentiert):** Swift ruft `window.AIWT.llmRueckruf({id, typ, ...})` mit: `{typ:'delta', text:<rohe SSE-Zeilen, beliebig zerstückelt>}` (JS puffert selbst via parseSseZeilen); `{typ:'fertig'}` bei `stream:true` bzw. `{typ:'fertig', text:<kompletter Antwort-Body als JSON-String>}` bei `stream:false`; `{typ:'fehler', status:<HTTP-Status>}` bei HTTP-Fehlern bzw. `{typ:'fehler', fehler:<Beschreibung>}` ohne Status bei Netzfehlern; `{typ:'schluesselstatus', status:true|false}` als Antwort auf jede `llmkey`-Nachricht `{id, aktion:'status'|'setzen'|'loeschen', schluessel?}`. Der brueckenTransport schickt die `headers` OHNE Schlüssel — Swift setzt `x-api-key` aus der Keychain ein.

- [ ] Tests erweitern (RED): an `app/test/agent-transport.test.mjs` genau diesen Block anhängen:

```js
import {
  direktTransport, brueckenTransport, waehleTransport,
  mapHttpStatus, mischeUsage, ergebnisAusAntwortJson, API_KEY_STORAGE,
} from '../src/agent-transport.mjs'

function speicherStub(anfang = {}) {
  const daten = { ...anfang }
  return {
    getItem: k => (k in daten ? daten[k] : null),
    setItem: (k, v) => { daten[k] = String(v) },
    removeItem: k => { delete daten[k] },
  }
}

function sendePromise(transport, anfrage, onDelta) {
  return new Promise((resolve, reject) => {
    transport.sende(anfrage, { onDelta, onFertig: resolve, onFehler: reject })
  })
}

const BASIS_ANFRAGE = Object.freeze({
  url: 'https://api.anthropic.com/v1/messages',
  headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01' },
  body: { model: 'claude-haiku-4-5', max_tokens: 256, system: [], messages: [] },
  stream: false,
})

test('mapHttpStatus: 401 kein-schluessel, 429 ratenlimit, 529/500 ueberlastet, 400 schema', () => {
  assert.equal(mapHttpStatus(401).typ, 'kein-schluessel')
  assert.equal(mapHttpStatus(429).typ, 'ratenlimit')
  assert.equal(mapHttpStatus(529).typ, 'ueberlastet')
  assert.equal(mapHttpStatus(500).typ, 'ueberlastet')
  assert.equal(mapHttpStatus(400).typ, 'schema')
})

test('mischeUsage: letzter Wert je Feld gewinnt, fehlende Felder bleiben', () => {
  const a = mischeUsage(null, { input_tokens: 9, output_tokens: 1, cache_read_input_tokens: 4 })
  const b = mischeUsage(a, { output_tokens: 6 })
  assert.deepEqual(b, { input_tokens: 9, output_tokens: 6, cache_read_input_tokens: 4, cache_creation_input_tokens: 0 })
})

test('ergebnisAusAntwortJson zieht ersten Text-Block, usage und stop_reason', () => {
  const e = ergebnisAusAntwortJson({
    content: [{ type: 'text', text: '{"a":1}' }],
    usage: { input_tokens: 5, output_tokens: 7 },
    stop_reason: 'end_turn',
  })
  assert.equal(e.text, '{"a":1}')
  assert.equal(e.usage.input_tokens, 5)
  assert.equal(e.stopReason, 'end_turn')
})

test('direkt: ohne Schlüssel kommt kein-schluessel, ohne fetch-Aufruf', async () => {
  globalThis.localStorage = speicherStub()
  globalThis.fetch = async () => { throw new Error('darf nicht aufgerufen werden') }
  try {
    await assert.rejects(sendePromise(direktTransport, BASIS_ANFRAGE), f => f.typ === 'kein-schluessel')
  } finally { delete globalThis.localStorage; delete globalThis.fetch }
})

test('direkt: Browser-Header + x-api-key gesetzt, nicht-stream liefert Ergebnis', async () => {
  globalThis.localStorage = speicherStub({ [API_KEY_STORAGE]: 'sk-test' })
  let gesehen = null
  globalThis.fetch = async (url, opts) => {
    gesehen = { url, opts }
    return {
      ok: true, status: 200,
      json: async () => ({ content: [{ type: 'text', text: 'Hallo' }], usage: { input_tokens: 3, output_tokens: 2 }, stop_reason: 'end_turn' }),
    }
  }
  try {
    const e = await sendePromise(direktTransport, BASIS_ANFRAGE)
    assert.equal(gesehen.opts.headers['x-api-key'], 'sk-test')
    assert.equal(gesehen.opts.headers['anthropic-dangerous-direct-browser-access'], 'true')
    assert.equal(e.text, 'Hallo')
    assert.equal(e.stopReason, 'end_turn')
  } finally { delete globalThis.localStorage; delete globalThis.fetch }
})

test('direkt: HTTP 429 wird zu ratenlimit, TypeError zu offline', async () => {
  globalThis.localStorage = speicherStub({ [API_KEY_STORAGE]: 'sk-test' })
  try {
    globalThis.fetch = async () => ({ ok: false, status: 429 })
    await assert.rejects(sendePromise(direktTransport, BASIS_ANFRAGE), f => f.typ === 'ratenlimit')
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
    await assert.rejects(sendePromise(direktTransport, BASIS_ANFRAGE), f => f.typ === 'offline')
  } finally { delete globalThis.localStorage; delete globalThis.fetch }
})

test('direkt: Streaming liest Chunks, reicht Deltas durch und mischt usage', async () => {
  globalThis.localStorage = speicherStub({ [API_KEY_STORAGE]: 'sk-test' })
  const enc = new TextEncoder()
  const strom =
    'data: ' + JSON.stringify({ type: 'message_start', message: { usage: { input_tokens: 9, output_tokens: 1, cache_read_input_tokens: 4, cache_creation_input_tokens: 0 } } }) + '\n\n' +
    'data: ' + JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hal' } }) + '\n\n' +
    'data: ' + JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'lo' } }) + '\n\n' +
    'data: ' + JSON.stringify({ type: 'message_delta', usage: { output_tokens: 6 }, delta: { stop_reason: 'end_turn' } }) + '\n\n'
  const schnitt = Math.floor(strom.length * 0.6) // mitten in einem Event
  const chunks = [enc.encode(strom.slice(0, schnitt)), enc.encode(strom.slice(schnitt))]
  globalThis.fetch = async () => ({
    ok: true, status: 200,
    body: { getReader() { let i = 0; return { async read() { return i < chunks.length ? { done: false, value: chunks[i++] } : { done: true, value: undefined } } } } },
  })
  try {
    const deltas = []
    const e = await sendePromise(direktTransport, { ...BASIS_ANFRAGE, stream: true }, t => deltas.push(t))
    assert.equal(deltas.join(''), 'Hallo')
    assert.equal(e.text, 'Hallo')
    assert.deepEqual(e.usage, { input_tokens: 9, output_tokens: 6, cache_read_input_tokens: 4, cache_creation_input_tokens: 0 })
    assert.equal(e.stopReason, 'end_turn')
  } finally { delete globalThis.localStorage; delete globalThis.fetch }
})

function brueckenWelt() {
  const llm = []; const key = []
  globalThis.window = {
    webkit: { messageHandlers: {
      llm: { postMessage(m) { llm.push(m) } },
      llmkey: { postMessage(m) { key.push(m) } },
    } },
  }
  return { llm, key, weg() { delete globalThis.window } }
}

test('bruecke: sende postet ohne x-api-key, puffert Deltas und schließt mit fertig', async () => {
  const welt = brueckenWelt()
  try {
    const deltas = []
    const p = sendePromise(brueckenTransport, { ...BASIS_ANFRAGE, stream: true }, t => deltas.push(t))
    assert.equal(welt.llm.length, 1)
    const id = welt.llm[0].id
    assert.ok(!('x-api-key' in welt.llm[0].headers))
    assert.equal(welt.llm[0].stream, true)
    const z1 = 'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hal"}}\ndata: {"type":"content_block_del'
    const z2 = 'ta","delta":{"type":"text_delta","text":"lo"}}\ndata: ' + JSON.stringify({ type: 'message_delta', usage: { output_tokens: 6 }, delta: { stop_reason: 'end_turn' } }) + '\n'
    globalThis.window.AIWT.llmRueckruf({ id, typ: 'delta', text: z1 })
    globalThis.window.AIWT.llmRueckruf({ id, typ: 'delta', text: z2 })
    globalThis.window.AIWT.llmRueckruf({ id, typ: 'fertig' })
    const e = await p
    assert.deepEqual(deltas, ['Hal', 'lo'])
    assert.equal(e.text, 'Hallo')
    assert.equal(e.usage.output_tokens, 6)
    assert.equal(e.stopReason, 'end_turn')
  } finally { welt.weg() }
})

test('bruecke: fehler mit HTTP-Status wird gemappt (401 -> kein-schluessel)', async () => {
  const welt = brueckenWelt()
  try {
    const p = sendePromise(brueckenTransport, BASIS_ANFRAGE)
    globalThis.window.AIWT.llmRueckruf({ id: welt.llm[0].id, typ: 'fehler', status: 401 })
    await assert.rejects(p, f => f.typ === 'kein-schluessel')
  } finally { welt.weg() }
})

test('bruecke: hatSchluessel fragt llmkey und löst mit dem Status auf', async () => {
  const welt = brueckenWelt()
  try {
    const p = brueckenTransport.hatSchluessel()
    assert.equal(welt.key[0].aktion, 'status')
    globalThis.window.AIWT.llmRueckruf({ id: welt.key[0].id, typ: 'schluesselstatus', status: true })
    assert.equal(await p, true)
  } finally { welt.weg() }
})

test('waehleTransport: Brücke nur wenn der llm-Handler existiert', () => {
  const welt = brueckenWelt()
  try { assert.equal(waehleTransport(), brueckenTransport) } finally { welt.weg() }
  assert.equal(waehleTransport(), direktTransport)
})
```

- [ ] RED belegen: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && node --test test/agent-transport.test.mjs` — erwartetes Ergebnis: Fehlschlag (`direktTransport` etc. nicht exportiert).
- [ ] `app/src/agent-transport.mjs` erweitern: genau diesen Block ans Dateiende anhängen:

```js
// ---------- Gemeinsame pure Bausteine ----------
export function mapHttpStatus(status) {
  if (status === 401 || status === 403) return { typ: 'kein-schluessel', nachricht: 'Der Schlüssel wurde nicht akzeptiert (HTTP ' + status + ').' }
  if (status === 429) return { typ: 'ratenlimit', nachricht: 'Zu viele Anfragen (HTTP 429).' }
  if (status === 529 || status >= 500) return { typ: 'ueberlastet', nachricht: 'Der Dienst ist gerade überlastet (HTTP ' + status + ').' }
  // Sonstige 4xx (z. B. 400 bei fehlerhafter Anfrage): kein Wiederholungsversuch,
  // Lauf wird wie Schema-Müll verworfen und protokolliert (Spec §7).
  return { typ: 'schema', nachricht: 'Die Anfrage wurde abgelehnt (HTTP ' + status + ').' }
}

function leereUsage() {
  return { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
}

// Anthropic-Streaming liefert kumulative Zähler (message_start: input/cache,
// message_delta: output) — darum gewinnt je Feld der zuletzt gemeldete Wert.
export function mischeUsage(bisher, neu) {
  const u = Object.assign(leereUsage(), bisher)
  if (!neu) return u
  for (const k of Object.keys(u)) if (typeof neu[k] === 'number') u[k] = neu[k]
  return u
}

export function ergebnisAusAntwortJson(json) {
  const block = Array.isArray(json && json.content) ? json.content.find(b => b && b.type === 'text') : null
  return {
    text: block ? block.text : '',
    usage: mischeUsage(null, json && json.usage),
    stopReason: (json && json.stop_reason) || null,
  }
}

function lesSchluessel() {
  try { return (localStorage.getItem(API_KEY_STORAGE) || '').trim() } catch (e) { return '' }
}

// ---------- Direktweg (Browser: Entwickler-/Rückfallpfad) ----------
export const direktTransport = {
  art: 'direkt',
  async hatSchluessel() { return !!lesSchluessel() },
  async setzeSchluessel(schluessel) { localStorage.setItem(API_KEY_STORAGE, (schluessel || '').trim()) },
  async loescheSchluessel() { localStorage.removeItem(API_KEY_STORAGE) },
  async sende(anfrage, handlers) {
    const schluessel = lesSchluessel()
    if (!schluessel) { handlers.onFehler({ typ: 'kein-schluessel', nachricht: 'Kein API-Schlüssel hinterlegt.' }); return }
    const headers = Object.assign({}, anfrage.headers, {
      'x-api-key': schluessel,
      'anthropic-dangerous-direct-browser-access': 'true',
    })
    let res
    try {
      res = await fetch(anfrage.url, { method: 'POST', headers, body: JSON.stringify(anfrage.body) })
    } catch (e) {
      handlers.onFehler({ typ: 'offline', nachricht: 'Keine Verbindung zum Dienst.' }); return
    }
    if (!res.ok) { handlers.onFehler(mapHttpStatus(res.status)); return }
    if (!anfrage.stream) {
      let json
      try { json = await res.json() } catch (e) { handlers.onFehler({ typ: 'schema', nachricht: 'Die Antwort war kein JSON.' }); return }
      handlers.onFertig(ergebnisAusAntwortJson(json)); return
    }
    const puffer = { rest: '' }
    const decoder = new TextDecoder('utf-8')
    const reader = res.body.getReader()
    let text = ''; let usage = mischeUsage(null, null); let stopReason = null
    const verarbeite = events => {
      for (const ev of events) {
        if (ev.typ === 'delta') { text += ev.text; if (handlers.onDelta) handlers.onDelta(ev.text) }
        else if (ev.typ === 'usage') usage = mischeUsage(usage, ev.usage)
        else if (ev.typ === 'stop') stopReason = ev.stopReason
      }
    }
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        verarbeite(parseSseZeilen(puffer, decoder.decode(value, { stream: true })))
      }
      verarbeite(parseSseZeilen(puffer, decoder.decode()))
      if (puffer.rest) verarbeite(parseSseZeilen(puffer, '\n'))
    } catch (e) {
      handlers.onFehler({ typ: 'offline', nachricht: 'Die Verbindung ist während des Streamens abgerissen.' }); return
    }
    handlers.onFertig({ text, usage, stopReason })
  },
}

// ---------- Brücke (Mac-App: Handler 'llm'/'llmkey', Schlüssel in der Keychain) ----------
// Registry offener Anfragen nach id; Swift antwortet über window.AIWT.llmRueckruf.
const offen = new Map()
let naechsteId = 1
function neueId(praefix) { return praefix + '-' + Date.now().toString(36) + '-' + (naechsteId++) }

function llmRueckruf(nachricht) {
  const eintrag = offen.get(nachricht.id)
  if (!eintrag) return
  if (nachricht.typ === 'schluesselstatus') {
    offen.delete(nachricht.id)
    eintrag.aufloesen(nachricht)
    return
  }
  if (nachricht.typ === 'delta') {
    // Swift reicht rohe SSE-Zeilen durch — derselbe Parser wie im Direktweg.
    for (const ev of parseSseZeilen(eintrag.puffer, nachricht.text || '')) {
      if (ev.typ === 'delta') { eintrag.text += ev.text; if (eintrag.handlers.onDelta) eintrag.handlers.onDelta(ev.text) }
      else if (ev.typ === 'usage') eintrag.usage = mischeUsage(eintrag.usage, ev.usage)
      else if (ev.typ === 'stop') eintrag.stopReason = ev.stopReason
    }
    return
  }
  if (nachricht.typ === 'fertig') {
    offen.delete(nachricht.id)
    if (eintrag.stream) {
      eintrag.handlers.onFertig({ text: eintrag.text, usage: eintrag.usage, stopReason: eintrag.stopReason })
    } else {
      let json
      try { json = JSON.parse(nachricht.text || '') } catch (e) {
        eintrag.handlers.onFehler({ typ: 'schema', nachricht: 'Die Antwort war kein JSON.' }); return
      }
      eintrag.handlers.onFertig(ergebnisAusAntwortJson(json))
    }
    return
  }
  if (nachricht.typ === 'fehler') {
    offen.delete(nachricht.id)
    if (typeof nachricht.status === 'number' && nachricht.status > 0) eintrag.handlers.onFehler(mapHttpStatus(nachricht.status))
    else eintrag.handlers.onFehler({ typ: 'offline', nachricht: nachricht.fehler || 'Keine Verbindung zum Dienst.' })
  }
}

// Idempotent und bei jedem Aufruf erneut geprüft: das esbuild-Bundle weist
// window.AIWT erst NACH der Modul-Auswertung zu (--global-name=AIWT), darum
// wird der Rückruf lazy beim ersten Gebrauch angehängt, nie beim Import.
function registriereRueckruf() {
  if (typeof window === 'undefined') return
  if (!window.AIWT || window.AIWT.llmRueckruf !== llmRueckruf) {
    window.AIWT = window.AIWT || {}
    window.AIWT.llmRueckruf = llmRueckruf
  }
}

function sendeLlmKey(aktion, schluessel) {
  registriereRueckruf()
  return new Promise(resolve => {
    const id = neueId('key')
    offen.set(id, { aufloesen: resolve })
    const nachricht = { id, aktion }
    if (schluessel != null) nachricht.schluessel = schluessel
    window.webkit.messageHandlers.llmkey.postMessage(nachricht)
  })
}

export const brueckenTransport = {
  art: 'bruecke',
  async hatSchluessel() {
    const antwort = await sendeLlmKey('status')
    return !!(antwort && antwort.status)
  },
  async setzeSchluessel(schluessel) { await sendeLlmKey('setzen', schluessel) },
  async loescheSchluessel() { await sendeLlmKey('loeschen') },
  sende(anfrage, handlers) {
    registriereRueckruf()
    const id = neueId('llm')
    offen.set(id, {
      handlers, stream: !!anfrage.stream, puffer: { rest: '' },
      text: '', usage: mischeUsage(null, null), stopReason: null,
    })
    try {
      // headers OHNE Schlüssel — Swift setzt x-api-key aus der Keychain ein.
      window.webkit.messageHandlers.llm.postMessage({
        id, url: anfrage.url, headers: anfrage.headers, body: anfrage.body, stream: !!anfrage.stream,
      })
    } catch (e) {
      offen.delete(id)
      handlers.onFehler({ typ: 'offline', nachricht: 'Die Brücke zur Mac-App antwortet nicht.' })
    }
  },
}

export function waehleTransport() {
  if (typeof window !== 'undefined' && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.llm) {
    return brueckenTransport
  }
  return direktTransport
}
```

- [ ] GREEN belegen: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && node --test test/agent-transport.test.mjs` — erwartetes Ergebnis: 16 Tests bestanden.
- [ ] Gesamtlauf: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` — erwartetes Ergebnis: alle Suiten grün.
- [ ] Commit: `git add app/src/agent-transport.mjs app/test/agent-transport.test.mjs && git commit -m "feat(agent): Direkt- und Brücken-Transport mit gemeinsamer sende()-Schnittstelle und Fehler-Mapping"`

---

### Task T-3: agent-gateway.mjs — runTask, Schema-Prüfung, Retry, Verbrauchszählung (TDD)

**Files:**
- Create: `app/src/agent-gateway.mjs`
- Test: `app/test/agent-gateway.test.mjs`

**Interfaces:**
- Consumes: `MODELLE`, `TASK_TABLE`, `baueAnfrage(task, kontext)`, `schaetzeKostenCents(usage, modellId)` aus `app/src/agent-tasks.mjs` (Bereich A — dieser Task setzt voraus, dass `agent-tasks.mjs` bereits existiert); `waehleTransport` aus `app/src/agent-transport.mjs` (T-2).
- Produces:
  - `initGateway({getSettings, persist, transport?, retryWartezeitMs?})` — `transport` ist der Test-Einschub auf `sende()`-Ebene (ersetzt nur das Netz), Standard: `waehleTransport()` lazy je Aufruf
  - `runTask(taskName, eingabe, optionen={onDelta}) -> Promise<{daten, usage}>` — bei Schema-Tasks ist `daten` das geparste Objekt, sonst der Antwort-Text
  - `hatSchluessel() -> Promise<bool>`, `setzeSchluessel(s)`, `loescheSchluessel()`
  - pure Helfer: `zaehleUsage(settings, usage, modellId)`, `pruefePflichtfelder(daten, schema)`
  - Fehler-Objekte: `{typ:'kein-schluessel'|'offline'|'ratenlimit'|'ueberlastet'|'schema'|'abgelehnt'|'abgebrochen', nachricht}`

- [ ] Testdatei `app/test/agent-gateway.test.mjs` anlegen mit genau diesem Inhalt (RED):

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { initGateway, runTask, zaehleUsage, pruefePflichtfelder } from '../src/agent-gateway.mjs'
import { TASK_TABLE } from '../src/agent-tasks.mjs'

const USAGE = Object.freeze({ input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 5, cache_creation_input_tokens: 2 })

const GUELTIGER_HINWEIS = {
  hinweise: [{
    kategorie: 'fakt',
    anker: 'wörtliches Zitat',
    beobachtung: 'Zahl ohne Beleg.',
    relevanz: 'Der Leser prüft genau solche Zahlen.',
    folge: 'Vertrauensverlust bei einer falschen Zahl.',
    vorschlag: null,
    istGrundursache: true,
    integritaet: true,
  }],
}

function mockTransport(schritte) {
  const aufrufe = []
  return {
    aufrufe,
    async hatSchluessel() { return true },
    async setzeSchluessel() {},
    async loescheSchluessel() {},
    sende(anfrage, handlers) {
      aufrufe.push(anfrage)
      const schritt = schritte[Math.min(aufrufe.length - 1, schritte.length - 1)]
      schritt(anfrage, handlers)
    },
  }
}

function frisch(transport) {
  const settings = {}
  let persists = 0
  initGateway({ getSettings: () => settings, persist: () => { persists++ }, transport, retryWartezeitMs: 1 })
  return { settings, persistCount: () => persists }
}

test('Erfolg: Schema-Task liefert geparste daten und zählt usage in settings', async () => {
  const t = mockTransport([(a, h) => h.onFertig({ text: JSON.stringify(GUELTIGER_HINWEIS), usage: { ...USAGE }, stopReason: 'end_turn' })])
  const welt = frisch(t)
  const { daten, usage } = await runTask('hinweise', { docText: 'x' })
  assert.equal(daten.hinweise[0].kategorie, 'fakt')
  assert.equal(usage.output_tokens, 20)
  assert.equal(welt.settings.usage.inputTokens, 10)
  assert.equal(welt.settings.usage.outputTokens, 20)
  assert.equal(welt.settings.usage.cacheReadTokens, 5)
  assert.equal(welt.settings.usage.cacheWriteTokens, 2)
  assert.ok(welt.settings.usage.kostenCents > 0)
  assert.equal(welt.persistCount(), 1)
  assert.equal(t.aufrufe.length, 1)
})

test('Schema-Müll: kein JSON im Text -> Fehler typ schema', async () => {
  const t = mockTransport([(a, h) => h.onFertig({ text: 'Gern! Hier deine Hinweise …', usage: { ...USAGE }, stopReason: 'end_turn' })])
  frisch(t)
  await assert.rejects(runTask('hinweise', {}), f => f.typ === 'schema')
})

test('Pflichtfeld fehlt -> Fehler typ schema', async () => {
  const kaputt = { hinweise: [{ kategorie: 'fakt' }] }
  const t = mockTransport([(a, h) => h.onFertig({ text: JSON.stringify(kaputt), usage: { ...USAGE }, stopReason: 'end_turn' })])
  frisch(t)
  await assert.rejects(runTask('hinweise', {}), f => f.typ === 'schema')
})

test('Retry: nach ratenlimit kommt genau EIN zweiter Versuch, der gewinnt', async () => {
  const t = mockTransport([
    (a, h) => h.onFehler({ typ: 'ratenlimit', nachricht: '429' }),
    (a, h) => h.onFertig({ text: 'Titel', usage: { ...USAGE }, stopReason: 'end_turn' }),
  ])
  frisch(t)
  const { daten } = await runTask('titel', {})
  assert.equal(daten, 'Titel')
  assert.equal(t.aufrufe.length, 2)
})

test('Retry: zwei Fehler hintereinander -> Fehler nach genau zwei Versuchen', async () => {
  const t = mockTransport([(a, h) => h.onFehler({ typ: 'ueberlastet', nachricht: '529' })])
  frisch(t)
  await assert.rejects(runTask('titel', {}), f => f.typ === 'ueberlastet')
  assert.equal(t.aufrufe.length, 2)
})

test('kein-schluessel wird NICHT wiederholt', async () => {
  const t = mockTransport([(a, h) => h.onFehler({ typ: 'kein-schluessel', nachricht: 'fehlt' })])
  frisch(t)
  await assert.rejects(runTask('titel', {}), f => f.typ === 'kein-schluessel')
  assert.equal(t.aufrufe.length, 1)
})

test('refusal: Fehler typ abgelehnt, usage wird trotzdem gezählt', async () => {
  const t = mockTransport([(a, h) => h.onFertig({ text: '', usage: { ...USAGE }, stopReason: 'refusal' })])
  const welt = frisch(t)
  await assert.rejects(runTask('hinweise', {}), f => f.typ === 'abgelehnt')
  assert.equal(welt.settings.usage.outputTokens, 20)
})

test('max_tokens: Lauf wird verworfen (typ schema), usage gezählt', async () => {
  const t = mockTransport([(a, h) => h.onFertig({ text: JSON.stringify(GUELTIGER_HINWEIS), usage: { ...USAGE }, stopReason: 'max_tokens' })])
  const welt = frisch(t)
  await assert.rejects(runTask('hinweise', {}), f => f.typ === 'schema')
  assert.equal(welt.settings.usage.inputTokens, 10)
})

test('chat: onDelta wird durchgereicht, daten ist der Volltext', async () => {
  const t = mockTransport([(a, h) => {
    assert.equal(a.stream, true)
    h.onDelta('Hal'); h.onDelta('lo')
    h.onFertig({ text: 'Hallo', usage: { ...USAGE }, stopReason: 'end_turn' })
  }])
  frisch(t)
  const deltas = []
  const { daten } = await runTask('chat', {}, { onDelta: x => deltas.push(x) })
  assert.deepEqual(deltas, ['Hal', 'lo'])
  assert.equal(daten, 'Hallo')
})

test('zaehleUsage: Monatswechsel setzt den Zähler zurück', () => {
  const settings = { usage: { monat: '2020-01', inputTokens: 999, outputTokens: 999, cacheReadTokens: 9, cacheWriteTokens: 9, kostenCents: 100 } }
  zaehleUsage(settings, { ...USAGE }, 'claude-haiku-4-5')
  assert.equal(settings.usage.monat, new Date().toISOString().slice(0, 7))
  assert.equal(settings.usage.inputTokens, 10)
  assert.equal(settings.usage.outputTokens, 20)
})

test('pruefePflichtfelder: fehlende und vorhandene Felder, auch in Array-Items', () => {
  const schema = TASK_TABLE.hinweise.schema
  assert.equal(pruefePflichtfelder(GUELTIGER_HINWEIS, schema), true)
  assert.equal(pruefePflichtfelder({ hinweise: [{ kategorie: 'fakt' }] }, schema), false)
  assert.equal(pruefePflichtfelder({}, schema), false)
  assert.equal(pruefePflichtfelder('kein Objekt', schema), false)
})
```

- [ ] RED belegen: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && node --test test/agent-gateway.test.mjs` — erwartetes Ergebnis: Fehlschlag (`Cannot find module '../src/agent-gateway.mjs'`).
- [ ] `app/src/agent-gateway.mjs` anlegen mit genau diesem Inhalt:

```js
// Der Verteiler: JEDER KI-Aufruf läuft hier durch. Schlägt den Task in der
// Tabelle nach (agent-tasks), sendet über den gewählten Transport, prüft
// stop_reason VOR dem Inhalt, validiert Schema-Antworten und zählt den
// Verbrauch monatsweise in settings.usage (additiv, tolerant — kein Schema-Bump).
import { MODELLE, TASK_TABLE, baueAnfrage, schaetzeKostenCents } from './agent-tasks.mjs'
import { waehleTransport } from './agent-transport.mjs'

const STANDARD_HOOKS = { getSettings: null, persist: null, transport: null, retryWartezeitMs: 2000 }
let hooks = { ...STANDARD_HOOKS }

export function initGateway(konfiguration) {
  hooks = Object.assign({ ...STANDARD_HOOKS }, konfiguration)
}

// Lazy je Aufruf: die Brücke kann erst nach dem App-Start verfügbar sein.
function aktiverTransport() { return hooks.transport || waehleTransport() }

export function hatSchluessel() { return aktiverTransport().hatSchluessel() }
export function setzeSchluessel(schluessel) { return aktiverTransport().setzeSchluessel(schluessel) }
export function loescheSchluessel() { return aktiverTransport().loescheSchluessel() }

const WIEDERHOLBAR = new Set(['offline', 'ratenlimit', 'ueberlastet'])

function warte(ms) { return new Promise(r => setTimeout(r, ms)) }

function sendeEinmal(anfrage, onDelta) {
  return new Promise((resolve, reject) => {
    aktiverTransport().sende(anfrage, { onDelta, onFertig: resolve, onFehler: reject })
  })
}

// Monats-Zählung (Muster wie accent in settings-model.mjs: additiv und tolerant).
export function zaehleUsage(settings, usage, modellId) {
  if (!settings || !usage) return
  const monat = new Date().toISOString().slice(0, 7) // 'JJJJ-MM'
  let u = settings.usage
  if (!u || typeof u !== 'object' || u.monat !== monat) {
    u = { monat, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, kostenCents: 0 }
    settings.usage = u
  }
  u.inputTokens += usage.input_tokens || 0
  u.outputTokens += usage.output_tokens || 0
  u.cacheReadTokens += usage.cache_read_input_tokens || 0
  u.cacheWriteTokens += usage.cache_creation_input_tokens || 0
  u.kostenCents += schaetzeKostenCents(usage, modellId)
}

// Pflichtfelder aus dem JSON-Schema prüfen (Objekte rekursiv, Array-Items) —
// bewusst schlank: fehlende Pflichtfelder sind der realistische „Müll trotz
// Erzwingung"; Typ-Feinheiten erzwingt das Schema bereits serverseitig.
export function pruefePflichtfelder(daten, schema) {
  if (!schema || typeof schema !== 'object') return true
  if (schema.type === 'object') {
    if (!daten || typeof daten !== 'object' || Array.isArray(daten)) return false
    for (const feld of schema.required || []) {
      if (!(feld in daten)) return false
      const unter = schema.properties && schema.properties[feld]
      if (unter && !pruefePflichtfelder(daten[feld], unter)) return false
    }
    return true
  }
  if (schema.type === 'array') {
    if (!Array.isArray(daten)) return false
    if (schema.items) { for (const el of daten) if (!pruefePflichtfelder(el, schema.items)) return false }
    return true
  }
  return daten !== undefined
}

export async function runTask(taskName, eingabe, optionen = {}) {
  const eintrag = TASK_TABLE[taskName]
  if (!eintrag) throw new Error('Unbekannter Task: ' + taskName)
  const anfrage = baueAnfrage(taskName, eingabe)
  const onDelta = eintrag.stream ? optionen.onDelta : undefined

  let ergebnis
  try {
    ergebnis = await sendeEinmal(anfrage, onDelta)
  } catch (fehler) {
    if (!WIEDERHOLBAR.has(fehler && fehler.typ)) throw fehler
    await warte(hooks.retryWartezeitMs) // EIN stiller Wiederholungsversuch (Spec §7)
    ergebnis = await sendeEinmal(anfrage, onDelta)
  }

  // Verbrauch IMMER zählen — auch bei refusal/max_tokens wurden Tokens verbraucht.
  const settings = hooks.getSettings ? hooks.getSettings() : null
  zaehleUsage(settings, ergebnis.usage, MODELLE[eintrag.modell])
  if (hooks.persist) hooks.persist()

  // stop_reason VOR dem Inhalt prüfen (Vertrag).
  if (ergebnis.stopReason === 'refusal') {
    console.info('[agent] Lauf abgelehnt (refusal) — Task', taskName) // leise, kein Alarm
    throw { typ: 'abgelehnt', nachricht: 'Der Agent hat diese Anfrage abgelehnt.' }
  }
  if (ergebnis.stopReason === 'max_tokens') {
    console.info('[agent] Lauf verworfen (max_tokens, Antwort abgeschnitten) — Task', taskName)
    throw { typ: 'schema', nachricht: 'Die Antwort wurde abgeschnitten (max_tokens) und verworfen.' }
  }

  if (eintrag.schema) {
    let daten
    try { daten = JSON.parse(ergebnis.text) } catch (e) {
      throw { typ: 'schema', nachricht: 'Die Antwort war kein gültiges JSON.' }
    }
    if (!pruefePflichtfelder(daten, eintrag.schema)) {
      throw { typ: 'schema', nachricht: 'In der Antwort fehlen Pflichtfelder.' }
    }
    return { daten, usage: ergebnis.usage }
  }
  return { daten: ergebnis.text, usage: ergebnis.usage }
}
```

- [ ] GREEN belegen: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && node --test test/agent-gateway.test.mjs` — erwartetes Ergebnis: 11 Tests bestanden.
- [ ] Gesamtlauf: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` — erwartetes Ergebnis: alle Suiten grün (alte 46 + neue Transport- und Gateway-Tests).
- [ ] Commit: `git add app/src/agent-gateway.mjs app/test/agent-gateway.test.mjs && git commit -m "feat(agent): Verteiler runTask — Task-Tabelle, Schema-Prüfung, stiller Retry, Verbrauchszählung"`

---

### Task T-4: Verkabelung in editor.js boot() — ctx.gateway

**Files:**
- Modify: `app/src/editor.js` (Import-Block ~Zeile 11–18 und ctx-Aufbau in `boot()` ~Zeile 478–482; nach Inhalt suchen, Zeilennummern können verschoben sein)
- Test: bestehende Suiten (`npm test`) + Bundle-Bau als Verkabelungs-Beleg

**Interfaces:**
- Consumes: `initGateway`, `runTask`, `hatSchluessel`, `setzeSchluessel`, `loescheSchluessel` aus `app/src/agent-gateway.mjs` (T-3); `state.settings` und `persist` aus `editor.js`.
- Produces: `ctx.gateway = { runTask, hatSchluessel, setzeSchluessel, loescheSchluessel }` — steht `initUI(ctx)` (Bereich U: Schlüssel-Status, Verbrauch) und `initWorkspace(ctx)` (Bereiche V/H/C: Interview, Hinweis-Läufe, Chat) zur Verfügung; `workspace.js` erreicht es über sein bestehendes `ctx`/`lastContext`.

- [ ] In `app/src/editor.js` nach der Zeile `import { EXAMPLE_PROJECT_ID, migrateExampleSeed } from './example-seed.mjs'` (~Zeile 18) genau diese Zeile einfügen:

```js
import { initGateway, runTask, hatSchluessel, setzeSchluessel, loescheSchluessel } from './agent-gateway.mjs'
```

- [ ] In `boot()` den ctx-Aufbau erweitern (nach `ensureTopLevelBlockIds(state.editor)` suchen, ~Zeile 476): den bestehenden Block

```js
  const ctx = {
    editor: state.editor, state,
    ops: { newDoc, openDoc, duplicateDoc, trashDoc, restoreDoc, deleteForever, newProject, renameProject, openProject },
    persist, scheduleSave, flushSave, exportMd, docTitle, activeDoc, autoGrowTitle, activeProjectObj, showHomeView,
  }
```

ersetzen durch:

```js
  // KI-Verteiler: liest settings für die Verbrauchszählung, speichert über persist.
  // Der Transport wird je Aufruf gewählt (Mac-Brücke, sonst Browser-Direktweg).
  initGateway({ getSettings: () => state.settings, persist })

  const ctx = {
    editor: state.editor, state,
    ops: { newDoc, openDoc, duplicateDoc, trashDoc, restoreDoc, deleteForever, newProject, renameProject, openProject },
    persist, scheduleSave, flushSave, exportMd, docTitle, activeDoc, autoGrowTitle, activeProjectObj, showHomeView,
    gateway: { runTask, hatSchluessel, setzeSchluessel, loescheSchluessel },
  }
```

- [ ] Verifizieren (Tests): `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` — erwartetes Ergebnis: alle Suiten grün, keine Regression.
- [ ] Verifizieren (Bundle): `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm run build` — erwartetes Ergebnis: esbuild baut `dist/editor.bundle.js` ohne Fehler (belegt, dass agent-gateway/agent-transport/agent-tasks sauber importierbar sind und kein Modul beim Import auf `window` zugreift).
- [ ] Commit: `git add app/src/editor.js app/dist/editor.bundle.js && git commit -m "feat(agent): Gateway in boot() verkabelt — ctx.gateway für Panel, Chat und Einstellungen"`

---

## Bereich S — Swift-Brücke + Mac-App-Neubau

### Task S-1: Keychain-Helfer + Handler `llmkey` in `mac/main.swift`

**Files:**
- Modify: `/Users/jakobschlenker/Documents/AI Writing Tool/mac/main.swift` (Keychain-Enum direkt nach dem Ende von `enum Store` ~Zeile 54; Handler-Registrierung im `applicationDidFinishLaunching` ~Zeile 166–172; `userContentController`-Switch ~Zeile 211–266 — nach Inhalt suchen, Zeilennummern können verschoben sein)

**Interfaces:**
- Consumes: `window.AIWT.llmRueckruf(payload)` — die JS-Registry aus Bereich T (`app/src/agent-transport.mjs`); Aufrufe vor deren Existenz sind durch den Guard No-ops.
- Produces: `Keychain.setzen(_:service:account:) -> Bool`, `Keychain.lesen(service:account:) -> String?`, `Keychain.loeschen(service:account:) -> Bool`, `Keychain.vorhanden(service:account:) -> Bool` (Swift-intern, wird von Task S-2 und S-4 konsumiert); `AppDelegate.llmRueckruf(_ payload: [String: Any])` (Swift-intern, wird von Task S-2 konsumiert); Message-Handler `llmkey` mit dem Vertrag: JS sendet `postMessage({id, aktion:'setzen'|'status'|'loeschen', schluessel?})`, Swift antwortet immer mit `window.AIWT.llmRueckruf({id, typ:'schluesselstatus', status:{vorhanden:bool}})` — der Schlüssel selbst wird NIE an JS zurückgegeben.

- [ ] `mac/main.swift` lesen und die drei Einfügestellen lokalisieren: Ende `enum Store` (nach Zeile `}` von `save`), Block `ucc.add(self, name: ...)`, Switch in `userContentController(_:didReceive:)`.
- [ ] Ganz oben in `main.swift` nach `import WebKit` die Zeile `import Security` einfügen.
- [ ] Direkt nach dem Ende von `enum Store` (vor `// MARK: - Selbsttest`) den kompletten Keychain-Helfer einfügen:
```swift
// MARK: - Schlüsselbund (API-Schlüssel verlässt nie den nativen Prozess)

enum Keychain {
    static let service = "Schreibwerkzeug"
    static let account = "anthropic-api-key"

    private static func basisAbfrage(service: String, account: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }

    /// Legt den Schlüssel ab (ersetzt einen vorhandenen Eintrag).
    @discardableResult
    static func setzen(_ schluessel: String, service: String = Keychain.service, account: String = Keychain.account) -> Bool {
        guard !schluessel.isEmpty, let data = schluessel.data(using: .utf8) else { return false }
        let query = basisAbfrage(service: service, account: account)
        SecItemDelete(query as CFDictionary)
        var add = query
        add[kSecValueData as String] = data
        add[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlocked
        return SecItemAdd(add as CFDictionary, nil) == errSecSuccess
    }

    /// Liest den Schlüssel — nur für den nativen 'llm'-Handler, nie für JS.
    static func lesen(service: String = Keychain.service, account: String = Keychain.account) -> String? {
        var query = basisAbfrage(service: service, account: account)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &out) == errSecSuccess,
              let d = out as? Data, let s = String(data: d, encoding: .utf8), !s.isEmpty else { return nil }
        return s
    }

    @discardableResult
    static func loeschen(service: String = Keychain.service, account: String = Keychain.account) -> Bool {
        let status = SecItemDelete(basisAbfrage(service: service, account: account) as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }

    static func vorhanden(service: String = Keychain.service, account: String = Keychain.account) -> Bool {
        lesen(service: service, account: account) != nil
    }
}
```
- [ ] In der `AppDelegate`-Klasse (nach `func userContentController`, vor dem `// JS-confirm()`-Kommentar) die zentrale Rückruf-Funktion einfügen — sie ist der EINZIGE Weg zurück ins JS für die LLM-Brücke:
```swift
    /// Einziger Rückkanal der LLM-Brücke: window.AIWT.llmRueckruf(payload).
    /// JSON-Serialisierung übernimmt jedes Escaping (Anführungszeichen, Zeilen-
    /// umbrüche in SSE-Rohzeilen); der Guard macht Aufrufe vor der JS-Registrierung
    /// zu No-ops. Reihenfolge ist trotzdem sicher: Swift ruft llmRueckruf nur als
    /// Antwort auf ein postMessage aus dem JS — zu dem Zeitpunkt ist
    /// agent-transport.mjs (Bereich T) längst geladen und window.AIWT registriert.
    func llmRueckruf(_ payload: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              var json = String(data: data, encoding: .utf8) else { return }
        // U+2028/U+2029 sind gültiges JSON, aber Zeilenumbrüche im JS-Quelltext.
        json = json.replacingOccurrences(of: "\u{2028}", with: "\\u2028")
                   .replacingOccurrences(of: "\u{2029}", with: "\\u2029")
        let js = "window.AIWT && window.AIWT.llmRueckruf && window.AIWT.llmRueckruf(\(json));"
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }
```
- [ ] Im `applicationDidFinishLaunching` nach `ucc.add(self, name: "openurl")` die Registrierung einfügen:
```swift
        ucc.add(self, name: "llmkey")
        ucc.add(self, name: "llm")
```
(Der `llm`-Case selbst kommt in Task S-2; bis dahin fällt `llm` in den `default`-Zweig und ist harmlos.)
- [ ] Im Switch von `userContentController(_:didReceive:)` vor `case "probe":` den `llmkey`-Case einfügen:
```swift
        case "llmkey":
            guard let obj = message.body as? [String: Any],
                  let id = obj["id"] as? String,
                  let aktion = obj["aktion"] as? String else { return }
            switch aktion {
            case "setzen":
                let roh = (obj["schluessel"] as? String ?? "")
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                if !roh.isEmpty { Keychain.setzen(roh) }
            case "loeschen":
                Keychain.loeschen()
            default:
                break // "status" fragt nur ab
            }
            // Antwort enthält NIE den Schlüssel — nur ja/nein.
            llmRueckruf(["id": id, "typ": "schluesselstatus",
                         "status": ["vorhanden": Keychain.vorhanden()]])
```
- [ ] Kompilieren: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/mac" && swiftc -O -swift-version 5 -o "/private/tmp/claude-501/-Users-jakobschlenker-Documents-AI-Writing-Tool/e242f024-39ee-451c-af7f-d96c3313ec37/scratchpad/sw-test" main.swift` — erwartet: keine Fehler, keine Warnungen zu Security-Symbolen.
- [ ] Bestehenden Selbsttest laufen lassen: `"/private/tmp/claude-501/-Users-jakobschlenker-Documents-AI-Writing-Tool/e242f024-39ee-451c-af7f-d96c3313ec37/scratchpad/sw-test" --selftest` — erwartet: `SELFTEST OK` (alle bisherigen PASS-Zeilen unverändert).
- [ ] Commit: `git add mac/main.swift && git commit -m "feat(mac): Schlüsselbund-Helfer + Handler 'llmkey' — Schlüssel bleibt im nativen Prozess, JS erfährt nur ja/nein"`

---

### Task S-2: Handler `llm` — URLSession-Anfrage + SSE-Streaming ohne Swift-Parser

**Files:**
- Modify: `/Users/jakobschlenker/Documents/AI Writing Tool/mac/main.swift` (Switch in `userContentController` — `llmkey`-Case aus S-1 suchen; neue Extension ans Dateiende vor `// MARK: - Start`, ~Zeile 363 — nach Inhalt suchen, Zeilennummern können verschoben sein)

**Interfaces:**
- Consumes: `Keychain.lesen()` und `AppDelegate.llmRueckruf(_:)` aus Task S-1; auf JS-Seite verarbeitet `parseSseZeilen` aus `app/src/agent-transport.mjs` (Bereich T) die Rohzeilen.
- Produces: Message-Handler `llm` mit dem Brücken-Vertrag: JS sendet `postMessage({id, url, headers (ohne Key), body, stream})`; Swift antwortet mit `llmRueckruf({id, typ:'delta', text})` (nur bei `stream:true`, `text` = SSE-Rohzeile inkl. `\n`), `llmRueckruf({id, typ:'fertig', text?})` (bei `stream:false` mit `text` = kompletter roher Antwort-Body; bei `stream:true` OHNE `text`), `llmRueckruf({id, typ:'fehler', fehler:{typ, nachricht}})`. **Dokumentierte Entscheidung:** Swift parst weder JSON noch SSE — bei `stream:false` geht der rohe Body als `text` an JS (der `brueckenTransport` zieht daraus text/usage/stopReason), bei `stream:true` geht jede Rohzeile als `delta` an `parseSseZeilen`. Ein Parser, eine Wahrheit, kein Duplikat in Swift. Fehler-Vokabular-Mapping (wird von Bereich T/G konsumiert): URLError → `offline`; HTTP 401/403 → `kein-schluessel`; 429 → `ratenlimit`; 529 und 500–599 → `ueberlastet`; übrige Nicht-200 (z. B. 400) → `schema` (fehlerhafte Anfrage, Wiederholung heilt nichts — der Verteiler wiederholt nur offline/ratenlimit/ueberlastet).

- [ ] Im Switch von `userContentController(_:didReceive:)` direkt nach dem `llmkey`-Case den `llm`-Case einfügen:
```swift
        case "llm":
            guard let obj = message.body as? [String: Any] else { return }
            handleLlm(obj)
```
- [ ] Am Dateiende vor `// MARK: - Start` die komplette LLM-Brücken-Extension einfügen:
```swift
// MARK: - LLM-Brücke (Handler 'llm')
//
// Entscheidung (verbindlich für Bereich T): Swift parst weder die JSON-Antwort
// noch den SSE-Strom. stream=false → der rohe Antwort-Körper geht als `text`
// im 'fertig'-Rückruf an JS; stream=true → jede SSE-Rohzeile (inkl. '\n',
// ohne '\r') geht als 'delta' an JS, dort arbeitet parseSseZeilen aus
// agent-transport.mjs. Ein Parser, eine Wahrheit — kein Duplikat in Swift.

extension AppDelegate {
    /// Großzügige Fristen: Opus-5-Läufe mit adaptivem Denken dürfen lange dauern.
    static let llmSession: URLSession = {
        let cfg = URLSessionConfiguration.ephemeral
        cfg.timeoutIntervalForRequest = 600   // 10 Minuten je Anfrage
        cfg.timeoutIntervalForResource = 1200
        return URLSession(configuration: cfg)
    }()

    /// HTTP-Status → Fehler-Vokabular des Verteilers (agent-gateway.mjs).
    static func fehlerTyp(fuerStatus status: Int) -> String {
        switch status {
        case 401, 403: return "kein-schluessel"
        case 429: return "ratenlimit"
        case 529: return "ueberlastet"
        case 500...599: return "ueberlastet"
        default: return "schema" // fehlerhafte Anfrage (z. B. 400) — nicht wiederholbar
        }
    }

    func handleLlm(_ obj: [String: Any]) {
        guard let id = obj["id"] as? String else { return }
        func fehler(_ typ: String, _ nachricht: String) {
            llmRueckruf(["id": id, "typ": "fehler",
                         "fehler": ["typ": typ, "nachricht": nachricht]])
        }
        guard let urlString = obj["url"] as? String,
              let url = URL(string: urlString),
              url.scheme == "https", url.host == "api.anthropic.com" else {
            fehler("schema", "Unzulässige Ziel-Adresse — die Brücke spricht nur mit api.anthropic.com.")
            return
        }
        guard let key = Keychain.lesen() else {
            fehler("kein-schluessel", "Kein API-Schlüssel im Schlüsselbund hinterlegt.")
            return
        }
        guard let body = obj["body"], JSONSerialization.isValidJSONObject(body),
              let bodyData = try? JSONSerialization.data(withJSONObject: body) else {
            fehler("schema", "Anfrage-Körper ließ sich nicht serialisieren.")
            return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = bodyData
        request.timeoutInterval = 600
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        let gesperrt = ["x-api-key", "anthropic-dangerous-direct-browser-access"]
        for (k, v) in (obj["headers"] as? [String: String]) ?? [:]
            where !gesperrt.contains(k.lowercased()) {
            request.setValue(v, forHTTPHeaderField: k)
        }
        request.setValue(key, forHTTPHeaderField: "x-api-key") // NUR hier, nie aus JS

        if (obj["stream"] as? Bool) == true {
            streamLlm(id: id, request: request)
        } else {
            fetchLlm(id: id, request: request)
        }
    }

    /// stream=false: komplette Antwort abholen, roher Body als `text` an JS.
    private func fetchLlm(id: String, request: URLRequest) {
        AppDelegate.llmSession.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }
            func fehler(_ typ: String, _ nachricht: String) {
                self.llmRueckruf(["id": id, "typ": "fehler",
                                  "fehler": ["typ": typ, "nachricht": nachricht]])
            }
            if let error = error {
                fehler("offline", "Netzfehler: \(error.localizedDescription)")
                return
            }
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            let text = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
            guard status == 200 else {
                fehler(AppDelegate.fehlerTyp(fuerStatus: status),
                       "HTTP \(status): \(String(text.prefix(300)))")
                return
            }
            self.llmRueckruf(["id": id, "typ": "fertig", "text": text])
        }.resume()
    }

    /// stream=true: SSE Zeile für Zeile, jede Rohzeile als 'delta' an JS.
    private func streamLlm(id: String, request: URLRequest) {
        Task { [weak self] in
            guard let self = self else { return }
            func fehler(_ typ: String, _ nachricht: String) {
                self.llmRueckruf(["id": id, "typ": "fehler",
                                  "fehler": ["typ": typ, "nachricht": nachricht]])
            }
            func alsZeile(_ d: Data) -> String {
                var s = String(data: d, encoding: .utf8) ?? ""
                if s.hasSuffix("\r") { s.removeLast() }
                return s
            }
            do {
                let (bytes, response) = try await AppDelegate.llmSession.bytes(for: request)
                let status = (response as? HTTPURLResponse)?.statusCode ?? 0
                if status != 200 {
                    var koerper = Data()
                    for try await b in bytes { koerper.append(b); if koerper.count > 4096 { break } }
                    let text = String(data: koerper, encoding: .utf8) ?? ""
                    fehler(AppDelegate.fehlerTyp(fuerStatus: status),
                           "HTTP \(status): \(String(text.prefix(300)))")
                    return
                }
                var zeile = Data()
                for try await b in bytes {
                    if b == 0x0A {
                        self.llmRueckruf(["id": id, "typ": "delta", "text": alsZeile(zeile) + "\n"])
                        zeile.removeAll(keepingCapacity: true)
                    } else {
                        zeile.append(b)
                    }
                }
                if !zeile.isEmpty {
                    self.llmRueckruf(["id": id, "typ": "delta", "text": alsZeile(zeile) + "\n"])
                }
                self.llmRueckruf(["id": id, "typ": "fertig"])
            } catch {
                fehler("offline", "Netzfehler: \(error.localizedDescription)")
            }
        }
    }
}
```
- [ ] Kompilieren: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/mac" && swiftc -O -swift-version 5 -o "/private/tmp/claude-501/-Users-jakobschlenker-Documents-AI-Writing-Tool/e242f024-39ee-451c-af7f-d96c3313ec37/scratchpad/sw-test" main.swift` — erwartet: keine Fehler (insbesondere keine Concurrency-Fehler; `URLSession.bytes` braucht macOS 12+, das ist das Deployment-Minimum der App).
- [ ] Selbsttest als Regression: `"/private/tmp/claude-501/-Users-jakobschlenker-Documents-AI-Writing-Tool/e242f024-39ee-451c-af7f-d96c3313ec37/scratchpad/sw-test" --selftest` — erwartet: `SELFTEST OK`.
- [ ] Commit: `git add mac/main.swift && git commit -m "feat(mac): Handler 'llm' — URLSession mit Keychain-Schlüssel, SSE-Rohzeilen als delta an JS, Fehler-Vokabular gemappt"`

---

### Task S-3: Rückruf-Reihenfolge absichern (window.AIWT.llmRueckruf vor erstem Swift-Aufruf)

**Files:**
- Modify: `/Users/jakobschlenker/Documents/AI Writing Tool/mac/main.swift` (nur Verifikation — der Guard und der Reihenfolge-Kommentar sind bereits Teil von `llmRueckruf` aus Task S-1)
- Test: Grep-Prüfung gegen `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/agent-transport.mjs` (Bereich T)

**Interfaces:**
- Consumes: `window.AIWT.llmRueckruf` — Bereich T MUSS die Registrierung auf Modul-Ebene von `agent-transport.mjs` ausführen (beim Import, nicht erst beim ersten `sende()`), damit sie vor jedem möglichen `postMessage` steht.
- Produces: nichts Neues — dieser Task ist die dokumentierte Reihenfolge-Garantie: (1) Swift ruft `llmRueckruf` ausschließlich als ANTWORT auf ein `postMessage` aus JS; ein `postMessage` kann erst nach dem Laden des JS-Bundles abgesetzt werden; `agent-transport.mjs` registriert `window.AIWT` beim Modul-Import — also existiert die Registry immer vor dem ersten Swift-Rückruf. (2) Der Guard `window.AIWT && window.AIWT.llmRueckruf && ...` in `llmRueckruf` macht jeden verirrten Aufruf (z. B. nach einem Seiten-Neuladen mitten im Stream) zum stillen No-op statt zum JS-Fehler.

- [ ] Voraussetzung prüfen (erst ausführbar, wenn Bereich T `agent-transport.mjs` angelegt hat): `grep -n "llmRueckruf" "/Users/jakobschlenker/Documents/AI Writing Tool/app/src/agent-transport.mjs"` — erwartet: eine Zuweisung an `window.AIWT.llmRueckruf` auf Modul-Ebene (außerhalb jeder Funktion). Falls die Registrierung in einer Funktion steckt, die erst beim ersten `sende()` läuft: an Bereich T zurückmelden — die Garantie gilt trotzdem (Swift antwortet nur auf `sende()`-postMessages), aber der Panel-Schlüsselstatus beim App-Start (`llmkey`/`status`) käme sonst vor der Registrierung an und ginge still verloren.
- [ ] In `mac/main.swift` verifizieren, dass der Reihenfolge-Kommentar über `func llmRueckruf` steht (aus Task S-1) und der Guard `window.AIWT && window.AIWT.llmRueckruf &&` im erzeugten JS-String enthalten ist: `grep -n "window.AIWT && window.AIWT.llmRueckruf" "/Users/jakobschlenker/Documents/AI Writing Tool/mac/main.swift"` — erwartet: genau 1 Treffer.
- [ ] Kein Commit nötig, falls beide Prüfungen ohne Änderung durchgehen; falls eine Nachbesserung am Kommentar/Guard nötig war: `git add mac/main.swift && git commit -m "fix(mac): Rückruf-Guard und Reihenfolge-Kommentar der LLM-Brücke nachgeschärft"`

---

### Task S-4: Selbsttest-Erweiterung, Mac-App-Neubau und ehrlicher Brücken-Smoke

**Files:**
- Modify: `/Users/jakobschlenker/Documents/AI Writing Tool/mac/main.swift` (`runSelfTest()` ~Zeile 58–110, neue Checks vor `try? FileManager.default.removeItem(at: Store.dir)`; `applicationDidFinishLaunching` nach `webView.uiDelegate = self` ~Zeile 183 — nach Inhalt suchen, Zeilennummern können verschoben sein)
- Test: `mac/build.sh` (unverändert lassen — es kopiert nur `index.html`, `style.css`, `dist/editor.bundle.js`, Fonts; die neuen `app/src/*.mjs`-Module der Bereiche G/T landen über esbuild im Bundle, kein build.sh-Eingriff nötig)

**Interfaces:**
- Consumes: `Keychain.setzen/lesen/loeschen/vorhanden` mit `service`-Parameter (Task S-1); `mac/build.sh`; bestehender `--probe`-Mechanismus (`editor.js` ~Zeile 504, Handler `probe` in `main.swift`); JS-Bundle mit den Modulen der Bereiche G/T/W (muss vor dem Neubau gemerged sein).
- Produces: neu gebaute `Schreibwerkzeug.app` mit Brücke; erweiterter Selbsttest; dokumentierter manueller Smoke (unten in den Schritten).

- [ ] In `runSelfTest()` direkt vor der Zeile `try? FileManager.default.removeItem(at: Store.dir)` die Schlüsselbund-Checks einfügen — eigener Selbsttest-Service, damit der echte Eintrag `Schreibwerkzeug`/`anthropic-api-key` nie berührt wird:
```swift
    // 8) Schlüsselbund-Helfer (eigener Selbsttest-Eintrag — der echte bleibt unberührt)
    let tService = "Schreibwerkzeug-Selbsttest"
    _ = Keychain.loeschen(service: tService)
    check("keychain-anfangs-leer", Keychain.vorhanden(service: tService) == false)
    check("keychain-setzen", Keychain.setzen("test-schluessel-123", service: tService))
    check("keychain-lesen", Keychain.lesen(service: tService) == "test-schluessel-123")
    check("keychain-ueberschreiben",
          Keychain.setzen("test-schluessel-456", service: tService)
          && Keychain.lesen(service: tService) == "test-schluessel-456")
    check("keychain-loeschen",
          Keychain.loeschen(service: tService) && Keychain.vorhanden(service: tService) == false)
    check("keychain-leer-abgelehnt", Keychain.setzen("", service: tService) == false)
```
- [ ] In `applicationDidFinishLaunching` nach `webView.uiDelegate = self` den Entwickler-Inspektor einfügen (nur auf ausdrücklichen Wunsch aktiv — ermöglicht den Brücken-Smoke über den Safari-Web-Inspektor, bevor die Einstellungen-UI der anderen Bereiche fertig ist):
```swift
        // Entwickler-Smoke: Web-Inspektor nur bei AIWT_DEBUG=1 (Safari → Entwickler).
        if ProcessInfo.processInfo.environment["AIWT_DEBUG"] == "1" {
            if #available(macOS 13.3, *) { webView.isInspectable = true }
        }
```
- [ ] Kompilieren + Selbsttest: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/mac" && swiftc -O -swift-version 5 -o "/private/tmp/claude-501/-Users-jakobschlenker-Documents-AI-Writing-Tool/e242f024-39ee-451c-af7f-d96c3313ec37/scratchpad/sw-test" main.swift && "/private/tmp/claude-501/-Users-jakobschlenker-Documents-AI-Writing-Tool/e242f024-39ee-451c-af7f-d96c3313ec37/scratchpad/sw-test" --selftest` — erwartet: `SELFTEST OK` inkl. der 6 neuen `keychain-*`-PASS-Zeilen.
- [ ] JS-Suiten als Regression: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` — erwartet: alle Suiten grün (Bestand 46 Tests plus die neuen Suiten der Bereiche G/T/W, je nach Merge-Stand).
- [ ] Echte Nutzerdaten sichern, bevor die neue App erstmals startet: `cp "$HOME/Library/Application Support/Schreibwerkzeug/data.json" "/private/tmp/claude-501/-Users-jakobschlenker-Documents-AI-Writing-Tool/e242f024-39ee-451c-af7f-d96c3313ec37/scratchpad/data-vor-etappe-a.json"` (falls die Datei existiert; sonst Schritt überspringen und notieren).
- [ ] App bauen: `bash "/Users/jakobschlenker/Documents/AI Writing Tool/mac/build.sh"` — erwartet: `BUILD OK → ../Schreibwerkzeug.app`.
- [ ] Automatisierter Probe-Lauf gegen ein Wegwerf-Datenverzeichnis (prüft: App startet, Bundle lädt, Brücken-Handler registriert, Speicher- und Bild-Brücke ok): `AIWT_DATA_DIR="/private/tmp/claude-501/-Users-jakobschlenker-Documents-AI-Writing-Tool/e242f024-39ee-451c-af7f-d96c3313ec37/scratchpad/probe-daten" "/Users/jakobschlenker/Documents/AI Writing Tool/Schreibwerkzeug.app/Contents/MacOS/Schreibwerkzeug" --probe "/private/tmp/claude-501/-Users-jakobschlenker-Documents-AI-Writing-Tool/e242f024-39ee-451c-af7f-d96c3313ec37/scratchpad/probe.json"; cat "/private/tmp/claude-501/-Users-jakobschlenker-Documents-AI-Writing-Tool/e242f024-39ee-451c-af7f-d96c3313ec37/scratchpad/probe.json"` — erwartet: Exit 0 und JSON mit `"editorOk":true`, `"imgBridge":true`, `"storageOk":true`.
- [ ] App regulär mit echten Daten starten: `open "/Users/jakobschlenker/Documents/AI Writing Tool/Schreibwerkzeug.app"` — erwartet: Fenster öffnet mit Onda-Oberfläche und den bestehenden Texten.
- [ ] Migration prüfen: App per Cmd+Q beenden (löst `__flushForQuit__` und damit einen Save aus), dann `grep -o '"schemaVersion":[0-9]*' "$HOME/Library/Application Support/Schreibwerkzeug/data.json"` — erwartet: `"schemaVersion":6` (Migration 3→6 aus `editor.js` hat gegriffen; die Sicherung aus dem früheren Schritt bleibt als Rückweg liegen).
- [ ] Manuellen Brücken-Smoke durchführen und im Plan-Protokoll abhaken — **ehrliche Grenze: alles Folgende ist OHNE echten API-Schlüssel testbar**, der echte Modell-Lauf ist es nicht:
  1. App starten, Einstellungen öffnen (Einstellungen-UI aus Bereich W/E): Schlüssel-Status zeigt „kein Schlüssel" — das ist der `llmkey`/`status`-Rundlauf über die Brücke (Antwort `{vorhanden:false}`).
  2. Dummy-Schlüssel `sk-ant-test-000` eintragen → Status wechselt auf „vorhanden"; Kontrolle außerhalb der App: Schlüsselbundverwaltung.app öffnen, nach „Schreibwerkzeug" suchen — Eintrag mit Account `anthropic-api-key` existiert.
  3. Agenten-Panel öffnen, Chat-Nachricht senden → erwartet: ruhiger Fehlerhinweis im Panel (der Dummy-Schlüssel erzeugt HTTP 401 → Brücke meldet `fehler` mit `typ:'kein-schluessel'`); kein Modal, Schreiben/Speichern/Export weiter uneingeschränkt (Offline-Würde).
  4. Schlüssel in den Einstellungen löschen → Status „kein Schlüssel"; Eintrag in der Schlüsselbundverwaltung ist weg.
  5. **Nur der Nutzer mit echtem Schlüssel:** eigenen Anthropic-Schlüssel eintragen (Anleitung inkl. Ausgabenlimit aus Bereich W), im Beispielprojekt eine Chat-Frage stellen — erwartet: live gestreamte Antwort (Beweis: Text baut sich wortweise auf = `delta`-Rohzeilen fließen durch `parseSseZeilen`); danach in den Einstellungen ablesen, dass der Monatsverbrauch hochgezählt hat.
- [ ] Commit: `git add mac/main.swift && git commit -m "test(mac): Selbsttest prüft Schlüsselbund-Helfer, Web-Inspektor hinter AIWT_DEBUG — App-Neubau mit Brücke verifiziert"`

---

## Bereich U — Einstellungen, Verbrauchsanzeige, Offline-Status

> Hinweis: Das ursprünglich entworfene U-1 (settings.usage) entfiel als Duplikat — die Verbuchungs-Funktionen (`aktuellerMonat`, `leereUsage`, `verbucheUsage`) kommen aus **Task G-4**.

### Task U-2: agent-status.mjs — purer Status-Speicher + Statuszeilen-Ableitung (TDD)
**Files:**
- Create: `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/agent-status.mjs`
- Test: `/Users/jakobschlenker/Documents/AI Writing Tool/app/test/agent-status.test.mjs` (neu)

**Interfaces:**
- Consumes: nichts (pur). Die Fehler-Typen entsprechen wörtlich den Gateway-Fehlerobjekten aus `agent-gateway.mjs`: `'kein-schluessel'|'offline'|'ratenlimit'|'ueberlastet'|'schema'|'abgelehnt'|'abgebrochen'`.
- Produces: `setzeAgentStatus(status)` mit `status = {zustand:'unbekannt'|'bereit'|'offline'|'laeuft'|'fehler', text?, fehlerTyp?}` — **Bereich W ruft das rund um jeden `runTask`-Aufruf auf** (`{zustand:'laeuft', text:'Agent liest …'}` vor dem Lauf, `{zustand:'bereit'}` nach Erfolg, `{zustand:'fehler', fehlerTyp: fehler.typ}` bei Fehler); `aktuellerAgentStatus() -> status`; `beiAgentStatus(listener) -> abmelden()`; `statuszeileFuer(status) -> {text, knopf:'einstellungen'|null, aura:bool} | null`.

- [ ] RED: `/Users/jakobschlenker/Documents/AI Writing Tool/app/test/agent-status.test.mjs` anlegen mit:
  ```js
  import test from 'node:test'
  import assert from 'node:assert/strict'
  import { aktuellerAgentStatus, beiAgentStatus, setzeAgentStatus, statuszeileFuer } from '../src/agent-status.mjs'

  test('statuszeileFuer: offline -> beruhigender Satz + Einstellungen-Knopf, keine Aura', () => {
    const zeile = statuszeileFuer({ zustand: 'offline' })
    assert.equal(zeile.text, 'Agent ist offline — dein Text ist davon unberührt.')
    assert.equal(zeile.knopf, 'einstellungen')
    assert.equal(zeile.aura, false)
  })

  test('statuszeileFuer: laufender Task -> Aura + Text (Standard und eigener Text)', () => {
    assert.deepEqual(statuszeileFuer({ zustand: 'laeuft' }), { text: 'Agent liest …', knopf: null, aura: true })
    assert.equal(statuszeileFuer({ zustand: 'laeuft', text: 'Agent antwortet …' }).text, 'Agent antwortet …')
  })

  test('statuszeileFuer: ratenlimit/ueberlastet -> ruhiger Hinweis mit Wiederholungsvermerk', () => {
    const rate = statuszeileFuer({ zustand: 'fehler', fehlerTyp: 'ratenlimit' })
    assert.match(rate.text, /automatisch/)
    assert.equal(rate.knopf, null)
    assert.equal(rate.aura, false)
    const last = statuszeileFuer({ zustand: 'fehler', fehlerTyp: 'ueberlastet' })
    assert.match(last.text, /automatisch/)
    assert.equal(last.aura, false)
  })

  test('statuszeileFuer: fehler kein-schluessel/offline -> Offline-Zeile mit Knopf', () => {
    assert.equal(statuszeileFuer({ zustand: 'fehler', fehlerTyp: 'offline' }).knopf, 'einstellungen')
    assert.equal(statuszeileFuer({ zustand: 'fehler', fehlerTyp: 'kein-schluessel' }).knopf, 'einstellungen')
  })

  test('statuszeileFuer: leise Fehler (schema/abgelehnt/abgebrochen) -> keine Zeile', () => {
    assert.equal(statuszeileFuer({ zustand: 'fehler', fehlerTyp: 'schema' }), null)
    assert.equal(statuszeileFuer({ zustand: 'fehler', fehlerTyp: 'abgelehnt' }), null)
    assert.equal(statuszeileFuer({ zustand: 'fehler', fehlerTyp: 'abgebrochen' }), null)
  })

  test('statuszeileFuer: bereit/unbekannt/null -> keine Zeile (Ruhe ist Normalzustand)', () => {
    assert.equal(statuszeileFuer({ zustand: 'bereit' }), null)
    assert.equal(statuszeileFuer({ zustand: 'unbekannt' }), null)
    assert.equal(statuszeileFuer(null), null)
  })

  test('setzeAgentStatus benachrichtigt Abonnenten; Abmelden stoppt weitere Rufe', () => {
    const gesehen = []
    const abmelden = beiAgentStatus(status => gesehen.push(status.zustand))
    setzeAgentStatus({ zustand: 'laeuft', text: 'Agent liest …' })
    assert.deepEqual(gesehen, ['laeuft'])
    assert.equal(aktuellerAgentStatus().zustand, 'laeuft')
    abmelden()
    setzeAgentStatus({ zustand: 'bereit' })
    assert.deepEqual(gesehen, ['laeuft'])
    assert.equal(aktuellerAgentStatus().zustand, 'bereit')
  })
  ```
- [ ] RED-Beleg: `cd app && npm test` — erwartet: neue Suite bricht mit Modul-nicht-gefunden (`Cannot find module .../src/agent-status.mjs`); alte Suiten grün.
- [ ] GREEN: `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/agent-status.mjs` anlegen mit:
  ```js
  // Reiner Status-Speicher fuer den Agenten-Anschluss — kein DOM, node-testbar.
  // Bereich W setzt den Zustand rund um Gateway-Laeufe (setzeAgentStatus),
  // die Oberflaeche (Agenten-Panel-Statuszeile, Aura-Orb) liest ihn hier ab.

  let status = { zustand: 'unbekannt' }
  const listeners = new Set()

  export function aktuellerAgentStatus() {
    return status
  }

  export function setzeAgentStatus(next) {
    status = next && typeof next === 'object' ? { ...next } : { zustand: 'unbekannt' }
    listeners.forEach(listener => {
      try { listener(status) } catch {}
    })
  }

  export function beiAgentStatus(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  // Leitet aus dem Zustand die ruhige Statuszeile des Agenten-Panels ab.
  // null = keine Zeile (Ruhe ist der Normalzustand). Nie Modals, nie Alarm.
  export function statuszeileFuer(s) {
    const zustand = s?.zustand
    if (zustand === 'offline') {
      return { text: 'Agent ist offline — dein Text ist davon unberührt.', knopf: 'einstellungen', aura: false }
    }
    if (zustand === 'laeuft') {
      return { text: s.text || 'Agent liest …', knopf: null, aura: true }
    }
    if (zustand === 'fehler') {
      if (s.fehlerTyp === 'kein-schluessel' || s.fehlerTyp === 'offline') {
        return { text: 'Agent ist offline — dein Text ist davon unberührt.', knopf: 'einstellungen', aura: false }
      }
      if (s.fehlerTyp === 'ratenlimit') {
        return { text: 'Gerade viele Anfragen — der Agent versucht es automatisch noch einmal.', knopf: null, aura: false }
      }
      if (s.fehlerTyp === 'ueberlastet') {
        return { text: 'Der Dienst ist gerade überlastet — der Agent versucht es automatisch noch einmal.', knopf: null, aura: false }
      }
      if (s.fehlerTyp === 'schema' || s.fehlerTyp === 'abgelehnt' || s.fehlerTyp === 'abgebrochen') {
        return null // leise: das Lauf-Protokoll haelt es fest, der naechste Ausloeser versucht es neu
      }
      return { text: 'Der Agent ist gerade nicht erreichbar — dein Text ist davon unberührt.', knopf: null, aura: false }
    }
    return null
  }
  ```
- [ ] GREEN-Beleg: `cd app && npm test` — erwartet: alle Suiten grün, 7 neue Tests bestehen.
- [ ] Commit: `git add app/src/agent-status.mjs app/test/agent-status.test.mjs && git commit -m "agent: purer Status-Speicher agent-status.mjs — Zustaende, Abonnenten, ruhige Statuszeilen-Ableitung (TDD)"`

---

### Task U-3: Einstellungen „KI-Anschluss" — Schlüssel, Anleitung, Verbrauchsanzeige
**Voraussetzung:** `app/src/agent-gateway.mjs` (Bereich G) existiert bereits im Branch — sonst schlägt der Bundle-Build fehl. Diesen Task erst nach den G-Tasks ausführen.

**Files:**
- Modify: `/Users/jakobschlenker/Documents/AI Writing Tool/app/index.html` (~Zeile 67–72, `.onda-side-footer`; nach Inhalt suchen, Zeilennummern können verschoben sein)
- Modify: `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/workspace.js` (Imports ~Zeile 1–18; neuer Dialog-Code nach `openProjectSourcesModal` ~Zeile 561; Binding bei `listen(document.getElementById('themeToggle'), …)` ~Zeile 2156 — nach Inhalt suchen, Zeilennummern können verschoben sein)
- Modify: `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/style.css` (ans Dateiende, nach `.onda-accent-swatch[data-accent="sand"]`)

**Interfaces:**
- Consumes: `hatSchluessel()` aus `./agent-gateway.mjs` (Bereich G); `beiAgentStatus` aus `./agent-status.mjs` (Task U-2); Brücken-Protokoll Handler `llmkey` (`postMessage({id, aktion:'setzen'|'status'|'loeschen', schluessel?})`, Bereich S); Browser-Dev-Schlüssel `localStorage 'aiwt.apikey'`; `settings.usage` (Task U-1, von Bereich G via `verbucheUsage` gefüllt — `kostenCents` dort per `schaetzeKostenCents` berechnet).
- Produces: `openKiSettingsDialog(opener)` (workspace-intern; Task U-4 nutzt sie für den Knopf „Einstellungen öffnen"); `pruefeAgentVerbindung()` wird in Task U-4 ergänzt und hier bereits per Vorwärtsreferenz aufgerufen — **deshalb U-3 und U-4 im selben Arbeitsgang vor dem ersten Build/Testlauf umsetzen oder die zwei `pruefeAgentVerbindung()`-Aufrufe erst in U-4 einfügen (gewählt: Aufrufe kommen erst in U-4, siehe Schritte)**.

- [ ] In `/Users/jakobschlenker/Documents/AI Writing Tool/app/index.html` den Footer-Block ersetzen. Alt:
  ```html
        <div class="onda-side-footer">
          <span class="onda-avatar" aria-hidden="true">J</span>
          <span class="onda-side-user">Jakob</span>
          <button id="themeToggle" class="onda-icon-btn" title="Erscheinung wechseln" aria-label="Erscheinung wechseln">☾</button>
          <button id="accentToggle" class="onda-icon-btn" title="Akzentfarbe wechseln" aria-label="Akzentfarbe wechseln"><span class="onda-accent-dot" aria-hidden="true"></span></button>
        </div>
  ```
  Neu:
  ```html
        <div class="onda-side-footer">
          <span class="onda-avatar" aria-hidden="true">J</span>
          <span class="onda-side-user">Jakob</span>
          <button id="themeToggle" class="onda-icon-btn" title="Erscheinung wechseln" aria-label="Erscheinung wechseln">☾</button>
          <button id="accentToggle" class="onda-icon-btn" title="Akzentfarbe wechseln" aria-label="Akzentfarbe wechseln"><span class="onda-accent-dot" aria-hidden="true"></span></button>
          <button id="kiSettings" class="onda-icon-btn" title="KI-Anschluss" aria-label="KI-Anschluss einrichten" aria-haspopup="dialog" aria-controls="kiModal">⚙︎</button>
        </div>
  ```
- [ ] In `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/workspace.js` die Import-Zeile `import { applySettings } from './ui.js'` (~Zeile 18) ersetzen durch:
  ```js
  import { applySettings } from './ui.js'
  import { hatSchluessel } from './agent-gateway.mjs'
  import { beiAgentStatus } from './agent-status.mjs'
  ```
- [ ] In `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/workspace.js` direkt NACH der Funktion `openProjectSourcesModal` (endet mit `}})` vor `function syncThemeToggle()`, ~Zeile 561) folgenden Block einfügen:
  ```js
  // ---------- Einstellungen: KI-Anschluss (Bereich U) ----------
  // Der Schluessel wird IMMER vom Nutzer selbst eingetragen. Mac: Keychain via
  // Handler 'llmkey' (der Schluessel kommt nie an JS zurueck). Browser: Dev-Weg
  // in localStorage 'aiwt.apikey' (separat von aiwt.v2, taucht in keinem Export auf).

  const KI_KONSOLE_URL = 'https://console.anthropic.com'

  function schluesselOrtIstKeychain() {
    return Boolean(window.webkit?.messageHandlers?.llmkey)
  }

  function sendeLlmkey(aktion, schluessel) {
    const nachricht = { id: 'key-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), aktion }
    if (schluessel !== undefined) nachricht.schluessel = schluessel
    window.webkit.messageHandlers.llmkey.postMessage(nachricht)
  }

  function speichereApiSchluessel(wert) {
    const schluessel = String(wert || '').trim()
    if (!schluessel) return false
    if (schluesselOrtIstKeychain()) sendeLlmkey('setzen', schluessel)
    else localStorage.setItem('aiwt.apikey', schluessel)
    return true
  }

  function loescheApiSchluessel() {
    if (schluesselOrtIstKeychain()) sendeLlmkey('loeschen')
    else localStorage.removeItem('aiwt.apikey')
  }

  function openKiSettingsDialog(opener) {
    openOndaDialog({ id: 'kiModal', title: 'KI-Anschluss', opener, build: body => buildKiSettingsBody(body) })
  }

  function buildKiSettingsBody(body) {
    body.replaceChildren()
    const keychain = schluesselOrtIstKeychain()

    // Schluessel-Status + Ablageort
    const statusRow = createNode('div', 'ki-status-row')
    const statusBadge = createNode('span', 'onda-badge', 'Prüfe …')
    statusRow.append(createNode('span', 'onda-eyebrow', 'Schlüssel'), statusBadge)
    body.append(statusRow)
    body.append(createNode('p', 'ki-ort', keychain
      ? 'Ablageort: macOS-Schlüsselbund — der Schlüssel verlässt die Mac-App nicht.'
      : 'Ablageort: dieser Browser (Entwicklungsweg).'))

    // Eintragen
    const form = createNode('form', 'ki-key-form')
    const input = createNode('input', 'ki-key-input')
    input.type = 'password'
    input.placeholder = 'sk-ant-…'
    input.autocomplete = 'off'
    input.spellcheck = false
    input.setAttribute('aria-label', 'Anthropic-API-Schlüssel eintragen')
    const speichern = createNode('button', 'onda-btn onda-btn--sm', 'Speichern')
    speichern.type = 'submit'
    form.append(input, speichern)
    body.append(form)

    if (!keychain) {
      body.append(createNode('p', 'ki-hinweis',
        'Sicherheitshinweis: Im Browser liegt der Schlüssel unverschlüsselt im lokalen Speicher '
        + '(nur für Entwicklung und Notfall gedacht). Empfohlen ist die Mac-App — dort wandert er '
        + 'in den macOS-Schlüsselbund. In Exporten taucht der Schlüssel nie auf.'))
    }

    const loeschen = createNode('button', 'onda-btn onda-btn--ghost onda-btn--sm', 'Schlüssel löschen')
    loeschen.type = 'button'
    loeschen.hidden = true
    body.append(loeschen)

    const zeigeStatus = vorhanden => {
      statusBadge.textContent = vorhanden ? 'Hinterlegt' : 'Fehlt'
      statusBadge.classList.toggle('onda-badge--success', vorhanden)
      statusBadge.classList.toggle('onda-badge--warning', !vorhanden)
      loeschen.hidden = !vorhanden
    }
    hatSchluessel().then(zeigeStatus).catch(() => zeigeStatus(false))

    const aktualisiereNachAenderung = () => {
      // Der Schluesselbund antwortet asynchron — kurz warten, dann Status neu lesen.
      setTimeout(() => {
        hatSchluessel().then(zeigeStatus).catch(() => zeigeStatus(false))
      }, 250)
    }
    form.addEventListener('submit', event => {
      event.preventDefault()
      if (!speichereApiSchluessel(input.value)) return
      input.value = ''
      announceAgentStatus('Schlüssel gespeichert.')
      aktualisiereNachAenderung()
    })
    loeschen.addEventListener('click', () => {
      loescheApiSchluessel()
      announceAgentStatus('Schlüssel gelöscht.')
      aktualisiereNachAenderung()
    })

    // Anleitung (aufklappbar)
    const anleitung = createNode('details', 'ki-anleitung')
    anleitung.append(createNode('summary', null, 'So richtest du den KI-Anschluss ein'))
    const schritte = createNode('ol', 'ki-anleitung-schritte')
    const schritt1 = createNode('li', null, 'Ein Konto anlegen auf ')
    const link = createNode('button', 'ki-link', 'console.anthropic.com')
    link.type = 'button'
    link.addEventListener('click', () => openSecureExternal(KI_KONSOLE_URL))
    schritt1.append(link, document.createTextNode('.'))
    const schritt3 = createNode('li', null, 'Im Anbieter-Konto ein Ausgabenlimit setzen ')
    schritt3.append(createNode('strong', 'ki-pflicht', '(Pflichtschritt — schützt vor unerwarteten Kosten).'))
    schritte.append(
      schritt1,
      createNode('li', null, 'Dort einen API-Schlüssel erzeugen (Bereich „API Keys“).'),
      schritt3,
      createNode('li', null, 'Den Schlüssel oben eintragen und speichern.'),
    )
    anleitung.append(schritte)
    body.append(anleitung)

    // Verbrauch (settings.usage — vom Verteiler nach jedem Lauf verbucht)
    const verbrauch = createNode('section', 'ki-verbrauch')
    body.append(verbrauch)
    renderKiVerbrauch(verbrauch)
    const abmelden = beiAgentStatus(() => {
      if (!verbrauch.isConnected) { abmelden(); return }
      renderKiVerbrauch(verbrauch)
    })
  }

  function formatTokenZahl(wert) {
    return (Number.isFinite(+wert) ? +wert : 0).toLocaleString('de-DE')
  }

  function renderKiVerbrauch(container) {
    container.replaceChildren()
    container.append(createNode('span', 'onda-eyebrow', 'Verbrauch'))
    const usage = ctx?.state?.settings?.usage
    if (!usage || (!usage.inputTokens && !usage.outputTokens)) {
      container.append(createNode('p', 'ki-verbrauch-leer', 'Diesen Monat noch keine Läufe.'))
      return
    }
    let monatsName = usage.monat
    try {
      monatsName = new Date(usage.monat + '-01T00:00:00').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
    } catch {}
    container.append(
      createNode('p', null, `${monatsName}: ${formatTokenZahl(usage.inputTokens)} Tokens hinein · ${formatTokenZahl(usage.outputTokens)} Tokens heraus`),
      createNode('p', null, `Aus dem Zwischenspeicher gelesen: ${formatTokenZahl(usage.cacheReadTokens)} · hineingeschrieben: ${formatTokenZahl(usage.cacheWriteTokens)}`),
      createNode('p', 'ki-verbrauch-kosten',
        `Geschätzte Kosten: ${((usage.kostenCents || 0) / 100).toLocaleString('de-DE', { style: 'currency', currency: 'USD' })}`
        + ' — Schätzung nach Preisstand 07/2026; verbindlich ist die Abrechnung im Anthropic-Konto.'),
    )
  }
  ```
- [ ] In `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/workspace.js` nach der Zeile `listen(document.getElementById('accentToggle'), 'click', event => openAccentMenu(event.currentTarget))` (~Zeile 2157) diese Zeile einfügen:
  ```js
  listen(document.getElementById('kiSettings'), 'click', event => openKiSettingsDialog(event.currentTarget))
  ```
- [ ] Ans Ende von `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/style.css` anhängen:
  ```css
  /* ==================== KI-Anschluss (Einstellungen, Bereich U) ==================== */
  .ki-status-row { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
  .ki-ort { margin: 0; color: var(--text-tertiary); font: var(--fw-regular) var(--text-sm)/1.5 var(--font-sans); }
  .ki-key-form { display: flex; gap: var(--space-2); }
  .ki-key-input {
    flex: 1;
    min-width: 0;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-control);
    background: var(--bg-app);
    color: var(--text-primary);
    font: var(--fw-regular) var(--text-base)/1.4 var(--font-mono);
  }
  .ki-key-input:focus-visible { outline: none; border-color: var(--accent); box-shadow: var(--shadow-focus); }
  .ki-hinweis { margin: 0; color: var(--text-tertiary); font: var(--fw-regular) var(--text-sm)/1.5 var(--font-sans); }
  .ki-anleitung {
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-card);
    padding: var(--space-3);
    background: var(--surface-2);
  }
  .ki-anleitung summary { cursor: pointer; color: var(--text-secondary); font: var(--fw-medium) var(--text-sm)/1.4 var(--font-sans); }
  .ki-anleitung-schritte {
    margin: var(--space-3) 0 0;
    padding-left: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    color: var(--text-primary);
    font: var(--fw-regular) var(--text-sm)/1.5 var(--font-sans);
  }
  .ki-pflicht { color: var(--warning); font-weight: var(--fw-semibold); }
  .ki-link {
    background: none;
    border: 0;
    padding: 0;
    color: var(--accent);
    cursor: pointer;
    text-decoration: underline;
    font: inherit;
  }
  .ki-link:focus-visible { outline: none; box-shadow: var(--shadow-focus); border-radius: 2px; }
  .ki-verbrauch { display: flex; flex-direction: column; gap: var(--space-1); }
  .ki-verbrauch p { margin: 0; color: var(--text-secondary); font: var(--fw-regular) var(--text-sm)/1.5 var(--font-sans); }
  .ki-verbrauch-kosten { color: var(--text-primary); }
  .ki-verbrauch-leer { color: var(--text-tertiary); }
  ```
- [ ] Verifizieren: `cd app && npm run build` — erwartet: esbuild schreibt `dist/editor.bundle.js` ohne Fehler (Exit-Code 0).
- [ ] Verifizieren: `cd app && npm test` — erwartet: alle Suiten grün (dieser Task fügt keine node-Tests hinzu; DOM-Fluss wird im Abschluss-Task des Plans per Playwright-Smoke abgedeckt).
- [ ] Commit: `git add app/index.html app/src/workspace.js app/src/style.css && git commit -m "einstellungen: KI-Anschluss-Dialog — Schluesselstatus, Eintragen/Loeschen (Keychain/Browser), Anleitung mit Ausgabenlimit-Pflichtschritt, Verbrauchsanzeige"`

---

### Task U-4: Ruhige Statuszeile im Agenten-Panel + Verbindungs-Prüfung
**Files:**
- Modify: `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/workspace.js` (Import aus Task U-3 ~Zeile 19–20; `renderAgentWidget` ~Zeile 1557; `initWorkspace` ~Zeile 1966 ff.; nach Inhalt suchen, Zeilennummern können verschoben sein)
- Modify: `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/style.css` (ans Dateiende, nach dem Block aus Task U-3)

**Interfaces:**
- Consumes: `aktuellerAgentStatus`, `beiAgentStatus`, `setzeAgentStatus`, `statuszeileFuer` aus `./agent-status.mjs` (Task U-2); `hatSchluessel()` aus `./agent-gateway.mjs`; `openKiSettingsDialog` (Task U-3).
- Produces: `pruefeAgentVerbindung() -> Promise<void>` (workspace-intern; setzt `bereit`/`offline` nach Schlüssel-Lage — **Bereich W darf sie nach fehlgeschlagenen Läufen erneut aufrufen**); Statuszeilen-Container `#agentStatusline` im Agenten-Panel (für den Playwright-Smoke des Abschluss-Tasks: Selektor `#agentStatusline`).

- [ ] In `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/workspace.js` die Import-Zeile `import { beiAgentStatus } from './agent-status.mjs'` ersetzen durch:
  ```js
  import { aktuellerAgentStatus, beiAgentStatus, setzeAgentStatus, statuszeileFuer } from './agent-status.mjs'
  ```
- [ ] In `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/workspace.js` direkt VOR `function activeAgentMessage(workspace)` (~Zeile 1514) einfügen:
  ```js
  // Prueft die Schluessel-Lage und setzt den ruhigen Grundzustand des Agenten.
  // Laufende Tasks werden nie ueberschrieben (Bereich W setzt 'laeuft'/'fehler').
  async function pruefeAgentVerbindung() {
    let vorhanden = false
    try {
      vorhanden = await hatSchluessel()
    } catch {
      vorhanden = false
    }
    if (aktuellerAgentStatus().zustand === 'laeuft') return
    setzeAgentStatus(vorhanden ? { zustand: 'bereit' } : { zustand: 'offline' })
  }

  // Ruhige Statuszeile im Agenten-Panel: offline / Lauf aktiv / Fehler.
  // Ersetzt nur die Kinder des Containers — nie Modals, nie Fokusraub.
  function renderAgentStatuszeile() {
    const host = document.getElementById('agentStatusline')
    if (!host) return
    const zeile = statuszeileFuer(aktuellerAgentStatus())
    host.replaceChildren()
    host.hidden = !zeile
    if (!zeile) return
    if (zeile.aura) {
      const orb = createNode('span', 'onda-aura onda-aura--xs is-thinking')
      orb.setAttribute('aria-hidden', 'true')
      host.append(orb)
    }
    host.append(createNode('span', 'agent-statusline-text', zeile.text))
    if (zeile.knopf === 'einstellungen') {
      const oeffnen = createNode('button', 'onda-btn onda-btn--ghost onda-btn--sm', 'Einstellungen öffnen')
      oeffnen.type = 'button'
      oeffnen.addEventListener('click', event => openKiSettingsDialog(event.currentTarget))
      host.append(oeffnen)
    }
  }
  ```
- [ ] In `renderAgentWidget` (~Zeile 1583) direkt nach der Zeile `ui.agentWidget.append(header)` einfügen:
  ```js
  const statusline = createNode('div', 'agent-statusline')
  statusline.id = 'agentStatusline'
  statusline.hidden = true
  ui.agentWidget.append(statusline)
  renderAgentStatuszeile()
  ```
- [ ] In Task U-3s Dialog-Code (`buildKiSettingsBody`, Funktion `aktualisiereNachAenderung`) die Zeile `hatSchluessel().then(zeigeStatus).catch(() => zeigeStatus(false))` innerhalb des `setTimeout` ersetzen durch:
  ```js
        pruefeAgentVerbindung()
        hatSchluessel().then(zeigeStatus).catch(() => zeigeStatus(false))
  ```
  (So verschwindet die Offline-Zeile im Panel, sobald ein Schlüssel eingetragen ist — und erscheint nach dem Löschen.)
- [ ] In `initWorkspace` direkt nach der Zeile `listenEditor('update', onEditorUpdate)` (~Zeile 2159) einfügen:
  ```js
  // Status-Abo: Statuszeile und Aura folgen dem echten Agenten-Zustand.
  cleanups.push(beiAgentStatus(() => {
    renderAgentStatuszeile()
    applyAuraState()
  }))
  pruefeAgentVerbindung()
  ```
- [ ] Ans Ende von `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/style.css` anhängen:
  ```css
  /* Ruhige Statuszeile im Agenten-Panel (Bereich U) */
  .agent-statusline {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    color: var(--text-secondary);
    font: var(--fw-regular) var(--text-sm)/1.45 var(--font-sans);
  }
  .agent-statusline[hidden] { display: none; }
  .agent-statusline-text { min-width: 0; }
  .agent-statusline .onda-btn { flex: none; margin-left: auto; }
  ```
- [ ] Verifizieren: `cd app && npm run build` — erwartet: Bundle baut ohne Fehler (Exit-Code 0).
- [ ] Verifizieren: `cd app && npm test` — erwartet: alle Suiten grün, unverändert zu Task U-2 (+13 neue Tests gegenüber Ausgangsstand).
- [ ] Manuell verifizieren (Browser ohne Schlüssel): `cd app && python3 -m http.server 8000` öffnen, `localStorage.removeItem('aiwt.apikey')` in der Konsole, Text öffnen, Aura klicken — erwartet: im Panel steht „Agent ist offline — dein Text ist davon unberührt." mit Knopf „Einstellungen öffnen"; Klick öffnet den KI-Anschluss-Dialog; kein Modal-Alarm, Tippen im Editor bleibt ungestört.
- [ ] Commit: `git add app/src/workspace.js app/src/style.css && git commit -m "agent: ruhige Statuszeile im Panel — offline mit Einstellungen-Knopf, Lauf-Aura, Wiederholungsvermerk bei Ratenlimit/Ueberlastung; nie Modals"`

---

### Task U-5: Aura-Orb `is-thinking` aus echter Quelle
**Files:**
- Modify: `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/workspace.js` (`applyAuraState` ~Zeile 1499; nach Inhalt suchen, Zeilennummern können verschoben sein)

**Interfaces:**
- Consumes: `aktuellerAgentStatus` aus `./agent-status.mjs` (bereits importiert, Task U-4); bestehendes `hasUnseenInitiative`-Gate bleibt unverändert.
- Produces: nichts Neues — `applyAuraState()` wird bereits von `refreshWorkspace` und vom Status-Abo (Task U-4) aufgerufen; Bereich W muss nur `setzeAgentStatus({zustand:'laeuft', …})` / `{zustand:'bereit'}` um seine `runTask`-Aufrufe legen, dann atmet die Aura automatisch echt.

- [ ] In `/Users/jakobschlenker/Documents/AI Writing Tool/app/src/workspace.js` die Funktion `applyAuraState` komplett ersetzen. Alt:
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
  Neu:
  ```js
  function applyAuraState() {
    const orb = elements().agentPresence
    if (!orb) return
    const workspace = activeWorkspace()
    // Quelle echt: Die Aura atmet nur, wenn wirklich ein Gateway-Task laeuft —
    // nicht mehr bloss, weil das Panel offen ist (die Attrappen-Quelle ist weg).
    const laeuft = aktuellerAgentStatus().zustand === 'laeuft'
    const unseen = hasUnseenInitiative(workspace)
    orb.classList.toggle('is-thinking', laeuft)
    orb.classList.toggle('is-quiet', !laeuft)
    orb.classList.toggle('has-unseen', unseen)
    orb.setAttribute(
      'aria-label',
      unseen ? 'Agentengespräch öffnen (neue Anmerkung)' : 'Agentengespräch öffnen',
    )
  }
  ```
- [ ] Verifizieren: `cd app && npm run build` — erwartet: Bundle baut ohne Fehler (Exit-Code 0).
- [ ] Verifizieren: `cd app && npm test` — erwartet: alle Suiten grün (46 alte + 13 neue aus U-1/U-2 = 59 Tests).
- [ ] Manuell verifizieren (Browser-Konsole): `AIWT`-Bundle geladen, Panel öffnen — erwartet: `#ondaAura` hat KEIN `is-thinking` mehr, solange kein Lauf aktiv ist; nach einem echten Lauf (oder testweise via Konsole simuliertem Statuswechsel durch Bereich-W-Code) erscheint `is-thinking` und verschwindet mit `{zustand:'bereit'}`; der Ungesehen-Punkt (`has-unseen`) verhält sich unverändert.
- [ ] Commit: `git add app/src/workspace.js && git commit -m "agent: Aura atmet nur bei echtem Gateway-Lauf — applyAuraState liest agent-status statt Panel-offen"`

---

## Bereich V — Verständnis-Interview

### Task V-1: Merge-Logik und Interview-Status als pure Funktionen (TDD)

**Files:**
- Modify: `app/src/reasoning-model.mjs` (~Zeile 1–32, `UNDERSTANDING_DEFAULTS` + `ensureProjectUnderstanding`; nach Inhalt suchen, Zeilennummern können verschoben sein)
- Test: `app/test/verstaendnis-merge.test.mjs` (neu)

**Interfaces:**
- Consumes: nichts aus anderen Bereichen (pures Modul).
- Produces:
  - `mergeVerstaendnis(alt, neu, geschuetzt = [], jetzt = Date.now()) -> neues Understanding-Objekt` (pur, `alt` bleibt unverändert; `neu` ist die KI-Antwort im VERSTAENDNIS_SCHEMA-Format inkl. `audience` als String)
  - `istInterviewOffen(understanding) -> bool` (abgeschlossen = `task` + `audience` + `desiredEffect` gefüllt)
  - `markiereGeschuetzt(understanding, feld) -> understanding` (setzt den Korrektur-Merker in `understanding.geschuetzt`)
  - `ensureProjectUnderstanding` normalisiert zusätzlich `understanding.geschuetzt` (additiv, tolerant, kein Schema-Bump)

**Merge-Regeln (bewusste Entscheidungen, im Test festgehalten):** Textfelder (`task`, `desiredEffect`, `evidenceStandard`) und `audience` werden NUR von nicht-leeren KI-Werten überschrieben; `audience` als Komma-String wird in die bestehende Listen-Form gesplittet. `protectedIntentions` werden vereinigt (die KI kann ergänzen, nie löschen). `openQuestions` sind die Lückenliste der KI und werden — als einzige Ausnahme — auch durch eine leere Liste ersetzt (beantwortete Lücken verschwinden), sofern das Feld in `neu` vorhanden ist. Felder in `geschuetzt` überschreibt die KI nie. `antwortText` wird nicht gemergt (das ist die Chat-Nachricht).

- [ ] Testdatei `app/test/verstaendnis-merge.test.mjs` komplett anlegen (RED):

```js
import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ensureProjectUnderstanding,
  istInterviewOffen,
  markiereGeschuetzt,
  mergeVerstaendnis,
} from '../src/reasoning-model.mjs'

function basisVerstaendnis() {
  return {
    task: 'Essay über Calm Technology',
    audience: ['Designerinnen'],
    desiredEffect: 'Prinzip verstehen',
    evidenceStandard: 'Primärquellen',
    protectedIntentions: ['Schlussformel erhalten'],
    openQuestions: ['Wissenschaftlich oder essayistisch?'],
    geschuetzt: [],
    updatedAt: 100,
  }
}

test('mergeVerstaendnis übernimmt nur nicht-leere Felder', () => {
  const alt = basisVerstaendnis()
  const neu = { task: 'Reportage über Stadtplanung', desiredEffect: '', evidenceStandard: '   ', antwortText: 'Verstanden.' }

  const ergebnis = mergeVerstaendnis(alt, neu, [], 200)

  assert.equal(ergebnis.task, 'Reportage über Stadtplanung')
  assert.equal(ergebnis.desiredEffect, 'Prinzip verstehen')
  assert.equal(ergebnis.evidenceStandard, 'Primärquellen')
  assert.equal(Object.hasOwn(ergebnis, 'antwortText'), false)
})

test('mergeVerstaendnis ist pur — das alte Objekt bleibt unverändert', () => {
  const alt = basisVerstaendnis()
  const schnappschuss = JSON.parse(JSON.stringify(alt))

  mergeVerstaendnis(alt, { task: 'Etwas ganz anderes' }, [], 200)

  assert.deepEqual(alt, schnappschuss)
})

test('mergeVerstaendnis splittet audience aus dem Schema-String in die Listen-Form', () => {
  const ergebnis = mergeVerstaendnis(basisVerstaendnis(), { audience: 'Studierende, Lehrende ' }, [], 200)
  assert.deepEqual(ergebnis.audience, ['Studierende', 'Lehrende'])
})

test('mergeVerstaendnis lässt audience bei leerem String unangetastet', () => {
  const ergebnis = mergeVerstaendnis(basisVerstaendnis(), { audience: '  ' }, [], 200)
  assert.deepEqual(ergebnis.audience, ['Designerinnen'])
})

test('mergeVerstaendnis überschreibt geschützte Felder nie', () => {
  const ergebnis = mergeVerstaendnis(
    basisVerstaendnis(),
    { task: 'Umgeschrieben', audience: 'Alle', desiredEffect: 'Anders' },
    ['task', 'audience'],
    200,
  )
  assert.equal(ergebnis.task, 'Essay über Calm Technology')
  assert.deepEqual(ergebnis.audience, ['Designerinnen'])
  assert.equal(ergebnis.desiredEffect, 'Anders')
})

test('mergeVerstaendnis vereinigt protectedIntentions ohne Duplikate', () => {
  const ergebnis = mergeVerstaendnis(
    basisVerstaendnis(),
    { protectedIntentions: ['Schlussformel erhalten', 'Ich-Perspektive behalten'] },
    [],
    200,
  )
  assert.deepEqual(ergebnis.protectedIntentions, ['Schlussformel erhalten', 'Ich-Perspektive behalten'])
})

test('mergeVerstaendnis ersetzt openQuestions auch durch eine leere Liste', () => {
  const ergebnis = mergeVerstaendnis(basisVerstaendnis(), { openQuestions: [] }, [], 200)
  assert.deepEqual(ergebnis.openQuestions, [])
})

test('mergeVerstaendnis behält openQuestions, wenn das Feld in neu fehlt', () => {
  const ergebnis = mergeVerstaendnis(basisVerstaendnis(), { task: 'Neu' }, [], 200)
  assert.deepEqual(ergebnis.openQuestions, ['Wissenschaftlich oder essayistisch?'])
})

test('mergeVerstaendnis setzt updatedAt nur bei tatsächlicher Änderung', () => {
  const unveraendert = mergeVerstaendnis(basisVerstaendnis(), { task: '' }, [], 200)
  const veraendert = mergeVerstaendnis(basisVerstaendnis(), { task: 'Neu' }, [], 200)
  assert.equal(unveraendert.updatedAt, 100)
  assert.equal(veraendert.updatedAt, 200)
})

test('istInterviewOffen erkennt fehlende Kernfelder', () => {
  assert.equal(istInterviewOffen(null), true)
  assert.equal(istInterviewOffen({ task: 'Essay', audience: [], desiredEffect: 'Wirken' }), true)
  assert.equal(istInterviewOffen({ task: 'Essay', audience: ['Leser'], desiredEffect: '' }), true)
  assert.equal(istInterviewOffen({ task: 'Essay', audience: ['Leser'], desiredEffect: 'Wirken' }), false)
})

test('markiereGeschuetzt setzt den Merker einmalig und ignoriert unbekannte Felder', () => {
  const u = { geschuetzt: [] }
  markiereGeschuetzt(u, 'task')
  markiereGeschuetzt(u, 'task')
  markiereGeschuetzt(u, 'gibtEsNicht')
  assert.deepEqual(u.geschuetzt, ['task'])
})

test('ensureProjectUnderstanding normalisiert geschuetzt tolerant', () => {
  const projekt = { understanding: { task: 'Essay', geschuetzt: 'kaputt' } }
  const u = ensureProjectUnderstanding(projekt)
  assert.deepEqual(u.geschuetzt, [])

  const projekt2 = { understanding: { geschuetzt: [' task ', ''] } }
  assert.deepEqual(ensureProjectUnderstanding(projekt2).geschuetzt, ['task'])
})
```

- [ ] RED belegen: `cd app && npm test` — erwartetes Ergebnis: die neue Suite schlägt fehl (`SyntaxError: The requested module '../src/reasoning-model.mjs' does not provide an export named 'istInterviewOffen'`), alle 5 Alt-Suiten (46 Tests) bleiben grün.
- [ ] In `app/src/reasoning-model.mjs` direkt nach der bestehenden Funktion `ensureProjectUnderstanding` (nach Inhalt `project.understanding = current` suchen) die neuen Exporte einfügen:

```js
const GESCHUETZT_FELDER = Object.freeze([
  'task', 'audience', 'desiredEffect', 'evidenceStandard', 'protectedIntentions', 'openQuestions',
])

function textOderLeer(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function istInterviewOffen(understanding) {
  if (!understanding || typeof understanding !== 'object') return true
  const task = textOderLeer(understanding.task)
  const effect = textOderLeer(understanding.desiredEffect)
  const audience = cleanList(understanding.audience)
  return !(task && effect && audience.length)
}

export function markiereGeschuetzt(understanding, feld) {
  if (!understanding || typeof understanding !== 'object') return understanding
  if (!GESCHUETZT_FELDER.includes(feld)) return understanding
  if (!Array.isArray(understanding.geschuetzt)) understanding.geschuetzt = []
  if (!understanding.geschuetzt.includes(feld)) understanding.geschuetzt.push(feld)
  return understanding
}

// Pur: mischt eine KI-Antwort (VERSTAENDNIS_SCHEMA) in ein bestehendes Understanding.
// Nur nicht-leere Felder überschreiben; geschützte Felder (Nutzer-Korrekturen) nie.
// Ausnahme openQuestions: die Lückenliste der KI ersetzt die alte auch durch leer,
// damit beantwortete Lücken verschwinden. protectedIntentions werden vereinigt.
export function mergeVerstaendnis(alt, neu, geschuetzt = [], jetzt = Date.now()) {
  const basis = alt && typeof alt === 'object' ? alt : {}
  const eingehend = neu && typeof neu === 'object' ? neu : {}
  const gesperrt = new Set(cleanList(geschuetzt))

  const ergebnis = {
    ...basis,
    task: textOderLeer(basis.task),
    audience: cleanList(basis.audience),
    desiredEffect: textOderLeer(basis.desiredEffect),
    evidenceStandard: textOderLeer(basis.evidenceStandard),
    protectedIntentions: cleanList(basis.protectedIntentions),
    openQuestions: cleanList(basis.openQuestions),
    geschuetzt: cleanList(basis.geschuetzt),
    updatedAt: Number.isFinite(basis.updatedAt) ? basis.updatedAt : null,
  }
  delete ergebnis.antwortText
  let geaendert = false

  const uebernimmText = feld => {
    if (gesperrt.has(feld)) return
    const wert = textOderLeer(eingehend[feld])
    if (wert && wert !== ergebnis[feld]) { ergebnis[feld] = wert; geaendert = true }
  }
  uebernimmText('task')
  uebernimmText('desiredEffect')
  uebernimmText('evidenceStandard')

  if (!gesperrt.has('audience')) {
    const roh = eingehend.audience
    const liste = Array.isArray(roh) ? cleanList(roh) : cleanList(String(roh || '').split(','))
    if (liste.length && JSON.stringify(liste) !== JSON.stringify(ergebnis.audience)) {
      ergebnis.audience = liste
      geaendert = true
    }
  }

  if (!gesperrt.has('protectedIntentions')) {
    const zugaenge = cleanList(eingehend.protectedIntentions)
      .filter(eintrag => !ergebnis.protectedIntentions.includes(eintrag))
    if (zugaenge.length) {
      ergebnis.protectedIntentions = [...ergebnis.protectedIntentions, ...zugaenge]
      geaendert = true
    }
  }

  if (!gesperrt.has('openQuestions') && Array.isArray(eingehend.openQuestions)) {
    const liste = cleanList(eingehend.openQuestions)
    if (JSON.stringify(liste) !== JSON.stringify(ergebnis.openQuestions)) {
      ergebnis.openQuestions = liste
      geaendert = true
    }
  }

  if (geaendert) ergebnis.updatedAt = jetzt
  return ergebnis
}
```

- [ ] In `ensureProjectUnderstanding` (~Zeile 27–29, nach Inhalt suchen) die `geschuetzt`-Normalisierung ergänzen — aus

```js
  current.audience = cleanList(current.audience)
  current.protectedIntentions = cleanList(current.protectedIntentions)
  current.openQuestions = cleanList(current.openQuestions)
```

wird

```js
  current.audience = cleanList(current.audience)
  current.protectedIntentions = cleanList(current.protectedIntentions)
  current.openQuestions = cleanList(current.openQuestions)
  current.geschuetzt = cleanList(current.geschuetzt)
```

- [ ] GREEN belegen: `cd app && npm test` — erwartetes Ergebnis: 6 Suiten, alle Tests grün (46 alte + 12 neue), keine Failures.
- [ ] Commit: `git add app/src/reasoning-model.mjs app/test/verstaendnis-merge.test.mjs && git commit -m "verstaendnis: Merge-Logik, Interview-Status und geschuetzt-Merker als pure Funktionen (TDD)"`

---

### Task V-2: Interview-Zustand am Projekt — Eröffnungsfrage und Entwurf aus Text

**Files:**
- Modify: `app/src/workspace.js` (Imports ~Zeile 1–18; Modul-Zustand ~Zeile 64; neuer Interview-Block nach `openProjectUnderstandingModal` ~Zeile 677; `renderAgentWidget` ~Zeile 1628; `refreshWorkspace` ~Zeile 1955; `instance.destroy` ~Zeile 2210 — überall nach Inhalt suchen, Zeilennummern können verschoben sein)
- Modify: `app/src/style.css` (~Zeile 2117, Regel `.agent-widget-empty`; nach Inhalt suchen)

**Interfaces:**
- Consumes: `runTask(taskName, eingabe, optionen)` und `hatSchluessel()` aus `app/src/agent-gateway.mjs` (Bereich G); Fehler-Objekte `{typ, nachricht}`; `daten` im VERSTAENDNIS_SCHEMA-Format `{task, audience, desiredEffect, evidenceStandard, protectedIntentions, openQuestions, antwortText}` (Bereich T); `EXAMPLE_PROJECT_ID` aus `app/src/example-seed.mjs`; `mergeVerstaendnis`, `istInterviewOffen` aus V-1.
- Produces:
  - **Eingabe-Konvention für `runTask('verstaendnis', eingabe)`** (verbindlich für Bereich T beim Prompt-Bau): `eingabe = { modus: 'entwurf'|'antwort', verstaendnis: {task, audience, desiredEffect, evidenceStandard, protectedIntentions, openQuestions}, geschuetzt: string[], docText: string, nutzerText: string, interviewVerlauf: [{role:'user'|'agent', text}] }`
  - `refreshProjectUnderstandingModal()` (workspace.js-intern, auch von V-3/V-4 genutzt)
  - Modul-Zustand `interviewLaufAktiv`, `interviewStatus` (von V-3 genutzt)

- [ ] Imports erweitern — aus Zeile 2 (nach Inhalt suchen)

```js
import { decideFinding, ensureProjectUnderstanding, getFindingQueue, isIntegrityCategory } from './reasoning-model.mjs'
```

wird

```js
import { decideFinding, ensureProjectUnderstanding, getFindingQueue, isIntegrityCategory, istInterviewOffen, mergeVerstaendnis } from './reasoning-model.mjs'
```

und nach `import { applySettings } from './ui.js'` (~Zeile 18) ergänzen:

```js
import { hatSchluessel, runTask } from './agent-gateway.mjs'
import { EXAMPLE_PROJECT_ID } from './example-seed.mjs'
```

- [ ] Modul-Zustand ergänzen — nach `let accentMenu = null` (~Zeile 64, nach Inhalt suchen) einfügen:

```js
// Verständnis-Interview: einmal je Projekt+Dokument prüfen, genau ein Lauf gleichzeitig.
let interviewPruefKey = null
let interviewLaufAktiv = false
let interviewStatus = null // null | 'laeuft' | ruhiger Fehlertext für die Statuszeile
```

- [ ] Den kompletten Interview-Block nach dem Ende von `openProjectUnderstandingModal` und vor `function scheduleTriggerRender()` (~Zeile 679, nach Inhalt suchen) einfügen:

```js
// ---------- Verständnis-Interview (Etappe A, Fähigkeit 1) ----------
// Neues Projekt: der Agent eröffnet mit genau EINER gebündelten offenen Frage
// (fester Text, kein API-Aufruf). Existiert schon Text (> 200 Zeichen), leitet
// er stattdessen per runTask('verstaendnis') einen Entwurf aus dem Text ab.
// Das Beispielprojekt bleibt Demo: dort startet nie ein Interview.
const INTERVIEW_EROEFFNUNG = 'Bevor ich beim Schreiben helfen kann, würde ich das Projekt gern verstehen: Worum soll es in diesem Text gehen — und für wen schreibst du ihn?'
const INTERVIEW_ENTWURF_MIN_ZEICHEN = 200
const INTERVIEW_OFFLINE_TEXT = 'Agent ist offline — dein Text ist davon unberührt.'

function istBeispielProjekt(project) {
  return Boolean(project && (project.id === EXAMPLE_PROJECT_ID || project.example === true))
}

function interviewMessageId(project) {
  return `interview-${project.id}`
}

function docPlainText() {
  return getEditorBlocks(ctx.editor)
    .map(block => String(block.text || '').trim())
    .filter(Boolean)
    .join('\n\n')
}

export function istInterviewAktiv() {
  const project = ctx?.activeProjectObj()
  if (!project || istBeispielProjekt(project)) return false
  return istInterviewOffen(ensureProjectUnderstanding(project))
}

function ensureInterviewMessage(workspace, project) {
  const id = interviewMessageId(project)
  let message = workspace.agent.messages.find(candidate => candidate.id === id)
  if (!message) {
    message = { id, status: 'new', earliestAt: 0, text: '', thread: [] }
    workspace.agent.messages.push(message)
  }
  return message
}

function verstaendnisEingabe(modus, nutzerText = '') {
  const project = ctx.activeProjectObj()
  const u = ensureProjectUnderstanding(project)
  const workspace = activeWorkspace()
  const message = workspace?.agent.messages.find(candidate => candidate.id === interviewMessageId(project)) || null
  return {
    modus,
    verstaendnis: {
      task: u.task,
      audience: u.audience,
      desiredEffect: u.desiredEffect,
      evidenceStandard: u.evidenceStandard,
      protectedIntentions: u.protectedIntentions,
      openQuestions: u.openQuestions,
    },
    geschuetzt: [...(u.geschuetzt || [])],
    docText: docPlainText(),
    nutzerText,
    interviewVerlauf: (message?.thread || []).map(entry => ({ role: entry.role, text: entry.text })),
  }
}

function interviewFehlerText(fehler) {
  const typ = fehler?.typ
  if (typ === 'kein-schluessel' || typ === 'offline') return INTERVIEW_OFFLINE_TEXT
  if (typ === 'ratenlimit' || typ === 'ueberlastet') return 'Der Agent ist gerade überlastet — er meldet sich, sobald es wieder geht.'
  if (typ === 'abgelehnt') return 'Der Agent hat auf diese Anfrage keine Antwort gegeben.'
  return 'Die Antwort des Agenten ist verloren gegangen. Deine Angaben sind gespeichert — versuch es gleich noch einmal.'
}

// Merged eine KI-Antwort in das Understanding, OHNE die Objekt-Identität zu
// brechen (offene Modal-Closures schreiben weiter in dasselbe Objekt).
function uebernimmVerstaendnis(project, daten) {
  const u = ensureProjectUnderstanding(project)
  Object.assign(u, mergeVerstaendnis(u, daten, u.geschuetzt))
  return u
}

function refreshProjectUnderstandingModal() {
  if (!ondaDialog || ondaDialog.panel?.id !== 'pvModal') return
  // Tippt der Nutzer gerade im Modal, nicht neu aufbauen — seine Eingabe ist bindend.
  if (ondaDialog.panel.contains(document.activeElement)) return
  openProjectUnderstandingModal(ondaDialog.opener)
}

function pruefeVerstaendnisInterview() {
  const doc = ctx?.activeDoc()
  const project = ctx?.activeProjectObj()
  const workspace = activeWorkspace()
  if (!doc || !project || !workspace) return
  const pruefKey = `${project.id}:${doc.id}`
  if (interviewPruefKey === pruefKey) return
  interviewPruefKey = pruefKey
  if (istBeispielProjekt(project)) return
  if (!istInterviewOffen(ensureProjectUnderstanding(project))) return
  if (workspace.agent.messages.some(message => message.id === interviewMessageId(project))) return

  if (docPlainText().length > INTERVIEW_ENTWURF_MIN_ZEICHEN) {
    starteVerstaendnisEntwurf(project.id, doc.id)
    return
  }
  const message = ensureInterviewMessage(workspace, project)
  message.text = INTERVIEW_EROEFFNUNG
  persistWorkspace()
}

async function starteVerstaendnisEntwurf(projectId, docId) {
  if (interviewLaufAktiv) return
  interviewLaufAktiv = true
  interviewStatus = 'laeuft'
  try {
    const schluesselDa = await hatSchluessel()
    if (!ctx || ctx.activeDoc()?.id !== docId) { interviewStatus = null; return }
    const project = ctx.state.projects.find(candidate => candidate.id === projectId)
    const workspace = activeWorkspace()
    if (!project || !workspace) { interviewStatus = null; return }
    if (!schluesselDa) {
      // Offline-Würde: kein Entwurf möglich — die feste Eröffnungsfrage steht
      // trotzdem bereit; die Antwort darauf scheitert später ruhig per Statuszeile.
      interviewStatus = null
      const message = ensureInterviewMessage(workspace, project)
      if (!message.text) message.text = INTERVIEW_EROEFFNUNG
      persistWorkspace()
      return
    }
    const { daten } = await runTask('verstaendnis', verstaendnisEingabe('entwurf'))
    if (!ctx) return
    uebernimmVerstaendnis(project, daten)
    interviewStatus = null
    const antwort = String(daten.antwortText || '').trim()
    if (antwort && ctx.activeDoc()?.id === docId) {
      const message = ensureInterviewMessage(activeWorkspace(), project)
      message.text = antwort
      appendThreadMessage(message.thread, 'agent', antwort, Date.now())
      announceAgentStatus(antwort)
    }
    ctx.persist()
    refreshProjectUnderstandingModal()
  } catch (fehler) {
    interviewStatus = interviewFehlerText(fehler)
  } finally {
    interviewLaufAktiv = false
    if (ctx) refreshWorkspace()
  }
}
```

- [ ] Statuszeile im Agenten-Panel rendern — in `renderAgentWidget` (~Zeile 1628, nach Inhalt suchen) aus

```js
  ui.agentWidget.append(messages, form)
```

wird

```js
  ui.agentWidget.append(messages)
  if (interviewStatus) {
    ui.agentWidget.append(createNode(
      'p',
      'agent-widget-status',
      interviewStatus === 'laeuft' ? 'Agent denkt nach …' : interviewStatus,
    ))
  }
  ui.agentWidget.append(form)
```

- [ ] Interview-Prüfung in den Render-Zyklus hängen — in `refreshWorkspace` (~Zeile 1955, nach Inhalt suchen) aus

```js
  renderStructureNav()
  renderProjectUnderstandingCard()
```

wird

```js
  pruefeVerstaendnisInterview()
  renderStructureNav()
  renderProjectUnderstandingCard()
```

- [ ] Aufräumen beim Zerstören — in `instance.destroy` (~Zeile 2209–2210, nach Inhalt suchen) aus

```js
    agentLiveFrame = null
    agentPresenceFocusRequest = false
  }
```

wird

```js
    agentLiveFrame = null
    agentPresenceFocusRequest = false
    interviewPruefKey = null
    interviewLaufAktiv = false
    interviewStatus = null
  }
```

- [ ] CSS für die Statuszeile — in `app/src/style.css` nach der Regel `.agent-widget-empty, .evidence-empty { … }` (~Zeile 2117–2123, nach Inhalt suchen) einfügen:

```css
.agent-widget-status {
  margin: 0;
  padding: 0 16px 12px;
  color: var(--text-tertiary);
  font: italic 12px/1.5 var(--sans);
}
```

- [ ] Verifizieren: `cd app && npm test` — erwartetes Ergebnis: alle Suiten grün (workspace.js wird von den node-Suiten nicht importiert, nichts bricht). Danach `cd app && npm run build` — erwartetes Ergebnis: Bundle baut fehlerfrei (setzt voraus, dass `app/src/agent-gateway.mjs` aus Bereich G bereits existiert).
- [ ] Commit: `git add app/src/workspace.js app/src/style.css && git commit -m "verstaendnis: Interview-Eroeffnung und Entwurf aus Text im Agenten-Panel"`

---

### Task V-3: Composer-Routing — Interview-Antworten füllen das Verständnis live

**Files:**
- Modify: `app/src/workspace.js` (Submit-Handler in `renderAgentWidget` ~Zeile 1610–1627; neue Funktion `sendeInterviewAntwort` direkt nach `starteVerstaendnisEntwurf` — nach Inhalt suchen, Zeilennummern können verschoben sein)

**Interfaces:**
- Consumes: `runTask` (Bereich G, wie V-2); `mergeVerstaendnis` (V-1); `verstaendnisEingabe`, `interviewFehlerText`, `uebernimmVerstaendnis`, `refreshProjectUnderstandingModal`, `interviewLaufAktiv`, `interviewStatus` (V-2).
- Produces: `istInterviewAktiv() -> bool` (bereits in V-2 exportiert) als Routing-Weiche für **Bereich C**: solange `istInterviewAktiv()` wahr ist, gehört der Composer dem Interview; der markierte Kulissen-Zweig im Submit-Handler ist die exakte Stelle, die Bereich C durch den echten Chat ersetzt.

- [ ] Neue Funktion `sendeInterviewAntwort` direkt nach `starteVerstaendnisEntwurf` (nach Inhalt `finally {` … `if (ctx) refreshWorkspace()` der Entwurfs-Funktion suchen) einfügen:

```js
async function sendeInterviewAntwort(message, text) {
  const project = ctx?.activeProjectObj()
  if (!project || interviewLaufAktiv) return
  appendThreadMessage(message.thread, 'user', text, Date.now())
  interviewLaufAktiv = true
  interviewStatus = 'laeuft'
  announceAgentStatus('Agent denkt nach …')
  persistWorkspace()
  refreshWorkspace()
  try {
    const { daten } = await runTask('verstaendnis', verstaendnisEingabe('antwort', text))
    if (!ctx) return
    uebernimmVerstaendnis(project, daten)
    interviewStatus = null
    const antwort = String(daten.antwortText || '').trim()
    if (antwort) {
      appendThreadMessage(message.thread, 'agent', antwort, Date.now())
      message.text = antwort
      announceAgentStatus(antwort)
    }
    // Sind task + audience + desiredEffect jetzt gefüllt, ist das Interview
    // abgeschlossen — der nächste Composer-Beitrag geht in den normalen Chat.
    ctx.persist()
    refreshProjectUnderstandingModal()
  } catch (fehler) {
    interviewStatus = interviewFehlerText(fehler)
    announceAgentStatus(interviewStatus)
  } finally {
    interviewLaufAktiv = false
    if (ctx) refreshWorkspace()
  }
}
```

- [ ] Submit-Handler in `renderAgentWidget` umbauen — aus (~Zeile 1610–1627, nach Inhalt suchen)

```js
  form.addEventListener('submit', event => {
    event.preventDefault()
    const text = input.value.trim()
    if (!text) return
    const at = Date.now()
    appendThreadMessage(message.thread, 'user', text, at)
    const reply = 'Beispielreaktion: Dann behandle ich Aufmerksamkeit im weiteren Text als gestaltete Bedingung und prüfe, wo die Formulierung noch beim Individuum bleibt.'
    appendThreadMessage(
      message.thread,
      'agent',
      reply,
      at + 1,
    )
    input.value = ''
    announceAgentStatus(reply)
    ctx.persist()
    refreshWorkspace()
  })
```

wird

```js
  form.addEventListener('submit', event => {
    event.preventDefault()
    const text = input.value.trim()
    if (!text) return
    if (istInterviewAktiv()) {
      if (interviewLaufAktiv) return // ein Lauf zur Zeit; die Eingabe bleibt stehen
      input.value = ''
      sendeInterviewAntwort(message, text)
      return
    }
    // Kulissen-Zweig (Demo-Chat): wird in Bereich C durch den echten,
    // gestreamten Chat ersetzt. Bis dahin bleibt das bisherige Verhalten.
    const at = Date.now()
    appendThreadMessage(message.thread, 'user', text, at)
    const reply = 'Beispielreaktion: Dann behandle ich Aufmerksamkeit im weiteren Text als gestaltete Bedingung und prüfe, wo die Formulierung noch beim Individuum bleibt.'
    appendThreadMessage(
      message.thread,
      'agent',
      reply,
      at + 1,
    )
    input.value = ''
    announceAgentStatus(reply)
    ctx.persist()
    refreshWorkspace()
  })
```

- [ ] Verifizieren: `cd app && npm test` — erwartetes Ergebnis: alle Suiten grün. `cd app && npm run build` — erwartetes Ergebnis: Bundle baut fehlerfrei. Sichtprüfung im Browser (`app/index.html` mit gebautem Bundle, Dev-Schlüssel in `localStorage 'aiwt.apikey'`): neues Projekt anlegen → Eröffnungsfrage erscheint im Agenten-Panel → Antwort in 1–2 Sätzen tippen → PV-Karte füllt sich sichtbar, Agenten-Nachfrage erscheint; im Beispielprojekt (`Beispiel: Calm Technology`) erscheint KEINE Eröffnungsfrage und der Kulissen-Zweig antwortet unverändert.
- [ ] Commit: `git add app/src/workspace.js && git commit -m "verstaendnis: Composer-Routing — Interview-Antworten fuellen das Projektverstaendnis live"`

---

### Task V-4: Modal-Korrekturen sind bindend — geschuetzt-Merker je Feld

**Files:**
- Modify: `app/src/workspace.js` (`openProjectUnderstandingModal` ~Zeile 664–677; Import-Zeile 2 — nach Inhalt suchen, Zeilennummern können verschoben sein)

**Interfaces:**
- Consumes: `markiereGeschuetzt` (V-1).
- Produces: nichts Neues — jede Nutzer-Korrektur im PV-Modal setzt `understanding.geschuetzt[feld]`; `mergeVerstaendnis` (V-1) respektiert das in allen Folge-Läufen, und `verstaendnisEingabe` (V-2) gibt die Liste dem Modell mit.

- [ ] Import ergänzen — aus Zeile 2 (nach Inhalt suchen)

```js
import { decideFinding, ensureProjectUnderstanding, getFindingQueue, isIntegrityCategory, istInterviewOffen, mergeVerstaendnis } from './reasoning-model.mjs'
```

wird

```js
import { decideFinding, ensureProjectUnderstanding, getFindingQueue, isIntegrityCategory, istInterviewOffen, markiereGeschuetzt, mergeVerstaendnis } from './reasoning-model.mjs'
```

- [ ] `openProjectUnderstandingModal` komplett ersetzen — aus (~Zeile 664–677, nach Inhalt suchen)

```js
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

wird

```js
function openProjectUnderstandingModal(opener) {
  const project = ctx.activeProjectObj()
  if (!project) return
  const u = ensureProjectUnderstanding(project)
  // Jede Nutzer-Korrektur ist bindend: der geschuetzt-Merker sorgt dafür,
  // dass die KI dieses Feld in Folge-Läufen nie mehr überschreibt (mergeVerstaendnis).
  const commit = feld => {
    markiereGeschuetzt(u, feld)
    ctx.scheduleSave()
    renderProjectUnderstandingCard()
  }
  openOndaDialog({ id: 'pvModal', title: 'Projektverständnis', opener, build: body => {
    understandingField(body, 'Aufgabe', u.task, value => { u.task = value; commit('task') })
    understandingField(body, 'Zielgruppe', u.audience.join(', '), value => { u.audience = splitList(value, false); commit('audience') })
    understandingField(body, 'Beabsichtigte Wirkung', u.desiredEffect, value => { u.desiredEffect = value; commit('desiredEffect') })
    understandingField(body, 'Belegstandard', u.evidenceStandard, value => { u.evidenceStandard = value; commit('evidenceStandard') })
    understandingField(body, 'Geschützte Absicht', u.protectedIntentions.join('\n'), value => { u.protectedIntentions = splitList(value, true); commit('protectedIntentions') }, { line: true })
    understandingField(body, 'Offene Frage', u.openQuestions.join('\n'), value => { u.openQuestions = splitList(value, true); commit('openQuestions') }, { line: true })
  }})
}
```

- [ ] Verifizieren: `cd app && npm test` — erwartetes Ergebnis: alle Suiten grün. `cd app && npm run build` — Bundle baut fehlerfrei. Sichtprüfung: im laufenden Interview ein Feld im PV-Modal korrigieren (z. B. Aufgabe umformulieren), Modal schließen, weitere Interview-Antwort senden → die Korrektur bleibt exakt erhalten (Abnahmekriterium 2 der Spec: „Modal-Korrektur wird in Folge-Antworten respektiert").
- [ ] Commit: `git add app/src/workspace.js && git commit -m "verstaendnis: Modal-Korrekturen sind bindend — geschuetzt-Merker je Feld"`

---

## Bereich H — Echte Hinweis-Läufe

### Task H-1: Pure Umwandlung KI-Hinweis → Finding (agent-findings.mjs, TDD)

**Files:**
- Create: `app/src/agent-findings.mjs`
- Test: `app/test/agent-findings.test.mjs`

**Interfaces:**
- Consumes: bestehende Kategorie-Strings aus `app/src/reasoning-model.mjs` (`INTEGRITY_CATEGORIES` = `'fact','source','citation','method','logic'`; `normalizeFinding`: passage + `kind:'form'` → `'wording'`, sonst `'content'`; `coachCategory` liefert u. a. `'structure'`) — nur als abgeleitete Konstante, kein Laufzeit-Import im Produktionsmodul. Finding-Form aus `example.js` `buildExampleLane` (Felder `id/kind/form/status/target/short/why/action/variants`).
- Produces (für H-2, H-3 und Bereich A):
  - `KATEGORIE_ZU_CATEGORY` — festgeschriebenes Mapping deutsch-8 → bestehende Kategorie-Strings: `fakt→'fact'`, `quelle→'source'`, `methode→'method'`, `logik→'logic'`, `struktur→'structure'`, `wirkung→'content'`, `erklaerung→'content'`, `sprache→'wording'`.
  - `baueDocText(blocks) -> string` (Trenner `'\n\n'` — dieselbe Textbasis für Anfrage UND `findeAnker`).
  - `blockFuerAnkerIndex(blocks, index) -> string|null`.
  - `hinweisZuFinding(hinweis, ankerErgebnis, blockId, jetzt = Date.now()) -> Finding|null`.
  - `fasseEntscheidungenZusammen(findings, decisions)` und `fasseOffeneHinweiseZusammen(findings)` (Volatiles für den Lauf).
  - **Vertragszusage an Bereich A:** jedes KI-Finding trägt `target` (= `anker`) und `kiKategorie` (deutscher Enum-Wert) — `dedupeHinweise` vergleicht `hinweis.anker === finding.target && hinweis.kategorie === finding.kiKategorie`.

- [ ] Testdatei `app/test/agent-findings.test.mjs` KOMPLETT anlegen (RED zuerst):

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  KATEGORIE_ZU_CATEGORY,
  baueDocText,
  blockFuerAnkerIndex,
  fasseEntscheidungenZusammen,
  fasseOffeneHinweiseZusammen,
  hinweisZuFinding,
} from '../src/agent-findings.mjs'
import { decideFinding, ensureReasoningModel, getFindingQueue, isIntegrityCategory } from '../src/reasoning-model.mjs'

const ankerGefunden = { gefunden: true, index: 0, normalisiert: false }

function beispielHinweis(extra = {}) {
  return {
    kategorie: 'logik',
    anker: 'jede Unterbrechung schadet dem Denken',
    beobachtung: 'Die These ist absolut formuliert.',
    relevanz: 'Absolute Thesen sind leicht angreifbar.',
    folge: 'Ein einziges Gegenbeispiel entkräftet den Absatz.',
    vorschlag: null,
    istGrundursache: false,
    integritaet: true,
    ...extra,
  }
}

test('Kategorie-Mapping deckt alle 8 deutschen Kategorien ab und trifft die Integritätsregel', () => {
  assert.deepEqual(Object.keys(KATEGORIE_ZU_CATEGORY).sort(), [
    'erklaerung', 'fakt', 'logik', 'methode', 'quelle', 'sprache', 'struktur', 'wirkung',
  ])
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.fakt), true)
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.quelle), true)
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.methode), true)
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.logik), true)
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.struktur), false)
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.wirkung), false)
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.erklaerung), false)
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.sprache), false)
})

test('hinweisZuFinding liefert ein Finding in exakt der bestehenden Passage-Form', () => {
  const finding = hinweisZuFinding(beispielHinweis(), ankerGefunden, 'b-eins', 1000)
  assert.equal(finding.placement, 'passage')
  assert.equal(finding.status, 'open')
  assert.equal(finding.target, 'jede Unterbrechung schadet dem Denken')
  assert.equal(finding.short, 'Die These ist absolut formuliert.')
  assert.equal(finding.why, 'Absolute Thesen sind leicht angreifbar.')
  assert.equal(finding.folge, 'Ein einziges Gegenbeispiel entkräftet den Absatz.')
  assert.equal(finding.category, 'logic')
  assert.equal(finding.kiKategorie, 'logik')
  assert.equal(finding.kind, 'inhalt')
  assert.equal(finding.form, 'note')
  assert.equal(finding.blockId, 'b-eins')
  assert.equal(finding.createdAt, 1000)
  assert.deepEqual(finding.sources, [])
  assert.deepEqual(finding.variants, [])
  assert.equal(finding.action, '')
  assert.ok(finding.id.startsWith('ki-'))
})

test('Vorschlag innerhalb des Ankers wird zur Markierung mit anwendbarer Neufassung', () => {
  const finding = hinweisZuFinding(beispielHinweis({
    kategorie: 'sprache',
    anker: 'fragmentieren die Aufmerksamkeit spürbar',
    vorschlag: { bisher: 'fragmentieren', neu: 'zerteilen' },
    integritaet: false,
  }), ankerGefunden, 'b-eins', 1000)
  assert.equal(finding.kind, 'form')
  assert.equal(finding.category, 'wording')
  assert.equal(finding.form, 'mark')
  assert.equal(finding.action, 'zerteilen die Aufmerksamkeit spürbar')
  assert.deepEqual(finding.variants, ['zerteilen die Aufmerksamkeit spürbar'])
})

test('Vorschlag ohne wortgleiches bisher im Anker wird still verworfen — Hinweis bleibt als Notiz', () => {
  const finding = hinweisZuFinding(beispielHinweis({
    vorschlag: { bisher: 'kommt im Anker nicht vor', neu: 'egal' },
  }), ankerGefunden, 'b-eins', 1000)
  assert.equal(finding.action, '')
  assert.deepEqual(finding.variants, [])
  assert.equal(finding.form, 'note')
})

test('Integritätshinweise erhalten die zu belegende Aussage als claim, andere nicht', () => {
  const integritaet = hinweisZuFinding(beispielHinweis({ kategorie: 'fakt' }), ankerGefunden, 'b-eins', 1000)
  const stil = hinweisZuFinding(beispielHinweis({ kategorie: 'wirkung', integritaet: false }), ankerGefunden, 'b-eins', 1000)
  assert.equal(integritaet.claim, integritaet.target)
  assert.equal(stil.claim, undefined)
})

test('nicht gefundener Anker und leerer Anker liefern null', () => {
  assert.equal(hinweisZuFinding(beispielHinweis(), { gefunden: false, index: null, normalisiert: false }, 'b-eins'), null)
  assert.equal(hinweisZuFinding(beispielHinweis({ anker: '' }), ankerGefunden, 'b-eins'), null)
})

test('baueDocText und blockFuerAnkerIndex bilden Anker-Fundstellen auf Bausteine ab', () => {
  const blocks = [
    { id: 'b-eins', text: 'Erster Absatz.' },
    { id: 'b-zwei', text: 'Zweiter Absatz mit Anker.' },
  ]
  const docText = baueDocText(blocks)
  assert.equal(docText, 'Erster Absatz.\n\nZweiter Absatz mit Anker.')
  assert.equal(blockFuerAnkerIndex(blocks, docText.indexOf('Erster')), 'b-eins')
  assert.equal(blockFuerAnkerIndex(blocks, docText.indexOf('Anker')), 'b-zwei')
  assert.equal(blockFuerAnkerIndex(blocks, docText.length + 5), null)
  assert.equal(blockFuerAnkerIndex(blocks, -1), null)
  assert.equal(blockFuerAnkerIndex(blocks, null), null)
})

test('Grundursache wird high priorisiert und parkt Geschwister über rootCauseId in der bestehenden Queue', () => {
  const grundursache = hinweisZuFinding(beispielHinweis({ istGrundursache: true }), ankerGefunden, 'b-eins', 1000)
  const folgehinweis = hinweisZuFinding(beispielHinweis({
    kategorie: 'struktur', anker: 'anderer Anker im Text', integritaet: false,
  }), ankerGefunden, 'b-zwei', 1001)
  folgehinweis.rootCauseId = grundursache.id
  assert.equal(grundursache.priority, 'high')
  assert.equal(grundursache.istGrundursache, true)
  const doc = ensureReasoningModel({ findings: [folgehinweis, grundursache], decisions: [] })
  const queue = getFindingQueue(doc)
  assert.equal(queue.current.id, grundursache.id)
  assert.deepEqual(queue.parked.map(finding => finding.id), [folgehinweis.id])
})

test('fasseEntscheidungenZusammen und fasseOffeneHinweiseZusammen trennen entschieden und offen', () => {
  const entschieden = hinweisZuFinding(beispielHinweis({ kategorie: 'quelle' }), ankerGefunden, 'b-eins', 1000)
  const offen = hinweisZuFinding(beispielHinweis({ kategorie: 'struktur', anker: 'offener Anker', integritaet: false }), ankerGefunden, 'b-zwei', 1001)
  const doc = ensureReasoningModel({ findings: [entschieden, offen], decisions: [] })
  decideFinding(doc, entschieden.id, { kind: 'reject', reason: 'Quelle folgt später.' }, 2000)

  const entscheidungen = fasseEntscheidungenZusammen(doc.findings, doc.decisions)
  assert.deepEqual(entscheidungen, [{
    anker: 'jede Unterbrechung schadet dem Denken',
    kategorie: 'quelle',
    kurz: 'Die These ist absolut formuliert.',
    entscheidung: 'risk-accepted',
    begruendung: 'Quelle folgt später.',
  }])
  const offene = fasseOffeneHinweiseZusammen(doc.findings)
  assert.deepEqual(offene, [{
    anker: 'offener Anker',
    kategorie: 'struktur',
    kurz: 'Die These ist absolut formuliert.',
  }])
})
```

- [ ] RED belegen: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && node --test test/agent-findings.test.mjs` — erwartet: Fehlschlag mit `Cannot find module .../src/agent-findings.mjs` (Ausgabe als TDD-Beleg festhalten).
- [ ] `app/src/agent-findings.mjs` KOMPLETT anlegen:

```js
// Reine Umwandlung: KI-Hinweise (deutsches 8-Kategorien-Schema aus HINWEISE_SCHEMA)
// -> Findings in exakt der bestehenden Form (Vorbild: example.js buildExampleLane,
// Normalisierung: reasoning-model.mjs normalizeFinding). Kein DOM, node-testbar.

// Mapping abgeleitet aus dem bestehenden Code (reasoning-model.mjs):
// INTEGRITY_CATEGORIES = fact/source/citation/method/logic; Passage-Findings mit
// kind 'form' tragen 'wording', inhaltliche 'content'; Struktur bleibt 'structure'.
export const KATEGORIE_ZU_CATEGORY = Object.freeze({
  fakt: 'fact',
  quelle: 'source',
  methode: 'method',
  logik: 'logic',
  struktur: 'structure',
  wirkung: 'content',
  erklaerung: 'content',
  sprache: 'wording',
})

const INTEGRITAETS_KATEGORIEN = new Set(['fakt', 'quelle', 'methode', 'logik'])
const TRENNER = '\n\n'

function einfacherHash(value) {
  let hash = 2166136261
  const text = String(value || '')
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

// Dieselbe Textbasis für die Anfrage an das Modell UND für findeAnker —
// nur so zeigen Anker-Indizes auf dieselben Stellen.
export function baueDocText(blocks) {
  return (blocks || []).map(block => String(block.text || '')).join(TRENNER)
}

// Bildet einen Fundstellen-Index aus baueDocText auf den Baustein ab.
// Indizes im Trennerbereich fallen dem folgenden Baustein zu.
export function blockFuerAnkerIndex(blocks, index) {
  if (!Number.isInteger(index) || index < 0) return null
  let offset = 0
  for (const block of blocks || []) {
    const text = String(block.text || '')
    if (index < offset + text.length) return block.id || null
    offset += text.length + TRENNER.length
  }
  return null
}

export function hinweisZuFinding(hinweis, ankerErgebnis, blockId, jetzt = Date.now()) {
  if (!hinweis || ankerErgebnis?.gefunden !== true) return null
  const anker = String(hinweis.anker || '')
  if (!anker) return null

  const category = KATEGORIE_ZU_CATEGORY[hinweis.kategorie] || 'content'
  const vorschlag = hinweis.vorschlag && typeof hinweis.vorschlag === 'object' ? hinweis.vorschlag : null
  const bisher = vorschlag ? String(vorschlag.bisher || '') : ''
  const neu = vorschlag ? String(vorschlag.neu || '') : ''
  const vorschlagAnwendbar = Boolean(bisher && neu && anker.includes(bisher))
  const action = vorschlagAnwendbar ? anker.replace(bisher, neu) : ''

  const finding = {
    id: `ki-${jetzt.toString(36)}-${einfacherHash(`${hinweis.kategorie}|${anker}`)}`,
    kind: hinweis.kategorie === 'sprache' ? 'form' : 'inhalt',
    form: vorschlagAnwendbar ? 'mark' : 'note',
    status: 'open',
    placement: 'passage',
    target: anker,
    short: String(hinweis.beobachtung || ''),
    why: String(hinweis.relevanz || ''),
    folge: String(hinweis.folge || ''),
    action,
    variants: vorschlagAnwendbar ? [action] : [],
    category,
    kiKategorie: String(hinweis.kategorie || ''),
    istGrundursache: hinweis.istGrundursache === true,
    priority: hinweis.istGrundursache === true ? 'high' : 'normal',
    createdAt: jetzt,
    blockId: blockId || null,
    sources: [],
    thread: [],
  }
  if (hinweis.integritaet === true || INTEGRITAETS_KATEGORIEN.has(hinweis.kategorie)) {
    finding.claim = anker
  }
  return finding
}

// Volatiler Prompt-Teil: was bereits entschieden wurde, darf nie wieder
// vorgeschlagen werden (Spec §5). Kompakt, ohne Zeitstempel im Cache-Präfix.
export function fasseEntscheidungenZusammen(findings, decisions) {
  const proFinding = new Map()
  ;(decisions || []).forEach(decision => {
    if (decision?.findingId) proFinding.set(decision.findingId, decision)
  })
  return (findings || [])
    .filter(finding => finding && finding.status && finding.status !== 'open')
    .map(finding => ({
      anker: String(finding.target || ''),
      kategorie: String(finding.kiKategorie || finding.category || ''),
      kurz: String(finding.short || finding.text || ''),
      entscheidung: String(finding.status || ''),
      begruendung: String(proFinding.get(finding.id)?.reason || ''),
    }))
}

export function fasseOffeneHinweiseZusammen(findings) {
  return (findings || [])
    .filter(finding => finding && finding.status === 'open')
    .map(finding => ({
      anker: String(finding.target || ''),
      kategorie: String(finding.kiKategorie || finding.category || ''),
      kurz: String(finding.short || finding.text || ''),
    }))
}
```

- [ ] GREEN belegen: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && node --test test/agent-findings.test.mjs` — erwartet: 9 Tests bestanden, 0 fehlgeschlagen.
- [ ] Gesamtlauf: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` — erwartet: alle Suiten grün (46 Bestandstests + 9 neue = 55).
- [ ] Commit: `git add app/src/agent-findings.mjs app/test/agent-findings.test.mjs && git commit -m "ki: hinweisZuFinding — pure Umwandlung KI-Hinweis in bestehende Finding-Form (TDD, 9 Tests)"`

---

### Task H-2: Echter Hinweislauf fuehreHinweislaufAus in workspace.js

**Voraussetzung:** `app/src/agent-gateway.mjs` (Bereich G) und `app/src/anchor-verify.mjs` (Bereich A) sind gemerged — sonst schlägt `npm run build` fehl.

**Files:**
- Modify: `app/src/workspace.js` (Imports Zeilen 1–18; Modul-Variablen um Zeile 56–66; neue Funktionen vor `function scheduleAgentInitiative()` um Zeile 1856 einfügen — nach Inhalt suchen, Zeilennummern können verschoben sein).

**Interfaces:**
- Consumes: `runTask(taskName, eingabe, optionen)` und `hatSchluessel()` aus `agent-gateway.mjs`; `findeAnker(docText, anker)` und `dedupeHinweise(neueHinweise, findings, decisions)` aus `anchor-verify.mjs`; `EXAMPLE_PROJECT_ID`, `seedBodySignature` aus `example-seed.mjs`; `baueDocText`, `blockFuerAnkerIndex`, `hinweisZuFinding`, `fasseEntscheidungenZusammen`, `fasseOffeneHinweiseZusammen` aus `agent-findings.mjs` (H-1); bereits importiert: `ensureProjectUnderstanding`, `isIntegrityCategory`, `getEditorBlocks`.
- Produces:
  - `fuehreHinweislaufAus({ grund }) -> Promise<{gestartet:boolean, uebernommen?:number, verworfen?:number, fehler?:string, grund?:string}>` (modulintern, H-3 verkabelt).
  - `export function starteHinweislauf(optionen)` — der Chat-Bitte-Hook für Bereich C.
  - Lauf-Protokoll additiv am Workspace-State: `workspace.hinweislauf = { signatur, beendetAt, gestartet, verworfen, uebernommen, fehler }` (ensureWorkspaceState lässt unbekannte Felder unangetastet — kein Schema-Bump).
  - **Eingabe-Vertrag an Bereich T/G für Task `hinweise`:** `{ verstaendnis, docText, entscheidungen, offeneHinweise }` — `verstaendnis` = Understanding-Objekt, `docText` aus `baueDocText`, beide gehören ins Cache-Präfix; `entscheidungen`/`offeneHinweise` sind Volatiles.

- [ ] In `app/src/workspace.js` die Imports ergänzen (direkt nach dem bestehenden `import { applySettings } from './ui.js'`, Zeile ~18):

```js
import { EXAMPLE_PROJECT_ID, seedBodySignature } from './example-seed.mjs'
import { hatSchluessel, runTask } from './agent-gateway.mjs'
import { dedupeHinweise, findeAnker } from './anchor-verify.mjs'
import {
  baueDocText,
  blockFuerAnkerIndex,
  fasseEntscheidungenZusammen,
  fasseOffeneHinweiseZusammen,
  hinweisZuFinding,
} from './agent-findings.mjs'
```

- [ ] Modul-Variable ergänzen (bei den anderen `let`-Deklarationen, nach `let agentInitiativeTimer = null` um Zeile 56 — nach Inhalt suchen):

```js
let hinweislaufAktiv = false
let hinweislaufTimer = null
```

- [ ] Neue Funktionen VOR `function nextAgentInitiative(workspace)` (um Zeile 1814 — nach Inhalt suchen) KOMPLETT einfügen:

```js
// ---- Echte Hinweis-Läufe (Etappe A, Spec §5) -------------------------------

function istBeispielDokument(doc) {
  return doc?.projectId === EXAMPLE_PROJECT_ID
}

function hinweislaufProtokoll(workspace) {
  if (!workspace.hinweislauf || typeof workspace.hinweislauf !== 'object') {
    workspace.hinweislauf = {
      signatur: null,
      beendetAt: null,
      gestartet: 0,
      verworfen: 0,
      uebernommen: 0,
      fehler: null,
    }
  }
  return workspace.hinweislauf
}

// Echte Initiative-Quelle: nach einem Lauf mit Grundursache oder Integritätsthema
// entsteht eine Agenten-Nachricht. Anzeige-Gates (shouldOpenAgentWidget,
// hasUnseenInitiative, Dismiss-Regeln) bleiben unverändert die bestehenden.
function ergaenzeEchteInitiative(workspace, finding, jetzt) {
  const offenVorhanden = workspace.agent.messages.some(message => (
    message.status === 'new' && !workspace.agent.dismissedIds.includes(message.id)
  ))
  if (offenVorhanden) return
  const text = finding.istGrundursache
    ? `Beim Lesen ist mir etwas Grundsätzliches aufgefallen: ${finding.short}`
    : `Ein Hinweis betrifft die Verlässlichkeit deines Textes: ${finding.short}`
  workspace.agent.messages.push({
    id: `initiative-${jetzt.toString(36)}`,
    status: 'new',
    earliestAt: jetzt,
    text,
    thread: [],
  })
}

async function fuehreHinweislaufAus({ grund = 'pause' } = {}) {
  const doc = ctx?.activeDoc()
  const workspace = activeWorkspace()
  if (!doc || !workspace) return { gestartet: false, grund: 'kein-dokument' }
  if (istBeispielDokument(doc)) return { gestartet: false, grund: 'beispielprojekt' }
  if (hinweislaufAktiv) return { gestartet: false, grund: 'lauf-aktiv' }

  const blocks = getEditorBlocks(ctx.editor)
  const docText = baueDocText(blocks)
  const protokoll = hinweislaufProtokoll(workspace)
  const signatur = seedBodySignature(docText)
  if (!docText.trim()) return { gestartet: false, grund: 'leer' }
  if (signatur === protokoll.signatur) return { gestartet: false, grund: 'unveraendert' }
  if (!(await hatSchluessel())) return { gestartet: false, grund: 'kein-schluessel' }

  hinweislaufAktiv = true
  try {
    const project = ctx.activeProjectObj()
    const { daten } = await runTask('hinweise', {
      verstaendnis: project ? ensureProjectUnderstanding(project) : null,
      docText,
      entscheidungen: fasseEntscheidungenZusammen(doc.findings, doc.decisions),
      offeneHinweise: fasseOffeneHinweiseZusammen(doc.findings),
    })
    const jetzt = Date.now()
    const geliefert = Array.isArray(daten?.hinweise) ? daten.hinweise : []
    const frisch = dedupeHinweise(geliefert, doc.findings, doc.decisions)
    let verworfen = geliefert.length - frisch.length
    const uebernommen = []
    frisch.forEach(hinweis => {
      const ankerErgebnis = findeAnker(docText, hinweis.anker)
      if (!ankerErgebnis.gefunden) { verworfen += 1; return }
      const doppelt = uebernommen.some(finding => (
        finding.target === hinweis.anker && finding.kiKategorie === hinweis.kategorie
      ))
      if (doppelt) { verworfen += 1; return }
      const blockId = blockFuerAnkerIndex(blocks, ankerErgebnis.index)
      const finding = hinweisZuFinding(hinweis, ankerErgebnis, blockId, jetzt)
      if (!finding) { verworfen += 1; return }
      uebernommen.push(finding)
    })
    const grundursache = uebernommen.find(finding => finding.istGrundursache)
    if (grundursache) {
      uebernommen.forEach(finding => {
        if (finding !== grundursache) finding.rootCauseId = grundursache.id
      })
    }
    uebernommen.forEach(finding => doc.findings.push(finding))
    Object.assign(protokoll, {
      signatur,
      beendetAt: jetzt,
      gestartet: geliefert.length,
      verworfen,
      uebernommen: uebernommen.length,
      fehler: null,
    })
    const initiativeAnlass = grundursache
      || uebernommen.find(finding => isIntegrityCategory(finding.category))
    if (initiativeAnlass) ergaenzeEchteInitiative(workspace, initiativeAnlass, jetzt)
    ctx.scheduleSave()
    refreshWorkspace()
    return { gestartet: true, uebernommen: uebernommen.length, verworfen }
  } catch (fehler) {
    // Spec §7: Lauf verwerfen, still protokollieren, beim nächsten Auslöser neu.
    // signatur bleibt unverändert -> derselbe Text darf erneut versucht werden.
    Object.assign(protokoll, { beendetAt: Date.now(), fehler: fehler?.typ || 'unbekannt' })
    ctx?.scheduleSave()
    return { gestartet: true, fehler: fehler?.typ || 'unbekannt' }
  } finally {
    hinweislaufAktiv = false
  }
}

// Chat-Bitte-Hook („schau nochmal drüber") — Bereich C ruft diese Funktion.
export function starteHinweislauf(optionen = {}) {
  return fuehreHinweislaufAus({ grund: optionen.grund || 'chat' })
}
```

- [ ] Bestand prüfen: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` — erwartet: alle Suiten grün (55 Tests, workspace.js wird von den Node-Suiten nicht importiert).
- [ ] Bundle prüfen (Import-/Syntaxfehler): `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm run build` — erwartet: `dist/editor.bundle.js` wird ohne Fehler geschrieben.
- [ ] Commit: `git add app/src/workspace.js && git commit -m "ki: echter Hinweislauf — Gate (Beispielprojekt/Schlüssel/aktiv/Signatur), runTask('hinweise'), Anker-Verifikation, Dedupe, Grundursache-Parken, Lauf-Protokoll"`

---

### Task H-3: Auslöser verkabeln — Schreibpause, Dokument öffnen, Chat-Hook

**Files:**
- Modify: `app/src/workspace.js` (`invalidateAgentInitiative` um Zeile 776, `scheduleAgentInitiative` um Zeile 1856, `onViewChange` um Zeile 2104, `initWorkspace`-Ende um Zeile 2214, `instance.destroy` um Zeile 2161 — jeweils nach Inhalt suchen, Zeilennummern können verschoben sein).

**Interfaces:**
- Consumes: `fuehreHinweislaufAus`, `hinweislaufProtokoll`, `istBeispielDokument`, `hinweislaufTimer` (H-2); bestehende Bausteine `initiativeInputState`, `editorViewIsVisibleFor`, `AGENT_IDLE_MS`, `scheduleAgentInitiative`.
- Produces: Pausen-Auslöser (a), Öffnen-Auslöser (b), Chat-Hook (c, bereits exportiert in H-2). `shouldOpenAgentWidget`-Gate und alle Dismiss-/Pausen-Regeln bleiben unverändert; das Beispielprojekt behält seine Seed-Initiative als Demo (Gate liegt in `fuehreHinweislaufAus` und `planeHinweislauf`).

- [ ] Pausen-Planer einfügen, direkt VOR `function scheduleAgentInitiative()` (nach Inhalt suchen):

```js
function clearHinweislaufTimer() {
  if (hinweislaufTimer) clearTimeout(hinweislaufTimer)
  hinweislaufTimer = null
}

// Auslöser (a): dieselbe Pausen-Erkennung, die bisher nur die Attrappen-Anzeige
// fütterte, startet jetzt den echten Lauf. Entprellung über Signatur und
// hinweislaufAktiv liegt in fuehreHinweislaufAus.
function planeHinweislauf() {
  clearHinweislaufTimer()
  const doc = ctx?.activeDoc()
  const docId = doc?.id || null
  const inputState = initiativeInputState(docId)
  if (
    !doc
    || istBeispielDokument(doc)
    || hinweislaufAktiv
    || !inputState
    || !Number.isFinite(inputState.lastInputAt)
    || !editorViewIsVisibleFor(docId)
    || isComposing
  ) return
  const workspace = activeWorkspace()
  if (!workspace) return
  const signatur = seedBodySignature(baueDocText(getEditorBlocks(ctx.editor)))
  if (signatur === hinweislaufProtokoll(workspace).signatur) return

  const restzeit = AGENT_IDLE_MS - (Date.now() - inputState.lastInputAt)
  const scheduledGeneration = inputState.generation
  hinweislaufTimer = setTimeout(() => {
    hinweislaufTimer = null
    const currentInputState = initiativeInputState(docId)
    if (!currentInputState || currentInputState.generation !== scheduledGeneration) return
    if (!editorViewIsVisibleFor(docId) || isComposing) return
    fuehreHinweislaufAus({ grund: 'pause' })
  }, Math.max(24, restzeit))
}
```

- [ ] In `scheduleAgentInitiative()` den Planer anschließen: nach der Zeile `activateInitiativeDocument(docId)` (nach Inhalt suchen) EINE Zeile einfügen:

```js
  planeHinweislauf()
```

- [ ] In `invalidateAgentInitiative(...)` (nach Inhalt suchen: `clearAgentInitiativeTimer()` am Funktionsanfang) direkt danach einfügen:

```js
  clearHinweislaufTimer()
```

- [ ] Auslöser (b) Dokument öffnen: in `onViewChange` (nach Inhalt suchen: `activateInitiativeDocument(ctx.activeDoc()?.id || null)` gefolgt von `scheduleAgentInitiative()`) nach `scheduleAgentInitiative()` einfügen — `openDoc` führt über `showEditorView()` zu genau diesem Ereignis, `editor.js` braucht keine Änderung:

```js
    fuehreHinweislaufAus({ grund: 'oeffnen' })
```

- [ ] Auslöser (b) Workspace-Init: am Ende von `initWorkspace`, direkt nach `refreshWorkspace({ reconcileEditing: true })` und vor `return instance` (nach Inhalt suchen), einfügen:

```js
  if (editorViewIsVisibleFor(ctx.activeDoc()?.id)) fuehreHinweislaufAus({ grund: 'oeffnen' })
```

- [ ] Aufräumen: in `instance.destroy` direkt nach `clearAgentInitiativeTimer()` (nach Inhalt suchen) einfügen:

```js
    clearHinweislaufTimer()
```

- [ ] Bestand prüfen: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` — erwartet: alle Suiten grün (55 Tests).
- [ ] Bundle prüfen: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm run build` — erwartet: fehlerfrei.
- [ ] Verkabelung belegen: `grep -n "planeHinweislauf()\|grund: 'oeffnen'\|clearHinweislaufTimer()" "/Users/jakobschlenker/Documents/AI Writing Tool/app/src/workspace.js"` — erwartet: 1 Treffer in `scheduleAgentInitiative`, 2 Treffer `grund: 'oeffnen'` (onViewChange + initWorkspace), 3 Treffer `clearHinweislaufTimer()` (Definition ausgenommen: invalidate, planeHinweislauf, destroy).
- [ ] Commit: `git add app/src/workspace.js && git commit -m "ki: Hinweislauf-Auslöser — Schreibpause über bestehende Pausen-Erkennung, Dokument-öffnen-Lauf, Chat-Hook exportiert; Demo-Projekt bleibt ausgenommen"`

---

### Task H-4: Belegfenster-Guard — echte Projekte ohne Demo-Quellen

**Files:**
- Modify: `app/src/workspace.js` (`renderEvidenceWindow` um Zeile 1708–1812 — nach Inhalt suchen, Zeilennummern können verschoben sein).

**Interfaces:**
- Consumes: `istBeispielDokument(doc)` aus H-2.
- Produces: keine neuen Schnittstellen. Verhalten: echte Findings haben `sources: []` (H-1) — der Klickpfad in `renderLocalFinding` (`else if (finding.sources?.length)`, Zeile ~1452) öffnet das Belegfenster dann gar nicht erst und führt würdevoll ins Stellen-Gespräch; dieser Pfad bleibt UNVERÄNDERT. Der Guard hier sichert zusätzlich jeden anderen Weg ins Belegfenster ab.

- [ ] In `renderEvidenceWindow` die Quellen-Schleife absichern. Nach Inhalt suchen: `const sources = createNode('div', 'evidence-sources')` gefolgt von `;(finding.sources || []).forEach(source => {`. Die Forach-Kopfzeile ersetzen durch:

```js
  const sources = createNode('div', 'evidence-sources')
  // Etappe-A-Guard: In echten Projekten zeigt das Belegfenster nur den
  // Hinweis-Kontext — Demo-Quellen bleiben exklusiv im Beispielprojekt.
  const echtesProjekt = !istBeispielDokument(doc)
  const sichtbareQuellen = (finding.sources || []).filter(
    source => !echtesProjekt || source.verificationStatus !== 'demo',
  )
  sichtbareQuellen.forEach(source => {
```

(Die schließende Klammer der Schleife `})` bleibt unverändert.)

- [ ] Den Leer-Zustand projektabhängig machen. Nach Inhalt suchen:

```js
  if (!sources.children.length) {
    sources.append(createNode('p', 'evidence-empty', 'Für diese Aussage ist noch keine sichere direkte Quelle hinterlegt.'))
  }
```

ersetzen durch:

```js
  if (!sources.children.length) {
    sources.append(createNode('p', 'evidence-empty', echtesProjekt
      ? 'Dieser Hinweis stützt sich allein auf deinen Text. Die Quellensuche kommt in Etappe B.'
      : 'Für diese Aussage ist noch keine sichere direkte Quelle hinterlegt.'))
  }
```

- [ ] Bestand prüfen: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` — erwartet: alle Suiten grün (55 Tests).
- [ ] Bundle prüfen: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm run build` — erwartet: fehlerfrei.
- [ ] Guard belegen: `grep -n "Quellensuche kommt in Etappe B\|sichtbareQuellen" "/Users/jakobschlenker/Documents/AI Writing Tool/app/src/workspace.js"` — erwartet: je mindestens 1 Treffer in `renderEvidenceWindow`. Hinweis für den Abschluss-Task (Playwright-Smoke, separat): dort prüfen, dass ein echtes Finding mit `sources: []` beim Aufklappen ins Stellen-Gespräch führt und das Belegfenster in echten Projekten den Etappe-B-Satz zeigt.
- [ ] Commit: `git add app/src/workspace.js && git commit -m "ki: Belegfenster-Guard — echte Projekte ohne Demo-Quellen, ruhiger Etappe-B-Hinweis statt leerem Versprechen"`

---

## Bereich C — Echter Chat, Initiative, Entscheidungsverlauf

### Task C-1: Pures Chat-Kontext-Modul (Verlauf, Verdichtungsplan, Entscheidungs-Kurzform, Fehlertexte)

**Files:**
- Create: `app/src/chat-kontext.mjs`
- Test: `app/test/chat-kontext.test.mjs` (neu)

**Interfaces:**
- Consumes: nichts (pures Modul, keine Abhängigkeiten — node-testbar).
- Produces (werden von Task C-2/C-3/C-4 und von `baueAnfrage(task, kontext)` in `app/src/agent-tasks.mjs` konsumiert):
  - `erkenneHinweisBitte(text) -> bool` (Muster `/schau|prüf|lies|check/i`)
  - `formatiereRelativeZeit(at, now?) -> string` (deutsch: „gerade eben", „vor 5 Minuten", „gestern", sonst `TT.MM.JJJJ`)
  - `entscheidungsEintraege(doc, now?) -> [{id, art:'angenommen'|'eigene'|'verworfen'|'risiko', label, datumText, kurztext, begruendung}]`
  - `kurzformEntscheidungen(doc, now?) -> string[]` (volatiler Prompt-Block „Entscheidungsliste")
  - `kurzformHinweise(findings) -> string[]` (offene Findings in Kurzform)
  - `verlaufFuerPrompt(thread, verlaufsNotiz?) -> [{role:'user'|'agent', text}]`
  - `planVerlaufVerdichtung(thread, verlaufsNotiz?, {maxTurns=20, behalte=8}?) -> null | {verdichtungsEingabe, bisMessageId}`
  - `chatFehlerText(fehler) -> string` (ruhige deutsche Meldung je Gateway-Fehlertyp `kein-schluessel|offline|ratenlimit|ueberlastet|abgelehnt|sonst`)
  - `baueChatKontext({verstaendnis, docText, findings, doc, thread, verlaufsNotiz, anfrage, zusatzAnweisung, now}) -> kontext` mit **exakt** dieser Form: `{verstaendnis, docText, offeneHinweise, entscheidungen, verlauf, anfrage, zusatzAnweisung}` — Abbildung in `agent-tasks.mjs`: `verstaendnis`+`docText` → Cache-Präfix-Blöcke (`<projektverstaendnis>`, `<dokument>` mit `cache_control`), `offeneHinweise`+`entscheidungen`+`zusatzAnweisung`+`anfrage` → volatile Blöcke OHNE `cache_control`, `verlauf` → weitere `messages`.

- [ ] **RED — Testdatei anlegen.** Schreibe `app/test/chat-kontext.test.mjs` mit folgendem Inhalt:
  ```js
  import test from 'node:test'
  import assert from 'node:assert/strict'
  import {
    baueChatKontext,
    chatFehlerText,
    entscheidungsEintraege,
    erkenneHinweisBitte,
    formatiereRelativeZeit,
    kurzformEntscheidungen,
    kurzformHinweise,
    planVerlaufVerdichtung,
    verlaufFuerPrompt,
  } from '../src/chat-kontext.mjs'

  function turn(id, role, text, at) {
    return { id, role, text, at }
  }

  function langerThread(anzahl) {
    return Array.from({ length: anzahl }, (unused, index) => turn(
      `m-${index + 1}`,
      index % 2 === 0 ? 'user' : 'agent',
      `Turn ${index + 1}`,
      index + 1,
    ))
  }

  test('erkenneHinweisBitte erkennt Durchsicht-Bitten', () => {
    assert.equal(erkenneHinweisBitte('Schau bitte nochmal über den Text.'), true)
    assert.equal(erkenneHinweisBitte('Kannst du das prüfen?'), true)
    assert.equal(erkenneHinweisBitte('Lies den zweiten Absatz.'), true)
    assert.equal(erkenneHinweisBitte('Mach mal einen Check.'), true)
  })

  test('erkenneHinweisBitte ignoriert normale Fragen', () => {
    assert.equal(erkenneHinweisBitte('Wie wirkt der Einstieg auf dich?'), false)
    assert.equal(erkenneHinweisBitte(''), false)
    assert.equal(erkenneHinweisBitte(null), false)
  })

  test('formatiereRelativeZeit deckt Minuten, Stunden, gestern, Tage und Datum ab', () => {
    const now = new Date('2026-07-26T12:00:00').getTime()
    assert.equal(formatiereRelativeZeit(now - 20_000, now), 'gerade eben')
    assert.equal(formatiereRelativeZeit(now - 60_000, now), 'vor 1 Minute')
    assert.equal(formatiereRelativeZeit(now - 5 * 60_000, now), 'vor 5 Minuten')
    assert.equal(formatiereRelativeZeit(now - 3 * 3_600_000, now), 'vor 3 Stunden')
    assert.equal(formatiereRelativeZeit(now - 30 * 3_600_000, now), 'gestern')
    assert.equal(formatiereRelativeZeit(now - 3 * 86_400_000, now), 'vor 3 Tagen')
    assert.equal(
      formatiereRelativeZeit(new Date('2026-07-01T12:00:00').getTime(), now),
      '01.07.2026',
    )
    assert.equal(formatiereRelativeZeit(Number.NaN, now), '')
  })

  test('entscheidungsEintraege ordnet neueste zuerst und benennt die Entscheidungsarten', () => {
    const now = new Date('2026-07-26T12:00:00').getTime()
    const doc = {
      findings: [
        { id: 'f-1', short: 'Aussage ohne Beleg', action: 'Neu A', category: 'source' },
        { id: 'f-2', short: 'Unscharfe Formulierung', action: 'Neu B', category: 'wording' },
      ],
      decisions: [
        { id: 'd-1', findingId: 'f-1', kind: 'reject', outcome: 'risk-accepted', reason: 'Quelle folgt nächste Woche', appliedText: '', at: now - 86_400_000 - 3_600_000 },
        { id: 'd-2', findingId: 'f-2', kind: 'accept', outcome: 'resolved', reason: '', appliedText: 'Neu B', at: now - 60_000 },
      ],
    }
    const eintraege = entscheidungsEintraege(doc, now)
    assert.equal(eintraege.length, 2)
    assert.equal(eintraege[0].id, 'd-2')
    assert.equal(eintraege[0].art, 'angenommen')
    assert.equal(eintraege[0].label, 'Angenommen')
    assert.equal(eintraege[0].kurztext, 'Unscharfe Formulierung')
    assert.equal(eintraege[0].datumText, 'vor 1 Minute')
    assert.equal(eintraege[0].begruendung, '')
    assert.equal(eintraege[1].art, 'risiko')
    assert.equal(eintraege[1].label, 'Risiko bewusst angenommen')
    assert.equal(eintraege[1].begruendung, 'Quelle folgt nächste Woche')
    assert.equal(eintraege[1].datumText, 'gestern')
  })

  test('entscheidungsEintraege erkennt eigene Fassung, Verwerfen und fehlende Findings', () => {
    const now = 1_000_000
    const doc = {
      findings: [{ id: 'f-1', short: 'Hinweis', action: 'KI-Vorschlag' }],
      decisions: [
        { id: 'd-1', findingId: 'f-1', kind: 'accept', outcome: 'resolved', appliedText: 'Eigene Formulierung', at: now - 1 },
        { id: 'd-2', findingId: 'f-1', kind: 'reject', outcome: 'dismissed', appliedText: '', at: now - 2 },
        { id: 'd-3', findingId: 'weg', kind: 'accept', outcome: 'resolved', appliedText: '', at: now - 3 },
      ],
    }
    const eintraege = entscheidungsEintraege(doc, now)
    assert.equal(eintraege[0].art, 'eigene')
    assert.equal(eintraege[0].label, 'Eigene Fassung übernommen')
    assert.equal(eintraege[1].art, 'verworfen')
    assert.equal(eintraege[2].kurztext, 'Hinweis nicht mehr vorhanden')
    assert.equal(kurzformEntscheidungen(doc, now)[0], 'Eigene Fassung übernommen: Hinweis')
  })

  test('kurzformHinweise liefert nur offene Hinweise mit Kategorie und Anker', () => {
    const findings = [
      { id: 'f-1', status: 'open', category: 'logik', short: 'Sprung in der Argumentation', target: 'daraus folgt zwingend' },
      { id: 'f-2', status: 'resolved', category: 'sprache', short: 'Erledigt', target: 'x' },
      { id: 'f-3', status: 'open', short: 'Ohne Kategorie und Anker' },
    ]
    const kurz = kurzformHinweise(findings)
    assert.deepEqual(kurz, [
      '[logik] Sprung in der Argumentation — Anker: »daraus folgt zwingend«',
      '[hinweis] Ohne Kategorie und Anker',
    ])
  })

  test('verlaufFuerPrompt spiegelt ohne Notiz den bereinigten Thread', () => {
    const thread = [
      turn('m-1', 'user', 'Frage', 1),
      { id: 'kaputt', role: 'tool', text: 'weg', at: 2 },
      turn('m-3', 'agent', 'Antwort', 3),
    ]
    assert.deepEqual(verlaufFuerPrompt(thread), [
      { role: 'user', text: 'Frage' },
      { role: 'agent', text: 'Antwort' },
    ])
  })

  test('verlaufFuerPrompt ersetzt mit Notiz die älteren Turns durch die Zusammenfassung', () => {
    const thread = langerThread(4)
    const verlauf = verlaufFuerPrompt(thread, { text: 'Bisher ging es um den Einstieg.', bisMessageId: 'm-2' })
    assert.deepEqual(verlauf, [
      { role: 'agent', text: 'Zusammenfassung des bisherigen Gesprächs: Bisher ging es um den Einstieg.' },
      { role: 'user', text: 'Turn 3' },
      { role: 'agent', text: 'Turn 4' },
    ])
  })

  test('planVerlaufVerdichtung lässt kurze Verläufe unangetastet', () => {
    assert.equal(planVerlaufVerdichtung(langerThread(20)), null)
    assert.equal(planVerlaufVerdichtung([]), null)
  })

  test('planVerlaufVerdichtung verdichtet ältere Turns und behält die letzten acht', () => {
    const plan = planVerlaufVerdichtung(langerThread(25))
    assert.ok(plan)
    assert.equal(plan.bisMessageId, 'm-17')
    assert.ok(plan.verdichtungsEingabe.startsWith('Nutzer: Turn 1\n'))
    assert.ok(plan.verdichtungsEingabe.includes('Agent: Turn 16'))
    assert.ok(!plan.verdichtungsEingabe.includes('Turn 18'))
  })

  test('planVerlaufVerdichtung baut auf einer bestehenden Notiz auf', () => {
    const thread = langerThread(40)
    const notiz = { text: 'Alte Zusammenfassung.', bisMessageId: 'm-10' }
    const plan = planVerlaufVerdichtung(thread, notiz)
    assert.ok(plan)
    assert.ok(plan.verdichtungsEingabe.startsWith('Bisherige Zusammenfassung:\nAlte Zusammenfassung.'))
    assert.ok(plan.verdichtungsEingabe.includes('Nutzer: Turn 11'))
    assert.equal(plan.bisMessageId, 'm-32')
  })

  test('chatFehlerText liefert ruhige deutsche Meldungen je Fehlertyp', () => {
    assert.ok(chatFehlerText({ typ: 'kein-schluessel' }).includes('kein Schlüssel'))
    assert.ok(chatFehlerText({ typ: 'offline' }).includes('Netz'))
    assert.ok(chatFehlerText({ typ: 'ratenlimit' }).includes('Anfragen'))
    assert.ok(chatFehlerText({ typ: 'ueberlastet' }).includes('ausgelastet'))
    assert.ok(chatFehlerText({ typ: 'abgelehnt' }).includes('nicht eingehen'))
    assert.ok(chatFehlerText(null).includes('nicht geklappt'))
    for (const typ of ['kein-schluessel', 'offline', 'ratenlimit', 'ueberlastet', null]) {
      assert.ok(chatFehlerText({ typ }).length < 160)
    }
  })

  test('baueChatKontext bündelt Verständnis, Text, Hinweise, Entscheidungen und Verlauf', () => {
    const doc = {
      findings: [{ id: 'f-1', status: 'open', category: 'fakt', short: 'Zahl unbelegt', target: '90 Prozent' }],
      decisions: [{ id: 'd-1', findingId: 'f-1', kind: 'reject', outcome: 'dismissed', at: 500 }],
    }
    const kontext = baueChatKontext({
      verstaendnis: { task: 'Essay' },
      docText: 'Absatz eins.',
      findings: doc.findings,
      doc,
      thread: [turn('m-1', 'user', 'Hallo', 1)],
      anfrage: 'Wie wirkt der Einstieg?',
      zusatzAnweisung: null,
      now: 1_000,
    })
    assert.deepEqual(Object.keys(kontext).sort(), [
      'anfrage', 'docText', 'entscheidungen', 'offeneHinweise', 'verlauf', 'verstaendnis', 'zusatzAnweisung',
    ])
    assert.equal(kontext.docText, 'Absatz eins.')
    assert.equal(kontext.offeneHinweise.length, 1)
    assert.equal(kontext.entscheidungen.length, 1)
    assert.deepEqual(kontext.verlauf, [{ role: 'user', text: 'Hallo' }])
    assert.equal(kontext.anfrage, 'Wie wirkt der Einstieg?')
    assert.equal(kontext.zusatzAnweisung, null)
  })
  ```
- [ ] **RED-Beleg:** Führe aus: `cd app && npm test` — erwartetes Ergebnis: die neue Suite `chat-kontext.test.mjs` schlägt fehl mit `ERR_MODULE_NOT_FOUND` (`Cannot find module '…/src/chat-kontext.mjs'`), alle 46 bestehenden Tests bleiben grün.
- [ ] **GREEN — Modul anlegen.** Schreibe `app/src/chat-kontext.mjs` mit folgendem Inhalt:
  ```js
  // Pure Hilfslogik für den echten Agenten-Chat (Etappe A, Bereich C).
  // Bewusst ohne DOM-, Editor- oder Netz-Abhängigkeiten — node-testbar.

  const HINWEIS_BITTE_MUSTER = /schau|prüf|lies|check/i
  const MAX_VERLAUF_TURNS = 20
  const BEHALTE_TURNS = 8

  const MINUTE_MS = 60 * 1000
  const STUNDE_MS = 60 * MINUTE_MS
  const TAG_MS = 24 * STUNDE_MS

  const ENTSCHEIDUNGS_LABELS = Object.freeze({
    angenommen: 'Angenommen',
    eigene: 'Eigene Fassung übernommen',
    verworfen: 'Verworfen',
    risiko: 'Risiko bewusst angenommen',
  })

  function gueltigeTurns(thread) {
    return (Array.isArray(thread) ? thread : []).filter(message => (
      message
      && (message.role === 'user' || message.role === 'agent')
      && typeof message.text === 'string'
      && message.text.trim()
    ))
  }

  export function erkenneHinweisBitte(text) {
    return HINWEIS_BITTE_MUSTER.test(String(text || ''))
  }

  export function formatiereRelativeZeit(at, now = Date.now()) {
    if (!Number.isFinite(at)) return ''
    const diff = Math.max(0, now - at)
    if (diff < MINUTE_MS) return 'gerade eben'
    if (diff < STUNDE_MS) {
      const minuten = Math.floor(diff / MINUTE_MS)
      return minuten === 1 ? 'vor 1 Minute' : `vor ${minuten} Minuten`
    }
    if (diff < TAG_MS) {
      const stunden = Math.floor(diff / STUNDE_MS)
      return stunden === 1 ? 'vor 1 Stunde' : `vor ${stunden} Stunden`
    }
    if (diff < 2 * TAG_MS) return 'gestern'
    if (diff < 7 * TAG_MS) return `vor ${Math.floor(diff / TAG_MS)} Tagen`
    return new Date(at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  export function entscheidungsEintraege(doc, now = Date.now()) {
    const decisions = Array.isArray(doc?.decisions) ? doc.decisions : []
    const findings = Array.isArray(doc?.findings) ? doc.findings : []

    return decisions
      .slice()
      .sort((a, b) => (b.at || 0) - (a.at || 0))
      .map(decision => {
        const finding = findings.find(candidate => candidate?.id === decision.findingId) || null
        let art = 'angenommen'
        if (decision.outcome === 'risk-accepted') art = 'risiko'
        else if (decision.outcome === 'dismissed') art = 'verworfen'
        else if (
          decision.kind === 'accept'
          && decision.appliedText
          && finding?.action
          && decision.appliedText !== finding.action
        ) art = 'eigene'
        return {
          id: decision.id,
          art,
          label: ENTSCHEIDUNGS_LABELS[art],
          datumText: formatiereRelativeZeit(decision.at, now),
          kurztext: finding?.short || 'Hinweis nicht mehr vorhanden',
          begruendung: art === 'risiko' ? String(decision.reason || '') : '',
        }
      })
  }

  export function kurzformEntscheidungen(doc, now = Date.now()) {
    return entscheidungsEintraege(doc, now).map(eintrag => (
      `${eintrag.label}: ${eintrag.kurztext}${eintrag.begruendung ? ` (Begründung: ${eintrag.begruendung})` : ''}`
    ))
  }

  export function kurzformHinweise(findings) {
    return (Array.isArray(findings) ? findings : [])
      .filter(finding => finding?.status === 'open')
      .map(finding => {
        const kategorie = finding.category || 'hinweis'
        const anker = finding.target ? ` — Anker: »${finding.target}«` : ''
        return `[${kategorie}] ${finding.short || ''}${anker}`.trim()
      })
  }

  export function verlaufFuerPrompt(thread, verlaufsNotiz = null) {
    const turns = gueltigeTurns(thread)
    const notizText = typeof verlaufsNotiz?.text === 'string' ? verlaufsNotiz.text.trim() : ''
    if (!notizText) return turns.map(message => ({ role: message.role, text: message.text }))
    const grenze = turns.findIndex(message => message.id === verlaufsNotiz.bisMessageId)
    const rest = grenze >= 0 ? turns.slice(grenze + 1) : turns
    return [
      { role: 'agent', text: `Zusammenfassung des bisherigen Gesprächs: ${notizText}` },
      ...rest.map(message => ({ role: message.role, text: message.text })),
    ]
  }

  export function planVerlaufVerdichtung(thread, verlaufsNotiz = null, { maxTurns = MAX_VERLAUF_TURNS, behalte = BEHALTE_TURNS } = {}) {
    const turns = gueltigeTurns(thread)
    const notizText = typeof verlaufsNotiz?.text === 'string' ? verlaufsNotiz.text.trim() : ''
    const grenze = notizText ? turns.findIndex(message => message.id === verlaufsNotiz.bisMessageId) : -1
    const offen = grenze >= 0 ? turns.slice(grenze + 1) : turns
    if (offen.length <= maxTurns) return null
    const zuVerdichten = offen.slice(0, offen.length - behalte)
    if (!zuVerdichten.length) return null
    const gespraech = zuVerdichten
      .map(message => `${message.role === 'user' ? 'Nutzer' : 'Agent'}: ${message.text}`)
      .join('\n')
    const verdichtungsEingabe = notizText
      ? `Bisherige Zusammenfassung:\n${notizText}\n\nNeue Gesprächsabschnitte:\n${gespraech}`
      : gespraech
    return { verdichtungsEingabe, bisMessageId: zuVerdichten[zuVerdichten.length - 1].id }
  }

  export function chatFehlerText(fehler) {
    const typ = fehler?.typ
    if (typ === 'kein-schluessel') return 'Ich bin gerade offline — es ist kein Schlüssel hinterlegt. Dein Text ist davon unberührt.'
    if (typ === 'offline') return 'Ich erreiche das Netz gerade nicht. Dein Text ist davon unberührt — versuch es später noch einmal.'
    if (typ === 'ratenlimit') return 'Gerade sind zu viele Anfragen unterwegs. Warte einen Moment, dann klappt es wieder.'
    if (typ === 'ueberlastet') return 'Der Dienst ist gerade stark ausgelastet. Versuch es gleich noch einmal — dein Text ist davon unberührt.'
    if (typ === 'abgelehnt') return 'Auf diese Bitte kann ich nicht eingehen. Lass uns beim Text weitermachen.'
    return 'Das hat gerade nicht geklappt. Dein Text ist davon unberührt — versuch es einfach noch einmal.'
  }

  export function baueChatKontext({
    verstaendnis = null,
    docText = '',
    findings = [],
    doc = null,
    thread = [],
    verlaufsNotiz = null,
    anfrage = '',
    zusatzAnweisung = null,
    now = Date.now(),
  } = {}) {
    return {
      verstaendnis,
      docText: String(docText || ''),
      offeneHinweise: kurzformHinweise(findings),
      entscheidungen: kurzformEntscheidungen(doc, now),
      verlauf: verlaufFuerPrompt(thread, verlaufsNotiz),
      anfrage: String(anfrage || ''),
      zusatzAnweisung: zusatzAnweisung || null,
    }
  }
  ```
- [ ] **GREEN-Beleg:** Führe aus: `cd app && npm test` — erwartetes Ergebnis: alle Suiten grün, 46 alte + 13 neue = 59 Tests bestanden, 0 fehlgeschlagen.
- [ ] Committe: `git add app/src/chat-kontext.mjs app/test/chat-kontext.test.mjs && git commit -m "chat: pures Kontext-Modul für den echten Agenten-Chat — Verlauf, Verdichtungsplan, Entscheidungs-Kurzform, ruhige Fehlertexte (TDD)"`

---

### Task C-2: Echter Chat im Agenten-Panel — Streaming statt Beispielreaktion, Verdichtung, Hinweis-Bitte, echte Initiative-Quelle

**Voraussetzung:** `app/src/agent-gateway.mjs` mit `runTask` existiert (Bereich G), `starteHinweislauf({ausloeser})` existiert in `workspace.js` (Bereich H), `istInterviewOffen(project)` und `verarbeiteInterviewAntwort(text)` existieren in `workspace.js` (Bereich V). Diesen Task nach diesen Tasks einplanen.

**Files:**
- Modify: `app/src/workspace.js` — Imports (~Zeile 1–18), Modul-Zustand (~Zeile 56–71), neue Funktionen direkt vor `function renderAgentWidget()` (~Zeile 1557), Composer-Submit in `renderAgentWidget` (~Zeile 1610–1627, die Zeile mit `'Beispielreaktion: Dann behandle ich Aufmerksamkeit …'`), Aufräumen in `instance.destroy` (~Zeile 2170). Überall: nach Inhalt suchen, Zeilennummern können verschoben sein.
- Test: pure Logik bereits durch `app/test/chat-kontext.test.mjs` (Task C-1) abgedeckt; UI-Fluss kommt in den separaten Playwright-Abschluss-Task. Verifikation hier: `npm test` + `npm run build` + grep.

**Interfaces:**
- Consumes: `runTask(taskName, eingabe, optionen={onDelta}) -> Promise<{daten, usage}>` und Fehler-Objekte `{typ, nachricht}` aus `app/src/agent-gateway.mjs` (Bereich G); `starteHinweislauf({ ausloeser: 'chat' })` (Bereich H, Funktion in `workspace.js`); `istInterviewOffen(project) -> bool` und `verarbeiteInterviewAntwort(text) -> Promise<void>` (Bereich V, Funktionen in `workspace.js`); `EXAMPLE_PROJECT_ID` aus `./example-seed.mjs`; `baueChatKontext`, `chatFehlerText`, `erkenneHinweisBitte`, `planVerlaufVerdichtung` aus `./chat-kontext.mjs` (Task C-1).
- Produces: `meldeAgentInitiative(text, { earliestAt }?) -> message|null` — **Export aus `workspace.js`**; Bereich H ruft dies nach einem Hinweislauf mit neuer Grundursache oder Integritätsthema auf. Legt eine Nachricht `{id, text, status:'new', earliestAt, thread:[]}` in `workspace.agent.messages` — damit greifen `hasUnseenInitiative` (Aura-Punkt) und `scheduleAgentInitiative` (Pausen-/Dismiss-Regeln) unverändert, nur die Quelle ist echt. Außerdem modulintern für Task C-3: `fuehreChatLauf(thread, kontext) -> Promise<void>` und `dokumentText() -> string`. Persistenz additiv: `message.verlaufsNotiz = {text, bisMessageId, erstelltAt}` am Agent-State (überlebt `normalizeAgentMessages`, das fremde Felder erhält).

- [ ] Ergänze in `app/src/workspace.js` die Imports (nach der bestehenden `import { applySettings } from './ui.js'`-Zeile, ~Zeile 18; nach Inhalt suchen):
  ```js
  import { runTask } from './agent-gateway.mjs'
  import { EXAMPLE_PROJECT_ID } from './example-seed.mjs'
  import {
    baueChatKontext,
    chatFehlerText,
    erkenneHinweisBitte,
    planVerlaufVerdichtung,
  } from './chat-kontext.mjs'
  ```
- [ ] Ergänze den Modul-Zustand: direkt unter der Zeile `const AGENT_BOUNDARY_IDLE_MS = 300` (~Zeile 69; nach Inhalt suchen) einfügen:
  ```js
  const CHAT_UI_DROSSEL_MS = 50

  let laufenderChatLauf = null
  ```
- [ ] Füge direkt **vor** `function renderAgentWidget()` (~Zeile 1557; nach Inhalt suchen) diese Funktionen KOMPLETT ein:
  ```js
  function dokumentText() {
    return getEditorBlocks(ctx.editor)
      .map(block => String(block.text || ''))
      .filter(Boolean)
      .join('\n\n')
  }

  function chatNachrichtenTextKnoten(messageId) {
    const selectorId = escapedSelectorValue(messageId)
    return document.querySelector(`.agent-message[data-message-id="${selectorId}"] .agent-message-text`)
  }

  // Streamt EINE Agenten-Antwort in den übergebenen Thread: die Nachricht entsteht
  // beim ersten Delta, wächst gedrosselt (~50 ms) per direktem Text-Update — nie per
  // Voll-Rerender, damit der Fokus im Eingabefeld unangetastet bleibt.
  async function fuehreChatLauf(thread, kontext) {
    const lauf = { agentMessage: null, puffer: '', flushTimer: null }
    laufenderChatLauf = lauf
    const flush = () => {
      lauf.flushTimer = null
      if (!lauf.agentMessage) return
      lauf.agentMessage.text = lauf.puffer
      const node = chatNachrichtenTextKnoten(lauf.agentMessage.id)
      if (!node) return
      node.textContent = lauf.puffer
      scrollThreadToLatest(node.closest('.agent-widget-messages, .local-dialogue-messages'))
    }
    try {
      const { daten } = await runTask('chat', kontext, {
        onDelta: text => {
          lauf.puffer += String(text || '')
          if (!lauf.agentMessage) {
            lauf.agentMessage = appendThreadMessage(thread, 'agent', lauf.puffer)
            refreshWorkspace()
            return
          }
          if (!lauf.flushTimer) lauf.flushTimer = setTimeout(flush, CHAT_UI_DROSSEL_MS)
        },
      })
      if (lauf.flushTimer) clearTimeout(lauf.flushTimer)
      const antwort = typeof daten === 'string' && daten.trim() ? daten : lauf.puffer
      if (!antwort.trim()) return
      if (lauf.agentMessage) lauf.agentMessage.text = antwort
      else appendThreadMessage(thread, 'agent', antwort)
      announceAgentStatus(antwort)
    } catch (fehler) {
      if (lauf.flushTimer) clearTimeout(lauf.flushTimer)
      if (fehler?.typ === 'abgebrochen') return
      const meldung = chatFehlerText(fehler)
      if (lauf.agentMessage) lauf.agentMessage.text = meldung
      else appendThreadMessage(thread, 'agent', meldung)
      announceAgentStatus(meldung)
    } finally {
      laufenderChatLauf = null
      ctx?.persist()
      refreshWorkspace()
    }
  }

  async function sendeAgentenChat(message, anfrage) {
    const doc = ctx.activeDoc()
    const project = ctx.activeProjectObj()
    if (!doc || !project) return

    // Demo-Regel: der Chat ist überall echt, aber im Beispielprojekt lösen
    // Chat-Bitten keinen Hinweislauf aus (der Seed bleibt unveränderte Demo).
    const istBeispiel = project.id === EXAMPLE_PROJECT_ID
    const hinweisBitte = !istBeispiel && erkenneHinweisBitte(anfrage)
    if (hinweisBitte) starteHinweislauf({ ausloeser: 'chat' })

    const plan = planVerlaufVerdichtung(message.thread, message.verlaufsNotiz || null)
    if (plan) {
      try {
        const { daten } = await runTask('zusammenfassung', { anfrage: plan.verdichtungsEingabe })
        if (typeof daten === 'string' && daten.trim()) {
          message.verlaufsNotiz = { text: daten.trim(), bisMessageId: plan.bisMessageId, erstelltAt: Date.now() }
          ctx.persist()
        }
      } catch {
        // Die Verdichtung ist Komfort: scheitert sie, läuft der Chat mit vollem Verlauf weiter.
      }
    }

    const kontext = baueChatKontext({
      verstaendnis: ensureProjectUnderstanding(project),
      docText: dokumentText(),
      findings: doc.findings,
      doc,
      thread: message.thread.slice(0, -1), // der aktuelle Nutzer-Turn geht separat als `anfrage` mit
      verlaufsNotiz: message.verlaufsNotiz || null,
      anfrage,
      zusatzAnweisung: hinweisBitte
        ? 'Der Nutzer hat um eine Durchsicht gebeten. Ein Hinweislauf über den Text wurde soeben gestartet — erwähne kurz, dass du den Text jetzt durchgehst und dass Hinweise am Rand erscheinen, sobald etwas Belastbares dabei ist.'
        : null,
    })
    await fuehreChatLauf(message.thread, kontext)
  }

  // Echte Initiative-Quelle: Bereich H meldet hier einen Lauf mit neuer Grundursache
  // oder Integritätsthema. hasUnseenInitiative (Aura-Punkt) und scheduleAgentInitiative
  // (Pausen-/Dismiss-Regeln, kein Fokus-Raub) bleiben unverändert.
  export function meldeAgentInitiative(text, { earliestAt = Date.now() } = {}) {
    const workspace = activeWorkspace()
    if (!workspace || typeof text !== 'string' || !text.trim()) return null
    const message = {
      id: `initiative-${Date.now()}-${workspace.agent.messages.length}`,
      text: text.trim(),
      status: 'new',
      earliestAt,
      thread: [],
    }
    workspace.agent.messages.push(message)
    persistWorkspace()
    refreshWorkspace()
    return message
  }
  ```
- [ ] Ersetze in `renderAgentWidget` den kompletten Submit-Handler (~Zeile 1610–1627; nach der Zeile `const reply = 'Beispielreaktion: Dann behandle ich Aufmerksamkeit` suchen). ALT (löschen):
  ```js
  form.addEventListener('submit', event => {
    event.preventDefault()
    const text = input.value.trim()
    if (!text) return
    const at = Date.now()
    appendThreadMessage(message.thread, 'user', text, at)
    const reply = 'Beispielreaktion: Dann behandle ich Aufmerksamkeit im weiteren Text als gestaltete Bedingung und prüfe, wo die Formulierung noch beim Individuum bleibt.'
    appendThreadMessage(
      message.thread,
      'agent',
      reply,
      at + 1,
    )
    input.value = ''
    announceAgentStatus(reply)
    ctx.persist()
    refreshWorkspace()
  })
  ```
  NEU (einfügen):
  ```js
  form.addEventListener('submit', event => {
    event.preventDefault()
    const text = input.value.trim()
    if (!text || laufenderChatLauf) return
    input.value = ''
    const project = ctx.activeProjectObj()
    if (istInterviewOffen(project)) {
      verarbeiteInterviewAntwort(text)
      return
    }
    appendThreadMessage(message.thread, 'user', text, Date.now())
    ctx.persist()
    refreshWorkspace()
    sendeAgentenChat(message, text)
  })
  ```
- [ ] Direkt über dem eben eingefügten `form.addEventListener(...)` steht `send.setAttribute('aria-label', 'Nachricht senden')` — füge danach EINE Zeile ein:
  ```js
  send.disabled = Boolean(laufenderChatLauf)
  ```
- [ ] Ergänze in `instance.destroy` (nach der Zeile `clearTimeout(typingTimer)`, ~Zeile 2171; nach Inhalt suchen):
  ```js
  if (laufenderChatLauf?.flushTimer) clearTimeout(laufenderChatLauf.flushTimer)
  laufenderChatLauf = null
  ```
- [ ] Verifiziere: `cd app && npm test` — erwartetes Ergebnis: alle Suiten grün (59 Tests).
- [ ] Verifiziere: `cd app && npm run build` — erwartetes Ergebnis: esbuild erzeugt `dist/editor.bundle.js` ohne Fehler (Beweis, dass alle Importe `runTask`/`istInterviewOffen`/`verarbeiteInterviewAntwort`/`starteHinweislauf` auflösen).
- [ ] Verifiziere: `grep -c "Beispielreaktion" app/src/workspace.js` — erwartetes Ergebnis: `1` (nur noch die lokale Randkarten-Stelle ~959; sie fällt in Task C-3).
- [ ] Committe: `git add app/src/workspace.js && git commit -m "chat: Agenten-Panel spricht das echte Modell — gestreamte Antworten im Thread, Verlaufs-Verdichtung per Haiku, Hinweis-Bitte startet echten Lauf, meldeAgentInitiative als echte Initiative-Quelle"`

---

### Task C-3: Lokaler Dialog an der Randkarte echt — Finding-Kontext statt Canned-Antwort, Canned restlos entfernt

**Voraussetzung:** Task C-2 (nutzt `fuehreChatLauf`, `dokumentText`, `laufenderChatLauf`).

**Files:**
- Modify: `app/src/workspace.js` — Submit-Handler in `renderLocalDialogue` (~Zeile 953–970, die Zeile mit `'Beispielreaktion: Verstanden. Dann würde ich die Passage …'`; nach Inhalt suchen, Zeilennummern können verschoben sein).
- Test: Verifikation über `npm test`, `npm run build` und grep-Beweis (0 Treffer „Beispielreaktion" in `app/src/`).

**Interfaces:**
- Consumes: `fuehreChatLauf(thread, kontext)`, `dokumentText()`, `laufenderChatLauf` (Task C-2, gleiches Modul); `baueChatKontext` aus `./chat-kontext.mjs`; `ensureProjectUnderstanding` (bereits importiert).
- Produces: nichts Neues nach außen; der lokale Dialog nutzt denselben Chat-Pfad (`runTask('chat')` via `fuehreChatLauf`) mit Finding-Kontext als `zusatzAnweisung`. Identisches Cache-Präfix wie das Panel — Folge-Läufe treffen den Prompt-Cache.

- [ ] Ersetze in `renderLocalDialogue` den kompletten Submit-Handler. ALT (löschen):
  ```js
  form.addEventListener('submit', event => {
    event.preventDefault()
    const text = input.value.trim()
    if (!text) return
    const at = Date.now()
    appendThreadMessage(finding.thread, 'user', text, at)
    const reply = 'Beispielreaktion: Verstanden. Dann würde ich die Passage als gestaltete Bedingung lesen und die Verantwortung des Werkzeugs deutlicher machen.'
    appendThreadMessage(
      finding.thread,
      'agent',
      reply,
      at + 1,
    )
    input.value = ''
    announceAgentStatus(reply)
    ctx.persist()
    refreshWorkspace()
  })
  ```
  NEU (einfügen):
  ```js
  form.addEventListener('submit', event => {
    event.preventDefault()
    const text = input.value.trim()
    if (!text || laufenderChatLauf) return
    input.value = ''
    appendThreadMessage(finding.thread, 'user', text, Date.now())
    ctx.persist()
    refreshWorkspace()

    const doc = ctx.activeDoc()
    const project = ctx.activeProjectObj()
    if (!doc || !project) return
    const findingKontext = [
      'Dieses Gespräch dreht sich um eine konkrete Textstelle mit folgendem Hinweis:',
      `Kategorie: ${finding.category || 'hinweis'}`,
      `Beobachtung: ${finding.short || ''}`,
      finding.target ? `Anker (wörtlich im Text): »${finding.target}«` : '',
      finding.why ? `Relevanz: ${finding.why}` : '',
      'Bleib bei dieser Stelle. Du änderst nie selbst den Text und erfindest keine Quellen.',
    ].filter(Boolean).join('\n')
    const kontext = baueChatKontext({
      verstaendnis: ensureProjectUnderstanding(project),
      docText: dokumentText(),
      findings: doc.findings,
      doc,
      thread: finding.thread.slice(0, -1), // der aktuelle Nutzer-Turn geht separat als `anfrage` mit
      anfrage: text,
      zusatzAnweisung: findingKontext,
    })
    fuehreChatLauf(finding.thread, kontext)
  })
  ```
- [ ] Direkt über dem eben eingefügten `form.addEventListener(...)` steht `send.setAttribute('aria-label', 'Nachricht senden')` (innerhalb von `renderLocalDialogue`) — füge danach EINE Zeile ein:
  ```js
  send.disabled = Boolean(laufenderChatLauf)
  ```
- [ ] Verifiziere: `cd app && npm test` — erwartetes Ergebnis: alle Suiten grün (59 Tests).
- [ ] Verifiziere: `cd app && npm run build` — erwartetes Ergebnis: Bundle baut ohne Fehler.
- [ ] **Grep-Beweis (Abnahmekriterium Bereich C, Punkt 4):** Führe aus: `grep -rn "Beispielreaktion" app/src/` — erwartetes Ergebnis: KEINE Ausgabe, Exit-Code 1 (0 Treffer; die Canned-Antworten sind restlos entfernt).
- [ ] Committe: `git add app/src/workspace.js && git commit -m "chat: lokaler Dialog an der Randkarte echt — gestreamte Antwort mit Finding-Kontext, letzte Beispielreaktion entfernt (grep-Beweis: 0 Treffer)"`

---

### Task C-4: Entscheidungsverlauf sichtbar im Agenten-Panel — zusammenklappbarer Onda-Abschnitt unter den offenen Hinweisen

**Files:**
- Modify: `app/src/workspace-model.mjs` — `ensureWorkspaceState`, Agent-Block (~Zeile 89–99, nach der Zeile `if (typeof agent.open !== 'boolean') agent.open = false`; nach Inhalt suchen).
- Modify: `app/src/workspace.js` — Import ergänzen (~Zeile 1–18), neue Render-Funktion vor `function renderAgentWidget()` (~Zeile 1557), Einhänge-Stelle in `renderAgentWidget` nach `if (unplaced) ui.agentWidget.append(unplaced)` (~Zeile 1586); nach Inhalt suchen, Zeilennummern können verschoben sein.
- Modify: `app/src/style.css` — neuer Block direkt nach der Regel `.unplaced-finding-kind { … }` (~Zeile 2110; nach Inhalt suchen).
- Test: Modify `app/test/workspace-model.test.mjs` (neuer Test für `decisionsOpen`); Anzeige-Logik (`entscheidungsEintraege`) ist bereits durch `app/test/chat-kontext.test.mjs` abgedeckt.

**Interfaces:**
- Consumes: `entscheidungsEintraege(doc, now?)` aus `./chat-kontext.mjs` (Task C-1); `doc.decisions`/`doc.findings` aus `reasoning-model.mjs` (`decideFinding` schreibt `{id, findingId, kind, outcome, reason, appliedText, at}` — bestehende Mechanik, unverändert).
- Produces: `workspace.agent.decisionsOpen: bool` (additiv, tolerant, kein Schema-Bump — Muster wie `accent`); Panel-Abschnitt `.agent-decisions` mit `#agentDecisionsToggle`/`#agentDecisionsList` (nutzbar als Selektoren für den Playwright-Abschluss-Task).

- [ ] **RED — Test ergänzen.** Füge ans Ende von `app/test/workspace-model.test.mjs` an:
  ```js
  test('ensureWorkspaceState ergänzt decisionsOpen additiv und erhält gespeicherte Werte', () => {
    const doc = { workspace: { agent: { messages: [], dismissedIds: [] } } }
    const workspace = ensureWorkspaceState(doc)
    assert.equal(workspace.agent.decisionsOpen, false)

    workspace.agent.decisionsOpen = true
    const wieder = ensureWorkspaceState(doc)
    assert.equal(wieder.agent.decisionsOpen, true)
  })
  ```
- [ ] **RED-Beleg:** Führe aus: `cd app && npm test` — erwartetes Ergebnis: genau dieser eine Test schlägt fehl (`decisionsOpen` ist `undefined` statt `false`), alle übrigen bleiben grün.
- [ ] **GREEN — Model additiv erweitern.** Füge in `app/src/workspace-model.mjs` in `ensureWorkspaceState` direkt nach der Zeile `if (typeof agent.open !== 'boolean') agent.open = false` ein:
  ```js
  if (typeof agent.decisionsOpen !== 'boolean') agent.decisionsOpen = false
  ```
- [ ] **GREEN-Beleg:** Führe aus: `cd app && npm test` — erwartetes Ergebnis: alle Suiten grün (60 Tests).
- [ ] Erweitere in `app/src/workspace.js` den Import aus `./chat-kontext.mjs` (Task C-2) um `entscheidungsEintraege` — der Import-Block lautet danach:
  ```js
  import {
    baueChatKontext,
    chatFehlerText,
    entscheidungsEintraege,
    erkenneHinweisBitte,
    planVerlaufVerdichtung,
  } from './chat-kontext.mjs'
  ```
- [ ] Füge direkt vor `function renderAgentWidget()` (nach den in C-2 eingefügten Funktionen) diese Funktion KOMPLETT ein:
  ```js
  // Entscheidungsverlauf (Spec §6, bisher fehlende Anzeige aus dem Onda-Review):
  // doc.decisions als zusammenklappbarer, ruhiger Abschnitt unter den offenen Hinweisen.
  function renderEntscheidungsverlauf(workspace) {
    const doc = ctx?.activeDoc()
    if (!doc) return null
    const eintraege = entscheidungsEintraege(doc)
    if (!eintraege.length) return null

    const section = createNode('section', 'agent-decisions')
    section.setAttribute('aria-label', 'Entscheidungsverlauf')
    const offen = Boolean(workspace.agent.decisionsOpen)
    const toggle = createNode('button', 'agent-decisions-toggle')
    toggle.type = 'button'
    toggle.id = 'agentDecisionsToggle'
    toggle.setAttribute('aria-expanded', String(offen))
    toggle.setAttribute('aria-controls', 'agentDecisionsList')
    toggle.append(
      createNode('span', 'agent-decisions-title', 'Entscheidungsverlauf'),
      createNode('span', 'onda-badge agent-decisions-count', String(eintraege.length)),
      createNode('span', 'agent-decisions-disclosure', offen ? '↘' : '›'),
    )
    toggle.addEventListener('click', () => {
      workspace.agent.decisionsOpen = !workspace.agent.decisionsOpen
      persistWorkspace()
      refreshWorkspace()
    })
    section.append(toggle)

    if (offen) {
      const list = createNode('div', 'agent-decisions-list')
      list.id = 'agentDecisionsList'
      eintraege.forEach(eintrag => {
        const item = createNode('article', 'agent-decision')
        item.dataset.decisionId = eintrag.id
        const meta = createNode('div', 'agent-decision-meta')
        meta.append(
          createNode('span', `agent-decision-label is-${eintrag.art}`, eintrag.label),
          createNode('span', 'agent-decision-date', eintrag.datumText),
        )
        item.append(meta, createNode('p', 'agent-decision-short', eintrag.kurztext))
        if (eintrag.begruendung) {
          item.append(createNode('p', 'agent-decision-reason', `Begründung: ${eintrag.begruendung}`))
        }
        list.append(item)
      })
      section.append(list)
    }
    return section
  }
  ```
- [ ] Hänge den Abschnitt in `renderAgentWidget` ein: direkt nach den beiden Zeilen `const unplaced = renderUnplacedFindingList()` / `if (unplaced) ui.agentWidget.append(unplaced)` (und VOR dem Block `if (!message) { … }`, damit der Verlauf auch ohne Gespräch sichtbar ist) einfügen:
  ```js
  const decisions = renderEntscheidungsverlauf(workspace)
  if (decisions) ui.agentWidget.append(decisions)
  ```
- [ ] Füge in `app/src/style.css` direkt nach der Regel `.unplaced-finding-kind { … }` diesen Block ein (nur bestehende Onda-Tokens):
  ```css
  .agent-decisions {
    flex: none;
    border-bottom: 1px solid var(--border-subtle);
    background: var(--surface-2);
  }

  .agent-decisions-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 16px;
    border: 0;
    background: transparent;
    color: var(--text-secondary);
    font: var(--fw-semibold) 11.5px/1.35 var(--font-sans);
    text-align: left;
    cursor: pointer;
    transition: color var(--dur-quick) var(--ease-out), background var(--dur-quick) var(--ease-out);
  }

  .agent-decisions-toggle:hover { color: var(--text-primary); background: var(--bg-hover); }

  .agent-decisions-toggle:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .agent-decisions-title { flex: 1; }

  .agent-decisions-disclosure {
    color: var(--text-tertiary);
    font: 13px/1 var(--font-sans);
  }

  .agent-decisions-list {
    max-height: 220px;
    overflow-y: auto;
    overscroll-behavior: contain;
    display: grid;
    gap: 10px;
    padding: 2px 16px 13px;
    scrollbar-width: thin;
  }

  .agent-decision { display: grid; gap: 2px; }

  .agent-decision-meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .agent-decision-label {
    color: var(--text-secondary);
    font: var(--fw-semibold) 10.5px/1.35 var(--font-sans);
  }

  .agent-decision-label.is-risiko { color: var(--warning); }
  .agent-decision-label.is-verworfen { color: var(--text-tertiary); }
  .agent-decision-label.is-angenommen,
  .agent-decision-label.is-eigene { color: var(--success); }

  .agent-decision-date {
    flex: none;
    color: var(--text-tertiary);
    font: 10.5px/1.35 var(--font-sans);
  }

  .agent-decision-short {
    margin: 0;
    color: var(--text-primary);
    font: 12.5px/1.45 var(--font-sans);
    overflow-wrap: anywhere;
  }

  .agent-decision-reason {
    margin: 0;
    color: var(--text-secondary);
    font: 11.5px/1.4 var(--font-sans);
  }
  ```
- [ ] Verifiziere: `cd app && npm test` — erwartetes Ergebnis: alle Suiten grün (60 Tests).
- [ ] Verifiziere: `cd app && npm run build` — erwartetes Ergebnis: Bundle baut ohne Fehler.
- [ ] Sichtprüfung (Abnahmekriterium 9 der Spec): `app/index.html` im Browser öffnen, im Beispielprojekt einen Passage-Hinweis annehmen oder verwerfen, dann die Aura anklicken — erwartetes Ergebnis: im Agenten-Panel erscheint unter den Hinweisen der Abschnitt „Entscheidungsverlauf" mit Zähler; Aufklappen zeigt Eintrag mit relativem Datum („gerade eben"), Hinweis-Kurztext und Entscheidungs-Label; bei einer Risiko-Entscheidung zusätzlich die Begründung.
- [ ] Committe: `git add app/src/workspace-model.mjs app/src/workspace.js app/src/style.css app/test/workspace-model.test.mjs && git commit -m "agent: Entscheidungsverlauf endlich sichtbar — zusammenklappbarer Onda-Abschnitt im Panel mit relativem Datum, Entscheidungsart und Risiko-Begründung"`

---

**Hinweise für die Plan-Zusammenführung (Bereich C):**
- Reihenfolge: C-1 ist unabhängig und kann sofort laufen; C-2 benötigt die Tasks aus Bereich G (`agent-gateway.mjs`), H (`starteHinweislauf`) und V (`istInterviewOffen`, `verarbeiteInterviewAntwort`); C-3 und C-4 bauen auf C-2 auf (C-4 nur wegen des gemeinsamen Import-Blocks — notfalls mit eigenem Import-Statement vorziehbar).
- Kontext-Vertrag für Bereich T (agent-tasks): `baueAnfrage('chat', kontext)` und `baueAnfrage('zusammenfassung', kontext)` müssen die in Task C-1 produzierte Kontext-Form `{verstaendnis, docText, offeneHinweise, entscheidungen, verlauf, anfrage, zusatzAnweisung}` konsumieren (Cache-Präfix aus `verstaendnis`+`docText`, Volatiles ohne `cache_control`, `verlauf` als weitere messages; `zusammenfassung` nutzt nur `anfrage`).
- Bereich H konsumiert aus C-2: `meldeAgentInitiative(text, { earliestAt }?)` (Export aus `app/src/workspace.js`) als einzige Stelle, die echte Initiative-Nachrichten erzeugt.
- Der Playwright-Abschluss-Task kann die Selektoren `#agentDecisionsToggle`, `#agentDecisionsList`, `.agent-decisions` und den gemockten `sende()`-Transport für einen Chat-Streaming-Smoke nutzen.

---

## Bereich F — Abschluss (Smoke, Gesamtlauf, Abnahme, Doku)

### Task F-1: Playwright installieren + Transport-Injektionspunkt am Fenster
**Files:**
- Modify: `app/package.json` (devDependencies — ausschließlich über npm-Befehl, kein Hand-Edit)
- Modify: `app/src/editor.js` (~Zeile 80, bei `export { __workspaceTestBridge }` — nach Inhalt suchen, Zeilennummern können verschoben sein)
- Test: `app/dist/editor.bundle.js` (Bundle-Prüfung per grep)

**Interfaces:**
- Consumes: `setzeTransportFuerTests(transport)` — benannter Export aus `app/src/agent-gateway.mjs` (Bereich T; ersetzt den per `waehleTransport()` gewählten Transport, `setzeTransportFuerTests(null)` stellt die Automatik wieder her).
- Produces: `window.AIWT.setzeTransportFuerTests(transport)` (esbuild `--global-name=AIWT` legt alle `editor.js`-Exporte auf `window.AIWT`) — wird von Task F-2 konsumiert.

- [ ] Prüfen, dass Bereich T fertig ist: `grep -n "export function setzeTransportFuerTests" "/Users/jakobschlenker/Documents/AI Writing Tool/app/src/agent-gateway.mjs"` — erwartet: genau ein Treffer. Falls 0 Treffer: STOPP, erst Bereich T abschließen.
- [ ] Playwright als lokale Dev-Abhängigkeit installieren (benötigt Netz): `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm i -D playwright` — erwartet: Exit 0, `playwright` erscheint in `package.json` unter `devDependencies`.
- [ ] Chromium-Browser für Playwright laden (benötigt Netz, ~150 MB): `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npx playwright install chromium` — erwartet: Exit 0.
- [ ] In `app/src/editor.js` direkt unter der Zeile `export { __workspaceTestBridge }` einfügen:
  ```js
  // Testbrücke Etappe A: erlaubt dem Smoke-Test, den LLM-Transport zu ersetzen.
  // Der Ersatz betrifft nur das Netz — Verteiler, Verifikation und UI-Logik bleiben echt.
  export { setzeTransportFuerTests } from './agent-gateway.mjs'
  ```
- [ ] Bundle bauen: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm run build` — erwartet: Exit 0.
- [ ] Export im Bundle nachweisen: `grep -c "setzeTransportFuerTests" "/Users/jakobschlenker/Documents/AI Writing Tool/app/dist/editor.bundle.js"` — erwartet: Zahl ≥ 1.
- [ ] Unit-Bestand unberührt: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` — erwartet: `# fail 0`.
- [ ] Commit: `git add app/package.json app/package-lock.json app/src/editor.js app/dist/editor.bundle.js && git commit -m "test: Playwright lokal installiert + Transport-Injektionspunkt window.AIWT.setzeTransportFuerTests"`

---

### Task F-2: Smoke-Abschnitt „Agent echt" + Anpassung der Alt-Abschnitte an den echten Chat
**Files:**
- Modify: `app/test/v2-smoke.mjs` — vier Stellen (nach Inhalt suchen, Zeilennummern können verschoben sein):
  1. Hilfsfunktionen nach `openExample` (~Zeile 54),
  2. `runTask6DialogueAndEvidence` (~Zeile 1611: Chat-Asserts ~1664–1672, Lokal-Dialog ~1710–1717, nach beiden Reloads ~1677/~1729),
  3. `runTask6Mobile` (~Zeile 1833) und `runTask6InitiativeAndLifecycle` (~Zeile 1929): Mock-Installation nach `openExample`,
  4. Runner-Liste (~Zeile 2607): neuen Abschnitt registrieren.

**Interfaces:**
- Consumes (Bereich T/G): `window.AIWT.setzeTransportFuerTests(transport)` aus Task F-1; Transport-Vertrag `sende(anfrage, handlers)` mit `handlers={onDelta?(text), onFertig({text,usage,stopReason}), onFehler({typ,nachricht})}`; `anfrage={url,headers,body,stream}` aus `baueAnfrage` (Task-Erkennung: `body.output_config.format.schema.properties.hinweise` → hinweise, `...properties.antwortText` → verstaendnis, `body.stream===true` → chat); Fehler-Typ `'kein-schluessel'`; Usage-Zählung in `settings.usage`.
- Consumes (Bereich R): verifizierter Hinweis wird Finding mit `placement:'passage'`, `target`=`vorschlag.bisher`, `action`=`vorschlag.neu`; Annahme erzeugt `doc.decisions`-Eintrag `kind:'accept'`.
- Consumes (Bereich W — hier verbindlich vereinbarte DOM-Selektoren, W muss exakt diese liefern): `#agentStatusLine` (Offline-Statuszeile im Agenten-Panel, Text wörtlich „Agent ist offline — dein Text ist davon unberührt"), `#decisionLog` mit Einträgen `.decision-entry` (Entscheidung „accept" wird als Label „Übernommen" gerendert), Klasse `has-unseen` auf `#ondaAura`, `announceAgentStatus` weiterhin für fertige Agenten-Antworten (`#agentLiveStatus`).
- Produces: `installiereTransportMock(page)` und `runEtappeAAgentEcht(browser)` in `app/test/v2-smoke.mjs`.

- [ ] RED-Beleg festhalten (die Kulisse ist weg, alte Asserts erwarten sie noch): Server starten und Smoke laufen lassen —
  ```bash
  cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm run build
  cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && (python3 -m http.server 4173 --bind 127.0.0.1 >/tmp/aiwt-http.log 2>&1 & echo $! > /tmp/aiwt-http.pid)
  cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && node test/v2-smoke.mjs
  ```
  Erwartet: Fehlschlag in `runTask6DialogueAndEvidence` (Timeout/AssertionError bei `/Beispielreaktion/`). Fehlermeldung als RED-Beleg notieren. (Server für die folgenden Schritte laufen lassen.)
- [ ] In `app/test/v2-smoke.mjs` direkt nach der Funktion `openExample` einfügen:
  ```js
  const MOCK_USAGE = {
    input_tokens: 1200,
    output_tokens: 500,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 900,
  }

  async function installiereTransportMock(page) {
    await page.evaluate(mockUsage => {
      window.__llmMock = {
        aufrufe: { verstaendnis: 0, hinweise: 0, chat: 0, sonstige: 0 },
        naechsterFehler: null,
        chatGate: false,
        weiterStreamen: null,
      }
      const taskVon = anfrage => {
        const schema = anfrage?.body?.output_config?.format?.schema
        if (schema?.properties?.hinweise) return 'hinweise'
        if (schema?.properties?.antwortText) return 'verstaendnis'
        if (anfrage?.body?.stream === true) return 'chat'
        return 'sonstige'
      }
      window.AIWT.setzeTransportFuerTests({
        sende(anfrage, handlers) {
          if (window.__llmMock.naechsterFehler) {
            const fehler = window.__llmMock.naechsterFehler
            setTimeout(() => handlers.onFehler(fehler), 0)
            return
          }
          const task = taskVon(anfrage)
          window.__llmMock.aufrufe[task] += 1
          if (task === 'hinweise') {
            const text = JSON.stringify({
              hinweise: [
                {
                  kategorie: 'sprache',
                  anker: 'zeigt eindeutig, dass alle Leser zustimmen',
                  beobachtung: 'Absolute Formulierung ohne Beleg.',
                  relevanz: 'Der Ton behauptet, statt zu begründen.',
                  folge: 'Leser können die Aussage als übertrieben abtun.',
                  vorschlag: { bisher: 'zeigt eindeutig', neu: 'legt nahe' },
                  istGrundursache: true,
                  integritaet: false,
                },
                {
                  kategorie: 'logik',
                  anker: 'Dieser Satz existiert nirgendwo im Dokument.',
                  beobachtung: 'Erfundener Anker - muss clientseitig verworfen werden.',
                  relevanz: 'Prüft die Anker-Verifikation.',
                  folge: 'Darf nie als Randkarte erscheinen.',
                  vorschlag: null,
                  istGrundursache: false,
                  integritaet: true,
                },
              ],
            })
            setTimeout(() => handlers.onFertig({ text, usage: mockUsage, stopReason: 'end_turn' }), 0)
            return
          }
          if (task === 'verstaendnis') {
            const text = JSON.stringify({
              task: 'Kurzer Sachtext zur Studienlage',
              audience: 'Interessierte Laien',
              desiredEffect: 'Nüchtern informieren',
              evidenceStandard: 'Belege für Tatsachenbehauptungen',
              protectedIntentions: [],
              openQuestions: ['Welche Studie ist gemeint?'],
              antwortText: 'Worum soll es in diesem Text gehen?',
            })
            setTimeout(() => handlers.onFertig({ text, usage: mockUsage, stopReason: 'end_turn' }), 0)
            return
          }
          if (task === 'chat') {
            const abschliessen = () => {
              handlers.onDelta('und der zweite Teil.')
              handlers.onFertig({
                text: 'Mock-Antwort: erster Teil der Antwort und der zweite Teil.',
                usage: mockUsage,
                stopReason: 'end_turn',
              })
            }
            setTimeout(() => {
              handlers.onDelta('Mock-Antwort: erster Teil der Antwort ')
              if (window.__llmMock.chatGate) window.__llmMock.weiterStreamen = abschliessen
              else abschliessen()
            }, 0)
            return
          }
          setTimeout(() => handlers.onFertig({ text: 'Routine-Antwort', usage: mockUsage, stopReason: 'end_turn' }), 0)
        },
      })
    }, MOCK_USAGE)
  }
  ```
- [ ] `runTask6DialogueAndEvidence` anpassen: direkt nach `await openExample(page)` die Zeile `await installiereTransportMock(page)` einfügen; ebenso nach **jedem** `await openExample(page, false)` innerhalb dieser Funktion (zwei Stellen, nach den beiden Reloads).
- [ ] In `runTask6DialogueAndEvidence` die Zeile `assert.ok((await widget.locator('.agent-message').count()) >= 3)` ersetzen durch:
  ```js
  await page.waitForFunction(() => (document.getElementById('agentWidget')?.textContent || '')
    .includes('Mock-Antwort: erster Teil der Antwort und der zweite Teil.'))
  assert.ok((await widget.locator('.agent-message').count()) >= 3)
  ```
- [ ] In `runTask6DialogueAndEvidence` die beiden Zeilen mit `/Beispielreaktion/` (waitForFunction auf `#agentLiveStatus` + `assert.match`) ersetzen durch:
  ```js
  await page.waitForFunction(() => /Mock-Antwort/.test(document.getElementById('agentLiveStatus')?.textContent || ''))
  assert.match(await page.locator('#agentLiveStatus').textContent(), /Mock-Antwort/)
  ```
- [ ] In `runTask6DialogueAndEvidence` die Zeile `assert.match(await localDialogue.textContent(), /Beispielreaktion/i)` ersetzen durch:
  ```js
  await page.waitForFunction(() => /Mock-Antwort/.test(document.querySelector('.local-dialogue')?.textContent || ''))
  assert.match(await localDialogue.textContent(), /Mock-Antwort/)
  ```
- [ ] In `runTask6Mobile` und `runTask6InitiativeAndLifecycle` jeweils direkt nach `await openExample(page)` die Zeile `await installiereTransportMock(page)` einfügen (die dortigen Dialog-Eingaben laufen jetzt über den echten Gateway-Pfad).
- [ ] Neuen Abschnitt vor der Zeile `const browser = await chromium.launch({ headless: true })` einfügen:
  ```js
  async function runEtappeAAgentEcht(browser) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    const errors = []
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', error => errors.push(error.message))
    await openExample(page)
    await installiereTransportMock(page)

    // Echtes (Nicht-Demo-)Projekt: Interview + Hinweis-Läufe sind nur hier freigeschaltet
    await page.evaluate(() => {
      window.AIWT.newProject('Agent echt')
      window.AIWT.newDoc()
      window.AIWT.state.editor.commands.setContent(
        '<p>Die Studie zeigt eindeutig, dass alle Leser zustimmen.</p><p>Ein zweiter Absatz stützt die Struktur.</p>',
        true,
      )
      document.getElementById('title').value = 'Agent echt'
      window.AIWT.persist()
    })

    // Pause simulieren: Tippen, dann Ruhe - der echte (gemockte) Hinweis-Lauf läuft an
    await page.evaluate(() => {
      const blocks = window.AIWT.__blockIdentityTestBridge.getBlocks()
      const block = blocks.at(-1)
      window.AIWT.state.editor.commands.setTextSelection(block.pos + block.nodeSize - 1)
      window.AIWT.state.editor.view.focus()
    })
    await page.keyboard.type(' Noch ein Satz.')
    await page.waitForFunction(
      () => document.querySelectorAll('#localAgentLayer .local-finding[data-finding-id]').length > 0,
      null,
      { timeout: 20000 },
    )

    // Genau EIN Hinweis: der zweite Mock-Hinweis hat einen erfundenen Anker und wurde still verworfen
    assert.equal(await page.locator('#localAgentLayer .local-finding[data-finding-id]').count(), 1)
    assert.ok(await page.evaluate(() => window.__llmMock.aufrufe.hinweise >= 1))
    assert.doesNotMatch(
      await page.locator('#localAgentLayer').textContent(),
      /existiert nirgendwo/,
    )

    // Grundursache aus echtem Lauf -> Initiative-Punkt an der Aura (Quelle echt, Gate unverändert)
    assert.equal(await page.locator('#ondaAura').evaluate(node => node.classList.contains('has-unseen')), true)

    // Detail zeigt Beobachtung/Relevanz/Folge aus der Mock-Antwort
    const karte = page.locator('#localAgentLayer .local-finding[data-finding-id]')
    const findingId = await karte.getAttribute('data-finding-id')
    const summary = karte.locator('.local-finding-summary')
    await summary.focus()
    await page.keyboard.press('Enter')
    await expectVisible(karte.locator('.local-finding-detail'))
    assert.match(await karte.textContent(), /Absolute Formulierung ohne Beleg\./)
    assert.match(await karte.textContent(), /Der Ton behauptet, statt zu begründen\./)

    // Übernehmen ändert den Text exakt an der Ankerstelle
    await page.keyboard.press('Enter')
    const vorschlag = page.locator('#localAgentLayer .local-suggestion')
    await expectVisible(vorschlag)
    await vorschlag.getByRole('button', { name: 'Übernehmen', exact: true }).click()
    const editorText = await page.locator('#editor .ProseMirror').textContent()
    assert.match(editorText, /Die Studie legt nahe, dass alle Leser zustimmen\./)
    assert.doesNotMatch(editorText, /zeigt eindeutig/)

    // Entscheidung gespeichert und im Agenten-Panel sichtbar
    const entscheidung = await page.evaluate(id => {
      const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
      return doc.decisions.find(candidate => candidate.findingId === id) || null
    }, findingId)
    assert.equal(entscheidung?.kind, 'accept')
    await page.locator('#ondaAura').click()
    await expectVisible(page.locator('#agentWidget'))
    await page.waitForFunction(() => (document.getElementById('agentWidget')?.textContent || '')
      .includes('Worum soll es in diesem Text gehen?'))
    await expectVisible(page.locator('#decisionLog'))
    assert.equal(await page.locator('#decisionLog .decision-entry').count(), 1)
    assert.match(await page.locator('#decisionLog .decision-entry').textContent(), /Übernommen/)

    // Verbrauch wurde aus der Mock-Usage gezählt (Vorprüfung Abnahmekriterium 8)
    const usage = await page.evaluate(() => window.AIWT.state.settings.usage)
    assert.ok(usage.inputTokens >= 1200, JSON.stringify(usage))
    assert.ok(usage.outputTokens >= 500, JSON.stringify(usage))
    assert.ok(usage.kostenCents > 0, JSON.stringify(usage))

    // Chat streamt sichtbar in den Thread; der Editor bleibt unberührt
    const editorHtmlVorChat = await page.evaluate(() => window.AIWT.state.editor.getHTML())
    await page.evaluate(() => { window.__llmMock.chatGate = true })
    const widget = page.locator('#agentWidget')
    const eingabe = widget.locator('input')
    await eingabe.focus()
    await eingabe.fill('Wie wirkt der Einstieg?')
    await eingabe.press('Enter')
    await page.waitForFunction(() => {
      const text = document.getElementById('agentWidget')?.textContent || ''
      return text.includes('Mock-Antwort: erster Teil der Antwort') && !text.includes('zweite Teil')
    })
    await page.evaluate(() => window.__llmMock.weiterStreamen())
    await page.waitForFunction(() => (document.getElementById('agentWidget')?.textContent || '')
      .includes('Mock-Antwort: erster Teil der Antwort und der zweite Teil.'))
    assert.equal(await page.evaluate(() => window.AIWT.state.editor.getHTML()), editorHtmlVorChat)
    assert.doesNotMatch(await widget.textContent(), /Beispielreaktion/)

    // Offline-Fall: kein-schluessel -> ruhige Statuszeile, kein Modal, Editor voll nutzbar
    await page.evaluate(() => {
      window.__llmMock.chatGate = false
      window.__llmMock.naechsterFehler = { typ: 'kein-schluessel', nachricht: 'Kein API-Schlüssel hinterlegt.' }
    })
    await eingabe.fill('Bist du noch da?')
    await eingabe.press('Enter')
    await page.waitForFunction(() => {
      const zeile = document.getElementById('agentStatusLine')
      return zeile && !zeile.hidden && /Agent ist offline/.test(zeile.textContent)
    })
    assert.match(
      await page.locator('#agentStatusLine').textContent(),
      /Agent ist offline — dein Text ist davon unberührt/,
    )
    const sichtbareModale = await page.evaluate(() => [...document.querySelectorAll('[role="dialog"]')]
      .filter(node => !node.hidden && node.offsetParent !== null).length)
    assert.equal(sichtbareModale, 0)
    await page.keyboard.press('Escape')
    await page.evaluate(() => {
      const blocks = window.AIWT.__blockIdentityTestBridge.getBlocks()
      const block = blocks.at(-1)
      window.AIWT.state.editor.commands.setTextSelection(block.pos + block.nodeSize - 1)
      window.AIWT.state.editor.view.focus()
    })
    await page.keyboard.type(' Offline weitergeschrieben.')
    assert.match(await page.evaluate(() => window.AIWT.state.editor.getHTML()), /Offline weitergeschrieben\./)
    await page.evaluate(() => window.AIWT.flushSave())
    const offlinePersistiert = await page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem('aiwt.v2'))
      return stored.docs.some(doc => doc.body?.includes('Offline weitergeschrieben.'))
    })
    assert.equal(offlinePersistiert, true)

    // DEMO-REGEL: Im Beispielprojekt lösen Tippen + Pause KEINEN Hinweis-Lauf und KEIN Interview aus
    await page.evaluate(() => {
      window.__llmMock.naechsterFehler = null
      const seed = window.AIWT.state.docs.find(doc => doc.exampleSeed === true)
      window.AIWT.openDoc(seed.id)
    })
    await page.evaluate(() => {
      window.__llmMock.aufrufe.hinweise = 0
      window.__llmMock.aufrufe.verstaendnis = 0
      const blocks = window.AIWT.__blockIdentityTestBridge.getBlocks()
      const block = blocks.at(-1)
      window.AIWT.state.editor.commands.setTextSelection(block.pos + block.nodeSize - 1)
      window.AIWT.state.editor.view.focus()
    })
    await page.keyboard.type('y')
    await page.waitForTimeout(6000)
    assert.equal(await page.evaluate(() => window.__llmMock.aufrufe.hinweise), 0)
    assert.equal(await page.evaluate(() => window.__llmMock.aufrufe.verstaendnis), 0)

    await page.screenshot({ path: `${screenshotDir}/aiwt-v2-etappe-a-agent-echt.png`, fullPage: true })
    assert.deepEqual(errors, [])
    await page.close()
  }
  ```
- [ ] Im Runner-Block nach `await runTask6InitiativeAndLifecycle(browser)` die Zeile `await runEtappeAAgentEcht(browser)` einfügen.
- [ ] GREEN-Beleg: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm run build && node test/v2-smoke.mjs` — erwartet: `V2 smoke passed` und Datei `/tmp/aiwt-v2-etappe-a-agent-echt.png` existiert (`ls -la /tmp/aiwt-v2-etappe-a-agent-echt.png`).
- [ ] Server stoppen: `kill $(cat /tmp/aiwt-http.pid) && rm /tmp/aiwt-http.pid`
- [ ] Commit: `git add app/test/v2-smoke.mjs && git commit -m "test(smoke): Abschnitt Agent echt — gemockter Transport, Randkarte, Übernehmen, Entscheidungsverlauf, Chat-Streaming, Offline-Würde, Demo-Regel"`

---

### Task F-3: Unit-Gesamtlauf — alle alten und neuen Suiten grün, Zählung dokumentiert
**Files:**
- Test: `app/test/*.test.mjs` (nur Ausführung; Reparaturen gehören in den jeweils verursachenden Bereich)

**Interfaces:**
- Consumes: die neuen Suiten der Bereiche — `app/test/agent-tasks.test.mjs`, `app/test/anchor-verify.test.mjs`, `app/test/agent-transport.test.mjs`, `app/test/agent-gateway.test.mjs` — zusätzlich zu den bestehenden `example-seed.test.mjs`, `reasoning-model.test.mjs`, `settings-model.test.mjs`, `workspace-model.test.mjs`.
- Produces: dokumentierte Soll-Zählung als Regressionsanker für Etappe B (in der Commit-Message).

- [ ] Vollständigkeit der neuen Suiten prüfen: `ls "/Users/jakobschlenker/Documents/AI Writing Tool/app/test/"` — erwartet: mindestens die vier neuen Dateien `agent-tasks.test.mjs`, `anchor-verify.test.mjs`, `agent-transport.test.mjs`, `agent-gateway.test.mjs` neben den vier bestehenden plus `v2-smoke.mjs`. Fehlt eine: STOPP, zuständigen Bereich abschließen.
- [ ] Gesamtlauf: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` — erwartet: Exit 0, Ausgabe enthält `# fail 0` und `# cancelled 0`; `# pass` ist mindestens 46 (Altbestand) plus die neuen Tests.
- [ ] Zählung aus der Ausgabe ablesen und notieren: Werte hinter `# tests`, `# pass`, `# fail` sowie Anzahl der Testdateien (erwartet 8).
- [ ] Gegenprobe Bestandsschutz: in der Ausgabe darf keine der vier alten Suiten Fehlschläge zeigen (Suchbegriff `failing` liefert keine Treffer: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test 2>&1 | grep -c "failing"` — erwartet: `0`).
- [ ] Commit (Zahlen X/Y durch die tatsächlich abgelesenen Werte ersetzen): `git commit --allow-empty -m "test: Etappe A Unit-Gesamtlauf grün — 8 Suiten, X Tests, Y pass, 0 fail (Altbestand 46 enthalten)"`

---

### Task F-4: CONTEXT.md — Etappe-A-Abschnitt (was echt ist, Schlüssel-Ort, Grenzen bis Etappe B)
**Files:**
- Modify: `CONTEXT.md` (~Zeile 116 „## Verifikation" und ~Zeile 130 „## Noch nicht verbunden" — nach Inhalt suchen, Zeilennummern können verschoben sein)

**Interfaces:**
- Consumes: Modul-/Speichernamen aus dem Gesamtvertrag (`agent-gateway.mjs`, `agent-tasks.mjs`, `anchor-verify.mjs`, Keychain-Dienst `Schreibwerkzeug`/Konto `anthropic-api-key`, `localStorage`-Schlüssel `aiwt.apikey`, `settings.usage`, `EXAMPLE_PROJECT_ID 'p-example'`).
- Produces: verbindliche Projektbeschreibung des Ist-Zustands nach Etappe A (Referenz für Etappe-B-Planung).

- [ ] In `CONTEXT.md` unmittelbar VOR der Zeile `## Verifikation` folgenden neuen Abschnitt einfügen (Schreibweise mit ae/oe/ue wie im Rest der Datei; woertliche UI-Zitate bleiben exakt):
  ```md
  ## Etappe A: Echter KI-Anschluss

  Seit Etappe A ist der Agent echt. Jeder KI-Aufruf laeuft durch den Verteiler
  `app/src/agent-gateway.mjs` mit statischer Task-zu-Modell-Tabelle in
  `app/src/agent-tasks.mjs`: Sichtbares (Projektverstaendnis, Hinweise, Chat)
  laeuft auf `claude-opus-5`, unsichtbare Routine (Titel, Zusammenfassung) auf
  `claude-haiku-4-5`. Hinweise und Verstaendnis kommen als schema-erzwungenes
  JSON. Jeder Hinweis-Anker wird clientseitig verifiziert
  (`app/src/anchor-verify.mjs`): exakt, dann normalisiert, sonst still
  verworfen — die App zeigt nie Hinweise mit erfundenen Zitaten und erfindet
  nie Quellenangaben.

  Wo der Schluessel wohnt:

  - Mac-App: ausschliesslich im macOS-Schluesselbund (Dienst
    `Schreibwerkzeug`, Konto `anthropic-api-key`). Die Swift-Bruecke setzt ihn
    serverseitig in die Anfrage ein; er wird nie an den JS-Kontext
    zurueckgegeben, nur der Status vorhanden ja/nein.
  - Browser (Entwickler-/Rueckfallpfad): `localStorage`-Schluessel
    `aiwt.apikey`, getrennt von `aiwt.v2`; er taucht in keinem Export auf.

  Der Nutzer traegt den Schluessel immer selbst in den Einstellungen ein;
  Pflichtschritt der Anleitung ist ein hartes Ausgabenlimit im
  Anbieter-Konto. Der Monatsverbrauch wird additiv in `settings.usage`
  gezaehlt (Tokens plus Kosten-Schaetzung aus Preiskonstanten in
  `agent-tasks.mjs`, Momentaufnahme 07/2026, regelmaessig pruefen).

  Demo-Grenze: Im markierten Beispielprojekt (`p-example`) laufen weder
  automatische Hinweis-Laeufe noch das Interview — der Seed bleibt Demo.
  Der Chat ist ueberall echt. Ohne Schluessel oder Netz zeigt das
  Agenten-Panel nur die ruhige Statuszeile "Agent ist offline — dein Text ist
  davon unberührt"; Schreiben, Speichern und Export sind nie blockiert.

  Bekannte Grenzen bis Etappe B: keine echte Webrecherche, kein
  Quellenimport, keine Belegbuendel und keine Zitierpruefung. Die Kategorien
  Fakt/Quelle benennen nur, DASS ein Beleg fehlt. Das Belegfenster zeigt in
  echten Projekten nur den Hinweis-Kontext; Demo-Quellen bleiben exklusiv im
  Beispielprojekt.
  ```
- [ ] Im Abschnitt „## Verifikation" den Befehlsblock ersetzen — alt:
  ```bash
  npm test
  npm run build
  NODE_PATH="/Users/jakobschlenker/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules" node test/v2-smoke.mjs
  ```
  neu:
  ```bash
  npm test
  npm run build
  node test/v2-smoke.mjs   # benoetigt einen statischen Server auf http://127.0.0.1:4173/
  ```
  und direkt unter dem Block den Satz ergaenzen: `Playwright ist seit Etappe A lokale Dev-Abhaengigkeit (npm install genuegt; der Browser kommt einmalig per npx playwright install chromium). Der Smoke enthaelt zusaetzlich den Abschnitt "Agent echt": gemockter Transport auf sende()-Ebene, echte Produktlogik darueber — Randkarte, Uebernehmen, Entscheidungsverlauf, Chat-Streaming, Offline-Statuszeile und Demo-Regel.`
- [ ] Im Abschnitt „## Noch nicht verbunden" den letzten Absatz (beginnt mit „Aktuelle Agentenantworten, Quellen und Recherchehinweise …") ersetzen durch:
  ```md
  Agentenantworten, Hinweise und das Projektverstaendnis sind seit Etappe A
  echt (Anthropic-API). Demo-Quellen und Demo-Hinweise existieren nur noch im
  markierten Beispielprojekt. Recherche- und Quellenangaben ausserhalb des
  Beispielprojekts entstehen erst mit Etappe B — bis dahin benennt die App
  nur, dass Belege fehlen, und erfindet keine.
  ```
- [ ] Formale Pruefung: `cd "/Users/jakobschlenker/Documents/AI Writing Tool" && git diff --check` — erwartet: keine Ausgabe.
- [ ] Commit: `git add CONTEXT.md && git commit -m "docs: CONTEXT um Etappe A ergaenzt — echter Anschluss, Schluessel-Orte, Demo-Grenze, Grenzen bis Etappe B"`

---

### Task F-5: Abnahme-Durchlauf — die 10 Kriterien aus Spec §9 (Mock-Vorprüfung + Live-Teil mit Nutzer)
**Files:**
- Test: keine neuen Dateien — Durchführung gegen `http://127.0.0.1:4173/` (Browser) und `Schreibwerkzeug.app` (Mac); Belege: Smoke-Ausgabe, Screenshots in `/tmp/`, Terminal-Ausgaben.

**Interfaces:**
- Consumes: alles aus F-1 bis F-4, die gebaute Mac-App aus Bereich S (`mac/build.sh`), die Einstellungen-Oberfläche aus Bereich W/U.
- Produces: dokumentiertes Abnahme-Ergebnis (Commit-Message) als Abschluss-Beleg der Etappe A.

- [ ] Vorbereitung: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm run build && (python3 -m http.server 4173 --bind 127.0.0.1 >/tmp/aiwt-http.log 2>&1 & echo $! > /tmp/aiwt-http.pid)`; Mac-App-Build prüfen: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/mac" && ./build.sh` — erwartet: Exit 0.
- [ ] **Kriterium 1 — Einrichtung** (Browser-Teil ohne Schlüssel): `http://127.0.0.1:4173/` öffnen, Einstellungen aufrufen. Erwartet: Schlüssel-Status „fehlt", Eingabefeld für den eigenen Schlüssel, Schritt-für-Schritt-Anleitung inkl. Ausgabenlimit-Hinweis, Modell-Anzeige aus der Tabelle, Monatsverbrauch bei 0. Mac-Teil **mit Nutzer gemeinsam**: Nutzer trägt seinen Schlüssel in der Mac-App selbst ein; danach zeigt der Status „gesetzt (Schlüsselbund)"; Kontrolle ohne Wertausgabe: `security find-generic-password -s Schreibwerkzeug -a anthropic-api-key` — erwartet: Eintrag gefunden. Der Schlüssel wird zu keinem Zeitpunkt von uns angefasst oder angezeigt.
- [ ] **Kriterium 4 — Kein erfundener Anker** (ohne Schlüssel): Beleg 1: `cd "/Users/jakobschlenker/Documents/AI Writing Tool/app" && npm test` grün (anchor-verify-Suite deckt exakt/normalisiert/verworfen ab). Beleg 2: Smoke-Abschnitt „Agent echt" — der Mock liefert einen zweiten Hinweis mit erfundenem Anker, sichtbar wird genau eine Randkarte.
- [ ] **Kriterium 7 — Offline-Würde** (ohne Schlüssel): Im Browser ohne hinterlegten Schlüssel eine Chat-Nachricht senden. Erwartet: ruhige Statuszeile „Agent ist offline — dein Text ist davon unberührt" im Agenten-Panel, kein Modal, Tippen/Speichern/Export funktionieren unverändert. Mac-Teil **mit Nutzer gemeinsam**: WLAN trennen, gleiches Verhalten beobachten.
- [ ] **Kriterium 9 — Entscheidungsverlauf** (Vorprüfung ohne Schlüssel): Beleg ist der Smoke-Lauf (Eintrag „Übernommen" in `#decisionLog`) plus Screenshot `/tmp/aiwt-v2-etappe-a-agent-echt.png` — `ls -la /tmp/aiwt-v2-etappe-a-agent-echt.png`.
- [ ] **Kriterium 10 — Bestand**: `npm test` grün (Task F-3), Smoke grün (Task F-2), Demo-Projekt weiterhin als Beispiel markiert (Smoke-Assertions `exampleSeed`/„volle Kraft, leise Präsentation"), Mac-App frisch gebaut (Vorbereitung oben). App-Start **mit Nutzer gemeinsam**: `Schreibwerkzeug.app` öffnen — erwartet: Start mit migrierten Daten, Schlüssel-Status in den Einstellungen lesbar (Brücke antwortet).
- [ ] **Kriterien 2, 3, 5, 6, 8 — Live-Teil, mit Nutzer gemeinsam (echter API-Schlüssel nötig; Mock-Vorprüfungen aus F-2 sind bereits grün).** Der Controller führt mit dem Nutzer aus, in dieser Reihenfolge, und notiert je Kriterium bestanden/nicht bestanden:
  - **K2 Verständnis**: Neues Projekt anlegen → Agenten-Panel eröffnet mit genau EINER offenen Frage → in 1–2 Sätzen antworten → PV-Karte füllt sich sichtbar live. Dann Text einfügen, zweites neues Projekt: erst Entwurf aus dem Text, dann höchstens 2–3 Lückenfragen. Im Modal ein Feld korrigieren → die nächste Agenten-Antwort respektiert die Korrektur.
  - **K3 Hinweise**: Absatz mit bewusst absoluter, unbelegter Behauptung schreiben → 3–5 Sekunden Pause → Randkarte mit wörtlichem Anker erscheint; Kategorie, Beobachtung, Relevanz, Folge gefüllt; Übernehmen ändert den Text exakt an der Ankerstelle; einen weiteren Hinweis verwerfen → er kommt im Folgelauf nicht wieder; ein Fakt-/Quelle-Hinweis erzwingt den Risiko-Schritt.
  - **K5 Chat**: Frage zum eigenen Text in den Composer → Antwort streamt sichtbar Wort für Wort und bezieht sich nachweislich auf den Text; der Editor-Inhalt bleibt unverändert.
  - **K6 Initiative**: Nach einem Lauf mit Grundursache erscheint der Punkt an der Aura; kein Fokus-Raub; Dismiss verhält sich wie bisher.
  - **K8 Kosten**: Verbrauchsanzeige in den Einstellungen vor und nach 2–3 Läufen ablesen → Tokens und Euro-Schätzung steigen sichtbar; bei Folgeläufen im selben Text ist `cache_read` > 0 (Beweis, dass das Cache-Präfix greift).
- [ ] Server stoppen: `kill $(cat /tmp/aiwt-http.pid) && rm /tmp/aiwt-http.pid`
- [ ] Commit (Platzhalterliste durch tatsächliches Ergebnis ersetzen; offene Live-Kriterien ehrlich benennen): `git commit --allow-empty -m "abnahme: Etappe A — Kriterien 1,4,7,9,10 belegt (Mock/Tests/Build); Live-Kriterien 2,3,5,6,8 mit Nutzer: <bestanden/offen je Kriterium>"`

---
