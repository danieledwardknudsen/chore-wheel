import type { NotificationSink } from '../interfaces/notificationSink';
import type { Chore } from '../types/chore';
import type { User } from '../types/user';

export class ConsoleNotificationSink implements NotificationSink {
  async sendDailySummary(
    user: User,
    assignedChores: Chore[],
    unassignedChores: Chore[],
    websiteUrl: string,
  ): Promise<void> {
    console.log(
      `[Notification] ${user.name}: ${assignedChores.length} assigned, ${unassignedChores.length} unassigned â€” ${websiteUrl}`,
    );
  }
}
