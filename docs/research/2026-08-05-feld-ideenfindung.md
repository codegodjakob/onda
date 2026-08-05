# Forschungsnotiz: Ideenfindung und Kreativitätsforschung

> Kurzrecherche vom 2026-08-05, Teil der Serie über Querschnittsfelder. Diese Notiz liefert das wissenschaftliche Fundament für den Erweiterungs-Kanal (weiterführung · feld · verbindung) und sein Kernversprechen: das Naheliegende erkennen und verwerfen. Abgrenzung: Was KI-Texte statistisch mittelmäßig macht, behandelt [2026-07-19-ki-text-slop.md](2026-07-19-ki-text-slop.md); wann Rückmeldung stört und was Pausen beim Schreiben bedeuten, behandelt die Karte `01-wann-stoert-rueckmeldung` in `.scratch/rueckmeldung/issues/`.

## 1. Kurzfazit

1. **Kreativ heißt: neu und tragfähig — beides zugleich.** Die Standarddefinition der Forschung verlangt Originalität *und* Brauchbarkeit. Eine ferne, aber unsinnige Erweiterung ist kein Gewinn; eine wahre, aber erwartbare auch nicht. Jede Prüfung des Kanals braucht zwei Tore.
2. **Das Naheliegende ist kein Stilproblem, sondern ein Abrufmechanismus.** Das Gedächtnis (und das Sprachmodell) holt zuerst, was an der Oberfläche ähnlich, häufig und kürzlich gesehen ist. Wer nichts dagegen tut, bekommt strukturell das Erwartbare — bei Menschen wie bei Modellen belegt.
3. **Der am besten belegte Mechanismus für Nicht-Naheliegendes ist die entfernte Verknüpfung** (Mednick): Kreativität als Verbindung von Elementen, die weit auseinanderliegen — je ferner, desto origineller, solange die Verbindung trägt. Ondas `verbindung` steht direkt auf diesem Fundament.
4. **Zugriff läuft über Oberfläche, Wert entsteht über Struktur.** Die Analogieforschung trennt sauber: Erinnert wird, was oberflächenähnlich ist; überzeugend und fruchtbar ist, was strukturähnlich ist. Die Oberflächenanalogie ist das Naheliegende — die Strukturanalogie ist das Werkzeug dagegen.
5. **Nicht-Naheliegendes lässt sich strukturell erzeugen, nicht nur erhoffen:** viele Kandidaten erzeugen und spät auswählen (Serienpositionseffekt), das Erwartbare ausdrücklich erzeugen und sperren, Strukturanalogie erzwingen, produktive Beschränkungen setzen und wechseln. Alle vier Wege sind empirisch gestützt und als Prompt-Strategie umsetzbar.
6. **Pausen arbeiten mit.** Inkubation ist ein realer, kleiner, gut belegter Effekt — am stärksten bei genau der Art offener Aufgaben, um die es beim Erweitern geht. Die Folgerung ist aber nicht „nach 45 Sekunden anbieten", sondern: die Pause nicht stören und das Angebot an den Wiedereinstieg legen.
7. **Originalität ist messbar, aber nur als halbe Rubrik.** Semantische Distanz (Einbettungsabstand) korreliert stark mit menschlichen Kreativitätsurteilen und trägt automatisierte Evals. Distanz ohne Passungsprüfung belohnt aber Unsinn; der Anker bleibt das Urteil des Autors.

## 2. Was Kreativität heißt und wie man sie zerlegt

Die Forschung beginnt mit [Guilfords Präsidentschaftsrede vor der APA 1950](https://doi.org/10.1037/h0063487) („The neglect of this subject by psychologists is appalling"). Guilford trennte **divergentes Denken** — viele verschiedene Antworten auf eine offene Frage — vom konvergenten Denken, das die eine richtige Antwort sucht, und zerlegte es in vier Maße: **Flüssigkeit** (wie viele Ideen), **Flexibilität** (wie viele verschiedene Kategorien), **Originalität** (wie selten), **Elaboration** (wie ausgearbeitet). Die [Torrance-Tests](https://en.wikipedia.org/wiki/Torrance_Tests_of_Creative_Thinking) machten daraus das bis heute verbreitetste Messinstrument. Wichtig ist die Gegenkorrektur der [Standarddefinition](https://doi.org/10.1080/10400419.2012.650092) (Runco & Jaeger 2012): Kreativ ist, was **neu und wirksam** ist — Originalität allein genügt ausdrücklich nicht.

Zwei robuste Befunde aus dieser Tradition sind für den Kanal unmittelbar brauchbar:

- **Der Serienpositionseffekt:** Spätere Ideen sind origineller als frühe. Der Effekt ist seit den 1950ern dokumentiert (Christensen, Guilford & Wilson 1957) und modern repliziert; die Erklärung ist, dass die ersten Antworten aus dem dichten, naheliegenden Teil des Assoziationsraums kommen und erst danach fernere erreicht werden ([Beaty & Silvia 2012](http://libres.uncg.edu/ir/uncg/f/p_silvia_why_2012.pdf)). Auch die schlichte Anweisung „sei kreativ" verschiebt Antworten messbar Richtung Originalität ([Nusbaum, Silvia & Beaty 2014](https://www.researchgate.net/publication/261084066_Ready_Set_Create_What_Instructing_People_to_Be_Creative_Reveals_About_the_Meaning_and_Mechanisms_of_Divergent_Thinking)).
- **Menge sagt Treffer voraus:** Über Karrieren von Wissenschaftlern und Künstlern hinweg ist der Anteil der Treffer an der Gesamtproduktion annähernd konstant — wer mehr erzeugt, hat mehr gute Ideen, ohne dass die Quote steigt ([Simonton 1997](https://doi.org/10.1037/0033-295X.104.1.66), „equal odds rule").

**Systemfolge:** Der Erweiterungs-Kanal sollte intern immer mehr Kandidaten erzeugen, als er zeigt, und aus dem hinteren Teil der Erzeugung auswählen — die erste Idee des Modells ist mit hoher Wahrscheinlichkeit die naheliegendste. Und jede Eval-Rubrik braucht zwei getrennte Tore: „nicht naheliegend" *und* „tragfähig" (Wahrheit, Anschlussfähigkeit). Ein Tor allein misst die falsche Größe.

## 3. Entfernte Assoziation: Mednick und die Netzwerk-Evidenz

[Mednick 1962](https://doi.org/10.1037/h0048850) definierte den kreativen Prozess als das Zusammenführen assoziativer Elemente zu neuen, brauchbaren Kombinationen — und je **entfernter** die verbundenen Elemente, desto kreativer die Lösung. Kreative Menschen haben nach diesem Modell „flache Assoziationshierarchien": Auf einen Reiz hin fällt ihnen nicht nur das eine dominante Nächstliegende ein, sondern ein breiter Fächer auch entlegener Verwandter. Der daraus abgeleitete [Remote Associates Test](https://en.wikipedia.org/wiki/Remote_Associates_Test) (drei scheinbar unverbundene Wörter, gesucht ist das vierte, das alle drei verbindet) ist bis heute in Gebrauch.

Die moderne Netzwerkforschung stützt den Kern: [Kenett, Anaki & Faust 2014](https://doi.org/10.3389/fnhum.2014.00407) rekonstruierten die semantischen Gedächtnisnetze hoch- und niedrigkreativer Personen. Das Netz der Hochkreativen ist stärker verbunden, mit kürzeren Wegen zwischen Begriffen und weniger Zerfall in Teilinseln; das der Niedrigkreativen ist starrer und zerklüfteter. Entfernte Verknüpfung ist also keine Metapher, sondern eine messbare Eigenschaft der Wissensstruktur — und die Distanz zwischen zwei Konzepten ist berechenbar (Abschnitt 10).

**Systemfolge:** `verbindung` ist die theoretisch am besten fundierte der drei Erweiterungsarten — sie *ist* Mednicks Definition, angewandt auf zwei Textstellen oder auf eine Textstelle und einen fremden Gedanken. Daraus folgt ihr Qualitätsmaß: der Wert einer verbindung wächst mit der überbrückten Distanz, *sofern* die Brücke trägt. Zwei benachbarte Absätze, die dasselbe sagen, sind keine verbindung, sondern ein Redundanzbefund — der gehört in den Korrektur-Kanal, nicht ins Geschenk.

## 4. Bisoziation, Blending und Bodens drei Formen des Neuen

Drei Theorielinien beschreiben, *was* beim Verbinden entsteht:

- **Bisoziation** ([Koestler, The Act of Creation, 1964](https://en.wikipedia.org/wiki/The_Act_of_Creation)): Die schöpferische Leistung liegt im Schnittpunkt zweier **gewohnheitsmäßig unvereinbarer Bezugsrahmen** — derselbe Mechanismus trage Witz (Pointe), Wissenschaft (Entdeckung) und Kunst. Koestlers Werk ist Theorie ohne Messprogramm, aber sein Kriterium ist scharf: Nicht zwei benachbarte Rahmen, sondern zwei, die normalerweise nie gleichzeitig aktiv sind.
- **Conceptual Blending** ([Fauconnier & Turner 1998](https://philpapers.org/rec/FAUCIN); Buchform: The Way We Think, 2002): Beim Verschmelzen zweier Vorstellungsräume wird selektiv projiziert, und im Blend entsteht **emergente Struktur** — Eigenschaften, die keiner der beiden Ausgangsräume enthielt. Am stärksten in „double-scope"-Blends, wo die Organisationsrahmen *beider* Räume einfließen und kollidieren. Das liefert das Qualitätskriterium, das Koestler fehlte: Ein guter Blend zeigt etwas, das erst durch die Kombination sichtbar wird.
- **Bodens Dreiteilung** ([Boden 1998](https://doi.org/10.1016/S0004-3702(98)00055-1); ausführlich in The Creative Mind, 1990/2004): **kombinatorische** Kreativität (vertraute Ideen neu verbinden), **explorative** (einen vorhandenen Denkraum weiter ausschreiten, als es bisher jemand tat) und **transformative** (eine Regel des Denkraums selbst ändern, sodass vorher unmögliche Gedanken möglich werden). Die Dreiteilung ist das gebräuchlichste Raster, um Arten von Neuheit zu unterscheiden — auch in der KI-Forschung.

**Systemfolge:** Für `verbindung` ist emergente Struktur das Abnahmekriterium: Die Erweiterung muss benennen, was *nur durch* das Zusammenlegen sichtbar wird — „beide Stellen handeln von X" ist Überlappung, kein Blend. Und Bodens Raster legt eine Lücke im Kanal offen: weiterführung und feld sind explorativ, verbindung ist kombinatorisch — **transformativ ist keine der drei** (Abschnitt 11).

## 5. Analogie: Struktur schlägt Oberfläche

Die Analogieforschung ist der am besten vermessene Teil des Feldes, und sie enthält den Satz, der Ondas Kernversprechen wissenschaftlich buchstabiert.

- **Structure-Mapping** ([Gentner 1983](https://doi.org/10.1207/s15516709cog0702_3)): Eine Analogie ist eine Abbildung von **Beziehungen**, nicht von Merkmalen. „Das Atom ist wie ein Sonnensystem" trägt, weil das Beziehungsgefüge (Zentralkörper, Umlauf, Anziehung) übertragen wird — nicht, weil Atome gelb und heiß wären. Tragfähig sind Analogien mit tiefer, verschachtelter Beziehungsstruktur (Systematizität), nicht solche mit vielen gemeinsamen Oberflächenmerkmalen.
- **Die Dissoziation** ([Gentner, Rattermann & Forbus 1993](https://doi.org/10.1006/cogp.1993.1013)): Was einem **einfällt**, wird von Oberflächenähnlichkeit getrieben — Erinnerungen mit gleichen Objekten und Wörtern kommen um ein Vielfaches häufiger als strukturgleiche. Was man als **stichhaltig** beurteilt, hängt dagegen an der gemeinsamen Beziehungsstruktur. Der Abruf liefert also systematisch das Falsche: das Naheliegende ist das Oberflächenähnliche, das Wertvolle ist das Strukturähnliche.
- **Transfer ist selten und stimulierbar** ([Gick & Holyoak 1980](https://doi.org/10.1016/0010-0285(80)90013-4), [1983](https://doi.org/10.1016/0010-0285(83)90002-6)): Wer die Festungsgeschichte kennt (Truppen konvergieren aus mehreren Richtungen), löst das strukturgleiche Strahlenproblem trotzdem meist nicht — ohne Hinweis nutzen nur etwa 30 % die Analogie (gegen 10 % Basisrate), mit dem bloßen Hinweis „die Geschichte hilft" rund 75–80 %. Und: Wer **zwei** Analogien vergleicht, bildet ein abstraktes Schema und transferiert danach spontan viel besser — Abstraktion vom Oberflächenmaterial ist der Hebel.
- **Draußen im Feld** nutzen erfahrene Wissenschaftler Analogien produktiver als Laborprobanden: In Dunbars Beobachtungen echter Laborbesprechungen beruhten die fruchtbaren Analogien überwiegend auf gemeinsamen Beziehungen, und ferne Analogien tauchten gerade bei Konzeptwechseln auf (Überblick bei [Gentner & Maravilla 2018](https://groups.psych.northwestern.edu/gentner/papers/GentnerMaravilla_2018-Handbook.pdf)). Tiefe Vertrautheit mit der Struktur des eigenen Gegenstands macht ferne, tragfähige Analogien wahrscheinlicher.

**Systemfolge:** Die Erzeugung von `feld`-Erweiterungen sollte den Umweg über die Struktur erzwingen: erst das Beziehungsgerüst der Passage ohne ihre Inhaltswörter beschreiben, dann ein entferntes Gebiet mit demselben Gerüst suchen, dann die Abbildung Punkt für Punkt benennen. Ein Nachbargebiet, das nur dieselben Wörter teilt (Oberflächenanalogie), ist genau der billige Ausschuss, den der Kanal verwerfen soll — und es ist das, was ein Modell ohne diesen Umweg zuerst liefert, denn Einbettungsnähe ist Oberflächennähe.

## 6. Fixierung: warum das Naheliegende klebt

Das Naheliegende ist kein gelegentlicher Ausrutscher, sondern der Normalbetrieb der Ideenerzeugung:

- **Der Weg des geringsten Widerstands** ([Ward 1994](https://doi.org/10.1006/cogp.1994.1010)): Wer Tiere für einen fremden Planeten erfinden soll, erfindet Tiere mit Augen, Beinen und Symmetrie — neue Exemplare werden von den typischsten Merkmalen der vertrauten Kategorie aus gebaut, nicht frei.
- **Design-Fixierung** ([Jansson & Smith 1991](https://doi.org/10.1016/0142-694X(91)90003-F)): Wer vor einer Entwurfsaufgabe ein Beispiel sieht, übernimmt dessen Merkmale — auch wenn die Mängel des Beispiels ausdrücklich benannt wurden.
- **Konformität trotz Gegenanweisung** ([Smith, Ward & Schumacher 1993](https://doi.org/10.3758/BF03202751)): Selbst die ausdrückliche Anweisung, sich von den gezeigten Beispielen zu unterscheiden, verhindert nicht, dass deren Merkmale in die eigenen Entwürfe einsickern. Beispiele wirken unterhalb der Absicht.
- **Die Modell-Ebene verschärft das:** Von GPT-4 erzeugte Ideenpools sind messbar weniger vielfältig als die von Menschengruppen; gezieltes Prompting — am stärksten schrittweises Vorgehen mit ausdrücklicher Wiederholungsvermeidung — schließt die Lücke fast ([Meincke, Mollick & Terwiesch 2024](https://arxiv.org/abs/2402.01727)). In einer Nutzerstudie erzeugten verschiedene Personen mit ChatGPT einander ähnlichere Ideen als ohne — die Homogenisierung entsteht auf Gruppenebene, weil das Modell allen Ähnliches vorschlägt ([Anderson, Shah & Kreminski 2024](https://doi.org/10.1145/3635636.3656204)). Zugleich wurden LLM-Forschungsideen in einer großen Blindbewertung als *origineller* als Expertenideen eingestuft, aber beim Hochskalieren wiederholt sich das Modell schnell — viele Züge aus demselben Topf liefern Duplikate ([Si, Yang & Hashimoto 2024](https://arxiv.org/abs/2409.04109)). Zur kollektiven Einebnung durch KI-Assistenz siehe auch die Befunde in [2026-07-19-ki-text-slop.md](2026-07-19-ki-text-slop.md) (Doshi & Hauser 2024).

**Systemfolge:** Zwei Konsequenzen, eine erzeugende und eine schützende. Erzeugend: Das Verwerfen des Naheliegenden muss **vor** der Anzeige geschehen — vom System, nicht vom Nutzer. Schützend: Eine gezeigte naheliegende Erweiterung ist nicht neutral, sie **fixiert den Autor** auf genau die Spur, die er auch allein gefunden hätte, und macht seine eigene Suche enger (Konformitätseffekt). Ein schwacher Erweiterungs-Kanal ist damit schlechter als keiner. Außerdem: Ondas frühere Erweiterungen sind für spätere Läufe selbst Beispiele — ohne bewussten Musterwechsel konvergiert der Kanal auf seine eigene Schablone.

## 7. Inkubation: wann gute Ideen kommen

Die Vier-Phasen-Folklore (Vorbereitung, Inkubation, Erleuchtung, Prüfung) stammt von [Wallas 1926](https://en.wikipedia.org/wiki/Graham_Wallas). Der harte Kern ist inzwischen meta-analytisch geprüft ([Sio & Ormerod 2009](https://doi.org/10.1037/a0014212)):

- Es gibt einen **positiven, insgesamt kleinen Inkubationseffekt**: Eine Aufgabe beiseitelegen und später fortsetzen verbessert die Lösung.
- Er ist am größten bei **divergenten Aufgaben** — also genau der Aufgabenklasse des Erweiterns — und kleiner bei sprachlichen und visuellen Einsichtsproblemen.
- **Leichte Nebentätigkeit schlägt Pause, Pause schlägt schwere Nebentätigkeit:** Eine Inkubationszeit mit anspruchsloser Beschäftigung wirkt stärker als reines Ausruhen und deutlich stärker als eine fordernde Zweitaufgabe.
- **Längere Vorbereitung → größerer Effekt:** Inkubation zahlt sich vor allem aus, wenn vorher ernsthaft am Problem gearbeitet wurde.

[Baird u. a. 2012](https://doi.org/10.1177/0956797612446024) präzisieren den Mechanismus: Die anspruchslose Tätigkeit, die am meisten Gedankenwandern erlaubte, verbesserte die Originalität — aber **nur für Probleme, an denen vorher schon gearbeitet worden war**, nicht für neue. Eine ergänzende Erklärung ist das **selektive Vergessen von Fixierungen**: In der Pause zerfällt die Aktivierung der festgefahrenen, irreführenden Lösungsansätze, danach ist der Weg zu anderen frei ([Smith & Blankenship 1991](https://doi.org/10.2307/1422851)).

**Systemfolge:** Drei Ableitungen für die Momente. Erstens: **Die Pause ist Arbeitszeit des Autors** — genau dann eine Erweiterung einzublenden hieße, die anspruchslose Phase, in der Fernes erreichbar wird, durch fremden Input zu ersetzen und womöglich neu zu fixieren. Der natürliche Ort des Angebots ist der **Wiedereinstieg**, nicht die Pause selbst; das System kann die Pause als sein eigenes Rechenfenster nutzen und das Ergebnis beim Zurückkommen bereithalten. Zweitens: Erweiterungen lohnen dort, wo nachweislich gearbeitet wurde (bearbeitete, umgeschriebene, lang verweilte Passagen) — für unberührte Stellen fehlt die Vorbereitung, auf der Inkubation aufsetzt. Drittens: Eine wissenschaftliche Begründung für eine bestimmte Sekundenzahl („45 Sekunden Aufschauen") gibt es nicht — die Inkubationsstudien arbeiten mit Minuten, und die Schreibpausenforschung (Karte 01) zeigt, dass jede feste Schwelle Setzung ist. Die Schwelle darf pragmatisch sein; die Forschung entscheidet nur, *was* in der Pause nicht passieren darf und *wo* das Ergebnis hingehört.

## 8. Brainstorming: Osborns Versprechen gegen die Evidenz

[Osborns](https://en.wikipedia.org/wiki/Alex_Faickney_Osborn) Behauptung von 1953, Gruppen-Brainstorming vervielfache die Ideenproduktion, ist eine der am gründlichsten widerlegten Thesen der Angewandten Psychologie — und die Gründe sind für Onda lehrreicher als das Ergebnis:

- Schon [Taylor, Berry & Block 1958](https://doi.org/10.2307/2390603) fanden: Vier Einzeldenker, deren Listen man zusammenlegt („Nominalgruppe"), schlagen die echte Vierergruppe deutlich.
- Die Meta-Analyse über drei Jahrzehnte bestätigt den Produktivitätsverlust echter Gruppen als großen, stabilen Effekt — in Menge *und* Qualität der Ideen ([Mullen, Johnson & Salas 1991](https://doi.org/10.1207/s15324834basp1201_1)). Die Gruppen selbst merken es nicht und halten sich für produktiver ([Stroebe, Diehl & Abakoumkin 1992](https://doi.org/10.1177/0146167292185015)).
- Die Hauptursache ist **Produktionsblockade**: Während einer spricht, können die anderen nicht entwickeln; Warten zerstört die eigene Spur ([Diehl & Stroebe 1987](https://doi.org/10.1037/0022-3514.53.3.497)).
- Und Osborns berühmteste Regel — „Kritik verboten" — kehrt sich in der Prüfung um: Gruppen mit der ausdrücklichen Erlaubnis zu **debattieren und zu kritisieren** erzeugten mehr Ideen als klassisch instruierte Brainstorming-Gruppen, in zwei Ländern repliziert ([Nemeth u. a. 2004](https://doi.org/10.1002/ejsp.210)). Widerspruch stimuliert divergentes Denken, statt es zu würgen.

Was von Osborn übrig bleibt: Die Trennung von Erzeugen und Bewerten als *individuelle* Arbeitstechnik und der Zusammenhang von Menge und Trefferzahl (Abschnitt 2) sind haltbar; die Gruppensitzung ist es nicht.

**Systemfolge:** Onda arbeitet strukturell wie die überlegene Bauform: parallel, schriftlich, ohne Blockade — der Agent erzeugt seine Kandidaten getrennt vom Autor und legt nur die besten daneben. Zwei Übertragungen sind konkret: Erstens darf der Agent den Autor nie in die Rolle des Wartenden bringen (die Erweiterung liegt bereit, sie unterbricht keine Produktion — deckungsgleich mit Karte 01). Zweitens ist Nemeths Befund eine Lizenz: Eine Erweiterung darf dem Text **widersprechen** — ein Gedanke, der die These reibt, ist der Forschung nach ein besserer Kreativitätsimpuls als wohlwollende Fortsetzung. Das Geschenk muss kein Kompliment sein.

## 9. Produktive Beschränkungen

Die Intuition „Freiheit macht kreativ" hält der Prüfung nicht stand:

- In Schreibexperimenten erzeugten Personen, die vorgegebene Substantive in Grußkartenreime einbauen mussten, *kreativere* Zweizeiler als die frei Schreibenden — und der Effekt trug in die anschließende freie Aufgabe hinüber; bloße Übung unter Beschränkung stimuliert ([Haught-Tromp 2017](https://doi.org/10.1037/aca0000061), „Green Eggs and Ham hypothesis", nach Dr. Seuss' 50-Wörter-Buch).
- Die disziplinübergreifende Übersicht kommt zum selben Bild: Ohne Beschränkungen folgen Menschen und Organisationen dem Weg des geringsten Widerstands; ein mittleres Maß an Input-, Prozess- und Ergebnisbeschränkungen fördert Kreativität und Innovation, erst zu viel davon erstickt sie — ein umgekehrtes U ([Acar, Tarakci & van Knippenberg 2019](https://doi.org/10.1177/0149206318805832)).

Der Mechanismus verbindet die Abschnitte 5 und 6: Eine Beschränkung sperrt die dominante, naheliegende Route und zwingt die Suche in dünner besiedelte Teile des Raums — sie wirkt wie ein künstlich erzeugter Umweg über die Struktur.

**Systemfolge:** Der offene Auftrag „erweitere diesen Gedanken" ist die schlechteste denkbare Prompt-Form — er lädt zum Weg des geringsten Widerstands ein. Wirksamer sind wechselnde, harte Beschränkungen im Erzeugungsschritt: „ohne die Schlüsselwörter der Passage", „aus einem Wissensgebiet, das im Text nicht vorkommt", „als Einwand", „als konkreter Einzelfall statt Verallgemeinerung". Der Wechsel der Beschränkung von Lauf zu Lauf ist zugleich das Mittel gegen die Selbst-Schablonisierung des Kanals (Abschnitt 6).

## 10. Originalität messen: semantische Distanz und ihre Grenzen

Wie misst die Forschung „nicht naheliegend"? Der Goldstandard ist seit [Amabile 1982](https://doi.org/10.1037/0022-3514.43.5.997) die **konsensuelle Beurteilung**: unabhängige, sachkundige Urteiler bewerten blind; ihr Konsens *ist* das Kreativitätsmaß. Alles Automatische ist Annäherung daran. Die Annäherungen sind inzwischen gut:

- **Semantische Distanz** — der Einbettungsabstand zwischen Aufgabenbegriff und Antwort — sagt menschliche Originalitätsurteile zuverlässig voraus; die offene Plattform SemDis bündelt mehrere semantische Räume zu einem stabilen Faktor ([Beaty & Johnson 2021](https://doi.org/10.3758/s13428-020-01453-w)).
- Der **Divergent Association Task** dreht das Prinzip um: zehn möglichst unverwandte Wörter nennen, gemessen wird die mittlere paarweise Distanz. Vier Minuten, automatisch bewertet, korreliert mit etablierten Kreativitätsmaßen mindestens so stark wie diese untereinander — an 8.914 Personen ([Olson u. a. 2021](https://doi.org/10.1073/pnas.2022340118)).
- Für ganze Texte statt Einzelantworten misst **Divergent Semantic Integration**, wie weit auseinanderliegende Ideen eine Erzählung verbindet ([Johnson u. a. 2022](https://doi.org/10.3758/s13428-022-01986-2)).
- Und **feinjustierte Sprachmodelle schlagen die reine Distanz**: Auf menschliche Originalitätsurteile trainierte Modelle erreichen deutlich höhere Übereinstimmung mit Urteilern als semantische Distanz allein ([Organisciak u. a. 2023](https://doi.org/10.1016/j.tsc.2023.101356)).

Die Grenzen sind ebenso klar: Distanz ist nur die Neuheitshälfte der Standarddefinition — maximale Distanz ohne Passungsprüfung prämiert Zufallswörter. Die Verfahren sind an englischen Kurzantworten geeicht, nicht an deutschen Sachtexten. Und längere, ausgeschmücktere Antworten erhalten systematisch bessere Bewertungen — derselbe Formatbias, den [2026-07-19-ki-text-slop.md](2026-07-19-ki-text-slop.md) für Qualitätsurteile dokumentiert; Bewertung braucht deshalb längennormierte Eingaben.

**Systemfolge:** „Nicht naheliegend" ist automatisierbar, aber nur relativ: nicht als absolute Distanzschwelle, sondern als Abstand **zur Wolke des Erwartbaren**. Konkret: Ein billiges Modell erzeugt für dieselbe Passage viele erwartbare Erweiterungen; ein Kandidat gilt als naheliegend, wenn er in dieser Wolke liegt. Das operationalisiert Jakobs Urteil „das hätte ich selbst gehabt", ohne ihn für jede Eval zu brauchen — ersetzt ihn aber nicht (Abschnitt 11).

## 11. Implikationen für Onda

### Die drei Arten — und die fehlende vierte

Die Forschung deckt die drei Arten unterschiedlich gut und legt eine Lücke offen:

| Onda-Art | Fundament | Kreativitätsform (Boden) |
|---|---|---|
| verbindung | Mednick, Koestler, Blending — am stärksten fundiert | kombinatorisch |
| weiterführung | divergentes Denken, Serienpositionseffekt | explorativ (im Raum weiter) |
| feld | Analogieforschung, Strukturübertragung | explorativ (an der Raumgrenze) |
| — | Boden: transformativ; Constraint-Forschung; Problem Finding | **transformativ — fehlt** |

Die vierte wäre: **eine Setzung des Textes kippen** — eine stillschweigende Annahme, eine Rahmung, die Frage hinter dem Text selbst. Bodens transformative Kreativität ist genau das (eine Regel des Denkraums ändern, statt in ihm zu suchen), und die [Problem-Finding-Tradition](https://en.wikipedia.org/wiki/Problem_finding) (Getzels & Csikszentmihalyi 1976) fand in einem viel zitierten, methodisch begrenzten Längsschnitt, dass die Qualität der Problem*formulierung* künstlerischen Erfolg Jahre später vorhersagte. Abgrenzung: Die bestehenden Hinweisarten `logik`/`methode` prüfen, ob der Text seine eigenen Regeln einhält — Mangel-Rahmung. Die vierte Art würde fragen, ob andere Regeln einen besseren Text ergäben — Geschenk-Rahmung. Ob dieses Kippen als Geschenk oder als Angriff ankommt, kann nur Jakob entscheiden (siehe offene Fragen).

### Nicht-Naheliegendes strukturell erzeugen — fünf Prompt-Strategien

1. **Übererzeugen, spät auswählen.** Intern deutlich mehr Kandidaten als angezeigt; Auswahl nach größter semantischer Distanz zum Text *und* untereinander, dann Passungs-Gate. Stützen: Serienpositionseffekt, equal odds, gemessene Duplikationsneigung von LLMs bei Mehrfachziehung (Si u. a. 2024).
2. **Die Naheliegend-Wolke erzeugen und sperren.** Erst ausdrücklich die erwartbaren Erweiterungen auflisten (billiges Modell genügt), dann außerhalb davon suchen. Das ist die messbare Fassung von „das Naheliegende erkennen und verwerfen" und deckt sich mit Vorkehrung 2/3 aus Karte 04. Vorsicht: Bei Menschen wirken gezeigte Beispiele fixierend trotz Gegenanweisung (Smith u. a. 1993); ob die Sperrliste das Modell anzieht statt abstößt, ist genau das Experiment aus Karte 04.
3. **Strukturanalogie erzwingen** (für feld): Beziehungsgerüst der Passage ohne Inhaltswörter beschreiben → fernes Gebiet mit gleichem Gerüst suchen → Abbildung benennen. Stützen: Gentner 1983/1993, Gick & Holyoak 1983 (Schemabildung durch Vergleich).
4. **Beschränkung wechseln.** Pro Lauf eine andere harte Beschränkung (Lexik-Sperre, Fremdgebiet-Pflicht, Einwand-Form, Einzelfall-Form). Stützen: Haught-Tromp 2017, Acar u. a. 2019 — und es verhindert die Selbst-Schablone des Kanals.
5. **Entfernte Assoziation mit Rechtfertigungspflicht** (für verbindung): gezielt ferne Konzepte ziehen (DAT-Prinzip), verbinden — aber nur anbieten, was eine benennbare, wahre Brücke hat und emergente Struktur zeigt (was wird *nur durch* die Verbindung sichtbar?). Die Redlichkeitspflicht aus der Slop-Notiz gilt unverändert: keine erfundenen Zusammenhänge.

Schrittweises Erzeugen mit ausdrücklicher Wiederholungsvermeidung (Chain-of-Thought) ist die einzige dieser Techniken, die für LLM-Ideenvielfalt direkt vermessen ist — sie brachte GPT-4-Pools nahe an menschliche Gruppenvielfalt (Meincke u. a. 2024).

### Wann anbieten

Die Inkubationsforschung gibt dem Aufschauen-Moment recht — und korrigiert ihn in einem Punkt: Die Pause selbst ist die Phase, in der der Autor Fernes erreichen kann; fremder Input währenddessen stört oder fixiert neu. Also: **in der Pause rechnen, beim Wiedereinstieg anbieten.** Erweiterungen gehören zu Passagen, an denen gearbeitet wurde (Inkubation wirkt nur auf Vorbereitetes — Baird u. a. 2012), nicht zu unberührten. Für eine bestimmte Sekundenschwelle (45 s) gibt es keine Evidenzbasis — sie ist Setzung und darf es sein; die eigene Recherche in Karte 01 zeigt, dass es eine „richtige" Zahl nicht gibt. Und im Moment `sofort` hat der Kanal nichts verloren: Divergenter Input während des Formulierens trifft auf den teuersten Zwischenzustand und wirkt als Beispiel-Fixierung mitten in der Produktion.

### Originalität messen (DIVERGE-Evals)

- **Zwei-Tore-Rubrik:** Tor 1 Originalität (nicht in der Naheliegend-Wolke), Tor 2 Tragfähigkeit (wahr, anschlussfähig, am Text verankert). Ein Kandidat muss beide bestehen; die Tore werden getrennt berichtet. Das bildet die Kandidatenliste aus Karte 05 ab („nicht naheliegend" + „wahr und redlich" + „anschlussfähig").
- **Naheliegend-Baseline:** Pro Eval-Text erzeugt ein billiges Modell N erwartbare Erweiterungen; gemessen wird der Einbettungsabstand des Kandidaten zum Zentrum und zum nächsten Nachbarn dieser Wolke. Das ist die automatisierbare Fassung von „hätte Jakob selbst gehabt".
- **Paarweise Diversität** der drei angebotenen Erweiterungen (gegenseitiger Einbettungsabstand) — gegen die belegte Homogenisierungsneigung (Anderson u. a. 2024; Meincke u. a. 2024 nutzen dieselbe Kosinus-Metrik).
- **LLM-Richter mit Rubrik** statt roher Distanz für die Tragfähigkeitshälfte — feinjustierte Bewertung schlägt Distanz (Organisciak u. a. 2023); deutsche Eichung fehlt und muss projektintern über Kontrastpaare geschehen (bewährtes Muster der bestehenden Eval-Reihen: gute Lösung schlägt Strohmann 5:0).
- **Jakob als Anker, nicht als Engpass:** Kleine, wiederkehrende Konsensstichproben (CAT-Prinzip) kalibrieren die automatischen Maße und prüfen deren Drift — sein Urteil bleibt die Definitionsinstanz von „naheliegend", die Automatik nur deren Stellvertreter.
- **Längennormierung** in allen Urteilen, wegen des dokumentierten Formatbias.

### Offene Fragen an Jakob

1. **Die vierte Art:** Soll es eine Erweiterung geben, die eine Setzung des Textes kippt („was wäre der Text, wenn diese Annahme nicht gälte")? Ist das für dich ein Geschenk oder ein Übergriff — und braucht sie eine eigene, vorsichtigere Gestalt?
2. **Wie fern ist zu fern?** Die Forschung sagt: Distanz gut, aber tragen muss es (umgekehrtes U). Die Zone dazwischen ist Geschmack. Das Experiment aus Karte 04 (Gegenüberstellung am echten Text) sollte auch *zu ferne* Kandidaten enthalten, damit du die obere Grenze ziehst, nicht nur die untere.
3. **Darf die Naheliegend-Wolke sichtbar sein?** „Das Erwartbare, das ich verworfen habe" zu zeigen wäre ehrlich und erklärte den Wert — aber gezeigte Beispiele fixieren nachweislich auch den Betrachter. Verstecken oder auf Abruf zeigen?
4. **Widerspruch als Erweiterung:** Nemeth zufolge stimuliert Reibung. Darf eine weiterführung deiner These widersprechen, oder gehört Widerspruch für dich in den Korrektur-Kanal (logik) — mit dessen Mangel-Rahmung?
5. **Quelle der Fernen:** Dürfen verbindungen auch dein projektfremdes Material (andere Projekte, Themen-Gedächtnis) anzapfen, oder bleibt der Kanal projektintern? Die Gedächtnisgrenzen aus dem CONTEXT verlangen für Projektübergriffe heute ausdrückliche Freigabe.
