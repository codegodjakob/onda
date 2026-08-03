Toast: leise Bestätigung oder Fehlermeldung — Titel in 1–3 Wörtern („Gespeichert"), optional eine Aktion („Rückgängig").

```jsx
<Toast tone="success" title="Gespeichert"/>
<Toast tone="danger" title="Export fehlgeschlagen" description="Keine Verbindung." actionLabel="Erneut versuchen" onAction={retry} onDismiss={hide}/>
```
