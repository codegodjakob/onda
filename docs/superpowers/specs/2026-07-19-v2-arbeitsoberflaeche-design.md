# V2 Arbeitsoberflaeche - UI- und Interaktionsdesign

> **Status:** Visuell mit dem Nutzer erarbeitet und am 19. Juli 2026 fuer die Umsetzung freigegeben.
> **Ergaenzt:** `2026-07-19-agentisches-schreibsystem-v2.md`
> **Zweck:** Verbindliche Oberflaechen- und Interaktionsregeln fuer den naechsten nutzbaren Prototyp.

Bei widerspruechlichen Aussagen zur sichtbaren Oberflaeche hat dieses juengere UI-Dokument Vorrang. Produktlogik, Recherche, Gedaechtnis und Integritaetsregeln bleiben durch die allgemeine V2-Spezifikation bestimmt.

## 1. Ziel des Bauabschnitts

Der naechste Prototyp muss erstmals das Zusammenspiel aus Schreiben, Textbausteinen, lokalem Agentenfeedback und allgemeinem Agentendialog erlebbar machen. Er darf nicht wieder nur neue Logik in die alte Oberflaeche einsetzen.

Der Nutzer soll nach wenigen Minuten beurteilen koennen:

- ob das Schreiben ruhig bleibt;
- ob die Textstruktur beim Verstehen und Ordnen hilft;
- ob Hinweise klar an Textportionen gebunden sind;
- ob Vorschlaege die Autorschaft respektieren;
- ob sich der Agent lebendig, hilfreich und nicht aufdringlich anfuehlt.

## 2. Grundcharakter

Die Oberflaeche ist **calm technology**: freundlich, leicht und zurueckhaltend, aber nicht akademisch-streng oder steril. Der Text bleibt die visuell dominante Ebene.

Verbindliche Regeln:

- keine sichtbare Produktmarke und kein vorlaeufiger Name wie „Cognit“;
- keine permanenten Statuspunkte oder farbigen Kategoriepunkte;
- keine globale Anzeige wie „Recherche aktuell“;
- kein permanenter „Pruefen“-Button;
- kein unerklaertes Drei-Punkte-Menue in der Hauptleiste;
- kein permanenter Agenten-Button unten rechts;
- keine Unterstreichungen zur Kennzeichnung von Agentenfeedback;
- keine dauerhafte Leiste mit den beschrifteten Aktionen „Vorschlag“, „Belege“ und „Besprechen“;
- keine Auswahl von Schriftfamilie, Schriftgroesse oder grafischem Textstil.

Farbe kennzeichnet keine Vielzahl von Kategorien. Sie unterscheidet nur wenige Zustaende: neutrales Arbeiten, offene Frage, belastbare Grundlage und temporaere Agentenpraesenz.

## 3. Ruhiger Grundzustand

Die Kopfzeile enthaelt nur den Projekt- und Dokumentpfad sowie rechts ein kleines neutrales Agentensymbol. Das Symbol hat einen Tooltip und oeffnet einen bereits begonnenen allgemeinen Dialog wieder. Ohne aktiven oder neuen Dialog bleibt es visuell unbetont.

Im Grundzustand sind sichtbar:

- der Dokumenttitel;
- der Text;
- die aktuell bearbeitete Textportion als sehr leicht hervorgehobene Flaeche;
- Einfuegepunkte nur bei Hover, Tastaturfokus oder aktiver Blockbearbeitung.

Nicht sichtbar sind Kategorien, Pruefstaende, Recherchezaehler, offene Hinweise oder globale Qualitaetswerte.

## 4. Textportionen und Bausteine

Der Text besteht intern aus stabil identifizierten semantischen Bausteinen. Ein Baustein kann beispielsweise ein freier Absatz, eine Kernbehauptung, ein Beleg, eine Gegenposition, ein Uebergang oder eine offene Frage sein. Diese Rollen helfen dem Agenten, sind aber im normalen Schreiben nicht als permanente Labels sichtbar.

### Darstellung im Text

- Der aktive Baustein erhaelt eine ruhige Flaechenhervorhebung oder einen feinen Rahmen.
- Es gibt keine schwarzen Spine-Balken und keine Kette sichtbarer Punkte.
- Zwischen Bausteinen erscheint bei Hover oder Fokus ein vertrautes Plus-Symbol.
- Das Plus oeffnet ein kleines Menue mit semantischen Bausteintypen und „Freier Absatz“ als Standard.
- Schreiben ohne Auswahl erzeugt weiterhin einen normalen Absatz.

### Strukturablage links

Die bisherige ueberlagernde „Textstruktur“ wird durch eine einblendbare **Strukturablage** ersetzt:

- Sie dimmt den Text nicht ab und fuehlt sich nicht wie ein modaler Dialog an.
- Beim Oeffnen verschiebt sie die Schreibflaeche sanft, statt ueber ihr zu liegen.
- Sie zeigt Dokumente und die Bausteine des aktiven Dokuments als umrahmte Vorschaukarten.
- Jede Karte zeigt einen kurzen echten Textausschnitt; eine semantische Rolle erscheint nur als sekundaere Orientierung.
- Die aktive Karte hebt sich durch Flaeche und Rahmen ab, nicht durch einen schwarzen Balken.
- Zwischen Karten koennen neue Bausteine eingefuegt werden.
- Reihenfolge kann spaeter per Drag-and-drop und Tastatur geaendert werden; im ersten Prototyp reicht eine klar bedienbare Einfuegeaktion.
- Projektverstaendnis ist als eigener, klar benannter Bereich erreichbar, aber nicht zwischen die Textbausteine gemischt.

Die Strukturablage ist eine vergroesserte Vorschau der realen Textportionen, kein abstrakter Gliederungsbaum.

## 5. Feedbacktiefe

Feedback wird nicht primaer nach Kategorie gestaltet, sondern nach benoetigter Aufmerksamkeit.

### Stufe 0: unsichtbar vorgemerkt

Der Agent kann einen Fund behalten, ohne ihn sofort zu zeigen. Er bleibt in der Pruefspur erhalten.

### Stufe 1: Blockbezug

Die betroffene Textportion wird ruhig hervorgehoben. Es gibt keine Unterstreichung einzelner Woerter und keinen Statuschip.

### Stufe 2: kurzer Randhinweis

Neben der Textportion erscheint ein kurzer Satz in normaler Sprache. Eine feine Linie stellt den Bezug her. Der Hinweis enthaelt keine Buttonleiste.

### Stufe 3: vertieftes Feedback

Durch Oeffnen entfaltet sich der Randhinweis und erklaert:

- was der Agent beobachtet;
- warum es fuer das aktuelle Ziel relevant ist;
- welche Folgen die Entscheidung hat.

Weitere Ebenen werden durch den Inhalt selbst oder eine vertraute Offenlegen-Geste erreicht, nicht durch drei gleichrangige Textbuttons.

### Stufe 4: konkrete Arbeitsform

Je nach Situation entsteht genau eine passende Vertiefung:

- ein Textvorschlag direkt unter dem Baustein;
- ein Belegfenster mit Quellen und Ausschnitten;
- ein Gespraech am Text;
- eine alternative Argumentationsrichtung.

Nicht alle Arbeitsformen werden gleichzeitig angeboten.

## 6. Textvorschlaege

Ein Vorschlag erscheint direkt unter der zugehoerigen Textportion. Die aktuelle Fassung bleibt sichtbar. Veraenderte Wortgruppen werden durch ruhige Flaechen markiert, nicht unterstrichen.

Es gibt drei kompakte, mit Tooltips erklaerte Symbolaktionen:

- verwerfen;
- selbst weiterbearbeiten;
- bewusst uebernehmen.

Keine Aktion wird automatisch ausgefuehrt. Nach der Uebernahme bleibt die Entscheidung in der Projekthistorie nachvollziehbar.

## 7. Zwei Formen des Agentendialogs

### Lokaler Dialog

Bezieht sich die Frage auf eine Textportion, waechst das Gespraech aus dem Randhinweis heraus. Es bleibt sichtbar mit der Passage verbunden und verwendet keine separate globale Chatnavigation.

### Allgemeiner Dialog

Bezieht sich die Initiative auf das gesamte Projekt, die Argumentation oder eine neue Recherche, erscheint rechts ein grosses abgerundetes Widget:

- etwa 360 bis 400 Pixel breit;
- Abstand zum Fensterrand und keine volle Panelhoehe;
- keine harte Seitenleistenoptik;
- genug Platz fuer mehrere Nachrichten, Quellenverweise und ein Eingabefeld;
- schliesst oder minimiert sich vollstaendig, ohne einen permanenten unteren Launcher zu hinterlassen;
- kann ueber das neutrale Agentensymbol oben rechts erneut geoeffnet werden.

Der Agent darf das Widget proaktiv oeffnen, aber nie mitten in einer aktiven Tippsequenz. Eine neue Initiative wartet auf eine Schreibpause oder einen Absatzwechsel. Wird das Widget geschlossen, oeffnet es sich fuer denselben Anlass nicht erneut automatisch.

Eine lokale Beobachtung erscheint lokal. Das allgemeine Widget darf nicht als Ausweichort fuer jedes Feedback verwendet werden.

## 8. Quellen und Verifikation

Quellen oeffnen sich kontextuell zur betroffenen Aussage. Das Belegfenster zeigt:

- die exakt zu belegende Aussage;
- Originalausschnitte oder klar gekennzeichnete Exzerpte;
- Autor, Titel, Jahr und Fundstelle;
- direkten Link zum Original;
- Einordnung, Grenzen und Gegenbelege;
- Zitieraktion passend zum Projekt.

Der Nutzer kann eine Quelle im Kontext lesen, ohne den Bezug zur Textpassage zu verlieren. Quellen sind keine permanenten Chips im Grundzustand.

## 9. Projektgrundlage

Vor dem eigentlichen Schreiben kann die bereits recherchierte Projektgrundlage als ruhige, lesbare Ansicht erscheinen. Sie umfasst:

- Gegenstand und Ziel;
- argumentative Richtung;
- recherchierte Grundlage;
- erkannte Gegenpositionen und Unsicherheiten;
- Mandat des Agenten.

Der Nutzer kann diese Grundlage korrigieren. Sie ist kein Dashboard und kein Formularfriedhof.

## 10. Fertigstellen

Die vollstaendige Pruefspur erscheint erst, wenn der Nutzer tatsaechlich fertigstellen oder exportieren will. Dann werden auch geparkte, verworfene und bewusst akzeptierte Punkte erneut zugreifbar.

Integritaetsprobleme, fehlende Belege und Zitierfehler stehen vor Stilfragen. Export bleibt moeglich, aber der Agent darf einen wissenschaftlichen Text mit offenen kritischen Problemen nicht als freigabereif bezeichnen.

## 11. Bewegung und Fokus

- Blockhervorhebungen blenden innerhalb von 140 bis 180 Millisekunden ein.
- Randhinweise entfalten sich innerhalb von 180 bis 240 Millisekunden.
- Strukturablage und allgemeines Agenten-Widget verwenden eine ruhige 220- bis 280-Millisekunden-Bewegung.
- Keine springenden Benachrichtigungen, pulsierenden Punkte oder dauerhaften Animationen.
- `prefers-reduced-motion` deaktiviert nicht notwendige Bewegung.
- Neue Agenteninhalte uebernehmen niemals ungefragt den Tastaturfokus.

## 12. Erster nutzbarer Prototyp

Der erste Umsetzungsabschnitt enthaelt gemeinsam:

1. die neue reduzierte App-Huelle ohne alte Rails und permanente Seitenpanels;
2. Tiptap-Textportionen mit aktivem Block und Einfuegepunkten;
3. die nicht-modale Strukturablage mit umrahmten Blockvorschauen;
4. einen kurzen und einen vertieften lokalen Hinweis;
5. einen inline vergleichbaren Textvorschlag;
6. einen lokalen Dialog am Text;
7. das grosse allgemeine Agenten-Widget mit proaktiver Beispielnachricht und Wiedereroeffnung oben rechts;
8. ein kontextuelles Belegfenster;
9. Persistenz der sichtbaren Entscheidungen und des offenen Arbeitszustands.

Der Agentenlauf darf in diesem Abschnitt noch mit klar gekennzeichneten Beispieldaten arbeiten. Die Interaktionen muessen jedoch echt funktionieren: oeffnen, schliessen, schreiben, einfuegen, uebernehmen, verwerfen und nach einem Reload wiederherstellen.

## 13. Abnahmekriterien

- Im Grundzustand konkurriert kein Panel, Status oder Agenten-Launcher mit dem Text.
- Die Strukturablage zeigt gerahmte Textvorschauen und keine schwarzen Balkenvisualisierung.
- Ein neuer Baustein kann aus Text und Strukturablage erstellt werden.
- Lokales Feedback bleibt an seiner Textportion verankert.
- Der allgemeine Chat erscheint als schwebendes Widget und nicht als Seitenpanel.
- Der Agent kann eine Nachricht anzeigen, ohne Fokus oder Auswahl im Editor zu veraendern.
- Vorschlaege veraendern den Text nur nach bewusster Uebernahme.
- Hinweise, Chat und Strukturablage funktionieren nach Reload weiter.
- Desktop und schmale Viewports haben keine Ueberlagerungen oder horizontalen Ueberlaeufe.
- Tastatur, sichtbarer Fokus und reduzierte Bewegung funktionieren.

## 14. Nicht Teil dieses Bauabschnitts

- produktive autonome Webrecherche;
- vollstaendige Memory-Infrastruktur;
- Multi-Agent-Konsens;
- endgueltiger Produktname oder Branding;
- vollstaendiger Quellenimport und Literaturverzeichnisgenerator;
- Export in alle Zielformate.

Diese Grenzen reduzieren nur die technische Breite des ersten Prototyps. Die Interaktionsarchitektur muss bereits mit den spaeteren Faehigkeiten kompatibel sein.
