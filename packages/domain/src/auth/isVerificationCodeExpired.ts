export const isVerificationCodeExpired = (expiresAt: Date): boolean => {
  return expiresAt < new Date();
};
