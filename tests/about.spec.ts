import { test, expect } from '@playwright/test';

const BASE_URL = 'http://31.97.61.59:6030';

test('About Page - Full Flow Test', async ({ page }) => {

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

  // ─── 1. Navigate to About & Take SS ─────────────────────────────────────────
  await page.goto(`${BASE_URL}/about-us`);
  await page.waitForLoadState('networkidle');
  await dismissAgeGate();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/about-01-page.png', fullPage: true });

  // ─── 2. Scroll & Hover over specific vibes ─────────────────────────────────
  const vibes = [
    "No limits, No rules",
    "Real flavor, Real vibe",
    "Rebel spirit"
  ];

  for (const vibe of vibes) {
    const vibeEl = page.locator('div, span, p, h1, h2, h3, h4').filter({ hasText: new RegExp(vibe, 'i') }).first();
    if (await vibeEl.isVisible({ timeout: 5000 }).catch(() => false)) {
      await vibeEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await vibeEl.hover();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `test-results/about-hover-${vibe.replace(/ /g, '_')}.png` });
    }
  }

  // ─── 3. Check for buttons or forms ──────────────────────────────────────────
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  let scrolled = 0;
  const viewportHeight = 945;
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);

  while (scrolled < pageHeight) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'smooth' }), scrolled);
    await page.waitForTimeout(1000);

    // Look for buttons or forms in current view
    const buttons = page.locator('button, a.button, a[role="button"]').filter({ hasText: /./ });
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
        const btn = buttons.nth(i);
        if (await btn.isVisible()) {
            const box = await btn.boundingBox();
            if (box && box.y >= 0 && box.y < viewportHeight) {
                await btn.hover();
                await page.screenshot({ path: `test-results/about-btn-hover-${scrolled}-${i}.png` });
                
                // If it's a contact or shop button, we might click it as requested
                if (await btn.innerText().then(t => /shop|contact|join|more/i.test(t))) {
                    await btn.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(1000);
                    await page.screenshot({ path: `test-results/about-btn-clicked-${scrolled}-${i}.png`, fullPage: true });
                    await page.goBack();
                    await page.waitForLoadState('networkidle');
                    await page.evaluate((top) => window.scrollTo({ top }), scrolled);
                    await page.waitForTimeout(500);
                }
            }
        }
    }
    
    scrolled += viewportHeight;
  }

  // ─── 4. Final: Navigate back to Home ────────────────────────────────────────
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'test-results/about-final-home.png', fullPage: true });
});
