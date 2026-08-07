const CSS = `
.aura-thread{display:flex;flex-direction:column;gap:16px}
.aura-bubble-row{position:relative;isolation:isolate;display:flex;max-width:min(92%,560px);animation:aura-bubble-in var(--dur-normal) var(--ease-out) backwards}
.aura-bubble-row--agent{align-self:flex-start}
.aura-bubble-row--user{align-self:flex-end;justify-content:flex-end}
.aura-bubble__shape{position:absolute;left:0;top:0;z-index:0;pointer-events:none;filter:drop-shadow(0 1px 5px rgba(28,26,23,0.07))}
.aura-bubble__shape path{fill:var(--bg-surface);stroke:var(--border-subtle);stroke-width:1}
[data-theme="dark"] .aura-bubble__shape{filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4))}
.aura-bubble__cloud{position:absolute;z-index:-1;left:-14px;top:-10px;width:124px;height:96px;border-radius:50%;background:var(--gradient-aura-soft);filter:blur(26px);opacity:.26;animation:aura-cloud 11s var(--ease-in-out) infinite}
.aura-bubble__avatar{position:absolute;z-index:2;left:6px;top:6px}
.aura-bubble-row--seat-top .aura-bubble__avatar{left:auto;right:6px;top:6px}
.aura-bubble-row--seat-top .aura-bubble__cloud{left:auto;right:-14px;top:-10px}
.aura-bubble-row--user .aura-bubble__avatar{position:static;order:2;margin-left:10px;flex:none}
.aura-bubble{position:relative;z-index:1;display:flex;flex-direction:column;gap:10px;min-width:0;padding:18px 20px;font-size:var(--text-base);line-height:var(--leading-normal);color:var(--text-primary);font-family:var(--font-sans);border-radius:var(--radius-panel)}
.aura-bubble--agent{background:var(--bg-surface);border:1px solid var(--border-subtle);box-shadow:var(--shadow-xs)}
.aura-bubble-row--goo .aura-bubble--agent{background:transparent;border:none;box-shadow:none;min-height:110px;padding:14px 20px 16px 56px}
.aura-bubble-row--goo.aura-bubble-row--seat-top .aura-bubble--agent{min-height:120px;padding:44px 22px 20px}
.aura-bubble--user{background:var(--bg-sunken);border:1px solid var(--border-subtle)}
.aura-bubble__head{display:flex;align-items:baseline;gap:9px;font-size:inherit;font-weight:var(--fw-bold)}
.aura-bubble__meta{font:var(--type-caption);color:var(--text-tertiary)}
.aura-bubble__body{display:flex;flex-direction:column;gap:8px}
.aura-bubble__body p{margin:0}
.aura-bubble__card{background:var(--bg-surface);border:1px solid var(--border-default);border-radius:var(--radius-panel);padding:18px 20px;display:flex;flex-direction:column;gap:8px;box-shadow:var(--shadow-xs)}
.aura-bubble__actions{display:flex;gap:8px;margin-top:2px}
.aura-bubble__think{display:flex;flex-direction:column;gap:8px;padding-top:2px}
.aura-bubble__think span{height:9px;border-radius:var(--radius-sm);background:linear-gradient(90deg,var(--bg-sunken) 0%,var(--bg-hover) 40%,var(--bg-sunken) 80%);background-size:220% 100%;animation:aura-think-sweep 1.9s var(--ease-in-out) infinite}
.aura-bubble__think span:nth-child(1){width:62%}
.aura-bubble__think span:nth-child(2){width:88%;animation-delay:.12s}
.aura-bubble__think span:nth-child(3){width:44%;animation-delay:.24s}
@keyframes aura-bubble-in{from{opacity:0;transform:translateY(6px)}}
@keyframes aura-think-sweep{0%{background-position:120% 0}100%{background-position:-120% 0}}
@keyframes aura-cloud{0%,100%{opacity:.22;transform:scale(1)}50%{opacity:.34;transform:scale(1.05)}}
@media (prefers-reduced-motion:reduce){.aura-bubble-row,.aura-bubble__cloud{animation:none}}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-bubble')){const s=document.createElement('style');s.id='aura-css-bubble';s.textContent=CSS;document.head.appendChild(s)}}
/* Eine durchgehende Silhouette: Orb-Sitzkreis (R24) läuft tangential in die Panelkante,
   ein exakt tangentialer konkaver Fillet (R10) schließt die Gegenseite an.
   seat='left': Orb links oben, Blase wächst nach rechts. seat='top' : Orb rechts oben, Blase wächst nach unten. */
function gooPath(W,H){
  return `M 24 0 H ${W-12} A 12 12 0 0 1 ${W} 12 V ${H-12} A 12 12 0 0 1 ${W-12} ${H} H 46 A 12 12 0 0 1 34 ${H-12} V 58 A 10 10 0 0 0 24 48 A 24 24 0 0 1 0 24 A 24 24 0 0 1 24 0 Z`;
}
/* seat='top': dieselbe Kontur, um 90° gedreht — der Sitz landet oben rechts. Eine Geometrie, zwei Sitze. */
export function Bubble({from='agent',seat='left',name,meta,avatar,card,actions,thinking=false,children,className='',...rest}){
  css();
  const goo=from==='agent'&&!!avatar;
  const top=seat==='top';
  const ref=React.useRef(null);
  const inner=React.useRef(null);
  const [dim,setDim]=React.useState({w:0,h:0});
  React.useLayoutEffect(()=>{
    if(!goo)return;
    let alive=true;
    const measure=()=>{
      const el=ref.current;if(!el||!alive)return;
      const r=el.getBoundingClientRect();
      setDim(d=>(Math.abs(d.w-r.width)<0.25&&Math.abs(d.h-r.height)<0.25)?d:{w:r.width,h:r.height});
    };
    measure();
    const ro=new ResizeObserver(measure);
    ro.observe(ref.current,{box:'border-box'});
    if(inner.current)ro.observe(inner.current,{box:'border-box'});
    if(typeof document!=='undefined'&&document.fonts&&document.fonts.ready)document.fonts.ready.then(measure).catch(()=>{});
    return()=>{alive=false;ro.disconnect()};
  },[goo,thinking,children,card,actions,top]);
  /* Die eigene Fläche der Blase verschwindet nur, wenn die SVG-Kontur sie ersetzt —
     kleine Blasen behalten Hintergrund, Haarlinie und Schatten. */
  const shape=goo&&dim.w>=100&&dim.h>=(top?118:104);
  return <div ref={ref} className={`aura-bubble-row aura-bubble-row--${from}${shape?' aura-bubble-row--goo':''}${top?' aura-bubble-row--seat-top':''} ${className}`} {...rest}>
    {shape&&<svg className="aura-bubble__shape" width={dim.w} height={dim.h} viewBox={`0 0 ${dim.w} ${dim.h}`} aria-hidden="true">
      {top
        ? <g transform={`translate(${dim.w},0) rotate(90)`}><path d={gooPath(dim.h,dim.w)}/></g>
        : <path d={gooPath(dim.w,dim.h)}/>}
    </svg>}
    {goo&&<span className="aura-bubble__cloud"/>}
    {avatar&&<span className="aura-bubble__avatar">{avatar}</span>}
    <div ref={inner} className={`aura-bubble aura-bubble--${from}`}>
      {(name||meta)&&<div className="aura-bubble__head">{name&&<span>{name}</span>}{meta&&<span className="aura-bubble__meta">{meta}</span>}</div>}
      {thinking
        ? <div className="aura-bubble__think" role="status" aria-label="Antwort wird vorbereitet"><span/><span/><span/></div>
        : <React.Fragment>
            {children&&<div className="aura-bubble__body">{children}</div>}
            {card&&<div className="aura-bubble__card">{card}</div>}
            {actions&&<div className="aura-bubble__actions">{actions}</div>}
          </React.Fragment>}
    </div>
  </div>;
}
