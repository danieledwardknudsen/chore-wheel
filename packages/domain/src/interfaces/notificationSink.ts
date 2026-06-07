import type { Chore } from '../types/chore';
import type { User } from '../types/user';

export interface NotificationSink {
  sendDailySummary(
    user: User,
    assignedChores: Chore[],
    unassignedChores: Chore[],
    websiteUrl: string,
  ): Promise<void>;
}
