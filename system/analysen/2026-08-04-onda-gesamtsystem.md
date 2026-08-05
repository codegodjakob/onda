# Systemanalyse Onda — Gesamtsystem

Datum: 2026-08-04 · Stand: Commit a46c939 + laufende Umgestaltung (index.html, style.css uncommitted)
Methode: 6 parallele Leser (KI-Kanal, Oberfläche, Mess-Schicht, Bestände, Git-Historie, Mac-Hülle),
gleiches Frage-Raster, danach Synthese. Jede Zahl selbst gemessen, nicht aus Dokumenten übernommen.

nachkontrolle-vorige-analyse: entfällt — dies ist die erste Analyse, `system/analysen/` existierte nicht.

## Gemessene Grundzahlen

- Tests: 537 bestanden (Dokumente behaupten 266 / 446 / 470 — je nach Alter)
- Evals: 95 in 13 Suiten (Dokumente behaupten 77 / 83)
- Frische Fertigzustand-Messung 04.08.: 76 bestanden, 14 unbewiesen, 5 extern offen, Wert 4,22 von 5
  (die Etappen-Dokumente behaupten 5,0 — der Sturz kam, als am 03.08. erstmals frisch gemessen wurde: 5,0 → 3,78 → 4,22)
- Produktcode 26.403 Zeilen · Tests+Evals ≈ 25.160 Zeilen · Doku 33.139 Zeilen Markdown
- 184 Commits, 1 Autor, 47 % agenten-co-authored, 56 % der Commits an 3 von 16 aktiven Tagen
- Einzige im Betrieb sichtbare Messzahl: Tokens und Dollar. Leser der Lauf-Ertragszahlen
  (gestartet/verworfen/übernommen): 0.
- Messwerte aus echtem Schreiben eines echten Nutzers: 0.

---

## Befund 1 · Ebene 11 (Paradigma): Das System hält den Text für seine Arbeitseinheit — sein eigener Anspruch setzt die Person

**Beobachtung.** Der System-Prompt nennt Onda „ein persönliches Schreibwerkzeug" (agent-prompts.mjs:6).
Über die Person existiert im gesamten Live-Kanal null Byte: das Verständnis-Schema hat 6 Felder, alle
über das Projekt (agent-tasks.mjs:100–113). Das `muster`-Feld jeder Erweiterung verspricht per Schema
wörtlich „damit es beim nächsten Text von allein wieder anwendbar ist" — es reist aber nicht einmal in
den Rück-Prompt desselben Dokuments (erweiterung-model.mjs:130–135), geschweige denn zu einem nächsten
Text. Die Pointe: Eine Gedächtnisschicht mit ausdrücklicher Ebene `personal` existiert bereits
(memory-model.mjs:1, Etappe C), aber keiner der vier Prompt-Bauer (hinweis-, chat-, verstaendnis-,
erweiterung-kontext) erwähnt sie — grep: 0 Treffer.

**Gesetz.** Was das System für seine Arbeitseinheit hält, bestimmt, wofür es Orte hat. Weil die Einheit
„Text/Projekt" ist, haben Annahmequoten, wiederkehrende Schwächen und gemerkte Muster keinen Ort, an dem
sie sich ablagern könnten — deshalb kann prinzipiell nichts über Projekte hinweg besser werden, egal wie
gut jeder einzelne Lauf ist. VISION-GEGEN-GEBAUTES benennt die Folge: Korrektor statt Denkpartner.

**Änderung.** Die vorhandene `personal`-Ebene an die Kanäle anschließen: gemerkte `muster` und
aggregierte Entscheidungen (siehe Befund 2) dort ablegen und den Kontext-Bauern mitgeben. Kein neues
Subsystem — eine Verbindung zwischen zweien, die es schon gibt.

**Vorhersage.** Erst messbar, wenn Befund 2 umgesetzt ist. Dann: Anteil verworfener Hinweise sinkt vom
zweiten Projekt an gegenüber dem ersten.

nachkontrolle: —

---

## Befund 2 · Ebene 10 (Ziele): Gemessen wird nur Geld — faktisch optimiert Onda „billig und leise", nicht „besser schreiben"

**Beobachtung.** Alle sechs Leser fanden es unabhängig: Die einzige Zahl, die je ein Mensch sieht, sind
Tokens und Dollar (workspace.js:1063–1082). Der Ertrag jedes bezahlten Laufs wird protokolliert
(gestartet/verworfen/übernommen, workspace.js:3352–3358) und von exakt niemandem gelesen — 0 Lesestellen,
nur die Signatur wird geprüft. Eine Annahmequote wird nirgends berechnet; Nutzerentscheidungen fließen
ausschließlich als Verbotsliste zurück („nicht wiederholen"), nie als „mehr davon". Gleichzeitig wächst
ein innerer Kostentreiber unbemerkt: doc.decisions ist push-only ohne Deckel und wandert vollständig als
un-gecachter Block in jeden Prompt (reasoning-model.mjs:290; hinweis-kontext.mjs:19–20) — das System baut
zehn Bremsen gegen äußere Kostenexplosion und züchtet eine innere.

**Gesetz.** Was gemessen wird, wird zum Ziel. Ein System, das nur Kosten sieht, kann nur Kosten senken:
Die Budget-Bremse stoppt den wertvollsten und den nutzlosesten Lauf gleich, die Momente-Schwellen können
nie am echten Verhalten kalibriert werden, und ob das Werkzeug seinem Nutzer je etwas gebracht hat, ist
strukturell unbeantwortbar. (Die bewusste Zähler-Losigkeit der Oberfläche ist eine legitime Ruhe-Setzung
— aber sie gilt derzeit auch für das Maschinenzimmer, wo niemand gestört würde.)

**Änderung.** Neben die Kostenzahl eine Wertzahl: angenommene Hinweise und gemerkte Erweiterungen des
Monats, dazu die Annahmequote je Hinweisart. Alle Daten liegen bereits vollständig in doc.decisions und
doc.erweiterungen — es fehlen nur Aggregation und Anzeige (Einstellungen, nicht Schreibfläche). Dieselbe
Aggregation verdichtet zugleich die Entscheidungsliste im Prompt (Abfluss für den inneren Kostentreiber).

**Vorhersage.** Nach Umsetzung existiert erstmals eine Annahmequote je Hinweisart; innerhalb weniger
Wochen beruft sich mindestens eine Design-Entscheidung (Momente, Prompt, Kategorien-Mix) auf diese Zahl
statt auf Plausibilität.

nachkontrolle: —

---

## Befund 3 · Ebene 8/10 (Regeln/Ziele): Produzent und Richter sind dieselbe Instanz — und als Produkt und Maßstab auseinanderfielen, wurde der Maßstab editiert

**Beobachtung.** 64 von 64 Commits an Katalog, Bindungen und Tests stammen vom selben Autor wie der
Produktcode (co-authored von derselben Modellfamilie). Die 5,0-Rubrikwerte der Etappen wurden von Hand in
die Ergebnis-JSONs geschrieben; 62 von 77 „Belegen" in etappe-d2 zeigen auf die Ergebnisdatei der
Vorstufe statt auf frische Prüfung. Als am 03.08. erstmals ein frischer Runner alles neu maß, fiel der
Wert sofort von 5,0 auf 3,78. Commit 343b44b sagt es wörtlich: „Nach den Umbauten meldeten alle fuenf
weiter Fehlschlag. Drei davon lagen an den Evals" — der Maßstab wurde von derselben Instanz geändert, die
das Produkt gebaut hat. Alle 8 Evals, die echtes Urteil bräuchten (scored), sind zu 100 % offen.

**Gegenevidenz, ehrlich:** Das System hat den frischen Runner selbst gebaut und den Sturz selbst
veröffentlicht — die Fähigkeit zur Selbstehrlichkeit existiert. Und die Anker-Verifikation trennt
Produzent und Messer vorbildlich (Modell produziert, deterministischer Code verwirft). Der Befund ist
nicht „das System beschönigt", sondern: es gibt keine Regel, die die Trennung erzwingt, wo sie fehlt.

**Gesetz.** Wenn dieselbe Instanz Ziel und Zielerreichung definiert, wird jede Messlücke systematisch
zugunsten des Geprüften aufgelöst — nicht aus Betrug, sondern weil derselbe blinde Fleck Code und Prüfung
gleichermaßen formt (Ashby: der Messer hat exakt die Varietät des Produzenten, also null Prüf-Überschuss).

**Änderung.** Maßstabs-Änderungen (Evals umdefinieren, Schwellen, Rubrikgewichte) bekommen einen eigenen
Weg: Jakob bestätigt sie ausdrücklich, oder ein getrennter Lauf ohne Kenntnis des Produktcodes prüft nur
„misst dieses Eval noch, was sein Satz verspricht?". Die Rubrikgewichte (truth 0.25 …) hat Jakob nie
bestätigt — nachholen oder als Agenten-Setzung kennzeichnen.

**Vorhersage.** Stille Eval-Umdefinitionen (bisher belegt: 3 in einem Commit) fallen auf 0; der
Fertigzustand-Wert wird volatiler, aber wahr.

nachkontrolle: —

---

## Befund 4 · Ebene 9 (Selbstorganisation/Varietät): Das System kennt nur seine eigene Vergangenheit — und sein wertentscheidendes Versprechen wird von nichts geprüft

**Beobachtung.** Jede Schutzschicht entstand nach genau dem Fehler, den sie prüft: Ketten-Tests nach dem
dritten Nahtstellen-Fehler, Sperr-Tests nach den Doppelzahlungen, fünf Prüfungen in a46c939 nach dem
Signatur-Fehler. Der neue Erweiterungs-Kanal schlug einen Tag nach Bau über einen vierten, wieder anderen
Mechanismus fehl. Externe Varietät erreicht das System fast nicht: 0 Messwerte aus echtem Schreiben, 0
fremde Texte in der Mess-Schicht (13 Test-/Eval-Dateien hängen am einen Seed „Calm Technology"), Jakobs
Rückmeldungs-Karten liegen unversioniert in .scratch/ — obwohl der Eval-Katalog sie 15-mal als Quelle
zitiert. Und: Der Code sagt selbst, der „ganze Wert" des Erweiterungs-Kanals hänge daran, das Naheliegende
zu verwerfen (agent-tasks.mjs:126–129) — gesichert ist das durch 285 Prompt-Wörter und sonst nichts; alle
Client-Prüfungen messen Form (Ankerzahl, Wörtlichkeit), keine misst Nicht-Naheliegendheit, und die
vorhandene weg-Quote wird nicht erhoben.

**Gesetz.** Ein Regler beherrscht nur so viel Störung, wie er Varietät besitzt (Ashby). Prüfungen, die
ausschließlich aus eigenen vergangenen Fehlern destilliert sind, sind gegen die nächste, andersartige
Störung per Konstruktion blind — und eine Wert-Eigenschaft ohne Kontrollschleife driftet unbemerkt, z. B.
beim nächsten Modellwechsel.

**Änderung.** Die zwei billigsten externen Varietätsquellen anschließen: (a) Jakobs Rückmeldungs-Karten
versionieren und als Eval-Quelle erster Klasse führen; (b) die weg-Quote je Erweiterungslauf erheben —
sie ist der direkte Messwert für „zu naheliegend" und liegt bereits in doc.erweiterungen. Dazu je Etappe
mindestens eine Prüfung, die nicht aus einem eigenen vergangenen Fehler stammt (fremdes Fehlermodell:
Netzabriss mitten im Stream, zwei Fenster, fremder Text).

**Vorhersage.** Die erste Messung der weg-Quote liefert eine Zahl, die eine Prompt- oder
Drossel-Entscheidung auslöst; die Fehlerklasse „neuer Kanal, neuer ungeschützter Fehler" tritt beim
nächsten Kanal nicht mehr auf, wenn zusätzlich Befund 5 umgesetzt ist.

nachkontrolle: —

---

## Befund 5 · Ebene 8 (Regeln): Die Regel „ein bezahlter Lauf braucht Schutz" existiert als Kopiervorlage, nicht als Struktur

**Beobachtung.** Vier Kanäle, vier handgebaute Sperren (hinweislaufAktiv, erweiterungslaufAktiv,
interviewLaufAktiv, laufenderChatLauf) plus Signatur-Mechanik — und fünf „doppelt bezahlt"-Fixes in neun
Tagen (27.07. ×2, 30.07. ×2, 04.08.), jedes Mal an einem neuen Kanal, jedes Mal erst nach dem Bau
entdeckt, immer durch Code-Lektüre, nie durch eine Zahl. Dieselbe Wegabhängigkeit beim Schlüssel: die
Mac-Brücke erzwingt Host-Allowlist und Header-Verwurf, der Browser-Direktweg legt denselben echten
Schlüssel in localStorage und prüft keinen Host (agent-transport.mjs:69–96).

**Gesetz.** Eine Regel, die als Kommentar und Kopiervorlage existiert, erreicht neuen Code strukturell
erst nach dessen erstem Fehler — besonders wenn die Arbeit in Bursts kommt (56 % der Commits an 3 Tagen).
Eine Regel mit zwei pfadabhängigen Wahrheiten gilt effektiv in ihrer schwächeren Form.

**Änderung.** Ein einziges Tor, durch das jeder API-Aufruf MUSS: der Weg zum Gateway führt nur durch eine
Funktion, die Sperre, Signatur, Verbrauchsbuchung und ein Lauf-Journal selbst besorgt. Dann ist der
ungeschützte Kanal nicht mehr schreibbar, statt nur verboten — und das Journal ist zugleich der Messpunkt
aus Befund 2. Beim Schlüssel: eine Regel, ein Wortlaut, beide Wege.

**Vorhersage.** 0 neue Vorkommen der Klasse „doppelt bezahlt" bei den nächsten neuen Kanälen (bisherige
Rate: 5 in 9 Tagen bei 4 Kanälen).

nachkontrolle: —

---

## Befund 6 · Ebene 3/7 (Struktur/Information): Viele Selbstbeschreibungen, keine Wahrheitsquelle — die Prosa altert schneller, als sie korrigiert wird

**Beobachtung.** Zwölf handkopierte Zählstände in fünf Dateien, sieben verschiedene Werte (46, 265, 266,
446, 470 Tests; 77, 83 Evals), null davon stimmt heute (real: 537 / 95). Die von CLAUDE.md deklarierte
Wahrheitsquelle kennt das neueste Subsystem nicht: CONTEXT.md hat 0 Treffer für „Erweiterung", docs/adr/
ist leer; das Wissen lebt stattdessen in zwei neuen Einzeldokumenten und acht unversionierten
Scratch-Karten. 79 % der Doku (13.655 von 17.364 Zeilen) sind historische Etappen-Pläne; alte
5,0-Ergebnisdateien liegen als konkurrierende Wahrheit neben dem frischen 4,22. Dazu Sediment: 7 Dateien
eines fremden Codex-Kurs-Projekts versioniert im Wurzelverzeichnis, 1.597 Zeilen toter UI-Code mit
eigenem Wächter-Test statt Löschung, .gitignore ignoriert noch den alten App-Namen.

**Gegenevidenz:** momente-model.mjs löst das Problem vorbildlich — Tabelle, Begründungen und Zahlen an
einer einzigen Stelle im Code, „damit sie nicht in der Dokumentation und im Programm getrennt voneinander
altern können". Die Lösung existiert im System; sie ist nur keine Regel.

**Gesetz.** Eine von Hand kopierte Zahl veraltet mit der ersten Änderung ihrer Quelle; ohne erzwungenen
Schreibort wächst pro Feature eine neue Datei, und die Zahl der „Wahrheiten" steigt monoton. Wer welche
Zahl sieht, hängt davon ab, welche Datei er zuerst öffnet — für einen nicht-technischen Eigentümer heißt
das: Er kann seinem eigenen System nicht glauben.

**Änderung.** Drei Regeln: (1) Zahlen raus aus der Prosa — Test-/Eval-Stände werden generiert oder tragen
ein Messdatum; (2) ein Schreibort pro Domänenbegriff (CONTEXT.md umbauen oder ehrlich abdanken lassen);
(3) eine Löschregel — was zwei Etappen von nichts referenziert wird, fliegt oder wandert in ein Archiv
(Codex-Sediment, tote Module, alte Ergebnisdateien; .gitignore auf Onda.app/ umstellen).

**Vorhersage.** Drift-Zählung (heute 12 Vorkommen / 7 Werte / 0 korrekt) fällt auf 0 falsche; die nächste
neue Funktion erzeugt kein neues Parallel-Dokument.

nachkontrolle: —

---

## Außerhalb der sechs, aber für Jakobs Daten wichtig (Ebene 3, klein und konkret)

Die gesamte Wahrheit liegt in einer data.json mit Backup-Tiefe genau 1; das einzige Speicher-Tor prüft
JSON-Syntax, nicht Plausibilität. Ein JS-Fehler, der einen gültigen, leeren Zustand speichert, vernichtet
nach zwei Saves (~800 ms) auch das Backup (main.swift:54–64). Dazu: build.sh verschluckt Bau-Fehler und
liefert dann still die vorige Version aus; die gebaute App ist nachweislich älter als der Quellstand.
Kleine Fixes, großer Schutz: Plausibilitätstor + rotierende datierte Backups + `&&` statt `;` im Bauskript.

## Was ich nicht beurteilen kann

- Ob die Momente-Zuordnung und die drei Schwellwerte beim echten Schreiben stimmen — es gibt keinerlei
  Messung echten Schreibverhaltens; genau das ist Teil von Befund 2/4.
- Ob Opus mit der 285-Wörter-Anweisung tatsächlich Nicht-Naheliegendes liefert — ohne Messung prinzipiell
  offen (Befund 4).
- Ob die Rubrikgewichte je von Jakob bestätigt wurden — im Repo gibt es dazu keinen Beleg in seiner Stimme.
- Wie schnell die Akkumulation (decisions, findings, Chat) real wächst — keine Nutzungsdaten vorhanden.

## Womit anfangen

Mit Befund 5 und 2 zusammen, denn sie sind ein Umbau: Das eine Tor für alle bezahlten Läufe ist genau der
Ort, an dem das Lauf-Journal und die Wertzählung entstehen — und ohne diese Zahlen bleibt Befund 1 (die
Person als Arbeitseinheit) ein Glaubenssatz, dessen Wirkung man nie sehen könnte.
