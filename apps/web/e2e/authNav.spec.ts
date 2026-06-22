import { test, expect, E2E_USER } from './fixtures';

test.describe('authenticated navbar + auth-page guards', () => {
  test('shows the user email and a sign-out button, hides login/register', async ({
    authedPage: page,
  }) => {
    await page.goto('/chores');

    await expect(page.getByText(E2E_USER.email)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /login/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /register/i })).toHaveCount(0);
  });

  test('highlights the active nav link', async ({ authedPage: page }) => {
    await page.goto('/chores');
    await expect(page.getByRole('link', { name: 'chores' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('link', { name: 'rules' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );

    await page.goto('/rules');
    await expect(page.getByRole('link', { name: 'rules' })).toHaveAttribute('aria-current', 'page');
  });

  test('redirects signed-in users away from /login and /register', async ({ authedPage: page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/chores/);

    await page.goto('/register');
    await expect(page).toHaveURL(/\/chores/);
  });

  test('sign out returns to /login and re-protects routes', async ({ authedPage: page }) => {
    await page.goto('/chores');
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/chores');
    await expect(page).toHaveURL(/\/login/);
  });
});
