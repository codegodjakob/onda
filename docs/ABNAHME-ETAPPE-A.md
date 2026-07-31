# Abnahme Etappe A — Die KI zieht ein

Dieses Dokument prüft die zehn Abnahmekriterien aus der Spezifikation zu Etappe A
(`docs/superpowers/specs/2026-07-26-etappe-a-ki-anschluss-design.md`, Abschnitt 9) gegen
den tatsächlichen Programmcode und die tatsächlichen Testläufe — nicht gegen Annahmen.

**Geprüfter Stand:** Commit `00b485d` auf dem Zweig `etappe-a-ki-anschluss`, 30. Juli 2026.
**Wie zu lesen:** Jedes Kriterium hat einen Status. **Belegt** heißt: automatisch nachgewiesen,
ohne dass irgendjemand einen Schlüssel eintragen musste. **Braucht Live-Prüfung** heißt: das
kann nur mit einem echten Zugang zur KI geprüft werden, und die Schritte dafür stehen direkt
dabei — du führst sie selbst aus, in deinem eigenen Tempo.

**Sicherheit vorab:** An keiner Stelle dieses Dokuments wird dein Schlüssel abgefragt,
entgegengenommen oder eingetragen. Alle Schritte, die einen Schlüssel brauchen, führst du
allein in der Anwendung aus.

---

## Ergebnis auf einen Blick

| # | Kriterium | Status |
|---|---|---|
| 1 | Einrichtung | Belegt — Lücke am 31.07.2026 geschlossen |
| 2 | Verständnis | Braucht Live-Prüfung |
| 3 | Hinweise | Braucht Live-Prüfung |
| 4 | Kein erfundener Anker | Belegt |
| 5 | Chat | Braucht Live-Prüfung |
| 6 | Initiative | Braucht Live-Prüfung |
| 7 | Offline-Würde | Belegt |
| 8 | Kosten | Braucht Live-Prüfung |
| 9 | Entscheidungsverlauf | Belegt |
| 10 | Bestand | Belegt |

Fünf Kriterien sind vollständig belegt, fünf brauchen deine Live-Prüfung mit einem echten
Schlüssel. Das ist der ehrliche Zwischenstand — keines der offenen Kriterien wurde erfunden
oder schöngerechnet.

---

## Was automatisch geprüft wurde

Alles, was ohne einen echten Schlüssel prüfbar ist, wurde tatsächlich ausgeführt (nicht nur
gelesen). Hier die genauen Befehle und ihre echten Ergebnisse, aus dem Ordner `app/`:

```
npm test
```
Ergebnis: **265 Tests, alle bestanden, keiner fehlgeschlagen.**

```
npm run build
```
Ergebnis: **erfolgreich**, Programmpaket `dist/editor.bundle.js` (469,7 KB).

```
cd mac && ./build.sh
```
Ergebnis: **„BUILD OK"** — die Mac-App wurde frisch aus dem aktuellen Programmcode gebaut.

Anschließend, gegen die frisch gebaute Weboberfläche (lokaler Server auf `127.0.0.1:4173`),
vier Prüfläufe im echten Browser (Playwright), die mit einer Netz-Attrappe arbeiten — die
Attrappe ersetzt nur die Internet-Verbindung zur KI, die gesamte Programmlogik drumherum ist
echt:

```
node test/v2-smoke.mjs           → „V2 smoke passed“
node test/etappe-a-smoke.mjs     → „Etappe-A smoke passed“
node test/decision-log-smoke.mjs → „decision-log-smoke: ok“
node test/performance-smoke.mjs  → p95-Reaktionszeit 7,5 ms, keine spürbare Aussetzer
                                    während eines laufenden KI-Durchlaufs
```

Alle vier liefen ohne einen einzigen Fehler durch. Das Beispielprojekt „Calm Technology" blieb
dabei, wie es sein soll, unberührt: seine Texte sind ausdrücklich Beispieltexte, keine
Ergebnisse echter KI-Läufe.

**Ein Hinweis zur Ehrlichkeit dieses Prüfschritts:** Während dieser Abnahme wurde am selben
Programmzweig weitergearbeitet (zwei weitere, thematisch andere Commits kamen während der
Prüfung hinzu). Alle oben genannten Läufe wurden am Ende noch einmal frisch gegen den zu diesem
Zeitpunkt aktuellen Stand wiederholt, damit die Zahlen stimmen. Das betrifft aber ausschließlich
Vorarbeit für eine spätere Etappe (Quellenprüfung) und keine der zehn hier geprüften Fähigkeiten.

---

## Die zehn Kriterien im Einzelnen

### 1. Einrichtung

**Was du beobachten können solltest:** In den Einstellungen steht klar, ob ein KI-Schlüssel
hinterlegt ist oder fehlt. Es gibt ein Feld, um deinen eigenen Schlüssel einzutragen, sowie
eine aufklappbare Schritt-für-Schritt-Anleitung, die ausdrücklich ein Ausgabenlimit beim
Anbieter verlangt. Außerdem sollte sichtbar sein, welches KI-Modell verwendet wird, und der
Verbrauch dieses Monats sollte bei null stehen, solange noch nichts gelaufen ist.

**Status: Belegt — die zuvor gefundene Lücke ist geschlossen (31.07.2026).**

**Belegt** (direkt in der laufenden Anwendung geprüft, ganz ohne Schlüssel): Die Einstellungen
(„KI-Anschluss", erreichbar über den Knopf „KI-Anschluss einrichten" in der Seitenleiste oder
„Einstellungen öffnen" im Agenten-Feld) zeigen tatsächlich: Status „Fehlt", Ablageort „dieser
Browser (Entwicklungsweg)", ein Eingabefeld für den Schlüssel, einen Sicherheitshinweis, eine
aufklappbare Anleitung mit den vier Schritten „Konto anlegen", „API-Schlüssel erzeugen",
„Ausgabenlimit setzen (Pflichtschritt — schützt vor unerwarteten Kosten)", „Schlüssel eintragen
und speichern" — und der Verbrauch zeigt „Diesen Monat noch keine Läufe.", also genau den
erwarteten Nullzustand. (Beleg: `app/src/workspace.js:1050–1144`, live nachvollzogen im
laufenden Programm.)

**Die Lücke war:** Eine Anzeige, welches der beiden KI-Modelle verwendet wird, gab es in dieser
Ansicht nicht — die Modelle standen nur im Programmcode.

**Geschlossen am 31.07.2026:** Der Einstellungsdialog hat jetzt einen Abschnitt „Modelle"
zwischen Anleitung und Verbrauch, der zeigt:

| Modell | Aufgaben |
|---|---|
| `claude-opus-5` | Projekt verstehen · Hinweise zum Text · Gespräch |
| `claude-haiku-4-5` | Titelvorschlag · Zusammenfassung |

Dazu der Satz: „Onda wählt das Modell je Aufgabe selbst: das starke für Denkarbeit, das
schnelle für Routine. Das hält die Kosten niedrig."

Die Anzeige wird zur Laufzeit aus `TASK_TABLE` und `MODELLE` (`app/src/agent-tasks.mjs`)
abgeleitet — sie kann also nicht veralten, wenn sich die Verteilung ändert. Live in der
laufenden Anwendung nachgeprüft; 446 Tests grün.
(Beleg: `app/src/workspace.js` — `renderKiModelle`.)

**Braucht noch deine Prüfung** (Mac-App, mit deinem echten Schlüssel, einmalig):
1. Öffne `Onda.app`, dann die Einstellungen über „KI-Anschluss einrichten".
2. Trage dort deinen eigenen Anthropic-Schlüssel ein und speichere ihn.
3. Der Status sollte danach auf „Hinterlegt" springen, Ablageort „macOS-Schlüsselbund".
4. Zur Kontrolle, ganz ohne dass der Wert irgendwo sichtbar wird, kannst du im Terminal
   eingeben:
   ```
   security find-generic-password -s Onda -a anthropic-api-key
   ```
   Erwartung: Es wird ein Eintrag gefunden. Dieser Befehl zeigt dir nur, *dass* etwas
   hinterlegt ist, nie den Schlüssel selbst.

Diesen Schritt führst du allein aus — der Schlüssel wird zu keinem Zeitpunkt von uns
abgefragt, entgegengenommen oder irgendwo eingetragen.

---

### 2. Verständnis

**Was du beobachten können solltest:** Wenn du ein neues Projekt anlegst, meldet sich der
Agent im Agenten-Feld mit genau **einer** Frage. Antwortest du in ein bis zwei Sätzen, füllt
sich die Projektverständnis-Karte in der Seitenleiste sichtbar mit deinen Angaben. Fügst du
stattdessen zuerst einen vorhandenen Text ein, entwirft der Agent zunächst selbst ein
Verständnis daraus und stellt danach höchstens zwei bis drei gezielte Rückfragen zu den Lücken.
Korrigierst du im Verständnis-Fenster ein Feld von Hand, muss der Agent diese Korrektur in
seiner nächsten Antwort erkennbar respektieren.

**Status: Braucht Live-Prüfung mit echtem Schlüssel.**

Die Mechanik dahinter ist bereits automatisch geprüft und belegt: genau eine feste
Eröffnungsfrage ohne Kosten, bevor die KI überhaupt gefragt wird (`app/test/etappe-a-smoke.mjs`,
Funktion `runGebündelteFrage`); bei vorhandenem Text entsteht zuerst ein Verständnis-Entwurf,
danach — nicht gleichzeitig — laufen Hinweise (`app/test/etappe-a-smoke.mjs`, Funktion
`runVerstehenVorHinweisen`); eine von dir vorgenommene Korrektur wird technisch als
„geschützt" markiert und darf von späteren KI-Antworten nie überschrieben werden
(`app/src/reasoning-model.mjs:83–153`, Test in `app/test/verstaendnis-merge.test.mjs`). Was
noch aussteht, ist der echte inhaltliche Härtetest: stellt eine wirkliche KI-Antwort sinnvolle
Fragen, und liest sie sich wie ein Vorschlag statt wie ein Verhör?

**So prüfst du es selbst** (nachdem du deinen Schlüssel eingetragen hast — siehe Kriterium 1;
bitte in einem **neuen, eigenen Projekt**, nicht im Beispielprojekt „Calm Technology": das
Beispielprojekt ist absichtlich von echten KI-Läufen ausgenommen und würde sich nicht rühren):
1. Neues Projekt anlegen, neuen Text öffnen. Im Agenten-Feld sollte sofort eine einzelne Frage
   erscheinen.
2. In ein bis zwei Sätzen antworten. Beobachten, ob sich die Projektverständnis-Karte links
   sichtbar mit Angaben füllt.
3. Ein zweites neues Projekt anlegen und einen vorhandenen, längeren Text einfügen (zum
   Beispiel drei, vier Absätze, die du schon irgendwo geschrieben hast). Beobachten, ob zuerst
   ein Entwurf des Verständnisses entsteht und danach höchstens zwei bis drei Rückfragen
   kommen — nicht mehr.
4. Auf die Projektverständnis-Karte klicken, ein Feld bewusst anders formulieren, speichern.
   Danach eine weitere Antwort vom Agenten abwarten (zum Beispiel im Chat nachfragen) und
   prüfen, ob deine Korrektur darin erkennbar berücksichtigt wird, statt ignoriert zu werden.

**Worauf achten:** Der Agent soll Vorschläge machen, kein Frageformular abarbeiten — spürbar
wenige, gebündelte Fragen statt eines Verhörs.

---

### 3. Hinweise

**Was du beobachten können solltest:** Du schreibst einen Absatz mit einer bewusst
übertrieben sicheren, unbelegten Behauptung. Nach ein paar Sekunden Schreibpause erscheint am
Rand eine Karte mit einem wörtlichen Zitat aus genau dieser Stelle, dazu Kategorie,
Beobachtung, Bedeutung und Folge in eigenen Worten. „Übernehmen" ändert den Text exakt an
dieser Stelle. Ein weiterer Hinweis, den du verwirfst, taucht bei einem späteren Lauf nicht
wieder auf. Verwirfst du einen Hinweis der Art „Quelle" oder „Fakt", verlangt die Anwendung
vorher eine zusätzliche, bewusste Bestätigung.

**Status: Braucht Live-Prüfung mit echtem Schlüssel.**

Die Mechanik ist streng geprüft: Ein wörtliches Zitat wird exakt, mit vertauschten
Anführungszeichen oder überflüssigen Leerzeichen gefunden — oder, wenn es im Text schlicht
nicht existiert, leise verworfen, nie als Hinweis angezeigt (`app/test/anchor-verify.test.mjs`,
vier Tests, alle bestanden). Das wird nicht nur behauptet, sondern vorgeführt: Ein Testlauf
schickt der Anwendung absichtlich zwei KI-Hinweise, von denen einer ein frei erfundenes Zitat
trägt (`app/evals/fixtures/etappe-a-transport.mjs:29–38`, wörtlich: „DIESE FUNDSTELLE EXISTIERT
NICHT IM TEXT") — und die Anwendung zeigt danach nachweislich nur den echten Hinweis an, der
erfundene wird gezählt und verworfen (`app/test/etappe-a-smoke.mjs:151–152`). Auch die
Wiederholungssperre für bereits verworfene Hinweise ist geprüft
(`app/test/anchor-verify.test.mjs:60–71`). Was noch aussteht: Ob ein wirklicher KI-Lauf
inhaltlich sinnvolle, gut begründete Hinweise auf echte Textstellen findet.

**So prüfst du es selbst** (im selben eigenen Projekt wie bei Kriterium 2, nicht im
Beispielprojekt):
1. Einen Absatz mit einer bewusst großspurigen, unbelegten Behauptung schreiben, zum Beispiel:
   „Studien zeigen eindeutig, dass diese Methode in jedem Fall funktioniert." Absatz mit Enter
   abschließen.
2. Etwa drei bis fünf Sekunden nicht weitertippen. Am Rand sollte eine Karte mit einem
   wörtlichen Zitat aus genau diesem Satz erscheinen, dazu Kategorie, Beobachtung, Bedeutung
   und Folge.
3. „Übernehmen" anklicken und prüfen, ob sich der Text exakt an der zitierten Stelle ändert —
   und sonst nirgends.
4. Einen weiteren Hinweis über „Verwerfen" ablehnen; bei einem Hinweis der Kategorie Quelle
   oder Fakt sollte vorher eine zusätzliche Bestätigung („Wissenschaftliches Risiko bewusst
   annehmen") verlangt werden. Danach einen neuen Lauf abwarten (weiterschreiben, kurz pausieren)
   und prüfen, dass der verworfene Hinweis nicht zurückkommt.

**Worauf achten:** Der Text darf sich nur an der Stelle ändern, die du bewusst übernommen hast
— nirgends sonst.

---

### 4. Kein erfundener Anker

**Was du beobachten können solltest:** Liefert die KI ein Zitat, das im Text gar nicht
vorkommt, darf daraus niemals ein sichtbarer Hinweis werden.

**Status: Belegt.**

- `app/test/anchor-verify.test.mjs` (vier Tests, alle bestanden): exaktes Zitat wird gefunden;
  ein Zitat mit anderem Leerraum oder anderen Anführungszeichen wird normalisiert trotzdem
  gefunden; ein leeres, kaputtes oder frei erfundenes Zitat wird zuverlässig verworfen.
- `app/test/etappe-a-smoke.mjs:151–152` (Teil des grünen Laufs `node test/etappe-a-smoke.mjs`):
  Ein echter Programmlauf bekommt zwei KI-Hinweise vorgesetzt, einer davon mit einem
  vollständig erfundenen Zitat (`app/evals/fixtures/etappe-a-transport.mjs:29–38`). Ergebnis:
  genau ein sichtbarer Hinweis entsteht, der erfundene wird gezählt und verworfen
  (`workspace.hinweislauf.verworfen === 1`).

Dieses Kriterium ist ohne Einschränkung erfüllt.

---

### 5. Chat

**Was du beobachten können solltest:** Du stellst im Textfeld des Agenten-Feldes eine Frage zu
deinem eigenen Text. Die Antwort baut sich sichtbar Wort für Wort auf und bezieht sich
nachweislich auf deinen tatsächlichen Text — nicht auf etwas Allgemeines. Dein Text im Editor
bleibt dabei unverändert.

**Status: Braucht Live-Prüfung mit echtem Schlüssel.**

Die Übertragungstechnik dahinter ist ausführlich geprüft: einlaufende Textstückchen werden in
der richtigen Reihenfolge zusammengesetzt, auch wenn sie mitten im Wort über zwei
Netzwerkpakete zerreißen (`app/test/agent-transport.test.mjs:11–48`); der Chat-Kontext, der an
die KI geht, enthält verlässlich deinen Dokumenttext, offene Hinweise und den
Entscheidungsverlauf (`app/src/chat-kontext.mjs`, geprüft in `app/test/chat-kontext.test.mjs`);
die letzte Nachricht im Gespräch ist immer eine Frage von dir, nie eine erfundene
Antwort-Fortsetzung (`app/test/agent-gateway.test.mjs:141–159`). Der Agent besitzt technisch
keine Möglichkeit, deinen Editor-Inhalt zu verändern — er kann nur lesen und antworten. Was
noch aussteht: Ob eine wirkliche Antwort erkennbar auf deinen Text eingeht statt allgemein zu
bleiben.

**So prüfst du es selbst:**
1. In deinem eigenen Testprojekt (siehe Kriterium 2) eine konkrete Frage zu deinem Text in das
   Gesprächsfeld eintragen, zum Beispiel „Welches Argument ist im zweiten Absatz am
   schwächsten?".
2. Beobachten, ob die Antwort sichtbar Wort für Wort erscheint (nicht auf einen Schlag) und ob
   sie sich erkennbar auf den tatsächlichen Inhalt deines Textes bezieht.
3. Danach den Editor-Inhalt mit dem Stand vor der Frage vergleichen — er sollte unverändert
   sein.

**Worauf achten:** Die Antwort sollte etwas benennen, das wirklich in deinem Text steht, nicht
allgemein über das Thema reden.

---

### 6. Initiative

**Was du beobachten können solltest:** Findet ein Lauf einen grundlegenden Hinweis (eine
sogenannte Grundursache — ein Hinweis, dessen Klärung mehrere andere Hinweise mit erledigt),
erscheint ein kleiner Punkt am runden Agenten-Knopf. Er drängt sich nie auf: Während du tippst,
gerade den Text wechselst oder in ein anderes Programm schaust, öffnet sich nichts von selbst.
Ein „Verwerfen" bleibt wie gewohnt endgültig für diese eine Meldung.

**Status: Braucht Live-Prüfung mit echtem Schlüssel.**

Die Regeln, die verhindern, dass sich das Agenten-Feld aufdrängt, sind ausführlich geprüft
(`app/test/v2-smoke.mjs`, Funktion `runTask6InitiativeAndLifecycle`, Teil des grünen Laufs
`node test/v2-smoke.mjs`): kein automatisches Öffnen während du tippst, kurz nach einem
Dokumentwechsel, während das Fenster im Hintergrund ist, oder während du gerade in einer
IME-Komposition (z. B. bei ostasiatischer Zeicheneingabe) mittendrin bist. Auch die Regel, wann
der Punkt erscheinen soll (`hasUnseenInitiative`), ist mit eigenen Tests belegt
(`app/test/workspace-model.test.mjs`). Seit Commit `eb432b0` entsteht diese Meldung
tatsächlich aus einem echten Lauf, nicht mehr aus einer Attrappe
(`app/src/workspace.js:3145`, Funktion `ergaenzeEchteInitiative`). Was noch aussteht: Der
tatsächliche Anblick — dass ein echter Lauf wirklich einen begründeten Grundursache-Hinweis
liefert und der Punkt dafür erscheint.

**So prüfst du es selbst:**
1. Im Testprojekt ein bis zwei Hinweisläufe abwarten (siehe Kriterium 3).
2. Findet der Agent einen grundlegenden Hinweis, sollte am runden Agenten-Knopf ein kleiner
   Punkt erscheinen.
3. Während du weiterschreibst oder kurz in ein anderes Programm wechselst, sollte sich das
   Agenten-Feld nicht von selbst öffnen.
4. Die Meldung über das Kreuz schließen (Dismiss) und prüfen, dass sie nicht zurückkommt.

**Worauf achten:** Der Punkt darf auffallen, aber nie den Schreibfluss unterbrechen.

---

### 7. Offline-Würde

**Was du beobachten können solltest:** Ohne Schlüssel oder ohne Internet bleibt alles andere
voll nutzbar. Statt eines Alarms oder eines aufpoppenden Fensters steht im Agenten-Feld nur
eine ruhige Zeile.

**Status: Belegt.**

- Die genaue Zeile „Agent ist offline — dein Text ist davon unberührt." samt Verhalten (kein
  Alarm-Ton, ein einfacher Knopf zu den Einstellungen, kein Vollbild-Fenster) ist mit sieben
  eigenen Tests belegt (`app/test/agent-status.test.mjs`, geprüfter Quellcode
  `app/src/agent-status.mjs:26–50`).
- Live im laufenden Programm nachvollzogen (ohne jeden Schlüssel): Genau dieser Satz erscheint
  im Agenten-Feld, ohne dass sich ein Fenster über den Text legt; ein Knopf „Einstellungen
  öffnen" führt direkt zur Einrichtung.
- Der überwiegende Teil der automatischen Oberflächenprüfung (`node test/v2-smoke.mjs`, unter
  anderem die Funktionen `runDesktop`, `runSaveAlert`, `runPrintLayout`,
  `runBlockIdentityRegressions`) läuft grundsätzlich **ohne** hinterlegten Schlüssel, also im
  Offline-Zustand — und genau dort werden Tippen, automatisches Speichern (`runSaveAlert`) und
  die Druckansicht (`runPrintLayout`) ausführlich geprüft. Alle bestehen. Das zeigt: Schreiben,
  Speichern und Export sind vom Online-Status der KI vollständig unabhängig.

**Zusätzlich, wenn du möchtest** (kein Schlüssel nötig, nur ein kurzer eigener Blick): In der
Mac-App das WLAN kurz trennen und beobachten, ob dieselbe ruhige Zeile erscheint. Dieser
Schritt prüft denselben Programmcode über einen anderen Übertragungsweg — er gilt als
zusätzliche Bestätigung, nicht als Voraussetzung für den Status „Belegt".

---

### 8. Kosten

**Was du beobachten können solltest:** In den Einstellungen liest du den Verbrauch vor und
nach zwei, drei KI-Läufen ab. Tokens (das sind die Text-Einheiten, in denen die Abrechnung
gezählt wird) und die geschätzte Kostenanzeige in Euro/Dollar steigen sichtbar. Läufst du im
selben Text mehrfach hintereinander, sollte die Zeile „Aus dem Zwischenspeicher gelesen" einen
Wert über null zeigen — das ist der Beleg, dass die Anwendung wiederkehrende Textteile nicht
jedes Mal neu (und damit teurer) an die KI schickt.

**Status: Braucht Live-Prüfung mit echtem Schlüssel.**

Die Zähl- und Anzeigemechanik ist gründlich geprüft: Verbrauch wird nach jedem Lauf addiert,
nicht überschrieben, und beim Monatswechsel korrekt zurückgesetzt
(`app/test/settings-model.test.mjs:52–104`); die Kostenschätzung samt Zwischenspeicher-Zahlen
kommt direkt aus der Antwort der KI (`app/src/agent-tasks.mjs:158`, `app/src/settings-model.mjs:76`);
die Prompt-Reihenfolge, die den Zwischenspeicher überhaupt erst wirksam macht (System davor,
Dokumenttext im stabilen Teil, wechselnde Anfrage danach), ist als eigener Vertrag geprüft
(`app/src/agent-tasks.mjs:97–137`). In der Live-Ansicht (ohne Schlüssel geprüft) zeigt die
Verbrauchsanzeige korrekt „Diesen Monat noch keine Läufe." als Ausgangszustand. Was nur mit
einem echten Lauf zu sehen ist: dass die Zahlen bei echter Nutzung tatsächlich steigen und der
Zwischenspeicher wirklich greift.

**So prüfst du es selbst:**
1. In den Einstellungen den Verbrauch notieren (Ausgangswert, sollte „noch keine Läufe" sein).
2. Zwei, drei KI-Läufe im selben Text auslösen (zum Beispiel zwei, drei Fragen im Chat, ohne
   den Text dazwischen zu verändern).
3. Erneut in die Einstellungen schauen: Tokens und die geschätzte Kostenanzeige sollten
   gestiegen sein.
4. Auf die Zeile „Aus dem Zwischenspeicher gelesen" achten — ab dem zweiten Lauf im selben Text
   sollte dort eine Zahl über null stehen.

**Worauf achten:** Die Kostenanzeige in der Anwendung ist eine Schätzung nach Preisstand
07/2026 — verbindlich ist immer die Abrechnung direkt in deinem Anthropic-Konto. Das im
Anbieter-Konto gesetzte Ausgabenlimit (siehe Kriterium 1) bleibt dein eigentlicher Schutz vor
einer Überraschung.

---

### 9. Entscheidungsverlauf

**Was du beobachten können solltest:** Im Agenten-Feld gibt es einen aufklappbaren
Entscheidungsverlauf. Dort stehen angenommene Vorschläge, eigene Fassungen, Verwerfungen und
bewusst angenommene Risiken — jeweils mit Zeitpunkt, betroffenem Hinweis, dem tatsächlichen
Ergebnis-Wortlaut und, falls vorhanden, deiner Begründung.

**Status: Belegt.**

`node test/decision-log-smoke.mjs` (grün, „decision-log-smoke: ok") stellt gezielt alle vier
Entscheidungsarten her — angenommen, eigene Fassung übernommen, verworfen, Risiko bewusst
angenommen — und prüft, dass jede davon mit Zeitangabe, betroffenem Hinweis, Ergebnis-Wortlaut
und (bei der Risikoentscheidung) der Begründung angezeigt wird; anschließend wird die Seite neu
geladen, und alle vier Einträge samt aufgeklapptem Zustand bleiben erhalten
(`app/test/decision-log-smoke.mjs:125–142`). Ein selbst erzeugter Screenshot desselben Ablaufs
zeigt dieselben vier Einträge sichtbar im Agenten-Feld, inklusive der Formulierungen
„Risiko bewusst angenommen", „Verworfen", „Eigene Fassung übernommen" und „Angenommen".

Ein kleiner Hinweis zur Genauigkeit: In der ursprünglichen Aufgabenbeschreibung war von einer
automatisch erzeugten Bild-Datei mit einem bestimmten Namen die Rede. Diese Datei entsteht beim
tatsächlichen Prüflauf nicht automatisch — der echte, ebenso aussagekräftige Beleg ist der oben
genannte grüne Testlauf, ergänzt um einen von Hand erzeugten Screenshot zur Anschauung.

---

### 10. Bestand

**Was du beobachten können solltest:** Die bestehende Prüfsammlung bleibt vollständig grün,
das Beispielprojekt bleibt klar als Beispiel erkennbar, und die Mac-App lässt sich frisch aus
dem aktuellen Programmcode bauen und startet danach normal mit deinen vorhandenen Daten.

**Status: Belegt.**

- `npm test`: **265 von 265 Tests bestanden**, keiner fehlgeschlagen (siehe Abschnitt „Was
  automatisch geprüft wurde" oben für den genauen Befehl).
- Das Beispielprojekt „Calm Technology" bleibt eindeutig markiert (`exampleSeed`/`exampleSeedKey`
  in `app/src/example-seed.mjs`) und trägt weiterhin seine charakteristische Schlussformel
  „volle Kraft, leise Präsentation" (`app/src/example.js:232`) — die automatische Prüfung
  bricht ab, falls diese Formel je verschwinden sollte (`app/test/v2-smoke.mjs:36`). Die vier
  Tests in `app/test/example-seed.test.mjs` sichern zusätzlich ab, dass ein Versions-Wechsel
  echte eigene Texte im Beispielprojekt nie überschreibt.
- `cd mac && ./build.sh`: **„BUILD OK"** — Exit-Code 0, frisch aus dem heutigen Programmcode
  gebaut.

**Ein kurzer, eigener Blick genügt** (kein Schlüssel nötig): `Onda.app` einmal
öffnen und prüfen, dass sie normal mit deinen vorhandenen Projekten startet und die
Einstellungen den Schlüssel-Status anzeigen (auch wenn er noch „Fehlt" zeigt, zählt das als
„die Brücke antwortet"). Das ist ein einfacher Blick, kein aufwendiger Test — die eigentliche
Bau- und Datenprobe ist bereits oben belegt.

---

## Grenzen dieser Etappe

Damit klar ist, was „Die KI zieht ein" **nicht** bedeutet:

- **Echte Quellensuche gibt es noch nicht.** Die Anwendung kann heute schon benennen, *dass*
  ein Beleg fehlt (Kategorien „Quelle" und „Fakt" bei den Hinweisen), aber sie sucht noch keine
  echten Fundstellen im Internet und erstellt keine Belegbündel. Das kommt erst in der
  nächsten Etappe. Quellenangaben im Beispielprojekt sind ausdrücklich Beispieldaten, keine
  echte Recherche.
- **Kein Langzeitgedächtnis.** Der Agent kennt nur das aktuelle Projekt und den aktuellen
  Verlauf — er merkt sich nichts projektübergreifend und führt noch kein Modell von Aussagen
  und Gegenargumenten.
- **Keine Sprach-, Wirkungs- oder Stil-Prüfstufen, kein Schlussaudit.** Diese zusätzlichen
  Prüfschichten sowie ein erweiterter Export und ein Autorschaftsnachweis sind für spätere
  Etappen vorgesehen.
- **Das Modell ist fest hinterlegt, nicht wählbar.** Für sichtbare Aufgaben (Verständnis,
  Hinweise, Chat) wird bewusst immer dasselbe starke Modell verwendet, für unsichtbare
  Routinearbeiten ein schnelleres, günstigeres — beides ist eine bewusste, einfache
  Entscheidung für den Anfang, keine Auswahl-Möglichkeit für dich. Eine spätere Erweiterung ist
  vorbereitet, aber nicht gebaut.
- **Kein zweiter, gegenprüfender KI-Durchlauf.** Die Anwendung nutzt bewusst einen einzelnen
  Agenten statt mehrerer sich gegenseitig prüfender KI-Instanzen — das war eine bewusste
  Entscheidung, keine offene Baustelle.

## Bekannte kleine offene Punkte

- **Eine Korrektur im Verständnis-Fenster lässt sich nicht wieder zurücknehmen.** Sobald du ein
  Feld von Hand korrigierst, ist es dauerhaft vor Überschreiben durch die KI geschützt — eine
  Möglichkeit, diesen Schutz für ein Feld wieder aufzuheben, gibt es in der Oberfläche derzeit
  nicht. Falls sich das als störend herausstellt, lässt sich das gezielt nachrüsten.
- **Die Anzeige „geschützt" im Verständnis-Fenster aktualisiert sich nicht während des
  Tippens**, sondern erst, wenn das Fenster neu geöffnet wird oder eine neue Agenten-Antwort
  eintrifft. Das ist bewusst so gebaut, damit dir beim Tippen nicht der Cursor wegspringt — kein
  Fehler, aber erwähnenswert.

---

*Erstellt als Abschluss-Beleg der Etappe A. Fünf Kriterien warten auf deine eigene Live-Prüfung
mit deinem Schlüssel — die Schritte dafür stehen jeweils direkt beim Kriterium.*
