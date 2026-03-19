import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { adminApi, attendanceApi } from '../services/api';
import { 
  Users, Briefcase, LayoutDashboard, History, Map as MapIcon, 
  PlusCircle, Trash2, MapPin, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import TaskCard from '../components/TaskCard';

// Fix for Leaflet marker icons in Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

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

  // Forms
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: 'emp123', phone: '' });
  const [newClient, setNewClient] = useState({ name: '', email: '', password: 'client123', contactPerson: '', address: '', phone: '', latitude: null, longitude: null });
  const [newTask, setNewTask] = useState({ employeeId: '', clientId: '', title: '', description: '' });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Static Client Data fallback
  const staticClients = [
    { id: 'c1', name: 'Global Tech Solutions', latitude: 11.935, longitude: 79.815 },
    { id: 'c2', name: 'Apex Logistics Hub', latitude: 11.950, longitude: 79.800 },
    { id: 'c3', name: 'Future Retail Corp', latitude: 11.945, longitude: 79.820 },
  ];

  // Helper to check if any employee is near this client
  const isClientNearby = (client) => {
    return activeLocations.some(loc => {
      const cLat = client.latitude || (staticClients.find(sc => sc.name === client.user?.name)?.latitude);
      const cLon = client.longitude || (staticClients.find(sc => sc.name === client.user?.name)?.longitude);
      
      if (!cLat || !loc.latitude) return false;
      const R = 6371;
      const dLat = (cLat - loc.latitude) * Math.PI / 180;
      const dLon = (cLon - loc.longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(loc.latitude * Math.PI / 180) * Math.cos(cLat * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c <= 0.5; // Within 500m
    });
  };

  const getClientIcon = (client) => {
    const nearby = isClientNearby(client);
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style='background-color:${nearby ? "#10b981" : "#ef4444"}; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px ${nearby ? "#10b981" : "#ef4444"};'></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };

  // Map Controller to handle centering ONLY when selectedEmployeeId changes
  const ChangeMapView = () => {
    const map = useMap();
    useEffect(() => {
      if (selectedEmployeeId) {
        const loc = activeLocations.find(l => l.employee?.id === parseInt(selectedEmployeeId));
        if (loc) map.flyTo([loc.latitude, loc.longitude], 15, { animate: true });
      } else if (selectedClientId) {
        // Find in real clients or static
        const client = clients.find(c => c.id === parseInt(selectedClientId)) || staticClients.find(c => c.id === selectedClientId);
        if (client && client.latitude) map.flyTo([client.latitude, client.longitude], 15, { animate: true });
      }
    }, [selectedEmployeeId, selectedClientId, map]);
    return null;
  };

  const getFilteredLocations = () => {
    if (!selectedEmployeeId) return activeLocations;
    return activeLocations.filter(loc => loc.employee?.id === parseInt(selectedEmployeeId));
  };

  const employeeIcon = L.divIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color:#6366f1; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px #6366f1;'></div>",
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tasks' || activeTab === 'employees' || activeTab === 'map') {
        const empsData = await adminApi.getEmployees(); 
        setEmployees(empsData.data);
      }
      if (activeTab === 'tasks' || activeTab === 'clients' || activeTab === 'map') {
        const clsData = await adminApi.getClients(); 
        setClients(clsData.data);
      }
      if (activeTab === 'tasks') {
        const tasksData = await adminApi.getAllTasks(); 
        setTasks(tasksData.data);
      }
      if (activeTab === 'history') {
        const attData = await attendanceApi.getAllHistory();
        setAttendance(attData.data);
      }
      if (activeTab === 'map') {
        const locData = await attendanceApi.getActiveLocations();
        setActiveLocations(locData.data);
      }
    } catch (e) {
      console.error('Error loading admin data', e);
    } finally {
      setLoading(false);
    }
  };

  // Poll for locations if on map tab
  useEffect(() => {
    let interval;
    if (activeTab === 'map') {
       interval = setInterval(async () => {
         try {
           const locData = await attendanceApi.getActiveLocations();
           setActiveLocations(locData.data);
         } catch (e) { console.error('Polling error', e); }
       }, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    await adminApi.createEmployee(newEmployee);
    setNewEmployee({ name: '', email: '', password: 'emp123', phone: '' });
    loadData();
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    await adminApi.createClient(newClient);
    setNewClient({ name: '', email: '', password: 'client123', contactPerson: '', address: '', phone: '', latitude: null, longitude: null });
    loadData();
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    await adminApi.createTask(newTask);
    setNewTask({ employeeId: '', clientId: '', title: '', description: '' });
    loadData();
  };

  const handleDeleteEmployee = async (id) => {
    if (confirm('Delete this employee?')) { await adminApi.deleteEmployee(id); loadData(); }
  };

  const handleDeleteClient = async (id) => {
    if (confirm('Delete this client?')) { await adminApi.deleteClient(id); loadData(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight capitalize">{activeTab.replace('-', ' ')}</h1>
          <p className="text-slate-400 mt-1">Manage and monitor field operations</p>
        </div>
      </div>

      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 border border-slate-800 bg-slate-900/50 rounded-2xl p-6 h-fit sticky top-24">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><PlusCircle size={20} className="text-indigo-500"/> Assign Work</h3>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Employee</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500" value={newTask.employeeId} onChange={e => setNewTask({...newTask, employeeId: e.target.value})} required>
                    <option value="">Choose Employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.user?.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Client</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500" value={newTask.clientId} onChange={e => setNewTask({...newTask, clientId: e.target.value})} required>
                    <option value="">Choose Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.user?.name}</option>)}
                  </select>
                </div>
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white" placeholder="Task Title" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
                <textarea rows="3" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white" placeholder="Instructions" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} required />
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                  <PlusCircle size={18} /> Assign Task
                </button>
              </form>
           </div>
           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2"><LayoutDashboard size={22} className="text-indigo-400"/> Task Board</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map(t => <TaskCard key={t.id} task={t} />)}
                {tasks.length === 0 && <div className="py-20 text-center border border-dashed border-slate-800 rounded-3xl text-slate-500">No active tasks.</div>}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 border border-slate-800 bg-slate-900/50 rounded-2xl p-6 h-fit">
             <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">Onboard Employee</h3>
             <form onSubmit={handleCreateEmployee} className="space-y-4">
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white" placeholder="Full Name" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} required />
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white" placeholder="Email" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} required />
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white" type="password" placeholder="Password" value={newEmployee.password} onChange={e => setNewEmployee({...newEmployee, password: e.target.value})} required />
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white" placeholder="Phone" value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})} required />
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl">Add Employee</button>
             </form>
           </div>
           <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map(e => (
                <div key={e.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center font-bold text-indigo-400 uppercase">{e.user?.name?.[0]}</div>
                    <div>
                      <h4 className="font-bold text-white">{e.user?.name}</h4>
                      <p className="text-xs text-slate-500">{e.user?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteEmployee(e.id)} className="p-2 text-slate-500 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'map' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
             <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Monitor Fleet</label>
                <select className="bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-4 py-2 focus:border-indigo-500" value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)}>
                  <option value="">All active employees</option>
                  {activeLocations.map(loc => <option key={loc.employee?.id} value={loc.employee?.id}>{loc.employee?.user?.name}</option>)}
                </select>
             </div>
             <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Focus Client</label>
                <select className="bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-4 py-2 focus:border-indigo-500" value={selectedClientId} onChange={e => { setSelectedClientId(e.target.value); setSelectedEmployeeId(''); }}>
                  <option value="">Choose Client</option>
                  {clients.concat(staticClients).map(c => <option key={c.id} value={c.id}>{c.user?.name || c.name}</option>)}
                </select>
             </div>
             <div className="flex items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Employee</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Client (Near)</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Client (Far)</div>
             </div>
          </div>

          <div className="h-[70vh] rounded-[2.5rem] overflow-hidden border border-slate-800 relative shadow-2xl">
            <MapContainer center={[11.9416, 79.8083]} zoom={13} className="h-full w-full z-10">
              <ChangeMapView />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              {activeLocations.map(loc => (
                <React.Fragment key={loc.id}>
                  <Marker position={[loc.latitude, loc.longitude]} icon={employeeIcon}>
                    <Popup>
                      <div className="p-1">
                        <h4 className="font-bold text-indigo-900">{loc.employee?.user?.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{new Date(loc.clockInTime).toLocaleTimeString()}</p>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle center={[loc.latitude, loc.longitude]} radius={500} pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.1 }} />
                </React.Fragment>
              ))}

              {clients.concat(staticClients).map(client => (
                <Marker key={client.id} position={[client.latitude, client.longitude]} icon={getClientIcon(client)}>
                  <Popup>
                    <div className="p-1">
                      <h4 className="font-bold text-slate-900">{client.user?.name || client.name}</h4>
                      <p className="text-xs text-slate-500">{client.address || 'Field Site'}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 border border-slate-800 bg-slate-900/50 rounded-2xl p-6 h-fit">
             <h3 className="text-lg font-semibold mb-6">Onboard Client</h3>
             <form onSubmit={handleCreateClient} className="space-y-4">
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white" placeholder="Client Name" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} required />
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white" placeholder="Email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} required />
                <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white" type="password" placeholder="Password" value={newClient.password} onChange={e => setNewClient({...newClient, password: e.target.value})} required />
                <motion.button whileHover={{ scale: 1.02 }} whileActive={{ scale: 0.98 }} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all">Add Client</motion.button>
             </form>
           </div>
           <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.map(c => (
                <div key={c.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center font-bold text-emerald-400 capitalize">{c.user?.name?.[0]}</div>
                    <div>
                      <h4 className="font-bold text-white">{c.user?.name}</h4>
                      <p className="text-xs text-slate-500">{c.user?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteClient(c.id)} className="p-2 text-slate-500 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Employee</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Clock In</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Clock Out</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {attendance.map(a => (
                <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-200">{a.employee?.user?.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{a.clockInTime ? new Date(a.clockInTime).toLocaleString() : 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-slate-400">{a.clockOutTime ? new Date(a.clockOutTime).toLocaleString() : <span className="text-emerald-400 font-semibold italic text-xs tracking-widest uppercase">Active</span>}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-mono tracking-tight">{a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
