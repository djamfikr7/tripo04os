import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Car, Navigation, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Location {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export default function BookingWidget() {
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
  const [serviceType, setServiceType] = useState('ride');
  const [vehicleType, setVehicleType] = useState('sedan');
  const [showRoute, setShowRoute] = useState(false);

  const locations: Location[] = [
    { name: 'Current Location', address: 'Use GPS', lat: 40.7128, lng: -74.0060 },
    { name: 'Home', address: '123 Main St, New York, NY', lat: 40.758895, lng: -73.985130 },
    { name: 'Work', address: '456 Broadway, New York, NY', lat: 40.7580, lng: -73.9857 },
    { name: 'Airport', address: 'JFK International Airport, New York, NY', lat: 40.6413, lng: -73.7781 },
    { name: 'Shopping Mall', address: '50 West 34th St, New York, NY', lat: 40.7484, lng: -74.0039 },
  ];

  const serviceTypes = [
    { id: 'ride', name: 'Ride', icon: '🚗', vehicleTypes: ['sedan', 'suv', 'luxury'] },
    { id: 'moto', name: 'Moto', icon: '🏍', vehicleTypes: ['moto', 'scooter'] },
    { id: 'food', name: 'Food', icon: '🍔', vehicleTypes: [] },
    { id: 'grocery', name: 'Grocery', icon: '🛒', vehicleTypes: [] },
    { id: 'goods', name: 'Goods', icon: '📦', vehicleTypes: ['van', 'truck'] },
  ];

  const handleLocationSelect = (location: Location) => {
    if (serviceType === 'ride' || serviceType === 'moto' || serviceType === 'goods') {
      if (location === pickupLocation) {
        setPickupLocation(location);
      } else if (location === dropoffLocation) {
        setDropoffLocation(location);
      }
    }
    setShowRoute(false);
  };

  const handleBook = () => {
    if (!pickupLocation || !dropoffLocation) {
      alert('Please select pickup and dropoff locations');
      return;
    }
    alert(`Booking ${serviceType} with ${vehicleType} from ${pickupLocation.address} to ${dropoffLocation.address}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Book a Ride</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Service Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {serviceTypes.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setServiceType(service.id)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    serviceType === service.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{service.icon}</div>
                  <div className="font-semibold text-gray-800">{service.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Vehicle Type
              {serviceTypes
                .filter((s) => s.id === serviceType)[0]
                .vehicleTypes?.map((vehicle) => (
                  <button
                    key={vehicle}
                    onClick={() => setVehicleType(vehicle)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      vehicleType === vehicle
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="capitalize font-medium">{vehicle}</span>
                  </button>
                ))}
            </h2>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pickup Location</h2>
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((position) => {
                    setPickupLocation({
                      name: 'Current Location',
                      address: 'Using GPS',
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                    });
                  });
                } else {
                  alert('Geolocation is not supported');
                }
              }}
              className="w-full p-4 bg-white rounded-lg border-2 hover:bg-gray-50 text-left transition-colors"
            >
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-800">Use Current Location</div>
                  <div className="text-sm text-gray-500">GPS enabled</div>
                </div>
                <MapPin className="w-8 h-8 text-blue-600 ml-4" />
              </div>
            </button>

            <div className="mt-4 space-y-2">
              {locations.filter((loc) => loc.name !== 'Current Location').map((location) => (
                <button
                  key={location.name}
                  onClick={() => handleLocationSelect(location)}
                  className={`w-full p-4 bg-white rounded-lg border-2 hover:bg-gray-50 text-left transition-colors ${
                    pickupLocation?.name === location.name
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{location.name}</div>
                    <div className="text-sm text-gray-500">{location.address}</div>
                  </div>
                  {pickupLocation?.name === location.name && <Car className="w-6 h-6 text-green-600 ml-2" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Dropoff Location</h2>
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((position) => {
                    setDropoffLocation({
                      name: 'Current Location',
                      address: 'Using GPS',
                      lat: position.coords.latitude,
                      lng: position.coords.longitude,
                    });
                  });
                } else {
                  alert('Geolocation is not supported');
                }
              }}
              className="w-full p-4 bg-white rounded-lg border-2 hover:bg-gray-50 text-left transition-colors"
            >
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-800">Use Current Location</div>
                  <div className="text-sm text-gray-500">GPS enabled</div>
                </div>
                <Target className="w-8 h-8 text-blue-600 ml-4" />
              </div>
            </button>

            <div className="mt-4 space-y-2">
              {locations.filter((loc) => loc.name !== 'Current Location').map((location) => (
                <button
                  key={location.name}
                  onClick={() => handleLocationSelect(location)}
                  className={`w-full p-4 bg-white rounded-lg border-2 hover:bg-gray-50 text-left transition-colors ${
                    dropoffLocation?.name === location.name
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{location.name}</div>
                    <div className="text-sm text-gray-500">{location.address}</div>
                  </div>
                  {dropoffLocation?.name === location.name && <Target className="w-6 h-6 text-blue-600 ml-2" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowRoute(!showRoute)}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Navigation className="w-5 h-5 mr-2" />
              <span>View Route</span>
            </button>

            <button
              onClick={handleBook}
              disabled={!pickupLocation || !dropoffLocation}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Car className="w-5 h-5 mr-2" />
              <span>Book Ride</span>
            </button>
          </div>
        </div>

        {showRoute && pickupLocation && dropoffLocation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Route Map</h3>
                <button
                  onClick={() => setShowRoute(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="h-96 w-full bg-gray-100 rounded-lg overflow-hidden">
                <MapContainer
                  center={[pickupLocation.lat, pickupLocation.lng]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                >
                  <TileLayer>
                    <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={<Car className="text-blue-600" />} />
                    <Popup position={[pickupLocation.lat, pickupLocation.lng]}>
                      <div className="p-2">
                        <div className="font-semibold text-gray-800">{pickupLocation.address}</div>
                        <div className="text-sm text-gray-500">Pickup</div>
                      </div>
                    </Popup>
                    <Marker position={[dropoffLocation.lat, dropoffLocation.lng]} icon={<Target className="text-green-600" />} />
                    <Popup position={[dropoffLocation.lat, dropoffLocation.lng]}>
                      <div className="p-2">
                        <div className="font-semibold text-gray-800">{dropoffLocation.address}</div>
                        <div className="text-sm text-gray-500">Dropoff</div>
                      </div>
                    </Popup>
                    <Polyline
                      positions={[
                        [pickupLocation.lat, pickupLocation.lng],
                        [dropoffLocation.lat, dropoffLocation.lng]
                      ]}
                      color="blue"
                      weight={5}
                      dashArray="10, 10"
                      opacity={0.7}
                    />
                  </TileLayer>
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
