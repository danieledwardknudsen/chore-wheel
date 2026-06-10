import { test as base, expect, type Page } from '@playwright/test';
import { truncateTables } from './helpers/db';
import { installVirtualAuthenticator } from './helpers/webauthn';

export { expect };

// Single source of truth for the canonical e2e account.
export const E2E_USER = { name: 'E2E User', email: 'e2e@test.com' };

// Drives the register UI to completion (lands logged-in on /chores). Requires a
// virtual authenticator to already be installed on the context.
export const registerUser = async (page: Page, user = E2E_USER) => {
  await page.goto('/register');
  await page.getByLabel('Name').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Create Passkey' }).click();
  await page.waitForURL('**/chores', { timeout: 10_000 });
};

type Fixtures = {
  cleanDb: void;
  authedPage: Page;
};

export const test = base.extend<Fixtures>({
  cleanDb: async ({}, use) => {
    await truncateTables();
    await use();
  },

  authedPage: async ({ page, context }, use) => {
    await truncateTables();
    await installVirtualAuthenticator(context, page);
    await registerUser(page);
    await use(page);
  },
});
