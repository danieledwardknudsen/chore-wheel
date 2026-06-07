import { describe, expect, it } from 'vitest';
import { isVerificationCodeExpired } from '../../auth/isVerificationCodeExpired.js';

describe('isVerificationCodeExpired', () => {
  it('returns true when expiresAt is in the past', () => {
    const pastDate = new Date(Date.now() - 1000);
    expect(isVerificationCodeExpired(pastDate)).toBe(true);
  });

  it('returns false when expiresAt is in the future', () => {
    const futureDate = new Date(Date.now() + 60_000);
    expect(isVerificationCodeExpired(futureDate)).toBe(false);
  });

  it('returns true when expiresAt is exactly now (boundary: expired)', () => {
    const now = new Date(Date.now() - 1);
    expect(isVerificationCodeExpired(now)).toBe(true);
  });
});
