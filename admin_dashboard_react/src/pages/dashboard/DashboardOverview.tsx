import { useState, useEffect } from 'react';
import {
  Users,
  Activity,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Download,
  Eye,
  MapPin,
  Shield,
  AlertTriangle,
} from 'lucide-react';

/// BMAD Phase 5: Implement
/// Dashboard overview with key metrics and charts
/// BMAD Principle: Data visualization improves decision making
export default function DashboardOverview({ serviceFilter = 'all' }: { serviceFilter?: string }) {
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - In production, fetch from API
  const metrics = {
    totalUsers: 125678,
    activeUsers: 8567,
    totalDrivers: 45123,
    onlineDrivers: 12456,
    totalTrips: 892456,
    completedTrips: 789234,
    cancelledTrips: 10322,
    totalEarnings: 1256789.50,
    driverEarnings: 892345.00,
    avgTripDuration: '18.5 min',
    avgFare: 15.75,
    acceptanceRate: 87.5,
    completionRate: 94.2,
  };

  const tripsByService = [
    { service: 'Ride', count: 456789, percentage: 51.2, color: 'bg-blue-500' },
    { service: 'Moto', count: 234567, percentage: 26.3, color: 'bg-orange-500' },
    { service: 'Food', count: 98456, percentage: 11.0, color: 'bg-yellow-500' },
    { service: 'Grocery', count: 67890, percentage: 7.6, color: 'bg-green-500' },
    { service: 'Goods', count: 28934, percentage: 3.2, color: 'bg-purple-500' },
    { service: 'Truck', count: 37826, percentage: 4.2, color: 'bg-red-500' },
  ];

  const recentActivity = [
    { id: 1, type: 'trip', message: 'Trip #12345 completed', time: '2 min ago', status: 'success' },
    { id: 2, type: 'driver', message: 'New driver registered', time: '15 min ago', status: 'info' },
    { id: 3, type: 'alert', message: 'High surge pricing detected', time: '1 hour ago', status: 'warning' },
    { id: 4, type: 'safety', message: 'Emergency incident #456', time: '2 hours ago', status: 'danger' },
    { id: 5, type: 'earning', message: 'Weekly earnings target reached', time: '5 hours ago', status: 'success' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">Real-time metrics and analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as string)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={() => {/* Handle refresh */}}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Total Users</div>
              <div className="text-3xl font-bold text-gray-800">{metrics.totalUsers.toLocaleString()}</div>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Active Users (24h)</div>
              <div className="text-3xl font-bold text-gray-800">{metrics.activeUsers.toLocaleString()}</div>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Drivers */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Total Drivers</div>
              <div className="text-3xl font-bold text-gray-800">{metrics.totalDrivers.toLocaleString()}</div>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Online Drivers */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Online Now</div>
              <div className="text-3xl font-bold text-green-600">{metrics.onlineDrivers.toLocaleString()}</div>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Trips by Service Chart */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Trips by Service</h2>
          <button
            onClick={() => {/* Handle export */}}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {tripsByService.map((item) => (
            <div key={item.service} className={`${item.color} rounded-lg p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-white font-medium">{item.service}</div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4 text-white" />
                  <div className="text-lg font-bold text-white">{item.percentage}%</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{item.count.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Earnings */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Total Earnings</h2>
            <div className="text-green-600 font-semibold text-sm flex items-center">
              <TrendingUp className="w-4 h-4" />
              <span>+15.2%</span>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600">${metrics.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="text-sm text-gray-500 mt-2">vs previous {timeRange}</div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Driver Earnings</div>
              <div className="text-lg font-bold text-gray-800">${metrics.driverEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Platform Revenue</div>
              <div className="text-lg font-bold text-gray-800">${(metrics.totalEarnings * 0.3).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>

        {/* Trip Statistics */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Trip Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm text-gray-500">Avg. Duration</div>
                <div className="text-lg font-bold text-gray-800">{metrics.avgTripDuration}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm text-gray-500">Avg. Fare</div>
                <div className="text-lg font-bold text-gray-800">${metrics.avgFare.toFixed(2)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm text-gray-500">Acceptance Rate</div>
                <div className="text-lg font-bold text-green-600">{metrics.acceptanceRate}%</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-sm text-gray-500">Completion Rate</div>
                <div className="text-lg font-bold text-purple-600">{metrics.completionRate}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
          <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          {recentActivity.map((activity) => {
            const getStatusIcon = () => {
              switch (activity.status) {
                case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
                case 'info': return <Activity className="w-5 h-5 text-blue-600" />;
                case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
                case 'danger': return <XCircle className="w-5 h-5 text-red-600" />;
                default: return <Activity className="w-5 h-5 text-gray-600" />;
              }
            };

            return (
              <div key={activity.id} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex-shrink-0 mt-1">{getStatusIcon()}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{activity.message}</div>
                  <div className="text-xs text-gray-500">{activity.time}</div>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Eye className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
