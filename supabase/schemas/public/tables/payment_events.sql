CREATE TABLE "public"."payment_events" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "payment_id"         uuid                     NOT NULL,
  "provider_event_id"  text,
  "provider_reference" text,
  "payload"            jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "received_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "processed_at"       timestamp with time zone,
  "processing_error"   text,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "payment_events_error_length" CHECK (((processing_error IS NULL) OR (char_length(processing_error) <= 2000))),
  CONSTRAINT "payment_events_pkey" PRIMARY KEY (id),
  CONSTRAINT "payment_events_provider_event_length"
    CHECK (((provider_event_id IS NULL) OR ((char_length(btrim(provider_event_id)) >= 1) AND (char_length(btrim(provider_event_id)) <= 300)))),
  CONSTRAINT "payment_events_provider_reference_length"
    CHECK (((provider_reference IS NULL) OR ((char_length(btrim(provider_reference)) >= 1) AND (char_length(btrim(provider_reference)) <= 300)))),
  CONSTRAINT "payment_events_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE RESTRICT
);

ALTER TABLE "public"."payment_events"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."payment_events"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."payment_events"
  ADD COLUMN "event_type" public.payment_event_type NOT NULL;

ALTER TABLE "public"."payment_events"
  ADD COLUMN "provider" public.payment_provider NOT NULL;

CREATE INDEX payment_events_payment_idx ON public.payment_events USING btree (payment_id, created_at);

CREATE UNIQUE INDEX payment_events_provider_event_uq ON public.payment_events USING btree (PROVIDER, provider_event_id)
  WHERE (provider_event_id IS NOT NULL);

CREATE INDEX payment_events_received_idx ON public.payment_events USING btree (received_at DESC);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payment_events" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."payment_events" TO "service_role";
