import test from 'node:test'
import assert from 'node:assert/strict'

import { MAX_AUSSAGEN, MAX_GEDAECHTNIS, baueOndaBloecke, ergaenzeOndaKontext } from '../src/onda-kontext.mjs'
import { baueHinweisKontext } from '../src/hinweis-kontext.mjs'
import { baueErweiterungKontext } from '../src/erweiterung-kontext.mjs'
import { baueChatKontext } from '../src/chat-kontext.mjs'
import { baueVerstaendnisKontext } from '../src/verstaendnis-kontext.mjs'
import { baueAnfrage } from '../src/agent-tasks.mjs'
import { synchronizeClaimLedger } from '../src/claim-ledger.mjs'
import { updateLanguageProfile } from '../src/language-profile.mjs'
import { createMemoryEntry, ensureMemoryStore } from '../src/memory-model.mjs'
import { schreibeErkanntes } from '../src/erkanntes-model.mjs'

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
    docs: ALLE_TEXTE,
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

test('"Sonstig" ist keine Auskunft: genre/medium "other" erzeugen keinen Eintrag', () => {
  const bloecke = baueOndaBloecke({
    project: { id: PROJEKT_ID, languageProfile: sprachprofil({ genre: 'other', medium: 'other' }) },
    doc: OFFENER_TEXT,
  })
  assert.deepEqual(bloecke, [], 'other sagt dem Modell nichts und darf nichts kosten')
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
      assert.doesNotMatch(block.text, /MARKANTES-FACH-7a3c|MARKANTE-FREMDAUSSAGE-3f6b|MARKANTE-PROJEKTSTIMME-8c2e/,
        'ein Wissensblock im Cache-Praefix wuerde den Zwischenspeicher bei jeder Aenderung entwerten')
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
    assert.equal(mit.volatiles.length, ohne.volatiles.length + 3, 'drei Quellen, drei Bloecke')
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
  assert.equal(ergaenzt.volatiles.length, kontext.volatiles.length + 3)

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

test('baueOndaBloecke liefert hoechstens drei Bloecke — je Quelle einen', () => {
  assert.equal(baueOndaBloecke(vollstaendigeQuellen()).length, 3)
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

// Der Block sagt "wiederhole dich nicht", NICHT "schweige". Sonst wuerde das System
// schlechter, je mehr es weiss -- und wer denselben Fehler zum fuenften Mal macht,
// bekaeme genau dann keinen Hinweis mehr, wenn er ihn am noetigsten braucht.
test('der Block verlangt Kuerze, nicht Schweigen', () => {
  let store = ensureMemoryStore(null)
  store = schreibeErkanntes(store, { satz: 'Kuerze schlaegt Fuelle.', at: 1 }).store
  const block = baueOndaBloecke({ memoryStore: store }).find(b => /schon erkannt/.test(b))
  assert.match(block, /NICHT, zu schweigen|sag es trotzdem/)
})

// Ein Prinzip liegt auf der persoenlichen Ebene mit allProjects — retrieveMemoryContext
// liefert es deshalb auch dem Gedaechtnisblock mit. Ungefiltert stuende derselbe Satz
// ZWEIMAL im Prompt, und beide Male wird er bei JEDEM Lauf bezahlt (Regel 1 im Modulkopf;
// dieselbe Klasse Fehler wurde schon einmal behoben, Commit a46c939). Schlimmer als die
// Kosten ist die Beschriftung: "ausdruecklich fuer dieses Projekt freigegeben" behauptet
// eine Entscheidung, die bei einem projektuebergreifenden Prinzip niemand getroffen hat.
// Der Test setzt bewusst ein Projekt und ein Dokument, denn ohne beide steigt
// gedaechtnisBlock frueh aus — genau daran ist die Doppelung bisher vorbeigelaufen.
test('Erkanntes steht NUR in seinem eigenen Block, nie zusaetzlich im Gedaechtnis', () => {
  let store = ensureMemoryStore(null)
  store = schreibeErkanntes(store, { satz: 'MARKANTES-PRINZIP-1f7e braucht seine Herkunft.', at: 1 }).store
  const bloecke = baueOndaBloecke({ project: { id: PROJEKT_ID }, doc: OFFENER_TEXT, memoryStore: store })

  assert.equal(bloecke.length, 1, 'ein Speicher mit nur Erkanntem ergibt GENAU EINEN Block')
  assert.match(bloecke[0], /schon erkannt/)
  assert.doesNotMatch(bloecke[0], /freigegebenes Wissen/)
})

// Gegenprobe zum Test darueber: der Filter darf NUR Prinzipien nehmen. Ein Filter, der
// das Wissen ganz leert, bestuende die "genau ein Block"-Pruefung ebenfalls — und haette
// echtes, ausdruecklich freigegebenes Wissen stillschweigend aus dem Prompt geworfen.
test('echtes freigegebenes Wissen bleibt neben einem Prinzip erhalten', () => {
  let store = gedaechtnis([{ level: 'topic', type: 'knowledge', content: 'MARKANTES-THEMENWISSEN-6b9f' }])
  store = schreibeErkanntes(store, { satz: 'MARKANTES-PRINZIP-1f7e braucht seine Herkunft.', at: 1 }).store
  const bloecke = baueOndaBloecke({ project: { id: PROJEKT_ID }, doc: OFFENER_TEXT, memoryStore: store })

  assert.equal(bloecke.length, 2, 'Gedaechtnis und Erkanntes — je ein Block')
  const gedaechtnisBlock = bloecke.find(b => /Gedächtnis/.test(b))
  assert.match(gedaechtnisBlock, /freigegebenes Wissen: »MARKANTES-THEMENWISSEN-6b9f«/)
  assert.doesNotMatch(gedaechtnisBlock, /MARKANTES-PRINZIP-1f7e/)
  assert.match(bloecke.find(b => /schon erkannt/.test(b)), /MARKANTES-PRINZIP-1f7e/)
})
