import { readFile } from 'node:fs/promises'

const EVAL_STRING_FELDER = Object.freeze([
  'id',
  'title',
  'gate',
  'automation',
  'given',
  'when',
  'then',
])

const EVAL_LISTEN_FELDER = Object.freeze(['evidence', 'source'])
const ERLAUBTE_GATES = new Set(['hard', 'scored'])
const ERLAUBTE_ERGEBNIS_STATUS = new Set([
  'passed',
  'failed',
  'future-stage',
  'external-open',
  'not-applicable',
])

function istObjekt(wert) {
  return Boolean(wert) && typeof wert === 'object' && !Array.isArray(wert)
}

function nichtLeererString(wert) {
  return typeof wert === 'string' && Boolean(wert.trim())
}

function listeNichtLeererStrings(wert) {
  return Array.isArray(wert) && wert.length > 0 && wert.every(nichtLeererString)
}

export async function ladeEvalKatalog(pfad) {
  const roh = await readFile(pfad, 'utf8')
  return JSON.parse(roh)
}

export function flattenEvals(katalog) {
  if (!Array.isArray(katalog?.suites)) return []
  return katalog.suites.flatMap(suite => (Array.isArray(suite?.evals) ? suite.evals : []))
}

export function summarisiereEvalKatalog(katalog) {
  const evals = flattenEvals(katalog)
  return {
    suites: Array.isArray(katalog?.suites) ? katalog.suites.length : 0,
    evals: evals.length,
    hardGates: evals.filter(eintrag => eintrag?.gate === 'hard').length,
    scoredGates: evals.filter(eintrag => eintrag?.gate === 'scored').length,
    externalLiveGates: Array.isArray(katalog?.externalLiveGateIds) ? katalog.externalLiveGateIds.length : 0,
  }
}

export function validiereEvalKatalog(katalog) {
  const fehler = []
  if (!istObjekt(katalog)) return ['Katalog muss ein Objekt sein.']
  if (!Number.isInteger(katalog.schemaVersion) || katalog.schemaVersion < 1) {
    fehler.push('schemaVersion muss eine positive Ganzzahl sein.')
  }
  if (!nichtLeererString(katalog.catalogVersion)) fehler.push('catalogVersion fehlt.')
  if (!nichtLeererString(katalog.target)) fehler.push('target fehlt.')

  const thresholds = katalog.thresholds
  if (!istObjekt(thresholds)) {
    fehler.push('thresholds muss ein Objekt sein.')
  } else {
    if (thresholds.allApplicableHardGatesMustPass !== true) {
      fehler.push('allApplicableHardGatesMustPass muss true sein.')
    }
    for (const feld of ['minimumWeightedScore', 'minimumDimensionScore']) {
      if (!Number.isFinite(thresholds[feld]) || thresholds[feld] < 0 || thresholds[feld] > 5) {
        fehler.push(`thresholds.${feld} muss zwischen 0 und 5 liegen.`)
      }
    }
    for (const feld of ['maximumIterationsPerStage', 'stopAfterConsecutiveNonImprovingIterations']) {
      if (!Number.isInteger(thresholds[feld]) || thresholds[feld] < 1) {
        fehler.push(`thresholds.${feld} muss eine positive Ganzzahl sein.`)
      }
    }
  }

  if (!Array.isArray(katalog.rubric) || !katalog.rubric.length) {
    fehler.push('rubric muss mindestens eine Dimension enthalten.')
  } else {
    const rubricIds = new Set()
    let gewicht = 0
    katalog.rubric.forEach((dimension, index) => {
      if (!istObjekt(dimension)) {
        fehler.push(`rubric[${index}] muss ein Objekt sein.`)
        return
      }
      if (!nichtLeererString(dimension.id)) fehler.push(`rubric[${index}].id fehlt.`)
      else if (rubricIds.has(dimension.id)) fehler.push(`Rubrik-ID ${dimension.id} ist doppelt.`)
      else rubricIds.add(dimension.id)
      if (!nichtLeererString(dimension.label)) fehler.push(`rubric[${index}].label fehlt.`)
      if (!Number.isFinite(dimension.weight) || dimension.weight <= 0) {
        fehler.push(`rubric[${index}].weight muss positiv sein.`)
      } else {
        gewicht += dimension.weight
      }
    })
    if (Math.abs(gewicht - 1) > Number.EPSILON * 10) {
      fehler.push(`Rubrikgewichte ergeben ${gewicht} statt 1.`)
    }
  }

  const evidenceKinds = new Set(Array.isArray(katalog.evidenceKinds) ? katalog.evidenceKinds : [])
  if (!listeNichtLeererStrings(katalog.evidenceKinds)) {
    fehler.push('evidenceKinds muss mindestens einen nicht-leeren Wert enthalten.')
  } else if (evidenceKinds.size !== katalog.evidenceKinds.length) {
    fehler.push('evidenceKinds enthält Duplikate.')
  }

  if (!Array.isArray(katalog.suites) || !katalog.suites.length) {
    fehler.push('suites muss mindestens eine Suite enthalten.')
  }

  const suiteIds = new Set()
  const evalIds = new Set()
  for (const [suiteIndex, suite] of (Array.isArray(katalog.suites) ? katalog.suites : []).entries()) {
    if (!istObjekt(suite)) {
      fehler.push(`suites[${suiteIndex}] muss ein Objekt sein.`)
      continue
    }
    if (!nichtLeererString(suite.id)) fehler.push(`suites[${suiteIndex}].id fehlt.`)
    else if (suiteIds.has(suite.id)) fehler.push(`Suite-ID ${suite.id} ist doppelt.`)
    else suiteIds.add(suite.id)
    if (!nichtLeererString(suite.name)) fehler.push(`Suite ${suite.id || suiteIndex}: name fehlt.`)
    if (!Array.isArray(suite.evals) || !suite.evals.length) {
      fehler.push(`Suite ${suite.id || suiteIndex}: evals muss mindestens einen Eintrag enthalten.`)
      continue
    }

    for (const [evalIndex, eintrag] of suite.evals.entries()) {
      const ort = `${suite.id || suiteIndex}.evals[${evalIndex}]`
      if (!istObjekt(eintrag)) {
        fehler.push(`${ort} muss ein Objekt sein.`)
        continue
      }
      EVAL_STRING_FELDER.forEach(feld => {
        if (!nichtLeererString(eintrag[feld])) fehler.push(`${ort}.${feld} fehlt.`)
      })
      EVAL_LISTEN_FELDER.forEach(feld => {
        if (!listeNichtLeererStrings(eintrag[feld])) {
          fehler.push(`${ort}.${feld} muss mindestens einen nicht-leeren Wert enthalten.`)
        }
      })
      if (nichtLeererString(eintrag.id)) {
        if (evalIds.has(eintrag.id)) fehler.push(`Eval-ID ${eintrag.id} ist doppelt.`)
        else evalIds.add(eintrag.id)
        if (nichtLeererString(suite.id) && !new RegExp(`^${suite.id}-\\d{2}$`).test(eintrag.id)) {
          fehler.push(`Eval-ID ${eintrag.id} gehört nicht zur Suite ${suite.id}.`)
        }
      }
      if (nichtLeererString(eintrag.gate) && !ERLAUBTE_GATES.has(eintrag.gate)) {
        fehler.push(`${ort}.gate ${eintrag.gate} ist unbekannt.`)
      }
      if (nichtLeererString(eintrag.automation) && !evidenceKinds.has(eintrag.automation)) {
        fehler.push(`${ort}.automation ${eintrag.automation} fehlt in evidenceKinds.`)
      }
    }
  }

  if (!Array.isArray(katalog.externalLiveGateIds)) {
    fehler.push('externalLiveGateIds muss eine Liste sein.')
  } else {
    const externeIds = new Set()
    katalog.externalLiveGateIds.forEach((id, index) => {
      if (!nichtLeererString(id)) fehler.push(`externalLiveGateIds[${index}] ist leer.`)
      else if (externeIds.has(id)) fehler.push(`Externes Live-Gate ${id} ist doppelt.`)
      else if (!evalIds.has(id)) fehler.push(`Externes Live-Gate ${id} existiert nicht im Katalog.`)
      externeIds.add(id)
    })
  }

  return fehler
}

export function validiereEvalErgebnisse(katalog, ergebnis) {
  const fehler = []
  const katalogFehler = validiereEvalKatalog(katalog)
  if (katalogFehler.length) return katalogFehler.map(eintrag => `Katalog: ${eintrag}`)
  if (!istObjekt(ergebnis)) return ['Ergebnis muss ein Objekt sein.']

  if (ergebnis.schemaVersion !== 1) fehler.push('Ergebnis.schemaVersion muss 1 sein.')
  if (ergebnis.catalogVersion !== katalog.catalogVersion) {
    fehler.push(`Ergebnis.catalogVersion muss ${katalog.catalogVersion} sein.`)
  }
  if (!nichtLeererString(ergebnis.stage)) fehler.push('Ergebnis.stage fehlt.')
  if (
    !Number.isInteger(ergebnis.iteration)
    || ergebnis.iteration < 1
    || ergebnis.iteration > katalog.thresholds.maximumIterationsPerStage
  ) {
    fehler.push(`Ergebnis.iteration muss zwischen 1 und ${katalog.thresholds.maximumIterationsPerStage} liegen.`)
  }
  if (!nichtLeererString(ergebnis.generatedAt) || Number.isNaN(Date.parse(ergebnis.generatedAt))) {
    fehler.push('Ergebnis.generatedAt muss ein gültiger Zeitstempel sein.')
  }
  if (!nichtLeererString(ergebnis.gitCommit)) fehler.push('Ergebnis.gitCommit fehlt.')

  const rubricIds = new Set(katalog.rubric.map(dimension => dimension.id))
  if (!istObjekt(ergebnis.rubricScores)) {
    fehler.push('Ergebnis.rubricScores muss ein Objekt sein.')
  } else {
    for (const id of rubricIds) {
      const score = ergebnis.rubricScores[id]
      if (!Number.isFinite(score) || score < 0 || score > 5) {
        fehler.push(`Rubrikscore ${id} muss zwischen 0 und 5 liegen.`)
      }
    }
    Object.keys(ergebnis.rubricScores).forEach(id => {
      if (!rubricIds.has(id)) fehler.push(`Rubrikscore ${id} ist unbekannt.`)
    })
  }

  if (!Array.isArray(ergebnis.evals)) return [...fehler, 'Ergebnis.evals muss eine Liste sein.']

  const evals = flattenEvals(katalog)
  const katalogNachId = new Map(evals.map(eintrag => [eintrag.id, eintrag]))
  const externeIds = new Set(katalog.externalLiveGateIds)
  const gesehen = new Set()

  for (const [index, eintrag] of ergebnis.evals.entries()) {
    const ort = `Ergebnis.evals[${index}]`
    if (!istObjekt(eintrag)) {
      fehler.push(`${ort} muss ein Objekt sein.`)
      continue
    }
    if (!nichtLeererString(eintrag.id)) {
      fehler.push(`${ort}.id fehlt.`)
      continue
    }
    if (!katalogNachId.has(eintrag.id)) {
      fehler.push(`Eval ${eintrag.id} ist im Katalog unbekannt.`)
      continue
    }
    if (gesehen.has(eintrag.id)) fehler.push(`Eval ${eintrag.id} ist im Ergebnis doppelt.`)
    gesehen.add(eintrag.id)

    if (!ERLAUBTE_ERGEBNIS_STATUS.has(eintrag.status)) {
      fehler.push(`Eval ${eintrag.id} hat den unbekannten Status ${eintrag.status}.`)
    }
    if (!Array.isArray(eintrag.evidence)) {
      fehler.push(`Eval ${eintrag.id}: evidence muss eine Liste sein.`)
    } else {
      eintrag.evidence.forEach((beleg, belegIndex) => {
        if (!istObjekt(beleg)) {
          fehler.push(`Eval ${eintrag.id}: Beleg ${belegIndex + 1} muss ein Objekt sein.`)
          return
        }
        if (!katalog.evidenceKinds.includes(beleg.kind)) {
          fehler.push(`Eval ${eintrag.id}: Belegart ${beleg.kind} ist unbekannt.`)
        }
        if (!nichtLeererString(beleg.path)) {
          fehler.push(`Eval ${eintrag.id}: Beleg ${belegIndex + 1} benötigt einen Pfad.`)
        }
        if (beleg.command !== undefined && !nichtLeererString(beleg.command)) {
          fehler.push(`Eval ${eintrag.id}: command muss bei Angabe nicht leer sein.`)
        }
      })
    }
    if (eintrag.status === 'passed' && (!Array.isArray(eintrag.evidence) || eintrag.evidence.length === 0)) {
      fehler.push(`Eval ${eintrag.id}: bestandener Status benötigt mindestens einen Beleg.`)
    }
    if (eintrag.status === 'external-open') {
      if (!externeIds.has(eintrag.id)) fehler.push(`Eval ${eintrag.id} ist kein externes Live-Gate.`)
      if (!nichtLeererString(eintrag.note)) fehler.push(`Eval ${eintrag.id}: external-open benötigt eine Begründung.`)
    }
    if (
      (eintrag.status === 'future-stage' || eintrag.status === 'not-applicable')
      && !nichtLeererString(eintrag.note)
    ) {
      fehler.push(`Eval ${eintrag.id}: ${eintrag.status} benötigt eine Begründung.`)
    }
  }

  evals.forEach(eintrag => {
    if (!gesehen.has(eintrag.id)) fehler.push(`Eval ${eintrag.id} fehlt im Ergebnis.`)
  })

  return fehler
}
