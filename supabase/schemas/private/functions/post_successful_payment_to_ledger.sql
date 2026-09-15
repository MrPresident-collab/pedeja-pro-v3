CREATE OR REPLACE FUNCTION private.post_successful_payment_to_ledger (
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
  v_asset_account uuid;
  v_receivable_account uuid;
  v_existing_currency text;
begin
  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'PAYMENT_NOT_FOUND';
  end if;

  if v_payment.status <> 'SUCCEEDED' then
    raise exception 'PAYMENT_NOT_SUCCEEDED';
  end if;

  if v_payment.order_id is null and v_payment.enviar_shipment_id is null then
    raise exception 'PAYMENT_HAS_NO_BILLABLE_RESOURCE';
  end if;

  select id, currency_code into v_asset_account, v_existing_currency
  from public.ledger_accounts
  where account_code = '1000' and active
  for update;

  if v_asset_account is null then
    raise exception 'PAYMENT_SETTLEMENT_ACCOUNT_NOT_CONFIGURED';
  end if;

  if v_existing_currency <> v_payment.currency_code then
    raise exception 'PAYMENT_SETTLEMENT_ACCOUNT_CURRENCY_MISMATCH';
  end if;

  select id into v_receivable_account
  from public.ledger_accounts
  where account_code = '1100' and active and currency_code = v_payment.currency_code
  for update;

  if v_receivable_account is null then
    raise exception 'CUSTOMER_RECEIVABLE_ACCOUNT_NOT_CONFIGURED';
  end if;

  insert into public.ledger_journals(
    journal_type,currency_code,reference,description,payment_id
  ) values (
    'PAYMENT',v_payment.currency_code,'PAYMENT:'||p_payment_id,
    'Successful customer payment cleared against receivable',p_payment_id
  )
  on conflict (payment_id,journal_type) do nothing
  returning id into v_journal_id;

  if v_journal_id is not null then
    insert into public.ledger_journal_lines(
      journal_id,account_id,debit_amount,credit_amount,description
    ) values (
      v_journal_id,v_asset_account,v_payment.amount,0,
      'Payment settlement asset received'
    );

    insert into public.ledger_journal_lines(
      journal_id,account_id,debit_amount,credit_amount,description
    ) values (
      v_journal_id,v_receivable_account,0,v_payment.amount,
      'Customer receivable cleared by successful payment'
    );
  else
    select id into v_journal_id
    from public.ledger_journals
    where payment_id = p_payment_id and journal_type = 'PAYMENT';
  end if;

  if v_journal_id is null then
    raise exception 'PAYMENT_LEDGER_JOURNAL_NOT_FOUND';
  end if;

  return v_journal_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."post_successful_payment_to_ledger"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "private"."post_successful_payment_to_ledger"(uuid) FROM PUBLIC;
