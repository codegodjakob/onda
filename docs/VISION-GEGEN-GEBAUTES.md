# Der Abstract gegen das Gebaute

**05.08.2026**, geprüft am Stand von Commit `edf21e7` und dem Arbeitsstand darüber.
Jeder Satz hier ist am Programmcode nachgesehen, nicht an einer Spezifikation. Die
Spezifikationen lagen schon zweimal falsch, und beide Male stand das Falsche länger
im Dokument als im Code.

Die Vorfassung dieses Dokuments (03.08.2026) sagte: **Onda ist ein Korrektor, der
Abstract beschreibt einen Denkpartner.** Das stimmt so nicht mehr. Was seitdem gebaut
wurde, hat die Lücke nicht geschlossen, aber sie hat eine andere Form bekommen — und
die alte Fassung würde heute an den falschen Stellen streng sein.

---

## Was Onda heute im Kern ist

Onda ist ein Schreibraum, in dem das Modell dasselbe sieht wie die schreibende
Person: nicht nur den offenen Text, sondern auch die Textart, das über alle Texte
des Projekts hinweg Behauptete und das, was sie selbst schon erkannt hat.

Aus diesem Blick kommen zwei getrennte Stimmen — eine, die sagt, wo etwas nicht
trägt, und eine, die sagt, wo ein Gedanke weiterträgt — und jede von beiden muss das
übertragbare Prinzip mitliefern, nicht nur den Einzelfall.

Was aus dieser Rückmeldung angenommen wird, bleibt an der Person hängen und nicht am
Dokument; damit gibt es in Onda zum ersten Mal etwas, das den einzelnen Text überlebt.

Das ist die Bauart. Ob sie hält, ist eine andere Frage — sie steht weiter unten.

---

## Anspruch für Anspruch

| # | Anspruch des Abstracts | Stand |
|---|---|---|
| 1 | Läuft vollständig auf dem eigenen Rechner | erfüllt |
| 2 | Texte jeder Art, vom Essay bis zur Prosa | teilweise |
| 3 | Gedanken präzisieren und schärfen | erfüllt |
| 4 | Gedanken erweitern, Neues und Zusammenhänge | teilweise |
| 5 | Hinter jedem Feedback das dahinterliegende System | erfüllt |
| 6 | Persönlicher Erkenntnishorizont über die Zeit | teilweise |
| 7 | Versteht den gesamten Kontext | teilweise |
| 8 | Cross-Pollination von Ideen | teilweise |
| 9 | Weiß, dass es eine KI ist, und meidet das Naheliegende | teilweise |
| 10 | Gibt keine Richtung vor, übernimmt nie das Ruder | erfüllt |
| 11 | Schreibstil entwickeln, Stilmittel einbauen | nicht |
| 12 | Merkt sich Stärken und Schwächen über längere Zeit | teilweise |
| 13 | Überprüft und verbessert sich selbst | nicht |
| 14 | Mühelos, fließend, Calm Technology | teilweise |

### 1. Läuft vollständig auf dem eigenen Rechner — erfüllt

Der Schlüssel liegt im Schlüsselbund und taucht in keiner Ausgabe auf. Das ist nicht
behauptet, sondern gemessen: `app/evals/pruefungen/schluessel-leck.mjs` durchsucht
den vollständigen Datenexport nach Schlüsselmustern und läuft in jedem Fertigzustands‑Lauf
mit. Der Export selbst liegt in `app/src/data-control.mjs` und kennt keinen fremden
Empfänger.

### 2. Texte jeder Art, vom Essay bis zur Prosa — teilweise

**Was jetzt da ist.** `app/src/textart-regeln.mjs` kennt neun Textarten und
beantwortet für jede eine einzige, sehr genaue Frage: Welche Hinweise sind hier
Integritätsfragen, also solche, die durch bloßes Wegklicken nicht verschwinden? Bei
einer wissenschaftlichen Arbeit alle vier — Tatsache, Quelle, Methode, Logik. Bei
einem Plakattext nur die Tatsache, weil dort niemand eine Fußnote erwartet. Bei
Prosa nur der Bruch im Gedankengang, weil die erfundene Tatsache dort das Handwerk
ist. Bei Lyrik keine einzige. Fehlt die Angabe, gelten alle vier — eine Sicherung
fällt nicht weg, nur weil ein Feld leer blieb (`STANDARD_INTEGRITAET`).

Die Regel kann außerdem nur enger machen, nie weiter: Das Modell darf eine Art
zusätzlich als Integritätsfrage melden, aber keine zurückholen, die die Textart
gerade ausgeschlossen hat (`istVonDerTextartAusgeschlossen`, benutzt in
`app/src/agent-findings.mjs`).

**Was fehlt.** Handwerk. Der Abstract verlangt, Onda solle „auf alle wichtigen
Aspekte achten, die zur Erstellung einer bestimmten Textart zu beachten sind". Der
Systemtext (`SYSTEM_COACH` in `app/src/agent-prompts.mjs`) nennt für jede Textart
dieselben acht Hinweisarten in derselben Reihenfolge. Die Textart erreicht das
Modell als ein einziges Wort — „Textsorte: Essay", gebaut in `textsorteBlock`
(`app/src/onda-kontext.mjs`). Was ein Essay verlangt und ein Webtext nicht, steht
nirgends im Code. Die Textart entscheidet heute, was **bindet**; sie entscheidet
nicht, wonach überhaupt **geschaut** wird.

### 3. Gedanken präzisieren und schärfen — erfüllt

Acht Hinweisarten, festgeschrieben im Schema (`HINWEISE_SCHEMA` in
`app/src/agent-tasks.mjs`), jede mit Anker, Beobachtung, Relevanz und Folge. Der
Anker muss wörtlich im Text stehen und wird nachgeprüft (`app/src/anchor-verify.mjs`),
sonst wird der Hinweis verworfen. Das war schon vorher der stärkste Teil des Systems
und ist es geblieben.

### 4. Gedanken erweitern, Neues und Zusammenhänge — teilweise

**Was jetzt da ist.** Ein zweiter Kanal, der nichts bemängelt: Erweiterungen, drei
Arten und mehr nicht (`app/src/erweiterung-model.mjs`). *weiterfuehrung* — der
Gedanke trägt weiter, als du ihn geführt hast. *feld* — ein Nachbargebiet, das du
noch nicht betreten hast. *verbindung* — zwei Stellen gehören zusammen. Die Zahl
der Anker folgt der Art (eine, keine, zwei), und wer die falsche Zahl liefert, wird
verworfen statt zurechtgebogen (`app/src/erweiterungslauf-model.mjs`).

Der Kanal hat einen eigenen Auftragstext (`ERWEITERUNG_ANWEISUNG`), bewusst getrennt
vom Hinweistext — ein Auftrag, der beides in einem Atemzug verlangt, färbt das eine
mit dem Ton des anderen. Und Erweiterungen werden **nirgends gezählt**: keine Zahl
neben einem Knopf, kein Eintrag in der Warteschlange. Das ist keine Absichtserklärung,
sondern gemessen (`app/evals/pruefungen/erweiterung-kein-posten.mjs`).

**Was offen ist.** Ob die Erweiterungen taugen, weiß niemand. Es gibt genau einen
Lauf an einem echten Text — den Prototyp zu Ticket 5
(`.scratch/rueckmeldung/prototyp/`), der zwei Fassungen verblindet nebeneinanderlegt
und darauf wartet, dass Jakob sagt, welche er als naheliegend erkennt. Dieses Urteil
steht aus. Bis es da ist, ist der ganze zweite Kanal gebaut und unbeurteilt.

### 5. Hinter jedem Feedback das dahinterliegende System — erfüllt

Das Feld `muster` ist Pflicht in **beiden** Kanälen: bei den acht Hinweisarten und
bei den drei Erweiterungsarten (`HINWEISE_SCHEMA` und `ERWEITERUNGEN_SCHEMA` in
`app/src/agent-tasks.mjs`, beide führen `muster` in `required`). Vorher war das nicht
nur nicht verlangt — es war unmöglich: Die Feldliste ist geschlossen
(`additionalProperties: false`), das Modell konnte ein Prinzip nicht einmal
freiwillig nachreichen.

Der Auftragstext erklärt, was ein Muster ist und was nicht: nicht „dieser Satz nennt
keine Quelle", sondern „eine Zahl, die das Argument trägt, braucht ihre Herkunft im
Satz daneben". Ein Muster, das nur auf diese eine Stelle passt, ist keines.

Das Feld steht im Schema zwischen `folge` und `vorschlag` — erst begreifen, warum es
zählt, dann verallgemeinern, dann erst eine Fassung anbieten. Bei strukturierter
Ausgabe ist diese Reihenfolge nicht Kosmetik, sie ist die Reihenfolge, in der das
Modell denkt. Und das Muster ist sichtbar: auf der Erweiterungskarte und in der
Detailansicht eines Hinweises (`app/src/workspace.js`).

Ein Unterschied bleibt bewusst: Bei einer Erweiterung ist das Muster der ganze
Ertrag, ein fehlendes verwirft den Eintrag. Bei einem Hinweis ist es eine Zugabe;
ein Hinweis ohne Muster wird nicht weggeworfen.

### 6. Persönlicher Erkenntnishorizont über die Zeit — teilweise

**Was jetzt da ist.** `app/src/erkanntes-model.mjs` — der erste Ort im Datenmodell,
der einem Menschen gehört und nicht einem Ding. Vorher hing alles am Dokument oder
am Projekt; es gab keine Stelle, die „Jakob" heißt. Das war kein fehlender Knopf,
das war ein fehlendes Substantiv.

Gespeichert wird ein Satz je Eintrag: das übertragbare Prinzip, nicht der Einzelfall.
Es gibt genau zwei Wege hinein (`merkeErkanntes` in `app/src/workspace.js`): eine
gemerkte Erweiterung und ein **angenommener** Hinweis. Verworfenes wandert nicht
hinein. Und es gibt die Rücknahme von Anfang an (`ueberholeErkanntes`) — ohne sie
wiederholte sich ein falscher Satz in jedem künftigen Text, und der Speicher
vergiftete sich selbst.

Im Prompt sagt der Block ausdrücklich „wiederhole dich nicht", nicht „schweige"
(`erkanntesBlock` in `app/src/onda-kontext.mjs`). Sonst würde Onda schlechter, je
mehr es weiß, und wer denselben Fehler zum fünften Mal macht, bekäme genau dann
keinen Hinweis mehr, wenn er ihn am nötigsten braucht.

**Was fehlt.** Der Abstract verlangt zwei Dinge, und das zweite ist nicht gebaut:
„Neues strukturiert in sein bisher Erkanntes einordnen." Die Liste ist flach. Sie ist
nach Häufigkeit sortiert (`erkanntesListe`) und kennt keine Ordnung, keine Themen,
keine Beziehung zwischen zwei Sätzen. Zwanzig Prinzipien sind zwanzig Zeilen, nicht
ein Wissensstand. Der Abgleich, ob zwei Sätze dasselbe meinen, ist bewusst stumpf —
er sieht nur Groß‑/Kleinschreibung und Satzzeichen (`schluesselFuer`). Das ist
richtig entschieden, aber es heißt eben auch: dieselbe Einsicht in anderen Worten
steht zweimal da.

### 7. Versteht den gesamten Kontext — teilweise

**Was jetzt da ist.** Bis zum Umbau baute genau eine Stelle die Anfrage an das
Modell, und sie las drei Felder: Projektverständnis, Dokumenttext und „das wurde
schon gesagt". Mehr sah das Modell nie. `app/src/onda-kontext.mjs` hängt jetzt an,
was Onda über das Projekt weiß — Textsorte und Stilprofil, den Aussagen‑Speicher über
alle Texte des Projekts, das freigegebene Gedächtnis und das Erkannte — und zwar an
**alle vier** Kanäle: Hinweise, Erweiterungen, Chat und Verständnisgespräch
(`hinweis-kontext.mjs`, `erweiterung-kontext.mjs`, `chat-kontext.mjs`,
`verstaendnis-kontext.mjs`).

Alles davon ist volatil, steht also hinter dem gecachten Präfix. Das ist kein
Aufräumen, das ist Geld: Ein Wissensblock im Präfix hätte den Zwischenspeicher
entwertet, sobald sich irgendeine Projektangabe ändert, und jede Anfrage danach wäre
voll zu bezahlen statt zu einem Zehntel. Jeder Block hat eine harte Obergrenze mit
begründeter Zahl im Code, und ein leerer Wert erzeugt gar keinen Block — nicht einen
leeren und nicht das Wort „unbekannt".

**Was fehlt.** „Der gesamte Kontext" ist mehr als diese Blöcke. Nicht mitgeschickt
werden: die Quellenbibliothek und die Belegbündel (`source-model.mjs`,
`evidence-bundle.mjs`), der Argumentgraph über die bloße Aussagenliste hinaus, die
Wirkungsanalyse (`effect-analysis.mjs`) und die Sprachbefunde
(`language-diagnostics.mjs`). Diese Teile rechnen weiter lokal vor sich hin und
erreichen das Modell nicht. Das Argumentmodell allein sind rund 1400 Zeilen ohne
seine Oberfläche, die Aussagen mit Mustersuche aus Sätzen schneiden — mit einer
Intelligenz zwei Dateien weiter, die sie nicht fragt.

**Und ein Fehler, der beim Prüfen aufgefallen ist.** Jedes Prinzip aus dem
Personen‑Speicher geht **zweimal** mit: einmal in seinem eigenen Block und einmal im
Gedächtnisblock, dort mit der Beschriftung „Ausdrücklich für dieses Projekt
freigegebenes Wissen". Beides ist falsch. Es ist bezahlte Doppelung in einem Modul,
dessen erste Regel Sparsamkeit heißt, und die Beschriftung behauptet eine Freigabe,
die niemand erteilt hat — ein Prinzip gilt über alle Projekte, gerade weil es nichts
mit diesem einen zu tun hat. Nachprüfbar mit einem Speicher, der nur Erkanntes
enthält: `baueOndaBloecke` liefert dann zwei Blöcke mit demselben Satz.

### 8. Cross-Pollination von Ideen — teilweise

Die Art *verbindung* ist genau dafür gebaut, und der Aussagen‑Speicher trägt jetzt
Aussagen aus **anderen Texten desselben Projekts** in die Anfrage — mit Titel, damit
das Modell den fremden Text beim Namen nennen kann (`aussagenBlock` in
`app/src/onda-kontext.mjs`). Das ist der eigentliche Gewinn dieses Blocks: Vorher sah
das Modell nur den offenen Text und konnte einem Kapitel widersprechen, das es nie
gelesen hatte.

Über Projektgrenzen hinweg passiert nichts. Die Filterregel prüft ausdrücklich auf
dieselbe Projekt‑Kennung; ein Gedanke aus einem anderen Projekt erreicht dieses
Projekt nicht. Das ist eine bewusste Setzung zum Schutz der Trennung, aber es
begrenzt genau die Kreuzbestäubung, die der Abstract meint.

### 9. Weiß, dass es eine KI ist, und meidet das Naheliegende — teilweise

**Was jetzt da ist.** Vorher stand diese Selbstwahrnehmung nur im Erweiterungskanal.
Jetzt steht sie auch im Systemtext, und zwar mit einer Einschränkung, die vorher
fehlte: Bei einer Tatsachenfrage oder einem fehlenden Beleg **ist** das Naheliegende
das Richtige — dort soll das Modell es sagen. Wertlos ist das Naheliegende bei
Struktur, Wirkung und Erklärung: Einen Hinweis, den jeder aufmerksame Leser sofort
gäbe, hatte die Autorin oder der Autor schon selbst (`SYSTEM_COACH`,
`app/src/agent-prompts.mjs`).

**Was offen ist.** Ob diese Vorkehrung wirkt, ist unbeurteilt — siehe Nummer 4. Der
verblindete Vergleich existiert, das Urteil darüber nicht. Das ist die einzige Stelle
in diesem Dokument, an der eine ausstehende Antwort eines Menschen der Engpass ist
und nicht fehlender Code.

### 10. Gibt keine Richtung vor, übernimmt nie das Ruder — erfüllt

Onda schreibt den Text nie selbst um. Das ist die älteste unverrückbare Regel,
durchgesetzt und gemessen (INV‑01). Es erfindet keine Quellen (INV‑03). Autorentscheidungen
binden, einmal Verworfenes wird nicht erneut vorgeschlagen (WORK‑03). Und mit der
Textart‑Regel ist eine Kleinigkeit dazugekommen, die genau hierher gehört: Wer einen
Quellenhinweis auf einem Plakattext wegklickt, nimmt seitdem **kein** „bewusst
angenommenes Risiko" mehr an — eine Mahnung für ein Versprechen, das niemand gegeben
hat, ist weg.

### 11. Schreibstil entwickeln, Stilmittel einbauen — nicht

Der Abstract verlangt, Onda helfe „an passenden Stellen Stilmittel einzubauen" und
„über Zeit einen oder mehrere feine, professionelle Schreibstile zu entwickeln".

Im Code gibt es Stilmittel an genau einer Stelle: `rhetoricDevice` in
`app/src/effect-analysis.mjs`. Das sind sieben Wortlisten — die erste springt auf
„zum Beispiel" an, die zweite auf „wie" oder „als ob", eine weitere auf sechs
festgelegte Bilder wie „ist eine Brücke" — und geben dann einen vorformulierten
Absatz aus. Ein Stilmittel, das keines dieser Wörter benutzt, kommt nicht vor. Das
Modell sieht diese
Befunde nie, und es wird nie nach einem Stilmittel gefragt. Von einer Entwicklung
über Zeit existiert kein Begriff — es gibt keinen Ort im Datenmodell, an dem ein
Stil einen Verlauf hätte.

### 12. Merkt sich Stärken und Schwächen über längere Zeit — teilweise

Der Personen‑Speicher ist der erste echte Schritt hierhin, und die Häufigkeitszahl an
jedem Satz ist näher an einer Schwäche, als es aussieht: Ein Prinzip, das fünfmal
angenommen wurde, ist ein Fehler, der fünfmal gemacht wurde.

Aber das steht nirgends so da, und es fehlt die andere Hälfte. Aufgezeichnet wird
nur, was **angenommen** wurde. Was wiederholt verworfen oder schlicht übergangen
wurde, hinterlässt keine Spur im Personen‑Speicher. Eine Schwäche zeigt sich aber
oft genau daran: nicht an dem, was jemand einsieht, sondern an dem, was er jedes Mal
wegklickt. Und „Stärke" hat im Code kein Gegenstück — nichts hält fest, was jemand
inzwischen beherrscht.

### 13. Überprüft und verbessert sich selbst — nicht

Gesucht nach jeder Schreibweise von Selbstverbesserung, Rückkopplung auf das eigene
Feedback, Nachjustieren der Interaktionsweise: kein Treffer, der etwas täte. Das
System misst seine eigene Rückmeldung nicht, vergleicht sie nicht mit dem, was
angenommen wurde, und ändert daraufhin nichts. Dieser Anspruch ist unangetastet.

### 14. Mühelos, fließend, Calm Technology — teilweise

**Was jetzt da ist.** Der Rhythmus. `app/src/momente-model.mjs` entscheidet für jede
der elf Rückmeldungsarten, in welchem Moment sie erscheinen darf: sofort, beim
Innehalten oder beim Aufschauen. Eine Formulierung erscheint sofort, weil sie dort,
wo sie steht, am billigsten zu ändern ist. Die vier Integritätsfragen warten auf den
abgeschlossenen Satz. Alles, was Abstand braucht — Aufbau, Wirkung, Erklärung und der
ganze zweite Kanal —, wartet aufs Aufschauen. Die Momente sind aufsteigend, nicht
ausschließend: Die Hand von der Tastatur zu nehmen nimmt nichts weg. Und jeder Moment
lässt sich von Hand ziehen — proaktiv heißt nie: warten müssen.

Dazu: höchstens drei Hinweise je Durchgang, höchstens drei Erweiterungen, und
Erweiterungen ohne jede Zählung.

**Was offen ist.** „Mühelos" ist nicht gemessen und mit den heutigen Mitteln auch
nicht messbar. Die sechs Gestalt‑Evals prüfen, dass die Oberfläche die entschiedene
Formensprache trägt — nicht, dass sich das Schreiben darin leicht anfühlt. Die
Schwellenwerte des Rhythmus (0,3 Sekunden hinter einer Satzgrenze, 3 Sekunden mitten
im Satz, 45 Sekunden bis zum Aufschauen) sind gesetzt, nicht gemessen; das steht
ausdrücklich in `docs/DIE-DREI-MOMENTE.md`.

---

## Was das Gebaute strukturell nicht einlösen kann

Die vier Punkte hier sind keine fehlenden Funktionen. Man kann sie nicht
nachprogrammieren, ohne vorher etwas zu entscheiden, was noch niemand entschieden
hat — oder ohne etwas zu haben, was Code nicht herstellen kann.

**1. Nichts davon ist je an einem echten Text durch die App gelaufen.** Der
Abnahmebericht zu Etappe A (`docs/ABNAHME-ETAPPE-A.md`) führt fünf von zehn
Kriterien als „braucht Live‑Prüfung mit echtem Schlüssel", und das ist seit dem
31.07.2026 unverändert. Alles, was seitdem gebaut wurde — die vier Wissensblöcke,
das Pflichtmuster, die Textart‑Regel, der Personen‑Speicher —, ist an der Anfrage
geprüft, nicht an der Antwort: Die Tests weisen nach, dass die Blöcke im echten
Anfragekörper landen, an der richtigen Stelle und ohne den Zwischenspeicher zu
entwerten. Ob ein Modell mit diesem Wissen bessere Rückmeldung gibt, hat noch
niemand gesehen. Der einzige Lauf an einem echten Text ist der Erweiterungs‑Prototyp,
und der war ein eigenes Skript, nicht die App.

Das ist kein fehlender Code. Es fehlt ein Durchgang: einen echten Text schreiben,
mit hinterlegtem Schlüssel, und lesen, was zurückkommt.

**2. „Meidet das Naheliegende" lässt sich nicht ohne Jakob prüfen.** Ob ein Gedanke
naheliegend ist, hängt daran, was der Leser schon wusste. Es gibt keinen
maschinellen Ersatz dafür — jede automatische Prüfung würde etwas anderes messen
(Seltenheit der Wörter, Länge, Abweichung vom Durchschnitt) und dabei so aussehen,
als hätte sie die Sache gemessen. In diesem Projekt haben schon drei Evals die
falsche Sache gemessen; das hier wäre das vierte. Deshalb ist der verblindete
Vergleich der richtige Weg und sein Ausstehen kein Versäumnis, sondern der Stand.

**3. „Neues strukturiert einordnen" verlangt eine Ordnung, die niemand entschieden
hat.** Der Personen‑Speicher könnte Prinzipien gruppieren — aber wonach? Nach
Hinweisart? Nach Textart? Nach einem Themenbaum, den jemand pflegen müsste? Jede
dieser Antworten ist eine Produktentscheidung mit Folgen, und die falsche wäre
schlimmer als keine: Eine Ordnung, die nicht zum Denken der Person passt, macht das
Nachschlagen schwerer als eine flache Liste. Das ist eine offene Designfrage, keine
offene Aufgabe.

**4. „Verbessert sich selbst" braucht ein Urteil darüber, was besser ist.** Das
System kann zählen, was angenommen und was verworfen wurde. Daraus zu schließen, das
Angenommene sei das Bessere, wäre falsch: Ein unbequemer, richtiger Hinweis wird
öfter verworfen als ein bequemer, belangloser. Ein System, das sich an der
Annahmequote optimiert, wird gefälliger, nicht besser — und zwar messbar gefälliger,
also mit einer Zahl, die den Rückschritt als Fortschritt ausweist. Solange niemand
sagen kann, woran gute Rückmeldung erkannt wird, ist Selbstverbesserung nicht
gefahrlos baubar. Das ist der einzige Punkt in diesem Dokument, bei dem Nichtbauen
die bessere Entscheidung sein könnte.

---

## Was daran Setzung ist und kein Messergebnis

Vieles im Vorstehenden klingt begründet, weil es begründet ist. Begründet heißt nicht
gemessen. Diese Punkte sind mit Verstand gesetzt und könnten trotzdem falsch sein:

**Die Tabelle Art → Moment.** Elf Zeilen, jede mit einer Begründung, keine davon an
einem Menschen erprobt. Dass eine Strukturfrage Abstand braucht und eine Formulierung
nicht, ist plausibel — es ist nicht beobachtet. Steht so auch in
`docs/DIE-DREI-MOMENTE.md`.

**Die drei Schwellenwerte.** 0,3 Sekunden, 3 Sekunden, 45 Sekunden. Gesetzt.

**Die Tabelle Textart → Integritätsfragen.** Neun Zeilen. Dass ein Essay die
Methodenfrage nicht braucht und Prosa nur die Logik, ist eine Auslegung dessen, was
ein Text seinem Publikum schuldet. Es ist eine gute Auslegung, aber niemand hat einen
Prosaschreiber gefragt.

**Die Obergrenzen im Kontext.** Zehn Aussagen, acht Gedächtniseinträge, 25
Prinzipien. Die Begründungen im Code rechnen mit Tokenpreisen und mit dem, was ein
Modell noch einhalten kann. Beides sind Schätzungen. Ob bei elf Aussagen die Antwort
schlechter würde, hat niemand ausprobiert.

**Dass das Muster im Hinweis eine Zugabe ist und in der Erweiterung der ganze
Ertrag.** Daraus folgt, dass ein Hinweis ohne Muster durchgeht und eine Erweiterung
ohne Muster verworfen wird. Das ist eine Setzung über den Wert der beiden Kanäle,
nicht ein Befund.

**Dass nur Angenommenes in den Personen‑Speicher wandert.** Das schützt vor
Vergiftung durch schlechte Hinweise und kostet dafür jede Spur des Übergangenen —
siehe Nummer 12. Welche Seite dieses Tauschs schwerer wiegt, ist unbekannt.

**Dass die Ebene der Person keine Grenzen zwischen Projekten kennt, der
Aussagen‑Speicher aber schon.** Ein Prinzip gilt über alle Projekte, eine Aussage
nur im eigenen. Das ist stimmig begründet und trotzdem eine Wahl: Genau an dieser
Grenze endet die Kreuzbestäubung aus Nummer 8.

**Und dieses Dokument selbst.** Die Einteilung in erfüllt, teilweise und nicht ist
ein Urteil, kein Messwert. Wo „erfüllt" steht, gibt es eine Prüfung, die frisch
läuft. Wo „teilweise" steht, steht dahinter eine Abwägung, die jemand anders anders
treffen könnte.

---

## Was der Abnahmekatalog daraus mitnimmt

Die Vorfassung sagte, dem Katalog fehle „eine ganze Dimension": alles zum Wachsen.
Vier Bereiche waren seitdem gebaut und im Katalog nicht vorhanden. Am 05.08.2026 sind
sie nachgetragen — vier Suiten, 23 Evals, jedes an eine Prüfung gebunden, die im
selben Lauf frisch ausgeführt wird (`app/evals/v2-fertigzustand.json`, Fassung
`2026-08-05.1`):

- **KONTEXT** — was das Modell zu sehen bekommt: dass jedes Wissen jeden Kanal
  erreicht, dass keines im teuren Zwischenspeicher landet, dass Unbekanntes gar
  keinen Block erzeugt.
- **MUSTER** — dass jede der elf Rückmeldungsarten ihr übertragbares Prinzip
  mitliefert, als Pflichtfeld in einer geschlossenen Liste, und dass es zu sehen ist.
- **TEXTART** — dass die Textart entscheidet, was bindet; dass eine fehlende Angabe
  keine Sicherung wegnimmt; dass die Regel nur enger machen kann.
- **PERSON** — dass es einen Ort gibt, der einem Menschen gehört; dass nur
  Angenommenes hineinkommt; dass jeder Satz zurücknehmbar ist.

**Wachstum ist bewusst keine eigene Suite geworden.** Es steckt in MUSTER und PERSON,
also im Kanal selbst. Das entspricht der Korrektur vom 03.08.: Es gibt keine zweite
Maschine, die die schreibende Person schult. Das Wachstum geschieht durch die
Bemerkungen selbst.

Was der Katalog weiterhin nicht kennt und mit heutigen Mitteln nicht kennen kann:
ein Eval für „mühelos", eines für „nicht naheliegend" und eines für „das System ist
besser geworden". Die ersten beiden brauchen einen Menschen. Das dritte braucht
zuerst eine Antwort darauf, was besser heißt.

Und eine Warnung, die zu diesem Nachtrag gehört: Alle 23 messen die **Bauart**, nicht
die **Wirkung**. Sie belegen, dass das Wissen ankommt, dass das Prinzip verlangt wird
und dass die Textart durchgereicht wird. Keines davon belegt, dass die Rückmeldung
dadurch besser geworden ist. Das kann erst der Durchgang an einem echten Text zeigen,
und der steht aus.
