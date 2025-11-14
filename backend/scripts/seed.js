/**
 * Seed script to populate database with sample users and portfolios
 * 
 * Note: This script uses the in-memory storage for demonstration.
 * In production, this should write to Firebase Firestore/RealtimeDB.
 * 
 * Usage: node scripts/seed.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001';

// Sample users and their initial portfolios
const sampleUsers = [
  {
    userId: 'user1',
    username: 'TraderJoe',
    email: 'joe@example.com',
    initialHoldings: [
      { symbol: 'bitcoin', type: 'crypto', quantity: 0.5, price: 45000 },
      { symbol: 'ethereum', type: 'crypto', quantity: 2, price: 3000 },
      { symbol: 'AAPL', type: 'stock', quantity: 10, price: 150 }
    ]
  },
  {
    userId: 'user2',
    username: 'CryptoKing',
    email: 'king@example.com',
    initialHoldings: [
      { symbol: 'bitcoin', type: 'crypto', quantity: 1, price: 50000 },
      { symbol: 'ethereum', type: 'crypto', quantity: 5, price: 3200 }
    ]
  },
  {
    userId: 'user3',
    username: 'StockMaster',
    email: 'master@example.com',
    initialHoldings: [
      { symbol: 'AAPL', type: 'stock', quantity: 50, price: 150 },
      { symbol: 'MSFT', type: 'stock', quantity: 30, price: 350 },
      { symbol: 'GOOGL', type: 'stock', quantity: 20, price: 2500 }
    ]
  },
  {
    userId: 'user4',
    username: 'Diversified',
    email: 'diversified@example.com',
    initialHoldings: [
      { symbol: 'bitcoin', type: 'crypto', quantity: 0.25, price: 48000 },
      { symbol: 'AAPL', type: 'stock', quantity: 15, price: 155 },
      { symbol: 'TSLA', type: 'stock', quantity: 5, price: 800 }
    ]
  }
];

async function seedPortfolios() {
  console.log('Starting seed process...\n');

  for (const user of sampleUsers) {
    console.log(`Creating portfolio for ${user.username} (${user.userId})...`);

    try {
      // Create buy orders for each holding
      for (const holding of user.initialHoldings) {
        try {
          const response = await axios.post(
            `${API_URL}/api/portfolio/${user.userId}/buy`,
            {
              symbol: holding.symbol,
              type: holding.type,
              quantity: holding.quantity,
              price: holding.price
            }
          );

          console.log(`  ✓ Bought ${holding.quantity} ${holding.symbol} at $${holding.price}`);
        } catch (error) {
          console.error(`  ✗ Failed to buy ${holding.symbol}:`, error.response?.data?.error || error.message);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Update leaderboard
      try {
        const portfolioResponse = await axios.get(`${API_URL}/api/portfolio/${user.userId}`);
        const portfolio = portfolioResponse.data;

        await axios.post(`${API_URL}/api/leaderboard/update`, {
          userId: user.userId,
          username: user.username,
          totalValue: portfolio.totalValue,
          change24h: 0
        });

        console.log(`  ✓ Updated leaderboard for ${user.username}`);
      } catch (error) {
        console.error(`  ✗ Failed to update leaderboard:`, error.response?.data?.error || error.message);
      }

      console.log(`✓ Completed portfolio for ${user.username}\n`);
    } catch (error) {
      console.error(`✗ Error processing ${user.username}:`, error.message);
    }
  }

  console.log('Seed process completed!');
  console.log('\nYou can now view the leaderboard at: http://localhost:3001/api/leaderboard');
}

// Check if backend is running
async function checkBackend() {
  try {
    const response = await axios.get(`${API_URL}/health`);
    console.log('✓ Backend is running\n');
    return true;
  } catch (error) {
    console.error('✗ Backend is not running. Please start the backend server first.');
    console.error(`  Expected URL: ${API_URL}/health`);
    process.exit(1);
  }
}

// Run seed
(async () => {
  await checkBackend();
  await seedPortfolios();
})();

