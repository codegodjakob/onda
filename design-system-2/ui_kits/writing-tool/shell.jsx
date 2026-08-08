(function(){
const {Button, IconButton, Avatar, Badge, Tabs, Aura, Tooltip} = window.AuraDesignSystem_6ddaae||{};
const {Icon} = window.WT||{};

function NavItem({icon,label,active,onClick}){
  return <button className={`wt-nav${active?' wt-nav--active':''}`} onClick={onClick}><Icon name={icon} size={16}/>{label}</button>;
}

function Sidebar({screen,docs,activeId,goHome,openDoc,onNew,theme,toggleTheme}){
  return <aside className="wt-side">
    <div className="wt-side__brand"><Aura size={20} state="quiet"/><span>Onda Write</span></div>
    <nav className="wt-side__nav">
      <NavItem icon="file-text" label="Dokumente" active={screen==='home'} onClick={goHome}/>
      <NavItem icon="users" label="Geteilt" onClick={goHome}/>
      <NavItem icon="archive" label="Archiv" onClick={goHome}/>
    </nav>
    <div className="wt-side__label">Zuletzt</div>
    <div className="wt-side__recent">
      {docs.slice(0,4).map(d=><button key={d.id} className={`wt-side-doc${screen==='editor'&&activeId===d.id?' wt-side-doc--active':''}`} onClick={()=>openDoc(d.id)}><Icon name="file-text" size={14}/><span>{d.title}</span></button>)}
    </div>
    <div className="wt-side__foot">
      <Avatar name="Mira Lang" size="sm" online/>
      <span className="wt-side__user">Mira Lang</span>
      <Tooltip label={theme==='light'?'Dark Mode':'Light Mode'}><IconButton size="sm" label="Theme wechseln" onClick={toggleTheme}><Icon name={theme==='light'?'moon':'sun'} size={15}/></IconButton></Tooltip>
    </div>
  </aside>;
}

function Topbar({screen,doc,goHome,mode,setMode,onShare,agent}){
  return <header className="wt-top">
    {screen==='home'
      ? <div className="wt-top__title">Dokumente</div>
      : <div className="wt-top__crumb">
          <IconButton size="sm" label="Zurück" onClick={goHome}><Icon name="chevron-left" size={16}/></IconButton>
          <span className="wt-top__doc">{doc.title}</span>
          <Badge tone={doc.status==='Geprüft'?'success':doc.status==='Veröffentlicht'?'accent':'warning'}>{doc.status}</Badge>
        </div>}
    <div className="wt-top__right">
      {screen==='editor'&&<Tabs variant="segmented" active={mode} onChange={setMode} items={[{id:'edit',label:'Bearbeiten'},{id:'read',label:'Lesen'}]}/>}
      {screen==='editor'&&<Button variant="secondary" size="sm" icon={<Icon name="share" size={14}/>} onClick={onShare}>Teilen</Button>}
      {screen==='editor'&&<Aura size={24} state={agent==='thinking'?'thinking':'quiet'} label={agent==='thinking'?'Agent arbeitet':'Agent bereit'}/>}
    </div>
  </header>;
}

window.WT=window.WT||{};window.WT.Sidebar=Sidebar; window.WT.Topbar=Topbar;
})();
