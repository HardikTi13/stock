const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const marketRoutes = require('./routes/markets');
const portfolioRoutes = require('./routes/portfolio');

const app = express();
const server = http.createServer(app);

// CORS configuration - allow multiple origins
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3001'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow any origin in development
    if (process.env.NODE_ENV === 'development') return callback(null, true);
    // Check allowed origins in production
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
};

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: corsOptions
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/markets', marketRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Subscribe to price updates
  socket.on('subscribe:price', (data) => {
    socket.join(`price:${data.symbol}:${data.type}`);
    console.log(`Client ${socket.id} subscribed to ${data.type}:${data.symbol}`);
  });

  // Unsubscribe from price updates
  socket.on('unsubscribe:price', (data) => {
    socket.leave(`price:${data.symbol}:${data.type}`);
    console.log(`Client ${socket.id} unsubscribed from ${data.type}:${data.symbol}`);
  });

  // Subscribe to portfolio updates
  socket.on('subscribe:portfolio', (data) => {
    socket.join(`portfolio:${data.userId}`);
    console.log(`Client ${socket.id} subscribed to portfolio:${data.userId}`);
  });

  // Unsubscribe from portfolio updates
  socket.on('unsubscribe:portfolio', (data) => {
    socket.leave(`portfolio:${data.userId}`);
    console.log(`Client ${socket.id} unsubscribed from portfolio:${data.userId}`);
  });
});

// Initialize socket service for use in other modules
const socketService = require('./services/socket');
socketService.setIO(io);

// Export io for backward compatibility (if needed)
module.exports.io = io;

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

