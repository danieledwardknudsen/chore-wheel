import type { PhoneVerificationSink } from '../interfaces/phoneVerificationSink.js';

export class ConsolePhoneVerificationSink implements PhoneVerificationSink {
  async sendVerificationCode(phone: string, code: string): Promise<void> {
    console.log(`[PhoneVerification] Code for ${phone}: ${code}`);
  }
}
