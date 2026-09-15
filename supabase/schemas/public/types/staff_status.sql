CREATE TYPE "public"."staff_status" AS ENUM (
  'ACTIVE',
  'SUSPENDED',
  'DEACTIVATED'
);

GRANT USAGE ON TYPE "public"."staff_status" TO "postgres";
