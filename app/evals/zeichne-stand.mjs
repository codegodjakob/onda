#!/usr/bin/env node
// Zeichnet den gemessenen Fertigzustand als eigenständige HTML-Seite:
// eine Zeile je Testreihe, plus den Verlauf über alle bisherigen Läufe.
//
// Liest ausschließlich echte Ergebnisdateien. Was nicht gemessen wurde,
// erscheint als "nicht belegt" — nie als Lücke, die man übersehen kann.

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ladeEvalKatalog } from './lib/eval-catalog.mjs'

const hier = dirname(fileURLToPath(import.meta.url))
const katalog = await ladeEvalKatalog(resolve(hier, 'v2-fertigzustand.json'))
const ergebnisPfad = resolve(hier, 'results/fertigzustand-latest.json')
const ergebnis = JSON.parse(await readFile(ergebnisPfad, 'utf8'))

const reiheVon = new Map()
katalog.suites.forEach(s => s.evals.forEach(e => reiheVon.set(e.id, s)))

const proReihe = new Map()
for (const eintrag of ergebnis.evals) {
  const reihe = reiheVon.get(eintrag.id)
  if (!reihe) continue
  if (!proReihe.has(reihe.id)) proReihe.set(reihe.id, { name: reihe.name, passed: 0, failed: 0, offen: 0, ungebunden: 0 })
  const z = proReihe.get(reihe.id)
  if (eintrag.status === 'passed') z.passed++
  else if (eintrag.status === 'external-open') z.offen++
  else if (/Keine frische Prüfung gebunden/.test(eintrag.note || '')) z.ungebunden++
  else z.failed++
}

// Verlauf: alle archivierten Läufe, chronologisch
const archiv = resolve(hier, 'results/verlauf')
let verlauf = []
try {
  const dateien = (await readdir(archiv)).filter(d => d.endsWith('.json')).sort()
  verlauf = await Promise.all(dateien.map(async d => {
    const r = JSON.parse(await readFile(resolve(archiv, d), 'utf8'))
    const p = r.evals.filter(e => e.status === 'passed').length
    const anwendbar = r.evals.filter(e => e.status !== 'external-open').length
    return { zeit: r.generatedAt, iteration: r.iteration, passed: p, anwendbar }
  }))
} catch { /* noch kein Archiv */ }

const jetztPassed = ergebnis.evals.filter(e => e.status === 'passed').length
const jetztAnwendbar = ergebnis.evals.filter(e => e.status !== 'external-open').length
verlauf.push({ zeit: ergebnis.generatedAt, iteration: ergebnis.iteration, passed: jetztPassed, anwendbar: jetztAnwendbar })

const BREITE = 470
const BALKEN_X = 250
const zeilen = [...proReihe.entries()].map(([id, z], i) => {
  const gesamt = z.passed + z.failed + z.ungebunden + z.offen
  const skala = n => (n / gesamt) * BREITE
  let x = 0
  const stueck = (n, klasse) => {
    if (!n) return ''
    const w = skala(n)
    const r = `<rect x="${(x + BALKEN_X).toFixed(1)}" y="${i * 30 + 6}" width="${w.toFixed(1)}" height="18" class="${klasse}" rx="2"/>`
    x += w
    return r
  }
  return `<text x="0" y="${i * 30 + 19}" class="reihe">${id}</text>`
    + `<text x="66" y="${i * 30 + 19}" class="name">${z.name.slice(0, 26)}</text>`
    + stueck(z.passed, 'ok') + stueck(z.failed, 'fehl') + stueck(z.ungebunden, 'unbelegt') + stueck(z.offen, 'offen')
    + `<text x="${BREITE + BALKEN_X + 10}" y="${i * 30 + 19}" class="zahl">${z.passed}/${gesamt}</text>`
}).join('\n')

const hoehe = proReihe.size * 30 + 10

const verlaufPunkte = verlauf.map((v, i) => {
  const x = verlauf.length > 1 ? (i / (verlauf.length - 1)) * 700 : 0
  const y = 160 - (v.passed / Math.max(v.anwendbar, 1)) * 140
  return { x, y, ...v }
})
const linie = verlaufPunkte.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

const html = `<meta charset="utf-8">
<title>Onda — gemessener Fertigzustand</title>
<style>
  :root { color-scheme: light dark; --bg:#faf9f7; --fg:#1e1e1c; --dim:#6b6a66; --line:#e3e0da;
          --ok:#4a7c59; --fehl:#a4453a; --unbelegt:#b8862b; --offen:#5a6b7c; }
  @media (prefers-color-scheme: dark) { :root { --bg:#1a1a18; --fg:#eae8e3; --dim:#95938d; --line:#33322e; } }
  :root[data-theme="dark"] { --bg:#1a1a18; --fg:#eae8e3; --dim:#95938d; --line:#33322e; }
  :root[data-theme="light"] { --bg:#faf9f7; --fg:#1e1e1c; --dim:#6b6a66; --line:#e3e0da; }
  body { background:var(--bg); color:var(--fg); font:15px/1.6 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;
         margin:0; padding:32px 24px; }
  main { max-width:860px; margin:0 auto; }
  h1 { font-size:22px; font-weight:600; margin:0 0 4px; letter-spacing:-0.01em; }
  .unter { color:var(--dim); margin:0 0 28px; font-size:14px; }
  .karte { border:1px solid var(--line); border-radius:10px; padding:20px; margin-bottom:20px; }
  h2 { font-size:15px; font-weight:600; margin:0 0 14px; }
  .huelle { overflow-x:auto; }
  svg { display:block; }
  text { font:12px -apple-system,system-ui,sans-serif; fill:var(--fg); }
  text.name { fill:var(--dim); }
  text.zahl { fill:var(--dim); font-variant-numeric:tabular-nums; }
  rect.ok { fill:var(--ok); } rect.fehl { fill:var(--fehl); }
  rect.unbelegt { fill:var(--unbelegt); } rect.offen { fill:var(--offen); }
  .legende { display:flex; gap:18px; flex-wrap:wrap; margin-top:14px; font-size:13px; color:var(--dim); }
  .legende span { display:flex; align-items:center; gap:6px; }
  .punkt { width:11px; height:11px; border-radius:2px; display:inline-block; }
  .zahlen { display:flex; gap:28px; flex-wrap:wrap; margin:0 0 4px; }
  .zahlen div { }
  .gross { font-size:26px; font-weight:600; font-variant-numeric:tabular-nums; }
  .klein { font-size:13px; color:var(--dim); }
  .hinweis { border-left:3px solid var(--unbelegt); padding:2px 0 2px 14px; color:var(--dim); font-size:14px; margin-top:16px; }
</style>
<main>
  <h1>Onda — gemessener Fertigzustand</h1>
  <p class="unter">Lauf ${ergebnis.iteration} · ${new Date(ergebnis.generatedAt).toLocaleString('de-DE')} · Katalog ${ergebnis.catalogVersion} · Stand ${ergebnis.gitCommit.slice(0, 7)}</p>

  <div class="karte">
    <div class="zahlen">
      <div><div class="gross">${jetztPassed}</div><div class="klein">frisch belegt</div></div>
      <div><div class="gross">${jetztAnwendbar - jetztPassed}</div><div class="klein">nicht belegt</div></div>
      <div><div class="gross">${ergebnis.evals.length - jetztAnwendbar}</div><div class="klein">brauchen Live-Zugang</div></div>
      <div><div class="gross">${Math.round((jetztPassed / Math.max(jetztAnwendbar, 1)) * 100)}&thinsp;%</div><div class="klein">der anwendbaren Evals</div></div>
    </div>
  </div>

  <div class="karte">
    <h2>Nach Testreihe</h2>
    <div class="huelle">
      <svg width="820" height="${hoehe}" viewBox="0 0 820 ${hoehe}" role="img" aria-label="Bestandene Evals je Testreihe">
        ${zeilen}
      </svg>
    </div>
    <div class="legende">
      <span><i class="punkt" style="background:var(--ok)"></i>frisch belegt</span>
      <span><i class="punkt" style="background:var(--fehl)"></i>Prüfung fehlgeschlagen</span>
      <span><i class="punkt" style="background:var(--unbelegt)"></i>keine Prüfung gebunden</span>
      <span><i class="punkt" style="background:var(--offen)"></i>braucht Live-Zugang</span>
    </div>
  </div>

  <div class="karte">
    <h2>Verlauf über die Läufe</h2>
    <div class="huelle">
      <svg width="760" height="190" viewBox="-10 0 780 190" role="img" aria-label="Anteil belegter Evals über die Läufe">
        <line x1="0" y1="160" x2="710" y2="160" stroke="var(--line)"/>
        <line x1="0" y1="20" x2="710" y2="20" stroke="var(--line)" stroke-dasharray="3 3"/>
        <text x="716" y="24" class="zahl">100 %</text>
        <text x="716" y="164" class="zahl">0 %</text>
        ${verlaufPunkte.length > 1 ? `<polyline points="${linie}" fill="none" stroke="var(--ok)" stroke-width="2"/>` : ''}
        ${verlaufPunkte.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="var(--ok)"/>`
          + `<text x="${p.x.toFixed(1)}" y="${(p.y - 12).toFixed(1)}" class="zahl" text-anchor="middle">${p.passed}</text>`
          + `<text x="${p.x.toFixed(1)}" y="178" class="zahl" text-anchor="middle">Lauf ${p.iteration}</text>`).join('\n')}
      </svg>
    </div>
    ${verlaufPunkte.length === 1 ? '<p class="klein" style="margin-top:10px">Erster Lauf — noch kein Verlauf.</p>' : ''}
  </div>

  <p class="hinweis">Die Rubriknoten in der Ergebnisdatei sind aus der Abdeckung abgeleitet, kein Qualitätsurteil.
  Sie sagen, welcher Anteil belegt ist — nicht, wie gut das Belegte ist.</p>
</main>
`

const ziel = resolve(hier, 'results/stand.html')
await writeFile(ziel, html, 'utf8')
process.stdout.write(`Diagramm: evals/results/stand.html\n`)
