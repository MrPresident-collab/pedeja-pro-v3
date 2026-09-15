CREATE TABLE "public"."rider_profiles" (
  "user_id"     uuid                     NOT NULL,
  "verified_at" timestamp with time zone,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "rider_profiles_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "rider_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "public"."rider_profiles"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."rider_profiles"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."rider_profiles"
  ADD COLUMN "verification_status" public.rider_verification_status NOT NULL DEFAULT 'PENDING'::public.rider_verification_status;

ALTER TABLE "public"."rider_profiles"
  ADD CONSTRAINT "rider_verified_at_consistency" CHECK ((((verification_status = 'VERIFIED'::public.rider_verification_status) AND (verified_at IS
    NOT NULL)) OR (verification_status <> 'VERIFIED'::public.rider_verification_status)));

CREATE INDEX rider_profiles_verification_status_idx ON public.rider_profiles USING btree (verification_status);

CREATE TRIGGER rider_profiles_set_updated_at
  BEFORE UPDATE ON public.rider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE POLICY "rider_profiles_self_select" ON "public"."rider_profiles"
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (user_id = ( SELECT auth.uid() AS uid))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."rider_profiles" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."rider_profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."rider_profiles" FROM "authenticated";

GRANT SELECT ON TABLE "public"."rider_profiles" TO "authenticated";
