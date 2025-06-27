import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const CartWishlistContext = createContext();

export const useCartWishlist = () => {
  const context = useContext(CartWishlistContext);
  if (!context) {
    throw new Error('useCartWishlist must be used within a CartWishlistProvider');
  }
  return context;
};

export const CartWishlistProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const cartDebounceRef = useRef();
  const wishlistDebounceRef = useRef();

  // Load cart and wishlist from Firebase when user changes
  useEffect(() => {
    if (currentUser) {
      loadUserData();
    } else {
      // Clear data when user logs out
      setCart([]);
      setWishlist([]);
      setLoading(false);
    }
  }, [currentUser]);

  // Real-time listeners for cart and wishlist changes
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeCart = onSnapshot(
      doc(db, 'userCarts', currentUser.id),
      (doc) => {
        if (doc.exists()) {
          setCart(doc.data().items || []);
        } else {
          setCart([]);
        }
      },
      (error) => {
        console.error('Error listening to cart:', error);
        setCart([]);
      }
    );

    const unsubscribeWishlist = onSnapshot(
      doc(db, 'userWishlists', currentUser.id),
      (doc) => {
        if (doc.exists()) {
          setWishlist(doc.data().items || []);
        } else {
          setWishlist([]);
        }
      },
      (error) => {
        console.error('Error listening to wishlist:', error);
        setWishlist([]);
      }
    );

    return () => {
      unsubscribeCart();
      unsubscribeWishlist();
    };
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load cart
      const cartDoc = await getDoc(doc(db, 'userCarts', currentUser.id));
      if (cartDoc.exists()) {
        setCart(cartDoc.data().items || []);
      } else {
        setCart([]);
      }

      // Load wishlist
      const wishlistDoc = await getDoc(doc(db, 'userWishlists', currentUser.id));
      if (wishlistDoc.exists()) {
        setWishlist(wishlistDoc.data().items || []);
      } else {
        setWishlist([]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setCart([]);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced saveCart
  const saveCart = (newCart) => {
    if (!currentUser) return;
    if (cartDebounceRef.current) clearTimeout(cartDebounceRef.current);
    cartDebounceRef.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'userCarts', currentUser.id), {
          userId: currentUser.id,
          items: newCart,
          updatedAt: new Date()
        });
        setCart(newCart);
      } catch (err) {
        setError('Failed to save cart. Please try again.');
        console.error('Error saving cart:', err);
      }
    }, 300); // 300ms debounce
  };

  // Debounced saveWishlist
  const saveWishlist = (newWishlist) => {
    if (!currentUser) return;
    if (wishlistDebounceRef.current) clearTimeout(wishlistDebounceRef.current);
    wishlistDebounceRef.current = setTimeout(async () => {
      try {
        await setDoc(doc(db, 'userWishlists', currentUser.id), {
          userId: currentUser.id,
          items: newWishlist,
          updatedAt: new Date()
        });
        setWishlist(newWishlist);
      } catch (err) {
        setError('Failed to save wishlist. Please try again.');
        console.error('Error saving wishlist:', err);
      }
    }, 300); // 300ms debounce
  };

  const addToCart = async (product) => {
    if (!currentUser) return;

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
    
    await saveCart(newCart);
  };

  const removeFromCart = async (productId) => {
    if (!currentUser) return;

    const newCart = cart.filter(item => item.id !== productId);
    await saveCart(newCart);
  };

  const updateCartQuantity = async (productId, newQuantity) => {
    if (!currentUser) return;

    if (newQuantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    
    const newCart = cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    );
    
    await saveCart(newCart);
  };

  const clearCart = async () => {
    if (!currentUser) return;
    await saveCart([]);
  };

  const addToWishlist = async (productId) => {
    if (!currentUser) return;

    if (!wishlist.includes(productId)) {
      const newWishlist = [...wishlist, productId];
      await saveWishlist(newWishlist);
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!currentUser) return;

    const newWishlist = wishlist.filter(id => id !== productId);
    await saveWishlist(newWishlist);
  };

  const moveToWishlist = async (product) => {
    if (!currentUser) return;

    await addToWishlist(product.id);
    await removeFromCart(product.id);
  };

  const moveToCart = async (product) => {
    if (!currentUser) return;

    await addToCart(product);
    await removeFromWishlist(product.id);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getWishlistCount = () => {
    return wishlist.length;
  };

  const value = {
    cart,
    wishlist,
    loading,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    addToWishlist,
    removeFromWishlist,
    moveToWishlist,
    moveToCart,
    saveCart,
    getCartTotal,
    getCartItemCount,
    getWishlistCount
  };

  return (
    <CartWishlistContext.Provider value={value}>
      {children}
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </CartWishlistContext.Provider>
  );
}; 