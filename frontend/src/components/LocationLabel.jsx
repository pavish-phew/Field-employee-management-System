import React, { useState, useEffect } from 'react';

// Global cache and queue for Nominatim to prevent 429 Too Many Requests
const locationCache = {};
const pendingQueue = [];
let isProcessingQueue = false;

const processQueue = async () => {
  if (isProcessingQueue || pendingQueue.length === 0) return;
  isProcessingQueue = true;

  while (pendingQueue.length > 0) {
    const { lat, lon, cacheKey, callback } = pendingQueue.shift();

    if (locationCache[cacheKey]) {
      callback(locationCache[cacheKey]);
      continue;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=16`,
        { headers: { 'Accept-Language': 'en' } }
      );

      if (!res.ok) {
        if (res.status === 429) {
          // Re-queue the failed request
          pendingQueue.unshift({ lat, lon, cacheKey, callback });
          // Wait longer (3s) on rate limit before resuming
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }
        throw new Error(`OSM Error ${res.status}`);
      }

      const data = await res.json();
      const addr = data.address || {};
      
      const area = addr.suburb || addr.neighbourhood || addr.road || addr.village || addr.town || "";
      const city = addr.city || addr.state_district || addr.county || "Location";
      
      const result = area && city ? `${area}, ${city}` : (area || city || "Unknown Location");
      
      locationCache[cacheKey] = result;
      callback(result);
    } catch (e) {
      console.warn("Geocode limit/error:", e.message);
      // Optional: Store a fallback so we don't keep retrying failed coords
      locationCache[cacheKey] = null; 
      callback(null);
    }

    // Wait exactly 1100ms to stay safely under the 1 req/sec Nominatim limit
    if (pendingQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
  }

  isProcessingQueue = false;
};

const LocationLabel = ({ lat, lon, className = "" }) => {
  const [address, setAddress] = useState("");

  // Normalize coordinates for efficient caching (3 decimal places ~= 110m precision)
  const normalizedLat = lat ? parseFloat(lat).toFixed(3) : null;
  const normalizedLon = lon ? parseFloat(lon).toFixed(3) : null;
  const cacheKey = `${normalizedLat},${normalizedLon}`;

  useEffect(() => {
    if (!normalizedLat || !normalizedLon) return;

    if (locationCache[cacheKey]) {
      setAddress(locationCache[cacheKey]);
      return;
    }

    // Enqueue this component's request safely
    let isMounted = true;
    
    pendingQueue.push({
      lat: normalizedLat,
      lon: normalizedLon,
      cacheKey,
      callback: (res) => {
        if (isMounted && res) setAddress(res);
      }
    });
    
    processQueue();

    return () => {
      isMounted = false;
    };
  }, [normalizedLat, normalizedLon, cacheKey]);

  // Display raw coordinates if address isn't ready
  const coordinateDisplay = lat && lon ? `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}` : "Tracking...";

  return (
    <span className={`inline-flex items-center gap-2 font-medium tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${className}`}>
      {address ? (
        <span className="animate-fadeIn">{address}</span>
      ) : (
        <span className="flex items-center gap-2 opacity-60">
           <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
           {coordinateDisplay}
        </span>
      )}
    </span>
  );
};

export default LocationLabel;
