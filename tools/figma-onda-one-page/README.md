# Onda · One Page Generator

Lokales Figma-Development-Plugin für die bestehende `Page 1` der Datei `Claude Code`.

## Bauen

Figma lädt nicht `src/`, sondern die daraus erzeugte Datei `dist/code.js` — nach jeder Änderung am Quelltext baut dieser eine Befehl sie neu (das Bau-Werkzeug liegt in `app/node_modules`, dieses Plugin hat bewusst keine eigenen Pakete):

```sh
cd tools/figma-onda-one-page && npm run build
```

## Lokale Prüfung

```sh
node --test tools/figma-onda-one-page/test/*.test.mjs
```

## Bedienung

Das Plugin bleibt offen. Zuerst `Inspect`, danach Foundations, jede Komponente einzeln, Kernansichten, sechs Annotation-Batches, Dialoge/Nebenansichten und zuletzt Verify ausführen. Es gibt bewusst keinen Sammelknopf.

Der erste Mutationsschritt speichert den freien Canvas-Ursprung und die Anzahl vorhandener Top-Level-Nodes. Wiederholungen verwenden deterministische Namen und erzeugen keine zweite Onda-Struktur.
