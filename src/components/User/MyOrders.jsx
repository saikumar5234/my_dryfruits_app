import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Skeleton,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ShoppingBag,
  LocalShipping,
  CheckCircle,
  Cancel,
  Schedule,
  Build
} from '@mui/icons-material';

const getOrderTotal = (items) => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

const getLocalized = (obj) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj['en'] || obj[Object.keys(obj)[0]] || '';
};

const MyOrders = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();

  const getStatusConfig = (status) => {
    switch (status) {
      case 'cancelled':
        return {
          color: 'error',
          icon: <Cancel />,
          label: t('cancelled')
        };
      case 'completed':
        return {
          color: 'success',
          icon: <CheckCircle />,
          label: t('completed')
        };
      case 'pending':
        return {
          color: 'warning',
          icon: <Schedule />,
          label: t('pending')
        };
      case 'processing':
        return {
          color: 'info',
          icon: <Build />,
          label: t('processing')
        };
      case 'shipped':
        return {
          color: 'primary',
          icon: <LocalShipping />,
          label: t('shipped')
        };
      default:
        return {
          color: 'default',
          icon: <ShoppingBag />,
          label: status
        };
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const fetchOrders = async () => {
      const q = query(collection(db, 'orders'), where('userId', '==', currentUser.id));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by createdAt descending (most recent first)
      ordersData.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      });
      setOrders(ordersData);
      setLoading(false);
    };
    fetchOrders();
  }, [currentUser]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 2, pt: { xs: '0px', md: '20px' } }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32', mb: 4 }}>
          {t('my_orders')}
        </Typography>
        
        {isMobile ? (
          // Mobile skeleton
          <Grid container spacing={2}>
            {[1, 2, 3].map((item) => (
              <Grid item xs={12} key={item}>
                <Card>
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
                    <Skeleton variant="rectangular" height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="rectangular" height={20} sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="30%" height={24} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          // Desktop skeleton
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('order_id')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('status')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('created_at')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('items')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('total')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 2, 3].map((item) => (
                  <TableRow key={item}>
                    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="90%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    );
  }

  if (orders.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4, pt: { xs: '0px', md: '20px' } }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('no_orders_yet')}
          </Typography>
          <Typography variant="body2">
            {t('no_orders_subtitle')}
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2, pt: { xs: '0px', md: '20px' } }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32', mb: 4 }}>
        {t('my_orders')} ({orders.length})
      </Typography>

      {isMobile ? (
        // Mobile view - Card layout
        <Grid container spacing={3}>
          {orders.map(order => {
            const statusConfig = getStatusConfig(order.status);
            return (
              <Grid item xs={12} key={order.id}>
                <Card sx={{ borderRadius: 2, boxShadow: 2, mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                        #{order.orderNumber || order.id.slice(-8)}
                      </Typography>
                      <Chip
                        icon={statusConfig.icon}
                        label={statusConfig.label}
                        color={statusConfig.color}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                        aria-label={statusConfig.label}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : ''}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {t('items')}:
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {order.items?.map((item, idx) => (
                          <Typography key={idx} variant="body2" component="li" color="text.secondary">
                            {getLocalized(item.name)} x {item.quantity}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                      {t('total')}: ₹{getOrderTotal(order.items)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        // Desktop view - Table layout
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2, overflowX: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('order_id')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('status')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('created_at')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('items')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('total')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map(order => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <TableRow key={order.id} hover tabIndex={0} sx={{ '&:hover, &:focus': { backgroundColor: '#e8f5e9' } }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                      #{order.orderNumber || order.id.slice(-8)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={statusConfig.icon}
                        label={statusConfig.label}
                        color={statusConfig.color}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                        aria-label={statusConfig.label}
                      />
                    </TableCell>
                    <TableCell>
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : ''}
                    </TableCell>
                    <TableCell>
                      <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {order.items?.map((item, idx) => (
                          <Typography key={idx} variant="body2" component="li" color="text.secondary">
                            {getLocalized(item.name)} x {item.quantity}
                          </Typography>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                      ₹{getOrderTotal(order.items)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default MyOrders; 