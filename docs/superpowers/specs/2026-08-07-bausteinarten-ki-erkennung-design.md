# Bausteinarten: die KI erkennt sie, der Nutzer vergibt sie nicht

**Datum:** 7. August 2026

**Status:** von Jakob bestätigt (vier Entscheidungen, siehe unten)

**Anlass:** Mit `c0a8f21` fiel das schwebende Plus am Absatz weg. Es war der einzige
Öffner des Menüs „Art des Textbausteins". Die Commit-Botschaft versprach dem Menü einen
neuen Platz in der Struktur-Ansicht. Dieser Platz wurde nie gebaut — seither kann in der
Oberfläche keine semantische Rolle mehr vergeben werden.

## Der Befund, am Code belegt

`openInsertMenu` (`app/src/workspace.js:542`) hat genau einen Aufrufer: den Testzugang
`oeffneEinfuegeMenue` (`app/src/workspace.js:4719`), im Code selbst als „Klinke" bezeichnet.
Aus der Oberfläche heraus erreicht ihn niemand. `renderStructureNav`
(`app/src/workspace.js:709`) erzeugt ausschließlich Sprungkarten (`.block-preview`).

Die Rolle ist kein Etikett. An ihr hängt Rechenlogik, und die läuft seither leer:

| Ort | Was ohne Rollen geschieht |
|---|---|
| `app/src/claim-ledger.mjs:230` | Jede Aussage wird `supporting`, nie `central`; nichts wird `contested` |
| `app/src/argument-projection.mjs:52` | Verlangt **genau eine** zentrale Aussage — es gibt nie eine. Die Projektion kehrt wirkungslos zurück |
| `app/src/effect-analysis.mjs:56` | Ohne Rolle greifen nur noch Wortmuster; Rückfall auf `inform`, `confidence: low` |
| `app/src/language-patterns.mjs:51` | Übergangsabsätze werden fälschlich als Bindewort-Häufung gerügt |
| `app/src/workspace.js:666` | Jede Struktur-Karte trägt „Freier Absatz" — ein Etikett ohne Aussage |

Einziger Schreiber der Rolle ist `insertSemanticBlock` (`app/src/block-identity.js:134`),
aufgerufen aus `insertBlock` (`app/src/workspace.js:530`) und über `editor.js:108`.
Das Beispielprojekt (`app/src/example-seed.mjs`) vergibt keine Rollen — die Struktur-Spalte
sagt dort heute durchgängig „Freier Absatz".

## Die vier Entscheidungen

1. **Die KI erkennt die Bausteinart.** Kein Menü, keine Handvergabe. Grund: Jakob am
   6. Juli 2026 — „nicht etwas, was ich manuell mache, dieses Updaten und dieses
   Zuordnen. Das soll automatisch passieren."
2. **Nicht auf sechs Kategorien beschränkt.** Die KI leitet **pro Text** einen eigenen Satz
   Bausteinarten ab, passend zur Textsorte. Eine wissenschaftliche Arbeit bekommt andere
   Arten als ein Essay oder ein Marketing-Text.
3. **Das Erkannte liegt neben dem Text**, nicht im Text. Das Dokument bleibt reine Prosa.
4. **Kein Einfüge-Weg in der Struktur-Spalte.** Die zweite Hälfte der alten Zusage entfällt
   bewusst: ein Plus in der Spalte wäre dasselbe Rätsel wie das Plus am Absatz.

## Ziel

Die Struktur-Spalte sagt, was jeder Absatz in *diesem* Text tut — in Worten, die zu diesem
Text passen. Niemand ordnet etwas zu. Die Namen wiederholen sich innerhalb eines Textes,
sodass Muster sichtbar werden: drei Befunde und keine Einschränkung fällt auf.

## Was der Nutzer sieht

Jede Struktur-Karte trägt statt „Freier Absatz" den erkannten Namen — bei einer Hausarbeit
etwa *Befund*, *Einschränkung*, *Einordnung*; bei einem Essay *Anekdote*, *Wendung*,
*Einwand*.

- **Noch nicht erkannt:** kein Name, keine Zeile, kein Platzhalter. Die Karte bleibt ruhig.
- **Überschriften:** heißen weiter „Überschrift". Das folgt aus dem Knotentyp
  (`app/src/workspace-model.mjs:147`), ist also keine Vermutung.
- **Beim Schreiben:** ein Name ändert sich nur, wenn sich der Absatz geändert hat. In der
  Spalte springt nichts herum, während getippt wird.

Die sechs alten Wörter erscheinen nirgends mehr in der Oberfläche.

## Was die KI tut

Ein Lauf beantwortet zwei Dinge in einem Zug:

1. **Welche Textsorte** liegt vor und **welche Bausteinarten** hat dieser Text? Das ergibt
   den Satz Namen — jeder mit einer kurzen Beschreibung, wozu diese Art dient.
2. **Welche Art trägt jeder Absatz?**

Zu jeder Art nennt die KI zusätzlich eine **Funktion** aus einem kleinen festen Satz —
oder keine. Diese Funktion ist unsichtbar; sie ist das Bindeglied zur vorhandenen
Rechenlogik (siehe „Das stille Bindeglied").

### Eigener Lauf, nicht im Hinweislauf

Die Erkennung läuft **nicht** im Hinweislauf mit. Grund ist der Takt: Hinweise gehören zu
jeder Schreibpause, die Bausteinart eines Absatzes ändert sich viel seltener. Im selben
Lauf würde die Erkennung entweder ständig unnötig mitlaufen oder unzuverlässig ausfallen,
und ein Formatfehler in der Erkennung würde den ganzen Hinweislauf mitreißen.

Als eigener Lauf startet sie nur, wenn einer dieser Fälle vorliegt:

- Ein Absatz **kam dazu, fiel weg oder wurde verschoben** — die Reihenfolge der Absatz-IDs
  hat sich geändert.
- Ein Absatz **hat noch keinen Namen**.
- Ein benannter Absatz wurde **um mehr als die Hälfte umgeschrieben**, gemessen an der
  Zeichenzahl seit seiner Benennung.

Reines Weiterschreiben in einem bereits benannten Absatz löst also nichts aus — erst die
Eingabetaste tut es, und dann ist auch tatsächlich ein neuer Baustein da. Ein leicht
umformulierter Satz ändert nicht, was ein Absatz tut; erst eine gründliche Überarbeitung
kann es. Die Hälfte ist eine gesetzte Grenze, kein Naturgesetz: Sie ist im reinen Modell
verstellbar und wird dort geprüft.

Der Dokumenttext liegt beim Aufruf schon im
Zwischenspeicher der Schnittstelle (Cache-Präfix, `app/src/agent-tasks.mjs:205`) — bezahlt
wird im Wesentlichen die Antwort, also eine kurze Liste.

Modell: `stark`. Zu erkennen, was ein Absatz *in diesem Text* tut, und dafür eine eigene
Sprache zu finden, ist genau die Urteilsleistung, die ein Routine-Modell nicht erbringt —
dieselbe Begründung wie beim Erweiterungslauf (`app/src/agent-tasks.mjs:186`).

## Wo es liegt

In der Begleit-Ablage des Textes: `doc.workspace.bausteinarten`. Dort liegen auch
Anmerkungen und Gesprächsverlauf. Das Dokument selbst bleibt unberührt.

```
doc.workspace.bausteinarten = {
  textsorte: 'Wissenschaftliche Arbeit',   // frei, von der KI benannt
  arten: [
    { id, name: 'Befund',         beschreibung: '…', funktion: 'evidence' },
    { id, name: 'Einschränkung',  beschreibung: '…', funktion: 'counterpoint' },
    { id, name: 'Einordnung',     beschreibung: '…', funktion: null },
  ],
  zuordnung: {
    '<blockId>': { artId, zeichen: <Zeichenzahl des Absatzes bei seiner Benennung> },
  },
  laufSignatur: '<Reihenfolge der Absatz-IDs beim letzten Lauf>',
  standAt: <Zeitstempel>,
}
```

`funktion` stammt aus dem geschlossenen Satz `claim | evidence | counterpoint | transition
| question | null`. Bewusst die vorhandenen englischen Schlüssel: so bleibt die
nachgelagerte Logik unberührt.

`zeichen` je Absatz ist der Grund, warum Namen nicht springen: Ein Absatz behält seinen
Namen, solange seine Länge sich nicht um mehr als die Hälfte verschoben hat — auch wenn der
Lauf wegen eines *anderen* Absatzes startet.

**Bekannte Lücke, bewusst in Kauf genommen:** Ein Absatz, der bei gleicher Länge vollständig
umgeschrieben wird, behält seinen Namen bis zur nächsten Änderung am Absatzbestand. Die
Alternative wäre, den Wortlaut jedes Absatzes ein zweites Mal in der Ablage zu führen — ein
zweites Exemplar des Textes neben dem Text, für einen seltenen Fall.

`ensureWorkspaceState` (`app/src/workspace-model.mjs:107`) normalisiert an Ort und Stelle
und lässt unbekannte Felder stehen — das neue Feld braucht keine zerstörende Umstellung,
nur eine eigene Normalisierung.

## Das stille Bindeglied

Die sechs alten Wörter verschwinden nicht ganz. Sie leben als `funktion` weiter, unsichtbar.
Damit laufen Argument-Karte und Aussagen-Register zum ersten Mal überhaupt: Sie brauchen
eine benannte zentrale Aussage, und die gab es bisher nie.

**Woher `block.role` kommt.** Heute aus dem Tiptap-Merkmal
(`app/src/workspace-model.mjs:147`). Künftig aus der Begleit-Ablage. `getEditorBlocks`
(`app/src/block-identity.js:83`) bekommt dafür eine Rollenquelle gereicht.

Damit keine Aufrufstelle sie vergessen kann, bekommt `workspace.js` **eine** Hilfsfunktion,
die Blöcke immer mit Rollen liefert; alle direkten `getEditorBlocks`-Aufrufe in
`workspace.js` gehen künftig durch sie. Ohne diese Bündelung würde eine vergessene
Aufrufstelle die Rollen stillschweigend verlieren — genau der Fehler, der uns hierher
gebracht hat.

**Der Anzeigename** geht nicht über `block.role`. `renderStructureNav` liest ihn direkt aus
der Ablage, nach dem Muster von `structureHintMap` (`app/src/workspace.js:725`). So bleibt
`block.role` genau das, was es heute ist, und die Anzeige hängt nicht an der Rechenlogik.

## Was verschwindet

| Was | Wo |
|---|---|
| `openInsertMenu` | `app/src/workspace.js:542` |
| `insertBlock` | `app/src/workspace.js:530` |
| `BLOCK_TYPES` | `app/src/workspace.js:112` |
| `ROLE_LABELS` — bis auf die Überschrift | `app/src/workspace.js:121` |

Die Überschrift behält ihr Wort. `block.role` ist für sie weiterhin `heading`, abgeleitet
aus dem Knotentyp (`app/src/workspace-model.mjs:147`) und nicht aus der Ablage;
`renderStructureNav` beschriftet sie unmittelbar damit, ohne Tabelle.
| `placeInsertMenu`, `closeInsertMenu`, `insertMenu` | `app/src/workspace.js` |
| Testzugang `oeffneEinfuegeMenue` | `app/src/workspace.js:4719` |
| `.semantic-insert-menu`, `.semantic-insert-choice` | `app/src/style.css:852`, `:1829`, `:1842`, `:1854`, `:2295`, `:2339`, Kommentar `:2474` |

**`insertSemanticBlock` bleibt** (`app/src/block-identity.js:134`) — es ist die
Einfüge-Mechanik selbst und hängt an `editor.js:108`. Nur das Menü darüber fällt weg.

**Das Merkmal `semanticRole` am Absatz bleibt bestehen, wird aber nicht mehr geschrieben.**
Alte Dokumente behalten es. Ein stilles Umschreiben fremder Dokumente findet nicht statt.
Für Exporte ist es ohnehin bedeutungslos: `normalizeBlock`
(`app/src/publication-export.mjs:118`) verwirft sämtliche Merkmale.

**Übernahme alter Rollen:** Trägt ein gespeichertes Dokument noch Rollen aus der Sechser-Zeit
und hat es keine Ablage, entsteht daraus ein Anfangsbestand mit den alten deutschen Namen.
Der nächste Lauf ersetzt ihn.

## Das Beispielprojekt

Der Pausen-Auslöser schließt das Beispielprojekt aus
(`pruefePausenAusloeser`, `app/src/hinweislauf-model.mjs:114`) — eine Vorführung soll nichts
kosten. Das Beispiel bekommt deshalb einen **mitgelieferten Bestand** an Bausteinarten in
`app/src/example-seed.mjs`, so wie es schon vorgefertigte Anmerkungen hat. Dort ist die
Struktur-Spalte also sofort gefüllt, ohne Schlüssel und ohne Anfrage.

## Neue Dateien

| Datei | Inhalt |
|---|---|
| `app/src/bausteinlauf-model.mjs` | Rein und ohne Browser: Gate, Struktur-Signatur, Antwortverarbeitung, `versucheBausteinlauf` — nach dem Muster von `hinweislauf-model.mjs` und `erweiterungslauf-model.mjs` |
| `app/test/bausteinlauf-model.test.mjs` | Prüfung dieser Rechenlogik |

Ergänzungen: `BAUSTEINARTEN_SCHEMA` und `TASK_TABLE.bausteinarten` in
`app/src/agent-tasks.mjs`; der zugehörige Auftragstext in `app/src/agent-prompts.mjs`;
Normalisierung in `app/src/workspace-model.mjs`; Auslöser und Anzeige in
`app/src/workspace.js`.

## Was geprüft wird

**Ohne Browser** (`app/test/bausteinlauf-model.test.mjs`):

- Der Lauf startet bei neuem, entferntem und verschobenem Absatz, bei einem Absatz ohne
  Namen und bei einem zu mehr als der Hälfte umgeschriebenen Absatz — und **nicht** beim
  Weiterschreiben in einem bereits benannten Absatz.
- Die Grenze „mehr als die Hälfte" ist von außen setzbar und wird an beiden Rändern geprüft.
- Ein unveränderter Absatz behält seinen Namen, wenn der Lauf wegen eines anderen startet.
- Eine Antwort mit unbekannter Art oder unbekannter Funktion wird verworfen, nicht
  eingetragen.
- Aus alten Sechser-Rollen entsteht ein gültiger Anfangsbestand.

**Im Browser** (`app/test/v2-smoke.mjs`, in `runDesktop`): An die Stelle der bisherigen
Menü-Abschnitte tritt der Nachweis, dass die Struktur-Karten des Beispielprojekts erkannte
Namen tragen und dass diese Namen ein Neuladen überstehen.

**Umzudrehen:** `app/test/schreibansicht-ruhe.test.mjs:78-79` verlangt heute, dass
`openInsertMenu` und `insertBlock` im Quelltext stehen. Künftig muss es das Gegenteil
verlangen.

**Nicht stillschweigend fallenlassen.** Die Menü-Abschnitte prüften nebenbei Zusagen, die
nichts mit dem Menü zu tun haben:

- `v2-smoke.mjs:826-857` — dass immer nur **eine** große Fläche offensteht (Menü gegen
  Agent, Menü gegen Belegfenster).
- `v2-smoke.mjs:874-885` — dass Scrollen und Größenänderung eine schwebende Fläche schließen.
- `v2-smoke.mjs:1576-1579` (Tastgerät) — dass eine geöffnete Fläche den Vorschlag beiseiteräumt.

Für jede dieser Zusagen ist vor dem Löschen zu prüfen, ob sie anderswo noch geprüft wird.
Wo nicht, zieht sie auf eine andere schwebende Fläche um. Was ersatzlos entfällt, wird an
Ort und Stelle als entfernt vermerkt — so wie es die vorhandenen `ENTFERNT:`-Notizen tun.

## Was ausdrücklich nicht gebaut wird

- **Kein Weg, eine Bausteinart von Hand zu vergeben oder zu überstimmen.** Wenn die
  Erkennung danebenliegt, ist das ein Fehler der Erkennung, kein Bedienschritt.
- **Kein Einfüge-Weg in der Struktur-Spalte.** Neue Absätze entstehen beim Schreiben.
- **Keine Anzeige der Funktion** (`claim`, `evidence`, …) in der Oberfläche.
- **Kein Umschreiben bestehender Dokumente**, um alte `semanticRole`-Merkmale zu entfernen.

## Offene Enden für später

- `passageFunction` (`app/src/effect-analysis.mjs:46`) bleibt vorerst, wie es ist: Es fragt
  zuerst `block.role` ab und fällt sonst auf Wortmuster zurück. Mit gefüllten Rollen greift
  der obere Zweig wieder. Ob die Wortmuster danach noch gebraucht werden, ist eine eigene
  Frage.
- Der Eval-Katalog (`app/evals/v2-fertigzustand.json`) sagt zu den Bausteinarten heute
  nichts zu; einzig „Bausteine öffnen sich einzeln auf Wunsch" (Fall bei Zeile 1393) betrifft
  die Struktur-Spalte und bleibt unberührt. Ob der Fertigzustand einen eigenen Fall für die
  Erkennung bekommt, entscheidet Jakob getrennt.
