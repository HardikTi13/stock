const request = require('supertest');
const express = require('express');
const portfolioRoutes = require('../routes/portfolio');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/portfolio', portfolioRoutes);

describe('Portfolio Routes', () => {
  const testUserId = 'test-user-123';

  describe('GET /api/portfolio/:userId', () => {
    it('should return portfolio for user', async () => {
      const response = await request(app)
        .get(`/api/portfolio/${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('holdings');
      expect(response.body).toHaveProperty('cash');
      expect(response.body).toHaveProperty('totalValue');
      expect(Array.isArray(response.body.holdings)).toBe(true);
    });
  });

  describe('POST /api/portfolio/:userId/buy', () => {
    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post(`/api/portfolio/${testUserId}/buy`)
        .send({ symbol: 'BTC' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should execute buy order', async () => {
      const response = await request(app)
        .post(`/api/portfolio/${testUserId}/buy`)
        .send({
          symbol: 'BTC',
          type: 'crypto',
          quantity: 0.1,
          price: 50000
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('portfolio');
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction.type).toBe('buy');
    });

    it('should return 400 for insufficient funds', async () => {
      // First, drain the cash
      await request(app)
        .post(`/api/portfolio/${testUserId}/buy`)
        .send({
          symbol: 'ETH',
          type: 'crypto',
          quantity: 100,
          price: 10000
        });

      const response = await request(app)
        .post(`/api/portfolio/${testUserId}/buy`)
        .send({
          symbol: 'BTC',
          type: 'crypto',
          quantity: 1,
          price: 100000
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Insufficient funds');
    });
  });

  describe('POST /api/portfolio/:userId/sell', () => {
    it('should return 404 for non-existent portfolio', async () => {
      const response = await request(app)
        .post('/api/portfolio/non-existent/sell')
        .send({
          symbol: 'BTC',
          type: 'crypto',
          quantity: 0.1,
          price: 50000
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should execute sell order', async () => {
      // First, buy some BTC
      await request(app)
        .post(`/api/portfolio/${testUserId}/buy`)
        .send({
          symbol: 'BTC',
          type: 'crypto',
          quantity: 0.5,
          price: 50000
        });

      const response = await request(app)
        .post(`/api/portfolio/${testUserId}/sell`)
        .send({
          symbol: 'BTC',
          type: 'crypto',
          quantity: 0.2,
          price: 55000
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.transaction.type).toBe('sell');
      expect(response.body.transaction).toHaveProperty('profit');
    });
  });
});

