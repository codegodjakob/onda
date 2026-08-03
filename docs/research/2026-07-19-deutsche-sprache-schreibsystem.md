# Forschungsnotiz: Deutsche Sprache als Grundlage des Schreibsystems

> Stand: 2026-07-19. Fokus: Norm, Grammatik, Informationsstruktur, Wortbildung, Standardvariation, Korpusgebrauch, Register, Verständlichkeit und sprachliche Wirkung.

## Kurzfazit

Es gibt keinen empirisch haltbaren deutschen Einheitsstil, den ein Schreibagent pauschal maximieren könnte. Sprachliche Qualität entsteht aus der Passung von Textsorte, Teiltextfunktion, Fach, Publikum und Evidenzstatus. Oberflächenmerkmale wie Satzlänge, Nominalisierungsquote oder Konnektorzahl sind nützliche Warnsignale, aber keine eigenständigen Qualitätsziele.

Für das System folgt daraus: erst Kommunikationssituation und Diskursfunktion modellieren, dann mit einem passenden Vergleichskorpus diagnostizieren, schließlich Varianten anbieten und ihre Wirkung am konkreten Text prüfen.

## 1. Norm ist nur eine Schicht

Seit dem 1. Juli 2024 gilt das neue amtliche Regelwerk für Schule und Verwaltung in allen deutschsprachigen Staaten und Regionen; es normiert Rechtschreibung und Zeichensetzung, nicht jedoch einen einzigen guten Stil ([Rat für deutsche Rechtschreibung](https://www.rechtschreibrat.com/amtliche-deutsche-rechtschreibung-ueberarbeitetes-regelwerk-und-neufassung-woerterverzeichnis-fuer-schule-und-verwaltung-verbindlich/), [Regelwerk 2024](https://www.rechtschreibrat.com/DOX/RfdR_Amtliches-Regelwerk_2024.pdf)). Grammatische Wohlgeformtheit, üblicher Gebrauch, Registerpassung und kommunikative Wirkung sind davon getrennte Fragen.

**Systemfolge:** Hinweise müssen ihren Status nennen: *Normverstoß*, *grammatisch auffällig*, *im Zielregister selten*, *möglicherweise schwer verständlich* oder *Wirkungshypothese*. Nur die ersten Kategorien dürfen als Fehler erscheinen; stilistische Entscheidungen bleiben begründete Vorschläge.

## 2. Syntax und Informationsstruktur

Das Deutsche organisiert Sätze über Satzklammer sowie Vor-, Mittel- und Nachfeld. Wortstellung erfüllt grammatische, semantische und informationsstrukturelle Funktionen: Sie bildet Satztypen, bindet einen Satz in den Kontext ein und gewichtet Bekanntes gegenüber Neuem ([IDS: topologisches Feld](https://grammis.ids-mannheim.de/terminologie/362), [IDS: Wortstellung](https://grammis.ids-mannheim.de/progr%40mm/5260), [IDS: Informationsstruktur](https://grammis.ids-mannheim.de/kontrastive-grammatik/4463)). Experimente zur Online-Verarbeitung zeigen zugleich Präferenzen und unterschiedliche Verarbeitungskosten je nach Verbposition; grammatisch mögliche Varianten sind daher nicht automatisch gleich leicht zu lesen ([Weyerts et al. 2002](https://doi.org/10.1023/A:1015588012457)).

**Systemfolge:** Nicht bloß Satzlänge zählen. Der Agent soll Satzklammern, Abhängigkeitslängen, Vorfeldfokus, gegeben-neu-Verlauf und späte Bedeutungsauflösung analysieren. Er darf eine lange Konstruktion nur dann aufbrechen, wenn argumentative Beziehung und kommunikative Gewichtung erhalten bleiben.

## 3. Wortbildung und pragmatische Feinsteuerung

Nominale Komposition ist im Deutschen hochproduktiv ([IDS: Komposition](https://grammis.ids-mannheim.de/systematische-grammatik/585)). Lange Komposita können präzise Fachbegriffe, transparente Neubildungen oder idiomatische Einheiten sein; automatische Zerlegung muss deshalb Form, Bedeutung und Kontext gemeinsam prüfen ([Krotova et al. 2020](https://aclanthology.org/2020.lrec-1.543/)). Ad-hoc-Komposita können sogar Haltung transportieren, was allgemeine Sprachmodelle nur unzuverlässig erfassen ([Yu et al. 2024](https://aclanthology.org/2024.mwe-1.27/)).

Abtönungspartikeln wie *ja*, *doch* oder *eben* beziehen Erwartungen und geteilten Kontext ein und sind besonders in gesprochennahen Registern relevant ([IDS: Abtönungspartikel](https://grammis.ids-mannheim.de/terminologie/2)). Sie sind weder bedeutungsleere Füllwörter noch automatisch für jeden schriftlichen Text geeignet.

**Systemfolge:** Kompositum-, Partikel- und Nominalstilhinweise werden nach Transparenz, Register und Funktion ausgelöst, nicht nach Wortlänge oder Verbotslisten. Für dialogische Copy kann eine Partikel genau die gewünschte Nähe erzeugen; in einer wissenschaftlichen Behauptung wäre dieselbe Form oft unpassend.

## 4. Plurizentrik und Projektkonventionen

Deutsch besitzt legitime Standardvariation in Deutschland, Österreich und der Deutschschweiz. Empirische Arbeiten dokumentieren regionale Unterschiede in Gebrauch, Bewertung und Kodifizierung; auch Wortbildung variiert ([Schmidlin 2011](https://pub.ids-mannheim.de/extern/slg/slg106.html)). Hinzu kommen Fach-, Hochschul-, Verlags- und Markenrichtlinien sowie bewusste Entscheidungen zur geschlechtergerechten Sprache.

**Systemfolge:** Das Projekt erhält ein korrigierbares Sprachprofil mit Region, Institution, Fach und Hausstil. Varianten dürfen nicht als Fehler markiert werden, nur weil sie außerhalb des deutschen Deutschland-Standards liegen. Bei umstrittenen Formen zeigt das System Normstatus, Kontextregel und Konsistenz getrennt.

## 5. Register und Korpusbefunde

**Belastbar:** Korpusaussagen gelten nur für die jeweils erhobene Sprachdomäne. Das IDS empfiehlt deshalb virtuelle Teilkorpora, die zur Forschungsfrage und Zieldomäne passen; seine Textsortenlabels sind historisch gewachsen, nicht vollständig und teils aus fehleranfälligen Quelldaten übernommen ([KorAP/DeReKo](https://korap.ids-mannheim.de/doc/corpus), [IDS-Textklassifikation](https://www2.ids-mannheim.de/cosmas2/projekt/referenz/textklassifikation.html)). Rohe Gesamthäufigkeiten sind somit kein neutraler Maßstab für „gutes Deutsch“.

Das DFG-Projekt GECCo untersucht Kohäsion in 14 Registern, darunter Essay, populärwissenschaftlicher Text, Aktionärsbrief, Tourismusprospekt sowie Unternehmens- und Organisationswebseite. Die dokumentierte Variation zwischen Registern stützt getrennte statt globale Stilprofile ([DFG-Ergebnisbericht](https://gepris.dfg.de/gepris/projekt/189428651/ergebnisse), [CLARIN-Korpusbeschreibung](https://fedora.clarin-d.uni-saarland.de/gecco/)).

Auch innerhalb der Wissenschaft variiert der Gebrauch. In Steinhoffs Korpus aus 99 Fachartikeln lag *ich* bei 0,74 Vorkommen je 1.000 Wörter in der Linguistik, 0,35 in der Literaturwissenschaft und 0,16 in der Geschichtswissenschaft; rund 40 % der Texte kamen ohne *ich* aus. Das widerlegt ein allgemeines „Ich-Verbot“, begründet aber ebenso wenig ein „Ich-Gebot“ ([Steinhoff 2007](https://docenti.unimc.it/antonella.nardi/teaching/2024/30271/files/lesematerialien-1/steinhoff-2007)). Eine Pilotstudie mit 14 linguistischen Fachartikel-Einleitungen fand die Makrostruktur stärker durch Forschungsfrage und Methode bestimmt als durch eine starre Fachschablone ([Huemer 2016](https://doi.org/10.13092/lo.76.2814)).

**Systemfolge:** Jede Diagnose braucht mindestens Genre/Textsorte, Teiltextfunktion, Fach oder Markt, Publikum und gewünschte Wirkung. Vergleichswerte sollen aus passenden Teilkorpora stammen und ihre Datengrundlage anzeigen.

## 6. Verständlichkeit und einfache Sprache

**Belastbar:** Lesbarkeit ist nicht gleich Verstehen. Der Hohenheimer Verständlichkeitsindex kombiniert vier Formeln mit Satz- und Wortlängen sowie gesetzten Benchmarks; er misst damit vor allem sprachliche Oberfläche, nicht den tatsächlichen Wissensaufbau einer Zielgruppe ([Universität Hohenheim](https://klartext.uni-hohenheim.de/hix)). Er eignet sich als Hinweisgeber, nicht als Beweis für Verständlichkeit.

Kontrollierte Studien zeigen keine universelle Wirkung von Vereinfachung. Drei randomisierte Prä-Post-Studien zu Physik- und Chemietexten fanden für die eingesetzten Vereinfachungen keinen Lernvorteil ([Härtig et al. 2019](https://doi.org/10.1007/s40573-019-00105-7)). Dagegen verstanden 436 Schülerinnen und Schüler der Klassen 3 bis 6 nach empirisch fundierten Regeln entlastete Schulbuchtexte signifikant besser als die Originale ([Bormann, Reggentin & Böhme 2025](https://doi.org/10.31244/jero.2025.01.02)). Material, Zielgruppe und konkrete Eingriffe sind daher Teil des Effekts.

Die partizipative LeiSA-Forschung betont die Text-Leser-Interaktion statt universeller Regeln. In einem Test sank etwa die korrekte Erkennung einer Nachricht als Textsorte bei „Leichte-Sprache“-Gestaltung von über 83 % auf gut 45 %; sprachliche Entlastung kann also kommunikative Orientierung verlieren ([LeiSA-Ergebnisbericht](https://leisa-leichtesprache.uni-koeln.de/pdfs/leichte-sprache-kein-regelwerk.pdf)).

**Stilmythos:** „Kurze Wörter und Sätze machen jeden Text verständlich.“ Die Studien tragen nur kontextgebundene Effekte; Vorwissen, Informationsauswahl, Kohärenz, Textfunktion und Gestaltung bleiben eigenständige Faktoren.

**Systemfolge:** Lesbarkeitswerte als Warnungen ausgeben, nie als Gesamtnote. Bei Vereinfachungen müssen Aussagegehalt, notwendige Fachbegriffe, Textsortensignal und Leserziel erhalten bleiben. Für wichtige Texte sind Aufgaben- oder Verständnistests mit der realen Zielgruppe aussagekräftiger als Formelwerte.

## 7. Modalität und Hedging

Hedges sind keine feste Wortliste, sondern kontextabhängige Funktionen: Derselbe Ausdruck kann Unsicherheit markieren, eine Behauptung rhetorisch mäßigen oder eine Gegenposition rahmen. Eine kontextsensitive deutsche Korpusstudie zeigt, dass reine Trefferzählungen einen großen Teil dieser Funktionen verfehlen ([Bender 2025](https://doi.org/10.1007/s41244-025-00378-1)).

**Belastbar innerhalb der untersuchten Genres:** In einem Korpus von je 170 deutschen und chinesischen linguistischen Fachartikeln traten Hedges besonders in Ergebnis- und Diskussionsteilen auf; deutsche Artikel bevorzugten in der verwendeten Taxonomie schwache bis mittlere Modalität ([Korpusstudie 2022](https://pmc.ncbi.nlm.nih.gov/articles/PMC9513629/)). Ein separates Korpus mit 60 deutschen medizinischen Forschungsartikeln fand ebenfalls mehr Hedges in Diskussionen als in Einleitungen ([Carvalho 2011](https://repositorio.ufc.br/handle/riufc/6644)). Das spricht für teiltextbezogene Evidenzkalibrierung, nicht für eine pauschale Hedge-Quote.

In Kranichs Korpus populärwissenschaftlicher Texte verwendeten englische Originale epistemische Marker häufiger als deutsche Originale; Übersetzungen lagen dazwischen. Deutsche Originale markierten eher höhere Wahrscheinlichkeit als bloße Möglichkeit. Das Ergebnis ist genre- und sprachpaarbezogen, warnt aber vor mechanisch übersetzten Unsicherheitssignalen ([Kranich 2011](https://doi.org/10.1515/text.2011.004)).

**Stilmythos:** „Hedging macht Aussagen schwach.“ Funktionales Hedging hält Behauptungsstärke, Datenlage und Reichweite zusammen; problematisch sind unmotivierte Vagheit und eine vom Belegstatus abweichende Sicherheit.

**Systemfolge:** Für jede überprüfbare Aussage getrennt speichern: Quelle, Evidenzart, Reichweite, Unsicherheit, Attribution und Behauptungsstärke. Formulierungen erst danach wählen. Warnen, wenn Wortlaut und Evidenzstatus auseinanderlaufen, statt Modalwörter global zu entfernen oder hinzuzufügen.

## 8. Nominalstil

**Befundlage:** Dass fachliche Texte nominal verdichten, ist für einzelne Domänen gut belegt; eine allgemeine Verständlichkeitswirkung ist deutlich schwächer abgesichert. Das Gingko-Projekt untersucht 2.498 automobiltechnische Fachartikel mit rund 4,7 Millionen Token und zeigt, dass angenommene nominale Muster nach semantischer Relation und fachlichem Inhalt differenziert werden müssen ([Universität Leipzig: Gingko](https://www.philol.uni-leipzig.de/herder-institut/forschung/projekte/laufende-projekte/gingko)). Die Evidenz rechtfertigt weder „wissenschaftlich = möglichst nominal“ noch „Nominalisierung = grundsätzlich schlecht“.

**Systemfolge:** Kein globaler Nominalstil-Score. Lokal prüfen, ob eine Nominalisierung einen etablierten Fachgegenstand knapp wiederaufnimmt oder ob sie Handelnde, zeitliche Beziehungen und Verantwortlichkeit unnötig verdeckt. Eine verbale Variante ist ein Vergleichsangebot; entschieden wird nach Präzision, Informationsdichte und Genrepassung.

## 9. Kohäsion und Konnektoren

Konnektoren machen Diskursrelationen sichtbar, helfen aber nicht gleichmäßig. Zwei Leseexperimente mit deutschen und englischen Sätzen fanden im Deutschen einen deutlicheren Verarbeitungsvorteil bei explizit markierten konzessiven Relationen, nicht aber bei Ergebnisrelationen; der Effekt hing also von der Relation ab ([Marchal et al. 2025](https://doi.org/10.3389/flang.2025.1721510)). Ein deutsches Crowdsourcing-Experiment zu *trotzdem* und *dennoch* zeigt zusätzlich, dass semantische Plausibilität und eingeschobenes Material beeinflussen, worauf Leser den Konnektor beziehen ([Clausen & Stede 2022](https://doi.org/10.1515/lingvan-2021-0102)).

Korpusdaten bestätigen Genrevariation: Kausalkonnektoren kamen in argumentativen Schülertexten mit 4,88, in Zeitungskommentaren mit 2,32 und in Facebook-Texten mit 1,87 Vorkommen je 1.000 Wörter vor; auch die Verteilung von *da*, *denn* und *weil* unterschied sich deutlich ([Abel & Glaznieks 2020](https://ids-pub.bsz-bw.de/files/9919/Abel_Glaznieks_Kohaerenz_digital_2020.pdf)).

**Stilmythos:** „Mehr Verbindungswörter erzeugen mehr Kohärenz.“ Konnektoren signalisieren bereits vorhandene semantische Beziehungen; ein unpassender oder fern angebundener Marker kann die Interpretation erschweren.

**Systemfolge:** Zuerst die Relation zwischen Passagen bestimmen, etwa Ursache, Folge, Gegensatz, Einräumung, Präzisierung oder Beispiel. Dann prüfen, ob sie inferierbar, explizit zu markieren oder bereits übermarkiert ist. Variation darf nie die Relation verändern.

## 10. Genreprofile für den Schreibagenten

- **Wissenschaftliche Arbeiten:** mit fach- und teiltextnahen Referenzen vergleichen; Behauptungsstärke, Attribution und Abschnittsfunktion priorisieren; Ich-Gebrauch funktional statt dogmatisch behandeln.
- **Essays:** gedankliche Bewegung, Autorposition und Übergänge erhalten; nicht durch Oberflächenmerkmale wissenschaftlicher Artikel normieren.
- **Web-, Marketing- und Designtexte:** als getrennte Register und Aufgaben behandeln. Verständlichkeit auf Finden, Verstehen und Handeln beziehen; Kürze oder HIX-Wert allein sind kein Erfolgsmaß. Tatsachen- und Evidenzstatus dürfen durch Zuspitzung nicht verändert werden.
- **Alle Genres:** Ein stilistischer Vorschlag nennt Zweck, erwarteten Gewinn, möglichen Bedeutungsverlust und Evidenzsicherheit. Wirkungsannahmen für Marketing- oder Designtexte bleiben Hypothesen, bis Nutzertests sie stützen.

## 11. Empfohlene innere Architektur

1. **Kontextprofil:** Genre, Untergenre, Teiltextfunktion, Fach/Markt, Publikum, Medium und Zielhandlung.
2. **Bedeutungsebene:** Aussagen, Referenten, Diskursrelationen, Evidenz und Unsicherheit unabhängig vom Wortlaut halten.
3. **Registerdiagnose:** nur mit dokumentierten, vergleichbaren Teilkorpora; Häufigkeiten samt Quelle und Streuung zeigen.
4. **Mehrdimensionale Prüfung:** Lesbarkeit, tatsächliche Verständlichkeit, Kohäsion, Präzision, Informationsdichte und Stimme getrennt bewerten.
5. **Revision:** kleine begründete Varianten anbieten; keine automatische Vereinheitlichung von Pronomen, Hedges, Nominalisierungen oder Konnektoren.
6. **Evaluation:** eigene Testsätze je Genre und Zielgruppe; Bedeutungstreue maschinell prüfen, Wirkung mit Lesenden bzw. realen Aufgaben messen.

Für die technische Analyse sollten sprachspezifische Ressourcen die LLM-Auswertung ergänzen: DeReKo/KorAP für belegten Gebrauch, grammis für Grammatik und Normwissen, GermaNet für lexikalisch-semantische Beziehungen sowie deutsche Universal-Dependencies-Baumbanken für Morphologie und Syntax. Die große HDT-UD-Baumbank umfasst 206.794 Sätze mit 3,8 Millionen Token, ist aber domänenspezifisch und daher kein allgemeines Stilnormal ([UD German-HDT](https://universaldependencies.org/treebanks/de_hdt/index.html), [GermaNet](https://uni-tuebingen.de/en/142806)).

Der robuste gemeinsame Nenner ist damit kein Katalog verbotener Formen, sondern kontrollierte Passung: Eine Form ist gut, wenn sie in genau diesem Genre und an genau dieser Stelle Bedeutung, Evidenz und Leseraufgabe zuverlässig trägt.
