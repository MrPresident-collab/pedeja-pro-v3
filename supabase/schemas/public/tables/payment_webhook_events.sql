CREATE TABLE "public"."payment_webhook_events" (
  "id"                 uuid                     NOT NULL DEFAULT extensions.gen_random_uuid(),
  "provider_event_id"  text                     NOT NULL,
  "provider_reference" text,
  "amount"             numeric(14,2),
  "currency_code"      text,
  "payload"            jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "signature_verified" boolean                  NOT NULL DEFAULT false,
  "received_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "processed_at"       timestamp with time zone,
  "processing_error"   text,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "payment_webhook_events_amount_ck" CHECK (((amount IS NULL) OR (amount > (0)::numeric))),
  CONSTRAINT "payment_webhook_events_currency_ck" CHECK (((currency_code IS NULL) OR ((currency_code = upper(currency_code)) AND (char_length(currency_code) = 3)))),
  CONSTRAINT "payment_webhook_events_payload_object_ck" CHECK ((jsonb_typeof(payload) = 'object'::text)),
  CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY (id),
  CONSTRAINT "payment_webhook_events_processed_ck" CHECK (((processed_at IS NULL) OR (processed_at >= received_at))),
  CONSTRAINT "payment_webhook_events_verified_ck" CHECK ((signature_verified = true))
);

ALTER TABLE "public"."payment_webhook_events"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."payment_webhook_events"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."payment_webhook_events"
  ADD COLUMN "event_type" public.payment_event_type NOT NULL;

ALTER TABLE "public"."payment_webhook_events"
  ADD COLUMN "provider" public.payment_provider NOT NULL;

ALTER TABLE "public"."payment_webhook_events"
  ADD CONSTRAINT "payment_webhook_events_provider_event_uq" UNIQUE (PROVIDER, provider_event_id);

CREATE INDEX payment_webhook_events_received_idx ON public.payment_webhook_events USING btree (received_at DESC);

CREATE INDEX payment_webhook_events_reference_idx ON public.payment_webhook_events USING btree (PROVIDER, provider_reference);

CREATE INDEX payment_webhook_events_unprocessed_idx ON public.payment_webhook_events USING btree (processed_at)
  WHERE (processed_at IS NULL);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payment_webhook_events" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."payment_webhook_events" TO "service_role";
