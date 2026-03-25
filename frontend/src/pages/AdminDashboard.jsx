import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { adminApi, attendanceApi } from '../services/api';
import { 
  Users, Briefcase, LayoutDashboard, History, Map as MapIcon, 
  Trash2, MapPin, Search, Filter, Mail, Info, Power, Navigation, Eye, Plus, X, UserPlus, ClipboardList,
  Activity, ArrowLeft, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskCard from '../components/TaskCard';
import { toast, Toaster } from 'react-hot-toast';
import LocationLabel from '../components/LocationLabel';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// --- Premium CSS Gradients & Glass ---
const premiumStyles = `
  .glass-card {
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  .modal-overlay {
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
  }
  .input-premium {
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    transition: all 0.3s;
  }
  .input-premium:focus {
    border-color: #6366f1;
    background: rgba(15, 23, 42, 0.8);
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.2);
  }
`;

// --- Bearing Logic ---
const calculateBearing = (p1, p2) => {
  if (!p1 || !p2) return 0;
  const dLon = (p2[1] - p1[1]) * (Math.PI / 180);
  const lat1 = p1[0] * (Math.PI / 180);
  const lat2 = p2[0] * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
};

// --- Custom Live Directional Arrow Marker (Employee) ---
const createLiveMarker = (bearing = 0, isActive) => {
  return L.divIcon({
    className: 'custom-nav-icon',
    html: `
      <div class="nav-arrow-wrapper" style="transform: rotate(${bearing}deg); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transition: transform 0.8s ease-out;">
         <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <!-- Outer Glow -->
            <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" fill="#3b82f6" stroke="white" stroke-width="2" style="filter: drop-shadow(0 0 8px rgba(59,130,246,0.6));" />
         </svg>
      </div>
      ${isActive ? '<div class="absolute inset-0 pulse-online bg-blue-500 rounded-full" style="z-index:-1; width:40px; height:40px; opacity: 0.3;"></div>' : ''}
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

// Guard: returns true only for genuine finite numbers (not NaN / null / undefined / string)
const isValidCoord = (v) => typeof v === 'number' && isFinite(v);

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!isValidCoord(lat1) || !isValidCoord(lon1) || !isValidCoord(lat2) || !isValidCoord(lon2)) return null;
  const R = 6371; // radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getEmployeeStatus = (dateString) => {
  if (!dateString) return { status: 'Offline', text: 'Offline', color: 'text-rose-500', bg: 'bg-rose-500/10' };
  const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
  
  if (diff < 15) {
    return { status: 'Active', text: `Active (${diff}s ago)`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
  } else if (diff <= 30) {
    return { status: 'Idle', text: `Idle (${diff}s ago)`, color: 'text-yellow-600', bg: 'bg-yellow-500/20' };
  } else {
    let m = Math.floor(diff / 60);
    let t = m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
    return { status: 'Offline', text: `Offline (${t})`, color: 'text-rose-500', bg: 'bg-rose-500/10' };
  }
};

const LiveMapLayer = ({ locations, clients, trackedEmployeeId, trackedClientId, employeeHistory, viewingHistoryId }) => {
  const map = useMap();
  const markersRef = useRef({});
  const clientsAdded = useRef(false);

  useEffect(() => {
    // Clear existing client markers if they exist to avoid duplication
    map.eachLayer(layer => {
      if (layer.options && layer.options.className === 'site-marker') {
        map.removeLayer(layer);
      }
    });

    if (clients.length > 0) {
      clients.forEach(c => {
        const cLat = Number(c.latitude);
        const cLng = Number(c.longitude);
        if (!isValidCoord(cLat) || !isValidCoord(cLng)) return;

        // ALL Clients are RED
        const iconColor = 'bg-rose-600';
        const pulseEffect = 'shadow-[0_0_15px_rgba(225,29,72,0.8)] animate-pulse';
        
        const icon = L.divIcon({ 
          html: `<div class="w-5 h-5 ${iconColor} border-2 border-white rounded-full ${pulseEffect}"></div>`, 
          className: 'site-marker' 
        });
        
        let isOutOfRange = false;
        let distLabel = "";
        const empLoc = locations.find(l => String(l.employee?.id) === String(trackedEmployeeId));
        if (empLoc) {
          const dist = calculateDistance(Number(empLoc.latitude), Number(empLoc.longitude), cLat, cLng);
          if (dist !== null && dist > 30) {
            isOutOfRange = true;
            distLabel = `${dist.toFixed(1)} km`;
          }
        }
        
        const popupContent = `
          <div class="p-3 min-w-[150px]">
            <div class="flex items-center gap-2 mb-2">
              <div class="w-2 h-2 rounded-full bg-rose-500"></div>
              <span class="font-extrabold text-sm text-slate-800 uppercase tracking-tighter">${c.user?.name || 'Site'}</span>
            </div>
            <div class="text-[11px] text-slate-500 mb-2 leading-relaxed font-medium">${c.address || ''}</div>
            ${isOutOfRange ? `
              <div class="mt-2 pt-2 border-t border-rose-100 flex items-center gap-2">
                <span class="text-[10px] font-black uppercase text-rose-600">⚠️ Too Far</span>
                <span class="text-[10px] font-bold text-rose-400 bg-rose-50 rounded-full px-2 py-0.5">${distLabel}</span>
              </div>
            ` : ""}
          </div>
        `;

        const marker = L.marker([cLat, cLng], { icon }).addTo(map)
         .bindPopup(popupContent, { className: 'premium-popup' });
        
        // Auto-open if selected in dropdown
        if (String(c.id) === String(trackedClientId)) {
           setTimeout(() => marker.openPopup(), 500);
        }
      });
    }
  }, [clients, map, locations, trackedEmployeeId, trackedClientId]);

  useEffect(() => {
    locations.forEach(loc => {
      const id = loc.employee?.id;
      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);
      if (!id || !isValidCoord(lat) || !isValidCoord(lng)) return;
      const pos = [lat, lng];
      let marker = markersRef.current[id];
      const st = getEmployeeStatus(loc.lastLocationUpdatedAt);
      
      const tooltipHtml = `
        <div class="flex flex-col gap-1 p-1 min-w-[120px] font-sans bg-white rounded-lg">
          <div class="font-extrabold text-sm text-slate-900">${loc.employee?.user?.name || 'Agent'}</div>
          <div class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-max border ${st.color.replace('text-','border-')} ${st.color} ${st.bg}">
             ${st.text}
          </div>
        </div>
      `;

      if (!marker) {
        marker = L.marker(pos, { icon: createLiveMarker(loc.bearing || 0, true) }).addTo(map);
        marker.bindTooltip(tooltipHtml, { direction: 'top', offset: [0, -10], opacity: 1 });
        markersRef.current[id] = marker;
      } else {
        marker.setLatLng(pos);
        marker.setIcon(createLiveMarker(loc.bearing || 0, true));
        marker.setTooltipContent(tooltipHtml);
      }
    });

    const currentLocIds = new Set(locations.map(l => l.employee?.id));
    Object.keys(markersRef.current).forEach(id => {
       if (!currentLocIds.has(Number(id)) && !currentLocIds.has(String(id))) {
           markersRef.current[id].remove();
           delete markersRef.current[id];
       }
    });
  }, [locations, map]);

  const polylineRef = useRef(null);

  useEffect(() => {
    const empLoc = locations.find(l => String(l.employee?.id) === String(trackedEmployeeId));
    const client = clients.find(c => String(c.id) === String(trackedClientId));

    const empLat = Number(empLoc?.latitude), empLng = Number(empLoc?.longitude);
    const cliLat = Number(client?.latitude), cliLng = Number(client?.longitude);
    if (empLoc && client && isValidCoord(empLat) && isValidCoord(empLng) && isValidCoord(cliLat) && isValidCoord(cliLng)) {
       const dist = calculateDistance(empLat, empLng, cliLat, cliLng);
       
       if (dist > 30) {
          const latlngs = [
             [empLat, empLng],
             [cliLat, cliLng]
          ];
          
          if (!polylineRef.current) {
             polylineRef.current = L.polyline(latlngs, {
                color: '#ef4444',
                dashArray: '10, 10',
                weight: 3
             }).addTo(map);
          } else {
             polylineRef.current.setLatLngs(latlngs);
          }
          
          polylineRef.current.bindTooltip(`<div class='px-3 py-1.5 bg-rose-600 text-white rounded-xl font-bold shadow-xl border border-white/20 animate-bounce'>⚠️ Too Far (${dist.toFixed(1)} km)</div>`, { 
             permanent: true, 
             direction: 'center',
             className: 'range-warning-tooltip',
             offset: [0, 0]
          }).openTooltip();

       } else {
          if (polylineRef.current) {
             map.removeLayer(polylineRef.current);
             polylineRef.current = null;
          }
       }
    } else {
       if (polylineRef.current) {
          map.removeLayer(polylineRef.current);
          polylineRef.current = null;
       }
    }
  }, [locations, clients, trackedEmployeeId, trackedClientId, map]);

  // Movement History Path
  const historyPathRef = useRef(null);
  const historyMarkersRef = useRef([]);

  useEffect(() => {
    // Clear old history path/markers
    if (historyPathRef.current) map.removeLayer(historyPathRef.current);
    historyMarkersRef.current.forEach(m => map.removeLayer(m));
    historyMarkersRef.current = [];

    if (viewingHistoryId && employeeHistory && employeeHistory.length > 1) {
      const pathCoords = employeeHistory
        .map(h => [h.latitude, h.longitude])
        .filter(p => isValidCoord(p[0]) && isValidCoord(p[1]));

      if (pathCoords.length > 1) {
        historyPathRef.current = L.polyline(pathCoords, {
          color: '#6366f1',
          weight: 4,
          opacity: 0.8,
          smoothFactor: 1
        }).addTo(map);

        // Start Marker (Green)
        const start = pathCoords[pathCoords.length - 1];
        const end = pathCoords[0];
        
        const startIcon = L.divIcon({ 
          html: '<div class="w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg"></div>', 
          className: 'history-start' 
        });
        const endIcon = L.divIcon({ 
          html: '<div class="w-4 h-4 bg-rose-500 border-2 border-white rounded-full shadow-lg"></div>', 
          className: 'history-end' 
        });

        const startMarker = L.marker(start, { icon: startIcon }).addTo(map).bindTooltip("Trip Start");
        const endMarker = L.marker(end, { icon: endIcon }).addTo(map).bindTooltip("Trip End");
          
        // Intermediate dots (optimized: show every 5th point if long path)
        const dots = [];
        pathCoords.forEach((p, index) => {
          if (index !== 0 && index !== pathCoords.length - 1 && (pathCoords.length < 20 || index % 5 === 0)) {
            const dot = L.circleMarker(p, { radius: 3, color: '#6366f1', fillOpacity: 0.6, weight: 1 }).addTo(map);
            dots.push(dot);
          }
        });

        historyMarkersRef.current = [startMarker, endMarker, ...dots];
        
        const bounds = L.latLngBounds(pathCoords);
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60] });
      }
    }
  }, [employeeHistory, map, viewingHistoryId]);

  return null;
};

const EmployeeDropdown = ({ locations, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  
  const selectedLoc = locations.find(l => String(l.employee?.id) === String(selected));

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.emp-dropdown')) setOpen(false);
    };
    if (open) document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [open]);

  return (
    <div className="relative min-w-[280px] emp-dropdown">
       <div onClick={() => setOpen(!open)} className="bg-slate-900 border border-slate-700/80 p-3 rounded-2xl cursor-pointer flex justify-between items-center text-sm shadow-xl backdrop-blur-md">
         {selectedLoc ? (
            <div className="flex flex-col">
              <span className="font-bold text-white mb-1">{selectedLoc.employee?.user?.name}</span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-max ${getEmployeeStatus(selectedLoc.lastLocationUpdatedAt).bg} ${getEmployeeStatus(selectedLoc.lastLocationUpdatedAt).color}`}>
                {getEmployeeStatus(selectedLoc.lastLocationUpdatedAt).text}
              </span>
            </div>
         ) : <span className="font-bold text-white pl-2 py-1">🌍 Show All Employees</span>}
         <span className="text-slate-400 ml-3">{open ? '▲' : '▼'}</span>
       </div>

       <AnimatePresence>
         {open && (
           <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
             className="absolute top-[110%] left-0 w-full glass-card border border-slate-700 rounded-2xl overflow-hidden z-[500] max-h-[300px] overflow-y-auto custom-scrollbar">
              <div onClick={() => { onChange(''); setOpen(false); }} className="p-4 hover:bg-slate-800/80 cursor-pointer border-b border-slate-700/50 text-sm font-bold text-white transition-colors">
                🌍 Show All Employees
              </div>
              {locations.map(l => {
                 const st = getEmployeeStatus(l.lastLocationUpdatedAt);
                 return (
                   <div key={l.id} onClick={() => { onChange(l.employee?.id); setOpen(false); }} className="p-4 hover:bg-slate-800/80 cursor-pointer border-b border-slate-700/50 flex flex-col gap-1 transition-colors">
                      <span className="font-bold text-slate-200 text-sm">{l.employee?.user?.name}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-max ${st.bg} ${st.color}`}>
                         {st.text}
                      </span>
                   </div>
                 )
              })}
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
};

const ClientDropdown = ({ clients, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const selectedClient = clients.find(c => String(c.id) === String(selected));

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.client-dropdown')) setOpen(false);
    };
    if (open) document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [open]);

  return (
    <div className="relative min-w-[220px] client-dropdown">
       <div onClick={() => setOpen(!open)} className="bg-slate-900 border border-slate-700/80 p-3 rounded-2xl cursor-pointer flex justify-between items-center text-sm shadow-xl backdrop-blur-md">
         {selectedClient ? (
            <span className="font-bold text-white pl-2">{selectedClient.user?.name}</span>
         ) : <span className="font-bold text-slate-400 pl-2">🎯 Select Client</span>}
         <span className="text-slate-400 ml-3">{open ? '▲' : '▼'}</span>
       </div>

       <AnimatePresence>
         {open && (
           <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} 
             className="absolute top-[110%] left-0 w-full glass-card border border-slate-700 rounded-2xl overflow-hidden z-[500] max-h-[300px] overflow-y-auto custom-scrollbar">
              <div onClick={() => { onChange(''); setOpen(false); }} className="p-4 hover:bg-slate-800/80 cursor-pointer border-b border-slate-700/50 text-sm font-bold text-slate-400 transition-colors">
                🎯 Clear Selection
              </div>
              {clients.map(c => (
                 <div key={c.id} onClick={() => { onChange(c.id); setOpen(false); }} className="p-4 hover:bg-slate-800/80 cursor-pointer border-b border-slate-700/50 flex flex-col gap-1 transition-colors">
                    <span className="font-bold text-slate-200 text-sm">{c.user?.name}</span>
                 </div>
              ))}
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
};

const AdminDashboard = () => {
  const location = useLocation();
  const getTabFromPath = () => {
    const p = location.pathname;
    if (p.includes('/map')) return 'map';
    if (p.includes('/employees')) return 'team';
    if (p.includes('/clients')) return 'sites';
    if (p.includes('/attendance')) return 'records';
    return 'dashboard';
  };

  const activeTab = getTabFromPath();
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [liveLocations, setLiveLocations] = useState([]);
  const [taskSummary, setTaskSummary] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals Visibility
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // task object being edited

  // Tracking State
  const [trackedEmployeeId, setTrackedEmployeeId] = useState('');
  const [trackedClientId, setTrackedClientId] = useState('');
  const [followMode, setFollowMode] = useState(true);
  const [employeeHistory, setEmployeeHistory] = useState([]);
  const [viewingHistoryId, setViewingHistoryId] = useState(null);
  
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [employeeStats, setEmployeeStats] = useState([]);
  
  const mapRef = useRef(null);
  const initialFocusDone = useRef(false);
  const lastStateRef = useRef({}); // Stores previous [id]: {pos, bearing} for direction calculation
  
  const [editingClient, setEditingClient] = useState(null);

  // Auto-focus District Center ONLY ONCE
  useEffect(() => {
    if (activeTab === 'map' && mapRef.current && !initialFocusDone.current) {
        mapRef.current.setView([11.9416, 79.8083], 12);
        initialFocusDone.current = true;
    }
  }, [activeTab]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, cliRes, taskRes, attRes, locRes, summaryRes] = await Promise.all([
        adminApi.getEmployees(),
        adminApi.getClients(),
        adminApi.getAllTasks(),
        attendanceApi.getAllHistory(),
        attendanceApi.getActiveLocations(),
        adminApi.getTaskSummary()
      ]);
      setEmployees(empRes.data);
      setClients(cliRes.data);
      setTasks(taskRes.data);
      setAttendance(attRes.data);
      setTaskSummary(summaryRes.data || []);
      
      const newLocs = locRes.data
        .map(loc => ({ ...loc, latitude: Number(loc.latitude), longitude: Number(loc.longitude) }))
        .map(loc => {
          const id = loc.employee?.id;
          if (!isValidCoord(loc.latitude) || !isValidCoord(loc.longitude)) return null;
          const currentPos = [loc.latitude, loc.longitude];
          const last = lastStateRef.current[id];
          let bearing = last?.bearing || 0;
          if (last && (last.pos[0] !== currentPos[0] || last.pos[1] !== currentPos[1])) bearing = calculateBearing(last.pos, currentPos);
          lastStateRef.current[id] = { pos: currentPos, bearing };
          return { ...loc, bearing };
        })
        .filter(Boolean);
      setLiveLocations(newLocs);
    } catch (e) {
      console.warn('Sync Standby');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEmployeeHistory = useCallback(async (empId) => {
    if (!empId) {
      setEmployeeHistory([]);
      return;
    }
    setLoading(true);
    try {
      const res = await attendanceApi.getEmployeeHistory(empId);
      setEmployeeHistory(res.data || []);
    } catch (err) {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData, activeTab]);

  // Polling for Map
  useEffect(() => {
    let interval;
    if (activeTab === 'map') {
       interval = setInterval(async () => {
         try {
           const locRes = await attendanceApi.getActiveLocations();
           setLiveLocations(() => locRes.data
             .map(loc => ({ ...loc, latitude: Number(loc.latitude), longitude: Number(loc.longitude) }))
             .map(loc => {
               const id = loc.employee?.id;
               if (!isValidCoord(loc.latitude) || !isValidCoord(loc.longitude)) return null;
               const pos = [loc.latitude, loc.longitude];
               const last = lastStateRef.current[id];
               let b = last?.bearing || 0;
               if (last && (last.pos[0] !== pos[0] || last.pos[1] !== pos[1])) b = calculateBearing(last.pos, pos);
               lastStateRef.current[id] = { pos, bearing: b };
               return { ...loc, bearing: b };
             })
             .filter(Boolean));
         } catch (e) {}
       }, 5000); 
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const ChangeMapView = () => {
    const map = useMap();
    useEffect(() => { mapRef.current = map; }, [map]);

    useEffect(() => {
      // Focus on tracked employee IF FOLLOW MODE IS ON
      if (trackedEmployeeId && followMode && !viewingHistoryId) {
        const loc = liveLocations.find(l => String(l.employee?.id) === String(trackedEmployeeId));
        const lat = Number(loc?.latitude), lng = Number(loc?.longitude);
        if (isValidCoord(lat) && isValidCoord(lng)) {
          map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
        }
      }
    }, [trackedEmployeeId, followMode, liveLocations, map, viewingHistoryId]);

    useEffect(() => {
      // Focus on selected client
      if (trackedClientId && !viewingHistoryId) {
        const client = clients.find(c => String(c.id) === String(trackedClientId));
        const lat = Number(client?.latitude), lng = Number(client?.longitude);
        if (isValidCoord(lat) && isValidCoord(lng)) {
          map.flyTo([lat, lng], 16, { animate: true, duration: 1.5 });
        }
      }
    }, [trackedClientId, clients, map, viewingHistoryId]);

    return null;
  };

  // --- Actions ---
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    try {
      await adminApi.createEmployee(data);
      toast.success("Employee added successfully");
      setShowEmployeeModal(false);
      loadData();
    } catch (err) { 
      const msg = err.response?.data?.message || "Creation Failed";
      toast.error(msg); 
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const rawData = Object.fromEntries(fd.entries());

    const lat = parseFloat(rawData.latitude);
    const lon = parseFloat(rawData.longitude);

    if (isNaN(lat) || isNaN(lon)) {
        toast.error("Latitude and Longitude must be valid numbers");
        return;
    }

    const payload = {
        name: rawData.name?.trim(),
        address: rawData.address?.trim(),
        latitude: lat,
        longitude: lon,
        email: rawData.email?.trim() || null,
        password: rawData.password || undefined
    };

    try {
      await adminApi.createClient(payload);
      toast.success("Client added successfully");
      setShowClientModal(false);
      loadData();
    } catch (err) { 
      const msg = err.response?.data?.message || err.response?.data || "Creation Failed";
      toast.error(typeof msg === 'string' ? msg : "Creation Failed"); 
    }
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const rawData = Object.fromEntries(fd.entries());
    
    const lat = parseFloat(rawData.latitude);
    const lon = parseFloat(rawData.longitude);

    if (isNaN(lat) || isNaN(lon)) {
        toast.error("Latitude and Longitude must be valid numbers");
        return;
    }

    const payload = {
        name: rawData.name?.trim(),
        address: rawData.address?.trim(),
        latitude: lat,
        longitude: lon,
        email: rawData.email?.trim() || null,
    };
    
    if (rawData.password && rawData.password.trim() !== '') {
        payload.password = rawData.password.trim();
    }

    try {
      await adminApi.updateClient(editingClient.id, payload);
      toast.success("Client updated successfully");
      setEditingClient(null);
      loadData();
    } catch (err) { 
      console.error("❌ Update failed details:", err.response?.data);
      const msg = err.response?.data?.message || err.response?.data || "Update Failed";
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg)); 
    }
  };

  const handleViewStats = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getEmployeeStats();
      setEmployeeStats(res.data || []);
      setShowStatsModal(true);
    } catch (err) {
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    if (!data.startTime) delete data.startTime; // Avoid sending empty string
    try {
      await adminApi.createTask(data);
      toast.success("Task created successfully");
      setShowTaskModal(false);
      loadData();
    } catch (err) { 
      const msg = err.response?.data?.message || "Task Creation Failed";
      toast.error(msg); 
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    if (!data.startTime) delete data.startTime;
    try {
      await adminApi.updateTask(editingTask.id, data);
      toast.success("Task updated successfully");
      setEditingTask(null);
      loadData();
    } catch (err) { 
      const msg = err.response?.data?.message || "Update Failed";
      toast.error(msg); 
    }
  };

  // Distance warning: checks if client is > 30 km from the first tracked employee
  const getTaskDistanceWarning = (clientId) => {
    const client = clients.find(c => String(c.id) === String(clientId));
    if (!client?.latitude || !client?.longitude) return null;
    const empLoc = liveLocations[0];
    if (!empLoc?.latitude) return null;
    const dist = calculateDistance(empLoc.latitude, empLoc.longitude, client.latitude, client.longitude);
    return dist > 30 ? dist : null;
  };

  // --- UI ---
  const Modal = ({ title, isOpen, onClose, children }) => {
    if (typeof document === 'undefined') return null;
    
    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 modal-overlay" />
            <motion.div initial={{ scale: 0.95, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 10, opacity: 0 }} className="glass-card w-full max-w-md p-6 pb-6 rounded-[2rem] relative shadow-2xl overflow-hidden border border-white/10 z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{title}</h3>
                <button type="button" onClick={onClose} className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
              </div>
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  return (
    <div className="space-y-8 container mx-auto px-4 max-w-7xl animate-fadeIn py-6">
      <style>{premiumStyles}</style>
      <Toaster position="top-right" />
      
      {/* Header & Tabs Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2 border-b border-slate-800/50">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tighter capitalize select-none mb-1">
            {activeTab} <span className="text-indigo-500"></span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] opacity-50"></p>
        </div>
        
        <div className="flex items-center gap-3">
           {activeTab === 'dashboard' && (
             <button onClick={() => setShowTaskModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all decoration-indigo-400 decoration-2 underline-offset-4">
               <Plus size={18} /> Create Task
             </button>
           )}
           {activeTab === 'team' && (
             <button onClick={() => setShowEmployeeModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">
               <UserPlus size={18} /> Add Employee
             </button>
           )}
           {activeTab === 'sites' && (
             <button onClick={() => setShowClientModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
               <MapPin size={18} /> Add Client
             </button>
           )}
           <button onClick={loadData} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all"><History size={18} /></button>
        </div>
      </div>

      <div className="tab-contents mt-8">
        {/* Persistent Map Container (Hidden when not active) */}
        <div style={{ display: activeTab === 'map' ? 'block' : 'none' }}>
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="h-[75vh] rounded-[3rem] overflow-hidden border border-slate-800 shadow-2xl relative">
                <MapContainer center={[11.9416, 79.8083]} zoom={13} className="h-full w-full">
                  <ChangeMapView />
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LiveMapLayer 
                     locations={liveLocations} 
                     clients={clients} 
                     trackedEmployeeId={trackedEmployeeId}
                     trackedClientId={trackedClientId}
                     employeeHistory={employeeHistory}
                     viewingHistoryId={viewingHistoryId}
                  />
                </MapContainer>
                
                <div className="absolute top-6 left-6 z-[400] flex flex-col gap-4">
                   <div className="flex flex-col sm:flex-row items-center gap-4">
                      <EmployeeDropdown locations={liveLocations} selected={trackedEmployeeId} onChange={setTrackedEmployeeId} />
                      <ClientDropdown clients={clients} selected={trackedClientId} onChange={setTrackedClientId} />
                   </div>
                   
                   {employeeHistory.length > 0 && (
                     <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} 
                        className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-5 rounded-[2rem] shadow-2xl max-w-[280px]">
                        <div className="flex justify-between items-center mb-4">
                           <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                              <Activity size={14} /> Journey Stats
                           </h4>
                           <button onClick={() => setEmployeeHistory([])} className="text-slate-500 hover:text-white p-1"><X size={14}/></button>
                        </div>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-500 font-medium">Waypoints</span>
                              <span className="text-white font-black">{employeeHistory.length}</span>
                           </div>
                           <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-500 font-medium">Timespan</span>
                              <span className="text-white font-black">
                                {new Date(employeeHistory[employeeHistory.length-1].timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                                {new Date(employeeHistory[0].timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                              </span>
                           </div>
                        </div>
                     </motion.div>
                   )}
                </div>
              </div>
           </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
             <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {tasks.map(t => (
                 <div key={t.id} className="relative group/task">
                   <TaskCard task={t} />
                   <button
                     onClick={() => setEditingTask(t)}
                     className="absolute top-4 right-4 opacity-0 group-hover/task:opacity-100 transition-all bg-indigo-600/90 hover:bg-indigo-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg backdrop-blur-sm z-10"
                   >
                     <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                     Edit
                   </button>
                 </div>
               ))}
               {tasks.length === 0 && <p className="col-span-full py-40 text-center text-slate-600 font-bold uppercase tracking-widest text-xs">No active operations</p>}
            </motion.div>
          )}

          {activeTab === 'team' && (
             <motion.div key="team" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map(e => (
                  <div key={e.id} className="glass-card p-6 rounded-[2rem] flex items-center justify-between group border border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center font-bold text-indigo-400">{e.user?.name?.[0]}</div>
                      <div className="truncate max-w-[150px]">
                        <h4 className="font-bold text-white truncate">{e.user?.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono italic">{e.user?.role}</p>
                      </div>
                    </div>
                    <button onClick={async () => { if(confirm('Delete?')) { await adminApi.deleteEmployee(e.id); loadData(); } }} className="p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                  </div>
                ))}
             </motion.div>
          )}

          {activeTab === 'sites' && (
             <motion.div key="sites" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map(c => (
                  <div key={c.id} className="glass-card p-6 rounded-[2rem] flex items-center justify-between group border border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center font-bold text-emerald-400">{c.user?.name?.[0]}</div>
                      <div>
                        <h4 className="font-bold text-white">{c.user?.name}</h4>
                        <p className="text-[10px] text-slate-500 italic"><LocationLabel lat={c.latitude} lon={c.longitude}/></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditingClient(c)} className="p-2 text-slate-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"><Plus size={16}/></button>
                      <button onClick={async () => { if(confirm('Delete Site?')) { await adminApi.deleteClient(c.id); loadData(); } }} className="p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
             </motion.div>
          )}

          {activeTab === 'records' && (
             <motion.div key="records" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                <div className="flex items-center justify-between px-2">
                   <div>
                      <h2 className="text-3xl font-extrabold text-white tracking-tighter uppercase"></h2>
                      <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1"></p>
                   </div>
                   <div className="flex items-center gap-4">
                      <button 
                        onClick={handleViewStats}
                        className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2"
                      >
                         <Activity size={16} /> View Statistics
                      </button>
                      <History className="text-indigo-500 opacity-50" size={32} />
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                   {taskSummary.map((emp, idx) => (
                      <div key={idx} className="glass-card rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-xl animate-fadeInUp" style={{ animationDelay: `${idx * 0.1}s` }}>
                         {/* Employee Header */}
                         <div className="bg-slate-950/40 px-8 py-5 border-b border-slate-800 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black">
                               {emp.employeeName?.[0]}
                            </div>
                            <div>
                               <h3 className="text-lg font-black text-white">{emp.employeeName}</h3>
                               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Employee Archive</p>
                            </div>
                         </div>

                         {/* Clients Group */}
                         <div className="p-4 space-y-4">
                            {emp.clients.map((client, cIdx) => (
                               <div key={cIdx} className="bg-slate-900/30 rounded-[2rem] border border-white/5 p-6 ml-4">
                                  <div className="flex items-center gap-3 mb-5">
                                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                                     <h4 className="font-extrabold text-slate-200 text-sm tracking-tight uppercase">{client.clientName}</h4>
                                  </div>

                                  {/* Tasks Table */}
                                  <div className="overflow-hidden rounded-2xl border border-slate-800/50">
                                     <table className="w-full text-left text-xs">
                                        <thead>
                                           <tr className="bg-slate-950/60 text-slate-500">
                                              <th className="px-6 py-4 font-black uppercase tracking-widest">Task Title</th>
                                              <th className="px-6 py-4 font-black uppercase tracking-widest">Status</th>
                                              <th className="px-6 py-4 font-black uppercase tracking-widest">Completed At</th>
                                           </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/30">
                                           {client.tasks.map((task, tIdx) => (
                                              <tr key={tIdx} className="hover:bg-white/5 transition-colors">
                                                 <td className="px-6 py-4 font-bold text-slate-300">{task.taskTitle}</td>
                                                 <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                       task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                       task.status === 'IN_PROGRESS' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse' :
                                                       'bg-slate-800 text-slate-500 border-slate-700'
                                                    }`}>
                                                       {task.status}
                                                    </span>
                                                 </td>
                                                 <td className="px-6 py-4 text-slate-500 font-medium">
                                                    {task.completedAt ? (
                                                       <div className="flex flex-col">
                                                          <span className="text-slate-300">{new Date(task.completedAt).toLocaleDateString()}</span>
                                                          <span className="text-[10px] opacity-70">{new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                       </div>
                                                    ) : '--'}
                                                 </td>
                                              </tr>
                                           ))}
                                        </tbody>
                                     </table>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   ))}
                   {taskSummary.length === 0 && (
                      <div className="py-40 text-center glass-card rounded-[3rem] border border-slate-800 border-dashed">
                         <p className="text-slate-600 font-black uppercase tracking-[0.4em] text-xs">No Audit Logs Found</p>
                      </div>
                   )}
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- Modals --- */}
      <Modal title="Add Employee" isOpen={showEmployeeModal} onClose={() => setShowEmployeeModal(false)}>
        <form onSubmit={handleCreateEmployee} className="space-y-5">
           <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Name</label>
              <input name="name" required className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" placeholder="" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Email</label>
              <input name="email" type="email" required className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" placeholder="" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Access Password</label>
              <input name="password" type="password" required className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" placeholder="••••••••" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Role (Employee/Admin)</label>
              <select name="role" className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none cursor-pointer">
                 <option value="EMPLOYEE">Employee</option>
                 <option value="ADMIN">Admin</option>
              </select>
           </div>
           <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 mt-4">Add Employee</button>
        </form>
      </Modal>

      <Modal title="Edit Client" isOpen={!!editingClient} onClose={() => setEditingClient(null)}>
        {editingClient && (
          <form onSubmit={handleUpdateClient} className="space-y-5">
             <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Client name</label>
                <input name="name" required defaultValue={editingClient.user?.name} className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" placeholder="" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Location Address</label>
                <input name="address" required defaultValue={editingClient.address} className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Latitude</label>
                  <input name="latitude" type="number" step="any" required defaultValue={editingClient.latitude} className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Longitude</label>
                  <input name="longitude" type="number" step="any" required defaultValue={editingClient.longitude} className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Email</label>
                <input name="email" type="email" required defaultValue={editingClient.user?.email} className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Update Password (Optional)</label>
                <input name="password" type="password" className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" placeholder="Leave empty to keep current" />
             </div>
             <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 mt-4">Save Changes</button>
          </form>
        )}
      </Modal>

      <Modal title="Add Client" isOpen={showClientModal} onClose={() => setShowClientModal(false)}>
        <form onSubmit={handleCreateClient} className="space-y-5">
           <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Client name</label>
              <input name="name" required className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" placeholder="e.g. Metro Rail Project" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Location</label>
              <input name="address" required className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" placeholder="e.g. 123 Main St" />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Latitude</label>
                <input name="latitude" type="number" step="any" required className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" placeholder="11.9416" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Longitude</label>
                <input name="longitude" type="number" step="any" required className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" placeholder="79.8083" />
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Contact/email</label>
              <input name="email" type="email" required className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" placeholder="contact@client.pro" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Set Password</label>
              <input name="password" type="password" required className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" placeholder="••••••••" />
           </div>
           <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95 mt-4">Add Client</button>
        </form>
      </Modal>

      <Modal title="Create Task" isOpen={showTaskModal} onClose={() => setShowTaskModal(false)}>
        <form onSubmit={handleCreateTask} className="space-y-5">
           <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Task name</label>
              <input name="title" required className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" placeholder="" />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Instructions</label>
               <textarea name="description" required rows="2" className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none resize-none" placeholder="" />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Assign employee</label>
                <select name="employeeId" required className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none">
                   {employees.map(e => <option key={e.id} value={e.id}>{e.user?.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Assign client/site</label>
                <select name="clientId" required className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none">
                   {clients.map(c => <option key={c.id} value={c.id}>{c.user?.name}</option>)}
                </select>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Start time</label>
                <input type="datetime-local" name="startTime" className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Status</label>
                <select name="status" className="w-full input-premium rounded-2xl px-5 py-3.5 outline-none">
                   <option value="PENDING">Pending</option>
                   <option value="IN_PROGRESS">In Progress</option>
                   <option value="COMPLETED">Completed</option>
                </select>
              </div>
           </div>
           <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 mt-4">Create Task</button>
        </form>
      </Modal>

      {/* --- Edit Task Modal --- */}
      <Modal title="✏️ Edit Task" isOpen={!!editingTask} onClose={() => setEditingTask(null)}>
        {editingTask && (() => {
          const distWarning = getTaskDistanceWarning(editingTask.clientId);
          return (
            <form onSubmit={handleEditTask} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Task Name</label>
                <input name="title" required defaultValue={editingTask.title} className="w-full input-premium rounded-2xl px-5 py-3 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Instructions</label>
                <textarea name="description" rows="2" defaultValue={editingTask.description} className="w-full input-premium rounded-2xl px-5 py-3 outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Assign Employee</label>
                  <select name="employeeId" required defaultValue={editingTask.employeeId} className="w-full input-premium rounded-2xl px-4 py-3 outline-none">
                    {employees.map(e => <option key={e.id} value={e.id}>{e.user?.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Client / Site</label>
                  <select name="clientId" required defaultValue={editingTask.clientId} className="w-full input-premium rounded-2xl px-4 py-3 outline-none">
                    {clients.map(c => <option key={c.id} value={c.id}>{c.user?.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Status</label>
                  <select name="status" defaultValue={editingTask.status} className="w-full input-premium rounded-2xl px-4 py-3 outline-none">
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 ml-1">Start Time</label>
                  <input type="datetime-local" name="startTime"
                    defaultValue={editingTask.startTime ? new Date(editingTask.startTime).toISOString().slice(0, 16) : ''}
                    className="w-full input-premium rounded-2xl px-4 py-3 outline-none" />
                </div>
              </div>
              {distWarning && (
                <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/40 rounded-2xl px-4 py-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" className="shrink-0 animate-pulse">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span className="text-xs font-bold text-rose-400">
                    Client out of range — <span className="text-rose-300">{distWarning.toFixed(1)} km</span> away (limit: 30 km)
                  </span>
                </div>
              )}
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 mt-1">
                Save Changes
              </button>
            </form>
          );
        })()}
      </Modal>

      {/* --- Employee Statistics Modal --- */}
      <Modal title="📊 Performance Analytics" isOpen={showStatsModal} onClose={() => setShowStatsModal(false)}>
        <div className="w-full space-y-6 pt-2">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employeeStats} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="employeeName" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight="bold" 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  fontWeight="bold" 
                  tickLine={false} 
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid #334155', 
                    borderRadius: '16px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Bar name="Completed" dataKey="completedTasks" fill="#10b981" radius={[6, 6, 0, 0]} barSize={35} />
                <Bar name="Pending" dataKey="pendingTasks" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Employees</p>
                <p className="text-xl font-black text-white">{employeeStats.length}</p>
             </div>
             <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Completion Rate</p>
                <p className="text-xl font-black text-emerald-400">
                   {employeeStats.length > 0 
                     ? Math.round((employeeStats.reduce((acc, curr) => acc + curr.completedTasks, 0) / 
                       employeeStats.reduce((acc, curr) => acc + curr.totalTasks, 0)) * 100)
                     : 0}%
                </p>
             </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
