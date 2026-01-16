const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the federation console
  await page.goto('http://localhost:3009/foundation/federation');
  await page.waitForLoadState('networkidle');

  // Check for errors in console
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
  });

  // Check for errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  // Wait a bit for React to render
  await page.waitForTimeout(3000);

  // Get page title
  const title = await page.title();
  console.log('Page title:', title);

  // Check for h1 elements
  const h1s = await page.$$eval('h1', els => els.map(el => el.textContent));
  console.log('H1 elements:', h1s);

  // Check all text content
  const bodyText = await page.$eval('body', el => el.textContent);
  console.log('Body text (first 500 chars):', bodyText.substring(0, 500));

  await browser.close();
})();
