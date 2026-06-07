import type { Chore } from '../types/chore.js';
import type { User } from '../types/user.js';

export interface NotificationSink {
  sendDailySummary(
    user: User,
    assignedChores: Chore[],
    unassignedChores: Chore[],
    websiteUrl: string,
  ): Promise<void>;
}
