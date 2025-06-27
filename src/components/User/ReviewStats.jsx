import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Rating,
  Chip,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Star,
  TrendingUp,
  Verified
} from '@mui/icons-material';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

const ReviewStats = ({ productId, compact = false, compactFiveStarOnly = false }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviewStats();
  }, [productId]);

  const fetchReviewStats = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'reviews'),
        where('productId', '==', productId)
      );
      
      const querySnapshot = await getDocs(q);
      const reviews = querySnapshot.docs.map(doc => doc.data());
      
      if (reviews.length === 0) {
        setStats(null);
        return;
      }

      const totalReviews = reviews.length;
      const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      const verifiedReviews = reviews.filter(review => review.verified).length;
      
      reviews.forEach(review => {
        ratingDistribution[review.rating]++;
      });

      const topRating = Object.keys(ratingDistribution).reduce((a, b) => 
        ratingDistribution[a] > ratingDistribution[b] ? a : b
      );

      setStats({
        totalReviews,
        avgRating,
        ratingDistribution,
        verifiedReviews,
        topRating: parseInt(topRating)
      });
    } catch (error) {
      console.error('Error fetching review stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', minHeight: 60 }}>
        <CircularProgress size={24} thickness={4} color="primary" />
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          No reviews yet
        </Typography>
      </Box>
    );
  }

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Rating value={stats.avgRating} readOnly size="small" />
        <Typography variant="body2" color="text.secondary">
          ({stats.totalReviews})
        </Typography>
        {stats.verifiedReviews > 0 && (
          <Tooltip title={`${stats.verifiedReviews} verified purchases`}>
            <Chip 
              label={`${Math.round((stats.verifiedReviews / stats.totalReviews) * 100)}% verified`}
              size="small"
              color="success"
              variant="outlined"
              icon={<Verified />}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          </Tooltip>
        )}
      </Box>
    );
  }

  if (compactFiveStarOnly) {
    if (!stats || !stats.ratingDistribution) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            No reviews yet
          </Typography>
        </Box>
      );
    }
    if (stats.totalReviews > 0 && stats.ratingDistribution[5] === 0) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Rating value={stats.avgRating} readOnly size="small" />
          <Typography variant="body2" color="text.secondary">
            ({stats.totalReviews})
          </Typography>
        </Box>
      );
    }
    if (stats.ratingDistribution[5] > 0) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            5★: {stats.ratingDistribution[5]}
          </Typography>
        </Box>
      );
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
          {stats.avgRating.toFixed(1)}
        </Typography>
        <Rating value={stats.avgRating} readOnly size="small" />
        <Typography variant="body2" color="text.secondary">
          ({stats.totalReviews} reviews)
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {[5, 4, 3, 2, 1].map((rating) => (
          <Box key={rating} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ minWidth: 40 }}>
              {rating}★
            </Typography>
            <Box sx={{ flexGrow: 1, position: 'relative' }}>
              <Box
                sx={{
                  height: 6,
                  backgroundColor: '#e0e0e0',
                  borderRadius: 3,
                  overflow: 'hidden'
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    backgroundColor: rating >= 4 ? '#2E7D32' : rating >= 3 ? '#ff9800' : '#d32f2f',
                    width: `${(stats.ratingDistribution[rating] / stats.totalReviews) * 100}%`
                  }}
                />
              </Box>
            </Box>
            <Typography variant="body2" sx={{ minWidth: 30, fontSize: '0.8rem' }}>
              {stats.ratingDistribution[rating]}
            </Typography>
          </Box>
        ))}
      </Box>
      
      {stats.verifiedReviews > 0 && (
        <Box sx={{ mt: 1 }}>
          <Chip 
            label={`${stats.verifiedReviews} verified purchases`}
            size="small"
            color="success"
            icon={<Verified />}
            sx={{ fontSize: '0.8rem' }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ReviewStats; 