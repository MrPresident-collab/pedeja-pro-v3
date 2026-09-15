CREATE TABLE "public"."user_capability_overrides" (
  "user_id"       uuid                     NOT NULL,
  "capability_id" uuid                     NOT NULL,
  "business_id"   uuid                     NOT NULL,
  "department"    text                     NOT NULL,
  "expires_at"    timestamp with time zone,
  "reason"        text                     NOT NULL,
  "granted_by"    uuid,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "overrides_reason_length" CHECK (((char_length(btrim(reason)) >= 5) AND (char_length(btrim(reason)) <= 1000))),
  CONSTRAINT "user_capability_overrides_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE RESTRICT,
  CONSTRAINT "user_capability_overrides_capability_id_fkey" FOREIGN KEY (capability_id) REFERENCES public.capabilities(id) ON DELETE RESTRICT,
  CONSTRAINT "user_capability_overrides_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES public.staff_profiles(user_id) ON DELETE RESTRICT,
  CONSTRAINT "user_capability_overrides_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.staff_profiles(user_id) ON DELETE CASCADE
);

ALTER TABLE "public"."user_capability_overrides"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_capability_overrides"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_capability_overrides"
  ADD COLUMN "effect" public.capability_effect NOT NULL;

ALTER TABLE "public"."user_capability_overrides"
  ADD COLUMN "scope_type" public.rbac_scope_type NOT NULL DEFAULT 'GLOBAL'::public.rbac_scope_type;

ALTER TABLE "public"."user_capability_overrides"
  ADD CONSTRAINT "overrides_scope_data_check"
    CHECK
    ((((scope_type = 'GLOBAL'::public.rbac_scope_type) AND (business_id IS NULL) AND (department IS NULL)) OR ((scope_type = 'DEPARTMENT'::public.rbac_scope_type) AND (business_id
    IS NULL) AND (department IS NOT NULL)) OR ((scope_type = 'BUSINESS'::public.rbac_scope_type) AND (business_id IS
    NOT NULL) AND (department IS NULL)) OR
    ((scope_type = ANY (ARRAY['DELIVERY'::public.rbac_scope_type, 'SELF'::public.rbac_scope_type])) AND (business_id IS NULL) AND (department IS NULL))));

ALTER TABLE "public"."user_capability_overrides"
  ADD CONSTRAINT "user_capability_overrides_pkey" PRIMARY KEY (user_id, capability_id, scope_type, business_id, department);

CREATE INDEX user_capability_overrides_business_idx ON public.user_capability_overrides USING btree (business_id)
  WHERE (business_id IS NOT NULL);

CREATE INDEX user_capability_overrides_expiry_idx ON public.user_capability_overrides USING btree (expires_at)
  WHERE (expires_at IS NOT NULL);

CREATE INDEX user_capability_overrides_user_idx ON public.user_capability_overrides USING btree (user_id, capability_id);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_capability_overrides" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."user_capability_overrides" TO "service_role";
