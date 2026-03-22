import * as SMS from 'expo-sms';

/**
 * Sends an SMS using the phone's native SIM card via expo-sms.
 * On Android: Opens the SMS compose screen pre-filled (user taps Send once).
 * Uses the device's own SIM card tariff — no external API needed.
 */
export async function sendSimSms(phone: string, message: string): Promise<boolean> {
  try {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) return false;

    const cleanPhone = phone.replace(/\s/g, '').replace(/^\+998/, '998');
    const { result } = await SMS.sendSMSAsync([cleanPhone], message);
    return result === 'sent' || result === 'unknown'; // 'unknown' = Android (always returns unknown)
  } catch (e) {
    console.log('SIM SMS error:', e);
    return false;
  }
}

/**
 * Formats a sale receipt SMS message.
 */
export function formatSalesSmsText(
  customerName: string,
  total: number,
  paid: number,
  debt: number,
  totalDebt: number
): string {
  const fmt = (n: number) => n.toLocaleString('uz-UZ');
  let msg = `Hurmatli ${customerName}!\n`;
  msg += `Sotib olgan summangiz: ${fmt(total)} so'm\n`;
  if (paid > 0) msg += `To'langan: ${fmt(paid)} so'm\n`;
  if (debt > 0) msg += `Qarz: ${fmt(debt)} so'm\n`;
  if (totalDebt > 0) msg += `Umumiy qarzingiz: ${fmt(totalDebt)} so'm\n`;
  msg += `Kael Savdo`;
  return msg;
}
