(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // ../../app/src/annotation-contract.mjs
  var TEXT_ANNOTATION_KINDS = Object.freeze([
    "rechtschreibung",
    "grammatik",
    "zeichensetzung",
    "wortwahl",
    "satzstil",
    "absatzstil",
    "straffen",
    "wiederholung",
    "ton",
    "stilmittel",
    "anglizismus",
    "terminologie",
    "verschieben",
    "uebergang",
    "gliederung",
    "fluss",
    "faden",
    "ueberschrift",
    "anmerkung",
    "beleg",
    "faktencheck",
    "widerspruch",
    "luecke",
    "verstaendlichkeit"
  ]);
  var NOTE_ANNOTATION_KINDS = Object.freeze([
    "ausformulieren",
    "buendeln",
    "nachfrage",
    "ordnen",
    "aufgreifen"
  ]);
  var ALL_ANNOTATION_KINDS = Object.freeze([
    ...TEXT_ANNOTATION_KINDS,
    ...NOTE_ANNOTATION_KINDS
  ]);
  function definition(kind, label, category, priority, form, scope, operation = null) {
    return Object.freeze({ kind, label, category, priority, form, scope, operation });
  }
  var ANNOTATION_DEFINITIONS = Object.freeze({
    rechtschreibung: definition("rechtschreibung", "Rechtschreibung", "korrektur", "fehler", "correction", "Wort", "replace-range"),
    grammatik: definition("grammatik", "Grammatik", "korrektur", "fehler", "correction", "Satz", "replace-range"),
    zeichensetzung: definition("zeichensetzung", "Zeichensetzung", "korrektur", "fehler", "correction", "Wort", "replace-range"),
    wortwahl: definition("wortwahl", "Wortwahl", "stil", "geschmack", "correction", "Wort", "replace-range"),
    satzstil: definition("satzstil", "Satzstil", "stil", "empfehlung", "rewrite", "Satz", "replace-range"),
    absatzstil: definition("absatzstil", "Absatzstil", "stil", "geschmack", "rewrite", "Absatz", "replace-range"),
    straffen: definition("straffen", "Straffen", "stil", "empfehlung", "rewrite", "Satz", "replace-range"),
    wiederholung: definition("wiederholung", "Wiederholung", "stil", "geschmack", "region", "Absatz", "replace-many"),
    ton: definition("ton", "Ton & Register", "stil", "geschmack", "region", "Abschnitt", "replace-many"),
    stilmittel: definition("stilmittel", "Stilmittel", "stil", "geschmack", "insertion", "Satz", "insert-at"),
    anglizismus: definition("anglizismus", "Anglizismus", "stil", "geschmack", "correction", "Wort", "replace-range"),
    terminologie: definition("terminologie", "Terminologie", "stil", "empfehlung", "compare", "Text", "replace-many"),
    verschieben: definition("verschieben", "Verschieben", "struktur", "empfehlung", "slot", "Absatz", "move-block"),
    uebergang: definition("uebergang", "\xDCbergang", "struktur", "empfehlung", "insertion", "Satz", "insert-at"),
    gliederung: definition("gliederung", "Gliederung", "struktur", "empfehlung", "slot", "Abschnitt", "insert-heading"),
    fluss: definition("fluss", "Textfluss", "struktur", "empfehlung", "rewrite", "Satz", "replace-range"),
    faden: definition("faden", "Roter Faden", "struktur", "empfehlung", "rewrite", "Text"),
    ueberschrift: definition("ueberschrift", "\xDCberschrift", "struktur", "geschmack", "title", "Titel", "replace-title"),
    anmerkung: definition("anmerkung", "Anmerkung", "inhalt", "geschmack", "dialogue", "Satz"),
    beleg: definition("beleg", "Beleg fehlt", "inhalt", "fehler", "source", "Satz", "attach-source"),
    faktencheck: definition("faktencheck", "Faktencheck", "inhalt", "fehler", "source", "Satz", "replace-range"),
    widerspruch: definition("widerspruch", "Widerspruch", "inhalt", "fehler", "compare", "Text", "replace-range"),
    luecke: definition("luecke", "Gegenargument fehlt", "inhalt", "empfehlung", "dialogue", "Abschnitt"),
    verstaendlichkeit: definition("verstaendlichkeit", "Verst\xE4ndlichkeit", "inhalt", "empfehlung", "insertion", "Satz", "insert-at"),
    ausformulieren: definition("ausformulieren", "Ausformulieren", "notiz", "empfehlung", "rewrite", "Notiz", "replace-range"),
    buendeln: definition("buendeln", "Geh\xF6rt zusammen", "notiz", "empfehlung", "slot", "Notizen", "move-block"),
    nachfrage: definition("nachfrage", "Nachfrage", "notiz", "empfehlung", "dialogue", "Notiz"),
    ordnen: definition("ordnen", "Reihenfolge", "notiz", "empfehlung", "slot", "Notizen", "move-block"),
    aufgreifen: definition("aufgreifen", "Offener Faden", "notiz", "geschmack", "dialogue", "Text")
  });
  var ALL_KIND_SET = new Set(ALL_ANNOTATION_KINDS);
  var TEXT_KIND_SET = new Set(TEXT_ANNOTATION_KINDS);
  var NOTE_KIND_SET = new Set(NOTE_ANNOTATION_KINDS);
  var LEGACY_GERMAN_KIND = Object.freeze({
    fakt: "faktencheck",
    quelle: "beleg",
    methode: "anmerkung",
    logik: "widerspruch",
    struktur: "faden",
    wirkung: "anmerkung",
    erklaerung: "verstaendlichkeit",
    sprache: "wortwahl"
  });
  var LEGACY_ENGLISH_KIND = Object.freeze({
    fact: "faktencheck",
    source: "beleg",
    citation: "beleg",
    method: "anmerkung",
    logic: "widerspruch",
    structure: "faden",
    content: "anmerkung",
    wording: "wortwahl",
    form: "wortwahl"
  });

  // src/definitions.mjs
  var PLUGIN_ORIGIN = "onda-one-page";
  var LEDGER_KEY = "ondaOnePageLedger";
  var TARGET_FILE_KEY = "0DbO0vK6shrVU2qkmWSxIp";
  var TARGET_DOCUMENT_NAME = "Claude Code";
  var TARGET_PAGE_NAME = "Page 1";
  var PALETTE = Object.freeze({
    "gray/000": Object.freeze({ r: 1, g: 1, b: 1 }),
    "gray/025": Object.freeze({ r: 0.98, g: 0.98, b: 0.98 }),
    "gray/050": Object.freeze({ r: 0.95, g: 0.95, b: 0.95 }),
    "gray/100": Object.freeze({ r: 0.9, g: 0.9, b: 0.9 }),
    "gray/200": Object.freeze({ r: 0.82, g: 0.82, b: 0.82 }),
    "gray/300": Object.freeze({ r: 0.7, g: 0.7, b: 0.7 }),
    "gray/500": Object.freeze({ r: 0.45, g: 0.45, b: 0.45 }),
    "gray/700": Object.freeze({ r: 0.24, g: 0.24, b: 0.24 }),
    "gray/900": Object.freeze({ r: 0.08, g: 0.08, b: 0.08 }),
    "gray/1000": Object.freeze({ r: 0, g: 0, b: 0 })
  });
  var RADIUS_TOKENS = Object.freeze([
    Object.freeze({ name: "radius/none", value: 0, geometry: "RECTANGLE" }),
    Object.freeze({ name: "radius/control", value: 4, geometry: "RECTANGLE" }),
    Object.freeze({ name: "radius/static", value: 6, geometry: "RECTANGLE" }),
    Object.freeze({ name: "radius/overlay", value: 8, geometry: "RECTANGLE" }),
    Object.freeze({ name: "radius/circle", value: 999, geometry: "ELLIPSE" })
  ]);
  var SPACING_TOKENS = Object.freeze([4, 8, 12, 16, 24, 32, 40].map((value) => Object.freeze({
    name: `spacing/${value}`,
    value
  })));
  var SEMANTIC_COLOR_ROLES = Object.freeze([
    Object.freeze({ name: "color/background", light: "gray/025", dark: "gray/1000", scopes: Object.freeze(["FRAME_FILL", "SHAPE_FILL"]) }),
    Object.freeze({ name: "color/surface", light: "gray/000", dark: "gray/900", scopes: Object.freeze(["FRAME_FILL", "SHAPE_FILL"]) }),
    Object.freeze({ name: "color/text", light: "gray/900", dark: "gray/000", scopes: Object.freeze(["TEXT_FILL"]) }),
    Object.freeze({ name: "color/text-muted", light: "gray/500", dark: "gray/300", scopes: Object.freeze(["TEXT_FILL"]) }),
    Object.freeze({ name: "color/border", light: "gray/200", dark: "gray/700", scopes: Object.freeze(["STROKE_COLOR"]) }),
    Object.freeze({ name: "color/inverted", light: "gray/900", dark: "gray/000", scopes: Object.freeze(["FRAME_FILL", "SHAPE_FILL"]) }),
    Object.freeze({ name: "color/on-inverted", light: "gray/000", dark: "gray/900", scopes: Object.freeze(["TEXT_FILL"]) })
  ]);
  var TYPE_SCALE = Object.freeze([
    Object.freeze({ size: 12, lineHeight: 16 }),
    Object.freeze({ size: 15, lineHeight: 22 }),
    Object.freeze({ size: 21, lineHeight: 28 }),
    Object.freeze({ size: 40, lineHeight: 44 })
  ]);
  var TYPE_WEIGHTS = Object.freeze([400, 500, 700]);
  var FOUNDATION_EXPECTATIONS = Object.freeze({
    collections: Object.freeze({
      "Onda \xB7 Primitive": Object.freeze({ mode: "Value", variableCount: 10 }),
      "Onda \xB7 Dimension": Object.freeze({ mode: "Value", variableCount: 12 }),
      "Onda \xB7 Semantic \xB7 Light": Object.freeze({ mode: "Light", variableCount: 7 }),
      "Onda \xB7 Semantic \xB7 Dark": Object.freeze({ mode: "Dark", variableCount: 7 }),
      "Onda \xB7 Typography": Object.freeze({ mode: "Value", variableCount: 7 })
    }),
    swatches: Object.freeze({ primitive: 10, semanticLight: 7, semanticDark: 7, bound: 24 }),
    spacingBars: Object.freeze({ total: 7, bound: 7 }),
    radiusSamples: Object.freeze({ total: 5, boundRectangles: 4, ellipses: 1 }),
    textStyles: Object.freeze([
      Object.freeze({ role: "Display", name: "Onda/Type/Display", size: 40, weight: 700, lineHeight: 44 }),
      Object.freeze({ role: "Heading", name: "Onda/Type/Heading", size: 21, weight: 700, lineHeight: 28 }),
      Object.freeze({ role: "Body", name: "Onda/Type/Body", size: 15, weight: 400, lineHeight: 22 }),
      Object.freeze({ role: "Body Strong", name: "Onda/Type/Body Strong", size: 15, weight: 700, lineHeight: 22 }),
      Object.freeze({ role: "Caption", name: "Onda/Type/Caption", size: 12, weight: 500, lineHeight: 16 })
    ]),
    effectStyles: Object.freeze(["Onda/Shadow/Overlay"])
  });
  var ANNOTATION_VIEW_NAMES = Object.freeze([
    "Open",
    "Accept \xB7 Undo",
    "Reject \xB7 Scope",
    "Error \xB7 Retry",
    "Responsive \xB7 320 px",
    "Dark"
  ]);
  function annotationViews(definition2) {
    const acceptDetail = definition2.operation ? `\xDCbernehmen mit ${definition2.operation} \xB7 R\xFCckg\xE4ngig bleibt verf\xFCgbar` : "Nicht verf\xFCgbar: keine automatische Textoperation \xB7 nur als redaktioneller Hinweis behandeln";
    return ANNOTATION_VIEW_NAMES.map((name) => Object.freeze({
      name,
      detail: name === "Open" ? `Offen \xB7 ${definition2.form} \xB7 G\xFCltigkeit: ${definition2.scope}` : name === "Accept \xB7 Undo" ? acceptDetail : name === "Reject \xB7 Scope" ? `Ablehnen \xB7 G\xFCltigkeit w\xE4hlen: nur hier / Dokument / pers\xF6nlich` : name === "Error \xB7 Retry" ? "Fehler \xB7 Erneut versuchen \xB7 Eingabe bleibt erhalten" : name === "Responsive \xB7 320 px" ? "Schmale Ansicht \xB7 320 px \xB7 Aktionen umbrechen lesbar" : "Dunkle Referenz \xB7 Status zus\xE4tzlich durch Text, Symbol und Linie"
    }));
  }
  var ANNOTATION_SECTIONS = Object.freeze(ALL_ANNOTATION_KINDS.map((kind, index) => {
    const definition2 = ANNOTATION_DEFINITIONS[kind];
    const isText = TEXT_ANNOTATION_KINDS.includes(kind);
    const localIndex = isText ? index + 1 : index - TEXT_ANNOTATION_KINDS.length + 1;
    const group = isText ? "05" : "06";
    return Object.freeze(__spreadProps(__spreadValues({}, definition2), {
      sectionName: `${group}.${String(localIndex).padStart(2, "0")} \xB7 ${definition2.label}`,
      views: Object.freeze(annotationViews(definition2))
    }));
  }));
  var DIALOG_FAMILIES = Object.freeze([
    Object.freeze({ name: "Projektverst\xE4ndnis", states: Object.freeze([
      "Leer \xB7 noch ungekl\xE4rt",
      "Ausgef\xFCllter Stand",
      "Gesch\xFCtzte Nutzerkorrektur",
      "Aktive R\xFCckfrage \xB7 Interview",
      "Offline \xB7 Wiederherstellung"
    ]) }),
    Object.freeze({ name: "Quellen im Projekt", states: Object.freeze([
      "Leere Bibliothek",
      "Gef\xFCllte Quellenliste",
      "Quellenimport",
      "Validierungsfehler beim Import",
      "Quellenleser \xB7 Original verifiziert",
      "Quelle nicht belastbar \xB7 neu pr\xFCfen",
      "Recherche geplant",
      "Recherche l\xE4uft",
      "Recherche pausiert",
      "Recherche zur Pr\xFCfung bereit",
      "Recherche fehlgeschlagen"
    ]) }),
    Object.freeze({ name: "KI-Anschluss", states: Object.freeze([
      "Verbindung wird gepr\xFCft",
      "Schl\xFCssel fehlt",
      "Schl\xFCssel hinterlegt \xB7 Verbindung bereit",
      "Verbindungsfehler \xB7 Wiederholung oder Einrichtung",
      "Monatsbudget normal",
      "Monatsbudget erreicht",
      "Einzellauf bewusst freigegeben"
    ]) }),
    Object.freeze({ name: "Projektged\xE4chtnis", states: Object.freeze([
      "Deaktiviert",
      "Leer",
      "Gef\xFCllt",
      "Freigabe ausstehend",
      "Export",
      "L\xF6schbest\xE4tigung",
      "Wiederaufbau",
      "Fehler \xB7 R\xFCckkehr m\xF6glich"
    ]) }),
    Object.freeze({ name: "Argumentationsdossier", states: Object.freeze([
      "Noch nicht gepr\xFCft",
      "Pr\xFCfung l\xE4uft",
      "Gef\xFClltes Dossier",
      "Aussage einordnen",
      "Veraltet \xB7 Neupr\xFCfung n\xF6tig",
      "Fehler \xB7 Wiederholung"
    ]) }),
    Object.freeze({ name: "Sprache & Wirkung", states: Object.freeze([
      "Ausgangslage",
      "Sprachprofil",
      "Ausgef\xFCllte Analyse",
      "Wirkungsvergleich",
      "Korrektur \xB7 erneute Pr\xFCfung",
      "Fehler \xB7 Wiederholung"
    ]) }),
    Object.freeze({ name: "Schlussaudit & Export", states: Object.freeze([
      "Export blockiert \xB7 offene Hinweise",
      "Wissenschaftliche Risiken bewusst angenommen",
      "Audit bereit",
      "Exportformat w\xE4hlen",
      "Datenkontrolle",
      "Lokale Datenl\xF6schung best\xE4tigen"
    ]) })
  ]);
  var COMPONENT_DEFINITIONS = Object.freeze([
    Object.freeze({ id: "button", name: "Onda/Button", label: "Button", tier: 0 }),
    Object.freeze({ id: "icon-button", name: "Onda/Icon Button", label: "Icon Button", tier: 0 }),
    Object.freeze({ id: "status-symbol", name: "Onda/Status Symbol", label: "Status Symbol", tier: 0 }),
    Object.freeze({ id: "tag", name: "Onda/Tag", label: "Tag", tier: 0 }),
    Object.freeze({ id: "field", name: "Onda/Field", label: "Field", tier: 1 }),
    Object.freeze({ id: "menu-item", name: "Onda/Menu Item", label: "Menu Item", tier: 1 }),
    Object.freeze({ id: "annotation-anchor", name: "Onda/Annotation Anchor", label: "Annotation Anchor", tier: 1 }),
    Object.freeze({ id: "annotation-card", name: "Onda/Annotation Card", label: "Annotation Card", tier: 2 }),
    Object.freeze({ id: "source-card", name: "Onda/Source Card", label: "Source Card", tier: 2 }),
    Object.freeze({ id: "dialog", name: "Onda/Dialog", label: "Dialog", tier: 2 })
  ]);
  var fixedSections = [
    Object.freeze({ name: "00 \xB7 \xDCbersicht", kind: "overview" }),
    Object.freeze({ name: "01 \xB7 Foundations", kind: "foundations" }),
    Object.freeze({ name: "02 \xB7 Komponenten", kind: "components" }),
    Object.freeze({ name: "03 \xB7 Bibliothek", kind: "library" }),
    Object.freeze({ name: "04 \xB7 Editor", kind: "editor" })
  ];
  var tailSections = [
    Object.freeze({ name: "07 \xB7 Agent & Quellen", kind: "agent-sources" }),
    Object.freeze({ name: "08 \xB7 Dialoge", kind: "dialogs" }),
    Object.freeze({ name: "09 \xB7 Men\xFCs & Nebenansichten", kind: "menus" }),
    Object.freeze({ name: "10 \xB7 Responsive & Dark", kind: "responsive-dark" }),
    Object.freeze({ name: "11 \xB7 Prototyp", kind: "prototype" })
  ];
  var SECTION_DEFINITIONS = Object.freeze([
    ...fixedSections,
    ...ANNOTATION_SECTIONS.map((annotation) => Object.freeze({
      name: annotation.sectionName,
      kind: "annotation",
      annotationKind: annotation.kind
    })),
    ...tailSections
  ]);
  var componentCommands = COMPONENT_DEFINITIONS.map((component) => Object.freeze({
    id: `component-${component.id}`,
    label: component.label,
    kind: "component",
    componentId: component.id
  }));
  var PHASE_DEFINITIONS = Object.freeze([
    Object.freeze({ id: "inspect", label: "Inspect", commands: Object.freeze([{ id: "inspect", label: "Inspect", kind: "read" }]) }),
    Object.freeze({ id: "foundations", label: "Foundations", commands: Object.freeze([{ id: "foundations", label: "Foundations erzeugen", kind: "mutation" }]) }),
    Object.freeze({ id: "components", label: "Komponenten", commands: Object.freeze(componentCommands) }),
    Object.freeze({ id: "core", label: "Kernansichten", commands: Object.freeze([{ id: "core-views", label: "Kernansichten erzeugen", kind: "mutation" }]) }),
    Object.freeze({ id: "annotations", label: "Annotation-Batches", commands: Object.freeze(Array.from({ length: 6 }, (_, index) => ({
      id: `annotations-${index + 1}`,
      label: `Batch ${index + 1}`,
      kind: "annotation-batch",
      batchIndex: index
    }))) }),
    Object.freeze({ id: "dialogs", label: "Dialoge & Nebenansichten", commands: Object.freeze([{ id: "dialogs-and-secondary", label: "Dialoge & Nebenansichten erzeugen", kind: "mutation" }]) }),
    Object.freeze({ id: "verify", label: "Verify", commands: Object.freeze([{ id: "verify", label: "Verify", kind: "read" }]) })
  ]);
  function annotationBatch(batchIndex) {
    const start = batchIndex * 5;
    return ANNOTATION_SECTIONS.slice(start, start + 5);
  }

  // src/plan.mjs
  function buildDesignPlan() {
    return {
      sections: SECTION_DEFINITIONS,
      annotations: ANNOTATION_SECTIONS,
      dialogs: DIALOG_FAMILIES,
      components: COMPONENT_DEFINITIONS,
      phases: PHASE_DEFINITIONS,
      palette: PALETTE,
      radii: RADIUS_TOKENS,
      typography: { family: "ABC Diatype", sizes: TYPE_SCALE, weights: TYPE_WEIGHTS }
    };
  }
  function validateDesignPlan(plan) {
    const errors = [];
    const names = plan.sections.map((section) => section.name);
    if (names.length !== 39) errors.push(`Expected 39 sections, got ${names.length}`);
    if (new Set(names).size !== names.length) errors.push("Section names must be unique");
    if (plan.annotations.length !== 29) errors.push(`Expected 29 annotations, got ${plan.annotations.length}`);
    if (plan.dialogs.length !== 7) errors.push(`Expected 7 dialog families, got ${plan.dialogs.length}`);
    if (plan.annotations.some((annotation) => annotation.views.length !== 6)) errors.push("Every annotation needs six views");
    if (Object.values(plan.palette).some((color2) => !isGrayColor(color2))) errors.push("Palette contains a non-gray color");
    if (plan.radii.some((radius) => !isValidRadius(radius.value, radius.geometry))) errors.push("Radius policy is invalid");
    return errors;
  }
  function computeOndaOrigin(children, persistedOrigin) {
    if (Number.isFinite(persistedOrigin)) return persistedOrigin;
    function furthestRight(node) {
      const own = (node == null ? void 0 : node.absoluteRenderBounds) ? Number(node.absoluteRenderBounds.x || 0) + Number(node.absoluteRenderBounds.width || 0) : Number((node == null ? void 0 : node.x) || 0) + Number((node == null ? void 0 : node.width) || 0);
      return Math.max(own, ...((node == null ? void 0 : node.children) || []).map(furthestRight));
    }
    const maxExistingRight = Math.max(0, ...children.map(furthestRight));
    return Math.ceil((maxExistingRight + 2e3) / 100) * 100;
  }
  function validateTargetContext({ fileKey, documentName, pageName }) {
    if (pageName !== TARGET_PAGE_NAME) {
      return { ok: false, fallback: !fileKey, warning: `Falsche Seite: erwartet \u201E${TARGET_PAGE_NAME}\u201C.` };
    }
    if (fileKey) {
      return fileKey === TARGET_FILE_KEY ? { ok: true, fallback: false, warning: "" } : { ok: false, fallback: false, warning: "Falsche Figma-Datei: der Dateischl\xFCssel stimmt nicht mit \u201EClaude Code\u201C \xFCberein." };
    }
    if (documentName !== TARGET_DOCUMENT_NAME) {
      return { ok: false, fallback: true, warning: `Dateischl\xFCssel nicht verf\xFCgbar und Dokumentname ist nicht \u201E${TARGET_DOCUMENT_NAME}\u201C.` };
    }
    return {
      ok: false,
      readOnlyOk: true,
      fallback: true,
      warning: "Dateischl\xFCssel nicht verf\xFCgbar. \u201EClaude Code\u201C und \u201EPage 1\u201C sind nur ein Lesehinweis; Inspect bleibt read-only und Mutationen sind deaktiviert."
    };
  }
  function authorizeMutation(target) {
    return (target == null ? void 0 : target.ok) && !target.fallback ? { ok: true, manual: false, warning: "" } : { ok: false, manual: false, warning: (target == null ? void 0 : target.warning) || "Mutation erfordert den exakten privaten Dateischl\xFCssel." };
  }
  function canReuseOwnedNode(node, baselineIds = /* @__PURE__ */ new Set()) {
    return (node == null ? void 0 : node.owner) === PLUGIN_ORIGIN && (!baselineIds.has(node.id) || node.owner === PLUGIN_ORIGIN);
  }
  function selectOwnedEntity(entities, name, kind) {
    const matching = entities.filter((entity) => entity.name === name);
    if (matching.length > 1) throw new Error(`Mehrdeutige ${kind}-Namenskollision: ${name}`);
    if (!matching.length) return null;
    if (matching[0].owner !== PLUGIN_ORIGIN) throw new Error(`Ungesch\xFCtzte ${kind}-Namenskollision: ${name}`);
    return matching[0];
  }
  function foundationSwatchLabelToken(layer, paintToken) {
    const paint = PALETTE[paintToken];
    if (!paint) throw new Error(`Unbekannter Foundation-Farbwert: ${paintToken}`);
    const darkSemantic = layer === "semantic-dark";
    const collectionName = darkSemantic ? "Onda \xB7 Semantic \xB7 Dark" : "Onda \xB7 Semantic \xB7 Light";
    const darkPaint = paint.r < 0.55;
    return {
      collectionName,
      variableName: darkSemantic === darkPaint ? "color/text" : "color/on-inverted"
    };
  }
  function foundationTokenSlug(value) {
    return value.replaceAll(" \xB7 ", "-").replaceAll("/", "-").replaceAll(" ", "-").toLowerCase();
  }
  function foundationCodeSyntax(collectionName, variableName) {
    const prefix = {
      "Onda \xB7 Primitive": "primitive",
      "Onda \xB7 Dimension": "dimension",
      "Onda \xB7 Semantic \xB7 Light": "semantic-light",
      "Onda \xB7 Semantic \xB7 Dark": "semantic-dark",
      "Onda \xB7 Typography": "typography"
    }[collectionName];
    if (!prefix) throw new Error(`Unbekannte Foundation-Collection: ${collectionName}`);
    return `var(--${prefix}-${foundationTokenSlug(variableName)})`;
  }
  function foundationVariableDefinitions() {
    const definitions = [];
    function add(collectionName, modeName, name, resolvedType, scopes, value) {
      definitions.push({
        collectionName,
        modeName,
        name,
        resolvedType,
        scopes: [...scopes],
        codeSyntax: foundationCodeSyntax(collectionName, name),
        value
      });
    }
    for (const [name, value] of Object.entries(PALETTE)) add("Onda \xB7 Primitive", "Value", name, "COLOR", [], value);
    for (const role of SEMANTIC_COLOR_ROLES) {
      add("Onda \xB7 Semantic \xB7 Light", "Light", role.name, "COLOR", role.scopes, { alias: ["Onda \xB7 Primitive", role.light] });
      add("Onda \xB7 Semantic \xB7 Dark", "Dark", role.name, "COLOR", role.scopes, { alias: ["Onda \xB7 Primitive", role.dark] });
    }
    for (const token of SPACING_TOKENS) add("Onda \xB7 Dimension", "Value", token.name, "FLOAT", ["GAP"], token.value);
    for (const token of RADIUS_TOKENS) add("Onda \xB7 Dimension", "Value", token.name, "FLOAT", ["CORNER_RADIUS"], token.value);
    for (const scale of TYPE_SCALE) add("Onda \xB7 Typography", "Value", `font-size/${scale.size}`, "FLOAT", ["FONT_SIZE"], scale.size);
    for (const weight of TYPE_WEIGHTS) add("Onda \xB7 Typography", "Value", `font-weight/${weight}`, "FLOAT", ["FONT_WEIGHT"], weight);
    return definitions;
  }
  function collectVariableBindingIds(binding) {
    if (Array.isArray(binding)) return binding.flatMap(collectVariableBindingIds);
    return binding && typeof binding.id === "string" ? [binding.id] : [];
  }
  function collectVisibleFillBindings(fills) {
    if (!Array.isArray(fills)) return [];
    return fills.flatMap((paint, index) => {
      var _a;
      return (paint == null ? void 0 : paint.visible) === false ? [] : [{
        index,
        type: (paint == null ? void 0 : paint.type) || null,
        variableIds: collectVariableBindingIds((_a = paint == null ? void 0 : paint.boundVariables) == null ? void 0 : _a.color)
      }];
    });
  }
  function collectFieldVariableIds(entity, fields) {
    return Object.fromEntries(fields.map((field) => {
      var _a;
      return [field, collectVariableBindingIds((_a = entity == null ? void 0 : entity.boundVariables) == null ? void 0 : _a[field])];
    }));
  }
  function collectTextRangeBindings(textNode2) {
    if (!textNode2 || typeof textNode2.getStyledTextSegments !== "function") return [];
    return textNode2.getStyledTextSegments(["fills"]).map((segment) => ({
      start: segment.start,
      end: segment.end,
      fills: collectVisibleFillBindings(segment.fills)
    }));
  }
  function validateFoundationMutationInventory(inventory = {}) {
    var _a;
    const errors = [];
    const collections = Array.isArray(inventory.collections) ? inventory.collections : [];
    const variables = Array.isArray(inventory.variables) ? inventory.variables : [];
    const textStyles = Array.isArray(inventory.textStyles) ? inventory.textStyles : [];
    const effectStyles = Array.isArray(inventory.effectStyles) ? inventory.effectStyles : [];
    const collectionExpectations = FOUNDATION_EXPECTATIONS.collections;
    const expectedCollectionNames = new Set(Object.keys(collectionExpectations));
    const namespaceCollections = collections.filter((collection) => collection.name.startsWith("Onda \xB7"));
    const collectionByName = /* @__PURE__ */ new Map();
    for (const collection of namespaceCollections) {
      if (!expectedCollectionNames.has(collection.name)) errors.push(`Unerwartete Onda-Collection: ${collection.name}`);
    }
    for (const [name, expectation] of Object.entries(collectionExpectations)) {
      const matching = collections.filter((collection2) => collection2.name === name);
      if (matching.length > 1) errors.push(`Doppelte Onda-Collection: ${name}`);
      if (matching.length !== 1) continue;
      const collection = matching[0];
      collectionByName.set(name, collection);
      if (collection.owner !== PLUGIN_ORIGIN) errors.push(`Ungesch\xFCtzte Onda-Collection: ${name}`);
      if (!Array.isArray(collection.modes) || collection.modes.length !== 1 || collection.modes[0].name !== expectation.mode) errors.push(`Ung\xFCltige Modi: ${name}`);
    }
    if (new Set(namespaceCollections.map((collection) => collection.id)).size !== namespaceCollections.length) errors.push("Doppelte Onda-Collection-IDs");
    const definitions = foundationVariableDefinitions();
    const definitionByKey = new Map(definitions.map((definition2) => [`${definition2.collectionName}\0${definition2.name}`, definition2]));
    const expectedCollectionIds = new Set([...collectionByName.values()].map((collection) => collection.id));
    const relevantVariables = variables.filter((variable) => variable.owner === PLUGIN_ORIGIN || expectedCollectionIds.has(variable.collectionId) || expectedCollectionNames.has(variable.collectionName));
    const keys = [];
    for (const variable of relevantVariables) {
      const collection = collectionByName.get(variable.collectionName);
      const key = `${variable.collectionName}\0${variable.name}`;
      const definition2 = definitionByKey.get(key);
      keys.push(key);
      if (!collection || variable.collectionId !== collection.id) errors.push(`Falsche Collection-Zuordnung: ${variable.name}`);
      if (!definition2) errors.push(`Unerwartete Variable in Onda-Inventar: ${variable.collectionName}/${variable.name}`);
      if (variable.owner !== PLUGIN_ORIGIN) errors.push(`Ungesch\xFCtzte Onda-Variable: ${variable.collectionName}/${variable.name}`);
      if (!definition2) continue;
      if (variable.resolvedType !== definition2.resolvedType) errors.push(`Falscher Variablentyp: ${variable.collectionName}/${variable.name}`);
      if (!sameArray([...variable.scopes || []].sort(), [...definition2.scopes].sort())) errors.push(`Falsche Scopes: ${variable.collectionName}/${variable.name}`);
      if (((_a = collection == null ? void 0 : collection.modes) == null ? void 0 : _a.length) === 1 && variable.modeId !== collection.modes[0].modeId) errors.push(`Falscher Variablenmodus: ${variable.collectionName}/${variable.name}`);
    }
    if (new Set(keys).size !== keys.length) errors.push("Doppelte Onda-Variablen");
    function validateStyleNamespace(styles, prefix, expectedNames, kind) {
      const namespace = styles.filter((style) => style.name.startsWith(prefix));
      for (const style of namespace) {
        if (!expectedNames.has(style.name)) errors.push(`Unerwarteter ${kind}: ${style.name}`);
        if (style.owner !== PLUGIN_ORIGIN) errors.push(`Ungesch\xFCtzter ${kind}: ${style.name}`);
      }
      const names = namespace.map((style) => style.name);
      if (new Set(names).size !== names.length) errors.push(`Doppelte ${kind}`);
    }
    validateStyleNamespace(textStyles, "Onda/Type/", new Set(FOUNDATION_EXPECTATIONS.textStyles.map((style) => style.name)), "TextStyle");
    validateStyleNamespace(effectStyles, "Onda/Shadow/", new Set(FOUNDATION_EXPECTATIONS.effectStyles), "EffectStyle");
    return { valid: errors.length === 0, errors };
  }
  async function executeFoundationMutation({ preflight, requireContext, mutate }) {
    await preflight();
    const context = await requireContext();
    return mutate(context);
  }
  function sameArray(actual, expected) {
    return Array.isArray(actual) && actual.length === expected.length && actual.every((value, index) => value === expected[index]);
  }
  function sameObject(actual, expected) {
    if (!actual || typeof actual !== "object" || Array.isArray(actual)) return false;
    const actualKeys = Object.keys(actual).sort();
    const expectedKeys = Object.keys(expected).sort();
    return sameArray(actualKeys, expectedKeys) && actualKeys.every((key) => {
      const left = actual[key];
      const right = expected[key];
      return right && typeof right === "object" ? sameObject(left, right) : left === right;
    });
  }
  function exactFillBindings(actual, variableIds) {
    var _a, _b, _c;
    return Array.isArray(actual) && actual.length === 1 && ((_a = actual[0]) == null ? void 0 : _a.index) === 0 && ((_b = actual[0]) == null ? void 0 : _b.type) === "SOLID" && sameArray((_c = actual[0]) == null ? void 0 : _c.variableIds, variableIds);
  }
  function exactTextRangeBindings(actual, charactersLength, variableIds) {
    var _a, _b, _c;
    return Array.isArray(actual) && actual.length === 1 && ((_a = actual[0]) == null ? void 0 : _a.start) === 0 && ((_b = actual[0]) == null ? void 0 : _b.end) === charactersLength && exactFillBindings((_c = actual[0]) == null ? void 0 : _c.fills, variableIds);
  }
  function strictSingle(items, predicate, errors, label) {
    const matching = items.filter(predicate);
    if (matching.length !== 1) errors.push(`${label}: erwartet 1, gefunden ${matching.length}`);
    return matching.length === 1 ? matching[0] : null;
  }
  function validateFoundationEvidence(evidence = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u;
    const errors = [];
    const collections = Array.isArray(evidence.collections) ? evidence.collections : [];
    const variables = Array.isArray(evidence.variables) ? evidence.variables : [];
    const expectedCollections = Object.entries(FOUNDATION_EXPECTATIONS.collections);
    if (collections.length !== expectedCollections.length) errors.push(`Collections: erwartet ${expectedCollections.length}, gefunden ${collections.length}`);
    const collectionByName = /* @__PURE__ */ new Map();
    for (const [name, expectation] of expectedCollections) {
      const collection = strictSingle(collections, (item) => item.name === name, errors, `Collection ${name}`);
      if (!collection) continue;
      collectionByName.set(name, collection);
      if (collection.owner !== PLUGIN_ORIGIN) errors.push(`Collection ${name}: owner`);
      if (!Array.isArray(collection.modes) || collection.modes.length !== 1 || collection.modes[0].name !== expectation.mode) errors.push(`Collection ${name}: mode`);
    }
    if (new Set(collections.map((item) => item.id)).size !== collections.length) errors.push("Collections: duplicate ids");
    const definitions = foundationVariableDefinitions();
    if (variables.length !== definitions.length) errors.push(`Variables: erwartet ${definitions.length}, gefunden ${variables.length}`);
    if (new Set(variables.map((item) => item.id)).size !== variables.length) errors.push("Variables: duplicate ids");
    const variableByKey = /* @__PURE__ */ new Map();
    for (const definition2 of definitions) {
      const key = `${definition2.collectionName}\0${definition2.name}`;
      const variable = strictSingle(variables, (item) => `${item.collectionName}\0${item.name}` === key, errors, `Variable ${definition2.collectionName}/${definition2.name}`);
      if (!variable) continue;
      variableByKey.set(key, variable);
      const collection = collectionByName.get(definition2.collectionName);
      if (variable.collectionId !== (collection == null ? void 0 : collection.id)) errors.push(`Variable ${key}: collection id`);
      if (variable.owner !== PLUGIN_ORIGIN) errors.push(`Variable ${key}: owner`);
      if (variable.resolvedType !== definition2.resolvedType) errors.push(`Variable ${key}: type`);
      if (!sameArray([...variable.scopes || []].sort(), [...definition2.scopes].sort())) errors.push(`Variable ${key}: scopes`);
      if (((_a = variable.codeSyntax) == null ? void 0 : _a.WEB) !== definition2.codeSyntax) errors.push(`Variable ${key}: code syntax`);
      if (variable.modeId !== ((_c = (_b = collection == null ? void 0 : collection.modes) == null ? void 0 : _b[0]) == null ? void 0 : _c.modeId)) errors.push(`Variable ${key}: mode id`);
      if ((_d = definition2.value) == null ? void 0 : _d.alias) {
        const aliasKey = `${definition2.value.alias[0]}\0${definition2.value.alias[1]}`;
        const expectedAlias = variables.find((item) => `${item.collectionName}\0${item.name}` === aliasKey);
        if (((_e = variable.value) == null ? void 0 : _e.type) !== "VARIABLE_ALIAS" || variable.value.id !== (expectedAlias == null ? void 0 : expectedAlias.id)) errors.push(`Variable ${key}: alias`);
      } else if (typeof definition2.value === "object") {
        if (!sameObject(variable.value, definition2.value)) errors.push(`Variable ${key}: value`);
      } else if (variable.value !== definition2.value) errors.push(`Variable ${key}: value`);
    }
    function variableId(collectionName, name) {
      var _a2;
      return (_a2 = variableByKey.get(`${collectionName}\0${name}`)) == null ? void 0 : _a2.id;
    }
    const expectedSwatches = [];
    for (const name of Object.keys(PALETTE)) {
      const labelToken = foundationSwatchLabelToken("primitive", name);
      expectedSwatches.push({
        name: `Swatch / ${name}`,
        parentName: "Foundations / Graustufen",
        variableId: variableId("Onda \xB7 Primitive", name),
        labelName: `Swatch / ${name} / Label`,
        labelVariableId: variableId(labelToken.collectionName, labelToken.variableName)
      });
    }
    for (const [collectionName, layer, valueKey, parentName] of [
      ["Onda \xB7 Semantic \xB7 Light", "semantic-light", "light", "Foundations / Semantic Light"],
      ["Onda \xB7 Semantic \xB7 Dark", "semantic-dark", "dark", "Foundations / Semantic Dark"]
    ]) {
      for (const role of SEMANTIC_COLOR_ROLES) {
        const name = `Swatch / ${layer} / ${role.name}`;
        const labelToken = foundationSwatchLabelToken(layer, role[valueKey]);
        expectedSwatches.push({
          name,
          parentName,
          variableId: variableId(collectionName, role.name),
          labelName: `${name} / Label`,
          labelVariableId: variableId(labelToken.collectionName, labelToken.variableName)
        });
      }
    }
    const swatches = Array.isArray(evidence.swatches) ? evidence.swatches : [];
    if (swatches.length !== expectedSwatches.length) errors.push(`Swatches: erwartet ${expectedSwatches.length}, gefunden ${swatches.length}`);
    if (new Set(swatches.map((item) => item.nodeId)).size !== swatches.length) errors.push("Swatches: duplicate node ids");
    for (const expected of expectedSwatches) {
      const swatch = strictSingle(swatches, (item) => item.name === expected.name, errors, `Swatch ${expected.name}`);
      if (!swatch) continue;
      if (swatch.type !== "FRAME" || swatch.parentName !== expected.parentName) errors.push(`Swatch ${expected.name}: structure`);
      if (!exactFillBindings(swatch.fills, [expected.variableId])) errors.push(`Swatch ${expected.name}: fill binding`);
      if (swatch.labelName !== expected.labelName || !exactFillBindings(swatch.labelFills, [expected.labelVariableId]) || !exactTextRangeBindings(swatch.labelTextRanges, swatch.labelCharactersLength, [expected.labelVariableId])) errors.push(`Swatch ${expected.name}: label binding`);
    }
    const spacingBars = Array.isArray(evidence.spacingBars) ? evidence.spacingBars : [];
    if (spacingBars.length !== SPACING_TOKENS.length) errors.push(`Spacing: erwartet ${SPACING_TOKENS.length}, gefunden ${spacingBars.length}`);
    if (new Set(spacingBars.map((item) => item.nodeId)).size !== spacingBars.length) errors.push("Spacing: duplicate node ids");
    for (const token of SPACING_TOKENS) {
      const name = `Spacing Bar / ${token.value}`;
      const bar = strictSingle(spacingBars, (item) => item.name === name, errors, `Spacing ${name}`);
      if (!bar) continue;
      if (bar.type !== "RECTANGLE" || bar.parentName !== `Spacing / ${token.value}` || bar.containerName !== "Foundations / Spacing") errors.push(`Spacing ${name}: structure`);
      if (bar.width !== token.value) errors.push(`Spacing ${name}: value`);
      if (!exactFillBindings(bar.fills, [])) errors.push(`Spacing ${name}: fills`);
      if (!sameArray((_f = bar.fieldVariableIds) == null ? void 0 : _f.width, [variableId("Onda \xB7 Dimension", token.name)])) errors.push(`Spacing ${name}: binding`);
    }
    const radiusSamples = Array.isArray(evidence.radiusSamples) ? evidence.radiusSamples : [];
    if (radiusSamples.length !== RADIUS_TOKENS.length) errors.push(`Radius: erwartet ${RADIUS_TOKENS.length}, gefunden ${radiusSamples.length}`);
    if (new Set(radiusSamples.map((item) => item.nodeId)).size !== radiusSamples.length) errors.push("Radius: duplicate node ids");
    for (const token of RADIUS_TOKENS) {
      const name = `Radius / ${token.value}`;
      const sample = strictSingle(radiusSamples, (item) => item.name === name, errors, `Radius ${name}`);
      if (!sample) continue;
      const tokenId = variableId("Onda \xB7 Dimension", token.name);
      if (sample.type !== token.geometry || sample.parentName !== "Foundations / Radien") errors.push(`Radius ${name}: structure`);
      if (!exactFillBindings(sample.fills, [])) errors.push(`Radius ${name}: fills`);
      if (token.geometry === "ELLIPSE") {
        if (sample.width !== 112 || sample.height !== 112 || !sameArray((_g = sample.fieldVariableIds) == null ? void 0 : _g.maxWidth, [tokenId]) || !sameArray((_h = sample.fieldVariableIds) == null ? void 0 : _h.maxHeight, [tokenId])) errors.push(`Radius ${name}: ellipse mapping`);
      } else {
        const fields = ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"];
        if (sample.cornerRadius !== token.value || !fields.every((field) => {
          var _a2;
          return sameArray((_a2 = sample.fieldVariableIds) == null ? void 0 : _a2[field], [tokenId]);
        })) errors.push(`Radius ${name}: rectangle binding`);
      }
    }
    const textStyles = Array.isArray(evidence.textStyles) ? evidence.textStyles : [];
    const textSpecimens = Array.isArray(evidence.textSpecimens) ? evidence.textSpecimens : [];
    if (textStyles.length !== FOUNDATION_EXPECTATIONS.textStyles.length) errors.push(`Text styles: erwartet ${FOUNDATION_EXPECTATIONS.textStyles.length}, gefunden ${textStyles.length}`);
    if (textSpecimens.length !== FOUNDATION_EXPECTATIONS.textStyles.length) errors.push(`Text specimens: erwartet ${FOUNDATION_EXPECTATIONS.textStyles.length}, gefunden ${textSpecimens.length}`);
    if (new Set(textStyles.map((item) => item.id)).size !== textStyles.length) errors.push("Text styles: duplicate ids");
    if (new Set(textSpecimens.map((item) => item.nodeId)).size !== textSpecimens.length) errors.push("Text specimens: duplicate ids");
    for (const definition2 of FOUNDATION_EXPECTATIONS.textStyles) {
      const style = strictSingle(textStyles, (item) => item.name === definition2.name, errors, `Text style ${definition2.name}`);
      const specimen = strictSingle(textSpecimens, (item) => item.name === `Typografie / ${definition2.role}`, errors, `Text specimen ${definition2.role}`);
      if (!style) continue;
      const sizeId = variableId("Onda \xB7 Typography", `font-size/${definition2.size}`);
      const weightId = variableId("Onda \xB7 Typography", `font-weight/${definition2.weight}`);
      if (style.owner !== PLUGIN_ORIGIN) errors.push(`Text style ${definition2.name}: owner`);
      if (((_i = style.fontName) == null ? void 0 : _i.family) !== ((_j = evidence.fontDecision) == null ? void 0 : _j.family) || ((_k = style.fontName) == null ? void 0 : _k.style) !== ((_m = (_l = evidence.fontDecision) == null ? void 0 : _l.styles) == null ? void 0 : _m[definition2.weight])) errors.push(`Text style ${definition2.name}: font`);
      if (style.fontSize !== definition2.size || ((_n = style.lineHeight) == null ? void 0 : _n.unit) !== "PIXELS" || ((_o = style.lineHeight) == null ? void 0 : _o.value) !== definition2.lineHeight) errors.push(`Text style ${definition2.name}: metrics`);
      if (((_p = style.letterSpacing) == null ? void 0 : _p.unit) !== "PIXELS" || ((_q = style.letterSpacing) == null ? void 0 : _q.value) !== 0 || style.textCase !== "ORIGINAL" || style.textDecoration !== "NONE") errors.push(`Text style ${definition2.name}: properties`);
      if (!sameArray((_r = style.fieldVariableIds) == null ? void 0 : _r.fontSize, [sizeId]) || !sameArray((_s = style.fieldVariableIds) == null ? void 0 : _s.fontWeight, [weightId])) errors.push(`Text style ${definition2.name}: variable mapping`);
      const textVariableId = variableId("Onda \xB7 Semantic \xB7 Light", "color/text");
      if (specimen && (specimen.type !== "TEXT" || specimen.parentName !== "Foundations / Typografie" || specimen.textStyleId !== style.id || !sameArray((_t = specimen.fieldVariableIds) == null ? void 0 : _t.fontSize, [sizeId]) || !sameArray((_u = specimen.fieldVariableIds) == null ? void 0 : _u.fontWeight, [weightId]) || !exactFillBindings(specimen.fills, [textVariableId]) || !exactTextRangeBindings(specimen.textRanges, specimen.charactersLength, [textVariableId]))) errors.push(`Text specimen ${definition2.role}: link`);
    }
    const effectStyles = Array.isArray(evidence.effectStyles) ? evidence.effectStyles : [];
    const effectConsumers = Array.isArray(evidence.effectConsumers) ? evidence.effectConsumers : [];
    if (effectStyles.length !== 1) errors.push(`Effect styles: erwartet 1, gefunden ${effectStyles.length}`);
    const overlay = strictSingle(effectStyles, (item) => item.name === "Onda/Shadow/Overlay", errors, "Overlay effect style");
    if (overlay) {
      if (overlay.owner !== PLUGIN_ORIGIN) errors.push("Overlay effect style: owner");
      const effect = Array.isArray(overlay.effects) && overlay.effects.length === 1 ? overlay.effects[0] : null;
      if (!effect || effect.type !== "DROP_SHADOW" || !sameObject(effect.color, { r: 0, g: 0, b: 0, a: 0.16 }) || !sameObject(effect.offset, { x: 0, y: 8 }) || effect.radius !== 24 || effect.spread !== 0 || effect.visible !== true || effect.blendMode !== "NORMAL") errors.push("Overlay effect style: properties");
      if (!effect || !isGrayColor(effect.color)) errors.push("Overlay effect style: monochrome");
      if (effectConsumers.length !== 1) errors.push(`Overlay consumers: erwartet 1, gefunden ${effectConsumers.length}`);
      const consumer = strictSingle(effectConsumers, (item) => item.name === "Effect / Onda/Shadow/Overlay", errors, "Overlay consumer");
      if (consumer && (consumer.type !== "FRAME" || consumer.parentName !== "Foundations / Effects" || consumer.effectStyleId !== overlay.id || !sameArray(consumer.fields, ["effectStyleId"]) || !exactFillBindings(consumer.fills, [variableId("Onda \xB7 Semantic \xB7 Light", "color/surface")]))) errors.push("Overlay consumer: invalid");
    }
    return { valid: errors.length === 0, errors };
  }
  function protectedChildIds({ nodeType, children, baselineIds = /* @__PURE__ */ new Set() }) {
    if (nodeType !== "PAGE") return children.map((child) => child.id);
    return children.filter((child) => baselineIds.has(child.id) || child.owner !== PLUGIN_ORIGIN).map((child) => child.id);
  }
  function isGrayColor(color2) {
    if (!color2 || ![color2.r, color2.g, color2.b].every(Number.isFinite)) return false;
    return Math.max(color2.r, color2.g, color2.b) - Math.min(color2.r, color2.g, color2.b) <= 2e-3 + 1e-9;
  }
  var FONT_STYLES = Object.freeze({
    400: Object.freeze(["Regular", "Book", "Normal"]),
    500: Object.freeze(["Medium"]),
    700: Object.freeze(["Bold"])
  });
  function stylesForFamily(fonts, family) {
    return new Set(fonts.filter((font) => font.fontName.family === family).map((font) => font.fontName.style));
  }
  function exactWeightStyles(fonts, family) {
    const available = stylesForFamily(fonts, family);
    const entries = TYPE_WEIGHTS.map((weight) => [weight, FONT_STYLES[weight].find((style) => available.has(style)) || null]);
    return Object.fromEntries(entries);
  }
  function selectFontDecision(fonts) {
    const abcStyles = exactWeightStyles(fonts, "ABC Diatype");
    const missingAbc = TYPE_WEIGHTS.filter((weight) => !abcStyles[weight]);
    if (!missingAbc.length) {
      return { requestedFamily: "ABC Diatype", family: "ABC Diatype", styles: abcStyles, exact: true, warning: "" };
    }
    const families = [...new Set(fonts.map((font) => font.fontName.family))];
    const fallbackFamily = ["Inter", ...families.filter((family) => family !== "ABC Diatype" && family !== "Inter")].find((family) => TYPE_WEIGHTS.every((weight) => exactWeightStyles(fonts, family)[weight]));
    if (!fallbackFamily) throw new Error(`Keine Schriftfamilie mit geeigneten Schnitten f\xFCr 400, 500 und 700 gefunden; ABC Diatype fehlt: ${missingAbc.join(", ")}.`);
    return {
      requestedFamily: "ABC Diatype",
      family: fallbackFamily,
      styles: exactWeightStyles(fonts, fallbackFamily),
      exact: false,
      warning: `ABC Diatype hat keine geeigneten Schnitte f\xFCr ${missingAbc.join(", ")}. Sichtbarer System-Fallback: ${fallbackFamily}.`
    };
  }
  function utf8ByteLength(value) {
    return unescape(encodeURIComponent(value)).length;
  }
  function buildBaselineShards(records, maxBytes = 79e3) {
    const shards = [];
    let current = [];
    for (const record of records) {
      const candidate = JSON.stringify([...current, record]);
      if (utf8ByteLength(candidate) >= maxBytes) {
        if (!current.length) throw new Error(`Ein Baseline-Datensatz \xFCberschreitet das Shard-Limit von ${maxBytes} Bytes.`);
        shards.push(JSON.stringify(current));
        current = [record];
        if (utf8ByteLength(JSON.stringify(current)) >= maxBytes) throw new Error(`Ein Baseline-Datensatz \xFCberschreitet das Shard-Limit von ${maxBytes} Bytes.`);
      } else current.push(record);
    }
    if (current.length || !shards.length) shards.push(JSON.stringify(current));
    return shards;
  }
  function restoreBaselineShards(shards) {
    return shards.flatMap((shard, index) => {
      const value = JSON.parse(shard);
      if (!Array.isArray(value)) throw new Error(`Baseline-Shard ${index} ist ung\xFCltig.`);
      return value;
    });
  }
  var REQUIRED_PHASES = Object.freeze([
    "inspect",
    "foundations",
    ...COMPONENT_DEFINITIONS.map((component) => `component-${component.id}`),
    "core-views",
    ...Array.from({ length: 6 }, (_, index) => `annotations-${index + 1}`),
    "dialogs-and-secondary"
  ]);
  function validatePhaseTransition(command, phases = {}) {
    var _a;
    if (command === "inspect") return { ok: true, expected: "inspect" };
    if (((_a = phases[command]) == null ? void 0 : _a.status) === "success" && REQUIRED_PHASES.includes(command)) {
      const index = REQUIRED_PHASES.indexOf(command);
      const prerequisitesComplete = REQUIRED_PHASES.slice(0, index).every((id) => {
        var _a2;
        return ((_a2 = phases[id]) == null ? void 0 : _a2.status) === "success";
      });
      if (prerequisitesComplete) return { ok: true, expected: command, replay: true };
    }
    const next = REQUIRED_PHASES.find((id) => {
      var _a2;
      return ((_a2 = phases[id]) == null ? void 0 : _a2.status) !== "success";
    });
    if (command === "verify") {
      return next ? { ok: false, expected: next, warning: `Vor Verify fehlt: ${next}.` } : { ok: true, expected: "verify" };
    }
    return command === next ? { ok: true, expected: next } : { ok: false, expected: next || "verify", warning: `Reihenfolge verletzt. Als N\xE4chstes: ${next || "verify"}.` };
  }
  function isValidRadius(value, geometry = "RECTANGLE") {
    if (![0, 4, 6, 8, 999].includes(value)) return false;
    return value !== 999 || geometry === "ELLIPSE";
  }
  function canonicalize(value) {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
    }
    return value;
  }
  function rotateRight(value, amount) {
    return value >>> amount | value << 32 - amount;
  }
  function sha256Hex(input) {
    const text = unescape(encodeURIComponent(String(input)));
    const words = [];
    for (let index = 0; index < text.length; index += 1) {
      words[index >> 2] = (words[index >> 2] || 0) | text.charCodeAt(index) << 24 - index % 4 * 8;
    }
    const bitLength = text.length * 8;
    words[bitLength >> 5] = (words[bitLength >> 5] || 0) | 128 << 24 - bitLength % 32;
    words[(bitLength + 64 >> 9 << 4) + 15] = bitLength;
    const constants = [];
    const initial = [];
    let prime = 2;
    while (constants.length < 64) {
      let isPrime = true;
      for (let factor = 2; factor * factor <= prime; factor += 1) {
        if (prime % factor === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) {
        if (initial.length < 8) initial.push(Math.sqrt(prime) % 1 * 4294967296 | 0);
        constants.push(Math.cbrt(prime) % 1 * 4294967296 | 0);
      }
      prime += 1;
    }
    const hash = initial.slice();
    for (let offset = 0; offset < words.length; offset += 16) {
      const schedule = new Array(64);
      for (let index = 0; index < 64; index += 1) {
        if (index < 16) schedule[index] = words[offset + index] | 0;
        else {
          const x = schedule[index - 15];
          const y = schedule[index - 2];
          const sigma0 = rotateRight(x, 7) ^ rotateRight(x, 18) ^ x >>> 3;
          const sigma1 = rotateRight(y, 17) ^ rotateRight(y, 19) ^ y >>> 10;
          schedule[index] = schedule[index - 16] + sigma0 + schedule[index - 7] + sigma1 | 0;
        }
      }
      let [a, b, c, d, e, f, g, h] = hash;
      for (let index = 0; index < 64; index += 1) {
        const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
        const choose = e & f ^ ~e & g;
        const temp1 = h + sum1 + choose + constants[index] + schedule[index] | 0;
        const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
        const majority = a & b ^ a & c ^ b & c;
        const temp2 = sum0 + majority | 0;
        h = g;
        g = f;
        f = e;
        e = d + temp1 | 0;
        d = c;
        c = b;
        b = a;
        a = temp1 + temp2 | 0;
      }
      hash[0] = hash[0] + a | 0;
      hash[1] = hash[1] + b | 0;
      hash[2] = hash[2] + c | 0;
      hash[3] = hash[3] + d | 0;
      hash[4] = hash[4] + e | 0;
      hash[5] = hash[5] + f | 0;
      hash[6] = hash[6] + g | 0;
      hash[7] = hash[7] + h | 0;
    }
    return hash.map((value) => (value >>> 0).toString(16).padStart(8, "0")).join("");
  }
  function hashBaselineRecords(records) {
    return sha256Hex(JSON.stringify(canonicalize(records)));
  }
  function orderRecordsByBaselineIds(records, baselineIds) {
    const byId = new Map(records.map((record) => [record.id, record]));
    return baselineIds.map((id) => byId.get(id)).filter(Boolean);
  }
  function duplicates(values) {
    const seen = /* @__PURE__ */ new Set();
    const repeated = /* @__PURE__ */ new Set();
    for (const value of values) {
      if (seen.has(value)) repeated.add(value);
      seen.add(value);
    }
    return [...repeated].sort();
  }
  function buildVerificationReport(snapshot) {
    var _a;
    const requiredNames = new Set(SECTION_DEFINITIONS.map((section) => section.name));
    const sections = snapshot.sections || (snapshot.sectionNames || []).map((name) => ({ name }));
    const sectionNames = sections.map((section) => section.name);
    const presentNames = new Set(sectionNames);
    const expectedAnnotationViews = new Set(ANNOTATION_SECTIONS.flatMap((annotation) => annotation.views.map((view) => `${annotation.kind}\0${view.name}`)));
    const presentAnnotationViews = new Set((snapshot.annotationViews || []).map((item) => `${item.kind}\0${item.view}`));
    const expectedDialogStates = new Set(DIALOG_FAMILIES.flatMap((family) => family.states.map((state) => `${family.name}\0${state}`)));
    const presentDialogStates = new Set((snapshot.dialogStates || []).map((item) => `${item.family}\0${item.state}`));
    const sectionStructureValid = sections.length === SECTION_DEFINITIONS.length && sections.every((section) => section.type === void 0 || section.type === "SECTION" && section.parentType === "PAGE" && section.parentName === TARGET_PAGE_NAME && section.owner === PLUGIN_ORIGIN);
    const componentSets = snapshot.componentSets || [];
    const expectedComponentIds = new Set(COMPONENT_DEFINITIONS.map((component) => component.id));
    const componentStructureValid = componentSets.length === COMPONENT_DEFINITIONS.length && new Set(componentSets.map((item) => item.id)).size === COMPONENT_DEFINITIONS.length && componentSets.every((item) => expectedComponentIds.has(item.id)) && componentSets.every((item) => item.variants >= 2 && item.autoLayout && item.bound);
    const foundation = snapshot.foundation || {};
    const foundationStrict = validateFoundationEvidence(foundation);
    const foundationInventoryValid = foundationStrict.valid;
    const foundationValid = ["paintsValid", "radiiValid", "effectsValid", "fontsValid", "docsBound"].every((key) => foundation[key] === true) && foundationInventoryValid;
    const annotationViewsValid = snapshot.annotationViews ? snapshot.annotationViews.length === expectedAnnotationViews.size && presentAnnotationViews.size === expectedAnnotationViews.size && [...expectedAnnotationViews].every((key) => presentAnnotationViews.has(key)) : new Set(snapshot.annotationKinds || []).size === ANNOTATION_SECTIONS.length;
    const dialogStatesValid = snapshot.dialogStates ? snapshot.dialogStates.length === expectedDialogStates.size && presentDialogStates.size === expectedDialogStates.size && [...expectedDialogStates].every((key) => presentDialogStates.has(key)) : new Set(snapshot.dialogFamilies || []).size === DIALOG_FAMILIES.length;
    const phasesComplete = snapshot.phases ? REQUIRED_PHASES.every((id) => {
      var _a2;
      return ((_a2 = snapshot.phases[id]) == null ? void 0 : _a2.status) === "success";
    }) : true;
    const report = {
      pageCount: Number(snapshot.pageCount || 0),
      sectionCount: sectionNames.length,
      missingSections: [...requiredNames].filter((name) => !presentNames.has(name)),
      annotationCount: snapshot.annotationViews ? new Set(snapshot.annotationViews.map((item) => item.kind)).size : new Set(snapshot.annotationKinds || []).size,
      annotationViewCount: presentAnnotationViews.size,
      annotationViewsValid,
      dialogFamilyCount: snapshot.dialogStates ? new Set(snapshot.dialogStates.map((item) => item.family)).size : new Set(snapshot.dialogFamilies || []).size,
      dialogStateCount: presentDialogStates.size,
      dialogStatesValid,
      nonGrayPaints: (snapshot.paints || []).filter((color2) => !isGrayColor(color2)).length,
      invalidRadii: (snapshot.radii || []).filter((radius) => !isValidRadius(radius.value, radius.geometry)).length,
      duplicateNames: duplicates(snapshot.topLevelNames || sectionNames),
      sectionStructureValid,
      componentSetCount: componentSets.length,
      componentStructureValid,
      instanceCount: Number(snapshot.instanceCount || 0),
      repeatedScreenInstanceCount: Number(snapshot.repeatedScreenInstanceCount || 0),
      foundationValid,
      foundationInventoryValid,
      foundationErrors: foundationStrict.errors,
      intersections: snapshot.intersections || [],
      clearance: Number((_a = snapshot.clearance) != null ? _a : 0),
      overflowNodes: snapshot.overflowNodes || [],
      undersizedHitTargets: snapshot.undersizedHitTargets || [],
      reactionCount: Number(snapshot.reactionCount || 0),
      requiredReactionCount: Number(snapshot.requiredReactionCount || 0),
      phasesComplete,
      preservedBaselineTopLevelCount: Math.min(
        Number(snapshot.baselineTopLevelCount || 0),
        Number(snapshot.preservedTopLevelCount || 0)
      ),
      preservedBaselineHash: Boolean(snapshot.baselineHash) && snapshot.baselineHash === snapshot.currentBaselineHash && (snapshot.baselineMismatches || []).length === 0,
      baselineMismatches: snapshot.baselineMismatches || [],
      pageInvariant: hashBaselineRecords(snapshot.baselinePages || []) === hashBaselineRecords(snapshot.currentPages || [])
    };
    const modern = Boolean(snapshot.sections);
    report.hardPass = Boolean(snapshot.targetAuthorized) && report.pageCount === 1 && snapshot.pageName === TARGET_PAGE_NAME && report.sectionCount === SECTION_DEFINITIONS.length && report.missingSections.length === 0 && report.duplicateNames.length === 0 && sectionStructureValid && annotationViewsValid && dialogStatesValid && componentStructureValid && report.instanceCount >= COMPONENT_DEFINITIONS.length && report.repeatedScreenInstanceCount > 0 && foundationValid && report.intersections.length === 0 && report.clearance >= 2e3 && report.overflowNodes.length === 0 && report.undersizedHitTargets.length === 0 && report.requiredReactionCount > 0 && report.reactionCount >= report.requiredReactionCount && report.preservedBaselineHash && report.pageInvariant && phasesComplete;
    if (!modern) delete report.hardPass;
    return report;
  }

  // src/runtime.mjs
  var SECTION_WIDTH = 2100;
  var SECTION_CELL_WIDTH = 2400;
  var SECTION_CELL_HEIGHT = 11e3;
  var SECTION_COLUMNS = 3;
  var CREATED_MARKER_KEY = "ondaOrigin";
  var BASELINE_SHARD_PREFIX = "ondaBaselineShard:";
  var lastInspection = null;
  figma.showUI(__html__, { width: 420, height: 720, themeColors: true });
  function foundationEntityRecord(entity) {
    return {
      id: entity.id,
      name: entity.name,
      owner: entity.getSharedPluginData("onda", "owner"),
      entity
    };
  }
  function markFoundationEntity(entity) {
    entity.setSharedPluginData("onda", "owner", PLUGIN_ORIGIN);
    return entity;
  }
  function color(key) {
    const value = PALETTE[key];
    return { r: value.r, g: value.g, b: value.b };
  }
  function solid(key, opacity = 1) {
    return { type: "SOLID", color: color(key), opacity };
  }
  function cloneSerializable(value) {
    try {
      return JSON.parse(JSON.stringify(value, (_key, entry) => {
        if (typeof entry === "symbol") return "MIXED";
        if (typeof entry === "function") return void 0;
        return entry;
      }));
    } catch (_error) {
      return String(value);
    }
  }
  function childIndex(node) {
    const parent = node.parent;
    return parent && "children" in parent ? parent.children.indexOf(node) : -1;
  }
  function nodeRecord(node, baselineIds = null) {
    var _a, _b;
    const children = "children" in node ? protectedChildIds({
      nodeType: node.type,
      children: node.children.map((child) => ({ id: child.id, owner: child.getPluginData(CREATED_MARKER_KEY) })),
      baselineIds: baselineIds || new Set(node.children.map((child) => child.id))
    }) : [];
    const parent = node.parent;
    const parentType = (parent == null ? void 0 : parent.type) || null;
    const autoLayout = "layoutMode" in node ? {
      layoutMode: node.layoutMode,
      primaryAxisSizingMode: node.primaryAxisSizingMode,
      counterAxisSizingMode: node.counterAxisSizingMode,
      primaryAxisAlignItems: node.primaryAxisAlignItems,
      counterAxisAlignItems: node.counterAxisAlignItems,
      itemSpacing: node.itemSpacing,
      paddingTop: node.paddingTop,
      paddingRight: node.paddingRight,
      paddingBottom: node.paddingBottom,
      paddingLeft: node.paddingLeft,
      layoutWrap: node.layoutWrap,
      layoutSizingHorizontal: node.layoutSizingHorizontal,
      layoutSizingVertical: node.layoutSizingVertical
    } : null;
    let mainComponentId = null;
    let mainComponentKey = null;
    if (node.type === "INSTANCE") {
      try {
        mainComponentId = ((_a = node.mainComponent) == null ? void 0 : _a.id) || null;
        mainComponentKey = ((_b = node.mainComponent) == null ? void 0 : _b.key) || null;
      } catch (_error) {
        mainComponentId = null;
        mainComponentKey = null;
      }
    }
    const layoutChild = "layoutPositioning" in node ? {
      layoutPositioning: node.layoutPositioning,
      layoutAlign: node.layoutAlign,
      layoutGrow: node.layoutGrow,
      constraints: "constraints" in node ? cloneSerializable(node.constraints) : null
    } : null;
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      parentId: (parent == null ? void 0 : parent.id) || null,
      parentType,
      index: childIndex(node),
      bounds: "x" in node ? { x: node.x, y: node.y, width: node.width, height: node.height } : null,
      absoluteRenderBounds: "absoluteRenderBounds" in node ? cloneSerializable(node.absoluteRenderBounds) : null,
      absoluteBoundingBox: "absoluteBoundingBox" in node ? cloneSerializable(node.absoluteBoundingBox) : null,
      visible: "visible" in node ? node.visible : null,
      opacity: "opacity" in node ? node.opacity : null,
      text: node.type === "TEXT" ? node.characters : null,
      childIds: children,
      fills: "fills" in node ? cloneSerializable(node.fills) : null,
      strokes: "strokes" in node ? cloneSerializable(node.strokes) : null,
      effects: "effects" in node ? cloneSerializable(node.effects) : null,
      mainComponentId,
      mainComponentKey,
      componentSetId: (parent == null ? void 0 : parent.type) === "COMPONENT_SET" ? parent.id : null,
      componentKey: node.type === "COMPONENT" || node.type === "COMPONENT_SET" ? node.key : null,
      autoLayout,
      layoutChild
    };
  }
  function collectRecordsFromDocument(baselineIds = null) {
    const records = [];
    function visit(node) {
      const belongs = !baselineIds || baselineIds.has(node.id);
      if (belongs) records.push(nodeRecord(node, baselineIds));
      if ("children" in node) {
        for (const child of node.children) visit(child);
      }
    }
    if (!baselineIds || baselineIds.has(figma.root.id)) records.push(nodeRecord(figma.root, baselineIds));
    for (const page of figma.root.children) {
      if (!baselineIds || baselineIds.has(page.id)) records.push(nodeRecord(page, baselineIds));
      for (const child of page.children) visit(child);
    }
    return records;
  }
  function pageInvariantSnapshot() {
    return figma.root.children.map((page, index) => ({ id: page.id, name: page.name, index }));
  }
  function readLedger(page) {
    const raw = page.getPluginData(LEDGER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }
  function writeLedger(page, ledger) {
    page.setPluginData(LEDGER_KEY, JSON.stringify(ledger));
  }
  function writeBaselineShards(page, records) {
    var _a, _b;
    const previous = ((_b = (_a = readLedger(page)) == null ? void 0 : _a.baseline) == null ? void 0 : _b.shardCount) || 0;
    const shards = buildBaselineShards(records);
    for (const [index, shard] of shards.entries()) page.setPluginData(`${BASELINE_SHARD_PREFIX}${index}`, shard);
    for (let index = shards.length; index < previous; index += 1) page.setPluginData(`${BASELINE_SHARD_PREFIX}${index}`, "");
    return shards.length;
  }
  function readBaselineRecords(page, ledger) {
    var _a;
    const count = Number(((_a = ledger == null ? void 0 : ledger.baseline) == null ? void 0 : _a.shardCount) || 0);
    if (!count) return [];
    return restoreBaselineShards(Array.from({ length: count }, (_, index) => page.getPluginData(`${BASELINE_SHARD_PREFIX}${index}`)));
  }
  function inspectFonts(fonts) {
    return selectFontDecision(fonts);
  }
  async function inspectCurrentTarget() {
    await figma.loadAllPagesAsync();
    const page = figma.currentPage;
    const target = validateTargetContext({
      fileKey: figma.fileKey,
      documentName: figma.root.name,
      pageName: page.name
    });
    const fonts = await figma.listAvailableFontsAsync();
    const fontDecision = inspectFonts(fonts);
    const ledger = readLedger(page);
    const records = ledger ? null : collectRecordsFromDocument();
    const topLevelIds = ledger ? [] : page.children.map((node) => node.id);
    const result = {
      target,
      documentId: figma.root.id,
      pageId: page.id,
      fileKey: figma.fileKey || null,
      expectedFileKey: TARGET_FILE_KEY,
      documentName: figma.root.name,
      expectedDocumentName: TARGET_DOCUMENT_NAME,
      pageName: page.name,
      expectedPageName: TARGET_PAGE_NAME,
      pageCount: figma.root.children.length,
      fontDecision,
      ledger,
      pendingBaseline: ledger ? null : {
        records,
        hash: hashBaselineRecords(records),
        topLevelIds,
        topLevelCount: topLevelIds.length,
        pages: pageInvariantSnapshot()
      }
    };
    lastInspection = result;
    return result;
  }
  function inspectionMessage(inspection) {
    const targetText = inspection.target.ok || inspection.target.readOnlyOk ? `Ziel gepr\xFCft: ${inspection.documentName} \xB7 ${inspection.pageName}.` : inspection.target.warning;
    const readOnlyWarning = inspection.target.readOnlyOk ? inspection.target.warning : "";
    const fontText = inspection.fontDecision.warning || "ABC Diatype mit exakten Schnitten verf\xFCgbar.";
    return `${targetText} ${readOnlyWarning} ${fontText}`.trim();
  }
  async function requireMutationContext() {
    let inspection = lastInspection || await inspectCurrentTarget();
    const page = figma.currentPage;
    if (inspection.documentId !== figma.root.id || inspection.pageId !== page.id) inspection = await inspectCurrentTarget();
    const authorization = authorizeMutation(inspection.target);
    if (!authorization.ok) throw new Error(authorization.warning || inspection.target.warning);
    let ledger = readLedger(page);
    if ((ledger == null ? void 0 : ledger.version) === 1) {
      const legacyIds = ledger.baseline.nodeIds || [];
      const currentRecords = orderRecordsByBaselineIds(collectRecordsFromDocument(new Set(legacyIds)), legacyIds);
      if (hashBaselineRecords(currentRecords) !== ledger.baseline.hash) throw new Error("Legacy-Baseline weicht ab; sichere Shard-Migration abgebrochen.");
      const shardCount = writeBaselineShards(page, currentRecords);
      ledger.version = 2;
      ledger.baseline = {
        hash: ledger.baseline.hash,
        shardCount,
        recordCount: currentRecords.length,
        topLevelCount: ledger.baseline.topLevelCount,
        pages: ledger.baseline.pages
      };
      writeLedger(page, ledger);
    }
    if (!ledger) {
      let boundsTree = function(node) {
        return {
          x: node.x,
          width: node.width,
          absoluteRenderBounds: node.absoluteRenderBounds,
          children: "children" in node ? node.children.map(boundsTree) : []
        };
      };
      const baseline = inspection.pendingBaseline;
      if (!baseline) throw new Error("Inspect muss vor der ersten Mutation erneut ausgef\xFChrt werden.");
      const origin = computeOndaOrigin(page.children.map(boundsTree));
      const shardCount = writeBaselineShards(page, baseline.records);
      ledger = {
        version: 2,
        origin: { x: origin, y: 0 },
        target: {
          fileKey: figma.fileKey || null,
          documentName: figma.root.name,
          pageId: page.id,
          pageName: page.name
        },
        fontDecision: inspection.fontDecision,
        baseline: {
          hash: baseline.hash,
          shardCount,
          recordCount: baseline.records.length,
          topLevelCount: baseline.topLevelCount,
          pages: baseline.pages
        },
        phases: { inspect: { status: "success", at: (/* @__PURE__ */ new Date()).toISOString() } },
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      writeLedger(page, ledger);
    }
    if (ledger.target.pageId !== page.id || ledger.target.pageName !== TARGET_PAGE_NAME) {
      throw new Error("Das gespeicherte Onda-Ledger geh\xF6rt nicht zur aktuellen Page 1.");
    }
    const records = readBaselineRecords(page, ledger);
    Object.defineProperty(ledger, "baselineRecords", { value: records, enumerable: false, configurable: true });
    return { page, ledger };
  }
  function markPhase(page, ledger, command, counts) {
    ledger.phases[command] = { status: "success", at: (/* @__PURE__ */ new Date()).toISOString(), counts };
    ledger.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    writeLedger(page, ledger);
  }
  function sectionPosition(index, origin) {
    return {
      x: origin.x + index % SECTION_COLUMNS * SECTION_CELL_WIDTH,
      y: origin.y + Math.floor(index / SECTION_COLUMNS) * SECTION_CELL_HEIGHT
    };
  }
  function resizeNode(node, width, height) {
    if (typeof node.resizeWithoutConstraints === "function") node.resizeWithoutConstraints(width, height);
    else node.resize(width, height);
  }
  function ensureSection(page, ledger, name, height = 1800) {
    const existing = page.children.find((node) => node.name === name);
    if (existing) {
      const reusable = existing.type === "SECTION" && canReuseOwnedNode({
        id: existing.id,
        owner: existing.getPluginData(CREATED_MARKER_KEY)
      }, new Set((ledger.baselineRecords || []).map((record) => record.id)));
      if (!reusable) throw new Error(`Namenskollision mit gesch\xFCtztem Bestand: ${name}`);
      return { node: existing, created: false };
    }
    const definitionIndex = SECTION_DEFINITIONS.findIndex((section2) => section2.name === name);
    if (definitionIndex < 0) throw new Error(`Unbekannte Section: ${name}`);
    const section = figma.createSection();
    section.name = name;
    const position = sectionPosition(definitionIndex, ledger.origin);
    section.x = position.x;
    section.y = position.y;
    resizeNode(section, SECTION_WIDTH, height);
    section.fills = [solid("gray/025")];
    section.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    page.appendChild(section);
    return { node: section, created: true };
  }
  function directChild(parent, name, types = null) {
    if (!("children" in parent)) return null;
    return parent.children.find((node) => node.name === name && (!types || types.includes(node.type))) || null;
  }
  function autoFrame(parent, name, options = {}) {
    var _a, _b, _c, _d, _e, _f;
    const existing = directChild(parent, name, ["FRAME"]);
    const frame = existing || figma.createFrame();
    frame.name = name;
    frame.layoutMode = options.direction || "VERTICAL";
    frame.primaryAxisSizingMode = options.primarySizing || "AUTO";
    frame.counterAxisSizingMode = "FIXED";
    frame.primaryAxisAlignItems = options.primaryAlign || "MIN";
    frame.counterAxisAlignItems = options.counterAlign || "MIN";
    frame.itemSpacing = (_a = options.gap) != null ? _a : 12;
    frame.paddingTop = (_b = options.padding) != null ? _b : 24;
    frame.paddingRight = (_c = options.padding) != null ? _c : 24;
    frame.paddingBottom = (_d = options.padding) != null ? _d : 24;
    frame.paddingLeft = (_e = options.padding) != null ? _e : 24;
    frame.fills = [solid(options.dark ? "gray/900" : options.fill || "gray/000")];
    frame.strokes = [solid(options.dark ? "gray/700" : "gray/200")];
    frame.strokeWeight = 1;
    frame.cornerRadius = (_f = options.radius) != null ? _f : 6;
    frame.clipsContent = true;
    resizeNode(frame, options.width || 620, options.height || 120);
    if (!existing) parent.appendChild(frame);
    if (Number.isFinite(options.x)) frame.x = options.x;
    if (Number.isFinite(options.y)) frame.y = options.y;
    frame.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    return { node: frame, created: !existing };
  }
  async function loadDecisionFonts(decision) {
    const fontNames = TYPE_WEIGHTS.map((weight) => ({ family: decision.family, style: decision.styles[weight] }));
    const unique = [...new Map(fontNames.map((font) => [`${font.family}/${font.style}`, font])).values()];
    await Promise.all(unique.map((font) => figma.loadFontAsync(font)));
  }
  function textNode(parent, name, characters, decision, options = {}) {
    const existing = directChild(parent, name, ["TEXT"]);
    const text = existing || figma.createText();
    text.name = name;
    const weight = options.weight || 400;
    text.fontName = { family: decision.family, style: decision.styles[weight] };
    text.fontSize = options.size || 15;
    const scale = TYPE_SCALE.find((item) => item.size === text.fontSize);
    text.lineHeight = { unit: "PIXELS", value: (scale == null ? void 0 : scale.lineHeight) || Math.round(text.fontSize * 1.45) };
    text.characters = characters;
    text.fills = [solid(options.dark ? "gray/000" : options.muted ? "gray/500" : "gray/900")];
    if (!existing) parent.appendChild(text);
    if (options.width) {
      text.textAutoResize = "HEIGHT";
      text.resize(options.width, Math.max(text.height, 16));
    }
    text.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    return { node: text, created: !existing };
  }
  function heading(parent, title, decision, subtitle = "") {
    textNode(parent, `${title} / Titel`, title, decision, { size: 40, weight: 700, width: 1500 });
    if (subtitle) textNode(parent, `${title} / Untertitel`, subtitle, decision, { size: 15, muted: true, width: 1500 });
  }
  function foundationVariableNamesByCollection() {
    return /* @__PURE__ */ new Map([
      ["Onda \xB7 Primitive", Object.keys(PALETTE)],
      ["Onda \xB7 Dimension", [...SPACING_TOKENS.map((token) => token.name), ...RADIUS_TOKENS.map((token) => token.name)]],
      ["Onda \xB7 Semantic \xB7 Light", SEMANTIC_COLOR_ROLES.map((role) => role.name)],
      ["Onda \xB7 Semantic \xB7 Dark", SEMANTIC_COLOR_ROLES.map((role) => role.name)],
      ["Onda \xB7 Typography", [
        ...TYPE_SCALE.map((scale) => `font-size/${scale.size}`),
        ...TYPE_WEIGHTS.map((weight) => `font-weight/${weight}`)
      ]]
    ]);
  }
  async function collectFoundationMutationInventory() {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const collectionById = new Map(collections.map((collection) => [collection.id, collection]));
    const variables = await figma.variables.getLocalVariablesAsync();
    const textStyles = await figma.getLocalTextStylesAsync();
    const effectStyles = await figma.getLocalEffectStylesAsync();
    return {
      collections: collections.map((collection) => ({
        id: collection.id,
        name: collection.name,
        owner: collection.getSharedPluginData("onda", "owner"),
        modes: collection.modes.map((mode) => ({ modeId: mode.modeId, name: mode.name }))
      })),
      variables: variables.map((variable) => {
        var _a, _b;
        const collection = collectionById.get(variable.variableCollectionId);
        return {
          id: variable.id,
          name: variable.name,
          owner: variable.getSharedPluginData("onda", "owner"),
          collectionId: variable.variableCollectionId,
          collectionName: (collection == null ? void 0 : collection.name) || "",
          resolvedType: variable.resolvedType,
          scopes: [...variable.scopes],
          modeId: ((_b = (_a = collection == null ? void 0 : collection.modes) == null ? void 0 : _a[0]) == null ? void 0 : _b.modeId) || null
        };
      }),
      textStyles: textStyles.map((style) => ({
        id: style.id,
        name: style.name,
        owner: style.getSharedPluginData("onda", "owner")
      })),
      effectStyles: effectStyles.map((style) => ({
        id: style.id,
        name: style.name,
        owner: style.getSharedPluginData("onda", "owner")
      }))
    };
  }
  async function preflightFoundationMutation() {
    const inventory = await collectFoundationMutationInventory();
    const result = validateFoundationMutationInventory(inventory);
    if (!result.valid) throw new Error(`Foundation-Preflight abgebrochen:
${result.errors.join("\n")}`);
    return inventory;
  }
  async function preflightFoundationOwnership() {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const variables = await figma.variables.getLocalVariablesAsync();
    for (const [collectionName, variableNames] of foundationVariableNamesByCollection()) {
      const collectionRecord = selectOwnedEntity(collections.map(foundationEntityRecord), collectionName, "VariableCollection");
      if (!collectionRecord) continue;
      const collectionVariables = variables.filter((variable) => variable.variableCollectionId === collectionRecord.id).map(foundationEntityRecord);
      for (const variableName of variableNames) selectOwnedEntity(collectionVariables, variableName, "Variable");
    }
    const textStyles = (await figma.getLocalTextStylesAsync()).map(foundationEntityRecord);
    for (const definition2 of FOUNDATION_EXPECTATIONS.textStyles) selectOwnedEntity(textStyles, definition2.name, "TextStyle");
    const effectStyles = (await figma.getLocalEffectStylesAsync()).map(foundationEntityRecord);
    for (const name of FOUNDATION_EXPECTATIONS.effectStyles) selectOwnedEntity(effectStyles, name, "EffectStyle");
  }
  async function ensureCollection(name, modeName) {
    var _a, _b;
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const existing = (_a = selectOwnedEntity(collections.map(foundationEntityRecord), name, "VariableCollection")) == null ? void 0 : _a.entity;
    if (existing) {
      if (((_b = existing.modes[0]) == null ? void 0 : _b.name) !== modeName) existing.renameMode(existing.modes[0].modeId, modeName);
      return { collection: existing, modeId: existing.modes[0].modeId, created: false };
    }
    const collection = figma.variables.createVariableCollection(name);
    markFoundationEntity(collection);
    collection.renameMode(collection.modes[0].modeId, modeName);
    return { collection, modeId: collection.modes[0].modeId, created: true };
  }
  async function ensureVariable(collection, modeId, definition2) {
    var _a;
    const variables = await figma.variables.getLocalVariablesAsync();
    const existing = (_a = selectOwnedEntity(
      variables.filter((variable2) => variable2.variableCollectionId === collection.id).map(foundationEntityRecord),
      definition2.name,
      "Variable"
    )) == null ? void 0 : _a.entity;
    if (existing && existing.resolvedType !== definition2.type) throw new Error(`Onda-Variable hat den falschen Typ: ${definition2.name}`);
    const variable = existing || figma.variables.createVariable(definition2.name, collection, definition2.type);
    if (!existing) markFoundationEntity(variable);
    variable.setValueForMode(modeId, definition2.value);
    if (definition2.type !== "BOOLEAN") variable.scopes = definition2.scopes || [];
    variable.setVariableCodeSyntax("WEB", definition2.codeSyntax);
    return { variable, created: !existing };
  }
  async function createFoundationVariables() {
    const primitiveInfo = await ensureCollection("Onda \xB7 Primitive", "Value");
    const dimensionInfo = await ensureCollection("Onda \xB7 Dimension", "Value");
    const lightInfo = await ensureCollection("Onda \xB7 Semantic \xB7 Light", "Light");
    const darkInfo = await ensureCollection("Onda \xB7 Semantic \xB7 Dark", "Dark");
    const typographyInfo = await ensureCollection("Onda \xB7 Typography", "Value");
    const created = [];
    const primitiveByName = {};
    const variablesByKey = /* @__PURE__ */ new Map();
    for (const [name, value] of Object.entries(PALETTE)) {
      const result = await ensureVariable(primitiveInfo.collection, primitiveInfo.modeId, {
        name,
        type: "COLOR",
        value,
        scopes: [],
        codeSyntax: foundationCodeSyntax("Onda \xB7 Primitive", name)
      });
      primitiveByName[name] = result.variable;
      variablesByKey.set(`Onda \xB7 Primitive\0${name}`, result.variable);
      if (result.created) created.push(result.variable.id);
    }
    for (const role of SEMANTIC_COLOR_ROLES) {
      for (const [info, primitiveName] of [
        [lightInfo, role.light],
        [darkInfo, role.dark]
      ]) {
        const result = await ensureVariable(info.collection, info.modeId, {
          name: role.name,
          type: "COLOR",
          value: figma.variables.createVariableAlias(primitiveByName[primitiveName]),
          scopes: role.scopes,
          codeSyntax: foundationCodeSyntax(info.collection.name, role.name)
        });
        variablesByKey.set(`${info.collection.name}\0${role.name}`, result.variable);
        if (result.created) created.push(result.variable.id);
      }
    }
    const dimensions = [
      ...SPACING_TOKENS.map((token) => __spreadProps(__spreadValues({}, token), { scope: "GAP" })),
      ...RADIUS_TOKENS.map((token) => ({ name: token.name, value: token.value, scope: "CORNER_RADIUS" }))
    ];
    for (const item of dimensions) {
      const result = await ensureVariable(dimensionInfo.collection, dimensionInfo.modeId, {
        name: item.name,
        type: "FLOAT",
        value: item.value,
        scopes: [item.scope],
        codeSyntax: foundationCodeSyntax("Onda \xB7 Dimension", item.name)
      });
      variablesByKey.set(`Onda \xB7 Dimension\0${item.name}`, result.variable);
      if (result.created) created.push(result.variable.id);
    }
    for (const item of TYPE_SCALE) {
      const result = await ensureVariable(typographyInfo.collection, typographyInfo.modeId, {
        name: `font-size/${item.size}`,
        type: "FLOAT",
        value: item.size,
        scopes: ["FONT_SIZE"],
        codeSyntax: foundationCodeSyntax("Onda \xB7 Typography", `font-size/${item.size}`)
      });
      variablesByKey.set(`Onda \xB7 Typography\0font-size/${item.size}`, result.variable);
      if (result.created) created.push(result.variable.id);
    }
    for (const weight of TYPE_WEIGHTS) {
      const result = await ensureVariable(typographyInfo.collection, typographyInfo.modeId, {
        name: `font-weight/${weight}`,
        type: "FLOAT",
        value: weight,
        scopes: ["FONT_WEIGHT"],
        codeSyntax: foundationCodeSyntax("Onda \xB7 Typography", `font-weight/${weight}`)
      });
      variablesByKey.set(`Onda \xB7 Typography\0font-weight/${weight}`, result.variable);
      if (result.created) created.push(result.variable.id);
    }
    return {
      collections: [primitiveInfo, dimensionInfo, lightInfo, darkInfo, typographyInfo].map((info) => info.collection.id),
      createdVariableIds: created,
      variablesByKey
    };
  }
  async function createFoundationStyles(decision, variablesByKey) {
    var _a, _b;
    const existingText = await figma.getLocalTextStylesAsync();
    const createdText = [];
    const textStyles = [];
    for (const definition2 of FOUNDATION_EXPECTATIONS.textStyles) {
      const existing = (_a = selectOwnedEntity(existingText.map(foundationEntityRecord), definition2.name, "TextStyle")) == null ? void 0 : _a.entity;
      const style = existing || figma.createTextStyle();
      if (!existing) markFoundationEntity(style);
      style.name = definition2.name;
      style.fontName = { family: decision.family, style: decision.styles[definition2.weight] };
      style.fontSize = definition2.size;
      style.lineHeight = { unit: "PIXELS", value: definition2.lineHeight };
      style.letterSpacing = { unit: "PIXELS", value: 0 };
      style.textCase = "ORIGINAL";
      style.textDecoration = "NONE";
      style.setBoundVariable("fontSize", variablesByKey.get(`Onda \xB7 Typography\0font-size/${definition2.size}`));
      style.setBoundVariable("fontWeight", variablesByKey.get(`Onda \xB7 Typography\0font-weight/${definition2.weight}`));
      textStyles.push(style);
      if (!existing) createdText.push(style.id);
    }
    const existingEffects = await figma.getLocalEffectStylesAsync();
    const createdEffects = [];
    const effectStyles = [];
    const effects = [
      { name: "Onda/Shadow/Overlay", radius: 24, opacity: 0.16, y: 8 }
    ];
    for (const effect of effects) {
      const existing = (_b = selectOwnedEntity(existingEffects.map(foundationEntityRecord), effect.name, "EffectStyle")) == null ? void 0 : _b.entity;
      const style = existing || figma.createEffectStyle();
      if (!existing) markFoundationEntity(style);
      style.name = effect.name;
      style.effects = [{
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: effect.opacity },
        offset: { x: 0, y: effect.y },
        radius: effect.radius,
        spread: 0,
        visible: true,
        blendMode: "NORMAL"
      }];
      effectStyles.push(style);
      if (!existing) createdEffects.push(style.id);
    }
    return { createdTextStyleIds: createdText, createdEffectStyleIds: createdEffects, textStyles, effectStyles };
  }
  function ensureVariableSwatch(parent, layer, name, variable, fallback, decision, labelVariable) {
    const width = layer === "primitive" ? 160 : 220;
    const swatchName = layer === "primitive" ? `Swatch / ${name}` : `Swatch / ${layer} / ${name}`;
    const swatch = autoFrame(parent, swatchName, {
      width,
      height: 150,
      padding: 12,
      gap: 8,
      fill: fallback,
      radius: 4
    }).node;
    swatch.effects = [];
    swatch.fills = [figma.variables.setBoundVariableForPaint(solid(fallback), "color", variable)];
    swatch.setPluginData("ondaFoundationArtifact", "swatch");
    swatch.setPluginData("ondaFoundationLayer", layer);
    swatch.setPluginData("ondaBoundVariableId", variable.id);
    const label = textNode(swatch, `${swatchName} / Label`, name, decision, {
      size: 12,
      weight: 500,
      dark: ["gray/700", "gray/900", "gray/1000"].includes(fallback),
      width: width - 24
    }).node;
    label.fills = [figma.variables.setBoundVariableForPaint(label.fills[0], "color", labelVariable)];
    label.setPluginData("ondaFoundationTextVariableId", labelVariable.id);
    return swatch;
  }
  function ensureSpacingBar(parent, token, variable, decision) {
    const row = autoFrame(parent, `Spacing / ${token.value}`, {
      width: 220,
      height: 96,
      direction: "VERTICAL",
      padding: 12,
      gap: 8,
      radius: 4
    }).node;
    row.effects = [];
    const existing = directChild(row, `Spacing Bar / ${token.value}`);
    if (existing && existing.type !== "RECTANGLE") throw new Error(`Ung\xFCltiger bestehender Spacing-Sample: ${token.name}`);
    const bar = existing || figma.createRectangle();
    bar.name = `Spacing Bar / ${token.value}`;
    bar.resize(token.value, 16);
    bar.fills = [solid("gray/700")];
    bar.effects = [];
    bar.setBoundVariable("width", variable);
    bar.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    bar.setPluginData("ondaFoundationArtifact", "spacing-bar");
    bar.setPluginData("ondaBoundVariableId", variable.id);
    if (!existing) row.appendChild(bar);
    textNode(row, `Spacing / ${token.value} / Label`, `${token.name} \xB7 ${token.value}px`, decision, { size: 12, weight: 500, width: 190 });
    return bar;
  }
  function ensureRadiusSample(parent, token, variable) {
    const name = `Radius / ${token.value}`;
    const expectedType = token.geometry === "ELLIPSE" ? "ELLIPSE" : "RECTANGLE";
    const existing = directChild(parent, name);
    if (existing && existing.type !== expectedType) throw new Error(`Ung\xFCltiger bestehender Foundation-Sample: ${name}`);
    const sample = existing || (expectedType === "ELLIPSE" ? figma.createEllipse() : figma.createRectangle());
    sample.name = name;
    sample.resize(112, 112);
    sample.fills = [solid("gray/100")];
    sample.strokes = [solid("gray/700")];
    sample.effects = [];
    sample.strokeWeight = 1;
    if (expectedType === "RECTANGLE") {
      sample.cornerRadius = token.value;
      for (const field of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) sample.setBoundVariable(field, variable);
    }
    if (expectedType === "ELLIPSE") {
      sample.setBoundVariable("maxWidth", variable);
      sample.setBoundVariable("maxHeight", variable);
    }
    if (!existing) parent.appendChild(sample);
    sample.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    sample.setPluginData("ondaFoundationArtifact", "radius-sample");
    sample.setPluginData("ondaFoundationGeometry", expectedType);
    sample.setPluginData("ondaBoundVariableId", variable.id);
    return { node: sample, created: !existing };
  }
  async function ensureEffectStyleCard(parent, style, decision) {
    const card = autoFrame(parent, `Effect / ${style.name}`, { width: 780, height: 150, padding: 24, gap: 8, radius: 6 }).node;
    await card.setEffectStyleIdAsync(style.id);
    card.setPluginData("ondaFoundationArtifact", "effect-style");
    card.setPluginData("ondaEffectStyleName", style.name);
    textNode(card, `Effect / ${style.name} / Label`, style.name, decision, { size: 15, weight: 700, width: 700 });
    textNode(card, `Effect / ${style.name} / Detail`, "Schatten sind ausschlie\xDFlich f\xFCr Floating- und Overlay-Fl\xE4chen vorgesehen.", decision, { size: 12, muted: true, width: 700 });
    return card;
  }
  async function bindFoundationArtifacts(section) {
    var _a;
    const surface = await localVariable("color/surface", "Onda \xB7 Semantic \xB7 Light");
    const background = await localVariable("color/background", "Onda \xB7 Semantic \xB7 Light");
    const text = await localVariable("color/text", "Onda \xB7 Semantic \xB7 Light");
    const muted = await localVariable("color/text-muted", "Onda \xB7 Semantic \xB7 Light");
    const border = await localVariable("color/border", "Onda \xB7 Semantic \xB7 Light");
    const spacing = await localVariable("spacing/24", "Onda \xB7 Dimension");
    if (background) section.fills = [figma.variables.setBoundVariableForPaint(solid("gray/025"), "color", background)];
    const nodes = collectOndaNodes([section]);
    for (const node of nodes) {
      const artifact = node.getPluginData("ondaFoundationArtifact");
      if (node.type === "FRAME" && artifact !== "swatch" && surface) node.fills = [figma.variables.setBoundVariableForPaint(solid("gray/000"), "color", surface)];
      if ("strokes" in node && border && ((_a = node.strokes) == null ? void 0 : _a.length)) node.strokes = [figma.variables.setBoundVariableForPaint(solid("gray/200"), "color", border)];
      if (node.type === "TEXT") {
        const variable = /Untertitel|Fontstatus|Label/.test(node.name) ? muted : text;
        if (!node.getPluginData("ondaFoundationTextVariableId")) {
          if (variable) node.fills = [figma.variables.setBoundVariableForPaint(solid(variable === muted ? "gray/500" : "gray/900"), "color", variable)];
        }
      }
      if (node.type === "FRAME" && spacing) node.setBoundVariable("itemSpacing", spacing);
      if ("effects" in node && artifact !== "effect-style") node.effects = [];
      node.setPluginData("ondaFoundationBound", "true");
    }
  }
  async function runFoundations(page, ledger) {
    await preflightFoundationOwnership();
    await loadDecisionFonts(ledger.fontDecision);
    const variables = await createFoundationVariables();
    const styles = await createFoundationStyles(ledger.fontDecision, variables.variablesByKey);
    const sectionResult = ensureSection(page, ledger, "01 \xB7 Foundations", 6400);
    const section = sectionResult.node;
    resizeNode(section, SECTION_WIDTH, 6400);
    const doc = autoFrame(section, "Foundations / Dokumentation", { x: 80, y: 100, width: 1940, padding: 40, gap: 24, radius: 6 }).node;
    doc.effects = [];
    heading(doc, "Foundations", ledger.fontDecision, "Monochrom \xB7 Radien 0/4/6/8 \xB7 ABC Diatype bevorzugt \xB7 Light und Dark als getrennte Single-Mode-Semantik");
    textNode(doc, "Foundations / Fontstatus", ledger.fontDecision.warning || "\u2713 ABC Diatype ist verf\xFCgbar.", ledger.fontDecision, {
      size: 15,
      weight: 700,
      width: 1800
    });
    const palette = autoFrame(section, "Foundations / Graustufen", { x: 80, y: 600, width: 1940, direction: "HORIZONTAL", padding: 32, gap: 12, radius: 6 }).node;
    palette.effects = [];
    for (const name of Object.keys(PALETTE)) {
      const labelToken = foundationSwatchLabelToken("primitive", name);
      const labelVariable = variables.variablesByKey.get(`${labelToken.collectionName}\0${labelToken.variableName}`);
      ensureVariableSwatch(palette, "primitive", name, variables.variablesByKey.get(`Onda \xB7 Primitive\0${name}`), name, ledger.fontDecision, labelVariable);
    }
    for (const [collectionName, layer, key, y] of [
      ["Onda \xB7 Semantic \xB7 Light", "semantic-light", "light", 1050],
      ["Onda \xB7 Semantic \xB7 Dark", "semantic-dark", "dark", 1500]
    ]) {
      const semantic = autoFrame(section, `Foundations / ${key === "light" ? "Semantic Light" : "Semantic Dark"}`, { x: 80, y, width: 1940, direction: "HORIZONTAL", padding: 32, gap: 12, radius: 6 }).node;
      semantic.effects = [];
      for (const role of SEMANTIC_COLOR_ROLES) {
        const labelToken = foundationSwatchLabelToken(layer, role[key]);
        const labelVariable = variables.variablesByKey.get(`${labelToken.collectionName}\0${labelToken.variableName}`);
        ensureVariableSwatch(semantic, layer, role.name, variables.variablesByKey.get(`${collectionName}\0${role.name}`), role[key], ledger.fontDecision, labelVariable);
      }
    }
    const spacing = autoFrame(section, "Foundations / Spacing", { x: 80, y: 1950, width: 1940, direction: "HORIZONTAL", padding: 32, gap: 20, radius: 6 }).node;
    spacing.effects = [];
    for (const token of SPACING_TOKENS) ensureSpacingBar(spacing, token, variables.variablesByKey.get(`Onda \xB7 Dimension\0${token.name}`), ledger.fontDecision);
    const type = autoFrame(section, "Foundations / Typografie", { x: 80, y: 2400, width: 1940, padding: 32, gap: 20, radius: 6 }).node;
    type.effects = [];
    for (const [index, style] of styles.textStyles.entries()) {
      const definition2 = FOUNDATION_EXPECTATIONS.textStyles[index];
      const specimen = textNode(type, `Typografie / ${definition2.role}`, `${definition2.role} \xB7 ${definition2.size}px \xB7 ${definition2.weight} \xB7 Onda schreibt klar und ruhig.`, ledger.fontDecision, {
        size: definition2.size,
        weight: definition2.weight,
        width: 1800
      }).node;
      await specimen.setTextStyleIdAsync(style.id);
      specimen.setBoundVariable("fontSize", variables.variablesByKey.get(`Onda \xB7 Typography\0font-size/${definition2.size}`));
      specimen.setBoundVariable("fontWeight", variables.variablesByKey.get(`Onda \xB7 Typography\0font-weight/${definition2.weight}`));
      specimen.setPluginData("ondaFoundationArtifact", "text-style");
      specimen.setPluginData("ondaTextStyleName", style.name);
    }
    const typographyVariables = autoFrame(section, "Foundations / Typography Variables", { x: 80, y: 3600, width: 1940, direction: "HORIZONTAL", padding: 32, gap: 20, radius: 6 }).node;
    typographyVariables.effects = [];
    for (const scale of TYPE_SCALE) textNode(typographyVariables, `Typography Variable / font-size/${scale.size}`, `font-size/${scale.size}`, ledger.fontDecision, { size: 12, width: 180 });
    for (const weight of TYPE_WEIGHTS) textNode(typographyVariables, `Typography Variable / font-weight/${weight}`, `font-weight/${weight}`, ledger.fontDecision, { size: 12, weight, width: 180 });
    const radius = autoFrame(section, "Foundations / Radien", { x: 80, y: 4050, width: 1940, direction: "HORIZONTAL", padding: 32, gap: 20, radius: 6 }).node;
    radius.effects = [];
    for (const token of RADIUS_TOKENS) {
      ensureRadiusSample(radius, token, variables.variablesByKey.get(`Onda \xB7 Dimension\0${token.name}`));
    }
    const effects = autoFrame(section, "Foundations / Effects", { x: 80, y: 4500, width: 1940, direction: "HORIZONTAL", padding: 48, gap: 40, radius: 6 }).node;
    effects.effects = [];
    for (const style of styles.effectStyles) await ensureEffectStyleCard(effects, style, ledger.fontDecision);
    await bindFoundationArtifacts(section);
    return {
      sectionCreated: sectionResult.created,
      collectionCount: variables.collections.length,
      variablesCreated: variables.createdVariableIds.length,
      textStylesCreated: styles.createdTextStyleIds.length,
      effectStylesCreated: styles.createdEffectStyleIds.length
    };
  }
  async function localVariable(name, collectionName) {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const collection = collections.find((item) => item.name === collectionName);
    if (!collection) return null;
    const variables = await figma.variables.getLocalVariablesAsync();
    return variables.find((variable) => variable.variableCollectionId === collection.id && variable.name === name) || null;
  }
  async function bindComponentSurface(component, dark = false) {
    const fillVariable = await localVariable("color/inverted", dark ? "Onda \xB7 Semantic \xB7 Dark" : "Onda \xB7 Semantic \xB7 Light");
    const radiusVariable = await localVariable("radius/control", "Onda \xB7 Dimension");
    const spacingVariable = await localVariable("spacing/12", "Onda \xB7 Dimension");
    const horizontalPadding = await localVariable("spacing/16", "Onda \xB7 Dimension");
    const textVariable = await localVariable("color/on-inverted", dark ? "Onda \xB7 Semantic \xB7 Dark" : "Onda \xB7 Semantic \xB7 Light");
    if (fillVariable) {
      component.fills = [figma.variables.setBoundVariableForPaint(solid("gray/900"), "color", fillVariable)];
    }
    if (radiusVariable) {
      for (const field of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) component.setBoundVariable(field, radiusVariable);
    }
    if (spacingVariable) component.setBoundVariable("itemSpacing", spacingVariable);
    if (horizontalPadding) {
      component.setBoundVariable("paddingLeft", horizontalPadding);
      component.setBoundVariable("paddingRight", horizontalPadding);
    }
    if (textVariable) {
      for (const node of component.findAll((node2) => node2.type === "TEXT")) {
        node.fills = [figma.variables.setBoundVariableForPaint(solid("gray/000"), "color", textVariable)];
      }
    }
    component.setPluginData("ondaVariablesBound", "true");
  }
  async function rebindExistingComponent(set) {
    for (const component of set.children) {
      if (component.type !== "COMPONENT") continue;
      await bindComponentSurface(component);
      component.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    }
    set.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    set.setPluginData("ondaVariablesBound", "true");
    return set;
  }
  function componentVariant(parent, definition2, decision, state, index) {
    const component = figma.createComponent();
    component.name = `State=${state}`;
    component.layoutMode = "HORIZONTAL";
    component.primaryAxisSizingMode = "AUTO";
    component.counterAxisSizingMode = "AUTO";
    component.primaryAxisAlignItems = "CENTER";
    component.counterAxisAlignItems = "CENTER";
    component.itemSpacing = 8;
    component.paddingTop = 12;
    component.paddingRight = 16;
    component.paddingBottom = 12;
    component.paddingLeft = 16;
    component.cornerRadius = definition2.id === "dialog" ? 8 : 4;
    component.fills = [solid(index === 0 ? "gray/900" : "gray/000")];
    component.strokes = [solid("gray/500")];
    component.strokeWeight = state === "Focus" ? 2 : 1;
    parent.appendChild(component);
    const marker = figma.createText();
    marker.name = "Statussymbol";
    marker.fontName = { family: decision.family, style: decision.styles[700] };
    marker.fontSize = 15;
    marker.characters = state === "Focus" ? "\u25CE" : "\u25CF";
    marker.fills = [solid(index === 0 ? "gray/000" : "gray/900")];
    component.appendChild(marker);
    const label = figma.createText();
    label.name = "label";
    label.fontName = { family: decision.family, style: decision.styles[500] };
    label.fontSize = 15;
    label.characters = definition2.label;
    label.fills = [solid(index === 0 ? "gray/000" : "gray/900")];
    component.appendChild(label);
    return { component, label };
  }
  async function runComponent(page, ledger, componentId) {
    await loadDecisionFonts(ledger.fontDecision);
    const definition2 = COMPONENT_DEFINITIONS.find((component) => component.id === componentId);
    if (!definition2) throw new Error(`Unbekannte Komponente: ${componentId}`);
    const earlierMissing = COMPONENT_DEFINITIONS.filter((component) => component.tier < definition2.tier).filter((component) => {
      const section2 = page.children.find((node) => node.type === "SECTION" && node.name === "02 \xB7 Komponenten");
      return !section2 || !section2.findOne((node) => node.type === "COMPONENT_SET" && node.name === component.name);
    });
    if (earlierMissing.length) throw new Error(`Zuerst Abh\xE4ngigkeiten erzeugen: ${earlierMissing.map((component) => component.label).join(", ")}`);
    const section = ensureSection(page, ledger, "02 \xB7 Komponenten", 4e3).node;
    const existing = section.findOne((node) => node.type === "COMPONENT_SET" && node.name === definition2.name);
    if (existing) {
      await rebindExistingComponent(existing);
      return { component: definition2.name, status: "reused", variantCount: existing.children.length };
    }
    const variants = [
      componentVariant(section, definition2, ledger.fontDecision, "Default", 0),
      componentVariant(section, definition2, ledger.fontDecision, "Focus", 1)
    ];
    for (const variant of variants) await bindComponentSurface(variant.component);
    const set = figma.combineAsVariants(variants.map((item) => item.component), section);
    set.name = definition2.name;
    set.description = `${definition2.label}: monochrome Onda-Komponente mit Auto Layout, Variablenbindung und sichtbarem Fokuszustand.`;
    set.fills = [solid("gray/050")];
    set.strokes = [solid("gray/200")];
    set.strokeWeight = 1;
    set.cornerRadius = 6;
    set.setPluginData("ondaComponentId", definition2.id);
    await rebindExistingComponent(set);
    const index = COMPONENT_DEFINITIONS.findIndex((component) => component.id === componentId);
    set.x = 80 + index % 2 * 920;
    set.y = 120 + Math.floor(index / 2) * 700;
    let maxX = 0;
    for (const [variantIndex, child] of set.children.entries()) {
      child.x = 40 + variantIndex * 280;
      child.y = 80;
      maxX = Math.max(maxX, child.x + child.width);
    }
    resizeNode(set, Math.max(720, maxX + 40), 240);
    const labelKey = set.addComponentProperty("Label", "TEXT", definition2.label);
    for (const variant of set.children) {
      const label = variant.findOne((node) => node.type === "TEXT" && node.name === "label");
      if (label) label.componentPropertyReferences = { characters: labelKey };
    }
    const instance = set.children[0].createInstance();
    instance.name = `${definition2.name} / Beispielinstanz`;
    instance.x = set.x;
    instance.y = set.y + set.height + 40;
    section.appendChild(instance);
    instance.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    instance.setPluginData("ondaRepeatedScreenInstance", "true");
    return { component: definition2.name, status: "created", variantCount: set.children.length, instanceCount: 1 };
  }
  function componentSet(page, name) {
    const section = page.children.find((node) => node.type === "SECTION" && node.name === "02 \xB7 Komponenten");
    return (section == null ? void 0 : section.findOne((node) => node.type === "COMPONENT_SET" && node.name === name)) || null;
  }
  function placeInstance(parent, set, name) {
    if (!set || !set.children.length) return null;
    const existing = directChild(parent, name, ["INSTANCE"]);
    if (existing) return existing;
    const instance = set.children[0].createInstance();
    instance.name = name;
    parent.appendChild(instance);
    instance.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    instance.setPluginData("ondaRepeatedScreenInstance", "true");
    return instance;
  }
  function createLibraryView(section, decision, state, x) {
    const frame = autoFrame(section, `Bibliothek / ${state}`, { x, y: 180, width: 900, padding: 32, gap: 20, radius: 0 }).node;
    textNode(frame, `Bibliothek / ${state} / Titel`, state, decision, { size: 21, weight: 700, width: 800 });
    textNode(frame, `Bibliothek / ${state} / Suche`, "\u2315  Projekte und Dokumente durchsuchen", decision, { size: 15, width: 800 });
    const rows = state.includes("Leer") ? ["Noch kein Projekt \xB7 Projekt anlegen"] : ["Buchprojekt \xB7 12 Dokumente", "Essay \xB7 4 Dokumente", "Notizen \xB7 21 Eintr\xE4ge"];
    for (const [index, row] of rows.entries()) textNode(frame, `Bibliothek / ${state} / Zeile ${index + 1}`, `${index + 1}. ${row}`, decision, { size: 15, width: 800 });
    return frame;
  }
  function createEditorView(section, decision, state, x, dark = false, width = 1440) {
    const frame = autoFrame(section, `Editor / ${state}`, { x, y: 180, width, padding: 0, gap: 0, radius: 0, dark, direction: "HORIZONTAL" }).node;
    frame.setPluginData("ondaResponsiveFrame", String(width));
    const nav = autoFrame(frame, `Editor / ${state} / Navigation`, { width: Math.min(264, Math.round(width * 0.25)), padding: 24, gap: 16, radius: 0, dark, fill: dark ? "gray/900" : "gray/050" }).node;
    textNode(nav, `Editor / ${state} / Navigation / Marke`, "ONDA", decision, { size: 21, weight: 700, dark, width: 210 });
    for (const label of ["Struktur", "Projektverst\xE4ndnis", "Quellen", "Einstellungen"]) textNode(nav, `Editor / ${state} / Navigation / ${label}`, `\u25A1 ${label}`, decision, { size: 15, weight: 500, dark, width: 210 });
    const document = autoFrame(frame, `Editor / ${state} / Schreibfl\xE4che`, { width: width - Math.min(264, Math.round(width * 0.25)), padding: width <= 320 ? 16 : 48, gap: 24, radius: 0, dark }).node;
    textNode(document, `Editor / ${state} / Dokumenttitel`, "Die leise Architektur eines Arguments", decision, { size: width <= 320 ? 21 : 40, weight: 700, dark, width: Math.max(240, width - 400) });
    textNode(document, `Editor / ${state} / Absatz 1`, "Ein guter Text zeigt nicht nur, was behauptet wird. Er macht sichtbar, wie Beobachtung, Beleg und Schlussfolgerung miteinander verbunden sind.", decision, { size: 15, dark, width: Math.max(240, width - 420) });
    textNode(document, `Editor / ${state} / Status`, state.includes("Review") ? "\u25CE REVIEW OFFEN \xB7 3 Hinweise \xB7 N\xE4chster Hinweis" : "\u2713 DOKUMENT BEREIT \xB7 keine offenen Hinweise", decision, { size: 12, weight: 700, dark, width: Math.max(240, width - 420) });
    return frame;
  }
  async function runCoreViews(page, ledger) {
    await loadDecisionFonts(ledger.fontDecision);
    const overview = ensureSection(page, ledger, "00 \xB7 \xDCbersicht", 1800).node;
    const overviewDoc = autoFrame(overview, "\xDCbersicht / Coverage", { x: 80, y: 100, width: 1940, padding: 40, gap: 20, radius: 6 }).node;
    heading(overviewDoc, "Onda Produktdesign", ledger.fontDecision, "Eine bestehende Figma-Seite \xB7 39 Sections \xB7 29 Anmerkungsarten \xB7 7 vollst\xE4ndige Dialogfamilien");
    for (const line of ["39 / 39 Sections geplant", "29 / 29 Anmerkungsarten geplant", "7 / 7 Dialogfamilien vollst\xE4ndig benannt", "Light + Dark \xB7 ausschlie\xDFlich Graustufen", "Radien: 0 \xB7 4 \xB7 6 \xB7 8 \xB7 echte Kreise"]) {
      textNode(overviewDoc, `\xDCbersicht / ${line}`, `\u2713 ${line}`, ledger.fontDecision, { size: 15, weight: 500, width: 1800 });
    }
    const library = ensureSection(page, ledger, "03 \xB7 Bibliothek", 1700).node;
    createLibraryView(library, ledger.fontDecision, "Leerzustand", 80);
    createLibraryView(library, ledger.fontDecision, "Gef\xFCllte Bibliothek", 1080);
    const editor = ensureSection(page, ledger, "04 \xB7 Editor", 2500).node;
    const clean = createEditorView(editor, ledger.fontDecision, "Desktop \xB7 Bereit", 80);
    const review = createEditorView(editor, ledger.fontDecision, "Desktop \xB7 Review offen", 80);
    review.y = 1300;
    const button = componentSet(page, "Onda/Button");
    if (button) {
      placeInstance(clean, button, "Editor / Bereit / Hauptaktion");
      placeInstance(review, button, "Editor / Review / Hauptaktion");
    }
    return { sections: 3, libraryViews: 2, editorViews: 2, componentInstances: button ? 2 : 0 };
  }
  function annotationStatus(viewName, operationAvailable) {
    if (viewName === "Open") return "\u25CB OFFEN \xB7 Entscheidung ausstehend";
    if (viewName === "Accept \xB7 Undo") return operationAvailable ? "\u2713 \xDCBERNOMMEN \xB7 \u21B6 R\xDCCKG\xC4NGIG" : "\u2014 NICHT VERF\xDCGBAR \xB7 redaktioneller Hinweis";
    if (viewName === "Reject \xB7 Scope") return "\xD7 ABGELEHNT \xB7 G\xDCLTIG F\xDCR: nur hier / Dokument / pers\xF6nlich";
    if (viewName === "Error \xB7 Retry") return "! FEHLER \xB7 \u21BB ERNEUT VERSUCHEN";
    if (viewName === "Responsive \xB7 320 px") return "\u2194 320 PX \xB7 Aktionen untereinander";
    return "\u25D0 DARK \xB7 Status durch Text + Symbol + Linie";
  }
  function createAnnotationView(section, annotation, view, decision, index) {
    const dark = view.name === "Dark";
    const width = view.name === "Responsive \xB7 320 px" ? 320 : 580;
    const x = 80 + index % 3 * 640;
    const y = 140 + Math.floor(index / 3) * 620;
    const frame = autoFrame(section, `${annotation.label} / ${view.name}`, { x, y, width, padding: view.name === "Responsive \xB7 320 px" ? 16 : 24, gap: 14, radius: 8, dark }).node;
    frame.effects = [{
      type: "DROP_SHADOW",
      color: { r: 0, g: 0, b: 0, a: dark ? 0.28 : 0.1 },
      offset: { x: 0, y: 4 },
      radius: 12,
      spread: 0,
      visible: true,
      blendMode: "NORMAL"
    }];
    textNode(frame, `${annotation.label} / ${view.name} / Anker`, `[${String(index + 1).padStart(2, "0")}] ANKER \xB7 ${annotation.scope}`, decision, { size: 12, weight: 700, dark, width: width - 48 });
    textNode(frame, `${annotation.label} / ${view.name} / Titel`, annotation.label, decision, { size: 21, weight: 700, dark, width: width - 48 });
    textNode(frame, `${annotation.label} / ${view.name} / Befund`, `\u201EDieser Ausschnitt braucht eine klare redaktionelle Entscheidung.\u201C`, decision, { size: 15, dark, width: width - 48 });
    textNode(frame, `${annotation.label} / ${view.name} / Detail`, view.detail, decision, { size: 12, muted: !dark, dark, width: width - 48 });
    textNode(frame, `${annotation.label} / ${view.name} / Status`, annotationStatus(view.name, Boolean(annotation.operation)), decision, { size: 12, weight: 700, dark, width: width - 48 });
    textNode(frame, `${annotation.label} / ${view.name} / Aktion`, view.name === "Error \xB7 Retry" ? "\u21BB Erneut versuchen   \xB7   Abbrechen" : "Weiter   \xB7   Zur\xFCck", decision, { size: 15, weight: 500, dark, width: width - 48 });
    frame.setPluginData("ondaAnnotationKind", annotation.kind);
    frame.setPluginData("ondaAnnotationView", view.name);
    return frame;
  }
  async function runAnnotationBatch(page, ledger, batchIndex) {
    await loadDecisionFonts(ledger.fontDecision);
    const batch = annotationBatch(batchIndex);
    let createdSections = 0;
    let createdViews = 0;
    for (const annotation of batch) {
      const result = ensureSection(page, ledger, annotation.sectionName, 1500);
      if (result.created) createdSections += 1;
      result.node.setPluginData("ondaAnnotationKind", annotation.kind);
      for (const [index, view] of annotation.views.entries()) {
        const existed = directChild(result.node, `${annotation.label} / ${view.name}`, ["FRAME"]);
        createAnnotationView(result.node, annotation, view, ledger.fontDecision, index);
        if (!existed) createdViews += 1;
      }
    }
    return { batch: batchIndex + 1, annotationCount: batch.length, createdSections, createdViews };
  }
  function createAgentAndSources(section, decision) {
    const views = [
      ["Agent \xB7 Ruhe", "\u25CB AURA RUHIG", "Der Agent wartet, bis er bewusst ge\xF6ffnet wird."],
      ["Agent \xB7 Gespr\xE4ch", "\u25CF AGENT AKTIV", "Welche Aussage m\xF6chtest du als N\xE4chstes belegen?"],
      ["Agent \xB7 Antwort mit Fundstelle", "\u2713 ANTWORT \xB7 2 FUNDSTELLEN", "Die Antwort trennt Beobachtung, Schluss und Quelle."],
      ["Agent \xB7 Fehler und R\xFCckkehr", "! VERBINDUNG FEHLT", "Erneut versuchen \xB7 KI-Anschluss \xF6ffnen \xB7 Abbrechen"]
    ];
    for (const [index, [name, status, body]] of views.entries()) {
      const frame = autoFrame(section, name, { x: 80 + index % 2 * 980, y: 160 + Math.floor(index / 2) * 620, width: 900, padding: 32, gap: 16, radius: 8 }).node;
      textNode(frame, `${name} / Status`, status, decision, { size: 12, weight: 700, width: 820 });
      textNode(frame, `${name} / Titel`, name, decision, { size: 21, weight: 700, width: 820 });
      textNode(frame, `${name} / Inhalt`, body, decision, { size: 15, width: 820 });
      textNode(frame, `${name} / Aktionen`, "Antworten \xB7 Fundstelle \xF6ffnen \xB7 Zur\xFCck zum Editor", decision, { size: 15, weight: 500, width: 820 });
    }
  }
  function dialogStatus(state) {
    const lower = state.toLowerCase();
    if (lower.includes("fehler") || lower.includes("blockiert") || lower.includes("nicht belastbar")) return "! FEHLER / BLOCKADE \xB7 Recovery sichtbar";
    if (lower.includes("l\xE4uft") || lower.includes("gepr\xFCft") || lower.includes("wird")) return "\u2026 ARBEITSSTAND \xB7 Abbrechen bleibt erreichbar";
    if (lower.includes("leer") || lower.includes("fehlt") || lower.includes("deaktiviert")) return "\u25CB AUSGANGSLAGE \xB7 n\xE4chste Handlung sichtbar";
    return "\u2713 BEST\xC4TIGT / ENTSCHEIDUNGSBEREIT";
  }
  function createDialogs(section, decision) {
    let row = 0;
    let count = 0;
    for (const family of DIALOG_FAMILIES) {
      for (const [index, state] of family.states.entries()) {
        const x = 80 + index % 3 * 640;
        const y = 120 + row * 500;
        const name = `${family.name} / ${state}`;
        const frame = autoFrame(section, name, { x, y, width: 580, padding: 24, gap: 14, radius: 8 }).node;
        frame.effects = [{ type: "DROP_SHADOW", color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 }, radius: 12, spread: 0, visible: true, blendMode: "NORMAL" }];
        textNode(frame, `${name} / Familie`, family.name.toUpperCase(), decision, { size: 12, weight: 700, width: 520 });
        textNode(frame, `${name} / Zustand`, state, decision, { size: 21, weight: 700, width: 520 });
        textNode(frame, `${name} / Status`, dialogStatus(state), decision, { size: 12, weight: 700, width: 520 });
        textNode(frame, `${name} / Inhalt`, "Der Dialog zeigt Status, Begr\xFCndung und den n\xE4chsten sicheren Schritt. Lange Inhalte bleiben scrollbar.", decision, { size: 15, width: 520 });
        textNode(frame, `${name} / Aktionen`, "Schlie\xDFen \xB7 Zur\xFCck \xB7 Fortfahren / Erneut versuchen", decision, { size: 15, weight: 500, width: 520 });
        frame.setPluginData("ondaDialogFamily", family.name);
        frame.setPluginData("ondaDialogState", state);
        count += 1;
      }
      row += Math.ceil(family.states.length / 3);
    }
    return count;
  }
  function createMenus(section, decision) {
    const views = [
      ["Dokumentmen\xFC \xB7 geschlossen", "Mehr Aktionen \xB7 nicht ge\xF6ffnet"],
      ["Dokumentmen\xFC \xB7 offen", "Umbenennen \xB7 Duplizieren \xB7 Exportieren \xB7 Archivieren"],
      ["Quellenleser \xB7 offen", "Original verifiziert \xB7 Fundstelle \xFCbernehmen \xB7 Zur\xFCck"],
      ["Recherchelauf \xB7 pausiert", "Fortsetzen \xB7 Plan \xE4ndern \xB7 Lauf abbrechen"],
      ["Entscheidungsverlauf \xB7 gef\xFCllt", "\xDCbernommen \xB7 R\xFCckg\xE4ngig \xB7 Abgelehnt \xB7 G\xFCltigkeit ge\xE4ndert"],
      ["Leerer Zustand \xB7 Recovery", "Noch keine Daten \xB7 Importieren oder zum Editor zur\xFCckkehren"]
    ];
    for (const [index, [name, detail]] of views.entries()) {
      const frame = autoFrame(section, name, { x: 80 + index % 2 * 980, y: 140 + Math.floor(index / 2) * 560, width: 900, padding: 28, gap: 16, radius: name.includes("men\xFC \xB7 offen") ? 8 : 6 }).node;
      textNode(frame, `${name} / Titel`, name, decision, { size: 21, weight: 700, width: 820 });
      textNode(frame, `${name} / Inhalt`, detail, decision, { size: 15, width: 820 });
      textNode(frame, `${name} / Fokus`, "\u25CE Fokus sichtbar \xB7 Trefferfl\xE4chen mindestens 44 \xD7 44 px", decision, { size: 12, weight: 700, width: 820 });
    }
  }
  function createResponsiveDark(section, decision) {
    const widths = [1440, 1024, 720, 320];
    for (const [index, width] of widths.entries()) {
      const view = createEditorView(section, decision, `${width}px \xB7 ${width === 320 ? "Kleinbreite" : "Responsive"}`, 80, false, width);
      view.y = 120 + index * 1100;
    }
    const dark = createEditorView(section, decision, "1440px \xB7 Dark", 80, true, 1440);
    dark.y = 4520;
  }
  async function createPrototype(section, decision) {
    const flows = [
      ["Hauptablauf", "Bibliothek \u2192 Projekt \u2192 Dokument \u2192 Anmerkung \u2192 \xDCbernehmen \u2192 R\xFCckg\xE4ngig \u2192 Schlussaudit \u2192 Export"],
      ["Projektwissen", "Projektverst\xE4ndnis \u2192 Projektged\xE4chtnis / Argumentationsdossier / Sprache & Wirkung \u2192 Editor"],
      ["Quellen & Recherche", "Quellen \u2192 Import \u2192 Recherche planen \u2192 Lauf \u2192 Pr\xFCfung \u2192 Fundstelle \xFCbernehmen"],
      ["Agent & Beleg", "Aura \u2192 Agentengespr\xE4ch \u2192 Antwort \u2192 Fundstelle \u2192 Editor"]
    ];
    const frames = [];
    for (const [index, [name, path]] of flows.entries()) {
      const frame = autoFrame(section, `Prototyp / ${name}`, { x: 80, y: 120 + index * 500, width: 1940, padding: 32, gap: 20, radius: 6 }).node;
      frames.push(frame);
      textNode(frame, `Prototyp / ${name} / Titel`, name, decision, { size: 21, weight: 700, width: 1800 });
      textNode(frame, `Prototyp / ${name} / Pfad`, path, decision, { size: 15, weight: 500, width: 1800 });
      textNode(frame, `Prototyp / ${name} / Recovery`, "Fehler \u2192 Wiederholen / Einrichten / Korrigieren / Abbrechen \xB7 keine tote Zwischenstation", decision, { size: 12, weight: 700, width: 1800 });
    }
    for (const [index, frame] of frames.entries()) {
      const destination = frames[(index + 1) % frames.length];
      await frame.setReactionsAsync([{
        trigger: { type: "ON_CLICK" },
        actions: [{ type: "NODE", destinationId: destination.id, navigation: "NAVIGATE", transition: null, preserveScrollPosition: false }]
      }]);
      frame.setPluginData("ondaPrototypeReaction", "true");
    }
  }
  async function runDialogsAndSecondary(page, ledger) {
    await loadDecisionFonts(ledger.fontDecision);
    const agent = ensureSection(page, ledger, "07 \xB7 Agent & Quellen", 1700).node;
    createAgentAndSources(agent, ledger.fontDecision);
    const dialogs = ensureSection(page, ledger, "08 \xB7 Dialoge", 9800).node;
    const dialogStateCount = createDialogs(dialogs, ledger.fontDecision);
    const menus = ensureSection(page, ledger, "09 \xB7 Men\xFCs & Nebenansichten", 2200).node;
    createMenus(menus, ledger.fontDecision);
    const responsive = ensureSection(page, ledger, "10 \xB7 Responsive & Dark", 6200).node;
    createResponsiveDark(responsive, ledger.fontDecision);
    const prototype = ensureSection(page, ledger, "11 \xB7 Prototyp", 2400).node;
    await createPrototype(prototype, ledger.fontDecision);
    return { sections: 5, dialogFamilies: DIALOG_FAMILIES.length, dialogStates: dialogStateCount, responsiveWidths: 4, darkReferences: 1, prototypeFlows: 4 };
  }
  function collectOndaNodes(sections) {
    const nodes = [];
    function visit(node) {
      nodes.push(node);
      if ("children" in node) for (const child of node.children) visit(child);
    }
    for (const section of sections) visit(section);
    return nodes;
  }
  function paintsFromNodes(nodes) {
    const paints = [];
    for (const node of nodes) {
      for (const property of ["fills", "strokes"]) {
        if (!(property in node) || !Array.isArray(node[property])) continue;
        for (const paint of node[property]) {
          if ((paint == null ? void 0 : paint.type) === "SOLID" && paint.color) paints.push(paint.color);
        }
      }
      if ("effects" in node && Array.isArray(node.effects)) {
        for (const effect of node.effects) if (effect == null ? void 0 : effect.color) paints.push({ r: effect.color.r, g: effect.color.g, b: effect.color.b });
      }
    }
    return paints;
  }
  function radiiFromNodes(nodes) {
    const radii = [];
    for (const node of nodes) {
      if (!("cornerRadius" in node) || typeof node.cornerRadius !== "number") continue;
      radii.push({ value: node.cornerRadius, geometry: node.type === "ELLIPSE" ? "ELLIPSE" : "RECTANGLE", id: node.id, name: node.name });
    }
    return radii;
  }
  function currentBaselineEvidence(page, ledger) {
    const baselineRecords = readBaselineRecords(page, ledger);
    const baselineIdsInOrder = baselineRecords.map((record) => record.id);
    const baselineIds = new Set(baselineIdsInOrder);
    const records = orderRecordsByBaselineIds(collectRecordsFromDocument(baselineIds), baselineIdsInOrder);
    const currentById = new Map(records.map((record) => [record.id, hashBaselineRecords([record])]));
    const mismatches = baselineRecords.filter((record) => currentById.get(record.id) !== hashBaselineRecords([record])).map((record) => record.id);
    const currentHash = hashBaselineRecords(records);
    const topLevelIds = baselineRecords.filter((record) => record.parentId === page.id).map((record) => record.id);
    const presentTopLevel = page.children.filter((node) => topLevelIds.includes(node.id)).length;
    return {
      baselineRecords,
      records,
      currentHash,
      mismatches,
      presentTopLevel,
      pages: pageInvariantSnapshot()
    };
  }
  function renderRect(value) {
    const rect = (value == null ? void 0 : value.absoluteRenderBounds) || (value == null ? void 0 : value.absoluteBoundingBox) || (value == null ? void 0 : value.bounds);
    if (!rect || ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)) return null;
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }
  function rectanglesIntersect(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
  function geometryEvidence(page, sections, allNodes, ledger, baselineRecords) {
    const ondaRects = sections.map((node) => ({ id: node.id, name: node.name, rect: renderRect(node) })).filter((item) => item.rect);
    const baselineRects = baselineRecords.filter((record) => record.type !== "DOCUMENT" && record.type !== "PAGE").map((record) => ({ id: record.id, name: record.name, rect: renderRect(record) })).filter((item) => item.rect);
    const intersections = [];
    for (let left = 0; left < ondaRects.length; left += 1) {
      for (let right = left + 1; right < ondaRects.length; right += 1) {
        if (rectanglesIntersect(ondaRects[left].rect, ondaRects[right].rect)) intersections.push([ondaRects[left].name, ondaRects[right].name]);
      }
    }
    for (const onda of ondaRects) {
      for (const foreign of baselineRects) if (rectanglesIntersect(onda.rect, foreign.rect)) intersections.push([onda.name, foreign.name]);
    }
    const minOndaLeft = Math.min(...ondaRects.map((item) => item.rect.x));
    const maxBaselineRight = Math.max(0, ...baselineRecords.map(renderRect).filter(Boolean).map((rect) => rect.x + rect.width));
    const clearance = Number.isFinite(minOndaLeft) ? minOndaLeft - maxBaselineRight : 0;
    const overflowNodes = [];
    for (const frame of allNodes.filter((node) => node.type === "FRAME" && node.getPluginData("ondaResponsiveFrame"))) {
      const outer = renderRect(frame);
      if (!outer) continue;
      for (const descendant of frame.findAll(() => true)) {
        const inner = renderRect(descendant);
        if (inner && (inner.x < outer.x - 0.5 || inner.x + inner.width > outer.x + outer.width + 0.5)) overflowNodes.push(descendant.id);
      }
    }
    const undersizedHitTargets = allNodes.filter((node) => node.type === "INSTANCE").filter((node) => node.width < 44 || node.height < 44).map((node) => node.id);
    return { intersections, clearance, overflowNodes: [...new Set(overflowNodes)], undersizedHitTargets };
  }
  async function collectFoundationEvidence(foundationSection, fontDecision) {
    var _a, _b;
    function childFrame(name) {
      return foundationSection ? directChild(foundationSection, name, ["FRAME"]) : null;
    }
    function childNodes(parent, types = null) {
      if (!parent || !("children" in parent)) return [];
      return parent.children.filter((node) => !types || types.includes(node.type));
    }
    const expectedCollectionNames = new Set(Object.keys(FOUNDATION_EXPECTATIONS.collections));
    const allCollections = await figma.variables.getLocalVariableCollectionsAsync();
    const sourceCollections = allCollections.filter((collection) => expectedCollectionNames.has(collection.name));
    const sourceCollectionIds = new Set(sourceCollections.map((collection) => collection.id));
    const sourceVariables = (await figma.variables.getLocalVariablesAsync()).filter((variable) => sourceCollectionIds.has(variable.variableCollectionId));
    const collectionById = new Map(sourceCollections.map((collection) => [collection.id, collection]));
    const collections = sourceCollections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      owner: collection.getSharedPluginData("onda", "owner"),
      modes: collection.modes.map((mode) => ({ modeId: mode.modeId, name: mode.name }))
    }));
    const variables = sourceVariables.map((variable) => {
      var _a2, _b2;
      const collection = collectionById.get(variable.variableCollectionId);
      const modeId = ((_b2 = (_a2 = collection == null ? void 0 : collection.modes) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.modeId) || null;
      return {
        id: variable.id,
        collectionId: variable.variableCollectionId,
        collectionName: (collection == null ? void 0 : collection.name) || "",
        name: variable.name,
        owner: variable.getSharedPluginData("onda", "owner"),
        resolvedType: variable.resolvedType,
        scopes: [...variable.scopes],
        codeSyntax: cloneSerializable(variable.codeSyntax),
        modeId,
        value: modeId ? cloneSerializable(variable.valuesByMode[modeId]) : null
      };
    });
    const swatches = [];
    for (const parentName of ["Foundations / Graustufen", "Foundations / Semantic Light", "Foundations / Semantic Dark"]) {
      const parent = childFrame(parentName);
      for (const swatch of childNodes(parent, ["FRAME"]).filter((node) => node.name.startsWith("Swatch / "))) {
        const labelName = `${swatch.name} / Label`;
        const label = directChild(swatch, labelName, ["TEXT"]);
        swatches.push({
          nodeId: swatch.id,
          name: swatch.name,
          parentName: (parent == null ? void 0 : parent.name) || "",
          type: swatch.type,
          fills: collectVisibleFillBindings(swatch.fills),
          labelName: (label == null ? void 0 : label.name) || "",
          labelFills: collectVisibleFillBindings(label == null ? void 0 : label.fills),
          labelCharactersLength: ((_a = label == null ? void 0 : label.characters) == null ? void 0 : _a.length) || 0,
          labelTextRanges: collectTextRangeBindings(label)
        });
      }
    }
    const spacing = childFrame("Foundations / Spacing");
    const spacingBars = childNodes(spacing, ["FRAME"]).flatMap((row) => childNodes(row, ["RECTANGLE"]).map((bar) => ({
      nodeId: bar.id,
      name: bar.name,
      parentName: row.name,
      containerName: (spacing == null ? void 0 : spacing.name) || "",
      type: bar.type,
      width: bar.width,
      fills: collectVisibleFillBindings(bar.fills),
      fieldVariableIds: collectFieldVariableIds(bar, ["width"])
    })));
    const radius = childFrame("Foundations / Radien");
    const radiusFields = ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius", "maxWidth", "maxHeight"];
    const radiusSamples = childNodes(radius, ["RECTANGLE", "ELLIPSE"]).map((sample) => ({
      nodeId: sample.id,
      name: sample.name,
      parentName: (radius == null ? void 0 : radius.name) || "",
      type: sample.type,
      width: sample.width,
      height: sample.height,
      cornerRadius: typeof sample.cornerRadius === "number" ? sample.cornerRadius : null,
      fills: collectVisibleFillBindings(sample.fills),
      fieldVariableIds: collectFieldVariableIds(sample, radiusFields)
    }));
    const typography = childFrame("Foundations / Typografie");
    const textSpecimens = childNodes(typography, ["TEXT"]).filter((node) => node.name.startsWith("Typografie / ")).map((node) => ({
      nodeId: node.id,
      name: node.name,
      parentName: (typography == null ? void 0 : typography.name) || "",
      type: node.type,
      textStyleId: node.textStyleId,
      fills: collectVisibleFillBindings(node.fills),
      charactersLength: node.characters.length,
      textRanges: collectTextRangeBindings(node),
      fieldVariableIds: collectFieldVariableIds(node, ["fontSize", "fontWeight"])
    }));
    const localTextStyles = (await figma.getLocalTextStylesAsync()).filter((style) => style.name.startsWith("Onda/Type/"));
    const textStyles = localTextStyles.map((style) => ({
      id: style.id,
      name: style.name,
      owner: style.getSharedPluginData("onda", "owner"),
      fontName: cloneSerializable(style.fontName),
      fontSize: style.fontSize,
      lineHeight: cloneSerializable(style.lineHeight),
      letterSpacing: cloneSerializable(style.letterSpacing),
      textCase: style.textCase,
      textDecoration: style.textDecoration,
      fieldVariableIds: collectFieldVariableIds(style, ["fontSize", "fontWeight"])
    }));
    const localEffectStyles = (await figma.getLocalEffectStylesAsync()).filter((style) => style.name.startsWith("Onda/Shadow/"));
    const effectStyles = localEffectStyles.map((style) => ({
      id: style.id,
      name: style.name,
      owner: style.getSharedPluginData("onda", "owner"),
      effects: cloneSerializable(style.effects)
    }));
    const effectConsumers = [];
    for (const style of localEffectStyles) {
      const consumers = await style.getStyleConsumersAsync();
      for (const consumer of consumers) {
        effectConsumers.push({
          nodeId: consumer.node.id,
          name: consumer.node.name,
          parentName: ((_b = consumer.node.parent) == null ? void 0 : _b.name) || "",
          type: consumer.node.type,
          effectStyleId: consumer.node.effectStyleId,
          fields: [...consumer.fields].sort(),
          fills: collectVisibleFillBindings(consumer.node.fills)
        });
      }
    }
    return {
      fontDecision: cloneSerializable(fontDecision),
      collections,
      variables,
      swatches,
      spacingBars,
      radiusSamples,
      textStyles,
      textSpecimens,
      effectStyles,
      effectConsumers
    };
  }
  async function runVerify() {
    const inspection = await inspectCurrentTarget();
    const page = figma.currentPage;
    const authorization = authorizeMutation(inspection.target);
    if (!authorization.ok) throw new Error(authorization.warning || inspection.target.warning);
    const ledger = readLedger(page);
    if (!ledger) throw new Error("Noch kein Onda-Ledger vorhanden. Inspect und mindestens eine Mutationsphase ausf\xFChren.");
    const requiredNames = new Set(SECTION_DEFINITIONS.map((section) => section.name));
    const sections = page.children.filter((node) => requiredNames.has(node.name));
    const allNodes = collectOndaNodes(sections);
    const annotationViews2 = allNodes.map((node) => {
      var _a, _b;
      return {
        kind: (_a = node.getPluginData) == null ? void 0 : _a.call(node, "ondaAnnotationKind"),
        view: (_b = node.getPluginData) == null ? void 0 : _b.call(node, "ondaAnnotationView")
      };
    }).filter((item) => item.kind && item.view);
    const dialogStates = allNodes.map((node) => {
      var _a, _b;
      return {
        family: (_a = node.getPluginData) == null ? void 0 : _a.call(node, "ondaDialogFamily"),
        state: (_b = node.getPluginData) == null ? void 0 : _b.call(node, "ondaDialogState")
      };
    }).filter((item) => item.family && item.state);
    const componentSets = COMPONENT_DEFINITIONS.map((definition2) => {
      const set = allNodes.find((node) => node.type === "COMPONENT_SET" && node.name === definition2.name);
      const variants = (set == null ? void 0 : set.children.filter((node) => node.type === "COMPONENT")) || [];
      return set ? {
        id: definition2.id,
        variants: variants.length,
        autoLayout: variants.length > 0 && variants.every((node) => node.layoutMode !== "NONE"),
        bound: set.getPluginData("ondaVariablesBound") === "true" && variants.every((node) => node.getPluginData("ondaVariablesBound") === "true")
      } : null;
    }).filter(Boolean);
    const baseline = currentBaselineEvidence(page, ledger);
    const geometry = geometryEvidence(page, sections, allNodes, ledger, baseline.baselineRecords);
    const paints = paintsFromNodes(allNodes);
    const radii = radiiFromNodes(allNodes);
    const foundationSection = sections.find((node) => node.name === "01 \xB7 Foundations");
    const foundationNodes = foundationSection ? collectOndaNodes([foundationSection]) : [];
    const foundationEvidence = await collectFoundationEvidence(foundationSection, ledger.fontDecision);
    const effectsValid = allNodes.every((node) => !("effects" in node) || !Array.isArray(node.effects) || node.effects.every((effect) => !effect.color || isGrayColor(effect.color)));
    const fontStylesValid = TYPE_WEIGHTS.every((weight) => {
      var _a, _b;
      return (_b = (_a = ledger.fontDecision) == null ? void 0 : _a.styles) == null ? void 0 : _b[weight];
    });
    const reactionCount = (await Promise.all(allNodes.map(async (node) => typeof node.getReactionsAsync === "function" ? (await node.getReactionsAsync()).length : 0))).reduce((total, count) => total + count, 0);
    const report = buildVerificationReport(__spreadProps(__spreadValues({
      targetAuthorized: authorization.ok,
      pageCount: figma.root.children.length,
      pageName: page.name,
      sections: sections.map((section) => {
        var _a, _b;
        return {
          name: section.name,
          type: section.type,
          parentType: (_a = section.parent) == null ? void 0 : _a.type,
          parentName: (_b = section.parent) == null ? void 0 : _b.name,
          owner: section.getPluginData(CREATED_MARKER_KEY)
        };
      }),
      annotationViews: annotationViews2,
      dialogStates,
      componentSets,
      instanceCount: allNodes.filter((node) => node.type === "INSTANCE").length,
      repeatedScreenInstanceCount: allNodes.filter((node) => node.type === "INSTANCE" && node.getPluginData("ondaRepeatedScreenInstance") === "true").length,
      foundation: __spreadValues({
        paintsValid: paints.every(isGrayColor),
        radiiValid: radii.every((radius) => isValidRadius(radius.value, radius.geometry)),
        effectsValid,
        fontsValid: fontStylesValid,
        docsBound: foundationNodes.length > 0 && foundationNodes.every((node) => node.getPluginData("ondaFoundationBound") === "true")
      }, foundationEvidence)
    }, geometry), {
      reactionCount,
      requiredReactionCount: 4,
      phases: ledger.phases,
      paints,
      radii,
      topLevelNames: sections.map((section) => section.name),
      baselineTopLevelCount: ledger.baseline.topLevelCount,
      preservedTopLevelCount: baseline.presentTopLevel,
      baselineHash: ledger.baseline.hash,
      currentBaselineHash: baseline.currentHash,
      baselineMismatches: baseline.mismatches,
      baselinePages: ledger.baseline.pages,
      currentPages: baseline.pages
    }));
    report.targetFileKey = figma.fileKey || null;
    report.targetPageName = page.name;
    report.expectedFileKey = TARGET_FILE_KEY;
    report.fontFallback = ledger.fontDecision.exact ? "" : ledger.fontDecision.warning;
    report.planErrors = validateDesignPlan(buildDesignPlan());
    report.sectionTypeFallbacks = SECTION_DEFINITIONS.filter((definition2) => {
      const matching = page.children.find((node) => node.name === definition2.name);
      return matching && matching.type !== "SECTION";
    }).map((definition2) => definition2.name);
    report.nonGrayPaintNodeCount = paints.filter((paint) => !isGrayColor(paint)).length;
    report.invalidRadiusNodes = radii.filter((radius) => !isValidRadius(radius.value, radius.geometry)).map((radius) => ({ id: radius.id, name: radius.name, value: radius.value }));
    report.preservedBaselineHash = report.preservedBaselineHash && baseline.mismatches.length === 0;
    report.hardPass = report.hardPass && report.planErrors.length === 0;
    report.baselineHash = ledger.baseline.hash;
    report.currentBaselineHash = baseline.currentHash;
    return report;
  }
  function postResult(command, ok, message, counts = null, unlockMutations = false) {
    figma.ui.postMessage({ type: "phase-result", command, ok, message, counts, unlockMutations });
  }
  async function handleCommand(command) {
    var _a, _b, _c, _d;
    if (command === "inspect") {
      const inspection = await inspectCurrentTarget();
      const authorization = authorizeMutation(inspection.target);
      postResult(command, Boolean(inspection.target.ok || inspection.target.readOnlyOk), inspectionMessage(inspection), {
        pageCount: inspection.pageCount,
        baselineTopLevelCount: inspection.ledger ? inspection.ledger.baseline.topLevelCount : inspection.pendingBaseline.topLevelCount,
        baselineNodeCount: inspection.ledger ? (_c = (_b = inspection.ledger.baseline.recordCount) != null ? _b : (_a = inspection.ledger.baseline.nodeIds) == null ? void 0 : _a.length) != null ? _c : 0 : inspection.pendingBaseline.records.length,
        fontFamily: inspection.fontDecision.family,
        exactFont: inspection.fontDecision.exact,
        targetFallback: inspection.target.fallback,
        completedPhases: Object.entries(((_d = inspection.ledger) == null ? void 0 : _d.phases) || {}).filter(([, value]) => value.status === "success").map(([id]) => id)
      }, authorization.ok);
      return;
    }
    if (command === "verify") {
      const ledger = readLedger(figma.currentPage);
      const transition = validatePhaseTransition(command, (ledger == null ? void 0 : ledger.phases) || {});
      if (!transition.ok) throw new Error(transition.warning);
      const report = await runVerify();
      const hardPass = report.hardPass;
      postResult(command, hardPass, hardPass ? "Alle strukturellen Hard Gates bestanden." : "Verify hat offene Hard Gates gefunden.", report, true);
      return;
    }
    async function runMutation({ page, ledger }) {
      const transition = validatePhaseTransition(command, ledger.phases);
      if (!transition.ok) throw new Error(transition.warning);
      let counts;
      if (command === "foundations") counts = await runFoundations(page, ledger);
      else if (command === "core-views") counts = await runCoreViews(page, ledger);
      else if (command === "dialogs-and-secondary") counts = await runDialogsAndSecondary(page, ledger);
      else if (command.startsWith("component-")) counts = await runComponent(page, ledger, command.slice("component-".length));
      else if (command.startsWith("annotations-")) counts = await runAnnotationBatch(page, ledger, Number(command.slice("annotations-".length)) - 1);
      else throw new Error(`Unbekannter Befehl: ${command}`);
      markPhase(page, ledger, command, counts);
      postResult(command, true, "Phase erfolgreich abgeschlossen und strukturell gez\xE4hlt.", counts, true);
    }
    if (command === "foundations") {
      await executeFoundationMutation({
        preflight: preflightFoundationMutation,
        requireContext: requireMutationContext,
        mutate: runMutation
      });
      return;
    }
    const context = await requireMutationContext();
    await runMutation(context);
  }
  figma.ui.onmessage = async (message) => {
    if (!message) return;
    try {
      if (message.type !== "run-command") return;
      await handleCommand(message.command);
    } catch (error) {
      postResult(message.command || "unknown", false, error instanceof Error ? error.message : String(error), null, false);
    }
  };
})();
