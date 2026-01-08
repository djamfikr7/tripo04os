import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  DirectionsCar,
  Motorcycle,
  Restaurant,
  ShoppingCart,
  LocalShipping,
  LocalTaxi,
  LocationOn,
  Place,
  AccessTime,
  AttachMoney,
  Star,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/// BMAD Phase 5: Implement
/// Booking interface for Tripo04OS User Web Interface
/// BMAD Principle: Maximize conversion with streamlined booking flow
const BookingInterface: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedService, setSelectedService] = useState('RIDE');
  const [selectedVehicle, setSelectedVehicle] = useState('SEDAN');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [promoCode, setPromoCode] = useState('');

  const services = [
    { value: 'RIDE', name: 'Ride', icon: <DirectionsCar />, color: '#0066FF' },
    { value: 'MOTO', name: 'Moto', icon: <Motorcycle />, color: '#FF6B35' },
    { value: 'FOOD', name: 'Food Delivery', icon: <Restaurant />, color: '#FF9800' },
    { value: 'GROCERY', name: 'Grocery', icon: <ShoppingCart />, color: '#4CAF50' },
    { value: 'GOODS', name: 'Goods', icon: <LocalShipping />, color: '#9C27B0' },
    { value: 'TRUCK_VAN', name: 'Truck/Van', icon: <LocalTaxi />, color: '#00BCD4' },
  ];

  const vehicleTypes = {
    RIDE: [
      { value: 'SEDAN', name: 'Sedan', capacity: 4 },
      { value: 'SUV', name: 'SUV', capacity: 6 },
      { value: 'LUXURY_SEDAN', name: 'Luxury Sedan', capacity: 4 },
      { value: 'LUXURY_SUV', name: 'Luxury SUV', capacity: 6 },
    ],
    MOTO: [
      { value: 'MOTO', name: 'Moto', capacity: 1 },
      { value: 'SCOOTER', name: 'Scooter', capacity: 1 },
    ],
  };

  const recentLocations = [
    { id: 1, name: 'Home', address: '123 Main St, New York, NY 10001' },
    { id: 2, name: 'Office', address: '456 Park Ave, New York, NY 10011' },
    { id: 3, name: 'Gym', address: '789 5th Ave, New York, NY 10019' },
    { id: 4, name: 'Airport', address: 'JFK Airport, Queens, NY 11430' },
  ];

  const steps = [
    {
      label: 'Select Service',
      description: 'Choose the type of service you need',
    },
    {
      label: 'Select Vehicle',
      description: 'Choose your preferred vehicle type',
    },
    {
      label: 'Enter Locations',
      description: 'Enter pickup and dropoff locations',
    },
    {
      label: 'Review & Confirm',
      description: 'Review your booking details and confirm',
    },
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleServiceSelect = (service: string) => {
    setSelectedService(service);
    setSelectedVehicle(vehicleTypes[service as keyof typeof vehicleTypes][0].value);
  };

  const handleVehicleSelect = (vehicle: string) => {
    setSelectedVehicle(vehicle);
  };

  const handleLocationSelect = (location: string, type: 'pickup' | 'dropoff') => {
    if (type === 'pickup') {
      setPickupLocation(location);
    } else {
      setDropoffLocation(location);
    }
  };

  const handlePromoCodeApply = () => {
    // BMAD Principle: Apply promo code for discount
    alert('Promo code applied!');
  };

  const handleBookingConfirm = () => {
    // BMAD Principle: Confirm booking and redirect to payment
    navigate('/payment');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
        Book a Ride
      </Typography>

      {/* BMAD Principle: Stepper for clear booking flow */}
      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  {step.description}
                </Typography>

                {/* BMAD Principle: Service Selection */}
                {activeStep === 0 && (
                  <Grid container spacing={2}>
                    {services.map((service) => (
                      <Grid item xs={12} sm={6} md={4} key={service.value}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            border: selectedService === service.value ? '2px solid #0066FF' : '2px solid transparent',
                            '&:hover': {
                              boxShadow: 3,
                            },
                          }}
                          onClick={() => handleServiceSelect(service.value)}
                        >
                          <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <Box sx={{ fontSize: 48, mb: 2, color: service.color }}>
                              {service.icon}
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {service.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {service.value === 'RIDE' ? 'Get a ride to your destination' :
                               service.value === 'MOTO' ? 'Fast motorcycle ride' :
                               service.value === 'FOOD' ? 'Order food from restaurants' :
                               service.value === 'GROCERY' ? 'Grocery delivery' :
                               service.value === 'GOODS' ? 'Send packages' : 'Truck/Van delivery'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {/* BMAD Principle: Vehicle Selection */}
                {activeStep === 1 && (
                  <Grid container spacing={2}>
                    {vehicleTypes[selectedService as keyof typeof vehicleTypes].map((vehicle) => (
                      <Grid item xs={12} sm={6} md={4} key={vehicle.value}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            border: selectedVehicle === vehicle.value ? '2px solid #0066FF' : '2px solid transparent',
                          }}
                          onClick={() => handleVehicleSelect(vehicle.value)}
                        >
                          <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {vehicle.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {vehicle.capacity} passengers
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {/* BMAD Principle: Location Entry */}
                {activeStep === 2 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                          Pickup Location
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="Enter pickup location"
                          value={pickupLocation}
                          onChange={(e) => setPickupLocation(e.target.value)}
                          InputProps={{
                            startAdornment: <LocationOn sx={{ mr: 1 }} />,
                          }}
                          sx={{ bgcolor: 'background.paper' }}
                        />
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            or select from recent locations
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {recentLocations.map((location) => (
                              <Chip
                                key={location.id}
                                label={location.name}
                                onClick={() => handleLocationSelect(location.address, 'pickup')}
                                sx={{ cursor: 'pointer' }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                          Dropoff Location
                        </Typography>
                        <TextField
                          fullWidth
                          placeholder="Enter dropoff location"
                          value={dropoffLocation}
                          onChange={(e) => setDropoffLocation(e.target.value)}
                          InputProps={{
                            startAdornment: <Place sx={{ mr: 1 }} />,
                          }}
                          sx={{ bgcolor: 'background.paper' }}
                        />
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            or select from recent locations
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {recentLocations.map((location) => (
                              <Chip
                                key={location.id}
                                label={location.name}
                                onClick={() => handleLocationSelect(location.address, 'dropoff')}
                                sx={{ cursor: 'pointer' }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                          Schedule Ride
                        </Typography>
                        <TextField
                          fullWidth
                          type="datetime-local"
                          label="Scheduled Time"
                          value={scheduledTime ? scheduledTime.toISOString().slice(0, 16) : ''}
                          onChange={(e) => setScheduledTime(e.target.value ? new Date(e.target.value) : null)}
                          InputLabelProps={{
                            shrink: true,
                          }}
                          sx={{ bgcolor: 'background.paper' }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                )}

                {/* BMAD Principle: Review and Confirm */}
                {activeStep === 3 && (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Service
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ fontSize: 32, color: services.find(s => s.value === selectedService)?.color }}>
                              {services.find(s => s.value === selectedService)?.icon}
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {services.find(s => s.value === selectedService)?.name}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Vehicle
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {vehicleTypes[selectedService as keyof typeof vehicleTypes].find(v => v.value === selectedVehicle)?.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                            {vehicleTypes[selectedService as keyof typeof vehicleTypes].find(v => v.value === selectedVehicle)?.capacity} passengers
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Pickup
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {pickupLocation || 'Not selected'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Dropoff
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {dropoffLocation || 'Not selected'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Scheduled Time
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {scheduledTime ? new Date(scheduledTime).toLocaleString() : 'Not scheduled'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Promo Code
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              size="small"
                              placeholder="Enter promo code"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value)}
                              sx={{ flex: 1 }}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={handlePromoCodeApply}
                            >
                              Apply
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* BMAD Principle: Navigation buttons */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={activeStep === 0}
          sx={{ px: 4 }}
        >
          Back
        </Button>
        {activeStep < 3 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={activeStep === 3 && (!pickupLocation || !dropoffLocation)}
            sx={{ px: 4, bgcolor: '#0066FF' }}
          >
            Next
          </Button>
        )}
        {activeStep === 3 && (
          <Button
            variant="contained"
            onClick={handleBookingConfirm}
            disabled={!pickupLocation || !dropoffLocation}
            sx={{ px: 4, bgcolor: '#0066FF' }}
          >
            Confirm Booking
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default BookingInterface;
