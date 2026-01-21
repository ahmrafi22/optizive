const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');

async function scrapeTranscomProducts(searchQuery) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const url = `https://transcomdigital.com/search?queryString=${encodeURIComponent(searchQuery)}&sortBy=_score&pageSize=36`;
    console.log(`Navigating to: ${url}`);

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('Waiting for products to load...');
    await page.waitForSelector('.product-card-wrapper', {
      timeout: 20000
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const products = await page.evaluate(() => {
      function cleanPrice(str) {
        if (!str) return null;
        return Number(str.replace(/[^\d.]/g, ''));
      }
      const productCards = document.querySelectorAll('.product-card-wrapper');
      const results = [];
      productCards.forEach((card) => {
        const productCard = card.querySelector('.jsx-549219207');
        if (productCard) {
          const nameLink = productCard.querySelector('a.jsx-549219207[href]');
          let productName = '';
          let productLink = '';
          if (nameLink) {
            productLink = nameLink.getAttribute('href');
            const nameDiv = nameLink.querySelector('div');
            if (nameDiv) {
              productName = nameDiv.textContent.trim();
            }
          }
          let currentPrice = null;
          let oldPrice = null;
          const priceContainer = productCard.querySelector('.flex.flex-row-reverse.items-center');
          if (priceContainer) {
            const oldPriceElement = priceContainer.querySelector('.price-reduced.line-through .Currency');
            if (oldPriceElement) {
              oldPrice = cleanPrice(oldPriceElement.textContent.trim());
            }
            const currentPriceElement = priceContainer.querySelector('.font-bold .Currency');
            if (currentPriceElement) {
              currentPrice = cleanPrice(currentPriceElement.textContent.trim());
            }
          }
          if (!currentPrice) {
            const simplePriceElement = productCard.querySelector('.font-bold .Currency');
            if (simplePriceElement) {
              currentPrice = cleanPrice(simplePriceElement.textContent.trim());
            }
          }
          const imageElement = productCard.querySelector('img');
          let image = imageElement ? imageElement.getAttribute('src') : null;
          if (image) {
            if (image.startsWith('/_next/image')) {
              image = `https://transcomdigital.com${image}`;
            } else if (!/^https?:\/\//i.test(image) && !image.startsWith('data:')) {
              image = `https://transcomdigital.com${image}`;
            }
          }
          if (productName && currentPrice) {
            results.push({
              name: productName,
              price: currentPrice,
              oldPrice: oldPrice,
              link: productLink ? `https://transcomdigital.com${productLink}` : null,
              image: image
            });
          }
        }
      });
      return results;
    });

    return products;
  } catch (error) {
    throw new Error(`Error scraping Transcom: ${error.message}`);
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
        example: '/scraper-transcom?query=Hitachi refrigerator'
      });
    }

    const products = await scrapeTranscomProducts(query);
    
    return res.json({
      success: true,
      source: 'transcom',
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
