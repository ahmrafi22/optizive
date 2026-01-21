const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

function getSearchUrl(query) {
  if (!query) return 'https://chaldal.com/search/grocery';
  return `https://chaldal.com/search/${encodeURIComponent(query)}`;
}

async function scrapeChaldalProducts(searchQuery) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    const searchUrl = getSearchUrl(searchQuery);
    console.log(`Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for productPane to load
    await page.waitForSelector('.productPane', { timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const products = await page.evaluate(() => {
      function cleanPrice(str) {
        if (!str) return '';
        return str.replace(/[^\d.]/g, '');
      }
      const baseUrl = 'https://chaldal.com';
      const productNodes = document.querySelectorAll('.productPane .product, .productPane .product.outOfStock');
      const results = [];
      productNodes.forEach(product => {
        const nameEl = product.querySelector('.name');
        const priceEl = product.querySelector('.price span:last-child');
        const imageEl = product.querySelector('.imageWrapperWrapper img');
        const linkEl = product.querySelector('a.btnShowDetails');
        results.push({
          name: nameEl ? nameEl.textContent.trim() : '',
          price: priceEl ? cleanPrice(priceEl.textContent.trim()) : '',
          oldPrice: '',
          image: imageEl ? imageEl.getAttribute('src') : '',
          link: linkEl ? baseUrl + linkEl.getAttribute('href') : ''
        });
      });
      return results;
    });

    return products;
  } catch (error) {
    throw new Error(`Error scraping Chaldal: ${error.message}`);
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
        example: '/scraper-chaldal?query=Taza tea'
      });
    }

    const products = await scrapeChaldalProducts(query);
    
    return res.json({
      success: true,
      source: 'chaldal',
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
