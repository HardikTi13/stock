# Crypto & Stock Market Tracker

A full-stack real-time market tracking application with portfolio management, interactive charts, and leaderboard features. Built with React, Node.js, Express, Socket.IO, Firebase, and Plotly.js.

## Features

- **Real-time Market Data**: Live price updates for cryptocurrencies (via CoinGecko) and stocks (via Alpha Vantage)
- **Interactive Charts**: Plotly.js charts with candlestick/line modes, SMA/EMA overlays, and multiple timeframes
- **Portfolio Management**: Buy/sell assets, track holdings, and monitor P&L
- **Leaderboard**: Rank users by portfolio value
- **Firebase Authentication**: Secure user authentication and data persistence
- **WebSocket Updates**: Real-time price and portfolio updates via Socket.IO
- **Responsive UI**: Modern, mobile-friendly interface built with Material-UI

## Architecture

```
┌─────────────────┐
│   React Client  │
│  (Port 3000)    │
└────────┬────────┘
         │
         │ HTTP/REST API
         │ WebSocket (Socket.IO)
         │
┌────────▼────────┐
│  Express API   │
│  (Port 3001)   │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    │         │              │
┌───▼───┐ ┌──▼───┐    ┌─────▼─────┐
│CoinGecko│ │Alpha │    │  Firebase │
│  API    │ │Vantage│    │  (Auth + │
│         │ │ API  │    │  Database)│
└─────────┘ └──────┘    └──────────┘
```

### Data Flow

1. **Frontend → Backend**: REST API calls for market data, portfolio operations
2. **Backend → Third-party APIs**: CoinGecko (crypto) and Alpha Vantage (stocks)
3. **Backend → Frontend**: WebSocket broadcasts for real-time price updates
4. **Frontend ↔ Firebase**: Authentication and portfolio/leaderboard persistence
5. **Caching**: Backend caches API responses with TTLs (15s real-time, 60s hourly, 5m daily)

## Prerequisites

- Node.js 18+ and npm
- Firebase project (for authentication and database)
- Alpha Vantage API key (free tier available at [alphavantage.co](https://www.alphavantage.co/support/#api-key))
- Docker (optional, for containerized deployment)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd crypto-stock-tracker
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
PORT=3001
NODE_ENV=development
ALPHAVANTAGE_API_KEY=your_alpha_vantage_api_key_here
CORS_ORIGIN=http://localhost:3000
```

Start the backend:

```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env` and add your Firebase configuration:

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SOCKET_URL=http://localhost:3001
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

**How to get Firebase credentials:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to Project Settings → General
4. Scroll down to "Your apps" and click the web icon (`</>`)
5. Register your app and copy the configuration values
6. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password" provider
7. (Optional) Set up Firestore or Realtime Database for portfolio persistence

Start the frontend:

```bash
npm start
```

The frontend will run on `http://localhost:3000`

### 4. Seed Data (Optional)

To populate the database with sample users and portfolios:

```bash
cd backend
node scripts/seed.js
```

## Environment Variables

### Backend (.env)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment | No | development |
| `ALPHAVANTAGE_API_KEY` | Alpha Vantage API key | Yes | - |
| `CORS_ORIGIN` | Frontend URL | No | http://localhost:3000 |
| `CACHE_TTL_REALTIME` | Cache TTL for real-time data (seconds) | No | 15 |
| `CACHE_TTL_HOURLY` | Cache TTL for hourly data (seconds) | No | 60 |
| `CACHE_TTL_DAILY` | Cache TTL for daily data (seconds) | No | 300 |

### Frontend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API URL | Yes |
| `REACT_APP_SOCKET_URL` | WebSocket server URL | Yes |
| `REACT_APP_FIREBASE_API_KEY` | Firebase API key | Yes |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `REACT_APP_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `REACT_APP_FIREBASE_APP_ID` | Firebase app ID | Yes |

## API Endpoints

### Market Data

- `GET /api/markets/price/:type/:symbol` - Get current price
  - Example: `GET /api/markets/price/crypto/bitcoin`
  - Example: `GET /api/markets/price/stock/AAPL`

- `GET /api/markets/historical/:type/:symbol?timeframe=1d&days=30` - Get historical data
  - Timeframes: `1m`, `1h`, `1d`
  - Example: `GET /api/markets/historical/crypto/bitcoin?timeframe=1d&days=30`

- `GET /api/markets/search/:type?q=query` - Search for assets
  - Example: `GET /api/markets/search/crypto?q=bitcoin`

### Portfolio

- `GET /api/portfolio/:userId` - Get user portfolio
- `POST /api/portfolio/:userId/buy` - Buy asset
  ```json
  {
    "symbol": "BTC",
    "type": "crypto",
    "quantity": 0.1,
    "price": 50000
  }
  ```
- `POST /api/portfolio/:userId/sell` - Sell asset
  ```json
  {
    "symbol": "BTC",
    "type": "crypto",
    "quantity": 0.05,
    "price": 55000
  }
  ```

### Leaderboard

- `GET /api/leaderboard?limit=100` - Get leaderboard

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Example cURL Commands

```bash
# Get Bitcoin price
curl http://localhost:3001/api/markets/price/crypto/bitcoin

# Get Apple stock price
curl http://localhost:3001/api/markets/price/stock/AAPL

# Get historical data
curl "http://localhost:3001/api/markets/historical/crypto/bitcoin?timeframe=1d&days=7"

# Search for cryptos
curl "http://localhost:3001/api/markets/search/crypto?q=bitcoin"
```

## Docker Deployment

### Build Backend Image

```bash
cd backend
docker build -t crypto-tracker-backend .
docker run -p 3001:3001 --env-file .env crypto-tracker-backend
```

### Build Frontend Image

```bash
cd frontend
docker build -t crypto-tracker-frontend .
docker run -p 80:80 crypto-tracker-frontend
```

### Docker Compose (Optional)

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    env_file:
      - ./backend/.env
    environment:
      - NODE_ENV=production

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://localhost:3001
```

Run with: `docker-compose up`

## API Rate Limits & Caching

### CoinGecko
- **Rate Limit**: 10-50 calls/minute (free tier)
- **No API key required**
- **Caching**: Implemented with configurable TTLs

### Alpha Vantage
- **Rate Limit**: 5 API calls/minute, 500 calls/day (free tier)
- **API key required**
- **Caching**: Critical to avoid rate limit errors
- **Note**: The backend caches responses to minimize API calls

### Cache TTLs
- Real-time (1m): 15 seconds
- Hourly (1h): 60 seconds
- Daily (1d): 5 minutes

## Project Structure

```
crypto-stock-tracker/
├── backend/
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic (CoinGecko, Alpha Vantage, cache)
│   ├── tests/           # Jest tests
│   ├── scripts/         # Utility scripts (seed data, etc.)
│   ├── server.js        # Express server entry point
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API and Socket.IO clients
│   │   ├── contexts/   # React contexts (Auth)
│   │   ├── config/     # Configuration (Firebase)
│   │   └── App.js
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
└── README.md
```

## Production Considerations

### Security
- [ ] Add authentication middleware to backend routes
- [ ] Implement rate limiting per user (not just IP)
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS
- [ ] Add CORS whitelist for production domains
- [ ] Implement Firebase Admin SDK for backend auth verification

### Database
- [ ] Replace in-memory storage with Firebase Firestore/RealtimeDB
- [ ] Add database indexes for queries
- [ ] Implement data validation and sanitization
- [ ] Add transaction history persistence

### Performance
- [ ] Implement Redis for distributed caching
- [ ] Add database connection pooling
- [ ] Optimize bundle size (code splitting)
- [ ] Add CDN for static assets
- [ ] Implement pagination for large datasets

### Monitoring
- [ ] Add logging (Winston, Pino)
- [ ] Set up error tracking (Sentry)
- [ ] Add health check endpoints
- [ ] Monitor API rate limit usage
- [ ] Track performance metrics

## TODO & Future Features

### High Priority
- [ ] **Firebase Integration**: Replace in-memory storage with Firestore/RealtimeDB
- [ ] **Authentication Middleware**: Verify Firebase tokens on backend
- [ ] **Transaction History**: Persist buy/sell transactions
- [ ] **Error Handling**: Comprehensive error boundaries and user feedback
- [ ] **Input Validation**: Validate all user inputs on frontend and backend

### Medium Priority
- [ ] **Push Notifications**: Price alerts and portfolio updates
- [ ] **Paper Trading Rules**: Implement realistic trading constraints
- [ ] **Order Types**: Limit orders, stop-loss, take-profit
- [ ] **Portfolio Analytics**: Performance charts, asset allocation
- [ ] **Watchlists**: Save favorite assets for quick access

### Low Priority
- [ ] **Backtesting**: Test trading strategies on historical data
- [ ] **Social Features**: Share portfolios, follow other traders
- [ ] **Mobile App**: React Native version
- [ ] **Advanced Charts**: More technical indicators (RSI, MACD, Bollinger Bands)
- [ ] **Multi-currency Support**: Track portfolios in different currencies
- [ ] **Export Data**: CSV/PDF export of portfolio and transactions

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Change PORT in .env or kill the process using port 3001
lsof -ti:3001 | xargs kill -9
```

**Alpha Vantage rate limit:**
- Check cache is working (responses should be cached)
- Reduce request frequency
- Consider upgrading API tier

**Socket.IO connection issues:**
- Verify CORS_ORIGIN matches frontend URL
- Check firewall settings
- Ensure WebSocket support in browser

### Frontend Issues

**Firebase auth errors:**
- Verify all Firebase env variables are set
- Check Firebase project settings
- Ensure Email/Password auth is enabled

**API connection errors:**
- Verify REACT_APP_API_URL points to backend
- Check backend is running
- Verify CORS settings

**Chart not loading:**
- Check browser console for errors
- Verify symbol format (lowercase for crypto, uppercase for stocks)
- Check API rate limits

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Support

For issues and questions, please open an issue on GitHub.

