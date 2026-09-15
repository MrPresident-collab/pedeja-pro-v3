# Pedejá 360 QA & Security Checkpoint

## Production posture

- Supabase is required for production data/auth. The frontend no longer silently presents mock data when Supabase is absent.
- Demo/mock behavior is explicitly opt-in with `VITE_ENABLE_DEMO_MODE=true`.
- Demo OTP remains available only in explicit demo mode.
- Sensitive legacy merchant screens no longer contain a hard-coded `1234` password. If those legacy demo screens are used, `VITE_DEMO_PASSWORD` must be supplied explicitly.
- Client-side Supabase configuration accepts the modern `VITE_SUPABASE_PUBLISHABLE_KEY` and keeps legacy `VITE_SUPABASE_ANON_KEY` as a compatibility fallback.

## Authentication / JWT

Supabase Auth remains the source of truth for JWT access tokens and refresh tokens. The browser client is configured with session persistence and automatic refresh. Do not copy Supabase tokens into application-level localStorage objects or logs.

Recommended hosted Supabase settings before public launch:

- JWT/access-token lifetime: keep the normal short-lived default (normally 1 hour).
- Enable session lifetime/inactivity controls appropriate to the risk profile.
- Prefer asymmetric JWT signing keys (ES256/RS256) and rotate them operationally.
- Never expose a secret/service-role key in the Vite bundle.
- Treat authorization as a database/RLS/RPC responsibility, not a frontend role check.

## Enviar production flow

The customer flow is now ordered around the real questions:

1. Recolha — where should the rider collect it?
2. Destino — where should it go?
3. Recipient + package — who receives it, how do we contact them, what is being sent, size/weight, fragile status, notes, and mandatory sender photo.
4. Transporte — compatible vehicle options.
5. Estimativa — guided estimate and available payment methods.
6. Confirmar — final review and prohibited-items acknowledgement.

The production submit path:

- requires an authenticated customer;
- requires exact destination coordinates;
- requires sender package photo;
- creates the shipment through the protected RPC;
- uploads the proof to the private delivery-proof bucket;
- attaches the proof through the protected database RPC;
- cleans up/cancels the shipment when proof upload/attachment fails.

## Location repository

`supabaseLocationRepository` was hardened to accept both PostgREST object and array relation shapes for `addresses!inner(...)`. This prevents valid customer addresses from being treated as missing solely because the API returned the one-to-one relation as an object.

## Guardian / operational policy

The rider UI now reads the operational policy instead of hard-coding the old 15-second offer window. Current policy values are controlled by Operations in the database and include the 35-second rider offer, pickup wait, customer free wait, paid wait cap/rate, and cash collection setting.

## Branding

- The P mark remains the white P with the purple signature dot.
- The splash uses the wordmark treatment.
- In-app brand lockups use the shared `Logo` / `BrandMark` components instead of ad-hoc marks.
- Prose uses `Pedejá`; the branded wordmark is rendered as `Pedejá.` with the signature dot as a separate brand element.

## Explore

Explore was completed as a real in-app information surface rather than a collection of placeholders. It now covers:

- Pedejá purpose and philosophy;
- how the network works;
- merchant onboarding;
- business categories;
- rider onboarding;
- account security;
- FAQ;
- legal navigation;
- social links when configured.

Empty external URLs remain safe: they no longer pretend that an unavailable website exists.

## Attack/abuse checklist

Backend remains the enforcement layer for:

- customer ownership;
- role/capability checks;
- rider assignment state;
- offer expiry;
- delivery progression;
- cash collection;
- Enviar evidence;
- payment state;
- refund/finance authority;
- staff/RBAC authority.

Recommended release tests should include:

- replaying an order idempotency key;
- changing another user's address/order/shipment ID;
- accepting an expired/non-current rider offer;
- completing a delivery without required evidence;
- completing a cash order without collection;
- calling rider/dispatch RPCs as anonymous;
- reading another user's delivery evidence;
- using an old/expired JWT;
- attempting direct table INSERT/UPDATE/DELETE where the architecture intends RPC-only writes;
- trying to change staff capabilities without the required RBAC capability;
- uploading evidence outside the authenticated user's shipment path;
- attempting to read evidence after its retention window.

## Verification note

The source was syntax-checked with the TypeScript compiler. A complete dependency-backed `npm ci`/production build could not be completed in the isolated execution environment because package installation timed out and the resulting `node_modules` tree was incomplete. Therefore this checkpoint does **not** claim a green production build from this environment.
