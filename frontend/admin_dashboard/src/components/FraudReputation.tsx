import { Grid, Paper, Typography, Button, Chip, Box } from '@mui/material';
import {
  Security,
  Warning,
  Refresh,
  Person,
  Star,
  Assessment,
  Report,
  VerifiedUser,
  Shield,
  TrendingDown,
  DirectionsCar
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

interface FraudAlert {
  id: string;
  userId: string;
  userName: string;
  fraudType: 'RATING_MANIPULATION' | 'FAKE_TRIPS' | 'ACCOUNT_TAKEOVER' | 'PAYMENT_FRAUD' | 'BOT_ACTIVITY' | 'REVIEW_MANIPULATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  createdAt: string;
  expiresAt: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  description: string;
}

interface ReputationProfile {
  id: string;
  userId: string;
  userName: string;
  overallRating: number;
  totalRatings: number;
  reliabilityScore: number;
  punctualityScore: number;
  communicationScore: number;
  vehicleScore: number;
  behaviorScore: number;
  trustScore: number;
  role: 'RIDER' | 'DRIVER';
}

interface FraudStats {
  highRiskUsers: number;
  mediumRiskUsers: number;
  pendingAlerts: number;
  resolvedAlerts: number;
  totalFraudReports: number;
  averageTrustScore: number;
}

const FraudReputation = () => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [profiles, setProfiles] = useState<ReputationProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<FraudStats>({
    highRiskUsers: 0,
    mediumRiskUsers: 0,
    pendingAlerts: 0,
    resolvedAlerts: 0,
    totalFraudReports: 0,
    averageTrustScore: 0,
  });

  const mockAlerts: FraudAlert[] = [
    {
      id: 'FRAUD-001',
      userId: 'U-1001',
      userName: 'John Smith',
      fraudType: 'RATING_MANIPULATION',
      severity: 'HIGH',
      riskScore: 85,
      createdAt: '2024-01-20T10:30:00Z',
      expiresAt: '2024-01-27T10:30:00Z',
      status: 'PENDING',
      description: 'Unusual pattern of 5-star ratings within short time period',
    },
    {
      id: 'FRAUD-002',
      userId: 'U-1002',
      userName: 'Alice Johnson',
      fraudType: 'FAKE_TRIPS',
      severity: 'CRITICAL',
      riskScore: 95,
      createdAt: '2024-01-20T09:15:00Z',
      expiresAt: '2024-01-27T09:15:00Z',
      status: 'INVESTIGATING',
      description: 'Multiple suspicious trips with identical GPS coordinates',
    },
    {
      id: 'FRAUD-003',
      userId: 'U-1003',
      userName: 'Bob Wilson',
      fraudType: 'BOT_ACTIVITY',
      severity: 'MEDIUM',
      riskScore: 65,
      createdAt: '2024-01-20T08:45:00Z',
      expiresAt: '2024-01-27T08:45:00Z',
      status: 'PENDING',
      description: 'Automated order creation pattern detected',
    },
  ];

  const mockProfiles: ReputationProfile[] = [
    {
      id: 'REP-001',
      userId: 'U-1001',
      userName: 'John Smith',
      overallRating: 4.2,
      totalRatings: 156,
      reliabilityScore: 85,
      punctualityScore: 90,
      communicationScore: 88,
      vehicleScore: 82,
      behaviorScore: 87,
      trustScore: 86,
      role: 'DRIVER',
    },
    {
      id: 'REP-002',
      userId: 'U-1002',
      userName: 'Alice Johnson',
      overallRating: 3.8,
      totalRatings: 89,
      reliabilityScore: 72,
      punctualityScore: 75,
      communicationScore: 80,
      vehicleScore: 78,
      behaviorScore: 70,
      trustScore: 75,
      role: 'DRIVER',
    },
    {
      id: 'REP-003',
      userId: 'U-1004',
      userName: 'Carol Davis',
      overallRating: 4.8,
      totalRatings: 234,
      reliabilityScore: 95,
      punctualityScore: 96,
      communicationScore: 98,
      vehicleScore: 94,
      behaviorScore: 97,
      trustScore: 96,
      role: 'RIDER',
    },
  ];

  const mockStats: FraudStats = {
    highRiskUsers: 45,
    mediumRiskUsers: 123,
    pendingAlerts: 23,
    resolvedAlerts: 156,
    totalFraudReports: 894,
    averageTrustScore: 82.5,
  };

  useEffect(() => {
    setAlerts(mockAlerts);
    setProfiles(mockProfiles);
    setStats(mockStats);
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setAlerts(mockAlerts);
      setProfiles(mockProfiles);
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW':
        return 'info';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'error';
      case 'CRITICAL':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'INVESTIGATING':
        return 'info';
      case 'RESOLVED':
        return 'success';
      case 'DISMISSED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'warning';
    return 'error';
  };

  const pendingAlerts = alerts.filter(a => a.status === 'PENDING');
  const investigatingAlerts = alerts.filter(a => a.status === 'INVESTIGATING');
  const resolvedAlerts = alerts.filter(a => a.status === 'RESOLVED');

  return (
    <Grid container spacing={3}>
      {/* Statistics Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
              <Warning sx={{ fontSize: 40, color: 'error.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                High Risk Users
              </Typography>
              <Typography variant="h4" color="text.secondary">
                {stats.highRiskUsers}
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
              <Security sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Medium Risk Users
              </Typography>
              <Typography variant="h4" color="text.secondary">
                {stats.mediumRiskUsers}
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
              <Report sx={{ fontSize: 40, color: 'info.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Pending Alerts
              </Typography>
              <Typography variant="h4" color="text.secondary">
                {stats.pendingAlerts}
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', height: '100%' }}>
              <Assessment sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Average Trust Score
              </Typography>
              <Typography variant="h4" color="text.secondary">
                {stats.averageTrustScore.toFixed(1)}
              </Typography>
            </Box>
          </CardContent>
        </Paper>
      </Grid>

      {/* Pending Fraud Alerts */}
      <Grid item xs={12}>
        <Paper>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                <Grid item>
                  <Typography variant="h6">Pending Fraud Alerts</Typography>
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
                      <TableCell>Alert ID</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Fraud Type</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Risk Score</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell>Expires At</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>{alert.id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person fontSize="small" />
                            {alert.userName}
                          </Box>
                        </TableCell>
                        <TableCell>{alert.fraudType.replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          <Chip
                            label={alert.severity}
                            size="small"
                            color={getSeverityColor(alert.severity) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${alert.riskScore}%`}
                            size="small"
                            color={alert.riskScore >= 80 ? 'error' : alert.riskScore >= 60 ? 'warning' : 'info'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={alert.status}
                            size="small"
                            color={getStatusColor(alert.status) as any}
                          />
                        </TableCell>
                        <TableCell>{alert.description}</TableCell>
                        <TableCell>{new Date(alert.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{new Date(alert.expiresAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined" color="primary">
                            Investigate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Paper>
      </Grid>

      {/* Investigating Alerts */}
      {investigatingAlerts.length > 0 && (
        <Grid item xs={12}>
          <Paper>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Under Investigation
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Alert ID</TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Fraud Type</TableCell>
                        <TableCell>Risk Score</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {investigatingAlerts.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell>{alert.id}</TableCell>
                          <TableCell>{alert.userName}</TableCell>
                          <TableCell>{alert.fraudType.replace(/_/g, ' ')}</TableCell>
                          <TableCell>{alert.riskScore}%</TableCell>
                          <TableCell>
                            <Chip label={alert.status} size="small" color="info" />
                          </TableCell>
                          <TableCell>{alert.description}</TableCell>
                          <TableCell>
                            <Button size="small" variant="outlined" color="success">
                              Mark Resolved
                            </Button>
                            <Button size="small" variant="outlined" color="default" sx={{ ml: 1 }}>
                              Dismiss
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Paper>
        </Grid>
      )}

      {/* Reputation Profiles */}
      <Grid item xs={12}>
        <Paper>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Reputation Profiles
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Profile ID</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Overall Rating</TableCell>
                      <TableCell>Total Ratings</TableCell>
                      <TableCell>Reliability</TableCell>
                      <TableCell>Punctuality</TableCell>
                      <TableCell>Communication</TableCell>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Behavior</TableCell>
                      <TableCell>Trust Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell>{profile.id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person fontSize="small" />
                            {profile.userName}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={profile.role === 'DRIVER' ? <DirectionsCar /> : <Person />}
                            label={profile.role}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Star fontSize="small" sx={{ color: 'gold' }} />
                            {profile.overallRating.toFixed(1)}
                          </Box>
                        </TableCell>
                        <TableCell>{profile.totalRatings}</TableCell>
                        <TableCell>{profile.reliabilityScore}%</TableCell>
                        <TableCell>{profile.punctualityScore}%</TableCell>
                        <TableCell>{profile.communicationScore}%</TableCell>
                        <TableCell>{profile.vehicleScore}%</TableCell>
                        <TableCell>{profile.behaviorScore}%</TableCell>
                        <TableCell>
                          <Chip
                            label={`${profile.trustScore}%`}
                            size="small"
                            color={getTrustScoreColor(profile.trustScore) as any}
                            icon={profile.trustScore >= 90 ? <VerifiedUser /> : <Shield />}
                          />
                        </TableCell>
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

export default FraudReputation;
