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
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-dialog')){const s=document.createElement('style');s.id='aura-css-dialog';s.textContent=CSS;document.head.appendChild(s)}}
export function Dialog({open,onClose,title,description,footer,width=440,children}){
  css();
  React.useEffect(()=>{
    if(!open)return;
    const h=e=>{if(e.key==='Escape')onClose&&onClose()};
    document.addEventListener('keydown',h);return ()=>document.removeEventListener('keydown',h);
  },[open,onClose]);
  if(!open)return null;
  return <div className="aura-dialog__scrim" onMouseDown={e=>{if(e.target===e.currentTarget&&onClose)onClose()}}>
    <div className="aura-dialog" role="dialog" aria-modal="true" style={{maxWidth:width}}>
      <div className="aura-dialog__head">
        <div><div className="aura-dialog__title">{title}</div>{description&&<div className="aura-dialog__desc">{description}</div>}</div>
        {onClose&&<button type="button" className="aura-dialog__x" aria-label="Schließen" onClick={onClose}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>}
      </div>
      {children&&<div className="aura-dialog__body">{children}</div>}
      {footer&&<div className="aura-dialog__foot">{footer}</div>}
    </div>
  </div>;
}
