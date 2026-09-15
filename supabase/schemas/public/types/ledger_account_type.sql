CREATE TYPE "public"."ledger_account_type" AS ENUM (
  'ASSET',
  'LIABILITY',
  'REVENUE',
  'EXPENSE',
  'EQUITY'
);

GRANT USAGE ON TYPE "public"."ledger_account_type" TO "postgres";
