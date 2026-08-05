# Forschungsnotiz: Handwerk der Prosa und des kreativen Erzählens

> Stand: 2026-08-05. Fokus: Szene und Zusammenfassung, Zeigen und Erzählen, Perspektive und Distanz, Figuren, Dialog, Spannungsbögen, Anfang und Ende, Konkretion, Überarbeitung — und die Frage, was ein Prüfwerkzeug bei erfundenen Texten überhaupt anmerken darf. Teil der Recherche-Serie zum Textsorten-Handwerk.

## Kurzfazit

Prosa erfindet, und das ist ihr Zweck. Fast alles, was Onda bei Sach- und Wissenschaftstexten prüft — Belege, Quellen, Methoden — ist hier eine Kategorienverwechslung: Fiktionale Sätze behaupten nichts über die wirkliche Welt und können darum an ihr weder wahr noch falsch sein. Was bleibt, ist ein anderes, ebenso strenges Kriterium: innere Stimmigkeit. Die Handwerksliteratur von Forster bis Le Guin und die deutschsprachige Erzähltheorie von Käte Hamburger bis Stanzel beschreiben erstaunlich einheitlich, woran erzählende Texte tatsächlich scheitern — an gebrochenen Perspektiven, verschenktem Tempo, uneingelösten Versprechen, behaupteten statt erfahrbaren Figuren und an Abstraktion, wo ein Detail stehen müsste.

Für den Agenten heißt das: Er wird bei Prosa vom Faktenprüfer zum Werkstattleser. Sein wertvollster Beitrag ist die genaue Beschreibung dessen, was der Text bei einem aufmerksamen Leser tut — wo der Traum reißt und warum —, nicht die Durchsetzung von Regeln, die als Faustformeln entstanden und als Dogmen falsch sind.

## 1. Fiktionalität: was Prosa ihrem Publikum schuldet

Käte Hamburger hat 1957 in der *Logik der Dichtung* gezeigt, dass Fiktionalität an der Sprache selbst ablesbar ist: Das epische Präteritum verliert seine Vergangenheitsfunktion („Morgen war Weihnachten"), und erlebte Rede sowie Verben der Innensicht in der dritten Person sind Signale, die es außerhalb der Fiktion nicht plausibel gibt ([Episches Präteritum](https://de.wikipedia.org/wiki/Episches_Pr%C3%A4teritum), [Einladung zur Literaturwissenschaft: Hamburger](https://www.einladung-zur-literaturwissenschaft.de/index2208.html?option=com_content&view=article&id=244%3Apersonen-hamburger&catid=40%3Akapitel-5&Itemid=55)). Ein fiktionaler Satz ist damit kein misslungener Tatsachenbericht; er gehört einer eigenen Aussagelogik an.

Wahrhaftigkeit verschwindet dadurch nicht, sie wandert nach innen. Christa Wolf nennt das in *Lesen und Schreiben* (1968) „subjektive Authentizität": auf Grundlage eigener Erfahrung wahrheitsgetreu erfinden — die Bindung an genaue, konkrete Erfahrung ersetzt die Bindung an Belege ([Springer-Handbuchkapitel zu „Lesen und Schreiben"](https://link.springer.com/chapter/10.1007/978-3-476-05368-8_16), [Aufsatz zur Poetik der subjektiven Authentizität](https://ojs.tnkul.pl/index.php/rh/article/download/5766/5560)).

Eine Grenze bleibt: Wo Prosa erkennbar in der wirklichen Welt spielt, können reale Anker falsch sein. Der New Yorker prüft deshalb auch Kurzgeschichten — der Leiter der Prüfabteilung nennt als Beispiel eine falsche Uhrzeit des 11. September: Für Leser, die es wissen, „bricht die Maschine". Entscheidend ist aber seine zweite Aussage: Bei Fiktion liegt die Entscheidung vollständig beim Autor; die Prüfung macht Vorschläge und respektiert die künstlerische Autonomie ([McIntosh im NYRB-Gespräch](https://www.nybooks.com/online/2025/03/25/one-wonders-fergus-mcintosh/)).

**Systemfolge:** Die Setzung in `app/src/textart-regeln.mjs` — Prosa behält nur `logik` als Integritätsfrage — ist durch die Theorie gedeckt und bekommt hier ihre Begründung: `fakt`, `quelle` und `methode` prüfen eine Aussagelogik, die Prosa nicht verwendet. Reale Weltanker in erkennbar realistischer Prosa dürfen als Angebot erscheinen, nie als Forderung; das Verwerfen ist dort keine Risikoannahme.

## 2. Der lebendige, ununterbrochene Traum

John Gardners *The Art of Fiction* liefert das Meisterkriterium, an dem sich fast alle Einzelhandwerke messen lassen: Erzählende Prosa erzeugt im Leser einen „vivid and continuous dream". Lebendig muss er sein, weil unklare Figuren, Orte und Absichten die emotionale Beteiligung blockieren; ununterbrochen, weil jede Störung die Kraft der Handlung mindert. Was den Traum unterbricht, ist präzise benennbar: unfreiwillige Reime, inkonsistente Diktion, überladene Sätze, unmotivierte Sprünge der psychischen Distanz ([The Craft of Fiction zu Gardners Traum](https://medium.com/the-craft-of-fiction/the-vivid-and-continuous-dream-ffefb617fbb4), [Kirkus zu *The Art of Fiction*](https://www.kirkusreviews.com/book-reviews/john-gardner/the-art-of-fiction/)).

Das ist für ein Prüfwerkzeug der entscheidende Perspektivwechsel: Der Maßstab ist nicht eine Norm, sondern eine Leseerfahrung. Eine Formulierung ist in Prosa nicht falsch, weil sie gegen eine Stilregel verstößt, sondern weil sie an dieser Stelle aus dem Traum wirft — und dieselbe Formulierung kann drei Seiten später genau richtig sein.

**Systemfolge:** Ein Prosa-Hinweis sollte, wo immer möglich, als Traum-Unterbrechung formuliert sein: Stelle, was dort passiert, warum ein Leser herausfällt. „Hier verlässt der Satz die Stimme, die der Absatz aufgebaut hat" ist ein Prosa-Hinweis; „Passiv vermeiden" ist keiner.

## 3. Szene und Zusammenfassung: die Bewirtschaftung der Zeit

Die Erzähltheorie seit Genette beschreibt das Verhältnis von Erzählzeit und erzählter Zeit als Grundentscheidung des Erzählens: Szene (Zeit deckt sich annähernd, oft mit Dialog), Raffung, Pause und Ellipse sind die Gangarten, zwischen denen jeder Erzähltext ständig wechselt ([Grundkurs Erzähltheorie, Universität Kiel](https://www.litwiss-online.uni-kiel.de/grundkurs/grundkurs-literaturwissenschaft/grundkurs-erzaehltheorie/)). Ursula K. Le Guin übersetzt dieselbe Entscheidung in Werkstattsprache: „crowding" verdichtet Wahrnehmung und dehnt den Moment, „leaping" überspringt, was die Geschichte nicht braucht — und was man auslässt, ist unendlich mehr als das, was stehen bleibt ([*Steering the Craft*](https://en.wikipedia.org/wiki/Steering_the_Craft), [Andrew Wille zur Werkstattfassung](https://wille.org/2014/09/19/steering-the-craft-by-ursula-le-guin/)).

Der typische Anfängerfehler ist keine falsche Einzelstelle, sondern eine falsche Verteilung: Wendepunkte, die als Bericht abgehandelt werden, während Belangloses szenisch ausgebreitet wird. Das ist zugleich einer der wenigen Befunde, die ein Zweitleser zuverlässiger sieht als der Autor, der die Szene im Kopf ohnehin vollständig hat.

**Systemfolge:** `struktur` bedeutet in Prosa vor allem Tempo-Ökonomie. Eine gute Strukturbeobachtung benennt das Verhältnis: „Die Entscheidung, auf die drei Szenen zulaufen, steht in einem Satz Raffung — gewollt?" Sie schreibt nie vor, welches Tempo richtig ist; auch die ausgelassene Szene kann die stärkste Form sein.

## 4. Zeigen und Erzählen: eine Faustregel und ihre Grenzen

„Show, don't tell" ist jünger und wackliger, als sein Regelstatus suggeriert. Die Formel stammt aus der angloamerikanischen Dramaturgie- und Romanpoetik der 1910er/20er Jahre — der Dramatiker Mark Swan benutzte sie, Percy Lubbock machte die Unterscheidung 1921 in *The Craft of Fiction* einflussreich und wertete das „Zeigen" ästhetisch auf ([Show, don't tell](https://en.wikipedia.org/wiki/Show,_don%27t_tell), [Percy Lubbock](https://en.wikipedia.org/wiki/Percy_Lubbock)). Das oft zitierte Tschechow-Wort ist eine Zuspitzung aus einem echten Brief von 1886: Statt zu schreiben, dass der Mond schien, lieber den Lichtglanz auf einer Glasscherbe zeigen — ein Rat zur Naturbeschreibung, keine Universalregel ([ebd.](https://en.wikipedia.org/wiki/Show,_don%27t_tell)).

Die wichtigste Korrektur kam 1961 von Wayne C. Booth: Auch Zeigen ist eine Autorenentscheidung, Erzählen kann die stärkere und interessantere Form sein, und die Dogmatisierung der Faustregel wertet die großen Erzähler des 18. und 19. Jahrhunderts ab ([*The Rhetoric of Fiction*, Überblick](https://literariness.org/2017/02/24/key-theories-of-wayne-c-booth/)). Die brauchbare Restform der Regel ist lokal: Wo eine Szene ein Gefühl bereits erfahrbar macht, ist die zusätzliche Behauptung („sie war wütend") eine Doppelung; wo gar keine Szene da ist, kann die Behauptung leer bleiben — oder genau die richtige Raffung sein.

**Systemfolge:** Der Agent darf „zeig das lieber" nie als Regel aussprechen. Die zulässige Beobachtung ist die Doppelungs- oder Leerstellenfrage an einer konkreten Stelle — als `wirkung`-Hypothese mit sichtbarer Begründung, warum die Stelle so oder so gemeint sein könnte.

## 5. Erzählperspektive und Distanz

Die deutschsprachige Tradition hat hier das feinste Instrumentarium. Stanzels Typenkreis unterscheidet auktoriale, personale und Ich-Erzählsituation mit fließenden Übergängen ([Typologisches Modell der Erzählsituationen](https://de.wikipedia.org/wiki/Typologisches_Modell_der_Erz%C3%A4hlsituationen)); Genette trennt schärfer, wer spricht und wer wahrnimmt, und fasst Letzteres als Fokalisierung ([Fokalisierung nach Genette](https://wortwuchs.net/fokalisierung/)). Gardner ergänzt die Werkstattgröße der psychischen Distanz: die stufenlose Skala zwischen „Es war der Winter 1853" und der wortlosen Innensicht — Fehler sind nicht ferne oder nahe Positionen, sondern unmotivierte Sprünge ([Gardner-Handout zur psychic distance](https://teachingpwr.files.wordpress.com/2015/04/psychic-distance-handout-1.pdf)).

Das Scharnier beider Traditionen ist die erlebte Rede (englisch free indirect style): Figurenstimme und Erzählerbericht in einem Satz. Für Hamburger ist sie ein Fiktionalitätssignal ([s. o.](https://de.wikipedia.org/wiki/Episches_Pr%C3%A4teritum)); für James Wood ist sie das zentrale Kunstmittel des modernen Romans, weil sie Allwissenheit und Parteilichkeit zugleich bewohnt — und weil man sie leicht verdirbt, wenn Erzählerwissen in eine Figurnwahrnehmung sickert, die es nicht haben kann ([Slate zu *How Fiction Works*](https://slate.com/culture/2008/07/james-wood-s-how-fiction-works.html)).

Daraus folgt eine der wenigen quasi-objektiven Prüfungen an Prosa: der unbeabsichtigte Perspektivbruch. Eine personal erzählte Szene, die plötzlich weiß, was hinter der Tür geschieht; ein Kapitel, das ohne Signal den Kopf wechselt. „Quasi", weil die auktoriale Tradition Wechsel ausdrücklich erlaubt — der Bruch ist nur dann einer, wenn er nicht zur etablierten Erzählinstanz des Textes passt.

**Systemfolge:** Perspektivbrüche gehören zu `logik` im Prosa-Sinn: innere Stimmigkeit der Erzählinstanz. Der Hinweis muss die etablierte Perspektive benennen, die Bruchstelle zitieren und die Absichtsfrage offen lassen. Das Projektverständnis sollte bei Prosa die gewählte Erzählsituation als korrigierbare Annahme führen — sonst prüft der Agent gegen eine Konvention statt gegen den Text.

## 6. Figuren: Überraschung, Wollen, Konsequenz

E. M. Forsters Unterscheidung von flachen und runden Figuren (*Aspects of the Novel*, 1927) ist bis heute Standard — samt seines Tests: Eine runde Figur kann auf überzeugende Weise überraschen; wer nie überrascht, ist flach ([Aspects of the Novel, Überblick](https://www.encyclopedia.com/arts/culture-magazines/aspects-novel)). Entscheidend ist Forsters oft überlesene Pointe: Flache Figuren sind kein Fehler — bei Dickens tragen sie ganze Romane; falsch ist nur die flache Figur an einer Stelle, die eine runde verlangt. Kurt Vonneguts Werkstattregel ergänzt den Motor: Jede Figur soll etwas wollen, und sei es nur ein Glas Wasser ([Vonneguts acht Regeln](https://www.writingclasses.com/toolbox/tips-masters/kurt-vonnegut-8-basics-of-creative-writing)) — eine Szene ohne erkennbares Wollen hat keinen Grund, Szene zu sein.

Der dritte Prüfstein ist Konsequenz: Handelt die Figur aus dem heraus, was der Text über sie aufgebaut hat, oder weil der Plot es gerade braucht? Das ist der klassische Fall innerer Unstimmigkeit — die erfundene Welt bricht an ihrer eigenen Logik, nicht an der wirklichen.

**Systemfolge:** Figurenhinweise verteilen sich auf zwei Arten: Motivations- und Konsequenzbrüche auf `logik` (Integritätsfrage), behauptete statt erfahrbare Figuren auf `wirkung` (Hypothese). Forsters Test taugt als Prüffrage, nie als Soll: Der Agent darf keine „Charaktertiefe" einfordern, wo eine Funktion gewollt flach ist.

## 7. Dialog: mehrere Dinge zugleich

Elizabeth Bowens *Notes on Writing a Novel* (1945) enthält den bis heute zitierten Maßstab: Dialog muss mehr als eine Sache zugleich tun — Situation kristallisieren, Figur zeigen, Handlung vorantreiben; was nur eines davon leistet, ist zu träge für Fiktion ([Notes on Writing a Novel](https://www.narrativemagazine.com/issues/fall-2006/classics/notes-writing-novel-elizabeth-bowen), [Zusammenfassung der Dialogregeln](https://www.writerswrite.co.za/elizabeth-bowens-7-tips-for-writing-dialogue/)). Gelungener Dialog ist dabei gerade nicht transkribierte Wirklichkeit: Er ist verdichtete, absichtsvolle Rede, die natürlich klingt. Stephen King ergänzt die Oberflächenregeln: Redebegleitung schlicht halten („sagte"), Adverbien in Zuschreibungen streichen — die Emotion gehört in die Replik, nicht ins Etikett ([Auszüge aus *On Writing*](https://signalvnoise.com/posts/322-excerpts-from-stephen-kings-on-writing)).

Für ein deutsches Prüfwerkzeug kommt eine Besonderheit hinzu: Figurenrede ist geschützter Raum. Dialekt, Grammatikbrüche, Registerfehler in wörtlicher Rede sind häufig Charakterzeichnung — eine Normkorrektur dort zerstört das Mittel.

**Systemfolge:** `sprache`-Diagnosen müssen wörtliche Rede als eigene Zone behandeln: Normhinweise dort nur, wenn der Bruch erkennbar unfreiwillig ist (etwa dieselbe Figur mal mit, mal ohne Dialekt — das wiederum ist ein Stimmigkeitsbefund). Die tragfähige Dialogfrage ist Bowens: Was tut diese Replik außer informieren?

## 8. Spannungsbogen, Anfang, Ende: die Ökonomie der Versprechen

Forsters berühmte Unterscheidung trennt Geschichte von Plot durch Kausalität: „The king died and then the queen died" ist Geschichte; stirbt die Königin aus Gram, ist es Plot — die Frage des Lesers wechselt von „und dann?" zu „warum?" ([Aspects of the Novel](https://www.encyclopedia.com/arts/culture-magazines/aspects-novel)). Spannung ist damit kein Effektvorrat, sondern gehaltene Kausalität: offene Fragen, die der Text absichtsvoll offen hält.

Anfang und Ende sind die beiden Enden derselben Ökonomie. Tschechows Gewehr — was in Akt eins an der Wand hängt, muss losgehen, sonst hängt es dort zu Unrecht — beschreibt sie als Versprechenslogik: Jedes betonte Element ist ein Versprechen an den Leser ([Chekhov's gun](https://en.wikipedia.org/wiki/Chekhov%27s_gun), [Britannica](https://www.britannica.com/topic/Chekhovs-gun)). Vonnegut ergänzt für den Einstieg: so nah am Ende beginnen wie möglich, und dem Leser früh so viel Information geben wie möglich — Spannung entsteht nicht aus Vorenthalten, sondern aus Wissen ([Vonneguts Regeln](https://www.writingclasses.com/toolbox/tips-masters/kurt-vonnegut-8-basics-of-creative-writing)). Dass Erzählqualität keine Geschmacksfloskel ist, stützt die Wirkungsforschung: Die Metaanalyse zur narrativen Transportation nennt Erzählqualität und Passung zum Rezipienten als Bedingungen dafür, dass Geschichten überhaupt wirken ([van Laer et al. 2014](https://doi.org/10.1086/673383)).

**Systemfolge:** Die stärkste `struktur`-Prüfung an Prosa ist eine Versprechensbilanz: aufgebaute Erwartungen ohne Einlösung, Auflösungen ohne Aufbau, ein Anfang, der vor der Geschichte beginnt, ein Ende, das nicht aus dem Erzählten folgt. Sie ist als Bilanz zu formulieren, nicht als Bauplan — welche Versprechen ein Text macht, entscheidet der Autor.

## 9. Konkretion und sinnliches Detail

Tschechows Glasscherbe im Mondlicht ([Brief von 1886](https://en.wikipedia.org/wiki/Show,_don%27t_tell)) und James Woods „thisness" — das Detail, das eine Abstraktion mit einem Hauch Greifbarkeit tötet ([How Fiction Works](https://slate.com/culture/2008/07/james-wood-s-how-fiction-works.html)) — beschreiben dieselbe Handwerksgrundlage: Prosa überzeugt durch das genaue, bedeutungstragende Einzelding, nicht durch die zutreffende Verallgemeinerung. Die Kehrseite liefert Hemingways Eisberg-Theorie: Auslassen wirkt nur aus Wissen. Wer weglässt, was er weiß, erzeugt Tiefe; wer weglässt, weil er es nicht weiß, erzeugt hohle Stellen ([Iceberg theory](https://en.wikipedia.org/wiki/Iceberg_theory)).

Das trifft die Befunde der Slop-Recherche an ihrer prosarelevantesten Stelle: Generische Abstraktion und dekorative Vollständigkeit sind genau die Muster, zu denen Sprachmodelle neigen (siehe `2026-07-19-ki-text-slop.md`). Ein Prosa-Prüfwerkzeug, das Konkretion anmahnt, darf aber die Lösung nicht liefern: Ein erfundenes sinnliches Detail des Agenten ist kein Beleg, sondern Fremdmaterial in der erfundenen Welt des Autors — es stammt nicht aus dem Erfahrungsvorrat, aus dem Wolfs „subjektive Authentizität" schöpft.

**Systemfolge:** „Abstrakt, wo ein Detail stehen müsste" ist ein legitimer `wirkung`- oder `sprache`-Hinweis mit Stellenbezug. Der Vorschlagsteil (`bisher`/`neu`) sollte bei fehlenden Details in der Regel leer bleiben: Der Agent kann die Leerstelle zeigen, aber nicht füllen, ohne die Autorschaft der Welt zu verletzen.

## 10. Überarbeitungspraxis: Tür zu, Tür auf

Die Handwerksliteratur trennt Phasen strenger, als es Prüfwerkzeuge tun. Stephen King schreibt die Erstfassung „mit geschlossener Tür" — ohne Publikum, ohne Urteil — und öffnet sie erst für die Überarbeitung; seine Faustformel dafür: zweite Fassung gleich erste minus zehn Prozent ([Auszüge aus *On Writing*](https://signalvnoise.com/posts/322-excerpts-from-stephen-kings-on-writing), [Kings 10-Prozent-Formel](https://www.goodreads.com/author_blog_posts/2088345-2nd-draft-1st-draft---10)). Das Streichen hat die älteste Autorität des Genres: Arthur Quiller-Couch riet 1914, besonders gelungene Stellen zuerst zu verdächtigen — „Murder your darlings" ([Vorlesung „On Style"](https://www.bartleby.com/190/12.html)). Und Hemingways Auslassungsprinzip ist eine Überarbeitungstechnik: Die Kraft einer Endfassung speist sich aus dem gestrichenen Siebenachtel ([Iceberg theory](https://en.wikipedia.org/wiki/Iceberg_theory)).

Die deutschsprachigen Schreibschulen haben für die geöffnete Tür eine eigene Sozialform entwickelt: das Werkstattgespräch, in dem Texte im Kreis gelesen und kritisiert werden — die Lehre am Deutschen Literaturinstitut Leipzig ist über Werkstätten und „Techniken des Erzählens" organisiert ([DLL: Lehre](https://literaturinstitut.de/lehre/)), das Schweizerische Literaturinstitut in Biel arbeitet zusätzlich mit durchgehenden Einzelmentoraten ([Literaturinstitut Biel](https://www.literaturinstitut.ch/)). Der Kern guter Textkritik dort ist beschreibend: dem Autor zeigen, was der Text bei Lesern tut, und Raum lassen — zu explizite Klarheit nimmt dem Leser die eigenen Bilder ([literaturcafe.de zur Textkritik](https://www.literaturcafe.de/rubrik/textkritik/)).

**Systemfolge:** Onda sollte bei Prosa das Phasenbewusstsein respektieren: In der Erstfassung ist fast jeder automatische Hinweis eine geöffnete Tür, die niemand geöffnet hat. Rückmeldung entfaltet ihren Wert in der Überarbeitung — und dort in Werkstatthaltung: Leseerfahrung beschreiben, Streichkandidaten sichtbar machen, nie den Text umschreiben. Ob das einen expliziten Phasenschalter braucht, ist eine Produktentscheidung (siehe offene Fragen).

## 11. Deutschsprachige Schreibschulen und Poetik-Tradition

Das Handwerksverständnis dieser Notiz ist im deutschsprachigen Raum institutionell verankert. Das Deutsche Literaturinstitut Leipzig (hervorgegangen aus dem 1955 gegründeten Institut „Johannes R. Becher", neu gegründet 1995) bildet in Prosa, Lyrik und Dramatik aus; die eigene Produktion wird im Kontext der Gegenwartsliteratur analysiert, mit Stilkritik eigener und fremder Texte ([DLL](https://de.wikipedia.org/wiki/Deutsches_Literaturinstitut_Leipzig), [Studiengang B.A.](https://www.deutsches-literaturinstitut.de/studium/literarisches-schreiben-ba)). In Hildesheim initiierte Hanns-Josef Ortheil 1999 den Studiengang „Kreatives Schreiben und Kulturjournalismus" ([Wikipedia](https://de.wikipedia.org/wiki/Kreatives_Schreiben_und_Kulturjournalismus)); seine Duden-Reihe zeigt das didaktische Programm: Schreiben beginnt als Wahrnehmungsübung — von der genauen Beobachtung der Umgebung zum literarischen Text, Angebote statt Befehle und Regeln ([Ortheil: *Mit dem Schreiben anfangen*](http://www.kulturbuchtipps.de/archives/1993)). Dazu kommen das zweisprachige Literaturinstitut in Biel (seit 2006, mit Mentoraten) ([HKB/Literaturinstitut](https://www.hkb.bfh.ch/de/aktuell/medienmitteilungen/2026/unterwegs-20-jahre-schweizerisches-literaturinstitut-2026-03-10/)) und die Sprachkunst an der Angewandten in Wien.

Daneben steht die Poetikvorlesung als eigenes Genre der Selbstauskunft: Seit Ingeborg Bachmann im Wintersemester 1959/60 die ersten Frankfurter Poetikvorlesungen hielt, erklären Autorinnen und Autoren dort öffentlich ihr eigenes Verfahren ([Archiv der Frankfurter Poetikvorlesungen](https://www.uni-frankfurt.de/46036887/1959_1968___Archiv_der_Frankfurter_Poetikvorlesungen), [Frankfurter Poetik-Vorlesungen](https://de.wikipedia.org/wiki/Frankfurter_Poetik-Vorlesungen)) — die Tradition, aus der auch Christa Wolfs Kassandra-Vorlesungen stammen.

Die Schulen tragen aber auch eine Warnung in sich: Die „Institutsprosa"-Debatte — zugespitzt 2014 in der Kessler-Debatte — wirft den Schreibschulen gleichförmige, erfahrungsarme, akademisch geglättete Literatur vor ([H-Soz-Kult: Institutsprosa](https://www.hsozkult.de/event/id/event-85910)). Ob der Vorwurf trifft, ist umstritten; strukturell ist er derselbe Befund wie bei KI-Texten: Individuelle Qualitätsgewinne und kollektiver Diversitätsverlust können zusammen auftreten — im Schreibexperiment machten LLM-Ideen Kurzgeschichten im Mittel besser bewertet und untereinander ähnlicher ([Doshi & Hauser 2024](https://doi.org/10.1126/sciadv.adn5290)).

**Systemfolge:** Das Werkstattgespräch ist das richtige Rollenmodell für den Agenten bei Prosa: ein belesener Erstleser unter mehreren, nicht ein Lektor mit Rotstift. Und die Institutsprosa-Warnung gilt ihm direkt: Jeder Hinweis, der Texte in Richtung eines erwartbaren Werkstatt-Sounds schiebt — mehr Zurückhaltung, mehr Präsens, mehr Andeutung —, ist selbst ein Homogenisierungsrisiko. Der Maßstab bleibt die Stimme dieses Textes.

## Implikationen für Onda

### Gewichtung der acht Hinweisarten für Prosa

- **fakt — fast immer falsch.** Erfundene Tatsachen sind das Handwerk, nicht der Fehler (Hamburger, Abschnitt 1). Einzige legitime Restform: reale Weltanker in erkennbar realistischer oder historischer Prosa, nach dem Vorbild der New-Yorker-Praxis — als Angebot mit Autorenhoheit, nie als Integritätsfrage.
- **quelle — praktisch immer falsch.** Prosa führt keinen Belegapparat; eine Quellenforderung an einen Roman ist ein Kategorienfehler. (Übernommene reale Zitate sind eine Rechtefrage, keine Rückmeldefrage.)
- **methode — immer falsch.** Es gibt keine Datenauswertung, deren Schluss zu weit gehen könnte. Diese Art sollte bei Textart Prosa schlicht nicht vorkommen.
- **logik — der verbleibende Integritätskern, umgedeutet.** Nicht Argumentprüfung, sondern innere Stimmigkeit: Kontinuität (Namen, Orte, Zeitlinie), Weltregeln, Figurenmotivation, Konsistenz der Erzählinstanz. Vorbehalt: Unzuverlässiges Erzählen — der Begriff stammt von Booth — macht den scheinbaren Widerspruch zum Mittel; darum Prüffrage, nie Urteil.
- **struktur — wertvoll, aber anders.** Tempo-Ökonomie (Szene/Raffung), Versprechensbilanz, Anfang und Ende — nicht Gliederungslogik und Übergänge im Sachtext-Sinn.
- **wirkung — die wichtigste Art.** Prosa ist Wirkungskunst; die beschriebene Leseerfahrung (wo der Traum reißt, wo Spannung sich löst) ist der Kern der Werkstatthaltung. Bleibt Hypothese, wie überall.
- **erklaerung — meist invertiert.** Der typische Prosafehler ist Übererklärung, nicht Unterversorgung: Wer dem Leser nicht traut, zerstört Hemingways Siebenachtel. Die Art darf nur greifen, wenn echte Orientierungslosigkeit droht (Gardners „vivid": wer, wo, was muss tragen) — und sollte häufiger das Zuviel benennen als das Zuwenig.
- **sprache — wichtig, mit Stil-Vorbehalt.** Maßstab ist der Traum-Bruch, nicht die Norm: Normverstöße können Stimme sein, Figurenrede ist geschützt. Unfreiwillige Reime, Registersprünge ohne Funktion und Stimmen-Inkonsistenz sind die tragfähigen Befunde.

### Prüffragen an einen Prosatext

1. Wo reißt der Traum — an welcher Stelle fällt ein aufmerksamer Leser heraus, und woran?
2. Wer erzählt, wer nimmt wahr — und bleibt das konsistent oder wechselt es mit erkennbarer Absicht?
3. Bekommen die Wendepunkte Szenen und die Übergänge Raffung — oder ist die Zeit falsch verteilt?
4. Welche Versprechen macht der Anfang, und löst das Ende sie ein? Welche Gewehre hängen ungenutzt an der Wand?
5. Was will jede Figur in dieser Szene, und woran sieht man es?
6. Handeln die Figuren aus sich oder für den Plot?
7. Tut der Dialog mehr als eines zugleich?
8. Wo behauptet der Text, was die Szene schon zeigt — und wo behauptet er nur, ohne dass etwas zu sehen ist?
9. Welche Details tragen Bedeutung, welche sind Füllung — und wo steht Abstraktion, wo ein Einzelding stehen müsste?
10. Wo erklärt der Text, was der Leser längst verstanden hat?

### Was der Agent bei Prosa nicht tun darf

- Belege oder Quellen für Erfundenes fordern; eine Metapher faktisch prüfen.
- „Show, don't tell" oder andere Faustregeln als Regeln aussprechen (Booth, Abschnitt 4).
- Figurenrede grammatisch oder registerbezogen normieren.
- Sinnliche Details, Szenen oder Wendungen erfinden und als Ersetzungsvorschlag anbieten — die Leerstelle zeigen ja, sie füllen nein.
- In Richtung eines erwartbaren Sounds glätten (Institutsprosa-Risiko); die Stimme des Textes ist der Maßstab, nicht ein Stilideal.
- Deutungen (Symbolik, Motive) als Absicht des Autors behaupten — Deutungen sind Lesarten und müssen als solche erscheinen.
- Erstfassungen ungefragt mit Hinweisen fluten (Kings geschlossene Tür).

### Wertvollste Erweiterungsart

**verbindung.** Motivarbeit — Bildketten, Spiegelszenen, das Gewehr aus Akt eins und sein möglicher Schuss — ist genau das, was ein Zweitleser im Material sieht und der Autor mitten im Text oft nicht: zwei Stellen, die zusammengehören, ohne dass eine davon falsch wäre. Sie fordert nichts (kein Posten, keine Risikoannahme) und trifft trotzdem das Herz des Prosahandwerks, die Versprechensökonomie aus Abschnitt 8. `weiterfuehrung` ist die zweitstärkste (eine Szene trägt weiter, als sie geführt ist); `feld` bleibt bei Prosa schwach — das „Nachbargebiet" ist eine Rechercheologik, die hier selten greift.

### Offene Geschmacksfragen an Jakob

1. **Reale Weltanker:** Soll Onda in realistischer Prosa falsche reale Details (Daten, Orte, Technik) überhaupt anmerken — leise, nach New-Yorker-Vorbild — oder grundsätzlich schweigen, solange der Autor es nicht verlangt?
2. **Tür zu, Tür auf:** Braucht Prosa einen expliziten Phasenschalter, der automatische Hinweise in der Erstfassung stumm stellt — oder genügt die bestehende Zurückhaltung des Systems?
3. **Perspektivstrenge:** Wie streng bei Perspektivwechseln — die personale Schule meldet jeden Bruch, die auktoriale Tradition erlaubt fast alles. Wo soll Ondas Voreinstellung liegen, solange das Projektverständnis nichts anderes sagt?
4. **Deutungsangebote:** Soll der Agent Motive und mögliche Lesarten aktiv anbieten (als `verbindung`), oder nur beschreiben, was auf der Textoberfläche geschieht?
5. **Untergliederung der Textart:** Reicht die eine Textart „Prosa", oder braucht die Tabelle in `textart-regeln.mjs` mittelfristig eine Unterscheidung (realistisch/phantastisch/historisch), an der die Weltanker-Frage aus Punkt 1 hängt?
