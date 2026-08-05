#!/bin/bash
# Baut Onda.app aus main.swift + app/index.html + Icon.
set -euo pipefail
cd "$(dirname "$0")"

APP="../Onda.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

echo "— baue Web-Bundle …"
(cd ../app && npm install --silent >/dev/null 2>&1; npm run build >/dev/null 2>&1)
test -f ../app/dist/editor.bundle.js || { echo "FEHLER: Bundle fehlt"; exit 1; }

echo "— kompiliere App …"
swiftc -O -swift-version 5 -o "$APP/Contents/MacOS/Onda" main.swift

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

# CFBundleIdentifier ist de.jakob.onda, nicht mehr de.jakob.schreibwerkzeug: solange die
# alte und die neue App dieselbe Kennung trugen, hat macOS beim Oeffnen die alte gewaehlt
# und im Dock Name und Icon der alten angezeigt. Datenordner und Schluesselbund haengen an
# festen Namen ("Onda", mit Rueckfall auf "Schreibwerkzeug"), nicht an dieser Kennung —
# die Aenderung erreicht also weder Texte noch Schluessel.
echo "— schreibe Info.plist …"
cat > "$APP/Contents/Info.plist" <<'PLIST'
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
	<key>CFBundleVersion</key><string>1.0</string>
	<key>CFBundleShortVersionString</key><string>1.0</string>
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
# Liegt ein eigenes Codesignatur-Zertifikat im Schluesselbund, wird damit signiert:
# die Identitaet bleibt dann ueber alle Bauten hinweg dieselbe, und die Abfrage kommt
# genau einmal. Ohne Zertifikat bleibt alles wie bisher — das hier nimmt nichts weg.
#
# Das Zertifikat anzulegen ist Jakobs Sache: es braucht sein Passwort.
# Schluesselbundverwaltung > Zertifikatsassistent > Zertifikat erstellen,
# Name "Onda Dev", selbstsigniertes Stammzertifikat, Zertifikatstyp Codesignatur.
SIGNATUR_NAME="${ONDA_SIGNATUR:-Onda Dev}"
if security find-certificate -c "$SIGNATUR_NAME" >/dev/null 2>&1; then
  echo "— signiere mit „$SIGNATUR_NAME“ …"
  codesign --force -s "$SIGNATUR_NAME" "$APP" 2>/dev/null
else
  echo "— signiere (lokal, ad-hoc) …"
  codesign --force -s - "$APP" 2>/dev/null
fi

# Jeder Bau ersetzt das App-Paket. macOS merkt sich aber den alten Eintrag, und
# `open Onda.app` scheitert danach stillschweigend — das Programm selbst startet
# per Doppelklick auf die Binaerdatei weiterhin. Die Neuanmeldung kostet nichts
# und erspart die Suche nach einem Fehler, der keiner ist.
echo "— melde bei macOS an …"
LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
[ -x "$LSREGISTER" ] && "$LSREGISTER" -f "$(cd "$(dirname "$APP")" && pwd)/$(basename "$APP")" 2>/dev/null

echo "BUILD OK → $APP"
