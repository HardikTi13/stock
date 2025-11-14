import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Market API
export const marketAPI = {
  getPrice: (type, symbol) => api.get(`/api/markets/price/${type}/${symbol}`),
  getHistorical: (type, symbol, timeframe = '1d', days = 30) =>
    api.get(`/api/markets/historical/${type}/${symbol}`, {
      params: { timeframe, days }
    }),
  search: (type, query) =>
    api.get(`/api/markets/search/${type}`, { params: { q: query } })
};

// Portfolio API
export const portfolioAPI = {
  getPortfolio: (userId) => api.get(`/api/portfolio/${userId}`),
  buy: (userId, symbol, type, quantity, price) =>
    api.post(`/api/portfolio/${userId}/buy`, {
      symbol,
      type,
      quantity,
      price
    }),
  sell: (userId, symbol, type, quantity, price) =>
    api.post(`/api/portfolio/${userId}/sell`, {
      symbol,
      type,
      quantity,
      price
    }),
  updateCash: (userId, operation, amount) =>
    api.post(`/api/portfolio/${userId}/cash`, {
      operation,
      amount
    })
};

// Leaderboard API
export const leaderboardAPI = {
  getLeaderboard: (limit = 100) =>
    api.get('/api/leaderboard', { params: { limit } })
};

export default api;

