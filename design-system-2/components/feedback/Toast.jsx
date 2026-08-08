const ICONS={
  success:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/></svg>,
  danger:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>,
  warning:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/></svg>,
  info:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
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
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-toast')){const s=document.createElement('style');s.id='aura-css-toast';s.textContent=CSS;document.head.appendChild(s)}}
export function Toast({tone='info',title,description,actionLabel,onAction,onDismiss,...rest}){
  css();
  return <div className={`aura-toast${tone==='danger'?' aura-toast--danger':''}`} role="status" {...rest}>
    <span className={`aura-toast__icon aura-toast__icon--${tone}`}>{ICONS[tone]||ICONS.info}</span>
    <div className="aura-toast__body">
      <span className="aura-toast__title">{title}</span>
      {description&&<span className="aura-toast__desc">{description}</span>}
      {actionLabel&&<button type="button" className="aura-toast__action" onClick={onAction}>{actionLabel}</button>}
    </div>
    {onDismiss&&<button type="button" className="aura-toast__x" aria-label="Ausblenden" onClick={onDismiss}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>}
  </div>;
}
