# Forschungsnotiz: Argumentationslehre und Fehlschlüsse als Handwerk

> Stand: 2026-08-05. Querschnitts-Feld für die Hinweisarten `logik` (Bruch im Gedankengang,
> unbeantwortetes Gegenargument) und `methode` (aus Daten wird mehr geschlossen, als sie
> tragen) — und für das gebaute Argument-Modul (`app/src/argument-model.mjs`,
> `argument-graph.mjs`, `argument-projection.mjs`, `argument-deliberation.mjs`,
> `claim-ledger.mjs`: atomare Claims, fünf Relationstypen, Grundursachen, Zyklen, faire
> belegte Gegenargumente). Abgrenzung: Die Genre-Notizen
> [wissenschaftliches Schreiben](2026-08-05-handwerk-wissenschaftliches-schreiben.md)
> (Belegpraxis, Hedging im Paper) und [Essay](2026-08-05-handwerk-essay.md)
> (Gedankenführung statt Beweisführung) liefern die Textsorten-Anwendung; diese Notiz
> liefert die Theorie dahinter — was ein Argument gut macht, unabhängig vom Genre.

## Kurzfazit

Die moderne Argumentationslehre hat sich von der Schulbuch-Idee verabschiedet, man könne
schlechte Argumente an einer Liste lateinischer Etiketten erkennen. Ihre drei tragenden
Einsichten: Erstens sind Alltagsargumente fast nie deduktiv gültig, sondern **anfechtbar**
(defeasibel) — gut sind sie, wenn sie den passenden kritischen Fragen standhalten
(Walton). Zweitens sind die meisten „Fehlschlüsse" keine falschen Formen, sondern
**schwache oder unfaire Verwendungen von Formen, die auch legitim vorkommen** — der
„Fallacy Fork": entweder ist die Definition so streng, dass der Fehler praktisch nie
vorkommt, oder so weit, dass sie auch gute Argumente trifft. Drittens ist Argumentqualität
**dialogisch**: Ein Zug ist fehlerhaft relativ zu den Regeln einer kritischen Diskussion
und zur Beweislast, nicht an sich (Pragma-Dialektik).

Für Onda heißt das: Der ergiebigste Import ist nicht die Fehlschluss-Liste, sondern der
Mechanismus **Schema + kritische Fragen** — er erzeugt genau die stellengenauen, fair
begründeten logik- und methode-Hinweise, die das System verlangt. Fehlschluss-Namen sollte
der Agent fast nie ausgeben (die Empirie zeigt: selbst Menschen sind sich bei der
Feinklassifikation kaum einig), sondern die konkret verletzte Prüffrage in Klartext.
Das gebaute Argument-Modul liegt strukturell richtig: Warrant-Feld an der Relation,
Zyklen-Erkennung, belegte Gegenargumente und Enthaltung bei Mehrdeutigkeit entsprechen
dem Forschungsstand — was fehlt, ist eine kleine kuratierte Schema-Bibliothek als
Prüffragen-Quelle.

## 1. Das Toulmin-Schema: sechs Bausteine — und seine Grenzen in der Praxis

Stephen Toulmin ersetzte 1958 in „The Uses of Argument" das Prämisse/Konklusion-Modell
durch sechs funktionale Bausteine, entwickelt am Vorbild juristischer Argumentation:
**Claim** (die strittige Behauptung), **Data/Grounds** (das Material, auf das man sich
stützt), **Warrant** (die Schlussbrücke — die allgemeine Regel, die den Schritt vom
Material zur Behauptung erlaubt), **Backing** (die Stützung der Schlussbrücke selbst),
**Qualifier** (die Einschränkung: „vermutlich", „in der Regel") und **Rebuttal** (die
benannte Ausnahmebedingung) ([Hitchcock, Toulmin's Warrants](https://www.humanities.mcmaster.ca/~hitchckd/Toulminswarrants.pdf),
[Überblick SJSU](https://www.sjsu.edu/writingcenter/docs/handouts/Toulmin%20Model%20of%20Argumentative%20Writing.pdf)).
Zwei Toulmin-Punkte sind für ein Prüfwerkzeug zentral: Die Schlussbrücke ist meist
**implizit** — Material wird genannt, die Regel dahinter nicht. Und die Standards für die
Stützung sind **feldabhängig**: Was in der Jurisprudenz eine Schlussbrücke trägt, trägt
sie in der Medizin nicht.

Die Praxisgrenzen sind gut dokumentiert. Van Eemeren, Grootendorst & Kruiger wandten ein,
Data und Warrant seien in realen Texten oft kaum zu unterscheiden; Hitchcock hält mit
einer Stichprobe von 50 realen Argumenten dagegen (49-mal problemlos trennbar), zeigt aber
selbst die tiefere Grenze: Die Frage „**welche** Schlussbrücke nimmt dieses Argument an?"
hat eine falsche Voraussetzung — zu jedem Schritt gibt es **mehrere mögliche Warrants**
verschiedener Reichweite, und welcher gemeint ist, lässt sich am Text nicht entscheiden.
Warrant-Rekonstruktion ist darum eine Frage der **Bewertung** („trägt irgendeine
etablierte Regel diesen Schritt?"), nicht der eindeutigen Rekonstruktion
([Hitchcock, ebd.](https://www.humanities.mcmaster.ca/~hitchckd/Toulminswarrants.pdf)).
Zudem ist das Schema für Einzelschritte gebaut; die Verkettung vieler Schritte zu einer
Textarchitektur beschreibt es nicht.

**Systemfolge:** Ondas Architektur trifft beide Punkte bereits: Die Relation trägt ein
`warrant`-Feld (Schlussbrücke sichtbar und korrigierbar an der Kante, nicht als eigener
Claim), und `argument-projection.mjs` enthält sich bei mehrdeutigen Rollen. Hitchcocks
Befund schärft die Regel: Der Agent darf nie behaupten, DIE Schlussbrücke des Autors
gefunden zu haben — er bietet Kandidaten-Formulierungen an („dieser Schritt trägt nur,
wenn man annimmt, dass …") und fragt, ob der Autor das meint. Der Qualifier ist im
Claim-Ledger als „erlaubte Formulierungsstärke" schon Systembegriff; das Rebuttal
(benannte Ausnahmebedingung) ist die theoretische Heimat des Relationstyps `qualifies`.

## 2. Walton: Argumentationsschemata mit kritischen Fragen — ein Hinweis-Generator

Douglas Waltons Programm (mit Chris Reed und Fabrizio Macagno: „Argumentation Schemes",
Cambridge 2008) katalogisiert die stereotypen Muster anfechtbaren Alltagsschließens —
das Kompendium umfasst rund 60 Schemata — und gibt **jedem Schema einen Satz kritischer
Fragen** mit: Das Argument gilt vorläufig (präsumtiv), bis eine kritische Frage gestellt
und nicht beantwortet ist ([Cambridge, Frontmatter](https://assets.cambridge.org/97805217/23749/frontmatter/9780521723749_frontmatter.pdf),
[NDPR-Besprechung](https://ndpr.nd.edu/reviews/argumentation-schemes/)). Das
Paradebeispiel Expertenmeinung: „E ist Experte für Gebiet S; E sagt A; also plausibel A"
— mit sechs kritischen Fragen: Wie glaubwürdig ist E als Quelle? Ist E Experte für
**genau das Feld**, in dem A liegt? Was genau hat E behauptet? Ist E persönlich
verlässlich (unbefangen)? Ist A konsistent mit anderen Experten? Stützt sich Es Aussage
auf Belege? Analog beim Konsequenzargument: Wie wahrscheinlich sind die genannten Folgen?
Welche Belege stützen das? Gibt es **gegenläufige** Folgen, die unterschlagen werden?
([Walton/Macagno, Klassifikationssystem 2015](https://journals.sagepub.com/doi/10.1080/19462166.2015.1123772)).

Entscheidend ist die Mechanik: Kritische Fragen sind **vorformulierte, faire
Gegenzüge** — sie unterstellen keinen Fehler, sondern benennen die Stelle, an der das
Schema scheitern kann. Manche kritischen Fragen verschieben die Beweislast auf den
Fragenden (er muss den Zweifel belegen), andere auf den Autor (er muss nachliefern) —
diese Unterscheidung gehört zum Schema dazu ([Walton, Burden of Proof, Presumption and
Argumentation](https://www.cambridge.org/core/books/burden-of-proof-presumption-and-argumentation/7A0CE6323BD75D5B6AB44DFEA4A88594)).

**Systemfolge:** Das ist wörtlich die Bauanleitung für den logik/methode-Hinweisgenerator:
(1) Passage einem Schema zuordnen (konservativ, wie die bestehende Projektion), (2) die
kritischen Fragen des Schemas durchgehen, (3) nur die Fragen als Hinweis ausgeben, die
der Text erkennbar **nicht** beantwortet — samt Beweislast-Richtung („hier müsste der
Text nachliefern" vs. „das wäre ein möglicher Einwand, den ein Kritiker belegen müsste").
Ein so erzeugter Hinweis ist automatisch stellengenau, fair und begründet — kein
Etikett, sondern eine offene Frage. Abschnitt 10a liefert zehn konkrete Beispiele.

## 3. Fehlschluss-Systematik: formal vs. informal, die wichtigsten Muster

Die klassische Definition — ein Fehlschluss ist ein Argument, das gültig scheint, es
aber nicht ist — trennt zwei Familien ([SEP: Fallacies](https://plato.stanford.edu/entries/fallacies/)):
**Formale Fehlschlüsse** verletzen eine logische Form und sind kontextfrei erkennbar —
vor allem Bejahung des Konsequens („wenn A, dann B; B; also A"), Verneinung des
Antezedens („wenn A, dann B; nicht A; also nicht B") und der unverteilte Mittelbegriff.
**Informale Fehlschlüsse** sind formal unauffällig; ihr Fehler liegt in Inhalt, Relevanz
oder Dialogsituation. Die Kernliste der Tradition (SEP zählt ~18), mit
Erkennungsmerkmalen und der jeweils legitimen Zwillingsform:

| Muster | Erkennungsmerkmal | Legitime Zwillingsform |
|---|---|---|
| Ad hominem (persönlicher Angriff) | Aussage wird über die Person statt über den Inhalt zurückgewiesen | Glaubwürdigkeitsprüfung einer **Quelle/Zeugin** (Befangenheit, Erfolgsbilanz) |
| Strohmann | Wiedergegebene Gegenposition weicht von der belegbaren Aussage ab | Zulässige Verdichtung, die der Gegner akzeptieren würde |
| Autoritätsargument (ad verecundiam) | Autorität ersetzt Beleg; Feld passt nicht; Dissens verschwiegen | Expertenmeinung, die den sechs kritischen Fragen standhält |
| Ad populum | Verbreitung einer Ansicht als Wahrheitsbeleg | Konventions- und Koordinationsfragen (dort entscheidet Verbreitung wirklich) |
| Ad ignorantiam | „Nicht widerlegt, also wahr" | Geschlossene Suche: Ausbleiben von Evidenz, wo sie auftauchen müsste, ist Evidenz |
| Zirkelschluss (petitio principii) | Konklusion steckt (umformuliert) in den Prämissen; im Graph: Zyklus | Explikation: Entfalten dessen, was ein akzeptierter Begriff enthält |
| Post hoc / falsche Kausalität | Zeitfolge oder Korrelation wird als Ursache gelesen | Kausalschluss mit Mechanismus, Design oder Konfounder-Kontrolle |
| Kausale Übervereinfachung | Eine Ursache wird genannt, wo mehrere belegt sind | Bewusste Fokussierung mit genannter Vereinfachung |
| Voreilige Verallgemeinerung | Allaussage aus kleiner/verzerrter Stichprobe | Induktive Verallgemeinerung mit ausgewiesener Reichweite |
| Rosinenpicken | Nur stützende Fälle/Daten ausgewählt (DFG-Leitlinie 12 verbietet genau das) | Exemplarische Auswahl mit offengelegtem Kriterium |
| Dammbruch (slippery slope) | Folgenkette ohne Beleg für die einzelnen Schritte | Folgenkette, deren Mechanismus je Schritt belegt ist |
| Falsches Dilemma | Zwei Optionen, wo mehr existieren | Echte Dichotomie (logisch oder institutionell abschließend) |
| Äquivokation | Tragendes Wort wechselt zwischen Prämissen die Bedeutung | Bewusstes Wortspiel ohne argumentative Last |
| Komposition/Division | Eigenschaft von Teilen aufs Ganze übertragen (oder umgekehrt) | Übertragung bei tatsächlich additiven Eigenschaften |
| Ignoratio elenchi / Ablenkung | Bewiesen wird etwas anderes als das Strittige | Ausdrücklicher, markierter Themenwechsel |
| Komplexe Frage | Frage enthält unakzeptierte Voraussetzung | Frage mit geteilter, akzeptierter Voraussetzung |
| Falsche Analogie | Analogie trägt an genau der entscheidenden Stelle nicht | Analogie mit relevanter, geprüfter Ähnlichkeit |
| Emotionsappell (ad misericordiam/baculum) | Gefühl ersetzt den fehlenden Sachgrund | Emotion **zusätzlich** zum tragfähigen Grund (vgl. Rhetorik-Notiz) |

Die Spalte „legitime Zwillingsform" ist keine Randnotiz, sondern seit Hamblins
Fundamentalkritik (1970) der Kern der Debatte: Die Schulbuchbehandlung der Fehlschlüsse
nannte er „debased, worn-out and dogmatic" — seither gilt, dass fast jedes Muster der
Liste eine vernünftige Verwendung hat ([SEP: Fallacies](https://plato.stanford.edu/entries/fallacies/)).

**Systemfolge:** Die Tabelle taugt als interne Checkliste des Agenten — aber die dritte
Spalte gehört zwingend dazu. Ein Hinweis entsteht nicht, wenn ein Muster **vorliegt**,
sondern wenn seine legitime Zwillingsform **ausscheidet** (kein Mechanismus belegt, Feld
passt nicht, Auswahlkriterium fehlt). Formale Fehlschlüsse und Zyklen sind die einzigen,
die kontextfrei gemeldet werden dürfen.

## 4. Der Fallacy Fork: warum Fehlschluss-Etiketten unfair werden

Boudry, Paglieri und Pigliucci haben das Dilemma zugespitzt: Definiert man Fehlschlüsse
streng als nachweislich ungültige Schlussformen, kommen sie im echten Leben fast nie vor
— Alltagsargumente sind induktiv/präsumtiv gemeint und behaupten gar keine deduktive
Gültigkeit. Weitet man die Definitionen, bis sie reale Argumente treffen, verlieren sie
ihre Unterscheidungskraft und treffen auch vernünftige Heuristiken ([Boudry/Paglieri/
Pigliucci 2015, Argumentation](https://link.springer.com/article/10.1007/s10503-015-9359-1),
[Zusammenfassung](https://platofootnote.wordpress.com/2015/08/31/the-fake-the-flimsy-and-the-fallacious-demarcating-arguments-in-real-life/)).
Ihr Standardbeispiel: Wenn die Verteidigung die Unzuverlässigkeit einer Zeugin aufzeigt,
ist das technisch ein ad hominem — und trotzdem genau das, was Gericht und Jury
berücksichtigen sollen. Dieselbe Richtung aus der Kognitionsforschung: Hahn und Oaksford
zeigen bayesianisch, dass ad ignorantiam, Zirkel und Dammbruch **strukturgleich** mit
allgemein akzeptierten Argumenten sind — ob ein konkretes Exemplar schwach ist, hängt
von Inhaltsgrößen ab (Priors, Evidenzstärke, Aufdeckungswahrscheinlichkeit), nicht von
der Form ([Hahn & Oaksford 2005, Synthese](https://link.springer.com/article/10.1007/s11229-005-5233-2),
[dies. 2007, Psychological Review](https://www.researchgate.net/publication/6199092_The_Rationality_of_Informal_Argumentation_A_Bayesian_Approach_to_Reasoning_Fallacies)).
Fehlschluss-Vorwürfe sind darum in Debatten selbst zum rhetorischen Mittel geworden:
Das Etikett ersetzt die Auseinandersetzung.

**Systemfolge:** Für Onda ist das eine Verfassungsregel: **Der Agent wirft keine
Fehlschluss-Etiketten.** Ein logik-Hinweis sagt nie „das ist ein ad hominem", sondern
benennt die unbeantwortete kritische Frage („die Einwände von X werden über Xs Person
zurückgewiesen — bleibt Xs Sachargument damit unbeantwortet?"). Das ist zugleich die
faire Form (der Autor kann die Zwillingsform geltend machen) und die robuste (das Modell
muss keine unsichere Feinklassifikation treffen, vgl. Abschnitt 9).

## 5. Pragma-Dialektik: Fehlschlüsse als Regelverstöße im Verfahren

Frans van Eemeren und Rob Grootendorst (Amsterdamer Schule) modellieren Argumentation
als **kritische Diskussion** in vier Phasen (Konfrontation, Eröffnung, Argumentation,
Abschluss) mit zehn Verfahrensregeln; ein Fehlschluss ist jeder Zug, der eine Regel
verletzt und damit die vernünftige Auflösung der Meinungsverschiedenheit entgleisen
lässt ([van Eemeren/Grootendorst, Überblick](https://www.ditext.com/eemeren/pd.html),
[Fallacies in pragma-dialectical perspective, Argumentation 1987](https://link.springer.com/article/10.1007/BF00136779)).
Die Regeln in Kurzform: (1) Freiheitsregel — niemand hindert den anderen am Vorbringen
oder Bezweifeln von Standpunkten (Verstöße: Drohung, Mitleidsappell, persönlicher
Angriff); (2) Beweislastregel — wer behauptet, muss auf Verlangen verteidigen (Verstoß:
Beweislast umkehren); (3) Standpunktregel — angegriffen wird die tatsächlich vertretene
Position (Verstoß: Strohmann); (4) Relevanzregel — verteidigt wird mit einschlägiger
Argumentation (Verstöße: Ablenkung, reine Appelle); (5) Regel der unausgesprochenen
Prämissen — implizite Prämissen fair rekonstruieren, eigene nicht verleugnen;
(6) Ausgangspunktregel — nichts als geteilte Prämisse ausgeben, was nicht geteilt ist
(Verstöße: komplexe Frage, Zirkel); (7) Schema-Regel — Argumentationsschemata korrekt
anwenden (Verstöße: voreilige Verallgemeinerung, falsche Analogie, post hoc, Dammbruch);
(8) Logikregel — logisch gültig oder durch Explizierung validierbar; (9) Abschlussregel
— gescheiterte Verteidigung heißt zurückziehen, gelungene heißt Zweifel aufgeben;
(10) Sprachgebrauchsregel — klar formulieren, wohlwollend interpretieren. Wichtig ist
der konditionale Charakter: Ob ein Zug ein Verstoß ist, hängt an der Rekonstruktion des
Diskussionskontexts — die Identifikation ist immer eine begründungspflichtige Deutung.

**Systemfolge:** Die zehn Regeln sind Ondas beste Grundlage für **Fairness gegenüber
Gegenpositionen im Text**: Standpunktregel und Prämissenregel geben dem Agenten das
Prüfmuster „wird die zitierte Gegenposition so wiedergegeben, dass ihre Vertreter
zustimmen würden?" — das deckt sich mit der gebauten Deliberations-Regel, dass der
stärkste Einwand wortgleich aus belegtem Gegenmaterial stammt. Und die Abschlussregel
liefert das Kriterium für „unbeantwortetes Gegenargument": Ein `counters` ohne
Autorenantwort ist kein kosmetisches Defizit, sondern ein offener Zug im Verfahren.

## 6. Argumentqualität empirisch: was überzeugt vs. was normativ gut ist

Die Wirkungsforschung zeigt: Normativ gute und persuasiv erfolgreiche Argumentation
fallen weniger auseinander, als der Zynismus vermutet. Daniel O'Keefe hat in
Meta-Analysen geprüft, ob normkonforme Züge Überzeugungskraft kosten — Ergebnis:
explizite Standpunkte und explizit ausgewiesene Belege überzeugen **besser**, und
zweiseitige Botschaften schlagen einseitige genau dann, wenn sie die Gegenargumente
auch **widerlegen** (nicht bloß erwähnen — nicht-widerlegende Zweiseitigkeit ist sogar
leicht unterlegen) ([O'Keefe, Normatively-good practice and persuasive success](https://link.springer.com/chapter/10.1007/978-94-007-1078-8_24),
[Meta-Analyse ein-/zweiseitige Botschaften](http://www.communicationcache.com/uploads/1/0/8/8/10887248/meta-analysis_comparing_the_persuasiveness_of_one-sided_and_two-sided_messages.pdf)).
Bei Evidenztypen ist der Befund über 14 Experimente: statistische und kausale Evidenz
überzeugen meist stärker als anekdotische — die normativ schwächste Form ist also auch
empirisch selten die stärkste ([Hornikx 2005, Review](https://repository.ubn.ru.nl/handle/2066/40979)).
Die wichtigste Gegenkraft sitzt im Autor selbst: Nach Mercier und Sperber ist Schließen
evolutionär fürs **Argumentieren** gebaut, nicht fürs Wahrheitsfinden — daher der
robuste Myside-Bias: Menschen produzieren mühelos Gründe für die eigene Position und
prüfen fremde strenger als eigene; gut wird Denken erst im Wechselspiel mit echter
Kritik ([Mercier & Sperber 2011, BBS](https://www.dan.sperber.fr/wp-content/uploads/2009/10/MercierSperberWhydohumansreason.pdf)).
Für die maschinelle Bewertung hat Wachsmuth u. a. die normativen Traditionen in eine
Taxonomie mit drei Hauptdimensionen überführt: logische Qualität (Cogency: akzeptable,
relevante, hinreichende Prämissen), rhetorische (Effectiveness) und dialektische
(Reasonableness — Beitrag zur Auflösung der Streitfrage), wobei die Ebenen aufeinander
aufbauen ([Wachsmuth et al. 2017, EACL](https://aclanthology.org/E17-1017/)).

**Systemfolge:** Drei Übernahmen. Erstens das Verkaufsargument an den Autor: Der Agent
kann logik-Hinweise wirkungsseitig begründen — das widerlegte Gegenargument macht den
Text nachweislich **überzeugender**, nicht nur korrekter (Brücke zur wirkung-Hinweisart).
Zweitens ist der Myside-Bias die Existenzbegründung des Deliberations-Moduls: Der Autor
kann die Gegenprüfung strukturell nicht selbst leisten; genau dafür gibt es den
belegten stärksten Einwand. Drittens liefert Wachsmuths Cogency-Trias (akzeptabel /
relevant / hinreichend) die sauberste interne Dreiteilung für logik-Befunde: Welche
Prämisse ist strittig? Welche trägt nichts bei? Wo reichen die Prämissen zusammen nicht?

## 7. Beweislast, Vermutung, Hedging

Wer behauptet, trägt die Beweislast — aber nicht jede Behauptung dieselbe. Walton
unterscheidet die **Behauptungslast** (wer einen Standpunkt vorbringt, muss ihn auf
Verlangen verteidigen — identisch mit pragma-dialektischer Regel 2), den **Beweisstandard**
(wie viel Stützung „genug" ist — feld- und dialogabhängig, von „plausibel" bis „jenseits
vernünftigen Zweifels") und die **Vermutung** (presumption): eine Aussage, die mangels
Gegenevidenz vorläufig gilt und die Last dem Gegner zuschiebt ([Walton, Burden of Proof,
Presumption and Argumentation, Cambridge 2014](https://www.cambridge.org/core/books/burden-of-proof-presumption-and-argumentation/7A0CE6323BD75D5B6AB44DFEA4A88594)).
Hedging ist in diesem Rahmen kein Stilphänomen, sondern **Beweislast-Management**: Der
Toulmin-Qualifier senkt die Behauptungsstärke und damit die Last, die der Text tragen
muss — ein „vermutlich" verpflichtet zu weniger als ein „ist". Daraus folgen zwei
symmetrische Fehler: **Übertreibung** (die Formulierung verlangt mehr Last, als die
Belege tragen) und **unverdiente Immunisierung** (so viel Hedging, dass die Aussage
unwiderlegbar und damit leer wird). Die empirische Seite (Hedging-Dichte im
Wissenschaftsdeutschen, Kausalsprache vs. Studiendesign) steht in der
[Wissenschafts-Notiz, Abschnitt 4](2026-08-05-handwerk-wissenschaftliches-schreiben.md)
und wird hier nicht wiederholt.

**Systemfolge:** Der Claim-Ledger führt „erlaubte Formulierungsstärke" bereits als
Attribut — die Argumentationslehre liefert die fehlende Gegenrichtung: Auch **zu
schwache** Formulierung bei starker Beleglage ist ein Befund (unmotivierte Vagheit,
Immunisierung), nicht nur zu starke. Und Beweislast gehört an die Relation: Bei einem
`counters` sollte das System wissen, wessen Zug aussteht — muss der Autor antworten
(sein Claim ist angegriffen und war stark formuliert), oder trägt die Gegenseite die
Last (der Einwand ist selbst unbelegt)? Das ist dieselbe Unterscheidung, die Waltons
kritische Fragen mitbringen (Abschnitt 2).

## 8. Deutsche Argumentationsanalyse: Kienpointner und Bayer

Die deutschsprachige Forschung liefert das Gegenstück zu Walton mit anderem Akzent.
Manfred Kienpointners „Alltagslogik" (1992) baut aus einem Korpus von rund 300
argumentativen Textpassagen (überwiegend deutschsprachig) eine Typologie von **etwa 60
Klassen von Alltags-Argumentationsmustern**, klassifiziert nach den semantischen
Relationen (Topoi), die den Übergang von Prämissen zur Konklusion rechtfertigen — in der
Tradition der aristotelischen Topik und von Perelman/Olbrechts-Tyteca, mit einer
modifizierten Fassung des Toulmin-Schemas als Grundgerüst ([Verlagsseite
frommann-holzboog](https://www.frommann-holzboog.de/reihen/71/710012610?lang=de),
[PhilPapers](https://philpapers.org/rec/KIEASU)). Seine Hauptgliederung unterscheidet
Muster, die eine Schlussregel **benützen** (Einordnung, Vergleich, Gegensatz,
Kausalität), Muster, die eine Schlussregel erst **etablieren** (induktive
Beispielargumentation), und Muster, die keines von beidem tun (illustratives Beispiel,
Analogie, Autorität). Der Wert für Onda: Die Muster sind an **deutschem** Sprachmaterial
entwickelt — die Indikatoren (Konnektoren, Formulierungsroutinen) passen direkt auf
Jakobs Texte. Klaus Bayers Studienbuch „Argument und Argumentation" (2., überarb.
Auflage 2007) ist die didaktische Referenz fürs Handwerkliche: Rekonstruktion von
Argumenten in Standardform, Explizierung impliziter Prämissen, elementare Logik der
deduktiven und induktiven Formen und Leitfragen für die Analyse ganzer Beispieltexte
([Verlagsseite V&R](https://www.vandenhoeck-ruprecht-verlage.com/themen-entdecken/literatur-sprach-und-kulturwissenschaften/germanistik/germanistische-linguistik/3027/argument-und-argumentation),
[Inhaltsverzeichnis DNB](https://d-nb.info/982129319/04)). Bemerkenswert an Bayer:
Er behandelt Intuition, Analogie und Assoziation nicht als Feinde der Argumentation,
sondern als deren kognitive Voraussetzung mit eigenen Schwächen.

**Systemfolge:** Wenn Onda eine Schema-Bibliothek bekommt (Abschnitt 10c), sollte ihre
Obermenge Kienpointners Gliederung folgen (Einordnung/Vergleich/Gegensatz/Kausal +
Beispiel/Analogie/Autorität), nicht Waltons angelsächsischem Katalog — dieselben Muster,
aber mit deutschen Erkennungsindikatoren. Bayers Leitfragen-Ansatz bestätigt das Format
der kritischen Fragen als didaktisch etablierte, nicht nur theoretische Form.

## 9. Was Modelle können: Fehlschluss-Erkennung maschinell

Die beste verfügbare Messung ist das MAFALDA-Benchmark (NAACL 2024): 9.745 Texte, davon
200 von Experten neu annotiert, mit einer vereinheitlichten Taxonomie aus 23
Fehlschlüssen in drei aristotelischen Gruppen (Pathos/Ethos/Logos) und drei
Granularitätsebenen ([Helwe et al. 2024](https://aclanthology.org/2024.naacl-long.270/),
[arXiv](https://arxiv.org/abs/2311.09761)). Die Zahlen sind ernüchternd und lehrreich:
Das beste getestete Modell (GPT-3.5) erreicht F1 0,63 auf Ebene 0 (Fehlschluss ja/nein),
0,20 auf Ebene 1 (Pathos/Ethos/Logos) und 0,14 auf Ebene 2 (konkreter Fehlschluss).
Entscheidend aber: **Menschen erreichen auf Ebene 2 auch nur 0,19** — und 28 % der
annotierten Stellen tragen selbst im Expertengoldstandard mehrere gleichermaßen
vertretbare Etiketten; die Autoren bauen die Subjektivität deshalb explizit ins
Annotationsschema ein („disjunktive Annotation"). Frühere Datensätze berichten
Inter-Annotator-Übereinstimmungen von Krippendorffs α 0,46–0,60 (moderat) bis γ 0,26
(niedrig). Die Feinklassifikation von Fehlschlüssen ist also kein Fähigkeits-, sondern
teilweise ein **Aufgabenproblem**: Die Kategorien selbst sind unscharf — empirische
Bestätigung des Fallacy Fork von der Datenseite. Neuere Modelle sind besser als GPT-3.5,
aber der strukturelle Befund (grob geht, fein ist strittig) bleibt.

**Systemfolge:** Onda sollte vom Modell nie eine Ebene-2-Leistung verlangen. Die
tragfähige Arbeitsteilung: Das Modell erkennt, **dass** ein Schritt schwach ist, und
beschreibt **warum** in Klartext (unbeantwortete kritische Frage, fehlender Beleg für
einen Kettenschritt) — das ist Ebene-0/1-Leistung plus Begründung, die Evals wie ARG-04
bereits messen. Die Benennung des klassischen Musters ist höchstens einklappbarer
Bildungshintergrund („dieses Muster heißt traditionell …, gilt aber nicht immer als
Fehler"), nie der Befund selbst. Und: Ondas deterministische Prüfungen (Zyklen im
Graph, Zitat-gegen-Original, Belegstatus) sind genau die Fälle, in denen das System
zuverlässiger ist als jedes Sprachmodell — die Arbeitsteilung Regel-Engine für das
Harte, Modell für das Deutbare ist auch hier richtig.

## 10. Implikationen für Onda

### a) Zehn Waltonsche kritische Fragen als konkrete Hinweise

Format: Schema → kritische Frage → Hinweis (Hinweisart), formuliert wie ein Onda-Hinweis.

1. **Expertenmeinung → Feldfrage** (methode): „Die zitierte Autorität ist für X
   ausgewiesen; die gestützte Aussage liegt aber im Feld Y. Trägt die Expertise so weit?"
2. **Expertenmeinung → Konsistenzfrage** (methode): „Zu dieser Aussage gibt es laut
   Projektquellen abweichende Fachmeinungen — der Text erwähnt nur die stützende."
3. **Beispiel/Verallgemeinerung → Stichprobenfrage** (methode): „Aus zwei Fällen wird
   eine Aussage über alle. Was rechtfertigt die Reichweite — und wäre ‚viele' ehrlicher?"
4. **Kausalschema → Alternativerklärung** (methode): „A und B treten gemeinsam auf; der
   Text schließt auf Ursache. Wäre eine gemeinsame dritte Ursache ausgeschlossen?"
5. **Konsequenzargument → Gegenfolgen** (logik): „Der Vorschlag wird nur mit seinen
   positiven Folgen begründet. Welche negativen Folgen müsste der Text abwägen?"
6. **Konsequenzargument → Eintrittswahrscheinlichkeit** (methode): „Wie wahrscheinlich
   ist die genannte Folge — und welcher Beleg stützt diese Wahrscheinlichkeit?"
7. **Analogie → Unterschiedsfrage** (logik): „Der Schluss überträgt von A auf B. An der
   entscheidenden Stelle (…) unterscheiden sich A und B aber — trägt die Analogie dort?"
8. **Dammbruch → Kettenfrage** (logik): „Zwischen Schritt 1 und dem Endszenario liegen
   drei unbelegte Zwischenschritte. Welcher Mechanismus treibt die Kette?"
9. **Zeichen/Indiz → Mehrdeutigkeit** (methode): „Das angeführte Indiz ist auch mit der
   Gegenthese vereinbar. Was macht die eigene Lesart wahrscheinlicher?"
10. **Verpflichtung/Konsistenz → Widerspruchsfrage** (logik): „In Abschnitt 2 setzt der
    Text …, hier das Gegenteil. Welche der beiden Setzungen gilt?" (im Graph: die beiden
    Claims plus Pfad anzeigen)

Jeder dieser Hinweise nennt Stelle, Prüffrage und Beweislast-Richtung — und keiner
braucht ein Fehlschluss-Etikett.

### b) Was ein Modell zuverlässig erkennt — und was nicht (Fallacy-Fork-Warnung)

**Zuverlässig, weil deterministisch oder gegen Material prüfbar (Onda hat die
Infrastruktur):** Zirkel (Zyklus im Argument-Graph — gebaut); Widerspruch zwischen
atomaren Claims; Strohmann gegenüber **zitierten** Positionen (Wiedergabe gegen
Fundstelle — Zitationsaudit); Rosinenpicken gegen die Projektquellen (Gegenbelege im
Belegbündel vorhanden, im Text unerwähnt); Reichweiten-Übertreibung (Formulierungsstärke
gegen erlaubte Stärke im Claim-Ledger); formale Fehler in explizit konditionaler Rede.

**Brauchbar mit Modell-Urteil, aber als Frage zu formulieren:** falsches Dilemma,
voreilige Verallgemeinerung (wenn Zahlen im Text stehen), kausale Übervereinfachung,
unbelegte Dammbruch-Ketten, Ablenkung vom Strittigen.

**Kontextabhängig — nie als Fehler behaupten, höchstens als Prüffrage (Fallacy Fork):**
ad hominem (Quellenkritik ist legitim), Autoritätsargument (Expertenmeinung ist ein
gutes Schema), ad ignorantiam (geschlossene Suche ist Evidenz), Emotionsappelle
(genrelegitim, siehe d), ad populum (bei Konventionsfragen korrekt), Dammbruch mit
teilbelegter Kette. Hier gilt: Das Modell darf die kritische Frage stellen, aber die
Antwort „das ist trotzdem in Ordnung" muss als Autorenentscheidung ohne Risikoannahme
möglich sein, wenn der Belegmaßstab der Textsorte weich ist.

### c) Folgen für das Argument-Modul

- **Die fünf Relationstypen reichen strukturell.** Toulmin bildet sich ab: Data→Claim =
  `supports`, Rebuttal = `counters`/`qualifies`, Backing = `supports` auf die
  Warrant-Ebene, Definition = `explains`, Abhängigkeit = `depends-on`. Kein neuer
  Relationstyp nötig — der Warrant lebt korrekt als Feld an der Kante, nicht als Knoten.
- **Was fehlt, ist eine Schema-Bibliothek:** ein optionales Attribut `scheme` an
  `supports`-Relationen (Werte etwa: einordnung, vergleich, gegensatz, kausal, beispiel,
  analogie, autoritaet, konsequenz, zeichen, dammbruch — Kienpointners Obermenge,
  10–15 Einträge, kuratiert statt vollständig), plus je Schema 2–4 kritische Fragen als
  Daten, nicht als Prompt-Prosa. Die Projektion vergibt das Attribut nur bei eindeutigen
  Indikatoren (bestehende Konservativitätsregel); die Deliberation nutzt die kritischen
  Fragen des Schemas als Kandidaten für den stärksten Einwand und für substanziell
  verschiedene Wege (verschiedene Schemata = verschiedene Belegstrategien — das Kriterium
  existiert schon).
- **Beweislast an die Relation:** Ein `counters` sollte tragen, wessen Antwort aussteht
  (Autor vs. Einwand selbst unbelegt). Das präzisiert die bestehende Regel „faire belegte
  Gegenargumente" und gibt dem Schlussaudit ein sauberes Kriterium für „unbeantwortetes
  Gegenargument".
- **Symmetrisches Stärke-Audit:** Der Abgleich Formulierungsstärke ↔ Beleglage sollte in
  beide Richtungen melden (Übertreibung und Immunisierung durch Über-Hedging).

### d) Textsorten-Abhängigkeit

Die Pragma-Dialektik macht den entscheidenden Punkt: Ein Fehlschluss ist ein Verstoß
gegen die Regeln einer **kritischen Diskussion** — aber nicht jeder Text ist eine.
Ein Paper verpflichtet sich dem Verfahren vollständig (logik/methode hart, Verwerfen
nur mit Risikoannahme — deckt sich mit der Wissenschafts-Notiz). Der Essay verfolgt
Erkenntnis durch Bewegung: Sprünge sind legitim, wenn sie tragen; die Prüffrage ist
„trägt der Sprung?", nicht „fehlt die Beweiskette?" (Essay-Notiz, Belegmaßstab „je nach
Essay"). Kolumne und Marketing sind gar keine kritischen Diskussionen: Einseitigkeit,
Zuspitzung und Emotionsappell sind dort Genre-Konvention, kein Regelverstoß — die
O'Keefe-Befunde zeigen sogar, dass Einseitigkeit beim zustimmenden Publikum wirksamer
ist. Unverhandelbar bleiben über alle Textsorten dieselben drei Dinge wie in der
Essay-Notiz: wörtliche Zitate stimmen, prüfbare Fakten sind nicht erfunden, und
zitierte reale Personen werden nicht per Strohmann entstellt. Alles andere skaliert
mit dem Belegmaßstab: Derselbe Befund ist im Paper ein harter methode-Hinweis, in der
Kolumne allenfalls eine wirkung-Beobachtung („diese Zuspitzung kostet bei kritischen
Lesern Glaubwürdigkeit") — dafür ist das gebaute Fairness-Modul
(`effect-fairness.mjs`) der richtige Ort, nicht die logik-Hinweisart.

### e) Offene Fragen an Jakob

1. **Etiketten zeigen oder nicht?** Vorschlag dieser Notiz: Hinweise nennen nur die
   Prüffrage; der traditionelle Name („Dammbruchargument") erscheint höchstens
   einklappbar als Hintergrund. Will Jakob den Lerneffekt der klassischen Namen — oder
   stören sie den ruhigen Ton?
2. **Schema-Bibliothek:** Reichen 10–15 kuratierte Schemata mit je 2–4 kritischen
   Fragen (Wartung überschaubar), oder soll die Bibliothek erweiterbar sein — und wer
   pflegt sie dann?
3. **Herabstufung statt Abschaltung?** Soll bei weichem Belegmaßstab (Marketing,
   Kolumne) ein logik-Befund automatisch als wirkung/fairness-Beobachtung erscheinen —
   oder als logik-Hinweis mit niedrigem Gewicht bleiben, damit die Hinweisart ehrlich
   bleibt?
4. **Beweislast sichtbar machen?** Soll das Argumentationsdossier je Claim anzeigen,
   wessen Zug aussteht (Autor muss nachliefern vs. Einwand müsste erst belegt werden)?
   Das wäre neu in der UI, folgt aber direkt aus dem Modell.
5. **Unbeantwortete Gegenargumente im Schlussaudit:** Soll ein `counters` ohne
   Autorenantwort bei hartem Belegmaßstab als offener logik-Befund zählen (analog zur
   Abschlussregel der Pragma-Dialektik) — mit derselben Risikoannahme-Mechanik wie
   andere Integritätshinweise?
