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
  Person,
} from '@mui/icons-material';

/// BMAD Phase 5: Implement
/// Admin Dashboard - User Management for Tripo04OS
/// BMAD Principle: Maximize user engagement with comprehensive user management
const UserManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // BMAD Principle: User data model for comprehensive management
  const users = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1 234 567 8901',
      avatar: 'JS',
      status: 'active',
      joinDate: '2023-01-15',
      totalRides: 156,
      totalSpent: 1234.56,
      rating: 4.8,
      location: 'New York, NY',
      lastActive: '2 hours ago',
      paymentMethods: 3,
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+1 234 567 8902',
      avatar: 'SJ',
      status: 'active',
      joinDate: '2023-03-22',
      totalRides: 89,
      totalSpent: 890.12,
      rating: 4.9,
      location: 'Los Angeles, CA',
      lastActive: '5 minutes ago',
      paymentMethods: 2,
    },
    {
      id: 3,
      name: 'Michael Brown',
      email: 'm.brown@email.com',
      phone: '+1 234 567 8903',
      avatar: 'MB',
      status: 'inactive',
      joinDate: '2022-11-10',
      totalRides: 234,
      totalSpent: 2345.67,
      rating: 4.7,
      location: 'Chicago, IL',
      lastActive: '30 days ago',
      paymentMethods: 1,
    },
    {
      id: 4,
      name: 'Emily Davis',
      email: 'emily.d@email.com',
      phone: '+1 234 567 8904',
      avatar: 'ED',
      status: 'active',
      joinDate: '2023-05-18',
      totalRides: 45,
      totalSpent: 450.89,
      rating: 4.6,
      location: 'Houston, TX',
      lastActive: '1 day ago',
      paymentMethods: 2,
    },
    {
      id: 5,
      name: 'David Wilson',
      email: 'd.wilson@email.com',
      phone: '+1 234 567 8905',
      avatar: 'DW',
      status: 'blocked',
      joinDate: '2022-08-05',
      totalRides: 67,
      totalSpent: 678.90,
      rating: 4.5,
      location: 'Phoenix, AZ',
      lastActive: '15 days ago',
      paymentMethods: 1,
    },
    {
      id: 6,
      name: 'Jessica Martinez',
      email: 'j.martinez@email.com',
      phone: '+1 234 567 8906',
      avatar: 'JM',
      status: 'active',
      joinDate: '2023-02-28',
      totalRides: 123,
      totalSpent: 1234.56,
      rating: 4.8,
      location: 'Philadelphia, PA',
      lastActive: '3 hours ago',
      paymentMethods: 3,
    },
    {
      id: 7,
      name: 'Robert Taylor',
      email: 'r.taylor@email.com',
      phone: '+1 234 567 8907',
      avatar: 'RT',
      status: 'active',
      joinDate: '2023-04-12',
      totalRides: 78,
      totalSpent: 780.34,
      rating: 4.7,
      location: 'San Antonio, TX',
      lastActive: '30 minutes ago',
      paymentMethods: 2,
    },
    {
      id: 8,
      name: 'Amanda Anderson',
      email: 'a.anderson@email.com',
      phone: '+1 234 567 8908',
      avatar: 'AA',
      status: 'inactive',
      joinDate: '2022-12-20',
      totalRides: 56,
      totalSpent: 560.12,
      rating: 4.6,
      location: 'San Diego, CA',
      lastActive: '45 days ago',
      paymentMethods: 1,
    },
  ];

  // BMAD Principle: User statistics for informed decisions
  const userStats = {
    totalUsers: 15234,
    activeUsers: 12345,
    inactiveUsers: 2345,
    blockedUsers: 544,
    newUsersThisMonth: 234,
    avgRidesPerUser: 12.5,
    avgSpentPerUser: 125.67,
    topUserLocation: 'New York, NY',
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

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleBlockUser = (user: any) => {
    // BMAD Principle: Block user for policy violations
    alert(`Block user: ${user.name}`);
  };

  const handleDeleteUser = (user: any) => {
    // BMAD Principle: Delete user account with confirmation
    if (confirm(`Are you sure you want to delete user: ${user.name}?`)) {
      alert(`User deleted: ${user.name}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle color="success" />;
      case 'inactive':
        return <Person color="disabled" />;
      case 'blocked':
        return <Block color="error" />;
      default:
        return <Person />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* BMAD Principle: Clear header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{ bgcolor: '#0066FF' }}
        >
          Add User
        </Button>
      </Box>

      {/* BMAD Principle: User statistics for quick insights */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Person sx={{ fontSize: 40, color: '#2196F3' }} />
                <Chip label="+12%" color="success" size="small" icon={<TrendingUp />} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {userStats.totalUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Total Users
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
                {userStats.activeUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Active Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Person sx={{ fontSize: 40, color: '#9E9E9E' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {userStats.inactiveUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Inactive Users
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
                {userStats.blockedUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Blocked Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BMAD Principle: Search and filter for efficient user management */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search users by name, email, or phone..."
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
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
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

      {/* BMAD Principle: User table with actions */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Total Rides</TableCell>
                <TableCell>Total Spent</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#0066FF' }}>
                        {user.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {user.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(user.status)}
                      <Chip
                        label={user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        color={getStatusColor(user.status) as any}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2">
                        {user.location}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {user.totalRides}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      ${user.totalSpent.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#FFC107' }}>
                        {user.rating.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#FFC107' }}>
                        ★
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {user.lastActive}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewUser(user)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleBlockUser(user)}
                        color="error"
                      >
                        <Block fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(user)}
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
          count={Math.ceil(users.length / rowsPerPage)}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      {/* BMAD Principle: View user dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={3}>
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: '#0066FF', margin: '0 auto' }}>
                  {selectedUser.avatar}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 2 }}>
                  {selectedUser.name}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mt: 1 }}>
                  {getStatusIcon(selectedUser.status)}
                  <Chip
                    label={selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
                    color={getStatusColor(selectedUser.status) as any}
                    size="small"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Email fontSize="small" color="action" />
                  <Typography variant="body2">{selectedUser.email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2">{selectedUser.phone}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2">{selectedUser.location}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Join Date:</strong> {selectedUser.joinDate}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Total Rides:</strong> {selectedUser.totalRides}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Total Spent:</strong> ${selectedUser.totalSpent.toFixed(2)}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Rating:</strong> {selectedUser.rating.toFixed(1)} ★
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Last Active:</strong> {selectedUser.lastActive}
                </Typography>
                <Typography variant="body2">
                  <strong>Payment Methods:</strong> {selectedUser.paymentMethods}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* BMAD Principle: Edit user dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  defaultValue={selectedUser.name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  defaultValue={selectedUser.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  defaultValue={selectedUser.phone}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    defaultValue={selectedUser.status}
                    label="Status"
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="blocked">Blocked</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location"
                  defaultValue={selectedUser.location}
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

export default UserManagement;
