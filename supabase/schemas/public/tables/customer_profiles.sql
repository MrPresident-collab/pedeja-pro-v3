CREATE TABLE "public"."customer_profiles" (
  "user_id"    uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "customer_profiles_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "customer_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "public"."customer_profiles"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."customer_profiles"
  FORCE ROW LEVEL SECURITY;

CREATE TRIGGER customer_profiles_set_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE POLICY "customer_profiles_self_select" ON "public"."customer_profiles"
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (user_id = ( SELECT auth.uid() AS uid))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."customer_profiles" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."customer_profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."customer_profiles" FROM "authenticated";

GRANT SELECT ON TABLE "public"."customer_profiles" TO "authenticated";
