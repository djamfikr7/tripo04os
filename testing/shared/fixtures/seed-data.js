import { faker } from '@faker-js/faker';

export const generateTestUsers = (count = 50) => {
  const users = [];
  const roles = ['rider', 'driver', 'corporate'];
  
  for (let i = 0; i < count; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    
    users.push({
      id: `user_${i}`,
      email: faker.internet.email(),
      phone: faker.phone.number(),
      password: 'TestPass123!',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      role,
      verified: true,
      createdAt: faker.date.recent(),
    });
  }

  return users;
};

export const generateTestDrivers = (count = 10) => {
  const drivers = [];
  
  for (let i = 0; i < count; i++) {
    drivers.push({
      id: `driver_${i}`,
      userId: `user_${i + 100}`,
      email: faker.internet.email(),
      phone: faker.phone.number(),
      vehicleId: `vehicle_${i}`,
      licensePlate: faker.vehicle.vin(),
      rating: (4 + Math.random()).toFixed(2),
      completedTrips: Math.floor(Math.random() * 1000),
      status: 'ONLINE',
      currentLocation: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lon: -74.0060 + (Math.random() - 0.5) * 0.1,
      },
      createdAt: faker.date.recent(),
    });
  }

  return drivers;
};

export const generateTestVehicles = (count = 20) => {
  const vehicles = [];
  const types = ['SEDAN', 'SUV', 'VAN', 'MOTORCYCLE', 'SCOOTER', 'TRUCK'];
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    
    vehicles.push({
      id: `vehicle_${i}`,
      driverId: `driver_${i % 10}`,
      type,
      make: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
      year: faker.date.past().getFullYear(),
      color: faker.vehicle.color(),
      plate: faker.vehicle.vin(),
      seats: type === 'VAN' ? 8 : type === 'SEDAN' ? 4 : 5,
      status: 'ACTIVE',
      createdAt: faker.date.recent(),
    });
  }

  return vehicles;
};

export const generateTestOrders = (count = 100) => {
  const orders = [];
  const verticals = ['RIDE', 'MOTO', 'FOOD', 'GROCERY', 'GOODS', 'TRUCK_VAN'];
  
  for (let i = 0; i < count; i++) {
    const vertical = verticals[Math.floor(Math.random() * verticals.length)];
    const isScheduled = Math.random() > 0.8;
    
    orders.push({
      id: `order_${i}`,
      vertical,
      product: vertical === 'RIDE' ? 'STANDARD' : 'STANDARD',
      riderId: `user_${i}`,
      status: 'PENDING',
      pickupLocation: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lon: -74.0060 + (Math.random() - 0.5) * 0.1,
        address: faker.location.streetAddress(),
      },
      dropoffLocation: {
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lon: -74.0060 + (Math.random() - 0.5) * 0.1,
        address: faker.location.streetAddress(),
      },
      scheduledFor: isScheduled ? faker.date.future() : null,
      paymentMethod: Math.random() > 0.3 ? 'CARD' : 'CASH',
      estimatedFare: Math.floor(Math.random() * 100) + 10,
      createdAt: faker.date.recent(),
    });
  }

  return orders;
};

export const testLocations = {
  newYork: {
    timesSquare: { lat: 40.7589, lon: -73.9851 },
    centralPark: { lat: 40.7614, lon: -73.9776 },
    empireState: { lat: 40.7484, lon: -73.9857 },
    brooklynBridge: { lat: 40.7061, lon: -73.9969 },
  },
  losAngeles: {
    hollywood: { lat: 34.0928, lon: -118.3287 },
    santaMonica: { lat: 34.0195, lon: -118.4912 },
    lax: { lat: 33.9425, lon: -118.4081 },
  },
  chicago: {
    downtown: { lat: 41.8781, lon: -87.6298 },
    navyPier: { lat: 41.8917, lon: -87.6098 },
    millenniumPark: { lat: 41.8827, lon: -87.6233 },
  },
};

export const seedTestData = async () => {
  console.log('Seeding test data...');
  
  const users = generateTestUsers(50);
  const drivers = generateTestDrivers(10);
  const vehicles = generateTestVehicles(20);
  const orders = generateTestOrders(100);

  console.log(`Generated ${users.length} test users`);
  console.log(`Generated ${drivers.length} test drivers`);
  console.log(`Generated ${vehicles.length} test vehicles`);
  console.log(`Generated ${orders.length} test orders`);

  return {
    users,
    drivers,
    vehicles,
    orders,
    locations: testLocations,
  };
};

export default {
  generateTestUsers,
  generateTestDrivers,
  generateTestVehicles,
  generateTestOrders,
  testLocations,
  seedTestData,
};
