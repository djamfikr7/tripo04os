# Maps Service

Tripo04OS Maps Service - Provides geocoding, routing, ETA calculation, and location-based search using OpenStreetMap ecosystem.

## Overview

The Maps Service is a FastAPI-based microservice that provides:
- **Geocoding**: Convert addresses to coordinates and vice versa
- **Routing**: Calculate routes between multiple points
- **ETA**: Estimate time of arrival and distance
- **Nearby Search**: Find places of interest around a location
- **Distance Matrix**: Calculate distances to multiple destinations

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Geocoding**: Nominatim (OpenStreetMap)
- **Routing**: OSRM (Open Source Routing Machine)
- **HTTP Client**: httpx

## Features

### Geocoding
- Forward geocoding (address → coordinates)
- Reverse geocoding (coordinates → address)
- Address details extraction

### Routing
- Turn-by-turn directions
- Route geometry
- Distance and duration calculation

### ETA Calculation
- Real-time ETA estimates
- Distance in kilometers
- Duration in minutes

### Nearby Search
- POI (Point of Interest) search
- Category-based filtering
- Radius-based search

### Distance Matrix
- Multiple destination routing
- Batch distance calculations
- Optimized for matching service

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/api/v1/maps/geocode` | Geocode address to coordinates |
| GET | `/api/v1/maps/reverse-geocode` | Reverse geocode coordinates |
| GET | `/api/v1/maps/route` | Get route between points |
| GET | `/api/v1/maps/eta` | Get ETA between points |
| GET | `/api/v1/maps/nearby` | Find nearby places |
| GET | `/api/v1/maps/distance-matrix` | Get distance matrix |

## Quick Start

### Prerequisites

- Python 3.11+
- pip

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
```

### Development

```bash
# Run in development mode
uvicorn app.main:app --host 0.0.0.0 --port 8014 --reload
```

### Production

```bash
# Run with uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8014 --workers 4
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NOMINATIM_URL` | No | `https://nominatim.openstreetmap.org/search` | Nominatim API URL |
| `OSRM_URL` | No | `http://router.project-osrm.org/route/v1/driving` | OSRM API URL |
| `USER_AGENT` | No | `Tripo04OS/1.0` | User agent for requests |
| `PORT` | No | 8014 | Service port |

## Usage Examples

### Geocoding

```bash
curl "http://localhost:8014/api/v1/maps/geocode?query=1600+Pennsylvania+Ave+NW,+Washington,+DC&limit=5"
```

Response:
```json
{
  "query": "1600 Pennsylvania Ave NW, Washington, DC",
  "results": [
    {
      "lat": 38.8977,
      "lon": -77.0365,
      "display_name": "1600, Pennsylvania Avenue Northwest, Washington, District of Columbia, 20500, United States"
    }
  ],
  "count": 1
}
```

### Reverse Geocoding

```bash
curl "http://localhost:8014/api/v1/maps/reverse-geocode?lat=38.8977&lon=-77.0365"
```

### Get Route

```bash
curl "http://localhost:8014/api/v1/maps/route?start_lat=38.8977&start_lon=-77.0365&end_lat=40.7128&end_lon=-74.0060"
```

Response:
```json
{
  "route": {...},
  "distance_m": 367780,
  "duration_s": 13620,
  "start": {"lat": 38.8977, "lon": -77.0365},
  "end": {"lat": 40.7128, "lon": -74.0060}
}
```

### Get ETA

```bash
curl "http://localhost:8014/api/v1/maps/eta?start_lat=38.8977&start_lon=-77.0365&end_lat=40.7128&end_lon=-74.0060"
```

Response:
```json
{
  "eta_seconds": 13620,
  "eta_minutes": 227.0,
  "distance_km": 367.78,
  "start": {"lat": 38.8977, "lon": -77.0365},
  "end": {"lat": 40.7128, "lon": -74.0060}
}
```

### Nearby Search

```bash
curl "http://localhost:8014/api/v1/maps/nearby?lat=40.7128&lon=-74.0060&radius_km=5&category=restaurant"
```

### Distance Matrix

```bash
curl "http://localhost:8014/api/v1/maps/distance-matrix?start_lat=40.7128&start_lon=-74.0060&destinations=40.7589,-73.9851,40.7614,-73.9776"
```

## Integration with Other Services

### Matching Service
- Receives driver and rider locations
- Calculates ETAs for all nearby drivers
- Determines optimal driver assignment

### Order Service
- Geocodes pickup and dropoff addresses
- Validates coordinates before order creation

### Trip Service
- Provides real-time route updates
- Calculates remaining distance and time

### Location Service
- Uses nearby search for POI recommendations
- Supports location-based features

## Rate Limiting

Nominatim (OpenStreetMap) has rate limits:
- **Free tier**: 1 request per second
- **Recommended**: Implement caching to reduce API calls
- **Production**: Consider self-hosting Nominatim

## Self-Hosting OSRM (Production)

For production, self-host OSRM for better performance and reliability:

```bash
# Download OSM data
wget https://download.geofabrik.de/north-america/us-latest.osm.pbf

# Extract routing data
osrm-extract us-latest.osm.pbf -p profiles/car.lua

# Build routing graph
osrm-contract us-latest.osrm

# Start OSRM server
osrm-routed --algorithm mld us-latest.osrm
```

Update `OSRM_URL` to point to your instance.

## Caching Strategy

Implement Redis caching for:
- Geocoding results (address → coordinates)
- Reverse geocoding results (coordinates → address)
- Route calculations (for frequently used routes)

## Monitoring

### Health Check

```bash
curl http://localhost:8014/health
```

Response:
```json
{
  "status": "healthy",
  "service": "maps-service",
  "maps": "OpenStreetMap",
  "geocoding": "Nominatim",
  "routing": "OSRM"
}
```

### Readiness Check

```bash
curl http://localhost:8014/ready
```

## Docker Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

### Using Docker

```bash
docker build -t maps-service .
docker run -p 8014:8014 maps-service
```

## Troubleshooting

### Geocoding Fails
- Check Nominatim API availability
- Verify address format
- Check rate limits

### Routing Fails
- Verify OSRM server is accessible
- Check if coordinates are valid
- Ensure OSRM instance covers the requested area

### Performance Issues
- Implement caching
- Consider self-hosting OSRM
- Use CDN for static data

## License

Proprietary - Tripo04OS Internal Use Only
