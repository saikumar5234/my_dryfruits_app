import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Container,
  TextField,
  InputAdornment,
  Chip,
  Skeleton,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Badge,
  Fab,
  Tooltip,
  Rating,
  Divider,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Search,
  Favorite,
  FavoriteBorder,
  ShoppingCart,
  Close,
  Sort,
  FilterList,
  Add,
  Remove,
  Star,
  LocalShipping,
  Verified,
  Nature,
  Reviews,
  Visibility,
  ExpandMore,
  LocalOffer,
  TrendingUp
} from '@mui/icons-material';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { populateDemoData, populateDemoReviews } from '../../utils/demoData';
import { useAuth } from '../../contexts/AuthContext';
import ProductReview from './ProductReview';
import ReviewStats from './ReviewStats';
// import ApprovalStatus from './ApprovalStatus';
import { useTranslation } from 'react-i18next';
import { useCartWishlist } from '../../contexts/CartWishlistContext';

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [productDetailsTab, setProductDetailsTab] = useState(0);
  const { t, i18n } = useTranslation();
  const {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    addToCart,
    getCartItemCount
  } = useCartWishlist();
  const { isAdmin } = useAuth();

  // Categories for filtering
  const categoryKeys = ['all', 'nuts', 'dried_fruits', 'mixed', 'premium'];

  useEffect(() => {
    fetchProducts();
    // Listen for price update events
    const handlePriceUpdate = () => fetchProducts();
    // Listen for new product additions
    const handleProductAdded = () => fetchProducts();
    
    window.addEventListener('productPriceUpdated', handlePriceUpdate);
    window.addEventListener('productAdded', handleProductAdded);
    
    return () => {
      window.removeEventListener('productPriceUpdated', handlePriceUpdate);
      window.removeEventListener('productAdded', handleProductAdded);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        rating: doc.data().rating || Math.floor(Math.random() * 2) + 4,
        reviews: doc.data().reviews || Math.floor(Math.random() * 50) + 10,
        inStock: doc.data().inStock !== false
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      showSnackbar('Error loading products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePopulateDemoData = async () => {
    try {
      const demoData = [
        {
          name: { en: 'Premium Almonds', hi: 'प्रीमियम बादाम', ta: 'பிரீமியம் பாதாம்' },
          description: { en: 'Handpicked premium almonds, rich in nutrients', hi: 'हाथ से चुने गए प्रीमियम बादाम, पोषक तत्वों से भरपूर', ta: 'கைரெட்டிய பிரீமியம் பாதாம், ஊட்டச்சத்துக்கள் நிறைந்தது' },
          price: 450,
          category: { en: 'Nuts', hi: 'मेवे', ta: 'கொட்டைகள்' },
          imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
          inStock: true
        },
        {
          name: { en: 'Organic Walnuts', hi: 'ऑर्गेनिक अखरोट', ta: 'கரிம வால்நட்' },
          description: { en: 'Fresh organic walnuts, perfect for health', hi: 'ताजे ऑर्गेनिक अखरोट, स्वास्थ्य के लिए बिल्कुल सही', ta: 'புதிய கரிம வால்நட், ஆரோக்கியத்திற்கு சரியானது' },
          price: 380,
          category: { en: 'Nuts', hi: 'मेवे', ta: 'கொட்டைகள்' },
          imageUrl: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400',
          inStock: true
        }
      ];

      for (const product of demoData) {
        await addDoc(collection(db, 'products'), product);
      }

      showSnackbar('Demo data added successfully!', 'success');
      fetchProducts();
    } catch (error) {
      console.error('Error adding demo data:', error);
      showSnackbar('Error adding demo data', 'error');
    }
  };

  const handlePopulateDemoReviews = async () => {
    try {
      const demoReviews = [
        {
          productId: 'demo-product-1',
          userId: 'demo-user-1',
          userName: 'John Doe',
          rating: 5,
          comment: 'Excellent quality! Highly recommended.',
          timestamp: new Date()
        }
      ];

      for (const review of demoReviews) {
        await addDoc(collection(db, 'reviews'), review);
      }

      showSnackbar('Demo reviews added successfully!', 'success');
    } catch (error) {
      console.error('Error adding demo reviews:', error);
      showSnackbar('Error adding demo reviews', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleReviewAdded = () => {
    // Refresh product data to update rating and review count
    fetchProducts();
  };

  // Helper to get localized field
  const getLocalized = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[i18n.language] || obj.en || Object.values(obj)[0] || '';
  };

  // Helper to get price bounds from priceRange string
  const getPriceBounds = (range) => {
    switch (range) {
      case 'low':
        return [0, 400];
      case 'medium':
        return [400, 700];
      case 'high':
        return [700, Infinity];
      default:
        return [0, Infinity];
    }
  };

  const [minPrice, maxPrice] = getPriceBounds(priceRange);

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const name = getLocalized(product.name).toLowerCase();
      const description = getLocalized(product.description).toLowerCase();
      const category = getLocalized(product.category).toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = name.includes(search) || description.includes(search);
      const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
      const matchesPrice = product.price >= minPrice && product.price <= maxPrice;

      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
        default:
          return getLocalized(a.name).localeCompare(getLocalized(b.name));
      }
    });

  const categories = ['all', ...new Set(products.map(p => getLocalized(p.category)))];

  const handleAddToCart = (product) => {
    addToCart(product);
    showSnackbar('Added to cart!', 'success');
  };

  const handleToggleWishlist = (productId) => {
    if (wishlist.includes(productId)) {
      removeFromWishlist(productId);
      showSnackbar('Removed from wishlist', 'info');
    } else {
      addToWishlist(productId);
      showSnackbar('Added to wishlist!', 'success');
    }
  };

  if (loading) {
    return (
      <Box sx={{ position: 'relative', minHeight: '60vh' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
              {t('our_premium_dry_fruits')}
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <Grid key={item}>
                <Card sx={{ height: 320, boxShadow: 2 }}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent sx={{ p: 3 }}>
                  <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={20} sx={{ mb: 2 }} />
                  <Skeleton variant="text" height={24} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
          <CircularProgress size={64} thickness={4} color="primary" />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <Container maxWidth="xl" sx={{ py: 2, pt: { xs: '0px', md: '20px' } }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3"
            gutterBottom 
            sx={{ 
              fontWeight: 'bold', 
              color: '#2E7D32',
              textAlign: 'center',
              mb: 2,
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            {t('premium_dry_fruits_collection')}
          </Typography>
          {/* <Typography
            variant="h6" 
            sx={{ 
              textAlign: 'center',
              color: 'text.secondary',
              mb: 4,
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            {t('discover_handpicked_selection')}
          </Typography> */}
        </Box>

        {/* Category Tabs */}
        <Paper elevation={1} sx={{ mb: 1.5, borderRadius: 0.5 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => {
              setActiveTab(newValue);
              setSelectedCategory(categoryKeys[newValue]);
            }}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                minWidth: 90,
                fontSize: { xs: '0.85rem', sm: '1rem' },
                fontWeight: 600,
                color: '#666',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                maxWidth: 120,
                '&.Mui-selected': {
                  color: '#2E7D32',
                }
              }
            }}
          >
            {categoryKeys.map((key, idx) => (
              <Tab key={key} label={t(key)} />
            ))}
          </Tabs>
        </Paper>

        {/* Search and Filter Section */}
        <Paper elevation={1} sx={{ p: 4, mb: 4, borderRadius: 0.5 }}>
          <Grid container columns={12} spacing={3} alignItems="center">
            <Grid xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search for dry fruits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="primary" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, fontSize: '1.1rem' }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#2E7D32',
                  },
                },
              }}
            />
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="price-low">Price: Low to High</MenuItem>
                  <MenuItem value="price-high">Price: High to Low</MenuItem>
                  <MenuItem value="rating">Rating</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid xs={12} sm={6} md={3}>
              <FormControl fullWidth sx={{ minWidth: 130 }}>
                <InputLabel>Price Range</InputLabel>
                <Select
                  value={priceRange}
                  label="Price Range"
                  onChange={(e) => setPriceRange(e.target.value)}
                >
                  <MenuItem value="all">All Prices</MenuItem>
                  <MenuItem value="low">Under ₹400</MenuItem>
                  <MenuItem value="medium">₹400 - ₹700</MenuItem>
                  <MenuItem value="high">Over ₹700</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Results Count */}
        {/* {filteredProducts.length > 0 && (
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Showing {filteredProducts.length} of {filteredProducts.length} products
            </Typography>
          </Box>
        )} */}

        {/* Products Grid */}
        <Grid container columns={12} spacing={3}>
            {filteredProducts.map((product) => (
            <Grid key={product.id} xs={12} sm={6} md={4} lg={3}>
              <Card
                sx={{
                  width: { xs: '100%', sm: 270 },
                  maxWidth: '100%',
                  height: 320,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 1,
                  boxShadow: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  mx: 'auto',
                  background: '#fff',
                  transition: 'transform 0.2s cubic-bezier(.4,2,.6,1), box-shadow 0.2s',
                  '&:hover, &:focus-within': {
                    transform: 'scale(1.035) translateY(-4px)',
                    boxShadow: 8,
                  },
                }}
              >
                {/* Wishlist Heart */}
                {!isAdmin() && (
                  <IconButton
                    aria-label={wishlist.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  sx={{ 
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      zIndex: 2,
                      background: 'rgba(255,255,255,0.9)',
                      borderRadius: '50%',
                      boxShadow: 1,
                      transition: 'color 0.2s',
                      '&:hover, &:focus': { color: '#e91e63', background: 'white' }
                    }}
                    onClick={() => handleToggleWishlist(product.id)}
                  >
                    {wishlist.includes(product.id) ? (
                      <Favorite sx={{ color: '#e91e63', fontSize: 22, transition: 'color 0.2s' }} />
                    ) : (
                      <FavoriteBorder sx={{ fontSize: 22 }} />
                    )}
                  </IconButton>
                )}
                {/* Badges */}
                {product.inStock === false && (
                  <Chip label="Out of Stock" color="error" size="small" sx={{ position: 'absolute', top: 10, left: 10, zIndex: 2, fontWeight: 'bold', bgcolor: '#e57373', color: 'white' }} />
                )}
                {product.createdAt && (Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 14) && (
                  <Chip label="New" color="secondary" size="small" sx={{ position: 'absolute', top: 10, left: 120, zIndex: 2, fontWeight: 'bold', bgcolor: '#F9A825', color: '#fff' }} />
                )}
                {/* Product Image */}
                  <CardMedia
                    component="img"
                  image={product.imageUrl || 'https://via.placeholder.com/350x220?text=Premium+Dry+Fruits'}
                    alt={product.name}
                    sx={{ 
                    width: '100%',
                    height: 140,
                    objectFit: 'contain',
                    background: '#f8f8f8',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    p: 1,
                    display: 'block',
                    mx: 'auto',
                  }}
                  onClick={() => setSelectedProduct(product)}
                />
                <CardContent sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', p: 2, minHeight: 0 }}>
                      <Typography 
                        gutterBottom 
                        variant="h6" 
                        component="h2" 
                    sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.05rem', lineHeight: 1.3, mb: 1, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => setSelectedProduct(product)}
                  >
                    {getLocalized(product.name)}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                    sx={{ mb: 2, flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.9rem', lineHeight: 1.4 }}
                  >
                    {getLocalized(product.description)}
                      </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                      <Typography 
                        variant="h6" 
                      sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}
                      >
                        ₹{product.price}
                      </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Quick View">
                        <IconButton color="secondary" onClick={() => setSelectedProduct(product)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {!isAdmin() && (
                        <Button
                          aria-label="Add to cart"
                          variant="contained"
                        size="small" 
                          startIcon={<ShoppingCart />}
                          onClick={() => handleAddToCart(product)}
                          sx={{ backgroundColor: 'primary.main', fontSize: '0.85rem', px: 2, py: 0.5, minWidth: 'auto', borderRadius: 2, '&:hover, &:focus': { backgroundColor: 'primary.dark' } }}
                          disabled={product.inStock === false}
                        >
                          Add
                        </Button>
                      )}
                    </Box>
                    </Box>
                  </CardContent>
                {/* 5-star summary at bottom of card */}
                <Box sx={{ borderTop: '1px solid #eee', p: 1, bgcolor: '#fafafa', minHeight: 28, flexShrink: 0 }}>
                  <ReviewStats productId={product.id} compactFiveStarOnly />
                </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

        {/* Empty State */}
        {filteredProducts.length === 0 && !loading && (
          <Paper elevation={2} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h4" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
              {searchTerm ? 'No products found' : 'Welcome to Our Store!'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              {searchTerm 
                ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                : 'No products available yet. Please add products from the admin panel to get started!'
              }
            </Typography>
          </Paper>
        )}
      </Container>

      {/* Product Details Quick View Dialog */}
      <Dialog
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 2 } }}
      >
        {selectedProduct && (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch', gap: 4, p: 2 }}>
            {/* Product Image */}
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 280 }}>
              <img
                src={selectedProduct.imageUrl || 'https://via.placeholder.com/400x300?text=Premium+Dry+Fruits'}
                alt={selectedProduct.name}
                style={{ width: '100%', maxWidth: 380, height: 'auto', borderRadius: 12, objectFit: 'cover', boxShadow: '0 4px 24px rgba(44,125,50,0.08)' }}
              />
            </Box>
            {/* Product Info */}
            <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 240 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', letterSpacing: 1 }}>
                    {getLocalized(selectedProduct.name)}
                  </Typography>
                  {selectedProduct.inStock === false && (
                    <Chip label="Out of Stock" color="error" size="small" sx={{ fontWeight: 'bold', bgcolor: '#e57373', color: 'white' }} />
                  )}
                  {selectedProduct.createdAt && (Date.now() - new Date(selectedProduct.createdAt).getTime() < 1000 * 60 * 60 * 24 * 14) && (
                    <Chip label="New" color="secondary" size="small" sx={{ fontWeight: 'bold', bgcolor: '#F9A825', color: '#fff' }} />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <ReviewStats productId={selectedProduct.id} compact={true} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                  ₹{selectedProduct.price}
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary', lineHeight: 1.7 }}>
                  {getLocalized(selectedProduct.description)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
              <Button 
                variant="contained" 
                size="large"
                  startIcon={<ShoppingCart />}
                  onClick={() => handleAddToCart(selectedProduct)}
                  sx={{ backgroundColor: 'primary.main', fontWeight: 'bold', fontSize: '1.1rem', px: 4, py: 1.5, borderRadius: 3, '&:hover': { backgroundColor: 'primary.dark' } }}
                  disabled={selectedProduct.inStock === false}
                >
                  {t('add_to_cart')}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => setSelectedProduct(null)}
                  sx={{ borderRadius: 3, fontWeight: 'bold', fontSize: '1.1rem', px: 4, py: 1.5 }}
                >
                  Close
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Dialog>

      {/* Shopping Cart FAB */}
      {getCartItemCount() > 0 && (
        <Fab
          color="primary"
          aria-label="cart"
                sx={{ 
            position: 'fixed',
            bottom: 24,
            right: 24,
                  backgroundColor: '#2E7D32',
                  '&:hover': {
                    backgroundColor: '#1B5E20'
                  }
                }}
              >
          <Badge badgeContent={getCartItemCount()} color="error">
            <ShoppingCart />
          </Badge>
        </Fab>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductCatalog; 