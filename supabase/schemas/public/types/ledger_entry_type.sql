CREATE TYPE "public"."ledger_entry_type" AS ENUM (
  'CHARGE',
  'PAYMENT',
  'REFUND',
  'FEE',
  'PAYOUT',
  'ADJUSTMENT',
  'REVERSAL'
);

GRANT USAGE ON TYPE "public"."ledger_entry_type" TO "postgres";
