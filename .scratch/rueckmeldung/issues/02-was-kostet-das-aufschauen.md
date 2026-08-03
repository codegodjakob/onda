# Was der Aufschauen-Moment kostet

Type: research
Status: open

## Question

Der Aufschauen-Moment schickt den ganzen Text plus Projektverständnis an das starke
Modell und verlangt Erweiterungen. Was kostet das?

- Wie oft tritt der Moment bei realistischem Schreiben ein — pro Stunde, pro
  Dokument?
- Was kostet ein Lauf bei Textlängen von 500, 2000, 10000 Wörtern, mit und ohne
  greifenden Zwischenspeicher (Prompt-Caching)?
- Wie verhält sich das zum bestehenden Monatsbudget
  (`app/src/settings-model.mjs`, `verbucheUsage`)?
- Gibt es eine billigere Bauform, die dasselbe leistet — etwa das schnelle Modell für
  eine Vorauswahl und das starke nur für den Rest?

Grundlagen im Code: `app/src/agent-tasks.mjs` (PREISE, TASK_TABLE, `schaetzeKostenCents`).

**Antwort ist:** Zahlen mit Rechenweg, plus eine Aussage, ob der Moment tragbar ist
oder eine Sparbauform braucht.
