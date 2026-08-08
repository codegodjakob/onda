# Die Ästhetik

**Ab dem 8. August 2026 gilt das hier für die ganze App, nicht nur für die Anmerkungen.**
Wer etwas Neues baut, baut es so. Wer etwas Altes anfasst, bringt es dabei mit.

Alles hier ist am Code geprüft und frisch gemessen; wie, steht jeweils dabei.

---

## Der eine Satz

**Tinte auf Papier. Unterschiede entstehen durch Form, nicht durch Farbe. Die einzige
Farbe in der Oberfläche ist die Aura — die KI selbst.**

## Warum

> „sieht gut aus aber keine farben bitte" — Jakob, 8. August 2026

Der Anlass war die Neugestaltung der Anmerkungen. Dort hat sich gezeigt, dass die Regel
mehr kann als hübsch aussehen: Wenn Farbe nicht zur Verfügung steht, muss die **Form**
tragen — und eine Form, die trägt, sagt mehr als ein Farbton. Eine Klammer sagt „von hier
bis hier". Ein Rot sagt nur „Achtung", und man muss lernen, was gemeint ist.

Dazu kommt der Ort: Onda ist ein Schreibwerkzeug. Der Text ist das Bunteste, was auf dem
Schirm steht — nicht die Oberfläche darum herum. Jede Farbe in der Oberfläche zieht
Aufmerksamkeit vom Text ab.

Und es macht die eine verbliebene Farbe zu einer Aussage: **Was farbig ist, ist die KI.**
Die Aura ist der einzige Fleck Farbe in der ganzen App. Man erkennt sie ohne Beschriftung.

## Die vier Regeln

### 1 · Unterschiede durch Form

Wo bisher ein Farbton zwei Dinge auseinanderhielt, tut es jetzt die Form. Die Beispiele
aus dem Programm, alle nachprüfbar:

| Was | Vorher | Jetzt |
|---|---|---|
| Anmerkung: Umfang der markierten Stelle | — | Kontur ums Wort · Strich unterm Satz · Klammer am Absatz · Fläche beim Ortswechsel |
| Die vier Markenarten | drei durch Auszeichnungsart, die vierte durch den Akzentton | Kontur · versenkte Fläche · angehobene Fläche · gepunktete Linie |
| Bestätigender gegen löschenden Knopf | Tinte gefüllt gegen Rot gefüllt | Fläche gegen Umriss |
| Quellenarten (PDF, YouTube, Zitat) | drei Farben auf dem Etikett | das Wort auf dem Etikett |

Die Frage, die man sich beim Bauen stellt, ist deshalb nie „welche Farbe nehme ich",
sondern: **Welche Form ist hier noch frei?** Kontur, versenkte Fläche, angehobene Fläche,
durchgezogene Linie, gestrichelte Linie, gepunktete Linie, Klammer, Umriss, Kursivsatz,
Gewicht — das ist der Vorrat, und er ist größer als der Farbkasten.

### 2 · Rot ist nicht die Sicherung

Das Rot am Löschknopf fühlte sich nach Sicherheit an. Es war keine: Alle diese Wege haben
ohnehin eine **Rückfrage in zwei Schritten**, und die ist die eigentliche Sicherung. Dazu
kommt das Wort selbst — „Endgültig löschen" sagt mehr als jeder Farbton — und seit dem
8.8.2026 die Form: Der bestätigende Knopf ist eine gefüllte Fläche, der löschende ein
Umriss. Die gefährlichste Verwechslung wäre gewesen, beide gefüllt zu lassen.

Wer das Rot zurückholen will, ändert **eine Zeile** in `app/src/onda-tokens.css`
(`--danger`) und sonst nichts. Die Entscheidung ist umkehrbar, nur nicht versehentlich.

### 3 · Die Marken heißen weiter, wie sie hießen

`--accent`, `--danger`, `--warning` gibt es noch — sie zeigen nur nicht mehr auf Farbe.
Frisch gezählt am 8.8.2026: **72 Regeln** zeigen auf die Akzent-Familie, **14** auf die
Rot-Familie. Sie alle umzubenennen wäre eine große Änderung ohne Gewinn; sie alle umzulenken
war eine kleine mit dem ganzen Gewinn.

`--success`, `--warning` und `--info` waren übrigens schon vorher Tinte. Wer nach der alten
Buntheit sucht, findet dort keine — der Anschein kam von `--accent` und `--danger`.

### 4 · Die Aura ist die Ausnahme, und sie bleibt es

Der Farbverlauf der Aura (`--gradient-aura`, `--shadow-glow`, `--shadow-glow-hoch`, die
Sky-Töne) bleibt unverändert. Er darf nirgendwo sonst auftauchen — auch nicht „nur ein
bisschen", auch nicht als Fokusrahmen, auch nicht als Etikett. Sobald ein zweites Ding
farbig ist, sagt Farbe nicht mehr „KI".

## Wie das gehalten wird

Zwei Prüfungen, absichtlich verschieden:

| Prüfung | Was sie kann |
|---|---|
| `app/test/aesthetik-tinte.test.mjs` | liest das CSS. Findet auch, was selten sichtbar wird — ein Rot, das nur beim Überfahren erscheint |
| `assertKeineFarbeAusserDerAura` in `app/test/onda-ui-smoke.mjs` | misst, was **wirklich** auf dem Schirm steht, über die erreichbaren Fenster und in beiden Erscheinungen |

Beide werden gebraucht. Das CSS kann farblos aussehen und über eine Marke doch auf Farbe
zeigen; eine Marke kann bunt sein, ohne je gerendert zu werden. Am 8.8.2026 gegengeprüft:
Fünf absichtliche Rückfälle eingebaut (Akzent wieder Sky, Rot wieder am Löschknopf, eine
einzelne Regel wieder bunt, der Löschknopf wieder gefüllt, die vierte Markenart wieder ohne
eigene Form) — **jeder wurde von mindestens einer Prüfung gefangen**, und drei davon
ausschließlich von der CSS-Prüfung.

### Die Schwelle, an der sich Farbe von Grau trennt

**Ondas Graus sind absichtlich warm.** `#736d64` hat 15 Abstand zwischen dem stärksten und
dem schwächsten Farbkanal, `#b6afa4` hat 18. Beide Prüfungen schlagen erst ab **30** an.
Eine engere Schwelle meldete beim ersten Messversuch das Papier selbst als Farbe — der
Fehler saß in der Messung, nicht in der App. Echte Farbe liegt weit darüber: Sky `#8db2c9`
hat 60, das abgeschaffte Rot `#b04a3f` hat 113.

## Was das für neue Arbeit heißt

- **Braucht das hier eine Farbe?** Nein. Die Frage ist, welche Form frei ist.
- **Zwei Dinge sollen sich unterscheiden?** Kontur gegen Fläche, gefüllt gegen umrandet,
  durchgezogen gegen gestrichelt gegen gepunktet, Gewicht gegen Grad. Farbe steht nicht
  zur Wahl.
- **Es ist wirklich ein Zustand (Fehler, Erfolg, Warnung)?** Dann trägt ihn das **Wort**,
  und die Form verstärkt es. `--success`/`--warning`/`--danger` gibt es weiterhin, sie sind
  Tinte — sie zu benutzen ist in Ordnung, sie färben nur nichts mehr.
- **Es gehört zur KI selbst?** Dann und nur dann die Aura.

## Was hier bewusst offen bleibt

- **Zwei Markierungssysteme laufen nebeneinander:** die vier `aura-mark`-Arten und die fünf
  Gesten nach Reichweite (`docs/DIE-GESTE-IM-TEXT.md`). Beide sind jetzt farblos und
  form-getrennt, aber es sind immer noch zwei. Sie zusammenzuführen ist ein eigener
  Schritt.
- **Die Korrektur sagt ihre Fassung zweimal** — einmal im Satz, einmal in ihrer Zeile
  daneben. Ob das Wiederholung ist oder Bestärkung, ist noch nicht entschieden.
