package expo.modules.silentsms

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SilentSmsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SilentSms")

    // Check if SEND_SMS permission is granted
    AsyncFunction("checkPermission") {
      val ctx = appContext.reactContext ?: return@AsyncFunction false
      ctx.checkSelfPermission(Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED
    }

    // Send SMS silently using native Android SmsManager
    AsyncFunction("sendSMS") { phone: String, message: String ->
      val ctx = appContext.reactContext
        ?: throw Exception("Context not available")

      if (ctx.checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
        throw Exception("SEND_SMS permission not granted")
      }

      val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        ctx.getSystemService(SmsManager::class.java)
      } else {
        @Suppress("DEPRECATION")
        SmsManager.getDefault()
      }

      // Split into multiple parts if message > 160 chars
      val parts = smsManager.divideMessage(message)
      smsManager.sendMultipartTextMessage(phone, null, parts, null, null)
    }
  }
}
