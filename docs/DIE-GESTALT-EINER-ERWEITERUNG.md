# Die Gestalt einer Erweiterung

Antwort auf das Ticket *Die Gestalt einer Erweiterung*
(`.scratch/rueckmeldung/issues/08-die-gestalt-einer-erweiterung.md`).

Die Frage war: Wie sieht eine Erweiterung aus — und wie unterscheidet sie sich sichtbar
von einer Korrektur? Dazu: Trägt die Formenlehre des Design Systems, oder trägt sie
nicht? Beides ist inzwischen im Programmcode entschieden. Dieses Dokument schreibt die
Entscheidung auf und belegt sie am Gebauten.

**Geprüfter Stand:** Commit `a21248e` auf dem Zweig `etappe-a-ki-anschluss`, 4. August 2026.
**Wo es im Code steht:** `app/src/erweiterung-model.mjs` (die drei Arten, die Zahl der
Stellen, die zwei Gesten), `app/src/erweiterungslauf-model.mjs` (Verankerung),
`app/src/workspace.js` Zeilen 637–806 (die Karte), `app/src/style.css` Zeilen 1431–1548
(das Aussehen), `app/index.html` Zeilen 63–67 (der Ort).

---

## Was eine Erweiterung ist

Eine Erweiterung ist ein Angebot, kein offener Posten. Der Text ist nicht kaputt. Es gibt
nur mehr zu holen, als bisher drinsteht.

Drei Arten, und die Zahl der Stellen im Text gehört zur Art
(`app/src/erweiterung-model.mjs`, Zeilen 17–37):

| Art | Stellen im Text | Was sie sagt |
|---|---|---|
| **Weiterführung** | 1 | Der Gedanke trägt weiter, als du ihn geführt hast. |
| **Feld** | 0 | Ein Nachbargebiet, das der Text noch nicht betreten hat. |
| **Verbindung** | 2 | Zwei Stellen gehören zusammen. |

Die Zahl wird geprüft, nie geraten. Liefert das Modell zu einer Verbindung nur einen
Anker, oder findet sich ein Anker im Text nicht wieder, wird die ganze Erweiterung
verworfen (`app/src/erweiterungslauf-model.mjs`, Zeilen 74–87). Zwei gleiche Anker bei
einer Verbindung sind ebenfalls keine Verbindung, sondern ein Fehler des Modells. Lieber
ein Angebot weniger als ein erfundener Anker, damit die Form gleichmäßig aussieht.
Beim Laden eines Dokuments prüft `ensureErweiterungen` dasselbe noch einmal und lässt
Einträge mit falscher Stellenzahl still herausfallen — sie wären nicht darstellbar
(`app/src/erweiterung-model.mjs`, Zeile 64).

---

## Wie die Karte aussieht

Eine Erweiterung ist eine Karte in der Seitenspalte, gebaut in `erweiterungKarte`
(`app/src/workspace.js`, Zeilen 664–734).

**Zugeklappt** — der Normalzustand — zeigt sie zwei Zeilen:

- die Art: „Weiterführung", „Feld" oder „Verbindung"
- einen Anriss: der erste Satz des Gedankens, höchstens 96 Zeichen, sonst mit
  Auslassungszeichen (`erweiterungAnriss`, Zeile 644)

**Aufgeklappt** kommt dazu:

1. eine Zeile, was diese Art überhaupt ist (die Sätze aus der Tabelle oben)
2. der Gedanke im vollen Wortlaut
3. das **Muster**, in einem leicht abgesetzten Kasten. Das ist der eigentliche Ertrag:
   der Einzelfall hilft einmal, das Prinzip beim nächsten Text von allein.
4. die Stellen — keine, eine oder zwei Knöpfe. Bei einer Verbindung heißen sie
   „Erste Stelle" und „Zweite Stelle", sonst „Zur Stelle" (Zeilen 649–662). Jeder Knopf
   zeigt das Zitat kursiv und springt beim Klick an die Stelle im Text.
5. zwei Gesten: **Merken** und **Weglegen**

Bei einem `Feld` fehlt Punkt 4 ganz. Es gibt keinen leeren Platzhalter, keinen Hinweis
„keine Stelle" — der Block wird schlicht nicht gebaut (Zeile 704).

### Zwei Gesten, mehr nicht

Kein „nur diesmal / nicht mehr in diesem Text / nie" wie beim Verwerfen eines Hinweises.
Diese Leiter gibt es, weil ein Hinweis eine Forderung war, die man abwehren können muss.
Ein Angebot muss man nicht abwehren; man legt es weg. Weggelegtes wird nicht erneut
vorgeschlagen, das genügt (`app/src/erweiterung-model.mjs`, Zeilen 11–15).

Beide Gesten haben eine sichtbare Folge, sonst wären sie keine Gesten:

- **Merken** hebt den Eintrag an den Kopf der Liste. Neues sammelt sich darunter und
  lässt sich weglegen, ohne dass das Behaltene mitwandert. Im Code ist das eine kleine
  Rangordnung — `RANG = { gemerkt: 0, neu: 1 }` — vor der Sortierung nach Entstehungszeit
  (`sichtbareErweiterungen`, `app/src/erweiterung-model.mjs`, Zeilen 86–100). Ohne diese
  Folge wäre der Knopf eine Farbänderung und sonst nichts.
- **Weglegen** nimmt den Eintrag aus der Ansicht. Gespeichert bleibt er trotzdem.

Gemerktes und Weggelegtes wandern beide in die Liste dessen, was dem Agenten beim
nächsten Lauf mitgegeben wird — damit dasselbe Angebot nicht zweimal kommt
(`fasseErweiterungenZusammen`, Zeilen 128–136).

---

## Der sichtbare Unterschied zu einer Korrektur

Der Abschnitt „Erweiterungen: der zweite Kanal" in `app/src/style.css` (Zeilen 1431–1548)
nennt drei Unterschiede und setzt sie um. Dazu kommen zwei weitere, die im Wortlaut der
Knöpfe liegen.

### 1. Keine Warn- oder Gefahrfarbe — nichts ist kaputt

Im gesamten Erweiterungs-Abschnitt kommt weder `--danger` noch `--warning` vor. Die Karte
benutzt `--bg-surface` als Fläche, `--border-subtle` als Rahmen und `--accent` für den
Strich links.

Eine Korrektur benutzt beide Warnfarben:

- Ein Absatz mit einem offenen Beleghinweis wird mit `--warning-tint` unterlegt
  (`app/src/style.css`, Zeilen 1737–1740).
- Der Vorschlag stellt die alte Fassung mit `--danger-tint` hinterlegt und durchgestrichen
  neben die neue (Zeilen 2041–2045).

### 2. Keine Zahl — nichts ist offen

Der Abschnitt in der Seitenspalte trägt nur die Rubrik „Erweiterungen", kein Zählerfeld
(`app/index.html`, Zeilen 65–67). Der Abschnitt „Material" direkt darunter hat eines
(Zeile 73) — der Unterschied ist also gewollt und nicht vergessen.

Und die Zeile direkt darüber hat ebenfalls eine Zahl: „N Hinweise warten aufs
Aufschauen" (`app/index.html`, Zeilen 59–61). Das ist kein Widerspruch, sondern die
Probe aufs Exempel — Hinweise sind offene Posten und werden ohnehin gezählt,
Erweiterungen nicht. Zwei Kanäle nebeneinander, und man sieht am Zähler, welcher welcher
ist.

Er reicht tiefer als die Oberfläche. Erweiterungen liegen in einem eigenen Feld,
`doc.erweiterungen`, und berühren keine der Funktionen, die Hinweise verwalten: keine
Warteschlange, keine Zählung über `pendingCount`, keine Integritätsregeln, keine
Entscheidung mit Konsequenz (`app/src/erweiterung-model.mjs`, Zeilen 3–9). `pendingCount`
speist die beiden Zähler an Agenten- und Randspur (`app/src/panels.js`, Zeilen 512 und
679) — Erweiterungen erreichen ihn gar nicht.

Nach einem erfolgreichen Lauf werden die neuen Erweiterungen still angehängt. Keine
Meldung, kein Zuruf, keine Zahl (`app/src/workspace.js`, Zeilen 3411–3413):

> Bewusst KEIN ergaenzeEchteInitiative und keine Zahl irgendwo: eine Erweiterung klopft
> nicht an. Sie liegt in der Seitenspalte, bis jemand hinschaut.

### 3. Kein Strich zum Text — nichts wartet an einer Zeile

Ein lokaler Hinweis zieht eine Verbindungslinie zur Textzeile: `.local-finding-connector`,
ein 20 Pixel langer Strich in `--border-strong`, der bei einem Hinweis unterhalb der
Zeile zu einem senkrechten 9-Pixel-Strich wird (`app/src/style.css`, Zeilen 1799–1813).

Die Erweiterungskarte hat keinen solchen Strich. Sie zeigt auf nichts.

### 4. Der Akzentstrich links

Das eine positive Kennzeichen: `border-left: 2px solid var(--accent)` (Zeile 1441). Er
steht für ein Angebot; die Karte selbst bleibt Papier.

Gemerktes bekommt einen vollen Strich — 4 statt 2 Pixel, dazu die Akzentfläche
(Zeile 1450). Ausdrücklich kein Häkchen: Ein Haken ist die Sprache erledigter Aufgaben,
und eine Erweiterung war nie eine Aufgabe. Der dickere Strich ist dabei nur das
Sichtbare an der Geste; die eigentliche Folge ist der Platz am Kopf der Liste.

### 5. Andere Verben

| Korrektur | Erweiterung |
|---|---|
| Übernehmen · Eigene Fassung schreiben · Verwerfen (`app/src/workspace.js`, Zeilen 2399–2401) | Merken · Weglegen (Zeilen 712–730) |

„Weglegen" trägt zusätzlich die Klasse `is-still`: durchsichtiger Rahmen, gedämpfte
Schrift (`app/src/style.css`, Zeile 1529). Die leise Geste sieht auch leise aus.

### Dunkler Modus

Der ganze Abschnitt arbeitet ausschließlich mit Farbnamen aus dem Design System —
`--bg-surface`, `--accent`, `--accent-tint`, `--surface-2`, `--border-subtle`. Alle
werden unter `[data-theme="dark"]` neu gesetzt (`app/src/style.css`, Zeilen 125–146).
Es gibt im Erweiterungs-Abschnitt keinen einzigen fest eingetragenen Farbwert. Der dunkle
Modus greift damit von allein.

Belegt ist das am Code, nicht am Auge — siehe unten unter „Was daran noch Jakobs Urteil
braucht".

---

## Wo sie leben, und warum nicht am Text

Sie leben in der Seitenspalte, zwischen „Struktur" und „Material"
(`app/index.html`, Zeilen 54–75).

Die Begründung steht im Code, direkt über der Karte
(`app/src/workspace.js`, Zeilen 637–641):

> Warum hier und nicht am Text: eine Erweiterung ist kein offener Posten. Sie darf nicht
> neben der Zeile stehen und darauf warten, entschieden zu werden — dann wäre sie eine
> Forderung wie jede Korrektur. Sie liegt in der Peripherie, findbar, ohne sich
> aufzudrängen, und wer sie anklickt, kommt an die Stelle, um die es geht.

Dazu ein zweiter Grund, der nicht Geschmack ist, sondern Arithmetik: Zwei der drei Arten
haben am Text keinen Platz. Ein `Feld` hat null Stellen. Eine `Verbindung` hat zwei — sie
gehört an keine von beiden allein. Nur die `Weiterführung` hätte einen eindeutigen Ort im
Text. Eine Form, die für ein Drittel der Fälle funktioniert, ist keine Form.

Der Weg zum Text geht deshalb in die andere Richtung: Man klickt die Stelle auf der Karte
an und springt hin (`focusBlock`, Zeile 660). Der Text ruft nicht, man geht hin.

Dass das eine Entscheidung war und kein Versäumnis, zeigt eine Funktion, die es gibt und
die niemand benutzt: `erweiterungenFuerBlock` liefert alle Erweiterungen zu einem
Textabsatz (`app/src/erweiterung-model.mjs`, Zeilen 102–106). Sie wird im gesamten
Programm nirgends aufgerufen. Die Randspur am Text wurde absichtlich nicht gebaut.

Die Rubrik bleibt auch sichtbar, wenn nichts da ist. Dann steht dort ein Satz, der sagt,
was hier später liegen wird und wann es kommt (`app/src/workspace.js`, Zeilen 787–792),
und darunter der Knopf „Was fällt dir noch ein?" (Zeilen 799–803) — jeder Moment muss
auch von Hand gezogen werden können.

---

## Trägt die Formenlehre des Design Systems?

Kurze Antwort: **Der Grundsatz wird übernommen. Die sieben Formen werden für
Erweiterungen nicht verwendet. Die Rangfolge wird ausdrücklich verworfen.**

Der Grundsatz lautet: *„Die Darstellungsform folgt der Natur der Anmerkung."* Genau ihm
folgend kommt man bei einer Erweiterung nicht bei einer der sieben Formen heraus, sondern
bei einer achten. Der Satz gilt also — er führt nur weg von seinem eigenen Katalog.

Fünf Belege, alle aus `design-system/components/annotation/kinds.js` und der Datei, die
diese Arten darstellt.

### 1. Jede Art bekommt einen Rang, und der oberste heißt „Fehler"

```
export const PRIORITY={muss:'Fehler',sollte:'Empfehlung',geschmack:'Geschmack'};
```

(`kinds.js`, Zeile 46.) Die Tabelle `PRIORITY_OF` darunter (Zeilen 47–55) weist jeder
einzelnen der 29 Arten genau einen dieser drei Ränge zu. Es gibt keine Art ohne Rang.

Eine Erweiterung hat keinen dieser Ränge. Sie ist kein Fehler, keine Empfehlung und auch
kein Geschmack — sie ist ein Angebot. Das Regal hat für „nichts ist verkehrt" kein Fach.

### 2. Wer trotzdem eine hineinstellt, bekommt sie still verfälscht zurück

```
export function kindInfo(kind){
  const k=KINDS[kind]||KINDS.anmerkung;
```

(`kinds.js`, Zeilen 57–58.) Eine unbekannte Art fällt auf `anmerkung` zurück. Das ergibt
Kategorie „Inhalt" und, über `PRIORITY_OF`, den Rang „Geschmack". Eine Weiterführung durch
dieses Regal geschoben käme also als „Anmerkung · Geschmack" heraus — ohne Fehlermeldung.
Das ist kein Mangel des Design Systems. Es zeigt nur, dass dort kein Platz vorgesehen war.

### 3. Alle Bezugsgrößen sind Ausschnitte des Textes

```
export const SCOPES=['Wort','Satz','Absatz','Abschnitt','Text'];
```

(`kinds.js`, Zeile 56.) Fünf Größen, alle fünf ein Stück Text. Ein `Feld` hat null Stellen
im Text. Es passt in keine davon, auch nicht in „Text" — es geht ja gerade um etwas, das
im Text noch nicht vorkommt.

### 4. Die Anmerkungskarte trägt im Kopf genau das, was die Erweiterungskarte weglässt

In `design-system/components/annotation/Annotation.jsx` stehen im Kopf jeder Karte
nebeneinander: eine Ziffer (`aura-note__n`), der Rang (`aura-note__prio`, bei „muss" in
`--danger` eingefärbt) und der Bezug (`aura-note__scope`). Die Standardbeschriftung des
Hauptknopfes ist „Übernehmen", „Verschieben" oder „Beleg einfügen", die des zweiten
„Verwerfen".

Ziffer, Warnfarbe, Textbezug und ein Verb, das voraussetzt, dass am Text etwas zu tun ist
— das sind vier von fünf Dingen, die die Erweiterungskarte bewusst nicht hat. Nähme man
die Komponente, bekäme man sie alle automatisch zurück.

### 5. Fünf der sieben Formen sitzen körperlich im Text

`Correction` sitzt am Wort. `Rewrite` ist eine Vorschlagskarte, die eine vorhandene
Fassung ersetzt — ihre beiden Knöpfe heißen im Standard „Übernehmen" und „Original
behalten" (`Rewrite.jsx`, Zeile 16); ohne ein Original, das ersetzt wird, ergibt sie
keinen Sinn. `Insertion` öffnet eine Lücke im Textfluss, `Slot` ist ein gestrichelter
Zielplatz im Fluss
(`Slot.jsx`, Zeilen 18–30), `Region` ist ein `span`, der einen Bereich einfärbt
(`Slot.jsx`, Zeilen 31–34). Für ein `Feld` mit null Ankern lässt sich keine davon
platzieren.

Bleiben `compare` und die Struktur-Karte, die das Ticket als mögliche Passform nannte.
Die Sorge des Tickets — „möglicherweise sehen sie dann aber aus wie Mängel" — bestätigt
sich am Text des Design Systems selbst. Dort steht die Zuordnungsregel
(`design-system/readme.md`, Zeile 66): *zwei Stellen → `compare` (Widerspruch)* und
*Textweit → Struktur-Karte (Roter Faden)*. Beide sind Mängel benannt. Eine Verbindung ist
das Gegenteil eines Widerspruchs.

Dazu kommt ein praktischer Punkt: `compare` ist keine eigene Form, sondern eine
Zusatzangabe an der Anmerkungskarte — mit ihr kommt der ganze Kopf samt Rang mit. Und die
Struktur-Karte existiert im Design System überhaupt nur als Name in diesem einen Satz; in
`design-system/components/` gibt es keine Datei dazu.

### Was doch übernommen wurde

Nicht die Formen, aber die Anordnung von `compare`: zwei Einträge, jeder mit einer
Bezeichnung und dem Zitat darunter. Genau so ist die Verbindung gebaut — „Erste Stelle"
und „Zweite Stelle", darunter das kursive Zitat. Und die gesamte Farb-, Abstands- und
Radienlehre des Design Systems, weil die Karte ausschließlich mit dessen Farbnamen
arbeitet.

### Das Ergebnis in einer Zeile

Die Formenlehre gilt weiter für alles, was eine Korrektur ist. Für Erweiterungen kommt
eine achte Form dazu: die Karte in der Seitenspalte, ohne Ziffer, ohne Rang, ohne
Textbezug als Pflicht. Verworfen wird nur ein Teil, dafür ausdrücklich: die Rangfolge
Fehler / Empfehlung / Geschmack gilt für Erweiterungen nicht.

---

## Was daran noch Jakobs Urteil braucht

Alles Folgende ist am Code belegt, aber nichts davon ist am Auge geprüft. Niemand hat die
Karten bisher mit echten Erweiterungen in einem echten Text angesehen.

**1. Der dunkle Modus ist nachgerechnet, nicht angeschaut.** Die Karte benutzt
ausschließlich Farbnamen, die unter `[data-theme="dark"]` neu gesetzt werden — das ist
sicher. Ob der Akzentstrich im Dunkeln noch als Strich zu erkennen ist oder mit dem
Rahmen verschwimmt, weiß man erst beim Hinsehen. Das Ticket verlangte ausdrücklich eine
Ansicht im dunklen Modus; die fehlt.

**2. Der Akzent ist nicht eindeutig belegt.** Dieselbe Akzentfläche `--accent-tint`, mit
der eine gemerkte Erweiterung unterlegt wird (`app/src/style.css`, Zeile 1450), unterlegt
auch einen Absatz, an dem ein offener Hinweis hängt (Zeile 1733). Zwei Dinge mit
gegenteiliger Bedeutung tragen dieselbe Farbe. Das kann in Ordnung sein, weil sie an
verschiedenen Orten stehen — Spalte gegen Textkörper. Es kann aber auch genau die
Verwechslung erzeugen, die dieser ganze Abschnitt vermeiden will.

**3. „Merken" bleibt eine Liste.** Die Geste hat inzwischen eine Folge: Gemerktes steht
oben (`app/src/erweiterung-model.mjs`, Zeilen 86–100, abgesichert durch eine Prüfung in
`app/test/erweiterungslauf-model.test.mjs`, Zeile 342). Was es nicht gibt, ist ein
eigener Ort für das Gemerkte und keine Wiedervorlage — alles bleibt eine einzige Liste,
in der das Behaltene nach oben rutscht. Ob das reicht, oder ob Gemerktes irgendwann
woanders hingehört, entscheidet sich erst, wenn dort mehr als drei Einträge liegen.

**4. Die Seitenspalte als Ort ist eine Setzung.** Die Begründung ist stimmig — nicht
aufdrängen, findbar bleiben. Ob sie in der Praxis trägt, entscheidet sich an einer Frage,
die nur beim Schreiben zu beantworten ist: Schaut man je hin? Die Struktur-Spalte darüber
wächst mit dem Text, und seit Neuestem steht zwischen ihr und den Erweiterungen noch die
Zeile für zurückgehaltene Hinweise. Bei einem langen Text können die Erweiterungen also
weit unten landen. Es gibt heute nichts, was sie in den Blick holt — das ist Absicht,
aber Absicht kann in diesem Fall auch heißen: unsichtbar.

**5. Wieviel Text die zugeklappte Karte tragen darf.** Sie zeigt heute den ersten Satz des
Gedankens, bis zu 96 Zeichen. In einer schmalen Spalte sind das drei bis vier Zeilen pro
Karte. Bei fünf Karten ist die Spalte voll. Ob der Anriss kürzer sein muss, oder ob die
Art allein genügt, ist offen.

**6. Ob „Weglegen" endgültig genug ist.** Weggelegtes wird nie wieder vorgeschlagen und
ist aus der Ansicht verschwunden, bleibt aber gespeichert. Es gibt keinen Weg, es
zurückzuholen. Das war die bewusste Vereinfachung gegenüber der dreistufigen
Verwerfen-Leiter der Hinweise. Sollte sich beim Schreiben zeigen, dass man Weggelegtes
vermisst, wäre die kleinste Antwort ein Aufklapper „Weggelegtes" am Fuß der Rubrik — nicht
die Rückkehr der Leiter.
