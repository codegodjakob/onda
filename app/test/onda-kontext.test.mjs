import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MAX_AUSSAGEN,
  MAX_GEDAECHTNIS,
  MAX_NACHBARTEXTE,
  MAX_NACHBAR_ZEICHEN,
  baueNachbartexte,
  baueOndaBloecke,
  ergaenzeOndaKontext,
  textAusKoerper,
} from '../src/onda-kontext.mjs'
import { baueHinweisKontext } from '../src/hinweis-kontext.mjs'
import { baueErweiterungKontext } from '../src/erweiterung-kontext.mjs'
import { baueChatKontext } from '../src/chat-kontext.mjs'
import { baueVerstaendnisKontext } from '../src/verstaendnis-kontext.mjs'
import { baueAnfrage } from '../src/agent-tasks.mjs'
import { synchronizeClaimLedger } from '../src/claim-ledger.mjs'
import { updateLanguageProfile } from '../src/language-profile.mjs'
import { createMemoryEntry, ensureMemoryStore } from '../src/memory-model.mjs'
import { schreibeErkanntes } from '../src/erkanntes-model.mjs'
import { LANGUAGE_GENRES } from '../src/language-profile.mjs'

// PFLICHT (Lehre aus V-3/H-2, siehe hinweis-kontext.test.mjs): baueAnfrage (agent-tasks.mjs)
// konsumiert ausschliesslich {verstaendnis, docText, volatiles, verlauf, anfrage}. Ein Block,
// der irgendwo anders landet, wird stillschweigend verschluckt — und alle Tests blieben gruen,
// wenn sie nur den Zwischenwert pruefen. Diese Tests fahren deshalb den echten Weg
// (Kontext-Bauer -> baueAnfrage) und pruefen den TATSAECHLICHEN Request-Body.
//
// Die Fixtures entstehen aus den ECHTEN Quellen (updateLanguageProfile, synchronizeClaimLedger,
// createMemoryEntry) und nicht aus handgeschriebenen Objekten: sonst wuerde ein Testfixture
// gruen bleiben, waehrend die echte Datenform daneben weiterlaeuft.

const PROJEKT_ID = 'projekt-onda'
const OFFENER_TEXT = { id: 'doc-offen', title: 'Kapitel 1' }
const ANDERER_TEXT = { id: 'doc-anderer', title: 'Kapitel 2' }
const ALLE_TEXTE = [OFFENER_TEXT, ANDERER_TEXT]

// Ein echter Geschwistertext, so wie ihn der Editor speichert: HTML mit Bausteinkennungen,
// Ueberschriften und Entitaeten. Handgeschrieben waere hier gefaehrlich — der Block wird
// spaeter als Suchraum fuer Anker benutzt, und wenn die Testfassung anders aussieht als das
// Gespeicherte, bliebe der Test gruen, waehrend die Verankerung danebenlaeuft.
const NACHBAR_KOERPER = '<h2 data-block-id="b-n1">MARKANTE-NACHBAR-UEBERSCHRIFT-1c9e</h2>'
  + '<p data-block-id="b-n2">MARKANTER-NACHBAR-ANFANG-4f2a beginnt mit einer eigenen These '
  + '&#252;ber Wasser &amp; Leitungen.</p>'
  + '<p data-block-id="b-n3">Danach folgt ein zweiter Absatz, damit dieser Text lang genug '
  + 'ist, um &#252;berhaupt als Nachbar zu z&#228;hlen.</p>'

function nachbarText(overrides = {}) {
  return {
    id: 'doc-nachbar',
    title: 'Kapitel 3',
    projectId: PROJEKT_ID,
    updated: 5000,
    body: NACHBAR_KOERPER,
    ...overrides,
  }
}

function sprachprofil(changes) {
  return updateLanguageProfile({ profile: null, projectId: PROJEKT_ID, changes, at: 1000 })
}

function aussagenModell(texte, evidenceBundles = []) {
  return synchronizeClaimLedger({
    projectId: PROJEKT_ID,
    model: null,
    texts: texte,
    evidenceBundles,
    at: 2000,
  })
}

function textZustand(textId, saetze, role = 'claim') {
  return {
    textId,
    projectId: PROJEKT_ID,
    blocks: saetze.map((text, index) => ({ id: `${textId}-b${index}`, role, text })),
  }
}

function gedaechtnis(eintraege) {
  const store = ensureMemoryStore(null)
  eintraege.forEach((eintrag, index) => {
    store.entries.push(createMemoryEntry({
      id: eintrag.id || `memory-${index}`,
      level: eintrag.level,
      type: eintrag.type || 'voice',
      content: eintrag.content,
      scope: eintrag.level === 'project'
        ? { projectId: PROJEKT_ID }
        : eintrag.level === 'topic'
          ? { topicId: `thema-${index}`, projectIds: [PROJEKT_ID] }
          : { ownerId: 'local-author', projectIds: [PROJEKT_ID] },
      provenance: { actor: 'user', action: 'share-proposal', originEventIds: [`ereignis-${index}`] },
      sensitivity: 'sensitive',
      deletionRule: 'manual',
      createdAt: 3000 + index,
    }))
  })
  return store
}

function vollesProjekt() {
  return {
    id: PROJEKT_ID,
    name: 'Onda-Projekt',
    languageProfile: sprachprofil({
      genre: 'scientific',
      domain: 'MARKANTES-FACH-7a3c',
      medium: 'academic-submission',
      region: 'CH',
      passageFunction: 'MARKANTE-FUNKTION-5e1d',
      houseStyle: ['MARKANTE-HAUSSTILREGEL-2b8f'],
      audienceState: { resistances: ['MARKANTER-WIDERSTAND-9d4a'] },
    }),
    argumentModel: aussagenModell([
      textZustand(OFFENER_TEXT.id, ['Der offene Text behauptet etwas Eigenes.']),
      textZustand(ANDERER_TEXT.id, ['MARKANTE-FREMDAUSSAGE-3f6b zeigt eine klare Wirkung.']),
    ]),
  }
}

function vollstaendigeQuellen() {
  return {
    project: vollesProjekt(),
    doc: OFFENER_TEXT,
    docs: [...ALLE_TEXTE, nachbarText()],
    memoryStore: gedaechtnis([
      { level: 'project', content: 'MARKANTE-PROJEKTSTIMME-8c2e' },
      { level: 'personal', content: 'MARKANTE-VORLIEBE-4a7d' },
      { level: 'topic', type: 'knowledge', content: 'MARKANTES-THEMENWISSEN-6b9f' },
    ]),
  }
}

// --- Regel 3: nichts erfinden ------------------------------------------------------------

test('ohne Quellen entsteht KEIN Block — nicht einer, auch kein leerer', () => {
  assert.deepEqual(baueOndaBloecke(), [])
  assert.deepEqual(baueOndaBloecke(null), [])
  assert.deepEqual(baueOndaBloecke({}), [])
  assert.deepEqual(baueOndaBloecke({ project: null, doc: null, docs: [], memoryStore: null }), [])
})

test('ein Projekt ohne jede Angabe erzeugt keinen Block und kein Wort "unbekannt"', () => {
  const bloecke = baueOndaBloecke({
    project: { id: PROJEKT_ID },
    doc: OFFENER_TEXT,
    docs: ALLE_TEXTE,
    memoryStore: ensureMemoryStore(null),
  })
  assert.deepEqual(bloecke, [], 'ein leeres Projekt darf gar nichts kosten')
})

test('leere Einzelquellen erzeugen jeweils gar keinen Block, die gefuellte bleibt allein', () => {
  const nurSprache = baueOndaBloecke({
    project: { id: PROJEKT_ID, languageProfile: sprachprofil({ genre: 'essay' }) },
    doc: OFFENER_TEXT,
  })
  assert.equal(nurSprache.length, 1)
  assert.match(nurSprache[0], /Textsorte: Essay/)

  const nurAussagen = baueOndaBloecke({
    project: {
      id: PROJEKT_ID,
      argumentModel: aussagenModell([textZustand(ANDERER_TEXT.id, ['Eine fremde These ist belegbar.'])]),
    },
    doc: OFFENER_TEXT,
    docs: ALLE_TEXTE,
  })
  assert.equal(nurAussagen.length, 1)
  assert.match(nurAussagen[0], /Aussagen-Speicher/)

  const nurGedaechtnis = baueOndaBloecke({
    project: { id: PROJEKT_ID },
    doc: OFFENER_TEXT,
    memoryStore: gedaechtnis([{ level: 'project', content: 'Nur eine Festlegung.' }]),
  })
  assert.equal(nurGedaechtnis.length, 1)
  assert.match(nurGedaechtnis[0], /Gedächtnis/)
})

test('"Sonstig" behauptet keine Textart, setzt aber die fail-closed Arbeitsgrenze', () => {
  const bloecke = baueOndaBloecke({
    project: { id: PROJEKT_ID, languageProfile: sprachprofil({ genre: 'other', medium: 'other' }) },
    doc: OFFENER_TEXT,
  })
  assert.equal(bloecke.length, 1)
  assert.doesNotMatch(bloecke[0], /Textsorte:|Medium:/)
  assert.match(bloecke[0], /Keine Textart raten/)
})

test('Zielgruppe und Zielzustand aus dem Projektverstaendnis werden NICHT doppelt geschickt', () => {
  // buildLanguageContext faellt fuer audience/goal auf das Projektverstaendnis zurueck. Das
  // steht aber bereits im gecachten Praefix — ein zweites Mal waere bei jedem Lauf bezahlte
  // Doppelung.
  const project = {
    id: PROJEKT_ID,
    languageProfile: sprachprofil({ genre: 'essay' }),
    understanding: {
      audience: ['MARKANTE-VERSTAENDNIS-ZIELGRUPPE-1a2b'],
      desiredEffect: 'MARKANTE-VERSTAENDNIS-WIRKUNG-3c4d',
    },
  }
  const bloecke = baueOndaBloecke({ project, doc: OFFENER_TEXT })
  const text = bloecke.join('\n')
  assert.doesNotMatch(text, /MARKANTE-VERSTAENDNIS-ZIELGRUPPE-1a2b/)
  assert.doesNotMatch(text, /MARKANTE-VERSTAENDNIS-WIRKUNG-3c4d/)

  // Steht dasselbe Feld dagegen im Sprachprofil, ist es neue Auskunft und geht mit.
  const eigenes = baueOndaBloecke({
    project: {
      ...project,
      languageProfile: sprachprofil({ genre: 'essay', audience: ['MARKANTE-PROFIL-ZIELGRUPPE-5e6f'] }),
    },
    doc: OFFENER_TEXT,
  })
  assert.match(eigenes.join('\n'), /MARKANTE-PROFIL-ZIELGRUPPE-5e6f/)
})

test('ein beschaedigtes Sprachprofil verhindert keinen Lauf, es faellt nur der Block weg', () => {
  const project = {
    id: PROJEKT_ID,
    languageProfile: { ...sprachprofil({ genre: 'essay' }), projectId: 'ein-fremdes-projekt' },
    argumentModel: aussagenModell([textZustand(ANDERER_TEXT.id, ['Eine fremde These ist belegbar.'])]),
  }
  const bloecke = baueOndaBloecke({ project, doc: OFFENER_TEXT, docs: ALLE_TEXTE })
  assert.equal(bloecke.length, 1, 'nur der Aussagen-Block bleibt')
  assert.match(bloecke[0], /Aussagen-Speicher/)
})

// --- Regel 2: Obergrenzen ----------------------------------------------------------------

test(`der Aussagen-Speicher zeigt hoechstens ${MAX_AUSSAGEN} Aussagen und nennt die Gesamtzahl`, () => {
  const saetze = Array.from({ length: 15 }, (_, index) => `Die Regel ${index} ist eindeutig formuliert.`)
  const project = {
    id: PROJEKT_ID,
    argumentModel: aussagenModell([textZustand(ANDERER_TEXT.id, saetze)]),
  }
  const [block] = baueOndaBloecke({ project, doc: OFFENER_TEXT, docs: ALLE_TEXTE })
  const zeilen = block.split('\n').filter(zeile => zeile.startsWith('- '))
  assert.equal(zeilen.length, MAX_AUSSAGEN, 'die Obergrenze muss greifen')
  assert.match(block, /Erfasst sind 15 solcher Aussagen/, 'die Gesamtzahl gehoert dazu, nicht die Aussagen selbst')
})

test('unter der Obergrenze steht keine Gesamtzahl-Zeile', () => {
  const project = {
    id: PROJEKT_ID,
    argumentModel: aussagenModell([textZustand(ANDERER_TEXT.id, ['Eine fremde These ist belegbar.'])]),
  }
  const [block] = baueOndaBloecke({ project, doc: OFFENER_TEXT, docs: ALLE_TEXTE })
  assert.doesNotMatch(block, /Erfasst sind/)
})

test(`das Gedaechtnis zeigt hoechstens ${MAX_GEDAECHTNIS} Eintraege, bindende zuerst`, () => {
  const eintraege = [
    ...Array.from({ length: 6 }, (_, index) => ({ level: 'project', content: `Bindende Festlegung ${index}` })),
    ...Array.from({ length: 6 }, (_, index) => ({ level: 'personal', content: `UNVERBINDLICHE-VORLIEBE-${index}` })),
  ]
  const [block] = baueOndaBloecke({
    project: { id: PROJEKT_ID },
    doc: OFFENER_TEXT,
    memoryStore: gedaechtnis(eintraege),
  })
  const gezeigt = block.match(/»[^«]*«/g) || []
  assert.equal(gezeigt.length, MAX_GEDAECHTNIS, 'die Obergrenze muss greifen')
  for (let index = 0; index < 6; index += 1) {
    assert.match(block, new RegExp(`Bindende Festlegung ${index}`), 'keine Zusage darf einer Vorliebe weichen')
  }
  assert.equal((block.match(/UNVERBINDLICHE-VORLIEBE-/g) || []).length, 2)
})

test('lange Aussagen werden gekuerzt, nicht in voller Laenge bezahlt', () => {
  const langerSatz = `${'sehr '.repeat(80)}lange Behauptung ist hier formuliert.`
  const project = {
    id: PROJEKT_ID,
    argumentModel: aussagenModell([textZustand(ANDERER_TEXT.id, [langerSatz])]),
  }
  const [block] = baueOndaBloecke({ project, doc: OFFENER_TEXT, docs: ALLE_TEXTE })
  assert.ok(block.length < 500, `Block ist ${block.length} Zeichen lang und damit ungekuerzt`)
  assert.match(block, /…/, 'der Kuerzungspunkt fehlt')
})

// --- Was mitgeht und was nicht ------------------------------------------------------------

test('Aussagen des offenen Textes gehen nur mit, wenn sie einen Belegstand tragen', () => {
  const ohneBeleg = {
    id: PROJEKT_ID,
    argumentModel: aussagenModell([textZustand(OFFENER_TEXT.id, ['MARKANTE-EIGENAUSSAGE-2c5a ist deutlich formuliert.'])]),
  }
  assert.deepEqual(
    baueOndaBloecke({ project: ohneBeleg, doc: OFFENER_TEXT, docs: ALLE_TEXTE }),
    [],
    'der Wortlaut steht schon im gecachten Dokumentblock — ein zweites Mal waere bezahlte Doppelung',
  )

  const claimText = 'MARKANTE-EIGENAUSSAGE-2c5a ist deutlich formuliert.'
  const mitBeleg = {
    id: PROJEKT_ID,
    argumentModel: aussagenModell(
      [textZustand(OFFENER_TEXT.id, [claimText])],
      [{ id: 'buendel-1', projectId: PROJEKT_ID, claimText, status: 'supported', support: [{ sourceId: 'q1' }] }],
    ),
  }
  const [block] = baueOndaBloecke({ project: mitBeleg, doc: OFFENER_TEXT, docs: ALLE_TEXTE })
  assert.match(block, /MARKANTE-EIGENAUSSAGE-2c5a/)
  assert.match(block, /im offenen Text/)
  assert.match(block, /belegt/, 'der Belegstand ist abgeleitetes Wissen und steht nirgends im Dokumenttext')
})

test('Aussagen aus anderen Texten nennen den Text beim Namen', () => {
  const project = {
    id: PROJEKT_ID,
    argumentModel: aussagenModell([textZustand(ANDERER_TEXT.id, ['Eine fremde These ist belegbar.'])]),
  }
  const [mitTitel] = baueOndaBloecke({ project, doc: OFFENER_TEXT, docs: ALLE_TEXTE })
  assert.match(mitTitel, /aus »Kapitel 2«/)

  const [ohneTitel] = baueOndaBloecke({ project, doc: OFFENER_TEXT, docs: [] })
  assert.match(ohneTitel, /aus einem anderen Text des Projekts/, 'ohne Titel wird keiner erfunden')

  // Ohne offenes Dokument gehoert KEINE Aussage zum offenen Text — sonst stuende
  // "im offenen Text" an einem Satz, den niemand offen hat.
  const [ohneDokument] = baueOndaBloecke({ project, docs: [] })
  assert.match(ohneDokument, /aus diesem Projekt/)
  assert.doesNotMatch(ohneDokument, /im offenen Text/)
})

test('veraltete und zurueckgezogene Aussagen gehen gar nicht mit', () => {
  const modell = aussagenModell([textZustand(ANDERER_TEXT.id, ['MARKANTE-ALTE-AUSSAGE-7f1e ist überholt.'])])
  modell.claims[0].status = 'stale'
  assert.deepEqual(
    baueOndaBloecke({ project: { id: PROJEKT_ID, argumentModel: modell }, doc: OFFENER_TEXT, docs: ALLE_TEXTE }),
    [],
  )
  modell.claims[0].status = 'active'
  modell.claims[0].validity = 'withdrawn'
  assert.deepEqual(
    baueOndaBloecke({ project: { id: PROJEKT_ID, argumentModel: modell }, doc: OFFENER_TEXT, docs: ALLE_TEXTE }),
    [],
  )
})

test('das Gedaechtnis trennt Bindendes von unverbindlicher Vorliebe', () => {
  const [block] = baueOndaBloecke({
    project: { id: PROJEKT_ID },
    doc: OFFENER_TEXT,
    memoryStore: gedaechtnis([
      { level: 'project', content: 'MARKANTE-PROJEKTSTIMME-8c2e' },
      { level: 'personal', content: 'MARKANTE-VORLIEBE-4a7d' },
      { level: 'topic', type: 'knowledge', content: 'MARKANTES-THEMENWISSEN-6b9f' },
    ]),
  })
  assert.match(block, /bindend: »MARKANTE-PROJEKTSTIMME-8c2e«/)
  assert.match(block, /freigegebenes Wissen: »MARKANTES-THEMENWISSEN-6b9f«/)
  assert.match(block, /nicht bindend[^\n]*»MARKANTE-VORLIEBE-4a7d«/)
})

test('ein Gedaechtnis eines anderen Projekts erreicht dieses Projekt nicht', () => {
  const store = gedaechtnis([{ level: 'project', content: 'MARKANTE-FREMDE-ERINNERUNG-0d3c' }])
  store.entries[0].scope = { projectId: 'ein-anderes-projekt' }
  assert.deepEqual(baueOndaBloecke({ project: { id: PROJEKT_ID }, doc: OFFENER_TEXT, memoryStore: store }), [])
})

// --- Regel 1: alles volatil, nichts im Cache-Praefix --------------------------------------

const KANAELE = [
  {
    name: 'hinweise',
    baue: onda => baueHinweisKontext({ verstaendnis: { task: 'Essay' }, docText: 'Dokumenttext', onda }),
  },
  {
    name: 'erweiterungen',
    baue: onda => baueErweiterungKontext({ verstaendnis: { task: 'Essay' }, docText: 'Dokumenttext', onda }),
  },
  {
    name: 'chat',
    baue: onda => baueChatKontext({
      verstaendnis: { task: 'Essay' },
      docText: 'Dokumenttext',
      anfrage: 'Was meinst du?',
      onda,
    }),
  },
  {
    name: 'verstaendnis',
    baue: onda => baueVerstaendnisKontext({
      modus: 'entwurf',
      verstaendnis: { task: 'Essay' },
      docText: 'Dokumenttext',
      onda,
    }),
  },
]

for (const kanal of KANAELE) {
  test(`${kanal.name}: Textsorte, Aussagen-Speicher und Gedaechtnis erreichen den echten Request-Body`, () => {
    const anfrage = baueAnfrage(kanal.name, kanal.baue(vollstaendigeQuellen()))
    const bodyJson = JSON.stringify(anfrage.body)
    for (const marke of [
      'MARKANTES-FACH-7a3c',
      'MARKANTE-FUNKTION-5e1d',
      'MARKANTE-HAUSSTILREGEL-2b8f',
      'MARKANTER-WIDERSTAND-9d4a',
      'MARKANTE-FREMDAUSSAGE-3f6b',
      'MARKANTE-PROJEKTSTIMME-8c2e',
      'MARKANTE-VORLIEBE-4a7d',
      'MARKANTES-THEMENWISSEN-6b9f',
      'MARKANTE-NACHBAR-UEBERSCHRIFT-1c9e',
      'MARKANTER-NACHBAR-ANFANG-4f2a',
    ]) {
      assert.ok(bodyJson.includes(marke), `${marke} fehlt im Request-Body von ${kanal.name}`)
    }
  })

  test(`${kanal.name}: KEIN Onda-Block traegt cache_control — der Praefix bleibt stabil`, () => {
    const anfrage = baueAnfrage(kanal.name, kanal.baue(vollstaendigeQuellen()))
    const content = anfrage.body.messages[0].content
    const gecacht = content.filter(block => 'cache_control' in block)
    assert.equal(gecacht.length, 2, 'nur verstaendnis und docText duerfen gecacht sein')
    assert.ok(gecacht[0].text.startsWith('<projektverstaendnis>'))
    assert.ok(gecacht[1].text.startsWith('<dokument>'))
    for (const block of gecacht) {
      assert.doesNotMatch(
        block.text,
        /MARKANTES-FACH-7a3c|MARKANTE-FREMDAUSSAGE-3f6b|MARKANTE-PROJEKTSTIMME-8c2e|MARKANTER-NACHBAR-ANFANG-4f2a/,
        'ein Wissensblock im Cache-Praefix wuerde den Zwischenspeicher bei jeder Aenderung entwerten',
      )
    }
    for (const block of content.slice(2)) {
      assert.ok(!('cache_control' in block), 'Volatiles duerfen kein cache_control tragen')
    }
  })

  test(`${kanal.name}: die Onda-Bloecke stehen GANZ HINTEN in den volatiles`, () => {
    const ohne = kanal.baue(null)
    const mit = kanal.baue(vollstaendigeQuellen())
    assert.deepEqual(
      mit.volatiles.slice(0, ohne.volatiles.length),
      ohne.volatiles,
      'die bisherigen Bloecke muessen unveraendert vorne stehen',
    )
    assert.equal(mit.volatiles.length, ohne.volatiles.length + 4, 'vier Quellen, vier Bloecke')
  })

  test(`${kanal.name}: ohne onda bleibt der Kontext byte-gleich zu vorher`, () => {
    const ohne = JSON.stringify(kanal.baue(null))
    const undefiniert = JSON.stringify(kanal.baue(undefined))
    assert.equal(ohne, undefiniert)
  })
}

// --- ergaenzeOndaKontext (Hinweislauf/Erweiterungslauf, workspace.js) ---------------------

test('ergaenzeOndaKontext haengt die Bloecke hinten an und laesst die Eingabe unangetastet', () => {
  const kontext = baueHinweisKontext({ verstaendnis: { task: 'Essay' }, docText: 'Dokumenttext' })
  const vorher = JSON.stringify(kontext)
  const ergaenzt = ergaenzeOndaKontext(kontext, vollstaendigeQuellen())

  assert.equal(JSON.stringify(kontext), vorher, 'ergaenzeOndaKontext darf nichts mutieren')
  assert.deepEqual(ergaenzt.volatiles.slice(0, kontext.volatiles.length), kontext.volatiles)
  assert.equal(ergaenzt.volatiles.length, kontext.volatiles.length + 4)

  const anfrage = baueAnfrage('hinweise', ergaenzt)
  const content = anfrage.body.messages[0].content
  assert.ok(JSON.stringify(anfrage.body).includes('MARKANTE-FREMDAUSSAGE-3f6b'))
  for (const block of content.slice(2)) assert.ok(!('cache_control' in block))
})

test('ergaenzeOndaKontext ohne Wissen gibt exakt denselben Kontext zurueck', () => {
  const kontext = baueHinweisKontext({ verstaendnis: null, docText: 'Dokumenttext' })
  assert.equal(ergaenzeOndaKontext(kontext, null), kontext)
  assert.equal(ergaenzeOndaKontext(kontext, { project: { id: PROJEKT_ID } }), kontext)
})

// --- Purheit -----------------------------------------------------------------------------

test('baueOndaBloecke ist pur: gleicher Eingang, byte-gleicher Ausgang, keine Mutation', () => {
  const quellen = vollstaendigeQuellen()
  const vorher = JSON.stringify(quellen)
  const a = JSON.stringify(baueOndaBloecke(quellen))
  const b = JSON.stringify(baueOndaBloecke(quellen))
  assert.equal(a, b)
  assert.equal(JSON.stringify(quellen), vorher, 'Projekt, Dokument und Speicher bleiben unveraendert')
})

test('baueOndaBloecke liefert je Quelle hoechstens einen Block', () => {
  assert.equal(baueOndaBloecke(vollstaendigeQuellen()).length, 4)
})

// --- Die anderen Texte desselben Projekts -------------------------------------------------
// Der Kern der Sache: bisher sah jede Anfrage genau EIN Dokument. Ein Gedanke, der zwei Texte
// verbindet, war nicht bloss ungebaut — sein Anker wurde von der Eingangspruefung verworfen.

test('ein Geschwistertext kommt mit Titel, Gliederung und Anfang in den Block', () => {
  const bloecke = baueOndaBloecke({
    project: { id: PROJEKT_ID },
    doc: OFFENER_TEXT,
    docs: [OFFENER_TEXT, nachbarText()],
  })
  assert.equal(bloecke.length, 1)
  const [block] = bloecke
  assert.match(block, /Die anderen Texte dieses Projekts/)
  assert.match(block, /»Kapitel 3«/)
  assert.match(block, /Gliederung: MARKANTE-NACHBAR-UEBERSCHRIFT-1c9e/)
  assert.match(block, /Anfang: .*MARKANTER-NACHBAR-ANFANG-4f2a/)
})

test('der Block sagt dem Modell, dass ein Zitat daraus als Anker gilt — und dass Erfundenes faellt', () => {
  const [block] = baueOndaBloecke({ project: { id: PROJEKT_ID }, doc: OFFENER_TEXT, docs: [nachbarText()] })
  assert.match(block, /WÖRTLICH/)
  assert.match(block, /gilt als Anker/)
  assert.match(block, /verworfen/)
})

test('HTML und Entitaeten erreichen den Prompt nie', () => {
  const [block] = baueOndaBloecke({ project: { id: PROJEKT_ID }, doc: OFFENER_TEXT, docs: [nachbarText()] })
  assert.doesNotMatch(block, /<[a-z/]/i, 'ein Tag im Prompt kostet Tokens und sagt nichts')
  assert.doesNotMatch(block, /&(amp|#\d+|#x[0-9a-f]+);/i)
  assert.match(block, /über Wasser & Leitungen/, 'die Entitaeten muessen aufgeloest sein')
})

test('fremde Projekte, Papierkorb und der offene Text selbst sind keine Nachbarn', () => {
  const offenMitKoerper = { ...nachbarText({ id: OFFENER_TEXT.id, title: 'Kapitel 1' }) }
  const quellen = {
    project: { id: PROJEKT_ID },
    doc: OFFENER_TEXT,
    docs: [
      offenMitKoerper,
      nachbarText({ id: 'doc-fremd', title: 'FREMDPROJEKT', projectId: 'ein-anderes-projekt' }),
      nachbarText({ id: 'doc-muell', title: 'PAPIERKORB', trashed: true }),
      nachbarText({ id: 'doc-leer', title: 'LEERES-BLATT', body: '<p>Zu kurz.</p>' }),
    ],
  }
  assert.deepEqual(baueNachbartexte(quellen).map(n => n.docId), [])
  assert.deepEqual(baueOndaBloecke(quellen), [], 'kein Nachbar heisst kein Block, nicht ein leerer')
})

test(`hoechstens ${MAX_NACHBARTEXTE} Nachbartexte, die zuletzt bearbeiteten zuerst`, () => {
  const viele = Array.from({ length: MAX_NACHBARTEXTE + 4 }, (unused, index) => nachbarText({
    id: `doc-n${index}`,
    title: `Text ${index}`,
    updated: 1000 + index,
  }))
  const nachbarn = baueNachbartexte({ project: { id: PROJEKT_ID }, doc: OFFENER_TEXT, docs: viele })
  assert.equal(nachbarn.length, MAX_NACHBARTEXTE, 'die Obergrenze muss greifen')
  assert.deepEqual(
    nachbarn.map(n => n.titel),
    ['Text 9', 'Text 8', 'Text 7', 'Text 6', 'Text 5', 'Text 4'],
    'woran zuletzt gearbeitet wurde, steht dem offenen Text am naechsten',
  )
})

test('ein langer Nachbartext wird nicht im vollen Wortlaut bezahlt', () => {
  const lang = `<p>${'Die Stadt wuchs schneller als ihre Leitungen. '.repeat(200)}</p>`
  const [block] = baueOndaBloecke({
    project: { id: PROJEKT_ID },
    doc: OFFENER_TEXT,
    docs: [nachbarText({ body: lang })],
  })
  assert.ok(block.length < 1200, `Block ist ${block.length} Zeichen lang und damit ungekuerzt`)
  assert.match(block, /…/, 'der Kuerzungspunkt fehlt')

  // Gezeigt wird der Anfang, DURCHSUCHT wird spaeter der ganze Text — sonst zeigte der
  // gespeicherte Index in einen Ausschnitt, den es in keinem Dokument gibt.
  const [nachbar] = baueNachbartexte({ project: { id: PROJEKT_ID }, doc: OFFENER_TEXT, docs: [nachbarText({ body: lang })] })
  assert.ok(nachbar.anfang.length <= MAX_NACHBAR_ZEICHEN)
  assert.ok(nachbar.volltext.length > 8000, 'der Suchraum ist der ganze Text')
})

test('textAusKoerper trennt Bloecke und laesst nichts kleben', () => {
  assert.equal(textAusKoerper('<p>Ende.</p><p>Anfang</p>'), 'Ende.\n\nAnfang')
  assert.equal(textAusKoerper('<p>a<br>b</p>'), 'a\n\nb')
  assert.equal(textAusKoerper(''), '')
  assert.equal(textAusKoerper(null), '')
  assert.equal(textAusKoerper('<p>&lt;nicht&gt; ein Tag</p>'), '<nicht> ein Tag')
})

test('ohne Projekt gibt es keine Nachbartexte — geraten wird nichts', () => {
  assert.deepEqual(baueNachbartexte(), [])
  assert.deepEqual(baueNachbartexte({ docs: [nachbarText()] }), [])
  assert.deepEqual(baueNachbartexte({ project: {}, docs: [nachbarText()] }), [])
})

// ---- Was diese Person schon erkannt hat --------------------------------------
// Der erste Block, der einem MENSCHEN gehört und nicht einem Artefakt.

test('ein leerer Personen-Speicher erzeugt keinen Block', () => {
  const bloecke = baueOndaBloecke({ memoryStore: ensureMemoryStore(null) })
  assert.equal(bloecke.some(b => /schon erkannt/.test(b)), false)
})

test('erkannte Prinzipien landen im Prompt, aber nie im Cache-Praefix', () => {
  let store = ensureMemoryStore(null)
  store = schreibeErkanntes(store, { satz: 'Eine Zahl braucht ihre Herkunft.', at: 1 }).store
  const bloecke = baueOndaBloecke({ memoryStore: store })
  const block = bloecke.find(b => /schon erkannt/.test(b))
  assert.ok(block, 'der Block fehlt')
  assert.match(block, /Eine Zahl braucht ihre Herkunft/)

  // Der entscheidende Teil: er darf den zwischengespeicherten Praefix nicht anfassen.
  const anfrage = baueAnfrage('hinweise', {
    verstaendnis: { task: 'x' },
    docText: 'Ein Text.',
    volatiles: bloecke,
  })
  const gecacht = anfrage.body.messages[0].content.filter(teil => teil.cache_control)
  assert.equal(gecacht.length, 2, 'nur verstaendnis und docText duerfen gecacht sein')
  assert.equal(gecacht.some(teil => /schon erkannt/.test(teil.text)), false)
})

test('erkannte Prinzipien erscheinen genau einmal und nie als projektfreigegebenes Wissen', () => {
  let store = ensureMemoryStore(null)
  const satz = 'Eine Zahl braucht ihre Herkunft.'
  store = schreibeErkanntes(store, { satz, at: 1 }).store

  const bloecke = baueOndaBloecke({
    project: { id: PROJEKT_ID },
    doc: OFFENER_TEXT,
    memoryStore: store,
  })
  const prompt = bloecke.join('\n')
  assert.equal(prompt.split(satz).length - 1, 1, 'dasselbe Prinzip kostet sonst doppelt Kontext')
  assert.doesNotMatch(
    prompt,
    /freigegebenes Wissen[^\n]*Eine Zahl braucht ihre Herkunft/,
    'persoenliches Erkanntes ist keine ausdrueckliche Projektfreigabe',
  )
})

// Der Block sagt "wiederhole dich nicht", NICHT "schweige". Sonst wuerde das System
// schlechter, je mehr es weiss -- und wer denselben Fehler zum fuenften Mal macht,
// bekaeme genau dann keinen Hinweis mehr, wenn er ihn am noetigsten braucht.
test('der Block verlangt Kuerze, nicht Schweigen', () => {
  let store = ensureMemoryStore(null)
  store = schreibeErkanntes(store, { satz: 'Kuerze schlaegt Fuelle.', at: 1 }).store
  const block = baueOndaBloecke({ memoryStore: store }).find(b => /schon erkannt/.test(b))
  assert.match(block, /NICHT, zu schweigen|sag es trotzdem/)
})

// Die Beschriftungsliste im Prompt muss ALLE Textarten kennen. Fehlt eine, faellt die
// Zeile "Textsorte: ..." still aus dem Prompt -- und mit ihr die Stilmittel-Zuordnung und
// die Integritaetsregeln, die beide daran haengen. Genau das war fuer prosa und lyrik der
// Fall, nachdem sie zur Genre-Liste dazukamen: zwei von neun Textarten liefen leer, ohne
// dass irgendetwas rot wurde.
test('jede Textart aus LANGUAGE_GENRES erreicht den Prompt', () => {
  for (const genre of LANGUAGE_GENRES) {
    if (genre === 'other') continue // bewusst ohne Beschriftung
    const project = { id: PROJEKT_ID, languageProfile: sprachprofil({ genre }) }
    const block = baueOndaBloecke({ project }).find(b => /Textsorte:/.test(b))
    assert.ok(block, `Textart ${genre} erscheint nicht im Prompt`)
    assert.match(block, /Prioritäten:/, `Textart ${genre} hat kein Handwerk`)
    assert.match(block, /Prüffragen:/, `Textart ${genre} hat keine Prüffragen`)
  }
})

test('eine unbestimmte Textart behauptet nichts', () => {
  const project = { id: PROJEKT_ID, languageProfile: sprachprofil({ genre: 'other' }) }
  const bloecke = baueOndaBloecke({ project })
  assert.equal(bloecke.some(b => /Textsorte:/.test(b)), false)
  assert.ok(bloecke.some(b => /Keine Textart raten/.test(b)))
})

test('Quellen, Belege, Relationen und Sprachbericht erreichen gemeinsam alle Agentenkanaele', () => {
  const project = {
    id: PROJEKT_ID,
    sources: [{
      id: 'quelle-voll', projectId: PROJEKT_ID, status: 'active', type: 'pdf',
      metadata: { title: { value: 'KANAL-QUELLE-9f1a' } },
      origin: { immutableRef: 'project://projekt-onda/quelle.pdf' },
    }],
    evidenceBundles: [{
      id: 'beleg-voll', projectId: PROJEKT_ID, claimText: 'KANAL-BELEG-8e2b',
      status: 'supported', limitations: [],
    }],
    argumentModel: {
      claims: [
        { id: 'kanal-a', projectId: PROJEKT_ID, textId: OFFENER_TEXT.id, text: 'KANAL-AUSSAGE-A', validity: 'asserted' },
        { id: 'kanal-b', projectId: PROJEKT_ID, textId: ANDERER_TEXT.id, text: 'KANAL-AUSSAGE-B', validity: 'asserted' },
      ],
      relations: [{
        id: 'kanal-relation', projectId: PROJEKT_ID, fromClaimId: 'kanal-b', toClaimId: 'kanal-a',
        type: 'supports', warrant: 'KANAL-BRUECKE-7d3c', confidence: 'high',
      }],
    },
    languageReports: {
      projectId: PROJEKT_ID,
      byText: {
        [OFFENER_TEXT.id]: {
          projectId: PROJEKT_ID, textId: OFFENER_TEXT.id,
          diagnostics: [{ id: 'kanal-diag', label: 'KANAL-DIAGNOSE-6c4d', message: 'prüfen', reason: 'Kontext', reviewQuestion: 'Trägt es?', confidence: 'high' }],
          effect: { passages: [] }, rhetoric: { devices: [] }, fairness: { findings: [] },
        },
      },
    },
  }
  const onda = { project, doc: OFFENER_TEXT, docs: ALLE_TEXTE }
  const kontexte = [
    baueHinweisKontext({ docText: 'Text', onda }),
    baueErweiterungKontext({ docText: 'Text', onda }),
    baueChatKontext({ docText: 'Text', anfrage: 'Frage', onda }),
    baueVerstaendnisKontext({ docText: 'Text', anfrage: 'Vorhaben', onda }),
  ]
  for (const kontext of kontexte) {
    const requestText = JSON.stringify(baueAnfrage(
      kontext === kontexte[2] ? 'chat' : kontext === kontexte[3] ? 'verstaendnis' : kontext === kontexte[1] ? 'erweiterungen' : 'hinweise',
      kontext,
    ).body.messages)
    for (const canary of ['KANAL-QUELLE-9f1a', 'KANAL-BELEG-8e2b', 'KANAL-BRUECKE-7d3c', 'KANAL-DIAGNOSE-6c4d']) {
      assert.match(requestText, new RegExp(canary))
    }
  }
})
