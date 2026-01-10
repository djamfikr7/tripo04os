import { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit3,
  Trash2,
  Shield,
  Clock,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
} from 'lucide-react';

/// BMAD Phase 5: Implement
/// Users management page with search, filter, and CRUD operations
/// BMAD Principle: Efficient user management reduces support tickets
export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const mockUsers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 234 567 8900',
      role: 'rider',
      status: 'active',
      rating: 4.8,
      totalTrips: 125,
      totalSpent: 1567.50,
      createdAt: '2024-01-15',
      lastActive: '2024-01-09 10:30 AM',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1 234 567 8901',
      role: 'rider',
      status: 'active',
      rating: 4.5,
      totalTrips: 89,
      totalSpent: 923.25,
      createdAt: '2024-01-12',
      lastActive: '2024-01-08 3:45 PM',
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      phone: '+1 234 567 8902',
      role: 'driver',
      status: 'active',
      rating: 4.9,
      totalTrips: 1567,
      totalEarnings: 34567.89,
      createdAt: '2024-01-10',
      lastActive: '2024-01-09 2:15 PM',
    },
    {
      id: 4,
      name: 'Alice Williams',
      email: 'alice.williams@example.com',
      phone: '+1 234 567 8903',
      role: 'driver',
      status: 'inactive',
      rating: 4.7,
      totalTrips: 2345,
      totalEarnings: 56789.12,
      createdAt: '2024-01-08',
      lastActive: '2024-01-05 11:20 AM',
    },
  ];

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-sm text-gray-500">Manage platform users and accounts</p>
        </div>
        <button
          onClick={() => {/* Handle add user */}}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as string)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="text-sm font-medium text-gray-700 mb-2">Actions</label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {/* Handle export */}}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
              {selectedUsers.length > 0 && (
                <button
                  onClick={() => {/* Handle bulk actions */}}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input type="checkbox" className="rounded" checked={selectedUsers.length === filteredUsers.length} readOnly />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Trips</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Earnings/Spent</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Active</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSelectedUsers(checked
                          ? [...selectedUsers, user.id]
                          : selectedUsers.filter((id) => id !== user.id));
                      }}
                      className="rounded w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        <span className="text-xs font-bold text-gray-600">{user.name.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-gray-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'rider' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.status === 'active' ? 'bg-green-100 text-green-700' :
                      user.status === 'inactive' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="font-semibold text-gray-800">{user.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.totalTrips}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {user.role === 'driver' ? (
                      <span className="font-semibold text-green-600">
                        ${user.totalEarnings ? user.totalEarnings.toFixed(2) : '0.00'}
                      </span>
                    ) : (
                      <span className="font-semibold text-red-600">
                        -${user.totalSpent ? user.totalSpent.toFixed(2) : '0.00'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{user.createdAt}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{user.lastActive}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {/* Handle view */}}
                        className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => {/* Handle edit */}}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => {/* Handle suspend */}}
                        className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
                      >
                        <Shield className="w-4 h-4 text-yellow-600" />
                      </button>
                      <button
                        onClick={() => {/* Handle delete */}}
                        className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">1-{filteredUsers.length}</span> of{' '}
            <span className="font-semibold">{filteredUsers.length}</span> users
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex space-x-1">
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(10, p + 1))}
              disabled={currentPage === 10}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
