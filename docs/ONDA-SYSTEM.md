# Onda — das ganze System erklärt

Stand: 31. Juli 2026 · Etappe A abgeschlossen · Teststand frisch messen: `cd app && npm test`

Dieses Dokument beschreibt Onda vollständig: was es ist, wie es aufgebaut ist, wie der
Agent denkt, wo deine Daten liegen, was geprüft ist und was noch fehlt. Es ist so
geschrieben, dass die ersten Kapitel ohne Programmierkenntnisse lesbar sind; die
technischen Details stehen weiter hinten.

---

## Inhalt

1. [Was Onda ist](#1-was-onda-ist)
2. [Die Grundhaltung](#2-die-grundhaltung)
3. [Was du auf dem Bildschirm siehst](#3-was-du-auf-dem-bildschirm-siehst)
4. [Wie der Agent arbeitet](#4-wie-der-agent-arbeitet)
5. [Die acht Hinweisarten](#5-die-acht-hinweisarten)
6. [Die Anker-Regel — warum der Agent nichts erfinden kann](#6-die-anker-regel)
7. [Der Weg einer Anfrage](#7-der-weg-einer-anfrage)
8. [Modelle, Kosten und Bremsen](#8-modelle-kosten-und-bremsen)
9. [Wo deine Daten liegen](#9-wo-deine-daten-liegen)
10. [Sicherheit: dein API-Schlüssel](#10-sicherheit-dein-api-schlüssel)
11. [Wenn etwas nicht geht](#11-wenn-etwas-nicht-geht)
12. [Landkarte: welche Datei macht was](#12-landkarte-welche-datei-macht-was)
13. [Wie Qualität gesichert wird](#13-wie-qualität-gesichert-wird)
14. [Betrieb: bauen, starten, prüfen](#14-betrieb-bauen-starten-prüfen)
15. [Der Weg hierher und was noch kommt](#15-der-weg-hierher-und-was-noch-kommt)
16. [Bekannte Grenzen](#16-bekannte-grenzen)

---

## 1. Was Onda ist

Onda ist ein persönliches Schreibwerkzeug, das vollständig auf deinem Rechner läuft.
Es besteht aus zwei Teilen, die dasselbe Programm sind:

- eine **Mac-App** (`Onda.app`) — ein natives Fenster, in dem die Oberfläche läuft
- eine **Weboberfläche** — dieselben Dateien, im Browser aufrufbar (für Entwicklung und Tests)

Der Name kommt von *onda*, italienisch und spanisch für **Welle** — dieselbe Idee wie das
Icon: eine ruhige Bewegung, kein Alarm.

Onda ist kein Textgenerator. Es schreibt deinen Text nicht für dich und ändert ihn nie von
sich aus. Es ist ein aufmerksamer Mitleser, der dir sagt, was ihm auffällt — und die
Entscheidung immer bei dir lässt.

**Was heute funktioniert:**

- Schreiben mit einem ruhigen Editor (Überschriften, Absätze, Listen, Zitate, Suche, Export)
- Projekte und Texte verwalten, inklusive Papierkorb mit 30-Tage-Frist
- Ein Gespräch, in dem der Agent versteht, woran du arbeitest
- Echte Hinweise zu deinem echten Text, mit Begründung
- Hinweise annehmen, in eigener Fassung übernehmen oder verwerfen
- Bei Wahrhaftigkeitsfragen: ein bewusstes „Risiko annehmen" mit Begründung
- Ein sichtbarer Verlauf aller deiner Entscheidungen
- Ein freier Chat mit dem Agenten über deinen Text

---

## 2. Die Grundhaltung

Onda folgt der Idee von **Calm Technology**: Technik, die in der Peripherie bleibt und
Aufmerksamkeit nur beansprucht, wenn sie wirklich gebraucht wird. Konkret heißt das:

| Prinzip | Wie es sich zeigt |
|---|---|
| **Der Text gehört dir** | Der Agent ändert nie selbst Text. Jede Änderung braucht deinen Knopfdruck. |
| **Nichts drängt sich auf** | Keine Warnfenster, kein Fokusraub. Hinweise sammeln sich leise am Rand. |
| **Ehrlich statt gefällig** | Wenn der Agent etwas nicht kann, sagt er es — statt etwas zu erfinden. |
| **Deine Entscheidung zählt** | Was du entschieden hast, kommt nicht wieder. Korrekturen sind bindend. |
| **Schreiben geht immer** | Ohne Schlüssel, ohne Netz: Schreiben, Speichern und Exportieren laufen weiter. |
| **Ruhige Sprache** | Deutsch, per Du, keine Ausrufezeichen, keine Emoji, keine Fachbegriffe aus dem Bauplan. |

Diese Haltung ist nicht nur Dekoration — sie ist an vielen Stellen im Code als Regel
festgeschrieben und wird von Tests bewacht.

---

## 3. Was du auf dem Bildschirm siehst

### Die Bibliothek

Beim Start siehst du deine **Projekte**. Ein Projekt bündelt Texte, die zusammengehören,
und trägt das gemeinsame Projektverständnis. Darin liegen die einzelnen **Texte**, mit
Suche, Sortierung, Duplizieren und Papierkorb.

### Die Schreibansicht

Hier passiert die eigentliche Arbeit. Sie hat vier Zonen:

**Links — die Seitenleiste**
- *Projektverständnis*: worum es geht, für wen, welche Wirkung — eine Karte, die du
  aufklappen und korrigieren kannst
- *Struktur*: dein Text in seinen Bausteinen; ein Punkt markiert Bausteine mit Hinweisen
- *Material*: Quellen und Belege (kommt inhaltlich erst in einer späteren Etappe)

**Mitte — dein Text**
Ein aufgeräumter Editor. Hinweise erscheinen als ruhige Karten direkt am betroffenen
Absatz, nicht als Popup.

**Rechts oben — die Aura**
Ein kleiner Kreis, der atmet, wenn der Agent gerade arbeitet, und still ist, wenn nicht.
Ein Klick öffnet das Agenten-Panel.

**Das Agenten-Panel**
Statuszeile (etwa „Agent ist offline — dein Text ist davon unberührt"), offene Hinweise,
der Chat mit dem Agenten und darunter — zusammenklappbar — dein **Entscheidungsverlauf**.

### Themen und Akzente

Hell und dunkel, dazu sechs Akzentfarben. Die Einstellungen erreichst du über das Menü in
der Seitenleiste; dort liegt auch der Bereich **KI-Anschluss** (Schlüssel, Anleitung,
Verbrauch).

---

## 4. Wie der Agent arbeitet

Der Agent tut fünf Dinge, und er tut sie in dieser Reihenfolge.

### 4.1 Er versteht das Projekt

Bei einem neuen, leeren Projekt beginnt er mit **genau einer offenen Frage** — kein
Fragebogen. Enthält der Text schon etwas (mehr als 200 Zeichen), macht er stattdessen
einen Vorschlag aus dem, was er liest, und stellt höchstens eine gebündelte Nachfrage.

Dein Verständnis besteht aus sechs Feldern: Aufgabe, Publikum, gewünschte Wirkung,
Belegmaßstab, geschützte Absichten, offene Fragen.

**Bindend:** Sobald du ein Feld selbst bearbeitest, wird es markiert („bindend") und die
KI überschreibt es nie wieder. Diese Sperre ist bewusst *fail-closed* gebaut: Wenn die
Markierung beschädigt wäre, gelten **alle** Felder als geschützt — im Zweifel gewinnt
deine Fassung.

### 4.2 Er liest deinen Text

Ein Hinweislauf startet in drei Situationen:

1. **Schreibpause** — du hörst kurz auf zu tippen
2. **Text öffnen** — wenn sich seit dem letzten Lauf etwas geändert hat
3. **Du bittest darum** — etwa „schau mal drüber" im Chat

Vor jedem Lauf prüft ein Tor fünf Dinge: Es ist nicht das Beispielprojekt, ein Schlüssel
ist hinterlegt, es läuft nicht schon ein Lauf, der Text hat sich geändert, und das
Monatsbudget ist nicht erschöpft. Fällt eine Bedingung, passiert nichts — leise.

### 4.3 Er prüft jeden Hinweis gegen deinen Text

Siehe [Kapitel 6](#6-die-anker-regel). Das ist der wichtigste Mechanismus im ganzen System.

### 4.4 Er respektiert Entschiedenes

Bevor ein Hinweis bei dir landet, wird er gegen deine bisherigen Findings **und** deine
Entscheidungen geprüft. Gleiche Textstelle plus gleiche Hinweisart heißt: schon dagewesen,
wird aussortiert. Was du abgelehnt hast, kommt nicht wieder.

### 4.5 Er spricht mit dir

Der Chat im Panel und der kleine Dialog an einer Hinweiskarte laufen beide über dasselbe
Modell und streamen die Antwort, während sie entsteht. Wird das Gespräch lang (etwa 20
Beiträge), verdichtet ein günstigeres Modell die älteren Teile zu einer Notiz, damit der
Zusammenhang erhalten bleibt, ohne dass die Kosten mitwachsen.

---

## 5. Die acht Hinweisarten

Jeder Hinweis gehört zu genau einer Art. Die ersten vier sind **Integritätsfragen** — sie
betreffen die Wahrhaftigkeit des Textes und verschwinden nicht durch bloßes Wegklicken.

| Art | Worum es geht | Integrität |
|---|---|---|
| **Fakt** | Eine Tatsachenbehauptung könnte falsch, veraltet oder ungenau sein | ja |
| **Quelle** | Eine Aussage braucht einen Beleg, oder ein Zitat ist fragwürdig | ja |
| **Methode** | Aus Daten wird mehr geschlossen, als sie tragen | ja |
| **Logik** | Ein Bruch im Gedankengang, oder ein Gegenargument bleibt unbeantwortet | ja |
| **Struktur** | Aufbau, Reihenfolge oder Übergänge tragen den Gedanken nicht | nein |
| **Wirkung** | Der Text erreicht beim Publikum voraussichtlich nicht die Absicht | nein |
| **Erklärung** | Ein Begriff wird für die Zielgruppe nicht ausreichend eingeführt | nein |
| **Sprache** | Wortwahl, Register oder Satzbau passen nicht zu Absicht und Publikum | nein |

**Was bei einem Integritätsthema anders ist:** Verwerfen allein genügt nicht. Onda fragt
nach einer Begründung und schreibt „Risiko bewusst angenommen" in deinen
Entscheidungsverlauf. Der Punkt verschwindet nicht einfach — du hast ihn bewusst getragen.

**Was du mit einem Hinweis tun kannst:**

| Aktion | Wirkung |
|---|---|
| **Annehmen** | Der Vorschlag ersetzt die Textstelle wortgleich |
| **Eigene Fassung** | Du schreibst selbst — der Hinweis gilt als erledigt |
| **Verwerfen** | Weg. Bei Integritätsfragen mit Begründung. |

Pro Durchgang kommen höchstens drei neue Hinweise, und wenn mehrere Beobachtungen dieselbe
Wurzel haben, benennt der Agent die Wurzel statt jedes Symptom.

---

## 6. Die Anker-Regel

Das ist der Kern, der Onda von einem plaudernden Assistenten unterscheidet.

**Jeder Hinweis muss ein wörtliches Zitat aus deinem Text mitbringen** — den *Anker*.
Bevor ein Hinweis dich erreicht, sucht Onda dieses Zitat in deinem Dokument:

1. **Exakt gefunden?** → Hinweis gilt.
2. **Nach Normalisierung gefunden?** (Leerraum zusammengefasst, typografische und gerade
   Anführungszeichen gleichgesetzt) → Hinweis gilt, und als Textstelle wird der **echte
   Wortlaut aus deinem Dokument** übernommen, nicht die Schreibweise des Modells.
3. **Nicht gefunden?** → **Der Hinweis wird verworfen.** Still, mit einem Zähler im
   Lauf-Protokoll. Es wird nicht geraten, nicht „ungefähr" platziert, nichts erfunden.

Dasselbe gilt für Ersetzungsvorschläge: Der Agent darf nur dann „ersetze X durch Y"
vorschlagen, wenn X **wörtlich** im Anker vorkommt. Sonst wird der Hinweis zur reinen
Notiz ohne Übernehmen-Knopf.

Damit kann der Agent strukturell nichts über deinen Text behaupten, was nicht darin steht.

---

## 7. Der Weg einer Anfrage

Was passiert technisch, wenn der Agent arbeitet:

```
Auslöser (Pause / Öffnen / deine Bitte / dein Chat)
        │
        ▼
  Tor: Beispielprojekt? Schlüssel? Lauf aktiv? Text geändert? Budget?
        │  (eine Sperre wird sofort gesetzt, bevor irgendetwas wartet)
        ▼
  Kontext bauen  ──►  verstaendnis-kontext / hinweis-kontext / chat-kontext
        │              (Projektverständnis, Dokumenttext, Anweisung,
        │               offene Hinweise, deine Entscheidungen, Gesprächsverlauf)
        ▼
  Anfrage bauen  ──►  agent-tasks.mjs
        │              Modellwahl je Aufgabe · stabile Reihenfolge fürs Zwischenspeichern
        ▼
  Verteiler      ──►  agent-gateway.mjs  (runTask)
        │              ein stiller Wiederholungsversuch bei Netzproblemen
        ▼
  Transport      ──►  Mac: über die Swift-Brücke · Browser: direkt
        │
        ▼
  Antwort prüfen ──►  Abbruchgrund zuerst · Struktur prüfen · Anker verifizieren
        │
        ▼
  In die Oberfläche: Hinweiskarte / Chat-Nachricht / Verständnisfelder
        │
        ▼
  Verbrauch buchen (Tokens + geschätzte Kosten)
```

### Die fünf Aufgaben

| Aufgabe | Modell | Wofür |
|---|---|---|
| `verstaendnis` | stark | Projektverständnis aufbauen und fortschreiben |
| `hinweise` | stark | Den Text lesen und Hinweise erzeugen |
| `chat` | stark | Gespräch (gestreamt) |
| `titel` | günstig | Kurze Titel |
| `zusammenfassung` | günstig | Lange Gesprächsverläufe verdichten |

Diese Tabelle ist der **Verteiler**. Willst du später eine Aufgabe auf ein anderes Modell
legen, änderst du eine Zeile — nicht das Programm. Genau dafür wurde sie so gebaut.

---

## 8. Modelle, Kosten und Bremsen

**Verwendete Modelle:** ein starkes Modell für Verstehen, Hinweise und Chat; ein
günstiges für Titel und Verdichtung. Die genauen Modellnamen und Preise stehen an *einer*
Stelle im Code (`agent-tasks.mjs`), mit dem Hinweis, sie regelmäßig zu prüfen.

**Was die Kosten niedrig hält:**

1. **Zwischenspeichern.** Die Anfrage ist immer gleich aufgebaut: erst die feste Anweisung,
   dann das Projektverständnis, dann dein Dokument, dann erst das Veränderliche. Dieser
   vordere Teil wird beim Anbieter zwischengespeichert und kostet bei Folgeanfragen nur
   einen Bruchteil. Deshalb steht dort **nichts Wechselndes** — kein Zeitstempel, keine
   Zufallszahl. Das ist als Test festgeschrieben.
2. **Kein Lauf ohne Änderung.** Hat sich der Text nicht geändert, läuft nichts.
3. **Nie zwei gleichzeitig.** Jeder Weg setzt seine Sperre, *bevor* er anfängt zu warten.
   Diese Reihenfolge klingt nebensächlich, war aber die Ursache mehrerer teurer Fehler und
   ist heute an allen Stellen gleich gelöst und getestet.
4. **Monatsbremse.** Onda führt einen Monatsverbrauch (Tokens, geschätzte Kosten) und
   pausiert automatische Läufe, wenn dein Budget erschöpft ist. Selbst gesendete
   Nachrichten bleiben möglich.

**Die wichtigste Bremse bist trotzdem du:** Setz ein **Ausgabenlimit im Konto beim
Anbieter**. Das steht bewusst als Pflichtschritt in der Anleitung in den Einstellungen —
eine App kann sich nicht selbst zuverlässig deckeln, ein Anbieterlimit schon.

Die Verbrauchsanzeige in den Einstellungen zeigt Tokens und eine Kostenschätzung für den
laufenden Monat. Sie ist eine **Schätzung** — verbindlich ist die Abrechnung des Anbieters.

---

## 9. Wo deine Daten liegen

Alles bleibt auf deinem Rechner. Es gibt keinen Onda-Server.

| Was | Wo (Mac-App) | Wo (Browser) |
|---|---|---|
| Texte, Projekte, Hinweise, Entscheidungen, Einstellungen | `~/Library/Application Support/Onda/data.json` | Browser-Speicher unter `aiwt.v2` |
| Vorherige Fassung (Sicherung) | `…/Onda/data.backup.json` | — |
| API-Schlüssel | macOS-Schlüsselbund | Browser-Speicher unter `aiwt.apikey` (getrennt) |

**Beim Umbenennen zu Onda:** Der frühere Ordner `…/Schreibwerkzeug` wird beim ersten Start
**einmalig umbenannt** — dieselben Dateien, nur ein anderer Ordnername. Klappt das nicht
(etwa wegen Rechten), arbeitet die App einfach mit dem alten Ordner weiter, statt einen
leeren neuen anzulegen. Ein im Schlüsselbund unter dem alten Namen hinterlegter Schlüssel
wird beim ersten Lesen still übernommen.

**Selbstheilung:** Ist die Datei beim Start beschädigt, legt Onda sie beiseite
(`data.corrupt-<Zeit>.json`) und lädt die Sicherung. Gespeichert wird atomar, damit ein
Absturz mitten im Schreiben keine halbe Datei hinterlässt.

**Export:** Markdown-Export und Drucken sind jederzeit möglich — auch ohne Schlüssel und
ohne Netz. Der API-Schlüssel taucht in **keinem** Export auf; er liegt bewusst in einem
eigenen Speicher, getrennt von deinen Inhalten.

---

## 10. Sicherheit: dein API-Schlüssel

Der Schlüssel ist der einzige wirklich schützenswerte Wert im System. Deshalb:

- **Auf dem Mac verlässt er den nativen Prozess nie.** Die Weboberfläche kann ihn nicht
  lesen. Sie schickt die Anfrage *ohne* Schlüssel an die native Hülle; erst dort wird er
  aus dem Schlüsselbund eingesetzt.
- **Die native Hülle verwirft aktiv**, was die Weboberfläche an Schlüssel-Kopfzeilen
  mitschickt, und akzeptiert als Ziel **nur** die Adresse des Anbieters. Selbst wenn die
  Weboberfläche kompromittiert wäre, ginge der Schlüssel nicht woandershin.
- **Er wird nirgends protokolliert** — nicht in Logs, nicht in Fehlermeldungen, nicht in
  Exporten.
- **Im Browser** liegt er im Browser-Speicher. Das ist prinzipbedingt weniger geschützt als
  der Schlüsselbund — deshalb steht dort ein sichtbarer Hinweis. Für den Alltag ist die
  Mac-App der vorgesehene Weg.
- **Du trägst ihn selbst ein.** Weder ich noch der Agent fragen je danach.

---

## 11. Wenn etwas nicht geht

Onda hat ein festes Vokabular für Störungen, und für jede gibt es einen ruhigen deutschen
Satz statt einer Fehlermeldung:

| Situation | Was passiert |
|---|---|
| Kein Schlüssel hinterlegt | Statuszeile „Agent ist offline — dein Text ist davon unberührt" plus Knopf zu den Einstellungen |
| Kein Netz | Ruhiger Hinweis, ein automatischer zweiter Versuch |
| Zu viele Anfragen / Dienst überlastet | Hinweis mit Vermerk, dass automatisch erneut versucht wird |
| Antwort unbrauchbar | Lauf wird verworfen, nichts landet in deinem Text |
| Anfrage abgelehnt | Wird still protokolliert, kein Alarm |

**In allen Fällen gilt:** kein Warnfenster, kein Fokusraub, und Schreiben, Speichern und
Exportieren laufen unverändert weiter.

---

## 12. Landkarte: welche Datei macht was

Rund 13 000 Zeilen, aufgeteilt nach Verantwortung. Die Module ohne Oberflächenbezug sind
bewusst *rein* gehalten — dadurch sind sie einzeln testbar.

### Der KI-Anschluss

| Datei | Aufgabe |
|---|---|
| `agent-tasks.mjs` | Verteiler-Tabelle (Aufgabe → Modell), Anfrage-Aufbau, Preise, Kostenschätzung |
| `agent-prompts.mjs` | Die deutschen Anweisungstexte: Haltung, Interviewregeln, Hinweisregeln |
| `agent-gateway.mjs` | `runTask` — die zentrale Stelle: senden, prüfen, wiederholen, Verbrauch buchen |
| `agent-transport.mjs` | Die zwei Wege zum Anbieter (Brücke / direkt), Streaming-Verarbeitung |
| `agent-status.mjs` | Zustand des Agenten und die daraus abgeleiteten Statuszeilen |

### Denken und Prüfen

| Datei | Aufgabe |
|---|---|
| `anchor-verify.mjs` | Anker im Text finden; Wiederholungen aussortieren |
| `agent-findings.mjs` | KI-Hinweis in einen Hinweis der Oberfläche übersetzen |
| `hinweislauf-model.mjs` | Das Tor vor einem Lauf und die Verarbeitung der Antwort |
| `reasoning-model.mjs` | Projektverständnis, Hinweisliste, Entscheidungen, Integritätsregeln |

### Kontext-Bauer

| Datei | Aufgabe |
|---|---|
| `verstaendnis-kontext.mjs` | Kontext fürs Interview |
| `hinweis-kontext.mjs` | Kontext für einen Hinweislauf |
| `chat-kontext.mjs` | Kontext fürs Gespräch, Verdichtungsplan, Fehlertexte |

> Diese drei sehen ähnlich aus — mit Absicht. Dreimal ist an genau dieser Naht derselbe
> Fehler passiert: ein Kontext mit hübschen Feldnamen, die der Anfrage-Aufbau nie gelesen
> hat. Inhalte gingen still verloren, während alle Tests grün blieben. Heute steht die
> Begründung als Kommentar in jeder der drei Dateien, und jede hat einen Test, der die
> **ganze Kette** bis in die fertige Anfrage prüft.

### Oberfläche und Daten

| Datei | Aufgabe |
|---|---|
| `editor.js` | Start, Speichern, Export, Datenschema, Verkabelung |
| `workspace.js` | Die Schreibansicht: Panel, Hinweiskarten, Chat, Entscheidungsverlauf |
| `workspace-model.mjs` | Zustand der Schreibansicht, Gesprächsfaden |
| `ui.js` | Bibliothek, Einstellungen, Themen |
| `block-identity.js` | Stabile Textbausteine — damit ein Hinweis seine Stelle behält |
| `settings-model.mjs` | Einstellungen und Monatsverbrauch |
| `example.js`, `example-seed.mjs` | Das Demo-Projekt und seine sichere Erneuerung |
| `style.css` | Das Onda-Design: Farben, Abstände, Typografie, Bewegung |

### Mac-Hülle

| Datei | Aufgabe |
|---|---|
| `mac/main.swift` | Fenster, Menü, Datei-Speicher, Schlüsselbund, die Brücke zum Anbieter |
| `mac/icon.swift` | Erzeugt das Icon (drei Wellen) |
| `mac/build.sh` | Baut `Onda.app` |

### Nicht mehr in Gebrauch

`panels.js` und `structure.js` stammen aus der Zeit vor dem Onda-Design und werden von
nichts mehr geladen. Ein Test wacht darüber, dass sie nicht versehentlich zurückkommen.

---

## 13. Wie Qualität gesichert wird

### Vier Ebenen

1. **Unit-Tests** (`npm test`) — prüfen die reinen Module einzeln; die aktuelle Anzahl zeigt der Lauf selbst
2. **Ketten-Tests** — bauen einen Kontext und sehen in der **fertigen Anfrage** nach, ob
   die Inhalte wirklich ankommen. Diese Ebene existiert, weil die Unit-Tests dreimal einen
   Nahtstellen-Fehler durchgelassen haben.
3. **Browser-Testläufe** — steuern die echte Oberfläche fern (Klicken, Tippen, Prüfen).
   Das Netz wird dabei durch eine Attrappe ersetzt, **alles andere ist echt**: Anfrage-Aufbau,
   Anker-Prüfung, Verbrauchsbuchung, Oberfläche.
4. **Swift-Selbsttest** — prüft Speicher, Reparatur und Schlüsselbund der Mac-App

### Wie gebaut wurde

Jede Aufgabe lief nach demselben Muster: ein Umsetzer baut, ein **unabhängiger Prüfer**
liest den Unterschied gegen die Anforderung, Befunde gehen zurück in eine Korrekturrunde,
danach ein eng gefasster Nach-Review. Am Ende ein Gesamt-Review über den ganzen Zweig.

Das hat in Etappe A **zwölf echte Fehler** gefunden, die sonst still ins Produkt gewandert
wären. Die vier gewichtigsten:

1. Deine Interview-Antworten wären **nie beim Modell angekommen** — der Agent hätte
   geraten statt zugehört.
2. Ein von dir **abgelehnter Hinweis wäre wiedergekommen** — über alle acht Hinweisarten.
3. Auf dem Mac wäre **nie „offline" angezeigt** worden, weil der Statuscheck immer positiv
   antwortete.
4. Mehrere Wege hätten **teure Läufe doppelt** gestartet; ein Alltagswort wie
   „veranschaulichen" im Chat hätte einen vollen Dokumentlauf am Budget vorbei ausgelöst.

Auffällig: Die meisten davon waren *Nahtstellen*-Fehler — jeder Baustein für sich korrekt
und getestet, der Fehler lebte dazwischen.

---

## 14. Betrieb: bauen, starten, prüfen

Alle Befehle im Ordner `app/`, sofern nicht anders angegeben.

```bash
npm test          # alle Unit- und Smoke-Tests
npm run build     # Weboberfläche bündeln (dist/editor.bundle.js)
```

Mac-App bauen (im Ordner `mac/`):

```bash
./build.sh        # erzeugt Onda.app eine Ebene höher
```

Browser-Testläufe (brauchen einen lokalen Server auf Port 4173):

```bash
node test/v2-smoke.mjs
node test/etappe-a-smoke.mjs
node test/decision-log-smoke.mjs
node test/performance-smoke.mjs
```

Swift-Selbsttest ohne Fenster:

```bash
Onda.app/Contents/MacOS/Onda --selftest
```

**Nach dem Umbenennen:** Es liegt möglicherweise noch eine alte `Schreibwerkzeug.app`
herum. Die kannst du löschen — deine Daten liegen nicht darin, sondern im
Anwendungsunterstützungs-Ordner.

---

## 15. Der Weg hierher und was noch kommt

### Was fertig ist

**Fundament** — Editor, Bedienmechanik, Persistenz, Bibliothek, Onda-Design der
Schreibansicht.

**Etappe A — Der KI-Anschluss** *(abgeschlossen, geprüft)*
Der Agent war vorher vollständig Kulisse: Beispieldaten, fest einprogrammierte Antworten,
ein Timer als „Initiative". Jetzt ist alles echt — Verstehen, Hinweise, Chat, Entscheidungen.

### Was noch aussteht

| Etappe | Inhalt |
|---|---|
| **B — Belege & Recherche** | Quellenimport, Fundstellen, Belegbündel je Behauptung, Zitierprüfung, Rechercheläufe |
| **C — Gedächtnis & Argumentation** | Langzeitgedächtnis über Projekte hinweg; Aussagen- und Gegenargument-Modell |
| **D — Qualität & Abschluss** | Deutsche Sprachprüfung, Wirkung und Rhetorik, Schlussaudit, erweiterter Export |

Nebenstränge: Bibliothek im Onda-Design, sichtbare Textdateien statt einer einzelnen
Datendatei, Material-Verwaltung.

> **Hinweis zum Stand:** Für die Etappen B, C und D existieren bereits Entwürfe und
> teilweise Code auf einem eigenen Zweig (`etappe-b-belege-recherche`). Diese Arbeit ist
> **noch nicht durch die Prüfschicht gelaufen**, die Etappe A durchlaufen hat, und deshalb
> bewusst nicht Teil der Hauptlinie.

---

## 16. Bekannte Grenzen

Ehrlich benannt, statt später überrascht zu werden:

**Was Onda heute nicht kann**
- **Keine Quellensuche.** Ein Hinweis kann sagen „hier fehlt ein Beleg", aber keinen
  finden. Das Belegfenster sagt das auch so, statt Belege vorzutäuschen.
- **Kein Gedächtnis über Projekte hinweg.** Jedes Projekt steht für sich.
- **Kein Faktencheck gegen die Welt.** Der Agent kann Zweifel benennen, nicht verifizieren.
- **Keine Zusammenarbeit.** Ein Rechner, ein Mensch.

**Kleinigkeiten, die noch offen sind**
- In den Einstellungen steht nicht, **welches Modell** gerade arbeitet (im Code ist es
  verdrahtet, nur nicht angezeigt).
- Die **Bibliothek** trägt noch das alte Layout und erbt nur Farben und Schrift des
  Onda-Designs. Der Umbau wurde bewusst verschoben.
- Ein einmal als „bindend" markiertes Verständnisfeld lässt sich über die Oberfläche
  **nicht wieder freigeben** (du kannst es weiter selbst bearbeiten — nur die KI bleibt
  ausgesperrt).
- Die Kostenanzeige rechnet in **Dollar**, weil der Anbieter so abrechnet.
- Ein mitten im Streamen abgebrochener Lauf hat Tokens gekostet, wird aber im
  Monatsverbrauch **nicht** gezählt — die Bremse kann dadurch leicht überschritten werden.
- Test-Haken (`setzeTransportFuerTests`) sind auch im ausgelieferten Bündel erreichbar.
  Auf einem lokalen Einzelplatz-Werkzeug harmlos, aber sauberer wäre, sie beim Bauen zu
  entfernen.

**Was du selbst tun musst**
- **Ausgabenlimit beim Anbieter setzen** — vor dem ersten echten Lauf.
- Die **Live-Abnahme** der fünf Kriterien, die einen echten Schlüssel brauchen; die Schritte
  stehen in `docs/ABNAHME-ETAPPE-A.md`.

---

*Onda läuft auf deinem Rechner, ändert nie ungefragt deinen Text und sagt dir, wenn es
etwas nicht weiß.*
