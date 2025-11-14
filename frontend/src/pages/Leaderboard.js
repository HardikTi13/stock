import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box
} from '@mui/material';
import { leaderboardAPI } from '../services/api';

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await leaderboardAPI.getLeaderboard(100);
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatChange = (change) => {
    if (change === undefined || change === null) return 'N/A';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Leaderboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Top traders by portfolio value
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Total Value</TableCell>
              <TableCell>24h Change</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : leaderboard.length > 0 ? (
              leaderboard.map((entry) => {
                const isPositive = entry.change24h >= 0;
                return (
                  <TableRow key={entry.userId}>
                    <TableCell>
                      <Chip
                        label={`#${entry.rank}`}
                        color={entry.rank <= 3 ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{entry.username}</TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(entry.totalValue)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        color={isPositive ? 'success.main' : 'error.main'}
                        fontWeight="bold"
                      >
                        {formatChange(entry.change24h)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No leaderboard data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default Leaderboard;

