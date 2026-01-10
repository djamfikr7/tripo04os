import { useState } from 'react';
import {
  Users,
  BarChart3,
  PieChart,
  TrendingUp,
  DollarSign,
  Activity,
  MapPin,
  Shield,
  Clock,
  Zap,
  ArrowRight,
  LogOut,
  Menu,
  Bell,
  Settings,
  X,
  Check,
  AlertTriangle,
  Download,
} from 'lucide-react';

/// BMAD Phase 5: Implement
/// Sidebar navigation component for admin dashboard
/// BMAD Principle: Clear navigation reduces admin cognitive load
export default function Sidebar({ activeRoute }: { activeRoute: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('all');

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'users',
      label: 'Users',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'drivers',
      label: 'Drivers',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      id: 'trips',
      label: 'Trips',
      icon: <Activity className="w-5 h-5" />,
    },
    {
      id: 'earnings',
      label: 'Earnings',
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <PieChart className="w-5 h-5" />,
    },
    {
      id: 'locations',
      label: 'Locations',
      icon: <MapPin className="w-5 h-5" />,
    },
    {
      id: 'safety',
      label: 'Safety',
      icon: <Shield className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const serviceTypes = [
    { id: 'all', label: 'All Services' },
    { id: 'ride', label: 'Ride' },
    { id: 'moto', label: 'Moto' },
    { id: 'food', label: 'Food' },
    { id: 'grocery', label: 'Grocery' },
    { id: 'goods', label: 'Goods' },
    { id: 'truck', label: 'Truck' },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 z-50 transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-800">Tripo04OS</h1>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Service Filter - Only show when dashboard is active */}
        {activeRoute === 'dashboard' && (
          <div className="mb-4">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value as string)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {serviceTypes.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeRoute === item.id;
          return (
            <a
              key={item.id}
              href={`/${item.id}${selectedService !== 'all' ? `?service=${selectedService}` : ''}`}
              className={`flex items-center px-6 py-3 transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-300'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className={`ml-3 font-medium text-sm whitespace-nowrap transition-all duration-300 ${
                isOpen ? 'opacity-0 hidden' : 'opacity-100'
              }`}>
                {item.label}
              </span>
            </a>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            AD
          </div>
          <div className="ml-3 flex-1">
            <div className="text-sm font-semibold text-gray-800">Admin User</div>
            <div className="text-xs text-gray-500">admin@tripo04os.com</div>
          </div>
          <button
            onClick={() => {/* Handle logout */}}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
