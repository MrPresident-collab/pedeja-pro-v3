CREATE TYPE "public"."rbac_scope_type" AS ENUM (
  'GLOBAL',
  'DEPARTMENT',
  'BUSINESS',
  'DELIVERY',
  'SELF'
);

GRANT USAGE ON TYPE "public"."rbac_scope_type" TO "postgres";
