CREATE TABLE "public"."riders" (
  "id"               uuid                             NOT NULL DEFAULT gen_random_uuid(),
  "user_id"          uuid                             NOT NULL,
  "current_location" extensions.geography(Point,4326),
  "last_location_at" timestamp with time zone,
  "created_at"       timestamp with time zone         NOT NULL DEFAULT now(),
  "updated_at"       timestamp with time zone         NOT NULL DEFAULT now(),
  CONSTRAINT "riders_location_timestamp_check" CHECK (((current_location IS NOT NULL) OR (last_location_at IS NULL))),
  CONSTRAINT "riders_pkey" PRIMARY KEY (id),
  CONSTRAINT "riders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.rider_profiles(user_id) ON DELETE RESTRICT,
  CONSTRAINT "riders_user_id_key" UNIQUE (user_id)
);

ALTER TABLE "public"."riders"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."riders"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."riders"
  ADD COLUMN "availability_status" public.rider_availability_status NOT NULL DEFAULT 'OFFLINE'::public.rider_availability_status;

CREATE INDEX riders_availability_idx ON public.riders USING btree (availability_status);

CREATE INDEX riders_location_gist_idx ON public.riders USING gist (current_location);

CREATE TRIGGER riders_set_updated_at
  BEFORE UPDATE ON public.riders
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE POLICY "riders_self_select" ON "public"."riders"
  FOR SELECT
  TO "authenticated"
  USING (((user_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM public.rider_profiles rp
  WHERE ((rp.user_id = riders.user_id) AND (rp.verification_status = 'VERIFIED'::public.rider_verification_status))))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."riders" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."riders" TO "service_role";

REVOKE ALL ON TABLE "public"."riders" FROM "authenticated";

GRANT SELECT ON TABLE "public"."riders" TO "authenticated";
