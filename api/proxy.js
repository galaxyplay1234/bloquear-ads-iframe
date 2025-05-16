import chrome from 'chrome-aws-lambda';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).send('Faltando parâmetro: url');

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chrome.args,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.evaluate(() => {
      // Remove anúncios e bloqueia popups
      window.open = () => null;
      const adSelectors = [
        'script[src*="pop"]',
        'iframe[src*="ads"]',
        '[onclick*="window.open"]',
        '[href*="ads"]',
        '[class*="ad"]',
        '#adsbox', '#ad'
      ];
      adSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.remove());
      });
    });

    const content = await page.content();
    await browser.close();
    return res.status(200).send(content);
  } catch (error) {
    if (browser) await browser.close();
    return res.status(500).send('Erro: ' + error.message);
  }
}
