CREATE TABLE "public"."payments" (
  "id"                              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "customer_id"                     uuid                     NOT NULL,
  "order_id"                        uuid,
  "enviar_shipment_id"              uuid,
  "provider_reference"              text,
  "currency_code"                   text                     NOT NULL DEFAULT 'AOA'::text,
  "amount"                          numeric(14,2)            NOT NULL,
  "metadata"                        jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "initiated_at"                    timestamp with time zone NOT NULL DEFAULT now(),
  "succeeded_at"                    timestamp with time zone,
  "failed_at"                       timestamp with time zone,
  "expired_at"                      timestamp with time zone,
  "cancelled_at"                    timestamp with time zone,
  "created_at"                      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"                      timestamp with time zone NOT NULL DEFAULT now(),
  "idempotency_key"                 text,
  "idempotency_request_fingerprint" text,
  CONSTRAINT "payments_amount_positive" CHECK ((amount > (0)::numeric)),
  CONSTRAINT "payments_currency_check" CHECK (((currency_code = upper(currency_code)) AND (char_length(currency_code) = 3))),
  CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customer_profiles(user_id) ON DELETE RESTRICT,
  CONSTRAINT "payments_enviar_shipment_id_fkey" FOREIGN KEY (enviar_shipment_id) REFERENCES public.enviar_shipments(id) ON DELETE RESTRICT,
  CONSTRAINT "payments_idempotency_key_format" CHECK (((idempotency_key IS NULL) OR ((char_length(btrim(idempotency_key)) >= 1) AND (char_length(btrim(idempotency_key)) <= 200)))),
  CONSTRAINT "payments_one_billable_source" CHECK ((((order_id IS NOT NULL) AND (enviar_shipment_id IS NULL)) OR ((order_id IS NULL) AND (enviar_shipment_id IS NOT NULL)))),
  CONSTRAINT "payments_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT,
  CONSTRAINT "payments_pkey" PRIMARY KEY (id),
  CONSTRAINT "payments_provider_reference_length"
    CHECK (((provider_reference IS NULL) OR ((char_length(btrim(provider_reference)) >= 1) AND (char_length(btrim(provider_reference)) <= 300))))
);

ALTER TABLE "public"."payments"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."payments"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."payments"
  ADD COLUMN "provider" public.payment_provider NOT NULL;

ALTER TABLE "public"."payments"
  ADD COLUMN "status" public.payment_status NOT NULL DEFAULT 'INITIATED'::public.payment_status;

ALTER TABLE "public"."payments"
  ADD CONSTRAINT "payments_cancelled_consistency" CHECK (((cancelled_at IS NULL) OR (status = 'CANCELLED'::public.payment_status)));

ALTER TABLE "public"."payments"
  ADD CONSTRAINT "payments_expired_consistency" CHECK (((expired_at IS NULL) OR (status = 'EXPIRED'::public.payment_status)));

ALTER TABLE "public"."payments"
  ADD CONSTRAINT "payments_failed_consistency" CHECK (((failed_at IS NULL) OR (status = 'FAILED'::public.payment_status)));

ALTER TABLE "public"."payments"
  ADD CONSTRAINT "payments_succeeded_consistency" CHECK (((succeeded_at IS NULL) OR (status = 'SUCCEEDED'::public.payment_status)));

CREATE INDEX payments_customer_idx ON public.payments USING btree (customer_id, created_at DESC);

CREATE UNIQUE INDEX payments_customer_order_idempotency_key_uq ON public.payments USING btree (customer_id, order_id, idempotency_key)
  WHERE (idempotency_key IS NOT NULL);

CREATE INDEX payments_enviar_idx ON public.payments USING btree (enviar_shipment_id, created_at DESC)
  WHERE (enviar_shipment_id IS NOT NULL);

CREATE UNIQUE INDEX payments_one_active_per_order_uq ON public.payments USING btree (order_id)
  WHERE ((order_id IS NOT NULL) AND (status = ANY (ARRAY['INITIATED'::public.payment_status, 'PENDING'::public.payment_status, 'PROCESSING'::public.payment_status])));

CREATE INDEX payments_order_idx ON public.payments USING btree (order_id, created_at DESC)
  WHERE (order_id IS NOT NULL);

CREATE UNIQUE INDEX payments_provider_reference_unique ON public.payments USING btree (PROVIDER, provider_reference)
  WHERE (provider_reference IS NOT NULL);

CREATE UNIQUE INDEX payments_provider_reference_uq ON public.payments USING btree (PROVIDER, lower(provider_reference))
  WHERE (provider_reference IS NOT NULL);

CREATE INDEX payments_status_idx ON public.payments USING btree (status, created_at DESC);

CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE POLICY "payments_customer_select" ON "public"."payments"
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (customer_id = ( SELECT auth.uid() AS uid))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."payments" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."payments" TO "service_role";

REVOKE ALL ON TABLE "public"."payments" FROM "authenticated";

GRANT SELECT ON TABLE "public"."payments" TO "authenticated";
