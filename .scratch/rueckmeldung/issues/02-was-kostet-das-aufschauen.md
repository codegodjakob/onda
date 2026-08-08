# Was der Aufschauen-Moment kostet

Type: research
Status: resolved

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

## Answer

### Das Ergebnis in drei Sätzen

Ein einzelner Aufschauen-Lauf kostet **8 bis 38 US-Cent**, je nach Textlänge. Bei
fünf Läufen pro Schreibstunde sind das **0,42 bis 1,91 US-Dollar pro Stunde**, über
ein ganzes Dokument hinweg **rund 3 US-Dollar für einen 2000-Wort-Essay** und **rund
37 US-Dollar für einen 10000-Wort-Text**. Der Moment ist damit tragbar — aber nur,
wenn er eine Zündbremse bekommt, die der heute schon eingebaute Hinweislauf nicht
hat: derselbe Modellaufruf feuert dort alle drei Sekunden und kostet in derselben
Stunde ein Vielfaches.

Alle Beträge sind US-Cent bzw. US-Dollar, weil `schaetzeKostenCents` in US-Cent
rechnet und die Einstellungsoberfläche die Grenze in US-Dollar abfragt.

---

### 1. Was gerechnet und was angenommen ist

Diese Trennung ist wichtig, damit du weißt, welche Zahl fest ist und welche eine
Schätzung, die sich verschieben kann.

**Aus dem Code abgelesen — das steht fest:**

| Sache | Wert | Fundstelle |
|---|---|---|
| Starkes Modell | `claude-opus-5` | `agent-tasks.mjs`, `MODELLE.stark` |
| Preis Eingabe | 5 $ je Million Token | `PREISE` |
| Preis Antwort | 25 $ je Million Token | `PREISE` |
| Zwischenspeicher lesen | 0,1 × Eingabepreis | `PREISE.cacheReadFaktor` |
| Zwischenspeicher schreiben | 1,25 × Eingabepreis | `PREISE.cacheWriteFaktor` |
| Kostenformel | `(ein·5 + aus·25 + gelesen·0,5 + geschrieben·6,25) ÷ 1 Mio × 100` | `schaetzeKostenCents` |
| Was zwischengespeichert wird | System → Projektverständnis → Dokument | `baueAnfrage` |
| Was nicht zwischengespeichert wird | Anweisung + Entscheidungsliste | `baueAnfrage`, `hinweis-kontext.mjs` |
| Haltbarkeit des Zwischenspeichers | 5 Minuten (kein `ttl` gesetzt → Voreinstellung) | `baueAnfrage` |
| Länge des System-Textes | 2341 Zeichen | gemessen in `agent-prompts.mjs` |
| Länge der Hinweis-Anweisung | 1091 Zeichen | gemessen in `agent-prompts.mjs` |
| Denken zählt als Antwort | ja, `max_tokens` deckelt Denken + Antwort zusammen | Kommentar über `TASK_TABLE` |
| Wie oft der Hinweislauf heute feuert | nach 3 Sekunden Schreibpause | `AGENT_IDLE_MS`, `workspace.js:114` |
| Monatsgrenze im Auslieferungszustand | keine (`null`) | `DEFAULT_SETTINGS.kiMonatsbudgetCents` |

**Angenommen — hier steckt die Unsicherheit:**

| Annahme | Wert | Begründung |
|---|---|---|
| Deutsch → Token | 3,5 Zeichen je Token, also **rund 2 Token je Wort** | Deutsch ist wegen Komposita und Umlauten token-schwerer als Englisch; der seit Opus 4.7 verwendete Zerleger zählt zusätzlich etwa ein Drittel mehr als der davor |
| Projektverständnis | rund 300 Token | sieben Felder, deutsch ausformuliert |
| Anweisung für Erweiterungen | rund 350 Token | in Länge der bestehenden `HINWEIS_ANWEISUNG` |
| Entscheidungsliste | rund 80 Token je entschiedenem Hinweis, ein Hinweis je 130 geschriebene Wörter | aus der Feldstruktur von `fasseEntscheidungenZusammen` |
| Sichtbare Antwort | 3 Erweiterungen, zusammen rund 1200 Token | drei Erweiterungen à etwa 200 Wörter |
| Denken | 1500 Token bei 500 Wörtern, 7500 bei 10000, dazwischen linear | offene generative Aufgabe über den ganzen Text, `effort` steht auf der Voreinstellung `high` |
| Schreibtempo | 300 verwertbare Wörter je Stunde | anspruchsvolle deutsche Sachprosa |
| Auslösungen | 5 Aufschauen-Momente je Schreibstunde | siehe Abschnitt 5 |

Die wackeligste Annahme ist das **Denken**. Sie trägt bei 500 Wörtern 87 Prozent der
Kosten, bei 10000 Wörtern noch 58 Prozent. Wenn das Denken doppelt so lang ausfällt
wie geschätzt, verdoppeln sich die Beträge annähernd. Zweitwackeligste Annahme ist
die **Entscheidungsliste**: sie wächst mit jedem entschiedenen Hinweis und wird
nirgends beschnitten.

---

### 2. Der Preiszettel im Code ist aktuell — mit einer Fußnote

Die Tabelle `PREISE` trägt den Vermerk „Momentaufnahme 07/2026“. Sie stimmt mit der
heutigen Anthropic-Preisliste überein: `claude-opus-5` kostet 5 $ / 25 $ je Million
Token, `claude-haiku-4-5` kostet 1 $ / 5 $, Zwischenspeicher-Lesen kostet ein Zehntel
des Eingabepreises. **Der Wert ist also nicht veraltet.**

Eine Fußnote gehört dazu: `cacheWriteFaktor: 1.25` gilt nur für den
Fünf-Minuten-Zwischenspeicher, den `baueAnfrage` heute verwendet. Würde jemand später
`ttl: '1h'` ergänzen, läge der wahre Faktor bei 2,0 — `schaetzeKostenCents` würde die
Kosten dann still um 60 Prozent zu niedrig ausweisen, ohne dass irgendetwas
fehlschlägt. Wer den Ein-Stunden-Speicher einschaltet, muss die Zahl mitziehen.

---

### 3. Was ein einzelner Lauf kostet

Zuerst der Preis pro tausend Token, direkt aus `schaetzeKostenCents` abgeleitet.
Das macht den Rest der Rechnung nachvollziehbar:

| | Opus 5 | Haiku 4.5 |
|---|---:|---:|
| frische Eingabe | 0,500 ¢ | 0,100 ¢ |
| Antwort (inkl. Denken) | 2,500 ¢ | 0,500 ¢ |
| aus dem Speicher gelesen | 0,050 ¢ | 0,010 ¢ |
| in den Speicher geschrieben | 0,625 ¢ | 0,125 ¢ |

**Die Antwort ist fünfmal teurer als frische Eingabe und fünfzigmal teurer als
gespeicherte Eingabe.** Das ist der Schlüssel zu allem Weiteren.

#### Was in einen Lauf hineingeht

Fester Teil, unabhängig von der Textlänge: System-Text 669 Token + Projektverständnis
300 Token = **969 Token**.

| Textlänge | Dokument | Präfix gesamt | volatiler Teil | Antwort inkl. Denken |
|---|---:|---:|---:|---:|
| 500 Wörter | 1000 Tok | 1969 Tok | 670 Tok | 2700 Tok |
| 2000 Wörter | 4000 Tok | 4969 Tok | 1550 Tok | 3647 Tok |
| 10000 Wörter | 20000 Tok | 20969 Tok | 6510 Tok | 8700 Tok |

#### Der Rechenweg an einem Beispiel

2000 Wörter, Zwischenspeicher greift nicht (der Normalfall, siehe Abschnitt 4):

```
Präfix   4969 Tok × 0,625 ¢/1000 =  3,11 ¢   (in den Speicher geschrieben)
volatil  1550 Tok × 0,500 ¢/1000 =  0,78 ¢   (voller Eingabepreis)
Antwort  3647 Tok × 2,500 ¢/1000 =  9,12 ¢
                                   ───────
                                    13,00 ¢
```

#### Alle vier Fälle nebeneinander

| Textlänge | A ganz warm | B halbwarm | **C ganz kalt** | D ohne Speicherung |
|---|---:|---:|---:|---:|
| 500 Wörter | 7,18 ¢ | 7,76 ¢ | **8,32 ¢** | 8,07 ¢ |
| 2000 Wörter | 10,14 ¢ | 12,44 ¢ | **13,00 ¢** | 12,38 ¢ |
| 10000 Wörter | 26,05 ¢ | 37,55 ¢ | **38,11 ¢** | 35,49 ¢ |

- **A ganz warm** — alles kommt aus dem Zwischenspeicher. Der theoretische Bestfall.
- **B halbwarm** — System und Projektverständnis aus dem Speicher, Dokument neu.
- **C ganz kalt** — alles muss neu in den Speicher geschrieben werden.
- **D ohne Speicherung** — was es kosten würde, wenn gar kein `cache_control` gesetzt
  wäre. Nur als Vergleichsmaßstab, so läuft der Code nicht.

**Für den Aufschauen-Moment ist Spalte C der realistische Fall.** Warum, steht im
nächsten Abschnitt.

---

### 4. Der Zwischenspeicher hilft diesem Moment nicht — er kostet ihn

Das ist der überraschendste Befund. Vergleiche in der Tabelle oben Spalte C mit
Spalte D: Bei 2000 Wörtern ist der Lauf **mit** Zwischenspeicherung 0,62 ¢ teurer als
ohne, bei 10000 Wörtern 2,62 ¢ teurer. Der Aufschlag von 25 Prozent fürs Schreiben
wird bezahlt, der Rabatt von 90 Prozent fürs Lesen wird nie eingelöst.

Dafür gibt es zwei Gründe, und beide sind Bauart, kein Zufall.

**Erstens: Der Text hat sich immer geändert.** Der Zwischenspeicher greift nur, wenn
der Anfang der Anfrage Zeichen für Zeichen derselbe ist. Der Dokument-Block ist ein
Block; ändert sich darin irgendetwas, ist er komplett wertlos. Der Aufschauen-Moment
tritt aber gerade dann ein, wenn jemand einen Abschnitt fertig geschrieben hat — der
Text hat sich also mit Sicherheit geändert. Derselbe Einwand gilt für den bestehenden
Hinweislauf: dessen Tor lässt einen Lauf ausdrücklich nur durch, wenn sich die
Signatur des Textes geändert hat (`pruefeHinweislaufGate`, Grund `unveraendert`). Der
Dokument-Block kann in dieser Bauform **strukturell nie einen Treffer landen**.

**Zweitens: Fünf Minuten sind zu kurz.** `baueAnfrage` setzt `cache_control` ohne
`ttl`, das heißt fünf Minuten Haltbarkeit. Der Auslöser des Aufschauen-Moments ist
laut Entwurf „eine längere Pause“. Eine Pause, die diesen Namen verdient, ist länger
als fünf Minuten. Damit ist auch der feste Teil — System und Projektverständnis —
meistens schon abgelaufen, wenn der Moment eintritt.

**Was daraus folgt:** Der Zwischenspeicher rechtfertigt sich für den Chat und für eng
aufeinanderfolgende Hinweisläufe. Für den Aufschauen-Moment rechtfertigt er sich
nicht. Die billigste sofort verfügbare Maßnahme wäre, für diesen einen Task **das
`cache_control` am Dokument-Block wegzulassen** — das spart 0,50 ¢ je Lauf bei 2000
Wörtern und 2,50 ¢ bei 10000 Wörtern, ohne dass irgendetwas anderes sich ändert.

---

### 5. Wie oft der Moment eintritt

Zur Häufigkeit gibt es im Code noch nichts — der Aufschauen-Moment ist ungebaut. Ich
nehme deshalb Folgendes an und lege es offen:

- **Schreibtempo:** 300 verwertbare Wörter je Stunde bei anspruchsvoller Sachprosa.
  Getippt wird viel mehr; was übrig bleibt, ist weniger.
- **Abschnittsende:** ein Abschnitt umfasst 200 bis 400 Wörter, also etwa **ein
  Abschnittsende je Schreibstunde**.
- **Längere Pause:** mit einer Schwelle von zwei Minuten Untätigkeit und einem
  Mindestabstand von zehn Minuten zwischen zwei Läufen kommen **drei bis fünf
  Auslösungen je Stunde** dazu.

Ich rechne mit **fünf Auslösungen je Schreibstunde** als mittlerem Wert und zeige die
Spanne mit.

| Textlänge | 2 ×/Std | **5 ×/Std** | 10 ×/Std |
|---|---:|---:|---:|
| 500 Wörter | 0,17 $ | **0,42 $** | 0,83 $ |
| 2000 Wörter | 0,26 $ | **0,65 $** | 1,30 $ |
| 10000 Wörter | 0,76 $ | **1,91 $** | 3,81 $ |

#### Über ein ganzes Dokument

Hier ist zu berücksichtigen, dass der Text mitwächst — die frühen Läufe sind billiger
als die späten. Ich rechne mit der mittleren Länge über die Lebenszeit des Dokuments.

**Ein 2000-Wort-Essay:** 2000 ÷ 300 = 6,7 Schreibstunden. × 5 Läufe = **33 Läufe**.
Mittlere Länge unterwegs: 1000 Wörter, das kostet 9,89 ¢ je Lauf.
33 × 9,89 ¢ = **3,26 US-Dollar für den ganzen Essay.**

**Ein 10000-Wort-Text:** 10000 ÷ 300 = 33,3 Schreibstunden. × 5 = **167 Läufe**.
Mittlere Länge unterwegs: 5000 Wörter, das kostet 22,41 ¢ je Lauf.
167 × 22,41 ¢ = **37,42 US-Dollar für den ganzen Text.**

Drei Dollar für einen Essay sind unauffällig. Siebenunddreißig Dollar für eine
längere Arbeit sind spürbar, aber nicht abwegig — es sind gut 33 Stunden Arbeit an
einem Text, für den man sonst niemanden bezahlt.

---

### 6. Der eigentliche Kostentreiber steht schon im Code

Bevor du über die Kosten des Aufschauen-Moments entscheidest, gehört ein Vergleich
daneben: **Der bestehende Hinweislauf hat exakt dieselbe Form** — dasselbe Modell,
denselben Präfix, dasselbe Denken, dasselbe `max_tokens` von 32000. Ein Hinweislauf
kostet also ungefähr genauso viel wie ein Aufschauen-Lauf.

Er feuert nur um Größenordnungen öfter. `AGENT_IDLE_MS` steht auf 3000 Millisekunden.
Ein Lauf startet, sobald jemand drei Sekunden nicht getippt hat und sich der Text seit
dem letzten Lauf geändert hat. Ein weiterer Lauf ist gesperrt, solange einer läuft.
Praktisch heißt das: **so oft, wie ein Lauf dauert.** Ein Opus-5-Lauf mit Denken über
2000 Wörter braucht grob 30 bis 60 Sekunden — also 60 bis 120 Läufe je Stunde, wenn
durchgehend geschrieben wird.

| | 30 Läufe/Std | 60 Läufe/Std | 120 Läufe/Std |
|---|---:|---:|---:|
| 2000 Wörter | 3,90 $/Std | 7,80 $/Std | 15,60 $/Std |
| 10000 Wörter | 11,43 $/Std | 22,87 $/Std | 45,74 $/Std |

Zum Vergleich noch einmal der Aufschauen-Moment bei fünf Läufen je Stunde: **0,65 $**
bzw. **1,91 $**.

**Der Aufschauen-Moment ist also nicht das teure Stück. Er kostet ungefähr ein
Zwölftel dessen, was der heutige Drei-Sekunden-Takt kostet.** Wenn du bei diesem
Ticket über Geld nachdenkst, ist die dringendere Frage nicht, ob Aufschauen tragbar
ist, sondern ob der bestehende Hinweislauf es ist. Das ist zugleich eine Bestätigung
für die Vermutung in Ticket 03: „Struktur- und Logikkritik springt alle 3 Sekunden
an“ ist nicht nur störend, es ist auch der teuerste Posten im ganzen System.

---

### 7. Wie sich das zum Monatsbudget verhält

Die Bremse in `settings-model.mjs` funktioniert so:

1. `verbucheUsage` addiert nach **jedem** Lauf Token und Kosten auf einen
   Monatszähler — auch bei `refusal` und bei `max_tokens`, also auch dann, wenn der
   Lauf verworfen wurde. Das ist richtig: bezahlt wurde trotzdem.
2. `budgetStand` meldet `erreicht`, sobald `kostenCents >= budgetCents`.
3. `beansprucheAutomatiklauf` wird **vor** einem selbstständigen Lauf gefragt und
   lässt ihn durch, solange die Grenze noch nicht erreicht ist.
4. Ist sie erreicht, kannst du in den Einstellungen **genau einen** weiteren Lauf
   bewusst freigeben.

Daraus ergeben sich vier Punkte, die für den Aufschauen-Moment zählen.

**Erstens: Im Auslieferungszustand gibt es gar keine Bremse.**
`kiMonatsbudgetCents` steht auf `null`. `beansprucheAutomatiklauf` gibt dann
`{ erlaubt: true, grund: 'kein-budget' }` zurück. Bis jemand von Hand eine Grenze
einträgt, ist das Ausgabenlimit im Anbieterkonto der einzige Schutz. Wenn der
Aufschauen-Moment dazukommt, sollte die Grenze eine Voreinstellung bekommen.

**Zweitens: Die Bremse greift erst nach dem Überschreiten.** Sie vergleicht bereits
angefallene Kosten mit der Grenze, nicht die zu erwartenden. Ein Lauf, der die Grenze
reißt, wird vollständig bezahlt. Bei 38 ¢ Überschuss ist das harmlos, aber es heißt:
die Grenze ist eine Nachlaufbremse, keine Vorausschau.

**Drittens: Nur selbstständige Läufe unterliegen ihr.** `beansprucheAutomatikKosten`
wird an zwei Stellen gerufen — beim Verständnis-Entwurf (`workspace.js:1304`) und beim
Hinweislauf (`workspace.js:2964`). Der Chat läuft ungebremst durch, mit `maxTokens`
64000. Das ist bewusst so und richtig, weil der Chat von Hand angestoßen wird. Der
Aufschauen-Moment ist dagegen ein selbstständiger Lauf und **muss** durch
`beansprucheAutomatikKosten` gehen, sonst behauptet die Oberfläche „Automatische Läufe
sind pausiert“, während einer weiterläuft.

**Viertens: Wie lange eine Grenze hält.** Bei einer Monatsgrenze von 10 US-Dollar:

| | nur Aufschauen (5 ×/Std) | heutiger Hinweislauf (60 ×/Std) |
|---|---:|---:|
| 2000 Wörter | 15,4 Schreibstunden | 1,3 Schreibstunden |
| 10000 Wörter | 5,2 Schreibstunden | 0,4 Schreibstunden |

Aufschauen allein passt in einen sinnvollen Monatsbetrag. Aufschauen **zusätzlich zum
heutigen Hinweislauf** passt in gar nichts: die Grenze fällt nach gut einer Stunde,
und dann sitzt jemand mit der Meldung „genau ein Lauf kann freigegeben werden“ vor
seinem Text. Das ist keine tragfähige Bedienung.

Eine kleine Ergänzung wäre lohnend: `budgetStand` liefert heute keinen Restbetrag in
lesbarer Form an die Oberfläche. Wenn Aufschauen dazukommt, sollte man sehen können,
wie viel vom Monat noch übrig ist, bevor die Bremse zuschnappt.

---

### 8. Die billigere Bauform

Vier Hebel, nach Wirkung geordnet. Der erste ist der wichtigste, und er ist nicht
technischer Natur.

#### Hebel 1: Seltener feuern

Die Kosten sind streng linear in der Zahl der Auslösungen. Von fünf auf drei Läufe je
Stunde sind vierzig Prozent gespart, ohne einen einzigen Token anders zu behandeln.
Zwei Regeln reichen:

- **Mindestabstand.** Nicht öfter als alle zehn Minuten, egal wie viele Pausen
  vorkommen.
- **Mindestzuwachs.** Nur, wenn seit dem letzten Aufschauen-Lauf mindestens
  ein Abschnitt an neuem Text dazugekommen ist. Die Signaturprüfung aus
  `pruefeHinweislaufGate` prüft heute nur „hat sich irgendetwas geändert“ — für
  Aufschauen braucht es „hat sich genug geändert“.

Das ist auch die einzige Bremse, die deterministisch wirkt: sie deckelt die
Stundenkosten, unabhängig davon, wie lang der Text wird.

#### Hebel 2: Weniger denken lassen

`output_config.effort` steht heute nirgends im Code, das heißt es gilt die
Voreinstellung `high`. Das Denken macht 58 bis 87 Prozent der Kosten aus. Auf
`medium` heruntergesetzt:

| Textlänge | effort `high` | effort `medium` | effort `low` |
|---|---:|---:|---:|
| 2000 Wörter | 13,00 ¢ | 9,94 ¢ (−24 %) | 8,41 ¢ (−35 %) |
| 10000 Wörter | 38,11 ¢ | 28,74 ¢ (−25 %) | 24,05 ¢ (−37 %) |

Die niedrigen Stufen sind auf Opus 5 ausdrücklich als ungewöhnlich leistungsfähig
beschrieben und gelten als der eigentliche Kosten-Hebel dieses Modells. Für den
Aufschauen-Moment lohnt ein Versuch mit `medium`: Erweiterungsideen sind eine
schöpferische, keine forensische Aufgabe — sie brauchen vermutlich weniger
Nachprüfung als eine Integritätsprüfung.

#### Hebel 3: Das schnelle Modell als Torwächter, nicht als Vorfilter

Die Frage im Ticket lautet: schnelles Modell für eine Vorauswahl, starkes Modell nur
für den Rest. Das funktioniert — aber **nicht als Filter, sondern als Tor.**

Der Unterschied ist entscheidend. Wenn Haiku eine Auswahl trifft und Opus danach
trotzdem den ganzen Text lesen und ausformulieren muss, ist nichts gespart: das
Denken fällt genauso an. Gespart wird nur, wenn Opus in einem Teil der Fälle **gar
nicht erst gerufen wird**.

Die Torwächter-Frage lautet also nicht „welche Erweiterung ist die beste“, sondern
„gibt es hier überhaupt etwas, wofür sich das starke Modell lohnt“.

Ein Haiku-Torwächter kostet, mit demselben Präfix und einer kurzen Antwort von
800 Token:

- bei 2000 Wörtern: **1,18 ¢** — neun Prozent eines Opus-Laufs
- bei 10000 Wörtern: **3,67 ¢** — zehn Prozent eines Opus-Laufs

Rechenweg für 2000 Wörter:

```
Präfix   4969 Tok × 0,125 ¢/1000 = 0,62 ¢
volatil  1550 Tok × 0,100 ¢/1000 = 0,16 ¢
Antwort   800 Tok × 0,500 ¢/1000 = 0,40 ¢
                                  ───────
                                    1,18 ¢
```

Was das über alle Auslösungen hinweg bringt, hängt an der Durchlassquote:

| Durchlassquote | 2000 Wörter | 10000 Wörter | Ersparnis |
|---|---:|---:|---:|
| 30 % | 5,08 ¢ | 15,10 ¢ | 61 % / 60 % |
| 40 % | 6,38 ¢ | 18,91 ¢ | 51 % / 50 % |
| 50 % | 7,68 ¢ | 22,73 ¢ | 41 % / 40 % |
| ohne Torwächter | 13,00 ¢ | 38,11 ¢ | — |

Der Preis: Haiku 4.5 kann kein adaptives Denken und keine `effort`-Stufen — es ist ein
Modell der Vorgängergeneration. Ein Torwächter, der beurteilt, ob ein Abschnitt
gedankliches Potenzial birgt, ist eine anspruchsvolle Aufgabe. Wenn er zu großzügig
durchlässt, spart er nichts; wenn er zu streng ist, geht genau der Moment verloren,
für den das Ganze gebaut wird. **Ob er das kann, ist eine Messfrage und keine
Rechenfrage** — sie gehört an einen echten Text, wie in Ticket 03.

#### Hebel 4: Den Zwischenspeicher richtig setzen (klein, aber umsonst)

- **`cache_control` am Dokument-Block für diesen Task weglassen.** Spart 0,50 ¢ bei
  2000 Wörtern, 2,50 ¢ bei 10000 Wörtern je Lauf. Kein Nachteil, weil der Block
  ohnehin nie getroffen wird.
- **Die Entscheidungsliste beschneiden.** Sie liegt hinter dem Zwischenspeicher und
  wird zum vollen Eingabepreis abgerechnet: bei 10000 Wörtern sind das rund 6500
  Token, also 3,26 ¢ je Lauf — mehr als der komplette gespeicherte Präfix. Sie wächst
  ohne Obergrenze. Die letzten dreißig Entscheidungen dürften genügen.
- **Der vierte Haltepunkt.** `baueAnfrage` verwendet drei von vier erlaubten
  `cache_control`-Marken. Der freie vierte könnte das Dokument in einen
  abgeschlossenen Kopf und einen bearbeiteten Schwanz teilen. Bei einer Haltbarkeit
  von einer Stunde statt fünf Minuten rechnet sich das ab dem zweiten Lauf innerhalb
  der Stunde. Aber: die Ein-Stunden-Haltbarkeit kostet 2,0 statt 1,25 beim Schreiben,
  und `PREISE.cacheWriteFaktor` steht fest auf 1,25 — die Buchhaltung würde stillschweigend
  falsch rechnen. Nur mit angepasstem Preiszettel machen.

#### Alle Hebel zusammen

Torwächter mit 40 Prozent Durchlass, `effort: medium` beim Durchlass, und drei statt
fünf Auslösungen je Stunde:

| | heute (5 ×/Std, high) | mit allen drei Hebeln (3 ×/Std) | Ersparnis |
|---|---:|---:|---:|
| 2000 Wörter | 0,65 $/Std | 0,15 $/Std | 76 % |
| 10000 Wörter | 1,91 $/Std | 0,46 $/Std | 76 % |

---

### 9. Urteil

**Der Aufschauen-Moment ist als entworfen tragbar.** Bei 8 bis 38 US-Cent je Lauf und
einer vernünftigen Auslösedisziplin kostet er 0,42 bis 1,91 US-Dollar je
Schreibstunde und rund 3 bzw. 37 US-Dollar über ein ganzes Dokument. Für ein
persönliches Werkzeug, das an einem Text über Wochen mitarbeitet, ist das ein Preis,
den man nennen kann, ohne sich zu winden. Eine Sparbauform ist **nicht nötig, damit
er überhaupt geht**.

Drei Bedingungen hängen daran:

1. **Er braucht eine Zündbremse, bevor er gebaut wird.** Mindestabstand und
   Mindestzuwachs, nicht nur „Text hat sich geändert“. Ohne sie ist die Zahl der
   Auslösungen unbestimmt, und dann ist auch die Kostenaussage wertlos.
2. **Er muss durch `beansprucheAutomatikKosten` laufen** wie jeder andere
   selbstständige Lauf, und die Monatsgrenze braucht eine Voreinstellung. Heute steht
   sie auf `null`.
3. **Der Zwischenspeicher ist für diesen Moment kein Sparmittel.** Er ist in der
   heutigen Bauform sogar ein kleiner Aufschlag. Nicht darauf bauen.

**Die Sparbauform lohnt sich trotzdem, aber aus einem anderen Grund als vermutet.**
Der Haiku-Torwächter halbiert die Kosten — sein eigentlicher Wert liegt aber darin,
dass er auch die *Zahl der Unterbrechungen* halbiert. Er ist damit weniger eine
Kostenmaßnahme als eine Antwort auf Ticket 01. Ob er die Urteilskraft dafür hat, ist
am echten Text zu messen, nicht auszurechnen.

**Die wichtigste Erkenntnis liegt aber neben der Frage.** Der heutige
Drei-Sekunden-Hinweislauf verwendet dasselbe Modell in derselben Form und feuert
zwölf- bis vierundzwanzigmal so oft. Er kostet 3,90 bis 22,87 US-Dollar je
Schreibstunde und frisst eine Monatsgrenze von 10 US-Dollar in gut einer Stunde auf.
Wenn der Aufschauen-Moment ohne Änderung an diesem Takt dazukommt, ist nicht der neue
Moment das Problem — das Budget ist dann schon vorher weg. Die Neuverteilung der
Rhythmen, die diese Karte ohnehin vorhat, ist damit auch die wirksamste
Kostenmaßnahme im ganzen Vorhaben.
