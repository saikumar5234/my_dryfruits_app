import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Fade
} from '@mui/material';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import Confetti from 'react-confetti';

const UpdateProductPrice = ({ open, onClose }) => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successProductName, setSuccessProductName] = useState('');
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
    };
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!selectedProduct || !price || !date) {
        setError('All fields are required.');
        setLoading(false);
        return;
      }
      
      console.log('Updating price for product:', selectedProduct);
      console.log('New price:', price);
      console.log('Date:', date);
      
      const priceHistoryRef = collection(db, 'products', selectedProduct, 'priceHistory');
      const dateString = date instanceof Date ? format(date, 'yyyy-MM-dd') : date;
      
      console.log('Date string:', dateString);
      
      // Check if a price history entry for this date already exists
      const q = query(priceHistoryRef, where('date', '==', dateString));
      const snapshot = await getDocs(q);
      const historyEntry = {
        price: parseFloat(price),
        date: dateString,
        createdAt: new Date(),
        type: 'manual_update'
      };
      if (!snapshot.empty) {
        // Update the existing entry
        const docId = snapshot.docs[0].id;
        await updateDoc(doc(priceHistoryRef, docId), historyEntry);
        console.log('Price history entry updated for date', dateString);
      } else {
        // Add a new entry
        await addDoc(priceHistoryRef, historyEntry);
        console.log('Price history entry created successfully');
      }
      
      // Update product price
      const productRef = doc(db, 'products', selectedProduct);
      await updateDoc(productRef, { 
        price: parseFloat(price), 
        updatedAt: new Date() 
      });
      console.log('Product price updated successfully');
      
      // Dispatch events to notify other components
      console.log('Dispatching productPriceUpdated event');
      window.dispatchEvent(new Event('productPriceUpdated'));
      
      // Find product name for success message
      const updatedProduct = products.find(p => p.id === selectedProduct);
      if (updatedProduct) {
        setSuccessProductName(getLocalized(updatedProduct.name));
        setPrice('');
        setDate(new Date());
        // Close dialog after animation
        setTimeout(() => {
          setSuccessProductName('');
          onClose();
        }, 2500);
      }
      return;
    } catch (err) {
      console.error('Error updating price:', err);
      setError('Failed to update price.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get localized field
  const getLocalized = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[i18n.language] || obj.en || Object.values(obj)[0] || '';
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          style={{ position: 'relative', zIndex: 1300 }}
        >
          <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Update Product Price</DialogTitle>
            <DialogContent>
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                {/* Success animation/message */}
                {successProductName ? (
                  <Fade in={!!successProductName} timeout={400}>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 4,
                      gap: 2,
                      animation: 'pop 0.5s cubic-bezier(.4,2,.6,1)'
                    }}>
                      {/* Confetti burst */}
                      <Confetti
                        width={window.innerWidth}
                        height={window.innerHeight}
                        numberOfPieces={120}
                        recycle={false}
                        run={!!successProductName}
                        style={{ position: 'fixed', top: 0, left: 0, zIndex: 2000, pointerEvents: 'none' }}
                      />
                      {/* Animated green circle with checkmark */}
                      <Box sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg,rgb(40, 143, 74) 0%,rgb(14, 133, 32) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 3,
                        mb: 2,
                        animation: 'pop 0.5s cubic-bezier(.4,2,.6,1)'
                      }}>
                        <svg width="40" height="40" viewBox="0 0 40 40">
                          <path
                            d="M12 21.5L18 27.5L28 15.5"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              strokeDasharray: 32,
                              strokeDashoffset: 32,
                              animation: 'checkmark-draw 0.7s 0.2s forwards cubic-bezier(.4,2,.6,1)'
                            }}
                          />
                        </svg>
                      </Box>
                      <Box sx={{ color: 'green', fontWeight: 'bold', fontSize: 20, textAlign: 'center' }}>
                        {successProductName} updated successfully!
                      </Box>
                    </Box>
                  </Fade>
                ) : (
                  <>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Select Product</InputLabel>
                      <Select
                        value={selectedProduct}
                        onChange={e => setSelectedProduct(e.target.value)}
                        label="Select Product"
                        required
                      >
                        {products.map(product => (
                          <MenuItem key={product.id} value={product.id}>{getLocalized(product.name)}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label="Today's Price"
                      type="number"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      margin="normal"
                      required
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Date"
                        value={date}
                        onChange={newValue => setDate(newValue)}
                        format="dd-MM-yyyy"
                        slotProps={{ textField: { fullWidth: true, margin: 'normal', required: true, helperText: 'Pick a date (DD-MM-YYYY)' } }}
                        views={["year", "month", "day"]}
                      />
                    </LocalizationProvider>
                    {error && <Box sx={{ color: 'red', mt: 1 }}>{error}</Box>}
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} color="secondary" disabled={!!successProductName}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading || !!successProductName}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </DialogActions>
          </Dialog>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Add pop and checkmark-draw animation keyframes
const style = document.createElement('style');
style.innerHTML = `@keyframes pop { 0% { transform: scale(0.7); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }\n@keyframes checkmark-draw { to { stroke-dashoffset: 0; } }`;
document.head.appendChild(style);

export default UpdateProductPrice; 