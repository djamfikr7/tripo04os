import { Grid, Paper, Typography, Button, Chip, Box } from '@mui/material';
import {
  DirectionsCar,
  Refresh,
  CheckCircle,
  Cancel,
  Schedule,
  LocalShipping,
  Restaurant,
  ShoppingCart,
  Assessment
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

interface Order {
  id: string;
  riderId: string;
  riderName: string;
  driverId: string | null;
  driverName: string | null;
  vertical: 'RIDE' | 'MOTO' | 'FOOD' | 'GROCERY' | 'GOODS' | 'TRUCK_VAN';
  status: 'PENDING' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  pickupLocation: string;
  dropoffLocation: string;
  createdAt: string;
  estimatedArrival: string | null;
  fare: number;
}

interface OrderStats {
  totalOrders: number;
  activeOrders: number;
  completedToday: number;
  cancelledToday: number;
  totalRevenue: number;
  averageWaitTime: number;
}

const OrderMonitoring = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    activeOrders: 0,
    completedToday: 0,
    cancelledToday: 0,
    totalRevenue: 0,
    averageWaitTime: 0,
  });

  const mockOrders: Order[] = [
    {
      id: 'ORD-001',
      riderId: 'R-1234',
      riderName: 'John Doe',
      driverId: 'D-5678',
      driverName: 'Jane Smith',
      vertical: 'RIDE',
      status: 'IN_PROGRESS',
      pickupLocation: '123 Main St',
      dropoffLocation: '456 Oak Ave',
      createdAt: '2024-01-20T14:30:00Z',
      estimatedArrival: '2024-01-20T14:45:00Z',
      fare: 25.50,
    },
    {
      id: 'ORD-002',
      riderId: 'R-2345',
      riderName: 'Alice Johnson',
      driverId: null,
      driverName: null,
      vertical: 'FOOD',
      status: 'PENDING',
      pickupLocation: '789 Restaurant Blvd',
      dropoffLocation: '321 Home Dr',
      createdAt: '2024-01-20T14:32:00Z',
      estimatedArrival: null,
      fare: 18.75,
    },
    {
      id: 'ORD-003',
      riderId: 'R-3456',
      riderName: 'Bob Wilson',
      driverId: 'D-7890',
      driverName: 'Mike Brown',
      vertical: 'GROCERY',
      status: 'MATCHED',
      pickupLocation: 'Super Mart',
      dropoffLocation: '555 Pine St',
      createdAt: '2024-01-20T14:25:00Z',
      estimatedArrival: '2024-01-20T14:40:00Z',
      fare: 12.99,
    },
    {
      id: 'ORD-004',
      riderId: 'R-4567',
      riderName: 'Carol Davis',
      driverId: null,
      driverName: null,
      vertical: 'GOODS',
      status: 'PENDING',
      pickupLocation: 'Distribution Center',
      dropoffLocation: 'Business Park',
      createdAt: '2024-01-20T14:35:00Z',
      estimatedArrival: null,
      fare: 45.00,
    },
  ];

  const mockStats: OrderStats = {
    totalOrders: 89456,
    activeOrders: 3421,
    completedToday: 5678,
    cancelledToday: 234,
    totalRevenue: 45678.00,
    averageWaitTime: 2.5,
  };

  useEffect(() => {
    setOrders(mockOrders);
    setStats(mockStats);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setOrders(mockOrders);
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  };

  const getVerticalIcon = (vertical: string) => {
    switch (vertical) {
      case 'RIDE':
        return <DirectionsCar fontSize="small" />;
      case 'MOTO':
        return <DirectionsCar fontSize="small" />;
      case 'FOOD':
        return <Restaurant fontSize="small" />;
      case 'GROCERY':
        return <ShoppingCart fontSize="small" />;
      case 'GOODS':
        return <LocalShipping fontSize="small" />;
      case 'TRUCK_VAN':
        return <LocalShipping fontSize="small" />;
      default:
        return <DirectionsCar fontSize="small" />;
    }
  };

  const getVerticalColor = (vertical: string) => {
    switch (vertical) {
      case 'RIDE':
        return 'primary';
      case 'MOTO':
        return 'primary';
      case 'FOOD':
        return 'warning';
      case 'GROCERY':
        return 'success';
      case 'GOODS':
        return 'info';
      case 'TRUCK_VAN':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Schedule fontSize="small" />;
      case 'MATCHED':
        return <Schedule fontSize="small" />;
      case 'IN_PROGRESS':
        return <LocalShipping fontSize="small" />;
      case 'COMPLETED':
        return <CheckCircle fontSize="small" />;
      case 'CANCELLED':
        return <Cancel fontSize="small" />;
      default:
        return <Schedule fontSize="small" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'MATCHED':
        return 'info';
      case 'IN_PROGRESS':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const activeOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'MATCHED' || o.status === 'IN_PROGRESS');
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');

  return (
    <Grid container spacing={3}>
      {/* Statistics Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
              <DirectionsCar sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Active Orders
              </Typography>
              <Typography variant="h4" color="text.secondary">
                {stats.activeOrders.toLocaleString()}
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
              <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Completed Today
              </Typography>
              <Typography variant="h4" color="text.secondary">
                {stats.completedToday.toLocaleString()}
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
              <Cancel sx={{ fontSize: 40, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Cancelled Today
              </Typography>
              <Typography variant="h4" color="text.secondary">
                {stats.cancelledToday.toLocaleString()}
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
              <Assessment sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Total Revenue Today
              </Typography>
              <Typography variant="h4" color="text.secondary">
                ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Grid>

      {/* Active Orders Table */}
      <Grid item xs={12}>
        <Paper>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                <Grid item>
                  <Typography variant="h6">Active Orders</Typography>
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                </Grid>
              </Grid>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Rider</TableCell>
                      <TableCell>Driver</TableCell>
                      <TableCell>Vertical</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Pickup</TableCell>
                      <TableCell>Dropoff</TableCell>
                      <TableCell>ETA</TableCell>
                      <TableCell>Fare</TableCell>
                      <TableCell>Created At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Button color="primary" size="small">
                            {order.id}
                          </Button>
                        </TableCell>
                        <TableCell>{order.riderName}</TableCell>
                        <TableCell>
                          {order.driverName ? (
                            <Chip label={order.driverName} size="small" />
                          ) : (
                            <Chip label="Unassigned" size="small" color="default" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getVerticalIcon(order.vertical)}
                            label={order.vertical}
                            size="small"
                            color={getVerticalColor(order.vertical) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(order.status)}
                            label={order.status}
                            size="small"
                            color={getStatusColor(order.status) as any}
                          />
                        </TableCell>
                        <TableCell>{order.pickupLocation}</TableCell>
                        <TableCell>{order.dropoffLocation}</TableCell>
                        <TableCell>
                          {order.estimatedArrival
                            ? new Date(order.estimatedArrival).toLocaleTimeString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>${order.fare.toFixed(2)}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Paper>
      </Grid>

      {/* Completed Orders */}
      <Grid item xs={12}>
        <Paper>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recently Completed Orders
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Rider</TableCell>
                      <TableCell>Driver</TableCell>
                      <TableCell>Vertical</TableCell>
                      <TableCell>Fare</TableCell>
                      <TableCell>Completed At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {completedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>{order.riderName}</TableCell>
                        <TableCell>{order.driverName}</TableCell>
                        <TableCell>
                          <Chip label={order.vertical} size="small" />
                        </TableCell>
                        <TableCell>${order.fare.toFixed(2)}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default OrderMonitoring;
