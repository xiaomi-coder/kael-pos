// DevSMS.uz API integration — 15 so'm/SMS via device
export async function sendDevSMS(apiToken: string, phone: string, message: string) {
  if (!apiToken || !phone) return;
  // Normalize phone: strip +, spaces → 998XXXXXXXXX format
  const normalized = phone.replace(/\D/g, '');
  if (normalized.length < 9) return;
  
  try {
    await fetch('https://devsms.uz/api/send_sms.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ phone: normalized, message }),
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
