import React, { useState } from 'react';
import { Container, Grid, Paper, Typography, Box, TextField, Button, IconButton } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { marketAPI } from '../services/api';

function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchSymbol, setSearchSymbol] = useState('');
  const [cryptoData, setCryptoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchCrypto = async () => {
    if (!searchSymbol || searchSymbol.trim().length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await marketAPI.getPrice('crypto', searchSymbol.trim().toLowerCase());
      console.log('Fetched:', response.data);
      setCryptoData(response.data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch crypto data');
      setCryptoData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchCrypto();
    }
  };

  const viewChart = (symbol) => {
    navigate(`/chart?symbol=${symbol}`);
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(price);
  };

  const formatChange = (change) => {
    if (change === undefined || change === null) return 'N/A';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {currentUser?.displayName || currentUser?.email}!
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Search for any cryptocurrency
      </Typography>

      {/* Search Box */}
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Search Cryptocurrency"
            placeholder="bitcoin, ethereum, cardano, solana..."
            value={searchSymbol}
            onChange={(e) => setSearchSymbol(e.target.value)}
            onKeyPress={handleKeyPress}
            helperText="Enter crypto ID (e.g., bitcoin, ethereum)"
          />
          <Button
            variant="contained"
            onClick={searchCrypto}
            disabled={loading}
            sx={{ minWidth: '120px' }}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </Box>
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>

      {/* Results */}
      {cryptoData && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Typography variant="h5" gutterBottom>
                    {cryptoData.symbol}
                  </Typography>
                  <Typography variant="h3" color="primary" gutterBottom>
                    {formatPrice(cryptoData.price)}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: cryptoData.change24h >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 'bold'
                    }}
                  >
                    {formatChange(cryptoData.change24h)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Volume (24h): {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cryptoData.volume24h || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Market Cap: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cryptoData.marketCap || 0)}
                  </Typography>
                </div>
                <IconButton
                  color="primary"
                  onClick={() => viewChart(searchSymbol.toLowerCase())}
                  sx={{ width: 80, height: 80 }}
                >
                  <ShowChartIcon sx={{ fontSize: 50 }} />
                </IconButton>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Quick Links */}
      <Paper elevation={1} sx={{ p: 2, mt: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Popular cryptocurrencies to try:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          {['bitcoin', 'ethereum', 'cardano', 'solana', 'ripple', 'polkadot'].map((crypto) => (
            <Button
              key={crypto}
              size="small"
              variant="outlined"
              onClick={() => {
                setSearchSymbol(crypto);
                setError('');
              }}
            >
              {crypto}
            </Button>
          ))}
        </Box>
      </Paper>
    </Container>
  );
}

export default Dashboard;

