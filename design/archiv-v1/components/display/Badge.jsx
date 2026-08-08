const CSS = `
.aura-badge{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 11px;border-radius:var(--radius-full);font-family:var(--font-sans);font-size:var(--text-xs);font-weight:var(--fw-medium);white-space:nowrap}
.aura-badge__dot{width:5px;height:5px;border-radius:var(--radius-full);background:currentColor}
.aura-badge--neutral{background:var(--bg-sunken);color:var(--text-secondary)}
.aura-badge--accent{background:var(--accent-tint);color:var(--accent-active)}
.aura-badge--success{background:var(--bg-sunken);color:var(--text-secondary)}
.aura-badge--warning{background:var(--bg-sunken);color:var(--text-secondary)}
.aura-badge--danger{background:var(--danger-tint);color:var(--danger)}
.aura-badge--info{background:var(--bg-sunken);color:var(--text-secondary)}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-badge')){const s=document.createElement('style');s.id='aura-css-badge';s.textContent=CSS;document.head.appendChild(s)}}
export function Badge({tone='neutral',dot=false,children,...rest}){
  css();
  return <span className={`aura-badge aura-badge--${tone}`} {...rest}>{dot&&<span className="aura-badge__dot"/>}{children}</span>;
}
