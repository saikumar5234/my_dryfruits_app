import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  Container,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Chip
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import ProductForm from './ProductForm';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, product: null });
  const [priceRange, setPriceRange] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { t, i18n } = useTranslation();

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
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setShowForm(true);
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'products', deleteDialog.product.id));
      setProducts(products.filter(p => p.id !== deleteDialog.product.id));
      setDeleteDialog({ open: false, product: null });
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditProduct(null);
    fetchProducts();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditProduct(null);
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

  // Get unique categories for tabs
  const categories = ['all', ...Array.from(new Set(products.map(p => getLocalized(p.category).toLowerCase())))].filter(Boolean);

  const filteredProducts = products.filter(product => {
    const category = getLocalized(product.category).toLowerCase();
    const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
    const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
    return matchesCategory && matchesPrice;
  });

  // For Tabs: find the index of the selected category
  const activeTab = Math.max(0, categories.findIndex(cat => cat === selectedCategory));

  if (loading) {
    return (
      <Container>
        <Typography variant="h6" sx={{ mt: 4 }}>Loading products...</Typography>
      </Container>
    );
  }

  if (showForm) {
    return (
      <ProductForm
        product={editProduct}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Product Management</Typography>
          <Button
            variant="contained"
            onClick={() => setShowForm(true)}
            size="large"
          >
            Add New Product
          </Button>
        </Box>

        {/* Category Tabs */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setSelectedCategory(categories[newValue])}
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
            {categories.map((cat, idx) => (
              <Tab key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)} />
            ))}
          </Tabs>
        </Box>

        {/* Price Range Dropdown */}
        <Box sx={{ mb: 3, maxWidth: 220 }}>
          <FormControl fullWidth sx={{ minWidth: 130 }}>
            <InputLabel>Price Range</InputLabel>
            <Select
              value={priceRange}
              label="Price Range"
              onChange={e => setPriceRange(e.target.value)}
            >
              <MenuItem value="all">All Prices</MenuItem>
              <MenuItem value="low">Under ₹400</MenuItem>
              <MenuItem value="medium">₹400 - ₹700</MenuItem>
              <MenuItem value="high">Over ₹700</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container columns={12} spacing={3}>
          {filteredProducts.map((product, idx) => (
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
                {/* Badges */}
                {product.inStock === false && (
                  <Chip label="" color="error" size="small" sx={{ position: 'absolute', top: 10, left: 10, zIndex: 2, fontWeight: 'bold', bgcolor: '#e57373', color: 'white' }} />
                )}
                {product.createdAt && (Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 14) && (
                  <Chip label="New" color="secondary" size="small" sx={{ position: 'absolute', top: 10, left: 120, zIndex: 2, fontWeight: 'bold', bgcolor: '#F9A825', color: '#fff' }} />
                )}
                {/* Product Image */}
                <CardMedia
                  component="img"
                  image={product.imageUrl || 'https://via.placeholder.com/350x220?text=Premium+Dry+Fruits'}
                  alt={getLocalized(product.name)}
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
                />
                {/* Admin Actions moved to bottom right */}
                <CardContent sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', p: 2, minHeight: 0 }}>
                  <Typography
                    gutterBottom
                    variant="h6"
                    component="h2"
                    sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.05rem', lineHeight: 1.3, mb: 1 }}
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
                      <IconButton
                        color="primary"
                        aria-label="Edit product"
                        onClick={() => handleEdit(product)}
                        size="small"
                        sx={{'&:hover, &:focus': { color: '#1976d2', background: '#e3f2fd' }}}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        aria-label="Delete product"
                        onClick={() => setDeleteDialog({ open: true, product })}
                        size="small"
                        sx={{'&:hover, &:focus': { color: '#d32f2f', background: '#ffebee' }}}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredProducts.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No products found. Add your first product!
            </Typography>
          </Box>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, product: null })}>
        <DialogTitle>{t('confirm_delete')}</DialogTitle>
        <DialogContent>
          {t('delete_product_confirm', { name: getLocalized(deleteDialog.product?.name) })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, product: null })}>
            {t('cancel')}
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductList; 