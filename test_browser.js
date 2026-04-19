const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error));
  await page.goto('http://localhost:5173/auth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZW1vLXV1aWQtMTIzNCIsInVzZXJuYW1lIjoiZGVtb191c2VyIiwicm9sZSI6InVzZXIiLCJpYXQiOjQxMTI2NDEwNjYsImV4cCI6NDE1NTg0MTA2Nn0.abc');
  await page.waitForTimeout(3000);
  await browser.close();
})();
