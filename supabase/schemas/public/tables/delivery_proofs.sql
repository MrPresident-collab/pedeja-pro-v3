CREATE TABLE "public"."delivery_proofs" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "delivery_job_id" uuid                     NOT NULL,
  "proof_type"      text                     NOT NULL,
  "proof_value"     text,
  "storage_path"    text,
  "captured_at"     timestamp with time zone NOT NULL DEFAULT now(),
  "captured_by"     uuid,
  "metadata"        jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "delivery_proofs_delivery_job_id_fkey" FOREIGN KEY (delivery_job_id) REFERENCES public.delivery_jobs(id) ON DELETE RESTRICT,
  CONSTRAINT "delivery_proofs_payload_check" CHECK (((proof_value IS NOT NULL) OR (storage_path IS NOT NULL))),
  CONSTRAINT "delivery_proofs_pkey" PRIMARY KEY (id),
  CONSTRAINT "delivery_proofs_storage_path_length" CHECK (((storage_path IS NULL) OR (char_length(storage_path) <= 1000))),
  CONSTRAINT "delivery_proofs_type_length" CHECK (((char_length(btrim(proof_type)) >= 1) AND (char_length(btrim(proof_type)) <= 80))),
  CONSTRAINT "delivery_proofs_value_length" CHECK (((proof_value IS NULL) OR (char_length(proof_value) <= 1000))),
  CONSTRAINT "delivery_proofs_captured_by_fkey" FOREIGN KEY (captured_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE "public"."delivery_proofs"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."delivery_proofs"
  FORCE ROW LEVEL SECURITY;

CREATE INDEX delivery_proofs_job_idx ON public.delivery_proofs USING btree (delivery_job_id, captured_at);

CREATE POLICY "delivery_proofs_actor_select" ON "public"."delivery_proofs"
  FOR SELECT
  TO "authenticated"
  USING
    ((( SELECT private.is_delivery_customer(delivery_proofs.delivery_job_id) AS is_delivery_customer) OR ( SELECT private.is_delivery_rider(delivery_proofs.delivery_job_id) AS
    is_delivery_rider)));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."delivery_proofs" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."delivery_proofs" TO "service_role";

REVOKE ALL ON TABLE "public"."delivery_proofs" FROM "authenticated";

GRANT SELECT ON TABLE "public"."delivery_proofs" TO "authenticated";
