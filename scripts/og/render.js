// Рендер превью для соцсетей: node scripts/og/render.js (нужен playwright)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const lang of ['ru', 'en']) {
    await page.goto('file://' + path.join(__dirname, `og-${lang}.html`));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(__dirname, `../../docs/assets/og-${lang}.jpg`), type: 'jpeg', quality: 88 });
  }
  const icon = await browser.newPage({ viewport: { width: 180, height: 180 } });
  const svg = require('fs').readFileSync(path.join(__dirname, '../../docs/assets/favicon.svg'), 'utf8');
  await icon.setContent(`<body style="margin:0">${svg.replace('<svg ', '<svg width="180" height="180" ')}</body>`);
  await icon.screenshot({ path: path.join(__dirname, '../../docs/assets/apple-touch-icon.png') });
  await browser.close();
})();
