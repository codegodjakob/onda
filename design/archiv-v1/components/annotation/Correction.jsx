import {Mark} from './Mark.jsx';
import {Icon} from '../display/Icon.jsx';
const CSS = `
.aura-corr{position:relative;display:inline}
.aura-corr__pop{position:absolute;left:0;top:calc(100% + 10px);z-index:5;display:inline-flex;align-items:center;gap:12px;padding:9px 10px 9px 16px;background:var(--bg-surface);border-radius:var(--radius-panel);box-shadow:var(--shadow-md);font:var(--type-body);letter-spacing:var(--tracking-normal);color:var(--text-primary);white-space:nowrap;animation:aura-corr-in var(--dur-normal) var(--ease-out)}
.aura-corr__pop--right{left:auto;right:0}
.aura-corr__from{color:var(--text-tertiary);text-decoration:line-through;text-decoration-thickness:1px}
.aura-corr__sep{color:var(--text-tertiary);display:inline-flex}
.aura-corr__to{font-weight:var(--fw-medium)}
.aura-corr__note{color:var(--text-secondary)}
.aura-corr__ok{height:32px;padding:0 16px;border:none;border-radius:var(--radius-full);background:var(--accent);color:var(--on-accent);font-family:var(--font-sans);font-size:var(--text-base);font-weight:var(--fw-medium);cursor:pointer;transition:var(--transition-colors)}
.aura-corr__ok:hover{background:var(--accent-hover)}
.aura-corr__x{width:32px;height:32px;flex:none;display:inline-flex;align-items:center;justify-content:center;border:none;border-radius:var(--radius-full);background:transparent;color:var(--text-tertiary);cursor:pointer;transition:var(--transition-colors)}
.aura-corr__x:hover{background:var(--bg-hover);color:var(--text-primary)}
@keyframes aura-corr-in{from{opacity:0;transform:translateY(-4px)}}
@media (prefers-reduced-motion:reduce){.aura-corr__pop{animation:none}}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-corr')){const s=document.createElement('style');s.id='aura-css-corr';s.textContent=CSS;document.head.appendChild(s)}}
export function Correction({kind='rechtschreibung',to,note,align='left',open=false,onAccept,onDismiss,onClick,children,...rest}){
  css();
  return <span className="aura-corr" {...rest}>
    <Mark kind={kind} active={open} onClick={onClick}>{children}</Mark>
    {open&&<span className={`aura-corr__pop${align==='right'?' aura-corr__pop--right':''}`}>
      {to&&<React.Fragment>
        <span className="aura-corr__from">{children}</span>
        <span className="aura-corr__sep"><Icon name="chevron-right" size={14}/></span>
        <span className="aura-corr__to">{to}</span>
      </React.Fragment>}
      {note&&<span className="aura-corr__note">{note}</span>}
      {onAccept&&<button type="button" className="aura-corr__ok" onClick={onAccept}>Übernehmen</button>}
      {onDismiss&&<button type="button" className="aura-corr__x" aria-label="Verwerfen" onClick={onDismiss}><Icon name="x" size={14}/></button>}
    </span>}
  </span>;
}
