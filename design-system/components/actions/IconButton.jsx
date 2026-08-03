const CSS = `
.aura-iconbtn{display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;background:transparent;color:var(--text-secondary);border-radius:var(--radius-full);cursor:pointer;transition:var(--transition-colors),transform var(--dur-fast) var(--ease-out)}
.aura-iconbtn:hover:not(:disabled){background:var(--bg-hover);color:var(--text-primary)}
.aura-iconbtn:active:not(:disabled){background:var(--bg-active);transform:scale(0.96)}
.aura-iconbtn:disabled{opacity:.45;cursor:not-allowed}
.aura-iconbtn--secondary{background:var(--bg-surface);border-color:var(--border-default);box-shadow:var(--shadow-xs)}
.aura-iconbtn--secondary:hover:not(:disabled){background:var(--bg-hover);border-color:var(--border-strong)}
.aura-iconbtn--sm{width:32px;height:32px}
.aura-iconbtn--md{width:36px;height:36px}
.aura-iconbtn--lg{width:40px;height:40px}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-iconbtn')){const s=document.createElement('style');s.id='aura-css-iconbtn';s.textContent=CSS;document.head.appendChild(s)}}
export function IconButton({variant='ghost',size='md',label,children,...rest}){
  css();
  return <button className={`aura-iconbtn aura-iconbtn--${variant} aura-iconbtn--${size}`} aria-label={label} title={label} {...rest}>{children}</button>;
}
