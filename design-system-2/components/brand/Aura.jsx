const CSS = `
.aura-orb{position:relative;display:inline-block;border-radius:var(--radius-full);flex:none}
.aura-orb::before{content:"";position:absolute;inset:-14%;border-radius:var(--radius-full);background:var(--gradient-aura);filter:blur(11px);opacity:.24;animation:aura-halo 8s var(--ease-in-out) infinite}
.aura-orb__disc{position:absolute;inset:0;border-radius:var(--radius-full);overflow:hidden;box-shadow:var(--shadow-glow)}
.aura-orb__swirl{position:absolute;inset:-30%;background:var(--gradient-aura);animation:aura-swirl 20s linear infinite}
.aura-orb__disc::after{content:"";position:absolute;inset:0;border-radius:var(--radius-full);background:radial-gradient(circle at 32% 26%,rgba(255,255,255,.45),rgba(255,255,255,0) 52%)}
.aura-orb--idle{animation:aura-breathe 8s var(--ease-in-out) infinite}
.aura-orb--thinking{animation:aura-breathe 2.6s var(--ease-in-out) infinite}
.aura-orb--thinking .aura-orb__swirl{animation-duration:4s}
.aura-orb--thinking::before{animation-duration:2.6s;opacity:.34}
.aura-orb--quiet .aura-orb__disc{box-shadow:none}
.aura-orb--quiet::before{display:none}
.aura-orb--quiet .aura-orb__swirl{animation-duration:30s}
@keyframes aura-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}
@keyframes aura-swirl{to{transform:rotate(360deg)}}
@keyframes aura-halo{0%,100%{opacity:.18;transform:scale(1)}50%{opacity:.32;transform:scale(1.06)}}
@media (prefers-reduced-motion:reduce){.aura-orb,.aura-orb__swirl,.aura-orb::before{animation:none!important}}
`;
function css(){if(typeof document!=='undefined'&&!document.getElementById('aura-css-orb')){const s=document.createElement('style');s.id='aura-css-orb';s.textContent=CSS;document.head.appendChild(s)}}
export function Aura({size=40,state='idle',label='KI-Agent',style,...rest}){
  css();
  const px=typeof size==='string'?(parseFloat(size)||40):size;
  return <span className={`aura-orb aura-orb--${state}`} style={{width:px,height:px,...style}} role="img" aria-label={label} title={label} {...rest}>
    <span className="aura-orb__disc"><span className="aura-orb__swirl"/></span>
  </span>;
}
