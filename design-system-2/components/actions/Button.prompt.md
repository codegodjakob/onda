Button löst genau die Aktion aus, die sein Label benennt — Verb, Sentence case, eine `primary` pro Ansicht.

```jsx
<Button onClick={save}>Dokument erstellen</Button>
<Button variant="secondary" icon={<PencilIcon/>}>Bearbeiten</Button>
<Button variant="ghost">Abbrechen</Button>
```

Varianten: `primary` (Akzentfarbe), `secondary` (weiße Fläche + Haarlinie), `ghost`, `danger`. Größen `sm|md|lg` (32/40/48px, großzügige Innenränder, Radius `--radius-lg`/`--radius-xl`). `loading` zeigt Spinner und sperrt; `icon` nimmt ein 15px-Stroke-Icon (Lucide, stroke 1.75).
