# Pedejá production patches — 15 Sep 2026

This package is a preserved frontend checkpoint. The Supabase production project `svutiyvbxcniikensadx` was also updated during this hardening pass.

## Production database migrations applied

- `20260915090536_pedeja_cash_collection_guardian`
- `20260915090605_pedeja_cash_change_tracking`

### Cash-on-delivery behavior

Marketplace orders now have an explicit `payment_method` with `CASH` as the current production default.

Cash orders remain `UNPAID` when created. A merchant may accept a cash order without falsely marking it paid. At destination, the assigned rider must collect cash through the protected `rider_collect_cash` RPC before the delivery can be completed.

The collection flow records:
- payment as `MANUAL/SUCCEEDED`
- amount owed
- amount received
- change given
- rider who collected it
- delivery job
- payment/order events
- audit log
- accounting journal

The rider cannot complete a cash order while its payment remains unpaid.

## Frontend hardening in this package

- Authenticated sessions restore the customer app after browser refresh.
- `Criar conta` now actually enters email signup instead of silently using sign-in.
- Email signup handles Supabase confirmation-required responses.
- Marketplace → business → back returns to the correct previous surface.
- Cross-business carts now require an explicit customer confirmation before replacing the existing cart.
- Checkout address changes force the relevant customer view to refresh.
- Production Enviar is no longer artificially blocked just because Supabase is configured; authenticated customers can enter its production flow.
- Merchant dashboard can accept CASH orders while preserving the unpaid state.
- Rider dashboard supports cash collection and change calculation at destination.
- Marketplace deliveries no longer demand a recipient signature; signature remains mandatory for Enviar evidence.
- Existing 15-second rider offer, 8-minute pickup limit, 8-minute free customer wait, 5-minute paid wait cap, 50 Kz/min rate, and Enviar proof requirements are preserved.

## Verification note

A clean dependency installation could not be completed in the isolated build environment because `npm ci` timed out. Therefore this package is **not claimed as build-verified**. The modified source was inspected after each patch, and production database migrations returned success.

The first local test should be:

1. `npm ci`
2. `npm run typecheck`
3. `npm run build`
4. Test the customer golden path.
5. Test merchant CASH acceptance.
6. Test rider cash collection + change.
