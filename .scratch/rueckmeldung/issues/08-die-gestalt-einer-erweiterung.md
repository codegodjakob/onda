# Die Gestalt einer Erweiterung

Type: prototype
Status: open
Blocked by: 04

## Question

Wie sieht eine Erweiterung aus — und wie unterscheidet sie sich sichtbar von einer
Korrektur?

Das Design System hat bereits eine vollständige Formenlehre für Anmerkungen:
Correction am Wort, Rewrite im Text, Insertion als Lücke, Slot als Zielplatz,
Region für viele Stellen, compare für zwei Stellen, Struktur-Karte für textweit.
Alle folgen dem Satz: *„Die Darstellungsform folgt der Natur der Anmerkung."*

Die offene Frage ist, ob diese Formenlehre trägt. Sie ist um *der Text braucht
etwas* gebaut. Eine Erweiterung ist *du gewinnst etwas*. Möglicherweise passen
`compare` (zwei Stellen) und `Struktur-Karte` (textweit) direkt auf verbindung und
feld — möglicherweise sehen sie dann aber aus wie Mängel.

Zu zeigen:

- weiterführung an einer Stelle, feld ohne Stelle, verbindung über zwei Stellen
- jeweils neben einer echten Korrektur, damit der Unterschied prüfbar wird
- im Dark Mode, der im Design System definiert, aber nie gezeigt ist

Zu beachten: Erweiterungen erscheinen in keiner Bilanzzeile (entschieden beim
Zeichnen der Karte). Sie brauchen also einen Ort, an dem man sie findet, ohne dass
sie sich als offene Posten aufdrängen.

**Antwort ist:** Prototypen der drei Gestalten, plus die Aussage, ob die vorhandene
Formenlehre übernommen, erweitert oder für Erweiterungen verworfen wird.
