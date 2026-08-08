Tabs wechseln Ansichten innerhalb einer Fläche — `underline` auf Seitenebene (mit optionalem Zähler), `segmented` als kompakter Umschalter in Toolbars.

```jsx
<Tabs active={tab} onChange={setTab} items={[{id:'docs',label:'Dokumente',count:12},{id:'arch',label:'Archiv'}]}/>
<Tabs variant="segmented" active={mode} onChange={setMode} items={[{id:'edit',label:'Bearbeiten'},{id:'read',label:'Lesen'}]}/>
```
