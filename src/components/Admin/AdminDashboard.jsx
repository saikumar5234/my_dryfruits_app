import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Tabs,
  Tab,
  Alert,
  Chip,
  Button,
  Snackbar
} from '@mui/material';
import { 
  Inventory, 
  AttachMoney, 
  People, 
  TrendingUp,
  AdminPanelSettings,
  Security,
  Notifications,
  ArrowBack,
  Store
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import ProductList from './ProductList';
import UserManagement from './UserManagement';
import NotificationsPanel from './Notifications';
import UpdateProductPrice from './UpdateProductPrice';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation, Trans } from 'react-i18next';
import { motion, useAnimation } from 'framer-motion';
import { useEffect as useReactEffect, useRef as useReactRef } from 'react';

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    growthRate: 0
  });
  const [hasAnimatedStats, setHasAnimatedStats] = useState({
    totalProducts: false,
    totalRevenue: false,
    totalCustomers: false
  });
  const { currentUser, notifications, users } = useAuth();
  const navigate = useNavigate();
  const [showUpdatePrice, setShowUpdatePrice] = useState(false);
  const { t } = useTranslation();
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    fetchStats();
    
    // Listen for product updates to refresh stats
    const handleProductUpdate = () => {
      fetchStats();
    };
    
    const handleProductAdded = () => {
      fetchStats();
    };
    
    window.addEventListener('productPriceUpdated', handleProductUpdate);
    window.addEventListener('productAdded', handleProductAdded);
    
    return () => {
      window.removeEventListener('productPriceUpdated', handleProductUpdate);
      window.removeEventListener('productAdded', handleProductAdded);
    };
  }, [users]);

  const getOrderTotal = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const fetchStats = async () => {
    try {
      // Fetch total products from Firestore
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const totalProducts = productsSnapshot.size;

      // Get users from AuthContext (now from Firebase)
      const totalCustomers = users.filter(u => (u.role || '').toLowerCase() === 'user').length;

      // Fetch orders and calculate total revenue
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      let totalRevenue = 0;
      ordersSnapshot.forEach(doc => {
        const data = doc.data();
        totalRevenue += getOrderTotal(data.items);
      });

      setStats(prev => ({
        ...prev,
        totalProducts,
        totalCustomers,
        totalRevenue
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const StatCard = ({ title, value, icon, color, hasAnimated, onAnimated }) => {
    // Helper function to determine font size based on revenue amount
    const getRevenueFontSize = (amount) => {
      const numStr = amount.toString();
      if (numStr.length <= 4) return 'h3'; // Up to 9999
      if (numStr.length <= 6) return 'h4'; // Up to 999999 (lakhs)
      if (numStr.length <= 8) return 'h5'; // Up to 99999999 (crores)
      return 'h6'; // For very large amounts
    };

    // Helper function to format revenue with appropriate suffix
    const formatRevenue = (amount) => {
      if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(1)}Cr`;
      } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
      } else if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}K`;
      }
      return `₹${amount.toLocaleString()}`;
    };

    const isRevenue = title === 'Total Revenue';
    const fontSize = isRevenue ? getRevenueFontSize(value) : 'h3';

    // Framer Motion count-up animation
    const controls = useAnimation();
    const nodeRef = useReactRef();
    const [displayValue, setDisplayValue] = React.useState(0);
    useReactEffect(() => {
      if (!hasAnimated) {
        let start = 0;
        let end = value;
        let duration = 1.2;
        let startTime = null;
        function animateCountUp(timestamp) {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
          const current = Math.floor(progress * (end - start) + start);
          setDisplayValue(current);
          if (progress < 1) {
            requestAnimationFrame(animateCountUp);
          } else {
            setDisplayValue(end);
            if (onAnimated) onAnimated();
          }
        }
        requestAnimationFrame(animateCountUp);
      } else {
        setDisplayValue(value);
      }
    }, [value, hasAnimated, onAnimated]);

    return (
      <motion.div
        whileHover={{ scale: 1.04, boxShadow: '0 8px 32px 0 rgba(46,125,50,0.10)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ height: '100%' }}
      >
        <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 3 }} ref={nodeRef}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{
                backgroundColor: color,
                borderRadius: '50%',
                p: 2,
                mr: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 2
              }}>
                {icon}
              </Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                {title}
              </Typography>
            </Box>
            <Typography
              variant={fontSize}
              component="div"
              sx={{
                fontWeight: 'bold',
                color: color,
                wordBreak: 'break-word',
                lineHeight: 1.2,
                minHeight: isRevenue ? 'auto' : 'inherit'
              }}
            >
              {isRevenue ? formatRevenue(displayValue) : displayValue}
            </Typography>
            {isRevenue && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, fontStyle: 'italic' }}
              >
                Total: ₹{value.toLocaleString()}
              </Typography>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Snackbar handler for price update
  const handlePriceUpdateSuccess = (productName) => {
    setSnackbar({ open: true, message: `${productName} updated successfully!` });
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fafafa', pt: { xs: '0px', md: '20px' } }}>
      <Box sx={{ py: 2, px: { xs: 2, sm: 4, md: 6, lg: 8 } }}>
        {/* Admin Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                sx={{ 
                  borderColor: '#2E7D32',
                  color: '#2E7D32',
                  '&:hover': {
                    borderColor: '#1B5E20',
                    backgroundColor: 'rgba(46, 125, 50, 0.04)'
                  }
                }}
              >
                {t('back')}
              </Button>
              <AdminPanelSettings sx={{ fontSize: 40, color: '#2E7D32', mr: 2, ml: 2 }} />
              <Typography 
                variant="h2" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: '#2E7D32',
                  fontSize: { xs: '2rem', md: '3rem', lg: '3.5rem' }
                }}
              >
                {t('admin_dashboard')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                component={Link}
                to="/admin/orders"
                sx={{ minWidth: 140 }}
              >
                View Orders
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShowUpdatePrice(true)}
                sx={{ minWidth: 140 }}
              >
                {t('update_price')}
              </Button>
            </Box>
          </Box>
          
          <Alert 
            severity="info" 
            icon={<Security />}
            sx={{ 
              mb: 3,
              borderRadius: 2,
              display: 'inline-flex',
              px: 3,
              py: 1,
              '& .MuiAlert-message': { fontSize: '1rem' }
            }}
          >
            <Trans i18nKey="welcome_back_admin" values={{ name: currentUser?.name }}>
              Welcome back, <strong>{{ name: currentUser?.name }}</strong>! You have full administrative access to manage products, view analytics, and control the store.
            </Trans>
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <Chip 
              label={t('administrator')}
              color="primary" 
              icon={<AdminPanelSettings />}
              sx={{ fontWeight: 'bold' }}
            />
            <Chip 
              label={t('logged_in_as', { email: currentUser?.email })}
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </Box>
        
        {/* Stats Cards */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title={t('total_products')}
              value={stats.totalProducts}
              icon={<Inventory sx={{ color: 'white', fontSize: 28 }} />}
              color="#1976d2"
              hasAnimated={hasAnimatedStats.totalProducts}
              onAnimated={() => setHasAnimatedStats(s => ({ ...s, totalProducts: true }))}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title={t('total_revenue')}
              value={stats.totalRevenue}
              icon={<AttachMoney sx={{ color: 'white', fontSize: 28 }} />}
              color="#2E7D32"
              hasAnimated={hasAnimatedStats.totalRevenue}
              onAnimated={() => setHasAnimatedStats(s => ({ ...s, totalRevenue: true }))}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title={t('total_customers')}
              value={stats.totalCustomers}
              icon={<People sx={{ color: 'white', fontSize: 28 }} />}
              color="#FF8F00"
              hasAnimated={hasAnimatedStats.totalCustomers}
              onAnimated={() => setHasAnimatedStats(s => ({ ...s, totalCustomers: true }))}
            />
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              backgroundColor: 'white'
            }}
          >
            <Tab 
              label="Product Management" 
              sx={{ 
                py: 2, 
                px: 3,
                fontWeight: 'bold'
              }}
            />
            <Tab 
              label="User Management" 
              sx={{ 
                py: 2, 
                px: 3,
                fontWeight: 'bold'
              }}
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Notifications />
                  Notifications
                </Box>
              }
              sx={{ 
                py: 2, 
                px: 3,
                fontWeight: 'bold'
              }}
            />
            <Tab 
              label="Analytics" 
              sx={{ 
                py: 2, 
                px: 3,
                fontWeight: 'bold'
              }}
            />
            <Tab 
              label="Settings" 
              sx={{ 
                py: 2, 
                px: 3,
                fontWeight: 'bold'
              }}
            />
          </Tabs>
          
          <Box sx={{ p: 4, backgroundColor: 'white' }}>
            {tabValue === 0 && <ProductList />}
            {tabValue === 1 && <UserManagement />}
            {tabValue === 2 && <NotificationsPanel />}
            {tabValue === 3 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  Analytics Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Detailed analytics and reporting features coming soon...
                </Typography>
              </Box>
            )}
            {tabValue === 4 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  System Settings
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Configure system settings, security, and preferences coming soon...
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
      {/* Update Price Modal */}
      {showUpdatePrice && (
        <UpdateProductPrice 
          open={showUpdatePrice} 
          onClose={() => setShowUpdatePrice(false)} 
          onSuccess={handlePriceUpdateSuccess}
        />
      )}
      {/* Snackbar for price update */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={snackbar.message}
      />
    </Box>
  );
};

export default AdminDashboard; 