# Zweig `claude/d-28fv4p`

**Woran gearbeitet wird:** Das Aufräumen der Projektstruktur (Vorhaben
`betrieb/vorhaben/2026-08-09-aufraeumen/`). Bevor irgendetwas verschoben wird,
werden Netze gespannt, die das Verschieben überhaupt erst gefahrlos machen.

**Sicherungspunkt vor allem:** Git-Marke `vor-aufraeumen-2026-08-08`.

## Was fertig ist

- **Der Leitstand selbst.** `betrieb/LEITSTAND.md` sagt die Regel: eine Datei je
  Zweig unter `betrieb/leitstand/`. Diese Datei hier ist die erste.
- **Der Wächter-Sammler.** `betrieb/waechter/alle.mjs` führt alle Wächter aus.
  Nachprüfen: `node betrieb/waechter/alle.mjs`
- **Der Verweis-Wächter.** `betrieb/waechter/verweise.mjs` prüft jeden Pfad, den
  Katalog, Bindungen oder ein Kommentar nennt.
  Nachprüfen: `node betrieb/waechter/verweise.mjs`
- **Zwei tote Verweise korrigiert.** `app/src/lauf-tor.mjs` und
  `app/src/workspace.js` nannten beide `system/LEITSTAND.md` — eine Datei, die es
  nie gab. Beide zeigen jetzt auf `betrieb/LEITSTAND.md`. Geändert wurde nur der
  Kommentartext, keine einzige Programmzeile.
  Nachprüfen: `grep -rn "system/LEITSTAND.md" app/ --include=*.js --include=*.mjs`
  findet nichts mehr.

## Was offen ist

Das eigentliche Verschieben von Dateien. Es darf erst beginnen, wenn der
Verweis-Wächter grün steht — er ist das Netz darunter.

## Was andere wissen müssen

- Wer eine Datei **verschiebt oder umbenennt**, führt danach
  `node betrieb/waechter/verweise.mjs` aus. Rot heißt: irgendwo zeigt ein Pfad
  ins Leere.
- Wer einen **neuen Wächter** braucht, legt einfach eine neue `.mjs`-Datei unter
  `betrieb/waechter/` an. Es gibt keine Liste zum Eintragen.
- Die Messlatte bleibt: `cd app && npm run test:unit` — mindestens 984 bestanden,
  keiner rot.
