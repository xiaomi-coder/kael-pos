import { PermissionsAndroid, Platform } from 'react-native';
import * as SMS from 'expo-sms';

/**
 * Request SEND_SMS permission from the user (Android only).
 * Call this once on app startup from AppNavigation.
 */
export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
      {
        title: 'SMS yuborish huquqi',
        message: 'Ilova mijozlarga avtomatik SMS yuborish uchun bu huquqni talab qiladi.',
        buttonPositive: 'Ruxsat berish',
        buttonNegative: 'Rad etish',
      }
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/**
 * Send SMS using expo-sms (uses device's SIM card).
 * On Android: sends via native SMS compose UI (one tap from user).
 */
export async function sendSimSms(phone: string, message: string): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const available = await SMS.isAvailableAsync();
    if (!available) return false;
    const cleanPhone = phone.replace(/\s+/g, '');
    const { result } = await SMS.sendSMSAsync([cleanPhone], message);
    // On Android, result is always 'unknown' — treat as success
    return result !== 'cancelled';
  } catch (e) {
    console.log('[SimSMS] error:', e);
    return false;
  }
}

/**
 * Format sale receipt SMS.
 * @param companyName - from smsSignature in settings (e.g. "Mirzo Sement")
 */
export function formatSalesSmsText(
  customerName: string,
  total: number,
  paid: number,
  debt: number,
  totalDebt: number,
  companyName: string = 'Do\'koningiz'
): string {
  const f = (n: number) => n.toLocaleString('uz-UZ');
  let msg = `Hurmatli ${customerName}!\n`;
  msg += `Sotib olgan summa: ${f(total)} so'm`;
  if (paid > 0 && debt > 0) {
    msg += `\nTo'langan: ${f(paid)} so'm`;
    msg += `\nNasiya: ${f(debt)} so'm`;
  }
  if (totalDebt > 0) {
    msg += `\nUmumiy qarz: ${f(totalDebt)} so'm`;
  }
  msg += `\n${companyName}`;
  return msg;
}
