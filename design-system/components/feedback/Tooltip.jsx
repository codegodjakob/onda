const CSS = `
.aura-tip{position:relative;display:inline-flex}
.aura-tip__bubble{position:absolute;left:50%;transform:translateX(-50%) translateY(2px);bottom:calc(100% + 7px);background:var(--ink-900);color:#f4f1ea;font-family:var(--font-sans);font-size:var(--text-xs);font-weight:var(--fw-medium);line-height:1.3;padding:6px 12px;border-radius:var(--radius-full);white-space:nowrap;pointer-events:none;opacity:0;transition:opacity var(--dur-quick) var(--ease-out) 300ms,transform var(--dur-quick) var(--ease-out) 300ms;z-index:60}
[data-theme="dark"] .aura-tip__bubble{background:var(--surface-3);color:var(--text-primary);border:1px solid var(--border-default)}
.aura-tip__bubble--bottom{bottom:auto;top:calc(100% + 7px);transform:translateX(-50%) translateY(-2px)}
.aura-tip:hover .aura-tip__bubble,.aura-tip:focus-within .aura-tip__bubble{opacity:1;transform:translateX(-50%) translateY(0)}
.aura-tip kbd{font-family:var(--font-sans);font-size:var(--text-xs);opacity:.6;margin-left:7px}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-tip')){const s=document.createElement('style');s.id='aura-css-tip';s.textContent=CSS;document.head.appendChild(s)}}
export function Tooltip({label,shortcut,side='top',children}){
  css();
  return <span className="aura-tip">
    {children}
    <span className={`aura-tip__bubble${side==='bottom'?' aura-tip__bubble--bottom':''}`} role="tooltip">{label}{shortcut&&<kbd>{shortcut}</kbd>}</span>
  </span>;
}
