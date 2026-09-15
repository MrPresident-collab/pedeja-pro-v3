CREATE TYPE "public"."business_status" AS ENUM (
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
  'CLOSED',
  'REJECTED'
);

GRANT USAGE ON TYPE "public"."business_status" TO "postgres";
