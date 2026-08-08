# Onda

Ein lokales Schreib- und Denkwerkzeug. Deutschsprachig, und es läuft vollständig auf dem
eigenen Rechner: Die Texte liegen auf der eigenen Platte, der Zugangsschlüssel für die
KI liegt im Schlüsselbund von macOS und verlässt die App nie.

Onda besteht aus zwei Teilen, die zusammengehören: einer Web-Oberfläche (`app/`) und
einer Mac-Hülle (`mac/`), die diese Oberfläche in einem eigenen Fenster zeigt.

---

## Starten

```sh
cd app
npm install        # nur beim ersten Mal
npm run dev
```

Danach im Browser öffnen: **http://127.0.0.1:4173**

`npm run dev` baut das Programmbündel und baut es bei jeder Änderung sofort neu; die
Seite lädt sich dann von allein nach.

> **Wichtig, und es ist schon einmal schiefgegangen:** Ein nackter Dateiserver, der
> Dateien nur ausliefert und nichts baut, reicht hier **nicht**. Onda lädt zur Laufzeit
> `app/dist/editor.bundle.js` — eine Datei, die es im frisch ausgecheckten Baum gar nicht
> gibt (sie steht in `.gitignore`, weil sie eine Maschine schreibt). Ohne den Bau-Schritt
> sieht man eine leere Seite und sucht den Fehler an der falschen Stelle.

## Die Mac-App bauen

```sh
cd mac
./build.sh
```

Das braucht **macOS mit Xcode** und läuft nur dort. Das Skript baut zuerst das Bündel,
lässt dann die Prüfungen laufen und bricht ab, sobald eine davon rot ist — die zuvor
gebaute App bleibt dabei unversehrt.

---

## Prüfen

Aus dem Wurzelverzeichnis, ein Befehl für alles:

```sh
npm test
```

Er startet nacheinander die Prüfungen der App und die des Figma-Werkzeugs in `tools/`.
Der Ausgang richtet sich nach der **App**; das Werkzeug in `tools/` läuft heute nur
berichtend mit und ist derzeit rot — das steht dann als eigene Zeile in der Ausgabe und
hält den App-Teil nicht auf.

Einzeln:

```sh
npm run test:app          # nur die Prüfungen der App (schnell)
npm run test:rauch        # die Rauchtests; brauchen einen Browser
npm run waechter          # die Wächter: prüfen den Prüfstand selbst
```

Oder direkt im jeweiligen Ordner:

```sh
cd app && npm run test:unit
node betrieb/waechter/alle.mjs
```

Die **Anzahl** der Prüfungen steht mit Absicht nirgends in diesem Text. Wie man sie
misst, steht in `KONVENTIONEN.md` unter „Die festgelegte Zählweise" — eine Frage, ein
Befehl, eine Zahl.

---

## Wo was liegt

Sechs Ordner, jeder mit genau einer Bedeutung:

| Ordner | Bedeutung |
|---|---|
| `app/` | Das Produkt: Oberfläche, Prüfungen, Messläufe |
| `mac/` | Die Mac-Hülle (Swift), die die Oberfläche zeigt |
| `design/` | Die Gestaltungswahrheit: Farben, Maße, Bausteine |
| `tools/` | Ein zweites, kleines Teilprojekt (Figma-Werkzeug) |
| `betrieb/` | Wie an Onda gearbeitet wird: Reviere, Vorhaben, Wächter |
| `docs/` | Das Wissen: Philosophie, Systembeschreibung, Entscheidungen |

## Weiterlesen, in dieser Reihenfolge

1. **`KONVENTIONEN.md`** — die Hausordnung. Jede Regel mit dem Wächter daneben, der sie
   erzwingt.
2. **`betrieb/REVIERE.md`** — welcher Ordner zu welcher Arbeit gehört, bevor man anfängt.
3. **`betrieb/leitstand/`** — woran gerade jemand anders arbeitet.
4. **`docs/PHILOSOPHIE.md`** — warum Onda so aussieht und sich so verhält.
