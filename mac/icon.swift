import Cocoa

// Erzeugt das App-Icon-Set: Papiergrund, Serifen-S, roter Faden darunter.
// Aufruf: swift icon.swift <ziel.iconset>

let out = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "AppIcon.iconset"
try? FileManager.default.createDirectory(atPath: out, withIntermediateDirectories: true)

func drawIcon(_ px: Int) -> NSBitmapImageRep {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: px, pixelsHigh: px,
                               bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                               colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    let s = CGFloat(px)

    // macOS-Squircle mit Randabstand
    let m = s * 0.085
    let bg = NSRect(x: m, y: m, width: s - 2*m, height: s - 2*m)
    let radius = bg.width * 0.225
    let path = NSBezierPath(roundedRect: bg, xRadius: radius, yRadius: radius)
    NSColor(srgbRed: 0.984, green: 0.980, blue: 0.965, alpha: 1).setFill()   // Papier
    path.fill()
    NSColor(srgbRed: 0.86, green: 0.85, blue: 0.82, alpha: 1).setStroke()
    path.lineWidth = max(1, s * 0.006)
    path.stroke()

    // Serifen-S in Tinte
    let fontSize = s * 0.50
    let font = NSFont(name: "Georgia-Bold", size: fontSize) ?? NSFont.boldSystemFont(ofSize: fontSize)
    let ink = NSColor(srgbRed: 0.165, green: 0.165, blue: 0.16, alpha: 1)
    let str = NSAttributedString(string: "S", attributes: [.font: font, .foregroundColor: ink])
    let sz = str.size()
    let tx = (s - sz.width) / 2
    let ty = (s - sz.height) / 2 + s * 0.055
    str.draw(at: NSPoint(x: tx, y: ty))

    // Der rote Faden
    let thread = NSBezierPath()
    let y = s * 0.235
    thread.move(to: NSPoint(x: s * 0.30, y: y))
    thread.curve(to: NSPoint(x: s * 0.70, y: y),
                 controlPoint1: NSPoint(x: s * 0.43, y: y - s * 0.045),
                 controlPoint2: NSPoint(x: s * 0.57, y: y + s * 0.045))
    NSColor(srgbRed: 0.847, green: 0.353, blue: 0.188, alpha: 1).setStroke()  // Koralle/Rot
    thread.lineWidth = max(1.5, s * 0.028)
    thread.lineCapStyle = .round
    thread.stroke()

    NSGraphicsContext.restoreGraphicsState()
    return rep
}

func save(_ rep: NSBitmapImageRep, _ name: String) {
    let png = rep.representation(using: .png, properties: [:])!
    try! png.write(to: URL(fileURLWithPath: out).appendingPathComponent(name))
}

for base in [16, 32, 128, 256, 512] {
    save(drawIcon(base), "icon_\(base)x\(base).png")
    save(drawIcon(base * 2), "icon_\(base)x\(base)@2x.png")
}
print("ICONSET OK")
