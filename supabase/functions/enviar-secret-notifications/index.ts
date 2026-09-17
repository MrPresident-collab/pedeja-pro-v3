import { withSupabase } from 'npm:@supabase/server';

const TWILIO_MESSAGES_URL = (accountSid: string) =>
  `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret: ${name}`);
  return value;
}

function formBody(values: Record<string, string>): string {
  return new URLSearchParams(values).toString();
}

async function sendTwilioSms(phone: string, body: string): Promise<string> {
  const accountSid = required('TWILIO_ACCOUNT_SID');
  const apiKey = required('TWILIO_API_KEY');
  const apiSecret = required('TWILIO_API_SECRET');
  const from = required('TWILIO_SMS_FROM');

  const response = await fetch(TWILIO_MESSAGES_URL(accountSid), {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody({ To: phone, From: from, Body: body }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Twilio SMS failed: ${JSON.stringify(payload)}`);
  }
  return payload.sid as string;
}

async function sendTwilioWhatsApp(phone: string, body: string): Promise<string> {
  const accountSid = required('TWILIO_ACCOUNT_SID');
  const apiKey = required('TWILIO_API_KEY');
  const apiSecret = required('TWILIO_API_SECRET');
  const from = required('TWILIO_WHATSAPP_FROM');
  const contentSid = required('TWILIO_WHATSAPP_CONTENT_SID');

  const codeMatch = body.match(/\b(\d{5})\b/);
  if (!codeMatch) throw new Error('Secret code missing from notification body');

  const response = await fetch(TWILIO_MESSAGES_URL(accountSid), {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formBody({
      To: `whatsapp:${phone}`,
      From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
      ContentSid: contentSid,
      ContentVariables: JSON.stringify({ '1': codeMatch[1] }),
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Twilio WhatsApp failed: ${JSON.stringify(payload)}`);
  }
  return payload.sid as string;
}

async function sendNotification(row: {
  channel: string;
  recipient_phone: string;
  message_body: string;
}): Promise<string> {
  if (row.channel === 'SMS') {
    return sendTwilioSms(row.recipient_phone, row.message_body);
  }
  if (row.channel === 'WHATSAPP') {
    return sendTwilioWhatsApp(row.recipient_phone, row.message_body);
  }
  throw new Error(`Unsupported notification channel: ${row.channel}`);
}

export default {
  fetch: withSupabase({ auth: 'secret' }, async (_req, ctx) => {
    const limit = Math.min(Number(new URL(_req.url).searchParams.get('limit') ?? '10'), 50);

    const { data: rows, error: claimError } = await ctx.supabaseAdmin
      .rpc('claim_notification_outbox', { p_limit: limit });

    if (claimError) {
      return Response.json({ ok: false, error: claimError.message }, { status: 500 });
    }

    const results: Array<Record<string, unknown>> = [];

    for (const row of rows ?? []) {
      try {
        const providerMessageId = await sendNotification(row);
        await ctx.supabaseAdmin.rpc('complete_notification_outbox', {
          p_id: row.id,
          p_status: 'SENT',
          p_provider_message_id: providerMessageId,
          p_error: null,
        });
        results.push({ id: row.id, status: 'SENT', provider_message_id: providerMessageId });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const retryable = row.attempts < 5;

        await ctx.supabaseAdmin.rpc('complete_notification_outbox', {
          p_id: row.id,
          p_status: retryable ? 'QUEUED' : 'FAILED',
          p_provider_message_id: null,
          p_error: message,
        });

        results.push({ id: row.id, status: retryable ? 'QUEUED' : 'FAILED', error: message });
      }
    }

    return Response.json({ ok: true, processed: results.length, results });
  }),
};
