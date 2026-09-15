CREATE TYPE "public"."assignment_status" AS ENUM (
  'PROPOSED',
  'ASSIGNED',
  'ACCEPTED',
  'REJECTED',
  'REVOKED'
);

GRANT USAGE ON TYPE "public"."assignment_status" TO "postgres";
