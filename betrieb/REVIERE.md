# Reviere — welcher Ordner gehört zu welcher Arbeit

Ein **Revier** ist ein Ordner mit einer einzigen Bedeutung. Wer weiß, in welchem Revier
er gräbt, weiß auch, wem er dabei ins Gehege kommt.

Diese Seite ist **Prosa, keine Tabelle**. Sie nennt **Ordner** und **Namensendungen** —
und mit Absicht **keinen einzigen Dateinamen**. Eine Liste von Dateinamen wäre nach
zwei Wochen falsch, ohne dass es jemand merkt: Dateien kommen und gehen, Ordner bleiben.
Aus demselben Grund gibt es hier auch **nichts Maschinenlesbares**. Eine Revierkarte, die
ein Programm liest, muss gepflegt werden, sonst lügt sie — und eine lügende Karte ist
schlimmer als gar keine. Was hier steht, liest ein Mensch, bevor er anfängt.

---

## Wozu das gut ist

Es ist einmal teuer schiefgegangen. Zwei Arbeiten liefen drei Tage lang parallel an
derselben Stelle: Die eine schaffte eine abgeschriebene Bauweise ab, die andere schrieb
sie währenddessen ein weiteres Mal ab. Beide hatten recht, beide waren sorgfältig — nur
konnte keiner von beiden sehen, woran der andere gerade saß. Der Fall ist in
`betrieb/LEITSTAND.md` nacherzählt, samt der Stelle im Programm, die ihn bis heute in
ihrem Kopfkommentar festhält.

Daraus folgen zwei Handgriffe, mehr nicht:

1. **Bevor du anfängst:** Schau nach, welches Revier deine Arbeit anfasst. Steht es in
   deinem Eintrag unter `betrieb/leitstand/`, kann jeder andere es lesen.
2. **Bevor du anfängst:** Sieh die anderen Einträge unter `betrieb/leitstand/` durch. Wenn
   dort schon jemand dasselbe Revier nennt, redet ihr miteinander — vorher, nicht beim
   Zusammenführen.

Zwei Arbeiten im selben Revier sind **nicht verboten**. Sie sind nur der eine Fall, bei
dem man voneinander wissen muss.

---

## Die sechs Reviere

Das Wurzelverzeichnis hat sechs Ordner. Jeder ist ein Revier, jedes Revier hat genau eine
Bedeutung.

### `betrieb/` — wie an Onda gearbeitet wird

Hier steht nichts über das Produkt, nur über die Arbeit daran: die Regel für den
Leitstand, die Einträge der einzelnen Zweige, die Wächter und die laufenden Vorhaben.

Der Ordner ist so gebaut, dass zwei Leute darin **nie kollidieren**, solange sie sich an
zwei Sätze halten: Ein Leitstand-Eintrag gehört genau einem Zweig, und ein neuer Wächter
ist eine **neue Datei** — niemand trägt sich irgendwo ein. Wer eine gemeinsame Datei
anfasst, in die alle schreiben, hat den Punkt dieses Ordners verfehlt.

Nachbarrevier: keins. `betrieb/` ist von allen anderen unabhängig — die Wächter *lesen*
die anderen Reviere, sie ändern dort nichts.

### `app/` — das Produkt

Das Schreibwerkzeug selbst, und damit das Revier mit dem meisten Verkehr. Es zerfällt in
vier Unterreviere, die man getrennt betreten kann:

- **`app/src/`** — das Programm. Der Ordner ist **flach**, mit Absicht: Hunderte fest
  eingetippte Pfade zeigen hinein, und ein Umzug würde sie alle brechen. Die Ordnung liegt
  darum nicht im Ordner, sondern in der **Namensendung**. `-model.mjs` ist Zustand und
  Rechnen, `-ui.mjs` ist Oberfläche, `-kontext.mjs` ist ein Kanal zum Sprachmodell, `.css`
  ist Gestalt. Daneben liegen fünf `.js`-Dateien aus der Zeit vor den Modulen; sie sind
  namentlich bekannt und werden nicht mehr. Eine davon ist die große Oberflächendatei, an
  der sich Änderungen am häufigsten stoßen — wer sie anfasst, sagt es besonders deutlich.
- **`app/test/`** — die Prüfungen. `.test.mjs` sammelt der Prüflauf selbst ein; ein Name
  mit „smoke" darin ist ein Rauchtest, der einzeln von Hand läuft.
- **`app/evals/`** — der Katalog, der den Fertigzustand beschreibt, und die Werkzeuge, die
  daran messen. Hier ändert man **das Messgerät**, nicht das Gemessene. Wer beides in
  einem Zug anfasst, kann hinterher nicht mehr sagen, ob sich das Produkt verbessert hat
  oder nur der Maßstab.
- **`app/scripts/`, `app/fonts/`** — das Drumherum: der Entwicklungsserver, die
  Schriften. Selten angefasst, dafür mit weiter Wirkung.

Ein Sonderfall, der beide Reviere zugleich berührt: die eine Liste der Kanäle, über die
Onda mit dem Sprachmodell spricht. Sie liegt in `app/src/`, aber alles andere im Projekt
liest aus ihr — wer sie ändert, ändert nie nur eine Datei. Ein eigener Wächter unter
`betrieb/waechter/` hält das zusammen.

### `mac/` — die Hülle

Der Swift-Teil, der Onda zu einer Mac-Anwendung macht, samt Schlüsselbund und dem echten
Speicherweg für Jakobs Texte. **Ein Revier für sich, und ein besonders vorsichtiges:**
Was hier gebaut wird, lässt sich nur auf einem echten Mac gegenprüfen. In einer
Linux-Arbeitsumgebung sieht eine Änderung hier immer gut aus — sie ist dort schlicht nicht
messbar. Wer nichts an der Mac-App will, hat in diesem Ordner nichts verloren.

### `tools/` — das zweite Teilprojekt

Die Figma-Erweiterung. **Kein Randbereich**, auch wenn der Name klein klingt: Über die
letzten Arbeitsschritte wurde hier mehr geändert als an der größten Datei des Produkts.
Eigene Abhängigkeiten, eigener Prüflauf, eigene Bauanleitung. Wer hier arbeitet, arbeitet
nicht am Produkt — und umgekehrt.

### `design/` — die Gestaltungswahrheit

Farben, Rundungen, Abstände, Bausteine, die Gestaltungsfähigkeit. Es gibt sie **genau
einmal**; ein Wächter unter `betrieb/waechter/` hält es dabei. Der Grund ist eine
Narbe: Es gab schon zwei Gestaltungssysteme mit demselben Namen und entgegengesetzten
Farbentscheidungen, und keine Instanz, die sagen konnte, welches gilt.

Dieses Revier grenzt hart an `app/src/`: Dort liegen die `.css`-Dateien, die das Ergebnis
tragen. **Die Entscheidung fällt in `design/`, die Umsetzung steht in `app/src/`.** Wer
nur die Umsetzung ändert, hat die Entscheidung heimlich mitverschoben.

### `docs/` — das Wissen für Menschen

Philosophie, Systembeschreibung, Feldforschung, Rückmeldungen von Jakob, die
Entscheidungsakten. Hier ändert man nie ein Verhalten, immer nur ein Verständnis.

Das Revier ist ungefährlich für das Produkt und gerade deshalb wichtig: Was hier steht,
lesen die Programme in `app/src/` teilweise als Grundlage — einzelne Kommentare dort
verweisen auf Texte hier. Ein Text in `docs/` verschwindet also nicht spurlos, auch wenn
kein Prüflauf darüber rot wird. Der Verweis-Wächter unter `betrieb/waechter/` merkt es.

---

## Wenn zwei im selben Revier arbeiten

Kein Verbot, kein Antrag, keine Sperre. Nur drei Sätze:

1. Beide schreiben ihr Revier in ihren eigenen Eintrag unter `betrieb/leitstand/`.
2. Wer als Zweiter kommt, liest den Eintrag des Ersten — vor der ersten Änderung.
3. Wer etwas **abschafft**, das der andere gerade noch benutzt, sagt es dort, **bevor**
   die Arbeit zusammengeführt wird. Genau dieser Satz ist die Lehre aus dem Schadensfall
   oben: Die Abschaffung war richtig, sie war nur zu spät sichtbar.
