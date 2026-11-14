extension CafeAuth { func finishRoutingTest() { finishRequest() } }
@main struct RecoveryRoutingChecks {
 @MainActor static func main() async {
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
  print("PASS native recovery routing: existing session, busy callback queue, short-password rejection, cancel preservation, unrelated URL ignored. No network or credential writes.")
 }
}
