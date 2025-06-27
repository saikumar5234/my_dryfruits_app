import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartWishlistProvider } from './contexts/CartWishlistContext';

// Components
import Navbar from './components/Layout/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProductCatalog from './components/User/ProductCatalog';
import PriceAnalytics from './components/User/PriceAnalytics';
import AdminDashboard from './components/Admin/AdminDashboard';
import ShoppingCartPage from './components/User/ShoppingCart';
import Wishlist from './components/User/Wishlist';
import Orders from './components/Admin/Orders';
import MyOrders from './components/User/MyOrders';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32',
    },
    secondary: {
      main: '#FF8F00',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false, requireApproval = false }) => {
  const { currentUser, isAdmin, canAccessAnalytics, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  if (requireApproval && !canAccessAnalytics()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route Component (redirects if already logged in)
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main App Content
const AppContent = () => {
  const { currentUser, isAdmin } = useAuth();

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar user={currentUser} isAdmin={isAdmin()} />
        
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Routes>
            {/* Protected home route */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <ProductCatalog />
                </ProtectedRoute>
              } 
            />
            {/* Public catalog route (optional, can be removed if not needed) */}
            <Route path="/catalog" element={<ProductCatalog />} />
            
            {/* Protected Analytics route - requires approval */}
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute requireApproval={true}>
                  <PriceAnalytics />
                </ProtectedRoute>
              } 
            />
            
            {/* Auth routes */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login onToggleAuth={() => window.location.href = '/register'} />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register onToggleAuth={() => window.location.href = '/login'} />
                </PublicRoute>
              } 
            />
            
            {/* Protected admin routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected admin orders route */}
            <Route 
              path="/admin/orders"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <Orders />
                </ProtectedRoute>
              }
            />
            
            {/* Shopping Cart route */}
            <Route 
              path="/cart" 
              element={
                <ProtectedRoute>
                  <ShoppingCartPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Wishlist route */}
            <Route 
              path="/wishlist" 
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              } 
            />
            
            {/* My Orders route */}
            <Route 
              path="/my-orders"
              element={
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              }
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartWishlistProvider>
        <AppContent />
      </CartWishlistProvider>
    </AuthProvider>
  );
}

export default App;
