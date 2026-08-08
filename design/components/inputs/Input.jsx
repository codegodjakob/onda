const CSS = `
.aura-field{display:flex;flex-direction:column;gap:6px;font-family:var(--font-sans)}
.aura-field__label{font:var(--type-label);color:var(--text-primary)}
.aura-field__hint{font:var(--type-caption);color:var(--text-tertiary)}
.aura-field__hint--error{color:var(--danger)}
.aura-input{height:40px;padding:0 16px;font-family:var(--font-sans);font-size:var(--text-base);color:var(--text-primary);background:var(--bg-surface);border:1px solid var(--border-default);border-radius:var(--radius-control);transition:var(--transition-colors),box-shadow var(--dur-fast) var(--ease-out);outline:none;width:100%}
.aura-input::placeholder{color:var(--text-tertiary)}
.aura-input:hover:not(:disabled):not(:focus){border-color:var(--border-strong)}
.aura-input:focus{box-shadow:var(--shadow-focus)}
.aura-input:disabled{background:var(--bg-sunken);color:var(--text-disabled);cursor:not-allowed}
.aura-input--error{border-color:var(--danger)}
.aura-input--error:focus{box-shadow:0 0 0 4px var(--danger-tint)}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-input')){const s=document.createElement('style');s.id='aura-css-input';s.textContent=CSS;document.head.appendChild(s)}}
export function Input({label,hint,error,id,style,...rest}){
  css();
  const uid=React.useRef(id||'in-'+Math.random().toString(36).slice(2,7)).current;
  return <div className="aura-field" style={style}>
    {label&&<label className="aura-field__label" htmlFor={uid}>{label}</label>}
    <input id={uid} className={`aura-input${error?' aura-input--error':''}`} aria-invalid={!!error} {...rest}/>
    {(error||hint)&&<span className={`aura-field__hint${error?' aura-field__hint--error':''}`}>{error||hint}</span>}
  </div>;
}
