# FinanceBuddy Deployment Security Checklist

Last updated: 2026-06-01

This checklist documents the production assumptions behind cookies, CORS,
Swagger, and proxy trust. It should be reviewed whenever the frontend/API host
changes.

## Local Development

Use this for `localhost` only:

```bash
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
COOKIE_DOMAIN=
COOKIE_SAMESITE=lax
TRUST_PROXY=false
ENABLE_SWAGGER=true
```

Expected behavior:

- Swagger is available at `/docs`.
- Refresh cookies are HttpOnly and scoped to `/api/v1/auth`.
- CSRF refresh/logout calls require `X-CSRF-Token` and `X-Requested-With`.

## Same-Site Production

Use this when the web app and API are under the same registrable site, for
example `app.example.com` and `api.example.com`:

```bash
NODE_ENV=production
CORS_ORIGIN=https://app.example.com
COOKIE_SAMESITE=lax
COOKIE_DOMAIN=
TRUST_PROXY=true
ENABLE_SWAGGER=false
```

Notes:

- Prefer `COOKIE_SAMESITE=lax` when the browser considers the app/API same-site.
- Keep `COOKIE_DOMAIN` empty unless there is a specific need to share cookies
  across subdomains.
- `TRUST_PROXY=true` maps to one trusted proxy hop in the app. Use it only when
  the host proxy overwrites `X-Forwarded-*` headers.

## Cross-Site Production

Use this when the frontend and API are on different sites, for example Vercel
for web and Render/Koyeb for API:

```bash
NODE_ENV=production
CORS_ORIGIN=https://finance-buddy.example.vercel.app
COOKIE_SAMESITE=none
COOKIE_DOMAIN=
TRUST_PROXY=true
ENABLE_SWAGGER=false
```

Notes:

- `SameSite=None` requires HTTPS. The API sets `Secure` cookies automatically in
  production.
- Do not use wildcard CORS. Configure the exact frontend origin.
- Keep the refresh cookie scoped to `/api/v1/auth`.

## Swagger

Production Swagger is intentionally disabled in application code. `ENABLE_SWAGGER`
only controls development behavior, so setting it in production does not expose
`/docs`.

If API docs are needed later, publish a static OpenAPI artifact through a private
channel instead of exposing runtime Swagger publicly.

## Proxy Verification

After deploying behind a proxy:

1. Send a request from a known public IP.
2. Check API logs for the observed client IP.
3. Confirm rate limiting keys are based on the real client IP, not only the
   platform proxy IP.
4. Confirm spoofed `X-Forwarded-For` values from the public internet do not
   override the proxy-provided client IP.

If the provider uses more than one trusted hop, document the exact topology
before changing the app from one-hop trust.

## Security Event Retention

The API records authentication/session security events, rate-limit blocks, and
repeated authorization failures. Retention should be handled operationally:

- Keep security events at least 90 days in production-like environments.
- Do not export events to public analytics tools.
- Do not store raw passwords, raw tokens, cookies, or full request bodies.
- Treat `security_events` as sensitive operational data.
- Set `SECURITY_ADMIN_EMAILS` to a comma-separated allowlist of admin reviewer
  emails that may call `GET /api/v1/security/events`; matching is
  case-insensitive.
- Keep the allowlist narrow and review it whenever team access changes.
