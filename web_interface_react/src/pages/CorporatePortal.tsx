import { useState } from 'react';
import {
  Building,
  Users,
  TrendingUp,
  Calendar,
  FileText,
  Download,
  Upload,
  Search,
  CheckCircle,
  Clock,
  DollarSign,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/// BMAD Phase 5: Implement
/// Corporate portal for business accounts and fleet management
/// BMAD Principle: Enterprise-focused UI increases B2B adoption
export const CorporatePortal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'vehicles' | 'billing' | 'settings'>('dashboard');
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'year'>('month');

  const corporateTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp /> },
    { id: 'employees', label: 'Employees', icon: <Users /> },
    { id: 'vehicles', label: 'Vehicles', icon: <Building /> },
    { id: 'billing', label: 'Billing', icon: <DollarSign /> },
    { id: 'settings', label: 'Settings', icon: <Calendar /> },
  ];

  const stats = {
    totalRides: 1250,
    activeEmployees: 45,
    vehicles: 32,
    monthlySpending: 15420.50,
    savings: 3250.00,
    avgPerRide: 12.34,
  };

  const recentActivity = [
    { type: 'booking', user: 'John Smith', amount: '$24.50', time: '2 hours ago' },
    { type: 'employee', user: 'New employee added', time: '1 day ago' },
    { type: 'invoice', user: 'Invoice #1234', amount: '$1,250.00', time: '2 days ago' },
    { type: 'vehicle', user: 'Vehicle registered', time: '3 days ago' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Corporate Portal</h1>
                <p className="text-sm text-gray-600">Tripo04OS Business Solutions</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg text-sm font-medium">
                <Download className="w-4 h-4 mr-2" />
                Download Reports
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                Add Funds
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Rides</span>
              <span className="text-2xl font-bold text-gray-900">{stats.totalRides.toLocaleString()}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Active Employees</span>
              <span className="text-2xl font-bold text-gray-900">{stats.activeEmployees}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Vehicles</span>
              <span className="text-2xl font-bold text-gray-900">{stats.vehicles}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Monthly Spending</span>
              <span className="text-2xl font-bold text-gray-900">${stats.monthlySpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Spending and Savings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-6 w-6" />
              <div>
                <p className="text-sm text-blue-100">Monthly Spending</p>
                <p className="text-3xl font-bold">${stats.monthlySpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-6 w-6" />
              <div>
                <p className="text-sm text-green-100">Total Savings</p>
                <p className="text-3xl font-bold">${stats.savings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              {corporateTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Overview</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Average Per Ride</p>
                    <p className="text-2xl font-bold text-gray-900">${stats.avgPerRide.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">This Week</p>
                    <p className="text-2xl font-bold text-blue-600">312 rides</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Cost Savings</p>
                    <p className="text-2xl font-bold text-green-600">21%</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mb-6">
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </button>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-700">{activity.user}</span>
                      <span className="text-sm text-gray-500">{activity.time}</span>
                    </div>
                    {activity.amount && (
                      <span className="font-semibold text-gray-900">{activity.amount}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Employee Management</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                  <Users className="w-4 h-4 mr-2" />
                  Add Employee
                </button>
              </div>
              <p className="text-gray-600 mb-4">Manage your team members and their access levels</p>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-center text-gray-500">Employee management features coming soon</p>
              </div>
            </div>
          )}

          {/* Vehicles Tab */}
          {activeTab === 'vehicles' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Vehicle Fleet</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                  <Building className="w-4 h-4 mr-2" />
                  Add Vehicle
                </button>
              </div>
              <p className="text-gray-600 mb-4">Track and manage your company vehicles</p>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-center text-gray-500">Vehicle fleet management coming soon</p>
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Billing & Invoices</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-center text-gray-500">Billing and invoice management coming soon</p>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Account Settings</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    defaultValue="Acme Corp"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Billing Email</label>
                  <input
                    type="email"
                    defaultValue="billing@acme.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 w-full">
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Support Card */}
        <div className="bg-blue-50 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Need Help with Corporate Account?</h3>
              <p className="text-gray-600 text-sm mb-3">
                Our dedicated support team is available to help you with fleet management, billing inquiries, and custom solutions.
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 inline-flex items-center"
              >
                Contact Support
                <Clock className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
