const express = require('express');
const router = express.Router();

function buildDarazUrl(query) {
  const encodedQuery = encodeURIComponent(query);
  return `https://www.daraz.com.bd/catalog/?ajax=true&q=${encodedQuery}`;
}

async function scrapeDaraz(query) {
  try {
    const url = buildDarazUrl(query);
    const res = await fetch(url);
    const data = await res.json();

    // Extract only required fields from correct listItems path
    const items = (data?.mods?.listItems || []).map(item => ({
      name: item.name || "",
      price: (item.priceShow || "").replace(/[^\d.]/g, ""),
      oldPrice: item.originalPriceShow ? item.originalPriceShow.replace(/[^\d.]/g, "") : "",
      image: item.image || "",
      link: item.itemUrl ? `https:${item.itemUrl}` : ""
    }));

    return items;
  } catch (err) {
    throw new Error(`Error scraping Daraz: ${err.message}`);
  }
}

router.get('/', async (req, res) => {
  try {
    const query = req.query.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
        example: '/scraper-daraz?query=Pran mango juice'
      });
    }

    const products = await scrapeDaraz(query);
    
    return res.json({
      success: true,
      source: 'daraz',
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
