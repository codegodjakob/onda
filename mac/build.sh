#!/bin/bash
# Baut Schreibwerkzeug.app aus main.swift + app/index.html + Icon.
set -euo pipefail
cd "$(dirname "$0")"

APP="../Schreibwerkzeug.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

echo "— baue Web-Bundle …"
(cd ../app && npm install --silent >/dev/null 2>&1; npm run build >/dev/null 2>&1)
test -f ../app/dist/editor.bundle.js || { echo "FEHLER: Bundle fehlt"; exit 1; }

echo "— kompiliere App …"
swiftc -O -swift-version 5 -o "$APP/Contents/MacOS/Schreibwerkzeug" main.swift

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

echo "— schreibe Info.plist …"
cat > "$APP/Contents/Info.plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleName</key><string>Schreibwerkzeug</string>
	<key>CFBundleDisplayName</key><string>Schreibwerkzeug</string>
	<key>CFBundleIdentifier</key><string>de.jakob.schreibwerkzeug</string>
	<key>CFBundleExecutable</key><string>Schreibwerkzeug</string>
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

echo "— signiere (lokal) …"
codesign --force -s - "$APP" 2>/dev/null

echo "BUILD OK → $APP"
