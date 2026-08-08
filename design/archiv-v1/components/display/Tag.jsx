const CSS = `
.aura-tag{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 12px;border-radius:var(--radius-full);background:var(--bg-sunken);border:1px solid var(--border-subtle);font-family:var(--font-sans);font-size:var(--text-xs);font-weight:var(--fw-medium);color:var(--text-secondary);white-space:nowrap;transition:var(--transition-colors)}
.aura-tag--interactive{cursor:pointer}
.aura-tag--interactive:hover{border-color:var(--border-strong);color:var(--text-primary)}
.aura-tag__x{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;margin-right:-4px;border-radius:var(--radius-full);border:none;background:transparent;color:var(--text-tertiary);cursor:pointer;padding:0;transition:var(--transition-colors)}
.aura-tag__x:hover{color:var(--danger);background:var(--bg-active)}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-tag')){const s=document.createElement('style');s.id='aura-css-tag';s.textContent=CSS;document.head.appendChild(s)}}
export function Tag({onRemove,onClick,children,...rest}){
  css();
  return <span className={`aura-tag${onClick?' aura-tag--interactive':''}`} onClick={onClick} {...rest}>
    {children}
    {onRemove&&<button type="button" className="aura-tag__x" aria-label="Entfernen" onClick={e=>{e.stopPropagation();onRemove()}}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>}
  </span>;
}
