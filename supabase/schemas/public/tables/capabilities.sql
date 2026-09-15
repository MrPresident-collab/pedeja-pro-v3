CREATE TABLE "public"."capabilities" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "capability_key" text                     NOT NULL,
  "description"    text,
  "active"         boolean                  NOT NULL DEFAULT true,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "capabilities_description_length" CHECK (((description IS NULL) OR (char_length(description) <= 500))),
  CONSTRAINT "capabilities_key_length" CHECK (((char_length(btrim(capability_key)) >= 3) AND (char_length(btrim(capability_key)) <= 120))),
  CONSTRAINT "capabilities_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."capabilities"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."capabilities"
  FORCE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX capabilities_key_uq ON public.capabilities USING btree (lower(capability_key));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."capabilities" TO "postgres";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."capabilities" TO "service_role";
