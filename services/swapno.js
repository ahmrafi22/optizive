const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

async function scrapeSwapnoProducts(searchQuery) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const url = `https://www.shwapno.com/search?q=${encodeURIComponent(searchQuery)}`;
    console.log(`Navigating to: ${url}`);
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log('Waiting for products to load...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    const products = await page.evaluate(() => {
      function cleanPrice(str) {
        if (!str) return null;
        return Number(str.replace(/[^\d.]/g, ''));
      }
      const productBoxes = document.querySelectorAll('.product-box');
      const results = [];
      productBoxes.forEach((box) => {
        const titleElement = box.querySelector('.product-box-title a');
        const priceElement = box.querySelector('.product-price .active-price');
        const oldPriceElement = box.querySelector('.product-price .old-price');
        const linkElement = box.querySelector('.product-box-gallery a');
        const imageElement = box.querySelector('.product-box-gallery img');
        
        if (titleElement && priceElement) {
          let productLink = linkElement ? linkElement.getAttribute('href') : null;
          let image = imageElement ? imageElement.getAttribute('src') : null;
          
          if (productLink && !productLink.startsWith('http')) {
            productLink = `https://www.shwapno.com${productLink}`;
          }
          
          if (image && !image.startsWith('http') && !image.startsWith('data:')) {
            image = `https://www.shwapno.com${image}`;
          }
          
          results.push({
            name: titleElement.textContent.trim(),
            price: cleanPrice(priceElement.textContent.trim()),
            oldPrice: oldPriceElement ? cleanPrice(oldPriceElement.textContent.trim()) : null,
            link: productLink,
            image: image
          });
        }
      });
      return results;
    });

    return products;
  } catch (error) {
    throw new Error(`Error scraping Swapno: ${error.message}`);
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
        example: '/scraper-swapno?query=Chinigura Rice'
      });
    }

    const products = await scrapeSwapnoProducts(query);
    
    return res.json({
      success: true,
      source: 'swapno',
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
