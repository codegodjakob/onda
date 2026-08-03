const CSS = `
.aura-avatar{position:relative;display:inline-flex;align-items:center;justify-content:center;border-radius:var(--radius-full);background:var(--surface-3);color:var(--ink-700);font-family:var(--font-sans);font-weight:var(--fw-bold);flex:none;user-select:none;overflow:visible}
[data-theme="dark"] .aura-avatar{color:var(--text-secondary)}
.aura-avatar img{width:100%;height:100%;border-radius:var(--radius-full);object-fit:cover}
.aura-avatar--sm{width:24px;height:24px;font-size:var(--text-xs)}
.aura-avatar--md{width:32px;height:32px;font-size:var(--text-xs)}
.aura-avatar--lg{width:40px;height:40px;font-size:15px}
.aura-avatar__status{position:absolute;right:-1px;bottom:-1px;width:9px;height:9px;border-radius:var(--radius-full);border:2px solid var(--bg-surface);background:var(--accent)}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-avatar')){const s=document.createElement('style');s.id='aura-css-avatar';s.textContent=CSS;document.head.appendChild(s)}}
const TINTS=[['var(--surface-3)','var(--ink-700)']];
function initials(name){const p=name.trim().split(/\s+/);return (p[0][0]+(p[1]?p[1][0]:'')).toUpperCase()}
export function Avatar({name='?',src,size='md',tinted=false,online=false,style,...rest}){
  css();
  let st=style;
  if(tinted&&!src){const h=[...name].reduce((a,c)=>a+c.charCodeAt(0),0)%TINTS.length;st={background:TINTS[h][0],color:TINTS[h][1],...style}}
  return <span className={`aura-avatar aura-avatar--${size}`} style={st} title={name} {...rest}>
    {src?<img src={src} alt={name}/>:initials(name)}
    {online&&<span className="aura-avatar__status"/>}
  </span>;
}
