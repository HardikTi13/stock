const axios = require('axios');
const cache = require('./cache');
const { getIO } = require('./socket');

const BASE_URL = 'https://www.alphavantage.co/query';
const API_KEY = process.env.ALPHAVANTAGE_API_KEY;

if (!API_KEY) {
  console.warn('Warning: ALPHAVANTAGE_API_KEY not set. Stock data will not be available.');
}

/**
 * Fetch current price for a stock
 * @param {string} symbol - Stock symbol (e.g., 'AAPL', 'MSFT')
 * @returns {Promise<Object>} Price data
 */
async function getCurrentPrice(symbol) {
  if (!API_KEY) {
    throw new Error('Alpha Vantage API key not configured');
  }

  const cacheKey = cache.getCacheKey(symbol, 'stock', 'realtime');
  const ttl = cache.getTTL('realtime');

  return cache.getOrSet(cacheKey, async () => {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol.toUpperCase(),
          apikey: API_KEY
        },
        timeout: 10000
      });

      // Check for API errors
      if (response.data['Error Message']) {
        throw new Error(response.data['Error Message']);
      }

      if (response.data['Note']) {
        throw new Error('Alpha Vantage API rate limit exceeded. Please wait before making another request.');
      }

      const quote = response.data['Global Quote'];
      if (!quote || Object.keys(quote).length === 0) {
        throw new Error(`Stock ${symbol} not found`);
      }

      const result = {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open']),
        previousClose: parseFloat(quote['08. previous close']),
        timestamp: new Date().toISOString()
      };

      // Broadcast price update via Socket.IO
      const io = getIO();
      if (io) {
        io.to(`price:${symbol.toUpperCase()}:stock`).emit('price:update', result);
      }

      return result;
    } catch (error) {
      console.error(`Error fetching Alpha Vantage price for ${symbol}:`, error.message);
      throw new Error(`Failed to fetch price for ${symbol}: ${error.message}`);
    }
  }, ttl);
}

/**
 * Fetch historical price data for charting
 * @param {string} symbol - Stock symbol
 * @param {string} timeframe - Timeframe ('1m', '1h', '1d')
 * @returns {Promise<Array>} Historical price data
 */
async function getHistoricalData(symbol, timeframe = '1d') {
  if (!API_KEY) {
    throw new Error('Alpha Vantage API key not configured');
  }

  const cacheKey = cache.getCacheKey(symbol, 'stock', timeframe);
  const ttl = cache.getTTL(timeframe);

  return cache.getOrSet(cacheKey, async () => {
    try {
      // Map timeframe to Alpha Vantage function
      const functionMap = {
        '1m': 'TIME_SERIES_INTRADAY',
        '1h': 'TIME_SERIES_INTRADAY',
        '1d': 'TIME_SERIES_DAILY_ADJUSTED'
      };

      const intervalMap = {
        '1m': '1min',
        '1h': '60min',
        '1d': null
      };

      const params = {
        function: functionMap[timeframe] || 'TIME_SERIES_DAILY_ADJUSTED',
        symbol: symbol.toUpperCase(),
        apikey: API_KEY,
        outputsize: 'compact' // Use 'full' for more data, but slower
      };

      if (intervalMap[timeframe]) {
        params.interval = intervalMap[timeframe];
      }

      const response = await axios.get(BASE_URL, {
        params,
        timeout: 15000
      });

      // Check for API errors
      if (response.data['Error Message']) {
        throw new Error(response.data['Error Message']);
      }

      if (response.data['Note']) {
        throw new Error('Alpha Vantage API rate limit exceeded. Please wait before making another request.');
      }

      // Extract time series data
      const timeSeriesKey = Object.keys(response.data).find(key => key.includes('Time Series'));
      if (!timeSeriesKey) {
        throw new Error('Invalid response format from Alpha Vantage');
      }

      const timeSeries = response.data[timeSeriesKey];
      const formatted = Object.entries(timeSeries).map(([timestamp, data]) => {
        const open = parseFloat(data['1. open'] || data['1. open']);
        const high = parseFloat(data['2. high'] || data['2. high']);
        const low = parseFloat(data['3. low'] || data['3. low']);
        const close = parseFloat(data['4. close'] || data['5. adjusted close'] || data['4. close']);
        const volume = parseInt(data['5. volume'] || data['6. volume'] || 0);

        return {
          time: new Date(timestamp).toISOString(),
          open,
          high,
          low,
          close,
          volume
        };
      }).reverse(); // Reverse to get chronological order

      return {
        symbol: symbol.toUpperCase(),
        timeframe,
        data: formatted,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching Alpha Vantage historical data for ${symbol}:`, error.message);
      throw new Error(`Failed to fetch historical data for ${symbol}: ${error.message}`);
    }
  }, ttl);
}

/**
 * Search for stocks by symbol or name
 * @param {string} keywords - Search keywords
 * @returns {Promise<Array>} List of matching stocks
 */
async function searchStocks(keywords) {
  if (!API_KEY) {
    throw new Error('Alpha Vantage API key not configured');
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'SYMBOL_SEARCH',
        keywords: keywords,
        apikey: API_KEY
      },
      timeout: 10000
    });

    if (response.data['Error Message']) {
      throw new Error(response.data['Error Message']);
    }

    if (response.data['Note']) {
      throw new Error('Alpha Vantage API rate limit exceeded.');
    }

    const matches = response.data.bestMatches || [];
    return matches.map(match => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region']
    }));
  } catch (error) {
    console.error('Error searching stocks:', error.message);
    throw new Error(`Failed to search stocks: ${error.message}`);
  }
}

module.exports = {
  getCurrentPrice,
  getHistoricalData,
  searchStocks
};

