const axios = require('axios');
const { getIO } = require('./socket');

const BASE_URL = 'https://api.coingecko.com/api/v3';

/**
 * Fetch current price for a cryptocurrency
 * @param {string} symbol - Cryptocurrency symbol (e.g., 'bitcoin', 'ethereum')
 * @returns {Promise<Object>} Price data
 */
async function getCurrentPrice(symbol) {
  try {
    const response = await axios.get(`${BASE_URL}/simple/price`, {
      params: {
        ids: symbol.toLowerCase(),
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_24hr_vol: true,
        include_market_cap: true
      },
      timeout: 10000
    });

    // Check for rate limit
    if (response.status === 429) {
      throw new Error('CoinGecko API rate limit exceeded. Please wait a moment and try again.');
    }

    const data = response.data[symbol.toLowerCase()];
    if (!data) {
      throw new Error(`Cryptocurrency "${symbol}" not found. Try: bitcoin, ethereum, cardano, etc.`);
    }

    console.log(`CoinGecko raw data for ${symbol}:`, data);

    const result = {
      symbol: symbol.toUpperCase(),
      price: data.usd,
      change24h: data.usd_24h_change || 0,
      volume24h: data.usd_24h_vol || 0,
      marketCap: data.usd_market_cap || 0,
      timestamp: new Date().toISOString()
    };

    console.log(`CoinGecko formatted result for ${symbol}:`, result);

    // Broadcast price update via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`price:${symbol.toUpperCase()}:crypto`).emit('price:update', result);
    }

    return result;
  } catch (error) {
    // Handle rate limiting errors
    if (error.response?.status === 429) {
      console.warn(`CoinGecko rate limit hit for ${symbol}`);
      throw new Error('CoinGecko API rate limit exceeded. Please wait 1-2 minutes and try again.');
    }
    
    console.error(`Error fetching CoinGecko price for ${symbol}:`, error.message);
    throw new Error(`Failed to fetch price for ${symbol}: ${error.message}`);
  }
}

/**
 * Fetch historical price data for charting
 * @param {string} symbol - Cryptocurrency symbol
 * @param {string} timeframe - Timeframe ('1m', '1h', '1d')
 * @param {number} days - Number of days of history
 * @returns {Promise<Array>} Historical price data
 */
async function getHistoricalData(symbol, timeframe = '1d', days = 30) {
  try {
    // Map timeframe to days
    const daysMap = {
      '1m': 1,
      '1h': 7,
      '1d': days
    };
    const requestedDays = daysMap[timeframe] || days;

    const response = await axios.get(`${BASE_URL}/coins/${symbol.toLowerCase()}/ohlc`, {
      params: {
        vs_currency: 'usd',
        days: requestedDays
      },
      timeout: 15000,
      validateStatus: (status) => {
        // Don't throw for 429, handle it manually
        return status < 500;
      }
    });

    // Check for rate limit or error responses (CoinGecko returns error in response.data.status)
    if (response.data.status && response.data.status.error_code) {
      if (response.data.status.error_code === 429) {
        throw new Error('CoinGecko API rate limit exceeded. Free tier allows ~10-50 calls/minute. Please wait a moment and try again.');
      }
      throw new Error(`CoinGecko API error: ${response.data.status.error_message || 'Unknown error'}`);
    }

    // Check if response is an array
    if (!Array.isArray(response.data)) {
      console.error('Unexpected CoinGecko response format:', response.data);
      throw new Error('Invalid response format from CoinGecko API. This may be due to rate limiting.');
    }

    // Format data for Plotly candlestick chart
    // CoinGecko returns: [timestamp, open, high, low, close]
    const formatted = response.data.map(([timestamp, open, high, low, close]) => {
      if (!timestamp || open === undefined || high === undefined || low === undefined || close === undefined) {
        throw new Error('Invalid data format in CoinGecko response');
      }
      return {
        time: new Date(timestamp).toISOString(),
        open,
        high,
        low,
        close,
        volume: 0 // CoinGecko OHLC doesn't include volume in this endpoint
      };
    });

    return {
      symbol: symbol.toUpperCase(),
      timeframe,
      data: formatted,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching CoinGecko historical data for ${symbol}:`, error.message);
    console.error('Full error:', error.response?.data || error);
    
    // Check for rate limit errors (429)
    if (error.response?.status === 429 || error.response?.data?.status?.error_code === 429) {
      throw new Error('CoinGecko API rate limit exceeded. Free tier allows ~10-50 calls/minute. Please wait 1-2 minutes and try again.');
    }
    
    // Check for specific error messages in response
    if (error.response?.data?.status?.error_message) {
      throw new Error(`CoinGecko API: ${error.response.data.status.error_message}`);
    }
    
    // Check for network/timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Request timeout. CoinGecko API may be slow. Please try again.');
    }
    
    // Re-throw if it's already a formatted error
    if (error.message.includes('CoinGecko API')) {
      throw error;
    }
    
    throw new Error(`Failed to fetch historical data for ${symbol}: ${error.message}`);
  }
}

/**
 * Get list of supported cryptocurrencies
 * @returns {Promise<Array>} List of cryptocurrencies
 */
async function getSupportedCryptos() {
  try {
    const response = await axios.get(`${BASE_URL}/coins/list`, {
      params: {
        include_platform: false
      },
      timeout: 10000
    });

    return response.data.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name
    }));
  } catch (error) {
    console.error('Error fetching supported cryptos:', error.message);
    throw new Error(`Failed to fetch supported cryptocurrencies: ${error.message}`);
  }
}

module.exports = {
  getCurrentPrice,
  getHistoricalData,
  getSupportedCryptos
};

