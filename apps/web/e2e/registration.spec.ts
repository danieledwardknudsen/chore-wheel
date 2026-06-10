import { test, expect, registerUser } from './fixtures';
import { installVirtualAuthenticator } from './helpers/webauthn';

test.describe('registration', () => {
  test('shows validation error when fields are empty', async ({ page, cleanDb: _ }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText(/name and email are required/i)).toBeVisible();
  });

  test('registers a new user and redirects to /chores', async ({ page, context, cleanDb: _ }) => {
    await installVirtualAuthenticator(context, page);

    await page.goto('/register');
    await page.getByLabel('Name').fill('Alice');
    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Create Passkey' }).click();

    await expect(page).toHaveURL(/\/chores/, { timeout: 10_000 });
  });

  test('shows error for duplicate email', async ({ page, context, cleanDb: _ }) => {
    await installVirtualAuthenticator(context, page);
    await registerUser(page, { name: 'Alice', email: 'duplicate@example.com' });

    // Second attempt with the same email is rejected at registration/start
    // (409) before any passkey ceremony, so no authenticator is needed here.
    const page2 = await context.newPage();
    await page2.goto('/register');
    await page2.getByLabel('Name').fill('Bob');
    await page2.getByLabel('Email').fill('duplicate@example.com');
    await page2.getByRole('button', { name: 'Continue' }).click();
    await page2.getByRole('button', { name: 'Create Passkey' }).click();

    await expect(page2.getByText(/already registered/i)).toBeVisible({ timeout: 5_000 });
  });

  test('back button returns to details step with fields preserved', async ({
    page,
    cleanDb: _,
  }) => {
    await page.goto('/register');
    await page.getByLabel('Name').fill('Alice');
    await page.getByLabel('Email').fill('alice@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Back' }).click();

    await expect(page.getByLabel('Name')).toHaveValue('Alice');
    await expect(page.getByLabel('Email')).toHaveValue('alice@example.com');
  });
});
