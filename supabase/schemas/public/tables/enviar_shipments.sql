CREATE TABLE "public"."enviar_shipments" (
  "id"                       uuid                             NOT NULL DEFAULT gen_random_uuid(),
  "customer_id"              uuid                             NOT NULL,
  "currency_code"            text                             NOT NULL DEFAULT 'AOA'::text,
  "delivery_fee"             numeric(14,2)                    NOT NULL DEFAULT 0,
  "service_fee"              numeric(14,2)                    NOT NULL DEFAULT 0,
  "discount_amount"          numeric(14,2)                    NOT NULL DEFAULT 0,
  "total_amount"             numeric(14,2)                    NOT NULL DEFAULT 0,
  "sender_name"              text                             NOT NULL,
  "sender_phone"             text                             NOT NULL,
  "sender_address_line_1"    text                             NOT NULL,
  "sender_address_line_2"    text,
  "sender_neighborhood"      text,
  "sender_municipality"      text,
  "sender_city"              text                             NOT NULL,
  "sender_province"          text                             NOT NULL,
  "sender_country_code"      text                             NOT NULL DEFAULT 'AO'::text,
  "sender_location"          extensions.geography(Point,4326) NOT NULL,
  "recipient_name"           text                             NOT NULL,
  "recipient_phone"          text                             NOT NULL,
  "recipient_address_line_1" text                             NOT NULL,
  "recipient_address_line_2" text,
  "recipient_neighborhood"   text,
  "recipient_municipality"   text,
  "recipient_city"           text                             NOT NULL,
  "recipient_province"       text                             NOT NULL,
  "recipient_country_code"   text                             NOT NULL DEFAULT 'AO'::text,
  "recipient_location"       extensions.geography(Point,4326) NOT NULL,
  "package_description"      text                             NOT NULL,
  "package_weight_kg"        numeric(10,3),
  "customer_note"            text,
  "requested_at"             timestamp with time zone,
  "delivered_at"             timestamp with time zone,
  "cancelled_at"             timestamp with time zone,
  "created_at"               timestamp with time zone         NOT NULL DEFAULT now(),
  "updated_at"               timestamp with time zone         NOT NULL DEFAULT now(),
  CONSTRAINT "enviar_amounts_nonnegative"
    CHECK (((delivery_fee >= (0)::numeric) AND (service_fee >= (0)::numeric) AND (discount_amount >= (0)::numeric) AND (total_amount >= (0)::numeric))),
  CONSTRAINT "enviar_currency_format" CHECK ((currency_code ~ '^[A-Z]{3}$'::text)),
  CONSTRAINT "enviar_customer_note_length" CHECK (((customer_note IS NULL) OR (char_length(customer_note) <= 2000))),
  CONSTRAINT "enviar_locations_are_points"
    CHECK
    (((extensions.st_geometrytype((sender_location)::extensions.geometry) = 'ST_Point'::text) AND (extensions.st_geometrytype((recipient_location)::extensions.geometry) =
    'ST_Point'::text))),
  CONSTRAINT "enviar_locations_valid" CHECK ((extensions.st_isvalid((sender_location)::extensions.geometry) AND extensions.st_isvalid((recipient_location)::extensions.geometry))),
  CONSTRAINT "enviar_package_description_length" CHECK (((char_length(btrim(package_description)) >= 1) AND (char_length(btrim(package_description)) <= 1000))),
  CONSTRAINT "enviar_recipient_name_length" CHECK (((char_length(btrim(recipient_name)) >= 1) AND (char_length(btrim(recipient_name)) <= 200))),
  CONSTRAINT "enviar_recipient_phone_length" CHECK (((char_length(recipient_phone) >= 3) AND (char_length(recipient_phone) <= 32))),
  CONSTRAINT "enviar_sender_name_length" CHECK (((char_length(btrim(sender_name)) >= 1) AND (char_length(btrim(sender_name)) <= 200))),
  CONSTRAINT "enviar_sender_phone_length" CHECK (((char_length(sender_phone) >= 3) AND (char_length(sender_phone) <= 32))),
  CONSTRAINT "enviar_shipments_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customer_profiles(user_id) ON DELETE RESTRICT,
  CONSTRAINT "enviar_shipments_pkey" PRIMARY KEY (id),
  CONSTRAINT "enviar_total_formula" CHECK ((total_amount = ((delivery_fee + service_fee) - discount_amount))),
  CONSTRAINT "enviar_weight_positive" CHECK (((package_weight_kg IS NULL) OR (package_weight_kg > (0)::numeric)))
);

ALTER TABLE "public"."enviar_shipments"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."enviar_shipments"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."enviar_shipments"
  ADD COLUMN "status" public.enviar_status NOT NULL DEFAULT 'DRAFT'::public.enviar_status;

ALTER TABLE "public"."enviar_shipments"
  ADD COLUMN "payment_status" public.order_payment_status NOT NULL DEFAULT 'UNPAID'::public.order_payment_status;

CREATE INDEX enviar_customer_idx ON public.enviar_shipments USING btree (customer_id, created_at DESC);

CREATE INDEX enviar_recipient_location_gist_idx ON public.enviar_shipments USING gist (recipient_location);

CREATE INDEX enviar_sender_location_gist_idx ON public.enviar_shipments USING gist (sender_location);

CREATE INDEX enviar_status_idx ON public.enviar_shipments USING btree (status, created_at DESC);

CREATE TRIGGER enviar_shipments_set_updated_at
  BEFORE UPDATE ON public.enviar_shipments
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE POLICY "enviar_customer_select" ON "public"."enviar_shipments"
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (customer_id = ( SELECT auth.uid() AS uid))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."enviar_shipments" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."enviar_shipments" TO "service_role";

REVOKE ALL ON TABLE "public"."enviar_shipments" FROM "authenticated";

GRANT SELECT ON TABLE "public"."enviar_shipments" TO "authenticated";
