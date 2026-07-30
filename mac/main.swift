import Cocoa
import WebKit
import Security

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

// MARK: - Schlüsselbund (API-Schlüssel verlässt nie den nativen Prozess)

enum Keychain {
    static let service = "Schreibwerkzeug"
    static let account = "anthropic-api-key"

    private static func basisAbfrage(service: String, account: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }

    /// Legt den Schlüssel ab (ersetzt einen vorhandenen Eintrag).
    @discardableResult
    static func setzen(_ schluessel: String, service: String = Keychain.service, account: String = Keychain.account) -> Bool {
        guard !schluessel.isEmpty, let data = schluessel.data(using: .utf8) else { return false }
        let query = basisAbfrage(service: service, account: account)
        SecItemDelete(query as CFDictionary)
        var add = query
        add[kSecValueData as String] = data
        add[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlocked
        return SecItemAdd(add as CFDictionary, nil) == errSecSuccess
    }

    /// Liest den Schlüssel — nur für den nativen 'llm'-Handler, nie für JS.
    static func lesen(service: String = Keychain.service, account: String = Keychain.account) -> String? {
        var query = basisAbfrage(service: service, account: account)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &out) == errSecSuccess,
              let d = out as? Data, let s = String(data: d, encoding: .utf8), !s.isEmpty else { return nil }
        return s
    }

    @discardableResult
    static func loeschen(service: String = Keychain.service, account: String = Keychain.account) -> Bool {
        let status = SecItemDelete(basisAbfrage(service: service, account: account) as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }

    static func vorhanden(service: String = Keychain.service, account: String = Keychain.account) -> Bool {
        lesen(service: service, account: account) != nil
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

    // 8) Schlüsselbund-Helfer (eigener Selbsttest-Eintrag — der echte bleibt unberührt)
    let tService = "Schreibwerkzeug-Selbsttest"
    _ = Keychain.loeschen(service: tService)
    check("keychain-anfangs-leer", Keychain.vorhanden(service: tService) == false)
    check("keychain-setzen", Keychain.setzen("test-schluessel-123", service: tService))
    check("keychain-lesen", Keychain.lesen(service: tService) == "test-schluessel-123")
    check("keychain-ueberschreiben",
          Keychain.setzen("test-schluessel-456", service: tService)
          && Keychain.lesen(service: tService) == "test-schluessel-456")
    check("keychain-loeschen",
          Keychain.loeschen(service: tService) && Keychain.vorhanden(service: tService) == false)
    check("keychain-leer-abgelehnt", Keychain.setzen("", service: tService) == false)

    try? FileManager.default.removeItem(at: Store.dir)
    print(fails == 0 ? "SELFTEST OK" : "SELFTEST FAILED (\(fails))")
    exit(fails == 0 ? 0 : 1)
}

// MARK: - Bilder: Ablage + Auslieferung über eigenes URL-Schema

extension Store {
    static var imagesDir: URL { dir.appendingPathComponent("images", isDirectory: true) }

    /// Löscht Bilddateien, auf die kein Text mehr verweist.
    static func cleanOrphanImages() {
        let fm = FileManager.default
        guard let files = try? fm.contentsOfDirectory(atPath: imagesDir.path), !files.isEmpty else { return }
        let data = load()
        guard data != "null" else { return }
        for f in files where !data.contains("aiwt-img://img/\(f)") {
            try? fm.removeItem(at: imagesDir.appendingPathComponent(f))
        }
    }
}

final class ImgSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        let name = url.lastPathComponent
        let fileURL = Store.imagesDir.appendingPathComponent(name)
        guard name.range(of: "^[\\w.-]+$", options: .regularExpression) != nil,
              let data = try? Data(contentsOf: fileURL) else {
            task.didReceive(HTTPURLResponse(url: url, statusCode: 404, httpVersion: nil, headerFields: nil)!)
            task.didFinish()
            return
        }
        let mime: String
        switch (name as NSString).pathExtension.lowercased() {
        case "jpg", "jpeg": mime = "image/jpeg"
        case "gif": mime = "image/gif"
        case "webp": mime = "image/webp"
        default: mime = "image/png"
        }
        task.didReceive(URLResponse(url: url, mimeType: mime, expectedContentLength: data.count, textEncodingName: nil))
        task.didReceive(data)
        task.didFinish()
    }
    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}

// MARK: - App

final class AppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKUIDelegate {
    var window: NSWindow!
    var webView: WKWebView!
    let probePath: String?

    init(probePath: String?) { self.probePath = probePath }

    func applicationDidFinishLaunching(_ n: Notification) {
        Store.cleanOrphanImages()

        let ucc = WKUserContentController()
        ucc.add(self, name: "store")
        ucc.add(self, name: "exportmd")
        ucc.add(self, name: "probe")
        ucc.add(self, name: "saveimg")
        ucc.add(self, name: "printreq")
        ucc.add(self, name: "openurl")
        ucc.add(self, name: "llmkey")
        ucc.add(self, name: "llm")

        let data = Store.load()
        let js = "window.__NATIVE_DATA__ = \(data); window.__PROBE__ = \(probePath != nil ? "true" : "false");"
        ucc.addUserScript(WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: true))

        let cfg = WKWebViewConfiguration()
        cfg.userContentController = ucc
        cfg.setURLSchemeHandler(ImgSchemeHandler(), forURLScheme: "aiwt-img")
        webView = WKWebView(frame: .zero, configuration: cfg)
        webView.allowsMagnification = true
        webView.uiDelegate = self

        // Entwickler-Smoke: Web-Inspektor nur bei AIWT_DEBUG=1 (Safari → Entwickler).
        if ProcessInfo.processInfo.environment["AIWT_DEBUG"] == "1" {
            if #available(macOS 13.3, *) { webView.isInspectable = true }
        }

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
        case "saveimg":
            guard let s = message.body as? String, let d = s.data(using: .utf8),
                  let obj = (try? JSONSerialization.jsonObject(with: d)) as? [String: Any],
                  let reqId = obj["id"] as? String,
                  let b64 = obj["dataBase64"] as? String else { return }
            var ext = (obj["ext"] as? String ?? "png").lowercased()
            if !["png", "jpg", "gif", "webp"].contains(ext) { ext = "png" }
            let safeReq = reqId.replacingOccurrences(of: "'", with: "")
            guard let imgData = Data(base64Encoded: b64), !imgData.isEmpty else {
                webView.evaluateJavaScript("window.__imgSaved__ && window.__imgSaved__('\(safeReq)', null)", completionHandler: nil)
                return
            }
            try? FileManager.default.createDirectory(at: Store.imagesDir, withIntermediateDirectories: true)
            let fname = UUID().uuidString.lowercased() + "." + ext
            let fileURL = Store.imagesDir.appendingPathComponent(fname)
            do {
                try imgData.write(to: fileURL, options: .atomic)
                webView.evaluateJavaScript("window.__imgSaved__ && window.__imgSaved__('\(safeReq)', 'aiwt-img://img/\(fname)')", completionHandler: nil)
            } catch {
                webView.evaluateJavaScript("window.__imgSaved__ && window.__imgSaved__('\(safeReq)', null)", completionHandler: nil)
            }
        case "printreq":
            printWebView()
        case "openurl":
            if let s = message.body as? String, let url = URL(string: s),
               ["http", "https"].contains(url.scheme ?? "") {
                NSWorkspace.shared.open(url)
            }
        case "llmkey":
            guard let obj = message.body as? [String: Any],
                  let id = obj["id"] as? String,
                  let aktion = obj["aktion"] as? String else { return }
            switch aktion {
            case "setzen":
                let roh = (obj["schluessel"] as? String ?? "")
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                if !roh.isEmpty { Keychain.setzen(roh) }
            case "loeschen":
                Keychain.loeschen()
            default:
                break // "status" fragt nur ab
            }
            // Antwort enthält NIE den Schlüssel — nur ja/nein.
            llmRueckruf(["id": id, "typ": "schluesselstatus",
                         "status": ["vorhanden": Keychain.vorhanden()]])
        case "llm":
            guard let obj = message.body as? [String: Any] else { return }
            handleLlm(obj)
        case "probe":
            if let p = probePath, let s = message.body as? String {
                try? s.write(toFile: p, atomically: true, encoding: .utf8)
                exit(0)
            }
        default: break
        }
    }

    /// Einziger Rückkanal der LLM-Brücke: window.AIWT.llmRueckruf(payload).
    /// JSON-Serialisierung übernimmt jedes Escaping (Anführungszeichen, Zeilen-
    /// umbrüche in SSE-Rohzeilen); der Guard macht Aufrufe vor der JS-Registrierung
    /// zu No-ops. Reihenfolge ist trotzdem sicher: Swift ruft llmRueckruf nur als
    /// Antwort auf ein postMessage aus dem JS — zu dem Zeitpunkt ist
    /// agent-transport.mjs (Bereich T) längst geladen und window.AIWT registriert.
    func llmRueckruf(_ payload: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              var json = String(data: data, encoding: .utf8) else { return }
        // U+2028/U+2029 sind gültiges JSON, aber Zeilenumbrüche im JS-Quelltext.
        json = json.replacingOccurrences(of: "\u{2028}", with: "\\u2028")
                   .replacingOccurrences(of: "\u{2029}", with: "\\u2029")
        let js = "window.AIWT && window.AIWT.llmRueckruf && window.AIWT.llmRueckruf(\(json));"
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    // JS-confirm()/alert() brauchen in WKWebView einen UIDelegate — sonst sind sie stumm (confirm liefert immer false).
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let a = NSAlert()
        a.messageText = "Schreibwerkzeug"
        a.informativeText = message
        a.alertStyle = .warning
        a.addButton(withTitle: "OK")
        a.addButton(withTitle: "Abbrechen")
        a.beginSheetModal(for: window) { resp in
            completionHandler(resp == .alertFirstButtonReturn)
        }
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let a = NSAlert()
        a.messageText = "Schreibwerkzeug"
        a.informativeText = message
        a.beginSheetModal(for: window) { _ in completionHandler() }
    }

    @objc func printWebView() {
        let info = NSPrintInfo.shared
        info.horizontalPagination = .fit
        info.verticalPagination = .automatic
        info.topMargin = 40; info.bottomMargin = 40; info.leftMargin = 40; info.rightMargin = 40
        let op = webView.printOperation(with: info)
        op.showsPrintPanel = true
        op.showsProgressPanel = true
        op.view?.frame = webView.bounds
        op.runModal(for: window, delegate: nil, didRun: nil, contextInfo: nil)
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
    let prt = NSMenuItem(title: "Drucken …", action: #selector(AppDelegate.printWebView), keyEquivalent: "p")
    prt.target = delegate
    fileMenu.addItem(prt)
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

// MARK: - LLM-Brücke (Handler 'llm')
//
// Entscheidung (verbindlich für Bereich T): Swift parst weder die JSON-Antwort
// noch den SSE-Strom. stream=false → der rohe Antwort-Körper geht als `text`
// im 'fertig'-Rückruf an JS; stream=true → jede SSE-Rohzeile (inkl. '\n',
// ohne '\r') geht als 'delta' an JS, dort arbeitet parseSseZeilen aus
// agent-transport.mjs. Ein Parser, eine Wahrheit — kein Duplikat in Swift.

extension AppDelegate {
    /// Großzügige Fristen: Opus-5-Läufe mit adaptivem Denken dürfen lange dauern.
    static let llmSession: URLSession = {
        let cfg = URLSessionConfiguration.ephemeral
        cfg.timeoutIntervalForRequest = 600   // 10 Minuten je Anfrage
        cfg.timeoutIntervalForResource = 1200
        return URLSession(configuration: cfg)
    }()

    /// HTTP-Status → Fehler-Vokabular des Verteilers (agent-gateway.mjs).
    static func fehlerTyp(fuerStatus status: Int) -> String {
        switch status {
        case 401, 403: return "kein-schluessel"
        case 429: return "ratenlimit"
        case 529: return "ueberlastet"
        case 500...599: return "ueberlastet"
        default: return "schema" // fehlerhafte Anfrage (z. B. 400) — nicht wiederholbar
        }
    }

    func handleLlm(_ obj: [String: Any]) {
        guard let id = obj["id"] as? String else { return }
        func fehler(_ typ: String, _ nachricht: String) {
            llmRueckruf(["id": id, "typ": "fehler",
                         "fehler": ["typ": typ, "nachricht": nachricht]])
        }
        guard let urlString = obj["url"] as? String,
              let url = URL(string: urlString),
              url.scheme == "https", url.host == "api.anthropic.com" else {
            fehler("schema", "Unzulässige Ziel-Adresse — die Brücke spricht nur mit api.anthropic.com.")
            return
        }
        guard let key = Keychain.lesen() else {
            fehler("kein-schluessel", "Kein API-Schlüssel im Schlüsselbund hinterlegt.")
            return
        }
        guard let body = obj["body"], JSONSerialization.isValidJSONObject(body),
              let bodyData = try? JSONSerialization.data(withJSONObject: body) else {
            fehler("schema", "Anfrage-Körper ließ sich nicht serialisieren.")
            return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = bodyData
        request.timeoutInterval = 600
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        let gesperrt = ["x-api-key", "anthropic-dangerous-direct-browser-access"]
        for (k, v) in (obj["headers"] as? [String: String]) ?? [:]
            where !gesperrt.contains(k.lowercased()) {
            request.setValue(v, forHTTPHeaderField: k)
        }
        request.setValue(key, forHTTPHeaderField: "x-api-key") // NUR hier, nie aus JS

        if (obj["stream"] as? Bool) == true {
            streamLlm(id: id, request: request)
        } else {
            fetchLlm(id: id, request: request)
        }
    }

    /// stream=false: komplette Antwort abholen, roher Body als `text` an JS.
    private func fetchLlm(id: String, request: URLRequest) {
        AppDelegate.llmSession.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }
            func fehler(_ typ: String, _ nachricht: String) {
                self.llmRueckruf(["id": id, "typ": "fehler",
                                  "fehler": ["typ": typ, "nachricht": nachricht]])
            }
            if let error = error {
                fehler("offline", "Netzfehler: \(error.localizedDescription)")
                return
            }
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            let text = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
            guard status == 200 else {
                fehler(AppDelegate.fehlerTyp(fuerStatus: status),
                       "HTTP \(status): \(String(text.prefix(300)))")
                return
            }
            self.llmRueckruf(["id": id, "typ": "fertig", "text": text])
        }.resume()
    }

    /// stream=true: SSE Zeile für Zeile, jede Rohzeile als 'delta' an JS.
    private func streamLlm(id: String, request: URLRequest) {
        Task { [weak self] in
            guard let self = self else { return }
            @MainActor func fehler(_ typ: String, _ nachricht: String) {
                self.llmRueckruf(["id": id, "typ": "fehler",
                                  "fehler": ["typ": typ, "nachricht": nachricht]])
            }
            func alsZeile(_ d: Data) -> String {
                var s = String(data: d, encoding: .utf8) ?? ""
                if s.hasSuffix("\r") { s.removeLast() }
                return s
            }
            do {
                let (bytes, response) = try await AppDelegate.llmSession.bytes(for: request)
                let status = (response as? HTTPURLResponse)?.statusCode ?? 0
                if status != 200 {
                    // Status ist bekannt, sobald die Antwort-Kopfzeilen da sind — der
                    // Fehlertyp steht damit fest, EGAL ob der Diagnose-Körper danach
                    // noch vollständig gelesen werden kann. Eigenes do/catch, damit ein
                    // Abbruch beim Körper-Lesen NICHT in den äußeren offline-catch fällt
                    // und einen z. B. echten 401 fälschlich als vorübergehend meldet.
                    let typ = AppDelegate.fehlerTyp(fuerStatus: status)
                    var koerper = Data()
                    do {
                        for try await b in bytes { koerper.append(b); if koerper.count > 4096 { break } }
                    } catch {
                        // Körper unvollständig/nicht lesbar — Status-Typ gilt trotzdem.
                    }
                    let text = String(data: koerper, encoding: .utf8) ?? ""
                    fehler(typ, "HTTP \(status): \(String(text.prefix(300)))")
                    return
                }
                var zeile = Data()
                for try await b in bytes {
                    if b == 0x0A {
                        self.llmRueckruf(["id": id, "typ": "delta", "text": alsZeile(zeile) + "\n"])
                        zeile.removeAll(keepingCapacity: true)
                    } else {
                        zeile.append(b)
                    }
                }
                if !zeile.isEmpty {
                    self.llmRueckruf(["id": id, "typ": "delta", "text": alsZeile(zeile) + "\n"])
                }
                self.llmRueckruf(["id": id, "typ": "fertig"])
            } catch {
                fehler("offline", "Netzfehler: \(error.localizedDescription)")
            }
        }
    }
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
