import { describe, expect, it } from 'vitest';
import { generateVerificationCode } from '../../auth/generateVerificationCode.js';

describe('generateVerificationCode', () => {
  it('returns a 6-character string', () => {
    const code = generateVerificationCode();
    expect(code).toHaveLength(6);
  });

  it('returns only digits', () => {
    const code = generateVerificationCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('generates different codes on successive calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateVerificationCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
