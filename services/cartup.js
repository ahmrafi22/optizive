const express = require('express');
const router = express.Router();
const { getBrowser } = require('../utils/browser');

async function scrapeCartupProducts(searchQuery) {
  const browser = await getBrowser();

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const url = `https://cartup.com/search?keyword=${encodeURIComponent(searchQuery)}&minimumPrice=0&maximumPrice=1000000&sorting=0&rowsPerPage=30`;
    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('Waiting for products to load...');
    await page.waitForSelector('a[href^="/product/"]', { timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const products = await page.evaluate(() => {
      function cleanPrice(str) {
        if (!str) return null;
        return Number(str.replace(/[^\d.]/g, ''));
      }
      const productAnchors = document.querySelectorAll('a[href^="/product/"]');
      const results = [];
      productAnchors.forEach(anchor => {
        const nameEl = anchor.querySelector('p.line-clamp-2');
        let name = null;
        if (nameEl) {
          let nameClone = nameEl.cloneNode(true);
          Array.from(nameClone.querySelectorAll('img')).forEach(img => img.remove());
          name = nameClone.textContent.trim();
        }

        const priceEl = anchor.querySelector('p.text-lg.font-bold.text-highlight');
        let price = priceEl ? cleanPrice(priceEl.textContent) : null;

        let oldPriceEl = "";
        const oldPriceCandidates = anchor.querySelectorAll('p');
        oldPriceEl = Array.from(oldPriceCandidates).find(p => p.className.includes('line-through'));
        let oldPrice = oldPriceEl ? cleanPrice(oldPriceEl.textContent) : "";

        const imageEl = anchor.querySelector('img.transition-opacity.duration-500');
        let image = imageEl ? imageEl.getAttribute('src') : null;

        let link = anchor.getAttribute('href') ? `https://cartup.com${anchor.getAttribute('href')}` : null;

        if (name && price) {
          results.push({
            name,
            price,
            oldPrice,
            image,
            link
          });
        }
      });
      return results;
    });

    return products;
  } catch (error) {
    throw new Error(`Error scraping Cartup: ${error.message}`);
  } finally {
    await browser.close();
  }
}

router.get('/', async (req, res) => {
  try {
    const query = req.query.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
        example: '/scraper-cartup?query=Taza tea'
      });
    }

    const products = await scrapeCartupProducts(query);
    
    return res.json({
      success: true,
      source: 'cartup',
      query: query,
      count: products.length,
      products: products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
