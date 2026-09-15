CREATE TABLE "public"."refunds" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "payment_id"         uuid                     NOT NULL,
  "provider_reference" text,
  "amount"             numeric(14,2)            NOT NULL,
  "reason"             text,
  "requested_by"       uuid,
  "requested_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "processed_at"       timestamp with time zone,
  "created_at"         timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "refunds_amount_positive" CHECK ((amount > (0)::numeric)),
  CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE RESTRICT,
  CONSTRAINT "refunds_pkey" PRIMARY KEY (id),
  CONSTRAINT "refunds_provider_reference_length"
    CHECK (((provider_reference IS NULL) OR ((char_length(btrim(provider_reference)) >= 1) AND (char_length(btrim(provider_reference)) <= 300)))),
  CONSTRAINT "refunds_reason_length" CHECK (((reason IS NULL) OR (char_length(reason) <= 1000))),
  CONSTRAINT "refunds_requested_by_fkey" FOREIGN KEY (requested_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE "public"."refunds"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."refunds"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."refunds"
  ADD COLUMN "provider" public.payment_provider NOT NULL;

ALTER TABLE "public"."refunds"
  ADD COLUMN "status" public.refund_status NOT NULL DEFAULT 'REFUND_REQUESTED'::public.refund_status;

ALTER TABLE "public"."refunds"
  ADD CONSTRAINT "refunds_processed_consistency"
    CHECK (((processed_at IS NULL) OR (status = ANY (ARRAY['REFUNDED'::public.refund_status, 'REFUND_FAILED'::public.refund_status, 'REFUND_CANCELLED'::public.refund_status]))));

CREATE INDEX refunds_payment_idx ON public.refunds USING btree (payment_id, created_at DESC);

CREATE UNIQUE INDEX refunds_provider_reference_uq ON public.refunds USING btree (PROVIDER, lower(provider_reference))
  WHERE (provider_reference IS NOT NULL);

CREATE INDEX refunds_status_idx ON public.refunds USING btree (status, created_at DESC);

CREATE TRIGGER refunds_set_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE POLICY "refunds_customer_select" ON "public"."refunds"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.payments p
  WHERE ((p.id = refunds.payment_id) AND (p.customer_id = ( SELECT auth.uid() AS uid))))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."refunds" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."refunds" TO "service_role";

REVOKE ALL ON TABLE "public"."refunds" FROM "authenticated";

GRANT SELECT ON TABLE "public"."refunds" TO "authenticated";
