#!/bin/bash
# Baut Onda.app aus main.swift + app/index.html + Icon.
# Reihenfolge: Web-Bundle → npm test → kompilieren → Selbsttest →
# Ressourcen/Icon/Plist/Signatur/lsregister → Zip. Schlägt ein Tor fehl,
# bricht der Bau ab — und die alte App bleibt unversehrt.
set -euo pipefail
cd "$(dirname "$0")"

APP="../Onda.app"

echo "— baue Web-Bundle …"
rm -rf ../app/dist
(cd ../app && npm install --no-audit --no-fund --silent && npm run build)
test -f ../app/dist/editor.bundle.js || { echo "FEHLER: Bundle fehlt"; exit 1; }

# Die Rauchtests brauchen einen laufenden Server — von allein startet sich nur
# einer von dreizehn einen. Bis zum 8. August 2026 fielen alle anderen still auf
# Port 4173 zurueck, also auf irgendeinen Server, den irgendwann irgendwer von Hand
# gestartet hatte. Das geht auf zwei Arten schief, und beide sind hier passiert:
#   1. Laeuft dort nichts, ist JEDE Browser-Pruefung rot. Der Bau bricht ab, obwohl
#      am Code nichts fehlt — und Jakob behaelt tagelang die alte App, ohne dass
#      irgendwo steht, warum.
#   2. Laeuft dort der Server einer ANDEREN Arbeitskopie, misst das Pflicht-Tor
#      fremden Code und laesst durch. Ein Tor, das den falschen Stand prueft, ist
#      kein Tor.
# Der Bau bringt seinen Pruefserver deshalb selbst mit — so wie es der Pruef-Lauf
# auf GitHub seit dem 7. August tut (.github/workflows/pruefung.yml).
echo "— starte Pruefserver …"
# Zwischen „nc sagt: frei" und „node bindet wirklich" liegt eine Luecke. Bauen zwei
# Arbeitskopien gleichzeitig, waehlen beide denselben Port — wer die Luecke verliert,
# stirbt an EADDRINUSE, und der Bau waere rot aus einem Grund, der nichts mit dem
# Code zu tun hat. Am 8. August 2026 ist genau das passiert: ein Bau hielt Port 4200,
# waehrend ein zweiter starten wollte.
# Deshalb bis zu drei Anlaeufe, jeder mit frisch gesuchtem Port. Ein Port, der einen
# Anlauf gekostet hat, wird nicht noch einmal genommen — sonst liefe der Bau bei einem
# Port, der frei aussieht und es nicht ist, dreimal in dieselbe Wand.
PRUEFANLAEUFE=3
PRUEFPORT=""
PRUEFSERVER=""
VERBRAUCHTE_PORTS=" "

# Jeder Bau fuehrt sein eigenes Serverprotokoll. Bei einem festen Pfad ueberschriebe
# der eine Bau das Protokoll des anderen — und gaebe im Fehlerfall das fremde aus.
PRUEFLOG="/tmp/onda-bau-server-$$.log"
: > "$PRUEFLOG"

# Der Server muss auch dann sterben, wenn ein Tor weiter unten fehlschlaegt.
aufraeumen() {
	if [ -n "${PRUEFSERVER:-}" ]; then kill "$PRUEFSERVER" 2>/dev/null || true; fi
	rm -f "$PRUEFLOG"
}
trap aufraeumen EXIT

# Ein Anlauf: freien Port suchen, Server starten, auf seine erste Antwort warten.
# Rueckgabe 0 heisst „laeuft auf $PRUEFPORT", Rueckgabe 1 heisst „dieser Anlauf ist
# gescheitert" — dann ist der naechste dran.
pruefserver_anlauf() {
	PRUEFPORT=""
	for kandidat in $(seq 4200 4260); do
		case "$VERBRAUCHTE_PORTS" in *" $kandidat "*) continue ;; esac
		if ! nc -z 127.0.0.1 "$kandidat" >/dev/null 2>&1; then PRUEFPORT="$kandidat"; break; fi
	done
	[ -n "$PRUEFPORT" ] || { echo "FEHLER: kein freier Port zwischen 4200 und 4260."; exit 1; }
	VERBRAUCHTE_PORTS="${VERBRAUCHTE_PORTS}${PRUEFPORT} "

	# Genommen wird der Server des Projekts (app/scripts/dev-server.mjs) und nicht
	# irgendein Fremdwerkzeug: er liefert dieselben MIME-Typen wie beim Entwickeln und
	# baut mit denselben esbuild-Einstellungen wie `npm run build` — er kann das eben
	# gebaute Bundle also nicht durch ein anderes ersetzen. Der Port MUSS als
	# `--port=…` uebergeben werden; ein nacktes Argument verwirft cliPort() still.
	printf '=== Anlauf auf Port %s ===\n' "$PRUEFPORT" >> "$PRUEFLOG"
	node ../app/scripts/dev-server.mjs --port="$PRUEFPORT" >> "$PRUEFLOG" 2>&1 &
	PRUEFSERVER=$!

	# Warten, bis er wirklich antwortet. Ohne das rennt der erste Test gegen eine
	# geschlossene Tuer, und der Bau ist aus einem Grund rot, der nichts mit dem Code
	# zu tun hat — genau die Sorte Fehlalarm, die hier schon Tage gekostet hat.
	for _ in $(seq 1 60); do
		if curl -sf -o /dev/null "http://127.0.0.1:${PRUEFPORT}/index.html"; then return 0; fi
		# Ist der Server schon gestorben, bringt weiteres Warten nichts. Der belegte Port
		# faellt so nach gut einer Sekunde auf, nicht erst nach einer Minute.
		kill -0 "$PRUEFSERVER" 2>/dev/null || return 1
		sleep 1
	done
	return 1
}

for anlauf in $(seq 1 "$PRUEFANLAEUFE"); do
	if pruefserver_anlauf; then break; fi
	# Haengt der Server statt zu sterben, muss er trotzdem weg, bevor der naechste startet.
	kill "$PRUEFSERVER" 2>/dev/null || true
	PRUEFSERVER=""
	if [ "$anlauf" -ge "$PRUEFANLAEUFE" ]; then
		echo "FEHLER: Pruefserver kam in ${PRUEFANLAEUFE} Anlaeufen nicht hoch. Sein Protokoll:"
		cat "$PRUEFLOG"
		exit 1
	fi
	echo "  Port ${PRUEFPORT} kam nicht hoch — naechster Anlauf mit einem anderen Port."
done
echo "  Pruefserver antwortet auf Port ${PRUEFPORT}."

echo "— Pflicht-Tor 1: Testsuite …"
# AIWT_URL ausdruecklich setzen, statt sich auf den eingebauten Rueckfall zu
# verlassen: dann steht schwarz auf weiss da, gegen welchen Server gemessen wird.
(cd ../app && AIWT_URL="http://127.0.0.1:${PRUEFPORT}/" npm test)

kill "$PRUEFSERVER" 2>/dev/null || true
# Die Nummer vergessen, damit das Aufraeumen am Ende nicht einen fremden Prozess trifft,
# der sie inzwischen bekommen hat. Das Protokoll raeumt es weiterhin weg — auch dann,
# wenn ein Tor weiter unten fehlschlaegt.
PRUEFSERVER=""

# Erst jetzt wird das App-Paket angefasst: schlägt oben ein Tor fehl,
# liegt die bisherige App noch unverändert da.
echo "— kompiliere App …"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
swiftc -O -swift-version 5 -o "$APP/Contents/MacOS/Onda" main.swift

echo "— Pflicht-Tor 2: Selbsttest …"
"$APP/Contents/MacOS/Onda" --selftest

echo "— kopiere Oberfläche …"
mkdir -p "$APP/Contents/Resources/src" "$APP/Contents/Resources/dist" "$APP/Contents/Resources/fonts"
cp ../app/index.html "$APP/Contents/Resources/index.html"
cp ../app/src/*.css "$APP/Contents/Resources/src/"
cp ../app/dist/editor.bundle.js "$APP/Contents/Resources/dist/editor.bundle.js"
cp ../app/fonts/*.woff2 "$APP/Contents/Resources/fonts/"

echo "— erzeuge Icon …"
rm -rf AppIcon.iconset
swift icon.swift AppIcon.iconset >/dev/null
iconutil -c icns AppIcon.iconset -o "$APP/Contents/Resources/AppIcon.icns"
rm -rf AppIcon.iconset

# Baustempel: Datum und Commit-Kürzel wandern in die Info.plist, damit
# „Über Onda" zeigt, welcher Stand wirklich läuft. Ein „+" hinter dem
# Commit heißt: aus ungesichertem Stand gebaut.
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo unbekannt)"
# Persönliche Arbeitsnotizen unter .scratch gehören nicht zum App-Artefakt und
# dürfen dessen reproduzierbaren Baustand nicht als verändert markieren.
if [ -n "$(git -C .. status --porcelain -- . ':(exclude).scratch/**')" ]; then
	COMMIT="${COMMIT}+"
fi
DATUM="$(date +%Y-%m-%d)"

# CFBundleIdentifier ist de.jakob.onda, nicht mehr de.jakob.schreibwerkzeug: solange die
# alte und die neue App dieselbe Kennung trugen, hat macOS beim Oeffnen die alte gewaehlt
# und im Dock Name und Icon der alten angezeigt. Datenordner und Schluesselbund haengen an
# festen Namen ("Onda", mit Rueckfall auf "Schreibwerkzeug"), nicht an dieser Kennung —
# die Aenderung erreicht also weder Texte noch Schluessel.
echo "— schreibe Info.plist …"
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleName</key><string>Onda</string>
	<key>CFBundleDisplayName</key><string>Onda</string>
	<key>CFBundleIdentifier</key><string>de.jakob.onda</string>
	<key>CFBundleExecutable</key><string>Onda</string>
	<key>CFBundleIconFile</key><string>AppIcon</string>
	<key>CFBundlePackageType</key><string>APPL</string>
	<key>CFBundleVersion</key><string>${COMMIT}</string>
	<key>CFBundleShortVersionString</key><string>${DATUM}</string>
	<key>LSMinimumSystemVersion</key><string>12.0</string>
	<key>NSHighResolutionCapable</key><true/>
	<key>NSHumanReadableCopyright</key><string>Jakob Schlenker</string>
</dict>
</plist>
PLIST

# Signatur. Mit "-s -" (ad-hoc) bekommt die App bei JEDEM Bau eine neue Identitaet.
# Der Schluesselbund merkt sich aber, welcher Identitaet er den Zugriff auf den
# API-Schluessel erlaubt hat — nach dem naechsten Bau passt sie nicht mehr, und die
# Passwortabfrage kommt erneut. "Immer erlauben" haelt damit nur bis zum naechsten Bau.
#
# Das eigene Codesignatur-Zertifikat hält die Identität über alle Bauten hinweg
# gleich. Fehlt es, bricht der Release-Bau ab: Ein stiller ad-hoc-Rückfall würde
# die Schlüsselbundfreigabe beim nächsten Bau wieder ungültig machen.
#
# Das Zertifikat anzulegen ist Jakobs Sache: es braucht sein Passwort.
# Schluesselbundverwaltung > Zertifikatsassistent > Zertifikat erstellen,
# Name "Onda Dev", selbstsigniertes Stammzertifikat, Zertifikatstyp Codesignatur.
SIGNATUR_NAME="${ONDA_SIGNATUR:-Onda Dev}"
# Ein Zertifikat allein reicht nicht: codesign braucht eine Identitaet mitsamt privatem
# Schluessel. Diese Liste entscheidet deshalb, ob der benannte Signierweg benutzbar ist.
#
# WICHTIG: bewusst OHNE -v. Das Flag heisst "nur gueltige Identitaeten", und ein
# selbstsigniertes Zertifikat gilt als nicht vertrauenswuerdig (CSSMERR_TP_NOT_TRUSTED),
# solange niemand es ausdruecklich als vertrauenswuerdig markiert. Mit -v fiel es durch
# den Filter, und der Bau signierte still wieder ad-hoc -- genau der Zustand, den das
# Zertifikat beheben sollte. codesign selbst stoert die fehlende Vertrauensstellung
# nicht: sie besagt nur, dass ein FREMDER Rechner der Signatur nicht traut. Hier geht es
# allein um eine ueber alle Bauten stabile Identitaet.
if security find-identity -p codesigning 2>/dev/null | grep -Fq "\"$SIGNATUR_NAME\""; then
  echo "— signiere mit „${SIGNATUR_NAME}“ …"
  codesign --force -s "$SIGNATUR_NAME" "$APP"
else
  echo "FEHLER: Signieridentität „${SIGNATUR_NAME}“ mit privatem Schlüssel fehlt."
  exit 1
fi

# Jeder Bau ersetzt das App-Paket. macOS merkt sich aber den alten Eintrag, und
# `open Onda.app` scheitert danach stillschweigend — das Programm selbst startet
# per Doppelklick auf die Binaerdatei weiterhin. Die Neuanmeldung kostet nichts
# und erspart die Suche nach einem Fehler, der keiner ist.
echo "— melde bei macOS an …"
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
if [ -x "$LSREGISTER" ]; then
	"$LSREGISTER" -f "$(cd "$(dirname "$APP")" && pwd)/$(basename "$APP")" 2>/dev/null
fi

echo "— lege Zip ab …"
mkdir -p ../releases
ditto -c -k --keepParent "$APP" "../releases/Onda-$(date +%Y%m%d-%H%M%S)-${COMMIT}.zip"

echo "BUILD OK → $APP (Stand ${COMMIT}, ${DATUM})"
