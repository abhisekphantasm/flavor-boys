import { test, expect } from '@playwright/test';

const BASE_URL = 'http://31.97.61.59:6030';

test('Blog Page - Full Flow Test', async ({ page }) => {

  // ─── Helper: dismiss age gate if present ───────────────────────────────────
  async function dismissAgeGate() {
    const ageBtn = page.getByRole('button', { name: /Yes, I'm 21\+/i });
    try {
      const visible = await ageBtn.isVisible();
      if (!visible) {
        await ageBtn.waitFor({ state: 'visible', timeout: 2000 });
      }
      await page.waitForTimeout(500); 
      await ageBtn.click({ force: true });
      console.log("Age gate dismissed.");
      await page.waitForTimeout(500);
    } catch (e) {
      // Not found or already dismissed
    }
  }

  // ─── 1. Navigate to Blog & Take SS ──────────────────────────────────────────
  await page.goto(`${BASE_URL}/blog`);
  await page.waitForLoadState('networkidle');
  await dismissAgeGate();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/blog-01-page.png', fullPage: true });

  // ─── 2. Scroll down & open each blog ────────────────────────────────────────
  // Find blog cards or links
  const blogLinks = page.locator('a[href*="/blog/"]');
  const count = await blogLinks.count();
  console.log(`Found ${count} blog posts`);

  for (let i = 0; i < count; i++) {
    // Re-locate to avoid stale element
    const currentLink = page.locator('a[href*="/blog/"]').nth(i);
    await currentLink.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Check for buttons or forms in the blog preview section
    const previewSection = currentLink.locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "item") or position()<5]');
    const previewButtons = previewSection.locator('button, input[type="submit"]');
    const btnCount = await previewButtons.count();
    if (btnCount > 0) {
      await previewButtons.first().hover();
      await page.screenshot({ path: `test-results/blog-preview-btn-hover-${i}.png` });
    }

    // Click to open blog
    await currentLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `test-results/blog-post-${i}.png`, fullPage: true });

    // While in the blog, check if there are any buttons or forms
    const forms = page.locator('form');
    const formCount = await forms.count();
    if (formCount > 0) {
        const firstForm = forms.first();
        const inputs = firstForm.locator('input:not([type="hidden"]), textarea');
        if (await inputs.count() > 0) {
            await inputs.first().fill('Dummy comment or mail');
            await page.screenshot({ path: `test-results/blog-post-${i}-form-filled.png` });
            const submitBtn = firstForm.locator('button, input[type="submit"]').first();
            if (await submitBtn.isVisible()) {
                // We won't submit to avoid spamming, but we'll show it
                await submitBtn.hover();
                await page.screenshot({ path: `test-results/blog-post-${i}-submit-hover.png` });
            }
        }
    }

    // Navigate back to blog list
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  }

  // ─── 3. Final: Navigate back to Home ────────────────────────────────────────
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'test-results/blog-final-home.png', fullPage: true });
});
