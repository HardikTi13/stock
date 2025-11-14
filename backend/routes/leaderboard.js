const express = require('express');
const router = express.Router();

// TODO: In production, connect to Firebase Firestore/RealtimeDB to fetch leaderboard
// For now, we'll use in-memory storage (replace with Firebase in production)

// In-memory leaderboard storage (replace with Firebase in production)
const leaderboard = [];

/**
 * GET /api/leaderboard
 * Get leaderboard sorted by total portfolio value
 * @query {number} limit - Number of entries to return (default: 100)
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const sorted = [...leaderboard]
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        username: entry.username || `User ${entry.userId}`,
        totalValue: entry.totalValue,
        change24h: entry.change24h || 0,
        lastUpdated: entry.lastUpdated
      }));

    res.json({ leaderboard: sorted });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/leaderboard/update
 * Update leaderboard entry (called internally when portfolio changes)
 * Body: { userId, username, totalValue, change24h }
 */
router.post('/update', async (req, res) => {
  try {
    const { userId, username, totalValue, change24h } = req.body;

    if (!userId || totalValue === undefined) {
      return res.status(400).json({ error: 'Missing required fields: userId, totalValue' });
    }

    const existingIndex = leaderboard.findIndex(entry => entry.userId === userId);
    const entry = {
      userId,
      username: username || `User ${userId}`,
      totalValue,
      change24h: change24h || 0,
      lastUpdated: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      leaderboard[existingIndex] = entry;
    } else {
      leaderboard.push(entry);
    }

    res.json({ success: true, entry });
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

