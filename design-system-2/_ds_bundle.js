/* @ds-bundle: {"format":4,"namespace":"AuraDesignSystem_6ddaae","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"IconButton","sourcePath":"components/actions/IconButton.jsx"},{"name":"Annotation","sourcePath":"components/annotation/Annotation.jsx"},{"name":"Correction","sourcePath":"components/annotation/Correction.jsx"},{"name":"Insertion","sourcePath":"components/annotation/Insertion.jsx"},{"name":"Mark","sourcePath":"components/annotation/Mark.jsx"},{"name":"Rewrite","sourcePath":"components/annotation/Rewrite.jsx"},{"name":"Slot","sourcePath":"components/annotation/Slot.jsx"},{"name":"Region","sourcePath":"components/annotation/Slot.jsx"},{"name":"CATEGORIES","sourcePath":"components/annotation/kinds.js"},{"name":"KINDS","sourcePath":"components/annotation/kinds.js"},{"name":"PRIORITY","sourcePath":"components/annotation/kinds.js"},{"name":"PRIORITY_OF","sourcePath":"components/annotation/kinds.js"},{"name":"SCOPES","sourcePath":"components/annotation/kinds.js"},{"name":"Aura","sourcePath":"components/brand/Aura.jsx"},{"name":"Bubble","sourcePath":"components/conversation/Bubble.jsx"},{"name":"Composer","sourcePath":"components/conversation/Composer.jsx"},{"name":"Avatar","sourcePath":"components/display/Avatar.jsx"},{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"Icon","sourcePath":"components/display/Icon.jsx"},{"name":"Tag","sourcePath":"components/display/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/inputs/Checkbox.jsx"},{"name":"Input","sourcePath":"components/inputs/Input.jsx"},{"name":"Radio","sourcePath":"components/inputs/Radio.jsx"},{"name":"Select","sourcePath":"components/inputs/Select.jsx"},{"name":"Switch","sourcePath":"components/inputs/Switch.jsx"},{"name":"Textarea","sourcePath":"components/inputs/Textarea.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"8a1a71a6603c","components/actions/IconButton.jsx":"61d974964e5a","components/annotation/Annotation.jsx":"f2171f1465c0","components/annotation/Correction.jsx":"a4e90e4abc9f","components/annotation/Insertion.jsx":"19cd2ec372fd","components/annotation/Mark.jsx":"afaca19f26f8","components/annotation/Rewrite.jsx":"8ba0bc43449e","components/annotation/Slot.jsx":"9815e72d5d9d","components/annotation/kinds.js":"ac99f8029e28","components/brand/Aura.jsx":"0b4a1b6e752b","components/conversation/Bubble.jsx":"2a3aa0c9b114","components/conversation/Composer.jsx":"d3cac1f3b9e6","components/display/Avatar.jsx":"3bd301f664e5","components/display/Badge.jsx":"5a831d7ea893","components/display/Card.jsx":"86ee63204ca2","components/display/Icon.jsx":"969b1fc351d4","components/display/Tag.jsx":"7984bac2b022","components/feedback/Dialog.jsx":"06b43273cd87","components/feedback/Toast.jsx":"fa9a3966d528","components/feedback/Tooltip.jsx":"22e6a87a2461","components/inputs/Checkbox.jsx":"cc196c331a37","components/inputs/Input.jsx":"923de3f0bb5a","components/inputs/Radio.jsx":"466c3d989bfb","components/inputs/Select.jsx":"a971e85cee57","components/inputs/Switch.jsx":"03bca79b59be","components/inputs/Textarea.jsx":"32de3ded4d34","components/navigation/Tabs.jsx":"c9af559b2ccd","ui_kits/writing-tool/app.jsx":"a79ff79245ec","ui_kits/writing-tool/editor.jsx":"edafc02509dc","ui_kits/writing-tool/home.jsx":"15156a0509aa","ui_kits/writing-tool/icons.jsx":"8734ac1b77ca","ui_kits/writing-tool/shell.jsx":"15bdcc6ff7dc"},"inlinedExternals":[],"unexposedExports":[{"name":"iconNames","sourcePath":"components/display/Icon.jsx"},{"name":"kindInfo","sourcePath":"components/annotation/kinds.js"}]} */

(() => {

const __ds_ns = (window.AuraDesignSystem_6ddaae = window.AuraDesignSystem_6ddaae || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/actions/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid transparent;font-family:var(--font-sans);font-weight:var(--fw-medium);border-radius:var(--radius-control);cursor:pointer;transition:var(--transition-colors),transform var(--dur-fast) var(--ease-out),box-shadow var(--dur-fast) var(--ease-out);white-space:nowrap;user-select:none}
.aura-btn:active:not(:disabled){transform:scale(0.98)}
.aura-btn:disabled{opacity:.45;cursor:not-allowed}
.aura-btn--sm{height:32px;padding:0 16px;font-size:var(--text-base)}
.aura-btn--md{height:40px;padding:0 22px;font-size:var(--text-base)}
.aura-btn--lg{height:48px;padding:0 28px;font-size:var(--text-base)}
.aura-btn--primary{background:var(--accent);color:var(--on-accent)}
.aura-btn--primary:hover:not(:disabled){background:var(--accent-hover)}
.aura-btn--primary:active:not(:disabled){background:var(--accent-active)}
.aura-btn--secondary{background:var(--bg-surface);border-color:var(--border-default);color:var(--text-primary);box-shadow:var(--shadow-xs)}
.aura-btn--secondary:hover:not(:disabled){background:var(--bg-hover);border-color:var(--border-strong)}
.aura-btn--ghost{background:transparent;color:var(--text-secondary)}
.aura-btn--ghost:hover:not(:disabled){background:var(--bg-hover);color:var(--text-primary)}
.aura-btn--danger{background:var(--danger);color:#fff}
.aura-btn--danger:hover:not(:disabled){filter:brightness(0.94)}
.aura-btn__spin{width:14px;height:14px;border-radius:var(--radius-full);border:2px solid currentColor;border-top-color:transparent;animation:aura-spin .7s linear infinite;opacity:.8}
@keyframes aura-spin{to{transform:rotate(360deg)}}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-button')) {
    const s = document.createElement('style');
    s.id = 'aura-css-button';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  children,
  ...rest
}) {
  css();
  return /*#__PURE__*/React.createElement("button", _extends({
    className: `aura-btn aura-btn--${variant} aura-btn--${size}`,
    disabled: disabled || loading
  }, rest), loading ? /*#__PURE__*/React.createElement("span", {
    className: "aura-btn__spin"
  }) : icon, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-iconbtn{display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;background:transparent;color:var(--text-secondary);border-radius:var(--radius-control);cursor:pointer;transition:var(--transition-colors),transform var(--dur-fast) var(--ease-out)}
.aura-iconbtn:hover:not(:disabled){background:var(--bg-hover);color:var(--text-primary)}
.aura-iconbtn:active:not(:disabled){background:var(--bg-active);transform:scale(0.96)}
.aura-iconbtn:disabled{opacity:.45;cursor:not-allowed}
.aura-iconbtn--secondary{background:var(--bg-surface);border-color:var(--border-default);box-shadow:var(--shadow-xs)}
.aura-iconbtn--secondary:hover:not(:disabled){background:var(--bg-hover);border-color:var(--border-strong)}
.aura-iconbtn--sm{width:32px;height:32px}
.aura-iconbtn--md{width:36px;height:36px}
.aura-iconbtn--lg{width:40px;height:40px}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-iconbtn')) {
    const s = document.createElement('style');
    s.id = 'aura-css-iconbtn';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function IconButton({
  variant = 'ghost',
  size = 'md',
  label,
  children,
  ...rest
}) {
  css();
  return /*#__PURE__*/React.createElement("button", _extends({
    className: `aura-iconbtn aura-iconbtn--${variant} aura-iconbtn--${size}`,
    "aria-label": label,
    title: label
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/annotation/Insertion.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-ins{position:relative;display:inline;vertical-align:baseline}
.aura-ins__caret{position:relative;display:inline-block;width:2px;height:1.05em;margin:0 2px -0.15em;border-radius:1px;background:var(--ink-300);cursor:pointer;transition:background-color var(--dur-fast) var(--ease-out)}
.aura-ins:hover .aura-ins__caret,.aura-ins--open .aura-ins__caret{background:var(--accent)}
/* Der Vorschlag liegt IM Textfluss: er öffnet eine Lücke an der Einfügestelle und verdeckt nichts. */
.aura-ins__pop{display:block;width:fit-content;max-width:100%;margin:12px 0;padding:14px 16px;background:var(--bg-surface);border-radius:var(--radius-panel);box-shadow:var(--shadow-xs);font-family:var(--font-sans);letter-spacing:var(--tracking-normal);animation:aura-ins-in var(--dur-normal) var(--ease-out)}
.aura-ins__label{display:block;font:var(--type-label);color:var(--text-tertiary)}
.aura-ins__ghost{display:block;margin-top:7px;font:var(--type-body);line-height:var(--leading-relaxed);color:var(--text-primary);text-wrap:pretty}
.aura-ins__acts{display:flex;align-items:center;gap:8px;margin-top:11px}
.aura-ins__ok{height:32px;padding:0 16px;border:none;border-radius:var(--radius-control);background:var(--accent);color:var(--on-accent);font-family:var(--font-sans);font-size:var(--text-base);font-weight:var(--fw-medium);cursor:pointer;white-space:nowrap}
.aura-ins__ok:hover{background:var(--accent-hover)}
.aura-ins__no{height:32px;padding:0 14px;border:none;border-radius:var(--radius-control);background:transparent;color:var(--text-secondary);font-family:var(--font-sans);font-size:var(--text-base);font-weight:var(--fw-medium);cursor:pointer;white-space:nowrap}
.aura-ins__no:hover{background:var(--bg-hover);color:var(--text-primary)}
@keyframes aura-ins-in{from{opacity:0;transform:translateY(-4px)}}
@media (prefers-reduced-motion:reduce){.aura-ins__pop{animation:none}}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-ins')) {
    const s = document.createElement('style');
    s.id = 'aura-css-ins';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Insertion({
  text,
  label = 'Einfügen',
  acceptLabel = 'Einfügen',
  open = false,
  onAccept,
  onDismiss,
  onClick,
  ...rest
}) {
  css();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `aura-ins${open ? ' aura-ins--open' : ''}`
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "aura-ins__caret",
    role: "button",
    "aria-label": label,
    onClick: onClick
  }), open && text && /*#__PURE__*/React.createElement("span", {
    className: "aura-ins__pop"
  }, /*#__PURE__*/React.createElement("span", {
    className: "aura-ins__label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "aura-ins__ghost"
  }, text), /*#__PURE__*/React.createElement("span", {
    className: "aura-ins__acts"
  }, onAccept && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-ins__ok",
    onClick: onAccept
  }, acceptLabel), onDismiss && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-ins__no",
    onClick: onDismiss
  }, "Verwerfen"))));
}
Object.assign(__ds_scope, { Insertion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/annotation/Insertion.jsx", error: String((e && e.message) || e) }); }

// components/annotation/Rewrite.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-rewrite{display:flex;flex-direction:column;gap:11px;padding:16px 18px;background:var(--bg-surface);border-radius:var(--radius-panel);box-shadow:var(--shadow-xs);font-family:var(--font-sans);letter-spacing:var(--tracking-normal);animation:aura-rw-in var(--dur-normal) var(--ease-out)}
.aura-rewrite__label{display:flex;align-items:baseline;gap:9px;font:var(--type-label);color:var(--text-primary)}
.aura-rewrite__meta{margin-left:auto;font:var(--type-body);color:var(--text-tertiary);font-variant-numeric:tabular-nums}
.aura-rewrite__note{font:var(--type-body);color:var(--text-secondary);text-wrap:pretty}
.aura-rewrite__text{font:var(--type-body);line-height:var(--leading-relaxed);color:var(--text-primary);text-wrap:pretty;margin:0;padding:13px 15px;background:var(--bg-sunken);border-radius:var(--radius-panel)}
.aura-rewrite__acts{display:flex;align-items:center;gap:8px;margin-top:2px}
.aura-rewrite__ok{height:32px;padding:0 16px;border:none;border-radius:var(--radius-control);background:var(--accent);color:var(--on-accent);font-family:var(--font-sans);font-size:var(--text-base);font-weight:var(--fw-medium);cursor:pointer;white-space:nowrap}
.aura-rewrite__ok:hover{background:var(--accent-hover)}
.aura-rewrite__no{height:32px;padding:0 14px;border:none;border-radius:var(--radius-control);background:transparent;color:var(--text-secondary);font-family:var(--font-sans);font-size:var(--text-base);font-weight:var(--fw-medium);cursor:pointer;white-space:nowrap}
.aura-rewrite__no:hover{background:var(--bg-hover);color:var(--text-primary)}
@keyframes aura-rw-in{from{opacity:0;transform:translateY(6px)}}
@media (prefers-reduced-motion:reduce){.aura-rewrite{animation:none}}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-rewrite')) {
    const s = document.createElement('style');
    s.id = 'aura-css-rewrite';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Rewrite({
  label = 'Umschreiben',
  to,
  meta,
  acceptLabel = 'Übernehmen',
  dismissLabel = 'Original behalten',
  onAccept,
  onDismiss,
  children,
  ...rest
}) {
  css();
  return /*#__PURE__*/React.createElement("div", _extends({
    className: "aura-rewrite"
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "aura-rewrite__label"
  }, /*#__PURE__*/React.createElement("span", null, label), meta && /*#__PURE__*/React.createElement("span", {
    className: "aura-rewrite__meta"
  }, meta)), children && /*#__PURE__*/React.createElement("div", {
    className: "aura-rewrite__note"
  }, children), to && /*#__PURE__*/React.createElement("p", {
    className: "aura-rewrite__text"
  }, to), (onAccept || onDismiss) && /*#__PURE__*/React.createElement("div", {
    className: "aura-rewrite__acts"
  }, onAccept && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-rewrite__ok",
    onClick: onAccept
  }, acceptLabel), onDismiss && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-rewrite__no",
    onClick: onDismiss
  }, dismissLabel)));
}
Object.assign(__ds_scope, { Rewrite });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/annotation/Rewrite.jsx", error: String((e && e.message) || e) }); }

// components/annotation/Slot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-slot{display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border:1px dashed var(--border-strong);border-radius:var(--radius-panel);background:transparent;animation:aura-slot-in var(--dur-normal) var(--ease-out)}
.aura-slot__body{display:flex;flex-direction:column;gap:8px;min-width:0}
.aura-slot__label{font:var(--type-label);color:var(--text-tertiary)}
.aura-slot__text{font:var(--type-body);line-height:var(--leading-relaxed);color:var(--text-secondary);text-wrap:pretty;margin:0}
.aura-slot__acts{display:flex;align-items:center;gap:8px;margin-top:2px}
.aura-slot__ok{height:32px;padding:0 16px;border:none;border-radius:var(--radius-control);background:var(--accent);color:var(--on-accent);font-family:var(--font-sans);font-size:var(--text-base);font-weight:var(--fw-medium);cursor:pointer}
.aura-slot__ok:hover{background:var(--accent-hover)}
.aura-slot__no{height:32px;padding:0 14px;border:none;border-radius:var(--radius-control);background:transparent;color:var(--text-secondary);font-family:var(--font-sans);font-size:var(--text-base);font-weight:var(--fw-medium);cursor:pointer}
.aura-slot__no:hover{background:var(--bg-hover);color:var(--text-primary)}
.aura-slot--moved{opacity:.45}
@keyframes aura-slot-in{from{opacity:0;transform:translateY(6px)}}
@media (prefers-reduced-motion:reduce){.aura-slot{animation:none}}
.aura-region{position:relative;display:block;padding:16px 18px;margin:-16px -18px;border-radius:var(--radius-panel);background:var(--bg-sunken)}
.aura-region__tag{position:absolute;right:16px;top:-11px;display:inline-flex;align-items:center;height:22px;padding:0 12px;border-radius:var(--radius-full);background:var(--bg-surface);box-shadow:var(--shadow-xs);font:var(--type-caption);color:var(--text-secondary)}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-slot')) {
    const s = document.createElement('style');
    s.id = 'aura-css-slot';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Slot({
  label = 'Hierher verschieben',
  text,
  onAccept,
  onDismiss,
  ...rest
}) {
  css();
  return /*#__PURE__*/React.createElement("div", _extends({
    className: "aura-slot"
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "aura-slot__body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "aura-slot__label"
  }, label), text && /*#__PURE__*/React.createElement("p", {
    className: "aura-slot__text"
  }, text), (onAccept || onDismiss) && /*#__PURE__*/React.createElement("div", {
    className: "aura-slot__acts"
  }, onAccept && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-slot__ok",
    onClick: onAccept
  }, "Verschieben"), onDismiss && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-slot__no",
    onClick: onDismiss
  }, "Lassen"))));
}
function Region({
  tag,
  children,
  ...rest
}) {
  css();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: "aura-region"
  }, rest), tag && /*#__PURE__*/React.createElement("span", {
    className: "aura-region__tag"
  }, tag), children);
}
Object.assign(__ds_scope, { Slot, Region });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/annotation/Slot.jsx", error: String((e && e.message) || e) }); }

// components/annotation/kinds.js
try { (() => {
/* Onda · Anmerkungsarten. Vier Kategorien bestimmen Markierung + Symbol; jede Art gehört genau einer. */
const CATEGORIES = {
  korrektur: {
    label: 'Korrektur',
    icon: 'type'
  },
  stil: {
    label: 'Stil',
    icon: 'sparkle'
  },
  struktur: {
    label: 'Struktur',
    icon: 'arrow-up-down'
  },
  inhalt: {
    label: 'Inhalt',
    icon: 'quote'
  },
  notiz: {
    label: 'Notiz',
    icon: 'list'
  }
};
const KINDS = {
  /* Korrektur — objektiv falsch, ein Klick genügt */
  rechtschreibung: {
    label: 'Rechtschreibung',
    cat: 'korrektur'
  },
  grammatik: {
    label: 'Grammatik',
    cat: 'korrektur'
  },
  zeichensetzung: {
    label: 'Zeichensetzung',
    cat: 'korrektur'
  },
  /* Stil — Formulierung, Vorschlag zur Wahl */
  wortwahl: {
    label: 'Wortwahl',
    cat: 'stil'
  },
  satzstil: {
    label: 'Satzstil',
    cat: 'stil'
  },
  absatzstil: {
    label: 'Absatzstil',
    cat: 'stil'
  },
  straffen: {
    label: 'Straffen',
    cat: 'stil'
  },
  wiederholung: {
    label: 'Wiederholung',
    cat: 'stil'
  },
  ton: {
    label: 'Ton & Register',
    cat: 'stil'
  },
  stilmittel: {
    label: 'Stilmittel',
    cat: 'stil'
  },
  anglizismus: {
    label: 'Anglizismus',
    cat: 'stil'
  },
  terminologie: {
    label: 'Terminologie',
    cat: 'stil'
  },
  /* Struktur — Aufbau und Bewegung im Text */
  verschieben: {
    label: 'Verschieben',
    cat: 'struktur'
  },
  uebergang: {
    label: 'Übergang',
    cat: 'struktur'
  },
  gliederung: {
    label: 'Gliederung',
    cat: 'struktur'
  },
  fluss: {
    label: 'Textfluss',
    cat: 'struktur'
  },
  faden: {
    label: 'Roter Faden',
    cat: 'struktur'
  },
  ueberschrift: {
    label: 'Überschrift',
    cat: 'struktur'
  },
  /* Inhalt — Substanz und Belege */
  anmerkung: {
    label: 'Anmerkung',
    cat: 'inhalt'
  },
  beleg: {
    label: 'Beleg fehlt',
    cat: 'inhalt'
  },
  faktencheck: {
    label: 'Faktencheck',
    cat: 'inhalt'
  },
  widerspruch: {
    label: 'Widerspruch',
    cat: 'inhalt'
  },
  luecke: {
    label: 'Gegenargument fehlt',
    cat: 'inhalt'
  },
  verstaendlichkeit: {
    label: 'Verständlichkeit',
    cat: 'inhalt'
  },
  /* Notizmodus — lose Gedanken, Stichworte, Pfeile. Hier wird NICHT korrigiert. */
  ausformulieren: {
    label: 'Ausformulieren',
    cat: 'notiz'
  },
  buendeln: {
    label: 'Gehört zusammen',
    cat: 'notiz'
  },
  nachfrage: {
    label: 'Nachfrage',
    cat: 'notiz'
  },
  ordnen: {
    label: 'Reihenfolge',
    cat: 'notiz'
  },
  aufgreifen: {
    label: 'Offener Faden',
    cat: 'notiz'
  }
};
/* Rangfolge: was gemacht werden MUSS, was den Text besser macht, was Geschmack ist. */
const PRIORITY = {
  muss: 'Fehler',
  sollte: 'Empfehlung',
  geschmack: 'Geschmack'
};
const PRIORITY_OF = {
  rechtschreibung: 'muss',
  grammatik: 'muss',
  zeichensetzung: 'muss',
  beleg: 'muss',
  faktencheck: 'muss',
  widerspruch: 'muss',
  satzstil: 'sollte',
  straffen: 'sollte',
  fluss: 'sollte',
  uebergang: 'sollte',
  gliederung: 'sollte',
  faden: 'sollte',
  verstaendlichkeit: 'sollte',
  luecke: 'sollte',
  terminologie: 'sollte',
  verschieben: 'sollte',
  wortwahl: 'geschmack',
  absatzstil: 'geschmack',
  wiederholung: 'geschmack',
  ton: 'geschmack',
  stilmittel: 'geschmack',
  anglizismus: 'geschmack',
  ueberschrift: 'geschmack',
  anmerkung: 'geschmack',
  ausformulieren: 'sollte',
  buendeln: 'sollte',
  nachfrage: 'sollte',
  ordnen: 'sollte',
  aufgreifen: 'geschmack'
};
const SCOPES = ['Wort', 'Satz', 'Absatz', 'Abschnitt', 'Text'];
function kindInfo(kind) {
  const k = KINDS[kind] || KINDS.anmerkung;
  const c = CATEGORIES[k.cat];
  return {
    label: k.label,
    cat: k.cat,
    catLabel: c.label,
    icon: c.icon
  };
}
Object.assign(__ds_scope, { CATEGORIES, KINDS, PRIORITY, PRIORITY_OF, SCOPES, kindInfo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/annotation/kinds.js", error: String((e && e.message) || e) }); }

// components/annotation/Mark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-mark{background:transparent;color:inherit;cursor:pointer;border-radius:0.18em;transition:background-color var(--dur-fast) var(--ease-out),border-color var(--dur-fast) var(--ease-out)}
/* Vier Kategorien, vier Prinzipien — ohne Farbcode: Rahmen · Fläche · angehobener Block · Akzentfläche */
.aura-mark--korrektur{border:1px solid var(--border-strong);padding:0 4px}
.aura-mark--stil{background:var(--bg-sunken);padding:1px 4px}
.aura-mark--struktur{background:var(--bg-surface);box-shadow:var(--shadow-md);padding:1px 5px}
.aura-mark--inhalt{background:var(--accent-tint);padding:1px 4px}
[data-theme="dark"] .aura-mark--korrektur{border-color:var(--ink-500)}
.aura-mark:hover{background:var(--accent-tint)}
.aura-mark--active{background:var(--accent-tint);border-color:var(--accent)}
.aura-mark__n{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 4px;margin-left:5px;border-radius:var(--radius-full);background:var(--bg-sunken);color:var(--text-tertiary);font-size:var(--text-xs);font-weight:var(--fw-medium);font-variant-numeric:tabular-nums;vertical-align:2px;line-height:1}
.aura-mark--active .aura-mark__n{background:var(--accent);color:var(--on-accent)}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-mark')) {
    const s = document.createElement('style');
    s.id = 'aura-css-mark';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Mark({
  kind = 'anmerkung',
  n,
  active = false,
  onClick,
  children,
  ...rest
}) {
  css();
  const {
    cat,
    label
  } = __ds_scope.kindInfo(kind);
  return /*#__PURE__*/React.createElement("mark", _extends({
    className: `aura-mark aura-mark--${cat}${active ? ' aura-mark--active' : ''}`,
    onClick: onClick,
    title: label
  }, rest), children, n != null && /*#__PURE__*/React.createElement("span", {
    className: "aura-mark__n"
  }, n));
}
Object.assign(__ds_scope, { Mark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/annotation/Mark.jsx", error: String((e && e.message) || e) }); }

// components/brand/Aura.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-orb{position:relative;display:inline-block;border-radius:var(--radius-full);flex:none}
.aura-orb::before{content:"";position:absolute;inset:-14%;border-radius:var(--radius-full);background:var(--gradient-aura);filter:blur(11px);opacity:.24;animation:aura-halo 8s var(--ease-in-out) infinite}
.aura-orb__disc{position:absolute;inset:0;border-radius:var(--radius-full);overflow:hidden;box-shadow:var(--shadow-glow)}
.aura-orb__swirl{position:absolute;inset:-30%;background:var(--gradient-aura);animation:aura-swirl 20s linear infinite}
.aura-orb__disc::after{content:"";position:absolute;inset:0;border-radius:var(--radius-full);background:radial-gradient(circle at 32% 26%,rgba(255,255,255,.45),rgba(255,255,255,0) 52%)}
.aura-orb--idle{animation:aura-breathe 8s var(--ease-in-out) infinite}
.aura-orb--thinking{animation:aura-breathe 2.6s var(--ease-in-out) infinite}
.aura-orb--thinking .aura-orb__swirl{animation-duration:4s}
.aura-orb--thinking::before{animation-duration:2.6s;opacity:.34}
.aura-orb--quiet .aura-orb__disc{box-shadow:none}
.aura-orb--quiet::before{display:none}
.aura-orb--quiet .aura-orb__swirl{animation-duration:30s}
@keyframes aura-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}
@keyframes aura-swirl{to{transform:rotate(360deg)}}
@keyframes aura-halo{0%,100%{opacity:.18;transform:scale(1)}50%{opacity:.32;transform:scale(1.06)}}
@media (prefers-reduced-motion:reduce){.aura-orb,.aura-orb__swirl,.aura-orb::before{animation:none!important}}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-orb')) {
    const s = document.createElement('style');
    s.id = 'aura-css-orb';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Aura({
  size = 40,
  state = 'idle',
  label = 'KI-Agent',
  style,
  ...rest
}) {
  css();
  const px = typeof size === 'string' ? parseFloat(size) || 40 : size;
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `aura-orb aura-orb--${state}`,
    style: {
      width: px,
      height: px,
      ...style
    },
    role: "img",
    "aria-label": label,
    title: label
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "aura-orb__disc"
  }, /*#__PURE__*/React.createElement("span", {
    className: "aura-orb__swirl"
  })));
}
Object.assign(__ds_scope, { Aura });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Aura.jsx", error: String((e && e.message) || e) }); }

// components/conversation/Bubble.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-thread{display:flex;flex-direction:column;gap:16px}
.aura-bubble-row{position:relative;isolation:isolate;display:flex;max-width:min(92%,560px);animation:aura-bubble-in var(--dur-normal) var(--ease-out) backwards}
.aura-bubble-row--agent{align-self:flex-start}
.aura-bubble-row--user{align-self:flex-end;justify-content:flex-end}
.aura-bubble__shape{position:absolute;left:0;top:0;z-index:0;pointer-events:none;filter:drop-shadow(0 1px 5px rgba(28,26,23,0.07))}
.aura-bubble__shape path{fill:var(--bg-surface);stroke:var(--border-subtle);stroke-width:1}
[data-theme="dark"] .aura-bubble__shape{filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))}
.aura-bubble__cloud{position:absolute;z-index:-1;left:-14px;top:-10px;width:124px;height:96px;border-radius:50%;background:var(--gradient-aura-soft);filter:blur(26px);opacity:.26;animation:aura-cloud 11s var(--ease-in-out) infinite}
.aura-bubble__avatar{position:absolute;z-index:2;left:6px;top:6px}
.aura-bubble-row--seat-top .aura-bubble__avatar{left:auto;right:6px;top:6px}
.aura-bubble-row--seat-top .aura-bubble__cloud{left:auto;right:-14px;top:-10px}
.aura-bubble-row--user .aura-bubble__avatar{position:static;order:2;margin-left:10px;flex:none}
.aura-bubble{position:relative;z-index:1;display:flex;flex-direction:column;gap:10px;min-width:0;padding:18px 20px;font-size:var(--text-base);line-height:var(--leading-normal);color:var(--text-primary);font-family:var(--font-sans);border-radius:var(--radius-panel)}
.aura-bubble--agent{background:var(--bg-surface);border:1px solid var(--border-subtle);box-shadow:var(--shadow-xs)}
.aura-bubble-row--goo .aura-bubble--agent{background:transparent;border:none;box-shadow:none;min-height:110px;padding:14px 20px 16px 56px}
.aura-bubble-row--goo.aura-bubble-row--seat-top .aura-bubble--agent{min-height:120px;padding:44px 22px 20px}
.aura-bubble--user{background:var(--bg-sunken);border:1px solid var(--border-subtle)}
.aura-bubble__head{display:flex;align-items:baseline;gap:9px;font-size:inherit;font-weight:var(--fw-bold)}
.aura-bubble__meta{font:var(--type-caption);color:var(--text-tertiary)}
.aura-bubble__body{display:flex;flex-direction:column;gap:8px}
.aura-bubble__body p{margin:0}
.aura-bubble__card{background:var(--bg-surface);border:1px solid var(--border-default);border-radius:var(--radius-panel);padding:18px 20px;display:flex;flex-direction:column;gap:8px;box-shadow:var(--shadow-xs)}
.aura-bubble__actions{display:flex;gap:8px;margin-top:2px}
.aura-bubble__think{display:flex;flex-direction:column;gap:8px;padding-top:2px}
.aura-bubble__think span{height:9px;border-radius:var(--radius-sm);background:linear-gradient(90deg,var(--bg-sunken) 0%,var(--bg-hover) 40%,var(--bg-sunken) 80%);background-size:220% 100%;animation:aura-think-sweep 1.9s var(--ease-in-out) infinite}
.aura-bubble__think span:nth-child(1){width:62%}
.aura-bubble__think span:nth-child(2){width:88%;animation-delay:.12s}
.aura-bubble__think span:nth-child(3){width:44%;animation-delay:.24s}
@keyframes aura-bubble-in{from{opacity:0;transform:translateY(6px)}}
@keyframes aura-think-sweep{0%{background-position:120% 0}100%{background-position:-120% 0}}
@keyframes aura-cloud{0%,100%{opacity:.22;transform:scale(1)}50%{opacity:.34;transform:scale(1.05)}}
@media (prefers-reduced-motion:reduce){.aura-bubble-row,.aura-bubble__cloud{animation:none}}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-bubble')) {
    const s = document.createElement('style');
    s.id = 'aura-css-bubble';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
/* Eine durchgehende Silhouette: Orb-Sitzkreis (R24) läuft tangential in die Panelkante,
   ein exakt tangentialer konkaver Fillet (R10) schließt die Gegenseite an.
   seat='left': Orb links oben, Blase wächst nach rechts. seat='top' : Orb rechts oben, Blase wächst nach unten. */
function gooPath(W, H) {
  return `M 24 0 H ${W - 12} A 12 12 0 0 1 ${W} 12 V ${H - 12} A 12 12 0 0 1 ${W - 12} ${H} H 46 A 12 12 0 0 1 34 ${H - 12} V 58 A 10 10 0 0 0 24 48 A 24 24 0 0 1 0 24 A 24 24 0 0 1 24 0 Z`;
}
/* seat='top': dieselbe Kontur, um 90° gedreht — der Sitz landet oben rechts. Eine Geometrie, zwei Sitze. */
function Bubble({
  from = 'agent',
  seat = 'left',
  name,
  meta,
  avatar,
  card,
  actions,
  thinking = false,
  children,
  className = '',
  ...rest
}) {
  css();
  const goo = from === 'agent' && !!avatar;
  const top = seat === 'top';
  const ref = React.useRef(null);
  const inner = React.useRef(null);
  const [dim, setDim] = React.useState({
    w: 0,
    h: 0
  });
  React.useLayoutEffect(() => {
    if (!goo) return;
    let alive = true;
    const measure = () => {
      const el = ref.current;
      if (!el || !alive) return;
      const r = el.getBoundingClientRect();
      setDim(d => Math.abs(d.w - r.width) < 0.25 && Math.abs(d.h - r.height) < 0.25 ? d : {
        w: r.width,
        h: r.height
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ref.current, {
      box: 'border-box'
    });
    if (inner.current) ro.observe(inner.current, {
      box: 'border-box'
    });
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) document.fonts.ready.then(measure).catch(() => {});
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [goo, thinking, children, card, actions, top]);
  /* Die eigene Fläche der Blase verschwindet nur, wenn die SVG-Kontur sie ersetzt —
     kleine Blasen behalten Hintergrund, Haarlinie und Schatten. */
  const shape = goo && dim.w >= 100 && dim.h >= (top ? 118 : 104);
  return /*#__PURE__*/React.createElement("div", _extends({
    ref: ref,
    className: `aura-bubble-row aura-bubble-row--${from}${shape ? ' aura-bubble-row--goo' : ''}${top ? ' aura-bubble-row--seat-top' : ''} ${className}`
  }, rest), shape && /*#__PURE__*/React.createElement("svg", {
    className: "aura-bubble__shape",
    width: dim.w,
    height: dim.h,
    viewBox: `0 0 ${dim.w} ${dim.h}`,
    "aria-hidden": "true"
  }, top ? /*#__PURE__*/React.createElement("g", {
    transform: `translate(${dim.w},0) rotate(90)`
  }, /*#__PURE__*/React.createElement("path", {
    d: gooPath(dim.h, dim.w)
  })) : /*#__PURE__*/React.createElement("path", {
    d: gooPath(dim.w, dim.h)
  })), goo && /*#__PURE__*/React.createElement("span", {
    className: "aura-bubble__cloud"
  }), avatar && /*#__PURE__*/React.createElement("span", {
    className: "aura-bubble__avatar"
  }, avatar), /*#__PURE__*/React.createElement("div", {
    ref: inner,
    className: `aura-bubble aura-bubble--${from}`
  }, (name || meta) && /*#__PURE__*/React.createElement("div", {
    className: "aura-bubble__head"
  }, name && /*#__PURE__*/React.createElement("span", null, name), meta && /*#__PURE__*/React.createElement("span", {
    className: "aura-bubble__meta"
  }, meta)), thinking ? /*#__PURE__*/React.createElement("div", {
    className: "aura-bubble__think",
    role: "status",
    "aria-label": "Antwort wird vorbereitet"
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null)) : /*#__PURE__*/React.createElement(React.Fragment, null, children && /*#__PURE__*/React.createElement("div", {
    className: "aura-bubble__body"
  }, children), card && /*#__PURE__*/React.createElement("div", {
    className: "aura-bubble__card"
  }, card), actions && /*#__PURE__*/React.createElement("div", {
    className: "aura-bubble__actions"
  }, actions))));
}
Object.assign(__ds_scope, { Bubble });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/conversation/Bubble.jsx", error: String((e && e.message) || e) }); }

// components/display/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-avatar{position:relative;display:inline-flex;align-items:center;justify-content:center;border-radius:var(--radius-full);background:var(--surface-3);color:var(--ink-700);font-family:var(--font-sans);font-weight:var(--fw-bold);flex:none;user-select:none;overflow:visible}
[data-theme="dark"] .aura-avatar{color:var(--text-secondary)}
.aura-avatar img{width:100%;height:100%;border-radius:var(--radius-full);object-fit:cover}
.aura-avatar--sm{width:24px;height:24px;font-size:var(--text-xs)}
.aura-avatar--md{width:32px;height:32px;font-size:var(--text-xs)}
.aura-avatar--lg{width:40px;height:40px;font-size:15px}
.aura-avatar__status{position:absolute;right:-1px;bottom:-1px;width:9px;height:9px;border-radius:var(--radius-full);border:2px solid var(--bg-surface);background:var(--accent)}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-avatar')) {
    const s = document.createElement('style');
    s.id = 'aura-css-avatar';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
const TINTS = [['var(--surface-3)', 'var(--ink-700)']];
function initials(name) {
  const p = name.trim().split(/\s+/);
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
}
function Avatar({
  name = '?',
  src,
  size = 'md',
  tinted = false,
  online = false,
  style,
  ...rest
}) {
  css();
  let st = style;
  if (tinted && !src) {
    const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length;
    st = {
      background: TINTS[h][0],
      color: TINTS[h][1],
      ...style
    };
  }
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `aura-avatar aura-avatar--${size}`,
    style: st,
    title: name
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name
  }) : initials(name), online && /*#__PURE__*/React.createElement("span", {
    className: "aura-avatar__status"
  }));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-badge{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 11px;border-radius:var(--radius-control);font-family:var(--font-sans);font-size:var(--text-xs);font-weight:var(--fw-medium);white-space:nowrap}
.aura-badge__dot{width:5px;height:5px;border-radius:var(--radius-full);background:currentColor}
.aura-badge--neutral{background:var(--bg-sunken);color:var(--text-secondary)}
.aura-badge--accent{background:var(--accent-tint);color:var(--accent-active)}
.aura-badge--success{background:var(--bg-sunken);color:var(--text-secondary)}
.aura-badge--warning{background:var(--bg-sunken);color:var(--text-secondary)}
.aura-badge--danger{background:var(--danger-tint);color:var(--danger)}
.aura-badge--info{background:var(--bg-sunken);color:var(--text-secondary)}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-badge')) {
    const s = document.createElement('style');
    s.id = 'aura-css-badge';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Badge({
  tone = 'neutral',
  dot = false,
  children,
  ...rest
}) {
  css();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `aura-badge aura-badge--${tone}`
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "aura-badge__dot"
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-card{background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-card);transition:var(--transition-colors),box-shadow var(--dur-quick) var(--ease-out)}
.aura-card--interactive{cursor:pointer}
.aura-card--interactive:hover{border-color:var(--border-default);box-shadow:var(--shadow-sm)}
.aura-card--interactive:active{background:var(--bg-hover)}
.aura-card__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.aura-card__title{font:var(--type-body);font-weight:var(--fw-bold);color:var(--text-primary)}
.aura-card__subtitle{font:var(--type-caption);color:var(--text-secondary);margin-top:3px}
.aura-card--pad-sm{padding:14px 16px}
.aura-card--pad-md{padding:20px 22px}
.aura-card--pad-lg{padding:32px}
.aura-card--pad-none{padding:0}
.aura-card__head+*{margin-top:14px}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-card')) {
    const s = document.createElement('style');
    s.id = 'aura-css-card';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Card({
  title,
  subtitle,
  actions,
  padding = 'md',
  interactive = false,
  children,
  className = '',
  ...rest
}) {
  css();
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `aura-card aura-card--pad-${padding}${interactive ? ' aura-card--interactive' : ''} ${className}`
  }, rest), (title || actions) && /*#__PURE__*/React.createElement("div", {
    className: "aura-card__head"
  }, /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("div", {
    className: "aura-card__title"
  }, title), subtitle && /*#__PURE__*/React.createElement("div", {
    className: "aura-card__subtitle"
  }, subtitle)), actions), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* Onda · Icon — kanonisches Set des Systems. Lucide-Pfade (ISC), 24er-Raster, Strichstärke 1.75, currentColor.
   Eigene Glyphen werden nicht gezeichnet: fehlt ein Symbol, kommt der Pfad hier dazu. */
const P = {
  'file-text': ['M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', 'M14 2v4a2 2 0 0 0 2 2h4', 'M10 9H8', 'M16 13H8', 'M16 17H8'],
  'folder': ['M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'],
  'archive': ['M2 3h20v5H2z', 'M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8', 'M10 12h4'],
  'users': ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  'plus': ['M5 12h14', 'M12 5v14'],
  'search': ['M21 21l-4.34-4.34', 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z'],
  'share': ['M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M16 6l-4-4-4 4', 'M12 2v13'],
  'send': ['M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z', 'M21.854 2.147 10.914 13.086'],
  'paperclip': ['m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48'],
  'link': ['M9 17H7A5 5 0 0 1 7 7h2', 'M15 7h2a5 5 0 1 1 0 10h-2', 'M8 12h8'],
  'type': ['M12 4v16', 'M4 7V4h16v3', 'M9 20h6'],
  'scissors': ['M9.121 9.121 5.88 5.88a3 3 0 1 0-1.06 1.06Z', 'M14.879 14.879 18.12 18.12a3 3 0 1 1-1.06-1.06Z', 'M20 4 8.12 15.88', 'M14.8 14.8 20 20', 'M4 4l7.2 7.2'],
  'arrow-up-down': ['m21 16-4 4-4-4', 'M17 20V4', 'm3 8 4-4 4 4', 'M7 4v16'],
  'list': ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  'help-circle': ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3', 'M12 17h.01'],
  'square': ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z'],
  'check': ['M20 6 9 17l-5-5'],
  'x': ['M18 6 6 18', 'M6 6l12 12'],
  'sun': ['M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'],
  'moon': ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'],
  'more-horizontal': ['M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z', 'M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z', 'M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'],
  'chevron-left': ['m15 18-6-6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  'clock': ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 6v6l4 2'],
  'sparkle': ['M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z'],
  'book-open': ['M12 7v14', 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z'],
  'settings': ['M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  'history': ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5', 'M12 7v5l4 2'],
  'quote': ['M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z', 'M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z']
};
const iconNames = Object.keys(P);
function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  style,
  ...rest
}) {
  const d = P[name] || P['file-text'];
  return /*#__PURE__*/React.createElement("svg", _extends({
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: style,
    "aria-hidden": "true"
  }, rest), d.map((p, i) => /*#__PURE__*/React.createElement("path", {
    key: i,
    d: p
  })));
}
Object.assign(__ds_scope, { iconNames, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Icon.jsx", error: String((e && e.message) || e) }); }

// components/annotation/Annotation.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-note{display:flex;flex-direction:column;gap:11px;padding:16px 18px;background:var(--bg-surface);border-radius:var(--radius-panel);box-shadow:var(--shadow-xs);font-family:var(--font-sans);text-align:left;transition:box-shadow var(--dur-quick) var(--ease-out),background-color var(--dur-fast) var(--ease-out);animation:aura-note-in var(--dur-normal) var(--ease-out)}
.aura-note--interactive{cursor:pointer}
.aura-note--collapsed{gap:7px;padding:13px 16px}
.aura-note--collapsed .aura-note__body{font:var(--type-body);color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.aura-note--interactive:hover{box-shadow:var(--shadow-sm)}
.aura-note--active{box-shadow:var(--shadow-sm)}
.aura-note__head{display:flex;align-items:baseline;gap:9px;font:var(--type-label);color:var(--text-primary)}
.aura-note__head svg{flex:none;align-self:center;color:var(--text-tertiary)}
.aura-note__n{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:var(--radius-full);background:var(--bg-sunken);color:var(--text-secondary);font:var(--type-caption);font-variant-numeric:tabular-nums;align-self:center}
.aura-note--active .aura-note__n{background:var(--accent);color:var(--on-accent)}
.aura-note__scope{margin-left:auto;font:var(--type-body);color:var(--text-tertiary)}
.aura-note__body{font:var(--type-body);color:var(--text-primary);text-wrap:pretty}
.aura-note__body p{margin:0}
.aura-note__block{display:flex;flex-direction:column;gap:7px;padding:13px 15px;background:var(--bg-sunken);border-radius:var(--radius-panel)}
.aura-note__from{font:var(--type-body);color:var(--text-tertiary);text-decoration:line-through;text-decoration-thickness:1px}
.aura-note__to{font:var(--type-body);color:var(--text-primary)}
.aura-note__move{display:flex;align-items:center;gap:8px;font:var(--type-body);color:var(--text-secondary)}
.aura-note__srclink{display:inline-flex;align-items:center;gap:7px;font:var(--type-label);color:var(--text-link);text-decoration:none}
.aura-note__srclink:hover{text-decoration:underline;text-underline-offset:2px}
.aura-note__excerpt{font:var(--type-body);line-height:var(--leading-relaxed);color:var(--text-secondary);border-left:2px solid var(--border-default);padding-left:11px}
.aura-note__compare{display:flex;flex-direction:column;gap:10px;padding:13px 15px;background:var(--bg-sunken);border-radius:var(--radius-panel)}
.aura-note__cmp{display:flex;flex-direction:column;gap:2px}
.aura-note__cmpref{font:var(--type-caption);color:var(--text-tertiary)}
.aura-note__cmptext{font:var(--type-body);color:var(--text-primary)}
.aura-note__count{font:var(--type-caption);color:var(--text-tertiary);font-variant-numeric:tabular-nums}
.aura-note__prio{font:var(--type-caption);color:var(--text-tertiary)}
.aura-note__prio--muss{color:var(--danger)}
.aura-note__why{align-self:flex-start;padding:0;border:none;background:transparent;font:var(--type-caption);color:var(--text-link);cursor:pointer;text-decoration:underline;text-underline-offset:2px}
.aura-note__rule{font:var(--type-caption);line-height:var(--leading-normal);color:var(--text-secondary);padding:11px 13px;background:var(--bg-sunken);border-radius:var(--radius-panel)}
.aura-note__conflict{font:var(--type-caption);color:var(--text-tertiary)}
.aura-note__srcmeta{font:var(--type-caption);color:var(--text-tertiary)}
.aura-note__acts{display:flex;align-items:center;gap:8px}
.aura-note__btn{height:32px;padding:0 16px;border:1px solid transparent;border-radius:var(--radius-control);font-family:var(--font-sans);font-size:var(--text-base);font-weight:var(--fw-medium);cursor:pointer;transition:var(--transition-colors),transform var(--dur-fast) var(--ease-out);white-space:nowrap}
.aura-note__btn:active{transform:scale(0.98)}
.aura-note__btn--primary{background:var(--accent);color:var(--on-accent)}
.aura-note__btn--primary:hover{background:var(--accent-hover)}
.aura-note__btn--ghost{background:transparent;color:var(--text-secondary)}
.aura-note__btn--ghost:hover{background:var(--bg-hover);color:var(--text-primary)}
@keyframes aura-note-in{from{opacity:0;transform:translateY(6px)}}
@media (prefers-reduced-motion:reduce){.aura-note{animation:none}}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-note')) {
    const s = document.createElement('style');
    s.id = 'aura-css-note';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Annotation({
  kind = 'anmerkung',
  scope,
  n,
  count,
  priority,
  why,
  conflict,
  suggestion,
  move,
  source,
  compare,
  active = false,
  collapsed = false,
  acceptLabel,
  secondaryLabel,
  onSecondary,
  onAccept,
  onDismiss,
  onClick,
  children,
  className = '',
  ...rest
}) {
  css();
  const {
    label,
    icon
  } = __ds_scope.kindInfo(kind);
  const prio = priority || __ds_scope.PRIORITY_OF[kind];
  const [showWhy, setShowWhy] = React.useState(false);
  const primary = acceptLabel || (suggestion ? 'Übernehmen' : move ? 'Verschieben' : source ? 'Beleg einfügen' : null);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `aura-note${active ? ' aura-note--active' : ''}${collapsed ? ' aura-note--collapsed' : ''}${onClick ? ' aura-note--interactive' : ''} ${className}`,
    onClick: onClick
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "aura-note__head"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 13
  }), /*#__PURE__*/React.createElement("span", null, label), n != null && /*#__PURE__*/React.createElement("span", {
    className: "aura-note__n"
  }, n), count != null && /*#__PURE__*/React.createElement("span", {
    className: "aura-note__count"
  }, count, "\xD7"), prio && /*#__PURE__*/React.createElement("span", {
    className: `aura-note__prio${prio === 'muss' ? ' aura-note__prio--muss' : ''}`
  }, __ds_scope.PRIORITY[prio]), scope && /*#__PURE__*/React.createElement("span", {
    className: "aura-note__scope"
  }, scope)), children && /*#__PURE__*/React.createElement("div", {
    className: "aura-note__body"
  }, children), !collapsed && suggestion && /*#__PURE__*/React.createElement("div", {
    className: "aura-note__block"
  }, suggestion.from && /*#__PURE__*/React.createElement("span", {
    className: "aura-note__from"
  }, suggestion.from), suggestion.to && /*#__PURE__*/React.createElement("span", {
    className: "aura-note__to"
  }, suggestion.to)), !collapsed && move && /*#__PURE__*/React.createElement("div", {
    className: "aura-note__block"
  }, /*#__PURE__*/React.createElement("span", {
    className: "aura-note__move"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-up-down",
    size: 13
  }), move.to)), !collapsed && compare && /*#__PURE__*/React.createElement("div", {
    className: "aura-note__compare"
  }, compare.map((c, i) => /*#__PURE__*/React.createElement("span", {
    className: "aura-note__cmp",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "aura-note__cmpref"
  }, c.ref), /*#__PURE__*/React.createElement("span", {
    className: "aura-note__cmptext"
  }, c.text)))), !collapsed && source && /*#__PURE__*/React.createElement("div", {
    className: "aura-note__block"
  }, source.url && /*#__PURE__*/React.createElement("a", {
    className: "aura-note__srclink",
    href: source.url,
    target: "_blank",
    rel: "noreferrer"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "link",
    size: 13
  }), source.title || source.url), source.excerpt && /*#__PURE__*/React.createElement("span", {
    className: "aura-note__excerpt"
  }, source.excerpt), source.meta && /*#__PURE__*/React.createElement("span", {
    className: "aura-note__srcmeta"
  }, source.meta)), !collapsed && conflict && /*#__PURE__*/React.createElement("span", {
    className: "aura-note__conflict"
  }, "Schlie\xDFt aus: ", conflict), !collapsed && why && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-note__why",
    onClick: e => {
      e.stopPropagation();
      setShowWhy(v => !v);
    }
  }, showWhy ? 'Regel ausblenden' : 'Warum?'), !collapsed && why && showWhy && /*#__PURE__*/React.createElement("span", {
    className: "aura-note__rule"
  }, why), !collapsed && (primary || onDismiss) && /*#__PURE__*/React.createElement("div", {
    className: "aura-note__acts"
  }, primary && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-note__btn aura-note__btn--primary",
    onClick: onAccept
  }, primary), onDismiss && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-note__btn aura-note__btn--ghost",
    onClick: onDismiss
  }, primary ? 'Verwerfen' : 'Verstanden'), onSecondary && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-note__btn aura-note__btn--ghost",
    onClick: onSecondary
  }, secondaryLabel || 'Andere Quelle')));
}
Object.assign(__ds_scope, { Annotation });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/annotation/Annotation.jsx", error: String((e && e.message) || e) }); }

// components/annotation/Correction.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-corr{position:relative;display:inline}
.aura-corr__pop{position:absolute;left:0;top:calc(100% + 10px);z-index:5;display:inline-flex;align-items:center;gap:12px;padding:9px 10px 9px 16px;background:var(--bg-surface);border-radius:var(--radius-panel);box-shadow:var(--shadow-md);font:var(--type-body);letter-spacing:var(--tracking-normal);color:var(--text-primary);white-space:nowrap;animation:aura-corr-in var(--dur-normal) var(--ease-out)}
.aura-corr__pop--right{left:auto;right:0}
.aura-corr__from{color:var(--text-tertiary);text-decoration:line-through;text-decoration-thickness:1px}
.aura-corr__sep{color:var(--text-tertiary);display:inline-flex}
.aura-corr__to{font-weight:var(--fw-medium)}
.aura-corr__note{color:var(--text-secondary)}
.aura-corr__ok{height:32px;padding:0 16px;border:none;border-radius:var(--radius-control);background:var(--accent);color:var(--on-accent);font-family:var(--font-sans);font-size:var(--text-base);font-weight:var(--fw-medium);cursor:pointer;transition:var(--transition-colors)}
.aura-corr__ok:hover{background:var(--accent-hover)}
.aura-corr__x{width:32px;height:32px;flex:none;display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:var(--radius-control);background:transparent;color:var(--text-tertiary);cursor:pointer;transition:var(--transition-colors)}
.aura-corr__x:hover{background:var(--bg-hover);color:var(--text-primary)}
@keyframes aura-corr-in{from{opacity:0;transform:translateY(-4px)}}
@media (prefers-reduced-motion:reduce){.aura-corr__pop{animation:none}}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-corr')) {
    const s = document.createElement('style');
    s.id = 'aura-css-corr';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Correction({
  kind = 'rechtschreibung',
  to,
  note,
  align = 'left',
  open = false,
  onAccept,
  onDismiss,
  onClick,
  children,
  ...rest
}) {
  css();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: "aura-corr"
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Mark, {
    kind: kind,
    active: open,
    onClick: onClick
  }, children), open && /*#__PURE__*/React.createElement("span", {
    className: `aura-corr__pop${align === 'right' ? ' aura-corr__pop--right' : ''}`
  }, to && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "aura-corr__from"
  }, children), /*#__PURE__*/React.createElement("span", {
    className: "aura-corr__sep"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-right",
    size: 14
  })), /*#__PURE__*/React.createElement("span", {
    className: "aura-corr__to"
  }, to)), note && /*#__PURE__*/React.createElement("span", {
    className: "aura-corr__note"
  }, note), onAccept && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-corr__ok",
    onClick: onAccept
  }, "\xDCbernehmen"), onDismiss && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-corr__x",
    "aria-label": "Verwerfen",
    onClick: onDismiss
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 14
  }))));
}
Object.assign(__ds_scope, { Correction });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/annotation/Correction.jsx", error: String((e && e.message) || e) }); }

// components/conversation/Composer.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-composer{display:flex;align-items:center;gap:8px;padding:7px 7px 7px 10px;background:var(--bg-surface);border:1px solid var(--border-default);border-radius:var(--radius-control);transition:border-color var(--dur-fast) var(--ease-out),box-shadow var(--dur-fast) var(--ease-out),border-radius var(--dur-normal) var(--ease-out)}
.aura-composer--grown{border-radius:var(--radius-panel);align-items:flex-end}
.aura-composer:hover:not(.aura-composer--disabled){border-color:var(--border-strong)}
.aura-composer:focus-within{box-shadow:var(--shadow-focus)}
.aura-composer--disabled{background:var(--bg-sunken);border-color:var(--border-subtle)}
.aura-composer__lead{display:flex;align-items:center;gap:2px;padding-bottom:1px;flex:none}
.aura-composer__input{flex:1;min-width:0;border:none;outline:none;resize:none;background:transparent;font-family:var(--font-sans);font-size:var(--text-base);line-height:22px;color:var(--text-primary);padding:9px 4px;max-height:160px;overflow-y:auto}
.aura-composer__input::placeholder{color:var(--text-tertiary)}
.aura-composer__input:disabled{color:var(--text-disabled);cursor:not-allowed}
.aura-composer__send{width:34px;height:34px;flex:none;display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:var(--radius-control);background:var(--accent);color:var(--on-accent);cursor:pointer;transition:var(--transition-colors),transform var(--dur-fast) var(--ease-out)}
.aura-composer__send:hover:not(:disabled){background:var(--accent-hover)}
.aura-composer__send:active:not(:disabled){transform:scale(0.96)}
.aura-composer__send:disabled{background:var(--bg-sunken);color:var(--text-disabled);cursor:not-allowed}
.aura-composer__stop{display:inline-flex}
.aura-composer__foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 16px 0}
.aura-composer__hint{font:var(--type-caption);color:var(--text-tertiary)}
.aura-composer__count{font:var(--type-caption);color:var(--text-tertiary);font-variant-numeric:tabular-nums}
.aura-composer__count--over{color:var(--danger)}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-composer')) {
    const s = document.createElement('style');
    s.id = 'aura-css-composer';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Composer({
  value,
  defaultValue = '',
  onChange,
  onSubmit,
  onStop,
  placeholder = 'Schreib eine Anweisung …',
  leading,
  hint,
  maxLength,
  busy = false,
  disabled = false,
  rows = 1,
  className = '',
  style,
  ...rest
}) {
  css();
  const controlled = value !== undefined;
  const [inner, setInner] = React.useState(defaultValue);
  const text = controlled ? value : inner;
  const ta = React.useRef(null);
  const [grown, setGrown] = React.useState(false);
  const fit = React.useCallback(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = 'auto';
    const h = Math.min(el.scrollHeight, 160);
    el.style.height = h + 'px';
    setGrown(h > 44);
  }, []);
  React.useLayoutEffect(fit, [text, fit]);
  const set = v => {
    if (!controlled) setInner(v);
    onChange && onChange(v);
  };
  const submit = () => {
    const t = (text || '').trim();
    if (!t || busy || disabled) return;
    onSubmit && onSubmit(t);
    if (!controlled) setInner('');
  };
  const over = maxLength !== undefined && (text || '').length > maxLength;
  return /*#__PURE__*/React.createElement("div", {
    className: className,
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    className: `aura-composer${grown ? ' aura-composer--grown' : ''}${disabled ? ' aura-composer--disabled' : ''}`
  }, leading && /*#__PURE__*/React.createElement("span", {
    className: "aura-composer__lead"
  }, leading), /*#__PURE__*/React.createElement("textarea", _extends({
    ref: ta,
    className: "aura-composer__input",
    rows: rows,
    value: text,
    placeholder: placeholder,
    disabled: disabled,
    onChange: e => set(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    }
  }, rest)), busy ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-composer__send",
    onClick: onStop,
    "aria-label": "Antwort anhalten"
  }, /*#__PURE__*/React.createElement("span", {
    className: "aura-composer__stop"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "square",
    size: 13
  }))) : /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-composer__send",
    onClick: submit,
    disabled: disabled || !(text || '').trim() || over,
    "aria-label": "Senden"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "send",
    size: 15
  }))), (hint || maxLength !== undefined) && /*#__PURE__*/React.createElement("div", {
    className: "aura-composer__foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "aura-composer__hint"
  }, hint), maxLength !== undefined && /*#__PURE__*/React.createElement("span", {
    className: `aura-composer__count${over ? ' aura-composer__count--over' : ''}`
  }, (text || '').length, "/", maxLength)));
}
Object.assign(__ds_scope, { Composer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/conversation/Composer.jsx", error: String((e && e.message) || e) }); }

// components/display/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-tag{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 12px;border-radius:var(--radius-control);background:var(--bg-sunken);border:1px solid var(--border-subtle);font-family:var(--font-sans);font-size:var(--text-xs);font-weight:var(--fw-medium);color:var(--text-secondary);white-space:nowrap;transition:var(--transition-colors)}
.aura-tag--interactive{cursor:pointer}
.aura-tag--interactive:hover{border-color:var(--border-strong);color:var(--text-primary)}
.aura-tag__x{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;margin-right:-4px;border-radius:var(--radius-control);border:none;background:transparent;color:var(--text-tertiary);cursor:pointer;padding:0;transition:var(--transition-colors)}
.aura-tag__x:hover{color:var(--danger);background:var(--bg-active)}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-tag')) {
    const s = document.createElement('style');
    s.id = 'aura-css-tag';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Tag({
  onRemove,
  onClick,
  children,
  ...rest
}) {
  css();
  return /*#__PURE__*/React.createElement("span", _extends({
    className: `aura-tag${onClick ? ' aura-tag--interactive' : ''}`,
    onClick: onClick
  }, rest), children, onRemove && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-tag__x",
    "aria-label": "Entfernen",
    onClick: e => {
      e.stopPropagation();
      onRemove();
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "9",
    height: "9",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }))));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
const CSS = `
.aura-dialog__scrim{position:fixed;inset:0;background:rgba(28,26,23,.4);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;z-index:100;animation:aura-fade var(--dur-normal) var(--ease-out)}
[data-theme="dark"] .aura-dialog__scrim{background:rgba(0,0,0,.55)}
.aura-dialog{background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-overlay);box-shadow:var(--shadow-xl);width:100%;min-width:0;display:flex;flex-direction:column;animation:aura-rise var(--dur-normal) var(--ease-out)}
.aura-dialog__head{padding:26px 28px 0;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.aura-dialog__title{font:var(--type-title);color:var(--text-primary)}
.aura-dialog__desc{font:var(--type-body);color:var(--text-secondary);margin-top:6px}
.aura-dialog__body{padding:20px 28px}
.aura-dialog__foot{padding:0 28px 26px;display:flex;justify-content:flex-end;gap:8px}
.aura-dialog__x{flex:none;display:flex;align-items:center;justify-content:center;width:32px;height:32px;margin:-6px -8px 0 0;border:none;background:transparent;color:var(--text-tertiary);border-radius:var(--radius-control);cursor:pointer;transition:var(--transition-colors)}
.aura-dialog__x:hover{background:var(--bg-hover);color:var(--text-primary)}
@keyframes aura-fade{from{opacity:0}}
@keyframes aura-rise{from{opacity:0;transform:translateY(8px) scale(.985)}}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-dialog')) {
    const s = document.createElement('style');
    s.id = 'aura-css-dialog';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  width = 440,
  children
}) {
  css();
  React.useEffect(() => {
    if (!open) return;
    const h = e => {
      if (e.key === 'Escape') onClose && onClose();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "aura-dialog__scrim",
    onMouseDown: e => {
      if (e.target === e.currentTarget && onClose) onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "aura-dialog",
    role: "dialog",
    "aria-modal": "true",
    style: {
      maxWidth: width
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "aura-dialog__head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "aura-dialog__title"
  }, title), description && /*#__PURE__*/React.createElement("div", {
    className: "aura-dialog__desc"
  }, description)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-dialog__x",
    "aria-label": "Schlie\xDFen",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  })))), children && /*#__PURE__*/React.createElement("div", {
    className: "aura-dialog__body"
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "aura-dialog__foot"
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ICONS = {
  success: /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21.801 10A10 10 0 1 1 17 3.335"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m9 11 3 3L22 4"
  })),
  danger: /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m15 9-6 6M9 9l6 6"
  })),
  warning: /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4M12 17h.01"
  })),
  info: /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 16v-4M12 8h.01"
  }))
};
const CSS = `
.aura-toast{display:flex;align-items:flex-start;gap:11px;width:min(340px,100%);padding:16px 18px;background:var(--bg-raised);border:1px solid var(--border-default);border-radius:var(--radius-overlay);box-shadow:var(--shadow-lg);font-family:var(--font-sans);animation:aura-toast-in var(--dur-normal) var(--ease-out)}
.aura-toast__icon{flex:none;margin-top:1px}
.aura-toast__icon--success{color:var(--text-secondary)}.aura-toast__icon--danger{color:var(--danger)}.aura-toast__icon--warning{color:var(--text-secondary)}.aura-toast__icon--info{color:var(--text-secondary)}
.aura-toast--danger{box-shadow:var(--shadow-lg),inset 0 0 0 1px var(--danger-tint)}
.aura-toast__body{flex:1;display:flex;flex-direction:column;gap:2px}
.aura-toast__title{font:var(--type-label);color:var(--text-primary)}
.aura-toast__desc{font:var(--type-caption);color:var(--text-secondary)}
.aura-toast__action{align-self:flex-start;margin-top:6px;font:var(--type-label);color:var(--text-link);background:none;border:none;padding:0;cursor:pointer}
.aura-toast__action:hover{color:var(--accent-active);text-decoration:underline}
.aura-toast__x{flex:none;border:none;background:transparent;color:var(--text-tertiary);cursor:pointer;padding:3px;border-radius:var(--radius-control);transition:var(--transition-colors)}
.aura-toast__x:hover{color:var(--text-primary);background:var(--bg-hover)}
@keyframes aura-toast-in{from{opacity:0;transform:translateY(8px)}}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-toast')) {
    const s = document.createElement('style');
    s.id = 'aura-css-toast';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Toast({
  tone = 'info',
  title,
  description,
  actionLabel,
  onAction,
  onDismiss,
  ...rest
}) {
  css();
  return /*#__PURE__*/React.createElement("div", _extends({
    className: `aura-toast${tone === 'danger' ? ' aura-toast--danger' : ''}`,
    role: "status"
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: `aura-toast__icon aura-toast__icon--${tone}`
  }, ICONS[tone] || ICONS.info), /*#__PURE__*/React.createElement("div", {
    className: "aura-toast__body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "aura-toast__title"
  }, title), description && /*#__PURE__*/React.createElement("span", {
    className: "aura-toast__desc"
  }, description), actionLabel && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-toast__action",
    onClick: onAction
  }, actionLabel)), onDismiss && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "aura-toast__x",
    "aria-label": "Ausblenden",
    onClick: onDismiss
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18M6 6l12 12"
  }))));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
const CSS = `
.aura-tip{position:relative;display:inline-flex}
.aura-tip__bubble{position:absolute;left:50%;transform:translateX(-50%) translateY(2px);bottom:calc(100% + 7px);background:var(--ink-900);color:#f4f1ea;font-family:var(--font-sans);font-size:var(--text-xs);font-weight:var(--fw-medium);line-height:1.3;padding:6px 12px;border-radius:var(--radius-control);white-space:nowrap;pointer-events:none;opacity:0;transition:opacity var(--dur-quick) var(--ease-out) 300ms,transform var(--dur-quick) var(--ease-out) 300ms;z-index:60}
[data-theme="dark"] .aura-tip__bubble{background:var(--surface-3);color:var(--text-primary);border:1px solid var(--border-default)}
.aura-tip__bubble--bottom{bottom:auto;top:calc(100% + 7px);transform:translateX(-50%) translateY(-2px)}
.aura-tip:hover .aura-tip__bubble,.aura-tip:focus-within .aura-tip__bubble{opacity:1;transform:translateX(-50%) translateY(0)}
.aura-tip kbd{font-family:var(--font-sans);font-size:var(--text-xs);opacity:.6;margin-left:7px}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-tip')) {
    const s = document.createElement('style');
    s.id = 'aura-css-tip';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Tooltip({
  label,
  shortcut,
  side = 'top',
  children
}) {
  css();
  return /*#__PURE__*/React.createElement("span", {
    className: "aura-tip"
  }, children, /*#__PURE__*/React.createElement("span", {
    className: `aura-tip__bubble${side === 'bottom' ? ' aura-tip__bubble--bottom' : ''}`,
    role: "tooltip"
  }, label, shortcut && /*#__PURE__*/React.createElement("kbd", null, shortcut)));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/inputs/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-check{display:inline-flex;align-items:flex-start;gap:9px;cursor:pointer;font-family:var(--font-sans);position:relative}
.aura-check input{position:absolute;opacity:0;width:0;height:0}
.aura-check__box{width:16px;height:16px;flex:none;margin-top:2px;border-radius:var(--radius-sm);border:1px solid var(--border-strong);background:var(--bg-surface);display:flex;align-items:center;justify-content:center;transition:var(--transition-colors),box-shadow var(--dur-fast) var(--ease-out)}
.aura-check__box svg{opacity:0;transform:scale(.6);transition:opacity var(--dur-fast) var(--ease-out),transform var(--dur-quick) var(--ease-out);color:var(--on-accent)}
.aura-check:hover input:not(:disabled)~.aura-check__box{border-color:var(--text-tertiary)}
.aura-check input:checked~.aura-check__box{background:var(--accent);border-color:var(--accent)}
.aura-check input:checked~.aura-check__box svg{opacity:1;transform:scale(1)}
.aura-check input:focus-visible~.aura-check__box{box-shadow:var(--shadow-focus)}
.aura-check input:disabled~*{opacity:.5;cursor:not-allowed}
.aura-check__text{display:flex;flex-direction:column;gap:2px}
.aura-check__label{font-size:var(--text-base);line-height:20px;color:var(--text-primary)}
.aura-check__desc{font:var(--type-caption);color:var(--text-tertiary)}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-check')) {
    const s = document.createElement('style');
    s.id = 'aura-css-check';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Checkbox({
  label,
  description,
  style,
  ...rest
}) {
  css();
  return /*#__PURE__*/React.createElement("label", {
    className: "aura-check",
    style: style
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox"
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "aura-check__box"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  }))), (label || description) && /*#__PURE__*/React.createElement("span", {
    className: "aura-check__text"
  }, /*#__PURE__*/React.createElement("span", {
    className: "aura-check__label"
  }, label), description && /*#__PURE__*/React.createElement("span", {
    className: "aura-check__desc"
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/inputs/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-field{display:flex;flex-direction:column;gap:6px;font-family:var(--font-sans)}
.aura-field__label{font:var(--type-label);color:var(--text-primary)}
.aura-field__hint{font:var(--type-caption);color:var(--text-tertiary)}
.aura-field__hint--error{color:var(--danger)}
.aura-input{height:40px;padding:0 16px;font-family:var(--font-sans);font-size:var(--text-base);color:var(--text-primary);background:var(--bg-surface);border:1px solid var(--border-default);border-radius:var(--radius-control);transition:var(--transition-colors),box-shadow var(--dur-fast) var(--ease-out);outline:none;width:100%}
.aura-input::placeholder{color:var(--text-tertiary)}
.aura-input:hover:not(:disabled):not(:focus){border-color:var(--border-strong)}
.aura-input:focus{box-shadow:var(--shadow-focus)}
.aura-input:disabled{background:var(--bg-sunken);color:var(--text-disabled);cursor:not-allowed}
.aura-input--error{border-color:var(--danger)}
.aura-input--error:focus{box-shadow:0 0 0 4px var(--danger-tint)}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-input')) {
    const s = document.createElement('style');
    s.id = 'aura-css-input';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Input({
  label,
  hint,
  error,
  id,
  style,
  ...rest
}) {
  css();
  const uid = React.useRef(id || 'in-' + Math.random().toString(36).slice(2, 7)).current;
  return /*#__PURE__*/React.createElement("div", {
    className: "aura-field",
    style: style
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "aura-field__label",
    htmlFor: uid
  }, label), /*#__PURE__*/React.createElement("input", _extends({
    id: uid,
    className: `aura-input${error ? ' aura-input--error' : ''}`,
    "aria-invalid": !!error
  }, rest)), (error || hint) && /*#__PURE__*/React.createElement("span", {
    className: `aura-field__hint${error ? ' aura-field__hint--error' : ''}`
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/Input.jsx", error: String((e && e.message) || e) }); }

// components/inputs/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-radio{display:inline-flex;align-items:flex-start;gap:9px;cursor:pointer;font-family:var(--font-sans);position:relative}
.aura-radio input{position:absolute;opacity:0;width:0;height:0}
.aura-radio__dot{width:16px;height:16px;flex:none;margin-top:2px;border-radius:var(--radius-full);border:1px solid var(--border-strong);background:var(--bg-surface);display:flex;align-items:center;justify-content:center;transition:var(--transition-colors),box-shadow var(--dur-fast) var(--ease-out)}
.aura-radio__dot::after{content:"";width:6px;height:6px;border-radius:var(--radius-full);background:var(--on-accent);transform:scale(0);transition:transform var(--dur-quick) var(--ease-out)}
.aura-radio:hover input:not(:disabled)~.aura-radio__dot{border-color:var(--text-tertiary)}
.aura-radio input:checked~.aura-radio__dot{background:var(--accent);border-color:var(--accent)}
.aura-radio input:checked~.aura-radio__dot::after{transform:scale(1)}
.aura-radio input:focus-visible~.aura-radio__dot{box-shadow:var(--shadow-focus)}
.aura-radio input:disabled~*{opacity:.5;cursor:not-allowed}
.aura-radio__label{font-size:var(--text-base);line-height:20px;color:var(--text-primary)}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-radio')) {
    const s = document.createElement('style');
    s.id = 'aura-css-radio';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Radio({
  label,
  style,
  ...rest
}) {
  css();
  return /*#__PURE__*/React.createElement("label", {
    className: "aura-radio",
    style: style
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "radio"
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "aura-radio__dot"
  }), label && /*#__PURE__*/React.createElement("span", {
    className: "aura-radio__label"
  }, label));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/Radio.jsx", error: String((e && e.message) || e) }); }

// components/inputs/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-select-wrap{position:relative;display:flex}
.aura-select{appearance:none;-webkit-appearance:none;height:40px;padding:0 36px 0 16px;font-family:var(--font-sans);font-size:var(--text-base);color:var(--text-primary);background:var(--bg-surface);border:1px solid var(--border-default);border-radius:var(--radius-control);transition:var(--transition-colors),box-shadow var(--dur-fast) var(--ease-out);outline:none;width:100%;cursor:pointer}
.aura-select:hover:not(:disabled):not(:focus){border-color:var(--border-strong)}
.aura-select:focus{box-shadow:var(--shadow-focus)}
.aura-select:disabled{background:var(--bg-sunken);color:var(--text-disabled);cursor:not-allowed}
.aura-select-wrap svg{position:absolute;right:14px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text-tertiary)}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-select')) {
    const s = document.createElement('style');
    s.id = 'aura-css-select';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Select({
  label,
  hint,
  error,
  id,
  style,
  options,
  children,
  ...rest
}) {
  css();
  const uid = React.useRef(id || 'se-' + Math.random().toString(36).slice(2, 7)).current;
  return /*#__PURE__*/React.createElement("div", {
    className: "aura-field",
    style: style
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "aura-field__label",
    htmlFor: uid
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "aura-select-wrap"
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: uid,
    className: "aura-select",
    "aria-invalid": !!error
  }, rest), options ? options.map(o => typeof o === 'string' ? /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o) : /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label)) : children), /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  }))), (error || hint) && /*#__PURE__*/React.createElement("span", {
    className: `aura-field__hint${error ? ' aura-field__hint--error' : ''}`
  }, error || hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/Select.jsx", error: String((e && e.message) || e) }); }

// components/inputs/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-switch{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-family:var(--font-sans);position:relative}
.aura-switch input{position:absolute;opacity:0;width:0;height:0}
.aura-switch__track{width:34px;height:20px;flex:none;border-radius:var(--radius-md);background:var(--ink-200);position:relative;transition:background-color var(--dur-quick) var(--ease-out),box-shadow var(--dur-fast) var(--ease-out)}
[data-theme="dark"] .aura-switch__track{background:var(--surface-3)}
.aura-switch__track::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:var(--radius-sm);background:#fff;box-shadow:0 1px 2px rgba(28,26,23,.2);transition:transform var(--dur-quick) var(--ease-out)}
.aura-switch input:checked~.aura-switch__track{background:var(--accent)}
.aura-switch input:checked~.aura-switch__track::after{transform:translateX(14px)}
.aura-switch input:focus-visible~.aura-switch__track{box-shadow:var(--shadow-focus)}
.aura-switch input:disabled~*{opacity:.5;cursor:not-allowed}
.aura-switch__label{font-size:var(--text-base);color:var(--text-primary)}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-switch')) {
    const s = document.createElement('style');
    s.id = 'aura-css-switch';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Switch({
  label,
  style,
  ...rest
}) {
  css();
  return /*#__PURE__*/React.createElement("label", {
    className: "aura-switch",
    style: style
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch"
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: "aura-switch__track"
  }), label && /*#__PURE__*/React.createElement("span", {
    className: "aura-switch__label"
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/Switch.jsx", error: String((e && e.message) || e) }); }

// components/inputs/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.aura-textarea{min-height:96px;padding:12px 16px;font-family:var(--font-sans);font-size:var(--text-base);line-height:var(--leading-normal);color:var(--text-primary);background:var(--bg-surface);border:1px solid var(--border-default);border-radius:var(--radius-panel);transition:var(--transition-colors),box-shadow var(--dur-fast) var(--ease-out);outline:none;width:100%;resize:vertical}
.aura-textarea::placeholder{color:var(--text-tertiary)}
.aura-textarea:hover:not(:disabled):not(:focus){border-color:var(--border-strong)}
.aura-textarea:focus{box-shadow:var(--shadow-focus)}
.aura-textarea:disabled{background:var(--bg-sunken);color:var(--text-disabled);cursor:not-allowed}
.aura-textarea--error{border-color:var(--danger)}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-textarea')) {
    const s = document.createElement('style');
    s.id = 'aura-css-textarea';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Textarea({
  label,
  hint,
  error,
  id,
  style,
  rows = 4,
  ...rest
}) {
  css();
  const uid = React.useRef(id || 'ta-' + Math.random().toString(36).slice(2, 7)).current;
  return /*#__PURE__*/React.createElement("div", {
    className: "aura-field",
    style: style
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "aura-field__label",
    htmlFor: uid
  }, label), /*#__PURE__*/React.createElement("textarea", _extends({
    id: uid,
    rows: rows,
    className: `aura-textarea${error ? ' aura-textarea--error' : ''}`,
    "aria-invalid": !!error
  }, rest)), (error || hint) && /*#__PURE__*/React.createElement("span", {
    className: `aura-field__hint${error ? ' aura-field__hint--error' : ''}`
  }, error || hint));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/inputs/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
const CSS = `
.aura-tabs{display:flex;gap:6px;font-family:var(--font-sans)}
.aura-tabs__tab{position:relative;border:none;background:transparent;padding:8px 16px;font-size:var(--text-base);font-weight:var(--fw-medium);color:var(--text-tertiary);cursor:pointer;border-radius:var(--radius-control);transition:var(--transition-colors);display:inline-flex;align-items:baseline;gap:7px}
.aura-tabs__tab:hover{color:var(--text-secondary);background:var(--bg-hover)}
.aura-tabs__tab--active{color:var(--text-primary);background:var(--bg-sunken)}
.aura-tabs__count{font-family:var(--font-sans);font-size:var(--text-xs);color:var(--text-tertiary);font-variant-numeric:tabular-nums}
.aura-tabs__tab--active .aura-tabs__count{color:var(--text-secondary)}
.aura-seg{display:inline-flex;gap:2px;padding:3px;border:1px solid var(--border-default);border-radius:var(--radius-control);font-family:var(--font-sans)}
.aura-seg__tab{border:none;background:transparent;padding:7px 18px;font-size:var(--text-base);font-weight:var(--fw-medium);color:var(--text-secondary);cursor:pointer;border-radius:var(--radius-control);transition:var(--transition-colors)}
.aura-seg__tab:hover{color:var(--text-primary);background:var(--bg-hover)}
.aura-seg__tab--active{background:var(--bg-sunken);color:var(--text-primary)}
`;
function css() {
  if (typeof document !== 'undefined' && !document.getElementById('aura-css-tabs')) {
    const s = document.createElement('style');
    s.id = 'aura-css-tabs';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
}
function Tabs({
  items,
  active,
  onChange,
  variant = 'underline',
  style
}) {
  css();
  const isSeg = variant === 'segmented';
  return /*#__PURE__*/React.createElement("div", {
    className: isSeg ? 'aura-seg' : 'aura-tabs',
    role: "tablist",
    style: style
  }, items.map(it => {
    const a = it.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.id,
      type: "button",
      role: "tab",
      "aria-selected": a,
      className: isSeg ? `aura-seg__tab${a ? ' aura-seg__tab--active' : ''}` : `aura-tabs__tab${a ? ' aura-tabs__tab--active' : ''}`,
      onClick: () => onChange && onChange(it.id)
    }, it.label, it.count != null && !isSeg && /*#__PURE__*/React.createElement("span", {
      className: "aura-tabs__count"
    }, it.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/writing-tool/app.jsx
try { (() => {
(function () {
  const {
    Button,
    Input,
    Select,
    Dialog,
    Toast
  } = window.AuraDesignSystem_6ddaae || {};
  const {
    Icon,
    Sidebar,
    Topbar,
    Home,
    Editor
  } = window.WT || {};
  const DOCS = [{
    id: 1,
    title: 'Quartalsbericht Q3',
    time: 'Bearbeitet vor 2 Std.',
    status: 'Entwurf',
    tags: ['Finanzen', 'Q3'],
    owner: 'Mira Lang',
    shared: true,
    words: 1024,
    snippet: 'Sieben Prozent über Plan, getragen von drei Entwicklungen.',
    paras: ['Das dritte Quartal schließt mit einem Umsatz von 4,8 Mio. € — sieben Prozent über Plan. Drei Entwicklungen tragen das Ergebnis: die neue Preisstruktur, der Ausbau des Partnervertriebs und eine stabilere Auslastung im Kerngeschäft.', 'Für das vierte Quartal erwarten wir moderates Wachstum. Die Pipeline ist gut gefüllt; zwei Großabschlüsse verschieben sich voraussichtlich ins neue Jahr und sind entsprechend konservativ eingeplant.'],
    suggestion: {
      text: 'Die Bruttomarge stieg auf 61 Prozent (Q2: 57 Prozent). Haupttreiber ist der geringere Infrastrukturaufwand nach der Migration; die Einsparung wirkt ab Oktober vollständig.',
      source: 'Quelle: Datenraum Q3'
    }
  }, {
    id: 2,
    title: 'Produktankündigung Herbst',
    time: 'Bearbeitet gestern',
    status: 'Geprüft',
    tags: ['Marketing'],
    owner: 'Jon Beck',
    shared: true,
    words: 640,
    snippet: 'Ankündigungstext für die Herbstversion — Ton ruhig, Nutzen zuerst.',
    paras: ['Die Herbstversion bündelt, was viele von euch angefragt haben: schnellere Entwürfe, verlässlichere Quellen, ein ruhigeres Interface.', 'Verfügbar ab dem 12. Oktober für alle Arbeitsbereiche. Bestehende Dokumente bleiben unverändert.']
  }, {
    id: 3,
    title: 'Interviewleitfaden Nutzerstudie',
    time: 'Bearbeitet vor 3 Tagen',
    status: 'Entwurf',
    tags: ['Research'],
    owner: 'Ada Rossi',
    words: 820,
    snippet: 'Halbstrukturierter Leitfaden, 45 Minuten, sechs Themenblöcke.',
    paras: ['Der Leitfaden führt in 45 Minuten durch sechs Themenblöcke. Einstieg offen halten; konkrete Nachfragen erst ab Block drei.', 'Abschluss: Rückblick auf die Kernaufgabe und eine offene Frage nach dem, was gefehlt hat.']
  }, {
    id: 4,
    title: 'Onboarding-Handbuch',
    time: 'Bearbeitet vor 1 Woche',
    status: 'Veröffentlicht',
    tags: ['Intern'],
    owner: 'Tom Weiß',
    words: 2210,
    snippet: 'Erste Woche, Werkzeuge, Ansprechpartner — als lebendes Dokument gepflegt.',
    paras: ['Dieses Handbuch begleitet die erste Woche: Zugänge, Werkzeuge, Ansprechpartner. Es wird fortlaufend gepflegt; Änderungen sind im Verlauf nachvollziehbar.', 'Bei Fragen zuerst hier nachsehen, dann im Kanal #onboarding fragen.']
  }, {
    id: 5,
    title: 'Wochennotiz KW 29',
    time: 'Bearbeitet vor 5 Min.',
    status: 'Entwurf',
    tags: ['Notiz'],
    owner: 'Mira Lang',
    words: 310,
    snippet: 'Kurzer Wochenrückblick für das Team — drei Punkte, keine Anhänge.',
    paras: ['Drei Punkte aus dieser Woche: der Bericht steht zur Prüfung, die Studie startet Montag, das Archiv ist aufgeräumt.', 'Nächste Woche: Fokus auf den Q4-Plan.']
  }];
  const STEPS_THINKING = [{
    state: 'done',
    label: 'Quellen gelesen'
  }, {
    state: 'done',
    label: 'Struktur erstellt'
  }, {
    state: 'active',
    label: 'Abschnitt 2 schreiben'
  }, {
    state: 'todo',
    label: 'Zitate prüfen'
  }];
  const STEPS_DONE = [{
    state: 'done',
    label: 'Quellen gelesen'
  }, {
    state: 'done',
    label: 'Struktur erstellt'
  }, {
    state: 'done',
    label: 'Abschnitt 2 schreiben'
  }, {
    state: 'done',
    label: 'Zitate prüfen'
  }];
  function ShareDialog({
    open,
    onClose,
    toast
  }) {
    return /*#__PURE__*/React.createElement(Dialog, {
      open: open,
      onClose: onClose,
      title: "Dokument teilen",
      description: "Alle mit dem Link sehen die aktuelle Version.",
      footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
        variant: "ghost",
        onClick: onClose
      }, "Schlie\xDFen"), /*#__PURE__*/React.createElement(Button, {
        onClick: () => {
          toast('success', 'Link kopiert');
          onClose();
        }
      }, "Link kopieren"))
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Input, {
      label: "Link",
      readOnly: true,
      value: "onda.app/d/qb-q3-8f2k"
    }), /*#__PURE__*/React.createElement(Select, {
      label: "Rechte",
      options: ['Lesen', 'Kommentieren', 'Bearbeiten'],
      defaultValue: "Kommentieren"
    })));
  }
  function App() {
    const [screen, setScreen] = React.useState('home');
    const [activeId, setActiveId] = React.useState(1);
    const [tab, setTab] = React.useState('alle');
    const [mode, setMode] = React.useState('edit');
    const [theme, setTheme] = React.useState('light');
    const [agent, setAgent] = React.useState('idle');
    const [suggState, setSuggState] = React.useState('pending');
    const [shareOpen, setShareOpen] = React.useState(false);
    const [toasts, setToasts] = React.useState([]);
    React.useEffect(() => {
      document.documentElement.dataset.theme = theme;
    }, [theme]);
    const toast = (tone, title, description) => {
      const id = Date.now() + Math.random();
      setToasts(t => [...t, {
        id,
        tone,
        title,
        description
      }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3600);
    };
    const doc = DOCS.find(d => d.id === activeId);
    const openDoc = id => {
      setActiveId(id);
      setScreen('editor');
      setMode('edit');
    };
    const goHome = () => setScreen('home');
    const onNew = () => toast('info', 'Noch nicht verdrahtet', 'Demo — legt kein Dokument an.');
    const onSend = () => {
      setAgent('thinking');
      setTimeout(() => {
        setAgent('idle');
        setSuggState('pending');
        toast('success', 'Vorschlag bereit', 'Im Text markiert.');
      }, 2600);
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "wt-app"
    }, /*#__PURE__*/React.createElement(Sidebar, {
      screen: screen,
      docs: DOCS,
      activeId: activeId,
      goHome: goHome,
      openDoc: openDoc,
      onNew: onNew,
      theme: theme,
      toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light')
    }), /*#__PURE__*/React.createElement("div", {
      className: "wt-body"
    }, screen === 'editor' && /*#__PURE__*/React.createElement(Topbar, {
      screen: screen,
      doc: doc,
      goHome: goHome,
      mode: mode,
      setMode: setMode,
      onShare: () => setShareOpen(true),
      agent: agent
    }), screen === 'home' ? /*#__PURE__*/React.createElement(Home, {
      docs: DOCS,
      openDoc: openDoc,
      onNew: onNew,
      tab: tab,
      setTab: setTab
    }) : /*#__PURE__*/React.createElement(Editor, {
      doc: doc,
      mode: mode,
      agent: agent,
      steps: agent === 'thinking' ? STEPS_THINKING : STEPS_DONE,
      suggState: activeId === 1 ? suggState : 'rejected',
      onAccept: () => {
        setSuggState('accepted');
        toast('success', 'Übernommen');
      },
      onReject: () => {
        setSuggState('rejected');
        toast('info', 'Verworfen', 'Der Absatz wurde entfernt.');
      },
      onSend: onSend
    })), /*#__PURE__*/React.createElement(ShareDialog, {
      open: shareOpen,
      onClose: () => setShareOpen(false),
      toast: toast
    }), /*#__PURE__*/React.createElement("div", {
      className: "wt-toaster"
    }, toasts.map(t => /*#__PURE__*/React.createElement(Toast, {
      key: t.id,
      tone: t.tone,
      title: t.title,
      description: t.description,
      onDismiss: () => setToasts(x => x.filter(y => y.id !== t.id))
    }))));
  }
  const mount = document.getElementById('wt-root');
  if (mount && Sidebar && Home && Editor) ReactDOM.createRoot(mount).render(/*#__PURE__*/React.createElement(App, null));
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/writing-tool/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/writing-tool/editor.jsx
try { (() => {
(function () {
  const {
    Button,
    IconButton,
    Badge,
    Tag,
    Composer,
    Aura,
    Card
  } = window.AuraDesignSystem_6ddaae || {};
  const {
    Icon
  } = window.WT || {};
  function Suggestion({
    sugg,
    state,
    onAccept,
    onReject
  }) {
    if (state === 'rejected') return null;
    if (state === 'accepted') return /*#__PURE__*/React.createElement("p", {
      className: "wt-read__p"
    }, sugg.text);
    return /*#__PURE__*/React.createElement("div", {
      className: "wt-sugg"
    }, /*#__PURE__*/React.createElement("div", {
      className: "wt-sugg__head"
    }, /*#__PURE__*/React.createElement(Aura, {
      size: 13,
      state: "quiet"
    }), /*#__PURE__*/React.createElement("span", null, "Vorschlag"), /*#__PURE__*/React.createElement("span", {
      className: "wt-sugg__src"
    }, sugg.source), /*#__PURE__*/React.createElement("span", {
      className: "wt-sugg__acts"
    }, /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "ghost",
      onClick: onReject
    }, "Verwerfen"), /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: "secondary",
      onClick: onAccept
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), "Annehmen"))), /*#__PURE__*/React.createElement("p", null, sugg.text));
  }
  function Step({
    state,
    label
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: `wt-step wt-step--${state}`
    }, state === 'done' ? /*#__PURE__*/React.createElement("span", {
      className: "wt-step__ic"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 12,
      strokeWidth: 2.25
    })) : state === 'active' ? /*#__PURE__*/React.createElement("span", {
      className: "wt-step__ic wt-step__ic--active"
    }) : /*#__PURE__*/React.createElement("span", {
      className: "wt-step__ic wt-step__ic--todo"
    }), /*#__PURE__*/React.createElement("span", null, label));
  }
  function AgentPanel({
    agent,
    steps,
    onSend,
    suggState
  }) {
    return /*#__PURE__*/React.createElement("aside", {
      className: "wt-agent"
    }, /*#__PURE__*/React.createElement("div", {
      className: "wt-agent__head"
    }, /*#__PURE__*/React.createElement(Aura, {
      size: 32,
      state: agent === 'thinking' ? 'thinking' : 'idle'
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "wt-agent__title"
    }, "Agent"), /*#__PURE__*/React.createElement("div", {
      className: "wt-agent__status"
    }, agent === 'thinking' ? 'Entwurf wird geschrieben …' : suggState === 'pending' ? 'Vorschlag bereit — im Text markiert' : 'Bereit'))), /*#__PURE__*/React.createElement("div", {
      className: "wt-agent__label"
    }, "Arbeitsschritte"), /*#__PURE__*/React.createElement("div", {
      className: "wt-agent__steps"
    }, steps.map((s, i) => /*#__PURE__*/React.createElement(Step, {
      key: i,
      state: s.state,
      label: s.label
    }))), /*#__PURE__*/React.createElement("div", {
      className: "wt-agent__spacer"
    }), /*#__PURE__*/React.createElement(Composer, {
      onSubmit: onSend,
      busy: agent === 'thinking',
      disabled: agent === 'thinking',
      placeholder: "Anweisung an den Agenten \u2026",
      leading: /*#__PURE__*/React.createElement(IconButton, {
        size: "sm",
        label: "Quelle anh\xE4ngen"
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "paperclip",
        size: 15
      }))
    }));
  }
  function Editor({
    doc,
    mode,
    agent,
    steps,
    suggState,
    onAccept,
    onReject,
    onSend
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "wt-editor"
    }, /*#__PURE__*/React.createElement("div", {
      className: "wt-read",
      style: mode === 'read' ? {
        maxWidth: 760,
        margin: '0 auto'
      } : null
    }, /*#__PURE__*/React.createElement("div", {
      className: "wt-read__inner"
    }, /*#__PURE__*/React.createElement("h1", {
      className: "wt-read__title"
    }, doc.title), /*#__PURE__*/React.createElement("div", {
      className: "wt-read__meta"
    }, /*#__PURE__*/React.createElement("span", null, "Zuletzt gespeichert 14:32"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, doc.words, " W\xF6rter")), /*#__PURE__*/React.createElement("p", {
      className: "wt-read__p"
    }, doc.paras[0]), doc.suggestion && /*#__PURE__*/React.createElement(Suggestion, {
      sugg: doc.suggestion,
      state: suggState,
      onAccept: onAccept,
      onReject: onReject
    }), doc.paras.slice(1).map((p, i) => /*#__PURE__*/React.createElement("p", {
      key: i,
      className: "wt-read__p"
    }, p)))), mode === 'edit' && /*#__PURE__*/React.createElement(AgentPanel, {
      agent: agent,
      steps: steps,
      onSend: onSend,
      suggState: suggState
    }));
  }
  window.WT = window.WT || {};
  window.WT.Editor = Editor;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/writing-tool/editor.jsx", error: String((e && e.message) || e) }); }

// ui_kits/writing-tool/home.jsx
try { (() => {
(function () {
  const {
    Button,
    Avatar,
    Tabs,
    Input
  } = window.AuraDesignSystem_6ddaae || {};
  const {
    Icon
  } = window.WT || {};
  function Home({
    docs,
    openDoc,
    onNew,
    tab,
    setTab
  }) {
    const shown = tab === 'alle' ? docs : tab === 'geteilt' ? docs.filter(d => d.shared) : docs.filter(d => d.archived);
    return /*#__PURE__*/React.createElement("div", {
      className: "wt-home"
    }, /*#__PURE__*/React.createElement("div", {
      className: "wt-home__head"
    }, /*#__PURE__*/React.createElement("h1", null, "Dokumente"), /*#__PURE__*/React.createElement("span", {
      className: "wt-home__count"
    }, docs.length, " Dokumente \xB7 zuletzt heute 14:32")), /*#__PURE__*/React.createElement("div", {
      className: "wt-bar"
    }, /*#__PURE__*/React.createElement(Tabs, {
      active: tab,
      onChange: setTab,
      items: [{
        id: 'alle',
        label: 'Alle',
        count: docs.length
      }, {
        id: 'geteilt',
        label: 'Geteilt',
        count: docs.filter(d => d.shared).length
      }, {
        id: 'archiv',
        label: 'Archiv'
      }]
    }), /*#__PURE__*/React.createElement("div", {
      className: "wt-bar__right"
    }, /*#__PURE__*/React.createElement(Input, {
      placeholder: "Suchen \u2026",
      style: {
        width: 200
      }
    }), /*#__PURE__*/React.createElement(Button, {
      onClick: onNew
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 15
    }), "Neues Dokument"))), /*#__PURE__*/React.createElement("div", {
      className: "wt-list"
    }, /*#__PURE__*/React.createElement("div", {
      className: "wt-list__head"
    }, /*#__PURE__*/React.createElement("span", null, "Titel"), /*#__PURE__*/React.createElement("span", null, "Status"), /*#__PURE__*/React.createElement("span", null, "Besitzer"), /*#__PURE__*/React.createElement("span", null, "Bearbeitet")), shown.map(d => /*#__PURE__*/React.createElement("button", {
      key: d.id,
      className: "wt-row",
      onClick: () => openDoc(d.id)
    }, /*#__PURE__*/React.createElement("span", {
      className: "wt-row__main"
    }, /*#__PURE__*/React.createElement("span", {
      className: "wt-row__title"
    }, d.title), /*#__PURE__*/React.createElement("span", {
      className: "wt-row__snippet"
    }, d.snippet)), /*#__PURE__*/React.createElement("span", {
      className: `wt-status wt-status--${d.status.toLowerCase()}`
    }, /*#__PURE__*/React.createElement("span", {
      className: "wt-status__dot"
    }), /*#__PURE__*/React.createElement("span", {
      className: "wt-status__label"
    }, d.status)), /*#__PURE__*/React.createElement("span", {
      className: "wt-row__owner"
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: d.owner,
      size: "sm",
      tinted: true
    }), /*#__PURE__*/React.createElement("span", {
      className: "wt-row__cell"
    }, d.owner)), /*#__PURE__*/React.createElement("span", {
      className: "wt-row__cell"
    }, d.time.replace('Bearbeitet ', ''))))));
  }
  window.WT = window.WT || {};
  window.WT.Home = Home;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/writing-tool/home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/writing-tool/icons.jsx
try { (() => {
/* Onda Write · Icon-Shim — das Set lebt im Design System (components/display/Icon.jsx).
   window.WT.Icon löst die DS-Komponente beim ersten Zugriff auf, nicht beim Laden:
   diese Datei wird auch in den Bundle kompiliert und läuft dort, bevor die Namespace-Variable existiert. */
(function () {
  const WT = window.WT = window.WT || {};
  if (Object.prototype.hasOwnProperty.call(WT, 'Icon')) return;
  const resolve = () => {
    const ns = Object.keys(window).find(k => k.startsWith('AuraDesignSystem_'));
    return ns && window[ns] ? window[ns].Icon : undefined;
  };
  Object.defineProperty(WT, 'Icon', {
    configurable: true,
    enumerable: true,
    get() {
      const I = resolve();
      if (I) {
        Object.defineProperty(WT, 'Icon', {
          value: I,
          writable: true,
          configurable: true,
          enumerable: true
        });
        return I;
      }
      return function () {
        return null;
      };
    },
    set(v) {
      Object.defineProperty(WT, 'Icon', {
        value: v,
        writable: true,
        configurable: true,
        enumerable: true
      });
    }
  });
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/writing-tool/icons.jsx", error: String((e && e.message) || e) }); }

// ui_kits/writing-tool/shell.jsx
try { (() => {
(function () {
  const {
    Button,
    IconButton,
    Avatar,
    Badge,
    Tabs,
    Aura,
    Tooltip
  } = window.AuraDesignSystem_6ddaae || {};
  const {
    Icon
  } = window.WT || {};
  function NavItem({
    icon,
    label,
    active,
    onClick
  }) {
    return /*#__PURE__*/React.createElement("button", {
      className: `wt-nav${active ? ' wt-nav--active' : ''}`,
      onClick: onClick
    }, /*#__PURE__*/React.createElement(Icon, {
      name: icon,
      size: 16
    }), label);
  }
  function Sidebar({
    screen,
    docs,
    activeId,
    goHome,
    openDoc,
    onNew,
    theme,
    toggleTheme
  }) {
    return /*#__PURE__*/React.createElement("aside", {
      className: "wt-side"
    }, /*#__PURE__*/React.createElement("div", {
      className: "wt-side__brand"
    }, /*#__PURE__*/React.createElement(Aura, {
      size: 20,
      state: "quiet"
    }), /*#__PURE__*/React.createElement("span", null, "Onda Write")), /*#__PURE__*/React.createElement("nav", {
      className: "wt-side__nav"
    }, /*#__PURE__*/React.createElement(NavItem, {
      icon: "file-text",
      label: "Dokumente",
      active: screen === 'home',
      onClick: goHome
    }), /*#__PURE__*/React.createElement(NavItem, {
      icon: "users",
      label: "Geteilt",
      onClick: goHome
    }), /*#__PURE__*/React.createElement(NavItem, {
      icon: "archive",
      label: "Archiv",
      onClick: goHome
    })), /*#__PURE__*/React.createElement("div", {
      className: "wt-side__label"
    }, "Zuletzt"), /*#__PURE__*/React.createElement("div", {
      className: "wt-side__recent"
    }, docs.slice(0, 4).map(d => /*#__PURE__*/React.createElement("button", {
      key: d.id,
      className: `wt-side-doc${screen === 'editor' && activeId === d.id ? ' wt-side-doc--active' : ''}`,
      onClick: () => openDoc(d.id)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "file-text",
      size: 14
    }), /*#__PURE__*/React.createElement("span", null, d.title)))), /*#__PURE__*/React.createElement("div", {
      className: "wt-side__foot"
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: "Mira Lang",
      size: "sm",
      online: true
    }), /*#__PURE__*/React.createElement("span", {
      className: "wt-side__user"
    }, "Mira Lang"), /*#__PURE__*/React.createElement(Tooltip, {
      label: theme === 'light' ? 'Dark Mode' : 'Light Mode'
    }, /*#__PURE__*/React.createElement(IconButton, {
      size: "sm",
      label: "Theme wechseln",
      onClick: toggleTheme
    }, /*#__PURE__*/React.createElement(Icon, {
      name: theme === 'light' ? 'moon' : 'sun',
      size: 15
    })))));
  }
  function Topbar({
    screen,
    doc,
    goHome,
    mode,
    setMode,
    onShare,
    agent
  }) {
    return /*#__PURE__*/React.createElement("header", {
      className: "wt-top"
    }, screen === 'home' ? /*#__PURE__*/React.createElement("div", {
      className: "wt-top__title"
    }, "Dokumente") : /*#__PURE__*/React.createElement("div", {
      className: "wt-top__crumb"
    }, /*#__PURE__*/React.createElement(IconButton, {
      size: "sm",
      label: "Zur\xFCck",
      onClick: goHome
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "chevron-left",
      size: 16
    })), /*#__PURE__*/React.createElement("span", {
      className: "wt-top__doc"
    }, doc.title), /*#__PURE__*/React.createElement(Badge, {
      tone: doc.status === 'Geprüft' ? 'success' : doc.status === 'Veröffentlicht' ? 'accent' : 'warning'
    }, doc.status)), /*#__PURE__*/React.createElement("div", {
      className: "wt-top__right"
    }, screen === 'editor' && /*#__PURE__*/React.createElement(Tabs, {
      variant: "segmented",
      active: mode,
      onChange: setMode,
      items: [{
        id: 'edit',
        label: 'Bearbeiten'
      }, {
        id: 'read',
        label: 'Lesen'
      }]
    }), screen === 'editor' && /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      icon: /*#__PURE__*/React.createElement(Icon, {
        name: "share",
        size: 14
      }),
      onClick: onShare
    }, "Teilen"), screen === 'editor' && /*#__PURE__*/React.createElement(Aura, {
      size: 24,
      state: agent === 'thinking' ? 'thinking' : 'quiet',
      label: agent === 'thinking' ? 'Agent arbeitet' : 'Agent bereit'
    })));
  }
  window.WT = window.WT || {};
  window.WT.Sidebar = Sidebar;
  window.WT.Topbar = Topbar;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/writing-tool/shell.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Annotation = __ds_scope.Annotation;

__ds_ns.Correction = __ds_scope.Correction;

__ds_ns.Insertion = __ds_scope.Insertion;

__ds_ns.Mark = __ds_scope.Mark;

__ds_ns.Rewrite = __ds_scope.Rewrite;

__ds_ns.Slot = __ds_scope.Slot;

__ds_ns.Region = __ds_scope.Region;

__ds_ns.CATEGORIES = __ds_scope.CATEGORIES;

__ds_ns.KINDS = __ds_scope.KINDS;

__ds_ns.PRIORITY = __ds_scope.PRIORITY;

__ds_ns.PRIORITY_OF = __ds_scope.PRIORITY_OF;

__ds_ns.SCOPES = __ds_scope.SCOPES;

__ds_ns.Aura = __ds_scope.Aura;

__ds_ns.Bubble = __ds_scope.Bubble;

__ds_ns.Composer = __ds_scope.Composer;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
