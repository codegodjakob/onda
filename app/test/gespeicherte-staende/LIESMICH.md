# Gespeicherte Stände — echte Beispiele für den Ladeweg

Hier liegen alte Speicherstände von Onda: genau das, was in `localStorage['aiwt.v2']`
steht (bei der Mac-App: der Inhalt von `data.json`). Sie sind Prüfstücke, keine
Konfiguration — die App liest sie im Betrieb nie.

**Wozu.** Wenn Onda einen älteren Stand lädt, biegt es ihn auf die heutige Form
zurecht. Geht dabei etwas verloren, ist Jakobs Text weg, und zwar unwiederbringlich.
Diese Dateien sind das Netz darunter. Zwei Prüfungen ziehen sie durch:

- `app/test/gespeicherter-stand.test.mjs` — schiebt jeden Stand einzeln durch die
  Zurechtbiege-Funktionen und weist Feld für Feld nach, dass nichts fehlt.
- `app/test/gespeicherter-stand-smoke.mjs` — legt jeden Stand in den Browser-Speicher,
  startet die echte App und schaut nach, ob Texte, Projekte und Einstellungen wieder da
  sind.

Wer einen Stand ändert, ändert ein Prüfstück. Das ist erlaubt, aber es muss hier
danebenstehen, warum.

---

## `stand-schema-08.json` — Schema 8

**Woher:** von Hand gebaut. **Nicht** aus der Versionsgeschichte rekonstruierbar: die
Geschichte dieses Verzeichnisses reicht nur bis `127edb9`, und dort steht bereits
`const SCHEMA = 11` in `app/src/editor.js`. Ein Stand aus der Zeit von Schema 8 liegt
in keiner Fassung des Codes mehr vor. Er ist deshalb nach dem gebaut, was der heutige
Ladeweg an Altbestand ausdrücklich vorsieht.

**Was er absichtlich enthält:**

- gar keinen `memoryStore` und gar kein `laufJournal` — beide kamen später dazu
- eine Einstellung mit kaputtem Farbton (`accent: "neon"`, existiert nicht) und
  unmöglicher Spaltenbreite (`structWidth: 9999`) — beide müssen still repariert werden
- keine `kiMonatsbudgetCents` und keine `usage` — die Kostenbremse kam erst mit dem
  KI-Anschluss
- einen Text ohne `projectId` (`d-alt-notizen`) — der muss beim Laden ein Projekt bekommen
- eine Anmerkung ohne `kind` — aus der Zeit vor den Anmerkungsarten
- kein Beispielprojekt — der Stand stammt von jemandem, der es gelöscht hat

## `stand-schema-10.json` — Schema 10

**Woher:** von Hand gebaut, mit einem echten Stück Geschichte darin. Der Wortlaut des
Beispieltextes „Calm Technology" ist zeichengenau `buildExampleBody()` aus
`git show 127edb9:app/src/example.js` — die Fassung, die Onda bis Beispielversion 9
ausgeliefert hat. Ihre Signatur `fnv1a-1c206f0f-870` steht in
`app/src/example-seed.mjs` in `LEGACY_SEED_SIGNATURES`. Der Rest des Standes ist
gebaut, weil Schema 10 selbst nicht mehr im Code liegt (siehe oben).

**Was er absichtlich enthält:**

- einen `memoryStore` mit je einem Ereignis, einem Eintrag und einer Einwilligung, aber
  ohne die später hinzugekommenen Listen (`transfers`, `voiceProposals`, `index`)
- **kein** `laufJournal` — die Buchführung über bezahlte KI-Läufe kam erst danach
- ein Projekt mit Quellen, aber ohne Beleg-Bündel, Argumentmodell, Sprachprofil und
  Schlussaudit — alles später
- den alten Beispieltext ohne Saat-Marker (`exampleSeed*`): er darf beim Laden **nicht**
  ein zweites Mal danebengelegt, sondern muss als Beispiel wiedererkannt werden
- `settings.exampleVersion: 9` — der Versionssprung auf 10 muss beim Laden greifen

## `stand-schema-12.json` — Schema 12

**Woher:** echt, von der App selbst geschrieben. Erzeugt, indem die gebaute App im
Browser gestartet, der Speicher geleert, ein Projekt „Seminararbeit Aufmerksamkeit"
mit einem Text angelegt und `localStorage['aiwt.v2']` danach unverändert abgeschrieben
wurde. Nur die Einrückung ist hinzugefügt, damit die Datei lesbar bleibt.

**Was er enthält:** den vollständigen heutigen Umfang — drei Projekte (Standard,
Beispiel, eigenes), den Beispieltext mit allen 29 Anmerkungsarten, `memoryStore`,
`laufJournal` mit 29 bereits gezeigten Anmerkungen, und Einstellungen, die vom
Standard abweichen (`accent: "sage"`, `structWidth: 700`) — daran zeigt sich, ob eine
gesetzte Einstellung den Ladeweg übersteht.

**Kein echter Bestand von Jakob.** Die Texte sind eigens dafür geschrieben.
