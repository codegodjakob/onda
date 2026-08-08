const CSS = `
.aura-check{display:inline-flex;align-items:flex-start;gap:9px;cursor:pointer;font-family:var(--font-sans);position:relative}
.aura-check input{position:absolute;opacity:0;width:0;height:0}
.aura-check__box{width:16px;height:16px;flex:none;margin-top:2px;border-radius:var(--radius-sm);border:1px solid var(--border-strong);background:var(--bg-surface);display:flex;align-items:center;justify-content:center;transition:var(--transition-colors),box-shadow var(--dur-fast) var(--ease-out)}
.aura-check__box svg{opacity:0;transform:scale(.6);transition:opacity var(--dur-fast) var(--ease-out),transform var(--dur-quick) var(--ease-out);color:var(--on-accent)}
.aura-check:hover input:not(:disabled)~.aura-check__box{border-color:var(--text-tertiary)}
.aura-check input:checked~.aura-check__box{background:var(--accent);border-color:var(--accent)}
.aura-check input:checked~.aura-check__box svg{opacity:1;transform:scale(1)}
.aura-check input:focus-visible~.aura-check__box{box-shadow:var(--shadow-focus)}
.aura-check input:disabled~*{opacity:.5;cursor:not-allowed}
.aura-check__text{display:flex;flex-direction:column;gap:2px}
.aura-check__label{font-size:var(--text-base);line-height:20px;color:var(--text-primary)}
.aura-check__desc{font:var(--type-caption);color:var(--text-tertiary)}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-check')){const s=document.createElement('style');s.id='aura-css-check';s.textContent=CSS;document.head.appendChild(s)}}
export function Checkbox({label,description,style,...rest}){
  css();
  return <label className="aura-check" style={style}>
    <input type="checkbox" {...rest}/>
    <span className="aura-check__box"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
    {(label||description)&&<span className="aura-check__text"><span className="aura-check__label">{label}</span>{description&&<span className="aura-check__desc">{description}</span>}</span>}
  </label>;
}
