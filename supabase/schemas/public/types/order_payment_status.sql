CREATE TYPE "public"."order_payment_status" AS ENUM (
  'UNPAID',
  'PENDING',
  'PAID',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
  'PAYMENT_FAILED'
);

GRANT USAGE ON TYPE "public"."order_payment_status" TO "postgres";
