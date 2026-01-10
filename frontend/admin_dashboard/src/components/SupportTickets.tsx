import { Grid, Paper, Typography, Button, Chip, Box, Dialog, DialogTitle, DialogContent, DialogContentText, TextField, DialogActions, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import {
  Support,
  Refresh,
  CheckCircle,
  PriorityHigh,
  Add,
  Search,
  FilterList,
  Person,
  Schedule,
  Close,
  ArrowForward
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination } from '@mui/material';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  category: 'PAYMENT' | 'BOOKING' | 'ACCOUNT' | 'SAFETY' | 'DRIVER' | 'RIDER' | 'TECHNICAL' | 'OTHER';
  userId: string;
  userName: string;
  orderId?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface TicketFilters {
  status: string;
  priority: string;
  category: string;
  searchQuery: string;
}

interface TicketStats {
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  highPriorityTickets: number;
  averageResolutionTime: number;
}

const SupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filter, setFilter] = useState<TicketFilters>({
    status: '',
    priority: '',
    category: '',
    searchQuery: '',
  });
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'MEDIUM',
    category: 'OTHER',
    userId: '',
  });

  const mockTickets: SupportTicket[] = [
    {
      id: 'TKT-001',
      subject: 'Payment gateway error',
      description: 'User unable to complete payment for order ORD-1234',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      category: 'PAYMENT',
      userId: 'U-1001',
      userName: 'John Doe',
      orderId: 'ORD-1234',
      assignedTo: 'Support Agent 1',
      createdAt: '2024-01-20T10:30:00Z',
      updatedAt: '2024-01-20T11:00:00Z',
    },
    {
      id: 'TKT-002',
      subject: 'Driver not showing up',
      description: 'Rider has been waiting for 20 minutes',
      priority: 'URGENT',
      status: 'OPEN',
      category: 'SAFETY',
      userId: 'U-1002',
      userName: 'Alice Johnson',
      orderId: 'ORD-1235',
      createdAt: '2024-01-20T11:15:00Z',
      updatedAt: '2024-01-20T11:15:00Z',
    },
    {
      id: 'TKT-003',
      subject: 'Unable to change profile photo',
      description: 'Error when uploading new profile picture',
      priority: 'LOW',
      status: 'OPEN',
      category: 'TECHNICAL',
      userId: 'U-1003',
      userName: 'Bob Wilson',
      createdAt: '2024-01-20T09:45:00Z',
      updatedAt: '2024-01-20T09:45:00Z',
    },
    {
      id: 'TKT-004',
      subject: 'Refund request for cancelled trip',
      description: 'User wants refund for trip that was cancelled by driver',
      priority: 'HIGH',
      status: 'RESOLVED',
      category: 'BOOKING',
      userId: 'U-1004',
      userName: 'Carol Davis',
      orderId: 'ORD-1230',
      assignedTo: 'Support Agent 2',
      createdAt: '2024-01-19T15:30:00Z',
      updatedAt: '2024-01-19T16:00:00Z',
      resolvedAt: '2024-01-19T16:00:00Z',
    },
    {
      id: 'TKT-005',
      subject: 'Account verification email not received',
      description: 'User signed up but never received verification email',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      category: 'ACCOUNT',
      userId: 'U-1005',
      userName: 'Eve Anderson',
      assignedTo: 'Support Agent 1',
      createdAt: '2024-01-20T08:00:00Z',
      updatedAt: '2024-01-20T09:30:00Z',
    },
  ];

  const mockStats: TicketStats = {
    openTickets: 45,
    inProgressTickets: 23,
    resolvedTickets: 156,
    highPriorityTickets: 12,
    averageResolutionTime: 4.5,
  };

  useEffect(() => {
    setTickets(mockTickets);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setTickets(mockTickets);
      setLoading(false);
    }, 1000);
  };

  const handleCreateTicket = () => {
    const ticket: SupportTicket = {
      id: `TKT-${Math.floor(Math.random() * 10000)}`,
      ...newTicket,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userName: 'New User',
    };
    setTickets([ticket, ...tickets]);
    setDialogOpen(false);
    setNewTicket({
      subject: '',
      description: '',
      priority: 'MEDIUM',
      category: 'OTHER',
      userId: '',
    });
  };

  const handleUpdateStatus = (ticketId: string, status: string) => {
    const updatedTickets = tickets.map(ticket =>
      ticket.id === ticketId ? { ...ticket, status: status as any, updatedAt: new Date().toISOString(), resolvedAt: status === 'RESOLVED' || status === 'CLOSED' ? new Date().toISOString() : undefined } : ticket
    );
    setTickets(updatedTickets);
  };

  const handleAssignTicket = (ticketId: string, assignee: string) => {
    const updatedTickets = tickets.map(ticket =>
      ticket.id === ticketId ? { ...ticket, assignedTo: assignee, updatedAt: new Date().toISOString() } : ticket
    );
    setTickets(updatedTickets);
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseTicketDialog = () => {
    setSelectedTicket(null);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ ...filter, searchQuery: event.target.value });
    setPage(1);
  };

  const handleFilterChange = (field: keyof TicketFilters) => (event: React.ChangeEvent<{ value: string }>) => {
    setFilter({ ...filter, [field]: event.target.value as string });
    setPage(1);
  };

  const clearFilters = () => {
    setFilter({ status: '', priority: '', category: '', searchQuery: '' });
    setPage(1);
  };

  const getFilteredTickets = () => {
    return tickets.filter(ticket => {
      if (filter.status && ticket.status !== filter.status) return false;
      if (filter.priority && ticket.priority !== filter.priority) return false;
      if (filter.category && ticket.category !== filter.category) return false;
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        return (
          ticket.subject.toLowerCase().includes(query) ||
          ticket.description.toLowerCase().includes(query) ||
          ticket.userName.toLowerCase().includes(query) ||
          ticket.id.toLowerCase().includes(query)
        );
      }
      return true;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'info';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'error';
      case 'URGENT':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'error';
      case 'IN_PROGRESS':
        return 'warning';
      case 'RESOLVED':
        return 'success';
      case 'CLOSED':
        return 'default';
      default:
        return 'default';
    }
  };

  const filteredTickets = getFilteredTickets();
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  return (
    <Grid container spacing={3}>
      {/* Statistics Cards */}
      <Grid item xs={12} sm={6} md={2.4}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
              <Support sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
              <Typography variant="subtitle2" gutterBottom align="center">
                Open
              </Typography>
              <Typography variant="h5" color="text.secondary">
                {mockStats.openTickets}
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
              <Schedule sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="subtitle2" gutterBottom align="center">
                In Progress
              </Typography>
              <Typography variant="h5" color="text.secondary">
                {mockStats.inProgressTickets}
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
              <CheckCircle sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="subtitle2" gutterBottom align="center">
                Resolved
              </Typography>
              <Typography variant="h5" color="text.secondary">
                {mockStats.resolvedTickets}
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
              <PriorityHigh sx={{ fontSize: 32, color: 'error.main', mb: 1 }} />
              <Typography variant="subtitle2" gutterBottom align="center">
                High Priority
              </Typography>
              <Typography variant="h5" color="text.secondary">
                {mockStats.highPriorityTickets}
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
              <ArrowForward sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="subtitle2" gutterBottom align="center">
                Avg Resolution
              </Typography>
              <Typography variant="h5" color="text.secondary">
                {mockStats.averageResolutionTime}h
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Grid>

      {/* Support Tickets Table */}
      <Grid item xs={12}>
        <Paper>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                <Grid item>
                  <Typography variant="h6">Support Tickets</Typography>
                </Grid>
                <Grid item>
                  <Button
                    variant="outlined"
                    startIcon={<FilterList />}
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleRefresh}
                    disabled={loading}
                    sx={{ ml: 1 }}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setDialogOpen(true)}
                    sx={{ ml: 1 }}
                  >
                    Create Ticket
                  </Button>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search tickets..."
                    value={filter.searchQuery}
                    onChange={handleSearch}
                    InputProps={{
                      startAdornment: <Search position="start" />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2.67}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filter.status}
                      onChange={handleFilterChange('status')}
                      label="Status"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="OPEN">Open</MenuItem>
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="RESOLVED">Resolved</MenuItem>
                      <MenuItem value="CLOSED">Closed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2.67}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={filter.priority}
                      onChange={handleFilterChange('priority')}
                      label="Priority"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                      <MenuItem value="URGENT">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2.66}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={filter.category}
                      onChange={handleFilterChange('category')}
                      label="Category"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="PAYMENT">Payment</MenuItem>
                      <MenuItem value="BOOKING">Booking</MenuItem>
                      <MenuItem value="ACCOUNT">Account</MenuItem>
                      <MenuItem value="SAFETY">Safety</MenuItem>
                      <MenuItem value="DRIVER">Driver</MenuItem>
                      <MenuItem value="RIDER">Rider</MenuItem>
                      <MenuItem value="TECHNICAL">Technical</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TableContainer sx={{ mt: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ticket ID</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Assigned To</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTickets.slice(startIndex, endIndex).map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>
                          <Button color="primary" size="small" onClick={() => handleViewTicket(ticket)}>
                            {ticket.id}
                          </Button>
                        </TableCell>
                        <TableCell>{ticket.subject}</TableCell>
                        <TableCell>{ticket.category}</TableCell>
                        <TableCell>
                          <Chip
                            label={ticket.priority}
                            size="small"
                            color={getPriorityColor(ticket.priority) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={ticket.status.replace(/_/g, ' ')}
                            size="small"
                            color={getStatusColor(ticket.status) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Person fontSize="small" />
                            {ticket.userName}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {ticket.assignedTo ? (
                            <Chip label={ticket.assignedTo} size="small" />
                          ) : (
                            <Chip label="Unassigned" size="small" color="default" />
                          )}
                        </TableCell>
                        <TableCell>{new Date(ticket.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined" onClick={() => handleViewTicket(ticket)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                component="div"
                count={filteredTickets.length}
                rowsPerPage={rowsPerPage}
                page={page - 1}
                onPageChange={(_, newPage) => setPage(newPage + 1)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(1);
                }}
              />
            </CardContent>
          </Card>
        </Paper>
      </Grid>

      {/* Create Ticket Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Support Ticket</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Create a new support ticket for a user issue.
          </DialogContentText>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                  label="Priority"
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                  <MenuItem value="URGENT">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as any })}
                  label="Category"
                >
                  <MenuItem value="PAYMENT">Payment</MenuItem>
                  <MenuItem value="BOOKING">Booking</MenuItem>
                  <MenuItem value="ACCOUNT">Account</MenuItem>
                  <MenuItem value="SAFETY">Safety</MenuItem>
                  <MenuItem value="DRIVER">Driver</MenuItem>
                  <MenuItem value="RIDER">Rider</MenuItem>
                  <MenuItem value="TECHNICAL">Technical</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="User ID"
                value={newTicket.userId}
                onChange={(e) => setNewTicket({ ...newTicket, userId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={4}
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTicket}>
            Create Ticket
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Ticket Dialog */}
      <Dialog open={!!selectedTicket} onClose={handleCloseTicketDialog} maxWidth="md" fullWidth>
        <DialogTitle>Ticket Details - {selectedTicket?.id}</DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Subject
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedTicket.subject}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedTicket.category}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Priority
                </Typography>
                <Chip label={selectedTicket.priority} color={getPriorityColor(selectedTicket.priority) as any} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip label={selectedTicket.status} color={getStatusColor(selectedTicket.status) as any} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedTicket.description}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  User
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedTicket.userName} ({selectedTicket.userId})
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Order ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedTicket.orderId || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Assigned To
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedTicket.assignedTo || 'Unassigned'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(selectedTicket.createdAt).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTicketDialog}>Close</Button>
          {selectedTicket && selectedTicket.status === 'OPEN' && (
            <Button
              variant="contained"
              onClick={() => handleUpdateStatus(selectedTicket.id, 'IN_PROGRESS')}
            >
              Mark In Progress
            </Button>
          )}
          {selectedTicket && (selectedTicket.status === 'OPEN' || selectedTicket.status === 'IN_PROGRESS') && (
            <Button
              variant="contained"
              color="success"
              onClick={() => handleUpdateStatus(selectedTicket.id, 'RESOLVED')}
            >
              Mark Resolved
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default SupportTickets;
