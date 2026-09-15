CREATE TYPE "public"."rider_availability_status" AS ENUM (
  'OFFLINE',
  'AVAILABLE',
  'BUSY',
  'SUSPENDED'
);

GRANT USAGE ON TYPE "public"."rider_availability_status" TO "postgres";
