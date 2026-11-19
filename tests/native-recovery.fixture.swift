extension CafeAuth { func finishRoutingTest() { finishRequest() } }
@main struct RecoveryRoutingChecks {
 @MainActor static func main() async {
  precondition(L("Kafene hoş geldin!", language: "en") == "Welcome to your café!")
  precondition(L("Kafene hoş geldin!", language: "tr") == "Kafene hoş geldin!")
  precondition(L("Unmapped test", language: "en") == "Unmapped test")
  let validation=CafeAuth()
  await validation.password(email: "1", password: "1", username: "", register: false)
  precondition(validation.session == nil && !validation.busy, "Legacy 1/1 must not bypass real account authentication")
  await validation.password(email: "test@example.invalid", password: "", username: "ab", register: true)
  precondition(validation.session == nil && !validation.busy, "Incomplete registration must stay outside the game")
  precondition(!validation.message.isEmpty)
  let emptyPassword=CafeAuth()
  await emptyPassword.password(email: "test@example.invalid", password: "", username: "", register: false)
  precondition(emptyPassword.session == nil && !emptyPassword.busy)
  precondition(emptyPassword.message == L("Şifreni gir."), "Empty password must be rejected before network access")
  let cancelled=CafeAuth()
  await cancelled.completeApple(.failure(ASAuthorizationError(.canceled)))
  precondition(cancelled.session == nil && !cancelled.busy && cancelled.message.isEmpty, "Apple cancellation must leave sign-in usable")
  let serverFailure=CafeAuth()
  await serverFailure.completeApple(.failure(NSError(domain: "CafeAuth", code: 400, userInfo: [NSLocalizedDescriptionKey: "test-server-message"])))
  precondition(serverFailure.message == "test-server-message", "Server failures must not be mislabeled as missing Apple account")
  let link=URL(string:"cafeverse://auth-callback#access_token=test-only&type=recovery")!
  let auth=CafeAuth()
  auth.session=CafeSession(access_token:"test-only",refresh_token:"test-only",user:CafeSession.User(id:"00000000-0000-0000-0000-000000000001"))
  await auth.emailCallback(link)
  precondition(auth.awaitingNewPassword,"Recovery must be presented over an existing session")
  await auth.changePassword("short")
  precondition(auth.awaitingNewPassword,"Invalid short password must not dismiss recovery")
  auth.cancelPasswordRecovery()
  precondition(!auth.awaitingNewPassword)
  precondition(auth.session != nil,"Cancel must preserve an existing session")
  let queued=CafeAuth();queued.busy=true
  await queued.emailCallback(link)
  precondition(!queued.awaitingNewPassword)
  queued.finishRoutingTest()
  for _ in 0..<10 { await Task.yield() }
  precondition(queued.awaitingNewPassword,"Recovery URL must survive a busy restore")
  let unrelated=CafeAuth()
  await unrelated.emailCallback(URL(string:"cafeverse://other#access_token=test-only&type=recovery")!)
  precondition(!unrelated.awaitingNewPassword)
  let entry = CafeDeletionJournal.Entry(userID: "00000000-0000-0000-0000-000000000001", receipt: String(repeating: "a", count: 64))
  let decoded = try! JSONDecoder().decode(CafeDeletionJournal.Entry.self, from: JSONEncoder().encode(entry))
  precondition(decoded.userID == entry.userID && decoded.receipt == entry.receipt)
  do { _ = try await CafeAccountClient(session: nil).send("/api/stock"); preconditionFailure("Account bridge must reject arbitrary game paths") } catch { }
  print("PASS native deletion receipt encoding and account-only URL whitelist; no network or keychain writes.")
  print("PASS native recovery routing: existing session, busy callback queue, short-password rejection, cancel preservation, unrelated URL ignored. No network or credential writes.")
 }
}
