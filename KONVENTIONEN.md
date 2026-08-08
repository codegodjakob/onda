# Konventionen — die Hausordnung

Dies ist die Liste der Regeln, nach denen an Onda gearbeitet wird. Sie hat eine einzige
Besonderheit, und die ist der ganze Punkt:

> **Neben jeder Regel steht der Wächter, der sie erzwingt.**
> Eine Regel ohne Wächter ist hier ausdrücklich **als solche gekennzeichnet**.

Der Grund ist Erfahrung, keine Vorliebe. Eine Regel, die nur aufgeschrieben ist, hält
genau so lange, wie sich jemand an sie erinnert — und niemand erinnert sich an eine
Regel, die er nie gebrochen hat. Ein Wächter dagegen ist ein kleines Programm, das eine
einzige Frage stellt und laut wird, wenn die Antwort nicht mehr stimmt.

**Was ein Wächter ist:** eine Datei unter `betrieb/waechter/`. Alle zusammen startet
man mit einem Befehl:

```sh
node betrieb/waechter/alle.mjs
```

Der Sammler `betrieb/waechter/alle.mjs` liest den Ordner und startet **jede** Datei
darin — auch in künftigen Unterordnern. Ein neuer Wächter ist deshalb eine neue Datei
und kein Eintrag in einer Liste: Listen, in die man sich eintragen muss, sind Listen, die
man zu ergänzen vergisst. Der Sammler selbst trägt keine Nummer.

**Zehn Nummern, elf Wächterdateien.** W8 ist doppelt besetzt (W8a und W8b), weil beide
dieselbe Frage aus zwei Richtungen stellen. W1 ist der einzige Wächter, der nicht unter
`betrieb/waechter/` liegt, sondern als Prüfung mitläuft — er braucht die Programmteile,
die er prüft, und die kann er nur aus `app/test/` heraus laden.

---

# Teil 1 — Die Regeln mit Wächter

## W1 — Ein gespeicherter Text darf beim Laden nichts verlieren

Onda biegt jeden gespeicherten Stand beim Laden auf die heutige Form zurecht. Geht dabei
ein Feld verloren, ist Arbeit weg — endgültig, denn der nächste Speichervorgang schreibt
die zurechtgebogene Fassung zurück. Wer am Ladeweg etwas ändert, weist Feld für Feld
nach, dass nichts fehlt.

**Wächter:** `app/test/gespeicherter-stand.test.mjs` (läuft in `npm run test:unit` mit),
dazu der Browser-Weg in `app/test/gespeicherter-stand-smoke.mjs`. Die echten alten
Stände liegen in `app/test/gespeicherte-staende/`, ihre Herkunft steht dort daneben.

## W2 — Jede Prüfung, die im Ordner liegt, läuft auch wirklich

Eine Prüfung, die niemand startet, ist keine Prüfung. Sie ist schlimmer als keine, weil
das Grün daneben dann lügt.

**Wächter:** `betrieb/waechter/prueffang.mjs` — zählt die Prüfdateien im Ordner, startet
den Lauf und vergleicht: gefunden gegen tatsächlich abgearbeitet.

## W3 — Jede Prüfdatei hat etwas, das sie startet

Dasselbe eine Ebene höher: Auch die Prüfungen unter `app/evals/pruefungen/` und die
Wächter selbst brauchen jeweils einen Starter. Wer keinen hat, steht begründet in der
Ausnahmeliste des Wächters.

**Wächter:** `betrieb/waechter/waechter-laeuft.mjs`

## W4 — Jeder genannte Pfad zeigt auf eine echte Datei

Ein toter Verweis tut nicht weh. Er bricht nichts, nichts wird rot — er wird nur
langsam wertlos. Genau das war schon der Fall: Zwei Dateien verwiesen monatelang auf
eine Datei, die es nie gab.

**Wächter:** `betrieb/waechter/verweise.mjs`

**Wie weit er reicht, ehrlich gesagt:** Er liest `app/evals/bindungen.json`,
`app/evals/v2-fertigzustand.json` und die reinen Kommentarzeilen unter `app/src/`,
`app/evals/`, `app/test/` und `tools/`. **Diese Seite hier liest er nicht**, und auch
keine andere `.md`-Datei. Wer hier einen Pfad nennt, prüft ihn selbst nach.

## W5 — Was eine Maschine schreibt, wird nicht versioniert

Der einzige nachgewiesene Konfliktgrund dieses Projekts. Bei einem Zusammenführen lagen
sieben von sieben Konflikten in Maschinenausgabe; die von Hand geschriebenen Dateien
fügten sich konfliktfrei. Einen Konflikt in einem Bild oder einem zusammengepressten
Bündel löst ohnehin niemand von Hand auf — man muss neu erzeugen.

**Wächter:** `betrieb/waechter/erzeugt.mjs` — prüft dieselben Muster wie `.gitignore`
noch einmal gegen die tatsächlich verfolgten Dateien. Zwei Netze, weil bewiesen ist,
dass eines allein nicht trägt.

## W6 — Jede Datei trägt einen Namen, den man ihr ansieht

In `app/src/`: eine der bekannten Endungen — `-model.mjs` (Zustand und Rechnen),
`-ui.mjs` (Oberfläche), `-kontext.mjs` (ein Kanal zum Modell), `.css` (Gestalt). In
`app/test/`: `.test.mjs` für eine Prüfung, „smoke" im Namen für einen Rauchtest.

Es ist eine **reine Namensregel**, keine Textsuche: Am Namen lässt sich nicht handeln,
er steht schon da, bevor die erste Zeile geschrieben ist. Was heute anders heißt, steht
namentlich mit einem Satz Begründung in der Ausnahmeliste. Neu dazu darf dort nichts.

**Wächter:** `betrieb/waechter/ort.mjs`

## W7 — Eine Fähigkeit trägt ihren Namen allein

Eine „Fähigkeit" ist ein Ordner mit einer `SKILL.md`, aus der ein Agent lernt, wie etwas
in diesem Projekt gemacht wird. Zwei Ordner mit demselben Fähigkeitsnamen sind zwei
Wahrheiten, und dann gilt keine.

**Wächter:** `betrieb/waechter/eine-faehigkeit.mjs`

## W8a — Es gibt genau eine Liste der Kanäle zum Modell

Dieselbe Liste stand einmal viermal im Baum, jedes Mal von Hand abgeschrieben. Als ein
Kanal dazukam, wurden drei Abschriften nachgezogen und die vierte nicht — und sie blieb
grün, denn eine Prüfung, die vier von fünf Kanälen kennt, vermisst den fünften nicht.
Heute steht die Liste einmal in `app/src/kanaele.mjs`, alles andere liest daraus.

**Wächter:** `betrieb/waechter/kanal-register.mjs`

## W8b — Jede Datei sagt selbst, was sie ist

Jede `.mjs`-Datei unter `app/src/` fängt mit einem Kommentar an. Der ersetzt die
Dateiliste, die früher in `CONTEXT.md` stand und dort zwangsläufig veraltete: Ein Satz,
der in der Datei selbst steht, zieht mit ihr um und wird mit ihr gelöscht.

**Wächter:** `betrieb/waechter/kopfkommentar.mjs` — prüft **Anwesenheit, nicht
Qualität**. Ob der Satz etwas taugt, sieht nur ein Mensch.

## W9 — Importe stehen alphabetisch

Nur dort, wo ein Block ausdrücklich gehütet wird (heute: `app/src/workspace.js`). Zwei
Agents, die gleichzeitig je eine Zeile ans Ende eines Importblocks hängen, streiten beim
Zusammenführen um dieselbe Zeile. Nach Alphabet einsortiert streiten sie fast nie.

**Wächter:** `betrieb/waechter/import-sortierung.mjs`

## W10 — Jeder Arbeitszweig sagt, woran er arbeitet

Wer einen Zweig anfängt, legt `betrieb/leitstand/<zweigname>.md` an — eine Datei je
Zweig, nie eine gemeinsame. Getrennte Dateien streiten beim Zusammenführen nie. Die
Regel dahinter steht in `betrieb/LEITSTAND.md`.

**Wächter:** `betrieb/waechter/leitstand.mjs` — prüft die **Anwesenheit** des Eintrags,
nicht seinen Inhalt.

---

# Teil 2 — Regeln OHNE Wächter

Diese vier stehen hier ohne Netz. Das ist keine Nachlässigkeit, sondern eine Ansage: Sie
brechen still, und man merkt es erst, wenn jemand hinschaut.

## Umlaute in Datei- und Ordnernamen: nie

Im sichtbaren Text und in Kommentaren selbstverständlich schon, in Namen nie. Der Zweig
`claude/d-28fv4p` wird zu `betrieb/leitstand/claude-d-28fv4p.md`. **Kein Wächter.**

## Modellnamen und Preise haben ein Verfallsdatum

`app/src/agent-tasks.mjs` trägt die Modellnamen und die Preisliste fest eingetippt. Beides
kann von außen veralten, ohne dass irgendetwas rot wird — der Kostenzähler zeigt dann
still falsche Beträge. Es ist die einzige Abhängigkeit dieses Projekts mit Verfallsdatum.

**Datierte Prüfpflicht:** Stand der Preise ist 07/2026. **Nächste Prüfung von Hand:
Februar 2027**, danach halbjährlich. **Kein Wächter** — und das ist eine schwache
Antwort, sie steht hier, damit sie wenigstens sichtbar schwach ist.

## Kein Linter, kein Formatierer

Es gibt eine `.editorconfig` und sonst nichts. Sie legt Einrückung, Zeilenende und
Zeichensatz fest, damit zwei Agents nicht darüber streiten — mehr will sie nicht. Ein
Linter oder Formatierer wäre neuer, ungeprüfter Zwang an einem Projekt, das gerade erst
wieder Boden bekommt: Sein erster Lauf schreibt jede Datei um, und danach kann niemand
mehr sagen, welche Änderung von wem stammt. **Kein Wächter, mit Absicht.**

## Kein npm-Arbeitsbereich an der Wurzel

Die `package.json` im Wurzelverzeichnis reicht nur weiter (`npm --prefix app …`) und
bündelt bewusst keine Pakete. Der Grund ist gemessen, nicht befürchtet: Das Figma-Werkzeug
in `tools/figma-onda-one-page` baut mit dem esbuild aus `app/node_modules` — ein
Arbeitsbereich würde diesen Ordner umräumen und damit die einzige heute funktionierende
Prüfstraße anfassen. **Kein Wächter**, aber `npm test` an der Wurzel wird rot, wenn es
dennoch jemand versucht.

---

# Teil 3 — Die benannten Auslöser

Vier Dinge sind **heute bewusst nicht dran**. Für jedes steht hier, woran man merkt, dass
es dran ist — damit es nicht bei „irgendwann mal" bleibt und nicht aus Versehen zu früh
passiert.

## 1. Vor jedem Schnitt an `app/src/workspace.js`: zwei Stolperstellen

Die Datei ist die größte des Projekts, und sie zu zerlegen ist eine eigene Arbeit. Wer
sie anfängt, liest zuerst diese zwei Stellen — beide sind **still**, keine wird von
selbst rot:

- **`app/test/lauf-tor-waechter.test.mjs`, Zeile 194** lautet
  `if (dateiname === 'workspace.js')`. Dahinter steht Regel 3 („keine eigenen
  Sperr-Variablen"), und sie gilt **nur für eine Datei dieses Namens**. Löst man
  `workspace.js` in Nachfolgedateien auf, gilt die Regel für keine einzige davon mehr —
  und die Prüfung bleibt grün, weil sie schlicht nichts mehr zu prüfen findet.
- **`app/src/workspace.js`, `initWorkspace` ab Zeile 5485:** Dort meldet
  `createAnnotationController` fünf Rückrufe an (`getFindings`, `getWorkspace`,
  `persist`, `accept`, `undo`), und jeder führt zurück nach `workspace.js`. Auf der Ebene
  der Importe ist das **kein** Kreis — auf der Ebene der Aufrufe ist es einer. Wer nur
  die Importe anschaut, sieht ihn nicht.

## 2. Untergliederung von `app/src/`

`app/src/` ist flach, und das bleibt so, solange die Endungs-Konvention aus W6 trägt.

**Auslöser: rund 150 Dateien.** Ab da sagt eine Endung nicht mehr genug, weil zu viele
Dateien dieselbe tragen. Heute sind es 92 (Befehl siehe Teil 4). Vorher lohnt es nicht:
Die Pfade nach `app/src/` stehen hunderte Male fest eingetippt im Baum, jede Verschiebung
zieht sie alle nach.

## 3. `app/index.html` bekommt einen Anker je Bereich

Die Datei ist heute ein einziger Block Auszeichnung, in dem man Bereiche nur an den
`id`-Namen auseinanderhält. Die nächste Stufe ist ein Anker je Bereich:

```html
<div data-onda-bereich="bibliothek"> … </div>
<div data-onda-bereich="schreibflaeche"> … </div>
```

Damit lässt sich ein Bereich am Stück finden, verschieben und später in eine eigene
Datei ziehen. **Auslöser:** sobald zum ersten Mal zwei Arbeiten gleichzeitig an
`app/index.html` müssen — vorher ist es Umbau ohne Not.

## 4. `app/src/workspace.js` bekommt eine Auffrisch-Registratur

`refreshWorkspace` (ab `app/src/workspace.js`, Zeile 5428) ruft am Ende **15 Funktionen
namentlich auf** (Zeilen 5468 bis 5482) — jede Erweiterung von Onda hängt eine weitere
Zeile an diese Liste. Die nächste Stufe: Jeder Bereich meldet seine Auffrischung in
**seiner eigenen** Datei an, statt in einer gemeinsamen Liste zu stehen.

Dabei darf die **Reihenfolge nicht verlorengehen** — der Code verlässt sich ausdrücklich
darauf, nachzulesen in `app/src/workspace.js`, Zeilen 5451 bis 5453: Erst wird ein
Fenster sichtbar gemacht, dann misst der nächste Aufruf es aus; vorher wäre es versteckt
und nicht messbar. Deshalb meldet sich jeder Bereich mit **einer von drei Phasen** an,
und die Registratur arbeitet die Phasen in dieser Reihenfolge ab:

| Phase | Was darin passiert |
|---|---|
| `lage` | Was sichtbar ist und was nicht — Fenster auf, Fenster zu, Zustandsklassen |
| `inhalt` | Was in den sichtbaren Bereichen steht — die eigentlichen Auffrischungen |
| `nachmessen` | Was erst gemessen werden kann, wenn beides steht — Größen, Konturen, Fokus |

**Auslöser:** sobald die Liste 20 Aufrufe erreicht, oder früher, sobald jemand
`workspace.js` ohnehin zerlegt (dann zuerst Teil 3 Punkt 1 lesen).

---

# Teil 4 — Die festgelegte Zählweise

Dreimal ist in diesem Projekt dieselbe Frage von drei Seiten mit drei verschiedenen
Zahlen beantwortet worden. Nicht, weil jemand geschätzt hätte, sondern weil jeder anders
gezählt hat: mit oder ohne Unterordner, mit oder ohne Rauchtests, Dateien oder Prüffälle.

**Deshalb gilt ab hier: Zu jeder Zahl gehört der Befehl, mit dem sie entsteht.** Wer eine
dieser Zahlen nennt, nennt sie mit dem Befehl daneben — sonst ist es keine Zahl, sondern
eine Meinung. Alle Befehle laufen im **Wurzelverzeichnis**.

| Frage | Befehl | Stand 8.8.2026 |
|---|---|---|
| Wie viele Prüffälle laufen? | `cd app && npm run test:unit` → Zeile `# pass` | 1016 bestanden, 0 gefallen |
| Wie viele Prüfdateien gibt es? | `find app/test -name '*.test.mjs' \| wc -l` | 97 |
| Wie viele Rauchtests gibt es? | `find app/test -name '*smoke*.mjs' \| wc -l` | 14 |
| Wie viele Dateien liegen in `app/src/`? | `find app/src -type f \| wc -l` | 92 |
| Wie viele Wächter gibt es? | `ls betrieb/waechter/*.mjs \| wc -l` | 11 (10 nummerierte + der Sammler) |
| Sind alle Wächter grün? | `node betrieb/waechter/alle.mjs` | 10 grün, 0 rot |

**Die Zahlen in der rechten Spalte sind eine Momentaufnahme mit Datum, keine Vorgabe.**
Sie stehen hier, damit man sie nachrechnen kann. Weicht der eigene Lauf ab, hat der
eigene Lauf recht — mit einer Ausnahme: Wird die Zahl der Prüffälle **kleiner**, ist
etwas kaputt, und zwar unabhängig davon, ob alles grün meldet.

Zwei Zahlen gehören ausdrücklich **nicht** in diese Tabelle:

- **Der Fertigzustand** (`node app/evals/run-fertigzustand.mjs`). Der Lauf ruft die
  Anthropic-Schnittstelle auf und kostet Geld. Er wird gemessen, wenn jemand ihn
  ausdrücklich startet — und die Zahl gilt nur mit dem Datum ihres Laufs.
- **Die Rauchtests im Container.** Zwei davon sind hier nicht ehrlich messbar: einer ist
  vorgefunden wackelig, einer braucht einen Browser, den es im Container nicht gibt. Wer
  ihre Zahl nennt, nennt dazu, wo er sie gemessen hat.
