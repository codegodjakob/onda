const CSS = `
.aura-ins{position:relative;display:inline;vertical-align:baseline}
.aura-ins__caret{position:relative;display:inline-block;width:2px;height:1.05em;margin:0 2px -0.15em;border-radius:1px;background:var(--ink-300);cursor:pointer;transition:background-color var(--dur-fast) var(--ease-out)}
.aura-ins:hover .aura-ins__caret,.aura-ins--open .aura-ins__caret{background:var(--accent)}
/* Der Vorschlag liegt IM Textfluss: er öffnet eine Lücke an der Einfügestelle und verdeckt nichts. */
.aura-ins__pop{display:block;width:fit-content;max-width:100%;margin:12px 0;padding:14px 16px;background:var(--bg-surface);border-radius:var(--radius-panel);box-shadow:var(--shadow-xs);font-family:var(--font-sans);letter-spacing:var(--tracking-normal);animation:aura-ins-in var(--dur-normal) var(--ease-out)}
.aura-ins__label{display:block;font:var(--type-label);color:var(--text-tertiary)}
.aura-ins__ghost{display:block;margin-top:7px;font:var(--type-body);line-height:var(--leading-relaxed);color:var(--text-primary);text-wrap:pretty}
.aura-ins__acts{display:flex;align-items:center;gap:8px;margin-top:11px}
.aura-ins__ok{height:32px;padding:0 16px;border:none;border-radius:var(--radius-control);background:var(--accent);color:var(--on-accent);font-family:var(--font-sans);font-size:var(--text-base);font-weight:var(--fw-medium);cursor:pointer;white-space:nowrap}
.aura-ins__ok:hover{background:var(--accent-hover)}
.aura-ins__no{height:32px;padding:0 14px;border:none;border-radius:var(--radius-control);background:transparent;color:var(--text-secondary);font-family:var(--font-sans);font-size:var(--text-base);font-weight:var(--fw-medium);cursor:pointer;white-space:nowrap}
.aura-ins__no:hover{background:var(--bg-hover);color:var(--text-primary)}
@keyframes aura-ins-in{from{opacity:0;transform:translateY(-4px)}}
@media (prefers-reduced-motion:reduce){.aura-ins__pop{animation:none}}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-ins')){const s=document.createElement('style');s.id='aura-css-ins';s.textContent=CSS;document.head.appendChild(s)}}
export function Insertion({text,label='Einfügen',acceptLabel='Einfügen',open=false,onAccept,onDismiss,onClick,...rest}){
  css();
  return <span className={`aura-ins${open?' aura-ins--open':''}`} {...rest}>
    <span className="aura-ins__caret" role="button" aria-label={label} onClick={onClick}/>
    {open&&text&&<span className="aura-ins__pop">
      <span className="aura-ins__label">{label}</span>
      <span className="aura-ins__ghost">{text}</span>
      <span className="aura-ins__acts">
        {onAccept&&<button type="button" className="aura-ins__ok" onClick={onAccept}>{acceptLabel}</button>}
        {onDismiss&&<button type="button" className="aura-ins__no" onClick={onDismiss}>Verwerfen</button>}
      </span>
    </span>}
  </span>;
}
