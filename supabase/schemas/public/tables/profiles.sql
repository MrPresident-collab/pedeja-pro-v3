CREATE TABLE "public"."profiles" (
  "id"           uuid                     NOT NULL,
  "full_name"    text,
  "phone"        text,
  "avatar_url"   text,
  "last_seen_at" timestamp with time zone,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_avatar_url_length" CHECK (((avatar_url IS NULL) OR (char_length(avatar_url) <= 2048))),
  CONSTRAINT "profiles_full_name_length" CHECK (((full_name IS NULL) OR ((char_length(full_name) >= 1) AND (char_length(full_name) <= 200)))),
  CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "profiles_phone_length" CHECK (((phone IS NULL) OR ((char_length(phone) >= 3) AND (char_length(phone) <= 32)))),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."profiles"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."profiles"
  ADD COLUMN "account_status" public.account_status NOT NULL DEFAULT 'ACTIVE'::public.account_status;

CREATE INDEX profiles_account_status_idx ON public.profiles USING btree (account_status);

CREATE INDEX profiles_last_seen_idx ON public.profiles USING btree (last_seen_at DESC);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE POLICY "profiles_self_select" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (id = ( SELECT auth.uid() AS uid))));

CREATE POLICY "profiles_self_update" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (id = ( SELECT auth.uid() AS uid))))
  WITH CHECK (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (id = ( SELECT auth.uid() AS uid))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ("avatar_url") ON TABLE "public"."profiles" FROM "authenticated";

GRANT UPDATE ("avatar_url") ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ("full_name") ON TABLE "public"."profiles" FROM "authenticated";

GRANT UPDATE ("full_name") ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ("phone") ON TABLE "public"."profiles" FROM "authenticated";

GRANT UPDATE ("phone") ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";

GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";
