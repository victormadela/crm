# Proposed isolated CRM demonstration

Status: preparation only. DNS, TLS and deployment are not verified or configured.

Proposed entry: https://crm-demo.altiussaude.com.br/_demo/login

Proposed gateway username: `avaliador`.
The password does not exist yet. Generate it privately during approved deployment.
The CRM identity is `avaliacao@crm-demo.invalid`. This identity has no mailbox.

## Scope

Use a separate database, process environment, session secret and gateway credential.
Use synthetic seed records only. Do not import clinical records or production accounts.
Leave Google, Microsoft, Context.dev and agent credentials unset.
Disable telemetry. Do not run the agent or mailbox sync schedules.
Keep the original CRM authentication implementation.

The gateway authenticates only `/_demo/login` with HTTP Basic authentication over HTTPS.
A successful static response sets a preprovisioned CRM session cookie.
The static page links to `/`. It does not use an nginx `return` or rewrite redirect.
Unauthenticated responses do not receive a session cookie.
All other requests use the original CRM session validation.

## Prepared files

- `ops/demo/nginx.conf.example`: proposed HTTPS ingress, without credential values.
- `ops/demo/login.html`: static entry page with no session or password in its body.

The template uses loopback ports 3180 and 3181. Confirm availability before activation.
The template references certificate files that do not exist as part of this preparation.

## Deployment steps after approval

1. Confirm DNS ownership and the proposed hostname. Provision DNS and TLS through the existing administrator workflow.
2. Provision a dedicated database and runtime environment. Bind application and API exclusively to loopback.
3. Set `APP_URL` and `API_URL` to `https://crm-demo.altiussaude.com.br` in the isolated environment.
4. Apply reviewed migrations to the dedicated database. Do not use the production database.
5. Provision `avaliacao@crm-demo.invalid` through the repository's official `dev:session` helper, before loading synthetic seed records.
6. Run the helper with `NODE_ENV=development` only in a private provisioning process. Redirect its output into a restricted temporary file.
7. Derive the effective session cookie name from the API's actual Better Auth runtime cookie configuration.
8. Preserve the helper's signed cookie value exactly. Replace only the cookie name when the runtime uses a secure prefix.
9. Restrict the session lifetime to the agreed evaluation window in the dedicated database. Delete the session after evaluation.
10. Generate a strong gateway password. Store only its password hash in `/etc/crm-demo/access.htpasswd`.
11. Create `/etc/crm-demo/session-headers.conf` privately. It contains one `add_header Set-Cookie` directive, without `always`.
12. Add `Path=/; Secure; HttpOnly; SameSite=Lax` to that cookie. Match its browser lifetime to the session expiration.
13. Store gateway files outside the repository. Restrict secret file permissions to the administrator and nginx worker group.
14. Copy the static HTML into the configured gateway path. Adapt the template to the existing nginx installation.
15. Start the separate API and application. Do not enable the gateway until all acceptance checks pass.
16. Run nginx configuration validation, then activate the reviewed virtual host through the administrator workflow.
17. Supply the entry address, username and password through the user's approved private credential channel.

The helper emits `crm.session_token`. Production cookie settings can use `__Secure-crm.session_token`.
The effective API configuration decides the correct name. Do not guess from the hostname alone.
Never put the signed cookie, password or password hash in Git, chat, URLs or access logs.
Do not use `nginx -T` in shared output after installing the private cookie include.

## Acceptance checks before publication

- A request to `/_demo/login` without gateway credentials returns 401 and has no `Set-Cookie` session header.
- Invalid gateway credentials also return 401 and no session cookie.
- Valid gateway credentials return the static page and the expected secure CRM session cookie.
- A request to the CRM without a session redirects to sign-in. A protected API procedure returns unauthorized.
- The authenticated browser opens the CRM through its normal session validation.
- Server rendering reaches the API through the same hostname. No Basic authentication blocks API requests.
- The evaluator explicitly chooses `Continue without research`. That choice survives page reload.
- Synthetic companies, contacts and deals support create, read, update and archive operations.
- A forged or expired session does not authenticate. Revocation removes access.
- Application, API and database ports remain inaccessible outside loopback.

The template passes `nginx -t` in an isolated temporary configuration with disposable TLS files.
Static checks confirm no rewrite return, no inline session value and no session value in HTML.
An isolated loopback gateway also passed three HTTP/TLS checks with disposable credentials:
no credentials returned 401 without a session cookie; an incorrect password returned 401 without
a session cookie; valid credentials returned 200 with a Secure, HttpOnly, SameSite=Lax session cookie.
The password hash required read permission for the gateway worker group, as specified above.
Public DNS, trusted TLS, production cookie naming and the published browser flow remain pending.
The loopback checks do not demonstrate a working public HTTPS endpoint.

## Evaluation limits

All evaluators share one CRM identity and its permissions. This environment provides no individual audit attribution.
Gateway credentials authorize receipt of the shared session. Existing sessions remain valid until expiration or revocation.
The gateway must not replace production identity management. Real deployment requires an individual identity provider.
The signed session is real, but its user and records are synthetic.
Disable the entry location and revoke its session after evaluation. Remove its private include and password file.

## Local evaluation evidence

The original seed loaded 15 companies, 45 contacts and 23 deals into a separate local database.
The evaluator completed workspace onboarding and explicitly skipped research through the browser.
The API persisted the workspace and the skipped choice without a Context.dev key.
HTTP checks created, updated and read a synthetic contact, moved a synthetic deal between stages,
and archived the synthetic smoke-test records. Anonymous contact access returned 401.
The seed uses its original currencies. BRL needs configuration before a BRL-valued deal is accepted.

Audit, type checks, lint and lint:slop passed. The full uncached suite passed 1,301 tests in a fresh test database.
Test OAuth fixtures matched the repository CI configuration and were set only in the test process.
The demonstration environment has no external identity-provider credentials.
Cold development compilation exceeded the VPS memory budget. A production build avoids repeated development compilation.
The local production build passed with `NODE_OPTIONS=--max-old-space-size=3072 bun run build --webpack` from `apps/app`.
The production application started in 242 milliseconds and rendered the original contacts page through the isolated HTTPS gateway.
Both application and API used production mode. The gateway used the runtime's `__Secure-crm.session_token` cookie name.
The proposed public hostname and trusted public TLS remain unconfigured.

## References

[nginx Basic authentication](https://nginx.org/en/docs/http/ngx_http_auth_basic_module.html) validates gateway credentials.
[nginx response headers](https://nginx.org/en/docs/http/ngx_http_headers_module.html) documents status-dependent `add_header` behavior.
[nginx request phases](https://nginx.org/en/docs/dev/development_guide.html) documents access checks after rewrite processing.
