const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to federation console
  await page.goto('http://localhost:3009/foundation/federation');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Check for tabs
  const dashboardTab = await page.locator('text=Dashboard').first();
  const serviceDiscoveryTab = await page.locator('text=Service Discovery').first();
  const topologyTab = await page.locator('text=Topology').first();
  const provenanceTab = await page.locator('text=Provenance Tracer').first();

  console.log('Tabs found:');
  console.log('- Dashboard tab:', await dashboardTab.isVisible());
  console.log('- Service Discovery tab:', await serviceDiscoveryTab.isVisible());
  console.log('- Topology tab:', await topologyTab.isVisible());
  console.log('- Provenance Tracer tab:', await provenanceTab.isVisible());

  // Click Service Discovery tab
  await serviceDiscoveryTab.click();
  await page.waitForTimeout(1000);
  console.log('- Service Discovery tab clicked successfully');

  // Click Topology tab
  await topologyTab.click();
  await page.waitForTimeout(1000);
  console.log('- Topology tab clicked successfully');

  // Click Provenance Tracer tab
  await provenanceTab.click();
  await page.waitForTimeout(1000);
  console.log('- Provenance Tracer tab clicked successfully');

  // Click back to Dashboard
  await dashboardTab.click();
  await page.waitForTimeout(1000);
  console.log('- Dashboard tab clicked successfully');

  // Check for "Register Test Sprint" button
  const registerButton = await page.locator('text=Register Test Sprint').first();
  console.log('- Register Test Sprint button visible:', await registerButton.isVisible());

  await browser.close();
  console.log('\n✅ All tab navigation working correctly!');
})();
