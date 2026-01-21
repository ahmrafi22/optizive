const express = require('express');
const router = express.Router();
const { getBrowser } = require('../utils/browser');

async function scrapeBestElectronics(searchQuery) {
  const browser = await getBrowser();

  try {
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const url = `https://www.bestelectronics.com.bd/?s=${encodeURIComponent(searchQuery)}&post_type=product`;
    console.log(`Navigating to: ${url}`);

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('Waiting for products to load...');
    await page.waitForSelector('.product-wrapper', {
      timeout: 20000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const products = await page.evaluate(() => {
      const productWrappers = document.querySelectorAll('.product-wrapper');
      const results = [];

      productWrappers.forEach((wrapper) => {
        try {
          const titleElement = wrapper.querySelector('.wd-entities-title a');
          const productName = titleElement ? titleElement.textContent.trim() : null;
          const productLink = titleElement ? titleElement.getAttribute('href') : null;

          const imageElement = wrapper.querySelector('.product-image-link img');
          const imageUrl = imageElement ? imageElement.getAttribute('src') : null;

          let currentPrice = null;
          let oldPrice = null;
          
          const priceInsElement = wrapper.querySelector('.wrap-price .price ins .woocommerce-Price-amount');
          if (priceInsElement) {
            currentPrice = priceInsElement.textContent.trim();
            
            const priceDelElement = wrapper.querySelector('.wrap-price .price del .woocommerce-Price-amount');
            if (priceDelElement) {
              oldPrice = priceDelElement.textContent.trim();
            }
          } else {
            const priceElement = wrapper.querySelector('.wrap-price .price .woocommerce-Price-amount');
            if (priceElement) {
              currentPrice = priceElement.textContent.trim();
            }
          }

          if (currentPrice) {
            currentPrice = currentPrice.replace(/[৳\s,]/g, '');
          }
          if (oldPrice) {
            oldPrice = oldPrice.replace(/[৳\s,]/g, '');
          }

          if (productName && productLink && currentPrice) {
            results.push({
              name: productName,
              price: currentPrice,
              oldPrice: oldPrice,
              image: imageUrl,
              link: productLink
            });
          }
        } catch (error) {
          // Ignore individual product errors
        }
      });

      return results;
    });

    return products;
  } catch (error) {
    throw new Error(`Error scraping Best Electronics: ${error.message}`);
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
        example: '/scraper-bestelectronics?query=hitachi refrigerator'
      });
    }

    const products = await scrapeBestElectronics(query);
    
    return res.json({
      success: true,
      source: 'bestelectronics',
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
