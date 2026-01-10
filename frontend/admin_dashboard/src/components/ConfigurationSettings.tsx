import { Grid, Paper, Typography, Button, Box, TextField, Switch, FormControlLabel, Divider, Card, CardContent, CardActions, Chip, Alert } from '@mui/material';
import {
  Settings,
  Save,
  Refresh,
  Build,
  Security,
  NotificationImportant,
  Language,
  Payment,
  Storage,
  Speed,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useState, useEffect } from 'react';

interface SystemConfig {
  general: {
    maintenanceMode: boolean;
    platformName: string;
    supportEmail: string;
    contactPhone: string;
  };
  pricing: {
    baseFare: number;
    perKmRate: number;
    perMinuteRate: number;
    surgeMultiplier: number;
    surgeEnabled: boolean;
  };
  driver: {
    minimumRating: number;
    autoAcceptTimeout: number;
    maxCancelationsPerDay: number;
  };
  rider: {
    cancelationTimeLimit: number;
    maxCancelationsPerDay: number;
  };
  safety: {
    sosAutoAlertEnabled: boolean;
    rideCheckInterval: number;
    shareTripWithContactsEnabled: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    marketingEmailsEnabled: boolean;
  };
  integrations: {
    stripeEnabled: boolean;
    googleMapsEnabled: boolean;
    twilioEnabled: boolean;
    sendGridEnabled: boolean;
    firebaseEnabled: boolean;
  };
}

interface ServiceStatus {
  name: string;
  url: string;
  status: 'HEALTHY' | 'UNHEALTHY' | 'UNKNOWN';
  lastChecked: string;
}

const ConfigurationSettings = () => {
  const [config, setConfig] = useState<SystemConfig>({
    general: {
      maintenanceMode: false,
      platformName: 'Tripo04OS',
      supportEmail: 'support@tripo04os.com',
      contactPhone: '+1-800-123-4567',
    },
    pricing: {
      baseFare: 2.50,
      perKmRate: 1.20,
      perMinuteRate: 0.30,
      surgeMultiplier: 1.0,
      surgeEnabled: true,
    },
    driver: {
      minimumRating: 4.5,
      autoAcceptTimeout: 15,
      maxCancelationsPerDay: 3,
    },
    rider: {
      cancelationTimeLimit: 2,
      maxCancelationsPerDay: 5,
    },
    safety: {
      sosAutoAlertEnabled: true,
      rideCheckInterval: 10,
      shareTripWithContactsEnabled: true,
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      marketingEmailsEnabled: false,
    },
    integrations: {
      stripeEnabled: false,
      googleMapsEnabled: true,
      twilioEnabled: false,
      sendGridEnabled: true,
      firebaseEnabled: true,
    },
  });

  const [serviceStatus, setServiceStatus] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const mockServiceStatus: ServiceStatus[] = [
    {
      name: 'Identity Service',
      url: 'http://localhost:8000',
      status: 'HEALTHY',
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Order Service',
      url: 'http://localhost:8001',
      status: 'HEALTHY',
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Trip Service',
      url: 'http://localhost:8002',
      status: 'HEALTHY',
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Matching Service',
      url: 'http://localhost:8003',
      status: 'HEALTHY',
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Pricing Service',
      url: 'http://localhost:8004',
      status: 'HEALTHY',
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Location Service',
      url: 'http://localhost:8005',
      status: 'HEALTHY',
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Communication Service',
      url: 'http://localhost:8006',
      status: 'HEALTHY',
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Safety Service',
      url: 'http://localhost:8007',
      status: 'HEALTHY',
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Reputation Service',
      url: 'http://localhost:8009',
      status: 'HEALTHY',
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Fraud Service',
      url: 'http://localhost:8010',
      status: 'HEALTHY',
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Subscription Service',
      url: 'http://localhost:8011',
      status: 'HEALTHY',
      lastChecked: new Date().toISOString(),
    },
    {
      name: 'Analytics Service',
      url: 'http://localhost:8012',
      status: 'HEALTHY',
      lastChecked: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    setServiceStatus(mockServiceStatus);
  }, []);

  const handleRefreshServices = () => {
    setLoading(true);
    setTimeout(() => {
      setServiceStatus(mockServiceStatus);
      setLoading(false);
    }, 1000);
  };

  const handleSaveConfig = () => {
    setLoading(true);
    setTimeout(() => {
      setSaved(true);
      setLoading(false);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  const handleConfigChange = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value,
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'success';
      case 'UNHEALTHY':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle />;
      case 'UNHEALTHY':
        return <Warning />;
      default:
        return <Warning />;
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Success Alert */}
      {saved && (
        <Grid item xs={12}>
          <Alert severity="success" icon={<CheckCircle />}>
            Configuration saved successfully!
          </Alert>
        </Grid>
      )}

      {/* Maintenance Mode Warning */}
      {config.general.maintenanceMode && (
        <Grid item xs={12}>
          <Alert severity="warning" icon={<Warning />}>
            Maintenance mode is currently enabled. New user registrations and bookings are disabled.
          </Alert>
        </Grid>
      )}

      {/* Service Health Status */}
      <Grid item xs={12}>
        <Paper>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Speed />
                  Service Health Status
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleRefreshServices}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Box>
              <Grid container spacing={2}>
                {serviceStatus.map((service) => (
                  <Grid item xs={12} sm={6} md={4} key={service.url}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2">{service.name}</Typography>
                          <Chip
                            icon={getStatusIcon(service.status)}
                            label={service.status}
                            size="small"
                            color={getStatusColor(service.status) as any}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {service.url}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          Last checked: {new Date(service.lastChecked).toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Paper>
      </Grid>

      {/* General Settings */}
      <Grid item xs={12} md={6}>
        <Paper>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Build />
                General Settings
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.general.maintenanceMode}
                      onChange={(e) => handleConfigChange('general', 'maintenanceMode', e.target.checked)}
                      color="warning"
                    />
                  }
                  label="Maintenance Mode"
                />
                <TextField
                  fullWidth
                  label="Platform Name"
                  value={config.general.platformName}
                  onChange={(e) => handleConfigChange('general', 'platformName', e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Support Email"
                  value={config.general.supportEmail}
                  onChange={(e) => handleConfigChange('general', 'supportEmail', e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Contact Phone"
                  value={config.general.contactPhone}
                  onChange={(e) => handleConfigChange('general', 'contactPhone', e.target.value)}
                />
              </Box>
            </CardContent>
          </Card>
        </Paper>
      </Grid>

      {/* Pricing Settings */}
      <Grid item xs={12} md={6}>
        <Paper>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Payment />
                Pricing Settings
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Base Fare ($)"
                  type="number"
                  value={config.pricing.baseFare}
                  onChange={(e) => handleConfigChange('pricing', 'baseFare', parseFloat(e.target.value))}
                />
                <TextField
                  fullWidth
                  label="Per KM Rate ($)"
                  type="number"
                  value={config.pricing.perKmRate}
                  onChange={(e) => handleConfigChange('pricing', 'perKmRate', parseFloat(e.target.value))}
                />
                <TextField
                  fullWidth
                  label="Per Minute Rate ($)"
                  type="number"
                  value={config.pricing.perMinuteRate}
                  onChange={(e) => handleConfigChange('pricing', 'perMinuteRate', parseFloat(e.target.value))}
                />
                <TextField
                  fullWidth
                  label="Surge Multiplier"
                  type="number"
                  step="0.1"
                  value={config.pricing.surgeMultiplier}
                  onChange={(e) => handleConfigChange('pricing', 'surgeMultiplier', parseFloat(e.target.value))}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.pricing.surgeEnabled}
                      onChange={(e) => handleConfigChange('pricing', 'surgeEnabled', e.target.checked)}
                    />
                  }
                  label="Enable Surge Pricing"
                />
              </Box>
            </CardContent>
          </Card>
        </Paper>
      </Grid>

      {/* Driver Settings */}
      <Grid item xs={12} md={6}>
        <Paper>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Storage />
                Driver Settings
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Minimum Driver Rating"
                  type="number"
                  step="0.1"
                  value={config.driver.minimumRating}
                  onChange={(e) => handleConfigChange('driver', 'minimumRating', parseFloat(e.target.value))}
                />
                <TextField
                  fullWidth
                  label="Auto Accept Timeout (seconds)"
                  type="number"
                  value={config.driver.autoAcceptTimeout}
                  onChange={(e) => handleConfigChange('driver', 'autoAcceptTimeout', parseInt(e.target.value))}
                />
                <TextField
                  fullWidth
                  label="Max Cancellations Per Day"
                  type="number"
                  value={config.driver.maxCancelationsPerDay}
                  onChange={(e) => handleConfigChange('driver', 'maxCancelationsPerDay', parseInt(e.target.value))}
                />
              </Box>
            </CardContent>
          </Card>
        </Paper>
      </Grid>

      {/* Rider Settings */}
      <Grid item xs={12} md={6}>
        <Paper>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Storage />
                Rider Settings
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Cancellation Time Limit (minutes)"
                  type="number"
                  value={config.rider.cancelationTimeLimit}
                  onChange={(e) => handleConfigChange('rider', 'cancelationTimeLimit', parseInt(e.target.value))}
                />
                <TextField
                  fullWidth
                  label="Max Cancellations Per Day"
                  type="number"
                  value={config.rider.maxCancelationsPerDay}
                  onChange={(e) => handleConfigChange('rider', 'maxCancelationsPerDay', parseInt(e.target.value))}
                />
              </Box>
            </CardContent>
          </Card>
        </Paper>
      </Grid>

      {/* Safety Settings */}
      <Grid item xs={12} md={6}>
        <Paper>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security />
                Safety Settings
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.safety.sosAutoAlertEnabled}
                      onChange={(e) => handleConfigChange('safety', 'sosAutoAlertEnabled', e.target.checked)}
                    />
                  }
                  label="Enable SOS Auto-Alert"
                />
                <TextField
                  fullWidth
                  label="Ride Check Interval (minutes)"
                  type="number"
                  value={config.safety.rideCheckInterval}
                  onChange={(e) => handleConfigChange('safety', 'rideCheckInterval', parseInt(e.target.value))}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.safety.shareTripWithContactsEnabled}
                      onChange={(e) => handleConfigChange('safety', 'shareTripWithContactsEnabled', e.target.checked)}
                    />
                  }
                  label="Enable Share Trip With Contacts"
                />
              </Box>
            </CardContent>
          </Card>
        </Paper>
      </Grid>

      {/* Notification Settings */}
      <Grid item xs={12} md={6}>
        <Paper>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationImportant />
                Notification Settings
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.notifications.emailEnabled}
                      onChange={(e) => handleConfigChange('notifications', 'emailEnabled', e.target.checked)}
                    />
                  }
                  label="Enable Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.notifications.smsEnabled}
                      onChange={(e) => handleConfigChange('notifications', 'smsEnabled', e.target.checked)}
                    />
                  }
                  label="Enable SMS Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.notifications.pushEnabled}
                      onChange={(e) => handleConfigChange('notifications', 'pushEnabled', e.target.checked)}
                    />
                  }
                  label="Enable Push Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.notifications.marketingEmailsEnabled}
                      onChange={(e) => handleConfigChange('notifications', 'marketingEmailsEnabled', e.target.checked)}
                    />
                  }
                  label="Enable Marketing Emails"
                />
              </Box>
            </CardContent>
          </Card>
        </Paper>
      </Grid>

      {/* Integration Settings */}
      <Grid item xs={12}>
        <Paper>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Language />
                Third-Party Integrations
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1">Stripe</Typography>
                        <Chip
                          label={config.integrations.stripeEnabled ? 'Enabled' : 'Disabled'}
                          color={config.integrations.stripeEnabled ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Payment processing
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1">Google Maps</Typography>
                        <Chip
                          label={config.integrations.googleMapsEnabled ? 'Enabled' : 'Disabled'}
                          color={config.integrations.googleMapsEnabled ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Maps and navigation
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1">Twilio</Typography>
                        <Chip
                          label={config.integrations.twilioEnabled ? 'Enabled' : 'Disabled'}
                          color={config.integrations.twilioEnabled ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        SMS and voice
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1">SendGrid</Typography>
                        <Chip
                          label={config.integrations.sendGridEnabled ? 'Enabled' : 'Disabled'}
                          color={config.integrations.sendGridEnabled ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Email delivery
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle1">Firebase</Typography>
                        <Chip
                          label={config.integrations.firebaseEnabled ? 'Enabled' : 'Disabled'}
                          color={config.integrations.firebaseEnabled ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Push notifications
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Paper>
      </Grid>

      {/* Save Button */}
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Save />}
            onClick={handleSaveConfig}
            disabled={loading}
          >
            Save Configuration
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};

export default ConfigurationSettings;
