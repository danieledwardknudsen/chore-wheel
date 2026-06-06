# Phase 03 — Authentication

**Goal:** Sign-up (name + email + phone SMS verify + passkey registration) and sign-in (passkey only) working end-to-end. All non-auth pages protected by middleware.

**Prerequisites:** Phase 01, 02 complete. `SESSION_SECRET`, `WEBAUTHN_*` env vars set.

---

## Libraries

```
pnpm --filter @chore-wheel/web add \
  @simplewebauthn/server @simplewebauthn/browser \
  iron-session
pnpm --filter @chore-wheel/web add -D \
  @types/iron-session
```

AWS SNS for SMS is behind the abstract interface from Phase 04 — for Phase 03 we use a **stub sink** that logs the OTP to the console. Real SMS is wired in Phase 06.

---

## Session Design

`iron-session` stores a signed, encrypted cookie containing:

```ts
type Session = {
  userId: string;
  passkeyChallenge?: string; // temporary, during auth ceremony
};
```

`apps/web/src/lib/session.ts` — exports `getSession(request)` → `Session | null` and `withSession(handler)` wrapper.

Session secret from `process.env.SESSION_SECRET`.

---

## API Routes

### Phone Verification

`POST /api/auth/send-verification-code`

- Body: `{ phone: string }`
- Validates phone format (E.164).
- Generates a 6-digit code, stores in `phone_verifications` with `expiresAt = now + 10 minutes`.
- Calls the `PhoneVerificationSink` interface (stub in Phase 03, real SNS in Phase 06).
- Returns 200 (always — don't leak whether phone exists).

`POST /api/auth/verify-phone-code`

- Body: `{ phone: string, code: string }`
- Checks the most recent non-expired, non-verified record for that phone.
- If valid: sets `verifiedAt`, returns `{ verified: true }` with a signed cookie confirming phone ownership.
- If invalid: returns 400 with generic error.

### Registration (Passkey)

`POST /api/auth/registration/start`

- Body: `{ name: string, email: string, phone: string }` + phone-verified cookie
- Verifies phone-verified cookie is present and matches the phone in body.
- Creates the user record (or looks up existing; duplicate email/phone returns 409).
- Generates WebAuthn registration options via `@simplewebauthn/server`.
- Stores challenge in session.
- Returns registration options JSON.

`POST /api/auth/registration/finish`

- Body: WebAuthn registration response from browser
- Reads challenge from session; verifies response.
- Stores credential in `passkeys` table.
- Creates session with `userId`.
- Returns `{ success: true }`.

### Authentication (Passkey)

`POST /api/auth/login/start`

- Body: `{ email: string }`
- Looks up user by email.
- Fetches all user's passkey credential IDs.
- Generates authentication options; stores challenge in session.
- Returns authentication options JSON.

`POST /api/auth/login/finish`

- Body: WebAuthn authentication response from browser
- Reads challenge from session; verifies response; updates passkey counter.
- Creates session with `userId`.
- Returns `{ success: true }`.

### Logout

`POST /api/auth/logout`

- Destroys session.
- Returns 200.

---

## Middleware

`apps/web/src/middleware.ts`:

- Public routes: `/`, `/login`, `/register`, `/api/auth/*`
- All other routes: require valid session. Redirect to `/login` if missing.
- API routes without session return 401 JSON.

---

## Abstract Interfaces (stub implementations for Phase 03)

`packages/domain/src/interfaces/phoneVerificationSink.ts`:

```ts
export interface PhoneVerificationSink {
  sendVerificationCode(phone: string, code: string): Promise<void>;
}
```

`packages/domain/src/testing/consolePhoneVerificationSink.ts` — logs code to console.

---

## Tests

### Unit tests (`packages/domain`)

- `generateVerificationCode()` returns a 6-digit string.
- `isVerificationCodeExpired()` works correctly.

### Integration tests (`apps/web`)

- `POST /api/auth/send-verification-code` — creates a record, calls sink.
- `POST /api/auth/verify-phone-code` — validates code, sets verifiedAt, rejects expired/wrong code.
- `POST /api/auth/registration/start` — creates user, generates options, stores challenge.
- `POST /api/auth/registration/finish` — mocked WebAuthn response; stores passkey.
- `POST /api/auth/login/start` — returns options for known user, 404 for unknown.
- `POST /api/auth/login/finish` — mocked response; creates session.
- Middleware test — confirms protected route redirects to `/login` without session.

### E2E tests (`apps/web/e2e`)

- Full sign-up flow (using Playwright's WebAuthn virtual authenticator).
- Full sign-in flow.
- Redirect to login on unauthenticated access.

---

## Test Checklist

- [ ] All integration tests pass.
- [ ] E2E sign-up and sign-in flows pass in Playwright (with virtual authenticator).
- [ ] Accessing `/profile` while logged out redirects to `/login`.
- [ ] Session persists across page reloads.

---

## Commit Message

`feat(auth): add passkey registration, authentication, phone verification, and session management`
