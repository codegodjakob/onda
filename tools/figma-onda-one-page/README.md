# Onda · One Page Generator

Lokales Figma-Development-Plugin für die bestehende `Page 1` der Datei `Claude Code`.

## Lokale Prüfung

```sh
node --test tools/figma-onda-one-page/test/*.test.mjs
app/node_modules/.bin/esbuild tools/figma-onda-one-page/src/runtime.mjs --bundle --format=iife --platform=browser --target=es2017 --outfile=tools/figma-onda-one-page/dist/code.js
```

## Bedienung

Das Plugin bleibt offen. Zuerst `Inspect`, danach Foundations, jede Komponente einzeln, Kernansichten, sechs Annotation-Batches, Dialoge/Nebenansichten und zuletzt Verify ausführen. Es gibt bewusst keinen Sammelknopf.

Der erste Mutationsschritt speichert den freien Canvas-Ursprung und die Anzahl vorhandener Top-Level-Nodes. Wiederholungen verwenden deterministische Namen und erzeugen keine zweite Onda-Struktur.
