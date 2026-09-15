CREATE TABLE "public"."businesses" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"        text                     NOT NULL,
  "legal_name"  text,
  "description" text,
  "phone"       text,
  "email"       text,
  "address_id"  uuid,
  "created_by"  uuid                     NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "businesses_address_id_fkey" FOREIGN KEY (address_id) REFERENCES public.addresses(id) ON DELETE SET NULL,
  CONSTRAINT "businesses_description_length" CHECK (((description IS NULL) OR (char_length(description) <= 2000))),
  CONSTRAINT "businesses_email_length" CHECK (((email IS NULL) OR ((char_length(email) >= 3) AND (char_length(email) <= 320)))),
  CONSTRAINT "businesses_legal_name_length" CHECK (((legal_name IS NULL) OR ((char_length(btrim(legal_name)) >= 2) AND (char_length(btrim(legal_name)) <= 250)))),
  CONSTRAINT "businesses_name_length" CHECK (((char_length(btrim(name)) >= 2) AND (char_length(btrim(name)) <= 200))),
  CONSTRAINT "businesses_phone_length" CHECK (((phone IS NULL) OR ((char_length(phone) >= 3) AND (char_length(phone) <= 32)))),
  CONSTRAINT "businesses_pkey" PRIMARY KEY (id),
  CONSTRAINT "businesses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE RESTRICT
);

ALTER TABLE "public"."businesses"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."businesses"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."businesses"
  ADD COLUMN "status" public.business_status NOT NULL DEFAULT 'PENDING'::public.business_status;

CREATE INDEX businesses_address_idx ON public.businesses USING btree (address_id);

CREATE INDEX businesses_created_by_idx ON public.businesses USING btree (created_by);

CREATE UNIQUE INDEX businesses_name_created_by_uq ON public.businesses USING btree (created_by, lower(name));

CREATE INDEX businesses_status_idx ON public.businesses USING btree (status);

CREATE TRIGGER businesses_set_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE POLICY "businesses_active_select" ON "public"."businesses"
  FOR SELECT
  TO "authenticated"
  USING ((status = 'ACTIVE'::public.business_status));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."businesses" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."businesses" TO "service_role";

REVOKE ALL ON TABLE "public"."businesses" FROM "authenticated";

GRANT SELECT ON TABLE "public"."businesses" TO "authenticated";
