import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Link as MuiLink
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('general');

  // Fetch news on component mount (general news)
  useEffect(() => {
    fetchNews('general');
  }, []);

  const fetchNews = async (searchTerm = 'stocks') => {
    setLoading(true);
    setError('');
    
    try {
      const apiKey = '3191cf14abbb4d27bc2b2403f6ccf54f';
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchTerm)}&sortBy=publishedAt&language=en&apiKey=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'ok' && data.articles) {
        setNews(data.articles);
      } else {
        setError(data.message || 'Failed to fetch news');
      }
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Failed to fetch news. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchNews(searchQuery.trim());
    } else {
      setError('Please enter a search term');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const quickSearches = [
    'stocks',
    'cryptocurrency',
    'forex',
    'market',
    'trading',
    'bitcoin',
    'ethereum'
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon /> Financial News
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Stay updated with the latest market news and trends
        </Typography>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          fullWidth
          label="Search news..."
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., Bitcoin, Tesla, Stock Market"
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          startIcon={<SearchIcon />}
          disabled={loading}
          sx={{ minWidth: 120 }}
        >
          Search
        </Button>
      </Box>

      {/* Quick Search Chips */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Quick searches:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {quickSearches.map((term) => (
            <Chip
              key={term}
              label={term}
              onClick={() => {
                setSearchQuery(term);
                fetchNews(term);
              }}
              clickable
              color="primary"
              variant="outlined"
            />
          ))}
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* News Grid */}
      {!loading && news.length > 0 && (
        <Grid container spacing={3}>
          {news.map((article, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {article.urlToImage && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={article.urlToImage}
                    alt={article.title}
                    sx={{ objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {article.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {article.description || article.content || 'No description available'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(article.publishedAt)}
                    </Typography>
                    {article.source?.name && (
                      <Chip label={article.source.name} size="small" variant="outlined" />
                    )}
                  </Box>
                  {article.url && (
                    <Box sx={{ mt: 2 }}>
                      <MuiLink
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                      >
                        Read full article →
                      </MuiLink>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* No Results */}
      {!loading && news.length === 0 && !error && (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No news found. Try searching for something!
          </Typography>
        </Box>
      )}
    </Container>
  );
}

export default News;
