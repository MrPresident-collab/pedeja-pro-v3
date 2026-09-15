CREATE TABLE "public"."enviar_events" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "shipment_id"   uuid                     NOT NULL,
  "event_type"    text                     NOT NULL,
  "actor_user_id" uuid,
  "metadata"      jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "enviar_events_pkey" PRIMARY KEY (id),
  CONSTRAINT "enviar_events_type_length" CHECK (((char_length(btrim(event_type)) >= 1) AND (char_length(btrim(event_type)) <= 100))),
  CONSTRAINT "enviar_events_shipment_id_fkey" FOREIGN KEY (shipment_id) REFERENCES public.enviar_shipments(id) ON DELETE RESTRICT,
  CONSTRAINT "enviar_events_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE "public"."enviar_events"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."enviar_events"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."enviar_events"
  ADD COLUMN "from_status" public.enviar_status;

ALTER TABLE "public"."enviar_events"
  ADD COLUMN "to_status" public.enviar_status;

CREATE INDEX enviar_events_actor_idx ON public.enviar_events USING btree (actor_user_id, created_at);

CREATE INDEX enviar_events_shipment_idx ON public.enviar_events USING btree (shipment_id, created_at);

CREATE POLICY "enviar_events_customer_select" ON "public"."enviar_events"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.enviar_shipments es
  WHERE ((es.id = enviar_events.shipment_id) AND (es.customer_id = ( SELECT auth.uid() AS uid))))));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."enviar_events" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."enviar_events" TO "service_role";

REVOKE ALL ON TABLE "public"."enviar_events" FROM "authenticated";

GRANT SELECT ON TABLE "public"."enviar_events" TO "authenticated";
