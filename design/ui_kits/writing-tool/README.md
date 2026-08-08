# UI-Kit · Onda Write (Schreibwerkzeug)

Interaktive Referenz-Oberfläche des agentischen KI-Schreibwerkzeugs — Produktname „Onda Write". Kein Original-Produkt vorhanden; dieses Kit **definiert** die Referenz-Screens aus den Aura-Foundations und -Komponenten.

**Screens** (`index.html`, klickbar):
1. **Dokumente** — Startansicht: Sidebar, Dokumentliste mit Spalten (Titel, Status, Besitzer, Bearbeitet), Tabs, Suche.
2. **Editor** — Lesespalte (680px) mit Agent-Vorschlag (neutrale Fläche, Eyebrow, Annehmen/Verwerfen), rechtes Agent-Panel: Aura-Orb, Arbeitsschritte, Composer.
3. **Overlays** — Teilen-Dialog, Toasts, Light/Dark-Umschalter (persistiert nicht).

**Interaktionen:** Karte → Editor · Vorschlag annehmen/verwerfen → Toast · Anweisung senden → Aura „thinking" → neuer Vorschlag · Theme-Toggle · Segmented Tabs Bearbeiten/Lesen.

Dateien: `icons.jsx` (Lucide-Pfade), `shell.jsx` (Sidebar + Topbar), `home.jsx`, `editor.jsx`, `app.jsx` (State + Routing). Alles komponiert aus `window.AuraDesignSystem_6ddaae`-Primitiven; Screens teilen sich über `window.WT`.
