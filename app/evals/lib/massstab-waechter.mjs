// Der Maßstabs-Wächter. Zwei Aufgaben, eine Regel: Die Messung folgt dem
// Vollzug, nicht der Behauptung.
//
// 1. Schnappschuss und Vergleich: Jeder Fertigzustand-Lauf legt fest, mit
//    welchem Maßstab er gemessen hat (Katalog samt Bindungen). Der nächste Lauf
//    vergleicht dagegen. Ändert sich der Maßstab inhaltlich — ein Eval
//    umdefiniert, entfernt, eine Schwelle oder ein Gewicht verschoben, eine
//    Bindung getauscht — erscheint das als eigener Abschnitt, niemals stumm.
//    Hintergrund: Produzent und Richter sind hier dieselbe Instanz; einmal
//    wurde der Maßstab still ans Produkt angepasst (Befund 3 der Systemanalyse
//    vom 04.08.2026). Der Wächter verhindert das nicht — er macht es sichtbar,
//    damit Jakob entscheidet.
//
// 2. Belegart aus dem Vollzug: Ein Beleg heißt „browser" nur, wenn die
//    Prüfdatei wirklich einen Browser startet — nicht, weil der Katalog es
//    behauptet. Vier Evals trugen „browser", obwohl reine Node-Tests liefen.

const EVAL_FELDER = ['title', 'gate', 'automation', 'given', 'when', 'then', 'evidence', 'source']

// Hält fest, womit dieser Lauf gemessen hat. Nur Inhalt, der das Urteil
// beeinflusst — keine Pfade, keine Reihenfolge-Zufälle.
export function massstabSchnappschuss(katalog, bindungen) {
  const evals = {}
  for (const suite of katalog?.suites || []) {
    for (const eintrag of suite?.evals || []) {
      evals[eintrag.id] = Object.fromEntries(EVAL_FELDER.map(feld => [feld, eintrag[feld]]))
    }
  }
  return {
    catalogVersion: katalog?.catalogVersion,
    thresholds: { ...(katalog?.thresholds || {}) },
    rubrik: Object.fromEntries((katalog?.rubric || []).map(d => [d.id, { label: d.label, weight: d.weight }])),
    evidenceKinds: [...(katalog?.evidenceKinds || [])].sort(),
    externalLiveGateIds: [...(katalog?.externalLiveGateIds || [])].sort(),
    evals,
    bindungen: Object.fromEntries(Object.entries(bindungen || {}).map(([id, dateien]) => [id, [...dateien]])),
  }
}

// Vergleicht zwei Schnappschüsse. Ohne Vergleichsstand: null — das meldet der
// Aufrufer als „kein Vergleichsstand", nicht als „unverändert".
export function vergleicheMassstab(vorher, jetzt) {
  if (!vorher || typeof vorher !== 'object') return null
  const aenderungen = []
  const melde = eintrag => aenderungen.push(eintrag)

  if (vorher.catalogVersion !== jetzt.catalogVersion) {
    melde({ bereich: 'version', art: 'geaendert', feld: 'catalogVersion', vorher: vorher.catalogVersion, jetzt: jetzt.catalogVersion })
  }

  for (const feld of vereinteSchluessel(vorher.thresholds, jetzt.thresholds)) {
    const [a, b] = [vorher.thresholds?.[feld], jetzt.thresholds?.[feld]]
    if (!gleich(a, b)) melde({ bereich: 'schwellen', art: 'geaendert', feld, vorher: a, jetzt: b })
  }

  for (const id of vereinteSchluessel(vorher.rubrik, jetzt.rubrik)) {
    const [a, b] = [vorher.rubrik?.[id], jetzt.rubrik?.[id]]
    if (a && !b) melde({ bereich: 'rubrik', art: 'entfernt', id, vorher: a })
    else if (!a && b) melde({ bereich: 'rubrik', art: 'hinzugefuegt', id, jetzt: b })
    else if (!gleich(a, b)) melde({ bereich: 'rubrik', art: 'geaendert', id, vorher: a, jetzt: b })
  }

  for (const [bereich, feld] of [['belegarten', 'evidenceKinds'], ['live-gates', 'externalLiveGateIds']]) {
    const [a, b] = [new Set(vorher[feld] || []), new Set(jetzt[feld] || [])]
    for (const wert of vorher[feld] || []) if (!b.has(wert)) melde({ bereich, art: 'entfernt', id: wert })
    for (const wert of jetzt[feld] || []) if (!a.has(wert)) melde({ bereich, art: 'hinzugefuegt', id: wert })
  }

  for (const id of vereinteSchluessel(vorher.evals, jetzt.evals)) {
    const [a, b] = [vorher.evals?.[id], jetzt.evals?.[id]]
    if (a && !b) { melde({ bereich: 'eval', art: 'entfernt', id, vorher: a.title }); continue }
    if (!a && b) { melde({ bereich: 'eval', art: 'hinzugefuegt', id, jetzt: b.title }); continue }
    for (const feld of EVAL_FELDER) {
      if (!gleich(a[feld], b[feld])) melde({ bereich: 'eval', art: 'geaendert', id, feld, vorher: a[feld], jetzt: b[feld] })
    }
  }

  for (const id of vereinteSchluessel(vorher.bindungen, jetzt.bindungen)) {
    const [a, b] = [vorher.bindungen?.[id], jetzt.bindungen?.[id]]
    if (a && !b) melde({ bereich: 'bindung', art: 'entfernt', id, vorher: a })
    else if (!a && b) melde({ bereich: 'bindung', art: 'hinzugefuegt', id, jetzt: b })
    else if (!gleich(a, b)) melde({ bereich: 'bindung', art: 'geaendert', id, vorher: a, jetzt: b })
  }

  return aenderungen
}

// Macht aus dem strukturierten Vergleich lesbare Zeilen für Konsole und Bericht.
export function formatiereMassstabAenderungen(aenderungen) {
  return (aenderungen || []).map(a => {
    const wo = a.id ? `${name(a.bereich)} ${a.id}` : name(a.bereich)
    if (a.art === 'entfernt') return `${wo} entfernt${wert(' (war: ', a.vorher)}`
    if (a.art === 'hinzugefuegt') return `${wo} hinzugekommen${wert(' (', a.jetzt)}`
    const feld = a.feld && a.bereich !== 'schwellen' && a.bereich !== 'version' ? `, Feld ${a.feld}` : (a.feld ? ` ${a.feld}` : '')
    return `${wo}${feld}: ${zeige(a.vorher)} → ${zeige(a.jetzt)}`
  })
}

// Belegart aus dem, was wirklich lief: Eine Prüfdatei, die Playwright lädt,
// hat im Erfolgsfall einen echten Browser gefahren — sonst war es ein
// node-Prozess, als Testlauf (--test) oder als eigenständiges Skript. Mehr
// weiß der Runner nicht, und mehr behauptet er deshalb auch nicht.
export function belegartAusVollzug(datei, quelltext) {
  const ohneKommentare = String(quelltext || '').split('\n').map(zeile => zeile.replace(/\/\/.*$/, '')).join('\n')
  if (/['"]playwright['"]/.test(ohneKommentare)) return 'browser'
  return datei.endsWith('.test.mjs') ? 'unit' : 'integration'
}

function vereinteSchluessel(a, b) {
  return [...new Set([...Object.keys(a || {}), ...Object.keys(b || {})])].sort()
}

function gleich(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function name(bereich) {
  return {
    version: 'Katalog-Version',
    schwellen: 'Schwelle',
    rubrik: 'Rubrik',
    belegarten: 'Belegart',
    'live-gates': 'Live-Gate',
    eval: 'Eval',
    bindung: 'Bindung',
  }[bereich] || bereich
}

function zeige(wertRoh) {
  if (wertRoh === undefined) return '—'
  if (typeof wertRoh === 'string') return `„${wertRoh}“`
  return JSON.stringify(wertRoh)
}

function wert(vorspann, wertRoh) {
  if (wertRoh === undefined) return ''
  return `${vorspann}${zeige(wertRoh)})`
}
