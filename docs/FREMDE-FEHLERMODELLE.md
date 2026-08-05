# Fremde Fehlermodelle: drei Prüfungen und ihre Befunde

Umsetzung von Issue [#17](https://github.com/codegodjakob/onda/issues/17)
(Befund 4 der Systemanalyse 2026-08-04). Der Kern des Befunds: Jede
Schutzschicht in Onda entstand bisher nach genau dem Fehler, den sie prüft.
Prüfungen, die nur aus eigenen vergangenen Fehlern destilliert sind, sind
gegen die nächste, andersartige Störung per Konstruktion blind. Darum hier
drei Prüfungen, deren Fehlerbilder von außen kommen — keins davon ist in
Onda je passiert.

Alle drei laufen im normalen Testlauf (`cd app && npm test`). Die
Zwei-Fenster-Prüfung braucht das gebaute Bundle (`npm run build` vorher).

## Prüfung 1 · Netzabriss mitten im SSE-Stream

**Datei:** `app/test/netzabriss-stream.test.mjs`
**Fehlerbild:** Der Router kippt weg, während die Antwort schon streamt —
nicht vorher. Alle bisherigen Netz-Tests rissen die Verbindung *vor* der
Antwort ab.

**Beim ersten Lauf gefunden (beides behoben):**

1. **Der Kostenzähler log zu niedrig.** Die API meldet den Verbrauch
   (input_tokens) gleich am Stream-Anfang; riss die Verbindung danach ab,
   wurde dieser bezahlte Verbrauch nirgends gezählt. Jetzt reist er im
   offline-Fehler mit (`agent-transport.mjs`, beide Transportwege), und der
   Verteiler verbucht ihn vor der stillen Wiederholung
   (`agent-gateway.mjs`). Der Grundsatz „Verbrauch IMMER zählen" gilt damit
   auch für abgerissene Läufe.
2. **Doppelter Text bei der stillen Wiederholung.** Wiederholte der
   Verteiler einen abgerissenen Stream-Lauf, klebten die Deltas des zweiten
   Versuchs hinter denen des ersten — im Chat stand der Antwortanfang
   doppelt, bis das Endergebnis ihn ersetzte. Jetzt meldet der Verteiler den
   Neustart (`onNeustart`), und der Chat leert seinen Puffer
   (`workspace.js`).

Außerdem festgeschrieben (war schon richtig): ein abgerissener Lauf gilt nie
als fertig, und eine mitten in der SSE-Zeile zerrissene Nachricht sickert
weder durch noch wirft sie den Parser.

## Prüfung 2 · Zwei Fenster auf demselben Dokument

**Datei:** `app/test/zwei-fenster.test.mjs`
**Fehlerbild:** Onda ist als Ein-Fenster-App gedacht — aber nichts hindert
einen zweiten Tab.

**Beim ersten Lauf gefunden (dokumentiert, bewusst nicht behoben):**
Der gesamte Zustand wird als ein Block gespeichert, und kein Fenster hört
auf Änderungen des anderen. Drei Stufen desselben Problems:

1. Fenster B erfährt nie, was Fenster A schreibt.
2. Speichert B, gewinnt der letzte Schreiber — A's Satz ist still weg.
3. Schärfer, als die Prüfung selbst vorhergesagt hatte: beim Verlassen der
   Seite speichert jedes Fenster per `beforeunload` noch einmal seinen
   ganzen alten Stand. **Schon das Neuladen oder Schließen eines
   vergessenen zweiten Tabs überschreibt alles, was seither irgendwo
   gespeichert wurde.** Kein Absturz, kein kaputtes JSON — nur lautloser
   Textverlust.

Die Prüfung schreibt dieses Verhalten als Beobachtung fest: baut später
jemand einen Fensterabgleich oder eine Konfliktwarnung, wird sie rot und
wird dann bewusst umgeschrieben. Warum kein Fix hier: ein echter
Fensterabgleich ist ein eigenes Vorhaben mit Gestaltungsfragen (Warnung?
Sperre? Zusammenführen?), kein Nebeneffekt einer Prüf-Etappe. Es ist als
eigenes Issue erfasst und gehört in die Nähe von #19 (Datensicherheit).

## Prüfung 3 · Ein fremder, unordentlicher Text

**Dateien:** `app/test/fremdtext-anker-momente.test.mjs`,
Fixture `app/evals/fixtures/zweiter-seed.mjs`
**Fehlerbild:** Alles hing bisher am einen, sauberen Seed „Calm Technology"
(Essay). Der zweite Seed ist ein Interview-Transkript — anderes Genre,
gesprochene Sprache mit englischen Einsprengseln, länger, und unordentlich
wie ein echter Web-Fund: gemischte Anführungszeichen, doppelte Leerzeichen,
Tabs, geschütztes Leerzeichen (U+00A0), weicher Trennstrich (U+00AD),
Nullbreite-Leerzeichen (U+200B).

**Beim ersten Lauf gefunden (behoben):** Weicher Trennstrich und
Nullbreite-Leerzeichen — unsichtbare Zeichen, die beim Kopieren aus dem Netz
regelmäßig im Text landen — ließen jeden Anker über der betroffenen Stelle
scheitern: Der Hinweis wurde verworfen, ohne dass je jemand sähe, warum.
Die Anker-Normalisierung (`anchor-verify.mjs`) übergeht diese
Darstellungszeichen jetzt, so wie sie Anführungszeichen schon
vereinheitlicht. Dazu geschlossen: ein Anker, der *nur* aus Unsichtbarem
besteht, traf vorher wörtlich auf das Artefakt im Text — jetzt findet er
nie mehr etwas.

Als Setzung festgeschrieben (kein Fehler): ein Gedankenstrich ist kein
Bindestrich. Wer „Erziehung - man wartet" zitiert, wo „Erziehung – man
wartet" steht, wird verworfen — lieber ein verlorener Hinweis als eine
geratene Textstelle. Ebenso geprüft: der Momente-Rhythmus kennt keine
Genres, Transkript-Zeichen (`]`, `:`) sind keine Satzenden, und eine
rückwärts springende Systemuhr führt nicht ins Dauer-Aufschauen.

## Die Regel dahinter

Je Etappe soll mindestens eine Prüfung dazukommen, die *nicht* aus einem
eigenen vergangenen Fehler stammt (Systemanalyse, Befund 4, Änderung). Die
drei Prüfungen hier sind der Anfang; die Rückmeldungs-Karten in
`docs/rueckmeldung/` sind die zweite angeschlossene Varietätsquelle.
