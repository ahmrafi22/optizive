const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

async function scrapePickabooProducts(searchQuery) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const url = `https://www.pickaboo.com/search-result/${encodeURIComponent(searchQuery)}`;
    console.log(`Navigating to: ${url}`);

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('Waiting for products to load...');
    await page.waitForSelector('.product-one', {
      timeout: 15000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const products = await page.evaluate(() => {
      function cleanPrice(str) {
        if (!str) return null;
        return Number(str.replace(/[^\d.]/g, ''));
      }
      const productElements = document.querySelectorAll('.product-one');
      const results = [];
      productElements.forEach((product) => {
        const titleElement = product.querySelector('.product-title');
        const priceElement = product.querySelector('.product-price span');
        const oldPriceElement = product.querySelector('.product-price s');
        const linkElement = product.querySelector('a');
        const imageElement = product.querySelector('.product-one__single__inner__img img');
        if (titleElement && priceElement) {
          results.push({
            name: titleElement.textContent.trim(),
            price: cleanPrice(priceElement.textContent.trim()),
            oldPrice: oldPriceElement ? cleanPrice(oldPriceElement.textContent.trim()) : null,
            link: linkElement ? `https://www.pickaboo.com${linkElement.getAttribute('href')}` : null,
            image: imageElement ? imageElement.getAttribute('src') : null
          });
        }
      });
      return results;
    });

    return products;
  } catch (error) {
    throw new Error(`Error scraping Pickaboo: ${error.message}`);
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
        example: '/scraper-pickaboo?query=Samsung galaxy watch'
      });
    }

    const products = await scrapePickabooProducts(query);
    
    return res.json({
      success: true,
      source: 'pickaboo',
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
