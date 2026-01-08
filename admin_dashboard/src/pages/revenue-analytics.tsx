import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Refresh,
  Download,
  CalendarToday,
  ArrowUpward,
  ArrowDownward,
  PieChart,
  BarChart,
  LineChart,
} from '@mui/icons-material';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

/// BMAD Phase 5: Implement
/// Admin Dashboard - Revenue and Profit Analytics for Tripo04OS
/// BMAD Principle: Maximize profitability with comprehensive revenue analytics
const RevenueAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [activeTab, setActiveTab] = useState(0);

  // BMAD Principle: Revenue data for trend analysis
  const revenueData = [
    { month: 'Jan', revenue: 45000, cost: 35000, profit: 10000, rides: 1500 },
    { month: 'Feb', revenue: 52000, cost: 38000, profit: 14000, rides: 1700 },
    { month: 'Mar', revenue: 58000, cost: 42000, profit: 16000, rides: 1900 },
    { month: 'Apr', revenue: 62000, cost: 45000, profit: 17000, rides: 2100 },
    { month: 'May', revenue: 68000, cost: 48000, profit: 20000, rides: 2300 },
    { month: 'Jun', revenue: 75000, cost: 52000, profit: 23000, rides: 2500 },
    { month: 'Jul', revenue: 78000, cost: 54000, profit: 24000, rides: 2600 },
    { month: 'Aug', revenue: 82000, cost: 56000, profit: 26000, rides: 2800 },
    { month: 'Sep', revenue: 76000, cost: 52000, profit: 24000, rides: 2500 },
    { month: 'Oct', revenue: 71000, cost: 49000, profit: 22000, rides: 2400 },
    { month: 'Nov', revenue: 68000, cost: 47000, profit: 21000, rides: 2300 },
    { month: 'Dec', revenue: 85000, cost: 58000, profit: 27000, rides: 2900 },
  ];

  // BMAD Principle: Service type revenue breakdown
  const serviceRevenueData = [
    { name: 'Ride', value: 450000, color: '#2196F3' },
    { name: 'Moto', value: 120000, color: '#FF9800' },
    { name: 'Food', value: 180000, color: '#4CAF50' },
    { name: 'Grocery', value: 80000, color: '#9C27B0' },
    { name: 'Goods', value: 60000, color: '#00BCD4' },
    { name: 'Truck/Van', value: 40000, color: '#F44336' },
  ];

  // BMAD Principle: Daily revenue data for detailed analysis
  const dailyRevenueData = [
    { day: 'Mon', revenue: 12000, profit: 3500, rides: 380 },
    { day: 'Tue', revenue: 11500, profit: 3200, rides: 360 },
    { day: 'Wed', revenue: 13000, profit: 3800, rides: 410 },
    { day: 'Thu', revenue: 14500, profit: 4200, rides: 460 },
    { day: 'Fri', revenue: 18000, profit: 5500, rides: 580 },
    { day: 'Sat', revenue: 22000, profit: 7000, rides: 720 },
    { day: 'Sun', revenue: 19000, profit: 5800, rides: 620 },
  ];

  // BMAD Principle: Hourly revenue distribution
  const hourlyRevenueData = [
    { hour: '00:00', revenue: 800 },
    { hour: '04:00', revenue: 600 },
    { hour: '08:00', revenue: 2500 },
    { hour: '12:00', revenue: 3200 },
    { hour: '16:00', revenue: 2800 },
    { hour: '20:00', revenue: 2200 },
    { hour: '23:59', revenue: 1200 },
  ];

  // BMAD Principle: Top revenue generating cities
  const topCities = [
    { city: 'New York', revenue: 250000, rides: 8500, avgFare: 29.41 },
    { city: 'Los Angeles', revenue: 180000, rides: 6200, avgFare: 29.03 },
    { city: 'Chicago', revenue: 150000, rides: 5200, avgFare: 28.85 },
    { city: 'Houston', revenue: 120000, rides: 4200, avgFare: 28.57 },
    { city: 'Phoenix', revenue: 90000, rides: 3200, avgFare: 28.13 },
  ];

  // BMAD Principle: Revenue statistics for quick insights
  const revenueStats = {
    totalRevenue: 930000,
    totalCost: 640000,
    totalProfit: 290000,
    profitMargin: 31.2,
    avgRevenuePerRide: 28.50,
    totalRides: 32600,
    revenueGrowth: 15.5,
    profitGrowth: 18.2,
    avgDailyRevenue: 2548,
  };

  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value);
  };

  const handleTabChange = (event: any, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    // BMAD Principle: Refresh data for real-time accuracy
    alert('Refreshing revenue data...');
  };

  const handleExport = () => {
    // BMAD Principle: Export data for external analysis
    alert('Exporting revenue data...');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* BMAD Principle: Clear header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Revenue & Profit Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={handleRefresh}>
            <Refresh />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* BMAD Principle: Key revenue metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ fontSize: 40, color: '#4CAF50' }} />
                <Chip label={`+${revenueStats.revenueGrowth}%`} color="success" size="small" icon={<ArrowUpward />} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                ${revenueStats.totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ fontSize: 40, color: '#2196F3' }} />
                <Chip label={`+${revenueStats.profitGrowth}%`} color="success" size="small" icon={<ArrowUpward />} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                ${revenueStats.totalProfit.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Profit
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <PieChart sx={{ fontSize: 40, color: '#FF9800' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {revenueStats.profitMargin.toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Profit Margin
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <BarChart sx={{ fontSize: 40, color: '#9C27B0' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                ${revenueStats.avgRevenuePerRide.toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Avg Revenue/Ride
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BMAD Principle: Tabs for different analytics views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Revenue Trend" />
          <Tab label="Service Breakdown" />
          <Tab label="Daily Analysis" />
          <Tab label="Hourly Distribution" />
          <Tab label="Top Cities" />
        </Tabs>
      </Paper>

      {/* BMAD Principle: Revenue trend chart */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            Revenue, Cost & Profit Trend
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="revenue" stackId="1" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.3} name="Revenue" />
              <Area type="monotone" dataKey="cost" stackId="1" stroke="#F44336" fill="#F44336" fillOpacity={0.3} name="Cost" />
              <Line type="monotone" dataKey="profit" stroke="#2196F3" strokeWidth={3} name="Profit" dot={{ fill: '#2196F3' }} />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* BMAD Principle: Service breakdown chart */}
      {activeTab === 1 && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Revenue by Service Type
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsPieChart>
                  <Pie
                    data={serviceRevenueData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Service Revenue Details
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {serviceRevenueData.map((service) => (
                      <TableRow key={service.name}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: service.color }} />
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {service.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            ${service.value.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {((service.value / revenueStats.totalRevenue) * 100).toFixed(1)}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* BMAD Principle: Daily analysis chart */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            Daily Revenue & Profit Analysis
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart data={dailyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#4CAF50" name="Revenue" />
              <Bar dataKey="profit" fill="#2196F3" name="Profit" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* BMAD Principle: Hourly distribution chart */}
      {activeTab === 3 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            Hourly Revenue Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <RechartsLineChart data={hourlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#FF9800" strokeWidth={3} name="Revenue" dot={{ fill: '#FF9800' }} />
            </RechartsLineChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* BMAD Principle: Top cities table */}
      {activeTab === 4 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            Top Revenue Generating Cities
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>City</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Rides</TableCell>
                  <TableCell align="right">Avg Fare</TableCell>
                  <TableCell align="right">Trend</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topCities.map((city, index) => (
                  <TableRow key={city.city}>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {index + 1}. {city.city}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                        ${city.revenue.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1">
                        {city.rides.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1">
                        ${city.avgFare.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`+${(Math.random() * 10 + 5).toFixed(1)}%`}
                        color="success"
                        size="small"
                        icon={<ArrowUpward />}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* BMAD Principle: Additional metrics */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Total Rides
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {revenueStats.totalRides.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Total Cost
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#F44336' }}>
                ${revenueStats.totalCost.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Avg Daily Revenue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                ${revenueStats.avgDailyRevenue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Revenue/Ride
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                ${revenueStats.avgRevenuePerRide.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RevenueAnalytics;
