import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Container,
  Button,
  IconButton,
  Divider,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  CircularProgress,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ShoppingCart,
  Remove,
  Add,
  Delete,
  ArrowBack,
  LocalShipping,
  Payment,
  CheckCircle,
  LocationOn,
  Phone,
  Email
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import ProductReview from './ProductReview';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useCartWishlist } from '../../contexts/CartWishlistContext';

const ShoppingCartPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [checkoutData, setCheckoutData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'cod'
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const { 
    cart, 
    wishlist, 
    loading, 
    removeFromCart, 
    updateCartQuantity, 
    moveToWishlist, 
    clearCart,
    getCartTotal 
  } = useCartWishlist();

  const steps = [t('cart_review'), t('shipping_details'), t('payment'), t('confirmation')];

  // Helper to get localized field
  const getLocalized = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[i18n.language] || obj.en || Object.values(obj)[0] || '';
  };

  // Helper to check if product is available
  const isProductAvailable = (item) => {
    return getLocalized(item.name) && item.price;
  };

  const getSubtotal = () => {
    return cart.filter(isProductAvailable).reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getShippingCost = () => {
    return getSubtotal() > 1000 ? 0 : 100;
  };

  const getTotal = () => {
    return getSubtotal() + getShippingCost();
  };

  const handleNext = () => {
    if (activeStep === 0 && cart.length === 0) {
      showSnackbar('Your cart is empty', 'warning');
      return;
    }
    
    if (activeStep === 1) {
      // Validate shipping details
      const required = ['name', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
      const missing = required.filter(field => !checkoutData[field]);
      if (missing.length > 0) {
        showSnackbar('Please fill in all required fields', 'error');
        return;
      }
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handlePlaceOrder = async () => {
    try {
      const orderDetails = {
        orderNumber: `ORD-${Date.now()}`,
        userId: currentUser?.id,
        items: cart,
        status: "pending",
        createdAt: serverTimestamp(),
        shippingDetails: checkoutData,
        total: getTotal(),
        subtotal: getSubtotal(),
        shippingCost: getShippingCost()
      };
      await addDoc(collection(db, "orders"), orderDetails);
      setOrderPlaced(true);
      await clearCart();
      setActiveStep(3);
      showSnackbar('Order placed successfully!', 'success');
    } catch (error) {
      showSnackbar('Failed to place order. Please try again.', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleInputChange = (field, value) => {
    setCheckoutData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32', mb: 2 }}>
            {t('shopping_cart')}
          </Typography>
      </Box>
        
        <Grid container spacing={4}>
          <Grid xs={12} lg={8}>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#2E7D32' }}>
                {t('cart_items')}
              </Typography>
              {[1, 2, 3].map((item) => (
                <Card key={item} sx={{ mb: 3, p: 2 }}>
                  <Grid container columns={12} spacing={2} alignItems="center">
                    <Grid xs={12} sm={3}>
                      <Skeleton variant="rectangular" width={100} height={100} sx={{ borderRadius: 2 }} />
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
                      <Skeleton variant="text" width="40%" height={24} />
                    </Grid>
                    <Grid xs={12} sm={3}>
                      <Skeleton variant="rectangular" width={120} height={40} />
                    </Grid>
                    <Grid xs={12} sm={2}>
                      <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
                      <Skeleton variant="rectangular" width={80} height={32} sx={{ mb: 1 }} />
                      <Skeleton variant="rectangular" width={40} height={40} />
                    </Grid>
                  </Grid>
                </Card>
              ))}
            </Paper>
          </Grid>
          <Grid xs={12} lg={4}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Order Summary
              </Typography>
              <Skeleton variant="text" width="100%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="100%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="100%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="100%" height={24} sx={{ mb: 3 }} />
              <Skeleton variant="rectangular" width="100%" height={48} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (cart.length === 0 && activeStep === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={2} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <ShoppingCart sx={{ fontSize: 80, color: '#ccc', mb: 3 }} />
          <Typography variant="h4" color="text.secondary" gutterBottom>
            {t('cart_empty')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {t('cart_empty_subtitle')}
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
            {t('browse_products')}
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fafafa', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold', 
              color: '#2E7D32',
              mb: 2
            }}
          >
            {t('shopping_cart')}
          </Typography>
        </Box>

        {/* Stepper */}
        <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Grid container columns={12} spacing={4}>
          {/* Main Content */}
          <Grid xs={12} lg={8}>
            {activeStep === 0 && (
              <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#2E7D32' }}>
                  {t('cart_items')} ({cart.filter(isProductAvailable).length})
                </Typography>
                
                {/* Show unavailable products warning */}
                {cart.filter(item => !isProductAvailable(item)).length > 0 && (
                  <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                    <Typography variant="body2">
                      {t('some_items_unavailable')}
                    </Typography>
                  </Alert>
                )}
                
                {cart.map((item) => (
                  <Card key={item.id} sx={{ mb: 3, p: 2 }}>
                    <Grid container columns={12} spacing={2} alignItems="center">
                      <Grid xs={12} sm={3}>
                        <img 
                          src={item.imageUrl || 'https://via.placeholder.com/100x100?text=Product'}
                          alt={getLocalized(item.name) || 'Product'}
                          style={{ 
                            width: '100%', 
                            height: 'auto', 
                            borderRadius: 8,
                            maxWidth: 100
                          }}
                        />
                      </Grid>
                      <Grid xs={12} sm={4}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {getLocalized(item.name) || 'Product no longer available'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {getLocalized(item.description) || 'This product has been removed from our catalog.'}
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#2E7D32', fontWeight: 'bold', mt: 1 }}>
                          {item.price ? `₹${item.price}` : 'Price not available'}
                        </Typography>
                        {!isProductAvailable(item) && (
                          <Chip 
                            label="No longer available" 
                            color="error" 
                            size="small" 
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Grid>
                      <Grid xs={12} sm={3}>
                        {isProductAvailable(item) ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton 
                            size="small"
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          >
                            <Remove />
                          </IconButton>
                          <Typography sx={{ px: 2, minWidth: 40, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton 
                            size="small"
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          >
                            <Add />
                          </IconButton>
                        </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Quantity: {item.quantity}
                          </Typography>
                        )}
                      </Grid>
                      <Grid xs={12} sm={2}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {item.price ? `₹${item.price * item.quantity}` : 'N/A'}
                          </Typography>
                          {isProductAvailable(item) ? (
                            <>
                          <Button
                            size="small"
                            color="secondary"
                            onClick={() => moveToWishlist(item)}
                          >
                            Move to Wishlist
                          </Button>
                          <IconButton 
                            color="error"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Delete />
                          </IconButton>
                          <Button
                            size="small"
                            color="primary"
                            onClick={() => { setReviewProduct(item); setReviewDialogOpen(true); }}
                            sx={{ mt: 1 }}
                          >
                            {t('review.write_review')}
                          </Button>
                            </>
                          ) : (
                            <Button
                              size="small"
                              color="error"
                              onClick={() => removeFromCart(item.id)}
                              variant="outlined"
                            >
                              Remove
                            </Button>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                ))}
              </Paper>
            )}

            {activeStep === 1 && (
              <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#2E7D32' }}>
                  Shipping Details
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name *"
                      value={checkoutData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email *"
                      type="email"
                      value={checkoutData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number *"
                      value={checkoutData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address *"
                      multiline
                      rows={3}
                      value={checkoutData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="City *"
                      value={checkoutData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="State *"
                      value={checkoutData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Pincode *"
                      value={checkoutData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      required
                    />
                  </Grid>
                </Grid>
              </Paper>
            )}

            {activeStep === 2 && (
              <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#2E7D32' }}>
                  Payment Method
                </Typography>
                
                <FormControl component="fieldset">
                  <FormLabel component="legend">Choose Payment Method</FormLabel>
                  <RadioGroup
                    value={checkoutData.paymentMethod}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  >
                    <FormControlLabel 
                      value="cod" 
                      control={<Radio />} 
                      label="Cash on Delivery" 
                    />
                    <FormControlLabel 
                      value="card" 
                      control={<Radio />} 
                      label="Credit/Debit Card" 
                    />
                    <FormControlLabel 
                      value="upi" 
                      control={<Radio />} 
                      label="UPI Payment" 
                    />
                  </RadioGroup>
                </FormControl>
              </Paper>
            )}

            {activeStep === 3 && (
              <Paper elevation={2} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 80, color: '#2E7D32', mb: 3 }} />
                <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', color: '#2E7D32' }}>
                  Order Confirmed!
                </Typography>
                <Typography variant="body1" sx={{ mb: 4 }}>
                  Thank you for your order. We'll send you a confirmation email with tracking details.
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
                  Continue Shopping
                </Button>
              </Paper>
            )}
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} lg={4}>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 2, position: 'sticky', top: 24 }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#2E7D32' }}>
                Order Summary
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography>{t('subtotal')}:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>₹{getSubtotal()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography>Shipping:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>₹{getShippingCost()}</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{t('total')}:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                    ₹{getTotal()}
                  </Typography>
                </Box>
                
                {getShippingCost() > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Add ₹{1000 - getSubtotal()} more for free shipping!
                  </Alert>
                )}
              </Box>

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                {activeStep > 0 && (
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    startIcon={<ArrowBack />}
                    fullWidth
                  >
                    {t('back')}
                  </Button>
                )}
                
                {activeStep < 2 && (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    fullWidth
                    sx={{
                      backgroundColor: '#2E7D32',
                      '&:hover': {
                        backgroundColor: '#1B5E20'
                      }
                    }}
                  >
                    {t('next')}
                  </Button>
                )}
                
                {activeStep === 2 && (
                  <Button
                    variant="contained"
                    onClick={handlePlaceOrder}
                    fullWidth
                    sx={{
                      backgroundColor: '#2E7D32',
                      '&:hover': {
                        backgroundColor: '#1B5E20'
                      }
                    }}
                  >
                    {t('place_order')}
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
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

      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('review.write_review')}</DialogTitle>
        <DialogContent>
          {reviewProduct && (
            <ProductReview
              productId={reviewProduct.id}
              productName={getLocalized(reviewProduct.name)}
              onReviewAdded={() => setReviewDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ShoppingCartPage; 