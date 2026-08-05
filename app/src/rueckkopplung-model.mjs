// Was hat bei DIESER Person bisher getragen? — PUR, node-testbar, kein DOM, keine Uhr,
// kein Zufall, keine Mutation der Eingaben.
//
// BEFUND, den dieses Modul behebt: Onda schrieb nach jedem Lauf mit, wie viele eigene
// Hinweise geliefert, verworfen und übernommen wurden (workspace.hinweislauf), und jede
// Autorentscheidung samt Begründung landete in doc.decisions. Gelesen wurde davon genau
// ein Feld — die Signatur zur Entprellung. Onda notierte seine eigene Trefferquote und
// wertete sie nie aus. Hier wird aus dem Mitschrieb eine Rückkopplung.
//
// ═══ DER UNTERSCHIED, AN DEM ALLES HÄNGT ═══
//
// Das hier ist eine NÜTZLICHKEITSBILANZ, keine Wahrheitsbewertung.
//
// Ein verworfener Hinweis heißt NICHT, dass er falsch war. Er kann vollkommen richtig
// gewesen sein und trotzdem unerwünscht: Die Autorin wollte diese Zuspitzung, dieser
// Bruch im Aufbau war Absicht, dieser Beleg gehört bewusst nicht in den Text. Der
// Systemtext sagt es ausdrücklich — "Autorentscheidungen sind bindend". Wer aus einer
// hohen Verwerfensquote schlösse, die Hinweise seien falsch gewesen, hätte die Person
// zum Fehler erklärt statt sich selbst zur Frage.
//
// Was diese Zahlen tatsächlich messen, ist eine einzige Sache: Wie oft hat ein Hinweis
// dieser Art bei dieser Person zu einer Änderung geführt. Das ist Nützlichkeit, und
// Nützlichkeit ist auf zwei Weisen zu erhöhen — bessere Hinweise dieser Art, oder
// weniger davon. WELCHE der beiden richtig ist, entscheiden diese Zahlen nicht. Deshalb
// formuliert formuliereRueckkopplung() nie "gib diese Art nicht mehr", sondern immer
// "prüfe hier besonders streng". Eine Art abzuschneiden, die nur schlecht formuliert
// war, wäre der teuerste Fehler, den dieses Modul machen könnte: Er wäre unsichtbar und
// nicht mehr rückgängig zu machen, weil danach keine Daten mehr entstehen.
//
// ═══ AB WANN BEDEUTET EINE ZAHL ETWAS ═══
//
// Bei drei Fällen bedeutet "zweimal verworfen" nichts. Zwei Sperren, beide müssen
// passieren, sonst gilt: noch keine Aussage (fail-closed — unterhalb der Schwelle sagt
// dieses Modul nicht "alles gut", sondern gar nichts).
//
//   1. MINDESTZAHL_JE_ART — die Art selbst braucht genug bewertete Fälle.
//   2. MINDESTZAHL_VERGLEICH — der REST braucht genug bewertete Fälle, denn verglichen
//      wird nicht gegen 50 Prozent, sondern gegen das eigene übliche Verhalten dieser
//      Person. Wer ohnehin vier von fünf Hinweisen verwirft, bei dem ist eine Art mit
//      80 Prozent Verwerfen völlig unauffällig; wer sonst fast alles annimmt, bei dem
//      sind schon 50 Prozent ein deutliches Signal.

import { CATEGORY_ZU_ART } from './textart-regeln.mjs'
import { KATEGORIE_ZU_CATEGORY } from './agent-findings.mjs'

// Die acht Hinweisarten sind KEINE eigene Liste: es sind die der Umwandlung
// (agent-findings.mjs), unverändert weitergereicht. Zwei Listen wären zwei Wahrheiten,
// und eine davon wäre immer veraltet — dieselbe Regel wie bei TEXTARTEN
// (textart-regeln.mjs), die aus dem Sprachprofil kommen.
export const HINWEISARTEN = Object.freeze(Object.keys(KATEGORIE_ZU_CATEGORY))

// Fünf bewertete Fälle je Art. Begründung, zwei Teile:
//
// (a) Statistisch ist fünf die kleinste Zahl, bei der ein durchgängiges Ergebnis
//     überhaupt etwas heißen kann: Fünf von fünf in dieselbe Richtung haben bei einer
//     gedachten Münze eine Wahrscheinlichkeit von 1/32, also gut drei Prozent. Bei vier
//     von vier sind es schon 1/16 — mehr als sechs Prozent, und das passiert beiläufig.
//
// (b) Handwerklich erzwingt fünf, dass das Signal aus MEHR ALS EINEM LAUF stammt: Die
//     Anweisung deckelt jeden Durchgang auf höchstens drei neue Hinweise
//     (agent-prompts.mjs HINWEIS_ANWEISUNG). Fünf bewertete Hinweise EINER Art brauchen
//     also mindestens zwei Läufe, in aller Regel mehr. Das ist die eigentliche Absicht:
//     Eine einzige Sitzung, in der jemand in Eile alles wegklickt, darf Onda nicht
//     umlernen lassen.
export const MINDESTZAHL_JE_ART = 5

// Zehn bewertete Fälle bei den ÜBRIGEN Arten. Ohne diese Sperre wäre der Vergleich
// zirkulär: Hätte eine Art zwölf von fünfzehn Fällen, bestünde der "übliche" Wert dieser
// Person fast nur aus derselben Art, und sie würde mit sich selbst verglichen. Zehn ist
// die Zahl, ab der der Vergleichswert nicht mehr von einem einzelnen Fall kippt (ein
// Fall verschiebt ihn um höchstens zehn Punkte, also weniger als MINDESTABSTAND).
//
// Beide Sperren zusammen ergeben eine untere Grenze von fünfzehn bewerteten Hinweisen
// insgesamt, bevor dieses Modul überhaupt etwas sagt. Diese Zahl ist nirgends gesetzt,
// sie folgt — deshalb steht sie hier nur als Notiz und nicht als dritte Konstante.
export const MINDESTZAHL_VERGLEICH = 10

// Wie weit muss eine Art vom üblichen Verhalten abweichen, damit sie auffällt?
// 25 Prozentpunkte. Darunter liegt der Unterschied im Bereich dessen, was bei fünf bis
// zehn Fällen ein einziger Fall hin oder her ausmacht (ein Fall von fünf sind zwanzig
// Punkte) — man würde Rauschen erzählen. Die Zahl ist bewusst grob: Dieser Block soll
// nur dann etwas sagen, wenn es auch einem Menschen auffiele, der die Liste durchsieht.
export const MINDESTABSTAND = 0.25

// Harte Obergrenze für den Prompt-Block. Begründung, dieselbe Rechnung wie bei
// MAX_AUSSAGEN (onda-kontext.mjs): Jede Zeile kostet grob 40 bis 60 Tokens und wird bei
// JEDEM Hinweislauf neu bezahlt. Vier Zeilen sind der Punkt, an dem der Block noch eine
// Betonung ist und keine Tabelle: Stünden alle acht Arten darin, wäre keine mehr
// hervorgehoben, und das Modell läse eine Statistik statt eines Hinweises. Genommen
// werden die vier mit dem größten Abstand zum üblichen Verhalten — also die, bei denen
// die Aussage am belastbarsten ist.
export const MAX_ARTEN_IM_BLOCK = 4

// ── Zweite, unabhängige Messung: was von Ondas Hinweisen gar nicht ankam ──────────
//
// verarbeiteHinweisantwort (hinweislauf-model.mjs) verwirft Hinweise, BEVOR sie jemand
// zu sehen bekommt: als Doppelung von etwas bereits Entschiedenem oder Offenem, oder
// weil der Anker nicht wörtlich im Dokument steht. Das ist eine ganz andere Frage als
// die Nützlichkeit — hier urteilt niemand über den Inhalt, hier scheitert das Handwerk.
// Und dieser Verlust ist rein technisch: Er kostet Geld und bringt nichts.
//
// Zwölf gelieferte Hinweise als Mindestzahl, aus demselben Grund wie oben: Bei höchstens
// drei je Durchgang sind das mindestens vier Läufe. Ein einzelner Lauf, in dem das
// Modell zufällig zweimal danebengreift, soll noch nichts bedeuten.
export const MINDESTZAHL_ZUGESTELLT = 12

// Ein Drittel. Eine gewisse Verlustquote ist normal und sogar erwünscht: Die Dedupe-Sperre
// fängt ab, dass ein bereits Entschiedenes in neuer Verkleidung wiederkommt, und das
// passiert bei jedem längeren Projekt. Ab einem Drittel ist es aber kein Nebeneffekt
// mehr, sondern ein Muster — dann arbeitet das Modell mehr an Hinweisen, die niemand je
// sieht, als es sich leisten sollte.
export const SCHWELLE_VERLUST = 1 / 3

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

function stabilerHash(value) {
  let hash = 2166136261
  for (const character of String(value)) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

// Die Lagen, die dieses Modul kennt. 'noch-keine-aussage' ist der Vorgabewert und der
// Fail-closed-Fall: Er heißt nicht "unauffällig", sondern "zu wenig Daten".
export const LAGEN = Object.freeze(['noch-keine-aussage', 'unauffaellig', 'traegt', 'traegt-selten'])

// Zu welcher Art gehört ein Finding? Tolerant, in dieser Reihenfolge:
// kiKategorie (steht auf allem, was aus einem echten Hinweislauf stammt), dann kategorie,
// dann als letzte Rückfalllinie die englische category über CATEGORY_ZU_ART
// (textart-regeln.mjs). 'content' liefert dort bewusst nichts: Es steht für ZWEI Arten
// (wirkung und erklaerung), und ein geratener Zuschlag würde beide Bilanzen verfälschen.
// Ein Finding ohne erkennbare Art zählt gar nicht mit — lieber eine Zahl kleiner als eine
// Zahl falsch.
export function artVonFinding(finding) {
  if (!finding || typeof finding !== 'object') return ''
  const direkt = String(finding.kiKategorie || finding.kategorie || '').trim()
  if (direkt && HINWEISARTEN.includes(direkt)) return direkt
  const category = String(finding.category || '').trim()
  if (!category) return ''
  const abgeleitet = Object.prototype.hasOwnProperty.call(CATEGORY_ZU_ART, category)
    ? CATEGORY_ZU_ART[category]
    : ''
  return abgeleitet && HINWEISARTEN.includes(abgeleitet) ? abgeleitet : ''
}

function leereBilanz(art) {
  return {
    art,
    angeboten: 0,
    offen: 0,
    angenommen: 0,
    verworfen: 0,
    risikoAngenommen: 0,
    bewertbar: 0,
    verworfenAnteil: null,
    vergleichsAnteil: null,
    abstand: null,
    lage: 'noch-keine-aussage',
  }
}

// Der Ausgang einer Entscheidung. Die Entscheidung selbst (doc.decisions) ist die
// Urkunde des Autorakts und hat Vorrang; finding.status ist die Zweitschrift und
// springt nur ein, wenn keine Entscheidung mehr auffindbar ist (alte Dokumente,
// importierte Daten). Beide sagen im Normalfall dasselbe — decideFinding
// (reasoning-model.mjs) schreibt sie in einem Zug.
function ausgangVon(finding, entscheidungen) {
  const entscheidung = entscheidungen.get(finding.id)
  const ausgang = String(entscheidung?.outcome || finding.status || 'open').trim()
  return ausgang || 'open'
}

// Die Bilanz über MEHRERE Dokumente.
//
// dokumente: [{ findings, decisions, hinweislauf }] — bewusst nicht das ganze
// doc-Objekt. Dieses Modul soll nicht wissen müssen, dass das Laufprotokoll unter
// doc.workspace.hinweislauf liegt; wer es aufruft, weiß es ohnehin.
//
// Rein: Es wird nichts an den Eingaben verändert, keine Uhr gelesen, kein Zufall
// benutzt. Gleiche Eingabe ergibt byte-gleiche Ausgabe.
export function bilanziereRueckmeldung({ dokumente = [] } = {}) {
  const proArt = new Map(HINWEISARTEN.map(art => [art, leereBilanz(art)]))
  const gesamt = { angeboten: 0, offen: 0, angenommen: 0, verworfen: 0, risikoAngenommen: 0, bewertbar: 0 }
  const handwerk = { laeufe: 0, geliefert: 0, zugestellt: 0, nichtZugestellt: 0, anteil: null, lage: 'noch-keine-aussage' }

  const geseheneFindings = new Set()
  ;(Array.isArray(dokumente) ? dokumente : []).forEach(eintrag => {
    if (!eintrag || typeof eintrag !== 'object') return
    if (eintrag.trashed === true) return

    const entscheidungen = new Map()
    ;(Array.isArray(eintrag.decisions) ? eintrag.decisions : []).forEach(decision => {
      // Letzte gewinnt — dieselbe Regel wie in fasseEntscheidungenZusammen
      // (agent-findings.mjs). decideFinding lässt ohnehin nur eine je Hinweis zu.
      if (decision?.findingId) entscheidungen.set(decision.findingId, decision)
    })

    ;(Array.isArray(eintrag.findings) ? eintrag.findings : []).forEach(finding => {
      const findingId = String(finding?.id || '').trim()
      if (findingId && geseheneFindings.has(findingId)) return
      if (findingId) geseheneFindings.add(findingId)
      const art = artVonFinding(finding)
      if (!art) return
      const zeile = proArt.get(art)
      zeile.angeboten += 1
      gesamt.angeboten += 1
      const ausgang = ausgangVon(finding, entscheidungen)
      if (ausgang === 'resolved') { zeile.angenommen += 1; gesamt.angenommen += 1 }
      else if (ausgang === 'dismissed') { zeile.verworfen += 1; gesamt.verworfen += 1 }
      else if (ausgang === 'risk-accepted') { zeile.risikoAngenommen += 1; gesamt.risikoAngenommen += 1 }
      else { zeile.offen += 1; gesamt.offen += 1 }
    })

    const protokoll = eintrag.hinweislauf
    if (protokoll && typeof protokoll === 'object') {
      handwerk.laeufe += zahl(protokoll.laeufe)
      handwerk.geliefert += zahl(protokoll.summeGeliefert)
      handwerk.nichtZugestellt += zahl(protokoll.summeVerworfen)
      handwerk.zugestellt += zahl(protokoll.summeUebernommen)
    }
  })

  // bewertbar = angenommen + verworfen. Ein bewusst angenommenes Risiko zählt
  // ABSICHTLICH nicht mit: Wer ein Risiko annimmt, hat den Hinweis gelesen, verstanden
  // und ausdrücklich abgewogen (workspace.js beschriftet den Knopf auch so). Das ist die
  // ernsteste Form der Auseinandersetzung, die es hier gibt — sie als Verwerfen zu
  // zählen hieße, Onda genau die Arten abzugewöhnen, die es am gründlichsten getroffen
  // hat. Gezählt wird das Risiko trotzdem, es steht in der Bilanz; es treibt nur die
  // Quote nicht.
  proArt.forEach(zeile => { zeile.bewertbar = zeile.angenommen + zeile.verworfen })
  gesamt.bewertbar = gesamt.angenommen + gesamt.verworfen

  proArt.forEach(zeile => {
    if (zeile.bewertbar > 0) zeile.verworfenAnteil = zeile.verworfen / zeile.bewertbar
    const restBewertbar = gesamt.bewertbar - zeile.bewertbar
    const restVerworfen = gesamt.verworfen - zeile.verworfen
    if (restBewertbar > 0) zeile.vergleichsAnteil = restVerworfen / restBewertbar

    // Fail-closed: Fehlt eine der beiden Sperren, bleibt es bei 'noch-keine-aussage'.
    if (zeile.bewertbar < MINDESTZAHL_JE_ART) return
    if (restBewertbar < MINDESTZAHL_VERGLEICH) return

    zeile.abstand = zeile.verworfenAnteil - zeile.vergleichsAnteil
    if (zeile.abstand >= MINDESTABSTAND) zeile.lage = 'traegt-selten'
    else if (zeile.abstand <= -MINDESTABSTAND) zeile.lage = 'traegt'
    else zeile.lage = 'unauffaellig'
  })

  handwerk.anteil = handwerk.geliefert > 0 ? handwerk.nichtZugestellt / handwerk.geliefert : null
  if (handwerk.geliefert >= MINDESTZAHL_ZUGESTELLT) {
    handwerk.lage = handwerk.anteil >= SCHWELLE_VERLUST ? 'viel-verlust' : 'unauffaellig'
  }

  const zeilen = [...proArt.values()]
  // Sortierung streng deterministisch (Purität): größter Abstand zuerst, bei
  // Gleichstand die Art mit mehr bewerteten Fällen, zuletzt der Name.
  const auffaellige = zeilen
    .filter(zeile => zeile.lage === 'traegt' || zeile.lage === 'traegt-selten')
    .sort((a, b) => (
      Math.abs(b.abstand) - Math.abs(a.abstand)
      || b.bewertbar - a.bewertbar
      || a.art.localeCompare(b.art, 'de')
    ))
    .slice(0, MAX_ARTEN_IM_BLOCK)

  return { proArt: zeilen, gesamt, handwerk, auffaellige }
}

function zahl(wert) {
  return Number.isFinite(Number(wert)) && Number(wert) > 0 ? Math.trunc(Number(wert)) : 0
}

function prozent(anteil) {
  return `${Math.round(anteil * 100)} %`
}

// Der volatile Prompt-Block. Gibt null zurück, wenn es nichts zu sagen gibt — ein leerer
// Wert erzeugt KEINEN leeren Block (dieselbe Regel wie in onda-kontext.mjs).
//
// TON: Dieser Block darf nie zu einer Streichung führen. Er sagt nicht "gib keine
// Strukturhinweise mehr", sondern "prüfe hier besonders streng". Der Unterschied ist
// nicht Höflichkeit, sondern Selbstschutz des Systems: Eine hohe Verwerfensquote kann
// genauso gut daher kommen, dass Ondas Hinweise DIESER Art bisher schlecht formuliert
// waren. Wer die Art abschaltet, erfährt das nie mehr, weil danach keine Daten mehr
// entstehen — und hat der Person dauerhaft eine Sicht genommen, die sie vielleicht
// gebraucht hätte.
export function formuliereRueckkopplung(bilanz) {
  if (!bilanz || typeof bilanz !== 'object') return null
  const auffaellige = Array.isArray(bilanz.auffaellige) ? bilanz.auffaellige : []
  const handwerk = bilanz.handwerk && typeof bilanz.handwerk === 'object' ? bilanz.handwerk : null
  const vielVerlust = handwerk?.lage === 'viel-verlust'
  if (!auffaellige.length && !vielVerlust) return null

  const zeilen = []
  zeilen.push(
    'Rückmeldung dieser Person auf frühere Hinweise. Das ist eine Bilanz der NÜTZLICHKEIT, '
    + 'kein Urteil über Richtigkeit: Ein verworfener Hinweis kann vollkommen richtig gewesen '
    + 'und trotzdem unerwünscht sein. Autorentscheidungen sind bindend.',
  )

  auffaellige.forEach(zeile => {
    // Der Vergleichswert ist die Verwerfensquote der ÜBRIGEN Arten. Er wird ausgeschrieben,
    // nicht nur als zweite Zahl danebengestellt: "25 %, sonst 86 %" liest sich sonst so, als
    // ginge es beide Male um dieselbe Größe in derselben Richtung.
    const sonst = `bei den übrigen Arten verwirft diese Person ${prozent(zeile.vergleichsAnteil)}`
    if (zeile.lage === 'traegt-selten') {
      zeilen.push(
        `- ${zeile.art}: ${zeile.verworfen} von ${zeile.bewertbar} bewerteten Hinweisen verworfen `
        + `(${prozent(zeile.verworfenAnteil)}) — ${sonst}. Gib diese Art weiter, aber prüfe hier `
        + 'besonders streng, ob dein Hinweis wirklich trägt, und lass ihn im Zweifel weg.',
      )
      return
    }
    zeilen.push(
      `- ${zeile.art}: ${zeile.angenommen} von ${zeile.bewertbar} bewerteten Hinweisen angenommen, `
      + `nur ${prozent(zeile.verworfenAnteil)} verworfen — ${sonst}. Diese Art trägt hier; sie ist die Mühe wert.`,
    )
  })

  if (vielVerlust) {
    zeilen.push(
      `- Handwerk: Von ${handwerk.geliefert} deiner bisherigen Hinweise erreichten `
      + `${handwerk.nichtZugestellt} (${prozent(handwerk.anteil)}) die Autorin oder den Autor gar nicht — `
      + 'entweder stand der Anker nicht wörtlich im Text, oder derselbe Punkt war schon einmal da. '
      + 'Zitiere den Anker buchstabengetreu und lies die Listen der bereits entschiedenen und der '
      + 'offenen Hinweise, bevor du etwas Neues formulierst.',
    )
  }

  zeilen.push(
    'Streiche keine Art aus deinem Repertoire. Eine hohe Verwerfensquote kann auch daher kommen, '
    + 'dass deine Hinweise dieser Art bisher schlecht formuliert waren.',
  )

  return zeilen.join('\n')
}

// Aus einer Bilanz wird zunaechst nur ein sichtbarer, versionierter VORSCHLAG. Statistik
// darf nie still zur Policy werden: Annahme/Verwerfen misst Nuetzlichkeit, nicht Wahrheit.
// Die Kennung haengt ausschliesslich an der Datengrundlage. Kommt ein weiterer Autorakt
// hinzu, entsteht ein neuer pending Vorschlag und eine alte Freigabe greift nicht weiter.
export function erstelleRueckkopplungsvorschlag(bilanz) {
  const hinweis = formuliereRueckkopplung(bilanz)
  if (!hinweis) return null
  const grundlage = {
    proArt: (bilanz.proArt || []).map(zeile => ({
      art: zeile.art,
      angeboten: zeile.angeboten,
      angenommen: zeile.angenommen,
      verworfen: zeile.verworfen,
      risikoAngenommen: zeile.risikoAngenommen,
      offen: zeile.offen,
      lage: zeile.lage,
    })),
    handwerk: bilanz.handwerk || null,
  }
  return {
    schemaVersion: 1,
    id: `rueckkopplung:${stabilerHash(JSON.stringify(grundlage))}`,
    status: 'pending',
    signal: 'usefulness-and-delivery',
    // Explizite Grenze fuer UI, Export und spaetere Migrationen. Diese Kalibrierung darf
    // weder Integritaetsregeln noch Kategorien, Datenschutz oder Autorenschaft aendern.
    scope: 'darreichung-only',
    bilanz: clone(bilanz),
    hinweis,
  }
}

export function entscheideRueckkopplung(vorschlag, { approved, actor, at } = {}) {
  if (!vorschlag || typeof vorschlag !== 'object' || !vorschlag.id) {
    throw new TypeError('Rueckkopplungsvorschlag is required')
  }
  if (actor !== 'user') throw new TypeError('Rueckkopplung requires explicit user consent')
  if (!Number.isFinite(at)) throw new TypeError('Rueckkopplung decision time is required')
  return {
    ...clone(vorschlag),
    status: approved === true ? 'approved' : 'rejected',
    decidedBy: 'user',
    decidedAt: at,
  }
}

export function aktiveRueckkopplung(vorschlag) {
  if (!vorschlag || vorschlag.status !== 'approved' || vorschlag.scope !== 'darreichung-only') return null
  return vorschlag.bilanz && typeof vorschlag.bilanz === 'object' ? clone(vorschlag.bilanz) : null
}

// Die Bilanz als lesbare Tabelle, für Oberfläche und Dokumentation — damit die
// Begründung an genau einer Stelle steht und nicht im Text daneben noch einmal
// (Vorbild: textartTabelle, momentTabelle).
export const LAGE_LABEL = Object.freeze({
  'noch-keine-aussage': 'noch keine Aussage',
  unauffaellig: 'unauffällig',
  traegt: 'trägt überdurchschnittlich',
  'traegt-selten': 'trägt selten',
})

export function rueckkopplungTabelle(bilanz) {
  const zeilen = Array.isArray(bilanz?.proArt) ? bilanz.proArt : []
  return zeilen.map(zeile => ({
    art: zeile.art,
    angeboten: zeile.angeboten,
    angenommen: zeile.angenommen,
    verworfen: zeile.verworfen,
    risikoAngenommen: zeile.risikoAngenommen,
    offen: zeile.offen,
    bewertbar: zeile.bewertbar,
    lage: zeile.lage,
    lageLabel: LAGE_LABEL[zeile.lage] || LAGE_LABEL['noch-keine-aussage'],
    // Warum steht hier (noch) keine Aussage? Die Zahl, die fehlt, ist die wichtigste
    // Auskunft für jemanden, der auf die Tabelle schaut.
    fehlt: zeile.lage === 'noch-keine-aussage'
      ? Math.max(0, MINDESTZAHL_JE_ART - zeile.bewertbar)
      : 0,
  }))
}
