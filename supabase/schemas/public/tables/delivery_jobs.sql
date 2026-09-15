CREATE TABLE "public"."delivery_jobs" (
  "id"                         uuid                             NOT NULL DEFAULT gen_random_uuid(),
  "order_id"                   uuid,
  "enviar_shipment_id"         uuid,
  "pickup_address_line_1"      text                             NOT NULL,
  "pickup_address_line_2"      text,
  "pickup_neighborhood"        text,
  "pickup_municipality"        text,
  "pickup_city"                text                             NOT NULL,
  "pickup_province"            text                             NOT NULL,
  "pickup_country_code"        text                             NOT NULL DEFAULT 'AO'::text,
  "pickup_location"            extensions.geography(Point,4326) NOT NULL,
  "destination_address_line_1" text                             NOT NULL,
  "destination_address_line_2" text,
  "destination_neighborhood"   text,
  "destination_municipality"   text,
  "destination_city"           text                             NOT NULL,
  "destination_province"       text                             NOT NULL,
  "destination_country_code"   text                             NOT NULL DEFAULT 'AO'::text,
  "destination_location"       extensions.geography(Point,4326) NOT NULL,
  "recipient_name"             text                             NOT NULL,
  "recipient_phone"            text                             NOT NULL,
  "delivery_instructions"      text,
  "created_at"                 timestamp with time zone         NOT NULL DEFAULT now(),
  "updated_at"                 timestamp with time zone         NOT NULL DEFAULT now(),
  CONSTRAINT "delivery_jobs_destination_line1_length" CHECK (((char_length(btrim(destination_address_line_1)) >= 2) AND (char_length(btrim(destination_address_line_1)) <= 300))),
  CONSTRAINT "delivery_jobs_destination_line2_length" CHECK (((destination_address_line_2 IS NULL) OR (char_length(destination_address_line_2) <= 300))),
  CONSTRAINT "delivery_jobs_enviar_shipment_id_key" UNIQUE (enviar_shipment_id),
  CONSTRAINT "delivery_jobs_instructions_length" CHECK (((delivery_instructions IS NULL) OR (char_length(delivery_instructions) <= 1000))),
  CONSTRAINT "delivery_jobs_locations_are_points"
    CHECK
    (((extensions.st_geometrytype((pickup_location)::extensions.geometry) = 'ST_Point'::text) AND (extensions.st_geometrytype((destination_location)::extensions.geometry) =
    'ST_Point'::text))),
  CONSTRAINT "delivery_jobs_locations_valid"
    CHECK ((extensions.st_isvalid((pickup_location)::extensions.geometry) AND extensions.st_isvalid((destination_location)::extensions.geometry))),
  CONSTRAINT "delivery_jobs_order_id_key" UNIQUE (order_id),
  CONSTRAINT "delivery_jobs_pickup_line1_length" CHECK (((char_length(btrim(pickup_address_line_1)) >= 2) AND (char_length(btrim(pickup_address_line_1)) <= 300))),
  CONSTRAINT "delivery_jobs_pickup_line2_length" CHECK (((pickup_address_line_2 IS NULL) OR (char_length(pickup_address_line_2) <= 300))),
  CONSTRAINT "delivery_jobs_pkey" PRIMARY KEY (id),
  CONSTRAINT "delivery_jobs_recipient_name_length" CHECK (((char_length(btrim(recipient_name)) >= 1) AND (char_length(btrim(recipient_name)) <= 200))),
  CONSTRAINT "delivery_jobs_recipient_phone_length" CHECK (((char_length(recipient_phone) >= 3) AND (char_length(recipient_phone) <= 32))),
  CONSTRAINT "delivery_jobs_enviar_shipment_id_fkey" FOREIGN KEY (enviar_shipment_id) REFERENCES public.enviar_shipments(id) ON DELETE RESTRICT,
  CONSTRAINT "delivery_jobs_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT
);

ALTER TABLE "public"."delivery_jobs"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."delivery_jobs"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."delivery_jobs"
  ADD COLUMN "source_type" public.delivery_source_type NOT NULL;

ALTER TABLE "public"."delivery_jobs"
  ADD COLUMN "status" public.delivery_status NOT NULL DEFAULT 'CREATED'::public.delivery_status;

ALTER TABLE "public"."delivery_jobs"
  ADD CONSTRAINT "delivery_jobs_source_integrity" CHECK ((((source_type = 'ORDER'::public.delivery_source_type) AND (order_id IS
    NOT NULL) AND (enviar_shipment_id IS NULL)) OR ((source_type = 'ENVIAR'::public.delivery_source_type) AND (enviar_shipment_id IS NOT NULL) AND (order_id IS NULL))));

CREATE INDEX delivery_jobs_destination_location_gist_idx ON public.delivery_jobs USING gist (destination_location);

CREATE UNIQUE INDEX delivery_jobs_enviar_source_uq ON public.delivery_jobs USING btree (enviar_shipment_id)
  WHERE (enviar_shipment_id IS NOT NULL);

CREATE UNIQUE INDEX delivery_jobs_order_source_uq ON public.delivery_jobs USING btree (order_id)
  WHERE (order_id IS NOT NULL);

CREATE INDEX delivery_jobs_pickup_location_gist_idx ON public.delivery_jobs USING gist (pickup_location);

CREATE INDEX delivery_jobs_status_idx ON public.delivery_jobs USING btree (status, created_at);

CREATE TRIGGER delivery_jobs_set_updated_at
  BEFORE UPDATE ON public.delivery_jobs
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE POLICY "delivery_jobs_actor_select" ON "public"."delivery_jobs"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT private.is_delivery_customer(delivery_jobs.id) AS is_delivery_customer) OR ( SELECT private.is_delivery_rider(delivery_jobs.id) AS is_delivery_rider)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."delivery_jobs" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."delivery_jobs" TO "service_role";

REVOKE ALL ON TABLE "public"."delivery_jobs" FROM "authenticated";

GRANT SELECT ON TABLE "public"."delivery_jobs" TO "authenticated";
