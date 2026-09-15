CREATE TABLE "public"."ledger_entries" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "account_id"      uuid                     NOT NULL,
  "amount"          numeric(14,2)            NOT NULL,
  "currency_code"   text                     NOT NULL DEFAULT 'AOA'::text,
  "payment_id"      uuid,
  "refund_id"       uuid,
  "delivery_job_id" uuid,
  "reference"       text,
  "description"     text,
  "metadata"        jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_by"      uuid,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "ledger_entries_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.ledger_accounts(id) ON DELETE RESTRICT,
  CONSTRAINT "ledger_entries_amount_positive" CHECK ((amount > (0)::numeric)),
  CONSTRAINT "ledger_entries_currency_check" CHECK (((currency_code = upper(currency_code)) AND (char_length(currency_code) = 3))),
  CONSTRAINT "ledger_entries_delivery_job_id_fkey" FOREIGN KEY (delivery_job_id) REFERENCES public.delivery_jobs(id) ON DELETE RESTRICT,
  CONSTRAINT "ledger_entries_description_length" CHECK (((description IS NULL) OR (char_length(description) <= 1000))),
  CONSTRAINT "ledger_entries_pkey" PRIMARY KEY (id),
  CONSTRAINT "ledger_entries_reference_length" CHECK (((reference IS NULL) OR (char_length(btrim(reference)) <= 300))),
  CONSTRAINT "ledger_entries_source_check" CHECK ((num_nonnulls(payment_id, refund_id, delivery_job_id) <= 1)),
  CONSTRAINT "ledger_entries_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE RESTRICT,
  CONSTRAINT "ledger_entries_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT "ledger_entries_refund_id_fkey" FOREIGN KEY (refund_id) REFERENCES public.refunds(id) ON DELETE RESTRICT
);

ALTER TABLE "public"."ledger_entries"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ledger_entries"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."ledger_entries"
  ADD COLUMN "entry_type" public.ledger_entry_type NOT NULL;

CREATE INDEX ledger_entries_account_idx ON public.ledger_entries USING btree (account_id, created_at DESC);

CREATE INDEX ledger_entries_created_idx ON public.ledger_entries USING btree (created_at DESC);

CREATE INDEX ledger_entries_delivery_idx ON public.ledger_entries USING btree (delivery_job_id, created_at DESC)
  WHERE (delivery_job_id IS NOT NULL);

CREATE INDEX ledger_entries_payment_idx ON public.ledger_entries USING btree (payment_id, created_at DESC)
  WHERE (payment_id IS NOT NULL);

CREATE UNIQUE INDEX ledger_entries_payment_reference_uq ON public.ledger_entries USING btree (payment_id, account_id, entry_type)
  WHERE (payment_id IS NOT NULL);

CREATE UNIQUE INDEX ledger_entries_reference_uq ON public.ledger_entries USING btree (account_id, lower(reference), entry_type)
  WHERE (reference IS NOT NULL);

CREATE INDEX ledger_entries_refund_idx ON public.ledger_entries USING btree (refund_id, created_at DESC)
  WHERE (refund_id IS NOT NULL);

CREATE UNIQUE INDEX ledger_entries_refund_reference_uq ON public.ledger_entries USING btree (refund_id, account_id, entry_type)
  WHERE (refund_id IS NOT NULL);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ledger_entries" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."ledger_entries" TO "service_role";
