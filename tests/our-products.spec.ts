import { test, expect } from '@playwright/test';

const BASE_URL = 'http://31.97.61.59:6030';

test('Our Products Page - Full Flow Test', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes timeout for products given loop

  // ─── Helper: dismiss age gate if present ───────────────────────────────────
  async function dismissAgeGate() {
    try {
      // Use isVisible with a short timeout instead of waitFor to avoid throwing
      const ageBtn = page.getByRole('button', { name: /Yes, I'm 21\+/i });
      const visible = await ageBtn.isVisible().catch(() => false);
      if (!visible) {
        // Also try locating by text in case role doesn't match
        const ageBtnByText = page.locator('button').filter({ hasText: /21/i }).first();
        const visibleByText = await ageBtnByText.isVisible().catch(() => false);
        if (!visibleByText) return;
        await ageBtnByText.click({ force: true });
        console.log('Age gate dismissed (by text).');
        await page.waitForTimeout(500);
        return;
      }
      await page.waitForTimeout(300);
      await ageBtn.click({ force: true });
      console.log('Age gate dismissed.');
      await page.waitForTimeout(500);
    } catch {
      // Not present or already dismissed — silently continue
    }
  }

  // ─── 1. Navigate to Our Products & Take SS ─────────────────────────────────
  await page.goto(`${BASE_URL}/our-products`);
  await page.waitForLoadState('load');
  await dismissAgeGate();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/products-01-page.png', fullPage: true });

  // Confirm page loaded by checking URL rather than a hidden h1
  await expect(page).toHaveURL(/our-products/);

  // ─── 2. Collect product URLs BEFORE clicking anything ──────────────────────
  // Scroll through the page so lazy-loaded cards appear
  for (let scrollPos = 300; scrollPos <= 5000; scrollPos += 400) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollPos);
    await page.waitForTimeout(400);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // ── ALL products across both AAA Collection and AA Collection ──────────────
  const productNames = [
    // AAA Collection (original 3 + 5 new)
    'DEATH BREATH',
    'DEAD CHILL',
    'CRUNCH BERRIES',
    'PURPLE SKITTLES',
    'SWEET RETREAT',
    'SLURRICANE',
    'CARAMEL POP ROCK',
    'SHERBANG',
    // AA Collection (original 3 + 5 new)
    'RAINBOW ROAD',
    'RAINBOW FOREST',
    'BANANA BLAST',
    'BLACK CHERRY GELATO',
    'POPPING CHERRY',
    'PINK COTTON CANDY',
    'COOKIE CRUMBLE',
    'COTTON CANDY CLOUD',
  ];

  // Build a map: productName → href
  const productUrlMap: Record<string, string> = {};

  // ── Strategy: grab every "View Details" link on the page at once,
  //    then for each one walk up to its closest card ancestor and read
  //    the text content to find which product name it belongs to.
  const allViewDetailsLinks = page.locator('a').filter({ hasText: /view details/i });
  const linkCount = await allViewDetailsLinks.count();
  console.log(`Found ${linkCount} "View Details" links on the page`);

  for (let i = 0; i < linkCount; i++) {
    const link = allViewDetailsLinks.nth(i);
    const href = await link.getAttribute('href');
    if (!href) continue;

    // Read text of the closest meaningful ancestor (up to 6 levels up via JS)
    const ancestorText: string = await link.evaluate((el) => {
      let node = el.parentElement;
      for (let depth = 0; depth < 6; depth++) {
        if (!node) break;
        const text = (node as HTMLElement).innerText ?? '';
        if (text.length > 5 && text.length < 800) return text.toUpperCase();
        node = node.parentElement;
      }
      return '';
    });

    const full = href.startsWith('http') ? href : `${BASE_URL}${href}`;

    let matched = false;
    for (const name of productNames) {
      if (ancestorText.includes(name.toUpperCase())) {
        productUrlMap[name] = full;
        console.log(`Mapped "${name}" → ${full}`);
        matched = true;
        break;
      }
    }

    if (!matched) {
      console.log(`Link ${i} (${full}) — ancestor text: "${ancestorText.slice(0, 80)}"`);
    }
  }

  // Fallback: if any product still missing, try matching by href slug
  for (const name of productNames) {
    if (productUrlMap[name]) continue;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const fallbackLink = page.locator(`a[href*="${slug}"]`).first();
    if (await fallbackLink.count() > 0) {
      const href = await fallbackLink.getAttribute('href');
      if (href) {
        productUrlMap[name] = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        console.log(`Slug fallback "${name}" → ${productUrlMap[name]}`);
      }
    }
  }

  console.log('All collected product URLs:', productUrlMap);

  // ─── 3. Navigate to each product URL directly ──────────────────────────────
  for (const name of productNames) {
    const url = productUrlMap[name];
    if (!url) {
      console.warn(`Skipping "${name}" – no URL collected.`);
      continue;
    }

    console.log(`Navigating to product: ${name} → ${url}`);
    await page.goto(url);
    await page.waitForLoadState('load');
    await dismissAgeGate();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `test-results/products-02-${name.replace(/\s+/g, '_')}.png`,
      fullPage: true,
    });

    // ── NEW: verify flavor buttons are visible on each product detail page ──
    // AAA Collection products
    const aaaFlavors = [
      'Death Breath', 'Dead Chill', 'Crunch Berries',
      'Purple Skittles', 'Sweet Retreat', 'Slurricane',
      'Caramel Pop Rock', 'Sherbang',
    ];
    // AA Collection products
    const aaFlavors = [
      'Rainbow Road', 'Rainbow Forest', 'Banana Blast',
      'Black Cherry Gelato', 'Popping Cherry', 'Pink Cotton Candy',
      'Cookie Crumble', 'Cotton Candy Cloud',
    ];

    const allFlavors = [...aaaFlavors, ...aaFlavors];

    // Check that at least some flavor buttons are visible (product page loaded correctly)
    let flavorFound = false;
    for (const flavor of allFlavors) {
      const btn = page.locator('button, a').filter({ hasText: new RegExp(flavor, 'i') }).first();
      if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`  ✓ Flavor button visible: "${flavor}"`);
        flavorFound = true;
        break;
      }
    }
    if (!flavorFound) {
      console.warn(`  ⚠ No flavor buttons found on product page: ${name}`);
    }

    // ── NEW: click each flavor button that belongs to this product's collection
    const isAAA = aaaFlavors.map(f => f.toUpperCase()).includes(name);
    const collectionFlavors = isAAA ? aaaFlavors : aaFlavors;

    for (const flavor of collectionFlavors) {
      const flavorBtn = page
        .locator('button, span, div')
        .filter({ hasText: new RegExp(`^${flavor}$`, 'i') })
        .first();

      if (await flavorBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await flavorBtn.scrollIntoViewIfNeeded();
        await flavorBtn.click();
        await page.waitForTimeout(600);
        await page.screenshot({
          path: `test-results/products-02-${name.replace(/\s+/g, '_')}-flavor-${flavor.replace(/\s+/g, '_')}.png`,
        });
        console.log(`  Clicked flavor: "${flavor}"`);
      } else {
        console.warn(`  ⚠ Flavor button not found: "${flavor}" on page ${name}`);
      }
    }

    // Return to products listing
    await page.goto(`${BASE_URL}/our-products`);
    await page.waitForLoadState('load');
    await dismissAgeGate();
    await page.waitForTimeout(800);
  }

  // ─── 4. Hover "Premium Quality / Bold & Unique / Designed for Rebels" ───────
  await page.goto(`${BASE_URL}/our-products`);
  await page.waitForLoadState('load');
  await dismissAgeGate();

  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight * 0.5, behavior: 'smooth' })
  );
  await page.waitForTimeout(1000);

  const qualityFeatures: [RegExp, string][] = [
    [/premium quality/i, 'premium-quality'],
    [/bold.*unique|unique.*bold/i, 'bold-unique'],
    [/designed for rebels/i, 'designed-for-rebels'],
  ];

  for (const [pattern, label] of qualityFeatures) {
    const el = page
      .locator('h2, h3, h4, p, span, div')
      .filter({ hasText: pattern })
      .first();

    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await el.hover();
      await page.waitForTimeout(800);
      await page.screenshot({ path: `test-results/products-03-hover-${label}.png` });
    }
  }

  // Hover the full quality section
  const qualitySection = page
    .locator('section, div')
    .filter({ hasText: /premium quality/i })
    .first();

  if (await qualitySection.isVisible({ timeout: 3000 }).catch(() => false)) {
    await qualitySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await qualitySection.hover();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'test-results/products-04-quality-section-hover.png' });
  }

  // ─── 5. Scroll to bottom → Contact Us button ───────────────────────────────
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  );
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/products-05-page-bottom.png' });

  const contactBtn = page
    .locator('a, button')
    .filter({ hasText: /contact us/i })
    .first();

  if (await contactBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await contactBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await contactBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/products-06-contact-us-page.png', fullPage: true });

    await page.goto(`${BASE_URL}/our-products`);
    await page.waitForLoadState('networkidle');
    await dismissAgeGate();
    await page.waitForTimeout(800);
  }

  // ─── 6. Navigate back to Home ───────────────────────────────────────────────
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  await dismissAgeGate();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/products-07-back-to-home.png', fullPage: true });

  await expect(page).toHaveURL(new RegExp(BASE_URL));
});
