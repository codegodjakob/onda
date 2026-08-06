---
artifact: acceptance-criteria
version: "1.0"
created: 2026-08-06
status: approved
---

# Onda: Live-Arbeitsmodus für das Interface

## Ziel

Onda soll während der Interface-Arbeit im eingebauten Browser unmittelbar auf Änderungen reagieren. Der schnelle Arbeitsweg bleibt vom signierten Mac-Build getrennt: Im Browser wird iteriert, an stabilen Zwischenständen wird `Onda.app` gebaut und nativ geprüft.

Die freigegebene Richtung ist Variante A: Der vorhandene esbuild-Weg wird erweitert, ohne Vite, BrowserSync oder eine andere neue Laufzeitabhängigkeit einzuführen.

## Umfang

- Ein Befehl `npm run dev` startet Build-Watcher und lokalen Vorschauserver gemeinsam.
- Die Vorschau ist unter `http://127.0.0.1:4173/` erreichbar.
- Änderungen an HTML und CSS laden die geöffnete Vorschau automatisch neu.
- Änderungen an JavaScript laden erst nach einem erfolgreichen neuen Bundle automatisch neu.
- Der Server bindet ausschließlich an `127.0.0.1` und ist nicht im lokalen Netz sichtbar.
- Die Live-Reload-Erweiterung wird nur in die ausgelieferte HTTP-Antwort eingesetzt. `app/index.html` und das native Bundle enthalten keinen Entwicklungscode.
- Der bestehende Produktionsbuild und `mac/build.sh` bleiben in ihrem Verhalten unverändert.

Nicht im Umfang sind ein öffentliches Deployment, kollaborative Mehrbenutzer-Vorschauen und ein zweites Frontend-Buildsystem.

## Aufbau

`app/scripts/dev-server.mjs` kapselt den gesamten Entwicklungsmodus:

1. esbuild erzeugt wie bisher `dist/editor.bundle.js` und beobachtet die JavaScript-Quellen.
2. Ein kleiner statischer HTTP-Server liefert ausschließlich Dateien aus `app/` mit passenden Inhaltstypen aus.
3. Beim Ausliefern von `index.html` ergänzt der Server nur im Arbeitsspeicher einen Live-Reload-Client.
4. Ein lokaler Ereigniskanal meldet erfolgreiche JavaScript-Builds sowie Änderungen an HTML und CSS an den Browser.
5. Der Browser lädt die Seite nach einer kurzen Bündelung mehrfacher Dateisignale einmal neu.

Alle Pfade werden gegen das App-Verzeichnis aufgelöst. Anfragen außerhalb dieses Verzeichnisses werden abgewiesen.

## Fehler und Erholung

- Ist Port 4173 belegt, endet der Start mit einer kurzen Meldung und einem Fehlercode; es wird nicht still auf eine unbekannte Adresse ausgewichen.
- Schlägt ein JavaScript-Build fehl, bleibt das letzte gültige Bundle sichtbar. Der Fehler steht im Terminal und es erfolgt kein Reload auf einen kaputten Stand.
- Sobald die Quelle wieder gültig ist, baut esbuild neu und die Vorschau lädt automatisch.
- Nicht vorhandene Dateien liefern 404; unzulässige Pfade liefern keine Dateien außerhalb von `app/`.
- `Ctrl-C`, `SIGINT` und `SIGTERM` schließen Server, Dateiüberwachung und esbuild-Kontext sauber.

## Prüfstrategie

- Ein isolierter Servertest startet den Entwicklungsmodus gegen ein temporäres App-Verzeichnis und einen freien Testport.
- Der Test belegt statische Auslieferung, reine Antwort-Injektion, korrekte Inhaltstypen und Pfadbegrenzung.
- Ein Ereignistest belegt Reload bei HTML/CSS sowie Reload erst nach erfolgreichem JavaScript-Build.
- Ein Fehlertest belegt, dass ein ungültiger JavaScript-Stand nicht neu geladen wird und nach Korrektur selbstständig heilt.
- Bestehende Build-, UI- und Mac-Build-Verträge bleiben grün.

## Akzeptanzkriterien

### Hauptpfad

#### AC-1: Ein Befehl öffnet den Arbeitsweg

**Gegeben** ist das Onda-Repository mit installierten Abhängigkeiten

**Wenn** `npm run dev` gestartet wird

**Dann** ist die Vorschau unter der dokumentierten lokalen Adresse erreichbar und das Terminal nennt diese Adresse eindeutig.

#### AC-2: Oberflächenänderungen erscheinen selbstständig

**Gegeben** ist eine geöffnete Live-Vorschau

**Wenn** HTML oder CSS gespeichert oder gültiges JavaScript neu gebaut wird

**Dann** zeigt der Browser den neuen Stand ohne manuelles Neuladen.

### Grenzfälle

#### AC-3: Mehrere Speichersignale erzeugen einen ruhigen Reload

**Gegeben** speichert ein Editor mehrere zusammengehörige Dateien unmittelbar nacheinander

**Wenn** die Änderungen verarbeitet werden

**Dann** wird die Vorschau gebündelt neu geladen und gerät nicht in eine Reload-Schleife.

#### AC-4: Native App bleibt frei von Entwicklungslogik

**Gegeben** wurde zuvor der Live-Arbeitsmodus verwendet

**Wenn** anschließend der normale Mac-Build entsteht

**Dann** enthält dessen `index.html` keinen Live-Reload-Client und die sichtbare Bundle-Version entspricht weiterhin dem Build-Commit.

### Fehlerzustände

#### AC-5: Belegter Port ist verständlich

**Gegeben** Port 4173 wird bereits verwendet

**Wenn** der Entwicklungsmodus gestartet wird

**Dann** endet er mit einem Fehlercode und einer Meldung, die Port und Ursache nennt.

#### AC-6: Kaputtes JavaScript zerstört die Vorschau nicht

**Gegeben** ist eine funktionierende Live-Vorschau

**Wenn** eine JavaScript-Änderung nicht gebaut werden kann

**Dann** bleibt der letzte gültige Stand sichtbar, der Fehler wird im Terminal erklärt und eine spätere Korrektur stellt den automatischen Reload wieder her.

### Nichtfunktionale Kriterien

#### AC-7: Vorschau bleibt lokal

**Gegeben** läuft der Entwicklungsmodus

**Wenn** die gebundenen Netzwerkadressen geprüft werden

**Dann** lauscht der Server ausschließlich auf `127.0.0.1`.

#### AC-8: Start und Reload bleiben schnell

**Gegeben** ist ein warmer lokaler Arbeitsstand

**Wenn** der Entwicklungsmodus startet oder eine kleine CSS-Änderung gespeichert wird

**Dann** ist die Vorschau innerhalb von zwei Sekunden erreichbar beziehungsweise aktualisiert.

## Arbeitsablauf danach

1. `npm run dev` starten und den eingebauten Browser auf `http://127.0.0.1:4173/` setzen.
2. Pro Runde genau einen Interface-Bereich bearbeiten: Bibliothek, Editor oder Anmerkungen/Overlays.
3. Nach jeder Runde Desktop, 320 Pixel und Dark Mode prüfen.
4. Erst an einem freigegebenen Zwischenstand die vollständigen UI-Evals und den signierten Mac-Build ausführen.

