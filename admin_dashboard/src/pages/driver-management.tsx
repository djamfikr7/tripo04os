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
  LinearProgress,
  Switch,
  Rating,
} from '@mui/material';
import {
  Search,
  FilterList,
  Add,
  Edit,
  Delete,
  Block,
  CheckCircle,
  Visibility,
  Email,
  Phone,
  LocationOn,
  TrendingUp,
  DirectionsCar,
  Star,
  AttachMoney,
  AccessTime,
} from '@mui/icons-material';

/// BMAD Phase 5: Implement
/// Admin Dashboard - Driver Management for Tripo04OS
/// BMAD Principle: Maximize driver earnings with comprehensive driver management
const DriverManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // BMAD Principle: Driver data model for comprehensive management
  const drivers = [
    {
      id: 1,
      name: 'James Wilson',
      email: 'james.wilson@email.com',
      phone: '+1 234 567 8901',
      avatar: 'JW',
      status: 'online',
      joinDate: '2023-01-15',
      totalRides: 456,
      totalEarnings: 4567.89,
      rating: 4.9,
      location: 'New York, NY',
      vehicleType: 'Sedan',
      vehiclePlate: 'ABC-1234',
      lastActive: 'Online now',
      completedRides: 445,
      cancelledRides: 11,
      acceptanceRate: 96.5,
      avgResponseTime: 2.1,
    },
    {
      id: 2,
      name: 'Maria Garcia',
      email: 'm.garcia@email.com',
      phone: '+1 234 567 8902',
      avatar: 'MG',
      status: 'online',
      joinDate: '2023-03-22',
      totalRides: 234,
      totalEarnings: 2345.67,
      rating: 4.8,
      location: 'Los Angeles, CA',
      vehicleType: 'SUV',
      vehiclePlate: 'XYZ-5678',
      lastActive: 'Online now',
      completedRides: 228,
      cancelledRides: 6,
      acceptanceRate: 98.2,
      avgResponseTime: 1.8,
    },
    {
      id: 3,
      name: 'Robert Johnson',
      email: 'r.johnson@email.com',
      phone: '+1 234 567 8903',
      avatar: 'RJ',
      status: 'offline',
      joinDate: '2022-11-10',
      totalRides: 678,
      totalEarnings: 6789.01,
      rating: 4.7,
      location: 'Chicago, IL',
      vehicleType: 'Sedan',
      vehiclePlate: 'DEF-9012',
      lastActive: '2 hours ago',
      completedRides: 654,
      cancelledRides: 24,
      acceptanceRate: 94.5,
      avgResponseTime: 2.5,
    },
    {
      id: 4,
      name: 'Emily Chen',
      email: 'e.chen@email.com',
      phone: '+1 234 567 8904',
      avatar: 'EC',
      status: 'online',
      joinDate: '2023-05-18',
      totalRides: 123,
      totalEarnings: 1234.56,
      rating: 4.9,
      location: 'Houston, TX',
      vehicleType: 'Luxury Sedan',
      vehiclePlate: 'GHI-3456',
      lastActive: 'Online now',
      completedRides: 120,
      cancelledRides: 3,
      acceptanceRate: 99.1,
      avgResponseTime: 1.5,
    },
    {
      id: 5,
      name: 'David Brown',
      email: 'd.brown@email.com',
      phone: '+1 234 567 8905',
      avatar: 'DB',
      status: 'blocked',
      joinDate: '2022-08-05',
      totalRides: 234,
      totalEarnings: 2345.67,
      rating: 4.5,
      location: 'Phoenix, AZ',
      vehicleType: 'Sedan',
      vehiclePlate: 'JKL-7890',
      lastActive: '15 days ago',
      completedRides: 210,
      cancelledRides: 24,
      acceptanceRate: 85.2,
      avgResponseTime: 4.2,
    },
    {
      id: 6,
      name: 'Sarah Miller',
      email: 's.miller@email.com',
      phone: '+1 234 567 8906',
      avatar: 'SM',
      status: 'online',
      joinDate: '2023-02-28',
      totalRides: 345,
      totalEarnings: 3456.78,
      rating: 4.8,
      location: 'Philadelphia, PA',
      vehicleType: 'SUV',
      vehiclePlate: 'MNO-2345',
      lastActive: 'Online now',
      completedRides: 335,
      cancelledRides: 10,
      acceptanceRate: 97.3,
      avgResponseTime: 2.0,
    },
    {
      id: 7,
      name: 'Michael Davis',
      email: 'm.davis@email.com',
      phone: '+1 234 567 8907',
      avatar: 'MD',
      status: 'offline',
      joinDate: '2023-04-12',
      totalRides: 167,
      totalEarnings: 1678.90,
      rating: 4.7,
      location: 'San Antonio, TX',
      vehicleType: 'Sedan',
      vehiclePlate: 'PQR-6789',
      lastActive: '5 hours ago',
      completedRides: 160,
      cancelledRides: 7,
      acceptanceRate: 95.8,
      avgResponseTime: 2.3,
    },
    {
      id: 8,
      name: 'Jennifer Taylor',
      email: 'j.taylor@email.com',
      phone: '+1 234 567 8908',
      avatar: 'JT',
      status: 'online',
      joinDate: '2022-12-20',
      totalRides: 512,
      totalEarnings: 5123.45,
      rating: 4.9,
      location: 'San Diego, CA',
      vehicleType: 'Luxury SUV',
      vehiclePlate: 'STU-0123',
      lastActive: 'Online now',
      completedRides: 500,
      cancelledRides: 12,
      acceptanceRate: 98.5,
      avgResponseTime: 1.6,
    },
  ];

  // BMAD Principle: Driver statistics for informed decisions
  const driverStats = {
    totalDrivers: 2345,
    onlineDrivers: 567,
    offlineDrivers: 1778,
    blockedDrivers: 12,
    newDriversThisMonth: 45,
    avgRidesPerDriver: 45.6,
    avgEarningsPerDriver: 456.78,
    topDriverLocation: 'New York, NY',
    avgRating: 4.8,
    avgAcceptanceRate: 96.2,
    avgResponseTime: 2.1,
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
  };

  const handlePageChange = (event: any, value: number) => {
    setPage(value);
  };

  const handleViewDriver = (driver: any) => {
    setSelectedDriver(driver);
    setViewDialogOpen(true);
  };

  const handleEditDriver = (driver: any) => {
    setSelectedDriver(driver);
    setEditDialogOpen(true);
  };

  const handleBlockDriver = (driver: any) => {
    // BMAD Principle: Block driver for policy violations
    alert(`Block driver: ${driver.name}`);
  };

  const handleDeleteDriver = (driver: any) => {
    // BMAD Principle: Delete driver account with confirmation
    if (confirm(`Are you sure you want to delete driver: ${driver.name}?`)) {
      alert(`Driver deleted: ${driver.name}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'offline':
        return 'default';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle color="success" />;
      case 'offline':
        return <DirectionsCar color="disabled" />;
      case 'blocked':
        return <Block color="error" />;
      default:
        return <DirectionsCar />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* BMAD Principle: Clear header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Driver Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{ bgcolor: '#0066FF' }}
        >
          Add Driver
        </Button>
      </Box>

      {/* BMAD Principle: Driver statistics for quick insights */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <DirectionsCar sx={{ fontSize: 40, color: '#2196F3' }} />
                <Chip label="+8%" color="success" size="small" icon={<TrendingUp />} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {driverStats.totalDrivers.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Drivers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <CheckCircle sx={{ fontSize: 40, color: '#4CAF50' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {driverStats.onlineDrivers.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Online Now
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <DirectionsCar sx={{ fontSize: 40, color: '#9E9E9E' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {driverStats.offlineDrivers.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Offline
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Block sx={{ fontSize: 40, color: '#F44336' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {driverStats.blockedDrivers.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Blocked
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BMAD Principle: Performance metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Average Rating
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Star sx={{ color: '#FFC107' }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FFC107' }}>
                  {driverStats.avgRating.toFixed(1)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Acceptance Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                {driverStats.avgAcceptanceRate.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Avg Response Time
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime sx={{ color: '#2196F3' }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                  {driverStats.avgResponseTime.toFixed(1)}s
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Avg Earnings/Driver
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney sx={{ color: '#4CAF50' }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                  ${driverStats.avgEarningsPerDriver.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BMAD Principle: Search and filter for efficient driver management */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search drivers by name, email, phone, or plate..."
              value={searchQuery}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="online">Online</MenuItem>
                <MenuItem value="offline">Offline</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
            >
              Advanced Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* BMAD Principle: Driver table with actions */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Driver</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Total Rides</TableCell>
                <TableCell>Earnings</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Acceptance</TableCell>
                <TableCell>Response Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#FF9800' }}>
                        {driver.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {driver.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {driver.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(driver.status)}
                      <Chip
                        label={driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                        color={getStatusColor(driver.status) as any}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {driver.vehicleType}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {driver.vehiclePlate}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2">
                        {driver.location}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {driver.totalRides}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      ${driver.totalEarnings.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#FFC107' }}>
                        {driver.rating.toFixed(1)}
                      </Typography>
                      <Star sx={{ fontSize: 16, color: '#FFC107' }} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: driver.acceptanceRate >= 95 ? '#4CAF50' : driver.acceptanceRate >= 90 ? '#FF9800' : '#F44336' }}>
                      {driver.acceptanceRate.toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {driver.avgResponseTime.toFixed(1)}s
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDriver(driver)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditDriver(driver)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleBlockDriver(driver)}
                        color="error"
                      >
                        <Block fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDriver(driver)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
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
          count={Math.ceil(drivers.length / rowsPerPage)}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      {/* BMAD Principle: View driver dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Driver Details</DialogTitle>
        <DialogContent>
          {selectedDriver && (
            <Grid container spacing={3}>
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: '#FF9800', margin: '0 auto' }}>
                  {selectedDriver.avatar}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 2 }}>
                  {selectedDriver.name}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 1 }}>
                  {getStatusIcon(selectedDriver.status)}
                  <Chip
                    label={selectedDriver.status.charAt(0).toUpperCase() + selectedDriver.status.slice(1)}
                    color={getStatusColor(selectedDriver.status) as any}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2">{selectedDriver.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2">{selectedDriver.phone}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2">{selectedDriver.location}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Vehicle Type:</strong> {selectedDriver.vehicleType}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Vehicle Plate:</strong> {selectedDriver.vehiclePlate}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Join Date:</strong> {selectedDriver.joinDate}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Last Active:</strong> {selectedDriver.lastActive}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Total Rides:</strong> {selectedDriver.totalRides}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Completed:</strong> {selectedDriver.completedRides}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Cancelled:</strong> {selectedDriver.cancelledRides}
                </Typography>
                <Typography variant="body2">
                  <strong>Total Earnings:</strong> ${selectedDriver.totalEarnings.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Rating:</strong> {selectedDriver.rating.toFixed(1)} ★
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Acceptance Rate:</strong> {selectedDriver.acceptanceRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2">
                  <strong>Avg Response Time:</strong> {selectedDriver.avgResponseTime.toFixed(1)}s
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* BMAD Principle: Edit driver dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Driver</DialogTitle>
        <DialogContent>
          {selectedDriver && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  defaultValue={selectedDriver.name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  defaultValue={selectedDriver.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  defaultValue={selectedDriver.phone}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    defaultValue={selectedDriver.status}
                    label="Status"
                  >
                    <MenuItem value="online">Online</MenuItem>
                    <MenuItem value="offline">Offline</MenuItem>
                    <MenuItem value="blocked">Blocked</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vehicle Type"
                  defaultValue={selectedDriver.vehicleType}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vehicle Plate"
                  defaultValue={selectedDriver.vehiclePlate}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  defaultValue={selectedDriver.location}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" sx={{ bgcolor: '#0066FF' }}>Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DriverManagement;
