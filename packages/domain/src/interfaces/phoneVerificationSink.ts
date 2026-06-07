export interface PhoneVerificationSink {
  sendVerificationCode(phone: string, code: string): Promise<void>;
}
