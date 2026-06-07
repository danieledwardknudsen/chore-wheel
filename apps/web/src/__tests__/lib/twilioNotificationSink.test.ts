import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TwilioNotificationSink } from '@/lib/twilioNotificationSink';
import type { Chore } from '@chore-wheel/domain';
import type { User } from '@chore-wheel/domain';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
  phone: '+12065550001',
  optInTexts: true,
  optInEmails: false,
  ...overrides,
});

const makeChore = (overrides: Partial<Chore> = {}): Chore => ({
  id: 'chore-1',
  title: 'Wash dishes',
  status: 'incomplete',
  dueDate: new Date('2025-01-15'),
  assigneeId: 'user-1',
  choreRuleId: null,
  createdAt: new Date('2025-01-10'),
  ...overrides,
});

describe('TwilioNotificationSink', () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ sid: 'SM123' }) });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sends a POST to the Twilio messages API', async () => {
    const sink = new TwilioNotificationSink({
      accountSid: 'ACtest',
      authToken: 'token',
      fromNumber: '+15005550006',
    });

    await sink.sendDailySummary(makeUser(), [makeChore()], [], 'https://example.com');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.twilio.com/2010-04-01/Accounts/ACtest/Messages.json');
  });

  it('sends to the user phone number', async () => {
    const sink = new TwilioNotificationSink({
      accountSid: 'ACtest',
      authToken: 'token',
      fromNumber: '+15005550006',
    });

    await sink.sendDailySummary(makeUser({ phone: '+12065550001' }), [makeChore()], [], '');

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(init.body as string);
    expect(body.get('To')).toBe('+12065550001');
    expect(body.get('From')).toBe('+15005550006');
  });

  it('uses Basic auth with base64-encoded credentials', async () => {
    const sink = new TwilioNotificationSink({
      accountSid: 'ACtest',
      authToken: 'mytoken',
      fromNumber: '+15005550006',
    });

    await sink.sendDailySummary(makeUser(), [makeChore()], [], '');

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    const expected = `Basic ${btoa('ACtest:mytoken')}`;
    expect(headers['Authorization']).toBe(expected);
  });

  it('includes assigned chore titles in message body', async () => {
    const sink = new TwilioNotificationSink({
      accountSid: 'ACtest',
      authToken: 'token',
      fromNumber: '+15005550006',
    });

    await sink.sendDailySummary(
      makeUser(),
      [makeChore({ title: 'Wash dishes' }), makeChore({ id: 'chore-2', title: 'Take out trash' })],
      [],
      '',
    );

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(init.body as string);
    const message = body.get('Body') ?? '';
    expect(message).toContain('Wash dishes');
    expect(message).toContain('Take out trash');
  });

  it('includes unassigned count when there are unassigned chores', async () => {
    const sink = new TwilioNotificationSink({
      accountSid: 'ACtest',
      authToken: 'token',
      fromNumber: '+15005550006',
    });

    await sink.sendDailySummary(makeUser(), [], [makeChore({ assigneeId: null })], '');

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(init.body as string);
    const message = body.get('Body') ?? '';
    expect(message.toLowerCase()).toMatch(/unassigned/);
  });

  it('does nothing when both lists are empty', async () => {
    const sink = new TwilioNotificationSink({
      accountSid: 'ACtest',
      authToken: 'token',
      fromNumber: '+15005550006',
    });

    await sink.sendDailySummary(makeUser(), [], [], '');

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
