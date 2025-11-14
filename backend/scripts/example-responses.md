# Example API Responses

## Market Price Endpoints

### GET /api/markets/price/crypto/bitcoin

```json
{
  "symbol": "BITCOIN",
  "price": 43250.50,
  "change24h": 2.45,
  "volume24h": 28500000000,
  "marketCap": 850000000000,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/markets/price/stock/AAPL

```json
{
  "symbol": "AAPL",
  "price": 185.25,
  "change": 1.50,
  "changePercent": 0.82,
  "volume": 45234567,
  "high": 186.00,
  "low": 183.50,
  "open": 184.00,
  "previousClose": 183.75,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Historical Data Endpoints

### GET /api/markets/historical/crypto/bitcoin?timeframe=1d&days=7

```json
{
  "symbol": "BITCOIN",
  "timeframe": "1d",
  "data": [
    {
      "time": "2024-01-08T00:00:00.000Z",
      "open": 42000.00,
      "high": 43500.00,
      "low": 41800.00,
      "close": 43000.00,
      "volume": 0
    },
    {
      "time": "2024-01-09T00:00:00.000Z",
      "open": 43000.00,
      "high": 44000.00,
      "low": 42800.00,
      "close": 43500.00,
      "volume": 0
    }
    // ... more data points
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/markets/historical/stock/AAPL?timeframe=1d

```json
{
  "symbol": "AAPL",
  "timeframe": "1d",
  "data": [
    {
      "time": "2024-01-08T00:00:00.000Z",
      "open": 180.50,
      "high": 182.00,
      "low": 179.50,
      "close": 181.25,
      "volume": 45234567
    }
    // ... more data points
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Search Endpoints

### GET /api/markets/search/crypto?q=bitcoin

```json
{
  "results": [
    {
      "id": "bitcoin",
      "symbol": "BTC",
      "name": "Bitcoin"
    },
    {
      "id": "bitcoin-cash",
      "symbol": "BCH",
      "name": "Bitcoin Cash"
    }
  ]
}
```

### GET /api/markets/search/stock?q=apple

```json
{
  "results": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "type": "Equity",
      "region": "United States"
    }
  ]
}
```

## Portfolio Endpoints

### GET /api/portfolio/user123

```json
{
  "holdings": [
    {
      "symbol": "BTC",
      "type": "crypto",
      "quantity": 0.5,
      "avgPrice": 45000,
      "currentPrice": 43250.50,
      "currentValue": 21625.25
    },
    {
      "symbol": "AAPL",
      "type": "stock",
      "quantity": 10,
      "avgPrice": 150,
      "currentPrice": 185.25,
      "currentValue": 1852.50
    }
  ],
  "cash": 7500.25,
  "totalValue": 30977.75,
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

### POST /api/portfolio/user123/buy

**Request:**
```json
{
  "symbol": "BTC",
  "type": "crypto",
  "quantity": 0.1,
  "price": 50000
}
```

**Response:**
```json
{
  "success": true,
  "portfolio": {
    "holdings": [
      {
        "symbol": "BTC",
        "type": "crypto",
        "quantity": 0.6,
        "avgPrice": 45833.33,
        "currentPrice": 50000,
        "currentValue": 30000
      }
    ],
    "cash": 2500.25,
    "totalValue": 32500.25
  },
  "transaction": {
    "type": "buy",
    "symbol": "BTC",
    "quantity": 0.1,
    "price": 50000,
    "totalCost": 5000,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### POST /api/portfolio/user123/sell

**Request:**
```json
{
  "symbol": "BTC",
  "type": "crypto",
  "quantity": 0.2,
  "price": 55000
}
```

**Response:**
```json
{
  "success": true,
  "portfolio": {
    "holdings": [
      {
        "symbol": "BTC",
        "type": "crypto",
        "quantity": 0.4,
        "avgPrice": 45833.33,
        "currentPrice": 55000,
        "currentValue": 22000
      }
    ],
    "cash": 13500.25,
    "totalValue": 35500.25
  },
  "transaction": {
    "type": "sell",
    "symbol": "BTC",
    "quantity": 0.2,
    "price": 55000,
    "totalRevenue": 11000,
    "profit": 1833.33,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Leaderboard Endpoints

### GET /api/leaderboard?limit=10

```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user2",
      "username": "CryptoKing",
      "totalValue": 125000.50,
      "change24h": 5.25,
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    },
    {
      "rank": 2,
      "userId": "user1",
      "username": "TraderJoe",
      "totalValue": 95000.75,
      "change24h": 2.10,
      "lastUpdated": "2024-01-15T10:30:00.000Z"
    }
    // ... more entries
  ]
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Missing required fields: symbol, type, quantity, price"
}
```

### 404 Not Found

```json
{
  "error": "Portfolio not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to fetch price for BTC: Alpha Vantage API rate limit exceeded"
}
```

## WebSocket Events

### Client → Server

**Subscribe to price updates:**
```javascript
socket.emit('subscribe:price', {
  symbol: 'BTC',
  type: 'crypto'
});
```

**Unsubscribe from price updates:**
```javascript
socket.emit('unsubscribe:price', {
  symbol: 'BTC',
  type: 'crypto'
});
```

### Server → Client

**Price update:**
```javascript
socket.on('price:update', (data) => {
  // data: {
  //   symbol: "BTC",
  //   price: 43250.50,
  //   change24h: 2.45,
  //   timestamp: "2024-01-15T10:30:00.000Z"
  // }
});
```

**Portfolio update:**
```javascript
socket.on('portfolio:update', (portfolio) => {
  // portfolio: {
  //   holdings: [...],
  //   cash: 7500.25,
  //   totalValue: 30977.75,
  //   lastUpdated: "2024-01-15T10:30:00.000Z"
  // }
});
```

