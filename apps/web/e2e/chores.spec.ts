import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

// Creates a rule assigned to the current user, runs the assignment job, and
// returns once the chore exists. Returns the current user's id.
const seedAssignedChore = async (page: Page, title: string) => {
  const me = (await (await page.request.get('/api/users/me')).json()) as { id: string };

  const ruleRes = await page.request.post('/api/chore-rules', {
    data: {
      title,
      assigneeRuleType: 'static',
      staticAssigneeId: me.id,
      scheduleType: 'recurring',
      scheduleConfig: { type: 'recurring', frequency: 'daily' },
      assignees: [{ userId: me.id, weight: 1, position: 0 }],
    },
  });
  expect(ruleRes.ok()).toBeTruthy();

  const jobRes = await page.request.post('/api/jobs/run?disableMessages=true');
  expect(jobRes.ok()).toBeTruthy();
  const job = (await jobRes.json()) as { createdCount: number };
  expect(job.createdCount).toBeGreaterThanOrEqual(1);

  return me.id;
};

test.describe('chores', () => {
  test('chore created by the job appears in the list', async ({ authedPage: page }) => {
    await seedAssignedChore(page, 'Wash dishes');

    await page.goto('/chores');
    await expect(page.getByText('Wash dishes')).toBeVisible();
  });

  test('marks a chore as complete', async ({ authedPage: page }) => {
    await seedAssignedChore(page, 'Vacuum floors');

    await page.goto('/chores');
    await page.getByText('Vacuum floors').click();
    await expect(page).toHaveURL(/\/chores\/[0-9a-f-]+/);

    await page.getByRole('button', { name: 'Complete' }).click();

    // After completion the chore shows the DONE badge.
    await expect(page.getByText(/done/i)).toBeVisible({ timeout: 5_000 });
  });
});
