CREATE TABLE "public"."order_events" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "order_id"      uuid                     NOT NULL,
  "event_type"    text                     NOT NULL,
  "actor_user_id" uuid,
  "metadata"      jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "order_events_pkey" PRIMARY KEY (id),
  CONSTRAINT "order_events_type_length" CHECK (((char_length(btrim(event_type)) >= 1) AND (char_length(btrim(event_type)) <= 100))),
  CONSTRAINT "order_events_order_id_fkey" FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE RESTRICT,
  CONSTRAINT "order_events_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE "public"."order_events"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."order_events"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."order_events"
  ADD COLUMN "from_status" public.order_status;

ALTER TABLE "public"."order_events"
  ADD COLUMN "to_status" public.order_status;

CREATE INDEX order_events_actor_idx ON public.order_events USING btree (actor_user_id, created_at);

CREATE INDEX order_events_order_idx ON public.order_events USING btree (order_id, created_at);

CREATE POLICY "order_events_customer_select" ON "public"."order_events"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_events.order_id) AND (o.customer_id = ( SELECT auth.uid() AS uid))))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."order_events" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."order_events" TO "service_role";

REVOKE ALL ON TABLE "public"."order_events" FROM "authenticated";

GRANT SELECT ON TABLE "public"."order_events" TO "authenticated";
