import Cocoa
import WebKit
import Security

// MARK: - Speicher (echte Datei mit Backup + Reparatur)

enum Store {
    static var dir: URL = {
        if let o = ProcessInfo.processInfo.environment["AIWT_DATA_DIR"], !o.isEmpty {
            return URL(fileURLWithPath: o, isDirectory: true)
        }
        let fm = FileManager.default
        let basis = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let neu = basis.appendingPathComponent("Onda", isDirectory: true)
        let frueher = basis.appendingPathComponent("Schreibwerkzeug", isDirectory: true)
        // Die App hieß früher "Schreibwerkzeug". Existiert nur der alte Ordner, wird er
        // einmalig umbenannt — dieselben Dateien, nur ein anderer Name. Schlägt das fehl
        // (etwa wegen Rechten), arbeitet die App mit dem alten Ordner weiter, statt einen
        // leeren neuen anzulegen und die Texte scheinbar zu verlieren.
        if !fm.fileExists(atPath: neu.path), fm.fileExists(atPath: frueher.path) {
            do { try fm.moveItem(at: frueher, to: neu) } catch { return frueher }
        }
        return neu
    }()
    static var dataURL: URL { dir.appendingPathComponent("data.json") }
    static var backupURL: URL { dir.appendingPathComponent("data.backup.json") }

    /// Datierte Backup-Generationen: data.backup-JJJJMMTT-HHMMSS-mmm.json.
    /// Neben der unmittelbaren Vorstufe (data.backup.json) bleiben bis zu 5
    /// Generationen mit mindestens 60 s Abstand erhalten — ein Fehler, der in
    /// schneller Folge speichert, kann so nicht alle Rettungsanker vernichten.
    static let backupPrefix = "data.backup-"
    static let maxBackupGenerationen = 5
    static var backupAbstandSekunden: TimeInterval = 60 // var: der Selbsttest setzt ihn auf 0

    enum SaveErgebnis: Equatable {
        case ok
        case ungueltig            // kein gültiges JSON — wird nie geschrieben
        case abgelehnt(String)    // Plausibilitätstor: beiseitegelegt statt überschrieben
        case fehlgeschlagen       // Schreibfehler der Platte
    }

    static func ensureDir() {
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    }

    static func isValidJSON(_ s: String) -> Bool {
        guard let d = s.data(using: .utf8) else { return false }
        return (try? JSONSerialization.jsonObject(with: d)) != nil
    }

    private static func stamp(_ datum: Date = Date()) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone.current
        f.dateFormat = "yyyyMMdd-HHmmss-SSS"
        return f.string(from: datum)
    }

    /// Alle datierten Generationen, neueste zuerst (das Namensformat sortiert chronologisch).
    static func backupGenerationen() -> [URL] {
        let fm = FileManager.default
        let namen = (try? fm.contentsOfDirectory(atPath: dir.path)) ?? []
        return namen
            .filter { $0.hasPrefix(backupPrefix) && $0.hasSuffix(".json") }
            .sorted(by: >)
            .map { dir.appendingPathComponent($0) }
    }

    /// Lädt den Datenbestand. Bei kaputter Datei: beiseitelegen, dann der Reihe
    /// nach zurückfallen — unmittelbare Vorstufe, dann Generationen, neueste zuerst.
    static func load() -> String {
        let fm = FileManager.default
        guard let d = try? Data(contentsOf: dataURL), let s = String(data: d, encoding: .utf8) else {
            return "null"
        }
        if isValidJSON(s) { return s }
        try? fm.moveItem(at: dataURL, to: dir.appendingPathComponent("data.corrupt-\(stamp()).json"))
        for kandidat in [backupURL] + backupGenerationen() {
            if let bd = try? Data(contentsOf: kandidat),
               let bs = String(data: bd, encoding: .utf8), isValidJSON(bs) {
                return bs
            }
        }
        return "null"
    }

    /// Prüft einen neuen Stand gegen den vorhandenen. nil = plausibel, sonst der Grund.
    /// Zwei Regeln: die Dokument-Anzahl darf nicht von ≥1 auf 0 fallen, und die
    /// Datenmenge darf nicht um mehr als 90 % schrumpfen. Beides sind die Spuren
    /// eines Fehlers, der einen gültigen, aber leeren Zustand speichern will.
    static func pruefePlausibilitaet(neu: String, alt: String) -> String? {
        guard let altData = alt.data(using: .utf8),
              let altObj = (try? JSONSerialization.jsonObject(with: altData)) as? [String: Any],
              let altDocs = altObj["docs"] as? [Any], !altDocs.isEmpty else {
            return nil // kein schützenswerter Altbestand
        }
        let neuData = neu.data(using: .utf8) ?? Data()
        let neuObj = (try? JSONSerialization.jsonObject(with: neuData)) as? [String: Any]
        let neuDocs = (neuObj?["docs"] as? [Any]) ?? []
        if neuDocs.isEmpty { return "dokumente-auf-null" }
        if neuData.count * 10 < altData.count { return "schrumpfung-ueber-90-prozent" }
        return nil
    }

    /// Legt einen abgewiesenen Stand daneben, statt ihn zu verwerfen — falls die
    /// Abweisung falsch war, ist nichts verloren.
    private static func legeBeiseite(_ s: String) {
        let fm = FileManager.default
        var ziel = dir.appendingPathComponent("data.abgelehnt-\(stamp()).json")
        var lauf = 2
        while fm.fileExists(atPath: ziel.path) { // gleiche Millisekunde — nie überschreiben
            ziel = dir.appendingPathComponent("data.abgelehnt-\(stamp())-\(lauf).json")
            lauf += 1
        }
        try? s.data(using: .utf8)?.write(to: ziel, options: .atomic)
    }

    /// Hebt den aktuellen Datenbestand als Backup auf: immer als unmittelbare
    /// Vorstufe, und als neue datierte Generation, wenn die jüngste alt genug ist
    /// (oder `erzwungen`, etwa vor einem bewussten Ersetzen).
    private static func sichereVorstufe(erzwungen: Bool) {
        let fm = FileManager.default
        guard fm.fileExists(atPath: dataURL.path) else { return }
        try? fm.removeItem(at: backupURL)
        try? fm.copyItem(at: dataURL, to: backupURL)

        let generationen = backupGenerationen()
        let juengste = generationen.first.flatMap {
            (try? fm.attributesOfItem(atPath: $0.path))?[.modificationDate] as? Date
        }
        let faellig = juengste.map { Date().timeIntervalSince($0) >= backupAbstandSekunden } ?? true
        guard erzwungen || faellig else { return }

        var ziel = dir.appendingPathComponent("\(backupPrefix)\(stamp()).json")
        var lauf = 2
        while fm.fileExists(atPath: ziel.path) { // gleiche Millisekunde — Namen nie überschreiben
            ziel = dir.appendingPathComponent("\(backupPrefix)\(stamp())-\(lauf).json")
            lauf += 1
        }
        try? fm.copyItem(at: dataURL, to: ziel)

        for alt in backupGenerationen().dropFirst(maxBackupGenerationen) {
            try? fm.removeItem(at: alt)
        }
    }

    /// Speichert atomar — aber nur, was das Plausibilitätstor passiert.
    @discardableResult
    static func save(_ s: String) -> SaveErgebnis {
        guard isValidJSON(s) else { return .ungueltig }
        ensureDir()
        if let alt = try? String(contentsOf: dataURL, encoding: .utf8),
           let grund = pruefePlausibilitaet(neu: s, alt: alt) {
            legeBeiseite(s)
            return .abgelehnt(grund)
        }
        sichereVorstufe(erzwungen: false)
        guard let d = s.data(using: .utf8) else { return .ungueltig }
        do { try d.write(to: dataURL, options: .atomic); return .ok } catch { return .fehlgeschlagen }
    }

    /// Bewusstes Ersetzen (Import, „Alle Daten löschen", bestätigte Rückfrage):
    /// umgeht das Plausibilitätstor, sichert den Altbestand aber IMMER als
    /// erzwungene Generation — der Weg zurück bleibt offen.
    @discardableResult
    static func ersetzen(_ s: String) -> SaveErgebnis {
        guard isValidJSON(s) else { return .ungueltig }
        ensureDir()
        sichereVorstufe(erzwungen: true)
        guard let d = s.data(using: .utf8) else { return .ungueltig }
        do { try d.write(to: dataURL, options: .atomic); return .ok } catch { return .fehlgeschlagen }
    }

    /// Räumt beiseitegelegte Dateien (data.corrupt-*, data.abgelehnt-*) ab,
    /// die älter als `aelterAlsTage` sind — 30 Tage sind genug Zeit, sie zu bemerken.
    static func wartung(aelterAlsTage: Int = 30) {
        let fm = FileManager.default
        let grenze = Date().addingTimeInterval(-TimeInterval(aelterAlsTage) * 86_400)
        let namen = (try? fm.contentsOfDirectory(atPath: dir.path)) ?? []
        for name in namen where name.hasPrefix("data.corrupt-") || name.hasPrefix("data.abgelehnt-") {
            let url = dir.appendingPathComponent(name)
            guard let datum = (try? fm.attributesOfItem(atPath: url.path))?[.modificationDate] as? Date,
                  datum < grenze else { continue }
            try? fm.removeItem(at: url)
        }
    }
}

// MARK: - Schlüsselbund (API-Schlüssel verlässt nie den nativen Prozess)

enum Keychain {
    static let service = "Onda"
    /// Die App hieß früher "Schreibwerkzeug". Ein damals hinterlegter Schlüssel wird beim
    /// ersten Lesen still auf den neuen Namen übernommen — niemand muss ihn neu eintragen.
    static let fruehererService = "Schreibwerkzeug"
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
    /// Findet sich unter dem heutigen Namen nichts, wird einmalig der frühere Eintrag
    /// übernommen (kopieren, dann alten löschen).
    static func lesen(service: String = Keychain.service, account: String = Keychain.account) -> String? {
        if let s = roh(service: service, account: account) { return s }
        guard service == Keychain.service,
              let alt = roh(service: Keychain.fruehererService, account: account) else { return nil }
        if setzen(alt, service: service, account: account) {
            SecItemDelete(basisAbfrage(service: Keychain.fruehererService, account: account) as CFDictionary)
        }
        return alt
    }

    private static func roh(service: String, account: String) -> String? {
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
        // Beim Löschen auch einen eventuell verbliebenen Alt-Eintrag entfernen, damit ein
        // gelöschter Schlüssel nicht beim nächsten Lesen wieder auftaucht.
        if service == Keychain.service {
            SecItemDelete(basisAbfrage(service: Keychain.fruehererService, account: account) as CFDictionary)
        }
        return status == errSecSuccess || status == errSecItemNotFound
    }

    /// Beantwortet "gibt es einen Schlüssel?" OHNE ihn zu lesen.
    ///
    /// Vorher rief das hier schlicht `lesen()` — und damit `SecItemCopyMatching` mit
    /// `kSecReturnData: true`. Um eine Ja/Nein-Frage zu beantworten, wurde also jedes Mal
    /// das Geheimnis selbst entschlüsselt, und JEDE Entschlüsselung fragt den
    /// Schlüsselbund um Erlaubnis. Diese Frage stellt Onda vor jedem Hinweislauf, vor
    /// jedem Erweiterungslauf und bei jedem Öffnen der Einstellungen: die Passwortabfrage
    /// kam deshalb dauernd wieder, ganz unabhängig von der Signatur.
    ///
    /// Ohne `kSecReturnData` prüft das Betriebssystem nur, ob der Eintrag EXISTIERT. Dafür
    /// muss es nichts entschlüsseln, also fragt es auch niemanden. Nebenbei ist es das
    /// sauberere Verhalten: das Geheimnis wird nur noch gelesen, wenn es benutzt wird.
    static func vorhanden(service: String = Keychain.service, account: String = Keychain.account) -> Bool {
        if existiert(service: service, account: account) { return true }
        // Derselbe Alt-Eintrag, den `lesen` still übernimmt — auch hier nur nachsehen,
        // nicht lesen. Die Übernahme selbst passiert weiterhin erst beim echten Lesen.
        if service == Keychain.service, existiert(service: Keychain.fruehererService, account: account) { return true }
        return false
    }

    private static func existiert(service: String, account: String) -> Bool {
        var query = basisAbfrage(service: service, account: account)
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        // Bewusst KEIN kSecReturnData: sonst wird entschlüsselt, und Entschlüsseln fragt.
        query[kSecReturnAttributes as String] = true
        return SecItemCopyMatching(query as CFDictionary, nil) == errSecSuccess
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
    check("speichern", Store.save(doc1) == .ok)
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
    check("ungueltiges-abgelehnt", Store.save("{nope") == .ungueltig)

    // 6) Viele schnelle Speichervorgänge hintereinander
    var ok = true
    for i in 0..<50 {
        let s = "{\"docs\":[{\"id\":\"r\",\"title\":\"t\(i)\",\"body\":\"<p>\(i)</p>\",\"updated\":\(i)}],\"active\":\"r\"}"
        if Store.save(s) != .ok { ok = false }
    }
    check("50x-schnell-speichern", ok && Store.load().contains("t49"))

    // 7) Großer Text (~3 MB)
    let big = String(repeating: "Lorem ipsum älterer Text mit Umlauten öäüß. ", count: 70_000)
    let obj: [String: Any] = ["docs": [["id": "b", "title": "Groß", "body": big, "updated": 3]], "active": "b"]
    let bigStr = String(data: try! JSONSerialization.data(withJSONObject: obj), encoding: .utf8)!
    check("gross-speichern", Store.save(bigStr) == .ok)
    check("gross-laden", Store.load() == bigStr)

    // 8) Plausibilitätstor: ein leerer oder stark geschrumpfter Stand wird
    //    abgewiesen und beiseitegelegt — data.json bleibt unangetastet.
    let leer = "{\"docs\":[],\"active\":null}"
    check("leer-zustand-abgewiesen", Store.save(leer) == .abgelehnt("dokumente-auf-null"))
    check("leer-zustand-nicht-geschrieben", Store.load() == bigStr)
    let winzig = "{\"docs\":[{\"id\":\"w\",\"title\":\"w\",\"body\":\"<p>w</p>\",\"updated\":9}],\"active\":\"w\"}"
    check("schrumpfung-abgewiesen", Store.save(winzig) == .abgelehnt("schrumpfung-ueber-90-prozent"))
    check("schrumpfung-nicht-geschrieben", Store.load() == bigStr)
    let abgelegt = (try? FileManager.default.contentsOfDirectory(atPath: Store.dir.path))?
        .filter({ $0.hasPrefix("data.abgelehnt-") }).count ?? 0
    check("abgewiesenes-beiseitegelegt", abgelegt == 2)
    let halb = String(repeating: "Lorem ipsum älterer Text mit Umlauten öäüß. ", count: 35_000)
    let halbObj: [String: Any] = ["docs": [["id": "h", "title": "Halb", "body": halb, "updated": 4]], "active": "h"]
    let halbStr = String(data: try! JSONSerialization.data(withJSONObject: halbObj), encoding: .utf8)!
    check("maessige-verkleinerung-erlaubt", Store.save(halbStr) == .ok)

    // 9) Bewusstes Ersetzen umgeht das Tor, sichert den Altbestand aber erzwungen.
    check("ersetzen-umgeht-tor", Store.ersetzen(leer) == .ok)
    check("ersetzen-geschrieben", Store.load() == leer)
    let neuesteGeneration = Store.backupGenerationen().first
        .flatMap { try? String(contentsOf: $0, encoding: .utf8) }
    check("ersetzen-sichert-vorstufe", neuesteGeneration == halbStr)

    // 10) Rotation: höchstens 5 datierte Generationen, und der Rückfall
    //     erreicht sie, wenn Datei UND unmittelbare Vorstufe kaputt sind.
    Store.backupAbstandSekunden = 0
    var rotStaende: [String] = []
    for i in 0..<9 {
        let s = "{\"docs\":[{\"id\":\"g\",\"title\":\"rot\(i)\",\"body\":\"<p>Generation \(i)</p>\",\"updated\":\(i)}],\"active\":\"g\"}"
        rotStaende.append(s)
        if Store.save(s) != .ok { ok = false }
    }
    check("rotation-speichert", ok)
    check("rotation-max-generationen", Store.backupGenerationen().count == Store.maxBackupGenerationen)
    try? "{kaputt!!".data(using: .utf8)!.write(to: Store.dataURL)
    try? "{kaputt!!".data(using: .utf8)!.write(to: Store.backupURL)
    check("rueckfall-auf-generation", Store.load() == rotStaende[7])
    Store.backupAbstandSekunden = 60

    // 11) Wartung: Beiseitegelegtes älter als 30 Tage wird abgeräumt, Junges bleibt.
    let fm = FileManager.default
    let altCorrupt = Store.dir.appendingPathComponent("data.corrupt-altlast.json")
    let altAbgelehnt = Store.dir.appendingPathComponent("data.abgelehnt-altlast.json")
    try? "{}".data(using: .utf8)!.write(to: altCorrupt)
    try? "{}".data(using: .utf8)!.write(to: altAbgelehnt)
    let vor40Tagen = Date().addingTimeInterval(-40 * 86_400)
    try? fm.setAttributes([.modificationDate: vor40Tagen], ofItemAtPath: altCorrupt.path)
    try? fm.setAttributes([.modificationDate: vor40Tagen], ofItemAtPath: altAbgelehnt.path)
    Store.wartung(aelterAlsTage: 30)
    check("wartung-raeumt-altes-ab", !fm.fileExists(atPath: altCorrupt.path) && !fm.fileExists(atPath: altAbgelehnt.path))
    let jungeReste = (try? fm.contentsOfDirectory(atPath: Store.dir.path))?
        .contains(where: { $0.hasPrefix("data.corrupt-") || $0.hasPrefix("data.abgelehnt-") }) ?? false
    check("wartung-verschont-junges", jungeReste)

    // 12) Fehler-Vokabular der LLM-Brücke: bekannte Status bleiben, Unbekanntes
    //     heißt "unbekannt" (der Verteiler wiederholt es genau einmal).
    check("fehlertyp-401", AppDelegate.fehlerTyp(fuerStatus: 401) == "kein-schluessel")
    check("fehlertyp-403", AppDelegate.fehlerTyp(fuerStatus: 403) == "kein-schluessel")
    check("fehlertyp-429", AppDelegate.fehlerTyp(fuerStatus: 429) == "ratenlimit")
    check("fehlertyp-529", AppDelegate.fehlerTyp(fuerStatus: 529) == "ueberlastet")
    check("fehlertyp-503", AppDelegate.fehlerTyp(fuerStatus: 503) == "ueberlastet")
    check("fehlertyp-400", AppDelegate.fehlerTyp(fuerStatus: 400) == "schema")
    check("fehlertyp-404", AppDelegate.fehlerTyp(fuerStatus: 404) == "schema")
    check("fehlertyp-418-unbekannt", AppDelegate.fehlerTyp(fuerStatus: 418) == "unbekannt")
    check("fehlertyp-0-unbekannt", AppDelegate.fehlerTyp(fuerStatus: 0) == "unbekannt")

    // 13) Schlüsselbund-Helfer (eigener Selbsttest-Eintrag — der echte bleibt unberührt)
    let tService = "Onda-Selbsttest"
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
    let liveProbePath: String?
    var liveProbeRequestCount = 0

    init(probePath: String?, liveProbePath: String?) {
        self.probePath = probePath
        self.liveProbePath = liveProbePath
    }

    func applicationDidFinishLaunching(_ n: Notification) {
        Store.cleanOrphanImages()
        Store.wartung()

        let ucc = WKUserContentController()
        ucc.add(self, name: "store")
        ucc.add(self, name: "ersetzen")
        ucc.add(self, name: "exportmd")
        ucc.add(self, name: "probe")
        ucc.add(self, name: "saveimg")
        ucc.add(self, name: "printreq")
        ucc.add(self, name: "openurl")
        ucc.add(self, name: "llmkey")
        ucc.add(self, name: "llm")
        ucc.add(self, name: "liveprobe")

        let data = Store.load()
        let js = "window.__NATIVE_DATA__ = \(data); window.__PROBE__ = \(probePath != nil ? "true" : "false"); window.__LIVE_LLM_PROBE__ = \(liveProbePath != nil ? "true" : "false");"
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
        window.title = "Onda"
        window.minSize = NSSize(width: 720, height: 460)
        window.contentView = webView
        window.setFrameAutosaveName("OndaMain")
        if window.frame.width < 300 { window.center() }

        if probePath == nil && liveProbePath == nil {
            window.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
        }

        guard let res = Bundle.main.resourceURL else { fatalError("Resources fehlen") }
        let htmlURL = res.appendingPathComponent("index.html")
        webView.loadFileURL(htmlURL, allowingReadAccessTo: res)

        if let p = probePath {
            // 20 s Not-Aus: die Probe wartet drinnen selbst geduldig auf ihre
            // Quittungen (bis zu 5 s Bild-Brücke + 8 s Save-Quittung).
            DispatchQueue.main.asyncAfter(deadline: .now() + 20) {
                try? "{\"error\":\"timeout\"}".write(toFile: p, atomically: true, encoding: .utf8)
                try? FileManager.default.removeItem(at: Store.dir) // Wegwerf-Verzeichnis der Probe
                exit(2)
            }
        }
        if let p = liveProbePath {
            // Der echte Lauf bleibt auf genau eine Anfrage begrenzt. Der Timeout-
            // Beleg enthält keine Antwort- oder Schlüsselwerte.
            DispatchQueue.main.asyncAfter(deadline: .now() + 180) {
                let safe = "{\"passed\":false,\"keyPresent\":false,\"requestCount\":0,\"nativeRequestCount\":\(self.liveProbeRequestCount),\"task\":\"hinweise\",\"model\":\"claude-opus-5\",\"durationMs\":180000,\"usage\":{\"inputTokens\":0,\"outputTokens\":0,\"cacheReadInputTokens\":0,\"cacheCreationInputTokens\":0},\"annotationKind\":null,\"schemaValid\":false,\"errorType\":\"abgebrochen\"}"
                try? safe.write(toFile: p, atomically: true, encoding: .utf8)
                try? FileManager.default.removeItem(at: Store.dir)
                exit(2)
            }
        }
    }

    func userContentController(_ ucc: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "store":
            guard let s = message.body as? String else { return }
            quittiereSave(Store.save(s))
        case "ersetzen":
            // Bewusster Umweg am Plausibilitätstor vorbei (Import, „Alle Daten
            // löschen", bestätigte Rückfrage) — sichert vorher erzwungen.
            guard let s = message.body as? String else { return }
            quittiereSave(Store.ersetzen(s))
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
            if liveProbePath != nil { liveProbeRequestCount += 1 }
            handleLlm(obj)
        case "probe":
            if let p = probePath, let s = message.body as? String {
                try? s.write(toFile: p, atomically: true, encoding: .utf8)
                try? FileManager.default.removeItem(at: Store.dir) // Wegwerf-Verzeichnis der Probe
                exit(0)
            }
        case "liveprobe":
            guard let p = liveProbePath,
                  let s = message.body as? String,
                  let d = s.data(using: .utf8),
                  let obj = (try? JSONSerialization.jsonObject(with: d)) as? [String: Any] else { return }
            // Whitelist statt Durchreichen: Selbst bei kompromittiertem Webcode kann
            // der persistierte Nachweis keine Anfrage, Antwort oder Header enthalten.
            let usageIn = obj["usage"] as? [String: Any] ?? [:]
            func ganzeZahl(_ key: String, aus quelle: [String: Any]) -> Int {
                max(0, (quelle[key] as? NSNumber)?.intValue ?? 0)
            }
            let arten = Set(["rechtschreibung", "grammatik", "zeichensetzung", "wortwahl", "satzstil", "absatzstil", "straffen", "wiederholung", "ton", "stilmittel", "anglizismus", "terminologie", "verschieben", "uebergang", "gliederung", "fluss", "faden", "ueberschrift", "anmerkung", "beleg", "faktencheck", "widerspruch", "luecke", "verstaendlichkeit"])
            let fehlertypen = Set(["kein-schluessel", "offline", "ratenlimit", "ueberlastet", "schema", "abgelehnt", "abgebrochen", "unbekannt"])
            let art = obj["annotationKind"] as? String
            let fehler = obj["errorType"] as? String
            let genauEineAnfrage = liveProbeRequestCount == 1 && ganzeZahl("requestCount", aus: obj) == 1
            let schemaGueltig = obj["schemaValid"] as? Bool == true && art.map(arten.contains) == true
            let gemeldetBestanden = obj["passed"] as? Bool == true
            let bestanden = genauEineAnfrage && schemaGueltig && gemeldetBestanden
            let safe: [String: Any] = [
                "passed": bestanden,
                "keyPresent": obj["keyPresent"] as? Bool == true,
                "requestCount": ganzeZahl("requestCount", aus: obj),
                "nativeRequestCount": liveProbeRequestCount,
                "task": "hinweise",
                "model": "claude-opus-5",
                "durationMs": ganzeZahl("durationMs", aus: obj),
                "usage": [
                    "inputTokens": ganzeZahl("inputTokens", aus: usageIn),
                    "outputTokens": ganzeZahl("outputTokens", aus: usageIn),
                    "cacheReadInputTokens": ganzeZahl("cacheReadInputTokens", aus: usageIn),
                    "cacheCreationInputTokens": ganzeZahl("cacheCreationInputTokens", aus: usageIn),
                ],
                "annotationKind": art.map(arten.contains) == true ? art! : NSNull(),
                "schemaValid": schemaGueltig,
                "errorType": fehler.map(fehlertypen.contains) == true ? fehler! : NSNull(),
            ]
            if let safeData = try? JSONSerialization.data(withJSONObject: safe, options: [.prettyPrinted, .sortedKeys]) {
                try? safeData.write(to: URL(fileURLWithPath: p), options: .atomic)
            }
            try? FileManager.default.removeItem(at: Store.dir)
            exit(bestanden ? 0 : 2)
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
        a.messageText = "Onda"
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
        a.messageText = "Onda"
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

    /// Quittiert einen Speichervorgang an die Oberfläche — und, falls gerade das
    /// Beenden auf diese Quittung wartet, an macOS. Der Save selbst ist zu diesem
    /// Zeitpunkt schon auf der Platte gelandet (oder eben nicht).
    func quittiereSave(_ ergebnis: Store.SaveErgebnis) {
        let cb: String
        switch ergebnis {
        case .ok:
            cb = "window.__nativeSaveOk__ && window.__nativeSaveOk__()"
        case .abgelehnt:
            // Fällt auf den einfachen Fehler-Rückruf zurück, falls die geladene
            // Oberfläche den Rückfrage-Rückruf noch nicht kennt. Beim Beenden
            // gibt es keine Rückfrage mehr: die stellt sich im laufenden Betrieb
            // in dem Moment, in dem die Abweisung passiert — ein Dialog während
            // des Schließens käme zu spät und liefe gegen den Abbau der Fenster.
            // Der abgewiesene Stand liegt als data.abgelehnt-* daneben.
            cb = quitWartetAufSave
                ? "window.__nativeSaveFail__ && window.__nativeSaveFail__()"
                : "window.__nativeSaveRejected__ ? window.__nativeSaveRejected__() : (window.__nativeSaveFail__ && window.__nativeSaveFail__())"
        case .ungueltig, .fehlgeschlagen:
            cb = "window.__nativeSaveFail__ && window.__nativeSaveFail__()"
        }
        webView.evaluateJavaScript(cb, completionHandler: nil)
        if quitWartetAufSave {
            quitWartetAufSave = false
            NSApp.reply(toApplicationShouldTerminate: true)
        }
    }

    var quitWartetAufSave = false

    /// Beenden wartet auf die echte Save-Quittung statt auf einen blinden Timer:
    /// __flushForQuit__ stößt in JS ein persist an, dessen store-Nachricht hier
    /// synchron gespeichert und quittiert wird. Ein großzügiges Not-Timeout
    /// beendet trotzdem, falls die Oberfläche hängt oder nichts mehr schickt.
    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        guard let webView = webView else { return .terminateNow }
        quitWartetAufSave = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) { [weak self] in
            guard let self = self, self.quitWartetAufSave else { return }
            self.quitWartetAufSave = false
            NSApp.reply(toApplicationShouldTerminate: true)
        }
        webView.evaluateJavaScript("!!(window.__flushForQuit__ && (window.__flushForQuit__(), true))") { [weak self] result, fehler in
            guard let self = self, self.quitWartetAufSave else { return }
            if fehler != nil || (result as? Bool) != true {
                // Kein Flush registriert — es kommt keine Quittung, sofort beenden.
                self.quitWartetAufSave = false
                NSApp.reply(toApplicationShouldTerminate: true)
            }
        }
        return .terminateLater
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ s: NSApplication) -> Bool { true }
}

func buildMenus(_ delegate: AppDelegate) {
    let main = NSMenu()

    let appItem = NSMenuItem(); main.addItem(appItem)
    let appMenu = NSMenu()
    appMenu.addItem(withTitle: "Über Onda",
                    action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
    appMenu.addItem(.separator())
    appMenu.addItem(withTitle: "Onda ausblenden",
                    action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
    appMenu.addItem(.separator())
    appMenu.addItem(withTitle: "Onda beenden",
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
    /// Nur bekannte Anfragefehler heißen "schema" (nicht wiederholbar); alles
    /// Unbekannte heißt ehrlich "unbekannt" — der Verteiler wagt dafür genau
    /// EINEN vorsichtigen zweiten Versuch.
    static func fehlerTyp(fuerStatus status: Int) -> String {
        switch status {
        case 400, 404, 405, 413, 422: return "schema" // fehlerhafte Anfrage — nicht wiederholbar
        case 401, 403: return "kein-schluessel"
        case 429: return "ratenlimit"
        case 529: return "ueberlastet"
        case 500...599: return "ueberlastet"
        default: return "unbekannt"
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
var liveProbePath: String? = nil
if let i = args.firstIndex(of: "--llm-probe"), i + 1 < args.count { liveProbePath = args[i + 1] }

// Die Startprobe fasst NIE echte Daten an: eigenes Wegwerf-Verzeichnis wie der
// Selbsttest, nach der Probe wieder entfernt.
if probePath != nil || liveProbePath != nil {
    Store.dir = URL(fileURLWithPath: NSTemporaryDirectory())
        .appendingPathComponent("onda-probe-\(UUID().uuidString)", isDirectory: true)
}

let app = NSApplication.shared
let delegate = AppDelegate(probePath: probePath, liveProbePath: liveProbePath)
app.delegate = delegate
let istProbe = probePath != nil || liveProbePath != nil
app.setActivationPolicy(istProbe ? .accessory : .regular)
if !istProbe { buildMenus(delegate) }
app.run()
