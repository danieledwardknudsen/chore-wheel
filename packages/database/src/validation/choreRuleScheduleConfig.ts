import { z } from 'zod';

const oneOffScheduleConfigSchema = z.object({
  type: z.literal('one_off'),
  date: z.string().date(),
});

const recurringScheduleConfigSchema = z.object({
  type: z.literal('recurring'),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
});

export const choreRuleScheduleConfigSchema = z.discriminatedUnion('type', [
  oneOffScheduleConfigSchema,
  recurringScheduleConfigSchema,
]);

export type ChoreRuleScheduleConfig = z.infer<typeof choreRuleScheduleConfigSchema>;
export type OneOffScheduleConfig = z.infer<typeof oneOffScheduleConfigSchema>;
export type RecurringScheduleConfig = z.infer<typeof recurringScheduleConfigSchema>;
