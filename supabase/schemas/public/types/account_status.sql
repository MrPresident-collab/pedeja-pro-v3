CREATE TYPE "public"."account_status" AS ENUM (
  'ACTIVE',
  'SUSPENDED',
  'DEACTIVATED',
  'DELETED'
);

GRANT USAGE ON TYPE "public"."account_status" TO "postgres";
