# Forschungsnotiz: Handwerk der Web-, UX- und Plakattexte

> Stand: 2026-08-05. Fokus: Lesen am Bildschirm, Informationshierarchie, Microcopy (Buttons, Fehlermeldungen, leere Zustände), Plain-Language-Standards, Plakat/Fernwirkung und deutsche Besonderheiten. Abgegrenzt: klassisches Marketing-Copywriting (Headlines, Nutzenversprechen, AIDA) ist Thema einer eigenen Recherche. Die registerbezogenen Grundlagen stehen in `2026-07-19-deutsche-sprache-schreibsystem.md` und werden hier nicht wiederholt.

## Kurzfazit

Texte für Oberflächen und Orte werden nicht gelesen, sondern benutzt: am Bildschirm überflogen, am Straßenrand in Sekunden erfasst. Die Qualitätsfrage verschiebt sich deshalb von „Ist das gut geschrieben?" zu „Findet, versteht und benutzt die richtige Person das Richtige rechtzeitig?" Die Evidenz dafür ist ungewöhnlich stabil: Die Scan-Befunde der Nielsen Norman Group halten seit 1997, die Plain-Language-Prinzipien sind inzwischen als ISO-Norm kodifiziert, und für Plakate gilt seit jeher das strengste Budget — ein Gedanke, wenige Wörter, lesbar aus der Distanz.

Für das System folgt daraus: Bei den Textarten `web`, `marketing` und `campaign` wird **Struktur** zur Frage der Auffindbarkeit (nicht der Argumentation), **Sprache** zur Frage der sofortigen Verständlichkeit und Konsistenz, und **Wirkung** zur Frage des situationsgerechten Tons. Die Integritätsgrenzen aus `app/src/textart-regeln.mjs` (web: Fakt+Quelle, campaign: Fakt) werden durch die Befunde gestützt, nicht verschoben.

## 1. Am Bildschirm wird gescannt, nicht gelesen

Die Grundbefunde sind alt und wurden nie widerlegt: 79 % der Testpersonen überflogen jede neue Seite, nur 16 % lasen Wort für Wort ([Nielsen 1997](https://www.nngroup.com/articles/how-users-read-on-the-web/)). Eine Verhaltensstudie mit 45.237 Seitenaufrufen ergab, dass Besucher im Schnitt höchstens 28 % der Wörter einer Seite lesen können, realistisch eher 20 %; erst bei Seiten mit 111 Wörtern oder weniger wird etwa die Hälfte gelesen ([Nielsen 2008](https://www.nngroup.com/articles/how-little-do-users-read/)). Ohne Formatierung entsteht das F-Muster: Die ersten Zeilen bekommen die meisten Blicke, danach wandert das Auge am linken Rand nach unten — Inhalte rechts und weiter unten werden übersehen. Das F-Muster ist kein Ideal, sondern ein Notprogramm bei unformatiertem Text; es tritt auch mobil auf ([Pernice 2017](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/)).

Die Folgestudie unterscheidet mehrere Scan-Muster; das wirksamste ist das „Layer-Cake"-Muster, bei dem Leser von Zwischenüberschrift zu Zwischenüberschrift springen — es funktioniert nur, wenn die Überschriften den Inhalt tatsächlich tragen ([Pernice 2019](https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/)). Dass sich Web-Schreibqualität messen lässt, zeigte schon die Ursprungsstudie: prägnante Fassung +58 % Usability, scanbare Fassung +47 %, beides kombiniert +124 % gegenüber dem Ausgangstext ([Nielsen 1997](https://www.nngroup.com/articles/how-users-read-on-the-web/)).

**Systemfolge:** Für die Textart `web` prüft der Agent nicht nur den Text, sondern seine Scan-Tauglichkeit: tragende Zwischenüberschriften, ein Gedanke pro Absatz, hervorhebbare Schlüsselwörter, Listen statt Fließtextketten. Ein struktureller Hinweis der Form „Diese Passage ist beim Überfliegen unsichtbar" ist bei Webtexten so legitim wie „Dieser Schluss trägt nicht" bei einer Hausarbeit. Wortzahl pro Sinneinheit ist hier ein echtes Warnsignal — anders als im Essay, wo sie keines ist.

## 2. Informationshierarchie: das Wichtigste zuerst, vorn im Satz, vorn im Wort

Die umgekehrte Pyramide aus dem Journalismus — Kernaussage zuerst, Details danach — funktioniert im Web, weil Leser an jeder Stelle aussteigen können und trotzdem die Hauptsache mitnehmen sollen ([Schade 2018](https://www.nngroup.com/articles/inverted-pyramid/)). Dasselbe Prinzip gilt im Kleinen: Beim Scannen von Listen und Links erfassen Nutzer oft nur die ersten etwa 11 Zeichen, ungefähr zwei Wörter; aussagekräftige erste Wörter entscheiden, ob ein Eintrag überhaupt wahrgenommen wird ([Nielsen 2009](https://www.nngroup.com/articles/first-2-words-a-signal-for-scanning/)). Überschriften, Linktexte und Buttonbeschriftungen sind damit keine Verzierung, sondern die eigentliche Navigationsschicht des Textes.

**Systemfolge:** Der Agent prüft bei `web` drei Hierarchie-Ebenen getrennt: (a) Steht die Kernaussage der Seite in den ersten zwei Absätzen? (b) Ergibt die Kette der Zwischenüberschriften allein gelesen den Gedankengang? (c) Beginnen Überschriften und Links mit den tragenden Wörtern statt mit Füllmaterial („Hier finden Sie …")? Punkt (b) ist derselbe Reverse-Outline-Check, den das System für Argumentationstexte kennt — nur mit Auffindbarkeit statt Beweisgang als Maßstab.

## 3. Microcopy: Buttons, Fehlermeldungen, leere Zustände

Microcopy sind die sehr kurzen Texte, die Bedienung ermöglichen: Buttons, Formularfelder, Meldungen. Das Handwerk ist gut dokumentiert. Fehlermeldungen sollen nahe an der Fehlerquelle stehen, in menschlicher Sprache statt Codes das konkrete Problem benennen, einen konstruktiven nächsten Schritt anbieten und ohne Schuldzuweisung formuliert sein — Wörter wie „ungültig" und Humor bei wiederkehrenden Fehlern gelten als Fehlgriffe ([Neusesser & Sunwall 2023](https://www.nngroup.com/articles/error-message-guidelines/)). Leere Zustände (etwa ein Bereich ohne Einträge) sollen erklären, warum nichts da ist, was dort stehen könnte und wie man dorthin kommt ([Kaplan 2021](https://www.nngroup.com/articles/empty-state-interface-design/)). Platzhaltertext in Formularfeldern ist als Ersatz für Beschriftungen belegt schädlich: Er verschwindet beim Tippen, belastet das Gedächtnis und wird für bereits ausgefüllt gehalten ([Sherwin 2014](https://www.nngroup.com/articles/form-design-placeholders/)).

Die Lehrbücher des Feldes systematisieren das: Podmajersky verankert UX-Text in einem „Voice Chart" (Produktprinzipien → Vokabular, Wortfülle, Grammatik) und in wiederkehrenden Textmustern — Titel, Buttons, Beschreibungen, leere Zustände, Fehlermeldungen — mit dem Anspruch, dass jeder Text zweckgebunden, knapp, gesprächsnah und klar ist ([Podmajersky, Strategic Writing for UX](https://www.oreilly.com/library/view/strategic-writing-for/9781492049388/)). Yifrah behandelt dieselben Muster aus der Gesprächsperspektive: Microcopy muss in Sekundenbruchteilen verständlich sein und die Aufgabe flüssig halten ([Yifrah, Microcopy: The Complete Guide](https://www.goodreads.com/book/show/34847317-microcopy)).

**Systemfolge:** Microcopy braucht musterbezogene Prüffragen statt allgemeiner Stilkritik. Für eine Fehlermeldung lauten sie: Was ist passiert? Warum? Was jetzt? Für einen Button: Sagt er, was geschieht — als Verb, nicht als Zustand? Für einen leeren Zustand: Erklärt er sich und zeigt er den nächsten Schritt? Der Agent sollte die Textfunktion (Meldung, Beschriftung, Hilfe) erkennen und die passende Schablone anlegen, statt Kürze oder Höflichkeit pauschal anzumahnen.

## 4. Stimme bleibt, Ton wechselt

Der verbreitetste Ordnungsrahmen stammt aus dem Mailchimp-Styleguide: Die Stimme einer Marke bleibt gleich, der Ton passt sich der Situation und der Gefühlslage des Lesers an; Klarheit steht über allem ([Mailchimp Content Style Guide](https://styleguide.mailchimp.com/voice-and-tone/)). Der deutsche Berufsverband German UPA fasst dasselbe Feld in acht Heuristiken: nützlich, verständlich, prägnant, strukturiert, empathisch, markenkonform, einheitlich, fehlerfrei — ausdrücklich als abwägbare Prinzipien, die in Konkurrenz stehen können, nicht als Regelwerk ([German UPA, Leitfaden UX-Writing](https://germanupa.de/sites/default/files/2024-01/leitfaden_ux-writing_heuristiken_v1.01_0.pdf)). Bemerkenswert für Onda: „Empathisch" heißt dort situationsbezogen — bei einem kritischen Warnhinweis ist weniger Fröhlichkeit angebracht als bei einer Buchungsbestätigung; und „Einheitlich" umfasst Terminologie-Konsistenz über alle Ebenen bis hin zum Verbot unmotivierter Deutsch-Englisch-Mischung.

**Systemfolge:** Wirkungshinweise bei `web`/`marketing` sollten die Trennung Stimme/Ton übernehmen: Ein Hinweis „Ton passt nicht zur Situation dieser Passage" (z. B. flapsig im Fehlerfall) ist etwas anderes als „Stimme weicht vom Sprachprofil ab" (z. B. plötzliche Förmlichkeit). Beides bleibt Wirkungshypothese im Sinn von `CONTEXT.md` — begründet, korrigierbar, kein Wirkungsnachweis. Die acht UPA-Heuristiken taugen als Prüfraster, nicht als Punktesystem.

## 5. Plain Language ist inzwischen Norm — mit bekannten Grenzen

Der GOV.UK-Standard, das einflussreichste Content-Design-Regelwerk, schreibt für Behördentexte ein Ziellesealter von etwa 9 Jahren und Sätze um höchstens 25 Wörter vor ([GOV.UK Writing Guidelines](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/), dokumentiert u. a. im [ONS Service Manual](https://service-manual.ons.gov.uk/content/writing-for-users/plain-language)). Entscheidend ist die Begründung: Einfache Sprache ist kein Zugeständnis an Schwache — auch Fachleute bevorzugen sie, weil sie Denkarbeit für den Inhalt statt für das Entschlüsseln der Sätze freihält ([Loranger/NN-g 2017](https://www.nngroup.com/articles/plain-language-experts/)).

Seit 2023/2024 ist das international kodifiziert: ISO 24495-1 (deutsch als [DIN ISO 24495-1:2024](https://www.dinmedia.de/en/standard/din-iso-24495-1/375008622)) definiert Einfache Sprache über vier Grundsätze — Relevanz, Auffindbarkeit, Verständlichkeit, Anwendbarkeit. Davon zu unterscheiden ist Leichte Sprache, eine stärker regulierte Varietät für Menschen mit Lernschwierigkeiten, für die seit 2025 erstmals einheitliche Empfehlungen als [DIN SPEC 33429](https://www.bundesfachstelle-barrierefreiheit.de/SharedDocs/Kurzmeldungen/DE/din-spec-leichte-sprache-veroeffentlicht) vorliegen. Die Grenzen pauschaler Vereinfachung — Verständlichkeit ist nicht Lesbarkeit, Vereinfachung kann Textsortensignale zerstören — sind in Kapitel 6 der Juli-Recherche belegt und gelten hier unverändert.

**Systemfolge:** Für `web` darf der Agent strenger takten als für Essays: Satzlänge über ~25 Wörtern, Fachbegriffe ohne Einführung und Nominalketten sind hier begründete Warnsignale, weil das Publikum breit und die Lesesituation flüchtig ist. Die vier ISO-Grundsätze sind als Prüfreihenfolge brauchbar: erst Relevanz (gehört das hierher?), dann Auffindbarkeit (steht es dort, wo gesucht wird?), dann Verständlichkeit, dann Anwendbarkeit (weiß der Leser, was zu tun ist?). Leichte Sprache bleibt eine bewusste Autorentscheidung mit eigenem Regelwerk, nie ein automatischer Standard.

## 6. Plakat: ein Gedanke mit Fernwirkung

Das Plakat hat das härteste Aufmerksamkeitsbudget aller Textorte. Der Branchenverband OAAA nennt in seinem Kreations-Leitfaden „7 words or less" als bewährten Richtwert, verlangt Lesbarkeit aus der Distanz und belegt mit Verweis auf das Journal of Advertising Research, dass Motive mit zwei Botschaftselementen 21 % eher wahrgenommen werden als solche mit fünf ([OAAA Creative Best Practices](https://oaaa.org/wp-content/uploads/2022/09/OAAA-Best-Practices-oct20-2021-spreads_2_.pdf)). Derselbe Leitfaden enthält eine Schriftgrößen-Distanz-Tabelle (z. B. Poster an Straßen, 30–60 m Sichtabstand: 10–20 cm Versalhöhe) und betont, dass alle Regeln vom Ort abhängen: Ein U-Bahn-Innenplakat mit 5–20 Minuten Verweildauer darf mehr Text tragen als eine Autobahntafel mit Sekunden. Deutsche Praxisregeln decken sich damit: Botschaft in 1,5–2 Sekunden erfassbar, Faustwert um fünf Wörter, höchstens etwa fünf Gestaltungselemente ([Crossvertise](https://blog.crossvertise.com/2018/11/14/plakat-werbung-richtig-gestalten/), [Marketing-Börse](https://www.marketing-boerse.de/fachartikel/details/1819-10-tipps-zur-effektiven-gestaltung-von-plakaten/145665)).

**Systemfolge:** Für `campaign` ist die wichtigste Strukturprüfung eine Zählung: Trägt der Text genau einen Gedanken, und übersteht er den Sekundentest? Ein Hinweis „zweite Botschaft erkannt" wiegt hier schwerer als jede Stilfrage. Zugleich bestätigt sich die Setzung aus `textart-regeln.mjs`: Ein Plakat schuldet seinem Publikum Wahrheit (`fakt`), aber keine Fußnote (`quelle`) und keine Herleitung (`methode`, `logik`). Der Agent sollte die Ortsabhängigkeit erfragbar machen — Autobahn, Bahnsteig oder Litfaßsäule sind verschiedene Textaufträge.

## 7. Deutsches UX-Schreiben: Anrede, Länge, Lokalisierungsfallen

Drei Besonderheiten unterscheiden deutsche Oberflächentexte von englischen Vorbildern. Erstens die Anrede: Die Du/Sie-Wahl ist kanal- und altersabhängig, nicht pauschal entscheidbar. In einer Appinio-Befragung von 4.533 Deutschen (16–54 Jahre, 2019) wollten 82 % der Instagram-Nutzer von Marken geduzt werden, auf Business-Netzwerken bevorzugte die Mehrheit das Sie, und auf Unternehmenswebsites fand nur etwa ein Viertel der unter 44-Jährigen das Du ausdrücklich sympathisch ([Appinio 2019](https://www.appinio.com/de/blog/insights/studie-markenkommunikation-siezen-duzen)). In der Deutschschweiz ist der Umgangston generell informeller als in Deutschland ([The Gondola](https://www.thegondola.ch/blog/ux-writing-fr-lokalisierung-darauf-kannst-du-achten)). Konsistenz ist wichtiger als die Wahl selbst: Ein Wechsel mitten im Produkt irritiert mehr als jede der beiden Formen.

Zweitens die Länge: Deutsche Übersetzungen kurzer englischer UI-Texte wachsen drastisch — bei Ausgangstexten bis 10 Zeichen rechnet IBM mit 200–300 % Expansion; das Flickr-Beispiel „views" → „-mal angesehen" wuchs um Faktor 2,8 ([W3C, Text size in translation](https://www.w3.org/International/articles/article-text-size)). Lange Komposita sind dabei nicht per se das Problem (siehe Juli-Recherche, Kap. 3) — wohl aber, wenn sie in Buttons umbrechen oder abgeschnitten werden. Drittens die Bausteinfalle: Aus Variablen zusammengesetzte Sätze scheitern im Deutschen an Kasus, Artikel und Wortstellung; und unmotivierte Deutsch-Englisch-Mischung gilt auch im deutschen Berufsverband als Fehler ([The Gondola](https://www.thegondola.ch/blog/ux-writing-fr-lokalisierung-darauf-kannst-du-achten), [German UPA](https://germanupa.de/sites/default/files/2024-01/leitfaden_ux-writing_heuristiken_v1.01_0.pdf)).

**Systemfolge:** Das Sprachprofil sollte für `web`/`marketing`/`campaign` eine Anrede-Festlegung (Du/Sie/keine direkte Anrede) als korrigierbare Autorentscheidung tragen; der Agent prüft dann nur noch Konsistenz und meldet Kanalkonflikte als Hypothese („für diese Zielgruppe auf diesem Kanal ist Sie unüblich"), nie als Fehler. Sprachhinweise auf Komposita orientieren sich am Ort (bricht es im Button?) statt an der Wortlänge. Deutsch-Englisch-Mischung ist ein legitimer Konsistenzhinweis der Art `sprache`.

## Implikationen für Onda

**Gewichtung der acht Hinweisarten für `web` und `campaign`/Plakat:**

- `struktur` — bei `web` die wichtigste Art, aber mit verschobener Bedeutung: Scanbarkeit, Hierarchie, Frontloading, ein Gedanke pro Einheit (Kap. 1–2). Bei `campaign` reduziert auf die eine Frage: ein Gedanke, wenige Wörter (Kap. 6).
- `sprache` — zweite tragende Art: Plain-Language-Signale (Satzlänge, Jargon), Terminologie- und Anrede-Konsistenz, Sprachmischung, Ortstauglichkeit von Komposita (Kap. 5, 7).
- `wirkung` — wichtig, aber immer als Hypothese: Ton-Situations-Passung, Stimme-Profil-Passung (Kap. 4). Bei Plakaten zusätzlich die Fernwirkungsfrage als Hypothese über die Lesesituation.
- `erklaerung` — bei `web` mittel (Fehlermeldungen, leere Zustände müssen erklären und den nächsten Schritt zeigen, Kap. 3); bei `campaign` fast bedeutungslos.
- `fakt` — bleibt Integritätsfrage in beiden Textarten; die Recherche stützt die bestehende Tabelle in `textart-regeln.mjs`.
- `quelle` — bei `web` Integritätsfrage (öffentliche Behauptung bleibt stehen), bei `campaign` keine; ebenfalls Bestätigung der bestehenden Setzung.
- `logik`, `methode` — nachrangig; ein Plakat und die meisten Webtexte führen keinen Beweis. Nur bei argumentierenden Landingpages (z. B. „warum wir besser sind als X") bleibt `logik` als Angebot sinnvoll.

**Prüffragen für den Agenten:**

1. Versteht ein Leser die Hauptsache, wenn er nach den ersten zwei Absätzen aufhört?
2. Ergibt die Überschriftenkette allein gelesen den Gedankengang?
3. Beginnen Überschriften, Links und Listeneinträge mit den tragenden ersten zwei Wörtern?
4. Trägt jede Passage genau einen Gedanken — und das Plakat insgesamt genau einen?
5. Sagt jeder Button als Handlung, was geschieht; sagt jede Fehlermeldung, was passiert ist, warum und was jetzt zu tun ist?
6. Erklärt jeder leere oder Wartezustand sich selbst und den nächsten Schritt?
7. Bleibt die Anrede (Du/Sie) über den gesamten Text konsistent und zur Festlegung im Sprachprofil passend?
8. Liegt die Satzlänge im Rahmen (~25 Wörter) und ist jeder Fachbegriff eingeführt oder begründet nötig?
9. Passt der Ton zur Lage des Lesers an dieser Stelle (Fehler ≠ Erfolg ≠ Warnung)?
10. Überstünde der Plakattext den Sekundentest am vorgesehenen Ort (Autobahn/Bahnsteig/Säule)?

**Was Onda NICHT tun sollte:**

- Keine Conversion-Optimierung, keine AIDA-Schablonen, keine Klickraten-Versprechen — das ist das Feld der Marketing-Recherche, und Wirkungsaussagen ohne reale Reaktion bleiben ohnehin Hypothesen.
- Keine Lesbarkeitsformel als Gesamtnote und keine automatische Kürzung: Der Bedeutungskern (Aussage, Einschränkungen, Evidenzstatus) darf durch Zuspitzung nicht kippen — Kürze ist Mittel, nicht Ziel.
- Kein Du/Sie-Dogma und keine stillschweigende Anrede-Korrektur; die Wahl ist Autorentscheidung, Onda prüft Konsistenz.
- Keine Leichte-Sprache-Übersetzung als Default; DIN SPEC 33429 beschreibt eine eigene Varietät für eine bestimmte Zielgruppe, keine allgemeine Stilstufe.
- Keine Pixel-Urteile: Ob ein Button umbricht oder eine Schrift aus 100 m lesbar ist, hängt am Layout, das Onda nicht sieht. Onda kann die Textseite prüfen (Wortzahl, Kompositumlänge, Zeichenbudget), muss die Grenze aber benennen.

**Offene Fragen an Jakob:**

1. Soll die Textartenliste zwischen `web` (Website-Langtext) und Interface-Microcopy unterscheiden? Die Prüfschablonen aus Kap. 3 (Button, Fehlermeldung, leerer Zustand) passen schlecht unter dieselbe Textart wie ein Blogartikel — dieselbe offene Stelle, die `textart-regeln.mjs` schon für Prosa/Lyrik notiert.
2. Soll das Sprachprofil um zwei Felder wachsen: Anrede (Du/Sie/keine) und — für `campaign` — den Anbringungsort mit Betrachtungszeit? Beides sind Setzungen, die viele Einzelhinweise erst entscheidbar machen.
3. Wie streng soll der Plain-Language-Default bei `web` sein, wenn die Zielgruppe im Projektverständnis ausdrücklich ein Fachpublikum ist — Warnschwellen lockern oder nur die Begründung ändern?
4. Sollen die zehn Prüffragen als eigene Checkliste im Sprach- und Wirkungsdossier erscheinen, oder nur intern die Hinweiserzeugung steuern?
