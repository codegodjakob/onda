import {kindInfo} from './kinds.js';
const CSS = `
.aura-mark{background:transparent;color:inherit;cursor:pointer;border-radius:0.34em;transition:background-color var(--dur-fast) var(--ease-out),border-color var(--dur-fast) var(--ease-out)}
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
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-mark')){const s=document.createElement('style');s.id='aura-css-mark';s.textContent=CSS;document.head.appendChild(s)}}
export function Mark({kind='anmerkung',n,active=false,onClick,children,...rest}){
  css();
  const {cat,label}=kindInfo(kind);
  return <mark className={`aura-mark aura-mark--${cat}${active?' aura-mark--active':''}`} onClick={onClick} title={label} {...rest}>
    {children}{n!=null&&<span className="aura-mark__n">{n}</span>}
  </mark>;
}
