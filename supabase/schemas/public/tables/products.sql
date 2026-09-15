CREATE TABLE "public"."products" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "business_id"   uuid                     NOT NULL,
  "sku"           text,
  "name"          text                     NOT NULL,
  "description"   text,
  "image_url"     text,
  "price"         numeric(14,2)            NOT NULL,
  "currency_code" text                     NOT NULL DEFAULT 'AOA'::text,
  "sort_order"    integer                  NOT NULL DEFAULT 0,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "products_business_id_fkey" FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE,
  CONSTRAINT "products_currency_format" CHECK ((currency_code ~ '^[A-Z]{3}$'::text)),
  CONSTRAINT "products_description_length" CHECK (((description IS NULL) OR (char_length(description) <= 3000))),
  CONSTRAINT "products_image_url_length" CHECK (((image_url IS NULL) OR (char_length(image_url) <= 2048))),
  CONSTRAINT "products_name_length" CHECK (((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 250))),
  CONSTRAINT "products_pkey" PRIMARY KEY (id),
  CONSTRAINT "products_price_nonnegative" CHECK ((price >= (0)::numeric)),
  CONSTRAINT "products_sku_length" CHECK (((sku IS NULL) OR ((char_length(btrim(sku)) >= 1) AND (char_length(btrim(sku)) <= 100)))),
  CONSTRAINT "products_sort_order_nonnegative" CHECK ((sort_order >= 0))
);

ALTER TABLE "public"."products"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."products"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."products"
  ADD COLUMN "status" public.product_status NOT NULL DEFAULT 'DRAFT'::public.product_status;

CREATE UNIQUE INDEX products_business_sku_uq ON public.products USING btree (business_id, lower(sku))
  WHERE (sku IS NOT NULL);

CREATE INDEX products_business_sort_idx ON public.products USING btree (business_id, sort_order, created_at);

CREATE INDEX products_business_status_idx ON public.products USING btree (business_id, status);

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION private.set_updated_at();

CREATE POLICY "products_active_select" ON "public"."products"
  FOR SELECT
  TO "authenticated"
  USING (((status = 'ACTIVE'::public.product_status) AND (EXISTS ( SELECT 1
   FROM public.businesses b
  WHERE ((b.id = products.business_id) AND (b.status = 'ACTIVE'::public.business_status))))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."products" TO "service_role";

REVOKE ALL ON TABLE "public"."products" FROM "authenticated";

GRANT SELECT ON TABLE "public"."products" TO "authenticated";
