const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, message, apiToken } = await req.json();

    if (!phone || !message || !apiToken) {
      return new Response(JSON.stringify({ error: 'phone, message va apiToken kerak' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize phone number to 998XXXXXXXXX format
    const normalized = String(phone).replace(/\D/g, '');
    if (normalized.length < 9) {
      return new Response(JSON.stringify({ error: 'Telefon raqami noto\'g\'ri' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call DevSMS API from server side (no CORS restriction)
    const smsRes = await fetch('https://devsms.uz/api/send_sms.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ phone: normalized, message }),
    });

    const result = await smsRes.text();

    return new Response(JSON.stringify({ success: smsRes.ok, response: result }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server xatosi: ' + String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
