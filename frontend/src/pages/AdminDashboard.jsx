import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { adminApi, attendanceApi } from '../services/api';
import { 
  Users, Briefcase, LayoutDashboard, History, Map as MapIcon, 
  PlusCircle, Trash2, MapPin, Clock, Search, Filter, Navigation, Mail, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskCard from '../components/TaskCard';
import { toast, Toaster } from 'react-hot-toast';
import LocationLabel from '../components/LocationLabel';

// --- CSS for Premium Visuals ---
const customStyles = `
  .smooth-marker {
    transition: all 2s linear;
  }
  .marker-glow {
    position: relative;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
  }
  .marker-glow::after {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border-radius: 50%;
    opacity: 0.4;
    animation: marker-pulse 2s infinite;
  }
  @keyframes marker-pulse {
    0% { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(2.5); opacity: 0; }
  }
  .client-marker-red {
    background-color: #ef4444;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
  }
  .client-marker-green {
    background-color: #10b981;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.7);
    animation: highlight-pulse 1.5s infinite;
  }
  @keyframes highlight-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
`;

// --- Helper: Haversine Distance ---
const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};

// --- Component: Smoothly Moving Marker ---
const SmoothMarker = ({ position, icon, children, markerRef }) => {
  const [currentPos, setCurrentPos] = useState(position);
  
  useEffect(() => {
    if (!position) return;
    // For fleet-tracking effect, we interpolate
    // Since updates are every 10s, we move over 2s to feel "live"
    let start = null;
    const duration = 2000;
    const initialPos = [...currentPos];
    const targetPos = [...position];

    if (initialPos[0] === targetPos[0] && initialPos[1] === targetPos[1]) return;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      
      const nextLat = initialPos[0] + (targetPos[0] - initialPos[0]) * progress;
      const nextLon = initialPos[1] + (targetPos[1] - initialPos[1]) * progress;
      
      setCurrentPos([nextLat, nextLon]);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [position]);

  return (
    <Marker position={currentPos} icon={icon} ref={markerRef}>
      {children}
    </Marker>
  );
};

const AdminDashboard = () => {
  const location = useLocation();

  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/map')) return 'map';
    if (path.includes('/employees')) return 'employees';
    if (path.includes('/clients')) return 'clients';
    if (path.includes('/attendance')) return 'history';
    return 'tasks';
  };

  const activeTab = getTabFromPath();
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [activeLocations, setActiveLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Selection
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');

  // Refs
  const markerRefs = useRef({});
  const lastProximityAlert = useRef({}); // { empId-cliId: timestamp }

  // Forms
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: 'emp123', phone: '' });
  const [newClient, setNewClient] = useState({ name: '', email: '', password: 'client123', contactPerson: '', address: '', phone: '', latitude: 11.9416, longitude: 79.8083 });
  const [newTask, setNewTask] = useState({ employeeId: '', clientId: '', title: '', description: '' });

  const staticClients = useMemo(() => [
    { id: 'c1', name: "White Town HQ", latitude: 11.9369, longitude: 79.8340 },
    { id: 'c2', name: "Lawspet Logistics", latitude: 11.9580, longitude: 79.8083 },
    { id: 'c3', name: "Reddiarpalayam Hub", latitude: 11.9252, longitude: 79.8000 },
    { id: 'c4', name: "Muthialpet Site", latitude: 11.9485, longitude: 79.8250 },
    { id: 'c5', name: "Villianur Center", latitude: 11.9035, longitude: 79.7615 },
    { id: 'c6', name: "Ariyankuppam Station", latitude: 11.8830, longitude: 79.8170 },
    { id: 'c7', name: "Mudaliarpet Depot", latitude: 11.9160, longitude: 79.8200 }
  ], []);

  // --- Dynamic Visualization Logic ---
  
  const empColors = useMemo(() => ({
    0: '#6366f1', 1: '#f59e0b', 2: '#10b981', 3: '#ec4899', 
    4: '#8b5cf6', 5: '#06b6d4', 6: '#f97316'
  }), []);

  const getEmployeeIcon = useCallback((id, isActive) => {
    const color = isActive ? (empColors[id % 7] || '#6366f1') : '#94a3b8';
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="marker-glow ${isActive ? 'pulse-glow' : ''}" style="background-color: ${color}; border-color: white;">
          <style>
            .pulse-glow::after { background-color: ${color}; }
          </style>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }, [empColors]);

  const getClientIcon = useCallback((isHighlighted) => {
    return L.divIcon({
      className: `client-marker-${isHighlighted ? 'green' : 'red'}`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  }, []);

  const ChangeMapView = () => {
    const map = useMap();
    useEffect(() => {
      if (selectedEmployeeId) {
        const loc = activeLocations.find(l => String(l.employee?.id) === String(selectedEmployeeId));
        if (loc) {
          map.flyTo([loc.latitude, loc.longitude], 15, { animate: true });
          setTimeout(() => markerRefs.current[`emp-${selectedEmployeeId}`]?.openPopup(), 600);
        }
      } else if (selectedClientId) {
        let target = clients.find(c => String(c.id) === String(selectedClientId)) || staticClients.find(c => String(c.id) === String(selectedClientId));
        if (target && target.latitude) {
          map.flyTo([target.latitude, target.longitude], 15, { animate: true });
          setTimeout(() => markerRefs.current[`cli-${selectedClientId}`]?.openPopup(), 600);
        }
      }
    }, [selectedEmployeeId, selectedClientId, activeLocations, map, clients, staticClients]);
    return null;
  };

  // --- Range Monitoring ---
  useEffect(() => {
    if (selectedEmployeeId) {
      const empLoc = activeLocations.find(l => String(l.employee?.id) === String(selectedEmployeeId));
      if (empLoc) {
        clients.concat(staticClients).forEach(client => {
          const dist = getDistance(empLoc.latitude, empLoc.longitude, client.latitude, client.longitude);
          const alertKey = `${selectedEmployeeId}-${client.id}`;
          if (dist <= 50 && (!lastProximityAlert.current[alertKey] || Date.now() - lastProximityAlert.current[alertKey] > 300000)) {
            toast.success(`Agent ${empLoc.employee?.user?.name} is near ${client.user?.name || client.name}!`, { icon: '📍' });
            lastProximityAlert.current[alertKey] = Date.now();
          }
        });
      }
    }
  }, [activeLocations, selectedEmployeeId, clients, staticClients]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, cliRes, taskRes, attRes, locRes] = await Promise.all([
        adminApi.getEmployees(),
        adminApi.getClients(),
        adminApi.getAllTasks(),
        attendanceApi.getAllHistory(),
        attendanceApi.getActiveLocations()
      ]);
      setEmployees(empRes.data);
      setClients(cliRes.data);
      setTasks(taskRes.data);
      setAttendance(attRes.data);
      setActiveLocations(locRes.data);
    } catch (e) {
      toast.error('Sync Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData, activeTab]);

  useEffect(() => {
    let interval;
    if (activeTab === 'map') {
       interval = setInterval(async () => {
         try {
           const locData = await attendanceApi.getActiveLocations();
           setActiveLocations(locData.data);
         } catch (e) {}
       }, 10000); 
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createEmployee(newEmployee);
      setNewEmployee({ name: '', email: '', password: 'emp123', phone: '' });
      toast.success('Onboarded');
      loadData();
    } catch (err) { toast.error('Fail'); }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createClient(newClient);
      setNewClient({ name: '', email: '', password: 'client123', contactPerson: '', address: '', phone: '', latitude: 11.9416, longitude: 79.8083 });
      toast.success('Registered');
      loadData();
    } catch (err) { toast.error('Fail'); }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createTask(newTask);
      setNewTask({ employeeId: '', clientId: '', title: '', description: '' });
      toast.success('Assigned');
      loadData();
    } catch (err) { toast.error('Fail'); }
  };

  const handleDeleteEmployee = async (id) => {
    if (confirm('Delete?')) {
      try {
        await adminApi.deleteEmployee(id);
        toast.success('Removed');
        loadData();
      } catch (err) { toast.error('Fail'); }
    }
  };

  const handleDeleteClient = async (id) => {
    if (confirm('Delete?')) {
      try {
        await adminApi.deleteClient(id);
        toast.success('Removed');
        loadData();
      } catch (err) { toast.error('Fail'); }
    }
  };

  // --- Render Map Segment ---
  const renderMap = () => {
    const selectedEmpLoc = activeLocations.find(l => String(l.employee?.id) === String(selectedEmployeeId));

    return (
      <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <style>{customStyles}</style>
        <div className="p-6 bg-slate-900 shadow-2xl rounded-[2.5rem] border border-slate-800 flex flex-wrap items-center justify-between gap-6 backdrop-blur-3xl">
           <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Agent Tracking</label>
                <select className="bg-slate-950 border border-slate-800 text-white text-sm rounded-2xl px-5 py-3 focus:border-indigo-500 outline-none transition-all shadow-inner min-w-[200px]" value={selectedEmployeeId} onChange={e => { setSelectedEmployeeId(e.target.value); setSelectedClientId(''); }}>
                  <option value="">Fleet Overview</option>
                  {activeLocations.map(loc => <option key={loc.employee?.id} value={loc.employee?.id}>{loc.employee?.user?.name}</option>)}
                  {employees.filter(e => !activeLocations.some(l => l.employee?.id === e.id)).map(e => <option key={e.id} value={e.id}>{e.user?.name} (Offline)</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Destination Focus</label>
                <select className="bg-slate-950 border border-slate-800 text-white text-sm rounded-2xl px-5 py-3 focus:border-indigo-500 outline-none transition-all shadow-inner min-w-[200px]" value={selectedClientId} onChange={e => { setSelectedClientId(e.target.value); setSelectedEmployeeId(''); }}>
                  <option value="">All Sites</option>
                  {clients.concat(staticClients).map(c => <option key={c.id} value={c.id}>{c.user?.name || c.name}</option>)}
                </select>
              </div>
           </div>
           {selectedEmployeeId && (
             <div className="flex items-center gap-3 bg-indigo-500/10 px-6 py-3 rounded-full border border-indigo-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-indigo-400">Tracking Active: Nearby sites highlighted</span>
             </div>
           )}
        </div>

        <div className="h-[70vh] rounded-[3rem] overflow-hidden border border-slate-800 relative shadow-2xl group">
          <MapContainer center={[11.9416, 79.8083]} zoom={13} className="h-full w-full z-10">
            <ChangeMapView />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            
            {activeLocations.map(loc => {
              const isTasking = tasks.some(t => t.status === 'IN_PROGRESS' && String(t.employee?.id) === String(loc.employee?.id));
              return (
                <SmoothMarker 
                  key={`emp-marker-${loc.id}`}
                  markerRef={(r) => markerRefs.current[`emp-${loc.employee?.id}`] = r}
                  position={[loc.latitude, loc.longitude]} 
                  icon={getEmployeeIcon(loc.employee?.id, isTasking)}
                >
                  <Popup className="custom-popup">
                    <div className="p-4 min-w-[220px] bg-white rounded-2xl shadow-xl">
                      <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold">{loc.employee?.user?.name?.[0]}</div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 leading-tight">{loc.employee?.user?.name}</h4>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isTasking ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {isTasking ? 'Active Tasking' : 'Operational Idle'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                            <Mail size={14} className="text-indigo-500" /> {loc.employee?.user?.email}
                         </div>
                         <div className="flex items-start gap-2 text-xs text-slate-600 font-semibold bg-slate-50 p-2 rounded-xl border border-slate-100 italic">
                            <MapPin size={14} className="text-indigo-500 mt-0.5" /> 
                            <LocationLabel lat={loc.latitude} lon={loc.longitude} />
                         </div>
                      </div>
                    </div>
                  </Popup>
                </SmoothMarker>
              );
            })}

            {clients.concat(staticClients).map(client => {
              let isNearby = false;
              let currentDist = null;
              if (selectedEmpLoc) {
                currentDist = getDistance(selectedEmpLoc.latitude, selectedEmpLoc.longitude, client.latitude, client.longitude);
                isNearby = currentDist <= 50;
              }

              return (
                <Marker 
                  key={`cli-${client.id}`} 
                  ref={(r) => markerRefs.current[`cli-${client.id}`] = r}
                  position={[client.latitude, client.longitude]} 
                  icon={getClientIcon(isNearby)}
                >
                  <Popup>
                    <div className="p-4 text-center min-w-[200px]">
                      <h4 className="font-extrabold text-slate-900 border-b border-slate-100 pb-2 mb-2">{client.user?.name || client.name}</h4>
                      <p className="text-xs text-slate-500 font-medium mb-3 italic">{client.address || 'Field Site'}</p>
                      
                      {currentDist !== null && (
                         <div className={`mb-4 px-3 py-1.5 rounded-full text-xs font-bold border ${isNearby ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                            {isNearby ? 'Inside Priority Range' : 'Outside Ops Range'}
                            <div className="text-[10px] opacity-70">{currentDist.toFixed(2)} km away</div>
                         </div>
                      )}
                      
                      <button onClick={() => { setSelectedClientId(String(client.id)); setSelectedEmployeeId(''); }} className="w-full text-[10px] font-bold text-indigo-600 uppercase tracking-widest border border-indigo-200 px-3 py-2.5 rounded-xl hover:bg-indigo-50 transition-all">Lock GPS Deployment</button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6 container mx-auto px-4 max-w-7xl animate-fadeIn">
      <Toaster position="top-right" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight capitalize select-none">
            {activeTab.replace('-', ' ')} <span className="text-indigo-500">.</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic"></p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'map' && renderMap()}

        {activeTab === 'tasks' && (
          <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1 border border-slate-800 bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-8 h-fit sticky top-24 shadow-2xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3"><PlusCircle size={22} className="text-indigo-500"/> Assign Work</h3>
                <form onSubmit={handleCreateTask} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Select Employee</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:border-indigo-500 transition-all outline-none" value={newTask.employeeId} onChange={e => setNewTask({...newTask, employeeId: e.target.value})} required>
                      <option value="">Choose Employee</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.user?.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Select Client</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:border-indigo-500 transition-all outline-none" value={newTask.clientId} onChange={e => setNewTask({...newTask, clientId: e.target.value})} required>
                      <option value="">Choose Site</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.user?.name}</option>)}
                    </select>
                  </div>
                  <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all" placeholder="Project Name" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
                  <textarea rows="3" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all" placeholder="Field Instructions" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} required />
                  <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                    <PlusCircle size={20} /> Deploy Agent
                  </button>
                </form>
             </div>
             <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold flex items-center gap-3"><LayoutDashboard size={24} className="text-indigo-400"/> Operation Board</h3>
                  <span className="text-xs font-mono text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">{tasks.length} Active Tasks</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tasks.map(t => <TaskCard key={t.id} task={t} />)}
                  {tasks.length === 0 && (
                    <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem] text-slate-600">
                      <Briefcase size={48} className="mx-auto mb-4 opacity-10" />
                      <p className="text-lg italic">No active field operations found.</p>
                    </div>
                  )}
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'employees' && (
          <motion.div key="employees" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1 border border-slate-800 bg-slate-900/40 rounded-[2rem] p-8 shadow-2xl h-fit">
               <h3 className="text-xl font-bold mb-6 flex items-center gap-3">Add New Agent</h3>
               <form onSubmit={handleCreateEmployee} className="space-y-4">
                  <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white" placeholder="Full Name" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} required />
                  <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white" placeholder="Email Address" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} required />
                  <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white" type="password" placeholder="Passcode" value={newEmployee.password} onChange={e => setNewEmployee({...newEmployee, password: e.target.value})} required />
                  <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white" placeholder="Mobile" value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})} required />
                  <button type="submit" className="w-full bg-white text-slate-950 font-extrabold py-4 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 shadow-xl">Confirm Onboarding</button>
               </form>
             </div>
             <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {employees.map(e => (
                  <div key={e.id} className="p-6 bg-slate-900/60 border border-slate-800 rounded-[2rem] flex items-center justify-between group hover:border-indigo-500/30 transition-all shadow-lg hover:shadow-indigo-500/5">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/20 rounded-2xl flex items-center justify-center font-bold text-indigo-400 text-xl uppercase tracking-tighter shadow-inner">{e.user?.name?.[0]}</div>
                      <div>
                        <h4 className="font-bold text-white text-lg">{e.user?.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium tracking-wide italic">
                           <Clock size={12} /> Last Seen: Today
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteEmployee(e.id)} className="p-3 text-slate-600 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 bg-slate-950 rounded-xl"><Trash2 size={20}/></button>
                  </div>
                ))}
             </div>
          </motion.div>
        )}

        {activeTab === 'clients' && (
           <motion.div key="clients" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 border border-slate-800 bg-slate-900/40 rounded-[2rem] p-8 shadow-2xl h-fit">
                <h3 className="text-xl font-bold mb-6">Register Major Client</h3>
                <form onSubmit={handleCreateClient} className="space-y-4">
                   <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white" placeholder="Brand / Organization" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} required />
                   <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white" placeholder="Official Email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} required />
                   <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white" type="password" placeholder="Access Code" value={newClient.password} onChange={e => setNewClient({...newClient, password: e.target.value})} required />
                   <div className="grid grid-cols-2 gap-3">
                      <input type="number" step="0.000001" className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs" placeholder="Lat" value={newClient.latitude} onChange={e => setNewClient({...newClient, latitude: parseFloat(e.target.value)})} required />
                      <input type="number" step="0.000001" className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs" placeholder="Lon" value={newClient.longitude} onChange={e => setNewClient({...newClient, longitude: parseFloat(e.target.value)})} required />
                   </div>
                   <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 rounded-2xl transition-all shadow-xl shadow-emerald-900/20 active:scale-95">Establish Contract</button>
                </form>
              </div>
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                 {clients.map(c => (
                   <div key={c.id} className="p-6 bg-slate-900/60 border border-slate-800 rounded-[2rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all shadow-lg">
                     <div className="flex items-center gap-5">
                       <div className="w-14 h-14 bg-emerald-600/20 border border-emerald-500/20 rounded-2xl flex items-center justify-center font-bold text-emerald-400 text-xl uppercase tracking-tighter">{c.user?.name?.[0]}</div>
                       <div>
                         <h4 className="font-bold text-white text-lg">{c.user?.name}</h4>
                         <p className="text-xs text-slate-500 font-medium italic underline decoration-slate-800 underline-offset-4">{c.user?.email}</p>
                       </div>
                     </div>
                     <button onClick={() => handleDeleteClient(c.id)} className="p-3 text-slate-600 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 bg-slate-950 rounded-xl"><Trash2 size={20}/></button>
                   </div>
                 ))}
              </div>
           </motion.div>
        )}

        {activeTab === 'history' && (
           <motion.div key="history" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900/40 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-xl">
             <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
                <h3 className="text-2xl font-bold flex items-center gap-4"><History className="text-indigo-400" /> Attendance Ledger</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-800/40 px-4 py-2 rounded-full border border-slate-700/50 italic">
                   Showing all records from current epoch
                </div>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-separate border-spacing-0">
                 <thead>
                   <tr className="bg-slate-950/40">
                     <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Agent Details</th>
                     <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Deployment Stamped</th>
                     <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Retrieval Stamped</th>
                     <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Last GPS Fix</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/40">
                   {attendance.map(a => (
                     <tr key={a.id} className="hover:bg-slate-800/30 transition-all group">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">{a.employee?.user?.name?.[0]}</div>
                             <span className="font-extrabold text-slate-200 group-hover:text-indigo-300 transition-colors uppercase text-sm tracking-tight">{a.employee?.user?.name}</span>
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          <div className="flex flex-col">
                             <span className="text-sm text-slate-300 font-bold">{a.clockInTime ? new Date(a.clockInTime).toLocaleDateString() : 'N/A'}</span>
                             <span className="text-[10px] text-slate-500 font-mono tracking-widest">{a.clockInTime ? new Date(a.clockInTime).toLocaleTimeString() : '-'}</span>
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          {a.clockOutTime ? (
                            <div className="flex flex-col">
                               <span className="text-sm text-slate-300 font-bold">{new Date(a.clockOutTime).toLocaleDateString()}</span>
                               <span className="text-[10px] text-slate-500 font-mono tracking-widest">{new Date(a.clockOutTime).toLocaleTimeString()}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                               <span className="text-[10px] text-emerald-400 font-extrabold tracking-widest uppercase italic">Operational</span>
                            </div>
                          )}
                       </td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                             <LocationLabel lat={a.latitude} lon={a.longitude} className="text-xs text-indigo-400/80 bg-indigo-500/5 px-3 py-1.5 rounded-lg border border-indigo-500/10 font-mono" />
                           </div>
                        </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
