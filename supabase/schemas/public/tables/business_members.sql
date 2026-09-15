CREATE TABLE "public"."business_members" (
  "business_id" uuid                     NOT NULL,
  "user_id"     uuid                     NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "business_members_pkey" PRIMARY KEY (business_id, user_id),
  CONSTRAINT "business_members_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT "business_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "public"."business_members"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."business_members"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."business_members"
  ADD COLUMN "role" public.business_member_role NOT NULL;

CREATE INDEX business_members_business_role_idx ON public.business_members USING btree (business_id, ROLE);

CREATE INDEX business_members_user_idx ON public.business_members USING btree (user_id);

CREATE TRIGGER business_members_set_updated_at
  BEFORE UPDATE ON public.business_members
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."business_members" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."business_members" TO "service_role";
