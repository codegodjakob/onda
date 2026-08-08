# ADR 0002 — `app/src/` und `app/test/` bleiben flach

**Datum:** 8. August 2026
**Stand:** angenommen

## Worum es geht

In `app/src/` liegen 92 Dateien nebeneinander, in `app/test/` 113. Kein Unterordner,
keine Gliederung nach Thema. Das sieht nach Unordnung aus, und der erste Vorschlag beim
Aufräumen lautet erwartbar: „Lass uns das in Unterordner sortieren — `agent/`,
`sprache/`, `recherche/`, `gestalt/`."

## Die Entscheidung

**Beide Ordner bleiben flach. Heute wird nichts umsortiert.**

## Warum — die gemessene Begründung

Es ist keine Geschmacksfrage. Der Preis einer Untergliederung ist gemessen, nicht
geschätzt. Alle Zahlen sind am 8. August 2026 im Baum erhoben worden; die Befehle stehen
daneben, damit jeder sie nachrechnen kann.

**1. 283 fest eingetippte Pfade in 116 Dateien zeigen auf `../src/`.**

```
grep -r --exclude-dir=node_modules --exclude-dir=dist -o "\.\./src/" app tools | wc -l   # 283
grep -rl --exclude-dir=node_modules --exclude-dir=dist "\.\./src/" app tools | wc -l     # 116
```

Jeder dieser Pfade ist eine Zeichenkette, kein Verweis, den ein Werkzeug automatisch
nachzieht. Wer eine Datei eine Ebene tiefer schiebt, muss jede Stelle von Hand
mitverschieben. Wer eine übersieht, merkt es erst, wenn der Test nicht mehr startet — im
besten Fall.

**2. 208 Pfadangaben stehen in `app/evals/bindungen.json`.**

Das ist die Datei, die festhält, welche Prüfung welches Abnahmekriterium belegt. Sie
nennt 208-mal einen Dateipfad, davon 80 verschiedene. Verschiebt man die Prüfdateien,
zeigt jede dieser Angaben ins Leere — und der Zusammenhang zwischen „das ist geprüft" und
„das prüft es" ist genau das, worauf die Abnahme steht.

**3. Der Aufräumvorgang selbst wäre die größte Kollision der Projektgeschichte.**
Ein Umzug dieser Größe fasst hunderte Dateien gleichzeitig an. Jede parallele Arbeit an
diesem Projekt läuft in denselben Zeitraum hinein und muss danach von Hand
zusammengeführt werden. Der Nutzen — „es sieht aufgeräumter aus" — steht dazu in keinem
Verhältnis.

**4. Es gibt bereits eine Ordnung, sie steht nur nicht in Ordnernamen.**
Die Endung sagt die Art (`-model.mjs`, `-ui.mjs`, `-kontext.mjs`), und der Kopfkommentar
in der ersten Zeile sagt den Zweck. Zwei Wächter halten das aufrecht:
`betrieb/waechter/ort.mjs` und `betrieb/waechter/kopfkommentar.mjs`. Beide lesen ihre
Ordner **rekursiv** — sie funktionieren also unverändert weiter, sobald es doch einmal
Unterordner gibt.

## Der Auslöser für später

Diese Entscheidung gilt nicht für immer. Sie wird neu verhandelt, wenn eines von beidem
eintritt:

- **`app/src/` erreicht rund 150 Dateien.** Ab dieser Größenordnung trägt eine reine
  Endungs-Konvention nicht mehr: Man findet die richtige Datei nicht mehr, indem man die
  Liste überfliegt. (Heute: 92.)
- **Die Zahl der fest eingetippten `../src/`-Pfade sinkt deutlich** — etwa weil Tests
  ihre Module über einen gemeinsamen Einstieg beziehen statt über den Dateipfad. Dann
  fällt der teuerste Posten oben weg, und der Umzug wird bezahlbar.

Wer dann umsortiert, tut es als **eigenes Vorhaben** mit eigener Mappe unter
`betrieb/vorhaben/`, nicht nebenbei.
