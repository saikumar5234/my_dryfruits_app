import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  Select,
  InputLabel,
  Popover,
  ListItemAvatar,
  Alert,
  Tooltip
} from '@mui/material';
import { 
  ShoppingCart,
  Favorite,
  Person,
  AdminPanelSettings, 
  Menu as MenuIcon,
  Home,
  Analytics,
  ExitToApp,
  Language,
  Notifications,
  Warning,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useCartWishlist } from '../../contexts/CartWishlistContext';

const Navbar = ({ user, isAdmin }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', user: null });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t, i18n } = useTranslation();
  const { logout, notifications, pendingUsers, approveUser, rejectUser, canAccessAnalytics } = useAuth();
  const { getCartItemCount, getWishlistCount } = useCartWishlist();

  useEffect(() => {
    const savedLanguage = localStorage.getItem('appLanguage') || 'en';
    setLanguage(savedLanguage);
    i18n.changeLanguage(savedLanguage);
  }, [i18n]);

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('appLanguage', newLanguage);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    setMobileOpen(false);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleApproveClick = (user) => {
    setConfirmDialog({ open: true, type: 'approve', user });
  };

  const handleRejectClick = (user) => {
    setConfirmDialog({ open: true, type: 'reject', user });
  };

  const handleConfirmAction = () => {
    if (confirmDialog.type === 'approve') {
      approveUser(confirmDialog.user.id);
    } else if (confirmDialog.type === 'reject') {
      rejectUser(confirmDialog.user.id);
    }
    setConfirmDialog({ open: false, type: '', user: null });
  };

  const handleCancelAction = () => {
    setConfirmDialog({ open: false, type: '', user: null });
  };

  const menuItems = [
    { text: t('home'), icon: <Home />, href: '/' },
    ...(canAccessAnalytics() ? [{ text: t('analytics'), icon: <Analytics />, href: '/analytics' }] : []),
    ...(!isAdmin ? [{ text: t('my_orders'), icon: <ShoppingCart />, href: '/my-orders' }] : []),
    { text: t('wishlist'), icon: <Favorite />, href: '/wishlist' },
    ...(isAdmin ? [{ text: t('admin_dashboard'), icon: <AdminPanelSettings />, href: '/admin' }] : [])
  ];

  const pendingApprovalsCount = pendingUsers.length;
  const notificationOpen = Boolean(notificationAnchorEl);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
          {t('app_name')}
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text} 
            button 
            component="a" 
            href={item.href}
            onClick={handleDrawerToggle}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <Divider />
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><ExitToApp /></ListItemIcon>
          <ListItemText primary={t('logout')} />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="fixed" sx={{ backgroundColor: '#2E7D32' }}>
        <Toolbar>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo/Brand */}
            <Typography 
            variant="h6" 
              component="div" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            onClick={() => window.location.href = '/'}
          >
            {t('app_name')}
          </Typography>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button color="inherit" href="/">
                {t('home')}
              </Button>
              
              {user && (
                <>
                  {canAccessAnalytics() && (
                    <Button color="inherit" href="/analytics">
                      {t('analytics')}
                    </Button>
                  )}
                  {!isAdmin && (
                    <Button color="inherit" href="/my-orders">
                      {t('my_orders')}
                    </Button>
                  )}
                </>
              )}

              {isAdmin && (
                <Button color="inherit" href="/admin">
                  {t('admin_dashboard')}
                </Button>
              )}
            </Box>
          )}

          {/* Language Selector */}
          <FormControl size="small" sx={{ minWidth: 100, mx: 2 }}>
            <Select
              value={language}
              onChange={handleLanguageChange}
              sx={{ 
                color: 'white',
                '& .MuiSelect-icon': { color: 'white' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }
              }}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="hi">हिंदी</MenuItem>
              <MenuItem value="te">తెలుగు</MenuItem>
            </Select>
          </FormControl>

          {/* Cart and Wishlist Icons */}
          {user && !isAdmin && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton color="inherit" href="/wishlist">
                <Badge badgeContent={getWishlistCount()} color="error">
                  <Favorite />
                </Badge>
              </IconButton>
              
              <IconButton color="inherit" href="/cart">
                <Badge badgeContent={getCartItemCount()} color="error">
                  <ShoppingCart />
                </Badge>
              </IconButton>
            </Box>
          )}

          {/* Notifications for Admin */}
          {user && isAdmin && (
              <Tooltip title={t('notifications')}>
                <IconButton color="inherit" onClick={handleNotificationClick}>
                <Badge badgeContent={pendingApprovalsCount} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}

          {/* User Menu */}
          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
              <Chip
                icon={isAdmin ? <AdminPanelSettings /> : <Person />}
                label={user.name}
                onClick={handleMenu}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                }}
              />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                color="inherit" 
                href="/login"
                sx={{ 
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                {t('login')}
              </Button>
              <Button 
                variant="contained" 
                href="/register"
                sx={{ 
                  backgroundColor: 'white',
                  color: '#2E7D32',
                  '&:hover': { backgroundColor: '#f5f5f5' }
                }}
              >
                {t('register')}
              </Button>
            </Box>
          )}

          {/* User Menu Dropdown */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleClose} href="/profile">
              <Person sx={{ mr: 1 }} />
              {t('profile')}
            </MenuItem>
            {isAdmin && (
              <MenuItem onClick={handleClose} href="/admin">
                <AdminPanelSettings sx={{ mr: 1 }} />
                {t('admin_dashboard')}
              </MenuItem>
            )}
            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} />
              {t('logout')}
            </MenuItem>
          </Menu>

      {/* Notification Popover */}
          {isAdmin && (
        <Popover
          open={notificationOpen}
          anchorEl={notificationAnchorEl}
          onClose={handleNotificationClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              width: 400,
              maxHeight: 500,
              mt: 2,
              boxShadow: 4,
              borderRadius: 3
            }
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Notifications color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {t('notifications')}
                  </Typography>
            </Box>
                <Typography variant="body2" color="text.secondary">
                  {pendingApprovalsCount} pending approvals
                </Typography>
          </Box>

              {pendingApprovalsCount > 0 && (
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Warning color="warning" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {t('pending_approvals')} ({pendingApprovalsCount})
                    </Typography>
              </Box>
              <List sx={{ p: 0 }}>
                {pendingUsers.slice(0, 3).map((user, index) => (
                  <React.Fragment key={user.id}>
                    <ListItem sx={{ px: 0, py: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                        <ListItemAvatar>
                          <Avatar src={user.avatar} sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                            {user.name?.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {user.name}
                                  </Typography>
                              <Chip label="Pending" color="warning" size="small" sx={{ height: 20 }} />
                            </Box>
                          }
                          secondary={
                            <Box>
                                  <Typography variant="caption" color="text.secondary">
                                {user.email}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {formatTimestamp(user.createdAt)}
                                  </Typography>
                            </Box>
                          }
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3, width: '100%', justifyContent: 'center' }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleApproveClick(user)}
                          sx={{ 
                            minWidth: 80,
                            height: 28,
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            fontWeight: 'bold'
                          }}
                        >
                              {t('approve')}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleRejectClick(user)}
                          sx={{ 
                            minWidth: 80,
                            height: 28,
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            fontWeight: 'bold'
                          }}
                        >
                              {t('reject')}
                        </Button>
                      </Box>
                    </ListItem>
                    {index < Math.min(pendingUsers.length, 3) - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
              {pendingUsers.length > 3 && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button 
                    size="small" 
                    onClick={() => {
                      handleNotificationClose();
                          window.location.href = '/admin';
                    }}
                    sx={{ color: '#2E7D32' }}
                  >
                        {t('view_all')} {pendingUsers.length} {t('pending_users')}
                  </Button>
                </Box>
              )}
            </Box>
          )}

              {pendingApprovalsCount === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Notifications sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {t('no_pending_approvals')}
                  </Typography>
            </Box>
          )}
        </Popover>
      )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>

      {/* Confirmation Dialog */}
      {confirmDialog.open && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', 
          alignItems: 'center', 
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <Box
            sx={{ 
              backgroundColor: 'white',
              p: 4,
              borderRadius: 2,
              maxWidth: 400,
              width: '90%',
              textAlign: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              {confirmDialog.type === 'approve' ? (
                <CheckCircle color="success" sx={{ fontSize: 40, mr: 1 }} />
              ) : (
                <Cancel color="error" sx={{ fontSize: 40, mr: 1 }} />
              )}
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {confirmDialog.type === 'approve' ? t('approve_user') : t('reject_user')}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {confirmDialog.type === 'approve' 
                ? `${t('approve_user_message')} ${confirmDialog.user?.name} (${confirmDialog.user?.email})?`
                : `${t('reject_user_message')} ${confirmDialog.user?.name} (${confirmDialog.user?.email})?`
              }
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleCancelAction}
                sx={{ minWidth: 100 }}
              >
                {t('cancel')}
          </Button>
          <Button 
            variant="contained"
            color={confirmDialog.type === 'approve' ? 'success' : 'error'}
                onClick={handleConfirmAction}
                sx={{ minWidth: 100 }}
              >
                {confirmDialog.type === 'approve' ? t('approve') : t('reject')}
          </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Toolbar spacer */}
      <Toolbar />
    </>
  );
};

export default Navbar; 