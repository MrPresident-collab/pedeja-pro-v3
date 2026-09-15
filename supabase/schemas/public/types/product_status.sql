CREATE TYPE "public"."product_status" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'OUT_OF_STOCK',
  'INACTIVE',
  'ARCHIVED'
);

GRANT USAGE ON TYPE "public"."product_status" TO "postgres";
