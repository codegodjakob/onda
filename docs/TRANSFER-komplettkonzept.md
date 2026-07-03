# KI-Schreibwerkzeug — Komplett-Transfer (Stand 2026-06-30)

> **Zweck:** Selbst-enthaltener Übergabe-Text. Wer das von oben bis unten liest, hat das gesamte Konzept und den aktuellen Stand — ohne weitere Dateien. Zum Weiterarbeiten in einer neuen Claude-Session einfach komplett einfügen.
> **Wichtig:** Der Nutzer (Jakob) ist nicht-technisch — bitte in einfacher Sprache erklären, Dev-Jargon vermeiden.

---

## 0. Was wird gebaut?
Ein **persönliches Desktop-Schreibwerkzeug** (lokal-first) für **alle Textformen** — von der wissenschaftlichen Arbeit bis zum Essay/Blog.

**Produktkern (wichtig, das Selbstverständnis):** Es ist *kein* „KI-Schreibprogramm", sondern ein **Werkzeug zum Bauen, Prüfen und Ausformulieren von Gedankenstrukturen.** Die KI prüft und strukturiert; sie schreibt nicht ungefragt.

---

## 1. Leitmetapher: Text als Bauwerk
**Ein Text ist kein Strom von Sätzen, sondern eine geordnete Kette von Gedankenbausteinen.** Der Denkraum darf chaotisch sein; der finale Text muss linear, verbunden und tragfähig sein. Der rote Faden entsteht durch die **logische Verbindung** der Bausteine — nicht durch schöne Formulierungen.

**Formel:** Bausteine + Reihenfolge + Verbindung = Textstruktur (wissenschaftlich: + Belege).

**Bauprozess:** Material sammeln → zuschneiden (klare Aussage) → klassifizieren (Rolle) → tragende Struktur bauen → Nebensteine einsetzen → **Fugen schließen** (Übergänge) → **Statik prüfen** (trägt die Argumentation?) → Oberfläche glätten (Stil). Kurz: Denken → Ordnen → Verbinden → Schreiben → Prüfen → Überarbeiten.

**Zwei wichtige Präzisierungen:**
- **Gedankenblock → Funktionsblock** sind zwei Schritte: erst eine klare Aussage (Inhalt), dann ihre Aufgabe im Ganzen (Rolle). Derselbe Gedanke kann je nach Stelle eine andere Funktion haben.
- **Spine ≠ roter Faden.** Der Spine ist nur die *Reihenfolge*. Zum **roten Faden** wird er erst, wenn aus Reihenfolge **logische Notwendigkeit** wird — jeder Block macht den nächsten notwendig („A führt zu B, weil … B macht C notwendig, deshalb …"). Reihenfolge = Nebeneinander; Faden = Zwang.

---

## 2. Der Baustein (das zentrale Objekt)
Jeder Baustein trägt:
- **Inhalt** — was wird gesagt?
- **Rolle** — These · Argument · Beleg · Beispiel · Einwand · Konsequenz · Übergang · Schluss
- **Funktion** — warum steht das hier? (Beitrag zur Gesamt-Argumentation)
- **Fuge davor / danach** — die logische Verbindung, mit Label (denn · dadurch · deshalb · daraus folgt · aber). Begründung: „warum folgt B aus A?"
- **Beleg** — wodurch gestützt?
- **Status-Ladder (8 Stufen):** roh → geformt → eingeordnet → verbunden → belegt → ausformuliert → geprüft → final

**Prüfdreiklang** (je Baustein/Abschnitt): *Warum steht das hier? · Was folgt daraus? · Wodurch ist es begründet?*

---

## 3. Die drei Ansichten (UI) — Sammeln · Ordnen · Schreiben
Drei Ansichten desselben Dokuments = die drei Akte. **Jede hat genau EINEN Job.** Phase 1 ist überspringbar (direkt zu 2).

**UI-Prinzip (wichtig, frisch entschieden):** sehr **clean**. Oben eine schlanke Leiste = die **Prozess-Schritte** (Sammeln › Ordnen › Schreiben). Werkzeuge sind **kontextuell, kein festes Dock** — der Rand bleibt leer, Werkzeuge erscheinen nur bei Bedarf. (Ein früheres rechtes Icon-Dock wurde verworfen — wirkte zu unruhig.)

### 1 · Sammeln — Canvas (Denkraum, optional)
Freie Fläche (wie Figma): alle Bausteine — Gedanken, Notizen, Quellen — frei verteilen, per Schnur oder Nähe clustern, anklicken & einsehen. Die KI füllt mit Vorschlägen (Wikipedia, Grokipedia, Papers, YouTube — jeweils mit der **passenden Stelle**), Ideen, Verknüpfungen; erkennt Überthemen und Dubletten → Cluster entstehen. **Bewusst unstrukturiert.** Ziel: reicher Denkraum.

### 2 · Ordnen — Struktur (das HERZSTÜCK)
Aus dem Denkraum die **lineare, logisch verknüpfte Struktur** bauen. Der Wert des ganzen Tools liegt hier: im Übergang von losem Material zu tragfähiger Argumentation.
- **Mitte:** der Spine — Bausteine in Reihenfolge, mit **Fugen** dazwischen (logisches Label; schwache Fuge = „Begründung fehlt"). Gruppen einklappbar (wie Notion). Jeder Baustein zeigt Rolle + Reifegrad-Punkt.
- **Baustein anklicken** → Detail-Panel: Funktion · Prüfdreiklang · Belege · Reifegrad-Leiter · **KI-Hinweis** (kontextuell, z. B. „Lücke: Beleg fehlt").
- **Ambient-Statik:** farbige Punkte + „Begründung fehlt"-Fugen zeigen Schwachstellen direkt in der Struktur. „Struktur prüfen" (leise Aktion) öffnet die Statik-Übersicht (lose Fugen, unbelegte tragende Argumente, leere Knoten).
- **Meta-Narrative** (auf Abruf): die Hauptaussage je Abschnitt + eine Gesamt-Erzählung — der rote Faden, losgelöst vom Text lesbar.
- Ziel: vollständige, lückenlos verknüpfte Struktur.

### 3 · Schreiben — Text
Links die fertige Struktur (aufklappbar) + Meta-Narrative, in der Mitte der Text, rechts KI-Vorschläge **nur zu Formulierung & Stil** — das Inhaltliche ist in 1+2 entschieden. Beleg-Markierungen inline, Wächter streicht kühne Behauptungen ohne Beleg dezent an.

---

## 4. Die KI — Rolle
**Primär Strukturprüfer, nicht Schreiber.** Sie soll: clustern · Lücken erkennen · Verbindungen vorschlagen · Gegenargumente prüfen · Redundanzen markieren. Sie **schreibt nie ungefragt** und ändert nie automatisch Inhalt — sie **markiert + schlägt vor**, du entscheidest. Vorschläge sind **verankert** (zeigen klar, worauf sie sich beziehen) und melden sich **sanft** (kleines Zeichen, nie Pop-up). Beim Formulieren (Ansicht 3) pro Abschnitt umschaltbar **Coach** (stellt Fragen) ↔ **Co-Autor** (formuliert auf Abruf mit).

---

## 5. Quellen & externes Wissen — drei Ebenen (klar getrennt)
1. **Quellen-Bibliothek** — deine kuratierten, *zitierbaren* Quellen: PDF · Web/URL · DOI · Text · **Audio/Video** (Transkription mit Zeitstempel; Beleg springt zur Minute). Beim Import: KI-Zusammenfassung + Kernthesen. **Kontextbezogene Stellen-Vorschläge (RAG)** passend zum aktuellen Baustein, mit Relations-Label (stützt/widerspricht/erweitert/Beispiel). Beleg-Klick → Reader/Player springt zur Stelle.
2. **Kontext-Lexikon** — Enzyklopädien (Wikipedia · Grokipedia · weitere, anbieter-pluggable), entity-/themenbasiert am aktuellen Knoten. **Kein Beleg**, sondern Orientierung & **Brücke zu Primärquellen** (Quellenangaben des Eintrags → zitierbare Quelle holen). Verlässlichkeit gelabelt.
3. **Web-Recherche** — offene Suche für ganz neue Themen/Quellen.

---

## 6. Roter Faden, Wächter, Historie
- **Denkraum vs. Spine:** Graph = reicher Denkraum; Spine = die eine gewählte lineare Reihenfolge = die Textreihenfolge. Off-Spine bleibt im Denkraum, stört den Leser nie. → löst „entdecken ohne verwirren".
- **Wächter:** technisch „roter Faden = Graph-Pfad" — jeder Knoten braucht einen Pfad zur These. Prüft: Beitrag zur These, **Fugen** (Übergänge/Non-sequitur), Reihenfolge, Vollständigkeit je Genre, Belegdeckung, Redundanz, **„Statik"** (trägt die Argumentation?). Nur Hinweise.
- **Konsistenz/Propagation:** Änderung wirkt die Kette entlang bis ggf. zur These; Widersprüche werden markiert (⚠) + Anpassungs-Vorschläge — nie automatisch inhaltlich.
- **Historie:** Baum aus Checkpoints (auto + manuell), non-destruktiv; Varianten gefahrlos ausprobieren; Gutes per Klick zurückholen (einzelne Stellen oder ganze Variante) — **kein** Git-artiges Auto-Merge.

---

## 7. Stil & Textformen
- **Textform-Konfiguration emergent + speicherbar:** keine festen Genre-Vorlagen. Struktur/Stil/Zitierweise/KI-Modus entstehen fließend (aus grober Beschreibung + lernend); bewährte Konfigurationen speicherst du als wiederverwendbare Vorlage.
- **Stilprofil:** lebend, lernt *deine* Stimme (Ziel: deine Stimme konsistent halten, **nicht** perfekte KI-Imitation — die senkt das Gefühl von Urheberschaft); reift, ist als **portables Profil** über Projekte übertragbar; mehrere möglich.
- **Stil-Linter:** Registerbrüche, Tempuswechsel, Bandwurmsätze, Floskeln, Passiv-Übermaß, Du/Sie-Inkonsistenz, unerklärter Jargon. Nur Hinweise.

---

## 8. Getroffene Entscheidungen (kompakt)
| Frage | Entscheidung |
|---|---|
| Projektziel | Persönliches Tool, kein Login/Multi-User |
| Plattform | Desktop-App (Tauri) |
| Kern | Ein strukturiertes Dokument (Argument-Graph); 4 Säulen darauf |
| Struktur ↔ Text | Hybrid |
| Entdeckungs-Quelle | eigene Quellen + KI-Wissen + Web |
| KI-Hinweise | sanft, verankert (kleines Zeichen, nie Pop-up) |
| Projekt-Zuschnitt | frei verschachtelter Vault |
| KI-Schreibrolle | pro Abschnitt umschaltbar (Coach ↔ Co-Autor) |
| Roter Faden | genau **ein** aktiver Spine + Historie/Varianten |
| Führungsstil | frei mit Abruf (Schritte sind Landkarte, kein Zwang) |
| Stil-Quelle | Genre-Default + lernt deine Stimme; portables Stilprofil |
| Quellentypen | PDF · Web · DOI · Text · Audio/Video (Zeitcode) |
| Kontext-Lexikon | Wikipedia · Grokipedia · weitere (pluggable); Brücke zu Primärquellen |
| Propagation | Änderungen propagieren; Widersprüche markiert + Vorschläge, nie auto-inhaltlich |
| Detail-Ebenen | Story → Funktionen → Argumentkette → Prosa |
| Textform-Konfig | emergent + speicherbar |
| Historie/Varianten | Checkpoint-Baum; Umschalten + Cherry-Pick (kein Voll-Merge) |
| Export | Word/LaTeX/MD/HTML (Pandoc); volles CSL; auto-Bibliografie; **Export-Profile mit Formvorgaben** |
| Cloud/Lokal | Spektrum **Lokal · Selbst-gehostet (VPS) · Cloud**; Default Hybrid + Lokal-only-Schalter; Provider = beliebiger OpenAI-kompatibler Endpoint |
| Datenschutz | nur Ausschnitte verlassen den Rechner; API-Keys im OS-Schlüsselbund; Claude zero-retention |
| Kosten | eigener API-Key; Modell-Tiering; Kosten-Schätzung + Budget; Prompt-Caching |
| UI | clean; **Prozess-Schritte oben**; Werkzeuge **kontextuell** (kein festes Dock); drei Ansichten |
| Baustein-Modell | Inhalt · Rolle · Funktion · Fugen (Label) · Beleg · **Status-Ladder (8)** |

---

## 9. Tech-Stack & Datenmodell (recherche-gestützt)
**Stack:** Tauri v2 · **Tiptap/ProseMirror** (striktes Schema these/argument/beleg, echte Decorations) · SQLite via `sqlx` im Rust-Kern (WAL) · **sqlite-vec** (vec0) + FTS5 (Hybrid-Suche) · lokale Embeddings **fastembed-rs + BGE-M3** (API optional) · **bge-reranker-v2-m3** (async) · **NLI-Cross-Encoder** für Relations-Label (entailment→stützt etc.) · API-Keys via OS-**Keychain** (`keyring`) · LLM-Streaming über Tauri **ipc-Channel** · **Whisper** lokal für AV-Transkription · **GROBID** (Sidecar) + **lopdf** für PDF · CSL-JSON intern, **Pandoc** + BibLaTeX-Export (citeproc-js/WASM statt citeproc-rs).

**Datenmodell (Richtung):** Editor-Baum = Prosa/Outline; Graph-Wahrheit (Kanten, zyklisch) = SQLite. Knoten = **stabile UUIDs**.
- `nodes`(id, type[these|argument|beleg], claim_label, prose_block_id, textform_role, status)
- `edges`(from, to, relation[stützt|widerspricht|erweitert|beispiel|undercut], confidence, `is_in_map` = Sandbox/Vorschlag vs. im Graph)
- `sources`(csl_json, citation_key, file_path, tldr, kernthesen)
- `belege`(node_id, source_id, **polymorpher Anker**: page/bbox *oder* t_start/t_end, passage_text, anchor als **relative/CRDT-Position** — nie absolute Offsets)
- `embeddings`(sqlite-vec) + `emb_meta`(model_id versioniert) + `fts`(FTS5)
**Regeln:** „Roter Faden" = Erreichbarkeits-Query (Knoten ohne Pfad zur aktiven These). RAG-Pipeline: BGE-M3 → Hybrid Top-100 → Rerank Top-10 → NLI-Label.

**Differenzierung (Landschaft):** Kein bestehendes Tool beherrscht den **Graph-↔-Live-Prosa-Roundtrip** — das ist die Lücke. Vorbilder: Scrivener (Synopsis/3 Views), Ulysses (driftfreie Outline), Argdown (Plaintext↔Map, ID-stabil), Kialo (Atomarität, Pfad-Minimap), Lex (KI nur auf Summon). **Nicht** den Obsidian-Hairball-Graph als Hauptnavigation.

---

## 10. Meilensteine (Bau-Reihenfolge)
- **M1 — Fundament:** Tauri + SQLite + Tiptap (Schema, stabile IDs) + Vault + die **Ordnen-Ansicht** (Spine, Bausteine, Fugen, Reifegrad). MVP-Fokus: *aus losem Material entsteht eine klare, prüfbare Struktur.* Noch ohne KI.
- **M2 — Quellen:** Import (PDF/Text/URL), Metadaten, Reader, Beleg ↔ Stelle.
- **M3 — Wächter & RAG:** Erreichbarkeits-Wächter; Embeddings + Hybrid-Suche; Vorschlags-Queue (nie direkt in Graph).
- **M4 — Formulierung & Stil:** LLM-Anbindung; Coach/Co-Autor; Stilprofil & Linter.
- **M5 — Entdeckung (KI+Web) & Audio/Video & Export.**

---

## 11. Prototyp (aktueller Stand)
Klickbares UI-Mockup unter **`prototype/index.html`** (eine einzelne HTML-Datei, läuft offline im Browser per Doppelklick; Beispiel-Inhalte, **noch ohne echte KI/Speicherung**). Zeigt: die drei Ansichten, oben die Prozess-Schritte, die clean Ordnen-Ansicht mit Spine + Fugen + „Begründung fehlt", Baustein-Klick → Detail (Funktion/Prüfdreiklang/Belege/Reifegrad/KI-Hinweis), „Struktur prüfen", Sammeln-Canvas (ziehbare Karten), Schreiben-Text. Werkzeuge kontextuell, kein Dock.

---

## 12. Offene Punkte / nächste Schritte
- Narrative- und Quellen/Lexikon-Zugriff kontextuell wieder einbinden (waren am verworfenen Dock).
- Umfang der Formvorgaben-Engine (Layout, Titelblatt, Institution).
- Konkretes lokales Modell & Erststart-Download-UX.
- Zuverlässigkeit der Struktur-Erkennung aus Freitext.
- Reife-Signal, wann eine Textform-Konfiguration als Vorlage angeboten wird.
- Tech-Risiken: citeproc-js/WASM, ProseMirror-ID-Stabilität, Prosa↔Graph-Konsistenz, sqlite-vec-Skalierung, GROBID-Gewicht, Reranking-Latenz.

---

## 13. Forschungs-Quellen (für die Entscheidungen)
- Scrivener Scrivenings: literatureandlatte.com/blog/view-and-edit-multiple-documents-with-scrivenings
- Ulysses Outline: stories.ulysses.app/ulysses-20-outline
- Argdown: argdown.org/syntax · Kialo Minimap: support.kialo-edu.com/en/hc/discussion-minimap
- Obsidian-Graph-Kritik: codeculture.store/blogs/developer-culture/obsidian-graph-view-useful
- Ghost-Text/Homogenisierung: arxiv.org/abs/2409.11360 · Ownership-Studie: arxiv.org/html/2411.03137v2 · Verankerte Karten: arxiv.org/html/2509.16128v1 · Timing > Inhalt: arxiv.org/pdf/2505.10742
- fastembed-rs: github.com/Anush008/fastembed-rs · GROBID: grobid.readthedocs.io · DOI/CSL: citation.doi.org/docs.html

---

*Ende des Transfers. Arbeitssprache Deutsch, Nutzer nicht-technisch (einfache Sprache). Beim Weiterbauen: M1 = die Ordnen-Ansicht (Strukturraum) ist der Kern — dort zuerst echten Wert zeigen.*
