# Onda — Landkarte und Fachvokabular

Zwei Dinge stehen hier, und sonst nichts: **wo im Baum was liegt**, und **wie die Dinge
heißen, über die dieses Projekt spricht**.

Was hier bewusst **nicht** mehr steht, ist eine Liste der einzelnen Dateien. Diese Liste
gab es bis zum 8. August 2026, und sie war zuletzt zur Hälfte falsch: Sie nannte 52 von
92 Dateien in `app/src/` und kannte die übrigen 40 nicht. Eine Liste, die an einer Stelle
gepflegt werden muss, altert genau so. Was eine einzelne Datei ist, sagt seit dem
8. August die Datei selbst — der Kopfkommentar in ihrer ersten Zeile. Der kann nicht
veralten, ohne dass man beim Lesen darüber stolpert.

## Die Landkarte: sechs Ordner

Im Wurzelverzeichnis liegen sechs Ordner. Jeder hat genau eine Bedeutung. Wer weiß, in
welchem er gerade gräbt, weiß auch, wem er dabei ins Gehege kommt — die Regeln dazu
stehen in `betrieb/REVIERE.md`.

| Ordner | Was darin liegt | Was ausdrücklich nicht |
|---|---|---|
| `app/` | Das Programm selbst: Quelltext, Tests, Eval-Katalog, Bauwerkzeuge. Alles Ausführbare lebt hier — hier steht die Abhängigkeitsliste, aus der die App wirklich gebaut wird. | Keine Gestaltungsquellen, keine Betriebspapiere. |
| `betrieb/` | Wie an diesem Projekt gearbeitet wird: die Wächter, der Leitstand (wer arbeitet gerade woran), die Reviere, die Vorhaben-Mappen. | Kein Programmcode, der ausgeliefert wird. |
| `design/` | Die eine Gestaltungswahrheit: Marken, Bausteine, Vorlagen, Prototypen — und das Archiv der ersten Fassung. | Keine Schriftdateien mehr; die sind am 8.8.2026 entfernt worden. |
| `docs/` | Die Papiere: Grundsätze, Systemhandbuch, Abnahmen, Recherche, Rückmeldungs-Karten, Entscheidungen. Was davon noch gilt, sagt `docs/README.md`. | Keine Wahrheit über den Code; die steht im Code. |
| `mac/` | Die Mac-Hülle: Swift-Quellen und ihr Bauskript. | Nichts Deutschsprachiges, nichts Web-seitiges. |
| `tools/` | Eigenständige Nebenwerkzeuge mit eigener Abhängigkeitskette. | Nichts, wovon die App zur Laufzeit abhängt. |

Dazu die Papiere im Wurzelverzeichnis: `README.md` (was Onda ist und wie man es startet),
`KONVENTIONEN.md` (die Hausordnung samt Wächter), `CLAUDE.md` (der Wegweiser für Agenten)
und diese Datei. Die übrigen Wurzeldateien sind Werkzeugkram und tragen keinen Inhalt:
`.editorconfig` und eine `package.json`, die nur weiterreicht — warum sie ausdrücklich
kein npm-Arbeitsbereich ist, steht in `docs/adr/0003-kein-npm-arbeitsbereich-an-der-wurzel.md`.

## Wo die Wahrheit über eine einzelne Datei steht

In drei Stufen, von fein nach grob:

1. **Im Kopfkommentar der Datei.** Jede `.mjs` unter `app/src/` sagt in ihrer ersten
   Zeile selbst, was sie ist. Der Wächter `betrieb/waechter/kopfkommentar.mjs` besteht
   darauf.
2. **Im Namen.** Die Endung sagt die Art: `-model.mjs` rechnet und hält Zustand,
   `-ui.mjs` ist Oberfläche, `-kontext.mjs` ist ein Kanal zum Sprachmodell.
   `betrieb/waechter/ort.mjs` besteht darauf.
3. **In den Entscheidungen.** Warum die Ordner so geschnitten sind, wie sie sind, steht
   in `docs/adr/` — eine Datei je Entscheidung, angehängt und nie umgeschrieben.

## Das Fachvokabular

Die Begriffe, mit denen dieses Projekt über sich spricht. Wer einen davon in einem Issue,
einem Testnamen oder einem Vorschlag verwendet, verwendet ihn so, wie er hier steht — und
weicht nicht auf die Wörter unter _Avoid_ aus.

### Arbeit und Autorschaft

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

### Wissen und Belege

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

### Agentische Zusammenarbeit

**Hinweis**:
Eine begruendete Beobachtung des Agenten zu einer konkreten Stelle oder zum Gesamttext, die eine Entscheidung des Nutzers ermoeglicht und den Text nie selbst veraendert.
_Avoid_: Fehler, Alarm, Kommentar

**Grundursache**:
Ein Hinweis, dessen Klaerung mehrere abhaengige Hinweise erledigen oder veraendern kann.
_Avoid_: Hauptfehler, oberster Hinweis

**Vorschlag**:
Ein als Agentenbeitrag gekennzeichneter moeglicher Gedanke, Argumentationsweg oder Wortlaut, der erst durch bewusste Uebernahme Teil des Textes wird.
_Avoid_: Antwort, Generierung

**Erweiterung**:
Ein Angebot des Agenten ohne offenen Posten: Der Text ist nicht kaputt, es gibt mehr zu holen. Drei Arten mit fester Stellenzahl im Text — Weiterfuehrung (1), Feld (0), Verbindung (2). Die Arten und Regeln leben in `app/src/erweiterung-model.mjs`; Gestalt und Belege in `docs/DIE-GESTALT-EINER-ERWEITERUNG.md`.
_Avoid_: Fehler, Hinweis, Aufgabe

**Moment**:
Der Zeitpunkt, zu dem eine Rueckmeldung sichtbar werden darf: sofort, beim Innehalten, beim Aufschauen — getrennt von der Frage, wann der Agent laeuft. Tabelle, Begruendungen und Ausloesebedingungen leben an einer einzigen Stelle in `app/src/momente-model.mjs`; Herleitung in `docs/DIE-DREI-MOMENTE.md`.
_Avoid_: Timing, Benachrichtigung

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


## Wie die Oberfläche sich verhält

Das sind keine Wünsche, sondern der Stand, den die Rauchtests belegen. Sie stehen hier,
weil sie das Vokabular oben in Verhalten übersetzen — nicht, weil hier der Ort für eine
Architekturbeschreibung wäre. Die steht in `docs/ONDA-SYSTEM.md`.


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

## Noch nicht verbunden

Projektverstaendnis, automatische verankerte Hinweise sowie lokaler und globaler Chat sind produktiv mit dem echten Gateway verbunden. Das Beispielprojekt bleibt davon getrennt: Seine vorbefuellten Agentenantworten und Rechercheangaben sind ausdruecklich Demo-Fixtures.

Noch nicht produktiv verbunden sind:

- ein produktiver Live-Rechercheadapter fuer echte Web-, Bibliotheks- oder Datenbankanbieter sowie automatische Volltextextraktion;
- Multi-Agent-, Debatten- oder stochastischer Consensus;
- eine redaktionelle Literaturverzeichnisbearbeitung jenseits des vorhandenen Audits und der strukturtreuen Ausgabe;
- externe Live-Abnahmen fuer Offline-Mac-Nutzung, echte Providertransporte, DOI-, Web-, Bibliotheks- und Paywall-Sitzungen, reale Leser- und Autorenstudien sowie Langzeittelemetrie;
- moderierte Nutzungssitzungen mit VoiceOver, NVDA, JAWS und individuellen assistiven Setups. Diese sind im WCAG-Protokoll bewusst nicht als automatisiert bestanden markiert.

Echte Chat- und Hinweislauf-Antworten sind keine Fixtures, aber auch keine automatisch verifizierten Forschungsergebnisse. Quellen und Rechercheangaben im Beispiel bleiben Demo. Alle lokal automatisierbaren V2-Vertraege von Quellen und Evidenz bis Schlussaudit und Datenkontrolle sind gebaut; die sechs im Katalog festgeschriebenen realen Provider-, Nutzungs- und Langzeitgates bleiben ehrlich extern offen.
