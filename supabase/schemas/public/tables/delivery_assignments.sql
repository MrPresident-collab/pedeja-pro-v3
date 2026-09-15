CREATE TABLE "public"."delivery_assignments" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "delivery_job_id"  uuid                     NOT NULL,
  "rider_id"         uuid                     NOT NULL,
  "vehicle_id"       uuid,
  "proposed_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "assigned_at"      timestamp with time zone,
  "accepted_at"      timestamp with time zone,
  "rejected_at"      timestamp with time zone,
  "revoked_at"       timestamp with time zone,
  "rejection_reason" text,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "delivery_assignments_pkey" PRIMARY KEY (id),
  CONSTRAINT "delivery_assignments_rejection_reason_length" CHECK (((rejection_reason IS NULL) OR (char_length(rejection_reason) <= 500))),
  CONSTRAINT "delivery_assignments_delivery_job_id_fkey" FOREIGN KEY (delivery_job_id) REFERENCES public.delivery_jobs(id) ON DELETE RESTRICT,
  CONSTRAINT "delivery_assignments_rider_id_fkey" FOREIGN KEY (rider_id) REFERENCES public.riders(id) ON DELETE RESTRICT,
  CONSTRAINT "delivery_assignments_vehicle_id_fkey" FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL
);

ALTER TABLE "public"."delivery_assignments"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."delivery_assignments"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."delivery_assignments"
  ADD COLUMN "status" public.assignment_status NOT NULL DEFAULT 'PROPOSED'::public.assignment_status;

ALTER TABLE "public"."delivery_assignments"
  ADD CONSTRAINT "delivery_assignments_accepted_consistency" CHECK (((accepted_at IS NULL) OR (status = 'ACCEPTED'::public.assignment_status)));

ALTER TABLE "public"."delivery_assignments"
  ADD CONSTRAINT "delivery_assignments_rejected_consistency" CHECK (((rejected_at IS NULL) OR (status = 'REJECTED'::public.assignment_status)));

ALTER TABLE "public"."delivery_assignments"
  ADD CONSTRAINT "delivery_assignments_revoked_consistency" CHECK (((revoked_at IS NULL) OR (status = 'REVOKED'::public.assignment_status)));

CREATE INDEX delivery_assignments_job_idx ON public.delivery_assignments USING btree (delivery_job_id, created_at DESC);

CREATE UNIQUE INDEX delivery_assignments_one_active_per_job_uq ON public.delivery_assignments USING btree (delivery_job_id)
  WHERE (status = ANY (ARRAY['PROPOSED'::public.assignment_status, 'ASSIGNED'::public.assignment_status, 'ACCEPTED'::public.assignment_status]));

CREATE UNIQUE INDEX delivery_assignments_one_active_per_rider_uq ON public.delivery_assignments USING btree (rider_id)
  WHERE (status = ANY (ARRAY['ASSIGNED'::public.assignment_status, 'ACCEPTED'::public.assignment_status]));

CREATE INDEX delivery_assignments_rider_idx ON public.delivery_assignments USING btree (rider_id, created_at DESC);

CREATE INDEX delivery_assignments_status_idx ON public.delivery_assignments USING btree (status, created_at DESC);

CREATE TRIGGER delivery_assignments_set_updated_at
  BEFORE UPDATE ON public.delivery_assignments
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE POLICY "delivery_assignments_rider_select" ON "public"."delivery_assignments"
  FOR SELECT
  TO "authenticated"
  USING (( SELECT private.is_rider_self(delivery_assignments.rider_id) AS is_rider_self));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."delivery_assignments" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."delivery_assignments" TO "service_role";

REVOKE ALL ON TABLE "public"."delivery_assignments" FROM "authenticated";

GRANT SELECT ON TABLE "public"."delivery_assignments" TO "authenticated";
