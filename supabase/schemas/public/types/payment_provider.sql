CREATE TYPE "public"."payment_provider" AS ENUM (
  'PAYSTACK',
  'FLUTTERWAVE',
  'PEACH',
  'MANUAL'
);

GRANT USAGE ON TYPE "public"."payment_provider" TO "postgres";
