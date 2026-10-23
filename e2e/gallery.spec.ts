import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

// Chromium's fake camera stands in for a real one, so these tests run the actual
// Capacitor Camera web flow (the pwa-elements camera modal).
test.use({
  permissions: ['camera'],
  launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
});

const takePhoto = async (page: Page): Promise<void> => {
  await page.locator('ion-fab-button').click();
  await page.locator('pwa-camera .shutter').click();
  await page.locator('pwa-camera .accept-use').click();
};

const photo = (page: Page, position: number) => page.getByRole('button', { name: `Photo ${position}` });

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'Photos' }).click();
});

test('takes a photo and adds it to the gallery', async ({ page }) => {
  await takePhoto(page);

  await expect(photo(page, 1)).toBeVisible();
  await expect(photo(page, 2)).toHaveCount(0);
});

test('keeps photos after the app reloads', async ({ page }) => {
  await takePhoto(page);
  await expect(photo(page, 1)).toBeVisible();

  await page.reload();

  await expect(page.getByRole('img', { name: 'Photo 1' })).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
});

test('deletes a photo from the action sheet', async ({ page }) => {
  await takePhoto(page);
  await takePhoto(page);
  await expect(photo(page, 2)).toBeVisible();

  await photo(page, 1).click();
  await page.getByRole('button', { name: 'Delete' }).click();

  await expect(photo(page, 2)).toHaveCount(0);
  await expect(photo(page, 1)).toBeVisible();

  await page.reload();

  // Wait for the remaining photo to load from storage before checking the deleted one stayed gone.
  await expect(page.getByRole('img', { name: 'Photo 1' })).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  await expect(photo(page, 2)).toHaveCount(0);
});

test('adds a new photo after deleting one', async ({ page }) => {
  await takePhoto(page);
  await photo(page, 1).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(photo(page, 1)).toHaveCount(0);

  await takePhoto(page);

  await expect(photo(page, 1)).toBeVisible();
  await expect(photo(page, 2)).toHaveCount(0);

  await page.reload();

  // Wait for the saved photo to load from storage before checking it's the only one.
  await expect(page.getByRole('img', { name: 'Photo 1' })).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
  await expect(photo(page, 2)).toHaveCount(0);
});

test('keeps the photo when the action sheet is cancelled', async ({ page }) => {
  await takePhoto(page);
  await photo(page, 1).click();
  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.locator('ion-action-sheet')).toBeHidden();
  await expect(photo(page, 1)).toBeVisible();

  // The photo's actions open again after a cancel.
  await photo(page, 1).click();
  await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
});

test('shows a camera icon on the camera button', async ({ page }) => {
  // ion-icon draws its SVG in its shadow root, which Playwright's locators can see. Only match
  // the button's own icon, not the close icon ion-fab-button keeps in its shadow root.
  await expect(page.locator('ion-fab-button > ion-icon').locator('svg')).toBeVisible();
});
