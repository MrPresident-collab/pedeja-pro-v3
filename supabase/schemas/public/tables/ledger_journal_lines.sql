CREATE TABLE "public"."ledger_journal_lines" (
  "id"            uuid                     NOT NULL DEFAULT extensions.gen_random_uuid(),
  "journal_id"    uuid                     NOT NULL,
  "account_id"    uuid                     NOT NULL,
  "debit_amount"  numeric(14,2)            NOT NULL DEFAULT 0,
  "credit_amount" numeric(14,2)            NOT NULL DEFAULT 0,
  "description"   text,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "ledger_journal_lines_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.ledger_accounts(id) ON DELETE RESTRICT,
  CONSTRAINT "ledger_journal_lines_amount_ck"
    CHECK
    (((debit_amount >= (0)::numeric) AND (credit_amount >= (0)::numeric) AND (((debit_amount > (0)::numeric) AND (credit_amount = (0)::numeric)) OR ((credit_amount > (0)::numeric)
    AND (debit_amount = (0)::numeric))))),
  CONSTRAINT "ledger_journal_lines_pkey" PRIMARY KEY (id),
  CONSTRAINT "ledger_journal_lines_journal_id_fkey" FOREIGN KEY (journal_id) REFERENCES public.ledger_journals(id) ON DELETE RESTRICT
);

ALTER TABLE "public"."ledger_journal_lines"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ledger_journal_lines"
  FORCE ROW LEVEL SECURITY;

CREATE INDEX ledger_journal_lines_account_idx ON public.ledger_journal_lines USING btree (account_id, created_at DESC);

CREATE INDEX ledger_journal_lines_journal_idx ON public.ledger_journal_lines USING btree (journal_id, id);

CREATE CONSTRAINT TRIGGER ledger_journal_balance_ct
  AFTER INSERT OR DELETE OR UPDATE ON public.ledger_journal_lines DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION private.validate_ledger_journal_balance();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ledger_journal_lines" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."ledger_journal_lines" TO "service_role";
