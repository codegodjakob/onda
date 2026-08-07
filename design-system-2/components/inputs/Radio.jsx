const CSS = `
.aura-radio{display:inline-flex;align-items:flex-start;gap:9px;cursor:pointer;font-family:var(--font-sans);position:relative}
.aura-radio input{position:absolute;opacity:0;width:0;height:0}
.aura-radio__dot{width:16px;height:16px;flex:none;margin-top:2px;border-radius:var(--radius-full);border:1px solid var(--border-strong);background:var(--bg-surface);display:flex;align-items:center;justify-content:center;transition:var(--transition-colors),box-shadow var(--dur-fast) var(--ease-out)}
.aura-radio__dot::after{content:"";width:6px;height:6px;border-radius:var(--radius-full);background:var(--on-accent);transform:scale(0);transition:transform var(--dur-quick) var(--ease-out)}
.aura-radio:hover input:not(:disabled)~.aura-radio__dot{border-color:var(--text-tertiary)}
.aura-radio input:checked~.aura-radio__dot{background:var(--accent);border-color:var(--accent)}
.aura-radio input:checked~.aura-radio__dot::after{transform:scale(1)}
.aura-radio input:focus-visible~.aura-radio__dot{box-shadow:var(--shadow-focus)}
.aura-radio input:disabled~*{opacity:.5;cursor:not-allowed}
.aura-radio__label{font-size:var(--text-base);line-height:20px;color:var(--text-primary)}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-radio')){const s=document.createElement('style');s.id='aura-css-radio';s.textContent=CSS;document.head.appendChild(s)}}
export function Radio({label,style,...rest}){
  css();
  return <label className="aura-radio" style={style}>
    <input type="radio" {...rest}/>
    <span className="aura-radio__dot"></span>
    {label&&<span className="aura-radio__label">{label}</span>}
  </label>;
}
