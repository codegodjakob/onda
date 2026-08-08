# Zweig-Inventur

Stand: **8. August 2026, 15:25**, gemessen gegen **lokales** `main` (`da013f2`).
Fortschreiben: neu messen, nie abschreiben. Kommandos unten in Abschnitt 5.

## Der Befund, der alles andere verschiebt

**38 Commits liegen nur auf dieser Festplatte.** Lokales `main` (`da013f2`) ist 38 Commits vor
`origin/main` (`d0866da`) und null dahinter — nichts davon ist gepusht. Darin stecken unter
anderem `da013f2` („Merge #33 Schritt 1: fünf Zweige der Einsammel-Welle") und `d6a23d7`
(„die Bausteinart erkennt die KI"), zurück bis zum 5. August.

Solange das so ist, gilt „fertig heißt auf main" nur für ein `main`, das es außerhalb dieses
Rechners nicht gibt.

**Das hat eine Reihenfolge zur Folge:** Erst `main` pushen, dann Zweig-Verweise löschen. Wer
zuerst aufräumt, löscht Verweise auf Inhalte, die dann nur noch lokal existieren.

**Und es erklärt die widersprüchlichen Inventuren.** Die Messungen vom Vormittag liefen gegen
`origin/main` und meldeten deshalb Zweige als offen, die im lokalen `main` längst drin sind —
`goofy-dirac` (+5 gegen origin, 0 gegen lokal), `einsammeln-c-bausteinarten` (+23 / 0),
`reverent-moser`, `bold-elbakyan`, `magical-haibt`. Alle fünf sind erledigt.

## 1. Die Lage in Zahlen

| | Anzahl |
|---|---|
| Lokale Zweige (ohne `main`) | 31 |
| davon **vollständig in `main`**, kein Worktree → toter Verweis | **15** |
| davon vollständig in `main`, aber ein Worktree hängt dran | 7 |
| davon mit **echter ungemergter Arbeit** | **9** |
| von diesen neun: laufende Sitzung (Commit jünger als eine Stunde) | 7 |
| von diesen neun: liegengeblieben | 2 |

## 2. Echte ungemergte Arbeit (9)

Konflikte gegen lokales `main`, mit `^KONFLIKT` gezählt (siehe Fallstrick in Abschnitt 5).

| Zweig | +Commits | Konflikte | Letzter | Inhalt |
|---|---|---|---|---|
| `feature/interface-review-mvp` | 39 | **0** | 08-07 09:16 | 72 Dateien, Interface-Review-MVP — **liegengeblieben** |
| `claude/unruffled-lehmann-027933` | 4 | **0** | 08-08 15:15 | Eval-Bindung je Eval urteilen lassen (**löst #37**), misst 147/147 |
| `claude/ecstatic-sanderson-589087` | 4 | 2 | 08-08 15:18 | Bausteinarten: Struktur-Spalte sagt, was ein Absatz tut |
| `claude/relaxed-turing-127ead` | 3 | 1 | 08-08 15:12 | Bausteinarten: dritter Kanal, eigener Takt |
| `claude/friendly-wright-cd6991` | 3 | 1 | 08-08 14:59 | v2-smoke: neun tote Prüfungen aufgelöst |
| `claude/magical-taussig-0e2749` | 2 | **0** | 08-08 14:43 | Sprechblase mittig, Orb-Skizzen |
| `claude/infallible-leavitt-513a40` | 1 | **0** | 08-08 15:14 | toter Tipp-Zustand entfernt |
| `claude/affectionate-villani-34c1c6` | 1 | **0** | 08-08 15:13 | Umsetzungsplan zu #13 |
| `chore/remove-legacy-v2-css` | 1 | 1 | **07-23** 12:20 | totes CSS des alten Rahmens — **liegengeblieben, 16 Tage** |

Die Konfliktdateien:

| Zweig | Konflikt in |
|---|---|
| `ecstatic-sanderson` | `app/src/agent-prompts.mjs`, `app/test/agent-tasks.test.mjs` |
| `relaxed-turing` | `app/src/workspace.js` |
| `friendly-wright` | `app/test/v2-smoke.mjs` |
| `remove-legacy-v2-css` | `app/src/style.css` |

**Keiner der Konflikte liegt in `app/evals/results/*`.** Das war in jeder früheren Welle der
häufigste Grund; diesmal nicht. Grund: Das lokale `main` trägt die Messdateien bereits in der
Fassung, die die Einsammel-Welle erzeugt hat.

## 3. Zwei liegengebliebene Zweige — hier fehlt eine Entscheidung

Alles andere in Abschnitt 2 gehört zu einer Sitzung, die vor weniger als einer Stunde
committet hat. Diese zwei nicht:

- **`feature/interface-review-mvp`** — 39 Commits, 72 Dateien, letzter Commit 7. August früh.
  Konfliktfrei gegen `main`. Der größte offene Posten überhaupt, gehört zu keinem Issue und zu
  keiner laufenden Sitzung.
- **`chore/remove-legacy-v2-css`** — ein Commit vom **23. Juli**, ein Konflikt in `style.css`.
  Sechzehn Tage alt; `style.css` wurde seither mehrfach umgebaut. Vermutlich überholt, aber das
  ist zu prüfen, nicht zu vermuten.

## 4. Tote Verweise (15)

Vollständig in `main` enthalten, kein Worktree hängt dran. **Erst nach dem Push von `main`
löschen** (siehe oben).

```
claude/adoring-blackburn-e8f34d    claude/goofy-dirac-ed019e
claude/adoring-hugle-4fd06b        claude/jolly-hodgkin-0562e9
claude/bold-elbakyan-97e7ab        claude/jovial-blackwell-daebd0
claude/cranky-cori-c122aa          claude/nostalgic-mcclintock-608e79
claude/cranky-moore-56147a         claude/reverent-moser-f0ee54
claude/dazzling-murdock-8300f1     claude/suspicious-fermi-f4c39f
claude/determined-shtern-65f205    claude/youthful-greider-880c3e
claude/gestalt-31-befunde
```

Sieben weitere sind ebenfalls vollständig in `main`, hängen aber an einem Worktree einer
laufenden Sitzung — nicht anfassen: `anmerkung-gilt-einmal`, `einsammeln-c-bausteinarten`,
`pensive-wright-770f15`, `stoic-noyce-d51edc`, `vigorous-golick-0475d8`,
`xenodochial-pare-a897c0`, `zealous-faraday-9c3285`.

## 5. So wird diese Datei fortgeschrieben

Gegen **lokales** `main` messen, nicht gegen `origin/main` — sonst zählt man den Rückstand des
Servers als offene Arbeit mit.

```bash
for b in $(git for-each-ref --format='%(refname:short)' refs/heads | grep -v '^main$'); do
  ahead=$(git rev-list --count main..$b); [ "$ahead" -gt 0 ] || continue
  printf "%-46s +%-4s %s\n" "$b" "$ahead" "$(git log -1 --format='%cd %s' --date=format:'%m-%d %H:%M' $b | cut -c1-60)"
done
```

Konflikte je Zweig:

```bash
git merge-tree --write-tree main <zweig> | grep -E '^(KONFLIKT|CONFLICT)'
```

**Fallstrick, der schon zweimal zu falschen Zahlen geführt hat:** Git gibt hier **deutsch** aus.
Wer nur nach `CONFLICT` filtert, misst überall null Konflikte und hält jeden Zweig für
pflückreif. Immer beide Wörter prüfen.

**Zweiter Fallstrick:** Konfliktzahlen altern innerhalb von Stunden — bei `magical-haibt` fielen
sie an einem Nachmittag von acht auf null. Vor jedem Einsammeln neu messen, nie die Tabelle
lesen.

**Regel für `app/evals/results/*`:** generierte Dateien, immer die `main`-Version nehmen und am
Ende mit `node evals/run-fertigzustand.mjs` neu erzeugen. Nie von Hand mergen.
