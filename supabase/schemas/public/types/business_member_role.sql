CREATE TYPE "public"."business_member_role" AS ENUM (
  'OWNER',
  'MANAGER',
  'STAFF'
);

GRANT USAGE ON TYPE "public"."business_member_role" TO "postgres";
