# Die Geste im Text

Stand: 8. August 2026. Was hier steht, ist am Code geprüft, nicht an einer Spezifikation.
Die Zahlen sind frisch gemessen; wie, steht jeweils dabei.

## Das Problem

> „Es ist ganz klar, wo welche Textstelle gemeint ist, und dass man das nicht erst suchen
> muss. Weil aktuell ist es ja einfach nur so ne Bubble, die nebendran erscheint, aber ich
> erkenn dann gar nicht direkt, um was es geht. Ich muss dann lesen, ich muss erst mal das
> richtig zuordnen zum Text."
> — Jakob, 8. August 2026

Vorher stand neben dem Absatz ein Punkt am Rand und daneben eine Karte. Wo genau im Absatz
die Anmerkung hinzeigte, stand nur in Worten. Man las die Karte, suchte die Stelle, fand
sie meistens — und hatte dafür jedes Mal den Faden gelassen.

## Die Antwort: die Markierung trägt die Bedeutung

Nicht die Karte sagt, worum es geht, sondern die Form der Markierung im Text. Ihre Gestalt
sagt den **Umfang**, bevor ein Wort gelesen ist:

| Geste | Wie sie aussieht | Was sie bedeutet |
|---|---|---|
| **Wort** | eine geschlossene Kontur um die Wendung, daneben kursiv die andere Fassung | genau diese Wendung ist gemeint |
| **Satz** | ein Strich darunter, der sich beim Erscheinen von links nach rechts zieht | dieser Satz ist gemeint |
| **Absatz** | eine Klammer am linken Rand, über die volle Höhe | der ganze Absatz ist gemeint |
| **Ortswechsel** | eine ruhige Fläche um den Absatz **und** eine Marke „hierher" an der Zielstelle | dieser Absatz gehört woandershin — und zwar dorthin |
| **keine** | nur der Punkt am Rand | es gibt keine einzelne Stelle |

Die letzte Zeile ist kein Rest, sondern eine Entscheidung. Wenn eine Anmerkung dem ganzen
Text gilt, dem Titel oder einer Notiz, dann gibt es keine Strecke im Fließtext, die man
markieren könnte. Eine zu erfinden wäre eine Behauptung über den Text.

### Woher die Geste kommt

Nicht aus einer eigenen Liste. Jede der 29 Anmerkungsarten trägt seit jeher eine
**Reichweite** — Wort, Satz, Absatz, Abschnitt, Text, Titel, Notiz, Notizen. Aus ihr folgt
die Geste. Das steht an genau einer Stelle: `markierungsGestalt` in
`app/src/annotation-contract.mjs`.

Frisch gemessen (`node -e` gegen den Vertrag, 8.8.2026): 29 Arten, davon 4 mit der
Wort-Geste, 10 mit der Satz-Geste, 5 mit der Absatz-Klammer, 1 mit dem Ortswechsel, 9 ohne
Geste.

Der Ortswechsel ist die einzige Ausnahme von der Regel „Reichweite entscheidet". Er hat
dieselbe Reichweite wie ein Absatz-Hinweis, darf aber nicht dieselbe Geste bekommen: eine
Klammer kann kein Ziel zeigen, und er ist die einzige Art mit zwei Enden. Zwei weitere
Arten verschieben ebenfalls — `buendeln` und `ordnen` —, meinen aber Notizen. Die stehen
nicht im Fließtext und bekommen deshalb keine Fläche.

### Keine Farbe

> „sieht gut aus aber keine farben bitte" — Jakob, 8. August 2026

Die fünf Gesten unterscheiden sich allein durch ihre Form. Das ist kein Verzicht, sondern
eine Probe: Trägt die Form von sich aus, braucht es Farbe nie — und Farbe bleibt für
später frei, für etwas, das sie wirklich braucht.

Diese Regel gilt seit dem 8.8.2026 für die **ganze App**, nicht nur für die Anmerkungen —
siehe `docs/DIE-AESTHETIK.md`. Die letzte Ausnahme im Anmerkungssystem (die vierte
Marken-Art unterschied sich am Farbton statt an der Auszeichnungsart) ist damit auch
gefallen: sie trägt jetzt eine gepunktete Linie.

## Fail-closed: lieber keine Markierung als eine falsche

Überall dieselbe Regel. Findet sich der markierte Wortlaut nicht mehr im Text — weil seit
dem Lauf geschrieben wurde —, entsteht **keine** Markierung. Der Punkt am Rand sagt
weiterhin, dass hier etwas offen ist, und die Anmerkung nennt den Wortlaut. Ein Strich
unter den falschen Wörtern wäre schlimmer als keiner.

Dasselbe beim Ortswechsel: Lässt sich die Zielstelle nicht auflösen, wird der Hinweis
verworfen, nicht halb gezeigt. Ein „das gehört woanders hin" ohne Wohin ist eine
Aufforderung, die niemand befolgen kann.

## Der Ortswechsel hatte lange nur ein Ende

Bis zum 8. August 2026 wurde die Kennung des Zielbausteins ausschließlich von den
Beispieldaten gesetzt. Aus einem echten Lauf kam sie nie — das Antwortschema hatte kein
Feld dafür. Das war nicht nur eine fehlende Marke: Wer im echten Projekt auf „Verschieben"
drückte, löste gar nichts aus.

Jetzt nennt das Modell die Zielstelle als wörtliches Zitat, und daraus entsteht die Kennung
im Programm. Die Aufschrift der Marke wird aus dem Dokument gebildet, nicht noch einmal vom
Modell erfragt: der Ort steht schon im Text.

## Die Anmerkung selbst ist keine Platte mehr

Sie war eine schwebende Karte — Kante, Grund, Schatten. Das war eine Aussage: „hier ist ein
Fenster über deinem Text." Sie stimmte nicht. Die Anmerkung liegt nicht über dem Text, sie
steht daneben, wie eine Randbemerkung mit einem anderen Stift. Was sie unterscheidet, sind
ihre Spalte, ihre kleinere Schrift und ihre ruhigere Farbe.

Drei Formen liegen wirklich über dem Text und behalten deshalb ihre Fläche: die Korrektur,
die Einfügung und der Zielplatz. Sie erscheinen am Wort, nicht in der Nebenspalte — ohne
eigene Fläche läsen sich dort zwei Schriften übereinander.

### Im schmalen Fenster bleibt eine Zeile

> „Wenn ich jetzt 'n kleineres Bild hab […] so'n Drittel oder zwei Drittel des Bildschirms
> […] dass da irgendwie dann nichts umspringt oder verdeckt ist oder Overlay oder so."

Neben dem Text hat die Anmerkung ihre eigene Spalte. Unter dem Text — bei etwa zwei
Dritteln Fensterbreite und darunter — hat sie keine: dort schob sie den nächsten Absatz
nach unten und stand mitten im Lesefluss. Gemessen am 8.8.2026 bei 1000 px Fensterbreite:
312 px hoch, über die volle Textbreite.

Dort bleibt jetzt eine Zeile stehen: was es ist, und ein Winkel, der sagt, dass mehr
dahinterliegt. Gemessen nach der Änderung: 52 px. Zugeklappt heißt nicht weg — die
Markierung im Absatz bleibt unverändert, und die Zeile öffnet sich mit Maus wie mit
Tastatur.

## Wie das geprüft wird

Zwei Ebenen, weil beide etwas anderes können.

**Rein und ohne Browser** — die Zuordnung selbst:
`app/test/anmerkung-geste.test.mjs`, `app/test/ortswechsel-ziel.test.mjs`.

**Im Browser** — dass es auch wirklich auf dem Schirm landet, an der richtigen Stelle und
bei jeder Fensterbreite: `assertGesteZeigtAufDieStelle`, `assertOrtswechselZeigtSeinZiel`,
`assertAnmerkungOhnePlatte`, `assertAlternativeStehtImSatz` in
`app/test/onda-ui-smoke.mjs`.

Jede dieser Prüfungen wurde einmal absichtlich rot gesehen: der Code wurde kaputtgemacht,
und die Prüfung musste es merken. Eine Prüfung, die man nie hat scheitern sehen, prüft
vielleicht gar nichts. Genau so kam heraus, dass eine Bedingung im Programm doppelt stand —
die eine Hälfte konnte kaputtgehen, ohne dass es auffiel.

Der ganze Bestand: `cd app && npm test` (die Zahl zeigt der Lauf selbst; am 8.8.2026 waren
es 1134 Prüfungen, alle grün).

## Was noch offen ist

- **Zwei Markierungssysteme nebeneinander.** Die vier `aura-mark`-Arten aus einem früheren
  Stand und die fünf Gesten aus diesem. Beide sind seit dem 8.8.2026 farblos und durch die
  Form getrennt — aber es sind immer noch zwei. Sie zusammenzuführen ist ein eigener
  Schritt.
- **`buendeln` und `ordnen`** scheitern beim Ausführen aus demselben Grund, aus dem der
  Ortswechsel es lange tat: kein Ziel. Sie gehören dem Notizen-Kanal, der hier nicht
  angefasst wurde.
- **Die Korrektur sagt die andere Fassung jetzt zweimal** — einmal im Satz und einmal in
  ihrer eigenen Zeile daneben. Ob das Wiederholung ist oder Bestärkung, ist eine Frage für
  Jakob, nicht für einen stillen Umbau der Korrekturform.
