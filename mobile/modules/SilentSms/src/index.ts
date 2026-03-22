import { requireNativeModule } from 'expo-modules-core';

interface SilentSmsModule {
  sendSMS: (phone: string, message: string) => Promise<void>;
  checkPermission: () => Promise<boolean>;
}

// This native module is only available on Android
const SilentSmsNative: SilentSmsModule | null = (() => {
  try {
    return requireNativeModule<SilentSmsModule>('SilentSms');
  } catch {
    return null;
  }
})();

export { SilentSmsNative };
