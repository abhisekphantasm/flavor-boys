import { test, expect, Page } from '@playwright/test';

const CONTACT_URL = 'http://31.97.61.59:6030/contact-us';
const AGE_GATE_BTN = 'button:has-text("Yes"), button:has-text("21+"), button:has-text("Confirm")';

async function dismissPopups(page: Page) {
  try {
    const ageBtn = page.locator(AGE_GATE_BTN).first();
    if (await ageBtn.isVisible({ timeout: 2000 })) {
      await ageBtn.click({ force: true }).catch(() => { });
    }
    await page.keyboard.press('Escape').catch(() => { });
  } catch (e) { }
}

async function screenshotAndAttach(page: Page, name: string) {
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const allurePath = `allure-results/${safeName}.png`;
  await page.screenshot({ path: allurePath });
  await test.info().attach(name, { path: allurePath, contentType: 'image/png' });
}

test('Contact Us Page – Form Interaction & Validation', async ({ context, page }) => {
  test.setTimeout(180000);

  // Bypassing Age Gate using Cookies and Init Script
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

  // 1. Navigate to Website
  await page.goto(CONTACT_URL, { waitUntil: 'domcontentloaded' });
  await dismissPopups(page);
  await expect(page).toHaveURL(/contact-us/);
  await screenshotAndAttach(page, 'Contact_Page_Loaded');

  // 2. Verify Page Banner
  const heading = page.locator("text=WE DON'T BITE, BUT WE DO RESPOND").first();
  await expect(heading).toBeVisible();
  const nicotineWarning = page.locator('text=THIS PRODUCT CONTAINS NICOTINE. NICOTINE IS AN ADDICTIVE CHEMICAL.').first();
  await expect(nicotineWarning).toBeVisible();

  // 3. Verify Contact Info Section (OR REACH US DIRECTLY)
  await expect(page.locator('text=support@flavorboys.com').first()).toBeVisible();
  await expect(page.locator('text=/Monday.*Friday.*9:00.*5:00/').first()).toBeVisible();
  await expect(page.locator('text=/\\+1.*555.*987.*6543/').first()).toBeVisible();
  await expect(page.locator('text=/Flavor Boys HQ.*123 Bold Street.*Rebel City, USA/').first()).toBeVisible();

  // 4. Verify "Let's Connect" Social Section
  const instagram = page.locator('button[aria-label="Visit our Instagram"]').first();
  const facebook = page.locator('button[aria-label="Visit our Facebook"]').first();
  const linkedin = page.locator('button[aria-label="Visit our LinkedIn"]').first();
  await expect(instagram).toBeVisible();
  await expect(facebook).toBeVisible();
  await expect(linkedin).toBeVisible();

  // 5. Verify Walk-in Notice
  const notice = page.locator('text=We do not offer walk-in support. All inquiries are handled online.').first();
  await expect(notice).toBeVisible();

  // 6. Verify Form Fields Are Present
  await expect(page.getByPlaceholder('John Doe')).toBeVisible();
  await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
  await expect(page.getByPlaceholder('2345678901')).toBeVisible();
  await expect(page.getByPlaceholder('How can we help?')).toBeVisible();
  await expect(page.getByPlaceholder('Your message here...')).toBeVisible();
  await expect(page.locator('button:has-text("Send Message")')).toBeVisible();

  // 7. Fill Name Field
  await page.getByPlaceholder('John Doe').click();
  await page.getByPlaceholder('John Doe').pressSequentially('John Doe', { delay: 100 });
  await expect(page.getByPlaceholder('John Doe')).toHaveValue('John Doe');

  // 8. Fill E-Mail Field
  await page.getByPlaceholder('you@example.com').click();
  await page.getByPlaceholder('you@example.com').pressSequentially('johndoe@test.com', { delay: 100 });
  await expect(page.getByPlaceholder('you@example.com')).toHaveValue('johndoe@test.com');

  // 9. Fill Phone Field
  await page.getByPlaceholder('2345678901').click();
  await page.getByPlaceholder('2345678901').pressSequentially('9876543210', { delay: 100 });
  await expect(page.getByPlaceholder('2345678901')).toHaveValue('9876543210');

  // 10. Fill Subject Field
  await page.getByPlaceholder('How can we help?').click();
  await page.getByPlaceholder('How can we help?').pressSequentially('Test Inquiry', { delay: 100 });
  await expect(page.getByPlaceholder('How can we help?')).toHaveValue('Test Inquiry');

  // 11. Fill Message Field
  await page.getByPlaceholder('Your message here...').click();
  await page.getByPlaceholder('Your message here...').pressSequentially('This is a test message for QA purposes.', { delay: 100 });
  await expect(page.getByPlaceholder('Your message here...')).toHaveValue('This is a test message for QA purposes.');

  // 12. Submit Form with Valid Data
  await page.locator('button:has-text("Send Message")').click({ force: true });
  await page.waitForTimeout(2000);
  await screenshotAndAttach(page, 'Step_12_Valid_Submission');

  // 13. Submit Form with All Empty Fields
  await page.reload({ waitUntil: 'domcontentloaded' });
  await dismissPopups(page);
  await page.locator('button:has-text("Send Message")').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  await page.locator('button:has-text("Send Message")').click({ force: true });
  await expect(page).toHaveURL(/contact-us/);
  await screenshotAndAttach(page, 'Step_13_Empty_Fields');

  // 14. Submit Form with Invalid Email
  await page.getByPlaceholder('John Doe').fill('');
  await page.getByPlaceholder('John Doe').pressSequentially('Test User', { delay: 100 });
  await page.getByPlaceholder('you@example.com').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
  await page.getByPlaceholder('you@example.com').fill('');
  await page.getByPlaceholder('you@example.com').pressSequentially('notanemail', { delay: 100 });
  await page.locator('button:has-text("Send Message")').click({ force: true });
  await screenshotAndAttach(page, 'Step_14_Invalid_Email');

  // 15. Submit Form with Only Name Filled
  await page.reload({ waitUntil: 'domcontentloaded' });
  await dismissPopups(page);
  await page.getByPlaceholder('John Doe').scrollIntoViewIfNeeded();
  await page.getByPlaceholder('John Doe').pressSequentially('Test User', { delay: 100 });
  await page.locator('button:has-text("Send Message")').click({ force: true });
  await page.waitForTimeout(2000);
  await screenshotAndAttach(page, 'Step_15_Partial_Data');

  // 16. Verify Bottom Section
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('text=KEEPING IT REAL').first()).toBeVisible();
  await expect(page.locator("text=LET'S TALK.").first()).toBeVisible();
  await screenshotAndAttach(page, 'Step_16_Bottom_Section');

<<<<<<< Updated upstream
    // 16. Verify Bottom Section
    await test.step('16. Verify Bottom Section', async () => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(page.locator('text=KEEPING IT REAL').first()).toBeVisible();
      await expect(page.locator('text=LET\'S TALK.').first()).toBeVisible();
      await screenshotAndAttach(page, 'Step_16_Bottom_Section');
    });

    // 17. Verify Contact Us Page Flow
    await test.step('17. Verify Contact Us Page Flow', async () => {
      console.log('Contact Us page flow verified successfully.');
      await screenshotAndAttach(page, 'Step_17_Verification_Complete');
    });
  });
=======
  // 17. Verify Contact Us Page Flow
  console.log('Contact Us page flow verified successfully.');
  await screenshotAndAttach(page, 'Step_17_Verification_Complete');
>>>>>>> Stashed changes
});
