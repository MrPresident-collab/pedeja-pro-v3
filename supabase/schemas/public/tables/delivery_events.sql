CREATE TABLE "public"."delivery_events" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "delivery_job_id" uuid                     NOT NULL,
  "event_type"      text                     NOT NULL,
  "rider_id"        uuid,
  "actor_user_id"   uuid,
  "metadata"        jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "delivery_events_pkey" PRIMARY KEY (id),
  CONSTRAINT "delivery_events_type_length" CHECK (((char_length(btrim(event_type)) >= 1) AND (char_length(btrim(event_type)) <= 100))),
  CONSTRAINT "delivery_events_delivery_job_id_fkey" FOREIGN KEY (delivery_job_id) REFERENCES public.delivery_jobs(id) ON DELETE RESTRICT,
  CONSTRAINT "delivery_events_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT "delivery_events_rider_id_fkey" FOREIGN KEY (rider_id) REFERENCES public.riders(id) ON DELETE SET NULL
);

ALTER TABLE "public"."delivery_events"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."delivery_events"
  FORCE ROW LEVEL SECURITY;

ALTER TABLE "public"."delivery_events"
  ADD COLUMN "from_status" public.delivery_status;

ALTER TABLE "public"."delivery_events"
  ADD COLUMN "to_status" public.delivery_status;

CREATE INDEX delivery_events_actor_idx ON public.delivery_events USING btree (actor_user_id, created_at);

CREATE INDEX delivery_events_job_idx ON public.delivery_events USING btree (delivery_job_id, created_at);

CREATE INDEX delivery_events_rider_idx ON public.delivery_events USING btree (rider_id, created_at);

CREATE POLICY "delivery_events_actor_select" ON "public"."delivery_events"
  FOR SELECT
  TO "authenticated"
  USING
    ((( SELECT private.is_delivery_customer(delivery_events.delivery_job_id) AS is_delivery_customer) OR ( SELECT private.is_delivery_rider(delivery_events.delivery_job_id) AS
    is_delivery_rider)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."delivery_events" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."delivery_events" TO "service_role";

REVOKE ALL ON TABLE "public"."delivery_events" FROM "authenticated";

GRANT SELECT ON TABLE "public"."delivery_events" TO "authenticated";
