import test from 'node:test'
import assert from 'node:assert/strict'
import {
  HINWEISARTEN,
  MAX_ARTEN_IM_BLOCK,
  MINDESTABSTAND,
  MINDESTZAHL_JE_ART,
  MINDESTZAHL_VERGLEICH,
  MINDESTZAHL_ZUGESTELLT,
  artVonFinding,
  aktiveRueckkopplung,
  bilanziereRueckmeldung,
  entscheideRueckkopplung,
  erstelleRueckkopplungsvorschlag,
  formuliereRueckkopplung,
  rueckkopplungTabelle,
} from '../src/rueckkopplung-model.mjs'

// Helfer: baut Findings EINER Art mit fertigen Entscheidungen dazu. Der Weg entspricht dem
// echten: hinweisZuFinding schreibt kiKategorie, decideFinding schreibt status UND eine
// Entscheidung mit findingId + outcome.
let laufendeNummer = 0
function macheArt(art, { angenommen = 0, verworfen = 0, risiko = 0, offen = 0 } = {}) {
  const findings = []
  const decisions = []
  const anlegen = (status, anzahl) => {
    for (let i = 0; i < anzahl; i += 1) {
      laufendeNummer += 1
      const id = `f-${art}-${status}-${laufendeNummer}`
      findings.push({ id, kiKategorie: art, status, target: `Stelle ${id}`, short: 'Beobachtung' })
      if (status !== 'open') {
        decisions.push({
          id: `d-${id}`,
          findingId: id,
          kind: status === 'resolved' ? 'accept' : 'reject',
          outcome: status,
          reason: '',
        })
      }
    }
  }
  anlegen('resolved', angenommen)
  anlegen('dismissed', verworfen)
  anlegen('risk-accepted', risiko)
  anlegen('open', offen)
  return { findings, decisions }
}

function machDokument(...teile) {
  return {
    findings: teile.flatMap(teil => teil.findings),
    decisions: teile.flatMap(teil => teil.decisions),
  }
}

function zeileFuer(bilanz, art) {
  return bilanz.proArt.find(zeile => zeile.art === art)
}

// ---- Was gezählt wird ---------------------------------------------------------

test('die acht Hinweisarten kommen aus agent-findings.mjs, nicht aus einer zweiten Liste', () => {
  assert.deepEqual([...HINWEISARTEN].sort(), [
    'erklaerung', 'fakt', 'logik', 'methode', 'quelle', 'sprache', 'struktur', 'wirkung',
  ])
})

test('leere Eingabe ergibt eine vollstaendige Bilanz ohne jede Aussage', () => {
  const bilanz = bilanziereRueckmeldung()
  assert.equal(bilanz.proArt.length, HINWEISARTEN.length)
  assert.ok(bilanz.proArt.every(zeile => zeile.lage === 'noch-keine-aussage'))
  assert.deepEqual(bilanz.auffaellige, [])
  assert.equal(bilanz.gesamt.bewertbar, 0)
  assert.equal(formuliereRueckkopplung(bilanz), null, 'kein leerer Wert darf einen Block erzeugen')
})

test('offene Hinweise zaehlen als angeboten, aber nicht als bewertet', () => {
  const bilanz = bilanziereRueckmeldung({
    dokumente: [machDokument(macheArt('struktur', { angenommen: 1, verworfen: 1, offen: 7 }))],
  })
  const struktur = zeileFuer(bilanz, 'struktur')
  assert.equal(struktur.angeboten, 9)
  assert.equal(struktur.offen, 7)
  assert.equal(struktur.bewertbar, 2)
})

test('Findings mehrerer Dokumente werden zu EINER Bilanz addiert', () => {
  const bilanz = bilanziereRueckmeldung({
    dokumente: [
      machDokument(macheArt('logik', { angenommen: 2, verworfen: 3 })),
      machDokument(macheArt('logik', { angenommen: 1, verworfen: 4 })),
    ],
  })
  const logik = zeileFuer(bilanz, 'logik')
  assert.equal(logik.angenommen, 3)
  assert.equal(logik.verworfen, 7)
  assert.equal(logik.bewertbar, 10)
})

test('Papierkorb und kopierte Finding-IDs erzeugen keine kuenstliche Lernmenge', () => {
  const original = machDokument(macheArt('logik', { angenommen: 3, verworfen: 2 }))
  const kopie = JSON.parse(JSON.stringify(original))
  const papierkorb = machDokument(macheArt('logik', { verworfen: 9 }))
  papierkorb.trashed = true
  const bilanz = bilanziereRueckmeldung({ dokumente: [original, kopie, papierkorb] })
  const logik = zeileFuer(bilanz, 'logik')
  assert.equal(logik.angeboten, 5, 'die Kopie darf dieselben Autorakte nicht verdoppeln')
  assert.equal(logik.verworfen, 2, 'Papierkorb-Entscheidungen sind keine aktuelle Lernbasis')
})

test('ohne kiKategorie faellt die Art auf die englische category zurueck; content bleibt ungezaehlt', () => {
  assert.equal(artVonFinding({ category: 'structure' }), 'struktur')
  assert.equal(artVonFinding({ category: 'citation' }), 'quelle')
  assert.equal(artVonFinding({ category: 'content' }), '', 'content steht fuer ZWEI Arten — raten waere falsch')
  assert.equal(artVonFinding({ category: 'quatsch' }), '')
  assert.equal(artVonFinding(null), '')

  const bilanz = bilanziereRueckmeldung({
    dokumente: [{
      findings: [
        { id: 'a', category: 'structure', status: 'dismissed' },
        { id: 'b', category: 'content', status: 'dismissed' },
      ],
      decisions: [],
    }],
  })
  assert.equal(zeileFuer(bilanz, 'struktur').verworfen, 1)
  assert.equal(bilanz.gesamt.angeboten, 1, 'das content-Finding darf in keiner Bilanz auftauchen')
})

test('die Entscheidung hat Vorrang vor dem Status, der Status springt ohne sie ein', () => {
  const bilanz = bilanziereRueckmeldung({
    dokumente: [{
      findings: [
        { id: 'mit-entscheidung', kiKategorie: 'fakt', status: 'open' },
        { id: 'ohne-entscheidung', kiKategorie: 'fakt', status: 'dismissed' },
      ],
      decisions: [{ findingId: 'mit-entscheidung', kind: 'accept', outcome: 'resolved' }],
    }],
  })
  const fakt = zeileFuer(bilanz, 'fakt')
  assert.equal(fakt.angenommen, 1)
  assert.equal(fakt.verworfen, 1)
  assert.equal(fakt.offen, 0)
})

// ---- Die Schwelle -------------------------------------------------------------

test('unterhalb der Mindestzahl je Art sagt das Modul GAR NICHTS, auch bei vier von vier verworfen', () => {
  const bilanz = bilanziereRueckmeldung({
    dokumente: [machDokument(
      macheArt('struktur', { verworfen: MINDESTZAHL_JE_ART - 1 }),
      macheArt('fakt', { angenommen: 20 }),
    )],
  })
  const struktur = zeileFuer(bilanz, 'struktur')
  assert.equal(struktur.verworfenAnteil, 1, 'die Quote wird berechnet …')
  assert.equal(struktur.lage, 'noch-keine-aussage', '… aber sie bedeutet noch nichts')
  assert.equal(struktur.abstand, null)
  assert.deepEqual(bilanz.auffaellige, [], 'fail-closed: kein Eintrag, nicht "unauffaellig"')
})

test('ohne genug Vergleichsfaelle bei den ANDEREN Arten bleibt es bei "noch keine Aussage"', () => {
  const bilanz = bilanziereRueckmeldung({
    dokumente: [machDokument(
      macheArt('struktur', { verworfen: 12 }),
      macheArt('fakt', { angenommen: MINDESTZAHL_VERGLEICH - 1 }),
    )],
  })
  assert.equal(zeileFuer(bilanz, 'struktur').lage, 'noch-keine-aussage',
    'sonst vergliche sich die Art fast nur mit sich selbst')
})

test('ab der Schwelle und mit deutlichem Abstand: haeufig verworfen heisst "traegt-selten"', () => {
  const bilanz = bilanziereRueckmeldung({
    dokumente: [machDokument(
      macheArt('struktur', { angenommen: 2, verworfen: 18 }),
      macheArt('fakt', { angenommen: 9, verworfen: 3 }),
    )],
  })
  const struktur = zeileFuer(bilanz, 'struktur')
  assert.equal(struktur.bewertbar, 20)
  assert.equal(struktur.verworfenAnteil, 0.9)
  assert.equal(struktur.vergleichsAnteil, 0.25, 'verglichen wird gegen den REST, nicht gegen 50 Prozent')
  assert.equal(struktur.lage, 'traegt-selten')
  assert.deepEqual(bilanz.auffaellige.map(zeile => zeile.art), ['struktur', 'fakt'])
})

test('haeufig angenommen heisst "traegt"', () => {
  const bilanz = bilanziereRueckmeldung({
    dokumente: [machDokument(
      macheArt('fakt', { angenommen: 9, verworfen: 1 }),
      macheArt('struktur', { angenommen: 2, verworfen: 18 }),
    )],
  })
  assert.equal(zeileFuer(bilanz, 'fakt').lage, 'traegt')
})

test('genug Faelle, aber kein Abstand: "unauffaellig" — das ist etwas anderes als keine Aussage', () => {
  const bilanz = bilanziereRueckmeldung({
    dokumente: [machDokument(
      macheArt('sprache', { angenommen: 3, verworfen: 2 }),
      macheArt('fakt', { angenommen: 6, verworfen: 4 }),
    )],
  })
  const sprache = zeileFuer(bilanz, 'sprache')
  assert.equal(sprache.lage, 'unauffaellig')
  assert.ok(Math.abs(sprache.abstand) < MINDESTABSTAND)
  assert.deepEqual(bilanz.auffaellige, [], 'unauffaellige Arten stehen in keinem Prompt-Block')
})

// ---- Der Denkfehler, der hier NICHT gemacht werden darf ------------------------

test('ein bewusst angenommenes Risiko ist KEIN Verwerfen — es steht in der Bilanz, treibt aber die Quote nicht', () => {
  const bilanz = bilanziereRueckmeldung({
    dokumente: [machDokument(
      macheArt('quelle', { angenommen: 3, verworfen: 2, risiko: 10 }),
      macheArt('fakt', { angenommen: 6, verworfen: 4 }),
    )],
  })
  const quelle = zeileFuer(bilanz, 'quelle')
  assert.equal(quelle.risikoAngenommen, 10, 'das Risiko wird sehr wohl gezaehlt')
  assert.equal(quelle.angeboten, 15)
  assert.equal(quelle.bewertbar, 5, 'bewertbar = angenommen + verworfen, ohne die Risiken')
  assert.equal(quelle.verworfenAnteil, 0.4)
  // Wuerde das Risiko als Verwerfen zaehlen, waere die Quote 12/15 = 0.8 und die Art
  // faelschlich als 'traegt-selten' abgestempelt — dabei hat die Person genau diese
  // Hinweise am gruendlichsten gelesen.
  assert.equal(quelle.lage, 'unauffaellig')
})

test('Purität: gleiche Eingabe ergibt byte-gleiche Ausgabe, die Eingabe bleibt unberuehrt', () => {
  const teil = macheArt('logik', { angenommen: 4, verworfen: 6 })
  Object.freeze(teil.findings)
  Object.freeze(teil.decisions)
  teil.findings.forEach(Object.freeze)
  teil.decisions.forEach(Object.freeze)
  const eingabe = { dokumente: [{ findings: teil.findings, decisions: teil.decisions }] }
  assert.equal(
    JSON.stringify(bilanziereRueckmeldung(eingabe)),
    JSON.stringify(bilanziereRueckmeldung(eingabe)),
  )
})

test('kaputte Eingaben werfen nicht', () => {
  assert.doesNotThrow(() => bilanziereRueckmeldung({ dokumente: null }))
  assert.doesNotThrow(() => bilanziereRueckmeldung({ dokumente: [null, 7, 'x', {}] }))
  assert.doesNotThrow(() => bilanziereRueckmeldung({ dokumente: [{ findings: 'nein', decisions: 3 }] }))
})

// ---- Die zweite Messung: was gar nicht ankam ----------------------------------

test('das Laufprotokoll ergibt eine eigene Handwerks-Bilanz — ueber alle Dokumente summiert', () => {
  const bilanz = bilanziereRueckmeldung({
    dokumente: [
      { findings: [], decisions: [], hinweislauf: { laeufe: 6, summeGeliefert: 18, summeVerworfen: 8, summeUebernommen: 10 } },
      { findings: [], decisions: [], hinweislauf: { laeufe: 4, summeGeliefert: 12, summeVerworfen: 4, summeUebernommen: 8 } },
    ],
  })
  assert.equal(bilanz.handwerk.laeufe, 10)
  assert.equal(bilanz.handwerk.geliefert, 30)
  assert.equal(bilanz.handwerk.nichtZugestellt, 12)
  assert.equal(bilanz.handwerk.lage, 'viel-verlust')
})

test('zu wenige gelieferte Hinweise: keine Handwerks-Aussage, auch bei totalem Verlust', () => {
  const bilanz = bilanziereRueckmeldung({
    dokumente: [{
      findings: [],
      decisions: [],
      hinweislauf: { laeufe: 3, summeGeliefert: MINDESTZAHL_ZUGESTELLT - 1, summeVerworfen: MINDESTZAHL_ZUGESTELLT - 1, summeUebernommen: 0 },
    }],
  })
  assert.equal(bilanz.handwerk.anteil, 1)
  assert.equal(bilanz.handwerk.lage, 'noch-keine-aussage')
})

test('ein fehlendes oder altes Protokoll ohne Summen zaehlt als null, nicht als Fehler', () => {
  const bilanz = bilanziereRueckmeldung({
    dokumente: [
      { findings: [], decisions: [] },
      { findings: [], decisions: [], hinweislauf: { signatur: 'abc', gestartet: 3, verworfen: 1, uebernommen: 2 } },
    ],
  })
  assert.equal(bilanz.handwerk.geliefert, 0)
  assert.equal(bilanz.handwerk.lage, 'noch-keine-aussage')
})

// ---- Der Prompt-Block ---------------------------------------------------------

const AUFFAELLIG = {
  dokumente: [machDokument(
    macheArt('struktur', { angenommen: 2, verworfen: 18 }),
    macheArt('fakt', { angenommen: 9, verworfen: 3 }),
  )],
}

test('der Block nennt Zahlen, Vergleichswert und beide Richtungen', () => {
  const block = formuliereRueckkopplung(bilanziereRueckmeldung(AUFFAELLIG))
  assert.ok(block.includes('struktur: 18 von 20'), block)
  assert.ok(block.includes('90 %'), block)
  assert.ok(block.includes('bei den übrigen Arten verwirft diese Person 25 %'), block)
  assert.ok(block.includes('fakt: 9 von 12'), block)
})

test('der Block schneidet KEINE Hinweisart ab — er verschaerft nur die Pruefung', () => {
  const block = formuliereRueckkopplung(bilanziereRueckmeldung(AUFFAELLIG))
  assert.ok(block.includes('Gib diese Art weiter'), 'die Art darf nicht abgeschaltet werden')
  assert.ok(block.includes('prüfen') || block.includes('prüfe'), block)
  assert.ok(block.includes('Streiche keine Art aus deinem Repertoire'), block)
  for (const verbot of ['nicht mehr', 'unterlasse', 'verzichte', 'hör auf', 'gib keine']) {
    assert.ok(!block.toLowerCase().includes(verbot), `Der Block darf "${verbot}" nicht enthalten:\n${block}`)
  }
})

test('der Block sagt ausdruecklich, dass er Nuetzlichkeit misst und nicht Richtigkeit', () => {
  const block = formuliereRueckkopplung(bilanziereRueckmeldung(AUFFAELLIG))
  assert.ok(block.includes('NÜTZLICHKEIT'), block)
  assert.ok(block.includes('kein Urteil über Richtigkeit'), block)
  assert.ok(block.includes('Autorentscheidungen sind bindend'), block)
})

test('harte Obergrenze: hoechstens MAX_ARTEN_IM_BLOCK Arten, die mit dem groessten Abstand zuerst', () => {
  const viele = ['struktur', 'wirkung', 'erklaerung', 'sprache', 'logik']
    .map(art => macheArt(art, { verworfen: 5 }))
  const gegengewicht = [macheArt('fakt', { angenommen: 20 }), macheArt('quelle', { angenommen: 20 })]
  const bilanz = bilanziereRueckmeldung({ dokumente: [machDokument(...viele, ...gegengewicht)] })

  assert.ok(bilanz.proArt.filter(zeile => zeile.lage !== 'noch-keine-aussage' && zeile.lage !== 'unauffaellig').length > MAX_ARTEN_IM_BLOCK)
  assert.equal(bilanz.auffaellige.length, MAX_ARTEN_IM_BLOCK)
  const abstaende = bilanz.auffaellige.map(zeile => Math.abs(zeile.abstand))
  assert.deepEqual(abstaende, [...abstaende].sort((a, b) => b - a), 'groesster Abstand zuerst')

  const block = formuliereRueckkopplung(bilanz)
  const artZeilen = block.split('\n').filter(zeile => zeile.startsWith('- '))
  assert.equal(artZeilen.length, MAX_ARTEN_IM_BLOCK)
})

test('nur Handwerks-Verlust und keine auffaellige Art ergibt trotzdem einen Block', () => {
  const bilanz = bilanziereRueckmeldung({
    dokumente: [{ findings: [], decisions: [], hinweislauf: { laeufe: 10, summeGeliefert: 30, summeVerworfen: 15, summeUebernommen: 15 } }],
  })
  const block = formuliereRueckkopplung(bilanz)
  assert.ok(block.includes('Handwerk'), block)
  assert.ok(block.includes('30') && block.includes('15'), block)
  assert.ok(block.includes('buchstabengetreu'), block)
})

test('formuliereRueckkopplung ist robust und gibt bei nichts Sagbarem null zurueck', () => {
  assert.equal(formuliereRueckkopplung(null), null)
  assert.equal(formuliereRueckkopplung(undefined), null)
  assert.equal(formuliereRueckkopplung({}), null)
  assert.equal(formuliereRueckkopplung(bilanziereRueckmeldung({
    dokumente: [machDokument(macheArt('sprache', { angenommen: 3, verworfen: 2 }), macheArt('fakt', { angenommen: 6, verworfen: 4 }))],
  })), null, 'unauffaellige Lage sagt nichts')
})

test('eine Bilanz veraendert den Prompt erst nach ausdruecklicher Zustimmung', () => {
  const bilanz = bilanziereRueckmeldung(AUFFAELLIG)
  const vorschlag = erstelleRueckkopplungsvorschlag(bilanz)
  assert.equal(vorschlag.status, 'pending')
  assert.equal(aktiveRueckkopplung(vorschlag), null, 'Statistik allein darf keine Policy aendern')

  const freigegeben = entscheideRueckkopplung(vorschlag, { approved: true, actor: 'user', at: 100 })
  assert.equal(aktiveRueckkopplung(freigegeben).gesamt.bewertbar, bilanz.gesamt.bewertbar)
  assert.equal(vorschlag.status, 'pending', 'die Entscheidung mutiert den Vorschlag nicht')

  const abgelehnt = entscheideRueckkopplung(vorschlag, { approved: false, actor: 'user', at: 101 })
  assert.equal(aktiveRueckkopplung(abgelehnt), null)
})

test('nur die Autorin oder der Autor darf eine Kalibrierung freigeben', () => {
  const vorschlag = erstelleRueckkopplungsvorschlag(bilanziereRueckmeldung(AUFFAELLIG))
  assert.throws(
    () => entscheideRueckkopplung(vorschlag, { approved: true, actor: 'agent', at: 100 }),
    /user|Autor/i,
  )
})

test('aendert sich die Datengrundlage, ist eine alte Freigabe nicht still fuer die neue gueltig', () => {
  const alt = erstelleRueckkopplungsvorschlag(bilanziereRueckmeldung(AUFFAELLIG))
  const freigegeben = entscheideRueckkopplung(alt, { approved: true, actor: 'user', at: 100 })
  const neu = erstelleRueckkopplungsvorschlag(bilanziereRueckmeldung({
    dokumente: [machDokument(
      macheArt('struktur', { angenommen: 3, verworfen: 18 }),
      macheArt('fakt', { angenommen: 9, verworfen: 3 }),
    )],
  }))
  assert.notEqual(neu.id, freigegeben.id)
  assert.equal(neu.status, 'pending')
  assert.equal(aktiveRueckkopplung(neu), null)
})

// ---- Die Tabelle für Oberfläche und Dokumentation ------------------------------

test('die Tabelle nennt bei "noch keine Aussage", wie viele Faelle noch fehlen', () => {
  const tabelle = rueckkopplungTabelle(bilanziereRueckmeldung({
    dokumente: [machDokument(macheArt('struktur', { verworfen: 2 }))],
  }))
  const struktur = tabelle.find(zeile => zeile.art === 'struktur')
  assert.equal(struktur.lageLabel, 'noch keine Aussage')
  assert.equal(struktur.fehlt, MINDESTZAHL_JE_ART - 2)
  assert.equal(tabelle.length, HINWEISARTEN.length)
  assert.deepEqual(rueckkopplungTabelle(null), [])
})
