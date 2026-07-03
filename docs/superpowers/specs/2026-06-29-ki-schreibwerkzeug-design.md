# KI-Schreibwerkzeug — Konzept-Dokument

> **Status:** Brainstorming-Konzept (lebendes Dokument) — noch *kein* Implementierungs-Spec.
> **Datum:** 2026-06-29
> **Verwandt:** [Design-Research-Brief](../../research/2026-06-29-design-research-brief.md) · Master-Diagramm (in der Session gerendert)

## Vision

Ein persönliches Desktop-Schreibwerkzeug für **alle Textformen** — von der wissenschaftlichen Arbeit über Essays bis zu Blog/Kommentar. Es unterstützt den **gesamten** Schreibprozess: Es hilft, neue relevante Themen und **Verknüpfungen in Argumentationsketten** zu entdecken, hält dabei aber **immer einen klaren roten Faden** und eine klare Meta-Struktur, hilft beim Formulieren im **passenden Stil je Text**, und verwaltet Quellen (inkl. Audio/Video), aus denen es kontextpassende Stellen vorschlägt.

## Leitprinzipien

1. **Denkraum vs. roter Faden trennen.** Der Argument-*Graph* ist der reiche, verzweigte Denkraum; der *Spine* ist eine einzige lineare, geordnete Auswahl daraus — und genau diese Sequenz ist die Textreihenfolge. „Ein klarer roter Faden" ist damit in jedem Moment wahr.
2. **Entdeckungen drängen sich nie in den Text.** Neues landet im stillen Seitenkanal → wird in der Sandbox erkundet → nur **bewusst promotete** Knoten werden Teil des Graphen/Spine.
3. **Die KI schreibt nie ungefragt.** Co-Autor-Vorschläge nur auf explizites Abrufen; kein Always-on-Ghost-Text. Provenienz (KI vs. ich) bleibt sichtbar.
4. **Deine Stimme statt KI-Sound.** Ziel ist nicht perfekte Imitation (senkt das Gefühl von Urheberschaft), sondern *deine* Stimme konsistent halten.
5. **Geführt, aber frei.** Der Prozess-Begleiter kann Schritt für Schritt führen — aber nur auf Abruf; jederzeit frei navigierbar, mit Historie zum Vor- und Zurück-Iterieren.
6. **Lokal-first.** Daten und Verarbeitung lokal; KI-/Web-Zugriffe gezielt und transparent.

## Getroffene Entscheidungen

| Frage | Entscheidung |
|---|---|
| Projektziel | Persönliches Tool (kein Login, kein Multi-User) |
| Plattform | Desktop-App (Tauri) |
| Säulen | Alle vier, vereint durch **einen** Kern (strukturiertes Dokument) |
| Struktur ↔ Text | Hybrid (Knoten halten Text *und* KI erkennt Struktur aus Freitext) |
| Entdeckungs-Quelle | Eigene Quellen + KI-Wissen + Web |
| Vorschlag-Modus | **Sanfter Hinweis**: kleines Zeichen leuchtet auf (nie Pop-up); Vorschläge sammeln sich im Seitenkanal, gezeigt in Pausen/auf Abruf |
| Projekt-Zuschnitt | Frei verschachtelter Vault (Ordner/Projekte schachtelbar, frei verlinkbar) |
| KI-Schreibrolle | **Pro Abschnitt** umschaltbar: Coach ↔ Co-Autor |
| Roter Faden | Genau **ein** aktiver Spine + Historie/Branches für Varianten |
| Führungsstil | Frei mit Abruf |
| Stil-Quelle | Genre-Default + lernt deine Stimme; iterativ reifend; als **portables Stilprofil** speicherbar |
| Quellentypen | PDF · Web/URL · DOI · Text · **Audio/Video** (Transkription + Zeitcode-Anker) |
| Kontext-Lexikon | Enzyklopädien (Wikipedia · Grokipedia · weitere, **anbieter-pluggable**) als kontextuelles Referenz-Panel; Brücke zu Primärquellen, kein Beleg |
| Prozess-Navigation | Frei hin- & herspringen; Änderungen propagieren; Widersprüche markiert (⚠) + KI-**Anpassungs-Vorschläge** zur Annahme/Ablehnung, nie automatisch inhaltlich |
| Funktions-Ebene | Jeder Abschnitt trägt eine Funktion ("why is this here?"); die Kette = Argumentations-Story |
| Detail-Ebenen | Story → Funktionen → Argumentkette → Prosa; progressiv & non-linear verfeinert (Reifegrad je Abschnitt) |
| Stationen | Festes Gerüst; Struktur-Station nicht überspringbar; eigene Anpassung optional/später |
| KI-Aufgaben | Index/Suche/Reranking/Transkription/Relations-Label **lokal**; Scan/Formulierung/Entdeckung/Web via **Claude** (Haiku/Sonnet/Opus je Aufgabe) |
| Cloud/Lokal | Spektrum **Lokal · Selbst-gehostet (VPS) · Anbieter-Cloud**; Default Hybrid + Lokal-only-Schalter; Provider = beliebiger OpenAI-kompatibler Endpoint, pro Aufgabe mischbar |
| Datenschutz | Nur Ausschnitte verlassen den Rechner (transparent); API-Keys im OS-Schlüsselbund; Claude zero-retention |
| Kosten | Eigener API-Key; Modell-Tiering je Aufgabe; Kosten-Schätzung + Budget-Limit; Prompt-Caching |
| Textform-Konfiguration | **Emergent + speicherbar**: keine festen Vorlagen; Struktur/Stil/Zitierweise/KI-Modus entstehen fließend & lernend, bewährte Konfigurationen als Vorlage sicherbar (wie Stilprofil) |
| Historie & Varianten | Nichts geht verloren (jeder Stand gespeichert & zurückholbar); Varianten gefahrlos ausprobieren; Gutes per Klick übernehmen (einzelne Stellen oder ganze Variante), vom Wächter geprüft; **kein** automatisches Verschmelzen |
| Export & Zitierstile | Spine → Dokument (Word/LaTeX/MD/HTML via Pandoc); volles CSL (APA/MLA/…); auto-Bibliografie; **Export-Profile mit Formvorgaben** (Titelblatt, Ränder, Form-/Zitierregeln), abgabefertig |
| Oberfläche | Drei Kern-Bereiche immer sichtbar (roter Faden · Text · Hinweise); **Reiter nur innerhalb** der Seiten-Panels (Hinweise/Quellen/Lexikon/Entdeckung); Panels aufziehbar & einklappbar; Quellen-Reader als aufziehbares unteres Panel |
| Ansichten | Drei: **Mindmap** (assoziativ sammeln & verknüpfen = Denkraum) → **Struktur** (lineare Bausteine per Drag-&-Drop, mit Narrative-Spalte) → **Text** (schreiben). Frühere „Stationen" nur noch grobe Fortschritts-Anzeige |
| Baustein-Modell | Jeder Baustein: Inhalt · Rolle · Funktion · **Fuge davor/danach** (logisches Label: deshalb/dadurch/daraus folgt/aber) · Beleg · **Status-Ladder** (roh→geformt→eingeordnet→verbunden→belegt→ausformuliert→geprüft→final). Wächter prüft **Fugen** (Übergänge) & **„Statik"** (trägt die Argumentation?) |

## Architektur-Überblick (5 Ebenen)

1. **Vault & Organisation** — frei verschachtelte Ordner/Projekte; ein Projekt enthält Texte, eine geteilte Quellen-Bibliothek, Stilprofile und einen Projekt-Graph (Makro-Übersicht).
2. **Ein Text: Denkraum → roter Faden** — der Argument-Graph (These/Argument/Beleg + Tangenten) und der daraus gewählte lineare Spine (= Textreihenfolge). Off-Spine-Knoten bleiben im Denkraum, stören den Leser nie.
3. **Quellen-Pipeline** — alle Quellentypen → Ingest & Scan (TL;DR + Kernthesen) → Index (Embeddings + Volltext) → Belege mit polymorphem Anker (Seite/bbox bei PDF, Zeitcode bei Audio/Video). Klick → Reader/Player springt zur Stelle.
4. **KI-Schichten (vier Säulen)** — lesen Graph + Quellen, schreiben nie ungefragt.
5. **Prozess-Begleiter & Historie** — Stationen (Klären · Sammeln · Struktur · Entwerfen · Schärfen · Export) als Landkarte (frei mit Abruf); Historie mit Checkpoints und Branches.

## Kern-Datenmodell (Richtung, aus Research-Brief)

- **Editor-Baum** = Prosa/Outline; **Graph-Wahrheit** (Kanten, zyklisch) = SQLite-Tabellen. Knoten mit **stabilen UUIDs**, nicht wortlaut-basiert.
- Tabellen (Richtung): `nodes` (id, type these|argument|beleg, claim_label, prose_block_id, textform_role, status), `edges` (from, to, relation stützt|widerspricht|erweitert|beispiel|undercut, `is_in_map` = Sandbox/Vorschlag vs. im Graph), `sources` (csl_json, citation_key, file_path, tldr, kernthesen), `belege` (node_id, source_id, **polymorpher Anker**: page/bbox *oder* t_start/t_end, passage_text, anchor als relative Position), `embeddings` (sqlite-vec) + `emb_meta` (model_id versioniert), `fts` (FTS5).
- **„Roter Faden" = Graph-Pfad-Eigenschaft**: jeder Knoten braucht einen gerichteten Pfad zur aktiven These; der Wächter ist im Kern eine Erreichbarkeits-Query.
- Beleg-Anker als **relative/CRDT-Position**, nie als absoluter Offset (bricht sonst bei Textänderung).

## Die vier Säulen

### 1 · Struktur & roter Faden
- Meta-Struktur immer sichtbar: oben zwingend eine These/Kernfrage; die Faden-Leiste (Spine) ist immer präsent.
- Jeder Spine-Knoten hat eine **Rolle** (genreabhängig: These, Argument, Beleg, Einwand, Überleitung, Schluss …).
- **Roter-Faden-Wächter** (nur Hinweise, blockiert nie): Beitrag zur These, logische Übergänge/Non-sequitur, Reihenfolge, Vollständigkeit je Genre, Belegdeckung, Redundanz.
- Spine umsortieren = Abschnitte umsortieren; exportiert wird nur, was auf dem Spine liegt.

### 2 · Quellen
- Schnell hinzufügen (Drag-&-Drop, URL, DOI), automatisch scannen (TL;DR + Kernthesen + Tags), Reader/Player-Panel.
- **Kontextbezogene Stellen-Vorschläge (RAG):** passend zum aktuellen Argument-Knoten; mit Relations-Label (stützt/widerspricht/erweitert/Beispiel). Ein Klick → Beleg-Knoten + Zitat.
- **Audio/Video:** Transkription mit Zeitstempeln → gleicher RAG-Fluss; Belege verweisen auf eine Zeitspanne, Player springt dorthin.

**Drei Ebenen externen Wissens** (klar getrennt): (1) **Quellen-Bibliothek** — deine kuratierten, zitierbaren Quellen. (2) **Kontext-Lexikon** — Enzyklopädien (Wikipedia, Grokipedia, weitere; anbieter-pluggable), entity-/themenbasiert am aktuellen Knoten im Panel angeboten; Wert v. a. als **Brücke zu Primärquellen** (Quellenangaben des Eintrags → zitierbare Quelle in die Bibliothek holen). Anbieter + Verlässlichkeit gelabelt (Wikipedia community-editiert, Grokipedia KI-generiert); Lexikon = Orientierung, kein Beleg. (3) **Web-Recherche** — offene Suche für neue Themen/Quellen.

### 3 · Formulierung & Stil
- **Pro Abschnitt** umschaltbar: Coach (sokratisch, du formulierst) ↔ Co-Autor (formuliert auf explizites Abrufen mit). Default genreabhängig.
- **Stilprofil**: Genre-Default als Basis, dann lernt das Tool laufend *deine* Stimme (aus Text + Annahme/Ablehnung von Hinweisen), reift iterativ, ist als **benanntes, portables Profil speicher- und übertragbar**. Messbar verankert (Satzlängen, lexikalische Vielfalt, Konnektoren, Person/Tempus …).
- **Stil-Linter** (Pendant zum Wächter): Registerbrüche, Tempuswechsel, Bandwurmsätze, Floskeln/„KI-Phrasen", Passiv-Übermaß, Du/Sie-Inkonsistenz, unerklärter Jargon. Nur Hinweise.
- **Kontext erkennen**: rollen- & genrebewusst (Überleitung ≠ Beleg-Absatz ≠ Fazit).
- **Textform emergent statt Vorlage**: Struktur/Register/Zitierweise/KI-Modus entstehen fließend (aus deiner groben Beschreibung + lernend); keine vorgegebenen Genre-Vorlagen — bewährte Konfigurationen speicherst du selbst als wiederverwendbare Vorlage (symmetrisch zum Stilprofil).

### 4 · Entdeckung
Fünf Arten, alle durch denselben geschützten Kanal (Seitenkanal → Sandbox → bewusst promoten):
1. Neue Belege (aus Quellen, geerdet)
2. Neue Teil-Argumente (übersehene Claims)
3. **Querverbindungen** zwischen vorhandenen Knoten (stützt / Spannung / Redundanz / fehlende Brücke) — der eigentliche Schatz, = „Verknüpfungen in Argumentationsketten"
4. Gegenargumente & Lücken (Steelman, Schwachstellen)
5. Neue Themen/Zweige (KI-Wissen + Web)
- Läuft **nicht permanent** (Timing schlägt Inhalt): im Leerlauf, auf Knopfdruck, beim Knotenwechsel; pulsendes Badge statt Pop-up. Triage je Karte: promoten · in Sandbox · später · verwerfen.

## Prozess-Begleiter & Historie
- Stationen als Landkarte; jede schaltet den passenden Arbeitsplatz frei (Panels + KI-Modus).
- **Frei mit Abruf**: keine erzwungene Führung; „führe mich zum nächsten Schritt" auf Wunsch.
- **Historie**: jeder Schritt ein Checkpoint; zurückspringen, vergleichen, **Variante abzweigen** (non-destruktiv). Deckt auch alternative Spine-Versionen ab.

### Stationen im Detail
Jede Station: *was du tust · was das Tool tut · Signal zum Weitergehen.*
1. **Klären** — Thema, These/Kernfrage, Genre, Zielgruppe, Umfang. Tool: Genre-Vorlage laden (Struktur-Schablone + Stil-Default + KI-Modus-Default), Coach-Fragen zur These. → eine (vorläufige) These steht.
2. **Sammeln** — Quellen hinzufügen & scannen, Kontext-Lexikon konsultieren, Claims/Notizen in den Denkraum. Tool: Auto-Scan, Triage-Inbox, Entity→Lexikon, Claim-Extraktion. → genug Material.
3. **Struktur** — Graph bauen, Querverbindungen entdecken, Spine wählen & Rollen vergeben. Tool: Graph-Editor, Entdeckungs-Seitenkanal, Wächter (Erreichbarkeit/Vollständigkeit). → kohärenter Spine von These zu Schluss.
4. **Entwerfen** — Rohtext je Spine-Knoten (auch write-first). Tool: Coach/Co-Autor pro Abschnitt, kontextuelle Beleg-Vorschläge, Struktur-Erkennung aus Freitext. → Rohfassung aller Knoten.
5. **Schärfen** — Kohärenz, Stil, Belegdeckung, Übergänge, Redundanz. Tool: Reverse-Outline-Check, Stil-Linter + Stilprofil, Leser-Simulation. → konsistenter, belegter, runder Text.
6. **Export** — Zielformat, Zitierstil, Bibliografie, Formvorgaben. Tool: Spine → flaches Dokument, Pandoc/BibLaTeX. → fertige Datei.

Stationen sind **nicht-linear** (Rück-Schleifen normal), führen nur **auf Abruf**, und sind jederzeit über die Historie navigierbar.

## Lebendes Gefüge: Funktion, Zoom-Ebenen & Konsistenz

Der Text ist ein **kohärentes, lebendes Gefüge**, kein lineares Dokument. Man springt frei zwischen Stationen/Abschnitten; jede Änderung wird **propagiert**, entstehende **Widersprüche werden markiert** (nie still überschrieben).

**Funktions-Ebene ("why is this here?").** Jeder Abschnitt/Knoten trägt neben der Prosa eine Funktions-Karte: *worum es geht* (1–2 Sätze Synopsis) · *Funktion* in der Gesamt-Argumentation ("etabliert die Prämisse für Kapitel 4") · *wohin es führt* · *warum hier*. Die Kette dieser Funktionen = die **Argumentations-Story**, die der rote Faden erzählt; das Dokument lässt sich allein als Funktions-Kette anzeigen (Story-Ansicht), losgelöst von der Prosa.

**Zoom-/Detail-Ebenen** (progressiv & non-linear verfeinert):
- **L0** Argumentations-Story (These + Funktions-Kette)
- **L1** Abschnitts-Funktionen (Synopsis je Abschnitt: worum/warum/wohin)
- **L2** Argumentkette + Belege (der Graph)
- **L3** Prosa (ausformulierter Text)

Man baut grob beginnend immer detaillierter auf, bis das Endprodukt finalisiert ist; ein **Reifegrad** je Abschnitt zeigt skelettartig vs. fertig.

**Konsistenz-Wächter** (Erweiterung des Roten-Faden-Wächters): Bei Änderungen werden betroffene Abschnitte markiert, Widersprüche zwischen Knoten erkannt und gekennzeichnet (⚠), und die KI bietet konkrete Anpassungs-Vorschläge zur Annahme/Ablehnung. **Nie automatische inhaltliche Änderung** — markieren + vorschlagen, du entscheidest.

**Stationsspezifische KI.** Jede Station bietet eine *andere* Art von Unterstützung und andere relevante Inhalte/Quellen (Klären: These-Coaching · Sammeln: Quellen/Lexikon · Struktur: Querverbindungen & Story-Lücken · Entwerfen: Formulierung + Beleg-Vorschläge · Schärfen: Stil/Kohärenz/Leser-Simulation · Export: Zitier-/Format-Checks).

## Historie & Varianten

- **Nichts geht verloren.** Jeder Stand wird gespeichert (automatisch an sinnvollen Punkten + manuell benannt) und ist jederzeit zurückholbar; Zurückspringen löscht spätere Stände nicht.
- **Gefahrlos ausprobieren.** Du legst eine Probe-Version an (z. B. andere Reihenfolge oder eine andere Fassung eines Abschnitts), ohne deinen aktuellen Stand zu gefährden.
- **Gutes zurückholen.** Aus einer Probe-Version übernimmst du per Klick entweder einzelne Stellen oder die ganze Version. Das Tool zeigt die Unterschiede und warnt (Konsistenz-Wächter), wenn etwas nicht mehr zusammenpasst.
- **Kein automatisches Verschmelzen** (kein Git-artiger Auto-Merge) — das würde den roten Faden unkontrolliert gefährden.
- **Vergleichen** geht auf jeder Ebene — von der groben Story bis zur Prosa.

## Export & Zitierstile

- **Spine → Dokument**: Spine wird in Reihenfolge zu Prosa abgeflacht; off-Spine, Funktions-Karten & Graph bleiben Arbeitsebene. Belege → Zitate + automatische Bibliografie (nur zitierte, optional ganze Bibliothek).
- **Formate**: Word (.docx), LaTeX/PDF, Markdown, HTML via Pandoc (+ BibLaTeX für LaTeX).
- **Zitierstile**: volles **CSL** (APA/MLA/Chicago/IEEE/DIN …); intern CSL-JSON.
- **Sonderfälle**: AV-Belege als Zitat mit Zeitstempel; Kontext-Lexikon kein Beleg (Sekundärquelle mit Zugriffsdatum oder über die Primärquelle).
- **Export-Profile mit Formvorgaben**: speicherbare Layout-Profile (Titelblatt, Ränder, Zeilenabstand, Form-/Zitierregeln, z. B. „Lehrstuhl X") → direkt abgabefertig, wiederverwendbar über Texte/Projekte.

## Restliche Detail-Entscheidungen (einfache Sprache)

- **KI-Hinweise – sanfter Hinweis:** ein kleines Zeichen leuchtet auf, wenn die KI etwas Interessantes hat; nie ein Pop-up. Vorschläge sammeln sich im Seitenkanal, gezeigt in Pausen/auf Abruf.
- **Offline-KI-Modell:** bewährtes Modell, das auf normalen Rechnern läuft; Download beim ersten Einschalten mit klarer Fortschrittsanzeige.
- **YouTube & Tondateien:** YouTube-Links und eigene Audio-/Videodateien; vorhandene Untertitel werden genutzt, sonst Tonspur automatisch abgehört & mitgeschrieben.
- **Struktur aus Freitext:** nur auf Knopfdruck vorgeschlagen (nicht ständig automatisch); Übernahme wird bestätigt.
- **Stil/Vorlage speichern:** jederzeit manuell; zusätzlich sanftes Angebot, sobald sich der Stil über mehrere Texte eingependelt hat.
- **Zurückgeholter Teil passt nicht mehr:** Stelle wird markiert + Anpassung vorgeschlagen, du entscheidest.

## Leitmetapher: Text als Bauwerk

Leitbild des ganzen Tools (vom Nutzer formuliert): **Ein Text ist kein Strom von Sätzen, sondern eine geordnete Kette von Gedankenbausteinen.** Der Denkraum darf chaotisch sein; der finale Text muss linear, verbunden und tragfähig sein. Der rote Faden entsteht durch die **logische Verbindung** der Bausteine, nicht durch schöne Formulierungen.

**Formel:** Bausteine + Reihenfolge + Verbindung = Textstruktur (wissenschaftlich: + Belege).

**Drei Räume = drei Ansichten:** Denkraum (Mindmap: Notizen, Quellen, Zitate, Ideen, Fragen, Gegenargumente — ungeordnet) → Strukturraum (Struktur: geordnete Bausteine mit Rollen — These · Argument · Beleg · Beispiel · Einwand · Konsequenz · Übergang) → Textraum (Text: Absätze, Übergänge, Fazit).

**Der Baustein** trägt: Inhalt · Rolle · Funktion (warum hier?) · Fuge davor (woraus folgt es?) · Fuge danach (wohin führt es?) · Beleg · Status-Ladder (roh → geformt → eingeordnet → verbunden → belegt → ausformuliert → geprüft → final).

**Bauprozess:** Steine sammeln → zuschneiden (klare Aussage) → klassifizieren (Rolle) → tragende Struktur bauen (Argumentationskette) → Nebensteine einsetzen (Beispiele/Quellen) → **Fugen schließen** (Übergänge, logische Verbindungen) → **Statik prüfen** (trägt die Argumentation?) → Oberfläche glätten (Stil). Kurz: Denken → Ordnen → Verbinden → Schreiben → Prüfen → Überarbeiten.

**Zwei Schärfungen fürs Tool:** (1) **Fugen sind erstklassig** — Verbindungen tragen ein logisches Label (deshalb · dadurch · daraus folgt · aber); die KI prüft gezielt die Übergänge, nicht nur die Bausteine. (2) **„Statik prüfen" = Tragfähigkeit der Argumentation** (jeder Baustein erreicht die These, keine unbelegten tragenden Argumente, keine Sprünge) — der Kern des Roten-Faden-Wächters.

**Präzisierung (Blocksystem):** (a) **Gedankenblock → Funktionsblock** sind zwei Schritte — erst eine klare Aussage (Inhalt), dann ihre Aufgabe im Ganzen (Rolle: Ausgangspunkt · Prämisse · Problem · Gegenmodell · Hauptthese · Ableitung · Anwendung). Derselbe Gedanke kann je nach Stelle eine andere Funktion haben. (b) **Spine ≠ roter Faden:** Der Spine ist nur die *Reihenfolge*; zum **roten Faden** wird er erst, wenn aus Reihenfolge **logische Notwendigkeit** wird — jeder Block macht den nächsten notwendig (»A führt zu B, weil … B macht C notwendig, deshalb …«). Die Fugen tragen daher eine **Begründung**, und der Wächter prüft nicht nur, ob ein Übergang passt, sondern ob der Schritt *notwendig/begründet* ist — oder nur danebengestellt.

## Drei Ansichten: Mindmap → Struktur → Text

Drei Ansichten desselben Dokuments; die früheren „Stationen" sind nur noch eine grobe Fortschritts-Anzeige, keine getrennten Seiten.

1. **Mindmap (Denkraum)** — assoziativ & bewusst un-/leicht strukturiert: zu Thesen sammelst du Argumente, Belege, Quellen und Ableitungen und verknüpfst sie frei. Hier zählt noch keine Reihenfolge.
2. **Struktur (linear)** — aus dem Denkraum ziehst du die lineare Abfolge: **Bausteine** per Drag-&-Drop ordnen, verbinden, anklicken → Detail (These + Belege: Wikipedia · Grokipedia · Studienauszug · YouTube …). Daneben die **Narrative-Spalte**: oben die Gesamt-Erzählung (Meta-Ebene), darunter die Hauptaussage je Abschnitt. Plus **Info & KI**: Wiki-/Studien-Funde und Hinweise je Baustein.
3. **Text** — das Schreibfeld: entwerfen + schärfen am selben Ort, Quellen direkt angeführt.

Klären & Sammeln passieren emergent in Mindmap/Struktur; Entwerfen & Schärfen im Text. Die Narrative-Spalten machen die Zoom-Ebenen (Story → Funktionen) direkt sichtbar.

## UI-Verfeinerung: die drei Ansichten im Detail (Sammeln · Ordnen · Schreiben)

*Ergänzung — verwirft nichts, präzisiert nur das Aussehen. First-Principles-Ziel: weniger Modi, ruhiger Bildschirm; jede Ansicht hat genau einen Job. Sehr minimalistisches UI. Klickbarer Prototyp: `prototype/index.html`.*

**1 · Sammeln — Canvas (optional, überspringbar).** Freie Fläche wie Figma: alle Bausteine (Gedanken, Notizen, Quellen) frei verteilen, per Schnur oder Nähe clustern, anklicken & einsehen. Die KI füllt die Fläche mit Vorschlägen (Wikipedia, Grokipedia, Papers, YouTube — jeweils mit der passenden Stelle), mit Ideen und Verknüpfungen; erkennt Überthemen und Dubletten, sodass über Zeit Cluster entstehen. Ziel: ein reicher, grob geclusterter Denkraum. Diese Phase ist überspringbar (direkt zu 2).

**2 · Ordnen — Struktur (Herzstück).** Drei Bereiche: **links** die ungeordneten Bausteine (+ neue hinzufügen), **Mitte** die lineare Struktur (Bausteine in Reihenfolge, Gruppen einklappbar wie in Notion, jeder Baustein mit Rolle + Vollständigkeits-Punkt) mit den **Fugen** dazwischen (logisches Label: denn · verstärkt durch · daraus folgt …; schwache Fuge = „Begründung fehlt"), **rechts** umschaltbar **Narrative** (Gesamt-Narrative + Meta-Flowchart) und **KI & Kontext** (Soll-Textstruktur der Arbeitsart, Verknüpfungs- & Beleg-Vorschläge, Kontext wie Umfang/Zitierstil). Jeder Baustein muss vollständig sein (Begründung, logische Herleitung). Ziel: eine vollständige, lückenlos verknüpfte Struktur.

**3 · Schreiben — Text.** Links die fertige Struktur (aufklappbar) + die Meta-Narrative, in der Mitte der Text, rechts KI-Vorschläge **nur zu Formulierung & Stil** — das Inhaltliche ist in Schritt 1 und 2 entschieden. Ziel: der fertige Text.

## Schärfungen (Konzept-Feedback)

Klarstellungen, die nichts verwerfen, sondern den Kern schärfen:

- **Produktkern:** kein „KI-Schreibprogramm", sondern ein **Werkzeug zum Bauen, Prüfen und Ausformulieren von Gedankenstrukturen.**
- **Der Strukturraum (Ordnen) ist der Kern.** Der größte Wert liegt nicht im Sammeln oder Schreiben, sondern im **Übergang von losen Gedanken zu einer tragfähigen linearen Argumentation.**
- **Der Spine ist das zentrale Objekt** — nicht bloß eine Gliederung, sondern die aktive **Argumentationsentscheidung** des Autors (was wird in welcher Reihenfolge erzählt?). Der Spine ist die **Hauptoberfläche**; der Graph arbeitet im Hintergrund (keine Graph-Hauptansicht).
- **KI = primär Strukturprüfer:** clustern, Lücken erkennen, Verbindungen vorschlagen, Gegenargumente prüfen, Redundanzen markieren — **nicht ungefragt Text schreiben.**
- **Freier vs. strukturierter Modus getrennt:** erst frei sammeln (Phase 1 ohne Strukturzwang), dann bewusst ordnen.
- **Prüfdreiklang je Abschnitt:** *Warum steht das hier? · Was folgt daraus? · Wodurch ist es begründet?*
- **Reifegrad je Baustein (Ladder):** roh → geformt → eingeordnet → verbunden → belegt → ausformuliert → geprüft → final.
- **MVP-Fokus:** Der erste Prototyp zeigt vor allem den Strukturraum-Wert — *aus losem Material entsteht eine klare, funktionale, überprüfbare Textstruktur.*

## Empfohlener Tech-Stack (aus Research-Brief)
Tauri v2 · Tiptap/ProseMirror (striktes Schema) · SQLite via `sqlx` (Rust-Kern, WAL) · sqlite-vec + FTS5 · lokale Embeddings (fastembed-rs + BGE-M3, API optional) · bge-reranker (async) · NLI-Cross-Encoder für Relations-Label · OS-Keychain für API-Keys · LLM-Streaming über Tauri ipc-Channel · Whisper (lokal) für AV-Transkription · GROBID (optionaler Sidecar) + lopdf für PDF · CSL-JSON intern, Pandoc/BibLaTeX-Export.

## KI-Modelle, Kosten & Datenschutz

**Aufteilung lokal/Cloud:** Index, Suche, Reranking, Transkription und Relations-Label laufen **lokal** (nichts verlässt den Rechner). Scan/TL;DR, Formulierung, Entdeckung und Web-Recherche laufen über **Claude** (Haiku für günstige Scans, Sonnet fürs Formulieren, Opus fürs Reasoning) — es verlässt nur der nötige Ausschnitt den Rechner.

**Anbieter:** Standard Claude, **anbieter-pluggable** über eine **OpenAI-kompatible Endpoint-Schnittstelle** — derselbe Mechanismus für lokales LLM (Ollama), **selbst-gehostetes Modell auf einem VPS** (z. B. Hetzner-GPU mit vLLM/Ollama) oder eine Anbieter-Cloud. Pro Aufgabe mischbar (z. B. VPS für Masse/Privates, Claude fürs Schwerste).

**Posture:** Spektrum **Lokal · Selbst-gehostet (VPS) · Cloud**; Default **Hybrid** + **Lokal-only-Schalter** (komplett offline für sensible Texte).

**Datenschutz:** nur Ausschnitte gehen raus, transparent angezeigt; API-Keys im OS-Schlüsselbund (verlassen den Rust-Kern nie); Claude-API zero-retention.

**Kosten:** eigener API-Key; Modell-Tiering je Aufgabe (übersteuerbar); Kosten-Schätzung vor teuren Aktionen, laufender Zähler, Budget-Limit + Warnung; Prompt-Caching für wiederkehrenden Dokument-Kontext.

## Meilenstein-Aufteilung (jede Stufe lauffähig)
- **M1 — Fundament:** Tauri + SQLite + Tiptap (Schema these/argument/beleg, stabile IDs) + Vault + Multi-Panel + drei Views (Fließtext/Outline/Mikro-Graph) + write-first/promote-Pfad. Noch ohne KI.
- **M2 — Quellen-Basis:** Import (PDF/Text/URL), Metadaten, Reader-Panel, Beleg ↔ Stelle.
- **M3 — Wächter & RAG-Seitenkanal:** Erreichbarkeits-Wächter; Embeddings + Hybrid-Suche; Vorschlags-Queue (nie direkt in Graph); dann Reranking & NLI-Label.
- **M4 — Formulierung & Stil:** LLM-Anbindung; Coach/Co-Autor pro Abschnitt; Stilprofil & Stil-Linter.
- **M5 — Entdeckung (KI+Web) & Audio/Video & Export:** Sandbox/Promote/Triage; AV-Transkription & Zeitcode-Belege; Pandoc/BibLaTeX-Export.

## Offene Punkte (Bau-/Spec-Ebene)
Diese werden erst beim Bauen final entschieden — sie brauchen keine weitere Konzept-Entscheidung:
- Umfang der Formvorgaben-Engine (Layout-Parameter, Titelblatt-Editor) und Vorlagen je Institution.
- Konkrete Wahl & Größe des lokalen Modells (je nach Rechner-Anforderungen).
- Zuverlässigkeit der Struktur-Erkennung aus Freitext — Qualität beim Bau prüfen.
- Top-Risiken aus dem Research-Brief: citeproc-js/WASM, stabile Knoten-IDs im Editor, Konsistenz Prosa↔Graph, Vektorindex bei sehr großen Vaults, GROBID-Gewicht, Erststart-Download, Reranking-Latenz.
