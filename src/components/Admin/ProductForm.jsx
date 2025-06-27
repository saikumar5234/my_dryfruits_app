import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Alert,
  Grid,
  Card,
  CardMedia,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { storage, db } from '../../firebase';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const ProductForm = ({ product, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [name, setName] = useState({
    en: product?.name?.en || product?.name || '',
    te: product?.name?.te || '',
    hi: product?.name?.hi || ''
  });
  const [price, setPrice] = useState(product?.price || '');
  const [description, setDescription] = useState({
    en: product?.description?.en || product?.description || '',
    te: product?.description?.te || '',
    hi: product?.description?.hi || ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.imageUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState(product?.category || 'premium');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Image selected:', file.name, file.size);
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    try {
      console.log('Starting image upload...');
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      console.log('Storage reference created:', storageRef.fullPath);
      
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Image uploaded successfully:', snapshot);
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const createPriceHistoryEntry = async (productId, price) => {
    try {
      const priceHistoryRef = collection(db, 'products', productId, 'priceHistory');
      const today = new Date();
      const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      await addDoc(priceHistoryRef, {
        price: parseFloat(price),
        date: dateString,
        createdAt: today,
        type: 'initial' // Mark as initial price entry
      });
      
      console.log('Price history entry created for new product');
    } catch (error) {
      console.error('Error creating price history entry:', error);
      // Don't throw error here as it shouldn't prevent product creation
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    console.log('[DEBUG] handleSubmit called');

    try {
      console.log('[DEBUG] Form data:', { name, price, description, hasImage: !!image, imagePreview, category });
      
      let imageUrl = product?.imageUrl || '';
      
      if (image) {
        console.log('[DEBUG] Uploading image...');
        imageUrl = await uploadImage(image);
        console.log('[DEBUG] Image uploaded, URL:', imageUrl);
      } else if (imagePreview && !image) {
        // If an image URL is provided and no file is uploaded, use the URL
        imageUrl = imagePreview;
        console.log('[DEBUG] Using imagePreview as imageUrl:', imageUrl);
      }

      const productData = {
        name,
        price: parseFloat(price),
        description,
        imageUrl,
        category,
        createdAt: product ? product.createdAt : new Date(),
        updatedAt: new Date()
      };

      console.log('[DEBUG] Product data to save:', productData);

      if (product) {
        // Update existing product
        console.log('[DEBUG] Updating existing product...');
        await updateDoc(doc(db, 'products', product.id), productData);
        console.log('[DEBUG] Product updated successfully');
        
        // Dispatch event for product update
        window.dispatchEvent(new Event('productPriceUpdated'));
        console.log('[DEBUG] productPriceUpdated event dispatched');
      } else {
        // Add new product
        console.log('[DEBUG] Adding new product...');
        const docRef = await addDoc(collection(db, 'products'), productData);
        console.log('[DEBUG] Product added successfully with ID:', docRef.id);
        
        // Create initial price history entry for new product
        await createPriceHistoryEntry(docRef.id, price);
        console.log('[DEBUG] Initial price history entry created');
        
        // Dispatch event for new product
        window.dispatchEvent(new Event('productAdded'));
        console.log('[DEBUG] productAdded event dispatched');
      }

      console.log('[DEBUG] Product save completed successfully');
      onSave();
      console.log('[DEBUG] onSave callback called');
    } catch (error) {
      console.error('[DEBUG] Error saving product:', error);
      console.error('[DEBUG] Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      setError(`Error saving product: ${error.message}`);
    } finally {
      setLoading(false);
      console.log('[DEBUG] handleSubmit finished');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            {product ? 'Edit Product' : 'Add New Product'}
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <motion.div
              animate={error ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>Product Name</Typography>
                  <TextField
                    fullWidth
                    label="English"
                    value={name.en}
                    onChange={e => setName({ ...name, en: e.target.value })}
                    required
                    margin="dense"
                  />
                  <TextField
                    fullWidth
                    label="Telugu"
                    value={name.te}
                    onChange={e => setName({ ...name, te: e.target.value })}
                    margin="dense"
                  />
                  <TextField
                    fullWidth
                    label="Hindi"
                    value={name.hi}
                    onChange={e => setName({ ...name, hi: e.target.value })}
                    margin="dense"
                  />
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Description</Typography>
                  <TextField
                    fullWidth
                    label="English"
                    multiline
                    rows={2}
                    value={description.en}
                    onChange={e => setDescription({ ...description, en: e.target.value })}
                    margin="dense"
                  />
                  <TextField
                    fullWidth
                    label="Telugu"
                    multiline
                    rows={2}
                    value={description.te}
                    onChange={e => setDescription({ ...description, te: e.target.value })}
                    margin="dense"
                  />
                  <TextField
                    fullWidth
                    label="Hindi"
                    multiline
                    rows={2}
                    value={description.hi}
                    onChange={e => setDescription({ ...description, hi: e.target.value })}
                    margin="dense"
                  />
                  <TextField
                    fullWidth
                    label="Price (₹)"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    margin="normal"
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <TextField
                    fullWidth
                    label="Image URL (optional)"
                    value={imagePreview && !image ? imagePreview : ''}
                    onChange={e => {
                      setImagePreview(e.target.value);
                      setImage(null);
                    }}
                    margin="normal"
                    placeholder="https://example.com/image.jpg"
                    helperText="Paste a public image URL if you don't want to upload."
                  />
                  <Button
                    variant="contained"
                    component="label"
                    sx={{ mt: 2 }}
                  >
                    Upload Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </Button>
                  {image && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Selected: {image.name}
                    </Typography>
                  )}
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="category-label">{t('category')}</InputLabel>
                    <Select
                      labelId="category-label"
                      value={category}
                      label={t('category')}
                      onChange={e => setCategory(e.target.value)}
                      required
                    >
                      <MenuItem value="nuts">{t('nuts')}</MenuItem>
                      <MenuItem value="dried_fruits">{t('dried_fruits')}</MenuItem>
                      <MenuItem value="mixed">{t('mixed')}</MenuItem>
                      <MenuItem value="premium">{t('premium')}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  {imagePreview && (
                    <Card sx={{ maxWidth: 345 }}>
                      <CardMedia
                        component="img"
                        height="300"
                        image={imagePreview}
                        alt="Product preview"
                        sx={{ objectFit: 'cover' }}
                      />
                    </Card>
                  )}
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  size="large"
                >
                  {loading ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  size="large"
                >
                  Cancel
                </Button>
              </Box>
            </motion.div>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProductForm; 