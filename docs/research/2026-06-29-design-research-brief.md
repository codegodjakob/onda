# Design-Research-Brief: KI-Schreibwerkzeug (Argument-Graph)

> Ergebnis der Hintergrund-Recherche vom 2026-06-29 (9 Agenten, 8 Dimensionen). Grundlage für den späteren Implementierungs-Spec.

## 1. Landschaft & Differenzierung

Es gibt **kein Tool, das den Graph-zu-Live-Prosa-Roundtrip beherrscht** — genau das ist unsere Lücke und unser Differenzierer.

**Strukturierte Schreibwerkzeuge** zerfallen in zwei Lager: Multi-Dokument (Scrivener, Longform) vs. Einzeloberflaeche (Ulysses). Wir brauchen ein **drittes Hybrid**: ein fliessender Editor, dessen Bloecke an Graph-Knoten gebunden sind.
- **Scrivener** ([scrivenings](https://www.literatureandlatte.com/blog/view-and-edit-multiple-documents-with-scrivenings)) — naechster Praezedenzfall: eine Baum-Datenstruktur, drei synchrone Views (Binder/Corkboard/Outliner), Synopsis (Indexkarte) getrennt vom Prosakoerper. Warnung: "spent more time organizing than writing".
- **Ulysses** ([Outline](https://stories.ulysses.app/ulysses-20-outline/)) — abgeleitete, nie driftende Outline; ruhige Schreibflaeche als Vorbild.
- **Obsidian Longform** ([COMPILE.md](https://github.com/kevboh/longform/blob/main/docs/COMPILE.md)) — Reihenfolge entkoppelt von Ordnerstruktur (Frontmatter-Spine); Compile als Step-Pipeline.

**Argument-Mapping** validiert das Datenmodell:
- **Argdown** ([Syntax](https://argdown.org/syntax/)) — wichtigstes Vorbild: Plaintext↔Map-Sync, Statements/Arguments, Relationen `+`/`-`/`_`, **Equivalence Classes** (ID-stabil statt wortlaut-stabil), `statementSelectionMode` fuer zwei Graph-Ebenen.
- **Kialo** ([Minimap](https://support.kialo-edu.com/en/hc/discussion-minimap/)) — Atomaritaet (500 Zeichen/Claim), Tree-Minimap zeigt nur Vorfahren-Pfad = roter Faden.
- **Rationale** ([Regeln](https://www.reasoninglab.com/wp-content/uploads/2013/10/Argument-Maps-the-Rules.pdf)) — Schema 1 Contention, Reason/Objection/Rebuttal, "Basis-Boxen" = unser Beleg-Knoten.

**Was wir NICHT bauen:** den Obsidian-Global-Graph ([Hairball-Kritik](https://codeculture.store/blogs/developer-culture/obsidian-graph-view-useful)) — ab ~200 Knoten nutzlos, ab 500 langsam. Kein freies Force-Layout als Hauptnavigation.

**KI-Assistenz** — Vorbild **Lex** ([Review](https://freshvanroot.com/blog/ai-writing-tools/)): explizites Summon (`+++`), KI nie ungefragt. Gegenmodell: Always-on Ghost-Text als Haupt-Homogenisierungs-Vektor ([arXiv 2409.11360](https://arxiv.org/abs/2409.11360)). **AnchoredAI** ([arXiv 2509.16128](https://arxiv.org/html/2509.16128v1)) belegt: verankerte Karten > Chat (Ownership 4.0 vs 2.3).

## 2. Empfohlener Tech-Stack

| Schicht | Empfehlung | Begruendung |
|---|---|---|
| Shell | **Tauri v2** | lokal-first, schlankes Bundle, Rust-Kern als Gatekeeper |
| Editor | **Tiptap (ProseMirror)** | **striktes Schema** erzwingt These→Argument→Beleg-Grammatik; echte Decorations fuer stillen Seitenkanal. **NICHT Lexical** (kein erzwungenes Schema, keine echten Decorations), **NICHT Slate** |
| DB | **SQLite via direktem `sqlx`** im Rust-Kern, WAL-Modus | typsichere Graph-/Waechter-Logik bleibt im Backend. `tauri-plugin-sql` **vermeiden** als Kern (exponiert rohes SQL ans WebView) |
| Vektorindex | **sqlite-vec** (vec0) in derselben Vault-DB | atomare Transaktionen ueber Text+Beleg+Embedding; bei ~100k Passagen unproblematisch. Erst >100k → LanceDB |
| Embeddings | **lokal: fastembed-rs + BGE-M3** (8k Kontext, multilingual, Dense+Sparse in einem Pass) | [fastembed-rs](https://github.com/Anush008/fastembed-rs); API nur als opt-in Upgrade hinter Provider-Trait. **Nicht Nomic v2** (512 Token zu kurz), **nicht Jina v4** (CC-BY-NC) |
| Reranking | **bge-reranker-v2-m3** lokal, asynchron | Pflicht fuer Praezision; CPU ist langsam → Hintergrund-Queue, nicht blockierend |
| Relations-Label | **NLI-Cross-Encoder** (These=Premise, Passage=Hypothesis): entailment→stuetzt, contradiction→widerspricht, neutral→erweitert | scite-Lehre: rhetorische Funktion, **nicht** Sentiment/Keyword |
| Key-Verwaltung | **OS-Keychain via `keyring`** (`tauri-plugin-keyring`) | **NICHT Stronghold** (deprecated, in v3 entfernt). Key verlaesst Rust-Kern nie |
| LLM-Streaming | **Tauri ipc-Channel** (nicht Event-System) | geordnet, latenzarm; reqwest + `futures_util::StreamExt` ueber SSE |
| PDF-Ingest | **GROBID** (Docker-Sidecar) fuer Struktur+`teiCoordinates`+Referenzen; **lopdf** fuer Nicht-Paper | [GROBID](https://grobid.readthedocs.io/en/latest/Grobid-service/); ~0.87 F1 → Korrektur-UI noetig. OCR-Vorstufe fuer Scans |
| Metadaten | Wasserfall: DOI Content Negotiation → Crossref → Zotero translation-server → manuell; intern **CSL-JSON** | [citation.doi.org](https://citation.doi.org/docs.html); BibTeX/Word nur als Export |
| Export | **Pandoc** (`--citeproc --csl`) fuer docx/odt/HTML + BibLaTeX fuer LaTeX | citeproc-rs ist **nicht produktionsreif** → citeproc-js via WASM als Fallback |

## 3. Datenmodell-Empfehlung

**Leitprinzip:** Editor-Baum = Prosa/Outline (Baum); Graph-Wahrheit (Kanten, nicht-Baum, zyklisch) = SQLite-Tabellen. Knoten haben **stabile UUIDs** (Tiptap `UniqueID`-Extension), nicht Wortlaut-Identitaet (Argdown Equivalence Classes).

```
nodes        (id PK uuid, vault_id, type[these|argument|beleg],
              claim_label TEXT,        -- destillierte Aussage (Kialo-Atomaritaet)
              prose_block_id,          -- Verweis in PM-Doc/Yjs
              textform_role, status)
edges        (id PK, from_node, to_node,
              relation[stuetzt|widerspricht|erweitert|beispiel|undercut],
              confidence, is_in_map BOOL)  -- is_in_map=false = Sandbox/Vorschlag
sources      (id PK, csl_json, citation_key UNIQUE, file_path, tldr, kernthesen)
belege       (id PK, node_id FK, source_id FK,
              page, bbox(x,y,w,h),     -- GROBID-Koordinaten → Reader-Sprung
              passage_text, anchor_relpos)  -- relative/CRDT-Position, NICHT char-offset
embeddings   (vec0 virtual: embedding float[1024], rowid)  -- + Metadaten-Tabelle, kein FK
emb_meta     (rowid PK, source_id, chunk_text, model_id, dim)  -- model_id versioniert!
fts          (FTS5 ueber chunk_text + Kontext-Header)
folders/links (Vault: frei verschachtelbar; Reihenfolge als edge/sequence, NICHT Ordner)
```

**Kritische Regeln:**
- "Roter Faden" = **Graph-Pfad-Eigenschaft**, kein Feature: jeder Knoten braucht gerichteten Pfad zur These; Waechter = Erreichbarkeits-Query (`Knoten ohne Pfad zur aktiven These`).
- Beleg-Anker als **relative/CRDT-Position** (Yjs `RelativePosition`), niemals absolute Offsets — sonst brechen Verweise bei jeder Textaenderung.
- sqlite-vec vec0: **keine echten FKs, keine `NOT NULL`-Zusatzspalten** → separate Metadaten-Tabelle, `rowid`-JOIN. Modellwechsel = Re-Indexierung (daher `model_id` pro Vektor).
- Yjs (`y-prosemirror`) auch im **Single-User**-Fall: Offline-Merge, robuste Undo-Historie, stabile Positionen; binaere Updates in SQLite persistieren.

## 4. Pro Saeule: Muster + Fallstricke

**Saeule 1 — Struktur & roter Faden**
- *Muster:* Outline/Mikro-Graph/Fliesstext sind drei **Views EINES** PM-Zustands (Notions "render tree"); Scrivenings-Merge als Default-Schreibflaeche. Waechter als `appendTransaction`-Plugin + DECORATION (warnt, blockiert nie). Makro = Hierarchie-Layout (Argdown-Sections/Kialo-Tree), nie Force-Layout. Reverse-Outline als KI-Check (Topic-Sentence-Kette gegen These).
- *Fallstricke:* Struktur-als-Voraussetzung killt Flow → **write-first, structure-later** muss erstklassig sein. Outline+Prosa als zwei Dokumente führen → Drift. Ueberladene Knoten (ganze Absaetze) → unlesbare Map.

**Saeule 2 — Quellen & RAG**
- *Muster:* Pipeline = BGE-M3 → Hybrid (vec0 + FTS5) Top-100 → Rerank Top-10 → NLI-Label. **Contextual Retrieval "gratis"** aus Graph-Position/Heading-Breadcrumb (kein LLM-Call noetig). Strukturerhaltendes Chunking (Parent-Child: kleiner Chunk fuer Retrieval, Eltern-Absatz fuer Reader). Beleg klick → Reader scrollt zu bbox.
- *Fallstricke:* Naives Fixed-Size-Chunking → abbrechende Belege. Label per Sentiment statt NLI → Vertrauensverlust. CPU-Reranking blockiert Editor → asynchron.

**Saeule 3 — Formulierung & Stil**
- *Muster:* **Explizites Summon im Haupttext** (Lex `+++`), kein Ghost-Text als Default. Coach/Co-Autor pro Abschnitt, **stage-aware** (Coach default bei Planung, Co-Autor fuer Bindeprosa). Provenienz sichtbar (KI vs ich). Stil-Drift-Waechter (TTR, Satzlaengen) parallel zum These-Waechter.
- *Fallstricke:* Perfekte Stil-Mimikry senkt Ownership ("30-35% ist die KI" — [arXiv 2411.03137](https://arxiv.org/html/2411.03137v2)). Always-on Ghost-Text homogenisiert unbemerkt. Auto-Integration ohne Accept-Step zerstoert Agency.

**Saeule 4 — Entdeckung**
- *Muster:* Verankerte Karten (~25-30 Woerter) statt Chat, am Knoten/an der Stelle. **Timing schlaegt Inhalt** ([arXiv 2505.10742](https://arxiv.org/pdf/2505.10742)): nur in Pausen/Idle/Knotenwechsel, pulsendes Badge statt Pop-up. Zweistufiges Promote (Panel → Sandbox → bewusst in Graph, `is_in_map`-Flag). Inbox-Triage (Promote/Park/Snooze/Verwerfen mit Shortcuts). "Prepared randomness" aus eigenem Vault (temporal resurrection).
- *Fallstricke:* Vorschlaege im Schreib-Flow. Reiner Zufall = Doomscrolling. Snooze ohne echtes Datum = Friedhof. Vorschlaege, die ungefragt in Graph/Haupttext schreiben.

## 5. Empfohlene Bau-Reihenfolge

1. **Fundament:** Tauri + SQLite (`sqlx`, WAL) + Tiptap mit striktem Schema (these/argument/beleg) + `UniqueID`. Editor↔SQLite-Sync via `appendTransaction` (debounced Upsert).
2. **Erste sinnvolle Version (MVP):** Fliesstext-Editor + abgeleitete Outline + Mikro-Graph als drei Views; manuelles Anlegen von These/Argument/Beleg; **write-first/promote-Pfad**; getypte Kanten. Noch keine KI.
3. **Quellen-Basis:** PDF-Import (lopdf zuerst), CSL-JSON-Metadaten via DOI/Crossref, Reader-Panel mit Beleg→Stelle-Sprung. GROBID erst danach.
4. **Waechter:** Graph-Erreichbarkeit (verwaiste Knoten, Pfad-zur-These) als Decoration-Warnungen.
5. **RAG-Seitenkanal:** fastembed-rs + sqlite-vec + FTS5 Hybrid; Vorschlags-Queue (nie direkt in Graph). Dann Reranking, dann NLI-Label.
6. **KI-Formulierung:** LLM-Provider-Trait + Keychain + ipc-Channel-Streaming; Coach zuerst (Socratic), Co-Autor mit explizitem Summon danach.
7. **Entdeckung + Export:** Sandbox/Promote-UI, Triage; Pandoc/BibLaTeX-Export.

## 6. Top-Risiken & offene technische Fragen

1. **citeproc-rs nicht produktionsreif** (groesstes Risiko dieser Dimension). Frueh entscheiden: Risiko tragen oder citeproc-js via WASM. → Empfehlung: citeproc-js/WASM.
2. **ProseMirror-ID-Stabilitaet** bei copy/paste/split/undo (dokumentiertes Problem). `UniqueID` loest das meiste, aber Duplikat-Erkennung muss *bewusste* Mehrfach-Referenz von *versehentlichem* Duplikat unterscheiden. Offen: Logik im `appendTransaction`.
3. **Bidirektionale Konsistenz Prosa↔Graph** als Single Source of Truth: Editor = Quelle der Struktur, SQLite = Quelle der Kanten. Diffing nur auf geaenderte Node-IDs, Upserts debouncen — sonst Performance-Falle.
4. **sqlite-vec Brute-Force-Skalierung:** bei sehr grossen Vaults Latenz. Gegenmittel: binaere Quantisierung als Vorfilter + exaktes Re-Ranking, sonst LanceDB. Schwelle frueh festlegen.
5. **GROBID-Bundling-Gewicht** (JVM, grosses Image, RAM) widerspricht "schlank/lokal-first". Offen: gebuendelt vs. nachladbarer optionaler Sidecar.
6. **Erststart-Offline-Falle:** fastembed laedt Modell beim ersten Gebrauch. Klare Download-UX oder Modell-Bundling noetig.
7. **CPU-Reranking-Latenz** vs. Live-Vorschlaege: kleineres Modell (FlashRank/jina-v2) oder strikt asynchroner Hintergrund.
8. **Yjs + UniqueID-Mount-Timing:** Editor erst nach Provider-Sync mounten, sonst persistente Leer-Absaetze.
