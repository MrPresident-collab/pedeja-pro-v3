CREATE TABLE "public"."ledger_journals" (
  "id"                     uuid                     NOT NULL DEFAULT extensions.gen_random_uuid(),
  "currency_code"          text                     NOT NULL,
  "reference"              text,
  "description"            text,
  "payment_id"             uuid,
  "refund_id"              uuid,
  "delivery_job_id"        uuid,
  "reversal_of_journal_id" uuid,
  "created_by"             uuid,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "ledger_journals_currency_ck" CHECK (((currency_code = upper(currency_code)) AND (char_length(currency_code) = 3))),
  CONSTRAINT "ledger_journals_delivery_job_id_fkey" FOREIGN KEY (delivery_job_id) REFERENCES public.delivery_jobs(id) ON DELETE RESTRICT,
  CONSTRAINT "ledger_journals_pkey" PRIMARY KEY (id),
  CONSTRAINT "ledger_journals_reversal_ck" CHECK (((reversal_of_journal_id IS NULL) OR (reversal_of_journal_id <> id))),
  CONSTRAINT "ledger_journals_reversal_of_journal_id_fkey" FOREIGN KEY (reversal_of_journal_id) REFERENCES public.ledger_journals(id) ON DELETE RESTRICT,
  CONSTRAINT "ledger_journals_source_ck" CHECK ((num_nonnulls(payment_id, refund_id, delivery_job_id) <= 1)),
  CONSTRAINT "ledger_journals_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE RESTRICT,
  CONSTRAINT "ledger_journals_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT,
  CONSTRAINT "ledger_journals_refund_id_fkey" FOREIGN KEY (refund_id) REFERENCES public.refunds(id) ON DELETE RESTRICT
);

ALTER TABLE "public"."ledger_journals"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ledger_journals"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."ledger_journals"
  ADD COLUMN "journal_type" public.ledger_entry_type NOT NULL;

CREATE INDEX ledger_journals_created_idx ON public.ledger_journals USING btree (created_at DESC);

CREATE INDEX ledger_journals_payment_idx ON public.ledger_journals USING btree (payment_id, created_at DESC)
  WHERE (payment_id IS NOT NULL);

CREATE UNIQUE INDEX ledger_journals_payment_type_uq ON public.ledger_journals USING btree (payment_id, journal_type)
  WHERE (payment_id IS NOT NULL);

CREATE UNIQUE INDEX ledger_journals_reference_uq ON public.ledger_journals USING btree (lower(reference), journal_type)
  WHERE (reference IS NOT NULL);

CREATE INDEX ledger_journals_refund_idx ON public.ledger_journals USING btree (refund_id, created_at DESC)
  WHERE (refund_id IS NOT NULL);

CREATE UNIQUE INDEX ledger_journals_refund_type_uq ON public.ledger_journals USING btree (refund_id, journal_type)
  WHERE (refund_id IS NOT NULL);

CREATE UNIQUE INDEX uq_ledger_journals_payment_type ON public.ledger_journals USING btree (payment_id, journal_type);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ledger_journals" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."ledger_journals" TO "service_role";
