from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from typing import Optional
from datetime import datetime
import httpx

class Settings(BaseSettings):
    NOMINATIM_URL: str = "https://nominatim.openstreetmap.org/search"
    OSRM_URL: str = "http://router.project-osrm.org/route/v1/driving"
    USER_AGENT: str = "Tripo04OS/1.0"

settings = Settings()

app = FastAPI(
    title="Tripo04OS Maps Service",
    description="OpenStreetMap integration via Nominatim + OSRM",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "maps-service",
        "maps": "OpenStreetMap",
        "geocoding": "Nominatim",
        "routing": "OSRM",
    }

@app.get("/ready")
async def readiness_check():
    return {
        "status": "ready",
        "service": "maps-service",
    }

@app.get("/api/v1/maps/geocode")
async def geocode(query: str, limit: int = 5):
    """Geocode address to coordinates using Nominatim"""
    async with httpx.AsyncClient() as client:
        params = {
            "q": query,
            "format": "json",
            "limit": limit,
            "addressdetails": 1,
        }
        headers = {
            "User-Agent": settings.USER_AGENT,
        }
        response = await client.get(settings.NOMINATIM_URL, params=params, headers=headers)
        data = response.json()
        
        return {
            "query": query,
            "results": data,
            "count": len(data),
        }

@app.get("/api/v1/maps/reverse-geocode")
async def reverse_geocode(lat: float, lon: float):
    """Reverse geocode coordinates to address"""
    url = "https://nominatim.openstreetmap.org/reverse"
    async with httpx.AsyncClient() as client:
        params = {
            "lat": lat,
            "lon": lon,
            "format": "json",
        }
        headers = {
            "User-Agent": settings.USER_AGENT,
        }
        response = await client.get(url, params=params, headers=headers)
        data = response.json()
        
        return {
            "coordinates": {"lat": lat, "lon": lon},
            "address": data,
        }

@app.get("/api/v1/maps/route")
async def get_route(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
):
    """Get route between two points using OSRM"""
    url = f"{settings.OSRM_URL}/{start_lon},{start_lat};{end_lon},{end_lat}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()
        
        return {
            "route": data,
            "distance_m": data.get("routes", [{}])[0].get("distance", 0) if data.get("routes") else 0,
            "duration_s": data.get("routes", [{}])[0].get("duration", 0) if data.get("routes") else 0,
            "start": {"lat": start_lat, "lon": start_lon},
            "end": {"lat": end_lat, "lon": end_lon},
        }

@app.get("/api/v1/maps/eta")
async def get_eta(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
):
    """Get estimated time of arrival"""
    url = f"{settings.OSRM_URL}/{start_lon},{start_lat};{end_lon},{end_lat}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()
        
        duration_s = data.get("routes", [{}])[0].get("duration", 0) if data.get("routes") else 0
        distance_m = data.get("routes", [{}])[0].get("distance", 0) if data.get("routes") else 0
        
        return {
            "eta_seconds": duration_s,
            "eta_minutes": round(duration_s / 60, 2),
            "distance_km": round(distance_m / 1000, 2),
            "start": {"lat": start_lat, "lon": start_lon},
            "end": {"lat": end_lat, "lon": end_lon},
        }

@app.get("/api/v1/maps/nearby")
async def find_nearby(
    lat: float,
    lon: float,
    radius_km: float = 5.0,
    category: Optional[str] = None,
):
    """Find nearby places (POI search)"""
    url = "https://nominatim.openstreetmap.org/search"
    async with httpx.AsyncClient() as client:
        params = {
            "q": category or "amenity",
            "lat": lat,
            "lon": lon,
            "r": radius_km / 1000,  # Convert to degrees (approximate)
            "format": "json",
            "limit": 20,
        }
        headers = {
            "User-Agent": settings.USER_AGENT,
        }
        response = await client.get(url, params=params, headers=headers)
        data = response.json()
        
        return {
            "center": {"lat": lat, "lon": lon},
            "radius_km": radius_km,
            "results": data,
            "count": len(data),
        }

@app.get("/api/v1/maps/distance-matrix")
async def get_distance_matrix(
    start_lat: float,
    start_lon: float,
    destinations: str,  # Comma-separated "lat1,lon1,lat2,lon2,..."
):
    """Get distance matrix for multiple destinations"""
    dest_coords = destinations.split(',')
    if len(dest_coords) % 2 != 0:
        return {"error": "Invalid destination format"}
    
    results = []
    for i in range(0, len(dest_coords), 2):
        dest_lat = float(dest_coords[i])
        dest_lon = float(dest_coords[i + 1])
        
        url = f"{settings.OSRM_URL}/{start_lon},{start_lat};{dest_lon},{dest_lat}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            data = response.json()
            
            distance_m = data.get("routes", [{}])[0].get("distance", 0) if data.get("routes") else 0
            duration_s = data.get("routes", [{}])[0].get("duration", 0) if data.get("routes") else 0
            
            results.append({
                "destination": {"lat": dest_lat, "lon": dest_lon},
                "distance_m": distance_m,
                "distance_km": round(distance_m / 1000, 2),
                "duration_s": duration_s,
                "duration_minutes": round(duration_s / 60, 2),
            })
    
    return {
        "origin": {"lat": start_lat, "lon": start_lon},
        "destinations": results,
        "count": len(results),
    }
