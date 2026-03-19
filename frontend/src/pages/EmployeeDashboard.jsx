import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, StopCircle, Clock, MapPin, 
  CheckCircle2, AlertCircle, History, LayoutDashboard, Navigation, XCircle, CheckCircle
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
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPosition, setCurrentPosition] = useState(null);
  const [autoFollow, setAutoFollow] = useState(true); // Control mode

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Live tracking for geo-fencing checks
    const geoId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setCurrentPosition(coords);
      },
      (err) => {
        if (err.code === 3) console.warn("GPS Timeout during sync watcher.");
        else console.error("Critical location tracking error", err);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    return () => {
      clearInterval(timer);
      navigator.geolocation.clearWatch(geoId);
    };
  }, []);

  // Production Tracking Loop (5-10s)
  useEffect(() => {
    let interval;
    if (isClockedIn && currentPosition) {
       interval = setInterval(() => {
         employeeApi.updateLocation(currentPosition.lat, currentPosition.lon)
           .catch(e => console.error("Tracking Error", e));
       }, 10000); // 10s polling
    }
    return () => clearInterval(interval);
  }, [isClockedIn, currentPosition]);

  const getDistance = (clientLat, clientLon) => {
    if (!currentPosition || !clientLat || !clientLon) return null;
    const R = 6371; // km
    const dLat = (clientLat - currentPosition.lat) * Math.PI / 180;
    const dLon = (clientLon - currentPosition.lon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(currentPosition.lat * Math.PI / 180) * Math.cos(clientLat * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Return distance in meters
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const tResp = await employeeApi.getMyTasks();
      setTasks(tResp.data);
      
      const hResp = await attendanceApi.getHistory();
      setHistory(hResp.data);
      
      const active = hResp.data.find(a => !a.clockOutTime);
      if (active) {
        setIsClockedIn(true);
        setActiveShift(active);
      }
    } catch (e) {
      console.error('Error loading employee data', e);
      setError('Failed to sync workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation not supported by browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await attendanceApi.clockIn(pos.coords.latitude, pos.coords.longitude);
          setIsClockedIn(true);
          loadData();
        } catch (e) {
          setError('Network error: Could not signal shift start');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Location permission denied. Mandatory for field work.');
        setLoading(false);
      }
    );
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      await attendanceApi.clockOut();
      setIsClockedIn(false);
      setActiveShift(null);
      loadData();
    } catch (e) {
      setError('Failed to record shift end');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = (taskId) => {
    handleTaskAction(taskId, 'IN_PROGRESS');
  };

  const handleStopTask = (taskId) => {
    handleTaskAction(taskId, 'COMPLETED');
  };
  const handleTaskAction = async (taskId, nextStatus) => {
    setLoading(true);
    setError(null);
    try {
      if (nextStatus === 'IN_PROGRESS') {
        if (!currentPosition) {
           toast.error("Waiting for GPS signal...");
           setLoading(false);
           return;
        }
        await employeeApi.updateTaskStatus(taskId, nextStatus, currentPosition.lat, currentPosition.lon);
        toast.success("Task started! Drive safe.");
      } else {
        await employeeApi.updateTaskStatus(taskId, nextStatus);
        toast.success("Task completed! Good job.");
      }
      loadData();
    } catch (e) {
      console.error('Task action failed', e);
      const msg = e.response?.data?.message || "Action failed";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusButton = (task) => {
    if (task.status === 'COMPLETED') return <span className="text-slate-500 font-bold px-4 py-2 bg-slate-800/50 rounded-lg text-sm">Completed</span>;
    if (task.status === 'IN_PROGRESS') {
      return (
        <button
          onClick={() => handleTaskAction(task.id, 'COMPLETED')}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-rose-600/20"
        >
          <XCircle size={16} /> Stop Task
        </button>
      );
    }
    return (
      <button
        onClick={() => handleTaskAction(task.id, 'IN_PROGRESS')}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/20"
      >
        <CheckCircle size={16} /> Start Task
      </button>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn relative">
      <Toaster position="top-right" />
      {/* Shift Control Header */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[80px] -z-10"></div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{isClockedIn ? 'On Duty' : 'Off Duty'}</span>
               </div>
               <h2 className="text-4xl font-extrabold tracking-tight">Attendance <span className="text-indigo-500 text-5xl"></span></h2>
               <div className="flex items-center gap-6 text-slate-400">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase font-bold text-slate-600">Local Time</span>
                    <span className="text-xl font-mono text-slate-200">{currentTime.toLocaleTimeString()}</span>
                  </div>
                  {isClockedIn && activeShift && (
                    <div className="flex flex-col border-l border-slate-800 pl-6">
                      <span className="text-xs uppercase font-bold text-slate-600">Working Since</span>
                      <span className="text-xl font-mono text-emerald-400">
                        {activeShift.clockInTime ? new Date(activeShift.clockInTime).toLocaleTimeString() : '...'}
                      </span>
                    </div>
                  )}
               </div>
               {error && (
                 <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm italic">
                    <AlertCircle size={16} /> {error}
                 </motion.div>
               )}
            </div>

            <div className="flex flex-col gap-4">
               {isClockedIn ? (
                 <button 
                   onClick={handleClockOut}
                   disabled={loading}
                   className="group bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white p-1 rounded-2xl flex items-center shadow-lg shadow-rose-900/20 transition-all active:scale-95 overflow-hidden"
                 >
                    <div className="w-16 h-16 bg-white/10 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform">
                       <StopCircle size={28} />
                    </div>
                    <div className="flex-1 px-6 text-left">
                       <p className="font-bold text-lg">Stop Work Shift</p>
                       <p className="text-xs text-rose-100 opacity-70 italic font-medium">Record final status</p>
                    </div>
                 </button>
               ) : (
                 <button 
                    onClick={handleClockIn}
                    disabled={loading}
                    className="group bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-1 rounded-2xl flex items-center shadow-lg shadow-indigo-900/20 transition-all active:scale-95 overflow-hidden"
                 >
                    <div className="w-16 h-16 bg-white/10 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform">
                       <Play size={28} fill="currentColor" />
                    </div>
                    <div className="flex-1 px-6 text-left">
                       <p className="font-bold text-lg">Start Work Shift</p>
                       <p className="text-xs text-indigo-100 opacity-70 italic font-medium">Auto-captures location</p>
                    </div>
                 </button>
               )}
            </div>
         </div>
      </section>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <main className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-2xl font-bold flex items-center gap-3"><LayoutDashboard className="text-indigo-400" /> Active Assignments</h3>
               <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/20">{tasks.length} total</span>
            </div>

            {/* Active Navigation Map */}
            {(() => {
              const activeTask = tasks.find(t => t.status === 'IN_PROGRESS' && t.clientLatitude);
              if (!activeTask) return null;

              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                  <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] p-6 flex flex-col md:flex-row gap-8 items-center overflow-hidden">
                    <div className="flex-1 w-full text-center md:text-left relative">
                      <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                        <Navigation className={`text-indigo-400 ${autoFollow ? 'animate-pulse' : ''}`} size={20} />
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                          {autoFollow ? 'Auto-Follow Active' : 'Free Exploration Mode'}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2 underline decoration-indigo-500/30 underline-offset-8">Heading to Site</h3>
                      <p className="text-slate-400 text-sm italic font-medium truncate mb-2">Target: {activeTask.clientName}</p>
                      
                      {(() => {
                        const distMeters = getDistance(activeTask.clientLatitude, activeTask.clientLongitude);
                        if (distMeters === null) return null;
                        const distKm = (distMeters / 1000).toFixed(2);
                        return (
                          <div className="text-indigo-400 font-extrabold text-3xl mb-4 tracking-tighter">
                            {distKm} <span className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold ml-1">km to site</span>
                          </div>
                        );
                      })()}
                      
                      <button 
                        onClick={() => setAutoFollow(!autoFollow)}
                        className={`text-[10px] font-bold px-6 py-2.5 rounded-full border transition-all active:scale-95 shadow-xl ${
                          autoFollow 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-600/20' 
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                         {autoFollow ? 'LOCKED ON POSITION' : 'ENABLE FOLLOW MODE'}
                      </button>
                    </div>
                    
                    {currentPosition && (
                      <div className="w-full md:w-2/3 h-[300px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative z-10 group">
                        <MapContainer 
                          center={[currentPosition.lat, currentPosition.lon]} 
                          zoom={14} 
                          className="h-full w-full"
                          zoomControl={false}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <RoutingMachine from={[currentPosition.lat, currentPosition.lon]} to={[activeTask.clientLatitude, activeTask.clientLongitude]} />
                          
                          {/* Real-time Navigation Component */}
                          <NavigationSystem employee={user} followMode={autoFollow} />

                          {/* Client Destination Marker - Green if Close */}
                          {(() => {
                            const isNear = getDistance(activeTask.clientLatitude, activeTask.clientLongitude) <= 50000;
                            return (
                              <Marker 
                                position={[activeTask.clientLatitude, activeTask.clientLongitude]} 
                                icon={L.divIcon({ 
                                  html: `
                                    <div style="background:${isNear ? '#10b981' : '#ef4444'}; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow:0 0 15px ${isNear ? '#10b981' : '#ef4444'};">
                                      ${isNear ? '<div class="absolute inset-0 bg-emerald-400 animate-ping opacity-20 rounded-full"></div>' : ''}
                                    </div>
                                  `, 
                                  className: 'pulse-marker',
                                  iconSize: [16, 16], 
                                  iconAnchor: [8, 8] 
                                })}
                              >
                                <Popup>
                                  <div className="text-center p-2">
                                     <h5 className="font-bold text-slate-900 border-b pb-1 mb-1">{activeTask.clientName}</h5>
                                     <span className="text-[10px] text-slate-500">Destination Site</span>
                                  </div>
                                </Popup>
                              </Marker>
                            );
                          })()}
                        </MapContainer>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })()}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {tasks.map((task, idx) => (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                    <TaskCard 
                      task={task} 
                      onAction={handleTaskAction} 
                      distance={getDistance(task.clientLatitude, task.clientLongitude)}
                    />
                  </motion.div>
                ))}
                {tasks.length === 0 && (
                   <div className="col-span-2 py-24 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-500 gap-3">
                      <CheckCircle2 size={48} className="opacity-10" />
                      <p className="font-medium italic">No field tasks assigned at the moment.</p>
                   </div>
                )}
              </AnimatePresence>
            </div>
         </main>

         <aside className="space-y-6 lg:border-l lg:border-slate-800 lg:pl-8">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-bold flex items-center gap-3"><History className="text-indigo-400" /> Recent Shifts</h3>
            </div>
            <div className="space-y-4">
               {history.slice(0, 5).map((shift) => (
                  <div key={shift.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                     <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold">{new Date(shift.clockInTime).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                           <Clock size={12} />
                           <span>{new Date(shift.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           {shift.clockOutTime && (
                             <>
                               <span>→</span>
                               <span>{new Date(shift.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             </>
                           )}
                        </div>
                     </div>
                     <div className="flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/5 px-3 py-1.5 rounded-xl border border-indigo-500/10 shadow-inner">
                        <MapPin size={12} className="text-indigo-500" />
                        <LocationLabel lat={shift.latitude} lon={shift.longitude} />
                     </div>
                  </div>
               ))}
               {history.length === 0 && <p className="text-center py-10 text-slate-600 text-sm italic">New onboarded profile. No logs yet.</p>}
            </div>
         </aside>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
