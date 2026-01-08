import React from 'react';
import { Box, Button, Container, Typography, Grid, Card, CardContent, Chip } from '@mui/material';
import { DirectionsCar, Motorcycle, Restaurant, ShoppingCart, LocalShipping, LocalTaxi } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/// BMAD Phase 5: Implement
/// Landing page for Tripo04OS User Web Interface
/// BMAD Principle: Maximize user conversion with compelling landing page
const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const services = [
    {
      id: 'ride',
      name: 'Ride',
      description: 'Get a ride to your destination',
      icon: <DirectionsCar sx={{ fontSize: 40 }} />,
      color: '#0066FF',
      cta: 'Book a Ride',
    },
    {
      id: 'moto',
      name: 'Moto',
      description: 'Fast motorcycle ride',
      icon: <Motorcycle sx={{ fontSize: 40 }} />,
      color: '#FF6B35',
      cta: 'Book a Moto',
    },
    {
      id: 'food',
      name: 'Food Delivery',
      description: 'Order food from your favorite restaurants',
      icon: <Restaurant sx={{ fontSize: 40 }} />,
      color: '#FF9800',
      cta: 'Order Food',
    },
    {
      id: 'grocery',
      name: 'Grocery',
      description: 'Get groceries delivered to your door',
      icon: <ShoppingCart sx={{ fontSize: 40 }} />,
      color: '#4CAF50',
      cta: 'Order Grocery',
    },
    {
      id: 'goods',
      name: 'Goods',
      description: 'Send packages and parcels',
      icon: <LocalShipping sx={{ fontSize: 40 }} />,
      color: '#9C27B0',
      cta: 'Send Goods',
    },
    {
      id: 'truck-van',
      name: 'Truck/Van',
      description: 'Large item delivery or moving',
      icon: <LocalTaxi sx={{ fontSize: 40 }} />,
      color: '#00BCD4',
      cta: 'Book Truck',
    },
  ];

  const features = [
    {
      title: 'Fast & Reliable',
      description: 'Get matched with drivers in minutes',
      icon: '⚡',
    },
    {
      title: 'Safe & Secure',
      description: 'All drivers are verified and insured',
      icon: '🛡️',
    },
    {
      title: 'Best Prices',
      description: 'Competitive pricing with no hidden fees',
      icon: '💰',
    },
    {
      title: '24/7 Support',
      description: 'Our support team is always available',
      icon: '🎧',
    },
  ];

  const handleServiceClick = (serviceId: string) => {
    navigate(`/booking/${serviceId}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* BMAD Principle: Hero section for immediate value */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                p: 6,
                background: 'linear-gradient(135deg, #0066FF 0%, #0044CC 100%)',
                borderRadius: 4,
                color: 'white',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                Your Ride, Your Way
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                Multi-service platform for rides, food delivery, grocery, goods, and truck/van services
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/booking/ride')}
                sx={{
                  py: 2,
                  px: 6,
                  fontSize: '1.2rem',
                  borderRadius: 2,
                  bgcolor: 'white',
                  color: '#0066FF',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                  },
                }}
              >
                Get Started
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                  Download Our App
                </Typography>
                <Typography sx={{ mb: 4, textAlign: 'center', color: 'text.secondary' }}>
                  Get the full experience on your mobile device
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button variant="contained" fullWidth sx={{ py: 1.5 }}>
                    App Store
                  </Button>
                  <Button variant="outlined" fullWidth sx={{ py: 1.5 }}>
                    Google Play
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* BMAD Principle: Service selection for quick access */}
        <Box sx={{ mt: 8 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
            Choose Your Service
          </Typography>
          <Grid container spacing={3}>
            {services.map((service) => (
              <Grid item xs={12} sm={6} md={4} key={service.id}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 6,
                    },
                  }}
                  onClick={() => handleServiceClick(service.id)}
                >
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: service.color + '20',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      {service.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                      {service.name}
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mt: 1 }}>
                      {service.description}
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ mt: 2, bgcolor: service.color }}
                      onClick={() => handleServiceClick(service.id)}
                    >
                      {service.cta}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* BMAD Principle: Features section for value proposition */}
        <Box sx={{ mt: 8, py: 8, bgcolor: 'white' }}>
          <Container maxWidth="lg">
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
              Why Choose Tripo04OS?
            </Typography>
            <Grid container spacing={4} sx={{ mt: 4 }}>
              {features.map((feature) => (
                <Grid item xs={12} sm={6} md={3} key={feature.title}>
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Box
                      sx={{
                        fontSize: 48,
                        mb: 2,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* BMAD Principle: CTA section for conversion */}
        <Box sx={{ mt: 8, py: 12, bgcolor: '#0066FF', color: 'white' }}>
          <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
              Ready to Get Started?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join millions of users who trust Tripo04OS for their transportation and delivery needs
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/booking/ride')}
                sx={{
                  py: 2,
                  px: 6,
                  fontSize: '1.2rem',
                  borderRadius: 2,
                  bgcolor: 'white',
                  color: '#0066FF',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                  },
                }}
              >
                Book Your First Ride
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  py: 2,
                  px: 6,
                  fontSize: '1.2rem',
                  borderRadius: 2,
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Sign Up Now
              </Button>
            </Box>
          </Container>
        </Box>

        {/* BMAD Principle: Footer for trust signals */}
        <Box sx={{ py: 8, bgcolor: '#f5f5f5', borderTop: '1px solid #e0e0e0' }}>
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    10M+
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Happy Users
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    50M+
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Rides Completed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    100+
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Cities Served
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    4.9/5
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    User Rating
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
