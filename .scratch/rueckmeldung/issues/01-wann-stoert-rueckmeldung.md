# Wann stört Rückmeldung, und wann trägt sie

Type: research
Status: resolved

## Question

Was ist darüber bekannt, wann eine Unterbrechung beim Schreiben das Denken zerstört
und wann sie es trägt? Gesucht sind belastbare Befunde, keine Ratgeberweisheiten:

- Ab welcher Dauer gilt eine Pause im Schreiben als Abschluss eines Gedankens und
  nicht als Stocken mitten darin?
- Unterscheidet sich das nach Art der Rückmeldung — Rechtschreibung gegenüber einem
  Einwand gegen die Beweisführung?
- Was ist zu Aufmerksamkeitswechsel und Wiedereinstiegskosten bekannt (task
  resumption lag)?
- Was sagt die Flow-Literatur (Csikszentmihalyi) über Eingriffe, die den Zustand
  tragen statt ihn zu brechen — und was davon ist belegt, was Folklore?

Der heutige Wert im Code ist 3000 ms für alle acht Hinweisarten
(`app/src/workspace.js:114`, `AGENT_IDLE_MS`). Ob das begründet ist oder geraten,
ist unbekannt.

**Antwort ist:** ein Befundbericht mit Quellen, der die Prototyp-Runde speist.
Keine Entscheidung — die fällt danach.

## Answer

### Das Wichtigste zuerst

1. **Die 3000 ms sind geraten — aber die 2000 ms der Fachliteratur sind es auch.** Die
   Herkunft der üblichen Schwelle ist inzwischen aufgeklärt und ernüchternd: sie wurde
   aus der Sprechforschung übernommen, wo sie eine Begründung hatte, und die Begründung
   blieb dort zurück. Die maßgebliche Übersichtsarbeit schreibt, jede Schwelle zwischen
   einer Viertelsekunde und zehn Sekunden sei gleich gut begründbar. Onda liegt damit
   innerhalb der Bandbreite der Forschung — nur nirgends besonders begründet darin.

2. **Es gibt keine Dauer, ab der eine Pause „fertiger Gedanke" heißt.** Das ist der
   klarste Befund dieser Recherche, und er ist ein negativer. Die Verteilung der
   Schreibpausen hat keine natürliche Bruchstelle, an der ein Schnitt läge. Wer eine
   Zahl setzt, setzt sie willkürlich — das sagen die Fachleute inzwischen wörtlich.

3. **Eine reine Zeitregel ist in beiden Richtungen ungefähr so gut wie Raten.** Von den
   Pausen über zwei Sekunden liegen rund **69 %** mitten im Satz. Und umgekehrt tragen
   nur rund **31 %** der Satzgrenzen überhaupt eine Pause über zwei Sekunden. Eine
   Wartezeit erwischt also zu zwei Dritteln den Falschen und verpasst zwei Drittel der
   richtigen Momente.

4. **Ob die Art der Rückmeldung den Schaden verändert, hat niemand gemessen.** Keine
   einzige Studie stellt „Tippfehler markiert" gegen „dein zweiter Absatz stützt deine
   These nicht", liefert beides gleich aus und misst, was es kostet. Die Lehrmeinung
   „erst der Inhalt, dann die Form" ist vierzig Jahre alte Folklore ohne Experiment.

5. **Der Wiedereinstieg ist billiger als der Mythos, aber am Schreiben teurer.** In der
   Laborforschung kostet ein schlecht gewählter Moment gegenüber einem gut gewählten
   rund **1,2 Sekunden**. Die einzige Studie, die eine Unterbrechung mitten in einer
   echten Schreibaufgabe gemessen hat, findet dagegen einen Einbruch der
   Schreibgeschwindigkeit um rund **64 %**, der **10 bis 15 Sekunden** anhält.

6. **Die Flow-Literatur liefert keine einzige Zahl** — weder wie lange man hinein
   braucht noch was ihn bricht. „Man darf niemanden im Flow stören" ist keine Messung,
   sondern folgt schon aus der Definition. Die berühmten „23 Minuten" sind nachweislich
   falsch zitiert.

7. **Verlässlichkeit schlägt Zeitpunkt.** Unterhalb von rund 70 % Trefferquote ist ein
   hinweisgebendes System messbar schlechter als gar keines. Dann rettet kein Rhythmus
   mehr etwas.

---

### 1. Woher 3000 ms kommen könnten — und woher nicht

Zwei Forschungszweige liefern überhaupt Zeitzahlen.

**Die Gestaltung von Oberflächen** arbeitet bis heute mit drei Grenzen aus einem
Vortrag von 1968: 0,1 Sekunden (fühlt sich unmittelbar an), 1 Sekunde (der
Gedankenfluss bleibt ungestört, die Verzögerung wird aber bemerkt), 10 Sekunden
(darüber wandert die Aufmerksamkeit ab). Robert B. Miller, *Response time in
man-computer conversational transactions*, AFIPS Fall Joint Computer Conference 1968,
DOI 10.1145/1476589.1476628; von Jakob Nielsen 1993 übernommen und seither unverändert
weitergereicht. Diese Zahlen betreffen die Antwortzeit einer Maschine, nicht den
Zeitpunkt einer Einmischung. Für uns belegen sie nur, dass runde Zahlen in diesem Feld
Tradition sind und nicht Messung.

**Die Schreibforschung** arbeitet meist mit 2000 ms — erklärtermaßen als Konvention.
Die Herkunft ist geklärt. Torrance und Conijn (2024), *Methods for studying the writing
time-course*, Reading and Writing 37, 239–251, DOI 10.1007/s11145-023-10490-8,
verfolgen die Praxis zurück: das Pausenzählen wurde aus der **Sprechforschung**
übernommen, wo eine Schwelle von 250 ms eine motorische Begründung hatte — so lange
dauert eine Artikulationspause. Beim Übergang in die Schreibforschung wanderte die
Praxis mit, die Begründung nicht. Ihr Urteil, wörtlich:

> „while a 2 s threshold undoubtedly captures an interesting distinction … the same
> could be argued for **any threshold a researcher might care to choose between perhaps
> 250 ms and 10 s**."

Also: jede Schwelle zwischen einer Viertelsekunde und zehn Sekunden ist gleich gut
begründbar. Damit ist die Ticket-Frage beantwortet — 3000 ms ist geraten, aber nicht
schlechter geraten als die 2000 ms der Fachliteratur.

Weitere Stimmen im selben Ton. Chenu, Pellegrino, Jisa und Fayol (2014): „While there
is no precise reason advanced for the thresholds of 1 or 2 s." Hall, Baaijen und
Galbraith (2024): „there is no agreed threshold … Typically, a conservative approach is
taken, and a relatively high threshold is used — for example two seconds — and it is
**assumed** that … these pauses, as a class, reflect higher level reflective thought."
Wengelin (2006) nennt als tatsächlichen Grund für die 2000 ms: sie waren das Doppelte
der mittleren Tipprate, und — der meistgenannte Grund — sie machten Ergebnisse zwischen
Studien vergleichbar.

Tatsächlich benutzte Schwellen reichen von **15 ms bis 10.000 ms**. Dazwischen liegen
200, 250, 500, 1000, 2000 — und **3000 ms**, der Wert, den Onda heute benutzt (Van Waes
und Schellens 2003). Onda liegt also nicht außerhalb der Bandbreite der Forschung.

---

### 2. Ab welcher Dauer eine Pause als abgeschlossener Gedanke gilt

#### 2.1 Es gibt keine natürliche Bruchstelle

Wenn Pausen beim Schreiben zwei Sorten hätten — kurze fürs Tippen, lange fürs Denken —,
müsste ihre Häufigkeitsverteilung zwei Gipfel mit einem Tal dazwischen zeigen, und in
dieses Tal könnte man den Schnitt legen. Das ist untersucht worden.

- **Baaijen, Galbraith und de Glopper (2012)**, *Keystroke Analysis: Reflections on
  Procedures and Measures*, Written Communication 29(3), 246–277,
  DOI 10.1177/0741088312451108. 80 Tastaturprotokolle. Mischmodelle beschreiben die
  Pausendauern besser als ein einzelner Mittelwert; zwischen Wörtern finden sich drei
  Bestandteile (330 ms zu 65 %, 735 ms zu 26 %, 2.697 ms zu 9 %).
- **Hall, Baaijen und Galbraith (2024)**, Reading and Writing 37, 329–357,
  DOI 10.1007/s11145-022-10284-4 (frei zugänglich). 32 Studierende. Wiederholt den
  Befund mit neuen Daten.
- **Li (2021)**, Frontiers in Psychology 12:628660, DOI 10.3389/fpsyg.2021.628660. Rund
  1.900 Aufsätze von Achtklässlern aus 24 Schulen in 18 US-Bundesstaaten. Auch hier
  passen drei Bestandteile am besten — **aber nur 6 % der Bestandteilspaare waren
  sauber getrennt**, 72 % nur „einigermaßen". Die Bestandteile existieren rechnerisch,
  überlappen aber so stark, dass sie sich praktisch nicht auseinanderhalten lassen.
- **Rosenqvist (2015)**, Bachelorarbeit Umeå — *studentische Arbeit ohne
  Gutachterverfahren, entsprechend vorsichtig zu lesen* —, 46 Schülerinnen und Schüler:
  konnte die Dreigipfligkeit **nicht** wiederfinden. „The shape of the curves varied
  wildly between different writers."
- **Chenu, Pellegrino, Jisa und Fayol (2014)**, *Interword and intraword pause threshold
  in writing*, Frontiers in Psychology 5:182, DOI 10.3389/fpsyg.2014.00182. 278 Texte
  von rund 120 französischsprachigen Kindern und Jugendlichen, 107.319 Pausen. Sie
  versuchen ausdrücklich, eine Schwelle **aus den Daten abzuleiten** statt sie zu
  setzen — und scheitern kontrolliert: die Verteilungen sind „not always bimodal". Ihr
  Nebenbefund: mittlere Pausendauer 760 ms bei einem **Median von 147 ms** und einer
  Streuung von 5.004 ms. Diese Kluft zwischen Mittelwert und Median ist die Schiefe der
  Verteilung in Zahlen.
- **Torrance und Conijn (2024)**: legt man die zugrundeliegenden Vorgänge übereinander,
  ergibt sich „the appearance of a **single distribution with strong positive skew**" —
  eine einzige, stark rechtsschiefe Verteilung. Kein Tal, kein Schnittpunkt.

**Damit ist die erste Frage des Tickets beantwortet, und zwar negativ: eine Dauer, ab
der eine Pause den Abschluss eines Gedankens anzeigt, gibt es nicht.** Die Verteilung
ist ein Kontinuum. Jede Schwelle ist eine Setzung.

Die Fachwelt hat daraus eine Konsequenz gezogen. Hall, Baaijen und Galbraith empfehlen
inzwischen, gar keine feste Schwelle mehr zu setzen. Wo doch eine gebraucht wird,
arbeiten neuere Verfahren mit **Vielfachen des eigenen Medians des jeweiligen
Schreibers**. Der Grund ist zwingend: der mittlere Median-Anschlagabstand reicht von
181 ms (Universitätsstudierende) bis 568 ms (Viertklässler) — Wengelin (2006),
schwedisches Korpus. Van Waes u. a. (2021), Journal of Writing Research 13(1), 107–153,
messen an 1.682 Personen und rund 1,45 Millionen Anschlagabständen einen Mittelwert von
152 ms (Streuung 75), Median 137 ms, mit Einzelwerten von etwa 120 bis 340 ms. **Eine
feste Schwelle bedeutet für einen schnellen und einen langsamen Schreiber etwas völlig
Verschiedenes.**

#### 2.2 Die Zahlen, die es gibt

Hall, Baaijen und Galbraith (2024) haben als Einzige die Bestandteile getrennt nach Ort
im Text ausgerechnet. Das ist die brauchbarste Tabelle der Literatur. 32 Studierende,
muttersprachlich Englisch, 30-Minuten-Aufsatz. Mittelwerte in Millisekunden; in
Klammern der Anteil der Übergänge, der auf diesen Bestandteil entfällt:

| Ort im Text | flüssig | mittel | nachdenklich |
|---|---|---|---|
| innerhalb eines Wortes | 139 ms (95 %) | — | 463 ms (5 %) |
| zwischen zwei Wörtern | 267 ms (43 %) | 401 ms (40 %) | 1.295 ms (17 %) |
| an einer Teilsatzgrenze | 785 ms (66 %) | — | 4.615 ms (34 %) |
| an einer Satzgrenze | 1.176 ms (69 %) | — | 5.528 ms (31 %) |

Ohne vorbereitende Gliederung lagen die Satzgrenzen noch höher: 1.558 ms (55 %) und
7.757 ms (45 %).

Zwei Ableitungen:

- **Mitten im Satz, zwischen zwei Wörtern, ist selbst der langsamste Bestandteil im
  Mittel nur rund 1,3 Sekunden lang.** Drei Sekunden liegen dort weit im Ausläufer.
- **An einer Satzgrenze liegt der nachdenkliche Bestandteil im Mittel bei 5,5
  Sekunden.** Drei Sekunden sind dort noch mittendrin.

Ein einziger Zeitwert trifft also an beiden Orten daneben, und zwar in entgegengesetzte
Richtungen.

**Zwei Vorbehalte, die die Autoren selbst nennen.** Erstens: für Teilsatz- und
Satzgrenzen hatten sie zu wenige Datenpunkte — „there are probably too few data points
for the distributions to be fitted reliably". Ausgerechnet die beiden Zeilen, die uns am
meisten interessieren, sind die schwächsten. Zweitens: **Absatzgrenzen haben sie gar
nicht gemessen.**

Als Nebenbefund liefern dieselben Arbeiten eine **aus den Daten abgeleitete** Schwelle
für reflektierendes Denken zwischen Wörtern: 1.686 ms bei Baaijen u. a. 2012, 1.426 ms
(Streuung 309) bei Hall u. a. 2024. Deren Kommentar: „These are **well below the
threshold of 2 s** usually used to identify 'cognitive' pauses." Die übliche Praxis ist
also nicht bloß willkürlich, sondern nach dem eigenen Maßstab der Disziplin zu
vorsichtig.

#### 2.3 Der Ort schlägt die Dauer — aber beides taugt nur zu einem Drittel

Hier liegt der praktisch folgenreichste Befund der ganzen Recherche. Er hat zwei
Hälften, und beide sind unbequem.

**Erste Hälfte — wen eine Zeitregel trifft.** Ivaska, Toropainen und Lahtinen (2025),
*Pauses during a writing process in two typologically different languages*, Journal of
Writing Research 16(3), 407–433, DOI 10.17239/jowr-2025.16.03.03, haben 2.749 Pausen
von mindestens 2000 ms nach ihrem Ort sortiert:

| Ort | Anzahl | Anteil |
|---|---|---|
| zwischen zwei Wörtern | 1.697 | 61,7 % |
| am Satzanfang | 594 | 21,6 % |
| am Satzende (vor dem Punkt) | 197 | 7,2 % |
| innerhalb eines Wortes | 191 | 6,9 % |
| zwischen zwei Sätzen (nach dem Punkt) | 70 | 2,5 % |

**Rund 69 Prozent aller langen Pausen liegen mitten im Satz.** Eine Regel „warte, dann
melde dich" trifft also in gut zwei von drei Fällen jemanden, der mitten in einem Satz
hängt.

*Ehrlicher Vorbehalt:* ein Text hat viel mehr Wortzwischenräume als Satzgrenzen, also
fallen dort schon rein rechnerisch mehr Pausen an. Für einen Auslöser, der nur die Dauer
kennt, gilt der Befund trotzdem — er beschreibt genau dessen Trefferwahrscheinlichkeit.

Wie lang diese langen Pausen sind, ist ebenfalls gemessen: Spanne 2 bis 195 Sekunden,
Mittelwert 7,5 Sekunden, **Median 4,1 Sekunden**.

**Zweite Hälfte — wen eine Zeitregel verpasst.** Wengelin, Torrance, Holmqvist u. a.
(2009), Behavior Research Methods 41(2), 337–351, DOI 10.3758/BRM.41.2.337, haben
gemessen, welcher Anteil der Textgrenzen überhaupt eine Pause über 2 Sekunden trägt
(N=8, Englisch):

| Grenze | Anteil mit Pause > 2 s |
|---|---|
| Zeichen | 2 % |
| Wort | 6 % |
| Satz | 31 % |
| Absatz | 45 % |

**Nur rund ein Drittel der Satzgrenzen und weniger als die Hälfte der Absatzgrenzen
gehen überhaupt mit einer langen Pause einher.** Wer auf lange Pausen wartet, um
Satzenden zu finden, verpasst zwei Drittel davon.

Ivaska u. a. bestätigen das drastisch: nach Anwendung der 2000-ms-Schwelle blieben im
gesamten schwedischen Datensatz nur **37 Pausen zwischen Sätzen** übrig.

Eine Neuauswertung norwegischer Daten, berichtet bei Torrance und Conijn (2024) —
**Achtung: dort als unveröffentlichtes Manuskript zitiert, damit der schwächste Beleg in
diesem Bericht** — geht noch weiter: „writers rarely hesitated at sentence boundaries,
with over 50% of sentences preceded by very short pauses (mean around 430 ms)". Über die
Hälfte der Sätze beginnt nach einer Pause von rund einer halben Sekunde.

Der Grund ist bekannt: **Planen läuft parallel zum Tippen.** Wer den nächsten Satz schon
während des letzten geplant hat, hält an der Grenze nicht an.

**Zusammengefasst als Trefferbilanz einer reinen Zeitregel:**

- Von den ausgelösten Momenten sind rund **31 %** an einer Satzgrenze (Ivaska u. a.).
- Von den Satzgrenzen werden rund **31 %** erwischt (Wengelin u. a.).

Beides ungefähr ein Drittel. Als Erkennung von „Gedanke fertig" ist eine reine Zeitregel
in beiden Richtungen etwa so gut wie Raten unter drei Möglichkeiten.

#### 2.4 Was auf Deutsch gemessen ist

Fast die gesamte Literatur ist englisch, schwedisch, finnisch, französisch,
niederländisch, norwegisch. Für das Deutsche gibt es genau **eine** Arbeit, die
Pausendauern nach Textort misst:

Fuchs und Krivokapić (2016), *Prosodic Boundaries in Writing: Evidence from a Keystroke
Analysis*, Frontiers in Psychology 7:1678, DOI 10.3389/fpsyg.2016.01678. 14 deutsche
Muttersprachler, 21 bis 43 Jahre, E-Mail an eine befreundete Person, einmal mit sechs,
einmal mit vier Minuten Zeit. Ausdrücklich **ohne** Schwellenwert.

Die Anschlagabstände sind zwischen Wörtern am kürzesten, am Komma länger, am Punkt am
längsten. Das Papier berichtet logarithmierte Werte („Duration was log-scaled"):
β = 5,80 / 6,58 / 7,14. **Zurückgerechnet ergibt das rund 330 ms, 720 ms und 1.260 ms**
— diese Umrechnung stammt von mir, das Papier selbst nennt keine Millisekunden.

Der deutsche Satzgrenzenwert von rund 1.260 ms liegt sehr nah am englischen Wert von
Hall u. a. (1.176 ms). Ein beruhigender Hinweis — aber nur für die Satzebene und nur bei
14 Personen.

Zwei Nebenbefunde: Zeitdruck hatte **keinen** Effekt („No effect of Condition") — die
Grenzenstruktur ist stabil. Und die Schreibpausen sind etwa doppelt so lang wie die
Sprechpausen an denselben Stellen beim Vorlesen, wobei beide zusammenhängen
(bereinigtes r² = 0,20; F = 7,53; df = 51; p = 0,0015). Der Schreibende gliedert seinen
Text zeitlich so, wie er ihn sprechen würde — nur langsamer.

**Was für das Deutsche fehlt:** die übrige deutschsprachige Schreibforschung misst
unterhalb der Wortebene — Morphem- und Silbengrenzen in Komposita — in eng geführten
Laboraufgaben. **Keine deutsche Studie misst Pausendauern nach Textstruktur oberhalb des
Satzes.** Deutsche Besonderheiten wie lange Komposita, die Satzklammer und trennbare
Vorsilben machen eine Übertragung englischer oder schwedischer Werte auf die Wort- und
Teilsatzebene unbelegt.

#### 2.5 Absatz- und Abschnittsgrenzen: fast nichts

Für den dritten Moment („beim Aufschauen") ist das die entscheidende Auskunft:

- Zur **Absatzgrenze** gibt es genau eine Dauerangabe, und die ist alt, indirekt und aus
  einer anderen Aufgabe: Schilperoord (1996), niederländische **diktierte**
  Geschäftsbriefe — satzinitial rund 3 Sekunden, absatzinitial rund 8 Sekunden. Diese
  Zahl konnte nur aus zweiter Hand bestätigt werden; das Buch ist nicht frei zugänglich.
  Mit Vorsicht zu behandeln.
- Wengelin u. a. (2009): 45 % der Absatzgrenzen tragen eine Pause über 2 Sekunden — bei
  nur acht Personen, und die Texte waren selten länger als zwei bis drei Absätze.
- Medimorec und Risko (2017), *Pauses in written composition: on the importance of where
  writers pause*, Reading and Writing 30(6), 1267–1285, N=101, berichten Pausen**raten**,
  keine Dauern: pro Absatzgrenze 0,89 Pausen im Band 300–999 ms, 0,39 im Band
  1.000–1.999 ms, 0,27 über 2.000 ms — gegenüber 0,61 / 0,15 / 0,14 an Satzgrenzen und
  0,44 / 0,10 / 0,10 an Wortgrenzen. Absatzgrenzen tragen also deutlich mehr und deutlich
  längere Pausen. Um wie viele Millisekunden, sagt niemand.
- **Zur Abschnittsgrenze — der Ebene über dem Absatz, also genau dem „Aufschauen" des
  Tickets — gibt es keine einzige Messung.**

#### 2.6 Was in der Pause geschieht — und was man ihr nicht ansieht

Kombinierte Blick- und Tastenmessung sagt, wohin Schreibende in Pausen schauen. Die
Zahlen stehen bei **Torrance, Johansson, Johansson und Wengelin (2016)**, Psychological
Research 80(5), 729–743 (Versuch 1: 16 schwedische Erwachsene; Versuch 2: 10 englische):

- Der Bildschirm wird 65,1 % der Zeit angeschaut, aber **zusammenhängendes Lesen macht
  nur 8,4 % der Bildschirmblicke aus** — also 5,8 % der Gesamtzeit. Der Rest ist
  „Hüpfen".
- **Wahrscheinlichkeit, zurückzuschauen, nach Grenze:** innerhalb Wort 0,05; Wortende
  0,07; Wortanfang 0,12; Satzende 0,31; nach dem Schlusszeichen 0,33; **Satzanfang
  0,45**. Zusammengenommen schauten Schreibende **bei 75 % der Satzübergänge** zurück.
  Die Zahl der Fixierungen je Rückblick steigt von 1,8 (innerhalb Wort) auf **10,6
  (Satzanfang)**.

Das ist der beste vorhandene Beleg für die Idee eines Aufschauen-Moments: an
Satzübergängen liest der Schreibende tatsächlich in drei von vier Fällen zurück, und dann
richtig.

Révész, Michel und Lee (2019), Studies in Second Language Acquisition 41(3), 30 Personen,
sind die Einzigen, die Schreibende während der Pause direkt gefragt haben: das Häufigste
ist, **ganz vom Bildschirm wegzuschauen** (14–25,5 % der Pausenzeit). Auf der
Schreibstelle verweilt fast niemand (0–4 %). Nach eigener Auskunft entfielen 48 % auf
Formulieren, 35 % auf Planen, 11 % auf Prüfen.

**Und jetzt die Grenze, die für das Ticket am meisten zählt:**

**Niemand hat ein Verfahren, das aus einer Pause allein ablesen kann, ob ein Gedanke
fertig ist oder ob jemand feststeckt.** Jede Studie unterscheidet über den **Ort**, nie
über die Dauer. Zwei Befunde machen die Dauer sogar aktiv irreführend:

1. de Smet, Leijten und Van Waes (2018), Written Communication 35(4), 411–447,
   DOI 10.1177/0741088318788070: eine niederländische Rechtschreibfalle (gleichlautende
   Verbformen) verlängerte die Pausenzeit um das **Drei- bis Vierfache**, ohne dass sich
   irgendein Blickmaß veränderte. **Eine lange Pause kann reines Rechtschreibnachschlagen
   sein.** Für Onda unmittelbar folgenreich: gerade der Moment, in dem jemand mit der Form
   kämpft, sieht von außen aus wie tiefes Nachdenken.
2. Wengelin, Johansson, Frid und Johansson (2023), Reading and Writing, 14 schwedische
   Personen: **31,6 % der Einfügungen geschahen, während der Blick auf dem entstehenden
   Text lag.** Nachlesen und Planen passieren auch *während* des Tippens. Pausen
   unterschätzen das Denken systematisch.

---

### 3. Aufmerksamkeitswechsel und Wiedereinstiegskosten

#### 3.1 Wie der Wiedereinstieg funktioniert

Das Standardmodell ist **Altmann und Trafton (2002)**, *Memory for goals: an
activation-based model*, Cognitive Science 26(1), 39–83, DOI 10.1207/s15516709cog2601_2.
Kurz und ohne Fachsprache: ein Vorhaben ist nichts Festes, sondern etwas, das im
Gedächtnis „aufgeladen" gehalten werden muss. Die Ladung zerfällt mit der Zeit. Wird man
unterbrochen, muss sie danach erst wieder aufgebaut werden — mit Hilfe von Hinweisen aus
der Umgebung. Genau das kostet die Wiedereinstiegszeit.

Das Modell ist stark bestätigt, unter anderem an **375 Personen und 13.377
Unterbrechungen** (Altmann und Trafton 2007, Cognitive Science 31(5), 745–770).

#### 3.2 Wie teuer der Wiedereinstieg ist

Die Zahlen streuen enorm, je nach Aufgabe — von unter einer Zehntelsekunde bis über
zwanzig Sekunden. Die belastbarsten:

- **Monk, Trafton und Boehm-Davis (2008)**, Journal of Experimental Psychology: Applied
  14(4), 299–313, DOI 10.1037/a0014402. Wiedereinstiegszeit **1.548 ms** gegenüber einer
  ungestörten Vergleichszeit von 949 ms — reine Zusatzkosten also rund **600 ms**. Die
  Kosten wachsen mit der Länge der Unterbrechung, aber **logarithmisch, und sie laufen
  zwischen 13 und 23 Sekunden in eine Sättigung**. Ihr Fazit: „brief interruptions are
  less disruptive but only for interruptions lasting up to roughly 15 to 25 s."
  **Jenseits von etwa 20 Sekunden macht zusätzliche Länge kaum noch einen Unterschied.**
- **Iqbal und Bailey (2006)**, CHI '06, S. 741–750, DOI 10.1145/1124772.1124882. 12
  Personen, 360 gemessene Wiedereinstiege, sortiert nach vorhergesagten Kosten:

  | vorhergesagte Kosten | Wiedereinstiegszeit |
  |---|---|
  | hoch | 1.702 ms |
  | mittel | 1.012 ms |
  | niedrig | 464 ms |

  F(2,131)=25,23; p<0,0001.

**Der messbare Gewinn eines gut gewählten Moments beträgt also rund 1,2 Sekunden.** Nicht
Minuten. Ein realer, sauber gemessener, kleiner Effekt. Wer eine Rhythmus-Umstellung mit
„spart dem Schreibenden Minuten" begründet, hat keine Quelle.

#### 3.3 Die eine Messung am Schreiben

Es gibt genau **eine** Studie, die eine Unterbrechung mitten in einer echten
Schreibaufgabe zeitlich vermessen hat:

**Keus van de Poll und Sörqvist (2016)**, *Effects of Task Interruption and Background
Speech on Word Processed Writing*, Applied Cognitive Psychology 30(3), 430–439,
DOI 10.1002/acp.3221. Aufsatzschreiben, 30 Sekunden Unterbrechung.

Ergebnis: die Schreibgeschwindigkeit in den ersten 10 Sekunden nach der Unterbrechung lag
bei **1,25 gegenüber 3,51 Zeichen pro Sekunde** — ein Einbruch um rund **64 %**, mit
einem sehr großen Effekt (ηp² = 0,65). Und wörtlich: **„It took 10–15 s for the
participants to regain full writing speed."**

Das ist eine ganz andere Größenordnung als die 1,2 Sekunden der Laborstudien. Der Grund
liegt nahe: beim Schreiben muss nicht ein Vorhaben wieder geladen werden, sondern ein halb
geformter Satz.

*Einschränkung:* eine Studie, eine Unterbrechungslänge, keine unabhängige Wiederholung.

#### 3.4 Vorwarnung bringt fast nichts

Man könnte hoffen, ein Vorlauf („gleich kommt ein Hinweis") mildere die Kosten. Das ist
gemessen, und die Antwort ist ernüchternd.

- **Trafton, Altmann, Brock und Mintz (2003)**, IJHCS 58(5), 583–603,
  DOI 10.1016/S1071-5819(03)00023-5: acht Sekunden Vorwarnung sparten am Ende rund vier
  Sekunden — **aber nur in der ersten Sitzung**. In der zweiten war der Effekt
  verschwunden.
- **Altmann und Trafton (2007)**, 375 Personen: vier Sekunden Vorwarnung holten rund
  **eine Sekunde** heraus — bei vier Sekunden Aufwand. Wörtlich: „hardly a net gain".
  Statistisch erklärte die Vorwarnung 2,8 % der Streuung, die Stelle innerhalb der Aufgabe
  dagegen 65,1 %.

**Übersetzt: ein Vorlauf lohnt sich nicht. Der Ort in der Arbeit ist rund zwanzigmal
wichtiger als jede Vorankündigung.**

#### 3.5 Der Zwischenzustand — warum ein halber Satz teuer ist

**Borst, Taatgen und van Rijn (2010)**, *The problem state: A cognitive bottleneck in
multitasking*, JEP: Learning, Memory, and Cognition 36(2), 363–382: Menschen können
**genau einen** komplexen Zwischenzustand gleichzeitig halten. Zwei Aufgaben, die beide
einen brauchen, kosten dramatisch mehr als zwei, die keinen brauchen.

Daraus folgen zwei Gestaltungsregeln, die die Autoren selbst nennen: unterbrich zu
Momenten mit niedrigem Zwischenzustand — und wenn das nicht geht, **halte den
Zwischenzustand für den Menschen fest**, damit er ihn nicht selbst tragen muss.

**Wichtiger Vorbehalt:** dass ein halb geformter Satz ein solcher Zwischenzustand ist, ist
eine naheliegende Übertragung, aber **keine Messung**. Die Aufgaben in dieser Forschung
waren Rechnen und Textbearbeitung, nicht Sprachproduktion.

#### 3.6 Aufmerksamkeitsrest

**Leroy (2009)**, *Why is it so hard to do my work?*, Organizational Behavior and Human
Decision Processes 109(2), 168–181, DOI 10.1016/j.obhdp.2009.04.002. Der Befund, der oft
verkürzt wiedergegeben wird: **eine Aufgabe zu beenden reicht nicht**, um den Kopf frei zu
bekommen. Nur wer sie **unter Zeitdruck** beendete, kam sauber heraus; wer sie in Ruhe
beendete, trug den Rest mit.

*Ehrlichkeitshinweis:* das genaue Messverfahren dieser Studie ist meines Wissens von keiner
unabhängigen Gruppe wiederholt worden. Der Begriff ist populär, die Beweislage schmal.

#### 3.7 Die Lücke

**Zum Wiedereinstieg in einen halb geschriebenen Satz gibt es keine Forschung.** Keine
Studie unterbricht mitten in einer Satzformulierung und misst, was danach mit dem Satz
passiert. Es gibt einen sprechenden Beleg für diese Lücke: eine Tagungsvorlage von Swets,
Ferreira und Altmann (2006) mit dem Titel *„Where was I?"* stellte genau diese Frage — sie
wurde nie ausgearbeitet und wird bis heute nicht zitiert.

---

### 4. Der richtige Augenblick: was die Unterbrechungsforschung wirklich zeigt

Der Grundgedanke heißt **Bruchstelle** (breakpoint): eine Naht in der Arbeit, an der wenig
im Kopf gehalten wird. Der Befund ist stabil — aber kleiner und anderer Art, als er meist
wiedergegeben wird.

#### 4.1 Was der gute Zeitpunkt bringt: Gefühl, nicht Leistung

**Adamczyk und Bailey (2004)**, *If not now, when?*, CHI '04, S. 271–278,
DOI 10.1145/985692.985727. 16 Personen, drei Aufgabenarten, vier Auslösezeitpunkte. Nur der
Moment wurde verändert, der Inhalt der Störung blieb gleich.

Zwischen dem schlechtesten und dem besten Moment: Verärgerung **+56 %** (F(3,12)=10,53;
p=0,001), Frustration **+49 %** (F(3,12)=9,80; p=0,002), Zeitdruck **+55 %**.

Der wichtigste Befund ist ein **positiver Vergleich**: eine Unterbrechung zum besten
Zeitpunkt unterschied sich bei Verärgerung und Frustration **nicht statistisch bedeutsam
von gar keiner Unterbrechung**. Gut getimt fühlt sich an wie nicht gestört.

Der zweitwichtigste Befund wird fast nie mitzitiert und ist ein **negativer**: **keine
Wirkung auf die Bearbeitungszeit, keine Wirkung auf die Wiedereinstiegszeit.** Das ist ein
Befund über das Erleben, nicht über die Leistung. Wer damit begründet, gutes Timing mache
besseren Text, überdehnt die Quelle.

**Bailey und Konstan (2006)**, Computers in Human Behavior 22(4), 685–708,
DOI 10.1016/j.chb.2005.12.009, N=50. Die berühmten Zahlen — 3 bis 27 % mehr Zeit, doppelt
so viele Fehler, 31 bis 106 % mehr Verärgerung — stimmen, brauchen aber Einordnung:

- Die 3–27 % vergleichen *innerhalb* der gestörten Gruppe. **Zwischen** den Gruppen gab es
  keinen Zeiteffekt (F(1,47)=0,16; p<0,69).
- Der Zuschlag wächst mit der Schwierigkeit: Rechnen +24 %, Zählen +27 %, Lesen nur +7 %,
  Formular ausfüllen +3 %.
- Bei der Verärgerung sind die beiden unteren Werte der Spanne **nicht statistisch
  bedeutsam**.

#### 4.2 Aufschieben bis zur nächsten Naht — und was das kostet

**Iqbal und Bailey (2008 / Oasis)**, CHI '08, S. 93–102, DOI 10.1145/1357054.1357070, sowie
ACM TOCHI 17(4). 16 Personen an echten Arbeitsaufgaben, 143 ausgewertete Meldungen. Das
System hielt Meldungen zurück, bis eine Bruchstelle kam.

- **Mittlere Verzögerung: 88,6 Sekunden** (Streuung 139,3) — also anderthalb Minuten, nicht
  Sekunden.
- Frustration sank um rund 20 %, die Reaktionszeit um rund 25 %. Die Frustrationswirkung war
  allerdings **nur bei einer der beiden Aufgabenarten bedeutsam**.
- „Mittlere" Bruchstellen schnitten besser ab als grobe **und** besser als sofortige
  Auslieferung. Die **feinen** Bruchstellen waren am schlechtesten von allen — schlimmer als
  sofort. Zu häufig unterbrechen ist schlimmer als gar nicht zu warten.
- **Auf die Wiedereinstiegszeit hatte die Aufschieberegel keinerlei Wirkung.**

Zur Häufigkeit (Iqbal und Bailey, CHI '07, 3.074 markierte Bruchstellen aus echten
Arbeitsvideos): zwischen zwei beliebigen Bruchstellen liegen im Mittel etwa **3,8 Minuten**.

**Und hier die unbequeme Zahl:** die automatische Erkennung von Bruchstellen funktioniert
auf bekannten Daten (87 % für grobe Bruchstellen), bricht aber auf neuen Daten ein —
**55,5 % Genauigkeit**, Trefferquote für grobe Bruchstellen 41,5 %. Die sauber
unterschiedenen Momente, von denen dieses System lebt, beruhen auf **nachträglicher
menschlicher Beschriftung**, nicht auf einer Maschine, die sie zuverlässig findet.

#### 4.3 Feldstudien: die Wirkung ist real, misst aber Reaktion, nicht Textqualität

**Okoshi u. a.** haben Bruchstellen-Aufschub in echten Anwendungen erprobt: im Labor 46 %
geringere kognitive Belastung gegenüber zufälliger Auslieferung, im Feldversuch (30
Personen, 16 Tage) 33 % (PerCom '15, DOI 10.1109/PERCOM.2015.7146515). Im Einsatz bei
Yahoo! Japan mit über 680.000 Nutzern: **49,7 % kürzere Antwortzeit** gegenüber sofortiger
Auslieferung (DOI 10.1016/j.pmcj.2018.07.005). Wichtige Einschränkung: gemessen wurde die
**Reaktion auf die Meldung**, nicht die Qualität der unterbrochenen Arbeit.

**Mehrotra u. a. (2016)**, CHI '16, DOI 10.1145/2858036.2858566, 20 Personen, 10.372
Meldungen: der stärkste Vorhersager für empfundene Störung ist der **Fortschritt in der
Aufgabe** (F(3,451)=19,43; p<0,001) — mitten in einer Aufgabe oder kurz vor dem Abschluss
stört es am meisten, beim Anfangen oder im Leerlauf am wenigsten.

Aber: das empfundene Stören erklärt nur wenig davon, ob eine Meldung angenommen wird
(R²=0,143). **104 von 474 Meldungen galten als störend — und 54 % davon wurden trotzdem
geöffnet**, weil der Inhalt es wert war. **Der Inhalt schlägt den Zeitpunkt.**

#### 4.4 Die berühmten Zahlen, die nicht stimmen

**„Eine Unterbrechung kostet 23 Minuten."** Diese Zahl steht in keiner Veröffentlichung.
Sie stammt aus Presseinterviews. Die Quelle, auf die sie zurückgeführt wird, ist Mark,
Gonzalez und Harris (2005), *No task left behind?*, CHI '05, S. 321–330,
DOI 10.1145/1054972.1055017 — 24 Wissensarbeiter, über 700 Stunden Beobachtung. Dort steht
**25 Minuten 26 Sekunden** (Streuung 54:48), und zwar für die **Uhrzeit-Spanne**, bis ein
Arbeitsvorhaben wieder aufgenommen wurde, **einschließlich durchschnittlich 2,26 anderer
Vorhaben, die dazwischen bearbeitet wurden**. Das ist eine Aussage über Terminplanung, nicht
über das Gehirn. Der Aufsatz enthält das Wort „Flow" kein einziges Mal.

Falsche Zahl, falsche Größe, falscher Begriff — dreifach daneben.

**„Unterbrochene Arbeit dauert länger."** Auch das stimmt so nicht. Mark, Gudith und Klocke
(2008), *The cost of interrupted work: more speed and stress*, CHI '08, S. 107–110,
DOI 10.1145/1357054.1357072, 48 deutsche Studierende: unterbrochene Aufgaben wurden
**schneller** fertig — 20,31 bzw. 20,60 Minuten gegenüber 22,77 Minuten ohne Unterbrechung
(p<0,05), also rund 10 % schneller. Die Antworten wurden dafür kürzer. Fehler unterschieden
sich **nicht**.

Bezahlt wurde woanders: Stress stieg von 6,92 auf 9,46 (F(2,92)=12,15; p<0,001), Frustration
von 4,73 auf 6,63, Zeitdruck und Anstrengung ebenfalls. **Menschen kompensieren die
Unterbrechung, indem sie sich zusammenreißen — und zahlen mit Anspannung, nicht mit Zeit.**

#### 4.5 Ein Befund, der die Zielgröße selbst in Frage stellt

Brumby, Cox, Back und Gould (2013), Journal of Experimental Psychology: Applied 19(2),
95–107, DOI 10.1037/a0032696: **längere** Wiedereinstiegszeiten sagten **weniger** Fehler
voraus.

Die Wiedereinstiegszeit ist in der gesamten Literatur das Standardmaß für
Unterbrechungskosten. Wenn ein langsamerer Wiedereinstieg zu besserer Arbeit führt,
optimiert ein System, das sie minimiert, womöglich die falsche Größe. Für einen
Schreibbegleiter, dem es um Textqualität geht und nicht um Geschwindigkeit, ist das eine
ernst zu nehmende Warnung.

#### 4.6 Selbst unterbrechen kostet auch

Katidioti u. a. (2016), Computers in Human Behavior 63, 906–915: wer sich **selbst**
unterbricht, ist insgesamt stärker gestört als wer von außen unterbrochen wird — die
Wiedereinstiegszeit ist gleich, aber die **Entscheidung**, jetzt wegzuschauen, kostet rund
eine Sekunde extra.

Für Onda heißt das: „auf Zuruf abholbar" ist nicht kostenlos. Wenn der Schreibende selbst
entscheiden muss, ob er jetzt nachsieht, trägt er diese Entscheidung. Ein sichtbarer Zähler
„drei Hinweise warten" verlagert die Unterbrechung nur, er entfernt sie nicht.

---

### 5. Unterscheidet sich das nach Art der Rückmeldung?

**Die kurze Antwort: das hat niemand gemessen.** Es gibt keine Studie, die
Rechtschreibmarkierung gegen inhaltlichen Einwand stellt, beide gleich ausliefert und die
Störung vergleicht. Was es gibt, sind Bruchstücke aus vier Richtungen.

#### 5.1 Die einzige direkte Messung am Aufsatz

**Foroughi, Werner, Nelson und Boehm-Davis (2014)**, *Do Interruptions Affect Quality of
Work?*, Human Factors 56(7), 1262–1271, DOI 10.1177/0018720814531786. N=54, drei Aufsätze,
Unterbrechungen einmal beim Gliedern, einmal beim Schreiben, einmal gar nicht.

Ergebnis: die Textqualität sank in **beiden** Unterbrechungsbedingungen deutlich (d = 0,66
beim Gliedern, d = 0,77 beim Schreiben) — und **zwischen den beiden Phasen gab es keinen
Unterschied**. Die Unterbrechungen waren inhaltlich völlig aufgabenfremd. Zusatzzeit
reparierte den Schaden nicht.

Eine Folgearbeit derselben Gruppe (2016) zeigt: **die Schreibenden merkten den Schaden
nicht.** Sie schätzten ihre unterbrochenen Texte nicht schlechter ein.

*Was das nicht sagt:* nichts über die Art der Rückmeldung. Die Unterbrechung war hier eine
fremde Aufgabe, kein Hinweis zum Text.

#### 5.2 Rechtschreibmarkierung während des Schreibens

Die naheliegende Vermutung — die rote Schlangenlinie zerreißt das Formulieren — ist **geprüft
und nicht bestätigt**:

- **McCarthy u. a. (2022)**, *Automated writing evaluation: Does spelling and grammar
  feedback support high-quality writing and revision?*, Assessing Writing 52, 100608,
  DOI 10.1016/j.asw.2022.100608, N=119. Die „Störungshypothese" — Formhinweise während des
  Schreibens lenken vom Inhalt ab — wurde **nicht bestätigt**. Es gab aber auch keinen
  Nutzen.
- **Rønneberg, Torrance, Uppstad und Johansson (2022)**, *The process-disruption
  hypothesis*, Psychological Research 86, 2239–2255, DOI 10.1007/s00426-021-01625-z, N=101:
  Belege für die Störungshypothese „weak at best".
- **Galletta u. a. (2005)**, *Does spell-checking software need a warning label?*,
  Communications of the ACM 48(7), 82–86: gemessen wurde die **Fehlererkennung nach** dem
  Schreiben, nicht der Schreibvorgang. Wird oft falsch zitiert.

Dagegen steht der Befund aus 2.6: eine Rechtschreibschwierigkeit verlängert die Pause um das
Drei- bis Vierfache (de Smet u. a. 2018). Formprobleme **erzeugen** also lange Pausen — und
ein reiner Zeitauslöser fährt genau in sie hinein.

#### 5.3 „Erst der Inhalt, dann die Form" ist Folklore

Die Regel „higher order concerns before lower order concerns" stammt aus der
Schreibberatungsliteratur (Reigstad und McAndrew 1984) und wird seit vierzig Jahren
weitergereicht. **Sie ist nie experimentell geprüft worden.** Kein Versuch stellt „zuerst
Inhaltsrückmeldung" gegen „zuerst Formrückmeldung" und misst das Ergebnis.

Ebenso die klassische Beobachtung, dass schwache Schreibende zu früh redigieren (Perl 1979,
Sommers 1980): das sind **Beobachtungsstudien an sehr kleinen Gruppen** (Perl: fünf
Personen). Sie zeigen einen Zusammenhang, keine Ursache, und sind nie zu einem Versuch
weiterentwickelt worden.

#### 5.4 Was die Rückmeldungsforschung zur Tiefe sagt — und warum sie oft falsch gelesen wird

**Shute (2008)**, *Focus on Formative Feedback*, Review of Educational Research 78(1),
153–189, DOI 10.3102/0034654307313795, ist die maßgebliche Übersicht. Ihr Befund zum
Zeitpunkt ist **entgegengesetzt zur üblichen Werkzeugpraxis**:

- **schwierige Aufgaben → sofortige Rückmeldung** (sonst gibt man auf)
- **leichte Aufgaben → verzögerte Rückmeldung**, ausdrücklich um „feedback intrusion and
  annoyance" zu vermeiden
- niedrig leistende Lernende profitieren von sofort, hoch leistende von verzögert

Übersetzt auf Onda: der schwere Fall — der Einwand gegen die Beweisführung — ist der, für den
sofortige Rückmeldung spricht. Der leichte Fall — die Tippfehlermarkierung — ist der, den man
aufschieben sollte. **Das ist die Umkehrung dessen, was Textverarbeitungen seit dreißig
Jahren tun.**

*Wichtige Einschränkung:* Shutes Befunde stammen aus Lernversuchen (Vokabeln, Physik,
Prozedurwissen), nicht aus dem Schreiben. Die Übertragung ist plausibel, nicht belegt.

**Hattie und Timperley (2007)**, Review of Educational Research 77(1), 81–112,
DOI 10.3102/003465430298487, unterscheiden vier Ebenen der Rückmeldung: Aufgabe, Vorgehen,
Selbststeuerung, Person. Die Effektstärken liegen bei 0,28 bis 0,36 — klein. Rückmeldung zur
**Person** („du bist gut in so etwas") ist wirkungslos bis schädlich. Kluger und DeNisi
(1996), Psychological Bulletin 119(2), 254–284, hatten schon gezeigt: **über ein Drittel
aller Rückmeldungen verschlechtert die Leistung.**

**Scherer, Graham und Busse (2024)**, Learning and Instruction,
DOI 10.1016/j.learninstruc.2024.101961: Rückmeldung auf **Oberflächenmerkmale** wirkte sich
auf **Tiefenmerkmale** negativ aus (g = −0,23). Formhinweise verdrängen die Aufmerksamkeit
vom Inhalt — nicht im Moment des Tippens, sondern über die Überarbeitung hinweg.

#### 5.5 KI-Vorschläge während des Tippens

Hier gibt es die neuesten und für Onda direktesten Zahlen:

- **Bhat, Aubin Le Quéré, Naaman und Jakesch (2026)**, *Reactive Writers: How Co-Writing
  with AI Changes How We Engage with Ideas*, CHI '26, DOI 10.1145/3772318.3791529, N=1.291.
  Vorschläge lösten nach **rund 2 Sekunden** Tipppause aus. Ergebnis: Schreibende
  verbrachten **37 bis 42 Sekunden je Vorschlag allein mit dem Bewerten** — Zeit, die vorher
  gar nicht anfiel. Netto sparten sie nur 7,5 % Zeit, obwohl 31 % des Textes von der Maschine
  kam. **Der Bewertungsaufwand frisst den Gewinn fast vollständig auf.** Ein Argument gegen
  häufige, kleine Einwürfe, unabhängig vom Zeitpunkt.
- **Qin u. a. (2025)**, *Timing Matters: How Using LLMs at Different Timings Influences
  Writers' Perceptions and Ideation Outcomes*, CHI '25, DOI 10.1145/3706598.3713146, N=60.
  **Der einzige Versuch, der den Zeitpunkt einer KI-Rückmeldung direkt manipuliert.** Wer die
  Maschine **vor** dem eigenen Ideenfinden sah, kam am Ende auf Ideen, die den
  Maschinenideen deutlich ähnlicher waren (d = 0,747), empfand weniger Eigentum am Ergebnis
  (r = −0,496) und hatte geringeres Zutrauen in die eigene Kreativität. Empfehlung der
  Autoren: die Maschine **später** einsetzen.
- **Arnold, Chauncey und Gajos (2020)**, *Predictive text encourages predictable writing*,
  IUI '20, S. 128–138, DOI 10.1145/3377325.3377523: Vorhersagetexte machen das Geschriebene
  vorhersagbarer — auch dann, wenn die Schreibenden die Vorschläge ablehnen.

#### 5.6 Die Lücke, klar benannt

- Niemand hat Störungswirkung **nach inhaltlicher Tiefe** der Rückmeldung gemessen.
- Niemand hat gemessen, was eine Rückmeldung kostet, die **den Text selbst betrifft** — alle
  Unterbrechungsstudien benutzen aufgabenfremde Störungen.
- Niemand hat gemessen, ob Schreibende Rückmeldung zu verschiedenen Momenten **wünschen**. Es
  gibt Befragungen zu KI-Schreibwerkzeugen, aber keine zur Taktung.
- Die einzige belastbare Aussage aus benachbarter Forschung ist indirekt und stammt aus der
  Meldungsforschung: **relevanterer Inhalt wird eher angenommen, auch wenn er stört**
  (Mehrotra u. a. 2016). Und: eine der wenigen Studien, die Relevanz gezielt verändert hat
  (Gould, Brumby und Cox 2013), fand einen Relevanzeffekt **nur an Aufgabengrenzen, nicht
  mitten in einer Teilaufgabe**. Also: Relevanz hilft — aber nur, wenn der Moment ohnehin
  stimmt.

---

### 6. Flow: was belegt ist und was Folklore

#### 6.1 Der methodische Widerspruch im Kern

Flow wird seit den 1970ern mit der **Erlebnisstichproben-Methode** gemessen: Teilnehmende
tragen einen Piepser, der sie zufällig unterbricht, und füllen dann einen kurzen Bogen aus.
Csikszentmihalyi und Larson (1987), Journal of Nervous and Mental Disease 175(9), 526–536,
DOI 10.1097/00005053-198709000-00004.

**Die gesamte empirische Grundlage der Flow-Theorie beruht also darauf, Menschen zu
unterbrechen, um zu erfragen, ob sie ungestört waren.** Nakamura und Csikszentmihalyi räumen
das ein, allerdings ohne Zahlen: der Piepser könne den tiefsten Flow gar nicht erfassen, weil
er ihn zerstöre. Das ist eine **Behauptung**, keine Messung — niemand hat den Betrag dieser
Verzerrung je bestimmt.

#### 6.2 „Nicht stören" ist Definition, nicht Befund

Flow ist über neun Merkmale **definiert**, darunter „Verschmelzen von Handlung und
Bewusstsein" und „völlige Konzentration auf das Tun". Wer unterbrochen wird, erfüllt diese
Merkmale per Definition nicht mehr.

**„Unterbrechung beendet Flow" ist damit eine begriffliche Selbstverständlichkeit, kein
empirischer Befund.** Die interessante Frage — was kostet es, wie lange dauert die Rückkehr,
welche Eingriffe sind verträglich — ist damit nicht beantwortet und wurde nie gestellt.

#### 6.3 Die Theorie selbst wackelt an ihrer Kernstelle

Die bekannteste Aussage der Flow-Theorie ist die Balance von Anforderung und Können. Sie ist
die am schlechtesten gestützte.

- **Fong, Zaleski und Leach (2015)**, Journal of Positive Psychology 10(5), 425–446,
  DOI 10.1080/17439760.2014.967799: Metaanalyse über 45 Studien. Der Zusammenhang ist
  **klein** (r = 0,26 gesamt, r = 0,15 im Arbeitskontext).
- **Løvoll und Vittersø (2014)**, *Can Balance be Boring?*, Social Indicators Research
  115(1), 117–136: Balance sagte Flow **nicht** voraus.
- **Cutting u. a. (2023)**, Royal Society Open Science 10(9), DOI 10.1098/rsos.220274:
  **vorregistrierte** Studie, Schwierigkeit über acht Stufen manipuliert. Ergebnis: **kein
  Effekt** auf Engagement und Freude. Das ist der methodisch sauberste Test des
  Kernpostulats, und er ist negativ.
- **Abuhamdeh (2020)**, Frontiers in Psychology 11:158, DOI 10.3389/fpsyg.2020.00158: die
  Definition sei so weit gefasst, dass praktisch jede Aktivität hineinpasse.

#### 6.4 Es gibt keine einzige Zeitkonstante

Ich habe gezielt danach gesucht. **Die Flow-Literatur nennt keine Zahl** — nicht dafür, wie
lange man braucht, um hineinzukommen, nicht dafür, wie lange man draußen bleibt, nicht dafür,
ab welcher Unterbrechungslänge es kippt. Eine Übersichtsarbeit von 2024 (Durcan, Holland und
Bhattacharya, Communications Psychology 2, DOI 10.1038/s44271-024-00115-3) stellt ausdrücklich
fest, dass es keine etablierte Zeitdynamik gibt.

**Jede Zahl, die jemand unter Berufung auf Flow nennt, ist erfunden.**

#### 6.5 Flow beim Schreiben

Perry (1999), *Writing in Flow*, befragte Berufsschriftsteller — qualitativ, per Interview,
ohne Messung des Schreibvorgangs. Es gibt **keine** Studie, die Tastaturprotokolle mit
Flow-Erhebung verbindet, und keine, die misst, welcher Eingriff den Zustand trägt und welcher
ihn bricht.

Der vierte Teil der Ticket-Frage lässt sich also so beantworten: **die Flow-Literatur trägt
zu dieser Entscheidung nichts bei außer einer Metapher.**

---

### 7. Verlässlichkeit schlägt Zeitpunkt

Ein Befund aus der Automatisierungsforschung stellt die ganze Rhythmusfrage in Verhältnis:

- **Wickens und Dixon (2007)**, *The benefits of imperfect diagnostic automation: a synthesis
  of the literature*, Theoretical Issues in Ergonomics Science 8(3), 201–212,
  DOI 10.1080/14639220500370105. Metaanalyse über 20 Studien und 35 Datenpunkte. Ergebnis:
  bei einer Trefferquote von **0,70** liegt der Umschlagpunkt — **darunter ist ein
  hinweisgebendes System schlechter als gar keines.**
- **Dixon, Wickens und McCarley (2007)**, Human Factors 49(4), 564–572,
  DOI 10.1518/001872007X215656: **Fehlalarme schaden mehr als Übersehen.** Ein System, das oft
  grundlos ruft, verliert nicht nur die Befolgung seiner Hinweise, sondern auch das Vertrauen
  in sein Schweigen.

Für Onda heißt das nüchtern: solange nicht klar ist, wie oft ein Hinweis danebenliegt, ist die
Frage nach dem richtigen Moment die zweitwichtigste. Ein schlecht getimter richtiger Hinweis
ist reparabel. Ein gut getimter falscher ist es nicht.

---

### 8. Wer den Zeitpunkt bestimmt

**McFarlane (2002)**, *Comparison of Four Primary Methods for Coordinating the Interruption of
People in Human-Computer Interaction*, Human–Computer Interaction 17(1), 63–139,
DOI 10.1207/S15327051HCI1701_2, N=36. Vier Bauformen wurden verglichen: **sofort** (das System
unterbricht), **ausgehandelt** (das System meldet an, der Mensch entscheidet wann),
**vermittelt** (ein Dritter entscheidet), **getaktet** (feste Zeitpunkte).

Ergebnis, wörtlich: „Negotiation support is the best overall solution except where small
differences in the timeliness of handling interruptions is critical and then immediate is
best."

Ein zweiter Befund ist für Onda mindestens so wertvoll: **wer eine Bauform bevorzugte, war mit
ihr auch objektiv am besten.** Die Vorliebe war ein verlässlicher Zeiger auf die Leistung.
Eine Wahlmöglichkeit schlägt jede Einheitslösung.

Die Kehrseite steht in 4.6: selbst zu entscheiden kostet auch, rund eine Sekunde je
Entscheidung.

---

### 9. Was das für die drei Momente bedeutet

Keine Entscheidung — die fällt anderswo. Aber die Befunde lassen sich auf die drei
vorgesehenen Momente beziehen:

**„Sofort".** Belegt ist: bei schwierigen Aufgaben spricht die Rückmeldungsforschung für
sofort (Shute 2008). Belegt ist auch: „sofort" schnitt in der Bruchstellen-Studie besser ab
als die **feinste** Aufschiebestufe (Iqbal und Bailey 2008). Wer sofort meldet, sollte das
aber nicht dauernd tun — der Bewertungsaufwand je Einwurf liegt in der Größenordnung von 40
Sekunden (Bhat u. a. 2026).

**„Beim Innehalten".** Das ist der am schlechtesten gestützte der drei Momente. Eine reine
Pausendauer trifft zu rund zwei Dritteln jemanden mitten im Satz — also genau den Zustand mit
dem größten Zwischenstand im Kopf. Wer diesen Moment will, sollte ihn nicht über die Dauer
definieren, sondern über den **Ort**: Satzende plus kurze Pause schlägt lange Pause ohne
Ortsprüfung. Der Code kennt bereits eine solche Grenze (`AGENT_BOUNDARY_IDLE_MS = 300` in
`app/src/workspace.js:115`), benutzt sie aber nur für den Panel-Zuruf, nicht für den
Hinweislauf.

**„Beim Aufschauen".** Der bestgestützte der drei — allerdings über den Blick, nicht über die
Zeit: an Satzübergängen schauen Schreibende in **75 %** der Fälle zurück, mit im Mittel **10,6
Fixierungen** (Torrance u. a. 2016). Sie schauen dort ohnehin. Der Moment ist real. Nur seine
**Dauer** ist unbekannt: für Absatzgrenzen gibt es eine einzige, alte, indirekte Zahl (rund 8
Sekunden, aus diktierten Briefen), für Abschnittsgrenzen gar keine.

**Zur Frage nach der Art:** die Befunde stützen die Absicht, den Rhythmus nach der Art zu
staffeln — aber nur **indirekt**, über die Rückmeldungsforschung (schwer → sofort, leicht →
später) und über die Verdrängungswirkung von Oberflächenrückmeldung auf Tiefenmerkmale
(g = −0,23). Ein direkter Beleg existiert nicht. Wer die Staffelung baut, baut sie auf
plausibler Übertragung, nicht auf Messung. **Das ist in Ordnung, solange es so genannt wird.**

Und noch eines aus dem Code selbst: der heutige Aufbau kann gar nicht nach Art staffeln.
`pruefePausenAusloeser` (`app/src/hinweislauf-model.mjs:78`) bekommt genau einen Zeitwert, und
alle acht Arten stammen aus **einem** Lauf (`app/src/agent-tasks.mjs:36`). Eine Staffelung nach
Art verlangt entweder mehrere Läufe oder ein Zurückhalten fertiger Hinweise bis zu ihrem
Moment. Das ist eine Bauentscheidung, keine Zeitwertänderung.

---

### 10. Was nachweislich niemand gemessen hat

Diese Liste ist der wertvollste Teil des Berichts, weil sie vor Scheinsicherheit schützt.

1. **Eine Pausendauer, ab der ein Gedanke als abgeschlossen gilt.** Existiert nicht. Die
   Verteilung hat keine Bruchstelle.
2. **Ein Verfahren, das „fertig" von „steckengeblieben" unterscheidet.** Existiert nicht. Alle
   Verfahren unterscheiden über den Ort.
3. **Störungswirkung nach inhaltlicher Tiefe der Rückmeldung.** Nie gemessen. Die Kernfrage des
   Tickets ist offen.
4. **Der Wiedereinstieg in einen halb geschriebenen Satz.** Nie gemessen.
5. **Pausendauern an Abschnittsgrenzen.** Keine einzige Messung, in keiner Sprache.
6. **Pausendauern nach Textstruktur im Deutschen oberhalb des Satzes.** Keine.
7. **Der Zeitpunkt einer aufgabenbezogenen Rückmeldung.** Alle Unterbrechungsstudien verwenden
   aufgabenfremde Störungen. Die einzige Ausnahme ist Qin u. a. (2025), und die vergleicht „vor
   dem Denken" gegen „nach dem Denken", nicht Sekunden.
8. **Verlangte gegenüber ungefragter Rückmeldung.** Ob eine selbst abgeholte Rückmeldung
   billiger ist als eine zugestellte, ist nie geprüft worden — obwohl das die Grundannahme jedes
   „auf Zuruf"-Entwurfs ist.
9. **Eine Zeitkonstante für Flow.** Existiert nicht.
10. **Ob gutes Timing die Textqualität verbessert.** Die Bruchstellen-Forschung misst Gefühl und
    Reaktionszeit, nie das Ergebnis der unterbrochenen Arbeit.

**Konsequenz für die Prototyp-Runde:** Punkt 1 bis 5 sind mit vertretbarem Aufwand am eigenen
Werkzeug messbar — Onda hat den Text, die Tastenzeiten und die Grenzen ohnehin. Die Literatur
liefert dafür keine Zielwerte, aber sie liefert die richtigen Fragen und, entscheidend, die
Warnung, welche Zielgröße man **nicht** nehmen sollte (Wiedereinstiegszeit, siehe 4.5).

---

### Quellen

**Schreibpausen und Schwellenwerte**
- Baaijen, V. M., Galbraith, D. & de Glopper, K. (2012). Keystroke Analysis: Reflections on Procedures and Measures. *Written Communication* 29(3), 246–277. DOI 10.1177/0741088312451108
- Chenu, F., Pellegrino, F., Jisa, H. & Fayol, M. (2014). Interword and intraword pause threshold in writing. *Frontiers in Psychology* 5:182. DOI 10.3389/fpsyg.2014.00182
- Hall, S., Baaijen, V. M. & Galbraith, D. (2024). Constructing theoretically informed measures of pause duration in experimentally manipulated writing. *Reading and Writing* 37, 329–357. DOI 10.1007/s11145-022-10284-4 *(frei zugänglich)*
- Ivaska, I., Toropainen, O. & Lahtinen, S. (2025). Pauses during a writing process in two typologically different languages. *Journal of Writing Research* 16(3), 407–433. DOI 10.17239/jowr-2025.16.03.03
- Li, T. (2021). Identifying Mixture Components From Large-Scale Keystroke Log Data. *Frontiers in Psychology* 12:628660. DOI 10.3389/fpsyg.2021.628660
- Medimorec, S. & Risko, E. F. (2017). Pauses in written composition: on the importance of where writers pause. *Reading and Writing* 30(6), 1267–1285. DOI 10.1007/s11145-017-9723-7
- Torrance, M. & Conijn, R. (2024). Methods for studying the writing time-course. *Reading and Writing* 37, 239–251. DOI 10.1007/s11145-023-10490-8
- Van Waes, L. u. a. (2021). *Journal of Writing Research* 13(1), 107–153.
- Wengelin, Å. (2006). Examining pauses in writing: theory, methods and empirical data. In: *Computer Key-Stroke Logging and Writing*, Brill.
- Rosenqvist, S. (2015). *Developing pause thresholds for keystroke logging analysis.* Bachelorarbeit, Umeå universitet. *(studentische Arbeit, kein Gutachterverfahren)*
- Schilperoord, J. (1996). *It's about time: Temporal aspects of cognitive processes in text production.* Rodopi. *(nur aus zweiter Hand geprüft)*

**Blick und Schreiben**
- de Smet, M. J. R., Leijten, M. & Van Waes, L. (2018). Exploring the Process of Reading During Writing Using Eye Tracking and Keystroke Logging. *Written Communication* 35(4), 411–447. DOI 10.1177/0741088318788070
- Révész, A., Michel, M. & Lee, M. (2019). *Studies in Second Language Acquisition* 41(3).
- Torrance, M., Johansson, R., Johansson, V. & Wengelin, Å. (2016). Reading during the composition of multi-sentence texts. *Psychological Research* 80(5), 729–743.
- Wengelin, Å., Torrance, M., Holmqvist, K., Simpson, S. u. a. (2009). Combined eyetracking and keystroke-logging methods for studying cognitive processes in text production. *Behavior Research Methods* 41(2), 337–351. DOI 10.3758/BRM.41.2.337
- Wengelin, Å., Johansson, V., Frid, J. & Johansson, R. (2023). *Reading and Writing*.

**Deutsch**
- Fuchs, S. & Krivokapić, J. (2016). Prosodic Boundaries in Writing: Evidence from a Keystroke Analysis. *Frontiers in Psychology* 7:1678. DOI 10.3389/fpsyg.2016.01678

**Unterbrechung und Wiedereinstieg**
- Adamczyk, P. D. & Bailey, B. P. (2004). If not now, when? *CHI '04*, 271–278. DOI 10.1145/985692.985727
- Altmann, E. M. & Trafton, J. G. (2002). Memory for goals: an activation-based model. *Cognitive Science* 26(1), 39–83. DOI 10.1207/s15516709cog2601_2
- Altmann, E. M. & Trafton, J. G. (2007). Timecourse of recovery from task interruption. *Cognitive Science* 31(5), 745–770.
- Bailey, B. P. & Konstan, J. A. (2006). On the need for attention-aware systems. *Computers in Human Behavior* 22(4), 685–708. DOI 10.1016/j.chb.2005.12.009
- Borst, J. P., Taatgen, N. A. & van Rijn, H. (2010). The problem state: A cognitive bottleneck in multitasking. *JEP: LMC* 36(2), 363–382.
- Brumby, D. P., Cox, A. L., Back, J. & Gould, S. J. J. (2013). Recovering from an interruption. *JEP: Applied* 19(2), 95–107. DOI 10.1037/a0032696
- Gould, S. J. J., Brumby, D. P. & Cox, A. L. (2013). What does it mean for an interruption to be relevant? *HFES Proceedings*. DOI 10.1177/1541931213571034
- Iqbal, S. T. & Bailey, B. P. (2006). Leveraging characteristics of task structure to predict the cost of interruption. *CHI '06*, 741–750. DOI 10.1145/1124772.1124882
- Iqbal, S. T. & Bailey, B. P. (2008). Effects of intelligent notification management on users and their tasks. *CHI '08*, 93–102. DOI 10.1145/1357054.1357070 *(sowie Oasis, ACM TOCHI 17(4))*
- Katidioti, I. u. a. (2016). *Computers in Human Behavior* 63, 906–915.
- Keus van de Poll, M. & Sörqvist, P. (2016). Effects of Task Interruption and Background Speech on Word Processed Writing. *Applied Cognitive Psychology* 30(3), 430–439. DOI 10.1002/acp.3221
- Leroy, S. (2009). Why is it so hard to do my work? *OBHDP* 109(2), 168–181. DOI 10.1016/j.obhdp.2009.04.002
- Mark, G., Gonzalez, V. M. & Harris, J. (2005). No task left behind? *CHI '05*, 321–330. DOI 10.1145/1054972.1055017
- Mark, G., Gudith, D. & Klocke, U. (2008). The cost of interrupted work: more speed and stress. *CHI '08*, 107–110. DOI 10.1145/1357054.1357072
- McFarlane, D. C. (2002). Comparison of Four Primary Methods for Coordinating the Interruption of People in HCI. *Human–Computer Interaction* 17(1), 63–139. DOI 10.1207/S15327051HCI1701_2
- Mehrotra, A. u. a. (2016). My phone and me. *CHI '16*. DOI 10.1145/2858036.2858566
- Miller, R. B. (1968). Response time in man-computer conversational transactions. *AFIPS FJCC*. DOI 10.1145/1476589.1476628
- Monk, C. A., Trafton, J. G. & Boehm-Davis, D. A. (2008). The effect of interruption duration and demand on resuming suspended goals. *JEP: Applied* 14(4), 299–313. DOI 10.1037/a0014402
- Okoshi, T. u. a. (2015/2018). Attelia. *PerCom '15*, DOI 10.1109/PERCOM.2015.7146515; Feldeinsatz DOI 10.1016/j.pmcj.2018.07.005
- Trafton, J. G., Altmann, E. M., Brock, D. P. & Mintz, F. E. (2003). Preparing to resume an interrupted task. *IJHCS* 58(5), 583–603. DOI 10.1016/S1071-5819(03)00023-5

**Art der Rückmeldung**
- Arnold, K. C., Chauncey, K. & Gajos, K. Z. (2020). Predictive text encourages predictable writing. *IUI '20*, 128–138. DOI 10.1145/3377325.3377523
- Bhat, A., Aubin Le Quéré, M., Naaman, M. & Jakesch, M. (2026). Reactive Writers. *CHI '26*. DOI 10.1145/3772318.3791529
- Foroughi, C. K., Werner, N. E., Nelson, E. T. & Boehm-Davis, D. A. (2014). Do Interruptions Affect Quality of Work? *Human Factors* 56(7), 1262–1271. DOI 10.1177/0018720814531786
- Galletta, D. F., Durcikova, A., Everard, A. & Jones, B. M. (2005). Does spell-checking software need a warning label? *CACM* 48(7), 82–86.
- Hattie, J. & Timperley, H. (2007). The Power of Feedback. *RER* 77(1), 81–112. DOI 10.3102/003465430298487
- Kluger, A. N. & DeNisi, A. (1996). *Psychological Bulletin* 119(2), 254–284.
- McCarthy, K. S. u. a. (2022). Automated writing evaluation. *Assessing Writing* 52, 100608. DOI 10.1016/j.asw.2022.100608
- Qin, P. u. a. (2025). Timing Matters. *CHI '25*. DOI 10.1145/3706598.3713146
- Rønneberg, V., Torrance, M., Uppstad, P. H. & Johansson, C. (2022). The process-disruption hypothesis. *Psychological Research* 86, 2239–2255. DOI 10.1007/s00426-021-01625-z
- Scherer, S., Graham, S. & Busse, V. (2024). *Learning and Instruction*. DOI 10.1016/j.learninstruc.2024.101961
- Shute, V. J. (2008). Focus on Formative Feedback. *RER* 78(1), 153–189. DOI 10.3102/0034654307313795

**Flow**
- Abuhamdeh, S. (2020). Investigating the "Flow" Experience. *Frontiers in Psychology* 11:158. DOI 10.3389/fpsyg.2020.00158
- Csikszentmihalyi, M. & Larson, R. (1987). Validity and Reliability of the Experience-Sampling Method. *J Nerv Ment Dis* 175(9), 526–536. DOI 10.1097/00005053-198709000-00004
- Cutting, J. u. a. (2023). Difficulty-skill balance does not affect engagement and enjoyment. *Royal Society Open Science* 10(9). DOI 10.1098/rsos.220274
- Durcan, O., Holland, P. & Bhattacharya, J. (2024). *Communications Psychology* 2. DOI 10.1038/s44271-024-00115-3
- Fong, C. J., Zaleski, D. J. & Leach, J. K. (2015). The challenge–skill balance and antecedents of flow. *Journal of Positive Psychology* 10(5), 425–446. DOI 10.1080/17439760.2014.967799
- Løvoll, H. S. & Vittersø, J. (2014). Can Balance be Boring? *Social Indicators Research* 115(1), 117–136.
- Perry, S. K. (1999). *Writing in Flow.* Writer's Digest Books. *(Interviewstudie, keine Messung)*

**Verlässlichkeit**
- Dixon, S. R., Wickens, C. D. & McCarley, J. S. (2007). On the Independence of Compliance and Reliance. *Human Factors* 49(4), 564–572. DOI 10.1518/001872007X215656
- Wickens, C. D. & Dixon, S. R. (2007). The benefits of imperfect diagnostic automation. *Theoretical Issues in Ergonomics Science* 8(3), 201–212. DOI 10.1080/14639220500370105

---

*Die DOIs wurden gegen Crossref geprüft. Im Volltext gelesen wurden: Hall u. a. (2024),
Ivaska u. a. (2025), de Smet u. a. (2018), McFarlane (2002), Fuchs & Krivokapić (2016),
Rosenqvist (2015). Die übrigen Angaben stammen aus Abstracts, Verlagsseiten und Volltexten,
die von den Rechercheströmen geprüft wurden. Die Schilperoord-Zahl (1996) liegt nur aus
zweiter Hand vor und ist entsprechend markiert; ebenso die norwegische Neuauswertung in 2.3,
die als unveröffentlichtes Manuskript zitiert wird.*
