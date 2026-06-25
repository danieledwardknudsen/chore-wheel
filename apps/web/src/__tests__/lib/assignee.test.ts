import { describe, expect, it } from 'vitest';
import { formatAssigneeLabel } from '@/lib/assignee';

describe('formatAssigneeLabel', () => {
  it('returns @name when no emoji is set', () => {
    expect(formatAssigneeLabel('Alice', null)).toBe('@Alice');
  });

  it('returns @name when emoji is undefined', () => {
    expect(formatAssigneeLabel('Alice')).toBe('@Alice');
  });

  it('prefixes the emoji and a space before @name when set', () => {
    expect(formatAssigneeLabel('Alice', '🎉')).toBe('🎉 @Alice');
  });
});
