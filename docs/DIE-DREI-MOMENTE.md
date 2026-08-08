# Die drei Momente

Antwort auf das Ticket *Die drei Momente am echten Text*
(`docs/rueckmeldung/karten/03-die-drei-momente-am-echten-text.md`).

Die Frage war: Welche der elf Rückmeldungsarten gehört in welchen Moment? Sie ist
inzwischen im Programmcode beantwortet. Dieses Dokument schreibt die Antwort auf und
belegt sie an dem, was tatsächlich gebaut ist.

**Geprüfter Stand:** Commit `a21248e` auf dem Zweig `etappe-a-ki-anschluss`, 4. August 2026.
**Wo die Antwort im Code steht:** `app/src/momente-model.mjs` — die Tabelle, die
Begründungen und die Auslösebedingungen liegen dort an einer einzigen Stelle, damit sie
nicht in der Dokumentation und im Programm getrennt voneinander altern können.
**Nachgewiesen durch:** 56 automatische Prüfungen in `app/test/momente-model.test.mjs`
und `app/test/erweiterungslauf-model.test.mjs`, alle bestanden.

---

## Die Regel dahinter

Eine Rückmeldung erscheint in dem Moment, in dem man sie beantworten kann, ohne den
Gedanken zu verlieren.

Das ist der einzige Satz, aus dem die ganze Tabelle folgt. Er steht so auch im Code
(`app/src/momente-model.mjs`, Zeilen 12–13).

Zwei Dinge, die vorher verwechselt wurden, sind jetzt getrennt:

- **Wann der Agent läuft.** Ein Lauf kostet Geld und wird deshalb selten ausgelöst.
- **Wann sein Ergebnis erscheinen darf.** Das ist keine Kostenfrage, sondern eine Frage
  des Schreibens.

Die Momente regeln das Zweite. Sie halten ein fertiges Ergebnis zurück, bis es passt.
Zurückgehalten heißt nur zurückgehalten — der Hinweis bleibt bestehen und erscheint,
sobald sein Moment da ist (`app/src/workspace.js`, Zeilen 1934–1937). Und er bleibt
auffindbar, auch bevor sein Moment da ist; siehe „Zurückgehaltenes drängt nicht, aber es
versteckt sich auch nicht" weiter unten.

---

## Die drei Momente und ihre Auslöser

| Moment | Was ihn auslöst | Die Zahl im Code |
|---|---|---|
| **sofort** | Immer. Sobald etwas da ist, ist es zu sehen. | — |
| **beim Innehalten** | Ein Satz- oder Absatzende und danach 0,3 Sekunden Ruhe — oder 3 Sekunden Ruhe an beliebiger Stelle. | `INNEHALTEN_AN_GRENZE_MS = 300`, `INNEHALTEN_MS = 3000` |
| **beim Aufschauen** | 45 Sekunden Ruhe — oder die Schreibansicht verlassen. | `AUFSCHAUEN_MS = 45000` |

Der dritte Fall hieß bis zum 7. August 2026 „von Hand angefordert" und meinte eine Zeile
in der Seitenleiste: „N Hinweise warten aufs Aufschauen — jetzt zeigen." Die Zeile zählte
Anmerkungen und ist mit `docs/PHILOSOPHIE.md` §1 gefallen. Einen Knopf dafür gibt es
nicht und soll es nicht geben.

**Geändert am 8. August 2026: Eine Entscheidung schließt einen Durchgang, sie öffnet
keinen.** Bis dahin löste das Entscheiden über einen Hinweis selbst den Moment
*Aufschauen* aus, begründet mit: wer entscheidet, schreibt gerade nicht, also darf der
nächste sofort folgen. Der erste Halbsatz stimmt. Der Schluss daraus war falsch — die
Grenze, die eine Entscheidung schafft, ist das **Ende dieser Rückmeldung**, nicht der
Beginn eines Rechts auf die nächste.

In der Praxis erzeugte jedes Wegklicken sofort die nächste Anmerkung, und die Kette lief
so lange, wie es offene Hinweise gab. Jakob am 8.8.2026: „wenn ich eins wegklick, dann
kommt direkt das Nächste. Das soll nicht so sein. […] auch wenn die AI mehrere Sachen
hat, sollen die eben nach und nach erst kommen."

Jetzt zählt die Ruhe ab der **letzten Regung**, und Entscheiden ist eine — genau wie
Tippen. Wer gerade entschieden hat, fängt die Wartezeit von vorn an. Das ist keine
künstliche Sperre, sondern dieselbe Regel für beide Arten von Tätigkeit. Eine Satz- oder
Absatzgrenze, die *vor* der Entscheidung lag, ist dabei verbraucht; sonst genügten 0,3
Sekunden nach dem Wegklicken und die Kette wäre nur kürzer geworden statt unterbrochen.

Die Forschung dahinter steht in `docs/research/2026-08-08-rhythmus-der-anmerkungen.md`:
Unterbrechung an einer Aufgabengrenze kostet messbar weniger Wiederaufnahme-Zeit und
weniger Ärger als dieselbe sofort ([Iqbal & Bailey, CHI
2008](https://dl.acm.org/doi/10.1145/1357054.1357070)).

Alle drei Zahlen stehen in `app/src/momente-model.mjs`. Die Entscheidung selbst trifft
die Funktion `aktuellerMoment` — sie nimmt dafür seit dem 8.8.2026 einen zusätzlichen
Wert `letzteEntscheidungAt` entgegen.

**Warum der Ort mitzählt und nicht nur die Zeit.** Eine Pause mitten im Satz ist
Nachdenken. Eine Pause nach dem Punkt ist ein Innehalten. Deshalb genügt an einer
Grenze eine viel kürzere Ruhe: 0,3 statt 3 Sekunden. Ohne diese Unterscheidung erwischt
eine reine Zeitregel zu oft jemanden mitten im Satz.

**Was als Grenze zählt.** Beides: das Absatzende und das Satzende. Beide sind der
Augenblick, in dem ein Gedanke fertig ist (`app/src/workspace.js`, Zeilen 1880–1886).

- Das **Absatzende** ist die Enter-Taste, im Programm `insertParagraph`
  (`app/src/workspace.js`, Zeilen 1830–1849).
- Das **Satzende** ist ein getipptes Satzzeichen: Punkt, Ausrufezeichen, Fragezeichen
  oder Auslassungspunkte. Die Prüfung dafür ist `istSatzende`
  (`app/src/momente-model.mjs`, Zeilen 76–80), aufgerufen aus `handleBeforeInput`
  (`app/src/workspace.js`, Zeilen 1844–1859).

**Eine Grenze ist ein Ereignis, kein Zustand.** Geprüft wird das Zeichen, das gerade
getippt wurde — nicht, ob der Text zufällig auf einen Punkt endet. Der Unterschied ist
nicht theoretisch: Bei der Zustandsprüfung zählt jeder weitere Tastendruck hinter dem
Punkt erneut als Satzende, auch drei Leerzeichen. Ein früherer Prototyp meldete dadurch
122 Treffer statt drei. Der Kommentar im Code hält das fest
(`app/src/momente-model.mjs`, Zeilen 72–75), eine Prüfung sichert es ab
(`app/test/momente-model.test.mjs`, Zeile 176).

**Das Satzende zählt nur fürs Hinschauen, nie für die Rechnung.** Es setzt
ausschließlich `pendingSatzende` und damit den Moment — nicht `pendingBoundary`, an dem
der bezahlte Hinweislauf hängt. Sonst liefe nach jedem Punkt 300 Millisekunden später
ein Lauf an, und aus einer Frage des Hinschauens wäre eine Frage der Rechnung geworden
(`app/src/workspace.js`, Zeilen 1804–1807). Das Absatzende zählt weiterhin für beides.

**Ruhe muss trotzdem sein.** An einer Grenze ohne jede Pause ist es noch kein
Innehalten — das wäre sonst jeder Tastendruck (`app/test/momente-model.test.mjs`,
Zeile 113).

**Jeder Moment lässt sich auch von Hand ziehen.** Wer ausdrücklich fragt, schaut per
Definition auf, egal wie lange die letzte Taste her ist (`aktuellerMoment`, Zeile 97).
In der Oberfläche sind das zwei Griffe: die Zeile „jetzt zeigen" für zurückgehaltene
Hinweise (siehe unten) und der Knopf „Was fällt dir noch ein?" für Erweiterungen
(`app/src/workspace.js`, Zeile 799).

---

## Die vollständige Tabelle: elf Arten, elf Zeilen

Acht Hinweisarten stammen aus `app/src/agent-prompts.mjs`, die drei Erweiterungsarten aus
`app/src/erweiterung-model.mjs`. Die Zuordnung steht in `ART_MOMENT`, die Begründungen in
`MOMENT_BEGRUENDUNG` (`app/src/momente-model.mjs`, Zeilen 31–57).

| Art | Moment | Begründung |
|---|---|---|
| **sprache** | sofort | Eine Formulierung ist dort am billigsten zu ändern, wo sie steht. Das Aufschauen kostet mehr als die Korrektur selbst. |
| **fakt** | beim Innehalten | Eine Tatsachenbehauptung prüft man, solange man noch weiß, woher sie kam — aber nicht mitten im Satz. |
| **quelle** | beim Innehalten | Der fehlende Beleg gehört zu dem Gedanken, den du gerade zu Ende gebracht hast. |
| **logik** | beim Innehalten | Ein Bruch im Gedankengang zeigt sich erst, wenn der Gedanke fertig ist. Vorher ist er ein halber Satz. |
| **methode** | beim Innehalten | Was die Daten tragen, entscheidet sich am fertigen Schluss, nicht am halben. |
| **struktur** | beim Aufschauen | Aufbau sieht man nur mit Abstand. Mitten im Absatz ist die Frage gar nicht beantwortbar. |
| **wirkung** | beim Aufschauen | Die Wirkung auf ein Publikum hat der ganze Text, nicht der einzelne Satz. |
| **erklaerung** | beim Aufschauen | Ob ein Begriff eingeführt ist, hängt am ganzen bisherigen Text. |
| **weiterfuehrung** | beim Aufschauen | Ein Angebot mitten im Satz ist eine Unterbrechung, kein Angebot. |
| **feld** | beim Aufschauen | Ein Nachbargebiet betritt man zwischen zwei Arbeitsgängen, nicht innerhalb eines Satzes. |
| **verbindung** | beim Aufschauen | Zwei Stellen sieht man nur, wenn man beide im Blick hat — also nicht beim Schreiben der einen. |

Eine automatische Prüfung sorgt dafür, dass die Tabelle vollständig bleibt: Käme eine
zwölfte Art dazu, ohne dass jemand ihren Moment bestimmt, schlägt der Test fehl
(`app/test/momente-model.test.mjs`, Zeilen 26–43). Eine unbekannte Art fällt außerdem
immer auf den zurückhaltendsten Moment — „beim Aufschauen" — und drängt sich nicht
versehentlich vor.

---

## Gibt es Arten, die in mehr als einem Moment sinnvoll sind?

Ja, alle. Die Momente sind aufsteigend, nicht ausschließend.

Was in der Tabelle steht, ist der **früheste** Moment, in dem eine Art erscheinen darf,
nicht der einzige. Wer aufschaut, hat auch innegehalten. Eine Formulierungskritik
verschwindet also nicht wieder, sobald man die Hand von der Tastatur nimmt — das wäre
absurd.

Im Code ist das eine Rangordnung: `sofort` = 0, `innehalten` = 1, `aufschauen` = 2, und
`darfErscheinen` prüft `gebraucht <= erreicht` (`app/src/momente-model.mjs`,
Zeilen 26 und 109–113).

Praktisch heißt das:

| Erreichter Moment | Was sichtbar sein darf |
|---|---|
| sofort | nur `sprache` — 1 von 11 |
| beim Innehalten | zusätzlich `fakt`, `quelle`, `logik`, `methode` — 5 von 11 |
| beim Aufschauen | alle elf |

---

## Was sich umgedreht hat

Das Ticket fragte, ob sich bestätigt, dass die Zuordnung vorher falsch herum war. Sie
war es. Beide Hälften sind am Code belegbar.

### Vorher: das Billige war versteckt

Rechtschreibung liegt hinter einem Fenster, das man selbst öffnen muss. Der Weg dorthin
ist zwei Klicks lang:

1. In der Seitenspalte die Karte „Projektverständnis" anklicken — sie öffnet ein Fenster
   (`app/index.html`, Zeile 48).
2. Darin den Knopf „Sprache und Wirkung prüfen" (`app/src/workspace.js`, Zeile 1391).
3. Erst dort öffnet sich das Dossier mit dem Abschnitt „Eindeutige Normfälle"
   (`app/src/language-ui.mjs`, Zeilen 494 und 764–771).

Dass dieses Fenster der einzige Zugang ist, lässt sich hart nachweisen: Das Modul
`app/src/orthography.mjs`, das die Rechtschreibprüfung enthält, wird im gesamten
Programm von genau einer Datei benutzt — von `language-ui.mjs`, also vom Fenster selbst.
Es gibt keinen zweiten Weg, auf dem eine Rechtschreibfrage von allein zum Schreibenden
käme.

### Vorher: das Teure drängte sich auf

Struktur- und Logikkritik sprang alle drei Sekunden an. Die Zahl steht in
`app/src/workspace.js`, Zeile 145:

```
const AGENT_IDLE_MS = 3000
```

Sie wird an `planeHinweislauf` weitergereicht (Zeile 3527) und startet dort nach drei
Sekunden Pause einen Hinweislauf — ohne Ansehen der Art. Ob der zurückkommende Hinweis
eine Wortwahl oder den ganzen Aufbau betraf, spielte für den Zeitpunkt keine Rolle.

### Jetzt

Der Rhythmus folgt der Art, nicht dem Kanal. Vor jeder Anzeige eines Hinweises läuft der
Filter `darfErscheinen`:

- `app/src/workspace.js`, Zeile 1938 — für den Hinweis, der gerade an einer Textstelle
  gezeigt würde
- `app/src/workspace.js`, Zeile 1953 — für Hinweise, deren Stelle sich nicht eindeutig
  zuordnen ließ

Ein Strukturhinweis, der um 14:03:01 fertig wird, wartet also, bis 45 Sekunden Ruhe
erreicht sind oder die Schreibansicht verlassen wird. Ein Sprachhinweis wartet nicht.

Damit ein zurückgehaltener Hinweis nicht liegen bleibt, bis zufällig etwas anderes neu
zeichnet, plant `planeMomentwechsel` die nächste Neuzeichnung genau auf die nächste
Schwelle (`app/src/workspace.js`, Zeilen 1902–1927).

Für die drei Erweiterungsarten greift die Regel eine Stufe früher: Dort wird nicht das
Ergebnis zurückgehalten, sondern der Lauf findet erst gar nicht statt. `planeErweiterungslauf`
rechnet direkt mit `AUFSCHAUEN_MS` (`app/src/workspace.js`, Zeile 3436). Eine Erweiterung
kann also gar nicht mitten im Satz entstehen.

### Was sich *nicht* umgedreht hat — der ehrliche Teil

Zwei Einschränkungen, die man kennen muss, damit die Umkehrung nicht größer klingt, als
sie ist:

1. **Das Rechtschreibfenster ist immer noch ein Fenster.** Umgedreht wurde die Reihenfolge
   der elf *Hinweisarten*. Die Art `sprache` hat jetzt den Vortritt. Das Sprachdossier mit
   den Normfällen liegt weiterhin hinter zwei Klicks und meldet sich weiterhin nicht von
   allein.
2. **„Sofort" heißt nicht „vor dem Lauf".** Ein Sprachhinweis kann frühestens erscheinen,
   wenn ein Hinweislauf ihn geliefert hat — und der startet weiterhin nach drei Sekunden
   Pause (`AGENT_IDLE_MS`). „Sofort" heißt: er wird danach nicht noch einmal
   zurückgehalten. Es heißt nicht, dass er beim Tippen mitläuft.

---

## Zurückgehaltenes drängt nicht, aber es versteckt sich auch nicht

Ein Zurückhalten ohne Griff wäre keine Rücksicht, sondern eine Unterschlagung. Wer nie
45 Sekunden am Stück pausiert, bekäme eine Strukturfrage sonst nie zu sehen.

Deshalb steht in der Seitenspalte eine ruhige Zeile, sobald etwas wartet: eine Zahl und
daneben „Hinweise warten aufs Aufschauen — jetzt zeigen". Ein Klick genügt
(`renderZurueckgehalten`, `app/src/workspace.js`, Zeilen 739–773; der Platz dafür in
`app/index.html`, Zeilen 59–61).

Drei Eigenschaften, die diese Zeile zu einem Angebot machen und nicht zu einer Mahnung:

- **Sie ist nur da, wenn etwas wartet.** Wartet nichts, verschwindet sie ganz
  (Zeile 753).
- **Der Klick gilt nur bis zum nächsten Tastendruck.** Er setzt `momentVonHand = true`
  (Zeile 768); `recordRealEditorInput` setzt es beim ersten Zeichen zurück
  (Zeile 1796). Wer wieder schreibt, schaut nicht mehr auf. Man muss also nichts
  zurückstellen.
- **Sie zählt nur, was wirklich zurückgehalten wird** — offene Hinweise an einer
  Textstelle, deren Moment noch nicht erreicht ist (Zeilen 747–751).

Im laufenden Programm geprüft: Nach einem Tastendruck war die Strukturfrage unsichtbar
und die Zeile sagte „1 Hinweis wartet aufs Aufschauen — jetzt zeigen". Nach dem Klick
war die Karte da und die Zeile weg.

Die Zahl in dieser Zeile ist übrigens der einzige Zähler in diesem ganzen Gebiet — und
sie steht bei Hinweisen, die ohnehin gezählt werden. Erweiterungen bekommen keine, und
zwar mit Absicht (siehe `docs/DIE-GESTALT-EINER-ERWEITERUNG.md`).

---

## Was daran noch Jakobs Urteil braucht

Die Tabelle ist eine begründete Setzung, kein Messergebnis. Gemessen wurde nichts an
einem echten Schreibvorgang. Jede Zeile ist ein Argument, das plausibel klingt — und
Plausibilität ist beim Schreiben nicht dasselbe wie richtig.

Auch die drei Zahlen sind Setzungen:

- **3 Sekunden** ist der alte Wert aus `AGENT_IDLE_MS`, übernommen, nicht neu bestimmt.
- **0,3 Sekunden** ist der Wert aus `AGENT_BOUNDARY_IDLE_MS`, der im Code schon existierte
  — allerdings für etwas anderes, nämlich den Zuruf im Agentenfenster
  (`app/src/workspace.js`, Zeile 146). Er wurde entliehen.
- **45 Sekunden** ist frei gewählt. Für diese Zahl gibt es keinerlei Beleg.

### Die vier strittigsten Zeilen

**1. `sprache` = sofort.** Das ist die kühnste Zeile. Die Begründung sagt: Eine
Formulierung ist dort am billigsten zu ändern, wo sie steht. Der Gegeneinwand: Genau eine
Formulierungskritik mitten im Satz ist das, was den Satz zerstört, weil sie das Ohr
umlenkt, während man noch am Rhythmus baut.

*Woran man es beim Schreiben merken würde:* Ein Sprachhinweis erscheint, und man verliert
den Rest des Satzes, den man schon im Kopf hatte. Oder man fängt an, jeden Satz zweimal
zu schreiben — einmal für sich, einmal für den Hinweis. Dann gehört `sprache` auf
„beim Innehalten".

**2. `weiterfuehrung` = beim Aufschauen.** Die Begründung sagt: Ein Angebot mitten im
Satz ist eine Unterbrechung. Der Gegeneinwand: Eine Weiterführung ist womöglich genau
dann am meisten wert, wenn man am Ende eines Absatzes hängt und nicht weiterweiß — also
beim Innehalten, nicht 45 Sekunden später.

*Woran man es merken würde:* Beim Aufschauen ist der Gedanke bereits kalt. Man liest die
Weiterführung, findet sie gut, und stellt fest, dass man den Absatz schon anders beendet
hat. Dann gehört `weiterfuehrung` auf „beim Innehalten".

**3. `erklaerung` = beim Aufschauen.** Die Begründung sagt: Ob ein Begriff eingeführt ist,
hängt am ganzen bisherigen Text. Das stimmt für die *Feststellung*. Die *Reparatur* ist
aber meistens ein einzelner Nebensatz an genau der Stelle, an der der Begriff zum ersten
Mal fällt.

*Woran man es merken würde:* Beim Aufschauen fühlt sich das wie Nacharbeit an — man muss
zurückspringen, sich wieder in die Stelle hineindenken und dort etwas einschieben. Dann
gehört `erklaerung` auf „beim Innehalten".

**4. `fakt` und `quelle` = beim Innehalten.** Diese beiden lösen in der Praxis oft eine
Recherche aus, und eine Recherche ist kein Innehalten, sondern ein Weggang. Sie in eine
Pause zwischen zwei Absätzen zu legen, kann heißen: Man hält an, klickt, und ist zehn
Minuten weg.

*Woran man es merken würde:* Man kommt nach einem Faktenhinweis regelmäßig nicht mehr in
den Text zurück. Dann gehören `fakt` und `quelle` auf „beim Aufschauen" — dorthin, wo man
ohnehin schon aus dem Schreiben heraus ist.

### Zwei Zeilen, die vermutlich unstrittig sind

`struktur` und `verbindung`. Beide setzen voraus, dass man mehr als eine Stelle im Blick
hat. Mitten im Satz ist die Frage nicht nur unpassend, sondern gar nicht beantwortbar.

### Wie fein die Grenze sein darf

Entschieden ist, dass beides zählt: Satzende und Absatzende. Offen ist, ob das Satzende
zu fein ist.

Es feuert jetzt bei jedem Punkt. In einem Text mit kurzen Sätzen heißt das: alle paar
Sekunden ist der Moment „beim Innehalten" erreicht, und damit dürfen Fakt-, Quellen-,
Logik- und Methodenhinweise erscheinen. Das kann genau richtig sein — oder es macht aus
dem Innehalten wieder das, was der ganze Umbau abschaffen sollte.

*Woran man es beim Schreiben merken würde:* Wenn nach jedem zweiten Satz etwas
auftaucht, ist die Satzgrenze zu fein — dann wäre die Antwort, entweder nur das
Absatzende zählen zu lassen oder die 0,3 Sekunden heraufzusetzen. Wenn ein Innehalten
sich dagegen regelmäßig zu spät anfühlt, weil man lange Absätze schreibt, ist es richtig
so.

Ein zweiter, kleinerer Punkt: Die Auslassungspunkte „…" zählen als Satzende
(`SATZZEICHEN`, `app/src/momente-model.mjs`, Zeile 76). Das ist eine Setzung. Wer sie
mitten im Satz als Denkpause benutzt, bekommt dort ein Innehalten, das keines ist.
