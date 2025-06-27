import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  LinearProgress,
  Button
} from '@mui/material';
import {
  PendingActions,
  CheckCircle,
  Schedule,
  Info,
  Analytics
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const ApprovalStatus = () => {
  const { currentUser, isApproved } = useAuth();

  if (!currentUser || currentUser.role === 'admin') {
    return null;
  }

  if (isApproved()) {
    return (
      <Card sx={{ mb: 3, bgcolor: '#e8f5e8', border: '1px solid #4caf50' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CheckCircle color="success" sx={{ fontSize: 32 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
              Account Approved!
            </Typography>
            <Chip label="Approved" color="success" icon={<CheckCircle />} />
          </Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            Congratulations! Your account has been approved by the administrator. 
            You now have access to all features including Analytics.
          </Alert>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Analytics color="primary" />
            <Typography variant="body2" color="text.secondary">
              You can now access the Analytics section from the navigation bar.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3, bgcolor: '#fff3e0', border: '1px solid #ff9800' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <PendingActions color="warning" sx={{ fontSize: 32 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ed6c02' }}>
            Account Pending Approval
          </Typography>
          <Chip label="Pending" color="warning" icon={<PendingActions />} />
        </Box>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          Your account is currently under review by our administrator. 
          This process typically takes 24-48 hours.
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Approval Progress
          </Typography>
          <LinearProgress 
            variant="indeterminate" 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              bgcolor: 'rgba(237, 108, 2, 0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#ed6c02'
              }
            }} 
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Info color="primary" />
          <Typography variant="body2" color="text.secondary">
            Once approved, you'll be able to:
          </Typography>
        </Box>

        <Box sx={{ pl: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • Access detailed analytics and price comparisons
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • View advanced product insights and trends
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            • Get personalized recommendations
          </Typography>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(237, 108, 2, 0.05)', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Schedule color="warning" sx={{ fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              What happens next?
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Our administrator will review your registration and either approve or reject your account. 
            You'll receive a notification once the decision is made.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ApprovalStatus; 