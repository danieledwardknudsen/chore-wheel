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

  test('deletes account and redirects to /login', async ({ authedPage: page }) => {
    await page.goto('/profile');

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete Account' }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
