import { test, expect } from './fixtures';

test.describe('responsive design', () => {
  test('navbar does not overflow viewport on mobile', async ({ authedPage: page }) => {
    // Set mobile viewport (375px is iPhone SE width)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/chores');

    // Check that no element overflows the viewport width
    const overflowCheck = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const htmlWidth = html.scrollWidth;
      const bodyWidth = body.scrollWidth;
      const viewportWidth = window.innerWidth;

      return {
        viewportWidth,
        htmlWidth,
        bodyWidth,
        htmlOverflows: htmlWidth > viewportWidth,
        bodyOverflows: bodyWidth > viewportWidth,
      };
    });

    expect(overflowCheck.htmlOverflows).toBe(false);
    expect(overflowCheck.bodyOverflows).toBe(false);
  });

  test('navbar is usable on mobile', async ({ authedPage: page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/chores');

    // Links should still be clickable on mobile
    await expect(page.getByRole('link', { name: /chores/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /rules/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /profile/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();

    // Logo should not be visible on mobile
    await expect(page.getByText('⚙ CHORE-WHEEL')).not.toBeVisible();
  });
});
