import { analyzeCommunicationEffect, analyzeRhetoricalDevices } from './effect-analysis.mjs'
import { analyzeEffectFairness } from './effect-fairness.mjs'
import {
  analyzeLanguageDiagnostics,
} from './language-diagnostics.mjs'
import { analyzeClaimModality } from './language-modality.mjs'
import { analyzeLanguagePatterns } from './language-patterns.mjs'
import {
  LANGUAGE_GENRES,
  LANGUAGE_MEDIA,
  LANGUAGE_REGIONS,
  activeWritingStyle,
  buildLanguageContext,
  defineWritingStyle,
  ensureLanguageProfile,
  selectWritingStyle,
  setOrthographyAutomation,
  updateLanguageProfile,
} from './language-profile.mjs'
import {
  applyOrthographyCorrections,
  planOrthographyCorrections,
} from './orthography.mjs'
import { deriveSafeBlockRelations } from './argument-projection.mjs'
import { synchronizeClaimLedger } from './claim-ledger.mjs'
import {
  exportLanguageDossier,
  recordLanguageDecision,
  recordLanguageReport,
} from './language-report.mjs'

// prosa und lyrik ergaenzt am 05.08.2026: LANGUAGE_GENRES kannte sie schon, diese Liste
// nicht — die Auswahl zeigte dafuer zwei leere Zeilen, und wer eine davon traf, sah
// hinterher ein leeres Feld.
const GENRE_LABELS = Object.freeze({
  scientific: 'Wissenschaftlich',
  essay: 'Essay',
  project: 'Projekttext',
  web: 'Webtext',
  marketing: 'Marketing',
  campaign: 'Kampagne',
  prosa: 'Prosa',
  lyrik: 'Lyrik',
  other: 'Sonstig',
})
const MEDIA_LABELS = Object.freeze({
  screen: 'Bildschirm',
  print: 'Druck',
  'academic-submission': 'Akademische Abgabe',
  presentation: 'Präsentation',
  other: 'Sonstig',
})
const REGION_LABELS = Object.freeze({
  DE: 'Deutschland',
  AT: 'Österreich',
  CH: 'Schweiz',
})
const CLASS_LABELS = Object.freeze({
  'norm-error': 'Normfehler',
  'grammar-observation': 'Grammatische Beobachtung',
  'register-observation': 'Register- oder Musterbeobachtung',
  'effect-hypothesis': 'Wirkungshypothese',
  'integrity-warning': 'Integritätsrisiko',
})
const FUNCTION_LABELS = Object.freeze({
  orient: 'orientiert',
  define: 'definiert',
  explain: 'erklärt',
  substantiate: 'belegt',
  activate: 'aktiviert',
  position: 'positioniert',
  contrast: 'kontrastiert',
  inform: 'informiert',
  unclear: 'Funktion noch unklar',
})
const AUDIENCE_LABELS = Object.freeze({
  priorKnowledge: 'Vorwissen',
  assumptions: 'Annahmen',
  resistances: 'Widerstände',
  commonGround: 'Geteilte Grundlage',
})
const RHETORIC_LABELS = Object.freeze({
  example: 'Beispiel',
  analogy: 'Analogie',
  narration: 'Erzählung',
  contrast: 'Kontrast',
  metaphor: 'Metapher',
  frame: 'Rahmung',
  directness: 'Direktheit',
})

function cleanList(value) {
  return String(value || '').split(/\r?\n|,/).map(item => item.trim()).filter(Boolean)
}

function selectField(label, values, selected = '') {
  const select = document.createElement('select')
  select.className = 'language-select'
  select.setAttribute('aria-label', label)
  values.forEach(([value, text]) => {
    const option = document.createElement('option')
    option.value = value
    option.textContent = text
    option.selected = value === selected
    select.append(option)
  })
  return select
}

function inputField(label, value = '', rows = 2) {
  const field = document.createElement('textarea')
  field.className = 'language-input'
  field.setAttribute('aria-label', label)
  field.rows = rows
  field.value = value
  return field
}

function labelledField(label, control) {
  const wrapper = document.createElement('label')
  wrapper.className = 'language-field'
  const text = document.createElement('span')
  text.className = 'language-field-label'
  text.textContent = label
  wrapper.append(text, control)
  return wrapper
}

function listText(value) {
  const values = Array.isArray(value) ? value : []
  return values.length ? values.join(' · ') : 'noch offen'
}

export function createLanguageUi({
  context,
  createNode,
  openDialog,
  getBlocks,
  applyCorrections,
}) {
  function persist(project) {
    context.persist()
    return project.languageProfile
  }

  function section(parent, title, intro = '', className = '') {
    const node = createNode('section', `language-section${className ? ` ${className}` : ''}`)
    node.append(createNode('h3', 'language-section-title', title))
    if (intro) node.append(createNode('p', 'language-section-intro', intro))
    parent.append(node)
    return node
  }

  function synchronize(project) {
    const doc = context.activeDoc()
    if (!doc || doc.projectId !== project.id) {
      throw new TypeError('Der aktive Text gehört nicht zu diesem Projekt.')
    }
    const at = Date.now()
    const profile = ensureLanguageProfile(project)
    const languageContext = buildLanguageContext({ project, profile })
    const blocks = getBlocks()
    let argumentModel = synchronizeClaimLedger({
      projectId: project.id,
      model: project.argumentModel,
      texts: [{
        textId: doc.id,
        projectId: project.id,
        blocks,
      }],
      evidenceBundles: project.evidenceBundles || [],
      at,
    })
    argumentModel = deriveSafeBlockRelations({
      model: argumentModel,
      projectId: project.id,
      blocks,
      at,
    })
    project.argumentModel = argumentModel
    const language = analyzeLanguageDiagnostics({
      projectId: project.id,
      textId: doc.id,
      blocks,
      context: languageContext,
      at,
    })
    const modality = analyzeClaimModality({
      model: argumentModel,
      projectId: project.id,
      textId: doc.id,
      at,
    })
    const patterns = analyzeLanguagePatterns({
      projectId: project.id,
      textId: doc.id,
      blocks,
      context: languageContext,
      at,
    })
    const effect = analyzeCommunicationEffect({
      projectId: project.id,
      textId: doc.id,
      blocks,
      context: languageContext,
      at,
    })
    const rhetoric = analyzeRhetoricalDevices({
      projectId: project.id,
      textId: doc.id,
      blocks,
      at,
    })
    const fairness = analyzeEffectFairness({
      projectId: project.id,
      textId: doc.id,
      blocks,
      context: languageContext,
      argumentModel,
      at,
    })
    profile.lastAnalysis = {
      at,
      textId: doc.id,
      diagnosticIds: [
        ...language.diagnostics,
        ...modality.diagnostics,
        ...patterns.diagnostics,
      ].map(item => item.id),
      fairnessFindingIds: fairness.findings.map(item => item.id),
    }
    const report = {
      doc,
      profile,
      languageContext,
      blocks,
      diagnostics: [...language.diagnostics, ...modality.diagnostics, ...patterns.diagnostics],
      effect,
      rhetoric,
      fairness,
    }
    recordLanguageReport({
      project,
      report: {
        projectId: project.id,
        textId: doc.id,
        analyzedAt: at,
        context: languageContext,
        diagnostics: report.diagnostics,
        effect,
        rhetoric,
        fairness,
      },
      at,
    })
    return report
  }

  function renderProfileEditor(parent, body, project, profile, render) {
    const details = createNode('details', 'language-details language-profile-editor')
    const summary = document.createElement('summary')
    summary.textContent = 'Kontextprofil bearbeiten'
    const form = createNode('form', 'language-form')
    const genre = selectField('Textsorte', [
      ['', 'Noch offen'],
      ...LANGUAGE_GENRES.map(value => [value, GENRE_LABELS[value]]),
    ], profile.genre)
    const passageFunction = inputField('Teiltextfunktion', profile.passageFunction, 1)
    const domain = inputField('Fach oder Markt', profile.domain, 1)
    const audience = inputField('Zielgruppe', profile.audience.join(', '), 2)
    const medium = selectField('Medium', [
      ['', 'Noch offen'],
      ...LANGUAGE_MEDIA.map(value => [value, MEDIA_LABELS[value]]),
    ], profile.medium)
    const goal = inputField('Zielzustand beim Publikum', profile.goal, 2)
    const region = selectField('Sprachregion', [
      ['', 'Noch offen'],
      ...LANGUAGE_REGIONS.map(value => [value, REGION_LABELS[value]]),
    ], profile.region)
    const priorKnowledge = inputField('Vorwissen', profile.audienceState.priorKnowledge.join('\n'), 2)
    const assumptions = inputField('Annahmen', profile.audienceState.assumptions.join('\n'), 2)
    const resistances = inputField('Widerstände', profile.audienceState.resistances.join('\n'), 2)
    const commonGround = inputField('Geteilte Grundlage', profile.audienceState.commonGround.join('\n'), 2)
    // Schreibstile: eine Autorin hat mehrere und schreibt in diesem Projekt in einem davon.
    // Die Auswahl wechselt sofort — sonst zeigte das Formular die Regeln des einen und
    // speicherte sie in den anderen.
    const active = activeWritingStyle(profile)
    const styleSelect = selectField(
      'Schreibstil',
      profile.styles.map(style => [style.id, style.name]),
      active.id,
    )
    styleSelect.addEventListener('change', () => {
      try {
        project.languageProfile = selectWritingStyle({
          profile: project.languageProfile,
          projectId: project.id,
          styleId: styleSelect.value,
          at: Date.now(),
        })
        persist(project)
        render(body, project, 'Schreibstil gewechselt. Das Formular zeigt jetzt seine Regeln; nicht Gespeichertes ist verworfen.')
      } catch (error) {
        render(body, project, error?.message || 'Der Schreibstil konnte nicht gewechselt werden.')
      }
    })
    const styleName = inputField('Name des Schreibstils', active.name, 1)
    const stylePurpose = inputField('Wofür dieser Stil da ist', active.purpose, 1)
    const houseStyle = inputField('Regeln dieses Stils, eine Regel je Zeile', active.rules.join('\n'), 3)
    const save = createNode('button', 'language-primary', 'Kontextprofil speichern')
    save.type = 'submit'
    form.append(
      labelledField('Textsorte', genre),
      labelledField('Teiltextfunktion', passageFunction),
      labelledField('Fach oder Markt', domain),
      labelledField('Zielgruppe', audience),
      labelledField('Medium', medium),
      labelledField('Zielzustand beim Publikum', goal),
      labelledField('Sprachregion', region),
      labelledField('Vorwissen', priorKnowledge),
      labelledField('Annahmen', assumptions),
      labelledField('Widerstände', resistances),
      labelledField('Geteilte Grundlage', commonGround),
      labelledField('Schreibstil', styleSelect),
      labelledField('Name des Schreibstils', styleName),
      labelledField('Wofür dieser Stil da ist', stylePurpose),
      labelledField('Regeln dieses Stils, eine Regel je Zeile', houseStyle),
      save,
    )
    form.addEventListener('submit', event => {
      event.preventDefault()
      try {
        const at = Date.now()
        let next = updateLanguageProfile({
          profile: project.languageProfile,
          projectId: project.id,
          changes: {
            genre: genre.value,
            passageFunction: passageFunction.value,
            domain: domain.value,
            audience: cleanList(audience.value),
            medium: medium.value,
            goal: goal.value,
            region: region.value,
            audienceState: {
              priorKnowledge: cleanList(priorKnowledge.value),
              assumptions: cleanList(assumptions.value),
              resistances: cleanList(resistances.value),
              commonGround: cleanList(commonGround.value),
            },
            houseStyle: cleanList(houseStyle.value),
          },
          at,
        })
        // Ein neuer Name legt einen neuen Stil an, statt den alten umzubenennen. Damit
        // bleibt der bisherige Stil erhalten, wenn jemand einen zweiten daneben aufmacht —
        // und genau darum geht es bei mehreren Stilen.
        const gewuenschterName = styleName.value.trim()
        const gewuenschterZweck = stylePurpose.value.trim()
        const bisher = activeWritingStyle(next)
        if (gewuenschterName && (gewuenschterName !== bisher.name || gewuenschterZweck !== bisher.purpose)) {
          next = defineWritingStyle({
            profile: next,
            projectId: project.id,
            name: gewuenschterName,
            purpose: gewuenschterZweck,
            rules: cleanList(houseStyle.value),
            at,
          })
        }
        project.languageProfile = next
        persist(project)
        render(body, project, 'Kontextprofil gespeichert. Die Angaben gelten bindend für diese Sprachprüfung.')
      } catch (error) {
        render(body, project, error?.message || 'Das Kontextprofil konnte nicht gespeichert werden.')
      }
    })
    details.append(summary, form)
    parent.append(details)
  }

  function renderProfile(parent, body, project, report, render) {
    const { profile, languageContext } = report
    const area = section(
      parent,
      languageContext.complete ? 'Kontextprofil · vollständig' : `Kontextprofil · ${languageContext.missing.length} Angaben offen`,
      'Die Diagnose nutzt nur bekannte Angaben. Fehlende Felder erzeugen keine heimlichen Standardannahmen.',
    )
    const grid = createNode('dl', 'language-profile-grid')
    const entries = [
      ['Textsorte', profile.genre ? GENRE_LABELS[profile.genre] : 'noch offen'],
      ['Teiltextfunktion', profile.passageFunction || 'noch offen'],
      ['Fach oder Markt', profile.domain || 'noch offen'],
      ['Zielgruppe', listText(languageContext.known.audience)],
      ['Medium', profile.medium ? MEDIA_LABELS[profile.medium] : 'noch offen'],
      ['Zielzustand', languageContext.known.goal || 'noch offen'],
      ['Sprachregion', profile.region ? REGION_LABELS[profile.region] : 'noch offen'],
      ['Schreibstil', activeWritingStyle(profile)?.name || 'noch offen'],
    ]
    entries.forEach(([term, value]) => {
      grid.append(createNode('dt', '', term), createNode('dd', '', value))
    })
    area.append(grid)
    if (languageContext.missing.length) {
      area.append(createNode(
        'p',
        'language-context-gap',
        `Noch offen: ${languageContext.missing.join(', ')}. Register- und Wirkungsbefunde bleiben entsprechend begrenzt.`,
      ))
    }
    renderProfileEditor(area, body, project, profile, render)
  }

  function renderDecision(card, body, project, report, finding, render, decision, label) {
    const existing = project.languageReports?.decisions?.some(event => (
      event.textId === report.doc.id
      && event.findingId === finding.id
      && event.decision === decision
    ))
    if (existing) {
      card.append(createNode('span', 'language-reviewed', label === 'Im Schlussaudit behalten' ? 'Für Schlussaudit bestätigt' : 'Vom Nutzer geprüft'))
      return
    }
    const button = createNode('button', 'language-action', label)
    button.type = 'button'
    button.addEventListener('click', () => {
      recordLanguageDecision({
        project,
        textId: report.doc.id,
        findingId: finding.id,
        decision,
        at: Date.now(),
      })
      persist(project)
      render(body, project, `${label}. Der Befund bleibt mit Herkunft und Entscheidung im Dossier erhalten.`)
    })
    card.append(button)
  }

  function latestEntityDecision(project, textId, findingId, entityKind) {
    return [...(project.languageReports?.decisions || [])]
      .reverse()
      .find(event => (
        event.textId === textId
        && event.findingId === findingId
        && event.entityKind === entityKind
      )) || null
  }

  function renderEntityCorrection({
    card,
    body,
    project,
    report,
    render,
    entity,
    entityKind,
    field,
    current,
    values,
    correctedLabel,
  }) {
    const latest = latestEntityDecision(project, report.doc.id, entity.id, entityKind)
    if (latest?.decision === 'corrected') {
      card.append(createNode(
        'p',
        'language-reviewed',
        `Nutzerkorrektur · ${values.find(([value]) => value === latest.correction.next)?.[1] || latest.correction.next}`,
      ))
    } else if (latest?.decision === 'abstained') {
      card.append(createNode('p', 'language-reviewed', 'Vom Nutzer bewusst nicht zugeordnet'))
    }
    const controls = createNode('div', 'language-correction-controls')
    const select = selectField(correctedLabel, values, latest?.correction?.next || current)
    const correct = createNode('button', 'language-action', correctedLabel)
    correct.type = 'button'
    correct.addEventListener('click', () => {
      recordLanguageDecision({
        project,
        textId: report.doc.id,
        findingId: entity.id,
        entityKind,
        decision: 'corrected',
        correction: {
          field,
          previous: latest?.correction?.next || current,
          next: select.value,
          reason: 'Explizite Nutzerkorrektur der angezeigten Wirkungshypothese.',
        },
        at: Date.now(),
      })
      persist(project)
      render(body, project, `${correctedLabel}. Die ursprüngliche Hypothese und deine Korrektur bleiben gemeinsam im Dossier.`)
    })
    const abstain = createNode('button', 'language-action', 'Zuordnung enthalten')
    abstain.type = 'button'
    abstain.addEventListener('click', () => {
      recordLanguageDecision({
        project,
        textId: report.doc.id,
        findingId: entity.id,
        entityKind,
        decision: 'abstained',
        at: Date.now(),
      })
      persist(project)
      render(body, project, 'Zuordnung enthalten. Die Enthaltung bleibt mit der ursprünglichen Hypothese im Dossier.')
    })
    controls.append(select, correct, abstain)
    card.append(controls)
  }

  function renderFairness(parent, body, project, report, render) {
    const area = section(
      parent,
      `Integrität vor Stil · ${report.fairness.findings.length}`,
      'Falsche Zuspitzung, ausgelassene Gegeninformation und ausnutzende Ansprache werden vor Formulierungsfragen gezeigt.',
      report.fairness.findings.length ? 'is-integrity' : '',
    )
    if (report.fairness.status === 'limited') {
      area.append(createNode('p', 'language-context-gap', report.fairness.statusReason))
    } else if (report.fairness.status === 'not-applicable') {
      area.append(createNode('p', 'language-empty', report.fairness.statusReason))
    }
    if (!report.fairness.findings.length) {
      if (report.fairness.status === 'analyzed') {
        area.append(createNode('p', 'language-empty', 'Kein persuasives Integritätsrisiko auf der aktuellen Grundlage.'))
      }
      return
    }
    report.fairness.findings.forEach(finding => {
      const card = createNode('article', 'language-card is-integrity')
      card.append(
        createNode('span', 'language-tag is-integrity', `Integritätsrisiko · ${finding.priority}`),
        createNode('strong', 'language-card-title', finding.message),
        createNode('p', 'language-card-copy', finding.reason),
        createNode('p', 'language-review-question', finding.reviewQuestion),
        createNode('span', 'language-origin', `Passage ${finding.blockId} · „${finding.anchor.exact}“ · Sicherheit ${finding.confidence}`),
      )
      renderDecision(card, body, project, report, finding, render, 'kept-open', 'Im Schlussaudit behalten')
      area.append(card)
    })
  }

  function renderOrthography(parent, body, project, report, render) {
    const normDiagnostics = report.diagnostics.filter(item => item.class === 'norm-error')
    const area = section(
      parent,
      `Eindeutige Normfälle · ${normDiagnostics.length}`,
      'Die Automatik ist standardmäßig aus. Sie kennt nur eine kleine Liste eindeutiger Schreibungen und verändert weder Eigennamen noch mehrdeutige Grammatik.',
    )
    const controls = createNode('div', 'language-orthography-controls')
    const toggle = createNode(
      'button',
      'language-switch',
      report.profile.orthographyAutomation
        ? 'Normautomatik eingeschaltet'
        : 'Normautomatik ausgeschaltet',
    )
    toggle.type = 'button'
    toggle.setAttribute('role', 'switch')
    toggle.setAttribute('aria-checked', String(report.profile.orthographyAutomation))
    toggle.addEventListener('click', () => {
      project.languageProfile = setOrthographyAutomation({
        profile: project.languageProfile,
        projectId: project.id,
        enabled: !report.profile.orthographyAutomation,
        at: Date.now(),
      })
      persist(project)
      render(
        body,
        project,
        project.languageProfile.orthographyAutomation
          ? 'Normautomatik bewusst eingeschaltet. Änderungen werden erst nach dem nächsten Knopfdruck angewendet.'
          : 'Normautomatik ausgeschaltet. Der Text bleibt unverändert.',
      )
    })
    const apply = createNode('button', 'language-primary', 'Eindeutige Normfälle anwenden')
    apply.type = 'button'
    apply.disabled = !report.profile.orthographyAutomation || !normDiagnostics.length
    apply.addEventListener('click', () => {
      try {
        const plan = planOrthographyCorrections({
          profile: project.languageProfile,
          projectId: project.id,
          textId: report.doc.id,
          diagnostics: normDiagnostics,
        })
        const result = applyOrthographyCorrections({
          profile: project.languageProfile,
          projectId: project.id,
          textId: report.doc.id,
          plan,
          applyCorrections,
          at: Date.now(),
        })
        project.languageProfile = result.profile
        persist(project)
        render(
          body,
          project,
          `${result.applied.length} eindeutige Normkorrektur${result.applied.length === 1 ? '' : 'en'} angewendet; ${result.skipped.length} geschützte oder veraltete Stelle${result.skipped.length === 1 ? '' : 'n'} blieb${result.skipped.length === 1 ? '' : 'en'} unverändert.`,
        )
      } catch (error) {
        render(body, project, error?.message || 'Die Normkorrekturen konnten nicht angewendet werden.')
      }
    })
    controls.append(toggle, apply)
    area.append(controls)
    normDiagnostics.forEach(item => {
      const card = createNode('article', 'language-card is-norm')
      card.append(
        createNode('span', 'language-tag is-norm', 'Normfehler'),
        createNode('strong', 'language-card-title', item.message),
        createNode('p', 'language-card-copy', `${item.anchor.exact} → ${item.suggestion?.replacement || 'prüfen'}`),
        createNode('span', 'language-origin', `Passage ${item.blockId} · Zeichen ${item.anchor.start + 1}–${item.anchor.end}`),
      )
      area.append(card)
    })
  }

  function renderLanguageFindings(parent, body, project, report, render) {
    const diagnostics = report.diagnostics.filter(item => item.class !== 'norm-error')
    const area = section(
      parent,
      `Sprache und Muster · ${diagnostics.length}`,
      'Grammatik, Register, Modalität und Oberflächenmuster bleiben getrennte, begrenzte Beobachtungen.',
    )
    if (!diagnostics.length) {
      area.append(createNode('p', 'language-empty', 'Keine weitere Sprachbeobachtung auf der aktuellen Grundlage.'))
      return
    }
    diagnostics.forEach(item => {
      const card = createNode('article', `language-card is-${item.class}`)
      card.append(
        createNode('span', `language-tag is-${item.class}`, CLASS_LABELS[item.class] || item.class),
        createNode('strong', 'language-card-title', item.message),
        createNode('p', 'language-card-copy', item.reason),
        createNode('p', 'language-review-question', item.reviewQuestion),
        createNode('span', 'language-origin', `Passage ${item.blockId} · Sicherheit ${item.confidence}`),
      )
      renderDecision(card, body, project, report, item, render, 'reviewed', 'Als geprüft markieren')
      area.append(card)
    })
  }

  function renderAudience(parent, report) {
    const area = section(
      parent,
      'Publikum · Ausgang und Ziel',
      'Leserwirkung ist ohne reale Reaktion eine begründete Hypothese. Lesbarkeit wird nicht mit Verstehen gleichgesetzt.',
    )
    const audience = report.effect.audience
    area.append(createNode('p', 'language-audience-label', `Zielgruppe · ${listText(audience.label)}`))
    const grid = createNode('dl', 'language-audience-grid')
    Object.entries(AUDIENCE_LABELS).forEach(([key, label]) => {
      grid.append(
        createNode('dt', '', label),
        createNode('dd', '', audience[key].status === 'known' ? listText(audience[key].values) : 'noch unbekannt'),
      )
    })
    grid.append(
      createNode('dt', '', 'Beabsichtigte Veränderung'),
      createNode('dd', '', audience.targetChange.status === 'known' ? audience.targetChange.value : 'noch unbekannt'),
    )
    area.append(grid)
  }

  function renderPassages(parent, body, project, report, render) {
    const area = section(
      parent,
      `Passagefunktionen · ${report.effect.passages.length}`,
      'Jede Zuordnung nennt ihre lokale Grundlage und bleibt als Hypothese korrigierbar.',
    )
    report.effect.passages.forEach(passage => {
      const card = createNode('article', 'language-card language-passage')
      card.append(
        createNode('span', 'language-tag is-hypothesis', `Hypothese · ${FUNCTION_LABELS[passage.function] || passage.function}`),
        createNode('strong', 'language-card-title', passage.text),
        createNode('p', 'language-card-copy', passage.rationale),
        createNode('span', 'language-origin', `${passage.discourseRelation} · Sicherheit ${passage.confidence}`),
      )
      renderEntityCorrection({
        card,
        body,
        project,
        report,
        render,
        entity: passage,
        entityKind: 'effect-passage',
        field: 'function',
        current: passage.function,
        values: Object.entries(FUNCTION_LABELS),
        correctedLabel: 'Funktion korrigieren',
      })
      area.append(card)
    })
  }

  function renderRhetoric(parent, body, project, report, render) {
    const area = section(
      parent,
      `Rhetorische Mittel · ${report.rhetoric.devices.length}`,
      'Bildlichkeit und Erzählung sind Werkzeuge. Gewinn, Grenze und mögliche Fehlvorstellung werden getrennt.',
    )
    if (!report.rhetoric.devices.length) {
      area.append(createNode('p', 'language-empty', 'Kein ausdrücklich markiertes rhetorisches Mittel erkannt. Direktheit kann hier die bessere Wahl sein.'))
      return
    }
    report.rhetoric.devices.forEach(device => {
      const card = createNode('article', 'language-card language-rhetoric')
      card.append(
        createNode('span', 'language-tag is-hypothesis', `Wirkungshypothese · ${device.kind}`),
        createNode('strong', 'language-card-title', device.function),
        createNode('p', 'language-card-copy', `Möglicher Gewinn · ${device.expectedGain}`),
        createNode('p', 'language-card-copy', `Mögliche Fehlvorstellung · ${device.possibleMisconception}`),
        createNode('span', 'language-origin', device.directVersionPreferred ? 'Direkte Fassung bevorzugt prüfen' : 'Kontextabhängige Wirkung'),
      )
      renderEntityCorrection({
        card,
        body,
        project,
        report,
        render,
        entity: device,
        entityKind: 'rhetorical-device',
        field: 'kind',
        current: device.kind,
        values: Object.entries(RHETORIC_LABELS),
        correctedLabel: 'Stilmittel korrigieren',
      })
      area.append(card)
    })
  }

  function renderAudit(parent, project, report) {
    const events = [
      ...report.profile.events,
      ...(project.languageReports?.history || []),
      ...(project.languageReports?.decisions || []),
    ]
      .filter(event => event.projectId === report.profile.projectId && (!event.textId || event.textId === report.doc.id))
      .sort((left, right) => left.at - right.at)
    if (!events.length) return
    const details = createNode('details', 'language-details language-audit')
    const summary = document.createElement('summary')
    summary.textContent = `${events.length} Profil- und Korrekturereignis${events.length === 1 ? '' : 'se'}`
    const list = createNode('ol', 'language-event-list')
    events.forEach(event => {
      const detail = event.kind === 'orthography-applied'
        ? `${event.oldText} → ${event.newText} · ${event.blockId}`
        : event.kind === 'finding-decision'
          ? `${event.decision} · ${event.entityKind || 'finding'} · ${event.findingId}${event.correction ? ` · ${event.correction.previous} → ${event.correction.next}` : ''}`
          : event.kind === 'analysis-recorded'
            ? `${event.counts.diagnostics} Sprachbefunde · ${event.counts.fairness} Integritätsbefunde`
            : ''
      list.append(createNode(
        'li',
        'language-event',
        `${event.kind}${detail ? ` · ${detail}` : ''} · ${new Date(event.at).toLocaleString('de-DE')}`,
      ))
    })
    details.append(summary, list)
    parent.append(details)
  }

  function render(body, project, message = '') {
    const scrollTop = body.scrollTop
    body.replaceChildren()
    try {
      const report = synchronize(project)
      let status = null
      if (message) {
        status = createNode('p', 'language-status', message)
        status.setAttribute('role', 'status')
        status.tabIndex = -1
        body.append(status)
      }
      const intro = createNode('section', 'language-intro')
      const exportButton = createNode('button', 'language-action', 'Dossier als JSON exportieren')
      exportButton.type = 'button'
      exportButton.addEventListener('click', () => {
        const dossier = exportLanguageDossier({ project, textId: report.doc.id })
        const blob = new Blob([`${JSON.stringify(dossier, null, 2)}\n`], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `sprache-wirkung-${report.doc.id}.json`
        link.click()
        URL.revokeObjectURL(url)
      })
      intro.append(
        createNode('span', 'language-kicker', `Kontextgebunden · bedeutungstreu · Stand ${new Date(report.profile.lastAnalysis.at).toLocaleString('de-DE')}`),
        createNode('p', '', 'Das Dossier trennt Norm, Sprachbeobachtung, Wirkungshypothese und Integritätsrisiko. Beim Öffnen ändert es nichts an deinem Text.'),
        exportButton,
      )
      body.append(intro)
      renderProfile(body, body, project, report, render)
      renderFairness(body, body, project, report, render)
      renderOrthography(body, body, project, report, render)
      renderLanguageFindings(body, body, project, report, render)
      renderAudience(body, report)
      renderPassages(body, body, project, report, render)
      renderRhetoric(body, body, project, report, render)
      renderAudit(body, project, report)
      persist(project)
      body.scrollTop = message ? scrollTop : 0
      if (status) requestAnimationFrame(() => status.focus({ preventScroll: true }))
    } catch (error) {
      const status = createNode('p', 'language-status is-error', error?.message || 'Das Sprach- und Wirkungsdossier konnte nicht geöffnet werden.')
      status.setAttribute('role', 'alert')
      status.tabIndex = -1
      body.append(status)
      requestAnimationFrame(() => status.focus({ preventScroll: true }))
    }
  }

  function open(project, opener) {
    openDialog({
      id: 'languageModal',
      title: 'Sprache und Wirkung',
      opener,
      build: body => render(body, project),
    })
  }

  return { open, render }
}
