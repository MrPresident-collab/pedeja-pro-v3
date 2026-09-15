CREATE TABLE "public"."order_items" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_id"              uuid                     NOT NULL,
  "product_id"            uuid,
  "product_name_snapshot" text                     NOT NULL,
  "sku_snapshot"          text,
  "unit_price_snapshot"   numeric(14,2)            NOT NULL,
  "quantity"              integer                  NOT NULL,
  "line_total"            numeric(14,2)            NOT NULL,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "order_items_line_total_formula" CHECK ((line_total = (unit_price_snapshot * (quantity)::numeric))),
  CONSTRAINT "order_items_name_length" CHECK (((char_length(btrim(product_name_snapshot)) >= 1) AND (char_length(btrim(product_name_snapshot)) <= 250))),
  CONSTRAINT "order_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "order_items_quantity_positive" CHECK ((quantity > 0)),
  CONSTRAINT "order_items_sku_length" CHECK (((sku_snapshot IS NULL) OR (char_length(sku_snapshot) <= 100))),
  CONSTRAINT "order_items_unit_price_nonnegative" CHECK ((unit_price_snapshot >= (0)::numeric)),
  CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL
);

ALTER TABLE "public"."order_items"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."order_items"
  FORCE ROW LEVEL SECURITY;

CREATE INDEX order_items_order_idx ON public.order_items USING btree (order_id);

CREATE INDEX order_items_product_idx ON public.order_items USING btree (product_id);

CREATE POLICY "order_items_customer_select" ON "public"."order_items"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND (o.customer_id = ( SELECT auth.uid() AS uid))))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_items" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_items" TO "service_role";

REVOKE ALL ON TABLE "public"."order_items" FROM "authenticated";

GRANT SELECT ON TABLE "public"."order_items" TO "authenticated";
