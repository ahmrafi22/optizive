const express = require('express');
const router = express.Router();
const axios = require('axios');

function cleanPrice(priceStr) {
  if (!priceStr) return { price: null, oldPrice: null };
  const matches = priceStr.match(/(\d[\d,]*)৳/g);
  const nums = matches ? matches.map(m => m.replace(/[৳,\s]/g, '')) : [];
  return {
    price: nums[0] || null,
    oldPrice: nums[1] || null
  };
}

function groupProductsBySource(products) {
  const grouped = {};
  products.forEach(prod => {
    const source = prod.source ? prod.source.trim().toLowerCase() : 'unknown';
    const { price, oldPrice } = cleanPrice(prod.price);
    const formatted = {
      name: prod.name,
      price,
      oldPrice,
      image: prod.image,
      link: prod.url
    };
    if (!grouped[source]) grouped[source] = [];
    grouped[source].push(formatted);
  });
  return grouped;
}

async function fetchAndGroupProducts(query, limit = 20) {
  const url = `https://www.pcpartpickerbd.com/api/products?query=${encodeURIComponent(query)}&limit=${limit}`;
  const { data } = await axios.get(url);
  if (!data.products) throw new Error('No products found');
  return groupProductsBySource(data.products);
}

router.get('/', async (req, res) => {
  try {
    const query = req.query.query;
    const limit = parseInt(req.query.limit) || 20;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
        example: '/scraper-pcpartpicker?query=rtx 4060&limit=20'
      });
    }

    const products = await fetchAndGroupProducts(query, limit);
    
    return res.json({
      success: true,
      source: 'pcpartpickerbd',
      query: query,
      limit: limit,
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
