CREATE TABLE "public"."vehicles" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "rider_id"            uuid,
  "registration_number" text,
  "make"                text,
  "model"               text,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "vehicles_make_length" CHECK (((make IS NULL) OR ((char_length(btrim(make)) >= 1) AND (char_length(btrim(make)) <= 100)))),
  CONSTRAINT "vehicles_model_length" CHECK (((model IS NULL) OR ((char_length(btrim(model)) >= 1) AND (char_length(btrim(model)) <= 100)))),
  CONSTRAINT "vehicles_pkey" PRIMARY KEY (id),
  CONSTRAINT "vehicles_registration_length"
    CHECK (((registration_number IS NULL) OR ((char_length(btrim(registration_number)) >= 2) AND (char_length(btrim(registration_number)) <= 40)))),
  CONSTRAINT "vehicles_rider_id_fkey" FOREIGN KEY (rider_id) REFERENCES public.riders(id) ON DELETE SET NULL
);

ALTER TABLE "public"."vehicles"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."vehicles"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."vehicles"
  ADD COLUMN "status" public.vehicle_status NOT NULL DEFAULT 'ACTIVE'::public.vehicle_status;

ALTER TABLE "public"."vehicles"
  ADD COLUMN "vehicle_type" public.vehicle_type NOT NULL;

CREATE UNIQUE INDEX vehicles_registration_uq ON public.vehicles USING btree (lower(registration_number))
  WHERE (registration_number IS NOT NULL);

CREATE INDEX vehicles_rider_idx ON public.vehicles USING btree (rider_id);

CREATE INDEX vehicles_status_type_idx ON public.vehicles USING btree (status, vehicle_type);

CREATE TRIGGER vehicles_set_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."vehicles" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."vehicles" TO "service_role";
