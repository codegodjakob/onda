import {Icon} from '../display/Icon.jsx';
const CSS = `
.aura-composer{display:flex;align-items:center;gap:8px;padding:7px 7px 7px 10px;background:var(--bg-surface);border:1px solid var(--border-default);border-radius:var(--radius-control);transition:border-color var(--dur-fast) var(--ease-out),box-shadow var(--dur-fast) var(--ease-out),border-radius var(--dur-normal) var(--ease-out)}
.aura-composer--grown{border-radius:var(--radius-panel);align-items:flex-end}
.aura-composer:hover:not(.aura-composer--disabled){border-color:var(--border-strong)}
.aura-composer:focus-within{box-shadow:var(--shadow-focus)}
.aura-composer--disabled{background:var(--bg-sunken);border-color:var(--border-subtle)}
.aura-composer__lead{display:flex;align-items:center;gap:2px;padding-bottom:1px;flex:none}
.aura-composer__input{flex:1;min-width:0;border:none;outline:none;resize:none;background:transparent;font-family:var(--font-sans);font-size:var(--text-base);line-height:22px;color:var(--text-primary);padding:9px 4px;max-height:160px;overflow-y:auto}
.aura-composer__input::placeholder{color:var(--text-tertiary)}
.aura-composer__input:disabled{color:var(--text-disabled);cursor:not-allowed}
.aura-composer__send{width:34px;height:34px;flex:none;display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:var(--radius-control);background:var(--accent);color:var(--on-accent);cursor:pointer;transition:var(--transition-colors),transform var(--dur-fast) var(--ease-out)}
.aura-composer__send:hover:not(:disabled){background:var(--accent-hover)}
.aura-composer__send:active:not(:disabled){transform:scale(0.96)}
.aura-composer__send:disabled{background:var(--bg-sunken);color:var(--text-disabled);cursor:not-allowed}
.aura-composer__stop{display:inline-flex}
.aura-composer__foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 16px 0}
.aura-composer__hint{font:var(--type-caption);color:var(--text-tertiary)}
.aura-composer__count{font:var(--type-caption);color:var(--text-tertiary);font-variant-numeric:tabular-nums}
.aura-composer__count--over{color:var(--danger)}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-composer')){const s=document.createElement('style');s.id='aura-css-composer';s.textContent=CSS;document.head.appendChild(s)}}
export function Composer({value,defaultValue='',onChange,onSubmit,onStop,placeholder='Schreib eine Anweisung …',leading,hint,maxLength,busy=false,disabled=false,rows=1,className='',style,...rest}){
  css();
  const controlled=value!==undefined;
  const [inner,setInner]=React.useState(defaultValue);
  const text=controlled?value:inner;
  const ta=React.useRef(null);
  const [grown,setGrown]=React.useState(false);
  const fit=React.useCallback(()=>{
    const el=ta.current;if(!el)return;
    el.style.height='auto';
    const h=Math.min(el.scrollHeight,160);
    el.style.height=h+'px';
    setGrown(h>44);
  },[]);
  React.useLayoutEffect(fit,[text,fit]);
  const set=v=>{if(!controlled)setInner(v);onChange&&onChange(v)};
  const submit=()=>{const t=(text||'').trim();if(!t||busy||disabled)return;onSubmit&&onSubmit(t);if(!controlled)setInner('')};
  const over=maxLength!==undefined&&(text||'').length>maxLength;
  return <div className={className} style={style}>
    <div className={`aura-composer${grown?' aura-composer--grown':''}${disabled?' aura-composer--disabled':''}`}>
      {leading&&<span className="aura-composer__lead">{leading}</span>}
      <textarea ref={ta} className="aura-composer__input" rows={rows} value={text} placeholder={placeholder} disabled={disabled}
        onChange={e=>set(e.target.value)}
        onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit()}}}
        {...rest}/>
      {busy
        ? <button type="button" className="aura-composer__send" onClick={onStop} aria-label="Antwort anhalten"><span className="aura-composer__stop"><Icon name="square" size={13}/></span></button>
        : <button type="button" className="aura-composer__send" onClick={submit} disabled={disabled||!(text||'').trim()||over} aria-label="Senden">
            <Icon name="send" size={15}/>
          </button>}
    </div>
    {(hint||maxLength!==undefined)&&<div className="aura-composer__foot">
      <span className="aura-composer__hint">{hint}</span>
      {maxLength!==undefined&&<span className={`aura-composer__count${over?' aura-composer__count--over':''}`}>{(text||'').length}/{maxLength}</span>}
    </div>}
  </div>;
}
