# Vorhaben — die Regel

Dies ist **keine Liste laufender Vorhaben**. Dies ist die Regel, nach der die Liste
entsteht: Sie entsteht als Ordner nebeneinander, und niemand pflegt sie.

## Die Regel

> **Ein Ordner je laufendem Vorhaben. Nie eine gemeinsame Liste.**

Der Ordnername ist das Startdatum, dann ein kurzer Name, mit Bindestrichen verbunden:

```
betrieb/vorhaben/2026-08-09-aufraeumen/
betrieb/vorhaben/2026-09-01-schreibraum/
```

Umlaute kommen in Ordner- und Dateinamen **nie** vor — im Text darin selbstverständlich
schon. Das Datum steht vorn, damit die Ordner sich von selbst in der Reihenfolge sortieren,
in der sie entstanden sind.

## Warum ein Ordner und nicht eine Zeile in einer Datei

Der Grund ist technisch und einfach: **Git kennt keinen Konflikt zwischen zwei Dateien,
die es vorher nicht gab.**

Legen zwei Arbeiten gleichzeitig je einen eigenen Ordner an, führt Git beide zusammen,
ohne zu fragen. Schreiben dieselben zwei Arbeiten stattdessen je eine Zeile in eine
gemeinsame Übersicht, streiten sie sich um dieselbe Stelle in derselben Datei — und
irgendwer entscheidet den Streit von Hand, meist müde und meist zugunsten der eigenen
Zeile. So verschwinden Einträge.

Der zweite Grund ist menschlich: Eine gemeinsame Liste muss jemand **aufräumen**. Ein
erledigtes Vorhaben bleibt sonst als Zeile stehen, bis niemand mehr weiß, ob es noch
läuft. Ein Ordner braucht das nicht — er trägt sein Datum im Namen und erzählt durch
seinen Inhalt selbst, wie weit er gekommen ist.

## Was in so einen Ordner gehört

Alles, was nur zu diesem einen Vorhaben gehört und sonst nirgends hinpasst. Kein
festes Formular, aber diese vier Sorten sind die üblichen:

- **Was erreicht werden soll**, in einem Absatz und ohne Fachjargon.
- **Die Messlatte:** der Stand *vor* der Arbeit, mit dem Befehl daneben, mit dem die Zahl
  geholt wurde. Ohne den Befehl ist eine Zahl wertlos — genau daran ist es schon einmal
  gescheitert, als drei Agenten für dieselbe Frage drei verschiedene Zahlen lieferten,
  weil keiner dazuschrieb, wie er gezählt hatte.
- **Der Plan**, in Schritten, die einzeln prüfbar sind.
- **Das Ergebnis**, wenn es so weit ist: was wirklich passiert ist, gemessen, nicht
  vermutet.

## Wann ein Vorhaben endet

Der Ordner **bleibt liegen**. Er wird nicht gelöscht und nicht verschoben.

Ein abgeschlossenes Vorhaben ist die einzige ehrliche Auskunft darüber, was damals
gemessen wurde und warum so entschieden wurde, wie entschieden wurde. Wer wissen will, ob
das Aufräumen im August 2026 etwas kaputt gemacht hat, liest die Messlatte aus jenem
Ordner — sie steht dort, mit den Befehlen, mit denen sie geholt wurde.

Dass ein Vorhaben abgeschlossen ist, schreibt man **in den Ordner hinein**, nicht in eine
Übersicht daneben.

## Der Unterschied zum Leitstand

Beides klingt ähnlich, ist aber getrennt, und die Trennung lohnt sich:

- **`betrieb/leitstand/<zweigname>.md`** beantwortet: *Woran arbeitet dieser Zweig gerade,
  wie weit ist er, was muss ein anderer wissen.* Kurzlebig, gehört zu einem Zweig.
- **`betrieb/vorhaben/<datum>-<name>/`** beantwortet: *Was sollte diese größere Arbeit
  erreichen, woran wird sie gemessen.* Langlebig, überlebt jeden einzelnen Zweig, und
  mehrere Zweige können auf dasselbe Vorhaben einzahlen.

Kleine Arbeiten brauchen **kein** Vorhaben. Ein Leitstand-Eintrag reicht. Ein Ordner hier
lohnt sich erst, wenn eine Arbeit über mehrere Zweige läuft oder eine Messlatte braucht,
an der man sie später ehrlich prüfen kann.
