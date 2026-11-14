import SwiftUI
import WebKit
import AuthenticationServices
import CryptoKit
import Security
import StoreKit

@main
struct CafeverseApp: App {
    var body: some Scene {
        WindowGroup {
            AccountGate()
                .preferredColorScheme(.light)
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
            if message.name == "cafeLogout" { onLogout() }
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
    let session: CafeSession
    init(session: CafeSession) { self.session = session }
    func handle(_ body: [String: Any]) async throws -> [String: Any] {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: "CafeAuthURL") as? String,
              let base = URL(string: raw), base.scheme == "https", base.host != nil,
              let key = Bundle.main.object(forInfoDictionaryKey: "CafeAuthPublishableKey") as? String,
              !key.isEmpty else { throw URLError(.badURL) }
        guard let action = body["action"] as? String, action == "pull" || action == "push" else {
            throw URLError(.badURL)
        }
        var request = URLRequest(url: base.appendingPathComponent("rest/v1/rpc/cafe_cloud_" + action))
        request.httpMethod = "POST"
        request.setValue(key, forHTTPHeaderField: "apikey")
        request.setValue("Bearer " + session.access_token, forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if action == "push" {
            guard let save = body["save"] as? [String: Any],
                  let revision = body["expectedVersion"] as? Int, revision >= 0 else { throw URLError(.badURL) }
            request.httpBody = try JSONSerialization.data(withJSONObject: ["expected_version": revision, "next_save": save])
        } else { request.httpBody = Data("{}".utf8) }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode),
              let value = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw NSError(domain: "CafeCloud", code: (response as? HTTPURLResponse)?.statusCode ?? 0,
                          userInfo: [NSLocalizedDescriptionKey: "Bulut kaydı eşitlenemedi; yerel kayıt korundu."])
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
    private var recoveryAccessToken: String?
    private var pendingNonce: String?
    private var base: URL? {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: "CafeAuthURL") as? String,
              let url = URL(string: raw), url.scheme == "https", url.host != nil else { return nil }
        return url
    }
    private var apiKey: String { Bundle.main.object(forInfoDictionaryKey: "CafeAuthPublishableKey") as? String ?? "" }
    private func request(_ path: String, body: [String: Any]? = nil, token: String? = nil, method: String? = nil) async throws -> Data {
        guard let base, !apiKey.isEmpty else {
            throw NSError(domain: "CafeAuth", code: 1, userInfo: [NSLocalizedDescriptionKey: "Gerçek hesap sunucusunun bağlantısı henüz yapılandırılmadı."])
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
            let text = code == 429 ? "Çok fazla deneme. Biraz sonra tekrar dene." : "İşlem doğrulanamadı. Bilgilerini ve e-posta doğrulamasını kontrol et."
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
        guard let data = AccountKeychain.read(), let saved = try? JSONDecoder().decode(CafeSession.self, from: data) else { return }
        busy = true; defer { busy = false }
        do {
            // Server refresh validates the session; a local token never unlocks the game by itself.
            try accept(try await request("token?grant_type=refresh_token", body: ["refresh_token": saved.refresh_token]))
        } catch { session = nil; message = "Oturum doğrulanamadı. İnternetini kontrol edip yeniden giriş yap." }
    }
    func password(email: String, password: String, username: String, register: Bool) async {
        guard !busy else { return }; busy = true; message = ""; defer { busy = false }
        do {
            if register {
                guard username.count >= 3, password.count >= 8 else {
                    message = "Kullanıcı adı en az 3, şifre en az 8 karakter olmalı."; return
                }
                var bytes = [UInt8](repeating: 0, count: 32)
                guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else { throw URLError(.unknown) }
                let verifier = Data(bytes).base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
                let challenge = Data(SHA256.hash(data: Data(verifier.utf8))).base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
                _ = try AccountKeychain.verifier(verifier)
                _ = try await request("signup?redirect_to=cafeverse%3A%2F%2Fauth-callback", body: ["email": email.trimmingCharacters(in: .whitespacesAndNewlines), "password": password, "data": ["username": username], "code_challenge": challenge, "code_challenge_method": "s256"])
                // Always require a separate login, including email confirmation when configured.
                message = "Hesap isteğin alındı. E-postana gelen doğrulama bağlantısını açıp giriş yap."
            } else {
                try accept(try await request("token?grant_type=password", body: ["email": email.trimmingCharacters(in: .whitespacesAndNewlines), "password": password]))
            }
        } catch { message = error.localizedDescription }
    }
    func sendPasswordReset(email: String) async {
        guard !busy else { return }
        let address = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard address.contains("@"), address.contains(".") else { message = "Geçerli bir e-posta adresi gir."; return }
        busy = true; defer { busy = false }
        do {
            _ = try await request("recover?redirect_to=cafeverse%3A%2F%2Fauth-callback", body: ["email": address])
            message = "Bu adres kayıtlıysa şifre yenileme bağlantısı gönderildi. E-postanı kontrol et."
        } catch { message = error.localizedDescription }
    }
    func changePassword(_ password: String) async {
        guard !busy, awaitingNewPassword, let token = recoveryAccessToken else { return }
        guard password.count >= 8 else { message = "Yeni şifre en az 8 karakter olmalı."; return }
        busy = true; defer { busy = false }
        do {
            _ = try await request("user", body: ["password": password], token: token, method: "PUT")
            awaitingNewPassword = false; recoveryAccessToken = nil
            message = "Şifren değiştirildi. Yeni şifrenle giriş yap."
        } catch { message = error.localizedDescription }
    }
    func emailCallback(_ url: URL) async {
        guard url.scheme == "cafeverse", url.host == "auth-callback", !busy else { return }
        // Recovery redirects may return a fragment containing a short-lived access token.
        if let fragment = url.fragment,
           let parts = URLComponents(string: "https://callback.invalid/?" + fragment),
           parts.queryItems?.first(where: { $0.name == "type" })?.value == "recovery",
           let token = parts.queryItems?.first(where: { $0.name == "access_token" })?.value, !token.isEmpty {
            recoveryAccessToken = token; awaitingNewPassword = true
            message = "Yeni şifreni belirle."; return
        }
        // Token-hash recovery links are supported when the Supabase email template uses token_hash.
        if let parts = URLComponents(url: url, resolvingAgainstBaseURL: false),
           parts.queryItems?.first(where: { $0.name == "type" })?.value == "recovery",
           let hash = parts.queryItems?.first(where: { $0.name == "token_hash" })?.value {
            busy = true; defer { busy = false }
            do {
                let data = try await request("verify", body: ["token_hash": hash, "type": "recovery"])
                let response = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                guard let token = response?["access_token"] as? String else { throw URLError(.badServerResponse) }
                recoveryAccessToken = token; awaitingNewPassword = true
                message = "Yeni şifreni belirle."
            } catch { message = "Şifre yenileme bağlantısı geçersiz veya süresi dolmuş." }
            return
        }
        guard url.scheme == "cafeverse", url.host == "auth-callback", !busy else { return }
        guard let code = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.first(where: { $0.name == "code" })?.value,
              let verifier = try? AccountKeychain.verifier() else {
            message = "E-posta doğrulamasından sonra e-posta ve şifrenle giriş yap."; return
        }
        busy = true; defer { busy = false }
        do { try accept(try await request("token?grant_type=pkce", body: ["auth_code": code, "code_verifier": verifier])) }
        catch { message = "Doğrulama bağlantısı kullanılamadı. E-posta ve şifrenle giriş yap." }
    }
    func prepareApple(_ request: ASAuthorizationAppleIDRequest) {
        var bytes = [UInt8](repeating: 0, count: 32)
        guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else {
            pendingNonce = nil; message = "Güvenli giriş başlatılamadı."; return
        }
        let nonce = Data(bytes).base64EncodedString(); pendingNonce = nonce
        request.nonce = SHA256.hash(data: Data(nonce.utf8)).map { String(format: "%02x", $0) }.joined()
        request.requestedScopes = [.fullName, .email]
    }
    func completeApple(_ result: Result<ASAuthorization, Error>) async {
        guard !busy else { return }; busy = true; message = ""; defer { busy = false; pendingNonce = nil }
        do {
            let authorization = try result.get()
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let bytes = credential.identityToken, let idToken = String(data: bytes, encoding: .utf8), let nonce = pendingNonce else { throw URLError(.userAuthenticationRequired) }
            // Supabase verifies Apple's signature, audience, expiry and nonce before issuing our session.
            try accept(try await request("token?grant_type=id_token", body: ["provider": "apple", "id_token": idToken, "nonce": nonce]))
        } catch {
            if (error as? ASAuthorizationError)?.code != .canceled { message = "Apple girişi tamamlanamadı. " + error.localizedDescription }
        }
    }
    func logout() async {
        let token = session?.access_token
        session = nil; AccountKeychain.clear()
        if let token { _ = try? await request("logout?scope=local", body: [:], token: token) }
    }
}

private struct AccountGate: View {
    @StateObject private var auth = CafeAuth()
    @State private var email = ""
    @State private var password = ""
    @State private var username = ""
    @State private var register = false
    @State private var forgotPassword = false
    var body: some View {
        Group {
            if let session = auth.session {
                DeviceCafe(userID: session.user.id, session: session, onLogout: { Task { await auth.logout() } })
                    .id(session.user.id)
            } else {
                ScrollView {
                    VStack(spacing: 18) {
                        Text("Cafeverse ☕").font(.largeTitle.bold())
                        Text(auth.awaitingNewPassword ? "Yeni şifre belirle" : forgotPassword ? "Şifreni yenile" : register ? "Kendi hesabını oluştur" : "Kafene hoş geldin").font(.title2.bold())
                        if register && !forgotPassword && !auth.awaitingNewPassword {
                            TextField("Kullanıcı adı", text: $username).textContentType(.username).textInputAutocapitalization(.never)
                        }
                        if !auth.awaitingNewPassword { TextField("E-posta", text: $email).textContentType(.emailAddress).keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled() }
                        if !forgotPassword || auth.awaitingNewPassword { SecureField(auth.awaitingNewPassword ? "Yeni şifre" : "Şifre", text: $password) .textContentType(register || auth.awaitingNewPassword ? .newPassword : .password) }
                        Button(auth.awaitingNewPassword ? "Şifreyi kaydet" : forgotPassword ? "Yenileme bağlantısı gönder" : register ? "Hesap oluştur" : "Giriş yap") {
                            let secret = password; password = ""
                            Task {
                                if auth.awaitingNewPassword { await auth.changePassword(secret) }
                                else if forgotPassword { await auth.sendPasswordReset(email: email) }
                                else { await auth.password(email: email, password: secret, username: username, register: register) }
                            }
                        }.buttonStyle(.borderedProminent).controlSize(.large)
                        if !auth.awaitingNewPassword {
                            Button(forgotPassword ? "Giriş ekranına dön" : register ? "Hesabım var · Giriş yap" : "Yeni hesap oluştur") {
                                if forgotPassword { forgotPassword = false } else { register.toggle() }
                                password = ""; auth.message = ""
                            }
                            if !register && !forgotPassword {
                                Button("Şifremi unuttum") { forgotPassword = true; auth.message = "" }
                            }
                        }
                        if !forgotPassword && !auth.awaitingNewPassword {
                        Text("veya").foregroundStyle(.secondary)
                        SignInWithAppleButton(.signIn, onRequest: auth.prepareApple) { result in
                            Task { await auth.completeApple(result) }
                        }.signInWithAppleButtonStyle(.black).frame(maxWidth: 375).frame(height: 54)
                        }
                        if auth.busy { ProgressView("Hesabın doğrulanıyor…") }
                        Text(auth.message).font(.body).accessibilityIdentifier("auth-status")
                        Text("Hesabına giriş için internet gerekir.").font(.footnote).foregroundStyle(.secondary)
                    }.textFieldStyle(.roundedBorder).padding(28).frame(maxWidth: 480)
                        .disabled(auth.busy).frame(maxWidth: .infinity)
                }.background(Color(red: 0.99, green: 0.92, blue: 0.97))
            }
        }.task { await auth.restore() }.onOpenURL { url in Task { await auth.emailCallback(url) } }
    }
}

// Consumable delivery is persisted by the game before the transaction is finished.
@MainActor private final class CafeStore {
    static let amounts = ["com.cafeverse.oopscafe.coins250": 250, "com.cafeverse.oopscafe.coins750": 750, "com.cafeverse.oopscafe.coins2000": 2000]
    let account: UUID?
    private var transactions: [String: StoreKit.Transaction] = [:]
    private var purchaseBusy = false
    private var updates: Task<Void, Never>?
    var onUpdate: (() -> Void)?
    init(userID: String) {
        account = UUID(uuidString: userID)
        updates = Task { [weak self] in
            for await result in StoreKit.Transaction.updates {
                guard let self else { return }
                if let transaction = try? self.verified(result) {
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
            throw problem("Satın alma Apple tarafından bu hesap için doğrulanamadı.")
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
            guard !purchaseBusy else { throw problem("Önce devam eden satın almayı tamamla.") }
            guard AppStore.canMakePayments else { throw problem("Bu cihazda satın alma kapalı.") }
            guard let account, let id = body["productID"] as? String, Self.amounts[id] != nil else { throw problem("Ürün veya hesap geçersiz.") }
            purchaseBusy = true; defer { purchaseBusy = false }
            guard let product = try await Product.products(for: [id]).first, product.type == .consumable else {
                throw problem("Ürün App Store'da henüz kullanıma açık değil.")
            }
            switch try await product.purchase(options: [.appAccountToken(account)]) {
            case .success(let result):
                let transaction = try verified(result)
                transactions[String(transaction.id)] = transaction
                return ["status": "purchased", "transaction": payload(transaction)]
            case .pending: return ["status": "pending"]
            case .userCancelled: return ["status": "cancelled"]
            @unknown default: throw problem("Satın alma sonucu alınamadı.")
            }
        case "pending":
            for await result in StoreKit.Transaction.unfinished {
                if let transaction = try? verified(result) { transactions[String(transaction.id)] = transaction }
            }
            return ["transactions": transactions.values.map(payload)]
        case "finish":
            guard let id = body["transactionID"] as? String, let transaction = transactions[id] else { throw problem("Teslim bekleyen işlem bulunamadı.") }
            // Called only after the bundled game confirms its durable, idempotent credit.
            await transaction.finish(); transactions.removeValue(forKey: id)
            return ["finished": true]
        default: throw problem("Desteklenmeyen mağaza işlemi.")
        }
    }
}
