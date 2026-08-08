# ADR 0001 — Den begonnenen Gestaltungs-Umzug zu Ende führen

**Datum:** 8. August 2026
**Stand:** angenommen, mit einer offenen Frage an Jakob (siehe unten)

## Worum es geht

Onda hat zwei Gestaltungsfassungen. Die erste liegt heute unter
`design/archiv-v1/tokens/`, die zweite unter `design/tokens/`. Sie widersprechen sich in
zwei Punkten, und beide Punkte sind am Code nachlesbar:

| | Fassung 1 (`design/archiv-v1/tokens/`) | Fassung 2 (`design/tokens/`) |
|---|---|---|
| Akzentfarbe | Himmelblau: `--accent:var(--sky-500)`, `--sky-500:#8db2c9` (Zeilen 12 und 29 in `colors.css`) | Tinte: `--accent:var(--ink-900)`, im Kommentar ausdrücklich „der Akzent IST Tinte" |
| Rundung von Bedienelementen | rund wie eine Pille: `--radius-control:var(--radius-full)` = 999px | knapp: `--radius-control:var(--radius-lg)` = 8px |
| Rundung von Flächen | 24px für Karte, Overlay, Panel | 12px für Karte, Overlay, Panel |

## Der Befund: der Umzug hat schon stattgefunden — halb

Die Datei, die in der App wirklich gilt, ist `app/src/onda-tokens.css`. Sie steht mitten
zwischen beiden Fassungen:

- **Bei der Rundung ist sie umgezogen.** `--radius-control:8px` (Zeile 80) ist genau der
  Wert der zweiten Fassung; die Pille der ersten Fassung (999px) ist verschwunden.
  Karte, Panel und Overlay stehen bei 10px, 10px und 16px — nicht mehr bei den 24px der
  ersten Fassung, aber auch noch nicht auf den 12px der zweiten.
- **Bei der Farbe ist sie nicht umgezogen.** `--sky-500:#8db2c9` (Zeile 17) und
  `--accent:var(--sky-500)` (Zeile 29) sind wörtlich die erste Fassung.
- **Und die Prüfung hält diesen Zwischenstand fest.** `app/test/onda-design-contract.test.mjs`
  prüft in Zeile 39 `--sky-500: #8db2c9` und ein paar Zeilen darunter die heutigen
  Rundungswerte. Wer die Farbe umzieht, macht diesen Test rot — nicht, weil er kaputt
  wäre, sondern weil er genau diesen halben Stand festhält.

## Die Entscheidung

**Wir führen den begonnenen Umzug zu Ende. Wir entscheiden ihn nicht neu.**

Das ist der Unterschied, auf den es ankommt. „Neu entscheiden und kopieren" hieße: sich
noch einmal zwischen beiden Fassungen entscheiden und die gewählte in die App schreiben.
Das wäre falsch, denn eine Hälfte der Entscheidung ist längst gefallen und steht
ausgeliefert im Code. Was fehlt, ist die andere Hälfte.

Daraus folgt für die Reihenfolge:

1. Es wird **eine** Wahrheit geben: `design/tokens/`. `app/src/onda-tokens.css` folgt ihr,
   statt eine dritte Fassung zu sein.
2. Jede Abweichung, die bleibt, bekommt einen Satz daneben, **warum** sie bleibt. Eine
   Abweichung ohne Grund ist eine, die niemand mehr zurückbauen kann, weil keiner weiß,
   ob sie Absicht war.
3. `app/test/onda-design-contract.test.mjs` wird beim jeweiligen Schritt **mitgezogen**,
   nicht vorher gelockert. Der Test soll den Stand festhalten, den es gibt — nicht den,
   den wir uns wünschen.

## Offene Frage an Jakob

**Diese Frage ist nicht entschieden, und sie wird hier ausdrücklich nicht für Jakob
entschieden.**

> Soll der Akzent von Onda das Himmelblau `#8db2c9` bleiben — oder soll er, wie es die
> zweite Gestaltungsfassung vorsieht, die Tinte selbst sein (`--accent:var(--ink-900)`,
> also dieselbe Farbe wie der Text)?

Was an der Frage hängt, in klaren Worten:

- **Himmelblau bleibt** heißt: Onda hat eine eigene Farbe. Jeder Knopf, jeder aktive
  Zustand, jeder Fokusrahmen trägt sie. Das ist wiedererkennbar — und es ist ein zweiter
  Farbton neben dem Papier und der Tinte.
- **Tinte statt Blau** heißt: Onda hat gar keine Akzentfarbe mehr. Was hervorgehoben ist,
  ist dunkler, nicht bunter. Das ist stiller und passt zu einem Werkzeug, in dem der Text
  das Lauteste sein soll — aber die Oberfläche verliert damit ihr einziges Farbsignal.

Es ist eine Geschmacks- und Haltungsfrage, keine technische. Beide Wege sind gleich
aufwendig. Solange sie offen ist, bleibt `#8db2c9` unverändert im Code stehen, und dieser
Eintrag hier bleibt offen — das ist besser, als still das eine oder andere zu tun.

## Was das ausdrücklich nicht bedeutet

`app/src/style.css` (4.790 Zeilen) wird **nicht** aufgelöst, solange diese Frage offen ist.
Eine Gliederung dieser Datei wäre Arbeit auf Sand: Sie hängt an genau der Farbfrage, die
oben unbeantwortet steht.
