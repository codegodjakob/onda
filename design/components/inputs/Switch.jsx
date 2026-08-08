const CSS = `
.aura-switch{display:inline-flex;align-items:center;gap:10px;cursor:pointer;font-family:var(--font-sans);position:relative}
.aura-switch input{position:absolute;opacity:0;width:0;height:0}
.aura-switch__track{width:34px;height:20px;flex:none;border-radius:var(--radius-md);background:var(--ink-200);position:relative;transition:background-color var(--dur-quick) var(--ease-out),box-shadow var(--dur-fast) var(--ease-out)}
[data-theme="dark"] .aura-switch__track{background:var(--surface-3)}
.aura-switch__track::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:var(--radius-sm);background:#fff;box-shadow:0 1px 2px rgba(28,26,23,.2);transition:transform var(--dur-quick) var(--ease-out)}
.aura-switch input:checked~.aura-switch__track{background:var(--accent)}
.aura-switch input:checked~.aura-switch__track::after{transform:translateX(14px)}
.aura-switch input:focus-visible~.aura-switch__track{box-shadow:var(--shadow-focus)}
.aura-switch input:disabled~*{opacity:.5;cursor:not-allowed}
.aura-switch__label{font-size:var(--text-base);color:var(--text-primary)}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-switch')){const s=document.createElement('style');s.id='aura-css-switch';s.textContent=CSS;document.head.appendChild(s)}}
export function Switch({label,style,...rest}){
  css();
  return <label className="aura-switch" style={style}>
    <input type="checkbox" role="switch" {...rest}/>
    <span className="aura-switch__track"></span>
    {label&&<span className="aura-switch__label">{label}</span>}
  </label>;
}
