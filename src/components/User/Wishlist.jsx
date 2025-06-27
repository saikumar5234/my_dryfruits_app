import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Container,
  Button,
  IconButton,
  Chip,
  Skeleton,
  Paper,
  Alert,
  Snackbar,
  Rating,
  Divider
} from '@mui/material';
import {
  Favorite,
  ShoppingCart,
  Delete,
  ArrowBack,
  LocalOffer,
  TrendingUp
} from '@mui/icons-material';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedWishlist = localStorage.getItem('wishlist') ? JSON.parse(localStorage.getItem('wishlist')) : [];
    const savedCart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
    setWishlist(savedWishlist);
    setCart(savedCart);
    fetchProducts();
  };

  const fetchProducts = async () => {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../../firebase');
      
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

  const saveWishlist = (newWishlist) => {
    localStorage.setItem('wishlist', JSON.stringify(newWishlist));
    setWishlist(newWishlist);
  };

  const saveCart = (newCart) => {
    localStorage.setItem('cart', JSON.stringify(newCart));
    setCart(newCart);
  };

  const removeFromWishlist = (productId) => {
    const newWishlist = wishlist.filter(id => id !== productId);
    saveWishlist(newWishlist);
    showSnackbar('Removed from wishlist', 'info');
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    let newCart;
    
    if (existingItem) {
      newCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }
    
    saveCart(newCart);
    showSnackbar('Added to cart!', 'success');
  };

  const moveAllToCart = () => {
    const wishlistProducts = products.filter(product => wishlist.includes(product.id));
    let newCart = [...cart];
    
    wishlistProducts.forEach(product => {
      const existingItem = newCart.find(item => item.id === product.id);
      if (existingItem) {
        newCart = newCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newCart.push({ ...product, quantity: 1 });
      }
    });
    
    saveCart(newCart);
    saveWishlist([]);
    showSnackbar('All items moved to cart!', 'success');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getWishlistProducts = () => {
    return products.filter(product => wishlist.includes(product.id));
  };

  const getTotalWishlistValue = () => {
    return getWishlistProducts().reduce((total, product) => total + product.price, 0);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
            My Wishlist
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
              <Card sx={{ height: 420, boxShadow: 2 }}>
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
    );
  }

  const wishlistProducts = getWishlistProducts();

  if (wishlistProducts.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={2} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <Favorite sx={{ fontSize: 80, color: '#ccc', mb: 3 }} />
          <Typography variant="h4" color="text.secondary" gutterBottom>
            Your wishlist is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Start adding products to your wishlist to save them for later.
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            href="/products"
            sx={{ 
              px: 4, 
              py: 1.5,
              borderRadius: 2,
              backgroundColor: '#2E7D32',
              fontSize: '1.1rem',
              '&:hover': {
                backgroundColor: '#1B5E20'
              }
            }}
          >
            Browse Products
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      <Container maxWidth="xl" sx={{ py: 6 }}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
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
            💝 My Wishlist
          </Typography>
          
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ 
              maxWidth: 900, 
              mx: 'auto',
              mb: 4,
              lineHeight: 1.6,
              fontSize: { xs: '1rem', md: '1.1rem' }
            }}
          >
            Your saved favorites - ready to be added to cart whenever you're ready
          </Typography>
        </Box>

        {/* Wishlist Summary */}
        <Paper elevation={1} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                {wishlistProducts.length} items in wishlist
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total value: ₹{getTotalWishlistValue()}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'center', md: 'flex-end' } }}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  href="/products"
                  sx={{ borderRadius: 2 }}
                >
                  Continue Shopping
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<ShoppingCart />}
                  onClick={moveAllToCart}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: '#2E7D32',
                    '&:hover': {
                      backgroundColor: '#1B5E20'
                    }
                  }}
                >
                  Move All to Cart
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Products Grid */}
        <Grid container spacing={3}>
          {wishlistProducts.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card 
                sx={{ 
                  height: 420,
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'all 0.3s ease-in-out',
                  boxShadow: 2,
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 8,
                  },
                }}
              >
                {/* Remove from Wishlist Button */}
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    zIndex: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                    }
                  }}
                  onClick={() => removeFromWishlist(product.id)}
                >
                  <Delete sx={{ color: '#e91e63' }} />
                </IconButton>

                {/* Product Image */}
                <CardMedia
                  component="img"
                  height="200"
                  image={product.imageUrl || 'https://via.placeholder.com/300x200?text=Premium+Dry+Fruits'}
                  alt={product.name}
                  sx={{ objectFit: 'cover' }}
                />

                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Product Name */}
                  <Typography 
                    gutterBottom 
                    variant="h6" 
                    component="h2" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#2E7D32',
                    }}
                  >
                    {product.name}
                  </Typography>

                  {/* Rating */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={product.rating} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({product.reviews})
                    </Typography>
                  </Box>

                  {/* Description */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2,
                      flexGrow: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {product.description}
                  </Typography>

                  {/* Price and Add to Cart */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mt: 'auto'
                  }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: '#2E7D32',
                      }}
                    >
                      ₹{product.price}
                    </Typography>
                    
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<ShoppingCart />}
                      onClick={() => addToCart(product)}
                      sx={{
                        backgroundColor: '#2E7D32',
                        '&:hover': {
                          backgroundColor: '#1B5E20'
                        }
                      }}
                    >
                      Add to Cart
                    </Button>
                  </Box>

                  {/* Stock Status */}
                  {!product.inStock && (
                    <Chip 
                      label="Out of Stock" 
                      color="error" 
                      size="small" 
                      sx={{ mt: 1, alignSelf: 'flex-start' }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recommendations */}
        <Box sx={{ mt: 8 }}>
          <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#2E7D32', textAlign: 'center' }}>
            💡 You might also like
          </Typography>
          
          <Paper elevation={1} sx={{ p: 4, borderRadius: 2 }}>
            <Grid container spacing={3}>
              {products
                .filter(product => !wishlist.includes(product.id))
                .slice(0, 4)
                .map((product) => (
                  <Grid item xs={12} sm={6} md={3} key={product.id}>
                    <Card sx={{ height: 320, position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="150"
                        image={product.imageUrl || 'https://via.placeholder.com/300x150?text=Product'}
                        alt={product.name}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {product.name}
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
                          ₹{product.price}
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Favorite />}
                          onClick={() => {
                            const newWishlist = [...wishlist, product.id];
                            saveWishlist(newWishlist);
                            showSnackbar('Added to wishlist', 'success');
                          }}
                          sx={{ mt: 1 }}
                        >
                          Add to Wishlist
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </Paper>
        </Box>
      </Container>

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

export default Wishlist; 