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

echo "— Pflicht-Tor 1: Testsuite …"
(cd ../app && npm test)

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
cp ../app/src/style.css "$APP/Contents/Resources/src/style.css"
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
if [ -n "$(git status --porcelain)" ]; then
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

echo "— signiere (lokal) …"
codesign --force -s - "$APP"

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
