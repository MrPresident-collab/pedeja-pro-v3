CREATE TABLE "public"."customer_addresses" (
  "customer_id"           uuid                     NOT NULL,
  "address_id"            uuid                     NOT NULL,
  "label"                 text                     NOT NULL,
  "recipient_name"        text,
  "recipient_phone"       text,
  "delivery_instructions" text,
  "is_default"            boolean                  NOT NULL DEFAULT false,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"            timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "customer_addresses_address_id_fkey" FOREIGN KEY (address_id) REFERENCES public.addresses(id) ON DELETE RESTRICT,
  CONSTRAINT "customer_addresses_instructions_length" CHECK (((delivery_instructions IS NULL) OR (char_length(delivery_instructions) <= 1000))),
  CONSTRAINT "customer_addresses_label_length" CHECK (((char_length(btrim(label)) >= 1) AND (char_length(btrim(label)) <= 80))),
  CONSTRAINT "customer_addresses_pkey" PRIMARY KEY (customer_id, address_id),
  CONSTRAINT "customer_addresses_recipient_name_length"
    CHECK (((recipient_name IS NULL) OR ((char_length(btrim(recipient_name)) >= 1) AND (char_length(btrim(recipient_name)) <= 200)))),
  CONSTRAINT "customer_addresses_recipient_phone_length" CHECK (((recipient_phone IS NULL) OR ((char_length(recipient_phone) >= 3) AND (char_length(recipient_phone) <= 32)))),
  CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customer_profiles(user_id) ON DELETE CASCADE
);

ALTER TABLE "public"."customer_addresses"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."customer_addresses"
  FORCE ROW LEVEL SECURITY;

CREATE INDEX customer_addresses_address_idx ON public.customer_addresses USING btree (address_id);

CREATE INDEX customer_addresses_customer_idx ON public.customer_addresses USING btree (customer_id);

CREATE UNIQUE INDEX customer_addresses_one_default_uq ON public.customer_addresses USING btree (customer_id)
  WHERE (is_default = true);

CREATE TRIGGER customer_addresses_set_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE POLICY "customer_addresses_self_select" ON "public"."customer_addresses"
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (customer_id = ( SELECT auth.uid() AS uid))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."customer_addresses" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."customer_addresses" TO "service_role";

REVOKE ALL ON TABLE "public"."customer_addresses" FROM "authenticated";

GRANT SELECT ON TABLE "public"."customer_addresses" TO "authenticated";
