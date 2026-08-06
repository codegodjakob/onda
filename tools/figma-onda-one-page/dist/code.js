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

  // app/src/annotation-contract.mjs
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

  // tools/figma-onda-one-page/src/definitions.mjs
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
  var TYPE_SCALE = Object.freeze([
    Object.freeze({ size: 12, lineHeight: 16 }),
    Object.freeze({ size: 15, lineHeight: 22 }),
    Object.freeze({ size: 21, lineHeight: 28 }),
    Object.freeze({ size: 40, lineHeight: 44 })
  ]);
  var TYPE_WEIGHTS = Object.freeze([400, 500, 700]);
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

  // tools/figma-onda-one-page/src/plan.mjs
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
    const maxExistingRight = children.reduce((max, child) => {
      const right = Number(child.x || 0) + Number(child.width || 0);
      return Math.max(max, right);
    }, 0);
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
      ok: true,
      fallback: true,
      warning: "Dateischl\xFCssel nicht verf\xFCgbar; Ziel \xFCber \u201EClaude Code\u201C und \u201EPage 1\u201C gepr\xFCft."
    };
  }
  function canReuseOwnedNode(node, baselineIds = /* @__PURE__ */ new Set()) {
    return (node == null ? void 0 : node.owner) === PLUGIN_ORIGIN && (!baselineIds.has(node.id) || node.owner === PLUGIN_ORIGIN);
  }
  function protectedChildIds({ nodeType, children, baselineIds = /* @__PURE__ */ new Set() }) {
    if (nodeType !== "PAGE") return children.map((child) => child.id);
    return children.filter((child) => baselineIds.has(child.id) || child.owner !== PLUGIN_ORIGIN).map((child) => child.id);
  }
  function isGrayColor(color2) {
    if (!color2 || ![color2.r, color2.g, color2.b].every(Number.isFinite)) return false;
    return color2.r === color2.g && color2.g === color2.b;
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
    const requiredNames = new Set(SECTION_DEFINITIONS.map((section) => section.name));
    const presentNames = new Set(snapshot.sectionNames || []);
    return {
      pageCount: Number(snapshot.pageCount || 0),
      sectionCount: (snapshot.sectionNames || []).length,
      missingSections: [...requiredNames].filter((name) => !presentNames.has(name)),
      annotationCount: new Set(snapshot.annotationKinds || []).size,
      dialogFamilyCount: new Set(snapshot.dialogFamilies || []).size,
      nonGrayPaints: (snapshot.paints || []).filter((color2) => !isGrayColor(color2)).length,
      invalidRadii: (snapshot.radii || []).filter((radius) => !isValidRadius(radius.value, radius.geometry)).length,
      duplicateNames: duplicates(snapshot.topLevelNames || []),
      preservedBaselineTopLevelCount: Math.min(
        Number(snapshot.baselineTopLevelCount || 0),
        Number(snapshot.preservedTopLevelCount || 0)
      ),
      preservedBaselineHash: Boolean(snapshot.baselineHash) && snapshot.baselineHash === snapshot.currentBaselineHash && (snapshot.baselineMismatches || []).length === 0,
      baselineMismatches: snapshot.baselineMismatches || [],
      pageInvariant: hashBaselineRecords(snapshot.baselinePages || []) === hashBaselineRecords(snapshot.currentPages || [])
    };
  }

  // tools/figma-onda-one-page/src/runtime.mjs
  var SECTION_WIDTH = 2100;
  var SECTION_CELL_WIDTH = 2400;
  var SECTION_CELL_HEIGHT = 11e3;
  var SECTION_COLUMNS = 3;
  var CREATED_MARKER_KEY = "ondaOrigin";
  var lastInspection = null;
  figma.showUI(__html__, { width: 420, height: 720, themeColors: true });
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
  function fontStyleForWeight(fonts, family, weight) {
    const preferences = weight === 400 ? ["Regular", "Book", "Normal"] : weight === 500 ? ["Medium", "Semi Medium", "Regular"] : ["Bold", "Semi Bold", "Semibold", "Medium"];
    const styles = fonts.filter((font) => font.fontName.family === family).map((font) => font.fontName.style);
    return preferences.find((style) => styles.includes(style)) || styles[0] || null;
  }
  function inspectFonts(fonts) {
    var _a;
    const exactFamily = fonts.some((font) => font.fontName.family === "ABC Diatype");
    const family = exactFamily ? "ABC Diatype" : fonts.some((font) => font.fontName.family === "Inter") ? "Inter" : (_a = fonts[0]) == null ? void 0 : _a.fontName.family;
    if (!family) throw new Error("Keine verwendbare Schrift in Figma gefunden.");
    const styles = Object.fromEntries(TYPE_WEIGHTS.map((weight) => [weight, fontStyleForWeight(fonts, family, weight)]));
    if (Object.values(styles).some((style) => !style)) throw new Error(`Keine vollst\xE4ndigen Schriftschnitte f\xFCr ${family} gefunden.`);
    const warning = exactFamily ? "" : `ABC Diatype ist nicht verf\xFCgbar. Sichtbarer System-Fallback: ${family}.`;
    return { requestedFamily: "ABC Diatype", family, styles, exact: exactFamily, warning };
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
    const topLevelIds = ledger ? ledger.baseline.topLevelIds : page.children.map((node) => node.id);
    const result = {
      target,
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
        nodeHashes: records.map((record) => ({ id: record.id, hash: hashBaselineRecords([record]) })),
        nodeIds: records.map((record) => record.id),
        topLevelIds,
        topLevelCount: topLevelIds.length,
        pages: pageInvariantSnapshot()
      }
    };
    lastInspection = result;
    return result;
  }
  function inspectionMessage(inspection) {
    const targetText = inspection.target.ok ? `Ziel gepr\xFCft: ${inspection.documentName} \xB7 ${inspection.pageName}.` : inspection.target.warning;
    const fontText = inspection.fontDecision.warning || "ABC Diatype mit exakten Schnitten verf\xFCgbar.";
    return `${targetText} ${inspection.target.warning && inspection.target.ok ? inspection.target.warning : ""} ${fontText}`.trim();
  }
  async function requireMutationContext() {
    const inspection = lastInspection || await inspectCurrentTarget();
    if (!inspection.target.ok) throw new Error(inspection.target.warning);
    const page = figma.currentPage;
    let ledger = readLedger(page);
    if (!ledger) {
      const baseline = inspection.pendingBaseline;
      if (!baseline) throw new Error("Inspect muss vor der ersten Mutation erneut ausgef\xFChrt werden.");
      const origin = computeOndaOrigin(page.children);
      ledger = {
        version: 1,
        origin: { x: origin, y: 0 },
        target: {
          fileKey: figma.fileKey || null,
          documentName: figma.root.name,
          pageId: page.id,
          pageName: page.name,
          fallback: inspection.target.fallback
        },
        fontDecision: inspection.fontDecision,
        baseline: {
          hash: baseline.hash,
          nodeHashes: baseline.nodeHashes,
          nodeIds: baseline.nodeIds,
          topLevelIds: baseline.topLevelIds,
          topLevelCount: baseline.topLevelCount,
          pages: baseline.pages
        },
        phases: {},
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      writeLedger(page, ledger);
    }
    if (ledger.target.pageId !== page.id || ledger.target.pageName !== TARGET_PAGE_NAME) {
      throw new Error("Das gespeicherte Onda-Ledger geh\xF6rt nicht zur aktuellen Page 1.");
    }
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
      }, new Set(ledger.baseline.nodeIds));
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
    if (existing) return { node: existing, created: false };
    const frame = figma.createFrame();
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
    parent.appendChild(frame);
    if (Number.isFinite(options.x)) frame.x = options.x;
    if (Number.isFinite(options.y)) frame.y = options.y;
    frame.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN);
    return { node: frame, created: true };
  }
  async function loadDecisionFonts(decision) {
    const fontNames = TYPE_WEIGHTS.map((weight) => ({ family: decision.family, style: decision.styles[weight] }));
    const unique = [...new Map(fontNames.map((font) => [`${font.family}/${font.style}`, font])).values()];
    await Promise.all(unique.map((font) => figma.loadFontAsync(font)));
  }
  function textNode(parent, name, characters, decision, options = {}) {
    const existing = directChild(parent, name, ["TEXT"]);
    if (existing) return { node: existing, created: false };
    const text = figma.createText();
    text.name = name;
    const weight = options.weight || 400;
    text.fontName = { family: decision.family, style: decision.styles[weight] };
    text.fontSize = options.size || 15;
    const scale = TYPE_SCALE.find((item) => item.size === text.fontSize);
    text.lineHeight = { unit: "PIXELS", value: (scale == null ? void 0 : scale.lineHeight) || Math.round(text.fontSize * 1.45) };
    text.characters = characters;
    text.fills = [solid(options.dark ? "gray/000" : options.muted ? "gray/500" : "gray/900")];
    parent.appendChild(text);
    if (options.width) {
      text.textAutoResize = "HEIGHT";
      text.resize(options.width, Math.max(text.height, 16));
    }
    return { node: text, created: true };
  }
  function heading(parent, title, decision, subtitle = "") {
    textNode(parent, `${title} / Titel`, title, decision, { size: 40, weight: 700, width: 1500 });
    if (subtitle) textNode(parent, `${title} / Untertitel`, subtitle, decision, { size: 15, muted: true, width: 1500 });
  }
  async function ensureCollection(name, modeName) {
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const existing = collections.find((collection2) => collection2.name === name);
    if (existing) return { collection: existing, modeId: existing.modes[0].modeId, created: false };
    const collection = figma.variables.createVariableCollection(name);
    collection.renameMode(collection.modes[0].modeId, modeName);
    return { collection, modeId: collection.modes[0].modeId, created: true };
  }
  async function ensureVariable(collection, modeId, definition2) {
    const variables = await figma.variables.getLocalVariablesAsync();
    const existing = variables.find((variable2) => variable2.variableCollectionId === collection.id && variable2.name === definition2.name);
    if (existing) return { variable: existing, created: false };
    const variable = figma.variables.createVariable(definition2.name, collection, definition2.type);
    variable.setValueForMode(modeId, definition2.value);
    if (definition2.type !== "BOOLEAN") variable.scopes = definition2.scopes || [];
    variable.setVariableCodeSyntax("WEB", `var(${definition2.css})`);
    return { variable, created: true };
  }
  async function createFoundationVariables() {
    const primitiveInfo = await ensureCollection("Onda \xB7 Primitive", "Value");
    const dimensionInfo = await ensureCollection("Onda \xB7 Dimension", "Value");
    const lightInfo = await ensureCollection("Onda \xB7 Semantic \xB7 Light", "Light");
    const darkInfo = await ensureCollection("Onda \xB7 Semantic \xB7 Dark", "Dark");
    const typographyInfo = await ensureCollection("Onda \xB7 Typography", "Value");
    const created = [];
    const primitiveByName = {};
    for (const [name, value] of Object.entries(PALETTE)) {
      const result = await ensureVariable(primitiveInfo.collection, primitiveInfo.modeId, {
        name,
        type: "COLOR",
        value,
        scopes: [],
        css: `--onda-${name.replace("/", "-")}`
      });
      primitiveByName[name] = result.variable;
      if (result.created) created.push(result.variable.id);
    }
    const semanticRoles = [
      { name: "color/background", light: "gray/025", dark: "gray/1000", scopes: ["FRAME_FILL", "SHAPE_FILL"] },
      { name: "color/surface", light: "gray/000", dark: "gray/900", scopes: ["FRAME_FILL", "SHAPE_FILL"] },
      { name: "color/text", light: "gray/900", dark: "gray/000", scopes: ["TEXT_FILL"] },
      { name: "color/text-muted", light: "gray/500", dark: "gray/300", scopes: ["TEXT_FILL"] },
      { name: "color/border", light: "gray/200", dark: "gray/700", scopes: ["STROKE_COLOR"] },
      { name: "color/inverted", light: "gray/900", dark: "gray/000", scopes: ["FRAME_FILL", "SHAPE_FILL"] },
      { name: "color/on-inverted", light: "gray/000", dark: "gray/900", scopes: ["TEXT_FILL"] }
    ];
    for (const role of semanticRoles) {
      for (const [info, primitiveName, suffix] of [
        [lightInfo, role.light, "light"],
        [darkInfo, role.dark, "dark"]
      ]) {
        const result = await ensureVariable(info.collection, info.modeId, {
          name: role.name,
          type: "COLOR",
          value: figma.variables.createVariableAlias(primitiveByName[primitiveName]),
          scopes: role.scopes,
          css: `--onda-${role.name.replaceAll("/", "-")}-${suffix}`
        });
        if (result.created) created.push(result.variable.id);
      }
    }
    const dimensions = [
      ...[4, 8, 12, 16, 24, 32, 40].map((value) => ({ name: `spacing/${value}`, value, scope: "GAP" })),
      ...RADIUS_TOKENS.map((token) => ({ name: token.name, value: token.value, scope: "CORNER_RADIUS" }))
    ];
    for (const item of dimensions) {
      const result = await ensureVariable(dimensionInfo.collection, dimensionInfo.modeId, {
        name: item.name,
        type: "FLOAT",
        value: item.value,
        scopes: [item.scope],
        css: `--onda-${item.name.replaceAll("/", "-")}`
      });
      if (result.created) created.push(result.variable.id);
    }
    for (const item of TYPE_SCALE) {
      const result = await ensureVariable(typographyInfo.collection, typographyInfo.modeId, {
        name: `font-size/${item.size}`,
        type: "FLOAT",
        value: item.size,
        scopes: ["FONT_SIZE"],
        css: `--onda-font-size-${item.size}`
      });
      if (result.created) created.push(result.variable.id);
    }
    for (const weight of TYPE_WEIGHTS) {
      const result = await ensureVariable(typographyInfo.collection, typographyInfo.modeId, {
        name: `font-weight/${weight}`,
        type: "FLOAT",
        value: weight,
        scopes: ["FONT_WEIGHT"],
        css: `--onda-font-weight-${weight}`
      });
      if (result.created) created.push(result.variable.id);
    }
    return {
      collections: [primitiveInfo, dimensionInfo, lightInfo, darkInfo, typographyInfo].map((info) => info.collection.id),
      createdVariableIds: created
    };
  }
  async function createFoundationStyles(decision) {
    const existingText = await figma.getLocalTextStylesAsync();
    const createdText = [];
    for (const scale of TYPE_SCALE) {
      for (const weight of TYPE_WEIGHTS) {
        const name = `Onda/Type/${scale.size} \xB7 ${weight}`;
        if (existingText.some((style2) => style2.name === name)) continue;
        const style = figma.createTextStyle();
        style.name = name;
        style.fontName = { family: decision.family, style: decision.styles[weight] };
        style.fontSize = scale.size;
        style.lineHeight = { unit: "PIXELS", value: scale.lineHeight };
        style.letterSpacing = { unit: "PIXELS", value: 0 };
        createdText.push(style.id);
      }
    }
    const existingEffects = await figma.getLocalEffectStylesAsync();
    const createdEffects = [];
    const effects = [
      { name: "Onda/Shadow/Floating", radius: 12, opacity: 0.12, y: 4 },
      { name: "Onda/Shadow/Overlay", radius: 24, opacity: 0.16, y: 8 }
    ];
    for (const effect of effects) {
      if (existingEffects.some((style2) => style2.name === effect.name)) continue;
      const style = figma.createEffectStyle();
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
      createdEffects.push(style.id);
    }
    return { createdTextStyleIds: createdText, createdEffectStyleIds: createdEffects };
  }
  async function runFoundations(page, ledger) {
    await loadDecisionFonts(ledger.fontDecision);
    const variables = await createFoundationVariables();
    const styles = await createFoundationStyles(ledger.fontDecision);
    const sectionResult = ensureSection(page, ledger, "01 \xB7 Foundations", 3e3);
    const section = sectionResult.node;
    const doc = autoFrame(section, "Foundations / Dokumentation", { x: 80, y: 100, width: 1940, padding: 40, gap: 24, radius: 6 }).node;
    heading(doc, "Foundations", ledger.fontDecision, "Monochrom \xB7 Radien 0/4/6/8 \xB7 ABC Diatype bevorzugt \xB7 Light und Dark als getrennte Single-Mode-Semantik");
    textNode(doc, "Foundations / Fontstatus", ledger.fontDecision.warning || "\u2713 ABC Diatype ist verf\xFCgbar.", ledger.fontDecision, {
      size: 15,
      weight: 700,
      width: 1800
    });
    const palette = autoFrame(section, "Foundations / Graustufen", { x: 80, y: 620, width: 1940, direction: "HORIZONTAL", padding: 32, gap: 12, radius: 6 }).node;
    for (const name of Object.keys(PALETTE)) {
      const swatch = autoFrame(palette, `Swatch / ${name}`, { width: 150, height: 160, padding: 12, gap: 8, fill: name, radius: 4 }).node;
      swatch.fills = [solid(name)];
      textNode(swatch, `Swatch / ${name} / Label`, name, ledger.fontDecision, { size: 12, weight: 500, dark: ["gray/700", "gray/900", "gray/1000"].includes(name), width: 120 });
    }
    const type = autoFrame(section, "Foundations / Typografie", { x: 80, y: 1e3, width: 1940, padding: 32, gap: 20, radius: 6 }).node;
    for (const scale of TYPE_SCALE) {
      for (const weight of TYPE_WEIGHTS) {
        textNode(type, `Typografie / ${scale.size} / ${weight}`, `${scale.size}px \xB7 ${weight} \xB7 Onda schreibt klar und ruhig.`, ledger.fontDecision, {
          size: scale.size,
          weight,
          width: 1800
        });
      }
    }
    const radius = autoFrame(section, "Foundations / Radien", { x: 80, y: 2250, width: 1940, direction: "HORIZONTAL", padding: 32, gap: 20, radius: 6 }).node;
    for (const token of RADIUS_TOKENS) {
      const sample = token.geometry === "ELLIPSE" ? figma.createEllipse() : figma.createRectangle();
      sample.name = `Radius / ${token.value}`;
      sample.resize(112, 112);
      sample.fills = [solid("gray/100")];
      sample.strokes = [solid("gray/700")];
      sample.strokeWeight = 1;
      if (token.geometry !== "ELLIPSE") sample.cornerRadius = token.value;
      radius.appendChild(sample);
    }
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
    if (fillVariable) {
      component.fills = [figma.variables.setBoundVariableForPaint(solid("gray/900"), "color", fillVariable)];
    }
    if (radiusVariable) {
      for (const field of ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"]) component.setBoundVariable(field, radiusVariable);
    }
    if (spacingVariable) component.setBoundVariable("itemSpacing", spacingVariable);
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
  function createPrototype(section, decision) {
    const flows = [
      ["Hauptablauf", "Bibliothek \u2192 Projekt \u2192 Dokument \u2192 Anmerkung \u2192 \xDCbernehmen \u2192 R\xFCckg\xE4ngig \u2192 Schlussaudit \u2192 Export"],
      ["Projektwissen", "Projektverst\xE4ndnis \u2192 Projektged\xE4chtnis / Argumentationsdossier / Sprache & Wirkung \u2192 Editor"],
      ["Quellen & Recherche", "Quellen \u2192 Import \u2192 Recherche planen \u2192 Lauf \u2192 Pr\xFCfung \u2192 Fundstelle \xFCbernehmen"],
      ["Agent & Beleg", "Aura \u2192 Agentengespr\xE4ch \u2192 Antwort \u2192 Fundstelle \u2192 Editor"]
    ];
    for (const [index, [name, path]] of flows.entries()) {
      const frame = autoFrame(section, `Prototyp / ${name}`, { x: 80, y: 120 + index * 500, width: 1940, padding: 32, gap: 20, radius: 6 }).node;
      textNode(frame, `Prototyp / ${name} / Titel`, name, decision, { size: 21, weight: 700, width: 1800 });
      textNode(frame, `Prototyp / ${name} / Pfad`, path, decision, { size: 15, weight: 500, width: 1800 });
      textNode(frame, `Prototyp / ${name} / Recovery`, "Fehler \u2192 Wiederholen / Einrichten / Korrigieren / Abbrechen \xB7 keine tote Zwischenstation", decision, { size: 12, weight: 700, width: 1800 });
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
    createPrototype(prototype, ledger.fontDecision);
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
    const baselineIds = new Set(ledger.baseline.nodeIds);
    const records = orderRecordsByBaselineIds(collectRecordsFromDocument(baselineIds), ledger.baseline.nodeIds);
    const currentById = new Map(records.map((record) => [record.id, hashBaselineRecords([record])]));
    const mismatches = ledger.baseline.nodeHashes.filter((item) => currentById.get(item.id) !== item.hash).map((item) => item.id);
    const currentHash = hashBaselineRecords(records);
    const presentTopLevel = page.children.filter((node) => ledger.baseline.topLevelIds.includes(node.id)).length;
    return {
      records,
      currentHash,
      mismatches,
      presentTopLevel,
      pages: pageInvariantSnapshot()
    };
  }
  async function runVerify() {
    const inspection = await inspectCurrentTarget();
    if (!inspection.target.ok) throw new Error(inspection.target.warning);
    const page = figma.currentPage;
    const ledger = readLedger(page);
    if (!ledger) throw new Error("Noch kein Onda-Ledger vorhanden. Inspect und mindestens eine Mutationsphase ausf\xFChren.");
    const requiredNames = new Set(SECTION_DEFINITIONS.map((section) => section.name));
    const sections = page.children.filter((node) => node.type === "SECTION" && requiredNames.has(node.name));
    const allNodes = collectOndaNodes(sections);
    const annotationKinds = sections.map((section) => section.getPluginData("ondaAnnotationKind")).filter(Boolean);
    const dialogFamilies = allNodes.map((node) => {
      var _a;
      return (_a = node.getPluginData) == null ? void 0 : _a.call(node, "ondaDialogFamily");
    }).filter(Boolean);
    const baseline = currentBaselineEvidence(page, ledger);
    const report = buildVerificationReport({
      pageCount: figma.root.children.length,
      sectionNames: sections.map((section) => section.name),
      annotationKinds,
      dialogFamilies,
      paints: paintsFromNodes(allNodes),
      radii: radiiFromNodes(allNodes),
      topLevelNames: sections.map((section) => section.name),
      baselineTopLevelCount: ledger.baseline.topLevelCount,
      preservedTopLevelCount: baseline.presentTopLevel,
      baselineHash: ledger.baseline.hash,
      currentBaselineHash: baseline.currentHash,
      baselineMismatches: baseline.mismatches,
      baselinePages: ledger.baseline.pages,
      currentPages: baseline.pages
    });
    report.targetFileKey = figma.fileKey || null;
    report.targetPageName = page.name;
    report.expectedFileKey = TARGET_FILE_KEY;
    report.fontFallback = ledger.fontDecision.exact ? "" : ledger.fontDecision.warning;
    report.planErrors = validateDesignPlan(buildDesignPlan());
    report.sectionTypeFallbacks = SECTION_DEFINITIONS.filter((definition2) => {
      const matching = page.children.find((node) => node.name === definition2.name);
      return matching && matching.type !== "SECTION";
    }).map((definition2) => definition2.name);
    report.nonGrayPaintNodeCount = paintsFromNodes(allNodes).filter((paint) => !isGrayColor(paint)).length;
    report.invalidRadiusNodes = radiiFromNodes(allNodes).filter((radius) => !isValidRadius(radius.value, radius.geometry)).map((radius) => ({ id: radius.id, name: radius.name, value: radius.value }));
    report.preservedBaselineHash = report.preservedBaselineHash && baseline.mismatches.length === 0;
    report.baselineHash = ledger.baseline.hash;
    report.currentBaselineHash = baseline.currentHash;
    return report;
  }
  function postResult(command, ok, message, counts = null, unlockMutations = Boolean(lastInspection == null ? void 0 : lastInspection.target.ok)) {
    figma.ui.postMessage({ type: "phase-result", command, ok, message, counts, unlockMutations });
  }
  async function handleCommand(command) {
    var _a, _b, _c, _d;
    if (command === "inspect") {
      const inspection = await inspectCurrentTarget();
      postResult(command, inspection.target.ok, inspectionMessage(inspection), {
        pageCount: inspection.pageCount,
        baselineTopLevelCount: (_b = (_a = inspection.ledger) == null ? void 0 : _a.baseline.topLevelCount) != null ? _b : inspection.pendingBaseline.topLevelCount,
        baselineNodeCount: (_d = (_c = inspection.ledger) == null ? void 0 : _c.baseline.nodeIds.length) != null ? _d : inspection.pendingBaseline.nodeIds.length,
        fontFamily: inspection.fontDecision.family,
        exactFont: inspection.fontDecision.exact,
        targetFallback: inspection.target.fallback
      }, inspection.target.ok);
      return;
    }
    if (command === "verify") {
      const report = await runVerify();
      const hardPass = report.pageInvariant && report.preservedBaselineHash && report.pageCount === 1 && report.sectionCount === 39 && report.missingSections.length === 0 && report.annotationCount === 29 && report.dialogFamilyCount === 7 && report.nonGrayPaints === 0 && report.invalidRadii === 0 && report.duplicateNames.length === 0 && report.planErrors.length === 0;
      postResult(command, hardPass, hardPass ? "Alle strukturellen Hard Gates bestanden." : "Verify hat offene Hard Gates gefunden.", report, true);
      return;
    }
    const { page, ledger } = await requireMutationContext();
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
  figma.ui.onmessage = async (message) => {
    if (!message || message.type !== "run-command") return;
    try {
      await handleCommand(message.command);
    } catch (error) {
      postResult(message.command, false, error instanceof Error ? error.message : String(error), null, Boolean(lastInspection == null ? void 0 : lastInspection.target.ok));
    }
  };
})();
