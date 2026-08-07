import {Input} from './Input.jsx';
const CSS = `
.aura-select-wrap{position:relative;display:flex}
.aura-select{appearance:none;-webkit-appearance:none;height:40px;padding:0 36px 0 16px;font-family:var(--font-sans);font-size:var(--text-base);color:var(--text-primary);background:var(--bg-surface);border:1px solid var(--border-default);border-radius:var(--radius-control);transition:var(--transition-colors),box-shadow var(--dur-fast) var(--ease-out);outline:none;width:100%;cursor:pointer}
.aura-select:hover:not(:disabled):not(:focus){border-color:var(--border-strong)}
.aura-select:focus{box-shadow:var(--shadow-focus)}
.aura-select:disabled{background:var(--bg-sunken);color:var(--text-disabled);cursor:not-allowed}
.aura-select-wrap svg{position:absolute;right:14px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--text-tertiary)}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-select')){const s=document.createElement('style');s.id='aura-css-select';s.textContent=CSS;document.head.appendChild(s)}}
export function Select({label,hint,error,id,style,options,children,...rest}){
  css();
  const uid=React.useRef(id||'se-'+Math.random().toString(36).slice(2,7)).current;
  return <div className="aura-field" style={style}>
    {label&&<label className="aura-field__label" htmlFor={uid}>{label}</label>}
    <span className="aura-select-wrap">
      <select id={uid} className="aura-select" aria-invalid={!!error} {...rest}>
        {options?options.map(o=>typeof o==='string'?<option key={o} value={o}>{o}</option>:<option key={o.value} value={o.value}>{o.label}</option>):children}
      </select>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    </span>
    {(error||hint)&&<span className={`aura-field__hint${error?' aura-field__hint--error':''}`}>{error||hint}</span>}
  </div>;
}
