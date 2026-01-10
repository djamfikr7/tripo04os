import {
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Menu,
  Divider,
  TablePagination
} from '@mui/material';
import { 
  Search, 
  MoreVert, 
  FilterList,
  Block,
  Check, 
  Close,
  Person,
  PersonAdd,
  PersonOff,
  Security,
  VerifiedUser,
  Refresh 
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'RIDER' | 'DRIVER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING_VERIFICATION';
  createdAt: string;
  lastLogin: string;
}

interface FilterOptions {
  role: string;
  status: string;
  searchQuery: string;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<FilterOptions>({
    role: '',
    status: '',
    searchQuery: '',
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openRoleMenu, setOpenRoleMenu] = useState(false);
  const [openStatusMenu, setOpenStatusMenu] = useState(false);

  const mockUsers: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'RIDER',
      status: 'ACTIVE',
      createdAt: '2024-01-15T10:30:00Z',
      lastLogin: '2024-01-20T14:22:00Z',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'DRIVER',
      status: 'ACTIVE',
      createdAt: '2024-01-10T09:15:00Z',
      lastLogin: '2024-01-20T08:45:00Z',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'driver1@example.com',
      role: 'DRIVER',
      status: 'SUSPENDED',
      createdAt: '2024-01-08T11:20:00Z',
      lastLogin: '2024-01-18T16:30:00Z',
    },
  ];

  useEffect(() => {
    setUsers(mockUsers);
  }, []);

  const handleRoleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpenRoleMenu(true);
  };

  const handleRoleMenuClose = () => {
    setOpenRoleMenu(false);
  };

  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpenStatusMenu(true);
  };

  const handleStatusMenuClose = () => {
    setOpenStatusMenu(false);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ ...filter, searchQuery: event.target.value });
    setPage(1);
  };

  const handleFilterChange = (field: keyof FilterOptions) => (event: React.ChangeEvent<{ value: string }>) => {
    setFilter({ ...filter, [field]: event.target.value as string });
    setPage(1);
  };

  const clearFilters = () => {
    setFilter({ role: '', status: '', searchQuery: '' });
    setPage(1);
  };

  const getFilteredUsers = () => {
    return users.filter(user => {
      if (filter.role && user.role !== filter.role) return false;
      if (filter.status && user.status !== filter.status) return false;
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
        );
      }
      return true;
    });
  };

  const handleSuspendUser = (userId: string) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, status: 'SUSPENDED' as const } : user
    );
    setUsers(updatedUsers);
  };

  const handleVerifyUser = (userId: string) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, status: 'ACTIVE' as const } : user
    );
    setUsers(updatedUsers);
  };

  const handleUnsuspendUser = (userId: string) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, status: 'ACTIVE' as const } : user
    );
    setUsers(updatedUsers);
  };

  const handleBanUser = (userId: string) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, status: 'BANNED' as const } : user
    );
    setUsers(updatedUsers);
  };

  const handleUnbanUser = (userId: string) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, status: 'ACTIVE' as const } : user
    );
    setUsers(updatedUsers);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm(`Are you sure you want to delete user ${selectedUser?.name}?`)) {
      setUsers(users.filter(user => user.id !== userId));
      setDialogOpen(false);
    }
  };

  const handleStatusChange = (userId: string, newStatus: string) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, status: newStatus as 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'PENDING_VERIFICATION' } : user
    );
    setUsers(updatedUsers);
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, role: newRole as 'RIDER' | 'DRIVER' | 'ADMIN' } : user
    );
    setUsers(updatedUsers);
  };

  const filteredUsers = getFilteredUsers();
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                <Grid item>
                  <Typography variant="h6">Users Management</Typography>
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={handleRoleMenuOpen}
                  >
                    Filter
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => {
                      setUsers(mockUsers);
                      clearFilters();
                    }}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={() => setDialogOpen(true)}
                  >
                    Add User
                  </Button>
                </Grid>
              </Grid>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    placeholder="Search users..."
                    value={filter.searchQuery}
                    onChange={handleSearch}
                    InputProps={{
                      startAdornment: <Search position="start" />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Select
                    fullWidth
                    value={filter.role}
                    onChange={(e) => handleFilterChange('role', e)}
                    displayEmpty
                  >
                    <MenuItem value="">All Roles</MenuItem>
                    <MenuItem value="RIDER">Rider</MenuItem>
                    <MenuItem value="DRIVER">Driver</MenuItem>
                    <MenuItem value="ADMIN">Admin</MenuItem>
                  </Select>
                </Grid>
              </Grid>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Login</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.slice(startIndex, endIndex).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Button
                              color="primary"
                              onClick={() => handleUnbanUser(user.id)}
                            >
                              {user.name}
                            </Button>
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            color={
                              user.role === 'ADMIN'
                                ? 'secondary'
                                : user.role === 'DRIVER'
                                ? 'primary'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.status}
                            color={
                              user.status === 'ACTIVE'
                                ? 'success'
                                : user.status === 'SUSPENDED'
                                ? 'warning'
                                : user.status === 'BANNED'
                                ? 'error'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{user.lastLogin}</TableCell>
                        <TableCell>{user.createdAt}</TableCell>
                        <TableCell>
                          <IconButton size="small">
                            <MoreVert />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ display: 'flex', justifyContent: 'flex', mt: 3 }}>
                <TablePagination
                  component={TablePagination}
                  count={filteredUsers.length}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50, 100]}
                />
              </Box>
            </CardContent>
          </Card>
        </Paper>
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Add a new user to the platform. They will receive an email to verify their account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setDialogOpen(false)}>
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={anchorEl}
        open={openRoleMenu}
        onClose={handleRoleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={() => handleStatusChange(selectedUser?.id || '', 'ACTIVE')}>Mark as Active</MenuItem>
        <MenuItem onClick={() => handleStatusChange(selectedUser?.id || '', 'SUSPENDED')}>Suspend</MenuItem>
        <MenuItem onClick={() => handleStatusChange(selectedUser?.id || '', 'BANNED')}>Ban User</MenuItem>
        <Divider />
        <MenuItem onClick={() => handleRoleChange(selectedUser?.id || '', 'RIDER')}>Change to Rider</MenuItem>
        <MenuItem onClick={() => handleRoleChange(selectedUser?.id || '', 'DRIVER')}>Change to Driver</MenuItem>
        <MenuItem onClick={() => handleRoleChange(selectedUser?.id || '', 'ADMIN')}>Change to Admin</MenuItem>
      </Menu>
  </Grid>
  );
};

export default UsersManagement;
