const express = require('express');
const router = express.Router();
const coingeckoService = require('../services/coingecko');
const alphavantageService = require('../services/alphavantage');
const { getIO } = require('../services/socket');

// TODO: In production, add authentication middleware to verify Firebase tokens
// TODO: In production, connect to Firebase Firestore/RealtimeDB to persist portfolios
// For now, we'll use in-memory storage (replace with Firebase in production)

// In-memory portfolio storage (replace with Firebase in production)
const portfolios = new Map();

/**
 * GET /api/portfolio/:userId
 * Get user's portfolio
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const portfolio = portfolios.get(userId) || { holdings: [], cash: 10000, totalValue: 10000 };

    // Calculate current portfolio value
    let totalValue = portfolio.cash;
    for (const holding of portfolio.holdings) {
      try {
        let priceData;
        if (holding.type === 'crypto') {
          priceData = await coingeckoService.getCurrentPrice(holding.symbol.toLowerCase());
        } else {
          priceData = await alphavantageService.getCurrentPrice(holding.symbol);
        }
        holding.currentPrice = priceData.price;
        holding.currentValue = holding.quantity * priceData.price;
        totalValue += holding.currentValue;
      } catch (error) {
        console.error(`Error fetching price for ${holding.symbol}:`, error);
        holding.currentPrice = holding.avgPrice || 0;
        holding.currentValue = holding.quantity * (holding.avgPrice || 0);
        totalValue += holding.currentValue;
      }
    }

    portfolio.totalValue = totalValue;
    portfolio.lastUpdated = new Date().toISOString();

    // Broadcast portfolio update via Socket.IO
    const io = getIO();
    io.to(`portfolio:${userId}`).emit('portfolio:update', portfolio);

    res.json(portfolio);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/portfolio/:userId/buy
 * Buy an asset
 * Body: { symbol, type, quantity, price }
 */
router.post('/:userId/buy', async (req, res) => {
  try {
    const { userId } = req.params;
    const { symbol, type, quantity, price } = req.body;

    if (!symbol || !type || !quantity || !price) {
      return res.status(400).json({ error: 'Missing required fields: symbol, type, quantity, price' });
    }

    if (!['crypto', 'stock'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be "crypto" or "stock"' });
    }

    const portfolio = portfolios.get(userId) || { holdings: [], cash: 10000, totalValue: 10000 };
    const totalCost = quantity * price;

    if (portfolio.cash < totalCost) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Update cash
    portfolio.cash -= totalCost;

    // Update or add holding
    const existingHolding = portfolio.holdings.find(
      h => h.symbol === symbol.toUpperCase() && h.type === type
    );

    if (existingHolding) {
      const totalQuantity = existingHolding.quantity + quantity;
      const totalCostBasis = existingHolding.avgPrice * existingHolding.quantity + totalCost;
      existingHolding.quantity = totalQuantity;
      existingHolding.avgPrice = totalCostBasis / totalQuantity;
    } else {
      portfolio.holdings.push({
        symbol: symbol.toUpperCase(),
        type,
        quantity,
        avgPrice: price,
        currentPrice: price,
        currentValue: quantity * price
      });
    }

    portfolios.set(userId, portfolio);

    // Broadcast portfolio update
    const io = getIO();
    if (io) {
      io.to(`portfolio:${userId}`).emit('portfolio:update', portfolio);
    }

    res.json({
      success: true,
      portfolio,
      transaction: {
        type: 'buy',
        symbol: symbol.toUpperCase(),
        quantity,
        price,
        totalCost,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error executing buy order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/portfolio/:userId/sell
 * Sell an asset
 * Body: { symbol, type, quantity, price }
 */
router.post('/:userId/sell', async (req, res) => {
  try {
    const { userId } = req.params;
    const { symbol, type, quantity, price } = req.body;

    if (!symbol || !type || !quantity || !price) {
      return res.status(400).json({ error: 'Missing required fields: symbol, type, quantity, price' });
    }

    if (!['crypto', 'stock'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be "crypto" or "stock"' });
    }

    const portfolio = portfolios.get(userId);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const holding = portfolio.holdings.find(
      h => h.symbol === symbol.toUpperCase() && h.type === type
    );

    if (!holding) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    if (holding.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient quantity' });
    }

    // Update cash
    const totalRevenue = quantity * price;
    portfolio.cash += totalRevenue;

    // Update holding
    holding.quantity -= quantity;
    if (holding.quantity === 0) {
      portfolio.holdings = portfolio.holdings.filter(
        h => !(h.symbol === symbol.toUpperCase() && h.type === type)
      );
    }

    portfolios.set(userId, portfolio);

    // Broadcast portfolio update
    const io = getIO();
    if (io) {
      io.to(`portfolio:${userId}`).emit('portfolio:update', portfolio);
    }

    res.json({
      success: true,
      portfolio,
      transaction: {
        type: 'sell',
        symbol: symbol.toUpperCase(),
        quantity,
        price,
        totalRevenue,
        profit: (price - holding.avgPrice) * quantity,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error executing sell order:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/portfolio/:userId/cash
 * Update cash balance (add or withdraw)
 * Body: { operation, amount }
 */
router.post('/:userId/cash', async (req, res) => {
  try {
    const { userId } = req.params;
    const { operation, amount } = req.body;

    if (!operation || !amount) {
      return res.status(400).json({ error: 'Missing required fields: operation, amount' });
    }

    if (!['add', 'withdraw'].includes(operation)) {
      return res.status(400).json({ error: 'Invalid operation. Must be "add" or "withdraw"' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const portfolio = portfolios.get(userId) || { holdings: [], cash: 10000, totalValue: 10000 };

    if (operation === 'add') {
      portfolio.cash += parsedAmount;
    } else {
      if (portfolio.cash < parsedAmount) {
        return res.status(400).json({ error: 'Insufficient cash balance' });
      }
      portfolio.cash -= parsedAmount;
    }

    // Recalculate total value
    let totalValue = portfolio.cash;
    for (const holding of portfolio.holdings) {
      totalValue += holding.currentValue || (holding.quantity * holding.avgPrice);
    }
    portfolio.totalValue = totalValue;
    portfolio.lastUpdated = new Date().toISOString();

    portfolios.set(userId, portfolio);

    // Broadcast portfolio update
    const io = getIO();
    if (io) {
      io.to(`portfolio:${userId}`).emit('portfolio:update', portfolio);
    }

    res.json({
      success: true,
      portfolio,
      transaction: {
        type: operation,
        amount: parsedAmount,
        newBalance: portfolio.cash,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating cash balance:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

