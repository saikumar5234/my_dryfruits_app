import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Container,
  Button,
  Rating,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Paper,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Star,
  ThumbUp,
  ThumbUpOutlined,
  PhotoCamera,
  Close,
  Edit,
  Delete,
  Verified,
  LocalOffer,
  TrendingUp,
  FilterList,
  Sort
} from '@mui/icons-material';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from 'react-i18next';

const ProductReview = ({ productId, productName, onReviewAdded }) => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [editReview, setEditReview] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [sortBy, setSortBy] = useState('recent');
  const [filterRating, setFilterRating] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: '',
    comment: '',
    pros: '',
    cons: '',
    verified: false,
    helpful: 0,
    photos: [],
    purchaseType: 'online',
    usageDuration: 'less_than_month'
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchReviews();
  }, [productId, sortBy, filterRating]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'reviews'),
        where('productId', '==', productId)
      );

      // Apply rating filter
      if (filterRating !== 'all') {
        q = query(q, where('rating', '==', parseInt(filterRating)));
      }

      // Apply sorting
      switch (sortBy) {
        case 'recent':
          q = query(q, orderBy('createdAt', 'desc'));
          break;
        case 'oldest':
          q = query(q, orderBy('createdAt', 'asc'));
          break;
        case 'rating':
          q = query(q, orderBy('rating', 'desc'));
          break;
        case 'helpful':
          q = query(q, orderBy('helpful', 'desc'));
          break;
        default:
          q = query(q, orderBy('createdAt', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showSnackbar(t('review.error_loading_reviews'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    // Validate form
    const errors = {};
    if (reviewForm.rating === 0) errors.rating = t('review.error_select_rating');
    if (!reviewForm.title.trim()) errors.title = t('review.error_enter_title');
    if (!reviewForm.comment.trim()) errors.comment = t('review.error_enter_comment');
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const reviewData = {
        productId,
        productName,
        ...reviewForm,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'demo-user', // In real app, get from auth
        userName: 'Demo User', // In real app, get from user profile
        userAvatar: `https://ui-avatars.com/api/?name=Demo+User&background=2E7D32&color=fff`,
        verified: true, // In real app, check if user purchased the product
        helpful: 0,
        reported: false
      };

      await addDoc(collection(db, 'reviews'), reviewData);
      
      // Reset form
      setReviewForm({
        rating: 0,
        title: '',
        comment: '',
        pros: '',
        cons: '',
        verified: false,
        helpful: 0,
        photos: [],
        purchaseType: 'online',
        usageDuration: 'less_than_month'
      });
      setFormErrors({});
      setReviewDialog(false);
      setEditReview(null);
      
      // Refresh reviews
      fetchReviews();
      
      // Notify parent component
      if (onReviewAdded) {
        onReviewAdded();
      }
      
      showSnackbar(t('review.submitted_success'), 'success');
    } catch (error) {
      console.error('Error submitting review:', error);
      showSnackbar(t('review.error_submitting'), 'error');
    }
  };

  const handleEditReview = async () => {
    if (!editReview) return;

    try {
      const reviewRef = doc(db, 'reviews', editReview.id);
      await updateDoc(reviewRef, {
        ...reviewForm,
        updatedAt: new Date()
      });
      
      setReviewDialog(false);
      setEditReview(null);
      setReviewForm({
        rating: 0,
        title: '',
        comment: '',
        pros: '',
        cons: '',
        verified: false,
        helpful: 0,
        photos: [],
        purchaseType: 'online',
        usageDuration: 'less_than_month'
      });
      
      fetchReviews();
      showSnackbar(t('review.updated_success'), 'success');
    } catch (error) {
      console.error('Error updating review:', error);
      showSnackbar(t('review.error_updating'), 'error');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm(t('review.confirm_delete'))) return;

    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      fetchReviews();
      showSnackbar(t('review.deleted_success'), 'success');
    } catch (error) {
      console.error('Error deleting review:', error);
      showSnackbar(t('review.error_deleting'), 'error');
    }
  };

  const handleHelpfulVote = async (reviewId, currentHelpful) => {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      await updateDoc(reviewRef, {
        helpful: currentHelpful + 1
      });
      fetchReviews();
      showSnackbar(t('review.helpful_thanks'), 'success');
    } catch (error) {
      console.error('Error updating helpful count:', error);
      showSnackbar(t('review.error_helpful_vote'), 'error');
    }
  };

  const openEditDialog = (review) => {
    setEditReview(review);
    setReviewForm({
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      pros: review.pros || '',
      cons: review.cons || '',
      verified: review.verified,
      helpful: review.helpful,
      photos: review.photos || [],
      purchaseType: review.purchaseType || 'online',
      usageDuration: review.usageDuration || 'less_than_month'
    });
    setReviewDialog(true);
  };

  const openNewReviewDialog = () => {
    setEditReview(null);
    setReviewForm({
      rating: 0,
      title: '',
      comment: '',
      pros: '',
      cons: '',
      verified: false,
      helpful: 0,
      photos: [],
      purchaseType: 'online',
      usageDuration: 'less_than_month'
    });
    setFormErrors({});
    setReviewDialog(true);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getReviewStats = () => {
    if (reviews.length === 0) return null;

    const totalReviews = reviews.length;
    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    reviews.forEach(review => {
      ratingDistribution[review.rating]++;
    });

    return { totalReviews, avgRating, ratingDistribution };
  };

  const stats = getReviewStats();

  const filteredReviews = reviews.filter(review => {
    if (activeTab === 0) return true; // All reviews
    if (activeTab === 1) return review.rating >= 4; // Positive reviews
    if (activeTab === 2) return review.rating <= 2; // Negative reviews
    if (activeTab === 3) return review.photos && review.photos.length > 0; // With photos
    return true;
  });

  return (
    <Box sx={{ py: 4 }}>
      {/* Review Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
            {t('review.customer_reviews')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={openNewReviewDialog}
            sx={{
              backgroundColor: '#2E7D32',
              '&:hover': {
                backgroundColor: '#1B5E20'
              }
            }}
          >
            {t('review.write_review')}
          </Button>
        </Box>

        {/* Review Statistics */}
        {stats && (
          <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                    {stats.avgRating.toFixed(1)}
                  </Typography>
                  <Rating value={stats.avgRating} readOnly size="large" />
                  <Typography variant="body2" color="text.secondary">
                    {t('review.based_on_reviews', { count: stats.totalReviews })}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Box>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <Box key={rating} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 60 }}>
                        {t('review.stars', { count: rating })}
                      </Typography>
                      <Box sx={{ flexGrow: 1, mx: 2 }}>
                        <Box
                          sx={{
                            height: 8,
                            backgroundColor: '#e0e0e0',
                            borderRadius: 4,
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              backgroundColor: '#2E7D32',
                              width: `${(stats.ratingDistribution[rating] / stats.totalReviews) * 100}%`
                            }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ minWidth: 40 }}>
                        {stats.ratingDistribution[rating]}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>

      {/* Review Filters and Tabs */}
      <Paper elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              minWidth: 120,
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#666',
              '&.Mui-selected': {
                color: '#2E7D32',
              }
            }
          }}
        >
          <Tab label={`${t('review.all')} (${reviews.length})`} />
          <Tab label={`${t('review.positive')} (${reviews.filter(r => r.rating >= 4).length})`} />
          <Tab label={`${t('review.negative')} (${reviews.filter(r => r.rating <= 2).length})`} />
          <Tab label={`${t('review.with_photos')} (${reviews.filter(r => r.photos && r.photos.length > 0).length})`} />
        </Tabs>
      </Paper>

      {/* Sort and Filter Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t('review.sort_by')}</InputLabel>
          <Select
            value={sortBy}
            label={t('review.sort_by')}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="recent">{t('review.most_recent')}</MenuItem>
            <MenuItem value="oldest">{t('review.oldest_first')}</MenuItem>
            <MenuItem value="rating">{t('review.highest_rated')}</MenuItem>
            <MenuItem value="helpful">{t('review.most_helpful')}</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t('review.filter_rating')}</InputLabel>
          <Select
            value={filterRating}
            label={t('review.filter_rating')}
            onChange={(e) => setFilterRating(e.target.value)}
          >
            <MenuItem value="all">{t('review.all_ratings')}</MenuItem>
            <MenuItem value="5">{t('review.5_stars')}</MenuItem>
            <MenuItem value="4">{t('review.4_stars')}</MenuItem>
            <MenuItem value="3">{t('review.3_stars')}</MenuItem>
            <MenuItem value="2">{t('review.2_stars')}</MenuItem>
            <MenuItem value="1">{t('review.1_star')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Reviews List */}
      <Box>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={32} thickness={4} color="primary" />
            <Typography> {t('review.loading')} </Typography>
          </Box>
        ) : filteredReviews.length === 0 ? (
          <Paper elevation={1} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('review.no_reviews_found')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('review.be_first_to_review')}
            </Typography>
            <Button
              variant="contained"
              onClick={openNewReviewDialog}
              sx={{
                backgroundColor: '#2E7D32',
                '&:hover': {
                  backgroundColor: '#1B5E20'
                }
              }}
            >
              {t('review.write_first_review')}
            </Button>
          </Paper>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id} sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                {/* Review Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={review.userAvatar} sx={{ bgcolor: '#2E7D32' }}>
                      {review.userName?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {review.userName}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating value={review.rating} readOnly size="small" />
                        <Typography variant="body2" color="text.secondary">
                          {review.createdAt.toLocaleDateString()}
                        </Typography>
                        {review.verified && (
                          <Chip 
                            label={t('review.verified_purchase')} 
                            color="success" 
                            size="small" 
                            icon={<Verified />}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={t('review.edit_review')}>
                      <IconButton size="small" onClick={() => openEditDialog(review)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('review.delete_review')}>
                      <IconButton size="small" color="error" onClick={() => handleDeleteReview(review.id)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Review Title */}
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {review.title}
                </Typography>

                {/* Review Content */}
                <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                  {review.comment}
                </Typography>

                {/* Pros and Cons */}
                {(review.pros || review.cons) && (
                  <Box sx={{ mb: 2 }}>
                    {review.pros && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                          {t('review.pros')}
                        </Typography>
                        <Typography variant="body2">
                          {review.pros}
                        </Typography>
                      </Box>
                    )}
                    {review.cons && (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                          {t('review.cons')}
                        </Typography>
                        <Typography variant="body2">
                          {review.cons}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Purchase Info */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip 
                    label={`${t('review.purchased')}: ${t('review.purchase_type.' + review.purchaseType)}`} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`${t('review.used_for')}: ${t('review.usage_duration.' + review.usageDuration)}`} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>

                {/* Review Photos */}
                {review.photos && review.photos.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {t('review.photos')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {review.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Review photo ${index + 1}`}
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 8,
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Review Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    startIcon={<ThumbUpOutlined />}
                    size="small"
                    onClick={() => handleHelpfulVote(review.id, review.helpful)}
                  >
                    {t('review.helpful', { count: review.helpful })}
                  </Button>
                  
                  {review.updatedAt && review.updatedAt !== review.createdAt && (
                    <Typography variant="caption" color="text.secondary">
                      {t('review.edited_on', { date: review.updatedAt.toLocaleDateString() })}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* Review Dialog */}
      <Dialog 
        open={reviewDialog} 
        onClose={() => setReviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
              {editReview ? t('review.edit_review') : t('review.write_review')}
            </Typography>
            <IconButton onClick={() => setReviewDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {productName}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {t('review.overall_rating')} *
              </Typography>
              <Rating
                value={reviewForm.rating}
                onChange={(event, newValue) => {
                  setReviewForm({ ...reviewForm, rating: newValue });
                  setFormErrors({ ...formErrors, rating: '' });
                }}
                size="large"
              />
              {formErrors.rating && (
                <FormHelperText error>{formErrors.rating}</FormHelperText>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('review.title_label') + ' *'}
                value={reviewForm.title}
                onChange={(e) => {
                  setReviewForm({ ...reviewForm, title: e.target.value });
                  setFormErrors({ ...formErrors, title: '' });
                }}
                error={!!formErrors.title}
                helperText={formErrors.title}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('review.comment_label') + ' *'}
                multiline
                rows={4}
                value={reviewForm.comment}
                onChange={(e) => {
                  setReviewForm({ ...reviewForm, comment: e.target.value });
                  setFormErrors({ ...formErrors, comment: '' });
                }}
                error={!!formErrors.comment}
                helperText={formErrors.comment}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('review.pros_label')}
                value={reviewForm.pros}
                onChange={(e) => setReviewForm({ ...reviewForm, pros: e.target.value })}
                placeholder={t('review.pros_placeholder')}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('review.cons_label')}
                value={reviewForm.cons}
                onChange={(e) => setReviewForm({ ...reviewForm, cons: e.target.value })}
                placeholder={t('review.cons_placeholder')}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('review.purchase_type_label')}</InputLabel>
                <Select
                  value={reviewForm.purchaseType}
                  label={t('review.purchase_type_label')}
                  onChange={(e) => setReviewForm({ ...reviewForm, purchaseType: e.target.value })}
                >
                  <MenuItem value="online">{t('review.purchase_type.online')}</MenuItem>
                  <MenuItem value="store">{t('review.purchase_type.store')}</MenuItem>
                  <MenuItem value="gift">{t('review.purchase_type.gift')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('review.usage_duration_label')}</InputLabel>
                <Select
                  value={reviewForm.usageDuration}
                  label={t('review.usage_duration_label')}
                  onChange={(e) => setReviewForm({ ...reviewForm, usageDuration: e.target.value })}
                >
                  <MenuItem value="less_than_month">{t('review.usage_duration.less_than_month')}</MenuItem>
                  <MenuItem value="one_to_three_months">{t('review.usage_duration.one_to_three_months')}</MenuItem>
                  <MenuItem value="three_to_six_months">{t('review.usage_duration.three_to_six_months')}</MenuItem>
                  <MenuItem value="more_than_six_months">{t('review.usage_duration.more_than_six_months')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setReviewDialog(false)}>
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={editReview ? handleEditReview : handleReviewSubmit}
            sx={{
              backgroundColor: '#2E7D32',
              '&:hover': {
                backgroundColor: '#1B5E20'
              }
            }}
          >
            {editReview ? t('review.update_review') : t('review.submit_review')}
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
};

export default ProductReview; 