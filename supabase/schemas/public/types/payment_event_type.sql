CREATE TYPE "public"."payment_event_type" AS ENUM (
  'CREATED',
  'PROVIDER_RECEIVED',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
  'REFUND_REQUESTED',
  'REFUNDED',
  'REFUND_FAILED'
);

GRANT USAGE ON TYPE "public"."payment_event_type" TO "postgres";
