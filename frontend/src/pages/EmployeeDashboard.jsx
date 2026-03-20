import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, StopCircle, Clock, MapPin, 
  CheckCircle2, AlertCircle, History, LayoutDashboard, Navigation, XCircle, CheckCircle, Power, User, Map as MapIcon, ChevronRight
} from 'lucide-react';
import { employeeApi, attendanceApi } from '../services/api';
import TaskCard from '../components/TaskCard';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { toast, Toaster } from 'react-hot-toast';
import LocationLabel from '../components/LocationLabel';

// Fix for Leaflet marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

import RoutingMachine from '../components/RoutingMachine';
import NavigationSystem from '../components/NavigationSystem';

const EmployeeDashboard = ({ user }) => {
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // High-Reliability Geolocation State
  const [currentPosition, setCurrentPosition] = useState(() => {
    const cached = localStorage.getItem('last_fems_pos');
    return cached ? JSON.parse(cached) : null;
  });
  
  const [autoFollow, setAutoFollow] = useState(true);
  const [isGpsReady, setIsGpsReady] = useState(false);
  const watchId = useRef(null);

  const startTracking = (highAccuracy = true) => {
    if (watchId.current) navigator.geolocation.clearWatch(watchId.current);

    const options = {
      enableHighAccuracy: highAccuracy,
      timeout: 30000, // 30s timeout for stability
      maximumAge: 0
    };

    const handleSuccess = (pos) => {
      const newPos = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      setCurrentPosition(newPos);
      setIsGpsReady(true);
      localStorage.setItem('last_fems_pos', JSON.stringify(newPos));
    };

    const handleError = (err) => {
      console.warn(`GPS Warning (${err.code}): ${err.message}`);
      
      // Fallback: If High Accuracy fails (Code 1 or 3), try again with low accuracy
      if (highAccuracy && (err.code === 1 || err.code === 3)) {
        console.log("Switching to Low Accuracy Geolocation...");
        startTracking(false);
      }
      
      // Automatic Restart on Timeout (Code 3)
      if (err.code === 3) {
        setTimeout(() => startTracking(highAccuracy), 5000);
      }
    };

    watchId.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    startTracking(true); // Initial high-accuracy start

    return () => {
      clearInterval(timer);
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [taskRes, histRes] = await Promise.all([
        employeeApi.getMyTasks(),
        attendanceApi.getHistory()
      ]);
      setTasks(taskRes.data || []);
      setHistory(histRes.data || []);
      const active = (histRes.data || []).find(h => !h.clockOutTime);
      setIsClockedIn(!!active);
      setActiveShift(active || null);
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync position every 10s to backend
  useEffect(() => {
    let syncInterval;
    if (isClockedIn && currentPosition) {
       syncInterval = setInterval(() => {
         const activeTask = tasks.find(t => t.status === 'IN_PROGRESS');
         employeeApi.updateLocation(currentPosition.lat, currentPosition.lon, activeTask?.clientId).catch(() => {});
       }, 10000);
    }
    return () => clearInterval(syncInterval);
  }, [isClockedIn, currentPosition]);

  const handleClockIn = async () => {
    if (!currentPosition) return toast.error("Standby for GPS signal...");
    setLoading(true);
    try {
      await attendanceApi.clockIn(currentPosition.lat, currentPosition.lon);
      toast.success("Shift Authorized");
      await loadData();
    } catch (err) {
      toast.error("Deployment failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await attendanceApi.clockOut();
      toast.success("Shift Terminated");
      await loadData();
    } catch (err) {
      toast.error("Cleanup failed");
    } finally {
      setLoading(false);
    }
  };

  const getDistance = (clientLat, clientLon) => {
    if (!currentPosition || !clientLat || !clientLon) return null;
    const R = 6371e3;
    const φ1 = currentPosition.lat * Math.PI/180;
    const φ2 = clientLat * Math.PI/180;
    const Δφ = (clientLat-currentPosition.lat) * Math.PI/180;
    const Δλ = (clientLon-currentPosition.lon) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))); 
  };

  const activeTask = tasks.find(t => t.status === 'IN_PROGRESS' && t.clientLatitude);

  const farTasksCount = tasks.filter(t => {
    const dist = getDistance(t.clientLatitude, t.clientLongitude);
    return dist !== null && dist > 30000 && (t.status === 'IN_PROGRESS' || t.status === 'PENDING');
  }).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans antialiased overflow-x-hidden">
      <Toaster position="top-right" />

      {/* Header */}
      <nav className="sticky top-0 z-[100] px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
         <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">F</div>
               <span className="font-extrabold text-lg tracking-tight">EMPLOYEE STATUS</span>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                  <User size={14} className="text-slate-400" />
                  <span className="text-xs font-bold whitespace-nowrap">{user?.name}</span>
               </div>
               <button onClick={() => window.location.href = '/login'} className="p-2 text-slate-500 hover:text-white transition-colors group">
                  <Power size={18} className="group-hover:text-rose-500 transition-colors" />
               </button>
            </div>
         </div>
      </nav>

      <main className="container mx-auto px-6 py-10 space-y-10 max-w-7xl animate-fadeIn">
        
        {/* Connection/GPS Indicator */}
        {!isGpsReady && !currentPosition && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
             <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Getting live location...</p>
          </div>
        )}

        {/* Status Dashboard */}
        <section className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-indigo-500">
              <Clock size={120} />
           </div>

           <div className="space-y-1 text-center md:text-left z-10">
              <div className="flex items-center justify-center md:justify-start gap-2.5 mb-2">
                 <div className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-slate-700'}`}></div>
                 <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{isClockedIn ? 'Operational' : 'Off-Duty'}</span>
              </div>
              <h2 className="text-4xl font-extrabold text-white tracking-tighter">Shift Status</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">{currentTime.toLocaleTimeString()}</p>
           </div>

           <div className="flex items-center gap-4 z-10">
              {!isClockedIn ? (
                <button onClick={handleClockIn} disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-5 rounded-[1.5rem] font-extrabold text-lg flex items-center gap-4 transition-all active:scale-95 shadow-xl shadow-emerald-500/20">
                  <Play size={24} fill="currentColor" /> Start work
                </button>
              ) : (
                <button onClick={handleClockOut} disabled={loading} className="bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white px-10 py-5 rounded-[1.5rem] font-extrabold text-lg flex items-center gap-4 transition-all active:scale-95 border border-slate-700 hover:border-rose-500 group">
                   <StopCircle size={24} className="group-hover:scale-110 transition-transform" /> End work
                </button>
              )}
           </div>
        </section>

        {/* Universal Tracking Map */}
        {isClockedIn && currentPosition && (
          <section className="bg-slate-900 rounded-[3rem] overflow-hidden border border-slate-800 p-1 shadow-2xl">
             <div className="bg-slate-950 p-6 flex flex-wrap items-center justify-between gap-6 border-b border-slate-800">
                <div className="flex items-center gap-5">
                   <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20 shadow-inner"><Navigation size={24} /></div>
                   <div>
                      <h3 className="font-extrabold text-xl text-white tracking-tight leading-none mb-1.5">{activeTask ? 'En Route' : 'Stationary'}</h3>
                      <p className="text-xs text-slate-500 font-medium italic"><LocationLabel lat={currentPosition.lat} lon={currentPosition.lon} /></p>
                   </div>
                </div>
                {activeTask && (
                   <div className="px-6 py-3 bg-indigo-600 rounded-2xl text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-4 border border-indigo-400/20">
                      <span className="uppercase tracking-tighter">{(getDistance(activeTask.clientLatitude, activeTask.clientLongitude) / 1000).toFixed(2)} km left</span>
                      <div className="w-[1px] h-4 bg-white/20"></div>
                      <button onClick={() => setAutoFollow(!autoFollow)} className={`p-1.5 rounded-lg transition-all ${autoFollow ? 'bg-indigo-400 shadow-inner' : 'bg-slate-800 opacity-50'}`}><MapIcon size={16} /></button>
                   </div>
                )}
             </div>
             
             <div className="h-[500px] relative">
                <MapContainer center={[currentPosition.lat, currentPosition.lon]} zoom={15} className="h-full w-full grayscale-[0.2] brightness-[0.9]">
                   <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                   {activeTask && <RoutingMachine from={[currentPosition.lat, currentPosition.lon]} to={[activeTask.clientLatitude, activeTask.clientLongitude]} />}
                   <NavigationSystem employee={user} followMode={autoFollow} />
                   
                   {activeTask && (
                     <Marker position={[activeTask.clientLatitude, activeTask.clientLongitude]} icon={L.divIcon({ html: `<div class="w-5 h-5 bg-rose-500 border-4 border-white rounded-full shadow-[0_0_15px_#f43f5e]"></div>`, className: 'dest', iconSize:[20,20], iconAnchor:[10,10] })}>
                        <Popup className="custom-popup">{activeTask.clientName}</Popup>
                     </Marker>
                   )}
                </MapContainer>
             </div>
          </section>
        )}

        {/* Task Dashboard */}
        <section className="space-y-8 pt-4">
           <h3 className="text-3xl font-extrabold text-white flex items-center gap-4 px-2 tracking-tighter uppercase">
              <LayoutDashboard size={28} className="text-indigo-500" /> Active Tasks
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tasks.map(t => (
                <TaskCard key={t.id} task={t} gpsAvailable={isGpsReady && currentPosition} onAction={async (tid, status) => {
                   if (status === 'IN_PROGRESS' && (!currentPosition?.lat || !currentPosition?.lon || isNaN(currentPosition.lat) || isNaN(currentPosition.lon))) {
                      return toast.error("GPS SIGNAL REQUIRED: Please stand by for valid location before starting tasks.");
                   }
                   try {
                     await employeeApi.updateTaskStatus(tid, status, currentPosition?.lat, currentPosition?.lon);
                     toast.success("Log Entry Updated");
                     loadData();
                   } catch(e) { 
                     const errorMsg = e.response?.data?.message || "Transmission Failed";
                     toast.error(errorMsg); 
                   }
                }} distance={currentPosition ? getDistance(t.clientLatitude, t.clientLongitude) : null}
                 farTasksCount={farTasksCount}
              />
              ))}
              {tasks.length === 0 && (
                <div className="col-span-full py-24 bg-slate-900/50 rounded-[3rem] border-2 border-slate-800 border-dashed text-center">
                   <p className="text-slate-500 font-extrabold uppercase tracking-[0.3em] text-[10px]">No Active Tasks</p>
                </div>
              )}
           </div>
        </section>

        {/* Activity Ledger */}
        <section className="space-y-8">
           <h3 className="text-3xl font-extrabold text-white flex items-center gap-4 px-2 tracking-tighter uppercase">
              <History size={28} className="text-indigo-500" /> Recent Location
           </h3>
           <div className="bg-slate-900 rounded-[3rem] border border-slate-800 overflow-hidden divide-y divide-slate-800/50 shadow-2xl">
              {history.slice(0, 5).map(h => (
                <div key={h.id} className="p-8 flex items-center justify-between hover:bg-slate-800/40 transition-all group">
                   <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-slate-600 border border-slate-800 transition-colors group-hover:border-indigo-500/30 group-hover:text-indigo-500"><MapPin size={22} /></div>
                      <div>
                         <p className="text-sm font-extrabold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight"><LocationLabel lat={h.latitude} lon={h.longitude} /></p>
                         <p className="text-[10px] text-slate-600 mt-1.5 font-mono tracking-widest">{new Date(h.clockInTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      </div>
                   </div>
                   <ChevronRight className="text-slate-800 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
              {history.length === 0 && <p className="p-20 text-center text-slate-700 font-bold uppercase text-[10px] tracking-widest">No verified entries</p>}
           </div>
        </section>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
