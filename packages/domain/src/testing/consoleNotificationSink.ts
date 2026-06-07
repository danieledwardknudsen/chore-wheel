import type { NotificationSink } from '../interfaces/notificationSink.js';
import type { Chore } from '../types/chore.js';
import type { User } from '../types/user.js';

export class ConsoleNotificationSink implements NotificationSink {
  async sendDailySummary(
    user: User,
    assignedChores: Chore[],
    unassignedChores: Chore[],
    websiteUrl: string,
  ): Promise<void> {
    console.log(
      `[Notification] ${user.name}: ${assignedChores.length} assigned, ${unassignedChores.length} unassigned — ${websiteUrl}`,
    );
  }
}
