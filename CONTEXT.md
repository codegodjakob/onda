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

**Projektgedaechtnis**:
Ein lokal abgeleitetes, korrigierbares Dossier aus bestaetigten Projektzustaenden, Quellen, Belegen, Entscheidungen und Recherchelagen. Es verweist auf unveraenderliche Ursprungsereignisse und ersetzt keine Primaerdaten.
_Avoid_: verstecktes Modellwissen, globale Erinnerung

**Gedaechtnisebene**:
Der ausdrueckliche Geltungsbereich einer Erinnerung: Text, Projekt, Thema oder Person. Themen- und persoenliche Erinnerungen gelangen nur nach bewusster Freigabe in ein anderes Projekt.
_Avoid_: automatischer Wissenstransfer, universelles Profil

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

**Sprachprofil**:
Die sichtbare, korrigierbare Grundlage aus Textsorte, Teiltextfunktion, Fach oder Markt, Zielgruppe, Medium, Zielzustand, Sprachregion, Hausstil und Publikumszustand. Fehlende Angaben bleiben offen und werden nicht durch heimliche Standardannahmen ersetzt.
_Avoid_: KI-Stilprofil, Humanizer-Einstellung

**Wirkungshypothese**:
Eine begruendete, korrigier- oder enthaltbare Annahme ueber Passagefunktion, rhetorisches Mittel oder moegliche Publikumswirkung. Ohne reale Reaktion ist sie kein Wirkungsnachweis.
_Avoid_: Wirkungsscore, garantierte Leserreaktion

## Implementierte Arbeitsoberflaeche

Der interaktive V2-Stand ist eine fokussierte Schreiboberflaeche aus Vanilla JavaScript, Tiptap 2/ProseMirror und CSS. Er verwendet weiterhin die lokale Persistenz unter `aiwt.v2`; sichtbarer Arbeitszustand, Dialoge, Autorentscheidungen, Audits und Datenkontrollzustaende werden lokal gespeichert.

### Architektur

- `app/src/editor.js` migriert Dokumente auf Schema 12, initialisiert das inhaltlich reduzierte Tiptap-Schema und verbindet Bibliothek, Persistenz, Projektgedaechtnis, Argumentationsmodell, Sprachprofil, Schlussaudit und Workspace.
- `app/src/example-seed.mjs` besitzt die konservative Beispielmigration. Seed-Texte tragen stabile Marker und eine normalisierte Body-Signatur.
- `app/src/workspace-model.mjs` besitzt die reinen Workspace-Zustaende, Block-Snapshots, Finding-Zielaufloesung, Threads und Regeln fuer Agenteninitiativen.
- `app/src/block-identity.js` vergibt stabile IDs an semantische Tiptap-Bloecke und kapselt Einfuegen, aktive Blockauswahl und bewusste Textuebernahmen.
- `app/src/workspace.js` orchestriert Strukturablage, passagegebundene Hinweise, Vorschlaege, lokalen Dialog, allgemeines Agenten-Widget und Belegfenster.
- `app/src/agent-gateway.mjs`, `agent-tasks.mjs` und `agent-transport.mjs` bilden den echten KI-Pfad: validierte Schemas, Streaming, Retry, Nutzungserfassung und denselben Transportvertrag fuer Browser und Mac-Bruecke.
- `app/src/settings-model.mjs` besitzt Verbrauch und lokale Monatsgrenze. Automatische Laeufe stoppen an der Grenze; genau ein weiterer Lauf kann bewusst freigegeben werden.
- `app/src/eval-catalog.mjs` und `app/evals/v2-fertigzustand.json` machen den vollstaendigen Zielzustand mit 77 beobachtbaren Evals maschinenlesbar.
- `app/src/source-model.mjs` besitzt typisierte Projektquellen, unveraenderliche Herkunftsreferenzen, SHA-256-Pruefsummen, feldweise Metadatenzustaende und eine Ereignishistorie fuer Korrekturen, Ruecknahmen und neue Versionen.
- `app/src/locator-model.mjs` und `app/src/evidence-bundle.mjs` bilden exakte Seiten-, Abschnitts-, Text- und Zeitanker sowie claim-spezifische Belegbuendel mit Gegenbelegen, Grenzen, Reichweite, Unsicherheit und erlaubter Formulierungsstaerke.
- `app/src/citation-audit.mjs` prueft direkte Zitate, Paraphrasen, bibliografische Identitaet und Verzeichniskonsistenz. `app/src/provenance-model.mjs` trennt Nutzertext, Agenteneinordnung, Recherchematerial, Fundstellen, belegtes Wissen und Evidenzentwuerfe.
- `app/src/source-library-ui.mjs` besitzt die Projektquellenbibliothek und den Fundstellenreader; `workspace.js` bleibt deren duenne Orchestrierung.
- `app/src/research-run.mjs` besitzt Recherchefrage, Claim-Bezug, Suchwege, Budget, Stopbedingungen und den persistierbaren Zustandsautomaten. `app/src/research-orchestrator.mjs` fuehrt nur vorab geplante, noch nicht erledigte Wege aus und haelt Pause, Fortsetzung und Fehler atomar.
- `app/src/research-adapter.mjs` kapselt austauschbare Recherchewerkzeuge, legale Alternativwege, zustandsabhaengige Fehlwegdeduplizierung und ein normalisiertes, geheimnisfreies Werkzeugprotokoll.
- `app/src/research-synthesis.mjs` trennt Metadaten, Abstracts und Originalfundstellen, erhaelt Widersprueche und uebergibt nur erneut am B1-Original verifizierte Kandidaten an das belegte Projektwissen. `app/src/research-ui.mjs` bildet den ruhigen Bedienfluss in den Projektquellen.
- `app/src/memory-model.mjs` besitzt das unveraenderliche Ereignisjournal und genau vier Gedaechtnisebenen. `app/src/memory-dossier.mjs` verdichtet Projektzustaende deterministisch, erhaelt die vollstaendige Herkunft und speichert Korrekturen als neue Ereignisse.
- `app/src/memory-retrieval.mjs` erzwingt Projektgrenzen, begruendete Auswahl, ausdrueckliche Freigaben und die Trennung von Projekt- und Autorenstimme. `app/src/memory-portability.mjs` besitzt lesbaren Export, Geheimnisredaktion und gezieltes Loeschen ohne Primaerdatenverlust.
- `app/src/memory-ui.mjs` bildet das ruhige Projektdossier hinter dem Projektverstaendnis: Korrektur, Freigabe/Ablehnung, Export, zweistufiges Loeschen und bewusster Wiederaufbau.
- `app/src/argument-model.mjs` und `app/src/claim-ledger.mjs` besitzen atomare, exakt verankerte Aussagen mit Beleglage, Unsicherheit, Gültigkeit, Herkunft und bindend korrigierbaren Beziehungen.
- `app/src/argument-projection.mjs` leitet nur bei eindeutigen semantischen Rollen vorsichtige Stütz-, Gegen- und Definitionsbeziehungen ab. `app/src/argument-graph.mjs` besitzt gerichtete Abhängigkeiten, Grundursachen, Zyklen, begrenzte Auswirkungsanalyse und fingerprint-gebundene Regression.
- `app/src/argument-deliberation.mjs` wählt ausschließlich belegte faire Gegenargumente, enthält sich bei fehlendem Material, erzeugt substanziell verschiedene Argumentationswege und erhält Kritik, Autorenantwort und Revision getrennt. `app/src/argument-ui.mjs` projiziert diese Zustände als ruhiges, korrigierbares Dossier hinter dem Projektverstaendnis.
- `app/src/language-profile.mjs` besitzt das sichtbare Kontextprofil und eine fehlertolerante Migration. `app/src/language-diagnostics.mjs`, `language-modality.mjs` und `language-patterns.mjs` trennen Norm, Grammatik, Register, Modalität und Oberflächenmuster mit genauen Textankern.
- `app/src/language-variant.mjs`, `orthography-rules.mjs` und `orthography.mjs` schützen Bedeutung, Faktenbezüge, Zitate, Links, Struktur, Eigennamen und geschützte Absichten. Die kleine Normautomatik ist opt-in, revalidiert den gesamten Plan und wendet ihn atomar in einer Undo-Transaktion an.
- `app/src/effect-analysis.mjs` und `effect-fairness.mjs` modellieren Publikumszustand, Passagefunktion, rhetorische Mittel und persuasive Integritätsrisiken als begrenzte Hypothesen. `language-report.mjs` bewahrt vollständige, textisolierte Versionen und Nutzerentscheidungen; `language-ui.mjs` bildet das korrigierbare Sprach- und Wirkungsdossier.
- `app/src/final-audit.mjs` vereinheitlicht alle Hinweisstatus, ordnet Integrität vor Stil ein und blockiert kritische offene wissenschaftliche Fakten-, Quellen-, Zitations-, Methoden- und Logikbefunde. Der Audit ist versioniert, zeitunabhaengig fingerprintbar und erteilt selbst keine Publikationsfreigabe.
- `app/src/authorship-proof.mjs` beschreibt private Autorschafts- und KI-Beitraege ausschliesslich aus lokalen beobachtbaren Ereignissen. Die optionale KI-Nutzungserklaerung nennt belegte Taetigkeiten, aber keine Herkunfts-, Aufmerksamkeits- oder Verstaendniswahrscheinlichkeit.
- `app/src/publication-export.mjs` erzeugt aus einem UI-freien kanonischen Publikationsbaum strukturtreue Markdown-, HTML- und JATS-Ausgaben. Ueberschriften, Listen, Zitate, Links, Fussnoten, Zitationen und Literatur bleiben erhalten; Editorattribute und hostile Markup werden nicht durchgereicht.
- `app/src/data-control.mjs` besitzt den vollstaendigen lokalen Gesamtexport mit Domaenenmanifest, strukturellem Fingerprint, rekursiver Geheimnisredaktion, geschlossener Validierung, atomarem Wiederimport und leerem Loeschzustand. `audit-ui.mjs` orchestriert Audit, Risikoexport, Publikation, Sicherung, Import und zweistufige Loeschung.
- `app/src/ui.js` besitzt Bibliothek, Titel, Auswahl-Bubble, Slash-Menue und globale Tastaturregeln. Die alten Rails und Panel-Initialisierungen sind nicht mehr Teil des erreichbaren Oberflaechenpfads.
- `app/src/example.js` liefert den aktuellen Beispieldatensatz. Seine Agentenantworten und Rechercheangaben sind Demo-Fixtures, keine Ergebnisse produktiver Agentenlaeufe.

### Beispielmigration

- Der aktuelle Seed ist mit `exampleSeed: true`, `exampleSeedKey: calm-technology`, Seed-Version und Body-Signatur markiert.
- Ein Versionswechsel ersetzt nur eine unveraenderte Seed-Fixture. Andere Texte und Projektmaterial im Beispielprojekt bleiben erhalten.
- Wurde der markierte Seed inhaltlich bearbeitet, wird er vor dem Update als Nutzertext erhalten und entmarkiert; daneben entsteht eine frische Seed-Fixture. Dadurch ist ein Fixture-Reset sichtbar, ohne Nutzerschreibarbeit zu loeschen.
- Ein alter unmarkierter Seed wird einmalig nur dann erkannt, wenn Projekt, Titel und die normalisierte eindeutige Fixture-Signatur exakt passen.

Die alten Module `app/src/panels.js` und `app/src/structure.js` sind am 05.08.2026 geloescht worden (Issue #18): Sie waren nie Teil des Bundles, und die Eval-Pruefung ERWEITERUNG-04 misst seither das lebende Modul `workspace.js`. Die Git-Historie behaelt beide Dateien.

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
- Projektquellen werden als PDF, Web, DOI, Text, Audio oder Video mit unveraenderlicher Referenz und Pruefsumme aufgenommen. Ihr Zustand bleibt sichtbar; eine Ruecknahme loescht weder Quelle noch Historie und setzt abhaengige Belegbuendel auf erneute Pruefung.
- Fundstellen zeigen die konkrete Aussage, Quelle, Seiten-, Abschnitts-, Text- oder Zeitanker und den gegen das Original verifizierten Ausschnitt. Belegbuendel zeigen Grenzen, Reichweite, Unsicherheit, erlaubte Formulierungsstaerke und ausdruecklich nicht gestuetzte Aussagen.
- Bestehende Belege tragen einen sichtbaren Status `demo`, `unverified` oder `verified`. Demo-Angaben werden beim Kopieren ausdruecklich als ungeprueft bezeichnet; unverifizierte Angaben sind nicht kopierbar.
- Recherche beginnt mit einer pruefbaren Frage, einer genauen Aussage, drei sichtbaren Suchrichtungen und einem begrenzten Werkzeugbudget. Der Plan wird gespeichert, bevor ein Adapter aufgerufen wird.
- Ein Lauf kann pausiert, fortgesetzt und abgebrochen werden. Widersprechende Befunde und methodische Grenzen stehen in der Sichtung vor stuetzenden Funden; das vollstaendige, bereinigte Werkzeugprotokoll bleibt eingeklappt erreichbar.
- Ohne verbundenen Rechercheadapter bleibt der Plan lokal erhalten und die Oberflaeche simuliert keine Ergebnisse. Die bewusste Uebernahme prueft Original, Fundstelle und Belegbuendel erneut und veraendert keinen Nutzertext.
- Das Projektgedaechtnis entsteht automatisch aus bestaetigten Zustaenden. Aktualisierte Entitaeten erscheinen einmal mit vollstaendiger Historie; Nutzerkorrekturen bleiben sichtbar und veraendern weder Projektverstaendnis noch Quellen, Belege oder Text.
- Text-, Projekt-, Themen- und persoenliche Erinnerung bleiben getrennt. Ein projektuebergreifender Vorschlag enthaelt bei sensiblen Inhalten vor Zustimmung keinen Vorschautext; Freigabe und Ablehnung werden explizit gespeichert und gelten nur fuer das Zielprojekt.
- Export liefert ein versioniertes, lesbares und geheimnisbereinigtes Paket. Projektloeschung entfernt Dossier, Ereignisse, abgeleitete Eintraege und offene Freigaben, laesst Texte und Quellen bestehen und baut das Gedaechtnis nicht still neu auf.
- Das Argumentationsdossier zerlegt vollständige Aussagen konservativ, zeigt exakte Textanker, Beleglage und Unsicherheit und rät bei mehrdeutigen Beziehungen nicht. Jede Schlussbrücke bleibt sichtbar und bindend korrigierbar; der Ursprung wird nicht überschrieben.
- Grundursachen stehen vor abhängigen Lücken, Zirkelschlüsse erscheinen als vollständiger Pfad und Änderungen markieren nur gerichtete Abhängigkeiten zur erneuten Prüfung. Gelöste Befunde öffnen sich nur bei nachweislich neuer Grundlage.
- Der stärkste Einwand stammt wortgleich aus direkt belegtem Gegenmaterial samt Grenzen und Auswirkung. Alternative Wege unterscheiden sich in Prämisse, Schlussbrücke, Perspektive und Belegstrategie; Kritik, Autorenantwort und mögliche Revision bleiben getrennt und verändern den Text nicht.
- Das Sprach- und Wirkungsdossier prüft Integrität vor Stil. Es trennt Normfehler, grammatische und registerbezogene Beobachtungen, Wirkungshypothesen und Integritätsrisiken und nennt jeweils Grund, Sicherheit, genaue Passage und Prüffrage.
- D-A-CH- und Hausstilvarianten bleiben legitim. URLs, Links, Zitate, Blockzitate, Code und unsichere Eigennamen werden nicht automatisch korrigiert. Eindeutige Normfälle werden nur nach bewusstem Opt-in gemeinsam angewendet und lassen sich mit genau einem Undo vollständig zurücknehmen.
- Passagefunktionen und rhetorische Zuordnungen können als Nutzerkorrektur oder bewusste Enthaltung gespeichert werden. Frühere Vollanalysen, ursprüngliche Hypothesen und Entscheidungen bleiben im textbezogenen JSON-Dossier rekonstruierbar; Exporte enthalten keine Inhalte anderer Texte oder Projekte.
- Der Schlussaudit zeigt Integritaet, Belege, Zitation, angenommene Risiken, weitere Hinweise und Stil in fester Reihenfolge. Ein kritischer wissenschaftlicher Blocker oder ein angenommenes Risiko verlangt vor jedem Publikationsexport eine ausdrueckliche Bestaetigung und veraendert den Auditstatus nicht.
- Der private Autorschaftsnachweis und die optionale KI-Nutzungserklaerung beruhen nur auf lokal beobachtbaren Vorschlags-, Uebernahme-, Ablehnungs-, Analyse- und Nutzerentscheidungsereignissen. Nicht beobachtete Beitraege werden nicht geschaetzt.
- Markdown-, HTML- und JATS-Export enthalten nur Publikationsinhalt und auf Wunsch die belegbare KI-Nutzungserklaerung. Der Gesamtdatenexport ist davon getrennt und umfasst alle lokalen Projekte, Texte, Quellen, Belegbuendel, Recherchelaeufe, Entscheidungen, Audits, Erinnerungen und Einstellungen ohne Geheimnisse.
- Vollstaendige lokale Loeschung bleibt gesperrt, bis eine frisch erzeugte und validierte Gesamtsicherung vorliegt. Danach verlangt sie einen zweiten sichtbaren Schritt und die Eingabe `LÖSCHEN`; ein ungueltiger Import veraendert den bestehenden Zustand nicht.
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
node test/etappe-b1-smoke.mjs
node test/etappe-b2-smoke.mjs
node test/etappe-c1-smoke.mjs
node test/etappe-c2-smoke.mjs
AIWT_BROWSER=chromium node test/etappe-d1-smoke.mjs
AIWT_BROWSER=firefox node test/etappe-d1-smoke.mjs
AIWT_BROWSER=webkit node test/etappe-d1-smoke.mjs
AIWT_BROWSER=chromium node test/etappe-d2-smoke.mjs
AIWT_BROWSER=firefox node test/etappe-d2-smoke.mjs
AIWT_BROWSER=webkit node test/etappe-d2-smoke.mjs
node test/d2-accessibility.test.mjs
node test/decision-log-smoke.mjs
node test/performance-smoke.mjs
npm run eval:b1-quality
npm run eval:b2-quality
npm run eval:c2-quality
npm run eval:d1-quality
npm run eval:d2-quality
node evals/run-v2-evals.mjs --result evals/results/etappe-d2-latest.json
```

Der Haupt-Smoke prueft die Zustaende `base`, `shelf`, `finding`, `suggestion`, `local-dialogue`, `agent` und `evidence` bei Desktop, Mobile und relevanten Zwischenbreiten. Er deckt Seed-Erhalt, Klartext-Patches, expliziten Own-Version-Abschluss, Integritaetsbestaetigung, stale/mehrdeutige Anker, Fokus, Escape-Kaskade, Reduced Motion, ARIA-Beziehungen, horizontalen Overflow, Streaming und die lokale Monatsgrenze ab.

Die fokussierte Etappen-A-Eval beweist ausserdem: genau eine gebuendelte Einstiegsfrage im leeren Projekt, Verstehen vor Hinweisen, Verwurf eines erfundenen Modellankers, sichtbare Nutzung und bytegleicher Editorinhalt ohne Uebernahme. Die B1-Eval beweist den typisierten Quellenimport, exakte Fundstellen, Reload, Ruecknahmepropagation und die Trennung von Nutzertext, Agenteneinordnung, Recherchematerial und belegtem Wissen. Der kontrastive Qualitaetslauf fuer EVID-04 erreicht 5,0 von 5,0.

Die B2-Eval beweist Plan-vor-Werkzeug, zustandsabhaengige Fehlwegdeduplizierung, Secret-Redaktion, Pause und Fortsetzung, atomare Uebernahme, Gegenbeleg- und Grenzensuche sowie Reload. RESEARCH-05 erreicht 5,0 von 5,0; bei unzureichender Evidenz schlaegt die ehrliche Enthaltung die plausible Erfindung im festen Kontrast mit 5 zu 0.

Die C1-Eval beweist unveraenderliche Ereigniswahrheit, genau vier Gedaechtnisebenen, ein automatisch aufgebautes und korrigierbares Projektdossier, projektisoliertes Retrieval, explizite Freigabe/Ablehnung, getrennte Stimmen sowie vollstaendigen Export und kontrolliertes Loeschen ohne Primaerdatenverlust. Statuswechsel von Quellen und Belegen bleiben als eigene Ereignisse sichtbar; sensible Transfers enthalten vor Zustimmung keinen Inhalt.

Die C2-Eval beweist atomare Claims, fünf explizite Relationstypen, bindende Claim- und Beziehungskorrekturen, Grundursachen, Zyklen, begrenzte Auswirkungsanalyse, ehrliche Regressionen, faire belegte Gegenargumente, substanziell verschiedene Wege und getrennte Prüfrunden. Quellenrücknahmen und Nutzerentscheidungen markieren nur echte gerichtete Abhängigkeiten; Gegenkanten lösen keine falsche Kaskade aus. Dokument-, Projekt-, Evidenz- und ID-Grenzen scheitern geschlossen. ARG-04 und ARG-07 erreichen in festen Mehrgenre-Rubriken jeweils 5,0; das belegtreue Gegenargument schlägt den Strohmann mit 5 zu 0.

Die D1-Eval beweist ein explizites Sprachprofil, getrennte Diagnoseklassen, regionale und hausinterne Varianten, vorsichtige Modalitätskalibrierung, beweisbar bedeutungstreue Sprachvarianten, geschützte Struktur und eine atomare opt-in Normkorrektur. Publikumszustand, Passagefunktion, rhetorische Mittel und Fairness bleiben begründete, korrigier- oder enthaltbare Hypothesen. Der feste Mehrgenre-Korpus erreicht 5,0 von 5,0; die kontextsensitive Lösung schlägt den vollständig abgeleiteten pauschalen Humanizer mit 5 zu 0.

Die D2-Eval beweist die feste Auditstatusmatrix, harte wissenschaftliche Integritaetsblocker, bewusste Risikoexporte, beobachtbare Autorschaft, optionale KI-Nutzungserklaerung, strukturtreue und UI-freie Publikationsformate sowie vollstaendige lokale Datenkontrolle. Der feste Abschlusskorpus erreicht in Runde 2 in allen fuenf Dimensionen 5,0 von 5,0; der kontextsensitive Ablauf schlaegt die stilgetriebene Scheinfertigstellung mit 5 zu 0.

Der frische Gesamtlauf umfasst 446 bestandene Tests, den Produktionsbuild, den vollständigen V2-Lauf, alle Etappen-Smokes und 17 native Selbsttests. Die D1- und D2-Browserfluesse bestehen in Chromium, Firefox und WebKit. Axe meldet in sieben Kernzustaenden null WCAG-2.1-A/AA-Verstoesse; das manuelle Protokoll belegt Tastatur, Fokus, Escape-Rueckkehr, Zielgroessen, Fehlererholung, 390-Pixel-Reflow und 200-Prozent-Skalierung in allen drei Engines. Die Performanceprobe misst 15 Eingaben mit einer p95-Zeit bis zum naechsten Frame von 8,2 ms und ohne Long Task. `app/evals/results/etappe-d2-latest.json` fuehrt alle 77 Ziel-Evals: 71 bestanden und genau 6 externe Live-Gates offen; kein Eval bleibt einer spaeteren Entwicklungsstufe zugeordnet. Der gewichtete D2-Exitwert betraegt 5,0 von 5,0.

Vom Repository-Wurzelverzeichnis muss ausserdem `git diff --check` ohne Ausgabe enden. Der lokale Prototyp ist unter `http://127.0.0.1:4173/` erreichbar, solange der vorhandene statische Server laeuft.

## Noch nicht verbunden

Projektverstaendnis, automatische verankerte Hinweise sowie lokaler und globaler Chat sind produktiv mit dem echten Gateway verbunden. Das Beispielprojekt bleibt davon getrennt: Seine vorbefuellten Agentenantworten und Rechercheangaben sind ausdruecklich Demo-Fixtures.

Noch nicht produktiv verbunden sind:

- ein produktiver Live-Rechercheadapter fuer echte Web-, Bibliotheks- oder Datenbankanbieter sowie automatische Volltextextraktion;
- Multi-Agent-, Debatten- oder stochastischer Consensus;
- eine redaktionelle Literaturverzeichnisbearbeitung jenseits des vorhandenen Audits und der strukturtreuen Ausgabe;
- externe Live-Abnahmen fuer Offline-Mac-Nutzung, echte Providertransporte, DOI-, Web-, Bibliotheks- und Paywall-Sitzungen, reale Leser- und Autorenstudien sowie Langzeittelemetrie;
- moderierte Nutzungssitzungen mit VoiceOver, NVDA, JAWS und individuellen assistiven Setups. Diese sind im WCAG-Protokoll bewusst nicht als automatisiert bestanden markiert.

Echte Chat- und Hinweislauf-Antworten sind keine Fixtures, aber auch keine automatisch verifizierten Forschungsergebnisse. Quellen und Rechercheangaben im Beispiel bleiben Demo. Alle lokal automatisierbaren V2-Vertraege von Quellen und Evidenz bis Schlussaudit und Datenkontrolle sind gebaut; die sechs im Katalog festgeschriebenen realen Provider-, Nutzungs- und Langzeitgates bleiben ehrlich extern offen.
