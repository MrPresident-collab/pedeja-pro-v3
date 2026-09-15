CREATE OR REPLACE FUNCTION private.validate_ledger_journal_balance()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_journal_id uuid;
  v_debits numeric(14,2);
  v_credits numeric(14,2);
  v_line_count integer;
begin
  v_journal_id := case when tg_op = 'DELETE' then old.journal_id else new.journal_id end;
  select count(*), coalesce(sum(debit_amount),0), coalesce(sum(credit_amount),0)
    into v_line_count, v_debits, v_credits
  from public.ledger_journal_lines where journal_id = v_journal_id;
  if v_line_count < 2 or v_debits <> v_credits then raise exception 'UNBALANCED_LEDGER_JOURNAL'; end if;
  return null;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."validate_ledger_journal_balance"() TO "postgres";

REVOKE ALL ON FUNCTION "private"."validate_ledger_journal_balance"() FROM PUBLIC;
