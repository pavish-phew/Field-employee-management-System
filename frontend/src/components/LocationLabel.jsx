import React, { useState, useEffect, useRef } from 'react';

// Global cache to avoid repeated Nominatim calls across re-renders/components
const locationCache = {};

const LocationLabel = ({ lat, lon, className = "" }) => {
  const [address, setAddress] = useState("");
  const fetchInProgress = useRef(false);

  // Normalize coordinates for efficient caching (3 decimal places ~= 110m precision)
  const normalizedLat = lat ? parseFloat(lat).toFixed(3) : null;
  const normalizedLon = lon ? parseFloat(lon).toFixed(3) : null;
  const cacheKey = `${normalizedLat},${normalizedLon}`;

  useEffect(() => {
    if (!normalizedLat || !normalizedLon) return;

    // 1. Check Cache immediately
    if (locationCache[cacheKey]) {
      setAddress(locationCache[cacheKey]);
      return;
    }

    // 3. Prevent redundant fetches
    if (fetchInProgress.current) return;

    const fetchLocation = async () => {
      fetchInProgress.current = true;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${normalizedLat}&lon=${normalizedLon}&format=json&zoom=16`
        );
        
        if (!res.ok) throw new Error("OSM Limit");
        
        const data = await res.json();
        const addr = data.address || {};
        
        // Extract meaningful area names: Suburb/Neighbourhood -> Road -> Village/Town
        const area = addr.suburb || addr.neighbourhood || addr.suburb || addr.road || addr.village || addr.town || "";
        const city = addr.city || addr.state_district || addr.county || "Puducherry";
        
        const result = area && city ? `${area}, ${city}` : (area || city || "Nearby");
        
        // Store in global cache
        locationCache[cacheKey] = result;
        setAddress(result);
      } catch (e) {
        // Silent failure - we'll just keep showing coordinates as fallback
        console.warn("Geocode standby:", e.message);
      } finally {
        fetchInProgress.current = false;
      }
    };

    fetchLocation();
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
