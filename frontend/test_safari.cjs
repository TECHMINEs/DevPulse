const { webkit } = require('playwright');
const jwt = require('jsonwebtoken');

(async () => {
  const browser = await webkit.launch();
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log('CONSOLE:', msg.text());
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  // Simulate the JWT login. But first we need a valid token. 
  const token = jwt.sign(
      { userId: 'demo-uuid-1234', username: 'demo_user', role: 'user' },
      'devpulse_default_secret_key',
      { expiresIn: '7d' }
  );
  console.log('Navigating with token...');
  await page.goto(`http://localhost:5173/login/callback?token=${token}`);
  await page.waitForTimeout(5000); // give time for dashboard to load
  await browser.close();
})();
