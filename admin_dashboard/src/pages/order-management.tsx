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
  Tabs,
  Tab,
  Badge,
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
  LocalShipping,
  Restaurant,
  ShoppingCart,
  Motorcycle,
  LocalTaxi,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';

/// BMAD Phase 5: Implement
/// Admin Dashboard - Order Management for Tripo04OS
/// BMAD Principle: Maximize operational efficiency with comprehensive order management
const OrderManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // BMAD Principle: Order data model for comprehensive management
  const orders = [
    {
      id: 'ORD-12345',
      serviceType: 'RIDE',
      vehicleType: 'Sedan',
      status: 'in_progress',
      rider: { name: 'John Smith', avatar: 'JS', rating: 4.8 },
      driver: { name: 'James Wilson', avatar: 'JW', rating: 4.9 },
      pickup: '123 Main St, New York, NY',
      dropoff: '456 Park Ave, New York, NY',
      distance: 5.2,
      duration: 18,
      fare: 23.45,
      createdAt: '2024-01-08 14:30:00',
      scheduledFor: null,
      completedAt: null,
      paymentMethod: 'Credit Card',
      paymentStatus: 'pending',
    },
    {
      id: 'ORD-12346',
      serviceType: 'FOOD',
      vehicleType: 'Moto',
      status: 'completed',
      rider: { name: 'Sarah Johnson', avatar: 'SJ', rating: 4.9 },
      driver: { name: 'Maria Garcia', avatar: 'MG', rating: 4.8 },
      pickup: 'Pizza Palace, 789 5th Ave',
      dropoff: '321 Oak St, Los Angeles, CA',
      distance: 3.8,
      duration: 15,
      fare: 15.67,
      createdAt: '2024-01-08 14:15:00',
      scheduledFor: null,
      completedAt: '2024-01-08 14:30:00',
      paymentMethod: 'Debit Card',
      paymentStatus: 'paid',
    },
    {
      id: 'ORD-12347',
      serviceType: 'GROCERY',
      vehicleType: 'Sedan',
      status: 'pending',
      rider: { name: 'Michael Brown', avatar: 'MB', rating: 4.7 },
      driver: null,
      pickup: 'Super Mart, 456 Elm St',
      dropoff: '789 Pine St, Chicago, IL',
      distance: 4.5,
      duration: 12,
      fare: 18.90,
      createdAt: '2024-01-08 14:00:00',
      scheduledFor: null,
      completedAt: null,
      paymentMethod: 'Credit Card',
      paymentStatus: 'pending',
    },
    {
      id: 'ORD-12348',
      serviceType: 'MOTO',
      vehicleType: 'Moto',
      status: 'in_progress',
      rider: { name: 'Emily Davis', avatar: 'ED', rating: 4.6 },
      driver: { name: 'Emily Chen', avatar: 'EC', rating: 4.9 },
      pickup: '456 Broadway, New York, NY',
      dropoff: '789 Wall St, New York, NY',
      distance: 2.1,
      duration: 8,
      fare: 12.34,
      createdAt: '2024-01-08 13:45:00',
      scheduledFor: null,
      completedAt: null,
      paymentMethod: 'Cash',
      paymentStatus: 'pending',
    },
    {
      id: 'ORD-12349',
      serviceType: 'GOODS',
      vehicleType: 'Truck/Van',
      status: 'cancelled',
      rider: { name: 'David Wilson', avatar: 'DW', rating: 4.5 },
      driver: { name: 'Robert Johnson', avatar: 'RJ', rating: 4.7 },
      pickup: 'Warehouse A, 123 Industrial Blvd',
      dropoff: 'Store B, 456 Commercial Ave',
      distance: 12.5,
      duration: 35,
      fare: 67.89,
      createdAt: '2024-01-08 13:30:00',
      scheduledFor: null,
      completedAt: null,
      paymentMethod: 'Credit Card',
      paymentStatus: 'refunded',
    },
    {
      id: 'ORD-12350',
      serviceType: 'TRUCK_VAN',
      vehicleType: 'Van',
      status: 'scheduled',
      rider: { name: 'Jessica Martinez', avatar: 'JM', rating: 4.8 },
      driver: { name: 'Sarah Miller', avatar: 'SM', rating: 4.8 },
      pickup: 'Furniture Store, 789 Furniture Ln',
      dropoff: 'Apartment 5B, 123 Housing St',
      distance: 8.3,
      duration: 25,
      fare: 45.67,
      createdAt: '2024-01-08 13:00:00',
      scheduledFor: '2024-01-08 16:00:00',
      completedAt: null,
      paymentMethod: 'Credit Card',
      paymentStatus: 'pending',
    },
    {
      id: 'ORD-12351',
      serviceType: 'RIDE',
      vehicleType: 'SUV',
      status: 'completed',
      rider: { name: 'Robert Taylor', avatar: 'RT', rating: 4.7 },
      driver: { name: 'Michael Davis', avatar: 'MD', rating: 4.7 },
      pickup: 'Airport Terminal 1',
      dropoff: 'Downtown Hotel, 456 Main St',
      distance: 15.2,
      duration: 42,
      fare: 56.78,
      createdAt: '2024-01-08 12:30:00',
      scheduledFor: null,
      completedAt: '2024-01-08 13:12:00',
      paymentMethod: 'Credit Card',
      paymentStatus: 'paid',
    },
    {
      id: 'ORD-12352',
      serviceType: 'FOOD',
      vehicleType: 'Moto',
      status: 'in_progress',
      rider: { name: 'Amanda Anderson', avatar: 'AA', rating: 4.6 },
      driver: { name: 'Jennifer Taylor', avatar: 'JT', rating: 4.9 },
      pickup: 'Burger King, 567 Fast Food Ave',
      dropoff: 'Office Building, 890 Business Park',
      distance: 4.2,
      duration: 14,
      fare: 19.23,
      createdAt: '2024-01-08 12:15:00',
      scheduledFor: null,
      completedAt: null,
      paymentMethod: 'Debit Card',
      paymentStatus: 'pending',
    },
  ];

  // BMAD Principle: Order statistics for informed decisions
  const orderStats = {
    totalOrders: 56789,
    pendingOrders: 1234,
    inProgressOrders: 567,
    completedOrders: 54321,
    cancelledOrders: 667,
    scheduledOrders: 234,
    todayOrders: 456,
    todayRevenue: 5678.90,
    avgOrderValue: 23.45,
    avgCompletionTime: 18.5,
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

  const handlePageChange = (event: any, value: number) => {
    setPage(value);
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const handleTabChange = (event: any, newValue: number) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'scheduled':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Schedule color="warning" />;
      case 'in_progress':
        return <LocalShipping color="info" />;
      case 'completed':
        return <CheckCircle color="success" />;
      case 'cancelled':
        return <Cancel color="error" />;
      case 'scheduled':
        return <AccessTime color="secondary" />;
      default:
        return <Schedule />;
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'RIDE':
        return <DirectionsCar color="primary" />;
      case 'MOTO':
        return <Motorcycle color="primary" />;
      case 'FOOD':
        return <Restaurant color="primary" />;
      case 'GROCERY':
        return <ShoppingCart color="primary" />;
      case 'GOODS':
        return <LocalShipping color="primary" />;
      case 'TRUCK_VAN':
        return <LocalTaxi color="primary" />;
      default:
        return <DirectionsCar />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* BMAD Principle: Clear header with tabs */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Order Management
        </Typography>
      </Box>

      {/* BMAD Principle: Order statistics for quick insights */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <DirectionsCar sx={{ fontSize: 40, color: '#2196F3' }} />
                <Chip label="+15%" color="success" size="small" icon={<TrendingUp />} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {orderStats.totalOrders.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Orders
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ fontSize: 40, color: '#FF9800' }} />
                <Badge badgeContent={orderStats.pendingOrders + orderStats.inProgressOrders} color="error">
                  <LocalShipping sx={{ fontSize: 40 }} />
                </Badge>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {orderStats.pendingOrders + orderStats.inProgressOrders}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Active Orders
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
                {orderStats.completedOrders.toLocaleString()}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ fontSize: 40, color: '#4CAF50' }} />
                <Chip label="+12%" color="success" size="small" icon={<TrendingUp />} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                ${orderStats.todayRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Today's Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BMAD Principle: Performance metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Today's Orders
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {orderStats.todayOrders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Average Order Value
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                ${orderStats.avgOrderValue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Avg Completion Time
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime sx={{ color: '#2196F3' }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                  {orderStats.avgCompletionTime.toFixed(1)}m
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BMAD Principle: Tabs for order categories */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="All Orders" />
          <Tab label={`Pending (${orderStats.pendingOrders})`} />
          <Tab label={`In Progress (${orderStats.inProgressOrders})`} />
          <Tab label="Completed" />
          <Tab label="Cancelled" />
          <Tab label="Scheduled" />
        </Tabs>
      </Paper>

      {/* BMAD Principle: Search and filter for efficient order management */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search orders by ID, rider, driver, or location..."
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
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Service Type</InputLabel>
              <Select
                value={serviceFilter}
                label="Service Type"
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

      {/* BMAD Principle: Order table with actions */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Rider</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Pickup</TableCell>
                <TableCell>Dropoff</TableCell>
                <TableCell>Fare</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {order.id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getServiceIcon(order.serviceType)}
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {order.serviceType.replace('_', ' ')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(order.status)}
                      <Chip
                        label={order.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#0066FF', fontSize: 12 }}>
                        {order.rider.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {order.rider.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Star sx={{ fontSize: 12, color: '#FFC107' }} />
                          <Typography variant="caption" sx={{ color: '#FFC107' }}>
                            {order.rider.rating.toFixed(1)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {order.driver ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#FF9800', fontSize: 12 }}>
                          {order.driver.avatar}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {order.driver.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Star sx={{ fontSize: 12, color: '#FFC107' }} />
                            <Typography variant="caption" sx={{ color: '#FFC107' }}>
                              {order.driver.rating.toFixed(1)}
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
                      <Typography variant="caption" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.pickup}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="caption" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.dropoff}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      ${order.fare.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.paymentStatus.toUpperCase()}
                      color={getPaymentStatusColor(order.paymentStatus) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {order.createdAt}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewOrder(order)}
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
          count={Math.ceil(orders.length / rowsPerPage)}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      {/* BMAD Principle: View order dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {getServiceIcon(selectedOrder.serviceType)}
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {selectedOrder.id}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(selectedOrder.status)}
                    <Chip
                      label={selectedOrder.status.replace('_', ' ').toUpperCase()}
                      color={getStatusColor(selectedOrder.status) as any}
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Rider Information
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#0066FF' }}>
                    {selectedOrder.rider.avatar}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {selectedOrder.rider.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Star sx={{ fontSize: 16, color: '#FFC107' }} />
                      <Typography variant="caption" sx={{ color: '#FFC107' }}>
                        {selectedOrder.rider.rating.toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Driver Information
                </Typography>
                {selectedOrder.driver ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#FF9800' }}>
                      {selectedOrder.driver.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {selectedOrder.driver.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Star sx={{ fontSize: 16, color: '#FFC107' }} />
                        <Typography variant="caption" sx={{ color: '#FFC107' }}>
                          {selectedOrder.driver.rating.toFixed(1)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No driver assigned yet
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Route Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn fontSize="small" color="primary" />
                    <Typography variant="body2">
                      <strong>Pickup:</strong> {selectedOrder.pickup}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn fontSize="small" color="error" />
                    <Typography variant="body2">
                      <strong>Dropoff:</strong> {selectedOrder.dropoff}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Typography variant="body2">
                      <strong>Distance:</strong> {selectedOrder.distance} km
                    </Typography>
                    <Typography variant="body2">
                      <strong>Duration:</strong> {selectedOrder.duration} min
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Payment Information
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Fare:</strong> ${selectedOrder.fare.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Payment Method:</strong> {selectedOrder.paymentMethod}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Payment Status:</strong>
                  </Typography>
                  <Chip
                    label={selectedOrder.paymentStatus.toUpperCase()}
                    color={getPaymentStatusColor(selectedOrder.paymentStatus) as any}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Time Information
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Created At:</strong> {selectedOrder.createdAt}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Scheduled For:</strong> {selectedOrder.scheduledFor || 'Not scheduled'}
                </Typography>
                <Typography variant="body2">
                  <strong>Completed At:</strong> {selectedOrder.completedAt || 'Not completed'}
                </Typography>
              </Grid>
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

export default OrderManagement;
