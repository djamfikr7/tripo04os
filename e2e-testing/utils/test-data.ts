import { test as base } from '@playwright/test';

export type User = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'rider' | 'driver';
};

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@tripo04os.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
  },
  {
    id: '2',
    email: 'rider@example.com',
    password: 'rider123',
    name: 'Test Rider',
    role: 'rider',
  },
  {
    id: '3',
    email: 'driver@example.com',
    password: 'driver123',
    name: 'Test Driver',
    role: 'driver',
  },
];

export const mockRides = [
  {
    id: 'RIDE-001',
    riderId: '2',
    driverId: '3',
    serviceType: 'ride',
    status: 'completed',
    pickupLocation: '123 Main St',
    dropoffLocation: '456 Oak Ave',
    fare: 15.50,
    distance: 5.2,
    duration: 12,
    rating: 4.8,
    createdAt: '2025-01-09T10:30:00Z',
  },
  {
    id: 'RIDE-002',
    riderId: '2',
    driverId: '3',
    serviceType: 'ride',
    status: 'cancelled',
    pickupLocation: '789 Pine Rd',
    dropoffLocation: '321 Elm St',
    fare: 0,
    distance: 0,
    duration: 0,
    rating: 0,
    createdAt: '2025-01-08T15:45:00Z',
  },
];

export const mockDrivers = [
  {
    id: '3',
    name: 'John Driver',
    email: 'driver@example.com',
    phone: '+1234567890',
    vehicleType: 'sedan',
    vehiclePlate: 'ABC123',
    rating: 4.7,
    totalTrips: 234,
    status: 'available',
  },
  {
    id: '4',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+0987654321',
    vehicleType: 'suv',
    vehiclePlate: 'XYZ789',
    rating: 4.9,
    totalTrips: 567,
    status: 'busy',
  },
];

export const mockAnalytics = {
  totalUsers: 12453,
  activeDrivers: 567,
  activeRiders: 11890,
  todayRides: 234,
  todayRevenue: 3456.78,
  avgRating: 4.6,
  totalRevenue: 1234567.89,
};
