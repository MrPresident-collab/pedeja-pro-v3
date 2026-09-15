CREATE TYPE "public"."vehicle_type" AS ENUM (
  'MOTORBIKE',
  'BICYCLE',
  'CAR',
  'VAN',
  'TRUCK'
);

GRANT USAGE ON TYPE "public"."vehicle_type" TO "postgres";
