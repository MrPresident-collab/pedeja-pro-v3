# Pedejá Frontend Rebuild Status

## Purpose

This branch is the active customer-facing PWA rebuild for Pedejá. The implementation must remain Angola-first, mobile-native, installable, and usable on low-end Android devices and slow or unstable 2G/3G connections.

## Source of truth

1. `docs/FRONTEND_STRUCTURE.md`
2. `docs/PRODUCT_DECISIONS.md`
3. `docs/DOMAIN_MODEL.md`
4. `docs/FUNCTIONAL_PRODUCT_PLAN.md`
5. `docs/SECURITY_ARCHITECTURE.md`
6. Supabase schema, policies, and Auth configuration
7. Existing frontend code only where it already reflects the documented contract

## Current branch

- Repository: `MrPresident-collab/pedeja-pro-v3`
- Branch: `frontend-rebuild`
- Product: Pedejá.
- Tagline: `A promessa que se move`
- Frontend type: React + Vite PWA
- Primary language: Portuguese / Angolan Portuguese
- Currency: AOA / Kz

## Completed foundation

- Purple Pedejá visual direction established.
- Splash, welcome, authentication, address onboarding, customer shell, bottom navigation, discovery, orders, profile, and Enviar placeholders exist.
- Supabase client is present.
- PWA manifest, service worker registration, and install prompt exist.
- Frontend structure contract exists in `docs/FRONTEND_STRUCTURE.md`.

## Known implementation debt

The current UI is intentionally treated as a temporary vertical slice, not the final architecture. It still contains too much code in `src/App.tsx`, mixes Supabase access with presentation, and has incomplete flows for Compras, Lojas, cart checkout, orders, address persistence, support, and role-aware entry.

The next implementation work must remove this debt without changing the documented product boundaries or introducing a second backend.

## Required target structure

```text
src/
├── app/
│   ├── App.tsx
│   ├── app-types.ts
│   └── routes.ts
├── components/
│   ├── ui/
│   ├── navigation/
│   ├── feedback/
│   └── InstallPrompt.tsx
├── features/
│   └── customer/
│       ├── entry/
│       ├── home/
│       ├── comida/
│       ├── compras/
│       ├── lojas/
│       ├── enviar/
│       ├── orders/
│       ├── profile/
│       └── discover/
├── domain/
├── repositories/
├── services/
├── lib/
├── styles/
└── main.tsx
```

Do not create empty folders merely for appearance. Each folder should receive a real module when the corresponding feature is extracted.

## Execution order

1. Preserve the current working slice and establish a modular app entry.
2. Extract shared types and route/state contracts.
3. Extract entry screens: Splash, Welcome, Authentication, Address onboarding.
4. Extract navigation and the customer shell.
5. Extract Home, Comida, Compras, Lojas, Enviar, Orders, Discover, and Profile features.
6. Move Supabase reads/writes into repositories and services.
7. Add explicit loading, empty, offline, retry, and error states.
8. Implement persistent addresses and customer profile completion.
9. Implement product detail, cart, checkout, and order creation against the existing Supabase model.
10. Implement order history and tracking from real order data.
11. Add role-aware entry boundaries without exposing role selectors to ordinary customers.
12. Validate RLS behavior and remove all client-trusted authorization assumptions.
13. Run typecheck, lint, production build, and PWA smoke tests before calling a stage complete.

## Angola / low-bandwidth requirements

- Prefer system fonts or locally bundled fonts over blocking remote font requests.
- Avoid large hero images, video backgrounds, carousels, and decorative animation.
- Use CSS shapes and icons before downloading image assets.
- Lazy-load noncritical screens and media.
- Keep initial JavaScript and CSS small; do not import entire UI libraries for one component.
- Use skeletons and cached shell loading instead of blank screens.
- Never make the app depend on geolocation permission to browse.
- Use resilient retry behavior for Auth and Supabase requests.
- Show clear offline and connection-loss feedback.
- Avoid polling; use Realtime only for active order tracking where justified.
- Ensure controls work on 320px-wide screens and low-memory Android browsers.

## Security rules

- Supabase is the only backend.
- Never trust client-provided `role`, `is_admin`, `is_driver`, or `is_merchant` values.
- Never place service-role credentials in browser code.
- All data access must respect RLS and ownership boundaries.
- Operations is a separate application boundary and must not appear as a customer profile option.
- Do not store authorization decisions in localStorage.

## Verification commands

Run from the frontend project root:

```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run preview
```

If a command is not defined in `package.json`, document that fact and add the smallest appropriate script rather than silently skipping validation.

## Definition of done for each feature

- Matches the documented mobile flow.
- Has loading, empty, error, and offline behavior.
- Uses real Supabase data or is explicitly marked as a temporary placeholder.
- Does not introduce client-side authorization.
- Works with keyboard, touch, and narrow screens.
- Does not require high bandwidth for the first useful interaction.
- Has no unrelated visual or architectural regressions.
