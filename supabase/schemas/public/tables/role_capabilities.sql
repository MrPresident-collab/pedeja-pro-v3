CREATE TABLE "public"."role_capabilities" (
  "capability_id" uuid                     NOT NULL,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "role_capabilities_capability_id_fkey" FOREIGN KEY (capability_id) REFERENCES public.capabilities(id) ON DELETE RESTRICT
);

ALTER TABLE "public"."role_capabilities"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."role_capabilities"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."role_capabilities"
  ADD COLUMN "effect" public.capability_effect NOT NULL DEFAULT 'ALLOW'::public.capability_effect;

ALTER TABLE "public"."role_capabilities"
  ADD COLUMN "scope_type" public.rbac_scope_type NOT NULL DEFAULT 'GLOBAL'::public.rbac_scope_type;

ALTER TABLE "public"."role_capabilities"
  ADD COLUMN "staff_role" public.staff_role NOT NULL;

ALTER TABLE "public"."role_capabilities"
  ADD CONSTRAINT "role_capabilities_pkey" PRIMARY KEY (staff_role, capability_id, scope_type);

CREATE INDEX role_capabilities_capability_idx ON public.role_capabilities USING btree (capability_id, effect);

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."role_capabilities" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."role_capabilities" TO "service_role";
