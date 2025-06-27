import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Container, 
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Card,
  CardContent,
  Fade,
  Slide
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Store,
  Login as LoginIcon,
  ArrowForward,
  Person
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const Login = ({ onToggleAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      // Login successful - the AuthContext will handle the user state
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(46, 125, 50, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(76, 175, 80, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(46, 125, 50, 0.03) 0%, transparent 50%)
          `,
          zIndex: 0
        }}
      />

      <Container maxWidth="lg" sx={{ height: '100%', position: 'relative', zIndex: 1 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '100vh',
            height: '100%'
          }}
        >
          <Slide direction="up" in={true} timeout={800}>
            <Card 
              sx={{ 
                width: '100%',
                maxWidth: 800,
                height: { xs: 'auto', md: 500 },
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                borderRadius: 6,
                boxShadow: '0 25px 50px rgba(0,0,0,0.08)',
                border: '1px solid rgba(255,255,255,0.3)',
                overflow: 'hidden',
                position: 'relative',
                display: { xs: 'block', md: 'flex' },
                flexDirection: { md: 'row' }
              }}
            >
              {/* Left Side - Header Section */}
              <Box 
                sx={{ 
                  background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 50%, #66BB6A 100%)',
                  color: 'white',
                  p: 4,
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  flex: '0 0 40%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                {/* Decorative Elements */}
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    animation: 'float 6s ease-in-out infinite'
                  }}
                />
                <Box 
                  sx={{ 
                    position: 'absolute',
                    bottom: -15,
                    left: -15,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                    animation: 'float 6s ease-in-out infinite 2s'
                  }}
                />
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)',
                    animation: 'pulse 4s ease-in-out infinite'
                  }}
                />
                
                <Store sx={{ 
                  fontSize: 48, 
                  mb: 2, 
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                  animation: 'bounce 2s ease-in-out infinite'
                }} />
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 800,
                    mb: 1,
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    letterSpacing: '-0.5px'
                  }}
                >
                  {t('welcome_back')}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    opacity: 0.95,
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    fontWeight: 400,
                    letterSpacing: '0.3px',
                    lineHeight: 1.3
                  }}
                >
                  {t('sign_in_to_account')}
                </Typography>
              </Box>

              {/* Right Side - Login Form */}
              <Box 
                sx={{ 
                  flex: 1, 
                  p: { xs: 3, md: 5 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minWidth: 0
                }}
              >
                <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 340 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main', textAlign: 'center' }}>
                    {t('signin')}
                  </Typography>
                  {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                  <TextField
                    label={t('email')}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    fullWidth
                    required
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email />
                        </InputAdornment>
                      )
                    }}
                  />
                  <TextField
                    label={t('password')}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    fullWidth
                    required
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePasswordVisibility}
                            onMouseDown={e => e.preventDefault()}
                            edge="end"
                            tabIndex={0}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    sx={{ mt: 2, mb: 1, fontWeight: 'bold', borderRadius: 3 }}
                    disabled={loading}
                  >
                    {loading ? <Fade in={loading}><LoginIcon sx={{ animation: 'spin 1s linear infinite' }} /></Fade> : t('signin')}
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    startIcon={<img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png" alt="Google" style={{ width: 20, height: 20 }} />}
                    sx={{ mb: 2, borderRadius: 3, fontWeight: 'bold', textTransform: 'none' }}
                    tabIndex={0}
                  >
                    {t('signin_with_google')}
                  </Button>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" sx={{ textAlign: 'center' }}>
                    {t('dont_have_account')}{' '}
                    <Button variant="text" color="secondary" onClick={onToggleAuth} sx={{ fontWeight: 'bold', textTransform: 'none', p: 0 }} tabIndex={0}>
                      {t('signup')}
                    </Button>
                  </Typography>
                </form>
              </Box>
            </Card>
          </Slide>
        </Box>
      </Container>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes pulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
            50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.1; }
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
        `}
      </style>
    </Box>
  );
};

export default Login; 