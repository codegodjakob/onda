(function(){
const {Button, IconButton, Badge, Tag, Composer, Aura, Card} = window.AuraDesignSystem_6ddaae||{};
const {Icon} = window.WT||{};

function Suggestion({sugg,state,onAccept,onReject}){
  if(state==='rejected')return null;
  if(state==='accepted')return <p className="wt-read__p">{sugg.text}</p>;
  return <div className="wt-sugg">
    <div className="wt-sugg__head">
      <Aura size={13} state="quiet"/><span>Vorschlag</span><span className="wt-sugg__src">{sugg.source}</span>
      <span className="wt-sugg__acts">
        <Button size="sm" variant="ghost" onClick={onReject}>Verwerfen</Button>
        <Button size="sm" variant="secondary" onClick={onAccept}><Icon name="check" size={13}/>Annehmen</Button>
      </span>
    </div>
    <p>{sugg.text}</p>
  </div>;
}

function Step({state,label}){
  return <div className={`wt-step wt-step--${state}`}>
    {state==='done'?<span className="wt-step__ic"><Icon name="check" size={12} strokeWidth={2.25}/></span>
     :state==='active'?<span className="wt-step__ic wt-step__ic--active"></span>
     :<span className="wt-step__ic wt-step__ic--todo"></span>}
    <span>{label}</span>
  </div>;
}

function AgentPanel({agent,steps,onSend,suggState}){
  return <aside className="wt-agent">
    <div className="wt-agent__head">
      <Aura size={32} state={agent==='thinking'?'thinking':'idle'}/>
      <div><div className="wt-agent__title">Agent</div>
      <div className="wt-agent__status">{agent==='thinking'?'Entwurf wird geschrieben …':suggState==='pending'?'Vorschlag bereit — im Text markiert':'Bereit'}</div></div>
    </div>
    <div className="wt-agent__label">Arbeitsschritte</div>
    <div className="wt-agent__steps">{steps.map((s,i)=><Step key={i} state={s.state} label={s.label}/>)}</div>
    <div className="wt-agent__spacer"></div>
    <Composer onSubmit={onSend} busy={agent==='thinking'} disabled={agent==='thinking'} placeholder="Anweisung an den Agenten …"
      leading={<IconButton size="sm" label="Quelle anhängen"><Icon name="paperclip" size={15}/></IconButton>}/>
  </aside>;
}

function Editor({doc,mode,agent,steps,suggState,onAccept,onReject,onSend}){
  return <div className="wt-editor">
    <div className="wt-read" style={mode==='read'?{maxWidth:760,margin:'0 auto'}:null}>
      <div className="wt-read__inner">
        <h1 className="wt-read__title">{doc.title}</h1>
        <div className="wt-read__meta">
          <span>Zuletzt gespeichert 14:32</span><span>·</span><span>{doc.words} Wörter</span>
        </div>
        <p className="wt-read__p">{doc.paras[0]}</p>
        {doc.suggestion&&<Suggestion sugg={doc.suggestion} state={suggState} onAccept={onAccept} onReject={onReject}/>}
        {doc.paras.slice(1).map((p,i)=><p key={i} className="wt-read__p">{p}</p>)}
      </div>
    </div>
    {mode==='edit'&&<AgentPanel agent={agent} steps={steps} onSend={onSend} suggState={suggState}/>}
  </div>;
}

window.WT=window.WT||{};window.WT.Editor=Editor;
})();
