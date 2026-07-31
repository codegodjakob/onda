import Cocoa

// Erzeugt das App-Icon-Set für Onda: Tiefe im Hintergrund, eine ruhige Welle darin.
// "Onda" heißt Welle — das Zeichen ist die Bewegung selbst, nicht ein Buchstabe.
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
    let shape = NSBezierPath(roundedRect: bg, xRadius: radius, yRadius: radius)

    // Tiefer, ruhiger Grund — von unten leicht aufgehellt, wie Wasser gegen Licht.
    let tiefe = NSGradient(colors: [
        NSColor(srgbRed: 0.106, green: 0.129, blue: 0.161, alpha: 1),   // oben: Tinte
        NSColor(srgbRed: 0.145, green: 0.196, blue: 0.243, alpha: 1),   // unten: Wasser
    ])!
    shape.addClip()
    tiefe.draw(in: bg, angle: 90)

    // Drei Wellen, nach hinten schwächer werdend: Bewegung ohne Unruhe.
    func welle(y: CGFloat, amplitude: CGFloat, staerke: CGFloat, farbe: NSColor) {
        let p = NSBezierPath()
        let links = bg.minX + bg.width * 0.13
        let rechts = bg.maxX - bg.width * 0.13
        let mitte = (links + rechts) / 2
        p.move(to: NSPoint(x: links, y: y))
        p.curve(to: NSPoint(x: mitte, y: y),
                controlPoint1: NSPoint(x: links + (mitte - links) * 0.42, y: y + amplitude),
                controlPoint2: NSPoint(x: mitte - (mitte - links) * 0.42, y: y + amplitude))
        p.curve(to: NSPoint(x: rechts, y: y),
                controlPoint1: NSPoint(x: mitte + (rechts - mitte) * 0.42, y: y - amplitude),
                controlPoint2: NSPoint(x: rechts - (rechts - mitte) * 0.42, y: y - amplitude))
        farbe.setStroke()
        p.lineWidth = max(1, s * staerke)
        p.lineCapStyle = .round
        p.stroke()
    }

    let mitteY = bg.minY + bg.height * 0.5
    let a = bg.height * 0.115
    welle(y: mitteY + bg.height * 0.175, amplitude: a * 0.7, staerke: 0.030,
          farbe: NSColor(srgbRed: 0.55, green: 0.68, blue: 0.78, alpha: 0.34))
    welle(y: mitteY - bg.height * 0.175, amplitude: a * 0.7, staerke: 0.030,
          farbe: NSColor(srgbRed: 0.55, green: 0.68, blue: 0.78, alpha: 0.34))
    // Die tragende Welle: heller, satter, klar in der Mitte.
    welle(y: mitteY, amplitude: a, staerke: 0.055,
          farbe: NSColor(srgbRed: 0.925, green: 0.945, blue: 0.965, alpha: 1))

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
