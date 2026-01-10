import { useState, useEffect } from 'react';
import { MapPin, Clock, DollarSign, Star } from 'lucide-react';

interface Ride {
  id: string;
  serviceType: string;
  vehicleType: string;
  pickupLocation: string;
  dropoffLocation: string;
  date: string;
  time: string;
  fare: number;
  status: 'completed' | 'cancelled' | 'scheduled';
  rating?: number;
}

export default function RideHistory() {
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'fare' | 'rating'>('date');

  const rides: Ride[] = [
    {
      id: '1',
      serviceType: 'ride',
      vehicleType: 'sedan',
      pickupLocation: '123 Main St, New York, NY',
      dropoffLocation: '456 Broadway, New York, NY',
      date: '2024-01-15',
      time: '10:30 AM',
      fare: 25.50,
      status: 'completed',
      rating: 5,
    },
    {
      id: '2',
      serviceType: 'moto',
      vehicleType: 'moto',
      pickupLocation: 'Current Location',
      dropoffLocation: 'Work',
      date: '2024-01-14',
      time: '08:15 AM',
      fare: 12.00,
      status: 'completed',
      rating: 4,
    },
    {
      id: '3',
      serviceType: 'food',
      vehicleType: '',
      pickupLocation: 'Home',
      dropoffLocation: 'Shopping Mall',
      date: '2024-01-12',
      time: '02:45 PM',
      fare: 15.75,
      status: 'completed',
    },
    {
      id: '4',
      serviceType: 'grocery',
      vehicleType: '',
      pickupLocation: 'Current Location',
      dropoffLocation: 'Supermarket',
      date: '2024-01-10',
      time: '03:30 PM',
      fare: 8.50,
      status: 'completed',
    },
    {
      id: '5',
      serviceType: 'goods',
      vehicleType: 'van',
      pickupLocation: 'Warehouse',
      dropoffLocation: 'Business Center',
      date: '2024-01-09',
      time: '11:20 AM',
      fare: 45.00,
      status: 'completed',
    },
    {
      id: '6',
      serviceType: 'ride',
      vehicleType: 'suv',
      pickupLocation: 'Current Location',
      dropoffLocation: 'Airport',
      date: '2024-01-16',
      time: '08:45 AM',
      fare: 38.00,
      status: 'cancelled',
    },
  ];

  const filteredRides = rides.filter((ride) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return ride.status === 'completed';
    if (filter === 'cancelled') return ride.status === 'cancelled';
    return false;
  });

  const sortedRides = [...filteredRides].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'fare') return b.fare - a.fare;
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Ride History</h1>
          <p className="text-gray-600">View your past rides and trips</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:space-y-6 sm:space-x-6 space-x-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <label className="text-sm font-medium text-gray-700">Filter by:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'completed' | 'cancelled')}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Rides</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'fare' | 'rating')}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="date">Date</option>
                <option value="fare">Fare</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Fare
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRides.map((ride) => (
                      <tr key={ride.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                            <span className="capitalize font-medium">{ride.serviceType}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{ride.date}</td>
                        <td className="px-6 py-4 text-gray-600">{ride.time}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                            <span className="font-semibold text-gray-800">{ride.fare.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            ride.status === 'completed' ? 'bg-green-100 text-green-700' :
                            ride.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {ride.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <div className="flex items-center">
                            {ride.rating && [0, 0, 0, 0, 0].map((_, i) => (
                              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
