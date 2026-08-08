# Leitstand — die Regel

Dies ist **keine Liste**. Dies ist die Regel, nach der die Liste entsteht.

## Die Regel

> **Jeder Arbeitszweig legt eine eigene Datei an: `betrieb/leitstand/<zweigname>.md`.**
> Eine Datei je Zweig. Nie eine gemeinsame Datei, in die alle hineinschreiben.

Der Dateiname ist der Zweigname, mit Schrägstrichen als Bindestrich geschrieben —
aus dem Zweig `claude/d-28fv4p` wird `betrieb/leitstand/claude-d-28fv4p.md`.
Umlaute kommen in Dateinamen nie vor; im Text darin selbstverständlich schon.

In die Datei gehört, in eigenen Worten und ohne Fachjargon:

- **Woran** dieser Zweig arbeitet, in einem Satz.
- **Was fertig ist** — und woran man das sieht (ein Befehl, den man tippen kann).
- **Was noch offen ist.**
- **Was jemand anders wissen muss**, der denselben Bereich anfasst.

## Warum eine Datei je Zweig

Zwei Gründe, und der zweite ist der eigentliche.

**Erstens:** Wenn zwei Zweige gleichzeitig in dieselbe Datei schreiben, streiten sie
sich beim Zusammenführen um dieselben Zeilen. Getrennte Dateien streiten nie.

**Zweitens — der Schadensfall.** Er steht nicht in einer Spezifikation, er steht im
Code selbst: `app/src/lauf-tor.mjs`, Zeilen 23 bis 28.

Dort ist festgehalten, was passiert ist: Ein Zweig hatte vier Stellen im Programm
aufgeräumt, die alle dieselbe Bauweise abgeschrieben hatten. Dieser Zweig lag drei
Tage fertig herum, ohne zusammengeführt zu werden. In diesen drei Tagen entstand
woanders ein **fünfter** Kanal — und schrieb dieselbe Bauweise ein fünftes Mal ab,
weil niemand sah, dass sie längst abgeschafft war.

Die Aufräumarbeit war damit nicht falsch, aber sie war zu spät sichtbar. Genau das
soll der Leitstand verhindern: **Was ein Zweig gerade abschafft, muss lesbar sein,
bevor er zusammengeführt ist.** Eine Datei je Zweig, offen im Baum, kostet nichts
und macht die Absicht sichtbar, solange sie noch etwas nützt.

## Die Wächter

Unter `betrieb/waechter/` liegen kleine Prüfprogramme. Jedes prüft eine einzige
Sache und meldet grün oder rot.

```
node betrieb/waechter/alle.mjs
```

führt **alle** aus und endet rot, sobald einer rot ist.

Ein neuer Wächter ist eine **neue Datei** in `betrieb/waechter/` — mehr nicht.
`alle.mjs` liest den Ordner samt Unterordnern und findet sie von selbst. Es gibt
keine Liste, in die man sich eintragen müsste, und darum auch keine Liste, die man
zu ergänzen vergessen kann.

Heute steht dort:

- `verweise.mjs` — prüft, dass jeder Pfad, den Katalog, Bindungen oder ein
  Kommentar nennt, wirklich existiert. Er ist der Grund, warum man Dateien
  überhaupt gefahrlos verschieben kann: Verweise verrotten sonst still.
