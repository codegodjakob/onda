# Archiv: die alten Etappen-Ergebnisse

Diese sieben Dateien lagen früher direkt in `evals/results/` und trugen
Gesamtwerte zwischen 4,69 und 5,0. Sie sind hierher verschoben und in jeder
Datei mit einem `_veraltet`-Vermerk entwertet worden (Issue #15, 05.08.2026),
denn ihre Werte waren von Hand eingetragen: Ein Eval durfte dort „bestanden"
heißen, weil ein früherer Lauf das gesagt hatte — 62 von 77 Belegen der
letzten Etappe zeigten auf die Ergebnisdatei der Vorstufe statt auf eine
frische Prüfung (Befund 3 der Systemanalyse vom 04.08.2026).

Sie bleiben als historisches Dokument der Etappen erhalten. Als Messwert
zählt nur der frische Lauf:

```
node evals/run-fertigzustand.mjs   →  evals/results/fertigzustand-latest.json
```

Als der frische Lauf am 03.08.2026 erstmals alles neu maß, fiel der Wert von
5,0 auf 3,78 — das ist der ehrliche Unterschied zwischen Weiterreichung und
Messung.

Hintergrund: Befund 6 der Systemanalyse vom 04.08.2026 — alte Ergebnisdateien
lagen als konkurrierende Wahrheit neben dem frischen Lauf. Die Verschiebung
hierher ist Teil von Issue #18, die Entwertung Teil von Issue #15.
