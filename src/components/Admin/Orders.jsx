import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
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
  Alert,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  useTheme,
  useMediaQuery,
  Button,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import {
  ShoppingBag,
  LocalShipping,
  CheckCircle,
  Cancel,
  Schedule,
  Build,
  Edit,
  Visibility,
  Print
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CloseIcon from '@mui/icons-material/Close';
import jsPDF from 'jspdf';
import html2pdf from 'html2pdf.js';
import { motion } from 'framer-motion';

// Helper to get localized string
const getLocalized = (obj) => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj['en'] || obj[Object.keys(obj)[0]] || '';
};

// Helper to calculate total
const getOrderTotal = (items) => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

const getStatusConfig = (status) => {
  switch (status) {
    case 'cancelled':
      return {
        color: 'error',
        icon: <Cancel />,
        label: 'Cancelled'
      };
    case 'completed':
      return {
        color: 'success',
        icon: <CheckCircle />,
        label: 'Completed'
      };
    case 'pending':
      return {
        color: 'warning',
        icon: <Schedule />,
        label: 'Pending'
      };
    case 'processing':
      return {
        color: 'info',
        icon: <Build />,
        label: 'Processing'
      };
    case 'shipped':
      return {
        color: 'primary',
        icon: <LocalShipping />,
        label: 'Shipped'
      };
    default:
      return {
        color: 'default',
        icon: <ShoppingBag />,
        label: status
      };
  }
};

const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'completed',
  'cancelled'
];

// Invoice template component (hidden)
const InvoiceTemplate = React.forwardRef(({ order, userName }, ref) => {
  console.log('InvoiceTemplate rendered', order, userName);
  if (!order) return null;
  let orderDateObj = null;
  if (order.createdAt) {
    if (typeof order.createdAt.toDate === 'function') {
      orderDateObj = order.createdAt.toDate();
    } else {
      orderDateObj = new Date(order.createdAt);
    }
  }
  if (!orderDateObj || isNaN(orderDateObj.getTime())) {
    orderDateObj = new Date();
  }
  const orderDate = orderDateObj.toLocaleDateString();
  return (
    <div ref={ref} id="invoice" style={{ width: '700px', padding: 32, fontFamily: 'Arial, sans-serif', background: '#fff', color: '#222', display: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <img src="https://dummyimage.com/120x40/1976d2/fff&text=LOGO" alt="Logo" style={{ height: 40, marginBottom: 8 }} />
          <div style={{ fontWeight: 700, fontSize: 18 }}>saini mewa stores</div>
          <div style={{ fontSize: 13 }}>123 Main St, City, Country</div>
          <div style={{ fontSize: 13 }}>Email: info@yourbusiness.com</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, fontSize: 24, color: '#1976d2' }}>INVOICE</div>
          <div style={{ fontSize: 13 }}>Invoice #: {order.orderNumber || order.id || order.orderId}</div>
          <div style={{ fontSize: 13 }}>Order ID: {order.id}</div>
          <div style={{ fontSize: 13 }}>Date: {orderDate}</div>
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Bill To:</div>
        <div style={{ fontSize: 15 }}>{userName || order.userId}</div>
        <div style={{ fontSize: 13 }}>Email: {order.userEmail || '-'}</div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Item</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Qty</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Unit Price</th>
            <th style={{ border: '1px solid #ddd', padding: 8 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>{getLocalized(item.name)}</td>
              <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{item.price}</td>
              <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{item.price * item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <table style={{ minWidth: 240 }}>
          <tbody>
            <tr>
              <td style={{ padding: 8, fontWeight: 600 }}>Subtotal:</td>
              <td style={{ padding: 8, textAlign: 'right' }}>₹{order.subtotal || order.total || '-'}</td>
            </tr>
            {order.tax && (
              <tr>
                <td style={{ padding: 8, fontWeight: 600 }}>Tax:</td>
                <td style={{ padding: 8, textAlign: 'right' }}>₹{order.tax}</td>
              </tr>
            )}
            <tr>
              <td style={{ padding: 8, fontWeight: 700, fontSize: 16 }}>Total:</td>
              <td style={{ padding: 8, textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#1976d2' }}>₹{order.total}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 32 }}>Thank you for your business!</div>
    </div>
  );
});

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // order id being updated
  const { users, pendingUsers } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();
  const [tab, setTab] = useState(0); // 0: Active, 1: Completed, 2: Cancelled
  const [searchTerm, setSearchTerm] = useState('');
  const invoiceRef = React.useRef();
  const [printOrder, setPrintOrder] = React.useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'orders'));
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

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status: newStatus });
    setOrders(orders => orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
    setUpdating(null);
  };

  // Filtered orders based on tab
  const activeOrders = orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
  const completedOrders = orders.filter(order => order.status === 'completed');
  const cancelledOrders = orders.filter(order => order.status === 'cancelled');
  const displayedOrders = tab === 0 ? activeOrders : tab === 1 ? completedOrders : cancelledOrders;

  // Helper to get user name by userId
  const getUserName = (userId) => {
    const user = (users || []).find(u => u.id === userId) || (pendingUsers || []).find(u => u.id === userId);
    return user?.name || userId;
  };

  // Filter displayedOrders by search term
  const filteredOrders = displayedOrders.filter(order => {
    const orderId = order.orderNumber || order.id;
    const userName = getUserName(order.userId);
    const term = searchTerm.trim().toLowerCase();
    return (
      orderId.toLowerCase().includes(term) ||
      userName.toLowerCase().includes(term)
    );
  });

  const handlePrintOrder = (order, userName) => {
    console.log('Print order called', order, userName);
    setPrintOrder({ order, userName });
    setTimeout(() => { console.log('printOrder state after set:', printOrder); }, 0);
    setTimeout(() => {
      const element = document.getElementById('invoice');
      if (element) {
        console.log('Calling html2pdf on element', element);
        element.style.display = 'block';
        html2pdf()
          .set({
            margin: 0,
            filename: `Invoice_${order.id || order.orderId}.pdf`,
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
          })
          .from(element)
          .save()
          .then(() => {
            element.style.display = 'none';
            setPrintOrder(null);
          });
      }
    }, 300); // Wait for render
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, mt: 0 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2E7D32', mb: 4 }}>
          {t('allOrders')}
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
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('orderID')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('userName')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('status')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('createdAt')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('items')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('total')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 2, 3].map((item) => (
                  <TableRow key={item}>
                    <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="90%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                    <TableCell><Skeleton variant="text" width="60%" /></TableCell>
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
      <Container maxWidth="md" sx={{ py: 8, mt: 8 }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('noOrdersFound')}
          </Typography>
          <Typography variant="body2">
            {t('noOrdersMessage')}
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, mt: 0 }}>
      {/* Header and Search Bar Row */}
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2E7D32', m: 0 }}>
          {t('allOrders')} ({orders.length})
        </Typography>
        <Box sx={{ width: 280, marginRight:'30px'}}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by Order ID or User Name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              endAdornment: (
                searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                      edge="end"
                      aria-label="clear search"
                    >
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                )
              )
            }}
          />
        </Box>
      </Box>

      {/* Tabs for Active/Completed/Cancelled */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Active Orders" />
          <Tab label="Completed Orders" />
          <Tab label="Cancelled Orders" />
        </Tabs>
      </Box>

      {isMobile ? (
        // Mobile view - Card layout
        <Grid container spacing={3}>
          {filteredOrders.map((order, idx) => {
            const statusConfig = getStatusConfig(order.status);
            return (
              <Grid item xs={12} key={order.id}>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.5, type: 'spring', stiffness: 60 }}
                >
                  <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                          #{order.orderNumber || order.id.slice(-8)}
                        </Typography>
                        <motion.div
                          key={order.status}
                          initial={{ scale: 0.8, opacity: 0.7 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                        >
                          <Chip
                            icon={statusConfig.icon}
                            label={statusConfig.label}
                            color={statusConfig.color}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </motion.div>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        <strong>{t('customer')}:</strong> {getUserName(order.userId)}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        <strong>{t('date')}:</strong> {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : ''}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {t('items')}:
                        </Typography>
                        <Box component="ul" sx={{ m: 0, pl: 2 }}>
                          {order.items?.map((item, idx) => (
                            <Typography key={idx} variant="body2" component="li" color="text.secondary">
                              {getLocalized(item.name) || 'Product no longer available'} x {item.quantity}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                      
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2E7D32', mb: 2 }}>
                        {t('total')}: ₹{getOrderTotal(order.items)}
                      </Typography>
                      
                      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <Select
                          value={order.status}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                          disabled={updating === order.id}
                          sx={{ minWidth: 120 }}
                        >
                          {ORDER_STATUSES.map(status => (
                            <MenuItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Print />}
                          fullWidth
                          onClick={() => handlePrintOrder(order, getUserName(order.userId))}
                        >
                          Print
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        // Desktop view - Table layout
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('orderID')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('userName')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('status')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('createdAt')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('items')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('total')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order, idx) => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.45, type: 'spring', stiffness: 60 }}
                    style={{ background: 'inherit' }}
                  >
                    <TableCell sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                      #{order.orderNumber || order.id.slice(-8)}
                    </TableCell>
                    <TableCell>{getUserName(order.userId)}</TableCell>
                    <TableCell>
                      <motion.div
                        key={order.status}
                        initial={{ scale: 0.8, opacity: 0.7 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                      >
                        <Chip
                          icon={statusConfig.icon}
                          label={statusConfig.label}
                          color={statusConfig.color}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </motion.div>
                    </TableCell>
                    <TableCell>
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : ''}
                    </TableCell>
                    <TableCell>
                      <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {order.items?.map((item, idx) => (
                          <Typography key={idx} variant="body2" component="li" color="text.secondary">
                            {getLocalized(item.name) || 'Product no longer available'} x {item.quantity}
                          </Typography>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                      ₹{getOrderTotal(order.items)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={order.status}
                            onChange={e => handleStatusChange(order.id, e.target.value)}
                            disabled={updating === order.id}
                          >
                            {ORDER_STATUSES.map(status => (
                              <MenuItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Tooltip title="Print Invoice">
                          <IconButton size="small" color="primary" onClick={() => handlePrintOrder(order, getUserName(order.userId))}>
                            <Print />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Hidden Invoice Template for PDF Generation */}
      {printOrder && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <InvoiceTemplate ref={invoiceRef} order={printOrder.order} userName={printOrder.userName} />
        </div>
      )}
    </Container>
  );
};

export default Orders; 