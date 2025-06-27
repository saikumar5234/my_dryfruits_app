import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Person,
  Email,
  CalendarToday,
  Search
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const NotificationsPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { users, pendingUsers } = useAuth(); // Get users from AuthContext

  // Filter approved and rejected users based on their status
  const approvedUsers = users.filter(user => user.approved === true);
  const rejectedUsers = pendingUsers.filter(user => user.approved === false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        User Management History
      </Typography>

      {/* Search Bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search users by name or email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {/* Approved Users Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <CheckCircle color="success" sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
              Approved Users ({approvedUsers.length})
            </Typography>
          </Box>
          
          {approvedUsers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No approved users yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Users who have been approved will appear here.
              </Typography>
            </Box>
          ) : (
            <List>
              {approvedUsers.map((user, index) => (
                <React.Fragment key={user.id}>
                  <ListItem sx={{ 
                    bgcolor: '#f8f9fa', 
                    borderRadius: 2, 
                    mb: 1,
                    border: '1px solid #e9ecef'
                  }}>
                    <ListItemAvatar>
                      <Avatar src={user.avatar} sx={{ bgcolor: '#2e7d32' }}>
                        {user.name?.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {user.name}
                          </Typography>
                          <Chip label="Approved" color="success" size="small" />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Approved: {formatDate(user.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < approvedUsers.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Rejected Users Section */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Cancel color="error" sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
              Rejected Users ({rejectedUsers.length})
            </Typography>
          </Box>
          
          {rejectedUsers.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Cancel sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No rejected users yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Users who have been rejected will appear here.
              </Typography>
            </Box>
          ) : (
            <List>
              {rejectedUsers.map((user, index) => (
                <React.Fragment key={user.id}>
                  <ListItem sx={{ 
                    bgcolor: '#fff5f5', 
                    borderRadius: 2, 
                    mb: 1,
                    border: '1px solid #ffebee'
                  }}>
                    <ListItemAvatar>
                      <Avatar src={user.avatar} sx={{ bgcolor: '#d32f2f' }}>
                        {user.name?.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {user.name}
                          </Typography>
                          <Chip label="Rejected" color="error" size="small" />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Rejected: {formatDate(user.rejectedAt)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < rejectedUsers.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip 
          label={`Total Approved: ${approvedUsers.length}`} 
          color="success" 
          variant="outlined"
        />
        <Chip 
          label={`Total Rejected: ${rejectedUsers.length}`} 
          color="error" 
          variant="outlined"
        />
        <Chip 
          label={`Total Users: ${approvedUsers.length + rejectedUsers.length}`} 
          color="primary"
        />
      </Box>
    </Box>
  );
};

export default NotificationsPanel; 