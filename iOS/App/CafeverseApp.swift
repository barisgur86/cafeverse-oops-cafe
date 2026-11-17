import SwiftUI
import WebKit
import AuthenticationServices
import CryptoKit
import Security
import StoreKit
import AVFoundation

@main
struct CafeverseApp: App {
    @AppStorage("cafeverse.language") private var language = ""
    var body: some Scene {
        WindowGroup {
            Group {
                if !["tr", "en"].contains(language) {
                    VStack(spacing: 24) {
                        Text("Caféverse").font(.system(size: 42, weight: .heavy, design: .rounded)).foregroundStyle(.pink)
                        Text("Türkçe / English").font(.title2.bold())
                        Button("Türkçe") { language = "tr" }.buttonStyle(.borderedProminent).tint(.pink).controlSize(.large)
                        Button("English") { language = "en" }.buttonStyle(.borderedProminent).tint(.purple).controlSize(.large)
                    }.frame(maxWidth: .infinity, maxHeight: .infinity).background(Color(red: 0.99, green: 0.9, blue: 0.96))
                } else { AccountGate().environment(\.locale, Locale(identifier: language == "en" ? "en" : "tr")) }
            }.preferredColorScheme(.light)
        }
    }
}

// TestFlight beta: all game code/assets are installed with the app.
// Native server-verified authentication gates the bundled game.
private struct DeviceCafe: UIViewRepresentable {
    let userID: String
    let session: CafeSession
    let onLogout: () -> Void
    func makeCoordinator() -> Coordinator { Coordinator(userID: userID, session: session, onLogout: onLogout) }
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.userContentController.add(context.coordinator, name: "cafeLogout")
        configuration.userContentController.add(context.coordinator, name: "cafeLanguage")
        configuration.userContentController.add(context.coordinator, name: "cafeSpeak")
        let languageJSON = String(data: try! JSONEncoder().encode(UserDefaults.standard.string(forKey: "cafeverse.language") ?? "tr"), encoding: .utf8)!
        configuration.userContentController.addUserScript(WKUserScript(source: "globalThis.CafeLanguage = " + languageJSON + ";", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        configuration.userContentController.addScriptMessageHandler(context.coordinator, contentWorld: .page, name: "cafeCloud")
        configuration.userContentController.addScriptMessageHandler(context.coordinator, contentWorld: .page, name: "cafeStore")
        let encoded = String(data: try! JSONEncoder().encode(userID), encoding: .utf8)!
        configuration.userContentController.addUserScript(WKUserScript(source: "globalThis.CafeAccountID = " + encoded + ";globalThis.CafeNativeStore = true;", injectionTime: .atDocumentStart, forMainFrameOnly: true))
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = context.coordinator
        context.coordinator.store.onUpdate = { [weak view] in view?.evaluateJavaScript("window.dispatchEvent(new Event('cafeverse-store-updates'))", completionHandler: nil) }
        view.isOpaque = false
        view.backgroundColor = UIColor(red: 0.98, green: 0.91, blue: 0.97, alpha: 1)
        view.scrollView.bounces = false
        view.scrollView.contentInsetAdjustmentBehavior = .never
        if let start = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web") {
            context.coordinator.root = start.deletingLastPathComponent()
            view.loadFileURL(start, allowingReadAccessTo: start.deletingLastPathComponent())
        } else {
            view.loadHTMLString("<h1>Cafeverse oyun dosyaları bulunamadı.</h1>", baseURL: nil)
        }
        return view
    }
    func updateUIView(_ view: WKWebView, context: Context) {}
    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler, WKScriptMessageHandlerWithReply {
        let onLogout: () -> Void
        let speech = AVSpeechSynthesizer()
        let store: CafeStore
        let cloud: CafeCloud
        init(userID: String, session: CafeSession, onLogout: @escaping () -> Void) { self.onLogout = onLogout; self.store = CafeStore(userID: userID); self.cloud = CafeCloud(session: session) }
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
            if message.name == "cafeCloud" {
                guard message.frameInfo.isMainFrame, let url = message.frameInfo.request.url,
                      url.isFileURL, let root,
                      url.standardizedFileURL.path.hasPrefix(root.standardizedFileURL.path + "/"),
                      let body = message.body as? [String: Any] else {
                    replyHandler(nil, "Geçersiz bulut isteği."); return
                }
                Task { @MainActor in
                    do { replyHandler(try await cloud.handle(body), nil) }
                    catch { replyHandler(nil, error.localizedDescription) }
                }
                return
            }
            guard message.name == "cafeStore", message.frameInfo.isMainFrame,
                  let url = message.frameInfo.request.url, url.isFileURL, let root,
                  url.standardizedFileURL.path.hasPrefix(root.standardizedFileURL.path + "/"),
                  let body = message.body as? [String: Any] else { replyHandler(nil, "Geçersiz mağaza isteği."); return }
            Task { @MainActor in
                do { replyHandler(try await store.handle(body), nil) }
                catch { replyHandler(nil, error.localizedDescription) }
            }
        }
        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "cafeLogout" { onLogout(); return }
            guard message.frameInfo.isMainFrame, let url = message.frameInfo.request.url,
                  url.isFileURL, let root, url.standardizedFileURL.path.hasPrefix(root.standardizedFileURL.path + "/"),
                  let value = message.body as? String else { return }
            if message.name == "cafeLanguage", ["tr", "en"].contains(value) {
                UserDefaults.standard.set(value, forKey: "cafeverse.language")
            }
            if message.name == "cafeSpeak" {
                speech.stopSpeaking(at: .immediate)
                guard ["tr", "en"].contains(value) else { return }
                let utterance = AVSpeechUtterance(string: value == "en" ? "Come, come!" : "Gel, gel!")
                utterance.voice = AVSpeechSynthesisVoice(language: value == "en" ? "en-US" : "tr-TR")
                utterance.rate = 0.48; utterance.pitchMultiplier = 1.2; utterance.volume = 1
                speech.speak(utterance)
            }
        }
        var root: URL?
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { decisionHandler(.cancel); return }
            if url.absoluteString == "about:blank" { decisionHandler(.allow); return }
            guard url.isFileURL, let root = root else { decisionHandler(.cancel); return }
            let base = root.standardizedFileURL.path + "/"
            decisionHandler(url.standardizedFileURL.path.hasPrefix(base) ? .allow : .cancel)
        }
    }
}

// Supabase RPC calls stay in native Swift; WebKit never receives bearer tokens.
@MainActor private final class CafeCloud {
    private var session: CafeSession
    init(session: CafeSession) { self.session = session }
    func handle(_ body: [String: Any]) async throws -> [String: Any] {
        try await send(body, canRefresh: true)
    }
    private func send(_ body: [String: Any], canRefresh: Bool) async throws -> [String: Any] {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: "CafeAuthURL") as? String,
              let base = URL(string: raw), base.scheme == "https", base.host != nil,
              let key = Bundle.main.object(forInfoDictionaryKey: "CafeAuthPublishableKey") as? String,
              !key.isEmpty else { throw URLError(.badURL) }
        guard let action = body["action"] as? String, action == "pull" || action == "push" else { throw URLError(.badURL) }
        var request = URLRequest(url: base.appendingPathComponent("rest/v1/rpc/cafe_cloud_" + action))
        request.httpMethod = "POST"
        request.setValue(key, forHTTPHeaderField: "apikey")
        request.setValue("Bearer " + session.access_token, forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if action == "push" {
            guard let save = body["save"] as? [String: Any], let revision = body["expectedVersion"] as? Int, revision >= 0 else { throw URLError(.badURL) }
            request.httpBody = try JSONSerialization.data(withJSONObject: ["expected_version": revision, "next_save": save])
        } else { request.httpBody = Data("{}".utf8) }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        if http.statusCode == 401 && canRefresh {
            var refresh = URLRequest(url: base.appendingPathComponent("auth/v1/token"))
            var parts = URLComponents(url: refresh.url!, resolvingAgainstBaseURL: false)!
            parts.queryItems = [URLQueryItem(name: "grant_type", value: "refresh_token")]; refresh.url = parts.url
            refresh.httpMethod = "POST"; refresh.setValue(key, forHTTPHeaderField: "apikey")
            refresh.setValue("application/json", forHTTPHeaderField: "Content-Type")
            refresh.httpBody = try JSONSerialization.data(withJSONObject: ["refresh_token": session.refresh_token])
            let (renewed, result) = try await URLSession.shared.data(for: refresh)
            guard let status = result as? HTTPURLResponse, (200..<300).contains(status.statusCode) else { throw URLError(.userAuthenticationRequired) }
            let next = try JSONDecoder().decode(CafeSession.self, from: renewed)
            guard next.user.id == session.user.id else { throw URLError(.userAuthenticationRequired) }
            if let current = AccountKeychain.read(), let stored = try? JSONDecoder().decode(CafeSession.self, from: current), stored.user.id == next.user.id {
                try AccountKeychain.save(try JSONEncoder().encode(next))
            }
            session = next
            return try await send(body, canRefresh: false)
        }
        let value = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
        guard (200..<300).contains(http.statusCode), let value else {
            let code = value?["code"] as? String ?? String(http.statusCode)
            throw NSError(domain: "CafeCloud", code: http.statusCode,
                userInfo: [NSLocalizedDescriptionKey: "[\(code)] Bulut kaydı eşitlenemedi; yerel kayıt korundu."])
        }
        return value
    }
}

private struct CafeSession: Codable {
    struct User: Codable { let id: String }
    let access_token: String
    let refresh_token: String
    let user: User
}

private enum AccountKeychain {
    static let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: "com.cafeverse.auth", kSecAttrAccount as String: "session"]
    static func read() -> Data? {
        var q = query; q[kSecReturnData as String] = true; q[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        return SecItemCopyMatching(q as CFDictionary, &result) == errSecSuccess ? result as? Data : nil
    }
    static func save(_ data: Data) throws {
        let update = [kSecValueData as String: data]
        let result = SecItemUpdate(query as CFDictionary, update as CFDictionary)
        if result == errSecItemNotFound {
            var q = query; q[kSecValueData as String] = data
            q[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
            guard SecItemAdd(q as CFDictionary, nil) == errSecSuccess else { throw URLError(.cannotWriteToFile) }
        } else if result != errSecSuccess { throw URLError(.cannotWriteToFile) }
    }
    static func clear() { SecItemDelete(query as CFDictionary) }
    static func verifier(_ value: String? = nil) throws -> String? {
        var q = query; q[kSecAttrAccount as String] = "email-pkce"
        if let value {
            SecItemDelete(q as CFDictionary); q[kSecValueData as String] = Data(value.utf8)
            q[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
            guard SecItemAdd(q as CFDictionary, nil) == errSecSuccess else { throw URLError(.cannotWriteToFile) }
            return value
        }
        q[kSecReturnData as String] = true; var result: CFTypeRef?
        guard SecItemCopyMatching(q as CFDictionary, &result) == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
}

@MainActor private final class CafeAuth: ObservableObject {
    @Published var session: CafeSession?
    @Published var busy = false
    @Published var message = ""
    @Published var awaitingNewPassword = false
    @Published var confirmationEmail: String?
    private var recoveryAccessToken: String?
    private var pendingNonce: String?
    private var deferredCallback: URL?
    private var recoveryRequested = false
    private func finishRequest() {
        busy = false
        if let callback = deferredCallback {
            deferredCallback = nil
            Task { await self.emailCallback(callback) }
        }
    }
    private var base: URL? {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: "CafeAuthURL") as? String,
              let url = URL(string: raw), url.scheme == "https", url.host != nil else { return nil }
        return url
    }
    private var apiKey: String { Bundle.main.object(forInfoDictionaryKey: "CafeAuthPublishableKey") as? String ?? "" }
    private func request(_ path: String, body: [String: Any]? = nil, token: String? = nil, method: String? = nil) async throws -> Data {
        guard let base, !apiKey.isEmpty else {
            throw NSError(domain: "CafeAuth", code: 1, userInfo: [NSLocalizedDescriptionKey: L("Gerçek hesap sunucusunun bağlantısı henüz yapılandırılmadı.")])
        }
        var request = URLRequest(url: base.appendingPathComponent("auth/v1/" + path.components(separatedBy: "?")[0]))
        if let query = path.components(separatedBy: "?").dropFirst().first {
            var parts = URLComponents(url: request.url!, resolvingAgainstBaseURL: false)!; parts.percentEncodedQuery = query; request.url = parts.url
        }
        request.httpMethod = method ?? (body == nil ? "GET" : "POST")
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token { request.setValue("Bearer " + token, forHTTPHeaderField: "Authorization") }
        if let body { request.httpBody = try JSONSerialization.data(withJSONObject: body) }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            let code = (response as? HTTPURLResponse)?.statusCode ?? 0
            let payload = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
            let reason = payload?["error_code"] as? String ?? payload?["code"] as? String ?? ""
            let text: String
            switch reason {
            case "invalid_credentials": text = L("E-posta veya şifre doğru değil. Şifreni yenileyebilir ya da yeni hesap oluşturabilirsin.")
            case "email_not_confirmed": text = L("Önce e-postana gelen doğrulama bağlantısını aç, ardından giriş yap.")
            case "email_address_invalid", "validation_failed": text = L("Geçerli bir e-posta adresi gir.")
            case "email_address_not_authorized", "email_send_failed": text = L("Doğrulama e-postası şu anda gönderilemiyor. Apple ile giriş yapabilir veya daha sonra tekrar deneyebilirsin.")
            case "weak_password": text = L("Daha güçlü bir şifre seç. En az 8 karakter kullan.")
            case "signup_disabled": text = L("Yeni hesap oluşturma şu anda kapalı. Mevcut hesabınla giriş yap.")
            case "over_email_send_rate_limit", "over_request_rate_limit": text = L("Çok fazla deneme yapıldı. Biraz sonra tekrar dene.")
            default: text = code == 429 ? L("Çok fazla deneme yapıldı. Biraz sonra tekrar dene.") : L("Giriş tamamlanamadı. İnternet bağlantını kontrol edip tekrar dene.")
            }
            throw NSError(domain: "CafeAuth", code: code, userInfo: [NSLocalizedDescriptionKey: text])
        }
        return data
    }
    private func accept(_ data: Data) throws {
        let candidate = try JSONDecoder().decode(CafeSession.self, from: data)
        guard !candidate.user.id.isEmpty, !candidate.access_token.isEmpty, !candidate.refresh_token.isEmpty else { throw URLError(.badServerResponse) }
        try AccountKeychain.save(try JSONEncoder().encode(candidate)); session = candidate
    }
    func restore() async {
        guard !busy, !awaitingNewPassword, let data = AccountKeychain.read(), let saved = try? JSONDecoder().decode(CafeSession.self, from: data) else { return }
        busy = true; defer { finishRequest() }
        do {
            // Server refresh validates the session; a local token never unlocks the game by itself.
            try accept(try await request("token?grant_type=refresh_token", body: ["refresh_token": saved.refresh_token]))
        } catch { session = nil; message = L("Oturum doğrulanamadı. İnternetini kontrol edip yeniden giriş yap.") }
    }
    func password(email: String, password: String, username: String, register: Bool) async {
        guard !busy else { return }; busy = true; message = ""; confirmationEmail = nil; defer { finishRequest() }
        let address = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard address.contains("@"), address.split(separator: "@").count == 2,
              !address.contains(" "), address.split(separator: "@").last?.contains(".") == true else { message = L("Geçerli bir e-posta adresi gir."); return }
        if !register && password.isEmpty { message = L("Şifreni gir."); return }
        do {
            if register {
                guard username.trimmingCharacters(in: .whitespacesAndNewlines).count >= 3, password.count >= 8 else {
                    message = L("Kullanıcı adı en az 3, şifre en az 8 karakter olmalı."); return
                }
                var bytes = [UInt8](repeating: 0, count: 32)
                guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else { throw URLError(.unknown) }
                let verifier = Data(bytes).base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
                let challenge = Data(SHA256.hash(data: Data(verifier.utf8))).base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
                _ = try AccountKeychain.verifier(verifier)
                let response = try await request("signup?redirect_to=cafeverse%3A%2F%2Fauth-callback", body: ["email": email.trimmingCharacters(in: .whitespacesAndNewlines), "password": password, "data": ["username": username.trimmingCharacters(in: .whitespacesAndNewlines)], "code_challenge": challenge, "code_challenge_method": "s256"])
                if (try? JSONDecoder().decode(CafeSession.self, from: response)) != nil {
                    try accept(response)
                } else {
                    let payload = (try? JSONSerialization.jsonObject(with: response)) as? [String: Any]
                    let user = payload?["user"] as? [String: Any] ?? payload
                    if let identities = user?["identities"] as? [Any], identities.isEmpty {
                        confirmationEmail = nil
                        message = L("Bu adresle zaten hesabın varsa giriş yap veya Şifremi unuttum seçeneğini kullan.")
                    } else {
                        confirmationEmail = address
                        message = L("Doğrulama bağlantısını ") + address + L(" adresinde kontrol et. Bağlantıyı açtıktan sonra giriş yap.")
                    }
                }
            } else {
                try accept(try await request("token?grant_type=password", body: ["email": email.trimmingCharacters(in: .whitespacesAndNewlines), "password": password]))
            }
        } catch { message = error.localizedDescription }
    }
    func sendPasswordReset(email: String) async {
        guard !busy else { return }
        let address = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard address.contains("@"), address.contains(".") else { message = L("Geçerli bir e-posta adresi gir."); return }
        busy = true; defer { finishRequest() }
        do {
            _ = try await request("recover?redirect_to=cafeverse%3A%2F%2Fauth-callback", body: ["email": address])
            recoveryRequested = true
            message = L("Bu adres kayıtlıysa şifre yenileme bağlantısı gönderildi. E-postanı kontrol et.")
        } catch { message = error.localizedDescription }
    }
    func changePassword(_ password: String) async {
        guard !busy, awaitingNewPassword, let token = recoveryAccessToken else { return }
        guard password.count >= 8 else { message = L("Yeni şifre en az 8 karakter olmalı."); return }
        busy = true; defer { finishRequest() }
        do {
            _ = try await request("user", body: ["password": password], token: token, method: "PUT")
            awaitingNewPassword = false; recoveryAccessToken = nil; recoveryRequested = false
            session = nil; AccountKeychain.clear()
            message = L("Şifren değiştirildi. Yeni şifrenle giriş yap.")
        } catch { message = error.localizedDescription }
    }
    func cancelPasswordRecovery() {
        recoveryAccessToken = nil; recoveryRequested = false; awaitingNewPassword = false; message = ""
    }
    func emailCallback(_ url: URL) async {
        guard url.scheme == "cafeverse", url.host == "auth-callback" else { return }
        if busy { deferredCallback = url; return }
        // Recovery redirects may return a fragment containing a short-lived access token.
        if let fragment = url.fragment,
           let parts = URLComponents(string: "https://callback.invalid/?" + fragment),
           parts.queryItems?.first(where: { $0.name == "type" })?.value == "recovery",
           let token = parts.queryItems?.first(where: { $0.name == "access_token" })?.value, !token.isEmpty {
            recoveryAccessToken = token; awaitingNewPassword = true
            message = L("Yeni şifreni belirle."); return
        }
        // Token-hash recovery links are supported when the Supabase email template uses token_hash.
        if let parts = URLComponents(url: url, resolvingAgainstBaseURL: false),
           parts.queryItems?.first(where: { $0.name == "type" })?.value == "recovery",
           let hash = parts.queryItems?.first(where: { $0.name == "token_hash" })?.value {
            busy = true; defer { finishRequest() }
            do {
                let data = try await request("verify", body: ["token_hash": hash, "type": "recovery"])
                let response = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                guard let token = response?["access_token"] as? String else { throw URLError(.badServerResponse) }
                recoveryAccessToken = token; awaitingNewPassword = true
                message = L("Yeni şifreni belirle.")
            } catch { message = L("Şifre yenileme bağlantısı geçersiz veya süresi dolmuş.") }
            return
        }
        guard url.scheme == "cafeverse", url.host == "auth-callback", !busy else { return }
        guard let code = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.first(where: { $0.name == "code" })?.value,
              let verifier = try? AccountKeychain.verifier() else {
            message = L("E-posta doğrulamasından sonra e-posta ve şifrenle giriş yap."); return
        }
        busy = true; defer { finishRequest() }
        do {
            let data = try await request("token?grant_type=pkce", body: ["auth_code": code, "code_verifier": verifier])
            let type = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.first(where: { $0.name == "type" })?.value
            if recoveryRequested || type == "recovery" {
                let candidate = try JSONDecoder().decode(CafeSession.self, from: data)
                recoveryAccessToken = candidate.access_token
                awaitingNewPassword = true
                recoveryRequested = false
                message = L("Yeni şifreni belirle.")
            } else { try accept(data) }
        }
        catch { message = L("Doğrulama bağlantısı kullanılamadı. E-posta ve şifrenle giriş yap.") }
    }
    func prepareApple(_ request: ASAuthorizationAppleIDRequest) {
        var bytes = [UInt8](repeating: 0, count: 32)
        guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else {
            pendingNonce = nil; message = L("Güvenli giriş başlatılamadı."); return
        }
        let nonce = Data(bytes).base64EncodedString(); pendingNonce = nonce
        request.nonce = SHA256.hash(data: Data(nonce.utf8)).map { String(format: "%02x", $0) }.joined()
        request.requestedScopes = [.fullName, .email]
    }
    func completeApple(_ result: Result<ASAuthorization, Error>) async {
        guard !busy else { return }; busy = true; message = ""; defer { finishRequest(); pendingNonce = nil }
        do {
            let authorization = try result.get()
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let bytes = credential.identityToken, let idToken = String(data: bytes, encoding: .utf8), let nonce = pendingNonce else { throw URLError(.userAuthenticationRequired) }
            // Supabase verifies Apple's signature, audience, expiry and nonce before issuing our session.
            try accept(try await request("token?grant_type=id_token", body: ["provider": "apple", "id_token": idToken, "nonce": nonce]))
        } catch {
            if let apple = error as? ASAuthorizationError, apple.code == .canceled { return }
            if (error as NSError).domain == "CafeAuth" { message = error.localizedDescription; return }
            #if targetEnvironment(simulator)
            message = L("Apple girişi tamamlanamadı. Simülatörün Ayarlar uygulamasında Apple hesabına giriş yap veya e-posta ile devam et.")
            #else
            message = L("Apple girişi tamamlanamadı. Apple hesabını ve internet bağlantını kontrol edip tekrar dene.")
            #endif
        }
    }
    func logout() async {
        let token = session?.access_token
        session = nil; AccountKeychain.clear()
        if let token { _ = try? await request("logout?scope=local", body: [:], token: token) }
    }
}

private struct AccountGate: View {
    @AppStorage("cafeverse.language") private var selectedLanguage = "tr"
    @StateObject private var auth = CafeAuth()
    @State private var email = ""
    @State private var password = ""
    @State private var username = ""
    @State private var register = false
    @State private var forgotPassword = false
    @State private var showPassword = false
    private let ink = Color(red: 0.29, green: 0.10, blue: 0.31)
    private let pink = Color(red: 0.86, green: 0.10, blue: 0.55)
    private var title: String { auth.awaitingNewPassword ? L("Yeni şifren") : forgotPassword ? L("Şifreni yenile") : register ? L("Kafeni oluşturalım") : L("Kafene hoş geldin!") }
    private var hero: UIImage? {
        guard let url = Bundle.main.url(forResource: "cafe-interior", withExtension: "png", subdirectory: "Web/assets") else { return nil }
        return UIImage(contentsOfFile: url.path)
    }
    private func entry(_ icon: String, @ViewBuilder content: () -> some View) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon).foregroundStyle(pink).frame(width: 22)
            content().font(.system(size: 18)).foregroundStyle(ink)
        }.padding(15).background(Color.white).clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color(red: 0.91, green: 0.77, blue: 0.87), lineWidth: 1))
    }
    var body: some View {
        Group {
            if let session = auth.session, !auth.awaitingNewPassword {
                DeviceCafe(userID: session.user.id, session: session, onLogout: { Task { await auth.logout() } })
                    .id(session.user.id)
            } else {
                ScrollView {
                    VStack(spacing: 0) {
                        ZStack(alignment: .bottomLeading) {
                            if let hero { Image(uiImage: hero).resizable().scaledToFill().frame(height: 205).clipped() }
                            else { LinearGradient(colors: [.purple, .pink], startPoint: .topLeading, endPoint: .bottomTrailing).frame(height: 205) }
                            LinearGradient(colors: [.clear, Color.black.opacity(0.35)], startPoint: .center, endPoint: .bottom)
                            Text(L("Küçük bir kafe, kocaman bir dünya.")).font(.system(size: 18, weight: .bold, design: .rounded)).foregroundStyle(.white).shadow(radius: 3).padding(20)
                        }.frame(height: 205).accessibilityLabel("Cafeverse OOPS Café")
                        VStack(spacing: 18) {
                            VStack(spacing: 7) {
                                HStack { Text(title); Spacer(); Button(selectedLanguage == "en" ? "Türkçe" : "English") { selectedLanguage = selectedLanguage == "en" ? "tr" : "en"; auth.message = "" }.font(.system(size: 15, weight: .bold)) }.font(.system(size: 28, weight: .heavy, design: .rounded)).foregroundStyle(ink)
                                Text(auth.awaitingNewPassword ? L("En az 8 karakterle güvenli bir şifre belirle.") : forgotPassword ? L("Hesabına dönmen için sana bir bağlantı gönderelim.") : register ? L("Bir hesap oluştur, kafenle yolculuğa başla.") : L("Siparişlerin ve tatlı dostların seni bekliyor."))
                                    .font(.system(size: 16)).foregroundStyle(ink.opacity(0.75)).multilineTextAlignment(.center)
                            }
                            if !forgotPassword && !auth.awaitingNewPassword {
                                Picker(L("Hesap işlemi"), selection: $register) {
                                    Text(L("Giriş yap")).tag(false); Text(L("Hesap oluştur")).tag(true)
                                }.pickerStyle(.segmented).onChange(of: register) { _ in password = ""; auth.message = ""; auth.confirmationEmail = nil }
                            }
                            if register && !forgotPassword && !auth.awaitingNewPassword {
                                entry("person") { TextField(L("Kullanıcı adı"), text: $username).textContentType(.username).textInputAutocapitalization(.never).autocorrectionDisabled() }
                            }
                            if !auth.awaitingNewPassword {
                                entry("envelope") { TextField(L("E-posta"), text: $email).textContentType(.emailAddress).keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled().accessibilityIdentifier("login-email") }
                            }
                            if !forgotPassword || auth.awaitingNewPassword {
                                entry("lock") {
                                    Group {
                                        if showPassword { TextField(auth.awaitingNewPassword ? L("Yeni şifre") : L("Şifre"), text: $password) }
                                        else { SecureField(auth.awaitingNewPassword ? L("Yeni şifre") : L("Şifre"), text: $password) }
                                    }.textContentType(register || auth.awaitingNewPassword ? .newPassword : .password).textInputAutocapitalization(.never).autocorrectionDisabled().accessibilityIdentifier("login-password")
                                    Button { showPassword.toggle() } label: { Image(systemName: showPassword ? "eye.slash" : "eye").foregroundStyle(ink.opacity(0.65)) }.accessibilityLabel(showPassword ? L("Şifreyi gizle") : L("Şifreyi göster"))
                                }
                            }
                            if !register && !forgotPassword && !auth.awaitingNewPassword {
                                HStack { Spacer(); Button(L("Şifremi unuttum")) { forgotPassword = true; auth.message = "" }.font(.system(size: 16, weight: .semibold)).foregroundStyle(pink) }
                            }
                            if !auth.message.isEmpty {
                                Label(auth.message, systemImage: auth.confirmationEmail == nil ? "info.circle" : "envelope.badge")
                                    .font(.system(size: 16)).foregroundStyle(ink).padding(14).frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color.white.opacity(0.85)).clipShape(RoundedRectangle(cornerRadius: 14)).accessibilityIdentifier("auth-status")
                            }
                            Button {
                                Task {
                                    if auth.awaitingNewPassword { await auth.changePassword(password) }
                                    else if forgotPassword { await auth.sendPasswordReset(email: email) }
                                    else { await auth.password(email: email, password: password, username: username, register: register) }
                                    if auth.session != nil || auth.confirmationEmail != nil { password = "" }
                                }
                            } label: {
                                HStack(spacing: 10) {
                                    if auth.busy { ProgressView().tint(.white) }
                                    Text(auth.busy ? L("Bir saniye…") : auth.awaitingNewPassword ? L("Şifreyi kaydet") : forgotPassword ? L("Yenileme bağlantısı gönder") : register ? L("Kafemi oluştur") : L("Kafeme gir"))
                                        .font(.system(size: 20, weight: .bold, design: .rounded))
                                    if !auth.busy { Image(systemName: "arrow.right") }
                                }.foregroundStyle(.white).frame(maxWidth: .infinity).padding(.vertical, 17)
                                    .background(LinearGradient(colors: [Color(red: 0.97, green: 0.35, blue: 0.68), pink], startPoint: .top, endPoint: .bottom))
                                    .clipShape(RoundedRectangle(cornerRadius: 18)).shadow(color: pink.opacity(0.22), radius: 8, y: 4)
                            }.accessibilityIdentifier("login-submit")
                            if !forgotPassword && !auth.awaitingNewPassword {
                                HStack { Rectangle().frame(height: 1); Text(L("veya")).font(.system(size: 15)); Rectangle().frame(height: 1) }.foregroundStyle(ink.opacity(0.3))
                                SignInWithAppleButton(.signIn, onRequest: auth.prepareApple) { result in
                                    Task { await auth.completeApple(result) }
                                }.signInWithAppleButtonStyle(.black).frame(height: 54)
                                    .overlay {
                                        HStack(spacing: 9) {
                                            Image(systemName: "apple.logo").font(.system(size: 22))
                                            Text(selectedLanguage == "en" ? "Sign in with Apple" : "Apple ile Giriş Yap").font(.system(size: 19, weight: .medium))
                                        }.foregroundStyle(.white).frame(maxWidth: .infinity, maxHeight: .infinity).background(Color.black).allowsHitTesting(false).accessibilityHidden(true)
                                    }.accessibilityLabel(selectedLanguage == "en" ? "Sign in with Apple" : "Apple ile Giriş Yap")
                                    .clipShape(RoundedRectangle(cornerRadius: 14))
                            }
                            if auth.awaitingNewPassword {
                                Button(L("Şifre yenilemeyi iptal et")) { auth.cancelPasswordRecovery(); password = "" }.font(.system(size: 17, weight: .semibold)).foregroundStyle(pink)
                            }
                            if forgotPassword {
                                Button(L("Giriş ekranına dön")) { forgotPassword = false; auth.message = ""; password = "" }.font(.system(size: 17, weight: .semibold)).foregroundStyle(pink)
                            }
                            Text(L("Kafeni hesabınla koru, kaldığın yerden devam et.")).font(.system(size: 14)).foregroundStyle(ink.opacity(0.6)).multilineTextAlignment(.center)
                        }.padding(24).frame(maxWidth: 480).frame(maxWidth: .infinity)
                            .disabled(auth.busy)
                    }.frame(maxWidth: 640).frame(maxWidth: .infinity)
                }.scrollDismissesKeyboard(.interactively).background(Color(red: 1, green: 0.93, blue: 0.97))
            }
        }.task { await auth.restore() }.onOpenURL { url in Task { await auth.emailCallback(url) } }
    }
}

// Consumable delivery is persisted by the game before the transaction is finished.
@MainActor private final class CafeStore {
    static let amounts = ["com.cafeverse.oopscafe.coins250": 250, "com.cafeverse.oopscafe.coins750": 750, "com.cafeverse.oopscafe.coins2000": 2000]
    let account: UUID?
    private var transactions: [String: StoreKit.Transaction] = [:]
    private var finishedTransactions: Set<String> = []
    private var purchaseBusy = false
    private var updates: Task<Void, Never>?
    var onUpdate: (() -> Void)?
    init(userID: String) {
        account = UUID(uuidString: userID)
        updates = Task { [weak self] in
            for await result in StoreKit.Transaction.updates {
                guard let self else { return }
                if let transaction = try? self.verified(result), !self.finishedTransactions.contains(String(transaction.id)) {
                    self.transactions[String(transaction.id)] = transaction
                    self.onUpdate?()
                }
            }
        }
    }
    deinit { updates?.cancel() }
    private func problem(_ text: String) -> NSError { NSError(domain: "CafeStore", code: 1, userInfo: [NSLocalizedDescriptionKey: text]) }
    private func verified(_ result: VerificationResult<StoreKit.Transaction>) throws -> StoreKit.Transaction {
        guard case .verified(let transaction) = result,
              transaction.appBundleID == "com.cafeverse.oopscafe",
              transaction.appAccountToken == account, account != nil,
              transaction.productType == .consumable,
              transaction.revocationDate == nil,
              transaction.purchasedQuantity == 1,
              Self.amounts[transaction.productID] != nil else {
            throw problem(L("Satın alma Apple tarafından bu hesap için doğrulanamadı."))
        }
        return transaction
    }
    private func payload(_ transaction: StoreKit.Transaction) -> [String: Any] {
        ["transactionID": String(transaction.id), "productID": transaction.productID,
         "coins": Self.amounts[transaction.productID]!, "environment": transaction.environment.rawValue]
    }
    func handle(_ body: [String: Any]) async throws -> [String: Any] {
        switch body["action"] as? String {
        case "products":
            let products = try await Product.products(for: Array(Self.amounts.keys))
            return ["products": products.sorted { Self.amounts[$0.id]! < Self.amounts[$1.id]! }.map {
                ["id": $0.id, "coins": Self.amounts[$0.id]!, "name": $0.displayName, "price": $0.displayPrice] as [String: Any]
            }, "canPay": AppStore.canMakePayments]
        case "purchase":
            guard !purchaseBusy else { throw problem(L("Önce devam eden satın almayı tamamla.")) }
            guard AppStore.canMakePayments else { throw problem(L("Bu cihazda satın alma kapalı.")) }
            guard let account, let id = body["productID"] as? String, Self.amounts[id] != nil else { throw problem(L("Ürün veya hesap geçersiz.")) }
            purchaseBusy = true; defer { purchaseBusy = false }
            guard let product = try await Product.products(for: [id]).first, product.type == .consumable else {
                throw problem(L("Ürün App Store'da henüz kullanıma açık değil."))
            }
            switch try await product.purchase(options: [.appAccountToken(account)]) {
            case .success(let result):
                let transaction = try verified(result)
                transactions[String(transaction.id)] = transaction
                return ["status": "purchased", "transaction": payload(transaction)]
            case .pending: return ["status": "pending"]
            case .userCancelled: return ["status": "cancelled"]
            @unknown default: throw problem(L("Satın alma sonucu alınamadı."))
            }
        case "pending":
            for await result in StoreKit.Transaction.unfinished {
                if let transaction = try? verified(result), !finishedTransactions.contains(String(transaction.id)) { transactions[String(transaction.id)] = transaction }
            }
            return ["transactions": transactions.values.map(payload)]
        case "finish":
            guard let id = body["transactionID"] as? String else { throw problem(L("Teslim bekleyen işlem bulunamadı.")) }
            if finishedTransactions.contains(id) { return ["finished": true] }
            guard let transaction = transactions[id] else { throw problem(L("Teslim bekleyen işlem bulunamadı.")) }
            // Called only after the bundled game confirms its durable, idempotent credit.
            await transaction.finish(); finishedTransactions.insert(id); transactions.removeValue(forKey: id)
            return ["finished": true]
        default: throw problem(L("Desteklenmeyen mağaza işlemi."))
        }
    }
}


private let cafeEnglish: [String: String] = [
    "Şifreni gir.": "Enter your password.",
    "Dil seç": "Choose your language",
    "Dil / Language": "Language / Dil",
    "Dili değiştir": "Change language",
    "Türkçe": "Türkçe",
    "English": "English",
    "Kapat": "Close",
    "Devam et": "Continue",
    "Ayarlar": "Settings",
    "Ses açık": "Sound on",
    "Ses kapalı": "Sound off",
    "Kafem": "My café",
    "Tarifler": "Recipes",
    "Gardırop": "Wardrobe",
    "Dekorasyon ve petler": "Decor and pets",
    "Dekor ve petler": "Decor and pets",
    "Dekorasyon": "Decoration",
    "Dekor": "Decor",
    "Oyuncular": "Players",
    "Takas": "Trade",
    "Kapıya çık": "Go outside",
    "Dünyalar": "Worlds",
    "Koleksiyon": "Collection",
    "Kafeyi büyüt": "Expand café",
    "Menü": "Menu",
    "Görevler": "Quests",
    "Geliştir": "Upgrade",
    "Karakter": "Character",
    "Coin mağazası": "Coin shop",
    "Hesap / çıkış": "Account / sign out",
    "Kafeye geç": "Enter café",
    "Kafeme dön": "Return to café",
    "Kafeye dön": "Return to café",
    "Kafe menüsünü aç": "Open café menu",
    "Oyun menüsünü aç": "Open game menu",
    "Kafe araçları": "Café tools",
    "OOPS! CAFÉ · CANLI KAFE": "OOPS! CAFÉ · LIVE CAFÉ",
    "BİRLİKTE MASA SERVİSİ": "SERVE THE WHOLE TABLE",
    "PAKET SERVİS": "TAKEAWAY",
    "Paket siparişi": "Takeaway order",
    "Paket": "Takeaway",
    "Masa": "Table",
    "Giriş": "Entrance",
    "Seviye": "Level",
    "misafir bekliyor": "guests waiting",
    "misafir": "guests",
    "masa": "tables",
    "koltuk": "seats",
    "kişilik": "seats",
    "hazır": "ready",
    "Melo çalışıyor…": "Melo is working…",
    "Makine çalışıyor": "Blender is running",
    "Melo yolda": "Melo is on the way",
    "Kafen yaşıyor": "Your café is alive",
    "Masaya servis et": "Serve the table",
    "Paketi teslim et": "Hand over takeaway",
    "Siparişi hazırla": "Prepare the order",
    "Misafirleri masaya al": "Welcome the guests",
    "Paket siparişi al": "Take a takeaway order",
    "Müşteri çağır": "Call guests",
    "Servise hazır": "Ready to serve",
    "Afiyet olsun!": "Enjoy!",
    "Harika servis!": "Wonderful service!",
    "Geliştirmeyi kapat": "Close upgrades",
    "Kafeni büyüt": "Grow your café",
    "Kafene yeni kapasite ekler.": "Adds more room to your café.",
    "Hazırlamayı hızlandırır.": "Speeds up preparation.",
    "Yerleştir": "Place it",
    "Yeni eşyan kafenin içine yerleşti!": "Your new item is now in your café!",
    "Bir masaya dokun, misafirlerini karşıla.": "Tap a table to welcome your guests.",
    "Misafirlerini karşıla.": "Welcome your guests.",
    "Siparişleri aynı tepside birlikte teslim et.": "Serve the whole order together on one tray.",
    "Kapıdan yeni müşteri çağır.": "Call new guests from the doorway.",
    "Önce bekleyen siparişleri servis et.": "Serve the waiting orders first.",
    "Misafirlerin masadan ayrılıyor.": "Your guests are leaving the table.",
    "Melo bütün ürünleri tepsiye alıyor.": "Melo is collecting the whole order.",
    "Misafirler mutlu! Birlikte servis edildi.": "Happy guests! The whole order was served.",
    "Misafirlerin teşekkür edip kapıya yürüyor.": "Your guests thank you and walk to the door.",
    "Yeni geliştirmeler açıldı.": "New upgrades unlocked.",
    "Hazırlık tamamlanamadı; yeniden dene.": "Preparation failed. Please try again.",
    "Servis tamamlanamadı; yeniden dene.": "Serving failed. Please try again.",
    "Satın alma tamamlanamadı.": "Purchase could not be completed.",
    "Üç kez seslen; kafenin önüne yeni misafirler gelsin.": "Call three times to attract new guests.",
    "Gel gel! Taptaze kahve var!": "Come come! Fresh coffee is ready!",
    "Gel gel!": "Come come!",
    "Çilekli Frappé": "Strawberry Frappé",
    "Bulut Frappé": "Cloud Frappé",
    "Galaksi Mocha": "Galaxy Mocha",
    "Gökkuşağı Latte": "Rainbow Latte",
    "Yıldız Çikolata": "Star Chocolate",
    "Pembe Mocha": "Pink Mocha",
    "Vanilyalı Latte": "Vanilla Latte",
    "Çilekli Süt": "Strawberry Milk",
    "Buzlu Espresso": "Iced Espresso",
    "Kakaolu Milkshake": "Chocolate Milkshake",
    "Kremalı Mocha": "Creamy Mocha",
    "Yıldızlı Süt": "Star Milk",
    "Ananaslı Smoothie": "Pineapple Smoothie",
    "Vişneli Jöle": "Cherry Jelly",
    "Mutsuz Cupcake": "Sad Cupcake",
    "Ananaslı Frappé": "Pineapple Frappé",
    "Vişneli Süt": "Cherry Milk",
    "Yıldızlı Cupcake": "Star Cupcake",
    "Süt": "Milk",
    "Kahve": "Coffee",
    "Çilek": "Strawberry",
    "Buz": "Ice",
    "Vanilya": "Vanilla",
    "Krema": "Cream",
    "Kakao": "Cocoa",
    "Yıldız tozu": "Stardust",
    "Renkli şurup": "Rainbow syrup",
    "Meyveli": "Fruity",
    "Sütlü": "Milky",
    "Kahveli": "Coffee",
    "Çikolatalı": "Chocolate",
    "Sihirli": "Magical",
    "İkinci masa": "Second table",
    "Üçüncü masa": "Third table",
    "Dördüncü masa": "Fourth table",
    "Espresso makinesi II": "Espresso machine II",
    "Geniş servis tezgâhı": "Wide serving counter",
    "Kafe genişletme": "Café expansion",
    "Blender II": "Blender II",
    "Alındı ✓": "Owned ✓",
    "Satın al": "Buy",
    "Kafede ✓": "In your café ✓",
    "Depo": "Pantry",
    "Tarif": "Recipe",
    "Malzemeler": "Ingredients",
    "Malzemeleri seç": "Choose ingredients",
    "Karıştır!": "Blend!",
    "Servis Et!": "Serve!",
    "Servis et": "Serve",
    "Sipariş Hazır!": "Order ready!",
    "Sipariş hazır!": "Order ready!",
    "Karıştırılıyor…": "Blending…",
    "Tepsiye ekle": "Add to tray",
    "Sıradaki misafir": "Next guest",
    "Ödülünü al": "Claim reward",
    "Devam Et": "Continue",
    "Saksı bitkisi": "Potted plant",
    "Bahar çiçekleri": "Spring flowers",
    "Uykucu kedi": "Sleepy cat",
    "Masal mantarı": "Fairy mushroom",
    "Pirana": "Piranha",
    "Canlı ananas": "Living pineapple",
    "Mutsuz cupcake": "Sad cupcake",
    "Vişneli jöle": "Cherry jelly",
    "Mavi civciv": "Blue chick",
    "Şef şapkası": "Chef hat",
    "Pembe önlük": "Pink apron",
    "Fiyonk": "Bow",
    "Gözlük": "Glasses",
    "Yok": "None",
    "Tak": "Wear",
    "Çıkar": "Remove",
    "Giyiliyor": "Wearing",
    "Giy": "Wear",
    "Sahipsin": "Owned",
    "Giriş yap": "Sign in",
    "Hesap oluştur": "Create account",
    "Kullanıcı adı": "Username",
    "E-posta": "Email",
    "Şifre": "Password",
    "Yeni şifre": "New password",
    "Şifremi unuttum": "Forgot password",
    "Şifreyi yenile": "Reset password",
    "Girişe dön": "Back to sign in",
    "İşlem tamamlanamadı.": "Could not complete the request.",
    "Hesabın kontrol ediliyor…": "Checking your account…",
    "Şifren yenilendi. Yeni şifrenle giriş yap.": "Password updated. Sign in with your new password.",
    "Kafe Açık": "Café open",
    "Kafe açık": "Café open",
    "Kafeye gir": "Enter café",
    "Gel gel! Taptaze kahve ve tatlı var!": "Come come! Fresh coffee and treats!",
    "Çağrı tamamlandı": "Call complete",
    "Kafe önünde kollarını sallayarak müşteri çağıran iki renkli hava üflemeli balon": "Two colorful inflatable greeters waving outside the café",
    "Sesli çağrı bu cihazda kullanılamıyor.": "Voice calling is unavailable on this device.",
    "Tekrar seslen": "Call again",
    "Kafene dön": "Enter your café",
    "Müşteriler geliyor!": "Guests are coming!",
    "Birazdan tekrar çağırabilirsin.": "You can call again shortly.",
    "Hesabım": "My account",
    "Çıkış yap": "Sign out",
    "Kayıtlı": "Saved",
    "Kaydet": "Save",
    "İptal": "Cancel",
    "Tamam": "OK",
    "Hazırlanıyor…": "Preparing…",
    "Bağlanıyor…": "Connecting…",
    "Yükleniyor…": "Loading…",
    "Ölçü": "Measure",
    "ölçü": "measure",
    "jeton": "coins",
    "müşteri": "guests",
    "ürün": "items",
    "sipariş": "order",
    "Biraz daha altın için siparişleri tamamla.": "Complete orders to earn more coins.",
    "Küçük bir kafe, kocaman bir dünya.": "A little café, a whole world.",
    "Kafene hoş geldin!": "Welcome to your café!",
    "Kafeni oluşturalım": "Let's create your café",
    "Yeni şifren": "Your new password",
    "Şifreni yenile": "Reset your password",
    "En az 8 karakterle güvenli bir şifre belirle.": "Choose a secure password with at least 8 characters.",
    "Hesabına dönmen için sana bir bağlantı gönderelim.": "We will send you a link to get back into your account.",
    "Bir hesap oluştur, kafenle yolculuğa başla.": "Create an account and start your café journey.",
    "Siparişlerin ve tatlı dostların seni bekliyor.": "Your orders and sweet friends are waiting for you.",
    "Bir saniye…": "Just a moment…",
    "Şifreyi kaydet": "Save password",
    "Yenileme bağlantısı gönder": "Send reset link",
    "Kafemi oluştur": "Create my café",
    "Kafeme gir": "Enter my café",
    "veya": "or",
    "Şifre yenilemeyi iptal et": "Cancel password reset",
    "Giriş ekranına dön": "Back to sign in",
    "Kafeni hesabınla koru, kaldığın yerden devam et.": "Keep your café safe and pick up where you left off.",
    "Şifreyi gizle": "Hide password",
    "Şifreyi göster": "Show password",
    "Kullanıcı adı en az 3, şifre en az 8 karakter olmalı.": "Use at least 3 characters for your username and 8 for your password.",
    "Geçerli bir e-posta adresi gir.": "Enter a valid email address.",
    "Yeni şifre en az 8 karakter olmalı.": "Your new password must have at least 8 characters.",
    "Yeni şifreni belirle.": "Choose your new password.",
    "Şifren değiştirildi. Yeni şifrenle giriş yap.": "Password updated. Sign in with your new password.",
    "Bu adres kayıtlıysa şifre yenileme bağlantısı gönderildi. E-postanı kontrol et.": "If this email is registered, a reset link has been sent. Check your inbox.",
    "Giriş tamamlanamadı. İnternet bağlantını kontrol edip tekrar dene.": "Sign-in failed. Check your internet connection and try again.",
    "E-posta veya şifre doğru değil. Şifreni yenileyebilir ya da yeni hesap oluşturabilirsin.": "Incorrect email or password. Reset your password or create an account.",
    "Çok fazla deneme yapıldı. Biraz sonra tekrar dene.": "Too many attempts. Please try again later.",
    "Önce e-postana gelen doğrulama bağlantısını aç, ardından giriş yap.": "Open the verification link in your email, then sign in.",
    "E-posta doğrulamasından sonra e-posta ve şifrenle giriş yap.": "After verifying your email, sign in with your email and password.",
    "Bu adresle zaten hesabın varsa giriş yap veya Şifremi unuttum seçeneğini kullan.": "If you already have an account, sign in or use Forgot password.",
    "Doğrulama e-postası şu anda gönderilemiyor. Apple ile giriş yapabilir veya daha sonra tekrar deneyebilirsin.": "Verification email is unavailable. Sign in with Apple or try again later.",
    "Yeni hesap oluşturma şu anda kapalı. Mevcut hesabınla giriş yap.": "Registration is currently closed. Sign in with your existing account.",
    "Şifre yenileme bağlantısı geçersiz veya süresi dolmuş.": "The reset link is invalid or has expired.",
    "Doğrulama bağlantısı kullanılamadı. E-posta ve şifrenle giriş yap.": "The verification link could not be used. Sign in with your email and password.",
    "Doğrulama bağlantısını ": "Check the verification link at ",
    " adresinde kontrol et. Bağlantıyı açtıktan sonra giriş yap.": ". Open the link, then sign in.",
    "Apple girişi tamamlanamadı. Apple hesabını ve internet bağlantını kontrol edip tekrar dene.": "Apple sign-in failed. Check your Apple Account and internet connection, then try again.",
    "Apple girişi tamamlanamadı. Simülatörün Ayarlar uygulamasında Apple hesabına giriş yap veya e-posta ile devam et.": "Apple sign-in failed. Sign in to your Apple Account in Simulator Settings, or continue with email.",
    "Oturum doğrulanamadı. İnternetini kontrol edip yeniden giriş yap.": "Your session could not be verified. Check your connection and sign in again.",
    "Güvenli giriş başlatılamadı.": "Secure sign-in could not be started.",
    "Daha güçlü bir şifre seç. En az 8 karakter kullan.": "Choose a stronger password with at least 8 characters.",
    "Bu cihazda satın alma kapalı.": "Purchases are disabled on this device.",
    "Desteklenmeyen mağaza işlemi.": "Unsupported store operation.",
    "Satın alma Apple tarafından bu hesap için doğrulanamadı.": "Apple could not verify this purchase for your account.",
    "Satın alma sonucu alınamadı.": "Could not retrieve the purchase result.",
    "Teslim bekleyen işlem bulunamadı.": "No pending transaction was found.",
    "Önce devam eden satın almayı tamamla.": "Complete the current purchase first.",
    "Ürün App Store'da henüz kullanıma açık değil.": "This product is not yet available on the App Store.",
    "Ürün veya hesap geçersiz.": "Invalid product or account.",
    "Gerçek hesap sunucusunun bağlantısı henüz yapılandırılmadı.": "The account server has not been configured.",
    "Hesap işlemi": "Account request"
]
private func L(_ text: String, language: String = UserDefaults.standard.string(forKey: "cafeverse.language") ?? "tr") -> String {
    guard language == "en" else { return text }
    return cafeEnglish[text] ?? text
}
