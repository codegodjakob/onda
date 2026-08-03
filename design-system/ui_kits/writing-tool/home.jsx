(function(){
const {Button, Avatar, Tabs, Input} = window.AuraDesignSystem_6ddaae||{};
const {Icon} = window.WT||{};

function Home({docs,openDoc,onNew,tab,setTab}){
  const shown=tab==='alle'?docs:tab==='geteilt'?docs.filter(d=>d.shared):docs.filter(d=>d.archived);
  return <div className="wt-home">
    <div className="wt-home__head">
      <h1>Dokumente</h1>
      <span className="wt-home__count">{docs.length} Dokumente · zuletzt heute 14:32</span>
    </div>
    <div className="wt-bar">
      <Tabs active={tab} onChange={setTab} items={[{id:'alle',label:'Alle',count:docs.length},{id:'geteilt',label:'Geteilt',count:docs.filter(d=>d.shared).length},{id:'archiv',label:'Archiv'}]}/>
      <div className="wt-bar__right">
        <Input placeholder="Suchen …" style={{width:200}}/>
        <Button onClick={onNew}><Icon name="plus" size={15}/>Neues Dokument</Button>
      </div>
    </div>
    <div className="wt-list">
      <div className="wt-list__head"><span>Titel</span><span>Status</span><span>Besitzer</span><span>Bearbeitet</span></div>
      {shown.map(d=>
        <button key={d.id} className="wt-row" onClick={()=>openDoc(d.id)}>
          <span className="wt-row__main">
            <span className="wt-row__title">{d.title}</span>
            <span className="wt-row__snippet">{d.snippet}</span>
          </span>
          <span className={`wt-status wt-status--${d.status.toLowerCase()}`}><span className="wt-status__dot"></span><span className="wt-status__label">{d.status}</span></span>
          <span className="wt-row__owner"><Avatar name={d.owner} size="sm" tinted/><span className="wt-row__cell">{d.owner}</span></span>
          <span className="wt-row__cell">{d.time.replace('Bearbeitet ','')}</span>
        </button>)}
    </div>
  </div>;
}

window.WT=window.WT||{};window.WT.Home=Home;
})();
