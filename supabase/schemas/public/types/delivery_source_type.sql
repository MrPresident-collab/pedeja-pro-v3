CREATE TYPE "public"."delivery_source_type" AS ENUM (
  'ORDER',
  'ENVIAR'
);

GRANT USAGE ON TYPE "public"."delivery_source_type" TO "postgres";
