(function(){
const {Button, Input, Select, Dialog, Toast} = window.AuraDesignSystem_6ddaae||{};
const {Icon, Sidebar, Topbar, Home, Editor} = window.WT||{};

const DOCS=[
 {id:1,title:'Quartalsbericht Q3',time:'Bearbeitet vor 2 Std.',status:'Entwurf',tags:['Finanzen','Q3'],owner:'Mira Lang',shared:true,words:1024,
  snippet:'Sieben Prozent über Plan, getragen von drei Entwicklungen.',
  paras:['Das dritte Quartal schließt mit einem Umsatz von 4,8 Mio. € — sieben Prozent über Plan. Drei Entwicklungen tragen das Ergebnis: die neue Preisstruktur, der Ausbau des Partnervertriebs und eine stabilere Auslastung im Kerngeschäft.',
   'Für das vierte Quartal erwarten wir moderates Wachstum. Die Pipeline ist gut gefüllt; zwei Großabschlüsse verschieben sich voraussichtlich ins neue Jahr und sind entsprechend konservativ eingeplant.'],
  suggestion:{text:'Die Bruttomarge stieg auf 61 Prozent (Q2: 57 Prozent). Haupttreiber ist der geringere Infrastrukturaufwand nach der Migration; die Einsparung wirkt ab Oktober vollständig.',source:'Quelle: Datenraum Q3'}},
 {id:2,title:'Produktankündigung Herbst',time:'Bearbeitet gestern',status:'Geprüft',tags:['Marketing'],owner:'Jon Beck',shared:true,words:640,
  snippet:'Ankündigungstext für die Herbstversion — Ton ruhig, Nutzen zuerst.',
  paras:['Die Herbstversion bündelt, was viele von euch angefragt haben: schnellere Entwürfe, verlässlichere Quellen, ein ruhigeres Interface.','Verfügbar ab dem 12. Oktober für alle Arbeitsbereiche. Bestehende Dokumente bleiben unverändert.']},
 {id:3,title:'Interviewleitfaden Nutzerstudie',time:'Bearbeitet vor 3 Tagen',status:'Entwurf',tags:['Research'],owner:'Ada Rossi',words:820,
  snippet:'Halbstrukturierter Leitfaden, 45 Minuten, sechs Themenblöcke.',
  paras:['Der Leitfaden führt in 45 Minuten durch sechs Themenblöcke. Einstieg offen halten; konkrete Nachfragen erst ab Block drei.','Abschluss: Rückblick auf die Kernaufgabe und eine offene Frage nach dem, was gefehlt hat.']},
 {id:4,title:'Onboarding-Handbuch',time:'Bearbeitet vor 1 Woche',status:'Veröffentlicht',tags:['Intern'],owner:'Tom Weiß',words:2210,
  snippet:'Erste Woche, Werkzeuge, Ansprechpartner — als lebendes Dokument gepflegt.',
  paras:['Dieses Handbuch begleitet die erste Woche: Zugänge, Werkzeuge, Ansprechpartner. Es wird fortlaufend gepflegt; Änderungen sind im Verlauf nachvollziehbar.','Bei Fragen zuerst hier nachsehen, dann im Kanal #onboarding fragen.']},
 {id:5,title:'Wochennotiz KW 29',time:'Bearbeitet vor 5 Min.',status:'Entwurf',tags:['Notiz'],owner:'Mira Lang',words:310,
  snippet:'Kurzer Wochenrückblick für das Team — drei Punkte, keine Anhänge.',
  paras:['Drei Punkte aus dieser Woche: der Bericht steht zur Prüfung, die Studie startet Montag, das Archiv ist aufgeräumt.','Nächste Woche: Fokus auf den Q4-Plan.']}
];

const STEPS_THINKING=[{state:'done',label:'Quellen gelesen'},{state:'done',label:'Struktur erstellt'},{state:'active',label:'Abschnitt 2 schreiben'},{state:'todo',label:'Zitate prüfen'}];
const STEPS_DONE=[{state:'done',label:'Quellen gelesen'},{state:'done',label:'Struktur erstellt'},{state:'done',label:'Abschnitt 2 schreiben'},{state:'done',label:'Zitate prüfen'}];

function ShareDialog({open,onClose,toast}){
  return <Dialog open={open} onClose={onClose} title="Dokument teilen" description="Alle mit dem Link sehen die aktuelle Version."
    footer={<React.Fragment><Button variant="ghost" onClick={onClose}>Schließen</Button><Button onClick={()=>{toast('success','Link kopiert');onClose()}}>Link kopieren</Button></React.Fragment>}>
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <Input label="Link" readOnly value="onda.app/d/qb-q3-8f2k"/>
      <Select label="Rechte" options={['Lesen','Kommentieren','Bearbeiten']} defaultValue="Kommentieren"/>
    </div>
  </Dialog>;
}

function App(){
  const [screen,setScreen]=React.useState('home');
  const [activeId,setActiveId]=React.useState(1);
  const [tab,setTab]=React.useState('alle');
  const [mode,setMode]=React.useState('edit');
  const [theme,setTheme]=React.useState('light');
  const [agent,setAgent]=React.useState('idle');
  const [suggState,setSuggState]=React.useState('pending');
  const [shareOpen,setShareOpen]=React.useState(false);
  const [toasts,setToasts]=React.useState([]);
  React.useEffect(()=>{document.documentElement.dataset.theme=theme},[theme]);
  const toast=(tone,title,description)=>{
    const id=Date.now()+Math.random();
    setToasts(t=>[...t,{id,tone,title,description}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3600);
  };
  const doc=DOCS.find(d=>d.id===activeId);
  const openDoc=id=>{setActiveId(id);setScreen('editor');setMode('edit')};
  const goHome=()=>setScreen('home');
  const onNew=()=>toast('info','Noch nicht verdrahtet','Demo — legt kein Dokument an.');
  const onSend=()=>{
    setAgent('thinking');
    setTimeout(()=>{setAgent('idle');setSuggState('pending');toast('success','Vorschlag bereit','Im Text markiert.')},2600);
  };
  return <div className="wt-app">
    <Sidebar screen={screen} docs={DOCS} activeId={activeId} goHome={goHome} openDoc={openDoc} onNew={onNew} theme={theme} toggleTheme={()=>setTheme(t=>t==='light'?'dark':'light')}/>
    <div className="wt-body">
      {screen==='editor'&&<Topbar screen={screen} doc={doc} goHome={goHome} mode={mode} setMode={setMode} onShare={()=>setShareOpen(true)} agent={agent}/>}
      {screen==='home'
        ? <Home docs={DOCS} openDoc={openDoc} onNew={onNew} tab={tab} setTab={setTab}/>
        : <Editor doc={doc} mode={mode} agent={agent} steps={agent==='thinking'?STEPS_THINKING:STEPS_DONE} suggState={activeId===1?suggState:'rejected'}
            onAccept={()=>{setSuggState('accepted');toast('success','Übernommen')}}
            onReject={()=>{setSuggState('rejected');toast('info','Verworfen','Der Absatz wurde entfernt.')}}
            onSend={onSend}/>}
    </div>
    <ShareDialog open={shareOpen} onClose={()=>setShareOpen(false)} toast={toast}/>
    <div className="wt-toaster">{toasts.map(t=><Toast key={t.id} tone={t.tone} title={t.title} description={t.description} onDismiss={()=>setToasts(x=>x.filter(y=>y.id!==t.id))}/>)}</div>
  </div>;
}

const mount=document.getElementById('wt-root');
if(mount&&Sidebar&&Home&&Editor)ReactDOM.createRoot(mount).render(<App/>);
})();
