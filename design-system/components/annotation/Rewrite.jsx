const CSS = `
.aura-rewrite{display:flex;flex-direction:column;gap:11px;padding:16px 18px;background:var(--bg-surface);border-radius:var(--radius-panel);box-shadow:var(--shadow-xs);font-family:var(--font-sans);letter-spacing:var(--tracking-normal);animation:aura-rw-in var(--dur-normal) var(--ease-out)}
.aura-rewrite__label{display:flex;align-items:baseline;gap:9px;font:var(--type-label);color:var(--text-primary)}
.aura-rewrite__meta{margin-left:auto;font:var(--type-body);color:var(--text-tertiary);font-variant-numeric:tabular-nums}
.aura-rewrite__note{font:var(--type-body);color:var(--text-secondary);text-wrap:pretty}
.aura-rewrite__text{font:var(--type-body);line-height:var(--leading-relaxed);color:var(--text-primary);text-wrap:pretty;margin:0;padding:13px 15px;background:var(--bg-sunken);border-radius:var(--radius-panel)}
.aura-rewrite__acts{display:flex;align-items:center;gap:8px;margin-top:2px}
.aura-rewrite__ok{height:32px;padding:0 16px;border:none;border-radius:var(--radius-full);background:var(--accent);color:var(--on-accent);font-family:var(--font-sans);font-size:var(--text-base);font-weight:var(--fw-medium);cursor:pointer;white-space:nowrap}
.aura-rewrite__ok:hover{background:var(--accent-hover)}
.aura-rewrite__no{height:32px;padding:0 14px;border:none;border-radius:var(--radius-full);background:transparent;color:var(--text-secondary);font-family:var(--font-sans);font-size:var(--text-base);font-weight:var(--fw-medium);cursor:pointer;white-space:nowrap}
.aura-rewrite__no:hover{background:var(--bg-hover);color:var(--text-primary)}
@keyframes aura-rw-in{from{opacity:0;transform:translateY(6px)}}
@media (prefers-reduced-motion:reduce){.aura-rewrite{animation:none}}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-rewrite')){const s=document.createElement('style');s.id='aura-css-rewrite';s.textContent=CSS;document.head.appendChild(s)}}
export function Rewrite({label='Umschreiben',to,meta,acceptLabel='Übernehmen',dismissLabel='Original behalten',onAccept,onDismiss,children,...rest}){
  css();
  return <div className="aura-rewrite" {...rest}>
    <div className="aura-rewrite__label"><span>{label}</span>{meta&&<span className="aura-rewrite__meta">{meta}</span>}</div>
    {children&&<div className="aura-rewrite__note">{children}</div>}
    {to&&<p className="aura-rewrite__text">{to}</p>}
    {(onAccept||onDismiss)&&<div className="aura-rewrite__acts">
      {onAccept&&<button type="button" className="aura-rewrite__ok" onClick={onAccept}>{acceptLabel}</button>}
      {onDismiss&&<button type="button" className="aura-rewrite__no" onClick={onDismiss}>{dismissLabel}</button>}
    </div>}
  </div>;
}
