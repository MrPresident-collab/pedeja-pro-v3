# Pedejá production status

This build connects the customer marketplace to the live Supabase schema and uses the server-side order command for marketplace orders.

## Live customer path

- Supabase Auth (phone/email)
- Customer profile
- Customer addresses
- Active businesses
- Active products
- Local customer cart
- Server-authoritative marketplace order creation
- Server-authoritative delivery/service pricing
- Idempotent order creation
- Customer order history/active orders
- Customer order cancellation command
- Realtime order refresh

## Deliberately not represented as complete

- Payment provider checkout/webhook credentials and end-to-end payment UX
- Production Enviar shipment creation command
- Merchant/rider production UI adapters
- Ratings/promotions/business categories because the live catalog schema does not currently expose those fields

The frontend never uses a service-role key. `.env.example` contains the required public Supabase URL/anon-key configuration.
