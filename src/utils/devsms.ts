// DevSMS.uz integration — routed through Supabase Edge Function to avoid CORS
import { supabase } from '../lib/supabase';

export async function sendDevSMS(apiToken: string, phone: string, message: string) {
  if (!apiToken || !phone) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ phone, message, apiToken }),
    });
  } catch (e) {
    console.error('DevSMS error:', e);
  }
}

// Build checkout SMS text
export function buildSmsText(
  custName: string,
  items: { productName: string; qty: number; total: number }[],
  cartTotal: number,
  paidAmt: number,
  debtAmt: number,
  signature: string
): string {
  let itemsText = '';
  if (items.length === 1) {
    itemsText = `Mahsulot: ${items[0].productName} x${items[0].qty}`;
  } else {
    itemsText = items.map(i => `${i.productName} x${i.qty}`).join(', ');
  }

  let payLine = `Naqd: ${fmt(paidAmt)} so'm`;
  if (debtAmt > 0) payLine += `  Qarz: ${fmt(debtAmt)} so'm`;

  return `Xarid uchun rahmat! ${custName}\n${itemsText}\nJami: ${fmt(cartTotal)} so'm\n${payLine}\n${signature}`;
}

function fmt(n: number) {
  return n.toLocaleString('uz-UZ');
}
