# Forschungsnotiz: Empirie zu KI-Schreibassistenten — was Schreiben mit KI mit dem Schreibenden macht

> Kurzrecherche vom 2026-08-05, Teil der Serie über Querschnittsfelder. Abgrenzung: Welche Textmerkmale KI-generierte Texte tragen (Slop-Signaturen, Korpus-Homogenität), behandelt bereits [2026-07-19-ki-text-slop.md](2026-07-19-ki-text-slop.md). Diese Notiz behandelt die Verhaltensebene: was die Zusammenarbeit mit KI-Assistenten empirisch mit dem Schreibenden macht — mit seinen Inhalten, seinem Autorschaftsgefühl, seinem Urteil und seinen Fähigkeiten — und was Schutzmechanismen nachweislich taugen. Preprints und Working Papers sind als solche gekennzeichnet.

## 1. Kurzfazit

Die Befundlage ist auf sechs Punkte verdichtbar:

1. **Individuell besser, kollektiv gleicher.** KI-Hilfe hebt messbar die bewertete Qualität einzelner Texte — am stärksten bei schwächeren Schreibern — und macht zugleich die Texte verschiedener Autoren einander ähnlicher. Beides ist im selben Experiment nachweisbar.
2. **Vorschläge verschieben Inhalte, nicht nur Formulierungen.** Schon Wortvorhersage macht Texte kürzer und vorhersagbarer; einseitig konfigurierte Assistenten verschieben die im Text vertretene Position und die private Meinung danach — meist ohne dass die Betroffenen es bemerken.
3. **Autorschaftsgefühl hängt an der Beitragsquelle, nicht am Endprodukt.** Je mehr Text und Ideen von der KI stammen, desto geringer das Ownership-Gefühl; am stärksten schadet KI-Hilfe beim Entwerfen, am wenigsten beim Planen. Zugleich deklarieren Nutzer KI-Beiträge ungern — Ownership-Gefühl und Autorschaftserklärung fallen auseinander.
4. **KI-Feedback ist brauchbar, aber anders.** Rubrik-geleitetes LLM-Feedback erreicht fast menschliche Qualität und verbessert nachweislich Überarbeitung und Motivation; Menschen bleiben genauer, und Lernende setzen menschliches Feedback eher um.
5. **Übervertrauen ist der Normalfall, nicht die Ausnahme.** Menschen übernehmen falsche KI-Ausgaben, je besser und flüssiger das System wirkt, desto eher; Erklärungen erhöhen das Vertrauen mehr als die Richtigkeit. Gerade gute Assistenz macht wachsam bleiben schwer.
6. **Leistung mit Assistenz ist kein Beleg für Können ohne sie.** Wo Lernen das Ziel ist, kann unbeschränkte KI-Hilfe die Leistung während der Nutzung heben und danach senken. Schutzmechanismen wirken — Eigenleistung vor KI-Zugang, Hinweise statt Lösungen, Reibung vor Übernahme — aber sie kosten Komfort und werden von Nutzern nicht immer gemocht.

Für Onda heißt das: Die zentralen Setzungen (KI ändert nie selbst Text, bewusste Übernahme, Hinweise statt Auto-Vervollständigung) sind empirisch die richtige Seite fast jeder gemessenen Trade-off-Achse. Die Empirie zeigt aber auch die Lücke: Auch ein System, das nur hinweist, wählt aus, worauf es hinweist — und genau diese Auswahl verschiebt nachweislich Inhalte und Meinungen.

## 2. Homogenisierung: individuell besser, kollektiv gleichförmiger

Der Kernbefund stammt aus einem randomisierten Schreibexperiment: Wer beim Kurzgeschichtenschreiben Ideen von GPT-4 abrufen konnte, schrieb Geschichten, die als kreativer, besser geschrieben und unterhaltsamer bewertet wurden — der Gewinn war am größten bei den von Haus aus am wenigsten kreativen Schreibern. Zugleich waren die KI-gestützten Geschichten einander deutlich ähnlicher als die rein menschlichen. Die Autoren beschreiben das ausdrücklich als soziales Dilemma: individuell lohnend, kollektiv verengend ([Doshi & Hauser 2024, Science Advances](https://doi.org/10.1126/sciadv.adn5290)).

Derselbe Effekt ist auf zwei weiteren Ebenen repliziert:

- **Essays:** In einem kontrollierten Experiment schrieben Teilnehmer Argumentationsessays mit einem Basis-LLM (GPT-3), einem feedback-getunten LLM (InstructGPT) oder ohne Hilfe. Nur das feedback-getunte Modell reduzierte die Inhalts- und Wortschatzvielfalt zwischen den Autoren signifikant — und der Effekt ließ sich auf den vom Modell beigesteuerten Text zurückführen. Ausgerechnet die Anpassung an menschliche Präferenzen, die Modelle angenehmer macht, macht sie homogenisierender ([Padmakumar & He 2024, ICLR](https://arxiv.org/abs/2309.05196)).
- **Ideenfindung:** In einer Vergleichsstudie mit 36 Teilnehmern produzierten Nutzer mit ChatGPT mehr und detailliertere Ideen als mit einem alternativen Kreativwerkzeug — aber die Ideen verschiedener Nutzer lagen semantisch näher beieinander, und die Nutzer fühlten sich für ihre Ideen weniger verantwortlich ([Anderson, Shah & Kreminski 2024, Creativity & Cognition](https://doi.org/10.1145/3635636.3656204)).

Wichtig für die Einordnung: Der Qualitätsgewinn ist real und wiederholt gemessen. Die Homogenisierung ist kein Qualitätsverlust des Einzeltexts, sondern ein Verteilungseffekt über Texte und Autoren hinweg — genau die Ebene, auf der ein einzelner Schreiber sie selbst nicht sehen kann.

**Systemfolge:** Onda darf Vielfalt nicht als Eigenschaft des Einzeltexts prüfen, sondern muss sie als Verhältnis messen: Abstand des Vorschlags zum Naheliegenden, Abstand der eigenen Texte zueinander über Zeit. Der Schreiber merkt Homogenisierung nicht — das System muss sie für ihn sichtbar machen. Und: Je „hilfreicher" ein Modell abgestimmt ist, desto stärker zieht es zur Mitte; Ondas Vorschlagswege brauchen deshalb gezielte Divergenz-Anforderungen statt Standard-Sampling.

## 3. Vorschläge verschieben Inhalte: von Wortvorhersage bis latenter Persuasion

Die Verschiebung beginnt weit unterhalb ganzer Textvorschläge:

- **Wortvorhersage:** Bildunterschriften, die mit Vorhersagevorschlägen geschrieben wurden, waren kürzer und enthielten weniger Wörter, die das System nicht vorhergesagt hatte — Vorschläge machen das Schreiben messbar vorhersagbarer ([Arnold, Chauncey & Gajos 2020, IUI](https://doi.org/10.1145/3377325.3377523)).
- **Gefärbte Vorschläge:** Wurden Formulierungsvorschläge beim Schreiben von Restaurantkritiken positiv statt negativ gefärbt, fielen die Kritiken positiver aus ([Arnold, Chauncey & Gajos 2018](https://www.eecs.harvard.edu/~kgajos/papers/2018/arnold18sentiment.shtml)).
- **Smart Replies:** Antwortvorschläge in Messengern sind systematisch positiver als natürliche Konversation; Gespräche mit Vorschlägen wurden schneller, emotional positiver, und die Partner bewerteten einander als kooperativer ([Hohenstein et al. 2023, Scientific Reports](https://doi.org/10.1038/s41598-023-30938-9)).
- **Latente Persuasion:** Der schärfste Befund: 1.506 Teilnehmer schrieben mit einem Assistenten, der heimlich für oder gegen soziale Medien argumentierte. Die Behandelten argumentierten etwa doppelt so wahrscheinlich in Richtung des Modells wie die Kontrollgruppe (Odds Ratio ≈ 2,0 in beide Richtungen) — und ihre private Einstellung in der Nachbefragung verschob sich mit (d ≈ 0,2). Die Teilnehmer schrieben 63 % ihrer Sätze vollständig selbst; die Verschiebung brauchte also keine Textübernahme im großen Stil. Die Mehrheit hielt die Vorschläge trotz Schieflage für ausgewogen ([Jakesch et al. 2023, CHI](https://doi.org/10.1145/3544548.3581196)). Die Autoren nennen den Mechanismus „latent persuasion".

Der gemeinsame Nenner: Nicht die Übernahme ganzer Texte verschiebt, sondern die fortlaufende Auswahl dessen, was als nächstes nahegelegt wird. Wer während des Formulierens einseitigen Input sieht, verarbeitet ihn beim eigenen Denken mit — auch wenn er selbst tippt.

**Systemfolge:** Das ist der wichtigste Warnbefund für Onda, denn er trifft auch ein Hinweis-System: Welche Passagen Hinweise bekommen, welche Gegenargumente gezeigt, welche Stärken benannt werden — diese Auswahl ist derselbe Kanal, über den bei Jakesch die Meinung wanderte. „Die KI ändert nie selbst Text" schützt vor Übernahme, nicht vor Auswahlwirkung. Onda braucht eine Einseitigkeits-Bilanz auf Systemseite: Über einen Text hinweg müssen Hinweise und Gegenargumente beide Richtungen einer strittigen Frage erreichen können, und die Deliberations-Logik (faire, belegte Gegenargumente, Enthaltung bei fehlendem Material) muss auch auf die eigene Hinweis-Auswahl angewendet werden.

## 4. Autorschaft und Ownership beim Co-Writing

Die CHI/CSCW-Literatur hat das Autorschaftsgefühl inzwischen gut vermessen (Grundlagen-Infrastruktur: das CoAuthor-Datenset mit tastenanschlaggenauen Mensch-GPT-3-Schreibsitzungen, [Lee, Liang & Yang 2022, CHI](https://doi.org/10.1145/3491102.3502030)):

- **Der AI-Ghostwriter-Effekt:** Nutzer empfinden KI-generierten Text nicht als ihren eigenen — deklarieren die KI aber trotzdem nicht öffentlich als Autor. Je mehr eigener Einfluss auf den Text, desto höher das Ownership-Gefühl; Personalisierung der KI-Texte änderte daran nichts ([Draxler et al. 2024, TOCHI](https://doi.org/10.1145/3637875)).
- **Die Schreibphase entscheidet:** In einem Experiment mit 253 Teilnehmern senkte jede KI-Hilfe das Ownership-Gefühl — aber Hilfe beim Planen kaum, Hilfe beim Entwerfen am stärksten. Der Effekt lief über die Menge an KI-beigesteuertem Text und Ideen; zugleich verbesserten mehr KI-Beiträge die Essayqualität. Auffällig: Beim Planen fanden Teilnehmer KI-Ideen oft redundant zu ihren eigenen, Überarbeitungsvorschläge übernahmen sie dagegen viel häufiger ([From Planning to Revision, DIS 2026](https://doi.org/10.1145/3800645.3813003)).
- **Verantwortungsgefühl sinkt mit:** Auch in der Ideenfindung fühlten sich ChatGPT-Nutzer weniger verantwortlich für ihre Ergebnisse ([Anderson et al. 2024](https://doi.org/10.1145/3635636.3656204)); in der EEG-Studie von Kosmyna et al. (Preprint, siehe Abschnitt 7) berichtete die LLM-Gruppe das geringste Ownership und konnte am schlechtesten aus dem eigenen, minutenalten Text zitieren.

**Systemfolge:** Ondas Grundarchitektur — der Nutzer schreibt, der Agent plant, prüft und schlägt vor — liegt genau auf der ownership-schonenden Seite dieser Befunde: Planungs- und Überarbeitungshilfe statt Entwurfsgenerierung, Einfluss und Entscheidung beim Autor. Zwei Ergänzungen folgen: Erstens ist die hohe Übernahmequote bei Überarbeitungsvorschlägen ein Einfallstor — gerade dort muss die bewusste Übernahme echte Prüfung bleiben, nicht Durchwinken. Zweitens bestätigt der Ghostwriter-Effekt Ondas beobachtungsbasierten Autorschaftsnachweis: Weil Menschen KI-Beiträge von sich aus nicht deklarieren, ist eine automatisch aus Ereignissen abgeleitete, ehrliche KI-Nutzungserklärung mehr wert als jede Selbstauskunft.

## 5. KI-Feedback gegen Menschen-Feedback

Für Onda zentral, weil Hinweise und Diagnosen genau diese Gattung sind:

- **Qualität:** Beim Vergleich von Experten- und ChatGPT-Feedback auf Schülertexte war menschliches Feedback insgesamt besser — vor allem genauer —, das KI-Feedback aber konsistent kriterienbezogen, themengenau und stark bei Global-Feedback zu Struktur und Kohärenz ([Steiss et al. 2024, Learning and Instruction](https://doi.org/10.1016/j.learninstruc.2024.101894)).
- **Wirkung:** In einem randomisierten Feldexperiment mit 459 Zehntklässlern verbesserte LLM-generiertes, evidenzbasiert instruiertes Feedback die Textüberarbeitung, die Motivation und die positiven Emotionen ([Meyer et al. 2024, Computers and Education: AI](https://doi.org/10.1016/j.caeai.2023.100199)).
- **Annahme:** Ein Drei-Gruppen-Experiment mit Masterstudierenden fand KI-Feedback (Zero-Shot) qualitativ auf Lehrer-Niveau — aber die Studierenden setzten es seltener in Überarbeitungen um als Lehrerfeedback ([IJETHE 2026](https://doi.org/10.1186/s41239-026-00579-9)). Feedbackqualität und Feedbackwirkung sind also getrennt zu messen.

Der Stand lässt sich fair so zusammenfassen: Gut instruiertes LLM-Feedback ist kein Ersatz für die Genauigkeit eines menschlichen Experten, aber ein wirksames, skalierbares Überarbeitungswerkzeug — und sein größtes Defizit ist nicht die Qualität, sondern die geringere Verbindlichkeit, die Lernende ihm zuschreiben.

**Systemfolge:** Erstens: Die Feedback-Qualität hängt an der Instruktion (Rubrik, Kriterien, Entwicklungsstand) — Ondas genrespezifische Prüfkataloge aus den Handwerksnotizen sind genau die Zutat, die generisches von wirksamem Feedback trennt. Zweitens: Der Genauigkeitsrückstand gegenüber Experten bestätigt Ondas Hinweisform — Beobachtung plus Prüffrage statt apodiktischem Urteil, denn ein Teil der Hinweise wird falsch sein. Drittens: Die Verbindlichkeitslücke spricht dafür, dass Hinweise Erledigungszustände haben (erledigt, bewusst akzeptiert, zurückgestellt) — was Onda bereits baut: Unverbindlichkeit ist beim KI-Feedback der dokumentierte Ausfallmodus.

## 6. Automation Bias und Übervertrauen

Automation Bias — die Tendenz, maschinellen Ausgaben auch gegen eigene Evidenz zu folgen — ist eines der ältesten Ergebnisse der Human-Factors-Forschung ([Parasuraman & Manzey 2010, Human Factors](https://doi.org/10.1177/0018720810376055)) und wiederholt sich bei generativer KI:

- Eine Microsoft-Literaturauswertung über mehr als hundert Studien beschreibt Übervertrauen als Standardrisiko von KI-Assistenz und dokumentiert, dass viele naheliegende Gegenmittel (Erklärungen, Konfidenzanzeigen) in Studien wirkungslos blieben oder nach hinten losgingen ([Passi & Vorvoreanu 2022, Microsoft AETHER](https://www.microsoft.com/en-us/research/wp-content/uploads/2022/06/Aether-Overreliance-on-AI-Review-Final-6.21.22.pdf); Folgesynthese [2024](https://www.microsoft.com/en-us/research/wp-content/uploads/2024/03/GenAI_AppropriateReliance_Published2024-3-21.pdf)).
- Längere, flüssigere LLM-Erklärungen erhöhen das Nutzervertrauen, ohne die Richtigkeit zu verbessern ([Steyvers et al. 2025, Nature Machine Intelligence](https://doi.org/10.1038/s42256-024-00976-7); Details in der [Slop-Notiz](2026-07-19-ki-text-slop.md)).
- **Gerade gute KI macht nachlässig:** In einem Experiment mit 181 Recruitern wandten Nutzer einer hochwertigen KI (85 % Trefferquote) weniger Zeit und eigene Prüfung pro Bewerbung auf und folgten den Empfehlungen blinder — ihre Trefferquote lag am Ende nicht über der von Nutzern einer schlechteren KI (Dell'Acqua, „Falling Asleep at the Wheel"; Working Paper, nicht peer-reviewt, methodisch [umstritten](https://blog.jcx.au/posts/human-ai-collaboration-is-it-better-when-the-human-is-asleep-at-the-wheel)). Robuster belegt ist das BCG-Experiment mit 758 Beratern: GPT-4 hob die Qualität innerhalb seiner Kompetenzgrenze deutlich — aber bei einer Aufgabe knapp außerhalb sank die Richtigkeit der KI-Nutzer von 84 % auf 60–70 %, weil sie der Ausgabe folgten ([Dell'Acqua et al. 2023, HBS Working Paper](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4573321)).
- In einer CHI-Befragung von 319 Wissensarbeitern mit 936 realen Beispielen galt: je höher das Vertrauen in die KI, desto weniger eigenes kritisches Prüfen; je höher das Vertrauen in die eigene Kompetenz, desto mehr — bei gefühlt höheren Kosten ([Lee et al. 2025, CHI](https://doi.org/10.1145/3706598.3713778); selbstberichtet, keine Verhaltensmessung).

**Systemfolge:** Übervertrauen ist kein Nutzerfehler, sondern eine Systemeigenschaft, die mit der Qualität der Assistenz wächst — Onda muss also gerade dann Reibung erhalten, wenn seine Hinweise gut werden. Konkret: Hinweise müssen ihre Unsicherheit und Prüffrage behalten (kein Urteilston bei unsicherer Diagnose), Übernahmen bleiben einzelne bewusste Akte statt Sammel-Akzeptanz, und die Verwerfung eines Integritätshinweises verlangt weiterhin die zweite, ausdrückliche Risikoannahme. Der Dell'Acqua-Befund stützt außerdem die Monatsgrenze und Laufsperren: Weniger, gezieltere Agentenläufe halten die Prüfbereitschaft höher als ein Dauerstrom.

## 7. Die Deskilling-Frage: verlernt man Schreiben?

Die ehrliche Antwort: Für dauerhaften Fähigkeitsverlust durch KI-Schreibassistenz gibt es noch keinen Langzeitbeleg — aber drei konvergierende Indizienlinien:

- **Lernkontext, kausal:** Im PNAS-Feldexperiment mit fast 1.000 Schülern verbesserte ChatGPT-Zugang die Übungsleistung massiv (+48 % Basis-ChatGPT, +127 % mit Tutor-Leitplanken). Nach Entzug des Zugangs schnitten die Basis-ChatGPT-Schüler in der Prüfung aber 17 % schlechter ab als die Kontrollgruppe ohne jede KI — sie hatten Antworten kopiert statt Fähigkeiten aufgebaut. Die Leitplanken-Version (Hinweise statt Lösungen) hob die Übungsleistung, ohne die Prüfungsleistung zu senken ([Bastani et al. 2025, PNAS](https://doi.org/10.1073/pnas.2422633122)).
- **Kognitive Beteiligung, vorläufig:** Die EEG-Studie „Your Brain on ChatGPT" (54 Teilnehmer, [arXiv-Preprint 2025, nicht begutachtet](https://arxiv.org/abs/2506.08872)) fand bei LLM-gestütztem Essayschreiben die schwächste gemessene Hirnkonnektivität, das geringste Ownership-Gefühl und die schlechteste Fähigkeit, aus dem eigenen Text zu zitieren; wer erst ohne und dann mit LLM schrieb, blieb stärker beteiligt. Kleine Stichprobe, methodische Kritik liegt vor ([Kommentar Stanković et al.](https://arxiv.org/abs/2601.00856)) — als Richtungsindiz brauchbar, als Beweis nicht.
- **Selbstbericht und Korrelation:** Wissensarbeiter berichten reduzierten kognitiven Aufwand über fast alle Denktätigkeiten hinweg ([Lee et al. 2025](https://doi.org/10.1145/3706598.3713778)); Befragungsdaten zeigen negative Korrelationen zwischen intensiver KI-Nutzung, kognitivem Auslagern und kritischem Denken ([Gerlich 2025, Societies](https://doi.org/10.3390/soc15010006); korrelational, keine Kausalrichtung).

Gegen die Verlust-These steht: Feedback-Studien (Abschnitt 5) zeigen echte Lerneffekte, wenn die KI erklärt statt liefert, und das Bastani-Experiment zeigt denselben Unterschied kausal. Nicht die KI-Nutzung an sich, sondern die Auslieferung fertiger Lösungen ist der belegte Risikofaktor.

**Systemfolge:** Der Bastani-Kontrast ist die empirische Blaupause für Onda: Hinweise, Prüffragen und Erklärungen statt fertiger Lösungen — genau die Unterscheidung zwischen GPT Base (schadet nach Entzug) und GPT Tutor (schadet nicht). Für die GROW-Frage aus [VISION-GEGEN-GEBAUTES](../VISION-GEGEN-GEBAUTES.md) folgt hart: Textqualität während der Nutzung ist als Lernbeleg wertlos; ein GROW-Eval muss Können ohne Assistenz messen (etwa: erkennt der Schreiber ein Muster später selbst, bevor der Agent es anmerkt?) oder Transfer (taucht ein einmal erklärtes Problem in späteren Texten seltener auf?).

## 8. Was Schutzmechanismen taugen

Die Interventionsforschung ist jünger, aber es gibt belastbare Muster:

- **Eigene Fassung zuerst:** In einem kontrollierten Experiment (60 Teilnehmer) reduzierte LLM-Zugang von Beginn an die Zahl origineller Ideen sowie kreative Selbstwirksamkeit und Selbst-Zuschreibung — vermittelt über Autonomie und Ownership. LLM-Zugang erst nach eigenständiger Ideenphase vermied das weitgehend; die Autoren empfehlen explizit, KI-Hilfe zu verzögern, bis eigene Ideen vorliegen ([Timing Matters, CHI 2025](https://doi.org/10.1145/3706598.3713146)). Dazu passt der Phasenbefund aus Abschnitt 4: Planungshilfe kostet wenig Ownership, Entwurfshilfe viel.
- **Hinweise statt Lösungen:** Der Leitplanken-Effekt bei Bastani et al. (Abschnitt 7) ist der stärkste kausale Beleg, dass dieselbe Modellfähigkeit je nach Ausgabeform schadet oder nützt.
- **Kognitive Zwangsfunktionen:** Reibung vor der Übernahme — Antwort erst auf Anforderung zeigen, Wartezeit, erst selbst entscheiden — reduzierte Übervertrauen in KI-Empfehlungen signifikant stärker als erklärende Transparenz. Der Haken: Genau die wirksamsten Varianten wurden von den Nutzern am schlechtesten bewertet, und die Schutzwirkung war ungleich verteilt ([Buçinca, Malaya & Gajos 2021, CSCW](https://doi.org/10.1145/3449287)). Reibung wirkt, aber sie hat einen Akzeptanzpreis, und Design muss ihn tragen.
- **Verankerung statt Chat:** Ein Interface, das KI-Kommentare an konkrete Textstellen bindet (statt Chatfenster), führte zu gezielteren Überarbeitungen und stärkerem Kontroll- und Ownership-Erleben ([AnchoredAI, arXiv-Preprint 2025](https://arxiv.org/abs/2509.16128)) — Ondas passagengebundene Hinweise sind exakt dieses Muster.
- **Mehrere Vorschläge, sichtbare Alternativen:** Drei bis sechs parallele Formulierungsvorschläge wirkten in einem Email-Experiment (156 Teilnehmer) als Ideengeber, kosteten aber Effizienz; Nicht-Muttersprachler profitierten stärker ([Buschek, Zürn & Eiband 2021, CHI](https://doi.org/10.1145/3411764.3445372)). Einzelvorschläge laden zum Übernehmen ein, Alternativmengen zum Entscheiden.
- **Divergenz ist herstellbar:** Eine konsensbewusste Interaktionstechnik, die Konsensphrasen erkennt und semantisch abstoßende Alternativen erzwingt, erhöhte die semantische Vielfalt von KI-Ausgaben um 85–167 %, ohne Kohärenz zu kosten ([Seeing the Hivemind, arXiv-Preprint 2026](https://arxiv.org/abs/2606.09587); kleine Nutzerstudie). Das Naheliegende zu vermeiden ist also kein frommer Wunsch, sondern eine baubare Eigenschaft.

Zugleich gilt die Warnung aus der Microsoft-Synthese: Mitigationen können wirkungslos sein oder backfiren; ob ein Schutz im konkreten Produkt trägt, zeigt nur die eigene Messung.

**Systemfolge:** Onda hat mehrere dieser Mechanismen bereits als Setzung (passagengebundene Hinweise, bewusste Einzelübernahme, „Eigene Fassung schreiben", Risikoannahme mit zweiter Bestätigung). Die Empirie ergänzt drei Bauaufträge: (1) Eigene-Fassung-zuerst nicht nur anbieten, sondern zum Standardpfad machen — der Agent fragt nach dem eigenen Versuch, bevor er formuliert. (2) Bei Formulierungsvorschlägen nie genau einen zeigen, sondern strategisch verschiedene (die bestehende Regel „echte Alternativen über verschiedene argumentative Strategien" deckt das). (3) Divergenz technisch erzwingen statt erhoffen: Naheliegendes benennen und dann gezielt Abstand davon nehmen — mit semantischer Distanzmessung als Kontrolle.

## 9. Grenzen der Befundlage

- Fast alle Experimente sind englischsprachig, kurz (eine Sitzung) und mit Laien oder Studierenden; Langzeiteffekte auf geübte Schreiber und deutschsprachige Settings sind kaum untersucht.
- Viele Schlüsselbefunde beruhen auf älteren Modellen (GPT-3/3.5/4); Effektrichtungen wirken stabil, Effektgrößen sind nicht übertragbar. Der Padmakumar/He-Befund legt sogar nahe, dass neuere, stärker abgestimmte Modelle das Homogenisierungsproblem eher verschärfen.
- Die Deskilling-Belege stammen aus Lernkontexten (Mathematik, Essays von Schülern) und Selbstberichten; für erfahrene Autoren, die bewusst mit KI arbeiten, fehlt der Nachweis in beide Richtungen.
- Ownership- und Kreativitätsmaße sind heterogen (Selbstbericht, Jurybewertung, Embedding-Distanz); Vergleiche zwischen Studien sind nur der Richtung nach zulässig.
- Interventionsstudien (Timing, Reibung, Verankerung) haben kleine Stichproben und messen selten, ob der Schutz über Wochen der Nutzung Bestand hat oder umgangen wird.

## 10. Implikationen für Onda

**Welche Setzungen die Empirie bestätigt:**

- **Nie selbst Text ändern, bewusste Übernahme:** Ownership hängt kausal am eigenen Beitrag (Draxler, DIS-Phasenstudie); Auto-Übernahme wäre der direkte Weg in Ghostwriter-Effekt und Verantwortungsdiffusion.
- **Hinweise und Prüffragen statt Lösungen:** Der Bastani-Kontrast (Tutor vs. Base) ist der kausale Beleg, dass genau diese Ausgabeform Lernen erhält statt zerstört; die Feedback-RCTs zeigen, dass sie zugleich wirksam ist.
- **Keine Auto-Vervollständigung im Editor:** Arnold (vorhersagbareres Schreiben), Jakesch (Meinungsverschiebung beim Tippen) und Kosmyna (geringste Beteiligung bei Integration während des Schreibens) treffen alle den Vorschlag-im-Schreibfluss. Ondas Trennung — Schreiben im Editor, Vorschläge als getrennte, markierte Angebote — ist empirisch die sicherere Architektur.
- **Passagengebundene Hinweise, Erledigungszustände, Risikoannahme:** AnchoredAI (Agency durch Verankerung), die Verbindlichkeitslücke des KI-Feedbacks (IJETHE) und die Zwangsfunktions-Forschung (Buçinca) stützen alle drei bestehende Mechanismen.
- **Beobachtungsbasierter Autorschaftsnachweis:** Der Ghostwriter-Effekt zeigt, dass Selbstdeklaration systematisch unterbleibt — Ondas Ableitung aus lokalen Ereignissen ist die richtige Antwort.

**Welche Setzungen sie in Frage stellt oder verschärft:**

- **„Angebote statt Änderungen" genügt nicht gegen latente Persuasion.** Jakesch zeigt Meinungsverschiebung bei 63 % selbst geschriebenen Sätzen; Arnold zeigt Inhaltsverschiebung durch bloße Vorschlagsfärbung. Die Hinweis-Auswahl selbst — worauf der Agent zeigt, welche Gegenargumente er wählt — ist ein Persuasionskanal, den keine bestehende Onda-Setzung adressiert. Nötig ist eine Einseitigkeits-Prüfung der eigenen Hinweislage je Text (beide Richtungen einer strittigen Frage erreichbar? Enthaltung sichtbar, wo Material fehlt?).
- **Bewusste Übernahme kann zur Geste verkommen.** Überarbeitungsvorschläge werden deutlich bereitwilliger übernommen als Planungsideen (DIS 2026), und Übervertrauen wächst mit der Assistenzqualität (Dell'Acqua). Die Übernahme-Interaktion muss Prüfung erzwingen können, gerade wenn Ondas Hinweise gut werden — etwa indem der Vorschlag die eigene Prüffrage mitliefert, die vor Übernahme beantwortet oder bewusst übergangen wird.
- **Homogenisierung ist für den Einzelnen unsichtbar.** Kein Nutzer kann am eigenen Text sehen, dass er zur Mitte wandert. Wenn Onda die Sorge aus VISION §4 ernst meint, muss das System die Messung übernehmen: Distanz der Vorschläge zum Naheliegenden, Entwicklung der eigenen Stimme über Texte hinweg.

**Risiken und ihr Schutz:**

| Risiko (Beleg) | Schutz (Beleg) |
|---|---|
| Homogenisierung zur Mitte (Doshi/Hauser, Padmakumar/He, Anderson) | Divergenz erzwingen: Naheliegendes explizit benennen und meiden, semantische Distanz messen (Hivemind-SRT); mehrere strategisch verschiedene Alternativen (Buschek) |
| Latente Meinungsverschiebung durch Hinweis-Auswahl (Jakesch, Arnold) | Einseitigkeits-Bilanz der Hinweise je Text; Gegenargumente beider Richtungen; Enthaltung als sichtbarer Zustand (bestehende Deliberations-Regeln auf die Hinweis-Auswahl selbst anwenden) |
| Ownership-Verlust, Ghostwriter-Effekt (Draxler, DIS 2026) | Planungs-/Überarbeitungshilfe statt Entwurfsgenerierung; Einfluss sichtbar halten; beobachteter Autorschaftsnachweis |
| Übervertrauen bei guter Assistenz (Dell'Acqua, Buçinca, Steyvers) | Reibung erhalten: Einzelübernahme, Prüffrage vor Übernahme, zweite Risikoannahme, Laufgrenzen — und den Akzeptanzpreis der Reibung bewusst gestalten |
| Deskilling durch Lösungslieferung (Bastani, Kosmyna vorläufig) | Hinweise statt Lösungen; Eigene-Fassung-zuerst als Standardpfad (Timing Matters); Können ohne Assistenz messen |

**Was für DIVERGE- und GROW-Evals folgt:**

- **DIVERGE braucht eine Median-Baseline:** Der Eval muss dieselbe Aufgabe einmal ohne Divergenz-Anforderung generieren (der „wahrscheinlichste" Hinweis/Vorschlag) und messen, ob Ondas tatsächliche Ausgabe semantisch messbar davon abweicht — Embedding-Distanz als harte Metrik ist etabliert (Padmakumar/He, Anderson, Hivemind). Kontrastpaar-Logik wie bei den bestehenden Quality-Evals: der divergente Weg muss den Median-Köder schlagen.
- **DIVERGE muss über Sitzungen messen:** Homogenisierung ist ein Verteilungseffekt. Ein Eval, der nur Einzelausgaben prüft, kann sie prinzipiell nicht sehen; nötig ist ein Korpus-Eval über viele Läufe (streuen die Vorschläge, oder kehren dieselben Denkfiguren wieder?).
- **DIVERGE muss Ausgewogenheit einschließen:** Die Jakesch-Lektion — je strittiger These, desto wichtiger, dass die Hinweislage beide Richtungen erreicht. Messbar als Positions-Bilanz über die Hinweise eines Laufs.
- **GROW darf nicht In-Session-Qualität messen:** Bastani zeigt, dass Leistung mit Assistenz und Können danach auseinanderfallen. GROW-Evals brauchen Entzugs-Logik: Erkennt der (simulierte oder echte) Schreiber ein einmal erklärtes Muster im nächsten Text selbst? Sinkt die Wiederkehr einer Fehlerfamilie über Texte? Das setzt voraus, dass Onda Hinweisfamilien über Texte hinweg wiedererkennt — die Ereignisbasis dafür existiert (Entscheidungsverlauf, Projektgedächtnis), die personenbezogene Ebene fehlt (VISION §3).
- **Ein Timing-Eval fehlt beiden Suiten:** Bietet der Agent Formulierungen erst an, nachdem eine eigene Fassung existiert oder ausdrücklich verweigert wurde? Das ist beobachtbar und direkt aus Timing Matters ableitbar.

**Offene Fragen an Jakob:**

1. **Eigene-Fassung-zuerst — Standard oder Zwang?** Die Empirie stützt Verzögerung von Formulierungshilfe klar. Soll Onda sie erzwingen (Formulierungsvorschlag erst nach eigenem Versuch bzw. expliziter Verweigerung), oder nur als Standardpfad nahelegen? Zwang schützt stärker, kostet Akzeptanz (Buçinca).
2. **Wie viel Reibung bei der Übernahme?** Reicht der bewusste Klick, oder soll die Übernahme eines Vorschlags die Prüffrage sichtbar beantworten lassen? Wo ist die Grenze zwischen Schutz und Gängelung — und gilt sie für alle Textsorten gleich (Marketing-Schnellarbeit vs. wissenschaftlicher Text)?
3. **Einseitigkeits-Bilanz — sichtbar für dich oder nur intern?** Soll die Positions-Bilanz der Hinweise (beide Richtungen erreicht? wo enthält sich der Agent?) ein sichtbares Dossier-Element werden oder nur ein internes Eval-Kriterium?
4. **GROW-Messung braucht dich als Messpunkt.** Können ohne Assistenz lässt sich nur messen, wenn es gelegentlich Schreiben ohne Hinweise gibt (bewusste „stille" Passagen oder Texte). Wärst du bereit, das als Ritual zu akzeptieren, damit das System Wachstum ehrlich messen kann?
5. **Median-Baseline im Betrieb oder nur im Eval?** Die Doppel-Generierung (Median-Köder vs. divergenter Vorschlag) kostet Tokens. Soll sie nur in Evals laufen oder gelegentlich im Betrieb, damit der Agent seine eigene Naheliegendheit im Ernstfall prüft (die Selbstprüfungs-Anforderung aus dem Abstract, VISION §3)?
