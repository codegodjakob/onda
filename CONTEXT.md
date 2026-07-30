# Agentisches Schreibsystem

Das Produkt unterstuetzt Menschen dabei, anspruchsvolle Texte zu verstehen, zu entwickeln, zu pruefen und selbst zu schreiben. Die Sprache trennt belegtes Wissen, die Einordnung des Agenten und konkrete Textvorschlaege konsequent voneinander.

## Arbeit und Autorschaft

**Projekt**:
Ein thematisch zusammenhaengender Arbeitsraum mit gemeinsamem Wissen, Entscheidungen, Quellen und mehreren Texten.
_Avoid_: Ordner, Chat

**Text**:
Ein eigenstaendiger schriftlicher Output innerhalb eines Projekts mit eigener Zielgruppe, Funktion und Kommunikationsstrategie.
_Avoid_: Dokument, Datei, Artefakt

**Projektverstaendnis**:
Die sichtbare und korrigierbare Arbeitsannahme des Agenten ueber Aufgabe, Zielgruppe, beabsichtigte Wirkung, Belegstandard, geschuetzte Absichten und offene Fragen.
_Avoid_: Mandat, Briefing-Zusammenfassung

**Bedeutungskern**:
Die Aussage, Praezision, Einschraenkungen und Absicht einer Passage, die eine Ueberarbeitung nicht unbemerkt veraendern darf.
_Avoid_: Kernaussage, Prompt

**Autorentscheidung**:
Eine vom Nutzer getroffene inhaltliche, methodische oder kommunikative Festlegung, die der Agent bei spaeteren Vorschlaegen beruecksichtigt.
_Avoid_: Preference, Setting

## Wissen und Belege

**Belegtes Wissen**:
Eine Aussage, deren Herkunft, genaue Stuetzstelle, Reichweite und Unsicherheit im Projekt nachvollziehbar sind.
_Avoid_: KI-Wissen, Fakt ohne Herkunft

**Einordnung**:
Eine als solche gekennzeichnete Interpretation, Gewichtung oder Schlussfolgerung des Agenten auf Basis des belegten Wissens.
_Avoid_: Fakt, Wahrheit

**Belegbuendel**:
Die claim-spezifische Verbindung aus Aussage, stuetzenden Fundstellen, Gegenbelegen, methodischen Grenzen, Reichweite und erlaubter Formulierungsstaerke.
_Avoid_: Quellenliste, Literaturliste

**Fundstelle**:
Ein konkret sichtbarer Ausschnitt einer Quelle mit Seiten-, Abschnitts- oder Zeitanker und Link zur Herkunft.
_Avoid_: Quelle, Treffer

**Recherchematerial**:
Gesammeltes Material, das noch nicht automatisch als zitierfaehiger Beleg gilt.
_Avoid_: Beleg, Wissen

## Agentische Zusammenarbeit

**Hinweis**:
Eine begruendete Beobachtung des Agenten zu einer konkreten Stelle oder zum Gesamttext, die eine Entscheidung des Nutzers ermoeglicht und den Text nie selbst veraendert.
_Avoid_: Fehler, Alarm, Kommentar

**Grundursache**:
Ein Hinweis, dessen Klaerung mehrere abhaengige Hinweise erledigen oder veraendern kann.
_Avoid_: Hauptfehler, oberster Hinweis

**Vorschlag**:
Ein als Agentenbeitrag gekennzeichneter moeglicher Gedanke, Argumentationsweg oder Wortlaut, der erst durch bewusste Uebernahme Teil des Textes wird.
_Avoid_: Antwort, Generierung

**Risikoannahme**:
Die bewusste Entscheidung des Nutzers, einen sachlichen, logischen, methodischen oder quellenbezogenen Hinweis vorerst nicht zu beheben; sie bleibt im Schlussaudit sichtbar.
_Avoid_: Verwerfen, Erledigen

**Schlussaudit**:
Die abschliessende, mehrdimensionale Pruefung auf offene Integritaetsprobleme, akzeptierte Risiken, Belegdeckung, Zitationskonsistenz und Bedeutungsverschiebungen.
_Avoid_: Score, Freigabe durch die KI

**Entscheidungsverlauf**:
Die private, nachvollziehbare Folge aus Nutzerentscheidungen, uebernommenen oder geaenderten Vorschlaegen und ihren Begruendungen.
_Avoid_: Tracking, Aktivitaetslog

## Implementierte Arbeitsoberflaeche

Der erste interaktive V2-Bauabschnitt ist eine fokussierte Schreiboberflaeche aus Vanilla JavaScript, Tiptap 2/ProseMirror und CSS. Er verwendet weiterhin die lokale Persistenz unter `aiwt.v2`; sichtbarer Arbeitszustand, Dialoge und Autorentscheidungen werden mit dem Text gespeichert.

### Architektur

- `app/src/editor.js` migriert Dokumente auf Schema 6, initialisiert das inhaltlich reduzierte Tiptap-Schema und verbindet Bibliothek, Persistenz und Workspace.
- `app/src/example-seed.mjs` besitzt die konservative Beispielmigration. Seed-Texte tragen stabile Marker und eine normalisierte Body-Signatur.
- `app/src/workspace-model.mjs` besitzt die reinen Workspace-Zustaende, Block-Snapshots, Finding-Zielaufloesung, Threads und Regeln fuer Agenteninitiativen.
- `app/src/block-identity.js` vergibt stabile IDs an semantische Tiptap-Bloecke und kapselt Einfuegen, aktive Blockauswahl und bewusste Textuebernahmen.
- `app/src/workspace.js` orchestriert Strukturablage, passagegebundene Hinweise, Vorschlaege, lokalen Dialog, allgemeines Agenten-Widget und Belegfenster.
- `app/src/agent-gateway.mjs`, `agent-tasks.mjs` und `agent-transport.mjs` bilden den echten KI-Pfad: validierte Schemas, Streaming, Retry, Nutzungserfassung und denselben Transportvertrag fuer Browser und Mac-Bruecke.
- `app/src/settings-model.mjs` besitzt Verbrauch und lokale Monatsgrenze. Automatische Laeufe stoppen an der Grenze; genau ein weiterer Lauf kann bewusst freigegeben werden.
- `app/src/eval-catalog.mjs` und `app/evals/v2-fertigzustand.json` machen den vollstaendigen Zielzustand mit 77 beobachtbaren Evals maschinenlesbar.
- `app/src/ui.js` besitzt Bibliothek, Titel, Auswahl-Bubble, Slash-Menue und globale Tastaturregeln. Die alten Rails und Panel-Initialisierungen sind nicht mehr Teil des erreichbaren Oberflaechenpfads.
- `app/src/example.js` liefert den aktuellen Beispieldatensatz. Seine Agentenantworten und Rechercheangaben sind Demo-Fixtures, keine Ergebnisse produktiver Agentenlaeufe.

### Beispielmigration

- Der aktuelle Seed ist mit `exampleSeed: true`, `exampleSeedKey: calm-technology`, Seed-Version und Body-Signatur markiert.
- Ein Versionswechsel ersetzt nur eine unveraenderte Seed-Fixture. Andere Texte und Projektmaterial im Beispielprojekt bleiben erhalten.
- Wurde der markierte Seed inhaltlich bearbeitet, wird er vor dem Update als Nutzertext erhalten und entmarkiert; daneben entsteht eine frische Seed-Fixture. Dadurch ist ein Fixture-Reset sichtbar, ohne Nutzerschreibarbeit zu loeschen.
- Ein alter unmarkierter Seed wird einmalig nur dann erkannt, wenn Projekt, Titel und die normalisierte eindeutige Fixture-Signatur exakt passen.

Die alten Module `app/src/panels.js` und `app/src/structure.js` duerfen vorerst als ungenutzte Referenz im Repository bleiben. Sie werden weder importiert noch initialisiert und besitzen keinen DOM-Einstieg in der laufenden V2-Oberflaeche.

### Interaktionsregeln

- Der Text bleibt dominant. Ein aktiver Baustein wird ruhig hervorgehoben; neue Bausteine entstehen ueber kontextuelle Plus-Aktionen.
- Die Strukturablage zeigt Vorschaukarten mit echtem Text in der einklappbaren linken Seitenleiste. Auf schmalen Viewports wird diese Leiste zum bewusst oeffnenden Off-Canvas-Drawer; geschlossen erhaelt der Editor die volle Breite und es entsteht kein horizontaler Overflow.
- Passagebezogene Hinweise bleiben am betroffenen Block. Auf schmalen Viewports fliessen sie unter den Block.
- Vertiefung erfolgt stufenweise: kurzer Hinweis, Erklaerung und genau eine passende Arbeitsform. Vorschlaege veraendern den Text erst nach bewusster Uebernahme.
- `Eigene Fassung schreiben` bleibt ueber Schreibpausen und Reloads offen. Nur `Eigene Fassung abschliessen` erzeugt eine Autorentscheidung; ohne Textaenderung ist der Abschluss deaktiviert.
- Ein veralteter, aber noch bekannter Blockanker bleibt am Block als `Textstelle veraendert` sichtbar. Mehrdeutige und nicht mehr platzierbare offene Hinweise bleiben im Agenten-Widget unter `Hinweise ohne sichere Textstelle` erreichbar.
- Das Verwerfen eines Quellen-, Fakten-, Zitations-, Methoden- oder Logikhinweises erfordert eine zweite, ausdrueckliche Risikoannahme mit sichtbarer Konsequenz und optionaler Begruendung.
- Lokale Gespraeche wachsen aus dem Hinweis. Projektweite Initiativen erscheinen im separaten rechten Agenten-Widget und oeffnen nie waehrend aktiver Eingabe oder IME-Komposition.
- Lokale und globale Gespraeche streamen ueber denselben echten Gateway und teilen eine App-weite Laufsperre. Finding, Passage, Projektverstaendnis, offene Hinweise und Entscheidungen gelangen als expliziter Kontext in den jeweiligen Request.
- Bei einem vorhandenen Text entsteht zuerst der Projektverstaendnis-Entwurf; automatische Hinweise warten, bis Aufgabe, Zielgruppe und Wirkung ausreichend geklaert sind.
- Der Entscheidungsverlauf zeigt angenommene Vorschlaege, eigene Fassungen, Verwerfungen und bewusst angenommene Risiken samt Zeitpunkt, betroffenem Hinweis, resultierendem Wortlaut und vorhandener Begruendung. Er bleibt ueber Reloads erhalten.
- Belege tragen einen sichtbaren Status `demo`, `unverified` oder `verified` sowie eine Fundstelle. Demo-Angaben werden beim Kopieren ausdruecklich als ungeprueft bezeichnet.
- Der Live-Editor besitzt keine Schriftgroessen-, Farb-, Highlight-, Ausrichtungs-, Unterstreichungs-, Bild- oder grafischen Anmerkungsbefehle. Links bleiben als inhaltliche Referenzen, Listen und Ueberschriften als Struktur erhalten.
- Agenten- und Belegfenster liegen mobil mit 12 Pixel Abstand im Viewport und belegen hoechstens 70 Prozent der Hoehe.
- Zwischen 761 und 1199 Pixel reservieren Agenten- und Belegfenster einen kollisionsfreien rechten Layouttrack; ab 1200 Pixel bleibt derselbe Abstand erhalten.
- `Escape` schliesst jeweils die tiefste aktive Ebene und fuehrt aus dem ruhigen Editorzustand zur Projektansicht zurueck.
- Symbolbuttons besitzen zugaengliche Namen, Tastaturfokus bleibt sichtbar und `prefers-reduced-motion` begrenzt Bewegungen auf hoechstens 0,01 Sekunden.
- Die Formulierung `volle Kraft, leise Präsentation` ist echter Beispiel-Nutzertext und kein zu entfernender Altoberflaechen-String.

## Verifikation

Aus `app/`:

```bash
npm test
npm run build
node test/v2-smoke.mjs
node test/etappe-a-smoke.mjs
node test/decision-log-smoke.mjs
node test/performance-smoke.mjs
node evals/run-v2-evals.mjs --result evals/results/etappe-a-latest.json
```

Der Haupt-Smoke prueft die Zustaende `base`, `shelf`, `finding`, `suggestion`, `local-dialogue`, `agent` und `evidence` bei Desktop, Mobile und relevanten Zwischenbreiten. Er deckt Seed-Erhalt, Klartext-Patches, expliziten Own-Version-Abschluss, Integritaetsbestaetigung, stale/mehrdeutige Anker, Fokus, Escape-Kaskade, Reduced Motion, ARIA-Beziehungen, horizontalen Overflow, Streaming und die lokale Monatsgrenze ab.

Die fokussierte Etappen-A-Eval beweist ausserdem: genau eine gebuendelte Einstiegsfrage im leeren Projekt, Verstehen vor Hinweisen, Verwurf eines erfundenen Modellankers, sichtbare Nutzung und bytegleicher Editorinhalt ohne Uebernahme. Die letzte Performanceprobe misst waehrend eines langsamen Agentenlaufs 14 Eingaben mit einer p95-Zeit bis zum naechsten Frame von 8,8 ms und ohne Long Task. `app/evals/results/etappe-a-latest.json` fuehrt alle 77 Ziel-Evals: 19 fuer Etappe A bestanden, 52 ehrlich spaeteren Etappen zugeordnet und 6 externe Live-Gates offen.

Vom Repository-Wurzelverzeichnis muss ausserdem `git diff --check` ohne Ausgabe enden. Der lokale Prototyp ist unter `http://127.0.0.1:4173/` erreichbar, solange der vorhandene statische Server laeuft.

## Noch nicht verbunden

Projektverstaendnis, automatische verankerte Hinweise sowie lokaler und globaler Chat sind produktiv mit dem echten Gateway verbunden. Das Beispielprojekt bleibt davon getrennt: Seine vorbefuellten Agentenantworten und Rechercheangaben sind ausdruecklich Demo-Fixtures.

Noch nicht produktiv verbunden sind:

- autonome Webrecherche und belastbare Recherchelaeufe;
- echtes Langzeitgedaechtnis und projektuebergreifendes Memory;
- Multi-Agent-, Debatten- oder stochastischer Consensus;
- vollstaendiger Quellenimport und Literaturverzeichnis-Workflow;
- das Schlussaudit fuer Belegdeckung, Zitation und Integritaet.

Echte Chat- und Hinweislauf-Antworten sind keine Fixtures, aber auch keine automatisch verifizierten Forschungsergebnisse. Quellen und Rechercheangaben im Beispiel bleiben Demo; belastbares Quellen-, Evidenz-, Recherche-, Gedaechtnis-, Sprach- und Auditverhalten wird in den Etappen B1 bis D2 gegen den festgeschriebenen Eval-Katalog aufgebaut.
