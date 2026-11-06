const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  console.log('Navigating to login...');
  await page.goto('https://kadai.asia/login', { waitUntil: 'networkidle2' });
  
  await page.type('input[type="email"], input[name="email"]', 'gudang.sembako@kadai.com');
  await page.type('input[type="password"], input[name="password"]', 'password123');
  
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
    page.click('button[type="submit"]')
  ]);

  console.log('Navigating to inventory...');
  await page.goto('https://kadai.asia/inventory', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: 'C:/Users/K8Plus/Projects/KADAI/kasir-pro/verified_inventory_desktop.png' });
  console.log('Desktop screenshot saved!');

  // Responsive mobile test
  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'C:/Users/K8Plus/Projects/KADAI/kasir-pro/verified_inventory_mobile.png' });
  console.log('Mobile screenshot saved!');

  await browser.close();
})();
