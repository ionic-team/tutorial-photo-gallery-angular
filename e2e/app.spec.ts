import { expect, test } from '@playwright/test';

test('shows the first tab on load', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('ion-content').getByText('Tab 1 page')).toBeVisible();
});

test('opens the photo gallery from the tab bar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Photos' }).click();

  await expect(page).toHaveURL(/\/tab2$/);
  await expect(page.locator('ion-title', { hasText: 'Photo Gallery' }).first()).toBeVisible();
});
