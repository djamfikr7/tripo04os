import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
} from '@mui/material';
import {
  People,
  DirectionsCar,
  AttachMoney,
  TrendingUp,
  Refresh,
  ArrowUpward,
  ArrowDownward,
  Warning,
  CheckCircle,
  Cancel,
  Schedule,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

/// BMAD Phase 5: Implement
/// Admin Dashboard - Overview and Metrics for Tripo04OS
/// BMAD Principle: Maximize operational efficiency with comprehensive dashboard
const OverviewMetrics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('today');
  const [loading, setLoading] = useState(false);

  // BMAD Principle: Real-time metrics for operational visibility
  const metrics = {
    totalUsers: 15234,
    activeUsers: 3456,
    totalDrivers: 2345,
    activeDrivers: 567,
    totalRevenue: 45678.90,
    todayRevenue: 1234.56,
    totalRides: 56789,
    todayRides: 234,
    avgRating: 4.8,
    completionRate: 96.5,
    avgResponseTime: 2.3,
    avgWaitTime: 4.5,
  };

  // BMAD Principle: Trend data for informed decision making
  const revenueData = [
    { name: '00:00', revenue: 1200, rides: 45 },
    { name: '04:00', revenue: 800, rides: 30 },
    { name: '08:00', revenue: 3500, rides: 120 },
    { name: '12:00', revenue: 4200, rides: 145 },
    { name: '16:00', revenue: 3800, rides: 130 },
    { name: '20:00', revenue: 2900, rides: 98 },
    { name: '23:59', revenue: 1500, rides: 52 },
  ];

  const rideStatusData = [
    { name: 'Completed', value: 54321, color: '#4CAF50' },
    { name: 'Cancelled', value: 1234, color: '#F44336' },
    { name: 'In Progress', value: 234, color: '#2196F3' },
  ];

  const serviceTypeData = [
    { name: 'Ride', value: 45678 },
    { name: 'Moto', value: 5678 },
    { name: 'Food', value: 3456 },
    { name: 'Grocery', value: 1234 },
    { name: 'Goods', value: 567 },
    { name: 'Truck/Van', value: 176 },
  ];

  // BMAD Principle: Recent activity for operational awareness
  const recentActivity = [
    { id: 1, type: 'ride', message: 'New ride booked - #12345', time: '2 minutes ago', status: 'success' },
    { id: 2, type: 'driver', message: 'Driver John D. went online', time: '5 minutes ago', status: 'success' },
    { id: 3, type: 'alert', message: 'High demand detected in Downtown', time: '10 minutes ago', status: 'warning' },
    { id: 4, type: 'ride', message: 'Ride #12344 cancelled', time: '15 minutes ago', status: 'error' },
    { id: 5, type: 'payment', message: 'Payment received - $45.67', time: '20 minutes ago', status: 'success' },
  ];

  // BMAD Principle: Alerts for proactive issue resolution
  const alerts = [
    { id: 1, type: 'warning', message: 'Low driver availability in Airport area', severity: 'medium' },
    { id: 2, type: 'error', message: 'Payment gateway latency detected', severity: 'high' },
    { id: 3, type: 'info', message: 'New driver registrations: +15 today', severity: 'low' },
  ];

  const handleRefresh = () => {
    setLoading(true);
    // BMAD Principle: Refresh data for real-time accuracy
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* BMAD Principle: Clear header with refresh capability */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Dashboard Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* BMAD Principle: Key metrics at a glance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <People sx={{ fontSize: 40, color: '#2196F3' }} />
                <Chip label="+12%" color="success" size="small" icon={<ArrowUpward />} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {metrics.totalUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Users
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {metrics.activeUsers.toLocaleString()} active now
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <DirectionsCar sx={{ fontSize: 40, color: '#FF9800' }} />
                <Chip label="+8%" color="success" size="small" icon={<ArrowUpward />} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {metrics.totalDrivers.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Drivers
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {metrics.activeDrivers.toLocaleString()} online
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ fontSize: 40, color: '#4CAF50' }} />
                <Chip label="+15%" color="success" size="small" icon={<ArrowUpward />} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                ${metrics.todayRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Today's Revenue
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Total: ${metrics.totalRevenue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ fontSize: 40, color: '#9C27B0' }} />
                <Chip label="+5%" color="success" size="small" icon={<ArrowUpward />} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {metrics.todayRides.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Today's Rides
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Total: {metrics.totalRides.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BMAD Principle: Performance metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Revenue & Rides Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#2196F3" strokeWidth={2} name="Revenue ($)" />
                <Line yAxisId="right" type="monotone" dataKey="rides" stroke="#FF9800" strokeWidth={2} name="Rides" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Ride Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={rideStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {rideStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* BMAD Principle: Service type breakdown */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Service Type Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#2196F3" name="Number of Rides" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* BMAD Principle: Performance KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Average Rating
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FFC107' }}>
                {metrics.avgRating.toFixed(1)} ★
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Completion Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                {metrics.completionRate.toFixed(1)}%
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
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                {metrics.avgResponseTime.toFixed(1)}s
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Avg Wait Time
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                {metrics.avgWaitTime.toFixed(1)}m
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BMAD Principle: Real-time alerts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Alerts & Notifications
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {alerts.map((alert) => (
                <Box
                  key={alert.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: 1,
                    bgcolor: alert.type === 'error' ? 'error.light' : alert.type === 'warning' ? 'warning.light' : 'info.light',
                  }}
                >
                  {alert.type === 'error' && <Cancel color="error" />}
                  {alert.type === 'warning' && <Warning color="warning" />}
                  {alert.type === 'info' && <CheckCircle color="info" />}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {alert.message}
                    </Typography>
                    <Chip
                      label={alert.severity}
                      size="small"
                      color={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
              Recent Activity
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentActivity.map((activity) => (
                <Box
                  key={activity.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                  }}
                >
                  {activity.type === 'ride' && <DirectionsCar color={activity.status === 'success' ? 'success' : activity.status === 'error' ? 'error' : 'info'} />}
                  {activity.type === 'driver' && <People color="success" />}
                  {activity.type === 'alert' && <Warning color="warning" />}
                  {activity.type === 'payment' && <AttachMoney color="success" />}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {activity.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {activity.time}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OverviewMetrics;
