CREATE TYPE "public"."staff_role" AS ENUM (
  'SUPPORT',
  'DISPATCHER',
  'OPERATIONS',
  'FINANCE',
  'RISK',
  'ADMIN',
  'SUPER_ADMIN'
);

GRANT USAGE ON TYPE "public"."staff_role" TO "postgres";
