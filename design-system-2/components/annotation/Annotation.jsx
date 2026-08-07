import {kindInfo,PRIORITY,PRIORITY_OF} from './kinds.js';
import {Icon} from '../display/Icon.jsx';
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
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-note')){const s=document.createElement('style');s.id='aura-css-note';s.textContent=CSS;document.head.appendChild(s)}}
export function Annotation({kind='anmerkung',scope,n,count,priority,why,conflict,suggestion,move,source,compare,active=false,collapsed=false,acceptLabel,secondaryLabel,onSecondary,onAccept,onDismiss,onClick,children,className='',...rest}){
  css();
  const {label,icon}=kindInfo(kind);
  const prio=priority||PRIORITY_OF[kind];
  const [showWhy,setShowWhy]=React.useState(false);
  const primary=acceptLabel||(suggestion?'Übernehmen':move?'Verschieben':source?'Beleg einfügen':null);
  return <div className={`aura-note${active?' aura-note--active':''}${collapsed?' aura-note--collapsed':''}${onClick?' aura-note--interactive':''} ${className}`} onClick={onClick} {...rest}>
    <div className="aura-note__head">
      <Icon name={icon} size={13}/>
      <span>{label}</span>
      {n!=null&&<span className="aura-note__n">{n}</span>}
      {count!=null&&<span className="aura-note__count">{count}×</span>}
      {prio&&<span className={`aura-note__prio${prio==='muss'?' aura-note__prio--muss':''}`}>{PRIORITY[prio]}</span>}
      {scope&&<span className="aura-note__scope">{scope}</span>}
    </div>
    {children&&<div className="aura-note__body">{children}</div>}
    {!collapsed&&suggestion&&<div className="aura-note__block">
      {suggestion.from&&<span className="aura-note__from">{suggestion.from}</span>}
      {suggestion.to&&<span className="aura-note__to">{suggestion.to}</span>}
    </div>}
    {!collapsed&&move&&<div className="aura-note__block"><span className="aura-note__move"><Icon name="arrow-up-down" size={13}/>{move.to}</span></div>}
    {!collapsed&&compare&&<div className="aura-note__compare">
      {compare.map((c,i)=><span className="aura-note__cmp" key={i}>
        <span className="aura-note__cmpref">{c.ref}</span>
        <span className="aura-note__cmptext">{c.text}</span>
      </span>)}
    </div>}
    {!collapsed&&source&&<div className="aura-note__block">
      {source.url&&<a className="aura-note__srclink" href={source.url} target="_blank" rel="noreferrer"><Icon name="link" size={13}/>{source.title||source.url}</a>}
      {source.excerpt&&<span className="aura-note__excerpt">{source.excerpt}</span>}
      {source.meta&&<span className="aura-note__srcmeta">{source.meta}</span>}
    </div>}
    {!collapsed&&conflict&&<span className="aura-note__conflict">Schließt aus: {conflict}</span>}
    {!collapsed&&why&&<button type="button" className="aura-note__why" onClick={e=>{e.stopPropagation();setShowWhy(v=>!v)}}>{showWhy?'Regel ausblenden':'Warum?'}</button>}
    {!collapsed&&why&&showWhy&&<span className="aura-note__rule">{why}</span>}
    {!collapsed&&(primary||onDismiss)&&<div className="aura-note__acts">
      {primary&&<button type="button" className="aura-note__btn aura-note__btn--primary" onClick={onAccept}>{primary}</button>}
      {onDismiss&&<button type="button" className="aura-note__btn aura-note__btn--ghost" onClick={onDismiss}>{primary?'Verwerfen':'Verstanden'}</button>}
      {onSecondary&&<button type="button" className="aura-note__btn aura-note__btn--ghost" onClick={onSecondary}>{secondaryLabel||'Andere Quelle'}</button>}
    </div>}
  </div>;
}
