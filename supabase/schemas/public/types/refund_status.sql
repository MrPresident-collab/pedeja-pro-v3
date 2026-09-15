CREATE TYPE "public"."refund_status" AS ENUM (
  'REFUND_REQUESTED',
  'REFUND_PROCESSING',
  'REFUNDED',
  'REFUND_FAILED',
  'REFUND_CANCELLED'
);

GRANT USAGE ON TYPE "public"."refund_status" TO "postgres";
