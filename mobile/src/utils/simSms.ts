import { PermissionsAndroid, Platform } from 'react-native';
import * as SMS from 'expo-sms';
// Native module — available after EAS build (not in Expo Go)
let SilentSmsNative: { sendSMS: (p: string, m: string) => Promise<void>; checkPermission: () => Promise<boolean> } | null = null;
try {
  const { SilentSmsNative: mod } = require('silent-sms/src/index');
  SilentSmsNative = mod;
} catch {}


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
 * Send SMS silently using native Android SmsManager (no compose dialog).
 * Falls back to expo-sms compose if native module unavailable.
 */
export async function sendSimSms(phone: string, message: string): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const cleanPhone = phone.replace(/\s+/g, '');

  // 1️⃣ Try native silent SMS (no UI needed)
  if (SilentSmsNative) {
    try {
      const hasPermission = await SilentSmsNative.checkPermission();
      if (hasPermission) {
        await SilentSmsNative.sendSMS(cleanPhone, message);
        return true;
      }
    } catch (e) {
      console.log('[SilentSMS] native error, fallback:', e);
    }
  }

  // 2️⃣ Fallback: expo-sms compose (one-tap required)
  try {
    const available = await SMS.isAvailableAsync();
    if (available) {
      await SMS.sendSMSAsync([cleanPhone], message);
      return true;
    }
  } catch (e) {
    console.log('[SilentSMS] expo-sms error:', e);
  }
  return false;
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
