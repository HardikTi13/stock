import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import Plot from 'react-plotly.js';
import { marketAPI } from '../services/api';

function Chart() {
  const [searchParams] = useSearchParams();
  const [symbol, setSymbol] = useState(searchParams.get('symbol') || 'bitcoin');
  const [timeframe, setTimeframe] = useState('1d');
  const [chartType, setChartType] = useState('candlestick');
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Auto-fetch when symbol comes from URL
    if (searchParams.get('symbol')) {
      fetchChartData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChartData = async () => {
    // Validate symbol before making request
    if (!symbol || symbol.trim().length < 2) {
      setError('Please enter a valid symbol (at least 2 characters)');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await marketAPI.getHistorical('crypto', symbol.trim(), timeframe, 30);
      setData(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch chart data';
      setError(errorMessage);
      console.error('Chart data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSMA = (data, period) => {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(null);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b.close, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  };

  const calculateEMA = (data, period) => {
    const ema = [];
    const multiplier = 2 / (period + 1);
    let emaValue = data[0].close;

    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        ema.push(emaValue);
      } else {
        emaValue = (data[i].close - emaValue) * multiplier + emaValue;
        ema.push(emaValue);
      }
    }
    return ema;
  };

  const preparePlotData = () => {
    if (!data || !data.data || data.data.length === 0) return [];

    const plotData = [];
    const times = data.data.map((d) => d.time);
    const closes = data.data.map((d) => d.close);

    if (chartType === 'candlestick') {
      plotData.push({
        x: times,
        open: data.data.map((d) => d.open),
        high: data.data.map((d) => d.high),
        low: data.data.map((d) => d.low),
        close: closes,
        type: 'candlestick',
        name: `${data.symbol} Price`,
        increasing: { line: { color: '#26a69a' } },
        decreasing: { line: { color: '#ef5350' } }
      });
    } else {
      plotData.push({
        x: times,
        y: closes,
        type: 'scatter',
        mode: 'lines',
        name: `${data.symbol} Price`,
        line: { color: '#1976d2' }
      });
    }

    // Add SMA overlay
    if (showSMA && data.data.length >= 20) {
      const sma20 = calculateSMA(data.data, 20);
      plotData.push({
        x: times,
        y: sma20,
        type: 'scatter',
        mode: 'lines',
        name: 'SMA 20',
        line: { color: '#ff9800', dash: 'dash' }
      });
    }

    // Add EMA overlay
    if (showEMA && data.data.length >= 12) {
      const ema12 = calculateEMA(data.data, 12);
      plotData.push({
        x: times,
        y: ema12,
        type: 'scatter',
        mode: 'lines',
        name: 'EMA 12',
        line: { color: '#9c27b0', dash: 'dot' }
      });
    }

    return plotData;
  };

  const layout = {
    title: `${symbol.toUpperCase()} - ${timeframe === '1m' ? '1 Minute' : timeframe === '1h' ? '1 Hour' : '1 Day'} Chart`,
    xaxis: { title: 'Time' },
    yaxis: { title: 'Price (USD)' },
    hovermode: 'x unified',
    template: 'plotly_white',
    height: 600
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Crypto Charts
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Crypto Symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="bitcoin"
              helperText="Use lowercase (e.g., bitcoin, ethereum, cardano, solana)"
              error={symbol && symbol.trim().length < 2}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Timeframe</InputLabel>
              <Select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                <MenuItem value="1m">1 Minute</MenuItem>
                <MenuItem value="1h">1 Hour</MenuItem>
                <MenuItem value="1d">1 Day</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              onClick={fetchChartData}
              disabled={loading}
              sx={{ height: '56px' }}
            >
              {loading ? 'Loading...' : 'Load Chart'}
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(e, newType) => newType && setChartType(newType)}
            size="small"
            sx={{ mr: 2 }}
          >
            <ToggleButton value="candlestick">Candlestick</ToggleButton>
            <ToggleButton value="line">Line</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={[showSMA && 'sma', showEMA && 'ema'].filter(Boolean)}
            onChange={(e, values) => {
              setShowSMA(values.includes('sma'));
              setShowEMA(values.includes('ema'));
            }}
            size="small"
          >
            <ToggleButton value="sma">SMA 20</ToggleButton>
            <ToggleButton value="ema">EMA 12</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            ⚠️ {error}
          </Typography>
        )}

        {data && data.data && (
          <Plot
            data={preparePlotData()}
            layout={layout}
            config={{ responsive: true, displayModeBar: true }}
          />
        )}
      </Paper>
    </Container>
  );
}

export default Chart;

