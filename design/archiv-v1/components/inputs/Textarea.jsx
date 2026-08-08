import {Input} from './Input.jsx';
const CSS = `
.aura-textarea{min-height:96px;padding:12px 16px;font-family:var(--font-sans);font-size:var(--text-base);line-height:var(--leading-normal);color:var(--text-primary);background:var(--bg-surface);border:1px solid var(--border-default);border-radius:var(--radius-panel);transition:var(--transition-colors),box-shadow var(--dur-fast) var(--ease-out);outline:none;width:100%;resize:vertical}
.aura-textarea::placeholder{color:var(--text-tertiary)}
.aura-textarea:hover:not(:disabled):not(:focus){border-color:var(--border-strong)}
.aura-textarea:focus{box-shadow:var(--shadow-focus)}
.aura-textarea:disabled{background:var(--bg-sunken);color:var(--text-disabled);cursor:not-allowed}
.aura-textarea--error{border-color:var(--danger)}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-textarea')){const s=document.createElement('style');s.id='aura-css-textarea';s.textContent=CSS;document.head.appendChild(s)}}
export function Textarea({label,hint,error,id,style,rows=4,...rest}){
  css();
  const uid=React.useRef(id||'ta-'+Math.random().toString(36).slice(2,7)).current;
  return <div className="aura-field" style={style}>
    {label&&<label className="aura-field__label" htmlFor={uid}>{label}</label>}
    <textarea id={uid} rows={rows} className={`aura-textarea${error?' aura-textarea--error':''}`} aria-invalid={!!error} {...rest}/>
    {(error||hint)&&<span className={`aura-field__hint${error?' aura-field__hint--error':''}`}>{error||hint}</span>}
  </div>;
}
