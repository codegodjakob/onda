# EFFECT-06 · Protokoll für reale Kommunikationswirkung

**Status:** extern offen
**Version:** 1.0
**Datum:** 2026-07-30
**Zweck:** Reale Wirkung einer wichtigen Textfassung aufgabenbezogen prüfen, ohne Lesbarkeit, Präferenz und tatsächliches Verstehen gleichzusetzen.

## Harte Vorbedingungen

Eine Durchführung beginnt erst, wenn folgende Felder ausgefüllt sind:

- Projekt- und Text-ID sowie unveränderliche Prüffassung mit Prüfsumme;
- klar benannte Zielgruppe und überprüfbare Rekrutierungskriterien;
- eine reale Leseraufgabe, die zum Kommunikationsziel passt;
- genau ein primäres Wirkungsmaß;
- Vergleichsfassung und vorab festgelegte Auswertungsregel;
- Einwilligung, Datensparsamkeit und Abbruchregel.

Fehlt eine Vorbedingung, bleibt `EFFECT-06` `external-open`. Testpersonen werden weder simuliert noch durch Modellurteile ersetzt.

## Studiendesign

### 1. Prüffrage

Vor Rekrutierung ausfüllen:

- **Zielgruppe:** …
- **Text und Nutzungssituation:** …
- **Leseraufgabe:** …
- **Beabsichtigte Veränderung:** …
- **Primäres Maß:** Verstehen | Finden | Erinnern | Handeln
- **Erfolgskriterium:** …
- **Nicht als Erfolg gewertet:** Lesbarkeit, Gefallen oder „professioneller Eindruck“ allein

### 2. Fassungen

- **Fassung A:** aktuelle bzw. überarbeitete Fassung
- **Fassung B:** sachlich gleichwertige Vergleichsfassung
- Beide Fassungen müssen Aussage, Zahlen, Einschränkungen, Quellen und Handlungsoptionen bewahren.
- Reihenfolge wird randomisiert oder zwischen Teilnehmenden ausgeglichen.
- Die prüfende Person sieht während der Auswertung nur neutrale Fassungskennungen.

### 3. Teilnehmende

- Nur reale Mitglieder oder belastbare Stellvertretungen der Zielgruppe.
- Einschluss- und Ausschlusskriterien werden vorab festgelegt.
- Für eine richtungsweisende formative Prüfung: mindestens 8 auswertbare Personen je Reihenfolgegruppe.
- Für eine entscheidungsrelevante Veröffentlichung: Fallzahl vorab anhand des primären Maßes begründen; keine nachträgliche Zieländerung aufgrund des Ergebnisses.
- Abbrüche, Ausschlüsse und fehlende Werte werden mit Grund berichtet.

### 4. Ablauf

1. Einwilligung und knappe Kontextfrage ohne vertrauliche Projektdaten.
2. Zuweisung einer neutral gekennzeichneten Fassung.
3. Bearbeitung der realistischen Leseraufgabe ohne Hilfestellung.
4. Erhebung des primären Maßes.
5. Getrennte Erhebung sekundärer Maße: Lesbarkeit, subjektive Sicherheit, Präferenz und offene Fehlvorstellungen.
6. Bei einem Within-Subjects-Design: Pause, Gegenbalancierung und zweite Fassung.
7. Abschlussfrage nach missverständlichen, druckvollen oder unfairen Passagen.

## Messregeln

| Primäres Maß | Beobachtbarer Wert | Beispiel |
|---|---|---|
| Verstehen | vorab codierte richtige Unterscheidungen und korrekt genannte Grenzen | Teilnehmende unterscheiden Befund und Schlussfolgerung |
| Finden | Anteil korrekt gefundener Informationen und Zeit bis zum Fund | eine Einschränkung im Text lokalisieren |
| Erinnern | nach definierter Verzögerung korrekt reproduzierte Kernaussagen und Grenzen | Kernaussage plus Einschränkung erinnern |
| Handeln | korrekt ausgeführter, realitätsnaher nächster Schritt | passende Option auswählen oder Formularschritt abschließen |

Lesbarkeit, Präferenz, Vertrauen und Bearbeitungszeit werden separat berichtet. Kein sekundäres Maß darf ein Scheitern des primären Maßes verdecken.

## Fairness- und Sicherheitskontrolle

- Keine ausnutzende Personalisierung, künstliche Dringlichkeit oder Schuldinduktion in der Rekrutierung.
- Keine vertraulichen Projektinhalte in Rohdaten oder Freitextexporten.
- Demografie nur erheben, wenn sie für die Prüffrage erforderlich ist.
- Ergebnisse kleiner Teilgruppen nicht deanonymisieren.
- Unerwartete Fehlvorstellungen und Gegenreaktionen werden erhalten, nicht geglättet.

## Vorab festgelegte Auswertung

- Primäres Maß je Fassung mit Anzahl, Nenner und Unsicherheitsbereich berichten.
- Vergleichsrichtung und kleinste praktisch relevante Differenz vorab festlegen.
- Abbruch, Ausschluss, fehlende Werte und Reihenfolgeeffekte offen ausweisen.
- Sekundäre Maße getrennt tabellieren.
- Keine Kausalbehauptung außerhalb des gewählten Designs.
- Bei unklarem oder negativem Ergebnis: ehrliche Enthaltung statt nachträglicher Metrikwechsel.

## Ergebnisdatensatz

```json
{
  "schemaVersion": 1,
  "evalId": "EFFECT-06",
  "status": "external-open",
  "studyId": "",
  "protocolVersion": "1.0",
  "textId": "",
  "textChecksumSha256": "",
  "targetAudience": "",
  "readerTask": "",
  "primaryMeasure": "understanding|finding|recall|action",
  "successCriterion": "",
  "comparisonDesign": "",
  "recruitment": {
    "included": 0,
    "excluded": 0,
    "criteria": []
  },
  "results": {
    "versionA": null,
    "versionB": null,
    "uncertainty": null
  },
  "secondaryMeasures": {
    "readability": null,
    "preference": null,
    "confidence": null,
    "misconceptions": []
  },
  "limitations": [],
  "decision": "pending",
  "completedAt": null
}
```

`status` darf erst nach echter Durchführung und dokumentierter Auswertung auf `passed` oder `failed` wechseln. Ein bloßer Probelauf der Oberfläche, ein LLM-Judge oder eine synthetische Persona reicht nicht.
