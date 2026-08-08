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
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-slot')){const s=document.createElement('style');s.id='aura-css-slot';s.textContent=CSS;document.head.appendChild(s)}}
export function Slot({label='Hierher verschieben',text,onAccept,onDismiss,...rest}){
  css();
  return <div className="aura-slot" {...rest}>
    <div className="aura-slot__body">
      <span className="aura-slot__label">{label}</span>
      {text&&<p className="aura-slot__text">{text}</p>}
      {(onAccept||onDismiss)&&<div className="aura-slot__acts">
        {onAccept&&<button type="button" className="aura-slot__ok" onClick={onAccept}>Verschieben</button>}
        {onDismiss&&<button type="button" className="aura-slot__no" onClick={onDismiss}>Lassen</button>}
      </div>}
    </div>
  </div>;
}
export function Region({tag,children,...rest}){
  css();
  return <span className="aura-region" {...rest}>{tag&&<span className="aura-region__tag">{tag}</span>}{children}</span>;
}
