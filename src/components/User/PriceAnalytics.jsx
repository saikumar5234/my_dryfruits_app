import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Container,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Alert,
  Button,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  Timeline,
  ShowChart,
  Analytics,
  ArrowBack,
  Store
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush
} from 'recharts';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Mock price history data (in real app, this would come from your database)
const generatePriceHistory = (basePrice, days = 30) => {
  const history = [];
  let currentPrice = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate price fluctuations
    const change = (Math.random() - 0.5) * 0.1; // ±5% change
    currentPrice = Math.max(currentPrice * (1 + change), basePrice * 0.7); // Don't go below 70% of base price
    
    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(currentPrice * 100) / 100,
      volume: Math.floor(Math.random() * 100) + 10,
      high: Math.round(currentPrice * (1 + Math.random() * 0.05) * 100) / 100,
      low: Math.round(currentPrice * (1 - Math.random() * 0.05) * 100) / 100,
      open: Math.round(currentPrice * (1 + (Math.random() - 0.5) * 0.02) * 100) / 100,
      close: Math.round(currentPrice * 100) / 100
    });
  }
  
  return history;
};

const PriceAnalytics = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('30');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetchProducts();
    // Listen for price update events
    const handlePriceUpdate = () => {
      console.log('Price update event received');
      fetchProducts();
      if (selectedProduct) {
        fetchPriceHistory(selectedProduct);
      }
    };
    // Listen for new product additions
    const handleProductAdded = () => {
      console.log('Product added event received');
      fetchProducts();
    };
    window.addEventListener('productPriceUpdated', handlePriceUpdate);
    window.addEventListener('productAdded', handleProductAdded);
    return () => {
      window.removeEventListener('productPriceUpdated', handlePriceUpdate);
      window.removeEventListener('productAdded', handleProductAdded);
    };
  }, [selectedProduct]);

  // Move fetchPriceHistory out of useEffect so it can be called from the event handler
  const fetchPriceHistory = async (product = selectedProduct) => {
    if (!product) return;
    try {
      setLoadingHistory(true);
      const priceHistoryRef = collection(db, 'products', product.id, 'priceHistory');
      const q = query(priceHistoryRef, orderBy('date', 'asc'));
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => {
        const data = doc.data();
        let dateString;
        if (data.date instanceof Date) {
          dateString = data.date.toISOString().split('T')[0];
        } else if (typeof data.date === 'string') {
          if (data.date.includes('T')) {
            dateString = data.date.split('T')[0];
          } else {
            dateString = data.date;
          }
        } else {
          dateString = new Date().toISOString().split('T')[0];
        }
        return {
          ...data,
          date: dateString,
          price: parseFloat(data.price) || 0
        };
      });
      history.sort((a, b) => new Date(a.date) - new Date(b.date));
      setPriceHistory(history.length ? history : [{ price: parseFloat(product.price) || 0, date: new Date().toISOString().split('T')[0], createdAt: new Date(), type: 'default' }]);
    } catch (error) {
      console.error('Error fetching price history:', error);
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      setPriceHistory([{ price: parseFloat(product.price) || 0, date: dateString, createdAt: today, type: 'default' }]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPriceHistory();
  }, [selectedProduct]);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
      // Only set selectedProduct if it is not already set or if the current selectedProduct is not in the new list
      if (!selectedProduct || !productsData.find(p => p.id === selectedProduct.id)) {
        if (productsData.length > 0) {
          setSelectedProduct(productsData[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const calculatePriceChange = () => {
    console.log('Calculating price change for history:', priceHistory);
    
    if (priceHistory.length < 2) {
      // If only one entry, no change
      console.log('Only one price entry, no change');
      return { change: 0, percentage: 0, trend: 'neutral' };
    }
    
    // Get the two most recent entries
    const currentEntry = priceHistory[priceHistory.length - 1];
    const previousEntry = priceHistory[priceHistory.length - 2];
    
    console.log('Current entry:', currentEntry);
    console.log('Previous entry:', previousEntry);
    
    if (!currentEntry || !previousEntry) {
      console.log('Missing current or previous entry');
      return { change: 0, percentage: 0, trend: 'neutral' };
    }
    
    const currentPrice = currentEntry.price;
    const previousPrice = previousEntry.price;
    const change = currentPrice - previousPrice;
    const percentage = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
    
    const result = {
      change: Math.round(change * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
    
    console.log('Price change result:', result);
    return result;
  };

  const calculateStats = () => {
    if (priceHistory.length === 0) return {};
    
    const prices = priceHistory.map(h => h.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    return {
      maxPrice: Math.round(maxPrice * 100) / 100,
      minPrice: Math.round(minPrice * 100) / 100,
      avgPrice: Math.round(avgPrice * 100) / 100
    };
  };

  const priceChange = calculatePriceChange();
  const stats = calculateStats();

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp color="success" />;
      case 'down': return <TrendingDown color="error" />;
      default: return <Remove color="disabled" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return '#4caf50';
      case 'down': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const formatChartData = () => {
    return priceHistory.map((record, index) => ({
      ...record,
      date: new Date(record.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      change: index > 0 ? record.price - priceHistory[index - 1].price : 0,
      changePercent: index > 0 ? ((record.price - priceHistory[index - 1].price) / priceHistory[index - 1].price) * 100 : 0
    }));
  };

  // Helper to get all dates in range
  const getDateRange = (days) => {
    const dates = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  // Build chart data with filled missing days
  const buildContinuousChartData = () => {
    if (!priceHistory.length) return [];
    const days = parseInt(timeRange);
    const dateRange = getDateRange(days);
    const priceMap = {};
    priceHistory.forEach(entry => { priceMap[entry.date] = entry.price; });
    let lastPrice = priceHistory[0].price;
    return dateRange.map(date => {
      if (priceMap[date] !== undefined) {
        lastPrice = priceMap[date];
      }
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: lastPrice
      };
    });
  };

  // Modern, glassy tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{
          background: 'rgba(255,255,255,0.85)',
          boxShadow: '0 4px 24px 0 rgba(46,125,50,0.10)',
          borderRadius: 3,
          px: 2.5,
          py: 1.5,
          minWidth: 120,
          border: '1px solid #e0e0e0',
          backdropFilter: 'blur(4px)',
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2E7D32', mb: 0.5 }}>{label}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#222' }}>₹{payload[0].value}</Typography>
        </Box>
      );
    }
    return null;
  };

  // Helper to get localized field
  const getLocalized = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[i18n.language] || obj.en || Object.values(obj)[0] || '';
  };

  // Range options
  const rangeOptions = [
    { label: '1W', value: 7 },
    { label: '1M', value: 30 },
    { label: '3M', value: 90 },
    { label: '1Y', value: 365 },
    { label: 'All', value: 'all' }
  ];

  // Export chart as image or PDF
  const handleExport = async (type = 'image') => {
    const chartNode = document.getElementById('price-chart-container');
    if (!chartNode) return;
    const canvas = await html2canvas(chartNode, { backgroundColor: null, scale: 2 });
    if (type === 'image') {
      const link = document.createElement('a');
      link.download = `price_chart_${selectedProduct?.id || 'product'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else if (type === 'pdf') {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 40, imgWidth, imgHeight);
      pdf.save(`price_chart_${selectedProduct?.id || 'product'}.pdf`);
    }
  };

  if (loadingHistory) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={64} thickness={4} color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fafafa', pt: { xs: '0px', md: '40px' } }}>
      <Box sx={{ py: 2, px: { xs: 2, sm: 4, md: 6, lg: 8 } }}>
        {/* Header with Back Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 6, position: 'relative' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              borderColor: '#2E7D32',
              color: '#2E7D32',
              fontWeight: 'bold',
              position: 'absolute',
              left: 0,
              top: -20,
              zIndex: 1,
              '&:hover': {
                backgroundColor: '#2E7D32',
                color: 'white',
                borderColor: '#2E7D32'
              }
            }}
          >
            {t('back')}
          </Button>
          
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography 
              variant="h2" 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold', 
                color: '#2E7D32',
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem', lg: '3.5rem' }
              }}
            >
              {t('market_analytics')}
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                maxWidth: 800, 
                mx: 'auto',
                mb: 4
              }}
            >
              {t('market_analytics_subtitle')}
            </Typography>
          </Box>
        </Box>

        {/* Product Selector */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Product</InputLabel>
                <Select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    setSelectedProduct(product);
                  }}
                  label="Select Product"
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {getLocalized(product.name)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>{t('time_range')}</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  label={t('time_range')}
                >
                  <MenuItem value="7">{t('last_7_days')}</MenuItem>
                  <MenuItem value="30">{t('last_30_days')}</MenuItem>
                  <MenuItem value="90">{t('last_3_months')}</MenuItem>
                  <MenuItem value="365">{t('last_year')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {selectedProduct && (
          <>
            {/* Price Overview Card */}
            {priceHistory.length === 0 ? (
              <Alert severity="info" sx={{ mb: 4 }}>
                No price history found for this product. Please add price history entries in Firestore.
              </Alert>
            ) : null}
            <Card sx={{ mb: 4, boxShadow: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {getLocalized(selectedProduct.name)}
                    </Typography>
                    <Typography variant="h2" sx={{ 
                      fontWeight: 'bold', 
                      color: getTrendColor(priceChange.trend),
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      ₹{priceHistory[priceHistory.length - 1]?.price || selectedProduct.price}
                      {getTrendIcon(priceChange.trend)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                      <Chip 
                        label={`${priceChange.trend === 'up' ? '+' : ''}₹${priceChange.change}`}
                        color={priceChange.trend === 'up' ? 'success' : priceChange.trend === 'down' ? 'error' : 'default'}
                        variant="outlined"
                      />
                      <Chip 
                        label={`${priceChange.trend === 'up' ? '+' : ''}${priceChange.percentage}%`}
                        color={priceChange.trend === 'up' ? 'success' : priceChange.trend === 'down' ? 'error' : 'default'}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: '#e8f5e8' }}>
                          <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                              ₹{stats.maxPrice}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t('highest_price')}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: '#ffebee' }}>
                          <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h6" color="error.main" sx={{ fontWeight: 'bold' }}>
                              ₹{stats.minPrice}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t('lowest_price')}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card sx={{ bgcolor: '#e3f2fd' }}>
                          <CardContent sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                              ₹{stats.avgPrice}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t('average_price')}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', mb: 4, width: '100%' }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                indicatorColor="primary"
                textColor="primary"
                sx={{ 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  backgroundColor: 'white',
                  width: '100%'
                }}
              >
                <Tab 
                  label="Price Chart" 
                  icon={<ShowChart />}
                  sx={{ 
                    py: 2, 
                    px: 3,
                    fontWeight: 'bold'
                  }}
                />
                <Tab 
                  label="Price History" 
                  icon={<Timeline />}
                  sx={{ 
                    py: 2, 
                    px: 3,
                    fontWeight: 'bold'
                  }}
                />
                <Tab 
                  label="Analytics" 
                  icon={<Analytics />}
                  sx={{ 
                    py: 2, 
                    px: 3,
                    fontWeight: 'bold'
                  }}
                />
              </Tabs>
              
              <Box sx={{ p: 4, backgroundColor: 'white', width: '100%' }}>
                {tabValue === 0 && (
                  <Box>
                    <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                      {t('price_movement_chart')}
                    </Typography>
                    
                    {/* Price Line Chart */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                      {/* Range Selector */}
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {rangeOptions.map(opt => (
                          <Button
                            key={opt.value}
                            variant={timeRange === String(opt.value) ? 'contained' : 'outlined'}
                            size="small"
                            sx={{ minWidth: 48, fontWeight: 'bold', borderRadius: 2 }}
                            onClick={() => setTimeRange(String(opt.value))}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </Box>
                      {/* Export Buttons */}
                      <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                        <Button variant="outlined" size="small" onClick={() => handleExport('image')}>Export Image</Button>
                        <Button variant="outlined" size="small" onClick={() => handleExport('pdf')}>Export PDF</Button>
                      </Box>
                    </Box>
                    <Card sx={{ mb: 4 }}>
                      <CardContent>
                        <div id="price-chart-container">
                          <ResponsiveContainer width="100%" height={340}>
                            <AreaChart data={buildContinuousChartData()} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#43e97b" stopOpacity={0.45}/>
                                  <stop offset="100%" stopColor="#38f9d7" stopOpacity={0.10}/>
                                </linearGradient>
                                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                  <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#2E7D32" floodOpacity="0.10" />
                                </filter>
                              </defs>
                              <CartesianGrid strokeDasharray="2 6" vertical={false} stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="date" 
                                tick={{ fontSize: 14, fill: '#888' }}
                                axisLine={false}
                                tickLine={false}
                                minTickGap={10}
                              />
                              <YAxis 
                                domain={['dataMin - 10', 'dataMax + 10']}
                                tick={{ fontSize: 14, fill: '#888' }}
                                tickFormatter={(value) => `₹${value}`}
                                axisLine={false}
                                tickLine={false}
                                width={60}
                              />
                              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(46,125,50,0.07)' }} />
                              <Area 
                                type="monotone" 
                                dataKey="price" 
                                stroke="#2E7D32" 
                                strokeWidth={4}
                                fill="url(#colorPrice)"
                                dot={false}
                                isAnimationActive={true}
                                animationDuration={1200}
                                filter="url(#shadow)"
                              />
                              {/* Zoom/Pan Brush */}
                              <Brush dataKey="date" height={24} stroke="#2E7D32" travellerWidth={12} fill="#e8f5e9" />
                              {/* Highlight latest price with glowing dot and value label */}
                              {(() => {
                                const data = buildContinuousChartData();
                                if (!data.length) return null;
                                const last = data[data.length - 1];
                                return (
                                  <g>
                                    <circle
                                      cx={data.length * 100 / data.length + '%'}
                                      cy={null}
                                      r={9}
                                      fill="#fff"
                                      stroke="#43e97b"
                                      strokeWidth={4}
                                      filter="url(#shadow)"
                                      style={{ pointerEvents: 'none' }}
                                    />
                                    <text
                                      x="98%"
                                      y="40"
                                      textAnchor="end"
                                      fontSize="1.1rem"
                                      fontWeight="bold"
                                      fill="#2E7D32"
                                      style={{
                                        paintOrder: 'stroke',
                                        stroke: '#fff',
                                        strokeWidth: 4,
                                        strokeLinejoin: 'round',
                                        filter: 'url(#shadow)'
                                      }}
                                    >
                                      ₹{last.price}
                                    </text>
                                  </g>
                                );
                              })()}
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </Box>
                )}
                
                {tabValue === 1 && (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Price (₹)</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Change</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Trend</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {priceHistory.slice(-10).reverse().map((record, index, reversedArray) => {
                          // Calculate change from previous entry in the reversed array
                          const prevRecord = reversedArray[index + 1];
                          const change = prevRecord ? record.price - prevRecord.price : 0;
                          const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
                          
                          return (
                            <TableRow key={record.date} hover>
                              <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>₹{record.price}</TableCell>
                              <TableCell sx={{ 
                                color: getTrendColor(trend),
                                fontWeight: 'bold'
                              }}>
                                {change > 0 ? '+' : ''}₹{Math.round(change * 100) / 100}
                              </TableCell>
                              <TableCell>
                                {getTrendIcon(trend)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {tabValue === 2 && (
                  <Box>
                    <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
                      {t('market_analytics_insights')}
                    </Typography>
                    
                    <Grid container spacing={3} sx={{ width: '100%' }}>
                      <Grid item xs={12} sm={6} md={3} lg={3} sx={{ width: '100%' }}>
                        <Card sx={{ height: '100%', bgcolor: '#e8f5e8', boxShadow: 3, borderRadius: 3, width: '100%' }}>
                          <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                              ₹{stats.maxPrice}
                            </Typography>
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                              {t('highest_price')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Peak value in selected period
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3} lg={3} sx={{ width: '100%' }}>
                        <Card sx={{ height: '100%', bgcolor: '#ffebee', boxShadow: 3, borderRadius: 3, width: '100%' }}>
                          <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                              ₹{stats.minPrice}
                            </Typography>
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                              {t('lowest_price')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Minimum value in selected period
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3} lg={3} sx={{ width: '100%' }}>
                        <Card sx={{ height: '100%', bgcolor: '#e3f2fd', boxShadow: 3, borderRadius: 3, width: '100%' }}>
                          <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                              ₹{stats.avgPrice}
                            </Typography>
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                              {t('average_price')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Mean price over selected period
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={6} lg={6} sx={{ width: '100%' }}>
                        <Card sx={{ height: '100%', bgcolor: '#f3e5f5', boxShadow: 3, borderRadius: 3, width: '100%' }}>
                          <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {Math.round(((stats.maxPrice - stats.minPrice) / stats.avgPrice) * 100)}%
                            </Typography>
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                              Price Volatility
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Price fluctuation range percentage
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={6} lg={6} sx={{ width: '100%' }}>
                        <Card sx={{ height: '100%', bgcolor: '#e0f2f1', boxShadow: 3, borderRadius: 3, width: '100%' }}>
                          <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 1 }}>
                              {getTrendIcon(priceChange.trend)}
                              <Typography variant="h4" sx={{ 
                                color: getTrendColor(priceChange.trend),
                                fontWeight: 'bold'
                              }}>
                                {priceChange.trend === 'up' ? 'Bullish' : priceChange.trend === 'down' ? 'Bearish' : 'Neutral'}
                              </Typography>
                            </Box>
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                              Market Trend
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Current market sentiment and direction
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sx={{ width: '100%' }}>
                        <Card sx={{ boxShadow: 3, borderRadius: 3, width: '100%' }}>
                          <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                              {t('price_performance_summary')}
                            </Typography>
                            <Grid container spacing={3} sx={{ width: '100%' }}>
                              <Grid item xs={12} sm={6} md={4} lg={4} sx={{ width: '100%' }}>
                                <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                  <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Current Price
                                  </Typography>
                                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: getTrendColor(priceChange.trend) }}>
                                    ₹{priceHistory[priceHistory.length - 1]?.price || selectedProduct.price}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6} md={4} lg={4} sx={{ width: '100%' }}>
                                <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                  <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Price Change
                                  </Typography>
                                  <Typography variant="h4" sx={{ 
                                    fontWeight: 'bold', 
                                    color: getTrendColor(priceChange.trend)
                                  }}>
                                    {priceChange.trend === 'up' ? '+' : ''}₹{priceChange.change}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    ({priceChange.trend === 'up' ? '+' : ''}{priceChange.percentage}%)
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6} md={4} lg={4} sx={{ width: '100%' }}>
                                <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                  <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                                    Price Range
                                  </Typography>
                                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                    ₹{stats.minPrice} - ₹{stats.maxPrice}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Min to Max in period
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Box>
            </Paper>
          </>
        )}

        {!selectedProduct && (
          <Alert severity="info" sx={{ textAlign: 'center' }}>
            {t('select_product_to_view_analytics')}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default PriceAnalytics; 