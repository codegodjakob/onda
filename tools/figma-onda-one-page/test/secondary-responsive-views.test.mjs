import test from 'node:test'
import assert from 'node:assert/strict'
import * as definitions from '../src/definitions.mjs'

const AGENT_SOURCES = [
  ['Gespräch · Bereit', ['aura@State=Idle', 'agent-message@Role=User', 'composer@State=Empty']],
  ['Gespräch · Antwort entsteht', ['aura@State=Working', 'agent-message@State=Streaming', 'composer@State=Draft']],
  ['Gespräch · Antwort bereit', ['aura@State=Complete', 'agent-message@Role=Agent', 'evidence-card@Status=Unverified', 'source-card@Status=Ready']],
  ['Gespräch · Fehler & Rückkehr', ['aura@State=Error', 'agent-message@State=Error', 'composer@State=Draft', 'status-symbol@Status=Error']],
  ['Entscheidungsverlauf', ['decision-card@Status=Pending', 'decision-card@Status=Accepted', 'decision-card@Status=Rejected', 'decision-card@Status=Overridden']],
  ['Evidence · Prüfmatrix', ['evidence-card@Status=Unverified', 'evidence-card@Status=Verified', 'evidence-card@Status=Conflict', 'evidence-card@Status=Missing', 'tag@Kind=Source']],
  ['Quellen · Bereit und Laden', ['source-card@Status=Ready', 'source-card@Status=Loading']],
  ['Quellen · Ungültig oder offline', ['source-card@Status=Invalid', 'source-card@Status=Offline', 'evidence-card@Status=Missing']],
  ['Import · Auswahl und Validierung', ['import-panel@State=Empty', 'import-panel@State=Validating']],
  ['Import · Bereit', ['import-panel@State=Ready', 'source-card@Status=Ready']],
  ['Import · Fehler', ['import-panel@State=Error', 'status-symbol@Status=Error']],
  ['Leser · Fundstelle', ['reader-panel@State=Reading', 'reader-panel@State=Highlight', 'evidence-card@Status=Verified']],
  ['Leser · Nicht verfügbar', ['reader-panel@State=Unavailable', 'source-card@Status=Offline', 'status-symbol@Status=Error']],
  ['Recherche · Übersicht', ['research-card@Status=Planned', 'research-card@Status=Running', 'research-card@Status=Paused', 'research-card@Status=Ready']],
  ['Recherche · Fehler', ['research-card@Status=Error', 'aura@State=Error', 'status-symbol@Status=Error']],
]

const SECONDARY = [
  ['Einstellungen · Bereit', ['field@State=Filled', 'select@State=Selected', 'mode-toggle@Mode=Text, State=Active', 'button@Kind=Primary, State=Default', 'button@Kind=Secondary, State=Default']],
  ['Einstellungen · Validierungsfehler', ['field@State=Error', 'select@State=Open', 'mode-toggle@Mode=Text, State=Active', 'button@Kind=Primary, State=Default', 'button@Kind=Secondary, State=Default']],
  ['Link-Menü · Geöffnet', ['menu-item@State=Default', 'menu-item@State=Hover', 'menu-item@State=Selected', 'menu-item@State=Disabled']],
  ['Slash-Menü · Suche leer', ['search@State=Empty', 'menu-item@State=Default', 'menu-item@State=Default']],
  ['Slash-Menü · Treffer', ['search@State=Results', 'menu-item@State=Default', 'menu-item@State=Selected']],
  ['Slash-Menü · Keine Treffer', ['search@State=No Results', 'empty-state@Context=No Active Annotation', 'button@Kind=Secondary, State=Default']],
  ['Blockeinfügung · Position wählen', ['select@State=Open', 'menu-item@State=Selected', 'dialog-action@Kind=Primary', 'dialog-action@Kind=Secondary']],
  ['Quellenleser · Fundstelle übernehmen', ['reader-panel@State=Highlight', 'evidence-card@Status=Verified', 'dialog-action@Kind=Primary', 'dialog-action@Kind=Secondary']],
  ['Rechercheablauf · Pausiert und Fehler', ['research-card@Status=Paused', 'research-card@Status=Error', 'menu-item@State=Default', 'menu-item@State=Default']],
]

const RESPONSIVE = [
  ['Responsive / Bibliothek · 1440 Light', 1440, 'Light', 'Bibliothek', ['nav-item@State=Default', 'search@State=Empty', 'select@State=Selected', 'list-row@State=Default']],
  ['Responsive / Bibliothek · 1024 Light', 1024, 'Light', 'Bibliothek', ['nav-item@State=Default', 'search@State=Empty', 'select@State=Selected', 'list-row@State=Default']],
  ['Responsive / Bibliothek · 720 Light', 720, 'Light', 'Bibliothek', ['nav-item@State=Collapsed', 'search@State=Empty', 'select@State=Selected', 'list-row@State=Default']],
  ['Responsive / Bibliothek · 320 Light', 320, 'Light', 'Bibliothek', ['nav-item@State=Collapsed', 'search@State=Empty', 'select@State=Selected', 'list-row@State=Default']],
  ['Responsive / Editor · 1440 Light', 1440, 'Light', 'Editor', ['nav-item@State=Default', 'mode-toggle@Mode=Text, State=Active', 'review-bar@Status=Open', 'annotation-anchor@Kind=Text, State=Idle', 'annotation-card@State=Open']],
  ['Responsive / Editor · 1024 Light', 1024, 'Light', 'Editor', ['nav-item@State=Default', 'mode-toggle@Mode=Text, State=Active', 'review-bar@Status=Open', 'annotation-anchor@Kind=Text, State=Idle', 'annotation-card@State=Open']],
  ['Responsive / Editor · 720 Light', 720, 'Light', 'Editor', ['nav-item@State=Collapsed', 'mode-toggle@Mode=Text, State=Active', 'review-bar@Status=Open', 'annotation-anchor@Kind=Text, State=Idle', 'annotation-card@State=Open']],
  ['Responsive / Editor · 320 Light', 320, 'Light', 'Editor', ['nav-item@State=Collapsed', 'mode-toggle@Mode=Text, State=Active', 'review-bar@Status=Open', 'annotation-anchor@Kind=Text, State=Idle', 'annotation-card@State=Open']],
  ['Responsive / Bibliothek · 1440 Dark', 1440, 'Dark', 'Bibliothek', ['nav-item@State=Default', 'search@State=Empty', 'select@State=Selected', 'list-row@State=Default']],
  ['Responsive / Bibliothek · 320 Dark', 320, 'Dark', 'Bibliothek', ['nav-item@State=Collapsed', 'search@State=Empty', 'select@State=Selected', 'list-row@State=Default']],
  ['Responsive / Editor · 1440 Dark', 1440, 'Dark', 'Editor', ['nav-item@State=Default', 'mode-toggle@Mode=Text, State=Active', 'review-bar@Status=Open', 'annotation-anchor@Kind=Text, State=Idle', 'annotation-card@State=Open']],
  ['Responsive / Editor · 320 Dark', 320, 'Dark', 'Editor', ['nav-item@State=Collapsed', 'mode-toggle@Mode=Text, State=Active', 'review-bar@Status=Open', 'annotation-anchor@Kind=Text, State=Idle', 'annotation-card@State=Open']],
  ['Responsive / Annotation · Beleg fehlt · Dark', 720, 'Dark', 'Annotation', ['annotation-anchor@Kind=Text, State=Active', 'annotation-form@Form=Source', 'annotation-card@State=Open', 'dialog-action@Kind=Primary', 'dialog-action@Kind=Secondary']],
  ['Responsive / Agent · Streaming · Dark', 720, 'Dark', 'Agent', ['aura@State=Working', 'agent-message@State=Streaming', 'composer@State=Draft', 'dialog-action@Kind=Disabled']],
  ['Responsive / Evidence · Konflikt · Dark', 720, 'Dark', 'Evidence', ['evidence-card@Status=Conflict', 'source-card@Status=Invalid', 'reader-panel@State=Highlight']],
  ['Responsive / Dialog · Lang · Dark', 720, 'Dark', 'Dialog', ['dialog@Size=Long', 'dialog-action@Kind=Primary', 'dialog-action@Kind=Secondary']],
]

function deepFrozen(value) {
  if (!value || typeof value !== 'object') return true
  return Object.isFrozen(value) && Object.values(value).every(deepFrozen)
}

function mapping(view) {
  return view.instances.map(instance => `${instance.setId}@${instance.variant}`)
}

function expectedVariantCopy(instance) {
  const component = definitions.COMPONENT_DEFINITIONS.find(item => item.id === instance.setId)
  const variant = component.variants.find(item => item.name === instance.variant)
  return Object.fromEntries(component.roles
    .filter(role => role.type === 'TEXT')
    .map(role => [role.name, variant.copy[role.name]]))
}

function namedView(group, name) {
  return definitions.SECONDARY_VIEW_DEFINITIONS[group].find(view => view.name === name)
}

function mappedInstance(view, setId, variant) {
  return view.instances.find(instance => instance.setId === setId && instance.variant === variant)
}

test('deeply frozen secondary contract defines the exact ordered 15/9/16 matrix with complete nested instance contracts', () => {
  const matrix = definitions.SECONDARY_VIEW_DEFINITIONS
  assert.ok(matrix, 'SECONDARY_VIEW_DEFINITIONS missing')
  assert.equal(deepFrozen(matrix), true)
  const groups = [
    ['agentSources', AGENT_SOURCES, 'Agent & Quellen / ', '07 · Agent & Quellen'],
    ['secondary', SECONDARY, 'Nebenansicht / ', '09 · Menüs & Nebenansichten'],
  ]
  for (const [groupName, expected, prefix, sectionName] of groups) {
    const views = matrix[groupName]
    assert.deepEqual(views.map(view => view.name), expected.map(([name]) => `${prefix}${name}`))
    for (const [view, [, expectedMapping]] of views.map((view, index) => [view, expected[index]])) {
      assert.equal(view.sectionName, sectionName)
      assert.equal(view.width, 1440)
      assert.equal(view.theme, 'Light')
      assert.notEqual(view.layoutMode, 'NONE')
      assert.ok(view.regions.length > 1)
      assert.deepEqual(mapping(view), expectedMapping)
    }
  }
  assert.deepEqual(matrix.responsive.map(view => view.name), RESPONSIVE.map(([name]) => name))
  for (const [view, [, width, theme, subject, expectedMapping]] of matrix.responsive.map((view, index) => [view, RESPONSIVE[index]])) {
    assert.equal(view.sectionName, '10 · Responsive & Dark')
    assert.equal(view.width, width)
    assert.equal(view.theme, theme)
    assert.equal(view.subject, subject)
    assert.equal(view.breakpoint, width === 720 && /Dark$/.test(view.name) && !/Bibliothek|Editor/.test(view.name) ? 'reference' : width)
    assert.notEqual(view.layoutMode, 'NONE')
    assert.deepEqual(mapping(view), expectedMapping)
    if (width === 320) {
      assert.equal(view.layoutMode, 'VERTICAL')
      assert.ok(view.regions.every(region => Object.values(region.padding).every(value => value === 16)))
    }
  }
  const all = Object.values(matrix).flat()
  assert.equal(all.length, 40)
  for (const view of all) {
    const regions = new Set(view.regions.map(region => region.name))
    assert.ok(view.regions.every(region => region.parentName === view.name || regions.has(region.parentName)))
    assert.ok(view.regions.every(region => region.layoutMode !== 'NONE'))
    assert.ok(view.copyContracts.every(copy => regions.has(copy.region)))
    for (const instance of view.instances) {
      const component = definitions.COMPONENT_DEFINITIONS.find(item => item.id === instance.setId)
      assert.ok(component, `${view.name}/${instance.name}: unknown component`)
      assert.ok(regions.has(instance.region), `${view.name}/${instance.name}: unknown region`)
      assert.equal(instance.expectedHeight, definitions.componentRenderedHeight(component))
      assert.deepEqual(Object.keys(instance.roleCopy).sort(), component.roles.filter(role => role.type === 'TEXT').map(role => role.name).sort())
    }
  }
})

test('Agent and Quellen variants preserve their explicit German state semantics and coherent source/evidence states', () => {
  for (const view of definitions.SECONDARY_VIEW_DEFINITIONS.agentSources) {
    for (const instance of view.instances) assert.deepEqual(
      instance.roleCopy,
      expectedVariantCopy(instance),
      `${view.name}/${instance.setId}@${instance.variant}: state copy overwritten`,
    )
  }
  const invalid = namedView('agentSources', 'Agent & Quellen / Quellen · Ungültig oder offline')
  assert.equal(mappedInstance(invalid, 'source-card', 'Status=Invalid').roleCopy.Status, 'Ungültig')
  assert.equal(mappedInstance(invalid, 'source-card', 'Status=Offline').roleCopy.Status, 'Offline')
  assert.deepEqual(mappedInstance(invalid, 'evidence-card', 'Status=Missing').roleCopy, {
    Symbol: '—', Claim: 'Kein Beleg verknüpft', Source: 'Quelle fehlt', Confidence: 'Nicht bewertbar', Action: 'Quelle hinzufügen',
  })
  const matrix = namedView('agentSources', 'Agent & Quellen / Evidence · Prüfmatrix')
  assert.deepEqual(matrix.instances.filter(instance => instance.setId === 'evidence-card').map(instance => instance.roleCopy.Confidence), [
    'Einschätzung: offen', 'Einschätzung: hoch', 'Einschätzung: unklar', 'Nicht bewertbar',
  ])
})

test('Dark responsive references use subject-specific annotation, streaming, conflict, and long-dialog copy without generic labels', () => {
  const annotation = namedView('responsive', 'Responsive / Annotation · Beleg fehlt · Dark')
  assert.deepEqual(mappedInstance(annotation, 'annotation-card', 'State=Open').roleCopy, {
    Type: 'Empfehlung', Title: 'Beleg fehlt', Body: 'Diese Aussage braucht eine überprüfbare Quelle.', Scope: 'Nur diesmal',
    'Primary Action': 'Quelle verknüpfen', 'Secondary Action': 'Später prüfen', Status: 'Offen',
  })
  assert.deepEqual(mappedInstance(annotation, 'dialog-action', 'Kind=Primary').roleCopy, { Symbol: '→', Label: 'Quelle verknüpfen', Hint: 'Geprüfte Fundstelle übernehmen' })
  assert.deepEqual(mappedInstance(annotation, 'dialog-action', 'Kind=Secondary').roleCopy, { Symbol: '←', Label: 'Später prüfen', Hint: 'Hinweis bleibt offen' })

  const agent = namedView('responsive', 'Responsive / Agent · Streaming · Dark')
  assert.equal(mappedInstance(agent, 'aura', 'State=Working').roleCopy.Label, 'Aura prüft den Auftrag')
  assert.equal(mappedInstance(agent, 'agent-message', 'State=Streaming').roleCopy.Status, 'Wird geladen')
  assert.deepEqual(mappedInstance(agent, 'dialog-action', 'Kind=Disabled').roleCopy, { Symbol: '×', Label: 'Senden gesperrt', Hint: 'Antwort wird noch erstellt' })

  const conflict = namedView('responsive', 'Responsive / Evidence · Konflikt · Dark')
  assert.deepEqual(mappedInstance(conflict, 'evidence-card', 'Status=Conflict').roleCopy, {
    Symbol: '!', Claim: 'Quellen widersprechen sich', Source: 'Zwei abweichende Fundstellen', Confidence: 'Einschätzung: unklar', Action: 'Konflikt prüfen',
  })
  assert.deepEqual(mappedInstance(conflict, 'source-card', 'Status=Invalid').roleCopy, {
    Type: 'Ungültige Quelle', Title: 'Eine Konfliktquelle kann nicht gelesen werden', Meta: 'Adresse oder Format der Fundstelle prüfen', Status: 'Ungültig', Action: 'Andere Quelle wählen',
  })
  assert.match(mappedInstance(conflict, 'reader-panel', 'State=Highlight').roleCopy.Excerpt, /abweichende Fundstelle/)

  const longDialog = namedView('responsive', 'Responsive / Dialog · Lang · Dark')
  const dialog = mappedInstance(longDialog, 'dialog', 'Size=Long')
  assert.deepEqual(dialog.roleCopy, {
    Eyebrow: 'Exportprüfung', Title: 'Datenkontrolle und Export', Body: 'Prüfe offene Hinweise, Datenumfang und Exportziel, bevor du fortfährst.',
    Status: 'Bitte vollständig lesen', 'Primary Action': 'Fortfahren', 'Secondary Action': 'Zurück',
  })
  assert.equal(mappedInstance(longDialog, 'dialog-action', 'Kind=Primary').roleCopy.Label, dialog.roleCopy['Primary Action'])
  assert.equal(mappedInstance(longDialog, 'dialog-action', 'Kind=Secondary').roleCopy.Label, dialog.roleCopy['Secondary Action'])
  assert.doesNotMatch(JSON.stringify(definitions.SECONDARY_VIEW_DEFINITIONS.responsive.slice(12)), /(Annotation|Agent|Evidence|Dialog) · 720px · Dark|Details prüfen|Kontext:/)
})
