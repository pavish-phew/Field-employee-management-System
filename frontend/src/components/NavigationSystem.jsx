import React, { useState, useEffect, useRef } from 'react';
import { Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'react-hot-toast';
import LocationLabel from './LocationLabel';

// --- Improved Bearing Calculation ---
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const lat1Rad = lat1 * (Math.PI / 180);
  const lat2Rad = lat2 * (Math.PI / 180);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const brng = Math.atan2(y, x) * (180 / Math.PI);
  return (brng + 360) % 360;
};

// --- Static Icon Generator (Optimized) ---
const getNavigationIcon = (bearing, isActive) => {
  const color = isActive ? '#6366f1' : '#94a3b8';
  return L.divIcon({
    className: 'nav-icon-wrapper',
    html: `
      <div style="transform: rotate(${bearing}deg); transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1); width: 32px; height: 32px; display: flex; align-items: center; justify-center;">
        <svg width="28" height="28" viewBox="0 0 24 24" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="${color}" stroke="white" stroke-width="1.5" stroke-linejoin="round" />
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const NavigationSystem = ({ employee, followMode = true }) => {
  const map = useMap();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ speed: 0, lat: 0, lon: 0 });
  
  const markerRef = useRef(null);
  const watchId = useRef(null);
  const lastPosRef = useRef(null);
  const bearingRef = useRef(0);

  useEffect(() => {
    if (!navigator.geolocation || !map) return;

    // Initialize Marker if not exists or if it was removed
    if (!markerRef.current) {
      markerRef.current = L.marker([0, 0], { 
        icon: getNavigationIcon(0, true),
        zIndexOffset: 1000 
      }).addTo(map);
      
      const popupContent = document.createElement('div');
      popupContent.id = 'nav-popup';
      markerRef.current.bindPopup(popupContent);
    }

    const handleSuccess = (pos) => {
      const { latitude, longitude, heading, speed } = pos.coords;
      const newPos = [latitude, longitude];

      // 1. Calculate and Smooth Bearing
      if (lastPosRef.current) {
          const rawBearing = heading ?? calculateBearing(
            lastPosRef.current[0], lastPosRef.current[1], 
            latitude, longitude
          );
          
          // Apply basic smoothing to bearing
          let diff = rawBearing - bearingRef.current;
          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;
          bearingRef.current = (bearingRef.current + diff * 0.6 + 360) % 360;
      }
      
      lastPosRef.current = newPos;

      // 2. Direct Leaflet Update (Performance critical)
      if (markerRef.current && map) {
        markerRef.current.setLatLng(newPos);
        markerRef.current.setIcon(getNavigationIcon(bearingRef.current, true));
        
        // Update Popup Content manually to avoid React re-render of map
        const popup = markerRef.current.getPopup();
        if (popup && popup.isOpen()) {
          popup.setContent(`
            <div class="p-2 min-w-[140px] font-sans">
              <p class="text-[10px] font-bold text-indigo-600 uppercase mb-1">${employee?.name || 'Agent'}</p>
              <p class="text-xs font-bold text-slate-800">${(speed * 3.6 || 0).toFixed(1)} km/h</p>
              <p class="text-[9px] text-slate-400 mt-1">${latitude.toFixed(5)}, ${longitude.toFixed(5)}</p>
            </div>
          `);
        }
      }

      // 3. React State Updates (Less frequent UI elements)
      setStats({ speed: speed || 0, lat: latitude, lon: longitude });
      setHistory(prev => {
        const last = prev[prev.length - 1];
        if (last && last[0] === latitude && last[1] === longitude) return prev;
        return [...prev.slice(-40), newPos];
      });

      // 4. Auto-Follow Logic
      if (followMode && map) {
        map.panTo(newPos, { animate: true, duration: 1.5 });
      }
    };

    const handleError = (error) => {
      console.warn(`Geolocation Error (${error.code}): ${error.message}`);
      if (error.code === 3) {
        toast.error("GPS Timeout. Retrying...", { id: 'gps-error' });
      }
    };

    watchId.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20000 
    });

    return () => {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null; // Important to avoid "Cannot set properties of null"
      }
    };
  }, [map, followMode, employee]);

  return (
    <>
      {history.length > 1 && (
        <Polyline 
          positions={history} 
          pathOptions={{ 
            color: '#6366f1', 
            weight: 3, 
            opacity: 0.4, 
            dashArray: '4, 8',
            lineCap: 'round'
          }} 
        />
      )}
      {stats.lat !== 0 && (
         <Circle 
           center={[stats.lat, stats.lon]} 
           radius={15} 
           pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.05, weight: 1 }} 
         />
      )}
    </>
  );
};

export default NavigationSystem;
