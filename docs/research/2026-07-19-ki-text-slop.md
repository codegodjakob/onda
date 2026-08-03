# Forschungsnotiz: Typische Qualitätsprobleme LLM-generierter Texte

> Kurzrecherche vom 2026-07-19. Fokus: empirische Primärforschung zu Textqualität, Faktentreue und Wirkungsrisiken. Nichtwissenschaftliche Pattern-Listen und Detektorwerbung sind bewusst ausgeklammert.

## 1. Kurzfazit

"KI-Text-Slop" ist keine einheitliche wissenschaftliche Kategorie. Der umgangssprachliche Eindruck entsteht aus mehreren unterscheidbaren Problemen:

- geringe stilistische, semantische oder diskursive Varianz
- wiederkehrende lexikalische, syntaktische und formatbezogene Muster
- unnötige Länge und scheinbare Vollständigkeit ohne zusätzlichen Erkenntniswert
- flüssig formulierte, aber unbelegte oder falsche Aussagen und Quellen
- nicht zur tatsächlichen Beleglage passende Sicherheit
- hohe Überzeugungskraft, die Wahrheit und Vertrauen entkoppeln kann
- Rückkopplung synthetischer Texte, durch die seltene Formen und Perspektiven verloren gehen können

Das Produkt sollte daher keinen einzelnen "Slop-Score" und keine Wortverbotsliste verwenden. Es braucht voneinander getrennte Prüfungen für Bedeutung, Evidenz, Diskursfunktion, sprachliche Eigenständigkeit, Informationswert und kommunikative Wirkung.

## 2. Belastbare Befunde

### Stilistische Homogenisierung und Textsignaturen

- In einem randomisierten Schreibexperiment wurden mit LLM-Ideen verfasste Kurzgeschichten im Mittel als kreativer und besser geschrieben bewertet, waren untereinander aber ähnlicher als rein menschlich verfasste Geschichten. Individueller Qualitätsgewinn und kollektiver Diversitätsverlust können also gleichzeitig auftreten ([Doshi & Hauser 2024](https://doi.org/10.1126/sciadv.adn5290)).
- Eine Analyse von Texten aus acht Domänen und elf LLMs fand bei menschlichen Texten größere semantische und merkmalsbezogene Variation; neuere Modelle ähnelten einander stilistisch stärker ([Zanotto & Aroyehun 2025](https://aclanthology.org/2025.emnlp-main.1163/)).
- LLM-Ausgaben enthalten häufiger wiederkehrende syntaktische Schablonen als menschliche Referenztexte. 76 Prozent der in Modelltexten gefundenen Templates ließen sich in Pretraining-Daten nachweisen, gegenüber 35 Prozent bei menschlichen Texten; Alignment und RLHF beseitigten diese Muster nicht zuverlässig ([Shaib et al. 2024](https://aclanthology.org/2024.emnlp-main.368/)).
- In mehr als 15 Millionen PubMed-Abstracts stieg nach Verbreitung von LLMs die Häufigkeit bestimmter stilprägender Wörter abrupt. Der Befund funktioniert auf Korpusebene, erlaubt aber ausdrücklich keine sichere Zuschreibung einzelner Texte ([Kobak et al. 2025](https://doi.org/10.1126/sciadv.adt3813)).

**Einordnung:** Ein häufiges Wort, eine komplexe Syntax oder ein wiederkehrendes Muster ist für sich genommen kein Qualitätsfehler und kein Autorschaftsnachweis. Relevant werden Muster erst durch Häufung, fehlende lokale Funktion, geringe Variation oder Unpassung zum Projektstil.

### Schematische Diskursstruktur und Übererklärung

- Hierarchische Diskursanalysen zeigen unterschiedliche Motive in menschlichen und maschinellen Texten; menschliche Texte wiesen über Domänen hinweg mehr strukturelle Variation auf. Die Signale blieben teilweise auch bei paraphrasierten und domänenfremden Texten erhalten ([Kim et al. 2024](https://aclanthology.org/2024.acl-long.298/)).
- Präferenzmodelle, GPT-4 und auch menschliche Bewertungen können längere Antworten sowie Listen, Links und Hervorhebungen bevorzugen, selbst wenn die inhaltliche Qualität gleich oder geringer ist. Weniger als ein Prozent gezielt verzerrter Trainingsdaten konnte deutliche Formatpräferenzen in Reward-Modellen erzeugen ([Zhang et al. 2025](https://aclanthology.org/2025.acl-long.1308/)).
- In Verhaltensexperimenten erhöhten längere LLM-Erklärungen das Vertrauen der Leser, obwohl die zusätzliche Länge die Antwortgenauigkeit nicht verbesserte ([Steyvers et al. 2025](https://doi.org/10.1038/s42256-024-00976-7)).

**Einordnung:** Das Problem ist nicht Länge an sich, sondern eine falsche Kopplung von Länge, sichtbarer Ordnung und vermeintlicher Gründlichkeit. Eine ausführliche Passage ist gerechtfertigt, wenn sie zusätzliche Belege, Unterscheidungen oder notwendige Schlussbrücken trägt.

### Halluzination, Quellen und Zitate

- FACTSCORE zerlegt Langtexte in atomare Tatsachenbehauptungen. Bei den untersuchten Personenbiografien erreichte ChatGPT 58 Prozent gestützte atomare Fakten; einzelne Sätze konnten zugleich gestützte und ungestützte Angaben enthalten ([Min et al. 2023](https://aclanthology.org/2023.emnlp-main.741/)).
- GPT-4o erzeugte in sechs Literaturreviews 176 Referenzen, davon 19,9 Prozent vollständig erfunden; zusätzlich enthielten viele reale Referenzen bibliografische Fehler. Fehler nahmen bei weniger vertrauten oder spezialisierten Themen zu ([Linardon et al. 2025](https://doi.org/10.2196/80371)).
- Eine weitere kontrollierte Untersuchung fand bei GPT-3.5 zwar rund drei Viertel existierende Referenzen, aber deutliche Disziplinunterschiede und besonders unzuverlässige DOI-Angaben in geisteswissenschaftlichen Themen ([Mugaanyi et al. 2024](https://doi.org/10.2196/52935)).
- Aktuelle Theorie und Experimente zeigen, dass übliche Genauigkeitsmetriken Raten gegenüber einem Eingeständnis von Nichtwissen belohnen können. Fehlende Antworten müssen daher als legitimes, bei hohen Risiken sogar überlegenes Ergebnis bewertet werden ([Kalai et al. 2026](https://doi.org/10.1038/s41586-026-10549-w)).

### Epistemische Fehlkalibrierung

- Moderne ausgerichtete LLMs geben ihre interne Unsicherheit in natürlicher Sprache oft nicht treu wieder: Sie formulieren je nach Fall zu entschieden oder zu vorsichtig ([Yona et al. 2024](https://aclanthology.org/2024.emnlp-main.443/)).
- Leser überschätzten in mehreren Experimenten die Genauigkeit von LLM-Antworten anhand üblicher Erklärungen. Eine an Modellkonfidenz angepasste Unsicherheitssprache verringerte diese Wahrnehmungslücke ([Steyvers et al. 2025](https://doi.org/10.1038/s42256-024-00976-7)).

**Einordnung:** Vom Modell formulierte Sicherheit ist selbst kein Beleg. Für wissenschaftliche Texte muss die sprachliche Behauptungsstärke aus Evidenzart, Quellenqualität, Quellenunabhängigkeit und Widerspruchslage abgeleitet werden.

### Persuasive Wirkung und Vertrauen

- In drei präregistrierten Experimenten mit insgesamt 4.829 Personen veränderten LLM-generierte politische Botschaften Einstellungen messbar und waren ähnlich wirksam wie Texte nichtprofessioneller menschlicher Autoren; die Effekte waren klein, aber konsistent ([Bai et al. 2025](https://doi.org/10.1038/s41467-025-61345-5)).
- In einem präregistrierten Debattenexperiment mit 900 Personen war personalisiertes GPT-4 häufiger überzeugender als menschliche Gegner; ohne Personalisierung war kein signifikanter Unterschied belegt ([Salvi et al. 2025](https://doi.org/10.1038/s41562-025-02194-6)).
- Kontrollierte Feinabstimmung auf wärmere Sprache erhöhte bei fünf Modellen die Fehlerquote um 10 bis 30 Prozentpunkte und verstärkte die Zustimmung zu falschen Nutzerannahmen. Freundlichkeit und Faktentreue sind demnach nicht automatisch unabhängig ([Ibrahim et al. 2026](https://doi.org/10.1038/s41586-026-10410-0)).

**Einordnung:** Überzeugungskraft, Wärme, logischer Klang und Vertrauenswürdigkeit dürfen nicht als Stellvertreter für Wahrheit dienen. Personalisierung braucht zusätzlich Grenzen gegen manipulative oder ausnutzende Ansprache.

### Model Collapse und synthetische Rückkopplung

- Bei rekursivem Training auf den Ausgaben vorheriger Modellgenerationen verschwanden zuerst seltene Bereiche der ursprünglichen Verteilung; später sank die Varianz stark. Der Effekt wurde unter anderem an einem Sprachmodell demonstriert ([Shumailov et al. 2024](https://doi.org/10.1038/s41586-024-07566-y)).
- Der Kollaps ist nicht bei jeder Nutzung synthetischer Daten unvermeidlich. Experimente zeigen, dass das fortlaufende Beibehalten und Akkumulieren realer Daten die Entwicklung stabilisieren kann, während vollständiger Ersatz durch synthetische Generationen kollabiert ([Kazdan et al. 2025](https://proceedings.mlr.press/v267/kazdan25a.html)).

**Einordnung:** Diese Arbeiten untersuchen Trainingsökosysteme, nicht die Qualität jedes einzelnen KI-Textes. Für das Produkt folgt daraus vor allem: menschliche Originale, Primärquellen und Provenienz dürfen nie durch geglättete Agentenzusammenfassungen ersetzt werden.

## 3. Deutschspezifische Risiken

Für deutsche Texte reicht eine Übersetzung englischer Anti-Slop-Listen nicht aus. Eine KONVENS-Studie fand zwischen deutschen Modell- und Vergleichstexten unter anderem Unterschiede bei Wiederholungen, Satzähnlichkeit, Adverbien und Diskursmarkern, zugleich aber stark modell- und datensatzabhängige Signaturen. Detektoren generalisierten schlecht auf unbekannte Generatoren ([Irrgang et al. 2024](https://aclanthology.org/2024.konvens-main.27/)). Eine neuere Analyse deutscher Zeitungstexte beschreibt bei vier LLMs eine stärkere SVO-Präferenz, geringere syntaktische Variation und englisch-lineare Progression statt der im Deutschen möglichen Informationssteuerung über Satzklammer und Vorfeld ([Valentinelli 2026](https://doi.org/10.62408/ai-ling.v5i1.36)).

Die deutschsprachige Wikipedia dokumentiert als redaktionelle Felderfahrung unter anderem mechanische Konnektoren, Bedeutungsinflation, Werbesprache, vage Autoritäten, oberflächliche Analysen, negative Parallelismen, Trikola und übermäßige Struktur. Sie warnt ausdrücklich davor, einzelne Merkmale als Beweis oder allgemeine Stilverbote zu behandeln ([Anzeichen für KI-generierte Inhalte](https://de.wikipedia.org/wiki/Wikipedia:Anzeichen_f%C3%BCr_KI-generierte_Inhalte)). Ein Fazit, Passiv, Nominalisierung, Gedankenstrich oder „nicht nur ..., sondern auch“ kann je nach Genre notwendig oder bewusst wirksam sein.

**Systemfolge:** Das deutsche Modul prüft zusätzlich englische Interferenz, Satzfeldvariation, Übersetzungswendungen, Registersprünge, Konnektorhäufung, abstrakte Containerwörter und nominale Verdichtung. Es vergleicht aber immer mit Textsorte, Fach, Autorstimme und lokaler Funktion. Umgangssprache künstlich einzustreuen oder akademische Formen pauschal zu entfernen wäre selbst eine neue Schablone.

## 4. Vorhandene Pattern-Bibliotheken

- [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) ist der breiteste deskriptive Feldkatalog und besonders stark bei tieferen Warnsignalen wie falschen Belegen, spekulativer Lückenfüllung und oberflächlicher Analyse. Er ist Wikipedia-spezifisch und kein wissenschaftlich validiertes Regelwerk.
- [blader/humanizer](https://github.com/blader/humanizer) ist ein umfangreicher, MIT-lizenzierter Pattern-Katalog mit Stimmabgleich. Harte Regeln wie ein vollständiges Verbot von Gedankenstrichen oder Passiv sowie das künstliche Hinzufügen von Meinungen und Unordnung sind für dieses Produkt ungeeignet.
- [skill-deslop](https://github.com/stephenturner/skill-deslop) überträgt die Kritik sinnvoller auf wissenschaftliche Texte und priorisiert Spezifität, Informationsdichte und benannte Akteure. Auch seine Strukturregeln bleiben englisch geprägt und dürfen nur kontextabhängig greifen.
- [aismell](https://github.com/brm-src/aismell) hat die beste redaktionelle Grundidee: transparentes, lokales Regelwerk, markierte Fundstellen, Erklärungen und ausdrücklich keine forensische Autorschaftsbehauptung. Es unterstützt derzeit jedoch nur Englisch und Spanisch und seine Heuristiken sind nicht als wissenschaftlicher Standard validiert.
- [Klartext](https://github.com/severinschweiger/klartext) und [avoid-ai-writing-multilingual](https://github.com/jurigis/avoid-ai-writing-multilingual) liefern erste deutschsprachige Listen zu Nominalstil, Genitivketten, Amtsdeutsch und Übergangsphrasen. Sie sind kleine, meinungsstarke Prompt-Sammlungen; Angaben wie „lautestes KI-Signal“ oder feste Wortstufen sind keine hinreichende Evidenz.
- [Vale](https://github.com/vale-cli/vale) ist kein AI-Slop-Detektor, aber ein reifer, erweiterbarer Prosa-Linter. Seine Architektur eignet sich als Referenz für deterministische Projektregeln, nicht als fertige deutsche Qualitätslogik.

**Urteil:** Keine vorhandene Bibliothek sollte unverändert die Autorität erhalten. Wir übernehmen Taxonomien und transparente Regelideen, bauen aber ein eigenes deutsches, genreabhängiges Qualitätsregister. Jede Regel speichert Musterfamilie, Fundstelle, Konfidenz, passende Genres, Gegenbeispiele, möglichen tieferen Fehler und die zu prüfende Frage. Ein Treffer löst eine Diagnose aus, nie automatisch eine Umschreibung.

## 5. Grenzen der Befundlage

- Viele Studien untersuchen Englisch, einzelne Genres, ältere Modellversionen oder künstliche Aufgaben. Deutsche Signaturen und konkrete Projekttypen müssen separat evaluiert werden.
- Messbare Signaturen sind probabilistische Korpusbefunde. Sie eignen sich für Qualitätsdiagnostik, nicht für sichere individuelle KI-Erkennung.
- Menschliche Texte sind nicht automatisch besser; einige Experimente zeigen klare Qualitäts- oder Kreativitätsgewinne durch Assistenz.
- Prompt, Modell, Temperatur, Retrieval, Redaktion und Autorbeteiligung verändern die Ergebnisse erheblich.
- Ein universeller Gegensatz "menschlich = originell, KI = schlecht" wird von der Forschung nicht getragen. Belastbar ist die Forderung nach Evidenztreue, Funktionsprüfung, Varianz und menschlicher Autorschaftskontrolle.

## 6. Konkrete Systemfolgen

1. **Claim-Ledger statt Gesamtplausibilität:** Jeder überprüfbare Satz wird in atomare Behauptungen zerlegt und mit Quelle, Belegstelle, Evidenzart, Gültigkeitszeitraum und Widerspruchslage verbunden.
2. **Harte Quellenprüfung:** Titel, Autor, Jahr, DOI, URL, Zitat und Seitenstelle werden deterministisch gegen das Original geprüft. Eine bloß plausibel klingende Referenz darf nie in den Entwurf gelangen.
3. **Abstention als Erfolg:** "Nicht ausreichend belegt", eine Rückfrage oder das Auslassen einer Behauptung wird bei schwacher Evidenz ausdrücklich besser bewertet als eine vollständige klingende Vermutung.
4. **Evidenzgesteuerte Modalität:** Formulierungen wie "beweist", "zeigt", "legt nahe" und "könnte" werden aus dem Evidenzmodell abgeleitet und nach jeder Überarbeitung erneut geprüft.
5. **Funktionsbasierter Anti-Slop-Audit:** Das System sucht dokumentweit nach wiederholten Satzschablonen, Diskursmotiven, Dreierlisten, Einleitungen, Schlussformeln und semantischen Wiederholungen. Es beanstandet sie nur, wenn sie keine lokale kommunikative Funktion erfüllen.
6. **Informationswert pro Passage:** Jeder Satz muss definieren, unterscheiden, erklären, belegen, folgern, qualifizieren, kontrastieren oder gezielt wirken. Reine Wiederholung und dekorative Vollständigkeit werden gekürzt; Satzlänge allein ist kein Kriterium.
7. **Keine Standardschablone für Texte:** Die Makrostruktur entsteht aus Argument, Material, Leserbewegung und Genre. "Einleitung - drei Punkte - Fazit" darf nur erscheinen, wenn diese Form inhaltlich trägt.
8. **Stimme als Projektgedächtnis:** Akzeptierte Formulierungen und echte Nutzertexte bilden ein kontrollierbares Stilprofil. Das System bewahrt individuelle Präferenzen, ohne Fehler oder zufällige Ticks blind zu imitieren.
9. **Echte Alternativen:** Varianten werden über unterschiedliche argumentative oder rhetorische Strategien erzeugt und auf semantische Distanz geprüft, nicht durch oberflächliches Synonymtauschen.
10. **Formatblinde Qualitätsprüfung:** Inhalt, Evidenz, Sprache und Format werden getrennt bewertet. Prüfer sehen nach Möglichkeit längennormierte oder unformatierte Fassungen, damit Listen und Ausführlichkeit keinen Qualitätsbonus erhalten.
11. **Wirkungs- und Integritätsprüfung:** Bei Marketing, Kampagnen und personalisierten Texten prüft eine eigene Rolle Wahrheit, Fairness, ausgelassene Gegeninformationen und potenziell manipulative Ansprache.
12. **Provenienzschutz:** Primärquellen und menschliche Originale bleiben unveränderlich gespeichert. Synthetische Zusammenfassungen dürfen weder als Quelle noch unmarkiert als neue Wahrheit in das Langzeitgedächtnis zurückfließen.
13. **Ruhige Abschlusskontrolle:** Hinweise bleiben am betroffenen Text verankert und ausblendbar, müssen vor dem finalen Status jedoch erledigt, bewusst akzeptiert oder mit Begründung zurückgestellt sein.
14. **Kein Herkunftsurteil:** Das Modul nennt Qualitätsrisiken und Textstellen, behauptet aber nicht, ein Text sei „zu X Prozent KI“. Menschliche Texte können dieselben Muster enthalten, und Detektoren generalisieren schlecht.
15. **Keine Tarnoptimierung:** Das System fügt keine Fehler, Umgangssprache, Zufälligkeit oder dekorative persönliche Details ein, um Detektoren zu täuschen. Es verbessert nachprüfbare Qualität und schützt die tatsächliche Autorstimme.

## 7. Produkturteil

Das wirksamste Gegenmittel gegen KI-Slop ist kein "menschlicherer" Oberflächenstil. Es ist eine Architektur, die zuerst Wahrheit und Bedeutung absichert, danach Diskursfunktion und Informationswert prüft und erst zuletzt den Wortlaut optimiert. Sprachliche Eigenständigkeit entsteht dabei aus Projektwissen, Autorstimme und funktionaler Variation, nicht aus dem mechanischen Entfernen auffälliger Wörter.
