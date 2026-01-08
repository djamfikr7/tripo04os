import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  TextField,
  Button,
  Avatar,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Rating,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Edit,
  Save,
  CreditCard,
  Security,
  Notifications,
  Language,
  Help,
  Logout,
  ArrowForward,
  Visibility,
  VisibilityOff,
  Delete,
  History,
  Settings,
} from '@mui/icons-material';

/// BMAD Phase 5: Implement
/// User Web Interface - Profile Management for Tripo04OS
/// BMAD Principle: Maximize user engagement with comprehensive profile management
const ProfileManagement: React.FC = () => {
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);

  // BMAD Principle: User profile data for comprehensive management
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@email.com',
    phone: '+1 234 567 8901',
    avatar: 'JS',
    dateOfBirth: '1990-05-15',
    gender: 'Male',
    location: 'New York, NY',
    address: '123 Main St, Apt 4B, New York, NY 10001',
    bio: 'Frequent traveler, love exploring new places.',
  });

  // BMAD Principle: User settings for personalized experience
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    locationServices: true,
    darkMode: false,
    language: 'English',
    currency: 'USD',
  });

  // BMAD Principle: Payment methods for seamless transactions
  const paymentMethods = [
    { id: 1, type: 'Visa', last4: '4242', expiry: '12/25', isDefault: true },
    { id: 2, type: 'Mastercard', last4: '5555', expiry: '08/24', isDefault: false },
    { id: 3, type: 'PayPal', email: 'john.smith@email.com', isDefault: false },
  ];

  // BMAD Principle: User statistics for engagement
  const userStats = {
    totalRides: 156,
    totalSpent: 2345.67,
    avgRating: 4.8,
    memberSince: '2023-01-15',
    loyaltyPoints: 2340,
    tier: 'Gold',
  };

  const handleEditModeToggle = () => {
    setEditMode(!editMode);
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleSaveProfile = () => {
    // BMAD Principle: Save profile changes with validation
    setEditMode(false);
    alert('Profile saved successfully!');
  };

  const handlePasswordDialogOpen = () => {
    setPasswordDialogOpen(true);
  };

  const handlePasswordDialogClose = () => {
    setPasswordDialogOpen(false);
  };

  const handleLogoutDialogOpen = () => {
    setLogoutDialogOpen(true);
  };

  const handleLogoutDialogClose = () => {
    setLogoutDialogOpen(false);
  };

  const handleLogout = () => {
    // BMAD Principle: Logout user with confirmation
    setLogoutDialogOpen(false);
    alert('Logged out successfully!');
  };

  const handleDeleteAccountDialogOpen = () => {
    setDeleteAccountDialogOpen(true);
  };

  const handleDeleteAccountDialogClose = () => {
    setDeleteAccountDialogOpen(false);
  };

  const handleDeleteAccount = () => {
    // BMAD Principle: Delete account with confirmation
    setDeleteAccountDialogOpen(false);
    alert('Account deletion request submitted!');
  };

  const handleSettingChange = (setting: string, value: boolean | string) => {
    setSettings({ ...settings, [setting]: value });
  };

  const handleAddPaymentMethod = () => {
    // BMAD Principle: Add new payment method
    alert('Add payment method dialog');
  };

  const handleSetDefaultPaymentMethod = (id: number) => {
    // BMAD Principle: Set default payment method
    alert(`Set payment method ${id} as default`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* BMAD Principle: Clear header */}
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
        Profile Management
      </Typography>

      <Grid container spacing={3}>
        {/* BMAD Principle: Profile overview card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ width: 100, height: 100, bgcolor: '#0066FF', margin: '0 auto', mb: 2, fontSize: 40 }}>
                {profile.avatar}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                {profile.firstName} {profile.lastName}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                {profile.email}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 2 }}>
                <Chip
                  label={userStats.tier}
                  color="primary"
                  icon={<Star />}
                />
                <Chip
                  label={`${userStats.loyaltyPoints} points`}
                  color="secondary"
                />
              </Box>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={handleEditModeToggle}
                sx={{ bgcolor: '#0066FF' }}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </Button>
            </CardContent>
          </Card>

          {/* BMAD Principle: User statistics card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Statistics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Total Rides
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {userStats.totalRides}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Total Spent
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    ${userStats.totalSpent.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Average Rating
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#FFC107' }}>
                    {userStats.avgRating.toFixed(1)} ★
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Member Since
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {userStats.memberSince}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* BMAD Principle: Profile details card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Personal Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profile.firstName}
                    onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profile.lastName}
                    onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    disabled={!editMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={profile.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                    disabled={!editMode}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Gender"
                    value={profile.gender}
                    onChange={(e) => handleProfileChange('gender', e.target.value)}
                    disabled={!editMode}
                    select
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                    <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={profile.location}
                    onChange={(e) => handleProfileChange('location', e.target.value)}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={profile.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                    disabled={!editMode}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    value={profile.bio}
                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                    disabled={!editMode}
                    multiline
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </Grid>
              </Grid>
              {editMode && (
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleSaveProfile}
                    sx={{ bgcolor: '#0066FF' }}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleEditModeToggle}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* BMAD Principle: Payment methods card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Payment Methods
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<CreditCard />}
                  onClick={handleAddPaymentMethod}
                >
                  Add New
                </Button>
              </Box>
              <List>
                {paymentMethods.map((method) => (
                  <ListItem key={method.id} divider>
                    <ListItemIcon>
                      <CreditCard />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${method.type} ${method.last4 ? `•••• ${method.last4}` : method.email}`}
                      secondary={method.expiry ? `Expires ${method.expiry}` : method.email}
                    />
                    {method.isDefault && (
                      <Chip label="Default" color="primary" size="small" sx={{ mr: 2 }} />
                    )}
                    <ListItemSecondaryAction>
                      {!method.isDefault && (
                        <Button
                          size="small"
                          onClick={() => handleSetDefaultPaymentMethod(method.id)}
                        >
                          Set Default
                        </Button>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* BMAD Principle: Settings card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Settings
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText primary="Email Notifications" secondary="Receive email updates about your rides" />
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText primary="Push Notifications" secondary="Receive push notifications on your device" />
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Notifications />
                  </ListItemIcon>
                  <ListItemText primary="SMS Notifications" secondary="Receive SMS updates about your rides" />
                  <Switch
                    checked={settings.smsNotifications}
                    onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LocationOn />
                  </ListItemIcon>
                  <ListItemText primary="Location Services" secondary="Allow app to access your location" />
                  <Switch
                    checked={settings.locationServices}
                    onChange={(e) => handleSettingChange('locationServices', e.target.checked)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Settings />
                  </ListItemIcon>
                  <ListItemText primary="Dark Mode" secondary="Use dark theme" />
                  <Switch
                    checked={settings.darkMode}
                    onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* BMAD Principle: Quick actions card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Quick Actions
              </Typography>
              <List>
                <ListItem button>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText primary="Change Password" secondary="Update your password for security" />
                  <ArrowForward />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <History />
                  </ListItemIcon>
                  <ListItemText primary="Ride History" secondary="View your past rides" />
                  <ArrowForward />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <Help />
                  </ListItemIcon>
                  <ListItemText primary="Help & Support" secondary="Get help with any issues" />
                  <ArrowForward />
                </ListItem>
                <ListItem button onClick={handleLogoutDialogOpen}>
                  <ListItemIcon>
                    <Logout />
                  </ListItemIcon>
                  <ListItemText primary="Logout" secondary="Sign out of your account" />
                  <ArrowForward />
                </ListItem>
                <ListItem button onClick={handleDeleteAccountDialogOpen} sx={{ color: 'error.main' }}>
                  <ListItemIcon>
                    <Delete color="error" />
                  </ListItemIcon>
                  <ListItemText primary="Delete Account" secondary="Permanently delete your account" sx={{ color: 'error.main' }} />
                  <ArrowForward color="error" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* BMAD Principle: Logout confirmation dialog */}
      <Dialog open={logoutDialogOpen} onClose={handleLogoutDialogClose}>
        <DialogTitle>Logout</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to logout?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutDialogClose}>Cancel</Button>
          <Button onClick={handleLogout} color="error" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      {/* BMAD Principle: Delete account confirmation dialog */}
      <Dialog open={deleteAccountDialogOpen} onClose={handleDeleteAccountDialogClose}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete your account? This action cannot be undone.
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            All your data, including ride history, payment methods, and personal information will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteAccountDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained">
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfileManagement;
