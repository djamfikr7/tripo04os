const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

const DRIVER_SCORE_CACHE_TTL = 300;
const ETA_CACHE_TTL = 60;
const DRIVER_AVAILABILITY_CACHE_TTL = 30;

async function getDriverScore(driverId, orderId) {
  const cacheKey = `driver_score:${driverId}:${orderId}`;
  
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

async function setDriverScore(driverId, orderId, score) {
  const cacheKey = `driver_score:${driverId}:${orderId}`;
  
  try {
    await redisClient.setEx(cacheKey, DRIVER_SCORE_CACHE_TTL, JSON.stringify(score));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

async function getETA(driverId, pickupLat, pickupLng) {
  const cacheKey = `eta:${driverId}:${pickupLat}:${pickupLng}`;
  
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return parseFloat(cached);
    }

    return null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

async function setETA(driverId, pickupLat, pickupLng, eta) {
  const cacheKey = `eta:${driverId}:${pickupLat}:${pickupLng}`;
  
  try {
    await redisClient.setEx(cacheKey, ETA_CACHE_TTL, eta.toString());
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

async function getAvailableDrivers(lat, lng, radius) {
  const cacheKey = `drivers:${Math.floor(lat * 100)}:${Math.floor(lng * 100)}`;
  
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

async function setAvailableDrivers(lat, lng, radius, drivers) {
  const cacheKey = `drivers:${Math.floor(lat * 100)}:${Math.floor(lng * 100)}`;
  
  try {
    await redisClient.setEx(cacheKey, DRIVER_AVAILABILITY_CACHE_TTL, JSON.stringify(drivers));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

async function invalidateDriverCache(driverId) {
  try {
    const keys = await redisClient.keys(`driver_score:${driverId}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Redis del error:', error);
  }
}

module.exports = {
  getDriverScore,
  setDriverScore,
  getETA,
  setETA,
  getAvailableDrivers,
  setAvailableDrivers,
  invalidateDriverCache,
};
