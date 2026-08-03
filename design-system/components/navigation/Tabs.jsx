const CSS = `
.aura-tabs{display:flex;gap:6px;font-family:var(--font-sans)}
.aura-tabs__tab{position:relative;border:none;background:transparent;padding:8px 16px;font-size:var(--text-base);font-weight:var(--fw-medium);color:var(--text-tertiary);cursor:pointer;border-radius:var(--radius-full);transition:var(--transition-colors);display:inline-flex;align-items:baseline;gap:7px}
.aura-tabs__tab:hover{color:var(--text-secondary);background:var(--bg-hover)}
.aura-tabs__tab--active{color:var(--text-primary);background:var(--bg-sunken)}
.aura-tabs__count{font-family:var(--font-sans);font-size:var(--text-xs);color:var(--text-tertiary);font-variant-numeric:tabular-nums}
.aura-tabs__tab--active .aura-tabs__count{color:var(--text-secondary)}
.aura-seg{display:inline-flex;gap:2px;padding:3px;border:1px solid var(--border-default);border-radius:var(--radius-full);font-family:var(--font-sans)}
.aura-seg__tab{border:none;background:transparent;padding:7px 18px;font-size:var(--text-base);font-weight:var(--fw-medium);color:var(--text-secondary);cursor:pointer;border-radius:var(--radius-full);transition:var(--transition-colors)}
.aura-seg__tab:hover{color:var(--text-primary);background:var(--bg-hover)}
.aura-seg__tab--active{background:var(--bg-sunken);color:var(--text-primary)}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-tabs')){const s=document.createElement('style');s.id='aura-css-tabs';s.textContent=CSS;document.head.appendChild(s)}}
export function Tabs({items,active,onChange,variant='underline',style}){
  css();
  const isSeg=variant==='segmented';
  return <div className={isSeg?'aura-seg':'aura-tabs'} role="tablist" style={style}>
    {items.map(it=>{
      const a=it.id===active;
      return <button key={it.id} type="button" role="tab" aria-selected={a}
        className={isSeg?`aura-seg__tab${a?' aura-seg__tab--active':''}`:`aura-tabs__tab${a?' aura-tabs__tab--active':''}`}
        onClick={()=>onChange&&onChange(it.id)}>
        {it.label}{it.count!=null&&!isSeg&&<span className="aura-tabs__count">{it.count}</span>}
      </button>;
    })}
  </div>;
}
