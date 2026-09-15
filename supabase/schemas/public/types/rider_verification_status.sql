CREATE TYPE "public"."rider_verification_status" AS ENUM (
  'PENDING',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED'
);

GRANT USAGE ON TYPE "public"."rider_verification_status" TO "postgres";
