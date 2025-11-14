import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { portfolioAPI, marketAPI } from '../services/api';
import { getSocket } from '../services/socket';

function Portfolio() {
  const { currentUser } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openBuy, setOpenBuy] = useState(false);
  const [openSell, setOpenSell] = useState(false);
  const [openCashManagement, setOpenCashManagement] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [priceError, setPriceError] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [cashOperation, setCashOperation] = useState('add'); // 'add' or 'withdraw'
  const [orderData, setOrderData] = useState({
    symbol: '',
    type: 'crypto',
    quantity: '',
    price: ''
  });

  useEffect(() => {
    if (currentUser) {
      fetchPortfolio();
      const socket = getSocket();
      
      // Join portfolio room for real-time updates
      socket.emit('subscribe:portfolio', { userId: currentUser.uid });

      socket.on('portfolio:update', (updatedPortfolio) => {
        setPortfolio(updatedPortfolio);
      });

      return () => {
        socket.emit('unsubscribe:portfolio', { userId: currentUser.uid });
        socket.off('portfolio:update');
      };
    }
  }, [currentUser]);

  const fetchPortfolio = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const response = await portfolioAPI.getPortfolio(currentUser.uid);
      setPortfolio(response.data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = () => {
    // Open dialog first, then fetch price when symbol is entered
    setPriceError('');
    setOpenBuy(true);
  };

  const fetchPriceForBuy = async () => {
    if (!orderData.symbol || orderData.symbol.trim().length < 2) {
      setPriceError('Please enter a valid symbol (at least 2 characters)');
      return;
    }
    setPriceError('');
    try {
      const response = await marketAPI.getPrice(orderData.type, orderData.symbol.trim());
      setOrderData({ ...orderData, price: response.data.price });
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setPriceError(errorMsg);
    }
  };

  const handleSellClick = (holding) => {
    setSelectedHolding(holding);
    setOrderData({
      symbol: holding.symbol,
      type: holding.type,
      quantity: '',
      price: holding.currentPrice || holding.avgPrice
    });
    setOpenSell(true);
  };

  const executeBuy = async () => {
    if (!orderData.symbol || !orderData.quantity || !orderData.price) {
      setPriceError('Please fill in all fields');
      return;
    }
    try {
      const response = await portfolioAPI.buy(
        currentUser.uid,
        orderData.symbol,
        orderData.type,
        parseFloat(orderData.quantity),
        parseFloat(orderData.price)
      );
      setPortfolio(response.data.portfolio);
      setOpenBuy(false);
      setPriceError('');
      setOrderData({ symbol: '', type: 'crypto', quantity: '', price: '' });
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setPriceError('Failed to execute buy order: ' + errorMsg);
    }
  };

  const executeSell = async () => {
    try {
      const response = await portfolioAPI.sell(
        currentUser.uid,
        orderData.symbol,
        orderData.type,
        parseFloat(orderData.quantity),
        parseFloat(orderData.price)
      );
      setPortfolio(response.data.portfolio);
      setOpenSell(false);
      setSelectedHolding(null);
      setOrderData({ symbol: '', type: 'crypto', quantity: '', price: '' });
    } catch (error) {
      alert('Failed to execute sell order: ' + error.response?.data?.error || error.message);
    }
  };

  const handleCashManagement = () => {
    setCashAmount('');
    setCashOperation('add');
    setOpenCashManagement(true);
  };

  const executeCashOperation = async () => {
    const amount = parseFloat(cashAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    try {
      const response = await portfolioAPI.updateCash(
        currentUser.uid,
        cashOperation,
        amount
      );
      setPortfolio(response.data.portfolio);
      setOpenCashManagement(false);
      setCashAmount('');
    } catch (error) {
      alert('Failed to update cash balance: ' + (error.response?.data?.error || error.message));
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading portfolio...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Portfolio
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Cash Balance
            </Typography>
            <Typography variant="h4" color="primary">
              {formatCurrency(portfolio?.cash || 0)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Portfolio Value
            </Typography>
            <Typography variant="h4" color="success.main">
              {formatCurrency(portfolio?.totalValue || 0)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleBuyClick}
              sx={{ mb: 1 }}
            >
              Buy Crypto
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="success"
              onClick={handleCashManagement}
              sx={{ mb: 1 }}
            >
              Manage Cash
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={fetchPortfolio}
            >
              Refresh
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Avg Price</TableCell>
              <TableCell>Current Price</TableCell>
              <TableCell>Current Value</TableCell>
              <TableCell>P&L</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {portfolio?.holdings?.length > 0 ? (
              portfolio.holdings.map((holding, index) => {
                const pnl = (holding.currentPrice - holding.avgPrice) * holding.quantity;
                const pnlPercent = ((holding.currentPrice - holding.avgPrice) / holding.avgPrice) * 100;

                return (
                  <TableRow key={index}>
                    <TableCell>{holding.symbol}</TableCell>
                    <TableCell>{holding.quantity}</TableCell>
                    <TableCell>{formatCurrency(holding.avgPrice)}</TableCell>
                    <TableCell>{formatCurrency(holding.currentPrice)}</TableCell>
                    <TableCell>{formatCurrency(holding.currentValue)}</TableCell>
                    <TableCell>
                      <Typography
                        color={pnl >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {formatCurrency(pnl)} ({pnlPercent.toFixed(2)}%)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleSellClick(holding)}
                      >
                        Sell
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No holdings. Start by buying crypto!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Buy Dialog */}
      <Dialog open={openBuy} onClose={() => setOpenBuy(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Buy Crypto</DialogTitle>
        <DialogContent>
          {priceError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {priceError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Crypto Symbol"
              value={orderData.symbol}
              onChange={(e) => setOrderData({ ...orderData, symbol: e.target.value })}
              placeholder="bitcoin"
              helperText="Enter crypto ID (e.g., bitcoin, ethereum, cardano, solana)"
            />
            <Button
              variant="outlined"
              onClick={fetchPriceForBuy}
              fullWidth
            >
              Fetch Current Price
            </Button>
            <TextField
              label="Quantity"
              type="number"
              value={orderData.quantity}
              onChange={(e) => setOrderData({ ...orderData, quantity: e.target.value })}
            />
            <TextField
              label="Price per unit"
              type="number"
              value={orderData.price}
              onChange={(e) => setOrderData({ ...orderData, price: e.target.value })}
            />
            {orderData.quantity && orderData.price && (
              <Typography variant="body2" color="text.secondary">
                Total Cost: {formatCurrency(parseFloat(orderData.quantity) * parseFloat(orderData.price))}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBuy(false)}>Cancel</Button>
          <Button onClick={executeBuy} variant="contained" color="primary">
            Buy
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cash Management Dialog */}
      <Dialog open={openCashManagement} onClose={() => setOpenCashManagement(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Cash Balance</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Current Balance: {formatCurrency(portfolio?.cash || 0)}
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Operation</InputLabel>
              <Select
                value={cashOperation}
                onChange={(e) => setCashOperation(e.target.value)}
              >
                <MenuItem value="add">Add Cash</MenuItem>
                <MenuItem value="withdraw">Withdraw Cash</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Amount"
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder="Enter amount"
              inputProps={{ min: 0, step: 0.01 }}
            />
            {cashAmount && (
              <Typography variant="body2" color="text.secondary">
                New Balance: {formatCurrency(
                  (portfolio?.cash || 0) + (cashOperation === 'add' ? parseFloat(cashAmount || 0) : -parseFloat(cashAmount || 0))
                )}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCashManagement(false)}>Cancel</Button>
          <Button onClick={executeCashOperation} variant="contained" color={cashOperation === 'add' ? 'success' : 'warning'}>
            {cashOperation === 'add' ? 'Add Cash' : 'Withdraw Cash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sell Dialog */}
      <Dialog open={openSell} onClose={() => setOpenSell(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sell Asset</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Symbol"
              value={orderData.symbol}
              disabled
            />
            <TextField
              label="Available Quantity"
              value={selectedHolding?.quantity || 0}
              disabled
            />
            <TextField
              label="Quantity to Sell"
              type="number"
              value={orderData.quantity}
              onChange={(e) => setOrderData({ ...orderData, quantity: e.target.value })}
              inputProps={{ max: selectedHolding?.quantity }}
            />
            <TextField
              label="Price per unit"
              type="number"
              value={orderData.price}
              onChange={(e) => setOrderData({ ...orderData, price: e.target.value })}
            />
            {orderData.quantity && orderData.price && (
              <Typography variant="body2" color="text.secondary">
                Total Revenue: {formatCurrency(parseFloat(orderData.quantity) * parseFloat(orderData.price))}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSell(false)}>Cancel</Button>
          <Button onClick={executeSell} variant="contained" color="secondary">
            Sell
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Portfolio;

