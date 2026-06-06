import { z } from 'zod';

export const assigneeRuleTypeSchema = z.enum(['static', 'round_robin', 'free_for_all']);

export type AssigneeRuleType = z.infer<typeof assigneeRuleTypeSchema>;
