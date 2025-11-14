const express = require('express');
const router = express.Router();
const coingeckoService = require('../services/coingecko');
const alphavantageService = require('../services/alphavantage');
const rateLimit = require('express-rate-limit');

// Rate limiting: Disabled in development, enabled in production
// In development, we rely on caching to prevent excessive API calls
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // Very high limit in dev
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting entirely in development
  skip: (req) => {
    return process.env.NODE_ENV !== 'production';
  }
});

// Only apply rate limiting in production
if (process.env.NODE_ENV === 'production') {
  router.use(limiter);
}

/**
 * GET /api/markets/price/:type/:symbol
 * Get current price for a crypto or stock
 * @param {string} type - 'crypto' or 'stock'
 * @param {string} symbol - Symbol (e.g., 'BTC', 'AAPL')
 */
router.get('/price/:type/:symbol', async (req, res) => {
  try {
    const { type, symbol } = req.params;
    console.log(`[Markets API] Fetching price for ${type}:${symbol}`);

    if (!['crypto', 'stock'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be "crypto" or "stock"' });
    }

    let priceData;
    if (type === 'crypto') {
      priceData = await coingeckoService.getCurrentPrice(symbol);
    } else {
      // Check if Alpha Vantage API key is configured
      if (!process.env.ALPHAVANTAGE_API_KEY) {
        return res.status(503).json({ 
          error: 'Stock data is not available. Please configure ALPHAVANTAGE_API_KEY in backend/.env file. Get a free key at https://www.alphavantage.co/support/#api-key' 
        });
      }
      priceData = await alphavantageService.getCurrentPrice(symbol);
    }

    console.log(`[Markets API] Returning price data:`, priceData);
    res.json(priceData);
  } catch (error) {
    console.error('Error fetching price:', error);
    // Check if it's an API key error
    if (error.message.includes('API key not configured')) {
      return res.status(503).json({ 
        error: 'Stock data is not available. Please configure ALPHAVANTAGE_API_KEY in backend/.env file.' 
      });
    }
    const statusCode = error.message.includes('not found') || error.message.includes('rate limit') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * GET /api/markets/historical/:type/:symbol
 * Get historical price data for charting
 * @param {string} type - 'crypto' or 'stock'
 * @param {string} symbol - Symbol
 * @query {string} timeframe - Timeframe ('1m', '1h', '1d')
 * @query {number} days - Number of days (for crypto, default: 30)
 */
router.get('/historical/:type/:symbol', async (req, res) => {
  try {
    const { type, symbol } = req.params;
    const { timeframe = '1d', days = 30 } = req.query;

    // Validate symbol
    if (!symbol || symbol.trim().length < 2) {
      return res.status(400).json({ error: 'Invalid symbol. Symbol must be at least 2 characters.' });
    }

    if (!['crypto', 'stock'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be "crypto" or "stock"' });
    }

    let historicalData;
    if (type === 'crypto') {
      historicalData = await coingeckoService.getHistoricalData(symbol.trim().toLowerCase(), timeframe, parseInt(days));
    } else {
      historicalData = await alphavantageService.getHistoricalData(symbol.trim().toUpperCase(), timeframe);
    }

    res.json(historicalData);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * GET /api/markets/search/:type
 * Search for cryptos or stocks
 * @param {string} type - 'crypto' or 'stock'
 * @query {string} q - Search query
 */
router.get('/search/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    if (!['crypto', 'stock'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be "crypto" or "stock"' });
    }

    let results;
    if (type === 'crypto') {
      const allCryptos = await coingeckoService.getSupportedCryptos();
      const query = q.toLowerCase();
      results = allCryptos.filter(crypto =>
        crypto.symbol.toLowerCase().includes(query) ||
        crypto.name.toLowerCase().includes(query)
      ).slice(0, 20); // Limit to 20 results
    } else {
      results = await alphavantageService.searchStocks(q);
    }

    res.json({ results });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

