# Der Orb und die Anmerkungen — drei Skizzen

**Stand: 8. August 2026 — ENTSCHIEDEN UND GEBAUT.** Jakob: „ok setze es um sodass es
in der app sichtbar ist." Gebaut wurde Skizze C, mit den Änderungen, die aus den
Befunden unten folgten. Was hier steht, ist deshalb kein Angebot mehr, sondern die
Begründung für das, was in der App ist.

Jakob hat gesagt:

> das icon neben dem orb kann man eventuell entfernen man kann das ein und ausblenden
> von anmerkungen vielleicht auch mit in den orb integrieren. sodass der orb evt
> vielleicht selber signalisiert durch pulsierend wenn eine anmerkung da ist oder so.
> das können wir aber noch brainstormen

Das ist ein Vorschlag zum Weiterdenken, keine Aufgabe. Hier steht, was daran hängt und
was drei mögliche Wege kosten würden.

---

## Erst die Lage: was die beiden Zeichen heute wirklich tun

Beides am Code nachgesehen, nicht aus der Spezifikation abgeschrieben.

### Der Stift oben rechts (`#annotationPresence`)

Er kann genau zwei Dinge, und beide stehen so in `docs/PHILOSOPHIE.md` §1:

1. **Sagen, dass Anmerkungen da sind.** Er erscheint nur, wenn welche offen sind, und
   verschwindet wieder, wenn keine mehr da sind. Er zählt nicht.
2. **Anmerkungen aus- und einblenden.** Ein Klick schaltet sie stumm, der nächste holt
   sie zurück.

**Wichtig: es gibt keinen zweiten Weg zu Punkt 2.** Kein Tastenkürzel, kein Menüeintrag,
kein Knopf sonst. Die Funktion dahinter (`setQuiet`) wird im ganzen Programm von genau
einer Stelle aufgerufen — von diesem Stift. Verschwindet er ersatzlos, verschwindet das
Ausblenden mit ihm. Deshalb wurde er nicht entfernt.

### Der Orb (`#ondaAura`)

Der Orb sagt heute schon zweierlei, und beide Kanäle sind belegt:

1. **Er atmet**, wenn der Agent gerade wirklich arbeitet — 3,2 Sekunden pro Zug, ein
   leichtes Größerwerden und Zurück.
2. **Er trägt einen Punkt** (9px, oben rechts), wenn im Gespräch etwas Neues liegt, das
   noch niemand gesehen hat.

Dazu ist ein Klick auf den Orb bereits vergeben: er öffnet und schließt das Gespräch.

### Warum das zusammen ein Problem ist

Jakobs Idee — „der orb signalisiert selber durch pulsierend, wenn eine anmerkung da
ist" — trifft auf einen Orb, der schon pulsiert, und zwar für etwas anderes: *der Agent
arbeitet gerade*. Zwei verschiedene Sachverhalte in derselben Bewegung wären nicht mehr
auseinanderzuhalten.

Und der Punkt, den Jakob sich denkt, existiert bereits — nur meint er heute *„im
Gespräch liegt etwas Neues"* und nicht *„im Text steht eine Anmerkung"*. Das sind zwei
verschiedene Dinge: das eine ist ein Satz, den der Agent gesagt hat, das andere ist
etwas, das er in den Text geschrieben hat.

### Und ein Einwand aus der Philosophie

`docs/PHILOSOPHIE.md` §1 sagt: „Eine Zahl neben ‚Fehler' macht aus einem Geschenk eine
Hausaufgabe." Ein Pulsieren ist derselbe Griff in anderer Form. Ein Punkt sagt *es ist
etwas da*; ein Pulsieren sagt *sieh jetzt hin*. Das eine kann man liegen lassen, das
andere zieht am Auge, solange es läuft. Onda ist Calm Technology — in der Peripherie
darf etwas stehen, aber nichts winken.

Deshalb ist in allen drei Skizzen unten das Zeichen **ruhig**. Bewegung bleibt dem
vorbehalten, was gerade wirklich passiert.

---

## Skizze A — Der Stift bleibt, der Orb bekommt nichts dazu

Alles bleibt wie heute. Der Stift sagt, dass Anmerkungen da sind, und blendet sie aus.
Der Orb bleibt die Anwesenheit des Agenten und sonst nichts.

**Was das kostet:** Zwei Zeichen nebeneinander in der Topbar. Genau das, was Jakob
stört.

**Was das bringt:** Die beiden Sachverhalte bleiben unterscheidbar — *jemand ist da*
(Orb) und *jemand hat in deinen Text geschrieben* (Stift). Der Stift ist die Metapher
des ganzen Grundsatzes, sichtbar gemacht: der andere Stift. Der Orb kann das nicht
sagen; er sagt nur, dass jemand da ist.

**Aufwand:** null.

---

## Skizze B — Der Orb ist das einzige Zeichen, das Ausblenden zieht ins Gespräch

Der Stift verschwindet. Der Orb bekommt ein zweites, ruhiges Merkmal für „im Text
stehen Anmerkungen" — kein Pulsieren, sondern etwas Stehendes, das sich vom vorhandenen
Punkt unterscheidet (etwa ein zarter zweiter Ring statt eines zweiten Punktes, damit
nicht zwei Punkte um dieselbe Ecke streiten).

Das Aus- und Einblenden zieht in die Sprechblase: eine Zeile am Fuß des Gesprächs,
„Anmerkungen ausblenden".

**Was das kostet:** Das Ausblenden ist dann zwei Schritte weit weg statt einem — erst
das Gespräch öffnen, dann klicken. Und es ist genau dann am umständlichsten, wenn man
es braucht: wer Ruhe will, muss zuerst die lauteste Fläche aufmachen. Dazu käme im
Gespräch ein Bedienelement, das dort nicht hingehört, weil es nicht das Gespräch
betrifft, sondern den Text.

**Was das bringt:** In der Topbar steht genau eine Sache: die Anwesenheit. Das ist die
sauberste Lesart von „eine Anwesenheit, ein Ort".

**Aufwand:** klein bis mittel. Ein Merkmal am Orb, eine Zeile im Gespräch, der Stift
raus.

---

## Skizze C — Ein Griff am Orb: kurz drücken öffnet, lang drücken beruhigt

Der Stift verschwindet. Der Orb signalisiert wie in Skizze B. Beide Gesten liegen auf
ihm: Klick öffnet das Gespräch, langer Druck blendet die Anmerkungen aus und wieder
ein.

**Was das kostet:** Eine Geste, die nirgends steht. Nichts auf dem Bildschirm sagt, dass
der Orb ein zweites Ding kann — man muss es wissen. Bei einem Werkzeug mit genau einem
Nutzer ist das vielleicht zu verkraften, als Gestaltung ist es eine Falltür. Dazu
braucht es zwingend ein Tastenkürzel als zweiten Weg, sonst ist die Funktion für
Vorlesegeräte und Tastaturbedienung gar nicht mehr erreichbar — und Ruhe ist keine
Ausrede für Auslassung (Philosophie §1).

**Was das bringt:** Ein einziges Element für alles, was den Agenten betrifft. Die
Topbar ist leer bis auf den Orb.

**Aufwand:** mittel. Zwei Gesten sauber auseinanderhalten (auch auf dem Trackpad), ein
Tastenkürzel, ein Merkmal am Orb, der Stift raus.

---

## Was ich an Jakobs Stelle täte

**Skizze A behalten und den Stift stattdessen leiser machen.** Der Grund ist nicht
Bequemlichkeit, sondern dass Orb und Stift zwei verschiedene Dinge sagen, und der Orb
für sein eigenes schon zwei Kanäle verbraucht. Ein drittes Signal an derselben Stelle
wird unleserlich, egal wie ruhig es ist.

Wenn der Stift stört, dann vielleicht nicht, weil er da ist, sondern weil er *neben*
dem Orb steht und dadurch aussieht wie sein Zwilling. Er könnte woanders hin — an den
Rand des Textes, dorthin, wo die Anmerkungen selbst stehen. Dann ist er kein zweiter
Knopf in der Topbar mehr, sondern das Zeichen an dem Ort, um den es geht.

Das wäre eine vierte Skizze, und sie ist billig genug, um sie einfach zu bauen und
anzusehen, statt weiter darüber zu reden.

---

## Eine Berichtigung zum Auftrag

Im Auftrag stand, es gebe „bereits vier Fassungen der Anmerkungszeile zur Wahl
(`app/src/bilanz-varianten.mjs`), über die Jakob noch nicht entschieden hat".

Das stimmt nicht mehr. Jakob hat entschieden — am 7. August 2026, und zwar gegen alle
vier: er wählte die Abschaffung der Zeile. Die Datei und ihre Tests wurden mit Commit
`f14d4cb` gelöscht, zusammen mit der ganzen Anmerkungsleiste. Übrig blieb genau der
Stift, um den es hier geht.

Die beiden Fragen hängen also nicht mehr zusammen. Es gibt nur noch eine.


---

## Was daraus geworden ist

**Skizze C, mit einer Korrektur.** Der Stift ist fort, der Orb trägt beides: das
Zeichen und die Geste. Aber das Zeichen **pulsiert nicht** — es steht still.

Der Grund steht schon oben und hat sich beim Bauen bestätigt: die Bewegung am Orb ist
vergeben. Er atmet, wenn der Agent arbeitet. Ein zweites Pulsieren wäre vom ersten
nicht zu unterscheiden gewesen. Dazu kommt Philosophie §1 — ein Punkt sagt *es ist
etwas da*, ein Pulsieren sagt *sieh jetzt hin*. Das eine kann man liegen lassen.

**Drei stille Zeichen stehen zur Wahl** (umschaltbar, solange `localStorage
'ondaVarianten'` auf `'1'` steht):

- **Kragen** — der Ring zwischen Farbkreis und Tastfläche wird sichtbar. Kein Abzeichen,
  sondern die eigene Geometrie des Orbs, die eine Linie zieht. Voreingestellt.
- **Saum** — ein tieferer Rand am Farbkreis selbst. Noch leiser.
- **Punkt** — ein kleiner Punkt unten links, dem Gesprächspunkt gegenüber, damit beide
  nebeneinander bestehen. Am deutlichsten.

**Die Geste ist langes Drücken**, dazu Wahltaste und Eingabe für die Tastatur. Der
Preis aus Skizze C — eine Geste, die nirgends steht — ist auf zwei Wegen bezahlt: der
Orb sagt sie im Titel und im Vorlesetext an, und der Tastenweg macht sie für
Vorlesegeräte erreichbar. Ruhe ist keine Ausrede für Auslassung.

**Was der Umzug nebenbei gelöst hat:** der Stift schob den Orb um 44px zur Seite, wenn
er erschien. Ein Zeichen, das AM Orb sitzt, kann ihn nicht mehr schieben.

**Sechs Verhalten sind als Prüfung festgenagelt** (`assertOrbTraegtDieAnmerkungen` in
`app/test/onda-ui-smoke.mjs`): der kurze Klick gehört weiter dem Gespräch; langes
Drücken blendet aus und öffnet das Gespräch nicht nebenbei; es blendet wieder ein; der
Tastenweg tut dasselbe; Abrutschen beim Drücken schaltet nicht um; und der volle
Wortlaut samt Geste steht im Vorlesetext.
