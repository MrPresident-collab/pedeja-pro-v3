CREATE TYPE "public"."order_status" AS ENUM (
  'DRAFT',
  'PENDING_PAYMENT',
  'PAID',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'ASSIGNED',
  'PICKED_UP',
  'DELIVERING',
  'DELIVERED',
  'CANCELLED',
  'FAILED'
);

GRANT USAGE ON TYPE "public"."order_status" TO "postgres";
