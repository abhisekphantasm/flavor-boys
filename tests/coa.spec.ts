import { test, expect, Page } from '@playwright/test';

const COA_URL = 'http://31.97.61.59:6030/coa';
const AGE_GATE_BTN = 'button:has-text("Yes"), button:has-text("21+"), button:has-text("Confirm")';

async function dismissPopups(page: Page) {
  try {
    const ageBtn = page.locator(AGE_GATE_BTN).first();
    if (await ageBtn.isVisible({ timeout: 2000 })) {
      await ageBtn.click({ force: true }).catch(() => {});
    }
    await page.keyboard.press('Escape').catch(() => {});
  } catch (e) {}
}

async function screenshotAndAttach(page: Page, name: string) {
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const allurePath = `allure-results/${safeName}.png`;
  await page.screenshot({ path: allurePath });
  await test.info().attach(name, { path: allurePath, contentType: 'image/png' });
}

/**
 * Helper to get the href of a link, navigate to it directly, take a screenshot, and return.
 * This is the most robust method for handling links that might open in new tabs.
 */
async function verifyCoaLinkDirect(page: Page, productName: string, stepNumber: number) {
  await test.step(`${stepNumber}. ${productName} Link`, async () => {
    const escapedProductName = productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[–-]/g, '[–-]');
    const linkLocator = page.locator('a').filter({ hasText: new RegExp(escapedProductName, 'i') }).first();
    
    await expect(linkLocator).toBeVisible({ timeout: 20000 });
    await linkLocator.scrollIntoViewIfNeeded();

    // Get the href attribute
    const href = await linkLocator.getAttribute('href');
    if (!href) throw new Error(`Could not find href for ${productName}`);
    
    // Resolve relative URLs if necessary
    const targetUrl = href.startsWith('http') ? href : new URL(href, page.url()).toString();

    // Navigate to the lab report directly
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // Wait for the PDF/viewer to render
    
    // Take screenshot
    await screenshotAndAttach(page, `Step_${stepNumber}_${productName.replace(/\s+/g, '_')}`);
    
    // Navigate back to COA page
    await page.goto(COA_URL, { waitUntil: 'domcontentloaded' });
    await dismissPopups(page);
    await page.waitForTimeout(1000);
  });
}

test.describe('COA Page – Lab Results & All Links Navigation', () => {
  // Bypassing Age Gate using Cookies and Init Script
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([{
      name: 'flavorboys_age_verified',
      value: 'true',
      url: 'http://31.97.61.59:6030'
    }]);

    await page.addInitScript(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        [class*="AgeVerification"], [class*="modal"], [class*="popup"], [id*="age-gate"], .fixed, .backdrop-blur, [class*="z-[200]"] {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
          opacity: 0 !important;
        }
        body {
          overflow: auto !important;
          position: static !important;
        }
      `;
      document.documentElement.appendChild(style);
    });
  });

  test('Execute COA verification for all 16 links in strict order', async ({ page }) => {
    test.setTimeout(900000);

    // 1. Navigate to Website
    await test.step('1. Navigate to Website', async () => {
      await page.goto(COA_URL, { waitUntil: 'domcontentloaded' });
      await dismissPopups(page);
      await expect(page).toHaveURL(/coa/);
      const labsHeading = page.locator('h1, h2, h3').filter({ hasText: 'LABS' }).first();
      await expect(labsHeading).toBeVisible();
      await screenshotAndAttach(page, 'COA_Page_Loaded');
    });

    // 2. Verify COA Page Content
    await test.step('2. Verify COA Page Content', async () => {
      const labsHeading = page.locator('h1, h2, h3').filter({ hasText: 'LABS' }).first();
      await expect(labsHeading).toBeVisible();
      const aaaCard = page.locator('text=Flowers (AAA)').first();
      const aaCard = page.locator('text=Flowers (AA)').first();
      await expect(aaaCard).toBeVisible();
      await expect(aaCard).toBeVisible();
    });

    // Flowers (AAA) Card – All Links
    const aaaProducts = [
      "Death Breath - ( AAA )",
      "Dead Chill - ( AAA )",
      "Crunch Berries - ( AAA )",
      "Purple Skittles - ( AAA )",
      "Sweet Retreat - ( AAA )",
      "Slurricane - ( AAA )",
      "Sherbang - ( AAA )",
      "Caramel Pop Rock - ( AAA )"
    ];

    for (let i = 0; i < aaaProducts.length; i++) {
      await verifyCoaLinkDirect(page, aaaProducts[i], i + 3);
    }

    // Flowers (AA) Card – All Links
    const aaProducts = [
      "Rainbow Road - ( AA )",
      "Rainbow Forest - ( AA )",
      "Banana Blast - ( AA )",
      "Black Cherry Gelato - ( AA )",
      "Popping Cherry - ( AA )",
      "Pink Cotton Candy - ( AA )",
      "Cookie Crumble - ( AA )",
      "Cotton Candy Cloud - ( AA )"
    ];

    for (let i = 0; i < aaProducts.length; i++) {
      await verifyCoaLinkDirect(page, aaProducts[i], i + 11);
    }

    // 19. Verify COA Page Flow
    await test.step('19. Verify COA Page Flow', async () => {
      console.log('All AAA and AA product links verified successfully.');
      await screenshotAndAttach(page, 'COA_Verification_Complete');
    });
  });
});
