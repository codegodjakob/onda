# Forschungsnotiz: Der Rhythmus der Anmerkungen — wann die nächste kommen darf

> Stand: 2026-08-08. Enge, angewandte Notiz zu genau einer Frage: In welchem Takt dürfen
> Anmerkungen erscheinen, damit das Schreiben nicht zerfällt?
>
> **Was hier NICHT steht**, weil es schon woanders steht: die Kosten einer Unterbrechung
> und der Wiederaufnahme-Verzug (`2026-08-05-feld-komposition-ueberarbeitung.md`,
> Abschnitt 4), die Menge gleichzeitiger Rückmeldung und die Vorrangfrage HOC vor LOC
> (`2026-08-05-feld-feedback-didaktik.md`, Abschnitt zur Mengenfrage). Diese Notiz
> ergänzt die dritte Frage, die beide offenlassen: nicht *wie viel* und nicht *wie
> teuer*, sondern **wann das Nächste kommen darf**.

## Kurzfazit

Drei Befunde, und alle drei treffen eine Regel, die heute im Code steht.

Erstens: Der Zeitpunkt einer Unterbrechung ist gestaltbar und wirkt stärker als ihre
Länge. Rückmeldung, die bis zu einer Aufgabengrenze wartet, kostet messbar weniger
Wiederaufnahme-Zeit und erzeugt weniger Ärger als dieselbe Rückmeldung sofort. Das ist
kein Stilargument, sondern ein gemessener Effekt — und es ist genau das Prinzip, das
Ondas drei Momente bereits umsetzen.

Zweitens: Was hängen bleibt, ist nicht die Unterbrechung, sondern das **Unerledigte**.
Der Aufmerksamkeitsrückstand ist am größten, wenn eine Sache offen und unbestimmt
liegenbleibt. Das hat eine unbequeme Folge für die naheliegende Idee, eine weggeklickte
Anmerkung als leises Merkzeichen im Text stehenzulassen: Ein sichtbar Offenes ist nicht
gratis. Es ist nur dann billig, wenn klar ist, dass es **geparkt** und nicht **pendent**
ist.

Drittens, und praktisch am wichtigsten: Eine Entscheidung ist selbst eine Grenze — aber
sie ist die Grenze *dieser* Rückmeldung, nicht der Beginn eines Rechts auf die nächste.
Genau hier hat Onda derzeit eine Regel, die das Gegenteil tut.

## 1. Der Zeitpunkt ist gestaltbar: defer-to-breakpoint

Die einschlägige Arbeit stammt aus der Mensch-Computer-Forschung, nicht aus der
Schreibdidaktik. Iqbal und Bailey haben Unterbrechungen an vorher bestimmten Stellen
einer echten Aufgabe ausgelöst — an Grenzen mit niedriger und mit hoher gedanklicher
Last sowie an zufälligen Momenten — und verglichen. Ergebnis: Unterbrechung an der
besten Grenze erzeugte durchgängig weniger Wiederaufnahme-Verzug und weniger Verärgerung
([Iqbal & Bailey, *Effects of Intelligent Notification Management on Users and Their
Tasks*, CHI 2008](https://dl.acm.org/doi/10.1145/1357054.1357070)).

Zwei Verfeinerungen daraus sind für Onda unmittelbar brauchbar:

- **Grenzen haben Körnungen.** Grob, mittel, fein — und sie lassen sich während der
  Arbeit vorhersagen, in ihren Modellen mit 69 % bis 87 % Treffergenauigkeit. Eine
  Satzgrenze ist eine feine, ein Absatzende eine mittlere, das Verlassen der
  Schreibansicht eine grobe Grenze.
- **Die Dringlichkeit des Inhalts bestimmt die Körnung.** Nicht jede Meldung darf auf die
  grobe Grenze warten, und nicht jede darf die feine benutzen. Der Zusammenhang zwischen
  *was* und *wann* ist Teil des Befunds, nicht eine Zutat.

Ein neuerer Überblick ordnet die Mechanismen dahinter ein und bestätigt die Richtung
([Frontiers in Psychology 2024, *Opportune moments for task
interruptions*](https://doi.org/10.3389/fpsyg.2024.1465323); Übersicht zum Feld:
[*Intelligent Notification Systems: A Survey*, arXiv 1711.10171](https://arxiv.org/pdf/1711.10171)).

**Systemfolge:** Ondas Momente-Tabelle (`app/src/momente-model.mjs`) ist die richtige
Bauform — drei Körnungen, Zuordnung nach Art der Rückmeldung. Die Forschung stützt sie,
und sie stützt auch die Sparsamkeit: Es gibt keinen Befund, der für „sofort" spricht,
außer bei Rückmeldung, deren Wert mit jeder Sekunde verfällt. Im Schreiben gibt es das
praktisch nicht.

## 2. Der Rückstand kommt vom Unerledigten, nicht von der Störung

Leroy hat gezeigt, dass ein Teil der Aufmerksamkeit bei der vorigen Aufgabe bleibt, wenn
man wechselt — sie nennt es Aufmerksamkeitsrückstand. Entscheidend ist die Bedingung: Der
Effekt ist am stärksten, wenn die vorige Aufgabe **unfertig und unbestimmt** liegenblieb,
und er verschwindet nicht nach einer Eingewöhnung, sondern hält über die neue Aufgabe an
([Leroy 2009, *Why is it so Hard to do My Work?*](https://www.uwb.edu/business/faculty/sophie-leroy/attention-residue)).

Der wirksame Gegenzug ist nicht Disziplin, sondern **Bestimmtheit**: Eine Sache, für die
ein klarer nächster Schritt oder ein klarer Zeitpunkt feststeht, bindet deutlich weniger
Aufmerksamkeit als dieselbe Sache im Zustand „irgendwann noch".

**Systemfolge, und sie widerspricht einer naheliegenden Gestaltungsidee:** Eine
weggeklickte, aber unentschiedene Anmerkung als stehenbleibendes Zeichen im Text ist
*nicht* die billige Lösung, als die sie sich anfühlt. Sie erzeugt genau die Lage, die
Leroy als teuerste misst — offen und unbestimmt. Sie wird nur dann billig, wenn das
Zeichen sagt, **wann** es wiederkommt („beim nächsten Aufschauen") statt bloß, **dass**
noch etwas offen ist. Ein Merkzeichen ohne Termin ist eine offene Schleife im Kopf des
Schreibenden.

## 3. Die Regel, die Onda heute falsch macht

In `app/src/momente-model.mjs` steht als Auslöser des Moments *Aufschauen*:

> `45 s Ruhe, die Schreibansicht verlassen — oder gerade über einen Hinweis entschieden.`

Und im Kommentar darüber die Begründung: *„wer einen Hinweis entschieden hat, schaut
ohnehin auf — dann muss der nächste nicht [warten]"*.

Der erste Teil des Satzes stimmt: Wer entscheidet, schaut auf. Der Schluss daraus ist
aber der falsche. Die Grenze, die durch eine Entscheidung entsteht, ist das **Ende der
Rückmeldungsarbeit**, nicht der Beginn eines Fensters für weitere. Praktisch bedeutet die
Regel: Jedes Wegklicken erzeugt sofort die nächste Anmerkung. Damit entsteht eine Kette,
die genau so lange läuft, wie es offene Hinweise gibt — der Zustand, den Jakob am
8.8.2026 beschrieben hat („wenn ich eins wegklick, dann kommt direkt das Nächste").

Aus den Befunden oben folgt die Gegenregel:

**Eine Entscheidung schließt einen Durchgang, sie öffnet keinen.** Nach einer
Entscheidung braucht es eine neue, unabhängig erreichte Grenze, bevor die nächste
Anmerkung erscheinen darf — also entweder Ruhe oder eine Absatzgrenze oder das Verlassen
der Ansicht. Wer drei Anmerkungen hintereinander sehen *will*, soll das ausdrücklich
anfordern können; von allein soll die Kette nicht entstehen.

Das ist eine Zeile Änderung und der billigste Gewinn auf der ganzen Liste.

## 4. Was die Reihenfolge angeht

Die Warteschlange sortiert heute nach Priorität, dann Integritätsfrage, dann Alter
(`app/src/reasoning-model.mjs`, `compareFindings`). **Wirkung kommt nicht vor.** Die
Schwesternotiz zur Feedback-Didaktik hat den Vorrang inhaltlich längst begründet — höhere
Ordnung (Struktur, Inhalt, Logik) vor niederer (Rechtschreibung, Zeichensetzung) —, und
die Forschung zur Überarbeitung stützt ihn: Rückmeldung, die die wesentlichen Züge zuerst
nimmt, führt zu bedeutsameren Überarbeitungen als flächendeckende Rückmeldung.

Was Onda schon hat und noch nicht nutzt: Hinweise, die Folge eines anderen sind, werden
über `rootCauseId` hinter ihre Ursache geparkt. Das ist „höchste Wirkung zuerst" im Keim.
Es fehlt nur die Angabe, die das Modell ohnehin bilden muss — **was diese Anmerkung dem
Text bringt** — als Sortierschlüssel vor dem Alter.

## 5. Eine Zahl, die nicht benutzt werden darf

Die Angabe „eine Unterbrechung kostet 23 Minuten und 15 Sekunden" zirkuliert breit und
wird Gloria Mark zugeschrieben. Sie ist als Regel **unbrauchbar**: Die Quellen
widersprechen sich schon darin, was sie misst — Zeit bis zur Rückkehr zur Aufgabe,
Anzahl dazwischenliegender Aufgaben, oder Wiederherstellung der vorigen Konzentration —,
und sie stammt aus einer Feldbeobachtung von Büroarbeit, nicht aus einer Messung am
Schreiben.

Was Mark tatsächlich zeigt, ist unbequemer und für Onda nützlicher: Unterbrochene Arbeit
wurde **schneller** fertig, aber unter mehr Stress, mehr Zeitdruck, mehr Anstrengung und
mehr Frustration ([Mark, Gudith & Klocke 2008, *The Cost of Interrupted Work: More Speed
and Stress*](https://dl.acm.org/doi/10.1145/1357054.1357072)). Geschwindigkeit ist also
kein Beleg dafür, dass eine Oberfläche gut getaktet ist. Ein Maß, das nur Durchsatz
misst, würde eine hektische Onda für die bessere halten.

**Systemfolge:** Keine Eval darf Anmerkungen pro Zeiteinheit belohnen. Und der
Fertigzustand sollte die Kehrseite messen — nicht nur, wie viele Hinweise angenommen
wurden, sondern ob dazwischen geschrieben wurde.

## Was daraus für die Umsetzung folgt

1. **Eine Entscheidung öffnet kein Fenster.** Der Auslöser „gerade über einen Hinweis
   entschieden" fällt aus dem Moment *Aufschauen* heraus (Abschnitt 3).
2. **Ein stehenbleibendes Zeichen braucht einen Termin.** Wenn eine weggelegte Anmerkung
   im Text sichtbar bleibt, muss sie sagen, wann sie wiederkommt (Abschnitt 2).
3. **Die Körnung folgt der Dringlichkeit**, nicht der Bequemlichkeit — die bestehende
   Momente-Tabelle ist die richtige Stelle dafür (Abschnitt 1).
4. **Wirkung wird Sortierschlüssel** vor dem Alter (Abschnitt 4).
5. **Kein Maß belohnt Tempo** (Abschnitt 5).

## Quellen

- [Iqbal & Bailey 2008, *Effects of Intelligent Notification Management on Users and Their Tasks*, CHI](https://dl.acm.org/doi/10.1145/1357054.1357070)
- [Mark, Gudith & Klocke 2008, *The Cost of Interrupted Work: More Speed and Stress*, CHI](https://dl.acm.org/doi/10.1145/1357054.1357072)
- [Leroy 2009, *Why is it so Hard to do My Work? The Challenge of Attention Residue when Switching Between Work Tasks*](https://www.uwb.edu/business/faculty/sophie-leroy/attention-residue)
- [*Opportune moments for task interruptions*, Frontiers in Psychology 2024](https://doi.org/10.3389/fpsyg.2024.1465323)
- [*Intelligent Notification Systems: A Survey of the State of the Art and Research Challenges*, arXiv 1711.10171](https://arxiv.org/pdf/1711.10171)
- Schwesternotizen im Projekt: `2026-08-05-feld-komposition-ueberarbeitung.md` (Abschnitte 3, 4, 10), `2026-08-05-feld-feedback-didaktik.md` (Mengenfrage, HOC vor LOC)
