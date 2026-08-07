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
  var __objRest = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };

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
  function componentRole(name, type) {
    return Object.freeze({ name, type });
  }
  function componentVariant(name, copy, options = {}) {
    var _a, _b;
    const settings = typeof options === "boolean" ? { inverted: options } : options;
    const inverted = settings.inverted === true;
    return Object.freeze({
      name,
      copy: Object.freeze(__spreadValues({}, copy)),
      surfaceToken: settings.surfaceToken || (inverted ? "color/inverted" : "color/surface"),
      textToken: settings.textToken || (inverted ? "color/on-inverted" : "color/text"),
      strokeWeight: (_a = settings.strokeWeight) != null ? _a : name.includes("Focus") ? 2 : 1,
      opacity: (_b = settings.opacity) != null ? _b : name.includes("Disabled") ? 0.45 : 1
    });
  }
  function componentDefinition({
    id,
    name,
    label,
    roles,
    labelRole,
    variants,
    tier = 0,
    radius = 4,
    radiusToken = "radius/control",
    targetHeight = 44,
    gap = 8,
    gapToken = "spacing/8",
    padding = { top: 12, right: 16, bottom: 12, left: 16 },
    paddingTokens = { top: "spacing/12", right: "spacing/16", bottom: "spacing/12", left: "spacing/16" },
    direction = "HORIZONTAL",
    effectStyleName = null
  }) {
    return Object.freeze({
      id,
      name,
      label,
      tier,
      roles: Object.freeze(roles),
      labelRole,
      radius,
      radiusToken,
      targetHeight,
      gap,
      gapToken,
      padding: Object.freeze(__spreadValues({}, padding)),
      paddingTokens: Object.freeze(__spreadValues({}, paddingTokens)),
      direction,
      effectStyleName,
      variants: Object.freeze(variants)
    });
  }
  var COMPONENT_DEFINITIONS = Object.freeze([
    componentDefinition({
      id: "button",
      name: "Onda/Button",
      label: "Button",
      labelRole: "Label",
      roles: [componentRole("Icon", "TEXT"), componentRole("Label", "TEXT")],
      variants: [
        componentVariant("Kind=Primary, State=Default", { Icon: "\u2192", Label: "Weiter" }, true),
        componentVariant("Kind=Primary, State=Focus", { Icon: "\u25CE", Label: "Weiter" }, true),
        componentVariant("Kind=Secondary, State=Default", { Icon: "\u2190", Label: "Zur\xFCck" }),
        componentVariant("Kind=Secondary, State=Focus", { Icon: "\u25CE", Label: "Zur\xFCck" }),
        componentVariant("Kind=Ghost, State=Default", { Icon: "\u2026", Label: "Mehr anzeigen" }),
        componentVariant("Kind=Ghost, State=Focus", { Icon: "\u25CE", Label: "Mehr anzeigen" }),
        componentVariant("Kind=Destructive, State=Default", { Icon: "!", Label: "L\xF6schen" }, true),
        componentVariant("Kind=Destructive, State=Focus", { Icon: "!", Label: "L\xF6schen \xB7 Fokus" }, true)
      ]
    }),
    componentDefinition({
      id: "icon-button",
      name: "Onda/Icon Button",
      label: "Icon Button",
      labelRole: "Label",
      roles: [componentRole("Icon", "TEXT"), componentRole("Label", "TEXT"), componentRole("Description", "TEXT")],
      variants: [
        componentVariant("State=Default", { Icon: "+", Label: "Hinzuf\xFCgen", Description: "Bereit" }),
        componentVariant("State=Hover", { Icon: "+", Label: "Hinzuf\xFCgen", Description: "Zeiger dar\xFCber" }),
        componentVariant("State=Focus", { Icon: "+", Label: "Hinzuf\xFCgen", Description: "Tastaturfokus" }),
        componentVariant("State=Disabled", { Icon: "+", Label: "Hinzuf\xFCgen", Description: "Nicht verf\xFCgbar" }),
        componentVariant("State=Pressed", { Icon: "+", Label: "Hinzuf\xFCgen", Description: "Wird ausgel\xF6st" }, true)
      ]
    }),
    componentDefinition({
      id: "status-symbol",
      name: "Onda/Status Symbol",
      label: "Status Symbol",
      labelRole: "Label",
      roles: [componentRole("Dot", "ELLIPSE"), componentRole("Symbol", "TEXT"), componentRole("Label", "TEXT")],
      variants: [
        componentVariant("Status=Ready", { Symbol: "\u2713", Label: "Bereit" }),
        componentVariant("Status=Working", { Symbol: "\u2026", Label: "Arbeitet" }),
        componentVariant("Status=Warning", { Symbol: "!", Label: "Pr\xFCfen" }),
        componentVariant("Status=Error", { Symbol: "\xD7", Label: "Fehler" })
      ]
    }),
    componentDefinition({
      id: "tag",
      name: "Onda/Tag",
      label: "Tag",
      labelRole: "Label",
      roles: [componentRole("Icon", "TEXT"), componentRole("Label", "TEXT")],
      variants: [
        componentVariant("Kind=Neutral", { Icon: "\u2014", Label: "Neutral" }),
        componentVariant("Kind=Selected", { Icon: "\u2713", Label: "Ausgew\xE4hlt" }, true),
        componentVariant("Kind=Source", { Icon: "\xA7", Label: "Quelle" }),
        componentVariant("Kind=Warning", { Icon: "!", Label: "Pr\xFCfen" })
      ]
    }),
    componentDefinition({
      id: "field",
      name: "Onda/Field",
      label: "Field",
      labelRole: "Label",
      tier: 1,
      direction: "VERTICAL",
      roles: [componentRole("Label", "TEXT"), componentRole("Input", "TEXT"), componentRole("Hint", "TEXT"), componentRole("Status", "TEXT")],
      variants: [
        componentVariant("State=Empty", { Label: "Arbeitstitel", Input: "Arbeitstitel eingeben", Hint: "Pflichtfeld", Status: "\u25CB Leer" }),
        componentVariant("State=Filled", { Label: "Arbeitstitel", Input: "Die leise Architektur", Hint: "Kann sp\xE4ter ge\xE4ndert werden", Status: "\u2713 Ausgef\xFCllt" }),
        componentVariant("State=Focus", { Label: "Arbeitstitel", Input: "Die leise Architektur bearbeiten", Hint: "Eingabe aktiv", Status: "\u25CE Fokus" }, { strokeWeight: 2 }),
        componentVariant("State=Error", { Label: "Arbeitstitel", Input: "Kein Arbeitstitel", Hint: "Arbeitstitel ist erforderlich", Status: "! Fehler" }, { strokeWeight: 2 })
      ]
    }),
    componentDefinition({
      id: "search",
      name: "Onda/Search",
      label: "Search",
      labelRole: "Input",
      tier: 1,
      roles: [componentRole("Icon", "TEXT"), componentRole("Input", "TEXT"), componentRole("Clear", "TEXT"), componentRole("Count", "TEXT")],
      variants: [
        componentVariant("State=Empty", { Icon: "\u2315", Input: "Suche starten", Clear: "\u2014", Count: "0 Treffer" }),
        componentVariant("State=Typing", { Icon: "\u2315", Input: "Argumentation", Clear: "\xD7 L\xF6schen", Count: "Suche l\xE4uft" }, { strokeWeight: 2 }),
        componentVariant("State=Results", { Icon: "\u2315", Input: "Argumentation", Clear: "\xD7 L\xF6schen", Count: "12 Treffer" }),
        componentVariant("State=No Results", { Icon: "\u2315", Input: "Argumentation", Clear: "\xD7 L\xF6schen", Count: "0 Treffer \xB7 Suchbegriff \xE4ndern" }, { strokeWeight: 2, textToken: "color/text-muted" })
      ]
    }),
    componentDefinition({
      id: "select",
      name: "Onda/Select",
      label: "Select",
      labelRole: "Label",
      tier: 1,
      direction: "VERTICAL",
      roles: [componentRole("Label", "TEXT"), componentRole("Value", "TEXT"), componentRole("Chevron", "TEXT"), componentRole("Status", "TEXT")],
      variants: [
        componentVariant("State=Closed", { Label: "Dokumenttyp", Value: "Typ ausw\xE4hlen", Chevron: "\u2304", Status: "\u25CB Geschlossen" }),
        componentVariant("State=Open", { Label: "Dokumenttyp", Value: "Essay \xB7 Bericht \xB7 Notiz", Chevron: "\u2303", Status: "\u25CE Offen" }, { strokeWeight: 2 }),
        componentVariant("State=Selected", { Label: "Dokumenttyp", Value: "Essay", Chevron: "\u2304", Status: "\u2713 Ausgew\xE4hlt" }, { inverted: true, strokeWeight: 2 })
      ]
    }),
    componentDefinition({
      id: "composer",
      name: "Onda/Composer",
      label: "Composer",
      labelRole: "Input",
      tier: 1,
      direction: "VERTICAL",
      targetHeight: 88,
      roles: [componentRole("Prompt", "TEXT"), componentRole("Input", "TEXT"), componentRole("Submit", "TEXT"), componentRole("Status", "TEXT")],
      variants: [
        componentVariant("State=Empty", { Prompt: "Nachricht an den Agenten", Input: "Frage oder Auftrag eingeben", Submit: "Senden", Status: "\u25CB Bereit" }),
        componentVariant("State=Draft", { Prompt: "Nachricht an den Agenten", Input: "Pr\xFCfe die Argumentation auf Belegl\xFCcken.", Submit: "Senden", Status: "\u25CF Entwurf" }, { strokeWeight: 2 }),
        componentVariant("State=Sending", { Prompt: "Nachricht an den Agenten", Input: "Pr\xFCfe die Argumentation auf Belegl\xFCcken.", Submit: "Senden", Status: "\u2026 Wird gesendet" }, { inverted: true, strokeWeight: 2 }),
        componentVariant("State=Error", { Prompt: "Nachricht an den Agenten", Input: "Pr\xFCfe die Argumentation auf Belegl\xFCcken.", Submit: "Senden", Status: "! Fehler \xB7 Erneut versuchen" }, { strokeWeight: 2 })
      ]
    }),
    componentDefinition({
      id: "menu-item",
      name: "Onda/Menu Item",
      label: "Menu Item",
      labelRole: "Label",
      tier: 1,
      radius: 0,
      radiusToken: "radius/none",
      roles: [componentRole("Icon", "TEXT"), componentRole("Label", "TEXT"), componentRole("Shortcut", "TEXT")],
      variants: [
        componentVariant("State=Default", { Icon: "\xA7", Label: "Quelle \xF6ffnen", Shortcut: "\u21B5" }),
        componentVariant("State=Hover", { Icon: "\u2192", Label: "Quelle \xF6ffnen", Shortcut: "\u21B5 Hover" }, { strokeWeight: 2 }),
        componentVariant("State=Selected", { Icon: "\u2713", Label: "Quelle \xF6ffnen", Shortcut: "\u21B5 Ausgew\xE4hlt" }, { inverted: true, strokeWeight: 2 }),
        componentVariant("State=Disabled", { Icon: "\xD7", Label: "Quelle \xF6ffnen", Shortcut: "Nicht verf\xFCgbar" }, { opacity: 0.45, textToken: "color/text-muted" })
      ]
    }),
    componentDefinition({
      id: "nav-item",
      name: "Onda/Nav Item",
      label: "Nav Item",
      labelRole: "Label",
      tier: 1,
      radius: 0,
      radiusToken: "radius/none",
      gap: 12,
      gapToken: "spacing/12",
      roles: [componentRole("Icon", "TEXT"), componentRole("Label", "TEXT"), componentRole("Count", "TEXT"), componentRole("Status", "TEXT")],
      variants: [
        componentVariant("State=Default", { Icon: "\u25A4", Label: "Dokumente", Count: "12", Status: "Verf\xFCgbar" }),
        componentVariant("State=Active", { Icon: "\u25CF", Label: "Dokumente", Count: "12", Status: "Aktiv" }, { inverted: true, strokeWeight: 2 }),
        componentVariant("State=Hover", { Icon: "\u2192", Label: "Dokumente", Count: "12", Status: "Bereit zum \xD6ffnen" }, { strokeWeight: 2 }),
        componentVariant("State=Collapsed", { Icon: "\u25A4", Label: "Dokumente", Count: "12", Status: "Eingeklappt" }, { opacity: 0.6, textToken: "color/text-muted" })
      ]
    }),
    componentDefinition({
      id: "list-row",
      name: "Onda/List Row",
      label: "List Row",
      labelRole: "Title",
      tier: 1,
      radius: 0,
      radiusToken: "radius/none",
      targetHeight: 52,
      gap: 12,
      gapToken: "spacing/12",
      roles: [componentRole("Leading", "TEXT"), componentRole("Title", "TEXT"), componentRole("Meta", "TEXT"), componentRole("Status", "TEXT"), componentRole("Action", "TEXT")],
      variants: [
        componentVariant("State=Default", { Leading: "\u25A4", Title: "Projekt Nordstern", Meta: "3 Dokumente", Status: "Zuletzt bearbeitet", Action: "\xD6ffnen" }),
        componentVariant("State=Selected", { Leading: "\u25CF", Title: "Dokument: Die leise Architektur", Meta: "Projekt Nordstern", Status: "Ausgew\xE4hlt", Action: "\xD6ffnen" }, { inverted: true, strokeWeight: 2 }),
        componentVariant("State=Hover", { Leading: "\u2192", Title: "Projekt Nordstern", Meta: "3 Dokumente", Status: "Bereit", Action: "\xD6ffnen" }, { strokeWeight: 2 }),
        componentVariant("State=Trash", { Leading: "\u232B", Title: "Dokument: Alte Fassung", Meta: "Papierkorb", Status: "Wird gel\xF6scht", Action: "Endg\xFCltig l\xF6schen" }, { inverted: true, strokeWeight: 2 }),
        componentVariant("State=Error", { Leading: "!", Title: "Dokument: Die leise Architektur", Meta: "\xC4nderungen nicht geladen", Status: "Fehler", Action: "Erneut versuchen" }, { strokeWeight: 2 })
      ]
    }),
    componentDefinition({
      id: "mode-toggle",
      name: "Onda/Mode Toggle",
      label: "Mode Toggle",
      labelRole: "Text Label",
      tier: 1,
      roles: [componentRole("Text Label", "TEXT"), componentRole("Note Label", "TEXT"), componentRole("Indicator", "TEXT")],
      variants: [
        componentVariant("Mode=Text, State=Active", { "Text Label": "Text", "Note Label": "Notiz", Indicator: "Textmodus aktiv" }, { inverted: true, strokeWeight: 2 }),
        componentVariant("Mode=Notiz, State=Active", { "Text Label": "Text", "Note Label": "Notiz", Indicator: "Notizmodus aktiv" }, { strokeWeight: 2 }),
        componentVariant("Mode=Text, State=Disabled", { "Text Label": "Text", "Note Label": "Notiz", Indicator: "Textmodus deaktiviert" }, { opacity: 0.45, textToken: "color/text-muted" })
      ]
    }),
    componentDefinition({
      id: "review-bar",
      name: "Onda/Review Bar",
      label: "Review Bar",
      labelRole: "Message",
      tier: 1,
      radius: 0,
      radiusToken: "radius/none",
      targetHeight: 64,
      gap: 12,
      gapToken: "spacing/12",
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      paddingTokens: { top: "spacing/16", right: "spacing/16", bottom: "spacing/16", left: "spacing/16" },
      roles: [componentRole("Symbol", "TEXT"), componentRole("Message", "TEXT"), componentRole("Primary Action", "TEXT"), componentRole("Secondary Action", "TEXT")],
      variants: [
        componentVariant("Status=Open", { Symbol: "\u25CE", Message: "3 Hinweise zur Pr\xFCfung", "Primary Action": "N\xE4chster Hinweis", "Secondary Action": "Alle anzeigen" }),
        componentVariant("Status=Saving", { Symbol: "\u2026", Message: "\xC4nderungen werden gespeichert \u2026", "Primary Action": "Speichern", "Secondary Action": "Abbrechen" }, { strokeWeight: 2, opacity: 0.75 }),
        componentVariant("Status=Saved", { Symbol: "\u2713", Message: "\xC4nderungen gespeichert", "Primary Action": "Weiter pr\xFCfen", "Secondary Action": "R\xFCckg\xE4ngig" }, { inverted: true }),
        componentVariant("Status=Error", { Symbol: "!", Message: "Speichern fehlgeschlagen", "Primary Action": "Erneut versuchen", "Secondary Action": "Exportieren" }, { inverted: true, strokeWeight: 2 }),
        componentVariant("Status=Quiet", { Symbol: "\u2014", Message: "Anmerkungen sind ruhig gestellt", "Primary Action": "Anmerkungen zeigen", "Secondary Action": "Schlie\xDFen" }, { opacity: 0.6, textToken: "color/text-muted" })
      ]
    }),
    componentDefinition({
      id: "empty-state",
      name: "Onda/Empty State",
      label: "Empty State",
      labelRole: "Title",
      tier: 1,
      radius: 6,
      radiusToken: "radius/static",
      targetHeight: 160,
      gap: 16,
      gapToken: "spacing/16",
      direction: "VERTICAL",
      padding: { top: 32, right: 32, bottom: 32, left: 32 },
      paddingTokens: { top: "spacing/32", right: "spacing/32", bottom: "spacing/32", left: "spacing/32" },
      roles: [componentRole("Symbol", "TEXT"), componentRole("Title", "TEXT"), componentRole("Description", "TEXT"), componentRole("Action", "TEXT")],
      variants: [
        componentVariant("Context=Library", { Symbol: "+", Title: "Noch keine Projekte", Description: "Erstelle ein Projekt, um Dokumente zu organisieren.", Action: "Projekt erstellen" }),
        componentVariant("Context=No Active Annotation", { Symbol: "\u25CB", Title: "Keine aktive Anmerkung", Description: "W\xE4hle eine Anmerkung im Text aus, um sie zu pr\xFCfen.", Action: "Anmerkungen anzeigen" }, { opacity: 0.8, textToken: "color/text-muted" }),
        componentVariant("Context=Recoverable Error", { Symbol: "!", Title: "Inhalt konnte nicht geladen werden", Description: "Deine Eingabe bleibt erhalten. Versuche es erneut.", Action: "Erneut versuchen" }, { inverted: true, strokeWeight: 2 })
      ]
    }),
    componentDefinition({
      id: "annotation-anchor",
      name: "Onda/Annotation Anchor",
      label: "Annotation Anchor",
      labelRole: "Label",
      tier: 2,
      roles: [componentRole("Symbol", "TEXT"), componentRole("Label", "TEXT"), componentRole("Count", "TEXT")],
      variants: [
        componentVariant("Kind=Text, State=Idle", { Symbol: "\xB6", Label: "Textanmerkungen", Count: "3 offen" }),
        componentVariant("Kind=Text, State=Active", { Symbol: "\u25CF", Label: "Textanmerkungen", Count: "3 aktiv" }, { inverted: true, strokeWeight: 2 }),
        componentVariant("Kind=Note, State=Idle", { Symbol: "\u25C7", Label: "Notizen", Count: "2 offen" }),
        componentVariant("Kind=Note, State=Active", { Symbol: "\u25CF", Label: "Notizen", Count: "2 aktiv" }, { inverted: true, strokeWeight: 2 })
      ]
    }),
    componentDefinition({
      id: "annotation-form",
      name: "Onda/Annotation Form",
      label: "Annotation Form",
      labelRole: "Label",
      tier: 2,
      direction: "VERTICAL",
      targetHeight: 180,
      gap: 12,
      gapToken: "spacing/12",
      padding: { top: 24, right: 24, bottom: 24, left: 24 },
      paddingTokens: { top: "spacing/24", right: "spacing/24", bottom: "spacing/24", left: "spacing/24" },
      roles: [componentRole("Label", "TEXT"), componentRole("Input", "TEXT"), componentRole("Preview", "TEXT"), componentRole("Primary Action", "TEXT"), componentRole("Secondary Action", "TEXT"), componentRole("Help", "TEXT")],
      variants: [
        componentVariant("Form=Correction", { Label: "Korrektur", Input: "Originaltext ersetzen", Preview: "Vorschau der Korrektur", "Primary Action": "Korrektur \xFCbernehmen", "Secondary Action": "Verwerfen", Help: "Ersetzt nur die markierte Stelle." }),
        componentVariant("Form=Rewrite", { Label: "Neu formulieren", Input: "Alternative Formulierung", Preview: "Vorschau der Neufassung", "Primary Action": "Neufassung \xFCbernehmen", "Secondary Action": "Original behalten", Help: "Ersetzt den markierten Textabschnitt." }),
        componentVariant("Form=Insertion", { Label: "Einf\xFCgung", Input: "Erg\xE4nzenden Text eingeben", Preview: "Einf\xFCgung an der markierten Stelle", "Primary Action": "Einf\xFCgen", "Secondary Action": "Abbrechen", Help: "F\xFCgt Text ein, ohne vorhandenen Text zu l\xF6schen." }),
        componentVariant("Form=Slot", { Label: "Position", Input: "Zielposition w\xE4hlen", Preview: "Vorschau der neuen Reihenfolge", "Primary Action": "Verschieben", "Secondary Action": "Position behalten", Help: "Verschiebt einen bestehenden Block." }),
        componentVariant("Form=Region", { Label: "Mehrere Stellen", Input: "Betroffene Fundstellen pr\xFCfen", Preview: "Vorschau aller \xC4nderungen", "Primary Action": "Alle \xC4nderungen \xFCbernehmen", "Secondary Action": "Einzeln pr\xFCfen", Help: "\xC4ndert mehrere markierte Stellen." }),
        componentVariant("Form=Source", { Label: "Quelle", Input: "Fundstelle oder Quelle pr\xFCfen", Preview: "Quelle wird am Hinweis verkn\xFCpft", "Primary Action": "Quelle verkn\xFCpfen", "Secondary Action": "Quelle \xF6ffnen", Help: "Fundstelle erst nach Pr\xFCfung am Original \xFCbernehmen." }),
        componentVariant("Form=Compare", { Label: "Vergleich", Input: "Varianten gegen\xFCberstellen", Preview: "Unterschiede pr\xFCfen", "Primary Action": "Variante \xFCbernehmen", "Secondary Action": "Zur\xFCck", Help: "\xDCbernimmt nur die ausgew\xE4hlte Variante." }),
        componentVariant("Form=Dialogue", { Label: "R\xFCckfrage", Input: "Antwort eingeben", Preview: "Antwort bleibt als Dialognotiz", "Primary Action": "Antwort senden", "Secondary Action": "Sp\xE4ter", Help: "Keine automatische Text\xE4nderung verf\xFCgbar." }),
        componentVariant("Form=Title", { Label: "\xDCberschrift", Input: "Neue \xDCberschrift eingeben", Preview: "Vorschau der \xDCberschrift", "Primary Action": "\xDCberschrift \xFCbernehmen", "Secondary Action": "Zur\xFCcksetzen", Help: "Ersetzt ausschlie\xDFlich den Titel." })
      ]
    }),
    componentDefinition({
      id: "annotation-card",
      name: "Onda/Annotation Card",
      label: "Annotation Card",
      labelRole: "Title",
      tier: 2,
      direction: "VERTICAL",
      targetHeight: 220,
      radius: 8,
      radiusToken: "radius/overlay",
      gap: 12,
      gapToken: "spacing/12",
      padding: { top: 24, right: 24, bottom: 24, left: 24 },
      paddingTokens: { top: "spacing/24", right: "spacing/24", bottom: "spacing/24", left: "spacing/24" },
      effectStyleName: "Onda/Shadow/Overlay",
      roles: [componentRole("Type", "TEXT"), componentRole("Title", "TEXT"), componentRole("Body", "TEXT"), componentRole("Scope", "TEXT"), componentRole("Primary Action", "TEXT"), componentRole("Secondary Action", "TEXT"), componentRole("Status", "TEXT")],
      variants: [
        componentVariant("State=Open", { Type: "Empfehlung", Title: "Beleg fehlt", Body: "Diese Aussage braucht eine \xFCberpr\xFCfbare Quelle.", Scope: "Nur diesmal", "Primary Action": "\xDCbernehmen", "Secondary Action": "Ablehnen", Status: "Offen" }),
        componentVariant("State=Accepted", { Type: "Korrektur", Title: "\xC4nderung \xFCbernommen", Body: "Die \xC4nderung wurde in den Text eingesetzt.", Scope: "Nur diesmal", "Primary Action": "R\xFCckg\xE4ngig", "Secondary Action": "Schlie\xDFen", Status: "\xDCbernommen" }, { inverted: true, strokeWeight: 2 }),
        componentVariant("State=Rejected", { Type: "Hinweis", Title: "Vorschlag abgelehnt", Body: "Diese Regel gilt f\xFCr den aktuellen Text nicht mehr.", Scope: "Nicht mehr in diesem Text", "Primary Action": "R\xFCckg\xE4ngig", "Secondary Action": "Schlie\xDFen", Status: "Abgelehnt" }, { opacity: 0.7, textToken: "color/text-muted" }),
        componentVariant("State=Error", { Type: "Fehler", Title: "Anmerkung konnte nicht aktualisiert werden", Body: "Deine Eingabe bleibt erhalten.", Scope: "Nie vorschlagen", "Primary Action": "Erneut versuchen", "Secondary Action": "Abbrechen", Status: "Fehler" }, { inverted: true, strokeWeight: 2 })
      ]
    }),
    componentDefinition({
      id: "dialog-action",
      name: "Onda/Dialog Action",
      label: "Dialog Action",
      labelRole: "Label",
      tier: 2,
      roles: [componentRole("Symbol", "TEXT"), componentRole("Label", "TEXT"), componentRole("Hint", "TEXT")],
      variants: [
        componentVariant("Kind=Primary", { Symbol: "\u2192", Label: "Weiter", Hint: "Prim\xE4re Aktion" }, { inverted: true }),
        componentVariant("Kind=Secondary", { Symbol: "\u2190", Label: "Zur\xFCck", Hint: "Sekund\xE4re Aktion" }),
        componentVariant("Kind=Destructive", { Symbol: "!", Label: "L\xF6schen", Hint: "Kann nicht r\xFCckg\xE4ngig gemacht werden" }, { inverted: true, strokeWeight: 2 }),
        componentVariant("Kind=Disabled", { Symbol: "\xD7", Label: "Weiter", Hint: "Nicht verf\xFCgbar" }, { opacity: 0.45, textToken: "color/text-muted" })
      ]
    }),
    componentDefinition({
      id: "dialog",
      name: "Onda/Dialog",
      label: "Dialog",
      labelRole: "Title",
      tier: 2,
      direction: "VERTICAL",
      targetHeight: 280,
      radius: 8,
      radiusToken: "radius/overlay",
      gap: 16,
      gapToken: "spacing/16",
      padding: { top: 24, right: 24, bottom: 24, left: 24 },
      paddingTokens: { top: "spacing/24", right: "spacing/24", bottom: "spacing/24", left: "spacing/24" },
      effectStyleName: "Onda/Shadow/Overlay",
      roles: [componentRole("Eyebrow", "TEXT"), componentRole("Title", "TEXT"), componentRole("Body", "TEXT"), componentRole("Status", "TEXT"), componentRole("Primary Action", "TEXT"), componentRole("Secondary Action", "TEXT")],
      variants: [
        componentVariant("Kind=Standard", { Eyebrow: "Dialog", Title: "Einstellungen", Body: "Passe die Ansicht f\xFCr dieses Dokument an.", Status: "Bereit", "Primary Action": "Speichern", "Secondary Action": "Abbrechen" }),
        componentVariant("Kind=Confirmation", { Eyebrow: "Best\xE4tigung", Title: "\xC4nderungen \xFCbernehmen?", Body: "Die \xC4nderungen werden lokal gespeichert.", Status: "Best\xE4tigung erforderlich", "Primary Action": "\xDCbernehmen", "Secondary Action": "Zur\xFCck" }, { strokeWeight: 2 }),
        componentVariant("Kind=Destructive", { Eyebrow: "Achtung", Title: "Dokument l\xF6schen?", Body: "Das Dokument wird dauerhaft aus der Bibliothek entfernt.", Status: "Nicht r\xFCckg\xE4ngig zu machen", "Primary Action": "Endg\xFCltig l\xF6schen", "Secondary Action": "Abbrechen" }, { inverted: true, strokeWeight: 2 }),
        componentVariant("State=Error", { Eyebrow: "Fehler", Title: "Speichern fehlgeschlagen", Body: "Deine Eingabe bleibt erhalten.", Status: "Erneut versuchen m\xF6glich", "Primary Action": "Erneut versuchen", "Secondary Action": "Abbrechen" }, { inverted: true, strokeWeight: 2 }),
        componentVariant("Size=Long", { Eyebrow: "Information", Title: "Datenkontrolle und Export", Body: "Pr\xFCfe offene Hinweise, Datenumfang und Exportziel, bevor du fortf\xE4hrst.", Status: "Bitte vollst\xE4ndig lesen", "Primary Action": "Fortfahren", "Secondary Action": "Zur\xFCck" })
      ]
    }),
    componentDefinition({
      id: "aura",
      name: "Onda/Aura",
      label: "Aura",
      labelRole: "Label",
      tier: 2,
      radius: 0,
      radiusToken: "radius/none",
      roles: [componentRole("Orb", "ELLIPSE"), componentRole("Symbol", "TEXT"), componentRole("Label", "TEXT")],
      variants: [
        componentVariant("State=Idle", { Symbol: "\u25CB", Label: "Aura ist bereit" }),
        componentVariant("State=Working", { Symbol: "\u2026", Label: "Aura pr\xFCft den Auftrag" }, { strokeWeight: 2, opacity: 0.75 }),
        componentVariant("State=Complete", { Symbol: "\u2713", Label: "Aura hat den Schritt abgeschlossen" }, { inverted: true }),
        componentVariant("State=Error", { Symbol: "!", Label: "Aura konnte den Schritt nicht abschlie\xDFen" }, { inverted: true, strokeWeight: 2 })
      ]
    }),
    componentDefinition({
      id: "agent-message",
      name: "Onda/Agent Message",
      label: "Agent Message",
      labelRole: "Body",
      tier: 2,
      direction: "VERTICAL",
      targetHeight: 120,
      radius: 6,
      radiusToken: "radius/static",
      gap: 12,
      gapToken: "spacing/12",
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      paddingTokens: { top: "spacing/16", right: "spacing/16", bottom: "spacing/16", left: "spacing/16" },
      roles: [componentRole("Avatar", "ELLIPSE"), componentRole("Author", "TEXT"), componentRole("Body", "TEXT"), componentRole("Meta", "TEXT"), componentRole("Status", "TEXT")],
      variants: [
        componentVariant("Role=User", { Author: "Du", Body: "Pr\xFCfe die offenen Quellenhinweise.", Meta: "Gerade gesendet", Status: "Gesendet" }),
        componentVariant("Role=Agent", { Author: "Onda Agent", Body: "Drei Quellenhinweise warten auf deine Pr\xFCfung.", Meta: "Antwort bereit", Status: "Zur Pr\xFCfung" }, { inverted: true }),
        componentVariant("State=Streaming", { Author: "Onda Agent", Body: "Antwort wird schrittweise erstellt \u2026", Meta: "In Bearbeitung", Status: "Wird geladen" }, { strokeWeight: 2, opacity: 0.75 }),
        componentVariant("State=Error", { Author: "Onda Agent", Body: "Antwort konnte nicht geladen werden. Deine Anfrage bleibt erhalten.", Meta: "Verbindung unterbrochen", Status: "Erneut versuchen" }, { inverted: true, strokeWeight: 2 })
      ]
    }),
    componentDefinition({
      id: "decision-card",
      name: "Onda/Decision Card",
      label: "Decision Card",
      labelRole: "Decision",
      tier: 2,
      direction: "VERTICAL",
      targetHeight: 140,
      radius: 6,
      radiusToken: "radius/static",
      gap: 12,
      gapToken: "spacing/12",
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      paddingTokens: { top: "spacing/16", right: "spacing/16", bottom: "spacing/16", left: "spacing/16" },
      roles: [componentRole("Symbol", "TEXT"), componentRole("Decision", "TEXT"), componentRole("Rationale", "TEXT"), componentRole("Actor", "TEXT"), componentRole("Time", "TEXT")],
      variants: [
        componentVariant("Status=Pending", { Symbol: "?", Decision: "Quellenhinweis pr\xFCfen", Rationale: "Die Aussage ist noch nicht belegt.", Actor: "Noch nicht entschieden", Time: "Jetzt" }),
        componentVariant("Status=Accepted", { Symbol: "\u2713", Decision: "Quellenhinweis \xFCbernehmen", Rationale: "Der Beleg passt zur markierten Aussage.", Actor: "Von dir best\xE4tigt", Time: "Gerade eben" }, { inverted: true }),
        componentVariant("Status=Rejected", { Symbol: "\xD7", Decision: "Quellenhinweis ablehnen", Rationale: "Der Beleg st\xFCtzt die Aussage nicht ausreichend.", Actor: "Von dir abgelehnt", Time: "Gerade eben" }, { strokeWeight: 2, opacity: 0.65, textToken: "color/text-muted" }),
        componentVariant("Status=Overridden", { Symbol: "\u21BA", Decision: "Entscheidung \xFCberschrieben", Rationale: "Eine neuere manuelle Entscheidung gilt.", Actor: "Von dir ge\xE4ndert", Time: "Soeben" }, { inverted: true, strokeWeight: 2 })
      ]
    }),
    componentDefinition({
      id: "evidence-card",
      name: "Onda/Evidence Card",
      label: "Evidence Card",
      labelRole: "Claim",
      tier: 2,
      direction: "VERTICAL",
      targetHeight: 140,
      radius: 6,
      radiusToken: "radius/static",
      gap: 12,
      gapToken: "spacing/12",
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      paddingTokens: { top: "spacing/16", right: "spacing/16", bottom: "spacing/16", left: "spacing/16" },
      roles: [componentRole("Symbol", "TEXT"), componentRole("Claim", "TEXT"), componentRole("Source", "TEXT"), componentRole("Confidence", "TEXT"), componentRole("Action", "TEXT")],
      variants: [
        componentVariant("Status=Unverified", { Symbol: "?", Claim: "Aussage ohne gepr\xFCften Beleg", Source: "Quelle noch nicht gepr\xFCft", Confidence: "Einsch\xE4tzung: offen", Action: "Quelle pr\xFCfen" }),
        componentVariant("Status=Verified", { Symbol: "\u2713", Claim: "Aussage durch Quelle gest\xFCtzt", Source: "Fundstelle gepr\xFCft", Confidence: "Einsch\xE4tzung: hoch", Action: "Quelle \xF6ffnen" }, { inverted: true }),
        componentVariant("Status=Conflict", { Symbol: "!", Claim: "Quellen widersprechen sich", Source: "Zwei abweichende Fundstellen", Confidence: "Einsch\xE4tzung: unklar", Action: "Konflikt pr\xFCfen" }, { inverted: true, strokeWeight: 2 }),
        componentVariant("Status=Missing", { Symbol: "\u2014", Claim: "Kein Beleg verkn\xFCpft", Source: "Quelle fehlt", Confidence: "Nicht bewertbar", Action: "Quelle hinzuf\xFCgen" }, { opacity: 0.6, textToken: "color/text-muted" })
      ]
    }),
    componentDefinition({
      id: "source-card",
      name: "Onda/Source Card",
      label: "Source Card",
      labelRole: "Title",
      tier: 2,
      direction: "VERTICAL",
      targetHeight: 120,
      radius: 6,
      radiusToken: "radius/static",
      gap: 12,
      gapToken: "spacing/12",
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      paddingTokens: { top: "spacing/16", right: "spacing/16", bottom: "spacing/16", left: "spacing/16" },
      roles: [componentRole("Type", "TEXT"), componentRole("Title", "TEXT"), componentRole("Meta", "TEXT"), componentRole("Status", "TEXT"), componentRole("Action", "TEXT")],
      variants: [
        componentVariant("Status=Ready", { Type: "Webquelle", Title: "Studie zur Schreibforschung", Meta: "Quelle bereit zur Pr\xFCfung", Status: "Bereit", Action: "Quelle \xF6ffnen" }),
        componentVariant("Status=Loading", { Type: "Webquelle", Title: "Quelle wird geladen", Meta: "Metadaten werden angefragt", Status: "L\xE4dt", Action: "Abbrechen" }, { strokeWeight: 2, opacity: 0.75 }),
        componentVariant("Status=Invalid", { Type: "Ung\xFCltige Quelle", Title: "Quelle kann nicht gelesen werden", Meta: "Adresse oder Format pr\xFCfen", Status: "Ung\xFCltig", Action: "Andere Quelle w\xE4hlen" }, { inverted: true, strokeWeight: 2 }),
        componentVariant("Status=Offline", { Type: "Webquelle", Title: "Quelle derzeit nicht erreichbar", Meta: "Verbindung ist offline", Status: "Offline", Action: "Erneut versuchen" }, { opacity: 0.6, textToken: "color/text-muted" })
      ]
    }),
    componentDefinition({
      id: "import-panel",
      name: "Onda/Import Panel",
      label: "Import Panel",
      labelRole: "Title",
      tier: 2,
      direction: "VERTICAL",
      targetHeight: 160,
      radius: 6,
      radiusToken: "radius/static",
      gap: 12,
      gapToken: "spacing/12",
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      paddingTokens: { top: "spacing/16", right: "spacing/16", bottom: "spacing/16", left: "spacing/16" },
      roles: [componentRole("Title", "TEXT"), componentRole("File", "TEXT"), componentRole("Progress", "TEXT"), componentRole("Status", "TEXT"), componentRole("Action", "TEXT")],
      variants: [
        componentVariant("State=Empty", { Title: "Quelle importieren", File: "Noch keine Datei gew\xE4hlt", Progress: "0 %", Status: "Bereit", Action: "Datei w\xE4hlen" }),
        componentVariant("State=Validating", { Title: "Import wird gepr\xFCft", File: "recherche.pdf", Progress: "Pr\xFCfung l\xE4uft \u2026", Status: "Datei wird validiert", Action: "Abbrechen" }, { strokeWeight: 2, opacity: 0.75 }),
        componentVariant("State=Ready", { Title: "Import bereit", File: "recherche.pdf", Progress: "100 %", Status: "Bereit zum \xDCbernehmen", Action: "Import \xFCbernehmen" }, { inverted: true }),
        componentVariant("State=Error", { Title: "Import fehlgeschlagen", File: "recherche.pdf", Progress: "Pr\xFCfung abgebrochen", Status: "Datei blieb unver\xE4ndert", Action: "Erneut versuchen" }, { inverted: true, strokeWeight: 2 })
      ]
    }),
    componentDefinition({
      id: "reader-panel",
      name: "Onda/Reader Panel",
      label: "Reader Panel",
      labelRole: "Title",
      tier: 2,
      direction: "VERTICAL",
      targetHeight: 180,
      radius: 6,
      radiusToken: "radius/static",
      gap: 12,
      gapToken: "spacing/12",
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      paddingTokens: { top: "spacing/16", right: "spacing/16", bottom: "spacing/16", left: "spacing/16" },
      roles: [componentRole("Title", "TEXT"), componentRole("Location", "TEXT"), componentRole("Excerpt", "TEXT"), componentRole("Status", "TEXT"), componentRole("Action", "TEXT")],
      variants: [
        componentVariant("State=Reading", { Title: "Quellenleser", Location: "Seite 12", Excerpt: "Die markierte Passage wird hier gelesen.", Status: "Leseansicht", Action: "Fundstelle markieren" }),
        componentVariant("State=Highlight", { Title: "Markierte Fundstelle", Location: "Seite 12 \xB7 Absatz 3", Excerpt: "Diese Passage ist f\xFCr die Aussage relevant.", Status: "Zur Pr\xFCfung markiert", Action: "Mit Anmerkung verkn\xFCpfen" }, { inverted: true }),
        componentVariant("State=Unavailable", { Title: "Quelle nicht verf\xFCgbar", Location: "Position gespeichert", Excerpt: "Inhalt konnte nicht geladen werden.", Status: "Offline oder Zugriff fehlt", Action: "Erneut versuchen" }, { inverted: true, strokeWeight: 2 })
      ]
    }),
    componentDefinition({
      id: "research-card",
      name: "Onda/Research Card",
      label: "Research Card",
      labelRole: "Query",
      tier: 2,
      direction: "VERTICAL",
      targetHeight: 140,
      radius: 6,
      radiusToken: "radius/static",
      gap: 12,
      gapToken: "spacing/12",
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      paddingTokens: { top: "spacing/16", right: "spacing/16", bottom: "spacing/16", left: "spacing/16" },
      roles: [componentRole("Query", "TEXT"), componentRole("Progress", "TEXT"), componentRole("Sources", "TEXT"), componentRole("Status", "TEXT"), componentRole("Action", "TEXT")],
      variants: [
        componentVariant("Status=Planned", { Query: "Wirkung von Schreibassistenz", Progress: "Noch nicht gestartet", Sources: "0 Quellen", Status: "Geplant", Action: "Recherche starten" }),
        componentVariant("Status=Running", { Query: "Wirkung von Schreibassistenz", Progress: "2 von 5 Schritten", Sources: "3 Quellen vorgemerkt", Status: "L\xE4uft", Action: "Pausieren" }, { strokeWeight: 2, opacity: 0.75 }),
        componentVariant("Status=Paused", { Query: "Wirkung von Schreibassistenz", Progress: "2 von 5 Schritten", Sources: "3 Quellen vorgemerkt", Status: "Pausiert", Action: "Fortsetzen" }, { opacity: 0.65, textToken: "color/text-muted" }),
        componentVariant("Status=Ready", { Query: "Wirkung von Schreibassistenz", Progress: "5 von 5 Schritten", Sources: "6 Quellen zur Pr\xFCfung", Status: "Bereit zur Pr\xFCfung", Action: "Ergebnisse \xF6ffnen" }, { inverted: true }),
        componentVariant("Status=Error", { Query: "Wirkung von Schreibassistenz", Progress: "Recherche unterbrochen", Sources: "Quellenstand nicht aktualisiert", Status: "Verbindung fehlgeschlagen", Action: "Erneut versuchen" }, { inverted: true, strokeWeight: 2 })
      ]
    })
  ]);
  function componentRenderedHeight(definition2) {
    if (!definition2) return 0;
    const roleHeights = definition2.roles.map((role) => role.type === "ELLIPSE" || role.name === "Description" ? 16 : 22);
    const contentHeight = definition2.direction === "VERTICAL" ? roleHeights.reduce((total, height) => total + height, 0) + Math.max(0, roleHeights.length - 1) * definition2.gap : Math.max(0, ...roleHeights);
    return Math.max(definition2.targetHeight, contentHeight + definition2.padding.top + definition2.padding.bottom);
  }
  function estimateCoreTextWidth(characters, roleName = "") {
    const size = roleName === "Description" ? 12 : 15;
    return Math.ceil([...String(characters || "")].reduce((width, character) => {
      if (/\s/.test(character)) return width + size * 0.32;
      if (/[ilI1.,:;!|'`]/.test(character)) return width + size * 0.3;
      if (/[MW@%&]/.test(character)) return width + size * 0.82;
      return width + size * 0.54;
    }, 0));
  }
  function componentMinimumWidth(definition2, roleCopy = {}) {
    if (!definition2) return 0;
    const roleWidths = definition2.roles.map((role) => role.type === "ELLIPSE" ? 16 : estimateCoreTextWidth(roleCopy[role.name], role.name));
    const contentWidth = definition2.direction === "VERTICAL" ? Math.max(0, ...roleWidths) : roleWidths.reduce((total, width) => total + width, 0) + Math.max(0, roleWidths.length - 1) * definition2.gap;
    return Math.ceil(contentWidth + definition2.padding.left + definition2.padding.right);
  }
  function coreRoleCopy(name, setId, variantName, label, overrides = {}) {
    const definition2 = COMPONENT_DEFINITIONS.find((component) => component.id === setId);
    const variant = definition2 == null ? void 0 : definition2.variants.find((item) => item.name === variantName);
    const copy = Object.fromEntries(((definition2 == null ? void 0 : definition2.roles) || []).filter((role) => role.type === "TEXT").map((role) => {
      var _a;
      return [role.name, ((_a = variant == null ? void 0 : variant.copy) == null ? void 0 : _a[role.name]) || ""];
    }));
    if (definition2 == null ? void 0 : definition2.labelRole) copy[definition2.labelRole] = label;
    if (setId === "select") Object.assign(copy, { Label: "Sortieren nach", Value: label });
    if (setId === "list-row") Object.assign(copy, {
      Title: label,
      Meta: name.startsWith("Nutzer /") ? "Pers\xF6nlicher Arbeitsbereich" : name.startsWith("Verlauf /") ? "Zuletzt bearbeitet \xB7 heute" : "Calm Technology"
    });
    if (setId === "nav-item") {
      const count = name.endsWith("Projekte") ? "1" : name.endsWith("Dokumente") ? "12" : name.endsWith("Papierkorb") ? "2" : "1";
      Object.assign(copy, { Label: label, Count: count });
      if (name === "Navigation / Dokument") copy.Count = "1";
      if (variantName === "State=Collapsed") Object.assign(copy, { Label: "", Count: "", Status: "" });
    }
    Object.assign(copy, overrides);
    for (const [role, characters] of Object.entries(copy)) copy[role] = String(characters).replaceAll("Projekt Nordstern", "Calm Technology").replace(/\bEssay\b/g, "Dokument");
    return Object.freeze(copy);
  }
  function coreInstance(name, setId, variant, label, options = {}) {
    const definition2 = COMPONENT_DEFINITIONS.find((component) => component.id === setId);
    const roleCopy = coreRoleCopy(name, setId, variant, label, options.roleCopy);
    const minimumWidth = componentMinimumWidth(definition2, roleCopy);
    const preferredWidths = { search: 520, select: 300, "icon-button": 208, "mode-toggle": 280, "status-symbol": 200, button: 240 };
    return Object.freeze({
      name,
      setId,
      variant,
      label,
      region: options.region || null,
      roleCopy,
      expectedHeight: componentRenderedHeight(definition2),
      minimumWidth,
      expectedWidth: Math.max(minimumWidth, options.width || preferredWidths[setId] || 0)
    });
  }
  function coreRegion(name, parentName, width, height, layoutMode, options = {}) {
    var _a;
    return Object.freeze({
      name,
      parentName,
      width,
      height,
      layoutMode,
      itemSpacing: (_a = options.itemSpacing) != null ? _a : 16,
      padding: Object.freeze(__spreadValues({}, options.padding || { top: 16, right: 16, bottom: 16, left: 16 }))
    });
  }
  function libraryRegions(viewName) {
    return Object.freeze([
      coreRegion("Layout / Rail", viewName, 360, 800, "VERTICAL", { itemSpacing: 8, padding: { top: 24, right: 16, bottom: 24, left: 16 } }),
      coreRegion("Layout / Main", viewName, 1080, 800, "VERTICAL", { itemSpacing: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } }),
      coreRegion("Layout / Header", "Layout / Main", 1080, 168, "VERTICAL", { itemSpacing: 8, padding: { top: 20, right: 32, bottom: 20, left: 32 } }),
      coreRegion("Layout / Toolbar", "Layout / Main", 1080, 176, "HORIZONTAL", { itemSpacing: 16, padding: { top: 20, right: 32, bottom: 20, left: 32 } }),
      coreRegion("Layout / Content", "Layout / Main", 1080, 456, "VERTICAL", { itemSpacing: 16, padding: { top: 24, right: 32, bottom: 24, left: 32 } })
    ]);
  }
  function editorRegions(viewName, compact = false) {
    const railWidth = compact ? 96 : 240;
    const mainWidth = 1440 - railWidth;
    const reviewWidth = 640;
    return Object.freeze([
      coreRegion("Layout / Rail", viewName, railWidth, 800, "VERTICAL", { itemSpacing: 8, padding: compact ? { top: 24, right: 8, bottom: 24, left: 8 } : { top: 24, right: 16, bottom: 24, left: 16 } }),
      coreRegion("Layout / Main", viewName, mainWidth, 800, "VERTICAL", { itemSpacing: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } }),
      coreRegion("Layout / Toolbar", "Layout / Main", mainWidth, 104, "HORIZONTAL", { itemSpacing: 16, padding: { top: 20, right: 24, bottom: 20, left: 24 } }),
      coreRegion("Layout / Body", "Layout / Main", mainWidth, 696, "HORIZONTAL", { itemSpacing: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } }),
      coreRegion("Layout / Document", "Layout / Body", mainWidth - reviewWidth, 696, "VERTICAL", { itemSpacing: 12, padding: { top: 40, right: 48, bottom: 40, left: 48 } }),
      coreRegion("Layout / Review", "Layout / Body", reviewWidth, 696, "VERTICAL", { itemSpacing: 16, padding: { top: 24, right: 24, bottom: 24, left: 24 } })
    ]);
  }
  var CORE_EDITOR_DOCUMENT_FIXTURE = Object.freeze({
    title: "Calm Technology",
    blocks: Object.freeze([
      Object.freeze({ kind: "paragraph", text: "Calm Technology beschreibt Technik, die in der Peripherie bleibt und Aufmerksamkeit nur beansprucht, wenn sie wirklich gebraucht wird." }),
      Object.freeze({ kind: "heading", text: "Prinzipien" }),
      Object.freeze({ kind: "paragraph", text: "Weiser und Brown formulierten: Technik soll sich an den R\xE4ndern der Aufmerksamkeit bewegen und nahtlos zwischen Zentrum und Peripherie wechseln." }),
      Object.freeze({ kind: "heading", text: "Beispiele" }),
      Object.freeze({ kind: "paragraph", text: "Die Teekanne pfeift erst, wenn es relevant ist. Eine Statusleuchte informiert, ohne zu unterbrechen." }),
      Object.freeze({ kind: "heading", text: "\xDCbertragung aufs Schreiben" }),
      Object.freeze({ kind: "paragraph", text: "F\xFCr Schreibsoftware hei\xDFt das: Werkzeuge erscheinen im Kontext, Hinweise sammeln sich leise, nichts dr\xE4ngt sich in den Fluss." }),
      Object.freeze({ kind: "paragraph", text: "Ruhige Technik ist kein Verzicht auf Funktionen, sondern eine Haltung: volle Kraft, leise Pr\xE4sentation." })
    ])
  });
  function libraryRailInstances(state) {
    const active = state.startsWith("Dokumente") || state.startsWith("Sortierung") ? "Dokumente" : state.startsWith("Papierkorb") ? "Papierkorb" : state.startsWith("Projekte") || state === "Leerzustand" || state.startsWith("Fehler") ? "Projekte" : "";
    const empty = state === "Leerzustand";
    return [
      coreInstance("Navigation / Projekte", "nav-item", active === "Projekte" ? "State=Active" : "State=Default", "Projekte", { region: "Layout / Rail", roleCopy: empty ? { Count: "0" } : void 0 }),
      coreInstance("Navigation / Dokumente", "nav-item", active === "Dokumente" ? "State=Active" : "State=Default", "Dokumente", { region: "Layout / Rail", roleCopy: empty ? { Count: "0" } : void 0 }),
      coreInstance("Navigation / Papierkorb", "nav-item", active === "Papierkorb" ? "State=Active" : "State=Default", "Papierkorb", { region: "Layout / Rail", roleCopy: empty ? { Count: "0" } : void 0 }),
      empty ? coreInstance("Verlauf / Leer", "nav-item", "State=Default", "Noch kein Verlauf", { region: "Layout / Rail", roleCopy: { Icon: "\u21BA", Count: "0", Status: "Leer" } }) : coreInstance("Verlauf / Calm Technology", "nav-item", "State=Default", "Calm Technology", { region: "Layout / Rail", roleCopy: { Icon: "\u21BA", Count: "1", Status: "Verlauf" } }),
      coreInstance("Nutzer / Jakob", "nav-item", "State=Default", "Jakob", { region: "Layout / Rail", roleCopy: { Icon: "\u25CB", Count: "1", Status: "Angemeldet" } })
    ];
  }
  function coreRegionForInstance(section, setId) {
    if (setId === "nav-item") return "Layout / Rail";
    if (section === "Bibliothek") return ["search", "select"].includes(setId) ? "Layout / Toolbar" : "Layout / Content";
    return ["review-bar", "annotation-anchor", "empty-state"].includes(setId) ? "Layout / Review" : "Layout / Toolbar";
  }
  function coreView({ name, section, state, copy, instances }) {
    const regions = section === "Bibliothek" ? libraryRegions(name) : editorRegions(name, ["Seitenleiste \xB7 Eingeklappt", "Fokusmodus"].includes(state));
    const screenInstances = section === "Bibliothek" ? [...libraryRailInstances(state), ...instances.filter((instance) => instance.setId !== "nav-item")] : instances;
    const screenCopyContracts = Object.entries(copy).map(([role, characters]) => Object.freeze({
      role,
      characters,
      region: section === "Bibliothek" ? "Layout / Header" : ["title", "body"].includes(role) ? "Layout / Document" : "Layout / Review"
    }));
    const documentCopyContracts = section === "Editor" ? [
      Object.freeze({ role: "document-title", characters: CORE_EDITOR_DOCUMENT_FIXTURE.title, region: "Layout / Document", kind: "title" }),
      ...CORE_EDITOR_DOCUMENT_FIXTURE.blocks.map((block, index) => Object.freeze({ role: `document-${index + 1}`, characters: block.text, region: "Layout / Document", kind: block.kind }))
    ] : [];
    const copyContracts = Object.freeze([...screenCopyContracts, ...documentCopyContracts]);
    return Object.freeze({
      name,
      section,
      sectionName: section === "Bibliothek" ? "03 \xB7 Bibliothek" : "04 \xB7 Editor",
      state,
      width: 1440,
      height: 800,
      radius: 0,
      layoutMode: "HORIZONTAL",
      effects: Object.freeze([]),
      regions,
      copy: Object.freeze(__spreadValues({}, copy)),
      copyContracts,
      document: section === "Editor" ? CORE_EDITOR_DOCUMENT_FIXTURE : null,
      reviewContext: section === "Editor" ? Object.freeze({ state, relation: `${state} \u2194 Calm Technology` }) : null,
      instances: Object.freeze(screenInstances.map((instance) => Object.freeze(__spreadProps(__spreadValues({}, instance), {
        region: instance.region || coreRegionForInstance(section, instance.setId)
      }))))
    });
  }
  var CORE_OVERVIEW_DEFINITION = Object.freeze({
    name: "\xDCbersicht / Coverage",
    width: 1940,
    radius: 6,
    effects: Object.freeze([]),
    lines: Object.freeze([
      "Onda Write \xB7 Produkt\xFCbersicht",
      "Bibliothek \xB7 8 Produktansichten",
      "Editor \xB7 10 Produktansichten",
      "Komponenten \xB7 27 Component Sets"
    ])
  });
  var CORE_VIEW_DEFINITIONS = Object.freeze([
    coreView({
      name: "Bibliothek / Projekte \xB7 Gef\xFCllt",
      section: "Bibliothek",
      state: "Projekte \xB7 Gef\xFCllt",
      copy: { title: "Onda Write \xB7 Projekte", body: "Projekt \u201EBeispiel: Calm Technology\u201C mit 12 Dokumenten.", status: "Projekte sind bereit.", action: "Projekt \xF6ffnen" },
      instances: [
        coreInstance("Navigation / Projekte", "nav-item", "State=Active", "Projekte"),
        coreInstance("Suche / Projekte", "search", "State=Empty", "Projekte und Dokumente durchsuchen"),
        coreInstance("Sortierung / Projekte", "select", "State=Selected", "Zuletzt bearbeitet"),
        coreInstance("Projekt / Calm Technology", "list-row", "State=Selected", "Beispiel: Calm Technology"),
        coreInstance("Aktion / Projekt \xF6ffnen", "button", "Kind=Primary, State=Default", "Projekt \xF6ffnen")
      ]
    }),
    coreView({
      name: "Bibliothek / Dokumente \xB7 Gef\xFCllt",
      section: "Bibliothek",
      state: "Dokumente \xB7 Gef\xFCllt",
      copy: { title: "Onda Write \xB7 Dokumente", body: "\u201EBeispiel: Calm Technology\u201C \xB7 12 Dokumente, zuletzt \u201EDie leise Architektur eines Arguments\u201C.", status: "Nach \u201EZuletzt bearbeitet\u201C sortiert.", action: "Dokument \xF6ffnen" },
      instances: [
        coreInstance("Navigation / Dokumente", "nav-item", "State=Active", "Dokumente"),
        coreInstance("Suche / Dokumente", "search", "State=Empty", "Dokumente durchsuchen"),
        coreInstance("Sortierung / Dokumente", "select", "State=Selected", "Zuletzt bearbeitet"),
        coreInstance("Dokument / Leise Architektur", "list-row", "State=Selected", "Die leise Architektur eines Arguments"),
        coreInstance("Dokument / Quellen", "list-row", "State=Default", "Quellen und Belege")
      ]
    }),
    coreView({
      name: "Bibliothek / Papierkorb \xB7 Gef\xFCllt",
      section: "Bibliothek",
      state: "Papierkorb \xB7 Gef\xFCllt",
      copy: { title: "Onda Write \xB7 Papierkorb", body: "Zwei Dokumente k\xF6nnen wiederhergestellt oder bewusst endg\xFCltig gel\xF6scht werden.", status: "Papierkorb \xB7 2 Dokumente", action: "Auswahl wiederherstellen oder endg\xFCltig l\xF6schen" },
      instances: [
        coreInstance("Navigation / Papierkorb", "nav-item", "State=Active", "Papierkorb"),
        coreInstance("Suche / Papierkorb", "search", "State=Empty", "Papierkorb durchsuchen"),
        coreInstance("Sortierung / Papierkorb", "select", "State=Selected", "Zuletzt bearbeitet"),
        coreInstance("Dokument / Alte Fassung", "list-row", "State=Trash", "Alte Fassung"),
        coreInstance("Aktion / Wiederherstellen", "button", "Kind=Primary, State=Default", "Wiederherstellen"),
        coreInstance("Aktion / Endg\xFCltig l\xF6schen", "button", "Kind=Destructive, State=Default", "Endg\xFCltig l\xF6schen")
      ]
    }),
    coreView({
      name: "Bibliothek / Suche \xB7 Treffer",
      section: "Bibliothek",
      state: "Suche \xB7 Treffer",
      copy: { title: "Onda Write \xB7 Suche", body: "Suchbegriff \u201Ecalm\u201C findet das Projekt \u201EBeispiel: Calm Technology\u201C.", status: "3 Treffer", action: "Treffer \xF6ffnen" },
      instances: [
        coreInstance("Navigation / Suche", "nav-item", "State=Active", "Suche"),
        coreInstance("Suche / Calm", "search", "State=Results", "calm", { roleCopy: { Count: "3 Treffer" } }),
        coreInstance("Sortierung / Treffer", "select", "State=Selected", "Zuletzt bearbeitet"),
        coreInstance("Treffer / Calm Technology", "list-row", "State=Selected", "Beispiel: Calm Technology"),
        coreInstance("Status / Treffer", "status-symbol", "Status=Ready", "3 Treffer")
      ]
    }),
    coreView({
      name: "Bibliothek / Suche \xB7 Keine Treffer",
      section: "Bibliothek",
      state: "Suche \xB7 Keine Treffer",
      copy: { title: "Onda Write \xB7 Suche", body: "F\xFCr den Suchbegriff \u201Eunruhe\u201C wurden keine Projekte oder Dokumente gefunden.", status: "Keine Treffer", action: "Suche l\xF6schen" },
      instances: [
        coreInstance("Navigation / Suche", "nav-item", "State=Active", "Suche"),
        coreInstance("Suche / Ohne Treffer", "search", "State=No Results", "unruhe"),
        coreInstance("Sortierung / Ohne Treffer", "select", "State=Selected", "Titel"),
        coreInstance("Leerzustand / Suche", "empty-state", "Context=Library", "Keine Treffer", { roleCopy: { Symbol: "\u25CB", Description: "Suchbegriff \xE4ndern", Action: "Suche l\xF6schen" } }),
        coreInstance("Aktion / Suche l\xF6schen", "button", "Kind=Secondary, State=Default", "Suche l\xF6schen")
      ]
    }),
    coreView({
      name: "Bibliothek / Sortierung \xB7 Men\xFC offen",
      section: "Bibliothek",
      state: "Sortierung \xB7 Men\xFC offen",
      copy: { title: "Onda Write \xB7 Sortierung", body: "Sortieroptionen: Zuletzt bearbeitet, Titel oder Erstellt.", status: "Men\xFC ge\xF6ffnet", action: "Sortierung ausw\xE4hlen" },
      instances: [
        coreInstance("Navigation / Dokumente", "nav-item", "State=Active", "Dokumente"),
        coreInstance("Suche / Sortierung", "search", "State=Empty", "Dokumente durchsuchen"),
        coreInstance("Sortierung / Ge\xF6ffnet", "select", "State=Open", "Sortierung ge\xF6ffnet"),
        coreInstance("Option / Zuletzt bearbeitet", "menu-item", "State=Selected", "Zuletzt bearbeitet"),
        coreInstance("Option / Titel", "menu-item", "State=Default", "Titel"),
        coreInstance("Option / Erstellt", "menu-item", "State=Default", "Erstellt")
      ]
    }),
    coreView({
      name: "Bibliothek / Leerzustand",
      section: "Bibliothek",
      state: "Leerzustand",
      copy: { title: "Onda Write \xB7 Projekte", body: "Noch keine Projekte. Ein neues Projekt b\xFCndelt Dokumente und Quellen.", status: "Bibliothek ist leer", action: "Projekt erstellen" },
      instances: [
        coreInstance("Navigation / Projekte", "nav-item", "State=Active", "Projekte"),
        coreInstance("Leerzustand / Projekte", "empty-state", "Context=Library", "Noch keine Projekte"),
        coreInstance("Aktion / Projekt erstellen", "button", "Kind=Primary, State=Default", "Projekt erstellen")
      ]
    }),
    coreView({
      name: "Bibliothek / Fehler \xB7 Wiederholen",
      section: "Bibliothek",
      state: "Fehler \xB7 Wiederholen",
      copy: { title: "Onda Write \xB7 Bibliothek", body: "Projekte konnten nicht geladen werden. Sucheingabe und bereits sichtbare Daten bleiben erhalten.", status: "Laden fehlgeschlagen", action: "Erneut versuchen" },
      instances: [
        coreInstance("Navigation / Projekte", "nav-item", "State=Active", "Projekte"),
        coreInstance("Fehler / Bibliothek", "empty-state", "Context=Recoverable Error", "Projekte konnten nicht geladen werden"),
        coreInstance("Status / Fehler", "status-symbol", "Status=Error", "Laden fehlgeschlagen"),
        coreInstance("Aktion / Wiederholen", "button", "Kind=Primary, State=Default", "Erneut versuchen")
      ]
    }),
    coreView({
      name: "Editor / Textmodus \xB7 Bereit",
      section: "Editor",
      state: "Textmodus \xB7 Bereit",
      copy: { title: "Onda Write \xB7 Textmodus", body: "\u201EDie leise Architektur eines Arguments\u201C ist als Flie\xDFtext ge\xF6ffnet.", status: "Textmodus \xB7 Bereit", action: "Text pr\xFCfen" },
      instances: [
        coreInstance("Navigation / Dokument", "nav-item", "State=Active", "Dokument"),
        coreInstance("Modus / Text", "mode-toggle", "Mode=Text, State=Active", "Text"),
        coreInstance("Anmerkungen / Text", "annotation-anchor", "Kind=Text, State=Idle", "Textanmerkungen"),
        coreInstance("Aktion / Text pr\xFCfen", "button", "Kind=Primary, State=Default", "Text pr\xFCfen"),
        coreInstance("Aktion / Hinzuf\xFCgen", "icon-button", "State=Default", "Hinzuf\xFCgen")
      ]
    }),
    coreView({
      name: "Editor / Notizmodus \xB7 Bereit",
      section: "Editor",
      state: "Notizmodus \xB7 Bereit",
      copy: { title: "Onda Write \xB7 Notizmodus", body: "Notizen bleiben vom Dokumenttext getrennt und k\xF6nnen gezielt erg\xE4nzt werden.", status: "Notizmodus \xB7 Bereit", action: "Notiz hinzuf\xFCgen" },
      instances: [
        coreInstance("Navigation / Dokument", "nav-item", "State=Active", "Dokument"),
        coreInstance("Modus / Notiz", "mode-toggle", "Mode=Notiz, State=Active", "Text"),
        coreInstance("Anmerkungen / Notiz", "annotation-anchor", "Kind=Note, State=Active", "Notizen"),
        coreInstance("Aktion / Notiz hinzuf\xFCgen", "button", "Kind=Primary, State=Default", "Notiz hinzuf\xFCgen"),
        coreInstance("Aktion / Hinzuf\xFCgen", "icon-button", "State=Default", "Hinzuf\xFCgen")
      ]
    }),
    coreView({
      name: "Editor / Review \xB7 Offen",
      section: "Editor",
      state: "Review \xB7 Offen",
      copy: { title: "Onda Write \xB7 Review", body: "Drei Hinweise warten auf eine bewusste redaktionelle Entscheidung.", status: "Review offen \xB7 3 Hinweise", action: "N\xE4chsten Hinweis pr\xFCfen" },
      instances: [
        coreInstance("Navigation / Dokument", "nav-item", "State=Active", "Dokument"),
        coreInstance("Modus / Text", "mode-toggle", "Mode=Text, State=Active", "Text"),
        coreInstance("Review / Offen", "review-bar", "Status=Open", "3 Hinweise zur Pr\xFCfung"),
        coreInstance("Anmerkungen / Aktiv", "annotation-anchor", "Kind=Text, State=Active", "Textanmerkungen"),
        coreInstance("Aktion / N\xE4chster Hinweis", "button", "Kind=Primary, State=Default", "N\xE4chsten Hinweis pr\xFCfen")
      ]
    }),
    coreView({
      name: "Editor / Ruhig \xB7 Anmerkungen verborgen",
      section: "Editor",
      state: "Ruhig \xB7 Anmerkungen verborgen",
      copy: { title: "Onda Write \xB7 Ruhiger Modus", body: "Anmerkungen sind nur verborgen; der Text und alle Entscheidungen bleiben erhalten.", status: "Anmerkungen verborgen", action: "Anmerkungen wieder anzeigen" },
      instances: [
        coreInstance("Navigation / Dokument", "nav-item", "State=Active", "Dokument"),
        coreInstance("Modus / Text", "mode-toggle", "Mode=Text, State=Active", "Text"),
        coreInstance("Review / Ruhig", "review-bar", "Status=Quiet", "Anmerkungen sind verborgen"),
        coreInstance("Anmerkungen / Verborgen", "annotation-anchor", "Kind=Text, State=Idle", "Textanmerkungen"),
        coreInstance("Aktion / Anmerkungen zeigen", "button", "Kind=Secondary, State=Default", "Anmerkungen wieder anzeigen")
      ]
    }),
    coreView({
      name: "Editor / Seitenleiste \xB7 Eingeklappt",
      section: "Editor",
      state: "Seitenleiste \xB7 Eingeklappt",
      copy: { title: "Onda Write \xB7 Editor", body: "Die linke Navigation ist eingeklappt und die Schreibfl\xE4che bleibt vollst\xE4ndig nutzbar.", status: "Seitenleiste eingeklappt", action: "Seitenleiste \xF6ffnen" },
      instances: [
        coreInstance("Navigation / Eingeklappt", "nav-item", "State=Collapsed", ""),
        coreInstance("Modus / Text", "mode-toggle", "Mode=Text, State=Active", "Text"),
        coreInstance("Anmerkungen / Text", "annotation-anchor", "Kind=Text, State=Idle", "Textanmerkungen"),
        coreInstance("Aktion / Seitenleiste \xF6ffnen", "icon-button", "State=Default", "Seitenleiste \xF6ffnen", { roleCopy: { Icon: "\u2630" } })
      ]
    }),
    coreView({
      name: "Editor / Fokusmodus",
      section: "Editor",
      state: "Fokusmodus",
      copy: { title: "Onda Write \xB7 Fokusmodus", body: "Navigation und Hinweise treten zur\xFCck, damit die breite Schreibfl\xE4che im Mittelpunkt steht.", status: "Fokusmodus aktiv", action: "Fokusmodus verlassen" },
      instances: [
        coreInstance("Navigation / Eingeklappt", "nav-item", "State=Collapsed", ""),
        coreInstance("Modus / Text", "mode-toggle", "Mode=Text, State=Active", "Text"),
        coreInstance("Anmerkungen / Ruhig", "annotation-anchor", "Kind=Text, State=Idle", "Textanmerkungen"),
        coreInstance("Aktion / Fokus verlassen", "button", "Kind=Secondary, State=Default", "Fokusmodus verlassen")
      ]
    }),
    coreView({
      name: "Editor / Speichern \xB7 L\xE4uft",
      section: "Editor",
      state: "Speichern \xB7 L\xE4uft",
      copy: { title: "Onda Write \xB7 Speichern", body: "Die aktuelle Fassung wird gespeichert; der Inhalt bleibt w\xE4hrenddessen sichtbar.", status: "Speichern l\xE4uft \u2026", action: "Weiter schreiben" },
      instances: [
        coreInstance("Navigation / Dokument", "nav-item", "State=Active", "Dokument"),
        coreInstance("Modus / Text", "mode-toggle", "Mode=Text, State=Active", "Text"),
        coreInstance("Review / Speichern", "review-bar", "Status=Saving", "\xC4nderungen werden gespeichert \u2026"),
        coreInstance("Status / Speichern", "status-symbol", "Status=Working", "Speichert"),
        coreInstance("Aktion / Weiter schreiben", "button", "Kind=Secondary, State=Default", "Weiter schreiben")
      ]
    }),
    coreView({
      name: "Editor / Speichern \xB7 Gespeichert",
      section: "Editor",
      state: "Speichern \xB7 Gespeichert",
      copy: { title: "Onda Write \xB7 Gespeichert", body: "Die aktuelle Fassung wurde gespeichert.", status: "Gespeichert", action: "Weiter schreiben" },
      instances: [
        coreInstance("Navigation / Dokument", "nav-item", "State=Active", "Dokument"),
        coreInstance("Modus / Text", "mode-toggle", "Mode=Text, State=Active", "Text"),
        coreInstance("Review / Gespeichert", "review-bar", "Status=Saved", "\xC4nderungen gespeichert"),
        coreInstance("Status / Gespeichert", "status-symbol", "Status=Ready", "Gespeichert"),
        coreInstance("Aktion / Weiter schreiben", "button", "Kind=Secondary, State=Default", "Weiter schreiben")
      ]
    }),
    coreView({
      name: "Editor / Speichern \xB7 Fehler",
      section: "Editor",
      state: "Speichern \xB7 Fehler",
      copy: { title: "Onda Write \xB7 Speichern", body: "Speichern ist fehlgeschlagen. Der Inhalt bleibt lokal sichtbar und erhalten.", status: "Speichern fehlgeschlagen", action: "Erneut versuchen" },
      instances: [
        coreInstance("Navigation / Dokument", "nav-item", "State=Active", "Dokument"),
        coreInstance("Modus / Text", "mode-toggle", "Mode=Text, State=Active", "Text"),
        coreInstance("Review / Fehler", "review-bar", "Status=Error", "Speichern fehlgeschlagen"),
        coreInstance("Status / Fehler", "status-symbol", "Status=Error", "Speichern fehlgeschlagen"),
        coreInstance("Aktion / Wiederholen", "button", "Kind=Primary, State=Default", "Erneut versuchen")
      ]
    }),
    coreView({
      name: "Editor / Keine aktive Anmerkung",
      section: "Editor",
      state: "Keine aktive Anmerkung",
      copy: { title: "Onda Write \xB7 Editor", body: "Keine Anmerkung ist ausgew\xE4hlt. Der Dokumenttext bleibt bearbeitbar.", status: "Keine aktive Anmerkung", action: "Anmerkungen anzeigen" },
      instances: [
        coreInstance("Navigation / Dokument", "nav-item", "State=Active", "Dokument"),
        coreInstance("Modus / Text", "mode-toggle", "Mode=Text, State=Active", "Text"),
        coreInstance("Leerzustand / Anmerkung", "empty-state", "Context=No Active Annotation", "Keine aktive Anmerkung"),
        coreInstance("Anmerkungen / Text", "annotation-anchor", "Kind=Text, State=Idle", "Textanmerkungen"),
        coreInstance("Aktion / Anmerkungen zeigen", "button", "Kind=Secondary, State=Default", "Anmerkungen anzeigen")
      ]
    })
  ]);
  function freezeSecondary(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    for (const nested of Object.values(value)) freezeSecondary(nested);
    return Object.freeze(value);
  }
  function secondaryRoleCopy(name, setId, variant, label, overrides = {}) {
    const component = COMPONENT_DEFINITIONS.find((item) => item.id === setId);
    const componentVariant2 = component == null ? void 0 : component.variants.find((item) => item.name === variant);
    const roleDefaults = Object.fromEntries(((component == null ? void 0 : component.roles) || []).filter((role) => role.type === "TEXT").map((role) => {
      var _a;
      return [role.name, ((_a = componentVariant2 == null ? void 0 : componentVariant2.copy) == null ? void 0 : _a[role.name]) || ""];
    }));
    return coreRoleCopy(name, setId, variant, label, __spreadValues(__spreadValues({}, roleDefaults), overrides));
  }
  function secondaryInstance(name, setId, variant, label, region = "Layout / Content", roleCopy = {}) {
    var _a;
    const completeRoleCopy = secondaryRoleCopy(name, setId, variant, label, roleCopy);
    const component = COMPONENT_DEFINITIONS.find((item) => item.id === setId);
    const visibleLabelRole = setId === "select" ? "Value" : component == null ? void 0 : component.labelRole;
    const visibleLabel = (_a = completeRoleCopy[visibleLabelRole]) != null ? _a : label;
    return coreInstance(name, setId, variant, visibleLabel, {
      region,
      roleCopy: completeRoleCopy
    });
  }
  function secondaryStackHeight(items, itemSpacing, padding) {
    return padding.top + padding.bottom + items.reduce((total, item) => total + item.expectedHeight, 0) + Math.max(0, items.length - 1) * itemSpacing;
  }
  function secondaryCopyContracts(name, subject, theme, width) {
    const availableWidth = width === 320 ? 224 : 256;
    const expectedHeight = (characters, kind) => {
      const lineHeight = kind === "title" ? 28 : 22;
      const fontScale = kind === "title" ? 21 / 15 : 1;
      const wrappedLines = Math.max(1, Math.ceil(estimateCoreTextWidth(characters) * fontScale * 1.1 / availableWidth));
      return wrappedLines * lineHeight;
    };
    const summary = `${subject || "Arbeitsansicht"} \xB7 ${theme} \xB7 ${width}px`;
    return Object.freeze([
      Object.freeze({ role: "title", characters: name, region: "Layout / Context", kind: "title", expectedHeight: expectedHeight(name, "title") }),
      Object.freeze({ role: "summary", characters: summary, region: "Layout / Context", kind: "paragraph", expectedHeight: expectedHeight(summary, "paragraph") })
    ]);
  }
  function secondaryRegions(viewName, width, layoutMode, instances, copyContracts) {
    const narrow = width === 320;
    const padding = narrow ? { top: 16, right: 16, bottom: 16, left: 16 } : { top: 24, right: 32, bottom: 24, left: 32 };
    const shellMode = narrow || width <= 720 ? "VERTICAL" : "HORIZONTAL";
    if (!narrow) {
      const shellPadding = { top: 24, right: 24, bottom: 24, left: 24 };
      const nestedPadding = { top: 16, right: 16, bottom: 16, left: 16 };
      const shellContentWidth = width - shellPadding.left - shellPadding.right;
      const contextWidth2 = shellMode === "VERTICAL" ? shellContentWidth : 256;
      const contentWidth2 = shellMode === "VERTICAL" ? shellContentWidth : shellContentWidth - contextWidth2 - 16;
      const detailWidth2 = contentWidth2 - nestedPadding.left - nestedPadding.right;
      const contextHeight2 = secondaryStackHeight(copyContracts, 12, nestedPadding);
      const detailHeight2 = secondaryStackHeight(instances, 12, nestedPadding);
      const contentHeight2 = secondaryStackHeight([{ expectedHeight: detailHeight2 }], 16, nestedPadding);
      const shellContentHeight = shellMode === "VERTICAL" ? contextHeight2 + contentHeight2 + 16 : Math.max(contextHeight2, contentHeight2);
      const shellHeight2 = shellPadding.top + shellContentHeight + shellPadding.bottom;
      return Object.freeze({
        height: shellHeight2,
        regions: Object.freeze([
          coreRegion("Layout / Shell", viewName, width, shellHeight2, shellMode, { itemSpacing: 16, padding: shellPadding }),
          coreRegion("Layout / Context", "Layout / Shell", contextWidth2, contextHeight2, "VERTICAL", { itemSpacing: 12, padding: nestedPadding }),
          coreRegion("Layout / Content", "Layout / Shell", contentWidth2, contentHeight2, "VERTICAL", { itemSpacing: 16, padding: nestedPadding }),
          coreRegion("Layout / Detail", "Layout / Content", detailWidth2, detailHeight2, "VERTICAL", { itemSpacing: 12, padding: nestedPadding })
        ])
      });
    }
    const shellWidth = width - padding.left - padding.right;
    const contextWidth = shellWidth - padding.left - padding.right;
    const contentWidth = contextWidth;
    const detailWidth = contentWidth - padding.left - padding.right;
    const contextHeight = secondaryStackHeight(copyContracts, 12, padding);
    const detailHeight = secondaryStackHeight(instances, 12, padding);
    const contentHeight = secondaryStackHeight([{ expectedHeight: detailHeight }], 16, padding);
    const shellHeight = secondaryStackHeight([{ expectedHeight: contextHeight }, { expectedHeight: contentHeight }], 16, padding);
    return Object.freeze({
      height: secondaryStackHeight([{ expectedHeight: shellHeight }], 0, padding),
      regions: Object.freeze([
        coreRegion("Layout / Shell", viewName, shellWidth, shellHeight, shellMode, { itemSpacing: 16, padding }),
        coreRegion("Layout / Context", "Layout / Shell", contextWidth, contextHeight, "VERTICAL", { itemSpacing: 12, padding }),
        coreRegion("Layout / Content", "Layout / Shell", contentWidth, contentHeight, "VERTICAL", { itemSpacing: 16, padding }),
        coreRegion("Layout / Detail", "Layout / Content", detailWidth, detailHeight, "VERTICAL", { itemSpacing: 12, padding })
      ])
    });
  }
  function secondaryView({ name, sectionName, width = 1440, theme = "Light", layoutMode = "HORIZONTAL", subject, breakpoint, instances }) {
    const copyContracts = secondaryCopyContracts(name, subject, theme, width);
    const geometry = secondaryRegions(name, width, layoutMode, instances, copyContracts);
    return freezeSecondary(__spreadProps(__spreadValues({
      name,
      sectionName,
      width,
      height: geometry.height,
      theme,
      layoutMode
    }, subject ? { subject, breakpoint } : {}), {
      regions: geometry.regions,
      copyContracts,
      instances
    }));
  }
  function mappedInstances(mapping, label, overrides = {}) {
    return mapping.map(([setId, variant], index) => {
      var _a, _b, _c, _d;
      return secondaryInstance(
        ((_a = overrides[index]) == null ? void 0 : _a.name) || `${label} / ${String(index + 1).padStart(2, "0")}`,
        setId,
        variant,
        ((_b = overrides[index]) == null ? void 0 : _b.label) || label,
        ((_c = overrides[index]) == null ? void 0 : _c.region) || "Layout / Detail",
        ((_d = overrides[index]) == null ? void 0 : _d.roleCopy) || {}
      );
    });
  }
  function secondaryContentOverrides(label) {
    if (label === "Slash-Men\xFC \xB7 Suche leer") return {
      0: { roleCopy: { Input: "Slash-Befehl suchen", Count: "Zuletzt verwendet" } },
      1: { label: "\xDCberschrift einf\xFCgen", roleCopy: { Icon: "H", Shortcut: "zuletzt verwendet" } },
      2: { label: "Quellenbeleg einf\xFCgen", roleCopy: { Icon: "\xA7", Shortcut: "zuletzt verwendet" } }
    };
    if (label === "Slash-Men\xFC \xB7 Treffer") return {
      0: { roleCopy: { Input: "Befehl \u201E\xDCberschrift\u201C", Count: "2 passende Befehle" } },
      1: { label: "\xDCberschrift einf\xFCgen", roleCopy: { Icon: "H", Shortcut: "\u23181" } },
      2: { label: "\xDCberschrift einf\xFCgen", roleCopy: { Icon: "H", Shortcut: "ausgew\xE4hlt" } }
    };
    if (label === "Slash-Men\xFC \xB7 Keine Treffer") return {
      0: { roleCopy: { Input: "Befehl \u201EZeitachse\u201C", Count: "0 Treffer \xB7 Suchbegriff \xE4ndern" } },
      1: { label: "Kein passender Befehl", roleCopy: { Title: "Keine Befehle gefunden", Description: "Suchbegriff \xE4ndern oder k\xFCrzer eingeben.", Action: "Suche l\xF6schen" } },
      2: { label: "Suche l\xF6schen" }
    };
    if (label === "Blockeinf\xFCgung \xB7 Position w\xE4hlen") return {
      0: { label: "Nach Absatz \u201EPrinzipien\u201C", roleCopy: { Label: "Einf\xFCgeposition", Value: "Nach Absatz \u201EPrinzipien\u201C", Status: "Position gew\xE4hlt" } },
      1: { label: "Nach der Fundstelle einf\xFCgen", roleCopy: { Icon: "\u2193", Shortcut: "ausgew\xE4hlt" } },
      2: { label: "Block einf\xFCgen" },
      3: { label: "Abbrechen" }
    };
    if (label === "Quellenleser \xB7 Fundstelle \xFCbernehmen") return {
      0: { label: "Markierte Fundstelle", roleCopy: { Title: "Markierte Fundstelle", Location: "Seite 12 \xB7 Absatz 3", Excerpt: "Diese Passage belegt die Aussage zur ruhigen Technik.", Status: "Zur \xDCbernahme bereit", Action: "Mit Beleg verkn\xFCpfen" } },
      1: { label: "Beleg verifiziert", roleCopy: { Claim: "Ruhige Technik informiert ohne Unterbrechung.", Source: "Weiser \xB7 Brown \xB7 Seite 12", Confidence: "Verifiziert", Action: "Beleg \xFCbernehmen" } },
      2: { label: "Fundstelle \xFCbernehmen" },
      3: { label: "Zur\xFCck" }
    };
    if (label === "Rechercheablauf \xB7 Pausiert und Fehler") return {
      0: { label: "Recherche pausiert", roleCopy: { Query: "Wirkung von Schreibassistenz", Progress: "2 von 5 Schritten", Sources: "3 Quellen vorgemerkt", Status: "Pausiert", Action: "Recherche fortsetzen" } },
      1: { label: "Recherchefehler", roleCopy: { Query: "Wirkung von Schreibassistenz", Progress: "Recherche unterbrochen", Sources: "Quellenstand bleibt erhalten", Status: "Verbindung fehlgeschlagen", Action: "Erneut versuchen" } },
      2: { label: "Recherche fortsetzen", roleCopy: { Icon: "\u21BB", Shortcut: "Wiederherstellung" } },
      3: { label: "Fehlerdetails pr\xFCfen", roleCopy: { Icon: "!", Shortcut: "Details" } }
    };
    return {};
  }
  function responsiveContentOverrides(name) {
    if (name === "Responsive / Bibliothek \xB7 320 Light" || name === "Responsive / Bibliothek \xB7 320 Dark") return {
      0: { label: "Projekte", roleCopy: { Icon: "\u25A4", Label: "Projekte", Count: "1", Status: "Aktiv" } },
      1: { label: "Suchen", roleCopy: { Icon: "\u2315", Input: "Suchen", Clear: "\u2014", Count: "0" } },
      2: { label: "Ansicht", roleCopy: { Label: "Ansicht", Value: "Alle", Chevron: "\u2304", Status: "Bereit" } },
      3: { label: "Text", roleCopy: { Leading: "\u25A4", Title: "Text", Meta: "1 S.", Status: "Klar", Action: "\u2192" } }
    };
    if (name === "Responsive / Editor \xB7 320 Light" || name === "Responsive / Editor \xB7 320 Dark") return {
      0: { label: "Editor", roleCopy: { Icon: "\u25A4", Label: "Editor", Count: "1", Status: "Aktiv" } },
      1: { label: "Text", roleCopy: { "Text Label": "Text", "Note Label": "Notiz", Indicator: "Aktiv" } },
      2: { label: "1 offen", roleCopy: { Symbol: "\u25CE", Message: "1 offen", "Primary Action": "\u2192", "Secondary Action": "Alle" } },
      3: { label: "Hinweis", roleCopy: { Symbol: "\xB6", Label: "Hinweis", Count: "1" } },
      4: { label: "Beleg", roleCopy: { Type: "Hinweis", Title: "Beleg", Body: "Quelle fehlt.", Scope: "Hier", "Primary Action": "Pr\xFCfen", "Secondary Action": "Sp\xE4ter", Status: "Offen" } }
    };
    if (name === "Responsive / Annotation \xB7 Beleg fehlt \xB7 Dark") return {
      0: { name: "Anker / Textbeleg fehlt", label: "Textbeleg fehlt", roleCopy: { Label: "Textbeleg fehlt", Count: "1 aktiver Hinweis" } },
      1: { name: "Formular / Quelle erg\xE4nzen", label: "Quelle erg\xE4nzen", roleCopy: { Label: "Quelle erg\xE4nzen" } },
      2: { name: "Anmerkung / Beleg fehlt", label: "Beleg fehlt", roleCopy: { "Primary Action": "Quelle verkn\xFCpfen", "Secondary Action": "Sp\xE4ter pr\xFCfen" } },
      3: { name: "Aktion / Quelle verkn\xFCpfen", label: "Quelle verkn\xFCpfen", roleCopy: { Symbol: "\u2192", Label: "Quelle verkn\xFCpfen", Hint: "Gepr\xFCfte Fundstelle \xFCbernehmen" } },
      4: { name: "Aktion / Sp\xE4ter pr\xFCfen", label: "Sp\xE4ter pr\xFCfen", roleCopy: { Symbol: "\u2190", Label: "Sp\xE4ter pr\xFCfen", Hint: "Hinweis bleibt offen" } }
    };
    if (name === "Responsive / Agent \xB7 Streaming \xB7 Dark") return {
      0: { name: "Aura / Antwort entsteht", label: "Aura pr\xFCft den Auftrag" },
      1: { name: "Agent / Antwort wird erstellt", label: "Antwort wird schrittweise erstellt" },
      2: { name: "Composer / Belegl\xFCcken pr\xFCfen", label: "Belegl\xFCcken pr\xFCfen" },
      3: { name: "Aktion / Senden gesperrt", label: "Senden gesperrt", roleCopy: { Symbol: "\xD7", Label: "Senden gesperrt", Hint: "Antwort wird noch erstellt" } }
    };
    if (name === "Responsive / Evidence \xB7 Konflikt \xB7 Dark") return {
      0: { name: "Evidence / Quellenkonflikt", label: "Quellen widersprechen sich" },
      1: { name: "Quelle / Ung\xFCltige Konfliktquelle", label: "Eine Konfliktquelle kann nicht gelesen werden", roleCopy: { Type: "Ung\xFCltige Quelle", Title: "Eine Konfliktquelle kann nicht gelesen werden", Meta: "Adresse oder Format der Fundstelle pr\xFCfen" } },
      2: { name: "Leser / Abweichende Fundstelle", label: "Abweichende Fundstelle", roleCopy: { Title: "Abweichende Fundstelle", Excerpt: "Diese abweichende Fundstelle widerspricht der zweiten Quelle.", Status: "Zum Konflikt markiert", Action: "Fundstelle vergleichen" } }
    };
    if (name === "Responsive / Dialog \xB7 Lang \xB7 Dark") return {
      0: { name: "Dialog / Datenkontrolle und Export", label: "Datenkontrolle und Export", roleCopy: { Eyebrow: "Exportpr\xFCfung" } },
      1: { name: "Aktion / Export fortsetzen", label: "Fortfahren", roleCopy: { Symbol: "\u2192", Label: "Fortfahren", Hint: "Exportpr\xFCfung abschlie\xDFen" } },
      2: { name: "Aktion / Datenkontrolle fortsetzen", label: "Zur\xFCck", roleCopy: { Symbol: "\u2190", Label: "Zur\xFCck", Hint: "Datenkontrolle weiter pr\xFCfen" } }
    };
    return {};
  }
  var agentSourceMatrix = [
    ["Gespr\xE4ch \xB7 Bereit", [["aura", "State=Idle"], ["agent-message", "Role=User"], ["composer", "State=Empty"]]],
    ["Gespr\xE4ch \xB7 Antwort entsteht", [["aura", "State=Working"], ["agent-message", "State=Streaming"], ["composer", "State=Draft"]]],
    ["Gespr\xE4ch \xB7 Antwort bereit", [["aura", "State=Complete"], ["agent-message", "Role=Agent"], ["evidence-card", "Status=Unverified"], ["source-card", "Status=Ready"]]],
    ["Gespr\xE4ch \xB7 Fehler & R\xFCckkehr", [["aura", "State=Error"], ["agent-message", "State=Error"], ["composer", "State=Draft"], ["status-symbol", "Status=Error"]]],
    ["Entscheidungsverlauf", [["decision-card", "Status=Pending"], ["decision-card", "Status=Accepted"], ["decision-card", "Status=Rejected"], ["decision-card", "Status=Overridden"]]],
    ["Evidence \xB7 Pr\xFCfmatrix", [["evidence-card", "Status=Unverified"], ["evidence-card", "Status=Verified"], ["evidence-card", "Status=Conflict"], ["evidence-card", "Status=Missing"], ["tag", "Kind=Source"]]],
    ["Quellen \xB7 Bereit und Laden", [["source-card", "Status=Ready"], ["source-card", "Status=Loading"]]],
    ["Quellen \xB7 Ung\xFCltig oder offline", [["source-card", "Status=Invalid"], ["source-card", "Status=Offline"], ["evidence-card", "Status=Missing"]]],
    ["Import \xB7 Auswahl und Validierung", [["import-panel", "State=Empty"], ["import-panel", "State=Validating"]]],
    ["Import \xB7 Bereit", [["import-panel", "State=Ready"], ["source-card", "Status=Ready"]]],
    ["Import \xB7 Fehler", [["import-panel", "State=Error"], ["status-symbol", "Status=Error"]]],
    ["Leser \xB7 Fundstelle", [["reader-panel", "State=Reading"], ["reader-panel", "State=Highlight"], ["evidence-card", "Status=Verified"]]],
    ["Leser \xB7 Nicht verf\xFCgbar", [["reader-panel", "State=Unavailable"], ["source-card", "Status=Offline"], ["status-symbol", "Status=Error"]]],
    ["Recherche \xB7 \xDCbersicht", [["research-card", "Status=Planned"], ["research-card", "Status=Running"], ["research-card", "Status=Paused"], ["research-card", "Status=Ready"]]],
    ["Recherche \xB7 Fehler", [["research-card", "Status=Error"], ["aura", "State=Error"], ["status-symbol", "Status=Error"]]]
  ];
  var secondaryMatrix = [
    ["Einstellungen \xB7 Bereit", [["field", "State=Filled"], ["select", "State=Selected"], ["mode-toggle", "Mode=Text, State=Active"], ["button", "Kind=Primary, State=Default"], ["button", "Kind=Secondary, State=Default"]]],
    ["Einstellungen \xB7 Validierungsfehler", [["field", "State=Error"], ["select", "State=Open"], ["mode-toggle", "Mode=Text, State=Active"], ["button", "Kind=Primary, State=Default"], ["button", "Kind=Secondary, State=Default"]]],
    ["Link-Men\xFC \xB7 Ge\xF6ffnet", [["menu-item", "State=Default"], ["menu-item", "State=Hover"], ["menu-item", "State=Selected"], ["menu-item", "State=Disabled"]]],
    ["Slash-Men\xFC \xB7 Suche leer", [["search", "State=Empty"], ["menu-item", "State=Default"], ["menu-item", "State=Default"]]],
    ["Slash-Men\xFC \xB7 Treffer", [["search", "State=Results"], ["menu-item", "State=Default"], ["menu-item", "State=Selected"]]],
    ["Slash-Men\xFC \xB7 Keine Treffer", [["search", "State=No Results"], ["empty-state", "Context=No Active Annotation"], ["button", "Kind=Secondary, State=Default"]]],
    ["Blockeinf\xFCgung \xB7 Position w\xE4hlen", [["select", "State=Open"], ["menu-item", "State=Selected"], ["dialog-action", "Kind=Primary"], ["dialog-action", "Kind=Secondary"]]],
    ["Quellenleser \xB7 Fundstelle \xFCbernehmen", [["reader-panel", "State=Highlight"], ["evidence-card", "Status=Verified"], ["dialog-action", "Kind=Primary"], ["dialog-action", "Kind=Secondary"]]],
    ["Rechercheablauf \xB7 Pausiert und Fehler", [["research-card", "Status=Paused"], ["research-card", "Status=Error"], ["menu-item", "State=Default"], ["menu-item", "State=Default"]]]
  ];
  function responsiveBase(subject, width) {
    const collapsed = width === 720 || width === 320;
    return subject === "Bibliothek" ? [["nav-item", collapsed ? "State=Collapsed" : "State=Default"], ["search", "State=Empty"], ["select", "State=Selected"], ["list-row", "State=Default"]] : [["nav-item", collapsed ? "State=Collapsed" : "State=Default"], ["mode-toggle", "Mode=Text, State=Active"], ["review-bar", "Status=Open"], ["annotation-anchor", "Kind=Text, State=Idle"], ["annotation-card", "State=Open"]];
  }
  var responsiveMatrix = [
    ["Responsive / Bibliothek \xB7 1440 Light", 1440, "Light", "Bibliothek", 1440, responsiveBase("Bibliothek", 1440)],
    ["Responsive / Bibliothek \xB7 1024 Light", 1024, "Light", "Bibliothek", 1024, responsiveBase("Bibliothek", 1024)],
    ["Responsive / Bibliothek \xB7 720 Light", 720, "Light", "Bibliothek", 720, responsiveBase("Bibliothek", 720)],
    ["Responsive / Bibliothek \xB7 320 Light", 320, "Light", "Bibliothek", 320, responsiveBase("Bibliothek", 320)],
    ["Responsive / Editor \xB7 1440 Light", 1440, "Light", "Editor", 1440, responsiveBase("Editor", 1440)],
    ["Responsive / Editor \xB7 1024 Light", 1024, "Light", "Editor", 1024, responsiveBase("Editor", 1024)],
    ["Responsive / Editor \xB7 720 Light", 720, "Light", "Editor", 720, responsiveBase("Editor", 720)],
    ["Responsive / Editor \xB7 320 Light", 320, "Light", "Editor", 320, responsiveBase("Editor", 320)],
    ["Responsive / Bibliothek \xB7 1440 Dark", 1440, "Dark", "Bibliothek", 1440, responsiveBase("Bibliothek", 1440)],
    ["Responsive / Bibliothek \xB7 320 Dark", 320, "Dark", "Bibliothek", 320, responsiveBase("Bibliothek", 320)],
    ["Responsive / Editor \xB7 1440 Dark", 1440, "Dark", "Editor", 1440, responsiveBase("Editor", 1440)],
    ["Responsive / Editor \xB7 320 Dark", 320, "Dark", "Editor", 320, responsiveBase("Editor", 320)],
    ["Responsive / Annotation \xB7 Beleg fehlt \xB7 Dark", 720, "Dark", "Annotation", "reference", [["annotation-anchor", "Kind=Text, State=Active"], ["annotation-form", "Form=Source"], ["annotation-card", "State=Open"], ["dialog-action", "Kind=Primary"], ["dialog-action", "Kind=Secondary"]]],
    ["Responsive / Agent \xB7 Streaming \xB7 Dark", 720, "Dark", "Agent", "reference", [["aura", "State=Working"], ["agent-message", "State=Streaming"], ["composer", "State=Draft"], ["dialog-action", "Kind=Disabled"]]],
    ["Responsive / Evidence \xB7 Konflikt \xB7 Dark", 720, "Dark", "Evidence", "reference", [["evidence-card", "Status=Conflict"], ["source-card", "Status=Invalid"], ["reader-panel", "State=Highlight"]]],
    ["Responsive / Dialog \xB7 Lang \xB7 Dark", 720, "Dark", "Dialog", "reference", [["dialog", "Size=Long"], ["dialog-action", "Kind=Primary"], ["dialog-action", "Kind=Secondary"]]]
  ];
  var SECONDARY_VIEW_DEFINITIONS = freezeSecondary({
    agentSources: agentSourceMatrix.map(([suffix, mapping]) => secondaryView({
      name: `Agent & Quellen / ${suffix}`,
      sectionName: "07 \xB7 Agent & Quellen",
      instances: mappedInstances(mapping, suffix)
    })),
    secondary: secondaryMatrix.map(([suffix, mapping]) => secondaryView({
      name: `Nebenansicht / ${suffix}`,
      sectionName: "09 \xB7 Men\xFCs & Nebenansichten",
      instances: mappedInstances(mapping, suffix, secondaryContentOverrides(suffix))
    })),
    responsive: responsiveMatrix.map(([name, width, theme, subject, breakpoint, mapping]) => secondaryView({
      name,
      sectionName: "10 \xB7 Responsive & Dark",
      width,
      theme,
      subject,
      breakpoint,
      layoutMode: width === 320 ? "VERTICAL" : "HORIZONTAL",
      instances: mappedInstances(mapping, `${subject} \xB7 ${width}px \xB7 ${theme}`, responsiveContentOverrides(name))
    }))
  });
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
      coreViews: CORE_VIEW_DEFINITIONS,
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
    return textNode2.getStyledTextSegments(["fills", "boundVariables"]).map((segment) => ({
      start: segment.start,
      end: segment.end,
      fills: collectVisibleFillBindings(segment.fills),
      fieldVariableIds: collectFieldVariableIds(segment, ["fontSize", "fontWeight"])
    }));
  }
  function validateTextRangeBindingCoverage(ranges, {
    charactersLength,
    fillVariableId,
    fontSizeVariableId,
    fontWeightVariableId
  } = {}) {
    var _a, _b;
    if (!Number.isInteger(charactersLength) || charactersLength <= 0 || !Array.isArray(ranges) || ranges.length === 0) return false;
    let cursor = 0;
    for (const range of ranges) {
      if (!Number.isInteger(range == null ? void 0 : range.start) || !Number.isInteger(range == null ? void 0 : range.end) || range.start !== cursor || range.end <= range.start || range.end > charactersLength || !exactFillBindings(range.fills, [fillVariableId]) || !sameArray((_a = range.fieldVariableIds) == null ? void 0 : _a.fontSize, [fontSizeVariableId]) || !sameArray((_b = range.fieldVariableIds) == null ? void 0 : _b.fontWeight, [fontWeightVariableId])) return false;
      cursor = range.end;
    }
    return cursor === charactersLength;
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
  function componentVariantPropertyExpectations(definition2) {
    const axes = /* @__PURE__ */ new Map();
    for (const variant of definition2.variants) {
      for (const part of variant.name.split(", ")) {
        const separator = part.indexOf("=");
        const name = part.slice(0, separator);
        const value = part.slice(separator + 1);
        if (!axes.has(name)) axes.set(name, { name, defaultValue: value, variantOptions: [] });
        const axis = axes.get(name);
        if (!axis.variantOptions.includes(value)) axis.variantOptions.push(value);
      }
    }
    return [...axes.values()];
  }
  function validateComponentMutationInventory(inventory = {}, componentId) {
    const errors = [];
    if (!COMPONENT_DEFINITIONS.some((component) => component.id === componentId)) return { valid: false, errors: [`Unbekannte Komponente: ${componentId}`] };
    const allSets = Array.isArray(inventory.sets) ? inventory.sets : [];
    const allSamples = Array.isArray(inventory.samples) ? inventory.samples : [];
    const allStaging = Array.isArray(inventory.staging) ? inventory.staging : [];
    const containers = Array.isArray(inventory.containers) ? inventory.containers : [];
    const targetPage = inventory.targetPage;
    if (targetPage && (targetPage.type !== "PAGE" || targetPage.name !== TARGET_PAGE_NAME || !targetPage.id)) errors.push("Ung\xFCltige Komponenten-Zielseite.");
    if (containers.length > 1) errors.push("Komponenten-Section fehlt oder ist nicht eindeutig.");
    const container = containers.length === 1 ? containers[0] : null;
    if (container && (container.name !== "02 \xB7 Komponenten" || container.type !== "SECTION" || container.owner !== PLUGIN_ORIGIN || container.parentId !== (targetPage == null ? void 0 : targetPage.id) || container.parentType !== "PAGE" || container.parentName !== TARGET_PAGE_NAME)) errors.push("Komponenten-Section ist nicht direkt und Onda-eigen.");
    if ((allSets.length || allSamples.length || allStaging.length) && !container && containers.length === 0 && inventory.containers !== void 0) errors.push("Komponenten-Inventar hat keine Ziel-Section.");
    function validContainerAncestry(record) {
      if (!container) return inventory.containers === void 0;
      return record.containerId === container.nodeId && record.containerType === container.type && record.containerName === container.name && record.containerOwner === container.owner && record.containerParentId === container.parentId && record.containerParentType === container.parentType && record.containerParentName === container.parentName;
    }
    const expectedSetNames = new Set(COMPONENT_DEFINITIONS.map((definition2) => definition2.name));
    const expectedSampleNames = new Set(COMPONENT_DEFINITIONS.map((definition2) => `${definition2.name} / Dokumentationsinstanz`));
    for (const set of allSets) if (!expectedSetNames.has(set.name)) errors.push(`Unerwarteter Onda-Komponentenkandidat: ${set.name}`);
    for (const sample of allSamples) if (!expectedSampleNames.has(sample.name)) errors.push(`Unerwarteter Onda-Instanzkandidat: ${sample.name}`);
    for (const staging of allStaging) if (!COMPONENT_DEFINITIONS.some((definition2) => definition2.id === staging.stagingComponent)) errors.push(`Unerwartetes Komponenten-Staging: ${staging.name}`);
    for (const definition2 of COMPONENT_DEFINITIONS) {
      const sets = allSets.filter((set2) => set2.name === definition2.name);
      const samples = allSamples.filter((sample2) => sample2.name === `${definition2.name} / Dokumentationsinstanz`);
      const stagingNodes = allStaging.filter((item) => item.stagingComponent === definition2.id);
      if (sets.length > 1) errors.push(`Doppeltes ComponentSet: ${definition2.name}`);
      if (samples.length > 1) errors.push(`Doppelte Dokumentationsinstanz: ${definition2.name}`);
      const set = sets.length === 1 ? sets[0] : null;
      const sample = samples.length === 1 ? samples[0] : null;
      if (!set && sample) errors.push(`Verwaiste Dokumentationsinstanz: ${definition2.name}`);
      if (set) {
        if (!set.nodeId || set.parentType !== "SECTION" || set.parentName !== "02 \xB7 Komponenten" || !set.parentId) errors.push(`Falscher Set-Parent: ${definition2.name}`);
        if (!validContainerAncestry(set)) errors.push(`Falsche Set-Ancestry: ${definition2.name}`);
        if (set.type !== "COMPONENT_SET") errors.push(`Falscher Set-Typ: ${definition2.name}`);
        if (set.owner !== PLUGIN_ORIGIN) errors.push(`Ungesch\xFCtztes ComponentSet: ${definition2.name}`);
        const variants = Array.isArray(set.variants) ? set.variants : [];
        const expectedNames = definition2.variants.map((variant) => variant.name);
        if (new Set(variants.map((variant) => variant.name)).size !== variants.length || variants.some((variant) => !expectedNames.includes(variant.name))) errors.push(`Ung\xFCltiges Varianteninventar: ${definition2.name}`);
        for (const variant of variants) {
          const variantName = variant.name;
          if (variant.type !== "COMPONENT" || variant.owner !== PLUGIN_ORIGIN) errors.push(`Ungesch\xFCtzte oder falsche Variante: ${definition2.name}/${variantName}`);
          if (!variant.nodeId || variant.parentId !== set.nodeId || variant.parentType !== "COMPONENT_SET" || variant.parentName !== set.name) errors.push(`Falscher Varianten-Parent: ${definition2.name}/${variantName}`);
          const effectStyleId = variant.effectStyleId || null;
          const effectStyleName = variant.effectStyleName || null;
          const effectStyleOwner = variant.effectStyleOwner || null;
          if (definition2.effectStyleName) {
            if (effectStyleId && (effectStyleName !== definition2.effectStyleName || effectStyleOwner !== PLUGIN_ORIGIN)) errors.push(`Ung\xFCltiger Varianten-Effektstil: ${definition2.name}/${variantName}`);
          } else if (effectStyleId || effectStyleName || effectStyleOwner) errors.push(`Unerlaubter Varianten-Effektstil: ${definition2.name}/${variantName}`);
          const roles = Array.isArray(variant.roles) ? variant.roles : [];
          const expectedRoles = new Map(definition2.roles.map((role) => [`Role/${role.name}`, role]));
          if (new Set(roles.map((role) => role.name)).size !== roles.length || roles.some((role) => !expectedRoles.has(role.name))) errors.push(`Ung\xFCltiges Rolleninventar: ${definition2.name}/${variantName}`);
          for (const role of roles) {
            const roleDefinition = expectedRoles.get(role.name);
            if (!roleDefinition || role.type !== roleDefinition.type || role.owner !== PLUGIN_ORIGIN) errors.push(`Rolle ist ungesch\xFCtzt oder falsch: ${definition2.name}/${variantName}/${role.name}`);
            if (!role.nodeId || role.parentId !== variant.nodeId || role.parentType !== "COMPONENT" || role.parentName !== variant.name) errors.push(`Falscher Rollen-Parent: ${definition2.name}/${variantName}/${role.name}`);
          }
        }
        const properties = Array.isArray(set.componentProperties) ? set.componentProperties : [];
        const variantExpectations = componentVariantPropertyExpectations(definition2);
        const variantPropertyNames = new Set(variantExpectations.map((property) => property.name));
        const labels = properties.filter((property) => property.name === "Label");
        const variantProperties = properties.filter((property) => property.type === "VARIANT");
        if (labels.length > 1 || labels.length === 1 && (labels[0].type !== "TEXT" || labels[0].defaultValue !== definition2.variants[0].copy[definition2.labelRole]) || properties.some((property) => property.type === "TEXT" && property.name !== "Label" || property.type === "VARIANT" && !variantPropertyNames.has(property.name) || !["TEXT", "VARIANT"].includes(property.type)) || new Set(variantProperties.map((property) => property.name)).size !== variantProperties.length || variantProperties.some((property) => {
          const expected = variantExpectations.find((item) => item.name === property.name);
          return !expected || !expected.variantOptions.includes(property.defaultValue) || !Array.isArray(property.variantOptions) || new Set(property.variantOptions).size !== property.variantOptions.length || property.variantOptions.some((option) => !expected.variantOptions.includes(option));
        })) errors.push(`Ung\xFCltige Label-Property: ${definition2.name}`);
      }
      if (sample) {
        if (!set) errors.push(`Verwaiste Dokumentationsinstanz: ${definition2.name}`);
        if (!sample.nodeId || sample.parentId !== (set == null ? void 0 : set.parentId) || sample.parentType !== "SECTION" || sample.parentName !== "02 \xB7 Komponenten") errors.push(`Falscher Instanz-Parent: ${definition2.name}`);
        if (!validContainerAncestry(sample)) errors.push(`Falsche Instanz-Ancestry: ${definition2.name}`);
        if (sample.type !== "INSTANCE" || sample.owner !== PLUGIN_ORIGIN || sample.documentation !== true || sample.repeatedScreen !== false) errors.push(`Ung\xFCltige Dokumentationsinstanz: ${definition2.name}`);
        const ownedVariantIds = new Set(((set == null ? void 0 : set.variants) || []).map((variant) => variant.nodeId));
        if (set && !ownedVariantIds.has(sample.mainComponentId)) errors.push(`Falsch verkn\xFCpfte Dokumentationsinstanz: ${definition2.name}`);
      }
      if (set && stagingNodes.length) errors.push(`Staging neben ComponentSet: ${definition2.name}`);
      const stagingNames = stagingNodes.map((item) => item.stagingVariant);
      if (new Set(stagingNames).size !== stagingNames.length) errors.push(`Doppeltes Komponenten-Staging: ${definition2.name}`);
      const expectedVariantNames = new Set(definition2.variants.map((variant) => variant.name));
      for (const staging of stagingNodes) {
        if (staging.type !== "COMPONENT" || staging.owner !== PLUGIN_ORIGIN || staging.name !== staging.stagingVariant || !expectedVariantNames.has(staging.stagingVariant) || staging.parentId !== (container == null ? void 0 : container.nodeId) || staging.parentType !== "SECTION" || staging.parentName !== "02 \xB7 Komponenten" || !validContainerAncestry(staging)) errors.push(`Ung\xFCltiges Komponenten-Staging: ${definition2.name}/${staging.stagingVariant}`);
        const variantDefinition = definition2.variants.find((variant) => variant.name === staging.stagingVariant);
        const expectedRoles = new Map(definition2.roles.map((role) => [`Role/${role.name}`, role]));
        const roles = Array.isArray(staging.roles) ? staging.roles : [];
        if (new Set(roles.map((role) => role.name)).size !== roles.length || roles.some((role) => !expectedRoles.has(role.name))) errors.push(`Ung\xFCltige Staging-Rollen: ${definition2.name}/${staging.stagingVariant}`);
        for (const role of roles) {
          const roleDefinition = expectedRoles.get(role.name);
          if (!variantDefinition || !roleDefinition || role.type !== roleDefinition.type || role.owner !== PLUGIN_ORIGIN || role.parentId !== staging.nodeId || role.parentType !== "COMPONENT" || role.parentName !== staging.name) errors.push(`Ung\xFCltige Staging-Rolle: ${definition2.name}/${staging.stagingVariant}/${role.name}`);
        }
      }
    }
    return { valid: errors.length === 0, errors };
  }
  async function readMainComponentIdentity(instance) {
    const mainComponent = await instance.getMainComponentAsync();
    return { id: (mainComponent == null ? void 0 : mainComponent.id) || null, key: (mainComponent == null ? void 0 : mainComponent.key) || null };
  }
  async function readEffectStyleId(node) {
    if (!node || typeof node.getEffectStyleIdAsync !== "function") return null;
    return await node.getEffectStyleIdAsync() || null;
  }
  function canonicalScalar(value) {
    if (Array.isArray(value)) return value.map(canonicalScalar);
    if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalScalar(value[key])]));
    return value != null ? value : null;
  }
  function canonicalComponentRecord(record = {}, extraKeys = []) {
    const keys = [
      "id",
      "nodeId",
      "name",
      "type",
      "owner",
      "parentId",
      "parentType",
      "parentName",
      "containerId",
      "containerType",
      "containerName",
      "containerOwner",
      "containerParentId",
      "containerParentType",
      "containerParentName",
      ...extraKeys
    ];
    return Object.fromEntries(keys.map((key) => [key, canonicalScalar(record[key])]));
  }
  function sortComponentRecords(records) {
    return [...records].sort((left, right) => {
      const leftKey = JSON.stringify(left);
      const rightKey = JSON.stringify(right);
      return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
    });
  }
  function canonicalComponentMutationSnapshot(inventory = {}) {
    function role(record) {
      return canonicalComponentRecord(record, ["characterPropertyKey"]);
    }
    function component(record) {
      return __spreadProps(__spreadValues({}, canonicalComponentRecord(record, ["effectStyleId", "effectStyleName", "effectStyleOwner"])), {
        roles: sortComponentRecords((record.roles || []).map(role))
      });
    }
    function property(record) {
      return canonicalComponentRecord(record, ["key", "defaultValue", "variantOptions"]);
    }
    function set(record) {
      return __spreadProps(__spreadValues({}, canonicalComponentRecord(record)), {
        componentProperties: sortComponentRecords((record.componentProperties || []).map(property)),
        variants: sortComponentRecords((record.variants || []).map(component))
      });
    }
    function staging(record) {
      return __spreadProps(__spreadValues({}, canonicalComponentRecord(record, ["stagingComponent", "stagingVariant", "effectStyleId", "effectStyleName", "effectStyleOwner"])), {
        roles: sortComponentRecords((record.roles || []).map(role))
      });
    }
    return {
      targetPage: canonicalComponentRecord(inventory.targetPage || {}, []),
      containers: sortComponentRecords((inventory.containers || []).map((record) => canonicalComponentRecord(record))),
      sets: sortComponentRecords((inventory.sets || []).map(set)),
      samples: sortComponentRecords((inventory.samples || []).map((record) => canonicalComponentRecord(record, ["mainComponentId", "documentation", "repeatedScreen"]))),
      staging: sortComponentRecords((inventory.staging || []).map(staging))
    };
  }
  async function executeGuardedComponentCommand({ command, phases, preflight, requireContext, collectCurrentInventory, mutate }) {
    const transition = validatePhaseTransition(command, phases);
    if (!transition.ok) throw new Error(transition.warning);
    const componentId = command.startsWith("component-") ? command.slice("component-".length) : "";
    const preflightInventory = await preflight();
    const context = await requireContext();
    if (typeof collectCurrentInventory !== "function") throw new Error("TOCTOU: zweite Komponenten-Inventur fehlt.");
    const currentInventory = await collectCurrentInventory(context, componentId);
    const currentValidation = validateComponentMutationInventory(currentInventory, componentId);
    if (!currentValidation.valid) throw new Error(`TOCTOU: aktuelles Komponenten-Inventar ung\xFCltig.
${currentValidation.errors.join("\n")}`);
    const before = canonicalComponentMutationSnapshot(preflightInventory);
    const current = canonicalComponentMutationSnapshot(currentInventory);
    if (JSON.stringify(before) !== JSON.stringify(current)) throw new Error("TOCTOU: Komponenten-Inventar wurde nach Preflight ver\xE4ndert.");
    return mutate(context, currentInventory);
  }
  function collectComponentInventoryLocations(page) {
    const exactNames = new Set(COMPONENT_DEFINITIONS.flatMap((definition2) => [definition2.name, `${definition2.name} / Dokumentationsinstanz`]));
    const candidates = [];
    const containers = [];
    function owner(node) {
      return typeof (node == null ? void 0 : node.getPluginData) === "function" ? node.getPluginData("ondaOrigin") : "";
    }
    function visit(parent, currentContainer = null) {
      var _a;
      if (!parent || !Array.isArray(parent.children)) return;
      for (const node of parent.children) {
        let container = currentContainer;
        if (node.name === "02 \xB7 Komponenten") {
          container = {
            node,
            nodeId: node.id,
            name: node.name,
            type: node.type,
            owner: owner(node),
            parentId: parent.id,
            parentType: parent.type,
            parentName: parent.name
          };
          containers.push(container);
        }
        const stagingComponent = typeof node.getPluginData === "function" ? node.getPluginData("ondaStagingComponent") : "";
        const stagingVariant = typeof node.getPluginData === "function" ? node.getPluginData("ondaStagingVariant") : "";
        if (exactNames.has(node.name) || ((_a = node.name) == null ? void 0 : _a.startsWith("Onda/")) || stagingComponent || stagingVariant) {
          candidates.push({
            node,
            nodeId: node.id,
            name: node.name,
            type: node.type,
            parentId: parent.id,
            parentType: parent.type,
            parentName: parent.name,
            owner: owner(node),
            containerId: (container == null ? void 0 : container.nodeId) || null,
            containerType: (container == null ? void 0 : container.type) || null,
            containerName: (container == null ? void 0 : container.name) || null,
            containerOwner: (container == null ? void 0 : container.owner) || "",
            containerParentId: (container == null ? void 0 : container.parentId) || null,
            containerParentType: (container == null ? void 0 : container.parentType) || null,
            containerParentName: (container == null ? void 0 : container.parentName) || null,
            stagingComponent,
            stagingVariant
          });
        }
        visit(node, container);
      }
    }
    visit(page);
    return {
      targetPage: { id: page.id, name: page.name, type: page.type },
      containers,
      candidates
    };
  }
  function collectComponentPropertyInventory(definitions = {}) {
    return Object.entries(definitions).map(([key, property]) => ({
      key,
      name: key.split("#")[0],
      type: property.type,
      defaultValue: property.defaultValue,
      variantOptions: Array.isArray(property.variantOptions) ? [...property.variantOptions] : void 0
    }));
  }
  async function executeStagingAssembly({ staging, expectedVariantNames, createVariant, combine, clearStaging }) {
    const names = staging.map((entry) => entry.variantName);
    if (new Set(names).size !== names.length || names.some((name) => !expectedVariantNames.includes(name))) throw new Error("Ung\xFCltiges Staging-Inventar.");
    for (const variantName of expectedVariantNames) {
      if (!staging.some((entry) => entry.variantName === variantName)) staging.push(await createVariant(variantName));
    }
    const ordered = expectedVariantNames.map((name) => staging.find((entry) => entry.variantName === name));
    const set = await combine(ordered);
    for (const entry of ordered) await clearStaging(entry);
    return set;
  }
  async function revalidateComponentNodeRecords({ inventory = {}, targetPage, getNodeById }) {
    var _a, _b, _c;
    if (!targetPage || targetPage.type !== "PAGE" || targetPage.name !== TARGET_PAGE_NAME) throw new Error("TOCTOU: falsche Zielseite.");
    if (inventory.targetPage && (inventory.targetPage.id !== targetPage.id || inventory.targetPage.name !== targetPage.name || inventory.targetPage.type !== targetPage.type)) throw new Error("TOCTOU: Zielseite wurde ausgetauscht.");
    const records = [];
    function add(record) {
      if (!(record == null ? void 0 : record.nodeId) || records.some((item) => item.nodeId === record.nodeId)) return;
      records.push(record);
    }
    for (const container of inventory.containers || []) add(container);
    for (const set of inventory.sets || []) {
      add(set);
      for (const variant of set.variants || []) {
        add(variant);
        for (const role of variant.roles || []) add(role);
      }
    }
    for (const staging of inventory.staging || []) {
      add(staging);
      for (const role of staging.roles || []) add(role);
    }
    for (const sample of inventory.samples || []) add(sample);
    const resolved = /* @__PURE__ */ new Map();
    for (const record of records) {
      const node = await getNodeById(record.nodeId);
      if (!node || node.id !== record.nodeId || node.name !== record.name || node.type !== record.type || ((_a = node.parent) == null ? void 0 : _a.id) !== record.parentId || ((_b = node.parent) == null ? void 0 : _b.type) !== record.parentType || ((_c = node.parent) == null ? void 0 : _c.name) !== record.parentName || record.owner !== void 0 && node.getPluginData("ondaOrigin") !== record.owner || record.stagingComponent !== void 0 && node.getPluginData("ondaStagingComponent") !== record.stagingComponent || record.stagingVariant !== void 0 && node.getPluginData("ondaStagingVariant") !== record.stagingVariant) throw new Error(`TOCTOU: Knoten ver\xE4ndert oder ersetzt: ${record.nodeId}`);
      resolved.set(record.nodeId, node);
    }
    return resolved;
  }
  function buildComponentRecoveryActions(inventory = {}, componentId) {
    const validation = validateComponentMutationInventory(inventory, componentId);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    const definition2 = COMPONENT_DEFINITIONS.find((component) => component.id === componentId);
    const set = (inventory.sets || []).find((item) => item.name === definition2.name);
    if (!set) return [{ type: "set" }];
    const actions = [];
    for (const variantDefinition of definition2.variants) {
      const variant = (set.variants || []).find((item) => item.name === variantDefinition.name);
      if (!variant) {
        actions.push({ type: "variant", variantName: variantDefinition.name });
        continue;
      }
      for (const roleDefinition of definition2.roles) {
        const roleName = `Role/${roleDefinition.name}`;
        if (!(variant.roles || []).some((role) => role.name === roleName)) actions.push({ type: "role", variantName: variantDefinition.name, roleName });
      }
    }
    if (!(set.componentProperties || []).some((property) => property.name === "Label" && property.type === "TEXT")) actions.push({ type: "property" });
    const sample = (inventory.samples || []).find((item) => item.name === `${definition2.name} / Dokumentationsinstanz`);
    if (!sample) actions.push({ type: "sample" });
    else {
      const defaultVariantName = definition2.variants[0].name;
      const defaultVariant = (set.variants || []).find((variant) => variant.name === defaultVariantName);
      if (!defaultVariant || sample.mainComponentId !== defaultVariant.nodeId) actions.push({ type: "relink-sample", variantName: defaultVariantName });
    }
    return actions;
  }
  var CORE_LEGACY_VIEW_NAMES = Object.freeze({
    "Bibliothek / Gef\xFCllte Bibliothek": "Bibliothek / Projekte \xB7 Gef\xFCllt",
    "Bibliothek / Leerzustand": "Bibliothek / Leerzustand",
    "Editor / Desktop \xB7 Bereit": "Editor / Textmodus \xB7 Bereit",
    "Editor / Desktop \xB7 Review offen": "Editor / Review \xB7 Offen"
  });
  function reconcileLegacyCoreChildren(frame, expectedTopLevelNames = /* @__PURE__ */ new Set()) {
    const candidates = [...(frame == null ? void 0 : frame.children) || []].filter((child) => !expectedTopLevelNames.has(child.name));
    const ownerOf = (node) => {
      var _a;
      return (_a = node == null ? void 0 : node.owner) != null ? _a : typeof (node == null ? void 0 : node.getPluginData) === "function" ? node.getPluginData("ondaOrigin") : "";
    };
    const unsafe = candidates.find((node) => ownerOf(node) !== PLUGIN_ORIGIN);
    if (unsafe) throw new Error(`Core-Views: fremdes oder ungesch\xFCtztes Legacy-Kind ${unsafe.name}`);
    for (const child of candidates) {
      child.visible = false;
      if ("layoutPositioning" in child) child.layoutPositioning = "ABSOLUTE";
    }
    return candidates;
  }
  function expectedCoreSectionNames() {
    return ["00 \xB7 \xDCbersicht", "03 \xB7 Bibliothek", "04 \xB7 Editor"];
  }
  function validateCoreViewMutationInventory(inventory = {}) {
    var _a;
    const errors = [];
    const targetPage = inventory.targetPage;
    const sections = Array.isArray(inventory.sections) ? inventory.sections : [];
    const views = Array.isArray(inventory.views) ? inventory.views : [];
    const legacyViews = Array.isArray(inventory.legacyViews) ? inventory.legacyViews : [];
    const allViews = [...views, ...legacyViews];
    if (!targetPage || targetPage.type !== "PAGE" || targetPage.name !== TARGET_PAGE_NAME || !targetPage.id) errors.push("Core-Views: Zielseite ung\xFCltig");
    const sectionNames = new Set(expectedCoreSectionNames());
    if (new Set(sections.map((section) => section.name)).size !== sections.length) errors.push("Core-Views: doppelte Sections");
    for (const section of sections) {
      if (!sectionNames.has(section.name) || section.type !== "SECTION" || section.owner !== PLUGIN_ORIGIN || section.parentId !== (targetPage == null ? void 0 : targetPage.id) || section.parentType !== "PAGE" || section.parentName !== TARGET_PAGE_NAME) errors.push(`Core-Views: ung\xFCltige Section ${section.name}`);
    }
    const expectedNames = new Set(CORE_VIEW_DEFINITIONS.map((definition2) => definition2.name));
    const allowedLegacyNames = new Set(Object.keys(CORE_LEGACY_VIEW_NAMES));
    for (const view of allViews) if (!expectedNames.has(view.name) && !allowedLegacyNames.has(view.name)) errors.push(`Core-Views: unerwarteter View-Kandidat ${view.name}`);
    for (const definition2 of CORE_VIEW_DEFINITIONS) {
      const matching = allViews.filter((view2) => (CORE_LEGACY_VIEW_NAMES[view2.name] || view2.name) === definition2.name);
      if (matching.length > 1) {
        errors.push(`Core-Views: doppelter View ${definition2.name}`);
        continue;
      }
      if (!matching.length) continue;
      const view = matching[0];
      if (!view.nodeId || view.type !== "FRAME" || view.owner !== PLUGIN_ORIGIN || view.parentType !== "SECTION" || view.parentName !== definition2.sectionName || !view.parentId) errors.push(`Core-Views: ung\xFCltiger View ${definition2.name}`);
      const allChildren = [...view.layoutRegions || [], ...view.copyNodes || [], ...view.instances || [], ...view.standIns || []];
      for (const child of allChildren) if (!child.nodeId || child.owner !== PLUGIN_ORIGIN || child.parentType !== "FRAME") errors.push(`Core-Views: ungesch\xFCtztes View-Kind ${definition2.name}/${child.name}`);
      if (view.name !== definition2.name || view.legacy === true) continue;
      const expectedRegions = new Map(definition2.regions.map((region) => [region.name, region]));
      const layoutRegions = Array.isArray(view.layoutRegions) ? view.layoutRegions : [];
      if (new Set(layoutRegions.map((region) => region.name)).size !== layoutRegions.length || layoutRegions.some((region) => !expectedRegions.has(region.name))) errors.push(`Core-Views: ung\xFCltige Layout-Region ${definition2.name}`);
      const regionByName = new Map(layoutRegions.map((region) => [region.name, region]));
      for (const region of layoutRegions) {
        const contract = expectedRegions.get(region.name);
        const expectedParentId = (contract == null ? void 0 : contract.parentName) === definition2.name ? view.nodeId : (_a = regionByName.get(contract == null ? void 0 : contract.parentName)) == null ? void 0 : _a.nodeId;
        if (region.type !== "FRAME" || region.layoutMode === "NONE" || region.parentName !== (contract == null ? void 0 : contract.parentName) || !expectedParentId || region.parentId !== expectedParentId) errors.push(`Core-Views: Layout-Hierarchie ung\xFCltig ${definition2.name}/${region.name}`);
      }
      const expectedCopyRoles = new Set(definition2.copyContracts.map((copy) => copy.role));
      const copyNodes = Array.isArray(view.copyNodes) ? view.copyNodes : [];
      if (new Set(copyNodes.map((node) => node.role)).size !== copyNodes.length || copyNodes.some((node) => !expectedCopyRoles.has(node.role))) errors.push(`Core-Views: ung\xFCltige Copy ${definition2.name}`);
      for (const copy of copyNodes) {
        const contract = definition2.copyContracts.find((item) => item.role === copy.role);
        const parent = regionByName.get(contract == null ? void 0 : contract.region);
        if (!copy.nodeId || copy.type !== "TEXT" || copy.owner !== PLUGIN_ORIGIN || copy.parentId !== (parent == null ? void 0 : parent.nodeId) || copy.parentType !== "FRAME" || copy.parentName !== (contract == null ? void 0 : contract.region)) errors.push(`Core-Views: falsche Copy-Ancestry ${definition2.name}/${copy.role}`);
      }
      const expectedInstances = new Map(definition2.instances.map((instance) => [instance.name, instance]));
      const instances = Array.isArray(view.instances) ? view.instances : [];
      if (new Set(instances.map((instance) => instance.name)).size !== instances.length || instances.some((instance) => !expectedInstances.has(instance.name))) errors.push(`Core-Views: ung\xFCltiges Instanzinventar ${definition2.name}`);
      for (const instance of instances) {
        const contract = expectedInstances.get(instance.name);
        const parent = regionByName.get(contract == null ? void 0 : contract.region);
        if (!instance.nodeId || instance.type !== "INSTANCE" || instance.owner !== PLUGIN_ORIGIN || instance.parentId !== (parent == null ? void 0 : parent.nodeId) || instance.parentType !== "FRAME" || instance.parentName !== (contract == null ? void 0 : contract.region)) errors.push(`Core-Views: falsche Instanz-Ancestry ${definition2.name}/${instance.name}`);
        const roleDescendants = Array.isArray(instance.roleDescendants) ? instance.roleDescendants : [];
        if (new Set(roleDescendants.map((role) => role.nodeId)).size !== roleDescendants.length || new Set(roleDescendants.map((role) => role.role)).size !== roleDescendants.length) errors.push(`Core-Views: doppelte Rollen ${definition2.name}/${instance.name}`);
        for (const role of roleDescendants) if (!role.nodeId || role.type !== "TEXT" || role.owner !== PLUGIN_ORIGIN || role.parentId !== instance.nodeId || role.parentType !== "INSTANCE" || role.parentInstanceId !== instance.nodeId) errors.push(`Core-Views: ungesch\xFCtzte oder verschobene Rolle ${definition2.name}/${instance.name}/${role.name}`);
      }
      if ((view.standIns || []).some((node) => node.visible !== false)) errors.push(`Core-Views: sichtbarer Ersatzknoten ${definition2.name}`);
    }
    const overview = inventory.overview;
    if (overview && (!overview.nodeId || overview.name !== CORE_OVERVIEW_DEFINITION.name || overview.type !== "FRAME" || overview.owner !== PLUGIN_ORIGIN || overview.parentType !== "SECTION" || overview.parentName !== "00 \xB7 \xDCbersicht")) errors.push("Core-Views: \xDCbersicht ung\xFCltig");
    for (const child of [...(overview == null ? void 0 : overview.lines) || [], ...(overview == null ? void 0 : overview.standIns) || []]) if (!child.nodeId || child.owner !== PLUGIN_ORIGIN || child.parentId !== overview.nodeId || child.parentType !== "FRAME" || child.parentName !== CORE_OVERVIEW_DEFINITION.name) errors.push(`Core-Views: ungesch\xFCtztes oder verschobenes \xDCbersichtskind ${child.name}`);
    return { valid: errors.length === 0, errors };
  }
  function canonicalCoreRecord(record = {}, extraKeys = []) {
    const keys = ["nodeId", "name", "type", "owner", "parentId", "parentType", "parentName", ...extraKeys];
    return Object.fromEntries(keys.map((key) => {
      var _a;
      return [key, canonicalScalar((_a = record[key]) != null ? _a : null)];
    }));
  }
  function sortCoreRecords(records) {
    return [...records].sort((left, right) => `${left.name || ""}\0${left.nodeId || ""}`.localeCompare(`${right.name || ""}\0${right.nodeId || ""}`));
  }
  function canonicalCoreViewMutationSnapshot(inventory = {}) {
    const geometryLayoutPaintKeys = [
      "x",
      "y",
      "width",
      "height",
      "bounds",
      "absoluteBounds",
      "cornerRadius",
      "fills",
      "strokes",
      "strokeWeight",
      "effects",
      "opacity",
      "visible",
      "layoutMode",
      "primaryAxisSizingMode",
      "counterAxisSizingMode",
      "primaryAxisAlignItems",
      "counterAxisAlignItems",
      "itemSpacing",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "layoutWrap",
      "layoutSizingHorizontal",
      "layoutSizingVertical",
      "layoutPositioning",
      "layoutAlign",
      "layoutGrow",
      "constraints",
      "fillBindings",
      "strokeBindings",
      "fieldVariableIds",
      "textRangeBindings",
      "pluginData"
    ];
    function view(record) {
      return __spreadProps(__spreadValues({}, canonicalCoreRecord(record, ["legacy", "coreView", ...geometryLayoutPaintKeys])), {
        layoutRegions: sortCoreRecords((record.layoutRegions || []).map((region) => canonicalCoreRecord(region, [...geometryLayoutPaintKeys, "childCount", "childIds"]))),
        copyNodes: sortCoreRecords((record.copyNodes || []).map((copy) => canonicalCoreRecord(copy, ["role", "characters", ...geometryLayoutPaintKeys]))),
        instances: sortCoreRecords((record.instances || []).map((instance) => __spreadProps(__spreadValues({}, canonicalCoreRecord(instance, [
          "repeatedScreen",
          "documentation",
          "mainComponentId",
          "componentSetId",
          "componentSetName",
          "variantName",
          "labelValue",
          "roleCopy",
          "componentProperties",
          "region",
          ...geometryLayoutPaintKeys
        ])), {
          roleDescendants: sortCoreRecords((instance.roleDescendants || []).map((role) => canonicalCoreRecord(role, ["parentInstanceId", "role", "characters", ...geometryLayoutPaintKeys])))
        }))),
        standIns: sortCoreRecords((record.standIns || []).map((node) => canonicalCoreRecord(node, geometryLayoutPaintKeys)))
      });
    }
    return {
      targetPage: canonicalCoreRecord(inventory.targetPage || {}, geometryLayoutPaintKeys),
      sections: sortCoreRecords((inventory.sections || []).map((section) => canonicalCoreRecord(section, geometryLayoutPaintKeys))),
      overview: inventory.overview ? __spreadProps(__spreadValues({}, canonicalCoreRecord(inventory.overview, geometryLayoutPaintKeys)), {
        lines: sortCoreRecords((inventory.overview.lines || []).map((line) => canonicalCoreRecord(line, ["characters", ...geometryLayoutPaintKeys]))),
        standIns: sortCoreRecords((inventory.overview.standIns || []).map((node) => canonicalCoreRecord(node, geometryLayoutPaintKeys)))
      }) : null,
      views: sortCoreRecords((inventory.views || []).map(view)),
      legacyViews: sortCoreRecords((inventory.legacyViews || []).map(view))
    };
  }
  async function executeGuardedCoreViewCommand({ command, phases, preflight, requireContext, collectCurrentInventory, resolveInventoryNodes = async () => null, mutate }) {
    const transition = validatePhaseTransition(command, phases);
    if (!transition.ok) throw new Error(transition.warning);
    const preflightInventory = await preflight();
    const context = await requireContext();
    if (typeof collectCurrentInventory !== "function") throw new Error("TOCTOU: zweite Core-View-Inventur fehlt.");
    const currentInventory = await collectCurrentInventory(context);
    const currentValidation = validateCoreViewMutationInventory(currentInventory);
    if (!currentValidation.valid) throw new Error(`TOCTOU: aktuelles Core-View-Inventar ung\xFCltig.
${currentValidation.errors.join("\n")}`);
    if (JSON.stringify(canonicalCoreViewMutationSnapshot(preflightInventory)) !== JSON.stringify(canonicalCoreViewMutationSnapshot(currentInventory))) throw new Error("TOCTOU: Core-View-Inventar wurde nach Preflight ver\xE4ndert.");
    const resolvedInventoryNodes = await resolveInventoryNodes(context, currentInventory);
    const writeBarrierInventory = await collectCurrentInventory(context);
    const writeBarrierValidation = validateCoreViewMutationInventory(writeBarrierInventory);
    if (!writeBarrierValidation.valid) throw new Error(`TOCTOU: Core-View-Inventar an der Schreibbarriere ung\xFCltig.
${writeBarrierValidation.errors.join("\n")}`);
    if (JSON.stringify(canonicalCoreViewMutationSnapshot(currentInventory)) !== JSON.stringify(canonicalCoreViewMutationSnapshot(writeBarrierInventory))) throw new Error("TOCTOU: Core-View-Inventar wurde vor dem ersten Schreibzugriff ver\xE4ndert.");
    return mutate(context, writeBarrierInventory, resolvedInventoryNodes);
  }
  var SECONDARY_SECTION_NAMES = Object.freeze([
    "07 \xB7 Agent & Quellen",
    "09 \xB7 Men\xFCs & Nebenansichten",
    "10 \xB7 Responsive & Dark"
  ]);
  var SECONDARY_LEGACY_VIEW_SECTIONS = Object.freeze({
    "Agent \xB7 Ruhe": "07 \xB7 Agent & Quellen",
    "Agent \xB7 Gespr\xE4ch": "07 \xB7 Agent & Quellen",
    "Agent \xB7 Antwort mit Fundstelle": "07 \xB7 Agent & Quellen",
    "Agent \xB7 Fehler und R\xFCckkehr": "07 \xB7 Agent & Quellen",
    "Dokumentmen\xFC \xB7 geschlossen": "09 \xB7 Men\xFCs & Nebenansichten",
    "Dokumentmen\xFC \xB7 offen": "09 \xB7 Men\xFCs & Nebenansichten",
    "Quellenleser \xB7 offen": "09 \xB7 Men\xFCs & Nebenansichten",
    "Recherchelauf \xB7 pausiert": "09 \xB7 Men\xFCs & Nebenansichten",
    "Entscheidungsverlauf \xB7 gef\xFCllt": "09 \xB7 Men\xFCs & Nebenansichten",
    "Leerer Zustand \xB7 Recovery": "09 \xB7 Men\xFCs & Nebenansichten",
    "Editor / 1440px \xB7 Responsive": "10 \xB7 Responsive & Dark",
    "Editor / 1024px \xB7 Responsive": "10 \xB7 Responsive & Dark",
    "Editor / 720px \xB7 Responsive": "10 \xB7 Responsive & Dark",
    "Editor / 320px \xB7 Kleinbreite": "10 \xB7 Responsive & Dark",
    "Editor / 1440px \xB7 Dark": "10 \xB7 Responsive & Dark"
  });
  var SECONDARY_LEGACY_RESPONSIVE_WIDTHS = Object.freeze({
    "Editor / 1440px \xB7 Responsive": "1440",
    "Editor / 1024px \xB7 Responsive": "1024",
    "Editor / 720px \xB7 Responsive": "720",
    "Editor / 320px \xB7 Kleinbreite": "320",
    "Editor / 1440px \xB7 Dark": "1440"
  });
  function secondaryDefinitionsWithGroups() {
    return Object.entries(SECONDARY_VIEW_DEFINITIONS).flatMap(([group, definitions]) => definitions.map((definition2) => ({ group, definition: definition2 })));
  }
  function secondaryNodeId(record) {
    return (record == null ? void 0 : record.nodeId) || (record == null ? void 0 : record.id) || null;
  }
  function secondaryOwner(record) {
    var _a, _b, _c;
    return (_c = (_b = record == null ? void 0 : record.owner) != null ? _b : (_a = record == null ? void 0 : record.pluginData) == null ? void 0 : _a.owner) != null ? _c : null;
  }
  function secondaryMarker(record) {
    var _a;
    if ((record == null ? void 0 : record.secondaryView) && typeof record.secondaryView === "object") return record.secondaryView;
    const raw = (_a = record == null ? void 0 : record.pluginData) == null ? void 0 : _a.secondaryView;
    if (!raw || typeof raw !== "string") return null;
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return { invalid: true };
    }
  }
  function secondaryUntouchedPageChildLooksTargeted(record, modernViewNames) {
    var _a, _b;
    const markerKeys = ["secondaryView", "ondaSecondaryView", "responsiveFrame", "ondaResponsiveFrame", "legacy"];
    const hasMarker = markerKeys.some((key) => {
      var _a2;
      return [record == null ? void 0 : record[key], (_a2 = record == null ? void 0 : record.pluginData) == null ? void 0 : _a2[key]].some((value) => value !== void 0 && value !== null && value !== "");
    });
    const hasRole = [record == null ? void 0 : record.role, (_a = record == null ? void 0 : record.pluginData) == null ? void 0 : _a.role].some((value) => value !== void 0 && value !== null && value !== "");
    const hasOndaOwner = [record == null ? void 0 : record.owner, (_b = record == null ? void 0 : record.pluginData) == null ? void 0 : _b.owner].includes(PLUGIN_ORIGIN);
    return modernViewNames.has(record == null ? void 0 : record.name) || Object.hasOwn(SECONDARY_LEGACY_VIEW_SECTIONS, record == null ? void 0 : record.name) || hasMarker || hasRole || hasOndaOwner && (record == null ? void 0 : record.type) !== "SECTION";
  }
  function secondaryUntouchedPageDescendantLooksTargeted(record, modernViewNames, secondaryInstanceNames) {
    const markerKeys = ["secondaryView", "ondaSecondaryView", "responsiveFrame", "ondaResponsiveFrame", "legacy", "secondaryRegionContract"];
    const hasSecondaryMarker = markerKeys.some((key) => {
      var _a;
      return [record == null ? void 0 : record[key], (_a = record == null ? void 0 : record.pluginData) == null ? void 0 : _a[key]].some((value) => value !== void 0 && value !== null && value !== "");
    });
    return modernViewNames.has(record == null ? void 0 : record.name) || Object.hasOwn(SECONDARY_LEGACY_VIEW_SECTIONS, record == null ? void 0 : record.name) || secondaryInstanceNames.has(record == null ? void 0 : record.name) || hasSecondaryMarker;
  }
  function secondaryExpectedMarker(group, definition2) {
    var _a;
    return {
      group,
      theme: definition2.theme,
      subject: definition2.subject || null,
      breakpoint: (_a = definition2.breakpoint) != null ? _a : null
    };
  }
  function secondaryLegacyChildren(view) {
    return [
      ...Array.isArray(view == null ? void 0 : view.standIns) ? view.standIns : [],
      ...Array.isArray(view == null ? void 0 : view.legacyChildren) ? view.legacyChildren : [],
      ...Array.isArray(view == null ? void 0 : view.children) ? view.children : []
    ];
  }
  function secondaryDuplicateNames(records, key, label, errors) {
    const seen = /* @__PURE__ */ new Set();
    for (const record of records) {
      const value = record == null ? void 0 : record[key];
      if (seen.has(value)) errors.push(`Secondary-Views: doppelter ${label} ${(record == null ? void 0 : record.name) || value || "<unbenannt>"}`);
      else seen.add(value);
    }
  }
  function secondaryRecordOwnedAndIdentified(record) {
    return Boolean(secondaryNodeId(record)) && secondaryOwner(record) === PLUGIN_ORIGIN;
  }
  function sameSecondaryIdentity(left, right) {
    return ["nodeId", "id", "name", "type", "owner", "parentId", "parentType", "parentName"].every((key) => {
      var _a, _b;
      return ((_a = left == null ? void 0 : left[key]) != null ? _a : null) === ((_b = right == null ? void 0 : right[key]) != null ? _b : null);
    });
  }
  function validateSecondaryRecordedAncestry(record, root, label, identify, errors) {
    var _a, _b;
    const rootId = secondaryNodeId(root);
    const chain = Array.isArray(record == null ? void 0 : record.ancestorChain) ? record.ancestorChain : [];
    if ((record == null ? void 0 : record.parentId) === rootId) {
      if (record.parentType !== root.type || record.parentName !== root.name || chain.length) {
        errors.push(`Secondary-Views: falsche Ancestry ${label}`);
        return false;
      }
      if (Array.isArray(record.ancestorIds) && !sameSecondaryValue(record.ancestorIds, [rootId])) errors.push(`Secondary-Views: falsche Ancestor-IDs ${label}`);
      return true;
    }
    if (!chain.length) {
      errors.push(`Secondary-Views: unvollst\xE4ndige Ancestry-Kette ${label}`);
      return false;
    }
    let valid = true;
    if (record.parentId !== secondaryNodeId(chain[0]) || record.parentType !== ((_a = chain[0]) == null ? void 0 : _a.type) || record.parentName !== ((_b = chain[0]) == null ? void 0 : _b.name)) valid = false;
    for (const [index, ancestor] of chain.entries()) {
      identify(ancestor, `${label}/${(ancestor == null ? void 0 : ancestor.name) || "Ancestor"}`, true);
      if (!secondaryRecordOwnedAndIdentified(ancestor) || !["FRAME", "GROUP", "INSTANCE"].includes(ancestor.type)) valid = false;
      const parent = chain[index + 1] || root;
      if (ancestor.parentId !== secondaryNodeId(parent) || ancestor.parentType !== parent.type || ancestor.parentName !== parent.name) valid = false;
    }
    const expectedAncestorIds = [...chain.map(secondaryNodeId), rootId];
    if (!sameSecondaryValue(record.ancestorIds, expectedAncestorIds)) valid = false;
    if (!valid) errors.push(`Secondary-Views: falsche Ancestry-Kette ${label}`);
    return valid;
  }
  function reconcileSecondaryContainerChildren(records, errors) {
    const recordById = new Map(records.map((record) => [secondaryNodeId(record), record]));
    const directChildren = new Map(records.map((record) => [secondaryNodeId(record), []]));
    for (const child of records) {
      const parentId = child == null ? void 0 : child.parentId;
      if (parentId && recordById.has(parentId)) directChildren.get(parentId).push(secondaryNodeId(child));
    }
    for (const container of records.filter((record) => ["PAGE", "SECTION", "FRAME", "GROUP", "INSTANCE"].includes(record == null ? void 0 : record.type))) {
      const containerId = secondaryNodeId(container);
      const expectedIds = directChildren.get(containerId) || [];
      const actualIds = Array.isArray(container.childIds) ? container.childIds : null;
      if (!actualIds || !Number.isInteger(container.childCount)) {
        errors.push(`Secondary-Views: Child-Inventar fehlt ${container.name || containerId}`);
        continue;
      }
      const duplicates2 = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);
      const expectedSet = new Set(expectedIds);
      const actualSet = new Set(actualIds);
      const unaccounted = actualIds.filter((id) => !expectedSet.has(id));
      const missing = expectedIds.filter((id) => !actualSet.has(id));
      if (container.childCount !== actualIds.length || actualIds.length !== expectedIds.length || duplicates2.length || unaccounted.length || missing.length) {
        const detail = [.../* @__PURE__ */ new Set([...unaccounted, ...missing, ...duplicates2])].join(", ") || `${container.childCount}/${actualIds.length}/${expectedIds.length}`;
        errors.push(`Secondary-Views: Child-Inventar ung\xFCltig ${container.name || containerId}: ${detail}`);
      }
    }
  }
  function secondaryExpectedComponentLink(inventory, contract) {
    const components = Array.isArray(inventory.components) ? inventory.components : Array.isArray(inventory.componentSets) ? inventory.componentSets : [];
    const component = components.find((candidate) => candidate.id === contract.setId || candidate.componentId === contract.setId);
    const variant = ((component == null ? void 0 : component.variants) || []).find((candidate) => candidate.name === contract.variant);
    if ((component == null ? void 0 : component.type) !== "COMPONENT_SET" || secondaryOwner(component) !== PLUGIN_ORIGIN || (variant == null ? void 0 : variant.type) !== "COMPONENT" || secondaryOwner(variant) !== PLUGIN_ORIGIN || variant.parentId !== secondaryNodeId(component) || variant.parentType !== "COMPONENT_SET" || variant.parentName !== component.name) return null;
    return { componentSetId: secondaryNodeId(component), mainComponentId: secondaryNodeId(variant) };
  }
  function secondaryVariableId(inventory, name, collectionName = null) {
    const candidates = (inventory.variables || []).filter((variable) => variable.name === name);
    const hasCollectionIdentity = candidates.some((variable) => variable.collectionName || variable.variableCollectionName);
    const matches = collectionName && hasCollectionIdentity ? candidates.filter((variable) => (variable.collectionName || variable.variableCollectionName) === collectionName) : candidates;
    return matches.length === 1 ? matches[0].id || matches[0].nodeId || null : null;
  }
  function expectedSecondaryRegionBindings(inventory, contract, theme = "Light") {
    const semanticCollection = `Onda \xB7 Semantic \xB7 ${theme}`;
    const surfaceId = secondaryVariableId(inventory, "color/surface", semanticCollection);
    const borderId = secondaryVariableId(inventory, "color/border", semanticCollection);
    const spacingId = (value) => value === 0 ? [] : [secondaryVariableId(inventory, `spacing/${value}`, "Onda \xB7 Dimension")].filter(Boolean);
    const requiredSpacingValues = [contract.itemSpacing, contract.padding.top, contract.padding.right, contract.padding.bottom, contract.padding.left].filter((value) => value !== 0);
    if (!surfaceId || !borderId || requiredSpacingValues.some((value) => spacingId(value).length !== 1)) return null;
    return {
      fillBindings: [{ index: 0, type: "SOLID", variableIds: [surfaceId] }],
      strokeBindings: [{ index: 0, type: "SOLID", variableIds: [borderId] }],
      fieldVariableIds: {
        itemSpacing: spacingId(contract.itemSpacing),
        paddingTop: spacingId(contract.padding.top),
        paddingRight: spacingId(contract.padding.right),
        paddingBottom: spacingId(contract.padding.bottom),
        paddingLeft: spacingId(contract.padding.left)
      }
    };
  }
  function secondaryRegionBindingsMatch(region, expected) {
    if (!expected) return false;
    if (!sameSecondaryValue(region.fillBindings, expected.fillBindings) || !sameSecondaryValue(region.strokeBindings, expected.strokeBindings)) return false;
    return Object.entries(expected.fieldVariableIds).every(([field, ids]) => {
      var _a;
      return sameSecondaryValue(((_a = region.fieldVariableIds) == null ? void 0 : _a[field]) || [], ids);
    });
  }
  function validateSecondaryViewMutationInventory(inventory = {}) {
    var _a, _b, _c, _d, _e, _f;
    const errors = [];
    const targetPage = inventory.targetPage;
    const targetPageId = secondaryNodeId(targetPage);
    const sections = Array.isArray(inventory.sections) ? inventory.sections : [];
    const views = Array.isArray(inventory.views) ? inventory.views : [];
    const legacyViews = Array.isArray(inventory.legacyViews) ? inventory.legacyViews : [];
    const untouchedPageChildren = Array.isArray(inventory.untouchedPageChildren) ? inventory.untouchedPageChildren : [];
    const untouchedPageDescendants = Array.isArray(inventory.untouchedPageDescendants) ? inventory.untouchedPageDescendants : [];
    const sectionNames = new Set(SECONDARY_SECTION_NAMES);
    const definitions = secondaryDefinitionsWithGroups();
    const definitionByName = new Map(definitions.map((entry) => [entry.definition.name, entry]));
    const modernViewNames = new Set(definitionByName.keys());
    const secondaryInstanceNames = new Set(definitions.flatMap((entry) => entry.definition.instances.map((instance) => instance.name)));
    const sectionByName = new Map(sections.map((section) => [section.name, section]));
    const seenNodeIds = /* @__PURE__ */ new Map();
    const categorizedRecords = [];
    function identify(record, context, repeatedAncestorReference = false) {
      const id = secondaryNodeId(record);
      if (!id) return;
      const seen = seenNodeIds.get(id);
      if (seen) {
        if (!repeatedAncestorReference || !seen.ancestor || !sameSecondaryIdentity(seen.record, record)) errors.push(`Secondary-Views: doppelte Node-ID ${id} bei ${(record == null ? void 0 : record.name) || context}`);
        return;
      }
      seenNodeIds.set(id, { context, record, ancestor: repeatedAncestorReference });
      categorizedRecords.push(record);
    }
    if (!targetPageId || (targetPage == null ? void 0 : targetPage.type) !== "PAGE" || (targetPage == null ? void 0 : targetPage.name) !== TARGET_PAGE_NAME) errors.push("Secondary-Views: Zielseite Page 1 ung\xFCltig");
    else identify(targetPage, TARGET_PAGE_NAME);
    secondaryDuplicateNames(sections, "name", "Section", errors);
    for (const section of sections) {
      identify(section, section.name);
      if (!sectionNames.has(section.name) || section.type !== "SECTION" || !secondaryRecordOwnedAndIdentified(section) || section.parentId !== targetPageId || section.parentType !== "PAGE" || section.parentName !== TARGET_PAGE_NAME) errors.push(`Secondary-Views: ung\xFCltige Section ${section.name || "<unbenannt>"}`);
    }
    secondaryDuplicateNames(views, "name", "View", errors);
    secondaryDuplicateNames(legacyViews, "name", "Legacy-View", errors);
    for (const view of views) {
      const entry = definitionByName.get(view.name);
      identify(view, view.name);
      if (!entry) {
        errors.push(`Secondary-Views: unerwarteter oder unbekannt markierter View-Kandidat ${view.name || "<unbenannt>"}`);
        continue;
      }
      const { definition: definition2 } = entry;
      const section = sectionByName.get(definition2.sectionName);
      if (!secondaryRecordOwnedAndIdentified(view) || view.type !== "FRAME" || !section || view.parentId !== secondaryNodeId(section) || view.parentType !== "SECTION" || view.parentName !== definition2.sectionName) errors.push(`Secondary-Views: ung\xFCltiger View ${view.name}`);
      const layoutRegions = Array.isArray(view.layoutRegions) ? view.layoutRegions : [];
      const copyNodes = Array.isArray(view.copyNodes) ? view.copyNodes : [];
      const instances = Array.isArray(view.instances) ? view.instances : [];
      const standIns = Array.isArray(view.standIns) ? view.standIns : [];
      const expectedRegions = new Map(definition2.regions.map((region) => [region.name, region]));
      const regionByName = new Map(layoutRegions.map((region) => [region.name, region]));
      secondaryDuplicateNames(layoutRegions, "name", `Region in ${view.name}`, errors);
      for (const region of layoutRegions) {
        identify(region, `${view.name}/${region.name}`);
        const contract = expectedRegions.get(region.name);
        if (!contract) {
          errors.push(`Secondary-Views: unerwartete Region ${view.name}/${region.name || "<unbenannt>"}`);
          continue;
        }
        const expectedParent = contract.parentName === definition2.name ? view : regionByName.get(contract.parentName);
        if (!secondaryRecordOwnedAndIdentified(region) || region.type !== "FRAME" || !expectedParent || region.parentId !== secondaryNodeId(expectedParent) || region.parentType !== "FRAME" || region.parentName !== contract.parentName) errors.push(`Secondary-Views: falsche Region-Ancestry ${view.name}/${region.name}`);
      }
      secondaryDuplicateNames(copyNodes, "role", `Copy in ${view.name}`, errors);
      for (const copy of copyNodes) {
        identify(copy, `${view.name}/${copy.name}`);
        const contract = definition2.copyContracts.find((candidate) => candidate.role === copy.role);
        const parent = regionByName.get(contract == null ? void 0 : contract.region);
        if (!contract) errors.push(`Secondary-Views: unerwartete Copy ${view.name}/${copy.name || copy.role || "<unbenannt>"}`);
        else if (!secondaryRecordOwnedAndIdentified(copy) || copy.type !== "TEXT" || !parent || copy.parentId !== secondaryNodeId(parent) || copy.parentType !== "FRAME" || copy.parentName !== contract.region) errors.push(`Secondary-Views: falsche Copy-Ancestry ${view.name}/${copy.name || copy.role}`);
      }
      secondaryDuplicateNames(instances, "name", `Instanz in ${view.name}`, errors);
      for (const instance of instances) {
        identify(instance, `${view.name}/${instance.name}`);
        const contract = definition2.instances.find((candidate) => candidate.name === instance.name);
        const parent = regionByName.get(contract == null ? void 0 : contract.region);
        if (!contract) errors.push(`Secondary-Views: unerwartete Instanz ${view.name}/${instance.name || "<unbenannt>"}`);
        else if (!secondaryRecordOwnedAndIdentified(instance) || instance.type !== "INSTANCE" || !parent || instance.parentId !== secondaryNodeId(parent) || instance.parentType !== "FRAME" || instance.parentName !== contract.region) errors.push(`Secondary-Views: falsche Instanz-Ancestry ${view.name}/${instance.name}`);
        const roleDescendants = Array.isArray(instance.roleDescendants) ? instance.roleDescendants : [];
        secondaryDuplicateNames(roleDescendants, "role", `Role in ${view.name}/${instance.name}`, errors);
        const roleIds = /* @__PURE__ */ new Set();
        const componentDefinition3 = COMPONENT_DEFINITIONS.find((component) => component.id === (contract == null ? void 0 : contract.setId));
        for (const role of roleDescendants) {
          identify(role, `${view.name}/${instance.name}/${role.name}`);
          const roleId = secondaryNodeId(role);
          if (roleIds.has(roleId)) errors.push(`Secondary-Views: doppelte Role-ID ${view.name}/${instance.name}/${role.name}`);
          roleIds.add(roleId);
          const expectedRole = componentDefinition3 == null ? void 0 : componentDefinition3.roles.find((candidate) => candidate.name === role.role);
          const copyMatchesType = role.type === "TEXT" ? Boolean(contract && Object.hasOwn(contract.roleCopy, role.role)) : Boolean(contract && !Object.hasOwn(contract.roleCopy, role.role));
          const nestedUnderInstance = role.parentInstanceId === secondaryNodeId(instance) && validateSecondaryRecordedAncestry(role, instance, `${view.name}/${instance.name}/${role.name || role.role || "<unbenannt>"}`, identify, errors);
          if (!expectedRole || role.name !== `Role/${role.role}` || !secondaryRecordOwnedAndIdentified(role) || role.type !== expectedRole.type || !copyMatchesType || !nestedUnderInstance) {
            errors.push(`Secondary-Views: ungesch\xFCtzte oder verschobene Role ${view.name}/${instance.name}/${role.name || role.role || "<unbenannt>"}`);
          }
        }
      }
      for (const standIn of standIns) {
        identify(standIn, `${view.name}/${standIn.name}`);
        const belongsToView = validateSecondaryRecordedAncestry(standIn, view, `${view.name}/${standIn.name || "<unbenannt>"}`, identify, errors);
        if (!secondaryRecordOwnedAndIdentified(standIn) || !belongsToView) errors.push(`Secondary-Views: ungesch\xFCtzter oder verschobener Ersatzknoten ${view.name}/${standIn.name || "<unbenannt>"}`);
        else if (standIn.visible !== false) errors.push(`Secondary-Views: sichtbarer Legacy-Rest ${view.name}/${standIn.name || "<unbenannt>"}`);
      }
    }
    for (const view of legacyViews) {
      identify(view, view.name);
      const expectedSectionName = SECONDARY_LEGACY_VIEW_SECTIONS[view.name];
      const section = sectionByName.get(expectedSectionName);
      const expectedResponsiveWidth = SECONDARY_LEGACY_RESPONSIVE_WIDTHS[view.name];
      const responsiveMarker = String((_f = (_e = (_c = (_a = view.responsiveFrame) != null ? _a : view.ondaResponsiveFrame) != null ? _c : (_b = view.pluginData) == null ? void 0 : _b.responsiveFrame) != null ? _e : (_d = view.pluginData) == null ? void 0 : _d.ondaResponsiveFrame) != null ? _f : "");
      if (!expectedSectionName || !secondaryRecordOwnedAndIdentified(view) || view.type !== "FRAME" || !section || view.parentId !== secondaryNodeId(section) || view.parentType !== "SECTION" || view.parentName !== expectedSectionName || expectedResponsiveWidth && responsiveMarker !== expectedResponsiveWidth) {
        errors.push(`Secondary-Views: ung\xFCltiger Legacy-View ${view.name || "<unbenannt>"}`);
      }
      const children = secondaryLegacyChildren(view);
      for (const child of children) {
        identify(child, `${view.name}/${child.name}`);
        const belongsToView = validateSecondaryRecordedAncestry(child, view, `${view.name}/${child.name || "<unbenannt>"}`, identify, errors);
        if (!secondaryRecordOwnedAndIdentified(child) || !belongsToView) errors.push(`Secondary-Views: ungesch\xFCtztes oder verschobenes Legacy-Kind ${view.name}/${child.name || "<unbenannt>"}`);
      }
    }
    for (const child of untouchedPageChildren) {
      const id = secondaryNodeId(child);
      if (!id || seenNodeIds.has(id) || !child.name || !child.type || ["DOCUMENT", "PAGE"].includes(child.type) || sectionNames.has(child.name) || secondaryUntouchedPageChildLooksTargeted(child, modernViewNames) || child.parentId !== targetPageId || child.parentType !== "PAGE" || child.parentName !== TARGET_PAGE_NAME) {
        errors.push(`Secondary-Views: ung\xFCltiges unber\xFChrtes Page-Kind ${child.name || id || "<unbenannt>"}`);
        continue;
      }
      identify(child, child.name);
    }
    const untouchedById = new Map(untouchedPageChildren.map((record) => [secondaryNodeId(record), record]));
    for (const descendant of untouchedPageDescendants) untouchedById.set(secondaryNodeId(descendant), descendant);
    for (const descendant of untouchedPageDescendants) {
      const id = secondaryNodeId(descendant);
      const parent = untouchedById.get(descendant == null ? void 0 : descendant.parentId);
      if (!id || seenNodeIds.has(id) || !descendant.name || !descendant.type || ["DOCUMENT", "PAGE"].includes(descendant.type) || sectionNames.has(descendant.name) || secondaryUntouchedPageDescendantLooksTargeted(descendant, modernViewNames, secondaryInstanceNames) || !parent || descendant.parentType !== parent.type || descendant.parentName !== parent.name) {
        errors.push(`Secondary-Views: ung\xFCltiger unber\xFChrter Page-Nachfahr ${descendant.name || id || "<unbenannt>"}`);
        continue;
      }
      identify(descendant, descendant.name);
    }
    reconcileSecondaryContainerChildren(categorizedRecords, errors);
    return { valid: errors.length === 0, errors };
  }
  function sameSecondaryValue(left, right) {
    return JSON.stringify(canonicalScalar(left)) === JSON.stringify(canonicalScalar(right));
  }
  function buildSecondaryViewRecoveryActions(inventory = {}) {
    var _a, _b, _c;
    const validation = validateSecondaryViewMutationInventory(inventory);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    const actions = [];
    const sections = Array.isArray(inventory.sections) ? inventory.sections : [];
    const views = Array.isArray(inventory.views) ? inventory.views : [];
    for (const sectionName of SECONDARY_SECTION_NAMES) if (!sections.some((section) => section.name === sectionName)) actions.push({ type: "section", sectionName });
    for (const { group, definition: definition2 } of secondaryDefinitionsWithGroups()) {
      const view = views.find((candidate) => candidate.name === definition2.name);
      if (!view) {
        actions.push({ type: "view", viewName: definition2.name });
        continue;
      }
      if (!sameSecondaryValue(secondaryMarker(view), secondaryExpectedMarker(group, definition2))) actions.push({ type: "mark-view", viewName: definition2.name });
      const layoutRegions = Array.isArray(view.layoutRegions) ? view.layoutRegions : [];
      for (const region of definition2.regions) {
        const candidate = layoutRegions.find((item) => item.name === region.name);
        if (!candidate) actions.push({ type: "region", viewName: definition2.name, regionName: region.name });
        else if (!secondaryRegionBindingsMatch(candidate, expectedSecondaryRegionBindings(inventory, region, definition2.theme))) actions.push({ type: "bind-region", viewName: definition2.name, regionName: region.name });
      }
      const copyNodes = Array.isArray(view.copyNodes) ? view.copyNodes : [];
      for (const contract of definition2.copyContracts) {
        const copy = copyNodes.find((candidate) => candidate.role === contract.role);
        if (!copy || copy.characters !== contract.characters) actions.push({ type: "copy", viewName: definition2.name, role: contract.role });
      }
      const instances = Array.isArray(view.instances) ? view.instances : [];
      for (const contract of definition2.instances) {
        const instance = instances.find((candidate) => candidate.name === contract.name);
        if (!instance) {
          actions.push({ type: "instance", viewName: definition2.name, instanceName: contract.name });
          continue;
        }
        const component = COMPONENT_DEFINITIONS.find((candidate) => candidate.id === contract.setId);
        const expectedLink = secondaryExpectedComponentLink(inventory, contract);
        if (!expectedLink || instance.mainComponentId !== expectedLink.mainComponentId || instance.componentSetId !== expectedLink.componentSetId || instance.componentSetName !== (component == null ? void 0 : component.name) || instance.variantName !== contract.variant) actions.push({ type: "relink-instance", viewName: definition2.name, instanceName: contract.name });
        const labelProperty = (_c = (_b = (_a = Object.entries(instance.componentProperties || {}).find(([key]) => key.split("#")[0] === "Label")) == null ? void 0 : _a[1]) == null ? void 0 : _b.value) != null ? _c : null;
        if (instance.labelValue !== contract.label || labelProperty !== contract.label) actions.push({ type: "label-instance", viewName: definition2.name, instanceName: contract.name });
        const roles = Array.isArray(instance.roleDescendants) ? instance.roleDescendants : [];
        const roleCharacters = Object.fromEntries(roles.filter((role) => role.type === "TEXT" && role.visible !== false).map((role) => [role.role, role.characters]));
        if (!sameSecondaryValue(instance.roleCopy || {}, contract.roleCopy) || !sameSecondaryValue(roleCharacters, contract.roleCopy)) actions.push({ type: "copy-instance", viewName: definition2.name, instanceName: contract.name });
        if (instance.repeatedScreen !== true || instance.documentation === true) actions.push({ type: "mark-instance", viewName: definition2.name, instanceName: contract.name });
      }
    }
    for (const legacy of inventory.legacyViews || []) {
      if (legacy.visible !== false) actions.push({ type: "hide-legacy-view", legacyName: legacy.name, nodeId: secondaryNodeId(legacy) });
      for (const child of secondaryLegacyChildren(legacy)) if (child.visible !== false) actions.push({ type: "hide-legacy-child", legacyName: legacy.name, childName: child.name, nodeId: secondaryNodeId(child) });
    }
    return actions;
  }
  var SECONDARY_CANONICAL_RECORD_KEYS = Object.freeze([
    "id",
    "nodeId",
    "name",
    "type",
    "owner",
    "parentId",
    "parentType",
    "parentName",
    "parentInstanceId",
    "ancestorIds",
    "childIds",
    "childCount",
    "x",
    "y",
    "width",
    "height",
    "bounds",
    "absoluteBounds",
    "relativeTransform",
    "absoluteTransform",
    "layoutMode",
    "primaryAxisSizingMode",
    "counterAxisSizingMode",
    "primaryAxisAlignItems",
    "counterAxisAlignItems",
    "itemSpacing",
    "counterAxisSpacing",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "layoutWrap",
    "layoutSizingHorizontal",
    "layoutSizingVertical",
    "layoutPositioning",
    "layoutAlign",
    "layoutGrow",
    "constraints",
    "minWidth",
    "maxWidth",
    "minHeight",
    "maxHeight",
    "clipsContent",
    "fills",
    "strokes",
    "strokeWeight",
    "strokeAlign",
    "dashPattern",
    "fillStyleId",
    "strokeStyleId",
    "fillBindings",
    "strokeBindings",
    "fieldVariableIds",
    "textRangeBindings",
    "boundVariables",
    "effects",
    "effectStyleId",
    "opacity",
    "blendMode",
    "visible",
    "cornerRadius",
    "topLeftRadius",
    "topRightRadius",
    "bottomLeftRadius",
    "bottomRightRadius",
    "pluginData",
    "secondaryView",
    "ondaSecondaryView",
    "responsiveFrame",
    "ondaResponsiveFrame",
    "group",
    "theme",
    "subject",
    "breakpoint",
    "legacy",
    "characters",
    "role",
    "region",
    "repeatedScreen",
    "documentation",
    "mainComponentId",
    "componentId",
    "componentSetId",
    "componentSetName",
    "mainComponentName",
    "variantId",
    "variantName",
    "labelValue",
    "roleCopy",
    "componentProperties"
  ]);
  function canonicalSecondaryRecord(record = {}) {
    return Object.fromEntries(SECONDARY_CANONICAL_RECORD_KEYS.map((key) => [key, canonicalScalar(record[key])]));
  }
  function sortSecondaryRecords(records) {
    return [...records].sort((left, right) => {
      const leftKey = `${left.name || left.role || ""}\0${secondaryNodeId(left) || ""}`;
      const rightKey = `${right.name || right.role || ""}\0${secondaryNodeId(right) || ""}`;
      return leftKey.localeCompare(rightKey);
    });
  }
  function canonicalSecondaryViewMutationSnapshot(inventory = {}) {
    function descendant(record) {
      return __spreadProps(__spreadValues({}, canonicalSecondaryRecord(record)), {
        ancestorChain: (record.ancestorChain || []).map(canonicalSecondaryRecord)
      });
    }
    function instance(record) {
      return __spreadProps(__spreadValues({}, canonicalSecondaryRecord(record)), {
        roleDescendants: sortSecondaryRecords((record.roleDescendants || []).map(descendant))
      });
    }
    function view(record) {
      return __spreadProps(__spreadValues({}, canonicalSecondaryRecord(record)), {
        layoutRegions: sortSecondaryRecords((record.layoutRegions || []).map(canonicalSecondaryRecord)),
        copyNodes: sortSecondaryRecords((record.copyNodes || []).map(canonicalSecondaryRecord)),
        instances: sortSecondaryRecords((record.instances || []).map(instance)),
        standIns: sortSecondaryRecords((record.standIns || []).map(descendant)),
        legacyChildren: sortSecondaryRecords((record.legacyChildren || []).map(descendant)),
        children: sortSecondaryRecords((record.children || []).map(descendant))
      });
    }
    function component(record) {
      return __spreadProps(__spreadValues({}, canonicalSecondaryRecord(record)), {
        variants: sortSecondaryRecords((record.variants || []).map(canonicalSecondaryRecord))
      });
    }
    return {
      targetPage: canonicalSecondaryRecord(inventory.targetPage || {}),
      sections: sortSecondaryRecords((inventory.sections || []).map(canonicalSecondaryRecord)),
      views: sortSecondaryRecords((inventory.views || []).map(view)),
      legacyViews: sortSecondaryRecords((inventory.legacyViews || []).map(view)),
      untouchedPageChildren: sortSecondaryRecords((inventory.untouchedPageChildren || []).map(canonicalSecondaryRecord)),
      untouchedPageDescendants: sortSecondaryRecords((inventory.untouchedPageDescendants || []).map(canonicalSecondaryRecord)),
      components: sortSecondaryRecords((inventory.components || inventory.componentSets || []).map(component)),
      variables: sortSecondaryRecords((inventory.variables || []).map(canonicalSecondaryRecord))
    };
  }
  async function executeGuardedSecondaryViewCommand({ command, phases, preflight, requireContext, collectCurrentInventory, resolveInventoryNodes = async () => null, mutate }) {
    const transition = validatePhaseTransition(command, phases);
    if (!transition.ok) throw new Error(transition.warning);
    const preflightInventory = await preflight();
    const preflightSnapshot = canonicalSecondaryViewMutationSnapshot(preflightInventory);
    const context = await requireContext();
    if (typeof collectCurrentInventory !== "function") throw new Error("TOCTOU: zweite Secondary-View-Inventur fehlt.");
    const currentInventory = await collectCurrentInventory(context);
    const currentValidation = validateSecondaryViewMutationInventory(currentInventory);
    if (!currentValidation.valid) throw new Error(`TOCTOU: aktuelles Secondary-View-Inventar ung\xFCltig.
${currentValidation.errors.join("\n")}`);
    const currentSnapshot = canonicalSecondaryViewMutationSnapshot(currentInventory);
    if (!sameSecondaryValue(preflightSnapshot, currentSnapshot)) {
      throw new Error("TOCTOU: Secondary-View-Inventar wurde nach Preflight ver\xE4ndert.");
    }
    const resolvedInventoryNodes = await resolveInventoryNodes(context, currentInventory);
    const writeBarrierInventory = await collectCurrentInventory(context);
    const writeBarrierValidation = validateSecondaryViewMutationInventory(writeBarrierInventory);
    if (!writeBarrierValidation.valid) throw new Error(`TOCTOU: Secondary-View-Inventar an der Schreibbarriere ung\xFCltig.
${writeBarrierValidation.errors.join("\n")}`);
    if (!sameSecondaryValue(currentSnapshot, canonicalSecondaryViewMutationSnapshot(writeBarrierInventory))) {
      throw new Error("TOCTOU: Secondary-View-Inventar wurde vor dem ersten Schreibzugriff ver\xE4ndert.");
    }
    return mutate(context, writeBarrierInventory, resolvedInventoryNodes);
  }
  function visiblePaintsAreGray(paints) {
    return Array.isArray(paints) && paints.every((paint) => !(paint == null ? void 0 : paint.color) || isGrayColor(paint.color));
  }
  function rectanglesOverlap(left, right) {
    if (!left || !right) return true;
    return left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y;
  }
  function rectangleContains(outer, inner) {
    if (!outer || !inner) return false;
    return inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
  }
  function secondaryContentBounds(record = {}) {
    const bounds = record.absoluteBounds;
    if (!bounds) return null;
    const left = Number(record.paddingLeft || 0);
    const right = Number(record.paddingRight || 0);
    const top = Number(record.paddingTop || 0);
    const bottom = Number(record.paddingBottom || 0);
    return {
      x: bounds.x + left,
      y: bounds.y + top,
      width: bounds.width - left - right,
      height: bounds.height - top - bottom
    };
  }
  function secondaryGeometryIsActual(record) {
    const local = record == null ? void 0 : record.bounds;
    const absolute = record == null ? void 0 : record.absoluteBounds;
    return Boolean(local && absolute && [local.x, local.y, local.width, local.height, absolute.x, absolute.y, absolute.width, absolute.height].every(Number.isFinite) && local.width > 0 && local.height > 0 && record.x === local.x && record.y === local.y && record.width === local.width && record.height === local.height && local.width === absolute.width && local.height === absolute.height);
  }
  function secondaryExpectedChildIds(parent, view) {
    if (parent === view) return (view.layoutRegions || []).filter((record) => record.parentId === view.nodeId).map((record) => record.nodeId);
    if (parent.type === "INSTANCE") return (parent.roleDescendants || []).map((record) => record.nodeId);
    return [
      ...(view.layoutRegions || []).filter((record) => record.parentId === parent.nodeId).map((record) => record.nodeId),
      ...(view.copyNodes || []).filter((record) => record.parentId === parent.nodeId).map((record) => record.nodeId),
      ...(view.instances || []).filter((record) => record.parentId === parent.nodeId).map((record) => record.nodeId)
    ];
  }
  function secondaryVisibleRecords(view) {
    return [
      view,
      ...view.layoutRegions || [],
      ...view.copyNodes || [],
      ...(view.instances || []).flatMap((instance) => [instance, ...instance.roleDescendants || []])
    ].filter((record) => record.visible !== false);
  }
  function secondaryBindingMatches(record, field, expectedId) {
    const paints = Array.isArray(record == null ? void 0 : record[field]) ? record[field] : [];
    const bindings = Array.isArray(record == null ? void 0 : record[`${field.slice(0, -1)}Bindings`]) ? record[`${field.slice(0, -1)}Bindings`] : [];
    const indexes = paints.map((paint, index) => ({ paint, index })).filter(({ paint }) => (paint == null ? void 0 : paint.visible) !== false && (paint == null ? void 0 : paint.type) === "SOLID");
    return bindings.length === indexes.length && indexes.every(({ index }) => {
      const matching = bindings.filter((binding) => binding.index === index);
      return matching.length === 1 && matching[0].type === "SOLID" && sameSecondaryValue(matching[0].variableIds, [expectedId]);
    });
  }
  function secondaryContractTextToken(contract = {}) {
    var _a;
    const component = COMPONENT_DEFINITIONS.find((candidate) => candidate.id === contract.setId);
    return ((_a = component == null ? void 0 : component.variants.find((candidate) => candidate.name === contract.variant)) == null ? void 0 : _a.textToken) || "color/text";
  }
  function secondaryContractSurfaceToken(contract = {}) {
    var _a;
    const component = COMPONENT_DEFINITIONS.find((candidate) => candidate.id === contract.setId);
    return ((_a = component == null ? void 0 : component.variants.find((candidate) => candidate.name === contract.variant)) == null ? void 0 : _a.surfaceToken) || "color/surface";
  }
  function validateSecondaryViewEvidence(evidence = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    const errors = [];
    const definitions = secondaryDefinitionsWithGroups();
    const expectedByName = new Map(definitions.map((entry) => [entry.definition.name, entry]));
    const views = Array.isArray(evidence.views) ? evidence.views : [];
    const sections = Array.isArray(evidence.sections) ? evidence.sections : [];
    const counts = {
      agentSources: views.filter((view) => {
        var _a2;
        return ((_a2 = expectedByName.get(view.name)) == null ? void 0 : _a2.group) === "agentSources";
      }).length,
      secondary: views.filter((view) => {
        var _a2;
        return ((_a2 = expectedByName.get(view.name)) == null ? void 0 : _a2.group) === "secondary";
      }).length,
      responsive: views.filter((view) => {
        var _a2;
        return ((_a2 = expectedByName.get(view.name)) == null ? void 0 : _a2.group) === "responsive";
      }).length
    };
    const mutation = validateSecondaryViewMutationInventory(evidence);
    errors.push(...mutation.errors.map((error) => `Strict Secondary foundation: ${error}`));
    const expectedCounts = { agentSources: 15, secondary: 9, responsive: 16 };
    for (const [group, expected] of Object.entries(expectedCounts)) if (counts[group] !== expected) {
      errors.push(`Strict Secondary Cardinality ${group}: erwartet ${expected}, gefunden ${counts[group]}`);
    }
    if (views.length !== definitions.length) errors.push(`Strict Secondary Cardinality total: erwartet ${definitions.length}, gefunden ${views.length}`);
    if (new Set(views.map((view) => view.name)).size !== views.length) errors.push("Strict Secondary duplicate View names");
    if (new Set(views.map((view) => secondaryNodeId(view))).size !== views.length) errors.push("Strict Secondary duplicate View ids");
    const sectionByName = new Map(sections.map((section) => [section.name, section]));
    if (sections.length !== SECONDARY_SECTION_NAMES.length || !sameSecondaryValue(sections.map((section) => section.name), SECONDARY_SECTION_NAMES)) errors.push("Strict Secondary Section cardinality/order");
    for (const section of sections) {
      if (section.type !== "SECTION" || secondaryOwner(section) !== PLUGIN_ORIGIN) errors.push(`Strict Secondary Section invalid: ${section.name}`);
      const expectedViewIds = definitions.filter((entry) => entry.definition.sectionName === section.name).map((entry) => {
        var _a2;
        return (_a2 = views.find((view) => view.name === entry.definition.name)) == null ? void 0 : _a2.nodeId;
      }).filter(Boolean);
      if (!sameSecondaryValue(section.childIds, expectedViewIds) || section.childCount !== expectedViewIds.length) errors.push(`Strict Secondary Section child order: ${section.name}`);
    }
    const requiredCollections = ["Onda \xB7 Semantic \xB7 Light", "Onda \xB7 Semantic \xB7 Dark", "Onda \xB7 Dimension"];
    const collections = Array.isArray(evidence.collections) ? evidence.collections : [];
    const collectionByName = /* @__PURE__ */ new Map();
    for (const name of requiredCollections) {
      const matching = collections.filter((collection) => collection.name === name);
      if (matching.length !== 1 || ((_a = matching[0]) == null ? void 0 : _a.owner) !== PLUGIN_ORIGIN) errors.push(`Strict Secondary Collection identity: ${name}`);
      else collectionByName.set(name, matching[0]);
    }
    if (collections.length !== requiredCollections.length) errors.push("Strict Secondary Collection cardinality");
    const variables = Array.isArray(evidence.variables) ? evidence.variables : [];
    const requiredSemanticNames = [.../* @__PURE__ */ new Set([
      "color/surface",
      "color/border",
      "color/text",
      "color/text-muted",
      ...definitions.flatMap(({ definition: definition2 }) => definition2.instances.map(secondaryContractTextToken)),
      ...definitions.flatMap(({ definition: definition2 }) => definition2.instances.map(secondaryContractSurfaceToken))
    ])];
    const requiredVariableKeys = [
      ...["Light", "Dark"].flatMap((theme) => requiredSemanticNames.map((name) => [`Onda \xB7 Semantic \xB7 ${theme}`, name])),
      ...[...new Set(definitions.flatMap(({ definition: definition2 }) => definition2.regions.flatMap((region) => [
        region.itemSpacing,
        region.padding.top,
        region.padding.right,
        region.padding.bottom,
        region.padding.left
      ])).filter((value) => value > 0))].map((value) => ["Onda \xB7 Dimension", `spacing/${value}`])
    ];
    const variableByKey = /* @__PURE__ */ new Map();
    for (const [collectionName, name] of requiredVariableKeys) {
      const matching = variables.filter((variable) => variable.collectionName === collectionName && variable.name === name);
      const collection = collectionByName.get(collectionName);
      if (matching.length !== 1 || ((_b = matching[0]) == null ? void 0 : _b.owner) !== PLUGIN_ORIGIN || ((_c = matching[0]) == null ? void 0 : _c.collectionId) !== (collection == null ? void 0 : collection.id)) errors.push(`Strict Secondary Variable identity: ${collectionName}/${name}`);
      else variableByKey.set(`${collectionName}\0${name}`, matching[0]);
    }
    if (variables.length !== requiredVariableKeys.length) errors.push("Strict Secondary Variable cardinality");
    const variableId = (collectionName, name) => {
      var _a2;
      return (_a2 = variableByKey.get(`${collectionName}\0${name}`)) == null ? void 0 : _a2.id;
    };
    const effectStyles = Array.isArray(evidence.effectStyles) ? evidence.effectStyles : [];
    const overlayMatches = effectStyles.filter((style) => style.name === "Onda/Shadow/Overlay");
    const overlay = overlayMatches.length === 1 && overlayMatches[0].owner === PLUGIN_ORIGIN ? overlayMatches[0] : null;
    if (!overlay || effectStyles.length !== 1) errors.push("Strict Secondary Overlay style identity/cardinality");
    if (overlay && (!Array.isArray(overlay.effects) || overlay.effects.length !== 1 || !overlay.effects.every((effect) => !effect.color || isGrayColor(effect.color)))) {
      errors.push("Strict Secondary Overlay effect cardinality/grayscale");
    }
    for (const { group, definition: definition2 } of definitions) {
      const matchingViews = views.filter((view2) => view2.name === definition2.name);
      if (matchingViews.length !== 1) continue;
      const view = matchingViews[0];
      const section = sectionByName.get(definition2.sectionName);
      const marker = secondaryMarker(view);
      if (view.type !== "FRAME" || secondaryOwner(view) !== PLUGIN_ORIGIN || view.parentId !== secondaryNodeId(section) || view.parentType !== "SECTION" || view.parentName !== definition2.sectionName) errors.push(`Strict Secondary View Section/parent/type: ${definition2.name}`);
      if (view.width !== definition2.width || ((_d = view.bounds) == null ? void 0 : _d.width) !== definition2.width || ((_e = view.absoluteBounds) == null ? void 0 : _e.width) !== definition2.width) errors.push(`Strict Secondary View width/Breite: ${definition2.name}`);
      if (view.height !== definition2.height || ((_f = view.bounds) == null ? void 0 : _f.height) !== definition2.height || ((_g = view.absoluteBounds) == null ? void 0 : _g.height) !== definition2.height) errors.push(`Strict Secondary View height/H\xF6he: ${definition2.name}`);
      if (view.theme !== definition2.theme) errors.push(`Strict Secondary View theme/Theme: ${definition2.name}`);
      if (!sameSecondaryValue(marker, secondaryExpectedMarker(group, definition2))) errors.push(`Strict Secondary View marker/Marker: ${definition2.name}`);
      if (view.layoutMode === "NONE" || view.layoutMode !== definition2.layoutMode) errors.push(`Strict Secondary View Auto Layout/layoutMode: ${definition2.name}`);
      if (!secondaryGeometryIsActual(view)) errors.push(`Strict Secondary View actual Bounds: ${definition2.name}`);
      if (definition2.width === 320 && (view.layoutMode !== "VERTICAL" || ![view.paddingTop, view.paddingRight, view.paddingBottom, view.paddingLeft].every((value) => value === 16))) {
        errors.push(`Strict Secondary 320 vertical padding: ${definition2.name}`);
      }
      const regions = Array.isArray(view.layoutRegions) ? view.layoutRegions : [];
      const copies = Array.isArray(view.copyNodes) ? view.copyNodes : [];
      const instances = Array.isArray(view.instances) ? view.instances : [];
      const regionByName = new Map(regions.map((region) => [region.name, region]));
      if (regions.length !== definition2.regions.length || new Set(regions.map((region) => region.name)).size !== regions.length) errors.push(`Strict Secondary Region cardinality: ${definition2.name}`);
      if (copies.length !== definition2.copyContracts.length || new Set(copies.map((copy) => copy.role)).size !== copies.length) errors.push(`Strict Secondary Copy cardinality: ${definition2.name}`);
      if (instances.length !== definition2.instances.length || new Set(instances.map((instance) => instance.name)).size !== instances.length) errors.push(`Strict Secondary Instance cardinality: ${definition2.name}`);
      if ((view.standIns || []).some((record) => record.visible !== false)) errors.push(`Strict Secondary visible stand-in: ${definition2.name}`);
      const containers = [view, ...regions, ...instances];
      for (const container of containers) {
        const expectedChildIds = secondaryExpectedChildIds(container, view);
        if (!sameSecondaryValue(container.childIds, expectedChildIds) || container.childCount !== expectedChildIds.length) errors.push(`Strict Secondary child order: ${definition2.name}/${container.name}`);
      }
      for (const contract of definition2.regions) {
        const matching = regions.filter((region2) => region2.name === contract.name);
        if (matching.length !== 1) continue;
        const region = matching[0];
        const parent = contract.parentName === definition2.name ? view : regionByName.get(contract.parentName);
        const parentContent = secondaryContentBounds(parent);
        const expectedWidth = Math.min(contract.width, (parentContent == null ? void 0 : parentContent.width) || 0);
        if (region.type !== "FRAME" || region.parentId !== (parent == null ? void 0 : parent.nodeId) || region.parentType !== "FRAME" || region.parentName !== contract.parentName) errors.push(`Strict Secondary Region Ancestry/parent: ${definition2.name}/${contract.name}`);
        if (region.layoutMode === "NONE" || region.layoutMode !== contract.layoutMode) errors.push(`Strict Secondary Region Auto Layout/layoutMode: ${definition2.name}/${contract.name}`);
        if (!secondaryGeometryIsActual(region) || region.width !== expectedWidth || region.height !== contract.height) errors.push(`Strict Secondary Region Bounds/height: ${definition2.name}/${contract.name}`);
        if (!rectangleContains(parentContent, region.absoluteBounds)) errors.push(`Strict Secondary Region overflow: ${definition2.name}/${contract.name}`);
        const expectedDimensionIds = {
          itemSpacing: contract.itemSpacing,
          paddingTop: contract.padding.top,
          paddingRight: contract.padding.right,
          paddingBottom: contract.padding.bottom,
          paddingLeft: contract.padding.left
        };
        for (const [field, value] of Object.entries(expectedDimensionIds)) {
          const expected = value === 0 ? [] : [variableId("Onda \xB7 Dimension", `spacing/${value}`)];
          if (!sameSecondaryValue(((_h = region.fieldVariableIds) == null ? void 0 : _h[field]) || [], expected)) errors.push(`Strict Secondary Dimension spacing binding: ${definition2.name}/${contract.name}/${field}`);
        }
      }
      for (const contract of definition2.copyContracts) {
        const matching = copies.filter((copy2) => copy2.role === contract.role);
        if (matching.length !== 1) continue;
        const copy = matching[0];
        const parent = regionByName.get(contract.region);
        if (copy.type !== "TEXT" || copy.name !== `Copy / ${contract.role}` || copy.characters !== contract.characters || copy.parentId !== (parent == null ? void 0 : parent.nodeId) || copy.parentName !== contract.region) errors.push(`Strict Secondary Copy Ancestry/copy: ${definition2.name}/${contract.role}`);
        if (!secondaryGeometryIsActual(copy) || copy.height !== contract.expectedHeight) errors.push(`Strict Secondary Copy Bounds/height: ${definition2.name}/${contract.role}`);
        if (!rectangleContains(secondaryContentBounds(parent), copy.absoluteBounds)) errors.push(`Strict Secondary Copy overflow: ${definition2.name}/${contract.role}`);
      }
      for (const contract of definition2.instances) {
        const matching = instances.filter((instance2) => instance2.name === contract.name);
        if (matching.length !== 1) continue;
        const instance = matching[0];
        const parent = regionByName.get(contract.region);
        const component = COMPONENT_DEFINITIONS.find((candidate) => candidate.id === contract.setId);
        const variant = component == null ? void 0 : component.variants.find((candidate) => candidate.name === contract.variant);
        const componentEvidence = (evidence.components || evidence.componentSets || []).filter((candidate) => candidate.id === contract.setId);
        const variantEvidence = componentEvidence.flatMap((candidate) => candidate.variants || []).filter((candidate) => candidate.name === contract.variant);
        const expectedWidth = Math.min(contract.expectedWidth, ((_i = secondaryContentBounds(parent)) == null ? void 0 : _i.width) || 0);
        const expectedHeight = Math.max(definition2.width === 320 ? 44 : 0, contract.expectedHeight);
        if (instance.type !== "INSTANCE" || instance.parentId !== (parent == null ? void 0 : parent.nodeId) || instance.parentName !== contract.region) errors.push(`Strict Secondary Instance Ancestry/parent: ${definition2.name}/${contract.name}`);
        if (componentEvidence.length !== 1 || variantEvidence.length !== 1 || instance.componentSetId !== secondaryNodeId(componentEvidence[0]) || instance.componentSetName !== (component == null ? void 0 : component.name)) errors.push(`Strict Secondary Component Set identity: ${definition2.name}/${contract.name}`);
        if (!variant || instance.mainComponentId !== secondaryNodeId(variantEvidence[0]) || instance.variantName !== contract.variant) errors.push(`Strict Secondary Variant identity: ${definition2.name}/${contract.name}`);
        if (!secondaryGeometryIsActual(instance) || instance.width !== expectedWidth || instance.height !== expectedHeight) errors.push(`Strict Secondary Instance Bounds/height: ${definition2.name}/${contract.name}`);
        if (!rectangleContains(secondaryContentBounds(parent), instance.absoluteBounds)) errors.push(`Strict Secondary Instance overflow: ${definition2.name}/${contract.name}`);
        if (definition2.width === 320 && instance.height < 44) errors.push(`Strict Secondary 320 target below 44: ${definition2.name}/${contract.name}`);
        if (definition2.width === 320 && instance.width < contract.minimumWidth) errors.push(`Strict Secondary 320 minimum/Mindestbreite: ${definition2.name}/${contract.name}`);
        const labelProperty = Object.entries(instance.componentProperties || {}).filter(([key]) => key.split("#")[0] === "Label");
        const visibleLabelRole = contract.setId === "select" ? "Value" : component == null ? void 0 : component.labelRole;
        if (labelProperty.length !== 1 || ((_j = labelProperty[0][1]) == null ? void 0 : _j.value) !== contract.label || instance.labelValue !== contract.label || ((_k = instance.roleCopy) == null ? void 0 : _k[visibleLabelRole]) !== contract.label) errors.push(`Strict Secondary Label property/coherence: ${definition2.name}/${contract.name}`);
        if (!sameSecondaryValue(instance.roleCopy, contract.roleCopy)) errors.push(`Strict Secondary Role-Copy roleCopy mismatch: ${definition2.name}/${contract.name}`);
        const roles = Array.isArray(instance.roleDescendants) ? instance.roleDescendants : [];
        if (roles.length !== ((component == null ? void 0 : component.roles) || []).length || new Set(roles.map((role) => role.nodeId)).size !== roles.length || new Set(roles.map((role) => role.role)).size !== roles.length) errors.push(`Strict Secondary Role Rollenanzahl/doppelt: ${definition2.name}/${contract.name}`);
        for (const expectedRole of (component == null ? void 0 : component.roles) || []) {
          const roleMatches = roles.filter((role2) => role2.role === expectedRole.name);
          if (roleMatches.length !== 1) continue;
          const role = roleMatches[0];
          if (role.name !== `Role/${expectedRole.name}`) errors.push(`Strict Secondary Role name/Name: ${definition2.name}/${contract.name}/${expectedRole.name}`);
          if (role.type !== expectedRole.type) errors.push(`Strict Secondary Role type/Typ: ${definition2.name}/${contract.name}/${expectedRole.name}`);
          if (role.parentInstanceId !== instance.nodeId) errors.push(`Strict Secondary Role Ancestry: ${definition2.name}/${contract.name}/${expectedRole.name}`);
          if (expectedRole.type === "TEXT") {
            if (role.characters !== contract.roleCopy[expectedRole.name]) errors.push(`Strict Secondary Role copy/characters: ${definition2.name}/${contract.name}/${expectedRole.name}`);
          } else if (Object.hasOwn(instance.roleCopy || {}, expectedRole.name) || role.characters !== void 0) {
            errors.push(`Strict Secondary non-TEXT Role-Copy: ${definition2.name}/${contract.name}/${expectedRole.name}`);
          }
          if (!secondaryGeometryIsActual(role)) errors.push(`Strict Secondary Role actual Bounds: ${definition2.name}/${contract.name}/${expectedRole.name}`);
          if (!rectangleContains(secondaryContentBounds(instance), role.absoluteBounds)) errors.push(`Strict Secondary Role overflow: ${definition2.name}/${contract.name}/${expectedRole.name}`);
        }
        for (let left = 0; left < roles.length; left += 1) for (let right = left + 1; right < roles.length; right += 1) {
          if (rectanglesOverlap(roles[left].absoluteBounds, roles[right].absoluteBounds)) errors.push(`Strict Secondary Role overlap/\xFCberlappt: ${definition2.name}/${contract.name}`);
        }
      }
      for (const parent of [view, ...regions]) {
        const children = [
          ...regions.filter((record) => record.parentId === parent.nodeId),
          ...copies.filter((record) => record.parentId === parent.nodeId),
          ...instances.filter((record) => record.parentId === parent.nodeId)
        ];
        for (let left = 0; left < children.length; left += 1) for (let right = left + 1; right < children.length; right += 1) {
          if (rectanglesOverlap(children[left].absoluteBounds, children[right].absoluteBounds)) errors.push(`Strict Secondary sibling overlap/\xFCberlappt: ${definition2.name}/${parent.name}`);
        }
      }
      const copyContractByNodeId = new Map(copies.flatMap((copy) => {
        const contract = definition2.copyContracts.find((candidate) => candidate.role === copy.role);
        return contract ? [[copy.nodeId, contract]] : [];
      }));
      const roleTokenByNodeId = new Map(instances.flatMap((instance) => {
        const contract = definition2.instances.find((candidate) => candidate.name === instance.name);
        const textToken = secondaryContractTextToken(contract);
        return (instance.roleDescendants || []).map((role) => [role.nodeId, textToken]);
      }));
      const instanceSurfaceTokenByNodeId = new Map(instances.flatMap((instance) => {
        const contract = definition2.instances.find((candidate) => candidate.name === instance.name);
        return contract ? [[instance.nodeId, secondaryContractSurfaceToken(contract)]] : [];
      }));
      for (const record of secondaryVisibleRecords(view)) {
        if (!visiblePaintsAreGray(record.fills) || !visiblePaintsAreGray(record.strokes) || !(record.effects || []).every((effect) => !effect.color || isGrayColor(effect.color))) errors.push(`Strict Secondary grayscale/Farbe: ${definition2.name}/${record.name}`);
        const semanticCollection = `Onda \xB7 Semantic \xB7 ${definition2.theme}`;
        const copyContract = copyContractByNodeId.get(record.nodeId);
        const roleTextToken = roleTokenByNodeId.get(record.nodeId);
        const instanceSurfaceToken = instanceSurfaceTokenByNodeId.get(record.nodeId);
        const fillToken = copyContract ? copyContract.kind === "title" ? "color/text" : "color/text-muted" : roleTextToken || instanceSurfaceToken || (record.type === "TEXT" || record.type === "ELLIPSE" ? "color/text" : "color/surface");
        const bindingContext = copyContract ? "Copy semantic token" : roleTextToken ? "Role semantic token" : instanceSurfaceToken ? "Instance surface token" : "fill semantic token";
        if (!secondaryBindingMatches(record, "fills", variableId(semanticCollection, fillToken))) errors.push(`Strict Secondary ${definition2.theme} ${bindingContext} ${fillToken} binding/Bindung: ${definition2.name}/${record.name}`);
        if (!secondaryBindingMatches(record, "strokes", variableId(semanticCollection, "color/border"))) errors.push(`Strict Secondary ${definition2.theme} stroke binding/Bindung: ${definition2.name}/${record.name}`);
        const instanceContract = record.type === "INSTANCE" ? definition2.instances.find((contract) => contract.name === record.name) : null;
        const component = instanceContract ? COMPONENT_DEFINITIONS.find((candidate) => candidate.id === instanceContract.setId) : null;
        const allowsOverlay = Boolean(component == null ? void 0 : component.effectStyleName);
        if (allowsOverlay) {
          if (!overlay || record.effectStyleId !== overlay.id || !sameSecondaryValue(record.effects, overlay.effects)) errors.push(`Strict Secondary effect style/Effektstil: ${definition2.name}/${record.name}`);
        } else if ((record.effectStyleId || null) !== null || (record.effects || []).length !== 0) errors.push(`Strict Secondary unauthorized effect/Effekt: ${definition2.name}/${record.name}`);
      }
    }
    return { valid: errors.length === 0, errors, counts };
  }
  function expectedCoreRegionBounds(definition2, region) {
    const parent = region.parentName === definition2.name ? { layoutMode: definition2.layoutMode, itemSpacing: 0 } : definition2.regions.find((item) => item.name === region.parentName);
    const siblings = definition2.regions.filter((item) => item.parentName === region.parentName);
    const before = siblings.slice(0, siblings.indexOf(region));
    return {
      x: (parent == null ? void 0 : parent.layoutMode) === "HORIZONTAL" ? before.reduce((total, item) => total + item.width + (parent.itemSpacing || 0), 0) : 0,
      y: (parent == null ? void 0 : parent.layoutMode) === "VERTICAL" ? before.reduce((total, item) => total + item.height + (parent.itemSpacing || 0), 0) : 0,
      width: region.width,
      height: region.height
    };
  }
  function coreLocalContainerBounds(region) {
    var _a, _b;
    return { x: 0, y: 0, width: ((_a = region == null ? void 0 : region.bounds) == null ? void 0 : _a.width) || 0, height: ((_b = region == null ? void 0 : region.bounds) == null ? void 0 : _b.height) || 0 };
  }
  function validateCoreInstanceRoleEvidence(instance = {}, contract = {}, region = {}) {
    const errors = [];
    const roles = Array.isArray(instance.roleDescendants) ? instance.roleDescendants : [];
    const expectedEntries = Object.entries(contract.roleCopy || {});
    if (roles.length !== expectedEntries.length || new Set(roles.map((role) => role.nodeId)).size !== roles.length || new Set(roles.map((role) => role.role)).size !== roles.length) errors.push("Core-Role-Evidence: falsche Rollenanzahl");
    for (const [roleName, characters] of expectedEntries) {
      const matching = roles.filter((role2) => role2.role === roleName);
      if (matching.length !== 1) {
        errors.push(`Core-Role-Evidence: Rolle fehlt oder doppelt ${roleName}`);
        continue;
      }
      const role = matching[0];
      if (role.name !== `Role/${roleName}` || role.type !== "TEXT" || role.owner !== PLUGIN_ORIGIN || role.parentInstanceId !== instance.nodeId || role.characters !== characters || role.visible !== true || role.opacity !== 1 || !role.bounds || role.bounds.width < 0 || role.bounds.height <= 0 || !visiblePaintsAreGray(role.fills) || !visiblePaintsAreGray(role.strokes) || (role.effects || []).length !== 0 || !rectangleContains(instance.absoluteBounds, role.absoluteBounds) || !rectangleContains(region.absoluteBounds, role.absoluteBounds)) errors.push(`Core-Role-Evidence: ung\xFCltige Rolle ${roleName}`);
    }
    return errors;
  }
  function validateCoreViewEvidence(evidence = {}) {
    var _a, _b, _c, _d;
    const errors = [];
    const targetPage = evidence.targetPage;
    const sections = Array.isArray(evidence.sections) ? evidence.sections : [];
    const views = Array.isArray(evidence.views) ? evidence.views : [];
    const components = Array.isArray(evidence.components) ? evidence.components : [];
    if (!targetPage || targetPage.type !== "PAGE" || targetPage.name !== TARGET_PAGE_NAME || !targetPage.id) errors.push("Core-Evidence: Zielseite ung\xFCltig");
    const sectionByName = /* @__PURE__ */ new Map();
    if (sections.length !== 3 || new Set(sections.map((section) => section.nodeId)).size !== sections.length) errors.push(`Core-Evidence: erwartet 3 Sections, gefunden ${sections.length}`);
    for (const name of expectedCoreSectionNames()) {
      const section = strictSingle(sections, (item) => item.name === name, errors, `Core-Section ${name}`);
      if (!section) continue;
      sectionByName.set(name, section);
      if (section.type !== "SECTION" || section.owner !== PLUGIN_ORIGIN || section.parentId !== (targetPage == null ? void 0 : targetPage.id) || section.parentType !== "PAGE" || section.parentName !== TARGET_PAGE_NAME) errors.push(`Core-Section ung\xFCltig: ${name}`);
    }
    const componentById = /* @__PURE__ */ new Map();
    for (const component of components) {
      if (componentById.has(component.id)) errors.push(`Core-Komponentenindex doppelt: ${component.id}`);
      componentById.set(component.id, component);
      const definition2 = COMPONENT_DEFINITIONS.find((item) => item.id === component.id);
      if (!definition2 || component.name !== definition2.name || component.type !== "COMPONENT_SET" || component.owner !== PLUGIN_ORIGIN || !component.nodeId) errors.push(`Core-Komponentenindex ung\xFCltig: ${component.id}`);
    }
    const expectedNames = new Set(CORE_VIEW_DEFINITIONS.map((definition2) => definition2.name));
    if (views.length !== CORE_VIEW_DEFINITIONS.length) errors.push(`Core-Views: erwartet ${CORE_VIEW_DEFINITIONS.length}, gefunden ${views.length}`);
    if (new Set(views.map((view) => view.nodeId)).size !== views.length || new Set(views.map((view) => view.name)).size !== views.length || views.some((view) => !expectedNames.has(view.name))) errors.push("Core-Views: falsche, doppelte oder zus\xE4tzliche Views");
    for (const definition2 of CORE_VIEW_DEFINITIONS) {
      const view = strictSingle(views, (item) => item.name === definition2.name, errors, `Core-View ${definition2.name}`);
      if (!view) continue;
      const section = sectionByName.get(definition2.sectionName);
      if (view.type !== "FRAME" || view.owner !== PLUGIN_ORIGIN || view.parentId !== (section == null ? void 0 : section.nodeId) || view.parentType !== "SECTION" || view.parentName !== definition2.sectionName) errors.push(`Core-View Ancestry ung\xFCltig: ${definition2.name}`);
      if (view.width !== 1440 || view.height !== definition2.height || view.cornerRadius !== 0 || (view.effects || []).length !== 0 || !visiblePaintsAreGray(view.fills) || !visiblePaintsAreGray(view.strokes) || view.layoutMode !== definition2.layoutMode || view.itemSpacing !== 0 || [view.paddingTop, view.paddingRight, view.paddingBottom, view.paddingLeft].some((value) => value !== 0) || !sameObject(view.coreView, { section: definition2.section, state: definition2.state, width: 1440, reviewRelation: ((_a = definition2.reviewContext) == null ? void 0 : _a.relation) || null })) errors.push(`Core-View Geometrie/Marker ung\xFCltig: ${definition2.name}`);
      if (!view.bounds || view.bounds.width !== 1440 || view.bounds.height !== definition2.height) errors.push(`Core-View Bounds ung\xFCltig: ${definition2.name}`);
      const layoutRegions = Array.isArray(view.layoutRegions) ? view.layoutRegions : [];
      if (layoutRegions.length !== definition2.regions.length || new Set(layoutRegions.map((region) => region.nodeId)).size !== layoutRegions.length || new Set(layoutRegions.map((region) => region.name)).size !== layoutRegions.length) errors.push(`Core-View Layout-Anzahl ung\xFCltig: ${definition2.name}`);
      const regionByName = new Map(layoutRegions.map((region) => [region.name, region]));
      for (const expected of definition2.regions) {
        const region = strictSingle(layoutRegions, (item) => item.name === expected.name, errors, `Core-Layout ${definition2.name}/${expected.name}`);
        if (!region) continue;
        const expectedParent = expected.parentName === definition2.name ? view : regionByName.get(expected.parentName);
        const expectedChildCount = definition2.regions.filter((child) => child.parentName === expected.name).length + definition2.copyContracts.filter((copy) => copy.region === expected.name).length + definition2.instances.filter((instance) => instance.region === expected.name).length;
        if (region.type !== "FRAME" || region.owner !== PLUGIN_ORIGIN || region.parentId !== (expectedParent == null ? void 0 : expectedParent.nodeId) || region.parentType !== "FRAME" || region.parentName !== expected.parentName || region.visible !== true || region.childCount !== expectedChildCount || region.layoutMode !== expected.layoutMode || region.itemSpacing !== expected.itemSpacing || region.paddingTop !== expected.padding.top || region.paddingRight !== expected.padding.right || region.paddingBottom !== expected.padding.bottom || region.paddingLeft !== expected.padding.left || region.cornerRadius !== 0 || (region.effects || []).length !== 0 || !visiblePaintsAreGray(region.fills) || !visiblePaintsAreGray(region.strokes) || !sameObject(region.bounds, expectedCoreRegionBounds(definition2, expected))) errors.push(`Core-Layout ung\xFCltig: ${definition2.name}/${expected.name}`);
      }
      const copyNodes = Array.isArray(view.copyNodes) ? view.copyNodes : [];
      if (copyNodes.length !== definition2.copyContracts.length || new Set(copyNodes.map((copy) => copy.nodeId)).size !== copyNodes.length) errors.push(`Core-View Copy-Anzahl ung\xFCltig: ${definition2.name}`);
      for (const contract of definition2.copyContracts) {
        const { role, characters, region: regionName } = contract;
        const copy = strictSingle(copyNodes, (item) => item.role === role, errors, `Core-Copy ${definition2.name}/${role}`);
        const region = regionByName.get(regionName);
        if (copy && (copy.name !== `Copy / ${role}` || copy.type !== "TEXT" || copy.owner !== PLUGIN_ORIGIN || copy.parentId !== (region == null ? void 0 : region.nodeId) || copy.parentType !== "FRAME" || copy.parentName !== regionName || copy.characters !== characters || copy.visible !== true || (copy.effects || []).length !== 0 || !visiblePaintsAreGray(copy.fills) || !visiblePaintsAreGray(copy.strokes) || !rectangleContains(coreLocalContainerBounds(region), copy.bounds))) errors.push(`Core-Copy ung\xFCltig: ${definition2.name}/${role}`);
      }
      const instances = Array.isArray(view.instances) ? view.instances : [];
      if (instances.length !== definition2.instances.length || new Set(instances.map((instance) => instance.nodeId)).size !== instances.length || new Set(instances.map((instance) => instance.name)).size !== instances.length) errors.push(`Core-Instanzenanzahl ung\xFCltig: ${definition2.name}`);
      for (const contract of definition2.instances) {
        const instance = strictSingle(instances, (item) => item.name === contract.name, errors, `Core-Instanz ${definition2.name}/${contract.name}`);
        if (!instance) continue;
        const component = componentById.get(contract.setId);
        const variant = ((component == null ? void 0 : component.variants) || []).find((item) => item.name === contract.variant);
        const region = regionByName.get(contract.region);
        if (instance.type !== "INSTANCE" || instance.owner !== PLUGIN_ORIGIN || instance.parentId !== (region == null ? void 0 : region.nodeId) || instance.parentType !== "FRAME" || instance.parentName !== contract.region || instance.region !== contract.region || !rectangleContains(coreLocalContainerBounds(region), instance.bounds) || ((_b = instance.bounds) == null ? void 0 : _b.width) !== contract.expectedWidth || ((_c = instance.bounds) == null ? void 0 : _c.height) !== contract.expectedHeight || instance.repeatedScreen !== true || instance.documentation !== false || (instance.effects || []).length !== 0 || !visiblePaintsAreGray(instance.fills) || !visiblePaintsAreGray(instance.strokes) || !component || component.name !== ((_d = COMPONENT_DEFINITIONS.find((item) => item.id === contract.setId)) == null ? void 0 : _d.name) || !variant || variant.type !== "COMPONENT" || variant.owner !== PLUGIN_ORIGIN || instance.componentSetId !== component.nodeId || instance.componentSetName !== component.name || instance.variantName !== contract.variant || instance.mainComponentId !== variant.nodeId || instance.labelValue !== contract.label || !sameObject(instance.roleCopy, contract.roleCopy)) errors.push(`Core-Instanzlink ung\xFCltig: ${definition2.name}/${contract.name}`);
        errors.push(...validateCoreInstanceRoleEvidence(instance, contract, region).map((error) => `${definition2.name}/${contract.name}: ${error}`));
      }
      for (const expectedRegion of definition2.regions) {
        const region = regionByName.get(expectedRegion.name);
        const childBounds = [
          ...layoutRegions.filter((child) => {
            var _a2;
            return ((_a2 = definition2.regions.find((item) => item.name === child.name)) == null ? void 0 : _a2.parentName) === expectedRegion.name;
          }).map((child) => child.bounds),
          ...copyNodes.filter((child) => child.parentId === (region == null ? void 0 : region.nodeId)).map((child) => child.bounds),
          ...instances.filter((child) => child.parentId === (region == null ? void 0 : region.nodeId)).map((child) => child.bounds)
        ];
        if (childBounds.some((bounds) => !rectangleContains(coreLocalContainerBounds(region), bounds))) errors.push(`Core-Layout Overflow: ${definition2.name}/${expectedRegion.name}`);
        for (let left = 0; left < childBounds.length; left += 1) for (let right = left + 1; right < childBounds.length; right += 1) {
          if (rectanglesOverlap(childBounds[left], childBounds[right])) errors.push(`Core-Layout \xDCberlappung: ${definition2.name}/${expectedRegion.name}`);
        }
      }
      if ((view.standIns || []).some((node) => node.visible !== false)) errors.push(`Core-View enth\xE4lt sichtbaren Ersatzknoten: ${definition2.name}`);
    }
    for (const sectionName of ["03 \xB7 Bibliothek", "04 \xB7 Editor"]) {
      const sectionViews = views.filter((view) => view.parentName === sectionName);
      for (let left = 0; left < sectionViews.length; left += 1) for (let right = left + 1; right < sectionViews.length; right += 1) {
        if (rectanglesOverlap(sectionViews[left].bounds, sectionViews[right].bounds)) errors.push(`Core-Views \xFCberlappen: ${sectionViews[left].name}/${sectionViews[right].name}`);
      }
    }
    const overview = evidence.overview;
    const overviewSection = sectionByName.get("00 \xB7 \xDCbersicht");
    if (!overview || overview.name !== CORE_OVERVIEW_DEFINITION.name || overview.type !== "FRAME" || overview.owner !== PLUGIN_ORIGIN || overview.parentId !== (overviewSection == null ? void 0 : overviewSection.nodeId) || overview.parentType !== "SECTION" || overview.parentName !== "00 \xB7 \xDCbersicht" || overview.width !== CORE_OVERVIEW_DEFINITION.width || overview.cornerRadius !== 6 || (overview.effects || []).length !== 0 || !visiblePaintsAreGray(overview.fills)) errors.push("Core-\xDCbersicht ung\xFCltig");
    const lines = Array.isArray(overview == null ? void 0 : overview.lines) ? overview.lines : [];
    if (lines.length !== CORE_OVERVIEW_DEFINITION.lines.length || lines.some((line, index) => line.name !== `Coverage / ${index + 1}` || line.type !== "TEXT" || line.owner !== PLUGIN_ORIGIN || line.parentId !== overview.nodeId || line.parentType !== "FRAME" || line.parentName !== CORE_OVERVIEW_DEFINITION.name || line.visible !== true || line.characters !== CORE_OVERVIEW_DEFINITION.lines[index])) errors.push("Core-\xDCbersicht Copy ung\xFCltig");
    if (((overview == null ? void 0 : overview.standIns) || []).some((node) => node.visible !== false)) errors.push("Core-\xDCbersicht enth\xE4lt sichtbaren Ersatzknoten");
    return { valid: errors.length === 0, errors };
  }
  function exactComponentPaint(actual, variableId) {
    var _a, _b, _c, _d;
    return Array.isArray(actual) && actual.length === 1 && ((_a = actual[0]) == null ? void 0 : _a.index) === 0 && ((_b = actual[0]) == null ? void 0 : _b.type) === "SOLID" && sameArray((_c = actual[0]) == null ? void 0 : _c.variableIds, [variableId]) && isGrayColor((_d = actual[0]) == null ? void 0 : _d.color);
  }
  function validateComponentEvidence(evidence = {}) {
    var _a, _b, _c, _d, _e;
    const errors = [];
    const componentSets = Array.isArray(evidence.componentSets) ? evidence.componentSets : [];
    const targetPage = evidence.targetPage;
    const containers = Array.isArray(evidence.containers) ? evidence.containers : [];
    if (!targetPage || targetPage.type !== "PAGE" || targetPage.name !== TARGET_PAGE_NAME || !targetPage.id) errors.push("Komponenten-Evidence: Zielseite ung\xFCltig");
    if (containers.length !== 1) errors.push(`Komponenten-Evidence: erwartet 1 Section, gefunden ${containers.length}`);
    const container = containers.length === 1 ? containers[0] : null;
    if (container && (container.name !== "02 \xB7 Komponenten" || container.type !== "SECTION" || container.owner !== PLUGIN_ORIGIN || container.parentId !== (targetPage == null ? void 0 : targetPage.id) || container.parentType !== "PAGE" || container.parentName !== TARGET_PAGE_NAME)) errors.push("Komponenten-Evidence: Section-Ancestry ung\xFCltig");
    const foundationVariables = Array.isArray((_a = evidence.foundation) == null ? void 0 : _a.variables) ? evidence.foundation.variables : [];
    const foundationEffectStyles = Array.isArray((_b = evidence.foundation) == null ? void 0 : _b.effectStyles) ? evidence.foundation.effectStyles : [];
    function variableId(collectionName, name) {
      const matching = foundationVariables.filter((variable) => variable.collectionName === collectionName && variable.name === name);
      if (matching.length !== 1) errors.push(`Komponentenvariable fehlt oder doppelt: ${collectionName}/${name}`);
      return matching.length === 1 ? matching[0].id : null;
    }
    const semantic = (name) => variableId("Onda \xB7 Semantic \xB7 Light", name);
    const dimension = (name) => variableId("Onda \xB7 Dimension", name);
    const effectStyleIds = /* @__PURE__ */ new Map();
    for (const name of new Set(COMPONENT_DEFINITIONS.map((definition2) => definition2.effectStyleName).filter(Boolean))) {
      const matching = foundationEffectStyles.filter((style) => style.name === name);
      if (matching.length !== 1 || matching[0].owner !== PLUGIN_ORIGIN) errors.push(`Komponenten-Effektstil fehlt, doppelt oder ungesch\xFCtzt: ${name}`);
      effectStyleIds.set(name, matching.length === 1 && matching[0].owner === PLUGIN_ORIGIN ? matching[0].id : null);
    }
    const expectedIds = new Set(COMPONENT_DEFINITIONS.map((definition2) => definition2.id));
    if (componentSets.length !== COMPONENT_DEFINITIONS.length) errors.push(`ComponentSets: erwartet ${COMPONENT_DEFINITIONS.length}, gefunden ${componentSets.length}`);
    if (new Set(componentSets.map((set) => set.nodeId)).size !== componentSets.length) errors.push("ComponentSets: doppelte NodeIds");
    if (new Set(componentSets.map((set) => set.id)).size !== componentSets.length || componentSets.some((set) => !expectedIds.has(set.id))) errors.push("ComponentSets: falsche IDs");
    for (const definition2 of COMPONENT_DEFINITIONS) {
      const matchingSets = componentSets.filter((set2) => set2.name === definition2.name && set2.id === definition2.id);
      if (matchingSets.length !== 1) {
        errors.push(`ComponentSet fehlt oder doppelt: ${definition2.name}`);
        continue;
      }
      const set = matchingSets[0];
      if (set.type !== "COMPONENT_SET" || set.owner !== PLUGIN_ORIGIN || set.layoutMode === "NONE" || (set.effects || []).length !== 0) errors.push(`ComponentSet ung\xFCltig: ${definition2.name}`);
      if (!set.parentId || set.parentType !== "SECTION" || set.parentName !== "02 \xB7 Komponenten") errors.push(`ComponentSet-Parent ung\xFCltig: ${definition2.name}`);
      if (!container || set.containerId !== container.nodeId || set.containerType !== container.type || set.containerName !== container.name || set.containerOwner !== container.owner || set.containerParentId !== container.parentId || set.containerParentType !== container.parentType || set.containerParentName !== container.parentName) errors.push(`ComponentSet-Ancestry ung\xFCltig: ${definition2.name}`);
      const properties = Array.isArray(set.componentProperties) ? set.componentProperties : [];
      const variantExpectations = componentVariantPropertyExpectations(definition2);
      const variantPropertyNames = new Set(variantExpectations.map((property) => property.name));
      const labelProperties = properties.filter((property) => property.name === "Label");
      const labelProperty = labelProperties.length === 1 && labelProperties[0].type === "TEXT" ? labelProperties[0] : null;
      const variantProperties = properties.filter((property) => property.type === "VARIANT");
      if (properties.some((property) => property.type === "TEXT" && property.name !== "Label" || property.type === "VARIANT" && !variantPropertyNames.has(property.name) || !["TEXT", "VARIANT"].includes(property.type)) || variantProperties.length !== variantExpectations.length || new Set(variantProperties.map((property) => property.name)).size !== variantProperties.length || variantExpectations.some((expected) => {
        const matching = variantProperties.filter((property) => property.name === expected.name);
        return matching.length !== 1 || matching[0].defaultValue !== expected.defaultValue || !sameArray(matching[0].variantOptions, expected.variantOptions);
      })) errors.push(`Component-Property ung\xFCltig: ${definition2.name}`);
      if (!labelProperty || labelProperty.defaultValue !== definition2.variants[0].copy[definition2.labelRole]) errors.push(`Label-Property ung\xFCltig: ${definition2.name}`);
      const variants = Array.isArray(set.variants) ? set.variants : [];
      if (variants.length !== definition2.variants.length || new Set(variants.map((variant) => variant.nodeId)).size !== variants.length) errors.push(`Variantenanzahl ung\xFCltig: ${definition2.name}`);
      for (const variantDefinition of definition2.variants) {
        const matchingVariants = variants.filter((variant2) => variant2.name === variantDefinition.name);
        if (matchingVariants.length !== 1) {
          errors.push(`Variante fehlt oder doppelt: ${definition2.name}/${variantDefinition.name}`);
          continue;
        }
        const variant = matchingVariants[0];
        const expectedEffectStyleId = definition2.effectStyleName ? effectStyleIds.get(definition2.effectStyleName) : null;
        if (variant.type !== "COMPONENT" || variant.owner !== PLUGIN_ORIGIN || variant.layoutMode !== definition2.direction) errors.push(`Variante strukturell ung\xFCltig: ${definition2.name}/${variantDefinition.name}`);
        if (!variant.parentId || variant.parentId !== set.nodeId || variant.parentType !== "COMPONENT_SET" || variant.parentName !== set.name) errors.push(`Varianten-Parent ung\xFCltig: ${definition2.name}/${variantDefinition.name}`);
        if (variant.height < definition2.targetHeight || variant.cornerRadius !== definition2.radius || variant.strokeWeight !== variantDefinition.strokeWeight || variant.opacity !== variantDefinition.opacity) errors.push(`Variante geometrisch ung\xFCltig: ${definition2.name}/${variantDefinition.name}`);
        const variantEffects = Array.isArray(variant.effects) ? variant.effects : [];
        if (definition2.effectStyleName) {
          const effect = variantEffects.length === 1 ? variantEffects[0] : null;
          if (!expectedEffectStyleId || variant.effectStyleId !== expectedEffectStyleId || !effect || effect.type !== "DROP_SHADOW" || !isGrayColor(effect.color)) errors.push(`Varianten-Effektstil ung\xFCltig: ${definition2.name}/${variantDefinition.name}`);
        } else if ((variant.effectStyleId || null) !== null || variantEffects.length !== 0) errors.push(`Variante hat unerlaubte Effekte: ${definition2.name}/${variantDefinition.name}`);
        if (!exactComponentPaint(variant.fills, semantic(variantDefinition.surfaceToken)) || !exactComponentPaint(variant.strokes, semantic("color/border"))) errors.push(`Varianten-Paints ung\xFCltig: ${definition2.name}/${variantDefinition.name}`);
        const fields = variant.fieldVariableIds || {};
        if (!sameArray(fields.itemSpacing, [dimension(definition2.gapToken)]) || !sameArray(fields.paddingTop, [dimension(definition2.paddingTokens.top)]) || !sameArray(fields.paddingLeft, [dimension(definition2.paddingTokens.left)]) || !sameArray(fields.paddingRight, [dimension(definition2.paddingTokens.right)]) || !sameArray(fields.paddingBottom, [dimension(definition2.paddingTokens.bottom)]) || !["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"].every((field) => sameArray(fields[field], [dimension(definition2.radiusToken)]))) errors.push(`Variantenbindungen ung\xFCltig: ${definition2.name}/${variantDefinition.name}`);
        const dimensions = variant.dimensionValues || {};
        if (dimensions.itemSpacing !== definition2.gap || dimensions.paddingTop !== definition2.padding.top || dimensions.paddingRight !== definition2.padding.right || dimensions.paddingBottom !== definition2.padding.bottom || dimensions.paddingLeft !== definition2.padding.left || dimensions.minHeight !== definition2.targetHeight) errors.push(`Variantendimensionen ung\xFCltig: ${definition2.name}/${variantDefinition.name}`);
        const roles = Array.isArray(variant.roles) ? variant.roles : [];
        if (roles.length !== definition2.roles.length || new Set(roles.map((role) => role.nodeId)).size !== roles.length) errors.push(`Rollenanzahl ung\xFCltig: ${definition2.name}/${variantDefinition.name}`);
        for (const roleDefinition of definition2.roles) {
          const roleName = `Role/${roleDefinition.name}`;
          const matchingRoles = roles.filter((role2) => role2.name === roleName);
          if (matchingRoles.length !== 1) {
            errors.push(`Rolle fehlt oder doppelt: ${definition2.name}/${variantDefinition.name}/${roleName}`);
            continue;
          }
          const role = matchingRoles[0];
          if (role.type !== roleDefinition.type || role.owner !== PLUGIN_ORIGIN || (role.effects || []).length !== 0) errors.push(`Rolle strukturell ung\xFCltig: ${definition2.name}/${variantDefinition.name}/${roleName}`);
          if (!role.parentId || role.parentId !== variant.nodeId || role.parentType !== "COMPONENT" || role.parentName !== variant.name) errors.push(`Rollen-Parent ung\xFCltig: ${definition2.name}/${variantDefinition.name}/${roleName}`);
          if (!exactComponentPaint(role.fills, semantic(variantDefinition.textToken))) errors.push(`Rollen-Paint ung\xFCltig: ${definition2.name}/${variantDefinition.name}/${roleName}`);
          if (roleDefinition.type === "TEXT") {
            if (role.characters !== variantDefinition.copy[roleDefinition.name]) errors.push(`Rollentext ung\xFCltig: ${definition2.name}/${variantDefinition.name}/${roleName}`);
            const expectedProperty = roleDefinition.name === definition2.labelRole ? labelProperty == null ? void 0 : labelProperty.key : null;
            if ((role.characterPropertyKey || null) !== (expectedProperty || null)) errors.push(`Rollen-Property ung\xFCltig: ${definition2.name}/${variantDefinition.name}/${roleName}`);
          } else if (roleDefinition.type === "ELLIPSE") {
            if (role.width !== 16 || role.height !== 16 || !sameArray((_c = role.fieldVariableIds) == null ? void 0 : _c.maxWidth, [dimension("radius/circle")]) || !sameArray((_d = role.fieldVariableIds) == null ? void 0 : _d.maxHeight, [dimension("radius/circle")])) errors.push(`Status-Kreis ung\xFCltig: ${definition2.name}/${variantDefinition.name}`);
          }
        }
      }
      const sample = set.sample;
      const expectedMain = (_e = variants.find((variant) => variant.name === definition2.variants[0].name)) == null ? void 0 : _e.nodeId;
      if (set.sampleCount !== void 0 && set.sampleCount !== 1 || !sample || sample.name !== `${definition2.name} / Dokumentationsinstanz` || sample.type !== "INSTANCE" || sample.owner !== PLUGIN_ORIGIN || sample.mainComponentId !== expectedMain || sample.documentation !== true || sample.repeatedScreen !== false || sample.parentId !== set.parentId || sample.parentType !== "SECTION" || sample.parentName !== "02 \xB7 Komponenten" || sample.containerId !== set.containerId || sample.containerParentId !== set.containerParentId || (sample.effects || []).length !== 0) errors.push(`Dokumentationsinstanz ung\xFCltig: ${definition2.name}`);
    }
    return { valid: errors.length === 0, errors };
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
      if (swatch.labelName !== expected.labelName || !exactFillBindings(swatch.labelFills, [expected.labelVariableId]) || !validateTextRangeBindingCoverage(swatch.labelTextRanges, {
        charactersLength: swatch.labelCharactersLength,
        fillVariableId: expected.labelVariableId,
        fontSizeVariableId: variableId("Onda \xB7 Typography", "font-size/12"),
        fontWeightVariableId: variableId("Onda \xB7 Typography", "font-weight/500")
      })) errors.push(`Swatch ${expected.name}: label binding`);
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
      if (specimen && (specimen.type !== "TEXT" || specimen.parentName !== "Foundations / Typografie" || specimen.textStyleId !== style.id || !sameArray((_t = specimen.fieldVariableIds) == null ? void 0 : _t.fontSize, [sizeId]) || !sameArray((_u = specimen.fieldVariableIds) == null ? void 0 : _u.fontWeight, [weightId]) || !exactFillBindings(specimen.fills, [textVariableId]) || !validateTextRangeBindingCoverage(specimen.textRanges, {
        charactersLength: specimen.charactersLength,
        fillVariableId: textVariableId,
        fontSizeVariableId: sizeId,
        fontWeightVariableId: weightId
      }))) errors.push(`Text specimen ${definition2.role}: link`);
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
      const overlayComponents = COMPONENT_DEFINITIONS.filter((definition2) => definition2.effectStyleName === overlay.name).flatMap((definition2) => definition2.variants.map((variant) => ({ definition: definition2, variant })));
      const expectedConsumerCount = 1 + overlayComponents.length;
      if (effectConsumers.length !== expectedConsumerCount) errors.push(`Overlay consumers: erwartet ${expectedConsumerCount}, gefunden ${effectConsumers.length}`);
      if (new Set(effectConsumers.map((consumer) => consumer.nodeId)).size !== effectConsumers.length) errors.push("Overlay consumers: doppelte NodeIds");
      const documentationConsumer = strictSingle(effectConsumers, (item) => item.name === "Effect / Onda/Shadow/Overlay" && !item.componentId, errors, "Overlay documentation consumer");
      if (documentationConsumer && (documentationConsumer.type !== "FRAME" || documentationConsumer.owner !== PLUGIN_ORIGIN || documentationConsumer.parentName !== "Foundations / Effects" || documentationConsumer.cornerRadius !== 8 || documentationConsumer.effectStyleId !== overlay.id || !sameArray(documentationConsumer.fields, ["effectStyleId"]) || !exactFillBindings(documentationConsumer.fills, [variableId("Onda \xB7 Semantic \xB7 Light", "color/surface")]))) errors.push("Overlay documentation consumer: invalid");
      for (const { definition: definition2, variant } of overlayComponents) {
        const consumer = strictSingle(effectConsumers, (item) => item.componentId === definition2.id && item.name === variant.name, errors, `Overlay component consumer ${definition2.id}/${variant.name}`);
        if (consumer && (consumer.type !== "COMPONENT" || consumer.owner !== PLUGIN_ORIGIN || consumer.parentName !== definition2.name || consumer.cornerRadius !== 8 || consumer.effectStyleId !== overlay.id || !sameArray(consumer.fields, ["effectStyleId"]) || !exactFillBindings(consumer.fills, [variableId("Onda \xB7 Semantic \xB7 Light", variant.surfaceToken)]))) errors.push(`Overlay component consumer invalid: ${definition2.id}/${variant.name}`);
      }
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
    var _a, _b;
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
    const foundation = snapshot.foundation || {};
    const componentStrict = validateComponentEvidence({
      componentSets,
      foundation,
      targetPage: snapshot.componentTargetPage,
      containers: snapshot.componentContainers
    });
    const componentStructureValid = componentStrict.valid;
    const foundationStrict = validateFoundationEvidence(foundation);
    const foundationInventoryValid = foundationStrict.valid;
    const foundationValid = ["paintsValid", "radiiValid", "effectsValid", "fontsValid", "docsBound"].every((key) => foundation[key] === true) && foundationInventoryValid;
    const annotationViewsValid = snapshot.annotationViews ? snapshot.annotationViews.length === expectedAnnotationViews.size && presentAnnotationViews.size === expectedAnnotationViews.size && [...expectedAnnotationViews].every((key) => presentAnnotationViews.has(key)) : new Set(snapshot.annotationKinds || []).size === ANNOTATION_SECTIONS.length;
    const dialogStatesValid = snapshot.dialogStates ? snapshot.dialogStates.length === expectedDialogStates.size && presentDialogStates.size === expectedDialogStates.size && [...expectedDialogStates].every((key) => presentDialogStates.has(key)) : new Set(snapshot.dialogFamilies || []).size === DIALOG_FAMILIES.length;
    const phasesComplete = snapshot.phases ? REQUIRED_PHASES.every((id) => {
      var _a2;
      return ((_a2 = snapshot.phases[id]) == null ? void 0 : _a2.status) === "success";
    }) : true;
    const hasModernCoreEvidence = snapshot.coreViews !== void 0;
    const coreStrict = hasModernCoreEvidence ? validateCoreViewEvidence(snapshot.coreViews) : null;
    const hasModernSecondaryEvidence = Object.hasOwn(snapshot, "secondaryViews");
    const secondaryStrict = hasModernSecondaryEvidence ? validateSecondaryViewEvidence(snapshot.secondaryViews) : null;
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
      componentErrors: componentStrict.errors,
      instanceCount: Number(snapshot.instanceCount || 0),
      documentationInstanceCount: Number(snapshot.documentationInstanceCount || 0),
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
    if (hasModernCoreEvidence) {
      const coreViews = Array.isArray((_b = snapshot.coreViews) == null ? void 0 : _b.views) ? snapshot.coreViews.views : [];
      report.libraryViewCount = coreViews.filter((view) => view.parentName === "03 \xB7 Bibliothek").length;
      report.editorViewCount = coreViews.filter((view) => view.parentName === "04 \xB7 Editor").length;
      report.coreViewStructureValid = coreStrict.valid;
      report.coreViewErrors = coreStrict.errors;
    }
    if (hasModernSecondaryEvidence) {
      report.agentSourceViewCount = secondaryStrict.counts.agentSources;
      report.secondaryViewCount = secondaryStrict.counts.secondary;
      report.responsiveViewCount = secondaryStrict.counts.responsive;
      report.secondaryViewStructureValid = secondaryStrict.valid;
      report.secondaryViewErrors = secondaryStrict.errors;
    }
    const modern = Boolean(snapshot.sections);
    report.hardPass = Boolean(snapshot.targetAuthorized) && report.pageCount === 1 && snapshot.pageName === TARGET_PAGE_NAME && report.sectionCount === SECTION_DEFINITIONS.length && report.missingSections.length === 0 && report.duplicateNames.length === 0 && sectionStructureValid && annotationViewsValid && dialogStatesValid && componentStructureValid && report.instanceCount >= COMPONENT_DEFINITIONS.length && report.documentationInstanceCount === COMPONENT_DEFINITIONS.length && report.repeatedScreenInstanceCount > 0 && foundationValid && report.intersections.length === 0 && report.clearance >= 2e3 && report.overflowNodes.length === 0 && report.undersizedHitTargets.length === 0 && report.requiredReactionCount > 0 && report.reactionCount >= report.requiredReactionCount && report.preservedBaselineHash && report.pageInvariant && phasesComplete && (!hasModernCoreEvidence || coreStrict.valid) && (!hasModernSecondaryEvidence || secondaryStrict.valid);
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
  async function nodeRecord(node, baselineIds = null) {
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
        const identity = await readMainComponentIdentity(node);
        mainComponentId = identity.id;
        mainComponentKey = identity.key;
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
  async function collectRecordsFromDocument(baselineIds = null) {
    const records = [];
    async function visit(node) {
      const belongs = !baselineIds || baselineIds.has(node.id);
      if (belongs) records.push(await nodeRecord(node, baselineIds));
      if ("children" in node) {
        for (const child of node.children) await visit(child);
      }
    }
    if (!baselineIds || baselineIds.has(figma.root.id)) records.push(await nodeRecord(figma.root, baselineIds));
    for (const page of figma.root.children) {
      if (!baselineIds || baselineIds.has(page.id)) records.push(await nodeRecord(page, baselineIds));
      for (const child of page.children) await visit(child);
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
    const records = ledger ? null : await collectRecordsFromDocument();
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
      const currentRecords = orderRecordsByBaselineIds(await collectRecordsFromDocument(new Set(legacyIds)), legacyIds);
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
  function ensureVariableSwatch(parent, layer, name, variable, fallback, decision, labelVariable, fontSizeVariable, fontWeightVariable) {
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
    label.setBoundVariable("fontSize", fontSizeVariable);
    label.setBoundVariable("fontWeight", fontWeightVariable);
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
    const card = autoFrame(parent, `Effect / ${style.name}`, { width: 780, height: 150, padding: 24, gap: 8, radius: 8 }).node;
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
    const labelFontSizeVariable = variables.variablesByKey.get("Onda \xB7 Typography\0font-size/12");
    const labelFontWeightVariable = variables.variablesByKey.get("Onda \xB7 Typography\0font-weight/500");
    for (const name of Object.keys(PALETTE)) {
      const labelToken = foundationSwatchLabelToken("primitive", name);
      const labelVariable = variables.variablesByKey.get(`${labelToken.collectionName}\0${labelToken.variableName}`);
      ensureVariableSwatch(palette, "primitive", name, variables.variablesByKey.get(`Onda \xB7 Primitive\0${name}`), name, ledger.fontDecision, labelVariable, labelFontSizeVariable, labelFontWeightVariable);
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
        ensureVariableSwatch(semantic, layer, role.name, variables.variablesByKey.get(`${collectionName}\0${role.name}`), role[key], ledger.fontDecision, labelVariable, labelFontSizeVariable, labelFontWeightVariable);
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
  function componentDefinition2(componentId) {
    const definition2 = COMPONENT_DEFINITIONS.find((component) => component.id === componentId);
    if (!definition2) throw new Error(`Unbekannte Komponente: ${componentId}`);
    return definition2;
  }
  function componentPropertyInventory(set) {
    if (!set || set.type !== "COMPONENT_SET") return [];
    return collectComponentPropertyInventory(set.componentPropertyDefinitions || {});
  }
  function componentRoleInventory(component) {
    if (!component || !("children" in component)) return [];
    return component.children.map((role) => {
      var _a;
      return {
        nodeId: role.id,
        name: role.name,
        type: role.type,
        owner: role.getPluginData(CREATED_MARKER_KEY),
        parentId: component.id,
        parentType: component.type,
        parentName: component.name,
        characterPropertyKey: role.type === "TEXT" ? ((_a = role.componentPropertyReferences) == null ? void 0 : _a.characters) || null : null
      };
    });
  }
  function collectComponentSectionCandidates(page) {
    return collectComponentInventoryLocations(page);
  }
  async function collectComponentMutationInventory(componentId) {
    await figma.loadAllPagesAsync();
    componentDefinition2(componentId);
    const locations = collectComponentSectionCandidates(figma.currentPage);
    const candidates = locations.candidates;
    const sampleNames = new Set(COMPONENT_DEFINITIONS.map((definition2) => `${definition2.name} / Dokumentationsinstanz`));
    const stagingNodes = candidates.filter((candidate) => candidate.stagingComponent || candidate.stagingVariant);
    const setNodes = candidates.filter((candidate) => !sampleNames.has(candidate.node.name) && !candidate.stagingComponent && !candidate.stagingVariant);
    const sampleNodes = candidates.filter(({ node }) => sampleNames.has(node.name));
    const effectStyleRecords = (await figma.getLocalEffectStylesAsync()).map(foundationEntityRecord);
    const effectStyleById = new Map(effectStyleRecords.map((record) => [record.id, record]));
    async function effectStyleInventory(node) {
      const effectStyleId = await readEffectStyleId(node);
      const style = effectStyleId ? effectStyleById.get(effectStyleId) : null;
      return { effectStyleId, effectStyleName: (style == null ? void 0 : style.name) || null, effectStyleOwner: (style == null ? void 0 : style.owner) || null };
    }
    function ancestry(location) {
      return {
        parentId: location.parentId,
        parentType: location.parentType,
        parentName: location.parentName,
        containerId: location.containerId,
        containerType: location.containerType,
        containerName: location.containerName,
        containerOwner: location.containerOwner,
        containerParentId: location.containerParentId,
        containerParentType: location.containerParentType,
        containerParentName: location.containerParentName
      };
    }
    const samples = [];
    for (const location of sampleNodes) {
      const sample = location.node;
      const identity = sample.type === "INSTANCE" ? await readMainComponentIdentity(sample) : { id: null };
      samples.push(__spreadProps(__spreadValues({
        nodeId: sample.id,
        name: sample.name,
        type: sample.type,
        owner: sample.getPluginData(CREATED_MARKER_KEY)
      }, ancestry(location)), {
        documentation: sample.getPluginData("ondaDocumentationInstance") === "true",
        repeatedScreen: sample.getPluginData("ondaRepeatedScreenInstance") === "true",
        mainComponentId: identity.id
      }));
    }
    const sets = await Promise.all(setNodes.map(async (location) => {
      const set = location.node;
      return __spreadProps(__spreadValues({
        nodeId: set.id,
        name: set.name,
        type: set.type,
        owner: set.getPluginData(CREATED_MARKER_KEY)
      }, ancestry(location)), {
        componentProperties: componentPropertyInventory(set),
        variants: "children" in set ? await Promise.all(set.children.map(async (variant) => __spreadProps(__spreadValues({
          nodeId: variant.id,
          name: variant.name,
          type: variant.type,
          owner: variant.getPluginData(CREATED_MARKER_KEY),
          parentId: set.id,
          parentType: set.type,
          parentName: set.name
        }, await effectStyleInventory(variant)), {
          roles: componentRoleInventory(variant)
        }))) : []
      });
    }));
    const staging = await Promise.all(stagingNodes.map(async (location) => {
      const component = location.node;
      return __spreadProps(__spreadValues(__spreadValues({
        nodeId: component.id,
        name: component.name,
        type: component.type,
        owner: component.getPluginData(CREATED_MARKER_KEY),
        stagingComponent: location.stagingComponent,
        stagingVariant: location.stagingVariant
      }, ancestry(location)), await effectStyleInventory(component)), {
        roles: componentRoleInventory(component)
      });
    }));
    return {
      targetPage: locations.targetPage,
      containers: locations.containers.map((_a) => {
        var _b = _a, { node: _node } = _b, container = __objRest(_b, ["node"]);
        return container;
      }),
      sets,
      samples,
      staging
    };
  }
  async function preflightComponentMutation(componentId) {
    const inventory = await collectComponentMutationInventory(componentId);
    const result = validateComponentMutationInventory(inventory, componentId);
    if (!result.valid) throw new Error(result.errors.join("\n"));
    return inventory;
  }
  async function componentVariables() {
    var _a;
    const requests = [
      ["surface", "color/surface", "Onda \xB7 Semantic \xB7 Light"],
      ["inverted", "color/inverted", "Onda \xB7 Semantic \xB7 Light"],
      ["text", "color/text", "Onda \xB7 Semantic \xB7 Light"],
      ["textMuted", "color/text-muted", "Onda \xB7 Semantic \xB7 Light"],
      ["onInverted", "color/on-inverted", "Onda \xB7 Semantic \xB7 Light"],
      ["border", "color/border", "Onda \xB7 Semantic \xB7 Light"],
      ["spacing8", "spacing/8", "Onda \xB7 Dimension"],
      ["spacing12", "spacing/12", "Onda \xB7 Dimension"],
      ["spacing16", "spacing/16", "Onda \xB7 Dimension"],
      ["spacing24", "spacing/24", "Onda \xB7 Dimension"],
      ["spacing32", "spacing/32", "Onda \xB7 Dimension"],
      ["radiusNone", "radius/none", "Onda \xB7 Dimension"],
      ["radiusControl", "radius/control", "Onda \xB7 Dimension"],
      ["radiusStatic", "radius/static", "Onda \xB7 Dimension"],
      ["radiusOverlay", "radius/overlay", "Onda \xB7 Dimension"],
      ["radiusCircle", "radius/circle", "Onda \xB7 Dimension"]
    ];
    const entries = await Promise.all(requests.map(async ([key, name, collection]) => [key, await localVariable(name, collection)]));
    const variables = Object.fromEntries(entries);
    const missing = requests.filter(([key]) => !variables[key]).map(([, name, collection]) => `${collection}/${name}`);
    if (missing.length) throw new Error(`Komponentenvariablen fehlen: ${missing.join(", ")}`);
    const effectStyleRecords = (await figma.getLocalEffectStylesAsync()).map(foundationEntityRecord);
    const effectStyleByName = {};
    for (const name of new Set(COMPONENT_DEFINITIONS.map((definition2) => definition2.effectStyleName).filter(Boolean))) {
      const effectStyle = (_a = selectOwnedEntity(effectStyleRecords, name, "EffectStyle")) == null ? void 0 : _a.entity;
      if (!effectStyle) throw new Error(`Komponenten-Effektstil fehlt: ${name}`);
      effectStyleByName[name] = effectStyle;
    }
    return __spreadProps(__spreadValues({}, variables), {
      effectStyleByName,
      semanticByToken: {
        "color/surface": variables.surface,
        "color/inverted": variables.inverted,
        "color/text": variables.text,
        "color/text-muted": variables.textMuted,
        "color/on-inverted": variables.onInverted,
        "color/border": variables.border
      },
      dimensionByToken: {
        "spacing/8": variables.spacing8,
        "spacing/12": variables.spacing12,
        "spacing/16": variables.spacing16,
        "spacing/24": variables.spacing24,
        "spacing/32": variables.spacing32,
        "radius/none": variables.radiusNone,
        "radius/control": variables.radiusControl,
        "radius/static": variables.radiusStatic,
        "radius/overlay": variables.radiusOverlay,
        "radius/circle": variables.radiusCircle
      }
    });
  }
  function boundComponentPaint(token, variable) {
    const palette = {
      "color/surface": "gray/000",
      "color/inverted": "gray/900",
      "color/text": "gray/900",
      "color/text-muted": "gray/500",
      "color/on-inverted": "gray/000",
      "color/border": "gray/300"
    };
    return [figma.variables.setBoundVariableForPaint(solid(palette[token]), "color", variable)];
  }
  function configureComponentRole(role, roleDefinition, copy, decision, textVariable, variables) {
    role.name = `Role/${roleDefinition.name}`;
    role.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    role.effects = [];
    role.fills = boundComponentPaint(textVariable.name, textVariable.variable);
    if (role.type === "TEXT") {
      role.fontName = { family: decision.family, style: decision.styles[roleDefinition.name === "Icon" ? 700 : 500] };
      role.fontSize = roleDefinition.name === "Description" ? 12 : 15;
      role.lineHeight = { unit: "PIXELS", value: roleDefinition.name === "Description" ? 16 : 22 };
      role.characters = copy[roleDefinition.name];
    } else {
      role.resize(16, 16);
      role.setBoundVariable("maxWidth", variables.radiusCircle);
      role.setBoundVariable("maxHeight", variables.radiusCircle);
    }
  }
  async function configureComponentVariant(component, definition2, variantDefinition, decision, variables) {
    component.name = variantDefinition.name;
    component.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    component.layoutMode = definition2.direction;
    component.primaryAxisSizingMode = "AUTO";
    component.counterAxisSizingMode = "AUTO";
    component.primaryAxisAlignItems = "CENTER";
    component.counterAxisAlignItems = "CENTER";
    component.itemSpacing = definition2.gap;
    component.paddingTop = definition2.padding.top;
    component.paddingRight = definition2.padding.right;
    component.paddingBottom = definition2.padding.bottom;
    component.paddingLeft = definition2.padding.left;
    component.cornerRadius = definition2.radius;
    component.minHeight = definition2.targetHeight;
    component.opacity = variantDefinition.opacity;
    component.fills = boundComponentPaint(variantDefinition.surfaceToken, variables.semanticByToken[variantDefinition.surfaceToken]);
    component.strokes = boundComponentPaint("color/border", variables.border);
    component.strokeWeight = variantDefinition.strokeWeight;
    component.effects = [];
    if (definition2.effectStyleName) {
      const effectStyle = variables.effectStyleByName[definition2.effectStyleName];
      if (!effectStyle) throw new Error(`Komponenten-Effektstil fehlt: ${definition2.effectStyleName}`);
      await component.setEffectStyleIdAsync(effectStyle.id);
    }
    component.setBoundVariable("itemSpacing", variables.dimensionByToken[definition2.gapToken]);
    component.setBoundVariable("paddingTop", variables.dimensionByToken[definition2.paddingTokens.top]);
    component.setBoundVariable("paddingLeft", variables.dimensionByToken[definition2.paddingTokens.left]);
    component.setBoundVariable("paddingRight", variables.dimensionByToken[definition2.paddingTokens.right]);
    component.setBoundVariable("paddingBottom", variables.dimensionByToken[definition2.paddingTokens.bottom]);
    for (const field of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) component.setBoundVariable(field, variables.dimensionByToken[definition2.radiusToken]);
    const textVariable = { name: variantDefinition.textToken, variable: variables.semanticByToken[variantDefinition.textToken] };
    for (const roleDefinition of definition2.roles) {
      const role = component.children.find((node) => node.name === `Role/${roleDefinition.name}`);
      if (!role || role.type !== roleDefinition.type) throw new Error(`Rolle fehlt: ${definition2.name}/${variantDefinition.name}/${roleDefinition.name}`);
      configureComponentRole(role, roleDefinition, variantDefinition.copy, decision, textVariable, variables);
    }
  }
  function createComponentRoleNode(component, roleDefinition) {
    const role = roleDefinition.type === "TEXT" ? figma.createText() : figma.createEllipse();
    role.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    role.name = `Role/${roleDefinition.name}`;
    component.appendChild(role);
    return role;
  }
  function createComponentVariantNode(parent, definition2, variantDefinition, staging = false) {
    const component = figma.createComponent();
    component.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    if (staging) {
      component.setPluginData("ondaStagingComponent", definition2.id);
      component.setPluginData("ondaStagingVariant", variantDefinition.name);
    }
    component.name = variantDefinition.name;
    parent.appendChild(component);
    for (const roleDefinition of definition2.roles) createComponentRoleNode(component, roleDefinition);
    return component;
  }
  function componentLabelProperty(set, definition2) {
    const existing = componentPropertyInventory(set).find((property) => property.name === "Label" && property.type === "TEXT");
    if (existing) {
      if (typeof set.editComponentProperty === "function") set.editComponentProperty(existing.key, { defaultValue: definition2.variants[0].copy[definition2.labelRole] });
      return existing.key;
    }
    return set.addComponentProperty("Label", "TEXT", definition2.variants[0].copy[definition2.labelRole]);
  }
  async function runComponent(page, ledger, componentId, validatedInventory) {
    var _a, _b;
    await loadDecisionFonts(ledger.fontDecision);
    const definition2 = componentDefinition2(componentId);
    const variables = await componentVariables();
    const resolved = await revalidateComponentNodeRecords({
      inventory: validatedInventory,
      targetPage: page,
      getNodeById: (id) => figma.getNodeByIdAsync(id)
    });
    const validatedContainer = (validatedInventory.containers || [])[0];
    if (!validatedContainer && directChild(page, "02 \xB7 Komponenten")) throw new Error("TOCTOU: Komponenten-Section erschien nach Preflight.");
    if (!validatedContainer) ensureSection(page, ledger, "02 \xB7 Komponenten", 4e3);
    const section = validatedContainer ? resolved.get(validatedContainer.nodeId) : directChild(page, "02 \xB7 Komponenten", ["SECTION"]);
    if (!section || section.getPluginData(CREATED_MARKER_KEY) !== PLUGIN_ORIGIN) throw new Error("Direkte, Onda-eigene Komponenten-Section fehlt.");
    if (((_a = section.parent) == null ? void 0 : _a.id) !== page.id || ((_b = section.parent) == null ? void 0 : _b.type) !== "PAGE" || section.name !== "02 \xB7 Komponenten") throw new Error("TOCTOU: Komponenten-Section ist nicht mehr direkt.");
    const setRecord = (validatedInventory.sets || []).find((item) => item.name === definition2.name);
    let set = setRecord ? resolved.get(setRecord.nodeId) : null;
    const created = !set;
    if (!set) {
      const staging = (validatedInventory.staging || []).filter((item) => item.stagingComponent === componentId).map((item) => ({ variantName: item.stagingVariant, node: resolved.get(item.nodeId) }));
      for (const entry of staging) {
        for (const roleDefinition of definition2.roles) {
          if (!directChild(entry.node, `Role/${roleDefinition.name}`, [roleDefinition.type])) createComponentRoleNode(entry.node, roleDefinition);
        }
      }
      set = await executeStagingAssembly({
        staging,
        expectedVariantNames: definition2.variants.map((variant) => variant.name),
        createVariant: async (variantName) => {
          const variantDefinition = definition2.variants.find((variant) => variant.name === variantName);
          return { variantName, node: createComponentVariantNode(section, definition2, variantDefinition, true) };
        },
        combine: async (entries) => {
          const combined = figma.combineAsVariants(entries.map((entry) => entry.node), section);
          combined.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
          combined.name = definition2.name;
          return combined;
        },
        clearStaging: async (entry) => {
          entry.node.setPluginData("ondaStagingComponent", "");
          entry.node.setPluginData("ondaStagingVariant", "");
        }
      });
    } else {
      const recoveryActions = buildComponentRecoveryActions(validatedInventory, componentId);
      for (const action of recoveryActions) {
        if (action.type === "variant") {
          const variantDefinition = definition2.variants.find((variant) => variant.name === action.variantName);
          createComponentVariantNode(set, definition2, variantDefinition);
        }
        if (action.type === "role") {
          const component = directChild(set, action.variantName, ["COMPONENT"]);
          const roleDefinition = definition2.roles.find((role) => `Role/${role.name}` === action.roleName);
          createComponentRoleNode(component, roleDefinition);
        }
      }
    }
    set.name = definition2.name;
    set.description = `${definition2.label}: monochrome Tier-${definition2.tier}-Komponente mit Auto Layout, semantischen Variablen und expliziten Zust\xE4nden.`;
    set.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    set.setPluginData("ondaComponentId", definition2.id);
    set.layoutMode = "HORIZONTAL";
    set.layoutWrap = "WRAP";
    set.primaryAxisSizingMode = "AUTO";
    set.counterAxisSizingMode = "AUTO";
    set.itemSpacing = 24;
    set.paddingTop = 32;
    set.paddingRight = 32;
    set.paddingBottom = 32;
    set.paddingLeft = 32;
    set.fills = [solid("gray/050")];
    set.strokes = [solid("gray/200")];
    set.strokeWeight = 1;
    set.cornerRadius = 4;
    set.effects = [];
    for (const variantDefinition of definition2.variants) {
      const component = set.children.find((node) => node.type === "COMPONENT" && node.name === variantDefinition.name);
      if (!component) throw new Error(`Variante fehlt: ${definition2.name}/${variantDefinition.name}`);
      await configureComponentVariant(component, definition2, variantDefinition, ledger.fontDecision, variables);
    }
    const labelKey = componentLabelProperty(set, definition2);
    for (const component of set.children) {
      if (component.type !== "COMPONENT") continue;
      for (const role of component.children) {
        const roleName = role.name.slice("Role/".length);
        if (role.type === "TEXT" && roleName === definition2.labelRole) role.componentPropertyReferences = { characters: labelKey };
      }
    }
    const index = COMPONENT_DEFINITIONS.findIndex((component) => component.id === componentId);
    set.x = 80 + index % 2 * 980;
    set.y = 120 + Math.floor(index / 2) * 900;
    const sampleName = `${definition2.name} / Dokumentationsinstanz`;
    const sampleRecord = (validatedInventory.samples || []).find((item) => item.name === sampleName);
    let sample = sampleRecord ? resolved.get(sampleRecord.nodeId) : null;
    if (!sample) {
      sample = set.children.find((node) => node.type === "COMPONENT" && node.name === definition2.variants[0].name).createInstance();
      sample.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
      section.appendChild(sample);
    }
    const defaultComponent = directChild(set, definition2.variants[0].name, ["COMPONENT"]);
    const sampleIdentity = await readMainComponentIdentity(sample);
    if (sampleIdentity.id !== defaultComponent.id) sample.swapComponent(defaultComponent);
    sample.name = sampleName;
    sample.x = set.x;
    sample.y = set.y + set.height + 40;
    sample.effects = [];
    sample.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    sample.setPluginData("ondaDocumentationInstance", "true");
    sample.setPluginData("ondaRepeatedScreenInstance", "");
    return { component: definition2.name, status: created ? "created" : "reused", variantCount: set.children.length, documentationInstanceCount: 1 };
  }
  function componentSetById(page, componentId) {
    const definition2 = COMPONENT_DEFINITIONS.find((component) => component.id === componentId);
    const section = directChild(page, "02 \xB7 Komponenten", ["SECTION"]);
    return ((section == null ? void 0 : section.children) || []).filter((node) => node.type === "COMPONENT_SET" && node.name === (definition2 == null ? void 0 : definition2.name) && node.getPluginData("ondaComponentId") === componentId);
  }
  function parseCoreMarker(node) {
    const raw = node.getPluginData("ondaCoreView");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return { invalid: true };
    }
  }
  function coreBaseRecord(node) {
    var _a, _b, _c;
    return {
      nodeId: node.id,
      name: node.name,
      type: node.type,
      owner: node.getPluginData(CREATED_MARKER_KEY),
      parentId: ((_a = node.parent) == null ? void 0 : _a.id) || null,
      parentType: ((_b = node.parent) == null ? void 0 : _b.type) || null,
      parentName: ((_c = node.parent) == null ? void 0 : _c.name) || null
    };
  }
  function coreVisualRecord(node) {
    const record = {
      x: "x" in node ? node.x : null,
      y: "y" in node ? node.y : null,
      width: "width" in node ? node.width : null,
      height: "height" in node ? node.height : null,
      bounds: "x" in node ? { x: node.x, y: node.y, width: node.width, height: node.height } : null,
      absoluteBounds: cloneSerializable(node.absoluteBoundingBox || node.absoluteRenderBounds || null),
      fills: "fills" in node ? cloneSerializable(node.fills) : null,
      strokes: "strokes" in node ? cloneSerializable(node.strokes) : null,
      strokeWeight: "strokeWeight" in node ? node.strokeWeight : null,
      effects: "effects" in node ? cloneSerializable(node.effects) : null,
      opacity: "opacity" in node ? node.opacity : null,
      visible: "visible" in node ? node.visible : null,
      fillBindings: "fills" in node ? collectVisibleFillBindings(node.fills) : [],
      strokeBindings: "strokes" in node ? collectVisibleFillBindings(node.strokes) : [],
      fieldVariableIds: collectFieldVariableIds(node, [
        "itemSpacing",
        "paddingTop",
        "paddingRight",
        "paddingBottom",
        "paddingLeft",
        "topLeftRadius",
        "topRightRadius",
        "bottomLeftRadius",
        "bottomRightRadius"
      ]),
      textRangeBindings: node.type === "TEXT" ? collectTextRangeBindings(node) : [],
      pluginData: typeof node.getPluginData === "function" ? {
        owner: node.getPluginData(CREATED_MARKER_KEY),
        coreView: node.getPluginData("ondaCoreView"),
        repeatedScreen: node.getPluginData("ondaRepeatedScreenInstance"),
        documentation: node.getPluginData("ondaDocumentationInstance")
      } : {}
    };
    if ("layoutMode" in node) Object.assign(record, {
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
    });
    if ("layoutPositioning" in node) Object.assign(record, {
      layoutPositioning: node.layoutPositioning,
      layoutAlign: node.layoutAlign,
      layoutGrow: node.layoutGrow,
      constraints: "constraints" in node ? cloneSerializable(node.constraints) : null
    });
    return record;
  }
  function coreLabelValue(instance) {
    var _a, _b;
    const entries = Object.entries(instance.componentProperties || {});
    const label = entries.find(([key]) => key.split("#")[0] === "Label");
    return label ? (_b = (_a = label[1]) == null ? void 0 : _a.value) != null ? _b : null : null;
  }
  async function coreInstanceRecord(instance, contract = null) {
    var _a, _b;
    let main = null;
    try {
      const identity = await readMainComponentIdentity(instance);
      main = identity.id ? await figma.getNodeByIdAsync(identity.id) : null;
    } catch (_error) {
      main = null;
    }
    const set = ((_a = main == null ? void 0 : main.parent) == null ? void 0 : _a.type) === "COMPONENT_SET" ? main.parent : null;
    const roleCopy = {};
    const roleDescendants = [];
    for (const role of Object.keys((contract == null ? void 0 : contract.roleCopy) || {})) {
      const roleNode = instance.findOne((node) => node.type === "TEXT" && node.name === `Role/${role}`);
      roleCopy[role] = (_b = roleNode == null ? void 0 : roleNode.characters) != null ? _b : null;
      if (roleNode) roleDescendants.push(__spreadProps(__spreadValues(__spreadValues({}, coreBaseRecord(roleNode)), coreVisualRecord(roleNode)), {
        parentInstanceId: instance.id,
        role,
        characters: roleNode.characters
      }));
    }
    return __spreadProps(__spreadValues(__spreadValues({}, coreBaseRecord(instance)), coreVisualRecord(instance)), {
      repeatedScreen: instance.getPluginData("ondaRepeatedScreenInstance") === "true",
      documentation: instance.getPluginData("ondaDocumentationInstance") === "true",
      mainComponentId: (main == null ? void 0 : main.id) || null,
      componentSetId: (set == null ? void 0 : set.id) || null,
      componentSetName: (set == null ? void 0 : set.name) || null,
      variantName: (main == null ? void 0 : main.name) || null,
      labelValue: coreLabelValue(instance),
      componentProperties: cloneSerializable(instance.componentProperties || {}),
      roleCopy,
      roleDescendants
    });
  }
  async function coreViewRecord(node, definition2, legacy = false) {
    const copyRoles = new Set(((definition2 == null ? void 0 : definition2.copyContracts) || []).map((copy) => copy.role));
    const instanceContracts = new Map(((definition2 == null ? void 0 : definition2.instances) || []).map((instance) => [instance.name, instance]));
    const layoutNames = new Set(((definition2 == null ? void 0 : definition2.regions) || []).map((region) => region.name));
    const layoutRegions = [];
    const copyNodes = [];
    const instances = [];
    const standIns = [];
    async function visit(child) {
      const role = child.name.startsWith("Copy / ") ? child.name.slice("Copy / ".length) : null;
      if (child.type === "FRAME" && layoutNames.has(child.name)) {
        layoutRegions.push(__spreadProps(__spreadValues(__spreadValues({}, coreBaseRecord(child)), coreVisualRecord(child)), {
          cornerRadius: child.cornerRadius,
          childCount: child.children.length,
          childIds: child.children.map((node2) => node2.id)
        }));
        for (const descendant of child.children) await visit(descendant);
      } else if (child.type === "TEXT" && role && copyRoles.has(role)) {
        copyNodes.push(__spreadProps(__spreadValues(__spreadValues({}, coreBaseRecord(child)), coreVisualRecord(child)), { role, characters: child.characters }));
      } else if (child.type === "INSTANCE" && instanceContracts.has(child.name)) {
        const contract = instanceContracts.get(child.name);
        instances.push(__spreadProps(__spreadValues({}, await coreInstanceRecord(child, contract)), { region: contract.region }));
      } else {
        standIns.push(__spreadValues(__spreadValues({}, coreBaseRecord(child)), coreVisualRecord(child)));
      }
    }
    for (const child of node.children) await visit(child);
    return __spreadProps(__spreadValues(__spreadValues({}, coreBaseRecord(node)), coreVisualRecord(node)), {
      legacy,
      width: node.width,
      height: node.height,
      cornerRadius: node.cornerRadius,
      coreView: parseCoreMarker(node),
      layoutRegions,
      copyNodes,
      instances,
      standIns
    });
  }
  async function collectCoreViewMutationInventory(page = figma.currentPage) {
    await figma.loadAllPagesAsync();
    const sectionNames = /* @__PURE__ */ new Set(["00 \xB7 \xDCbersicht", "03 \xB7 Bibliothek", "04 \xB7 Editor"]);
    const canonicalNames = new Set(CORE_VIEW_DEFINITIONS.map((definition2) => definition2.name));
    const legacyNames = new Set(Object.keys(CORE_LEGACY_VIEW_NAMES));
    const sections = [];
    const candidates = [];
    const overviewCandidates = [];
    function visit(node) {
      if (node.type === "SECTION" && sectionNames.has(node.name)) sections.push(__spreadValues(__spreadValues({}, coreBaseRecord(node)), coreVisualRecord(node)));
      if (node.type === "FRAME") {
        if (node.name === CORE_OVERVIEW_DEFINITION.name) overviewCandidates.push(node);
        else if (canonicalNames.has(node.name) || legacyNames.has(node.name) || node.getPluginData("ondaCoreView")) candidates.push(node);
      }
      if ("children" in node) for (const child of node.children) visit(child);
    }
    for (const child of page.children) visit(child);
    const views = [];
    const legacyViews = [];
    for (const node of candidates) {
      const canonicalName = CORE_LEGACY_VIEW_NAMES[node.name] || node.name;
      const definition2 = CORE_VIEW_DEFINITIONS.find((item) => item.name === canonicalName);
      const legacy = !parseCoreMarker(node);
      const record = await coreViewRecord(node, definition2, legacy);
      if (legacy) legacyViews.push(record);
      else views.push(record);
    }
    const overviewNode = overviewCandidates.length === 1 ? overviewCandidates[0] : null;
    const overview = overviewNode ? __spreadProps(__spreadValues(__spreadValues({}, coreBaseRecord(overviewNode)), coreVisualRecord(overviewNode)), {
      cornerRadius: overviewNode.cornerRadius,
      lines: overviewNode.children.filter((child) => child.type === "TEXT" && child.name.startsWith("Coverage / ")).map((child) => __spreadProps(__spreadValues(__spreadValues({}, coreBaseRecord(child)), coreVisualRecord(child)), {
        characters: child.characters
      })),
      standIns: overviewNode.children.filter((child) => !(child.type === "TEXT" && child.name.startsWith("Coverage / "))).map((child) => __spreadValues(__spreadValues({}, coreBaseRecord(child)), coreVisualRecord(child)))
    }) : null;
    if (overviewCandidates.length > 1) {
      for (const duplicate of overviewCandidates) views.push(await coreViewRecord(duplicate, null, false));
    }
    return {
      targetPage: __spreadProps(__spreadValues(__spreadValues({}, coreBaseRecord(page)), coreVisualRecord(page)), { id: page.id }),
      sections,
      overview,
      views,
      legacyViews
    };
  }
  async function preflightCoreViewMutation() {
    const inventory = await collectCoreViewMutationInventory(figma.currentPage);
    const validation = validateCoreViewMutationInventory(inventory);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    return inventory;
  }
  function ownedCoreVariant(page, contract) {
    const definition2 = COMPONENT_DEFINITIONS.find((component) => component.id === contract.setId);
    const sets = componentSetById(page, contract.setId);
    if (sets.length !== 1 || sets[0].getPluginData(CREATED_MARKER_KEY) !== PLUGIN_ORIGIN) throw new Error(`Core-View Component Set fehlt oder ist mehrdeutig: ${(definition2 == null ? void 0 : definition2.name) || contract.setId}`);
    const variants = sets[0].children.filter((node) => node.type === "COMPONENT" && node.name === contract.variant);
    if (variants.length !== 1 || variants[0].getPluginData(CREATED_MARKER_KEY) !== PLUGIN_ORIGIN) throw new Error(`Core-View Variante fehlt oder ist mehrdeutig: ${definition2.name}/${contract.variant}`);
    return variants[0];
  }
  async function ensureVariantInstance(parent, variant, contract, root = parent) {
    let instance = root.findOne((node) => node.type === "INSTANCE" && node.name === contract.name);
    if (!instance) {
      instance = variant.createInstance();
    }
    if (instance.parent !== parent) parent.appendChild(instance);
    const identity = await readMainComponentIdentity(instance);
    if (identity.id !== variant.id) instance.swapComponent(variant);
    instance.name = contract.name;
    instance.visible = true;
    instance.effects = [];
    instance.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    instance.setPluginData("ondaDocumentationInstance", "");
    instance.setPluginData("ondaRepeatedScreenInstance", "true");
    const labelKey = Object.keys(instance.componentProperties || {}).find((key) => key.split("#")[0] === "Label");
    if (!labelKey) throw new Error(`Label-Property fehlt: ${contract.name}`);
    instance.setProperties({ [labelKey]: contract.label });
    for (const [role, characters] of Object.entries(contract.roleCopy)) {
      const roleNode = instance.findOne((node) => node.type === "TEXT" && node.name === `Role/${role}`);
      if (!roleNode) throw new Error(`Textrolle fehlt: ${contract.name}/Role/${role}`);
      roleNode.characters = characters;
    }
    return instance;
  }
  async function resolveCoreInventoryNodes(inventory, page) {
    var _a, _b, _c, _d;
    const records = [
      ...inventory.sections || [],
      ...inventory.overview ? [inventory.overview] : [],
      ...((_a = inventory.overview) == null ? void 0 : _a.lines) || [],
      ...((_b = inventory.overview) == null ? void 0 : _b.standIns) || [],
      ...inventory.views || [],
      ...inventory.legacyViews || [],
      ...(inventory.views || []).flatMap((view) => [...view.layoutRegions || [], ...view.copyNodes || [], ...view.instances || [], ...view.standIns || []]),
      ...(inventory.legacyViews || []).flatMap((view) => [...view.layoutRegions || [], ...view.copyNodes || [], ...view.instances || [], ...view.standIns || []])
    ];
    const resolved = /* @__PURE__ */ new Map();
    for (const record of records) {
      const node = await figma.getNodeByIdAsync(record.nodeId);
      if (!node || node.type !== record.type || node.name !== record.name || ((_c = node.parent) == null ? void 0 : _c.id) !== record.parentId || node.getPluginData(CREATED_MARKER_KEY) !== record.owner) throw new Error(`TOCTOU: Core-Knoten ersetzt oder verschoben: ${record.name}`);
      resolved.set(record.nodeId, node);
    }
    if (page.id !== ((_d = inventory.targetPage) == null ? void 0 : _d.id)) throw new Error("TOCTOU: Core-Zielseite wurde gewechselt.");
    return resolved;
  }
  function coreRegionFill(regionName) {
    return regionName === "Layout / Rail" || regionName === "Layout / Review" ? "gray/050" : regionName === "Layout / Toolbar" ? "gray/025" : "gray/000";
  }
  function configureCoreLayoutRegions(frame, definition2) {
    const regions = /* @__PURE__ */ new Map();
    for (const regionDefinition of definition2.regions) {
      const parent = regionDefinition.parentName === definition2.name ? frame : regions.get(regionDefinition.parentName);
      if (!parent) throw new Error(`Layout-Elternregion fehlt: ${definition2.name}/${regionDefinition.name}`);
      let region = frame.findOne((node) => node.type === "FRAME" && node.name === regionDefinition.name);
      if (!region) {
        region = figma.createFrame();
        region.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
      }
      if (region.parent !== parent) parent.appendChild(region);
      region.name = regionDefinition.name;
      region.layoutMode = regionDefinition.layoutMode;
      region.primaryAxisSizingMode = "FIXED";
      region.counterAxisSizingMode = "FIXED";
      region.primaryAxisAlignItems = "MIN";
      region.counterAxisAlignItems = "MIN";
      region.itemSpacing = regionDefinition.itemSpacing;
      region.paddingTop = regionDefinition.padding.top;
      region.paddingRight = regionDefinition.padding.right;
      region.paddingBottom = regionDefinition.padding.bottom;
      region.paddingLeft = regionDefinition.padding.left;
      resizeNode(region, regionDefinition.width, regionDefinition.height);
      region.fills = [solid(coreRegionFill(regionDefinition.name))];
      region.strokes = [solid("gray/200")];
      region.strokeWeight = 1;
      region.cornerRadius = 0;
      region.effects = [];
      region.visible = true;
      region.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
      parent.appendChild(region);
      regions.set(regionDefinition.name, region);
    }
    return regions;
  }
  function configureCoreCopy(frame, definition2, decision, regions) {
    const nodes = [];
    const indexes = /* @__PURE__ */ new Map();
    for (const contract of definition2.copyContracts) {
      const parent = regions.get(contract.region);
      let copy = frame.findOne((node) => node.type === "TEXT" && node.name === `Copy / ${contract.role}`);
      if (copy && copy.parent !== parent) parent.appendChild(copy);
      copy = textNode(parent, `Copy / ${contract.role}`, contract.characters, decision, {
        size: contract.kind === "title" || contract.role === "title" ? 21 : contract.kind === "heading" ? 15 : 15,
        weight: contract.kind === "title" || contract.kind === "heading" || ["title", "status"].includes(contract.role) ? 700 : 400,
        muted: ["body", "paragraph"].includes(contract.role) || contract.kind === "paragraph",
        width: parent.width - parent.paddingLeft - parent.paddingRight
      }).node;
      copy.visible = true;
      const index = indexes.get(contract.region) || 0;
      parent.insertChild(index, copy);
      indexes.set(contract.region, index + 1);
      nodes.push(copy);
    }
    return nodes;
  }
  function positionCoreInstance(instance, contract, regions) {
    const region = regions.get(contract.region);
    const availableWidth = region.width - region.paddingLeft - region.paddingRight;
    if (contract.expectedWidth > availableWidth) throw new Error(`Core-Instanz breiter als Region: ${contract.name}`);
    resizeNode(instance, contract.expectedWidth, contract.expectedHeight);
  }
  async function runCoreViews(page, ledger, writeBarrierInventory, resolved) {
    var _a;
    const variants = /* @__PURE__ */ new Map();
    for (const definition2 of CORE_VIEW_DEFINITIONS) for (const contract of definition2.instances) {
      const key = `${contract.setId}\0${contract.variant}`;
      if (!variants.has(key)) variants.set(key, ownedCoreVariant(page, contract));
    }
    const overviewRecord = writeBarrierInventory.overview;
    const overviewSectionRecord = (writeBarrierInventory.sections || []).find((record) => record.name === "00 \xB7 \xDCbersicht");
    const overviewSection = overviewSectionRecord ? resolved.get(overviewSectionRecord.nodeId) : ensureSection(page, ledger, "00 \xB7 \xDCbersicht", 1800).node;
    const overviewFrame = overviewRecord ? resolved.get(overviewRecord.nodeId) : autoFrame(overviewSection, CORE_OVERVIEW_DEFINITION.name, { x: 80, y: 100, width: 1940, padding: 40, gap: 20, radius: 6 }).node;
    overviewFrame.name = CORE_OVERVIEW_DEFINITION.name;
    overviewFrame.effects = [];
    overviewFrame.cornerRadius = CORE_OVERVIEW_DEFINITION.radius;
    overviewFrame.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    for (const child of overviewFrame.children) if (!(child.type === "TEXT" && child.name.startsWith("Coverage / "))) child.visible = false;
    for (const [index, line] of CORE_OVERVIEW_DEFINITION.lines.entries()) {
      const node = textNode(overviewFrame, `Coverage / ${index + 1}`, line, ledger.fontDecision, { size: index === 0 ? 21 : 15, weight: index === 0 ? 700 : 500, width: 1860 }).node;
      node.visible = true;
      overviewFrame.insertChild(index, node);
    }
    const sectionRecords = new Map((writeBarrierInventory.sections || []).map((record) => [record.name, record]));
    const allRecords = [...writeBarrierInventory.views || [], ...writeBarrierInventory.legacyViews || []];
    const sectionIndexes = /* @__PURE__ */ new Map([["03 \xB7 Bibliothek", 0], ["04 \xB7 Editor", 0]]);
    for (const definition2 of CORE_VIEW_DEFINITIONS) {
      const sectionRecord = sectionRecords.get(definition2.sectionName);
      const section = sectionRecord ? resolved.get(sectionRecord.nodeId) : ensureSection(page, ledger, definition2.sectionName, 1800).node;
      const record = allRecords.find((candidate) => (CORE_LEGACY_VIEW_NAMES[candidate.name] || candidate.name) === definition2.name);
      if (record) resolved.get(record.nodeId).name = definition2.name;
      const index = sectionIndexes.get(definition2.sectionName);
      sectionIndexes.set(definition2.sectionName, index + 1);
      let frame = directChild(section, definition2.name, ["FRAME"]);
      if (!frame) {
        frame = figma.createFrame();
        frame.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
        section.appendChild(frame);
      }
      frame.name = definition2.name;
      const expectedTopLevelNames = new Set(definition2.regions.filter((region) => region.parentName === definition2.name).map((region) => region.name));
      reconcileLegacyCoreChildren(frame, expectedTopLevelNames);
      frame.layoutMode = definition2.layoutMode;
      frame.primaryAxisSizingMode = "FIXED";
      frame.counterAxisSizingMode = "FIXED";
      frame.primaryAxisAlignItems = "MIN";
      frame.counterAxisAlignItems = "MIN";
      frame.itemSpacing = 0;
      frame.paddingTop = 0;
      frame.paddingRight = 0;
      frame.paddingBottom = 0;
      frame.paddingLeft = 0;
      frame.x = 80;
      frame.y = 100 + index * 900;
      resizeNode(frame, definition2.width, definition2.height);
      frame.fills = [solid("gray/000")];
      frame.strokes = [solid("gray/200")];
      frame.strokeWeight = 1;
      frame.effects = [];
      frame.cornerRadius = 0;
      frame.clipsContent = true;
      frame.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
      frame.setPluginData("ondaCoreView", JSON.stringify({ section: definition2.section, state: definition2.state, width: 1440, reviewRelation: ((_a = definition2.reviewContext) == null ? void 0 : _a.relation) || null }));
      const regions = configureCoreLayoutRegions(frame, definition2);
      const copyNodes = configureCoreCopy(frame, definition2, ledger.fontDecision, regions);
      const copyCountByRegion = new Map(definition2.copyContracts.map((contract) => [contract.region, definition2.copyContracts.filter((item) => item.region === contract.region).length]));
      const instanceCountByRegion = /* @__PURE__ */ new Map();
      for (const [instanceIndex, contract] of definition2.instances.entries()) {
        const variant = variants.get(`${contract.setId}\0${contract.variant}`);
        const parent = regions.get(contract.region);
        const instance = await ensureVariantInstance(parent, variant, contract, frame);
        positionCoreInstance(instance, contract, regions);
        const localIndex = instanceCountByRegion.get(contract.region) || 0;
        parent.insertChild((copyCountByRegion.get(contract.region) || 0) + localIndex, instance);
        instanceCountByRegion.set(contract.region, localIndex + 1);
      }
    }
    const library = directChild(page, "03 \xB7 Bibliothek", ["SECTION"]);
    const editor = directChild(page, "04 \xB7 Editor", ["SECTION"]);
    resizeNode(library, SECTION_WIDTH, 100 + 8 * 900 + 100);
    resizeNode(editor, SECTION_WIDTH, 100 + 10 * 900 + 100);
    return {
      sections: 3,
      libraryViews: 8,
      editorViews: 10,
      componentInstances: CORE_VIEW_DEFINITIONS.reduce((count, definition2) => count + definition2.instances.length, 0)
    };
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
  var SECONDARY_SECTION_NAMES2 = Object.freeze([
    "07 \xB7 Agent & Quellen",
    "09 \xB7 Men\xFCs & Nebenansichten",
    "10 \xB7 Responsive & Dark"
  ]);
  var SECONDARY_LEGACY_VIEW_SECTIONS2 = Object.freeze({
    "Agent \xB7 Ruhe": "07 \xB7 Agent & Quellen",
    "Agent \xB7 Gespr\xE4ch": "07 \xB7 Agent & Quellen",
    "Agent \xB7 Antwort mit Fundstelle": "07 \xB7 Agent & Quellen",
    "Agent \xB7 Fehler und R\xFCckkehr": "07 \xB7 Agent & Quellen",
    "Dokumentmen\xFC \xB7 geschlossen": "09 \xB7 Men\xFCs & Nebenansichten",
    "Dokumentmen\xFC \xB7 offen": "09 \xB7 Men\xFCs & Nebenansichten",
    "Quellenleser \xB7 offen": "09 \xB7 Men\xFCs & Nebenansichten",
    "Recherchelauf \xB7 pausiert": "09 \xB7 Men\xFCs & Nebenansichten",
    "Entscheidungsverlauf \xB7 gef\xFCllt": "09 \xB7 Men\xFCs & Nebenansichten",
    "Leerer Zustand \xB7 Recovery": "09 \xB7 Men\xFCs & Nebenansichten",
    "Editor / 1440px \xB7 Responsive": "10 \xB7 Responsive & Dark",
    "Editor / 1024px \xB7 Responsive": "10 \xB7 Responsive & Dark",
    "Editor / 720px \xB7 Responsive": "10 \xB7 Responsive & Dark",
    "Editor / 320px \xB7 Kleinbreite": "10 \xB7 Responsive & Dark",
    "Editor / 1440px \xB7 Dark": "10 \xB7 Responsive & Dark"
  });
  function indexSecondaryVariableCollections(collections) {
    const requiredNames = [
      "Onda \xB7 Semantic \xB7 Light",
      "Onda \xB7 Semantic \xB7 Dark",
      "Onda \xB7 Dimension"
    ];
    return new Map(requiredNames.map((name) => {
      const matches = collections.filter((collection) => collection.name === name);
      if (matches.length !== 1) throw new Error(`Secondary-Variable-Collection fehlt oder ist mehrdeutig: ${name}`);
      return [name, matches[0]];
    }));
  }
  function secondaryRequiredTextTokens() {
    return [.../* @__PURE__ */ new Set([
      "color/text",
      "color/text-muted",
      ...secondaryDefinitionsWithGroups2().flatMap(({ definition: definition2 }) => definition2.instances.map((contract) => {
        var _a;
        const component = COMPONENT_DEFINITIONS.find((candidate) => candidate.id === contract.setId);
        return ((_a = component == null ? void 0 : component.variants.find((candidate) => candidate.name === contract.variant)) == null ? void 0 : _a.textToken) || "color/text";
      }))
    ])];
  }
  function secondaryRequiredSurfaceTokens() {
    return [.../* @__PURE__ */ new Set([
      "color/surface",
      ...secondaryDefinitionsWithGroups2().flatMap(({ definition: definition2 }) => definition2.instances.map((contract) => {
        var _a;
        const component = COMPONENT_DEFINITIONS.find((candidate) => candidate.id === contract.setId);
        return ((_a = component == null ? void 0 : component.variants.find((candidate) => candidate.name === contract.variant)) == null ? void 0 : _a.surfaceToken) || "color/surface";
      }))
    ])];
  }
  function uniqueSecondaryVariableRecords(records) {
    return [...new Map(records.map((record) => [record.id, record])).values()];
  }
  function secondaryVariableContext() {
    return Promise.all([
      figma.variables.getLocalVariableCollectionsAsync(),
      figma.variables.getLocalVariablesAsync()
    ]).then(([collections, localVariables]) => {
      const collectionByName = indexSecondaryVariableCollections(collections);
      const exactVariable = (collectionName, name) => {
        const collection = collectionByName.get(collectionName);
        if (!collection) throw new Error(`Secondary-Variable-Collection fehlt: ${collectionName}`);
        const matches = localVariables.filter((variable) => variable.variableCollectionId === collection.id && variable.name === name);
        if (matches.length !== 1) throw new Error(`Secondary-Variable fehlt oder ist mehrdeutig: ${collectionName}/${name}`);
        return matches[0];
      };
      const semanticTokens = [.../* @__PURE__ */ new Set([...secondaryRequiredTextTokens(), ...secondaryRequiredSurfaceTokens()])];
      const semantic = (collectionName) => ({
        surface: exactVariable(collectionName, "color/surface"),
        border: exactVariable(collectionName, "color/border"),
        semanticByToken: Object.fromEntries(semanticTokens.map((token) => [token, exactVariable(collectionName, token)]))
      });
      const dimensionValues = [...new Set(SECONDARY_VIEW_DEFINITIONS.agentSources.concat(SECONDARY_VIEW_DEFINITIONS.secondary, SECONDARY_VIEW_DEFINITIONS.responsive).flatMap((definition2) => definition2.regions.flatMap((region) => [
        region.itemSpacing,
        region.padding.top,
        region.padding.right,
        region.padding.bottom,
        region.padding.left
      ])).filter((value) => value > 0))];
      return {
        semanticByTheme: {
          Light: semantic("Onda \xB7 Semantic \xB7 Light"),
          Dark: semantic("Onda \xB7 Semantic \xB7 Dark")
        },
        dimensionByValue: new Map(dimensionValues.map((value) => [value, exactVariable("Onda \xB7 Dimension", `spacing/${value}`)])),
        inventory: uniqueSecondaryVariableRecords([
          ...["Light", "Dark"].flatMap((theme) => {
            const collectionName = `Onda \xB7 Semantic \xB7 ${theme}`;
            const context = semantic(collectionName);
            return [context.border, ...Object.values(context.semanticByToken)].map((variable) => ({
              id: variable.id,
              nodeId: variable.id,
              name: variable.name,
              collectionName
            }));
          }),
          ...dimensionValues.map((value) => {
            const variable = exactVariable("Onda \xB7 Dimension", `spacing/${value}`);
            return { id: variable.id, nodeId: variable.id, name: variable.name, collectionName: "Onda \xB7 Dimension" };
          })
        ])
      };
    });
  }
  function applySecondaryThemeBinding({ node, theme, variables, bindPaint, textToken = "color/text", surfaceToken = "color/surface", recursive = true }) {
    const semantic = theme === "Dark" ? variables.semanticByTheme.Dark : variables.semanticByTheme.Light;
    if (Array.isArray(node.fills) && node.fills.length) {
      const token = node.type === "TEXT" || node.type === "ELLIPSE" ? textToken : surfaceToken;
      const variable = node.type === "TEXT" || node.type === "ELLIPSE" ? semantic.semanticByToken[textToken] : semantic.semanticByToken[surfaceToken];
      if (!variable) throw new Error(`Secondary-Farbvariable fehlt: ${theme}/${token}`);
      node.fills = node.fills.map((paint) => (paint == null ? void 0 : paint.type) === "SOLID" ? bindPaint(paint, variable) : paint);
    }
    if (Array.isArray(node.strokes) && node.strokes.length) {
      node.strokes = node.strokes.map((paint) => (paint == null ? void 0 : paint.type) === "SOLID" ? bindPaint(paint, semantic.border) : paint);
    }
    if (recursive && Array.isArray(node.children)) {
      for (const child of node.children) applySecondaryThemeBinding({ node: child, theme, variables, bindPaint, textToken, surfaceToken, recursive });
    }
  }
  function bindSecondaryNodeTheme(node, theme, variables, textToken = "color/text", surfaceToken = "color/surface", recursive = true) {
    const semantic = theme === "Dark" ? variables.semanticByTheme.Dark : variables.semanticByTheme.Light;
    applySecondaryThemeBinding({
      node,
      theme,
      variables,
      textToken,
      surfaceToken,
      recursive,
      bindPaint: (paint, variable) => figma.variables.setBoundVariableForPaint(paint, "color", variable)
    });
    return semantic;
  }
  function secondaryDefinitionsWithGroups2() {
    return Object.entries(SECONDARY_VIEW_DEFINITIONS).flatMap(([group, definitions]) => definitions.map((definition2) => ({ group, definition: definition2 })));
  }
  function parseSecondaryMarker(node) {
    const raw = node.getPluginData("secondaryView");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return { invalid: true };
    }
  }
  function secondaryPluginData(node) {
    return {
      owner: node.getPluginData(CREATED_MARKER_KEY),
      secondaryView: node.getPluginData("secondaryView"),
      ondaSecondaryView: node.getPluginData("ondaSecondaryView"),
      responsiveFrame: node.getPluginData("responsiveFrame"),
      ondaResponsiveFrame: node.getPluginData("ondaResponsiveFrame"),
      role: node.getPluginData("role"),
      legacy: node.getPluginData("legacy"),
      secondaryRegionContract: node.getPluginData("secondaryRegionContract"),
      repeatedScreen: node.getPluginData("ondaRepeatedScreenInstance"),
      documentation: node.getPluginData("ondaDocumentationInstance")
    };
  }
  function secondaryNodeRecord(node) {
    const record = __spreadProps(__spreadValues(__spreadValues({}, coreBaseRecord(node)), coreVisualRecord(node)), {
      pluginData: secondaryPluginData(node)
    });
    if ("children" in node) {
      record.childIds = node.children.map((child) => child.id);
      record.childCount = node.children.length;
    } else {
      record.childIds = [];
      record.childCount = 0;
    }
    return record;
  }
  function secondaryAncestorRecord(node) {
    return secondaryNodeRecord(node);
  }
  function secondaryRecordedAncestry(node, root) {
    const chain = [];
    let parent = node.parent;
    while (parent && parent !== root) {
      chain.push(secondaryAncestorRecord(parent));
      parent = parent.parent;
    }
    return {
      ancestorChain: chain,
      ancestorIds: [...chain.map((record) => record.nodeId), root.id]
    };
  }
  function collectSecondaryInstanceRoleRecords(instance, recordNode = secondaryNodeRecord, recordedAncestry = secondaryRecordedAncestry) {
    const instanceRecord = recordNode(instance);
    const roleDescendants = instance.findAll((node) => node.name.startsWith("Role/")).map((roleNode) => {
      const role = roleNode.name.slice("Role/".length);
      return __spreadValues(__spreadValues(__spreadProps(__spreadValues({}, recordNode(roleNode)), {
        parentInstanceId: instance.id,
        role
      }), roleNode.type === "TEXT" ? { characters: roleNode.characters } : {}), recordedAncestry(roleNode, instance));
    });
    return {
      instanceRecord,
      roleDescendants,
      roleCopy: Object.fromEntries(roleDescendants.filter((role) => role.type === "TEXT" && role.visible !== false).map((role) => [role.role, role.characters]))
    };
  }
  async function secondaryInstanceRecord(instance, contract) {
    var _a;
    let main = null;
    try {
      const identity = await readMainComponentIdentity(instance);
      main = identity.id ? await figma.getNodeByIdAsync(identity.id) : null;
    } catch (_error) {
      main = null;
    }
    const set = ((_a = main == null ? void 0 : main.parent) == null ? void 0 : _a.type) === "COMPONENT_SET" ? main.parent : null;
    const { instanceRecord, roleDescendants, roleCopy } = collectSecondaryInstanceRoleRecords(instance);
    return __spreadProps(__spreadValues({}, instanceRecord), {
      region: contract.region,
      repeatedScreen: instance.getPluginData("ondaRepeatedScreenInstance") === "true",
      documentation: instance.getPluginData("ondaDocumentationInstance") === "true",
      mainComponentId: (main == null ? void 0 : main.id) || null,
      componentId: (main == null ? void 0 : main.id) || null,
      componentSetId: (set == null ? void 0 : set.id) || null,
      componentSetName: (set == null ? void 0 : set.name) || null,
      variantName: (main == null ? void 0 : main.name) || null,
      labelValue: coreLabelValue(instance),
      componentProperties: cloneSerializable(instance.componentProperties || {}),
      roleCopy,
      roleDescendants
    });
  }
  async function secondaryViewRecord(node, group, definition2, legacy = false) {
    var _a;
    if (legacy) {
      let collectLegacyLeaves = function(child) {
        if ("children" in child && child.children.length) {
          for (const nested of child.children) collectLegacyLeaves(nested);
          return;
        }
        legacyChildren.push(__spreadValues(__spreadValues({}, secondaryNodeRecord(child)), secondaryRecordedAncestry(child, node)));
      };
      const legacyChildren = [];
      for (const child of node.children) collectLegacyLeaves(child);
      return __spreadProps(__spreadValues({}, secondaryNodeRecord(node)), {
        legacy: true,
        responsiveFrame: node.getPluginData("ondaResponsiveFrame") || node.getPluginData("responsiveFrame"),
        legacyChildren
      });
    }
    const regionContracts = new Map(definition2.regions.map((region) => [region.name, region]));
    const copyContracts = new Map(definition2.copyContracts.map((copy) => [copy.role, copy]));
    const instanceContracts = new Map(definition2.instances.map((instance) => [instance.name, instance]));
    const layoutRegions = [];
    const copyNodes = [];
    const instances = [];
    const standIns = [];
    async function visit(child) {
      const copyRole = child.name.startsWith("Copy / ") ? child.name.slice("Copy / ".length) : null;
      if (child.type === "FRAME" && regionContracts.has(child.name)) {
        layoutRegions.push(secondaryNodeRecord(child));
        for (const nested of child.children) await visit(nested);
      } else if (child.type === "TEXT" && copyContracts.has(copyRole)) {
        copyNodes.push(__spreadProps(__spreadValues({}, secondaryNodeRecord(child)), { role: copyRole, characters: child.characters }));
      } else if (child.type === "INSTANCE" && instanceContracts.has(child.name)) {
        instances.push(await secondaryInstanceRecord(child, instanceContracts.get(child.name)));
      } else {
        standIns.push(__spreadValues(__spreadValues({}, secondaryNodeRecord(child)), secondaryRecordedAncestry(child, node)));
      }
    }
    for (const child of node.children) await visit(child);
    return __spreadProps(__spreadValues({}, secondaryNodeRecord(node)), {
      secondaryView: parseSecondaryMarker(node),
      group,
      theme: definition2.theme,
      subject: definition2.subject || null,
      breakpoint: (_a = definition2.breakpoint) != null ? _a : null,
      layoutRegions,
      copyNodes,
      instances,
      standIns
    });
  }
  function secondaryComponentInventory(page) {
    const usedIds = new Set(secondaryDefinitionsWithGroups2().flatMap(({ definition: definition2 }) => definition2.instances.map((instance) => instance.setId)));
    return COMPONENT_DEFINITIONS.filter((definition2) => usedIds.has(definition2.id)).map((definition2) => {
      const sets = componentSetById(page, definition2.id);
      if (sets.length !== 1 || sets[0].getPluginData(CREATED_MARKER_KEY) !== PLUGIN_ORIGIN) {
        throw new Error(`Secondary Component Set fehlt oder ist mehrdeutig: ${definition2.name}`);
      }
      const set = sets[0];
      return {
        id: definition2.id,
        nodeId: set.id,
        name: set.name,
        type: set.type,
        owner: set.getPluginData(CREATED_MARKER_KEY),
        childIds: set.children.map((child) => child.id),
        childCount: set.children.length,
        variants: set.children.map((variant) => __spreadValues({}, secondaryAncestorRecord(variant)))
      };
    });
  }
  function collectSecondaryUntouchedDescendantRecords(root, recordNode = secondaryNodeRecord) {
    const records = [];
    function visit(parent) {
      if (!("children" in parent)) return;
      for (const child of parent.children) {
        records.push(recordNode(child));
        visit(child);
      }
    }
    visit(root);
    return records;
  }
  async function collectSecondaryViewMutationInventory(page = figma.currentPage) {
    await figma.loadAllPagesAsync();
    const definitionEntries = secondaryDefinitionsWithGroups2();
    const definitionByName = new Map(definitionEntries.map((entry) => [entry.definition.name, entry]));
    const targetSections = page.children.filter((node) => node.type === "SECTION" && SECONDARY_SECTION_NAMES2.includes(node.name));
    const sections = targetSections.map(secondaryNodeRecord);
    const views = [];
    const legacyViews = [];
    for (const section of targetSections) {
      for (const child of section.children) {
        const entry = definitionByName.get(child.name);
        if (entry || child.getPluginData("secondaryView")) {
          views.push(await secondaryViewRecord(child, (entry == null ? void 0 : entry.group) || "", (entry == null ? void 0 : entry.definition) || { regions: [], copyContracts: [], instances: [], theme: "Light" }));
        } else if (SECONDARY_LEGACY_VIEW_SECTIONS2[child.name] === section.name) {
          legacyViews.push(await secondaryViewRecord(child, "", null, true));
        }
      }
    }
    const variables = await secondaryVariableContext();
    const targetPage = secondaryNodeRecord(page);
    const untouchedPageNodes = page.children.filter((node) => !SECONDARY_SECTION_NAMES2.includes(node.name));
    const untouchedPageChildren = untouchedPageNodes.map(secondaryNodeRecord);
    const untouchedPageDescendants = untouchedPageNodes.flatMap((node) => collectSecondaryUntouchedDescendantRecords(node));
    return {
      targetPage,
      sections,
      views,
      legacyViews,
      untouchedPageChildren,
      untouchedPageDescendants,
      components: secondaryComponentInventory(page),
      variables: variables.inventory
    };
  }
  async function preflightSecondaryViewMutation() {
    const inventory = await collectSecondaryViewMutationInventory(figma.currentPage);
    const validation = validateSecondaryViewMutationInventory(inventory);
    if (!validation.valid) throw new Error(validation.errors.join("\n"));
    return inventory;
  }
  function secondaryMutableRecords(inventory) {
    return [
      ...inventory.sections || [],
      ...inventory.views || [],
      ...inventory.legacyViews || [],
      ...(inventory.views || []).flatMap((view) => [
        ...view.layoutRegions || [],
        ...view.copyNodes || [],
        ...view.instances || [],
        ...(view.instances || []).flatMap((instance) => (instance.roleDescendants || []).flatMap((role) => [role, ...role.ancestorChain || []])),
        ...view.standIns || []
      ]),
      ...(inventory.legacyViews || []).flatMap((view) => view.legacyChildren || [])
    ];
  }
  async function resolveSecondaryInventoryNodes({ page, ledger }, inventory) {
    var _a, _b;
    if (page.id !== ((_a = inventory.targetPage) == null ? void 0 : _a.nodeId)) throw new Error("TOCTOU: Secondary-Zielseite wurde gewechselt.");
    await loadDecisionFonts(ledger.fontDecision);
    const variables = await secondaryVariableContext();
    const resolved = /* @__PURE__ */ new Map();
    for (const record of secondaryMutableRecords(inventory)) {
      const node = await figma.getNodeByIdAsync(record.nodeId);
      if (!node || node.type !== record.type || node.name !== record.name || ((_b = node.parent) == null ? void 0 : _b.id) !== record.parentId || node.getPluginData(CREATED_MARKER_KEY) !== record.owner) {
        throw new Error(`TOCTOU: Secondary-Knoten ersetzt oder verschoben: ${record.name}`);
      }
      resolved.set(record.nodeId, node);
    }
    const variants = /* @__PURE__ */ new Map();
    for (const { definition: definition2 } of secondaryDefinitionsWithGroups2()) for (const contract of definition2.instances) {
      const key = `${contract.setId}\0${contract.variant}`;
      if (!variants.has(key)) variants.set(key, ownedSecondaryVariant(page, contract));
    }
    return { nodes: resolved, variables, variants };
  }
  function applySecondaryContainerContract({ parent, node, contract, maximumWidth = contract.width, resize }) {
    if (node.parent !== parent) parent.appendChild(node);
    node.layoutMode = contract.layoutMode;
    if (node.layoutMode === "NONE") throw new Error(`Secondary Auto Layout fehlt: ${node.name}`);
    node.primaryAxisSizingMode = "FIXED";
    node.counterAxisSizingMode = "FIXED";
    node.primaryAxisAlignItems = "MIN";
    node.counterAxisAlignItems = "MIN";
    node.itemSpacing = contract.itemSpacing;
    node.paddingTop = contract.padding.top;
    node.paddingRight = contract.padding.right;
    node.paddingBottom = contract.padding.bottom;
    node.paddingLeft = contract.padding.left;
    resize(node, Math.min(contract.width, maximumWidth), contract.height);
  }
  function configureSecondaryLayoutRegions(frame, definition2, variables) {
    const regions = /* @__PURE__ */ new Map();
    for (const regionDefinition of definition2.regions) {
      const parent = regionDefinition.parentName === definition2.name ? frame : regions.get(regionDefinition.parentName);
      if (!parent) throw new Error(`Secondary-Elternregion fehlt: ${definition2.name}/${regionDefinition.name}`);
      let region = frame.findOne((node) => node.type === "FRAME" && node.name === regionDefinition.name);
      if (!region) {
        region = figma.createFrame();
        region.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
      }
      if (region.parent !== parent) parent.appendChild(region);
      region.name = regionDefinition.name;
      const maximumWidth = definition2.width === 320 ? parent.width - parent.paddingLeft - parent.paddingRight : regionDefinition.width;
      applySecondaryContainerContract({ parent, node: region, contract: regionDefinition, maximumWidth, resize: resizeNode });
      region.layoutMode = regionDefinition.layoutMode;
      if (region.layoutMode === "NONE") throw new Error(`Secondary Auto Layout fehlt: ${definition2.name}/${region.name}`);
      region.fills = [solid(definition2.theme === "Dark" ? "gray/900" : "gray/000")];
      region.strokes = [solid(definition2.theme === "Dark" ? "gray/700" : "gray/200")];
      region.strokeWeight = 1;
      region.cornerRadius = 0;
      region.effects = [];
      region.visible = true;
      region.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
      region.setPluginData("secondaryRegionContract", JSON.stringify({ width: regionDefinition.width, height: regionDefinition.height }));
      for (const [field, value] of [
        ["itemSpacing", regionDefinition.itemSpacing],
        ["paddingTop", regionDefinition.padding.top],
        ["paddingRight", regionDefinition.padding.right],
        ["paddingBottom", regionDefinition.padding.bottom],
        ["paddingLeft", regionDefinition.padding.left]
      ]) if (value > 0) region.setBoundVariable(field, variables.dimensionByValue.get(value));
      bindSecondaryNodeTheme(region, definition2.theme, variables);
      regions.set(regionDefinition.name, region);
    }
    return regions;
  }
  function configureSecondaryCopy(frame, definition2, decision, regions, variables) {
    const copyByRegion = /* @__PURE__ */ new Map();
    for (const contract of definition2.copyContracts) {
      const parent = regions.get(contract.region);
      let copy = frame.findOne((node) => node.type === "TEXT" && node.name === `Copy / ${contract.role}`);
      if (copy && copy.parent !== parent) parent.appendChild(copy);
      copy = textNode(parent, `Copy / ${contract.role}`, contract.characters, decision, {
        size: contract.kind === "title" ? 21 : 15,
        weight: contract.kind === "title" ? 700 : 400,
        muted: contract.kind !== "title",
        dark: definition2.theme === "Dark",
        width: Math.max(40, parent.width - parent.paddingLeft - parent.paddingRight)
      }).node;
      copy.visible = true;
      copy.setPluginData("role", contract.role);
      bindSecondaryNodeTheme(copy, definition2.theme, variables, contract.kind === "title" ? "color/text" : "color/text-muted");
      const index = copyByRegion.get(contract.region) || 0;
      parent.insertChild(index, copy);
      copyByRegion.set(contract.region, index + 1);
    }
    return copyByRegion;
  }
  function ownedSecondaryVariant(page, contract) {
    const definition2 = COMPONENT_DEFINITIONS.find((component) => component.id === contract.setId);
    const sets = componentSetById(page, contract.setId);
    if (sets.length !== 1 || sets[0].getPluginData(CREATED_MARKER_KEY) !== PLUGIN_ORIGIN) throw new Error(`Secondary Component Set fehlt oder ist mehrdeutig: ${(definition2 == null ? void 0 : definition2.name) || contract.setId}`);
    const matches = sets[0].children.filter((node) => node.name === contract.variant);
    if (matches.length !== 1 || matches[0].type !== "COMPONENT" || matches[0].getPluginData(CREATED_MARKER_KEY) !== PLUGIN_ORIGIN) {
      throw new Error(`Secondary Variante fehlt oder ist mehrdeutig: ${definition2.name}/${contract.variant}`);
    }
    return matches[0];
  }
  async function applySecondaryInstanceContract({ parent, instance, variant, contract, definition: definition2, readIdentity, loadFonts, resize, bindTheme }) {
    const parentContentWidth = Number.isFinite(parent.width) ? parent.width - (parent.paddingLeft || 0) - (parent.paddingRight || 0) : contract.expectedWidth;
    const availableWidth = definition2.width === 320 ? Math.min(definition2.width - 32, parentContentWidth) : contract.expectedWidth;
    if (definition2.width === 320 && Number.isFinite(contract.minimumWidth) && contract.minimumWidth > availableWidth) {
      throw new Error(`Secondary-Mindestbreite \xFCberschreitet verf\xFCgbaren Inhalt: ${contract.name} (${contract.minimumWidth}px > ${availableWidth}px)`);
    }
    const identity = await readIdentity(instance);
    if (identity.id !== variant.id) instance.swapComponent(variant);
    await loadFonts();
    if (instance.parent !== parent) parent.appendChild(instance);
    instance.name = contract.name;
    const labelKey = Object.keys(instance.componentProperties || {}).find((key) => key.split("#")[0] === "Label");
    if (!labelKey) throw new Error(`Label-Property fehlt: ${contract.name}`);
    instance.setProperties({ [labelKey]: contract.label });
    for (const [role, characters] of Object.entries(contract.roleCopy)) {
      const roleNode = instance.findOne((node) => node.type === "TEXT" && node.name === `Role/${role}`);
      if (!roleNode) throw new Error(`Textrolle fehlt: ${contract.name}/Role/${role}`);
      roleNode.characters = characters;
    }
    const width = Math.min(contract.expectedWidth, availableWidth);
    const height = Math.max(definition2.width === 320 ? 44 : 0, contract.expectedHeight);
    resize(instance, width, height);
    bindTheme(instance, definition2.theme);
    return instance;
  }
  async function ensureSecondaryVariantInstance(parent, variant, contract, definition2, decision, variables, root) {
    let instance = root.findOne((node) => node.type === "INSTANCE" && node.name === contract.name);
    if (!instance) instance = variant.createInstance();
    const component = COMPONENT_DEFINITIONS.find((candidate) => candidate.id === contract.setId);
    const variantDefinition = component == null ? void 0 : component.variants.find((candidate) => candidate.name === contract.variant);
    if (!variantDefinition) throw new Error(`Secondary Variantenvertrag fehlt: ${contract.setId}/${contract.variant}`);
    await applySecondaryInstanceContract({
      parent,
      instance,
      variant,
      contract,
      definition: definition2,
      readIdentity: readMainComponentIdentity,
      loadFonts: () => loadDecisionFonts(decision),
      resize: resizeNode,
      bindTheme: (node) => bindSecondaryNodeTheme(node, definition2.theme, variables, variantDefinition.textToken, variantDefinition.surfaceToken)
    });
    instance.visible = true;
    instance.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    instance.setPluginData("ondaDocumentationInstance", "");
    instance.setPluginData("ondaRepeatedScreenInstance", "true");
    for (const role of Object.keys(contract.roleCopy)) {
      const roleNode = instance.findOne((node) => node.type === "TEXT" && node.name === `Role/${role}`);
      if (!roleNode) throw new Error(`Textrolle fehlt: ${contract.name}/Role/${role}`);
      roleNode.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    }
    return instance;
  }
  function positionSecondaryInstance(instance, contract, definition2, region) {
    const regionContentWidth = region.width - region.paddingLeft - region.paddingRight;
    const availableWidth = definition2.width === 320 ? Math.min(definition2.width - 32, regionContentWidth) : regionContentWidth;
    const width = Math.min(contract.expectedWidth, availableWidth);
    const height = Math.max(definition2.width === 320 ? 44 : 0, contract.expectedHeight);
    resizeNode(instance, width, contract.expectedHeight);
    if (height !== contract.expectedHeight) resizeNode(instance, width, height);
  }
  function secondarySectionLayout(definitions, start = 100, gap = 76, bottom = 100) {
    let y = start;
    const positions = definitions.map((definition2) => {
      const position = { name: definition2.name, y, height: definition2.height };
      y += definition2.height + gap;
      return position;
    });
    const last = positions[positions.length - 1];
    return { positions, height: last ? last.y + last.height + bottom : start + bottom };
  }
  async function runSecondaryViews(page, ledger, writeBarrierInventory, resolved) {
    var _a;
    const { nodes, variables, variants } = resolved;
    const recoveryActions = buildSecondaryViewRecoveryActions(writeBarrierInventory);
    const sectionRecords = new Map((writeBarrierInventory.sections || []).map((record) => [record.name, record]));
    const viewRecords = new Map((writeBarrierInventory.views || []).map((record) => [record.name, record]));
    const sectionLayouts = new Map(SECONDARY_SECTION_NAMES2.map((sectionName) => [
      sectionName,
      secondarySectionLayout(secondaryDefinitionsWithGroups2().filter(({ definition: definition2 }) => definition2.sectionName === sectionName).map(({ definition: definition2 }) => definition2))
    ]));
    const positionByViewName = new Map([...sectionLayouts.values()].flatMap((layout) => layout.positions.map((position) => [position.name, position])));
    for (const { group, definition: definition2 } of secondaryDefinitionsWithGroups2()) {
      const sectionRecord = sectionRecords.get(definition2.sectionName);
      const section = sectionRecord ? nodes.get(sectionRecord.nodeId) : ensureSection(page, ledger, definition2.sectionName, 1800).node;
      const viewRecord = viewRecords.get(definition2.name);
      let frame = viewRecord ? nodes.get(viewRecord.nodeId) : null;
      if (!frame) {
        frame = figma.createFrame();
        frame.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
        section.appendChild(frame);
      }
      frame.name = definition2.name;
      frame.layoutMode = definition2.layoutMode;
      if (frame.layoutMode === "NONE") throw new Error(`Secondary Auto Layout fehlt: ${definition2.name}`);
      frame.primaryAxisSizingMode = "FIXED";
      frame.counterAxisSizingMode = "FIXED";
      frame.primaryAxisAlignItems = "MIN";
      frame.counterAxisAlignItems = "MIN";
      frame.itemSpacing = 0;
      const narrow = definition2.width === 320;
      frame.paddingTop = narrow ? 16 : 0;
      frame.paddingRight = narrow ? 16 : 0;
      frame.paddingBottom = narrow ? 16 : 0;
      frame.paddingLeft = narrow ? 16 : 0;
      frame.x = 80;
      frame.y = positionByViewName.get(definition2.name).y;
      resizeNode(frame, definition2.width, definition2.height);
      frame.fills = [solid(definition2.theme === "Dark" ? "gray/900" : "gray/000")];
      frame.strokes = [solid(definition2.theme === "Dark" ? "gray/700" : "gray/200")];
      frame.strokeWeight = 1;
      frame.effects = [];
      frame.cornerRadius = 0;
      frame.clipsContent = false;
      frame.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
      frame.setPluginData("secondaryView", JSON.stringify({
        group,
        theme: definition2.theme,
        subject: definition2.subject || null,
        breakpoint: (_a = definition2.breakpoint) != null ? _a : null
      }));
      const regions = configureSecondaryLayoutRegions(frame, definition2, variables);
      const copyByRegion = configureSecondaryCopy(frame, definition2, ledger.fontDecision, regions, variables);
      const instanceByRegion = /* @__PURE__ */ new Map();
      for (const contract of definition2.instances) {
        const parent = regions.get(contract.region);
        const variant = variants.get(`${contract.setId}\0${contract.variant}`);
        const instance = await ensureSecondaryVariantInstance(parent, variant, contract, definition2, ledger.fontDecision, variables, frame);
        positionSecondaryInstance(instance, contract, definition2, parent);
        const localIndex = instanceByRegion.get(contract.region) || 0;
        parent.insertChild((copyByRegion.get(contract.region) || 0) + localIndex, instance);
        instanceByRegion.set(contract.region, localIndex + 1);
      }
      bindSecondaryNodeTheme(frame, definition2.theme, variables, "color/text", "color/surface", false);
    }
    for (const legacy of writeBarrierInventory.legacyViews || []) {
      const node = nodes.get(legacy.nodeId);
      if (node) node.visible = false;
      for (const child of legacy.legacyChildren || []) {
        const childNode = nodes.get(child.nodeId);
        if (childNode) childNode.visible = false;
      }
    }
    for (const sectionName of SECONDARY_SECTION_NAMES2) {
      const section = directChild(page, sectionName, ["SECTION"]);
      resizeNode(section, SECTION_WIDTH, sectionLayouts.get(sectionName).height);
    }
    return {
      sections: SECONDARY_SECTION_NAMES2.length,
      agentSourceViews: SECONDARY_VIEW_DEFINITIONS.agentSources.length,
      secondaryViews: SECONDARY_VIEW_DEFINITIONS.secondary.length,
      responsiveViews: SECONDARY_VIEW_DEFINITIONS.responsive.length,
      totalViews: secondaryDefinitionsWithGroups2().length,
      recoveryActions: recoveryActions.length
    };
  }
  async function runDialogsAndSecondary(page, ledger, writeBarrierInventory, resolvedInventoryNodes) {
    return runSecondaryViews(page, ledger, writeBarrierInventory, resolvedInventoryNodes);
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
  async function currentBaselineEvidence(page, ledger) {
    const baselineRecords = readBaselineRecords(page, ledger);
    const baselineIdsInOrder = baselineRecords.map((record) => record.id);
    const baselineIds = new Set(baselineIdsInOrder);
    const records = orderRecordsByBaselineIds(await collectRecordsFromDocument(baselineIds), baselineIdsInOrder);
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
    var _a, _b, _c;
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
          owner: consumer.node.getPluginData(CREATED_MARKER_KEY),
          componentId: ((_c = consumer.node.parent) == null ? void 0 : _c.type) === "COMPONENT_SET" ? consumer.node.parent.getPluginData("ondaComponentId") : "",
          cornerRadius: typeof consumer.node.cornerRadius === "number" ? consumer.node.cornerRadius : null,
          effectStyleId: await readEffectStyleId(consumer.node),
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
  function componentPaintEvidence(paints) {
    return collectVisibleFillBindings(paints).map((binding) => {
      var _a;
      return __spreadProps(__spreadValues({}, binding), {
        color: cloneSerializable((_a = paints == null ? void 0 : paints[binding.index]) == null ? void 0 : _a.color)
      });
    });
  }
  async function collectComponentEvidence(page) {
    const definitionsByName = new Map(COMPONENT_DEFINITIONS.map((definition2) => [definition2.name, definition2]));
    const locations = collectComponentSectionCandidates(page);
    const candidates = locations.candidates;
    const sampleNames = new Set(COMPONENT_DEFINITIONS.map((definition2) => `${definition2.name} / Dokumentationsinstanz`));
    const setCandidates = candidates.filter(({ node }) => !sampleNames.has(node.name));
    const evidence = [];
    for (const location of setCandidates) {
      const { node: set, parentId, parentType, parentName } = location;
      const definition2 = definitionsByName.get(set.name);
      const variants = !("children" in set) ? [] : await Promise.all(set.children.map(async (component) => ({
        nodeId: component.id,
        name: component.name,
        owner: component.getPluginData(CREATED_MARKER_KEY),
        type: component.type,
        parentId: set.id,
        parentType: set.type,
        parentName: set.name,
        layoutMode: component.layoutMode,
        width: component.width,
        height: component.height,
        cornerRadius: component.cornerRadius,
        strokeWeight: component.strokeWeight,
        opacity: component.opacity,
        fills: componentPaintEvidence(component.fills),
        strokes: componentPaintEvidence(component.strokes),
        effects: cloneSerializable(component.effects),
        effectStyleId: await readEffectStyleId(component),
        fieldVariableIds: collectFieldVariableIds(component, [
          "itemSpacing",
          "paddingTop",
          "paddingLeft",
          "paddingRight",
          "paddingBottom",
          "topLeftRadius",
          "topRightRadius",
          "bottomLeftRadius",
          "bottomRightRadius"
        ]),
        dimensionValues: {
          itemSpacing: component.itemSpacing,
          paddingTop: component.paddingTop,
          paddingRight: component.paddingRight,
          paddingBottom: component.paddingBottom,
          paddingLeft: component.paddingLeft,
          minHeight: component.minHeight
        },
        roles: !("children" in component) ? [] : component.children.map((role) => {
          var _a;
          return {
            nodeId: role.id,
            name: role.name,
            owner: role.getPluginData(CREATED_MARKER_KEY),
            type: role.type,
            parentId: component.id,
            parentType: component.type,
            parentName: component.name,
            characters: role.type === "TEXT" ? role.characters : null,
            width: role.width,
            height: role.height,
            fills: componentPaintEvidence(role.fills),
            effects: cloneSerializable(role.effects),
            fieldVariableIds: collectFieldVariableIds(role, ["maxWidth", "maxHeight"]),
            characterPropertyKey: role.type === "TEXT" ? ((_a = role.componentPropertyReferences) == null ? void 0 : _a.characters) || null : null
          };
        })
      })));
      const sampleName = `${set.name} / Dokumentationsinstanz`;
      const samples = candidates.filter(({ node }) => node.name === sampleName);
      const sampleCandidate = samples.length === 1 ? samples[0] : null;
      const identity = (sampleCandidate == null ? void 0 : sampleCandidate.node.type) === "INSTANCE" ? await readMainComponentIdentity(sampleCandidate.node) : { id: null };
      evidence.push({
        id: (definition2 == null ? void 0 : definition2.id) || "",
        nodeId: set.id,
        name: set.name,
        owner: set.getPluginData(CREATED_MARKER_KEY),
        type: set.type,
        parentId,
        parentType,
        parentName,
        containerId: location.containerId,
        containerType: location.containerType,
        containerName: location.containerName,
        containerOwner: location.containerOwner,
        containerParentId: location.containerParentId,
        containerParentType: location.containerParentType,
        containerParentName: location.containerParentName,
        layoutMode: set.layoutMode,
        effects: cloneSerializable(set.effects),
        componentProperties: componentPropertyInventory(set),
        variants,
        sampleCount: samples.length,
        sample: sampleCandidate ? {
          nodeId: sampleCandidate.node.id,
          name: sampleCandidate.node.name,
          owner: sampleCandidate.node.getPluginData(CREATED_MARKER_KEY),
          type: sampleCandidate.node.type,
          parentId: sampleCandidate.parentId,
          parentType: sampleCandidate.parentType,
          parentName: sampleCandidate.parentName,
          containerId: sampleCandidate.containerId,
          containerType: sampleCandidate.containerType,
          containerName: sampleCandidate.containerName,
          containerOwner: sampleCandidate.containerOwner,
          containerParentId: sampleCandidate.containerParentId,
          containerParentType: sampleCandidate.containerParentType,
          containerParentName: sampleCandidate.containerParentName,
          mainComponentId: identity.id,
          documentation: sampleCandidate.node.getPluginData("ondaDocumentationInstance") === "true",
          repeatedScreen: sampleCandidate.node.getPluginData("ondaRepeatedScreenInstance") === "true",
          effects: cloneSerializable(sampleCandidate.node.effects)
        } : null
      });
    }
    return {
      componentSets: evidence,
      targetPage: locations.targetPage,
      containers: locations.containers.map((_a) => {
        var _b = _a, { node: _node } = _b, container = __objRest(_b, ["node"]);
        return container;
      })
    };
  }
  async function collectCoreViewEvidence(page) {
    const inventory = await collectCoreViewMutationInventory(page);
    const usedIds = new Set(CORE_VIEW_DEFINITIONS.flatMap((definition2) => definition2.instances.map((instance) => instance.setId)));
    const definitionsByName = new Map(COMPONENT_DEFINITIONS.filter((definition2) => usedIds.has(definition2.id)).map((definition2) => [definition2.name, definition2]));
    const componentSection = directChild(page, "02 \xB7 Komponenten", ["SECTION"]);
    const components = ((componentSection == null ? void 0 : componentSection.children) || []).filter((node) => node.type === "COMPONENT_SET" && (usedIds.has(node.getPluginData("ondaComponentId")) || definitionsByName.has(node.name))).map((set) => ({
      id: set.getPluginData("ondaComponentId"),
      nodeId: set.id,
      name: set.name,
      type: set.type,
      owner: set.getPluginData(CREATED_MARKER_KEY),
      variants: [...set.children].filter((node) => node.type === "COMPONENT").map((variant) => ({
        nodeId: variant.id,
        name: variant.name,
        type: variant.type,
        owner: variant.getPluginData(CREATED_MARKER_KEY)
      }))
    }));
    return {
      targetPage: inventory.targetPage,
      sections: inventory.sections,
      overview: inventory.overview,
      views: inventory.views,
      components
    };
  }
  async function collectSecondaryViewEvidence(page) {
    const definitionEntries = secondaryDefinitionsWithGroups2();
    const modernNames = new Set(definitionEntries.map(({ definition: definition2 }) => definition2.name));
    const hasModernEvidence = page.findAll((node) => modernNames.has(node.name) || Boolean(node.getPluginData("secondaryView"))).length > 0;
    if (!hasModernEvidence) return void 0;
    const evidence = await collectSecondaryViewMutationInventory(page);
    const records = [
      evidence.targetPage,
      ...evidence.sections,
      ...evidence.views.flatMap((view) => [
        view,
        ...view.layoutRegions || [],
        ...view.copyNodes || [],
        ...(view.instances || []).flatMap((instance) => [
          instance,
          ...(instance.roleDescendants || []).flatMap((role) => [role, ...role.ancestorChain || []])
        ]),
        ...view.standIns || []
      ])
    ];
    const nodeById = /* @__PURE__ */ new Map();
    function indexNode(node) {
      nodeById.set(node.id, node);
      if ("children" in node) for (const child of node.children) indexNode(child);
    }
    indexNode(page);
    const effectStyleIdByNodeId = /* @__PURE__ */ new Map();
    await Promise.all([...new Set(records.map((record) => record == null ? void 0 : record.nodeId).filter(Boolean))].map(async (nodeId) => {
      const node = nodeById.get(nodeId);
      effectStyleIdByNodeId.set(nodeId, node ? await readEffectStyleId(node) : null);
    }));
    for (const record of records) {
      if (!(record == null ? void 0 : record.nodeId)) continue;
      const node = nodeById.get(record.nodeId);
      if (!node) continue;
      record.x = "x" in node ? node.x : null;
      record.y = "y" in node ? node.y : null;
      record.width = "width" in node ? node.width : null;
      record.height = "height" in node ? node.height : null;
      record.bounds = "x" in node ? { x: node.x, y: node.y, width: node.width, height: node.height } : null;
      record.absoluteBounds = cloneSerializable(node.absoluteBoundingBox || node.absoluteRenderBounds || null);
      record.childIds = "children" in node ? node.children.map((child) => child.id) : [];
      record.childCount = record.childIds.length;
      record.effectStyleId = effectStyleIdByNodeId.get(record.nodeId) || null;
    }
    const requiredCollectionNames = /* @__PURE__ */ new Set(["Onda \xB7 Semantic \xB7 Light", "Onda \xB7 Semantic \xB7 Dark", "Onda \xB7 Dimension"]);
    const requiredSemanticNames = /* @__PURE__ */ new Set(["color/border", ...secondaryRequiredTextTokens(), ...secondaryRequiredSurfaceTokens()]);
    const requiredVariableNamesByCollection = /* @__PURE__ */ new Map([
      ["Onda \xB7 Semantic \xB7 Light", requiredSemanticNames],
      ["Onda \xB7 Semantic \xB7 Dark", requiredSemanticNames],
      ["Onda \xB7 Dimension", new Set(definitionEntries.flatMap(({ definition: definition2 }) => definition2.regions.flatMap((region) => [
        region.itemSpacing,
        region.padding.top,
        region.padding.right,
        region.padding.bottom,
        region.padding.left
      ])).filter((value) => value > 0).map((value) => `spacing/${value}`))]
    ]);
    const localCollections = await figma.variables.getLocalVariableCollectionsAsync();
    const collections = localCollections.filter((collection) => requiredCollectionNames.has(collection.name)).map((collection) => ({
      id: collection.id,
      name: collection.name,
      owner: collection.getSharedPluginData("onda", "owner")
    }));
    const collectionById = new Map(collections.map((collection) => [collection.id, collection]));
    const variables = (await figma.variables.getLocalVariablesAsync()).flatMap((variable) => {
      var _a;
      const collection = collectionById.get(variable.variableCollectionId);
      if (!collection || !((_a = requiredVariableNamesByCollection.get(collection.name)) == null ? void 0 : _a.has(variable.name))) return [];
      return [{
        id: variable.id,
        nodeId: variable.id,
        name: variable.name,
        owner: variable.getSharedPluginData("onda", "owner"),
        collectionId: collection.id,
        collectionName: collection.name
      }];
    });
    const effectStyles = (await figma.getLocalEffectStylesAsync()).filter((style) => style.getSharedPluginData("onda", "owner") === PLUGIN_ORIGIN || style.name === "Onda/Shadow/Overlay").map((style) => ({
      id: style.id,
      name: style.name,
      owner: style.getSharedPluginData("onda", "owner"),
      effects: cloneSerializable(style.effects)
    }));
    return __spreadProps(__spreadValues({}, evidence), { collections, variables, effectStyles });
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
    const componentEvidence = await collectComponentEvidence(page);
    const coreViewEvidence = await collectCoreViewEvidence(page);
    const secondaryViewEvidence = await collectSecondaryViewEvidence(page);
    const componentSets = componentEvidence.componentSets;
    const baseline = await currentBaselineEvidence(page, ledger);
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
    const report = buildVerificationReport(__spreadProps(__spreadValues(__spreadProps(__spreadValues({
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
      componentTargetPage: componentEvidence.targetPage,
      componentContainers: componentEvidence.containers,
      coreViews: coreViewEvidence
    }, secondaryViewEvidence === void 0 ? {} : { secondaryViews: secondaryViewEvidence }), {
      instanceCount: allNodes.filter((node) => node.type === "INSTANCE" && node.getPluginData("ondaDocumentationInstance") !== "true").length,
      documentationInstanceCount: allNodes.filter((node) => node.type === "INSTANCE" && node.getPluginData("ondaDocumentationInstance") === "true").length,
      repeatedScreenInstanceCount: allNodes.filter((node) => node.type === "INSTANCE" && node.getPluginData("ondaRepeatedScreenInstance") === "true").length,
      foundation: __spreadValues({
        paintsValid: paints.every(isGrayColor),
        radiiValid: radii.every((radius) => isValidRadius(radius.value, radius.geometry)),
        effectsValid,
        fontsValid: fontStylesValid,
        docsBound: foundationNodes.length > 0 && foundationNodes.every((node) => node.getPluginData("ondaFoundationBound") === "true")
      }, foundationEvidence)
    }), geometry), {
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
    var _a, _b, _c, _d, _e, _f, _g;
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
    async function runMutation({ page, ledger }, validatedInventory = null, resolvedInventoryNodes = null) {
      const transition = validatePhaseTransition(command, ledger.phases);
      if (!transition.ok) throw new Error(transition.warning);
      let counts;
      if (command === "foundations") counts = await runFoundations(page, ledger);
      else if (command === "core-views") counts = await runCoreViews(page, ledger, validatedInventory, resolvedInventoryNodes);
      else if (command === "dialogs-and-secondary") counts = await runDialogsAndSecondary(page, ledger, validatedInventory, resolvedInventoryNodes);
      else if (command.startsWith("component-")) counts = await runComponent(page, ledger, command.slice("component-".length), validatedInventory);
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
    if (command.startsWith("component-")) {
      const componentId = command.slice("component-".length);
      const phases = ((_e = readLedger(figma.currentPage)) == null ? void 0 : _e.phases) || {};
      await executeGuardedComponentCommand({
        command,
        phases,
        preflight: () => preflightComponentMutation(componentId),
        requireContext: requireMutationContext,
        collectCurrentInventory: () => collectComponentMutationInventory(componentId),
        mutate: runMutation
      });
      return;
    }
    if (command === "core-views") {
      const phases = ((_f = readLedger(figma.currentPage)) == null ? void 0 : _f.phases) || {};
      await executeGuardedCoreViewCommand({
        command,
        phases,
        preflight: preflightCoreViewMutation,
        requireContext: requireMutationContext,
        collectCurrentInventory: ({ page }) => collectCoreViewMutationInventory(page),
        resolveInventoryNodes: async ({ page, ledger }, inventory) => {
          await loadDecisionFonts(ledger.fontDecision);
          return resolveCoreInventoryNodes(inventory, page);
        },
        mutate: runMutation
      });
      return;
    }
    if (command === "dialogs-and-secondary") {
      const phases = ((_g = readLedger(figma.currentPage)) == null ? void 0 : _g.phases) || {};
      await executeGuardedSecondaryViewCommand({
        command,
        phases,
        preflight: preflightSecondaryViewMutation,
        requireContext: requireMutationContext,
        collectCurrentInventory: ({ page }) => collectSecondaryViewMutationInventory(page),
        resolveInventoryNodes: resolveSecondaryInventoryNodes,
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
