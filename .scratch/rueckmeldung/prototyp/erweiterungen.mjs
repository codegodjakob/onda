#!/usr/bin/env node
// Prototyp für Ticket #5 — "Wie das Naheliegende aussieht, und wie nicht".
//
// Erzeugt Erweiterungsideen zum selben Text auf drei Wegen und legt sie
// nebeneinander. Jakob sagt dann, was er als naheliegend erkennt. Erst daran
// zeigt sich, ob eine Vorkehrung wirkt — oder nur die Kosten verdoppelt.
//
// SCHLÜSSEL: Dieses Skript holt ihn selbst aus dem macOS-Schlüsselbund
// (Dienst "Onda", wie die App ihn ablegt). Er wird nie ausgegeben, nie
// protokolliert, nie in eine Datei geschrieben. Wer das Skript liest, sieht ihn
// nicht; wer die Ergebnisdatei liest, auch nicht.

import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const MODELL = 'claude-opus-5'
const API = 'https://api.anthropic.com/v1/messages'

function schluessel() {
  for (const dienst of ['Onda', 'Schreibwerkzeug']) {
    try {
      return execFileSync('security',
        ['find-generic-password', '-s', dienst, '-a', 'anthropic-api-key', '-w'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    } catch { /* nächster Dienst */ }
  }
  process.stderr.write(
    'Kein Schlüssel im Schlüsselbund gefunden.\n'
    + 'Trage ihn in Onda ein (Zahnrad → KI-Anschluss), dann läuft dieses Skript.\n')
  process.exit(2)
}

const SCHEMA = {
  type: 'object',
  properties: {
    erweiterungen: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          art: { type: 'string', enum: ['weiterfuehrung', 'feld', 'verbindung'] },
          anker: {
            type: 'array',
            items: { type: 'string' },
            description: 'Wörtliche Zitate aus dem Text. weiterfuehrung: genau eines. '
              + 'verbindung: genau zwei. feld: leer — es gehört zum Text als Ganzes.',
          },
          gedanke: { type: 'string', description: 'Der weiterführende Gedanke selbst, in zwei bis vier Sätzen.' },
          muster: { type: 'string', description: 'Das dahinterliegende Muster, damit man es beim nächsten Mal selbst kann.' },
        },
        required: ['art', 'anker', 'gedanke', 'muster'],
        additionalProperties: false,
      },
    },
  },
  required: ['erweiterungen'],
  additionalProperties: false,
}

const GRUNDAUFTRAG = `Du liest einen Text und bietest ERWEITERUNGEN an — keine Korrekturen.
Eine Erweiterung sagt nie "hier stimmt etwas nicht". Sie sagt: hier trägt der Gedanke weiter,
hier liegt ein Feld daneben, hier gehören zwei Stellen zusammen.

Drei Arten, mehr gibt es nicht:
- weiterfuehrung — der Gedanke trägt weiter, als die Autorin oder der Autor ihn geführt hat. Genau ein Anker.
- feld — ein Teil des Themas oder ein Nachbargebiet, das noch nicht betreten wurde. Kein Anker.
- verbindung — zwei Stellen im Text gehören zusammen, oder der Gedanke trifft einen fremden. Genau zwei Anker.

Regeln:
- Anker sind wörtliche Zitate, exakt so wie sie im Text stehen. Nie paraphrasieren, nie erfinden.
- Jede Erweiterung nennt das MUSTER dahinter, nicht nur den Einzelfall — damit die Autorin
  oder der Autor es beim nächsten Mal selbst kann.
- Du erfindest keine Tatsachen, keine Quellen, keine Zahlen.
- Du gibst keine Richtung vor. Du bietest an; die Entscheidung liegt bei der Autorin oder dem Autor.`

const GEGEN_DAS_NAHELIEGENDE = `
ZUSÄTZLICH — und das ist der schwierigste Teil deiner Aufgabe:

Du bist ein Sprachmodell. Deine erste Antwort auf einen Text ist fast immer die
statistisch häufigste — der Gedanke, den auch jeder andere hätte. Genau der ist wertlos:
die Autorin oder der Autor hatte ihn schon.

Bevor du eine Erweiterung aufschreibst, prüfe sie:
- Wäre das der erste Gedanke, den ein durchschnittlicher aufmerksamer Leser hätte? Dann verwirf ihn.
- Steht die Antwort bereits im Text, nur anders formuliert? Dann verwirf sie.
- Ist es eine Bildungsassoziation, die das Thema nur mit einem bekannten Namen schmückt,
  ohne dass sich daraus etwas ergibt? Dann verwirf sie.
- Könntest du dieselbe Erweiterung auch zu einem ganz anderen Text sagen? Dann ist sie zu allgemein.

Was übrig bleibt, ist selten. Drei echte Erweiterungen sind mehr wert als zehn erwartbare.
Findest du nichts Nicht-Naheliegendes, gib eine leere Liste zurück — das ist ein gültiges Ergebnis.`

async function frage(key, systemText, userText, schema, maxTokens = 8000) {
  const koerper = {
    model: MODELL,
    max_tokens: maxTokens,
    system: systemText,
    messages: [{ role: 'user', content: userText }],
  }
  if (schema) koerper.output_config = { format: { type: 'json_schema', schema } }

  const antwort = await fetch(API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(koerper),
  })
  if (!antwort.ok) {
    const text = await antwort.text()
    throw new Error(`HTTP ${antwort.status}: ${text.slice(0, 400)}`)
  }
  const daten = await antwort.json()
  const inhalt = (daten.content || []).map(b => b.text || '').join('')
  return { inhalt, usage: daten.usage || {} }
}

// --- Die drei Wege ----------------------------------------------------------

async function wegNackt(key, text) {
  const { inhalt, usage } = await frage(key, GRUNDAUFTRAG,
    `Hier ist der Text. Gib drei Erweiterungen.\n\n<text>\n${text}\n</text>`, SCHEMA)
  return { name: 'A — nackt', beschreibung: 'Nur der Grundauftrag. Keine Vorkehrung.', inhalt, usage }
}

async function wegAngewiesen(key, text) {
  const { inhalt, usage } = await frage(key, GRUNDAUFTRAG + '\n' + GEGEN_DAS_NAHELIEGENDE,
    `Hier ist der Text. Gib drei Erweiterungen.\n\n<text>\n${text}\n</text>`, SCHEMA)
  return {
    name: 'B — angewiesen',
    beschreibung: 'Der Auftrag verlangt ausdrücklich das Nicht-Naheliegende.',
    inhalt,
    usage,
  }
}

async function wegZweiDurchgaenge(key, text) {
  // Erst neun erzeugen, dann in einem zweiten Durchgang das Erwartbare aussortieren.
  const erst = await frage(key, GRUNDAUFTRAG,
    `Hier ist der Text. Gib NEUN Erweiterungen — eine breite Auswahl, auch ungewöhnliche.\n\n<text>\n${text}\n</text>`,
    SCHEMA, 16000)

  const auswahl = await frage(key,
    `Du bist ein strenger Aussortierer. Dir liegen neun Erweiterungsvorschläge zu einem Text vor.
Wirf alles weg, was ein durchschnittlicher aufmerksamer Leser als Erstes gedacht hätte,
was bereits im Text steht, oder was man zu jedem beliebigen Text sagen könnte.
Behalte höchstens drei. Weniger ist erlaubt. Keine ist erlaubt.
Gib die behaltenen unverändert zurück, in derselben Struktur.`,
    `<text>\n${text}\n</text>\n\n<vorschlaege>\n${erst.inhalt}\n</vorschlaege>`,
    SCHEMA, 8000)

  return {
    name: 'C — zwei Durchgänge',
    beschreibung: 'Neun erzeugen, dann das Erwartbare aussortieren.',
    inhalt: auswahl.inhalt,
    usage: {
      input_tokens: (erst.usage.input_tokens || 0) + (auswahl.usage.input_tokens || 0),
      output_tokens: (erst.usage.output_tokens || 0) + (auswahl.usage.output_tokens || 0),
    },
    zwischenstand: erst.inhalt,
  }
}

// --- Lauf -------------------------------------------------------------------

const key = schluessel()
const text = await readFile(resolve(hier, 'pruefstueck.md'), 'utf8')

// Sparsam: standardmäßig laufen nur die beiden billigen Wege (je ein Aufruf).
// Weg C erzeugt neun Ideen und sortiert in einem zweiten Aufruf aus — er kostet
// gut das Dreifache. Er lohnt nur, wenn A und B sich nicht unterscheiden; dann
// mit ALLE_WEGE=1 nachlegen.
const wegListe = process.env.ALLE_WEGE
  ? [wegNackt, wegAngewiesen, wegZweiDurchgaenge]
  : [wegNackt, wegAngewiesen]

process.stdout.write(`Erzeuge Erweiterungen auf ${wegListe.length} Wegen …\n`)
const wege = []
for (const [i, weg] of wegListe.entries()) {
  process.stdout.write(`  [${i + 1}/${wegListe.length}] …\n`)
  try {
    wege.push(await weg(key, text))
  } catch (fehler) {
    wege.push({ name: `Weg ${i + 1}`, beschreibung: 'fehlgeschlagen', fehler: String(fehler.message) })
  }
}

// --- Nebeneinanderlegen -----------------------------------------------------

const PREIS = { in: 5, out: 25 } // Dollar je Million Token, Opus 5
let md = '# Erweiterungen — drei Wege im Vergleich\n\n'
md += 'Derselbe Text, dreimal. Deine Aufgabe beim Lesen: **Bei welchen denkst du "das wusste ich schon" '
md += 'oder "das hätte jeder gesagt"?** Markiere die. Was übrig bleibt, sagt uns, welche Vorkehrung wirkt.\n\n'
md += 'Die Wege sind absichtlich nicht beschriftet, wo es zählt — lies erst die Ideen, dann die Herkunft.\n\n---\n\n'

for (const w of wege) {
  md += `## ${w.name}\n\n_${w.beschreibung}_\n\n`
  if (w.fehler) { md += `**Fehlgeschlagen:** ${w.fehler}\n\n---\n\n`; continue }
  let daten
  try { daten = JSON.parse(w.inhalt) } catch { md += `Antwort war kein JSON:\n\n\`\`\`\n${w.inhalt.slice(0, 800)}\n\`\`\`\n\n---\n\n`; continue }
  const liste = daten.erweiterungen || []
  if (!liste.length) md += '_Keine Erweiterung — das Modell fand nichts Nicht-Naheliegendes._\n\n'
  liste.forEach((e, i) => {
    md += `### ${i + 1}. ${e.art}\n\n`
    if (e.anker?.length) e.anker.forEach(a => { md += `> ${a}\n\n` })
    md += `${e.gedanke}\n\n`
    md += `**Muster:** ${e.muster}\n\n`
  })
  const kosten = ((w.usage.input_tokens || 0) * PREIS.in + (w.usage.output_tokens || 0) * PREIS.out) / 1e6
  md += `_${w.usage.input_tokens || 0} Token hinein, ${w.usage.output_tokens || 0} hinaus — etwa ${(kosten * 100).toFixed(1)} Cent._\n\n---\n\n`
}

await writeFile(resolve(hier, 'ergebnis.md'), md, 'utf8')
process.stdout.write('\nErgebnis: .scratch/rueckmeldung/prototyp/ergebnis.md\n')
