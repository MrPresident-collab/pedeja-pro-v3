CREATE TYPE "public"."vehicle_status" AS ENUM (
  'ACTIVE',
  'MAINTENANCE',
  'INACTIVE'
);

GRANT USAGE ON TYPE "public"."vehicle_status" TO "postgres";
