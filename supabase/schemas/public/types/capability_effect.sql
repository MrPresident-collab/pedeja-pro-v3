CREATE TYPE "public"."capability_effect" AS ENUM (
  'ALLOW',
  'DENY'
);

GRANT USAGE ON TYPE "public"."capability_effect" TO "postgres";
