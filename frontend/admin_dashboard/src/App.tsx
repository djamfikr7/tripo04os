import React from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography, Grid, Paper, Card, CardContent, Tabs, Tab, IconButton, Table, TableBody, TableContainer, TableCell, TableHead, TableRow, Button } from '@mui/material';
import { People, DirectionsCar, Security, Support, MoreVert } from '@mui/icons-material';
import UsersManagement from './components/UsersManagement';
import OrderMonitoring from './components/OrderMonitoring';
import FraudReputation from './components/FraudReputation';
import SupportTickets from './components/SupportTickets';
import ConfigurationSettings from './components/ConfigurationSettings';

const theme = createTheme({
  palette: {
    primary: { main: '#1976D2' },
    secondary: { main: '#9C27B0' },
    error: { main: '#D32F2F' },
    warning: { main: '#ED6C02' },
    info: { main: '#0288D1' },
    success: { main: '#2E7D32' },
  },
});

function App() {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const stats = {
    totalUsers: 15420,
    activeUsers: 3421,
    totalOrders: 89456,
    totalDrivers: 2345,
    todayRevenue: 45678.00,
    pendingIssues: 23,
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Tripo04OS Admin Dashboard
            </Typography>
          <IconButton color="inherit">
            <MoreVert />
          </IconButton>
          <Button color="inherit" variant="outlined" onClick={() => setMobileOpen(!mobileOpen)}>
            Menu
          </Button>
        </Toolbar>
      </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
                  <People sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4" color="text.secondary">
                    {stats.totalUsers.toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
                    <DirectionsCar sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Active Orders
                    </Typography>
                    <Typography variant="h4" color="text.secondary">
                      {stats.activeUsers.toLocaleString()}
                    </Typography>
                  </Box>
                </CardContent>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
                    <TrendingUp sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Today's Revenue
                    </Typography>
                    <Typography variant="h4" color="text.secondary">
                      ${stats.todayRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </Typography>
                  </Box>
                </CardContent>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
                    <Security sx={{ fontSize: 40, color: 'error.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Pending Issues
                    </Typography>
                    <Typography variant="h4" color="text.secondary">
                      {stats.pendingIssues}
                    </Typography>
                  </Box>
                </CardContent>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ width: '100%' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
                  <Tab label="Users Management" />
                  <Tab label="Order Monitoring" />
                  <Tab label="Analytics" />
                  <Tab label="Fraud & Reputation" />
                  <Tab label="Support Tickets" />
                  <Tab label="Settings" />
                </Tabs>
                <Box sx={{ mt: 3 }}>
                  {tabValue === 0 && <UsersManagement />}
                  {tabValue === 1 && <OrderMonitoring />}
                  {tabValue === 2 && (
                    <Box>
                      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                        Business Analytics
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>Total Revenue</Typography>
                              <Typography variant="h4" color="text.secondary">
                                ${stats.todayRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>Total Orders</Typography>
                              <Typography variant="h4" color="text.secondary">
                                {stats.totalOrders.toLocaleString()}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                  {tabValue === 3 && <FraudReputation />}
                  {tabValue === 4 && <SupportTickets />}
                  {tabValue === 5 && <ConfigurationSettings />}
                    <Box>
                      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                        Support Tickets
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Button variant="contained" startIcon={<Support />}>
                          Create Ticket
                        </Button>
                      </Box>
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>ID</TableCell>
                              <TableCell>Subject</TableCell>
                              <TableCell>Priority</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Assigned To</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>1</TableCell>
                              <TableCell>Payment gateway error</TableCell>
                              <TableCell><Button color="error" size="small">High</Button></TableCell>
                              <TableCell><Button color="warning" size="small">In Progress</Button></TableCell>
                              <TableCell>John</TableCell>
                              <TableCell>
                                <IconButton size="small">
                                  <MoreVert />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                  {tabValue === 5 && (
                    <Box>
                      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                        System Settings
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>General Settings</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 2 }}>
                            <Button variant="outlined">Maintenance Mode</Button>
                            <Button variant="outlined">System Version: v1.0.0</Button>
                          </Box>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>API Endpoints</Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="body2">
                              • Identity Service: http://localhost:8000
                            </Typography>
                            <Typography variant="body2">
                              • Order Service: http://localhost:8001
                            </Typography>
                            <Typography variant="body2">
                              • Trip Service: http://localhost:8002
                            </Typography>
                            <Typography variant="body2">
                              • Matching Service: http://localhost:8003
                            </Typography>
                            <Typography variant="body2">
                              • Pricing Service: http://localhost:8004
                            </Typography>
                            <Typography variant="body2">
                              • Communication Service: http://localhost:8005
                            </Typography>
                            <Typography variant="body2">
                              • Safety Service: http://localhost:8006
                            </Typography>
                            <Typography variant="body2">
                              • Reutation Service: http://localhost:8009
                            </Typography>
                            <Typography variant="body2">
                              • Fraud Service: http://localhost:8010
                            </Typography>
                            <Typography variant="body2">
                              • Subscription Service: http://localhost:8011
                            </Typography>
                            <Typography variant="body2">
                              • Analytics Service: http://localhost:8012
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ width: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity Log
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      • User #1234 registered successfully
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Order #5678 completed by Driver #8901
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • New fraud report created for User #9012
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Payment processed for Order #3456
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Driver #5678 availability updated to Online
                    </Typography>
                  </Box>
                </CardContent>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
