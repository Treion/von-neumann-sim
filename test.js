const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
  
  // Take screenshot before click
  await page.screenshot({ path: 'before_click.png' });
  
  // Click on PC
  const pcText = await page.$x("//span[contains(text(), 'PC')]");
  if (pcText.length > 0) {
    await pcText[0].click();
    await page.waitForTimeout(500); // wait for animation/render
  }
  
  // Take screenshot after click
  await page.screenshot({ path: 'after_click.png' });
  
  // Dump the text of the right panel
  const html = await page.content();
  const fs = require('fs');
  fs.writeFileSync('page.html', html);
  
  await browser.close();
})();
