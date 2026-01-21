const express = require('express');
const router = express.Router();
const { getBrowser } = require('../utils/browser');

async function scrapeOthoba(searchQuery) {
  const browser = await getBrowser();

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const encodedPath = encodeURIComponent(searchQuery);
    const encodedQuery = encodeURIComponent(searchQuery);
    const url = `https://www.othoba.com/ts/search/${encodedPath}?t=t&q=${encodedQuery}`;
    console.log(`Navigating to: ${url}`);

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForSelector('.product-wrap.dl-all-product-from-pages', { timeout: 20000 });
    await new Promise(resolve => setTimeout(resolve, 3000));

    const products = await page.evaluate(() => {
      const productNodes = document.querySelectorAll('.product-wrap.dl-all-product-from-pages');
      const results = [];
      productNodes.forEach((node) => {
        try {
          const nameAnchor = node.querySelector('.product-details .product-name a');
          const productName = nameAnchor ? nameAnchor.textContent.trim() : null;
          const productLink = nameAnchor ? ('https://othoba.com' + nameAnchor.getAttribute('href')) : null;

          let imageUrl = null;
          const imgElements = node.querySelectorAll('distributed-cache a img.prdImg');
          for (let img of imgElements) {
            const src = img.getAttribute('src');
            if (src && src.startsWith('https://images.othoba.com/images/')) {
              imageUrl = src;
              break;
            }
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc && dataSrc.startsWith('https://images.othoba.com/images/')) {
              imageUrl = dataSrc;
              break;
            }
          }

          const priceIns = node.querySelector('.product-details .product-price ins.new-price');
          const priceDel = node.querySelector('.product-details .product-price del.old-price');
          let currentPrice = priceIns ? priceIns.textContent.trim() : null;
          let oldPrice = priceDel ? priceDel.textContent.trim() : null;

          if (currentPrice) currentPrice = currentPrice.replace(/[^\d.]/g, '');
          if (oldPrice) oldPrice = oldPrice.replace(/[^\d.]/g, '');

          if (productName && productLink && currentPrice) {
            results.push({
              name: productName,
              price: currentPrice,
              oldPrice: oldPrice || null,
              image: imageUrl || null,
              link: productLink
            });
          }
        } catch (err) {
          // Ignore individual product errors
        }
      });
      return results;
    });

    return products;
  } catch (error) {
    throw new Error(`Error scraping Othoba: ${error.message}`);
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
        example: '/scraper-othoba?query=Radhuni chilli powder'
      });
    }

    const products = await scrapeOthoba(query);
    
    return res.json({
      success: true,
      source: 'othoba',
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
