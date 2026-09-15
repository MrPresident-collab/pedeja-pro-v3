CREATE TABLE "public"."addresses" (
  "id"             uuid                             NOT NULL DEFAULT gen_random_uuid(),
  "address_line_1" text                             NOT NULL,
  "address_line_2" text,
  "neighborhood"   text,
  "municipality"   text,
  "city"           text                             NOT NULL,
  "province"       text                             NOT NULL,
  "country_code"   text                             NOT NULL DEFAULT 'AO'::text,
  "location"       extensions.geography(Point,4326) NOT NULL,
  "created_at"     timestamp with time zone         NOT NULL DEFAULT now(),
  "updated_at"     timestamp with time zone         NOT NULL DEFAULT now(),
  CONSTRAINT "addresses_city_length" CHECK (((char_length(btrim(city)) >= 2) AND (char_length(btrim(city)) <= 100))),
  CONSTRAINT "addresses_country_code_format" CHECK ((country_code ~ '^[A-Z]{2}$'::text)),
  CONSTRAINT "addresses_line1_length" CHECK (((char_length(btrim(address_line_1)) >= 2) AND (char_length(btrim(address_line_1)) <= 300))),
  CONSTRAINT "addresses_line2_length" CHECK (((address_line_2 IS NULL) OR (char_length(address_line_2) <= 300))),
  CONSTRAINT "addresses_location_is_point" CHECK ((extensions.st_geometrytype((location)::extensions.geometry) = 'ST_Point'::text)),
  CONSTRAINT "addresses_location_valid" CHECK (extensions.st_isvalid((location)::extensions.geometry)),
  CONSTRAINT "addresses_municipality_length" CHECK (((municipality IS NULL) OR (char_length(municipality) <= 150))),
  CONSTRAINT "addresses_neighborhood_length" CHECK (((neighborhood IS NULL) OR (char_length(neighborhood) <= 150))),
  CONSTRAINT "addresses_pkey" PRIMARY KEY (id),
  CONSTRAINT "addresses_province_length" CHECK (((char_length(btrim(province)) >= 2) AND (char_length(btrim(province)) <= 100)))
);

ALTER TABLE "public"."addresses"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."addresses"
  FORCE ROW LEVEL SECURITY;

CREATE INDEX addresses_city_province_idx ON public.addresses USING btree (country_code, province, city);

CREATE INDEX addresses_location_gist_idx ON public.addresses USING gist (location);

CREATE TRIGGER addresses_set_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE POLICY "addresses_actor_select" ON "public"."addresses"
  FOR SELECT
  TO "authenticated"
  USING (((EXISTS ( SELECT 1
   FROM public.customer_addresses ca
  WHERE ((ca.address_id = addresses.id) AND (ca.customer_id = ( SELECT auth.uid() AS uid))))) OR (EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.address_id = addresses.id) AND (b.status = 'ACTIVE'::public.business_status))))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."addresses" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."addresses" TO "service_role";

REVOKE ALL ON TABLE "public"."addresses" FROM "authenticated";

GRANT SELECT ON TABLE "public"."addresses" TO "authenticated";
