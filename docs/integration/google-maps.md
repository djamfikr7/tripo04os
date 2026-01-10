# Google Maps Integration Guide

Complete guide for integrating Google Maps Platform with Tripo04OS for location services, routing, and geocoding.

## Overview

Google Maps Platform provides:
- **Maps JavaScript API**: Interactive maps for web
- **Maps SDK for Android**: Native Android maps
- **Maps SDK for iOS**: Native iOS maps
- **Places API**: Place search and details
- **Directions API**: Route calculation
- **Geocoding API**: Address to coordinates
- **Geocoding API**: Coordinates to address
- **Static Maps API**: Static map images

## Architecture

```
[Client Apps]
        ↓
[Maps Service]
        ↓
[Google Maps Platform API]
    ├─ Maps JavaScript API
    ├─ Maps SDKs (Android/iOS)
    ├─ Places API
    ├─ Directions API
    ├─ Geocoding API
    ├─ Geocoding API
    └─ Static Maps API
```

## Setup

### 1. Create Google Cloud Project

```bash
# 1. Go to Google Cloud Console
# https://console.cloud.google.com/

# 2. Create new project
# Project name: tripo04os-production

# 3. Enable billing
```

### 2. Enable APIs

```bash
# 1. Navigate to APIs & Services
# https://console.cloud.google.com/apis/library

# 2. Enable required APIs:
#    - Maps JavaScript API
#    - Places API
#    - Directions API
#    - Geocoding API
#    - Geocoding API
#    - Static Maps API
```

### 3. Get API Key

```bash
# 1. Go to Credentials
# https://console.cloud.google.com/apis/credentials

# 2. Create API key
# Name: Tripo04OS Production

# 3. Set up restrictions:
#    - Application restrictions: None (for development) or HTTP referrers (for production)
#    - API restrictions: Maps JavaScript API, Places API, Directions API, Geocoding API, Geocoding API, Static Maps API

# 4. Enable billing for API key
```

## Backend Integration

### Go Service Configuration

Create `backend_services/maps_service/config/maps.go`:

```go
package config

import (
    "os"
)

type MapsConfig struct {
    APIKey           string
    Language         string
    Region           string
    DefaultZoom      int
    MinZoom          int
    MaxZoom          int
    MapType          string
    DisableDefaultUI bool
    ZoomControl      bool
    MapTypeControl   bool
    ScaleControl     bool
    StreetViewControl bool
    FullscreenControl bool
}

func LoadConfig() (*MapsConfig, error) {
    config := &MapsConfig{
        APIKey:           os.Getenv("GOOGLE_MAPS_API_KEY"),
        Language:         os.Getenv("GOOGLE_MAPS_LANGUAGE"),
        Region:           os.Getenv("GOOGLE_MAPS_REGION"),
        DefaultZoom:      15,
        MinZoom:          3,
        MaxZoom:          20,
        MapType:          "roadmap",
        DisableDefaultUI: false,
        ZoomControl:      true,
        MapTypeControl:   true,
        ScaleControl:     true,
        StreetViewControl: true,
        FullscreenControl: true,
    }

    if config.APIKey == "" {
        return nil, fmt.Errorf("GOOGLE_MAPS_API_KEY is required")
    }

    if config.Language == "" {
        config.Language = "en"
    }

    if config.Region == "" {
        config.Region = "US"
    }

    return config, nil
}
```

### Geocoding Service

Create `backend_services/maps_service/services/geocoding.go`:

```go
package services

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
    "tripo04os/maps_service/config"
)

type GeocodeRequest struct {
    Address  string `json:"address" binding:"required"`
    Language  string `json:"language"`
    Region    string `json:"region"`
}

type GeocodeResponse struct {
    Status    string        `json:"status"`
    Results   []PlaceDetails `json:"results"`
}

type PlaceDetails struct {
    PlaceID      string    `json:"place_id"`
    FormattedAddress string    `json:"formatted_address"`
    Geometry      Geometry  `json:"geometry"`
    Components     []Component `json:"address_components"`
}

type Geometry struct {
    Location Location `json:"location"`
}

type Location struct {
    Lat float64 `json:"lat"`
    Lng float64 `json:"lng"`
}

type Component struct {
    LongName  string `json:"long_name"`
    ShortName string `json:"short_name"`
    Types      []string `json:"types"`
}

func Geocode(config *config.MapsConfig, address string) (*GeocodeResponse, error) {
    if address == "" {
        return nil, fmt.Errorf("address is required")
    }

    // Build request URL
    baseURL := "https://maps.googleapis.com/maps/api/geocode/json"
    params := url.Values{}
    params.Add("address", address)
    params.Add("key", config.APIKey)
    if config.Language != "" {
        params.Add("language", config.Language)
    }
    if config.Region != "" {
        params.Add("region", config.Region)
    }

    // Make request
    resp, err := http.Get(fmt.Sprintf("%s?%s", baseURL, params.Encode()))
    if err != nil {
        return nil, fmt.Errorf("failed to make request: %v", err)
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, fmt.Errorf("failed to read response: %v", err)
    }

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("API request failed with status %d", resp.StatusCode)
    }

    // Parse response
    var result GeocodeResponse
    if err := json.Unmarshal(body, &result); err != nil {
        return nil, fmt.Errorf("failed to parse response: %v", err)
    }

    return &result, nil
}

func ReverseGeocode(config *config.MapsConfig, lat, lng float64) (*GeocodeResponse, error) {
    baseURL := "https://maps.googleapis.com/maps/api/geocode/json"
    params := url.Values{}
    params.Add("latlng", fmt.Sprintf("%.8f,%.8f", lat, lng))
    params.Add("key", config.APIKey)
    if config.Language != "" {
        params.Add("language", config.Language)
    }

    resp, err := http.Get(fmt.Sprintf("%s?%s", baseURL, params.Encode()))
    if err != nil {
        return nil, fmt.Errorf("failed to make request: %v", err)
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, fmt.Errorf("failed to read response: %v", err)
    }

    var result GeocodeResponse
    if err := json.Unmarshal(body, &result); err != nil {
        return nil, fmt.Errorf("failed to parse response: %v", err)
    }

    return &result, nil
}
```

### Places API Service

```go
package services

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
    "tripo04os/maps_service/config"
)

type PlaceSearchRequest struct {
    Query     string  `json:"query" binding:"required"`
    Location  Location `json:"location"`
    Radius     int     `json:"radius"`
    Type       string  `json:"type"`
    Language   string  `json:"language"`
}

type PlaceSearchResponse struct {
    Status      string  `json:"status"`
    Results     []Place  `json:"results"`
}

type Place struct {
    PlaceID       string    `json:"place_id"`
    Name          string    `json:"name"`
    FormattedAddress string    `json:"formatted_address"`
    Geometry      Geometry  `json:"geometry"`
    Rating        float64   `json:"rating"`
    Types         []string `json:"types"`
}

func SearchPlaces(config *config.MapsConfig, query string, lat, lng float64, radius int) (*PlaceSearchResponse, error) {
    baseURL := "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params := url.Values{}
    params.Add("keyword", query)
    params.Add("location", fmt.Sprintf("%.8f,%.8f", lat, lng))
    params.Add("radius", fmt.Sprintf("%d", radius))
    params.Add("key", config.APIKey)
    if config.Language != "" {
        params.Add("language", config.Language)
    }

    resp, err := http.Get(fmt.Sprintf("%s?%s", baseURL, params.Encode()))
    if err != nil {
        return nil, fmt.Errorf("failed to make request: %v", err)
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, fmt.Errorf("failed to read response: %v", err)
    }

    var result PlaceSearchResponse
    if err := json.Unmarshal(body, &result); err != nil {
        return nil, fmt.Errorf("failed to parse response: %v", err)
    }

    return &result, nil
}

func GetPlaceDetails(config *config.MapsConfig, placeID string) (*Place, error) {
    baseURL := "https://maps.googleapis.com/maps/api/place/details/json"
    params := url.Values{}
    params.Add("placeid", placeID)
    params.Add("key", config.APIKey)
    if config.Language != "" {
        params.Add("language", config.Language)
    }

    resp, err := http.Get(fmt.Sprintf("%s?%s", baseURL, params.Encode()))
    if err != nil {
        return nil, fmt.Errorf("failed to make request: %v", err)
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, fmt.Errorf("failed to read response: %v", err)
    }

    var result struct {
        Status string `json:"status"`
        Result Place  `json:"result"`
    }
    if err := json.Unmarshal(body, &result); err != nil {
        return nil, fmt.Errorf("failed to parse response: %v", err)
    }

    return &result.Result, nil
}
```

### Directions API Service

```go
package services

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
    "tripo04os/maps_service/config"
)

type DirectionsRequest struct {
    Origin      Location `json:"origin" binding:"required"`
    Destination Location `json:"destination" binding:"required"`
    Mode        string  `json:"mode"` // driving, walking, bicycling
    Avoid      []string `json:"avoid"` // tolls, highways, ferries
    Language    string  `json:"language"`
    Units       string  `json:"units"` // metric, imperial
}

type DirectionsResponse struct {
    Status       string      `json:"status"`
    Routes       []Route      `json:"routes"`
    GeocodedWaypoints GeocodedWaypoints `json:"geocoded_waypoints"`
}

type Route struct {
    Summary  RouteSummary `json:"summary"`
    Legs     []Leg       `json:"legs"`
}

type RouteSummary struct {
    Distance int    `json:"distance"`  // meters
    Duration int    `json:"duration"`  // seconds
}

type Leg struct {
    Distance LegDistance `json:"distance"`
    Duration LegDuration `json:"duration"`
    Steps    []Step       `json:"steps"`
}

type LegDistance struct {
    Text  string `json:"text"`
    Value int    `json:"value"`
}

type LegDuration struct {
    Text  string `json:"text"`
    Value int    `json:"value"`
}

type Step struct {
    StartLocation GeoPoint `json:"start_location"`
    EndLocation   GeoPoint `json:"end_location"`
    Distance       int       `json:"distance"`
    Duration       int       `json:"duration"`
    Polyline        string    `json:"polyline"`
}

type GeoPoint struct {
    Lat float64 `json:"lat"`
    Lng float64 `json:"lng"`
}

type GeocodedWaypoints struct {
    Origin      GeoPoint `json:"origin"`
    Destination GeoPoint `json:"destination"`
}

func GetDirections(config *config.MapsConfig, originLat, originLng, destLat, destLng float64, mode string) (*DirectionsResponse, error) {
    baseURL := "https://maps.googleapis.com/maps/api/directions/json"
    params := url.Values{}
    params.Add("origin", fmt.Sprintf("%.8f,%.8f", originLat, originLng))
    params.Add("destination", fmt.Sprintf("%.8f,%.8f", destLat, destLng))
    params.Add("mode", mode)
    params.Add("key", config.APIKey)
    if config.Language != "" {
        params.Add("language", config.Language)
    }
    if config.Units == "" {
        params.Add("units", "metric")
    } else {
        params.Add("units", config.Units)
    }

    resp, err := http.Get(fmt.Sprintf("%s?%s", baseURL, params.Encode()))
    if err != nil {
        return nil, fmt.Errorf("failed to make request: %v", err)
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, fmt.Errorf("failed to read response: %v", err)
    }

    var result DirectionsResponse
    if err := json.Unmarshal(body, &result); err != nil {
        return nil, fmt.Errorf("failed to parse response: v", err)
    }

    return &result, nil
}
```

### Route Handlers

Create `backend_services/maps_service/handlers/routes.go`:

```go
package handlers

import (
    "github.com/appleboy/gin"
    "tripo04os/maps_service/services"
    "tripo04os/maps_service/config"
)

type GeocodeRequest struct {
    Address string `json:"address" binding:"required"`
}

type ReverseGeocodeRequest struct {
    Lat float64 `json:"lat" binding:"required"`
    Lng float64 `json:"lng" binding:"required"`
}

type DirectionsRequest struct {
    OriginLat      float64 `json:"originLat" binding:"required"`
    OriginLng      float64 `json:"originLng" binding:"required"`
    DestLat        float64 `json:"destLat" binding:"required"`
    DestLng        float64 `json:"destLng" binding:"required"`
    Mode           string  `json:"mode"`
}

func Geocode(c *gin.Context) {
    var req GeocodeRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    config := config.GetConfig()
    response, err := services.Geocode(config, req.Address)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(200, response)
}

func ReverseGeocode(c *gin.Context) {
    var req ReverseGeocodeRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    config := config.GetConfig()
    response, err := services.ReverseGeocode(config, req.Lat, req.Lng)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(200, response)
}

func Directions(c *gin.Context) {
    var req DirectionsRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    if req.Mode == "" {
        req.Mode = "driving"
    }

    config := config.GetConfig()
    response, err := services.GetDirections(config, req.OriginLat, req.OriginLng, req.DestLat, req.DestLng, req.Mode)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(200, response)
}

func SearchPlaces(c *gin.Context) {
    query := c.Query("query")
    latStr := c.Query("lat")
    lngStr := c.Query("lng")
    radiusStr := c.Query("radius")

    if query == "" {
        c.JSON(400, gin.H{"error": "query is required"})
        return
    }

    var lat, lng float64
    var err error
    if latStr != "" {
        lat, err = strconv.ParseFloat(latStr, 64)
        if err != nil {
            c.JSON(400, gin.H{"error": "invalid latitude"})
            return
        }
    }
    if lngStr != "" {
        lng, err = strconv.ParseFloat(lngStr, 64)
        if err != nil {
            c.JSON(400, gin.H{"error": "invalid longitude"})
            return
        }
    }

    var radius int
    if radiusStr != "" {
        radius, err = strconv.Atoi(radiusStr)
        if err != nil {
            c.JSON(400, gin.H{"error": "invalid radius"})
            return
        }
    }

    config := config.GetConfig()
    response, err := services.SearchPlaces(config, query, lat, lng, radius)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(200, response)
}
```

## Frontend Integration

### React Web Interface

Install Google Maps packages:

```bash
cd web_interface_react
npm install @react-google-maps/api
npm install @googlemaps/js-api-loader
```

Configure Maps:

```typescript
// src/config/maps.ts
export const MAPS_CONFIG = {
  apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  defaultCenter: {
    lat: 40.7128,
    lng: -74.0060,
  },
  defaultZoom: 15,
  language: 'en',
  region: 'US',
  libraries: ['places', 'geometry', 'drawing'],
};

// Load Google Maps API
export const loadMapsScript = (): Promise<void> => {
  const loader = new (window as any).google.maps.plugins.loader.Loader({
    apiKey: MAPS_CONFIG.apiKey,
    version: 'weekly',
    libraries: MAPS_CONFIG.libraries,
    language: MAPS_CONFIG.language,
    region: MAPS_CONFIG.region,
  });

  await loader.importLibrary('places');
  await loader.importLibrary('marker');
};
```

### Map Component

```typescript
// src/components/Map.tsx
import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, useLoadScript } from '@react-google-maps/api';

interface MapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ id: string; position: { lat: number; lng: number } }>;
  directions?: { origin: { lat: number; lng: number }; destination: { lat: number; lng: number } };
}

const Map: React.FC<MapProps> = ({ center, zoom = 15, markers, directions }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: MAPS_CONFIG.apiKey,
    libraries: ['places'],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

  useEffect(() => {
    if (isLoaded && map && directions) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route({
        origin: new google.maps.LatLng(directions.origin.lat, directions.origin.lng),
        destination: new google.maps.LatLng(directions.destination.lat, directions.destination.lng),
        travelMode: google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === 'OK') {
          setDirectionsResponse(result);
        }
      });
    }
  }, [isLoaded, map, directions]);

  if (loadError) {
    return <div>Error loading maps: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div>Loading maps...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={{ height: '400px', width: '100%' }}
      center={center}
      zoom={zoom}
      onLoad={map => setMap(map)}
    >
      {markers?.map((marker) => (
        <Marker
          key={marker.id}
          position={{ lat: marker.position.lat, lng: marker.position.lng }}
        />
      ))}
      {directionsResponse && (
        <DirectionsRenderer
          directions={directionsResponse}
          options={{
            polylineOptions: {
              strokeColor: '#FF0000',
              strokeWeight: 4,
            },
          }}
        />
      )}
    </GoogleMap>
  );
};

export default Map;
```

### Place Autocomplete

```typescript
// src/components/PlaceAutocomplete.tsx
import React, { useState } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { StandaloneSearchBox } from '@react-google-maps/api';

interface PlaceAutocompleteProps {
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
}

const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({ onPlaceSelected, placeholder = 'Search places...' }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: MAPS_CONFIG.apiKey,
    libraries: ['places'],
  });

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    setAutocomplete(autocomplete);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place) {
        onPlaceSelected(place);
      }
    }
  };

  if (!isLoaded) {
    return <input placeholder={placeholder} disabled />;
  }

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
    >
      <StandaloneSearchBox>
        <input
          type="text"
          placeholder={placeholder}
          style={{ width: '100%', padding: '10px' }}
        />
      </StandaloneSearchBox>
    </Autocomplete>
  );
};

export default PlaceAutocomplete;
```

### Geocoding Service

```typescript
// src/services/mapsService.ts
import { MAPS_CONFIG } from '../config/maps';

export interface GeocodeResult {
  address: string;
  location: { lat: number; lng: number };
  components: {
    street_number?: string;
    route?: string;
    locality?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

export interface DirectionsResult {
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  polyline: string;
}

class MapsService {
  static async geocode(address: string): Promise<GeocodeResult> {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_CONFIG.apiKey}`
    );
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('Geocoding failed');
    }

    const result = data.results[0];
    const components = result.address_components.reduce((acc, comp) => {
      if (comp.types.includes('street_number')) acc.street_number = comp.long_name;
      if (comp.types.includes('route')) acc.route = comp.long_name;
      if (comp.types.includes('locality')) acc.locality = comp.long_name;
      if (comp.types.includes('administrative_area_level_2')) acc.city = comp.long_name;
      if (comp.types.includes('administrative_area_level_1')) acc.state = comp.long_name;
      if (comp.types.includes('postal_code')) acc.postal_code = comp.long_name;
      if (comp.types.includes('country')) acc.country = comp.long_name;
      return acc;
    }, {} as GeocodeResult['components']);

    return {
      address: result.formatted_address,
      location: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
      components,
    };
  }

  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_CONFIG.apiKey}`
    );
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('Reverse geocoding failed');
    }

    return data.results[0].formatted_address;
  }

  static async getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    mode: 'driving' | 'walking' | 'bicycling' = 'driving'
  ): Promise<DirectionsResult> {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=${mode}&key=${MAPS_CONFIG.apiKey}`
    );
    const data = await response.json();

    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      throw new Error('Directions request failed');
    }

    const route = data.routes[0];
    return {
      distance: {
        text: route.legs[0].distance.text,
        value: route.legs[0].distance.value,
      },
      duration: {
        text: route.ways[0].duration.text,
        value: route.ways[0].duration.value,
      },
      polyline: route.overview_polyline,
    };
  }

  static async searchPlaces(query: string, location?: { lat: number; lng: number }, radius = 5000): Promise<any[]> {
    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=${encodeURIComponent(query)}&key=${MAPS_CONFIG.apiKey}`;
    
    if (location) {
      url += `&location=${location.lat},${location.lng}`;
    }
    url += `&radius=${radius}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error('Place search failed');
    }

    return data.results;
  }
}

export default MapsService;
```

## Environment Configuration

### Backend (.env)

```env
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
GOOGLE_MAPS_LANGUAGE=en
GOOGLE_MAPS_REGION=US
GOOGLE_MAPS_DEFAULT_ZOOM=15
```

### React (.env)

```env
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

### Flutter (.env)

```env
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

## API Endpoints

```bash
# Geocode address
POST /v1/maps/geocode
Content-Type: application/json
{
  "address": "123 Main St, New York, NY"
}

# Reverse geocode
POST /v1/maps/reverse-geocode
Content-Type: application/json
{
  "lat": 40.7128,
  "lng": -74.0060
}

# Get directions
POST /v1/maps/directions
Content-Type: application/json
{
  "originLat": 40.7128,
  "originLng": -74.0060,
  "destLat": 40.758,
  "destLng": -73.9855,
  "mode": "driving"
}

# Search places
GET /v1/maps/places/search?query=pizza&lat=40.7128&lng=-74.0060&radius=5000

# Get place details
GET /v1/maps/places/{placeId}
```

## Troubleshooting

### Quota Exceeded

```bash
# Check quota
# https://console.cloud.google.com/apis/dashboard

# Enable billing
# https://console.cloud.google.com/billing
```

### Invalid API Key

```bash
# Check API key restrictions
# https://console.cloud.google.com/apis/credentials

# Ensure correct application type
# - None (development)
# - HTTP referrers (production)
```

### Maps Not Loading

```bash
# Check API key is loaded correctly
console.log('Maps API Key:', MAPS_CONFIG.apiKey);

# Check script is loaded
console.log('Maps loaded:', window.google);

# Check console for errors
# Open browser DevTools > Console
```

## Best Practices

1. **Enable API Key Restrictions**
   - Use HTTP referrers for production
   - Restrict to specific APIs
   - Enable IP restrictions for backend

2. **Cache Responses**
   - Cache geocoding results
   - Cache place search results
   - Cache route calculations
   - Use Redis for caching

3. **Monitor Usage**
   - Track API usage in CloudWatch
   - Set up alerts for quota limits
   - Review billing regularly

4. **Optimize Requests**
   - Batch multiple requests when possible
   - Use field parameters to limit data
   - Implement request throttling

5. **Handle Errors Gracefully**
   - Provide fallback UI when maps fail
   - Show user-friendly error messages
   - Implement retry logic for transient errors

6. **Use Appropriate Modes**
   - driving: For car rides
   - walking: For pedestrian routes
   - bicycling: For bike deliveries

7. **Language & Region**
   - Localize map labels
   - Use appropriate units (metric vs imperial)
   - Respect regional settings

## Next Steps

1. **Enable Production API Key**
   - Set up billing account
   - Enable API key for production use
   - Configure restrictions

2. **Implement Caching**
   - Set up Redis for caching responses
   - Implement cache invalidation strategy
   - Monitor cache hit rate

3. **Set Up Monitoring**
   - Create CloudWatch dashboards
   - Set up usage alerts
   - Track costs regularly

## Support

For Google Maps integration issues:
- Google Maps Documentation: https://developers.google.com/maps
- Google Cloud Console: https://console.cloud.google.com/
- Google Maps Support: https://developers.google.com/maps/support

## License

Proprietary - Tripo04OS Internal Use Only

---

**End of Google Maps Integration Guide**
