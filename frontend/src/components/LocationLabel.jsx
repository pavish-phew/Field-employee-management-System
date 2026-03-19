import React, { useState, useEffect } from 'react';

const LocationLabel = ({ lat, lon, className = "" }) => {
  const [label, setLabel] = useState("");
  
  useEffect(() => {
    if (!lat || !lon) return;

    const fetchLocation = async () => {
      // Use a simple global cache to avoid repeated calls across components
      const cacheKey = `${parseFloat(lat).toFixed(4)},${parseFloat(lon).toFixed(4)}`;
      if (window._locationCache && window._locationCache[cacheKey]) {
        setLabel(window._locationCache[cacheKey]);
        return;
      }

      try {
        // Respect Nominatim's usage policy (1 request/sec max)
        // Since we might have multiple labels, we add a random delay to stagger
        await new Promise(r => setTimeout(r, Math.random() * 1000));

        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        if (!res.ok) throw new Error("Rate limit or API error");
        
        const data = await res.json();
        
        // Extract area/city as requested
        const addr = data.address || {};
        const area = addr.suburb || addr.neighbourhood || addr.road || addr.village || addr.town || "";
        const city = addr.city || addr.state_district || "Puducherry";
        
        const result = area ? `${area}, ${city}` : city;
        
        if (!window._locationCache) window._locationCache = {};
        window._locationCache[cacheKey] = result;
        setLabel(result);
      } catch (e) {
        console.error("Geocoding failed", e);
        setLabel("Location unavailable");
      }
    };

    fetchLocation();
  }, [lat, lon]);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {label || (
        <span className="flex items-center gap-2 opacity-50">
          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
          Locating...
        </span>
      )}
    </span>
  );
};

export default LocationLabel;
