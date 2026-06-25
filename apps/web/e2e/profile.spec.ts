import { test, expect } from './fixtures';

test.describe('profile', () => {
  test('updates display name', async ({ authedPage: page }) => {
    await page.goto('/profile');
    await page.getByLabel('Name').clear();
    await page.getByLabel('Name').fill('Updated Name');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Saved.')).toBeVisible({ timeout: 5_000 });

    // Reload and confirm persisted
    await page.reload();
    await expect(page.getByLabel('Name')).toHaveValue('Updated Name');
  });

  test('toggles email opt-in and persists', async ({ authedPage: page }) => {
    await page.goto('/profile');

    // The Toggle renders as a button whose accessible name includes [ON ]/[OFF].
    const toggle = page.getByRole('button', { name: /email reminders/i });
    const before = await toggle.textContent();
    await toggle.click();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Saved.')).toBeVisible({ timeout: 5_000 });

    await page.reload();
    const after = await page.getByRole('button', { name: /email reminders/i }).textContent();
    expect(after).not.toBe(before);
  });

  test('sets a profile emoji and persists it', async ({ authedPage: page }) => {
    await page.goto('/profile');
    await page.getByLabel('Emoji').fill('🎉');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Saved.')).toBeVisible({ timeout: 5_000 });

    await page.reload();
    await expect(page.getByLabel('Emoji')).toHaveValue('🎉');
  });

  test('shows the profile emoji next to the assignee name on the chores page', async ({
    authedPage: page,
  }) => {
    await page.goto('/profile');
    await page.getByLabel('Emoji').fill('🎉');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Saved.')).toBeVisible({ timeout: 5_000 });

    const me = (await (await page.request.get('/api/users/me')).json()) as { id: string };
    const today = new Date().toISOString().slice(0, 10);
    const ruleRes = await page.request.post('/api/chore-rules', {
      data: {
        title: 'Water the plants',
        assigneeRuleType: 'static',
        staticAssigneeId: me.id,
        scheduleType: 'one_off',
        scheduleConfig: { type: 'one_off', date: today },
        assignees: [{ userId: me.id, weight: 1, position: 0 }],
      },
    });
    expect(ruleRes.ok()).toBeTruthy();

    await page.goto('/chores');
    await expect(page.getByText(/🎉 @E2E User/)).toBeVisible();

    await page.getByText('Water the plants').click();
    await expect(page).toHaveURL(/\/chores\/[0-9a-f-]+/);
    await expect(page.getByText(/🎉 @E2E User/)).toBeVisible();
  });

  test('deletes account and redirects to /login', async ({ authedPage: page }) => {
    await page.goto('/profile');

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete Account' }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
