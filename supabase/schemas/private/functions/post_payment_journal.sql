CREATE OR REPLACE FUNCTION private.post_payment_journal (
  p_payment_id uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_payment public.payments%rowtype;
  v_journal_id uuid;
  v_cash_account uuid;
  v_receivable_account uuid;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
  if v_payment.status <> 'SUCCEEDED' then raise exception 'PAYMENT_NOT_SUCCEEDED'; end if;
  select id into v_cash_account from public.ledger_accounts where account_code='1000' and active for update;
  select id into v_receivable_account from public.ledger_accounts where account_code='1100' and active for update;
  if v_cash_account is null or v_receivable_account is null then raise exception 'CORE_LEDGER_ACCOUNTS_NOT_CONFIGURED'; end if;

  insert into public.ledger_journals(journal_type,currency_code,reference,description,payment_id)
  values('PAYMENT',v_payment.currency_code,'PAYMENT:'||p_payment_id,'Payment received',p_payment_id)
  on conflict (payment_id,journal_type) do nothing returning id into v_journal_id;
  if v_journal_id is null then
    select id into v_journal_id from public.ledger_journals where payment_id=p_payment_id and journal_type='PAYMENT';
    return v_journal_id;
  end if;

  insert into public.ledger_journal_lines(journal_id,account_id,debit_amount,description)
  values(v_journal_id,v_cash_account,v_payment.amount,'Payment settlement asset');
  insert into public.ledger_journal_lines(journal_id,account_id,credit_amount,description)
  values(v_journal_id,v_receivable_account,v_payment.amount,'Customer receivable cleared');
  return v_journal_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."post_payment_journal"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "private"."post_payment_journal"(uuid) FROM PUBLIC;
