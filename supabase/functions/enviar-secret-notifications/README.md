# ENVIAR secret-code notifications

This worker drains `public.notification_outbox` and sends ENVIAR delivery codes through SMS and WhatsApp.

## Provider

The current adapter is Twilio Programmable Messaging.

Required Supabase Edge Function secrets:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_API_KEY`
- `TWILIO_API_SECRET`
- `TWILIO_SMS_FROM`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_WHATSAPP_CONTENT_SID`

WhatsApp production messaging should use an approved template/content SID. Twilio's WhatsApp platform requires an enabled WhatsApp sender and applicable user opt-in/template rules.

## Supabase secrets

Keep all provider credentials in Supabase Edge Function secrets. Never put them in the PWA or commit them to Git.

## Scheduling

Run `enviar-secret-notifications` periodically with Supabase Cron/pg_cron + pg_net. The function uses the Supabase `secret` auth mode, so the scheduled request must use an appropriate secret API key in the `apikey` header.

A short interval is appropriate because the worker atomically claims queued rows and can safely run concurrently.

## Flow

1. Rider accepts an ENVIAR delivery.
2. Database generates a new five-digit code using cryptographically secure randomness.
3. Only a salted SHA-256 hash and salt are stored on the shipment; the plaintext code is not stored there.
4. The sender receives SMS + WhatsApp notifications containing the code.
5. Sender shares the code with the receiver.
6. Receiver gives the code to the rider on arrival.
7. Rider submits the code through the authenticated `rider_verify_enviar_secret_code` RPC.
8. Delivery completion is blocked until the code is verified.
9. Operations can regenerate the code through `operations_regenerate_enviar_secret_code` when the sender did not receive it, deleted it, or otherwise needs a new code. Regeneration invalidates the previous code.

Codes expire after the configured lifetime and verification attempts are capped server-side.
