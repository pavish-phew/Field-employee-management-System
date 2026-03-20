import React, { useEffect, useState, useRef } from "react";
import { useMap, Polyline, Tooltip } from "react-leaflet";

const RoutingMachine = ({ from, to }) => {
  const map = useMap();
  const [routeLine, setRouteLine] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const lastCallRef = useRef(0);
  const lastDestRef = useRef(null);
  const retryCountRef = useRef(0);

  // Helper: check displacement in meters (approx)
  const isSignificantMovement = (p1, p2) => {
    if (!p1 || !p2) return true;
    const dist = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2)) * 111320;
    return dist > 50; // 50 meters
  };

  const fetchRoute = async (retry = 0) => {
    // 🛡️ FRONTEND FIX: Validate coordinates
    const isValidCoord = (c) => Array.isArray(c) && c.length >= 2 && 
                                typeof c[0] === 'number' && typeof c[1] === 'number' && 
                                !isNaN(c[0]) && !isNaN(c[1]);

    if (!isValidCoord(from) || !isValidCoord(to)) {
      console.warn("OSRM: Invalid or insufficient coordinates", { from, to });
      return;
    }
    
    setIsLoading(true);
    setError(null);

    // ✅ Correct order: lon,lat;lon,lat | Correct parameter: overview=full
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status === 400) {
          console.warn("OSRM 400: Bad Request - check coordinate precision or constraints");
          throw new Error("Invalid route request");
        }
        throw new Error("OSRM API temporarily busy");
      }
      
      const data = await res.json();
      if (!data.routes || !data.routes.length) throw new Error("No route found");

      const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      setRouteLine(coords);
      setError(null);
      retryCountRef.current = 0;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn("OSRM request timed out");
      }

      if (retry < 2 && err.message !== "Invalid route request" && err.message !== "No route found") { 
        console.warn(`OSRM retry ${retry + 1}...`);
        setTimeout(() => fetchRoute(retry + 1), 2000);
      } else {
        console.warn("OSRM fallback active: Showing direct path.");
        setError(err.message === "No route found" ? "No drivable route found." : "Route calculation unavailable.");
        setRouteLine([from, to]); // Fallback: Straight line
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!map || !from || !to) return;

    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;
    const destChanged = isSignificantMovement(lastDestRef.current, to);
    
    // THROTTLE: Refresh once every 15s OR if destination changed
    if (timeSinceLastCall < 15000 && !destChanged) return;

    lastCallRef.current = now;
    lastDestRef.current = to;
    
    fetchRoute();
  }, [map, from, to]);

  if (!routeLine) return null;

  return (
    <Polyline 
      positions={routeLine} 
      pathOptions={{ 
        color: error ? "#94a3b8" : "#6366f1", 
        weight: 5, 
        opacity: isLoading ? 0.3 : 0.7,
        dashArray: error ? "5, 10" : "none",
        lineCap: "round"
      }}
    >
      {error && (
        <Tooltip sticky variant="error">
          <span className="font-extrabold text-[10px] uppercase tracking-widest leading-none">{error}</span>
        </Tooltip>
      )}
      {isLoading && <Tooltip sticky>Recalculating Operational Route...</Tooltip>}
    </Polyline>
  );
};

export default RoutingMachine;