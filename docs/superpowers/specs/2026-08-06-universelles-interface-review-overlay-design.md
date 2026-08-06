---
artifact: design-specification
version: "1.0"
created: 2026-08-06
status: draft-for-review
---

# Universelles Interface-Review-Overlay

## Ziel

Ein persönliches, lokales Entwicklungswerkzeug legt sich im Entwicklungsmodus über browserbasierte Apps. Der Nutzer kann ein sichtbares Element anklicken, seine wesentlichen Gestaltungswerte prüfen, reversible Varianten ausprobieren und eine Änderung oder Notiz exakt an diesem Element speichern. Codex kann die aktuelle Auswahl und alle offenen Aufträge lokal auslesen, den echten Quellcode ändern und das Ergebnis gegen die gespeicherte Absicht prüfen.

Onda ist die erste Produktintegration, aber nicht Eigentümerin des Werkzeugs. Der Kern bleibt unabhängig von Onda, Framework und Produktsprache. Das Datenprotokoll lässt einen späteren SwiftUI-/AppKit-Adapter zu, ohne Web-DOM-Begriffe zum gemeinsamen Vertrag zu machen.

## Produktentscheidungen

- Das MVP ist ein persönliches, lokales Werkzeug und noch kein öffentlich gepflegtes npm-Produkt.
- Das MVP unterstützt browserbasierte Apps; eine native macOS-Integration folgt als eigener Ausbauschritt.
- Die Integration erfolgt über ein eigenständiges Toolkit und einen kleinen Adapter im jeweiligen Entwicklungsserver.
- Die Oberfläche verwendet ein festes, einklappbares Seitenpanel nach dem Figma-Prinzip.
- Änderungen sind zuerst reversible Vorschauen. Das Overlay schreibt niemals selbstständig Quellcode um.
- Kommentare sind entweder nachverfolgbare `Änderungen` oder unverbindliche `Notizen`.
- Review-Daten liegen projektbezogen und standardmäßig nicht versioniert unter `.interface-review/`.
- Das Werkzeug wird ausschließlich im Entwicklungsmodus geladen und kommuniziert nur lokal.

## Umfang des MVP

### Enthalten

- Designmodus ein- und ausschalten
- Hover-Markierung und eindeutige Einzelauswahl
- festes, einklappbares Inspector-Panel
- lesbare Elementhierarchie und Box-Modell-Werte
- kontrollierte Vorschauen für Layout, Abstände, Typografie, neutrale Darstellung und einfachen Text
- exaktes Zurücksetzen einzelner Werte oder der ganzen Vorschau
- Änderung oder Notiz an der aktuellen Auswahl
- Status `offen`, `in_arbeit` und `erledigt` für Änderungen
- projektlokale, atomare Speicherung
- lokale CLI für aktuelle Auswahl, Listen, Details, Prüfung und Statuswechsel
- Wiederfinden nach Reload oder clientseitiger Navigation
- fail-closed Verhalten bei mehrdeutigen oder verschwundenen Elementen
- Onda-Adapter im bestehenden Live-Server
- generische dynamische Test-App als zweiter Integrationsbeleg

### Nicht enthalten

- freie Pixelverschiebung oder unbeschränktes Drag-and-drop
- Mehrfachauswahl
- automatisches Umschreiben von CSS-, React-, Vue-, Svelte- oder Swift-Dateien
- Cloud-Synchronisierung, Benutzerkonten oder Mehrbenutzerbetrieb
- Browser-Erweiterung
- automatische Screenshots
- nativer SwiftUI-/AppKit-Adapter
- öffentliche Paketveröffentlichung oder Stabilitätszusage für Fremdnutzer

## Systemgrenzen

Das Toolkit liegt als eigenständiges ESM-Paket unter `tools/interface-review/`. Es besitzt keine Abhängigkeit vom Onda-Datenmodell. Onda bindet nur den Serveradapter in `app/scripts/dev-server.mjs` ein und erhält den Browser-Client ausschließlich über die lokale HTTP-Antwort.

```text
tools/interface-review/
  package.json
  src/
    browser/       Auswahl, Shadow-DOM-Oberfläche, Vorschau, Pins
    protocol/      neutrale Schemata und Validierung
    server/        lokaler Sitzungsspeicher und HTTP-Adapter
    cli/           menschen- und maschinenlesbare Befehle
  test/
    fixtures/      statische und dynamische Host-App
    *.test.mjs

app/
  scripts/dev-server.mjs   Onda-Adapter
```

Die physische Paketgrenze ist absichtlich früh vorhanden. Ein späteres Herauslösen in ein eigenes Repository oder ein privates Paket benötigt dadurch keine Zerlegung von Onda-Code.

## Architektur

### 1. Browser-Kern

Der Browser-Kern beobachtet Zeiger, Tastatur, Scroll-, Resize- und Navigationsereignisse. Er entscheidet ausschließlich über Auswahl und Darstellung; Dateizugriff und Quellcodeänderungen gehören nicht zu seinen Aufgaben.

Seine sichtbare Oberfläche liegt in einem geschlossenen Shadow DOM. App-Styles dürfen Panel, Auswahlrahmen, Pins oder Fokuszustände nicht verändern. Umgekehrt dürfen Overlay-Styles nicht in die App gelangen. Auswahlrahmen und Pins werden in einer separaten festen Ebene gezeichnet und anhand von `getBoundingClientRect()` aktualisiert.

Das Overlay selbst, Skripte, Styles, nicht sichtbare Knoten, `head`, `body` und explizit ausgeschlossene Bereiche sind nicht auswählbar.

### 2. Element-Inspektor

Der Inspektor erzeugt aus einer Auswahl einen neutralen `ElementReference`-Datensatz. Priorität beim Wiederfinden:

1. explizites projektseitiges `data-interface-review-id`
2. stabiles DOM-`id`, sofern es im Dokument eindeutig und nicht offensichtlich generiert ist
3. zugängliche Rolle und Name
4. stabile Attribute aus einer engen Erlaubnisliste
5. kurzer normalisierter Textausschnitt
6. begrenzte Ahnen- und Geschwistermerkmale

Kein einzelnes schwaches Merkmal genügt. Der Resolver bewertet Kandidaten deterministisch und akzeptiert nur einen eindeutigen Treffer oberhalb der dokumentierten Schwelle. Zwei ähnlich gute Kandidaten führen zu `erneut_auswaehlen`.

Der gemeinsame Vertrag spricht von Rolle, Name, Hierarchie und geometrischem Kontext. DOM-Selektoren bleiben ein optionales Web-Detail. Ein späterer macOS-Adapter kann dieselbe Referenz mit Accessibility-Rolle, Identifier und View-Hierarchie füllen.

### 3. Festes Inspector-Panel

Auf Desktop liegt das 320 Pixel breite Panel fest über der rechten Seite, ohne die tatsächliche Viewportbreite der App zu verändern. So löst das Werkzeug nicht unbemerkt responsive Breakpoints aus. Das Panel kann eingeklappt und später links angedockt werden; im MVP ist rechts die Voreinstellung.

Unter 720 Pixel wird es zu einer einklappbaren unteren Fläche. Der Auswahlrahmen bleibt sichtbar. Panel und App sind per Tastatur erreichbar, ohne eine unsichtbare Fokusfalle zu erzeugen.

Das Panel enthält:

- `Auswahl`: verständlicher Name, Rolle, Route, Breadcrumb und Zuordnungsstatus
- `Gestaltung`: relevante Istwerte und kontrollierte Vorschaufelder
- `Inhalt`: Vorschau eines einfachen Blatt-Textknotens
- `Kommentare`: Änderung oder Notiz anlegen
- `Sitzung`: offene Vorschauen, Aufgaben und Rücksetzpunkte

### 4. Vorschau-Engine

Die Engine hält eine geordnete Liste von Deltas. Jedes Delta besitzt Eigenschaft, normalisierten Ausgangswert und Vorschauwert. Erlaubt sind im MVP:

- Breite, Mindest- und Maximalbreite
- Höhe, Mindest- und Maximalhöhe
- Margin, Padding und Gap
- Flex-/Grid-Ausrichtung, sofern die Eigenschaft am gewählten Element wirksam ist
- Schriftgröße, Gewicht, Zeilenhöhe und Zeichenabstand
- Textfarbe, Hintergrund, Rahmen, Radius und Deckkraft
- einfacher sichtbarer Text eines Blattknotens

Freie CSS-Regeltexte, Selektoren, URLs, `content`, Animationen, Positionierung und beliebiges HTML sind nicht erlaubt. Ein Wert wird vor der Anwendung geparst und gegen Eigenschaftsregeln geprüft.

`Zurücksetzen` stellt bytegleich den zuvor erfassten Inline-Zustand und sichtbaren Text wieder her. Ein Reload entfernt nicht freigegebene Vorschauen. Freigegebene Änderungen bleiben als Aufgabe gespeichert, werden aber nicht automatisch erneut als Stil über die App gelegt.

### 5. Review-Protokoll und Speicherung

Die Daten liegen in `.interface-review/`:

```text
.interface-review/
  config.json
  current-selection.json
  records/
    <record-id>.json
  archive/
```

`current-selection.json` ist flüchtiger Arbeitskontext. Ein gespeicherter Datensatz besitzt mindestens:

```json
{
  "protocolVersion": 1,
  "id": "ir_...",
  "projectId": "onda",
  "kind": "change",
  "status": "open",
  "page": { "pathname": "/" },
  "element": {
    "role": "region",
    "name": "Wortwahl",
    "textHint": "Doppelt abgeschwächt",
    "locatorHints": []
  },
  "request": "Weniger visuelle Schwere",
  "preview": [
    { "property": "border-radius", "before": "8px", "after": "4px" }
  ],
  "resolution": { "state": "matched", "score": 1 },
  "createdAt": "2026-08-06T21:00:00.000Z",
  "updatedAt": "2026-08-06T21:00:00.000Z"
}
```

Schemafelder werden versioniert und vor jedem Schreiben validiert. Änderungen besitzen einen Arbeitsstatus; bei Notizen fehlt dieses Feld ausdrücklich. Textausschnitte und Kommentare besitzen Größenlimits. Temporäre Ports, vollständige URLs mit Tokens, Eingabewerte aus Passwortfeldern und andere sensible Feldwerte werden nicht gespeichert.

Schreibvorgänge verwenden eine temporäre Datei im selben Verzeichnis und atomare Umbenennung. Eine beschädigte Einzeldatei wird als Fehlerdatensatz gemeldet und blockiert weder Auswahl noch andere Records.

### 6. Lokale Brücke und CLI

Der Adapter stellt einen schmalen lokalen HTTP-Vertrag bereit:

- den bereits serverseitig erzeugten und in den Browser-Client injizierten Sitzungsschlüssel prüfen
- aktuelle Auswahl aktualisieren und lesen
- Record anlegen, lesen und validiert aktualisieren
- Verbindungszustand prüfen

Die Brücke bindet ausschließlich an `127.0.0.1`, prüft Origin und Sitzungsschlüssel, begrenzt Body-Größen und erlaubt keine frei auflösbaren Dateipfade. Sie besitzt keinen Proxy ins Internet.

Die CLI bietet stabile Befehle für Mensch und Agent:

```text
interface-review current [--json]
interface-review list [--status open] [--kind change] [--json]
interface-review show <id> [--json]
interface-review verify <id> [--json]
interface-review status <id> <open|in_progress|resolved>
```

`resolved` wird nur nach erfolgreicher Neuprüfung oder mit ausdrücklich gespeicherter manueller Begründung akzeptiert. Die CLI liefert eindeutige Exitcodes für `gefunden`, `nicht_gefunden`, `mehrdeutig`, `ungueltig` und `bruecke_nicht_erreichbar`.

### 7. Projektadapter

Das Toolkit exportiert einen kleinen Adaptervertrag statt einen vollständigen zweiten Dev-Server zu erzwingen. Der Host verantwortet Build und statische Auslieferung. Der Adapter verantwortet:

- Browser-Asset nur in die Entwicklungsantwort injizieren
- Review-Endpunkte an den lokalen Host hängen
- Projektwurzel, Projekt-ID und erlaubte Origin konfigurieren
- Sitzung beim Herunterfahren schließen

Onda erweitert den vorhandenen `npm run dev`-Server. `app/index.html`, `dist/editor.bundle.js`, `Onda.app` und alle Produktionsbuilds bleiben frei von Review-Code.

Eine generische dynamische Fixture-App belegt, dass der Vertrag nicht von Onda-Klassen, Onda-Daten oder Tiptap abhängt.

## Bedienablauf

1. Der Entwickler startet die App im Entwicklungsmodus.
2. `⌘⇧E` oder die kleine lokale Schaltfläche aktiviert den Designmodus.
3. Hover zeigt Elementgrenzen und einen verständlichen Namen.
4. Klick wählt ein Element; `Esc` hebt die Auswahl auf.
5. Gedrückte Leertaste gibt Interaktionen vorübergehend an die App weiter, außer der Fokus liegt in einem Texteingabefeld.
6. Änderungen im Panel erscheinen sofort als reversible Vorschau.
7. Der Nutzer setzt zurück oder gibt die Änderung zur Umsetzung frei.
8. Eine Freigabe erzeugt einen offenen Record; eine Notiz erzeugt einen nicht verpflichtenden Record ohne Arbeitsstatus.
9. Codex liest `current` oder `list`, verändert den echten Code und ruft `verify` auf.
10. Nur ein eindeutiger, passender Zustand darf als erledigt markiert werden.

Beim Scrollen, Resizing, DOM-Austausch und clientseitiger Navigation werden Rahmen und Pins neu berechnet. Verschwindet das aktive Element, bleibt der Record erhalten und das Panel zeigt den Wiederfindungszustand.

## Fehler und Erholung

- **Brücke offline:** Auswahl und Vorschau bleiben verfügbar. Dauerhaftes Speichern ist deaktiviert; ein Record kann als JSON kopiert werden. Nach Wiederverbindung wird nicht ungefragt synchronisiert.
- **Mehrdeutige Auswahl:** Das Panel zeigt Kandidatenzahl und fordert erneute Auswahl. Es wird kein Kandidat automatisch gewählt.
- **Element verschwunden:** Der Record bleibt offen und erhält `not_found`.
- **Ungültiger Vorschauwert:** Der alte Wert bleibt sichtbar; Feld und Grund werden lokal erklärt.
- **App rendert Auswahl neu:** Der Resolver versucht genau einmal die eindeutige Wiederzuordnung. Ohne eindeutigen Treffer stoppt er.
- **Beschädigter Record:** Nur dieser Record wird isoliert als ungültig gemeldet.
- **Schreibfehler:** Die vorherige vollständige Datei bleibt erhalten; das Panel bietet Wiederholen oder JSON-Export.
- **Sitzung abgelaufen:** Der Adapter erzeugt nach bewusster Wiederverbindung einen neuen Schlüssel; alte Requests werden abgewiesen.
- **Overlay-Fehler:** Der Host bleibt bedienbar. Das Overlay besitzt einen globalen Not-Aus über `⌘⇧E` und entfernt seine Ereignislistener beim Schließen.

## Barrierefreiheit und Ergonomie

- Designmodus, Panelabschnitte, Felder, Pins und Status besitzen zugängliche Namen.
- Fokus ist sichtbar und nicht ausschließlich farblich codiert.
- Alle Hauptaktionen sind per Tastatur erreichbar.
- Das Panel fängt keine App-Tastenkürzel ab, solange Fokus und Designmodus dies nicht erfordern.
- Bei 200 Prozent Zoom bleiben Auswahl, Rücksetzen und Schließen erreichbar.
- Das Overlay übernimmt weder Schrift noch Kontrast der Host-App.
- Animationen respektieren `prefers-reduced-motion`.
- Die Auswahlreaktion erscheint bei einem warmen lokalen Stand innerhalb von 100 Millisekunden.

## Datenschutz und Sicherheit

- keine externe Netzwerkverbindung
- keine Cloud, Telemetrie oder Hintergrundübertragung
- Bindung nur an `127.0.0.1`
- kurzlebiger, zufälliger Sitzungsschlüssel
- Origin-Prüfung und enge HTTP-Methoden
- keine Speicherung aus Passwort-, Secret-, Token- oder Zahlungsfeldern
- begrenzte Textausschnitte statt vollständiger Seitenkopien
- sichere Pfadauflösung ausschließlich unter der konfigurierten Review-Wurzel
- keine Ausführung von Kommentartext als HTML oder Code

## Prüfstrategie

### Unit- und Vertragstests

- Protokollschema, Migration und Größenlimits
- deterministische Fingerprints
- eindeutiger, mehrdeutiger und fehlender Resolver
- erlaubte und abgewiesene Vorschauwerte
- exaktes Rücksetzen von Stil und Text
- Statusmaschine für Änderung und Notiz
- atomare Speicherung und isolierter beschädigter Record
- CLI-Ausgabe und Exitcodes
- Origin-, Token-, Pfad- und Body-Begrenzung

### Browser-E2E

- Auswahl in einer statischen Host-App
- Auswahl nach dynamischem DOM-Austausch und clientseitiger Navigation
- Shadow-DOM-Isolation gegen absichtlich kollidierende Host-Styles
- Vorschau, Einzelreset und Gesamtrücksetzung
- Änderung und Notiz speichern, neu laden und wiederfinden
- fail-closed bei zwei ähnlichen Kandidaten
- Tastaturablauf und 200-Prozent-Zoom
- 1440, 1024, 720 und 320 Pixel
- Light- und Dark-Host-App
- Onda-Bibliothek, Editor und eine Anmerkungskarte

### Produktionsabgrenzung

- normaler Onda-Build enthält keine Review-Endpunkte, Clientmarker oder Review-Bundles
- `Onda.app` enthält keine `.interface-review`-Daten
- deaktivierter Adapter verändert Antwortbytes und App-Verhalten nicht

### Visuelle Evaluationsschleife

Es gibt höchstens drei Iterationen. Jede Runde bewertet Auswahlklarheit, Panel-Hierarchie, Verständlichkeit, Störungsfreiheit und Zustandsklarheit von 1 bis 5. Jede Dimension muss mindestens 4,5 erreichen. Die Schleife endet früher, wenn alle harten Tore bestehen und der Gesamtscore nicht mehr steigt.

## Akzeptanzkriterien

### Story-Kontext

Ein Nutzer möchte eine lokale Web-App visuell untersuchen, reversible Änderungen ausprobieren und einen eindeutig an Quellcodearbeit anschließbaren Review-Auftrag speichern, ohne Produktionscode oder Host-App zu gefährden.

### Hauptpfad

#### AC-1: Element eindeutig auswählen

**Given** eine lokale App mit aktivem Review-Adapter

**When** der Nutzer den Designmodus aktiviert und ein sichtbares App-Element anklickt

**Then** werden genau dieses Element, sein verständlicher Name und seine wesentlichen Istwerte innerhalb von 100 Millisekunden im festen Panel angezeigt.

#### AC-2: Reversible Vorschau

**Given** ein eindeutig ausgewähltes Element

**When** der Nutzer einen erlaubten Gestaltungs- oder Textwert verändert und anschließend zurücksetzt

**Then** erscheint die Änderung sofort und der vorherige sichtbare sowie gespeicherte Inline-Zustand wird exakt wiederhergestellt.

#### AC-3: Änderung zur Umsetzung freigeben

**Given** eine aktive Vorschau und ein erläuternder Änderungswunsch

**When** der Nutzer `Zur Umsetzung freigeben` wählt

**Then** entsteht genau ein valider offener Record mit Elementbezug, Ausgangswert, Zielwert, Kommentar und Zeitstempeln.

#### AC-4: Codex liest „das hier“

**Given** eine aktuelle eindeutige Auswahl

**When** `interface-review current --json` ausgeführt wird

**Then** liefert die CLI einen validen, maschinenlesbaren Datensatz für genau diese Auswahl und keine unbeteiligten Seiteninhalte.

#### AC-5: Ergebnis prüfen und abschließen

**Given** ein offener Änderungsrecord und eine danach neu gebaute App

**When** die CLI den Record prüft

**Then** darf er nur bei eindeutiger Elementzuordnung und erfülltem Zielzustand als erledigt markiert werden.

### Grenzfälle

#### AC-6: Dynamisch ersetztes Element wiederfinden

**Given** ein gespeicherter Record in einer clientseitig navigierenden App

**When** das Framework den DOM-Knoten ersetzt, aber seine semantische Identität eindeutig bleibt

**Then** wird der neue Knoten demselben Record zugeordnet und Pin sowie Panel aktualisieren sich.

#### AC-7: Mehrdeutigkeit bleibt sichtbar

**Given** zwei ähnlich gute Kandidaten für einen gespeicherten Elementbezug

**When** die Seite oder der Record erneut geprüft wird

**Then** wird keiner automatisch gewählt und der Nutzer erhält die Handlung `Element erneut auswählen`.

#### AC-8: Kleine Breite und Zoom

**Given** 320 Pixel Breite oder 200 Prozent Zoom

**When** der Designmodus verwendet wird

**Then** bleiben ausgewähltes Element, Panel-Schließen, Zurücksetzen und Kommentaraktion ohne unbeabsichtigtes horizontales Scrollen erreichbar.

### Fehlerzustände

#### AC-9: Lokale Brücke fällt aus

**Given** eine laufende Auswahl- oder Vorschauarbeit

**When** die lokale Brücke nicht mehr erreichbar ist

**Then** bleiben Auswahl und Vorschau bedienbar, Speichern wird klar als offline angezeigt und Wiederholen oder JSON-Export stehen bereit.

#### AC-10: Ungültiger Wert

**Given** ein editierbares Vorschaufeld

**When** ein für die Eigenschaft ungültiger oder unsicherer Wert eingegeben wird

**Then** wird er nicht auf die App angewendet und das Panel erklärt die zulässige Korrektur.

#### AC-11: Beschädigter Record

**Given** ein ungültiger Record neben gültigen Review-Daten

**When** Overlay oder CLI die Review-Sitzung lädt

**Then** bleibt der ungültige Record isoliert sichtbar und alle gültigen Records bleiben les- und bearbeitbar.

### Nichtfunktionale Kriterien

#### AC-12: CSS-Isolation

**Given** eine Host-App mit absichtlich kollidierenden globalen Styles

**When** das Overlay geladen wird

**Then** entsprechen Panel, Auswahl, Pins und Fokuszustände weiterhin ihren eigenen visuellen Verträgen und keine Overlay-Regel verändert Host-Elemente.

#### AC-13: Lokale Sicherheit

**Given** ein laufender Review-Adapter

**When** Bindung, Origin, Sitzungsschlüssel, Pfadauflösung und gespeicherte Felder geprüft werden

**Then** ist die Brücke nur lokal erreichbar, weist unautorisierte Requests ab und speichert keine ausgeschlossenen sensiblen Werte.

#### AC-14: Produktionsfreiheit

**Given** eine zuvor verwendete Review-Sitzung

**When** der normale Produktions- oder Mac-Build entsteht

**Then** enthält das Ergebnis weder Overlay-Code noch Endpunkte, Schlüssel, Kommentare oder `.interface-review`-Daten.

#### AC-15: Host-Unabhängigkeit

**Given** Onda und die generische dynamische Fixture-App

**When** derselbe Auswahl-, Vorschau-, Speicher- und Wiederfindungsablauf geprüft wird

**Then** bestehen beide denselben Adaptervertrag ohne produktspezifische Ausnahme im Toolkit-Kern.

## Ausbau-Roadmap

Jeder Schritt beginnt erst, wenn die harten Tore des vorherigen Schritts grün sind. Jeder Schritt erhält vor Umsetzung eine eigene kurze Spezifikation und einen eigenen Eval-Nachweis. So kann direkt weitergebaut werden, ohne den MVP nachträglich umzudeuten.

### Ausbau 1: Quellzuordnung und sichere Patch-Vorschläge

**Startbedingung:** MVP-Abnahmekriterien AC-1 bis AC-15 sind erfüllt.

**Ziel:** Runtime-Auswahl wird mit einer konkreten Quellkomponente und möglichst engem Dateibereich verbunden. Das Werkzeug erzeugt einen Patch-Vorschlag, schreibt und committet aber weiterhin nicht selbstständig.

**Lieferumfang:**

- optionale Build-Metadaten für Vanilla, React, Vue und Svelte
- Source-Map- und Komponentenhinweise im `ElementReference`
- CLI-Ausgabe mit wahrscheinlicher Datei, Komponente und Vertrauensgrad
- strukturierter Patch-Auftrag für Codex
- Diff-Vorschau und explizite Nutzerfreigabe
- fail-closed bei mehreren möglichen Quellen

**Fertig, wenn:** Mindestens je eine Fixture pro Framework ordnet Auswahl und Quellstelle eindeutig zu; mehrdeutige Fälle erzeugen keinen Patch.

### Ausbau 2: Nativer macOS-Adapter

**Startbedingung:** Das neutrale Protokoll hat sich im MVP und Ausbau 1 ohne Web-spezifische Pflichtfelder bewährt.

**Ziel:** Derselbe Review-Ablauf funktioniert in lokalen SwiftUI- und AppKit-Debug-Builds.

**Lieferumfang:**

- Swift-Paket mit Debug-only Overlay
- Auswahl über Accessibility-Rolle, Identifier und View-Hierarchie
- SwiftUI-Modifier für stabile Review-IDs
- AppKit-Adapter für NSView-Hierarchien
- gemeinsamer Record- und CLI-Vertrag
- Vorschau ausgewählter sicherer Layout- und Typografiewerte, soweit das jeweilige Framework dies reversibel erlaubt
- garantierter Ausschluss aus Release- und signierten Distributionsbuilds

**Fertig, wenn:** Eine SwiftUI- und eine AppKit-Fixture Auswahl, Kommentar, Wiederfinden und Produktionsfreiheit nach demselben Protokoll bestehen.

### Ausbau 3: Fortgeschrittenes Figma-artiges Arbeiten

**Startbedingung:** Element- und Quellzuordnung sind zuverlässig genug, um strukturelle Vorschläge verständlich abzubilden.

**Ziel:** Mehrere Varianten und layoutbewusste Manipulationen werden möglich, ohne responsives Verhalten in starre Pixelkoordinaten zu übersetzen.

**Lieferumfang:**

- Mehrfachauswahl
- Varianten A/B/C mit visueller Vergleichsleiste
- Design-Token-Erkennung und Bearbeitung statt bloßer Rohwerte
- komponentenweite versus instanzbezogene Änderung
- eingeschränktes Drag-and-drop für nachweisbare Flex- und Grid-Operationen
- Constraints für Resize, Ausrichtung und Reihenfolge
- Sitzungsweites Undo/Redo

**Fertig, wenn:** Manipulationen bei Desktop, 720 und 320 Pixel semantisch gleich bleiben und keine unkontrollierten absoluten Positionen erzeugen.

### Ausbau 4: Visuelle Nachweise und Review-Pakete

**Startbedingung:** Kommentare, Varianten und Zustände besitzen stabile Identitäten.

**Ziel:** Review-Runden lassen sich vollständig dokumentieren, teilen und später nachvollziehen.

**Lieferumfang:**

- gezielte Element- und Viewport-Screenshots über einen kontrollierten lokalen Capture-Adapter
- Vorher-/Nachher-Vergleich
- exportierbares Review-Paket mit Manifest
- optional versionierbare Review-Runde ohne flüchtige Sitzungsdaten
- HTML-Bericht für abgeschlossene Änderungen und offene Notizen

**Fertig, wenn:** Ein Export offline geöffnet werden kann, keine Secrets enthält und alle Nachweise auf stabile Record-IDs verweist.

### Ausbau 5: Wiederverwendbare Distribution

**Startbedingung:** Mindestens drei reale Projekte und der macOS-Adapter haben die Kern-API ohne projektspezifische Forks verwendet.

**Ziel:** Das persönliche Werkzeug wird als privat oder öffentlich installierbares Produkt paketiert.

**Lieferumfang:**

- versioniertes npm-Paket und dokumentierte Adapter-API
- Installationsassistent und Upgrade-Migrationen
- Browser-Kompatibilitätsmatrix
- optionales privates Git- oder Team-Review ohne verpflichtende Cloud
- stabile Semver- und Deprecation-Regeln

**Fertig, wenn:** Ein neues unabhängiges Projekt das Overlay ausschließlich über dokumentierte öffentliche APIs integrieren und wieder restlos entfernen kann.

## Direkter nächster Schritt nach MVP

Nach erfolgreicher MVP-Abnahme wird nicht pauschal „mehr Figma“ gebaut. Zuerst wird anhand realer Nutzung entschieden:

1. Sind Web-Quellstellen die häufigste Reibung, beginnt Ausbau 1.
2. Steht ein neues natives macOS-Projekt an, beginnt Ausbau 2; das Protokoll ist dafür vorbereitet.
3. Erst wenn Auswahl und Zuordnung stabil sind, beginnt Ausbau 3.

Diese Reihenfolge schützt den universellen Kern vor vorschnellen Oberflächenfunktionen und lässt trotzdem ohne neue Grundsatzentscheidung direkt weiterbauen.
