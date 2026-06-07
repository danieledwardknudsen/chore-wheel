import type { NotificationSink } from '@chore-wheel/domain';
import type { Chore, User } from '@chore-wheel/domain';

type TwilioConfig = {
  accountSid: string;
  authToken: string;
  fromNumber: string;
};

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const buildMessage = (
  user: User,
  assignedChores: Chore[],
  unassignedChores: Chore[],
  websiteUrl: string,
): string => {
  const lines: string[] = [`[Chore Wheel] Hi ${user.name},`];

  if (assignedChores.length > 0) {
    lines.push(`Your chores:`);
    for (const chore of assignedChores) {
      lines.push(`• ${chore.title} (due ${formatDate(chore.dueDate)})`);
    }
  }

  if (unassignedChores.length > 0) {
    lines.push(`Unassigned: ${unassignedChores.map((c) => c.title).join(', ')}`);
  }

  if (websiteUrl) {
    lines.push(websiteUrl);
  }

  return lines.join('\n');
};

export class TwilioNotificationSink implements NotificationSink {
  private readonly config: TwilioConfig;

  constructor(config: TwilioConfig) {
    this.config = config;
  }

  async sendDailySummary(
    user: User,
    assignedChores: Chore[],
    unassignedChores: Chore[],
    websiteUrl: string,
  ): Promise<void> {
    if (assignedChores.length === 0 && unassignedChores.length === 0) {
      return;
    }

    const message = buildMessage(user, assignedChores, unassignedChores, websiteUrl);
    const { accountSid, authToken, fromNumber } = this.config;

    const body = new URLSearchParams({
      To: user.phone,
      From: fromNumber,
      Body: message,
    });

    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
  }
}

export const createTwilioNotificationSink = (): TwilioNotificationSink => {
  const accountSid = process.env['TWILIO_ACCOUNT_SID'];
  const authToken = process.env['TWILIO_AUTH_TOKEN'];
  const fromNumber = process.env['TWILIO_PHONE_NUMBER'];

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.',
    );
  }

  return new TwilioNotificationSink({ accountSid, authToken, fromNumber });
};
