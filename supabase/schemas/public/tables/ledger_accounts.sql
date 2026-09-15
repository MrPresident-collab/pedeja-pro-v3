CREATE TABLE "public"."ledger_accounts" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "account_code"  text                     NOT NULL,
  "account_name"  text                     NOT NULL,
  "currency_code" text                     NOT NULL DEFAULT 'AOA'::text,
  "owner_user_id" uuid,
  "active"        boolean                  NOT NULL DEFAULT true,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "ledger_accounts_code_length" CHECK (((char_length(btrim(account_code)) >= 2) AND (char_length(btrim(account_code)) <= 50))),
  CONSTRAINT "ledger_accounts_currency_check" CHECK (((currency_code = upper(currency_code)) AND (char_length(currency_code) = 3))),
  CONSTRAINT "ledger_accounts_name_length" CHECK (((char_length(btrim(account_name)) >= 2) AND (char_length(btrim(account_name)) <= 150))),
  CONSTRAINT "ledger_accounts_pkey" PRIMARY KEY (id),
  CONSTRAINT "ledger_accounts_owner_user_id_fkey" FOREIGN KEY (owner_user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT
);

ALTER TABLE "public"."ledger_accounts"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."ledger_accounts"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."ledger_accounts"
  ADD COLUMN "account_type" public.ledger_account_type NOT NULL;

CREATE UNIQUE INDEX ledger_accounts_code_uq ON public.ledger_accounts USING btree (lower(account_code));

CREATE INDEX ledger_accounts_owner_idx ON public.ledger_accounts USING btree (owner_user_id)
  WHERE (owner_user_id IS NOT NULL);

CREATE INDEX ledger_accounts_type_idx ON public.ledger_accounts USING btree (account_type, active);

CREATE TRIGGER ledger_accounts_set_updated_at
  BEFORE UPDATE ON public.ledger_accounts
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."ledger_accounts" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."ledger_accounts" TO "service_role";
