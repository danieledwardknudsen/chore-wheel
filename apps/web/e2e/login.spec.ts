import { test, expect, E2E_USER } from './fixtures';

test.describe('login', () => {
  test('logs in an existing user and redirects to /chores', async ({ authedPage: page }) => {
    // authedPage registered + authenticated. Clear the session cookie to simulate logout.
    await page.context().clearCookies();

    // The virtual authenticator is still in this context with the registered credential.
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(E2E_USER.email);
    await page.getByRole('button', { name: /sign in with passkey/i }).click();

    await expect(page).toHaveURL(/\/chores/, { timeout: 10_000 });
  });

  test('redirects unauthenticated users to /login', async ({ page, cleanDb: _ }) => {
    await page.goto('/chores');
    await expect(page).toHaveURL(/\/login/);
  });
});
