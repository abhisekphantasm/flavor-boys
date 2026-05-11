import { test, expect } from '@playwright/test';

const BASE_URL = 'http://31.97.61.59:6030';

test('Home Page - Full Flow Test', async ({ page }) => {
  test.setTimeout(180000); // 3 minutes timeout

  // ─── Helper: dismiss age gate if present ───────────────────────────────────
  async function dismissAgeGate() {
    const ageBtn = page.getByRole('button', { name: /Yes, I'm 21\+/i });
    try {
      // Check quickly if visible, otherwise wait only 2s
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

  // ─── 1. Navigate to Home & Take SS ─────────────────────────────────────────
  await page.goto(BASE_URL);
  await page.waitForLoadState('load');
  await dismissAgeGate();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/home-01-homepage.png', fullPage: true });

  // ─── 2. Header Section – Verify nav links ──────────────────────────────────
  await page.waitForTimeout(1000);
  const nav = page.locator('nav, header').first();
  await expect(nav).toBeVisible();
  await page.screenshot({ path: 'test-results/home-02-header.png' });

  // ── Our Products nav ────────────────────────────────────────────────────────
  await page.waitForTimeout(1000);
  const ourProductsNav = page.locator('nav a, header a').filter({ hasText: /our products/i }).first();
  await ourProductsNav.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/home-03-nav-our-products.png', fullPage: true });
  await page.goBack();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // ── Blog nav ────────────────────────────────────────────────────────────────
  const blogNav = page.locator('nav a, header a').filter({ hasText: /^blog$/i }).first();
  await blogNav.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/home-04-nav-blog.png', fullPage: true });
  await page.goBack();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // ── About nav ───────────────────────────────────────────────────────────────
  const aboutNav = page.locator('nav a, header a').filter({ hasText: /^about$/i }).first();
  await aboutNav.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/home-05-nav-about.png', fullPage: true });
  await page.goBack();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // ── FAQ nav ─────────────────────────────────────────────────────────────────
  const faqNav = page.locator('nav a, header a').filter({ hasText: /^faq$/i }).first();
  await faqNav.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/home-06-nav-faq.png', fullPage: true });
  await page.goBack();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // ── COA nav ─────────────────────────────────────────────────────────────────
  const coaNav = page.locator('nav a, header a').filter({ hasText: /^coa$/i }).first();
  await coaNav.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/home-07-nav-coa.png', fullPage: true });
  await page.goBack();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // ── Contact Us nav ───────────────────────────────────────────────────────────
  const contactNav = page.locator('nav a, header a').filter({ hasText: /contact/i }).first();
  await contactNav.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/home-08-nav-contact.png', fullPage: true });
  await page.goBack();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // ─── 3. Scroll down & check Explore/View more buttons ──────────────────────
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'smooth' }));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/home-09-scrolled-600.png', fullPage: false });

  const exploreBtn = page.locator('a, button').filter({ hasText: /explore more|view more|shop now|view all/i }).first();
  const exploreBtnVisible = await exploreBtn.isVisible({ timeout: 3000 }).catch(() => false);
  if (exploreBtnVisible) {
    await page.waitForTimeout(1000);
    await exploreBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/home-10-explore-more-clicked.png', fullPage: true });
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }

  // ─── 4. Hover over Quality section ─────────────────────────────────────────
  await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'smooth' }));
  await page.waitForTimeout(1000);

  const qualitySection = page.locator('section, div').filter({ hasText: /quality/i }).first();
  const qualityVisible = await qualitySection.isVisible({ timeout: 3000 }).catch(() => false);
  if (qualityVisible) {
    await qualitySection.hover();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/home-11-quality-hover.png' });
  }

  // ─── 5. Shop our Best Sellers – click first product, open in new tab ────────
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(500);

  // Find the best sellers section
  const bestSellersHeading = page.locator('h1, h2, h3').filter({ hasText: /best.?seller/i }).first();
  const bestSellersVisible = await bestSellersHeading.isVisible({ timeout: 5000 }).catch(() => false);

  if (bestSellersVisible) {
    await bestSellersHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/home-12-best-sellers-section.png' });

    // Find a product link in or after the best sellers section
    const productLink = page.locator('a[href*="/product"], a[href*="/products"], a[href*="/our-products"]').first();
    const productVisible = await productLink.isVisible({ timeout: 3000 }).catch(() => false);
    if (productVisible) {
      await page.waitForTimeout(1000);
      const [newTab] = await Promise.all([
        page.context().waitForEvent('page'),
        productLink.click({ modifiers: ['Control'] }),
      ]);
      await newTab.waitForLoadState('load');
      await newTab.waitForTimeout(1000);
      await newTab.screenshot({ path: 'test-results/home-13-best-seller-product-tab.png', fullPage: true });
      await newTab.close();
      await page.waitForTimeout(1000);
    }
  }

  // ─── 6. Scroll down, hover over "Air Scaled container" ──────────────────────
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight * 0.4, behavior: 'smooth' }));
  await page.waitForTimeout(1000);

  const airScaledContainer = page.locator('div, section').filter({ hasText: /air scaled/i }).first();
  const airScaledVisible = await airScaledContainer.isVisible({ timeout: 3000 }).catch(() => false);
  if (airScaledVisible) {
    await airScaledContainer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await airScaledContainer.hover();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/home-14-air-scaled-hover.png' });

    // Click state
    await airScaledContainer.click().catch(() => { });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/home-15-air-scaled-clicked.png' });

    // Check if it opened an image or navigated
    const currentUrl = page.url();
    if (currentUrl !== BASE_URL && currentUrl !== `${BASE_URL}/`) {
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
  }

  // ─── 7. Modern Street Collection – click product, new tab ───────────────────
  const modernStreetHeading = page.locator('h1, h2, h3').filter({ hasText: /modern street/i }).first();
  const modernStreetVisible = await modernStreetHeading.isVisible({ timeout: 5000 }).catch(() => false);

  if (modernStreetVisible) {
    await modernStreetHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/home-16-modern-street-section.png' });

    const modernProductLink = modernStreetHeading
      .locator('xpath=ancestor::section//a | ancestor::div//a')
      .filter({ hasText: /shop|view|buy/i })
      .first();

    const modernProductVisible = await modernProductLink.isVisible({ timeout: 3000 }).catch(() => false);
    if (modernProductVisible) {
      await page.waitForTimeout(1000);
      const [newTab2] = await Promise.all([
        page.context().waitForEvent('page'),
        modernProductLink.click({ modifiers: ['Control'] }),
      ]);
      await newTab2.waitForLoadState('load');
      await newTab2.waitForTimeout(1000);
      await newTab2.screenshot({ path: 'test-results/home-17-modern-street-product-tab.png', fullPage: true });
      await newTab2.close();
      await page.waitForTimeout(1000);
    }
  }

  // ─── 8. Footer – Quick Links ────────────────────────────────────────────────
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/home-18-footer.png' });

  // Quick links: Privacy Policy, Terms of Service, FAQ, Disclosure
  const quickLinks = [
    { text: /about-us/i, file: 'home-19-about-us' },
    { text: /our-products/i, file: 'home-20-our-products' },
    { text: /privacy policy/i, file: 'home-21-privacy-policy' },
    { text: /terms of service/i, file: 'home-22-terms-of-service' },
    { text: /^faq$/i, file: 'home-23-footer-faq' },
    { text: /disclosure/i, file: 'home-24-disclosure' },
    { text: /favour-boys-admin-panel/i, file: 'home-25-admin-panel' },
  ];

  for (const link of quickLinks) {
    const linkEl = page.locator('footer a, footer span').filter({ hasText: link.text }).first();
    const linkVisible = await linkEl.isVisible({ timeout: 3000 }).catch(() => false);
    if (linkVisible) {
      await page.waitForTimeout(1000);
      await linkEl.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `test-results/${link.file}.png`, fullPage: true });
      await page.goBack();
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
      await page.waitForTimeout(1000);
    }
  }

  // ─── 9. Newsletter – fill dummy email & Join ────────────────────────────────
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await page.waitForTimeout(1000);

  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="mail" i]').first();
  const emailVisible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);
  if (emailVisible) {
    await emailInput.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await emailInput.fill('testuser@flavorboys.com');
    await page.waitForTimeout(1000);

    const joinBtn = page.locator('button').filter({ hasText: /join|subscribe|sign up/i }).first();
    const joinVisible = await joinBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (joinVisible) {
      await joinBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/home-23-newsletter-joined.png' });
    }
  }

  // ─── 10. Social Icons – Instagram, TikTok, Twitter ──────────────────────────
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await page.waitForTimeout(1000);

  const socialLinks = [
    { selector: 'a[href*="instagram"]', name: 'instagram', file: 'home-24-instagram' },
    { selector: 'a[href*="tiktok"]', name: 'tiktok', file: 'home-25-tiktok' },
    { selector: 'a[href*="twitter"], a[href*="x.com"]', name: 'twitter', file: 'home-26-twitter' },
  ];

  for (const social of socialLinks) {
    const socialLink = page.locator(social.selector).first();
    const socialVisible = await socialLink.isVisible({ timeout: 3000 }).catch(() => false);
    if (socialVisible) {
      await page.waitForTimeout(1000);
      const [socialTab] = await Promise.all([
        page.context().waitForEvent('page'),
        socialLink.click(),
      ]).catch(async () => {
        // If no new tab, just click and screenshot current page
        await socialLink.click().catch(() => { });
        return [null];
      }) as [any];

      if (socialTab) {
        await socialTab.waitForLoadState('domcontentloaded').catch(() => { });
        await socialTab.waitForTimeout(1000);
        await socialTab.screenshot({ path: `test-results/${social.file}.png` });
        await socialTab.close();
      } else {
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `test-results/${social.file}.png` });
        await page.goBack().catch(() => { });
        await page.waitForLoadState('networkidle');
      }
      await page.waitForTimeout(1000);
    }
  }

  // ─── 11. Scroll-to-top arrow + Copyright year check ─────────────────────────
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await page.waitForTimeout(1000);

  const copyrightText = page.locator('footer, div').filter({ hasText: /©|copyright/i }).last();
  const copyrightVisible = await copyrightText.isVisible({ timeout: 3000 }).catch(() => false);
  if (copyrightVisible) {
    const text = await copyrightText.innerText().catch(() => '');
    const currentYear = new Date().getFullYear().toString();
    console.log(`Copyright text found: ${text}`);
    const hasCurrentYear = text.includes(currentYear);
    console.log(`Has current year (${currentYear}): ${hasCurrentYear}`);
    await page.screenshot({ path: 'test-results/home-27-copyright.png' });
  }

  // Scroll-to-top arrow
  const scrollTopArrow = page.locator('button[aria-label*="top" i], button[aria-label*="scroll" i], a[href="#top"], button svg').last();
  const arrowVisible = await scrollTopArrow.isVisible({ timeout: 3000 }).catch(() => false);
  if (arrowVisible) {
    await page.waitForTimeout(1000);
    await scrollTopArrow.click().catch(() => { });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/home-28-scroll-top-arrow.png' });
  }

  // Final: Back to top
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/home-29-final-home.png', fullPage: true });
});
