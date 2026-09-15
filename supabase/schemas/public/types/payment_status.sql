CREATE TYPE "public"."payment_status" AS ENUM (
  'INITIATED',
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'EXPIRED'
);

GRANT USAGE ON TYPE "public"."payment_status" TO "postgres";
