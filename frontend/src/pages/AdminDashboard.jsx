import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { adminApi, attendanceApi } from '../services/api';
import { 
  Users, Briefcase, LayoutDashboard, History, Map as MapIcon, 
  PlusCircle, Trash2
} from 'lucide-react';
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
  const [newClient, setNewClient] = useState({ name: '', email: '', password: 'client123', contactPerson: '', address: '', phone: '' });
  const [newTask, setNewTask] = useState({ employeeId: '', clientId: '', title: '', description: '' });

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tasks' || activeTab === 'employees') {
        const empsData = await adminApi.getEmployees(); 
        setEmployees(empsData.data);
      }
      if (activeTab === 'tasks' || activeTab === 'clients') {
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
       }, 10000);
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
    setNewClient({ name: '', email: '', password: 'client123', contactPerson: '', address: '', phone: '' });
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

      {/* Tabs handled by Layout/App.jsx mostly, but we can have sub-tabs or direct rendering here */}
      
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 border border-slate-800 bg-slate-900/50 rounded-2xl p-6 h-fit sticky top-24">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><PlusCircle size={20} className="text-indigo-500"/> Assign Work</h3>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Employee</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" value={newTask.employeeId} onChange={e => setNewTask({...newTask, employeeId: e.target.value})} required>
                    <option value="">Choose Employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.user?.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Client</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" value={newTask.clientId} onChange={e => setNewTask({...newTask, clientId: e.target.value})} required>
                    <option value="">Choose Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.user?.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Task Title</label>
                  <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Instructions</label>
                  <textarea rows="3" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} required />
                </div>
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
                {tasks.length === 0 && <div className="col-span-2 py-20 text-center border border-dashed border-slate-800 rounded-3xl text-slate-500">No active tasks found.</div>}
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
                <button type="submit" className="btn btn-primary btn-block">Add Employee</button>
             </form>
           </div>
           <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map(e => (
                <div key={e.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center font-bold text-indigo-400 uppercase">{e.user?.name?.[0]}</div>
                    <div>
                      <h4 className="font-bold">{e.user?.name}</h4>
                      <p className="text-sm text-slate-500">{e.user?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteEmployee(e.id)} className="p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'map' && (
        <div className="h-[70vh] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
          <MapContainer center={[20, 78]} zoom={5} className="h-full w-full z-10">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {activeLocations.map(loc => (
              <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
                <Popup>
                  <div className="p-1">
                    <h4 className="font-bold text-indigo-900">{loc.employee?.user?.name}</h4>
                    <p className="text-xs text-slate-600 mt-1">Status: <b>On Duty</b></p>
                    <p className="text-xs text-slate-400 mt-0.5">Last update: {new Date(loc.clockInTime).toLocaleTimeString()}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur p-4 rounded-2xl border border-slate-800 shadow-xl max-w-xs">
             <h4 className="text-sm font-bold flex items-center gap-2 mb-3">Live Fleet ({activeLocations.length})</h4>
             <div className="space-y-2 overflow-y-auto max-h-40 pr-2 custom-scrollbar">
                {activeLocations.map(loc => (
                  <div key={loc.id} className="flex items-center justify-between text-xs p-2 bg-slate-950/50 rounded-lg">
                    <span>{loc.employee?.user?.name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                ))}
             </div>
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
                  <td className="px-6 py-4">
                    <div className="font-bold">{a.employee?.user?.name}</div>
                    <div className="text-xs text-slate-500">{a.employee?.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {a.clockInTime ? new Date(a.clockInTime).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {a.clockOutTime ? new Date(a.clockOutTime).toLocaleString() : <span className="text-emerald-400 font-semibold italic">Ongoing...</span>}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {a.latitude ? a.latitude.toFixed(4) : '0'}, {a.longitude ? a.longitude.toFixed(4) : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {attendance.length === 0 && <div className="py-20 text-center text-slate-500">No attendance records found.</div>}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
