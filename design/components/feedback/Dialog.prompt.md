Dialog für Entscheidungen, die den Fluss unterbrechen dürfen — Löschen bestätigen, Teilen konfigurieren. Bestätigungen ohne Entscheidung sind ein Toast.

```jsx
<Dialog open={open} onClose={close} title="Dokument löschen?" description="„Quartalsbericht Q3" wird endgültig entfernt."
  footer={<><Button variant="ghost" onClick={close}>Abbrechen</Button><Button variant="danger" onClick={del}>Löschen</Button></>}/>
```
