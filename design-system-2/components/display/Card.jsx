const CSS = `
.aura-card{background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-card);transition:var(--transition-colors),box-shadow var(--dur-quick) var(--ease-out)}
.aura-card--interactive{cursor:pointer}
.aura-card--interactive:hover{border-color:var(--border-default);box-shadow:var(--shadow-sm)}
.aura-card--interactive:active{background:var(--bg-hover)}
.aura-card__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.aura-card__title{font:var(--type-body);font-weight:var(--fw-bold);color:var(--text-primary)}
.aura-card__subtitle{font:var(--type-caption);color:var(--text-secondary);margin-top:3px}
.aura-card--pad-sm{padding:14px 16px}
.aura-card--pad-md{padding:20px 22px}
.aura-card--pad-lg{padding:32px}
.aura-card--pad-none{padding:0}
.aura-card__head+*{margin-top:14px}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-card')){const s=document.createElement('style');s.id='aura-css-card';s.textContent=CSS;document.head.appendChild(s)}}
export function Card({title,subtitle,actions,padding='md',interactive=false,children,className='',...rest}){
  css();
  return <div className={`aura-card aura-card--pad-${padding}${interactive?' aura-card--interactive':''} ${className}`} {...rest}>
    {(title||actions)&&<div className="aura-card__head"><div>{title&&<div className="aura-card__title">{title}</div>}{subtitle&&<div className="aura-card__subtitle">{subtitle}</div>}</div>{actions}</div>}
    {children}
  </div>;
}
