import Cocoa
import WebKit

// MARK: - Speicher (echte Datei mit Backup + Reparatur)

enum Store {
    static var dir: URL = {
        if let o = ProcessInfo.processInfo.environment["AIWT_DATA_DIR"], !o.isEmpty {
            return URL(fileURLWithPath: o, isDirectory: true)
        }
        return FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("Schreibwerkzeug", isDirectory: true)
    }()
    static var dataURL: URL { dir.appendingPathComponent("data.json") }
    static var backupURL: URL { dir.appendingPathComponent("data.backup.json") }

    static func ensureDir() {
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    }

    static func isValidJSON(_ s: String) -> Bool {
        guard let d = s.data(using: .utf8) else { return false }
        return (try? JSONSerialization.jsonObject(with: d)) != nil
    }

    /// Lädt den Datenbestand. Bei kaputter Datei: beiseite legen, Backup nutzen.
    static func load() -> String {
        let fm = FileManager.default
        guard let d = try? Data(contentsOf: dataURL), let s = String(data: d, encoding: .utf8) else {
            return "null"
        }
        if isValidJSON(s) { return s }
        let stamp = Int(Date().timeIntervalSince1970)
        try? fm.moveItem(at: dataURL, to: dir.appendingPathComponent("data.corrupt-\(stamp).json"))
        if let bd = try? Data(contentsOf: backupURL), let bs = String(data: bd, encoding: .utf8), isValidJSON(bs) {
            return bs
        }
        return "null"
    }

    /// Speichert atomar; hebt den vorherigen Stand als Backup auf.
    @discardableResult
    static func save(_ s: String) -> Bool {
        guard isValidJSON(s) else { return false }
        ensureDir()
        let fm = FileManager.default
        if fm.fileExists(atPath: dataURL.path) {
            try? fm.removeItem(at: backupURL)
            try? fm.copyItem(at: dataURL, to: backupURL)
        }
        guard let d = s.data(using: .utf8) else { return false }
        do { try d.write(to: dataURL, options: .atomic); return true } catch { return false }
    }
}

// MARK: - Selbsttest (läuft ohne Fenster, prüft die Speicherschicht)

func runSelfTest() -> Never {
    var fails = 0
    func check(_ name: String, _ ok: Bool) {
        print((ok ? "PASS " : "FAIL ") + name)
        if !ok { fails += 1 }
    }
    Store.dir = URL(fileURLWithPath: NSTemporaryDirectory())
        .appendingPathComponent("aiwt-selftest-\(UUID().uuidString)", isDirectory: true)

    // 1) Frischer Start
    check("frischer-start-leer", Store.load() == "null")

    // 2) Speichern + Laden mit Sonderzeichen
    let doc1 = "{\"docs\":[{\"id\":\"a\",\"title\":\"Tü👍st \\\"Zitat\\\" <b>\",\"body\":\"<p>ä ö ü ß 😀 &amp; — „deutsch“</p>\",\"updated\":1}],\"active\":\"a\"}"
    check("speichern", Store.save(doc1))
    check("laden-identisch", Store.load() == doc1)

    // 3) Backup hält den vorherigen Stand
    let doc2 = "{\"docs\":[{\"id\":\"a\",\"title\":\"Version 2\",\"body\":\"<p>neu</p>\",\"updated\":2}],\"active\":\"a\"}"
    Store.save(doc2)
    let bak = (try? String(contentsOf: Store.backupURL, encoding: .utf8)) ?? ""
    check("backup-vorheriger-stand", bak == doc1)
    check("laden-neuester-stand", Store.load() == doc2)

    // 4) Kaputte Datei → Backup springt ein, Kaputtes wird beiseitegelegt
    try? "{kaputt!!".data(using: .utf8)!.write(to: Store.dataURL)
    check("reparatur-nutzt-backup", Store.load() == doc1)
    let quarantined = (try? FileManager.default.contentsOfDirectory(atPath: Store.dir.path))?
        .contains(where: { $0.hasPrefix("data.corrupt-") }) ?? false
    check("kaputtes-beiseitegelegt", quarantined)

    // 5) Ungültiges wird nie gespeichert
    check("ungueltiges-abgelehnt", Store.save("{nope") == false)

    // 6) Großer Text (~3 MB)
    let big = String(repeating: "Lorem ipsum älterer Text mit Umlauten öäüß. ", count: 70_000)
    let obj: [String: Any] = ["docs": [["id": "b", "title": "Groß", "body": big, "updated": 3]], "active": "b"]
    let bigStr = String(data: try! JSONSerialization.data(withJSONObject: obj), encoding: .utf8)!
    check("gross-speichern", Store.save(bigStr))
    check("gross-laden", Store.load() == bigStr)

    // 7) Viele schnelle Speichervorgänge hintereinander
    var ok = true
    for i in 0..<50 {
        let s = "{\"docs\":[{\"id\":\"r\",\"title\":\"t\(i)\",\"body\":\"<p>\(i)</p>\",\"updated\":\(i)}],\"active\":\"r\"}"
        if !Store.save(s) { ok = false }
    }
    check("50x-schnell-speichern", ok && Store.load().contains("t49"))

    try? FileManager.default.removeItem(at: Store.dir)
    print(fails == 0 ? "SELFTEST OK" : "SELFTEST FAILED (\(fails))")
    exit(fails == 0 ? 0 : 1)
}

// MARK: - App

final class AppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler {
    var window: NSWindow!
    var webView: WKWebView!
    let probePath: String?

    init(probePath: String?) { self.probePath = probePath }

    func applicationDidFinishLaunching(_ n: Notification) {
        let ucc = WKUserContentController()
        ucc.add(self, name: "store")
        ucc.add(self, name: "exportmd")
        ucc.add(self, name: "probe")

        let data = Store.load()
        let js = "window.__NATIVE_DATA__ = \(data); window.__PROBE__ = \(probePath != nil ? "true" : "false");"
        ucc.addUserScript(WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true))

        let cfg = WKWebViewConfiguration()
        cfg.userContentController = ucc
        webView = WKWebView(frame: .zero, configuration: cfg)
        webView.allowsMagnification = true

        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1150, height: 760),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable],
                          backing: .buffered, defer: false)
        window.title = "Schreibwerkzeug"
        window.minSize = NSSize(width: 720, height: 460)
        window.contentView = webView
        window.setFrameAutosaveName("SchreibwerkzeugMain")
        if window.frame.width < 300 { window.center() }

        if probePath == nil {
            window.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
        }

        guard let res = Bundle.main.resourceURL else { fatalError("Resources fehlen") }
        let htmlURL = res.appendingPathComponent("index.html")
        webView.loadFileURL(htmlURL, allowingReadAccessTo: res)

        if let p = probePath {
            DispatchQueue.main.asyncAfter(deadline: .now() + 10) {
                try? "{\"error\":\"timeout\"}".write(toFile: p, atomically: true, encoding: .utf8)
                exit(2)
            }
        }
    }

    func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "store":
            guard let s = message.body as? String else { return }
            let ok = Store.save(s)
            let cb = ok ? "window.__nativeSaveOk__ && window.__nativeSaveOk__()"
                        : "window.__nativeSaveFail__ && window.__nativeSaveFail__()"
            webView.evaluateJavaScript(cb, completionHandler: nil)
        case "exportmd":
            guard let s = message.body as? String, let d = s.data(using: .utf8),
                  let obj = (try? JSONSerialization.jsonObject(with: d)) as? [String: Any],
                  let fname = obj["filename"] as? String,
                  let content = obj["content"] as? String else { return }
            let panel = NSSavePanel()
            panel.nameFieldStringValue = fname
            panel.canCreateDirectories = true
            panel.beginSheetModal(for: window) { resp in
                if resp == .OK, let url = panel.url {
                    try? content.data(using: .utf8)?.write(to: url, options: .atomic)
                }
            }
        case "probe":
            if let p = probePath, let s = message.body as? String {
                try? s.write(toFile: p, atomically: true, encoding: .utf8)
                exit(0)
            }
        default: break
        }
    }

    @objc func menuNewDoc() { webView.evaluateJavaScript("window.__newDocFromMenu__ && window.__newDocFromMenu__()", completionHandler: nil) }
    @objc func menuExport() { webView.evaluateJavaScript("window.__exportFromMenu__ && window.__exportFromMenu__()", completionHandler: nil) }

    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        webView?.evaluateJavaScript("window.__flushForQuit__ && window.__flushForQuit__()", completionHandler: nil)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            NSApp.reply(toApplicationShouldTerminate: true)
        }
        return .terminateLater
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ s: NSApplication) -> Bool { true }
}

func buildMenus(_ delegate: AppDelegate) {
    let main = NSMenu()

    let appItem = NSMenuItem(); main.addItem(appItem)
    let appMenu = NSMenu()
    appMenu.addItem(withTitle: "Über Schreibwerkzeug",
                    action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
    appMenu.addItem(.separator())
    appMenu.addItem(withTitle: "Schreibwerkzeug ausblenden",
                    action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
    appMenu.addItem(.separator())
    appMenu.addItem(withTitle: "Schreibwerkzeug beenden",
                    action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
    appItem.submenu = appMenu

    let fileItem = NSMenuItem(); main.addItem(fileItem)
    let fileMenu = NSMenu(title: "Ablage")
    let newDoc = NSMenuItem(title: "Neuer Text", action: #selector(AppDelegate.menuNewDoc), keyEquivalent: "n")
    newDoc.target = delegate
    fileMenu.addItem(newDoc)
    let exp = NSMenuItem(title: "Exportieren als Markdown …", action: #selector(AppDelegate.menuExport), keyEquivalent: "e")
    exp.target = delegate
    fileMenu.addItem(exp)
    fileMenu.addItem(.separator())
    fileMenu.addItem(withTitle: "Fenster schließen", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
    fileItem.submenu = fileMenu

    let editItem = NSMenuItem(); main.addItem(editItem)
    let editMenu = NSMenu(title: "Bearbeiten")
    editMenu.addItem(withTitle: "Widerrufen", action: Selector(("undo:")), keyEquivalent: "z")
    let redo = NSMenuItem(title: "Wiederholen", action: Selector(("redo:")), keyEquivalent: "Z")
    redo.keyEquivalentModifierMask = [.command, .shift]
    editMenu.addItem(redo)
    editMenu.addItem(.separator())
    editMenu.addItem(withTitle: "Ausschneiden", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
    editMenu.addItem(withTitle: "Kopieren", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
    editMenu.addItem(withTitle: "Einsetzen", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
    editMenu.addItem(withTitle: "Alles auswählen", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
    editItem.submenu = editMenu

    NSApp.mainMenu = main
}

// MARK: - Start

let args = CommandLine.arguments
if args.contains("--selftest") { runSelfTest() }

var probePath: String? = nil
if let i = args.firstIndex(of: "--probe"), i + 1 < args.count { probePath = args[i + 1] }

let app = NSApplication.shared
let delegate = AppDelegate(probePath: probePath)
app.delegate = delegate
app.setActivationPolicy(probePath == nil ? .regular : .accessory)
if probePath == nil { buildMenus(delegate) }
app.run()
