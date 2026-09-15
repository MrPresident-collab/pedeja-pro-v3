CREATE TABLE "public"."staff_profiles" (
  "user_id"       uuid                     NOT NULL,
  "employee_code" text,
  "department"    text,
  "hired_at"      date,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "staff_department_length" CHECK (((department IS NULL) OR ((char_length(department) >= 1) AND (char_length(department) <= 120)))),
  CONSTRAINT "staff_employee_code_length" CHECK (((employee_code IS NULL) OR ((char_length(employee_code) >= 2) AND (char_length(employee_code) <= 64)))),
  CONSTRAINT "staff_profiles_pkey" PRIMARY KEY (user_id),
  CONSTRAINT "staff_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "public"."staff_profiles"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."staff_profiles"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."staff_profiles"
  ADD COLUMN "staff_role" public.staff_role NOT NULL;

ALTER TABLE "public"."staff_profiles"
  ADD COLUMN "staff_status" public.staff_status NOT NULL DEFAULT 'ACTIVE'::public.staff_status;

CREATE UNIQUE INDEX staff_profiles_employee_code_uq ON public.staff_profiles USING btree (employee_code)
  WHERE (employee_code IS NOT NULL);

CREATE INDEX staff_profiles_role_status_idx ON public.staff_profiles USING btree (staff_role, staff_status);

CREATE TRIGGER staff_profiles_set_updated_at
  BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE POLICY "staff_profiles_self_select" ON "public"."staff_profiles"
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (user_id = ( SELECT auth.uid() AS uid))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."staff_profiles" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."staff_profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."staff_profiles" FROM "authenticated";

GRANT SELECT ON TABLE "public"."staff_profiles" TO "authenticated";
