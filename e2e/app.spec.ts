import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// Ionic keeps tab pages it has shown in the DOM (hidden), so only look at visible elements.
const visibleTitle = (page: Page) => page.locator('ion-title').filter({ visible: true }).first();
// The outgoing page can still be visible mid-transition, so match the content by its page name.
const visibleContent = (page: Page, pageName: string) =>
  page.locator('ion-content').filter({ visible: true, hasText: pageName });

const tabs = {
  tab1: { name: 'Tab 1', url: /\/tab1$/, title: 'Tab 1' },
  photos: { name: 'Photos', url: /\/tab2$/, title: 'Photo Gallery' },
  tab3: { name: 'Tab 3', url: /\/tab3$/, title: 'Tab 3' },
};

test('shows the first tab on load', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(tabs.tab1.url);
  await expect(visibleTitle(page)).toHaveText(tabs.tab1.title);
  await expect(page.getByRole('tab', { name: tabs.tab1.name })).toHaveAttribute('aria-selected', 'true');
});

test('switches tabs from the tab bar', async ({ page }) => {
  await page.goto('/');

  for (const tab of [tabs.photos, tabs.tab3, tabs.tab1]) {
    await page.getByRole('tab', { name: tab.name }).click();

    await expect(page).toHaveURL(tab.url);
    await expect(visibleTitle(page)).toHaveText(tab.title);
    await expect(page.getByRole('tab', { name: tab.name })).toHaveAttribute('aria-selected', 'true');
  }
});

test('shows an icon on each tab', async ({ page }) => {
  await page.goto('/');

  for (const tab of [tabs.tab1, tabs.photos, tabs.tab3]) {
    // ion-icon draws its SVG in its shadow root, which Playwright's locators can see.
    const tabButton = page.locator('ion-tab-button').filter({ hasText: tab.name });
    await expect(tabButton.locator('ion-icon svg')).toBeVisible();
  }
});

for (const tab of [
  { ...tabs.tab1, pageName: 'Tab 1 page' },
  { ...tabs.tab3, pageName: 'Tab 3 page' },
]) {
  test(`${tab.name} links to the Ionic UI components docs`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: tab.name }).click();
    await expect(page).toHaveURL(tab.url);

    const content = visibleContent(page, tab.pageName);
    await expect(content.getByText(tab.pageName, { exact: true })).toBeVisible();
    await expect(content).toContainText('Explore UI Components');

    const link = content.getByRole('link', { name: 'UI Components' });
    await expect(link).toHaveAttribute('href', 'https://ionicframework.com/docs/components');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
}
