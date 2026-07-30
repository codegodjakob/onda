# Etappe A — Die KI zieht ein (echter Agent statt Kulisse)

> **Status:** Mit dem Nutzer am 26. Juli 2026 erarbeitet und für die Umsetzung freigegeben.
> **Baut auf:** `docs/STANDORT-2026-07-26.md` (Etappen-Landkarte), `2026-07-19-agentisches-schreibsystem-v2.md` (Produktlogik, Bauabschnitt 1), Onda-Oberfläche (main, 22.07.).
> **Belege:** `docs/research/2026-07-26-ki-anschluss-recherche.md` (Modell-Landschaft, Anschluss-Architektur, Agent-Patterns — je mit Quellen). Technische Detailangaben (Preise, Header, Cache-Konditionen) dort nachschlagen; bei Umsetzung gegen die aktuelle Anbieter-Doku verifizieren.
> **Zweck:** Der Agent wird echt. Alle bestehenden Oberflächen (Projektverständnis, Hinweise, Chat, Aura) werden erstmals von einem echten Modell gefüllt — bei voller Interaktionstreue der bereits gebauten Mechanik.

Bei Widersprüchen zur Produktlogik gilt die V2-Spezifikation; bei Widersprüchen zur sichtbaren Oberfläche die Onda-Spec. Dieses Dokument regelt den KI-Anschluss und das Verhalten der drei Fähigkeiten in Etappe A.

---

## 1. Ziel und Umfang

**In dieser Etappe (freigegeben):**

- **Anschluss**: Swift-Brücke in der Mac-App (Schlüssel im macOS-Schlüsselbund, Streaming), zentraler JS-Verteiler mit Task→Modell-Tabelle, Browser-Direktweg als Entwickler-/Rückfallpfad.
- **Fähigkeit 1 — Projektverständnis**: KI-geführtes Kurz-Interview („propose, don't interrogate"), Live-Füllung der bestehenden Verständnis-Felder, Korrekturen des Nutzers sind bindend.
- **Fähigkeit 2 — Hinweise**: echte Hinweis-Läufe in Schreibpausen; strukturierte Ausgaben mit wörtlichen Text-Ankern und Client-Verifikation; Einspeisung in die bestehende Finding-Mechanik (annehmen / eigene Fassung / verwerfen / Risiko).
- **Fähigkeit 3 — Chat**: echter, live gestreamter Agenten-Dialog mit vollem Projektkontext; echte Initiative statt Timer-Attrappe.
- **Mitlaufend**: Mac-App neu bauen (Onda-Stand + Brücke), Entscheidungsverlauf-Anzeige im Agenten-Panel, Kosten-/Verbrauchsanzeige in den Einstellungen, Schlüssel-Einrichtung mit Anleitung inkl. Ausgabenlimit.

**Bewusst außerhalb (spätere Etappen laut Landkarte):**

- Echte Webrecherche, Quellenimport, Belegbündel, Zitierprüfung (Etappe B).
- Langzeitgedächtnis, Aussagen-/Gegenargument-Modell (Etappe C).
- Sprach-/Wirkungs-/Anti-Slop-Prüfsysteme als eigene Stufen, Schlussaudit, Export-Ausbau, Autorschaftsnachweis (Etappe D).
- Onda-Umbau der Bibliothek; sichtbare Dateien / lokale Datenbank (Nebenstränge).
- Automatischer/gelernter Modell-Router und Multi-Agent-Verfahren (Erweiterungspfad besteht per Tabelle; Forschungslage 2026 rät für dieses Produkt ab — siehe Recherche).

## 2. Getroffene Entscheidungen

| Frage | Entscheidung |
|---|---|
| Nutzungsort | **Mac-App primär**; Browser-Weg bleibt als Entwickler-/Rückfallpfad funktionsfähig. |
| Budget-Haltung | **Qualität zuerst**; Kosten beobachten, per Caching senken, hartes Limit im Anbieter-Konto. |
| Anbieter/Modelle | **Anthropic direkt.** Stark: `claude-opus-5` (Verständnis, Hinweise, Chat). Günstig: `claude-haiku-4-5` (unsichtbare Routine). Begründung: beste belegte deutsche Langtextqualität, ausgereifteste garantierte Strukturausgaben, kein Training auf API-Daten (Recherche-Doc, Abschnitt Modell-Landschaft). Kimi K3 geprüft und verworfen (deutsche Qualität unbelegt, China-API, kaum billiger). |
| Bauweise | **Ansatz 1: Brücke + Verteiler-Tabelle** (statt Browser-only oder OpenRouter-zuerst). |
| Router-Wunsch | Von Tag 1 als **statische Task→Modell-Tabelle** im Verteiler; jede spätere Router-/Anbieter-Erweiterung ist ein Tabellen-/Transport-Eintrag, kein Umbau. |
| Multi-Agent | Nein (Spec-konform „nie Produktkern"; Evidenz: verschlechtert oft, verteuert immer). Optionaler einzelner Kritik-Durchlauf bleibt als späterer Tabelleneintrag denkbar. |
| Etappen-Reihenfolge | Fließband A → B → C → D; je Etappe eigene Spec + Plan + Umsetzung (kein Gesamt-Big-Bang). |

## 3. Architektur

### 3.1 Verteiler (`app/src/agent-gateway.mjs`, neu)

Eine zentrale, pure-JS-testbare Stelle, durch die **jeder** KI-Aufruf läuft:

- **Task-Tabelle**: `verstaendnis`, `hinweise`, `chat`, `titel`, `zusammenfassung` → je `{ modell, maxTokens, cachePolicy, schema? }`. Standard: Opus 5 für Sichtbares, Haiku 4.5 für Unsichtbares. Tabelle ist Daten, kein Code-Pfad — Erweiterungspunkt für Router/Anbieter.
- **Prompt-Aufbau mit stabiler Cache-Präfix-Ordnung**: `(1) System (Coach-Persona + 8 Hinweisarten-Definitionen) → (2) Projektverständnis → (3) Dokumenttext → [Cache-Breakpoint] → (4) Volatiles (Anfrage, Chatverlauf, Entscheidungsliste)`. Keine Zeitstempel/IDs im Präfix. Cache-Marker (`cache_control`) gemäß Anbieter-Doku; erwartete Ersparnis ~90 % auf Präfix-Reads.
- **Strukturierte Ausgaben**: für `hinweise` und `verstaendnis` JSON-Schema-erzwungene Antworten. Primär: Anthropic Structured Outputs (`output_config` mit JSON-Schema, `additionalProperties: false`); Rückfall, falls ein Schema-Detail dort nicht abbildbar ist: striktes Tool-Use (`strict: true`). Bei Umsetzung gegen die aktuelle API-Doku verifizieren. Chat als Streaming-Freitext.
- **Transport-Abstraktion**: `transport = bridge | direct`. Auswahl automatisch: Brücke, wenn `window.webkit.messageHandlers.llm` existiert; sonst Direktweg (nur mit vorhandenem Schlüssel). Beide liefern dieselbe Schnittstelle (Request → Stream-Chunks/Fertig-Ergebnis → Usage-Zahlen).
- **Usage-Zählung**: jede Antwort liefert Token-Zahlen; der Verteiler summiert pro Monat in `state.settings.usage` (additiv, tolerant, kein Schema-Bruch — Muster wie `accent`).

### 3.2 Brücke (Mac-App, `mac/main.swift` erweitert)

- Neuer Message-Handler `llm`: nimmt `{id, provider, endpoint, body, stream}` entgegen, ruft per `URLSession` auf, streamt SSE-Chunks über Callback-Events an das Schreibfenster zurück (Chunk-Weiterreichen, Zeilenpuffer im JS).
- **Schlüssel ausschließlich in der macOS-Keychain** (`kSecClassGenericPassword`, Dienst „Schreibwerkzeug"). Handler `llmkey`: setzen/prüfen/löschen — der Schlüssel selbst wird nie an den JS-Kontext zurückgegeben, nur „vorhanden: ja/nein".
- Die App wird mit `mac/build.sh` neu gebaut (Onda-Stand + Brücke); die bestehende `data.json`-Migration (Schema 3 → 6) greift beim ersten Start.

### 3.3 Browser-Direktweg (Entwickler-/Rückfallpfad)

- Direkter `fetch` zu Anthropic mit dem offiziellen Browser-Freigabe-Header (laut Recherche seit 2024 der dokumentierte „bring your own key"-Weg; bei Umsetzung gegen aktuelle Doku prüfen).
- Schlüssel dann im Browser-Speicher (`aiwt.v2`-Nachbarschlüssel), mit sichtbarem Hinweis in den Einstellungen: Mac-App = Schlüsselbund (empfohlen), Browser = Komfortweg für Entwicklung/Notfall; Ausgabenlimit im Anbieter-Konto ist Pflichtschritt der Einrichtung.
- **Der Nutzer trägt seinen Schlüssel immer selbst ein** (Einstellungen-Feld + Schritt-für-Schritt-Anleitung); Assistent/Agenten fassen den Schlüssel nie an.

### 3.4 Einstellungen & Kosten

- Einstellungen erweitert um: Schlüssel-Status (gesetzt/fehlt, Ort: Schlüsselbund/Browser), Modell-Anzeige (aus der Tabelle, vorerst nicht wählbar — YAGNI), Monatsverbrauch (Tokens → €-Schätzung aus hinterlegten Preiskonstanten mit „Stand"-Datum), Link/Anleitung zum Ausgabenlimit.
- Preiskonstanten leben an einer Stelle im Verteiler (mit Kommentar „Momentaufnahme 07/2026, regelmäßig prüfen").

## 4. Fähigkeit 1 — Projektverständnis (echt)

- **Auslöser**: Neues Projekt → der Agent eröffnet im Agenten-Panel mit genau **einer** offenen Frage. Existiert schon Text (eingefügt/geschrieben), leitet er zuerst einen **Entwurf des Verständnisses aus dem Text** ab und stellt nur noch 2–3 Lückenfragen.
- **Mechanik**: Schema-Filling — das Modell füllt während des Gesprächs die bestehenden Felder (`task`, `audience`, `desiredEffect`, `evidenceStandard`, `protectedIntentions`, `openQuestions`) über die strukturierte Ausgabe; die App aktualisiert PV-Karte + Modal **live** nach jeder Agenten-Antwort.
- **Regeln**: „propose, don't interrogate" — Vorschläge statt Fragenkatalog; maximal eine gebündelte Nachfrage für echte Lücken. Nutzer-Korrekturen im Modal sind bindend und werden dem Modell fortan als geschützt mitgegeben (bestehendes Feld `protectedIntentions` + Korrektur-Historie im Volatile-Teil des Prompts).
- **Metastruktur bleibt KI-automatisch**: der Nutzer weist nie manuell zu, er korrigiert nur (Projektgedächtnis-Regel).

## 5. Fähigkeit 2 — Hinweise (echt, verankert, nie erfunden)

- **Auslöser**: (a) Schreibpause — bestehende Pausen-Erkennung (`AGENT_IDLE_MS` + Absatzwechsel-Gate) füttert künftig den echten Lauf statt der Attrappe; nie mitten im Tippen; (b) Dokument öffnen (einmalig, wenn Text sich seit letztem Lauf geändert hat); (c) Bitte im Chat. Kein permanenter „Prüfen"-Knopf (V2-Regel). Läufe werden entprellt: kein neuer Lauf, solange einer läuft; kein Lauf ohne Textänderung.
- **Anfrage**: Voller Text + Verständnis (im Cache-Präfix) + Liste bisheriger Entscheidungen/Verwerfungen (volatil) + Anweisung: maximal N neue Hinweise (Start: 3), Grundursache zuerst, 8 Kategorien der V2-Spec.
- **Antwortformat (JSON-Schema, erzwungen)** je Hinweis: `kategorie` (Enum, 8 Werte) · `anker` (wörtliches Minimal-Zitat aus dem Text, keine Paraphrase) · `beobachtung` · `relevanz` · `folge` · `vorschlag?` (`{bisher, neu}` — `bisher` muss wortgleich im Anker/Text vorkommen) · `istGrundursache` (bool) · `integritaet` (bool, steuert den Risiko-Fluss).
- **Client-Verifikation (deterministischer Code, kein Modell)**: Anker exakt im Dokument suchen → sonst normalisiert (Whitespace/Anführungszeichen) → sonst **verwerfen** (leise, mit Zähler im Lauf-Protokoll). Verifizierte Hinweise werden zu Findings im bestehenden Modell (`doc.findings`, Placement über Block + Anker) — damit greifen Randkarte, Struktur-Punkte, annehmen/eigene Fassung/verwerfen und der Risiko-Schritt unverändert.
- **Ruhe-Regeln**: eine Grundursache prominent (bestehende Queue-Priorisierung), Rest geparkt; verworfene/erledigte Hinweise werden dem Modell mitgegeben und dürfen nicht erneut vorgeschlagen werden (Dedupe zusätzlich clientseitig über Anker+Kategorie).
- **Ehrliche Grenzen**: Kategorien Quelle/Fakt dürfen benennen, *dass* ein Beleg fehlt — die App erfindet **nie** Quellenangaben; das Belegfenster zeigt in echten Projekten nur den Hinweis-Kontext ohne Demo-Quellen. Demo-Quellen bleiben exklusiv im markierten Beispielprojekt.

## 6. Fähigkeit 3 — Chat (echt)

- Bestehendes Panel + Composer; Antworten **live gestreamt** (SSE, Zeilenpuffer, gedrosselte UI-Updates). Kontext: Cache-Präfix (System + Verständnis + Text) + offene Hinweise + Entscheidungsverlauf + Chatverlauf (bei Länge: ältere Turns per Haiku zusammengefasst — Task `zusammenfassung`).
- Der Agent schreibt nie in den Text; er kann Textstellen zitieren und auf Hinweise verweisen; eine Chat-Bitte („schau nochmal drüber") darf einen Hinweis-Lauf auslösen.
- **Initiative echt**: Der Ungesehen-Punkt an der Aura erscheint, wenn ein Lauf eine neue Grundursache oder ein Integritätsthema ergab (bestehendes `hasUnseenInitiative`-Gate bleibt; die Quelle wird echt). Proaktives Panel-Öffnen bleibt an die bestehenden Pausen-/Dismiss-Regeln gebunden; niemals Fokus-Raub (bestehende Zusage).
- **Entscheidungsverlauf sichtbar**: Das Agenten-Panel zeigt die gespeicherten `decisions` (Datum, Hinweis, Entscheidung, ggf. Risiko-Begründung) — die bisher fehlende Anzeige aus dem Onda-Review.

## 7. Fehlerfälle & Offline

- **Kein Schlüssel / kein Netz**: ruhige Statuszeile im Agenten-Panel („Agent ist offline — dein Text ist davon unberührt"); Schreiben/Speichern/Export uneingeschränkt; keine Modal-Alarme.
- **Abbruch/Überlastung**: ein stiller Wiederholungsversuch mit Wartezeit; danach sichtbarer, unaufgeregter Fehlerhinweis im Panel; nie halbfertige Hinweise anzeigen.
- **Schema-Müll trotz Erzwingung**: Lauf verwerfen, protokollieren, beim nächsten Auslöser neu.
- **Doppelschutz Kosten**: clientseitige Monats-Schätzanzeige + hartes Limit im Anbieter-Konto (Einrichtungsschritt mit Anleitung).

## 8. Dateien & Berührungspunkte

- **Neu**: `app/src/agent-gateway.mjs` (Verteiler, Tabelle, Prompt-Aufbau, Verifikation der Anker als pure Funktionen — node-testbar); `app/src/agent-transport.mjs` (bridge/direct, SSE-Parser); Prompt-Texte als Konstanten-Modul.
- **Geändert**: `mac/main.swift` (+ Handler `llm`, `llmkey`, Keychain); `app/src/workspace.js` (Interview-Fluss, echte Hinweis-Läufe statt Seed-Anzeige, Chat-Streaming, Entscheidungsverlauf-Render, Initiative-Quelle); `app/src/ui.js`/Einstellungen (Schlüssel-Status, Verbrauch, Anleitung); `app/src/settings-model.mjs` (+`usage`, additive Felder); `app/src/reasoning-model.mjs` (Finding-Erzeugung aus verifizierten KI-Hinweisen, Dedupe); `example.js` unangetastet (Demo bleibt Demo).
- **Tests**: neue Unit-Suiten für Anker-Verifikation (exakt/fuzzy/verwerfen), Tabelle/Prompt-Präfix-Stabilität, Usage-Zählung, Hinweis→Finding-Mapping, Dedupe; Playwright-Smoke um „Agent offline"-Zustand und (gemockten Transport-)Hinweis-Fluss erweitert — echte API-Aufrufe sind in Tests **gemockt auf Transport-Ebene**, die Produkt-Logik darüber ist echt (kein Mock-Verbot verletzt: der Mock ersetzt nur das Netz, nie die Funktionalität).

## 9. Abnahmekriterien (beobachtbar)

1. **Einrichtung**: Einstellungen zeigen Schlüssel-Status; Nutzer trägt eigenen Schlüssel ein (Mac: Schlüsselbund; Browser: mit Sicherheits-Hinweis); Anleitung inkl. Ausgabenlimit. *Beleg: Durchklick.*
2. **Verständnis**: Neues Projekt → eine Eröffnungsfrage → Antwort in 1–2 Sätzen → PV-Karte füllt sich sichtbar; bei vorhandenem Text zuerst Entwurf aus dem Text + Lückenfragen; Modal-Korrektur wird in Folge-Antworten respektiert. *Beleg: Live-Durchlauf.*
3. **Hinweise**: Absatz schreiben → Pause → echter Hinweis mit gültigem Anker erscheint in der Randkarte; Kategorie/Beobachtung/Relevanz/Folge gefüllt; annehmen ändert den Text exakt an der Ankerstelle; verworfener Hinweis kommt in Folgeläufen nicht wieder; Integritäts-Hinweis erzwingt den Risiko-Schritt. *Beleg: Live-Durchlauf.*
4. **Kein erfundener Anker**: Läufe mit nicht auffindbaren Zitaten erzeugen keine sichtbaren Hinweise (Unit-Test + Protokoll).
5. **Chat**: Frage im Composer → live gestreamte, kontextbezogene Antwort (bezieht sich nachweislich auf den Text); Agent schreibt nie in den Editor. *Beleg: Live-Durchlauf.*
6. **Initiative**: Nach einem Lauf mit Grundursache erscheint der Aura-Punkt; kein Fokus-Raub; Dismiss-Regeln unverändert. *Beleg: Interaktion.*
7. **Offline-Würde**: Ohne Schlüssel/Netz bleibt alles Übrige voll nutzbar, Statuszeile statt Alarm. *Beleg: Netz trennen.*
8. **Kosten**: Verbrauchsanzeige zählt nach Läufen sichtbar hoch (Tokens + €-Schätzung). *Beleg: Ablesen nach Testläufen.*
9. **Entscheidungsverlauf**: angenommene/verworfene/Risiko-Entscheidungen erscheinen im Panel mit Zeit und Begründung. *Beleg: Screenshot.*
10. **Bestand**: `npm test` grün (alte + neue Suiten); Demo-Projekt unverändert als Beispiel markiert; Mac-App neu gebaut, startet mit migrierten Daten und funktionierender Brücke. *Beleg: Testlauf + App-Start.*

## 10. Nicht Teil dieser Etappe

Webrecherche/Quellenimport/Belegbündel/Zitierprüfung (B); Gedächtnis/Argumentation (C); Sprach-/Wirkungs-/Slop-Prüfstufen, Schlussaudit, Export-Ausbau, Autorschaft (D); Onda-Bibliothek, sichtbare Dateien/lokale DB, gelernter Router, Multi-Agent, weitere Anbieter-Anschlüsse (per Tabelle jederzeit nachrüstbar).
