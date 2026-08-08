# Strukturideen — historischer Entwurfssnapshot

Datum: 2026-08-05 · Grundlage: die Systemanalyse `2026-08-04-onda-gesamtsystem.md` (sechs Befunde)
Herkunft: sechs parallele Entwurfs-Linsen (Wissensarchitektur, Orchestrator, Kanal, Mess-Schicht,
Betrieb, Gesamtsystem). Vollständiges Rohmaterial mit allen Fundstellen:
`2026-08-05-strukturideen-rohmaterial.md`. Status wie bei `docs/REDESIGN-IDEEN.md`:
**Historisches Arbeitsmaterial, kein aktueller Backlog.** Der danach gebaute und geprüfte Stand
steht in `docs/ONDA-SYSTEM.md`; die heute maßgeblichen Gates stehen im Eval-Katalog.

## Das Zielbild in einem Absatz

Fast nichts muss neu erfunden werden — die Linsen fanden überall dieselbe Lage vor: **das Material
existiert, nur die Verbindung fehlt.** Die Gedächtnisschicht mit Person-Ebene existiert (Etappe C),
aber kein Prompt-Bauer liest sie. Die Textsorte existiert (Sprachprofil), aber keine Anfrage erfährt
sie. Die Ertragszahlen existieren (Lauf-Protokoll, doc.decisions, doc.erweiterungen), aber niemand
liest sie. Das Tor existiert halb (agent-gateway nennt sich selbst den Verteiler), aber Sperren,
Budget und Journal liegen verstreut. Der Export-Wandler für sichtbare Textdateien existiert
(blockMd). Das Zielbild ist deshalb kein Umbau, sondern **das Zuendeführen vorhandener Muster**:
ein Tor, durch das alles Bezahlte muss; ein Sitzungsprotokoll aus Zahlen, die schon berechnet
werden; ein Person-Block und ein Textsorten-Block im einen Anfrage-Bauer; Wertzahlen neben
Kostenzahlen im Maschinenzimmer; sichtbare Textdateien als Spiegel zuerst.

## Konvergenz-Beleg

Vier von sechs Linsen landeten unabhängig beim **Lauf-Tor mit Journal** als erstem Schritt
(Orchestrator, Kanal, Mess-Schicht, Gesamtsystem) — das bestätigt die Rangfolge des Fahrplans
(#12 zuerst). Drei Linsen landeten unabhängig bei der **weg-Quote** als billigstem echten Messwert,
und zwei beim **Sitzungsprotokoll** als Messobjekt der fehlenden Suiten (GROW/SELF/DIVERGE/GENRE).

## Leitplanken (konsolidierte „Nicht tun"-Liste aller Linsen)

1. **Keine Zahl auf der Schreibfläche, nichts verlässt den Rechner.** Alles Zählende gehört ins
   Maschinenzimmer (Einstellungen). Die Ruhe-Setzung ist tragend.
2. **Keine Verhaltens-Rohdaten** (Tipp-Zeitpunkte, Pausen-Zeitreihen, Verweildauern). Spuren sind
   benannte Ereignisse über Artefakte des Agenten (INV-09). Für die Momente-Kalibrierung reichen
   grobe Pausen-Körbe ohne Zeitstempel — und selbst die nur mit Jakobs ausdrücklichem Ja.
3. **Keine Messzahl steuert automatisch das Verhalten** (kein Auto-Tuning der Schwellen, keine
   automatische Prompt-Verschärfung bei hoher weg-Quote). Sonst wird die Zahl zum Ziel und hört
   auf, wahr zu sein. Die Schleife schließt über Jakobs Entscheidung. Erlaubte Ausnahme: die
   weg-Quote darf den ZEITGESTEUERTEN Erweiterungslauf drosseln (nie abschalten; von Hand geht immer).
4. **Die Person-Schicht wird nie automatisch befüllt und nie aus dem Text gedeutet.** Zufluss nur
   aus expliziten Handlungen (Entscheiden, Merken) plus Bestätigung über den vorhandenen
   Etappe-C-Consent-Weg. Feste Platzzahl mit Verdrängung (`superseded` existiert schon) statt Halde.
5. **Kein neues Subsystem, wo ein Anschluss reicht**: kein zweiter Personen-Speicher neben dem
   memoryStore, kein zweites Textsorten-Feld neben dem Sprachprofil, keine Telemetrie-Datei neben
   data.json, keine SQLite statt sichtbarer Markdown-Dateien.
6. **Kein LLM-Richter, der automatisch Gates schaltet.** Modell-Urteile liefern Listen und
   Blindproben-Material für Jakob; bestanden/durchgefallen entscheidet Code oder Jakob.
7. **Kein Gesamtumbau, kein Ereignis-Bus, keine Kanal-Basisklasse, kein Zeilenzahl-Ziel** für
   workspace.js. Zerlegung heißt: Verantwortungen einzeln herauslösen, verhaltensneutral, nach den
   zwei Mustern, die es schon gibt (reine Ablauf-Module, UI-Fabriken). Die Hinweiskarten
   (tiefste Editor-Verflechtung) zuletzt oder gar nicht.
8. **Keine handkopierte Zahl mehr, nirgends.** Jede Selbstauskunft (Stand-Karte, Doku, Über Onda)
   wird generiert oder trägt Quelle + Messdatum.

## Die Ideen, nach Bereich

### A · Das Lauf-Tor und die Spuren (zahlt in #12 ein)

`lauf-tor.mjs` zwischen workspace.js und agent-gateway: Sperren-Register (ersetzt die vier
let-Variablen; Sperre-vor-erstem-await bleibt synchron erhalten), Budget-Freigabe, Lauf-Journal.
workspace.js verliert den direkten runTask-Import; Kanäle bekommen runTask nur noch vom Tor.
Umhängen kanalweise, Interview zuerst (kleinster Kanal). Dazu der **Rückwachs-Wächter**: ein
Quelltext-Test mit drei Regeln (runTask nur in lauf-tor.mjs importierbar; keine Sperr-Variablen in
workspace.js; Freigaben nur vom Tor) — die Bau-Regel als Test statt als Satz, mit schrumpfender
Ausnahmenliste, die leer enden muss.

**Wichtig fürs Journal (zwei Zusätze aus anderen Linsen):**
- Jeder Lauf-Eintrag trägt ein `stand`-Feld: Kennung aus Schwellen + ART_MOMENT + Prompt-Hash +
  Modellname. Ohne dieses Feld sind spätere Vorher/Nachher-Vergleiche (Promptänderung,
  Modellwechsel) prinzipiell unmöglich — ein Stand lässt sich nachträglich nie rekonstruieren.
- Zusätzlich ein `gezeigt`-Ereignis je Karte (erstmals sichtbar, mit Moment-Etikett): der Haken
  `merkeGezeigt` existiert, schreibt heute in ein flüchtiges Set.
- **Offene Designfrage für die #12-Session:** Ablageort der Ereignisse — eigener Bereich in
  data.json (Vorschlag Mess-Schicht: `sitzung-model.mjs`) oder der vorhandene unveränderliche
  Ereignisspeicher des Gedächtnisses (Vorschlag Gesamtsystem: memory-model-Events mit Deckel und
  Verdichtung). Beide Linsen sind sich einig über Inhalt und Deckel-Pflicht; der Ort ist zu
  entscheiden — Kriterium: keine neue Wahrheit neben data.json (Leitplanke 5).

### B · Wertzahlen und Ertragszeile (zahlt in #13 ein)

Pures Modul `lauf-bilanz.mjs` (Vorbild momente-model: Zahlen + Begründung an einer Stelle) mit
vier Zahlen, alle aus vorhandenen Daten: **Annahmequote je Hinweisart** (doc.decisions ⋈
finding.category), **weg-Quote der Erweiterungen** (doc.erweiterungen.status), **Anker-Verwurfsquote
je Lauf** (Journal), **Kosten je übernommener Rückmeldung** (usage ÷ Übernahmen). Anzeige als
vierter Abschnitt „Ertrag" im KI-Dialog neben dem Verbrauch. Immer mit Basis („3 von 4"), unter
~10 Entscheidungen ehrlich „noch zu wenig". Dieselbe Aggregation ersetzt als zweiter Schritt die
JSON-Vollkopie der Entscheidungsliste im Prompt (innerer Kostentreiber). Eine Lücke ist beim
Erfassen zu schließen: der Ereignis-Schnappschuss des Dossiers enthält die Hinweis-Kategorie nicht
(Join über findingId nötig, Vorbild chat-kontext.mjs:65–99).

### C · Person-Schicht anschließen (zahlt in #14 ein)

Drei Stücke: (1) **muster reist** — Stufe 1: `fasseErweiterungenZusammen` gibt muster für
Gemerkte mit (heilt den wörtlichen Schema-Bruch, eine Session, keine Privatsphäre-Frage);
Stufe 2: „Merken" erzeugt einen **Kandidaten**, der im Projektgedächtnis-Dialog über den
vorhandenen Consent-Weg (`createTransferRequest`/`decideMemoryTransfer`, erzwingt actor 'user')
zum personal-Eintrag wird. (2) **Ein Person-Block, ein Anschlusspunkt**: neues pures
`person-kontext.mjs`, angeschlossen EINMAL als `kontext.person` in `baueAnfrage`, platziert im
Cache-Präfix VOR dem Verständnis (kein neuer Breakpoint, praktisch gratis), selbst-rahmend als
„Angebote zur Orientierung, keine Regeln". Erst nur an den Hinweis-Kanal. (3) **Das Regal mit
Platzzahl**: getypte Einträge (voice / muster / entscheidungsbild), feste Platzzahl je Typ,
Verdrängung über `superseded`, Provenienz über originEventIds (Pflichtfeld existiert).
Nur Gemerktes in den Prompt — nie 'neu'/'weg' (sonst füttert der Produzent den Richter).

### D · Kanal: Textsorte, Anti-Naheliegend, Momente (neue Issues #21/#22)

- **Die Textsorte reist mit**: `buildLanguageContext` existiert und verschmilzt Sprachprofil +
  Verständnis; ein optionaler gecachter `<sprachprofil>`-Block in `baueAnfrage`, durchgereicht von
  den Kontext-Bauern; degradiert leer, wenn kein Genre gesetzt. Integritätskategorien bleiben
  unangetastet (Wert-Setzung + Cache-Stabilität); genre-abhängig wird nur die GEWICHTUNG im Block.
  Falls Jakob je Integrität-je-Textsorte will: EINE Tabelle nach ART_MOMENT-Vorbild, und bei der
  Gelegenheit die heutige Doppelführung (INTEGRITAETS_KATEGORIEN in agent-findings.mjs:19 /
  INTEGRITY_CATEGORIES in reasoning-model.mjs:17) auf eine Quelle vereinen.
- **Selbst-Verwurf als Schema-Pflicht**: ERWEITERUNGEN_SCHEMA bekommt Pflichtfeld
  `verworfeneNaheliegende` [{gedanke, grund}]; `verarbeiteErweiterungsantwort` prüft fail-closed
  (wer liefert, muss verworfen haben; kein finaler Gedanke ähnelt einem selbst verworfenen) —
  aus der Bitte wird ein abgelieferter Arbeitsschritt. Kosten ~200–400 Output-Tokens je Lauf.
- **Kontrast-Eval mit blindem Richter** (`run-erweiterung-kontrast.mjs`, manuell, kostenpflichtig,
  gedeckelt): gleicher Text, Lauf mit / ohne Anti-Naheliegend-Block, blinder Richter-Lauf aus dem
  Eval-Satz formuliert (nie aus dem Produkt-Prompt) wählt paarweise. Misst erstmals, ob die 285
  Wörter etwas leisten; läuft neu nach jedem Modellwechsel (Drift-Wache). Fixtures: fremde Texte,
  nicht der Seed.
- **Pausen-Körbe statt Verhaltens-Protokoll** (nur mit Jakobs Ja): sechs grobe Körbe an den
  Schwellwert-Grenzen, getrennt nach an-Grenze ja/nein, reine Zähler ohne Zeitstempel (Muster:
  usage in settings-model). Kalibrierung bleibt Menschen-Entscheidung am Bild.

### E · Mess-Schicht: die vier fehlenden Suiten (nach #12/#13, Katalog wächst erst mit Messobjekt)

Reihenfolge zwingend: erst Messobjekt (Sitzungsprotokoll) und Richterregel, dann Katalogeinträge —
sonst wiederholt sich Befund 6 mitten in der Mess-Schicht. Erste Einträge je Suite:
**SELF-01** „die Ertragszahlen haben einen Leser" · **SELF-02** Unterbrechungsquote je Moment ·
**SELF-03** „null unbestätigte Maßstabs-Änderungen seit letzter Abnahme" · **GROW-01**
Annahmequote Projekt n gegen n+1 (macht die Befund-1-Vorhersage prüfbar) · **GROW-03** als
user-study: Monatsfrage an Jakob, welches Muster er ohne Werkzeug wieder angewendet hat ·
**DIVERGE-01** weg-Quote (Schwelle setzt Jakob NACH der ersten Messung) · **DIVERGE-02** die
Blindprobe aus Jakobs Karte 04 (verblindet: „hätte ich selbst gehabt / nicht gehabt") ·
**GENRE-01** „die Textsorte reist in die Kontexte" — **bewusst als roter Katalogeintrag** führen,
bis der Anschluss gebaut ist: die Lücke als fehlschlagendes Eval statt als Prosa-Versprechen.
Dazu der **Treue-Lauf** `pruefe-massstab.mjs` (bekommt nur Eval-Satz + Prüfdatei, keinen
Produktcode; Ausgabe ist eine Abweichungsliste für Jakob, kein Urteil; läuft je Abnahme).

### F · Betrieb und Datenhoheit (neue Issues #20/#21)

- **Der Bau stempelt sich selbst** (ergänzt #19): Datum + Git-Kurzcommit in CFBundleShortVersionString
  (das Standard-„Über Onda"-Panel zeigt es ohne UI-Arbeit) + build-info.json + Frische-Check
  (Bundle neuer als neueste Quelldatei) + datierte releases/-Zips (letzte fünf behalten).
- **Sichtbare Textdateien in drei Stufen** (N4, laut Spec fällig): Stufe 1 **Spiegel** — persist()
  schreibt den geänderten Text zusätzlich als Markdown-Datei (blockMd existiert; kleiner neuer
  Swift-Schreibfall); data.json bleibt Wahrheit, aber die wertvollen 98 % existieren dateiweise,
  sichtbar im Finder, erfasst von Time Machine. Stufe 2 **Teilung** — bodies verlassen den Blob
  (Save schreibt nicht mehr alle Texte bei jedem Tastendruck). Stufe 3 **Wahrheit** — .md führend,
  Begleitspeicher `<id>.onda.json` je Text; externe Änderungen degradieren Anker kontrolliert
  (anchor-verify verwirft heute schon Nicht-Auffindbares). Nie zwei Stufen gleichzeitig.
- **Die Stand-Karte**: vier generierte Zeilen in den Einstellungen (Baustempel · letzter Messlauf
  mit Datum · Preisstand der Kostenschätzung · Datenort + Backup-Alter). Regel: auf dieser Karte
  steht nichts, was ein Mensch getippt hat. Sofort-Fix dabei: PREISSTAND als exportierte Konstante
  neben der PREISE-Tabelle statt zweimal handkopiert (agent-tasks.mjs:17 / workspace.js:1093).

## Offene Gestaltungsfragen an Jakob (gesammelt aus allen Linsen → Issue #23)

Präsenz & Ton: Darf der Agent sich hörbar auf gemerkte Muster beziehen, oder orientiert das Wissen
unsichtbar? Darf er bei wissenschaftlicher Textsorte hörbar strenger sein? Was soll der Kanal tun,
wenn du mehrmals weglegst — leiser, anders, unverändert? Sollen selbst-verworfene naheliegende
Gedanken aufklappbar sichtbar sein? · Zählen & Privates: Darf die weg-Quote im Maschinenzimmer
stehen, oder verletzt schon das die Setzung „Angebote werden nie gezählt"? Willst du Monatszahlen
sehen, und wo? Darf ein Protokoll Uhrzeiten festhalten? Fühlt sich schon das Zählen von
Pausenlängen nach Beobachtung an (dann Veto)? Abstellschalter fürs Protokoll? · Maßstab: Rubrik-
gewichte bestätigen oder als Agenten-Setzung kennzeichnen? Maßstabs-Änderungen einzeln oder je
Etappe bestätigen? Sind Fakt/Quelle/Methode/Logik auch bei Prosa und Marketing unwegklickbar?
Welche zwei, drei Textsorten schreibst du wirklich? Was ist DER Maßstab einer guten Erweiterung
(Karte 05: übernommen / nicht naheliegend / anschlussfähig / wahr)? Budget und Frequenz für
bezahlte Messrunden? Wie viele Erweiterungen je Blindrunde — zehn oder dreißig? · Daten: Dürfen
deine Rückmeldungs-Karten versioniert ins Projekt? Dateinamen nach Titeln oder stabil? Ablageort
sichtbar (~/Dokumente/Onda) oder im App-Ordner? Versionsanzeige menschlich oder technisch?
Gedächtnis-Kandidaten: darf „Merken" die zweite Bedeutung tragen?
