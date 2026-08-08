# ADR 0003 — Kein npm-Arbeitsbereich an der Wurzel

**Datum:** 8. August 2026
**Stand:** angenommen

## Worum es geht

Im Projekt gibt es zwei Pakete mit eigener Abhängigkeitsliste:

```
find . -name package.json -not -path "*/node_modules/*"
./app/package.json
./tools/figma-onda-one-page/package.json
```

npm bietet für genau diese Lage eine eingebaute Lösung an: **Arbeitsbereiche**
(`workspaces` in einer `package.json` im Wurzelverzeichnis). Sie fassen mehrere Pakete zu
einem zusammen, installieren alles mit einem Befehl und legen die gemeinsamen Pakete
**einmal im Wurzelverzeichnis** ab statt in jedem Unterordner.

Genau dieses Zusammenlegen ist hier das Problem.

## Die Entscheidung

**An der Wurzel steht keine `package.json` mit `workspaces`.**

Eine `package.json` im Wurzelverzeichnis darf es geben — aber nur als Klingelbrett: ein
paar Skripte, die weiterreichen (`npm --prefix app run test:unit` und so weiter). Ohne
`workspaces`, ohne eigene Abhängigkeiten.

## Warum — die gemessene Kette

Der Schaden ist nicht theoretisch. Er lässt sich in drei Schritten am Code nachlesen:

**Schritt 1 — Das Nebenwerkzeug greift direkt in `app/node_modules/`.**
In `tools/figma-onda-one-page/package.json` steht als Bau-Skript wörtlich:

```
"build": "../../app/node_modules/.bin/esbuild src/runtime.mjs --bundle ..."
```

Es hat kein eigenes esbuild. Es leiht sich das von `app/`, über einen ausgeschriebenen
Pfad.

**Schritt 2 — Arbeitsbereiche würden genau diesen Pfad leerräumen.**
Sobald npm die beiden Pakete als Arbeitsbereiche behandelt, wandert das gemeinsam
genutzte esbuild nach `./node_modules/.bin/esbuild` im Wurzelverzeichnis.
`app/node_modules/.bin/` steht dann leer da — und der Pfad aus Schritt 1 zeigt ins Nichts.
Der Bau des Nebenwerkzeugs bricht ab, ohne dass jemand etwas an ihm geändert hätte.

**Schritt 3 — Es trifft die einzige heute funktionierende Prüfstraße.**
Die automatische Prüfung (`.github/workflows/pruefung.yml`) arbeitet ausdrücklich in
`app/`:

```
defaults:
  run:
    working-directory: app
...
cache-dependency-path: app/package-lock.json
```

Sie erwartet dort eine vollständige Installation. Ein Umbau auf Arbeitsbereiche fasst
also nicht ein Nebenwerkzeug an, sondern die Kette, an der jeder Testlauf und jeder
Bündelbau hängt.

## Was daraus folgt

Der Preis der jetzigen Lösung ist ein ausgeschriebener Pfad quer über zwei Ordner. Der
ist hässlich, aber er ist **sichtbar**: Wer ihn liest, sieht sofort, woran das
Nebenwerkzeug hängt. Der Preis der Arbeitsbereiche wäre eine unsichtbare Umverteilung von
Dateien, die eine funktionierende Prüfstraße von außen anfasst.

Wir zahlen den sichtbaren Preis.

## Wann das neu zu verhandeln ist

Wenn `tools/figma-onda-one-page/` ein eigenes esbuild in seiner eigenen
Abhängigkeitsliste bekommt. Dann fällt der geliehene Pfad weg, und der einzige gemessene
Grund gegen Arbeitsbereiche fällt mit ihm.
