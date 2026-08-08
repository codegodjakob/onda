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
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-button')){const s=document.createElement('style');s.id='aura-css-button';s.textContent=CSS;document.head.appendChild(s)}}
export function Button({variant='primary',size='md',icon,loading=false,disabled=false,children,...rest}){
  css();
  return <button className={`aura-btn aura-btn--${variant} aura-btn--${size}`} disabled={disabled||loading} {...rest}>{loading?<span className="aura-btn__spin"/>:icon}{children}</button>;
}
