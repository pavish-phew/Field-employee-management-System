import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { UserPlus, Users, Briefcase, PlusCircle, Trash2, LayoutDashboard, History } from 'lucide-react';
import TaskCard from '../components/TaskCard';

const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  
  // Forms
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: 'emp123', phone: '' });
  const [newClient, setNewClient] = useState({ name: '', email: '', contactPerson: '', address: '', phone: '' });
  const [newTask, setNewTask] = useState({ employeeId: '', clientId: '', title: '', description: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const empsData = await adminApi.getEmployees(); setEmployees(empsData.data);
      const clsData = await adminApi.getClients(); setClients(clsData.data);
      const tasksData = await adminApi.getAllTasks(); setTasks(tasksData.data);
    } catch (e) { console.error('Error loading admin data', e); }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    await adminApi.createEmployee(newEmployee);
    setNewEmployee({ name: '', email: '', password: 'emp123', phone: '' });
    loadData();
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    await adminApi.createClient(newClient);
    setNewClient({ name: '', email: '', contactPerson: '', address: '', phone: '' });
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
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar card glass">
        <h2 className="sidebar-brand">FEMS Admin</h2>
        <nav className="sidebar-nav">
          <button className={`nav-link ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <LayoutDashboard size={20}/> <span>Tasks Hub</span>
          </button>
          <button className={`nav-link ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>
            <Users size={20}/> <span>Employees</span>
          </button>
          <button className={`nav-link ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>
            <Briefcase size={20}/> <span>Clients</span>
          </button>
        </nav>
      </aside>

      <main className="dashboard-main">
        {activeTab === 'tasks' && (
          <div className="tab-pane">
            <header className="pane-header">
              <h1>Field Operations Hub</h1>
              <p className="subtitle">Assign and monitor work in real-time</p>
            </header>

            <div className="dashboard-grid">
              <section className="card card-filled">
                <div className="section-header">
                  <PlusCircle size={22} className="icon-primary" />
                  <h3>Assign New Task</h3>
                </div>
                <form onSubmit={handleCreateTask} className="task-form">
                  <div className="form-group mb-3">
                    <label>Employee</label>
                    <select className="input-field" value={newTask.employeeId} onChange={e => setNewTask({...newTask, employeeId: e.target.value})} required>
                      <option value="">Select Employee</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.designation})</option>)}
                    </select>
                  </div>
                  <div className="form-group mb-3">
                    <label>Client Destination</label>
                    <select className="input-field" value={newTask.clientId} onChange={e => setNewTask({...newTask, clientId: e.target.value})} required>
                      <option value="">Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group mb-3">
                    <label>Task Title</label>
                    <input className="input-field" placeholder="Brief objective" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
                  </div>
                  <div className="form-group mb-3">
                    <label>Operational Instructions</label>
                    <textarea className="input-field" placeholder="Provide detailed instructions..." rows="4" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} required />
                  </div>
                  <button type="submit" className="btn btn-primary btn-block">
                    <PlusCircle size={20}/> <span>Assign Field Task</span>
                  </button>
                </form>
              </section>

              <section className="span-2">
                <div className="section-header">
                  <History size={22} className="icon-primary" />
                  <h3>Task Inventory</h3>
                </div>
                <div className="tasks-grid">
                  {tasks.length > 0 ? tasks.map(t => (
                    <TaskCard key={t.id} task={t} />
                  )) : <div className="empty-state">No tasks assigned yet.</div>}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="tab-pane">
            <header className="pane-header">
              <h1>Employee Directory</h1>
              <p className="subtitle">Manage your field team</p>
            </header>
            <div className="dashboard-grid">
              <section className="card card-filled">
                <h3>Add New Team Member</h3>
                <form onSubmit={handleCreateEmployee} className="mt-4">
                  <input className="input-field mb-3" placeholder="Full Name" value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} required />
                  <input className="input-field mb-3" placeholder="Email Address" value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} required />
                  <input className="input-field mb-3" placeholder="Set Temporary Password" type="password" value={newEmployee.password} onChange={e => setNewEmployee({...newEmployee, password: e.target.value})} required />
                  <input className="input-field mb-3" placeholder="Phone Number" value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})} required />
                  <button className="btn btn-primary btn-block"><UserPlus size={20}/> <span>Onboard Employee</span></button>
                </form>
              </section>
              <section className="span-2">
                <div className="card-list">
                  {employees.map(e => (
                    <div key={e.id} className="card glass employee-row">
                      <div className="row-content">
                        <div className="avatar-placeholder">{e.user?.name[0]}</div>
                        <div className="row-details">
                          <h4>{e.user?.name}</h4>
                          <p className="text-info">{e.user?.email}</p>
                        </div>
                      </div>
                      <button className="btn btn-danger-ghost" onClick={() => handleDeleteEmployee(e.id)}><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="tab-pane">
            <header className="pane-header">
              <h1>Client Portfolio</h1>
              <p className="subtitle">Destinations and contacts for field visits</p>
            </header>
            <div className="dashboard-grid">
              <section className="card card-filled">
                <h3>Register New Client</h3>
                <form onSubmit={handleCreateClient} className="mt-4">
                  <input className="input-field mb-3" placeholder="Company Name" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} required />
                  <input className="input-field mb-3" placeholder="Corporate Email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} required />
                  <input className="input-field mb-3" placeholder="Primary Contact" value={newClient.contactPerson} onChange={e => setNewClient({...newClient, contactPerson: e.target.value})} required />
                  <input className="input-field mb-3" placeholder="Office Address" value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} required />
                  <input className="input-field mb-3" placeholder="Contact Phone" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} required />
                  <button className="btn btn-primary btn-block"><PlusCircle size={20}/> <span>Register Client</span></button>
                </form>
              </section>
              <section className="span-2">
                <div className="card-list">
                  {clients.map(c => (
                    <div key={c.id} className="card glass employee-row">
                      <div className="row-details">
                        <h4>{c.name}</h4>
                        <p className="text-subtle">{c.address}</p>
                        <p className="text-info"><b>Contact:</b> {c.contactPerson} • {c.phone}</p>
                      </div>
                      <button className="btn btn-danger-ghost" onClick={() => handleDeleteClient(c.id)}><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
