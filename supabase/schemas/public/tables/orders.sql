CREATE TABLE "public"."orders" (
  "id"                              uuid                             NOT NULL DEFAULT gen_random_uuid(),
  "customer_id"                     uuid                             NOT NULL,
  "business_id"                     uuid                             NOT NULL,
  "currency_code"                   text                             NOT NULL DEFAULT 'AOA'::text,
  "subtotal"                        numeric(14,2)                    NOT NULL DEFAULT 0,
  "delivery_fee"                    numeric(14,2)                    NOT NULL DEFAULT 0,
  "service_fee"                     numeric(14,2)                    NOT NULL DEFAULT 0,
  "discount_amount"                 numeric(14,2)                    NOT NULL DEFAULT 0,
  "total_amount"                    numeric(14,2)                    NOT NULL DEFAULT 0,
  "delivery_address_id"             uuid,
  "delivery_address_line_1"         text                             NOT NULL,
  "delivery_address_line_2"         text,
  "delivery_neighborhood"           text,
  "delivery_municipality"           text,
  "delivery_city"                   text                             NOT NULL,
  "delivery_province"               text                             NOT NULL,
  "delivery_country_code"           text                             NOT NULL DEFAULT 'AO'::text,
  "delivery_location"               extensions.geography(Point,4326) NOT NULL,
  "recipient_name"                  text                             NOT NULL,
  "recipient_phone"                 text                             NOT NULL,
  "delivery_instructions"           text,
  "customer_note"                   text,
  "placed_at"                       timestamp with time zone,
  "accepted_at"                     timestamp with time zone,
  "delivered_at"                    timestamp with time zone,
  "cancelled_at"                    timestamp with time zone,
  "created_at"                      timestamp with time zone         NOT NULL DEFAULT now(),
  "updated_at"                      timestamp with time zone         NOT NULL DEFAULT now(),
  "idempotency_key"                 text,
  "idempotency_request_fingerprint" text,
  CONSTRAINT "orders_address_line1_length" CHECK (((char_length(btrim(delivery_address_line_1)) >= 2) AND (char_length(btrim(delivery_address_line_1)) <= 300))),
  CONSTRAINT "orders_address_line2_length" CHECK (((delivery_address_line_2 IS NULL) OR (char_length(delivery_address_line_2) <= 300))),
  CONSTRAINT "orders_amounts_nonnegative"
    CHECK
    (((subtotal >= (0)::numeric) AND (delivery_fee >= (0)::numeric) AND (service_fee >= (0)::numeric) AND (discount_amount >= (0)::numeric) AND (total_amount >= (0)::numeric))),
  CONSTRAINT "orders_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE RESTRICT,
  CONSTRAINT "orders_city_length" CHECK (((char_length(btrim(delivery_city)) >= 2) AND (char_length(btrim(delivery_city)) <= 100))),
  CONSTRAINT "orders_country_code_format" CHECK ((delivery_country_code ~ '^[A-Z]{2}$'::text)),
  CONSTRAINT "orders_currency_format" CHECK ((currency_code ~ '^[A-Z]{3}$'::text)),
  CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customer_profiles(user_id) ON DELETE RESTRICT,
  CONSTRAINT "orders_customer_note_length" CHECK (((customer_note IS NULL) OR (char_length(customer_note) <= 2000))),
  CONSTRAINT "orders_delivery_address_id_fkey" FOREIGN KEY (delivery_address_id) REFERENCES public.addresses(id) ON DELETE SET NULL,
  CONSTRAINT "orders_delivery_instructions_length" CHECK (((delivery_instructions IS NULL) OR (char_length(delivery_instructions) <= 1000))),
  CONSTRAINT "orders_delivery_location_is_point" CHECK ((extensions.st_geometrytype((delivery_location)::extensions.geometry) = 'ST_Point'::text)),
  CONSTRAINT "orders_delivery_location_valid" CHECK (extensions.st_isvalid((delivery_location)::extensions.geometry)),
  CONSTRAINT "orders_idempotency_key_format" CHECK (((idempotency_key IS NULL) OR ((char_length(btrim(idempotency_key)) >= 1) AND (char_length(btrim(idempotency_key)) <= 200)))),
  CONSTRAINT "orders_municipality_length" CHECK (((delivery_municipality IS NULL) OR (char_length(delivery_municipality) <= 150))),
  CONSTRAINT "orders_neighborhood_length" CHECK (((delivery_neighborhood IS NULL) OR (char_length(delivery_neighborhood) <= 150))),
  CONSTRAINT "orders_pkey" PRIMARY KEY (id),
  CONSTRAINT "orders_province_length" CHECK (((char_length(btrim(delivery_province)) >= 2) AND (char_length(btrim(delivery_province)) <= 100))),
  CONSTRAINT "orders_recipient_name_length" CHECK (((char_length(btrim(recipient_name)) >= 1) AND (char_length(btrim(recipient_name)) <= 200))),
  CONSTRAINT "orders_recipient_phone_length" CHECK (((char_length(recipient_phone) >= 3) AND (char_length(recipient_phone) <= 32))),
  CONSTRAINT "orders_total_formula" CHECK ((total_amount = (((subtotal + delivery_fee) + service_fee) - discount_amount)))
);

ALTER TABLE "public"."orders"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."orders"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."orders"
  ADD COLUMN "payment_status" public.order_payment_status NOT NULL DEFAULT 'UNPAID'::public.order_payment_status;

ALTER TABLE "public"."orders"
  ADD COLUMN "status" public.order_status NOT NULL DEFAULT 'DRAFT'::public.order_status;

ALTER TABLE "public"."orders"
  ADD CONSTRAINT "orders_cancelled_at_consistency" CHECK (((cancelled_at IS NULL) OR (status = 'CANCELLED'::public.order_status)));

ALTER TABLE "public"."orders"
  ADD CONSTRAINT "orders_delivered_at_consistency" CHECK (((delivered_at IS NULL) OR (status = 'DELIVERED'::public.order_status)));

ALTER TABLE "public"."orders"
  ADD CONSTRAINT "orders_placed_at_consistency" CHECK (((placed_at IS NULL) OR (status <> 'DRAFT'::public.order_status)));

CREATE INDEX orders_business_idx ON public.orders USING btree (business_id, created_at DESC);

CREATE UNIQUE INDEX orders_customer_idempotency_key_uq ON public.orders USING btree (customer_id, idempotency_key)
  WHERE (idempotency_key IS NOT NULL);

CREATE INDEX orders_customer_idx ON public.orders USING btree (customer_id, created_at DESC);

CREATE INDEX orders_delivery_location_gist_idx ON public.orders USING gist (delivery_location);

CREATE INDEX orders_payment_status_idx ON public.orders USING btree (payment_status);

CREATE INDEX orders_status_idx ON public.orders USING btree (status, created_at DESC);

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE POLICY "orders_customer_select" ON "public"."orders"
  FOR SELECT
  TO "authenticated"
  USING (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (customer_id = ( SELECT auth.uid() AS uid))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orders" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."orders" TO "service_role";

REVOKE ALL ON TABLE "public"."orders" FROM "authenticated";

GRANT SELECT ON TABLE "public"."orders" TO "authenticated";
