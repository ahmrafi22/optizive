const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

function cleanPrice(priceStr) {
  if (!priceStr) return null;
  const match = priceStr.match(/\d[\d,]*/);
  return match ? match[0].replace(/[,\s]/g, '') : null;
}

async function scrapeUnimartProducts(query) {
  const url = `https://unimart.online/search?q=${encodeURIComponent(query)}`;
  const agent = new https.Agent({ rejectUnauthorized: false });
  const { data: html } = await axios.get(url, { httpsAgent: agent });
  const $ = cheerio.load(html);
  const products = [];

  $('.products-box-bar .product-box-2').each((_, el) => {
    const name = $(el).find('h2.product-title a').text().trim();
    const link = $(el).find('h2.product-title a').attr('href');
    let image = $(el).find('img.img-fit').attr('data-src');
    if (!image) {
      image = $(el).find('img.img-fit').attr('src');
    }
    const priceText = $(el).find('.price-box .product-price').text().trim();
    const price = cleanPrice(priceText);
    const oldPrice = "";
    products.push({
      name,
      price,
      oldPrice,
      image,
      link
    });
  });

  return products;
}

router.get('/', async (req, res) => {
  try {
    const query = req.query.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter is required',
        example: '/scraper-unimart?query=chinigura rice'
      });
    }

    const products = await scrapeUnimartProducts(query);
    
    return res.json({
      success: true,
      source: 'unimart',
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
