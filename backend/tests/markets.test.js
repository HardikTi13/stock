const request = require('supertest');
const express = require('express');
const marketRoutes = require('../routes/markets');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/markets', marketRoutes);

describe('Market Routes', () => {
  describe('GET /api/markets/price/:type/:symbol', () => {
    it('should return 400 for invalid type', async () => {
      const response = await request(app)
        .get('/api/markets/price/invalid/BTC')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fetch crypto price', async () => {
      const response = await request(app)
        .get('/api/markets/price/crypto/bitcoin')
        .expect(200);

      expect(response.body).toHaveProperty('symbol');
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('timestamp');
    }, 15000); // Increase timeout for API calls

    it('should handle errors gracefully', async () => {
      const response = await request(app)
        .get('/api/markets/price/crypto/invalid_symbol_xyz')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    }, 15000);
  });

  describe('GET /api/markets/historical/:type/:symbol', () => {
    it('should return 400 for invalid type', async () => {
      const response = await request(app)
        .get('/api/markets/historical/invalid/BTC')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fetch crypto historical data', async () => {
      const response = await request(app)
        .get('/api/markets/historical/crypto/bitcoin?timeframe=1d&days=7')
        .expect(200);

      expect(response.body).toHaveProperty('symbol');
      expect(response.body).toHaveProperty('timeframe');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    }, 20000);
  });

  describe('GET /api/markets/search/:type', () => {
    it('should return 400 if query is missing', async () => {
      const response = await request(app)
        .get('/api/markets/search/crypto')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should search for cryptos', async () => {
      const response = await request(app)
        .get('/api/markets/search/crypto?q=bitcoin')
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    }, 20000);
  });
});

