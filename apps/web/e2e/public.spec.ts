import { test, expect } from '@playwright/test';

test.describe('public pages', () => {
  test('homepage redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page renders the sign-in form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with passkey/i })).toBeVisible();
    await expect(page.getByText(/no account/i)).toBeVisible();
  });

  test('login page links to /register', async ({ page }) => {
    await page.goto('/login');
    await page.getByText(/create one/i).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('register page renders step 1 (name + email + phone)', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/phone/i)).toBeVisible();
  });

  test('chores page redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/chores');
    await expect(page).toHaveURL(/\/login/);
  });

  test('rules page redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/rules');
    await expect(page).toHaveURL(/\/login/);
  });

  test('profile page redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });

  test('page title is Chore Wheel', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Chore Wheel/i);
  });
});
