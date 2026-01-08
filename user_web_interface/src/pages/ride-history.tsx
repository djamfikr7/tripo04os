import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Pagination,
  Rating,
} from '@mui/material';
import {
  Search,
  FilterList,
  Visibility,
  DirectionsCar,
  Person,
  LocationOn,
  AttachMoney,
  AccessTime,
  Star,
  CheckCircle,
  Cancel,
  Schedule,
  CalendarToday,
} from '@mui/icons-material';

/// BMAD Phase 5: Implement
/// User Web Interface - Ride History for Tripo04OS
/// BMAD Principle: Maximize user engagement with comprehensive ride history
const RideHistory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRide, setSelectedRide] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // BMAD Principle: Ride history data for comprehensive tracking
  const rides = [
    {
      id: 'RIDE-12345',
      serviceType: 'RIDE',
      vehicleType: 'Sedan',
      status: 'completed',
      driver: { name: 'James Wilson', avatar: 'JW', rating: 4.9 },
      pickup: '123 Main St, New York, NY',
      dropoff: '456 Park Ave, New York, NY',
      distance: 5.2,
      duration: 18,
      fare: 23.45,
      tip: 4.69,
      total: 28.14,
      rating: 5,
      createdAt: '2024-01-08 14:30:00',
      completedAt: '2024-01-08 14:48:00',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'RIDE-12346',
      serviceType: 'MOTO',
      vehicleType: 'Moto',
      status: 'completed',
      driver: { name: 'Emily Chen', avatar: 'EC', rating: 4.9 },
      pickup: '456 Broadway, New York, NY',
      dropoff: '789 Wall St, New York, NY',
      distance: 2.1,
      duration: 8,
      fare: 12.34,
      tip: 2.47,
      total: 14.81,
      rating: 5,
      createdAt: '2024-01-07 16:15:00',
      completedAt: '2024-01-07 16:23:00',
      paymentMethod: 'Cash',
    },
    {
      id: 'RIDE-12347',
      serviceType: 'FOOD',
      vehicleType: 'Moto',
      status: 'completed',
      driver: { name: 'Maria Garcia', avatar: 'MG', rating: 4.8 },
      pickup: 'Pizza Palace, 789 5th Ave',
      dropoff: '321 Oak St, Los Angeles, CA',
      distance: 3.8,
      duration: 15,
      fare: 15.67,
      tip: 3.13,
      total: 18.80,
      rating: 4,
      createdAt: '2024-01-06 18:45:00',
      completedAt: '2024-01-06 19:00:00',
      paymentMethod: 'Debit Card',
    },
    {
      id: 'RIDE-12348',
      serviceType: 'RIDE',
      vehicleType: 'SUV',
      status: 'cancelled',
      driver: null,
      pickup: 'Airport Terminal 1',
      dropoff: 'Downtown Hotel, 456 Main St',
      distance: 15.2,
      duration: 42,
      fare: 56.78,
      tip: 0,
      total: 0,
      rating: 0,
      createdAt: '2024-01-05 12:30:00',
      completedAt: null,
      paymentMethod: 'Credit Card',
      cancellationReason: 'Driver cancelled',
    },
    {
      id: 'RIDE-12349',
      serviceType: 'GROCERY',
      vehicleType: 'Sedan',
      status: 'completed',
      driver: { name: 'Sarah Miller', avatar: 'SM', rating: 4.8 },
      pickup: 'Super Mart, 456 Elm St',
      dropoff: '789 Pine St, Chicago, IL',
      distance: 4.5,
      duration: 12,
      fare: 18.90,
      tip: 3.78,
      total: 22.68,
      rating: 5,
      createdAt: '2024-01-04 14:00:00',
      completedAt: '2024-01-04 14:12:00',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'RIDE-12350',
      serviceType: 'TRUCK_VAN',
      vehicleType: 'Van',
      status: 'completed',
      driver: { name: 'Michael Davis', avatar: 'MD', rating: 4.7 },
      pickup: 'Furniture Store, 789 Furniture Ln',
      dropoff: 'Apartment 5B, 123 Housing St',
      distance: 8.3,
      duration: 25,
      fare: 45.67,
      tip: 9.13,
      total: 54.80,
      rating: 5,
      createdAt: '2024-01-03 10:30:00',
      completedAt: '2024-01-03 10:55:00',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'RIDE-12351',
      serviceType: 'RIDE',
      vehicleType: 'Luxury Sedan',
      status: 'completed',
      driver: { name: 'Jennifer Taylor', avatar: 'JT', rating: 4.9 },
      pickup: '123 Business Park',
      dropoff: '456 Corporate Center',
      distance: 6.7,
      duration: 22,
      fare: 34.56,
      tip: 6.91,
      total: 41.47,
      rating: 5,
      createdAt: '2024-01-02 09:15:00',
      completedAt: '2024-01-02 09:37:00',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'RIDE-12352',
      serviceType: 'GOODS',
      vehicleType: 'Truck/Van',
      status: 'cancelled',
      driver: { name: 'Robert Johnson', avatar: 'RJ', rating: 4.7 },
      pickup: 'Warehouse A, 123 Industrial Blvd',
      dropoff: 'Store B, 456 Commercial Ave',
      distance: 12.5,
      duration: 35,
      fare: 67.89,
      tip: 0,
      total: 0,
      rating: 0,
      createdAt: '2024-01-01 13:30:00',
      completedAt: null,
      paymentMethod: 'Credit Card',
      cancellationReason: 'User cancelled',
    },
  ];

  // BMAD Principle: Ride statistics for user insights
  const rideStats = {
    totalRides: 156,
    completedRides: 145,
    cancelledRides: 11,
    totalSpent: 2345.67,
    avgFare: 15.03,
    avgRating: 4.8,
    totalDistance: 456.7,
    totalDuration: 89.5,
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
  };

  const handleServiceFilterChange = (event: any) => {
    setServiceFilter(event.target.value);
  };

  const handleDateRangeChange = (event: any) => {
    setDateRange(event.target.value);
  };

  const handlePageChange = (event: any, value: number) => {
    setPage(value);
  };

  const handleViewRide = (ride: any) => {
    setSelectedRide(ride);
    setViewDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'in_progress':
        return 'info';
      case 'scheduled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'cancelled':
        return <Cancel color="error" />;
      case 'in_progress':
        return <DirectionsCar color="info" />;
      case 'scheduled':
        return <Schedule color="warning" />;
      default:
        return <DirectionsCar />;
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'RIDE':
        return <DirectionsCar color="primary" />;
      case 'MOTO':
        return <DirectionsCar color="primary" />;
      case 'FOOD':
        return <DirectionsCar color="primary" />;
      case 'GROCERY':
        return <DirectionsCar color="primary" />;
      case 'GOODS':
        return <DirectionsCar color="primary" />;
      case 'TRUCK_VAN':
        return <DirectionsCar color="primary" />;
      default:
        return <DirectionsCar />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* BMAD Principle: Clear header */}
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
        Ride History
      </Typography>

      {/* BMAD Principle: Ride statistics for quick insights */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <DirectionsCar sx={{ fontSize: 40, color: '#2196F3', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {rideStats.totalRides}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Rides
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <CheckCircle sx={{ fontSize: 40, color: '#4CAF50', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {rideStats.completedRides}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <AttachMoney sx={{ fontSize: 40, color: '#4CAF50', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                ${rideStats.totalSpent.toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Spent
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Star sx={{ fontSize: 40, color: '#FFC107', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FFC107' }}>
                {rideStats.avgRating.toFixed(1)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Avg Rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BMAD Principle: Search and filter for efficient ride history */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search rides by ID, location, or driver..."
              value={searchQuery}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Service</InputLabel>
              <Select
                value={serviceFilter}
                label="Service"
                onChange={handleServiceFilterChange}
              >
                <MenuItem value="all">All Services</MenuItem>
                <MenuItem value="RIDE">Ride</MenuItem>
                <MenuItem value="MOTO">Moto</MenuItem>
                <MenuItem value="FOOD">Food</MenuItem>
                <MenuItem value="GROCERY">Grocery</MenuItem>
                <MenuItem value="GOODS">Goods</MenuItem>
                <MenuItem value="TRUCK_VAN">Truck/Van</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={handleDateRangeChange}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
            >
              Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* BMAD Principle: Ride history table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ride ID</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Pickup</TableCell>
                <TableCell>Dropoff</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Fare</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rides.map((ride) => (
                <TableRow key={ride.id} hover>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {ride.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getServiceIcon(ride.serviceType)}
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {ride.serviceType.replace('_', ' ')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(ride.status)}
                      <Chip
                        label={ride.status.toUpperCase()}
                        color={getStatusColor(ride.status) as any}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    {ride.driver ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#FF9800', fontSize: 12 }}>
                          {ride.driver.avatar}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {ride.driver.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Star sx={{ fontSize: 12, color: '#FFC107' }} />
                            <Typography variant="caption" sx={{ color: '#FFC107' }}>
                              {ride.driver.rating.toFixed(1)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Not assigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="caption" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ride.pickup}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="caption" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ride.dropoff}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarToday fontSize="small" color="action" />
                      <Typography variant="caption">
                        {ride.createdAt.split(' ')[0]}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      ${ride.total.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {ride.rating > 0 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Star sx={{ fontSize: 16, color: '#FFC107' }} />
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#FFC107' }}>
                          {ride.rating}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewRide(ride)}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* BMAD Principle: Pagination for large datasets */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Pagination
          count={Math.ceil(rides.length / rowsPerPage)}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      {/* BMAD Principle: View ride dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Ride Details</DialogTitle>
        <DialogContent>
          {selectedRide && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {getServiceIcon(selectedRide.serviceType)}
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {selectedRide.id}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(selectedRide.status)}
                    <Chip
                      label={selectedRide.status.toUpperCase()}
                      color={getStatusColor(selectedRide.status) as any}
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Driver Information
                </Typography>
                {selectedRide.driver ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#FF9800' }}>
                      {selectedRide.driver.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {selectedRide.driver.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Star sx={{ fontSize: 16, color: '#FFC107' }} />
                        <Typography variant="caption" sx={{ color: '#FFC107' }}>
                          {selectedRide.driver.rating.toFixed(1)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No driver assigned
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Ride Information
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Vehicle Type:</strong> {selectedRide.vehicleType}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Distance:</strong> {selectedRide.distance} km
                </Typography>
                <Typography variant="body2">
                  <strong>Duration:</strong> {selectedRide.duration} min
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Route Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn fontSize="small" color="primary" />
                    <Typography variant="body2">
                      <strong>Pickup:</strong> {selectedRide.pickup}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn fontSize="small" color="error" />
                    <Typography variant="body2">
                      <strong>Dropoff:</strong> {selectedRide.dropoff}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Payment Information
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Fare:</strong> ${selectedRide.fare.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Tip:</strong> ${selectedRide.tip.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Total:</strong> ${selectedRide.total.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  <strong>Payment Method:</strong> {selectedRide.paymentMethod}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Time Information
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Created At:</strong> {selectedRide.createdAt}
                </Typography>
                <Typography variant="body2">
                  <strong>Completed At:</strong> {selectedRide.completedAt || 'Not completed'}
                </Typography>
              </Grid>
              {selectedRide.cancellationReason && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Cancellation Reason
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {selectedRide.cancellationReason}
                  </Typography>
                </Grid>
              )}
              {selectedRide.rating > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Your Rating
                  </Typography>
                  <Rating value={selectedRide.rating} readOnly precision={1} />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RideHistory;
