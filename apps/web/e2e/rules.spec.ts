import { test, expect } from './fixtures';

const dailyRule = (title: string) => ({
  title,
  assigneeRuleType: 'free_for_all',
  scheduleType: 'recurring',
  scheduleConfig: { type: 'recurring', frequency: 'daily' },
  assignees: [],
});

test.describe('rules', () => {
  test('creates a new daily rule and shows it in the list', async ({ authedPage: page }) => {
    await page.goto('/rules/new');

    await page.getByLabel('Title').fill('Take out trash');
    // Schedule defaults to one-off; switch to recurring (frequency defaults to daily).
    await page.getByRole('radio', { name: /recurring/i }).check();

    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL('**/rules', { timeout: 5_000 });

    await expect(page.getByText('Take out trash')).toBeVisible();
  });

  test('edits an existing rule title', async ({ authedPage: page }) => {
    // Create a rule first via API to keep the test fast
    await page.request.post('/api/chore-rules', { data: dailyRule('Old Title') });

    await page.goto('/rules');
    await page.getByText('Old Title').click();

    await page.getByLabel('Title').clear();
    await page.getByLabel('Title').fill('New Title');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForURL('**/rules', { timeout: 5_000 });

    await expect(page.getByText('New Title')).toBeVisible();
    await expect(page.getByText('Old Title')).not.toBeVisible();
  });

  test('deletes a rule', async ({ authedPage: page }) => {
    await page.request.post('/api/chore-rules', { data: dailyRule('Rule to Delete') });

    await page.goto('/rules');
    await page.getByText('Rule to Delete').click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.waitForURL('**/rules', { timeout: 5_000 });

    await expect(page.getByText('Rule to Delete')).not.toBeVisible();
  });
});
